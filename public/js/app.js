/**
 * Tadhkira VIP - Core Engine & Media Catalog (تذكرة دخول)
 * High-Performance Modular Engine
 */

const FAVORITES_STORAGE_KEY = 'tadhkira_user_favorites';

function loadFavoritesFromStorage() {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch (e) {}
  return new Set();
}

function saveFavoritesToStorage() {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(appState.favorites)));
  } catch (e) {}
}

function isFavorite(id) {
  return appState.favorites && appState.favorites.has(id);
}

function updateFavoritesBadge() {
  const count = appState.favorites ? appState.favorites.size : 0;
  const badges = document.querySelectorAll('.fav-count-badge');
  badges.forEach(b => {
    b.textContent = count;
    if (count > 0) {
      b.classList.remove('hidden');
    } else {
      b.classList.add('hidden');
    }
  });
}

function showToast(message) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'fixed bottom-5 left-5 z-[100] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'px-4 py-2.5 rounded-xl bg-dark-900/95 text-white border border-brand/40 shadow-2xl backdrop-blur-md text-xs font-bold flex items-center gap-2 transform translate-y-2 opacity-0 transition-all duration-300 pointer-events-auto';
  toast.innerHTML = message;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });
  setTimeout(() => {
    toast.classList.add('opacity-0', '-translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

const appState = {
  activeNavTab: 'all',
  activeSubGenre: 'all',
  activeLiveCategory: 'all',
  activeLiveSourceKey: 'primary',
  activeSeriesOrigin: 'all',
  activeSearchFilter: 'all',
  isFullSearchActive: false,
  lastSearchResults: [],
  activeActorId: null,
  searchQuery: '',
  predictiveResults: [],
  selectedPredictiveIndex: -1,
  allMedia: [],
  liveChannels: [],
  favorites: loadFavoritesFromStorage(),
  player: null,
  hls: null,
  currentItem: null,
  currentSeries: null,
  currentEmbedUrl: '',
  activeServer: 'telegram',
  selectedQuality: 'auto',
  swiperInstances: [],
  dataSaverMode: true,
  isOffline: !navigator.onLine,
  preferredVodSource: 'telegram_480'
};

const OFFLINE_VOD_CACHE_NAME = 'tadhkira-offline-vod-v1';
const OFFLINE_VOD_META_KEY = 'tadhkira_offline_vod_items_v1';
const VOD_RESUME_STORAGE_KEY = 'tadhkira_vod_resume_pos_v1';
const vodOfflineDownloads = new Map();

function getTelegramWorkerBase() {
  try {
    const winUrl = typeof window.TADHKIRA_TG_WORKER_URL === 'string' ? window.TADHKIRA_TG_WORKER_URL.trim() : '';
    if (winUrl) return winUrl.replace(/\/+$/, '');
    const lsUrl = localStorage.getItem('tadhkira_tg_worker_url') || '';
    if (lsUrl.trim()) return lsUrl.trim().replace(/\/+$/, '');
  } catch (_) {}
  return '';
}

function getTelegramPlaylistUrl(tgCode) {
  if (!tgCode) return '';
  const workerBase = getTelegramWorkerBase();
  if (workerBase) return `${workerBase}/playlist/${encodeURIComponent(tgCode)}.m3u8`;
  return `/api/tg-playlist/${encodeURIComponent(tgCode)}.m3u8`;
}

function getOfflineVodMap() {
  try {
    const raw = localStorage.getItem(OFFLINE_VOD_META_KEY);
    if (raw) return JSON.parse(raw) || {};
  } catch (_) {}
  return {};
}

function isTelegramMovieCachedOffline(tgCode) {
  if (!tgCode) return false;
  const map = getOfflineVodMap();
  return Boolean(map[tgCode] && map[tgCode].complete);
}

function isTelegramStreamReachable(tgCode) {
  if (!tgCode) return false;
  if (isTelegramMovieCachedOffline(tgCode)) return true;
  if (getTelegramWorkerBase()) return true;
  const host = (window.location && window.location.hostname || '').toLowerCase();
  // Static Netlify requires Cloudflare Worker URL unless running on Node Express server
  if (host.endsWith('netlify.app')) return false;
  return true;
}

function getSavedVodResumeTime(mediaId) {
  if (!mediaId) return 0;
  try {
    const map = JSON.parse(localStorage.getItem(VOD_RESUME_STORAGE_KEY) || '{}');
    return Number(map[mediaId]) || 0;
  } catch (_) {
    return 0;
  }
}

function saveVodResumeTime(mediaId, seconds) {
  if (!mediaId || !Number.isFinite(seconds)) return;
  try {
    const map = JSON.parse(localStorage.getItem(VOD_RESUME_STORAGE_KEY) || '{}');
    if (seconds < 10) {
      delete map[mediaId];
    } else {
      map[mediaId] = Math.floor(seconds);
    }
    localStorage.setItem(VOD_RESUME_STORAGE_KEY, JSON.stringify(map));
  } catch (_) {}
}

// =========================================================================
// INTERSECTION OBSERVER LAZY LOADING ENGINE (Images, Videos, Iframes & Sections)
// Prevents wasted network requests & CPU decoding during fast scrolling
// =========================================================================
const LAZY_TRANSPARENT_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const lazyMediaState = {
  imgObserver: null,
  videoObserver: null,
  sectionObserver: null,
  lazyTimers: new WeakMap(),
  sectionBuilders: new Map(),
};

function hydrateLazyImage(img) {
  if (!img) return;
  const pendingTimer = lazyMediaState.lazyTimers.get(img);
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    lazyMediaState.lazyTimers.delete(img);
  }
  const targetSrc = img.getAttribute('data-src');
  if (!targetSrc) {
    img.classList.add('is-loaded');
    return;
  }
  img.removeAttribute('data-src');
  const markLoaded = () => img.classList.add('is-loaded');
  img.addEventListener('load', markLoaded, { once: true });
  img.addEventListener('error', markLoaded, { once: true });
  img.src = targetSrc;
  if (img.complete && img.naturalWidth > 0) {
    markLoaded();
  }
  if (lazyMediaState.imgObserver) {
    try { lazyMediaState.imgObserver.unobserve(img); } catch (e) {}
  }
}

function hydrateLazyVideoOrIframe(el) {
  if (!el) return;
  if (el.tagName === 'IFRAME') {
    const iframeSrc = el.getAttribute('data-src');
    if (iframeSrc) {
      el.removeAttribute('data-src');
      el.src = iframeSrc;
    }
    if (lazyMediaState.videoObserver) {
      try { lazyMediaState.videoObserver.unobserve(el); } catch (e) {}
    }
    return;
  }
  if (el.tagName === 'VIDEO') {
    const dataPoster = el.getAttribute('data-poster');
    if (dataPoster) {
      el.poster = dataPoster;
      el.removeAttribute('data-poster');
    }
    let changed = false;
    const videoSrc = el.getAttribute('data-src');
    if (videoSrc) {
      el.src = videoSrc;
      el.removeAttribute('data-src');
      changed = true;
    }
    el.querySelectorAll('source[data-src]').forEach(sourceEl => {
      const s = sourceEl.getAttribute('data-src');
      if (s) {
        sourceEl.src = s;
        sourceEl.removeAttribute('data-src');
        changed = true;
      }
    });
    if (changed) {
      el.preload = 'metadata';
      try { el.load(); } catch (e) {}
    }
  }
}

function pauseOffscreenVideo(video) {
  if (!video || video.tagName !== 'VIDEO' || video.id === 'flynetPlayer') return;
  try {
    if (!video.paused) {
      video.pause();
    }
  } catch (e) {}
}

function initLazyObservers() {
  if (typeof IntersectionObserver === 'undefined') return;

  if (!lazyMediaState.imgObserver) {
    lazyMediaState.imgObserver = new IntersectionObserver((entries) => {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const img = entry.target;
        if (entry.isIntersecting) {
          if (!img.hasAttribute('data-src')) {
            lazyMediaState.imgObserver.unobserve(img);
            continue;
          }
          if (!lazyMediaState.lazyTimers.has(img)) {
            // Brief settle delay cancels downloads for elements skipped over during fast scrolling
            const timer = setTimeout(() => {
              lazyMediaState.lazyTimers.delete(img);
              hydrateLazyImage(img);
            }, 65);
            lazyMediaState.lazyTimers.set(img, timer);
          }
        } else {
          // User scrolled fast past this image before settle delay finished -> cancel load
          const pendingTimer = lazyMediaState.lazyTimers.get(img);
          if (pendingTimer) {
            clearTimeout(pendingTimer);
            lazyMediaState.lazyTimers.delete(img);
          }
        }
      }
    }, {
      rootMargin: '220px 0px 280px 0px',
      threshold: 0.01
    });
  }

  if (!lazyMediaState.videoObserver) {
    lazyMediaState.videoObserver = new IntersectionObserver((entries) => {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const el = entry.target;
        if (entry.isIntersecting) {
          hydrateLazyVideoOrIframe(el);
        } else {
          pauseOffscreenVideo(el);
        }
      }
    }, {
      rootMargin: '150px 0px 150px 0px',
      threshold: 0.05
    });
  }

  if (!lazyMediaState.sectionObserver) {
    lazyMediaState.sectionObserver = new IntersectionObserver((entries) => {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (!entry.isIntersecting) continue;
        const slot = entry.target;
        const sectionKey = slot.getAttribute('data-lazy-section-key');
        const builder = sectionKey ? lazyMediaState.sectionBuilders.get(sectionKey) : null;
        lazyMediaState.sectionObserver.unobserve(slot);
        if (typeof builder === 'function') {
          lazyMediaState.sectionBuilders.delete(sectionKey);
          slot.outerHTML = builder();
          observeLazyMedia(document.getElementById('deferredHomeSections') || document);
        }
      }
    }, {
      rootMargin: '320px 0px 380px 0px',
      threshold: 0.01
    });
  }
}

function observeLazyMedia(root = document) {
  if (!root || typeof root.querySelectorAll !== 'function') return;
  initLazyObservers();

  const imgs = root.querySelectorAll('img[data-src]');
  if (lazyMediaState.imgObserver) {
    imgs.forEach(img => lazyMediaState.imgObserver.observe(img));
  } else {
    imgs.forEach(hydrateLazyImage);
  }

  const videosAndIframes = root.querySelectorAll('video[data-src], video[data-lazy-video], iframe[data-src]');
  if (lazyMediaState.videoObserver) {
    videosAndIframes.forEach(el => lazyMediaState.videoObserver.observe(el));
  } else {
    videosAndIframes.forEach(hydrateLazyVideoOrIframe);
  }
}

function registerLazySectionSlots(container, buildersMap) {
  if (!container) return;
  initLazyObservers();
  lazyMediaState.sectionBuilders.clear();
  const slots = container.querySelectorAll('[data-lazy-section-key]');
  slots.forEach(slot => {
    const key = slot.getAttribute('data-lazy-section-key');
    if (key && buildersMap[key]) {
      if (lazyMediaState.sectionObserver) {
        lazyMediaState.sectionBuilders.set(key, buildersMap[key]);
        lazyMediaState.sectionObserver.observe(slot);
      } else {
        slot.outerHTML = buildersMap[key]();
      }
    }
  });
  observeLazyMedia(container);
}

function toggleFavorite(itemId) {
  if (!itemId) return;
  const item = appState.allMedia.find(i => i.id === itemId);
  const title = item ? item.title : 'العمل';

  if (appState.favorites.has(itemId)) {
    appState.favorites.delete(itemId);
    showToast(`<i class="fa-regular fa-heart text-slate-400"></i> تم حذف <span class="text-slate-300">"${escapeHtml(title)}"</span> من مفضلاتك`);
  } else {
    appState.favorites.add(itemId);
    showToast(`<i class="fa-solid fa-heart text-rose-500"></i> تم حفظ <span class="text-brand">"${escapeHtml(title)}"</span> في مفضلاتك بنجاح ❤️`);
  }

  saveFavoritesToStorage();
  updateFavoritesBadge();
  updateModalFavoriteButton(itemId);

  // Update hero favorite button if present
  document.querySelectorAll(`[data-hero-fav-id="${itemId}"]`).forEach(btn => {
    const fav = isFavorite(itemId);
    btn.className = `w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${fav ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40' : 'bg-dark-800/80 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 border border-dark-border'}`;
    btn.innerHTML = `<i class="${fav ? 'fa-solid text-white' : 'fa-regular text-slate-300'} fa-heart text-xs sm:text-sm"></i>`;
    btn.title = fav ? 'إزالة من مفضلاتي' : 'إضافة إلى مفضلاتي';
  });

  // Re-render catalog so cards and the home "مفضلاتي" section update instantly
  renderCatalog();
}

function clearAllFavorites() {
  if (!appState.favorites || appState.favorites.size === 0) return;
  appState.favorites.clear();
  saveFavoritesToStorage();
  updateFavoritesBadge();
  document.querySelectorAll('[data-hero-fav-id]').forEach(btn => {
    btn.className = 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer bg-dark-800/80 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 border border-dark-border';
    btn.innerHTML = '<i class="fa-regular text-slate-300 fa-heart text-xs sm:text-sm"></i>';
    btn.title = 'إضافة إلى مفضلاتي';
  });
  showToast('<i class="fa-solid fa-trash-can text-rose-400"></i> تم مسح جميع الأعمال من المفضلة');
  renderCatalog();
}

function updateModalFavoriteButton(itemId) {
  const btn = document.getElementById('modalFavoriteBtn');
  const icon = document.getElementById('modalFavoriteIcon');
  if (!btn || !icon || !itemId) return;
  const fav = isFavorite(itemId);
  if (fav) {
    btn.classList.add('bg-rose-600', 'text-white', 'border-rose-500');
    btn.classList.remove('bg-dark-800', 'text-slate-300', 'border-dark-border');
    icon.className = 'fa-solid fa-heart text-white text-xs sm:text-sm';
    btn.title = 'إزالة من المفضلة';
  } else {
    btn.classList.remove('bg-rose-600', 'text-white', 'border-rose-500');
    btn.classList.add('bg-dark-800', 'text-slate-300', 'border-dark-border');
    icon.className = 'fa-regular fa-heart text-slate-300 text-xs sm:text-sm';
    btn.title = 'إضافة إلى مفضلاتي';
  }
}

function toggleCurrentModalFavorite() {
  if (!appState.currentItem) return;
  toggleFavorite(appState.currentItem.id);
}

let currentStarFilter = 'all';

const FEATURED_ACTORS = [
  // ACTORS (الممثلين)
  { id: "tyrese-gibson", gender: "actor", name: "تايريس جيبسون", englishName: "Tyrese Gibson", avatar: "/actors/tyrese-gibson.jpg", badge: "Hard Matter / فاست" },
  { id: "frank-grillo", gender: "actor", name: "فرانك جريلو", englishName: "Frank Grillo", avatar: "/actors/frank-grillo.jpg", badge: "Hard Matter / مارفل" },
  { id: "tom-hardy", gender: "actor", name: "توم هاردي", englishName: "Tom Hardy", avatar: "/actors/tom-hardy.jpg", badge: "Venom / فينوم" },
  { id: "kivanc-tatlitug", gender: "actor", name: "كيفانش تاتليتوغ", englishName: "Kıvanç Tatlıtuğ", avatar: "/actors/kivanc-tatlitug.jpg", badge: "Hadi Be Oğlum / مهند" },
  { id: "shah-rukh-khan", gender: "actor", name: "شاروخان", englishName: "Shah Rukh Khan", avatar: "/actors/shah-rukh-khan.jpg", badge: "Jawan / ملك بوليوود" },
  { id: "ma-dong-seok", gender: "actor", name: "ما دونغ سوك", englishName: "Ma Dong-seok", avatar: "/actors/ma-dong-seok.jpg", badge: "Train to Busan / كوريا" },
  { id: "jason-statham", gender: "actor", name: "جيسون ستاثام", englishName: "Jason Statham", avatar: "/actors/jason-statham.jpg", badge: "The Beekeeper / أكشن" },
  { id: "keanu-reeves", gender: "actor", name: "كيانو ريفز", englishName: "Keanu Reeves", avatar: "/actors/keanu-reeves.jpg", badge: "John Wick / جون ويك" },
  { id: "ben-affleck", gender: "actor", name: "بن أفليك", englishName: "Ben Affleck", avatar: "/actors/ben-affleck.jpg", badge: "The Accountant / المحاسب" },
  { id: "paul-walker", gender: "actor", name: "بول ووكر", englishName: "Paul Walker", avatar: "/actors/paul-walker.jpg", badge: "Fast & Furious / سريع" },
  { id: "robert-de-niro", gender: "actor", name: "روبرت دي نيرو", englishName: "Robert De Niro", avatar: "/actors/robert-de-niro.jpg", badge: "GoodFellas / الأب الروحي" },
  { id: "johnny-depp", gender: "actor", name: "جوني ديب", englishName: "Johnny Depp", avatar: "/actors/johnny-depp.jpg", badge: "Sweeney Todd / قراصنة" },
  { id: "martin-freeman", gender: "actor", name: "مارتن فريمان", englishName: "Martin Freeman", avatar: "/actors/martin-freeman.jpg", badge: "The Hobbit / شارلوك" },
  { id: "eddie-redmayne", gender: "actor", name: "إيدي ريدماين", englishName: "Eddie Redmayne", avatar: "/actors/eddie-redmayne.jpg", badge: "The Aeronauts / جوائز" },

  // ACTRESSES (الممثلات)
  { id: "hande-ercel", gender: "actress", name: "هاندا أرتشيل", englishName: "Hande Erçel", avatar: "/actors/hande-ercel.jpg", badge: "Sen Çal Kapımı / تركي" },
  { id: "deepika-padukone", gender: "actress", name: "ديبيكا بادوكون", englishName: "Deepika Padukone", avatar: "/actors/deepika-padukone.jpg", badge: "Jawan / ملكة بوليوود" },
  { id: "scarlett-johansson", gender: "actress", name: "سكارليت جوهانسون", englishName: "Scarlett Johansson", avatar: "/actors/scarlett-johansson.jpg", badge: "Lucy / Black Widow" },
  { id: "angelina-jolie", gender: "actress", name: "أنجلينا جولي", englishName: "Angelina Jolie", avatar: "/actors/angelina-jolie.jpg", badge: "Maleficent / هوليوود" },
  { id: "ana-de-armas", gender: "actress", name: "آنا دي أرماس", englishName: "Ana de Armas", avatar: "/actors/ana-de-armas.jpg", badge: "Knives Out / باليرينا" },
  { id: "beren-saat", gender: "actress", name: "بيرين سات", englishName: "Beren Saat", avatar: "/actors/beren-saat.jpg", badge: "العشق الممنوع / فاطمة" },
  { id: "jenna-ortega", gender: "actress", name: "جينا أورتيجا", englishName: "Jenna Ortega", avatar: "/actors/jenna-ortega.jpg", badge: "Wednesday / وينزداي" },
  { id: "felicity-jones", gender: "actress", name: "فيليسيتي جونز", englishName: "Felicity Jones", avatar: "/actors/felicity-jones.jpg", badge: "The Aeronauts / إنجلترا" },
  { id: "song-hye-kyo", gender: "actress", name: "سونغ هي كيو", englishName: "Song Hye-kyo", avatar: "/actors/song-hye-kyo.jpg", badge: "The Glory / دراما كورية" },
  { id: "mona-zaki", gender: "actress", name: "منى زكي", englishName: "Mona Zaki", avatar: "/actors/mona-zaki.jpg", badge: "رحلة 404 / دراما عربية" }
];

function switchStarType(type) {
  currentStarFilter = type;
  ['all', 'actor', 'actress'].forEach(t => {
    const btn = document.getElementById(`starType-${t}`);
    if (!btn) return;
    if (t === type) {
      btn.className = 'px-2.5 py-1 rounded-lg font-bold bg-brand text-dark-950 transition-all text-[11px] shadow-sm';
    } else {
      btn.className = 'px-2.5 py-1 rounded-lg font-semibold text-slate-300 hover:text-white transition-all text-[11px]';
    }
  });
  renderActorsBar();
}

const INITIAL_MOVIES = (window.CURATED_CATALOG && Array.isArray(window.CURATED_CATALOG) && window.CURATED_CATALOG.length > 0)
  ? window.CURATED_CATALOG
  : [];

const SEED_LIVE_CHANNELS = [];

// Official genuine TMDB fallback paths for original posters and backdrops
const OFFICIAL_POSTER_FALLBACKS = {
  'series-blindspot-s01': 'https://image.tmdb.org/t/p/w500/kRXprdbfFs6FJYH3GAPrKYXQdQT.jpg',
  'series-blindspot-s02': 'https://image.tmdb.org/t/p/w500/4Fr3ufjp5rJW4r8sbkeO8RwAdFR.jpg',
  'series-blindspot-s03': 'https://image.tmdb.org/t/p/w500/uVLXClxS7N9N2jNZHMjPCBNF31H.jpg',
  'movie-hard-matter-2026': 'https://image.tmdb.org/t/p/w500/bXvSKLCillha6wxY0yxoRCM2WQl.jpg'
};

