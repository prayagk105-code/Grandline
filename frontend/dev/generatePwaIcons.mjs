import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');
const iconsDir = path.join(publicDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// CRC32 table and function for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
  return chunk;
}

function createPng(width, height, drawPixel) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0 (None)
  const rawData = Buffer.alloc((width * 4 + 1) * height);
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixel(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Grandline Anchor Icon Drawing Function
function drawGrandlineIcon(isMaskable) {
  return (x, y, width, height) => {
    const cx = width / 2;
    const cy = height / 2;
    const r = width / 2;

    // Forest green brand colors: #1e4634 to #23533c
    const bgR = 0x23, bgG = 0x53, bgB = 0x3c;
    const creamR = 0xf8, creamG = 0xf6, creamB = 0xf0;
    const goldR = 0xd8, goldG = 0x65, goldB = 0x38; // Soft Orange accent

    // Normalized coordinates (-1 to 1)
    const nx = (x - cx) / (r * (isMaskable ? 0.8 : 0.88));
    const ny = (y - cy) / (r * (isMaskable ? 0.8 : 0.88));

    // Corner radius for standard app icon
    if (!isMaskable) {
      const cornerR = width * 0.22;
      const dx = Math.max(0, Math.abs(x - cx) - (cx - cornerR));
      const dy = Math.max(0, Math.abs(y - cy) - (cy - cornerR));
      if (dx * dx + dy * dy > cornerR * cornerR) {
        return [0, 0, 0, 0]; // Transparent outside rounded rect
      }
    }

    // Default icon background
    let col = [bgR, bgG, bgB, 255];

    // Subtle background radial gradient
    const distCenter = Math.sqrt(nx * nx + ny * ny);
    if (distCenter < 1.2) {
      const shade = Math.min(25, Math.floor(distCenter * 20));
      col[0] = Math.max(0, bgR - shade);
      col[1] = Math.max(0, bgG - shade);
      col[2] = Math.max(0, bgB - shade);
    }

    // Draw stylized Anchor symbol in Cream / Soft Orange
    // 1. Top ring
    const ringY = -0.42;
    const distRing = Math.sqrt(nx * nx + (ny - ringY) * (ny - ringY));
    if (distRing <= 0.17 && distRing >= 0.08) {
      return [creamR, creamG, creamB, 255];
    }

    // 2. Central vertical shank
    if (Math.abs(nx) <= 0.055 && ny >= -0.32 && ny <= 0.45) {
      return [creamR, creamG, creamB, 255];
    }

    // 3. Crossbar
    const crossY = -0.16;
    if (ny >= crossY - 0.045 && ny <= crossY + 0.045 && Math.abs(nx) <= 0.32) {
      return [creamR, creamG, creamB, 255];
    }
    // Crossbar ends
    if (Math.abs(nx) >= 0.30 && Math.abs(nx) <= 0.35 && ny >= crossY - 0.075 && ny <= crossY + 0.075) {
      return [goldR, goldG, goldB, 255];
    }

    // 4. Curved lower crescent / flukes
    const crescentY = 0.22;
    const distCrescent = Math.sqrt(nx * nx + (ny - crescentY) * (ny - crescentY));
    if (distCrescent >= 0.32 && distCrescent <= 0.43 && ny >= crescentY) {
      return [creamR, creamG, creamB, 255];
    }

    // 5. Fluke tips (arrows pointing upward on sides)
    if (Math.abs(nx) >= 0.34 && Math.abs(nx) <= 0.44 && ny >= 0.08 && ny <= 0.24) {
      const tipDist = Math.hypot(Math.abs(nx) - 0.39, ny - 0.14);
      if (tipDist <= 0.08) {
        return [goldR, goldG, goldB, 255];
      }
    }

    return col;
  };
}

// Generate PNGs
console.log('Generating Grandline PWA icons...');

const icon192 = createPng(192, 192, drawGrandlineIcon(false));
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), icon192);

const icon512 = createPng(512, 512, drawGrandlineIcon(false));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), icon512);

const iconMaskable = createPng(512, 512, drawGrandlineIcon(true));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512.png'), iconMaskable);

const appleTouchIcon = createPng(180, 180, drawGrandlineIcon(false));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), appleTouchIcon);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchIcon);

// Generate SVG vector icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2a5f45" />
      <stop offset="100%" stop-color="#1b4230" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <!-- Anchor Ring -->
  <circle cx="256" cy="148" r="44" fill="none" stroke="#f8f6f0" stroke-width="26" />
  <!-- Central Shank -->
  <line x1="256" y1="184" x2="256" y2="380" stroke="#f8f6f0" stroke-width="28" stroke-linecap="round" />
  <!-- Crossbar -->
  <line x1="168" y1="220" x2="344" y2="220" stroke="#f8f6f0" stroke-width="24" stroke-linecap="round" />
  <circle cx="166" cy="220" r="14" fill="#d86538" />
  <circle cx="346" cy="220" r="14" fill="#d86538" />
  <!-- Anchor Crescent Curve -->
  <path d="M 148 310 C 158 390 220 420 256 420 C 292 420 354 390 364 310" fill="none" stroke="#f8f6f0" stroke-width="28" stroke-linecap="round" />
  <!-- Left & Right Flukes -->
  <polygon points="148,290 128,335 168,335" fill="#d86538" />
  <polygon points="364,290 344,335 384,335" fill="#d86538" />
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);

console.log('PWA icons created successfully in frontend/public/icons!');

