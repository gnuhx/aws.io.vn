import "server-only";
import { serverEnv } from "./env.server.ts";

try {
  const env = serverEnv();
  process.stderr.write(`[nexus-web] env OK · LLM_PROVIDER=${env.LLM_PROVIDER} · NEXUS_DATA=${env.NEXUS_DATA}\n`);
} catch (err) {
  process.stderr.write(`[nexus-web] ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
}
