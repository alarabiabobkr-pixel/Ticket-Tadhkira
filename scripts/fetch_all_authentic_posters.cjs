const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const sharp = require('sharp');

// 1. Gather all mapping sources
const codeMap = new Map();

function cleanRaw(raw) {
  if (!raw) return null;
  let t = raw
    .replace(/1080p|720p|480p|2160p|4k/gi, '')
    .replace(/bluray|web-dl|web|hdrip|dvdrip|cam|akwam|us|nf|amzn/gi, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/extended cut/gi, '')
    .replace(/arabic/gi, '')
    .trim();
  let year = '';
  const yMatch = t.match(/\b(19\d\d|20\d\d)\b/);
  if (yMatch) year = yMatch[1];
  t = t.replace(/\b(19\d\d|20\d\d)\b/g, '').replace(/[-_.]+/g, ' ').replace(/\s+/g, ' ').trim();
  return { title: t, year };
}

function parseScriptFiles() {
  const files = [
    'scripts/check_user_movies.cjs',
    'scripts/add_mogo_movies.cjs',
    'scripts/add_batch_movies.cjs',
    'scripts/process_user_new_animation_batch.cjs'
  ];

  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const content = fs.readFileSync(f, 'utf8');
    for (const m of content.matchAll(/rawTitle:\s*["\x27]([^"\x27]+)["\x27][\s\S]*?(?:code|url):\s*["\x27](?:https:\/\/playmogo\.com\/e\/)?([a-zA-Z0-9]+)["\x27]/g)) {
      if (!codeMap.has(m[2])) codeMap.set(m[2], cleanRaw(m[1]));
    }
    for (const m of content.matchAll(/(?:code|url):\s*["\x27](?:https:\/\/playmogo\.com\/e\/)?([a-zA-Z0-9]+)["\x27][\s\S]*?rawTitle:\s*["\x27]([^"\x27]+)["\x27]/g)) {
      if (!codeMap.has(m[1])) codeMap.set(m[1], cleanRaw(m[2]));
    }
  }

  if (fs.existsSync('scripts/raw_batch_new.txt')) {
    const raw = fs.readFileSync('scripts/raw_batch_new.txt', 'utf8');
    for (const m of raw.matchAll(/<!--\s*([^-]+?)\s*-->\s*<iframe[^>]*?\/e\/([a-zA-Z0-9]+)/g)) {
      if (!codeMap.has(m[2])) codeMap.set(m[2], cleanRaw(m[1]));
    }
  }
}

parseScriptFiles();
console.log(`Loaded ${codeMap.size} script mappings.`);

// 2. HTTP Helpers
function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch (e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

function fetchText(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', () => resolve(''));
  });
}

function downloadBinary(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          const u = new URL(url);
          redirectUrl = u.origin + redirectUrl;
        }
        return downloadBinary(redirectUrl).then(resolve);
      }
      if (res.statusCode !== 200) return resolve(null);
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', () => resolve(null));
  });
}

// 3. Search Providers
async function searchImdb(query) {
  if (!query) return null;
  const clean = query.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, '_');
  if (!clean || clean.length < 2) return null;
  const char = clean[0];
  const url = `https://v3.sg.media-imdb.com/suggestion/${char}/${encodeURIComponent(clean)}.json`;
  const res = await fetchJson(url);
  if (res && res.d && res.d.length > 0) {
    const match = res.d.find(x => x.i && x.i.imageUrl && (x.q === 'feature' || x.qid === 'movie')) ||
                  res.d.find(x => x.i && x.i.imageUrl);
    if (match && match.i && match.i.imageUrl) {
      return match.i.imageUrl;
    }
  }
  return null;
}

async function searchTmdb(query) {
  if (!query) return null;
  try {
    const url = `https://www.themoviedb.org/search?query=${encodeURIComponent(query)}`;
    const html = await fetchText(url);
    const matches = Array.from(html.matchAll(/https:\/\/(?:media|image)\.themoviedb\.org\/t\/p\/[^\/]+\/([a-zA-Z0-9_\-]+\.jpg)/g));
    for (const m of matches) {
      const img = m[1];
      if (img && !img.includes('logo') && !img.includes('avatar') && img.length > 8) {
        return `https://image.tmdb.org/t/p/w500/${img}`;
      }
    }
  } catch (e) {}
  return null;
}

