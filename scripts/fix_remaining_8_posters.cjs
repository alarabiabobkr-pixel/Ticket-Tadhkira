const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const postersDir = path.join(__dirname, '../public/posters');
const distPostersDir = path.join(__dirname, '../dist-hd-perfect/posters');

const missing = [
  { file: 'movie-the-irishman-2019.jpg', title: 'الأيرلندي The Irishman', year: '2019', rating: '7.8', genre: 'جريمة • دراما ملحمية' },
  { file: 'movie-theory-of-everything-2014.jpg', title: 'نظرية كل شيء The Theory of Everything', year: '2014', rating: '7.7', genre: 'سيرة ذاتية • دراما' },
  { file: 'movie-the-gray-man-2022.jpg', title: 'الرجل الرمادي The Gray Man', year: '2022', rating: '6.5', genre: 'أكشن • تشويق تجسس' },
  { file: 'series-the-glory-2022-ep1.jpg', title: 'مجد الانتقام The Glory', year: '2022', rating: '8.1', genre: 'دراما • إثارة كورية' },
  { file: 'series-descendants-of-the-sun-2016-ep1.jpg', title: 'أحفاد الشمس Descendants of the Sun', year: '2016', rating: '8.2', genre: 'رومانسي • دراما كورية' },
  { file: 'movie-welad-rizk-3-2024.jpg', title: 'ولاد رزق 3 القاضية', year: '2024', rating: '8.0', genre: 'أكشن • جريمة سينما مصرية' },
  { file: 'movie-the-purge-anarchy-2014.jpg', title: 'التطهير فوضى The Purge: Anarchy', year: '2014', rating: '6.5', genre: 'أكشن • رعب إثارة' },
  { file: 'movie-the-roundup-no-way-out-2023.jpg', title: 'مدينة الجريمة 3 The Roundup 3', year: '2023', rating: '7.1', genre: 'أكشن • فنون قتالية' }
];

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function run() {
  for (const m of missing) {
    const width = 600;
    const height = 900;
    const dest1 = path.join(postersDir, m.file);
    const dest2 = path.join(distPostersDir, m.file);

    const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="50%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#020617" />
        </linearGradient>
        <linearGradient id="overlay" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.3" />
          <stop offset="60%" stop-color="#000000" stop-opacity="0.6" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.95" />
        </linearGradient>
      </defs>

      <rect width="${width}" height="${height}" fill="url(#bg)" />

      <!-- Cinema Grid Frame -->
      <circle cx="300" cy="360" r="200" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="6,6" opacity="0.3" />
      <circle cx="300" cy="360" r="140" fill="none" stroke="#f59e0b" stroke-width="1" opacity="0.4" />
      <circle cx="300" cy="360" r="70" fill="#f59e0b" fill-opacity="0.08" />

      <g transform="translate(265, 325)" fill="#f59e0b" opacity="0.85">
        <path d="M12 4v16l28-8z" />
      </g>

      <rect width="${width}" height="${height}" fill="url(#overlay)" />

      <!-- VIP Gold Border -->
      <rect x="20" y="20" width="${width - 40}" height="${height - 40}" rx="16" fill="none" stroke="#f59e0b" stroke-width="2" opacity="0.5" />

      <!-- Header Badges -->
      <rect x="40" y="45" width="105" height="34" rx="8" fill="#e50914" />
      <text x="92" y="68" fill="#ffffff" font-family="'Cairo', sans-serif" font-size="14" font-weight="bold" text-anchor="middle">1080p FHD</text>

      <rect x="${width - 150}" y="45" width="110" height="34" rx="8" fill="#111827" stroke="#f59e0b" stroke-width="1" />
      <text x="${width - 95}" y="68" fill="#f59e0b" font-family="'Cairo', sans-serif" font-size="14" font-weight="bold" text-anchor="middle">★ ${escapeXml(m.rating)}</text>

      <text x="300" y="70" fill="#94a3b8" font-family="'Cairo', sans-serif" font-size="16" font-weight="bold" text-anchor="middle">${escapeXml(m.year)}</text>

      <!-- Title & Details -->
      <text x="300" y="720" fill="#ffffff" font-family="'Cairo', sans-serif" font-size="28" font-weight="900" text-anchor="middle">
        ${escapeXml(m.title)}
      </text>

      <text x="300" y="785" fill="#f59e0b" font-family="'Cairo', sans-serif" font-size="16" font-weight="600" text-anchor="middle">
        ${escapeXml(m.genre)}
      </text>

      <!-- VIP Badge -->
      <g transform="translate(225, 830)">
        <rect width="150" height="28" rx="14" fill="#030712" stroke="#f59e0b" stroke-width="1" opacity="0.8" />
        <text x="75" y="19" fill="#e2e8f0" font-family="'Cairo', sans-serif" font-size="12" font-weight="bold" text-anchor="middle">TICKET CINEMA VIP</text>
      </g>
    </svg>
    `;

    const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toBuffer();
    fs.writeFileSync(dest1, buf);
    if (fs.existsSync(distPostersDir)) {
      fs.writeFileSync(dest2, buf);
    }
    console.log(`+ Created poster: ${m.file}`);
  }
  console.log("All missing posters fixed successfully!");
}

run().catch(console.error);
