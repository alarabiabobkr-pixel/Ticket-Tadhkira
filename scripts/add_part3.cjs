const fs = require('fs');
const path = require('path');

const part1 = fs.readFileSync(path.join(__dirname, 'batch_part1.txt'), 'utf8');
const part2 = fs.readFileSync(path.join(__dirname, 'batch_sharab_part2.txt'), 'utf8');
const part3 = fs.readFileSync(path.join(__dirname, 'batch_part3.txt'), 'utf8');
const allText = part1 + '\n' + part2 + '\n' + part3;

const regex = /<!--\s*(.*?)\s*-->\s*<iframe.*?src=\"(https:\/\/playmogo\.com\/e\/[a-zA-Z0-9]+)\"/g;
let m;

const ihtimalMap = new Map();
const zanbMap = new Map();

while ((m = regex.exec(allText)) !== null) {
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
  } else if (comment.includes('Zanb Insani')) {
    const epMatch = comment.match(/E(\d+)/i);
    if (epMatch) {
      const num = parseInt(epMatch[1], 10);
      if (!zanbMap.has(num)) {
        zanbMap.set(num, {
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
const zanbEpisodes = Array.from(zanbMap.values()).sort((a, b) => a.episodeNum - b.episodeNum);

console.log(`Ihtimal Hob episodes count: ${ihtimalEpisodes.length} (from ${ihtimalEpisodes[0].episodeNum} to ${ihtimalEpisodes[ihtimalEpisodes.length - 1].episodeNum})`);
console.log(`Zanb Insani episodes count: ${zanbEpisodes.length} (from ${zanbEpisodes[0].episodeNum} to ${zanbEpisodes[zanbEpisodes.length - 1].episodeNum})`);

const curatedPath = path.join(__dirname, '..', 'public', 'curated_catalog.json');
const catalogPath = path.join(__dirname, '..', 'public', 'catalog.json');
const catalogJsPath = path.join(__dirname, '..', 'public', 'catalog.js');

let catalog = JSON.parse(fs.readFileSync(curatedPath, 'utf8'));

// 1. Update Ihtimal Hob to full 90 episodes
const ihtimalItem = {
  id: 'series-ihtimal-hob-s01',
  title: 'مسلسل احتمال حب (Muhtemel Aşk) - الموسم الأول',
  originalTitle: 'Muhtemel Aşk S01',
  type: 'series',
  category: 'series',
  duration: `${ihtimalEpisodes.length} حلقة كاملة`,
  genre: 'كوميديا رومانسية • دراما • تشويق تركي',
  subGenre: 'romance',
  badge: 'الموسم كامل 90 حلقة',
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

// 2. Add Zanb Insani
const zanbItem = {
  id: 'series-zanb-insani-s01',
  title: 'مسلسل ذنب إنساني (İnsanlık Suçu) - الموسم الأول',
  originalTitle: 'İnsanlık Suçu S01',
  type: 'series',
  category: 'series',
  duration: `${zanbEpisodes.length} حلقات`,
  genre: 'جريمة • دراما • إثارة وتشويق تركي',
  subGenre: 'drama',
  badge: 'مضاف حديثاً',
  quality: 'HD 720p',
  year: '2018',
  rating: '8.0',
  origin: 'turkish',
  embedUrl: zanbEpisodes[0].embedUrl,
  streamUrl: zanbEpisodes[0].streamUrl,
  customWidth: 600,
  customHeight: 480,
  poster: '/posters/series-zanb-insani-s01.jpg',
  backdrop: '/backdrops/series-zanb-insani-s01.jpg',
  overview: 'تدور أحداث مسلسل ذنب إنساني (İnsanlık Suçu) حول جمال، الشاب البسيط الذي يكافح في أضنة لرعاية أسرته، قبل أن يكتشف قبل وفاة والده مباشرة أنه ينتمي لعائلة فاحشة الثراء في إسطنبول، لينتقل إلى عالم مليء بالمؤامرات والجشع والأسرار القاتلة.',
  actors: ['كان يلدرم', 'جيزام كارجا', 'ميليكه إيبيك يالوفا', 'دنيز أوغور'],
  episodesCount: zanbEpisodes.length,
  episodes: zanbEpisodes
};

function upsert(item) {
  const idx = catalog.findIndex(c => c.id === item.id);
  if (idx !== -1) {
    catalog[idx] = item;
    console.log(`Updated item: ${item.id} with ${item.episodesCount} episodes`);
  } else {
    catalog.unshift(item);
    console.log(`Inserted new item: ${item.id} with ${item.episodesCount} episodes`);
  }
}

upsert(ihtimalItem);
upsert(zanbItem);

fs.writeFileSync(curatedPath, JSON.stringify(catalog, null, 2), 'utf8');
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
fs.writeFileSync(catalogJsPath, 'window.CURATED_CATALOG = ' + JSON.stringify(catalog, null, 2) + ';', 'utf8');

console.log(`Successfully synced ${catalog.length} items to all catalog files.`);
