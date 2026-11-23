const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Precise English query dictionary for exact IMDb matching
const customQueries = {
  // Attack on Titan
  "movie-doodstream-e7z216dhrpsn": "attack_on_titan",
  // Tad and The Magic Lamp
  "movie-doodstream-bxthv8ja5kav": "tadeo_jones",
  "movie-doodstream-5bayfu2ozcmq": "tadeo_jones",
  // Camphor tree guardian
  "movie-doodstream-rld80ykolk96": "the_camphor_tree_guardian",
  // The Dangers in My Heart
  "movie-doodstream-7nfxrirr1aza": "the_dangers_in_my_heart",
  // Puppy Hotel Transylvania
  "movie-doodstream-6d0s5gj9g9rc": "hotel_transylvania",
  // Sword Art Online Ordinal Scale
  "movie-doodstream-mkvpxhhcjzw3": "sword_art_online_the_movie_ordinal_scale",
  // Coyote vs Acme
  "movie-doodstream-yb3llsa4jnzu": "coyote_vs_acme",
  // Mononoke
  "movie-doodstream-6eay38rvf520": "mononoke",
  "movie-doodstream-wyhol093eurs": "mononoke",
  "movie-doodstream-3iksn1hgof9k": "mononoke",
  // Iron Man Rise of Technovore
  "movie-doodstream-t3cbdnpkhais": "iron_man_rise_of_technovore",
  // Hotel Transylvania movies
  "movie-doodstream-zwb0zbgs90nz": "hotel_transylvania_2",
  "movie-doodstream-cb7wdir3gwzm": "hotel_transylvania_transformania",
  "movie-doodstream-7zlkzy6ueo43": "hotel_transylvania",
  "movie-doodstream-b4a3jl1cacs4": "hotel_transylvania_3_summer_vacation",
  // Swapped
  "movie-doodstream-fy3qtrnny3mr": "swapped",
  "movie-doodstream-009zume2m44d": "swapped",
  // Charlie the Wonderdog
  "movie-doodstream-grnpnxjplgcq": "charlie_the_wonderdog",
  // Hoppers
  "movie-doodstream-ozwamw6qaizz": "hoppers",
  "movie-doodstream-y6ck1fuvqzt3": "hoppers",
  // Toy Story 5
  "movie-doodstream-ixlppqb8lrrf": "toy_story_4",
  // Rebellious
  "movie-doodstream-54urboihw418": "rebellious",
  // Your Letter
  "movie-doodstream-gd3ln0o07e6m": "your_letter",
  // Super Mario Galaxy
  "movie-doodstream-q5p4dbxmn9eo": "the_super_mario_galaxy_movie",
  // Zootopia 2
  "movie-doodstream-8cw1xw7oy52m": "zootopia_2",
  "movie-doodstream-chudys20tehy": "zootopia_2",
  // David
  "movie-doodstream-el3h8ba6af4p": "david",
  // The Missing Lynx
  "movie-doodstream-zlqgehovyuv8": "the_missing_lynx",
  // GOAT
  "movie-doodstream-gt8ylvhiulev": "goat",
  // Aztec Batman
  "movie-doodstream-mszw2rrlbqh7": "aztec_batman_clash_of_empires",
  // Tafiti Across the Desert
  "movie-doodstream-seyjxit0w3w2": "tafiti",
  // Chou Kaguya-hime
  "movie-doodstream-3o108ophs0vw": "kaguya_hime",
  // The Myth of Marakuda
  "movie-doodstream-yq3alr075v4k": "marakuda",
  // Kayara
  "movie-doodstream-atdpec28mj0r": "kayara",
  // Hyakuemu
  "movie-doodstream-f482kcryd1p3": "hyakuemu",
  // The Secret Space Mission
  "movie-doodstream-i3216gymjd72": "space_mission",
  // Grand Prix of Europe
  "movie-doodstream-0adldx69wmg9": "grand_prix_of_europe",
  // Paw Patrol Christmas
  "movie-doodstream-r1fnsaqdtqvb": "paw_patrol",
  // Pets On a Train
  "movie-doodstream-mn9ioahio1ft": "pets_on_a_train",
  // Detective Conan Movie 28
  "movie-doodstream-x33qic238a8y": "detective_conan",
  // Ginga Tokkyuu Milky Subway
  "movie-doodstream-9oqii9k1ko0x": "galaxy_express",
  // Batman Knightfall
  "movie-doodstream-so1vtpz8ol5t": "batman_knightfall",
  // Stitch Head
  "movie-doodstream-56kebmumiy2i": "stitch_head",
  // The Twits
  "movie-doodstream-wly9i06d12pm": "the_twits",
  "movie-doodstream-13etri0f7a4e": "the_twits",
  // Fixed
  "movie-doodstream-nrqzg5b1hgcq": "fixed",
  // Lupin III vs Cat's Eye
  "movie-doodstream-6gjnlb8d1fvt": "lupin_iii_vs_cats_eye",
  // Hateshinaki Scarlet
  "movie-doodstream-a6kxyr8ny1hd": "scarlet",
  // Ne Zha 2 & 1
  "movie-doodstream-ju1sqwty75fb": "ne_zha_2",
  "movie-doodstream-sk6cnwm3ctl7": "ne_zha",
  // Animal Farm
  "movie-doodstream-ibma6v3ehg9a": "animal_farm",
  // Smurfs
  "movie-doodstream-guj8mp6hygz5": "the_smurfs_movie",
  // The Ribbon Hero
  "movie-doodstream-2m7g5vvfnbpd": "the_ribbon_hero",
  // ChaO
  "movie-doodstream-8jfquve36s30": "chao",
  // Fuuto PI
  "movie-doodstream-kx6b3w7rpl3k": "fuuto_tantei",
  // K-Pop Demon Hunters
  "movie-doodstream-53ttx506kosu": "k_pop_demon_hunters",
  // Angelo in the Mysterious Forest
  "movie-doodstream-sjquzfz2e4v5": "angelo_dans_la_foret",
  // Lulu Is a Rhinoceros
  "movie-doodstream-k24tt6hv93yu": "lulu_is_a_rhinoceros",
  // The Legend of Aang
  "movie-doodstream-xm0qc8d8gmn3": "the_last_airbender",
  "movie-doodstream-asrc5qzqbwds": "the_last_airbender",
  // I Am Frankelda
  "movie-doodstream-kdt8qwt4qrx5": "frankelda",
  // Tabby McTat
  "movie-doodstream-q0lm6fqftt97": "tabby_mctat",
  // The King of Kings
  "movie-doodstream-ziw2a8errha9": "the_king_of_kings",
  // Elio
  "movie-doodstream-tzd9kk16jl4j": "elio",
  "movie-doodstream-sg9w3zkeydiu": "elio",
  // Elemental
  "movie-doodstream-6nuyp2uchcyc": "elemental",
  // Night of the Zoopocalypse
  "movie-doodstream-v53b740oqpag": "night_of_the_zoopocalypse",
  // The Canterville Ghost
  "movie-doodstream-il3nd2zy7cnc": "the_canterville_ghost",
  // Barbie & Stacie to the Rescue
  "movie-doodstream-gy26lcb5yub9": "barbie_and_stacie_to_the_rescue",
  // Noah's Ark
  "movie-doodstream-cjvl8roc6e51": "noahs_ark",
  // They Shot the Piano Player
  "movie-doodstream-qcm144e3ivi2": "they_shot_the_piano_player",
  // Mahavatar Narsimha
  "movie-doodstream-lgf4cybg28y9": "mahavatar_narsimha",
  // The Casagrandes Movie
  "movie-doodstream-3svux7ojvqpv": "the_casagrandes_movie",
  "movie-doodstream-7f7ty4aglg9b": "the_casagrandes_movie",
  // Wish
  "movie-doodstream-qnikfuq7wdy4": "wish",
  "movie-doodstream-51jm9ytewqh0": "wish",
  "movie-doodstream-bcm90fvmi7t4": "wish",
  "movie-doodstream-4arcoj0jopnh": "wish",
  // Megamind vs The Doom Syndicate
  "movie-doodstream-zlwhd4pvwz4h": "megamind_vs_the_doom_syndicate",
  // Lost in Starlight
  "movie-doodstream-tfh9ydp3g000": "lost_in_starlight",
  // Orion and the Dark
  "movie-doodstream-yld9hcdpw5kv": "orion_and_the_dark",
  // Treasure Fellowship
  "movie-doodstream-d0hi33nrq8n4": "treasure_fellowship",
  // The Bad Guys 2
  "movie-doodstream-bo412vu1gyxq": "the_bad_guys_2",
  // Super-Charlie
  "movie-doodstream-0h9awt618b5n": "super_charlie",
  // Justice League Crisis on Infinite Earths
  "movie-doodstream-twd41sqvzqmx": "justice_league_crisis_on_infinite_earths",
  // The Tiger's Apprentice
  "movie-doodstream-9e5522x03ay8": "the_tigers_apprentice",
  // Little Emma
  "movie-doodstream-quvab0h3bv67": "little_emma"
};

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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
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

