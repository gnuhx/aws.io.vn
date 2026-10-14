/**
 * Completion trên dữ liệu lớn: 30 khách mẫu + 10 000 khách sinh thêm, qua server + client SDK thật (InMemoryTransport).
 *   node scripts/complete-probe.ts
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { CITIES, CustomerSchema, PROMPT, RESOURCE, type Customer } from "@nexus/shared";
import { createMemoryCustomers } from "../src/customers/memory-repository.ts";
import { SEED_CUSTOMERS } from "../src/customers/seed-data.ts";
import { createDeps } from "../src/deps.ts";
import { loadEnv } from "../src/env.ts";
import { createServer } from "../src/server.ts";

const extra: Customer[] = Array.from({ length: 10_000 }, (_, i) =>
  CustomerSchema.parse({
    id: `cus_${String(i + 31).padStart(5, "0")}`,
    name: `${i % 3 === 0 ? "Cà phê" : i % 3 === 1 ? "Tạp hóa" : "Công ty"} số ${i + 31}`,
    city: CITIES[i % CITIES.length],
    tier: "free",
    email: `kh${i + 31}@nexus.example`,
    industry: "retail",
    address: "",
    note: "",
  }),
);
const deps = createDeps(loadEnv({ NEXUS_LOG_LEVEL: "warn" }), { customers: createMemoryCustomers([...SEED_CUSTOMERS, ...extra]) });
const [ct, st] = InMemoryTransport.createLinkedPair();
await createServer(deps).connect(st);
const client = new Client({ name: "complete-probe", version: "0.6.0" });
await client.connect(ct);

async function probe(label: string, ref: Parameters<typeof client.complete>[0]["ref"], name: string, value: string, ctx?: Record<string, string>): Promise<void> {
  const t0 = performance.now();
  const r = await client.complete({ ref, argument: { name, value }, ...(ctx ? { context: { arguments: ctx } } : {}) });
  const ms = (performance.now() - t0).toFixed(1);
  const c = r.completion;
  console.log(`${label.padEnd(44)} ${String(c.values.length).padStart(3)} gợi ý · total=${c.total ?? "—"} · hasMore=${String(c.hasMore)} · ${ms} ms`);
  console.log(`  ${c.values.slice(0, 5).join(", ")}${c.values.length > 5 ? ", …" : ""}`);
}

const brief = { type: "ref/prompt", name: PROMPT.customerBrief } as const;
const tpl = { type: "ref/resource", uri: RESOURCE.customerTemplate } as const;
console.log(`dữ liệu: ${SEED_CUSTOMERS.length + extra.length} khách`);
await probe('customer = ""', brief, "customer", "");
await probe('customer = "ca"', brief, "customer", "ca");
await probe('customer = "ca", city = Đà Nẵng (context)', brief, "customer", "ca", { city: "Đà Nẵng" });
await probe('customer = "quan gio"  (gõ không dấu)', brief, "customer", "quan gio");
await probe('customer = "cus_0999"', brief, "customer", "cus_0999");
await probe('nexus://customers/{id}, id = "cus_00"', tpl, "id", "cus_00");
await probe('nexus://customers/{id}, id = "xyz"', tpl, "id", "xyz");
await client.close();
