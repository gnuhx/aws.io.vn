/**
 * Roots: server ghi file vào đúng thư mục làm việc của client — kể cả khi client đổi thư mục giữa phiên,
 * có báo (listChanged) hay KHÔNG báo. Server Nexus thật qua stdio.
 *   node scripts/roots-demo.ts
 */
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { connect, NEXUS_SERVER } from "../src/connect.ts";
import { enableRoots, type RootsHandle } from "../src/roots.ts";

const base = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "roots-")));
const A = path.join(base, "Dự án A"); // dấu cách + tiếng Việt: URI sẽ là …/D%E1%BB%B1%20%C3%A1n%20A
const B = path.join(base, "du-an-b");
await fs.mkdir(A);
await fs.mkdir(B);
const serverDir = path.join(base, "server-exports");
const show = (p: string): string => path.relative(base, p);

let wrong = 0;
type Exp = (filename: string, expectDir: string) => Promise<void>;
async function session(label: string, roots: string[] | null, notify: boolean, steps: (h: RootsHandle | null, exp: Exp) => Promise<void>): Promise<void> {
  console.log(`— ${label}`);
  let handle: RootsHandle | null = null;
  const s = await connect(
    { ...NEXUS_SERVER, env: { NEXUS_EXPORT_DIR: serverDir, NEXUS_LOG_LEVEL: "warn" } },
    {
      capabilities: roots ? { roots: { listChanged: notify } } : {},
      setup: (c) => {
        if (roots) handle = enableRoots(c, roots, notify);
      },
    },
  );
  const exp: Exp = async (filename, expectDir) => {
    const r = await s.client.callTool({ name: "nexus_export_tasks", arguments: { filename, assignee: "lan" } });
    const d = r.structuredContent as { location: string; root: string; path: string; rows: number; note: string } | undefined;
    if (r.isError || !d) {
      console.log(`  ✗ ${filename}: ${JSON.stringify(r.content)}`);
      wrong++;
      return;
    }
    const exists = async (dir: string): Promise<boolean> => fs.stat(path.join(dir, d.path)).then(() => true, () => false);
    const found = (await Promise.all([A, B, serverDir].map(async (dir) => ((await exists(dir)) ? dir : null)))).filter((x) => x !== null);
    const ok = found.length === 1 && found[0] === expectDir;
    if (!ok) wrong++;
    console.log(`  ${ok ? "✓" : "✗"} ${filename} → ${found.map((f) => show(path.join(f, d.path))).join(", ") || "(không thấy)"} · ${d.rows} dòng · ${d.note}`);
  };
  await steps(handle, exp);
  await s.close();
}

await session("client báo đổi roots (listChanged: true)", [A], true, async (h, exp) => {
  await exp("lan-1.csv", A);
  await exp("lan-2.csv", A);
  await h?.set([B]); // đổi thư mục + gửi notifications/roots/list_changed
  await exp("lan-3.csv", B);
});
await session("client KHÔNG báo (listChanged: false)", [A], false, async (h, exp) => {
  await exp("lan-4.csv", A);
  await h?.set([B]); // đổi im lặng
  await exp("lan-5.csv", B);
});
await session("client không hỗ trợ roots", null, false, async (_h, exp) => {
  await exp("lan-6.csv", serverDir);
});
await fs.rm(base, { recursive: true, force: true });
console.log(wrong ? `FAILED: ${wrong} file sai chỗ` : "OK: 6/6 file đúng thư mục");
process.exit(wrong ? 1 : 0);
