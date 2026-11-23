import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, '../public');
const distDir = path.resolve(__dirname, '../dist-hd-perfect');

// Raw parsed episodes mapping from the user's embeds
const seriesList = [
  {
    id: "series-doroob-al-marjala-s03",
    title: "مسلسل دروب المرجلة - الموسم الثالث (2024)",
    originalTitle: "Doroob Al Marjala S03",
    type: "series",
    category: "series",
    origin: "yemeni",
    duration: "الموسم الثالث كامل",
    genre: "دراما • تشويق • تراث وقبائل يمنية",
    subGenre: "drama",
    badge: "دراما يمنية 🇾🇪",
    quality: "HD 720p",
    year: "2024",
    rating: "9.5",
    overview: "المسلسل اليمني الجماهيري الأضخم، يجسد ملحمة من الشهامة والشجاعة والصراعات القبلية والاجتماعية في قالب درامي مشوق وواقعي من بطولة صلاح الوافي وأشواق علي ونخبة من ألمع نجوم الدراما اليمنية.",
    actors: [
      { name: "صلاح الوافي", role: "بطولة", avatar: "/actors/actor-1.jpg" },
      { name: "أشواق علي", role: "بطولة", avatar: "/actors/actor-2.jpg" }
    ],
    bgColors: ["#1e140a", "#3b1e08", "#110b05"],
    badgeColor: "#ea580c",
    flag: "🇾🇪",
    episodes: [
      { episodeNum: 7, title: "الحلقة 7", embedUrl: "https://playmogo.com/e/b8hroh09d0cu", streamUrl: "https://playmogo.com/e/b8hroh09d0cu", customWidth: 600, customHeight: 480 },
      { episodeNum: 12, title: "الحلقة 12", embedUrl: "https://playmogo.com/e/w5yxvixzsmbf", streamUrl: "https://playmogo.com/e/w5yxvixzsmbf", customWidth: 600, customHeight: 480 },
      { episodeNum: 16, title: "الحلقة 16", embedUrl: "https://playmogo.com/e/zwyurq0bfbry", streamUrl: "https://playmogo.com/e/zwyurq0bfbry", customWidth: 600, customHeight: 480 },
      { episodeNum: 24, title: "الحلقة 24", embedUrl: "https://playmogo.com/e/7jie4k20l5kh", streamUrl: "https://playmogo.com/e/7jie4k20l5kh", customWidth: 600, customHeight: 480 },
      { episodeNum: 28, title: "الحلقة 28", embedUrl: "https://playmogo.com/e/ixay7on51k4q", streamUrl: "https://playmogo.com/e/ixay7on51k4q", customWidth: 600, customHeight: 480 },
      { episodeNum: 29, title: "الحلقة 29", embedUrl: "https://playmogo.com/e/c1z0a1i8v8iy", streamUrl: "https://playmogo.com/e/c1z0a1i8v8iy", customWidth: 600, customHeight: 480 }
    ]
  },
  {
    id: "series-al-qafer-s01",
    title: "مسلسل القفير - الموسم الأول (2024)",
    originalTitle: "Al Qafer S01",
    type: "series",
    category: "series",
    origin: "yemeni",
    duration: "الموسم الأول كامل",
    genre: "دراما • إثارة وغموض • قضايا اجتماعية",
    subGenre: "drama",
    badge: "دراما يمنية 🇾🇪",
    quality: "HD 720p",
    year: "2024",
    rating: "9.2",
    overview: "مسلسل درامي يمني مميز تدور أحداثه حول خبايا العلاقات الإنسانية والأسرار المتشابكة في بيئة يمنية ثرية بالصراعات والأحداث غير المتوقعة.",
    actors: [
      { name: "فريق النجوم اليمنيين", role: "أدوار البطولة", avatar: "/actors/actor-3.jpg" }
    ],
    bgColors: ["#0f172a", "#1e293b", "#020617"],
    badgeColor: "#0284c7",
    flag: "🇾🇪",
    episodes: [
      { episodeNum: 9, title: "الحلقة 9", embedUrl: "https://playmogo.com/e/qhx8ch1fk6ir", streamUrl: "https://playmogo.com/e/qhx8ch1fk6ir", customWidth: 600, customHeight: 480 },
      { episodeNum: 10, title: "الحلقة 10", embedUrl: "https://playmogo.com/e/ko8ffpls1ie2", streamUrl: "https://playmogo.com/e/ko8ffpls1ie2", customWidth: 600, customHeight: 480 },
      { episodeNum: 12, title: "الحلقة 12", embedUrl: "https://playmogo.com/e/qf07dugvmhcb", streamUrl: "https://playmogo.com/e/qf07dugvmhcb", customWidth: 600, customHeight: 480 },
      { episodeNum: 13, title: "الحلقة 13", embedUrl: "https://playmogo.com/e/lggq1zd6mkkm", streamUrl: "https://playmogo.com/e/lggq1zd6mkkm", customWidth: 600, customHeight: 480 },
      { episodeNum: 15, title: "الحلقة 15", embedUrl: "https://playmogo.com/e/mes6ws8q2ppa", streamUrl: "https://playmogo.com/e/mes6ws8q2ppa", customWidth: 600, customHeight: 480 },
      { episodeNum: 18, title: "الحلقة 18", embedUrl: "https://playmogo.com/e/dqkrx498k84m", streamUrl: "https://playmogo.com/e/dqkrx498k84m", customWidth: 600, customHeight: 480 },
      { episodeNum: 19, title: "الحلقة 19", embedUrl: "https://playmogo.com/e/m5gs5p8kbx7v", streamUrl: "https://playmogo.com/e/m5gs5p8kbx7v", customWidth: 600, customHeight: 480 },
      { episodeNum: 26, title: "الحلقة 26", embedUrl: "https://playmogo.com/e/t02uuiburybt", streamUrl: "https://playmogo.com/e/t02uuiburybt", customWidth: 600, customHeight: 480 },
      { episodeNum: 27, title: "الحلقة 27", embedUrl: "https://playmogo.com/e/2woq83ytvknk", streamUrl: "https://playmogo.com/e/2woq83ytvknk", customWidth: 600, customHeight: 480 }
    ]
  },
  {
    id: "series-bait-al-tiin-s06",
    title: "مسلسل بيت الطين - الموسم السادس",
    originalTitle: "Bait Al Tiin S06",
    type: "series",
    category: "series",
    origin: "arabic",
    duration: "20 حلقة كاملة",
    genre: "كوميديا • دراما شعبية وتراثية",
    subGenre: "drama",
    badge: "الموسم كامل 20 حلقة",
    quality: "HD 720p",
    year: "2024",
    rating: "9.0",
    overview: "مسلسل تراثي شعبي يعود في موسمه السادس ليستكمل الحكايات القروية الطريفة والمواقف الاجتماعية العفوية التي عاشتها الأجيال ببساطة وعفوية ودفء.",
    actors: [
      { name: "نجوم بيت الطين", role: "بطولة جماعية", avatar: "/actors/actor-4.jpg" }
    ],
    bgColors: ["#2d1b09", "#45220a", "#1a0d04"],
    badgeColor: "#d97706",
    flag: "📺",
    episodes: [
      { episodeNum: 1, title: "الحلقة 1", embedUrl: "https://playmogo.com/e/18kl8koa93fk", streamUrl: "https://playmogo.com/e/18kl8koa93fk", customWidth: 600, customHeight: 480 },
      { episodeNum: 2, title: "الحلقة 2", embedUrl: "https://playmogo.com/e/l8hf9brvvhvb", streamUrl: "https://playmogo.com/e/l8hf9brvvhvb", customWidth: 600, customHeight: 480 },
      { episodeNum: 3, title: "الحلقة 3", embedUrl: "https://playmogo.com/e/46qa89cizgus", streamUrl: "https://playmogo.com/e/46qa89cizgus", customWidth: 600, customHeight: 480 },
      { episodeNum: 4, title: "الحلقة 4", embedUrl: "https://playmogo.com/e/esanmxmm92r1", streamUrl: "https://playmogo.com/e/esanmxmm92r1", customWidth: 600, customHeight: 480 },
      { episodeNum: 5, title: "الحلقة 5", embedUrl: "https://playmogo.com/e/jutk6pszibv8", streamUrl: "https://playmogo.com/e/jutk6pszibv8", customWidth: 600, customHeight: 480 },
      { episodeNum: 6, title: "الحلقة 6", embedUrl: "https://playmogo.com/e/ylfnn6ignjcg", streamUrl: "https://playmogo.com/e/ylfnn6ignjcg", customWidth: 600, customHeight: 480 },
      { episodeNum: 7, title: "الحلقة 7", embedUrl: "https://playmogo.com/e/ht4icm0c7ak2", streamUrl: "https://playmogo.com/e/ht4icm0c7ak2", customWidth: 600, customHeight: 480 },
      { episodeNum: 8, title: "الحلقة 8", embedUrl: "https://playmogo.com/e/gpd0kgign10d", streamUrl: "https://playmogo.com/e/gpd0kgign10d", customWidth: 600, customHeight: 480 },
      { episodeNum: 9, title: "الحلقة 9", embedUrl: "https://playmogo.com/e/3iw67y3emrmm", streamUrl: "https://playmogo.com/e/3iw67y3emrmm", customWidth: 600, customHeight: 480 },
      { episodeNum: 10, title: "الحلقة 10", embedUrl: "https://playmogo.com/e/c8a4v8sex12f", streamUrl: "https://playmogo.com/e/c8a4v8sex12f", customWidth: 600, customHeight: 480 },
      { episodeNum: 11, title: "الحلقة 11", embedUrl: "https://playmogo.com/e/4mppsnb0t86j", streamUrl: "https://playmogo.com/e/4mppsnb0t86j", customWidth: 600, customHeight: 480 },
      { episodeNum: 12, title: "الحلقة 12", embedUrl: "https://playmogo.com/e/naqjq26tqfdv", streamUrl: "https://playmogo.com/e/naqjq26tqfdv", customWidth: 600, customHeight: 480 },
      { episodeNum: 13, title: "الحلقة 13", embedUrl: "https://playmogo.com/e/sri6mz7dfxha", streamUrl: "https://playmogo.com/e/sri6mz7dfxha", customWidth: 600, customHeight: 480 },
      { episodeNum: 14, title: "الحلقة 14", embedUrl: "https://playmogo.com/e/ul7igknss6zl", streamUrl: "https://playmogo.com/e/ul7igknss6zl", customWidth: 600, customHeight: 480 },
      { episodeNum: 15, title: "الحلقة 15", embedUrl: "https://playmogo.com/e/tl3dxmar5uw9", streamUrl: "https://playmogo.com/e/tl3dxmar5uw9", customWidth: 600, customHeight: 480 },
      { episodeNum: 16, title: "الحلقة 16", embedUrl: "https://playmogo.com/e/lamdvawbr8ut", streamUrl: "https://playmogo.com/e/lamdvawbr8ut", customWidth: 600, customHeight: 480 },
      { episodeNum: 17, title: "الحلقة 17", embedUrl: "https://playmogo.com/e/ku2pq7721rvb", streamUrl: "https://playmogo.com/e/ku2pq7721rvb", customWidth: 600, customHeight: 480 },
      { episodeNum: 18, title: "الحلقة 18", embedUrl: "https://playmogo.com/e/lh99jsxsstlx", streamUrl: "https://playmogo.com/e/lh99jsxsstlx", customWidth: 600, customHeight: 480 },
      { episodeNum: 19, title: "الحلقة 19", embedUrl: "https://playmogo.com/e/dcm0ckv0zqtv", streamUrl: "https://playmogo.com/e/dcm0ckv0zqtv", customWidth: 600, customHeight: 480 },
      { episodeNum: 20, title: "الحلقة 20", embedUrl: "https://playmogo.com/e/bdsytf3pp4bc", streamUrl: "https://playmogo.com/e/bdsytf3pp4bc", customWidth: 600, customHeight: 480 }
    ]
  },
  {
    id: "series-wadima-wa-halima-s05",
    title: "مسلسل وديمة وحليمة - الموسم الخامس",
    originalTitle: "Wadima and Halima S05",
    type: "series",
    category: "series",
    origin: "arabic",
    duration: "30 حلقة كاملة",
    genre: "كوميديا • مواقف عائلية • مقالب طريفة",
    subGenre: "comedy",
    badge: "الموسم كامل 30 حلقة",
    quality: "HD 720p",
    year: "2024",
    rating: "8.9",
    overview: "المسلسل الكوميدي الخليجي المحبوب بموسمه الخامس، مواجهات ومناكفات كوميدية ساخرة لا تتوقف بين الجارتين وديمة وحليمة وسط مواقف عائلية مضحكة للغاية.",
    actors: [
      { name: "سعاد علي", role: "وديمة", avatar: "/actors/actor-5.jpg" },
      { name: "ملاك الخالدي", role: "حليمة", avatar: "/actors/actor-6.jpg" }
    ],
    bgColors: ["#1e1b4b", "#312e81", "#0f172a"],
    badgeColor: "#8b5cf6",
    flag: "🍿",
    episodes: [
      { episodeNum: 1, title: "الحلقة 1", embedUrl: "https://playmogo.com/e/0dfcayntwl0j", streamUrl: "https://playmogo.com/e/0dfcayntwl0j", customWidth: 600, customHeight: 480 },
      { episodeNum: 2, title: "الحلقة 2", embedUrl: "https://playmogo.com/e/mo9345q8cjku", streamUrl: "https://playmogo.com/e/mo9345q8cjku", customWidth: 600, customHeight: 480 },
      { episodeNum: 3, title: "الحلقة 3", embedUrl: "https://playmogo.com/e/52o7u9m4gdpj", streamUrl: "https://playmogo.com/e/52o7u9m4gdpj", customWidth: 600, customHeight: 480 },
      { episodeNum: 4, title: "الحلقة 4", embedUrl: "https://playmogo.com/e/r1ya6uwkn52y", streamUrl: "https://playmogo.com/e/r1ya6uwkn52y", customWidth: 600, customHeight: 480 },
      { episodeNum: 5, title: "الحلقة 5", embedUrl: "https://playmogo.com/e/md2epkb4newd", streamUrl: "https://playmogo.com/e/md2epkb4newd", customWidth: 600, customHeight: 480 },
      { episodeNum: 6, title: "الحلقة 6", embedUrl: "https://playmogo.com/e/669q31st2qbg", streamUrl: "https://playmogo.com/e/669q31st2qbg", customWidth: 600, customHeight: 480 },
      { episodeNum: 7, title: "الحلقة 7", embedUrl: "https://playmogo.com/e/jpklxtdlwrgi", streamUrl: "https://playmogo.com/e/jpklxtdlwrgi", customWidth: 600, customHeight: 480 },
      { episodeNum: 8, title: "الحلقة 8", embedUrl: "https://playmogo.com/e/pxlpnmn9lzpd", streamUrl: "https://playmogo.com/e/pxlpnmn9lzpd", customWidth: 600, customHeight: 480 },
      { episodeNum: 9, title: "الحلقة 9", embedUrl: "https://playmogo.com/e/qltaergg3cxr", streamUrl: "https://playmogo.com/e/qltaergg3cxr", customWidth: 600, customHeight: 480 },
      { episodeNum: 10, title: "الحلقة 10", embedUrl: "https://playmogo.com/e/s7yt3ww79y4h", streamUrl: "https://playmogo.com/e/s7yt3ww79y4h", customWidth: 600, customHeight: 480 },
      { episodeNum: 11, title: "الحلقة 11", embedUrl: "https://playmogo.com/e/k7hk5p6uvilu", streamUrl: "https://playmogo.com/e/k7hk5p6uvilu", customWidth: 600, customHeight: 480 },
      { episodeNum: 12, title: "الحلقة 12", embedUrl: "https://playmogo.com/e/gnz6kutlwqmg", streamUrl: "https://playmogo.com/e/gnz6kutlwqmg", customWidth: 600, customHeight: 480 },
      { episodeNum: 13, title: "الحلقة 13", embedUrl: "https://playmogo.com/e/6e3ogj6i4sai", streamUrl: "https://playmogo.com/e/6e3ogj6i4sai", customWidth: 600, customHeight: 480 },
      { episodeNum: 14, title: "الحلقة 14", embedUrl: "https://playmogo.com/e/esahxecb7qbd", streamUrl: "https://playmogo.com/e/esahxecb7qbd", customWidth: 600, customHeight: 480 },
      { episodeNum: 15, title: "الحلقة 15", embedUrl: "https://playmogo.com/e/wv7mz3nwt666", streamUrl: "https://playmogo.com/e/wv7mz3nwt666", customWidth: 600, customHeight: 480 },
      { episodeNum: 16, title: "الحلقة 16", embedUrl: "https://playmogo.com/e/yr1ubenauf2s", streamUrl: "https://playmogo.com/e/yr1ubenauf2s", customWidth: 600, customHeight: 480 },
      { episodeNum: 17, title: "الحلقة 17", embedUrl: "https://playmogo.com/e/b16pkl0icujr", streamUrl: "https://playmogo.com/e/b16pkl0icujr", customWidth: 600, customHeight: 480 },
      { episodeNum: 18, title: "الحلقة 18", embedUrl: "https://playmogo.com/e/iswuej77q4mf", streamUrl: "https://playmogo.com/e/iswuej77q4mf", customWidth: 600, customHeight: 480 },
      { episodeNum: 19, title: "الحلقة 19", embedUrl: "https://playmogo.com/e/5pt7er163ia6", streamUrl: "https://playmogo.com/e/5pt7er163ia6", customWidth: 600, customHeight: 480 },
      { episodeNum: 20, title: "الحلقة 20", embedUrl: "https://playmogo.com/e/27uqk3r5usm3", streamUrl: "https://playmogo.com/e/27uqk3r5usm3", customWidth: 600, customHeight: 480 },
      { episodeNum: 21, title: "الحلقة 21", embedUrl: "https://playmogo.com/e/uhve5y3mqcb6", streamUrl: "https://playmogo.com/e/uhve5y3mqcb6", customWidth: 600, customHeight: 480 },
      { episodeNum: 22, title: "الحلقة 22", embedUrl: "https://playmogo.com/e/xrmhrqwggs7p", streamUrl: "https://playmogo.com/e/xrmhrqwggs7p", customWidth: 600, customHeight: 480 },
      { episodeNum: 23, title: "الحلقة 23", embedUrl: "https://playmogo.com/e/xqjdbvrkyeex", streamUrl: "https://playmogo.com/e/xqjdbvrkyeex", customWidth: 600, customHeight: 480 },
      { episodeNum: 24, title: "الحلقة 24", embedUrl: "https://playmogo.com/e/s3wthvi9qqtq", streamUrl: "https://playmogo.com/e/s3wthvi9qqtq", customWidth: 600, customHeight: 480 },
      { episodeNum: 25, title: "الحلقة 25", embedUrl: "https://playmogo.com/e/u5cqsu4atorb", streamUrl: "https://playmogo.com/e/u5cqsu4atorb", customWidth: 600, customHeight: 480 },
      { episodeNum: 27, title: "الحلقة 27", embedUrl: "https://playmogo.com/e/oc7emnc094ot", streamUrl: "https://playmogo.com/e/oc7emnc094ot", customWidth: 600, customHeight: 480 },
      { episodeNum: 28, title: "الحلقة 28", embedUrl: "https://playmogo.com/e/gwc1r5sbkgts", streamUrl: "https://playmogo.com/e/gwc1r5sbkgts", customWidth: 600, customHeight: 480 },
      { episodeNum: 29, title: "الحلقة 29", embedUrl: "https://playmogo.com/e/rdrg1wrrjzdl", streamUrl: "https://playmogo.com/e/rdrg1wrrjzdl", customWidth: 600, customHeight: 480 },
      { episodeNum: 30, title: "الحلقة 30", embedUrl: "https://playmogo.com/e/z9oa6od1q8l2", streamUrl: "https://playmogo.com/e/z9oa6od1q8l2", customWidth: 600, customHeight: 480 },
      { episodeNum: 31, title: "الحلقة 31 (الختامية)", embedUrl: "https://playmogo.com/e/l1tvvcn6m6zh", streamUrl: "https://playmogo.com/e/l1tvvcn6m6zh", customWidth: 600, customHeight: 480 }
    ]
  },
  {
    id: "series-jak-al-elm-s03",
    title: "مسلسل جاك العلم - الموسم الثالث",
    originalTitle: "Jak Al Elm S03",
    type: "series",
    category: "series",
    origin: "arabic",
    duration: "21 حلقة كاملة",
    genre: "كوميديا • مواقف فكاهية • أبو صامل وأم صامل",
    subGenre: "comedy",
    badge: "كوميديا VIP 21 حلقة",
    quality: "HD 720p",
    year: "2024",
    rating: "8.8",
    overview: "يوميات ومقالب أبو صامل وأم صامل في قالب كوميدي ساخر وخفيف الظل يتناول الصراعات والمفارقات الزوجية بطريقة فكاهية ممتعة.",
    actors: [
      { name: "ماجد مطرب فواز", role: "أبو صامل", avatar: "/actors/actor-7.jpg" },
      { name: "ريم عبد الله", role: "أم صامل", avatar: "/actors/actor-8.jpg" }
    ],
    bgColors: ["#064e3b", "#047857", "#022c22"],
    badgeColor: "#10b981",
    flag: "🍿",
    episodes: [
      { episodeNum: 6, title: "الحلقة 6", embedUrl: "https://playmogo.com/e/ev3wmnnlhb1c", streamUrl: "https://playmogo.com/e/ev3wmnnlhb1c", customWidth: 600, customHeight: 480 },
      { episodeNum: 9, title: "الحلقة 9", embedUrl: "https://playmogo.com/e/zkhwa85t2m1m", streamUrl: "https://playmogo.com/e/zkhwa85t2m1m", customWidth: 600, customHeight: 480 },
      { episodeNum: 11, title: "الحلقة 11", embedUrl: "https://playmogo.com/e/pgdffx53182k", streamUrl: "https://playmogo.com/e/pgdffx53182k", customWidth: 600, customHeight: 480 },
      { episodeNum: 12, title: "الحلقة 12", embedUrl: "https://playmogo.com/e/q15fb6qtvgow", streamUrl: "https://playmogo.com/e/q15fb6qtvgow", customWidth: 600, customHeight: 480 },
      { episodeNum: 14, title: "الحلقة 14", embedUrl: "https://playmogo.com/e/gwqscmvkv3wt", streamUrl: "https://playmogo.com/e/gwqscmvkv3wt", customWidth: 600, customHeight: 480 },
      { episodeNum: 15, title: "الحلقة 15", embedUrl: "https://playmogo.com/e/8xfcpv3gph4d", streamUrl: "https://playmogo.com/e/8xfcpv3gph4d", customWidth: 600, customHeight: 480 },
      { episodeNum: 16, title: "الحلقة 16", embedUrl: "https://playmogo.com/e/qw6v6fvippky", streamUrl: "https://playmogo.com/e/qw6v6fvippky", customWidth: 600, customHeight: 480 },
      { episodeNum: 17, title: "الحلقة 17", embedUrl: "https://playmogo.com/e/ahcb0tw0j61e", streamUrl: "https://playmogo.com/e/ahcb0tw0j61e", customWidth: 600, customHeight: 480 },
      { episodeNum: 18, title: "الحلقة 18", embedUrl: "https://playmogo.com/e/s4qxsmaa9msv", streamUrl: "https://playmogo.com/e/s4qxsmaa9msv", customWidth: 600, customHeight: 480 },
      { episodeNum: 19, title: "الحلقة 19", embedUrl: "https://playmogo.com/e/wewcw7vgjbik", streamUrl: "https://playmogo.com/e/wewcw7vgjbik", customWidth: 600, customHeight: 480 },
      { episodeNum: 20, title: "الحلقة 20", embedUrl: "https://playmogo.com/e/ucjk8s407i4m", streamUrl: "https://playmogo.com/e/ucjk8s407i4m", customWidth: 600, customHeight: 480 },
      { episodeNum: 21, title: "الحلقة 21", embedUrl: "https://playmogo.com/e/wr984gh48rf2", streamUrl: "https://playmogo.com/e/wr984gh48rf2", customWidth: 600, customHeight: 480 },
      { episodeNum: 22, title: "الحلقة 22", embedUrl: "https://playmogo.com/e/i4yc8ut0fdn6", streamUrl: "https://playmogo.com/e/i4yc8ut0fdn6", customWidth: 600, customHeight: 480 },
      { episodeNum: 23, title: "الحلقة 23", embedUrl: "https://playmogo.com/e/39nbi07gyeyg", streamUrl: "https://playmogo.com/e/39nbi07gyeyg", customWidth: 600, customHeight: 480 },
      { episodeNum: 24, title: "الحلقة 24", embedUrl: "https://playmogo.com/e/dr0bmkgl7dec", streamUrl: "https://playmogo.com/e/dr0bmkgl7dec", customWidth: 600, customHeight: 480 },
      { episodeNum: 25, title: "الحلقة 25", embedUrl: "https://playmogo.com/e/xwk2zd9xiz5q", streamUrl: "https://playmogo.com/e/xwk2zd9xiz5q", customWidth: 600, customHeight: 480 },
      { episodeNum: 26, title: "الحلقة 26", embedUrl: "https://playmogo.com/e/9bkemkp6hb00", streamUrl: "https://playmogo.com/e/9bkemkp6hb00", customWidth: 600, customHeight: 480 },
      { episodeNum: 27, title: "الحلقة 27", embedUrl: "https://playmogo.com/e/2q4irdcm6ulb", streamUrl: "https://playmogo.com/e/2q4irdcm6ulb", customWidth: 600, customHeight: 480 },
      { episodeNum: 28, title: "الحلقة 28", embedUrl: "https://playmogo.com/e/zeeht2xtqzh9", streamUrl: "https://playmogo.com/e/zeeht2xtqzh9", customWidth: 600, customHeight: 480 },
      { episodeNum: 29, title: "الحلقة 29", embedUrl: "https://playmogo.com/e/2vsjn2hpg92o", streamUrl: "https://playmogo.com/e/2vsjn2hpg92o", customWidth: 600, customHeight: 480 },
      { episodeNum: 30, title: "الحلقة 30", embedUrl: "https://playmogo.com/e/68z7jlgsydmq", streamUrl: "https://playmogo.com/e/68z7jlgsydmq", customWidth: 600, customHeight: 480 }
    ]
  },
  {
    id: "series-anbar-5-s01",
    title: "مسلسل عنبر 5 - الموسم الأول",
    originalTitle: "Anbar 5 S01",
    type: "series",
    category: "series",
    origin: "arabic",
    duration: "8 حلقات",
    genre: "دراما • إثارة وتشويق • سجون وغموض",
    subGenre: "drama",
    badge: "دراما وتشويق 8 حلقات",
    quality: "HD 720p",
    year: "2024",
    rating: "8.5",
    overview: "قصص إنسانية وقضايا حابسة للأنفاس وراء القضبان في العنبر الخامس، حيث تتشابك مصائر النزلاء وتنكشف الأسرار والصراعات الخفية.",
    actors: [
      { name: "فريق العمل", role: "بطولة", avatar: "/actors/actor-9.jpg" }
    ],
    bgColors: ["#1c1917", "#292524", "#0c0a09"],
    badgeColor: "#ef4444",
    flag: "📺",
    episodes: [
      { episodeNum: 1, title: "الحلقة 1", embedUrl: "https://playmogo.com/e/aed6b538idik", streamUrl: "https://playmogo.com/e/aed6b538idik", customWidth: 600, customHeight: 480 },
      { episodeNum: 8, title: "الحلقة 8", embedUrl: "https://playmogo.com/e/veo189n5ojud", streamUrl: "https://playmogo.com/e/veo189n5ojud", customWidth: 600, customHeight: 480 },
      { episodeNum: 10, title: "الحلقة 10", embedUrl: "https://playmogo.com/e/ydjnbto56plr", streamUrl: "https://playmogo.com/e/ydjnbto56plr", customWidth: 600, customHeight: 480 },
      { episodeNum: 16, title: "الحلقة 16", embedUrl: "https://playmogo.com/e/o6mtmhbuxhju", streamUrl: "https://playmogo.com/e/o6mtmhbuxhju", customWidth: 600, customHeight: 480 },
      { episodeNum: 18, title: "الحلقة 18", embedUrl: "https://playmogo.com/e/nl0tngsgsw5p", streamUrl: "https://playmogo.com/e/nl0tngsgsw5p", customWidth: 600, customHeight: 480 },
      { episodeNum: 24, title: "الحلقة 24", embedUrl: "https://playmogo.com/e/k2zfnjyok0s1", streamUrl: "https://playmogo.com/e/k2zfnjyok0s1", customWidth: 600, customHeight: 480 },
      { episodeNum: 26, title: "الحلقة 26", embedUrl: "https://playmogo.com/e/mqr9hxsvj33c", streamUrl: "https://playmogo.com/e/mqr9hxsvj33c", customWidth: 600, customHeight: 480 },
      { episodeNum: 27, title: "الحلقة 27", embedUrl: "https://playmogo.com/e/ahnj5anc9ddp", streamUrl: "https://playmogo.com/e/ahnj5anc9ddp", customWidth: 600, customHeight: 480 }
    ]
  },
  {
    id: "series-watan-a-watar-2026",
    title: "مسلسل وطن ع وتر (2026)",
    originalTitle: "Watan A Watar 2026",
    type: "series",
    category: "series",
    origin: "arabic",
    duration: "حلقات مختارة 2026",
    genre: "كوميديا ساخرة • نقد اجتماعي",
    subGenre: "comedy",
    badge: "كوميديا 2026",
    quality: "HD 720p",
    year: "2026",
    rating: "8.7",
    overview: "اللوحات الكوميدية الشهيرة وطن ع وتر، نقد كوميدي ساخر وجريء يعالج قضايا الشارع والمفارقات اليومية بأسلوب فكاهي مضحك بطولة عماد فراجين.",
    actors: [
      { name: "عماد فراجين", role: "بطولة", avatar: "/actors/actor-10.jpg" }
    ],
    bgColors: ["#3b0764", "#581c87", "#1e1b4b"],
    badgeColor: "#c084fc",
    flag: "🍿",
    episodes: [
      { episodeNum: 12, title: "الحلقة 12", embedUrl: "https://playmogo.com/e/gyc9nd4fm6bp", streamUrl: "https://playmogo.com/e/gyc9nd4fm6bp", customWidth: 600, customHeight: 480 },
      { episodeNum: 16, title: "الحلقة 16", embedUrl: "https://playmogo.com/e/03lyv4rongpq", streamUrl: "https://playmogo.com/e/03lyv4rongpq", customWidth: 600, customHeight: 480 },
      { episodeNum: 20, title: "الحلقة 20", embedUrl: "https://playmogo.com/e/k51wr38z4tq1", streamUrl: "https://playmogo.com/e/k51wr38z4tq1", customWidth: 600, customHeight: 480 }
    ]
  }
];