const OFFICIAL_BACKDROP_FALLBACKS = {
  'series-blindspot-s01': 'https://image.tmdb.org/t/p/w1280/1GWiao0QYuKsoTvUmd7ivnE3qDY.jpg',
  'series-blindspot-s02': 'https://image.tmdb.org/t/p/w1280/dYJrfkQeqGXeGMMTvYaM43XHce5.jpg',
  'series-blindspot-s03': 'https://image.tmdb.org/t/p/w1280/u7G2G7jrBfHfIyj8ifzkq8I4tq3.jpg',
  'movie-hard-matter-2026': 'https://image.tmdb.org/t/p/w1280/zyqAhNJqwiop5yUOJ8SHV27labY.jpg'
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function getGenreString(genre) {
  if (!genre) return '';
  if (Array.isArray(genre)) return genre.join(' • ');
  return String(genre);
}

function getFirstGenre(genre, fallback = 'أكشن') {
  if (!genre) return fallback;
  if (Array.isArray(genre)) {
    return genre.length > 0 ? String(genre[0]).trim() : fallback;
  }
  const str = String(genre);
  return str.split('•')[0].trim() || fallback;
}

function getPlaceholderPosterSvg(title, type) {
  const isLive = type === 'live';
  const isPlay = type === 'play' || type === 'plays';
  const isSeries = type === 'series';
  const color = isLive ? '#f43f5e' : (isPlay ? '#c084fc' : (isSeries ? '#f59e0b' : '#00d2ff'));
  const label = isLive ? 'بث مباشر 🔴' : (isPlay ? 'مسرحية VIP 🎭' : (isSeries ? 'مسلسل VIP' : 'فيلم VIP'));
  const cleanTitle = (title || 'تذكرة دخول').replace(/[<>&"]/g, '').slice(0, 32);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
    <defs>
      <radialGradient id="cardGlow" cx="50%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#00d2ff" stop-opacity="0.25"/>
        <stop offset="60%" stop-color="#f59e0b" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="#07090e" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="cardBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00d2ff" stop-opacity="0.6"/>
        <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="#00d2ff" stop-opacity="0.2"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="#07090e"/>
    <rect x="10" y="10" width="280" height="430" rx="18" fill="#0d131f" stroke="url(#cardBorder)" stroke-width="1.8"/>
    <circle cx="150" cy="180" r="85" fill="url(#cardGlow)"/>
    <circle cx="150" cy="180" r="38" fill="#141d2d" stroke="${color}" stroke-width="2.5"/>
    <polygon points="144,166 166,180 144,194" fill="${color}"/>
    <text x="150" y="270" font-family="'Cairo', sans-serif, system-ui" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">${cleanTitle}</text>
    <rect x="105" y="290" width="90" height="24" rx="6" fill="#172233" stroke="${color}" stroke-width="1"/>
    <text x="150" y="306" font-family="'Cairo', sans-serif, system-ui" font-size="10.5" font-weight="800" fill="${color}" text-anchor="middle">${label}</text>
    <text x="150" y="410" font-family="'Cairo', sans-serif, system-ui" font-size="9" font-weight="bold" fill="#64748b" text-anchor="middle">تذكرة دخول • سينما VIP</text>
  </svg>`;
  try {
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  } catch (e) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
}

function getActorPlaceholderSvg(name) {
  const safeName = (name || 'نجم سينمائي').slice(0, 20);
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="100%" height="100%" fill="%230c1017"/><circle cx="60" cy="46" r="26" fill="%231e293b" stroke="%2300d2ff" stroke-width="2"/><path d="M 22 106 Q 60 76 98 106" fill="%231e293b" stroke="%2300d2ff" stroke-width="2"/><text x="60" y="112" font-family="sans-serif" font-size="9" font-weight="bold" fill="%2300d2ff" text-anchor="middle">${encodeURIComponent(safeName)}</text></svg>`;
}

function handlePosterError(img, type) {
  if (!img || img.hasAttribute('data-src') || (img.src && img.src.startsWith('data:image/gif'))) return;
  const itemId = img.dataset.id || img.closest('[data-id]')?.dataset?.id;
  const item = itemId && appState.allMedia ? appState.allMedia.find(i => i.id === itemId) : null;
  const title = img.dataset.title || (item ? item.title : '') || '';

  if (itemId && OFFICIAL_POSTER_FALLBACKS[itemId] && !img.src.includes('image.tmdb.org')) {
    img.src = OFFICIAL_POSTER_FALLBACKS[itemId];
    return;
  }
  if (!img.dataset.retried) {
    img.dataset.retried = '1';
    if (item && item.backdrop && !img.src.endsWith(item.backdrop)) {
      img.src = item.backdrop;
      return;
    }
  }
  img.onerror = null;
  img.src = getPlaceholderPosterSvg(title, type);
}

function handleBackdropError(img) {
  if (!img || img.hasAttribute('data-src') || (img.src && img.src.startsWith('data:image/gif'))) return;
  const itemId = img.dataset.id || img.closest('.swiper-slide')?.querySelector('[data-id]')?.dataset?.id;
  const item = itemId && appState.allMedia ? appState.allMedia.find(i => i.id === itemId) : null;

  if (itemId && OFFICIAL_BACKDROP_FALLBACKS[itemId] && !img.src.includes('image.tmdb.org')) {
    img.src = OFFICIAL_BACKDROP_FALLBACKS[itemId];
    return;
  }
  // Robust fallback: if backdrop is missing, use the movie poster with cinematic blur so the background is always vibrant!
  if (item && item.poster && !img.src.endsWith(item.poster)) {
    img.src = item.poster;
    img.classList.add('blur-md', 'scale-125', 'opacity-70');
    return;
  }
  img.onerror = null;
  img.style.display = 'none';
}

function handleActorAvatarError(img, name) {
  if (!img) return;
  img.onerror = null;
  img.src = getActorPlaceholderSvg(name);
}

function getOptimizedPosterUrl(item) {
  let url = item.logo || item.poster || item.backdrop;
  if (!url) return getPlaceholderPosterSvg(item.title, item.type || item.category);

  // Data Saver Mode: automatically downgrade TMDB remote resolution to w342 (saves ~85% bandwidth)
  if (appState.dataSaverMode && url.includes('image.tmdb.org')) {
    url = url.replace(/\/t\/p\/(w780|original|w1280|w500)\//, '/t/p/w342/');
  }
  return url;
}

function getOptimizedBackdropUrl(item) {
  let url = item.backdrop || item.poster;
  if (!url) return '';
  // Data Saver Mode: downsample high-res backdrops from w1280 to w780
  if (appState.dataSaverMode && url.includes('image.tmdb.org')) {
    url = url.replace(/\/t\/p\/(w1280|original)\//, '/t/p/w780/');
  }
  return url;
}

function renderActorsBar() {
  const container = document.getElementById('actorsListContainer');
  if (!container) return;
  const activeActorId = appState.activeActorId;
  const visibleStars = FEATURED_ACTORS.filter(s => currentStarFilter === 'all' || s.gender === currentStarFilter);
  container.innerHTML = visibleStars.map((actor, idx) => {
    const isSelected = activeActorId === actor.id;
    const isEager = idx < 6;
    return `
      <div
        onclick="filterByActor('${actor.id}')"
        class="group flex flex-col items-center shrink-0 cursor-pointer p-1.5 rounded-2xl transition-all ${isSelected ? 'bg-brand/20 ring-2 ring-brand scale-105' : 'hover:bg-dark-800'}"
        title="أفلام ${escapeHtml(actor.name)}"
      >
        <div class="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 ${isSelected ? 'border-brand shadow-[0_0_15px_rgba(0,210,255,0.7)]' : 'border-dark-border/80 group-hover:border-brand/70'} transition-all bg-dark-950">
          <img
            src="${isEager ? actor.avatar : LAZY_TRANSPARENT_PLACEHOLDER}"
            ${isEager ? '' : `data-src="${actor.avatar}"`}
            alt="${escapeHtml(actor.name)}"
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 ${isEager ? '' : 'lazy-media-img'}"
            loading="lazy"
            decoding="async"
            onerror="handleActorAvatarError(this, '${escapeHtml(actor.name)}')"
          />
          ${isSelected ? '<div class="absolute inset-0 bg-brand/25 flex items-center justify-center backdrop-blur-[1px]"><i class="fa-solid fa-check text-white text-sm font-black drop-shadow-md"></i></div>' : ''}
        </div>
        <span class="text-[11px] sm:text-xs font-bold text-center mt-1.5 truncate max-w-[76px] sm:max-w-[88px] ${isSelected ? 'text-brand' : 'text-slate-200 group-hover:text-brand'}">
          ${escapeHtml(actor.name)}
        </span>
        <span class="text-[9px] text-slate-400 text-center truncate max-w-[76px] sm:max-w-[88px]">
          ${escapeHtml(actor.badge)}
        </span>
      </div>
    `;
  }).join('');

  observeLazyMedia(container);

  const clearBtn = document.getElementById('clearActorFilterBtn');
  if (clearBtn) {
    if (activeActorId) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  }
}

function filterByActor(actorId) {
  if (appState.activeActorId === actorId) {
    appState.activeActorId = null;
  } else {
    appState.activeActorId = actorId;
  }
  renderActorsBar();
  renderCatalog();
  const catalogEl = document.getElementById('dynamicSectionsContainer');
  if (catalogEl && appState.activeActorId) {
    catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function isSeriesItem(item) {
  return Boolean(item && (item.category === 'series' || item.type === 'series'));
}

function isAnimeItem(item) {
  if (!item || isSeriesItem(item)) return false;
  const g = getGenreString(item.genre);
  return item.category === 'anime' ||
    item.origin === 'anime' ||
    item.subGenre === 'animation' ||
    item.subGenre === 'anime' ||
    g.includes('رسوم متحركة') ||
    g.includes('أنمي') ||
    g.includes('كرتون') ||
    g.includes('ميكا');
}

function isPlayOrComedyItem(item) {
  if (!item) return false;
  const g = getGenreString(item.genre);
  return item.category === 'comedy' ||
    item.category === 'plays' ||
    item.subGenre === 'comedy' ||
    item.subGenre === 'theater' ||
    item.type === 'play' ||
    g.includes('كوميد') ||
    g.includes('مسرح') ||
    (item.title && (
      item.title.includes('مسرحية') || item.title.includes('كوميدي') || item.title.includes('شباب البومب') ||
      item.title.includes('أبو نسب') || item.title.includes('ريستارت') || item.title.includes('روكي') ||
      item.title.includes('عصابة الماكس') || item.title.includes('مستر إكس') || item.title.includes('أنستونا') ||
      item.title.includes('بنسيون دلال') || item.title.includes('الهنا اللي أنا فيه') || item.title.includes('فيها إيه يعني')
    ));
}

function switchNavTab(tabKey) {
  if (tabKey === 'adminUsers' && !window.TadhkiraAuth?.isAdminUser?.()) {
    tabKey = 'all';
  }
  appState.activeNavTab = tabKey;
  appState.activeSubGenre = 'all';
  appState.activeSeriesOrigin = 'all';
  appState.activeActorId = null;
  appState.isFullSearchActive = false;
  renderActorsBar();

  // Clear any active search overlay/results when navigating to a category tab
  appState.searchQuery = '';
  appState.lastSearchResults = [];
  appState.activeSearchFilter = 'all';
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
  const searchSec = document.getElementById('searchSection');
  if (searchSec) searchSec.classList.add('hidden');
  closePredictiveDropdown();
  const dynamicContainer = document.getElementById('dynamicSectionsContainer');
  if (dynamicContainer) dynamicContainer.classList.remove('hidden');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('bg-brand', 'bg-amber-400', 'bg-rose-600', 'text-dark-950', 'text-white', 'shadow-sm');
    if (btn.id === 'nav-tab-adminUsers') {
      btn.classList.add('text-amber-200', 'bg-amber-500/15', 'hover:text-dark-950', 'hover:bg-amber-400');
    } else if (btn.id === 'nav-tab-ads') {
      btn.classList.add('text-amber-300', 'hover:text-dark-950', 'hover:bg-amber-400');
    } else if (btn.id === 'nav-tab-live') {
      btn.classList.add('text-rose-300', 'bg-rose-500/15', 'hover:text-white', 'hover:bg-rose-600');
    } else {
      btn.classList.add('text-slate-300', 'hover:text-white', 'hover:bg-dark-800');
    }
  });
  const activeBtn = document.getElementById(`nav-tab-${tabKey}`);
  if (activeBtn) {
    if (tabKey === 'adminUsers' || tabKey === 'ads') {
      activeBtn.classList.remove('text-amber-200', 'text-amber-300', 'bg-amber-500/15', 'text-slate-300', 'hover:bg-dark-800');
      activeBtn.classList.add('bg-amber-400', 'text-dark-950', 'shadow-sm');
    } else if (tabKey === 'live') {
      activeBtn.classList.remove('text-rose-300', 'bg-rose-500/15', 'text-slate-300', 'hover:bg-dark-800');
      activeBtn.classList.add('bg-rose-600', 'text-white', 'shadow-sm');
    } else {
      activeBtn.classList.add('bg-brand', 'text-dark-950', 'shadow-sm');
      activeBtn.classList.remove('text-slate-300', 'hover:text-white', 'hover:bg-dark-800');
    }
  }

  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    btn.classList.remove('text-brand', 'font-bold', 'bg-rose-600/20', 'text-rose-300', 'rounded-lg');
    if (btn.dataset.tab !== 'ads' && btn.dataset.tab !== 'adminUsers' && btn.dataset.tab !== 'live') {
      btn.classList.add('text-slate-400');
    }
    if (btn.dataset.tab === tabKey) {
      if (tabKey === 'live') {
        btn.classList.add('bg-rose-600/20', 'text-rose-300', 'font-bold', 'rounded-lg');
      } else {
        btn.classList.add('text-brand', 'font-bold');
        btn.classList.remove('text-slate-400');
      }
    }
  });

  const hero = document.getElementById('heroSection');
  const actors = document.getElementById('actorsSection');
  const adsBanner = document.getElementById('adsOffersSection');
  if (tabKey === 'all') {
    if (hero) hero.classList.remove('hidden');
    if (actors) actors.classList.remove('hidden');
  } else {
    if (hero) hero.classList.add('hidden');
    if (actors) actors.classList.add('hidden');
  }
  if (adsBanner) {
    if (tabKey === 'ads' || tabKey === 'adminUsers') {
      adsBanner.classList.add('hidden');
    } else {
      adsBanner.classList.remove('hidden');
    }
  }

  if (deferredHomeTimer) {
    clearTimeout(deferredHomeTimer);
    deferredHomeTimer = null;
  }

  renderCatalog();
  if (tabKey === 'ads' || tabKey === 'adminUsers' || tabKey === 'live') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function createMediaCardHtml(item) {
  const isSeries = item.category === 'series' || item.type === 'series';
  const isPlay = item.type === 'play' || item.category === 'plays' || (item.title && item.title.includes('مسرحية'));
  const isComedy = item.subGenre === 'comedy' || item.category === 'comedy' || (getGenreString(item.genre).includes('كوميد'));
  const isYemeni = item.origin === 'yemeni' || item.category === 'yemeni';
  let typeBadgeText = isPlay ? 'مسرحية 🎭' : (isSeries ? 'مسلسل' : (isComedy ? 'كوميديا 🍿' : 'فيلم'));
  let typeBadgeColor = isPlay ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white' : (isSeries ? 'bg-amber-400 text-dark-950' : (isComedy ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-dark-950' : 'bg-brand text-dark-950'));

  let originBadge = '';
  if (isPlay) {
    originBadge = '<span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-700 text-white shadow">🎭 مسرح</span>';
  } else if (item.subGenre === 'animation' || item.category === 'anime' || (getGenreString(item.genre).includes('رسوم متحركة') || getGenreString(item.genre).includes('أنمي'))) {
    originBadge = '<span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-pink-600 text-white shadow">🎨 أنمي</span>';
  } else if (isYemeni) {
    originBadge = '<span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-600 text-white shadow">🇾🇪 يمني</span>';
  } else if (item.origin === 'turkish') {
    originBadge = '<span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-600 text-white shadow">🇹🇷 تركي</span>';
  } else if (item.origin === 'indian') {
    originBadge = '<span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-dark-950 shadow">🇮🇳 هندي</span>';
  } else if (item.origin === 'korean') {
    originBadge = '<span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-600 text-white shadow">🇰🇷 كوري</span>';
  } else if (item.origin === 'asian') {
    originBadge = '<span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-teal-600 text-white shadow">🌏 آسيوي</span>';
  } else if (item.origin === 'foreign') {
    originBadge = '<span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-sky-600 text-white shadow">🎬 أجنبي</span>';
  } else {
    originBadge = '<span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white shadow">🍿 عربي</span>';
  }

  const posterFallbackType = isPlay ? 'play' : (isSeries ? 'series' : 'movie');
  const isFav = isFavorite(item.id);

  return `
    <div
      data-id="${escapeHtml(item.id)}"
      onclick="handleCardClick(this.dataset.id)"
      class="media-card group relative bg-dark-900 border border-dark-border/80 rounded-xl overflow-hidden cursor-pointer flex flex-col select-none hover:border-brand/60 transition-all hover:shadow-xl hover:shadow-brand/5"
    >
      <div class="relative w-full aspect-[2/3] bg-dark-950 overflow-hidden">
        <img
          src="${LAZY_TRANSPARENT_PLACEHOLDER}"
          data-src="${getOptimizedPosterUrl(item)}"
          alt="${escapeHtml(item.title)}"
          class="lazy-media-img w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          decoding="async"
          width="300"
          height="450"
          data-title="${escapeHtml(item.title)}"
          onerror="handlePosterError(this, '${posterFallbackType}')"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent opacity-80"></div>

        <div class="absolute top-2 right-2 flex items-center gap-1.5 flex-wrap z-10">
          <span class="px-1.5 py-0.5 rounded text-[9px] font-black ${typeBadgeColor} shadow">
            ${typeBadgeText}
          </span>
          ${originBadge}
        </div>

        <!-- Rating badge -->
        <span class="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded text-[9px] font-black bg-dark-900/80 backdrop-blur-md text-amber-300 border border-amber-400/30 flex items-center gap-0.5 shadow">
          <i class="fa-solid fa-star text-[8px] text-amber-400"></i>
          <span>${item.rating || '7.5'}</span>
        </span>

        <!-- Favorite Heart Button -->
        <button
          type="button"
          onclick="event.stopPropagation(); toggleFavorite('${escapeHtml(item.id)}')"
          class="fav-btn absolute bottom-2 left-2 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${isFav ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/50 scale-105' : 'bg-dark-950/80 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 backdrop-blur-md border border-white/10 hover:scale-110 active:scale-95'}"
          title="${isFav ? 'إزالة من مفضلاتي' : 'إضافة إلى مفضلاتي'}"
          aria-label="المفضلة"
        >
          <i class="${isFav ? 'fa-solid text-white' : 'fa-regular text-slate-200'} fa-heart text-xs"></i>
        </button>

        <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
          <div class="w-12 h-12 rounded-full bg-brand text-dark-950 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <i class="fa-solid fa-play text-sm ml-0.5"></i>
          </div>
        </div>
      </div>

      <div class="p-2.5 flex-1 flex flex-col justify-between">
        <div>
          <h4 class="text-xs font-bold text-white group-hover:text-brand transition-colors line-clamp-1">
            ${escapeHtml(item.title)}
          </h4>
          <span class="text-[10px] text-slate-400 block mt-0.5">
            ${item.year || '2024'} • ${escapeHtml(getFirstGenre(item.genre))}
          </span>
        </div>
        <div class="mt-2 pt-1.5 border-t border-dark-border/40 flex items-center justify-between text-[10px] text-slate-400">
          <span class="text-slate-400 font-semibold">${item.quality || '1080p FHD'}</span>
          <span class="text-brand font-bold flex items-center gap-1">
            <span>مشاهدة</span>
            <i class="fa-solid fa-angle-left text-[8px]"></i>
          </span>
        </div>
      </div>
    </div>
  `;
}

function renderTop10Hero() {
  const container = document.getElementById('heroTop10Container');
  if (!container) return;

  const top10 = appState.allMedia.slice(0, 10);
  if (top10.length === 0) return;

  container.innerHTML = `
    <div class="relative w-full rounded-3xl overflow-hidden border border-dark-border/80 bg-dark-900 shadow-2xl">
      <div class="swiper heroSwiper w-full">
        <div class="swiper-wrapper">
          ${top10.map((item, index) => {
            const rank = index + 1;
            const isSeries = item.category === 'series' || item.type === 'series';
            const badgeText = isSeries ? 'مسلسل كامل' : (item.category === 'anime' ? 'أنمي مترجم' : 'فيلم سينمائي');
            const genreText = getGenreString(item.genre) || (isSeries ? 'دراما • تشويق' : 'أكشن • إثارة');
            const yearText = item.year || '2024';
            const qualityText = item.quality || '1080p FHD';
            return `
            <div class="swiper-slide relative w-full aspect-[16/10] sm:aspect-[16/9] md:aspect-[2/1] lg:aspect-[2.2/1] min-h-[420px] sm:min-h-[460px] md:min-h-[500px] lg:min-h-[540px] flex items-center justify-between p-4 sm:p-7 md:p-9 lg:p-11 overflow-hidden select-none gap-4 sm:gap-8">
              <!-- Background Backdrop -->
              <div class="absolute inset-0 z-0 bg-dark-950">
                <img
                  src="${index === 0 ? getOptimizedBackdropUrl(item) : LAZY_TRANSPARENT_PLACEHOLDER}"
                  ${index === 0 ? 'fetchpriority="high"' : `data-src="${getOptimizedBackdropUrl(item)}"`}
                  alt="${escapeHtml(item.title)}"
                  data-id="${escapeHtml(item.id)}"
                  class="${index === 0 ? '' : 'lazy-media-img '}w-full h-full object-cover filter brightness-[0.38] contrast-105 scale-105 transition-transform duration-1000"
                  loading="${index === 0 ? 'eager' : 'lazy'}"
                  decoding="async"
                  referrerpolicy="no-referrer"
                  onerror="handleBackdropError(this)"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/70 to-transparent"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/85 to-amber-950/20"></div>
                <!-- Distinctive Subtle Golden Radial Ambient Backlight in Backdrop -->
                <div class="absolute -top-12 left-4 sm:left-24 w-72 sm:w-96 h-72 sm:h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
              </div>

              <!-- Content Info (Right Side in RTL) -->
              <div class="relative z-10 max-w-xl text-right flex flex-col items-start gap-2 sm:gap-3 flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-2.5 py-0.5 rounded-lg text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 text-dark-950 shadow-md flex items-center gap-1">
                    <i class="fa-solid fa-fire text-xs"></i>
                    <span>TOP #${rank}</span>
                  </span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-dark-800/80 backdrop-blur-md text-brand border border-brand/30">
                    ${badgeText}
                  </span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-dark-800/80 backdrop-blur-md text-slate-300 border border-dark-border">
                    ${qualityText}
                  </span>
                  <span class="text-xs text-slate-400 font-medium">
                    ${yearText}
                  </span>
                </div>

                <h1 class="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight drop-shadow-md line-clamp-2">
                  ${escapeHtml(item.title)}
                </h1>

                <p class="text-xs sm:text-sm text-slate-300 line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow">
                  ${escapeHtml(item.overview || 'استمتع بمشاهدة هذا العرض بأعلى دقة 1080p FHD وبدون إعلانات مزعجة.')}
                </p>

                <div class="flex items-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                  <button
                    data-id="${escapeHtml(item.id)}"
                    onclick="handleCardClick(this.dataset.id)"
                    class="px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-dark-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <i class="fa-solid fa-play text-xs"></i>
                    <span>شاهد الآن</span>
                  </button>
                  <button
                    type="button"
                    data-hero-fav-id="${escapeHtml(item.id)}"
                    onclick="event.stopPropagation(); toggleFavorite('${escapeHtml(item.id)}')"
                    class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${isFavorite(item.id) ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40' : 'bg-dark-800/80 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 border border-dark-border'}"
                    title="${isFavorite(item.id) ? 'إزالة من مفضلاتي' : 'إضافة إلى مفضلاتي'}"
                    aria-label="المفضلة"
                  >
                    <i class="${isFavorite(item.id) ? 'fa-solid text-white' : 'fa-regular text-slate-300'} fa-heart text-xs sm:text-sm"></i>
                  </button>
                  <span class="text-xs text-slate-400 font-medium hidden sm:flex items-center gap-1.5">
                    <i class="fa-solid fa-film text-amber-400 text-xs"></i>
                    <span class="line-clamp-1">${genreText}</span>
                  </span>
                </div>
              </div>

              <!-- Movie Poster Showcase: Significantly Enlarged, Clear, Distinctive Golden Backlight, NO Text on Image -->
              <div
                class="relative shrink-0 group cursor-pointer z-10 select-none my-auto"
                onclick="handleCardClick('${escapeHtml(item.id)}')"
                title="${escapeHtml(item.title)}"
              >
                <!-- Distinctive Subtle Golden Backlight Halo -->
                <div class="absolute -inset-3 sm:-inset-5 bg-gradient-to-tr from-amber-500/25 via-yellow-400/30 to-amber-600/20 rounded-3xl blur-2xl sm:blur-3xl opacity-70 group-hover:opacity-85 group-hover:blur-3xl transition-all duration-700 pointer-events-none"></div>
                <div class="absolute -inset-1 bg-gradient-to-r from-amber-400/35 to-yellow-500/35 rounded-2xl sm:rounded-3xl opacity-45 blur-sm pointer-events-none"></div>

                <!-- Clean Movie Image Container (Pure visual, enlarged & commanding, zero text overlay) -->
                <div class="relative w-36 xs:w-44 sm:w-56 md:w-64 lg:w-80 xl:w-[360px] aspect-[2/3] rounded-2xl sm:rounded-3xl overflow-hidden border border-amber-400/40 sm:border-2 sm:border-amber-400/40 shadow-[0_10px_35px_rgba(245,158,11,0.22)] bg-dark-950 transition-transform duration-500 group-hover:scale-[1.03]">
                  <img
                    src="${index === 0 ? getOptimizedPosterUrl(item) : LAZY_TRANSPARENT_PLACEHOLDER}"
                    ${index === 0 ? 'fetchpriority="high"' : `data-src="${getOptimizedPosterUrl(item)}"`}
                    alt="${escapeHtml(item.title)}"
                    class="${index === 0 ? '' : 'lazy-media-img '}w-full h-full object-cover"
                    loading="${index === 0 ? 'eager' : 'lazy'}"
                    decoding="async"
                    referrerpolicy="no-referrer"
                    data-title="${escapeHtml(item.title)}"
                    onerror="handlePosterError(this, '${item.type || 'movie'}')"
                  />
                </div>
              </div>
            </div>
            `;
          }).join('')}
        </div>
        <div class="swiper-pagination"></div>
      </div>
      <!-- Distinctive Animated Colored Line Under Cinema Screen / Hero Showcase -->
      <div class="player-accent-bar" aria-hidden="true"></div>
    </div>
  `;

  initHeroSwiper();
}

let heroSwiperRetryTimer = null;
function initHeroSwiper(attempt = 0) {
  if (heroSwiperRetryTimer) {
    clearTimeout(heroSwiperRetryTimer);
    heroSwiperRetryTimer = null;
  }

  const swiperEl = document.querySelector('.heroSwiper');
  if (!swiperEl) return;

  if (typeof Swiper === 'undefined') {
    if (attempt < 20) {
      heroSwiperRetryTimer = setTimeout(() => initHeroSwiper(attempt + 1), 250);
    }
    return;
  }

  if (appState.heroSwiper) {
    try { appState.heroSwiper.destroy(true, true); } catch (e) {}
    appState.heroSwiper = null;
  }

  try {
    appState.heroSwiper = new Swiper('.heroSwiper', {
      loop: true,
      autoplay: appState.dataSaverMode ? false : {
        delay: 4500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
        stopOnLastSlide: false,
        waitForTransition: false
      },
      effect: 'fade',
      fadeEffect: { crossFade: true },
      speed: 700,
      pagination: { el: '.swiper-pagination', clickable: true },
      allowTouchMove: true,
      observer: true,
      observeParents: true,
      on: {
        init: function() {
          if (this.autoplay) this.autoplay.start();
          observeLazyMedia(swiperEl);
        },
        slideChange: function() {
          const slides = this.slides || [];
          const targets = [slides[this.activeIndex], slides[this.activeIndex + 1]].filter(Boolean);
          targets.forEach(slide => {
            slide.querySelectorAll('img[data-src]').forEach(hydrateLazyImage);
          });
        }
      }
    });
  } catch (e) {
    console.warn('Hero Swiper init notice:', e);
  }
}

window.addEventListener('load', () => {
  if (!appState.heroSwiper && document.querySelector('.heroSwiper')) {
    initHeroSwiper(0);
  }
});

// Keep hero swiper moving on focus
window.addEventListener('focus', () => {
  if (appState.heroSwiper && appState.heroSwiper.autoplay && !appState.heroSwiper.autoplay.running) {
    try { appState.heroSwiper.autoplay.start(); } catch (e) {}
  }
});

// Progressive rendering timer for non-blocking page load
let deferredHomeTimer = null;

function renderCatalog() {
  destroySwipers();
  if (deferredHomeTimer) {
    clearTimeout(deferredHomeTimer);
    deferredHomeTimer = null;
  }

  const container = document.getElementById('dynamicSectionsContainer');
  if (!container) return;

  // 1. ACTOR FILTER
  if (appState.activeActorId) {
    const actor = FEATURED_ACTORS.find(a => a.id === appState.activeActorId);
    const actorName = actor ? actor.name : '';
    const actorEnName = actor ? actor.englishName : '';
    const filtered = appState.allMedia.filter(item => {
      const actorsList = item.actors || [];
      return actorsList.some(a => a.includes(actorName) || a.includes(actorEnName))
        || (item.overview && (item.overview.includes(actorName) || item.overview.includes(actorEnName)))
        || (item.title && (item.title.includes(actorName) || item.title.includes(actorEnName)));
    });

    container.innerHTML = `
      <section class="space-y-4">
        <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-brand/40 shadow-xl flex items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <img src="${actor.avatar}" class="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-brand shadow-[0_0_12px_rgba(0,210,255,0.4)]" />
            <div>
              <span class="text-[10px] font-bold text-brand uppercase tracking-wider flex items-center gap-1">
                <i class="fa-solid fa-star text-amber-400 text-[10px]"></i> نجم السينما المختار
              </span>
              <h3 class="text-base sm:text-lg font-black text-white">${actor.name} (${filtered.length} عمل سينمائي متوفر)</h3>
              <p class="text-xs text-slate-400">جميع الأعمال الخاصة بالنجم ${actor.name}</p>
            </div>
          </div>
          <button onclick="filterByActor(null)" class="px-3.5 py-2 rounded-xl text-xs font-bold bg-dark-800 hover:bg-brand hover:text-dark-950 text-slate-300 border border-dark-border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow shrink-0">
            <span>إلغاء الفلتر</span>
            <i class="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
          ${filtered.length > 0 ? filtered.map(createMediaCardHtml).join('') : '<div class="col-span-full py-12 text-center text-slate-400"><p>لا توجد أعمال إضافية مسجلة لهذا الممثل حالياً.</p></div>'}
        </div>
      </section>
    `;
    observeLazyMedia(container);
    return;
  }

  const tab = appState.activeNavTab;

  // 2. CATEGORY TABS (ORGANIZED: MOVIES VS SERIES SEPARATED CLEANLY)
  if (tab === 'comedy' || tab === 'plays') {
    const items = appState.allMedia.filter(i => isPlayOrComedyItem(i) && !isAnimeItem(i));
    renderSplitMoviesSeriesCategory('مسرحيات وأعمال كوميدية 🎭😂', items, 'أفلام ومسرحيات كوميدية 🎭', 'مسلسلات كوميدية 📺');
    return;
  }
  if (tab === 'foreign') {
    const items = appState.allMedia.filter(i =>
      !isSeriesItem(i) &&
      !isAnimeItem(i) &&
      (i.origin === 'foreign' || (!i.origin && i.category === 'movies')) &&
      i.category !== 'live'
    );
    renderGridCategory('أفلام أجنبية وعالمية 🎬', items);
    return;
  }
  if (tab === 'arabic') {
    const items = appState.allMedia.filter(i =>
      !isSeriesItem(i) &&
      !isAnimeItem(i) &&
      (i.origin === 'arabic' || i.origin === 'yemeni') &&
      i.category !== 'live'
    );
    renderGridCategory('أفلام وسينما عربية 🍿', items);
    return;
  }
  if (tab === 'turkish') {
    const items = appState.allMedia.filter(i => (i.origin === 'turkish' || i.category === 'turkish') && i.category !== 'live');
    renderSplitMoviesSeriesCategory('أفلام ومسلسلات تركية 🇹🇷', items, 'أفلام تركية 🎬', 'مسلسلات تركية 📺');
    return;
  }
  if (tab === 'indian') {
    const items = appState.allMedia.filter(i => (i.origin === 'indian' || i.category === 'indian') && i.category !== 'live');
    renderSplitMoviesSeriesCategory('أفلام بوليوود وهندية 🇮🇳', items, 'أفلام هندية وبوليوود 🎬', 'مسلسلات هندية 📺');
    return;
  }
  if (tab === 'korean') {
    const items = appState.allMedia.filter(i => (i.origin === 'korean' || i.category === 'korean') && i.category !== 'live');
    renderSplitMoviesSeriesCategory('سينما ودراما كورية 🇰🇷', items, 'أفلام كورية 🎬', 'مسلسلات كورية 📺');
    return;
  }
  if (tab === 'yemeni') {
    const items = appState.allMedia.filter(i =>
      (i.origin === 'yemeni' || i.category === 'yemeni' || (i.badge && i.badge.includes('يمني')) || (getGenreString(i.genre).includes('يمن'))) &&
      i.category !== 'live'
    );
    renderSplitMoviesSeriesCategory('أعمال ومسلسلات يمنية 🇾🇪', items, 'أفلام يمنية 🎬', 'مسلسلات يمنية 📺');
    return;
  }
  if (tab === 'anime') {
    const items = appState.allMedia.filter(i =>
      isAnimeItem(i) ||
      (isSeriesItem(i) && (i.origin === 'anime' || i.subGenre === 'anime' || i.subGenre === 'animation' || getGenreString(i.genre).includes('أنمي') || getGenreString(i.genre).includes('رسوم متحركة')))
    );
    renderSplitMoviesSeriesCategory('عالم الأنمي والكرتون 🎨', items, 'أفلام الأنمي والكرتون 🎬', 'مسلسلات الأنمي 🎨📺');
    return;
  }
  if (tab === 'series') {
    const items = appState.allMedia.filter(i => isSeriesItem(i));
    renderSeriesInterface(items);
    return;
  }
  if (tab === 'favorites') {
    const favItems = appState.allMedia.filter(i => isFavorite(i.id));
    renderFavoritesTabCategory(favItems);
    return;
  }
  if (tab === 'live') {
    renderLiveChannelsSection();
    return;
  }
  if (tab === 'ads') {
    renderAdsAndOffersSection();
    return;
  }
  if (tab === 'adminUsers') {
    if (window.TadhkiraAuth?.isAdminUser?.() && typeof window.TadhkiraAuth.renderAdminUsersPageSection === 'function') {
      window.TadhkiraAuth.renderAdminUsersPageSection();
    } else {
      switchNavTab('all');
    }
    return;
  }

  // 3. HOME / ALL TAB: STAGE 1 - Organized Clean Showcase (Movies & Series Strictly Separated)
  const favorites = appState.allMedia.filter(i => isFavorite(i.id));
  const movies = appState.allMedia.filter(i => !isSeriesItem(i) && !isAnimeItem(i) && i.category !== 'live');
  const series = appState.allMedia.filter(i => isSeriesItem(i));
  const comedyAndPlays = appState.allMedia.filter(i => !isSeriesItem(i) && !isAnimeItem(i) && isPlayOrComedyItem(i));
  const arabicMovies = movies.filter(i => i.origin === 'arabic' || i.origin === 'yemeni');
  const homeLiveFeatured = getHomeFeaturedLiveChannels();

  container.innerHTML = `
    ${favorites.length > 0 ? `
    <section id="homeFavoritesSection" class="space-y-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/25 via-dark-900/50 to-dark-900 border border-rose-500/25 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 text-white flex items-center justify-center text-xs shadow-md shadow-rose-600/30">
            <i class="fa-solid fa-heart"></i>
          </span>
          <h3 class="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>مفضلاتي</span>
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">${favorites.length} عمل</span>
          </h3>
        </div>
        <button onclick="switchNavTab('favorites')" class="text-xs text-rose-400 hover:text-rose-300 transition-colors font-medium flex items-center gap-1 cursor-pointer">
          <span>عرض الكل (${favorites.length})</span> <i class="fa-solid fa-angle-left text-[10px]"></i>
        </button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
        ${favorites.slice(0, 6).map(createMediaCardHtml).join('')}
      </div>
    </section>
    ` : ''}

    ${homeLiveFeatured.length > 0 ? `
    <section id="homeLiveTvSection" class="space-y-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/25 via-dark-900 to-indigo-950/20 border border-rose-500/35 shadow-xl">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <span class="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center text-sm shadow-md shadow-rose-600/30 font-black">
            <i class="fa-solid fa-tower-broadcast"></i>
          </span>
          <div>
            <h3 class="text-base sm:text-lg font-black text-white flex items-center gap-2 flex-wrap">
              <span>البث المباشر للقنوات الرسمية 🔴</span>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold">${appState.liveChannels.length} قناة مباشرة</span>
            </h3>
            <p class="text-[10.5px] text-slate-400">القنوات اليمنية • باقة MBC • سبيستون وCN بالعربية • القنوات الرياضية المفتوحة للدوريات الأوروبية</p>
          </div>
        </div>
        <button onclick="switchNavTab('live')" class="text-xs text-rose-300 hover:text-white bg-rose-500/15 hover:bg-rose-600 border border-rose-500/40 px-3 py-1.5 rounded-xl transition-all font-bold flex items-center gap-1.5 shrink-0 cursor-pointer">
          <span>عرض كل القنوات</span> <i class="fa-solid fa-angle-left text-[10px]"></i>
        </button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
        ${homeLiveFeatured.map(createLiveChannelCardHtml).join('')}
      </div>
    </section>
    ` : ''}

    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-base sm:text-lg font-black text-white flex items-center gap-2">
          <span>أحدث الأفلام السينمائية 🎬</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">${movies.length} فيلم</span>
        </h3>
        <button onclick="switchNavTab('foreign')" class="text-xs text-slate-400 hover:text-brand transition-colors font-medium flex items-center gap-1 cursor-pointer">
          <span>عرض الكل</span> <i class="fa-solid fa-angle-left text-[10px]"></i>
        </button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
        ${movies.slice(0, 12).map(createMediaCardHtml).join('')}
      </div>
    </section>

    ${series.length > 0 ? `
    <section class="space-y-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/20 via-dark-900 to-dark-900 border border-amber-500/25 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-dark-950 flex items-center justify-center text-sm shadow-md shadow-amber-500/25 font-black">
            📺
          </span>
          <div>
            <h3 class="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>مسلسلات كاملة الحلقات 📺</span>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 font-bold">${series.length} مسلسل</span>
            </h3>
            <p class="text-[10px] text-slate-400">قسم مستقل للمسلسلات العربية واليمنية والتركية والأجنبية</p>
          </div>
        </div>
        <button onclick="switchNavTab('series')" class="text-xs text-amber-400 hover:text-amber-300 transition-colors font-bold flex items-center gap-1 cursor-pointer">
          <span>عرض الكل (${series.length})</span> <i class="fa-solid fa-angle-left text-[10px]"></i>
        </button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
        ${series.slice(0, 12).map(createMediaCardHtml).join('')}
      </div>
    </section>
    ` : ''}

    ${comedyAndPlays.length > 0 ? `
    <section class="space-y-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/20 via-dark-900 to-amber-950/20 border border-amber-400/30 shadow-xl">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-purple-500 text-dark-950 flex items-center justify-center text-sm shadow-md shadow-amber-500/25 font-black">
            🎭
          </span>
          <div>
            <h3 class="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>أفلام ومسرحيات كوميدية 🎭</span>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 font-bold">${comedyAndPlays.length} عمل مميز</span>
            </h3>
            <p class="text-[10px] text-slate-400">أقوى المسرحيات الكوميدية والأفلام العائلية الجديدة بأعلى جودة FHD</p>
          </div>
        </div>
        <button onclick="switchNavTab('comedy')" class="text-xs text-amber-400 hover:text-amber-300 transition-colors font-bold flex items-center gap-1 cursor-pointer">
          <span>عرض الكل (${comedyAndPlays.length})</span> <i class="fa-solid fa-angle-left text-[10px]"></i>
        </button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
        ${comedyAndPlays.slice(0, 12).map(createMediaCardHtml).join('')}
      </div>
    </section>
    ` : ''}

    <div id="deferredHomeSections" class="space-y-8"></div>
  `;

  observeLazyMedia(container);

  // HOME STAGE 2: Lazy-mount below-the-fold category sections strictly on scroll via IntersectionObserver
  deferredHomeTimer = setTimeout(() => {
    if (appState.activeNavTab !== 'all') return;
    const deferredContainer = document.getElementById('deferredHomeSections');
    if (!deferredContainer) return;

    const anime = appState.allMedia.filter(i =>
      isAnimeItem(i) || (isSeriesItem(i) && (i.origin === 'anime' || i.subGenre === 'anime'))
    );
    const yemeni = appState.allMedia.filter(i => (i.origin === 'yemeni' || i.category === 'yemeni') && i.category !== 'live');
    const turkish = appState.allMedia.filter(i => i.origin === 'turkish' && i.category !== 'live');
    const indian = appState.allMedia.filter(i => i.origin === 'indian' && i.category !== 'live');
    const korean = appState.allMedia.filter(i => i.origin === 'korean' && i.category !== 'live');

    const builders = {};
    const slotKeys = [];

    if (arabicMovies.length > 0) {
      slotKeys.push('arabic');
      builders.arabic = () => `
      <section class="lazy-section-block space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-dark-950 flex items-center justify-center text-xs shadow-md shadow-emerald-500/30 font-black">
              🍿
            </span>
            <h3 class="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>أفلام وسينما عربية 🍿</span>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">${arabicMovies.length} فيلم</span>
            </h3>
          </div>
          <button onclick="switchNavTab('arabic')" class="text-xs text-slate-400 hover:text-brand transition-colors font-medium flex items-center gap-1 cursor-pointer">
            <span>عرض الكل (${arabicMovies.length})</span> <i class="fa-solid fa-angle-left text-[10px]"></i>
          </button>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
          ${arabicMovies.slice(0, 12).map(createMediaCardHtml).join('')}
        </div>
      </section>`;
    }

    if (anime.length > 0) {
      slotKeys.push('anime');
      builders.anime = () => `
      <section class="lazy-section-block space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-400 text-white flex items-center justify-center text-xs shadow-md shadow-pink-600/30">
              <i class="fa-solid fa-wand-magic-sparkles"></i>
            </span>
            <h3 class="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>عالم الأنمي والكرتون 🎨</span>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 font-bold">${anime.length} عمل</span>
            </h3>
          </div>
          <button onclick="switchNavTab('anime')" class="text-xs text-slate-400 hover:text-brand transition-colors font-medium flex items-center gap-1 cursor-pointer">
            <span>عرض الكل (${anime.length})</span> <i class="fa-solid fa-angle-left text-[10px]"></i>
          </button>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
          ${anime.slice(0, 6).map(createMediaCardHtml).join('')}
        </div>
      </section>`;
    }

    if (yemeni.length > 0) {
      slotKeys.push('yemeni');
      builders.yemeni = () => `
      <section class="lazy-section-block space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>أعمال ومسلسلات يمنية 🇾🇪</span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">${yemeni.length} عمل</span>
          </h3>
          <button onclick="switchNavTab('yemeni')" class="text-xs text-slate-400 hover:text-brand transition-colors font-medium flex items-center gap-1 cursor-pointer">
            <span>عرض الكل</span> <i class="fa-solid fa-angle-left text-[10px]"></i>
          </button>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
          ${yemeni.slice(0, 6).map(createMediaCardHtml).join('')}
        </div>
      </section>`;
    }

    if (turkish.length > 0) {
      slotKeys.push('turkish');
      builders.turkish = () => `
      <section class="lazy-section-block space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>السينما والدراما التركية 🇹🇷</span>
          </h3>
          <button onclick="switchNavTab('turkish')" class="text-xs text-slate-400 hover:text-brand transition-colors font-medium flex items-center gap-1 cursor-pointer">
            <span>عرض الكل</span> <i class="fa-solid fa-angle-left text-[10px]"></i>
          </button>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
          ${turkish.slice(0, 6).map(createMediaCardHtml).join('')}
        </div>
      </section>`;
    }

    if (indian.length > 0) {
      slotKeys.push('indian');
      builders.indian = () => `
      <section class="lazy-section-block space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>أفلام بوليوود والهندية 🇮🇳</span>
          </h3>
          <button onclick="switchNavTab('indian')" class="text-xs text-slate-400 hover:text-brand transition-colors font-medium flex items-center gap-1 cursor-pointer">
            <span>عرض الكل</span> <i class="fa-solid fa-angle-left text-[10px]"></i>
          </button>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
          ${indian.slice(0, 6).map(createMediaCardHtml).join('')}
        </div>
      </section>`;
    }

    if (korean.length > 0) {
      slotKeys.push('korean');
      builders.korean = () => `
      <section class="lazy-section-block space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>السينما الكورية 🇰🇷</span>
          </h3>
          <button onclick="switchNavTab('korean')" class="text-xs text-slate-400 hover:text-brand transition-colors font-medium flex items-center gap-1 cursor-pointer">
            <span>عرض الكل</span> <i class="fa-solid fa-angle-left text-[10px]"></i>
          </button>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
          ${korean.slice(0, 6).map(createMediaCardHtml).join('')}
        </div>
      </section>`;
    }

    deferredContainer.innerHTML = slotKeys
      .map(key => `<div data-lazy-section-key="${key}" class="min-h-[260px] rounded-2xl bg-dark-900/35 border border-dark-border/40"></div>`)
      .join('');

    registerLazySectionSlots(deferredContainer, builders);
  }, 50);
}

const GRID_CHUNK_SIZE = 24;
let activeGridItems = [];
let activeGridRenderedCount = 0;
let gridObserver = null;

function renderGridCategory(title, items) {
  const container = document.getElementById('dynamicSectionsContainer');
  if (!container) return;

  if (gridObserver) {
    try { gridObserver.disconnect(); } catch (e) {}
    gridObserver = null;
  }

  activeGridItems = items || [];
  activeGridRenderedCount = 0;

  const initialChunk = activeGridItems.slice(0, GRID_CHUNK_SIZE);
  activeGridRenderedCount = initialChunk.length;

  container.innerHTML = `
    <section class="space-y-4">
      <div class="flex items-center justify-between border-b border-dark-border/60 pb-3">
        <h2 class="text-base sm:text-xl font-black text-white flex items-center gap-2">
          <span>${title}</span>
          <span class="text-xs px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 font-bold">${activeGridItems.length} عمل</span>
        </h2>
        <button onclick="switchNavTab('all')" class="text-xs text-slate-400 hover:text-brand transition-colors font-medium flex items-center gap-1 cursor-pointer">
          <span>العودة للرئيسية</span> <i class="fa-solid fa-angle-left text-[10px]"></i>
        </button>
      </div>
      <div id="categoryCardsGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
        ${initialChunk.length > 0 ? initialChunk.map(createMediaCardHtml).join('') : '<div class="col-span-full py-16 text-center text-slate-400"><p>لا توجد عناصر مسجلة في هذا القسم حالياً.</p></div>'}
      </div>
      ${activeGridRenderedCount < activeGridItems.length ? '<div id="gridSentinel" class="h-8 w-full flex items-center justify-center opacity-0 pointer-events-none"></div>' : ''}
    </section>
  `;

  if (activeGridRenderedCount < activeGridItems.length) {
    setupGridInfiniteScroll();
  }
  observeLazyMedia(container);
}

function setupGridInfiniteScroll() {
  const sentinel = document.getElementById('gridSentinel');
  const grid = document.getElementById('categoryCardsGrid');
  if (!sentinel || !grid) return;

  gridObserver = new IntersectionObserver((entries) => {
    if (entries[0] && entries[0].isIntersecting) {
      if (activeGridRenderedCount >= activeGridItems.length) {
        if (gridObserver) gridObserver.disconnect();
        sentinel.remove();
        return;
      }
      const nextChunk = activeGridItems.slice(activeGridRenderedCount, activeGridRenderedCount + GRID_CHUNK_SIZE);
      activeGridRenderedCount += nextChunk.length;

      const fragment = document.createRange().createContextualFragment(nextChunk.map(createMediaCardHtml).join(''));
      grid.appendChild(fragment);
      observeLazyMedia(grid);

      if (activeGridRenderedCount >= activeGridItems.length) {
        if (gridObserver) gridObserver.disconnect();
        sentinel.remove();
      }
    }
  }, { rootMargin: '350px 0px' });

  gridObserver.observe(sentinel);
}

function renderFavoritesTabCategory(items) {
  const container = document.getElementById('dynamicSectionsContainer');
  if (!container) return;
  container.innerHTML = `
    <section class="space-y-4">
      <div class="flex items-center justify-between border-b border-dark-border/60 pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white text-sm shadow-md shadow-rose-500/30">
            <i class="fa-solid fa-heart"></i>
          </div>
          <div>
            <h2 class="text-base sm:text-xl font-black text-white flex items-center gap-2">
              <span>قائمة مفضلاتي ❤️</span>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">${items.length} عمل</span>
            </h2>
            <p class="text-xs text-slate-400">جميع الأفلام والمسلسلات التي أضفتها لقائمتك الخاصة</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          ${items.length > 0 ? `
          <button onclick="clearAllFavorites()" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-dark-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-dark-border transition-all flex items-center gap-1.5 cursor-pointer">
            <i class="fa-regular fa-trash-can text-xs"></i>
            <span>مسح الكل</span>
          </button>
          ` : ''}
          <button onclick="switchNavTab('all')" class="text-xs text-slate-400 hover:text-brand transition-colors font-medium flex items-center gap-1">
            <span>العودة للرئيسية</span> <i class="fa-solid fa-angle-left text-[10px]"></i>
          </button>
        </div>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
        ${items.length > 0
          ? items.map(createMediaCardHtml).join('')
          : `
          <div class="col-span-full py-16 text-center space-y-3">
            <div class="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 text-2xl shadow-inner">
              <i class="fa-regular fa-heart"></i>
            </div>
            <h3 class="text-base font-black text-white">قائمة المفضلة فارغة حالياً</h3>
            <p class="text-xs text-slate-400 max-w-sm mx-auto">
              يمكنك حفظ أي فيلم أو مسلسل بالضغط على علامة القلب <i class="fa-solid fa-heart text-rose-500 text-xs"></i> في بطاقة العرض للرجوع إليه في أي وقت.
            </p>
            <button onclick="switchNavTab('all')" class="mt-3 px-5 py-2 rounded-xl text-xs font-black bg-brand text-dark-950 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-brand/20 cursor-pointer">
              تصفح الأعمال الآن
            </button>
          </div>
          `
        }
      </div>
    </section>
  `;
  observeLazyMedia(container);
}

function renderSplitMoviesSeriesCategory(title, items, moviesHeading = 'الأفلام 🎬', seriesHeading = 'المسلسلات 📺') {
  const onlyMovies = (items || []).filter(i => !isSeriesItem(i));
  const onlySeries = (items || []).filter(i => isSeriesItem(i));

  if (onlySeries.length === 0) {
    renderGridCategory(title, onlyMovies);
    return;
  }
  if (onlyMovies.length === 0) {
    renderGridCategory(title, onlySeries);
    return;
  }

  const container = document.getElementById('dynamicSectionsContainer');
  if (!container) return;
  if (gridObserver) {
    try { gridObserver.disconnect(); } catch (e) {}
    gridObserver = null;
  }

  container.innerHTML = `
    <section class="space-y-6">
      <div class="flex items-center justify-between border-b border-dark-border/60 pb-3">
        <h2 class="text-base sm:text-xl font-black text-white flex items-center gap-2 flex-wrap">
          <span>${title}</span>
          <span class="text-xs px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 font-bold">${onlyMovies.length} فيلم • ${onlySeries.length} مسلسل</span>
        </h2>
        <button onclick="switchNavTab('all')" class="text-xs text-slate-400 hover:text-brand transition-colors font-medium flex items-center gap-1 cursor-pointer shrink-0">
          <span>العودة للرئيسية</span> <i class="fa-solid fa-angle-left text-[10px]"></i>
        </button>
      </div>

      <div class="space-y-3">
        <h3 class="text-sm sm:text-base font-black text-brand flex items-center gap-2">
          <span>${moviesHeading}</span>
          <span class="text-[11px] px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">${onlyMovies.length}</span>
        </h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
          ${onlyMovies.map(createMediaCardHtml).join('')}
        </div>
      </div>

      <div class="space-y-3 pt-2 border-t border-dark-border/50">
        <h3 class="text-sm sm:text-base font-black text-amber-400 flex items-center gap-2">
          <span>${seriesHeading}</span>
          <span class="text-[11px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">${onlySeries.length}</span>
        </h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
          ${onlySeries.map(createMediaCardHtml).join('')}
        </div>
      </div>
    </section>
  `;
  observeLazyMedia(container);
}

function switchSeriesOriginFilter(originKey) {
  appState.activeSeriesOrigin = originKey;
  const items = appState.allMedia.filter(i => isSeriesItem(i));
  renderSeriesInterface(items);
}

function renderSeriesInterface(items = []) {
  const container = document.getElementById('dynamicSectionsContainer');
  if (!container) return;

  if (gridObserver) {
    try { gridObserver.disconnect(); } catch (e) {}
    gridObserver = null;
  }

  const originKey = appState.activeSeriesOrigin || 'all';
  const filtered = originKey === 'all'
    ? items
    : items.filter(i => originKey === 'arabic' ? (i.origin === 'arabic' || i.origin === 'yemeni') : i.origin === originKey);

  const filters = [
    { key: 'all', label: `الكل (${items.length})` },
    { key: 'arabic', label: `عربية وخليجية (${items.filter(i => i.origin === 'arabic' || i.origin === 'yemeni').length})` },
    { key: 'yemeni', label: `يمنية 🇾🇪 (${items.filter(i => i.origin === 'yemeni').length})` },
    { key: 'turkish', label: `تركية 🇹🇷 (${items.filter(i => i.origin === 'turkish').length})` },
    { key: 'foreign', label: `أجنبية 🎬 (${items.filter(i => i.origin === 'foreign').length})` },
  ];

  container.innerHTML = `
    <section class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dark-border/60 pb-3">
        <div class="flex items-center gap-2.5">
          <span class="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-dark-950 flex items-center justify-center text-sm shadow-md shadow-amber-500/20 font-black">
            📺
          </span>
          <div>
            <h2 class="text-base sm:text-xl font-black text-white flex items-center gap-2">
              <span>جميع المسلسلات والحلقات 📺</span>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 font-bold">${filtered.length} مسلسل</span>
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">قسم المسلسلات التلفزيونية والدراما مرتب حسب المواسم والحلقات</p>
          </div>
        </div>
        <button onclick="switchNavTab('all')" class="text-xs text-slate-400 hover:text-brand transition-colors font-medium flex items-center gap-1 cursor-pointer self-start sm:self-auto">
          <span>العودة للرئيسية</span> <i class="fa-solid fa-angle-left text-[10px]"></i>
        </button>
      </div>

      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        ${filters.map(f => `
          <button
            onclick="switchSeriesOriginFilter('${f.key}')"
            class="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer border ${originKey === f.key ? 'bg-amber-400 text-dark-950 border-amber-400 shadow-sm' : 'bg-dark-900 text-slate-300 hover:text-white border-dark-border hover:border-amber-400/40'}"
          >${f.label}</button>
        `).join('')}
      </div>

      ${filtered.length > 0 ? `
        <div id="categoryCardsGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
          ${filtered.map(createMediaCardHtml).join('')}
        </div>
      ` : `
        <div class="py-12 px-4 rounded-2xl bg-dark-900/60 border border-dark-border/80 text-center text-slate-400 text-sm">
          لا توجد مسلسلات في هذا التصنيف حالياً.
        </div>
      `}
    </section>
  `;
  observeLazyMedia(container);
}

function findMediaOrLiveItem(itemId) {
  if (!itemId) return null;
  return (appState.allMedia || []).find(i => i.id === itemId) || (appState.liveChannels || []).find(c => c.id === itemId) || null;
}

function getHomeFeaturedLiveChannels() {
  const list = appState.liveChannels || [];
  if (list.length === 0) return [];
  const preferredIds = [
    'live-cbs-golazo',
    'live-yemen-shabab',
    'live-mbc-1',
    'live-spacetoon',
    'live-cn-arabic',
    'live-almahriah'
  ];
  const picked = [];
  preferredIds.forEach(id => {
    const ch = list.find(c => c.id === id);
    if (ch) picked.push(ch);
  });
  for (const ch of list) {
    if (picked.length >= 6) break;
    if (!picked.some(p => p.id === ch.id)) picked.push(ch);
  }
  return picked.slice(0, 6);
}

function createLiveChannelCardHtml(ch) {
  const grad = ch.accentGradient || 'from-rose-600 via-slate-800 to-slate-950';
  const hasHls = Boolean(ch.isLiveHls && ch.streamUrl);
  const badgeText = ch.badgeLabel || (hasHls ? 'بث مباشر 🔴' : 'القناة الرسمية ⚡');

  return `
    <div
      data-id="${escapeHtml(ch.id)}"
      onclick="handleLiveChannelClick(this.dataset.id)"
      class="media-card group relative bg-dark-900 border border-dark-border/90 hover:border-rose-500/70 rounded-2xl overflow-hidden cursor-pointer flex flex-col select-none transition-all hover:shadow-xl hover:shadow-rose-600/10"
    >
      <div class="relative w-full aspect-[16/10] bg-gradient-to-br ${grad} overflow-hidden flex items-center justify-center p-3">
        <!-- Studio Ambient Glow -->
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.14)_0%,transparent_68%)] pointer-events-none"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-dark-950/20 to-black/30 pointer-events-none"></div>

        <!-- Top Live Status Pill -->
        <div class="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/15 text-[9.5px] font-black text-white shadow">
          <span class="w-1.5 h-1.5 rounded-full ${hasHls ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'}"></span>
          <span>${hasHls ? 'مباشر' : 'رسمي'}</span>
        </div>

        <!-- Quality & Flag Badge -->
        <div class="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/15 text-[9.5px] font-black text-amber-300 shadow">
          <span>${escapeHtml(ch.countryFlag || '📺')}</span>
          <span>${escapeHtml(ch.quality || 'HD')}</span>
        </div>

        <!-- Center Original Official Logo Stage -->
        <div class="relative z-10 flex flex-col items-center justify-center text-center px-3 py-2 rounded-2xl bg-slate-950/55 border border-white/15 backdrop-blur-md shadow-xl group-hover:scale-105 transition-transform duration-300 w-[84%] h-[72%] overflow-hidden">
          ${ch.logo ? `
            <img
              src="${LAZY_TRANSPARENT_PLACEHOLDER}"
              data-src="${escapeHtml(ch.logo)}"
              alt="${escapeHtml(ch.title)}"
              class="lazy-media-img max-w-full max-h-full w-auto h-auto object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.42)]"
              loading="lazy"
              decoding="async"
              onerror="if(!this.hasAttribute('data-src')){this.style.display='none'; this.nextElementSibling.style.display='flex';}"
            />
            <div style="display:none" class="flex-col items-center justify-center">
              <span class="text-sm sm:text-base font-black tracking-tight text-white drop-shadow truncate max-w-full">
                ${escapeHtml(ch.shortCode || ch.network || ch.title)}
              </span>
              <span class="text-[9px] font-bold text-slate-200/90 truncate max-w-full mt-0.5">
                ${escapeHtml(ch.network || 'Official Broadcast')}
              </span>
            </div>
          ` : `
            <span class="text-sm sm:text-base font-black tracking-tight text-white drop-shadow truncate max-w-full">
              ${escapeHtml(ch.shortCode || ch.network || ch.title)}
            </span>
            <span class="text-[9px] font-bold text-slate-200/90 truncate max-w-full mt-0.5">
              ${escapeHtml(ch.network || 'Official Broadcast')}
            </span>
          `}
        </div>

        <!-- Hover Play Overlay -->
        <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/35 backdrop-blur-[1px] z-20">
          <div class="w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transform scale-90 group-hover:scale-100 transition-transform">
            <i class="fa-solid fa-play text-sm ml-0.5"></i>
          </div>
        </div>
      </div>

      <div class="p-2.5 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <span class="inline-block text-[9px] font-black text-rose-300 mb-0.5">
            ${escapeHtml(badgeText)}
          </span>
          <h4 class="text-xs font-black text-white group-hover:text-rose-300 transition-colors line-clamp-1">
            ${escapeHtml(ch.title)}
          </h4>
          <p class="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
            ${escapeHtml(ch.overview || '')}
          </p>
        </div>

        <div class="pt-1.5 border-t border-dark-border/50 flex items-center justify-between text-[10px]">
          <span class="text-slate-400 font-semibold truncate">${escapeHtml(getFirstGenre(ch.genre, 'بث مباشر'))}</span>
          <span class="text-rose-400 font-black flex items-center gap-1 shrink-0">
            <span>تشغيل</span>
            <i class="fa-solid fa-angle-left text-[8px]"></i>
          </span>
        </div>
      </div>
    </div>
  `;
}

function switchLiveCategoryFilter(catKey) {
  appState.activeLiveCategory = catKey || 'all';
  renderLiveChannelsSection();
}

function renderLiveChannelsSection() {
  const container = document.getElementById('dynamicSectionsContainer');
  if (!container) return;

  if (gridObserver) {
    try { gridObserver.disconnect(); } catch (e) {}
    gridObserver = null;
  }

  const allChannels = appState.liveChannels || [];
  const activeCat = appState.activeLiveCategory || 'all';

  const groups = [
    { key: 'sports', label: '⚽ الرياضة والدوريات الأوروبية (قنوات رسمية)', shortLabel: '⚽ الدوريات الأوروبية والرياضة' },
    { key: 'yemeni', label: '🇾🇪 القنوات اليمنية الفضائية', shortLabel: '🇾🇪 القنوات اليمنية' },
    { key: 'mbc', label: '📺 باقة قنوات MBC الرسمية', shortLabel: '📺 باقة MBC' },
    { key: 'kids', label: '🎨 سبيستون وCN بالعربية والأطفال', shortLabel: '🎨 سبيستون وCN بالعربية' },
    { key: 'news', label: '📡 الأخبار والوثائقية', shortLabel: '📡 الأخبار والوثائقية' }
  ];

  const filterButtonsHtml = [
    `<button onclick="switchLiveCategoryFilter('all')" class="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer border ${activeCat === 'all' ? 'bg-rose-600 text-white border-rose-500 shadow-sm' : 'bg-dark-900 text-slate-300 hover:text-white border-dark-border hover:border-rose-500/40'}">الكل (${allChannels.length})</button>`,
    ...groups.map(g => {
      const count = allChannels.filter(c => c.liveCategory === g.key).length;
      const isSelected = activeCat === g.key;
      return `<button onclick="switchLiveCategoryFilter('${g.key}')" class="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer border ${isSelected ? 'bg-rose-600 text-white border-rose-500 shadow-sm' : 'bg-dark-900 text-slate-300 hover:text-white border-dark-border hover:border-rose-500/40'}">${g.shortLabel} (${count})</button>`;
    })
  ].join('');

  let bodyHtml = '';
  if (allChannels.length === 0) {
    bodyHtml = `<div class="py-16 text-center text-slate-400">جاري تحميل قائمة القنوات الرسمية المباشرة...</div>`;
  } else if (activeCat === 'all') {
    bodyHtml = groups.map(g => {
      const items = allChannels.filter(c => c.liveCategory === g.key);
      if (items.length === 0) return '';
      return `
        <div class="space-y-3 pt-2">
          <div class="flex items-center justify-between border-b border-dark-border/50 pb-2">
            <h3 class="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <span>${g.label}</span>
              <span class="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">${items.length} قناة</span>
            </h3>
            <button onclick="switchLiveCategoryFilter('${g.key}')" class="text-xs text-slate-400 hover:text-rose-300 cursor-pointer flex items-center gap-1">
              <span>تركيز</span><i class="fa-solid fa-angle-left text-[10px]"></i>
            </button>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
            ${items.map(createLiveChannelCardHtml).join('')}
          </div>
        </div>
      `;
    }).join('');
  } else {
    const filtered = allChannels.filter(c => c.liveCategory === activeCat);
    const activeGroup = groups.find(g => g.key === activeCat);
    bodyHtml = `
      <div class="space-y-3">
        <h3 class="text-sm sm:text-base font-black text-rose-300 flex items-center gap-2">
          <span>${activeGroup ? activeGroup.label : 'القنوات المختارة'}</span>
          <span class="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">${filtered.length}</span>
        </h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
          ${filtered.map(createLiveChannelCardHtml).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <section class="space-y-5">
      <!-- Top Live Banner -->
      <div class="p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-rose-600/20 via-dark-900 to-indigo-950/30 border border-rose-500/40 shadow-2xl space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-start gap-3">
            <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center text-lg shadow-lg shadow-rose-600/30 shrink-0">
              <i class="fa-solid fa-tower-broadcast"></i>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-lg sm:text-2xl font-black text-white">قسم البث المباشر الرسمي 🔴</h2>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">روابط رسمية مستقرة 100%</span>
              </div>
              <p class="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
                بث مباشر مستقر للقنوات اليمنية وباقة MBC وسبيستون وCN بالعربية، بالإضافة للقنوات الرياضية الرسمية المفتوحة واستوديوهات وملخصات الدوريات الأوروبية (دوري الأبطال، الإنجليزي، الإسباني، الإيطالي، والألماني) بدون روابط مخالفة أو تقطيع.
              </p>
            </div>
          </div>
          <button onclick="switchNavTab('all')" class="px-3.5 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-200 border border-dark-border text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-center">
            <i class="fa-solid fa-arrow-right"></i>
            <span>العودة للرئيسية</span>
          </button>
        </div>

        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          ${filterButtonsHtml}
        </div>
      </div>

      ${bodyHtml}
    </section>
  `;
  observeLazyMedia(container);
}

function handleLiveChannelClick(channelId) {
  const ch = (appState.liveChannels || []).find(c => c.id === channelId) || findMediaOrLiveItem(channelId);
  if (!ch) return;
  appState.activeLiveSourceKey = 'primary';
  openPlayerModalWithItem(ch);
}

function handleCardClick(itemId) {
  const item = findMediaOrLiveItem(itemId);
  if (!item) return;
  if (item.category === 'live' || item.type === 'live') {
    handleLiveChannelClick(item.id);
    return;
  }
  if (item.category === 'series' || item.type === 'series' || (Array.isArray(item.episodes) && item.episodes.length > 0)) {
    appState.currentSeries = item;
    const initialEp = (item.episodes && item.episodes.length > 0 && item.episodes[0].episodeNum !== undefined)
      ? item.episodes[0].episodeNum
      : 1;
    switchSeriesEpisode(initialEp);
  } else {
    openPlayerModal(item.id);
  }
}

function switchSeriesEpisode(epNum) {
  if (!appState.currentSeries) return;
  const series = appState.currentSeries;
  const epData = (series.episodes && series.episodes.find(e => e.episodeNum === epNum)) || (series.episodes && series.episodes[epNum - 1]) || (series.episodes && series.episodes[0]);
  const currentEpNum = (epData && epData.episodeNum !== undefined) ? epData.episodeNum : epNum;
  const epItem = {
    id: `ep-${series.id}-${currentEpNum}`,
    title: `${series.title} - ${epData && epData.title ? epData.title : `الحلقة ${currentEpNum}`}`,
    category: 'series',
    type: 'series',
    origin: series.origin,
    year: series.year,
    quality: (epData && epData.quality) || series.quality || '1080p FHD',
    poster: (epData && epData.poster) || series.poster,
    backdrop: (epData && epData.backdrop) || series.backdrop,
    tmdbId: series.tmdbId,
    episodeNum: currentEpNum,
    seasonNum: 1,
    tgCode: epData ? epData.tgCode : series.tgCode,
    tgCode480: epData ? epData.tgCode480 : series.tgCode480,
    customWidth: (epData && epData.customWidth) || series.customWidth || 600,
    customHeight: (epData && epData.customHeight) || series.customHeight || 480,
    seriesData: series
  };
  openPlayerModalWithItem(epItem);
}

function renderSeriesEpisodesQuickBar(series, activeEpNum) {
  const bar = document.getElementById('seriesEpisodesQuickBar');
  if (!bar) return;
  const episodesList = series.episodes || [];
  const count = episodesList.length || series.episodesCount || 4;
  
  const episodesHtml = episodesList.length > 0
    ? episodesList.map((ep, idx) => {
        const num = ep.episodeNum !== undefined ? ep.episodeNum : (idx + 1);
        const title = ep.title || `حلقة ${num}`;
        const isActive = num === activeEpNum;
        return `
          <button
            onclick="switchSeriesEpisode(${num})"
            class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${isActive ? 'bg-amber-400 text-dark-950 shadow-md ring-2 ring-amber-300 font-black' : 'bg-dark-800 hover:bg-dark-750 text-slate-200 border border-dark-border hover:border-amber-400/50'}"
          >
            ${title}
          </button>
        `;
      }).join('')
    : Array.from({ length: count }, (_, idx) => {
        const num = idx + 1;
        const isActive = num === activeEpNum;
        return `
          <button
            onclick="switchSeriesEpisode(${num})"
            class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${isActive ? 'bg-amber-400 text-dark-950 shadow-md ring-2 ring-amber-300 font-black' : 'bg-dark-800 hover:bg-dark-750 text-slate-200 border border-dark-border hover:border-amber-400/50'}"
          >
            حلقة ${num}
          </button>
        `;
      }).join('');

  bar.innerHTML = `
    <span class="text-xs font-bold text-amber-400 ml-2 shrink-0 flex items-center gap-1"><i class="fa-solid fa-list-ol text-[10px]"></i> الحلقات:</span>
    ${episodesHtml}
  `;
  bar.classList.remove('hidden');
}

function openPlayerModal(itemId) {
  const item = findMediaOrLiveItem(itemId);
  if (item) openPlayerModalWithItem(item);
}

function openPlayerModalWithItem(item) {
  if (!item) return;

  const proceedPlayback = () => launchPlayerModalWithItem(item);

  if (window.TadhkiraAuth && typeof window.TadhkiraAuth.requirePlaybackAccess === 'function') {
    window.TadhkiraAuth.requirePlaybackAccess(item, proceedPlayback);
    return;
  }

  // Wait briefly if deferred auth bundle is still initializing
  let attempts = 0;
  const waitAuthTimer = setInterval(() => {
    attempts++;
    if (window.TadhkiraAuth && typeof window.TadhkiraAuth.requirePlaybackAccess === 'function') {
      clearInterval(waitAuthTimer);
      window.TadhkiraAuth.requirePlaybackAccess(item, proceedPlayback);
    } else if (attempts >= 50) {
      clearInterval(waitAuthTimer);
      showToast('⚠️ جاري تحميل نظام العضوية، حاول الضغط مجدداً بعد لحظة');
    }
  }, 60);
}

function getLiveChannelSources(item) {
  if (!item || item.category !== 'live') return [];
  const sources = [];
  if (item.streamUrl) {
    sources.push({ key: 'primary', label: '📡 البث المباشر (HLS)', kind: 'hls', url: item.streamUrl });
  }
  if (item.altStreamUrl) {
    sources.push({ key: 'altStream', label: `📺 ${item.altStreamLabel || 'قناة رديفة'}`, kind: 'hls', url: item.altStreamUrl });
  }
  if (item.embedUrl) {
    sources.push({ key: 'primaryEmbed', label: '▶️ البث الرسمي (يوتيوب)', kind: 'embed', url: item.embedUrl });
  }
  if (item.altEmbedUrl) {
    sources.push({ key: 'altEmbed', label: `⚽ ${item.altStreamLabel || 'قناة إضافية'}`, kind: 'embed', url: item.altEmbedUrl });
  }
  if (item.youtubeLiveUrl && item.youtubeLiveUrl !== item.embedUrl) {
    sources.push({ key: 'ytLive', label: '🔴 البث الحي يوتيوب', kind: 'embed', url: item.youtubeLiveUrl });
  }
  if (item.fallbackEmbedUrl && item.fallbackEmbedUrl !== item.embedUrl && item.fallbackEmbedUrl !== item.youtubeLiveUrl) {
    sources.push({ key: 'ytOfficial', label: '🎬 أرشيف القناة الرسمي', kind: 'embed', url: item.fallbackEmbedUrl });
  }
  return sources;
}

function renderLiveSourceSwitcherBar(item, activeKey) {
  const bar = document.getElementById('liveSourceSwitcherBar');
  if (!bar) return;
  if (!item || item.category !== 'live') {
    bar.classList.add('hidden');
    bar.innerHTML = '';
    return;
  }
  const sources = getLiveChannelSources(item);
  const currentKey = activeKey || (sources[0] ? sources[0].key : 'primary');

  const buttonsHtml = sources.map(src => {
    const isActive = src.key === currentKey;
    return `
      <button
        type="button"
        onclick="switchLiveChannelSource('${escapeHtml(src.key)}')"
        class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${isActive ? 'bg-rose-600 text-white shadow-md ring-1 ring-rose-400' : 'bg-dark-800 hover:bg-dark-750 text-slate-200 border border-dark-border hover:border-rose-400/50'}"
      >
        ${escapeHtml(src.label)}
      </button>
    `;
  }).join('');

  bar.innerHTML = `
    <span class="text-xs font-black text-rose-400 ml-1 shrink-0 flex items-center gap-1.5">
      <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
      <span>مصادر البث:</span>
    </span>
    ${buttonsHtml}
    <button
      type="button"
      onclick="reloadActivePlayer()"
      class="mr-auto px-3 py-1.5 rounded-lg text-xs font-bold bg-dark-800 hover:bg-brand hover:text-dark-950 text-slate-200 border border-dark-border transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
      title="إعادة تحميل البث"
    >
      <i id="modalReloadBtnIcon" class="fa-solid fa-rotate-right text-[11px]"></i>
      <span>تحديث البث</span>
    </button>
  `;
  bar.classList.remove('hidden');
}

function switchLiveChannelSource(sourceKey) {
  const item = appState.currentItem;
  if (!item || item.category !== 'live') return;
  const sources = getLiveChannelSources(item);
  const chosen = sources.find(s => s.key === sourceKey) || sources[0];
  if (!chosen) return;

  appState.activeLiveSourceKey = chosen.key;
  renderLiveSourceSwitcherBar(item, chosen.key);

  if (chosen.kind === 'hls') {
    playInternalStream(chosen.url, item);
  } else {
    playDirectEmbed({ ...item, byseUrl: '', embedUrl: chosen.url, streamUrl: '' });
  }
}

function getActiveTelegramCodeForItem(item, sourceKind) {
  if (!item) return '';
  if (sourceKind === 'telegram_720') return item.tgCode || '';
  if (sourceKind === 'telegram_480') return item.tgCode480 || item.tgCode || '';
  return item.tgCode480 || item.tgCode || '';
}

function renderVodSourceSwitcherBar(item, activeKind) {
  const bar = document.getElementById('liveSourceSwitcherBar');
  if (!bar) return;
  if (!item || (!item.tgCode && !item.tgCode480) || item.category === 'live') {
    bar.classList.add('hidden');
    bar.innerHTML = '';
    return;
  }
  const has480 = Boolean(item.tgCode480);
  const has720 = Boolean(item.tgCode);
  const resolvedKind = activeKind || (has480 ? 'telegram_480' : 'telegram_720');
  const activeTgCode = getActiveTelegramCodeForItem(item, resolvedKind);
  const tgAvailable = isTelegramStreamReachable(activeTgCode);
  const cachedOffline = isTelegramMovieCachedOffline(activeTgCode);
  const progress = vodOfflineDownloads.get(activeTgCode);

  let offlineBtnHtml = '';
  if (tgAvailable && 'caches' in window && activeTgCode) {
    if (typeof progress === 'number') {
      offlineBtnHtml = `
        <button type="button" id="vodOfflineSaveBtn" class="mr-auto px-3 py-1.5 rounded-lg text-xs font-black bg-sky-500/20 text-sky-300 border border-sky-400/40 shrink-0 flex items-center gap-1.5 cursor-wait">
          <i class="fa-solid fa-spinner fa-spin text-[11px]"></i>
          <span>جاري الحفظ بدون نت ${progress}%</span>
        </button>
      `;
    } else if (cachedOffline) {
      offlineBtnHtml = `
        <button type="button" id="vodOfflineSaveBtn" onclick="removeTelegramMovieOffline('${escapeHtml(activeTgCode)}')" class="mr-auto px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-500/20 hover:bg-rose-500/20 text-emerald-300 hover:text-rose-300 border border-emerald-400/40 hover:border-rose-400/40 transition-all shrink-0 cursor-pointer flex items-center gap-1.5" title="اضغط لحذف النسخة المحفوظة">
          <i class="fa-solid fa-circle-check text-[11px]"></i>
          <span>محفوظ بدون نت ✓</span>
        </button>
      `;
    } else {
      offlineBtnHtml = `
        <button type="button" id="vodOfflineSaveBtn" onclick="saveTelegramMovieOffline('${escapeHtml(activeTgCode)}')" class="mr-auto px-3 py-1.5 rounded-lg text-xs font-black bg-dark-800 hover:bg-emerald-500 hover:text-dark-950 text-emerald-300 border border-emerald-500/35 transition-all shrink-0 cursor-pointer flex items-center gap-1.5" title="حفظ الفيلم في ذاكرة التطبيق للمشاهدة بدون إنترنت">
          <i class="fa-solid fa-download text-[11px]"></i>
          <span>حفظ بدون نت</span>
        </button>
      `;
    }
  }

  bar.innerHTML = `
    <span class="text-xs font-black text-emerald-400 ml-1 shrink-0 flex items-center gap-1.5">
      <i class="fa-solid fa-bolt"></i>
      <span>الجودة والسيرفر:</span>
    </span>
    ${has480 && isTelegramStreamReachable(item.tgCode480) ? `
      <button
        type="button"
        onclick="switchVodPlaybackServer('telegram_480')"
        class="px-3 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 cursor-pointer ${resolvedKind === 'telegram_480' ? 'bg-emerald-500 text-dark-950 shadow-md ring-1 ring-emerald-300' : 'bg-dark-800 hover:bg-dark-750 text-slate-200 border border-dark-border'}"
      >
        ⚡ 480p خفيفة (بدون تقطيع)
      </button>
    ` : ''}
    ${has720 && isTelegramStreamReachable(item.tgCode) ? `
      <button
        type="button"
        onclick="switchVodPlaybackServer('telegram_720')"
        class="px-3 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 cursor-pointer ${resolvedKind === 'telegram_720' ? 'bg-emerald-500 text-dark-950 shadow-md ring-1 ring-emerald-300' : 'bg-dark-800 hover:bg-dark-750 text-slate-200 border border-dark-border'}"
      >
        ${has480 ? '🎬 720p أصلية (HD)' : '⚡ 720p HD ذكية (بدون تقطيع)'}
      </button>
    ` : ''}
    ${offlineBtnHtml}
  `;
  bar.classList.remove('hidden');
}

function switchVodPlaybackServer(kind) {
  const item = appState.currentItem;
  if (!item) return;
  if (kind === 'telegram_720') {
    appState.preferredVodSource = 'telegram_720';
  } else {
    appState.preferredVodSource = item.tgCode480 ? 'telegram_480' : 'telegram_720';
  }
  renderVodSourceSwitcherBar(item, appState.preferredVodSource);
  const code = getActiveTelegramCodeForItem(item, appState.preferredVodSource);
  if (code) {
    playInternalStream(getTelegramPlaylistUrl(code), item);
  }
}

async function saveTelegramMovieOffline(tgCode) {
  if (!tgCode || !('caches' in window)) {
    showToast('⚠️ متصفحك لا يدعم التخزين بدون نت');
    return;
  }
  if (typeof vodOfflineDownloads.get(tgCode) === 'number') return;

  const playlistUrl = getTelegramPlaylistUrl(tgCode);
  vodOfflineDownloads.set(tgCode, 0);
  if (appState.currentItem && (appState.currentItem.tgCode === tgCode || appState.currentItem.tgCode480 === tgCode)) {
    renderVodSourceSwitcherBar(appState.currentItem, appState.preferredVodSource || 'telegram_480');
  }

  try {
    const cache = await caches.open(OFFLINE_VOD_CACHE_NAME);
    const plResp = await fetch(playlistUrl);
    if (!plResp.ok) throw new Error('تعذر جلب قائمة التشغيل');
    const plText = await plResp.clone().text();
    await cache.put(playlistUrl, plResp);

    const segUrls = [];
    for (const rawLine of plText.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (line && !line.startsWith('#')) {
        segUrls.push(new URL(line, new URL(playlistUrl, window.location.origin)).toString());
      }
    }
    if (!segUrls.length) throw new Error('القائمة فارغة');

    let done = 0;
    const concurrency = 2;
    for (let i = 0; i < segUrls.length; i += concurrency) {
      const batch = segUrls.slice(i, i + concurrency);
      await Promise.all(
        batch.map(async (u) => {
          const existing = await cache.match(u);
          if (!existing) {
            const resp = await fetch(u);
            if (!resp.ok) throw new Error('فشل تنزيل أحد المقاطع');
            await cache.put(u, resp);
          }
          done++;
          const pct = Math.min(99, Math.round((done / segUrls.length) * 100));
          vodOfflineDownloads.set(tgCode, pct);
          const btn = document.getElementById('vodOfflineSaveBtn');
          if (btn) {
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-[11px]"></i><span>جاري الحفظ بدون نت ${pct}%</span>`;
          }
        })
      );
    }

    const meta = getOfflineVodMap();
    meta[tgCode] = {
      complete: true,
      segments: segUrls.length,
      savedAt: Date.now(),
      title: (appState.currentItem && appState.currentItem.title) || tgCode,
    };
    localStorage.setItem(OFFLINE_VOD_META_KEY, JSON.stringify(meta));
    vodOfflineDownloads.delete(tgCode);
    showToast('✅ تم حفظ الفيلم في ذاكرة التطبيق! يفتح الآن بدون نت وبصفر استهلاك');
  } catch (err) {
    vodOfflineDownloads.delete(tgCode);
    showToast(`⚠️ لم يكتمل الحفظ بدون نت: ${(err && err.message) || 'تحقق من الاتصال'}`);
  }

  if (appState.currentItem && (appState.currentItem.tgCode === tgCode || appState.currentItem.tgCode480 === tgCode)) {
    renderVodSourceSwitcherBar(appState.currentItem, appState.preferredVodSource || 'telegram_480');
  }
}

async function removeTelegramMovieOffline(tgCode) {
  if (!tgCode || !('caches' in window)) return;
  try {
    const playlistUrl = getTelegramPlaylistUrl(tgCode);
    const cache = await caches.open(OFFLINE_VOD_CACHE_NAME);
    const cachedPl = await cache.match(playlistUrl);
    if (cachedPl) {
      const txt = await cachedPl.text();
      for (const rawLine of txt.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (line && !line.startsWith('#')) {
          const absUrl = new URL(line, new URL(playlistUrl, window.location.origin)).toString();
          await cache.delete(absUrl);
        }
      }
      await cache.delete(playlistUrl);
    }
    const meta = getOfflineVodMap();
    delete meta[tgCode];
    localStorage.setItem(OFFLINE_VOD_META_KEY, JSON.stringify(meta));
    showToast('🗑️ تم حذف النسخة المحفوظة من ذاكرة الجهاز');
  } catch (_) {}
  if (appState.currentItem && (appState.currentItem.tgCode === tgCode || appState.currentItem.tgCode480 === tgCode)) {
    renderVodSourceSwitcherBar(appState.currentItem, appState.preferredVodSource || 'telegram_480');
  }
}

function launchPlayerModalWithItem(item) {
  if (!item) return;
  appState.currentItem = item;
  const modal = document.getElementById('playerModal');
  const isLive = item.category === 'live' || item.type === 'live';
  const isSeries = !isLive && (item.category === 'series' || item.type === 'series' || !!item.episodeNum);

  if (isSeries) {
    appState.currentSeries = item.seriesData || appState.currentSeries || item;
  }

  document.getElementById('modalTitle').textContent = item.title || 'مشاهدة العرض';
  document.getElementById('modalSubtitle').textContent = isLive
    ? `${item.network || 'قناة رسمية'} • ${item.quality || 'HD'} • بث مباشر رسمي`
    : `${item.year || '2026'} • ${isSeries ? 'مسلسل كامل' : 'فيلم سينمائي'}`;

  const modalLogo = document.getElementById('modalChannelLogo');
  if (modalLogo) {
    if (isLive && item.logo) {
      modalLogo.src = item.logo;
      modalLogo.alt = item.title || '';
      modalLogo.classList.remove('hidden');
    } else {
      modalLogo.src = '';
      modalLogo.classList.add('hidden');
    }
  }

  const badge = document.getElementById('modalCategoryBadge');
  if (badge) {
    if (isLive) {
      badge.textContent = 'مباشر 🔴';
      badge.className = 'px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white shrink-0 animate-pulse';
    } else if (isSeries) {
      badge.textContent = 'مسلسل VIP';
      badge.className = 'px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-dark-950 shrink-0';
    } else {
      badge.textContent = 'فيلم VIP';
      badge.className = 'px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-dark-950 shrink-0';
    }
  }

  if (isSeries && appState.currentSeries) {
    const epNumToHighlight = item.episodeNum !== undefined ? item.episodeNum : (appState.currentSeries.episodes && appState.currentSeries.episodes[0] ? appState.currentSeries.episodes[0].episodeNum : 1);
    renderSeriesEpisodesQuickBar(appState.currentSeries, epNumToHighlight);
  } else {
    const bar = document.getElementById('seriesEpisodesQuickBar');
    if (bar) bar.classList.add('hidden');
  }

  const activeVodKind =
    item.tgCode480 && appState.preferredVodSource !== 'telegram_720' ? 'telegram_480' : 'telegram_720';
  const activeTgCodeForLaunch = (!isLive) ? getActiveTelegramCodeForItem(item, activeVodKind) : '';

  if (isLive) {
    const sources = getLiveChannelSources(item);
    const defaultSource = sources[0] ? sources[0].key : 'primary';
    appState.activeLiveSourceKey = defaultSource;
    renderLiveSourceSwitcherBar(item, defaultSource);
  } else if (item.tgCode || item.tgCode480) {
    renderVodSourceSwitcherBar(item, activeVodKind);
  } else {
    renderLiveSourceSwitcherBar(null);
  }

  updateModalFavoriteButton(item.id);

  // Handle custom dimensions (skip fixed 600x480 when playing widescreen HTML5 Telegram stream)
  const modalContainer = modal.querySelector('.relative.w-full');
  const stage = document.getElementById('videoStageContainer');
  const fullWrapper = document.getElementById('fullPlayerWrapper');
  const iframe = document.getElementById('flynetFullPlayerIframe');
  const tgPlaylistUrl = (!isLive && activeTgCodeForLaunch && isTelegramStreamReachable(activeTgCodeForLaunch))
    ? getTelegramPlaylistUrl(activeTgCodeForLaunch)
    : '';
  const willPlayDirectHls = Boolean(
    tgPlaylistUrl ||
    (isLive && item.streamUrl && (item.streamUrl.includes('.m3u8') || item.streamUrl.includes('.mp4') || item.isDirect || item.isLiveHls))
  );

  if (item.customWidth && item.customHeight && !willPlayDirectHls) {
    if (modalContainer) {
      modalContainer.style.maxWidth = `${item.customWidth}px`;
    }
    if (stage) {
      stage.classList.remove('aspect-video');
      stage.style.width = '100%';
      stage.style.maxWidth = `${item.customWidth}px`;
      stage.style.height = `${item.customHeight}px`;
      stage.style.maxHeight = '80vh';
      stage.style.aspectRatio = `${item.customWidth} / ${item.customHeight}`;
    }
    if (fullWrapper) {
      fullWrapper.style.width = '100%';
      fullWrapper.style.maxWidth = `${item.customWidth}px`;
      fullWrapper.style.height = '100%';
    }
    if (iframe) {
      iframe.setAttribute('width', item.customWidth);
      iframe.setAttribute('height', item.customHeight);
      iframe.setAttribute('scrolling', 'no');
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allowfullscreen', 'true');
    }
  } else {
    if (modalContainer) {
      modalContainer.style.maxWidth = '';
    }
    if (stage) {
      stage.classList.add('aspect-video');
      stage.style.width = '';
      stage.style.maxWidth = '';
      stage.style.height = '';
      stage.style.maxHeight = '';
      stage.style.aspectRatio = '';
    }
    if (fullWrapper) {
      fullWrapper.style.width = '';
      fullWrapper.style.maxWidth = '';
      fullWrapper.style.height = '';
    }
    if (iframe) {
      iframe.removeAttribute('width');
      iframe.removeAttribute('height');
      iframe.setAttribute('scrolling', 'no');
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allowfullscreen', 'true');
    }
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  const waitingWrapper = document.getElementById('playerWaitingWrapper');
  const videoWrapper = document.getElementById('flynetVideoWrapper');
  const serverBar = document.getElementById('playerServerBar');
  // If item is a series or has episodes, pick first episode ready on Telegram
  if (item.episodes && item.episodes.length > 0) {
    const firstActiveEp = item.episodes.find(e => e.tgCode || e.tgCode480) || item.episodes[0];
    if (firstActiveEp) {
      if (!item.tgCode && firstActiveEp.tgCode) item.tgCode = firstActiveEp.tgCode;
      if (!item.tgCode480 && firstActiveEp.tgCode480) item.tgCode480 = firstActiveEp.tgCode480;
      if (!item.code && firstActiveEp.code) item.code = firstActiveEp.code;
      if (item.episodeNum === undefined) item.episodeNum = firstActiveEp.episodeNum || 1;
    }
  }

  const effectiveStreamUrl = isLive ? item.streamUrl : tgPlaylistUrl;
  const hasDirectStream = !!(effectiveStreamUrl && (effectiveStreamUrl.includes('.m3u8') || effectiveStreamUrl.includes('.mp4') || item.isDirect || item.isLiveHls));
  const hasOfficialLiveEmbed = isLive && !!(item.embedUrl || (item.streamUrl && !hasDirectStream));

  if (hasDirectStream) {
    if (waitingWrapper) waitingWrapper.classList.add('hidden');
    playInternalStream(effectiveStreamUrl, item);
  } else if (hasOfficialLiveEmbed) {
    if (waitingWrapper) waitingWrapper.classList.add('hidden');
    const ep = item.episodeNum || 1;
    const season = item.seasonNum || 1;
    playDirectEmbed(item, ep, season);
  } else {
    // Telegram stream not uploaded yet -> show clean Telegram upload waiting state
    hideEmbedPopupNotice(true);
    if (appState.hls) {
      try { appState.hls.destroy(); } catch (e) {}
      appState.hls = null;
    }
    if (iframe) iframe.src = 'about:blank';
    if (videoWrapper) videoWrapper.classList.add('hidden');
    if (fullWrapper) fullWrapper.classList.add('hidden');
    if (serverBar) serverBar.classList.add('hidden');
    const badgeTextElem = document.getElementById('playerBadgeText');
    if (badgeTextElem) badgeTextElem.textContent = '⏳ جاري رفع وتجهيز العمل على سيرفر تيليجرام';

    if (waitingWrapper) {
      waitingWrapper.classList.remove('hidden');
      const titleElem = document.getElementById('waitingItemTitle');
      if (titleElem) {
        titleElem.textContent = `جاري رفع وتجهيز «${item.title || 'هذا العمل'}» على سيرفر تيليجرام المباشر`;
      }
    }
  }
}

const tgClientSegPrefetch = {
  sessionId: 0,
  orderedUrls: [],
  urlToIndex: new Map(),
  entries: new Map(), // url -> { status: 'pending'|'done'|'error', buf?: ArrayBuffer, promise?: Promise<ArrayBuffer|null>, controller?: AbortController, idx: number, sessionId: number }
};

function clearClientSegPrefetch() {
  tgClientSegPrefetch.sessionId += 1;
  tgClientSegPrefetch.orderedUrls = [];
  tgClientSegPrefetch.urlToIndex.clear();
  for (const entry of tgClientSegPrefetch.entries.values()) {
    if (entry && entry.controller) {
      try { entry.controller.abort(); } catch (_) {}
    }
  }
  tgClientSegPrefetch.entries.clear();
}

function isTelegramSegmentUrl(u) {
  return typeof u === 'string' && (u.includes('/api/tg-seg/') || u.includes('/seg/'));
}

function startClientSegPrefetch(segUrl, idx, sessionId) {
  if (!segUrl || !isTelegramSegmentUrl(segUrl) || !navigator.onLine) return;
  if (sessionId !== tgClientSegPrefetch.sessionId) return;
  if (tgClientSegPrefetch.entries.has(segUrl)) return;

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const entry = {
    status: 'pending',
    buf: null,
    promise: null,
    controller,
    idx,
    sessionId,
  };

  entry.promise = fetch(segUrl, {
    signal: controller ? controller.signal : undefined,
    credentials: 'same-origin',
  })
    .then(async (resp) => {
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const ab = await resp.arrayBuffer();
      if (sessionId !== tgClientSegPrefetch.sessionId || !tgClientSegPrefetch.entries.has(segUrl)) {
        return null;
      }
      entry.status = 'done';
      entry.buf = ab;
      return ab;
    })
    .catch(() => {
      if (sessionId === tgClientSegPrefetch.sessionId) {
        entry.status = 'error';
        tgClientSegPrefetch.entries.delete(segUrl);
      }
      return null;
    });

  tgClientSegPrefetch.entries.set(segUrl, entry);
}

function scheduleClientPrefetchAhead(currentUrl, lookAheadCount = 2) {
  if (!currentUrl || !navigator.onLine) return;
  const idx = tgClientSegPrefetch.urlToIndex.get(currentUrl);
  if (idx === undefined) return;
  const sessionId = tgClientSegPrefetch.sessionId;

  // Abort and evict stale entries far behind current playback position
  for (const [cachedUrl, entry] of tgClientSegPrefetch.entries.entries()) {
    if (entry.idx < idx || entry.idx > idx + lookAheadCount + 1) {
      if (entry.controller) {
        try { entry.controller.abort(); } catch (_) {}
      }
      tgClientSegPrefetch.entries.delete(cachedUrl);
    }
  }

  for (let offset = 1; offset <= lookAheadCount; offset++) {
    const nextUrl = tgClientSegPrefetch.orderedUrls[idx + offset];
    if (nextUrl) {
      startClientSegPrefetch(nextUrl, idx + offset, sessionId);
    }
  }
}

function createTgTurboFragmentLoader(BaseLoader) {
  return class TgTurboFragmentLoader extends BaseLoader {
    constructor(config) {
      super(config);
      this._tgAborted = false;
      this._tgUsingSuper = false;
    }

    abort() {
      this._tgAborted = true;
      if (this._tgUsingSuper) {
        super.abort();
      }
    }

    destroy() {
      this._tgAborted = true;
      super.destroy();
    }

    load(context, config, callbacks) {
      const url = context && context.url;
      const isRange = Boolean(context && (context.rangeStart || context.rangeEnd));

      if (url && isTelegramSegmentUrl(url)) {
        scheduleClientPrefetchAhead(url, 2);
      }

      const prefetched = (!isRange && url) ? tgClientSegPrefetch.entries.get(url) : null;
      if (prefetched && (prefetched.status === 'done' || prefetched.status === 'pending')) {
        const loader = this;
        const deliverBuffer = (ab) => {
          if (loader._tgAborted) return;
          if (!ab || !ab.byteLength) {
            tgClientSegPrefetch.entries.delete(url);
            loader._tgUsingSuper = true;
            super.load(context, config, callbacks);
            return;
          }
          tgClientSegPrefetch.entries.delete(url);
          const now = performance.now();
          if (loader.stats) {
            loader.stats.trequest = now;
            loader.stats.tfirst = now;
            loader.stats.tload = now;
            loader.stats.loaded = ab.byteLength;
            loader.stats.total = ab.byteLength;
            loader.stats.loading = { start: now, first: now, end: now };
          }
          callbacks.onSuccess({ url, data: ab }, loader.stats, context, null);
        };

        if (prefetched.status === 'done' && prefetched.buf) {
          Promise.resolve().then(() => deliverBuffer(prefetched.buf));
          return;
        }
        if (prefetched.promise) {
          prefetched.promise.then((ab) => deliverBuffer(ab));
          return;
        }
      }

      this._tgUsingSuper = true;
      super.load(context, config, callbacks);
    }
  };
}

function playInternalStream(url, item) {
  if (!window.TadhkiraAuth || typeof window.TadhkiraAuth.hasActiveAccess !== 'function' || !window.TadhkiraAuth.hasActiveAccess()) {
    closePlayerModal();
    if (window.TadhkiraAuth && typeof window.TadhkiraAuth.requirePlaybackAccess === 'function') {
      window.TadhkiraAuth.requirePlaybackAccess(item, () => launchPlayerModalWithItem(item));
    }
    return;
  }
  hideEmbedPopupNotice(true);
  clearClientSegPrefetch();
  const fullWrapper = document.getElementById('fullPlayerWrapper');
  const videoWrapper = document.getElementById('flynetVideoWrapper');
  const fullIframe = document.getElementById('flynetFullPlayerIframe');
  const video = document.getElementById('flynetPlayer');
  if (fullIframe) fullIframe.src = 'about:blank';
  if (fullWrapper) fullWrapper.classList.add('hidden');
  if (videoWrapper) videoWrapper.classList.remove('hidden');

  if (!video) return;
  initPlyr();

  if (appState.hls) {
    try { appState.hls.destroy(); } catch (e) {}
    appState.hls = null;
  }

  const badgeText = document.getElementById('playerBadgeText');
  if (badgeText && item && (item.tgCode || item.tgCode480)) {
    badgeText.textContent = '⚡ مشغل HTML5 مباشر من تيليجرام • بدون إعلانات';
  }

  const triggerLiveFallback = () => {
    if (item && item.category !== 'live') {
      showToast('⚠️ تعذر الاتصال بسيرفر تيليجرام حالياً، جرب تحديث المشغل أو المحاولة بعد لحظات.');
      return;
    }
    const fallbackUrl = item && (item.fallbackEmbedUrl || item.youtubeLiveUrl || item.embedUrl);
    if (fallbackUrl) {
      showToast('🔄 جاري التحويل تلقائياً إلى البث الرسمي البديل...');
      if (item && item.category === 'live') {
        const fbKey = item.fallbackEmbedUrl ? 'ytOfficial' : 'ytLive';
        appState.activeLiveSourceKey = fbKey;
        renderLiveSourceSwitcherBar(item, fbKey);
      }
      playDirectEmbed({ ...item, byseUrl: '', embedUrl: fallbackUrl, streamUrl: '' });
    } else if (item && item.altStreamUrl && item.altStreamUrl !== url) {
      showToast(`🔄 جاري تجربة البث الاحتياطي (${item.altStreamLabel || 'السيرفر البديل'})...`);
      if (item.category === 'live') {
        appState.activeLiveSourceKey = 'altStream';
        renderLiveSourceSwitcherBar(item, 'altStream');
      }
      playInternalStream(item.altStreamUrl, item);
    } else {
      showToast('⚠️ تعذر تحميل البث حالياً من المصدر، جرب زر تحديث البث أو قناة أخرى.');
    }
  };

  // Persist VOD resume timestamp smoothly for movies/series
  let lastSavedSec = 0;
  video.ontimeupdate = () => {
    if (!item || item.category === 'live' || !item.id) return;
    const nowSec = Math.floor(video.currentTime || 0);
    if (Math.abs(nowSec - lastSavedSec) >= 5) {
      lastSavedSec = nowSec;
      saveVodResumeTime(item.id, nowSec);
    }
  };

  const tryRestoreVodPosition = () => {
    if (!item || item.category === 'live' || !item.id) return;
    const saved = getSavedVodResumeTime(item.id);
    if (saved > 10 && (!video.duration || saved < video.duration - 25)) {
      try {
        video.currentTime = saved;
        const mins = Math.floor(saved / 60);
        const secs = saved % 60;
        showToast(`⏩ استئناف المشاهدة من الدقيقة ${mins}:${String(secs).padStart(2, '0')}`);
      } catch (_) {}
    }
  };

  if (url.includes('.m3u8') && typeof Hls !== 'undefined' && Hls.isSupported()) {
    let networkRetries = 0;
    let mediaRetries = 0;
    const isLiveStream = Boolean(item && item.category === 'live');
    const isTgStream = url.includes('/api/tg-playlist/') || url.includes('/playlist/');
    const BaseLoader = Hls.DefaultConfig && Hls.DefaultConfig.loader;
    const hlsConfig = {
      enableWorker: true,
      progressive: true,
      startFragPrefetch: true,
      lowLatencyMode: isLiveStream,
      maxBufferLength: isLiveStream ? 60 : 240,
      maxMaxBufferLength: isLiveStream ? 120 : 600,
      backBufferLength: 30,
      fragLoadingTimeOut: 45000,
      fragLoadingMaxRetry: 8,
      fragLoadingRetryDelay: 500,
      manifestLoadingTimeOut: 25000,
      highBufferWatchdogPeriod: 1,
      nudgeOffset: 0.25,
      nudgeMaxRetry: 12,
      maxBufferHole: 2.0,
      capLevelToPlayerSize: false
    };
    if (isTgStream && BaseLoader && !isLiveStream) {
      hlsConfig.fLoader = createTgTurboFragmentLoader(BaseLoader);
    }

    const hls = new Hls(hlsConfig);
    hls.loadSource(url);
    hls.attachMedia(video);
    hls.on(Hls.Events.LEVEL_LOADED, (_event, data) => {
      if (!isTgStream || isLiveStream) return;
      const frags = (data && data.details && data.details.fragments) || [];
      if (frags.length > 0) {
        tgClientSegPrefetch.orderedUrls = frags.map(f => f && f.url).filter(Boolean);
        tgClientSegPrefetch.urlToIndex.clear();
        tgClientSegPrefetch.orderedUrls.forEach((u, i) => tgClientSegPrefetch.urlToIndex.set(u, i));
        // Preload segments #1 and #2 in parallel while segment #0 streams progressively
        if (tgClientSegPrefetch.orderedUrls[0]) {
          scheduleClientPrefetchAhead(tgClientSegPrefetch.orderedUrls[0], 2);
        }
      }
    });
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      tryRestoreVodPosition();
      video.play().catch(() => {});
    });
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (!data || !data.fatal) return;
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR && networkRetries < 3) {
        networkRetries++;
        hls.startLoad();
        return;
      }
      if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRetries < 2) {
        mediaRetries++;
        hls.recoverMediaError();
        return;
      }
      clearClientSegPrefetch();
      try { hls.destroy(); } catch (e) {}
      if (appState.hls === hls) appState.hls = null;
      triggerLiveFallback();
    });
    appState.hls = hls;
  } else if (video.canPlayType('application/vnd.apple.mpegurl') || !url.includes('.m3u8')) {
    video.onerror = () => {
      video.onerror = null;
      triggerLiveFallback();
    };
    video.onloadedmetadata = () => {
      video.onloadedmetadata = null;
      tryRestoreVodPosition();
    };
    video.src = url;
    video.play().catch(() => {});
  } else {
    triggerLiveFallback();
  }
}

function isOfficialExternalEmbedUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /youtube\.com|youtube-nocookie\.com|youtu\.be|dailymotion\.com|vimeo\.com|twitch\.tv|player\.castr\.com/i.test(url);
}

function extractMediaCode(url) {
  if (!url || typeof url !== 'string') return null;
  if (isOfficialExternalEmbedUrl(url)) return null;
  const m = url.match(/\/(?:[ed]|embed)\/([a-zA-Z0-9_-]+)/i);
  return m ? m[1] : null;
}

const BYSE_MIRROR_SERVERS = [
  { key: 'byse_ksa', domain: 'bysezejataos.com' },
  { key: 'byse_alt1', domain: 'bysebuho.com' },
  { key: 'byse_alt2', domain: 'bysevepoin.com' },
  { key: 'filemoon', domain: 'filemoon.sx' },
];

let verifiedMirrorKeyInSession = null;

function getActiveByseMirror() {
  const key = verifiedMirrorKeyInSession || appState.activeServer || 'byse_ksa';
  return BYSE_MIRROR_SERVERS.find(s => s.key === key) || BYSE_MIRROR_SERVERS[0];
}

function getByseEmbedUrl(url, serverKey) {
  if (!url || typeof url !== 'string') return '';
  if (isOfficialExternalEmbedUrl(url)) return url;
  const code = extractMediaCode(url);
  if (code) {
    const mirror = (serverKey && BYSE_MIRROR_SERVERS.find(s => s.key === serverKey)) || getActiveByseMirror();
    return `https://${mirror.domain}/e/${code}`;
  }
  return url;
}

