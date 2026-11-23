const fs = require('fs');
const path = require('path');

const part1 = fs.readFileSync(path.join(__dirname, 'batch_part1.txt'), 'utf8');
const part2 = fs.readFileSync(path.join(__dirname, 'batch_sharab_part2.txt'), 'utf8');
const total = part1 + '\n' + part2;

// 1. Parse Sharab Al Toot
const sharabMap = new Map();
const regex = /<!--\s*(.*?)\s*-->\s*<iframe.*?src=\"(https:\/\/playmogo\.com\/e\/[a-zA-Z0-9]+)\"/g;
let m;

while ((m = regex.exec(total)) !== null) {
  const comment = m[1].trim();
  const embedUrl = m[2].trim();
  if (comment.includes('Sharab Al Toot') || comment.includes('Kizilcik Serbeti')) {
    const epMatch = comment.match(/E(\d+)/i);
    if (epMatch) {
      const num = parseInt(epMatch[1], 10);
      if (!sharabMap.has(num)) {
        sharabMap.set(num, {
          episodeNum: num,
          title: `الحلقة ${num}`,
          embedUrl,
          streamUrl: embedUrl,
          customWidth: 600,
          customHeight: 480
        });
      }
    }
  }
}

const sharabEpisodes = Array.from(sharabMap.values()).sort((a, b) => a.episodeNum - b.episodeNum);
console.log(`Sharab Al Toot total sorted episodes: ${sharabEpisodes.length} (from ${sharabEpisodes[0].episodeNum} to ${sharabEpisodes[sharabEpisodes.length - 1].episodeNum})`);

// 2. Parse Ihtimal Hob
const ihtimalMap = new Map();
const regex2 = /<!--\s*(.*?)\s*-->\s*<iframe.*?src=\"(https:\/\/playmogo\.com\/e\/[a-zA-Z0-9]+)\"/g;

while ((m = regex2.exec(total)) !== null) {
  const comment = m[1].trim();
  const embedUrl = m[2].trim();
  if (comment.includes('Ihtimal Hob')) {
    const epMatch = comment.match(/E(\d+)/i);
    if (epMatch) {
      const num = parseInt(epMatch[1], 10);
      if (!ihtimalMap.has(num)) {
        ihtimalMap.set(num, {
          episodeNum: num,
          title: `الحلقة ${num}`,
          embedUrl,
          streamUrl: embedUrl,
          customWidth: 600,
          customHeight: 480
        });
      }
    }
  }
}

const ihtimalEpisodes = Array.from(ihtimalMap.values()).sort((a, b) => a.episodeNum - b.episodeNum);
console.log(`Ihtimal Hob total sorted episodes: ${ihtimalEpisodes.length} (from ${ihtimalEpisodes[0].episodeNum} to ${ihtimalEpisodes[ihtimalEpisodes.length - 1].episodeNum})`);

// Read existing catalog
const curatedPath = path.join(__dirname, '..', 'public', 'curated_catalog.json');
const catalogPath = path.join(__dirname, '..', 'public', 'catalog.json');
const catalogJsPath = path.join(__dirname, '..', 'public', 'catalog.js');

let catalog = JSON.parse(fs.readFileSync(curatedPath, 'utf8'));

// Define accurate objects
const ihtimalItem = {
  id: 'series-ihtimal-hob-s01',
  title: 'مسلسل احتمال حب (Muhtemel Aşk) - الموسم الأول',
  originalTitle: 'Muhtemel Aşk S01',
  type: 'series',
  category: 'series',
  duration: `${ihtimalEpisodes.length} حلقة`,
  genre: 'كوميديا رومانسية • دراما • تشويق تركي',
  subGenre: 'romance',
  badge: 'مضاف حديثاً',
  quality: 'HD 720p',
  year: '2024',
  rating: '8.4',
  origin: 'turkish',
  embedUrl: ihtimalEpisodes[0].embedUrl,
  streamUrl: ihtimalEpisodes[0].streamUrl,
  customWidth: 600,
  customHeight: 480,
  poster: '/posters/series-ihtimal-hob-s01.jpg',
  backdrop: '/backdrops/series-ihtimal-hob-s01.jpg',
  overview: 'تدور أحداث مسلسل احتمال حب (Muhtemel Aşk) حول دافني، امرأة ناجحة ومستقلة في الثلاثينات، تبدأ رحلة عاطفية شيقة للبحث عن الحب الحقيقي، لتجد نفسها في صراع مشوق ومواقف غير متوقعة بين رجلين يغيران حياتها بالكامل.',
  actors: ['آيتشا آيشين توران', 'إكين كوتش', 'فياض شريف أوغلو'],
  episodesCount: ihtimalEpisodes.length,
  episodes: ihtimalEpisodes
};

const sharabItem = {
  id: 'series-sharab-al-toot-s04',
  title: 'مسلسل شراب التوت (Kızılcık Şerbeti) - الموسم الرابع',
  originalTitle: 'Kızılcık Şerbeti S04',
  type: 'series',
  category: 'series',
  duration: `${sharabEpisodes.length} حلقة كاملة`,
  genre: 'دراما اجتماعية • عائلي • تشويق تركي',
  subGenre: 'drama',
  badge: 'الموسم 4 كامل',
  quality: 'HD 1080p',
  year: '2024',
  rating: '8.7',
  origin: 'turkish',
  embedUrl: sharabEpisodes[0].embedUrl,
  streamUrl: sharabEpisodes[0].streamUrl,
  customWidth: 600,
  customHeight: 480,
  poster: '/posters/series-sharab-al-toot-s04.jpg',
  backdrop: '/backdrops/series-sharab-al-toot-s04.jpg',
  overview: 'في الموسم الرابع من ملحمة دراما شراب التوت (Kızılcık Şerbeti)، تتصاعد الصراعات الاجتماعية والفكرية بين العائلتين مع ظهور أسرار ومفاجآت جديدة تعصف بعلاقات الأبطال وتغير مسار الأحداث بالكامل.',
  actors: ['باريش كيليتش', 'إفريم ألاسيا', 'سيلا توركوغلو', 'دوغوكان غونغور'],
  episodesCount: sharabEpisodes.length,
  episodes: sharabEpisodes
};

// Update in catalog
function upsert(item) {
  const idx = catalog.findIndex(c => c.id === item.id);
  if (idx !== -1) {
    catalog[idx] = item;
    console.log(`Updated item: ${item.id} with ${item.episodesCount} episodes`);
  } else {
    catalog.unshift(item);
    console.log(`Inserted item: ${item.id} with ${item.episodesCount} episodes`);
  }
}

upsert(ihtimalItem);
upsert(sharabItem);

// Write to all 3 files
fs.writeFileSync(curatedPath, JSON.stringify(catalog, null, 2), 'utf8');
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
fs.writeFileSync(catalogJsPath, 'window.CURATED_CATALOG = ' + JSON.stringify(catalog, null, 2) + ';', 'utf8');

console.log(`Successfully synced ${catalog.length} items to public/curated_catalog.json, public/catalog.json, and public/catalog.js`);
