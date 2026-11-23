const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, {
      headers: {
        'User-Agent': 'curl/7.88.1'
      },
      timeout: 10000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          const u = new URL(url);
          redirectUrl = u.origin + redirectUrl;
        }
        return fetchText(redirectUrl).then(resolve, reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function downloadBinary(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    const req = proto.get(url, {
      headers: {
        'User-Agent': 'curl/7.88.1'
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

async function findTmdbImage(query) {
  try {
    const url = `https://www.themoviedb.org/search?query=${encodeURIComponent(query)}`;
    const html = await fetchText(url);
    const matches = Array.from(html.matchAll(/https:\/\/(?:media|image)\.themoviedb\.org\/t\/p\/[^\/]+\/([a-zA-Z0-9_\-]+\.jpg)/g));
    for (const m of matches) {
      const img = m[1];
      if (img && !img.includes('logo') && !img.includes('avatar') && img.length > 10) {
        return img;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

async function main() {
  const cat = JSON.parse(fs.readFileSync('public/catalog.json', 'utf8'));
  console.log(`Checking ${cat.length} catalog items for missing posters...`);

  let downloadedCount = 0;

  for (let i = 0; i < cat.length; i++) {
    const item = cat[i];
    const posterRel = item.poster;
    const backdropRel = item.backdrop;
    if (!posterRel || !posterRel.startsWith('/')) continue;

    const posterPath = path.join('public', posterRel);
    const backdropPath = path.join('public', backdropRel);

    const hasPoster = fs.existsSync(posterPath) && fs.statSync(posterPath).size > 1000;
    const hasBackdrop = fs.existsSync(backdropPath) && fs.statSync(backdropPath).size > 1000;

    if (hasPoster && hasBackdrop) continue;

    const queries = [];
    if (item.actors && item.actors[0] && item.actors[0] !== 'طاقم عمل عالمي') {
      queries.push(item.actors[0]);
    }
    const cleanTitle = item.title
      .replace(/^فيلم\s+/i, '')
      .replace(/\s+مترجم$/i, '')
      .replace(/\s+مدبلج للعربية$/i, '')
      .replace(/\(\d{4}\)/g, '')
      .trim();
    queries.push(cleanTitle);

    let foundImg = null;
    for (const q of queries) {
      if (!q) continue;
      foundImg = await findTmdbImage(q);
      if (foundImg) break;
    }

    if (foundImg) {
      try {
        const posterUrl = `https://image.tmdb.org/t/p/w500/${foundImg}`;
        const backdropUrl = `https://image.tmdb.org/t/p/w1280/${foundImg}`;

        if (!hasPoster) {
          await downloadBinary(posterUrl, posterPath);
        }
        if (!hasBackdrop) {
          await downloadBinary(backdropUrl, backdropPath);
        }
        downloadedCount++;
        console.log(`[${i + 1}/${cat.length}] Downloaded TMDB poster: ${item.title}`);
      } catch (err) {
        console.warn(`[${i + 1}/${cat.length}] Download error for ${item.title}: ${err.message}`);
      }
    } else {
      console.log(`[${i + 1}/${cat.length}] Not found on TMDB: ${queries.join(' | ')}`);
    }

    // Small delay to be polite
    await new Promise(r => setTimeout(r, 150));
  }

  console.log(`Finished. Downloaded ${downloadedCount} posters/backdrops.`);
}

main().catch(console.error);
