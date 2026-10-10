import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  transpilePackages: ["@nexus/shared"],
  serverExternalPackages: ["@modelcontextprotocol/sdk"],
};

export default config;