async function probeMirrorReachable(domain, code) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), 5000) : null;
  try {
    await fetch(`https://${domain}/e/${code}`, {
      mode: 'no-cors',
      cache: 'no-store',
      signal: ctrl ? ctrl.signal : undefined,
    });
    if (timer) clearTimeout(timer);
    return { reachable: true, timedOut: false };
  } catch (err) {
    if (timer) clearTimeout(timer);
    const aborted = Boolean(err && (err.name === 'AbortError' || (ctrl && ctrl.signal && ctrl.signal.aborted)));
    return { reachable: false, timedOut: aborted };
  }
}

async function ensureReachableByseMirror(code, activeMirrorKey, iframe, targetUrlAtStart) {
  if (!code || !iframe || verifiedMirrorKeyInSession === activeMirrorKey) return;
  const currentMirror = BYSE_MIRROR_SERVERS.find(s => s.key === activeMirrorKey) || BYSE_MIRROR_SERVERS[0];
  const firstCheck = await probeMirrorReachable(currentMirror.domain, code);
  if (firstCheck.reachable) {
    verifiedMirrorKeyInSession = currentMirror.key;
    return;
  }
  // Only switch automatically if network/ISP actively failed (not slow timeout)
  if (firstCheck.timedOut) return;

  for (const candidate of BYSE_MIRROR_SERVERS) {
    if (candidate.key === currentMirror.key) continue;
    const probe = await probeMirrorReachable(candidate.domain, code);
    if (probe.reachable) {
      verifiedMirrorKeyInSession = candidate.key;
      appState.activeServer = candidate.key;
      try {
        localStorage.setItem('tadhkira_preferred_byse_server', candidate.key);
      } catch (_) {}
      const nextUrl = `https://${candidate.domain}/e/${code}`;
      if (iframe && iframe.src === targetUrlAtStart && appState.currentEmbedUrl === targetUrlAtStart) {
        appState.currentEmbedUrl = nextUrl;
        iframe.src = nextUrl;
      }
      return;
    }
  }
}

