const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const cat = JSON.parse(fs.readFileSync('public/curated_catalog.json', 'utf8'));

async function createPoster(item) {
  const posterRel = (item.poster || '').replace(/^\//, '');
  const posterPath = path.join('public', posterRel);
  
  if (fs.existsSync(posterPath) && fs.statSync(posterPath).size > 1000) {
    return;
  }

  const title = item.title || item.originalTitle || 'فيلم تذكرة';
  const origTitle = item.originalTitle || '';
  const genre = item.genre || 'سينما وإثارة';
  const year = item.year || '2026';
  const rating = item.rating || '8.0';

  // Generate SVG buffer with cinema styling
  const svg = `
  <svg width="600" height="900" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f0c1b"/>
        <stop offset="40%" stop-color="#18122B"/>
        <stop offset="70%" stop-color="#0a0714"/>
        <stop offset="100%" stop-color="#05030a"/>
      </linearGradient>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#FFE082"/>
        <stop offset="50%" stop-color="#FFD700"/>
        <stop offset="100%" stop-color="#FFA000"/>
      </linearGradient>
      <linearGradient id="overlay" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgba(0,0,0,0.1)"/>
        <stop offset="60%" stop-color="rgba(0,0,0,0.4)"/>
        <stop offset="100%" stop-color="rgba(5,3,10,0.95)"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="35%" r="45%">
        <stop offset="0%" stop-color="rgba(218,165,32,0.25)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
      </radialGradient>
    </defs>

    <!-- Background -->
    <rect width="600" height="900" fill="url(#bg)"/>
    <circle cx="300" cy="320" r="260" fill="url(#glow)"/>

    <!-- Subtle Golden Border -->
    <rect x="15" y="15" width="570" height="870" rx="16" fill="none" stroke="url(#gold)" stroke-width="2" opacity="0.4"/>
    <rect x="22" y="22" width="556" height="856" rx="12" fill="none" stroke="#FFFFFF" stroke-width="0.5" opacity="0.15"/>

    <!-- Top Badge (Quality & Year) -->
    <g transform="translate(40, 45)">
      <rect width="110" height="34" rx="17" fill="rgba(0,0,0,0.7)" stroke="url(#gold)" stroke-width="1.5"/>
      <text x="55" y="22" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#FFD700" text-anchor="middle">★ ${rating}</text>
    </g>

    <g transform="translate(450, 45)">
      <rect width="110" height="34" rx="17" fill="rgba(255,215,0,0.15)" stroke="url(#gold)" stroke-width="1.5"/>
      <text x="55" y="22" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#FFE082" text-anchor="middle">${year} FHD</text>
    </g>

    <!-- Center Cinema Emblem -->
    <g transform="translate(300, 320)">
      <circle r="110" fill="rgba(10,8,20,0.85)" stroke="url(#gold)" stroke-width="3"/>
      <polygon points="-25,-45 45,0 -25,45" fill="url(#gold)"/>
      <circle r="125" fill="none" stroke="rgba(255,215,0,0.25)" stroke-width="1.5" stroke-dasharray="8,6"/>
    </g>

    <!-- VIP Watermark -->
    <text x="300" y="490" font-family="Arial, sans-serif" font-weight="bold" font-size="13" letter-spacing="4" fill="#FFD700" opacity="0.75" text-anchor="middle">TICKET VIB • VIP PREMIERE</text>

    <!-- Dark gradient overlay for bottom text legibility -->
    <rect y="450" width="600" height="450" fill="url(#overlay)"/>

    <!-- Title and details -->
    <text x="300" y="680" font-family="'Cairo', Arial, sans-serif" font-weight="bold" font-size="28" fill="#FFFFFF" text-anchor="middle">
      ${title.length > 32 ? title.substring(0, 30) + '...' : title}
    </text>

    <text x="300" y="725" font-family="Arial, sans-serif" font-weight="600" font-size="18" fill="#FFD700" text-anchor="middle">
      ${origTitle.length > 35 ? origTitle.substring(0, 33) + '...' : origTitle}
    </text>

    <text x="300" y="775" font-family="'Cairo', Arial, sans-serif" font-size="16" fill="#B0BEC5" text-anchor="middle">
      ${genre}
    </text>

    <!-- Bottom VIP Tag -->
    <g transform="translate(200, 815)">
      <rect width="200" height="36" rx="18" fill="url(#gold)"/>
      <text x="100" y="23" font-family="'Cairo', Arial, sans-serif" font-weight="bold" font-size="14" fill="#000000" text-anchor="middle">مشاهدة مباشرة VIP</text>
    </g>
  </svg>
  `;

  fs.mkdirSync(path.dirname(posterPath), { recursive: true });
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 90 })
    .toFile(posterPath);

  // Also create backdrop
  const backdropRel = (item.backdrop || '').replace(/^\//, '');
  if (backdropRel) {
    const backdropPath = path.join('public', backdropRel);
    fs.mkdirSync(path.dirname(backdropPath), { recursive: true });
    await sharp(Buffer.from(svg))
      .resize(1280, 720, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toFile(backdropPath);
  }
}

async function main() {
  console.log('Generating posters for catalog items...');
  let count = 0;
  for (const item of cat) {
    const p = path.join('public', (item.poster || '').replace(/^\//, ''));
    if (!fs.existsSync(p) || fs.statSync(p).size < 1000) {
      await createPoster(item);
      count++;
    }
  }
  console.log(`Generated ${count} posters!`);
}

main().catch(console.error);
