import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buildServer } from "./server.ts";
import { createFileStore, createMemoryStore } from "./store.ts";

// S7.1 — cùng buildServer() với bản HTTP; chỉ khác transport. Local, không auth (process con của client).
const store = process.env["DATA_FILE"] ? createFileStore(process.env["DATA_FILE"]) : createMemoryStore();
const server = buildServer({ store, instance: "stdio", log: (l) => process.stderr.write(`${l}\n`) });
await server.connect(new StdioServerTransport());
