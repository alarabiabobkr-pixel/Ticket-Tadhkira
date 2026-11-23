const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const sharp = require('sharp');

// Explicit custom queries for precision matching
const customOverrides = {
  // Turkish works
  "movie-doodstream-sd4hbec7z78v": "the_last_scene", // Öngörü (2026)
  "movie-doodstream-m8xp2a4q7ohd": "her_sey_yolunda", // Her Şey Yolunda
  "movie-doodstream-06wiyh9sdgte": "her_sey_yolunda",
  "movie-doodstream-6m7mrq25sspy": "yaz_evi", // Yaz Evi (2026)
  "movie-doodstream-7flxta3bfqao": "siccin_7", // Siccin
  "movie-doodstream-5t5m9vd5j8my": "siccin_7",
  "movie-doodstream-932q3dy3t4q4": "siccin_7",
  "movie-doodstream-3idg4jzeoisy": "askin_yuzu", // Aşkın Yüzü
  "movie-doodstream-tb87heen3j9b": "askin_yuzu",
  "movie-doodstream-l4l3fkq67y8p": "uc_harfliler_fal", // Üç Harfliler: Fal
  "movie-doodstream-hgygp6in0avr": "kulyas_lanetin_bedeli", // Kulyas
  "movie-doodstream-9wy14y92mf59": "ona_niyet_sana_kismet", // Ona Niyet Sana Kısmet
  "movie-doodstream-7tk2hxwtsw6d": "ona_niyet_sana_kismet",
  "movie-doodstream-to7psmwd3g2m": "dehset_bey", // Dehşet Bey
  "movie-doodstream-bz4sci6rxti3": "dehset_bey",
  "movie-doodstream-t8f20bfix2e4": "eyvah_tatil", // Eyvah Tatil
  "movie-doodstream-74x8g0k21dcz": "eyvah_tatil",
  "movie-doodstream-oo7hrsb8ww80": "cahim", // Cahim
  "movie-doodstream-vps586vplipg": "kutsal_damacana_5", // Kutsal Damacana 5: Zombi
  "movie-doodstream-2mhnrea2ozlp": "mukadderat", // Mukadderat
  "movie-doodstream-h7dczgyeuq5o": "ask_sadece_bir_an", // الحب لحظة واحدة فقط
  "movie-doodstream-xwha4wreeiyn": "ask_sadece_bir_an",
  "movie-doodstream-0h3swcsztz09": "iki_dunya_bir_dilek", // İki Dünya Bir Dilek
  "movie-doodstream-ewstxv0kaknw": "iki_dunya_bir_dilek",
  "movie-doodstream-kljg76fpcylh": "kul_2024", // Kül (Ashes)
  "movie-doodstream-tkcggkg5pl12": "about_dry_grasses", // About Dry Grasses (Kuru Otlar Üstüne)
  "movie-doodstream-x434k3emgdal": "10_days_of_a_bad_man", // 10 Days of a Bad Man
  "movie-doodstream-i5xwukggsq3w": "10_days_of_a_bad_man",
  "movie-doodstream-ams18ylk3yrd": "lefter_the_story_of_the_ordinarius", // Lefter
  "movie-doodstream-vo4qetuyrrwp": "lefter_the_story_of_the_ordinarius",
  "movie-doodstream-uofgvlf65ohp": "metruk_adam", // Abandoned Man
  "movie-doodstream-q6ea1azcru0u": "metruk_adam",
  "movie-doodstream-an740ybdtpnv": "sampiyonlar", // Şampiyonlar
  "movie-doodstream-riqxkk3mobfo": "sampiyonlar",
  "movie-doodstream-th1h9nz55nc7": "olumlu_dunya_2", // Ölümlü Dünya 2

  // Other items in the 85 list
  "movie-doodstream-j5k844vmkire": "to_make_it_back_home",
  "movie-doodstream-gln3splnuw0n": "aasha_2024",
  "movie-doodstream-rlu5namd07gw": "sugriva",
  "movie-doodstream-eh021zi5senk": "auron_mein_kahan_dum_tha",
  "movie-doodstream-a1oql1n01raj": "aan_paavam_pollathathu",
  "movie-doodstream-dtz5u7azn5uq": "bethlehem_kudumbam",
  "movie-doodstream-ibnn5qas9kur": "reporting_live",
  "movie-doodstream-ggxdo5dv2sxe": "toxic_a_fairy_tale_for_grown_ups",
  "movie-doodstream-5x895xvivu8k": "toxic_a_fairy_tale_for_grown_ups",
  "movie-doodstream-cflgokp71xt1": "agadha",
  "movie-doodstream-19i6ufqk9mza": "agadha",
  "movie-doodstream-37e23rwvut9o": "pooja_meri_jaan",
  "movie-doodstream-cfym1shju5rd": "katukutu_buro",
  "movie-doodstream-ee6xe5s2mjyi": "faces",
  "movie-doodstream-cvu1izjssxsg": "seetharam",
  "movie-doodstream-3wkonsxaneiu": "sardar_2",
  "movie-doodstream-7zyd4vrrcqcp": "vada_chennai",
  "movie-doodstream-53sx7n7cu89z": "the_photographer",
  "movie-doodstream-2x48agfrax1d": "baby_do_die_do",
  "movie-doodstream-0w78fp8m8ivd": "vishwanath_and_sons",
  "movie-doodstream-cev4yjd29fn4": "varavu",
  "movie-doodstream-tf4ryb5bydaw": "magudam",
  "movie-doodstream-5j3jrzmgyz9g": "idhayam_murali",
  "movie-doodstream-tv8mc0207lcn": "the_honest_realtor",
  "movie-doodstream-ihvfd3xlry4f": "the_honest_realtor",
  "movie-doodstream-gslqzi0oly2y": "the_dangers_in_my_heart",
  "movie-doodstream-qean9vliykld": "pani_2024",
  "movie-doodstream-ntvojxqx60qe": "mononoke_the_movie_the_phantom_in_the_rain",
  "movie-doodstream-mhqy7njhl93u": "fight_against_evil",
  "movie-doodstream-l7h8z82vl82v": "salmokji",
  "movie-doodstream-jtc0ob0zzudf": "somebody",
  "movie-doodstream-st37twv11ghy": "colony",
  "movie-doodstream-ozi0ah6n7clu": "sword_art_online_the_movie_ordinal_scale",
  "movie-doodstream-24dekjyuuoni": "husbands_on_strike",
  "movie-doodstream-fv1it99xf17d": "double_happiness",
  "movie-doodstream-clluel60iysc": "ghost_in_the_cell",
  "movie-doodstream-dpp1khedszmc": "the_kings_warden",
  "movie-doodstream-0d9yhac76w6i": "human_resources",
  "movie-doodstream-8yxc9yvjjrm7": "the_world_of_love",
  "movie-doodstream-lev7derm4wsr": "snakes_5",
  "movie-doodstream-leyebocbtjlw": "my_dearest_assassin",
  "movie-doodstream-lu0q8h4k9rsq": "the_witch_part_2_the_other_one",
  "movie-doodstream-sjkqftyaihph": "concrete_market",
  "movie-doodstream-d1dm0iydynd9": "khalifa",
  "movie-doodstream-g6v7ilqt5qi9": "chinna_chinna_aasai",
  "movie-doodstream-bfnqd7jiqajx": "hope_2026",
  "movie-doodstream-u1wyrh5cdmq7": "the_butchers_blade",
  "movie-doodstream-ba1do61ow75k": "abraham_ozler",
  "movie-doodstream-i7ozkjezxoif": "chao",
  "movie-doodstream-a740naufpalq": "bheeshma_parvam",
  "movie-doodstream-0ubbzs6e9s9u": "maharaja_hostel",
  "movie-doodstream-eba5cpchk5mn": "gintama",
  "movie-doodstream-n4jtc4sa44f9": "lust_stories",
  "movie-doodstream-t9kf5q8u1f5y": "janur_ireng"
};

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
    proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }, res => {
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

async function searchImdb(query) {
  if (!query) return null;
  const clean = query.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, '_');
  if (!clean || clean.length < 2) return null;
  const char = clean[0];
  const url = `https://v3.sg.media-imdb.com/suggestion/${char}/${encodeURIComponent(clean)}.json`;
  const res = await fetchJson(url);
  if (res && res.d && res.d.length > 0) {
    const match = res.d.find(x => x.i && x.i.imageUrl && (x.q === 'feature' || x.qid === 'movie' || x.q === 'TV series')) ||
                  res.d.find(x => x.i && x.i.imageUrl);
    if (match && match.i && match.i.imageUrl) {
      return { url: match.i.imageUrl, label: match.l, year: match.y };
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
        return { url: `https://image.tmdb.org/t/p/original/${img}`, label: query };
      }
    }
  } catch (e) {}
  return null;
}

