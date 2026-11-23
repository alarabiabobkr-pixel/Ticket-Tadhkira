import fs from 'node:fs';
import zlib from 'node:zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  const crcVal = crc32(typeAndData);
  buf.writeUInt32BE(crcVal, 8 + len);
  return buf;
}

function generateIconPNG(size, outputPath) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace 0
  const ihdr = makeChunk('IHDR', ihdrData);

  // Scanlines: size rows, each row has 1 filter byte (0) + size * 4 bytes RGBA
  const rawBytes = Buffer.alloc((1 + size * 4) * size);
  const center = size / 2;
  const radius = size * 0.45;

  let offset = 0;
  for (let y = 0; y < size; y++) {
    rawBytes[offset++] = 0; // Filter None
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Play icon triangle definition:
      // Triangle points: (-size*0.12, -size*0.22), (-size*0.12, size*0.22), (size*0.24, 0)
      const px = dx;
      const py = dy;
      const x1 = -size * 0.12, y1 = -size * 0.22;
      const x2 = -size * 0.12, y2 = size * 0.22;
      const x3 = size * 0.24, y3 = 0;

      // In triangle test
      const sign = (p1x, p1y, p2x, p2y, p3x, p3y) => (p1x - p3x) * (p2y - p3y) - (p2x - p3x) * (p1y - p3y);
      const d1 = sign(px, py, x1, y1, x2, y2);
      const d2 = sign(px, py, x2, y2, x3, y3);
      const d3 = sign(px, py, x3, y3, x1, y1);
      const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
      const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
      const inTriangle = !(hasNeg && hasPos);

      // Rounded background squircle / circle
      if (dist <= radius) {
        if (inTriangle) {
          // Play button (dark inside)
          rawBytes[offset++] = 10;
          rawBytes[offset++] = 13;
          rawBytes[offset++] = 20;
          rawBytes[offset++] = 255;
        } else {
          // Vibrant Cyan Brand Gradient (#00d2ff to #38bdf8)
          const grad = (y / size);
          rawBytes[offset++] = Math.round(0 * (1 - grad) + 56 * grad);
          rawBytes[offset++] = Math.round(210 * (1 - grad) + 189 * grad);
          rawBytes[offset++] = Math.round(255 * (1 - grad) + 248 * grad);
          rawBytes[offset++] = 255;
        }
      } else {
        // Outside circle - dark applet background
        rawBytes[offset++] = 7;
        rawBytes[offset++] = 9;
        rawBytes[offset++] = 14;
        rawBytes[offset++] = 255;
      }
    }
  }

  const deflated = zlib.deflateSync(rawBytes);
  const idat = makeChunk('IDAT', deflated);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  const png = Buffer.concat([signature, ihdr, idat, iend]);
  fs.writeFileSync(outputPath, png);
  console.log(`Generated ${outputPath} (${size}x${size})`);
}

generateIconPNG(192, 'public/pwa-192x192.png');
generateIconPNG(512, 'public/pwa-512x512.png');
generateIconPNG(512, 'public/pwa-maskable-512x512.png');
generateIconPNG(180, 'public/apple-touch-icon.png');
