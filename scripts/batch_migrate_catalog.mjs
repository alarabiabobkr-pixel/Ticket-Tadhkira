#!/usr/bin/env node
/**
 * Multi-Channel Parallel Byse -> Telegram HLS Batch Migrator
 *
 * Scans all movies & series episodes in public/catalog.json, inspects native Byse bitrates,
 * verifies bot posting permissions per channel, and runs ALL channels concurrently:
 *   - Fast Stream-Copy (no ffmpeg CPU) when native bitrate <= 1550 kbps (~2-3 min/movie)
 *   - Smart 720p HD Compression (-preset superfast) only when native bitrate > 1550 kbps
 *
 * Usage:
 *   node scripts/batch_migrate_catalog.mjs [--only=movies|all] [--max-minutes=0] [--limit=0] [--ffmpeg-workers=1]
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { generateAndUploadThumbnailsForManifest } from './lib_tg_thumbs.mjs';

const execFileAsync = promisify(execFile);

function loadLocalEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return {};
    const out = {};
    for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      out[key] = val;
      if (!process.env[key]) process.env[key] = val;
    }
    return out;
  } catch (_) {
    return {};
  }
}

function resolveTelegramBotToken() {
  const isValid = (v) => typeof v === 'string' && /^\d+:[A-Za-z0-9_-]{20,}$/.test(v.trim());
  if (isValid(process.env.TELEGRAM_BOT_TOKEN)) return process.env.TELEGRAM_BOT_TOKEN.trim();
  const parsed = loadLocalEnvFile();
  if (isValid(parsed.TELEGRAM_BOT_TOKEN)) return parsed.TELEGRAM_BOT_TOKEN.trim();
  return null;
}

const BOT_TOKEN = resolveTelegramBotToken();
const CHANNEL_MAP = {
  movies_default: process.env.TG_CH_MOVIES || '-1004389672836',       // افلام اجنبيه (+ باقي الافلام)
  anime_movies: process.env.TG_CH_ANIME_MOVIES || '-1004431929473', // افلام انمي
  series_arabic: process.env.TG_CH_SERIES_AR || '-1004401107496',   // مسلسل عربيه
  series_anime: process.env.TG_CH_SERIES_ANIME || '-1003808292795', // مسلسلات انمي
  series_yemeni: process.env.TG_CH_SERIES_YE || '-1004438628400',   // مسلسلات يمنيه
  series_turkish: process.env.TG_CH_SERIES_TR || '-1004309457395',  // مسلسلات تركيه
};

const BYSE_MIRRORS = ['bysezejataos.com', 'bysebuho.com', 'bysevepoin.com'];
const TG_DIR = path.join(process.cwd(), 'public', 'tg_hls');
const TMP_DIR = '/tmp/tg_batch_work';
const PID_FILE = '/tmp/tg_batch_migrator.pid';
const FAST_COPY_MAX_KBPS = 1550;
const CHUNK_MAX_BYTES = 14 * 1024 * 1024;

let SKIP_CATALOG_SYNC = false;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function writeFileAtomic(filePath, content) {
  const tmpPath = `${filePath}.tmp.${process.pid}`;
  fs.writeFileSync(tmpPath, content, 'utf8');
  fs.renameSync(tmpPath, filePath);
}

function acquireSingleInstanceLock() {
  if (fs.existsSync(PID_FILE)) {
    const oldPid = Number(fs.readFileSync(PID_FILE, 'utf8').trim());
    if (oldPid && oldPid !== process.pid) {
      try {
        process.kill(oldPid, 0);
        console.log(`Batch migrator already running (PID ${oldPid}). Exiting duplicate.`);
        process.exit(0);
      } catch (_) {}
    }
  }
  fs.writeFileSync(PID_FILE, String(process.pid), 'utf8');
  const cleanup = () => {
    try {
      if (fs.existsSync(PID_FILE) && Number(fs.readFileSync(PID_FILE, 'utf8').trim()) === process.pid) {
        fs.unlinkSync(PID_FILE);
      }
    } catch (_) {}
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('SIGTERM', () => { cleanup(); process.exit(0); });
}

function createSemaphore(maxConcurrent) {
  let active = 0;
  const waiters = [];
  return {
    async acquire() {
      if (active < maxConcurrent) {
        active++;
        return;
      }
      await new Promise((resolve) => waiters.push(resolve));
      active++;
    },
    release() {
      active = Math.max(0, active - 1);
      if (waiters.length) waiters.shift()();
    },
  };
}

function parseArgs() {
  const cpuDefault = Math.max(1, Math.min(2, os.cpus().length >= 4 ? 2 : 1));
  const args = {
    limit: 0,
    maxMinutes: 0,
    only: 'movies',
    forceCode: '',
    forceCodes: [],
    forceChannel: '',
    channelKeys: [],
    skipCatalogSync: false,
    syncOnly: false,
    fastOnly: false,
    ffmpegWorkers: cpuDefault,
  };
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--limit=')) args.limit = Number(arg.split('=')[1]) || 0;
    else if (arg.startsWith('--max-minutes=')) args.maxMinutes = Number(arg.split('=')[1]) || 0;
    else if (arg.startsWith('--only=')) args.only = arg.split('=')[1].trim();
    else if (arg.startsWith('--code=')) args.forceCode = arg.split('=')[1].trim();
    else if (arg.startsWith('--codes=')) {
      args.forceCodes = arg.split('=')[1].split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg.startsWith('--channel=')) args.forceChannel = arg.split('=')[1].trim();
    else if (arg.startsWith('--channel-key=')) {
      args.channelKeys = arg.split('=')[1].split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg === '--skip-catalog-sync') args.skipCatalogSync = true;
    else if (arg === '--sync-only') args.syncOnly = true;
    else if (arg === '--fast-only') args.fastOnly = true;
    else if (arg.startsWith('--ffmpeg-workers=')) {
      args.ffmpegWorkers = Math.max(1, Number(arg.split('=')[1]) || cpuDefault);
    }
  }
  return args;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 45000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function checkWritableChannels() {
  const meResp = await fetchWithTimeout(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`, {}, 15000);
  const meData = await meResp.json();
  if (!meData.ok || !meData.result?.id) throw new Error('Bot getMe failed');
  const botId = meData.result.id;

  const writable = new Set();
  const uniqueIds = [...new Set(Object.values(CHANNEL_MAP))];
  for (const chatId of uniqueIds) {
    try {
      const [chatJson, memberJson] = await Promise.all([
        fetchWithTimeout(`https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=${chatId}`, {}, 15000).then((r) => r.json()),
        fetchWithTimeout(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${chatId}&user_id=${botId}`, {}, 15000).then((r) => r.json()),
      ]);
      const title = chatJson.result?.title || chatId;
      const canPost =
        memberJson.ok &&
        memberJson.result?.status === 'administrator' &&
        memberJson.result?.can_post_messages === true;
      if (canPost) {
        writable.add(chatId);
        console.log(`  [Channel OK] ${title} (${chatId})`);
      } else {
        console.warn(`  [Channel SKIPPED - missing Post Messages perm] ${title} (${chatId})`);
      }
    } catch (err) {
      console.warn(`  [Channel ERROR] ${chatId}: ${err.message}`);
    }
  }
  return writable;
}

function b64u(str) {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

function decryptBysePlayback(playback) {
  const iv = b64u(playback.iv);
  const raw = b64u(playback.payload);
  const tag = raw.subarray(raw.length - 16);
  const enc = raw.subarray(0, raw.length - 16);
  const parts = playback.key_parts || [];

  const tryKey = (keyBuf) => {
    const d = crypto.createDecipheriv('aes-256-gcm', keyBuf, iv);
    d.setAuthTag(tag);
    return JSON.parse(Buffer.concat([d.update(enc), d.final()]).toString('utf8'));
  };

  const n = Number(playback.version);
  if (Number.isInteger(n) && n >= 1 && n <= 20 && parts[n - 1] && parts[31 - n - 1]) {
    try {
      return tryKey(Buffer.concat([b64u(parts[n - 1]), b64u(parts[31 - n - 1])]));
    } catch (_) {}
  }
  const p16 = parts.map(b64u).filter((b) => b.length === 16);
  for (let i = 0; i < p16.length; i++) {
    for (let j = 0; j < p16.length; j++) {
      if (i === j) continue;
      try {
        return tryKey(Buffer.concat([p16[i], p16[j]]));
      } catch (_) {}
    }
  }
  throw new Error('Failed to decrypt Byse playback payload');
}

async function fetchBysePlaylist(code) {
  let lastErr = null;
  for (const host of BYSE_MIRRORS) {
    try {
      const metaResp = await fetchWithTimeout(
        `https://${host}/api/videos/${code}`,
        { headers: { 'User-Agent': 'Mozilla/5.0', Referer: `https://${host}/e/${code}` } },
        20000
      );
      if (!metaResp.ok) throw new Error(`HTTP ${metaResp.status}`);
      const meta = await metaResp.json();
      if (!meta.playback) throw new Error('No playback object');
      const decoded = decryptBysePlayback(meta.playback);
      const sources = decoded.sources || [];
      if (!sources.length) throw new Error('No sources returned');

      const chosen =
        sources.find((s) => s.height === 720) ||
        sources.find((s) => s.height === 1080) ||
        sources[0];

      const masterUrl = chosen.url;
      const masterText = await (
        await fetchWithTimeout(
          masterUrl,
          { headers: { 'User-Agent': 'Mozilla/5.0', Referer: `https://${host}/` } },
          20000
        )
      ).text();

      const bwMatch = masterText.match(/BANDWIDTH=(\d+)/);
      const kbps = bwMatch ? Math.round(Number(bwMatch[1]) / 1000) : 1400;

      let mediaPlaylistUrl = masterUrl;
      for (const rawLine of masterText.split(/\r?\n/)) {
        const trimmed = rawLine.trim();
        if (trimmed && !trimmed.startsWith('#') && !trimmed.includes('iframes')) {
          mediaPlaylistUrl = new URL(trimmed, masterUrl).toString();
          break;
        }
      }

      const subText = await (
        await fetchWithTimeout(
          mediaPlaylistUrl,
          { headers: { 'User-Agent': 'Mozilla/5.0', Referer: `https://${host}/` } },
          20000
        )
      ).text();

      const segments = [];
      let pendingDur = 10;
      for (const rawLine of subText.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) continue;
        if (line.startsWith('#EXTINF:')) {
          pendingDur = parseFloat(line.slice(8).split(',')[0]) || 10;
        } else if (!line.startsWith('#')) {
          segments.push({ duration: pendingDur, url: new URL(line, mediaPlaylistUrl).toString() });
        }
      }

      return {
        host,
        title: meta.title || code,
        durationSeconds: meta.duration_seconds || 0,
        kbps,
        fetchedAt: Date.now(),
        segments,
      };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error(`Could not resolve Byse video ${code}`);
}

async function fetchSegmentBytes(url, refererHost, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const resp = await fetchWithTimeout(
        url,
        { headers: { 'User-Agent': 'Mozilla/5.0', Referer: `https://${refererHost}/` } },
        35000
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return Buffer.from(await resp.arrayBuffer());
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(700 * attempt);
    }
  }
}

async function uploadChunkToTelegram(chatId, buffer, filename, caption = '') {
  const endpoint = `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;
  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      const form = new FormData();
      form.append('chat_id', chatId);
      form.append('disable_notification', 'true');
      if (caption) form.append('caption', caption);
      form.append('document', new Blob([buffer], { type: 'video/mp2t' }), filename);

      const resp = await fetchWithTimeout(endpoint, { method: 'POST', body: form }, 45000);
      const data = await resp.json();
      if (data.ok && data.result) {
        const doc = data.result.document || data.result.video;
        if (!doc || !doc.file_id) throw new Error('Missing file_id from Telegram');
        return {
          fileId: doc.file_id,
          msgId: data.result.message_id,
          fileSize: doc.file_size || buffer.length,
        };
      }
      if (data.error_code === 429 && data.parameters?.retry_after) {
        const waitSec = Number(data.parameters.retry_after) + 1;
        console.log(`  [Rate Limit ${chatId}] Waiting ${waitSec}s...`);
        await sleep(waitSec * 1000);
        continue;
      }
      throw new Error(`Telegram upload error: ${JSON.stringify(data)}`);
    } catch (err) {
      if (attempt >= 8) throw err;
      await sleep(1200 * attempt);
    }
  }
  throw new Error(`Exceeded retries for ${filename}`);
}

function patchCatalogWithTgCode(_byseCode, _outCode) {
  if (SKIP_CATALOG_SYNC) return 0;
  return syncAllCompletedManifestsToCatalog();
}

function syncAllCompletedManifestsToCatalog() {
  if (!fs.existsSync(TG_DIR)) return 0;
  const root = process.cwd();
  const codeMap720 = new Map();
  const codeMap480 = new Map();
  for (const fname of fs.readdirSync(TG_DIR)) {
    if (!fname.endsWith('.json')) continue;
    try {
      const m = JSON.parse(fs.readFileSync(path.join(TG_DIR, fname), 'utf8'));
      if (!m || !m.complete) continue;
      const outCode = fname.replace(/\.json$/, '');
      const byseCode = m.parentCode || m.byseCode || outCode.replace(/_480p$/, '');
      if (!byseCode) continue;
      if (outCode.endsWith('_480p')) codeMap480.set(byseCode, outCode);
      else codeMap720.set(byseCode, outCode);
    } catch (_) {}
  }
  if (!codeMap720.size && !codeMap480.size) return 0;

  let syncedCount = 0;
  const patchObj = (obj) => {
    if (!obj || typeof obj !== 'object') return false;
    let changed = false;
    const url = [obj.byseUrl, obj.embedUrl, obj.streamUrl].find((x) => typeof x === 'string' && x.includes('/e/'));
    if (url) {
      const match = url.match(/\/e\/([a-zA-Z0-9_-]+)/);
      const bCode = match ? match[1] : '';
      if (bCode) {
        const tg720 = codeMap720.get(bCode);
        const tg480 = codeMap480.get(bCode);
        if (tg720 && obj.tgCode !== tg720) {
          obj.tgCode = tg720;
          changed = true;
          syncedCount++;
        }
        if (tg480 && obj.tgCode480 !== tg480) {
          obj.tgCode480 = tg480;
          changed = true;
        }
      }
    }
    if (Array.isArray(obj.episodes)) {
      for (const ep of obj.episodes) {
        if (patchObj(ep)) changed = true;
      }
    }
    return changed;
  };

  let anyFileChanged = false;
  for (const rel of ['public/catalog.json', 'public/curated_catalog.json']) {
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) continue;
    const arr = JSON.parse(fs.readFileSync(full, 'utf8'));
    let changed = false;
    for (const item of arr) {
      if (patchObj(item)) changed = true;
    }
    if (changed) {
      writeFileAtomic(full, JSON.stringify(arr));
      anyFileChanged = true;
    }
  }
  if (anyFileChanged) {
    const curatedPath = path.join(root, 'public/curated_catalog.json');
    const jsPath = path.join(root, 'public/catalog.js');
    if (fs.existsSync(curatedPath) && fs.existsSync(jsPath)) {
      writeFileAtomic(jsPath, `window.CURATED_CATALOG = ${fs.readFileSync(curatedPath, 'utf8')};`);
    }
  }
  return syncedCount;
}

function extractByseCode(obj) {
  for (const field of [obj.byseUrl, obj.embedUrl, obj.streamUrl]) {
    if (typeof field === 'string') {
      const m = field.match(/\/e\/([a-zA-Z0-9_-]+)/);
      if (m) return m[1];
    }
  }
  return '';
}

function pickTargetChannel(item, isSeries) {
  const cat = String(item.category || '').toLowerCase();
  const origin = String(item.origin || '').toLowerCase();
  if (!isSeries) {
    if (cat === 'anime' || origin === 'anime') return CHANNEL_MAP.anime_movies;
    return CHANNEL_MAP.movies_default;
  }
  if (origin === 'turkish') return CHANNEL_MAP.series_turkish;
  if (origin === 'yemeni') return CHANNEL_MAP.series_yemeni;
  if (cat === 'anime' || origin === 'anime') return CHANNEL_MAP.series_anime;
  return CHANNEL_MAP.series_arabic;
}

function getCompletedManifestCodeSet() {
  const done = new Set();
  if (!fs.existsSync(TG_DIR)) return done;
  for (const fname of fs.readdirSync(TG_DIR)) {
    if (!fname.endsWith('.json')) continue;
    try {
      const m = JSON.parse(fs.readFileSync(path.join(TG_DIR, fname), 'utf8'));
      if (m && m.complete) {
        const code = m.parentCode || m.byseCode || fname.replace(/\.json$/, '');
        if (code) done.add(code);
      }
    } catch (_) {}
  }
  return done;
}

function collectPendingByChannel(only = 'movies', writableChannels, allowedChannels = null) {
  const catalog = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/catalog.json'), 'utf8'));
  const completedManifests = getCompletedManifestCodeSet();
  const byChannel = new Map();
  const seenCodes = new Set();

  const pushJob = (channelId, job) => {
    if (writableChannels && !writableChannels.has(channelId)) return;
    if (allowedChannels && allowedChannels.size > 0 && !allowedChannels.has(channelId)) return;
    if (!byChannel.has(channelId)) byChannel.set(channelId, []);
    byChannel.get(channelId).push(job);
  };

  for (const item of catalog) {
    if (item.category === 'live' || item.type === 'live') continue;
    const isSeries = item.type === 'series' || item.category === 'series' || Array.isArray(item.episodes);
    const channelId = pickTargetChannel(item, isSeries);

    if (!isSeries) {
      const code = extractByseCode(item);
      if (code && !seenCodes.has(code) && !item.tgCode && !item.tgCode480 && !completedManifests.has(code)) {
        seenCodes.add(code);
        pushJob(channelId, { code, title: item.title, channelId });
      }
    } else if (only === 'all' && Array.isArray(item.episodes)) {
      for (const ep of item.episodes) {
        const code = extractByseCode(ep);
        if (code && !seenCodes.has(code) && !ep.tgCode && !ep.tgCode480 && !completedManifests.has(code)) {
          seenCodes.add(code);
          pushJob(channelId, { code, title: `${item.title} - ${ep.title || ep.episodeNum}`, channelId });
        }
      }
    }
  }
  return byChannel;
}

async function migrateFastCopy(code, chatId, playlist, deadlineMs) {
  const manifestPath = path.join(TG_DIR, `${code}.json`);
  const totalRaw = playlist.segments.length;
  let manifest = {
    byseCode: code,
    channelId: chatId,
    quality: '720p-direct',
    title: playlist.title,
    durationSeconds: playlist.durationSeconds,
    rawSegmentCount: totalRaw,
    targetDuration: 45,
    complete: false,
    nextRawIndex: 0,
    totalBytes: 0,
    segments: [],
  };

  if (fs.existsSync(manifestPath)) {
    try {
      const ex = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (ex && Array.isArray(ex.segments)) manifest = ex;
    } catch (_) {}
  }

  const targetChatId = manifest.channelId || chatId;
  manifest.channelId = targetChatId;

  let rawIdx = manifest.nextRawIndex || 0;
  let carry = null;
  let seqIndex = manifest.segments.length;

  const buildNextChunk = async () => {
    if (rawIdx >= totalRaw && !carry) return null;
    if (Date.now() - playlist.fetchedAt > 8 * 60 * 1000) {
      playlist = await fetchBysePlaylist(code);
    }

    const myChunkIdx = seqIndex++;
    const isFastStart = myChunkIdx < 2;
    const targetBytes = isFastStart ? 1 : 6 * 1024 * 1024;
    const parts = [];
    let bytes = 0;
    let dur = 0;

    if (carry) {
      parts.push(carry.buf);
      bytes += carry.buf.length;
      dur += carry.dur;
      carry = null;
    }

    while (rawIdx < totalRaw) {
      const targetIndices = [];
      const batchSize = isFastStart ? 1 : 4;
      for (let k = 0; k < batchSize && rawIdx + k < totalRaw; k++) {
        targetIndices.push(rawIdx + k);
      }
      const fetched = await Promise.all(
        targetIndices.map(async (idx) => ({
          idx,
          dur: playlist.segments[idx].duration || 10,
          buf: await fetchSegmentBytes(playlist.segments[idx].url, playlist.host),
        }))
      );
      let broke = false;
      for (const seg of fetched) {
        if (parts.length > 0 && bytes + seg.buf.length > CHUNK_MAX_BYTES) {
          carry = { buf: seg.buf, dur: seg.dur };
          rawIdx = seg.idx + 1;
          broke = true;
          break;
        }
        parts.push(seg.buf);
        bytes += seg.buf.length;
        dur += seg.dur;
        rawIdx = seg.idx + 1;
        if (isFastStart || bytes >= targetBytes || dur >= 42) {
          broke = true;
          break;
        }
      }
      if (broke) break;
    }

    return {
      chunkIndex: myChunkIdx,
      dur,
      merged: Buffer.concat(parts),
      nextRawCommitted: carry ? rawIdx - 1 : rawIdx,
      isLast: rawIdx >= totalRaw && !carry,
    };
  };

  let nextChunkPromise = buildNextChunk();
  try {
    while (nextChunkPromise && (!deadlineMs || Date.now() < deadlineMs)) {
      const chunk = await nextChunkPromise;
      nextChunkPromise = null;
      if (!chunk) break;

      const shouldPrefetch = !chunk.isLast && (!deadlineMs || Date.now() + 2500 < deadlineMs);
      nextChunkPromise = shouldPrefetch ? buildNextChunk() : null;

      const tgRes = await uploadChunkToTelegram(
        targetChatId,
        chunk.merged,
        `${code}_c${String(chunk.chunkIndex).padStart(4, '0')}.ts`,
        chunk.chunkIndex === 0 ? `🎬 ${playlist.title} | Direct HD (${playlist.kbps}kbps)` : ''
      );
      manifest.segments.push({
        index: chunk.chunkIndex,
        duration: Number(chunk.dur.toFixed(3)),
        bytes: chunk.merged.length,
        fileId: tgRes.fileId,
        msgId: tgRes.msgId,
      });
      manifest.nextRawIndex = chunk.nextRawCommitted;
      manifest.totalBytes += chunk.merged.length;
      manifest.targetDuration = Math.max(manifest.targetDuration || 45, Math.ceil(chunk.dur));
      manifest.complete = manifest.nextRawIndex >= totalRaw && chunk.isLast;
      writeFileAtomic(manifestPath, JSON.stringify(manifest, null, 2));

      const pct = ((manifest.nextRawIndex / totalRaw) * 100).toFixed(1);
      console.log(`[${code} -> ${targetChatId} ${pct}%] fast-copy chunk ${chunk.chunkIndex} (${(chunk.merged.length / 1048576).toFixed(2)} MB)`);
      if (!manifest.complete) await sleep(350);
    }
  } finally {
    if (nextChunkPromise) {
      nextChunkPromise.catch(() => {});
    }
  }

  if (manifest.complete) {
    try {
      const th = await generateAndUploadThumbnailsForManifest({
        code,
        manifest,
        manifestPath,
        botToken: BOT_TOKEN,
        targetChatId,
      });
      if (!th.skipped) {
        console.log(`  [${code}] Generated ${th.count} seek thumbnails (${th.sheets} sheet(s), ${(th.totalBytes / 1024).toFixed(0)} KB)`);
      }
    } catch (err) {
      console.warn(`  [${code}] Thumbnail generation warning: ${err.message}`);
    }
    patchCatalogWithTgCode(code, code);
  }
  return manifest.complete;
}

function buildSmartGroups(segments, startRawIdx) {
  const groups = [];
  let idx = startRawIdx;
  while (idx < segments.length) {
    const isFirst = idx === 0;
    const targetDur = isFirst ? 21 : 58;
    const targetCount = isFirst ? 2 : 12;
    const rawIndices = [];
    let sumDur = 0;
    while (idx < segments.length) {
      rawIndices.push(idx);
      sumDur += segments[idx].duration || 10;
      idx++;
      if (sumDur >= targetDur || rawIndices.length >= targetCount) break;
    }
    groups.push({ rawIndices, isFirst });
  }
  return groups;
}

async function migrateSmart720p(code, chatId, playlist, deadlineMs, ffmpegSem) {
  const manifestPath = path.join(TG_DIR, `${code}.json`);
  const totalRaw = playlist.segments.length;
  let manifest = {
    byseCode: code,
    parentCode: code,
    channelId: chatId,
    quality: '720p-smart',
    title: `${playlist.title || code} (720p Smart HD)`,
    durationSeconds: playlist.durationSeconds || 0,
    rawSegmentCount: totalRaw,
    targetDuration: 34,
    complete: false,
    nextRawIndex: 0,
    totalBytes: 0,
    segments: [],
  };

  if (fs.existsSync(manifestPath)) {
    try {
      const ex = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (ex && Array.isArray(ex.segments)) manifest = ex;
    } catch (_) {}
  }

  const targetChatId = manifest.channelId || chatId;
  manifest.channelId = targetChatId;

  const videoTmpDir = path.join(TMP_DIR, code);
  fs.mkdirSync(videoTmpDir, { recursive: true });
  const groups = buildSmartGroups(playlist.segments, manifest.nextRawIndex || 0);
  if (!groups.length) {
    manifest.complete = true;
    writeFileAtomic(manifestPath, JSON.stringify(manifest, null, 2));
    patchCatalogWithTgCode(code, code);
    fs.rmSync(videoTmpDir, { recursive: true, force: true });
    return true;
  }

  const prepareGroupDir = async (gIdx) => {
    const grp = groups[gIdx];
    const dir = path.join(videoTmpDir, `g_${grp.rawIndices[0]}`);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });

    if (Date.now() - playlist.fetchedAt > 8 * 60 * 1000) {
      playlist = await fetchBysePlaylist(code);
    }
    const bufs = await Promise.all(
      grp.rawIndices.map((r) => fetchSegmentBytes(playlist.segments[r].url, playlist.host))
    );
    fs.writeFileSync(path.join(dir, 'in.ts'), Buffer.concat(bufs));
    return { dir, grp };
  };

  let nextPrepPromise = prepareGroupDir(0);
  let prevUploadPromise = Promise.resolve();

  try {
    for (let g = 0; g < groups.length; g++) {
      if (deadlineMs && Date.now() >= deadlineMs) break;
      const { dir, grp } = await nextPrepPromise;
      nextPrepPromise =
        g + 1 < groups.length && (!deadlineMs || Date.now() + 8000 < deadlineMs)
          ? prepareGroupDir(g + 1)
          : null;

      await ffmpegSem.acquire();
      if (deadlineMs && Date.now() >= deadlineMs) {
        ffmpegSem.release();
        fs.rmSync(dir, { recursive: true, force: true });
        break;
      }
      try {
        await execFileAsync(
          'ffmpeg',
          [
            '-nostdin',
            '-loglevel',
            'warning',
            '-y',
            '-copyts',
            '-i',
            path.join(dir, 'in.ts'),
            '-map',
            '0:v:0',
            '-map',
            '0:a:0?',
            '-vf',
            'scale=1280:-2:flags=fast_bilinear',
            '-c:v',
            'libx264',
            '-preset',
            'superfast',
            '-crf',
            '24',
            '-maxrate',
            '620k',
            '-bufsize',
            '1240k',
            '-g',
            '50',
            '-c:a',
            'aac',
            '-b:a',
            '64k',
            '-muxdelay',
            '0',
            '-f',
            'hls',
            '-hls_time',
            grp.isFirst ? '11' : '33',
            '-hls_list_size',
            '0',
            '-hls_segment_filename',
            path.join(dir, 'part_%03d.ts'),
            path.join(dir, 'out.m3u8'),
          ],
          { maxBuffer: 25 * 1024 * 1024 }
        );
      } finally {
        ffmpegSem.release();
      }

      const parts = [];
      let d = 20;
      for (const rawLine of fs.readFileSync(path.join(dir, 'out.m3u8'), 'utf8').split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) continue;
        if (line.startsWith('#EXTINF:')) d = parseFloat(line.slice(8).split(',')[0]) || 20;
        else if (!line.startsWith('#')) {
          parts.push({ duration: d, buf: fs.readFileSync(path.join(dir, line)) });
        }
      }
      fs.rmSync(dir, { recursive: true, force: true });

      const nextRawAfter = grp.rawIndices[grp.rawIndices.length - 1] + 1;
      prevUploadPromise = prevUploadPromise.then(async () => {
        for (const part of parts) {
          const chunkIdx = manifest.segments.length;
          const tgRes = await uploadChunkToTelegram(
            targetChatId,
            part.buf,
            `${code}_c${String(chunkIdx).padStart(4, '0')}.ts`,
            chunkIdx === 0 ? `🎬 ${playlist.title} | 720p HD ذكية` : ''
          );
          manifest.segments.push({
            index: chunkIdx,
            duration: Number(part.duration.toFixed(3)),
            bytes: part.buf.length,
            fileId: tgRes.fileId,
            msgId: tgRes.msgId,
          });
          manifest.totalBytes += part.buf.length;
          manifest.targetDuration = Math.max(manifest.targetDuration || 34, Math.ceil(part.duration));
          await sleep(300);
        }

        manifest.nextRawIndex = nextRawAfter;
        manifest.complete = manifest.nextRawIndex >= totalRaw;
        writeFileAtomic(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(
          `[${code} -> ${targetChatId} ${((manifest.nextRawIndex / totalRaw) * 100).toFixed(1)}%] smart-720p chunks=${manifest.segments.length} size=${(manifest.totalBytes / 1048576).toFixed(1)}MB`
        );
      });
    }
  } finally {
    if (nextPrepPromise) {
      nextPrepPromise.catch(() => {});
    }
  }

  await prevUploadPromise;
  fs.rmSync(videoTmpDir, { recursive: true, force: true });
  if (manifest.complete) {
    try {
      const th = await generateAndUploadThumbnailsForManifest({
        code,
        manifest,
        manifestPath,
        botToken: BOT_TOKEN,
        targetChatId,
        ffmpegSem,
      });
      if (!th.skipped) {
        console.log(`  [${code}] Generated ${th.count} seek thumbnails (${th.sheets} sheet(s), ${(th.totalBytes / 1024).toFixed(0)} KB)`);
      }
    } catch (err) {
      console.warn(`  [${code}] Thumbnail generation warning: ${err.message}`);
    }
    patchCatalogWithTgCode(code, code);
  }
  return manifest.complete;
}

async function main() {
  acquireSingleInstanceLock();
  const {
    limit,
    maxMinutes,
    only,
    forceCode,
    forceCodes,
    forceChannel,
    channelKeys,
    skipCatalogSync,
    syncOnly,
    fastOnly,
    ffmpegWorkers,
  } = parseArgs();
  SKIP_CATALOG_SYNC = skipCatalogSync;
  fs.mkdirSync(TG_DIR, { recursive: true });

  if (syncOnly) {
    const synced = syncAllCompletedManifestsToCatalog();
    console.log(`Catalog sync complete. Newly linked items: ${synced}`);
    return;
  }

  if (!BOT_TOKEN) {
    console.error('Missing valid TELEGRAM_BOT_TOKEN in .env');
    process.exit(1);
  }

  if (!SKIP_CATALOG_SYNC) {
    const preSynced = syncAllCompletedManifestsToCatalog();
    if (preSynced > 0) console.log(`Synced ${preSynced} completed manifest links into catalog files.`);
  }
  const deadlineMs = maxMinutes > 0 ? Date.now() + maxMinutes * 60 * 1000 : 0;
  const ffmpegSem = createSemaphore(ffmpegWorkers);

  console.log('Checking Telegram channels & bot admin permissions...');
  const writableChannels = await checkWritableChannels();

  const allowedChannels = new Set(
    channelKeys.map((k) => CHANNEL_MAP[k] || k).filter(Boolean)
  );

  const targetedCodes = [...new Set([...(forceCode ? [forceCode] : []), ...forceCodes])];
  let queuesByChannel;
  if (targetedCodes.length > 0) {
    const chId = forceChannel || CHANNEL_MAP.movies_default;
    queuesByChannel = new Map([[chId, targetedCodes.map((c) => ({ code: c, title: c, channelId: chId }))]]);
  } else {
    queuesByChannel = collectPendingByChannel(only, writableChannels, allowedChannels);
  }

  let totalPending = 0;
  for (const [cid, list] of queuesByChannel.entries()) {
    const trimmed = limit > 0 ? list.slice(0, limit) : list;
    queuesByChannel.set(cid, trimmed);
    totalPending += trimmed.length;
    console.log(`  Queue [${cid}]: ${trimmed.length} items`);
  }
  console.log(`Starting ${queuesByChannel.size} parallel channel workers (${totalPending} items queued, fastOnly=${fastOnly}, ffmpegWorkers=${ffmpegWorkers})...`);

  let completedCount = 0;
  const runChannelWorker = async (channelId, jobs) => {
    for (const job of jobs) {
      if (deadlineMs && Date.now() >= deadlineMs) break;
      try {
        const manifestPath = path.join(TG_DIR, `${job.code}.json`);
        let existingMode = null;
        if (fs.existsSync(manifestPath)) {
          try {
            const ex = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            if (ex.complete) {
              patchCatalogWithTgCode(job.code, job.code);
              completedCount++;
              continue;
            }
            existingMode = ex.quality === '720p-smart' ? 'smart' : 'fast';
          } catch (_) {}
        }

        if (fastOnly && existingMode === 'smart') {
          continue;
        }

        const playlist = await fetchBysePlaylist(job.code);
        const useFastCopy = existingMode ? existingMode === 'fast' : playlist.kbps <= FAST_COPY_MAX_KBPS;
        if (fastOnly && !useFastCopy) {
          console.log(`  [Skip heavy >1550kbps] ${job.code} "${playlist.title}" (${playlist.kbps} kbps)`);
          continue;
        }
        console.log(
          `==> [${channelId} | ${job.code}] "${playlist.title}" (${playlist.kbps} kbps) -> ${useFastCopy ? 'FAST DIRECT COPY' : 'SMART 720p HD'}`
        );
        const finished = useFastCopy
          ? await migrateFastCopy(job.code, channelId, playlist, deadlineMs)
          : await migrateSmart720p(job.code, channelId, playlist, deadlineMs, ffmpegSem);

        if (finished) completedCount++;
      } catch (err) {
        console.error(`Skipped/error on ${job.code}: ${err.message}`);
      }
    }
  };

  await Promise.all(
    [...queuesByChannel.entries()].map(([cid, jobs]) => runChannelWorker(cid, jobs))
  );
  console.log(`Multi-channel batch finished. Newly completed items: ${completedCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