function getSearchQueries(item) {
  const queries = [];
  if (customOverrides[item.id]) {
    queries.push(customOverrides[item.id]);
  }

  const title = item.title || '';
  // Extract English/Latin in parenthesis: (2025) Askin Yuzu
  const paren = title.match(/\((?:19\d\d|20\d\d)\)\s*([A-Za-z0-9\s:_\x27\-]+)/);
  if (paren && paren[1].trim().length >= 2) {
    const cleanEn = paren[1].replace(/مترجم|مدبلج|سيرفر.*|نسخة.*/g, '').trim();
    if (cleanEn.length >= 2) queries.push(cleanEn);
  }

  // Any other Latin words
  const latinMatches = title.match(/[A-Za-z0-9][A-Za-z0-9\s:_\x27\-]{2,}[A-Za-z0-9]/g);
  if (latinMatches) {
    latinMatches.forEach(m => {
      const c = m.replace(/Server|1080p|720p/gi, '').trim();
      if (c.length >= 3 && !/^\d+$/.test(c)) {
        queries.push(c);
      }
    });
  }

  return Array.from(new Set(queries.filter(Boolean)));
}

async function processItem(item, idx, total) {
  const posterFile = path.join('public', item.poster);
  const backdropFile = path.join('public', item.backdrop);

  const queries = getSearchQueries(item);
  let found = null;

  for (const q of queries) {
    found = await searchImdb(q);
    if (found) break;
  }

  if (!found) {
    for (const q of queries) {
      found = await searchTmdb(q);
      if (found) break;
    }
  }

  if (found) {
    let dlUrl = found.url;
    if (dlUrl.includes('media-amazon.com')) {
      dlUrl = dlUrl.replace(/\._V1_.*\./, '._V1_QL80_UX700_.');
    }
    const rawBuf = await downloadBinary(dlUrl);
    if (rawBuf && rawBuf.length > 1000) {
      const posterJpg = await sharp(rawBuf)
        .resize(300, 450, { fit: 'cover', position: 'top' })
        .jpeg({ quality: 84, progressive: true })
        .toBuffer();

      const backdropJpg = await sharp(rawBuf)
        .resize(800, 450, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 84, progressive: true })
        .toBuffer();

      fs.writeFileSync(posterFile, posterJpg);
      fs.writeFileSync(backdropFile, backdropJpg);
      console.log(`[${idx+1}/${total}] SUCCESS: ${item.title} -> saved official poster (${posterJpg.length}B) from ${found.label || 'online'}`);
      return true;
    }
  }

  console.warn(`[${idx+1}/${total}] FAILED: ${item.title} | queries: ${queries.join(', ')}`);
  return false;
}

