// node scripts/query-probe.ts — gửi filter hợp lệ và filter độc tới nexus_query (server thật qua stdio).
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { TOOL } from "@nexus/shared";
import { connect } from "./client.ts";

const CASES: Array<[string, Record<string, unknown>]> = [
  ["hợp lệ: đơn ≥ 45 triệu", { collection: "orders", filter: { status: "paid", amount: { $gte: 45_000_000 } }, limit: 1 }],
  ["hợp lệ: $or + $in", { collection: "customers", filter: { $or: [{ city: "Đà Nẵng" }, { tier: { $in: ["enterprise"] } }] }, limit: 1 }],
  ["$where (chạy JS)", { collection: "customers", filter: { $where: "sleep(5000) || true" } }],
  ["$where lồng trong $or", { collection: "customers", filter: { $or: [{ city: "Hà Nội" }, { $where: "1" }] } }],
  ["$expr + $function", { collection: "orders", filter: { $expr: { $function: { body: "function(){return true}", args: [], lang: "js" } } } }],
  ["$function trên field", { collection: "orders", filter: { amount: { $function: { body: "function(){}", args: [], lang: "js" } } } }],
  ["regex ReDoS (a+)+", { collection: "customers", filter: { name: { $regex: "^(a+)+$" } } }],
  ["field không có", { collection: "customers", filter: { passwordHash: { $exists: true } } }],
  ["collection ngoài whitelist", { collection: "users", filter: {} }],
  ["fields lạ", { collection: "orders", filter: {}, fields: ["id", "cardNumber"] }],
];

const client = await connect();
for (const [label, args] of CASES) {
  try {
    const r = (await client.callTool({ name: TOOL.query, arguments: args })) as CallToolResult;
    const text = r.content.map((c) => (c.type === "text" ? c.text : "")).join("");
    if (r.isError) console.log(`✗ ${label.padEnd(26)} → ${text.length > 140 ? `${text.slice(0, 140)}…` : text}`);
    else {
      const s = r.structuredContent as { matched: number; returned: number };
      console.log(`✓ ${label.padEnd(26)} → matched ${s.matched}, returned ${s.returned}`);
    }
  } catch (err) {
    console.log(`✗ ${label.padEnd(26)} → [protocol error] ${String(err).slice(0, 120)}`);
  }
}
await client.close();
