import 'dotenv/config';
import { parse as parseDotenv } from 'dotenv';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const ROOT_DIR = process.cwd();
const PORT = process.env.NODE_ENV === 'production' ? (Number(process.env.PORT) || 3000) : 3000;

function isValidTelegramToken(val: string | undefined | null): val is string {
  return typeof val === 'string' && /^\d+:[A-Za-z0-9_-]{20,}$/.test(val.trim());
}

function getTelegramBotToken(): string | null {
  if (isValidTelegramToken(process.env.TELEGRAM_BOT_TOKEN)) {
    return process.env.TELEGRAM_BOT_TOKEN.trim();
  }
  try {
    const envPath = path.join(ROOT_DIR, '.env');
    if (fs.existsSync(envPath)) {
      const parsed = parseDotenv(fs.readFileSync(envPath, 'utf8'));
      if (isValidTelegramToken(parsed.TELEGRAM_BOT_TOKEN)) {
        return parsed.TELEGRAM_BOT_TOKEN.trim();
      }
    }
  } catch (_) {}
  return null;
}
const JAIB_WALLET_NUMBER = '779676636';
const MONTHLY_PRICE_YER = 500;
const YEARLY_PRICE_YER = 5000;
const DATA_DIR = path.join(ROOT_DIR, '.data');
const LEDGER_FILE = path.join(DATA_DIR, 'ai_ledger.json');

type WalletProvider = 'jaib' | 'onecash' | 'mobilemoney' | 'jawali';

const WALLET_LABELS: Record<WalletProvider, string> = {
  jaib: 'جيب (Jaib)',
  onecash: 'ون كاش (ONE Cash)',
  mobilemoney: 'موبايل موني (Mobile Money)',
  jawali: 'جوالي (Jawali)',
};

function normalizeWalletProvider(raw: unknown): WalletProvider {
  if (raw === 'onecash' || raw === 'mobilemoney' || raw === 'jawali' || raw === 'jaib') {
    return raw;
  }
  return 'jaib';
}

interface FirebaseConfig {
  projectId: string;
  apiKey: string;
  firestoreDatabaseId?: string;
}

const firebaseConfig: FirebaseConfig = JSON.parse(
  fs.readFileSync(path.join(ROOT_DIR, 'firebase-applet-config.json'), 'utf8')
);

interface LedgerEntry {
  uid: string;
  email: string;
  plan: 'monthly' | 'yearly';
  walletProvider?: WalletProvider;
  amountYER: number;
  transactionRef: string;
  senderPhone: string;
  receiverNumber: string;
  imageHash: string;
  expiresAtMs: number;
  issuedAtMs: number;
  confidence: number;
  reasonAr: string;
  signature: string;
}

interface AiLedger {
  byUid: Record<string, LedgerEntry>;
  usedRefs: Record<string, { uid: string; issuedAtMs: number }>;
  usedHashes: Record<string, { uid: string; issuedAtMs: number }>;
}

function getSigningSecret(): string {
  const base =
    process.env.AI_VERIFY_SECRET ||
    process.env.GEMINI_API_KEY ||
    `${firebaseConfig.projectId}:${firebaseConfig.apiKey}:tadhkira_vip`;
  return crypto.createHash('sha256').update(base).digest('hex');
}

function signActivation(payload: Omit<LedgerEntry, 'signature'>): string {
  const canonical = `${payload.uid}|${payload.plan}|${payload.amountYER}|${payload.transactionRef}|${payload.expiresAtMs}|${payload.issuedAtMs}`;
  return crypto.createHmac('sha256', getSigningSecret()).update(canonical).digest('hex');
}

function readLedger(): AiLedger {
  try {
    if (fs.existsSync(LEDGER_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(LEDGER_FILE, 'utf8'));
      return {
        byUid: parsed.byUid || {},
        usedRefs: parsed.usedRefs || {},
        usedHashes: parsed.usedHashes || {},
      };
    }
  } catch (_) {}
  return { byUid: {}, usedRefs: {}, usedHashes: {} };
}

function writeLedger(ledger: AiLedger): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(LEDGER_FILE, JSON.stringify(ledger, null, 2), 'utf8');
}

function normalizeDigits(raw: string | undefined | null): string {
  if (!raw) return '';
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  let out = '';
  for (const ch of String(raw)) {
    const arIdx = arabicDigits.indexOf(ch);
    const faIdx = persianDigits.indexOf(ch);
    if (arIdx !== -1) out += String(arIdx);
    else if (faIdx !== -1) out += String(faIdx);
    else out += ch;
  }
  return out.trim();
}

function normalizePhoneDigits(raw: string | undefined | null): string {
  return normalizeDigits(raw).replace(/[^0-9]/g, '');
}

function normalizeRefKey(raw: string | undefined | null): string {
  return normalizeDigits(raw).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
}