async function main() {
  const cat = JSON.parse(fs.readFileSync('public/curated_catalog.json', 'utf8'));
  const suspects = [];

  for (const item of cat) {
    const p = path.join('public', item.poster);
    if (!fs.existsSync(p)) {
      suspects.push(item);
      continue;
    }
    const meta = await sharp(p).metadata();
    const sz = fs.statSync(p).size;
    if (meta.width === 600 && meta.height === 900 && sz >= 34000 && sz <= 37000) {
      suspects.push(item);
    }
  }

  console.log(`Starting replacement of ${suspects.length} synthetic posters with authentic official posters...`);

  let succeeded = 0;
  for (let i = 0; i < suspects.length; i++) {
    const ok = await processItem(suspects[i], i, suspects.length);
    if (ok) succeeded++;
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\nReplacement Finished! ${succeeded}/${suspects.length} successfully updated.`);

  // Sync catalog files
  fs.writeFileSync('public/curated_catalog.json', JSON.stringify(cat, null, 2));
  fs.writeFileSync('public/catalog.json', JSON.stringify(cat, null, 2));
  fs.writeFileSync('public/catalog.js', `window.CURATED_CATALOG = ${JSON.stringify(cat, null, 2)};\n`);
  console.log('Catalog files synchronized.');
}

main().catch(console.error);
