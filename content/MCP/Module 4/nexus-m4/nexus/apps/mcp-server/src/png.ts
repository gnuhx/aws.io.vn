import { deflateSync } from "node:zlib";

// Mã hóa PNG tối giản (RGB 8-bit, không alpha) bằng node:zlib + CRC32 — không cần thư viện ảnh native.
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of buf) c = (CRC_TABLE[(c ^ b) & 0xff] ?? 0) ^ (c >>> 8);
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

export type Rgb = readonly [number, number, number];

export function encodePng(width: number, height: number, pixel: (x: number, y: number) => Rgb): Buffer {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    raw[row] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixel(x, y);
      raw[row + 1 + x * 3] = r;
      raw[row + 2 + x * 3] = g;
      raw[row + 3 + x * 3] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

/** Biểu đồ cột đơn giản (không chữ — nhãn đi kèm dạng text trong kết quả tool). */
export function barChartPng(values: readonly number[], width = 480, height = 240): Buffer {
  const BG: Rgb = [255, 252, 246];
  const BAR: Rgb = [184, 88, 58];
  const AXIS: Rgb = [107, 74, 51];
  const pad = 24;
  const max = Math.max(1, ...values);
  const slot = (width - pad * 2) / Math.max(1, values.length);
  const barW = Math.floor(slot * 0.6);
  return encodePng(width, height, (x, y) => {
    if (y === height - pad || x === pad) return AXIS;
    const i = Math.floor((x - pad) / slot);
    const v = values[i];
    if (v === undefined || x < pad) return BG;
    const left = pad + i * slot + (slot - barW) / 2;
    const top = height - pad - Math.round(((height - pad * 2) * v) / max);
    return x >= left && x < left + barW && y >= top && y < height - pad ? BAR : BG;
  });
}
