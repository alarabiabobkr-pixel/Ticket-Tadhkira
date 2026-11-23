import fs from 'node:fs';
import path from 'node:path';
import { compile } from 'tailwindcss';

const ROOT = process.cwd();
const INPUT_FILES = [
  path.join(ROOT, 'index.html'),
  path.join(ROOT, 'public/js/app.js'),
  path.join(ROOT, 'public/js/prayer.js'),
  path.join(ROOT, 'public/live_channels.js'),
  path.join(ROOT, 'src/auth.ts'),
];

const cssSource = `
@import "tailwindcss";

@theme {
  --breakpoint-xs: 30rem;
  --color-brand: #00d2ff;
  --color-brand-hover: #00b4db;
  --color-dark-950: #07090e;
  --color-dark-900: #0c1017;
  --color-dark-850: #111722;
  --color-dark-800: #17202f;
  --color-dark-750: #1a2435;
  --color-dark-border: #1e293b;
  --font-sans: "Cairo", "Readex Pro", sans-serif;
}
`;

function extractCandidates(content) {
  const candidates = new Set();
  // Match tokens that look like Tailwind utility classes
  const regex = /[a-zA-Z0-9_!:\-\[\]\/\.#%()]+/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const token = match[0];
    if (token.length >= 2 && token.length <= 120) {
      candidates.add(token);
    }
  }
  return Array.from(candidates);
}

async function main() {
  const allCandidates = new Set();
  for (const file of INPUT_FILES) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      for (const c of extractCandidates(content)) {
        allCandidates.add(c);
      }
    }
  }

  const compiler = await compile(cssSource, {
    loadStylesheet: async (id, base) => {
      if (id === 'tailwindcss') {
        const twPath = path.join(ROOT, 'node_modules/tailwindcss/index.css');
        return {
          path: twPath,
          base: path.dirname(twPath),
          content: fs.readFileSync(twPath, 'utf8'),
        };
      }
      const resolved = path.resolve(base, id);
      return {
        path: resolved,
        base: path.dirname(resolved),
        content: fs.readFileSync(resolved, 'utf8'),
      };
    },
  });

  const builtCss = compiler.build(Array.from(allCandidates));
  const outPath = path.join(ROOT, 'public/css/tailwind.min.css');
  fs.writeFileSync(outPath, builtCss, 'utf8');
  const sizeKb = (Buffer.byteLength(builtCss, 'utf8') / 1024).toFixed(1);
  console.log(`Built ${outPath} (${sizeKb} KB) from ${allCandidates.size} candidate tokens.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