function refreshActivePlayer() {
  const iframe = document.getElementById('flynetFullPlayerIframe');
  if (iframe && appState.currentEmbedUrl) {
    const current = appState.currentEmbedUrl;
    iframe.src = 'about:blank';
    setTimeout(() => {
      iframe.src = current;
      showToast('🔄 تم تحديث المشغل بنجاح');
    }, 150);
  }
}

function togglePlayerFullscreen() {
  const container = document.getElementById('videoStageContainer') || document.getElementById('flynetFullPlayerIframe');
  if (!container) return;
  if (!document.fullscreenElement) {
    if (container.requestFullscreen) {
      container.requestFullscreen();
    } else if (container.webkitRequestFullscreen) {
      container.webkitRequestFullscreen();
    } else if (container.msRequestFullscreen) {
      container.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

function switchPlayerServer(serverType) {
  const valid = BYSE_MIRROR_SERVERS.some(s => s.key === serverType);
  appState.activeServer = valid ? serverType : 'byse_ksa';
  verifiedMirrorKeyInSession = appState.activeServer;
  try {
    localStorage.setItem('tadhkira_preferred_byse_server', appState.activeServer);
  } catch (_) {}
  if (!appState.currentItem) return;
  playDirectEmbed(appState.currentItem);
}

function playDirectEmbed(item, epNum = 1, seasonNum = 1) {
  if (!window.TadhkiraAuth || typeof window.TadhkiraAuth.hasActiveAccess !== 'function' || !window.TadhkiraAuth.hasActiveAccess()) {
    closePlayerModal();
    if (window.TadhkiraAuth && typeof window.TadhkiraAuth.requirePlaybackAccess === 'function') {
      window.TadhkiraAuth.requirePlaybackAccess(item, () => launchPlayerModalWithItem(item));
    }
    return;
  }
  const fullWrapper = document.getElementById('fullPlayerWrapper');
  const videoWrapper = document.getElementById('flynetVideoWrapper');
  const iframe = document.getElementById('flynetFullPlayerIframe');
  const spinner = document.getElementById('playerLoadingSpinner');
  const badgeText = document.getElementById('playerBadgeText');

  if (videoWrapper) videoWrapper.classList.add('hidden');
  if (fullWrapper) fullWrapper.classList.remove('hidden');

  if (spinner) {
    spinner.style.display = 'none';
    spinner.classList.add('hidden');
  }

  const isLive = Boolean(item && (item.category === 'live' || item.type === 'live'));
  let rawUrl = isLive ? (item.embedUrl || item.streamUrl || '') : '';
  if (rawUrl && !isLive && !isOfficialExternalEmbedUrl(rawUrl)) {
    rawUrl = '';
  }

  if (!rawUrl) {
    if (fullWrapper) fullWrapper.classList.add('hidden');
    const waitingWrapper = document.getElementById('playerWaitingWrapper');
    if (waitingWrapper) {
      waitingWrapper.classList.remove('hidden');
      const titleElem = document.getElementById('waitingItemTitle');
      if (titleElem) {
        titleElem.textContent = `جاري رفع وتجهيز «${(item && item.title) || 'هذا العمل'}» على سيرفر تيليجرام المباشر`;
      }
    }
    return;
  }

  const embedUrl = rawUrl;

  if (badgeText) {
    badgeText.textContent = '🔴 بث مباشر رسمي من المصدر الأصلي';
  }

  appState.currentEmbedUrl = embedUrl;

  if (iframe) {
    // Full native unrestricted playback so official streams load cleanly at maximum speed
    iframe.removeAttribute('sandbox');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('referrerpolicy', isOfficialExternalEmbedUrl(embedUrl) ? 'strict-origin-when-cross-origin' : 'no-referrer');
    iframe.setAttribute('loading', 'eager');
    if (iframe.src !== embedUrl) {
      iframe.src = embedUrl;
    }
  }

  if (fullWrapper) {
    fullWrapper.classList.remove('player-open-glow');
    void fullWrapper.offsetWidth;
    fullWrapper.classList.add('player-open-glow');
  }
  hideEmbedPopupNotice(true);
}

let embedNoticeState = {
  active: false,
  popupReturnCount: 0,
  waitingForPopupReturn: false,
  playAutoHideTimer: null,
  fadeHideTimer: null,
  listenersAttached: false,
};

const DEFAULT_EMBED_NOTICE_HTML =
  'تنبيه: عند الضغط على المشغل قد تفتح <span class="text-amber-300 font-black">نافذتان منبثقتان</span> من المشغل نفسه؛ فقط أغلقهما واضغط مجدداً ليفتح المحتوى طبيعي وبأعلى كفاءة.';

function clearEmbedNoticeTimers() {
  if (embedNoticeState.playAutoHideTimer) {
    clearTimeout(embedNoticeState.playAutoHideTimer);
    embedNoticeState.playAutoHideTimer = null;
  }
  if (embedNoticeState.fadeHideTimer) {
    clearTimeout(embedNoticeState.fadeHideTimer);
    embedNoticeState.fadeHideTimer = null;
  }
}

function resetIframeFocusForNextClick() {
  const iframe = document.getElementById('flynetFullPlayerIframe');
  if (iframe && document.activeElement === iframe) {
    try {
      iframe.blur();
      window.focus();
    } catch (_) {}
  }
}

function attachEmbedNoticeListeners() {
  if (embedNoticeState.listenersAttached) return;
  embedNoticeState.listenersAttached = true;

  const fullWrapper = document.getElementById('fullPlayerWrapper');
  if (fullWrapper) {
    fullWrapper.addEventListener('pointerdown', () => {
      if (!embedNoticeState.active) return;
      if (embedNoticeState.popupReturnCount >= 2) {
        clearEmbedNoticeTimers();
        embedNoticeState.playAutoHideTimer = setTimeout(() => {
          if (embedNoticeState.active && !document.hidden) {
            hideEmbedPopupNotice();
          }
        }, 350);
      }
    }, { passive: true });
  }

  window.addEventListener('blur', () => {
    if (!embedNoticeState.active) return;
    const iframe = document.getElementById('flynetFullPlayerIframe');
    const modal = document.getElementById('playerModal');
    if (!modal || modal.classList.contains('hidden')) return;

    setTimeout(() => {
      if (!embedNoticeState.active) return;
      if (document.activeElement === iframe) {
        embedNoticeState.waitingForPopupReturn = true;
        clearEmbedNoticeTimers();

        // Hide quickly on 3rd interaction after popups, or smoothly after 3.2s if playing uninterrupted
        const delayMs = embedNoticeState.popupReturnCount >= 2 ? 550 : 3200;
        embedNoticeState.playAutoHideTimer = setTimeout(() => {
          if (embedNoticeState.active && !document.hidden) {
            hideEmbedPopupNotice();
          }
        }, delayMs);
      }
    }, 60);
  });

  const handleUserReturnFromPopup = () => {
    if (!embedNoticeState.active || document.hidden) return;
    if (!embedNoticeState.waitingForPopupReturn) return;

    embedNoticeState.waitingForPopupReturn = false;
    clearEmbedNoticeTimers();
    embedNoticeState.popupReturnCount += 1;
    resetIframeFocusForNextClick();

    const textEl = document.getElementById('embedPopupNoticeText');
    if (embedNoticeState.popupReturnCount === 1 && textEl) {
      textEl.innerHTML =
        'تم تجاوز النافذة الأولى <span class="text-amber-300 font-black">(1/2)</span> — أغلِق النافذة الثانية إن ظهرت ثم اضغط تشغيل ليفتح المحتوى.';
    } else if (embedNoticeState.popupReturnCount >= 2 && textEl) {
      textEl.innerHTML =
        '<span class="text-emerald-300 font-black">ممتاز!</span> اضغط الآن على المشغل ليفتح المحتوى مباشرة.';
    }
  };

  window.addEventListener('focus', handleUserReturnFromPopup);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      handleUserReturnFromPopup();
    } else if (embedNoticeState.active) {
      embedNoticeState.waitingForPopupReturn = true;
      clearEmbedNoticeTimers();
    }
  });
}

