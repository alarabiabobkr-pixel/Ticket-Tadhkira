const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const cat = JSON.parse(fs.readFileSync('public/curated_catalog.json', 'utf8'));

const customQueries = {
  "movie-doodstream-trbxtyjdygwc": "small_town_hero",
  "movie-doodstream-22va9opkvp5m": "the_babysitter_must_die",
  "movie-doodstream-wx9j3m6j9x12": "sikandar",
  "movie-doodstream-pynx5ylt7zfu": "constantine",
  "movie-doodstream-r8xsxqgu0kr2": "constantine",
  "movie-doodstream-9c781u848vza": "oh_what_fun",
  "movie-doodstream-u5le3mtpo1rw": "oh_what_fun",
  "movie-doodstream-cr9t4gcdlahv": "dhurandhar",
  "movie-doodstream-429lujuhkzr8": "dhurandhar",
  "movie-doodstream-z5tkeble4yyf": "sikandar",
  "movie-doodstream-3jk0zpwrttn1": "sikandar",
  "movie-doodstream-kqg64cwt2a1r": "one_last_shot",
  "movie-doodstream-fos03ssnew0g": "line_of_fire",
  "movie-doodstream-2hbbp6arewi1": "minecraft",
  "movie-doodstream-90fda5emqz6s": "47_ronin"
};

function getQuery(item) {
  if (customQueries[item.id]) return customQueries[item.id];
  let text = item.title
    .replace(/^فيلم\s+/i, '')
    .replace(/\s+مترجم.*$/i, '')
    .replace(/\s+مدبلج.*$/i, '')
    .replace(/\s+سيرفر\s+\d+/i, '')
    .replace(/\s+النسخة\s+\S+/i, '')
    .replace(/\(\d{4}\)/g, '')
    .replace(/[\u0600-\u06FF]+/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase();
  return text;
}

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, timeout: 8000 }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch(e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

function downloadBinary(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    const req = proto.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          const u = new URL(url);
          redirectUrl = u.origin + redirectUrl;
        }
        file.close();
        try { fs.unlinkSync(destPath); } catch (e) {}
        return downloadBinary(redirectUrl, destPath).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(destPath); } catch (e) {}
        return reject(new Error(`Status ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(true));
      });
    });
    req.on('error', (err) => {
      file.close();
      try { fs.unlinkSync(destPath); } catch (e) {}
      reject(err);
    });
    req.on('timeout', () => {
      req.destroy();
      file.close();
      try { fs.unlinkSync(destPath); } catch (e) {}
      reject(new Error('timeout'));
    });
  });
}

async function run() {
  console.log(`Checking ${cat.length} movies for missing posters...`);
  const missing = cat.filter(m => !fs.existsSync('public' + m.poster));
  console.log(`Found ${missing.length} items missing posters.`);

  let successCount = 0;
  let fallbackCount = 0;

  for (let i = 0; i < missing.length; i++) {
    const item = missing[i];
    const posterPath = path.join('public', item.poster);
    const backdropPath = path.join('public', item.backdrop);

    const q = getQuery(item);
    let downloaded = false;

    if (q && q.length >= 2) {
      const char = q[0];
      const searchUrl = `https://v3.sg.media-imdb.com/suggestion/${char}/${q}.json`;
      const data = await fetchJson(searchUrl);

      if (data && data.d && data.d.length > 0) {
        const match = data.d.find(x => x.i && x.i.imageUrl) || data.d[0];
        if (match && match.i && match.i.imageUrl) {
          const rawImgUrl = match.i.imageUrl;
          // Optimize resolution for mobile and bandwidth saving (~30KB per poster, ~60KB backdrop)
          const optimizedPosterUrl = rawImgUrl.replace(/\._V1_.*\./, '._V1_QL75_UX400_.');
          const optimizedBackdropUrl = rawImgUrl.replace(/\._V1_.*\./, '._V1_QL75_UX800_.');

          try {
            await downloadBinary(optimizedPosterUrl, posterPath);
            await downloadBinary(optimizedBackdropUrl, backdropPath);
            downloaded = true;
            successCount++;
            console.log(`[${i + 1}/${missing.length}] OK: ${item.title} -> ${match.l}`);
          } catch (err) {
            console.warn(`[${i + 1}/${missing.length}] Download error for ${item.title}: ${err.message}`);
          }
        }
      }
    }

    if (!downloaded) {
      // Fallback: Copy from a high quality existing poster so no 404 ever happens
      console.log(`[${i + 1}/${missing.length}] Using fallback for: ${item.title}`);
      const fallbackSrc = 'public/posters/movie-bury-the-devil-2026.jpg';
      if (fs.existsSync(fallbackSrc)) {
        fs.copyFileSync(fallbackSrc, posterPath);
        fs.copyFileSync(fallbackSrc, backdropPath);
        fallbackCount++;
      }
    }

    // Small polite delay
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\nCOMPLETED! Downloaded: ${successCount}, Fallbacks: ${fallbackCount}`);
  
  // Also verify that all catalog files are synchronized
  fs.writeFileSync('public/curated_catalog.json', JSON.stringify(cat, null, 2));
  fs.writeFileSync('public/catalog.json', JSON.stringify(cat, null, 2));
  fs.writeFileSync('public/catalog.js', `window.CURATED_CATALOG = ${JSON.stringify(cat, null, 2)};\n`);
  console.log('Catalog files synchronized.');
}

run().catch(console.error);
