import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cinema Ticket VIP Logo SVG (512x512) - Pure vector graphics for flawless rendering
const svgLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Radial Gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="45%" r="70%">
      <stop offset="0%" stop-color="#111927"/>
      <stop offset="55%" stop-color="#080c14"/>
      <stop offset="100%" stop-color="#04060a"/>
    </radialGradient>

    <!-- Metallic Gold Gradient -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fffbeb"/>
      <stop offset="20%" stop-color="#fde68a"/>
      <stop offset="45%" stop-color="#f59e0b"/>
      <stop offset="70%" stop-color="#d97706"/>
      <stop offset="90%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#92400e"/>
    </linearGradient>

    <!-- Metallic Gold Light Gradient -->
    <linearGradient id="goldLight" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#d97706"/>
      <stop offset="40%" stop-color="#fef08a"/>
      <stop offset="70%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#fde68a"/>
    </linearGradient>

    <!-- Electric Cyan Play Button Gradient -->
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e0f2fe"/>
      <stop offset="25%" stop-color="#38bdf8"/>
      <stop offset="65%" stop-color="#00d2ff"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>

    <!-- Ticket Glow & Shadow -->
    <filter id="ticketShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.9"/>
      <feDropShadow dx="0" dy="0" stdDeviation="22" flood-color="#f59e0b" flood-opacity="0.3"/>
    </filter>

    <!-- Cyan Neon Glow -->
    <filter id="cyanGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="16" flood-color="#00d2ff" flood-opacity="0.8"/>
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- App Container: Rounded Square for PWA & Google Search Favicon -->
  <rect width="512" height="512" rx="116" fill="url(#bgGrad)"/>
  <rect x="3" y="3" width="506" height="506" rx="113" fill="none" stroke="url(#goldLight)" stroke-width="3" stroke-opacity="0.45"/>

  <!-- Top Cinema Crown / Stars -->
  <g fill="url(#goldGrad)">
    <!-- Central Crown -->
    <path d="M 234 68 L 244 86 L 256 60 L 268 86 L 278 68 L 274 98 L 238 98 Z" opacity="0.95"/>
    <circle cx="234" cy="65" r="3.5"/>
    <circle cx="256" cy="57" r="4.5"/>
    <circle cx="278" cy="65" r="3.5"/>
    
    <!-- Left Star -->
    <path d="M 186 78 L 190 88 L 200 89 L 192 96 L 195 106 L 186 100 L 177 106 L 180 96 L 172 89 L 182 88 Z" opacity="0.8" transform="scale(0.85) translate(28, 12)"/>
    <!-- Right Star -->
    <path d="M 326 78 L 330 88 L 340 89 L 332 96 L 335 106 L 326 100 L 317 106 L 320 96 L 312 89 L 322 88 Z" opacity="0.8" transform="scale(0.85) translate(48, 12)"/>
  </g>

  <!-- Ticket Outer Group with Shadow -->
  <g filter="url(#ticketShadow)">
    
    <!-- Cinema VIP Ticket Silhouette (Cutout notches at top, bottom, and sides) -->
    <path d="
      M 94 130
      L 418 130
      Q 434 130 434 146
      L 434 222
      A 34 34 0 0 0 434 290
      L 434 376
      Q 434 392 418 392
      L 94 392
      Q 78 392 78 376
      L 78 290
      A 34 34 0 0 0 78 222
      L 78 146
      Q 78 130 94 130
      Z"
      fill="#0c1322"
      stroke="url(#goldGrad)"
      stroke-width="6"
    />

    <!-- Inner Golden Border -->
    <path d="
      M 102 140
      L 410 140
      Q 424 140 424 154
      L 424 218
      A 40 40 0 0 0 424 294
      L 424 368
      Q 424 382 410 382
      L 102 382
      Q 88 382 88 368
      L 88 294
      A 40 40 0 0 0 88 218
      L 88 154
      Q 88 140 102 140
      Z"
      fill="none"
      stroke="url(#goldLight)"
      stroke-width="2"
      stroke-opacity="0.5"
    />

    <!-- Perforation Dashed Line dividing Stub & Main Pass -->
    <line x1="176" y1="140" x2="176" y2="382" stroke="#f59e0b" stroke-width="3.5" stroke-dasharray="8,8" opacity="0.75"/>

    <!-- Left Stub: Cinema VIP Elements -->
    <g transform="translate(94, 150)">
      <!-- Mini Ticket Icon -->
      <g transform="translate(14, 12)" fill="url(#goldGrad)">
        <rect x="4" y="8" width="38" height="24" rx="4" fill="none" stroke="url(#goldGrad)" stroke-width="2.5"/>
        <circle cx="4" cy="20" r="4" fill="#0c1322"/>
        <circle cx="42" cy="20" r="4" fill="#0c1322"/>
      </g>

      <!-- VIP Text Stamped in Metallic Gold -->
      <text x="38" y="98" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="28" fill="url(#goldLight)" text-anchor="middle" letter-spacing="3">VIP</text>

      <!-- Ticket Serial Number Stamp -->
      <rect x="8" y="112" width="60" height="20" rx="4" fill="#f59e0b" fill-opacity="0.15"/>
      <text x="38" y="126" font-family="'Courier New', monospace" font-weight="bold" font-size="11" fill="#fde68a" text-anchor="middle" letter-spacing="1">№ 7729</text>

      <!-- Stub Barcode -->
      <g stroke="url(#goldGrad)" stroke-width="2.5" opacity="0.85">
        <line x1="10" y1="146" x2="10" y2="194"/>
        <line x1="16" y1="146" x2="16" y2="194" stroke-width="4"/>
        <line x1="24" y1="146" x2="24" y2="194" stroke-width="1.5"/>
        <line x1="30" y1="146" x2="30" y2="194" stroke-width="4"/>
        <line x1="38" y1="146" x2="38" y2="194" stroke-width="2"/>
        <line x1="46" y1="146" x2="46" y2="194" stroke-width="5"/>
        <line x1="56" y1="146" x2="56" y2="194" stroke-width="2"/>
        <line x1="64" y1="146" x2="64" y2="194" stroke-width="3"/>
      </g>
    </g>

    <!-- Right Pass Section: Glowing Play Badge -->
    <g transform="translate(176, 0)">
      
      <!-- Top Ticket Header -->
      <text x="126" y="174" font-family="'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="18" fill="url(#goldLight)" text-anchor="middle" letter-spacing="4">
        CINEMA PASS
      </text>

      <!-- Central Play Orb with Cyan Glow -->
      <g filter="url(#cyanGlow)">
        <!-- Outer Glowing Ring -->
        <circle cx="126" cy="256" r="62" fill="#080e1a" stroke="url(#cyanGrad)" stroke-width="4.5"/>
        <circle cx="126" cy="256" r="54" fill="none" stroke="url(#cyanGrad)" stroke-width="1.5" stroke-opacity="0.5"/>
        
        <!-- Large Sharp Electric Play Triangle -->
        <polygon points="112,224 156,256 112,288" fill="url(#cyanGrad)"/>
      </g>

      <!-- Bottom Resolution Badge -->
      <g transform="translate(66, 334)">
        <rect x="0" y="0" width="120" height="24" rx="6" fill="#00d2ff" fill-opacity="0.12" stroke="#00d2ff" stroke-opacity="0.4" stroke-width="1"/>
        <text x="60" y="16" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="11" fill="#38bdf8" text-anchor="middle" letter-spacing="2">
          FULL HD 1080P
        </text>
      </g>
    </g>
  </g>

  <!-- Bottom Brand Gold Seal Ribbon -->
  <g transform="translate(96, 422)">
    <rect x="0" y="0" width="320" height="54" rx="16" fill="#0c1322" stroke="url(#goldGrad)" stroke-width="3"/>
    
    <!-- Stars flanking VIP TICKET -->
    <path d="M 36 27 L 39 33 L 46 34 L 41 39 L 42 46 L 36 42 L 30 46 L 31 39 L 26 34 L 33 33 Z" fill="url(#goldGrad)"/>
    <path d="M 284 27 L 287 33 L 294 34 L 289 39 L 290 46 L 284 42 L 278 46 L 279 39 L 274 34 L 281 33 Z" fill="url(#goldGrad)"/>

    <!-- Clean Crisp VIP TICKET Text (crisp and readable on all platforms) -->
    <text x="160" y="36" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="23" fill="url(#goldLight)" text-anchor="middle" letter-spacing="4">
      VIP TICKET
    </text>
  </g>
</svg>`;

async function generate() {
  const publicDir = path.resolve(__dirname, '../public');
  const distDir = path.resolve(__dirname, '../dist-hd-perfect');

  console.log('Writing public/icon.svg...');
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgLogo);

  const buffer = Buffer.from(svgLogo);

  const targets = [
    { name: 'favicon-48x48.png', size: 48 },
    { name: 'favicon-96x96.png', size: 96 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'pwa-512x512.png', size: 512 },
    { name: 'pwa-maskable-512x512.png', size: 512 },
    { name: 'favicon.png', size: 48 },
    { name: 'favicon.ico', size: 48 }
  ];

  for (const t of targets) {
    const outPath = path.join(publicDir, t.name);
    await sharp(buffer)
      .resize(t.size, t.size)
      .png()
      .toFile(outPath);
    console.log(`Generated public/${t.name} (${t.size}x${t.size})`);

    if (fs.existsSync(distDir)) {
      fs.copyFileSync(outPath, path.join(distDir, t.name));
    }
  }

  console.log('All branding icons generated successfully!');
}

generate().catch(err => {
  console.error('Generation error:', err);
  process.exit(1);
});
