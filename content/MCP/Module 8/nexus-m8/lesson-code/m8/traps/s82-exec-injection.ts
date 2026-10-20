/**
 * BẪY S8.2 — tool trở thành đường thực thi mã tùy ý. Tham số tool do MODEL điền, mà model đọc dữ liệu kẻ tấn công viết
 * (S8.2: ghi chú khách, issue GitHub, email…). Tool ghép tham số vào lệnh shell = cho kẻ tấn công gõ lệnh trên máy bạn.
 * 3 bản của cùng 1 tool `git_log`, mỗi bản bị tấn công 2 kiểu. Chạy trong 1 repo git tạm, lệnh "độc" chỉ tạo file.
 *   node traps/s82-exec-injection.ts
 */
import { exec, execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const sh = promisify(exec);
const run = promisify(execFile);
const repo = fs.mkdtempSync(path.join(os.tmpdir(), "git-log-trap-"));
for (const cmd of ["git init -q", "git config user.email a@b.c", "git config user.name demo"]) await sh(cmd, { cwd: repo });
for (const msg of ["khởi tạo", "thêm báo cáo", "sửa lỗi"]) await sh(`git commit -q --allow-empty -m "${msg}"`, { cwd: repo });

type Impl = (ref: string) => Promise<string>;
const IMPLS: Record<string, Impl> = {
  // ① dịch thẳng từ C# Process.Start("bash", $"-c \"git log {ref}\"") — chuỗi đi qua SHELL
  "exec + chuỗi": async (ref) => (await sh(`git log --oneline -n 3 ${ref}`, { cwd: repo })).stdout,
  // ② không qua shell: ; | $( ) mất tác dụng — nhưng ref bắt đầu bằng "-" vẫn là OPTION của git
  "execFile + mảng": async (ref) => (await run("git", ["log", "--oneline", "-n", "3", ref], { cwd: repo })).stdout,
  // ③ allowlist cú pháp ref + --end-of-options: tham số chỉ còn là DỮ LIỆU
  "execFile + allowlist + --end-of-options": async (ref) => {
    if (!/^[A-Za-z0-9][A-Za-z0-9._/~^-]{0,99}$/.test(ref)) throw new Error(`ref không hợp lệ: ${JSON.stringify(ref)}`);
    return (await run("git", ["log", "--oneline", "-n", "3", "--end-of-options", ref], { cwd: repo })).stdout;
  },
};
const ATTACKS = { "bình thường": "HEAD", "shell injection": "HEAD; echo PWNED > pwned.txt", "option injection": "--output=leak.txt" };

for (const [label, impl] of Object.entries(IMPLS)) {
  const server = new McpServer({ name: "git-tools", version: "1.0.0" });
  server.registerTool("git_log", { description: "3 commit gần nhất của 1 ref", inputSchema: { ref: z.string() } }, async ({ ref }) => {
    try {
      return { content: [{ type: "text", text: (await impl(ref)).trim() || "(rỗng)" }] };
    } catch (e) {
      return { isError: true, content: [{ type: "text", text: e instanceof Error ? e.message.split("\n")[0] ?? "" : String(e) }] };
    }
  });
  const client = new Client({ name: "trap", version: "1.0.0" });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  await server.connect(st);
  await client.connect(ct);
  console.log(`── ${label}`);
  for (const [attack, ref] of Object.entries(ATTACKS)) {
    for (const f of ["pwned.txt", "leak.txt"]) fs.rmSync(path.join(repo, f), { force: true });
    const r = await client.callTool({ name: "git_log", arguments: { ref } });
    const text = (r.content as { text: string }[])[0]?.text.replace(/\n/g, " | ") ?? "";
    const made = ["pwned.txt", "leak.txt"].filter((f) => fs.existsSync(path.join(repo, f)));
    console.log(`   ${attack.padEnd(16)} ref=${JSON.stringify(ref).padEnd(32)} ${r.isError ? "[isError] " : ""}${text.slice(0, 70)}`);
    if (made.length) console.log(`   ${"".padEnd(16)} ✗ file bị tạo trên máy server: ${made.join(", ")}`);
  }
  await client.close();
}
fs.rmSync(repo, { recursive: true, force: true });
