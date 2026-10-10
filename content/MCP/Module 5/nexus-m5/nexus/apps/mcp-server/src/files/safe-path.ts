import { constants, type Stats } from "node:fs";
import { mkdir, open, realpath, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Đọc/ghi file trong 1 thư mục cho phép (M5 · S5.1).
 *
 * 3 lớp, lớp sau không tin lớp trước:
 *   1. Schema (ExportPathSchema): chỉ cho ký tự an toàn — chặn "..", "%2e", "\", NUL ngay ở -32602.
 *   2. Chuẩn hóa về đường dẫn tuyệt đối (path.resolve) rồi mới so với root bằng path.relative.
 *   3. realpath: đi theo symlink tới file thật rồi so lại — symlink trong thư mục export trỏ ra ngoài bị chặn.
 * Mở file bằng O_NOFOLLOW; ghi file mới bằng O_EXCL (không bao giờ đi theo symlink có sẵn ở tên đích).
 */

declare const SAFE: unique symbol;
/** Đường dẫn tuyệt đối đã được CHỨNG MINH nằm trong root. Chỉ hàm trong file này tạo ra được. */
export type SafePath = string & { readonly [SAFE]: true };

export type Denied = { ok: false; reason: "outside" | "not_found" | "not_file" | "exists"; detail: string };
export type Resolved = { ok: true; path: SafePath; rel: string; stats: Stats };

const deny = (reason: Denied["reason"], detail: string): Denied => ({ ok: false, reason, detail });

/** Tạo thư mục export nếu chưa có và trả realpath của nó — root phải là đường dẫn thật (macOS: /var → /private/var). */
export async function openRoot(dir: string): Promise<string> {
  await mkdir(dir, { recursive: true });
  return realpath(dir);
}

/** p nằm TRONG root? So theo đoạn đường dẫn, không so chuỗi: "/srv/exports-evil" không nằm trong "/srv/exports". */
function within(root: string, p: string, allowRoot = false): boolean {
  const rel = path.relative(root, p);
  if (rel === "") return allowRoot;
  return rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel);
}

/** File đã tồn tại (để đọc). */
export async function resolveExisting(root: string, userPath: string): Promise<Resolved | Denied> {
  if (userPath.includes("\0")) return deny("outside", "có ký tự NUL");
  const lexical = path.resolve(root, userPath); // lớp 2
  if (!within(root, lexical)) return deny("outside", "chuẩn hóa xong nằm ngoài thư mục export");
  let real: string;
  try {
    real = await realpath(lexical); // lớp 3
  } catch (err) {
    if (isCode(err, "ENOENT") || isCode(err, "ENOTDIR")) return deny("not_found", "không có file này");
    throw err;
  }
  if (!within(root, real)) return deny("outside", "symlink trỏ ra ngoài thư mục export");
  const stats = await stat(real);
  if (!stats.isFile()) return deny("not_file", "không phải file thường");
  return { ok: true, path: real as SafePath, rel: path.relative(root, real), stats };
}

/** Tên file mới (để ghi) — thư mục cha phải có thật và nằm trong root. */
export async function resolveNew(root: string, userPath: string): Promise<{ ok: true; path: SafePath; rel: string } | Denied> {
  if (userPath.includes("\0")) return deny("outside", "có ký tự NUL");
  const lexical = path.resolve(root, userPath);
  if (!within(root, lexical)) return deny("outside", "chuẩn hóa xong nằm ngoài thư mục export");
  let parent: string;
  try {
    parent = await realpath(path.dirname(lexical));
  } catch {
    return deny("not_found", "thư mục cha không tồn tại");
  }
  if (!within(root, parent, true)) return deny("outside", "thư mục cha là symlink ra ngoài");
  const target = path.join(parent, path.basename(lexical));
  return { ok: true, path: target as SafePath, rel: path.relative(root, target) };
}

/** Đọc tối đa maxBytes đầu file. O_NOFOLLOW: nếu file vừa bị đổi thành symlink sau realpath → ELOOP. */
export async function readHead(p: SafePath, maxBytes: number): Promise<{ text: string; bytes: number; truncated: boolean }> {
  const fh = await open(p, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const { size } = await fh.stat();
    const buf = Buffer.alloc(Math.min(size, maxBytes));
    const { bytesRead } = await fh.read(buf, 0, buf.length, 0);
    // Không cắt giữa 1 ký tự UTF-8 nhiều byte
    let end = bytesRead;
    while (end > 0 && end < size && ((buf[end] ?? 0) & 0xc0) === 0x80) end--;
    return { text: buf.subarray(0, end).toString("utf8"), bytes: size, truncated: size > end };
  } finally {
    await fh.close();
  }
}

/** Ghi file. overwrite=false → O_EXCL (đã có, kể cả symlink, là lỗi); true → O_NOFOLLOW + O_TRUNC. */
export async function writeFileSafe(p: SafePath, data: string, overwrite: boolean): Promise<{ ok: true; bytes: number } | Denied> {
  const flags = overwrite
    ? constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW
    : constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL;
  let fh;
  try {
    fh = await open(p, flags, 0o644);
  } catch (err) {
    if (isCode(err, "EEXIST")) return deny("exists", "file đã có");
    if (isCode(err, "ELOOP")) return deny("outside", "tên đích là symlink");
    throw err;
  }
  try {
    await fh.writeFile(data, "utf8");
    return { ok: true, bytes: Buffer.byteLength(data) };
  } finally {
    await fh.close();
  }
}

function isCode(err: unknown, code: string): boolean {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === code;
}