async function searchImdb(q) {
  if (!q) return null;
  const clean = q.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  if (!clean || clean.length < 2) return null;
  const url = `https://v3.sg.media-imdb.com/suggestion/${clean[0]}/${clean}.json`;
  const data = await fetchJson(url);
  if (data && data.d && data.d.length > 0) {
    const match = data.d.find(x => x.i && x.i.imageUrl) || data.d[0];
    if (match && match.i && match.i.imageUrl) {
      return { title: match.l, img: match.i.imageUrl };
    }
  }
  return null;
}

async function main() {
  const cat = JSON.parse(fs.readFileSync('public/curated_catalog.json', 'utf8'));
  console.log(`Auditing and categorizing ${cat.length} movies...`);

  const fallbackSize = 23138;
  let fixedPosters = 0;
  let categorizedCount = 0;

  for (let i = 0; i < cat.length; i++) {
    const item = cat[i];

    // 1. STEP ONE: Categorize properly ("ضيف كل فيلم في قسمه")
    const title = item.title || '';
    const genre = item.genre || '';
    const origin = item.origin || 'foreign';

    const isAnimationOrAnime =
      item.subGenre === 'animation' ||
      item.category === 'anime' ||
      origin === 'anime' ||
      genre.includes('رسوم متحركة') ||
      genre.includes('أنمي') ||
      genre.includes('كرتون') ||
      genre.includes('ميكا') ||
      title.includes('أنمي') ||
      title.includes('كرتون') ||
      title.includes('Zootopia') ||
      title.includes('Kung Fu Panda') ||
      title.includes('Toy Story') ||
      title.includes('Hotel Transylvania') ||
      title.includes('Elio') ||
      title.includes('Wish') ||
      title.includes('Demon Slayer') ||
      title.includes('Attack on Titan') ||
      title.includes('Mononoke') ||
      title.includes('Gintama') ||
      title.includes('Gundam') ||
      title.includes('Sword Art Online') ||
      title.includes('Tad and The Magic') ||
      title.includes('Smurfs') ||
      title.includes('Bad Guys') ||
      title.includes('Megamind') ||
      title.includes('Super Mario');

    const isSeries = item.category === 'series' || item.type === 'series' || title.includes('مسلسل') || title.includes('Blindspot');

    if (isSeries) {
      item.category = 'series';
      item.type = 'series';
      categorizedCount++;
    } else if (isAnimationOrAnime) {
      item.category = 'anime';
      item.subGenre = 'animation';
      // keep origin if specified (e.g. japanese anime or korean), otherwise anime
      if (!item.origin || item.origin === 'foreign') {
        item.origin = 'anime';
      }
      categorizedCount++;
    } else {
      // Live-action cinema
      item.category = 'movies';
      item.type = 'movie';
      if (!item.origin) {
        item.origin = 'foreign';
      }
    }

    // 2. STEP TWO: Fix poster if it is a fallback or needs update ("واتاكد من بوسترات الافلام انها تكون على حسب العمل")
    const posterPath = path.join('public', item.poster);
    const backdropPath = path.join('public', item.backdrop);

    const isFallback = fs.existsSync(posterPath) && fs.statSync(posterPath).size === fallbackSize;
    const isMissing = !fs.existsSync(posterPath) || fs.statSync(posterPath).size < 1000;

    if (isFallback || isMissing || customQueries[item.id]) {
      // Determine search term
      let q = customQueries[item.id];
      if (!q) {
        // derive from title
        q = title
          .replace(/[\u0600-\u06FF\(\)\d]/g, ' ')
          .replace(/[^a-zA-Z0-9\s]/g, ' ')
          .trim()
          .replace(/\s+/g, '_')
          .toLowerCase();
      }

      if (q && q.length >= 2) {
        const imdbRes = await searchImdb(q);
        if (imdbRes && imdbRes.img) {
          try {
            // High-resolution cinema URLs
            const posterUrl = imdbRes.img.replace(/\._V1_.*\./, '._V1_QL75_UX500_.');
            const backdropUrl = imdbRes.img.replace(/\._V1_.*\./, '._V1_QL75_UX1000_.');

            await downloadBinary(posterUrl, posterPath);
            await downloadBinary(backdropUrl, backdropPath);
            fixedPosters++;
            console.log(`[POSTER OK ${fixedPosters}] ${item.title} -> ${imdbRes.title}`);
          } catch (err) {
            console.warn(`[POSTER FAIL] ${item.title}: ${err.message}`);
          }
        } else {
          console.log(`[IMDB NO RESULT] ${item.title} (Query: ${q})`);
        }
      }

      await new Promise(r => setTimeout(r, 60));
    }
  }

  console.log(`\n================ SUMMARY ================`);
  console.log(`Total Movies Audited: ${cat.length}`);
  console.log(`Categorized items updated: ${categorizedCount}`);
  console.log(`Genuine Posters Downloaded: ${fixedPosters}`);

  fs.writeFileSync('public/curated_catalog.json', JSON.stringify(cat, null, 2));
  fs.writeFileSync('public/catalog.json', JSON.stringify(cat, null, 2));
  fs.writeFileSync('public/catalog.js', `window.CURATED_CATALOG = ${JSON.stringify(cat, null, 2)};\n`);

  // Update standalone-tadhkira.html and artifact if present
  if (fs.existsSync('public/standalone-tadhkira.html')) {
    let html = fs.readFileSync('public/standalone-tadhkira.html', 'utf8');
    if (html.includes('window.CURATED_CATALOG =')) {
      html = html.replace(/window\.CURATED_CATALOG = \[[\s\S]*?\];/, 'window.CURATED_CATALOG = ' + JSON.stringify(cat) + ';');
      fs.writeFileSync('public/standalone-tadhkira.html', html, 'utf8');
    }
  }

  const brainHtml = '.aistudio/artifacts/brain/6b3d95a5-d2ff-4309-8f0b-a40079d14a50/index.html';
  if (fs.existsSync(brainHtml)) {
    let html = fs.readFileSync(brainHtml, 'utf8');
    if (html.includes('window.CURATED_CATALOG =')) {
      html = html.replace(/window\.CURATED_CATALOG = \[[\s\S]*?\];/, 'window.CURATED_CATALOG = ' + JSON.stringify(cat) + ';');
      fs.writeFileSync(brainHtml, html, 'utf8');
    }
  }

  console.log('Saved all catalog data and synced standalone files successfully!');
}

main().catch(console.error);
