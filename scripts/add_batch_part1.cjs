const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, 'batch_part1.txt'), 'utf8');

const regex = /<!--\s*(.*?)\s*-->\s*<iframe.*?src=\"(https:\/\/playmogo\.com\/e\/[a-zA-Z0-9]+)\"/g;

let m;
const ihtimalEpisodes = [];
const sharabEpisodes = [];

while ((m = regex.exec(raw)) !== null) {
  const comment = m[1].trim();
  const embedUrl = m[2].trim();

  if (comment.includes('Ihtimal Hob')) {
    const epMatch = comment.match(/E(\d+)/i);
    const epNum = epMatch ? parseInt(epMatch[1], 10) : ihtimalEpisodes.length + 1;
    ihtimalEpisodes.push({
      episodeNum: epNum,
      title: `الحلقة ${epNum}`,
      embedUrl,
      streamUrl: embedUrl,
      customWidth: 600,
      customHeight: 480
    });
  } else if (comment.includes('Sharab Al Toot')) {
    const epMatch = comment.match(/E(\d+)/i);
    const epNum = epMatch ? parseInt(epMatch[1], 10) : sharabEpisodes.length + 1;
    sharabEpisodes.push({
      episodeNum: epNum,
      title: `الحلقة ${epNum}`,
      embedUrl,
      streamUrl: embedUrl,
      customWidth: 600,
      customHeight: 480
    });
  }
}

// Sort episodes ascending
ihtimalEpisodes.sort((a, b) => a.episodeNum - b.episodeNum);
sharabEpisodes.sort((a, b) => a.episodeNum - b.episodeNum);

console.log(`Parsed ${ihtimalEpisodes.length} episodes for Ihtimal Hob (from ${ihtimalEpisodes[0].episodeNum} to ${ihtimalEpisodes[ihtimalEpisodes.length - 1].episodeNum})`);
console.log(`Parsed ${sharabEpisodes.length} episodes for Sharab Al Toot S04`);

const newItems = [];

if (ihtimalEpisodes.length > 0) {
  newItems.push({
    id: 'series-ihtimal-hob-s01',
    title: 'مسلسل احتمال حب (Muhtemel Aşk) - الموسم الأول',
    originalTitle: 'Muhtemel Aşk S01',
    type: 'series',
    category: 'series',
    duration: `${ihtimalEpisodes.length} حلقة`,
    genre: 'رومانسي • دراما • تشويق تركي',
    subGenre: 'romance',
    badge: 'مضاف حديثاً',
    quality: 'HD 720p',
    year: '2024',
    rating: '8.2',
    origin: 'turkish',
    embedUrl: ihtimalEpisodes[0].embedUrl,
    streamUrl: ihtimalEpisodes[0].streamUrl,
    customWidth: 600,
    customHeight: 480,
    poster: '/posters/series-ihtimal-hob-s01.jpg',
    backdrop: '/backdrops/series-ihtimal-hob-s01.jpg',
    overview: 'تدور أحداث مسلسل احتمال حب حول قصة عشق مليئة بالصراعات والغموض، حيث تتشابك خيوط الماضي مع صراعات الحاضر بين عائلتين تتنازعان على النفوذ والحب الحقيقي.',
    actors: ['طاقم الدراما التركية'],
    episodesCount: ihtimalEpisodes.length,
    episodes: ihtimalEpisodes
  });
}

if (sharabEpisodes.length > 0) {
  newItems.push({
    id: 'series-sharab-al-toot-s04',
    title: 'مسلسل شراب التوت (Kızılcık Şerbeti) - الموسم الرابع',
    originalTitle: 'Kızılcık Şerbeti S04',
    type: 'series',
    category: 'series',
    duration: `${sharabEpisodes.length} حلقات مضافة`,
    genre: 'دراما اجتماعية • عائلي • تشويق تركي',
    subGenre: 'drama',
    badge: 'الموسم 4',
    quality: 'HD 720p',
    year: '2024',
    rating: '8.6',
    origin: 'turkish',
    embedUrl: sharabEpisodes[0].embedUrl,
    streamUrl: sharabEpisodes[0].streamUrl,
    customWidth: 600,
    customHeight: 480,
    poster: '/posters/series-sharab-al-toot-s04.jpg',
    backdrop: '/backdrops/series-sharab-al-toot-s04.jpg',
    overview: 'في الموسم الرابع من دراما شراب التوت (Kızılcık Şerbeti)، تتصاعد الصراعات الاجتماعية والفكرية بين العائلتين مع ظهور أسرار ومفاجآت جديدة تعصف بعلاقات الأبطال وتغير مسار الأحداث بالكامل.',
    actors: ['باريش كيليتش', 'إفريم ألاسيا', 'سيلا توركوغلو'],
    episodesCount: sharabEpisodes.length,
    episodes: sharabEpisodes
  });
}

// Update curated_catalog.json, catalog.json, and catalog.js
const curatedPath = path.join(__dirname, '..', 'public', 'curated_catalog.json');
const catalogPath = path.join(__dirname, '..', 'public', 'catalog.json');
const catalogJsPath = path.join(__dirname, '..', 'public', 'catalog.js');

let catalog = JSON.parse(fs.readFileSync(curatedPath, 'utf8'));

for (const item of newItems) {
  const existingIdx = catalog.findIndex(c => c.id === item.id);
  if (existingIdx !== -1) {
    catalog[existingIdx] = item;
    console.log(`Updated existing item: ${item.id}`);
  } else {
    // Add to front or appropriate position
    catalog.unshift(item);
    console.log(`Added new item to catalog: ${item.id}`);
  }
}

// Write back
fs.writeFileSync(curatedPath, JSON.stringify(catalog, null, 2), 'utf8');
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
fs.writeFileSync(catalogJsPath, 'window.CURATED_CATALOG = ' + JSON.stringify(catalog, null, 2) + ';', 'utf8');

console.log(`Saved ${catalog.length} items to all 3 catalog files.`);