// Extract search queries for a movie
function getCandidateQueries(item) {
  const queries = [];
  const code = item.id.replace('movie-doodstream-', '').replace('movie-playmogo-', '');
  
  if (codeMap.has(code)) {
    const raw = codeMap.get(code);
    if (raw.title) {
      if (raw.year) queries.push(`${raw.title} ${raw.year}`);
      queries.push(raw.title);
    }
  }

  const title = item.title || '';

  // Match English inside parenthesis
  const paren = title.match(/\((?:19\d\d|20\d\d)\)\s*([A-Za-z0-9\s:_\x27\-]+)/);
  if (paren && paren[1].trim().length >= 2) {
    const cleanEn = paren[1].trim();
    if (item.year) queries.push(`${cleanEn} ${item.year}`);
    queries.push(cleanEn);
  }

  // Match Latin segments
  const latinMatches = title.match(/[A-Za-z0-9][A-Za-z0-9\s:_\x27\-]{2,}[A-Za-z0-9]/g);
  if (latinMatches) {
    latinMatches.forEach(m => {
      const c = m.trim();
      if (c.length >= 3 && !/^\d+$/.test(c)) {
        queries.push(c);
      }
    });
  }

  // Actors if English
  if (item.actors && Array.isArray(item.actors)) {
    item.actors.forEach(a => {
      if (a && /[A-Za-z]/.test(a) && a.length >= 3 && a !== 'طاقم عمل عالمي') {
        queries.push(a.trim());
      }
    });
  }

  // Arabic title
  const cleanAr = title
    .replace(/^فيلم\s+/i, '')
    .replace(/\s+مترجم.*$/i, '')
    .replace(/\s+مدبلج.*$/i, '')
    .replace(/\s*\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .trim();
  if (cleanAr && cleanAr.length >= 2) {
    if (item.year) queries.push(`${cleanAr} ${item.year}`);
    queries.push(cleanAr);
  }

  return Array.from(new Set(queries.filter(Boolean)));
}

async function processMovie(item, idx, total) {
  const posterFile = `public${item.poster}`;
  const backdropFile = `public${item.backdrop}`;

  const queries = getCandidateQueries(item);
  let foundUrl = null;

  // 1. Try IMDb
  for (const q of queries) {
    foundUrl = await searchImdb(q);
    if (foundUrl) break;
  }

  // 2. Try TMDB if not found on IMDb
  if (!foundUrl) {
    for (const q of queries) {
      foundUrl = await searchTmdb(q);
      if (foundUrl) break;
    }
  }

  if (foundUrl) {
    try {
      let downloadUrl = foundUrl;
      if (foundUrl.includes('media-amazon.com')) {
        downloadUrl = foundUrl.replace(/\._V1_.*\./, '._V1_QL75_UX600_.');
      }
      const rawBuf = await downloadBinary(downloadUrl);
      if (rawBuf && rawBuf.length > 1000) {
        const posterJpg = await sharp(rawBuf)
          .resize(300, 450, { fit: 'cover', position: 'top' })
          .jpeg({ quality: 82, progressive: true })
          .toBuffer();

        const backdropJpg = await sharp(rawBuf)
          .resize(800, 450, { fit: 'cover', position: 'center' })
          .jpeg({ quality: 82, progressive: true })
          .toBuffer();

        fs.writeFileSync(posterFile, posterJpg);
        fs.writeFileSync(backdropFile, backdropJpg);
        console.log(`[${idx + 1}/${total}] SUCCESS: ${item.title} -> saved official poster (${posterJpg.length} B)`);
        return true;
      }
    } catch (e) {
      console.warn(`[${idx + 1}/${total}] Error processing ${item.title}: ${e.message}`);
    }
  } else {
    console.log(`[${idx + 1}/${total}] Not found on IMDb/TMDB: ${queries.slice(0, 3).join(' | ')}`);
  }
  return false;
}

async function run() {
  const cat = JSON.parse(fs.readFileSync('public/catalog.json', 'utf8'));
  console.log(`Processing ${cat.length} movies to download authentic official theatrical posters...`);

  let successCount = 0;
  const BATCH_SIZE = 5;

  for (let i = 0; i < cat.length; i += BATCH_SIZE) {
    const chunk = cat.slice(i, i + BATCH_SIZE);
    const promises = chunk.map((item, relIdx) => processMovie(item, i + relIdx, cat.length));
    const results = await Promise.all(promises);
    successCount += results.filter(Boolean).length;
    await new Promise(r => setTimeout(r, 120));
  }

  console.log(`\nALL DONE! Successfully fetched & saved official posters for ${successCount}/${cat.length} movies.`);
}

run().catch(console.error);
