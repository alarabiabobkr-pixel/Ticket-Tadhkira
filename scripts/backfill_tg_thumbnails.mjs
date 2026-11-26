#!/usr/bin/env node
/**
 * Backfills YouTube-style timeline seek preview thumbnail sprites for completed
 * Telegram HLS manifests (public/tg_hls/*.json) that don't yet have `thumbnails`.
 *
 * Usage:
 *   node scripts/backfill_tg_thumbnails.mjs [--code=tf3kaasnuymy] [--limit=20] [--max-minutes=8] [--workers=2]
 */

import fs from 'node:fs';
import path from 'node:path';
import { generateAndUploadThumbnailsForManifest } from './lib_tg_thumbs.mjs';

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

function parseArgs() {
  const args = {
    code: '',
    codes: [],
    limit: 0,
    maxMinutes: 0,
    workers: 2,
  };
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--code=')) args.code = arg.split('=')[1].trim();
    else if (arg.startsWith('--codes=')) {
      args.codes = arg.split('=')[1].split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg.startsWith('--limit=')) args.limit = Number(arg.split('=')[1]) || 0;
    else if (arg.startsWith('--max-minutes=')) args.maxMinutes = Number(arg.split('=')[1]) || 0;
    else if (arg.startsWith('--workers=')) args.workers = Math.max(1, Math.min(4, Number(arg.split('=')[1]) || 2));
  }
  return args;
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

async function main() {
  const BOT_TOKEN = resolveTelegramBotToken();
  if (!BOT_TOKEN) {
    console.error('Missing valid TELEGRAM_BOT_TOKEN in environment or .env');
    process.exit(1);
  }

  const { code, codes, limit, maxMinutes, workers } = parseArgs();
  const tgDir = path.join(process.cwd(), 'public', 'tg_hls');
  if (!fs.existsSync(tgDir)) {
    console.log('No public/tg_hls directory found.');
    return;
  }

  const requestedSet = new Set([...(code ? [code] : []), ...codes]);
  const pending = [];

  for (const fname of fs.readdirSync(tgDir).sort()) {
    if (!fname.endsWith('.json')) continue;
    const itemCode = fname.replace(/\.json$/, '');
    if (requestedSet.size > 0 && !requestedSet.has(itemCode)) continue;

    const fullPath = path.join(tgDir, fname);
    try {
      const m = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      if (!m || !m.complete || !Array.isArray(m.segments) || m.segments.length === 0) continue;
      if (m.thumbnails && Array.isArray(m.thumbnails.sheets) && m.thumbnails.sheets.length > 0 && m.thumbnails.count > 0) {
        continue;
      }
      pending.push({ code: itemCode, manifestPath: fullPath, manifest: m });
    } catch (_) {}
  }

  const queue = limit > 0 ? pending.slice(0, limit) : pending;
  console.log(`Thumbnail backfill queue: ${queue.length} manifest(s) (workers=${workers}, maxMinutes=${maxMinutes || 'unlimited'})`);
  if (!queue.length) return;

  const deadlineMs = maxMinutes > 0 ? Date.now() + maxMinutes * 60 * 1000 : 0;
  const ffmpegSem = createSemaphore(workers);
  let cursor = 0;
  let doneCount = 0;
  let failCount = 0;

  const runWorker = async () => {
    while (true) {
      if (deadlineMs && Date.now() >= deadlineMs) return;
      const idx = cursor++;
      if (idx >= queue.length) return;
      const job = queue[idx];
      const t0 = Date.now();
      try {
        const res = await generateAndUploadThumbnailsForManifest({
          code: job.code,
          manifest: job.manifest,
          manifestPath: job.manifestPath,
          botToken: BOT_TOKEN,
          targetChatId: job.manifest.channelId,
          ffmpegSem,
        });
        if (!res.skipped) {
          doneCount++;
          console.log(
            `  [Thumb OK ${doneCount}/${queue.length}] ${job.code} "${job.manifest.title || job.code}" -> ${res.count} frames, ${res.sheets} sheet(s), ${(res.totalBytes / 1024).toFixed(0)} KB in ${((Date.now() - t0) / 1000).toFixed(1)}s`
          );
        }
      } catch (err) {
        failCount++;
        console.warn(`  [Thumb ERR] ${job.code}: ${err.message}`);
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(workers, queue.length) }, () => runWorker()));
  console.log(`Thumbnail backfill finished. Generated: ${doneCount}, Errors: ${failCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
