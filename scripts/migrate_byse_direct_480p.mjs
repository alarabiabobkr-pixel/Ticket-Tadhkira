#!/usr/bin/env node
/**
 * Direct Byse -> 480p Lightweight Telegram HLS Migrator
 *
 * Streams raw TS segments from Byse mirrors, transcodes directly to lightweight
 * 480p (~450k video + 64k audio, ~2 MB / 33s chunk) with continuous PTS timestamps,
 * uploads directly to Telegram Bot API (skipping the 1.3 GB intermediate upload),
 * and patches tgCode480 into public catalog files once 100% complete.
 *
 * Usage:
 *   node scripts/migrate_byse_direct_480p.mjs --code=zjrclbpwqyfh [--batch-groups=18]
 */

import 'dotenv/config';
import { parse as parseDotenv } from 'dotenv';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function resolveTelegramBotToken() {
  const isValid = (v) => typeof v === 'string' && /^\d+:[A-Za-z0-9_-]{20,}$/.test(v.trim());
  if (isValid(process.env.TELEGRAM_BOT_TOKEN)) return process.env.TELEGRAM_BOT_TOKEN.trim();
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const parsed = parseDotenv(fs.readFileSync(envPath, 'utf8'));
    if (isValid(parsed.TELEGRAM_BOT_TOKEN)) return parsed.TELEGRAM_BOT_TOKEN.trim();
  }
  return null;
}

const BOT_TOKEN = resolveTelegramBotToken();
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1004389672836';
const BYSE_MIRRORS = ['bysezejataos.com', 'bysebuho.com', 'bysevepoin.com'];
const TG_DIR = path.join(process.cwd(), 'public', 'tg_hls');
const TMP_DIR = '/tmp/tg_direct_480p_work';

if (!BOT_TOKEN) {
  console.error('Missing valid TELEGRAM_BOT_TOKEN in environment or .env');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseArgs() {
  const args = { code: '', batchGroups: 8, mode: '720p' };
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--code=')) args.code = arg.split('=')[1].trim();
    else if (arg.startsWith('--batch-groups=')) args.batchGroups = Number(arg.split('=')[1]) || 0;
    else if (arg.startsWith('--mode=')) args.mode = arg.split('=')[1].trim() === '480p' ? '480p' : '720p';
  }
  if (!args.code) {
    console.error('Usage: node scripts/migrate_byse_direct_480p.mjs --code=<byseCode> [--mode=720p|480p] [--batch-groups=8]');
    process.exit(1);
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
        (sources.find((s) => s.height === 720)) ||
        (sources.find((s) => s.height === 1080)) ||
        sources[0];

      const masterUrl = chosen.url;
      const masterText = await (
        await fetchWithTimeout(
          masterUrl,
          { headers: { 'User-Agent': 'Mozilla/5.0', Referer: `https://${host}/` } },
          20000
        )
      ).text();

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
          segments.push({
            duration: pendingDur,
            url: new URL(line, mediaPlaylistUrl).toString(),
          });
        }
      }

      return {
        host,
        title: meta.title || code,
        durationSeconds: meta.duration_seconds || 0,
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
      await sleep(800 * attempt);
    }
  }
}

