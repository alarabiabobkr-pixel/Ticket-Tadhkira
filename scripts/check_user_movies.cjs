const fs = require('fs');

const rawMovies = [
  { rawTitle: "The Aviator 2004 1080p BluRay AKWAM", url: "https://playmogo.com/e/cjn5ely7ae3i" },
  { rawTitle: "John Wick Chapter 4 2023 BluRay 1080p AKWAM", url: "https://playmogo.com/e/ybl52mt5rjwd" },
  { rawTitle: "Killers Of The Flower Moon 2023 1080p WEB-DL akwam", url: "https://playmogo.com/e/5sslysnod9ct" },
  { rawTitle: "Tiger 3 2023 1080P WEB-DL AKWAM", url: "https://playmogo.com/e/s78aw4npb1hc" },
  { rawTitle: "This Boys Life 1993 1080p BluRay AKWAM", url: "https://playmogo.com/e/4oj3tn25hm6v" },
  { rawTitle: "Jawan Extended Cut 2023 1080p NF WEB-DL akwam us", url: "https://playmogo.com/e/pm62okxneeyc" },
  { rawTitle: "Dunki 2023 1080p WEB-DL AKWAM", url: "https://playmogo.com/e/m21916f35m4g" },
  { rawTitle: "The Beekeeper 2024 1080p WEB AKWAM", url: "https://playmogo.com/e/ao4nrwrk26dw" },
  { rawTitle: "Revolutionary Road 2008 Bluray 1080p AKWAM", url: "https://playmogo.com/e/933ibohiwxz0" },
  { rawTitle: "Black Widow 2021 1080p Bluray AKWAM", url: "https://playmogo.com/e/wnbcx2oynp88" },
  { rawTitle: "Whats Eating Gilbert Grape 1993 1080p BluRay AKWAM", url: "https://playmogo.com/e/86hfuss2h24m" },
  { rawTitle: "Detective Knight Redemption 2022 1080p WEB-DL AKWAM", url: "https://playmogo.com/e/99qxu3w7gpob" },
  { rawTitle: "47 Ronin 2013 1080P BluRay AKWAM", url: "https://playmogo.com/e/90fda5emqz6s" },
  { rawTitle: "Sikandar 2025 720p NF WEB-DLl AKWAM", url: "https://playmogo.com/e/3jk0zpwrttn1" },
  { rawTitle: "Dont Look Up 2021 1080p WEB-DL AKWAM", url: "https://playmogo.com/e/b15826wg31zh" },
  { rawTitle: "Star Trek II The Wrath of Khan 1982 1080p BluRay AKWAM", url: "https://playmogo.com/e/0er6ahutpi9w" },
  { rawTitle: "Speed 1994 1080p BluRay AKWAM", url: "https://playmogo.com/e/mywb4rrvgh5x" },
  { rawTitle: "Yodha 2024 1080p WEB-DL AKWAM", url: "https://playmogo.com/e/lsgzywv0vfoe" },
  { rawTitle: "Murder Mubarak 2024 1080P WEB-DL AKWAM", url: "https://playmogo.com/e/p4q5rr9seg7y" },
  { rawTitle: "Gangs Of New York 2002 1080p BluRay AKWAM", url: "https://playmogo.com/e/ou2c3588jfwb" },
  { rawTitle: "Asteroid City 2023 1080p WEB-DL AKWAM", url: "https://playmogo.com/e/uah2ispc6sqd" },
  { rawTitle: "Sikandar 2025 ar 720p NF WEB-DL AKWAM", url: "https://playmogo.com/e/wx9j3m6j9x12" },
  { rawTitle: "Sikandar 2025 720p WEB AKWAM", url: "https://playmogo.com/e/z5tkeble4yyf" },
  { rawTitle: "Undercover Rascals 2 2022 1080P WEB-DL AKWAM", url: "https://playmogo.com/e/gg9oo4kx59ht" },
  { rawTitle: "The Quick And The Dead 1995 720p BluRay AKWAM", url: "https://playmogo.com/e/a6n5mdg2yl2t" },
  { rawTitle: "Kindling 2023 1080p WEB-DL AKWAM", url: "https://playmogo.com/e/cuw3cbq4glv4" },
  { rawTitle: "A Minecraft Movie 2025 1080p AMZN WEB-DL AKWAM", url: "https://playmogo.com/e/2hbbp6arewi1" },
  { rawTitle: "Origenes secretos 2020 1080p WEB-DL AKWAM", url: "https://playmogo.com/e/oyxw91s0bdhd" },
  { rawTitle: "A Line Of Fire 2025 1080p WEB-DL AKWAM", url: "https://playmogo.com/e/fos03ssnew0g" },
  { rawTitle: "mountainhead 2025 720p web AKWAM", url: "https://playmogo.com/e/tcewm9rdyq2p" },
  { rawTitle: "Constantine 2005 720 WEB-DL AKWAM", url: "https://playmogo.com/e/r8xsxqgu0kr2" },
  { rawTitle: "O Menino que Matou Meus Pais 2021 1080p WEB-DL AKWAM", url: "https://playmogo.com/e/03vg72dn5y1l" },
  { rawTitle: "Constantine 2005 1080p BluRay AKWAM", url: "https://playmogo.com/e/pynx5ylt7zfu" },
  { rawTitle: "Marvins Room 1996 720p BluRay AKWAM", url: "https://playmogo.com/e/f8uuy76j0s97" },
  { rawTitle: "Friday the 13th Part VI Jason Lives 1986 720 WEB-DL AKWAM", url: "https://playmogo.com/e/p6ywsayrhsd6" },
  { rawTitle: "Werewolf by Night 2022 1080p WEB-DL AKWAM", url: "https://playmogo.com/e/gr0k97g8z0li" },
  { rawTitle: "Mission Impossible - The Final Reckoning 2025 1080p AMZN WEB-DL AKWAM", url: "https://playmogo.com/e/5dewfty6pfn1" },
  { rawTitle: "Sitaare Zameen Par 2025 1080p WEB-DL AKWAM", url: "https://playmogo.com/e/09tynceu6ia2" },
  { rawTitle: "grand-theft-auto-vi-an-extended-look-hd720", url: "https://playmogo.com/e/w8pro28q3ndm" },
  { rawTitle: "Good Fortune 2025 1080p WEB-DL AKWAM", url: "https://playmogo.com/e/bqxcxakolc7u" },
  { rawTitle: "Friday the 13th Part VIII Jason Takes Manhattan 1989 720 WEB-DL AKWAM", url: "https://playmogo.com/e/o3xgkn825hfq" },
  { rawTitle: "Dhurandhar The Revenge Raw and Undekha 2026 1080p WEB-DL AKWAM", url: "https://playmogo.com/e/cr9t4gcdlahv" },
  { rawTitle: "The Matrix Resurrections 2021 1080p Bluray AKWAM", url: "https://playmogo.com/e/1vw6uzfehddf" },
  { rawTitle: "Rough Night 2017 720p BluRay AKWAM", url: "https://playmogo.com/e/7lqxevahkj2q" },
  { rawTitle: "Lost in Translation 2003 720p BluRay AKWAM", url: "https://playmogo.com/e/vjf9c81qz7z5" },
  { rawTitle: "Sing 2016 720p BluRay AKWAM", url: "https://playmogo.com/e/9tulsp3m7w8o" },
  { rawTitle: "In Isolation 2022 1080p WEB-DL AKWAM", url: "https://playmogo.com/e/82ynhtkort4n" },
  { rawTitle: "Kryptic 2024 720p AMZN WEB AKWAM", url: "https://playmogo.com/e/u7tg42ars4dy" },
  { rawTitle: "The Jungle Book 2016 720p BluRay AKWAM", url: "https://playmogo.com/e/hcrp76tii1k9" },
  { rawTitle: "Match Point 2005 720p BluRay AKWAM", url: "https://playmogo.com/e/0lwrp4r7o43e" },
  { rawTitle: "Scoop 2006 720p BluRay AKWAM", url: "https://playmogo.com/e/a8jnl4ruznt1" },
  { rawTitle: "Just Cause 1995 720p BluRay AKWAM", url: "https://playmogo.com/e/3tm6ic42oibx" },
  { rawTitle: "One Last Shot 2026 720p", url: "https://playmogo.com/e/kqg64cwt2a1r" },
  { rawTitle: "Sing 2016 720p BluRay AKWAM (2)", url: "https://playmogo.com/e/ygfb2td0hpyp" },
  { rawTitle: "Safety 2020 1080p WEB AKWAM", url: "https://playmogo.com/e/n61n19ls74p1" },
  { rawTitle: "The Replacements 2000 720p BluRay AKWAM", url: "https://playmogo.com/e/fgakug5f3zoz" },
  { rawTitle: "Bill Ted Face the Music 1080p WEB-DL AKWAM", url: "https://playmogo.com/e/fuudb36389od" },
  { rawTitle: "We Bought A Zoo 2011 720p BluRay AKWAM", url: "https://playmogo.com/e/sje5kpqyjssv" },
  { rawTitle: "Hitchcock 2012 720p BluRay AKWAM", url: "https://playmogo.com/e/9shecs0kgl7m" },
  { rawTitle: "25 April 2015 720p WEBRip AKWAM", url: "https://playmogo.com/e/90dpl8nfcl4v" },
  { rawTitle: "The Other Boleyn Girl 2008 720p BluRay AKWAM", url: "https://playmogo.com/e/jqijsry6fe16" },
  { rawTitle: "Under the Skin 2013 720p BluRay AKWAM", url: "https://playmogo.com/e/hrmrik30hqeo" },
  { rawTitle: "The Island 2005 720p BluRay AKWAM", url: "https://playmogo.com/e/v7lsaq1nbyog" },
  { rawTitle: "Secret Agent Dingledorf and His Trusty Dog Splat 2021 1080p WEB-DL AKWAM", url: "https://playmogo.com/e/cl2st8nicrlk" },
  { rawTitle: "The Spirit 2008 720p BluRay AKWAM", url: "https://playmogo.com/e/1xz2y0h551dm" },
  { rawTitle: "Sweet November 2001 1080p WEBRip AKWAM", url: "https://playmogo.com/e/lcu4v8vpmwch" },
  { rawTitle: "A Love Song for Bobby Long 2004 720p BluRay AKWAM", url: "https://playmogo.com/e/b4ihbzte4124" },
  { rawTitle: "Chain Reaction 1996 720p BluRay AKWAM", url: "https://playmogo.com/e/g1x2kwmf6nvm" },
  { rawTitle: "Dhurandhar 2025 1080p WEB-DL AKWAM", url: "https://playmogo.com/e/429lujuhkzr8" },
  { rawTitle: "Cocktail 2012720p WEB-DL AKWAM", url: "https://playmogo.com/e/g9y8hd1nk1x7" },
  { rawTitle: "Exposed 2016 720p BluRay AKWAM", url: "https://playmogo.com/e/s00ptyshnl70" },
  { rawTitle: "Babysitter Must Die 2021 1080p WEB-DL AKWAM", url: "https://playmogo.com/e/22va9opkvp5m" },
  { rawTitle: "The Watcher 2000 720p BluRay AKWAM", url: "https://playmogo.com/e/bueyf283t1bm" },
  { rawTitle: "The Nanny Diaries 2007 720p BluRay AKWAM", url: "https://playmogo.com/e/9wr2oh4kycoc" },
  { rawTitle: "Keanu 2016 720p BluRay AKWAM", url: "https://playmogo.com/e/cpqkd031fu1x" },
  { rawTitle: "Main Vaapas Aaunga 2026 HD", url: "https://playmogo.com/e/7mz0uq6zwntd" },
  { rawTitle: "Raja Shivaji 2026 HD-720p", url: "https://playmogo.com/e/qasx90fod2gv" },
  { rawTitle: "Words Of War 2025 720p HDTS AKWAM", url: "https://playmogo.com/e/v0fszt1y4fgs" },
  { rawTitle: "Those Who Walk Away 2022 1080p WEB-DL AKWAM", url: "https://playmogo.com/e/9y0hxhbjxckq" },
  { rawTitle: "The Gift 2000 720p BluRay AKWAM", url: "https://playmogo.com/e/f7pgm6e89br5" },
  { rawTitle: "The Perfect Score 2004 720p BluRay AKWAM", url: "https://playmogo.com/e/5e1g3enrkcos" },
  { rawTitle: "Vicky Cristina Barcelona 2008 720p BluRay AKWAM", url: "https://playmogo.com/e/hqiakozzcc1f" },
  { rawTitle: "Small Town Hero 2019 1080p WEB-DL AKWAM", url: "https://playmogo.com/e/trbxtyjdygwc" },
  { rawTitle: "The Uprising 2026 1080p WEB-DL720p", url: "https://playmogo.com/e/mrata8u4eyjy" },
  { rawTitle: "Dont Move 2026", url: "https://playmogo.com/e/hejip8vm6ssw" },
  { rawTitle: "Mutiny 2026 1080p", url: "https://playmogo.com/e/74ok71q604py" },
  { rawTitle: "Tom Clancys Jack Ryan Ghost War 2026 1080p WEB-DL AKWAM", url: "https://playmogo.com/e/legrmdel5cz3" },
  { rawTitle: "Tom Clancys Jack Ryan Ghost War 2026 1080p WEB-DL AKWAM (2)", url: "https://playmogo.com/e/rwcmz7p0zi9c" },
  { rawTitle: "Spider-Man Brand New Day 2026 1080p", url: "https://playmogo.com/e/jqxas21h5fca" },
  { rawTitle: "The Wrecking Crew 2026 1080p WEB-DL AKWAM", url: "https://playmogo.com/e/8vrgun2z7x4c" },
  { rawTitle: "Oh What Fun 2025 1080p WEB-DL AKWAM", url: "https://playmogo.com/e/u5le3mtpo1rw" },
  { rawTitle: "Black Box 2026 1080p BluRay", url: "https://playmogo.com/e/8u3a9d10p7o5" },
  { rawTitle: "Outcome 2026 WEB-DL AKWAM", url: "https://playmogo.com/e/fo7whoh5vpd0" },
  { rawTitle: "Oh What Fun 2025 1080p WEB-DL AKWAM (2)", url: "https://playmogo.com/e/9c781u848vza" },
  { rawTitle: "Doing Life 2026 720", url: "https://playmogo.com/e/kgetm45ax9ur" },
  { rawTitle: "Father Mother Sister Brother 2025 1080p BluRay", url: "https://playmogo.com/e/ec5vepvo4kfb" },
  { rawTitle: "Fall 2 Deadpoint 2026 720", url: "https://playmogo.com/e/rp2zciumodmg" },
  { rawTitle: "A Working Man 2025 720p WEB-DL AKWAM", url: "https://playmogo.com/e/cztvxp4g1zj6" },
  { rawTitle: "legend-of-the-white-dragon 720", url: "https://playmogo.com/e/idpb6ndta7p4" },
  { rawTitle: "Bury the Devil 2026", url: "https://playmogo.com/e/p7nhgjfwm2cv" }
];

const catalog = JSON.parse(fs.readFileSync('public/curated_catalog.json', 'utf8'));
const existingEmbeds = new Set(catalog.map(m => m.embedUrl));
const existingTitles = new Set(catalog.map(m => m.title));

console.log('Total submitted links:', rawMovies.length);

const toAdd = [];
const skipped = [];

rawMovies.forEach(item => {
  const codeMatch = item.url.match(/\/e\/([a-zA-Z0-9]+)/);
  const code = codeMatch ? codeMatch[1] : null;
  const id = `movie-doodstream-${code}`;

  const existsByUrl = existingEmbeds.has(item.url);
  const existsById = catalog.some(m => m.id === id);

  if (existsByUrl || existsById) {
    skipped.push({ reason: 'Already in catalog', ...item });
  } else {
    toAdd.push(item);
  }
});

console.log(`To add: ${toAdd.length}, Skipped (Already present): ${skipped.length}`);
if (skipped.length > 0) {
  console.log('Skipped items:', skipped.map(s => s.rawTitle));
}
