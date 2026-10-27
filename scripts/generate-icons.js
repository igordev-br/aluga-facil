const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    const crc = crc32(buf.slice(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  const scanlineWidth = 1 + width * 3;
  const rawData = Buffer.alloc(height * scanlineWidth);
  for (let y = 0; y < height; y++) {
    const offset = y * scanlineWidth;
    rawData[offset] = 0;
    for (let x = 0; x < width; x++) {
      const px = offset + 1 + x * 3;
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist < width * 0.44) {
        rawData[px] = r;
        rawData[px + 1] = g;
        rawData[px + 2] = b;
      } else {
        rawData[px] = 23; // #17324D
        rawData[px + 1] = 50;
        rawData[px + 2] = 77;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

const pub = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(pub, 'pwa-192x192.png'), createPng(192, 192, 37, 99, 235));
fs.writeFileSync(path.join(pub, 'pwa-512x512.png'), createPng(512, 512, 37, 99, 235));
fs.writeFileSync(path.join(pub, 'pwa-maskable-512x512.png'), createPng(512, 512, 23, 50, 77));
fs.writeFileSync(path.join(pub, 'apple-touch-icon.png'), createPng(180, 180, 37, 99, 235));
fs.writeFileSync(path.join(pub, 'favicon.ico'), createPng(32, 32, 37, 99, 235));
console.log('SUCCESS: PWA PNG icons created in public folder');