function showEmbedPopupNotice() {
  const banner = document.getElementById('embedPopupNoticeBanner');
  const textEl = document.getElementById('embedPopupNoticeText');
  if (!banner) return;

  attachEmbedNoticeListeners();
  clearEmbedNoticeTimers();
  resetIframeFocusForNextClick();

  embedNoticeState.active = true;
  embedNoticeState.popupReturnCount = 0;
  embedNoticeState.waitingForPopupReturn = false;

  if (textEl) textEl.innerHTML = DEFAULT_EMBED_NOTICE_HTML;
  banner.classList.remove('hidden', 'notice-collapsing', 'opacity-0', '-translate-y-1', 'pointer-events-none');
  banner.classList.add('opacity-100', 'translate-y-0');
}

function hideEmbedPopupNotice(immediate = false) {
  const banner = document.getElementById('embedPopupNoticeBanner');
  clearEmbedNoticeTimers();
  embedNoticeState.active = false;
  embedNoticeState.waitingForPopupReturn = false;
  embedNoticeState.popupReturnCount = 0;

  if (!banner) return;
  if (immediate) {
    banner.classList.add('hidden');
    banner.classList.remove('notice-collapsing', 'opacity-0', '-translate-y-1', 'pointer-events-none', 'opacity-100', 'translate-y-0');
    return;
  }

  banner.classList.remove('opacity-100', 'translate-y-0');
  banner.classList.add('notice-collapsing');
  embedNoticeState.fadeHideTimer = setTimeout(() => {
    if (!embedNoticeState.active) {
      banner.classList.add('hidden');
      banner.classList.remove('notice-collapsing');
    }
  }, 400);
}

let flynetSeekHudTimer = null;

function getActivePlayerContainer() {
  const video = document.getElementById('flynetPlayer');
  if (!video) return null;
  return (appState.player && appState.player.elements && appState.player.elements.container) || video.closest('.plyr') || document.getElementById('flynetVideoWrapper');
}

function showPlayerSeekHud(seconds) {
  const container = getActivePlayerContainer();
  if (!container) return;

  let hud = container.querySelector('.flynet-seek-hud');
  if (!hud) {
    hud = document.createElement('div');
    hud.className = 'flynet-seek-hud';
    hud.setAttribute('aria-hidden', 'true');
    container.appendChild(hud);
  }

  const isForward = seconds > 0;
  hud.classList.remove('seek-left', 'seek-right', 'is-visible');
  hud.classList.add(isForward ? 'seek-right' : 'seek-left');
  hud.innerHTML = isForward
    ? '<span>+10 ثواني</span><i class="fa-solid fa-forward text-brand"></i>'
    : '<i class="fa-solid fa-backward text-brand"></i><span>-10 ثواني</span>';

  requestAnimationFrame(() => {
    hud.classList.add('is-visible');
  });

  if (flynetSeekHudTimer) clearTimeout(flynetSeekHudTimer);
  flynetSeekHudTimer = setTimeout(() => {
    hud.classList.remove('is-visible');
  }, 650);
}

function seekActivePlayerBy(seconds) {
  const videoWrapper = document.getElementById('flynetVideoWrapper');
  const video = document.getElementById('flynetPlayer');
  if (!video || !videoWrapper || videoWrapper.classList.contains('hidden')) return false;

  let minTime = 0;
  let maxTime = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : Infinity;
  if (!Number.isFinite(video.duration) && video.seekable && video.seekable.length > 0) {
    minTime = video.seekable.start(0);
    maxTime = video.seekable.end(video.seekable.length - 1);
  } else if (!Number.isFinite(video.duration)) {
    maxTime = video.currentTime || 0;
  }

  const nextTime = Math.max(minTime, Math.min(maxTime, (video.currentTime || 0) + seconds));
  try {
    video.currentTime = nextTime;
  } catch (e) {}

  if (appState.currentItem && appState.currentItem.category !== 'live' && appState.currentItem.id) {
    saveVodResumeTime(appState.currentItem.id, Math.floor(nextTime));
  }
  showPlayerSeekHud(seconds);
  return true;
}

