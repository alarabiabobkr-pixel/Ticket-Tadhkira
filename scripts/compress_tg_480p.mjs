#!/usr/bin/env node
/**
 * Compress an already-migrated Telegram HLS catalog manifest into a lightweight 480p
 * (~500 kbps, ~2 MB / 30s chunk) stream tailored for low-bandwidth mobile connections.
 *
 * Usage:
 *   node scripts/compress_tg_480p.mjs --code=rizi0z1w6q7s [--batch-count=35]
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1004389672836';
const TG_DIR = path.join(process.cwd(), 'public', 'tg_hls');
const TMP_DIR = '/tmp/tg_480p_work';

if (!BOT_TOKEN) {
  console.error('Missing TELEGRAM_BOT_TOKEN in .env');
  process.exit(1);
}

function parseArgs() {
  const args = { code: 'rizi0z1w6q7s', batchCount: 35 };
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--code=')) args.code = arg.split('=')[1].trim();
    else if (arg.startsWith('--batch-count=')) args.batchCount = Number(arg.split('=')[1]) || 0;
  }
  return args;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithTimeout(url, options = {}, timeoutMs = 45000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function downloadTgFile(fileId, outPath) {
  let lastErr;
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const gfResp = await fetchWithTimeout(
        `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${encodeURIComponent(fileId)}`,
        {},
        20000
      );
      const gf = await gfResp.json();
      if (!gf.ok || !gf.result?.file_path) {
        throw new Error(`getFile failed for ${fileId}: ${JSON.stringify(gf)}`);
      }
      const resp = await fetchWithTimeout(
        `https://api.telegram.org/file/bot${BOT_TOKEN}/${gf.result.file_path}`,
        {},
        45000
      );
      if (!resp.ok) throw new Error(`Download failed HTTP ${resp.status}`);
      fs.writeFileSync(outPath, Buffer.from(await resp.arrayBuffer()));
      return;
    } catch (err) {
      lastErr = err;
      console.log(`  [DL Retry ${attempt}/6] ${err.message}`);
      await sleep(1500 * attempt);
    }
  }
  throw lastErr;
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

async function main() {
  const { code, batchCount } = parseArgs();
  const srcManifestPath = path.join(TG_DIR, `${code}.json`);
  const outCode = `${code}_480p`;
  const outManifestPath = path.join(TG_DIR, `${outCode}.json`);

  if (!fs.existsSync(srcManifestPath)) {
    throw new Error(`Source manifest not found: ${srcManifestPath}`);
  }
  const srcManifest = JSON.parse(fs.readFileSync(srcManifestPath, 'utf8'));
  const srcSegs = srcManifest.segments || [];

  let outManifest = {
    byseCode: outCode,
    parentCode: code,
    quality: '480p',
    title: `${srcManifest.title || code} (480p Light)`,
    durationSeconds: srcManifest.durationSeconds || 0,
    sourceSegmentCount: srcSegs.length,
    targetDuration: 32,
    complete: false,
    nextSourceIndex: 0,
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

  if (outManifest.complete && outManifest.nextSourceIndex >= srcSegs.length) {
    console.log('480p version already 100% complete!');
    return;
  }

  fs.mkdirSync(TMP_DIR, { recursive: true });
  const endIdx =
    batchCount > 0 ? Math.min(srcSegs.length, outManifest.nextSourceIndex + batchCount) : srcSegs.length;

  console.log(
    `Compressing "${srcManifest.title}" source chunks ${outManifest.nextSourceIndex}..${endIdx - 1} of ${srcSegs.length}...`
  );

  const prepareDir = (idx) => {
    const dir = path.join(TMP_DIR, `s_${idx}`);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  };

  let nextDownloadPromise = null;
  if (outManifest.nextSourceIndex < endIdx) {
    const firstIdx = outManifest.nextSourceIndex;
    const firstDir = prepareDir(firstIdx);
    nextDownloadPromise = downloadTgFile(srcSegs[firstIdx].fileId, path.join(firstDir, 'in.ts')).then(
      () => firstDir
    );
  }

  let prevUploadPromise = Promise.resolve();

  for (let i = outManifest.nextSourceIndex; i < endIdx; i++) {
    const workSubDir = await nextDownloadPromise;
    if (i + 1 < endIdx) {
      const nextIdx = i + 1;
      const nextDir = prepareDir(nextIdx);
      nextDownloadPromise = downloadTgFile(srcSegs[nextIdx].fileId, path.join(nextDir, 'in.ts')).then(
        () => nextDir
      );
    } else {
      nextDownloadPromise = null;
    }

    const inFile = path.join(workSubDir, 'in.ts');
    const m3u8Out = path.join(workSubDir, 'out.m3u8');
    const tsPattern = path.join(workSubDir, 'part_%03d.ts');

    // Transcode cleanly preserving continuous PTS timestamps, split <= 33s (~1.5-2.0 MB each)
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
      'scale=854:-2',
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-crf',
      '26',
      '-maxrate',
      '450k',
      '-bufsize',
      '900k',
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
      '33',
      '-hls_list_size',
      '0',
      '-hls_segment_filename',
      tsPattern,
      m3u8Out,
    ]);

    const parts = parseLocalM3u8(m3u8Out).map((part) => ({
      duration: part.duration,
      buf: fs.readFileSync(path.join(workSubDir, part.filename)),
    }));
    fs.rmSync(workSubDir, { recursive: true, force: true });

    // Chain upload strictly sequentially AFTER prevUploadPromise so segment indices & manifest stay ordered,
    // while running concurrently with the next iteration's download + ffmpeg!
    const srcIdxOneBased = i + 1;
    prevUploadPromise = prevUploadPromise.then(async () => {
      for (const part of parts) {
        const chunkIdx = outManifest.segments.length;
        const uploadName = `${outCode}_c${String(chunkIdx).padStart(4, '0')}.ts`;
        const caption = chunkIdx === 0 ? `📱 ${srcManifest.title} | نسخة خفيفة 480p` : '';
        const tgRes = await uploadChunkToTelegram(part.buf, uploadName, caption);

        outManifest.segments.push({
          index: chunkIdx,
          duration: Number(part.duration.toFixed(3)),
          bytes: part.buf.length,
          fileId: tgRes.fileId,
          msgId: tgRes.msgId,
        });
        outManifest.totalBytes += part.buf.length;
        outManifest.targetDuration = Math.max(outManifest.targetDuration || 32, Math.ceil(part.duration));
        await sleep(300);
      }

      outManifest.nextSourceIndex = srcIdxOneBased;
      outManifest.complete = outManifest.nextSourceIndex >= srcSegs.length;
      fs.writeFileSync(outManifestPath, JSON.stringify(outManifest, null, 2), 'utf8');

      const pct = ((outManifest.nextSourceIndex / srcSegs.length) * 100).toFixed(1);
      console.log(
        `[${pct}%] src ${srcIdxOneBased}/${srcSegs.length} -> total 480p chunks: ${outManifest.segments.length}, size: ${(outManifest.totalBytes / 1048576).toFixed(1)} MB`
      );
    });
  }

  await prevUploadPromise;

  fs.rmSync(TMP_DIR, { recursive: true, force: true });
  console.log(
    `Batch complete! 480p chunks=${outManifest.segments.length}, totalMB=${(outManifest.totalBytes / 1048576).toFixed(1)}, complete=${outManifest.complete}`
  );
}

main().catch((err) => {
  console.error('480p compression failed:', err);
  process.exit(1);
});
