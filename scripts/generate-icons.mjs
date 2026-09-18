import zlib from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i += 1) {
  let c = i;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[i] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function png(size, paint) {
  const stride = 1 + size * 3;
  const body = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y += 1) {
    body[y * stride] = 0;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b] = paint(x, y);
      const o = y * stride + 1 + x * 3;
      body[o] = r;
      body[o + 1] = g;
      body[o + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const idat = zlib.deflateSync(body);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

function mark(size) {
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  return png(size, (x, y) => {
    const dx = (x - cx) / size;
    const dy = (y - cy) / size;
    const r = Math.sqrt(dx * dx + dy * dy);
    const ring = Math.abs(r - 0.28) < 0.035;
    const bar = Math.abs(dx) < 0.03 && dy > -0.02 && dy < 0.32;
    if (r > 0.48) return [244, 234, 216];
    if (ring || bar) return [44, 36, 22];
    return [236, 222, 198];
  });
}

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "../public/icons");
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "icon-192.png"), mark(192));
writeFileSync(join(out, "icon-512.png"), mark(512));
writeFileSync(
  join(out, "icon.svg"),
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Psychical Excursion">
  <rect width="512" height="512" fill="#f4ead8"/>
  <circle cx="256" cy="236" r="148" fill="#ece0c6" stroke="#2c2416" stroke-width="28"/>
  <rect x="242" y="236" width="28" height="168" fill="#2c2416"/>
</svg>
`,
);
