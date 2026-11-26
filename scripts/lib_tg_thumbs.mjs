import fs from 'node:fs';
import path from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const THUMB_WIDTH = 192;
export const THUMB_HEIGHT = 108;
export const THUMB_COLS = 10;
export const THUMB_ROWS = 10;
export const FRAMES_PER_SHEET = THUMB_COLS * THUMB_ROWS;

export function writeFileAtomic(filePath, content) {
  const tmpPath = `${filePath}.tmp.${process.pid}`;
  fs.writeFileSync(tmpPath, content, 'utf8');
  fs.renameSync(tmpPath, filePath);
}

export function chooseThumbInterval(totalDurationSec) {
  if (!Number.isFinite(totalDurationSec) || totalDurationSec <= 0) return 10;
  if (totalDurationSec <= 1800) return 5;
  if (totalDurationSec <= 4200) return 10;
  return Math.max(10, Math.min(20, Math.ceil(totalDurationSec / 500)));
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

async function downloadTelegramSegment(botToken, fileId, destPath, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const gfResp = await fetchWithTimeout(
        `https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`,
        {},
        20000
      );
      const gfData = await gfResp.json();
      if (!gfData.ok || !gfData.result?.file_path) {
        throw new Error(`getFile failed (${gfData.error_code || gfResp.status})`);
      }
      const dlResp = await fetchWithTimeout(
        `https://api.telegram.org/file/bot${botToken}/${gfData.result.file_path}`,
        {},
        60000
      );
      if (!dlResp.ok) {
        throw new Error(`Telegram CDN HTTP ${dlResp.status}`);
      }
      const buf = Buffer.from(await dlResp.arrayBuffer());
      fs.writeFileSync(destPath, buf);
      return buf.length;
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(700 * attempt);
    }
  }
}

export async function uploadThumbnailSheetToTelegram(botToken, chatId, buffer, filename) {
  const endpoint = `https://api.telegram.org/bot${botToken}/sendDocument`;
  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      const form = new FormData();
      form.append('chat_id', chatId);
      form.append('disable_notification', 'true');
      form.append('document', new Blob([buffer], { type: 'image/jpeg' }), filename);

      const resp = await fetchWithTimeout(endpoint, { method: 'POST', body: form }, 45000);
      const data = await resp.json();
      if (data.ok && data.result) {
        const doc = data.result.document;
        if (!doc || !doc.file_id) throw new Error('Missing document file_id from Telegram');
        return {
          fileId: doc.file_id,
          msgId: data.result.message_id,
          bytes: doc.file_size || buffer.length,
        };
      }
      if (data.error_code === 429 && data.parameters?.retry_after) {
        const waitSec = Number(data.parameters.retry_after) + 1;
        console.log(`  [Thumb Rate Limit ${chatId}] Waiting ${waitSec}s...`);
        await sleep(waitSec * 1000);
        continue;
      }
      throw new Error(`Telegram upload error: ${JSON.stringify(data)}`);
    } catch (err) {
      if (attempt >= 8) throw err;
      await sleep(1200 * attempt);
    }
  }
  throw new Error(`Exceeded retries uploading ${filename}`);
}