async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseUser> {
  const resp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );
  if (!resp.ok) {
    throw new Error('تعذر التحقق من جلسة الدخول الحالية، أعد تسجيل الدخول ثم حاول مجدداً.');
  }
  const data: any = await resp.json();
  const user = data?.users?.[0];
  if (!user || !user.localId) {
    throw new Error('جلسة Google غير صالحة أو منتهية.');
  }
  return {
    uid: String(user.localId),
    email: String(user.email || ''),
    emailVerified: Boolean(user.emailVerified),
    displayName: String(user.displayName || 'مشترك VIP'),
  };
}

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Optional Firestore Admin write when FIREBASE_SERVICE_ACCOUNT_JSON is provided
async function trySyncActivationToFirestore(
  user: VerifiedFirebaseUser,
  entry: LedgerEntry
): Promise<boolean> {
  const rawSa = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawSa) return false;
  try {
    const sa = JSON.parse(rawSa);
    const nowSec = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const claim = Buffer.from(
      JSON.stringify({
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/datastore',
        aud: 'https://oauth2.googleapis.com/token',
        iat: nowSec,
        exp: nowSec + 3600,
      })
    ).toString('base64url');
    const unsigned = `${header}.${claim}`;
    const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url');
    const jwt = `${unsigned}.${sig}`;

    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });
    if (!tokenResp.ok) return false;
    const { access_token } = (await tokenResp.json()) as { access_token: string };
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    const userDocUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${dbId}/documents/users/${user.uid}?updateMask.fieldPaths=subscriptionStatus&updateMask.fieldPaths=subscriptionPlan&updateMask.fieldPaths=subscriptionExpiresAt&updateMask.fieldPaths=activatedBy&updateMask.fieldPaths=updatedAt`;

    const patchResp = await fetch(userDocUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          subscriptionStatus: { stringValue: 'active' },
          subscriptionPlan: { stringValue: entry.plan },
          subscriptionExpiresAt: { timestampValue: new Date(entry.expiresAtMs).toISOString() },
          activatedBy: { stringValue: 'ai-gemini-verifier' },
          updatedAt: { timestampValue: new Date().toISOString() },
        },
      }),
    });
    return patchResp.ok;
  } catch (err) {
    console.warn('[AI Verifier] Optional Firestore Admin sync skipped:', err);
    return false;
  }
}

interface AiReceiptAnalysis {
  isPaymentReceipt: boolean;
  isJaibOrYemeniTransfer: boolean;
  detectedWalletProvider: 'jaib' | 'onecash' | 'mobilemoney' | 'jawali' | 'other';
  detectedWalletLabel: string;
  isSuccessful: boolean;
  isLikelyAuthentic: boolean;
  amountYER: number;
  receiverNumber: string;
  receiverMatchesTarget: boolean;
  senderPhone: string;
  transactionRef: string;
  transferDateText: string;
  confidence: number;
  reasonAr: string;
}

const RECEIPT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isPaymentReceipt: {
      type: Type.BOOLEAN,
      description: 'True only if image is a genuine financial transfer or wallet payment receipt screenshot.',
    },
    isJaibOrYemeniTransfer: {
      type: Type.BOOLEAN,
      description:
        'True if the receipt clearly belongs to Jaib (جيب), ONE Cash (ون كاش), Mobile Money (موبايل موني), Jawali (جوالي), or a compatible Yemeni electronic wallet.',
    },
    detectedWalletProvider: {
      type: Type.STRING,
      enum: ['jaib', 'onecash', 'mobilemoney', 'jawali', 'other'],
      description:
        'Identify which Yemeni wallet issued the receipt: jaib, onecash, mobilemoney, jawali, or other.',
    },
    detectedWalletLabel: {
      type: Type.STRING,
      description: 'Short Arabic/English name of the wallet seen on receipt, e.g. جيب، ون كاش، موبايل موني، جوالي.',
    },
    isSuccessful: {
      type: Type.BOOLEAN,
      description:
        'True only if the receipt confirms the transfer succeeded/completed (e.g. تمت العملية بنجاح, تحويل مشترك, بيانات الحركة, إيصال تحويل مكتمل), not failed, pending, or cancelled.',
    },
    isLikelyAuthentic: {
      type: Type.BOOLEAN,
      description:
        'True if the screenshot appears genuine without obvious digital editing, mismatched overlays, or blank/fake placeholders.',
    },
    amountYER: {
      type: Type.NUMBER,
      description: 'Numeric transfer amount in Yemeni Rials (YER), e.g. 500 or 1000 or 5000. Remove commas like 1,000 -> 1000. 0 if unreadable.',
    },
    receiverNumber: {
      type: Type.STRING,
      description: 'Recipient wallet/account/phone number shown on receipt (digits only preferred, e.g. 779676636).',
    },
    receiverMatchesTarget: {
      type: Type.BOOLEAN,
      description: 'True if the recipient number on the receipt matches 779676636 (ignoring +967 or 00967 prefix or spaces).',
    },
    senderPhone: {
      type: Type.STRING,
      description: 'Sender phone/account number if visible on the receipt, else empty string.',
    },
    transactionRef: {
      type: Type.STRING,
      description: 'Unique transaction/reference/operation number (رقم مرجع العملية / رقم العملية / رقم الحوالة) shown on the receipt, else empty string.',
    },
    transferDateText: {
      type: Type.STRING,
      description: 'Date and time shown on the receipt, else empty string.',
    },
    confidence: {
      type: Type.INTEGER,
      description: 'Confidence score from 0 to 100 in the authenticity and accuracy of extracted fields.',
    },
    reasonAr: {
      type: Type.STRING,
      description: 'Clear, concise Arabic explanation summarizing the verification decision and any mismatch.',
    },
  },
  required: [
    'isPaymentReceipt',
    'isJaibOrYemeniTransfer',
    'detectedWalletProvider',
    'detectedWalletLabel',
    'isSuccessful',
    'isLikelyAuthentic',
    'amountYER',
    'receiverNumber',
    'receiverMatchesTarget',
    'senderPhone',
    'transactionRef',
    'transferDateText',
    'confidence',
    'reasonAr',
  ],
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Allow cross-origin calls from Netlify production site if pointing to this API host
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      aiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
      telegramConfigured: Boolean(getTelegramBotToken()),
      wallet: JAIB_WALLET_NUMBER,
    });
  });

  // =========================================================================
  // Telegram Bot HLS Stream Proxy (Turbo Read-Ahead + Bounded RAM Cache)
  // =========================================================================
  const tgFilePathCache = new Map<string, { filePath: string; expiresAt: number }>();
  const tgFilePathInflight = new Map<string, Promise<string | null>>();

  const SEG_RAM_TTL_MS = 4 * 60 * 1000;
  const MAX_SEG_RAM_CACHE_BYTES = 128 * 1024 * 1024;
  const MAX_SINGLE_CACHEABLE_BYTES = 18 * 1024 * 1024;
  const MAX_BG_PREFETCH_CONCURRENCY = 6;

  const tgSegRamCache = new Map<string, { buf: Buffer; expiresAt: number }>();
  const tgSegInflight = new Map<string, Promise<Buffer | null>>();
  const tgSegOrderByFileId = new Map<string, { fileIds: string[]; index: number }>();
  let tgSegRamTotalBytes = 0;
  let activeBgPrefetches = 0;

  function getCachedSegBuffer(fileId: string): Buffer | null {
    const entry = tgSegRamCache.get(fileId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      tgSegRamTotalBytes = Math.max(0, tgSegRamTotalBytes - entry.buf.length);
      tgSegRamCache.delete(fileId);
      return null;
    }
    // Refresh LRU position
    tgSegRamCache.delete(fileId);
    tgSegRamCache.set(fileId, entry);
    return entry.buf;
  }

  function setCachedSegBuffer(fileId: string, buf: Buffer): void {
    if (!buf || buf.length === 0 || buf.length > MAX_SINGLE_CACHEABLE_BYTES) return;
    const now = Date.now();
    for (const [k, v] of tgSegRamCache.entries()) {
      if (now > v.expiresAt) {
        tgSegRamTotalBytes = Math.max(0, tgSegRamTotalBytes - v.buf.length);
        tgSegRamCache.delete(k);
      }
    }
    const existing = tgSegRamCache.get(fileId);
    if (existing) {
      tgSegRamTotalBytes = Math.max(0, tgSegRamTotalBytes - existing.buf.length);
      tgSegRamCache.delete(fileId);
    }
    while (tgSegRamTotalBytes + buf.length > MAX_SEG_RAM_CACHE_BYTES && tgSegRamCache.size > 0) {
      const oldestKey = tgSegRamCache.keys().next().value;
      if (!oldestKey) break;
      const oldestVal = tgSegRamCache.get(oldestKey);
      tgSegRamTotalBytes = Math.max(0, tgSegRamTotalBytes - (oldestVal ? oldestVal.buf.length : 0));
      tgSegRamCache.delete(oldestKey);
    }
    tgSegRamCache.set(fileId, { buf, expiresAt: now + SEG_RAM_TTL_MS });
    tgSegRamTotalBytes += buf.length;
  }

  async function resolveTelegramFilePath(token: string, rawId: string): Promise<string | null> {
    const cached = tgFilePathCache.get(rawId);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.filePath;
    }
    const pending = tgFilePathInflight.get(rawId);
    if (pending) return pending;

    const promise = (async () => {
      try {
        const gfResp = await fetch(
          `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(rawId)}`,
          { signal: AbortSignal.timeout(12000) }
        );
        const gfData: any = await gfResp.json();
        if (!gfData.ok || !gfData.result?.file_path) {
          return null;
        }
        tgFilePathCache.set(rawId, {
          filePath: gfData.result.file_path,
          expiresAt: Date.now() + 50 * 60 * 1000,
        });
        return String(gfData.result.file_path);
      } catch (_) {
        return null;
      } finally {
        tgFilePathInflight.delete(rawId);
      }
    })();

    tgFilePathInflight.set(rawId, promise);
    return promise;
  }

  function prefetchTelegramSegment(token: string, rawId: string): void {
    if (!rawId || getCachedSegBuffer(rawId) || tgSegInflight.has(rawId)) return;
    if (activeBgPrefetches >= MAX_BG_PREFETCH_CONCURRENCY) return;

    activeBgPrefetches++;
    const promise = (async (): Promise<Buffer | null> => {
      try {
        const filePath = await resolveTelegramFilePath(token, rawId);
        if (!filePath) return null;
        const upstreamUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
        const tgResp = await fetch(upstreamUrl, { signal: AbortSignal.timeout(35000) });
        if (!tgResp.ok) {
          tgFilePathCache.delete(rawId);
          return null;
        }
        const ab = await tgResp.arrayBuffer();
        const buf = Buffer.from(ab);
        setCachedSegBuffer(rawId, buf);
        return buf;
      } catch (_) {
        return null;
      } finally {
        activeBgPrefetches = Math.max(0, activeBgPrefetches - 1);
        tgSegInflight.delete(rawId);
      }
    })();

    tgSegInflight.set(rawId, promise);
  }

  function warmPlaylistAhead(token: string | null, fileIds: string[], startIndex: number, segPrefetchCount: number): void {
    if (!token || !Array.isArray(fileIds) || !fileIds.length) return;
    const endIdx = Math.min(fileIds.length, startIndex + segPrefetchCount);
    for (let i = startIndex; i < endIdx; i++) {
      prefetchTelegramSegment(token, fileIds[i]);
    }
    const pathWarmEnd = Math.min(fileIds.length, startIndex + 8);
    for (let i = endIdx; i < pathWarmEnd; i++) {
      void resolveTelegramFilePath(token, fileIds[i]);
    }
  }

  function sendBufferWithOptionalRange(req: Request, res: Response, buf: Buffer): void {
    const total = buf.length;
    res.setHeader('Content-Type', 'video/mp2t');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('X-Accel-Buffering', 'no');

    const rangeHeader = typeof req.headers.range === 'string' ? req.headers.range : '';
    const match = rangeHeader.match(/^bytes=(\d*)-(\d*)$/i);
    if (match) {
      let start = match[1] ? Number(match[1]) : 0;
      let end = match[2] ? Number(match[2]) : total - 1;
      if (!match[1] && match[2]) {
        const suffixLen = Number(match[2]);
        start = Math.max(0, total - suffixLen);
        end = total - 1;
      }
      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start >= total || end < start) {
        res.status(416).setHeader('Content-Range', `bytes */${total}`).end();
        return;
      }
      end = Math.min(end, total - 1);
      const slice = buf.subarray(start, end + 1);
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
      res.setHeader('Content-Length', String(slice.length));
      res.end(slice);
      return;
    }

    res.status(200);
    res.setHeader('Content-Length', String(total));
    res.end(buf);
  }

  app.get('/api/tg-playlist/:code.m3u8', (req: Request, res: Response) => {
    const code = String(req.params.code || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!code) {
      res.status(400).send('Invalid video code');
      return;
    }
    const manifestPath = path.join(ROOT_DIR, 'public', 'tg_hls', `${code}.json`);
    if (!fs.existsSync(manifestPath)) {
      res.status(404).send('Playlist not found');
      return;
    }
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const segs = Array.isArray(manifest.segments) ? manifest.segments : [];
      const fileIds: string[] = [];
      const lines = [
        '#EXTM3U',
        '#EXT-X-VERSION:3',
        `#EXT-X-TARGETDURATION:${manifest.targetDuration || 60}`,
        '#EXT-X-MEDIA-SEQUENCE:0',
        manifest.complete ? '#EXT-X-PLAYLIST-TYPE:VOD' : '#EXT-X-PLAYLIST-TYPE:EVENT',
      ];
      for (const seg of segs) {
        if (seg && seg.fileId) {
          fileIds.push(seg.fileId);
          lines.push(`#EXTINF:${Number(seg.duration).toFixed(3)},`);
          lines.push(`/api/tg-seg/${encodeURIComponent(seg.fileId)}.ts`);
        }
      }
      for (let i = 0; i < fileIds.length; i++) {
        tgSegOrderByFileId.set(fileIds[i], { fileIds, index: i });
      }
      if (manifest.complete) {
        lines.push('#EXT-X-ENDLIST');
      }
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
      res.setHeader('Cache-Control', manifest.complete ? 'public, max-age=3600' : 'no-cache');
      res.send(lines.join('\n'));

      // Pre-resolve first 8 Telegram file paths in background without blocking segment #0 stream
      warmPlaylistAhead(getTelegramBotToken(), fileIds, 0, 0);
    } catch (err: any) {
      res.status(500).send(err?.message || 'Failed to build playlist');
    }
  });

  app.get('/api/tg-seg/:fileId', async (req: Request, res: Response) => {
    const token = getTelegramBotToken();
    if (!token) {
      res.status(503).send('Telegram bot token not configured on server');
      return;
    }
    const rawId = String(req.params.fileId || '').replace(/\.ts$/i, '');
    if (!rawId || rawId.length > 200) {
      res.status(400).send('Invalid file id');
      return;
    }

    // Trigger non-blocking server read-ahead for upcoming 2 segments
    const orderEntry = tgSegOrderByFileId.get(rawId);
    if (orderEntry) {
      warmPlaylistAhead(token, orderEntry.fileIds, orderEntry.index + 1, 2);
    }

    try {
      const ramBuf = getCachedSegBuffer(rawId);
      if (ramBuf) {
        sendBufferWithOptionalRange(req, res, ramBuf);
        return;
      }

      const upstreamHeaders: Record<string, string> = {};
      if (req.headers.range) {
        upstreamHeaders['Range'] = String(req.headers.range);
      }

      let filePath = await resolveTelegramFilePath(token, rawId);
      if (!filePath) {
        res.status(404).send('Telegram segment not found');
        return;
      }

      let tgResp = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`, {
        headers: upstreamHeaders,
        signal: AbortSignal.timeout(55000),
      });
      if ((tgResp.status === 403 || tgResp.status === 404) && !req.headers.range) {
        tgFilePathCache.delete(rawId);
        filePath = await resolveTelegramFilePath(token, rawId);
        if (filePath) {
          tgResp = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`, {
            headers: upstreamHeaders,
            signal: AbortSignal.timeout(55000),
          });
        }
      }
      if (!tgResp.ok || !tgResp.body) {
        tgFilePathCache.delete(rawId);
        res.status(tgResp.status || 502).send('Upstream Telegram fetch failed');
        return;
      }

      res.status(tgResp.status);
      res.setHeader('Content-Type', 'video/mp2t');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('X-Accel-Buffering', 'no');
      const cl = tgResp.headers.get('content-length');
      const cr = tgResp.headers.get('content-range');
      if (cl) res.setHeader('Content-Length', cl);
      if (cr) res.setHeader('Content-Range', cr);

      const collectForCache = !req.headers.range && tgResp.status === 200;
      const chunks: Buffer[] = [];
      let collectBytes = 0;
      let cacheAborted = false;

      const nodeStream = Readable.fromWeb(tgResp.body as any);
      nodeStream.on('data', (chunk: Buffer | Uint8Array) => {
        if (collectForCache && !cacheAborted) {
          const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          if (collectBytes + b.length <= MAX_SINGLE_CACHEABLE_BYTES) {
            chunks.push(b);
            collectBytes += b.length;
          } else {
            cacheAborted = true;
            chunks.length = 0;
          }
        }
      });
      nodeStream.on('end', () => {
        if (collectForCache && !cacheAborted && chunks.length > 0) {
          setCachedSegBuffer(rawId, Buffer.concat(chunks, collectBytes));
        }
      });
      nodeStream.on('error', () => {
        if (!res.headersSent) res.status(502);
        res.end();
      });
      res.on('close', () => {
        if (!res.writableEnded) {
          cacheAborted = true;
          chunks.length = 0;
          try { nodeStream.destroy(); } catch (_) {}
        }
      });
      if (typeof (res as any).flushHeaders === 'function') {
        (res as any).flushHeaders();
      }
      nodeStream.pipe(res);
    } catch (err: any) {
      if (!res.headersSent) {
        res.status(502).send(err?.message || 'Telegram proxy error');
      }
    }
  });

  app.get('/api/subscription-status', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization || '';
      const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      if (!idToken) {
        res.status(401).json({ ok: false, error: 'Missing Authorization Bearer token' });
        return;
      }
      const user = await verifyFirebaseIdToken(idToken);
      const ledger = readLedger();
      const entry = ledger.byUid[user.uid];
      if (!entry) {
        res.json({ ok: true, active: false });
        return;
      }
      const expectedSig = signActivation({
        uid: entry.uid,
        email: entry.email,
        plan: entry.plan,
        amountYER: entry.amountYER,
        transactionRef: entry.transactionRef,
        senderPhone: entry.senderPhone,
        receiverNumber: entry.receiverNumber,
        imageHash: entry.imageHash,
        expiresAtMs: entry.expiresAtMs,
        issuedAtMs: entry.issuedAtMs,
        confidence: entry.confidence,
        reasonAr: entry.reasonAr,
      });
      const valid = entry.signature === expectedSig && entry.expiresAtMs > Date.now();
      res.json({
        ok: true,
        active: valid,
        plan: entry.plan,
        expiresAtMs: entry.expiresAtMs,
        transactionRef: entry.transactionRef,
        amountYER: entry.amountYER,
      });
    } catch (err: any) {
      res.status(401).json({ ok: false, error: err?.message || 'Unauthorized' });
    }
  });

  app.post('/api/verify-jaib-receipt', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization || '';
      const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      if (!idToken) {
        res.status(401).json({ ok: false, error: 'يجب تسجيل الدخول بحساب Google أولاً قبل فحص الإشعار.' });
        return;
      }

      const user = await verifyFirebaseIdToken(idToken);
      const body = req.body || {};
      const requestedPlan: 'monthly' | 'yearly' = body.plan === 'yearly' ? 'yearly' : 'monthly';
      const requestedWallet: WalletProvider = normalizeWalletProvider(body.walletProvider);
      const requestedWalletLabel = WALLET_LABELS[requestedWallet];
      const senderPhoneInput = normalizePhoneDigits(body.senderPhone || '');
      const manualRefInput = String(body.transactionRef || '').trim();
      const mimeType = String(body.mimeType || 'image/jpeg').trim();
      let imageBase64 = String(body.imageBase64 || '').trim();

      if (imageBase64.startsWith('data:')) {
        const commaIdx = imageBase64.indexOf(',');
        if (commaIdx !== -1) imageBase64 = imageBase64.slice(commaIdx + 1);
      }

      if (!imageBase64 || imageBase64.length < 200) {
        res.status(400).json({ ok: false, error: `يرجى إرفاق صورة إشعار تحويل واضحة من محفظة ${requestedWalletLabel}.` });
        return;
      }

      if (!/^image\/(jpeg|jpg|png|webp|gif|heic)$/i.test(mimeType)) {
        res.status(400).json({ ok: false, error: 'صيغة الصورة غير مدعومة، يرجى رفع صورة PNG أو JPG أو WEBP.' });
        return;
      }

      const imageHash = crypto.createHash('sha256').update(imageBase64).digest('hex');
      const ledger = readLedger();
      const existingHashOwner = ledger.usedHashes[imageHash];
      if (existingHashOwner && existingHashOwner.uid !== user.uid) {
        res.status(409).json({
          ok: false,
          verified: false,
          activated: false,
          error: 'تم استخدام صورة هذا الإشعار مسبقاً لحساب آخر. يرجى إرسال إشعار تحويل جديد خاص بك.',
        });
        return;
      }

      const ai = getAiClient();
      if (!ai) {
        res.status(503).json({
          ok: false,
          verified: false,
          activated: false,
          error: 'خدمة تحليل الإشعارات بالذكاء الاصطناعي غير مفعلة على السيرفر حالياً (GEMINI_API_KEY غير مضاف).',
        });
        return;
      }

      const analysisPrompt = `أنت نظام تدقيق مالي فائق الدقة لمنصة «تذكرة دخول VIP» في اليمن.
مهمتك فحص صورة إشعار التحويل المرفقة والتأكد بصدق مما إذا كان المشترك قد حوّل الاشتراك عبر أي من المحافظ اليمنية المعتمدة للمنصة إلى الرقم الرسمي الموحد: ${JAIB_WALLET_NUMBER}.

المحافظ اليمنية المعتمدة للمنصة (جميعها على نفس الرقم ${JAIB_WALLET_NUMBER}):
1. محفظة جيب (Jaib) — تظهر غالباً بعنوان «بيانات الحركة» أو «تحويل مشترك» مع «رقم مرجع العملية» و«المستفيد».
2. محفظة ون كاش (ONE Cash).
3. محفظة موبايل موني (Mobile Money).
4. محفظة جوالي (Jawali).
- المحفظة التي اختارها المستخدم في الواجهة: ${requestedWalletLabel}

تفاصيل الباقات المعتمدة:
- الباقة الشهرية: 500 ريال يمني (30 يوم)
- الباقة السنوية: 5000 ريال يمني (365 يوم)
- الباقة التي اختارها المستخدم الآن: ${requestedPlan === 'yearly' ? 'الباقة السنوية (5000 ريال)' : 'الباقة الشهرية (500 ريال)'}

قواعد التحقق الصارمة:
1. تأكد أن الصورة فعلاً إشعار/إيصال تحويل مالي حقيقي مكتمل من إحدى المحافظ اليمنية (جيب، ون كاش، موبايل موني، جوالي)، وليست صورة عشوائية أو محادثة أو إيصال فاشل/ملغى/قيد الانتظار.
2. حدد اسم المحفظة الظاهرة في الإشعار (detectedWalletProvider و detectedWalletLabel).
3. استخرج المبلغ بالريال اليمني بدقة (حوّل الأرقام العربية الهندية مثل ٥٠٠ أو ٥٠٠٠ وأزل الفواصل مثل 1,000 -> 1000).
4. استخرج رقم المستلم أو الحساب المحوّل إليه (تحت خانة المستفيد / إلى / رقم الحساب) وتأكد هل يطابق الرقم الرسمي (${JAIB_WALLET_NUMBER}) مع أو بدون مفتاح الدولة (967+ أو 00967).
5. استخرج رقم العملية / رقم مرجع العملية / رقم الحوالة / رقم السند بدقة، وكذلك رقم هاتف المرسل والتاريخ إن وجد.
6. افحص مظهر الإشعار بحثاً عن أي تزوير واضح أو تعديل بدائي أو فراغات مشبوهة في الخطوط.
7. اكتب سبب القرار باللغة العربية في الحقل reasonAr بوضوح ولباقة للمستخدم مع ذكر اسم المحفظة.`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType,
                data: imageBase64,
              },
            },
            { text: analysisPrompt },
          ],
        },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
          responseMimeType: 'application/json',
          responseSchema: RECEIPT_RESPONSE_SCHEMA,
        },
      });

      const rawText = (aiResponse.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({
          ok: false,
          verified: false,
          activated: false,
          error: 'لم يتمكن الذكاء الاصطناعي من قراءة الإشعار. يرجى التقاط صورة أوضح والمحاولة مجدداً.',
        });
        return;
      }

      const analysis: AiReceiptAnalysis = JSON.parse(rawText);
      const detectedReceiverDigits = normalizePhoneDigits(analysis.receiverNumber);
      const receiverOk =
        analysis.receiverMatchesTarget || detectedReceiverDigits.endsWith(JAIB_WALLET_NUMBER);

      const detectedAmount = Math.round(Number(analysis.amountYER) || 0);
      const effectivePlan: 'monthly' | 'yearly' =
        detectedAmount >= YEARLY_PRICE_YER ? 'yearly' : requestedPlan;
      const requiredAmount = effectivePlan === 'yearly' ? YEARLY_PRICE_YER : MONTHLY_PRICE_YER;
      const amountOk = detectedAmount >= requiredAmount;

      const finalTransactionRef =
        (analysis.transactionRef && analysis.transactionRef.trim()) || manualRefInput;
      const refKey = normalizeRefKey(finalTransactionRef);

      let rejectionReason = '';
      if (!analysis.isPaymentReceipt) {
        rejectionReason = analysis.reasonAr || 'الصورة المرفوعة لا تبدو كإشعار تحويل مالي من إحدى المحافظ المعتمدة.';
      } else if (!analysis.isSuccessful) {
        rejectionReason = analysis.reasonAr || 'الإشعار لا يُظهر اكتمال عملية التحويل بنجاح.';
      } else if (!analysis.isLikelyAuthentic || analysis.confidence < 70) {
        rejectionReason = analysis.reasonAr || 'تعذر التحقق بثقة كافية من موثوقية الإشعار، يرجى رفع لقطة شاشة أصلية أوضح.';
      } else if (!receiverOk) {
        rejectionReason = `رقم المستلم في الإشعار (${analysis.receiverNumber || 'غير واضح'}) لا يطابق رقم الحساب الرسمي للمنصة (${JAIB_WALLET_NUMBER}).`;
      } else if (!amountOk) {
        rejectionReason = `المبلغ الظاهر في الإشعار (${detectedAmount} ريال) أقل من قيمة الباقة المطلوبة (${requiredAmount} ريال).`;
      } else if (refKey.length < 3) {
        rejectionReason = 'لم يتم رصد رقم مرجع العملية في الإشعار. يرجى كتابة رقم العملية يدوياً أو رفع صورة أوضح.';
      }

      if (rejectionReason) {
        res.json({
          ok: true,
          verified: false,
          activated: false,
          error: rejectionReason,
          analysis: {
            ...analysis,
            amountYER: detectedAmount,
            transactionRef: finalTransactionRef,
            receiverMatchesTarget: receiverOk,
            imageHash,
          },
        });
        return;
      }

      const existingRefOwner = ledger.usedRefs[refKey];
      if (existingRefOwner && existingRefOwner.uid !== user.uid) {
        res.status(409).json({
          ok: false,
          verified: false,
          activated: false,
          error: `رقم العملية (${finalTransactionRef}) مستخدم مسبقاً لتفعيل حساب آخر.`,
          analysis: {
            ...analysis,
            amountYER: detectedAmount,
            transactionRef: finalTransactionRef,
            receiverMatchesTarget: receiverOk,
            imageHash,
          },
        });
        return;
      }

      const nowMs = Date.now();
      const existingUserPass = ledger.byUid[user.uid];
      const isSameSubmission =
        existingUserPass &&
        (normalizeRefKey(existingUserPass.transactionRef) === refKey ||
          existingUserPass.imageHash === imageHash);

      const days = effectivePlan === 'yearly' ? 365 : 30;
      const baseMs =
        !isSameSubmission && existingUserPass && existingUserPass.expiresAtMs > nowMs
          ? existingUserPass.expiresAtMs
          : nowMs;

      const resolvedWallet: WalletProvider =
        analysis.detectedWalletProvider && analysis.detectedWalletProvider !== 'other'
          ? normalizeWalletProvider(analysis.detectedWalletProvider)
          : requestedWallet;
      const resolvedWalletLabel = WALLET_LABELS[resolvedWallet];

      const entryWithoutSig: Omit<LedgerEntry, 'signature'> = isSameSubmission
        ? {
            uid: existingUserPass.uid,
            email: existingUserPass.email,
            plan: existingUserPass.plan,
            walletProvider: existingUserPass.walletProvider || resolvedWallet,
            amountYER: existingUserPass.amountYER,
            transactionRef: existingUserPass.transactionRef,
            senderPhone: existingUserPass.senderPhone,
            receiverNumber: existingUserPass.receiverNumber,
            imageHash: existingUserPass.imageHash,
            expiresAtMs: existingUserPass.expiresAtMs,
            issuedAtMs: existingUserPass.issuedAtMs,
            confidence: existingUserPass.confidence,
            reasonAr: existingUserPass.reasonAr,
          }
        : {
            uid: user.uid,
            email: user.email,
            plan: effectivePlan,
            walletProvider: resolvedWallet,
            amountYER: detectedAmount,
            transactionRef: finalTransactionRef,
            senderPhone: normalizePhoneDigits(analysis.senderPhone) || senderPhoneInput,
            receiverNumber: detectedReceiverDigits || JAIB_WALLET_NUMBER,
            imageHash,
            expiresAtMs: baseMs + days * 24 * 60 * 60 * 1000,
            issuedAtMs: nowMs,
            confidence: Math.round(Number(analysis.confidence) || 90),
            reasonAr: analysis.reasonAr || `تم التحقق من إشعار ${resolvedWalletLabel} بنجاح عبر الذكاء الاصطناعي.`,
          };

      const entry: LedgerEntry = {
        ...entryWithoutSig,
        signature: signActivation(entryWithoutSig),
      };

      ledger.byUid[user.uid] = entry;
      ledger.usedRefs[refKey] = { uid: user.uid, issuedAtMs: entry.issuedAtMs };
      ledger.usedHashes[imageHash] = { uid: user.uid, issuedAtMs: entry.issuedAtMs };
      writeLedger(ledger);

      const firestoreAdminSynced = await trySyncActivationToFirestore(user, entry);

      res.json({
        ok: true,
        verified: true,
        activated: true,
        firestoreAdminSynced,
        activation: {
          plan: entry.plan,
          walletProvider: resolvedWallet,
          walletLabel: resolvedWalletLabel,
          amountYER: entry.amountYER,
          transactionRef: entry.transactionRef,
          senderPhone: entry.senderPhone,
          expiresAtMs: entry.expiresAtMs,
          issuedAtMs: entry.issuedAtMs,
          days,
        },
        analysis: {
          ...analysis,
          walletProvider: resolvedWallet,
          walletLabel: resolvedWalletLabel,
          amountYER: detectedAmount,
          transactionRef: finalTransactionRef,
          receiverMatchesTarget: true,
          imageHash,
        },
      });
    } catch (err: any) {
      console.error('[AI Receipt Verification Error]', err);
      const msg = String(err?.message || '');
      if (msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED')) {
        res.status(403).json({
          ok: false,
          error: 'مفتاح Gemini API غير صالح أو مرفوض. يرجى التحقق من Settings > Secrets.',
        });
        return;
      }
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
        res.status(429).json({
          ok: false,
          error: 'تم تجاوز حد الطلبات المؤقت لخدمة الذكاء الاصطناعي، حاول بعد دقيقة.',
        });
        return;
      }
      res.status(500).json({
        ok: false,
        error: msg || 'حدث خطأ أثناء تحليل الإشعار، حاول مجدداً.',
      });
    }
  });

  // Google Search Console verification file & static public assets
  app.get('/googleaaffbd287cd065c7.html', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send('google-site-verification: googleaaffbd287cd065c7.html');
  });

  app.get('/sw.js', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(ROOT_DIR, 'public', 'sw.js'));
  });

  app.use(express.static(path.join(ROOT_DIR, 'public')));

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use('*', async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (req.originalUrl.startsWith('/api/')) {
          res.status(404).json({ ok: false, error: 'API endpoint not found' });
          return;
        }
        const htmlPath = path.join(ROOT_DIR, 'index.html');
        let html = fs.readFileSync(htmlPath, 'utf8');
        html = await vite.transformIndexHtml(req.originalUrl, html);
        res.status(200).set({
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }).end(html);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distDir = path.join(ROOT_DIR, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
    }
    app.use('*', (_req: Request, res: Response) => {
      const distIndex = path.join(distDir, 'index.html');
      const rootIndex = path.join(ROOT_DIR, 'index.html');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(fs.existsSync(distIndex) ? distIndex : rootIndex);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tadhkira VIP server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
