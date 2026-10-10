import "server-only";
import { serverEnv } from "./env.server.ts";

// Chỉ throw thì Next 16 in lỗi nhưng process vẫn sống (request nào cũng 500) → thoát tường minh.
try {
  serverEnv();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
