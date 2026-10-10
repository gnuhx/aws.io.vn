import { deflateSync } from "node:zlib";

/** PNG biểu đồ cột tối giản, không thư viện (M3 · S3.4). */
const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = (CRC[(c ^ b) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

export function barChartPng(values: readonly number[], width = 320, height = 160): Buffer {
  const max = Math.max(1, ...values);
  const bar = Math.floor(width / Math.max(1, values.length));
  const raw = Buffer.alloc((width * 3 + 1) * height, 0xff);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 3 + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const i = Math.floor(x / bar);
      const v = values[i];
      const top = v === undefined ? height : height - Math.round((v / max) * (height - 10));
      if (y >= top && x % bar > 3) {
        const o = y * (width * 3 + 1) + 1 + x * 3;
        raw[o] = 0xb8;
        raw[o + 1] = 0x58;
        raw[o + 2] = 0x3a;
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
