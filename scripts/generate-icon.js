// Generates assets/icon.png (a simple dark rounded square with a blue "D")
// using only Node's built-in zlib — no native deps.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 32;

// 5x7 bitmap font for the glyph "D".
const GLYPH_D = [
  '1110',
  '1001',
  '1001',
  '1001',
  '1001',
  '1001',
  '1110',
];

function makePixels() {
  const px = new Uint8Array(SIZE * SIZE * 4); // RGBA
  const radius = 6;

  const bg = [30, 33, 43]; // card-ish dark
  const fg = [91, 140, 255]; // accent blue

  const inCorner = (x, y) => {
    const cx = x < radius ? radius : x >= SIZE - radius ? SIZE - radius - 1 : x;
    const cy = y < radius ? radius : y >= SIZE - radius ? SIZE - radius - 1 : y;
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy > radius * radius;
  };

  // Glyph placement (scaled x2 -> 8x14, centered).
  const gW = GLYPH_D[0].length * 2;
  const gH = GLYPH_D.length * 2;
  const gx0 = Math.floor((SIZE - gW) / 2);
  const gy0 = Math.floor((SIZE - gH) / 2);

  const glyphAt = (x, y) => {
    const lx = x - gx0;
    const ly = y - gy0;
    if (lx < 0 || ly < 0 || lx >= gW || ly >= gH) return false;
    return GLYPH_D[Math.floor(ly / 2)][Math.floor(lx / 2)] === '1';
  };

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4;
      const transparent = inCorner(x, y);
      if (transparent) {
        px[i + 3] = 0;
        continue;
      }
      const color = glyphAt(x, y) ? fg : bg;
      px[i] = color[0];
      px[i + 1] = color[1];
      px[i + 2] = color[2];
      px[i + 3] = 255;
    }
  }
  return px;
}

// ---- PNG encoding ----
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Raw scanlines with filter byte 0.
  const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
  for (let y = 0; y < SIZE; y++) {
    raw[y * (SIZE * 4 + 1)] = 0;
    pixels.subarray(y * SIZE * 4, (y + 1) * SIZE * 4).forEach((v, idx) => {
      raw[y * (SIZE * 4 + 1) + 1 + idx] = v;
    });
  }
  const idat = zlib.deflateSync(raw);

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'icon.png');
fs.writeFileSync(outPath, encodePng(makePixels()));
console.log('Wrote', outPath);
