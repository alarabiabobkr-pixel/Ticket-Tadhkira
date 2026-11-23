const fs = require('fs');
const path = require('path');

const part1 = fs.readFileSync(path.join(__dirname, 'batch_part1.txt'), 'utf8');
const part2 = fs.readFileSync(path.join(__dirname, 'batch_sharab_part2.txt'), 'utf8');
const part3 = fs.readFileSync(path.join(__dirname, 'batch_part3.txt'), 'utf8');
const part4 = fs.readFileSync(path.join(__dirname, 'batch_part4.txt'), 'utf8');
const allText = [part1, part2, part3, part4].join('\n');

const regex = /<!--\s*(.*?)\s*-->\s*<iframe.*?src=\"(https:\/\/playmogo\.com\/e\/[a-zA-Z0-9]+)\"/g;
let m;

const zanbMap = new Map();
const istanbulMap = new Map();

while ((m = regex.exec(allText)) !== null) {
  const comment = m[1].trim();
  const embedUrl = m[2].trim();

  if (comment.includes('Zanb Insani')) {
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
  } else if (comment.toLowerCase().includes('istanbul rasan') || comment.toLowerCase().includes('alti ustu') || comment.toLowerCase().includes('altı üstü')) {
    const epMatch = comment.match(/E(\d+)/i);
    if (epMatch) {
      const num = parseInt(epMatch[1], 10);
      if (!istanbulMap.has(num)) {
        istanbulMap.set(num, {
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

const zanbEpisodes = Array.from(zanbMap.values()).sort((a, b) => a.episodeNum - b.episodeNum);
const istanbulEpisodes = Array.from(istanbulMap.values()).sort((a, b) => a.episodeNum - b.episodeNum);

console.log(`Zanb Insani total sorted episodes: ${zanbEpisodes.length} (from ${zanbEpisodes[0].episodeNum} to ${zanbEpisodes[zanbEpisodes.length - 1].episodeNum})`);
console.log(`Istanbul Rasan Ala Aqeb total sorted episodes: ${istanbulEpisodes.length} (from ${istanbulEpisodes[0].episodeNum} to ${istanbulEpisodes[istanbulEpisodes.length - 1].episodeNum})`);

const curatedPath = path.join(__dirname, '..', 'public', 'curated_catalog.json');
const catalogPath = path.join(__dirname, '..', 'public', 'catalog.json');
const catalogJsPath = path.join(__dirname, '..', 'public', 'catalog.js');

let catalog = JSON.parse(fs.readFileSync(curatedPath, 'utf8'));

// 1. Zanb Insani (All 24 episodes)
const zanbItem = {
  id: 'series-zanb-insani-s01',
  title: 'مسلسل ذنب إنساني (İnsanlık Suçu) - الموسم الأول',
  originalTitle: 'İnsanlık Suçu S01',
  type: 'series',
  category: 'series',
  duration: `${zanbEpisodes.length} حلقة كاملة`,
  genre: 'جريمة • دراما • إثارة وتشويق تركي',
  subGenre: 'drama',
  badge: 'الموسم كامل 24 حلقة',
  quality: 'HD 720p',
  year: '2018',
  rating: '8.3',
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

// 2. Istanbul Rasan Ala Aqeb
const istanbulItem = {
  id: 'series-istanbul-rasan-ala-aqeb-s01',
  title: 'مسلسل إسطنبول رأساً على عقب (Altı Üstü İstanbul) - الموسم الأول',
  originalTitle: 'Altı Üstü İstanbul S01',
  type: 'series',
  category: 'series',
  duration: `${istanbulEpisodes.length} حلقات مضافة`,
  genre: 'دراما • كوميديا • رومانسي • تشويق تركي',
  subGenre: 'drama',
  badge: 'مضاف حديثاً',
  quality: 'HD 720p',
  year: '2024',
  rating: '8.1',
  origin: 'turkish',
  embedUrl: istanbulEpisodes[0].embedUrl,
  streamUrl: istanbulEpisodes[0].streamUrl,
  customWidth: 600,
  customHeight: 480,
  poster: '/posters/series-istanbul-rasan-ala-aqeb-s01.jpg',
  backdrop: '/backdrops/series-istanbul-rasan-ala-aqeb-s01.jpg',
  overview: 'تدور أحداث مسلسل إسطنبول رأساً على عقب (Altı Üstü İstanbul) حول كفاح الشاب أمير وأصدقائه في أحد أحياء الضواحي، حيث يواجهون صراعات المال والسلطة والخيانة أثناء سعيهم لتحقيق أحلامهم، وتتغير مصائرهم وسط شوارع إسطنبول المعقدة.',
  actors: ['طاقم عمل ATV التركية'],
  episodesCount: istanbulEpisodes.length,
  episodes: istanbulEpisodes
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

upsert(zanbItem);
upsert(istanbulItem);

fs.writeFileSync(curatedPath, JSON.stringify(catalog, null, 2), 'utf8');
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
fs.writeFileSync(catalogJsPath, 'window.CURATED_CATALOG = ' + JSON.stringify(catalog, null, 2) + ';', 'utf8');

console.log(`Successfully synced ${catalog.length} items to all catalog files.`);
