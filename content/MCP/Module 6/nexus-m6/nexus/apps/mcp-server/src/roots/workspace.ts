import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { RootsListChangedNotificationSchema } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { Logger } from "../log.ts";

export interface Root {
  dir: string; // đường dẫn thật trên đĩa (realpath)
  name: string;
}
export type RootsView = { kind: "client"; roots: Root[]; fetched: "cache" | "fresh" } | { kind: "unsupported" };
export interface RootsTracker {
  current(): Promise<RootsView>;
}

/**
 * Thư mục làm việc của client (roots). Cache CHỈ khi client hứa báo thay đổi (roots.listChanged);
 * không thì hỏi lại mỗi lần — client đổi roots mà không báo, server vẫn đúng.
 */
export function trackRoots(server: Server, log: Logger): RootsTracker {
  let cache: Root[] | undefined;
  let gen = 0; // tăng mỗi lần client báo đổi — kết quả fetch cũ về muộn không được ghi đè cache mới
  server.setNotificationHandler(RootsListChangedNotificationSchema, async () => {
    gen++;
    cache = undefined;
    log.info("client báo roots đổi — bỏ cache");
  });

  async function fetchRoots(): Promise<Root[]> {
    const { roots } = await server.listRoots();
    const out: Root[] = [];
    for (const r of roots) {
      if (!r.uri.startsWith("file://")) {
        log.warn("bỏ root không phải file://", { uri: r.uri });
        continue;
      }
      try {
        const dir = await fs.realpath(fileURLToPath(r.uri)); // %20, ký tự Unicode… → fileURLToPath, không replace
        if ((await fs.stat(dir)).isDirectory()) out.push({ dir, name: r.name ?? dir });
      } catch {
        log.warn("root không tồn tại trên máy server", { uri: r.uri });
      }
    }
    return out;
  }

  return {
    async current() {
      const caps = server.getClientCapabilities()?.roots;
      if (!caps) return { kind: "unsupported" };
      if (caps.listChanged && cache) return { kind: "client", roots: cache, fetched: "cache" };
      const g = gen;
      const roots = await fetchRoots();
      if (caps.listChanged && g === gen) cache = roots;
      return { kind: "client", roots, fetched: "fresh" };
    },
  };
}
