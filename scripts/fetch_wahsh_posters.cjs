const https = require('https');
const sharp = require('sharp');
const fs = require('fs');

function fetchText(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', () => resolve(''));
  });
}

function downloadBinary(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', () => resolve(null));
  });
}

async function run() {
  const html1 = await fetchText('https://elcinema.com/work/2088824/');
  const matches1 = html1.match(/https:\/\/media\.elcinema\.com\/uploads\/[^\s\"\'\>]+\.jpg/g);
  console.log('Elcinema 2088824 matches:', matches1 ? matches1.slice(0, 3) : 'none');

  const html2 = await fetchText('https://elcinema.com/work/2096739/');
  const matches2 = html2.match(/https:\/\/media\.elcinema\.com\/uploads\/[^\s\"\'\>]+\.jpg/g);
  console.log('Elcinema 2096739 matches:', matches2 ? matches2.slice(0, 3) : 'none');

  if (matches1 && matches1[0]) {
    const buf = await downloadBinary(matches1[0]);
    if (buf && buf.length > 1000) {
      const p1 = await sharp(buf).resize(300, 450, { fit: 'cover' }).jpeg({ quality: 82 }).toBuffer();
      const b1 = await sharp(buf).resize(800, 450, { fit: 'cover' }).jpeg({ quality: 82 }).toBuffer();
      fs.writeFileSync('public/posters/movie-doodstream-l33ht4v5q4d1.jpg', p1);
      fs.writeFileSync('public/backdrops/movie-doodstream-l33ht4v5q4d1.jpg', b1);
      console.log('Successfully saved official poster for Wahsh Hawalli!');
    }
  }

  if (matches2 && matches2[0]) {
    const buf = await downloadBinary(matches2[0]);
    if (buf && buf.length > 1000) {
      const p2 = await sharp(buf).resize(300, 450, { fit: 'cover' }).jpeg({ quality: 82 }).toBuffer();
      const b2 = await sharp(buf).resize(800, 450, { fit: 'cover' }).jpeg({ quality: 82 }).toBuffer();
      fs.writeFileSync('public/posters/movie-doodstream-r1s8cb1dv1hf.jpg', p2);
      fs.writeFileSync('public/backdrops/movie-doodstream-r1s8cb1dv1hf.jpg', b2);
      console.log('Successfully saved official poster for Wahsh El Bonook!');
    }
  }
}

run();