async function runPipedKeyframeExtract(chunkPaths, framesDir, interval) {
  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });

  const vf = `fps=1/${interval},scale=${THUMB_WIDTH}:${THUMB_HEIGHT}:force_original_aspect_ratio=decrease,pad=${THUMB_WIDTH}:${THUMB_HEIGHT}:(ow-iw)/2:(oh-ih)/2:black`;
  await new Promise((resolve, reject) => {
    const ff = spawn(
      'ffmpeg',
      [
        '-nostdin',
        '-loglevel',
        'error',
        '-y',
        '-skip_frame',
        'nokey',
        '-f',
        'mpegts',
        '-i',
        'pipe:0',
        '-vsync',
        'vfr',
        '-vf',
        vf,
        '-q:v',
        '5',
        path.join(framesDir, 'f_%05d.jpg'),
      ],
      { stdio: ['pipe', 'ignore', 'pipe'] }
    );

    let errText = '';
    ff.stderr.on('data', (d) => {
      errText += d.toString();
    });
    ff.on('error', reject);
    ff.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg pipe exited with ${code}: ${errText.slice(-300)}`));
    });

    (async () => {
      try {
        for (const p of chunkPaths) {
          const buf = fs.readFileSync(p);
          if (!ff.stdin.write(buf)) {
            await new Promise((r) => ff.stdin.once('drain', r));
          }
        }
        ff.stdin.end();
      } catch (err) {
        try { ff.kill('SIGKILL'); } catch (_) {}
        reject(err);
      }
    })();
  });

  return fs
    .readdirSync(framesDir)
    .filter((f) => f.startsWith('f_') && f.endsWith('.jpg'))
    .sort()
    .map((f) => path.join(framesDir, f));
}

async function runPerChunkExtract(chunkPaths, framesDir, interval) {
  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });

  const vf = `fps=1/${interval},scale=${THUMB_WIDTH}:${THUMB_HEIGHT}:force_original_aspect_ratio=decrease,pad=${THUMB_WIDTH}:${THUMB_HEIGHT}:(ow-iw)/2:(oh-ih)/2:black`;
  let globalIndex = 1;

  for (let i = 0; i < chunkPaths.length; i++) {
    const subDir = path.join(framesDir, `seg_${i}`);
    fs.mkdirSync(subDir, { recursive: true });
    await execFileAsync(
      'ffmpeg',
      [
        '-nostdin',
        '-loglevel',
        'error',
        '-y',
        '-skip_frame',
        'nokey',
        '-i',
        chunkPaths[i],
        '-vsync',
        'vfr',
        '-vf',
        vf,
        '-q:v',
        '5',
        path.join(subDir, 'p_%04d.jpg'),
      ],
      { maxBuffer: 10 * 1024 * 1024 }
    );
    const subFiles = fs
      .readdirSync(subDir)
      .filter((f) => f.startsWith('p_') && f.endsWith('.jpg'))
      .sort();
    for (const f of subFiles) {
      const dest = path.join(framesDir, `f_${String(globalIndex++).padStart(5, '0')}.jpg`);
      fs.renameSync(path.join(subDir, f), dest);
    }
    fs.rmSync(subDir, { recursive: true, force: true });
  }

  return fs
    .readdirSync(framesDir)
    .filter((f) => f.startsWith('f_') && f.endsWith('.jpg'))
    .sort()
    .map((f) => path.join(framesDir, f));
}

export async function generateAndUploadThumbnailsForManifest({
  code,
  manifest,
  manifestPath,
  botToken,
  targetChatId,
  ffmpegSem = null,
  tmpRoot = '/tmp/tg_thumb_work',
  downloadConcurrency = 5,
}) {
  if (!manifest || !manifest.complete || !Array.isArray(manifest.segments) || manifest.segments.length === 0) {
    return { skipped: true, reason: 'incomplete' };
  }
  if (
    manifest.thumbnails &&
    Array.isArray(manifest.thumbnails.sheets) &&
    manifest.thumbnails.sheets.length > 0 &&
    Number(manifest.thumbnails.count) > 0
  ) {
    return { skipped: true, reason: 'already_exists' };
  }

  const chatId = targetChatId || manifest.channelId;
  if (!chatId) {
    return { skipped: true, reason: 'missing_channel' };
  }

  const segDurationSum = manifest.segments.reduce((acc, s) => acc + (Number(s?.duration) || 0), 0);
  const totalDuration = segDurationSum > 5 ? segDurationSum : Number(manifest.durationSeconds) || 0;
  if (totalDuration <= 5) {
    return { skipped: true, reason: 'too_short' };
  }

  const interval = chooseThumbInterval(totalDuration);
  const workDir = path.join(tmpRoot, `${code}_${process.pid}`);
  const chunksDir = path.join(workDir, 'chunks');
  const framesDir = path.join(workDir, 'frames');
  const sheetsDir = path.join(workDir, 'sheets');

  fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(chunksDir, { recursive: true });
  fs.mkdirSync(framesDir, { recursive: true });
  fs.mkdirSync(sheetsDir, { recursive: true });

  try {
    const segs = manifest.segments;
    const chunkPaths = new Array(segs.length);
    let nextIdx = 0;

    const dlWorker = async () => {
      while (true) {
        const myIdx = nextIdx++;
        if (myIdx >= segs.length) return;
        const seg = segs[myIdx];
        if (!seg || !seg.fileId) throw new Error(`Missing segment fileId at ${myIdx}`);
        const dest = path.join(chunksDir, `c_${String(myIdx).padStart(4, '0')}.ts`);
        await downloadTelegramSegment(botToken, seg.fileId, dest);
        chunkPaths[myIdx] = dest;
      }
    };

    const workers = [];
    const nWorkers = Math.min(downloadConcurrency, segs.length);
    for (let i = 0; i < nWorkers; i++) workers.push(dlWorker());
    await Promise.all(workers);

    if (ffmpegSem) await ffmpegSem.acquire();
    let frameFiles = [];
    let sheetFiles = [];
    try {
      frameFiles = await runPipedKeyframeExtract(chunkPaths, framesDir, interval);
      const expectedMinFrames = Math.max(2, Math.floor((totalDuration / interval) * 0.55));
      if (frameFiles.length < expectedMinFrames) {
        frameFiles = await runPerChunkExtract(chunkPaths, framesDir, interval);
      }
      if (!frameFiles.length) {
        throw new Error('Zero frames extracted');
      }

      // Free chunk .ts files immediately before tiling & uploading
      fs.rmSync(chunksDir, { recursive: true, force: true });

      await execFileAsync(
        'ffmpeg',
        [
          '-nostdin',
          '-loglevel',
          'error',
          '-y',
          '-framerate',
          '1',
          '-start_number',
          '1',
          '-i',
          path.join(framesDir, 'f_%05d.jpg'),
          '-vf',
          `tile=${THUMB_COLS}x${THUMB_ROWS}`,
          '-q:v',
          '4',
          path.join(sheetsDir, 'sprite_%03d.jpg'),
        ],
        { maxBuffer: 15 * 1024 * 1024 }
      );

      sheetFiles = fs
        .readdirSync(sheetsDir)
        .filter((f) => f.startsWith('sprite_') && f.endsWith('.jpg'))
        .sort()
        .map((f) => path.join(sheetsDir, f));
    } finally {
      if (ffmpegSem) ffmpegSem.release();
    }

    if (!sheetFiles.length) {
      throw new Error('No sprite sheets created');
    }

    const totalFrames = frameFiles.length;
    const uploadedSheets = [];
    let remainingFrames = totalFrames;

    for (let sIdx = 0; sIdx < sheetFiles.length; sIdx++) {
      const buf = fs.readFileSync(sheetFiles[sIdx]);
      const framesInSheet = Math.min(FRAMES_PER_SHEET, remainingFrames);
      remainingFrames = Math.max(0, remainingFrames - framesInSheet);

      const tgRes = await uploadThumbnailSheetToTelegram(
        botToken,
        chatId,
        buf,
        `${code}_thumb_${String(sIdx + 1).padStart(3, '0')}.jpg`
      );
      uploadedSheets.push({
        index: sIdx,
        frames: framesInSheet,
        bytes: buf.length,
        fileId: tgRes.fileId,
        msgId: tgRes.msgId,
      });
      if (sIdx + 1 < sheetFiles.length) await sleep(250);
    }

    const stepSeconds = Number((totalDuration / totalFrames).toFixed(4));
    manifest.thumbnails = {
      version: 1,
      interval,
      stepSeconds,
      durationSeconds: Number(totalDuration.toFixed(2)),
      width: THUMB_WIDTH,
      height: THUMB_HEIGHT,
      cols: THUMB_COLS,
      rows: THUMB_ROWS,
      count: totalFrames,
      sheets: uploadedSheets,
    };

    writeFileAtomic(manifestPath, JSON.stringify(manifest, null, 2));
    return {
      skipped: false,
      count: totalFrames,
      sheets: uploadedSheets.length,
      interval,
      totalBytes: uploadedSheets.reduce((a, b) => a + b.bytes, 0),
    };
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}
