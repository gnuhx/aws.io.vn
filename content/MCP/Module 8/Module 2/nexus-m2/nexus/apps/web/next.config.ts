import type { NextConfig } from "next";

const config: NextConfig = {
  // Docker (S2.5): gom server + node_modules cần thiết vào .next/standalone
  output: "standalone",
  // @nexus/shared export thẳng file .ts → Next phải biên dịch nó
  transpilePackages: ["@nexus/shared"],
};

export default config;
