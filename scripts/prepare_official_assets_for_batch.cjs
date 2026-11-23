const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');

const seriesAssets = [
  {
    id: 'series-ihtimal-hob-s01',
    name: 'احتمال حب',
    url: 'https://media.elcinema.com/uploads/_315x420__3d1216a41b3f3dfd07a69df7a1cc64900fe14f7659285987a4e783f564c96c97.jpg'
  },
  {
    id: 'series-sharab-al-toot-s04',
    name: 'شراب التوت الموسم 4',
    url: 'https://static.tvmaze.com/uploads/images/original_untouched/596/1490153.jpg'
  },
  {
    id: 'series-zanb-insani-s01',
    name: 'ذنب إنساني',
    url: 'https://static.tvmaze.com/uploads/images/original_untouched/151/378529.jpg'
  },
  {
    id: 'series-istanbul-rasan-ala-aqeb-s01',
    name: 'إسطنبول رأساً على عقب',
    url: 'https://static.tvmaze.com/uploads/images/original_untouched/632/1580141.jpg'
  },
  {
    id: 'series-sabea-ashar-s01',
    name: 'السابع عشر',
    url: 'https://static.tvmaze.com/uploads/images/original_untouched/625/1564216.jpg'
  }
];

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
    https.get(url, { headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed with status ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function main() {
  for (const s of seriesAssets) {
    try {
      console.log(`Downloading authentic poster for ${s.name} (${s.id})...`);
      const buf = await downloadBuffer(s.url);
      
      const posterPath = path.join(__dirname, '..', 'public', 'posters', `${s.id}.jpg`);
      await sharp(buf)
        .resize(600, 900, { fit: 'cover' })
        .jpeg({ quality: 90 })
        .toFile(posterPath);
      console.log(`Saved poster: ${posterPath}`);

      const backdropPath = path.join(__dirname, '..', 'public', 'backdrops', `${s.id}.jpg`);
      await sharp(buf)
        .resize(1280, 720, { fit: 'cover' })
        .jpeg({ quality: 85 })
        .toFile(backdropPath);
      console.log(`Saved backdrop: ${backdropPath}`);
    } catch (err) {
      console.error(`Error processing ${s.id}:`, err.message);
    }
  }
}

main();
