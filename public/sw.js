// Service Worker for Tadhkira VIP (تذكرة دخول)
// High Performance Fresh-First & Fast Cache Engine (v120)
const CACHE_VERSION = 'v120_telegram_only';
const CACHE_STATIC = `tadhkira-static-${CACHE_VERSION}`;
const CACHE_IMAGES = `tadhkira-images-${CACHE_VERSION}`;
const CACHE_CDN = `tadhkira-cdn-${CACHE_VERSION}`;
const CACHE_OFFLINE_VOD = 'tadhkira-offline-vod-v1';

const STATIC_PRECACHE = [
  '/',
  '/index.html',
  '/css/tailwind.min.css',
  '/css/style.css',
  '/js/app.js',
  '/js/prayer.js',
  '/live_channels.js',
  '/catalog.js',
  '/catalog.json',
  '/curated_catalog.json',
  '/manifest.webmanifest',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/logos/wallets/jaib.png',
  '/logos/wallets/onecash.png',
  '/logos/wallets/mobilemoney.png',
  '/logos/wallets/jawali.png'
];

// Offline SVG Fallback Image Generator (Zero Network Overhead)
const OFFLINE_IMAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#050811"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)"/>
  <rect x="15" y="15" width="270" height="420" rx="16" fill="#111827" stroke="#f59e0b" stroke-opacity="0.3" stroke-width="2"/>
  <circle cx="150" cy="210" r="40" fill="#1f2937" stroke="#f59e0b" stroke-width="2"/>
  <polygon points="143,196 165,210 143,224" fill="#f59e0b"/>
  <text x="150" y="280" fill="#9ca3af" font-family="sans-serif" font-size="14" text-anchor="middle" font-weight="bold">تذكرة VIP</text>
  <text x="150" y="305" fill="#6b7280" font-family="sans-serif" font-size="11" text-anchor="middle">جاري التحميل في الخلفية</text>
</svg>`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_STATIC).then(async (cache) => {
      for (const asset of STATIC_PRECACHE) {
        try {
          await cache.add(asset);
        } catch (err) {
          // Non-critical if optional asset fails
        }
      }
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      const activeCaches = [CACHE_STATIC, CACHE_IMAGES, CACHE_CDN, CACHE_OFFLINE_VOD];
      return Promise.all(
        keys.map((key) => {
          if (!activeCaches.includes(key)) {
            console.log('[SW] Clearing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Serve saved offline Telegram HLS playlists/segments directly from Cache Storage (0 MB when cached)
  const isTelegramVodRequest =
    request.method === 'GET' &&
    (url.pathname.startsWith('/api/tg-playlist/') ||
      url.pathname.startsWith('/api/tg-seg/') ||
      url.pathname.startsWith('/playlist/') ||
      url.pathname.startsWith('/seg/'));

  if (isTelegramVodRequest) {
    event.respondWith(
      caches.open(CACHE_OFFLINE_VOD).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        return fetch(request);
      })
    );
    return;
  }

  // Skip non-GET requests, API endpoints, internal browser protocols, & video/media streams
  if (request.method !== 'GET' || !url.protocol.startsWith('http') || url.pathname.startsWith('/api/')) return;

  // CRITICAL: Never intercept Firebase, Firestore WebChannel/REST, Google Auth, or live video streams
  const host = url.hostname.toLowerCase();
  const isGoogleOrFirebaseApi =
    (host.endsWith('googleapis.com') && host !== 'fonts.googleapis.com') ||
    (host.endsWith('gstatic.com') && host !== 'fonts.gstatic.com') ||
    host.endsWith('firebaseapp.com') ||
    host.endsWith('firebaseio.com') ||
    host.endsWith('firebase.google.com') ||
    host.endsWith('accounts.google.com') ||
    host.endsWith('google.com');

  const isVideoOrStream =
    request.destination === 'video' ||
    request.destination === 'audio' ||
    /\.(m3u8|ts|mp4|mkv|webm|mpd)(\?|$)/i.test(url.pathname);

  if (isGoogleOrFirebaseApi || isVideoOrStream) return;

  // 1. Navigation requests (HTML shell) -> Network first, fallback to cached
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_STATIC).then((cache) => cache.put('/index.html', clone));
        }
        return networkResponse;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 2. All Images: Posters, Backdrops, Actors, Icons, SVGs -> Cache First for instant rendering
  const isImage = request.destination === 'image' ||
                  url.pathname.match(/\.(png|jpg|jpeg|webp|svg|gif|avif)$/i) ||
                  url.pathname.startsWith('/posters/') ||
                  url.pathname.startsWith('/backdrops/') ||
                  url.pathname.startsWith('/actors/') ||
                  url.pathname.startsWith('/logos/');

  if (isImage) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const contentType = networkResponse.headers.get('content-type') || '';
            // Only cache valid images, never cache SPA HTML fallback
            if (!contentType.includes('text/html')) {
              const clone = networkResponse.clone();
              caches.open(CACHE_IMAGES).then((cache) => cache.put(request, clone));
              return networkResponse;
            }
          }
          return new Response(OFFLINE_IMAGE_SVG, {
            headers: {
              'Content-Type': 'image/svg+xml',
              'Cache-Control': 'public, max-age=86400'
            }
          });
        }).catch(() => {
          return new Response(OFFLINE_IMAGE_SVG, {
            headers: {
              'Content-Type': 'image/svg+xml',
              'Cache-Control': 'public, max-age=86400'
            }
          });
        });
      })
    );
    return;
  }

  // 3. Static CDN scripts & fonts (Tailwind, FontAwesome, Google Fonts, Swiper, Plyr, HLS.js) -> Cache First
  const isCdn = host === 'cdn.jsdelivr.net' ||
                host === 'fonts.googleapis.com' ||
                host === 'fonts.gstatic.com' ||
                host === 'cdnjs.cloudflare.com';

  if (isCdn) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_CDN).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        }).catch(() => {
          if (request.destination === 'script') {
            return new Response('/* Offline fallback */', { headers: { 'Content-Type': 'application/javascript' } });
          }
          if (request.destination === 'style') {
            return new Response('/* Offline fallback */', { headers: { 'Content-Type': 'text/css' } });
          }
          return cached || Response.error();
        });
      })
    );
    return;
  }

  // 4. Local Core Assets (Catalog, JS, HTML): Network-First
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_STATIC).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // All other third-party requests bypass SW completely
});