async function uploadChunkToTelegram(buffer, filename, caption = '') {
  const endpoint = `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;
  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      const form = new FormData();
      form.append('chat_id', CHANNEL_ID);
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
        console.log(`  [Rate Limit] Waiting ${waitSec}s before retrying ${filename}...`);
        await sleep(waitSec * 1000);
        continue;
      }
      throw new Error(`Telegram upload error: ${JSON.stringify(data)}`);
    } catch (err) {
      if (attempt >= 8) throw err;
      console.log(`  [UL Retry ${attempt}/8] ${filename}: ${err.message}`);
      await sleep(1500 * attempt);
    }
  }
  throw new Error(`Exceeded retries for ${filename}`);
}

function parseLocalM3u8(m3u8Path) {
  const txt = fs.readFileSync(m3u8Path, 'utf8');
  const out = [];
  let dur = 20;
  for (const rawLine of txt.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('#EXTINF:')) {
      dur = parseFloat(line.slice(8).split(',')[0]) || 20;
    } else if (!line.startsWith('#')) {
      out.push({ duration: dur, filename: line });
    }
  }
  return out;
}

function buildRawGroups(segments, startRawIdx, maxGroups) {
  const groups = [];
  let idx = startRawIdx;
  while (idx < segments.length && (maxGroups <= 0 || groups.length < maxGroups)) {
    const isFirstFastGroup = startRawIdx === 0 && groups.length === 0;
    const targetDur = isFirstFastGroup ? 21 : 58;
    const targetCount = isFirstFastGroup ? 2 : 12;
    let sumDur = 0;
    const rawIndices = [];
    while (idx < segments.length) {
      rawIndices.push(idx);
      sumDur += segments[idx].duration || 10;
      idx++;
      if (sumDur >= targetDur || rawIndices.length >= targetCount) break;
    }
    groups.push({ rawIndices, isFirstFastGroup });
  }
  return groups;
}

function patchCatalogWithTgCode(byseCode, outCode, fieldName) {
  const root = process.cwd();
  const matchesCode = (obj) => {
    if (!obj || typeof obj !== 'object') return false;
    return [obj.byseUrl, obj.embedUrl, obj.streamUrl].some(
      (u) => typeof u === 'string' && u.includes(`/e/${byseCode}`)
    );
  };

  let patchedFiles = 0;
  for (const rel of ['public/catalog.json', 'public/curated_catalog.json']) {
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) continue;
    const arr = JSON.parse(fs.readFileSync(full, 'utf8'));
    let changed = false;
    for (const item of arr) {
      if (matchesCode(item)) {
        if (item[fieldName] !== outCode) {
          item[fieldName] = outCode;
          changed = true;
        }
      }
    }
    if (changed) {
      fs.writeFileSync(full, JSON.stringify(arr), 'utf8');
      patchedFiles++;
    }
  }

  const curatedPath = path.join(root, 'public/curated_catalog.json');
  const jsPath = path.join(root, 'public/catalog.js');
  if (fs.existsSync(curatedPath) && fs.existsSync(jsPath)) {
    const curatedData = fs.readFileSync(curatedPath, 'utf8');
    fs.writeFileSync(jsPath, `window.CURATED_CATALOG = ${curatedData};`, 'utf8');
    patchedFiles++;
  }
  console.log(`Catalog patched with ${fieldName}="${outCode}" across ${patchedFiles} files.`);
}

async function main() {
  const { code, batchGroups, mode } = parseArgs();
  const isHd720 = mode === '720p';
  const catalogField = isHd720 ? 'tgCode' : 'tgCode480';
  fs.mkdirSync(TG_DIR, { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });

  const outCode = isHd720 ? code : `${code}_480p`;
  const outManifestPath = path.join(TG_DIR, `${outCode}.json`);

  let playlist = await fetchBysePlaylist(code);
  const totalRaw = playlist.segments.length;
  console.log(`Resolved "${playlist.title}" (${totalRaw} raw TS segments, ~${Math.round(playlist.durationSeconds / 60)} min) [mode=${mode}]`);

  let outManifest = {
    byseCode: outCode,
    parentCode: code,
    quality: isHd720 ? '720p-smart' : '480p',
    title: `${playlist.title || code} (${isHd720 ? '720p Smart HD' : '480p Light'})`,
    durationSeconds: playlist.durationSeconds || 0,
    rawSegmentCount: totalRaw,
    targetDuration: 34,
    complete: false,
    nextRawIndex: 0,
    totalBytes: 0,
    segments: [],
  };

  if (fs.existsSync(outManifestPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(outManifestPath, 'utf8'));
      if (existing && Array.isArray(existing.segments)) {
        outManifest = existing;
      }
    } catch (_) {}
  }

  if (outManifest.complete && outManifest.nextRawIndex >= totalRaw) {
    console.log(`${mode} manifest ${outCode} already 100% complete!`);
    patchCatalogWithTgCode(code, outCode, catalogField);
    return;
  }

  const groups = buildRawGroups(playlist.segments, outManifest.nextRawIndex, batchGroups);
  if (!groups.length) {
    outManifest.complete = true;
    fs.writeFileSync(outManifestPath, JSON.stringify(outManifest, null, 2), 'utf8');
    patchCatalogWithTgCode(code, outCode, catalogField);
    return;
  }

  const prepareGroupDir = async (gIdx) => {
    const grp = groups[gIdx];
    const dir = path.join(TMP_DIR, `${outCode}_g_${grp.rawIndices[0]}`);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });

    // Refresh Byse token proactively every 8 minutes
    if (Date.now() - playlist.fetchedAt > 8 * 60 * 1000) {
      playlist = await fetchBysePlaylist(code);
    }
    const bufs = await Promise.all(
      grp.rawIndices.map((rawI) => fetchSegmentBytes(playlist.segments[rawI].url, playlist.host))
    );
    fs.writeFileSync(path.join(dir, 'in.ts'), Buffer.concat(bufs));
    return { dir, grp };
  };

  let nextPrepPromise = prepareGroupDir(0);
  let prevUploadPromise = Promise.resolve();

  for (let g = 0; g < groups.length; g++) {
    const { dir, grp } = await nextPrepPromise;
    if (g + 1 < groups.length) {
      nextPrepPromise = prepareGroupDir(g + 1);
    } else {
      nextPrepPromise = null;
    }

    const inFile = path.join(dir, 'in.ts');
    const m3u8Out = path.join(dir, 'out.m3u8');
    const tsPattern = path.join(dir, 'part_%03d.ts');
    const hlsTime = grp.isFirstFastGroup ? '11' : '33';

    await execFileAsync('ffmpeg', [
      '-y',
      '-copyts',
      '-i',
      inFile,
      '-map',
      '0:v:0',
      '-map',
      '0:a:0',
      '-vf',
      isHd720 ? 'scale=1280:-2:flags=fast_bilinear' : 'scale=854:-2',
      '-c:v',
      'libx264',
      '-preset',
      isHd720 ? 'superfast' : 'ultrafast',
      '-crf',
      isHd720 ? '24' : '26',
      '-maxrate',
      isHd720 ? '620k' : '450k',
      '-bufsize',
      isHd720 ? '1240k' : '900k',
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
      hlsTime,
      '-hls_list_size',
      '0',
      '-hls_segment_filename',
      tsPattern,
      m3u8Out,
    ]);

    const parts = parseLocalM3u8(m3u8Out).map((part) => ({
      duration: part.duration,
      buf: fs.readFileSync(path.join(dir, part.filename)),
    }));
    fs.rmSync(dir, { recursive: true, force: true });

    const nextRawAfter = grp.rawIndices[grp.rawIndices.length - 1] + 1;
    prevUploadPromise = prevUploadPromise.then(async () => {
      for (const part of parts) {
        const chunkIdx = outManifest.segments.length;
        const uploadName = `${outCode}_c${String(chunkIdx).padStart(4, '0')}.ts`;
        const caption = chunkIdx === 0 ? `🎬 ${playlist.title} | ${isHd720 ? '720p HD ذكية' : 'نسخة خفيفة 480p'}` : '';
        const tgRes = await uploadChunkToTelegram(part.buf, uploadName, caption);

        outManifest.segments.push({
          index: chunkIdx,
          duration: Number(part.duration.toFixed(3)),
          bytes: part.buf.length,
          fileId: tgRes.fileId,
          msgId: tgRes.msgId,
        });
        outManifest.totalBytes += part.buf.length;
        outManifest.targetDuration = Math.max(outManifest.targetDuration || 34, Math.ceil(part.duration));
        await sleep(300);
      }

      outManifest.nextRawIndex = nextRawAfter;
      outManifest.complete = outManifest.nextRawIndex >= totalRaw;
      fs.writeFileSync(outManifestPath, JSON.stringify(outManifest, null, 2), 'utf8');

      const pct = ((outManifest.nextRawIndex / totalRaw) * 100).toFixed(1);
      console.log(
        `[${pct}%] raw ${outManifest.nextRawIndex}/${totalRaw} -> ${mode} chunks: ${outManifest.segments.length}, size: ${(outManifest.totalBytes / 1048576).toFixed(1)} MB`
      );
    });
  }

  await prevUploadPromise;
  fs.rmSync(TMP_DIR, { recursive: true, force: true });

  console.log(
    `Batch done! code=${outCode}, mode=${mode}, chunks=${outManifest.segments.length}, totalMB=${(outManifest.totalBytes / 1048576).toFixed(1)}, complete=${outManifest.complete}`
  );

  if (outManifest.complete) {
    patchCatalogWithTgCode(code, outCode, catalogField);
  }
}

main().catch((err) => {
  console.error('Direct 480p migration failed:', err);
  process.exit(1);
});
