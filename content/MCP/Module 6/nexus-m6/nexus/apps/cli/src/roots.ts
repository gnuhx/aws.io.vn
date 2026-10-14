import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { ListRootsRequestSchema, type Root } from "@modelcontextprotocol/sdk/types.js";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** Danh sách thư mục làm việc client cho server biết. Đổi được giữa phiên. */
export interface RootsHandle {
  set(dirs: string[]): Promise<void>;
}

/**
 * Trả lời roots/list. `notify` = client có báo khi đổi không (khai trong capability `roots.listChanged`).
 * Không báo → server phải tự hỏi lại; báo → server được phép cache.
 */
export function enableRoots(client: Client, initial: string[], notify: boolean): RootsHandle {
  let roots: Root[] = [];
  const toRoots = (dirs: string[]): Root[] =>
    dirs.map((d) => ({ uri: pathToFileURL(path.resolve(d)).href, name: path.basename(path.resolve(d)) }));
  roots = toRoots(initial);
  client.setRequestHandler(ListRootsRequestSchema, async () => ({ roots }));
  return {
    async set(dirs: string[]) {
      roots = toRoots(dirs);
      if (notify) await client.sendRootsListChanged();
    },
  };
}