// Generate artwork for each series
async function generateArtwork() {
  for (const s of seriesList) {
    const posterSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900">
      <defs>
        <radialGradient id="bg" cx="50%" cy="35%" r="75%">
          <stop offset="0%" stop-color="${s.bgColors[1]}"/>
          <stop offset="60%" stop-color="${s.bgColors[0]}"/>
          <stop offset="100%" stop-color="${s.bgColors[2]}"/>
        </radialGradient>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fde68a"/>
          <stop offset="50%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#b45309"/>
        </linearGradient>
        <linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000" flood-opacity="0.8"/>
        </filter>
      </defs>
      
      <!-- Poster Background -->
      <rect width="600" height="900" fill="url(#bg)"/>
      
      <!-- Cinematic Vignette & Border -->
      <rect x="15" y="15" width="570" height="870" rx="24" fill="none" stroke="${s.badgeColor}" stroke-width="2.5" stroke-opacity="0.4"/>
      
      <!-- Top Badges -->
      <g transform="translate(35, 45)">
        <rect width="130" height="40" rx="10" fill="#000" fill-opacity="0.6" stroke="${s.badgeColor}" stroke-width="1.5"/>
        <text x="65" y="26" font-family="'Segoe UI', Tahoma, sans-serif" font-weight="900" font-size="16" fill="#fff" text-anchor="middle">${s.flag} ${s.quality}</text>
      </g>
      
      <g transform="translate(435, 45)">
        <rect width="130" height="40" rx="10" fill="#000" fill-opacity="0.6" stroke="url(#gold)" stroke-width="1.5"/>
        <text x="65" y="26" font-family="'Segoe UI', Tahoma, sans-serif" font-weight="900" font-size="16" fill="#fbbf24" text-anchor="middle">★ ${s.rating}</text>
      </g>
      
      <!-- Central Cinematic Play Emblem -->
      <g transform="translate(300, 360)" filter="url(#shadow)">
        <circle cx="0" cy="0" r="100" fill="#000000" fill-opacity="0.5" stroke="url(#gold)" stroke-width="4"/>
        <circle cx="0" cy="0" r="85" fill="none" stroke="${s.badgeColor}" stroke-width="2" stroke-opacity="0.6"/>
        <polygon points="-25,-45 45,0 -25,45" fill="url(#gold)"/>
      </g>
      
      <!-- Series Type Ribbons -->
      <g transform="translate(300, 520)">
        <rect x="-140" y="0" width="280" height="38" rx="12" fill="${s.badgeColor}" fill-opacity="0.25" stroke="${s.badgeColor}" stroke-width="1.5"/>
        <text x="0" y="25" font-family="'Segoe UI', Tahoma, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle" letter-spacing="2">
          ${s.badge}
        </text>
      </g>
      
      <!-- Bottom Section / Title Banner -->
      <g transform="translate(300, 640)" filter="url(#shadow)">
        <!-- Original English Title -->
        <text x="0" y="0" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="28" fill="#fde68a" text-anchor="middle" letter-spacing="3">
          ${s.originalTitle.toUpperCase()}
        </text>
        
        <!-- Genre Tagline -->
        <text x="0" y="45" font-family="'Segoe UI', Tahoma, sans-serif" font-weight="bold" font-size="18" fill="#94a3b8" text-anchor="middle">
          ${s.genre}
        </text>
      </g>
      
      <!-- Bottom Cinema Pass Brand -->
      <g transform="translate(50, 770)">
        <rect width="500" height="75" rx="18" fill="#07090e" stroke="url(#gold)" stroke-width="2.5"/>
        <text x="250" y="46" font-family="'Segoe UI', Tahoma, sans-serif" font-weight="900" font-size="22" fill="#ffffff" text-anchor="middle">
          تذكرة دخول • <tspan fill="#fbbf24">VIP CINEMA</tspan>
        </text>
      </g>
    </svg>
    `;

    const backdropSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
      <defs>
        <linearGradient id="bgH" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${s.bgColors[1]}"/>
          <stop offset="50%" stop-color="${s.bgColors[0]}"/>
          <stop offset="100%" stop-color="${s.bgColors[2]}"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#bgH)"/>
      <g transform="translate(640, 360)">
        <circle cx="0" cy="0" r="110" fill="#000" fill-opacity="0.6" stroke="${s.badgeColor}" stroke-width="4"/>
        <polygon points="-30,-50 50,0 -30,50" fill="#fbbf24"/>
        <text x="0" y="140" font-family="'Segoe UI', Tahoma, sans-serif" font-weight="900" font-size="34" fill="#ffffff" text-anchor="middle">${s.originalTitle}</text>
      </g>
    </svg>
    `;

    const posterPath = path.join(publicDir, `posters/${s.id}.jpg`);
    const backdropPath = path.join(publicDir, `backdrops/${s.id}.jpg`);

    await sharp(Buffer.from(posterSvg)).jpeg({ quality: 90 }).toFile(posterPath);
    await sharp(Buffer.from(backdropSvg)).jpeg({ quality: 85 }).toFile(backdropPath);

    // Also copy to dist-hd-perfect
    if (fs.existsSync(distDir)) {
      fs.copyFileSync(posterPath, path.join(distDir, `posters/${s.id}.jpg`));
      fs.copyFileSync(backdropPath, path.join(distDir, `backdrops/${s.id}.jpg`));
    }

    console.log(`Generated artwork for ${s.id}`);
  }
}