function attachSeekButtonEnhancements(container) {
  if (!container || container.dataset.seekEnhanced === '1') return;
  container.dataset.seekEnhanced = '1';

  const rewindBtn = container.querySelector('[data-plyr="rewind"]');
  if (rewindBtn) {
    rewindBtn.setAttribute('title', 'إرجاع 10 ثواني');
    rewindBtn.setAttribute('aria-label', 'إرجاع 10 ثواني');
    rewindBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 5a7 7 0 1 1-6.71 5"/>
        <path d="M9 2.5L5.5 5.2 8.5 8"/>
        <text x="12" y="15.2" text-anchor="middle" fill="currentColor" stroke="none" font-size="6.8" font-weight="800" font-family="Cairo, sans-serif">10</text>
      </svg>
    `;
    rewindBtn.addEventListener('click', () => showPlayerSeekHud(-10));
  }

  const forwardBtn = container.querySelector('[data-plyr="fast-forward"]');
  if (forwardBtn) {
    forwardBtn.setAttribute('title', 'تقديم 10 ثواني');
    forwardBtn.setAttribute('aria-label', 'تقديم 10 ثواني');
    forwardBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 5a7 7 0 1 0 6.71 5"/>
        <path d="M15 2.5L18.5 5.2 15.5 8"/>
        <text x="12" y="15.2" text-anchor="middle" fill="currentColor" stroke="none" font-size="6.8" font-weight="800" font-family="Cairo, sans-serif">10</text>
      </svg>
    `;
    forwardBtn.addEventListener('click', () => showPlayerSeekHud(10));
  }

  const stageArea = container.querySelector('.plyr__video-wrapper') || container;
  let lastTouchTs = 0;
  let lastTouchSide = '';
  stageArea.addEventListener('touchend', (e) => {
    if (!e.changedTouches || e.changedTouches.length !== 1) return;
    if (e.target && e.target.closest && e.target.closest('.plyr__controls, button')) return;
    const rect = stageArea.getBoundingClientRect();
    if (!rect.width) return;
    const relX = (e.changedTouches[0].clientX - rect.left) / rect.width;
    const side = relX <= 0.38 ? 'left' : (relX >= 0.62 ? 'right' : '');
    if (!side) {
      lastTouchTs = 0;
      lastTouchSide = '';
      return;
    }
    const now = Date.now();
    if (lastTouchSide === side && now - lastTouchTs < 300) {
      e.preventDefault();
      lastTouchTs = 0;
      lastTouchSide = '';
      seekActivePlayerBy(side === 'right' ? 10 : -10);
    } else {
      lastTouchTs = now;
      lastTouchSide = side;
    }
  }, { passive: false });
}

function initPlyr() {
  const video = document.getElementById('flynetPlayer');
  if (!video || appState.player) return;
  try {
    if (typeof Plyr !== 'undefined') {
      appState.player = new Plyr(video, {
        seekTime: 10,
        keyboard: { focused: true, global: false },
        controls: ['play-large', 'rewind', 'play', 'fast-forward', 'progress', 'current-time', 'duration', 'mute', 'volume', 'fullscreen'],
        i18n: {
          play: 'تشغيل',
          pause: 'إيقاف مؤقت',
          rewind: 'إرجاع 10 ثواني',
          fastForward: 'تقديم 10 ثواني',
          mute: 'كتم الصوت',
          unmute: 'إلغاء الكتم',
          enterFullscreen: 'ملء الشاشة',
          exitFullscreen: 'خروج من ملء الشاشة'
        }
      });
      const container = (appState.player.elements && appState.player.elements.container) || video.closest('.plyr');
      if (container) {
        attachSeekButtonEnhancements(container);
      }
    }
  } catch (e) {}
}

function reloadActivePlayer() {
  if (!appState.currentItem) return;
  const icon = document.getElementById('modalReloadBtnIcon');
  if (icon) icon.classList.add('fa-spin');
  setTimeout(() => {
    if (icon) icon.classList.remove('fa-spin');
  }, 1000);

  const item = appState.currentItem;
  const offlineStage = document.getElementById('offlinePlayerWrapper');
  if (!navigator.onLine) {
    if (offlineStage) offlineStage.classList.remove('hidden');
    showToast('📴 لا يوجد اتصال بالإنترنت حالياً. يُرجى التحقق من الشبكة.');
    return;
  } else {
    if (offlineStage) offlineStage.classList.add('hidden');
  }

  const isLive = item.category === 'live' || item.type === 'live';
  if (isLive) {
    switchLiveChannelSource(appState.activeLiveSourceKey || 'primary');
    showToast('🔄 تم إعادة تحميل البث المباشر');
    return;
  }
  launchPlayerModalWithItem(item);
}

function closePlayerModal() {
  hideEmbedPopupNotice(true);
  const modal = document.getElementById('playerModal');
  const video = document.getElementById('flynetPlayer');
  const fullIframe = document.getElementById('flynetFullPlayerIframe');
  const offlineStage = document.getElementById('offlinePlayerWrapper');
  const liveBar = document.getElementById('liveSourceSwitcherBar');
  if (liveBar) liveBar.classList.add('hidden');

  const modalContainer = modal ? modal.querySelector('.relative.w-full') : null;
  const stage = document.getElementById('videoStageContainer');
  const fullWrapper = document.getElementById('fullPlayerWrapper');
  if (modalContainer) modalContainer.style.maxWidth = '';
  if (stage) {
    stage.classList.add('aspect-video');
    stage.style.width = '';
    stage.style.maxWidth = '';
    stage.style.height = '';
    stage.style.maxHeight = '';
    stage.style.aspectRatio = '';
  }
  if (fullWrapper) {
    fullWrapper.classList.remove('player-open-glow');
    fullWrapper.style.width = '';
    fullWrapper.style.maxWidth = '';
    fullWrapper.style.height = '';
  }

  if (offlineStage) offlineStage.classList.add('hidden');
  if (fullIframe) {
    fullIframe.src = 'about:blank';
    fullIframe.removeAttribute('width');
    fullIframe.removeAttribute('height');
  }
  if (video) {
    try {
      video.pause();
      video.removeAttribute('src');
      video.load();
    } catch (e) {}
  }
  clearClientSegPrefetch();
  if (appState.hls) {
    try {
      appState.hls.stopLoad();
      appState.hls.destroy();
    } catch (e) {}
    appState.hls = null;
  }
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.style.display = 'none';
  }
  document.body.style.overflow = '';
  appState.currentItem = null;
}

function normalizeSearchText(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove Arabic tashkeel / vowels
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ىئ]/g, 'ي')
    .replace(/[ؤ]/g, 'و')
    .replace(/[ـ]/g, '') // remove tatweel
    .replace(/[-_.:'"!?،؛()[\]]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getOriginSearchKeywords(origin) {
  const map = {
    arabic: 'عربي عربية مصري مصر سعودي خليجي',
    yemeni: 'يمني يمنية صنعاء عدن عربي',
    turkish: 'تركي تركية مدبلج',
    indian: 'هندي هندية بوليوود',
    korean: 'كوري كورية',
    foreign: 'اجنبي اجنبية عالمي انجليزي هوليوود',
    anime: 'انمي كرتون رسوم متحركة اطفال'
  };
  return map[origin] || '';
}

function tokenMatchesText(tok, normalizedText) {
  if (!tok || !normalizedText) return false;
  if (normalizedText.includes(tok)) return true;
  if (tok.startsWith('ال') && tok.length > 3) {
    return normalizedText.includes(tok.slice(2));
  }
  return false;
}

function highlightSearchMatch(text, query) {
  if (!text) return '';
  const str = String(text);
  const words = (query || '').trim().split(/\s+/).filter(w => w.length > 0).slice(0, 5);
  if (words.length === 0) return escapeHtml(str);

  const patterns = words.map(w =>
    w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/[أإآا]/g, '[أإآا]')
      .replace(/[ةه]/g, '[ةه]')
      .replace(/[ىيئ]/g, '[ىيئ]')
  );
  try {
    const regex = new RegExp(`(${patterns.join('|')})`, 'gi');
    const parts = str.split(regex);
    return parts.map((part, idx) =>
      idx % 2 === 1
        ? `<span class="search-highlight">${escapeHtml(part)}</span>`
        : escapeHtml(part)
    ).join('');
  } catch (e) {
    return escapeHtml(str);
  }
}

function closePredictiveDropdown() {
  const dropdown = document.getElementById('predictiveDropdown');
  if (dropdown) dropdown.classList.add('hidden');
  appState.selectedPredictiveIndex = -1;
}

function setPredictiveSelectedIndex(idx) {
  appState.selectedPredictiveIndex = idx;
  const items = document.querySelectorAll('.predictive-item-row');
  items.forEach((el, i) => {
    if (i === idx) {
      el.classList.add('predictive-item-selected');
    } else {
      el.classList.remove('predictive-item-selected');
    }
  });
}

function selectPredictiveItem(itemId) {
  closePredictiveDropdown();
  handleCardClick(itemId);
}

function switchSearchFilterType(filterType) {
  appState.activeSearchFilter = filterType || 'all';
  ['all', 'movie', 'series', 'anime'].forEach(t => {
    const btn = document.getElementById(`searchType-${t}`);
    if (!btn) return;
    if (t === appState.activeSearchFilter) {
      btn.className = 'px-2.5 py-1 rounded-lg font-bold bg-brand text-dark-950 transition-all text-[11px] cursor-pointer';
    } else {
      btn.className = 'px-2.5 py-1 rounded-lg font-semibold text-slate-300 hover:text-white transition-all text-[11px] cursor-pointer';
    }
  });
  renderFullSearchResults();
}

function renderFullSearchResults() {
  const rawQuery = (appState.searchQuery || '').trim();
  const allResults = appState.lastSearchResults || [];
  const titleEl = document.getElementById('searchResultsTitle');
  const grid = document.getElementById('searchResultsGrid');
  if (!grid) return;

  const filterType = appState.activeSearchFilter || 'all';
  let filtered = allResults;
  if (filterType === 'movie') {
    filtered = allResults.filter(i => !isSeriesItem(i) && !isAnimeItem(i));
  } else if (filterType === 'series') {
    filtered = allResults.filter(i => isSeriesItem(i));
  } else if (filterType === 'anime') {
    filtered = allResults.filter(i => isAnimeItem(i));
  }

  const movieResults = filtered.filter(i => !isSeriesItem(i) && i.category !== 'live');
  const seriesResults = filtered.filter(i => isSeriesItem(i));
  const liveResults = filtered.filter(i => i.category === 'live');

  if (titleEl) {
    titleEl.innerHTML = `
      <span>نتائج البحث عن "${escapeHtml(rawQuery)}"</span>
      <span class="text-xs px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 font-bold">${filtered.length} نتيجة</span>
    `;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="py-14 px-4 rounded-2xl bg-dark-900/60 border border-dark-border/80 text-center space-y-2 text-slate-400">
        <i class="fa-solid fa-magnifying-glass text-2xl text-slate-500"></i>
        <p class="text-sm font-bold text-white">لم نتمكن من العثور على نتائج تطابق "${escapeHtml(rawQuery)}" في هذا التصنيف</p>
        <p class="text-xs text-slate-400">جرب اختيار "الكل" أو البحث باسم الفيلم أو القناة بالعربي أو الإنجليزي</p>
      </div>
    `;
    return;
  }

  if (filterType === 'all' && (liveResults.length > 0 || (movieResults.length > 0 && seriesResults.length > 0))) {
    grid.innerHTML = `
      ${liveResults.length > 0 ? `
      <div class="space-y-3">
        <h4 class="text-sm font-black text-rose-400 flex items-center gap-2">
          <span>🔴 القنوات المباشرة المطابقة</span>
          <span class="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">${liveResults.length}</span>
        </h4>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
          ${liveResults.map(createLiveChannelCardHtml).join('')}
        </div>
      </div>
      ` : ''}
      ${movieResults.length > 0 ? `
      <div class="space-y-3 ${liveResults.length > 0 ? 'pt-4 border-t border-dark-border/50' : ''}">
        <h4 class="text-sm font-black text-brand flex items-center gap-2">
          <span>🎬 الأفلام المطابقة</span>
          <span class="text-[11px] px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">${movieResults.length}</span>
        </h4>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
          ${movieResults.map(createMediaCardHtml).join('')}
        </div>
      </div>
      ` : ''}
      ${seriesResults.length > 0 ? `
      <div class="space-y-3 pt-4 border-t border-dark-border/50">
        <h4 class="text-sm font-black text-amber-400 flex items-center gap-2">
          <span>📺 المسلسلات المطابقة</span>
          <span class="text-[11px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">${seriesResults.length}</span>
        </h4>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
          ${seriesResults.map(createMediaCardHtml).join('')}
        </div>
      </div>
      ` : ''}
    `;
  } else {
    grid.innerHTML = `
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
        ${filtered.map(i => i.category === 'live' ? createLiveChannelCardHtml(i) : createMediaCardHtml(i)).join('')}
      </div>
    `;
  }
  observeLazyMedia(grid);
}

function submitFullSearch() {
  closePredictiveDropdown();
  const input = document.getElementById('searchInput');
  const q = input ? input.value.trim() : (appState.searchQuery || '').trim();
  if (!q) return;

  appState.isFullSearchActive = true;
  if (!appState.lastSearchResults || appState.searchQuery !== q) {
    handleSearch(q);
    closePredictiveDropdown();
  }

  const searchSec = document.getElementById('searchSection');
  const hero = document.getElementById('heroSection');
  const actors = document.getElementById('actorsSection');
  const dynamicContainer = document.getElementById('dynamicSectionsContainer');
  if (hero) hero.classList.add('hidden');
  if (actors) actors.classList.add('hidden');
  if (dynamicContainer) dynamicContainer.classList.add('hidden');

  if (searchSec) {
    searchSec.classList.remove('hidden');
    renderFullSearchResults();
    searchSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function handleSearchFocus() {
  const input = document.getElementById('searchInput');
  if (input && input.value.trim().length > 0) {
    handleSearch(input.value);
  }
}

function handleSearchKeyDown(event) {
  const dropdown = document.getElementById('predictiveDropdown');
  const isDropdownVisible = dropdown && !dropdown.classList.contains('hidden');

  if (event.key === 'ArrowDown') {
    if (!isDropdownVisible || !appState.predictiveResults || appState.predictiveResults.length === 0) return;
    event.preventDefault();
    let nextIdx = appState.selectedPredictiveIndex + 1;
    if (nextIdx >= appState.predictiveResults.length) nextIdx = 0;
    setPredictiveSelectedIndex(nextIdx);
    const selectedEl = document.querySelector(`.predictive-item-row[data-index="${nextIdx}"]`);
    if (selectedEl) selectedEl.scrollIntoView({ block: 'nearest' });
  } else if (event.key === 'ArrowUp') {
    if (!isDropdownVisible || !appState.predictiveResults || appState.predictiveResults.length === 0) return;
    event.preventDefault();
    let prevIdx = appState.selectedPredictiveIndex - 1;
    if (prevIdx < 0) prevIdx = appState.predictiveResults.length - 1;
    setPredictiveSelectedIndex(prevIdx);
    const selectedEl = document.querySelector(`.predictive-item-row[data-index="${prevIdx}"]`);
    if (selectedEl) selectedEl.scrollIntoView({ block: 'nearest' });
  } else if (event.key === 'Enter') {
    event.preventDefault();
    if (isDropdownVisible && appState.selectedPredictiveIndex >= 0 && appState.predictiveResults[appState.selectedPredictiveIndex]) {
      const selectedItem = appState.predictiveResults[appState.selectedPredictiveIndex];
      selectPredictiveItem(selectedItem.id);
    } else {
      submitFullSearch();
    }
  } else if (event.key === 'Escape') {
    closePredictiveDropdown();
    const input = document.getElementById('searchInput');
    if (input) input.blur();
  }
}

function handleSearch(query) {
  const rawQuery = (query || '').trim();
  appState.searchQuery = rawQuery;
  const searchSec = document.getElementById('searchSection');
  const clearBtn = document.getElementById('clearSearchBtn');
  const dropdown = document.getElementById('predictiveDropdown');
  const itemsList = document.getElementById('predictiveItemsList');
  const countEl = document.getElementById('predictiveResultsCount');

  if (!rawQuery) {
    appState.lastSearchResults = [];
    appState.isFullSearchActive = false;
    appState.activeSearchFilter = 'all';
    if (searchSec) searchSec.classList.add('hidden');
    if (clearBtn) clearBtn.classList.add('hidden');
    const dynamicContainer = document.getElementById('dynamicSectionsContainer');
    if (dynamicContainer) dynamicContainer.classList.remove('hidden');
    if (appState.activeNavTab === 'all') {
      const hero = document.getElementById('heroSection');
      const actors = document.getElementById('actorsSection');
      if (hero) hero.classList.remove('hidden');
      if (actors) actors.classList.remove('hidden');
    }
    closePredictiveDropdown();
    return;
  }

  if (clearBtn) clearBtn.classList.remove('hidden');

  const normalizedQuery = normalizeSearchText(rawQuery);
  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  const qLower = rawQuery.toLowerCase();

  const scoredItems = [];
  const searchablePool = [...(appState.liveChannels || []), ...(appState.allMedia || [])];
  searchablePool.forEach(item => {
    const rawTitle = item.title || '';
    const normTitle = normalizeSearchText(rawTitle);
    const normOrigTitle = normalizeSearchText(item.originalTitle || '');
    const normTitleCombined = `${normTitle} ${normOrigTitle} ${normalizeSearchText(item.network || '')} ${normalizeSearchText(item.shortCode || '')}`.trim();
    const normActors = normalizeSearchText(Array.isArray(item.actors) ? item.actors.join(' ') : (item.actors || ''));
    const normGenre = normalizeSearchText(`${getGenreString(item.genre)} ${item.subGenre || ''}`);
    const isLive = item.category === 'live';
    const normTypeOrigin = normalizeSearchText(`${isLive ? 'مباشر بث قنوات تلفزيون live tv رياضه دوري اوروبا' : (isSeriesItem(item) ? 'مسلسل series حلقات' : 'فيلم movie افلام')} ${getOriginSearchKeywords(item.origin)} ${isAnimeItem(item) ? 'انمي كرتون رسوم متحركة anime' : ''}`);
    const yearStr = String(item.year || '');
    const normOverview = normalizeSearchText(item.overview || '');

    const allSearchable = `${normTitleCombined} ${normActors} ${normGenre} ${normTypeOrigin} ${yearStr} ${normOverview}`;
    if (queryTokens.length === 0 || !queryTokens.every(tok => tokenMatchesText(tok, allSearchable))) {
      return;
    }

    let score = 0;
    if (normTitle.startsWith(normalizedQuery) || normOrigTitle.startsWith(normalizedQuery)) {
      score += 150;
    } else if (normTitleCombined.includes(normalizedQuery) || rawTitle.toLowerCase().includes(qLower)) {
      score += 110;
    } else if (queryTokens.every(tok => tokenMatchesText(tok, normTitleCombined))) {
      score += 90;
    }

    if (queryTokens.some(tok => tokenMatchesText(tok, normActors))) {
      score += 55;
    }
    if (queryTokens.some(tok => tokenMatchesText(tok, `${normGenre} ${normTypeOrigin} ${yearStr}`))) {
      score += 35;
    }
    if (queryTokens.some(tok => tokenMatchesText(tok, normOverview))) {
      score += 20;
    }
    if (score === 0) score = 15;

    scoredItems.push({ item, score });
  });

  scoredItems.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const rA = parseFloat(a.item.rating || 0);
    const rB = parseFloat(b.item.rating || 0);
    return rB - rA;
  });

  const allResults = scoredItems.map(s => s.item);
  appState.lastSearchResults = allResults;
  appState.predictiveResults = allResults.slice(0, 8);
  appState.selectedPredictiveIndex = -1;

  // Render Predictive Dropdown
  if (dropdown && itemsList) {
    const mCount = allResults.filter(i => !isSeriesItem(i) && i.category !== 'live').length;
    const sCount = allResults.filter(i => isSeriesItem(i)).length;
    const lCount = allResults.filter(i => i.category === 'live').length;
    if (countEl) {
      countEl.textContent = allResults.length > 0
        ? `${allResults.length} نتيجة (${mCount} فيلم • ${sCount} مسلسل${lCount > 0 ? ` • ${lCount} قناة` : ''})`
        : '0 نتائج';
    }

    if (allResults.length === 0) {
      itemsList.innerHTML = `
        <div class="py-8 px-4 text-center text-slate-400 flex flex-col items-center gap-2">
          <div class="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center text-slate-500">
            <i class="fa-solid fa-film text-sm"></i>
          </div>
          <p class="text-xs font-semibold text-slate-300">لم يتم العثور على أي نتائج تطابق "${escapeHtml(rawQuery)}"</p>
          <p class="text-[10px] text-slate-400">تأكد من كتابة اسم الفيلم أو المسلسل أو القناة بالعربي أو الإنجليزي</p>
        </div>
      `;
    } else {
      itemsList.innerHTML = appState.predictiveResults.map((item, idx) => {
        const isLive = item.category === 'live';
        const isSeries = !isLive && isSeriesItem(item);
        const typeBadgeText = isLive ? 'مباشر 🔴' : (isSeries ? 'مسلسل' : 'فيلم');
        const typeBadgeColor = isLive ? 'bg-rose-600 text-white' : (isSeries ? 'bg-amber-400 text-dark-950' : 'bg-brand text-dark-950');

        let originBadgeSmall = '';
        if (isAnimeItem(item)) {
          originBadgeSmall = '<span class="px-1.5 py-0.2 rounded text-[8.5px] font-black bg-pink-600 text-white shadow-xs">🎨 أنمي</span>';
        } else if (item.origin === 'yemeni') {
          originBadgeSmall = '<span class="px-1.5 py-0.2 rounded text-[8.5px] font-black bg-amber-600 text-white shadow-xs">🇾🇪 يمني</span>';
        } else if (item.origin === 'turkish') {
          originBadgeSmall = '<span class="px-1.5 py-0.2 rounded text-[8.5px] font-black bg-rose-600 text-white shadow-xs">🇹🇷 تركي</span>';
        } else if (item.origin === 'indian') {
          originBadgeSmall = '<span class="px-1.5 py-0.2 rounded text-[8.5px] font-black bg-amber-500 text-dark-950 shadow-xs">🇮🇳 هندي</span>';
        } else if (item.origin === 'korean') {
          originBadgeSmall = '<span class="px-1.5 py-0.2 rounded text-[8.5px] font-black bg-indigo-600 text-white shadow-xs">🇰🇷 كوري</span>';
        } else if (item.origin === 'foreign') {
          originBadgeSmall = '<span class="px-1.5 py-0.2 rounded text-[8.5px] font-black bg-sky-600 text-white shadow-xs">🎬 أجنبي</span>';
        } else {
          originBadgeSmall = '<span class="px-1.5 py-0.2 rounded text-[8.5px] font-black bg-emerald-600 text-white shadow-xs">🍿 عربي</span>';
        }

        const posterFallbackType = isLive ? 'live' : (isSeries ? 'series' : 'movie');
        const posterUrl = getOptimizedPosterUrl(item);

        return `
          <div
            data-index="${idx}"
            data-id="${escapeHtml(item.id)}"
            onclick="selectPredictiveItem('${escapeHtml(item.id)}')"
            onmouseenter="setPredictiveSelectedIndex(${idx})"
            class="predictive-item-row predictive-item-hover group flex items-center justify-between gap-3 p-2 rounded-xl transition-all cursor-pointer border border-transparent"
          >
            <div class="flex items-center gap-2.5 overflow-hidden">
              <div class="relative w-11 sm:w-12 h-16 sm:h-17 rounded-lg overflow-hidden shrink-0 border border-dark-border/80 bg-dark-950 shadow-md">
                <img
                  src="${posterUrl}"
                  alt="${escapeHtml(item.title)}"
                  data-id="${escapeHtml(item.id)}"
                  data-title="${escapeHtml(item.title)}"
                  class="w-full h-full ${isLive ? 'object-contain p-1.5 bg-slate-900' : 'object-cover'} group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  decoding="async"
                  onerror="handlePosterError(this, '${posterFallbackType}')"
                />
                <span class="absolute bottom-0 inset-x-0 bg-dark-950/90 text-[7.5px] font-black text-center py-0.5 text-amber-300 border-t border-amber-400/20 leading-none">
                  ${item.quality || '1080p'}
                </span>
              </div>

              <div class="flex flex-col min-w-0 text-right">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="px-1.5 py-0.2 rounded text-[8.5px] font-black ${typeBadgeColor}">
                    ${typeBadgeText}
                  </span>
                  ${originBadgeSmall}
                  <span class="text-[10px] font-semibold text-slate-400">
                    ${item.year || '2026'}
                  </span>
                </div>
                
                <h4 class="text-xs font-bold text-white group-hover:text-brand transition-colors truncate mt-1">
                  ${highlightSearchMatch(item.title, rawQuery)}
                </h4>

                <div class="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                  <span class="flex items-center gap-0.5 text-amber-400 font-bold">
                    <i class="fa-solid fa-star text-[9px]"></i>
                    <span>${item.rating || '7.5'}</span>
                  </span>
                  <span>•</span>
                  <span class="truncate max-w-[140px] sm:max-w-[200px]">
                    ${escapeHtml(getFirstGenre(item.genre, 'سينما VIP'))}
                  </span>
                </div>
              </div>
            </div>

            <div class="shrink-0 pl-1">
              <div class="w-8 h-8 rounded-full bg-dark-800 group-hover:bg-brand border border-dark-border group-hover:border-brand text-slate-300 group-hover:text-dark-950 flex items-center justify-center transition-all shadow-sm">
                <i class="fa-solid fa-play text-xs ml-0.5"></i>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    dropdown.classList.remove('hidden');
  }

  // If the full search section is already open, live-update its organized results too
  if (appState.isFullSearchActive) {
    renderFullSearchResults();
  }
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  if (input) input.value = '';
  appState.isFullSearchActive = false;
  appState.activeSearchFilter = 'all';
  ['all', 'movie', 'series', 'anime'].forEach(t => {
    const btn = document.getElementById(`searchType-${t}`);
    if (!btn) return;
    btn.className = t === 'all'
      ? 'px-2.5 py-1 rounded-lg font-bold bg-brand text-dark-950 transition-all text-[11px] cursor-pointer'
      : 'px-2.5 py-1 rounded-lg font-semibold text-slate-300 hover:text-white transition-all text-[11px] cursor-pointer';
  });
  closePredictiveDropdown();
  handleSearch('');
}

