#!/usr/bin/env node
/**
 * Byse -> Telegram Bot API HLS Migrator
 * Usage: node scripts/migrate_byse_to_telegram.mjs --code=rizi0z1w6q7s [--max-chunks=0]
 *
 * Splits HLS MPEG-TS segments cleanly into <= 15 MB chunks (strictly under
 * Telegram Bot API's 20 MB getFile limit) so ANY standard Telegram bot can
 * serve direct HTML5 HLS streams with zero api_id/api_hash required.
 */

import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1004389672836';
const MAX_CHUNK_BYTES = 15 * 1024 * 1024; // 15 MB safe cap (Telegram getFile cap = 20 MB)
const FAST_START_SINGLE_SEGS = 2; // First 2 segments stay tiny (~10s) for <1s startup
const BYSE_MIRRORS = ['bysezejataos.com', 'bysebuho.com', 'bysevepoin.com'];
const OUT_DIR = path.join(process.cwd(), 'public', 'tg_hls');

if (!BOT_TOKEN) {
  console.error('Missing TELEGRAM_BOT_TOKEN in .env');
  process.exit(1);
}

function parseArgs() {
  const args = { code: 'rizi0z1w6q7s', maxChunks: 0 };
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--code=')) args.code = arg.split('=')[1].trim();
    else if (arg.startsWith('--max-chunks=')) args.maxChunks = Number(arg.split('=')[1]) || 0;
  }
  return args;
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

  // Fallback: test pairs of 16-byte parts
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
      const metaResp = await fetch(`https://${host}/api/videos/${code}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Referer: `https://${host}/e/${code}`,
        },
      });
      if (!metaResp.ok) throw new Error(`HTTP ${metaResp.status}`);
      const meta = await metaResp.json();
      if (!meta.playback) throw new Error('No playback object');
      const decoded = decryptBysePlayback(meta.playback);
      const sources = decoded.sources || [];
      if (!sources.length) throw new Error('No sources returned');

      // Prefer 720p/1080p reasonable source
      const chosen =
        sources.find((s) => s.height === 720) ||
        sources.find((s) => s.height === 1080) ||
        sources[0];

      const masterUrl = chosen.url;
      const masterText = await (
        await fetch(masterUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0', Referer: `https://${host}/` },
        })
      ).text();

      let mediaPlaylistUrl = masterUrl;
      const masterLines = masterText.split(/\r?\n/);
      for (const line of masterLines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && !trimmed.includes('iframes')) {
          mediaPlaylistUrl = new URL(trimmed, masterUrl).toString();
          break;
        }
      }

      const subText = await (
        await fetch(mediaPlaylistUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0', Referer: `https://${host}/` },
        })
      ).text();

      const rawLines = subText.split(/\r?\n/);
      const segments = [];
      let pendingDur = 10;
      for (const rawLine of rawLines) {
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

async function fetchSegmentBytes(url, refererHost, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Referer: `https://${refererHost}/`,
        },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return Buffer.from(await resp.arrayBuffer());
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(800 * attempt);
    }
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function uploadChunkToTelegram(buffer, filename, caption) {
  const endpoint = `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;
  for (let attempt = 1; attempt <= 6; attempt++) {
    const form = new FormData();
    form.append('chat_id', CHANNEL_ID);
    form.append('disable_notification', 'true');
    if (caption) form.append('caption', caption);
    form.append('document', new Blob([buffer], { type: 'video/mp2t' }), filename);

    const resp = await fetch(endpoint, { method: 'POST', body: form });
    const data = await resp.json();
    if (data.ok && data.result) {
      const doc = data.result.document || data.result.video;
      if (!doc || !doc.file_id) {
        throw new Error('Telegram did not return file_id');
      }
      return {
        fileId: doc.file_id,
        fileUniqueId: doc.file_unique_id,
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
    throw new Error(`Telegram API error: ${JSON.stringify(data)}`);
  }
  throw new Error(`Exceeded retries uploading ${filename}`);
}

async function main() {
  const { code, maxChunks } = parseArgs();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifestPath = path.join(OUT_DIR, `${code}.json`);

  let playlist = await fetchBysePlaylist(code);
  console.log(`Resolved "${playlist.title}" (${playlist.segments.length} raw TS segments, ~${Math.round(playlist.durationSeconds / 60)} min)`);

  let manifest = {
    byseCode: code,
    title: playlist.title,
    durationSeconds: playlist.durationSeconds,
    rawSegmentCount: playlist.segments.length,
    targetDuration: 60,
    complete: false,
    nextRawIndex: 0,
    totalBytes: 0,
    segments: [],
  };

  if (fs.existsSync(manifestPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (existing && Array.isArray(existing.segments) && existing.byseCode === code) {
        manifest = existing;
        console.log(`Resuming from raw segment ${manifest.nextRawIndex}/${playlist.segments.length} (${manifest.segments.length} chunks already uploaded).`);
      }
    } catch (_) {}
  }

  if (manifest.complete && manifest.nextRawIndex >= playlist.segments.length) {
    console.log('Already 100% migrated!');
    return;
  }

  let carryBuf = null;
  let carryDur = 0;
  let carryRawIdx = manifest.nextRawIndex;
  let chunksUploadedThisRun = 0;

  while (carryRawIdx < playlist.segments.length || carryBuf) {
    if (maxChunks > 0 && chunksUploadedThisRun >= maxChunks) {
      console.log(`Reached --max-chunks=${maxChunks}, pausing cleanly.`);
      break;
    }

    // Refresh Byse URL every 9 minutes so CDN tokens never expire mid-transfer
    if (Date.now() - playlist.fetchedAt > 9 * 60 * 1000) {
      console.log('Refreshing Byse HLS URL tokens...');
      playlist = await fetchBysePlaylist(code);
    }

    const chunkIndex = manifest.segments.length;
    const isFastStart = chunkIndex < FAST_START_SINGLE_SEGS;
    const chunkParts = [];
    let chunkBytes = 0;
    let chunkDuration = 0;

    if (carryBuf) {
      chunkParts.push(carryBuf);
      chunkBytes += carryBuf.length;
      chunkDuration += carryDur;
      carryBuf = null;
      carryDur = 0;
    }

    while (carryRawIdx < playlist.segments.length) {
      const rawSeg = playlist.segments[carryRawIdx];
      const segBuf = await fetchSegmentBytes(rawSeg.url, playlist.host);
      carryRawIdx++;

      if (chunkParts.length > 0 && chunkBytes + segBuf.length > MAX_CHUNK_BYTES) {
        // Defer this segment to next chunk
        carryBuf = segBuf;
        carryDur = rawSeg.duration;
        break;
      }

      chunkParts.push(segBuf);
      chunkBytes += segBuf.length;
      chunkDuration += rawSeg.duration;

      if (isFastStart || chunkBytes >= 12 * 1024 * 1024 || chunkDuration >= 55) {
        break;
      }
    }

    const merged = Buffer.concat(chunkParts);
    const filename = `${code}_c${String(chunkIndex).padStart(4, '0')}.ts`;
    const caption = chunkIndex === 0 ? `🎬 ${playlist.title} | HLS Stream (${code})` : '';

    const tgResult = await uploadChunkToTelegram(merged, filename, caption);
    manifest.segments.push({
      index: chunkIndex,
      duration: Number(chunkDuration.toFixed(3)),
      bytes: merged.length,
      fileId: tgResult.fileId,
      msgId: tgResult.msgId,
    });
    manifest.nextRawIndex = carryRawIdx - (carryBuf ? 1 : 0);
    manifest.totalBytes += merged.length;
    manifest.targetDuration = Math.max(
      manifest.targetDuration || 15,
      Math.ceil(chunkDuration)
    );
    manifest.complete = manifest.nextRawIndex >= playlist.segments.length && !carryBuf;

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    chunksUploadedThisRun++;

    const pct = ((manifest.nextRawIndex / playlist.segments.length) * 100).toFixed(1);
    console.log(
      `[${pct}%] Uploaded chunk ${chunkIndex} (${(merged.length / 1048576).toFixed(2)} MB, ${chunkDuration.toFixed(1)}s) -> msg ${tgResult.msgId}`
    );

    // Gentle pacing (~1.5s) to respect channel anti-flood (~20-25 msgs/min comfortably)
    if (!manifest.complete) {
      await sleep(1500);
    }
  }

  console.log(
    `Done! Uploaded chunks: ${manifest.segments.length}, Total: ${(manifest.totalBytes / 1048576).toFixed(1)} MB, Complete: ${manifest.complete}`
  );
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
