import type { NextConfig } from "next";

const config: NextConfig = {
  // Typecheck chạy riêng bằng `pnpm typecheck` (tsc 7 native) — không để next build tự gọi TS.
  typescript: { ignoreBuildErrors: true },
  // Import file .ts có đuôi (quy ước của cả repo)
  transpilePackages: ["@nexus/shared"],
  serverExternalPackages: ["@modelcontextprotocol/sdk"],
};

export default config;
