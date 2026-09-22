// Tiny tileable film-grain texture (grey + alpha PNG). Usage: node scripts/gen-grain.mjs
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const S = 160;
let seed = 1337;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

const raw = Buffer.alloc((S * 2 + 1) * S);
for (let y = 0; y < S; y++) {
  raw[y * (S * 2 + 1)] = 0;
  for (let x = 0; x < S; x++) {
    const v = rand();
    const o = y * (S * 2 + 1) + 1 + x * 2;
    raw[o] = v > 0.5 ? 255 : 0; // light or dark speck
    raw[o + 1] = Math.round(Math.abs(v - 0.5) * 2 * 255 * 0.55);
  }
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0);
ihdr.writeUInt32BE(S, 4);
ihdr[8] = 8;
ihdr[9] = 4;
writeFileSync(
  'public/img/grain.png',
  Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]),
);
console.log('wrote public/img/grain.png');
