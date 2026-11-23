import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const JAIB_WALLET_NUMBER = '779676636';
const MONTHLY_PRICE_YER = 500;
const YEARLY_PRICE_YER = 5000;

function loadFirebaseConfig() {
  const candidates = [
    path.join(process.cwd(), 'firebase-applet-config.json'),
    path.join(process.cwd(), '..', '..', 'firebase-applet-config.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  }
  return { apiKey: process.env.FIREBASE_WEB_API_KEY || '' };
}

function normalizeDigits(raw = '') {
  const ar = '٠١٢٣٤٥٦٧٨٩';
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  return String(raw)
    .split('')
    .map((ch) => {
      const i = ar.indexOf(ch);
      if (i !== -1) return String(i);
      const j = fa.indexOf(ch);
      if (j !== -1) return String(j);
      return ch;
    })
    .join('')
    .trim();
}

export async function handler(event) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'Method Not Allowed' }) };
  }

  try {
    const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!idToken) {
      return { statusCode: 401, headers, body: JSON.stringify({ ok: false, error: 'يجب تسجيل الدخول أولاً.' }) };
    }

    const fb = loadFirebaseConfig();
    if (!fb.apiKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'Firebase API key unavailable' }) };
    }

    const verifyResp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(fb.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!verifyResp.ok) {
      return { statusCode: 401, headers, body: JSON.stringify({ ok: false, error: 'جلسة الدخول غير صالحة.' }) };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ ok: false, error: 'GEMINI_API_KEY غير مضبوط في إعدادات Netlify.' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const requestedPlan = body.plan === 'yearly' ? 'yearly' : 'monthly';
    const walletMap = {
      jaib: 'جيب (Jaib)',
      onecash: 'ون كاش (ONE Cash)',
      mobilemoney: 'موبايل موني (Mobile Money)',
      jawali: 'جوالي (Jawali)',
    };
    const requestedWallet = walletMap[body.walletProvider] ? body.walletProvider : 'jaib';
    const mimeType = String(body.mimeType || 'image/jpeg');
    let imageBase64 = String(body.imageBase64 || '').trim();
    if (imageBase64.startsWith('data:')) {
      const idx = imageBase64.indexOf(',');
      if (idx !== -1) imageBase64 = imageBase64.slice(idx + 1);
    }
    if (!imageBase64 || imageBase64.length < 200) {
      return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'يرجى رفع صورة إشعار واضحة.' }) };
    }

    const imageHash = crypto.createHash('sha256').update(imageBase64).digest('hex');
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType, data: imageBase64 } },
          {
            text: `افحص صورة إشعار التحويل المرفقة عبر المحافظ اليمنية المعتمدة (جيب، ون كاش، موبايل موني، جوالي) إلى الرقم ${JAIB_WALLET_NUMBER}. المحفظة المختارة: ${walletMap[requestedWallet]}. الباقة المختارة: ${
              requestedPlan === 'yearly' ? 'سنوية (5000 ريال)' : 'شهرية (500 ريال)'
            }. استخرج المبلغ ورقم المستلم ورقم العملية وتأكد من نجاح العملية وموثوقية الإشعار واكتب السبب بالعربية.`,
          },
        ],
      },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isPaymentReceipt: { type: Type.BOOLEAN },
            isJaibOrYemeniTransfer: { type: Type.BOOLEAN },
            detectedWalletProvider: { type: Type.STRING, enum: ['jaib', 'onecash', 'mobilemoney', 'jawali', 'other'] },
            detectedWalletLabel: { type: Type.STRING },
            isSuccessful: { type: Type.BOOLEAN },
            isLikelyAuthentic: { type: Type.BOOLEAN },
            amountYER: { type: Type.NUMBER },
            receiverNumber: { type: Type.STRING },
            receiverMatchesTarget: { type: Type.BOOLEAN },
            senderPhone: { type: Type.STRING },
            transactionRef: { type: Type.STRING },
            transferDateText: { type: Type.STRING },
            confidence: { type: Type.INTEGER },
            reasonAr: { type: Type.STRING },
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
        },
      },
    });

    const analysis = JSON.parse((aiResponse.text ?? '{}').trim());
    const receiverDigits = normalizeDigits(analysis.receiverNumber).replace(/[^0-9]/g, '');
    const receiverOk = analysis.receiverMatchesTarget || receiverDigits.endsWith(JAIB_WALLET_NUMBER);
    const amountYER = Math.round(Number(analysis.amountYER) || 0);
    const effectivePlan = amountYER >= YEARLY_PRICE_YER ? 'yearly' : requestedPlan;
    const reqAmount = effectivePlan === 'yearly' ? YEARLY_PRICE_YER : MONTHLY_PRICE_YER;
    const resolvedWallet =
      analysis.detectedWalletProvider && walletMap[analysis.detectedWalletProvider]
        ? analysis.detectedWalletProvider
        : requestedWallet;
    const valid =
      analysis.isPaymentReceipt &&
      analysis.isSuccessful &&
      analysis.isLikelyAuthentic &&
      Number(analysis.confidence) >= 70 &&
      receiverOk &&
      amountYER >= reqAmount;

    const days = effectivePlan === 'yearly' ? 365 : 30;
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        verified: valid,
        activated: valid,
        error: valid ? null : analysis.reasonAr || 'تعذر تأكيد الإشعار، تحقق من المبلغ أو رقم المستلم.',
        activation: valid
          ? {
              plan: effectivePlan,
              walletProvider: resolvedWallet,
              walletLabel: walletMap[resolvedWallet],
              amountYER,
              transactionRef: analysis.transactionRef || body.transactionRef || '',
              senderPhone: normalizeDigits(analysis.senderPhone || body.senderPhone || '').replace(/[^0-9]/g, ''),
              expiresAtMs: Date.now() + days * 24 * 60 * 60 * 1000,
              issuedAtMs: Date.now(),
              days,
            }
          : null,
        analysis: { ...analysis, walletProvider: resolvedWallet, walletLabel: walletMap[resolvedWallet], amountYER, receiverMatchesTarget: receiverOk, imageHash },
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: err?.message || 'Verification failed' }),
    };
  }
}