function destroySwipers() {
  appState.swiperInstances.forEach(s => {
    try { if (s && s.destroy) s.destroy(true, true); } catch (e) {}
  });
  appState.swiperInstances = [];
}

// Local Storage Offline Caching (Works completely offline & instant loading)
const CATALOG_STORAGE_KEY = 'tadhkira_catalog_offline_v119_20261121';
function saveCatalogToCache(data) {
  try {
    if (Array.isArray(data) && data.length > 0) {
      localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(data));
    }
  } catch (e) {}
}

function getCachedCatalog() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('tadhkira_catalog_offline_') && k !== CATALOG_STORAGE_KEY) {
        localStorage.removeItem(k);
      }
    }

    const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return null;
}

// Register Service Worker for Silent Background Offline Caching (Top window only; keep iframe clean)
if ('serviceWorker' in navigator) {
  if (window.self === window.top) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js?v=20261121_v119', { scope: '/' })
        .then(reg => {
          console.log('[PWA] Service Worker active:', reg.scope);
          if (typeof reg.update === 'function') {
            reg.update().catch(() => {});
          }
        })
        .catch(err => {
          console.warn('[PWA] Service Worker notice:', err);
        });
    });
  } else if (navigator.serviceWorker.getRegistrations) {
    navigator.serviceWorker.getRegistrations()
      .then(regs => Promise.all(regs.map(r => r.unregister())))
      .catch(() => {});
  }
}

function applyCatalogData(list) {
  const seen = new Set();
  const initial = [];
  const combined = [
    ...(window.CURATED_CATALOG || []),
    ...(window.TADHKIRA_MEDIA || []),
    ...INITIAL_MOVIES,
    ...(Array.isArray(list) ? list : [])
  ];
  combined.forEach(item => {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      initial.push(item);
    }
  });
  initial.sort((a, b) => {
    const ua = a.uploadedAt || '';
    const ub = b.uploadedAt || '';
    if (ub !== ua) return ub.localeCompare(ua);
    return 0;
  });
  appState.allMedia = initial;
  appState.liveChannels = (window.LIVE_CHANNELS && Array.isArray(window.LIVE_CHANNELS))
    ? window.LIVE_CHANNELS
    : SEED_LIVE_CHANNELS;

  // Persist to local storage for instant offline loading on next visit
  saveCatalogToCache(appState.allMedia);

  const stats = document.getElementById('catalogStatsText');
  if (stats) stats.textContent = `أكثر من ${appState.allMedia.length} فيلم ومسلسل VIP`;

  renderTop10Hero();
  renderActorsBar();
  renderCatalog();
}

// DOM Ready Initialization
document.addEventListener('DOMContentLoaded', () => {
  initLazyObservers();
  observeLazyMedia(document);
  initPlyr();
  updateFavoritesBadge();

  // Offline First: Try localStorage cache first, then curated window object, then seed movies
  const cachedList = getCachedCatalog();
  if (cachedList) {
    applyCatalogData(cachedList);
  } else if (window.CURATED_CATALOG && Array.isArray(window.CURATED_CATALOG) && window.CURATED_CATALOG.length > 0) {
    applyCatalogData(window.CURATED_CATALOG);
  } else if (window.TADHKIRA_MEDIA && Array.isArray(window.TADHKIRA_MEDIA) && window.TADHKIRA_MEDIA.length > 0) {
    applyCatalogData(window.TADHKIRA_MEDIA);
  } else {
    applyCatalogData(INITIAL_MOVIES);
  }

  // If online, fetch background catalog update silently during browser idle time
  if (navigator.onLine) {
    const scheduleIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 3000));
    scheduleIdle(() => {
      fetch('/catalog.json?v=20261121_v119')
        .then(res => {
          if (!res.ok) return null;
          const ct = res.headers.get('content-type') || '';
          if (!ct.includes('application/json')) return null;
          return res.json().catch(() => null);
        })
        .then(data => {
          if (data && Array.isArray(data) && data.length > 0) {
            applyCatalogData(data);
          }
        })
        .catch(() => {});
    });
  }

  // Support deep link ?q=... searches (e.g. from Schema.org SearchAction or shared URLs)
  try {
    const params = new URLSearchParams(window.location.search);
    const urlQuery = (params.get('q') || '').trim();
    if (urlQuery) {
      const inp = document.getElementById('searchInput');
      if (inp) inp.value = urlQuery;
      submitFullSearch();
    }
  } catch (e) {}
});

function openAppSidebar() {
  const overlay = document.getElementById('appSidebarOverlay');
  const sidebar = document.getElementById('appSidebar');
  if (overlay) {
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100', 'pointer-events-auto');
  }
  if (sidebar) {
    sidebar.classList.remove('translate-x-full');
    sidebar.classList.add('translate-x-0');
  }
  document.body.style.overflow = 'hidden';
}

function closeAppSidebar() {
  const overlay = document.getElementById('appSidebarOverlay');
  const sidebar = document.getElementById('appSidebar');
  if (overlay) {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.classList.remove('opacity-100', 'pointer-events-auto');
  }
  if (sidebar) {
    sidebar.classList.add('translate-x-full');
    sidebar.classList.remove('translate-x-0');
  }
  const playerModal = document.getElementById('playerModal');
  if (!playerModal || playerModal.classList.contains('hidden')) {
    document.body.style.overflow = '';
  }
}

function toggleCopyrightInfo() {
  const content = document.getElementById('copyrightContent');
  const chevron = document.getElementById('copyrightChevron');
  if (!content) return;
  const isHidden = content.classList.contains('hidden');
  if (isHidden) {
    content.classList.remove('hidden');
    if (chevron) chevron.style.transform = 'rotate(180deg)';
  } else {
    content.classList.add('hidden');
    if (chevron) chevron.style.transform = 'rotate(0deg)';
  }
}

function copyPhoneNumber(phone) {
  const text = phone || '+967779676636';
  const onSuccess = () => {
    const btn = document.getElementById('copyPhoneBtn');
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-check text-emerald-400"></i> <span>تم النسخ!</span>';
      setTimeout(() => {
        btn.innerHTML = '<i class="fa-regular fa-copy"></i> <span>نسخ</span>';
      }, 2000);
    }
    showToast('📋 تم نسخ رقم المطور: <span class="text-amber-400 font-mono">' + escapeHtml(text) + '</span>');
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
      onSuccess();
    });
  } else {
    onSuccess();
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closePlayerModal();
    closeAppSidebar();
    if (window.TadhkiraAuth) {
      window.TadhkiraAuth.closeAuthGateModal?.();
      window.TadhkiraAuth.closeSubscriptionModal?.();
      window.TadhkiraAuth.closeAdminPanelModal?.();
    }
    return;
  }

  const tag = e.target && e.target.tagName ? e.target.tagName.toUpperCase() : '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable)) {
    return;
  }

  const modal = document.getElementById('playerModal');
  const videoWrapper = document.getElementById('flynetVideoWrapper');
  if (!modal || modal.classList.contains('hidden') || !videoWrapper || videoWrapper.classList.contains('hidden')) {
    return;
  }

  if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') {
    if (seekActivePlayerBy(10)) e.preventDefault();
  } else if (e.key === 'ArrowLeft' || e.key === 'j' || e.key === 'J') {
    if (seekActivePlayerBy(-10)) e.preventDefault();
  }
});

// Dismiss predictive search dropdown on click outside
document.addEventListener('click', (e) => {
  const searchContainer = document.getElementById('searchContainer');
  if (searchContainer && !searchContainer.contains(e.target)) {
    closePredictiveDropdown();
  }
});

function buildAdRequestMessageText() {
  const name = (document.getElementById('adClientName')?.value || '').trim();
  const type = (document.getElementById('adPlacementType')?.value || 'بنر إعلاني في الواجهة الرئيسية').trim();
  const duration = (document.getElementById('adDurationChoice')?.value || 'شهر واحد').trim();
  const details = (document.getElementById('adDetailsText')?.value || '').trim();

  const lines = [
    'السلام عليكم، أرغب في عمل إعلان عبر قسم (إعلانات وعروضات) في منصة تذكرة دخول VIP:',
    name ? `• الاسم / النشاط التجاري: ${name}` : null,
    `• نوع الإعلان المطلوب: ${type}`,
    `• المدة المقترحة: ${duration}`,
    details ? `• تفاصيل الإعلان / العرض: ${details}` : null,
  ].filter(Boolean);

  return lines.join('\n');
}

function syncAdRequestLinks() {
  const waLink = document.getElementById('adsWhatsappDirectLink');
  if (!waLink) return;
  const msg = buildAdRequestMessageText();
  waLink.setAttribute('href', `https://wa.me/967779676636?text=${encodeURIComponent(msg)}`);
}

function copyAdRequestAndNotify() {
  const msg = buildAdRequestMessageText();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(msg).catch(() => {});
  }
  showToast('📋 تم نسخ تفاصيل طلب الإعلان! الصقها في رسالة إنستقرام لحساب @ticket.vib');
}

function renderAdsAndOffersSection() {
  const container = document.getElementById('dynamicSectionsContainer');
  if (!container) return;

  const initialMsg = encodeURIComponent(
    'السلام عليكم، أرغب في عمل إعلان عبر قسم (إعلانات وعروضات) في منصة تذكرة دخول VIP:\n• نوع الإعلان المطلوب: بنر إعلاني في الواجهة الرئيسية\n• المدة المقترحة: شهر واحد'
  );

  container.innerHTML = `
    <section class="w-full space-y-6">
      <!-- Top Header Banner -->
      <div class="rounded-3xl bg-gradient-to-br from-amber-500/20 via-dark-900 to-brand/15 border border-amber-400/50 p-5 sm:p-7 shadow-2xl">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-2">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black">
              <i class="fa-solid fa-bullhorn"></i>
              <span>قسم إعلانات وعروضات</span>
            </div>
            <h2 class="text-xl sm:text-2xl font-black text-white leading-tight">
              أعلن لمتجرك أو مشروعك أمام آلاف الزوار يومياً في تذكرة دخول VIP
            </h2>
            <p class="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              نوفر لك مساحات إعلانية وعروض ترويجية مميزة داخل المنصة بأعلى نسبة مشاهدة وتفاعل. قدّم طلب إعلانك الآن وتواصل مباشرة مع إدارة الموقع عبر رقم الهاتف/واتساب أو حساب الإنستقرام الرسمي.
            </p>
          </div>
          <button onclick="switchNavTab('all')" class="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-200 border border-dark-border text-xs font-bold flex items-center justify-center gap-2 shrink-0 cursor-pointer self-start md:self-center">
            <i class="fa-solid fa-arrow-right"></i>
            <span>العودة للأفلام والمسلسلات</span>
          </button>
        </div>
      </div>

      <!-- Ad Formats & Offers Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div class="p-4 rounded-2xl bg-dark-900/90 border border-amber-400/35 space-y-2 shadow-lg">
          <div class="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center text-lg">
            <i class="fa-solid fa-panorama"></i>
          </div>
          <h3 class="text-sm font-black text-white">بنر الواجهة الرئيسية</h3>
          <p class="text-xs text-slate-400 leading-relaxed">ظهور بارز في أعلى الصفحة لجميع زوار المنصة على الجوال والكمبيوتر.</p>
        </div>

        <div class="p-4 rounded-2xl bg-dark-900/90 border border-brand/35 space-y-2 shadow-lg">
          <div class="w-10 h-10 rounded-xl bg-brand/20 text-brand flex items-center justify-center text-lg">
            <i class="fa-solid fa-tags"></i>
          </div>
          <h3 class="text-sm font-black text-white">عروض تجارية وخصومات</h3>
          <p class="text-xs text-slate-400 leading-relaxed">عرض منتجاتك، متاجرك، أو خدماتك مع رابط مباشر لمتجرك أو واتسابك.</p>
        </div>

        <div class="p-4 rounded-2xl bg-dark-900/90 border border-emerald-500/35 space-y-2 shadow-lg">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-lg">
            <i class="fa-solid fa-film"></i>
          </div>
          <h3 class="text-sm font-black text-white">رعاية الأقسام والمشغل</h3>
          <p class="text-xs text-slate-400 leading-relaxed">رعاية قسم كامل (أفلام أجنبية، عربية، مسلسلات يمنية) أو شريط أعلى المشغل.</p>
        </div>

        <div class="p-4 rounded-2xl bg-dark-900/90 border border-pink-500/35 space-y-2 shadow-lg">
          <div class="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-300 flex items-center justify-center text-lg">
            <i class="fa-brands fa-instagram"></i>
          </div>
          <h3 class="text-sm font-black text-white">باقات ترويج شاملة</h3>
          <p class="text-xs text-slate-400 leading-relaxed">نشر مشترك داخل المنصة وعلى حسابنا الرسمي في إنستقرام <span class="font-mono text-pink-300">@ticket.vib</span>.</p>
        </div>
      </div>

      <!-- Interactive Ad Request + Direct Contact Cards -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <!-- Request Builder Form (3 cols) -->
        <div class="lg:col-span-3 p-5 rounded-3xl bg-dark-900 border border-dark-border space-y-4 shadow-xl">
          <div class="flex items-center gap-2.5 border-b border-dark-border/70 pb-3">
            <div class="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center text-sm">
              <i class="fa-solid fa-pen-to-square"></i>
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-black text-white">تجهيز طلب إعلان في المنصة</h3>
              <p class="text-[11px] text-slate-400">اكتب بيانات إعلانك واضغط إرسال للتواصل مباشرة مع صاحب المنصة</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="adClientName" class="block text-xs font-bold text-slate-300 mb-1.5">اسمك أو اسم المتجر / الشركة</label>
              <input id="adClientName" type="text" maxlength="100" oninput="syncAdRequestLinks()" placeholder="مثال: متجر النجم للإلكترونيات" class="w-full bg-dark-950 border border-dark-border focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none" />
            </div>
            <div>
              <label for="adPlacementType" class="block text-xs font-bold text-slate-300 mb-1.5">نوع الإعلان المطلوب</label>
              <select id="adPlacementType" onchange="syncAdRequestLinks()" class="w-full bg-dark-950 border border-dark-border focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none">
                <option value="بنر إعلاني في الواجهة الرئيسية">بنر إعلاني في الواجهة الرئيسية</option>
                <option value="عرض تجاري في قسم إعلانات وعروضات">عرض تجاري في قسم إعلانات وعروضات</option>
                <option value="رعاية قسم سينمائي أو شريط المشغل">رعاية قسم سينمائي أو شريط المشغل</option>
                <option value="حملة إعلانية شاملة (الموقع + إنستقرام)">حملة إعلانية شاملة (الموقع + إنستقرام)</option>
              </select>
            </div>
          </div>

          <div>
            <label for="adDurationChoice" class="block text-xs font-bold text-slate-300 mb-1.5">المدة المقترحة للإعلان</label>
            <select id="adDurationChoice" onchange="syncAdRequestLinks()" class="w-full bg-dark-950 border border-dark-border focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none">
              <option value="أسبوع واحد">أسبوع واحد</option>
              <option value="شهر واحد" selected>شهر واحد</option>
              <option value="3 أشهر (عرض خاص)">3 أشهر (عرض خاص)</option>
              <option value="اتفاق مخصص">اتفاق مخصص</option>
            </select>
          </div>

          <div>
            <label for="adDetailsText" class="block text-xs font-bold text-slate-300 mb-1.5">وصف الإعلان أو العرض (اختياري)</label>
            <textarea id="adDetailsText" rows="3" maxlength="350" oninput="syncAdRequestLinks()" placeholder="اكتب فكرة الإعلان أو رابط موقعك / حسابك ليتم الاتفاق على التفاصيل والسعر..." class="w-full bg-dark-950 border border-dark-border focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none resize-none"></textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <a
              id="adsWhatsappDirectLink"
              href="https://wa.me/967779676636?text=${initialMsg}"
              target="_blank"
              rel="noopener noreferrer"
              class="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:brightness-110 text-white font-black text-xs flex items-center justify-center gap-2 no-underline shadow-lg shadow-emerald-600/25 active:scale-95 transition-all"
            >
              <i class="fa-brands fa-whatsapp text-base"></i>
              <span>إرسال الطلب عبر واتساب</span>
            </a>

            <a
              href="https://www.instagram.com/ticket.vib/"
              target="_blank"
              rel="noopener noreferrer"
              onclick="copyAdRequestAndNotify()"
              class="py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:brightness-110 text-white font-black text-xs flex items-center justify-center gap-2 no-underline shadow-lg shadow-pink-600/25 active:scale-95 transition-all"
            >
              <i class="fa-brands fa-instagram text-base"></i>
              <span>مراسلة إنستقرام (@ticket.vib)</span>
            </a>
          </div>
        </div>

        <!-- Direct Owner Contact Channels (2 cols) -->
        <div class="lg:col-span-2 p-5 rounded-3xl bg-gradient-to-b from-dark-900 to-dark-950 border border-amber-400/40 space-y-4 shadow-xl">
          <div>
            <h3 class="text-sm sm:text-base font-black text-white">قنوات التواصل المباشر لعمل إعلان</h3>
            <p class="text-[11px] text-slate-400 mt-0.5">تواصل مباشرة مع مالك منصة تذكرة دخول VIP للاتفاق الفوري</p>
          </div>

          <!-- Phone / WhatsApp Card -->
          <div class="p-4 rounded-2xl bg-dark-900 border border-emerald-500/35 space-y-3">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <span class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg">
                  <i class="fa-solid fa-phone"></i>
                </span>
                <div>
                  <span class="block text-[11px] text-slate-400">رقم الهاتف والواتساب</span>
                  <span class="block text-base font-black font-mono text-amber-300 tracking-wider dir-ltr">+967 779 676 636</span>
                </div>
              </div>
              <button type="button" onclick="copyPhoneNumber('779676636')" class="px-3 py-1.5 rounded-xl bg-dark-800 hover:bg-brand hover:text-dark-950 text-slate-200 border border-dark-border text-xs font-bold cursor-pointer transition-all">
                نسخ الرقم
              </button>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <a href="https://wa.me/967779676636?text=${initialMsg}" target="_blank" rel="noopener noreferrer" class="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-dark-950 font-black text-xs flex items-center justify-center gap-1.5 no-underline">
                <i class="fa-brands fa-whatsapp"></i>
                <span>واتساب</span>
              </a>
              <a href="tel:+967779676636" class="py-2 px-3 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 font-black text-xs flex items-center justify-center gap-1.5 no-underline">
                <i class="fa-solid fa-phone-volume"></i>
                <span>اتصال مباشر</span>
              </a>
            </div>
          </div>

          <!-- Instagram Card -->
          <div class="p-4 rounded-2xl bg-dark-900 border border-pink-500/35 space-y-3">
            <div class="flex items-center gap-2.5">
              <span class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-amber-500 text-white flex items-center justify-center text-lg shrink-0">
                <i class="fa-brands fa-instagram"></i>
              </span>
              <div>
                <span class="block text-[11px] text-slate-400">حساب الإنستقرام الرسمي</span>
                <span class="block text-sm font-black font-mono text-pink-300">@ticket.vib</span>
              </div>
            </div>
            <a
              href="https://www.instagram.com/ticket.vib/"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:brightness-110 text-white font-black text-xs flex items-center justify-center gap-2 no-underline shadow-md"
            >
              <i class="fa-brands fa-instagram"></i>
              <span>فتح حساب @ticket.vib وإرسال رسالة</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  `;
}

// Export functions to window for global access from HTML attributes
window.appState = appState;
window.toggleFavorite = toggleFavorite;
window.clearAllFavorites = clearAllFavorites;
window.updateModalFavoriteButton = updateModalFavoriteButton;
window.toggleCurrentModalFavorite = toggleCurrentModalFavorite;
window.switchStarType = switchStarType;
window.filterByActor = filterByActor;
window.switchNavTab = switchNavTab;
window.handleCardClick = handleCardClick;
window.switchSeriesEpisode = switchSeriesEpisode;
window.openPlayerModal = openPlayerModal;
window.openPlayerModalWithItem = openPlayerModalWithItem;
window.reloadActivePlayer = reloadActivePlayer;
window.refreshActivePlayer = refreshActivePlayer;
window.switchPlayerServer = switchPlayerServer;
window.togglePlayerFullscreen = togglePlayerFullscreen;
window.closePlayerModal = closePlayerModal;
window.openAppSidebar = openAppSidebar;
window.closeAppSidebar = closeAppSidebar;
window.toggleCopyrightInfo = toggleCopyrightInfo;
window.copyPhoneNumber = copyPhoneNumber;
window.syncAdRequestLinks = syncAdRequestLinks;
window.copyAdRequestAndNotify = copyAdRequestAndNotify;
window.handleSearch = handleSearch;
window.clearSearch = clearSearch;
window.handleSearchFocus = handleSearchFocus;
window.handleSearchKeyDown = handleSearchKeyDown;
window.selectPredictiveItem = selectPredictiveItem;
window.setPredictiveSelectedIndex = setPredictiveSelectedIndex;
window.submitFullSearch = submitFullSearch;
window.switchSearchFilterType = switchSearchFilterType;
window.switchSeriesOriginFilter = switchSeriesOriginFilter;
window.switchLiveCategoryFilter = switchLiveCategoryFilter;
window.switchLiveChannelSource = switchLiveChannelSource;
window.handleLiveChannelClick = handleLiveChannelClick;
window.closePredictiveDropdown = closePredictiveDropdown;
window.handlePosterError = handlePosterError;
window.handleBackdropError = handleBackdropError;
window.handleActorAvatarError = handleActorAvatarError;
window.applyCatalogData = applyCatalogData;
window.switchPlayerServer = switchPlayerServer;
window.refreshActivePlayer = refreshActivePlayer;
window.togglePlayerFullscreen = togglePlayerFullscreen;
window.extractMediaCode = extractMediaCode;
window.observeLazyMedia = observeLazyMedia;
window.hydrateLazyImage = hydrateLazyImage;
window.switchVodPlaybackServer = switchVodPlaybackServer;
window.saveTelegramMovieOffline = saveTelegramMovieOffline;
window.removeTelegramMovieOffline = removeTelegramMovieOffline;
