/**
 * Bộ mã hóa PNG tối thiểu (RGBA 8-bit, không nén thông minh) + vẽ biểu đồ cột.
 * Không phụ thuộc thư viện ngoài: node:zlib cho deflate, CRC32 tự tính.
 */
import { deflateSync } from "node:zlib";

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

export function encodePng(width: number, height: number, rgba: Uint8Array): Buffer {
  if (rgba.length !== width * height * 4) throw new RangeError("rgba size mismatch");
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: None
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 6, 0, 0, 0], 8); // 8-bit, RGBA, deflate, adaptive, no interlace
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", new Uint8Array())]);
}

export type Rgb = readonly [number, number, number];

/** Biểu đồ cột ngang hàng: mỗi giá trị 1 cột, cao theo tỉ lệ với giá trị lớn nhất. */
export function barChartPng(values: readonly number[], opts: { width: number; height: number; colors: readonly Rgb[] }): Buffer {
  const { width: w, height: h } = opts;
  const px = new Uint8Array(w * h * 4).fill(255);
  const set = (x: number, y: number, [r, g, b]: Rgb) => {
    const i = (y * w + x) * 4;
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
  };
  const pad = 16;
  const baseY = h - pad;
  for (let x = pad; x < w - pad; x++) set(x, baseY, [107, 74, 51]); // trục ngang
  const max = Math.max(1, ...values);
  const slot = (w - 2 * pad) / Math.max(1, values.length);
  values.forEach((v, i) => {
    const barH = Math.round(((h - 2 * pad) * v) / max);
    const x0 = Math.round(pad + i * slot + slot * 0.15);
    const x1 = Math.round(pad + (i + 1) * slot - slot * 0.15);
    const color = opts.colors[i % opts.colors.length] ?? [184, 88, 58];
    for (let x = x0; x < x1; x++) for (let y = baseY - barH; y < baseY; y++) set(x, y, color);
  });
  return encodePng(w, h, px);
}
