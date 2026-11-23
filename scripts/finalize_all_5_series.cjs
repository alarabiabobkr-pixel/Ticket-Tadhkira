const fs = require('fs');
const path = require('path');

const part1 = fs.readFileSync(path.join(__dirname, 'batch_part1.txt'), 'utf8');
const part2 = fs.readFileSync(path.join(__dirname, 'batch_sharab_part2.txt'), 'utf8');
const part3 = fs.readFileSync(path.join(__dirname, 'batch_part3.txt'), 'utf8');
const part4 = fs.readFileSync(path.join(__dirname, 'batch_part4.txt'), 'utf8');
const part5 = fs.readFileSync(path.join(__dirname, 'batch_part5.txt'), 'utf8');
const allText = [part1, part2, part3, part4, part5].join('\n');

const regex = /<!--\s*(.*?)\s*-->\s*<iframe.*?src=\"(https:\/\/playmogo\.com\/e\/[a-zA-Z0-9]+)\"/g;
let m;

const ihtimalMap = new Map();
const sharabMap = new Map();
const zanbMap = new Map();
const istanbulMap = new Map();
const sabeaMap = new Map();

while ((m = regex.exec(allText)) !== null) {
  const comment = m[1].trim();
  const embedUrl = m[2].trim();

  // 1. Ihtimal Hob
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

  // 2. Sharab Al Toot / Kizilcik Serbeti S04
  else if (comment.includes('Sharab Al Toot') || comment.includes('Kizilcik Serbeti')) {
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

  // 3. Zanb Insani
  else if (comment.includes('Zanb Insani')) {
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

  // 4. Istanbul Rasan Ala Aqeb
  else if (comment.toLowerCase().includes('istanbul rasan') || comment.toLowerCase().includes('alti ustu') || comment.toLowerCase().includes('altı üstü') || comment.toLowerCase().includes('alt c4 b1')) {
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

  // 5. Sabea Ashar / Daha 17
  else if (comment.toLowerCase().includes('sabea ashar') || comment.toLowerCase().includes('daha 17')) {
    const epMatch = comment.match(/E(\d+)/i);
    if (epMatch) {
      const num = parseInt(epMatch[1], 10);
      if (!sabeaMap.has(num)) {
        sabeaMap.set(num, {
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
const sharabEpisodes = Array.from(sharabMap.values()).sort((a, b) => a.episodeNum - b.episodeNum);
const zanbEpisodes = Array.from(zanbMap.values()).sort((a, b) => a.episodeNum - b.episodeNum);
const istanbulEpisodes = Array.from(istanbulMap.values()).sort((a, b) => a.episodeNum - b.episodeNum);
const sabeaEpisodes = Array.from(sabeaMap.values()).sort((a, b) => a.episodeNum - b.episodeNum);

console.log('--- FINAL EPISODE COUNTS ---');
console.log(`1. Ihtimal Hob: ${ihtimalEpisodes.length} eps (min: ${ihtimalEpisodes[0].episodeNum}, max: ${ihtimalEpisodes[ihtimalEpisodes.length - 1].episodeNum})`);
console.log(`2. Sharab Al Toot S04: ${sharabEpisodes.length} eps (min: ${sharabEpisodes[0].episodeNum}, max: ${sharabEpisodes[sharabEpisodes.length - 1].episodeNum})`);
console.log(`3. Zanb Insani: ${zanbEpisodes.length} eps (min: ${zanbEpisodes[0].episodeNum}, max: ${zanbEpisodes[zanbEpisodes.length - 1].episodeNum})`);
console.log(`4. Istanbul Rasan Ala Aqeb: ${istanbulEpisodes.length} eps (min: ${istanbulEpisodes[0].episodeNum}, max: ${istanbulEpisodes[istanbulEpisodes.length - 1].episodeNum})`);
console.log(`5. Sabea Ashar (Daha 17): ${sabeaEpisodes.length} eps (min: ${sabeaEpisodes[0].episodeNum}, max: ${sabeaEpisodes[sabeaEpisodes.length - 1].episodeNum})`);

const seriesList = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
    id: 'series-istanbul-rasan-ala-aqeb-s01',
    title: 'مسلسل إسطنبول رأساً على عقب (Altı Üstü İstanbul) - الموسم الأول',
    originalTitle: 'Altı Üstü İstanbul S01',
    type: 'series',
    category: 'series',
    duration: `${istanbulEpisodes.length} حلقة كاملة`,
    genre: 'دراما • كوميديا • رومانسي • تشويق تركي',
    subGenre: 'drama',
    badge: 'الموسم كامل 17 حلقة',
    quality: 'HD 720p',
    year: '2024',
    rating: '8.2',
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
  },
  {
    id: 'series-sabea-ashar-s01',
    title: 'مسلسل السابع عشر (Daha 17) - الموسم الأول',
    originalTitle: 'Daha 17 S01',
    type: 'series',
    category: 'series',
    duration: `${sabeaEpisodes.length} حلقة كاملة`,
    genre: 'دراما • غموض • إثارة وتشويق تركي',
    subGenre: 'drama',
    badge: 'الموسم كامل 21 حلقة',
    quality: 'HD 720p',
    year: '2024',
    rating: '8.3',
    origin: 'turkish',
    embedUrl: sabeaEpisodes[0].embedUrl,
    streamUrl: sabeaEpisodes[0].streamUrl,
    customWidth: 600,
    customHeight: 480,
    poster: '/posters/series-sabea-ashar-s01.jpg',
    backdrop: '/backdrops/series-sabea-ashar-s01.jpg',
    overview: 'تدور أحداث مسلسل السابع عشر (Daha 17) حول أراس، الشاب الشجاع البالغ من العمر 17 عاماً الذي قضى حياته في دور الرعاية، ليكتشف فجأة أن شقيقه الذي اعتقد أنه مات منذ سنوات لا يزال حياً، فينطلق في رحلة غامضة ومليئة بالمواجهات والأسرار من إسطنبول إلى بودروم لتعقبه.',
    actors: ['طاقم دراما Kanal D التركية'],
    episodesCount: sabeaEpisodes.length,
    episodes: sabeaEpisodes
  }
];

const curatedPath = path.join(__dirname, '..', 'public', 'curated_catalog.json');
const catalogPath = path.join(__dirname, '..', 'public', 'catalog.json');
const catalogJsPath = path.join(__dirname, '..', 'public', 'catalog.js');

let catalog = JSON.parse(fs.readFileSync(curatedPath, 'utf8'));

for (const item of seriesList) {
  const idx = catalog.findIndex(c => c.id === item.id);
  if (idx !== -1) {
    catalog[idx] = item;
    console.log(`Updated item: ${item.id} (${item.title}) with ${item.episodesCount} episodes`);
  } else {
    catalog.unshift(item);
    console.log(`Added new item: ${item.id} (${item.title}) with ${item.episodesCount} episodes`);
  }
}

fs.writeFileSync(curatedPath, JSON.stringify(catalog, null, 2), 'utf8');
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
fs.writeFileSync(catalogJsPath, 'window.CURATED_CATALOG = ' + JSON.stringify(catalog, null, 2) + ';', 'utf8');

console.log(`Successfully synced ${catalog.length} items to all 3 catalog files!`);
