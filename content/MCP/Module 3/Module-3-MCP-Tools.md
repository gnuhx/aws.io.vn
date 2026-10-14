# Module 3 — MCP: Tools

> Roadmap MCP × Full-Stack AI · 5 session · 2 tuần · C50 Lab 01–10 · 9 tool nexus_* có schema, annotation, lỗi chuẩn

## Mục lục

- **Tổng quan** — MCP: Tools
- **S3.1** — Server tối thiểu & đặt tên tool
- **S3.2** — Validate input: schema hay handler
- **S3.3** — Structured output & thiết kế lỗi
- **S3.4** — Gọi API ngoài & trả ảnh
- **S3.5** — Annotations, progress, logging
- **Kiểm tra cuối** — Exit check Module 3

---

## Module 3 — MCP: Tools

M2 nối được mọi tầng. M3 quay lại **tool**, đơn vị nhỏ nhất của MCP, và làm cho đúng: tên để LLM chọn đúng, input chặn đúng chỗ, output máy đọc được, lỗi mà LLM tự sửa được, API ngoài không làm treo tool, và annotation để host biết tool nào nguy hiểm. Mỗi session là 1–3 lab của C50 (Lab 01–10) cộng phần áp dụng thẳng vào Nexus.

Kết quả sau module: `apps/mcp-server` có **9 tool `nexus_*`**, tool nào cũng có `outputSchema` và annotation, lỗi viết theo mẫu “chuyện gì xảy ra + làm gì tiếp”, có tool gọi API ngoài với timeout 5 s, tool trả ảnh PNG, tool chạy lâu có progress, và log gửi cho client theo mức client chọn.

> **Repo Nexus của bài được dựng lại từ nội dung M2.** Sandbox dựng M3 không còn repo sau M2, nên `nexus/` được viết lại theo `m2.src.md` (cùng tên file, cùng hành vi: 3 tool, repository Mongo/RAM, chat Next.js stream). Chi tiết nhỏ có thể lệch bản bạn đang có. Diff trong bài lấy từ commit “M2 baseline (dựng lại)” → “M3”.

### 5 session

| Session | Học gì | Output |
|---|---|---|
| **S3.1** Server tối thiểu & đặt tên tool | `registerTool`, schema thành type, `content` luôn là mảng, tên `nexus_<động từ>_<danh từ>`, description nói *khi nào* gọi · C50 Lab 01–02 | `TOOL` trong `packages/shared`, 9 tool `nexus_*`, web hết chuỗi cứng |
| **S3.2** Validate input: schema hay handler | Lỗi hình thức chặn ở Zod (`-32602`, handler không chạy); lỗi nghiệp vụ trả `isError` có gợi ý; branded `CustomerId` · C50 Lab 03 | Tool `nexus_get_customer` |
| **S3.3** Structured output & thiết kế lỗi | `outputSchema` + `structuredContent` đi kèm text; `isError` vs JSON-RPC error; `toolOk`/`toolFail` · C50 Lab 04–05 | Mọi tool Nexus có `outputSchema` |
| **S3.4** Gọi API ngoài & trả ảnh | `AbortSignal.timeout`, dịch lỗi mạng thành câu LLM đọc được, `image` content, base64 +33% · C50 Lab 06–07 | `nexus_get_exchange_rate` (timeout 5 s), `nexus_chart_customers_by_city` (PNG) |
| **S3.5** Annotations, progress, logging | `readOnlyHint`/`destructiveHint`/`idempotentHint`, progress chỉ khi có token, `logging/setLevel`, không bao giờ log ra stdout · C50 Lab 08–10 | Annotation cho 9 tool, `nexus_generate_report` báo progress, 2 tool ghi |

### Phiên bản đã chạy

```console
$ bash m3/versions.sh
node        v22.22.2
pnpm        10.28.0
typescript  7.0.2
@modelcontextprotocol/sdk  1.30.1
zod         4.6.5
next        16.3.6
```

| Khác biệt phiên bản gặp khi dựng bài | Xử lý trong bài |
|---|---|
| MCP TS SDK **v2** (`@modelcontextprotocol/server` 2.1.0) đã ra; `@modelcontextprotocol/sdk` vẫn ở **1.30.1** (dist-tag `latest`) | Code bài dùng **v1.30.1** cho khớp C50. Đã chạy thử v2 cho đúng các API của M3 (output ở S3.3): `inputSchema`/`outputSchema` nhận `z.object(...)`, JSON Schema chuyển sang draft 2020-12, message lỗi validate bỏ tiền tố `MCP error -32602:` |
| SDK 1.30 gói lỗi validate input **và** “tool không tồn tại” vào `result.isError` | Bài dạy theo hành vi thật (output S3.3); ghi rõ chỗ nào khác với câu chữ spec cũ |
| SDK 1.30: thiếu `params.name` trả `-32603` kèm dump Zod (spec gợi ý `-32602`); dòng JSON hỏng trên stdio **không** được trả `-32700` | Ghi nhận ở S3.3, không ảnh hưởng code của mình |
| SDK 1.30 **gửi mọi mức log** (kể cả debug) khi client chưa `logging/setLevel` | Nexus tự giữ mức mặc định `info` (S3.5) |
| Zod 4: `.brand()`, `z.email()`, `z.iso.datetime()` | Dùng luôn; `.brand()` không ảnh hưởng JSON Schema |
| TypeScript 7.0 + `erasableSyntaxOnly`: không parameter property | Code “dịch thẳng từ C#” trong `lesson-code/` cũng phải viết field tường minh |

### Đã chạy thật gì, chưa chạy gì

Sandbox dựng bài không có: harness chấm C50, Claude Desktop, Docker daemon/MongoDB, đường ra internet (proxy chặn `open.er-api.com`). Bài **không** bịa output cho phần chưa chạy.

| Phần | Trạng thái | Thay thế đã chạy |
|---|---|---|
| C50 Lab 01–10 (`npm run check`) | ✗ chưa chạy ở sandbox | — (lab C50 chỉ dạy đủ để tự làm, không có lời giải) |
| 9 tool Nexus, `pnpm check` | ✓ chạy thật | SDK client thật qua stdio, dữ liệu in-memory cùng hợp đồng repository |
| Claude Desktop liệt kê/gọi tool, hộp xác nhận `destructiveHint` | ✗ chưa chạy ở sandbox | SDK client (`scripts/call.ts`, `smoke.ts`); host Nexus web lọc tool theo annotation (chạy thật) |
| MongoDB cho `get`/`updateTier`/`delete` | ✗ (không có Mongo) | Bản Mongo qua `tsc` strict; bản RAM chạy thật |
| API tỷ giá thật (`open.er-api.com`) | ✗ bị chặn — output thật là lỗi mạng | `scripts/rates-stub.ts`: HTTP server thật, cùng hợp đồng v6, 4 chế độ (ok, treo, 503, HTML) |
| Timeout, progress, logging, ảnh PNG, JSON-RPC thô | ✓ đo thật | — |
| Chat Next.js gọi tool tên mới | ✓ chạy thật | LLM là provider giả lập như M2 |

### Cách dùng trang

- Mỗi session: **Lý thuyết + Lab** (bảng C# → TS, lab C50 + lab Nexus có AC và lệnh nghiệm thu, bẫy có lỗi thật, code mẫu & pattern, 3 câu trắc nghiệm) · **Cheat Sheet** · **Code** (toàn bộ file của session theo cây thư mục).
- **Luật vàng C50:** tự code tới khi `npm run check` xanh rồi mới xem video Review. Trang này không có lời giải C50.
- Lời giải lab Nexus nằm trong mục thu gọn “Xem sau khi làm xong”. Tab Code có toàn bộ file — mở khi đã làm xong.
- Ô tick AC được nhớ trên trình duyệt này. Tick khi lệnh nghiệm thu xanh.

### Exit check Module 3

- [ ] C50 Lab 01–10 xanh hết.
- [ ] Từ file trống, viết được một tool có input/output schema, annotation, lỗi chuẩn trong 15 phút không tra (bài thực hành 1 ở [Kiểm tra cuối](#fx)).
- [ ] Trang Kiểm tra cuối: mọi session ≥ 80%.


---

## Tổng quan · Cheat Sheet

### Bản đồ module

**Sơ đồ (Bản đồ dịch vụ) — Module 3 gồm những session nào, nối vào nhau ra sao?**

```mermaid
flowchart LR
    s31["S3.1 Tên tool"] -- "TOOL.*" --> s32["S3.2 Validate"]
    s32["S3.2 Validate"] -- "Zod + gợi ý" --> s33["S3.3 Output + lỗi"]
    s33["S3.3 Output + lỗi"] -- "toolOk/Fail" --> s34["S3.4 API + ảnh"]
    s34["S3.4 API + ảnh"] -- "5 s · PNG" --> s35["S3.5 Annotation"]
    s35["S3.5 Annotation"] -- "hint, token" --> out["✓ Tool chuẩn"]
```

**Đọc sơ đồ:** Đọc từ ô đầu (trái trên) sang phải, vòng xuống hàng dưới và đi ngược về trái tới đích. Nhãn mũi tên = thứ mang sang session sau. *Màu: xanh ô-liu + ✓ = đã xong / đích · viền terracotta = đang học · be = sắp học.*


### Bảng pattern của module

| Pattern | Session | Tương đương C# / .NET | Dùng khi |
|---|---|---|---|
| Hằng tên dùng chung (`as const` object) | S3.1 | `static class ToolNames` + `const string`, `nameof` | Tên tool dùng ở server, host, test: 1 nguồn, gõ sai là lỗi compile |
| Branded type (parse, don't validate) | S3.2 | Value object `readonly record struct CustomerId` | Giá trị đã qua schema mang nhãn type; hàm nhận `CustomerId` không nhận `string` thô |
| Result union cho kết quả tool (`toolOk` / `toolFail`) | S3.3 | `Results.Ok` / `ProblemDetails`, `OneOf<T, Error>` thay exception filter | Lỗi nghiệp vụ là dữ liệu có hướng dẫn cho LLM, không phải exception |
| Adapter + anti-corruption (client trả union lỗi, `fetch` tiêm vào) | S3.4 | Typed `HttpClient` + `DelegatingHandler` / Polly timeout | Bọc API ngoài: timeout, parse, dịch lỗi ở đúng 1 chỗ; test thay `fetch` giả |
| Decorator bằng hàm bậc cao (`instrument`) | S3.5 | `DelegatingHandler`, `IAsyncActionFilter` | Đo giờ, log, chặn exception cho mọi tool mà không cần lớp cha |
| Null Object (`progressReporter` khi không có token) | S3.5 | `NullLogger.Instance` | Tính năng client có thể không xin: trả hàm rỗng thay vì `if` rải khắp handler |


### Lệnh cả module

```console
$ pnpm check                                                   # typecheck 3 package + smoke 14 lần gọi
$ cd apps/mcp-server
$ node scripts/call.ts nexus_get_customer '{"id":"cus_007"}'    # gọi 1 tool qua MCP client thật
$ node scripts/rates-stub.ts 4010 &                             # API tỷ giá giả: /ok /slow /down /html
$ RATES_API_URL=http://127.0.0.1:4010/slow/v6 node scripts/call.ts nexus_get_exchange_rate '{"base":"USD"}'
```

### Khung 1 tool đủ 5 lớp

| Lớp | Session | Ở đâu trong `registerTool` |
|---|---|---|
| Tên + khi nào gọi | S3.1 | `TOOL.x`, `title`, `description` |
| Input | S3.2 | `inputSchema` (Zod shape, ràng buộc + `.describe`) |
| Output + lỗi | S3.3 | `outputSchema`, handler trả `toolOk` / `toolFail` |
| Phụ thuộc ngoài | S3.4 | `deps` (client có timeout, trả union) |
| Tín hiệu cho host | S3.5 | `annotations`, `progressReporter(extra)`, `deps.log` |

Khung đầy đủ, compile được — copy khi viết tool mới:

`lesson-code/m3/tool-template.ts`

```ts
/**
 * Khung 1 tool Nexus đủ 5 lớp (tên · input · output/lỗi · phụ thuộc · tín hiệu cho host).
 * Copy file này, đổi tên/schema/handler. Compile sạch với tsconfig của repo.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Logger } from "../../nexus/apps/mcp-server/src/log.ts";
import { instrument } from "../../nexus/apps/mcp-server/src/instrument.ts";
import { progressReporter } from "../../nexus/apps/mcp-server/src/progress.ts";
import { toolFail, toolOk } from "../../nexus/apps/mcp-server/src/tool-result.ts";

// 1. Tên: nexus_<động từ>_<danh từ> (thật: thêm vào TOOL trong packages/shared)
const NAME = "nexus_count_orders";

// 2. Input: luật kiểm được bằng giá trị → schema, có .describe()
const Input = z.object({
  city: z.string().trim().min(1).max(60).describe("Thành phố, ví dụ 'Hà Nội'."),
  days: z.number().int().min(1).max(90).default(30).describe("Số ngày gần nhất (1–90)."),
});

// 3. Output: máy đọc được
const Output = z.object({ city: z.string(), days: z.number().int(), total: z.number().int() });

// 4. Phụ thuộc: tiêm qua deps, không import singleton
export interface CountOrdersDeps {
  countOrders: (city: string, since: Date, signal: AbortSignal) => Promise<number | undefined>;
  log: Logger;
  now: () => Date;
}

export function registerCountOrders(server: McpServer, deps: CountOrdersDeps): void {
  server.registerTool(
    NAME,
    {
      title: "Đếm đơn hàng",
      description:
        "Đếm đơn hàng của 1 thành phố trong N ngày gần nhất. Gọi khi người dùng hỏi 'bao nhiêu đơn'. " +
        "Không liệt kê từng đơn. Kết quả: đọc 'total'.",
      inputSchema: Input.shape,
      outputSchema: Output.shape,
      // 5. Tín hiệu cho host: khai tường minh cả 4
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    instrument(NAME, deps.log, async ({ city, days }, extra) => {
      const report = progressReporter(extra);
      await report(0, 1, `Đang đếm đơn ở ${city}`);
      const since = new Date(deps.now().getTime() - days * 86_400_000);
      const total = await deps.countOrders(city, since, extra.signal);
      if (total === undefined) {
        return toolFail({ what: `Không có dữ liệu đơn hàng cho '${city}'.`, next: "Gọi nexus_list_customers để xem các thành phố có dữ liệu." });
      }
      await report(1, 1, "Xong");
      return toolOk(Output, { city, days, total });
    }),
  );
}
```

### 10 bẫy của module

| # | Bẫy | Session | Dấu hiệu |
|---|---|---|---|
| 1 | Tên tool có dấu cách / `/` | S3.1 | SDK cảnh báo SEP-986 ra stderr |
| 2 | Đăng ký 1 tên 2 lần | S3.1 | `Tool … is already registered` → host: `Connection closed` |
| 3 | Đổi tên tool, host còn chuỗi cũ | S3.1 | `Tool list_customers not found` |
| 4 | Validate định dạng trong handler | S3.2 | JSON Schema không có `pattern`, LLM đoán mò |
| 5 | LLM gửi `null` cho field tùy chọn | S3.2 | `expected string, received null` |
| 6 | `structuredContent` lệch `outputSchema` | S3.3 | `Output validation error` lúc chạy |
| 7 | Để exception bay khỏi handler | S3.3 | LLM đọc `connect ECONNREFUSED 127.0.0.1:27999` |
| 8 | `fetch` không timeout, không kiểm status | S3.4 | Treo 30 s rồi `Cannot read properties of undefined` |
| 9 | Ảnh dạng data URL | S3.4 | Client: `Invalid Base64 string` |
| 10 | Progress không có token · quên `capabilities.logging` | S3.5 | `unknown token` · `Method not found` |


---

## Tổng quan · Code

### Cây repo sau Module 3

```txt
nexus/
├─ package.json · pnpm-workspace.yaml · tsconfig.base.json · .gitignore · .dockerignore
├─ packages/shared/src/        index.ts · tools.ts (M3) · customer.ts · exchange-rate.ts (M3) · chat.ts
├─ apps/mcp-server/
│  ├─ src/                     index.ts · server.ts · env.ts · log.ts · db.ts
│  │  ├─                       tool-result.ts · instrument.ts · progress.ts · png.ts          (M3)
│  │  ├─ rates/client.ts                                                                   (M3)
│  │  ├─ tools/                ping · get-time · list-customers · get-customer · get-exchange-rate
│  │  │                        chart-customers-by-city · update-customer-tier · delete-customer · generate-report
│  │  └─ customers/            repository.ts · mongo-repository.ts · memory-repository.ts · seed-data.ts
│  └─ scripts/                 smoke.ts · call.ts (M3) · rates-stub.ts (M3) · seed.ts · tx-check.ts
├─ apps/web/                   (M2) · lib/llm/scripted.ts + lib/mcp/host.ts sửa ở M3
├─ infra/docker-compose.yml
└─ deploy/                     (M2, không đổi)
```

### Gốc repo

`package.json`

```json
{
  "name": "nexus",
  "private": true,
  "packageManager": "pnpm@10.28.0",
  "engines": {
    "node": ">=22.18"
  },
  "scripts": {
    "typecheck": "pnpm -r --parallel typecheck",
    "smoke": "pnpm --filter @nexus/mcp-server smoke",
    "check": "pnpm typecheck && pnpm smoke",
    "build": "pnpm --filter @nexus/mcp-server build && pnpm --filter @nexus/web build"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "typescript": "^7.0.2"
  }
}
```
`pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
onlyBuiltDependencies:
  - esbuild
```
`tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false,
    "noEmit": true,
    "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": true,
    "rewriteRelativeImportExtensions": true,
    "erasableSyntaxOnly": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "types": ["node"]
  }
}
```
`apps/mcp-server/package.json`

```json
{
  "name": "@nexus/mcp-server",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=22.18"
  },
  "scripts": {
    "start": "node src/index.ts",
    "typecheck": "tsc -p tsconfig.json",
    "smoke": "node scripts/smoke.ts",
    "seed": "node scripts/seed.ts",
    "tx-check": "node scripts/tx-check.ts",
    "build": "esbuild src/index.ts scripts/seed.ts scripts/tx-check.ts --bundle --platform=node --format=esm --target=node22 --outdir=dist --entry-names=[name] --packages=external --alias:@nexus/shared=../../packages/shared/src/index.ts",
    "call": "node scripts/call.ts",
    "rates-stub": "node scripts/rates-stub.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "1.30.1",
    "@nexus/shared": "workspace:*",
    "mongodb": "^7.6.0",
    "zod": "^4.6.5"
  },
  "devDependencies": {
    "esbuild": "^0.28.2"
  }
}
```

### Composition root sau M3

`apps/mcp-server/src/server.ts`

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CustomerRepository } from "./customers/repository.ts";
import type { Logger } from "./log.ts";
import type { RatesClient } from "./rates/client.ts";
import { registerPing } from "./tools/ping.ts";
import { registerGetTime } from "./tools/get-time.ts";
import { registerListCustomers } from "./tools/list-customers.ts";
import { registerGetCustomer } from "./tools/get-customer.ts";
import { registerGetExchangeRate } from "./tools/get-exchange-rate.ts";
import { registerChartCustomersByCity } from "./tools/chart-customers-by-city.ts";
import { registerUpdateCustomerTier } from "./tools/update-customer-tier.ts";
import { registerDeleteCustomer } from "./tools/delete-customer.ts";
import { registerGenerateReport } from "./tools/generate-report.ts";

export const SERVER_VERSION = "0.3.0";

export interface ServerDeps {
  customers: CustomerRepository;
  rates: RatesClient;
  log: Logger;
  now: () => Date;
  reportStepMs?: number;
}

/** Composition root: đọc là biết server có tool gì. */
export function createServer(deps: ServerDeps): McpServer {
  const server = new McpServer(
    { name: "nexus", version: SERVER_VERSION },
    {
      // logging: bật logging/setLevel + notifications/message. Thiếu dòng này, log gửi client bị bỏ qua im lặng.
      capabilities: { logging: {} },
      instructions:
        "Nexus: dữ liệu khách hàng của công ty. Mọi tool có tiền tố nexus_. " +
        "Đếm/lọc dùng nexus_list_customers (đọc 'total'); chi tiết 1 khách dùng nexus_get_customer với id lấy từ danh sách.",
    },
  );
  const { customers, log, now } = deps;
  registerPing(server, { version: SERVER_VERSION });
  registerGetTime(server, { now, log });
  registerListCustomers(server, { customers, log });
  registerGetCustomer(server, { customers, log });
  registerGetExchangeRate(server, { rates: deps.rates, log });
  registerChartCustomersByCity(server, { customers, log });
  registerUpdateCustomerTier(server, { customers, log });
  registerDeleteCustomer(server, { customers, log });
  registerGenerateReport(server, { customers, log, now, stepMs: deps.reportStepMs ?? 400 });
  return server;
}
```

Code từng phần nằm ở tab **Code** của session tương ứng.

---

## S3.1 — Server tối thiểu & đặt tên tool

Mục tiêu: nắm cấu trúc chuẩn của 1 tool (tên · schema · handler · `content`) và quy tắc đặt tên để LLM chọn đúng tool khi host có hàng chục tool từ nhiều server.

### C# → TS/Node

| Khái niệm C# | Tương đương TS/Node | Khác ở đâu |
|---|---|---|
| `[McpServerTool(Name = "...")]` trên method | `server.registerTool(TOOL.listCustomers, config, handler)` | Tên là chuỗi runtime bạn tự chọn, không suy ra từ tên method |
| `static class ToolNames { const string X = "..."; }` | `export const TOOL = { ... } as const` | Mỗi field có type literal `"nexus_list_customers"`, không phải `string` |
| Tham số method + `[Description]` | `inputSchema` (shape Zod) + `.describe()` | Handler nhận **1 object** đã parse, type suy từ schema |
| `return "text"` / `return dto` | `{ content: [{ type: "text", text }] }` | `content` **luôn là mảng** các khối có `type` (text, image, …) |
| `nameof(ListCustomers)` | `TOOL.listCustomers` | Gõ sai → TS2551 lúc biên dịch |
| Trùng route → exception lúc startup | `Tool … is already registered` trong `registerTool` | Server chết lúc boot → host chỉ thấy `Connection closed` |
| XML doc `<summary>` cho Swagger | `description` | Đây là **prompt** cho LLM: viết *khi nào gọi*, không chỉ *làm gì* |
| Tên action đổi → client cũ 404 | Đổi tên tool → `Tool … not found` | Tên tool là hợp đồng với host **và** LLM — đổi tên là breaking change |

### Lab

#### Lab C50 — 01 Echo Server · 02 Calculator Server

**Mục tiêu:** Lab 01 dựng server nhỏ nhất có 1 tool; Lab 02 đăng ký nhiều tool trên 1 server, đặt tên theo quy tắc động-từ + prefix chung.

- [ ] Lab 01 xanh.
- [ ] Lab 02 xanh.

**Lệnh nghiệm thu** (trong repo C50, thư mục của từng lab — chưa chạy ở sandbox dựng bài):

```console
$ npm run check
```

Cần nắm để tự làm (không phải lời giải):

- Lab 01: `McpServer` + `registerTool` + `StdioServerTransport`. Kiểu tham số handler do SDK suy ra từ `inputSchema` — đừng khai `interface` rồi ép kiểu. Kết quả là object có `content` là **mảng**; trả chuỗi trần hoặc 1 object không bọc mảng là sai hình dạng.
- Lab 02: mỗi tool 1 lần `registerTool`, tên chỉ gồm `[A-Za-z0-9_.-]`, bắt đầu bằng động từ, cùng 1 prefix cho cả server. Đọc đề để biết prefix và tên chính xác harness mong đợi — harness so tên từng ký tự.
- Cả hai: không in gì ra stdout. `console.error` ra stderr thì an toàn.

#### Lab Nexus S3.1 — đổi tên 3 tool cũ, thêm quy ước dùng chung

**Mục tiêu:** mọi tool Nexus tên `nexus_<động từ>_<danh từ>`, lấy từ **một** hằng `TOOL` trong `packages/shared`; web (host) không còn chuỗi tên tool viết tay; description nói rõ khi nào gọi.

- [ ] `pnpm check` xanh; dòng `tools (…)` của smoke chỉ có tên bắt đầu bằng `nexus_`.
- [ ] Không còn tên tool viết cứng trong `apps/web`: lệnh grep dưới ra `0`.
- [ ] Mỗi description có một câu “Gọi khi …” / “Chỉ gọi khi …”.
- [ ] `/chat` hỏi “Có bao nhiêu khách hàng ở Hà Nội?” → event `tool_start` mang tên `nexus_list_customers`.

**Lệnh nghiệm thu:**

```console
$ pnpm check
$ grep -rn '"list_customers"\|"nexus_list_customers"' apps/web/app apps/web/lib | wc -l
$ cd apps/web && pnpm build && LLM_PROVIDER=scripted NEXUS_DATA=memory PORT=3100 pnpm start &
$ node apps/web/scripts/chat-probe.ts http://localhost:3100 "Có bao nhiêu khách hàng ở Hà Nội?"
```

**Gợi ý hướng làm:** tạo `packages/shared/src/tools.ts` với `TOOL = {...} as const`, export từ `index.ts`; thay chuỗi tên trong từng `registerTool` và trong `apps/web/lib/llm/scripted.ts`; viết lại description theo khung ở Cheat Sheet.

Output thật sau khi làm — bảng tool host nhìn thấy (script `lesson-code/m3/inspect-tools.ts`, cột RO/DE/ID/OW là annotation của S3.5):

```console
$ node m3/inspect-tools.ts
tool                            RO DE ID OW  out  description (câu đầu)
nexus_ping                      ✓  ?  ?  -   có   Kiểm tra server Nexus còn sống.
nexus_get_time                  ✓  ?  ?  -   có   Lấy ngày giờ hiện tại theo múi giờ IANA.
nexus_list_customers            ✓  ?  ?  -   có   Đếm hoặc liệt kê khách hàng, lọc theo thành phố.
nexus_get_customer              ✓  ?  ?  -   có   Lấy đầy đủ thông tin 1 khách hàng (email, gói, ngày tạo) theo id dạng 
nexus_get_exchange_rate         ✓  ?  ?  ✓   có   Lấy tỷ giá mới nhất giữa 2 loại tiền (mặc định quy đổi sang VND) từ dị
nexus_chart_customers_by_city   ✓  ?  ?  -   có   Vẽ biểu đồ cột (ảnh PNG) số khách hàng theo từng thành phố, kèm số liệ
nexus_update_customer_tier      -  ✓  ✓  -   có   Đổi gói dịch vụ (free/pro/enterprise) của 1 khách hàng — GHI dữ liệu, 
nexus_delete_customer           -  ✓  ✓  -   có   XÓA VĨNH VIỄN 1 khách hàng theo id.
nexus_generate_report           ✓  ?  ?  -   có   Tạo báo cáo tổng hợp số khách theo thành phố và theo gói (free/pro/ent
```

Và chat Next.js của M2 gọi đúng tên mới (provider giả lập, MCP server thật):

```console
$ node scripts/chat-probe.ts http://localhost:3100 "Có bao nhiêu khách hàng ở Hà Nội?"
HTTP 200 application/x-ndjson; charset=utf-8
  711 ms  {"type":"tool_start","name":"nexus_list_customers","input":{"city":"Hà Nội","limit":5}}
  723 ms  {"type":"tool_end","name":"nexus_list_customers","ok":true,"ms":16}
  784 ms  {"type":"text","delta":"Theo "}
  845 ms  {"type":"text","delta":"dữ "}
  906 ms  {"type":"text","delta":"liệu "}
  967 ms  {"type":"text","delta":"hiện "}
 1028 ms  {"type":"text","delta":"có, "}
 1088 ms  {"type":"text","delta":"có "}
 1150 ms  {"type":"text","delta":"12 "}
 1211 ms  {"type":"text","delta":"khách "}
 1271 ms  {"type":"text","delta":"hàng "}
 1357 ms  {"type":"text","delta":"khớp "}
 1416 ms  {"type":"text","delta":"câu "}
 1478 ms  {"type":"text","delta":"hỏi "}
 1574 ms  {"type":"text","delta":"của "}
 1638 ms  {"type":"text","delta":"bạn. "}
 1639 ms  {"type":"done"}
answer: Theo dữ liệu hiện có, có 12 khách hàng khớp câu hỏi của bạn.
```

<details>
<summary>Xem sau khi làm xong — lời giải Lab Nexus S3.1</summary>

`packages/shared/src/tools.ts`

```ts
/**
 * Tên tool của Nexus — 1 nguồn duy nhất cho server, web (host) và test.
 * Quy ước: <prefix>_<động từ>_<danh từ>, snake_case, chỉ [a-z0-9_] (SEP-986 cho phép thêm '.', '-').
 */
export const TOOL = {
  ping: "nexus_ping",
  getTime: "nexus_get_time",
  listCustomers: "nexus_list_customers",
  getCustomer: "nexus_get_customer",
  getExchangeRate: "nexus_get_exchange_rate",
  chartCustomersByCity: "nexus_chart_customers_by_city",
  updateCustomerTier: "nexus_update_customer_tier",
  deleteCustomer: "nexus_delete_customer",
  generateReport: "nexus_generate_report",
} as const;

export type ToolName = (typeof TOOL)[keyof typeof TOOL];
```
`packages/shared/src/index.ts`

```ts
export * from "./customer.ts";
export * from "./chat.ts";
export * from "./tools.ts";
export * from "./exchange-rate.ts";
```
`apps/mcp-server/src/tools/list-customers.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListCustomersInputSchema, ListCustomersOutputSchema, TOOL } from "@nexus/shared";
import type { CustomerRepository } from "../customers/repository.ts";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface ListCustomersDeps {
  customers: CustomerRepository;
  log: Logger;
}

export function registerListCustomers(server: McpServer, deps: ListCustomersDeps): void {
  server.registerTool(
    TOOL.listCustomers,
    {
      title: "Danh sách khách hàng",
      description:
        "Đếm hoặc liệt kê khách hàng, lọc theo thành phố. Gọi khi người dùng hỏi 'có bao nhiêu khách', " +
        "'khách nào ở X', hoặc cần id để gọi nexus_get_customer. Để đếm, đọc 'total' — 'items' bị cắt theo 'limit'.",
      inputSchema: ListCustomersInputSchema.shape,
      outputSchema: ListCustomersOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.listCustomers, deps.log, async ({ city, limit }) => {
      try {
        const page = await deps.customers.list({ city, limit });
        return toolOk(ListCustomersOutputSchema, {
          total: page.total,
          returned: page.items.length,
          items: page.items.map(({ id, name, city: c, tier }) => ({ id, name, city: c, tier })),
        });
      } catch (err) {
        deps.log.error("list customers: db error", { err: String(err) });
        return toolFail({ what: "Không đọc được dữ liệu khách hàng (cơ sở dữ liệu không phản hồi).", next: "Thử lại sau ít phút; đừng đoán số liệu." });
      }
    }),
  );
}
```
`apps/mcp-server/src/server.ts`

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CustomerRepository } from "./customers/repository.ts";
import type { Logger } from "./log.ts";
import type { RatesClient } from "./rates/client.ts";
import { registerPing } from "./tools/ping.ts";
import { registerGetTime } from "./tools/get-time.ts";
import { registerListCustomers } from "./tools/list-customers.ts";
import { registerGetCustomer } from "./tools/get-customer.ts";
import { registerGetExchangeRate } from "./tools/get-exchange-rate.ts";
import { registerChartCustomersByCity } from "./tools/chart-customers-by-city.ts";
import { registerUpdateCustomerTier } from "./tools/update-customer-tier.ts";
import { registerDeleteCustomer } from "./tools/delete-customer.ts";
import { registerGenerateReport } from "./tools/generate-report.ts";

export const SERVER_VERSION = "0.3.0";

export interface ServerDeps {
  customers: CustomerRepository;
  rates: RatesClient;
  log: Logger;
  now: () => Date;
  reportStepMs?: number;
}

/** Composition root: đọc là biết server có tool gì. */
export function createServer(deps: ServerDeps): McpServer {
  const server = new McpServer(
    { name: "nexus", version: SERVER_VERSION },
    {
      // logging: bật logging/setLevel + notifications/message. Thiếu dòng này, log gửi client bị bỏ qua im lặng.
      capabilities: { logging: {} },
      instructions:
        "Nexus: dữ liệu khách hàng của công ty. Mọi tool có tiền tố nexus_. " +
        "Đếm/lọc dùng nexus_list_customers (đọc 'total'); chi tiết 1 khách dùng nexus_get_customer với id lấy từ danh sách.",
    },
  );
  const { customers, log, now } = deps;
  registerPing(server, { version: SERVER_VERSION });
  registerGetTime(server, { now, log });
  registerListCustomers(server, { customers, log });
  registerGetCustomer(server, { customers, log });
  registerGetExchangeRate(server, { rates: deps.rates, log });
  registerChartCustomersByCity(server, { customers, log });
  registerUpdateCustomerTier(server, { customers, log });
  registerDeleteCustomer(server, { customers, log });
  registerGenerateReport(server, { customers, log, now, stepMs: deps.reportStepMs ?? 400 });
  return server;
}
```

Web chỉ cần thay chuỗi bằng hằng:

`apps/web/lib/llm/scripted.ts`

```diff
+import { TOOL } from "@nexus/shared";
 import type { LlmEvent, LlmProvider, StreamRequest } from "./types.ts";
 
     async *stream(req: StreamRequest, signal: AbortSignal): AsyncIterable<LlmEvent> {
       const last = req.messages.at(-1);
-      if (last?.role === "user" && /khách/i.test(last.content) && req.tools.some((t) => t.name === "list_customers")) {
+      if (last?.role === "user" && /khách/i.test(last.content) && req.tools.some((t) => t.name === TOOL.listCustomers)) {
         const city = /hà nội|ha noi/i.test(last.content) ? "Hà Nội" : undefined;
-        yield { type: "tool_call", call: { id: "call_1", name: "list_customers", input: city ? { city, limit: 5 } : { limit: 5 } } };
+        yield { type: "tool_call", call: { id: "call_1", name: TOOL.listCustomers, input: city ? { city, limit: 5 } : { limit: 5 } } };
```

</details>

<details>
<summary>Tra khi test đỏ</summary>

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| stderr: `Tool name validation warning for "list customers"` | Tên có dấu cách, `/`, dấu tiếng Việt | Chỉ `[A-Za-z0-9_.-]`; Nexus dùng `snake_case` |
| Host: `MCP error -32000: Connection closed` ngay lúc kết nối | 2 file đăng ký cùng 1 tên → `registerTool` ném lúc boot | Chạy tay `node src/index.ts` xem stderr; tìm tên trùng trong `TOOL` |
| `[isError] … Tool list_customers not found` | Host/test còn gọi tên cũ | Dùng `TOOL.*` từ `@nexus/shared` ở mọi nơi gọi |
| `TS2551: Property 'lisCustomers' does not exist … Did you mean 'listCustomers'?` | Gõ sai key của `TOOL` | Đúng như mong muốn — sửa key |
| LLM gọi `nexus_chart_customers_by_city` khi chỉ cần con số | Description không nói khi nào **không** nên gọi | Thêm câu “Để trả lời bằng số, dùng nexus_list_customers” |
| Harness C50 báo sai tên | Tên lệch đề từng ký tự (hoa/thường, `-` vs `_`) | Copy tên từ đề |

</details>

### Tool là gì, về mặt dữ liệu

Host không đọc code của bạn. Nó chỉ thấy đúng 4 thứ trong `tools/list` và chuyển nguyên cho LLM: **`name`**, **`description`**, **`inputSchema`** (JSON Schema sinh từ Zod) và (từ S3.3, S3.5) `outputSchema`, `annotations`. LLM chọn tool **chỉ** dựa trên các chuỗi này. Vì vậy trong MCP, đặt tên và viết description là công việc thiết kế API — người dùng API là một model.

Tool nhỏ nhất của Nexus — đủ 3 phần: tên, cấu hình, handler trả `content` là mảng:

`apps/mcp-server/src/tools/ping.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL } from "@nexus/shared";
import { z } from "zod";
import { toolOk } from "../tool-result.ts";

const PingOutput = z.object({ ok: z.literal(true), server: z.string() });

export function registerPing(server: McpServer, deps: { version: string }): void {
  server.registerTool(
    TOOL.ping,
    {
      title: "Ping",
      description: "Kiểm tra server Nexus còn sống. Chỉ dùng khi người dùng hỏi hệ thống có hoạt động không.",
      outputSchema: PingOutput.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => toolOk(PingOutput, { ok: true, server: `nexus ${deps.version}` }),
  );
}
```

(`outputSchema` và `annotations` trong file này là của S3.3 và S3.5 — bỏ đi thì vẫn là tool hợp lệ.)

### Vì sao tên cần prefix + động từ

**Sơ đồ (Bản đồ dịch vụ) — Host gộp tool từ nhiều server — tên đụng nhau thì chuyện gì xảy ra?**

```mermaid
flowchart RL
    crm["crm: list_customers"] -- "list_customers" --> host["Host (bảng tool gộp)"]
    support["support: list_customers"] -- "list_customers" --> host
    nexus["Nexus: nexus_* (9 tool)"] -- "nexus_*" --> host
    host -- "tools[]" --> llm["LLM"]
    host -- "trùng tên" --> clash["✗ Tên bị đè: cái sau thắng"]
    classDef hl fill:#f5d9c8,stroke:#b8583a,stroke-width:3px
    class host hl
```

**Đọc sơ đồ:** Phải = các MCP server, giữa = host (bảng tool gộp theo tên), trái = LLM chỉ nhìn thấy bảng đó. Hai server cùng khai 'list_customers' thì bảng chỉ còn 1 dòng. *Màu: đỏ gạch + ✗ + viền đứt = bị chặn/sai · vàng mù tạt + ? + viền chấm = cần xem lại · xanh ô-liu + ✓ = chạy đúng. Nhãn mũi tên = tên tool đi vào bảng.*


Output thật của host “ngây thơ” gộp tool theo tên (code ở tab Code, `lesson-code/m3/traps/host-collision.ts`):

```console
$ node m3/traps/host-collision.ts
host A: crm + support (cả hai đặt tên list_customers)
  ! 'list_customers' của support đè lên bản của crm
  list_customers → support  (tổng 1 tool)
host B: crm + nexus (nexus dùng prefix nexus_)
  list_customers → crm · nexus_list_customers → nexus  (tổng 10 tool)
```

Một số host tự thêm tiền tố theo tên server khi đưa tool cho model (Claude Code đặt dạng `mcp__<server>__<tool>`); nhiều host khác thì không, và bạn không kiểm soát host nào sẽ dùng server của mình. Prefix trong tên là cách duy nhất chắc chắn chạy ở mọi host. Quy ước của Nexus:

- `nexus_` + **động từ** + danh từ: `nexus_list_customers`, `nexus_get_customer`, `nexus_update_customer_tier`. Động từ đứng đầu cho model biết ngay tool **làm gì** (list/get/update/delete/generate).
- `snake_case`, ASCII. SEP-986 cho phép `A-Z a-z 0-9 _ - .`, tối đa 128 ký tự; SDK 1.30 chỉ **cảnh báo** chứ không chặn tên sai (Bẫy 1).
- Không đưa tên hệ thống nội bộ vào tên (`nexus_mongo_find`): model không cần biết, và tên sẽ sai khi đổi DB.

### Description là prompt

Viết cho người đọc là model đang đứng trước 30 tool và phải chọn 1. Khung 4 câu dùng cho mọi tool Nexus:

1. **Làm gì** — động từ + đối tượng. “Đếm hoặc liệt kê khách hàng, lọc theo thành phố.”
2. **Khi nào gọi** — theo câu hỏi của người dùng. “Gọi khi người dùng hỏi ‘có bao nhiêu khách’, ‘khách nào ở X’, hoặc cần id để gọi nexus_get_customer.”
3. **Khi nào không / gọi gì thay** — tránh chọn nhầm tool gần giống. “Để trả lời bằng số, dùng nexus_list_customers.”
4. **Đọc kết quả thế nào** — chỗ model hay hiểu sai. “Để đếm, đọc ‘total’ — ‘items’ bị cắt theo ‘limit’.”

Refactor description của M2 theo khung (diff thật giữa 2 commit):

`apps/mcp-server/src/tools/list-customers.ts`

```diff
   server.registerTool(
-    "list_customers",
+    TOOL.listCustomers,
     {
       title: "Danh sách khách hàng",
       description:
-        "Liệt kê khách hàng của công ty, lọc theo thành phố. Dùng để đếm hoặc xem khách hàng. " +
-        "Kết quả có 'total' (tổng thật) và 'items' (tối đa 'limit' bản ghi) — để đếm, đọc 'total'.",
+        "Đếm hoặc liệt kê khách hàng, lọc theo thành phố. Gọi khi người dùng hỏi 'có bao nhiêu khách', " +
+        "'khách nào ở X', hoặc cần id để gọi nexus_get_customer. Để đếm, đọc 'total' — 'items' bị cắt theo 'limit'.",
       inputSchema: ListCustomersInputSchema.shape,
```

Ngoài description từng tool, server còn khai **`instructions`** một lần trong `initialize` — hướng dẫn chung cho cả bộ tool (xem `server.ts`). Nhiều host đưa chuỗi này vào system prompt; host khác bỏ qua, nên đừng để thông tin quan trọng **chỉ** nằm ở đây.

### Phần khác C# thật sự

**1. Tên tool là dữ liệu runtime, và là hợp đồng.** Không có attribute, không reflection: `registerTool("nexus_get_customer", …)`. Đổi chuỗi đó là đổi API công khai. Output thật khi host còn gọi tên cũ:

```console
$ node m3/call.ts list_customers '{"city":"Hà Nội"}'
[isError] list_customers · 5 ms
  content[text]  MCP error -32602: Tool list_customers not found
```

**2. `as const` biến object thành bảng hằng có type literal.** `TOOL.listCustomers` có type `"nexus_list_customers"`, không phải `string`. `ToolName = (typeof TOOL)[keyof typeof TOOL]` là union của 9 tên — dùng được cho `switch` có kiểm đủ trường hợp.

**3. `content` là mảng khối có kiểu.** `{ type: "text" }`, `{ type: "image" }` (S3.4), `resource_link` (M4)… Một tool trả nhiều khối được: ví dụ text JSON + ảnh.

**4. Đăng ký tường minh, lỗi lúc boot.** Trùng tên không phải warning: `registerTool` ném, process chết trước khi trả lời `initialize`.

### Bẫy dev .NET hay vấp

#### Bẫy 1 — tên tool kiểu “tiếng người” hoặc kiểu đường dẫn

Quen route `/nexus/customers`, hoặc đặt tên như tiêu đề:

`lesson-code/m3/traps/bad-name.ts`

```ts
/** Bẫy S3.1: tên tool kiểu "tiếng người" hoặc kiểu đường dẫn. SDK vẫn đăng ký, chỉ cảnh báo (ra stderr). */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({ name: "bad-names", version: "0.0.0" });
const noop = async () => ({ content: [{ type: "text" as const, text: "ok" }] });
server.registerTool("list customers", { description: "Liệt kê khách" }, noop);
server.registerTool("nexus/list_customers", { description: "Liệt kê khách" }, noop);
server.registerTool("nexus_list_customers", { description: "Liệt kê khách" }, noop);
process.stderr.write("đăng ký xong 3 tool\n");
```

```console
$ node m3/traps/bad-name.ts
Tool name validation warning for "list customers":
  - Tool name contains spaces, which may cause parsing issues
  - Tool name contains invalid characters: " "
  - Allowed characters are: A-Z, a-z, 0-9, underscore (_), dash (-), and dot (.)
Tool registration will proceed, but this may cause compatibility issues.
Consider updating the tool name to conform to the MCP tool naming standard.
See SEP: Specify Format for Tool Names (https://github.com/modelcontextprotocol/modelcontextprotocol/issues/986) for more details.
Tool name validation warning for "nexus/list_customers":
  - Tool name contains invalid characters: "/"
  - Allowed characters are: A-Z, a-z, 0-9, underscore (_), dash (-), and dot (.)
Tool registration will proceed, but this may cause compatibility issues.
Consider updating the tool name to conform to the MCP tool naming standard.
See SEP: Specify Format for Tool Names (https://github.com/modelcontextprotocol/modelcontextprotocol/issues/986) for more details.
đăng ký xong 3 tool
```

SDK vẫn đăng ký cả 3 tool. Host nào chặt (hoặc API của nhà cung cấp LLM, vốn giới hạn ký tự trong tên tool) sẽ từ chối sau này — ở chỗ bạn không thấy log. `console.warn` ghi stderr nên không làm hỏng stdio, nhưng đừng để cảnh báo này tồn tại.

#### Bẫy 2 — hai file tool cùng một tên

Copy `get-customer.ts` thành file mới, quên đổi tên:

`lesson-code/m3/traps/dup-name.ts`

```ts
/** Bẫy S3.1: 2 file tool cùng đăng ký 1 tên (copy-paste). SDK ném lỗi lúc boot → host chỉ thấy "Connection closed". */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({ name: "dup", version: "0.0.0" });
const noop = async () => ({ content: [{ type: "text" as const, text: "ok" }] });
server.registerTool("nexus_get_customer", { description: "Chi tiết khách" }, noop);
server.registerTool("nexus_get_customer", { description: "Chi tiết khách (bản copy)" }, noop);
await server.connect(new StdioServerTransport());
```

```console
$ node m3/traps/dup-name-client.ts
file:///home/claude/nexus/node_modules/.pnpm/@modelcontextprotocol+sdk@1.30.1_zod@4.6.5/node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.js:701
            throw new Error(`Tool ${name} is already registered`);
                  ^

Error: Tool nexus_get_customer is already registered
    at McpServer.registerTool (file:///home/claude/nexus/node_modules/.pnpm/@modelcontextprotocol+sdk@1.30.1_zod@4.6.5/node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.js:701:19)
    at file:///home/claude/lesson-code/m3/traps/dup-name.ts:8:8
    at ModuleJob.run (node:internal/modules/esm/module_job:343:25)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:665:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:117:5)

Node.js v22.22.2
host: MCP error -32000: Connection closed
```

Host chỉ thấy dòng cuối. Stack trace nằm ở stderr của server — ở Claude Desktop là file `mcp-server-nexus.log`. Với `TOOL` dùng chung, trùng tên lộ ra ngay khi đọc `tools.ts` (9 dòng, mỗi tên 1 lần).

#### Bẫy 3 — gõ sai tên khi gọi

Chuỗi viết tay thì sai chính tả vẫn compile. Qua `TOOL` thì không:

`lesson-code/m3/tsc-traps/tool-name-typo.ts`

```ts
import { TOOL } from "@nexus/shared";

export const name = TOOL.lisCustomers;
```

> ❌ **TS2551** (dòng 3, cột 26): Property 'lisCustomers' does not exist on type '{ readonly ping: "nexus_ping"; readonly getTime: "nexus_get_time"; readonly listCustomers: "nexus_list_customers"; readonly getCustomer: "nexus_get_customer"; readonly getExchangeRate: "nexus_get_exchange_rate"; readonly chartCustomersByCity: "nexus_chart_customers_by_city"; readonly updateCustomerTier: "nexus_updat...'. Did you mean 'listCustomers'?

#### Bẫy 4 — description chỉ nói “làm gì”

“Liệt kê khách hàng” đúng nhưng không đủ: khi có thêm `nexus_chart_customers_by_city` và `nexus_generate_report`, cả 3 đều “liên quan khách hàng”. Model chọn theo **khác biệt** giữa các description. Mỗi description phải trả lời được “vì sao chọn tool này chứ không phải tool bên cạnh”.

### Code mẫu & pattern

#### Code production

`packages/shared/src/tools.ts`

```ts
/**
 * Tên tool của Nexus — 1 nguồn duy nhất cho server, web (host) và test.
 * Quy ước: <prefix>_<động từ>_<danh từ>, snake_case, chỉ [a-z0-9_] (SEP-986 cho phép thêm '.', '-').
 */
export const TOOL = {
  ping: "nexus_ping",
  getTime: "nexus_get_time",
  listCustomers: "nexus_list_customers",
  getCustomer: "nexus_get_customer",
  getExchangeRate: "nexus_get_exchange_rate",
  chartCustomersByCity: "nexus_chart_customers_by_city",
  updateCustomerTier: "nexus_update_customer_tier",
  deleteCustomer: "nexus_delete_customer",
  generateReport: "nexus_generate_report",
} as const;

export type ToolName = (typeof TOOL)[keyof typeof TOOL];
```
`apps/mcp-server/src/tools/get-customer.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetCustomerInputSchema, GetCustomerOutputSchema, TOOL } from "@nexus/shared";
import type { CustomerRepository } from "../customers/repository.ts";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface GetCustomerDeps {
  customers: CustomerRepository;
  log: Logger;
}

/**
 * Hai loại lỗi input:
 *  - Hình thức ('abc', 'cus-7') → schema (regex) chặn, handler không chạy.
 *  - Nghiệp vụ ('cus_999' đúng dạng nhưng không có) → handler trả isError kèm hướng đi tiếp.
 */
export function registerGetCustomer(server: McpServer, deps: GetCustomerDeps): void {
  server.registerTool(
    TOOL.getCustomer,
    {
      title: "Chi tiết khách hàng",
      description:
        "Lấy đầy đủ thông tin 1 khách hàng (email, gói, ngày tạo) theo id dạng 'cus_007'. " +
        "Chưa có id thì gọi nexus_list_customers trước — đừng tự đoán id.",
      inputSchema: GetCustomerInputSchema.shape,
      outputSchema: GetCustomerOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.getCustomer, deps.log, async ({ id }) => {
      const customer = await deps.customers.get(id);
      if (!customer) {
        return toolFail({
          what: `Không có khách hàng nào với id '${id}'.`,
          next: `Gọi ${TOOL.listCustomers} (có thể lọc theo thành phố) để lấy id đúng, rồi gọi lại.`,
        });
      }
      return toolOk(GetCustomerOutputSchema, customer);
    }),
  );
}
```
`apps/mcp-server/src/server.ts`

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CustomerRepository } from "./customers/repository.ts";
import type { Logger } from "./log.ts";
import type { RatesClient } from "./rates/client.ts";
import { registerPing } from "./tools/ping.ts";
import { registerGetTime } from "./tools/get-time.ts";
import { registerListCustomers } from "./tools/list-customers.ts";
import { registerGetCustomer } from "./tools/get-customer.ts";
import { registerGetExchangeRate } from "./tools/get-exchange-rate.ts";
import { registerChartCustomersByCity } from "./tools/chart-customers-by-city.ts";
import { registerUpdateCustomerTier } from "./tools/update-customer-tier.ts";
import { registerDeleteCustomer } from "./tools/delete-customer.ts";
import { registerGenerateReport } from "./tools/generate-report.ts";

export const SERVER_VERSION = "0.3.0";

export interface ServerDeps {
  customers: CustomerRepository;
  rates: RatesClient;
  log: Logger;
  now: () => Date;
  reportStepMs?: number;
}

/** Composition root: đọc là biết server có tool gì. */
export function createServer(deps: ServerDeps): McpServer {
  const server = new McpServer(
    { name: "nexus", version: SERVER_VERSION },
    {
      // logging: bật logging/setLevel + notifications/message. Thiếu dòng này, log gửi client bị bỏ qua im lặng.
      capabilities: { logging: {} },
      instructions:
        "Nexus: dữ liệu khách hàng của công ty. Mọi tool có tiền tố nexus_. " +
        "Đếm/lọc dùng nexus_list_customers (đọc 'total'); chi tiết 1 khách dùng nexus_get_customer với id lấy từ danh sách.",
    },
  );
  const { customers, log, now } = deps;
  registerPing(server, { version: SERVER_VERSION });
  registerGetTime(server, { now, log });
  registerListCustomers(server, { customers, log });
  registerGetCustomer(server, { customers, log });
  registerGetExchangeRate(server, { rates: deps.rates, log });
  registerChartCustomersByCity(server, { customers, log });
  registerUpdateCustomerTier(server, { customers, log });
  registerDeleteCustomer(server, { customers, log });
  registerGenerateReport(server, { customers, log, now, stepMs: deps.reportStepMs ?? 400 });
  return server;
}
```

#### Pattern: Hằng tên dùng chung (`as const` object)

**Vấn đề:** cùng một tên tool xuất hiện ở server (đăng ký), host (web gọi, lọc), test (smoke) và trong description của tool khác. Chuỗi rải rác thì đổi tên sót một chỗ là hỏng lúc chạy (Bẫy 3 ở trên, output `Tool list_customers not found`).

**Tương đương C#:** `public static class ToolNames { public const string ListCustomers = "nexus_list_customers"; }`, hoặc `nameof(...)` trong C# MCP SDK.

**Dịch thẳng vs kiểu TS** — hai tab, cùng compile sạch:

`lesson-code/m3/patterns/tool-names.direct.ts`

```ts
/**
 * Dịch thẳng từ C#:  public static class ToolNames { public const string ListCustomers = "nexus_list_customers"; ... }
 * Chạy được, nhưng: class chỉ để chứa hằng, và kiểu của mỗi hằng là `string` — mất thông tin tên cụ thể.
 */
export class ToolNames {
  static readonly Prefix = "nexus_";
  static readonly ListCustomers = ToolNames.Prefix + "list_customers";
  static readonly GetCustomer = ToolNames.Prefix + "get_customer";

  private constructor() {}
}

// Kiểu là string: switch không kiểm được "đã xử lý hết tool chưa", gõ sai chuỗi ở chỗ khác vẫn compile.
export function describe(name: string): string {
  switch (name) {
    case ToolNames.ListCustomers:
      return "đếm/liệt kê";
    case "nexus_get_customr": // gõ sai — không ai báo
      return "chi tiết";
    default:
      return "không rõ";
  }
}
```
`packages/shared/src/tools.ts`

```ts
/**
 * Tên tool của Nexus — 1 nguồn duy nhất cho server, web (host) và test.
 * Quy ước: <prefix>_<động từ>_<danh từ>, snake_case, chỉ [a-z0-9_] (SEP-986 cho phép thêm '.', '-').
 */
export const TOOL = {
  ping: "nexus_ping",
  getTime: "nexus_get_time",
  listCustomers: "nexus_list_customers",
  getCustomer: "nexus_get_customer",
  getExchangeRate: "nexus_get_exchange_rate",
  chartCustomersByCity: "nexus_chart_customers_by_city",
  updateCustomerTier: "nexus_update_customer_tier",
  deleteCustomer: "nexus_delete_customer",
  generateReport: "nexus_generate_report",
} as const;

export type ToolName = (typeof TOOL)[keyof typeof TOOL];
```

- Bản dịch thẳng: class chỉ để chứa hằng (có constructor private cho “giống static class”), mỗi hằng có type `string` → hàm nhận `name: string`, và `case "nexus_get_customr"` gõ sai vẫn compile.
- Bản TS: object literal + `as const`. Type của từng field là literal; `ToolName` là union 9 chuỗi, dùng làm type tham số thì truyền chuỗi lạ là lỗi compile. Không class, không `private constructor`.
- Đặt ở `packages/shared` (không phải trong `apps/mcp-server`) vì web là **host** và cũng cần tên — đúng chỗ mà C# sẽ đặt vào 1 project `Contracts` dùng chung.

**Khi nào KHÔNG dùng:** đừng làm “registry” sinh tên tự động (`prefix + camelToSnake(key)`) — tên tool phải đọc được nguyên văn khi grep log. Đừng tạo `enum`/class wrapper quanh `TOOL`. Chỉ đưa vào bảng những tên **nhiều nơi** cần; tên tool thử nghiệm dùng một lần trong test thì để chuỗi tại chỗ.

### Trắc nghiệm S3.1

1. Server A và server B cùng khai tool `list_customers`. Host gộp tool vào 1 bảng theo tên. Theo output thật trong bài, bảng còn mấy tool và LLM gọi `list_customers` sẽ tới đâu?
   - A. 2 tool, host tự hỏi LLM chọn server
   - B. 1 tool — bản đăng ký sau đè bản trước, mọi lời gọi đi tới server sau
   - C. Host từ chối kết nối server thứ hai

   <details><summary>Đáp án</summary>

   **B.** Output `host-collision.ts`: “'list_customers' của support đè lên bản của crm … (tổng 1 tool)”. Prefix `nexus_` tránh chuyện này ở mọi host, kể cả host không tự namespace.

   </details>

2. Handler tool trả `return "pong";`. Chuyện gì sai?
   - A. Không sai, SDK tự bọc thành text
   - B. Kết quả tool phải là object có `content` là **mảng** khối `{ type, … }`, ví dụ `[{ type: "text", text: "pong" }]`
   - C. Phải trả `Promise<string>`

   <details><summary>Đáp án</summary>

   **B.** `content` luôn là mảng — một tool có thể trả nhiều khối (text + image). Lab 01 của C50 kiểm đúng điều này.

   </details>

3. Câu nào trong description giúp model chọn đúng giữa `nexus_list_customers` và `nexus_chart_customers_by_city` nhất?
   - A. “Tool này dùng MongoDB.”
   - B. “Chỉ gọi khi người dùng muốn XEM biểu đồ; để trả lời bằng số, dùng nexus_list_customers.”
   - C. “Tool quan trọng, hãy ưu tiên gọi.”

   <details><summary>Đáp án</summary>

   **B.** Model chọn theo khác biệt giữa các description. Chi tiết hạ tầng vô ích với nó; câu “khi nào không gọi / gọi gì thay” mới tách được 2 tool gần nhau.

   </details>


---

## S3.1 · Cheat Sheet

### Quy tắc đặt tên

| Quy tắc | Ví dụ đúng | Ví dụ sai |
|---|---|---|
| Prefix chung cho cả server | `nexus_get_customer` | `get_customer` |
| Động từ đứng sau prefix | `nexus_list_customers` | `nexus_customers` |
| Chỉ `[A-Za-z0-9_.-]`, ≤ 128 ký tự | `nexus_update_customer_tier` | `nexus/update tier` |
| Không lộ hạ tầng | `nexus_list_customers` | `nexus_mongo_find_customers` |
| 1 nguồn tên | `TOOL.listCustomers` | `"nexus_list_customers"` rải ở 4 file |

### Khung description

```txt
<Làm gì: động từ + đối tượng>.
Gọi khi <câu hỏi / tình huống của người dùng>.
<Khi nào KHÔNG gọi — gọi tool nào thay>.
<Đọc kết quả thế nào: field nào để đếm, field nào bị cắt>.
```

### Hình dạng tối thiểu

| Thành phần | Bắt buộc | Ghi chú |
|---|---|---|
| `name` | có | Tham số 1 của `registerTool` |
| `title` | không | Tên hiển thị cho người trong UI host |
| `description` | nên có | Prompt cho model |
| `inputSchema` | không | Không có = tool không nhận tham số (`{}`) |
| handler trả `content: [...]` | có | Mảng khối `text` / `image` / … |

### Lệnh

```console
$ node scripts/call.ts nexus_ping '{}'
$ node scripts/call.ts list_customers '{}'          # tên cũ → Tool list_customers not found
$ pnpm smoke | head -1                               # tools (9): nexus_…
```

### Pattern của session

| Pattern | Session | Tương đương C# / .NET | Dùng khi |
|---|---|---|---|
| Hằng tên dùng chung (`as const` object) | S3.1 | `static class ToolNames` + `const string`, `nameof` | Tên tool dùng ở server, host, test: 1 nguồn, gõ sai là lỗi compile |



---

## S3.1 · Code

### Cây thư mục

```txt
nexus/
├─ packages/shared/src/
│  ├─ tools.ts                 TOOL (M3)
│  └─ index.ts
├─ apps/mcp-server/src/
│  ├─ server.ts                instructions + đăng ký 9 tool
│  └─ tools/ping.ts · get-time.ts · list-customers.ts
└─ apps/web/lib/llm/scripted.ts   dùng TOOL.listCustomers
lesson-code/m3/
├─ connect.ts · inspect-tools.ts · call.ts
└─ traps/bad-name.ts · dup-name.ts · dup-name-client.ts · crm-server.ts · host-collision.ts
```

### packages/shared

`packages/shared/src/tools.ts`

```ts
/**
 * Tên tool của Nexus — 1 nguồn duy nhất cho server, web (host) và test.
 * Quy ước: <prefix>_<động từ>_<danh từ>, snake_case, chỉ [a-z0-9_] (SEP-986 cho phép thêm '.', '-').
 */
export const TOOL = {
  ping: "nexus_ping",
  getTime: "nexus_get_time",
  listCustomers: "nexus_list_customers",
  getCustomer: "nexus_get_customer",
  getExchangeRate: "nexus_get_exchange_rate",
  chartCustomersByCity: "nexus_chart_customers_by_city",
  updateCustomerTier: "nexus_update_customer_tier",
  deleteCustomer: "nexus_delete_customer",
  generateReport: "nexus_generate_report",
} as const;

export type ToolName = (typeof TOOL)[keyof typeof TOOL];
```
`packages/shared/src/index.ts`

```ts
export * from "./customer.ts";
export * from "./chat.ts";
export * from "./tools.ts";
export * from "./exchange-rate.ts";
```

### apps/mcp-server

`apps/mcp-server/src/server.ts`

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CustomerRepository } from "./customers/repository.ts";
import type { Logger } from "./log.ts";
import type { RatesClient } from "./rates/client.ts";
import { registerPing } from "./tools/ping.ts";
import { registerGetTime } from "./tools/get-time.ts";
import { registerListCustomers } from "./tools/list-customers.ts";
import { registerGetCustomer } from "./tools/get-customer.ts";
import { registerGetExchangeRate } from "./tools/get-exchange-rate.ts";
import { registerChartCustomersByCity } from "./tools/chart-customers-by-city.ts";
import { registerUpdateCustomerTier } from "./tools/update-customer-tier.ts";
import { registerDeleteCustomer } from "./tools/delete-customer.ts";
import { registerGenerateReport } from "./tools/generate-report.ts";

export const SERVER_VERSION = "0.3.0";

export interface ServerDeps {
  customers: CustomerRepository;
  rates: RatesClient;
  log: Logger;
  now: () => Date;
  reportStepMs?: number;
}

/** Composition root: đọc là biết server có tool gì. */
export function createServer(deps: ServerDeps): McpServer {
  const server = new McpServer(
    { name: "nexus", version: SERVER_VERSION },
    {
      // logging: bật logging/setLevel + notifications/message. Thiếu dòng này, log gửi client bị bỏ qua im lặng.
      capabilities: { logging: {} },
      instructions:
        "Nexus: dữ liệu khách hàng của công ty. Mọi tool có tiền tố nexus_. " +
        "Đếm/lọc dùng nexus_list_customers (đọc 'total'); chi tiết 1 khách dùng nexus_get_customer với id lấy từ danh sách.",
    },
  );
  const { customers, log, now } = deps;
  registerPing(server, { version: SERVER_VERSION });
  registerGetTime(server, { now, log });
  registerListCustomers(server, { customers, log });
  registerGetCustomer(server, { customers, log });
  registerGetExchangeRate(server, { rates: deps.rates, log });
  registerChartCustomersByCity(server, { customers, log });
  registerUpdateCustomerTier(server, { customers, log });
  registerDeleteCustomer(server, { customers, log });
  registerGenerateReport(server, { customers, log, now, stepMs: deps.reportStepMs ?? 400 });
  return server;
}
```
`apps/mcp-server/src/tools/ping.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL } from "@nexus/shared";
import { z } from "zod";
import { toolOk } from "../tool-result.ts";

const PingOutput = z.object({ ok: z.literal(true), server: z.string() });

export function registerPing(server: McpServer, deps: { version: string }): void {
  server.registerTool(
    TOOL.ping,
    {
      title: "Ping",
      description: "Kiểm tra server Nexus còn sống. Chỉ dùng khi người dùng hỏi hệ thống có hoạt động không.",
      outputSchema: PingOutput.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => toolOk(PingOutput, { ok: true, server: `nexus ${deps.version}` }),
  );
}
```
`apps/mcp-server/src/tools/get-time.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL } from "@nexus/shared";
import { z } from "zod";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface GetTimeDeps {
  now: () => Date;
  log: Logger;
}

const GetTimeOutput = z.object({
  timeZone: z.string(),
  iso: z.string().describe("Thời điểm UTC, ISO 8601"),
  local: z.string().describe("Giờ địa phương, định dạng tiếng Việt"),
});

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function registerGetTime(server: McpServer, deps: GetTimeDeps): void {
  server.registerTool(
    TOOL.getTime,
    {
      title: "Giờ hiện tại",
      description:
        "Lấy ngày giờ hiện tại theo múi giờ IANA. Gọi khi câu hỏi phụ thuộc 'hôm nay', 'bây giờ', 'tuần này' — " +
        "model không tự biết ngày hiện tại.",
      inputSchema: {
        timeZone: z.string().default("Asia/Ho_Chi_Minh").describe("Tên múi giờ IANA, ví dụ 'Asia/Ho_Chi_Minh', 'Europe/Berlin'."),
      },
      outputSchema: GetTimeOutput.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.getTime, deps.log, async ({ timeZone }) => {
      if (!isValidTimeZone(timeZone)) {
        return toolFail({
          what: `Múi giờ '${timeZone}' không có trong cơ sở dữ liệu IANA.`,
          next: "Gọi lại với tên dạng Khu_vực/Thành_phố, ví dụ 'Asia/Ho_Chi_Minh' cho Việt Nam.",
        });
      }
      const now = deps.now();
      const local = new Intl.DateTimeFormat("vi-VN", { timeZone, dateStyle: "full", timeStyle: "medium" }).format(now);
      return toolOk(GetTimeOutput, { timeZone, iso: now.toISOString(), local });
    }),
  );
}
```
`apps/mcp-server/src/tools/list-customers.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListCustomersInputSchema, ListCustomersOutputSchema, TOOL } from "@nexus/shared";
import type { CustomerRepository } from "../customers/repository.ts";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface ListCustomersDeps {
  customers: CustomerRepository;
  log: Logger;
}

export function registerListCustomers(server: McpServer, deps: ListCustomersDeps): void {
  server.registerTool(
    TOOL.listCustomers,
    {
      title: "Danh sách khách hàng",
      description:
        "Đếm hoặc liệt kê khách hàng, lọc theo thành phố. Gọi khi người dùng hỏi 'có bao nhiêu khách', " +
        "'khách nào ở X', hoặc cần id để gọi nexus_get_customer. Để đếm, đọc 'total' — 'items' bị cắt theo 'limit'.",
      inputSchema: ListCustomersInputSchema.shape,
      outputSchema: ListCustomersOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.listCustomers, deps.log, async ({ city, limit }) => {
      try {
        const page = await deps.customers.list({ city, limit });
        return toolOk(ListCustomersOutputSchema, {
          total: page.total,
          returned: page.items.length,
          items: page.items.map(({ id, name, city: c, tier }) => ({ id, name, city: c, tier })),
        });
      } catch (err) {
        deps.log.error("list customers: db error", { err: String(err) });
        return toolFail({ what: "Không đọc được dữ liệu khách hàng (cơ sở dữ liệu không phản hồi).", next: "Thử lại sau ít phút; đừng đoán số liệu." });
      }
    }),
  );
}
```

### apps/web

`apps/web/lib/llm/scripted.ts`

```ts
import { TOOL } from "@nexus/shared";
import type { LlmEvent, LlmProvider, StreamRequest } from "./types.ts";

export interface ScriptedOptions {
  delayMs: number;
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => { clearTimeout(t); reject(signal.reason); }, { once: true });
  });

/**
 * Provider giả lập có kịch bản — không phải LLM. Dùng khi không có API key (dev, CI, E2E).
 * Lượt 1: câu hỏi có "khách" → đề nghị gọi nexus_list_customers. Lượt 2: đọc 'total' từ kết quả tool, trả lời từng từ.
 */
export function createScriptedProvider(opts: ScriptedOptions): LlmProvider {
  return {
    name: "scripted",
    async *stream(req: StreamRequest, signal: AbortSignal): AsyncIterable<LlmEvent> {
      const last = req.messages.at(-1);
      if (last?.role === "user" && /khách/i.test(last.content) && req.tools.some((t) => t.name === TOOL.listCustomers)) {
        const city = /hà nội|ha noi/i.test(last.content) ? "Hà Nội" : undefined;
        yield { type: "tool_call", call: { id: "call_1", name: TOOL.listCustomers, input: city ? { city, limit: 5 } : { limit: 5 } } };
        yield { type: "end" };
        return;
      }
      let answer = "Mình chỉ là provider giả lập, hãy hỏi về khách hàng.";
      if (last?.role === "tool") {
        const first = last.results[0];
        const total = first && !first.isError ? (JSON.parse(first.content) as { total?: number }).total : undefined;
        answer = total === undefined ? "Không đọc được dữ liệu khách hàng." : `Theo dữ liệu hiện có, có ${total} khách hàng khớp câu hỏi của bạn.`;
      }
      for (const word of answer.split(" ")) {
        await sleep(opts.delayMs, signal);
        yield { type: "text", delta: word + " " };
      }
      yield { type: "end" };
    },
  };
}
```

### lesson-code (script và bẫy dùng trong bài)

`lesson-code/m3/connect.ts`

```ts
/** Mở MCP client thật tới server Nexus (stdio) — dùng chung cho các script minh họa của Module 3. */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export const NEXUS_ENTRY = "/home/claude/nexus/apps/mcp-server/src/index.ts";

export async function connectNexus(env: Record<string, string> = {}, entry = NEXUS_ENTRY, stderr: "inherit" | "ignore" = "ignore"): Promise<Client> {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [entry],
    env: { NEXUS_DATA: "memory", LOG_LEVEL: "warn", PATH: process.env["PATH"] ?? "", ...env },
    stderr,
  });
  const client = new Client({ name: "lesson-m3", version: "0.0.0" });
  await client.connect(transport);
  return client;
}
```
`lesson-code/m3/inspect-tools.ts`

```ts
/** In bảng tool mà host nhìn thấy: tên, annotation, có outputSchema không, câu đầu của description. */
import { connectNexus } from "./connect.ts";

const client = await connectNexus();
const { tools } = await client.listTools();
const flag = (v: boolean | undefined, s: string) => (v === true ? s : v === false ? "-" : "?");
console.log("tool                            RO DE ID OW  out  description (câu đầu)");
for (const t of tools) {
  const a = t.annotations ?? {};
  const first = (t.description ?? "").split(/(?<=\.)\s/)[0] ?? "";
  console.log(
    `${t.name.padEnd(32)}${flag(a.readOnlyHint, "✓").padEnd(3)}${flag(a.destructiveHint, "✓").padEnd(3)}` +
      `${flag(a.idempotentHint, "✓").padEnd(3)}${flag(a.openWorldHint, "✓").padEnd(4)}${(t.outputSchema ? "có" : "—").padEnd(5)}${first.slice(0, 70)}`,
  );
}
await client.close();
```
`lesson-code/m3/call.ts`

```ts
/**
 * Gọi 1 tool của Nexus qua MCP client thật và in: thời gian, isError, từng phần content, structuredContent.
 *   node m3/call.ts <tool> '<json args>'         (env RATES_API_URL=... để trỏ tới rates-stub)
 */
import { connectNexus } from "./connect.ts";

const [name = "nexus_ping", raw = "{}"] = process.argv.slice(2);
const env: Record<string, string> = {};
for (const k of ["RATES_API_URL", "RATES_TIMEOUT_MS", "LOG_LEVEL"]) {
  const v = process.env[k];
  if (v) env[k] = v;
}
const client = await connectNexus(env);
await client.listTools(); // client cache outputSchema để tự kiểm structuredContent
const t0 = performance.now();
const res = await client.callTool({ name, arguments: JSON.parse(raw) as Record<string, unknown> });
const ms = Math.round(performance.now() - t0);
console.log(`${res.isError ? "[isError]" : "ok"} ${name} · ${ms} ms`);
for (const c of Array.isArray(res.content) ? res.content : []) {
  if (c.type === "text") console.log(`  content[text]  ${c.text}`);
  else if (c.type === "image") console.log(`  content[image] ${c.mimeType} · base64 ${c.data.length} ký tự · đầu: ${c.data.slice(0, 24)}…`);
  else console.log(`  content[${c.type}]`);
}
if (res.structuredContent) console.log(`  structuredContent ${JSON.stringify(res.structuredContent)}`);
await client.close();
```
`lesson-code/m3/traps/crm-server.ts`

```ts
/** Server MCP thứ 2 (giả lập CRM của bên thứ ba) — tên tool KHÔNG có prefix: list_customers. Tên hiển thị lấy từ argv. */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const label = process.argv[2] ?? "crm";
const server = new McpServer({ name: label, version: "0.0.0" });
server.registerTool(
  "list_customers",
  { description: `Liệt kê khách hàng trong ${label}` },
  async () => ({ content: [{ type: "text", text: JSON.stringify({ source: label, total: 3 }) }] }),
);
await server.connect(new StdioServerTransport());
```
`lesson-code/m3/traps/host-collision.ts`

```ts
/**
 * Bẫy S3.1: host gộp tool từ nhiều server vào 1 bảng theo tên. 2 server cùng có "list_customers" → cái sau đè cái trước,
 * LLM gọi "list_customers" mà không biết đang hỏi hệ thống nào.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { NEXUS_ENTRY } from "../connect.ts";

async function open(args: string[]): Promise<Client> {
  const c = new Client({ name: "naive-host", version: "0.0.0" });
  await c.connect(new StdioClientTransport({ command: process.execPath, args, env: { NEXUS_DATA: "memory", LOG_LEVEL: "error", PATH: process.env["PATH"] ?? "" }, stderr: "ignore" }));
  return c;
}

async function mergeTools(servers: Array<[string, Client]>): Promise<Map<string, string>> {
  const table = new Map<string, string>(); // tên tool → server
  for (const [label, client] of servers) {
    for (const t of (await client.listTools()).tools) {
      if (table.has(t.name)) console.log(`  ! '${t.name}' của ${label} đè lên bản của ${table.get(t.name)}`);
      table.set(t.name, label);
    }
  }
  return table;
}

const crm = new URL("./crm-server.ts", import.meta.url).pathname;
console.log("host A: crm + support (cả hai đặt tên list_customers)");
const a = await mergeTools([["crm", await open([crm, "crm"])], ["support", await open([crm, "support"])]]);
console.log(`  list_customers → ${a.get("list_customers")}  (tổng ${a.size} tool)`);

console.log("host B: crm + nexus (nexus dùng prefix nexus_)");
const b = await mergeTools([["crm", await open([crm, "crm"])], ["nexus", await open([NEXUS_ENTRY])]]);
console.log(`  list_customers → ${b.get("list_customers")} · nexus_list_customers → ${b.get("nexus_list_customers")}  (tổng ${b.size} tool)`);
process.exit(0);
```
`lesson-code/m3/traps/dup-name-client.ts`

```ts
/** Host kết nối vào server dup-name.ts — xem host nhận được gì. */
import { connectNexus } from "../connect.ts";

try {
  await connectNexus({}, new URL("./dup-name.ts", import.meta.url).pathname, "inherit");
} catch (err) {
  console.log(`host: ${err instanceof Error ? err.message : String(err)}`);
}
```

---

## S3.2 — Validate input: schema hay handler

Mục tiêu: tách **lỗi hình thức** (chặn trong schema, handler không chạy) khỏi **lỗi nghiệp vụ** (handler trả lỗi kèm hướng đi tiếp), và làm cho id đã qua schema mang type riêng.

### C# → TS/Node

| Khái niệm C# | Tương đương TS/Node | Khác ở đâu |
|---|---|---|
| `[RegularExpression]`, `[Range]` trên DTO | `z.string().regex(...)`, `.min().max()` trong `inputSchema` | Ràng buộc đi vào JSON Schema gửi LLM (`pattern`, `maximum`) |
| Model binding fail → 400 `ProblemDetails` | SDK validate → `isError` + `MCP error -32602: Input validation error …` | Handler không chạy; message là thứ LLM đọc để gọi lại |
| `if (!ModelState.IsValid)` trong action | Không cần — tới handler là dữ liệu đã đúng hình dạng | Viết lại check trong handler = luật nằm 2 chỗ |
| `return NotFound()` | `toolFail({ what, next })` → `isError: true` | 404 không đủ: phải nói LLM làm gì tiếp |
| `readonly record struct CustomerId` | `z.string().regex(...).brand<"CustomerId">()` | Nhãn chỉ tồn tại lúc biên dịch; runtime vẫn là `string` |
| `string?` (nullable reference) | `.optional()` = có thể **vắng mặt** | `null` ≠ vắng mặt: `.optional()` từ chối `null` |
| `[Required]` | field không `.optional()` / không `.default()` | Nằm trong `required` của JSON Schema |

### Lab

#### Lab C50 — 03 Input Validation

**Mục tiêu:** phân biệt 2 loại lỗi input: loại bị từ chối ngay trong schema và loại chỉ phát hiện được khi xử lý.

- [ ] Lab 03 xanh.

**Lệnh nghiệm thu** (repo C50 — chưa chạy ở sandbox dựng bài):

```console
$ npm run check
```

Cần nắm để tự làm:

- Hỏi cho mỗi luật: “kiểm được **chỉ** bằng giá trị này không?” Có (định dạng, khoảng, độ dài, enum) → schema. Không, cần dữ liệu khác (tồn tại chưa, còn hàng không, có quyền không) → handler.
- Lỗi ở schema: bạn không viết code trả lỗi — SDK trả. Việc của bạn là message của ràng buộc (`regex(re, "message")`) đủ rõ.
- Lỗi ở handler: trả `isError: true` với text nói chuyện gì xảy ra và làm gì tiếp. Không `throw`.
- Harness sẽ gửi cả input sai hình thức lẫn input đúng hình thức nhưng sai nghiệp vụ — xem đề để biết message mong đợi.

#### Lab Nexus S3.2 — tool `nexus_get_customer`

**Mục tiêu:** lấy 1 khách theo id. Id sai định dạng bị schema chặn; id đúng định dạng nhưng không tồn tại trả lỗi gợi ý dùng `nexus_list_customers`.

- [ ] `id: "007"` → `[isError]` với `MCP error -32602: Input validation error … at id`; repository **không** bị gọi.
- [ ] `id: "cus_999"` → `[isError]` với câu có `nexus_list_customers`.
- [ ] `id: "cus_007"` → ok, có `structuredContent`.
- [ ] JSON Schema của tool có `"pattern"` cho `id` (LLM thấy luật trước khi gọi).
- [ ] `CustomerRepository.get` nhận `CustomerId` (branded), truyền `string` thô là lỗi compile.

**Lệnh nghiệm thu:**

```console
$ node scripts/call.ts nexus_get_customer '{"id":"007"}'
$ node scripts/call.ts nexus_get_customer '{"id":"cus_999"}'
$ node scripts/call.ts nexus_get_customer '{"id":"cus_007"}'
$ pnpm typecheck
```

**Gợi ý hướng làm:** `CustomerIdSchema` + `GetCustomerInputSchema` đặt ở `packages/shared/src/customer.ts`; thêm `get(id)` vào `CustomerRepository` và **cả hai** implementation; tool mới đăng ký trong `server.ts`.

Output thật — 3 lệnh đầu:

```console
$ node m3/call.ts nexus_get_customer '{"id":"007"}'; node m3/call.ts nexus_get_customer '{"id":"cus_999"}'; node m3/call.ts nexus_get_customer '{"id":"cus_007"}'
[isError] nexus_get_customer · 9 ms
  content[text]  MCP error -32602: Input validation error: Invalid arguments for tool nexus_get_customer: Id khách hàng có dạng 'cus_' + số, ví dụ 'cus_007' at id
[isError] nexus_get_customer · 7 ms
  content[text]  Không có khách hàng nào với id 'cus_999'. Gọi nexus_list_customers (có thể lọc theo thành phố) để lấy id đúng, rồi gọi lại.
ok nexus_get_customer · 9 ms
  content[text]  {"id":"cus_007","name":"In ấn Hồng Hà","email":"lienhe@kh007.vn","city":"Hà Nội","tier":"pro","createdAt":"2025-03-24T08:00:00.000Z"}
  structuredContent {"id":"cus_007","name":"In ấn Hồng Hà","email":"lienhe@kh007.vn","city":"Hà Nội","tier":"pro","createdAt":"2025-03-24T08:00:00.000Z"}
```

<details>
<summary>Xem sau khi làm xong — lời giải Lab Nexus S3.2</summary>

`packages/shared/src/customer.ts`

```ts
import { z } from "zod";

/** Thành phố có trong dữ liệu Nexus (dùng z.enum thay cho enum TS). */
export const CITIES = ["Hà Nội", "Hải Phòng", "TP.HCM", "Đà Nẵng", "Cần Thơ"] as const;
export type City = (typeof CITIES)[number];

export const TIERS = ["free", "pro", "enterprise"] as const;
export type Tier = (typeof TIERS)[number];

/** Id khách hàng: "cus_" + ít nhất 3 chữ số. Sai định dạng → schema chặn, handler không chạy. */
export const CUSTOMER_ID_RE = /^cus_\d{3,}$/;
export const CustomerIdSchema = z
  .string()
  .regex(CUSTOMER_ID_RE, "Id khách hàng có dạng 'cus_' + số, ví dụ 'cus_007'")
  .brand<"CustomerId">()
  .describe("Id khách hàng dạng 'cus_007' — lấy từ kết quả nexus_list_customers.");
export type CustomerId = z.infer<typeof CustomerIdSchema>;

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.email(),
  city: z.enum(CITIES),
  tier: z.enum(TIERS),
  createdAt: z.iso.datetime(),
});
export type Customer = z.infer<typeof CustomerSchema>;

export const MAX_LIST_LIMIT = 50;

export const ListCustomersInputSchema = z.object({
  city: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .optional()
    .describe(
      `Tên thành phố, có dấu hoặc không. Giá trị có dữ liệu: ${CITIES.join(", ")} ` +
        "(Sài Gòn / Hồ Chí Minh → dùng 'TP.HCM'). Bỏ trống = mọi thành phố.",
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_LIST_LIMIT)
    .default(20)
    .describe(`Số bản ghi tối đa trong 'items' (1–${MAX_LIST_LIMIT}). Không ảnh hưởng 'total'.`),
});
export type ListCustomersInput = z.infer<typeof ListCustomersInputSchema>;

export const CustomerSummarySchema = CustomerSchema.pick({ id: true, name: true, city: true, tier: true });
export type CustomerSummary = z.infer<typeof CustomerSummarySchema>;

export const ListCustomersOutputSchema = z.object({
  total: z.number().int().describe("Tổng số khách khớp bộ lọc — dùng field này để đếm"),
  returned: z.number().int().describe("Số phần tử trong items (≤ limit)"),
  items: z.array(CustomerSummarySchema),
});
export type ListCustomersOutput = z.infer<typeof ListCustomersOutputSchema>;

export const GetCustomerInputSchema = z.object({ id: CustomerIdSchema });
export const GetCustomerOutputSchema = CustomerSchema;

export const UpdateCustomerTierInputSchema = z.object({
  id: CustomerIdSchema,
  tier: z.enum(TIERS).describe("Gói mới: free | pro | enterprise"),
});
export const UpdateCustomerTierOutputSchema = z.object({
  id: z.string(),
  previousTier: z.enum(TIERS),
  tier: z.enum(TIERS),
  changed: z.boolean().describe("false nếu gói đã đúng từ trước (gọi lại không đổi gì)"),
});

export const DeleteCustomerInputSchema = z.object({ id: CustomerIdSchema });
export const DeleteCustomerOutputSchema = z.object({
  id: z.string(),
  deleted: z.boolean().describe("false nếu khách không tồn tại (đã xóa trước đó) — gọi lại an toàn"),
});

/**
 * Khóa so khớp thành phố: bỏ dấu tiếng Việt, đ→d, gộp khoảng trắng, bỏ dấu chấm, chữ thường.
 * "HÀ  NỘI" → "ha noi" · "Đà Nẵng" → "da nang" · "TP.HCM" → "tp hcm"
 */
export function cityKey(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[.]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
```
`apps/mcp-server/src/tools/get-customer.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetCustomerInputSchema, GetCustomerOutputSchema, TOOL } from "@nexus/shared";
import type { CustomerRepository } from "../customers/repository.ts";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface GetCustomerDeps {
  customers: CustomerRepository;
  log: Logger;
}

/**
 * Hai loại lỗi input:
 *  - Hình thức ('abc', 'cus-7') → schema (regex) chặn, handler không chạy.
 *  - Nghiệp vụ ('cus_999' đúng dạng nhưng không có) → handler trả isError kèm hướng đi tiếp.
 */
export function registerGetCustomer(server: McpServer, deps: GetCustomerDeps): void {
  server.registerTool(
    TOOL.getCustomer,
    {
      title: "Chi tiết khách hàng",
      description:
        "Lấy đầy đủ thông tin 1 khách hàng (email, gói, ngày tạo) theo id dạng 'cus_007'. " +
        "Chưa có id thì gọi nexus_list_customers trước — đừng tự đoán id.",
      inputSchema: GetCustomerInputSchema.shape,
      outputSchema: GetCustomerOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.getCustomer, deps.log, async ({ id }) => {
      const customer = await deps.customers.get(id);
      if (!customer) {
        return toolFail({
          what: `Không có khách hàng nào với id '${id}'.`,
          next: `Gọi ${TOOL.listCustomers} (có thể lọc theo thành phố) để lấy id đúng, rồi gọi lại.`,
        });
      }
      return toolOk(GetCustomerOutputSchema, customer);
    }),
  );
}
```
`apps/mcp-server/src/customers/repository.ts`

```ts
import type { Customer, CustomerId, Tier } from "@nexus/shared";

export interface CustomerQuery {
  city?: string | undefined;
  limit: number;
}

export interface CustomerPage {
  /** Tổng số bản ghi khớp filter (không bị limit cắt). */
  total: number;
  items: Customer[];
}

export interface TierChange {
  previousTier: Tier;
  tier: Tier;
  changed: boolean;
}

/** Hợp đồng hẹp theo use case — tool không biết Mongo hay RAM ở phía sau. */
export interface CustomerRepository {
  list(q: CustomerQuery): Promise<CustomerPage>;
  /** undefined = không tồn tại (lỗi nghiệp vụ, không phải exception). */
  get(id: CustomerId): Promise<Customer | undefined>;
  /** undefined = không tồn tại. Idempotent: đặt lại cùng gói → changed=false. */
  updateTier(id: CustomerId, tier: Tier): Promise<TierChange | undefined>;
  /** true = đã xóa, false = không có gì để xóa. Idempotent. */
  delete(id: CustomerId): Promise<boolean>;
}
```
`apps/mcp-server/src/customers/memory-repository.ts`

```ts
import { cityKey, type Customer } from "@nexus/shared";
import type { CustomerRepository } from "./repository.ts";

/** Cùng hợp đồng với bản Mongo — dùng cho dev không có DB, smoke test, CI. */
export function createMemoryCustomerRepository(seed: readonly Customer[]): CustomerRepository {
  const rows = new Map<string, Customer>(seed.map((c) => [c.id, { ...c }]));
  const newestFirst = (a: Customer, b: Customer) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id);
  return {
    async list({ city, limit }) {
      const key = city ? cityKey(city) : undefined;
      const hit = [...rows.values()].filter((c) => key === undefined || cityKey(c.city) === key).sort(newestFirst);
      return { total: hit.length, items: hit.slice(0, limit) };
    },
    async get(id) {
      const c = rows.get(id);
      return c ? { ...c } : undefined;
    },
    async updateTier(id, tier) {
      const c = rows.get(id);
      if (!c) return undefined;
      const previousTier = c.tier;
      c.tier = tier;
      return { previousTier, tier, changed: previousTier !== tier };
    },
    async delete(id) {
      return rows.delete(id);
    },
  };
}
```
`apps/mcp-server/src/customers/mongo-repository.ts`

```ts
import type { Collection, Db, Filter } from "mongodb";
import { cityKey, CustomerSchema, type Customer } from "@nexus/shared";
import type { CustomerRepository } from "./repository.ts";

/** Hình dạng trong DB: _id, Date thật, thêm cityKey để query có index. */
export interface CustomerDoc {
  _id: string;
  name: string;
  email: string;
  city: Customer["city"];
  cityKey: string;
  tier: Customer["tier"];
  createdAt: Date;
}

export function customersCollection(db: Db): Collection<CustomerDoc> {
  return db.collection<CustomerDoc>("customers");
}

export function toDoc(c: Customer): CustomerDoc {
  return { _id: c.id, name: c.name, email: c.email, city: c.city, cityKey: cityKey(c.city), tier: c.tier, createdAt: new Date(c.createdAt) };
}

/** Ranh giới tin cậy: document từ DB được parse lại bằng Zod. */
export function toCustomer(d: CustomerDoc): Customer {
  return CustomerSchema.parse({ id: d._id, name: d.name, email: d.email, city: d.city, tier: d.tier, createdAt: d.createdAt.toISOString() });
}

export function createMongoCustomerRepository(db: Db): CustomerRepository {
  const col = customersCollection(db);
  return {
    async list({ city, limit }) {
      const filter: Filter<CustomerDoc> = city ? { cityKey: cityKey(city) } : {};
      const [total, docs] = await Promise.all([
        col.countDocuments(filter),
        col.find(filter).sort({ createdAt: -1, _id: 1 }).limit(limit).toArray(),
      ]);
      return { total, items: docs.map(toCustomer) };
    },
    async get(id) {
      const doc = await col.findOne({ _id: id });
      return doc ? toCustomer(doc) : undefined;
    },
    async updateTier(id, tier) {
      // Trả document TRƯỚC khi sửa để biết gói cũ — 1 round-trip, không race giữa đọc và ghi
      const before = await col.findOneAndUpdate({ _id: id }, { $set: { tier } }, { returnDocument: "before" });
      if (!before) return undefined;
      return { previousTier: before.tier, tier, changed: before.tier !== tier };
    },
    async delete(id) {
      const res = await col.deleteOne({ _id: id });
      return res.deletedCount === 1;
    },
  };
}
```

</details>

<details>
<summary>Tra khi test đỏ</summary>

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| `id: "007"` vẫn vào handler | Luật định dạng nằm trong handler (`if (!/.../.test(id))`) | Chuyển vào `regex()` của schema |
| Message chỉ có `Invalid string: must match pattern …` | `regex(re)` không có message | `regex(re, "Id khách hàng có dạng 'cus_' + số, ví dụ 'cus_007'")` |
| `cus_999` trả `{"content":[]}` hoặc `null` | Handler trả kết quả rỗng thay vì lỗi | `toolFail({ what, next })` |
| `TS2345 … not assignable to parameter of type 'string & $brand<"CustomerId">'` | Truyền `string` chưa qua schema vào repository | Parse bằng `CustomerIdSchema` trước (hoặc lấy từ `args` của handler — đã parse) |
| `expected string, received null at city` | LLM gửi `null` cho field `.optional()` | Chấp nhận message (LLM gọi lại) hoặc đổi sang `.nullish()` nếu host của bạn hay gửi `null` |
| Harness C50 báo sai loại lỗi | Trả lỗi nghiệp vụ bằng `throw` | `throw` bị SDK bọc thành message thô — trả `isError` có chủ đích |

</details>

### Hai loại lỗi, hai chỗ chặn

**Sơ đồ (Luồng quyết định) — Tham số LLM gửi sai thì bị chặn ở đâu, và LLM nhận được gì?**

```mermaid
flowchart TD
    ev["LLM gửi arguments"] --> q1{"Khớp inputSchema?"}
    q1 -- "không" --> rno["✗ Schema chặn: -32602, handler không chạy"]
    q1 -- "có" --> q2{"Có trong dữ liệu?"}
    q2 -- "có" --> rsame["✓ structuredContent"]
    q2 -- "không" --> ryes["? isError + gợi ý gọi nexus_list_customers"]
```

**Đọc sơ đồ:** Đọc từ trên xuống. Câu 1 do SDK trả lời bằng CHÍNH schema Zod đã công bố cho LLM; câu 2 chỉ handler trả lời được vì cần dữ liệu thật. *Màu: đỏ gạch + ✗ + viền đứt = bị chặn/sai · vàng mù tạt + ? + viền chấm = cần xem lại · xanh ô-liu + ✓ = chạy đúng.*


Câu hỏi quyết định: **luật này kiểm được chỉ bằng giá trị đầu vào không?**

| Luật | Kiểm bằng | Chặn ở |
|---|---|---|
| `id` dạng `cus_` + số | chính giá trị | schema (`regex`) |
| `limit` 1–50 | chính giá trị | schema (`min`/`max`) |
| `tier` ∈ free/pro/enterprise | chính giá trị | schema (`z.enum`) |
| khách `cus_999` có tồn tại? | cần DB | handler |
| đổi gói có hợp lệ theo hợp đồng? | cần DB + luật nghiệp vụ | handler |

Schema có lợi thế mà handler không có: **model đọc được nó trước khi gọi**. Output thật — JSON Schema LLM nhận cho `nexus_get_customer`:

```console
$ node m3/schema.ts nexus_get_customer
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^cus_\\d{3,}$",
      "description": "Id khách hàng dạng 'cus_007' — lấy từ kết quả nexus_list_customers."
    }
  },
  "required": [
    "id"
  ],
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

So với cùng tool viết kiểu “validate trong action” (Bẫy 1): không có `pattern`, không có `description` — model chỉ biết `id` là một chuỗi.

### Phần khác C# thật sự

**1. Validation là một phần của hợp đồng công khai.** ASP.NET validate để bảo vệ server; MCP validate còn để **dạy client**: ràng buộc trong Zod thành `pattern`, `minimum`, `enum` trong JSON Schema mà LLM đọc. Luật nằm trong handler là luật vô hình.

**2. Lỗi validate là tool result, không phải exception.** SDK 1.30 bắt lỗi Zod và trả `result.isError: true` với text `MCP error -32602: Input validation error: Invalid arguments for tool … at <field>`. Model đọc được và gọi lại (M2 đã thấy với `limit: 500`).

**3. Branded type: parse một lần, type mang dấu vết.** `CustomerIdSchema` có `.brand<"CustomerId">()`. Sau khi SDK parse, `id` trong handler có type `string & $brand<"CustomerId">`. Repository khai `get(id: CustomerId)` → chỗ nào đưa `string` chưa qua schema vào là lỗi compile (Bẫy 3). Runtime không có gì thêm: vẫn là chuỗi, JSON Schema không đổi.

**4. `optional` ≠ `nullable`.** `.optional()` nghĩa là field **vắng mặt**. `null` là một giá trị khác và bị từ chối. Một số model/host gửi `"city": null` cho tham số không dùng.

### Bẫy dev .NET hay vấp

#### Bẫy 1 — validate định dạng trong handler

Thói quen `if (!ModelState.IsValid)`: schema để lỏng, luật viết trong handler.

`lesson-code/m3/traps/validate-in-handler.ts`

```ts
/**
 * Bẫy S3.2: dịch thẳng thói quen C# "validate trong action" — schema chỉ nói id là string,
 * luật định dạng nằm trong handler. LLM không nhìn thấy luật đó trong tools/list.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "validate-in-handler", version: "0.0.0" });
server.registerTool(
  "nexus_get_customer",
  { description: "Chi tiết khách hàng", inputSchema: { id: z.string() } },
  async ({ id }) => {
    if (!/^cus_\d{3,}$/.test(id)) {
      return { isError: true, content: [{ type: "text", text: "Invalid id" }] };
    }
    return { content: [{ type: "text", text: JSON.stringify({ id }) }] };
  },
);
await server.connect(new StdioServerTransport());
```

Chạy được, trả lỗi được — nhưng JSON Schema mà model nhìn thấy:

```console
$ node m3/schema.ts nexus_get_customer m3/traps/validate-in-handler.ts
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    }
  },
  "required": [
    "id"
  ],
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

Model không biết `id` phải có dạng `cus_…`, nên sẽ thử `"7"`, `"007"`, tên khách… và nhận `"Invalid id"` — không nói sai ở đâu. Mỗi lần thử là một vòng LLM tốn token.

#### Bẫy 2 — LLM gửi `null` cho field tùy chọn

```console
$ node m3/call.ts nexus_list_customers '{"city":null,"limit":5}'
[isError] nexus_list_customers · 9 ms
  content[text]  MCP error -32602: Input validation error: Invalid arguments for tool nexus_list_customers: Invalid input: expected string, received null at city
```

Không phải bug của bạn, nhưng nên biết trước. Nexus giữ `.optional()`: message chỉ đúng field, model gọi lại bỏ `city`. Nếu log cho thấy host của bạn gửi `null` thường xuyên, đổi sang `.nullish()` (JSON Schema cho phép cả `null`) và xử lý `null` như vắng mặt — đừng `z.preprocess` âm thầm, luật biến đổi đó không hiện trong schema.

#### Bẫy 3 — đưa `string` thô vào chỗ cần id đã kiểm

`lesson-code/m3/tsc-traps/brand.ts`

```ts
import type { CustomerRepository } from "../../../nexus/apps/mcp-server/src/customers/repository.ts";

export async function load(repo: CustomerRepository, raw: string) {
  return repo.get(raw);
}
```

> ❌ **TS2345** (dòng 4, cột 19): Argument of type 'string' is not assignable to parameter of type 'string & $brand<"CustomerId">'. Type 'string' is not assignable to type '$brand<"CustomerId">'.

Đây là lỗi bạn **muốn** có: một đường code khác (script, tool khác, M9 Server Action) muốn gọi `get` thì phải `CustomerIdSchema.parse(raw)` trước.

#### Bẫy 4 — lỗi nghiệp vụ trả “không có gì”

`return { content: [] }` hoặc `{ content: [{ type: "text", text: "null" }] }` khi không tìm thấy. Model hiểu là “khách tồn tại nhưng không có dữ liệu” và bịa phần còn lại. Không tìm thấy là **lỗi** (`isError: true`) kèm hướng: “Gọi nexus_list_customers … để lấy id đúng”.

### Code mẫu & pattern

#### Code production

`apps/mcp-server/src/tools/get-customer.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetCustomerInputSchema, GetCustomerOutputSchema, TOOL } from "@nexus/shared";
import type { CustomerRepository } from "../customers/repository.ts";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface GetCustomerDeps {
  customers: CustomerRepository;
  log: Logger;
}

/**
 * Hai loại lỗi input:
 *  - Hình thức ('abc', 'cus-7') → schema (regex) chặn, handler không chạy.
 *  - Nghiệp vụ ('cus_999' đúng dạng nhưng không có) → handler trả isError kèm hướng đi tiếp.
 */
export function registerGetCustomer(server: McpServer, deps: GetCustomerDeps): void {
  server.registerTool(
    TOOL.getCustomer,
    {
      title: "Chi tiết khách hàng",
      description:
        "Lấy đầy đủ thông tin 1 khách hàng (email, gói, ngày tạo) theo id dạng 'cus_007'. " +
        "Chưa có id thì gọi nexus_list_customers trước — đừng tự đoán id.",
      inputSchema: GetCustomerInputSchema.shape,
      outputSchema: GetCustomerOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.getCustomer, deps.log, async ({ id }) => {
      const customer = await deps.customers.get(id);
      if (!customer) {
        return toolFail({
          what: `Không có khách hàng nào với id '${id}'.`,
          next: `Gọi ${TOOL.listCustomers} (có thể lọc theo thành phố) để lấy id đúng, rồi gọi lại.`,
        });
      }
      return toolOk(GetCustomerOutputSchema, customer);
    }),
  );
}
```
`packages/shared/src/customer.ts`

```ts
import { z } from "zod";

/** Thành phố có trong dữ liệu Nexus (dùng z.enum thay cho enum TS). */
export const CITIES = ["Hà Nội", "Hải Phòng", "TP.HCM", "Đà Nẵng", "Cần Thơ"] as const;
export type City = (typeof CITIES)[number];

export const TIERS = ["free", "pro", "enterprise"] as const;
export type Tier = (typeof TIERS)[number];

/** Id khách hàng: "cus_" + ít nhất 3 chữ số. Sai định dạng → schema chặn, handler không chạy. */
export const CUSTOMER_ID_RE = /^cus_\d{3,}$/;
export const CustomerIdSchema = z
  .string()
  .regex(CUSTOMER_ID_RE, "Id khách hàng có dạng 'cus_' + số, ví dụ 'cus_007'")
  .brand<"CustomerId">()
  .describe("Id khách hàng dạng 'cus_007' — lấy từ kết quả nexus_list_customers.");
export type CustomerId = z.infer<typeof CustomerIdSchema>;

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.email(),
  city: z.enum(CITIES),
  tier: z.enum(TIERS),
  createdAt: z.iso.datetime(),
});
export type Customer = z.infer<typeof CustomerSchema>;

export const MAX_LIST_LIMIT = 50;

export const ListCustomersInputSchema = z.object({
  city: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .optional()
    .describe(
      `Tên thành phố, có dấu hoặc không. Giá trị có dữ liệu: ${CITIES.join(", ")} ` +
        "(Sài Gòn / Hồ Chí Minh → dùng 'TP.HCM'). Bỏ trống = mọi thành phố.",
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_LIST_LIMIT)
    .default(20)
    .describe(`Số bản ghi tối đa trong 'items' (1–${MAX_LIST_LIMIT}). Không ảnh hưởng 'total'.`),
});
export type ListCustomersInput = z.infer<typeof ListCustomersInputSchema>;

export const CustomerSummarySchema = CustomerSchema.pick({ id: true, name: true, city: true, tier: true });
export type CustomerSummary = z.infer<typeof CustomerSummarySchema>;

export const ListCustomersOutputSchema = z.object({
  total: z.number().int().describe("Tổng số khách khớp bộ lọc — dùng field này để đếm"),
  returned: z.number().int().describe("Số phần tử trong items (≤ limit)"),
  items: z.array(CustomerSummarySchema),
});
export type ListCustomersOutput = z.infer<typeof ListCustomersOutputSchema>;

export const GetCustomerInputSchema = z.object({ id: CustomerIdSchema });
export const GetCustomerOutputSchema = CustomerSchema;

export const UpdateCustomerTierInputSchema = z.object({
  id: CustomerIdSchema,
  tier: z.enum(TIERS).describe("Gói mới: free | pro | enterprise"),
});
export const UpdateCustomerTierOutputSchema = z.object({
  id: z.string(),
  previousTier: z.enum(TIERS),
  tier: z.enum(TIERS),
  changed: z.boolean().describe("false nếu gói đã đúng từ trước (gọi lại không đổi gì)"),
});

export const DeleteCustomerInputSchema = z.object({ id: CustomerIdSchema });
export const DeleteCustomerOutputSchema = z.object({
  id: z.string(),
  deleted: z.boolean().describe("false nếu khách không tồn tại (đã xóa trước đó) — gọi lại an toàn"),
});

/**
 * Khóa so khớp thành phố: bỏ dấu tiếng Việt, đ→d, gộp khoảng trắng, bỏ dấu chấm, chữ thường.
 * "HÀ  NỘI" → "ha noi" · "Đà Nẵng" → "da nang" · "TP.HCM" → "tp hcm"
 */
export function cityKey(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[.]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
```
`apps/mcp-server/src/tool-result.ts`

```ts
/**
 * Hai hình dạng kết quả tool của Nexus.
 *  - toolOk: structuredContent (máy đọc, khớp outputSchema) + text JSON (cho client/LLM chỉ đọc content).
 *  - toolFail: isError + 1 câu "chuyện gì xảy ra" + 1 câu "làm gì tiếp" — LLM đọc để tự sửa.
 * Lỗi giao thức (JSON-RPC error) KHÔNG đi qua đây: đó là việc của SDK.
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";

export function toolOk<S extends z.ZodObject>(schema: S, data: z.output<S>, extra: CallToolResult["content"] = []): CallToolResult {
  // schema chỉ để TS kiểm data khớp outputSchema lúc biên dịch; SDK kiểm lại lúc chạy
  void schema;
  return {
    structuredContent: data,
    content: [{ type: "text", text: JSON.stringify(data) }, ...extra],
  };
}

export interface ToolFailure {
  /** Chuyện gì xảy ra — sự thật, không đoán, không stack trace. */
  what: string;
  /** LLM (hoặc người dùng) nên làm gì tiếp: gọi tool nào, sửa tham số nào, hay dừng. */
  next: string;
}

export function toolFail({ what, next }: ToolFailure): CallToolResult {
  return { isError: true, content: [{ type: "text", text: `${what} ${next}` }] };
}
```

#### Pattern: Branded type (parse, don't validate)

**Vấn đề:** chuỗi `"cus_007"` đã qua kiểm tra và chuỗi `"abc"` chưa kiểm có cùng type `string`. Hàm sâu bên trong (repository) không phân biệt được, nên hoặc kiểm lại lần nữa, hoặc tin mù.

**Tương đương C#:** value object `public readonly record struct CustomerId(string Value)` với `static CustomerId Parse(string)` ném `FormatException`.

**Dịch thẳng vs kiểu TS:**

`lesson-code/m3/patterns/customer-id.direct.ts`

```ts
/**
 * Dịch thẳng value object C#:  public readonly record struct CustomerId { public static CustomerId Parse(string s) ... }
 * Class + private constructor + static Parse ném exception. Phải tự viết luật 2 lần (Parse + JSON Schema cho LLM).
 */
export class InvalidCustomerIdException extends Error {}

export class CustomerId {
  readonly value: string;
  private constructor(value: string) {
    this.value = value;
  }

  static parse(raw: string): CustomerId {
    if (!/^cus_\d{3,}$/.test(raw)) throw new InvalidCustomerIdException(`'${raw}' is not a valid customer id`);
    return new CustomerId(raw);
  }

  equals(other: CustomerId): boolean {
    return this.value === other.value;
  }

  toJSON(): string {
    return this.value;
  }
}

// JSON Schema cho LLM phải viết tay, lệch với parse() là chuyện sớm muộn
export const customerIdJsonSchema = { type: "string", pattern: "^cus_\\d{3,}$" } as const;

// Dùng: mọi chỗ phải nhớ .value, so sánh phải nhớ .equals (=== so tham chiếu)
export const same = CustomerId.parse("cus_007").equals(CustomerId.parse("cus_007"));
```
`packages/shared/src/customer.ts`

```ts
import { z } from "zod";

/** Thành phố có trong dữ liệu Nexus (dùng z.enum thay cho enum TS). */
export const CITIES = ["Hà Nội", "Hải Phòng", "TP.HCM", "Đà Nẵng", "Cần Thơ"] as const;
export type City = (typeof CITIES)[number];

export const TIERS = ["free", "pro", "enterprise"] as const;
export type Tier = (typeof TIERS)[number];

/** Id khách hàng: "cus_" + ít nhất 3 chữ số. Sai định dạng → schema chặn, handler không chạy. */
export const CUSTOMER_ID_RE = /^cus_\d{3,}$/;
export const CustomerIdSchema = z
  .string()
  .regex(CUSTOMER_ID_RE, "Id khách hàng có dạng 'cus_' + số, ví dụ 'cus_007'")
  .brand<"CustomerId">()
  .describe("Id khách hàng dạng 'cus_007' — lấy từ kết quả nexus_list_customers.");
export type CustomerId = z.infer<typeof CustomerIdSchema>;

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.email(),
  city: z.enum(CITIES),
  tier: z.enum(TIERS),
  createdAt: z.iso.datetime(),
});
export type Customer = z.infer<typeof CustomerSchema>;

export const MAX_LIST_LIMIT = 50;

export const ListCustomersInputSchema = z.object({
  city: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .optional()
    .describe(
      `Tên thành phố, có dấu hoặc không. Giá trị có dữ liệu: ${CITIES.join(", ")} ` +
        "(Sài Gòn / Hồ Chí Minh → dùng 'TP.HCM'). Bỏ trống = mọi thành phố.",
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_LIST_LIMIT)
    .default(20)
    .describe(`Số bản ghi tối đa trong 'items' (1–${MAX_LIST_LIMIT}). Không ảnh hưởng 'total'.`),
});
export type ListCustomersInput = z.infer<typeof ListCustomersInputSchema>;

export const CustomerSummarySchema = CustomerSchema.pick({ id: true, name: true, city: true, tier: true });
export type CustomerSummary = z.infer<typeof CustomerSummarySchema>;

export const ListCustomersOutputSchema = z.object({
  total: z.number().int().describe("Tổng số khách khớp bộ lọc — dùng field này để đếm"),
  returned: z.number().int().describe("Số phần tử trong items (≤ limit)"),
  items: z.array(CustomerSummarySchema),
});
export type ListCustomersOutput = z.infer<typeof ListCustomersOutputSchema>;

export const GetCustomerInputSchema = z.object({ id: CustomerIdSchema });
export const GetCustomerOutputSchema = CustomerSchema;

export const UpdateCustomerTierInputSchema = z.object({
  id: CustomerIdSchema,
  tier: z.enum(TIERS).describe("Gói mới: free | pro | enterprise"),
});
export const UpdateCustomerTierOutputSchema = z.object({
  id: z.string(),
  previousTier: z.enum(TIERS),
  tier: z.enum(TIERS),
  changed: z.boolean().describe("false nếu gói đã đúng từ trước (gọi lại không đổi gì)"),
});

export const DeleteCustomerInputSchema = z.object({ id: CustomerIdSchema });
export const DeleteCustomerOutputSchema = z.object({
  id: z.string(),
  deleted: z.boolean().describe("false nếu khách không tồn tại (đã xóa trước đó) — gọi lại an toàn"),
});

/**
 * Khóa so khớp thành phố: bỏ dấu tiếng Việt, đ→d, gộp khoảng trắng, bỏ dấu chấm, chữ thường.
 * "HÀ  NỘI" → "ha noi" · "Đà Nẵng" → "da nang" · "TP.HCM" → "tp hcm"
 */
export function cityKey(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[.]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
```

- Bản dịch thẳng: class + constructor private + `parse()` ném exception. Luật định dạng viết **2 lần** (regex trong `parse` và `pattern` trong JSON Schema viết tay). Chỗ dùng phải nhớ `.value`; `===` so tham chiếu nên phải có `equals()`; serialize phải có `toJSON()`.
- Bản TS: 1 schema Zod → JSON Schema cho LLM (`pattern`), validate runtime (SDK gọi), type `CustomerId` (`z.infer`). Giá trị runtime vẫn là `string` — `===`, `JSON.stringify`, `Map` key chạy như thường. Nhãn `$brand` chỉ sống lúc biên dịch.
- Parse ở **ranh giới** (SDK parse `arguments`), mọi hàm phía trong nhận `CustomerId` và không kiểm lại.

**Khi nào KHÔNG dùng:** không brand mọi `string` (tên khách, email hiển thị…) — chỉ những giá trị mà truyền nhầm gây hậu quả (id, tiền tệ, tenant id ở M10). Đừng dựng class value object song song với schema. Không brand dữ liệu nội bộ chưa bao giờ đi qua ranh giới.

### Trắc nghiệm S3.2

1. Tool `nexus_update_customer_tier` nhận `tier`. Luật “chỉ free/pro/enterprise” và luật “khách phải tồn tại” đặt ở đâu?
   - A. Cả hai trong handler, cho dễ đọc
   - B. `tier` trong schema (`z.enum`), “khách tồn tại” trong handler (cần DB)
   - C. Cả hai trong schema bằng `.refine()` gọi DB

   <details><summary>Đáp án</summary>

   **B.** Luật kiểm được chỉ bằng giá trị → schema (và model thấy `enum` trước khi gọi). Luật cần dữ liệu khác → handler. `.refine` gọi DB trộn I/O vào schema và không hiện được trong JSON Schema.

   </details>

2. Theo output thật, `nexus_get_customer {"id":"007"}` trả gì và handler có chạy không?
   - A. `isError` với `MCP error -32602: Input validation error … Id khách hàng có dạng 'cus_' + số … at id`; handler không chạy
   - B. JSON-RPC error -32602, không có result
   - C. Handler chạy và trả `Không có khách hàng nào với id '007'`

   <details><summary>Đáp án</summary>

   **A.** SDK 1.30 validate trước handler và gói lỗi vào result `isError` để model đọc được.

   </details>

3. `CustomerIdSchema` có `.brand<"CustomerId">()`. Lúc chạy, giá trị `id` trong handler là gì?
   - A. Object `{ value: "cus_007" }`
   - B. Chuỗi `"cus_007"` bình thường — brand chỉ là nhãn type lúc biên dịch
   - C. Chuỗi có thêm thuộc tính `$brand`

   <details><summary>Đáp án</summary>

   **B.** Branded type không có chi phí runtime. Nó chỉ ngăn truyền `string` chưa parse vào hàm đòi `CustomerId`.

   </details>


---

## S3.2 · Cheat Sheet

### Luật đặt ở đâu

| Câu hỏi | Có → | Không → |
|---|---|---|
| Kiểm được chỉ bằng giá trị này? | schema (Zod) | handler |
| Model cần biết luật trước khi gọi? | schema + `.describe()` | handler, message có hướng dẫn |
| Cần I/O (DB, API)? | handler | schema |

### Zod → JSON Schema (SDK 1.30)

| Zod | JSON Schema model thấy |
|---|---|
| `.regex(re, msg)` | `"pattern": "…"` |
| `.min(1).max(50)` trên number | `"minimum": 1, "maximum": 50` |
| `z.enum(["free","pro"])` | `"enum": ["free","pro"]` |
| `.optional()` | không nằm trong `required`; `null` bị từ chối |
| `.default(20)` | `"default": 20`, handler nhận `number` (không `undefined`) |
| `.brand<"X">()` | không đổi gì |
| `.describe("…")` | `"description": "…"` |

### Lệnh

```console
$ node scripts/call.ts nexus_get_customer '{"id":"007"}'      # schema chặn
$ node scripts/call.ts nexus_get_customer '{"id":"cus_999"}'  # handler: isError + gợi ý
$ node scripts/call.ts nexus_list_customers '{"city":null}'   # null ≠ optional
```

### Pattern của session

| Pattern | Session | Tương đương C# / .NET | Dùng khi |
|---|---|---|---|
| Branded type (parse, don't validate) | S3.2 | Value object `readonly record struct CustomerId` | Giá trị đã qua schema mang nhãn type; hàm nhận `CustomerId` không nhận `string` thô |



---

## S3.2 · Code

### Cây thư mục

```txt
nexus/
├─ packages/shared/src/customer.ts            CustomerIdSchema (brand), GetCustomerInputSchema, …
└─ apps/mcp-server/src/
   ├─ tool-result.ts                          toolFail (S3.3 giải thích đầy đủ)
   ├─ tools/get-customer.ts
   └─ customers/repository.ts · memory-repository.ts · mongo-repository.ts
lesson-code/m3/
├─ schema.ts
├─ traps/validate-in-handler.ts
└─ tsc-traps/brand.ts
```

### packages/shared

`packages/shared/src/customer.ts`

```ts
import { z } from "zod";

/** Thành phố có trong dữ liệu Nexus (dùng z.enum thay cho enum TS). */
export const CITIES = ["Hà Nội", "Hải Phòng", "TP.HCM", "Đà Nẵng", "Cần Thơ"] as const;
export type City = (typeof CITIES)[number];

export const TIERS = ["free", "pro", "enterprise"] as const;
export type Tier = (typeof TIERS)[number];

/** Id khách hàng: "cus_" + ít nhất 3 chữ số. Sai định dạng → schema chặn, handler không chạy. */
export const CUSTOMER_ID_RE = /^cus_\d{3,}$/;
export const CustomerIdSchema = z
  .string()
  .regex(CUSTOMER_ID_RE, "Id khách hàng có dạng 'cus_' + số, ví dụ 'cus_007'")
  .brand<"CustomerId">()
  .describe("Id khách hàng dạng 'cus_007' — lấy từ kết quả nexus_list_customers.");
export type CustomerId = z.infer<typeof CustomerIdSchema>;

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.email(),
  city: z.enum(CITIES),
  tier: z.enum(TIERS),
  createdAt: z.iso.datetime(),
});
export type Customer = z.infer<typeof CustomerSchema>;

export const MAX_LIST_LIMIT = 50;

export const ListCustomersInputSchema = z.object({
  city: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .optional()
    .describe(
      `Tên thành phố, có dấu hoặc không. Giá trị có dữ liệu: ${CITIES.join(", ")} ` +
        "(Sài Gòn / Hồ Chí Minh → dùng 'TP.HCM'). Bỏ trống = mọi thành phố.",
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_LIST_LIMIT)
    .default(20)
    .describe(`Số bản ghi tối đa trong 'items' (1–${MAX_LIST_LIMIT}). Không ảnh hưởng 'total'.`),
});
export type ListCustomersInput = z.infer<typeof ListCustomersInputSchema>;

export const CustomerSummarySchema = CustomerSchema.pick({ id: true, name: true, city: true, tier: true });
export type CustomerSummary = z.infer<typeof CustomerSummarySchema>;

export const ListCustomersOutputSchema = z.object({
  total: z.number().int().describe("Tổng số khách khớp bộ lọc — dùng field này để đếm"),
  returned: z.number().int().describe("Số phần tử trong items (≤ limit)"),
  items: z.array(CustomerSummarySchema),
});
export type ListCustomersOutput = z.infer<typeof ListCustomersOutputSchema>;

export const GetCustomerInputSchema = z.object({ id: CustomerIdSchema });
export const GetCustomerOutputSchema = CustomerSchema;

export const UpdateCustomerTierInputSchema = z.object({
  id: CustomerIdSchema,
  tier: z.enum(TIERS).describe("Gói mới: free | pro | enterprise"),
});
export const UpdateCustomerTierOutputSchema = z.object({
  id: z.string(),
  previousTier: z.enum(TIERS),
  tier: z.enum(TIERS),
  changed: z.boolean().describe("false nếu gói đã đúng từ trước (gọi lại không đổi gì)"),
});

export const DeleteCustomerInputSchema = z.object({ id: CustomerIdSchema });
export const DeleteCustomerOutputSchema = z.object({
  id: z.string(),
  deleted: z.boolean().describe("false nếu khách không tồn tại (đã xóa trước đó) — gọi lại an toàn"),
});

/**
 * Khóa so khớp thành phố: bỏ dấu tiếng Việt, đ→d, gộp khoảng trắng, bỏ dấu chấm, chữ thường.
 * "HÀ  NỘI" → "ha noi" · "Đà Nẵng" → "da nang" · "TP.HCM" → "tp hcm"
 */
export function cityKey(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[.]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
```

### apps/mcp-server

`apps/mcp-server/src/tools/get-customer.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetCustomerInputSchema, GetCustomerOutputSchema, TOOL } from "@nexus/shared";
import type { CustomerRepository } from "../customers/repository.ts";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface GetCustomerDeps {
  customers: CustomerRepository;
  log: Logger;
}

/**
 * Hai loại lỗi input:
 *  - Hình thức ('abc', 'cus-7') → schema (regex) chặn, handler không chạy.
 *  - Nghiệp vụ ('cus_999' đúng dạng nhưng không có) → handler trả isError kèm hướng đi tiếp.
 */
export function registerGetCustomer(server: McpServer, deps: GetCustomerDeps): void {
  server.registerTool(
    TOOL.getCustomer,
    {
      title: "Chi tiết khách hàng",
      description:
        "Lấy đầy đủ thông tin 1 khách hàng (email, gói, ngày tạo) theo id dạng 'cus_007'. " +
        "Chưa có id thì gọi nexus_list_customers trước — đừng tự đoán id.",
      inputSchema: GetCustomerInputSchema.shape,
      outputSchema: GetCustomerOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.getCustomer, deps.log, async ({ id }) => {
      const customer = await deps.customers.get(id);
      if (!customer) {
        return toolFail({
          what: `Không có khách hàng nào với id '${id}'.`,
          next: `Gọi ${TOOL.listCustomers} (có thể lọc theo thành phố) để lấy id đúng, rồi gọi lại.`,
        });
      }
      return toolOk(GetCustomerOutputSchema, customer);
    }),
  );
}
```
`apps/mcp-server/src/customers/repository.ts`

```ts
import type { Customer, CustomerId, Tier } from "@nexus/shared";

export interface CustomerQuery {
  city?: string | undefined;
  limit: number;
}

export interface CustomerPage {
  /** Tổng số bản ghi khớp filter (không bị limit cắt). */
  total: number;
  items: Customer[];
}

export interface TierChange {
  previousTier: Tier;
  tier: Tier;
  changed: boolean;
}

/** Hợp đồng hẹp theo use case — tool không biết Mongo hay RAM ở phía sau. */
export interface CustomerRepository {
  list(q: CustomerQuery): Promise<CustomerPage>;
  /** undefined = không tồn tại (lỗi nghiệp vụ, không phải exception). */
  get(id: CustomerId): Promise<Customer | undefined>;
  /** undefined = không tồn tại. Idempotent: đặt lại cùng gói → changed=false. */
  updateTier(id: CustomerId, tier: Tier): Promise<TierChange | undefined>;
  /** true = đã xóa, false = không có gì để xóa. Idempotent. */
  delete(id: CustomerId): Promise<boolean>;
}
```
`apps/mcp-server/src/customers/memory-repository.ts`

```ts
import { cityKey, type Customer } from "@nexus/shared";
import type { CustomerRepository } from "./repository.ts";

/** Cùng hợp đồng với bản Mongo — dùng cho dev không có DB, smoke test, CI. */
export function createMemoryCustomerRepository(seed: readonly Customer[]): CustomerRepository {
  const rows = new Map<string, Customer>(seed.map((c) => [c.id, { ...c }]));
  const newestFirst = (a: Customer, b: Customer) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id);
  return {
    async list({ city, limit }) {
      const key = city ? cityKey(city) : undefined;
      const hit = [...rows.values()].filter((c) => key === undefined || cityKey(c.city) === key).sort(newestFirst);
      return { total: hit.length, items: hit.slice(0, limit) };
    },
    async get(id) {
      const c = rows.get(id);
      return c ? { ...c } : undefined;
    },
    async updateTier(id, tier) {
      const c = rows.get(id);
      if (!c) return undefined;
      const previousTier = c.tier;
      c.tier = tier;
      return { previousTier, tier, changed: previousTier !== tier };
    },
    async delete(id) {
      return rows.delete(id);
    },
  };
}
```
`apps/mcp-server/src/customers/mongo-repository.ts`

```ts
import type { Collection, Db, Filter } from "mongodb";
import { cityKey, CustomerSchema, type Customer } from "@nexus/shared";
import type { CustomerRepository } from "./repository.ts";

/** Hình dạng trong DB: _id, Date thật, thêm cityKey để query có index. */
export interface CustomerDoc {
  _id: string;
  name: string;
  email: string;
  city: Customer["city"];
  cityKey: string;
  tier: Customer["tier"];
  createdAt: Date;
}

export function customersCollection(db: Db): Collection<CustomerDoc> {
  return db.collection<CustomerDoc>("customers");
}

export function toDoc(c: Customer): CustomerDoc {
  return { _id: c.id, name: c.name, email: c.email, city: c.city, cityKey: cityKey(c.city), tier: c.tier, createdAt: new Date(c.createdAt) };
}

/** Ranh giới tin cậy: document từ DB được parse lại bằng Zod. */
export function toCustomer(d: CustomerDoc): Customer {
  return CustomerSchema.parse({ id: d._id, name: d.name, email: d.email, city: d.city, tier: d.tier, createdAt: d.createdAt.toISOString() });
}

export function createMongoCustomerRepository(db: Db): CustomerRepository {
  const col = customersCollection(db);
  return {
    async list({ city, limit }) {
      const filter: Filter<CustomerDoc> = city ? { cityKey: cityKey(city) } : {};
      const [total, docs] = await Promise.all([
        col.countDocuments(filter),
        col.find(filter).sort({ createdAt: -1, _id: 1 }).limit(limit).toArray(),
      ]);
      return { total, items: docs.map(toCustomer) };
    },
    async get(id) {
      const doc = await col.findOne({ _id: id });
      return doc ? toCustomer(doc) : undefined;
    },
    async updateTier(id, tier) {
      // Trả document TRƯỚC khi sửa để biết gói cũ — 1 round-trip, không race giữa đọc và ghi
      const before = await col.findOneAndUpdate({ _id: id }, { $set: { tier } }, { returnDocument: "before" });
      if (!before) return undefined;
      return { previousTier: before.tier, tier, changed: before.tier !== tier };
    },
    async delete(id) {
      const res = await col.deleteOne({ _id: id });
      return res.deletedCount === 1;
    },
  };
}
```

### lesson-code

`lesson-code/m3/schema.ts`

```ts
/** In inputSchema (JSON Schema) mà LLM nhìn thấy cho 1 tool.  node m3/schema.ts <tool> [server-entry] */
import { connectNexus, NEXUS_ENTRY } from "./connect.ts";

const [name = "nexus_get_customer", entry = NEXUS_ENTRY] = process.argv.slice(2);
const client = await connectNexus({}, entry);
const tool = (await client.listTools()).tools.find((t) => t.name === name);
console.log(JSON.stringify(tool?.inputSchema, null, 2));
await client.close();
```
`lesson-code/m3/traps/validate-in-handler.ts`

```ts
/**
 * Bẫy S3.2: dịch thẳng thói quen C# "validate trong action" — schema chỉ nói id là string,
 * luật định dạng nằm trong handler. LLM không nhìn thấy luật đó trong tools/list.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "validate-in-handler", version: "0.0.0" });
server.registerTool(
  "nexus_get_customer",
  { description: "Chi tiết khách hàng", inputSchema: { id: z.string() } },
  async ({ id }) => {
    if (!/^cus_\d{3,}$/.test(id)) {
      return { isError: true, content: [{ type: "text", text: "Invalid id" }] };
    }
    return { content: [{ type: "text", text: JSON.stringify({ id }) }] };
  },
);
await server.connect(new StdioServerTransport());
```

---

## S3.3 — Structured output & thiết kế lỗi

Mục tiêu: tool trả dữ liệu **máy đọc được** (`structuredContent` khớp `outputSchema`) đi kèm text, và lỗi mà LLM tự sửa được. Phân biệt rõ lỗi trong tool result (`isError`) với lỗi giao thức (JSON-RPC error).

### C# → TS/Node

| Khái niệm C# | Tương đương TS/Node | Khác ở đâu |
|---|---|---|
| `[ProducesResponseType(typeof(Dto), 200)]` | `outputSchema` (shape Zod) | Đi vào `tools/list` thành JSON Schema; client **tự kiểm** kết quả |
| `return Ok(dto)` | `{ structuredContent: dto, content: [{ type: "text", text: JSON }] }` | Hai bản của cùng dữ liệu: máy đọc + text cho client/LLM cũ |
| `ProblemDetails` / `return NotFound()` | `{ isError: true, content: [text] }` | Vẫn là **result** thành công ở tầng giao thức |
| 500 / exception middleware | JSON-RPC `error: { code, message }` | Lỗi giao thức: không có `result`, model thường không thấy |
| Exception filter đổi exception → response | `toolFail({ what, next })` tường minh | SDK có “filter” sẵn nhưng gửi **nguyên** `err.message` (Bẫy 2) |
| Compiler kiểm `ActionResult<Dto>` | SDK v1 **không** kiểm kiểu `structuredContent` lúc biên dịch | `toolOk(schema, data)` lấy lại kiểm tra compile-time |
| `OneOf<T, Error>` / `Result<T>` | `CallToolResult` có hoặc không `isError` | Không cần thư viện: 2 hàm tạo 2 hình dạng |

### Lab

#### Lab C50 — 04 Structured Output · 05 Error Design

**Mục tiêu:** Lab 04 trả con số và kết luận ở dạng máy đọc được; Lab 05 viết lỗi nói rõ bước tiếp theo, và phân biệt lỗi tool với lỗi giao thức.

- [ ] Lab 04 xanh.
- [ ] Lab 05 xanh.

**Lệnh nghiệm thu** (repo C50 — chưa chạy ở sandbox dựng bài):

```console
$ npm run check
```

Cần nắm để tự làm:

- Lab 04: có `outputSchema` thì **phải** có `structuredContent` khớp schema — thiếu hoặc lệch là lỗi lúc chạy (Bẫy 1 cho thấy message thật). Vẫn giữ bản text trong `content`: client không đọc `structuredContent` chỉ thấy `content`.
- Lab 05: lỗi mà model có thể sửa bằng cách gọi lại khác đi → `isError: true` + text. Text có 2 phần: chuyện gì xảy ra (sự thật cụ thể: giá trị nào, vì sao) + làm gì tiếp (tham số nào đổi, tool nào gọi, hay dừng và báo người dùng).
- Lỗi giao thức là chuyện client gửi request hỏng (method không có, params sai hình dạng) — thường do SDK xử lý, bạn ít khi tự ném.

#### Lab Nexus S3.3 — `outputSchema` cho mọi tool, lỗi theo mẫu

**Mục tiêu:** 9 tool đều khai `outputSchema` và trả qua `toolOk`; mọi lỗi nghiệp vụ trả qua `toolFail({ what, next })`; exception không bao giờ tới model.

- [ ] Smoke không có dòng `✗ tool thiếu outputSchema`.
- [ ] Gõ sai 1 field trong dữ liệu đưa vào `toolOk` là lỗi **compile** (TS2561), không đợi tới lúc chạy.
- [ ] Mọi text lỗi có 2 câu: chuyện gì + làm gì tiếp.
- [ ] Nói được bằng lời (không nhìn): khi nào `isError: true`, khi nào là JSON-RPC error — kiểm bằng sơ đồ bên dưới.

**Lệnh nghiệm thu:**

```console
$ pnpm check
$ cd apps/mcp-server && node scripts/call.ts nexus_get_time '{"timeZone":"Hanoi"}'
```

**Gợi ý hướng làm:** schema output của khách hàng để ở `packages/shared` (web ở M11 sẽ đọc lại `structuredContent`); schema output riêng của 1 tool (ping, time, chart, report) để ngay trong file tool. Viết `tool-result.ts` trước, rồi sửa từng tool.

<details>
<summary>Xem sau khi làm xong — lời giải Lab Nexus S3.3</summary>

`apps/mcp-server/src/tool-result.ts`

```ts
/**
 * Hai hình dạng kết quả tool của Nexus.
 *  - toolOk: structuredContent (máy đọc, khớp outputSchema) + text JSON (cho client/LLM chỉ đọc content).
 *  - toolFail: isError + 1 câu "chuyện gì xảy ra" + 1 câu "làm gì tiếp" — LLM đọc để tự sửa.
 * Lỗi giao thức (JSON-RPC error) KHÔNG đi qua đây: đó là việc của SDK.
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";

export function toolOk<S extends z.ZodObject>(schema: S, data: z.output<S>, extra: CallToolResult["content"] = []): CallToolResult {
  // schema chỉ để TS kiểm data khớp outputSchema lúc biên dịch; SDK kiểm lại lúc chạy
  void schema;
  return {
    structuredContent: data,
    content: [{ type: "text", text: JSON.stringify(data) }, ...extra],
  };
}

export interface ToolFailure {
  /** Chuyện gì xảy ra — sự thật, không đoán, không stack trace. */
  what: string;
  /** LLM (hoặc người dùng) nên làm gì tiếp: gọi tool nào, sửa tham số nào, hay dừng. */
  next: string;
}

export function toolFail({ what, next }: ToolFailure): CallToolResult {
  return { isError: true, content: [{ type: "text", text: `${what} ${next}` }] };
}
```
`packages/shared/src/customer.ts`

```ts
import { z } from "zod";

/** Thành phố có trong dữ liệu Nexus (dùng z.enum thay cho enum TS). */
export const CITIES = ["Hà Nội", "Hải Phòng", "TP.HCM", "Đà Nẵng", "Cần Thơ"] as const;
export type City = (typeof CITIES)[number];

export const TIERS = ["free", "pro", "enterprise"] as const;
export type Tier = (typeof TIERS)[number];

/** Id khách hàng: "cus_" + ít nhất 3 chữ số. Sai định dạng → schema chặn, handler không chạy. */
export const CUSTOMER_ID_RE = /^cus_\d{3,}$/;
export const CustomerIdSchema = z
  .string()
  .regex(CUSTOMER_ID_RE, "Id khách hàng có dạng 'cus_' + số, ví dụ 'cus_007'")
  .brand<"CustomerId">()
  .describe("Id khách hàng dạng 'cus_007' — lấy từ kết quả nexus_list_customers.");
export type CustomerId = z.infer<typeof CustomerIdSchema>;

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.email(),
  city: z.enum(CITIES),
  tier: z.enum(TIERS),
  createdAt: z.iso.datetime(),
});
export type Customer = z.infer<typeof CustomerSchema>;

export const MAX_LIST_LIMIT = 50;

export const ListCustomersInputSchema = z.object({
  city: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .optional()
    .describe(
      `Tên thành phố, có dấu hoặc không. Giá trị có dữ liệu: ${CITIES.join(", ")} ` +
        "(Sài Gòn / Hồ Chí Minh → dùng 'TP.HCM'). Bỏ trống = mọi thành phố.",
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_LIST_LIMIT)
    .default(20)
    .describe(`Số bản ghi tối đa trong 'items' (1–${MAX_LIST_LIMIT}). Không ảnh hưởng 'total'.`),
});
export type ListCustomersInput = z.infer<typeof ListCustomersInputSchema>;

export const CustomerSummarySchema = CustomerSchema.pick({ id: true, name: true, city: true, tier: true });
export type CustomerSummary = z.infer<typeof CustomerSummarySchema>;

export const ListCustomersOutputSchema = z.object({
  total: z.number().int().describe("Tổng số khách khớp bộ lọc — dùng field này để đếm"),
  returned: z.number().int().describe("Số phần tử trong items (≤ limit)"),
  items: z.array(CustomerSummarySchema),
});
export type ListCustomersOutput = z.infer<typeof ListCustomersOutputSchema>;

export const GetCustomerInputSchema = z.object({ id: CustomerIdSchema });
export const GetCustomerOutputSchema = CustomerSchema;

export const UpdateCustomerTierInputSchema = z.object({
  id: CustomerIdSchema,
  tier: z.enum(TIERS).describe("Gói mới: free | pro | enterprise"),
});
export const UpdateCustomerTierOutputSchema = z.object({
  id: z.string(),
  previousTier: z.enum(TIERS),
  tier: z.enum(TIERS),
  changed: z.boolean().describe("false nếu gói đã đúng từ trước (gọi lại không đổi gì)"),
});

export const DeleteCustomerInputSchema = z.object({ id: CustomerIdSchema });
export const DeleteCustomerOutputSchema = z.object({
  id: z.string(),
  deleted: z.boolean().describe("false nếu khách không tồn tại (đã xóa trước đó) — gọi lại an toàn"),
});

/**
 * Khóa so khớp thành phố: bỏ dấu tiếng Việt, đ→d, gộp khoảng trắng, bỏ dấu chấm, chữ thường.
 * "HÀ  NỘI" → "ha noi" · "Đà Nẵng" → "da nang" · "TP.HCM" → "tp hcm"
 */
export function cityKey(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[.]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
```
`apps/mcp-server/src/tools/get-time.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL } from "@nexus/shared";
import { z } from "zod";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface GetTimeDeps {
  now: () => Date;
  log: Logger;
}

const GetTimeOutput = z.object({
  timeZone: z.string(),
  iso: z.string().describe("Thời điểm UTC, ISO 8601"),
  local: z.string().describe("Giờ địa phương, định dạng tiếng Việt"),
});

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function registerGetTime(server: McpServer, deps: GetTimeDeps): void {
  server.registerTool(
    TOOL.getTime,
    {
      title: "Giờ hiện tại",
      description:
        "Lấy ngày giờ hiện tại theo múi giờ IANA. Gọi khi câu hỏi phụ thuộc 'hôm nay', 'bây giờ', 'tuần này' — " +
        "model không tự biết ngày hiện tại.",
      inputSchema: {
        timeZone: z.string().default("Asia/Ho_Chi_Minh").describe("Tên múi giờ IANA, ví dụ 'Asia/Ho_Chi_Minh', 'Europe/Berlin'."),
      },
      outputSchema: GetTimeOutput.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.getTime, deps.log, async ({ timeZone }) => {
      if (!isValidTimeZone(timeZone)) {
        return toolFail({
          what: `Múi giờ '${timeZone}' không có trong cơ sở dữ liệu IANA.`,
          next: "Gọi lại với tên dạng Khu_vực/Thành_phố, ví dụ 'Asia/Ho_Chi_Minh' cho Việt Nam.",
        });
      }
      const now = deps.now();
      const local = new Intl.DateTimeFormat("vi-VN", { timeZone, dateStyle: "full", timeStyle: "medium" }).format(now);
      return toolOk(GetTimeOutput, { timeZone, iso: now.toISOString(), local });
    }),
  );
}
```

Refactor `list_customers` của M2 (diff thật giữa 2 commit, phần handler):

`apps/mcp-server/src/tools/list-customers.ts`

```diff
       inputSchema: ListCustomersInputSchema.shape,
-      annotations: { readOnlyHint: true },
+      outputSchema: ListCustomersOutputSchema.shape,
+      annotations: { readOnlyHint: true, openWorldHint: false },
     },
-    async ({ city, limit }) => {
+    instrument(TOOL.listCustomers, deps.log, async ({ city, limit }) => {
       try {
         const page = await deps.customers.list({ city, limit });
-        const body = {
+        return toolOk(ListCustomersOutputSchema, {
           total: page.total,
           returned: page.items.length,
           items: page.items.map(({ id, name, city: c, tier }) => ({ id, name, city: c, tier })),
-        };
-        return { content: [{ type: "text", text: JSON.stringify(body) }] };
+        });
       } catch (err) {
-        deps.log.error("list_customers failed", { err: String(err) });
-        return {
-          isError: true,
-          content: [{ type: "text", text: "Không đọc được dữ liệu khách hàng (DB không phản hồi). Thử lại sau ít phút." }],
-        };
+        deps.log.error("list customers: db error", { err: String(err) });
+        return toolFail({ what: "Không đọc được dữ liệu khách hàng (cơ sở dữ liệu không phản hồi).", next: "Thử lại sau ít phút; đừng đoán số liệu." });
       }
-    },
+    }),
```

(`instrument` là decorator của S3.5.)

</details>

<details>
<summary>Tra khi test đỏ</summary>

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| `Output validation error: Tool X has an output schema but no structured content was provided` | Khai `outputSchema`, handler chỉ trả `content` | Trả qua `toolOk(schema, data)` |
| `Output validation error: Invalid structured content … at total` | Field sai tên/kiểu so với schema | `toolOk` bắt lúc compile (TS2561); sửa field |
| Client ném `Structured content does not match the tool's output schema` | Server khác (không phải SDK) trả sai; client SDK tự kiểm | Sửa server, không tắt kiểm ở client |
| Model nhận `connect ECONNREFUSED …`, `Cannot read properties of undefined` | Exception bay khỏi handler, SDK gửi nguyên message | Bắt và `toolFail`; hoặc bọc bằng `instrument` (S3.5) |
| Lỗi nghiệp vụ trả JSON-RPC error | Tự `throw new McpError(...)` trong handler | Chỉ dùng `isError` result — model mới đọc được |
| `isError: true` kèm `structuredContent` bị client bỏ qua | Client không đọc `structuredContent` khi `isError` | Đặt thông tin lỗi trong `content` text |

</details>

### Hai bản của cùng một kết quả

Output thật — JSON-RPC thô của `nexus_get_customer` (script ở tab Code):

```console
$ bash m3/raw-errors.sh
{"jsonrpc":"2.0","id":6,"error":{"code":-32601,"message":"Method not found"}}
{"jsonrpc":"2.0","id":5,"error":{"code":-32603,"message":"[\n  {\n    \"expected\": \"string\",\n    \"code\": \"invalid_type\",\n    \"path\": [\n      \"params\",\n      \"name\"\n    ],\n    \"message\": \"Invalid input: expected string, received undefined\"\n  }\n]"}}
{"result":{"protocolVersion":"2025-11-25","capabilities":{"logging":{},"tools":{"listChanged":true}},"serverInfo":{"name":"nexus","version":"0.3.0"},"instructions":"Nexus: dữ liệu khách hàng của công ty. Mọi tool có tiền tố nexus_. Đếm/lọc dùng nexus_list_customers (đọc 'total'); chi tiết 1 khách dùng nexus_get_customer với id lấy từ danh sách."},"jsonrpc":"2.0","id":1}
{"result":{"content":[{"type":"text","text":"MCP error -32602: Tool nexus_nope not found"}],"isError":true},"jsonrpc":"2.0","id":4}
{"method":"notifications/message","params":{"level":"warning","logger":"nexus","data":{"msg":"tool failed","tool":"nexus_get_customer","ms":0}},"jsonrpc":"2.0"}
{"result":{"content":[{"type":"text","text":"Không có khách hàng nào với id 'cus_999'. Gọi nexus_list_customers (có thể lọc theo thành phố) để lấy id đúng, rồi gọi lại."}],"isError":true},"jsonrpc":"2.0","id":3}
{"result":{"content":[{"type":"text","text":"{\"id\":\"cus_007\",\"name\":\"In ấn Hồng Hà\",\"email\":\"lienhe@kh007.vn\",\"city\":\"Hà Nội\",\"tier\":\"pro\",\"createdAt\":\"2025-03-24T08:00:00.000Z\"}"}],"structuredContent":{"id":"cus_007","name":"In ấn Hồng Hà","email":"lienhe@kh007.vn","city":"Hà Nội","tier":"pro","createdAt":"2025-03-24T08:00:00.000Z"}},"jsonrpc":"2.0","id":2}
{"method":"notifications/message","params":{"level":"info","logger":"nexus","data":{"msg":"shutting down","reason":"stdin closed"}},"jsonrpc":"2.0"}
```

Đọc output (thứ tự dòng là thứ tự server trả xong, không phải thứ tự gửi — ghép theo `id`):

- `id: 2` (`cus_007`): `result` có **cả** `structuredContent` (object) và `content[0].text` (cùng dữ liệu, chuỗi JSON). Client mới đọc `structuredContent` và tự kiểm theo `outputSchema`; client cũ và phần lớn host hiện nay đưa `content` cho model.
- `id: 3` (`cus_999`): vẫn là `result`, có `isError: true` — **lỗi tool**. Model đọc câu đó.
- `id: 4` (`nexus_nope`): SDK 1.30 cũng trả `result` `isError` cho tool không tồn tại, để model thấy và chọn tool khác.
- `id: 5` (thiếu `name`) và `id: 6` (method lạ): **lỗi giao thức** — có `error`, không có `result`. SDK 1.30 trả `-32603` kèm dump Zod cho params hỏng (spec gợi ý `-32602`) và `-32601 Method not found` cho method lạ.
- `id: 7` (dòng JSON cắt dở): không có dòng trả lời nào. SDK 1.30 trên stdio bỏ qua dòng không parse được thay vì trả `-32700`.
- Dòng `notifications/message` là log của S3.5 (mức `warning` khi tool trả lỗi).

### `isError` hay lỗi giao thức?

**Sơ đồ (Luồng quyết định) — Server trả lỗi theo đường nào: JSON-RPC error hay result có isError?**

```mermaid
flowchart TD
    ev["Message tới server"] --> q1{"Request hợp lệ?"}
    q1 -- "không" --> rno["✗ Lỗi giao thức: JSON-RPC error {code}"]
    q1 -- "có" --> q2{"Tool chạy thành công?"}
    q2 -- "có" --> rsame["✓ result: structuredContent + text"]
    q2 -- "không" --> ryes["? result isError: true — LLM đọc và tự sửa"]
```

**Đọc sơ đồ:** Đọc từ trên xuống. Câu 1 là việc của SDK (tầng giao thức): hỏng ở đây thì không có result, LLM thường không được thấy. Câu 2 là việc của tool: mọi thứ LLM cần đọc để tự sửa đi vào result. *Màu: đỏ gạch + ✗ + viền đứt = bị chặn/sai · vàng mù tạt + ? + viền chấm = cần xem lại · xanh ô-liu + ✓ = chạy đúng.*


Quy tắc cho code của bạn: **mọi thứ model cần đọc để làm tiếp → `isError` result**. Lỗi giao thức để dành cho request hỏng về hình thức JSON-RPC — SDK lo. Trong M3 bạn không tự ném lỗi giao thức lần nào.

Mẫu câu lỗi của Nexus (`toolFail`):

| Tình huống | `what` (chuyện gì) | `next` (làm gì tiếp) |
|---|---|---|
| Id không tồn tại | “Không có khách hàng nào với id 'cus_999'.” | “Gọi nexus_list_customers … để lấy id đúng, rồi gọi lại.” |
| Tham số sai giá trị | “Múi giờ 'Hanoi' không có trong cơ sở dữ liệu IANA.” | “Gọi lại với tên dạng Khu_vực/Thành_phố, ví dụ 'Asia/Ho_Chi_Minh'.” |
| Hạ tầng lỗi tạm thời | “Không đọc được dữ liệu khách hàng (cơ sở dữ liệu không phản hồi).” | “Thử lại sau ít phút; đừng đoán số liệu.” |
| Lỗi không lường trước | “Tool X gặp lỗi nội bộ.” | “Đừng thử lại ngay với cùng tham số; báo người dùng là hệ thống đang lỗi.” |

Câu `next` quan trọng nhất ở dòng 3: model có thói quen “trả lời cho có” khi tool lỗi. Nói thẳng “đừng đoán số liệu” giảm hẳn chuyện bịa.

### Phần khác C# thật sự

**1. Client kiểm kết quả của server.** `tools/list` công bố `outputSchema`; client SDK tự validate `structuredContent` của mỗi lần gọi và ném nếu lệch. Hợp đồng được kiểm ở **cả hai đầu** lúc chạy — khác Swagger chỉ là tài liệu.

**2. SDK v1 không nối type giữa `outputSchema` và handler.** `registerTool` khai handler trả `CallToolResult` chung chung: `structuredContent: { totl: 12 }` vẫn compile. Vì vậy Nexus đi qua `toolOk(schema, data)` — `data: z.output<S>` làm tsc kiểm lại (Bẫy 1).

**3. SDK có “exception filter” sẵn — và nó quá thật thà.** Handler ném → SDK bắt → `{ isError: true, content: [{ text: err.message }] }`. Không crash, nhưng message nội bộ đi thẳng tới model (Bẫy 2).

### Bẫy dev .NET hay vấp

#### Bẫy 1 — `structuredContent` lệch `outputSchema`

`lesson-code/m3/traps/output-mismatch.ts`

```ts
/**
 * Bẫy S3.3: khai outputSchema nhưng trả structuredContent lệch schema (gõ nhầm 'totl'), hoặc quên structuredContent.
 * SDK v1 KHÔNG kiểm kiểu handler lúc biên dịch — chỉ lộ lúc chạy.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "output-mismatch", version: "0.0.0" });
const outputSchema = { total: z.number().int(), returned: z.number().int() };

server.registerTool("nexus_count_typo", { description: "Đếm khách (gõ nhầm field)", outputSchema }, async () => ({
  structuredContent: { totl: 12, returned: 5 },
  content: [{ type: "text", text: '{"totl":12,"returned":5}' }],
}));

server.registerTool("nexus_count_text_only", { description: "Đếm khách (quên structuredContent)", outputSchema }, async () => ({
  content: [{ type: "text", text: '{"total":12,"returned":5}' }],
}));
await server.connect(new StdioServerTransport());
```

Compile sạch. Lúc chạy:

```console
$ node m3/call-any.ts m3/traps/output-mismatch.ts nexus_count_typo; node m3/call-any.ts m3/traps/output-mismatch.ts nexus_count_text_only
[isError] nexus_count_typo → MCP error -32602: Output validation error: Invalid structured content for tool nexus_count_typo: Invalid input: expected number, received undefined at total
[isError] nexus_count_text_only → MCP error -32602: Output validation error: Tool nexus_count_text_only has an output schema but no structured content was provided
```

Qua `toolOk`, lỗi gõ sai lộ ngay trong editor:

`lesson-code/m3/tsc-traps/tool-ok-typo.ts`

```ts
import { ListCustomersOutputSchema } from "@nexus/shared";
import { toolOk } from "../../../nexus/apps/mcp-server/src/tool-result.ts";

export const res = toolOk(ListCustomersOutputSchema, { totl: 12, returned: 0, items: [] });
```

> ❌ **TS2561** (dòng 4, cột 56): Object literal may only specify known properties, but 'totl' does not exist in type '{ total: number; returned: number; items: { id: string; name: string; city: "Hà Nội" | "Hải Phòng" | "TP.HCM" | "Đà Nẵng" | "Cần Thơ"; tier: "free" | "pro" | "enterprise"; }[]; }'. Did you mean to write 'total'?

#### Bẫy 2 — để exception bay khỏi handler

Quen có middleware lo exception, handler gọi driver không `try/catch`:

`lesson-code/m3/traps/throw-leak.ts`

```ts
/** Bẫy S3.3: để exception của driver bay ra khỏi handler. SDK bắt và gửi NGUYÊN message cho LLM. */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MongoClient } from "mongodb";

const mongo = new MongoClient("mongodb://nexus_app:s3cret@127.0.0.1:27999/nexus?authSource=admin", { serverSelectionTimeoutMS: 500 });
const server = new McpServer({ name: "throw-leak", version: "0.0.0" });
server.registerTool("nexus_count_customers", { description: "Đếm khách" }, async () => {
  const total = await mongo.db().collection("customers").countDocuments(); // không try/catch
  return { content: [{ type: "text", text: String(total) }] };
});
await server.connect(new StdioServerTransport());
```

```console
$ node m3/call-any.ts m3/traps/throw-leak.ts nexus_count_customers
[isError] nexus_count_customers → connect ECONNREFUSED 127.0.0.1:27999
```

Model vừa biết địa chỉ nội bộ của DB, vừa không biết phải làm gì. Với driver khác, message có thể chứa cả câu SQL, đường dẫn file, hoặc chuỗi kết nối. Chặn ở 2 lớp: lỗi dự đoán được → `toolFail` có chủ đích; lỗi không dự đoán được → decorator `instrument` (S3.5) log stack ra stderr và trả câu chung.

#### Bẫy 3 — lỗi nghiệp vụ ném `McpError`

Dịch thẳng `throw new HttpException(404)`:

`lesson-code/m3/traps/mcp-error-business.ts`

```ts
/** Bẫy S3.3: dịch thẳng `throw new HttpException(404)` thành McpError cho lỗi nghiệp vụ. */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const server = new McpServer({ name: "mcp-error-business", version: "0.0.0" });
server.registerTool("nexus_get_customer", { description: "Chi tiết khách", inputSchema: { id: z.string() } }, async ({ id }) => {
  throw new McpError(ErrorCode.InvalidParams, `Customer ${id} not found`);
});
await server.connect(new StdioServerTransport());
```

```console
$ node m3/call-any.ts m3/traps/mcp-error-business.ts nexus_get_customer '{"id":"cus_999"}'
[isError] nexus_get_customer · 12 ms → MCP error -32602: Customer cus_999 not found
```

SDK 1.30 không biến nó thành lỗi giao thức — vẫn bọc thành `isError`, và model đọc được `MCP error -32602` vô nghĩa với nó, không có bước tiếp theo. Bạn đã trộn 2 tầng mà không được gì. Lỗi nghiệp vụ = `toolFail`, hết.

#### Bẫy 4 — chỉ trả `structuredContent`, bỏ `content`

Hợp lệ theo schema, nhưng host không đọc `structuredContent` sẽ đưa cho model… một mảng `content` rỗng. `toolOk` luôn thêm bản text JSON của cùng dữ liệu.

### Code mẫu & pattern

#### Code production

`apps/mcp-server/src/tool-result.ts`

```ts
/**
 * Hai hình dạng kết quả tool của Nexus.
 *  - toolOk: structuredContent (máy đọc, khớp outputSchema) + text JSON (cho client/LLM chỉ đọc content).
 *  - toolFail: isError + 1 câu "chuyện gì xảy ra" + 1 câu "làm gì tiếp" — LLM đọc để tự sửa.
 * Lỗi giao thức (JSON-RPC error) KHÔNG đi qua đây: đó là việc của SDK.
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";

export function toolOk<S extends z.ZodObject>(schema: S, data: z.output<S>, extra: CallToolResult["content"] = []): CallToolResult {
  // schema chỉ để TS kiểm data khớp outputSchema lúc biên dịch; SDK kiểm lại lúc chạy
  void schema;
  return {
    structuredContent: data,
    content: [{ type: "text", text: JSON.stringify(data) }, ...extra],
  };
}

export interface ToolFailure {
  /** Chuyện gì xảy ra — sự thật, không đoán, không stack trace. */
  what: string;
  /** LLM (hoặc người dùng) nên làm gì tiếp: gọi tool nào, sửa tham số nào, hay dừng. */
  next: string;
}

export function toolFail({ what, next }: ToolFailure): CallToolResult {
  return { isError: true, content: [{ type: "text", text: `${what} ${next}` }] };
}
```
`apps/mcp-server/src/tools/list-customers.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListCustomersInputSchema, ListCustomersOutputSchema, TOOL } from "@nexus/shared";
import type { CustomerRepository } from "../customers/repository.ts";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface ListCustomersDeps {
  customers: CustomerRepository;
  log: Logger;
}

export function registerListCustomers(server: McpServer, deps: ListCustomersDeps): void {
  server.registerTool(
    TOOL.listCustomers,
    {
      title: "Danh sách khách hàng",
      description:
        "Đếm hoặc liệt kê khách hàng, lọc theo thành phố. Gọi khi người dùng hỏi 'có bao nhiêu khách', " +
        "'khách nào ở X', hoặc cần id để gọi nexus_get_customer. Để đếm, đọc 'total' — 'items' bị cắt theo 'limit'.",
      inputSchema: ListCustomersInputSchema.shape,
      outputSchema: ListCustomersOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.listCustomers, deps.log, async ({ city, limit }) => {
      try {
        const page = await deps.customers.list({ city, limit });
        return toolOk(ListCustomersOutputSchema, {
          total: page.total,
          returned: page.items.length,
          items: page.items.map(({ id, name, city: c, tier }) => ({ id, name, city: c, tier })),
        });
      } catch (err) {
        deps.log.error("list customers: db error", { err: String(err) });
        return toolFail({ what: "Không đọc được dữ liệu khách hàng (cơ sở dữ liệu không phản hồi).", next: "Thử lại sau ít phút; đừng đoán số liệu." });
      }
    }),
  );
}
```
`apps/mcp-server/src/tools/get-time.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL } from "@nexus/shared";
import { z } from "zod";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface GetTimeDeps {
  now: () => Date;
  log: Logger;
}

const GetTimeOutput = z.object({
  timeZone: z.string(),
  iso: z.string().describe("Thời điểm UTC, ISO 8601"),
  local: z.string().describe("Giờ địa phương, định dạng tiếng Việt"),
});

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function registerGetTime(server: McpServer, deps: GetTimeDeps): void {
  server.registerTool(
    TOOL.getTime,
    {
      title: "Giờ hiện tại",
      description:
        "Lấy ngày giờ hiện tại theo múi giờ IANA. Gọi khi câu hỏi phụ thuộc 'hôm nay', 'bây giờ', 'tuần này' — " +
        "model không tự biết ngày hiện tại.",
      inputSchema: {
        timeZone: z.string().default("Asia/Ho_Chi_Minh").describe("Tên múi giờ IANA, ví dụ 'Asia/Ho_Chi_Minh', 'Europe/Berlin'."),
      },
      outputSchema: GetTimeOutput.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.getTime, deps.log, async ({ timeZone }) => {
      if (!isValidTimeZone(timeZone)) {
        return toolFail({
          what: `Múi giờ '${timeZone}' không có trong cơ sở dữ liệu IANA.`,
          next: "Gọi lại với tên dạng Khu_vực/Thành_phố, ví dụ 'Asia/Ho_Chi_Minh' cho Việt Nam.",
        });
      }
      const now = deps.now();
      const local = new Intl.DateTimeFormat("vi-VN", { timeZone, dateStyle: "full", timeStyle: "medium" }).format(now);
      return toolOk(GetTimeOutput, { timeZone, iso: now.toISOString(), local });
    }),
  );
}
```

#### Pattern: Result union cho kết quả tool (`toolOk` / `toolFail`)

**Vấn đề:** tool có 2 kết cục hợp lệ — dữ liệu hoặc lỗi có hướng dẫn — và cả hai đều là **giá trị trả về** cho model đọc. Dùng exception để chở lỗi nghiệp vụ thì phải có một “filter” đoán loại exception rồi viết message chung chung.

**Tương đương C#:** `Results.Ok(dto)` / `Results.Problem(...)` trong Minimal API, hoặc `OneOf<T, Error>` / `Result<T>` thay cho exception filter.

**Dịch thẳng vs kiểu TS:**

`lesson-code/m3/patterns/tool-errors.direct.ts`

```ts
/**
 * Dịch thẳng từ ASP.NET: ném exception nghiệp vụ trong "service", 1 "exception filter" chung đổi thành response.
 * Với MCP: filter không biết LLM nên làm gì tiếp → message chung chung; exception lạ vẫn lọt nguyên văn.
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export class NotFoundException extends Error {
  readonly entity: string;
  readonly id: string;
  constructor(entity: string, id: string) {
    super(`${entity} ${id} not found`);
    this.entity = entity;
    this.id = id;
  }
}
export class ValidationException extends Error {}

interface Customer {
  id: string;
  name: string;
}
const db = new Map<string, Customer>([["cus_007", { id: "cus_007", name: "In ấn Hồng Hà" }]]);

export async function getCustomer(id: string): Promise<Customer> {
  const c = db.get(id);
  if (!c) throw new NotFoundException("Customer", id);
  return c;
}

/** "Exception filter" chung cho mọi tool. */
export async function withExceptionFilter(run: () => Promise<unknown>): Promise<CallToolResult> {
  try {
    return { content: [{ type: "text", text: JSON.stringify(await run()) }] };
  } catch (err) {
    if (err instanceof NotFoundException) return { isError: true, content: [{ type: "text", text: err.message }] };
    if (err instanceof ValidationException) return { isError: true, content: [{ type: "text", text: `Validation failed: ${err.message}` }] };
    return { isError: true, content: [{ type: "text", text: err instanceof Error ? err.message : "Error" }] }; // lọt message thô
  }
}

export const demo = withExceptionFilter(() => getCustomer("cus_999"));
```
`apps/mcp-server/src/tool-result.ts`

```ts
/**
 * Hai hình dạng kết quả tool của Nexus.
 *  - toolOk: structuredContent (máy đọc, khớp outputSchema) + text JSON (cho client/LLM chỉ đọc content).
 *  - toolFail: isError + 1 câu "chuyện gì xảy ra" + 1 câu "làm gì tiếp" — LLM đọc để tự sửa.
 * Lỗi giao thức (JSON-RPC error) KHÔNG đi qua đây: đó là việc của SDK.
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";

export function toolOk<S extends z.ZodObject>(schema: S, data: z.output<S>, extra: CallToolResult["content"] = []): CallToolResult {
  // schema chỉ để TS kiểm data khớp outputSchema lúc biên dịch; SDK kiểm lại lúc chạy
  void schema;
  return {
    structuredContent: data,
    content: [{ type: "text", text: JSON.stringify(data) }, ...extra],
  };
}

export interface ToolFailure {
  /** Chuyện gì xảy ra — sự thật, không đoán, không stack trace. */
  what: string;
  /** LLM (hoặc người dùng) nên làm gì tiếp: gọi tool nào, sửa tham số nào, hay dừng. */
  next: string;
}

export function toolFail({ what, next }: ToolFailure): CallToolResult {
  return { isError: true, content: [{ type: "text", text: `${what} ${next}` }] };
}
```

- Bản dịch thẳng: exception class cho từng loại lỗi + 1 filter chung. Filter chỉ biết **loại** lỗi, không biết ngữ cảnh → message kiểu `Customer cus_999 not found`, không có bước tiếp theo. Nhánh cuối để lọt `err.message` thô. Luồng điều khiển bằng exception khó đọc: nhìn `getCustomer` không biết nó “trả” lỗi gì.
- Bản TS: 2 hàm tạo đúng 2 hình dạng `CallToolResult`. Chỗ phát hiện lỗi (handler) là chỗ biết rõ nhất nên viết `what`/`next` tại chỗ. `toolOk` gắn `data` với `outputSchema` lúc compile. Không class, không `instanceof`.
- Exception vẫn còn — cho lỗi **không** lường trước — và được chặn một chỗ bởi `instrument` (S3.5).

**Khi nào KHÔNG dùng:** đừng tạo `Result<T, E>` generic + `map`/`flatMap` cho code bên trong server (repository trả `Customer | undefined` là đủ). Pattern này chỉ ở **ranh giới tool**, nơi kết quả rời khỏi process. Đừng thêm mã lỗi số (`E1234`) vào text cho model — nó không tra được bảng mã.

### Khác biệt SDK v2 (ghi chú, không đổi code bài)

Chạy thử `@modelcontextprotocol/server` 2.1.0 với đúng tool `nexus_get_customer` (file `lesson-code/m3-v2/check.mjs`) — output thật:

```console
$ node check.mjs
{"name":"nexus_get_customer","description":"x","inputSchema":{"type":"object","properties":{"id":{"type":"string","pattern":"^cus_\\d{3,}$"}},"required":["id"],"$schema":"https://json-schema.org/draft/2020-12/schema"},"outputSchema":{"type":"object","properties":{"id":{"type":"string"}},"required":[
{"content":[{"type":"text","text":"Input validation error: Invalid arguments for tool nexus_get_customer: id: Invalid string: must match pattern /^cus_\\d{3,}$/"}],"isError":true}
{"content":[{"type":"text","text":"cus_007"}],"structuredContent":{"id":"cus_007"}}
shape OK in v2
```

- `inputSchema`/`outputSchema` nhận nguyên `z.object(...)` (v1 dùng `.shape`); shape vẫn được chấp nhận.
- JSON Schema công bố theo draft **2020-12** (v1: draft-07).
- Lỗi validate input vẫn là `result.isError`, nhưng text bỏ tiền tố `MCP error -32602:`. Đừng viết test so khớp nguyên chuỗi message của SDK.
- Cách chuyển khi tới M15: đổi import sang `@modelcontextprotocol/server` / `…/client`, bỏ `.shape`. `toolOk`/`toolFail` không đổi.

### Trắc nghiệm S3.3

1. Tool khai `outputSchema` rồi trả `{ content: [{ type: "text", text: "{...}" }] }` không có `structuredContent`. Theo output thật, client nhận gì?
   - A. Kết quả bình thường, SDK tự parse text thành structuredContent
   - B. `isError` với `Output validation error: Tool … has an output schema but no structured content was provided`
   - C. JSON-RPC error -32603

   <details><summary>Đáp án</summary>

   **B.** SDK 1.30 validate output sau handler; lỗi được bọc thành result `isError`. Có `outputSchema` là phải có `structuredContent`.

   </details>

2. Handler gọi DB, DB từ chối kết nối, không có `try/catch`. Model nhận được gì?
   - A. Không gì cả, process chết
   - B. Câu “Lỗi hệ thống” do SDK viết sẵn
   - C. Nguyên văn `err.message` của driver, ví dụ `connect ECONNREFUSED 127.0.0.1:27999`, trong result `isError`

   <details><summary>Đáp án</summary>

   **C.** SDK bắt exception và gửi message thô. Lỗi dự đoán được → `toolFail`; còn lại → decorator chặn và log stack ra stderr.

   </details>

3. Client gửi `{"method":"tools/execute"}`. Đây là loại lỗi nào?
   - A. Lỗi giao thức: JSON-RPC `error` code -32601, không có `result`
   - B. Lỗi tool: `result.isError: true`
   - C. Không lỗi, server bỏ qua

   <details><summary>Đáp án</summary>

   **A.** Method không tồn tại là request hỏng ở tầng JSON-RPC, SDK trả `Method not found`. Model không bao giờ gửi method — đó là lỗi của client.

   </details>


---

## S3.3 · Cheat Sheet

### Hình dạng kết quả

| Kết cục | Hình dạng | Ai tạo |
|---|---|---|
| Thành công | `{ structuredContent, content: [{ type: "text", text: JSON }] }` | `toolOk(schema, data)` |
| Lỗi tool (model tự sửa) | `{ isError: true, content: [{ type: "text", text: what + next }] }` | `toolFail({ what, next })` |
| Input sai schema | `isError` + `MCP error -32602: Input validation error …` | SDK |
| Output sai schema | `isError` + `MCP error -32602: Output validation error …` | SDK |
| Exception trong handler | `isError` + `err.message` thô | SDK (tránh) |
| Request JSON-RPC hỏng | `{ error: { code, message } }` | SDK |

### Mã lỗi JSON-RPC gặp trong bài

| Code | Ý nghĩa | Gặp khi |
|---|---|---|
| -32601 | Method not found | method lạ (`tools/execute`, `logging/setLevel` khi server không khai logging) |
| -32602 | Invalid params | trong text của `isError` (validate input/output, tool không tồn tại) |
| -32603 | Internal error | params sai hình dạng (SDK 1.30) |
| -32001 | Request timed out | timeout **phía client** (S3.5) |
| -32000 | Connection closed | server chết (M2, S3.1 Bẫy 2) |

### Pattern của session

| Pattern | Session | Tương đương C# / .NET | Dùng khi |
|---|---|---|---|
| Result union cho kết quả tool (`toolOk` / `toolFail`) | S3.3 | `Results.Ok` / `ProblemDetails`, `OneOf<T, Error>` thay exception filter | Lỗi nghiệp vụ là dữ liệu có hướng dẫn cho LLM, không phải exception |



---

## S3.3 · Code

### Cây thư mục

```txt
nexus/
├─ packages/shared/src/customer.ts          ListCustomersOutputSchema, GetCustomerOutputSchema, Update…/Delete…OutputSchema
└─ apps/mcp-server/src/
   ├─ tool-result.ts                         toolOk / toolFail
   └─ tools/*.ts                             9 tool, mỗi tool có outputSchema
lesson-code/m3/
├─ raw-errors.sh · call-any.ts
├─ traps/output-mismatch.ts · throw-leak.ts · mcp-error-business.ts
├─ tsc-traps/tool-ok-typo.ts
└─ patterns/tool-errors.direct.ts
```

### apps/mcp-server

`apps/mcp-server/src/tool-result.ts`

```ts
/**
 * Hai hình dạng kết quả tool của Nexus.
 *  - toolOk: structuredContent (máy đọc, khớp outputSchema) + text JSON (cho client/LLM chỉ đọc content).
 *  - toolFail: isError + 1 câu "chuyện gì xảy ra" + 1 câu "làm gì tiếp" — LLM đọc để tự sửa.
 * Lỗi giao thức (JSON-RPC error) KHÔNG đi qua đây: đó là việc của SDK.
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";

export function toolOk<S extends z.ZodObject>(schema: S, data: z.output<S>, extra: CallToolResult["content"] = []): CallToolResult {
  // schema chỉ để TS kiểm data khớp outputSchema lúc biên dịch; SDK kiểm lại lúc chạy
  void schema;
  return {
    structuredContent: data,
    content: [{ type: "text", text: JSON.stringify(data) }, ...extra],
  };
}

export interface ToolFailure {
  /** Chuyện gì xảy ra — sự thật, không đoán, không stack trace. */
  what: string;
  /** LLM (hoặc người dùng) nên làm gì tiếp: gọi tool nào, sửa tham số nào, hay dừng. */
  next: string;
}

export function toolFail({ what, next }: ToolFailure): CallToolResult {
  return { isError: true, content: [{ type: "text", text: `${what} ${next}` }] };
}
```
`apps/mcp-server/src/tools/list-customers.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListCustomersInputSchema, ListCustomersOutputSchema, TOOL } from "@nexus/shared";
import type { CustomerRepository } from "../customers/repository.ts";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface ListCustomersDeps {
  customers: CustomerRepository;
  log: Logger;
}

export function registerListCustomers(server: McpServer, deps: ListCustomersDeps): void {
  server.registerTool(
    TOOL.listCustomers,
    {
      title: "Danh sách khách hàng",
      description:
        "Đếm hoặc liệt kê khách hàng, lọc theo thành phố. Gọi khi người dùng hỏi 'có bao nhiêu khách', " +
        "'khách nào ở X', hoặc cần id để gọi nexus_get_customer. Để đếm, đọc 'total' — 'items' bị cắt theo 'limit'.",
      inputSchema: ListCustomersInputSchema.shape,
      outputSchema: ListCustomersOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.listCustomers, deps.log, async ({ city, limit }) => {
      try {
        const page = await deps.customers.list({ city, limit });
        return toolOk(ListCustomersOutputSchema, {
          total: page.total,
          returned: page.items.length,
          items: page.items.map(({ id, name, city: c, tier }) => ({ id, name, city: c, tier })),
        });
      } catch (err) {
        deps.log.error("list customers: db error", { err: String(err) });
        return toolFail({ what: "Không đọc được dữ liệu khách hàng (cơ sở dữ liệu không phản hồi).", next: "Thử lại sau ít phút; đừng đoán số liệu." });
      }
    }),
  );
}
```
`apps/mcp-server/src/tools/get-time.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL } from "@nexus/shared";
import { z } from "zod";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface GetTimeDeps {
  now: () => Date;
  log: Logger;
}

const GetTimeOutput = z.object({
  timeZone: z.string(),
  iso: z.string().describe("Thời điểm UTC, ISO 8601"),
  local: z.string().describe("Giờ địa phương, định dạng tiếng Việt"),
});

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function registerGetTime(server: McpServer, deps: GetTimeDeps): void {
  server.registerTool(
    TOOL.getTime,
    {
      title: "Giờ hiện tại",
      description:
        "Lấy ngày giờ hiện tại theo múi giờ IANA. Gọi khi câu hỏi phụ thuộc 'hôm nay', 'bây giờ', 'tuần này' — " +
        "model không tự biết ngày hiện tại.",
      inputSchema: {
        timeZone: z.string().default("Asia/Ho_Chi_Minh").describe("Tên múi giờ IANA, ví dụ 'Asia/Ho_Chi_Minh', 'Europe/Berlin'."),
      },
      outputSchema: GetTimeOutput.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.getTime, deps.log, async ({ timeZone }) => {
      if (!isValidTimeZone(timeZone)) {
        return toolFail({
          what: `Múi giờ '${timeZone}' không có trong cơ sở dữ liệu IANA.`,
          next: "Gọi lại với tên dạng Khu_vực/Thành_phố, ví dụ 'Asia/Ho_Chi_Minh' cho Việt Nam.",
        });
      }
      const now = deps.now();
      const local = new Intl.DateTimeFormat("vi-VN", { timeZone, dateStyle: "full", timeStyle: "medium" }).format(now);
      return toolOk(GetTimeOutput, { timeZone, iso: now.toISOString(), local });
    }),
  );
}
```
`apps/mcp-server/src/tools/ping.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL } from "@nexus/shared";
import { z } from "zod";
import { toolOk } from "../tool-result.ts";

const PingOutput = z.object({ ok: z.literal(true), server: z.string() });

export function registerPing(server: McpServer, deps: { version: string }): void {
  server.registerTool(
    TOOL.ping,
    {
      title: "Ping",
      description: "Kiểm tra server Nexus còn sống. Chỉ dùng khi người dùng hỏi hệ thống có hoạt động không.",
      outputSchema: PingOutput.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => toolOk(PingOutput, { ok: true, server: `nexus ${deps.version}` }),
  );
}
```

### lesson-code

`lesson-code/m3/raw-errors.sh`

```bash
#!/usr/bin/env bash
# Gõ JSON-RPC thô vào stdin server Nexus: 1 tool result thành công, 1 tool error, 4 kiểu lỗi giao thức.
cd /home/claude/nexus/apps/mcp-server
{
  echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"raw","version":"0"}}}'
  echo '{"jsonrpc":"2.0","method":"notifications/initialized"}'
  echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"nexus_get_customer","arguments":{"id":"cus_007"}}}'
  echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"nexus_get_customer","arguments":{"id":"cus_999"}}}'
  echo '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"nexus_nope","arguments":{}}}'
  echo '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"arguments":{}}}'
  echo '{"jsonrpc":"2.0","id":6,"method":"tools/execute","params":{}}'
  echo '{"jsonrpc":"2.0","id":7,"method":"tools/call",'
  sleep 0.5
} | NEXUS_DATA=memory LOG_LEVEL=error node src/index.ts
```
`lesson-code/m3/call-any.ts`

```ts
/** Gọi tool trên server bất kỳ (entry .ts).  node m3/call-any.ts <entry> <tool> '<json>' */
import { connectNexus } from "./connect.ts";

const [entry = "", name = "", raw = "{}"] = process.argv.slice(2);
const env: Record<string, string> = {};
const url = process.env["RATES_API_URL"];
if (url) env["RATES_API_URL"] = url;
const client = await connectNexus(env, entry);
const t0 = performance.now();
await client.listTools();
try {
  const res = await client.callTool({ name, arguments: JSON.parse(raw) as Record<string, unknown> });
  const text = Array.isArray(res.content) ? res.content.map((c) => (c.type === "text" ? c.text : `[${c.type}]`)).join(" ") : "";
  console.log(`${res.isError ? "[isError]" : "ok"} ${name} · ${Math.round(performance.now() - t0)} ms → ${text}`);
} catch (err) {
  console.log(`client ném lỗi: ${err instanceof Error ? err.message : String(err)}`);
}
await client.close();
```
`lesson-code/m3/traps/output-mismatch.ts`

```ts
/**
 * Bẫy S3.3: khai outputSchema nhưng trả structuredContent lệch schema (gõ nhầm 'totl'), hoặc quên structuredContent.
 * SDK v1 KHÔNG kiểm kiểu handler lúc biên dịch — chỉ lộ lúc chạy.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "output-mismatch", version: "0.0.0" });
const outputSchema = { total: z.number().int(), returned: z.number().int() };

server.registerTool("nexus_count_typo", { description: "Đếm khách (gõ nhầm field)", outputSchema }, async () => ({
  structuredContent: { totl: 12, returned: 5 },
  content: [{ type: "text", text: '{"totl":12,"returned":5}' }],
}));

server.registerTool("nexus_count_text_only", { description: "Đếm khách (quên structuredContent)", outputSchema }, async () => ({
  content: [{ type: "text", text: '{"total":12,"returned":5}' }],
}));
await server.connect(new StdioServerTransport());
```
`lesson-code/m3/traps/throw-leak.ts`

```ts
/** Bẫy S3.3: để exception của driver bay ra khỏi handler. SDK bắt và gửi NGUYÊN message cho LLM. */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MongoClient } from "mongodb";

const mongo = new MongoClient("mongodb://nexus_app:s3cret@127.0.0.1:27999/nexus?authSource=admin", { serverSelectionTimeoutMS: 500 });
const server = new McpServer({ name: "throw-leak", version: "0.0.0" });
server.registerTool("nexus_count_customers", { description: "Đếm khách" }, async () => {
  const total = await mongo.db().collection("customers").countDocuments(); // không try/catch
  return { content: [{ type: "text", text: String(total) }] };
});
await server.connect(new StdioServerTransport());
```

---

## S3.4 — Gọi API ngoài & trả ảnh

Mục tiêu: bọc dịch vụ bên ngoài sao cho tool **không treo**, **không lộ exception thô**, và mọi kiểu hỏng của mạng đều thành một câu model hiểu. Trả ảnh đúng dạng `image` content (base64 thuần + MIME type) và biết cái giá của base64.

### C# → TS/Node

| Khái niệm C# | Tương đương TS/Node | Khác ở đâu |
|---|---|---|
| `HttpClient.Timeout = 5s` | `fetch(url, { signal: AbortSignal.timeout(5000) })` | `fetch` **không có** timeout mặc định — không truyền signal là đợi mãi |
| `CancellationToken` của request | `extra.signal` trong handler | Gộp với timeout: `AbortSignal.any([extra.signal, timeout])` |
| `TaskCanceledException` | `DOMException` name `TimeoutError` / `AbortError` | Kiểm `timeout.aborted` thay vì đoán theo message |
| `HttpRequestException` | `TypeError: fetch failed` (+ `err.cause`) | Message ngoài cùng không nói gì; chi tiết nằm ở `cause` |
| `GetFromJsonAsync<T>()` | `(await res.json()) as T` | `as T` không kiểm gì — parse bằng Zod |
| `EnsureSuccessStatusCode()` | `if (!res.ok)` tự viết | `fetch` **không** ném khi 4xx/5xx |
| `DelegatingHandler` giả trong test | Tiêm `fetch` qua tham số | C50 Lab 06 stub `fetch`; Nexus nhận `fetch?` trong options |
| `File(bytes, "image/png")` | `{ type: "image", data: base64, mimeType }` | Chỉ base64 thuần, không `data:` URL |

### Lab

#### Lab C50 — 06 Calling an External API · 07 Returning an Image

**Mục tiêu:** Lab 06 gọi API ngoài có timeout và dịch thất bại thành câu model đọc được; Lab 07 trả ảnh bằng `image` content với MIME type đúng.

- [ ] Lab 06 xanh.
- [ ] Lab 07 xanh.

**Lệnh nghiệm thu** (repo C50 — chưa chạy ở sandbox dựng bài):

```console
$ npm run check
```

Cần nắm để tự làm:

- Lab 06: harness của C50 **stub `fetch`** (không cần mạng) — viết code gọi `fetch` toàn cục hoặc nhận `fetch` tiêm vào, đừng dùng thư viện HTTP khác. Liệt kê các kiểu hỏng: không phản hồi (timeout), mạng lỗi, status không 2xx, body không phải JSON/không đúng hình dạng. Mỗi kiểu → 1 câu. Không bao giờ để `err.message` hay stack đi ra.
- Lab 07: `data` là **base64 thuần** (không có tiền tố `data:image/png;base64,`); `mimeType` khớp đúng định dạng byte; ảnh là 1 phần tử của mảng `content`.
- Cả hai: thời gian là một phần của AC — tool “đúng” nhưng trả sau 30 s vẫn là tool hỏng.

#### Lab Nexus S3.4 — `nexus_get_exchange_rate` (timeout 5 s) + `nexus_chart_customers_by_city` (PNG)

**Mục tiêu:** tool tỷ giá gọi API ngoài (hợp đồng open.er-api.com v6), timeout 5 s, mọi thất bại thành `isError` dễ hiểu; tool biểu đồ trả PNG + số liệu.

- [ ] API treo → `[isError]` sau ≈ 5000 ms với câu “không phản hồi trong 5 giây”, không treo lâu hơn.
- [ ] API trả 503 / trả HTML → `[isError]` câu dễ hiểu, **không** có `Unexpected token`, `fetch failed`, stack trace.
- [ ] Mã tiền tệ lạ (`XYZ`) → câu gợi ý mã ISO 4217.
- [ ] Biểu đồ: `content` có 1 khối `text` + 1 khối `image/png`; base64 bắt đầu bằng `iVBOR` (chữ ký PNG), không có `data:`.
- [ ] `RatesClient` nhận `fetch` qua options (test thay được).

**Lệnh nghiệm thu** (rates-stub là HTTP server thật trong repo, số liệu cố định):

```console
$ node scripts/rates-stub.ts 4010 &
$ RATES_API_URL=http://127.0.0.1:4010/ok/v6   node scripts/call.ts nexus_get_exchange_rate '{"base":"usd"}'
$ RATES_API_URL=http://127.0.0.1:4010/slow/v6 node scripts/call.ts nexus_get_exchange_rate '{"base":"USD"}'
$ RATES_API_URL=http://127.0.0.1:4010/down/v6 node scripts/call.ts nexus_get_exchange_rate '{"base":"USD"}'
$ RATES_API_URL=http://127.0.0.1:4010/html/v6 node scripts/call.ts nexus_get_exchange_rate '{"base":"USD"}'
$ node scripts/call.ts nexus_chart_customers_by_city '{}'
```

**Gợi ý hướng làm:** tách 3 lớp: `rates/client.ts` (HTTP + parse, trả union, không ném), `describeRatesError` (union → câu), tool (ghép). Timeout đọc từ env `RATES_TIMEOUT_MS` (mặc định 5000). Ảnh: tự mã hóa PNG bằng `node:zlib` (không cần thư viện) hoặc dùng thư viện bạn quen — miễn ra byte PNG thật.

Output thật — tool Nexus với 6 tình huống nguồn tỷ giá (script `lesson-code/m3/rates-matrix.sh`, chạy qua MCP client thật):

```console
$ bash m3/rates-matrix.sh
── RATES_API_URL=http://127.0.0.1:4010/ok/v6
ok nexus_get_exchange_rate · 53 ms
  content[text]  {"base":"USD","quote":"VND","rate":26000,"asOf":"2026-09-27T00:02:31.000Z","source":"127.0.0.1:4010"}
  structuredContent {"base":"USD","quote":"VND","rate":26000,"asOf":"2026-09-27T00:02:31.000Z","source":"127.0.0.1:4010"}
── RATES_API_URL=http://127.0.0.1:4010/slow/v6
[isError] nexus_get_exchange_rate · 5016 ms
  content[text]  Dịch vụ tỷ giá không phản hồi trong 5 giây. Thử lại sau ít phút. Không tự đoán tỷ giá; nói rõ với người dùng là chưa lấy được.
── RATES_API_URL=http://127.0.0.1:4010/down/v6
[isError] nexus_get_exchange_rate · 44 ms
  content[text]  Dịch vụ tỷ giá đang lỗi hoặc không truy cập được. Thử lại sau ít phút. Không tự đoán tỷ giá.
── RATES_API_URL=http://127.0.0.1:4010/html/v6
[isError] nexus_get_exchange_rate · 38 ms
  content[text]  Dịch vụ tỷ giá trả dữ liệu không đọc được. Thử lại sau; nếu vẫn lỗi, báo người dùng là nguồn tỷ giá đang có vấn đề.
── RATES_API_URL=http://127.0.0.1:4999/v6   (không có gì nghe ở cổng này)
[isError] nexus_get_exchange_rate · 38 ms
  content[text]  Dịch vụ tỷ giá đang lỗi hoặc không truy cập được. Thử lại sau ít phút. Không tự đoán tỷ giá.
── RATES_API_URL mặc định (open.er-api.com — sandbox chặn ra internet)
[isError] nexus_get_exchange_rate · 60 ms
  content[text]  Dịch vụ tỷ giá đang lỗi hoặc không truy cập được. Thử lại sau ít phút. Không tự đoán tỷ giá.
```

> **Nói thẳng:** tỷ giá trong output (`26000`) là số cố định của `rates-stub`, **không phải** tỷ giá thật. Dòng cuối là lần gọi thật tới `open.er-api.com` — sandbox chặn đường ra internet nên kết quả là lỗi mạng (đúng nhánh `network`). Ở máy bạn, lệnh đó trả tỷ giá thật.

<details>
<summary>Xem sau khi làm xong — lời giải Lab Nexus S3.4</summary>

`apps/mcp-server/src/rates/client.ts`

```ts
/**
 * Client tỷ giá theo hợp đồng open.er-api.com v6: GET {base}/latest/{CODE}.
 * Không ném exception ra ngoài: mọi thất bại thành 1 nhánh của RatesResult (union) để tool dịch sang câu cho LLM.
 */
import { z } from "zod";
import type { ExchangeRate } from "@nexus/shared";

const ApiResponse = z.union([
  z.object({
    result: z.literal("success"),
    base_code: z.string(),
    time_last_update_utc: z.string(),
    rates: z.record(z.string(), z.number()),
  }),
  z.object({ result: z.literal("error"), "error-type": z.string() }),
]);

export type RatesError =
  | { kind: "timeout"; ms: number }
  | { kind: "cancelled" }
  | { kind: "network"; detail: string }
  | { kind: "upstream"; status: number }
  | { kind: "bad_response"; detail: string }
  | { kind: "unknown_currency"; code: string };

export type RatesResult = { ok: true; value: ExchangeRate } | { ok: false; error: RatesError };

export interface RatesClientOptions {
  baseUrl: string;
  timeoutMs: number;
  /** Tiêm fetch để test thay bằng bản giả (C50 Lab 06 cũng stub fetch). */
  fetch?: typeof fetch;
}

export interface RatesClient {
  latest(base: string, quote: string, signal?: AbortSignal): Promise<RatesResult>;
}

export function createRatesClient(opts: RatesClientOptions): RatesClient {
  const doFetch = opts.fetch ?? fetch;
  const source = new URL(opts.baseUrl).host;
  return {
    async latest(base, quote, signal) {
      const timeout = AbortSignal.timeout(opts.timeoutMs);
      const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
      let res: Response;
      try {
        res = await doFetch(`${opts.baseUrl}/latest/${encodeURIComponent(base)}`, {
          signal: combined,
          headers: { accept: "application/json" },
        });
      } catch (err) {
        if (timeout.aborted) return { ok: false, error: { kind: "timeout", ms: opts.timeoutMs } };
        if (signal?.aborted) return { ok: false, error: { kind: "cancelled" } };
        const cause = err instanceof Error && err.cause instanceof Error ? err.cause.message : String(err);
        return { ok: false, error: { kind: "network", detail: cause } };
      }
      if (res.status === 404) return { ok: false, error: { kind: "unknown_currency", code: base } };
      if (!res.ok) return { ok: false, error: { kind: "upstream", status: res.status } };

      let json: unknown;
      try {
        json = await res.json();
      } catch (err) {
        if (timeout.aborted) return { ok: false, error: { kind: "timeout", ms: opts.timeoutMs } };
        return { ok: false, error: { kind: "bad_response", detail: err instanceof Error ? err.message : String(err) } };
      }
      const parsed = ApiResponse.safeParse(json);
      if (!parsed.success) return { ok: false, error: { kind: "bad_response", detail: parsed.error.issues[0]?.message ?? "schema" } };
      const body = parsed.data;
      if (body.result === "error") {
        return body["error-type"] === "unsupported-code"
          ? { ok: false, error: { kind: "unknown_currency", code: base } }
          : { ok: false, error: { kind: "bad_response", detail: body["error-type"] } };
      }
      const rate = body.rates[quote];
      if (rate === undefined) return { ok: false, error: { kind: "unknown_currency", code: quote } };
      return {
        ok: true,
        value: { base, quote, rate, asOf: new Date(body.time_last_update_utc).toISOString(), source },
      };
    },
  };
}
```
`apps/mcp-server/src/tools/get-exchange-rate.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExchangeRateInputSchema, ExchangeRateOutputSchema, TOOL } from "@nexus/shared";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import type { RatesClient, RatesError } from "../rates/client.ts";
import { toolFail, toolOk, type ToolFailure } from "../tool-result.ts";

export interface ExchangeRateDeps {
  rates: RatesClient;
  log: Logger;
}

/** Anti-corruption: lỗi thô của mạng/API ngoài → câu LLM đọc được. Không stack trace, không URL nội bộ. */
export function describeRatesError(e: RatesError): ToolFailure {
  switch (e.kind) {
    case "timeout":
      return { what: `Dịch vụ tỷ giá không phản hồi trong ${e.ms / 1000} giây.`, next: "Thử lại sau ít phút. Không tự đoán tỷ giá; nói rõ với người dùng là chưa lấy được." };
    case "cancelled":
      return { what: "Yêu cầu tỷ giá đã bị hủy.", next: "Không cần làm gì thêm." };
    case "network":
    case "upstream":
      return { what: "Dịch vụ tỷ giá đang lỗi hoặc không truy cập được.", next: "Thử lại sau ít phút. Không tự đoán tỷ giá." };
    case "bad_response":
      return { what: "Dịch vụ tỷ giá trả dữ liệu không đọc được.", next: "Thử lại sau; nếu vẫn lỗi, báo người dùng là nguồn tỷ giá đang có vấn đề." };
    case "unknown_currency":
      return { what: `Nguồn tỷ giá không có mã tiền tệ '${e.code}'.`, next: "Kiểm tra lại mã ISO 4217 (ví dụ USD, EUR, JPY, VND) rồi gọi lại." };
  }
}

export function registerGetExchangeRate(server: McpServer, deps: ExchangeRateDeps): void {
  server.registerTool(
    TOOL.getExchangeRate,
    {
      title: "Tỷ giá ngoại tệ",
      description:
        "Lấy tỷ giá mới nhất giữa 2 loại tiền (mặc định quy đổi sang VND) từ dịch vụ bên ngoài. " +
        "Gọi khi cần quy đổi số tiền hoặc so sánh giá theo ngoại tệ. Tỷ giá cập nhật ~1 lần/ngày.",
      inputSchema: ExchangeRateInputSchema.shape,
      outputSchema: ExchangeRateOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    instrument(TOOL.getExchangeRate, deps.log, async ({ base, quote }, extra) => {
      const r = await deps.rates.latest(base, quote, extra.signal);
      if (!r.ok) {
        deps.log.warn("exchange rate failed", { base, quote, error: r.error });
        return toolFail(describeRatesError(r.error));
      }
      return toolOk(ExchangeRateOutputSchema, r.value);
    }),
  );
}
```
`packages/shared/src/exchange-rate.ts`

```ts
import { z } from "zod";

/** Mã tiền tệ ISO 4217: đúng 3 chữ cái in hoa. Chữ thường được nâng lên trước khi kiểm. */
export const CurrencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Mã tiền tệ phải là 3 chữ cái ISO 4217, ví dụ USD, VND, EUR")
  .describe("Mã tiền tệ ISO 4217 (3 chữ cái), ví dụ 'USD', 'VND', 'EUR'.");

export const ExchangeRateInputSchema = z.object({
  base: CurrencySchema.describe("Tiền gốc, ví dụ 'USD'."),
  quote: CurrencySchema.default("VND").describe("Tiền quy đổi sang, mặc định 'VND'."),
});

export const ExchangeRateOutputSchema = z.object({
  base: z.string(),
  quote: z.string(),
  rate: z.number().positive().describe("1 base = rate quote"),
  asOf: z.string().describe("Thời điểm nguồn cập nhật tỷ giá (UTC)"),
  source: z.string(),
});
export type ExchangeRate = z.infer<typeof ExchangeRateOutputSchema>;
```
`apps/mcp-server/src/tools/chart-customers-by-city.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CITIES, TOOL } from "@nexus/shared";
import { z } from "zod";
import type { CustomerRepository } from "../customers/repository.ts";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { barChartPng, type Rgb } from "../png.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface ChartDeps {
  customers: CustomerRepository;
  log: Logger;
}

/** Trần kích thước ảnh sau base64 — ảnh lớn ăn context của model và có client từ chối. */
export const MAX_IMAGE_BASE64 = 1_000_000;

const PALETTE: readonly Rgb[] = [[184, 88, 58], [95, 109, 51], [156, 124, 20], [107, 74, 51], [163, 58, 42]];

const ChartOutput = z.object({
  counts: z.array(z.object({ city: z.string(), count: z.number().int() })).describe("Số khách mỗi thành phố, cùng thứ tự các cột trong ảnh"),
  total: z.number().int(),
  image: z.object({ mimeType: z.literal("image/png"), bytes: z.number().int(), width: z.number().int(), height: z.number().int() }),
});

export function registerChartCustomersByCity(server: McpServer, deps: ChartDeps): void {
  server.registerTool(
    TOOL.chartCustomersByCity,
    {
      title: "Biểu đồ khách theo thành phố",
      description:
        "Vẽ biểu đồ cột (ảnh PNG) số khách hàng theo từng thành phố, kèm số liệu dạng JSON. " +
        "Chỉ gọi khi người dùng muốn XEM biểu đồ; để trả lời bằng số, dùng nexus_list_customers.",
      inputSchema: {},
      outputSchema: ChartOutput.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.chartCustomersByCity, deps.log, async () => {
      const counts = await Promise.all(CITIES.map(async (city) => ({ city, count: (await deps.customers.list({ city, limit: 1 })).total })));
      const width = 480, height = 240;
      const png = barChartPng(counts.map((c) => c.count), { width, height, colors: PALETTE });
      const data = png.toString("base64");
      if (data.length > MAX_IMAGE_BASE64) {
        return toolFail({ what: `Ảnh biểu đồ quá lớn (${data.length} ký tự base64).`, next: "Trả lời bằng số liệu từ nexus_list_customers thay vì ảnh." });
      }
      return toolOk(
        ChartOutput,
        { counts, total: counts.reduce((s, c) => s + c.count, 0), image: { mimeType: "image/png", bytes: png.length, width, height } },
        [{ type: "image", data, mimeType: "image/png" }],
      );
    }),
  );
}
```
`apps/mcp-server/src/png.ts`

```ts
/**
 * Bộ mã hóa PNG tối thiểu (RGBA 8-bit, không nén thông minh) + vẽ biểu đồ cột.
 * Không phụ thuộc thư viện ngoài: node:zlib cho deflate, CRC32 tự tính.
 */
import { deflateSync } from "node:zlib";

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

export function encodePng(width: number, height: number, rgba: Uint8Array): Buffer {
  if (rgba.length !== width * height * 4) throw new RangeError("rgba size mismatch");
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: None
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 6, 0, 0, 0], 8); // 8-bit, RGBA, deflate, adaptive, no interlace
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", new Uint8Array())]);
}

export type Rgb = readonly [number, number, number];

/** Biểu đồ cột ngang hàng: mỗi giá trị 1 cột, cao theo tỉ lệ với giá trị lớn nhất. */
export function barChartPng(values: readonly number[], opts: { width: number; height: number; colors: readonly Rgb[] }): Buffer {
  const { width: w, height: h } = opts;
  const px = new Uint8Array(w * h * 4).fill(255);
  const set = (x: number, y: number, [r, g, b]: Rgb) => {
    const i = (y * w + x) * 4;
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
  };
  const pad = 16;
  const baseY = h - pad;
  for (let x = pad; x < w - pad; x++) set(x, baseY, [107, 74, 51]); // trục ngang
  const max = Math.max(1, ...values);
  const slot = (w - 2 * pad) / Math.max(1, values.length);
  values.forEach((v, i) => {
    const barH = Math.round(((h - 2 * pad) * v) / max);
    const x0 = Math.round(pad + i * slot + slot * 0.15);
    const x1 = Math.round(pad + (i + 1) * slot - slot * 0.15);
    const color = opts.colors[i % opts.colors.length] ?? [184, 88, 58];
    for (let x = x0; x < x1; x++) for (let y = baseY - barH; y < baseY; y++) set(x, y, color);
  });
  return encodePng(w, h, px);
}
```
`apps/mcp-server/src/env.ts`

```ts
import { z } from "zod";

const Base = z.object({
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  /** API tỷ giá (hợp đồng open.er-api.com v6). Dev/test: trỏ vào scripts/rates-stub.ts. */
  RATES_API_URL: z.url().default("https://open.er-api.com/v6"),
  RATES_TIMEOUT_MS: z.coerce.number().int().min(100).max(30_000).default(5_000),
});

/** Discriminated union: NEXUS_DATA=mongo thì bắt buộc có MONGODB_URI. */
const EnvSchema = z.discriminatedUnion("NEXUS_DATA", [
  Base.extend({
    NEXUS_DATA: z.literal("mongo"),
    MONGODB_URI: z.string().startsWith("mongodb"),
    MONGODB_DB: z.string().min(1).default("nexus"),
  }),
  Base.extend({ NEXUS_DATA: z.literal("memory") }),
]);
export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse({ ...source, NEXUS_DATA: source["NEXUS_DATA"] ?? "mongo" });
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join(".") || "(env)"}: ${i.message}`);
    process.stderr.write(`[nexus-mcp] Cấu hình sai:\n${lines.join("\n")}\n`);
    process.exit(1);
  }
  return parsed.data;
}
```

</details>

<details>
<summary>Tra khi test đỏ</summary>

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| Tool treo 30 s / tới khi client timeout 60 s | `fetch` không có `signal` | `AbortSignal.timeout(ms)` |
| Người dùng bấm dừng mà request ra ngoài vẫn chạy | Không gộp `extra.signal` | `AbortSignal.any([extra.signal, timeout])` |
| Model đọc `Unexpected token '<', "<html>…" is not valid JSON` | `res.json()` trên body HTML (proxy, captive portal) | `try/catch` quanh `res.json()` → `bad_response` |
| Model đọc `fetch failed` | `TypeError` của `fetch` không nói gì; lý do thật ở `err.cause` | Map thành `network`, log `cause` ra stderr |
| 503 mà tool trả `rate: undefined` | `fetch` không ném khi status lỗi | `if (!res.ok)` trước khi đọc body |
| Timeout báo nhầm là “mạng lỗi” | Kiểm `err.name` không ổn định giữa các runtime | Kiểm `timeout.aborted` (signal của chính mình) |
| Client: `Invalid Base64 string` | `data` là data URL (`data:image/png;base64,…`) | Chỉ `buffer.toString("base64")` |
| Ảnh không hiện, không lỗi | `mimeType` sai (`image/jpeg` cho byte PNG) — schema chỉ kiểm là chuỗi | Đặt MIME theo định dạng thật |

</details>

### Lỗi ngoài mạng đi đâu trước khi tới model

**Sơ đồ (Luồng dữ liệu) — Gọi API tỷ giá: lỗi ngoài mạng biến thành gì trước khi tới LLM?**

```mermaid
flowchart LR
    llm["LLM"] -- "args" --> handler["Handler get_exchange_rate"]
    handler -- "latest()" --> rates["Rates client (timeout 5 s)"]
    rates -- "GET + signal" --> api["API tỷ giá"]
    rates -- "RatesError" --> translate["Dịch lỗi: describeRatesError"]
    translate -- "isError: what + next" --> llm
    api -. "treo / 503 / HTML" .-> naive["✗ Exception thô (không timeout)"]
    naive -. "message thô" .-> llm
    classDef hl fill:#f5d9c8,stroke:#b8583a,stroke-width:3px
    class rates hl
```

**Đọc sơ đồ:** Hàng trên từ trái sang phải là đường đi thành công. Mọi thất bại của rates client rẽ xuống ô 'Dịch lỗi' rồi quay về LLM thành 1 câu. Ô đỏ bên phải là bản dịch thẳng: exception thô đi thẳng tới LLM. *Màu: đỏ gạch + ✗ + viền đứt = bị chặn/sai · vàng mù tạt + ? + viền chấm = cần xem lại · xanh ô-liu + ✓ = chạy đúng. Nét đứt = đường của bản dịch thẳng (không nên có).*


Ba lớp, mỗi lớp một việc:

1. **Rates client** biết HTTP: timeout, status, parse body bằng Zod. Trả `RatesResult` — union `ok | error` với 6 kiểu lỗi có tên. **Không ném.**
2. **`describeRatesError`** biết model: 6 kiểu lỗi → 6 câu “chuyện gì + làm gì tiếp”. `switch` trên `kind`, TS kiểm đã đủ nhánh.
3. **Tool** chỉ ghép: gọi client, `ok` → `toolOk`, lỗi → log chi tiết ra stderr + `toolFail(describeRatesError(...))`.

Hai `signal` khác nhau cùng đi vào `fetch`:

| Signal | Ai hủy | Kết quả |
|---|---|---|
| `AbortSignal.timeout(5000)` | Chính server, sau 5 s | `kind: "timeout"` → “không phản hồi trong 5 giây” |
| `extra.signal` | Client gửi `notifications/cancelled` (người dùng bấm dừng, host hết giờ) | `kind: "cancelled"` → không cần làm gì thêm |

### Trả ảnh: `image` content

Output thật — tool biểu đồ, và ảnh host nhận được (ghi ra file từ đúng chuỗi base64 trong `content`):

```console
$ node m3/call.ts nexus_chart_customers_by_city '{}'; node m3/save-chart.ts /tmp/chart.png
ok nexus_chart_customers_by_city · 26 ms
  content[text]  {"counts":[{"city":"Hà Nội","count":12},{"city":"Hải Phòng","count":5},{"city":"TP.HCM","count":5},{"city":"Đà Nẵng","count":4},{"city":"Cần Thơ","count":4}],"total":30,"image":{"mimeType":"image/png","bytes":2239,"width":480,"height":240}}
  content[image] image/png · base64 2988 ký tự · đầu: iVBORw0KGgoAAAANSUhEUgAA…
  structuredContent {"counts":[{"city":"Hà Nội","count":12},{"city":"Hải Phòng","count":5},{"city":"TP.HCM","count":5},{"city":"Đà Nẵng","count":4},{"city":"Cần Thơ","count":4}],"total":30,"image":{"mimeType":"image/png","bytes":2239,"width":480,"height":240}}
image/png · 2239 byte · base64 2988 ký tự (+33%) → /tmp/chart.png
```

![Biểu đồ cột số khách theo thành phố do nexus_chart_customers_by_city trả về: Hà Nội 12, Hải Phòng 5, TP.HCM 5, Đà Nẵng 4, Cần Thơ 4](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAeAAAADwCAYAAADYdbe6AAAIhklEQVR4nO3VsQ0dVBBEURdBFaTOXAIVkFEAogNKIaMJurNrsJDm6u0/R5p8g5Xul+8AwNyX+gAA+EQCDAABAQaAgAADQECAASAgwAAQEGAACAgwAAQEGAACAgwAAQEGgIAAA0BAgAEgIMAAEBBgAAgkAf7v928fOwD4LsACDEBDgAUYgIAACzAAAQEWYAACAizAAAQEWIABCAiwAAMQEGABBiAgwAIMQECABRiAgAALMAABARZgAAICLMAABARYgAEICLAAAxAQYAEGICDAAgxAQIAFGICAAAswAAEBFmAAAgIswAAEBFiAAQgIsAADEBBgAQYgIMACDEBAgAUYgIAACzAAAQEWYAACAizAAAQEWIABCAiwAAMQEGABBiAgwAIMQECABRiAgAALMAABARZgAAICLMAABARYgAEICLAAAxAQYAEGICDAAgxAQIAFGICAAAswAAEBFmAAAgIswAAEBFiAAQgIsAADEBBgAQYgIMACDEBAgAUYgIAACzAAAQEWYAACAizAAAQEWIABCAiwAAMQEGABBiAgwAIMQECABRiAgAALMAABARZgAAICLMAABARYgAEICLAAAxAQYAEGICDAAgxAQIAFGICAAAswAAEBFmAAAgIswAAEBFiAAQgIsAADEBBgAQYgIMACDEBAgAUYgIAACzAAAQEWYAACAizAAAQEWIABCAiwAAMQEGABBiAgwAIMQECABRiAgAALMAABARZgAAICLMAABARYgAEICLAAAxAQYAEGICDAAgxAQIAFGICAAAswAAEBFmAAAgIswAAEBFiAAQgIsAADEBBgAQYgIMACDEBAgAUYgIAACzAAAQEWYAACAizAAAQEWIABCAiwAAMQEGABBiAgwAIMQECABRiAgAALMAABARZgAAICLMAABARYgAEICLAAAxAQYAEGICDAAgxAQIAFGICAAAswAAEBFmAAAgIswAAEBFiAAQgIsAADEBBgAQYgIMCHA/zHX18/dkv//P3LRw74fwRYgE9uqQ6hAMObBFiAT26pDqEAw5sEWIBPbqkOoQDDmwRYgE9uqQ6hAMObBFiAT26pDqEAw5sEWIBPbqkOoQDDmwRYgE9uqQ6hAMObBFiAT26pDqEAw5sEWIBPbqkOoQDDmwRYgE9uqQ6hAMObBFiAT26pDqEAw5sEWIBPbqkOoQDDmwRYgE9uqQ6hAMObBFiAT26pDqEAw5sEWIBPbqkOoQDDmwRYgE9uqQ6hAMObBFiAT26pDqEAw5sEWIBPbqkO4ScE+M/fvn7slv799uvHriDAAnxyS3UIBfj2luoICvBAHUEBvr+lOoQCfHtLdQQFeKCOoADf31IdQgG+vaU6ggI8UEdQgO9vqQ6hAN/eUh1BAR6oIyjA97dUh1CAb2+pjqAAD9QRFOD7W6pDKMC3t1RHUIAH6ggK8P0t1SEU4NtbqiMowAN1BAX4/pbqEArw7S3VERTggTqCAnx/S3UIBfj2luoICvBAHUEBvr+lOoQCfHtLdQQFeKCOoADf31IdQgG+vaU6ggI8UEdQgO9vqQ6hAN/eUh1BAR6oIyjA97dUh1CAb2+pjqAAD9QRFOD7W6pDKMC3t1RHUIAH6ggK8P0t1SEU4NtbqiMowAN1BAX4/pbqEArw7S3VERTggTqCAnx/S3UIBfj2luoICvBAHUEBvr+lOoQCfHtLdQQFeKCOoADf31IdQgG+vaU6ggI8UEdQgO9vqQ6hAN/eUh1BAR6oIyjA97dUh1CAb2+pjqAAD9QRFOD7W6pDKMC3t1RHUIAH6ggK8P0t1SEU4NtbqiMowAN1BAX4/pbqEArw7S3VERTggTqCAnx/S3UIBfj2luoICvBAHUEBvr+lOoQCfHtLdQQFeKCOoADf31IdQgG+vaU6ggI8UEdQgO9vqQ6hAN/eUh1BAR6oIyjA97dUh1CAb2+pjqAAD9QRFOD7W6pDKMC3t1RHUIAH6ggK8P0t1SEU4NtbqiMowAN1BAX4/pbqEArw7S3VERTggTqCAnx/S3UIBfj2luoICvBAHUEBvr+lOoQCfHtLdQQFeKCOoADf31IdQgG+vaU6ggI8UEdQgO9vqQ6hAN/eUh1BAR6oIyjA97dUh1CAb2+pjqAAD9QRFOD7W6pDKMC3t1RHUIAH6ggK8P0t1SEU4NtbqiMowAN1BAX4/pbqEArw7S3VERTggTqCAnx/S3UIBfj2luoICvBAHUEBvr+lOoQCfHtLdQQFeKCOoADf31IdQgG+vaU6ggI8UEdQgO9vqQ6hAN/eUh1BAR6oIyjA97dUh1CAb2+pjqAAD9QRFOD7W6pDKMC3t1RHUIAH6ggK8P0t1SEU4NtbqiMowAN1BAX4/pbqEArw7S3VERTggTqCAnx/S3UIBfj2luoICvBAHUEBvr+lOoQCfHtLdQQFeKCOoADf31IdQgG+vaU6ggI8UEdQgO9vqQ6hAN/eUh1BAR6oIyjA97dUh1CAb2+pjqAAD9QRFOD7W6pDKMC3t1RHUIAH6ggK8P0t1SEU4NtbqiMowAN1BAX4/pbqEArw7S3VERTggTqCAnx/S3UIBfj2luoICvBAHUEBvr+lOoQCfHtLdQQFeKCOoADf31IdQgG+vaU6ggI8UEdQgO9vqQ6hAN/eUh1BAR6oIyjA97dUh1CAb2+pjqAAD9QRFOD7W6pDKMC3t1RHUIAH6ggK8P0t1SEU4NtbqiMowAN1BAX4/pbqEArw7S3VERTggTqCAnx/S3UIBfj2luoICvBAHUEBvr+lOoQCfHtLdQQFeKCOoADf31IdQgG+vaU6ggI8UEdQgO9vqQ6hAN/eUh1BAf5J9XOamZkVywMMAPw8AQaAgAADQECAASAgwAAQEGAACAgwAAQEGAACAgwAAQEGgIAAA0BAgAEgIMAAEBBgAAgIMAAEfgDNpiAHdyI/SwAAAABJRU5ErkJggg==)

Điểm cần nhớ:

- **Base64 đắt hơn byte 33%** (2239 byte → 2988 ký tự, đo ở trên) và đi thẳng vào context của model. Ảnh 3 MB là ~4 MB ký tự — nhiều client/model từ chối hoặc cắt. Nexus đặt trần `MAX_IMAGE_BASE64 = 1_000_000`, quá trần thì trả lỗi gợi ý dùng số liệu.
- **Luôn kèm số liệu dạng text/structured.** Model không đọc được ảnh (hoặc host không hiển thị ảnh) vẫn trả lời được bằng `counts`. Ảnh là cho người xem.
- **`mimeType` phải khớp byte.** SDK chỉ kiểm nó là chuỗi. PNG bắt đầu bằng `89 50 4E 47` → base64 `iVBOR`.
- Ảnh do chính server vẽ bằng `png.ts` (~70 dòng: `node:zlib` + CRC32) — không phụ thuộc thư viện ảnh native, chạy được trong image Docker slim của M2.

### Phần khác C# thật sự

**1. `fetch` là API tối giản của trình duyệt.** Không timeout mặc định, không ném khi 4xx/5xx, không deserialize có type, không retry. Mọi thứ `HttpClient` + `HttpClientFactory` + Polly làm sẵn, ở đây bạn tự ghép — vì vậy phải gom vào **một** client.

**2. Hủy bằng `AbortSignal`, ghép bằng `AbortSignal.any`.** Tương đương `CancellationTokenSource.CreateLinkedTokenSource(ct, timeoutCts.Token)` — một dòng.

**3. Lỗi là giá trị.** Client trả union thay vì ném, nên tool không cần `try/catch` và không thể quên một nhánh: `describeRatesError` có `switch` đủ 6 `kind`, thêm `kind` thứ 7 thì tsc báo hàm không trả về ở mọi nhánh.

### Bẫy dev .NET hay vấp

#### Bẫy 1 — `fetch` như `GetFromJsonAsync`

`lesson-code/m3/traps/naive-rates.ts`

```ts
/**
 * Bẫy S3.4: "dịch thẳng" HttpClient.GetFromJsonAsync — không timeout, không try/catch, không kiểm status.
 * Exception thô (và thời gian treo) đi thẳng tới LLM.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const baseUrl = process.env["RATES_API_URL"] ?? "https://open.er-api.com/v6";
const server = new McpServer({ name: "naive-rates", version: "0.0.0" });
server.registerTool(
  "nexus_get_exchange_rate",
  { description: "Tỷ giá", inputSchema: { base: z.string(), quote: z.string().default("VND") } },
  async ({ base, quote }) => {
    const res = await fetch(`${baseUrl}/latest/${base}`);
    const body = (await res.json()) as { rates: Record<string, number> };
    return { content: [{ type: "text", text: String(body.rates[quote]) }] };
  },
);
await server.connect(new StdioServerTransport());
```

Cùng 4 tình huống, output thật:

```console
$ bash m3/naive-matrix.sh
── http://127.0.0.1:4010/down/v6
[isError] nexus_get_exchange_rate · 48 ms → Unexpected token 'S', "Service Unavailable" is not valid JSON
── http://127.0.0.1:4010/html/v6
[isError] nexus_get_exchange_rate · 48 ms → Unexpected token '<', "<html><bod"... is not valid JSON
── http://127.0.0.1:4999/v6
[isError] nexus_get_exchange_rate · 40 ms → fetch failed
── http://127.0.0.1:4010/slow/v6
[isError] nexus_get_exchange_rate · 30079 ms → Cannot read properties of undefined (reading 'VND')
```

4 lần hỏng, 4 message vô dụng với model: 2 lỗi parse JSON (503 và HTML), `fetch failed` (không biết vì sao), và treo **30 giây** (tới khi stub tự trả `{}`) rồi `Cannot read properties of undefined`. Nếu API treo mãi, tool treo tới khi client timeout (60 s mặc định, S3.5).

#### Bẫy 2 — timeout bằng `setTimeout` + `Promise.race`

Mẫu hay gặp khi dịch `Task.WhenAny(task, Task.Delay(5000))`: tool trả lỗi đúng giờ, **nhưng request HTTP vẫn chạy** — socket, bộ nhớ, và (với API tính tiền) chi phí vẫn tiếp tục. `AbortSignal` hủy thật kết nối. Không `Promise.race` cho I/O.

#### Bẫy 3 — ảnh dạng data URL

Quen trả ảnh cho `<img src>`:

`lesson-code/m3/traps/data-url-image.ts`

```ts
/** Bẫy S3.4: quen trả ảnh cho <img src>, gửi luôn data URL thay vì base64 thuần. */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { barChartPng } from "../../../nexus/apps/mcp-server/src/png.ts";

const png = barChartPng([12, 5, 5, 4, 4], { width: 480, height: 240, colors: [[184, 88, 58]] });
const server = new McpServer({ name: "data-url-image", version: "0.0.0" });
server.registerTool("nexus_chart_customers_by_city", { description: "Biểu đồ" }, async () => ({
  content: [{ type: "image", data: `data:image/png;base64,${png.toString("base64")}`, mimeType: "image/png" }],
}));
await server.connect(new StdioServerTransport());
```

```console
$ node m3/call-any.ts m3/traps/data-url-image.ts nexus_chart_customers_by_city
client ném lỗi: MCP error -32602: MCP error -32602: Invalid tools/call result: [
  {
    "code": "custom",
    "path": [
      "content",
      0,
      "data"
    ],
    "message": "Invalid Base64 string"
  }
]
```

Server không kiểm — client mới kiểm, và **cả lời gọi** hỏng (client ném, không có result). Host khác có thể hiển thị ảnh vỡ mà không báo gì.

#### Bẫy 4 — tin `as T`

`(await res.json()) as { rates: Record<string, number> }` là cast, không phải kiểm tra. API đổi hình dạng (hoặc báo lỗi trong body `{ "result": "error", "error-type": … }` — hợp đồng v6 có kiểu này) thì code chạy tiếp với `undefined`. Nexus parse body bằng `z.union([...success, ...error])`.

### Code mẫu & pattern

#### Code production

`apps/mcp-server/src/rates/client.ts`

```ts
/**
 * Client tỷ giá theo hợp đồng open.er-api.com v6: GET {base}/latest/{CODE}.
 * Không ném exception ra ngoài: mọi thất bại thành 1 nhánh của RatesResult (union) để tool dịch sang câu cho LLM.
 */
import { z } from "zod";
import type { ExchangeRate } from "@nexus/shared";

const ApiResponse = z.union([
  z.object({
    result: z.literal("success"),
    base_code: z.string(),
    time_last_update_utc: z.string(),
    rates: z.record(z.string(), z.number()),
  }),
  z.object({ result: z.literal("error"), "error-type": z.string() }),
]);

export type RatesError =
  | { kind: "timeout"; ms: number }
  | { kind: "cancelled" }
  | { kind: "network"; detail: string }
  | { kind: "upstream"; status: number }
  | { kind: "bad_response"; detail: string }
  | { kind: "unknown_currency"; code: string };

export type RatesResult = { ok: true; value: ExchangeRate } | { ok: false; error: RatesError };

export interface RatesClientOptions {
  baseUrl: string;
  timeoutMs: number;
  /** Tiêm fetch để test thay bằng bản giả (C50 Lab 06 cũng stub fetch). */
  fetch?: typeof fetch;
}

export interface RatesClient {
  latest(base: string, quote: string, signal?: AbortSignal): Promise<RatesResult>;
}

export function createRatesClient(opts: RatesClientOptions): RatesClient {
  const doFetch = opts.fetch ?? fetch;
  const source = new URL(opts.baseUrl).host;
  return {
    async latest(base, quote, signal) {
      const timeout = AbortSignal.timeout(opts.timeoutMs);
      const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
      let res: Response;
      try {
        res = await doFetch(`${opts.baseUrl}/latest/${encodeURIComponent(base)}`, {
          signal: combined,
          headers: { accept: "application/json" },
        });
      } catch (err) {
        if (timeout.aborted) return { ok: false, error: { kind: "timeout", ms: opts.timeoutMs } };
        if (signal?.aborted) return { ok: false, error: { kind: "cancelled" } };
        const cause = err instanceof Error && err.cause instanceof Error ? err.cause.message : String(err);
        return { ok: false, error: { kind: "network", detail: cause } };
      }
      if (res.status === 404) return { ok: false, error: { kind: "unknown_currency", code: base } };
      if (!res.ok) return { ok: false, error: { kind: "upstream", status: res.status } };

      let json: unknown;
      try {
        json = await res.json();
      } catch (err) {
        if (timeout.aborted) return { ok: false, error: { kind: "timeout", ms: opts.timeoutMs } };
        return { ok: false, error: { kind: "bad_response", detail: err instanceof Error ? err.message : String(err) } };
      }
      const parsed = ApiResponse.safeParse(json);
      if (!parsed.success) return { ok: false, error: { kind: "bad_response", detail: parsed.error.issues[0]?.message ?? "schema" } };
      const body = parsed.data;
      if (body.result === "error") {
        return body["error-type"] === "unsupported-code"
          ? { ok: false, error: { kind: "unknown_currency", code: base } }
          : { ok: false, error: { kind: "bad_response", detail: body["error-type"] } };
      }
      const rate = body.rates[quote];
      if (rate === undefined) return { ok: false, error: { kind: "unknown_currency", code: quote } };
      return {
        ok: true,
        value: { base, quote, rate, asOf: new Date(body.time_last_update_utc).toISOString(), source },
      };
    },
  };
}
```
`apps/mcp-server/src/tools/get-exchange-rate.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExchangeRateInputSchema, ExchangeRateOutputSchema, TOOL } from "@nexus/shared";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import type { RatesClient, RatesError } from "../rates/client.ts";
import { toolFail, toolOk, type ToolFailure } from "../tool-result.ts";

export interface ExchangeRateDeps {
  rates: RatesClient;
  log: Logger;
}

/** Anti-corruption: lỗi thô của mạng/API ngoài → câu LLM đọc được. Không stack trace, không URL nội bộ. */
export function describeRatesError(e: RatesError): ToolFailure {
  switch (e.kind) {
    case "timeout":
      return { what: `Dịch vụ tỷ giá không phản hồi trong ${e.ms / 1000} giây.`, next: "Thử lại sau ít phút. Không tự đoán tỷ giá; nói rõ với người dùng là chưa lấy được." };
    case "cancelled":
      return { what: "Yêu cầu tỷ giá đã bị hủy.", next: "Không cần làm gì thêm." };
    case "network":
    case "upstream":
      return { what: "Dịch vụ tỷ giá đang lỗi hoặc không truy cập được.", next: "Thử lại sau ít phút. Không tự đoán tỷ giá." };
    case "bad_response":
      return { what: "Dịch vụ tỷ giá trả dữ liệu không đọc được.", next: "Thử lại sau; nếu vẫn lỗi, báo người dùng là nguồn tỷ giá đang có vấn đề." };
    case "unknown_currency":
      return { what: `Nguồn tỷ giá không có mã tiền tệ '${e.code}'.`, next: "Kiểm tra lại mã ISO 4217 (ví dụ USD, EUR, JPY, VND) rồi gọi lại." };
  }
}

export function registerGetExchangeRate(server: McpServer, deps: ExchangeRateDeps): void {
  server.registerTool(
    TOOL.getExchangeRate,
    {
      title: "Tỷ giá ngoại tệ",
      description:
        "Lấy tỷ giá mới nhất giữa 2 loại tiền (mặc định quy đổi sang VND) từ dịch vụ bên ngoài. " +
        "Gọi khi cần quy đổi số tiền hoặc so sánh giá theo ngoại tệ. Tỷ giá cập nhật ~1 lần/ngày.",
      inputSchema: ExchangeRateInputSchema.shape,
      outputSchema: ExchangeRateOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    instrument(TOOL.getExchangeRate, deps.log, async ({ base, quote }, extra) => {
      const r = await deps.rates.latest(base, quote, extra.signal);
      if (!r.ok) {
        deps.log.warn("exchange rate failed", { base, quote, error: r.error });
        return toolFail(describeRatesError(r.error));
      }
      return toolOk(ExchangeRateOutputSchema, r.value);
    }),
  );
}
```
`apps/mcp-server/src/index.ts`

```ts
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadEnv } from "./env.ts";
import { createLogger, mcpLogSink, stderrSink } from "./log.ts";
import { openDataSource, type DataSource } from "./db.ts";
import { createRatesClient } from "./rates/client.ts";
import { createServer } from "./server.ts";

const env = loadEnv();
const log = createLogger(stderrSink(env.LOG_LEVEL));

let data: DataSource;
try {
  data = await openDataSource(env, log);
} catch (err) {
  log.error("không mở được data source", { err: String(err) });
  process.exit(1);
}

const rates = createRatesClient({ baseUrl: env.RATES_API_URL, timeoutMs: env.RATES_TIMEOUT_MS });
const server = createServer({ customers: data.customers, rates, log, now: () => new Date() });
// Gắn sink MCP TRƯỚC connect: handler logging/setLevel phải có sẵn khi client gửi tới
log.attach(mcpLogSink(server));
await server.connect(new StdioServerTransport());
log.info("nexus mcp-server ready", { transport: "stdio" });

let closing = false;
async function shutdown(reason: string): Promise<void> {
  if (closing) return;
  closing = true;
  log.info("shutting down", { reason });
  await server.close().catch(() => {});
  await data.close().catch(() => {});
  process.exit(0);
}
process.stdin.on("end", () => void shutdown("stdin closed"));
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
```

#### Pattern: Adapter + anti-corruption layer

**Vấn đề:** API ngoài có hợp đồng riêng (tên field `base_code`, `time_last_update_utc`, lỗi báo trong body bằng `result: "error"`) và cách hỏng riêng. Để lọt những thứ đó vào tool thì mỗi tool gọi API phải tự biết tất cả.

**Tương đương C#:** typed client (`services.AddHttpClient<IRatesService, RatesService>()`) + `DelegatingHandler`/Polly cho timeout; exception riêng (`RatesException`) cho lỗi.

**Dịch thẳng vs kiểu TS:**

`lesson-code/m3/patterns/rates-service.direct.ts`

```ts
/**
 * Dịch thẳng từ C#:  interface IRatesService + class RatesService(HttpClient http) + RatesException, timeout đặt ở HttpClient.
 * Mọi lỗi thành exception; tool phải try/catch và đoán loại lỗi qua instanceof/message.
 */
export class RatesException extends Error {}
export class RatesTimeoutException extends RatesException {}

export interface IRatesService {
  getRate(base: string, quote: string): Promise<number>;
}

export class HttpClient {
  readonly baseAddress: string;
  readonly timeoutMs: number;
  constructor(baseAddress: string, timeoutMs: number) {
    this.baseAddress = baseAddress;
    this.timeoutMs = timeoutMs;
  }

  async getFromJson<T>(path: string): Promise<T> {
    const res = await fetch(this.baseAddress + path, { signal: AbortSignal.timeout(this.timeoutMs) });
    if (!res.ok) throw new RatesException(`HTTP ${res.status}`);
    return (await res.json()) as T; // "as T": không ai kiểm hình dạng body
  }
}

export class RatesService implements IRatesService {
  private readonly http: HttpClient;
  constructor(http: HttpClient) {
    this.http = http;
  }

  async getRate(base: string, quote: string): Promise<number> {
    try {
      const body = await this.http.getFromJson<{ rates: Record<string, number> }>(`/latest/${base}`);
      const rate = body.rates[quote];
      if (rate === undefined) throw new RatesException(`No rate for ${quote}`);
      return rate;
    } catch (err) {
      if (err instanceof DOMException && err.name === "TimeoutError") throw new RatesTimeoutException("timeout");
      throw err;
    }
  }
}
```
`apps/mcp-server/src/rates/client.ts`

```ts
/**
 * Client tỷ giá theo hợp đồng open.er-api.com v6: GET {base}/latest/{CODE}.
 * Không ném exception ra ngoài: mọi thất bại thành 1 nhánh của RatesResult (union) để tool dịch sang câu cho LLM.
 */
import { z } from "zod";
import type { ExchangeRate } from "@nexus/shared";

const ApiResponse = z.union([
  z.object({
    result: z.literal("success"),
    base_code: z.string(),
    time_last_update_utc: z.string(),
    rates: z.record(z.string(), z.number()),
  }),
  z.object({ result: z.literal("error"), "error-type": z.string() }),
]);

export type RatesError =
  | { kind: "timeout"; ms: number }
  | { kind: "cancelled" }
  | { kind: "network"; detail: string }
  | { kind: "upstream"; status: number }
  | { kind: "bad_response"; detail: string }
  | { kind: "unknown_currency"; code: string };

export type RatesResult = { ok: true; value: ExchangeRate } | { ok: false; error: RatesError };

export interface RatesClientOptions {
  baseUrl: string;
  timeoutMs: number;
  /** Tiêm fetch để test thay bằng bản giả (C50 Lab 06 cũng stub fetch). */
  fetch?: typeof fetch;
}

export interface RatesClient {
  latest(base: string, quote: string, signal?: AbortSignal): Promise<RatesResult>;
}

export function createRatesClient(opts: RatesClientOptions): RatesClient {
  const doFetch = opts.fetch ?? fetch;
  const source = new URL(opts.baseUrl).host;
  return {
    async latest(base, quote, signal) {
      const timeout = AbortSignal.timeout(opts.timeoutMs);
      const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
      let res: Response;
      try {
        res = await doFetch(`${opts.baseUrl}/latest/${encodeURIComponent(base)}`, {
          signal: combined,
          headers: { accept: "application/json" },
        });
      } catch (err) {
        if (timeout.aborted) return { ok: false, error: { kind: "timeout", ms: opts.timeoutMs } };
        if (signal?.aborted) return { ok: false, error: { kind: "cancelled" } };
        const cause = err instanceof Error && err.cause instanceof Error ? err.cause.message : String(err);
        return { ok: false, error: { kind: "network", detail: cause } };
      }
      if (res.status === 404) return { ok: false, error: { kind: "unknown_currency", code: base } };
      if (!res.ok) return { ok: false, error: { kind: "upstream", status: res.status } };

      let json: unknown;
      try {
        json = await res.json();
      } catch (err) {
        if (timeout.aborted) return { ok: false, error: { kind: "timeout", ms: opts.timeoutMs } };
        return { ok: false, error: { kind: "bad_response", detail: err instanceof Error ? err.message : String(err) } };
      }
      const parsed = ApiResponse.safeParse(json);
      if (!parsed.success) return { ok: false, error: { kind: "bad_response", detail: parsed.error.issues[0]?.message ?? "schema" } };
      const body = parsed.data;
      if (body.result === "error") {
        return body["error-type"] === "unsupported-code"
          ? { ok: false, error: { kind: "unknown_currency", code: base } }
          : { ok: false, error: { kind: "bad_response", detail: body["error-type"] } };
      }
      const rate = body.rates[quote];
      if (rate === undefined) return { ok: false, error: { kind: "unknown_currency", code: quote } };
      return {
        ok: true,
        value: { base, quote, rate, asOf: new Date(body.time_last_update_utc).toISOString(), source },
      };
    },
  };
}
```

- Bản dịch thẳng: interface + class `HttpClient` tự chế + class service + 2 exception. `as T` không kiểm body. Lỗi là exception → tool phải `try/catch` và `instanceof`, nhánh cuối `throw err` để lọt lỗi lạ. Muốn test phải mock cả class.
- Bản TS: 1 hàm `createRatesClient(opts)` trả object có 1 method. Phụ thuộc tiêm qua `opts.fetch` (test truyền hàm giả — đúng cách C50 Lab 06 chấm). Body parse bằng Zod; hợp đồng của API ngoài (`base_code`, `time_last_update_utc`) dừng lại **trong file này**, ra ngoài chỉ còn `ExchangeRate` của Nexus. Lỗi là union có tên → `describeRatesError` đủ nhánh.
- Interface `RatesClient` vẫn có — vì có 2 implementation thật sự dùng (thật và giả trong test), giống lý do `LlmProvider` ở M2.

**Khi nào KHÔNG dùng:** API gọi đúng 1 chỗ, 1 endpoint, không cần test giả → gọi `fetch` ngay trong tool (vẫn phải có timeout + kiểm status + parse). Đừng dựng “HttpClientFactory” chung cho mọi API ngoài ở M3 — retry/backoff/429 là M5 (S5.3), làm khi có API thứ hai.

### Trắc nghiệm S3.4

1. Theo output thật, bản `fetch` không timeout gặp API treo thì model nhận gì, sau bao lâu?
   - A. Câu “không phản hồi trong 5 giây” sau 5 s
   - B. `Cannot read properties of undefined (reading 'VND')` sau ~30 s (tới khi stub tự trả `{}`)
   - C. Không nhận gì, tool treo mãi

   <details><summary>Đáp án</summary>

   **B.** `fetch` không có timeout mặc định. Stub trả `{}` sau 30 s nên code đi tiếp với `rates` undefined. API thật treo mãi thì tool treo tới khi client bỏ cuộc.

   </details>

2. Vì sao rates client dùng `AbortSignal.any([extra.signal, timeout])` thay vì chỉ `timeout`?
   - A. Để người dùng/host hủy lời gọi (`extra.signal`) thì request HTTP ra ngoài cũng bị hủy thật, không chỉ timeout của mình
   - B. Vì `AbortSignal.timeout` không chạy trong Node
   - C. Để timeout dài gấp đôi

   <details><summary>Đáp án</summary>

   **A.** Hai nguồn hủy khác nhau: server tự hết giờ và client hủy. Ghép lại như `CreateLinkedTokenSource`.

   </details>

3. Ảnh PNG 2239 byte. Chuỗi `data` trong `image` content dài khoảng bao nhiêu và bắt đầu bằng gì?
   - A. 2239 ký tự, bắt đầu bằng `data:image/png;base64,`
   - B. ~2988 ký tự (+33%), bắt đầu bằng `iVBOR`
   - C. 4478 ký tự (hex), bắt đầu bằng `89504E47`

   <details><summary>Đáp án</summary>

   **B.** Base64 thuần, không tiền tố data URL. Mỗi 3 byte thành 4 ký tự — đo thật: 2239 → 2988.

   </details>


---

## S3.4 · Cheat Sheet

### Gọi API ngoài: checklist

| Việc | Code |
|---|---|
| Timeout | `const timeout = AbortSignal.timeout(ms)` |
| Gộp hủy của client | `AbortSignal.any([extra.signal, timeout])` |
| Phân biệt timeout / hủy | `timeout.aborted` · `extra.signal.aborted` |
| Status | `if (!res.ok) …` (fetch không ném) |
| Body | `try { await res.json() } catch` → `bad_response`; rồi `Schema.safeParse(json)` |
| Lỗi ra model | union `kind` → `describeRatesError` → `toolFail` |
| Chi tiết cho người vận hành | `deps.log.warn(..., { error })` → stderr |
| Test | `createRatesClient({ ..., fetch: fakeFetch })` |

### 6 kiểu lỗi của rates client

| `kind` | Khi nào | Đo thật (stub) |
|---|---|---|
| `timeout` | Hết `RATES_TIMEOUT_MS` | 5016 ms |
| `upstream` | Status không 2xx | 44 ms (503) |
| `bad_response` | Body không phải JSON / sai hình dạng | 38 ms (HTML) |
| `network` | Không kết nối được | 38 ms (cổng đóng) |
| `unknown_currency` | 404, `unsupported-code`, không có mã quote | — |
| `cancelled` | Client hủy | — |

### `image` content

```txt
{ type: "image", data: <base64 thuần>, mimeType: "image/png" }
PNG → base64 bắt đầu bằng "iVBOR" · JPEG → "/9j/" · base64 = byte × 4/3
```

### Pattern của session

| Pattern | Session | Tương đương C# / .NET | Dùng khi |
|---|---|---|---|
| Adapter + anti-corruption (client trả union lỗi, `fetch` tiêm vào) | S3.4 | Typed `HttpClient` + `DelegatingHandler` / Polly timeout | Bọc API ngoài: timeout, parse, dịch lỗi ở đúng 1 chỗ; test thay `fetch` giả |



---

## S3.4 · Code

### Cây thư mục

```txt
nexus/
├─ packages/shared/src/exchange-rate.ts          CurrencySchema, ExchangeRateInput/OutputSchema
└─ apps/mcp-server/
   ├─ src/env.ts                                  RATES_API_URL, RATES_TIMEOUT_MS
   ├─ src/rates/client.ts                         adapter, trả union
   ├─ src/png.ts                                  mã hóa PNG + vẽ cột
   ├─ src/tools/get-exchange-rate.ts · chart-customers-by-city.ts
   └─ scripts/rates-stub.ts · call.ts
lesson-code/m3/
├─ rates-matrix.sh · naive-matrix.sh · save-chart.ts
├─ traps/naive-rates.ts · data-url-image.ts
└─ patterns/rates-service.direct.ts
```

### packages/shared

`packages/shared/src/exchange-rate.ts`

```ts
import { z } from "zod";

/** Mã tiền tệ ISO 4217: đúng 3 chữ cái in hoa. Chữ thường được nâng lên trước khi kiểm. */
export const CurrencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Mã tiền tệ phải là 3 chữ cái ISO 4217, ví dụ USD, VND, EUR")
  .describe("Mã tiền tệ ISO 4217 (3 chữ cái), ví dụ 'USD', 'VND', 'EUR'.");

export const ExchangeRateInputSchema = z.object({
  base: CurrencySchema.describe("Tiền gốc, ví dụ 'USD'."),
  quote: CurrencySchema.default("VND").describe("Tiền quy đổi sang, mặc định 'VND'."),
});

export const ExchangeRateOutputSchema = z.object({
  base: z.string(),
  quote: z.string(),
  rate: z.number().positive().describe("1 base = rate quote"),
  asOf: z.string().describe("Thời điểm nguồn cập nhật tỷ giá (UTC)"),
  source: z.string(),
});
export type ExchangeRate = z.infer<typeof ExchangeRateOutputSchema>;
```

### apps/mcp-server/src

`apps/mcp-server/src/rates/client.ts`

```ts
/**
 * Client tỷ giá theo hợp đồng open.er-api.com v6: GET {base}/latest/{CODE}.
 * Không ném exception ra ngoài: mọi thất bại thành 1 nhánh của RatesResult (union) để tool dịch sang câu cho LLM.
 */
import { z } from "zod";
import type { ExchangeRate } from "@nexus/shared";

const ApiResponse = z.union([
  z.object({
    result: z.literal("success"),
    base_code: z.string(),
    time_last_update_utc: z.string(),
    rates: z.record(z.string(), z.number()),
  }),
  z.object({ result: z.literal("error"), "error-type": z.string() }),
]);

export type RatesError =
  | { kind: "timeout"; ms: number }
  | { kind: "cancelled" }
  | { kind: "network"; detail: string }
  | { kind: "upstream"; status: number }
  | { kind: "bad_response"; detail: string }
  | { kind: "unknown_currency"; code: string };

export type RatesResult = { ok: true; value: ExchangeRate } | { ok: false; error: RatesError };

export interface RatesClientOptions {
  baseUrl: string;
  timeoutMs: number;
  /** Tiêm fetch để test thay bằng bản giả (C50 Lab 06 cũng stub fetch). */
  fetch?: typeof fetch;
}

export interface RatesClient {
  latest(base: string, quote: string, signal?: AbortSignal): Promise<RatesResult>;
}

export function createRatesClient(opts: RatesClientOptions): RatesClient {
  const doFetch = opts.fetch ?? fetch;
  const source = new URL(opts.baseUrl).host;
  return {
    async latest(base, quote, signal) {
      const timeout = AbortSignal.timeout(opts.timeoutMs);
      const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
      let res: Response;
      try {
        res = await doFetch(`${opts.baseUrl}/latest/${encodeURIComponent(base)}`, {
          signal: combined,
          headers: { accept: "application/json" },
        });
      } catch (err) {
        if (timeout.aborted) return { ok: false, error: { kind: "timeout", ms: opts.timeoutMs } };
        if (signal?.aborted) return { ok: false, error: { kind: "cancelled" } };
        const cause = err instanceof Error && err.cause instanceof Error ? err.cause.message : String(err);
        return { ok: false, error: { kind: "network", detail: cause } };
      }
      if (res.status === 404) return { ok: false, error: { kind: "unknown_currency", code: base } };
      if (!res.ok) return { ok: false, error: { kind: "upstream", status: res.status } };

      let json: unknown;
      try {
        json = await res.json();
      } catch (err) {
        if (timeout.aborted) return { ok: false, error: { kind: "timeout", ms: opts.timeoutMs } };
        return { ok: false, error: { kind: "bad_response", detail: err instanceof Error ? err.message : String(err) } };
      }
      const parsed = ApiResponse.safeParse(json);
      if (!parsed.success) return { ok: false, error: { kind: "bad_response", detail: parsed.error.issues[0]?.message ?? "schema" } };
      const body = parsed.data;
      if (body.result === "error") {
        return body["error-type"] === "unsupported-code"
          ? { ok: false, error: { kind: "unknown_currency", code: base } }
          : { ok: false, error: { kind: "bad_response", detail: body["error-type"] } };
      }
      const rate = body.rates[quote];
      if (rate === undefined) return { ok: false, error: { kind: "unknown_currency", code: quote } };
      return {
        ok: true,
        value: { base, quote, rate, asOf: new Date(body.time_last_update_utc).toISOString(), source },
      };
    },
  };
}
```
`apps/mcp-server/src/tools/get-exchange-rate.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExchangeRateInputSchema, ExchangeRateOutputSchema, TOOL } from "@nexus/shared";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import type { RatesClient, RatesError } from "../rates/client.ts";
import { toolFail, toolOk, type ToolFailure } from "../tool-result.ts";

export interface ExchangeRateDeps {
  rates: RatesClient;
  log: Logger;
}

/** Anti-corruption: lỗi thô của mạng/API ngoài → câu LLM đọc được. Không stack trace, không URL nội bộ. */
export function describeRatesError(e: RatesError): ToolFailure {
  switch (e.kind) {
    case "timeout":
      return { what: `Dịch vụ tỷ giá không phản hồi trong ${e.ms / 1000} giây.`, next: "Thử lại sau ít phút. Không tự đoán tỷ giá; nói rõ với người dùng là chưa lấy được." };
    case "cancelled":
      return { what: "Yêu cầu tỷ giá đã bị hủy.", next: "Không cần làm gì thêm." };
    case "network":
    case "upstream":
      return { what: "Dịch vụ tỷ giá đang lỗi hoặc không truy cập được.", next: "Thử lại sau ít phút. Không tự đoán tỷ giá." };
    case "bad_response":
      return { what: "Dịch vụ tỷ giá trả dữ liệu không đọc được.", next: "Thử lại sau; nếu vẫn lỗi, báo người dùng là nguồn tỷ giá đang có vấn đề." };
    case "unknown_currency":
      return { what: `Nguồn tỷ giá không có mã tiền tệ '${e.code}'.`, next: "Kiểm tra lại mã ISO 4217 (ví dụ USD, EUR, JPY, VND) rồi gọi lại." };
  }
}

export function registerGetExchangeRate(server: McpServer, deps: ExchangeRateDeps): void {
  server.registerTool(
    TOOL.getExchangeRate,
    {
      title: "Tỷ giá ngoại tệ",
      description:
        "Lấy tỷ giá mới nhất giữa 2 loại tiền (mặc định quy đổi sang VND) từ dịch vụ bên ngoài. " +
        "Gọi khi cần quy đổi số tiền hoặc so sánh giá theo ngoại tệ. Tỷ giá cập nhật ~1 lần/ngày.",
      inputSchema: ExchangeRateInputSchema.shape,
      outputSchema: ExchangeRateOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    instrument(TOOL.getExchangeRate, deps.log, async ({ base, quote }, extra) => {
      const r = await deps.rates.latest(base, quote, extra.signal);
      if (!r.ok) {
        deps.log.warn("exchange rate failed", { base, quote, error: r.error });
        return toolFail(describeRatesError(r.error));
      }
      return toolOk(ExchangeRateOutputSchema, r.value);
    }),
  );
}
```
`apps/mcp-server/src/tools/chart-customers-by-city.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CITIES, TOOL } from "@nexus/shared";
import { z } from "zod";
import type { CustomerRepository } from "../customers/repository.ts";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { barChartPng, type Rgb } from "../png.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface ChartDeps {
  customers: CustomerRepository;
  log: Logger;
}

/** Trần kích thước ảnh sau base64 — ảnh lớn ăn context của model và có client từ chối. */
export const MAX_IMAGE_BASE64 = 1_000_000;

const PALETTE: readonly Rgb[] = [[184, 88, 58], [95, 109, 51], [156, 124, 20], [107, 74, 51], [163, 58, 42]];

const ChartOutput = z.object({
  counts: z.array(z.object({ city: z.string(), count: z.number().int() })).describe("Số khách mỗi thành phố, cùng thứ tự các cột trong ảnh"),
  total: z.number().int(),
  image: z.object({ mimeType: z.literal("image/png"), bytes: z.number().int(), width: z.number().int(), height: z.number().int() }),
});

export function registerChartCustomersByCity(server: McpServer, deps: ChartDeps): void {
  server.registerTool(
    TOOL.chartCustomersByCity,
    {
      title: "Biểu đồ khách theo thành phố",
      description:
        "Vẽ biểu đồ cột (ảnh PNG) số khách hàng theo từng thành phố, kèm số liệu dạng JSON. " +
        "Chỉ gọi khi người dùng muốn XEM biểu đồ; để trả lời bằng số, dùng nexus_list_customers.",
      inputSchema: {},
      outputSchema: ChartOutput.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.chartCustomersByCity, deps.log, async () => {
      const counts = await Promise.all(CITIES.map(async (city) => ({ city, count: (await deps.customers.list({ city, limit: 1 })).total })));
      const width = 480, height = 240;
      const png = barChartPng(counts.map((c) => c.count), { width, height, colors: PALETTE });
      const data = png.toString("base64");
      if (data.length > MAX_IMAGE_BASE64) {
        return toolFail({ what: `Ảnh biểu đồ quá lớn (${data.length} ký tự base64).`, next: "Trả lời bằng số liệu từ nexus_list_customers thay vì ảnh." });
      }
      return toolOk(
        ChartOutput,
        { counts, total: counts.reduce((s, c) => s + c.count, 0), image: { mimeType: "image/png", bytes: png.length, width, height } },
        [{ type: "image", data, mimeType: "image/png" }],
      );
    }),
  );
}
```
`apps/mcp-server/src/png.ts`

```ts
/**
 * Bộ mã hóa PNG tối thiểu (RGBA 8-bit, không nén thông minh) + vẽ biểu đồ cột.
 * Không phụ thuộc thư viện ngoài: node:zlib cho deflate, CRC32 tự tính.
 */
import { deflateSync } from "node:zlib";

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

export function encodePng(width: number, height: number, rgba: Uint8Array): Buffer {
  if (rgba.length !== width * height * 4) throw new RangeError("rgba size mismatch");
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: None
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 6, 0, 0, 0], 8); // 8-bit, RGBA, deflate, adaptive, no interlace
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", new Uint8Array())]);
}

export type Rgb = readonly [number, number, number];

/** Biểu đồ cột ngang hàng: mỗi giá trị 1 cột, cao theo tỉ lệ với giá trị lớn nhất. */
export function barChartPng(values: readonly number[], opts: { width: number; height: number; colors: readonly Rgb[] }): Buffer {
  const { width: w, height: h } = opts;
  const px = new Uint8Array(w * h * 4).fill(255);
  const set = (x: number, y: number, [r, g, b]: Rgb) => {
    const i = (y * w + x) * 4;
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
  };
  const pad = 16;
  const baseY = h - pad;
  for (let x = pad; x < w - pad; x++) set(x, baseY, [107, 74, 51]); // trục ngang
  const max = Math.max(1, ...values);
  const slot = (w - 2 * pad) / Math.max(1, values.length);
  values.forEach((v, i) => {
    const barH = Math.round(((h - 2 * pad) * v) / max);
    const x0 = Math.round(pad + i * slot + slot * 0.15);
    const x1 = Math.round(pad + (i + 1) * slot - slot * 0.15);
    const color = opts.colors[i % opts.colors.length] ?? [184, 88, 58];
    for (let x = x0; x < x1; x++) for (let y = baseY - barH; y < baseY; y++) set(x, y, color);
  });
  return encodePng(w, h, px);
}
```
`apps/mcp-server/src/env.ts`

```ts
import { z } from "zod";

const Base = z.object({
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  /** API tỷ giá (hợp đồng open.er-api.com v6). Dev/test: trỏ vào scripts/rates-stub.ts. */
  RATES_API_URL: z.url().default("https://open.er-api.com/v6"),
  RATES_TIMEOUT_MS: z.coerce.number().int().min(100).max(30_000).default(5_000),
});

/** Discriminated union: NEXUS_DATA=mongo thì bắt buộc có MONGODB_URI. */
const EnvSchema = z.discriminatedUnion("NEXUS_DATA", [
  Base.extend({
    NEXUS_DATA: z.literal("mongo"),
    MONGODB_URI: z.string().startsWith("mongodb"),
    MONGODB_DB: z.string().min(1).default("nexus"),
  }),
  Base.extend({ NEXUS_DATA: z.literal("memory") }),
]);
export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse({ ...source, NEXUS_DATA: source["NEXUS_DATA"] ?? "mongo" });
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join(".") || "(env)"}: ${i.message}`);
    process.stderr.write(`[nexus-mcp] Cấu hình sai:\n${lines.join("\n")}\n`);
    process.exit(1);
  }
  return parsed.data;
}
```

### apps/mcp-server/scripts

`apps/mcp-server/scripts/rates-stub.ts`

```ts
/**
 * Server tỷ giá GIẢ cho dev/test — cùng hợp đồng open.er-api.com v6, số liệu cố định (KHÔNG phải tỷ giá thật).
 * Chế độ nằm trong đường dẫn để 1 server phục vụ mọi kịch bản:
 *   http://127.0.0.1:4010/ok/v6        trả dữ liệu
 *   http://127.0.0.1:4010/slow/v6      treo 30 giây (thử timeout)
 *   http://127.0.0.1:4010/down/v6      503
 *   http://127.0.0.1:4010/html/v6      200 nhưng body là HTML (proxy/captive portal)
 *   node scripts/rates-stub.ts [port]
 */
import { createServer } from "node:http";

const port = Number(process.argv[2] ?? 4010);
const STUB_RATES_USD: Record<string, number> = { USD: 1, VND: 26_000, EUR: 0.9, JPY: 150, SGD: 1.3 };

function ratesFor(base: string): Record<string, number> | undefined {
  const perUsd = STUB_RATES_USD[base];
  if (perUsd === undefined) return undefined;
  return Object.fromEntries(Object.entries(STUB_RATES_USD).map(([k, v]) => [k, Number((v / perUsd).toPrecision(6))]));
}

const server = createServer((req, res) => {
  const m = /^\/(ok|slow|down|html)\/v6\/latest\/([A-Za-z]+)$/.exec(req.url ?? "");
  if (!m) { res.writeHead(404).end(); return; }
  const [, mode, code = ""] = m;
  process.stderr.write(`[rates-stub] ${mode} ${code}\n`);
  if (mode === "slow") { setTimeout(() => res.writeHead(200).end("{}"), 30_000); return; }
  if (mode === "down") { res.writeHead(503, { "content-type": "text/plain" }).end("Service Unavailable"); return; }
  if (mode === "html") { res.writeHead(200, { "content-type": "text/html" }).end("<html><body>Please sign in to Wi-Fi</body></html>"); return; }
  const rates = ratesFor(code.toUpperCase());
  const body = rates
    ? { result: "success", base_code: code.toUpperCase(), time_last_update_utc: "Sun, 27 Sep 2026 00:02:31 +0000", rates }
    : { result: "error", "error-type": "unsupported-code" };
  res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(body));
});
server.listen(port, "127.0.0.1", () => process.stderr.write(`[rates-stub] http://127.0.0.1:${port}/{ok|slow|down|html}/v6\n`));
```
`apps/mcp-server/scripts/call.ts`

```ts
/**
 * Gọi 1 tool của Nexus qua MCP client thật (spawn server bằng stdio) và in: thời gian, isError, content, structuredContent.
 *   node scripts/call.ts <tool> '<json args>'
 * Env chuyển cho server: NEXUS_DATA (mặc định memory), MONGODB_URI, RATES_API_URL, RATES_TIMEOUT_MS, LOG_LEVEL (mặc định warn).
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";

const [name = "nexus_ping", raw = "{}"] = process.argv.slice(2);
const env: Record<string, string> = { NEXUS_DATA: "memory", LOG_LEVEL: "warn", PATH: process.env["PATH"] ?? "" };
for (const k of ["NEXUS_DATA", "MONGODB_URI", "RATES_API_URL", "RATES_TIMEOUT_MS", "LOG_LEVEL"]) {
  const v = process.env[k];
  if (v) env[k] = v;
}
const client = new Client({ name: "nexus-call", version: "0.0.0" });
await client.connect(
  new StdioClientTransport({ command: process.execPath, args: [fileURLToPath(new URL("../src/index.ts", import.meta.url))], env, stderr: "ignore" }),
);
await client.listTools(); // client cache outputSchema để tự kiểm structuredContent
const t0 = performance.now();
const res = await client.callTool({ name, arguments: JSON.parse(raw) as Record<string, unknown> });
console.log(`${res.isError ? "[isError]" : "ok"} ${name} · ${Math.round(performance.now() - t0)} ms`);
for (const c of Array.isArray(res.content) ? res.content : []) {
  if (c.type === "text") console.log(`  content[text]  ${c.text}`);
  else if (c.type === "image") console.log(`  content[image] ${c.mimeType} · base64 ${c.data.length} ký tự`);
  else console.log(`  content[${c.type}]`);
}
if (res.structuredContent) console.log(`  structuredContent ${JSON.stringify(res.structuredContent)}`);
await client.close();
```

### lesson-code

`lesson-code/m3/rates-matrix.sh`

```bash
#!/usr/bin/env bash
# Gọi nexus_get_exchange_rate qua MCP với 6 tình huống nguồn tỷ giá (rates-stub chạy ở :4010).
cd /home/claude/lesson-code
for mode in ok slow down html; do
  echo "── RATES_API_URL=http://127.0.0.1:4010/$mode/v6"
  RATES_API_URL="http://127.0.0.1:4010/$mode/v6" node m3/call.ts nexus_get_exchange_rate '{"base":"USD"}'
done
echo "── RATES_API_URL=http://127.0.0.1:4999/v6   (không có gì nghe ở cổng này)"
RATES_API_URL="http://127.0.0.1:4999/v6" node m3/call.ts nexus_get_exchange_rate '{"base":"USD"}'
echo "── RATES_API_URL mặc định (open.er-api.com — sandbox chặn ra internet)"
node m3/call.ts nexus_get_exchange_rate '{"base":"USD"}'
```
`lesson-code/m3/naive-matrix.sh`

```bash
#!/usr/bin/env bash
# Bản "dịch thẳng" (traps/naive-rates.ts) với cùng các tình huống — xem LLM nhận được gì.
cd /home/claude/lesson-code
for url in http://127.0.0.1:4010/down/v6 http://127.0.0.1:4010/html/v6 http://127.0.0.1:4999/v6 http://127.0.0.1:4010/slow/v6; do
  echo "── $url"
  RATES_API_URL="$url" node m3/call-any.ts m3/traps/naive-rates.ts nexus_get_exchange_rate '{"base":"USD"}'
done
```
`lesson-code/m3/save-chart.ts`

```ts
/** Gọi nexus_chart_customers_by_city qua MCP rồi ghi ảnh ra file — để xem ảnh mà host nhận được. */
import { writeFileSync } from "node:fs";
import { connectNexus } from "./connect.ts";

const out = process.argv[2] ?? "chart.png";
const client = await connectNexus();
await client.listTools();
const res = await client.callTool({ name: "nexus_chart_customers_by_city", arguments: {} });
for (const c of Array.isArray(res.content) ? res.content : []) {
  if (c.type === "image") {
    const bytes = Buffer.from(c.data, "base64");
    writeFileSync(out, bytes);
    console.log(`${c.mimeType} · ${bytes.length} byte · base64 ${c.data.length} ký tự (+${Math.round((c.data.length / bytes.length - 1) * 100)}%) → ${out}`);
  }
}
await client.close();
```
`lesson-code/m3/traps/naive-rates.ts`

```ts
/**
 * Bẫy S3.4: "dịch thẳng" HttpClient.GetFromJsonAsync — không timeout, không try/catch, không kiểm status.
 * Exception thô (và thời gian treo) đi thẳng tới LLM.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const baseUrl = process.env["RATES_API_URL"] ?? "https://open.er-api.com/v6";
const server = new McpServer({ name: "naive-rates", version: "0.0.0" });
server.registerTool(
  "nexus_get_exchange_rate",
  { description: "Tỷ giá", inputSchema: { base: z.string(), quote: z.string().default("VND") } },
  async ({ base, quote }) => {
    const res = await fetch(`${baseUrl}/latest/${base}`);
    const body = (await res.json()) as { rates: Record<string, number> };
    return { content: [{ type: "text", text: String(body.rates[quote]) }] };
  },
);
await server.connect(new StdioServerTransport());
```
`lesson-code/m3/traps/data-url-image.ts`

```ts
/** Bẫy S3.4: quen trả ảnh cho <img src>, gửi luôn data URL thay vì base64 thuần. */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { barChartPng } from "../../../nexus/apps/mcp-server/src/png.ts";

const png = barChartPng([12, 5, 5, 4, 4], { width: 480, height: 240, colors: [[184, 88, 58]] });
const server = new McpServer({ name: "data-url-image", version: "0.0.0" });
server.registerTool("nexus_chart_customers_by_city", { description: "Biểu đồ" }, async () => ({
  content: [{ type: "image", data: `data:image/png;base64,${png.toString("base64")}`, mimeType: "image/png" }],
}));
await server.connect(new StdioServerTransport());
```

---

## S3.5 — Annotations, progress, logging

Mục tiêu: cho host biết tool nguy hiểm tới đâu (annotation), cho việc chạy lâu có phản hồi (progress — chỉ khi client xin), và gửi log đúng kênh theo mức client chọn. Không bao giờ ghi gì ra stdout.

### C# → TS/Node

| Khái niệm C# | Tương đương TS/Node | Khác ở đâu |
|---|---|---|
| `[HttpGet]` vs `[HttpDelete]`, idempotency theo verb | `annotations: { readOnlyHint, destructiveHint, idempotentHint, openWorldHint }` | Chỉ là **gợi ý** cho host; không ai chặn tool nói dối |
| (không có) giá trị mặc định an toàn | Thiếu annotation = `readOnly: false`, `destructive: true`, `openWorld: true` | Không khai gì = host coi là tool nguy hiểm nhất |
| `IProgress<T>` | `extra.sendNotification({ method: "notifications/progress", … })` | Chỉ gửi khi request có `_meta.progressToken`; `progress` phải tăng |
| `HttpClient.Timeout` phía client | `callTool(..., { timeout, resetTimeoutOnProgress })` | Mặc định 60 s; progress **có thể** gia hạn nếu client bật |
| `ILogger` + `LogLevel` tối thiểu | `notifications/message` + `logging/setLevel` | **Client** chọn mức; 8 mức kiểu syslog |
| `Console.WriteLine` | `console.log` → stdout = kênh JSON-RPC | Log ra stderr hoặc qua MCP, không bao giờ stdout |
| `ActionFilter` / `DelegatingHandler` | Hàm bậc cao `instrument(name, log, handler)` | Bọc hàm, không kế thừa lớp cha |
| `NullLogger.Instance` | `progressReporter(extra)` trả hàm rỗng khi không có token | Null Object thay cho `if` rải rác |

### Lab

#### Lab C50 — 08 Tool Annotations · 09 Progress Notifications · 10 Logging

**Mục tiêu:** Lab 08 khai read-only/destructive đúng từng tool; Lab 09 báo tiến độ cho việc chạy lâu, im lặng khi client không đưa token; Lab 10 gửi log theo mức, không bao giờ ra stdout.

- [ ] Lab 08 xanh.
- [ ] Lab 09 xanh.
- [ ] Lab 10 xanh.

**Lệnh nghiệm thu** (repo C50 — chưa chạy ở sandbox dựng bài):

```console
$ npm run check
```

Cần nắm để tự làm:

- Lab 08: đi từng tool, hỏi 4 câu: có sửa gì không (`readOnlyHint`)? Nếu có, có ghi đè/xóa được không (`destructiveHint`)? Gọi lại cùng tham số có thêm hiệu ứng không (`idempotentHint`)? Có chạm thế giới ngoài hệ thống của mình không (`openWorldHint`)? Khai **tường minh** — mặc định của spec là trường hợp nguy hiểm nhất.
- Lab 09: token nằm ở `extra._meta?.progressToken`. Không có → không gửi gì, vẫn trả kết quả đúng. Có → `progress` tăng dần, `total` nếu biết.
- Lab 10: server phải khai capability `logging` thì mới có `logging/setLevel`. Log qua giao thức (`notifications/message`) hoặc stderr — **không** `console.log`. Mức log so theo thứ tự `debug < info < notice < warning < error < critical < alert < emergency`.

#### Lab Nexus S3.5 — annotation cho 9 tool, 2 tool ghi, báo cáo có progress, log theo mức

**Mục tiêu:** mọi tool Nexus có annotation tường minh; `nexus_update_customer_tier` và `nexus_delete_customer` có `destructiveHint: true`; `nexus_generate_report` báo progress; log gửi client theo `logging/setLevel` (mặc định `info`).

- [ ] Smoke không có dòng `✗ tool ghi thiếu destructiveHint`; dòng `nexus_generate_report → progress events: 6`.
- [ ] Gọi báo cáo **không** có `onprogress` → 0 notification progress, kết quả vẫn đúng.
- [ ] `logging/setLevel warning` → chỉ nhận log `warning` trở lên.
- [ ] `grep -rn "console.log" apps/mcp-server/src | wc -l` ra `0`.
- [ ] Host Nexus web chỉ đưa tool `readOnlyHint: true` cho LLM (tới khi có thẻ xác nhận ở M11).
- [ ] Claude Desktop hiện hộp xác nhận khi gọi `nexus_delete_customer` — **chưa chạy ở sandbox dựng bài**, bạn kiểm trên máy mình.

**Lệnh nghiệm thu:**

```console
$ pnpm check
$ grep -rn "console.log" apps/mcp-server/src | wc -l
```

**Gợi ý hướng làm:** viết `progress.ts` (reporter), `instrument.ts` (decorator), mở rộng `log.ts` thành logger nhiều sink (stderr + MCP) trước; sau đó mỗi tool chỉ thêm `annotations` và dùng `instrument(...)`. Thêm `logging: {}` vào capabilities của `McpServer`.

Output thật — `pnpm check` sau cả module:

```console
$ pnpm check

> nexus@ check /home/claude/nexus
> pnpm typecheck && pnpm smoke


> nexus@ typecheck /home/claude/nexus
> pnpm -r --parallel typecheck

Scope: 3 of 4 workspace projects
apps/mcp-server typecheck$ tsc -p tsconfig.json
apps/web typecheck$ tsc -p tsconfig.json
packages/shared typecheck$ tsc -p tsconfig.json
packages/shared typecheck: Done
apps/web typecheck: Done
apps/mcp-server typecheck: Done

> nexus@ smoke /home/claude/nexus
> pnpm --filter @nexus/mcp-server smoke


> @nexus/mcp-server@0.0.0 smoke /home/claude/nexus/apps/mcp-server
> node scripts/smoke.ts

tools (9): nexus_ping, nexus_get_time, nexus_list_customers, nexus_get_customer, nexus_get_exchange_rate, nexus_chart_customers_by_city, nexus_update_customer_tier, nexus_delete_customer, nexus_generate_report
✓ nexus_ping {} → {"ok":true,"server":"nexus 0.3.0"}
✓ [isError] nexus_get_time {"timeZone":"Hanoi"} → Múi giờ 'Hanoi' không có trong cơ sở dữ liệu IANA. Gọi lại với tên dạng Khu_vực/Thành_phố, ví dụ 'Asia/Ho_Chi_Minh' cho Việt Nam.
✓ nexus_list_customers {"city":"ha noi","limit":2} → {"total":12,"returned":2,"items":[{"id":"cus_012","name":"Nội thất Cầu Giấy","city":"Hà Nội","tier":"enterprise"},{"id":"cus_011","name":"Studio Hoàn 
✓ [isError] nexus_list_customers {"limit":500} → MCP error -32602: Input validation error: Invalid arguments for tool nexus_list_customers: Too big: expected number to be <=50 at limit
✓ nexus_get_customer {"id":"cus_007"} → {"id":"cus_007","name":"In ấn Hồng Hà","email":"lienhe@kh007.vn","city":"Hà Nội","tier":"pro","createdAt":"2025-03-24T08:00:00.000Z"}
✓ [isError] nexus_get_customer {"id":"007"} → MCP error -32602: Input validation error: Invalid arguments for tool nexus_get_customer: Id khách hàng có dạng 'cus_' + số, ví dụ 'cus_007' at id
✓ [isError] nexus_get_customer {"id":"cus_999"} → Không có khách hàng nào với id 'cus_999'. Gọi nexus_list_customers (có thể lọc theo thành phố) để lấy id đúng, rồi gọi lại.
✓ nexus_get_exchange_rate {"base":"usd"} → {"base":"USD","quote":"VND","rate":26000,"asOf":"2026-09-27T00:02:31.000Z","source":"127.0.0.1:4011"}
✓ [isError] nexus_get_exchange_rate {"base":"XYZ"} → Nguồn tỷ giá không có mã tiền tệ 'XYZ'. Kiểm tra lại mã ISO 4217 (ví dụ USD, EUR, JPY, VND) rồi gọi lại.
✓ nexus_chart_customers_by_city {} → {"counts":[{"city":"Hà Nội","count":12},{"city":"Hải Phòng","count":5},{"city":"TP.HCM","count":5},{"city":"Đà Nẵng","count":4},{"city":"Cần Thơ","cou
✓ nexus_update_customer_tier {"id":"cus_003","tier":"pro"} → {"id":"cus_003","previousTier":"free","tier":"pro","changed":true}
✓ nexus_delete_customer {"id":"cus_030"} → {"id":"cus_030","deleted":true}
✓ nexus_delete_customer {"id":"cus_030"} → {"id":"cus_030","deleted":false}
✓ nexus_generate_report → progress events: 6
✓ smoke OK — 14 lần gọi, quy ước tên/outputSchema/annotation đạt
```

<details>
<summary>Xem sau khi làm xong — lời giải Lab Nexus S3.5</summary>

`apps/mcp-server/src/progress.ts`

```ts
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { ServerNotification, ServerRequest } from "@modelcontextprotocol/sdk/types.js";

export type ToolExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;
export type ReportProgress = (progress: number, total?: number, message?: string) => Promise<void>;

/**
 * Client chỉ muốn nhận progress khi gửi _meta.progressToken. Không có token → trả hàm rỗng (Null Object):
 * handler gọi report() thoải mái, không cần if, và không gửi notification nào.
 */
export function progressReporter(extra: ToolExtra): ReportProgress {
  const token = extra._meta?.progressToken;
  if (token === undefined) return async () => {};
  let last = Number.NEGATIVE_INFINITY;
  return async (progress, total, message) => {
    if (progress <= last) return; // spec: progress PHẢI tăng dần
    last = progress;
    await extra.sendNotification({
      method: "notifications/progress",
      params: { progressToken: token, progress, ...(total !== undefined && { total }), ...(message !== undefined && { message }) },
    });
  };
}
```
`apps/mcp-server/src/instrument.ts`

```ts
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Logger } from "./log.ts";
import type { ToolExtra } from "./progress.ts";
import { toolFail } from "./tool-result.ts";

/**
 * Decorator cho handler tool (≈ DelegatingHandler / ActionFilter): đo thời gian, log kết quả,
 * và chặn exception lọt ra ngoài — SDK sẽ gửi nguyên message exception cho LLM nếu ta để nó bay.
 */
export function instrument<A>(
  name: string,
  log: Logger,
  handler: (args: A, extra: ToolExtra) => Promise<CallToolResult>,
): (args: A, extra: ToolExtra) => Promise<CallToolResult> {
  return async (args, extra) => {
    const t0 = performance.now();
    try {
      const res = await handler(args, extra);
      const ms = Math.round(performance.now() - t0);
      if (res.isError) log.warn("tool failed", { tool: name, ms });
      else log.debug("tool ok", { tool: name, ms });
      return res;
    } catch (err) {
      const ms = Math.round(performance.now() - t0);
      log.error("tool crashed", { tool: name, ms, err: err instanceof Error ? (err.stack ?? err.message) : String(err) });
      return toolFail({ what: `Tool ${name} gặp lỗi nội bộ.`, next: "Đừng thử lại ngay với cùng tham số; báo người dùng là hệ thống đang lỗi." });
    }
  };
}
```
`apps/mcp-server/src/log.ts`

```ts
/**
 * Logger 2 đích:
 *  - stderr: JSON 1 dòng cho người vận hành (Claude Desktop gom vào mcp-server-nexus.log).
 *  - MCP client: notifications/message, lọc theo mức client đặt bằng logging/setLevel.
 * stdout là kênh JSON-RPC — KHÔNG sink nào được ghi vào đó.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LoggingLevelSchema, SetLevelRequestSchema, type LoggingLevel } from "@modelcontextprotocol/sdk/types.js";

export type Level = "debug" | "info" | "warn" | "error";
export type LogData = Record<string, unknown>;
export type LogSink = (level: Level, msg: string, data?: LogData) => void;

export interface Logger {
  debug(msg: string, data?: LogData): void;
  info(msg: string, data?: LogData): void;
  warn(msg: string, data?: LogData): void;
  error(msg: string, data?: LogData): void;
}

const RANK: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export function stderrSink(min: Level = "info", out: NodeJS.WritableStream = process.stderr): LogSink {
  return (level, msg, data) => {
    if (RANK[level] < RANK[min]) return;
    out.write(JSON.stringify({ t: new Date().toISOString(), level, msg, ...data }) + "\n");
  };
}

/** MCP có 8 mức (syslog); Nexus dùng 4 — warn ↔ "warning". */
const TO_MCP: Record<Level, LoggingLevel> = { debug: "debug", info: "info", warn: "warning", error: "error" };

/** debug < info < notice < warning < error < critical < alert < emergency */
const SEVERITY: readonly LoggingLevel[] = LoggingLevelSchema.options;

/**
 * Gửi log cho client qua giao thức (notifications/message). Cần capabilities.logging khi tạo server.
 * Tự giữ mức tối thiểu: client gửi logging/setLevel thì theo client; chưa gửi thì dùng defaultLevel
 * (SDK mặc định gửi TẤT CẢ, kể cả debug, khi client chưa chọn mức). stdio = 1 client; HTTP nhiều session là M7.
 */
export function mcpLogSink(server: McpServer, opts: { logger?: string; defaultLevel?: LoggingLevel } = {}): LogSink {
  const logger = opts.logger ?? "nexus";
  let min: LoggingLevel = opts.defaultLevel ?? "info";
  // Không gửi gì trước khi bắt tay xong (notifications/initialized) — spec cấm server "nói trước"
  let initialized = false;
  const prev = server.server.oninitialized;
  server.server.oninitialized = () => {
    initialized = true;
    prev?.();
  };
  server.server.setRequestHandler(SetLevelRequestSchema, async (req) => {
    min = req.params.level;
    return {};
  });
  return (level, msg, data) => {
    const l = TO_MCP[level];
    if (!initialized || SEVERITY.indexOf(l) < SEVERITY.indexOf(min)) return;
    server.sendLoggingMessage({ level: l, logger, data: { msg, ...data } }).catch(() => {});
  };
}

export function createLogger(...initial: LogSink[]): Logger & { attach(sink: LogSink): void } {
  const sinks = [...initial];
  const emit = (level: Level) => (msg: string, data?: LogData) => {
    for (const sink of sinks) sink(level, msg, data);
  };
  return {
    debug: emit("debug"),
    info: emit("info"),
    warn: emit("warn"),
    error: emit("error"),
    attach: (sink) => void sinks.push(sink),
  };
}
```
`apps/mcp-server/src/tools/generate-report.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CITIES, TIERS, TOOL, type Tier } from "@nexus/shared";
import { setTimeout as sleep } from "node:timers/promises";
import { z } from "zod";
import type { CustomerRepository } from "../customers/repository.ts";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { progressReporter } from "../progress.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface ReportDeps {
  customers: CustomerRepository;
  log: Logger;
  now: () => Date;
  /** Thời gian mỗi bước. Mô phỏng việc nặng theo từng thành phố (M5 thay bằng aggregation thật). */
  stepMs: number;
}

const Row = z.object({ city: z.string(), total: z.number().int(), free: z.number().int(), pro: z.number().int(), enterprise: z.number().int() });
const ReportOutput = z.object({
  generatedAt: z.string(),
  totalCustomers: z.number().int(),
  rows: z.array(Row).describe("1 dòng / thành phố: tổng và số khách theo từng gói"),
});

export function registerGenerateReport(server: McpServer, deps: ReportDeps): void {
  server.registerTool(
    TOOL.generateReport,
    {
      title: "Báo cáo khách hàng theo thành phố",
      description:
        "Tạo báo cáo tổng hợp số khách theo thành phố và theo gói (free/pro/enterprise). Chạy vài giây, có báo tiến độ. " +
        "Gọi khi người dùng muốn báo cáo/tổng quan; câu hỏi đếm đơn lẻ thì dùng nexus_list_customers.",
      inputSchema: {},
      outputSchema: ReportOutput.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.generateReport, deps.log, async (_args, extra) => {
      const report = progressReporter(extra);
      const rows: z.infer<typeof Row>[] = [];
      for (const [i, city] of CITIES.entries()) {
        if (extra.signal.aborted) {
          deps.log.info("report cancelled", { done: i, of: CITIES.length });
          return toolFail({ what: `Báo cáo bị hủy sau ${i}/${CITIES.length} thành phố.`, next: "Không cần làm gì thêm." });
        }
        await report(i, CITIES.length, `Đang tổng hợp ${city}`);
        const { total, items } = await deps.customers.list({ city, limit: 50 });
        const byTier = Object.fromEntries(TIERS.map((t) => [t, items.filter((c) => c.tier === t).length])) as Record<Tier, number>;
        rows.push({ city, total, ...byTier });
        deps.log.debug("report step", { city, total });
        await sleep(deps.stepMs, undefined, { signal: extra.signal }).catch(() => {});
      }
      await report(CITIES.length, CITIES.length, "Xong");
      return toolOk(ReportOutput, {
        generatedAt: deps.now().toISOString(),
        totalCustomers: rows.reduce((s, r) => s + r.total, 0),
        rows,
      });
    }),
  );
}
```
`apps/mcp-server/src/tools/delete-customer.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DeleteCustomerInputSchema, DeleteCustomerOutputSchema, TOOL } from "@nexus/shared";
import type { CustomerRepository } from "../customers/repository.ts";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { toolOk } from "../tool-result.ts";

export interface DeleteCustomerDeps {
  customers: CustomerRepository;
  log: Logger;
}

export function registerDeleteCustomer(server: McpServer, deps: DeleteCustomerDeps): void {
  server.registerTool(
    TOOL.deleteCustomer,
    {
      title: "Xóa khách hàng",
      description:
        "XÓA VĨNH VIỄN 1 khách hàng theo id. Không hoàn tác được. " +
        "Chỉ gọi khi người dùng yêu cầu xóa đúng khách đó và đã xác nhận; không bao giờ gọi để 'dọn dẹp' tự phát.",
      inputSchema: DeleteCustomerInputSchema.shape,
      outputSchema: DeleteCustomerOutputSchema.shape,
      // Xóa 2 lần = xóa 1 lần (lần 2 deleted=false) → idempotent, nhưng vẫn destructive.
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    instrument(TOOL.deleteCustomer, deps.log, async ({ id }) => {
      const deleted = await deps.customers.delete(id);
      deps.log.warn("customer delete", { id, deleted });
      return toolOk(DeleteCustomerOutputSchema, { id, deleted });
    }),
  );
}
```
`apps/mcp-server/src/tools/update-customer-tier.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL, UpdateCustomerTierInputSchema, UpdateCustomerTierOutputSchema } from "@nexus/shared";
import type { CustomerRepository } from "../customers/repository.ts";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface UpdateTierDeps {
  customers: CustomerRepository;
  log: Logger;
}

export function registerUpdateCustomerTier(server: McpServer, deps: UpdateTierDeps): void {
  server.registerTool(
    TOOL.updateCustomerTier,
    {
      title: "Đổi gói khách hàng",
      description:
        "Đổi gói dịch vụ (free/pro/enterprise) của 1 khách hàng — GHI dữ liệu, ghi đè gói cũ. " +
        "Chỉ gọi khi người dùng yêu cầu rõ ràng việc đổi gói cho đúng khách đó.",
      inputSchema: UpdateCustomerTierInputSchema.shape,
      outputSchema: UpdateCustomerTierOutputSchema.shape,
      // Ghi đè giá trị cũ (không khôi phục được nếu không nhớ gói cũ) → destructive. Đặt lại cùng gói → idempotent.
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    instrument(TOOL.updateCustomerTier, deps.log, async ({ id, tier }) => {
      const change = await deps.customers.updateTier(id, tier);
      if (!change) {
        return toolFail({ what: `Không có khách hàng nào với id '${id}', chưa đổi gì.`, next: `Gọi ${TOOL.listCustomers} để lấy id đúng.` });
      }
      deps.log.info("customer tier set", { id, from: change.previousTier, to: change.tier, changed: change.changed });
      return toolOk(UpdateCustomerTierOutputSchema, { id, ...change });
    }),
  );
}
```
`apps/web/lib/mcp/host.ts`

```ts
import "server-only";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { serverEnv } from "../env.server.ts";
import type { ToolSpec } from "../llm/types.ts";

interface McpHost {
  client: Client;
  tools: ToolSpec[];
}

/** Singleton trên globalThis: next dev nạp lại module khi sửa file — biến module sẽ spawn thêm process con. */
const g = globalThis as typeof globalThis & { __nexusMcp?: Promise<McpHost> };

async function connect(): Promise<McpHost> {
  const env = serverEnv();
  // Least privilege: process con chỉ nhận đúng biến nó cần, KHÔNG có ANTHROPIC_API_KEY
  const childEnv: Record<string, string> = { PATH: process.env["PATH"] ?? "", NEXUS_DATA: env.NEXUS_DATA };
  if (env.MONGODB_URI) childEnv["MONGODB_URI"] = env.MONGODB_URI;
  const transport = new StdioClientTransport({ command: process.execPath, args: [env.MCP_SERVER_ENTRY], env: childEnv, stderr: "inherit" });
  const client = new Client({ name: "nexus-web", version: "0.2.0" });
  await client.connect(transport);
  const { tools } = await client.listTools();
  transport.onclose = () => { delete g.__nexusMcp; };
  // Host đọc annotation: tới khi có thẻ xác nhận trong chat (M11), chỉ đưa tool CHỈ-ĐỌC cho LLM.
  // Annotation là gợi ý từ server — host chỉ tin annotation của server mình kiểm soát.
  const exposed = tools.filter((t) => t.annotations?.readOnlyHint === true);
  return {
    client,
    tools: exposed.map((t) => ({ name: t.name, description: t.description ?? "", inputSchema: t.inputSchema as Record<string, unknown> })),
  };
}

export function mcpHost(): Promise<McpHost> {
  g.__nexusMcp ??= connect().catch((err: unknown) => { delete g.__nexusMcp; throw err; });
  return g.__nexusMcp;
}

export async function callMcpTool(name: string, input: Record<string, unknown>, signal: AbortSignal): Promise<{ content: string; isError: boolean }> {
  const { client } = await mcpHost();
  const res = await client.callTool({ name, arguments: input }, undefined, { signal });
  const content = Array.isArray(res.content) ? res.content.map((c) => (c.type === "text" ? c.text : `[${c.type}]`)).join("\n") : "";
  return { content, isError: Boolean(res.isError) };
}
```

Nối logger vào server (diff thật so với M2):

`apps/mcp-server/src/index.ts`

```diff
-import { createLogger } from "./log.ts";
+import { createLogger, mcpLogSink, stderrSink } from "./log.ts";
 import { openDataSource, type DataSource } from "./db.ts";
+import { createRatesClient } from "./rates/client.ts";
 import { createServer } from "./server.ts";
 
 const env = loadEnv();
-const log = createLogger(env.LOG_LEVEL);
+const log = createLogger(stderrSink(env.LOG_LEVEL));
 
-const server = createServer({ customers: data.customers, log, now: () => new Date() });
+const rates = createRatesClient({ baseUrl: env.RATES_API_URL, timeoutMs: env.RATES_TIMEOUT_MS });
+const server = createServer({ customers: data.customers, rates, log, now: () => new Date() });
+// Gắn sink MCP TRƯỚC connect: handler logging/setLevel phải có sẵn khi client gửi tới
+log.attach(mcpLogSink(server));
 await server.connect(new StdioServerTransport());
```

</details>

<details>
<summary>Tra khi test đỏ</summary>

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| Host hỏi xác nhận cả tool chỉ đọc | Không khai `readOnlyHint` → mặc định `false`, `destructiveHint` mặc định `true` | Khai tường minh cho mọi tool |
| Client báo `Received a progress notification for an unknown token` | Server gửi progress khi request không có token (tự bịa token) | `progressReporter(extra)` — không token thì hàm rỗng |
| `MCP error -32001: Request timed out` với tool chạy lâu | Timeout phía client (mặc định 60 s) | Client bật `resetTimeoutOnProgress` + server gửi progress; hoặc tăng `timeout` |
| `logging/setLevel` → `MCP error -32601: Method not found` | Thiếu `capabilities: { logging: {} }` | Thêm vào tham số 2 của `new McpServer` |
| Client không nhận log nào, không lỗi | Như trên — `sendLoggingMessage` im lặng bỏ qua khi thiếu capability | Như trên |
| Client ngập log `debug` | SDK 1.30 gửi mọi mức khi client chưa `setLevel` | Sink tự giữ mức mặc định (`info`) như `mcpLogSink` |
| `Unexpected token … is not valid JSON` ở client | `console.log` trong server (M2) | Logger → stderr / MCP |
| Progress đứng yên hoặc lùi | Gửi `progress` không tăng (ví dụ gửi lại cùng số) | Reporter bỏ qua giá trị không tăng |

</details>

### Annotation: tín hiệu cho host, không phải bảo mật

Output thật — bảng annotation host nhìn thấy (`?` = không khai, host dùng mặc định):

```console
$ node m3/inspect-tools.ts
tool                            RO DE ID OW  out  description (câu đầu)
nexus_ping                      ✓  ?  ?  -   có   Kiểm tra server Nexus còn sống.
nexus_get_time                  ✓  ?  ?  -   có   Lấy ngày giờ hiện tại theo múi giờ IANA.
nexus_list_customers            ✓  ?  ?  -   có   Đếm hoặc liệt kê khách hàng, lọc theo thành phố.
nexus_get_customer              ✓  ?  ?  -   có   Lấy đầy đủ thông tin 1 khách hàng (email, gói, ngày tạo) theo id dạng 
nexus_get_exchange_rate         ✓  ?  ?  ✓   có   Lấy tỷ giá mới nhất giữa 2 loại tiền (mặc định quy đổi sang VND) từ dị
nexus_chart_customers_by_city   ✓  ?  ?  -   có   Vẽ biểu đồ cột (ảnh PNG) số khách hàng theo từng thành phố, kèm số liệ
nexus_update_customer_tier      -  ✓  ✓  -   có   Đổi gói dịch vụ (free/pro/enterprise) của 1 khách hàng — GHI dữ liệu, 
nexus_delete_customer           -  ✓  ✓  -   có   XÓA VĨNH VIỄN 1 khách hàng theo id.
nexus_generate_report           ✓  ?  ?  -   có   Tạo báo cáo tổng hợp số khách theo thành phố và theo gói (free/pro/ent
```

| Hint | Nghĩa | Mặc định nếu thiếu | Nexus |
|---|---|---|---|
| `readOnlyHint` | Không sửa môi trường | `false` | `true` cho 7 tool đọc |
| `destructiveHint` | Có thể ghi đè / xóa (chỉ có nghĩa khi không read-only) | `true` | `true` cho đổi gói (ghi đè gói cũ) và xóa |
| `idempotentHint` | Gọi lại cùng tham số không thêm hiệu ứng | `false` | `true` cho đổi gói (đặt lại cùng gói → `changed: false`) và xóa (lần 2 → `deleted: false`) |
| `openWorldHint` | Chạm thực thể ngoài hệ thống | `true` | `true` chỉ cho tỷ giá; còn lại `false` |

Host dùng annotation thế nào là chuyện của host: Claude Desktop hỏi xác nhận trước tool không read-only (**chưa chạy ở sandbox**, kiểm trên máy bạn); host Nexus web của bạn (chạy thật) lọc chỉ đưa tool `readOnlyHint: true` cho LLM cho tới khi M11 có thẻ xác nhận trong chat. Spec yêu cầu client coi annotation là **không tin cậy** trừ khi server đáng tin — một server độc có thể khai `readOnlyHint: true` cho tool xóa dữ liệu. Annotation giúp UX, không thay kiểm quyền (M7) hay xác nhận của người dùng (M6, M11).

### Progress và log trong một lần gọi

**Sơ đồ (Trình tự) — Một tool chạy lâu và một tool xóa dữ liệu: những message nào đi qua, host làm gì với chúng?**

```mermaid
sequenceDiagram
    participant U as Người dùng
    participant H as Host + client
    participant S as Nexus server
    H->>S: 1. tools/list
    S-->>H: 2. destructiveHint: true
    H->>U: 3. xác nhận xóa?
    U-->>H: 4. đồng ý
    H->>S: 5. tools/call + progressToken
    S-->>H: 6. notifications/progress ×6
    S-->>H: 7. notifications/message
    S-->>H: 8. result
    Note over H: ✗ timeout client -32001 nếu không reset theo progress
    Note over S: không có token → im lặng
```

**Đọc sơ đồ:** Ba cột, đọc ①→⑧ từ trên xuống. ①–④: host đọc annotation rồi hỏi người dùng trước khi gọi tool destructive. ⑤–⑧: tool chạy lâu gửi progress (chỉ khi có token) và log (theo mức client chọn) trước result. *Màu: đỏ gạch + ✗ + viền đứt = bị chặn/sai · vàng mù tạt + ? + viền chấm = cần xem lại · xanh ô-liu + ✓ = chạy đúng. Nhãn = method JSON-RPC hoặc hành động của host.*


Output thật — `nexus_generate_report` gọi 4 cách (script `lesson-code/m3/progress-demo.ts`):

```console
$ node m3/progress-demo.ts
1) có onprogress
       7 ms  progress 0/5  Đang tổng hợp Hà Nội
     415 ms  progress 1/5  Đang tổng hợp Hải Phòng
     816 ms  progress 2/5  Đang tổng hợp TP.HCM
    1217 ms  progress 3/5  Đang tổng hợp Đà Nẵng
    1618 ms  progress 4/5  Đang tổng hợp Cần Thơ
    2019 ms  progress 5/5  Xong
    2023 ms  result totalCustomers=30
2) không onprogress
    2006 ms  result isError=false (không có dòng progress nào)
3) timeout 1000 ms, resetTimeoutOnProgress=false
    1002 ms  ✗ code -32001: MCP error -32001: Request timed out
3) timeout 1000 ms, resetTimeoutOnProgress=true
    2010 ms  ✓ xong, isError=false
```

Đọc output:

- (1) Client đưa `onprogress` → SDK client tự đặt `_meta.progressToken` → server gửi 6 lần (0/5 … 5/5), mỗi bước ~400 ms.
- (2) Không `onprogress` → không token → không một notification nào, kết quả vẫn đúng. Đây là yêu cầu của C50 Lab 09: “no token, stay silent and carry on”.
- (3) `timeout: 1000` không reset: client **bỏ cuộc** ở 1002 ms với `-32001`, dù server vẫn đang chạy bình thường. Bật `resetTimeoutOnProgress`: mỗi progress gia hạn đồng hồ, xong ở 2010 ms. Progress không chỉ là thanh tiến độ — nó là nhịp tim giữ request sống.

Log qua giao thức (script `lesson-code/m3/logging-demo.ts`):

```console
$ node m3/logging-demo.ts
(chưa setLevel: mặc định của Nexus là info)
   ← [info] {"msg":"customer tier set","id":"cus_001","from":"pro","to":"pro","changed":false}
logging/setLevel warning
   ← [warning] {"msg":"tool failed","tool":"nexus_get_customer","ms":0}
logging/setLevel debug
   ← [warning] {"msg":"tool failed","tool":"nexus_get_customer","ms":0}
   ← [info] {"msg":"customer tier set","id":"cus_001","from":"enterprise","to":"free","changed":true}
   ← [debug] {"msg":"tool ok","tool":"nexus_update_customer_tier","ms":0}
   ← [info] {"msg":"shutting down","reason":"stdin closed"}
```

Chưa `setLevel`: Nexus gửi từ `info` trở lên (không phải mặc định của SDK — xem Bẫy 3). `warning`: chỉ còn “tool failed”. `debug`: thấy cả “tool ok” từ decorator `instrument`. Dòng cuối là log lúc tắt: client đóng stdin → server log `shutting down` trước khi thoát.

### Phần khác C# thật sự

**1. Hai kênh log, hai người đọc.** stderr (JSON 1 dòng) cho người vận hành — Claude Desktop gom vào `mcp-server-nexus.log`, Docker gom vào `docker logs`. `notifications/message` cho **client**: host có thể hiển thị trong UI debug, và dữ liệu đó có thể tới tay người dùng. Không đưa secret, dữ liệu cá nhân, stack trace vào kênh MCP.

**2. Client quyết định mức log, không phải server.** Ngược với `appsettings.json`: server khai capability `logging`, client gửi `logging/setLevel`, server lọc. SDK 1.30 lưu mức theo session nhưng khi chưa có `setLevel` thì gửi hết — Nexus thay handler để tự giữ mức mặc định.

**3. Progress là opt-in của client.** Server không tự quyết định gửi progress. Không token = client không muốn nghe (hoặc không hỗ trợ). Gửi bừa là vi phạm giao thức (Bẫy 1).

**4. Decorator là một hàm.** `instrument(name, log, handler)` nhận handler, trả handler mới cùng chữ ký. Type tham số của handler vẫn được SDK suy từ `inputSchema` qua lớp bọc (generic `A` suy ra từ ngữ cảnh) — không mất type như khi đi qua lớp cha.

### Bẫy dev .NET hay vấp

#### Bẫy 1 — luôn gửi progress, tự bịa token

`IProgress<T>` trong C# thì cứ `Report()` thoải mái. Ở MCP:

`lesson-code/m3/traps/progress-no-token.ts`

```ts
/** Bẫy S3.5: gửi progress dù client KHÔNG xin (không có progressToken) — tự bịa token. */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({ name: "progress-no-token", version: "0.0.0" });
server.registerTool("nexus_generate_report", { description: "Báo cáo" }, async (extra) => {
  for (let i = 1; i <= 3; i++) {
    await extra.sendNotification({ method: "notifications/progress", params: { progressToken: extra._meta?.progressToken ?? "report", progress: i, total: 3 } });
  }
  return { content: [{ type: "text", text: "xong" }] };
});
await server.connect(new StdioServerTransport());
```

```console
$ node m3/traps/progress-no-token-client.ts
client.onerror: Received a progress notification for an unknown token: {"method":"notifications/progress","params":{"progress":1,"total":3,"progressToken":"report"}}
client.onerror: Received a progress notification for an unknown token: {"method":"notifications/progress","params":{"progress":2,"total":3,"progressToken":"report"}}
client.onerror: Received a progress notification for an unknown token: {"method":"notifications/progress","params":{"progress":3,"total":3,"progressToken":"report"}}
result: [{"type":"text","text":"xong"}]
```

Client SDK báo lỗi 3 lần qua `onerror` (host khác có thể đóng kết nối). `progressReporter` của Nexus trả hàm rỗng khi không có token, nên handler gọi `report()` bao nhiêu lần cũng được.

#### Bẫy 2 — quên khai capability `logging`

`lesson-code/m3/traps/no-logging-cap.ts`

```ts
/** Bẫy S3.5: gửi log qua giao thức nhưng quên khai capabilities.logging. */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({ name: "no-logging-cap", version: "0.0.0" }); // thiếu { capabilities: { logging: {} } }
server.registerTool("nexus_ping", { description: "Ping" }, async () => {
  await server.sendLoggingMessage({ level: "warning", data: "ping được gọi" });
  return { content: [{ type: "text", text: "pong" }] };
});
await server.connect(new StdioServerTransport());
```

```console
$ node m3/traps/no-logging-cap-client.ts
server capabilities: {"tools":{"listChanged":true}}
gọi nexus_ping xong, log nhận được: 0
setLoggingLevel: MCP error -32601: Method not found
```

Tệ nhất ở đây là sự im lặng: `sendLoggingMessage` không ném, log biến mất. Chỉ khi client gọi `setLoggingLevel` mới lộ `Method not found`.

#### Bẫy 3 — tin mặc định của SDK về mức log

Khi client chưa gửi `logging/setLevel`, SDK 1.30 không lọc gì: log `debug` (mỗi lần gọi tool 1 dòng “tool ok”) đổ hết về client. Nexus gắn handler `setLevel` riêng trong `mcpLogSink` và giữ mức mặc định `info` (output ở trên: dòng đầu chỉ có `[info]`). Handler đó cũng chặn gửi log **trước** `notifications/initialized` — lúc đầu `nexus mcp-server ready` được gửi trước cả response `initialize`, spec không cho server “nói trước” như vậy.

#### Bẫy 4 — annotation sai vì copy-paste

Copy `get-customer.ts` làm `delete-customer.ts`, quên sửa `readOnlyHint: true`. Không có gì báo lỗi — host tin và **không hỏi xác nhận**, host Nexus web còn đưa luôn tool xóa cho LLM. Smoke của Nexus có luật chặn đúng trường hợp này: tool nào `readOnlyHint: false` mà thiếu `destructiveHint: true` là đỏ; nhưng `readOnlyHint: true` sai thì chỉ review mới bắt được — đọc lại annotation mỗi khi thêm tool ghi.

### Code mẫu & pattern

#### Code production

`apps/mcp-server/src/instrument.ts`

```ts
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Logger } from "./log.ts";
import type { ToolExtra } from "./progress.ts";
import { toolFail } from "./tool-result.ts";

/**
 * Decorator cho handler tool (≈ DelegatingHandler / ActionFilter): đo thời gian, log kết quả,
 * và chặn exception lọt ra ngoài — SDK sẽ gửi nguyên message exception cho LLM nếu ta để nó bay.
 */
export function instrument<A>(
  name: string,
  log: Logger,
  handler: (args: A, extra: ToolExtra) => Promise<CallToolResult>,
): (args: A, extra: ToolExtra) => Promise<CallToolResult> {
  return async (args, extra) => {
    const t0 = performance.now();
    try {
      const res = await handler(args, extra);
      const ms = Math.round(performance.now() - t0);
      if (res.isError) log.warn("tool failed", { tool: name, ms });
      else log.debug("tool ok", { tool: name, ms });
      return res;
    } catch (err) {
      const ms = Math.round(performance.now() - t0);
      log.error("tool crashed", { tool: name, ms, err: err instanceof Error ? (err.stack ?? err.message) : String(err) });
      return toolFail({ what: `Tool ${name} gặp lỗi nội bộ.`, next: "Đừng thử lại ngay với cùng tham số; báo người dùng là hệ thống đang lỗi." });
    }
  };
}
```
`apps/mcp-server/src/progress.ts`

```ts
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { ServerNotification, ServerRequest } from "@modelcontextprotocol/sdk/types.js";

export type ToolExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;
export type ReportProgress = (progress: number, total?: number, message?: string) => Promise<void>;

/**
 * Client chỉ muốn nhận progress khi gửi _meta.progressToken. Không có token → trả hàm rỗng (Null Object):
 * handler gọi report() thoải mái, không cần if, và không gửi notification nào.
 */
export function progressReporter(extra: ToolExtra): ReportProgress {
  const token = extra._meta?.progressToken;
  if (token === undefined) return async () => {};
  let last = Number.NEGATIVE_INFINITY;
  return async (progress, total, message) => {
    if (progress <= last) return; // spec: progress PHẢI tăng dần
    last = progress;
    await extra.sendNotification({
      method: "notifications/progress",
      params: { progressToken: token, progress, ...(total !== undefined && { total }), ...(message !== undefined && { message }) },
    });
  };
}
```
`apps/mcp-server/src/tools/generate-report.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CITIES, TIERS, TOOL, type Tier } from "@nexus/shared";
import { setTimeout as sleep } from "node:timers/promises";
import { z } from "zod";
import type { CustomerRepository } from "../customers/repository.ts";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { progressReporter } from "../progress.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface ReportDeps {
  customers: CustomerRepository;
  log: Logger;
  now: () => Date;
  /** Thời gian mỗi bước. Mô phỏng việc nặng theo từng thành phố (M5 thay bằng aggregation thật). */
  stepMs: number;
}

const Row = z.object({ city: z.string(), total: z.number().int(), free: z.number().int(), pro: z.number().int(), enterprise: z.number().int() });
const ReportOutput = z.object({
  generatedAt: z.string(),
  totalCustomers: z.number().int(),
  rows: z.array(Row).describe("1 dòng / thành phố: tổng và số khách theo từng gói"),
});

export function registerGenerateReport(server: McpServer, deps: ReportDeps): void {
  server.registerTool(
    TOOL.generateReport,
    {
      title: "Báo cáo khách hàng theo thành phố",
      description:
        "Tạo báo cáo tổng hợp số khách theo thành phố và theo gói (free/pro/enterprise). Chạy vài giây, có báo tiến độ. " +
        "Gọi khi người dùng muốn báo cáo/tổng quan; câu hỏi đếm đơn lẻ thì dùng nexus_list_customers.",
      inputSchema: {},
      outputSchema: ReportOutput.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.generateReport, deps.log, async (_args, extra) => {
      const report = progressReporter(extra);
      const rows: z.infer<typeof Row>[] = [];
      for (const [i, city] of CITIES.entries()) {
        if (extra.signal.aborted) {
          deps.log.info("report cancelled", { done: i, of: CITIES.length });
          return toolFail({ what: `Báo cáo bị hủy sau ${i}/${CITIES.length} thành phố.`, next: "Không cần làm gì thêm." });
        }
        await report(i, CITIES.length, `Đang tổng hợp ${city}`);
        const { total, items } = await deps.customers.list({ city, limit: 50 });
        const byTier = Object.fromEntries(TIERS.map((t) => [t, items.filter((c) => c.tier === t).length])) as Record<Tier, number>;
        rows.push({ city, total, ...byTier });
        deps.log.debug("report step", { city, total });
        await sleep(deps.stepMs, undefined, { signal: extra.signal }).catch(() => {});
      }
      await report(CITIES.length, CITIES.length, "Xong");
      return toolOk(ReportOutput, {
        generatedAt: deps.now().toISOString(),
        totalCustomers: rows.reduce((s, r) => s + r.total, 0),
        rows,
      });
    }),
  );
}
```

#### Pattern: Decorator bằng hàm bậc cao (`instrument`)

**Vấn đề:** 9 tool cần cùng một việc quanh handler: đo thời gian, log thành công/thất bại, chặn exception lạ để không lộ ra model. Viết trong từng handler là lặp 9 lần và sẽ có lần quên.

**Tương đương C#:** `DelegatingHandler` (HttpClient pipeline), `IAsyncActionFilter`, hoặc base controller với `OnActionExecuting`/`OnActionExecuted`.

**Dịch thẳng vs kiểu TS:**

`lesson-code/m3/patterns/tool-base.direct.ts`

```ts
/**
 * Dịch thẳng "base controller + OnActionExecuting/OnActionExecuted" (template method):
 * mỗi tool là 1 class kế thừa ToolBase, logging/đo giờ nằm ở lớp cha.
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export abstract class ToolBase<TArgs> {
  abstract readonly name: string;
  protected abstract executeCore(args: TArgs): Promise<CallToolResult>;

  protected onExecuting(args: TArgs): void {
    process.stderr.write(`start ${this.name} ${JSON.stringify(args)}\n`);
  }
  protected onExecuted(ms: number, res: CallToolResult): void {
    process.stderr.write(`done ${this.name} ${ms}ms isError=${res.isError ?? false}\n`);
  }

  async execute(args: TArgs): Promise<CallToolResult> {
    this.onExecuting(args);
    const t0 = performance.now();
    const res = await this.executeCore(args); // exception vẫn bay ra ngoài
    this.onExecuted(Math.round(performance.now() - t0), res);
    return res;
  }
}

export class GetCustomerTool extends ToolBase<{ id: string }> {
  readonly name = "nexus_get_customer";
  protected async executeCore({ id }: { id: string }): Promise<CallToolResult> {
    return { content: [{ type: "text", text: id }] };
  }
}
// Đăng ký: server.registerTool(tool.name, {...}, (args) => tool.execute(args)) — lại phải ép kiểu args ở chỗ đăng ký
```
`apps/mcp-server/src/instrument.ts`

```ts
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Logger } from "./log.ts";
import type { ToolExtra } from "./progress.ts";
import { toolFail } from "./tool-result.ts";

/**
 * Decorator cho handler tool (≈ DelegatingHandler / ActionFilter): đo thời gian, log kết quả,
 * và chặn exception lọt ra ngoài — SDK sẽ gửi nguyên message exception cho LLM nếu ta để nó bay.
 */
export function instrument<A>(
  name: string,
  log: Logger,
  handler: (args: A, extra: ToolExtra) => Promise<CallToolResult>,
): (args: A, extra: ToolExtra) => Promise<CallToolResult> {
  return async (args, extra) => {
    const t0 = performance.now();
    try {
      const res = await handler(args, extra);
      const ms = Math.round(performance.now() - t0);
      if (res.isError) log.warn("tool failed", { tool: name, ms });
      else log.debug("tool ok", { tool: name, ms });
      return res;
    } catch (err) {
      const ms = Math.round(performance.now() - t0);
      log.error("tool crashed", { tool: name, ms, err: err instanceof Error ? (err.stack ?? err.message) : String(err) });
      return toolFail({ what: `Tool ${name} gặp lỗi nội bộ.`, next: "Đừng thử lại ngay với cùng tham số; báo người dùng là hệ thống đang lỗi." });
    }
  };
}
```

- Bản dịch thẳng: `abstract class ToolBase<TArgs>` + template method. Mỗi tool là 1 class; `TArgs` khai tay, không nối với `inputSchema` → lúc đăng ký phải ép kiểu `args`. Exception vẫn bay ra khỏi `execute` (dòng 21). Thêm việc thứ hai (ví dụ tracing ở M8) là thêm hook vào lớp cha, mọi tool đổi theo.
- Bản TS: 1 hàm nhận handler, trả handler mới cùng chữ ký. `A` được suy từ ngữ cảnh `registerTool` → trong handler, `({ id })` vẫn có type `CustomerId`. Ghép nhiều decorator là lồng hàm: `instrument(name, log, withTracing(handler))`. Exception bị chặn ở đúng một chỗ, stack ra stderr, model nhận câu chung.
- Không lớp cha, không `this`, không `protected`.

**Pattern đi kèm — Null Object:** `progressReporter(extra)` trả `async () => {}` khi không có token. Handler gọi `report(i, n, msg)` vô điều kiện; quyết định “có gửi không” nằm ở 1 chỗ. Tương đương `NullLogger.Instance`.

**Khi nào KHÔNG dùng:** đừng chồng 5 decorator cho 3 tool. Việc chỉ 1 tool cần (hủy giữa chừng của báo cáo) viết thẳng trong handler đó. Đừng dùng decorator để **đổi** kết quả nghiệp vụ (ví dụ tự retry) — người đọc handler không thấy.

### Trắc nghiệm S3.5

1. Tool `nexus_archive_old_customers` không khai annotation nào. Host đọc được gì?
   - A. Không có thông tin, host coi là an toàn
   - B. Theo mặc định của spec: không read-only, có thể destructive, không idempotent, open-world — tức là trường hợp nguy hiểm nhất
   - C. SDK tự suy annotation từ tên tool

   <details><summary>Đáp án</summary>

   **B.** Mặc định `readOnlyHint: false`, `destructiveHint: true`, `idempotentHint: false`, `openWorldHint: true`. Khai tường minh cho mọi tool.

   </details>

2. Client gọi `nexus_generate_report` với `timeout: 1000` và không bật `resetTimeoutOnProgress`. Server gửi progress mỗi 400 ms, xong ở ~2 s. Theo output thật?
   - A. Thành công ở ~2 s vì server có gửi progress
   - B. Client ném `-32001 Request timed out` ở ~1002 ms; server vẫn chạy tiếp
   - C. Server tự hủy sau 1 s

   <details><summary>Đáp án</summary>

   **B.** Timeout là của client. Progress chỉ gia hạn khi client bật `resetTimeoutOnProgress` — khi bật, lời gọi xong ở 2010 ms.

   </details>

3. Client đặt `logging/setLevel` = `warning`. Server log `info` “customer tier set”. Client nhận không?
   - A. Không — `info` thấp hơn `warning` nên bị lọc
   - B. Có, server luôn gửi mọi log
   - C. Có, nhưng đổi mức thành `warning`

   <details><summary>Đáp án</summary>

   **A.** Thứ tự: debug < info < notice < warning < error < critical < alert < emergency. Output thật: sau `setLevel warning` chỉ còn dòng `[warning] tool failed`.

   </details>


---

## S3.5 · Cheat Sheet

### Annotation — 4 câu hỏi cho mỗi tool

| Câu hỏi | Có → | Mặc định nếu không khai |
|---|---|---|
| Tool có sửa gì không? | `readOnlyHint: false` | `false` (coi như có sửa) |
| Có ghi đè / xóa được không? | `destructiveHint: true` | `true` |
| Gọi lại cùng tham số có thêm hiệu ứng? | Không → `idempotentHint: true` | `false` |
| Chạm hệ thống ngoài? | `openWorldHint: true` | `true` |

### Khung 1 tool đủ 5 lớp

`lesson-code/m3/tool-template.ts`

```ts
/**
 * Khung 1 tool Nexus đủ 5 lớp (tên · input · output/lỗi · phụ thuộc · tín hiệu cho host).
 * Copy file này, đổi tên/schema/handler. Compile sạch với tsconfig của repo.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Logger } from "../../nexus/apps/mcp-server/src/log.ts";
import { instrument } from "../../nexus/apps/mcp-server/src/instrument.ts";
import { progressReporter } from "../../nexus/apps/mcp-server/src/progress.ts";
import { toolFail, toolOk } from "../../nexus/apps/mcp-server/src/tool-result.ts";

// 1. Tên: nexus_<động từ>_<danh từ> (thật: thêm vào TOOL trong packages/shared)
const NAME = "nexus_count_orders";

// 2. Input: luật kiểm được bằng giá trị → schema, có .describe()
const Input = z.object({
  city: z.string().trim().min(1).max(60).describe("Thành phố, ví dụ 'Hà Nội'."),
  days: z.number().int().min(1).max(90).default(30).describe("Số ngày gần nhất (1–90)."),
});

// 3. Output: máy đọc được
const Output = z.object({ city: z.string(), days: z.number().int(), total: z.number().int() });

// 4. Phụ thuộc: tiêm qua deps, không import singleton
export interface CountOrdersDeps {
  countOrders: (city: string, since: Date, signal: AbortSignal) => Promise<number | undefined>;
  log: Logger;
  now: () => Date;
}

export function registerCountOrders(server: McpServer, deps: CountOrdersDeps): void {
  server.registerTool(
    NAME,
    {
      title: "Đếm đơn hàng",
      description:
        "Đếm đơn hàng của 1 thành phố trong N ngày gần nhất. Gọi khi người dùng hỏi 'bao nhiêu đơn'. " +
        "Không liệt kê từng đơn. Kết quả: đọc 'total'.",
      inputSchema: Input.shape,
      outputSchema: Output.shape,
      // 5. Tín hiệu cho host: khai tường minh cả 4
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    instrument(NAME, deps.log, async ({ city, days }, extra) => {
      const report = progressReporter(extra);
      await report(0, 1, `Đang đếm đơn ở ${city}`);
      const since = new Date(deps.now().getTime() - days * 86_400_000);
      const total = await deps.countOrders(city, since, extra.signal);
      if (total === undefined) {
        return toolFail({ what: `Không có dữ liệu đơn hàng cho '${city}'.`, next: "Gọi nexus_list_customers để xem các thành phố có dữ liệu." });
      }
      await report(1, 1, "Xong");
      return toolOk(Output, { city, days, total });
    }),
  );
}
```

### Logging

| Việc | Code |
|---|---|
| Bật capability | `new McpServer(info, { capabilities: { logging: {} } })` |
| Gửi | `server.sendLoggingMessage({ level: "warning", logger: "nexus", data })` |
| Client đổi mức | `client.setLoggingLevel("warning")` |
| Thứ tự mức | debug < info < notice < warning < error < critical < alert < emergency |
| Không bao giờ | `console.log` trong server stdio |

### Phía client (tham khảo — M6 đào sâu)

| Option của `callTool` | Tác dụng |
|---|---|
| `onprogress` | SDK tự gửi `progressToken`, gọi callback mỗi notification |
| `timeout` | Mặc định 60 000 ms → `-32001` |
| `resetTimeoutOnProgress` | Mỗi progress đặt lại đồng hồ timeout |
| `signal` | Hủy → SDK gửi `notifications/cancelled` → server thấy `extra.signal.aborted` |

### Pattern của session

| Pattern | Session | Tương đương C# / .NET | Dùng khi |
|---|---|---|---|
| Decorator bằng hàm bậc cao (`instrument`) | S3.5 | `DelegatingHandler`, `IAsyncActionFilter` | Đo giờ, log, chặn exception cho mọi tool mà không cần lớp cha |
| Null Object (`progressReporter` khi không có token) | S3.5 | `NullLogger.Instance` | Tính năng client có thể không xin: trả hàm rỗng thay vì `if` rải khắp handler |



---

## S3.5 · Code

### Cây thư mục

```txt
nexus/
├─ apps/mcp-server/src/
│  ├─ index.ts                    logger 2 sink, gắn MCP sink trước connect
│  ├─ server.ts                   capabilities.logging
│  ├─ log.ts · progress.ts · instrument.ts
│  └─ tools/generate-report.ts · update-customer-tier.ts · delete-customer.ts
├─ apps/mcp-server/scripts/smoke.ts   luật prefix / outputSchema / destructiveHint, đếm progress
└─ apps/web/lib/mcp/host.ts           lọc tool theo readOnlyHint
lesson-code/m3/
├─ progress-demo.ts · logging-demo.ts
├─ traps/progress-no-token.ts · progress-no-token-client.ts · no-logging-cap.ts · no-logging-cap-client.ts
└─ patterns/tool-base.direct.ts
```

### apps/mcp-server/src

`apps/mcp-server/src/index.ts`

```ts
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadEnv } from "./env.ts";
import { createLogger, mcpLogSink, stderrSink } from "./log.ts";
import { openDataSource, type DataSource } from "./db.ts";
import { createRatesClient } from "./rates/client.ts";
import { createServer } from "./server.ts";

const env = loadEnv();
const log = createLogger(stderrSink(env.LOG_LEVEL));

let data: DataSource;
try {
  data = await openDataSource(env, log);
} catch (err) {
  log.error("không mở được data source", { err: String(err) });
  process.exit(1);
}

const rates = createRatesClient({ baseUrl: env.RATES_API_URL, timeoutMs: env.RATES_TIMEOUT_MS });
const server = createServer({ customers: data.customers, rates, log, now: () => new Date() });
// Gắn sink MCP TRƯỚC connect: handler logging/setLevel phải có sẵn khi client gửi tới
log.attach(mcpLogSink(server));
await server.connect(new StdioServerTransport());
log.info("nexus mcp-server ready", { transport: "stdio" });

let closing = false;
async function shutdown(reason: string): Promise<void> {
  if (closing) return;
  closing = true;
  log.info("shutting down", { reason });
  await server.close().catch(() => {});
  await data.close().catch(() => {});
  process.exit(0);
}
process.stdin.on("end", () => void shutdown("stdin closed"));
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
```
`apps/mcp-server/src/log.ts`

```ts
/**
 * Logger 2 đích:
 *  - stderr: JSON 1 dòng cho người vận hành (Claude Desktop gom vào mcp-server-nexus.log).
 *  - MCP client: notifications/message, lọc theo mức client đặt bằng logging/setLevel.
 * stdout là kênh JSON-RPC — KHÔNG sink nào được ghi vào đó.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LoggingLevelSchema, SetLevelRequestSchema, type LoggingLevel } from "@modelcontextprotocol/sdk/types.js";

export type Level = "debug" | "info" | "warn" | "error";
export type LogData = Record<string, unknown>;
export type LogSink = (level: Level, msg: string, data?: LogData) => void;

export interface Logger {
  debug(msg: string, data?: LogData): void;
  info(msg: string, data?: LogData): void;
  warn(msg: string, data?: LogData): void;
  error(msg: string, data?: LogData): void;
}

const RANK: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export function stderrSink(min: Level = "info", out: NodeJS.WritableStream = process.stderr): LogSink {
  return (level, msg, data) => {
    if (RANK[level] < RANK[min]) return;
    out.write(JSON.stringify({ t: new Date().toISOString(), level, msg, ...data }) + "\n");
  };
}

/** MCP có 8 mức (syslog); Nexus dùng 4 — warn ↔ "warning". */
const TO_MCP: Record<Level, LoggingLevel> = { debug: "debug", info: "info", warn: "warning", error: "error" };

/** debug < info < notice < warning < error < critical < alert < emergency */
const SEVERITY: readonly LoggingLevel[] = LoggingLevelSchema.options;

/**
 * Gửi log cho client qua giao thức (notifications/message). Cần capabilities.logging khi tạo server.
 * Tự giữ mức tối thiểu: client gửi logging/setLevel thì theo client; chưa gửi thì dùng defaultLevel
 * (SDK mặc định gửi TẤT CẢ, kể cả debug, khi client chưa chọn mức). stdio = 1 client; HTTP nhiều session là M7.
 */
export function mcpLogSink(server: McpServer, opts: { logger?: string; defaultLevel?: LoggingLevel } = {}): LogSink {
  const logger = opts.logger ?? "nexus";
  let min: LoggingLevel = opts.defaultLevel ?? "info";
  // Không gửi gì trước khi bắt tay xong (notifications/initialized) — spec cấm server "nói trước"
  let initialized = false;
  const prev = server.server.oninitialized;
  server.server.oninitialized = () => {
    initialized = true;
    prev?.();
  };
  server.server.setRequestHandler(SetLevelRequestSchema, async (req) => {
    min = req.params.level;
    return {};
  });
  return (level, msg, data) => {
    const l = TO_MCP[level];
    if (!initialized || SEVERITY.indexOf(l) < SEVERITY.indexOf(min)) return;
    server.sendLoggingMessage({ level: l, logger, data: { msg, ...data } }).catch(() => {});
  };
}

export function createLogger(...initial: LogSink[]): Logger & { attach(sink: LogSink): void } {
  const sinks = [...initial];
  const emit = (level: Level) => (msg: string, data?: LogData) => {
    for (const sink of sinks) sink(level, msg, data);
  };
  return {
    debug: emit("debug"),
    info: emit("info"),
    warn: emit("warn"),
    error: emit("error"),
    attach: (sink) => void sinks.push(sink),
  };
}
```
`apps/mcp-server/src/progress.ts`

```ts
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { ServerNotification, ServerRequest } from "@modelcontextprotocol/sdk/types.js";

export type ToolExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;
export type ReportProgress = (progress: number, total?: number, message?: string) => Promise<void>;

/**
 * Client chỉ muốn nhận progress khi gửi _meta.progressToken. Không có token → trả hàm rỗng (Null Object):
 * handler gọi report() thoải mái, không cần if, và không gửi notification nào.
 */
export function progressReporter(extra: ToolExtra): ReportProgress {
  const token = extra._meta?.progressToken;
  if (token === undefined) return async () => {};
  let last = Number.NEGATIVE_INFINITY;
  return async (progress, total, message) => {
    if (progress <= last) return; // spec: progress PHẢI tăng dần
    last = progress;
    await extra.sendNotification({
      method: "notifications/progress",
      params: { progressToken: token, progress, ...(total !== undefined && { total }), ...(message !== undefined && { message }) },
    });
  };
}
```
`apps/mcp-server/src/instrument.ts`

```ts
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Logger } from "./log.ts";
import type { ToolExtra } from "./progress.ts";
import { toolFail } from "./tool-result.ts";

/**
 * Decorator cho handler tool (≈ DelegatingHandler / ActionFilter): đo thời gian, log kết quả,
 * và chặn exception lọt ra ngoài — SDK sẽ gửi nguyên message exception cho LLM nếu ta để nó bay.
 */
export function instrument<A>(
  name: string,
  log: Logger,
  handler: (args: A, extra: ToolExtra) => Promise<CallToolResult>,
): (args: A, extra: ToolExtra) => Promise<CallToolResult> {
  return async (args, extra) => {
    const t0 = performance.now();
    try {
      const res = await handler(args, extra);
      const ms = Math.round(performance.now() - t0);
      if (res.isError) log.warn("tool failed", { tool: name, ms });
      else log.debug("tool ok", { tool: name, ms });
      return res;
    } catch (err) {
      const ms = Math.round(performance.now() - t0);
      log.error("tool crashed", { tool: name, ms, err: err instanceof Error ? (err.stack ?? err.message) : String(err) });
      return toolFail({ what: `Tool ${name} gặp lỗi nội bộ.`, next: "Đừng thử lại ngay với cùng tham số; báo người dùng là hệ thống đang lỗi." });
    }
  };
}
```

### apps/mcp-server/src/tools

`apps/mcp-server/src/tools/generate-report.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CITIES, TIERS, TOOL, type Tier } from "@nexus/shared";
import { setTimeout as sleep } from "node:timers/promises";
import { z } from "zod";
import type { CustomerRepository } from "../customers/repository.ts";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { progressReporter } from "../progress.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface ReportDeps {
  customers: CustomerRepository;
  log: Logger;
  now: () => Date;
  /** Thời gian mỗi bước. Mô phỏng việc nặng theo từng thành phố (M5 thay bằng aggregation thật). */
  stepMs: number;
}

const Row = z.object({ city: z.string(), total: z.number().int(), free: z.number().int(), pro: z.number().int(), enterprise: z.number().int() });
const ReportOutput = z.object({
  generatedAt: z.string(),
  totalCustomers: z.number().int(),
  rows: z.array(Row).describe("1 dòng / thành phố: tổng và số khách theo từng gói"),
});

export function registerGenerateReport(server: McpServer, deps: ReportDeps): void {
  server.registerTool(
    TOOL.generateReport,
    {
      title: "Báo cáo khách hàng theo thành phố",
      description:
        "Tạo báo cáo tổng hợp số khách theo thành phố và theo gói (free/pro/enterprise). Chạy vài giây, có báo tiến độ. " +
        "Gọi khi người dùng muốn báo cáo/tổng quan; câu hỏi đếm đơn lẻ thì dùng nexus_list_customers.",
      inputSchema: {},
      outputSchema: ReportOutput.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.generateReport, deps.log, async (_args, extra) => {
      const report = progressReporter(extra);
      const rows: z.infer<typeof Row>[] = [];
      for (const [i, city] of CITIES.entries()) {
        if (extra.signal.aborted) {
          deps.log.info("report cancelled", { done: i, of: CITIES.length });
          return toolFail({ what: `Báo cáo bị hủy sau ${i}/${CITIES.length} thành phố.`, next: "Không cần làm gì thêm." });
        }
        await report(i, CITIES.length, `Đang tổng hợp ${city}`);
        const { total, items } = await deps.customers.list({ city, limit: 50 });
        const byTier = Object.fromEntries(TIERS.map((t) => [t, items.filter((c) => c.tier === t).length])) as Record<Tier, number>;
        rows.push({ city, total, ...byTier });
        deps.log.debug("report step", { city, total });
        await sleep(deps.stepMs, undefined, { signal: extra.signal }).catch(() => {});
      }
      await report(CITIES.length, CITIES.length, "Xong");
      return toolOk(ReportOutput, {
        generatedAt: deps.now().toISOString(),
        totalCustomers: rows.reduce((s, r) => s + r.total, 0),
        rows,
      });
    }),
  );
}
```
`apps/mcp-server/src/tools/update-customer-tier.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL, UpdateCustomerTierInputSchema, UpdateCustomerTierOutputSchema } from "@nexus/shared";
import type { CustomerRepository } from "../customers/repository.ts";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface UpdateTierDeps {
  customers: CustomerRepository;
  log: Logger;
}

export function registerUpdateCustomerTier(server: McpServer, deps: UpdateTierDeps): void {
  server.registerTool(
    TOOL.updateCustomerTier,
    {
      title: "Đổi gói khách hàng",
      description:
        "Đổi gói dịch vụ (free/pro/enterprise) của 1 khách hàng — GHI dữ liệu, ghi đè gói cũ. " +
        "Chỉ gọi khi người dùng yêu cầu rõ ràng việc đổi gói cho đúng khách đó.",
      inputSchema: UpdateCustomerTierInputSchema.shape,
      outputSchema: UpdateCustomerTierOutputSchema.shape,
      // Ghi đè giá trị cũ (không khôi phục được nếu không nhớ gói cũ) → destructive. Đặt lại cùng gói → idempotent.
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    instrument(TOOL.updateCustomerTier, deps.log, async ({ id, tier }) => {
      const change = await deps.customers.updateTier(id, tier);
      if (!change) {
        return toolFail({ what: `Không có khách hàng nào với id '${id}', chưa đổi gì.`, next: `Gọi ${TOOL.listCustomers} để lấy id đúng.` });
      }
      deps.log.info("customer tier set", { id, from: change.previousTier, to: change.tier, changed: change.changed });
      return toolOk(UpdateCustomerTierOutputSchema, { id, ...change });
    }),
  );
}
```
`apps/mcp-server/src/tools/delete-customer.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DeleteCustomerInputSchema, DeleteCustomerOutputSchema, TOOL } from "@nexus/shared";
import type { CustomerRepository } from "../customers/repository.ts";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { toolOk } from "../tool-result.ts";

export interface DeleteCustomerDeps {
  customers: CustomerRepository;
  log: Logger;
}

export function registerDeleteCustomer(server: McpServer, deps: DeleteCustomerDeps): void {
  server.registerTool(
    TOOL.deleteCustomer,
    {
      title: "Xóa khách hàng",
      description:
        "XÓA VĨNH VIỄN 1 khách hàng theo id. Không hoàn tác được. " +
        "Chỉ gọi khi người dùng yêu cầu xóa đúng khách đó và đã xác nhận; không bao giờ gọi để 'dọn dẹp' tự phát.",
      inputSchema: DeleteCustomerInputSchema.shape,
      outputSchema: DeleteCustomerOutputSchema.shape,
      // Xóa 2 lần = xóa 1 lần (lần 2 deleted=false) → idempotent, nhưng vẫn destructive.
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    instrument(TOOL.deleteCustomer, deps.log, async ({ id }) => {
      const deleted = await deps.customers.delete(id);
      deps.log.warn("customer delete", { id, deleted });
      return toolOk(DeleteCustomerOutputSchema, { id, deleted });
    }),
  );
}
```

### smoke + host

`apps/mcp-server/scripts/smoke.ts`

```ts
/**
 * Smoke test qua MCP client THẬT của SDK: spawn server bằng stdio, liệt kê tool, gọi từng tool, so với kỳ vọng.
 *   node scripts/smoke.ts      (NEXUS_DATA=memory + rates-stub tự bật — không cần Mongo, không cần mạng)
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { TOOL } from "@nexus/shared";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const stub = spawn(process.execPath, [here("./rates-stub.ts"), "4011"], { stdio: ["ignore", "ignore", "pipe"] });
await once(stub.stderr, "data");

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [here("../src/index.ts")],
  env: { NEXUS_DATA: "memory", LOG_LEVEL: "warn", RATES_API_URL: "http://127.0.0.1:4011/ok/v6", PATH: process.env["PATH"] ?? "" },
  stderr: "ignore",
});
const client = new Client({ name: "nexus-smoke", version: "0.0.0" });
await client.connect(transport);

const { tools } = await client.listTools();
console.log(`tools (${tools.length}): ${tools.map((t) => t.name).join(", ")}`);
const unprefixed = tools.filter((t) => !t.name.startsWith("nexus_"));
const noOutput = tools.filter((t) => !t.outputSchema);
const writeNotDestructive = tools.filter((t) => t.annotations?.readOnlyHint === false && t.annotations.destructiveHint !== true);

type Expect = "ok" | "isError";
const calls: Array<[string, Record<string, unknown>, Expect]> = [
  [TOOL.ping, {}, "ok"],
  [TOOL.getTime, { timeZone: "Hanoi" }, "isError"],
  [TOOL.listCustomers, { city: "ha noi", limit: 2 }, "ok"],
  [TOOL.listCustomers, { limit: 500 }, "isError"],
  [TOOL.getCustomer, { id: "cus_007" }, "ok"],
  [TOOL.getCustomer, { id: "007" }, "isError"],
  [TOOL.getCustomer, { id: "cus_999" }, "isError"],
  [TOOL.getExchangeRate, { base: "usd" }, "ok"],
  [TOOL.getExchangeRate, { base: "XYZ" }, "isError"],
  [TOOL.chartCustomersByCity, {}, "ok"],
  [TOOL.updateCustomerTier, { id: "cus_003", tier: "pro" }, "ok"],
  [TOOL.deleteCustomer, { id: "cus_030" }, "ok"],
  [TOOL.deleteCustomer, { id: "cus_030" }, "ok"],
];
let failed = 0;
for (const [name, args, expect] of calls) {
  const res = await client.callTool({ name, arguments: args });
  const parts = Array.isArray(res.content) ? res.content.map((c) => (c.type === "text" ? c.text : `[${c.type} ${c.type === "image" ? c.mimeType : ""}]`)) : [];
  const got: Expect = res.isError ? "isError" : "ok";
  if (got !== expect) failed++;
  console.log(`${got === expect ? "✓" : "✗"} ${res.isError ? "[isError] " : ""}${name} ${JSON.stringify(args)} → ${parts.join(" ").slice(0, 150)}`);
}

let progressEvents = 0;
const report = await client.callTool({ name: TOOL.generateReport, arguments: {} }, undefined, { onprogress: () => void progressEvents++ });
const reportOk = !report.isError && progressEvents === 6;
if (!reportOk) failed++;
console.log(`${reportOk ? "✓" : "✗"} ${TOOL.generateReport} → progress events: ${progressEvents}`);

await client.close();
stub.kill();
const rules: Array<[string, unknown[]]> = [["tool thiếu prefix nexus_", unprefixed], ["tool thiếu outputSchema", noOutput], ["tool ghi thiếu destructiveHint", writeNotDestructive]];
for (const [label, list] of rules) {
  if (list.length) { failed++; console.log(`✗ ${label}: ${list.length}`); }
}
if (failed) {
  console.log(`✗ smoke: ${failed} kiểm tra không đạt`);
  process.exit(1);
}
console.log(`✓ smoke OK — ${calls.length + 1} lần gọi, quy ước tên/outputSchema/annotation đạt`);
```
`apps/web/lib/mcp/host.ts`

```ts
import "server-only";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { serverEnv } from "../env.server.ts";
import type { ToolSpec } from "../llm/types.ts";

interface McpHost {
  client: Client;
  tools: ToolSpec[];
}

/** Singleton trên globalThis: next dev nạp lại module khi sửa file — biến module sẽ spawn thêm process con. */
const g = globalThis as typeof globalThis & { __nexusMcp?: Promise<McpHost> };

async function connect(): Promise<McpHost> {
  const env = serverEnv();
  // Least privilege: process con chỉ nhận đúng biến nó cần, KHÔNG có ANTHROPIC_API_KEY
  const childEnv: Record<string, string> = { PATH: process.env["PATH"] ?? "", NEXUS_DATA: env.NEXUS_DATA };
  if (env.MONGODB_URI) childEnv["MONGODB_URI"] = env.MONGODB_URI;
  const transport = new StdioClientTransport({ command: process.execPath, args: [env.MCP_SERVER_ENTRY], env: childEnv, stderr: "inherit" });
  const client = new Client({ name: "nexus-web", version: "0.2.0" });
  await client.connect(transport);
  const { tools } = await client.listTools();
  transport.onclose = () => { delete g.__nexusMcp; };
  // Host đọc annotation: tới khi có thẻ xác nhận trong chat (M11), chỉ đưa tool CHỈ-ĐỌC cho LLM.
  // Annotation là gợi ý từ server — host chỉ tin annotation của server mình kiểm soát.
  const exposed = tools.filter((t) => t.annotations?.readOnlyHint === true);
  return {
    client,
    tools: exposed.map((t) => ({ name: t.name, description: t.description ?? "", inputSchema: t.inputSchema as Record<string, unknown> })),
  };
}

export function mcpHost(): Promise<McpHost> {
  g.__nexusMcp ??= connect().catch((err: unknown) => { delete g.__nexusMcp; throw err; });
  return g.__nexusMcp;
}

export async function callMcpTool(name: string, input: Record<string, unknown>, signal: AbortSignal): Promise<{ content: string; isError: boolean }> {
  const { client } = await mcpHost();
  const res = await client.callTool({ name, arguments: input }, undefined, { signal });
  const content = Array.isArray(res.content) ? res.content.map((c) => (c.type === "text" ? c.text : `[${c.type}]`)).join("\n") : "";
  return { content, isError: Boolean(res.isError) };
}
```

### lesson-code

`lesson-code/m3/progress-demo.ts`

```ts
/**
 * nexus_generate_report với 3 cách gọi:
 *  1. có onprogress (SDK tự gửi _meta.progressToken) → in từng notifications/progress
 *  2. không onprogress → không có token → server im lặng
 *  3. timeout 1 s: không reset (hết giờ) vs resetTimeoutOnProgress (sống nhờ progress)
 */
import { McpError } from "@modelcontextprotocol/sdk/types.js";
import { connectNexus } from "./connect.ts";

const client = await connectNexus();
await client.listTools();
const name = "nexus_generate_report";

console.log("1) có onprogress");
let t0 = performance.now();
const ms = () => String(Math.round(performance.now() - t0)).padStart(5) + " ms";
let res = await client.callTool({ name, arguments: {} }, undefined, {
  onprogress: (p) => console.log(`   ${ms()}  progress ${p.progress}/${p.total ?? "?"}  ${p.message ?? ""}`),
});
console.log(`   ${ms()}  result totalCustomers=${(res.structuredContent as { totalCustomers: number }).totalCustomers}`);

console.log("2) không onprogress");
t0 = performance.now();
res = await client.callTool({ name, arguments: {} });
console.log(`   ${ms()}  result isError=${res.isError ?? false} (không có dòng progress nào)`);

for (const reset of [false, true]) {
  console.log(`3) timeout 1000 ms, resetTimeoutOnProgress=${reset}`);
  t0 = performance.now();
  try {
    res = await client.callTool({ name, arguments: {} }, undefined, { timeout: 1_000, resetTimeoutOnProgress: reset, onprogress: () => {} });
    console.log(`   ${ms()}  ✓ xong, isError=${res.isError ?? false}`);
  } catch (err) {
    console.log(`   ${ms()}  ✗ ${err instanceof McpError ? `code ${err.code}: ` : ""}${err instanceof Error ? err.message : String(err)}`);
  }
}
await client.close();
```
`lesson-code/m3/logging-demo.ts`

```ts
/** Client nhận log của server qua notifications/message, đổi mức bằng logging/setLevel. */
import { LoggingMessageNotificationSchema } from "@modelcontextprotocol/sdk/types.js";
import { connectNexus } from "./connect.ts";

const client = await connectNexus();
client.setNotificationHandler(LoggingMessageNotificationSchema, (n) => {
  console.log(`   ← [${n.params.level}] ${JSON.stringify(n.params.data)}`);
});
await client.listTools();

const run = async (level: "warning" | "debug", tier: "enterprise" | "free") => {
  console.log(`logging/setLevel ${level}`);
  await client.setLoggingLevel(level);
  await client.callTool({ name: "nexus_get_customer", arguments: { id: "cus_999" } });
  await client.callTool({ name: "nexus_update_customer_tier", arguments: { id: "cus_001", tier } });
  await client.callTool({ name: "nexus_ping", arguments: {} });
  await new Promise((r) => setTimeout(r, 50)); // đợi notification cuối về
};
console.log("(chưa setLevel: mặc định của Nexus là info)");
await client.callTool({ name: "nexus_update_customer_tier", arguments: { id: "cus_001", tier: "pro" } });
await new Promise((r) => setTimeout(r, 50));
await run("warning", "enterprise");
await run("debug", "free");
await client.close();
```
`lesson-code/m3/traps/progress-no-token-client.ts`

```ts
import { connectNexus } from "../connect.ts";

const client = await connectNexus({}, new URL("./progress-no-token.ts", import.meta.url).pathname);
client.onerror = (err) => console.log(`client.onerror: ${err.message}`);
const res = await client.callTool({ name: "nexus_generate_report", arguments: {} });
console.log(`result: ${JSON.stringify(res.content)}`);
await new Promise((r) => setTimeout(r, 50));
await client.close();
```
`lesson-code/m3/traps/no-logging-cap-client.ts`

```ts
import { LoggingMessageNotificationSchema } from "@modelcontextprotocol/sdk/types.js";
import { connectNexus } from "../connect.ts";

const client = await connectNexus({}, new URL("./no-logging-cap.ts", import.meta.url).pathname);
let logs = 0;
client.setNotificationHandler(LoggingMessageNotificationSchema, () => void logs++);
console.log(`server capabilities: ${JSON.stringify(client.getServerCapabilities())}`);
await client.callTool({ name: "nexus_ping", arguments: {} });
console.log(`gọi nexus_ping xong, log nhận được: ${logs}`);
try {
  await client.setLoggingLevel("debug");
} catch (err) {
  console.log(`setLoggingLevel: ${err instanceof Error ? err.message : String(err)}`);
}
await client.close();
```

---

## Kiểm tra cuối — Module 3

Hai phần: trắc nghiệm chấm theo session (qua khi **mọi** session ≥ 80%), và thực hành trên repo Nexus của bạn. Câu hỏi khác với 3 câu cuối mỗi session.

### Trắc nghiệm S3.1 — Tên tool

1. Tên nào hợp lệ theo SEP-986, SDK 1.30 đăng ký **không** cảnh báo?
   - A. `nexus list customers`
   - B. `nexus/list_customers`
   - C. `nexus.customers-list`
   - D. `nexus_khách_hàng`

   <details><summary>Đáp án</summary>

   **C.** Ký tự cho phép: `A-Z a-z 0-9 _ - .`, 1–128 ký tự. `nexus.customers-list` hợp lệ (dù không theo quy ước `snake_case` + động từ đứng đầu của Nexus). Dấu cách, `/` và chữ có dấu đều bị cảnh báo.

   </details>

2. Vì sao `TOOL` đặt ở `packages/shared` thay vì trong `apps/mcp-server`?
   - A. Để server khởi động nhanh hơn
   - B. Vì host (`apps/web`) và test cũng gọi tool theo tên — một nguồn cho cả server lẫn nơi gọi
   - C. Vì Zod bắt buộc
   - D. Vì `as const` chỉ chạy trong package riêng

   <details><summary>Đáp án</summary>

   **B.** Tên tool là hợp đồng giữa server và host. Web import `TOOL.listCustomers`, đổi tên ở 1 chỗ thì tsc chỉ ra mọi nơi bị ảnh hưởng.

   </details>

3. `instructions` trong `new McpServer(info, { instructions })` là gì, và điều cần nhớ?
   - A. Hướng dẫn chung cho cả bộ tool, gửi trong `initialize`; nhiều host đưa vào system prompt nhưng host khác bỏ qua — đừng để thông tin quan trọng chỉ nằm ở đó
   - B. Tài liệu cho lập trình viên, model không bao giờ thấy
   - C. Bắt buộc, thiếu thì client từ chối kết nối
   - D. Thay thế được description của từng tool

   <details><summary>Đáp án</summary>

   **A.** Output JSON-RPC thô ở S3.3 có trường `instructions` trong kết quả `initialize`. Nó bổ sung, không thay description.

   </details>

4. Bạn đổi `list_customers` thành `nexus_list_customers`. Chuyện gì xảy ra với host cũ còn gọi tên cũ (SDK 1.30)?
   - A. Server tự chuyển sang tên mới
   - B. JSON-RPC error -32601 Method not found
   - C. Result `isError` với text `MCP error -32602: Tool list_customers not found`
   - D. Server crash

   <details><summary>Đáp án</summary>

   **C.** Output thật ở S3.1. Tên tool là API công khai — đổi tên là breaking change, cập nhật mọi nơi gọi cùng lúc.

   </details>

### Trắc nghiệm S3.2 — Validate input

1. `limit: z.number().int().min(1).max(50).default(20)`. Model gọi không kèm `limit`. Handler nhận gì?
   - A. `limit = 20`, type `number` (không `undefined`)
   - B. `limit = undefined`, phải tự gán mặc định
   - C. Lỗi validate vì thiếu `limit`
   - D. `limit = 50`

   <details><summary>Đáp án</summary>

   **A.** SDK parse bằng schema trước khi gọi handler, nên `.default()` đã được áp. JSON Schema cũng công bố `"default": 20` cho model.

   </details>

2. Tool `nexus_find_customer_by_email`. Luật nào đặt trong **handler**?
   - A. Email đúng định dạng
   - B. Email dài không quá 254 ký tự
   - C. Email chưa có khách nào dùng → trả `isError` kèm gợi ý
   - D. Email không được rỗng

   <details><summary>Đáp án</summary>

   **C.** Ba luật đầu kiểm được chỉ bằng chuỗi email → schema (`z.email().max(254)`). “Có trong dữ liệu không” cần DB → handler.

   </details>

3. Luật định dạng id viết trong handler (`if (!/^cus_/.test(id)) return isError`) thay vì `regex()` trong schema. Hậu quả chính?
   - A. Code chậm hơn
   - B. JSON Schema gửi model không có `pattern` — model không biết luật, đoán id rồi mới bị từ chối
   - C. SDK không cho trả `isError` từ handler
   - D. tsc báo lỗi

   <details><summary>Đáp án</summary>

   **B.** Output thật ở S3.2: bản validate-trong-handler chỉ có `{"type":"string"}`. Mỗi lần đoán sai là 1 vòng LLM.

   </details>

4. Host gửi `"city": null` cho field `.optional()`. Phương án nào **không** nên làm?
   - A. Giữ nguyên: message `expected string, received null at city` đủ để model gọi lại
   - B. Đổi sang `.nullish()` và xử lý `null` như vắng mặt
   - C. `z.preprocess` âm thầm đổi `null` thành `undefined` mà không đổi JSON Schema
   - D. Ghi log để đo host nào hay gửi `null`

   <details><summary>Đáp án</summary>

   **C.** Biến đổi ẩn không hiện trong JSON Schema — hợp đồng công bố và hành vi thật lệch nhau. Hai phương án đầu đều minh bạch.

   </details>

### Trắc nghiệm S3.3 — Output & lỗi

1. Vì sao `toolOk` vẫn đưa bản text JSON vào `content` khi đã có `structuredContent`?
   - A. Spec bắt buộc 2 bản phải giống hệt
   - B. Nhiều host/client chỉ đọc `content` để đưa cho model; thiếu text thì model thấy kết quả rỗng
   - C. Để tăng tốc parse
   - D. Vì `structuredContent` chỉ nhận string

   <details><summary>Đáp án</summary>

   **B.** `structuredContent` cho máy (client tự validate theo `outputSchema`); `content` cho model qua host. Giữ cả hai.

   </details>

2. Một server **không** dùng SDK trả `structuredContent` lệch `outputSchema` nó công bố. Client SDK 1.30 (đã `listTools`) làm gì?
   - A. Ném lỗi `Structured content does not match the tool's output schema` — lời gọi thất bại
   - B. Bỏ qua `structuredContent`, dùng `content`
   - C. Tự sửa cho khớp schema
   - D. Không kiểm gì

   <details><summary>Đáp án</summary>

   **A.** Client cache `outputSchema` từ `tools/list` và validate mỗi kết quả. Hợp đồng được kiểm ở cả hai đầu.

   </details>

3. Câu lỗi nào đúng mẫu “chuyện gì + làm gì tiếp” nhất cho `nexus_get_exchange_rate` khi API ngoài 503?
   - A. `Error 503`
   - B. `Upstream service unavailable: GET https://open.er-api.com/v6/latest/USD returned 503`
   - C. `Dịch vụ tỷ giá đang lỗi hoặc không truy cập được. Thử lại sau ít phút. Không tự đoán tỷ giá.`
   - D. `Đã có lỗi xảy ra, vui lòng thử lại.`

   <details><summary>Đáp án</summary>

   **C.** Câu 2 lộ URL nội bộ và không nói bước tiếp. Câu 4 không nói chuyện gì. Câu 3 nói sự thật + hành động + cấm bịa số.

   </details>

4. Khi nào code của bạn (không phải SDK) nên trả JSON-RPC error thay vì `isError`?
   - A. Khi id không tồn tại
   - B. Khi API ngoài timeout
   - C. Khi input sai định dạng
   - D. Trong M3: không lần nào — lỗi giao thức là việc của SDK với request hỏng về hình thức

   <details><summary>Đáp án</summary>

   **D.** Mọi thứ model cần đọc để làm tiếp đi vào `isError`. Output thật: ngay cả `McpError` ném trong handler cũng bị SDK 1.30 bọc lại thành `isError`.

   </details>

### Trắc nghiệm S3.4 — API ngoài & ảnh

1. `const res = await fetch(url, { signal })` và API trả 503. Dòng này làm gì?
   - A. Ném `HttpRequestException`
   - B. Không ném — trả `Response` có `res.ok === false`, `res.status === 503`
   - C. Ném `TypeError: fetch failed`
   - D. Tự thử lại 3 lần

   <details><summary>Đáp án</summary>

   **B.** `fetch` chỉ ném khi không có response (mạng lỗi, bị hủy). Status lỗi phải tự kiểm — không có `EnsureSuccessStatusCode()`.

   </details>

2. Rates client phân biệt timeout bằng `timeout.aborted` thay vì `err.name === "TimeoutError"`. Vì sao?
   - A. Signal của chính mình cho biết chắc lý do hủy; tên/loại exception có thể khác giữa runtime và giữa lúc đang kết nối vs đang đọc body
   - B. `err.name` không tồn tại trong Node
   - C. Để code ngắn hơn
   - D. Vì `AbortSignal.timeout` không ném gì

   <details><summary>Đáp án</summary>

   **A.** Timeout có thể nổ lúc `fetch` hoặc lúc `res.json()`; client kiểm `timeout.aborted` ở cả hai chỗ.

   </details>

3. Tên field `base_code`, `time_last_update_utc` của API tỷ giá xuất hiện ở đâu trong Nexus?
   - A. Trong `ExchangeRateOutputSchema` gửi cho model
   - B. Trong tool và web
   - C. Chỉ trong `rates/client.ts` — ra khỏi file là `ExchangeRate` của Nexus (`base`, `quote`, `rate`, `asOf`)
   - D. Không đâu cả, dùng `as any`

   <details><summary>Đáp án</summary>

   **C.** Anti-corruption layer: hợp đồng của bên thứ ba dừng ở adapter. Đổi nhà cung cấp tỷ giá chỉ sửa 1 file.

   </details>

4. Tool biểu đồ trả ảnh **và** `counts` dạng JSON. Lý do chính?
   - A. Spec bắt buộc
   - B. Host/model không hiển thị hoặc không đọc được ảnh vẫn trả lời được bằng số; ảnh là cho người xem
   - C. Ảnh PNG không chứa được số
   - D. Để tăng kích thước kết quả

   <details><summary>Đáp án</summary>

   **B.** Luôn kèm dữ liệu máy đọc được. Ảnh còn đắt: base64 +33% vào context.

   </details>

### Trắc nghiệm S3.5 — Annotation, progress, log

1. Vì sao `nexus_update_customer_tier` có `idempotentHint: true`?
   - A. Đặt lại cùng gói lần 2 không đổi gì thêm (`changed: false`) — gọi lại an toàn khi mạng chập chờn
   - B. Vì tool chỉ đọc
   - C. Vì mọi tool ghi đều idempotent
   - D. Vì SDK yêu cầu khi `destructiveHint: true`

   <details><summary>Đáp án</summary>

   **A.** Idempotent = gọi lại cùng tham số không thêm hiệu ứng. “Tăng số dư thêm 100” thì không idempotent.

   </details>

2. `openWorldHint` của `nexus_get_exchange_rate` và `nexus_list_customers` nên là?
   - A. Cả hai `true`
   - B. Cả hai `false`
   - C. Tỷ giá `true` (gọi dịch vụ ngoài), khách hàng `false` (chỉ dữ liệu của mình)
   - D. Tỷ giá `false`, khách hàng `true`

   <details><summary>Đáp án</summary>

   **C.** Open world = tương tác với thực thể ngoài hệ thống của bạn. Host có thể cảnh báo khác nhau cho 2 loại.

   </details>

3. Tool gặp exception lạ. Stack trace nên đi đâu?
   - A. stderr (log cho người vận hành); model nhận câu chung “gặp lỗi nội bộ”
   - B. `notifications/message` mức `error` cho client
   - C. `content` của result để model tự debug
   - D. stdout

   <details><summary>Đáp án</summary>

   **A.** Kênh MCP có thể tới UI người dùng. `instrument` log stack ra stderr, trả `toolFail` chung chung. stdout thì không bao giờ.

   </details>

4. Client gọi tool **không** đưa `progressToken`. `progressReporter(extra)` làm gì?
   - A. Tự tạo token ngẫu nhiên rồi gửi
   - B. Ném lỗi
   - C. Trả hàm rỗng — handler vẫn gọi `report()` nhưng không notification nào được gửi
   - D. Gửi progress với token `0`

   <details><summary>Đáp án</summary>

   **C.** Null Object: quyết định “có gửi không” ở 1 chỗ. Tự bịa token thì client báo `unknown token` (output thật ở S3.5).

   </details>

### Chấm điểm

*(Bản HTML có nút chấm điểm theo session.)*

### Thực hành

Làm trên repo Nexus của bạn. Không có lời giải — nghiệm thu bằng lệnh.

#### Bài 1 — tool mới từ file trống, 15 phút, không tra

`nexus_find_customer_by_email(email)` → 1 khách. Bấm giờ, không mở bài.

- [ ] Tên trong `TOOL`; description theo khung 4 câu.
- [ ] Input: `z.email()`; email sai định dạng bị schema chặn.
- [ ] Output: `outputSchema` (dùng lại `GetCustomerOutputSchema`), trả qua `toolOk`.
- [ ] Không tìm thấy → `toolFail` gợi ý `nexus_list_customers`.
- [ ] Annotation tường minh cả 4 hint; bọc bằng `instrument`.
- [ ] Nghiệm thu:

```console
$ node scripts/call.ts nexus_find_customer_by_email '{"email":"lienhe@kh007.vn"}'   # ok, structuredContent
$ node scripts/call.ts nexus_find_customer_by_email '{"email":"khong-phai-email"}'  # isError -32602 … at email
$ node scripts/call.ts nexus_find_customer_by_email '{"email":"ai@dau.vn"}'         # isError, có nexus_list_customers
$ pnpm check                                                                          # smoke không dòng ✗
```

#### Bài 2 — `nexus_convert_amount` dùng lại rates client

Nhận `amount` (> 0), `from`, `to` (mặc định VND); trả `{ amount, from, to, rate, converted, asOf }`.

- [ ] Không gọi `fetch` trực tiếp trong tool — dùng `RatesClient` đã có.
- [ ] Mọi kiểu lỗi của rates client dùng lại `describeRatesError`.
- [ ] `amount: 0` hoặc âm bị schema chặn.
- [ ] Nghiệm thu với `rates-stub` (4 chế độ): `ok` → `converted` đúng theo rate của stub; `slow` → isError ≈ 5000 ms; `down`, `html` → isError không có `Unexpected token`.

#### Bài 3 — Claude Desktop (phần bài này chưa chạy được ở sandbox)

- [ ] Nối Nexus vào Claude Desktop (config ở M2, `NEXUS_DATA=memory`); menu công cụ hiện 9 tool `nexus_*`.
- [ ] Hỏi “Có bao nhiêu khách hàng ở Hà Nội?” → Claude gọi `nexus_list_customers`, trả lời 12.
- [ ] Yêu cầu “Xóa khách cus_030” → Claude Desktop hiện hộp xác nhận trước khi gọi `nexus_delete_customer`. Chụp màn hình.
- [ ] Đổi tạm `nexus_delete_customer` thành `readOnlyHint: true`, khởi động lại, lặp lại yêu cầu — ghi lại hộp xác nhận còn hiện không. Trả annotation về đúng.

#### Bài 4 — viết bằng lời

- [ ] 5 câu: khi nào `isError: true`, khi nào lỗi giao thức — mỗi câu 1 ví dụ trong Nexus.
- [ ] Viết `what` + `next` cho 3 lỗi của `nexus_convert_amount` (timeout, mã tiền tệ lạ, amount quá lớn) rồi so với mẫu ở Cheat Sheet S3.3.