async function updateCatalog() {
  await generateArtwork();

  const curatedPath = path.join(publicDir, 'curated_catalog.json');
  const catalogPath = path.join(publicDir, 'catalog.json');
  const catalogJsPath = path.join(publicDir, 'catalog.js');

  let curated = JSON.parse(fs.readFileSync(curatedPath, 'utf8'));

  // Prepare series objects to prepend
  const formattedSeries = seriesList.map(s => ({
    id: s.id,
    title: s.title,
    originalTitle: s.originalTitle,
    type: "series",
    category: "series",
    duration: `${s.episodes.length} حلقات`,
    genre: s.genre,
    subGenre: s.subGenre,
    badge: s.badge,
    quality: s.quality,
    year: s.year,
    rating: s.rating,
    origin: s.origin,
    embedUrl: s.episodes[0].embedUrl,
    streamUrl: s.episodes[0].streamUrl,
    customWidth: 600,
    customHeight: 480,
    poster: `/posters/${s.id}.jpg`,
    backdrop: `/backdrops/${s.id}.jpg`,
    overview: s.overview,
    actors: s.actors,
    episodesCount: s.episodes.length,
    episodes: s.episodes
  }));

  // Remove any previously added items with these IDs if running repeatedly
  const seriesIds = new Set(formattedSeries.map(s => s.id));
  curated = curated.filter(item => !seriesIds.has(item.id));

  // Prepend to top of catalog
  const newCatalog = [...formattedSeries, ...curated];

  fs.writeFileSync(curatedPath, JSON.stringify(newCatalog, null, 2), 'utf8');
  fs.writeFileSync(catalogPath, JSON.stringify(newCatalog, null, 2), 'utf8');
  fs.writeFileSync(catalogJsPath, 'window.TADHKIRA_MEDIA = ' + JSON.stringify(newCatalog, null, 2) + ';', 'utf8');

  // Copy to dist-hd-perfect
  if (fs.existsSync(distDir)) {
    fs.copyFileSync(curatedPath, path.join(distDir, 'curated_catalog.json'));
    fs.copyFileSync(catalogPath, path.join(distDir, 'catalog.json'));
    fs.copyFileSync(catalogJsPath, path.join(distDir, 'catalog.js'));
  }

  console.log(`Updated catalog! Total items: ${newCatalog.length}. Prepended ${formattedSeries.length} new full series.`);
}

updateCatalog().catch(err => {
  console.error('Error updating catalog:', err);
  process.exit(1);
});
