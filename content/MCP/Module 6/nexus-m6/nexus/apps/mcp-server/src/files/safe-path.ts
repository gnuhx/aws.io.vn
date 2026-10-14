import { constants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

/** Đường dẫn đã qua 3 lớp kiểm (M5 · S5.1). Chỉ file này tạo được giá trị kiểu SafePath. */
declare const SAFE: unique symbol;
export type SafePath = string & { readonly [SAFE]: true };

const inside = (root: string, abs: string): boolean => {
  const rel = path.relative(root, abs);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
};

/** realpath thư mục gốc 1 lần (macOS: /var → /private/var). Tạo nếu chưa có. */
export async function openRoot(dir: string): Promise<string> {
  await fs.mkdir(dir, { recursive: true });
  return fs.realpath(dir);
}

export type NewPath = { ok: true; path: SafePath; rel: string } | { ok: false; reason: "outside" };

/** Tên file mới trong root: chuẩn hóa → so theo đoạn → realpath thư mục cha → so lại. */
export async function resolveNew(root: string, rel: string): Promise<NewPath> {
  const abs = path.resolve(root, rel);
  if (!inside(root, abs)) return { ok: false, reason: "outside" };
  const parent = path.dirname(abs);
  await fs.mkdir(parent, { recursive: true });
  const realParent = await fs.realpath(parent);
  const real = path.join(realParent, path.basename(abs));
  if (realParent !== root && !inside(root, realParent)) return { ok: false, reason: "outside" };
  return { ok: true, path: real as SafePath, rel: path.relative(root, real) };
}

export type Written = { ok: true; bytes: number } | { ok: false; reason: "exists" | "outside" };

/** Tạo mới bằng O_EXCL (không ghi xuyên symlink); ghi đè chỉ khi overwrite, với O_NOFOLLOW. */
export async function writeFileSafe(p: SafePath, data: string, overwrite: boolean): Promise<Written> {
  const flags = overwrite
    ? constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW
    : constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL;
  try {
    const fh = await fs.open(p, flags, 0o640);
    try {
      const buf = Buffer.from(data, "utf8");
      await fh.writeFile(buf);
      return { ok: true, bytes: buf.length };
    } finally {
      await fh.close();
    }
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "EEXIST") return { ok: false, reason: "exists" };
    if (code === "ELOOP") return { ok: false, reason: "outside" };
    throw e;
  }
}
