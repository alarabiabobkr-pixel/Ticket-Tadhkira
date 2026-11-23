const fs = require('fs');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { execSync } = require('child_process');

const catalog = JSON.parse(fs.readFileSync('public/curated_catalog.json', 'utf8'));

// Function to download image from URL to file
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      const mod = parsedUrl.protocol === 'https:' ? https : http;
      const req = mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }, timeout: 15000 }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return resolve(false);
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            const stats = fs.statSync(dest);
            if (stats.size > 1000) {
              resolve(true);
            } else {
              fs.unlinkSync(dest);
              resolve(false);
            }
          });
        });
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
    } catch(e) {
      resolve(false);
    }
  });
}

// Search IMDb suggestion API
function searchIMDb(query) {
  return new Promise(resolve => {
    const clean = query.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '');
    if (!clean) return resolve(null);
    const first = clean[0] || 'a';
    const url = `https://v3.sg.media-imdb.com/suggestion/${first}/${encodeURIComponent(clean)}.json`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(b);
          const results = (j.d || []).filter(x => x.id && x.id.startsWith('tt') && x.i && x.i.imageUrl);
          if (results.length > 0) {
            resolve(results[0].i.imageUrl);
          } else {
            resolve(null);
          }
        } catch(e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

// Search Wikipedia API for Arabic poster
function searchWikipedia(query) {
  return new Promise(resolve => {
    https.get('https://ar.wikipedia.org/w/api.php?action=opensearch&search=' + encodeURIComponent(query) + '&limit=4&format=json', {
      headers: { 'User-Agent': 'TadhkiraMovieBot/1.0' }, timeout: 8000
    }, res => {
      let b = ''; res.on('data', c => b += c); res.on('end', () => {
        try {
          const j = JSON.parse(b);
          const titles = j[1] || [];
          const matched = titles.find(t => t.includes('فلم') || t.includes('فيلم') || t.includes(query)) || titles[0];
          if (!matched) return resolve(null);

          https.get('https://ar.wikipedia.org/w/api.php?action=query&format=json&prop=images&titles=' + encodeURIComponent(matched), {
            headers: { 'User-Agent': 'TadhkiraMovieBot/1.0' }, timeout: 8000
          }, res2 => {
            let b2 = ''; res2.on('data', c2 => b2 += c2); res2.on('end', () => {
              try {
                const j2 = JSON.parse(b2);
                const pid = Object.keys(j2.query.pages)[0];
                const imgs = j2.query.pages[pid].images || [];
                const posterFile = imgs.find(img => img.title.toLowerCase().includes('poster') || img.title.toLowerCase().includes('بوستر') || (img.title.endsWith('.jpg') && !img.title.includes('Flag') && !img.title.includes('Twemoji') && !img.title.includes('Cinema') && !img.title.includes('Egyptfilm')));
                if (!posterFile) return resolve(null);

                https.get('https://ar.wikipedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=' + encodeURIComponent(posterFile.title), {
                  headers: { 'User-Agent': 'TadhkiraMovieBot/1.0' }, timeout: 8000
                }, res3 => {
                  let b3 = ''; res3.on('data', c3 => b3 += c3); res3.on('end', () => {
                    try {
                      const j3 = JSON.parse(b3);
                      const fpid = Object.keys(j3.query.pages)[0];
                      resolve(j3.query.pages[fpid].imageinfo[0].url);
                    } catch(e) { resolve(null); }
                  });
                }).on('error', () => resolve(null));
              } catch(e) { resolve(null); }
            });
          }).on('error', () => resolve(null));
        } catch(e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

// Extract search queries from title
function extractSearchTerms(item) {
  const terms = [];
  const title = item.title;

  // Extract English title inside parentheses e.g. (2024) Attack on Titan
  const engMatch = title.match(/\(([0-9]{4})\)\s*([a-zA-Z0-9\s:,'’\-_]+)/);
  if (engMatch && engMatch[2]) {
    const cleanEng = engMatch[2].replace(/مترجم|مدبلج|سيرفر|نسخة|فائقة|الدقة|1080p|720p/gi, '').trim();
    if (cleanEng.length > 2) terms.push(cleanEng);
  }

  // Any English words in title
  const pureEng = title.match(/[a-zA-Z][a-zA-Z0-9\s:,'’\-_]{3,}/g);
  if (pureEng) {
    pureEng.forEach(w => {
      const c = w.replace(/Server|FHD|WEB|DL|BluRay/gi, '').trim();
      if (c.length > 3 && !terms.includes(c)) terms.push(c);
    });
  }

  // Arabic clean title
  const arabicClean = title.replace(/^فيلم\s+/i, '')
                           .replace(/\([0-9]{4}\)/g, '')
                           .replace(/[a-zA-Z0-9\-_:,'’]+/g, '')
                           .replace(/مترجم|مدبلج|للعربية|للفصحى|بالدبلجة|المصرية|سيرفر|نسخة|فائقة|الدقة|كامل/g, '')
                           .trim();
  if (arabicClean.length > 2) terms.push(arabicClean);

  return terms;
}

// Find all items in duplicate groups
const hashes = {};
catalog.forEach(item => {
  const p = 'public' + item.poster;
  if (fs.existsSync(p)) {
    const buf = fs.readFileSync(p);
    const hash = crypto.createHash('md5').update(buf).digest('hex');
    if (!hashes[hash]) hashes[hash] = [];
    hashes[hash].push(item);
  }
});

const itemsToFix = [];
Object.entries(hashes).forEach(([h, list]) => {
  if (list.length > 1) {
    const baseTitles = new Set(list.map(x => x.title.replace(/\s*-\s*سيرفر.*|\s*سيرفر.*|\s*\(Server.*\)|مدبلج.*|بالدبلجة.*/g, '').trim()));
    if (baseTitles.size > 1) {
      // Leave first one if it matches title well, fix the rest
      list.forEach((item, idx) => {
        itemsToFix.push({ item, idx, total: list.length });
      });
    }
  }
});

console.log(`Found ${itemsToFix.length} items needing specific poster resolution.`);

async function main() {
  let resolvedCount = 0;
  for (let i = 0; i < itemsToFix.length; i++) {
    const { item } = itemsToFix[i];
    const terms = extractSearchTerms(item);
    console.log(`[${i+1}/${itemsToFix.length}] Processing: ${item.title}`);
    console.log(`   Search terms:`, terms);

    let foundUrl = null;
    // 1. Try IMDb for English terms
    for (const term of terms) {
      if (/[a-zA-Z]/.test(term)) {
        foundUrl = await searchIMDb(term);
        if (foundUrl) {
          console.log(`   Found via IMDb: ${foundUrl.slice(0, 70)}...`);
          break;
        }
      }
    }

    // 2. Try Wikipedia for Arabic terms if not found
    if (!foundUrl) {
      for (const term of terms) {
        if (!/[a-zA-Z]/.test(term) && term.length > 2) {
          foundUrl = await searchWikipedia(term);
          if (foundUrl) {
            console.log(`   Found via Wikipedia: ${foundUrl.slice(0, 70)}...`);
            break;
          }
        }
      }
    }

    // 3. Download if found
    if (foundUrl) {
      const destPath = 'public' + item.poster;
      const success = await downloadFile(foundUrl, destPath);
      if (success) {
        console.log(`   -> Successfully saved genuine poster to ${destPath}`);
        resolvedCount++;
      } else {
        console.log(`   -> Download failed for ${destPath}`);
      }
    } else {
      console.log(`   -> No direct online poster found via basic query.`);
    }

    // Small delay to be respectful
    await new Promise(r => setTimeout(r, 120));
  }

  console.log(`\nMain run completed: ${resolvedCount}/${itemsToFix.length} directly resolved.`);
}

main();
