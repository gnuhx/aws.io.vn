# Module 5 — MCP thực chiến với dữ liệu

> Roadmap MCP × Full-Stack AI · 5 session · 2 tuần · C50 Lab 19–28 · file, DB chỉ đọc, REST + 429, tổng hợp, CRUD + cursor

## Mục lục

- **Tổng quan** — MCP thực chiến với dữ liệu
- **S5.1** — File system & chống path traversal
- **S5.2** — Database read-only & publish schema
- **S5.3** — Bọc REST API & rate limit
- **S5.4** — Search, CSV & không trả dữ liệu thô
- **S5.5** — CRUD đầy đủ & pagination
- **Kiểm tra cuối** — Exit check Module 5

---

## Module 5 — MCP thực chiến với dữ liệu

M3–M4 làm đúng 3 primitive. M5 cho chúng chạm vào **dữ liệu thật**: file trên đĩa, database, API của bên thứ ba, bảng hàng chục nghìn dòng, và một bộ CRUD đầy đủ. Từ đây mỗi tool có thêm 2 vai trò mà M3 chưa phải nghĩ tới: nó là **bề mặt tấn công** (input do LLM sinh ra, mà LLM thì đọc được nội dung do người khác viết), và nó là **vòi xả vào context** (trả quá nhiều là đốt token, trả quá ít là số sai).

Kết quả sau module: `apps/mcp-server` có **23 tool** (13 tool mới), resource `nexus://schema`, client HTTP dùng chung có retry/backoff/`Retry-After`, và 3 script tự kiểm: `attack` (14 kiểu tấn công path), `page-all` (duyệt 1000 bản ghi qua cursor khi dữ liệu đang đổi), `size-audit` (mọi tool với tham số xấu nhất trên 50 000 đơn). `pnpm check` chạy cả 3.

> **Repo Nexus của bài được dựng lại từ nội dung M3 + M4.** Sandbox dựng M5 không có `nexus-m4.zip`, nên `nexus/` được viết lại theo `m3.src.md` + `m4.src.md` (cùng tên file, cùng hành vi: 10 tool, `toolOk`/`toolFail`/`toolOkLinks`, `instrument`, resource + template + subscription, prompt `nexus_weekly_summary`). Chi tiết nhỏ có thể lệch bản bạn đang có. Diff trong bài lấy từ commit “M4 baseline (dựng lại từ m3/m4.src.md)” → 5 commit “M5 S5.1” … “M5 S5.5”. `apps/web` **không** dựng lại: M5 không đụng tới web (host đọc `nexus://schema` là việc của M11) — giữ bản của bạn.

### 5 session

| Session | Học gì | Output |
|---|---|---|
| **S5.1** File system & chống path traversal | Thư mục cho phép, chuẩn hóa về đường dẫn tuyệt đối rồi mới so, `realpath` cho symlink, `O_NOFOLLOW`/`O_EXCL`, branded `SafePath` · C50 Lab 19–20 | `nexus_list_exports`, `nexus_read_export`, `nexus_export_customers` — 14/14 kiểu tấn công bị chặn |
| **S5.2** Database read-only & publish schema | Kết nối read-only, allow-list toán tử (không blacklist), schema thành resource sinh từ Zod, user Mongo chỉ có role `read` · C50 Lab 21–22 | `nexus_query` + `nexus://schema`; `$where`/`$function`/ReDoS bị từ chối |
| **S5.3** Bọc REST API & rate limit | Auth header, adapter thay được, 429 + `Retry-After`: chờ hay trả ngay, retry POST chỉ khi có Idempotency-Key, ngân sách thời gian · C50 Lab 23–24 | `http/api-client.ts`, `nexus_list_tickets`, `nexus_create_ticket` |
| **S5.4** Search, CSV & không trả dữ liệu thô | Tổng hợp tại nguồn, tách aggregate/filter thành tool riêng, CSV RFC 4180, tháng theo giờ VN, đo token tool xấu nhất · C50 Lab 25–26 | `nexus_revenue_by`, `nexus_find_orders`, `nexus_analyze_export`; tool lớn nhất 12 054 token |
| **S5.5** CRUD đầy đủ & pagination | Thiết kế theo workflow chứ không bê API, keyset cursor mờ, báo hết trang bằng cách **không** có `nextCursor` · C50 Lab 27–28 | 4 tool `tasks`; 1000/1000 bản ghi qua cursor, 0 trùng 0 sót |

### Phiên bản đã chạy

```console
$ node -v
v22.22.0
$ pnpm -v
10.28.0
$ pnpm exec tsc -v
Version 6.0.3
$ pnpm --filter @nexus/mcp-server list @modelcontextprotocol/sdk zod mongodb js-tiktoken --depth 0 | tail -6
@modelcontextprotocol/sdk 1.30.1
mongodb 7.7.0
zod 4.6.5

devDependencies:
js-tiktoken 1.0.21
$ npm view @modelcontextprotocol/sdk dist-tags.latest
1.32.0
$ npm view @modelcontextprotocol/server dist-tags.latest
2.3.0
$ npm view typescript dist-tags.latest
7.0.2
$ grep PRETTY /etc/os-release
PRETTY_NAME="Ubuntu 24.04.5 LTS"
```

| Khác biệt phiên bản gặp khi dựng bài | Xử lý trong bài |
|---|---|
| `@modelcontextprotocol/sdk` **1.32.0** ra ngày 02/10 (dist-tag `latest`); M3–M4 dùng 1.30.1 | Code bài giữ **1.30.1** (khớp C50). Đã chạy 4 hành vi M5 dựa vào trên 1.30.1, 1.32.0 và v2: 1.30.1 = 1.32.0 từng chữ (output ở Cheat Sheet Tổng quan) |
| SDK **v2** (`@modelcontextprotocol/server` 2.3.0): lỗi validate không còn tiền tố `MCP error -32602:`, có đường dẫn field (`status: Invalid option…`); `registerTool` với raw shape bị `@deprecated` | Không đổi code bài. Khi chuyển (M15): truyền `z.object(...)` thay `.shape` cho mọi `inputSchema`/`outputSchema` — đồng thời giữ được `.refine` (S5.5, Bẫy 3) |
| SDK 1.30–1.32 và v2: đăng ký `inputSchema: Schema.shape` làm **rơi** `.refine` của object | `nexus_update_task` truyền cả object (S5.5) |
| TypeScript **7.0.2** (bản biên dịch native) đã là `latest` | Bài giữ **6.0.3** như M3–M4; chưa thử với 7 |
| Node 22.22: `node:sqlite` còn experimental (in `ExperimentalWarning` ra stderr) | Chỉ dùng trong `lesson-code` để chứng minh DB read-only; chạy với `--disable-warning=ExperimentalWarning` |
| Không có tokenizer của Claude chạy offline | Đếm token bằng `js-tiktoken` `o200k_base` — là **ước lượng**, đủ để so lớn/nhỏ và kiểm ngân sách 25k; tiếng Việt có dấu tốn token hơn tiếng Anh |
| MongoDB driver 7.7.0 | Code Mongo qua `tsc` strict; **chưa chạy** (không có Mongo — xem bảng dưới) |

### Đã chạy thật gì, chưa chạy gì

Sandbox dựng bài không có: harness chấm C50, Claude Desktop, MongoDB (không có Docker daemon; tải MongoDB và Docker Hub bị proxy chặn — 403). Bài **không** bịa output cho phần chưa chạy.

| Phần | Trạng thái | Thay thế đã chạy |
|---|---|---|
| C50 Lab 19–28 (`npm run check`) | ✗ chưa chạy ở sandbox | — (lab C50 chỉ dạy đủ để tự làm, không có lời giải) |
| 13 tool mới của Nexus, `nexus://schema`, `pnpm check` (typecheck + smoke + attack + page-all + size-audit) | ✓ chạy thật | MCP client SDK thật qua stdio và `InMemoryTransport`; dữ liệu RAM cùng hợp đồng repository |
| Path traversal trên filesystem thật (symlink, thư mục anh em, NUL, mã hóa) | ✓ chạy thật | Thư mục tạm của Linux, symlink thật tới `/etc` |
| Mongo: user `nexus_reader` (role `read`) từ chối ghi; `$where` trên server Mongo | ✗ chưa chạy ở sandbox | Cùng nguyên tắc trên **SQLite** `readOnly` (chạy thật: DB từ chối ghi); guard allow-list chạy thật |
| Mongo: aggregation `revenueBy`/`$facet`, keyset `tasks`, change stream | ✗ chưa chạy ở sandbox | Bản RAM chạy thật cùng hợp đồng; bản Mongo qua `tsc` strict |
| Helpdesk bên thứ ba | ✓ chạy thật qua HTTP | Stub `scripts/stub/helpdesk.ts`: Bearer token, token bucket, `Retry-After` (giây + HTTP-date), Idempotency-Key |
| Claude Desktop gọi các tool M5 | ✗ chưa chạy ở sandbox | SDK client (`scripts/call.ts`, `read.ts`) |
| SDK 1.32.0, SDK v2 2.3.0 | ✓ chạy thật (chỉ để so sánh) | `lesson-code/m5-sdk/check.ts` |

### Cách dùng trang

- Mỗi session: **Lý thuyết + Lab** (bảng C# → TS, lab C50 + lab Nexus có AC và lệnh nghiệm thu, bẫy có lỗi thật, code mẫu & pattern, 3 câu trắc nghiệm) · **Cheat Sheet** · **Code** (toàn bộ file của session theo cây thư mục).
- **Luật vàng C50:** tự code tới khi `npm run check` xanh rồi mới xem video Review. Lab 20 là bài test **tấn công** server của bạn — đừng chỉ làm cho xanh, đọc test xem nó thử gì.
- Lời giải lab Nexus nằm trong mục thu gọn “Xem sau khi làm xong”. Tab Code có toàn bộ file — mở khi đã làm xong.
- Ô tick AC được nhớ trên trình duyệt này. Tick khi lệnh nghiệm thu xanh.

### Exit check Module 5

- [ ] C50 Lab 19–28 xanh hết.
- [ ] Liệt kê được 5 cách một tool truy cập dữ liệu có thể bị lạm dụng và cách chặn từng cái (bài thực hành 5 ở [Kiểm tra cuối](#fx) — áp vào 1 tool **mới**, không chép bảng).
- [ ] `pnpm check` xanh trên repo của bạn.
- [ ] Trang Kiểm tra cuối: mọi session ≥ 80%.


---

## Tổng quan · Cheat Sheet

### Bản đồ module

**Sơ đồ (Bản đồ dịch vụ) — Module 5 gồm những session nào, mỗi session chặn kiểu lạm dụng nào?**

```mermaid
flowchart LR
    s51["S5.1 File & path"] -- "path an toàn" --> s52["S5.2 DB chỉ đọc"]
    s52["S5.2 DB chỉ đọc"] -- "quyền hẹp" --> s53["S5.3 REST & 429"]
    s53["S5.3 REST & 429"] -- "lỗi có hạn" --> s54["S5.4 Tổng hợp"]
    s54["S5.4 Tổng hợp"] -- "kích thước" --> s55["S5.5 CRUD & cursor"]
    s55["S5.5 CRUD & cursor"] -- "duyệt hết" --> out["✓ 23 tool an toàn"]
```

**Đọc sơ đồ:** Đọc từ ô đầu (trái trên) sang phải, vòng xuống hàng dưới và đi ngược về trái tới đích. Nhãn mũi tên = thứ mang sang session sau. *Màu: xanh ô-liu + ✓ = đã xong / đích · viền terracotta = đang học · be = sắp học.*


### Mỗi kiểu lạm dụng, lớp chặn trong Nexus

| Kiểu lạm dụng | Ví dụ thật trong bài | Lớp chặn (theo thứ tự) | Session |
|---|---|---|---|
| Đọc/ghi ra ngoài vùng cho phép | `../../etc/passwd`, symlink `link-secret.txt` | Schema ký tự → `resolve` + `relative` → `realpath` → `O_NOFOLLOW`/`O_EXCL` | S5.1 |
| Chạy mã / truy vấn nguy hiểm trên DB | `$where`, `$expr`+`$function`, regex `(a+)+` | Allow-list toán tử + field → kết nối bằng user role `read` | S5.2 |
| Ghi qua cửa “chỉ đọc” | `WITH … DELETE` lọt regex “chỉ SELECT” | Interface không có hàm ghi → DB từ chối ghi | S5.2 |
| Dội bom / tạo trùng ở API ngoài | 6220 request trong 2 s; POST retry tạo 3 ticket | `Retry-After` + `maxWaitMs` + ngân sách; POST chỉ retry khi có Idempotency-Key | S5.3 |
| Đốt context / số sai do cắt | 600 đơn = 33 444 token; cắt 50 đơn lệch 91% | Tổng hợp tại nguồn, trần `limit`/`top`, `size-audit` với ngân sách 25k | S5.4 |
| Duyệt sai khi dữ liệu đổi / cursor giả | offset sót 3–7 bản ghi; cursor bị sửa | Keyset (createdAt, id) + vân tay bộ lọc trong cursor | S5.5 |

### Bảng pattern của module

| Pattern | Session | Tương đương C# / .NET | Dùng khi |
|---|---|---|---|
| Parse, don't validate: `SafePath` branded | S5.1 | Value object có private ctor + `TryCreate` (`record SafePath`) | Giá trị đã kiểm mang kiểu riêng; hàm nguy hiểm (đọc/ghi file) chỉ nhận kiểu đó |
| Cổng chỉ đọc: interface hẹp + quyền DB hẹp | S5.2 | `IReadOnlyRepository<T>` / CQRS query side + login SQL chỉ `db_datareader` | Tool cho LLM truy vấn tự do: không có hàm ghi trên kiểu, không có quyền ghi trên DB |
| Chính sách retry là dữ liệu + 1 hàm bọc `fetch` | S5.3 | `DelegatingHandler` + Polly (`AddStandardResilienceHandler`) | Mọi API bên thứ ba: timeout, retry an toàn, `Retry-After`, ngân sách thời gian |
| Tổng hợp tại nguồn (projection thay entity) | S5.4 | LINQ `GroupBy(...).Select(new RevenueRow(...))` dịch thành `GROUP BY` | Câu hỏi về con số: trả số đã cộng + vài mẫu, không trả bản ghi |
| Keyset cursor mờ + tool theo workflow | S5.5 | `WHERE (CreatedAt, Id) > (@c, @i)` + continuation token (Cosmos DB, Azure SDK `Pageable<T>`) | Danh sách dài, dữ liệu đổi khi đang duyệt; model chỉ cần chép cursor |


### Lệnh cả module

```console
$ pnpm check                                                     # typecheck + smoke + attack + page-all + size-audit
$ cd apps/mcp-server
$ node scripts/attack-export.ts                                  # 14 kiểu tấn công path → "OK: 0 lọt"
$ node scripts/query-probe.ts                                    # filter hợp lệ + filter độc
$ node scripts/helpdesk-stub.ts --capacity 5 --refill 1 &        # helpdesk giả lập ở :4020
$ HELPDESK_TOKEN=dev-helpdesk-token node scripts/call.ts nexus_list_tickets '{"status":"open"}'
$ node scripts/seed-exports.ts                                   # CSV 600 đơn vào var/exports/2026-09/
$ node scripts/size-audit.ts                                     # mọi tool, tham số xấu nhất, ngân sách 25k token
$ node scripts/page-all.ts                                       # 1000 việc qua cursor, có xóa/tạo giữa chừng
```

### SDK 1.32.0 và SDK v2 với 4 hành vi M5 dựa vào

```console
$ node check.ts
@modelcontextprotocol/sdk 1.30.1 (code bài)
  A. input sai kiểu (status=1)         → result isError: MCP error -32602: Input validation error: Invalid arguments for tool obj: Invalid option: expected one of "tod
  B. refine + đăng ký bằng .shape      → result: handler chạy
  C. có outputSchema, trả isError      → result isError: lỗi nghiệp vụ
  D. structuredContent sai schema      → result isError: MCP error -32602: Output validation error: Invalid structured content for tool badout: Invalid input: expected
@modelcontextprotocol/sdk 1.32.0 (latest v1)
  A. input sai kiểu (status=1)         → result isError: MCP error -32602: Input validation error: Invalid arguments for tool obj: Invalid option: expected one of "tod
  B. refine + đăng ký bằng .shape      → result: handler chạy
  C. có outputSchema, trả isError      → result isError: lỗi nghiệp vụ
  D. structuredContent sai schema      → result isError: MCP error -32602: Output validation error: Invalid structured content for tool badout: Invalid input: expected
@modelcontextprotocol/server 2.3.0 (v2)
  A. input sai kiểu (status=1)         → result isError: Input validation error: Invalid arguments for tool obj: status: Invalid option: expected one of "todo"|"done"
  B. refine + đăng ký bằng .shape      → result: handler chạy
  C. có outputSchema, trả isError      → result isError: lỗi nghiệp vụ
  D. structuredContent sai schema      → result isError: Output validation error: Invalid structured content for tool badout: total: Invalid input: expected number, re
```

A–D giống nhau ở cả 3 bản về **hành vi** (A, D thành kết quả `isError`; B rơi `.refine`; C cho phép `isError` không kèm `structuredContent`). v2 chỉ khác **chữ**: bỏ tiền tố `MCP error -32602:` và thêm tên field.

### 15 bẫy của module

| # | Bẫy | Session | Dấu hiệu |
|---|---|---|---|
| 1 | `path.join(root, input)` | S5.1 | 5/7 kiểu tấn công lọt, `root:x:0:0` |
| 2 | `abs.startsWith(root)` | S5.1 | `../exports-evil/secret.txt` lọt |
| 3 | Kiểm `..` rồi mới `decodeURIComponent` | S5.1 | `..%2F..%2F…` lọt |
| 4 | Không `realpath` | S5.1 | Symlink trong thư mục cho phép lọt |
| 5 | Blacklist `$where` | S5.2 | 5/6 filter độc cho qua |
| 6 | Regex “chỉ SELECT/WITH” trên kết nối có quyền ghi | S5.2 | `WITH … DELETE` xóa 3/3 dòng |
| 7 | Retry 429 không chờ | S5.3 | 6220 request / 2 s, `MaxListenersExceededWarning` |
| 8 | Retry POST khi timeout, không Idempotency-Key | S5.3 | 3 POST → 3 ticket |
| 9 | `switch` thiếu nhánh lỗi | S5.3 | `TS2366` |
| 10 | Trả nguyên danh sách / cắt bớt | S5.4 | 33 444 token; tổng lệch 91% |
| 11 | CSV bằng `split(",")`, tiền bằng `Number()` | S5.4 | 750 “dòng” thay vì 600; `NaN` |
| 12 | Tháng bằng `createdAt.slice(0, 7)` | S5.4 | 9/527 đơn sai tháng |
| 13 | Offset pagination | S5.5 | sót 3–7, trùng 3 |
| 14 | Keyset chỉ theo `createdAt` | S5.5 | limit 37 sót 75; limit 50 không sót (bẫy ẩn) |
| 15 | `inputSchema: X.shape` với `.refine` | S5.5 | handler chạy với input rỗng |


---

## Tổng quan · Code

### Cây repo sau Module 5

```txt
nexus/
├─ package.json (check = typecheck + smoke + verify) · pnpm-workspace.yaml · tsconfig.base.json
├─ packages/shared/src/        index.ts · tools.ts (23 tên) · customer.ts · exchange-rate.ts · resources.ts · prompts.ts
│                              exports.ts · order.ts · query.ts · helpdesk.ts · revenue.ts · task.ts        (M5)
├─ apps/mcp-server/
│  ├─ src/                     index.ts · server.ts · deps.ts · env.ts · log.ts · db.ts · tool-result.ts · instrument.ts · progress.ts · png.ts
│  │  ├─ files/safe-path.ts                                                                   (S5.1)
│  │  ├─ query/                catalog.ts · filter-guard.ts · store.ts · memory-store.ts · mongo-store.ts  (S5.2)
│  │  ├─ http/api-client.ts · helpdesk/port.ts · helpdesk/http-helpdesk.ts                    (S5.3)
│  │  ├─ orders/               seed-data.ts · repository.ts · mongo-repository.ts              (S5.2, S5.4)
│  │  ├─ csv/parse.ts                                                                         (S5.4)
│  │  ├─ tasks/                repository.ts · memory-repository.ts · mongo-repository.ts · seed-data.ts · cursor.ts  (S5.5)
│  │  ├─ rates/client.ts       (S5.3: dùng api-client)
│  │  ├─ tools/                10 tool M3–M4 + 13 tool M5 + helpdesk-errors.ts
│  │  ├─ resources/            M4 + schema.ts (S5.2)
│  │  ├─ prompts/              weekly-summary.ts
│  │  └─ customers/            repository.ts · memory-repository.ts · mongo-repository.ts · seed-data.ts
│  └─ scripts/                 smoke · call · read · prompt · client · rates-stub
│                              attack-export · query-probe · helpdesk-stub · stub/helpdesk · rate-demo
│                              seed-exports · size-audit · page-all                                        (M5)
└─ infra/mongo/create-reader.js                                                                (S5.2)
lesson-code/
├─ m5/                         fixture.ts · layers.ts · traps/ (14 file) · tsc-traps/ (5 file, CỐ Ý lỗi) · patterns/ (5 file)
└─ m5-sdk/check.ts             so sánh SDK 1.30.1 / 1.32.0 / v2 2.3.0
```

`lesson-code/m5` qua `tsc -p tsconfig.json` (strict). `m5/tsc-traps` là file **cố ý lỗi**, lỗi thật lấy bằng `tsc -p tsc-traps.json`.

### Gốc repo

`package.json`

```json
{
  "name": "nexus",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.28.0",
  "engines": {
    "node": ">=22.18"
  },
  "scripts": {
    "typecheck": "pnpm -r typecheck",
    "smoke": "pnpm --filter @nexus/mcp-server smoke",
    "check": "pnpm typecheck && pnpm smoke && pnpm verify",
    "verify": "pnpm --filter @nexus/mcp-server verify"
  },
  "devDependencies": {
    "@types/node": "22.20.5",
    "typescript": "6.0.3"
  }
}
```
`apps/mcp-server/package.json`

```json
{
  "name": "@nexus/mcp-server",
  "private": true,
  "type": "module",
  "bin": {
    "nexus-mcp": "./src/index.ts"
  },
  "scripts": {
    "start": "node src/index.ts",
    "typecheck": "tsc -p tsconfig.json",
    "smoke": "node scripts/smoke.ts",
    "attack": "node scripts/attack-export.ts",
    "size-audit": "node scripts/size-audit.ts",
    "page-all": "node scripts/page-all.ts",
    "verify": "node scripts/attack-export.ts && node scripts/page-all.ts && node scripts/size-audit.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "1.30.1",
    "@nexus/shared": "workspace:*",
    "mongodb": "7.7.0",
    "zod": "4.6.5"
  },
  "devDependencies": {
    "js-tiktoken": "1.0.21"
  }
}
```
`tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2023"],
    "types": ["node"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "allowImportingTsExtensions": true,
    "rewriteRelativeImportExtensions": false,
    "noEmit": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```
`pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Composition root sau M5

`apps/mcp-server/src/server.ts`

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Deps } from "./deps.ts";
import { registerWeeklySummary } from "./prompts/weekly-summary.ts";
import { registerCharts } from "./resources/charts.ts";
import { registerCustomerResources } from "./resources/customers.ts";
import { registerDocs } from "./resources/docs.ts";
import { registerSchema } from "./resources/schema.ts";
import { enableResourceSubscriptions } from "./resources/subscriptions.ts";
import { registerAnalyzeExport } from "./tools/analyze-export.ts";
import { registerChartCustomersByCity } from "./tools/chart-customers-by-city.ts";
import { registerCreateTask } from "./tools/create-task.ts";
import { registerCreateTicket } from "./tools/create-ticket.ts";
import { registerDeleteCustomer } from "./tools/delete-customer.ts";
import { registerDeleteTask } from "./tools/delete-task.ts";
import { registerExportCustomers } from "./tools/export-customers.ts";
import { registerFindOrders } from "./tools/find-orders.ts";
import { registerGenerateReport } from "./tools/generate-report.ts";
import { registerGetCustomer } from "./tools/get-customer.ts";
import { registerGetExchangeRate } from "./tools/get-exchange-rate.ts";
import { registerGetTime } from "./tools/get-time.ts";
import { registerListCustomers } from "./tools/list-customers.ts";
import { registerListExports } from "./tools/list-exports.ts";
import { registerListTasks } from "./tools/list-tasks.ts";
import { registerListTickets } from "./tools/list-tickets.ts";
import { registerPing } from "./tools/ping.ts";
import { registerQuery } from "./tools/query.ts";
import { registerReadExport } from "./tools/read-export.ts";
import { registerRevenueBy } from "./tools/revenue-by.ts";
import { registerSearchCustomers } from "./tools/search-customers.ts";
import { registerUpdateCustomerTier } from "./tools/update-customer-tier.ts";
import { registerUpdateTask } from "./tools/update-task.ts";

const INSTRUCTIONS =
  "Nexus: dữ liệu khách hàng của công ty. Số liệu luôn lấy từ tool, không đoán. " +
  "Thuật ngữ nghiệp vụ ở resource nexus://docs/glossary.";

/** Composition root: 1 McpServer cho mỗi phiên, mọi đăng ký ở đây (trước connect). */
export function createServer(deps: Deps): McpServer {
  const server = new McpServer(
    { name: "nexus", version: "0.5.0" },
    { instructions: INSTRUCTIONS, capabilities: { logging: {} } },
  );
  deps.log.attach(server);

  // Tools (M3 + M4)
  registerPing(server, deps);
  registerGetTime(server, deps);
  registerListCustomers(server, deps);
  registerGetCustomer(server, deps);
  registerGetExchangeRate(server, deps);
  registerChartCustomersByCity(server, deps);
  registerUpdateCustomerTier(server, deps);
  registerDeleteCustomer(server, deps);
  registerGenerateReport(server, deps);
  registerSearchCustomers(server, deps);

  // M5 · S5.1 — file trong thư mục export
  registerListExports(server, deps);
  registerReadExport(server, deps);
  registerExportCustomers(server, deps);

  // M5 · S5.2 — truy vấn chỉ đọc + schema cho LLM đọc trước
  registerQuery(server, deps);
  registerSchema(server);

  // M5 · S5.3 — helpdesk bên ngoài qua client HTTP chung
  registerListTickets(server, deps);
  registerCreateTicket(server, deps);

  // M5 · S5.4 — tổng hợp tại nguồn, không trả dữ liệu thô
  registerRevenueBy(server, deps);
  registerFindOrders(server, deps);
  registerAnalyzeExport(server, deps);

  // M5 · S5.5 — việc nội bộ: 4 tool theo workflow, cursor pagination
  registerListTasks(server, deps);
  registerCreateTask(server, deps);
  registerUpdateTask(server, deps);
  registerDeleteTask(server, deps);

  // Resources + prompt (M4)
  registerDocs(server);
  registerCustomerResources(server, deps);
  registerCharts(server, deps);
  enableResourceSubscriptions(server, deps);
  registerWeeklySummary(server);
  return server;
}
```
`apps/mcp-server/src/deps.ts`

```ts
import type { CustomerRepository } from "./customers/repository.ts";
import { createMemoryCustomerRepository } from "./customers/memory-repository.ts";
import { createMongoCustomerRepository } from "./customers/mongo-repository.ts";
import { seedCustomers } from "./customers/seed-data.ts";
import { connectMongo } from "./db.ts";
import type { Env } from "./env.ts";
import { openRoot } from "./files/safe-path.ts";
import { createHttpHelpdesk } from "./helpdesk/http-helpdesk.ts";
import type { HelpdeskPort } from "./helpdesk/port.ts";
import { createApiClient } from "./http/api-client.ts";
import { createMongoOrderRepository } from "./orders/mongo-repository.ts";
import { createMemoryOrderRepository, type OrderRepository } from "./orders/repository.ts";
import { seedOrders } from "./orders/seed-data.ts";
import { createMemoryReadOnlyStore } from "./query/memory-store.ts";
import { createMongoReadOnlyStore } from "./query/mongo-store.ts";
import type { ReadOnlyStore, Row } from "./query/store.ts";
import { createMemoryTaskRepository } from "./tasks/memory-repository.ts";
import { createMongoTaskRepository } from "./tasks/mongo-repository.ts";
import type { TaskRepository } from "./tasks/repository.ts";
import { seedTasks } from "./tasks/seed-data.ts";
import { createLogger, type Logger } from "./log.ts";
import { createRatesClient, type RatesClient } from "./rates/client.ts";

/** Mọi thứ tool cần — composition root ghép 1 lần, tool nhận qua tham số (M3). */
export interface Deps {
  log: Logger;
  customers: CustomerRepository;
  rates: RatesClient;
  /** realpath của thư mục export (M5 · S5.1) */
  exportsDir: string;
  orders: OrderRepository;
  /** Cửa chỉ đọc cho nexus_query (M5 · S5.2) */
  query: ReadOnlyStore;
  /** Helpdesk bên ngoài qua client HTTP chung (M5 · S5.3) */
  helpdesk: HelpdeskPort;
  /** Việc nội bộ (M5 · S5.5) */
  tasks: TaskRepository;
  close(): Promise<void>;
}

export function helpdeskFromEnv(env: Pick<Env, "HELPDESK_URL" | "HELPDESK_TOKEN">, log: Logger): HelpdeskPort {
  const token = env.HELPDESK_TOKEN;
  return createHttpHelpdesk(
    createApiClient({
      name: "Helpdesk",
      baseUrl: env.HELPDESK_URL,
      timeoutMs: 3_000,
      retry: { maxAttempts: 4, baseDelayMs: 200, maxDelayMs: 2_000, maxWaitMs: 5_000, budgetMs: 10_000 },
      auth: () => (token ? { authorization: `Bearer ${token}` } : {}),
      log,
    }),
  );
}

/** Store RAM đọc từ repository — cùng hợp đồng với store Mongo dùng user read-only. */
export function memoryQueryStore(customers: CustomerRepository, orders: OrderRepository, tasks: TaskRepository): ReadOnlyStore {
  return createMemoryReadOnlyStore({
    customers: async () => (await customers.list({ limit: 1_000_000 })).items as readonly Row[],
    orders: async () => (await orders.all()) as readonly Row[],
    tasks: async () => (await tasks.page({}, undefined, 1_000_000)).items as readonly Row[],
  });
}

export async function createDeps(env: Env): Promise<Deps> {
  const log = createLogger();
  const rates = createRatesClient(env.RATES_URL, env.RATES_TIMEOUT_MS);
  const exportsDir = await openRoot(env.NEXUS_EXPORT_DIR);
  const helpdesk = helpdeskFromEnv(env, log);
  if (env.NEXUS_DATA === "memory") {
    const seed = seedCustomers();
    const customers = createMemoryCustomerRepository(seed);
    const orders = createMemoryOrderRepository(seedOrders(seed));
    const tasks = createMemoryTaskRepository(seedTasks());
    return { log, rates, exportsDir, helpdesk, customers, orders, tasks, query: memoryQueryStore(customers, orders, tasks), close: async () => undefined };
  }
  const mongo = await connectMongo(env.MONGO_URI);
  const ro = await createMongoReadOnlyStore(env.MONGO_READONLY_URI);
  return {
    log,
    rates,
    exportsDir,
    helpdesk,
    customers: createMongoCustomerRepository(mongo.db),
    orders: createMongoOrderRepository(mongo.db),
    tasks: createMongoTaskRepository(mongo.db),
    query: ro.store,
    close: async () => {
      await Promise.all([mongo.close(), ro.close()]);
    },
  };
}
```
`apps/mcp-server/src/env.ts`

```ts
import { z } from "zod";

/** Env được kiểm 1 lần lúc khởi động; sai thì thoát với lỗi rõ (M0 · S0.2). */
const EnvSchema = z.object({
  NEXUS_DATA: z.enum(["memory", "mongo"]).default("memory"),
  MONGO_URI: z.string().default("mongodb://127.0.0.1:27017/nexus?replicaSet=rs0"),
  RATES_URL: z.url().default("http://127.0.0.1:4010"),
  RATES_TIMEOUT_MS: z.coerce.number().int().min(100).max(30_000).default(5_000),
  // M5 · S5.1: thư mục duy nhất tool file được chạm tới
  NEXUS_EXPORT_DIR: z.string().min(1).default(new URL("../var/exports", import.meta.url).pathname),
  // M5 · S5.2: user Mongo chỉ có role "read" — KHÁC MONGO_URI của phần ghi
  MONGO_READONLY_URI: z.string().default("mongodb://nexus_reader:change-me@127.0.0.1:27017/nexus?replicaSet=rs0&authSource=admin"),
  // M5 · S5.3: helpdesk bên ngoài — token chỉ đọc từ env, không có giá trị mặc định
  HELPDESK_URL: z.url().default("http://127.0.0.1:4020"),
  HELPDESK_TOKEN: z.string().min(1).optional(),
});
export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      process.stderr.write(`env ${issue.path.join(".")}: ${issue.message}\n`);
    }
    process.exit(1);
  }
  return parsed.data;
}
```
`packages/shared/src/tools.ts`

```ts
/** Tên tool là hợp đồng giữa server, host web và LLM: 1 nguồn duy nhất (M3 · S3.1). */
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
  searchCustomers: "nexus_search_customers",
  // M5 · S5.1 — file trong thư mục export
  listExports: "nexus_list_exports",
  readExport: "nexus_read_export",
  exportCustomers: "nexus_export_customers",
  // M5 · S5.2 — truy vấn chỉ đọc
  query: "nexus_query",
  // M5 · S5.3 — bọc API helpdesk bên ngoài
  listTickets: "nexus_list_tickets",
  createTicket: "nexus_create_ticket",
  // M5 · S5.4 — tổng hợp thay vì dữ liệu thô
  revenueBy: "nexus_revenue_by",
  findOrders: "nexus_find_orders",
  analyzeExport: "nexus_analyze_export",
  // M5 · S5.5 — việc nội bộ: CRUD theo workflow + cursor
  listTasks: "nexus_list_tasks",
  createTask: "nexus_create_task",
  updateTask: "nexus_update_task",
  deleteTask: "nexus_delete_task",
} as const;

export type ToolName = (typeof TOOL)[keyof typeof TOOL];
```

### So sánh phiên bản SDK (lesson-code, không thuộc repo)

`lesson-code/m5-sdk/check.ts`

```ts
// node check.ts — 4 hành vi M5 dựa vào, chạy trên SDK 1.30.1 (bài), 1.32.0 (latest v1) và v2 2.3.0.
import { z } from "zod";
import { McpServer as S130 } from "sdk130/server/mcp.js";
import { Client as C130 } from "sdk130/client/index.js";
import { InMemoryTransport as T130 } from "sdk130/inMemory.js";
import { McpServer as S132 } from "sdk132/server/mcp.js";
import { Client as C132 } from "sdk132/client/index.js";
import { InMemoryTransport as T132 } from "sdk132/inMemory.js";
import { McpServer as S2, InMemoryTransport as T2 } from "@modelcontextprotocol/server";
import { Client as C2 } from "@modelcontextprotocol/client";

const Update = z.object({ id: z.string(), status: z.enum(["todo", "done"]).optional() }).refine((v) => v.status !== undefined, { message: "cần ít nhất 1 thay đổi" });
const Out = z.object({ total: z.number() });
const text = (c: { type: string; text?: string }[]): string => c.map((x) => x.text ?? `[${x.type}]`).join("");

interface CallResult {
  isError?: boolean;
  content: { type: string; text?: string }[];
}
type Call = (name: string, args: Record<string, unknown>) => Promise<CallResult>;

async function probe(version: string, call: Call): Promise<void> {
  const show = async (label: string, name: string, args: Record<string, unknown>): Promise<void> => {
    try {
      const r = await call(name, args);
      console.log(`  ${label.padEnd(36)} → ${r.isError ? "result isError: " : "result: "}${text(r.content).slice(0, 110)}`);
    } catch (err) {
      console.log(`  ${label.padEnd(36)} → ném lỗi: ${String(err).slice(0, 110)}`);
    }
  };
  console.log(version);
  await show("A. input sai kiểu (status=1)", "obj", { id: "t1", status: 1 });
  await show("B. refine + đăng ký bằng .shape", "shape", { id: "t1" });
  await show("C. có outputSchema, trả isError", "fail", {});
  await show("D. structuredContent sai schema", "badout", {});
}

const handlers = {
  ok: async () => ({ content: [{ type: "text" as const, text: "handler chạy" }] }),
  fail: async () => ({ isError: true, content: [{ type: "text" as const, text: "lỗi nghiệp vụ" }] }),
  badout: async () => ({ structuredContent: { total: "nhiều" }, content: [{ type: "text" as const, text: "{}" }] }),
};

{
  const s = new S130({ name: "s", version: "1" });
  s.registerTool("obj", { inputSchema: Update }, handlers.ok);
  s.registerTool("shape", { inputSchema: Update.shape }, handlers.ok);
  s.registerTool("fail", { outputSchema: Out.shape }, handlers.fail);
  s.registerTool("badout", { outputSchema: Out.shape }, handlers.badout);
  const [a, b] = T130.createLinkedPair();
  await s.connect(b);
  const c = new C130({ name: "c", version: "1" });
  await c.connect(a);
  await probe("@modelcontextprotocol/sdk 1.30.1 (code bài)", async (name, args) => (await c.callTool({ name, arguments: args })) as CallResult);
  await c.close();
}
{
  const s = new S132({ name: "s", version: "1" });
  s.registerTool("obj", { inputSchema: Update }, handlers.ok);
  s.registerTool("shape", { inputSchema: Update.shape }, handlers.ok);
  s.registerTool("fail", { outputSchema: Out.shape }, handlers.fail);
  s.registerTool("badout", { outputSchema: Out.shape }, handlers.badout);
  const [a, b] = T132.createLinkedPair();
  await s.connect(b);
  const c = new C132({ name: "c", version: "1" });
  await c.connect(a);
  await probe("@modelcontextprotocol/sdk 1.32.0 (latest v1)", async (name, args) => (await c.callTool({ name, arguments: args })) as CallResult);
  await c.close();
}
{
  const s = new S2({ name: "s", version: "1" });
  s.registerTool("obj", { inputSchema: Update }, handlers.ok);
  s.registerTool("shape", { inputSchema: Update.shape }, handlers.ok);
  s.registerTool("fail", { outputSchema: Out }, handlers.fail);
  s.registerTool("badout", { outputSchema: Out }, handlers.badout);
  const [a, b] = T2.createLinkedPair();
  await s.connect(b);
  const c = new C2({ name: "c", version: "1" });
  await c.connect(a);
  await probe("@modelcontextprotocol/server 2.3.0 (v2)", async (name, args) => (await c.callTool({ name, arguments: args })) as CallResult);
  await c.close();
}
```
`lesson-code/m5-sdk/package.json`

```json
{
  "name": "m5-sdk-check",
  "private": true,
  "type": "module",
  "description": "So sánh 3 hành vi M5 dùng tới giữa SDK 1.30.1 (bài), 1.32.0 (latest) và v2",
  "dependencies": {
    "@modelcontextprotocol/client": "2.3.0",
    "@modelcontextprotocol/server": "2.3.0",
    "sdk130": "npm:@modelcontextprotocol/sdk@1.30.1",
    "sdk132": "npm:@modelcontextprotocol/sdk@1.32.0",
    "zod": "4.6.5"
  },
  "devDependencies": {
    "@types/node": "^22.20.5",
    "typescript": "^6.0.3"
  }
}
```

Code từng phần nằm ở tab **Code** của session tương ứng.

---

## S5.1 — File system & chống path traversal

Mục tiêu: cho tool đọc/ghi file trong **một** thư mục cho phép, và chứng minh bằng chính đòn tấn công rằng nó không đọc/ghi được gì khác — kể cả qua symlink, mã hóa, hay thư mục “anh em” cùng tiền tố.

### C# → TS/Node

| Khái niệm C# | Tương đương TS/Node | Khác ở đâu |
|---|---|---|
| `Path.Combine(root, input)` | `path.join(root, input)` | Cả hai **không** chặn `..`. Khác: `join(root, "/etc/passwd")` → `root/etc/passwd`, còn `Path.Combine` bỏ `root` khi input tuyệt đối |
| `Path.GetFullPath(...)` | `path.resolve(root, input)` | `resolve` với input tuyệt đối trả nguyên input (`/etc/passwd`) — giống `GetFullPath(Path.Combine(...))` |
| `full.StartsWith(root)` | `path.relative(root, full)` không bắt đầu bằng `..` | So theo **đoạn** đường dẫn, không theo chuỗi (Bẫy 2) |
| `FileInfo.ResolveLinkTarget(true)` | `fs.realpath(p)` | `realpath` giải **mọi** symlink trên đường đi, kể cả thư mục giữa chừng |
| `PhysicalFileProvider` (static files chặn `..` sẵn) | Không có sẵn — tự viết `files/safe-path.ts` | ASP.NET lo traversal cho static files; `node:fs` làm đúng thứ bạn bảo |
| `FileMode.CreateNew` | `open` với cờ `O_CREAT` + `O_EXCL` (flag `"wx"`) | `O_EXCL` cũng thất bại nếu tên đích là symlink — không bao giờ ghi xuyên symlink |
| `Uri.UnescapeDataString` | `decodeURIComponent` | Argument MCP là chuỗi JSON, **không** có tầng URL nào decode giúp — đừng tự decode (Bẫy 3) |
| `record SafePath` với private ctor | Branded type `string & { [SAFE]: true }` | Brand chỉ sống lúc compile; lúc chạy vẫn là `string` |

### Lab

#### Lab C50 — 19 Reading Files · 20 Writing and Defence

**Mục tiêu:** Lab 19 đọc file chỉ trong thư mục cho phép (allowed directory); Lab 20 ghi file và **chịu được** bộ test tấn công path traversal mà harness bắn vào server của bạn.

- [ ] Lab 19 xanh.
- [ ] Lab 20 xanh.

**Lệnh nghiệm thu** (trong repo C50, thư mục của lab — chưa chạy ở sandbox dựng bài):

```console
$ npm run check
```

Cần nắm để tự làm (không phải lời giải):

- Thư mục cho phép là **một** đường dẫn gốc lấy từ cấu hình; mọi path tool nhận là tương đối so với nó. Lấy đường dẫn thật của chính thư mục gốc 1 lần lúc khởi động (macOS: `/var` thật ra là `/private/var`).
- Tiêu đề Review của Lab 19 là đáp án về **thứ tự**: chuẩn hóa về đường dẫn tuyệt đối **rồi mới** so. So trên chuỗi thô (tìm `..`) thì mã hóa và `....//` qua mặt được.
- “Nằm trong thư mục” phải so theo đoạn đường dẫn. `startsWith` thô coi `/x/exports-evil` là nằm trong `/x/exports` (Bẫy 2 — output thật bên dưới).
- Symlink: chuẩn hóa theo chữ không biết symlink trỏ đi đâu. Đọc tài liệu `node:fs` về hàm trả **đường dẫn thật**.
- Lab 20 tấn công cả phía **ghi**: tên file có `../`, ghi đè file có sẵn, ghi xuyên symlink đã đặt sẵn. Đọc file test xem nó thử những gì — đó là checklist của bạn.
- Text lỗi trả cho model: không chứa đường dẫn tuyệt đối của server (model chép nó vào câu trả lời cho người dùng).

#### Lab Nexus S5.1 — thư mục export + 3 tool file

**Mục tiêu:** kế toán thả file vào thư mục export; model liệt kê được (`nexus_list_exports`), đọc phần đầu file văn bản (`nexus_read_export`), và xuất danh sách khách ra CSV mới (`nexus_export_customers`) — không bao giờ chạm được file nào ngoài thư mục đó.

- [ ] `pnpm --filter @nexus/mcp-server attack` → 14 dòng `✓ chặn`, `secret.env không bị ghi đè`, dòng cuối `OK: 0 lọt`.
- [ ] `../../etc/passwd` và các biến thể mã hóa (`%2F`, `%2e`, `%252f`, `....//`, `\`, NUL) đều bị chặn.
- [ ] Tool không tự gọi `fs` với path từ input: `grep -rnwE "readFile|writeFile" src/tools | wc -l` → `0`.
- [ ] Xuất trùng tên lần 2 → `isError` “đã có”; ghi đè chỉ khi `overwrite: true` và không bao giờ xuyên symlink.
- [ ] Text lỗi không có đường dẫn tuyệt đối; chi tiết lý do chỉ nằm ở stderr (`log.warn`).
- [ ] Hàm đọc/ghi chỉ nhận `SafePath`: truyền `string` thô là lỗi compile `TS2345`.

**Lệnh nghiệm thu:**

```console
$ pnpm --filter @nexus/mcp-server attack
$ cd apps/mcp-server
$ grep -rnwE "readFile|writeFile" src/tools | wc -l
$ node scripts/call.ts nexus_export_customers '{"filename":"khach-ha-noi.csv","city":"Hà Nội"}'
```

**Gợi ý hướng làm:** `packages/shared/src/exports.ts` (schema path + 3 schema I/O) → `apps/mcp-server/src/files/safe-path.ts` (3 lớp + `SafePath`) → 3 tool → `NEXUS_EXPORT_DIR` trong `env.ts` + `exportsDir` trong `Deps` → `scripts/attack-export.ts`. Viết script tấn công **trước** khi viết `safe-path.ts` — xem nó đỏ rồi mới làm cho xanh.

Output thật — server Nexus thật qua stdio, bãi thử có `/etc` thật, symlink thật:

```console
$ node scripts/attack-export.ts
thư mục cho phép: <tmp>/exports · 12 kiểu tấn công đọc + 2 kiểu tấn công ghi

✓ chặn  cổ điển          "../../../../../../etc/passwd"                   → -32602 schema
✓ chặn  tuyệt đối        "/etc/passwd"                                    → -32602 schema
✓ chặn  mã hóa %2F       "..%2F..%2F..%2F..%2F..%2F..%2Fetc%2Fpasswd"     → -32602 schema
✓ chặn  mã hóa %2e       "%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/etc/passwd"  → -32602 schema
✓ chặn  mã hóa 2 lần     "..%252f..%252fetc%252fpasswd"                   → -32602 schema
✓ chặn  ....//           "....//....//etc/passwd"                         → -32602 schema
✓ chặn  backslash        "..\\..\\secret.env"                             → -32602 schema
✓ chặn  đi vào rồi ra    "2026-09/../../secret.env"                       → -32602 schema
✓ chặn  thư mục anh em   "../exports-evil/secret.txt"                     → -32602 schema
✓ chặn  NUL byte         "bao-cao.md\u0000.png"                           → -32602 schema
✓ chặn  symlink file     "link-secret.txt"                                → isError
✓ chặn  symlink thư mục  "linkdir/passwd"                                 → isError
✓ chặn  ghi ra ngoài     {"filename":"../../tmp/x.csv"}                   → -32602 schema
✓ chặn  ghi đè symlink   {"filename":"khach.csv","overwrite":true}        → isError: Không ghi được "khach.csv". Chọn tên file khác.
✓ secret.env không bị ghi đè
✓ hợp lệ  đường thường     "2026-09/doanh-thu.csv"                          → ĐỌC ĐƯỢC: "thang,doanh_thu\n2026-09,1250000000\n"

OK: 0 lọt
```

Và 5 lời gọi bình thường (thư mục export mặc định `apps/mcp-server/var/exports`, đang trống):

```console
$ node scripts/call.ts nexus_export_customers '{"filename":"khach-ha-noi.csv","city":"Hà Nội"}'; node scripts/call.ts nexus_export_customers '{"filename":"khach-ha-noi.csv"}'; node scripts/call.ts nexus_list_exports; node scripts/call.ts nexus_read_export '{"path":"khach-ha-noi.csv","maxBytes":300}'; node scripts/call.ts nexus_read_export '{"path":"../../etc/passwd"}'
{"path":"khach-ha-noi.csv","rows":12,"bytes":1164}
[isError] File "khach-ha-noi.csv" đã có. Chọn tên khác, hoặc hỏi người dùng có muốn ghi đè (overwrite=true) không.
{"total":1,"returned":1,"items":[{"path":"khach-ha-noi.csv","bytes":1164,"modified":"2026-10-03T18:36:02.105Z"}]}
{"path":"khach-ha-noi.csv","mimeType":"text/csv","bytes":1164,"truncated":true,"text":"id,name,email,city,tier,createdAt\r\ncus_001,Công ty Sao Mai,lienhe@congtysaomai.vn,Hà Nội,pro,2025-01-01T00:00:00.000Z\r\ncus_002,Nhà sách Trí Tuệ,lienhe@nhasachtritue.vn,Hà Nội,free,2025-01-08T00:00:00.000Z\r\ncus_005,Studio Gỗ Mộc,lienhe@studiogomoc.vn,Hà Nội,pro,2025-01-29T00:00:00."}
[isError] MCP error -32602: Input validation error: Invalid arguments for tool nexus_read_export: path là đường dẫn tương đối trong thư mục export, ví dụ 2026-09/doanh-thu.csv at path
```

<details>
<summary>Xem sau khi làm xong — lời giải Lab Nexus S5.1</summary>

`apps/mcp-server/src/files/safe-path.ts`

```ts
import { constants, type Stats } from "node:fs";
import { mkdir, open, realpath, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Đọc/ghi file trong 1 thư mục cho phép (M5 · S5.1).
 *
 * 3 lớp, lớp sau không tin lớp trước:
 *   1. Schema (ExportPathSchema): chỉ cho ký tự an toàn — chặn "..", "%2e", "\", NUL ngay ở -32602.
 *   2. Chuẩn hóa về đường dẫn tuyệt đối (path.resolve) rồi mới so với root bằng path.relative.
 *   3. realpath: đi theo symlink tới file thật rồi so lại — symlink trong thư mục export trỏ ra ngoài bị chặn.
 * Mở file bằng O_NOFOLLOW; ghi file mới bằng O_EXCL (không bao giờ đi theo symlink có sẵn ở tên đích).
 */

declare const SAFE: unique symbol;
/** Đường dẫn tuyệt đối đã được CHỨNG MINH nằm trong root. Chỉ hàm trong file này tạo ra được. */
export type SafePath = string & { readonly [SAFE]: true };

export type Denied = { ok: false; reason: "outside" | "not_found" | "not_file" | "exists"; detail: string };
export type Resolved = { ok: true; path: SafePath; rel: string; stats: Stats };

const deny = (reason: Denied["reason"], detail: string): Denied => ({ ok: false, reason, detail });

/** Tạo thư mục export nếu chưa có và trả realpath của nó — root phải là đường dẫn thật (macOS: /var → /private/var). */
export async function openRoot(dir: string): Promise<string> {
  await mkdir(dir, { recursive: true });
  return realpath(dir);
}

/** p nằm TRONG root? So theo đoạn đường dẫn, không so chuỗi: "/srv/exports-evil" không nằm trong "/srv/exports". */
function within(root: string, p: string, allowRoot = false): boolean {
  const rel = path.relative(root, p);
  if (rel === "") return allowRoot;
  return rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel);
}

/** File đã tồn tại (để đọc). */
export async function resolveExisting(root: string, userPath: string): Promise<Resolved | Denied> {
  if (userPath.includes("\0")) return deny("outside", "có ký tự NUL");
  const lexical = path.resolve(root, userPath); // lớp 2
  if (!within(root, lexical)) return deny("outside", "chuẩn hóa xong nằm ngoài thư mục export");
  let real: string;
  try {
    real = await realpath(lexical); // lớp 3
  } catch (err) {
    if (isCode(err, "ENOENT") || isCode(err, "ENOTDIR")) return deny("not_found", "không có file này");
    throw err;
  }
  if (!within(root, real)) return deny("outside", "symlink trỏ ra ngoài thư mục export");
  const stats = await stat(real);
  if (!stats.isFile()) return deny("not_file", "không phải file thường");
  return { ok: true, path: real as SafePath, rel: path.relative(root, real), stats };
}

/** Tên file mới (để ghi) — thư mục cha phải có thật và nằm trong root. */
export async function resolveNew(root: string, userPath: string): Promise<{ ok: true; path: SafePath; rel: string } | Denied> {
  if (userPath.includes("\0")) return deny("outside", "có ký tự NUL");
  const lexical = path.resolve(root, userPath);
  if (!within(root, lexical)) return deny("outside", "chuẩn hóa xong nằm ngoài thư mục export");
  let parent: string;
  try {
    parent = await realpath(path.dirname(lexical));
  } catch {
    return deny("not_found", "thư mục cha không tồn tại");
  }
  if (!within(root, parent, true)) return deny("outside", "thư mục cha là symlink ra ngoài");
  const target = path.join(parent, path.basename(lexical));
  return { ok: true, path: target as SafePath, rel: path.relative(root, target) };
}

/** Đọc tối đa maxBytes đầu file. O_NOFOLLOW: nếu file vừa bị đổi thành symlink sau realpath → ELOOP. */
export async function readHead(p: SafePath, maxBytes: number): Promise<{ text: string; bytes: number; truncated: boolean }> {
  const fh = await open(p, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const { size } = await fh.stat();
    const buf = Buffer.alloc(Math.min(size, maxBytes));
    const { bytesRead } = await fh.read(buf, 0, buf.length, 0);
    // Không cắt giữa 1 ký tự UTF-8 nhiều byte
    let end = bytesRead;
    while (end > 0 && end < size && ((buf[end] ?? 0) & 0xc0) === 0x80) end--;
    return { text: buf.subarray(0, end).toString("utf8"), bytes: size, truncated: size > end };
  } finally {
    await fh.close();
  }
}

/** Ghi file. overwrite=false → O_EXCL (đã có, kể cả symlink, là lỗi); true → O_NOFOLLOW + O_TRUNC. */
export async function writeFileSafe(p: SafePath, data: string, overwrite: boolean): Promise<{ ok: true; bytes: number } | Denied> {
  const flags = overwrite
    ? constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW
    : constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL;
  let fh;
  try {
    fh = await open(p, flags, 0o644);
  } catch (err) {
    if (isCode(err, "EEXIST")) return deny("exists", "file đã có");
    if (isCode(err, "ELOOP")) return deny("outside", "tên đích là symlink");
    throw err;
  }
  try {
    await fh.writeFile(data, "utf8");
    return { ok: true, bytes: Buffer.byteLength(data) };
  } finally {
    await fh.close();
  }
}

function isCode(err: unknown, code: string): boolean {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === code;
}
```
`packages/shared/src/exports.ts`

```ts
import { z } from "zod";
import { CitySchema } from "./customer.ts";

/**
 * Đường dẫn tương đối trong thư mục export (M5 · S5.1) — lớp chặn thứ 1 (hình thức).
 * Mỗi đoạn bắt đầu bằng chữ/số → không có "..", ".", đoạn rỗng, "/" đầu, "\", "%", NUL.
 * Lớp 2–3 (resolve + realpath) vẫn bắt buộc ở server: regex không biết symlink.
 */
const SEGMENT = "[A-Za-z0-9][A-Za-z0-9._-]{0,63}";
export const ExportPathSchema = z
  .string()
  .max(200)
  .regex(new RegExp(`^${SEGMENT}(?:/${SEGMENT}){0,3}$`), "path là đường dẫn tương đối trong thư mục export, ví dụ 2026-09/doanh-thu.csv")
  .describe("Đường dẫn tương đối trong thư mục export, ví dụ 2026-09/doanh-thu.csv (lấy từ nexus_list_exports)");

export const EXPORT_TEXT_TYPES = { ".csv": "text/csv", ".md": "text/markdown", ".txt": "text/plain", ".json": "application/json" } as const;

export const ListExportsOutputSchema = z.object({
  total: z.number().int(),
  returned: z.number().int(),
  items: z.array(z.object({ path: z.string(), bytes: z.number().int(), modified: z.string() })),
});

export const ReadExportInputSchema = z.object({
  path: ExportPathSchema,
  maxBytes: z.number().int().min(256).max(32_000).default(8_000).describe("Đọc tối đa bấy nhiêu byte đầu file (256–32000)"),
});
export const ReadExportOutputSchema = z.object({
  path: z.string(),
  mimeType: z.string(),
  bytes: z.number().int().describe("Kích thước thật của file"),
  truncated: z.boolean(),
  text: z.string(),
});

export const ExportCustomersInputSchema = z.object({
  filename: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{0,59}\.csv$/, "filename chỉ gồm a-z, 0-9, dấu - và kết thúc .csv, ví dụ khach-ha-noi.csv")
    .describe("Tên file .csv (không có thư mục), ví dụ khach-ha-noi.csv"),
  city: CitySchema.optional(),
  overwrite: z.boolean().default(false).describe("true = ghi đè nếu file đã có"),
});
export const ExportCustomersOutputSchema = z.object({ path: z.string(), rows: z.number().int(), bytes: z.number().int() });
```
`apps/mcp-server/src/tools/read-export.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EXPORT_TEXT_TYPES, ReadExportInputSchema, ReadExportOutputSchema, TOOL } from "@nexus/shared";
import path from "node:path";
import type { Deps } from "../deps.ts";
import { readHead, resolveExisting } from "../files/safe-path.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

const mimeOf = (p: string): string | undefined => (EXPORT_TEXT_TYPES as Record<string, string>)[path.extname(p).toLowerCase()];

export function registerReadExport(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.readExport,
    {
      title: "Đọc file export",
      description:
        "Đọc phần đầu 1 file văn bản (.csv, .md, .txt, .json) trong thư mục export. path lấy từ nexus_list_exports. " +
        "File dài bị cắt ở maxBytes (truncated=true). Cần con số từ CSV (đếm, tổng theo cột) thì dùng nexus_analyze_export, đừng đọc thô.",
      inputSchema: ReadExportInputSchema.shape,
      outputSchema: ReadExportOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.readExport, deps.log, async ({ path: userPath, maxBytes }) => {
      const r = await resolveExisting(deps.exportsDir, userPath);
      if (!r.ok) {
        if (r.reason === "outside") {
          // Sự kiện bảo mật: log chi tiết ra stderr, model chỉ nhận câu chung
          deps.log.warn("export path denied", { path: userPath, detail: r.detail });
          return toolFail({ what: `Không đọc được "${userPath}": đường dẫn nằm ngoài thư mục export.`, next: "Chỉ dùng path do nexus_list_exports trả về." });
        }
        return toolFail({ what: `Không có file "${userPath}" trong thư mục export.`, next: "Gọi nexus_list_exports để xem các file hiện có." });
      }
      const mimeType = mimeOf(r.rel);
      if (!mimeType) {
        return toolFail({ what: `"${userPath}" không phải file văn bản (.csv, .md, .txt, .json).`, next: "Báo người dùng tải file này về để xem." });
      }
      const head = await readHead(r.path, maxBytes);
      return toolOk(ReadExportOutputSchema, { path: r.rel.split(path.sep).join("/"), mimeType, ...head });
    }),
  );
}
```
`apps/mcp-server/src/tools/export-customers.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExportCustomersInputSchema, ExportCustomersOutputSchema, TOOL, type Customer } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { resolveNew, writeFileSafe } from "../files/safe-path.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

const COLS = ["id", "name", "email", "city", "tier", "createdAt"] as const satisfies ReadonlyArray<keyof Customer>;

/** RFC 4180 + chặn CSV injection: ô bắt đầu bằng = + - @ bị Excel coi là công thức. */
export function csvCell(v: string): string {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function registerExportCustomers(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.exportCustomers,
    {
      title: "Xuất khách hàng ra CSV",
      description:
        "Ghi danh sách khách (có thể lọc theo thành phố) ra 1 file .csv mới trong thư mục export. " +
        "Không ghi đè file đã có trừ khi overwrite=true. Gọi khi người dùng muốn TẢI danh sách, không dùng để trả lời câu hỏi.",
      inputSchema: ExportCustomersInputSchema.shape,
      outputSchema: ExportCustomersOutputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    instrument(TOOL.exportCustomers, deps.log, async ({ filename, city, overwrite }) => {
      const target = await resolveNew(deps.exportsDir, filename);
      if (!target.ok) {
        deps.log.warn("export write denied", { filename, detail: target.detail });
        return toolFail({ what: `Không ghi được "${filename}".`, next: "Dùng tên file đơn giản như khach-ha-noi.csv." });
      }
      const page = await deps.customers.list({ city, limit: 100_000 });
      const lines = [COLS.join(","), ...page.items.map((c) => COLS.map((k) => csvCell(String(c[k]))).join(","))];
      const w = await writeFileSafe(target.path, `${lines.join("\r\n")}\r\n`, overwrite);
      if (!w.ok) {
        if (w.reason === "exists") return toolFail({ what: `File "${filename}" đã có.`, next: "Chọn tên khác, hoặc hỏi người dùng có muốn ghi đè (overwrite=true) không." });
        deps.log.warn("export write denied", { filename, detail: w.detail });
        return toolFail({ what: `Không ghi được "${filename}".`, next: "Chọn tên file khác." });
      }
      return toolOk(ExportCustomersOutputSchema, { path: target.rel, rows: page.items.length, bytes: w.bytes });
    }),
  );
}
```
`apps/mcp-server/src/tools/list-exports.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListExportsOutputSchema, TOOL } from "@nexus/shared";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolOk } from "../tool-result.ts";

const MAX_LISTED = 100;

export function registerListExports(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.listExports,
    {
      title: "Danh sách file export",
      description:
        "Liệt kê file trong thư mục export của Nexus (CSV, báo cáo…). Gọi trước nexus_read_export để lấy đúng path. " +
        "Chỉ liệt kê file thường; tối đa 100 file mới nhất.",
      outputSchema: ListExportsOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.listExports, deps.log, async () => {
      const entries = await readdir(deps.exportsDir, { recursive: true, withFileTypes: true });
      // Dirent.isFile() là false với symlink → symlink không bao giờ được liệt kê
      const files = await Promise.all(
        entries
          .filter((e) => e.isFile())
          .map(async (e) => {
            const abs = path.join(e.parentPath, e.name);
            const s = await stat(abs);
            return { path: path.relative(deps.exportsDir, abs).split(path.sep).join("/"), bytes: s.size, modified: s.mtime.toISOString() };
          }),
      );
      files.sort((a, b) => b.modified.localeCompare(a.modified) || a.path.localeCompare(b.path));
      const items = files.slice(0, MAX_LISTED);
      return toolOk(ListExportsOutputSchema, { total: files.length, returned: items.length, items });
    }),
  );
}
```

Đăng ký trong composition root (diff thật M4 baseline → S5.1):

`apps/mcp-server/src/server.ts`

```diff
 import { registerChartCustomersByCity } from "./tools/chart-customers-by-city.ts";
 import { registerDeleteCustomer } from "./tools/delete-customer.ts";
+import { registerExportCustomers } from "./tools/export-customers.ts";
 import { registerGenerateReport } from "./tools/generate-report.ts";
 import { registerGetCustomer } from "./tools/get-customer.ts";
 import { registerGetTime } from "./tools/get-time.ts";
 import { registerListCustomers } from "./tools/list-customers.ts";
+import { registerListExports } from "./tools/list-exports.ts";
 import { registerPing } from "./tools/ping.ts";
+import { registerReadExport } from "./tools/read-export.ts";
 import { registerSearchCustomers } from "./tools/search-customers.ts";
 import { registerUpdateCustomerTier } from "./tools/update-customer-tier.ts";
 export function createServer(deps: Deps): McpServer {
   const server = new McpServer(
-    { name: "nexus", version: "0.4.0" },
+    { name: "nexus", version: "0.5.0" },
     { instructions: INSTRUCTIONS, capabilities: { logging: {} } },
   );
   registerSearchCustomers(server, deps);
 
+  // M5 · S5.1 — file trong thư mục export
+  registerListExports(server, deps);
+  registerReadExport(server, deps);
+  registerExportCustomers(server, deps);
+
   // Resources + prompt (M4)
   registerDocs(server);
```

</details>

<details>
<summary>Tra khi test đỏ</summary>

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| `../exports-evil/secret.txt` đọc được | So `startsWith(root)` theo chuỗi | `path.relative` + kiểm đoạn đầu là `..` |
| Symlink trong thư mục export đọc được file ngoài | Chỉ chuẩn hóa theo chữ (`resolve`) | `realpath` rồi so lại lần 2 |
| `ENOENT` cho mọi file trên macOS dù file có | Root là `/var/...` nhưng `realpath` trả `/private/var/...` → mọi file bị coi là “ngoài” | `realpath` cả thư mục gốc 1 lần lúc khởi động (`openRoot`) |
| `-32602 … path là đường dẫn tương đối …` cho file hợp lệ có dấu cách / tiếng Việt | Regex của schema chặt hơn tên file thật | Đặt tên file export theo quy ước ASCII; hoặc nới regex nhưng **giữ** lớp 2–3 |
| Ghi đè mất file cũ | Ghi bằng `writeFile` mặc định (`"w"`) | `O_EXCL` khi tạo mới; `O_NOFOLLOW` + `O_TRUNC` khi ghi đè có chủ đích |
| Harness Lab 20 báo vẫn ghi được qua symlink | Kiểm path đúng nhưng mở file đi theo symlink | Cờ mở file không theo symlink ở thành phần cuối |
| Text lỗi lộ `/home/.../exports/...` | Đưa `err.message` của `fs` vào `toolFail` | Câu chung cho model, chi tiết ra stderr |
| `nexus_list_exports` liệt kê cả symlink | Lọc bằng `stat` (đi theo symlink) | `Dirent.isFile()` từ `readdir(..., { withFileTypes: true })` (`Dirent` = mục thư mục Node trả về) — `false` với symlink |

</details>

### Path đi qua những lớp nào

**Sơ đồ (Luồng quyết định) — Một path từ LLM phải qua những lớp nào trước khi chạm tới file?**

```mermaid
flowchart TD
    ev["path từ LLM"] --> q1{"1 · Schema: ký tự an toàn?"}
    q1 -- "qua" --> q2{"2 · resolve + relative: trong root?"}
    q2 -- "qua" --> q3{"3 · realpath: file thật trong root?"}
    q3 -- "qua" --> ok["✓ Đọc file (SafePath, O_NOFOLLOW)"]
    q1 -- "-32602" --> bad["✗ Chặn: isError, không lộ path"]
    q2 -- "outside" --> bad
    q3 -- "symlink" --> bad
```

**Đọc sơ đồ:** Đọc từ trên xuống. Mỗi lớp KHÔNG tin lớp trên: schema chặn ký tự, resolve chặn đi ra ngoài theo chữ, realpath chặn symlink. Rơi ở lớp nào cũng sang ô đỏ bên phải; chỉ qua cả 3 mới mở file (O_NOFOLLOW). *Màu: đỏ gạch + ✗ + viền đứt = bị chặn/sai · vàng mù tạt + ? + viền chấm = cần xem lại · xanh ô-liu + ✓ = chạy đúng. Nhãn mũi tên = kết quả của lớp đó.*


Mỗi lớp đứng **một mình** chặn được gì — chạy 7 kiểu tấn công qua từng lớp riêng (`lesson-code/m5/layers.ts`):

```console
$ node m5/layers.ts
kiểu tấn công    1 · schema   2 · resolve  2+3 · realpath
cổ điển          chặn         chặn         chặn (outside)
tuyệt đối        chặn         chặn         chặn (outside)
mã hóa %2F       chặn         lọt          chặn (not_found)
đi vào rồi ra    chặn         chặn         chặn (outside)
thư mục anh em   chặn         chặn         chặn (outside)
symlink file     lọt          lọt          chặn (outside)
symlink thư mục  lọt          lọt          chặn (outside)
```

Đọc bảng theo cột: schema chặn 5/7 nhưng **không** biết symlink (tên `link-secret.txt` hoàn toàn hợp lệ); `resolve` chặn đúng các kiểu “đi ra ngoài theo chữ” nhưng coi `..%2F..` là tên file bình thường (vô hại — không có file nào tên thế) và cũng không biết symlink; chỉ `realpath` thấy được file thật. Không lớp nào đủ một mình — Nexus chạy cả ba, và lớp sau không giả định lớp trước đã chạy.

### Phần khác C# thật sự

**1. `node:fs` không có `PhysicalFileProvider`.** ASP.NET Core static files từ chối `..` trước khi tới code của bạn. Trong Node, `readFile` mở đúng đường dẫn bạn đưa — kể cả `/etc/shadow` nếu process có quyền. Toàn bộ phòng thủ là code của bạn.

**2. `resolve` và `join` khác nhau với input tuyệt đối.** `path.join("/srv/exports", "/etc/passwd")` → `/srv/exports/etc/passwd` (an toàn tình cờ); `path.resolve("/srv/exports", "/etc/passwd")` → `/etc/passwd`. Dev “sửa” `join` thành `resolve` để chuẩn hóa mà quên bước so là mở toang cửa cho path tuyệt đối.

**3. Kiểm rồi mở là 2 syscall (TOCTOU — time-of-check/time-of-use: thứ được kiểm và thứ được dùng ở 2 thời điểm khác nhau).** Giữa `realpath` và `open`, ai có quyền ghi vào thư mục export có thể thay 1 thư mục con bằng symlink. `O_NOFOLLOW` chỉ bảo vệ **thành phần cuối**; Linux có `openat2(RESOLVE_BENEATH)` chặn trọn đường đi nhưng Node chưa có API này. Phần còn lại xử lý bằng vận hành: chỉ process Nexus (và người upload qua kênh riêng) được ghi vào thư mục export.

**4. Argument là JSON, không phải URL.** `"%2e%2e"` tới tool đúng 6 ký tự. Không có tầng nào decode giúp, nên bạn cũng đừng decode — schema của Nexus từ chối luôn ký tự `%`.

**5. Lỗi cho model ≠ lỗi cho người vận hành.** Model chép text lỗi vào câu trả lời. `toolFail` nói “nằm ngoài thư mục export”; `log.warn` ra stderr ghi lý do thật (`symlink trỏ ra ngoài thư mục export`) — đó là sự kiện bảo mật đáng cảnh báo ở M13.

### Bẫy dev .NET hay vấp

Cả 4 bẫy dưới chạy chung 1 bãi thử (`lesson-code/m5/fixture.ts`): `<tmp>/exports` là thư mục cho phép, `<tmp>/secret.env` và `<tmp>/exports-evil/secret.txt` là bí mật, `link-secret.txt` và `linkdir` là symlink có sẵn trong thư mục cho phép.

#### Bẫy 1 — `File.ReadAllText(Path.Combine(root, input))` dịch thẳng

`lesson-code/m5/traps/naive-join.ts`

```ts
// Bẫy 1 — dịch thẳng File.ReadAllText(Path.Combine(root, input)): path.join không chặn gì.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { runAttacks } from "../fixture.ts";

async function readExport(root: string, userPath: string): Promise<string> {
  return readFile(path.join(root, userPath), "utf8");
}

await runAttacks("path.join(root, input)", readExport);
```

```console
$ node m5/traps/naive-join.ts
path.join(root, input)
  ✗ LỌT  cổ điển          "../../../../../../etc/passwd"                 → root:x:0:0:root:/root:/bin/bash
  ✓ chặn tuyệt đối        "/etc/passwd"                                  → lỗi ENOENT
  ✓ chặn mã hóa %2F       "..%2F..%2F..%2F..%2F..%2F..%2Fetc%2Fpasswd"   → lỗi ENOENT
  ✗ LỌT  đi vào rồi ra    "2026-09/../../secret.env"                     → MONGO_URI=mongodb://admin:hunter2@db:27017
  ✗ LỌT  thư mục anh em   "../exports-evil/secret.txt"                   → BI_MAT: thư mục anh em cùng tiền tố
  ✗ LỌT  symlink file     "link-secret.txt"                              → MONGO_URI=mongodb://admin:hunter2@db:27017
  ✗ LỌT  symlink thư mục  "linkdir/passwd"                               → root:x:0:0:root:/root:/bin/bash
  5/7 lọt
```

`path.join` chuẩn hóa `..` — tức là nó **giúp** kẻ tấn công đi ra ngoài gọn gàng. 2 dòng “chặn” chỉ là may: `join` biến `/etc/passwd` thành `<root>/etc/passwd` (không tồn tại), còn `%2F` chưa được decode.

#### Bẫy 2 — chuẩn hóa rồi `startsWith(root)`

`lesson-code/m5/traps/startswith.ts`

```ts
// Bẫy 2 — chuẩn hóa rồi so bằng startsWith(root): thư mục anh em cùng tiền tố lọt, symlink lọt.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { runAttacks } from "../fixture.ts";

async function readExport(root: string, userPath: string): Promise<string> {
  const abs = path.resolve(root, userPath);
  if (!abs.startsWith(root)) throw Object.assign(new Error("denied"), { code: "DENIED" });
  return readFile(abs, "utf8");
}

await runAttacks("resolve + startsWith(root)", readExport);
```

```console
$ node m5/traps/startswith.ts
resolve + startsWith(root)
  ✓ chặn cổ điển          "../../../../../../etc/passwd"                 → lỗi DENIED
  ✓ chặn tuyệt đối        "/etc/passwd"                                  → lỗi DENIED
  ✓ chặn mã hóa %2F       "..%2F..%2F..%2F..%2F..%2F..%2Fetc%2Fpasswd"   → lỗi ENOENT
  ✓ chặn đi vào rồi ra    "2026-09/../../secret.env"                     → lỗi DENIED
  ✗ LỌT  thư mục anh em   "../exports-evil/secret.txt"                   → BI_MAT: thư mục anh em cùng tiền tố
  ✗ LỌT  symlink file     "link-secret.txt"                              → MONGO_URI=mongodb://admin:hunter2@db:27017
  ✗ LỌT  symlink thư mục  "linkdir/passwd"                               → root:x:0:0:root:/root:/bin/bash
  3/7 lọt
```

Đã đúng thứ tự (chuẩn hóa trước), nhưng `"/tmp/x/exports-evil/secret.txt".startsWith("/tmp/x/exports")` là `true`. Thư mục anh em cùng tiền tố có thật: `exports` và `exports-old`, `data` và `data-backup`. Sửa chuỗi bằng `root + path.sep` thì đúng, nhưng `path.relative` nói thẳng ý định hơn và xử lý luôn trường hợp khác ổ đĩa trên Windows.

#### Bẫy 3 — kiểm `../` trên chuỗi thô rồi mới decode

Quen `Request.Path` của ASP.NET đã decode sẵn, dev thêm 1 bước decode “cho chắc”:

`lesson-code/m5/traps/decode-after-check.ts`

```ts
// Bẫy 3 — kiểm ".." trên chuỗi THÔ rồi mới decodeURIComponent (giống Request.Path đã decode 1 lần ở ASP.NET).
import { readFile } from "node:fs/promises";
import path from "node:path";
import { runAttacks } from "../fixture.ts";

async function readExport(root: string, userPath: string): Promise<string> {
  if (userPath.includes("../") || path.isAbsolute(userPath)) throw Object.assign(new Error("denied"), { code: "DENIED" });
  const decoded = decodeURIComponent(userPath); // "..%2F..%2Fetc%2Fpasswd" → "../../etc/passwd" SAU khi đã kiểm
  return readFile(path.join(root, decoded), "utf8");
}

await runAttacks("kiểm chuỗi thô → decode → join", readExport);
```

```console
$ node m5/traps/decode-after-check.ts
kiểm chuỗi thô → decode → join
  ✓ chặn cổ điển          "../../../../../../etc/passwd"                 → lỗi DENIED
  ✓ chặn tuyệt đối        "/etc/passwd"                                  → lỗi DENIED
  ✗ LỌT  mã hóa %2F       "..%2F..%2F..%2F..%2F..%2F..%2Fetc%2Fpasswd"   → root:x:0:0:root:/root:/bin/bash
  ✓ chặn đi vào rồi ra    "2026-09/../../secret.env"                     → lỗi DENIED
  ✓ chặn thư mục anh em   "../exports-evil/secret.txt"                   → lỗi DENIED
  ✗ LỌT  symlink file     "link-secret.txt"                              → MONGO_URI=mongodb://admin:hunter2@db:27017
  ✗ LỌT  symlink thư mục  "linkdir/passwd"                               → root:x:0:0:root:/root:/bin/bash
  3/7 lọt
```

Thứ tự “kiểm → biến đổi → dùng” luôn sai: thứ được kiểm không phải thứ được dùng. Quy tắc: biến đổi xong hết rồi mới kiểm, trên đúng giá trị sẽ đưa vào `open`. Với MCP thì đơn giản hơn: đừng biến đổi gì cả.

#### Bẫy 4 — làm đúng mọi thứ trừ symlink

`lesson-code/m5/traps/no-realpath.ts`

```ts
// Bẫy 4 — resolve + relative đúng chuẩn nhưng KHÔNG realpath: symlink trong thư mục export trỏ ra ngoài vẫn lọt.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { runAttacks } from "../fixture.ts";

async function readExport(root: string, userPath: string): Promise<string> {
  const abs = path.resolve(root, userPath);
  const rel = path.relative(root, abs);
  if (rel === "" || rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw Object.assign(new Error("denied"), { code: "DENIED" });
  }
  return readFile(abs, "utf8"); // readFile đi theo symlink
}

await runAttacks("resolve + relative, không realpath", readExport);
```

```console
$ node m5/traps/no-realpath.ts
resolve + relative, không realpath
  ✓ chặn cổ điển          "../../../../../../etc/passwd"                 → lỗi DENIED
  ✓ chặn tuyệt đối        "/etc/passwd"                                  → lỗi DENIED
  ✓ chặn mã hóa %2F       "..%2F..%2F..%2F..%2F..%2F..%2Fetc%2Fpasswd"   → lỗi ENOENT
  ✓ chặn đi vào rồi ra    "2026-09/../../secret.env"                     → lỗi DENIED
  ✓ chặn thư mục anh em   "../exports-evil/secret.txt"                   → lỗi DENIED
  ✗ LỌT  symlink file     "link-secret.txt"                              → MONGO_URI=mongodb://admin:hunter2@db:27017
  ✗ LỌT  symlink thư mục  "linkdir/passwd"                               → root:x:0:0:root:/root:/bin/bash
  2/7 lọt
```

Code này qua mọi review “chuẩn” về path traversal. Symlink trong thư mục cho phép đến từ đâu? Từ người upload file nén (zip/tar giữ symlink), từ script đồng bộ, từ một tool khác của chính bạn. `realpath` một lần là hết.

#### Bẫy 5 — truyền chuỗi thô vào hàm đọc

`lesson-code/m5/tsc-traps/unsafe-path.ts`

```ts
import { readHead } from "../../../nexus/apps/mcp-server/src/files/safe-path.ts";

export const peek = (userPath: string) => readHead(userPath, 1024);
```

> ❌ **TS2345** (dòng 3, cột 52): Argument of type 'string' is not assignable to parameter of type 'SafePath'. Type 'string' is not assignable to type '{ readonly [SAFE]: true; }'.

Lỗi bạn **muốn** có: `readHead` và `writeFileSafe` chỉ nhận `SafePath`, mà `SafePath` chỉ sinh ra từ `resolveExisting`/`resolveNew`. Tool mới viết 3 tháng sau không thể quên kiểm path — compiler không cho.

### Code mẫu & pattern

#### Code production

`apps/mcp-server/src/files/safe-path.ts`

```ts
import { constants, type Stats } from "node:fs";
import { mkdir, open, realpath, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Đọc/ghi file trong 1 thư mục cho phép (M5 · S5.1).
 *
 * 3 lớp, lớp sau không tin lớp trước:
 *   1. Schema (ExportPathSchema): chỉ cho ký tự an toàn — chặn "..", "%2e", "\", NUL ngay ở -32602.
 *   2. Chuẩn hóa về đường dẫn tuyệt đối (path.resolve) rồi mới so với root bằng path.relative.
 *   3. realpath: đi theo symlink tới file thật rồi so lại — symlink trong thư mục export trỏ ra ngoài bị chặn.
 * Mở file bằng O_NOFOLLOW; ghi file mới bằng O_EXCL (không bao giờ đi theo symlink có sẵn ở tên đích).
 */

declare const SAFE: unique symbol;
/** Đường dẫn tuyệt đối đã được CHỨNG MINH nằm trong root. Chỉ hàm trong file này tạo ra được. */
export type SafePath = string & { readonly [SAFE]: true };

export type Denied = { ok: false; reason: "outside" | "not_found" | "not_file" | "exists"; detail: string };
export type Resolved = { ok: true; path: SafePath; rel: string; stats: Stats };

const deny = (reason: Denied["reason"], detail: string): Denied => ({ ok: false, reason, detail });

/** Tạo thư mục export nếu chưa có và trả realpath của nó — root phải là đường dẫn thật (macOS: /var → /private/var). */
export async function openRoot(dir: string): Promise<string> {
  await mkdir(dir, { recursive: true });
  return realpath(dir);
}

/** p nằm TRONG root? So theo đoạn đường dẫn, không so chuỗi: "/srv/exports-evil" không nằm trong "/srv/exports". */
function within(root: string, p: string, allowRoot = false): boolean {
  const rel = path.relative(root, p);
  if (rel === "") return allowRoot;
  return rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel);
}

/** File đã tồn tại (để đọc). */
export async function resolveExisting(root: string, userPath: string): Promise<Resolved | Denied> {
  if (userPath.includes("\0")) return deny("outside", "có ký tự NUL");
  const lexical = path.resolve(root, userPath); // lớp 2
  if (!within(root, lexical)) return deny("outside", "chuẩn hóa xong nằm ngoài thư mục export");
  let real: string;
  try {
    real = await realpath(lexical); // lớp 3
  } catch (err) {
    if (isCode(err, "ENOENT") || isCode(err, "ENOTDIR")) return deny("not_found", "không có file này");
    throw err;
  }
  if (!within(root, real)) return deny("outside", "symlink trỏ ra ngoài thư mục export");
  const stats = await stat(real);
  if (!stats.isFile()) return deny("not_file", "không phải file thường");
  return { ok: true, path: real as SafePath, rel: path.relative(root, real), stats };
}

/** Tên file mới (để ghi) — thư mục cha phải có thật và nằm trong root. */
export async function resolveNew(root: string, userPath: string): Promise<{ ok: true; path: SafePath; rel: string } | Denied> {
  if (userPath.includes("\0")) return deny("outside", "có ký tự NUL");
  const lexical = path.resolve(root, userPath);
  if (!within(root, lexical)) return deny("outside", "chuẩn hóa xong nằm ngoài thư mục export");
  let parent: string;
  try {
    parent = await realpath(path.dirname(lexical));
  } catch {
    return deny("not_found", "thư mục cha không tồn tại");
  }
  if (!within(root, parent, true)) return deny("outside", "thư mục cha là symlink ra ngoài");
  const target = path.join(parent, path.basename(lexical));
  return { ok: true, path: target as SafePath, rel: path.relative(root, target) };
}

/** Đọc tối đa maxBytes đầu file. O_NOFOLLOW: nếu file vừa bị đổi thành symlink sau realpath → ELOOP. */
export async function readHead(p: SafePath, maxBytes: number): Promise<{ text: string; bytes: number; truncated: boolean }> {
  const fh = await open(p, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const { size } = await fh.stat();
    const buf = Buffer.alloc(Math.min(size, maxBytes));
    const { bytesRead } = await fh.read(buf, 0, buf.length, 0);
    // Không cắt giữa 1 ký tự UTF-8 nhiều byte
    let end = bytesRead;
    while (end > 0 && end < size && ((buf[end] ?? 0) & 0xc0) === 0x80) end--;
    return { text: buf.subarray(0, end).toString("utf8"), bytes: size, truncated: size > end };
  } finally {
    await fh.close();
  }
}

/** Ghi file. overwrite=false → O_EXCL (đã có, kể cả symlink, là lỗi); true → O_NOFOLLOW + O_TRUNC. */
export async function writeFileSafe(p: SafePath, data: string, overwrite: boolean): Promise<{ ok: true; bytes: number } | Denied> {
  const flags = overwrite
    ? constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW
    : constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL;
  let fh;
  try {
    fh = await open(p, flags, 0o644);
  } catch (err) {
    if (isCode(err, "EEXIST")) return deny("exists", "file đã có");
    if (isCode(err, "ELOOP")) return deny("outside", "tên đích là symlink");
    throw err;
  }
  try {
    await fh.writeFile(data, "utf8");
    return { ok: true, bytes: Buffer.byteLength(data) };
  } finally {
    await fh.close();
  }
}

function isCode(err: unknown, code: string): boolean {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === code;
}
```
`apps/mcp-server/src/tools/read-export.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EXPORT_TEXT_TYPES, ReadExportInputSchema, ReadExportOutputSchema, TOOL } from "@nexus/shared";
import path from "node:path";
import type { Deps } from "../deps.ts";
import { readHead, resolveExisting } from "../files/safe-path.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

const mimeOf = (p: string): string | undefined => (EXPORT_TEXT_TYPES as Record<string, string>)[path.extname(p).toLowerCase()];

export function registerReadExport(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.readExport,
    {
      title: "Đọc file export",
      description:
        "Đọc phần đầu 1 file văn bản (.csv, .md, .txt, .json) trong thư mục export. path lấy từ nexus_list_exports. " +
        "File dài bị cắt ở maxBytes (truncated=true). Cần con số từ CSV (đếm, tổng theo cột) thì dùng nexus_analyze_export, đừng đọc thô.",
      inputSchema: ReadExportInputSchema.shape,
      outputSchema: ReadExportOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.readExport, deps.log, async ({ path: userPath, maxBytes }) => {
      const r = await resolveExisting(deps.exportsDir, userPath);
      if (!r.ok) {
        if (r.reason === "outside") {
          // Sự kiện bảo mật: log chi tiết ra stderr, model chỉ nhận câu chung
          deps.log.warn("export path denied", { path: userPath, detail: r.detail });
          return toolFail({ what: `Không đọc được "${userPath}": đường dẫn nằm ngoài thư mục export.`, next: "Chỉ dùng path do nexus_list_exports trả về." });
        }
        return toolFail({ what: `Không có file "${userPath}" trong thư mục export.`, next: "Gọi nexus_list_exports để xem các file hiện có." });
      }
      const mimeType = mimeOf(r.rel);
      if (!mimeType) {
        return toolFail({ what: `"${userPath}" không phải file văn bản (.csv, .md, .txt, .json).`, next: "Báo người dùng tải file này về để xem." });
      }
      const head = await readHead(r.path, maxBytes);
      return toolOk(ReadExportOutputSchema, { path: r.rel.split(path.sep).join("/"), mimeType, ...head });
    }),
  );
}
```
`apps/mcp-server/src/tools/export-customers.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExportCustomersInputSchema, ExportCustomersOutputSchema, TOOL, type Customer } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { resolveNew, writeFileSafe } from "../files/safe-path.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

const COLS = ["id", "name", "email", "city", "tier", "createdAt"] as const satisfies ReadonlyArray<keyof Customer>;

/** RFC 4180 + chặn CSV injection: ô bắt đầu bằng = + - @ bị Excel coi là công thức. */
export function csvCell(v: string): string {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function registerExportCustomers(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.exportCustomers,
    {
      title: "Xuất khách hàng ra CSV",
      description:
        "Ghi danh sách khách (có thể lọc theo thành phố) ra 1 file .csv mới trong thư mục export. " +
        "Không ghi đè file đã có trừ khi overwrite=true. Gọi khi người dùng muốn TẢI danh sách, không dùng để trả lời câu hỏi.",
      inputSchema: ExportCustomersInputSchema.shape,
      outputSchema: ExportCustomersOutputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    instrument(TOOL.exportCustomers, deps.log, async ({ filename, city, overwrite }) => {
      const target = await resolveNew(deps.exportsDir, filename);
      if (!target.ok) {
        deps.log.warn("export write denied", { filename, detail: target.detail });
        return toolFail({ what: `Không ghi được "${filename}".`, next: "Dùng tên file đơn giản như khach-ha-noi.csv." });
      }
      const page = await deps.customers.list({ city, limit: 100_000 });
      const lines = [COLS.join(","), ...page.items.map((c) => COLS.map((k) => csvCell(String(c[k]))).join(","))];
      const w = await writeFileSafe(target.path, `${lines.join("\r\n")}\r\n`, overwrite);
      if (!w.ok) {
        if (w.reason === "exists") return toolFail({ what: `File "${filename}" đã có.`, next: "Chọn tên khác, hoặc hỏi người dùng có muốn ghi đè (overwrite=true) không." });
        deps.log.warn("export write denied", { filename, detail: w.detail });
        return toolFail({ what: `Không ghi được "${filename}".`, next: "Chọn tên file khác." });
      }
      return toolOk(ExportCustomersOutputSchema, { path: target.rel, rows: page.items.length, bytes: w.bytes });
    }),
  );
}
```

`csvCell` trong `export-customers.ts` chặn thêm **CSV injection**: ô bắt đầu bằng `=`, `+`, `-`, `@` bị Excel chạy như công thức khi kế toán mở file. Dữ liệu khách do người ngoài nhập — tên công ty `=HYPERLINK(...)` là chuyện có thật.

#### Pattern: Parse, don't validate — `SafePath` branded

**Vấn đề:** kiểm path là việc bắt buộc trước mọi lần đọc/ghi. Nếu kết quả kiểm là `boolean` thì không gì buộc người gọi phải kiểm, hay phải dùng đúng giá trị đã kiểm.

**Tương đương C#:** value object `record SafePath` có constructor `private` + `static bool TryCreate(string root, string input, out SafePath path)`; các service chỉ nhận `SafePath`.

**Dịch thẳng vs kiểu TS:**

`lesson-code/m5/patterns/path-validator.direct.ts`

```ts
// Dịch thẳng từ C#: class validator trả bool, hàm đọc nhận string — không gì buộc phải gọi IsValid trước.
import { readFile } from "node:fs/promises";
import path from "node:path";

export interface IPathValidator {
  isValid(userPath: string): boolean;
}

export class ExportPathValidator implements IPathValidator {
  private readonly root: string;
  constructor(root: string) {
    this.root = root;
  }
  isValid(userPath: string): boolean {
    const full = path.resolve(this.root, userPath);
    return full.startsWith(this.root);
  }
}

export class ExportFileService {
  private readonly root: string;
  private readonly validator: IPathValidator;
  constructor(root: string, validator: IPathValidator) {
    this.root = root;
    this.validator = validator;
  }
  async read(userPath: string): Promise<string> {
    if (!this.validator.isValid(userPath)) throw new Error("Invalid path");
    return readFile(path.resolve(this.root, userPath), "utf8");
  }
  // Thêm 1 tính năng 3 tháng sau — quên gọi validator, vẫn compile
  async size(userPath: string): Promise<number> {
    const text = await readFile(path.resolve(this.root, userPath), "utf8");
    return text.length;
  }
}
```
`apps/mcp-server/src/files/safe-path.ts`

```ts
import { constants, type Stats } from "node:fs";
import { mkdir, open, realpath, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Đọc/ghi file trong 1 thư mục cho phép (M5 · S5.1).
 *
 * 3 lớp, lớp sau không tin lớp trước:
 *   1. Schema (ExportPathSchema): chỉ cho ký tự an toàn — chặn "..", "%2e", "\", NUL ngay ở -32602.
 *   2. Chuẩn hóa về đường dẫn tuyệt đối (path.resolve) rồi mới so với root bằng path.relative.
 *   3. realpath: đi theo symlink tới file thật rồi so lại — symlink trong thư mục export trỏ ra ngoài bị chặn.
 * Mở file bằng O_NOFOLLOW; ghi file mới bằng O_EXCL (không bao giờ đi theo symlink có sẵn ở tên đích).
 */

declare const SAFE: unique symbol;
/** Đường dẫn tuyệt đối đã được CHỨNG MINH nằm trong root. Chỉ hàm trong file này tạo ra được. */
export type SafePath = string & { readonly [SAFE]: true };

export type Denied = { ok: false; reason: "outside" | "not_found" | "not_file" | "exists"; detail: string };
export type Resolved = { ok: true; path: SafePath; rel: string; stats: Stats };

const deny = (reason: Denied["reason"], detail: string): Denied => ({ ok: false, reason, detail });

/** Tạo thư mục export nếu chưa có và trả realpath của nó — root phải là đường dẫn thật (macOS: /var → /private/var). */
export async function openRoot(dir: string): Promise<string> {
  await mkdir(dir, { recursive: true });
  return realpath(dir);
}

/** p nằm TRONG root? So theo đoạn đường dẫn, không so chuỗi: "/srv/exports-evil" không nằm trong "/srv/exports". */
function within(root: string, p: string, allowRoot = false): boolean {
  const rel = path.relative(root, p);
  if (rel === "") return allowRoot;
  return rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel);
}

/** File đã tồn tại (để đọc). */
export async function resolveExisting(root: string, userPath: string): Promise<Resolved | Denied> {
  if (userPath.includes("\0")) return deny("outside", "có ký tự NUL");
  const lexical = path.resolve(root, userPath); // lớp 2
  if (!within(root, lexical)) return deny("outside", "chuẩn hóa xong nằm ngoài thư mục export");
  let real: string;
  try {
    real = await realpath(lexical); // lớp 3
  } catch (err) {
    if (isCode(err, "ENOENT") || isCode(err, "ENOTDIR")) return deny("not_found", "không có file này");
    throw err;
  }
  if (!within(root, real)) return deny("outside", "symlink trỏ ra ngoài thư mục export");
  const stats = await stat(real);
  if (!stats.isFile()) return deny("not_file", "không phải file thường");
  return { ok: true, path: real as SafePath, rel: path.relative(root, real), stats };
}

/** Tên file mới (để ghi) — thư mục cha phải có thật và nằm trong root. */
export async function resolveNew(root: string, userPath: string): Promise<{ ok: true; path: SafePath; rel: string } | Denied> {
  if (userPath.includes("\0")) return deny("outside", "có ký tự NUL");
  const lexical = path.resolve(root, userPath);
  if (!within(root, lexical)) return deny("outside", "chuẩn hóa xong nằm ngoài thư mục export");
  let parent: string;
  try {
    parent = await realpath(path.dirname(lexical));
  } catch {
    return deny("not_found", "thư mục cha không tồn tại");
  }
  if (!within(root, parent, true)) return deny("outside", "thư mục cha là symlink ra ngoài");
  const target = path.join(parent, path.basename(lexical));
  return { ok: true, path: target as SafePath, rel: path.relative(root, target) };
}

/** Đọc tối đa maxBytes đầu file. O_NOFOLLOW: nếu file vừa bị đổi thành symlink sau realpath → ELOOP. */
export async function readHead(p: SafePath, maxBytes: number): Promise<{ text: string; bytes: number; truncated: boolean }> {
  const fh = await open(p, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const { size } = await fh.stat();
    const buf = Buffer.alloc(Math.min(size, maxBytes));
    const { bytesRead } = await fh.read(buf, 0, buf.length, 0);
    // Không cắt giữa 1 ký tự UTF-8 nhiều byte
    let end = bytesRead;
    while (end > 0 && end < size && ((buf[end] ?? 0) & 0xc0) === 0x80) end--;
    return { text: buf.subarray(0, end).toString("utf8"), bytes: size, truncated: size > end };
  } finally {
    await fh.close();
  }
}

/** Ghi file. overwrite=false → O_EXCL (đã có, kể cả symlink, là lỗi); true → O_NOFOLLOW + O_TRUNC. */
export async function writeFileSafe(p: SafePath, data: string, overwrite: boolean): Promise<{ ok: true; bytes: number } | Denied> {
  const flags = overwrite
    ? constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW
    : constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL;
  let fh;
  try {
    fh = await open(p, flags, 0o644);
  } catch (err) {
    if (isCode(err, "EEXIST")) return deny("exists", "file đã có");
    if (isCode(err, "ELOOP")) return deny("outside", "tên đích là symlink");
    throw err;
  }
  try {
    await fh.writeFile(data, "utf8");
    return { ok: true, bytes: Buffer.byteLength(data) };
  } finally {
    await fh.close();
  }
}

function isCode(err: unknown, code: string): boolean {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === code;
}
```

- Bản dịch thẳng: interface + class validator trả `bool` + service nhận `string`. Validator còn mang luôn Bẫy 2 (`startsWith`). Hàm `size()` thêm sau quên gọi validator — compile sạch, lỗ bảo mật thật.
- Bản TS: **hàm** trả union `Resolved | Denied`; nhánh thành công mang `SafePath` — kiểu chỉ file này tạo được (`declare const SAFE: unique symbol` không export). Hàm đọc/ghi nhận `SafePath` → quên kiểm là lỗi compile (Bẫy 5). Không class, không interface validator, không DI.
- Kết quả kiểm là **giá trị** chứa lý do (`outside` / `not_found` / `exists`) — tool tự chọn câu trả lời cho model, không cần exception filter.

**Khi nào KHÔNG dùng:** giá trị không có hàm “nguy hiểm” nào tiêu thụ — brand cho mọi `string` (email, tên, mô tả) chỉ thêm ép kiểu vô ích. Brand không thay được kiểm lúc chạy: dữ liệu từ ngoài vào (LLM, HTTP, DB) vẫn phải qua hàm parse. Và đừng `as SafePath` ở chỗ khác ngoài `safe-path.ts` — làm vậy là tắt chính cái khóa bạn vừa lắp.

### Trắc nghiệm S5.1

1. Theo bảng `layers.ts` (output thật), path `link-secret.txt` bị lớp nào chặn?
   - A. Lớp 1 — schema, vì có dấu chấm
   - B. Lớp 2 — `resolve` + `relative`
   - C. Chỉ lớp 3 — `realpath`: tên hợp lệ và nằm trong root theo chữ, nhưng file thật nằm ngoài

   <details><summary>Đáp án</summary>

   **C.** Đó là lý do lớp 3 bắt buộc dù đã có 2 lớp trước. Bỏ `realpath` là lộ `hunter2` (Bẫy 4).

   </details>

2. Root là `/tmp/x/exports`. Code: `path.resolve(root, p).startsWith(root)`. Path nào lọt (output thật)?
   - A. `../../../../../../etc/passwd`
   - B. `../exports-evil/secret.txt`
   - C. `/etc/passwd`

   <details><summary>Đáp án</summary>

   **B.** `/tmp/x/exports-evil/...` bắt đầu bằng chuỗi `/tmp/x/exports`. So theo đoạn bằng `path.relative`.

   </details>

3. Vì sao `nexus_export_customers` mở file mới bằng `O_EXCL` chứ không kiểm `exists()` rồi mới `writeFile`?
   - A. `O_EXCL` kiểm và tạo trong 1 syscall, và thất bại nếu tên đích là symlink — không có khe giữa kiểm và ghi
   - B. Vì `fs.exists` đã bị xóa khỏi Node
   - C. Vì `writeFile` không ghi được CSV

   <details><summary>Đáp án</summary>

   **A.** Kiểm rồi ghi là 2 bước — kẻ tấn công chen symlink vào giữa. Output thật: “ghi đè symlink → isError”, `secret.env` không đổi.

   </details>


---

## S5.1 · Cheat Sheet

### 3 lớp, theo thứ tự

| Lớp | Code | Chặn | Không chặn |
|---|---|---|---|
| 1 · Schema | `ExportPathSchema` (regex mỗi đoạn bắt đầu bằng chữ/số) | `..`, `/` đầu, `\`, `%`, NUL — trả `-32602` | symlink |
| 2 · Chuẩn hóa | `path.resolve(root, p)` + `path.relative` không bắt đầu `..` | đi ra ngoài theo chữ, thư mục anh em | symlink |
| 3 · Đường dẫn thật | `fs.realpath` rồi so lại | symlink file, symlink thư mục | đổi symlink sau khi kiểm (TOCTOU) |
| + Mở file | `O_NOFOLLOW` (đọc, ghi đè), `O_EXCL` (tạo mới) | symlink ở thành phần cuối | — |

### Hàm trong `files/safe-path.ts`

| Hàm | Dùng khi | Trả |
|---|---|---|
| `openRoot(dir)` | Khởi động | `realpath` của thư mục gốc |
| `resolveExisting(root, p)` | Đọc file có sẵn | `{ ok, path: SafePath, rel, stats }` hoặc `reason`: `outside` / `not_found` / `not_file` |
| `resolveNew(root, p)` | Tạo file | `SafePath` của tên mới (cha đã `realpath`) |
| `readHead(SafePath, maxBytes)` | Đọc phần đầu | `text`, `bytes`, `truncated` (không cắt giữa ký tự UTF-8) |
| `writeFileSafe(SafePath, data, overwrite)` | Ghi | `bytes` hoặc `reason`: `exists` / `outside` |

### Lệnh

```console
$ node scripts/attack-export.ts
$ node scripts/call.ts nexus_list_exports
$ node scripts/call.ts nexus_read_export '{"path":"khach-ha-noi.csv","maxBytes":300}'
```

### Pattern của session

| Pattern | Session | Tương đương C# / .NET | Dùng khi |
|---|---|---|---|
| Parse, don't validate: `SafePath` branded | S5.1 | Value object có private ctor + `TryCreate` (`record SafePath`) | Giá trị đã kiểm mang kiểu riêng; hàm nguy hiểm (đọc/ghi file) chỉ nhận kiểu đó |



---

## S5.1 · Code

### Cây thư mục

```txt
nexus/
├─ packages/shared/src/exports.ts            ExportPathSchema, 3 cặp schema I/O
├─ apps/mcp-server/src/
│  ├─ env.ts                                 NEXUS_EXPORT_DIR
│  ├─ files/safe-path.ts                     SafePath, openRoot, resolveExisting, resolveNew, readHead, writeFileSafe
│  └─ tools/list-exports.ts · read-export.ts · export-customers.ts
└─ apps/mcp-server/scripts/attack-export.ts  14 kiểu tấn công vào server thật
lesson-code/m5/
├─ fixture.ts · layers.ts
├─ traps/naive-join.ts · startswith.ts · decode-after-check.ts · no-realpath.ts
├─ tsc-traps/unsafe-path.ts
└─ patterns/path-validator.direct.ts
```

### packages/shared

`packages/shared/src/exports.ts`

```ts
import { z } from "zod";
import { CitySchema } from "./customer.ts";

/**
 * Đường dẫn tương đối trong thư mục export (M5 · S5.1) — lớp chặn thứ 1 (hình thức).
 * Mỗi đoạn bắt đầu bằng chữ/số → không có "..", ".", đoạn rỗng, "/" đầu, "\", "%", NUL.
 * Lớp 2–3 (resolve + realpath) vẫn bắt buộc ở server: regex không biết symlink.
 */
const SEGMENT = "[A-Za-z0-9][A-Za-z0-9._-]{0,63}";
export const ExportPathSchema = z
  .string()
  .max(200)
  .regex(new RegExp(`^${SEGMENT}(?:/${SEGMENT}){0,3}$`), "path là đường dẫn tương đối trong thư mục export, ví dụ 2026-09/doanh-thu.csv")
  .describe("Đường dẫn tương đối trong thư mục export, ví dụ 2026-09/doanh-thu.csv (lấy từ nexus_list_exports)");

export const EXPORT_TEXT_TYPES = { ".csv": "text/csv", ".md": "text/markdown", ".txt": "text/plain", ".json": "application/json" } as const;

export const ListExportsOutputSchema = z.object({
  total: z.number().int(),
  returned: z.number().int(),
  items: z.array(z.object({ path: z.string(), bytes: z.number().int(), modified: z.string() })),
});

export const ReadExportInputSchema = z.object({
  path: ExportPathSchema,
  maxBytes: z.number().int().min(256).max(32_000).default(8_000).describe("Đọc tối đa bấy nhiêu byte đầu file (256–32000)"),
});
export const ReadExportOutputSchema = z.object({
  path: z.string(),
  mimeType: z.string(),
  bytes: z.number().int().describe("Kích thước thật của file"),
  truncated: z.boolean(),
  text: z.string(),
});

export const ExportCustomersInputSchema = z.object({
  filename: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{0,59}\.csv$/, "filename chỉ gồm a-z, 0-9, dấu - và kết thúc .csv, ví dụ khach-ha-noi.csv")
    .describe("Tên file .csv (không có thư mục), ví dụ khach-ha-noi.csv"),
  city: CitySchema.optional(),
  overwrite: z.boolean().default(false).describe("true = ghi đè nếu file đã có"),
});
export const ExportCustomersOutputSchema = z.object({ path: z.string(), rows: z.number().int(), bytes: z.number().int() });
```

### apps/mcp-server

`apps/mcp-server/src/files/safe-path.ts`

```ts
import { constants, type Stats } from "node:fs";
import { mkdir, open, realpath, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Đọc/ghi file trong 1 thư mục cho phép (M5 · S5.1).
 *
 * 3 lớp, lớp sau không tin lớp trước:
 *   1. Schema (ExportPathSchema): chỉ cho ký tự an toàn — chặn "..", "%2e", "\", NUL ngay ở -32602.
 *   2. Chuẩn hóa về đường dẫn tuyệt đối (path.resolve) rồi mới so với root bằng path.relative.
 *   3. realpath: đi theo symlink tới file thật rồi so lại — symlink trong thư mục export trỏ ra ngoài bị chặn.
 * Mở file bằng O_NOFOLLOW; ghi file mới bằng O_EXCL (không bao giờ đi theo symlink có sẵn ở tên đích).
 */

declare const SAFE: unique symbol;
/** Đường dẫn tuyệt đối đã được CHỨNG MINH nằm trong root. Chỉ hàm trong file này tạo ra được. */
export type SafePath = string & { readonly [SAFE]: true };

export type Denied = { ok: false; reason: "outside" | "not_found" | "not_file" | "exists"; detail: string };
export type Resolved = { ok: true; path: SafePath; rel: string; stats: Stats };

const deny = (reason: Denied["reason"], detail: string): Denied => ({ ok: false, reason, detail });

/** Tạo thư mục export nếu chưa có và trả realpath của nó — root phải là đường dẫn thật (macOS: /var → /private/var). */
export async function openRoot(dir: string): Promise<string> {
  await mkdir(dir, { recursive: true });
  return realpath(dir);
}

/** p nằm TRONG root? So theo đoạn đường dẫn, không so chuỗi: "/srv/exports-evil" không nằm trong "/srv/exports". */
function within(root: string, p: string, allowRoot = false): boolean {
  const rel = path.relative(root, p);
  if (rel === "") return allowRoot;
  return rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel);
}

/** File đã tồn tại (để đọc). */
export async function resolveExisting(root: string, userPath: string): Promise<Resolved | Denied> {
  if (userPath.includes("\0")) return deny("outside", "có ký tự NUL");
  const lexical = path.resolve(root, userPath); // lớp 2
  if (!within(root, lexical)) return deny("outside", "chuẩn hóa xong nằm ngoài thư mục export");
  let real: string;
  try {
    real = await realpath(lexical); // lớp 3
  } catch (err) {
    if (isCode(err, "ENOENT") || isCode(err, "ENOTDIR")) return deny("not_found", "không có file này");
    throw err;
  }
  if (!within(root, real)) return deny("outside", "symlink trỏ ra ngoài thư mục export");
  const stats = await stat(real);
  if (!stats.isFile()) return deny("not_file", "không phải file thường");
  return { ok: true, path: real as SafePath, rel: path.relative(root, real), stats };
}

/** Tên file mới (để ghi) — thư mục cha phải có thật và nằm trong root. */
export async function resolveNew(root: string, userPath: string): Promise<{ ok: true; path: SafePath; rel: string } | Denied> {
  if (userPath.includes("\0")) return deny("outside", "có ký tự NUL");
  const lexical = path.resolve(root, userPath);
  if (!within(root, lexical)) return deny("outside", "chuẩn hóa xong nằm ngoài thư mục export");
  let parent: string;
  try {
    parent = await realpath(path.dirname(lexical));
  } catch {
    return deny("not_found", "thư mục cha không tồn tại");
  }
  if (!within(root, parent, true)) return deny("outside", "thư mục cha là symlink ra ngoài");
  const target = path.join(parent, path.basename(lexical));
  return { ok: true, path: target as SafePath, rel: path.relative(root, target) };
}

/** Đọc tối đa maxBytes đầu file. O_NOFOLLOW: nếu file vừa bị đổi thành symlink sau realpath → ELOOP. */
export async function readHead(p: SafePath, maxBytes: number): Promise<{ text: string; bytes: number; truncated: boolean }> {
  const fh = await open(p, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const { size } = await fh.stat();
    const buf = Buffer.alloc(Math.min(size, maxBytes));
    const { bytesRead } = await fh.read(buf, 0, buf.length, 0);
    // Không cắt giữa 1 ký tự UTF-8 nhiều byte
    let end = bytesRead;
    while (end > 0 && end < size && ((buf[end] ?? 0) & 0xc0) === 0x80) end--;
    return { text: buf.subarray(0, end).toString("utf8"), bytes: size, truncated: size > end };
  } finally {
    await fh.close();
  }
}

/** Ghi file. overwrite=false → O_EXCL (đã có, kể cả symlink, là lỗi); true → O_NOFOLLOW + O_TRUNC. */
export async function writeFileSafe(p: SafePath, data: string, overwrite: boolean): Promise<{ ok: true; bytes: number } | Denied> {
  const flags = overwrite
    ? constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW
    : constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL;
  let fh;
  try {
    fh = await open(p, flags, 0o644);
  } catch (err) {
    if (isCode(err, "EEXIST")) return deny("exists", "file đã có");
    if (isCode(err, "ELOOP")) return deny("outside", "tên đích là symlink");
    throw err;
  }
  try {
    await fh.writeFile(data, "utf8");
    return { ok: true, bytes: Buffer.byteLength(data) };
  } finally {
    await fh.close();
  }
}

function isCode(err: unknown, code: string): boolean {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === code;
}
```
`apps/mcp-server/src/tools/list-exports.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListExportsOutputSchema, TOOL } from "@nexus/shared";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolOk } from "../tool-result.ts";

const MAX_LISTED = 100;

export function registerListExports(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.listExports,
    {
      title: "Danh sách file export",
      description:
        "Liệt kê file trong thư mục export của Nexus (CSV, báo cáo…). Gọi trước nexus_read_export để lấy đúng path. " +
        "Chỉ liệt kê file thường; tối đa 100 file mới nhất.",
      outputSchema: ListExportsOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.listExports, deps.log, async () => {
      const entries = await readdir(deps.exportsDir, { recursive: true, withFileTypes: true });
      // Dirent.isFile() là false với symlink → symlink không bao giờ được liệt kê
      const files = await Promise.all(
        entries
          .filter((e) => e.isFile())
          .map(async (e) => {
            const abs = path.join(e.parentPath, e.name);
            const s = await stat(abs);
            return { path: path.relative(deps.exportsDir, abs).split(path.sep).join("/"), bytes: s.size, modified: s.mtime.toISOString() };
          }),
      );
      files.sort((a, b) => b.modified.localeCompare(a.modified) || a.path.localeCompare(b.path));
      const items = files.slice(0, MAX_LISTED);
      return toolOk(ListExportsOutputSchema, { total: files.length, returned: items.length, items });
    }),
  );
}
```
`apps/mcp-server/src/tools/read-export.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EXPORT_TEXT_TYPES, ReadExportInputSchema, ReadExportOutputSchema, TOOL } from "@nexus/shared";
import path from "node:path";
import type { Deps } from "../deps.ts";
import { readHead, resolveExisting } from "../files/safe-path.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

const mimeOf = (p: string): string | undefined => (EXPORT_TEXT_TYPES as Record<string, string>)[path.extname(p).toLowerCase()];

export function registerReadExport(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.readExport,
    {
      title: "Đọc file export",
      description:
        "Đọc phần đầu 1 file văn bản (.csv, .md, .txt, .json) trong thư mục export. path lấy từ nexus_list_exports. " +
        "File dài bị cắt ở maxBytes (truncated=true). Cần con số từ CSV (đếm, tổng theo cột) thì dùng nexus_analyze_export, đừng đọc thô.",
      inputSchema: ReadExportInputSchema.shape,
      outputSchema: ReadExportOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.readExport, deps.log, async ({ path: userPath, maxBytes }) => {
      const r = await resolveExisting(deps.exportsDir, userPath);
      if (!r.ok) {
        if (r.reason === "outside") {
          // Sự kiện bảo mật: log chi tiết ra stderr, model chỉ nhận câu chung
          deps.log.warn("export path denied", { path: userPath, detail: r.detail });
          return toolFail({ what: `Không đọc được "${userPath}": đường dẫn nằm ngoài thư mục export.`, next: "Chỉ dùng path do nexus_list_exports trả về." });
        }
        return toolFail({ what: `Không có file "${userPath}" trong thư mục export.`, next: "Gọi nexus_list_exports để xem các file hiện có." });
      }
      const mimeType = mimeOf(r.rel);
      if (!mimeType) {
        return toolFail({ what: `"${userPath}" không phải file văn bản (.csv, .md, .txt, .json).`, next: "Báo người dùng tải file này về để xem." });
      }
      const head = await readHead(r.path, maxBytes);
      return toolOk(ReadExportOutputSchema, { path: r.rel.split(path.sep).join("/"), mimeType, ...head });
    }),
  );
}
```
`apps/mcp-server/src/tools/export-customers.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExportCustomersInputSchema, ExportCustomersOutputSchema, TOOL, type Customer } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { resolveNew, writeFileSafe } from "../files/safe-path.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

const COLS = ["id", "name", "email", "city", "tier", "createdAt"] as const satisfies ReadonlyArray<keyof Customer>;

/** RFC 4180 + chặn CSV injection: ô bắt đầu bằng = + - @ bị Excel coi là công thức. */
export function csvCell(v: string): string {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function registerExportCustomers(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.exportCustomers,
    {
      title: "Xuất khách hàng ra CSV",
      description:
        "Ghi danh sách khách (có thể lọc theo thành phố) ra 1 file .csv mới trong thư mục export. " +
        "Không ghi đè file đã có trừ khi overwrite=true. Gọi khi người dùng muốn TẢI danh sách, không dùng để trả lời câu hỏi.",
      inputSchema: ExportCustomersInputSchema.shape,
      outputSchema: ExportCustomersOutputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    instrument(TOOL.exportCustomers, deps.log, async ({ filename, city, overwrite }) => {
      const target = await resolveNew(deps.exportsDir, filename);
      if (!target.ok) {
        deps.log.warn("export write denied", { filename, detail: target.detail });
        return toolFail({ what: `Không ghi được "${filename}".`, next: "Dùng tên file đơn giản như khach-ha-noi.csv." });
      }
      const page = await deps.customers.list({ city, limit: 100_000 });
      const lines = [COLS.join(","), ...page.items.map((c) => COLS.map((k) => csvCell(String(c[k]))).join(","))];
      const w = await writeFileSafe(target.path, `${lines.join("\r\n")}\r\n`, overwrite);
      if (!w.ok) {
        if (w.reason === "exists") return toolFail({ what: `File "${filename}" đã có.`, next: "Chọn tên khác, hoặc hỏi người dùng có muốn ghi đè (overwrite=true) không." });
        deps.log.warn("export write denied", { filename, detail: w.detail });
        return toolFail({ what: `Không ghi được "${filename}".`, next: "Chọn tên file khác." });
      }
      return toolOk(ExportCustomersOutputSchema, { path: target.rel, rows: page.items.length, bytes: w.bytes });
    }),
  );
}
```
`apps/mcp-server/scripts/attack-export.ts`

```ts
// node scripts/attack-export.ts — tự tấn công server Nexus thật (stdio) bằng path traversal. Thoát 1 nếu có gì lọt.
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { TOOL } from "@nexus/shared";
import { mkdir, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { connect } from "./client.ts";

// Bãi thử: <tmp>/exports là thư mục cho phép; mọi thứ khác là "bí mật"
const base = await mkdtemp(path.join(tmpdir(), "nexus-attack-"));
const root = path.join(base, "exports");
await mkdir(path.join(root, "2026-09"), { recursive: true });
await mkdir(path.join(base, "exports-evil"));
await writeFile(path.join(root, "2026-09", "doanh-thu.csv"), "thang,doanh_thu\n2026-09,1250000000\n");
await writeFile(path.join(root, "bao-cao.md"), "# Báo cáo tuần\n");
await writeFile(path.join(base, "exports-evil", "secret.txt"), "BI_MAT: thư mục anh em cùng tiền tố\n");
await writeFile(path.join(base, "secret.env"), "MONGO_URI=mongodb://admin:hunter2@db:27017\n");
await symlink(path.join(base, "secret.env"), path.join(root, "link-secret.txt")); // file symlink ra ngoài
await symlink("/etc", path.join(root, "linkdir")); // thư mục symlink ra ngoài
await symlink(path.join(base, "secret.env"), path.join(root, "khach.csv")); // bẫy cho lệnh GHI

const LEAK = /root:x:0|BI_MAT|hunter2/;
const client = await connect({ NEXUS_EXPORT_DIR: root });

async function call(name: string, args: Record<string, unknown>): Promise<{ text: string; how: string }> {
  try {
    const r = (await client.callTool({ name, arguments: args })) as CallToolResult;
    const text = r.content.map((c) => (c.type === "text" ? c.text : "")).join(" ");
    const how = r.isError ? (text.includes("-32602") ? "-32602 schema" : "isError") : "ĐỌC ĐƯỢC";
    return { text, how };
  } catch (err) {
    return { text: String(err), how: "protocol error" };
  }
}

const READS: Array<[string, string]> = [
  ["cổ điển", "../../../../../../etc/passwd"],
  ["tuyệt đối", "/etc/passwd"],
  ["mã hóa %2F", "..%2F..%2F..%2F..%2F..%2F..%2Fetc%2Fpasswd"],
  ["mã hóa %2e", "%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/etc/passwd"],
  ["mã hóa 2 lần", "..%252f..%252fetc%252fpasswd"],
  ["....//", "....//....//etc/passwd"],
  ["backslash", "..\\..\\secret.env"],
  ["đi vào rồi ra", "2026-09/../../secret.env"],
  ["thư mục anh em", "../exports-evil/secret.txt"],
  ["NUL byte", "bao-cao.md\u0000.png"],
  ["symlink file", "link-secret.txt"],
  ["symlink thư mục", "linkdir/passwd"],
];

let leaked = 0;
console.log(`thư mục cho phép: <tmp>/exports · ${READS.length} kiểu tấn công đọc + 2 kiểu tấn công ghi\n`);
for (const [label, p] of READS) {
  const { text, how } = await call(TOOL.readExport, { path: p });
  const bad = LEAK.test(text);
  if (bad) leaked++;
  console.log(`${bad ? "✗ LỌT " : "✓ chặn"}  ${label.padEnd(16)} ${JSON.stringify(p).padEnd(48)} → ${how}`);
}

// Ghi: tên file có ../ và ghi đè qua symlink có sẵn
const before = await readFile(path.join(base, "secret.env"), "utf8");
for (const [label, args] of [
  ["ghi ra ngoài", { filename: "../../tmp/x.csv" }],
  ["ghi đè symlink", { filename: "khach.csv", overwrite: true }],
] as const) {
  const { how, text } = await call(TOOL.exportCustomers, args);
  console.log(`✓ chặn  ${label.padEnd(16)} ${JSON.stringify(args).padEnd(48)} → ${how}${how === "isError" ? `: ${text.slice(0, 60)}` : ""}`);
}
const after = await readFile(path.join(base, "secret.env"), "utf8");
if (after !== before) leaked++;
console.log(`${after === before ? "✓" : "✗"} secret.env không bị ghi đè`);

const ok = await call(TOOL.readExport, { path: "2026-09/doanh-thu.csv" });
console.log(`✓ hợp lệ  ${"đường thường".padEnd(16)} ${JSON.stringify("2026-09/doanh-thu.csv").padEnd(48)} → ${ok.how}: ${JSON.stringify(JSON.parse(ok.text).text)}`);

await client.close();
console.log(`\n${leaked === 0 ? "OK: 0 lọt" : `${leaked} LỌT`}`);
process.exit(leaked === 0 ? 0 : 1);
```

### lesson-code

`lesson-code/m5/fixture.ts`

```ts
// Bãi thử path traversal dùng chung cho các script S5.1: <tmp>/exports là thư mục cho phép.
import { mkdir, mkdtemp, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export const ATTACKS: ReadonlyArray<readonly [label: string, path: string]> = [
  ["cổ điển", "../../../../../../etc/passwd"],
  ["tuyệt đối", "/etc/passwd"],
  ["mã hóa %2F", "..%2F..%2F..%2F..%2F..%2F..%2Fetc%2Fpasswd"],
  ["đi vào rồi ra", "2026-09/../../secret.env"],
  ["thư mục anh em", "../exports-evil/secret.txt"],
  ["symlink file", "link-secret.txt"],
  ["symlink thư mục", "linkdir/passwd"],
];

export const LEAK = /root:x:0|BI_MAT|hunter2/;

export async function makeFixture(): Promise<{ base: string; root: string }> {
  const base = await mkdtemp(path.join(tmpdir(), "m5-fixture-"));
  const root = path.join(base, "exports");
  await mkdir(path.join(root, "2026-09"), { recursive: true });
  await mkdir(path.join(base, "exports-evil"));
  await writeFile(path.join(root, "2026-09", "doanh-thu.csv"), "thang,doanh_thu\n2026-09,1250000000\n");
  await writeFile(path.join(base, "exports-evil", "secret.txt"), "BI_MAT: thư mục anh em cùng tiền tố\n");
  await writeFile(path.join(base, "secret.env"), "MONGO_URI=mongodb://admin:hunter2@db:27017\n");
  await symlink(path.join(base, "secret.env"), path.join(root, "link-secret.txt"));
  await symlink("/etc", path.join(root, "linkdir"));
  return { base, root };
}

/** Chạy 1 hàm đọc với mọi kiểu tấn công, in ✓ chặn / ✗ LỌT + dòng đầu của thứ bị lọt. */
export async function runAttacks(name: string, read: (root: string, p: string) => Promise<string>): Promise<void> {
  const { root } = await makeFixture();
  let leaked = 0;
  console.log(name);
  for (const [label, p] of ATTACKS) {
    let out: string;
    try {
      out = await read(root, p);
    } catch (err) {
      out = `lỗi ${(err as NodeJS.ErrnoException).code ?? String(err)}`;
    }
    const bad = LEAK.test(out);
    if (bad) leaked++;
    console.log(`  ${bad ? "✗ LỌT " : "✓ chặn"} ${label.padEnd(16)} ${JSON.stringify(p).padEnd(46)} ${bad ? `→ ${out.split("\n")[0]}` : `→ ${out.slice(0, 40)}`}`);
  }
  console.log(`  ${leaked}/${ATTACKS.length} lọt`);
}
```
`lesson-code/m5/layers.ts`

```ts
// Mỗi lớp phòng thủ của Nexus chặn được gì khi đứng MỘT MÌNH (không cộng lớp khác).
import { ExportPathSchema } from "../../nexus/packages/shared/src/exports.ts";
import { resolveExisting } from "../../nexus/apps/mcp-server/src/files/safe-path.ts";
import path from "node:path";
import { ATTACKS, makeFixture } from "./fixture.ts";

const { root } = await makeFixture();
const within = (p: string): boolean => {
  const rel = path.relative(root, path.resolve(root, p));
  return rel !== "" && rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel);
};

console.log(`${"kiểu tấn công".padEnd(16)} ${"1 · schema".padEnd(12)} ${"2 · resolve".padEnd(12)} ${"2+3 · realpath"}`);
for (const [label, p] of ATTACKS) {
  const l1 = ExportPathSchema.safeParse(p).success ? "lọt" : "chặn";
  const l2 = within(p) ? "lọt" : "chặn";
  const r = await resolveExisting(root, p);
  const l3 = r.ok ? "lọt" : `chặn (${r.reason})`;
  console.log(`${label.padEnd(16)} ${l1.padEnd(12)} ${l2.padEnd(12)} ${l3}`);
}
```
`lesson-code/m5/traps/naive-join.ts`

```ts
// Bẫy 1 — dịch thẳng File.ReadAllText(Path.Combine(root, input)): path.join không chặn gì.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { runAttacks } from "../fixture.ts";

async function readExport(root: string, userPath: string): Promise<string> {
  return readFile(path.join(root, userPath), "utf8");
}

await runAttacks("path.join(root, input)", readExport);
```
`lesson-code/m5/traps/startswith.ts`

```ts
// Bẫy 2 — chuẩn hóa rồi so bằng startsWith(root): thư mục anh em cùng tiền tố lọt, symlink lọt.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { runAttacks } from "../fixture.ts";

async function readExport(root: string, userPath: string): Promise<string> {
  const abs = path.resolve(root, userPath);
  if (!abs.startsWith(root)) throw Object.assign(new Error("denied"), { code: "DENIED" });
  return readFile(abs, "utf8");
}

await runAttacks("resolve + startsWith(root)", readExport);
```
`lesson-code/m5/traps/decode-after-check.ts`

```ts
// Bẫy 3 — kiểm ".." trên chuỗi THÔ rồi mới decodeURIComponent (giống Request.Path đã decode 1 lần ở ASP.NET).
import { readFile } from "node:fs/promises";
import path from "node:path";
import { runAttacks } from "../fixture.ts";

async function readExport(root: string, userPath: string): Promise<string> {
  if (userPath.includes("../") || path.isAbsolute(userPath)) throw Object.assign(new Error("denied"), { code: "DENIED" });
  const decoded = decodeURIComponent(userPath); // "..%2F..%2Fetc%2Fpasswd" → "../../etc/passwd" SAU khi đã kiểm
  return readFile(path.join(root, decoded), "utf8");
}

await runAttacks("kiểm chuỗi thô → decode → join", readExport);
```
`lesson-code/m5/traps/no-realpath.ts`

```ts
// Bẫy 4 — resolve + relative đúng chuẩn nhưng KHÔNG realpath: symlink trong thư mục export trỏ ra ngoài vẫn lọt.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { runAttacks } from "../fixture.ts";

async function readExport(root: string, userPath: string): Promise<string> {
  const abs = path.resolve(root, userPath);
  const rel = path.relative(root, abs);
  if (rel === "" || rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw Object.assign(new Error("denied"), { code: "DENIED" });
  }
  return readFile(abs, "utf8"); // readFile đi theo symlink
}

await runAttacks("resolve + relative, không realpath", readExport);
```
`lesson-code/m5/patterns/path-validator.direct.ts`

```ts
// Dịch thẳng từ C#: class validator trả bool, hàm đọc nhận string — không gì buộc phải gọi IsValid trước.
import { readFile } from "node:fs/promises";
import path from "node:path";

export interface IPathValidator {
  isValid(userPath: string): boolean;
}

export class ExportPathValidator implements IPathValidator {
  private readonly root: string;
  constructor(root: string) {
    this.root = root;
  }
  isValid(userPath: string): boolean {
    const full = path.resolve(this.root, userPath);
    return full.startsWith(this.root);
  }
}

export class ExportFileService {
  private readonly root: string;
  private readonly validator: IPathValidator;
  constructor(root: string, validator: IPathValidator) {
    this.root = root;
    this.validator = validator;
  }
  async read(userPath: string): Promise<string> {
    if (!this.validator.isValid(userPath)) throw new Error("Invalid path");
    return readFile(path.resolve(this.root, userPath), "utf8");
  }
  // Thêm 1 tính năng 3 tháng sau — quên gọi validator, vẫn compile
  async size(userPath: string): Promise<number> {
    const text = await readFile(path.resolve(this.root, userPath), "utf8");
    return text.length;
  }
}
```

---

## S5.2 — Database read-only & publish schema

Mục tiêu: cho LLM truy vấn DB bằng filter tự viết mà **không** chạy được mã trên DB, **không** ghi được gì (kể cả khi code có lỗ), và viết đúng field ngay lần đầu nhờ đọc schema trước.

### C# → TS/Node

| Khái niệm C# | Tương đương TS/Node | Khác ở đâu |
|---|---|---|
| Login SQL chỉ `db_datareader`, `ApplicationIntent=ReadOnly` | User Mongo role `read` + kết nối riêng `MONGO_READONLY_URI` | Quyền nằm ở DB — đúng kể cả khi code có lỗ |
| `AsNoTracking()` | — | `AsNoTracking` không chặn ghi gì cả; đừng nhầm nó với read-only |
| OData `$filter` với `AllowedFunctions`, `AllowedQueryOptions` | Filter JSON kiểu Mongo do LLM viết + `checkFilter` | OData có allow-list sẵn; driver Mongo nhận **mọi** toán tử, kể cả `$where` chạy JS |
| `JObject` / `[JsonExtensionData]` | `z.record(z.string(), z.unknown())` | Zod chỉ bảo đảm “là object”; nội dung phải tự duyệt đệ quy |
| Swagger / `INFORMATION_SCHEMA` | Resource `nexus://schema` sinh từ Zod (`z.toJSONSchema`) | Model không tự gọi được resource (M4) — host đưa vào context |
| `IReadOnlyRepository<T>` | `interface ReadOnlyStore { find() }` | Không có hàm ghi trên **kiểu** → gọi nhầm là lỗi compile |
| `new Regex(p, opts, TimeSpan.FromMs(100))` | `new RegExp(p)` — **không** có timeout | Chặn mẫu ReDoS (regex backtracking chạy hàng giây) trước (`(a+)+`); `maxTimeMS` của Mongo là lưới cuối |
| Câu SQL tham số hóa | Filter là object, không ghép chuỗi | Không có SQL injection kiểu chuỗi, nhưng có **operator injection** |

### Lab

#### Lab C50 — 21 SQLite Reads · 22 Publishing a Schema

**Mục tiêu:** Lab 21 chạy truy vấn trên kết nối **read-only** và quyết định validation “chỉ SELECT” phải đi xa tới đâu; Lab 22 biến định nghĩa bảng thành resource để AI đọc trước khi truy vấn.

- [ ] Lab 21 xanh.
- [ ] Lab 22 xanh.

**Lệnh nghiệm thu** (repo C50 — chưa chạy ở sandbox dựng bài):

```console
$ npm run check
```

Cần nắm để tự làm:

- Lab 21 có 2 lớp: **kết nối** mở ở chế độ chỉ đọc của driver SQLite mà lab dùng (đọc tài liệu driver: cờ khi mở DB), và **kiểm câu lệnh** để trả lỗi dễ hiểu. Bẫy 2 bên dưới chạy thật cho thấy vì sao lớp 2 không bao giờ đủ một mình.
- Câu Review “validation chỉ cho SELECT phải đi xa tới đâu”: regex trên chữ đầu câu thua `WITH … DELETE`, nhiều câu lệnh nối bằng `;`, `PRAGMA`, `ATTACH`. Nhiều driver SQLite cho biết 1 câu lệnh đã biên dịch có ghi hay không — tìm thuộc tính đó trong tài liệu driver thay vì tự phân tích SQL.
- Luôn giới hạn số dòng trả về; harness có thể chạy `SELECT *` trên bảng lớn.
- Lab 22: lấy định nghĩa bảng từ **catalog của chính SQLite** (bảng hệ thống / `PRAGMA`), không viết tay — schema đổi là resource đổi theo. Trình bày cho model đọc (tên cột, kiểu, ràng buộc), không cần đẹp cho người.
- Câu Review “giá trị của việc để AI đọc trước”: model biết tên cột thật nên viết đúng ở lần gọi đầu, thay vì đoán `customer_name`, ăn lỗi, rồi đoán lại.

#### Lab Nexus S5.2 — `nexus_query` chỉ đọc + `nexus://schema`

**Mục tiêu:** tool truy vấn tổng quát trên `customers` và `orders` bằng filter kiểu Mongo; chỉ toán tử đọc trong allow-list; schema publish thành resource sinh từ Zod; bản Mongo kết nối bằng user `nexus_reader` chỉ có role `read`.

- [ ] `node scripts/read.ts nexus://schema` → `text/markdown`, có bảng field từng collection và mục “Toán tử”.
- [ ] `node scripts/query-probe.ts` → 2 dòng `✓`, 8 dòng `✗`; dòng `✗` chỉ đúng chỗ sai (ví dụ `tại "$or[1].$where"`).
- [ ] `$where`, `$function`, `$expr`, `$accumulator` và regex `(a+)+` bị chặn trong filter do LLM gửi lên.
- [ ] `ReadOnlyStore` có đúng 1 hàm: `grep -cE "^\s+(find|insert\w*|update\w*|delete\w*)\(" src/query/store.ts` → `1`.
- [ ] Danh sách field của guard và của `nexus://schema` sinh từ **cùng** Zod schema (`query/catalog.ts`), không có danh sách viết tay thứ hai.
- [ ] **Chưa chạy ở sandbox** — kiểm trên máy bạn với Mongo của M2: tạo `nexus_reader` bằng `infra/mongo/create-reader.js`; ghi bằng user đó phải bị **DB** từ chối (lỗi `not authorized … to execute command { insert: …`); chạy server với `NEXUS_DATA=mongo` thì `query-probe.ts` ra cùng 10 dòng.

**Lệnh nghiệm thu:**

```console
$ node scripts/read.ts nexus://schema
$ node scripts/query-probe.ts
$ grep -cE "^\s+(find|insert\w*|update\w*|delete\w*)\(" src/query/store.ts
```

```console
$ NEXUS_READER_PASSWORD=doi-mat-khau mongosh "mongodb://admin:<mật khẩu>@127.0.0.1:27017/admin?replicaSet=rs0" ../../infra/mongo/create-reader.js
$ mongosh "mongodb://nexus_reader:doi-mat-khau@127.0.0.1:27017/nexus?replicaSet=rs0&authSource=admin" --eval 'db.orders.insertOne({ x: 1 })'
$ NEXUS_DATA=mongo MONGO_READONLY_URI="mongodb://nexus_reader:doi-mat-khau@127.0.0.1:27017/nexus?replicaSet=rs0&authSource=admin" node scripts/query-probe.ts
```

Kết quả mong đợi (mô tả bằng lời, chưa chạy ở sandbox): lệnh 1 in user `nexus_reader` với `roles: [{ role: "read", db: "nexus" }]`; lệnh 2 báo lỗi quyền (`MongoServerError: not authorized on nexus to execute command { insert: "orders", … }`), không có `acknowledged: true`; lệnh 3 in đúng 10 dòng như bản RAM, số `matched` theo dữ liệu seed Mongo của bạn.

**Gợi ý hướng làm:** `packages/shared/src/order.ts` + `query.ts` → `query/catalog.ts` (field + tài liệu từ Zod) → `query/filter-guard.ts` → `query/store.ts` + 2 bản (RAM, Mongo) → `tools/query.ts` + `resources/schema.ts` → `infra/mongo/create-reader.js`.

Output thật — resource schema (bản sau S5.5, có thêm `tasks`):

```console
$ node scripts/read.ts nexus://schema
text/markdown · 2486 ký tự · 3 ms
# Schema dữ liệu Nexus

Đọc trước khi gọi `nexus_query`. Chỉ đọc; tool không ghi được gì. Field không có trong bảng → lỗi.

## customers

| field | kiểu | ghi chú |
|---|---|---|
| `id` | string | Id khách, dạng cus_007 |
| `name` | string | Tên tổ chức (có dấu) |
| `email` | string (email) | Email liên hệ |
| `city` | "Hà Nội", "Hải Phòng", "TP.HCM", "Đà Nẵng", "Cần Thơ" | Thành phố |
| `tier` | "free", "pro", "enterprise" | Gói dịch vụ |
| `createdAt` | string (date-time) | Ngày bắt đầu dùng, ISO 8601 UTC |

Ví dụ filter: `{"city":"Hà Nội","tier":"pro"}` · `{"tier":{"$in":["pro","enterprise"]}}`

## orders

| field | kiểu | ghi chú |
|---|---|---|
| `id` | string | Mã đơn, dạng ord_00042 |
| `customerId` | string | Id khách (cus_007) — nối với customers.id |
| `product` | "Gói Pro", "Gói Enterprise", "Tư vấn", "Đào tạo", "Tích hợp API" | Sản phẩm: Gói Pro, Gói Enterprise, Tư vấn, Đào tạo, Tích hợp API |
| `amount` | integer | Số tiền VND, số nguyên |
| `status` | "paid", "pending", "refunded" | paid = đã thu (tính doanh thu) · pending · refunded |
| `city` | string | Thành phố của khách lúc đặt (khu vực) |
| `createdAt` | string (date-time) | Thời điểm đặt, ISO 8601 UTC |

Ví dụ filter: `{"status":"paid","amount":{"$gte":20000000}}` · `{"customerId":"cus_007","createdAt":{"$gte":"2026-07-01"}}`

## tasks

| field | kiểu | ghi chú |
|---|---|---|
| `id` | string | Id việc, dạng task_0042 |
| `title` | string | Tiêu đề |
| `status` | "todo", "doing", "done" | todo | doing | done |
| `assignee` | string | Tên đăng nhập người phụ trách |
| `customerId` | string,null | Khách liên quan (có thể null) |
| `dueDate` | string,null | Hạn YYYY-MM-DD (có thể null) |
| `createdAt` | string | Lúc tạo, ISO 8601 UTC |
| `updatedAt` | string | Lúc sửa gần nhất |

Ví dụ filter: `{"assignee":"lan","status":{"$ne":"done"}}` · `{"dueDate":{"$lt":"2026-08-01"},"status":"todo"}`

## Toán tử

Cho phép trên field: `$eq` `$ne` `$gt` `$gte` `$lt` `$lte` `$in` `$nin` `$exists` `$regex` `$options` `$not`. Ghép điều kiện: `$and` `$or` `$nor`.
Mọi toán tử khác bị từ chối — gồm `$where`, `$function`, `$accumulator`, `$expr` (chạy mã / biểu thức trên server DB).
Giới hạn: sâu ≤ 4 tầng · ≤ 40 điều kiện · `$in` ≤ 50 giá trị · `$regex` ≤ 64 ký tự · limit ≤ 50.
Ngày là chuỗi ISO 8601 so sánh theo thứ tự chuỗi: `"2026-07-01"` ≤ mọi thời điểm trong tháng 7/2026.
Đếm: dùng `matched` trong kết quả, không đếm `items`. Tổng doanh thu theo nhóm: dùng `nexus_revenue_by`, đừng tự cộng.
```

Output thật — 2 filter hợp lệ và 8 filter độc qua server thật:

```console
$ node scripts/query-probe.ts
✓ hợp lệ: đơn ≥ 45 triệu     → matched 9, returned 1
✓ hợp lệ: $or + $in          → matched 11, returned 1
✗ $where (chạy JS)           → Filter bị từ chối tại "$where": toán tử $where không được phép ở cấp tài liệu (cho phép: $and, $or, $nor). Sửa filter theo nexus://schema rồ…
✗ $where lồng trong $or      → Filter bị từ chối tại "$or[1].$where": toán tử $where không được phép ở cấp tài liệu (cho phép: $and, $or, $nor). Sửa filter theo nexus://sc…
✗ $expr + $function          → Filter bị từ chối tại "$expr": toán tử $expr không được phép ở cấp tài liệu (cho phép: $and, $or, $nor). Sửa filter theo nexus://schema rồi …
✗ $function trên field       → Filter bị từ chối tại "amount.$function": toán tử $function không được phép (cho phép: $eq $ne $gt $gte $lt $lte $in $nin $exists $regex $op…
✗ regex ReDoS (a+)+          → Filter bị từ chối tại "name.$regex": $regex có lượng từ lồng nhau (nguy cơ ReDoS). Sửa filter theo nexus://schema rồi gọi lại.
✗ field không có             → Filter bị từ chối tại "passwordHash": field không có trong customers (có: id, name, email, city, tier, createdAt). Sửa filter theo nexus://s…
✗ collection ngoài whitelist → MCP error -32602: Input validation error: Invalid arguments for tool nexus_query: Invalid option: expected one of "customers"|"orders"|"task…
✗ fields lạ                  → Field không có trong orders: cardNumber. Field hợp lệ: id, customerId, product, amount, status, city, createdAt.
```

<details>
<summary>Xem sau khi làm xong — lời giải Lab Nexus S5.2</summary>

`apps/mcp-server/src/query/filter-guard.ts`

```ts
import type { QueryCollection } from "@nexus/shared";
import { ALLOWED_FIELD_OPS, ALLOWED_LOGICAL_OPS, FIELDS, LIMITS } from "./catalog.ts";

/**
 * Kiểm filter do LLM gửi lên TRƯỚC khi tới DB (M5 · S5.2).
 * Allow-list: chỉ toán tử + field có trong danh sách mới qua. Không blacklist "$where" — thiếu 1 cái là lọt.
 * Đây là lớp 2. Lớp 1 là user DB chỉ có quyền read (DB tự từ chối ghi, kể cả khi guard có lỗ).
 */
export type Primitive = string | number | boolean | null;
export type GuardResult = { ok: true } | { ok: false; at: string; problem: string };

const FIELD_OPS: ReadonlySet<string> = new Set(ALLOWED_FIELD_OPS);
const LOGICAL_OPS: ReadonlySet<string> = new Set(ALLOWED_LOGICAL_OPS);
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);
/** Lượng từ lồng nhau kiểu (a+)+ — mẫu ReDoS kinh điển. */
const NESTED_QUANTIFIER = /\([^)]*[+*][^)]*\)[+*{]/;

const isPrimitive = (v: unknown): v is Primitive => v === null || ["string", "number", "boolean"].includes(typeof v);
const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;

export function checkFilter(collection: QueryCollection, filter: Record<string, unknown>): GuardResult {
  let nodes = 0;
  const fail = (at: string, problem: string): GuardResult => ({ ok: false, at, problem });

  function doc(node: Record<string, unknown>, at: string, depth: number): GuardResult {
    if (depth > LIMITS.depth) return fail(at, `lồng quá ${LIMITS.depth} tầng`);
    for (const [key, value] of Object.entries(node)) {
      const here = at ? `${at}.${key}` : key;
      if (++nodes > LIMITS.nodes) return fail(here, `quá ${LIMITS.nodes} điều kiện`);
      if (FORBIDDEN_KEYS.has(key)) return fail(here, "tên khóa bị cấm");
      if (key.startsWith("$")) {
        if (!LOGICAL_OPS.has(key)) return fail(here, `toán tử ${key} không được phép ở cấp tài liệu (cho phép: ${ALLOWED_LOGICAL_OPS.join(", ")})`);
        if (!Array.isArray(value) || value.length === 0 || value.length > 10) return fail(here, `${key} cần mảng 1–10 điều kiện`);
        for (const [i, sub] of value.entries()) {
          if (!isPlainObject(sub)) return fail(`${here}[${i}]`, "mỗi điều kiện là 1 object");
          const r = doc(sub, `${here}[${i}]`, depth + 1);
          if (!r.ok) return r;
        }
        continue;
      }
      if (!FIELDS[collection].has(key)) return fail(here, `field không có trong ${collection} (có: ${[...FIELDS[collection]].join(", ")})`);
      const r = fieldValue(value, here, depth + 1);
      if (!r.ok) return r;
    }
    return { ok: true };
  }

  function fieldValue(value: unknown, at: string, depth: number): GuardResult {
    if (isPrimitive(value)) return { ok: true }; // so khớp bằng
    if (!isPlainObject(value)) return fail(at, "giá trị phải là chuỗi/số/boolean/null hoặc object toán tử");
    if (depth > LIMITS.depth) return fail(at, `lồng quá ${LIMITS.depth} tầng`);
    const keys = Object.keys(value);
    if (keys.length === 0) return fail(at, "object toán tử rỗng");
    for (const op of keys) {
      const here = `${at}.${op}`;
      if (++nodes > LIMITS.nodes) return fail(here, `quá ${LIMITS.nodes} điều kiện`);
      if (!op.startsWith("$")) return fail(here, "so khớp nguyên object con không được hỗ trợ — dùng toán tử");
      if (!FIELD_OPS.has(op)) return fail(here, `toán tử ${op} không được phép (cho phép: ${ALLOWED_FIELD_OPS.join(" ")})`);
      const v = value[op];
      switch (op) {
        case "$in":
        case "$nin":
          if (!Array.isArray(v) || v.length > LIMITS.inSize || !v.every(isPrimitive)) return fail(here, `${op} cần mảng ≤ ${LIMITS.inSize} giá trị đơn`);
          break;
        case "$exists":
          if (typeof v !== "boolean") return fail(here, "$exists cần true/false");
          break;
        case "$regex": {
          if (typeof v !== "string" || v.length > LIMITS.regexLength) return fail(here, `$regex cần chuỗi ≤ ${LIMITS.regexLength} ký tự`);
          if (NESTED_QUANTIFIER.test(v)) return fail(here, "$regex có lượng từ lồng nhau (nguy cơ ReDoS)");
          try {
            new RegExp(v);
          } catch {
            return fail(here, "$regex không hợp lệ");
          }
          break;
        }
        case "$options":
          if (typeof v !== "string" || !/^[imsx]{0,4}$/.test(v)) return fail(here, "$options chỉ gồm i m s x");
          break;
        case "$not": {
          const r = fieldValue(v, here, depth + 1);
          if (!r.ok) return r;
          if (isPrimitive(v)) return fail(here, "$not cần object toán tử");
          break;
        }
        default:
          if (!isPrimitive(v)) return fail(here, `${op} cần giá trị đơn`);
      }
    }
    return { ok: true };
  }

  return doc(filter, "", 1);
}
```
`apps/mcp-server/src/query/catalog.ts`

```ts
import { CustomerSchema, OrderSchema, TaskSchema, type QueryCollection } from "@nexus/shared";
import { z } from "zod";

/**
 * 1 nguồn sự thật cho: field nào truy vấn được (guard) + tài liệu schema cho LLM (resource nexus://schema).
 * Sinh từ chính Zod schema của dữ liệu — đổi schema là tài liệu đổi theo, không ai phải nhớ sửa tay.
 */
const SCHEMAS = { customers: CustomerSchema, orders: OrderSchema, tasks: TaskSchema } as const satisfies Record<QueryCollection, z.ZodObject>;

const NOTES: Partial<Record<QueryCollection, Record<string, string>>> = {
  customers: {
    id: "Id khách, dạng cus_007",
    name: "Tên tổ chức (có dấu)",
    email: "Email liên hệ",
    city: "Thành phố",
    tier: "Gói dịch vụ",
    createdAt: "Ngày bắt đầu dùng, ISO 8601 UTC",
  },
  tasks: {
    id: "Id việc, dạng task_0042",
    title: "Tiêu đề",
    status: "todo | doing | done",
    assignee: "Tên đăng nhập người phụ trách",
    customerId: "Khách liên quan (có thể null)",
    dueDate: "Hạn YYYY-MM-DD (có thể null)",
    createdAt: "Lúc tạo, ISO 8601 UTC",
    updatedAt: "Lúc sửa gần nhất",
  },
};

const EXAMPLES: Record<QueryCollection, string[]> = {
  customers: ['{"city":"Hà Nội","tier":"pro"}', '{"tier":{"$in":["pro","enterprise"]}}'],
  orders: ['{"status":"paid","amount":{"$gte":20000000}}', '{"customerId":"cus_007","createdAt":{"$gte":"2026-07-01"}}'],
  tasks: ['{"assignee":"lan","status":{"$ne":"done"}}', '{"dueDate":{"$lt":"2026-08-01"},"status":"todo"}'],
};

export const ALLOWED_FIELD_OPS = ["$eq", "$ne", "$gt", "$gte", "$lt", "$lte", "$in", "$nin", "$exists", "$regex", "$options", "$not"] as const;
export const ALLOWED_LOGICAL_OPS = ["$and", "$or", "$nor"] as const;
export const LIMITS = { depth: 4, nodes: 40, inSize: 50, regexLength: 64 } as const;

interface FieldDoc {
  name: string;
  type: string;
  note: string;
}

function describeFields(c: QueryCollection): FieldDoc[] {
  const js = z.toJSONSchema(SCHEMAS[c]) as { properties?: Record<string, { type?: string; enum?: unknown[]; format?: string; description?: string }> };
  return Object.entries(js.properties ?? {}).map(([name, p]) => ({
    name,
    type: p.enum ? p.enum.map((v) => JSON.stringify(v)).join(", ") : p.format ? `${p.type} (${p.format})` : (p.type ?? "?"),
    note: p.description ?? NOTES[c]?.[name] ?? "",
  }));
}

export const FIELDS: Record<QueryCollection, ReadonlySet<string>> = {
  customers: new Set(describeFields("customers").map((f) => f.name)),
  orders: new Set(describeFields("orders").map((f) => f.name)),
  tasks: new Set(describeFields("tasks").map((f) => f.name)),
};

function render(): string {
  const parts = [
    "# Schema dữ liệu Nexus",
    "",
    "Đọc trước khi gọi `nexus_query`. Chỉ đọc; tool không ghi được gì. Field không có trong bảng → lỗi.",
  ];
  for (const c of Object.keys(SCHEMAS) as QueryCollection[]) {
    parts.push("", `## ${c}`, "", "| field | kiểu | ghi chú |", "|---|---|---|");
    for (const f of describeFields(c)) parts.push(`| \`${f.name}\` | ${f.type} | ${f.note} |`);
    parts.push("", `Ví dụ filter: ${EXAMPLES[c].map((e) => `\`${e}\``).join(" · ")}`);
  }
  parts.push(
    "",
    "## Toán tử",
    "",
    `Cho phép trên field: ${ALLOWED_FIELD_OPS.map((o) => `\`${o}\``).join(" ")}. Ghép điều kiện: ${ALLOWED_LOGICAL_OPS.map((o) => `\`${o}\``).join(" ")}.`,
    "Mọi toán tử khác bị từ chối — gồm `$where`, `$function`, `$accumulator`, `$expr` (chạy mã / biểu thức trên server DB).",
    `Giới hạn: sâu ≤ ${LIMITS.depth} tầng · ≤ ${LIMITS.nodes} điều kiện · \`$in\` ≤ ${LIMITS.inSize} giá trị · \`$regex\` ≤ ${LIMITS.regexLength} ký tự · limit ≤ 50.`,
    "Ngày là chuỗi ISO 8601 so sánh theo thứ tự chuỗi: `\"2026-07-01\"` ≤ mọi thời điểm trong tháng 7/2026.",
    "Đếm: dùng `matched` trong kết quả, không đếm `items`. Tổng doanh thu theo nhóm: dùng `nexus_revenue_by`, đừng tự cộng.",
  );
  return `${parts.join("\n")}\n`;
}

/** Sinh 1 lần lúc import (schema không đổi khi server đang chạy). */
export const SCHEMA_DOC = render();
```
`apps/mcp-server/src/query/store.ts`

```ts
import type { QueryCollection } from "@nexus/shared";

export type Row = Readonly<Record<string, unknown>>;

export interface FindOptions {
  fields?: readonly string[] | undefined;
  sort?: { field: string; order: "asc" | "desc" } | undefined;
  limit: number;
}

/**
 * Cửa truy vấn của tool nexus_query — CHỈ có đọc (M5 · S5.2).
 * Không có insert/update/delete trên kiểu: code tool không gọi được hàm ghi, kể cả do nhầm.
 * Bản Mongo còn đi qua user DB chỉ có role "read": DB từ chối ghi dù code có lỗ.
 */
export interface ReadOnlyStore {
  find(collection: QueryCollection, filter: Record<string, unknown>, opts: FindOptions): Promise<{ matched: number; items: Row[] }>;
}
```
`apps/mcp-server/src/query/memory-store.ts`

```ts
import type { QueryCollection } from "@nexus/shared";
import type { FindOptions, ReadOnlyStore, Row } from "./store.ts";

type Source = () => Promise<readonly Row[]>;

/** Bản RAM cùng hợp đồng với Mongo: tự đánh giá filter (chỉ các toán tử guard cho qua). */
export function createMemoryReadOnlyStore(sources: Record<QueryCollection, Source>): ReadOnlyStore {
  return {
    async find(collection, filter, opts: FindOptions) {
      const rows = (await sources[collection]()).filter((r) => matchDoc(r, filter));
      if (opts.sort) {
        const { field, order } = opts.sort;
        const dir = order === "asc" ? 1 : -1;
        rows.sort((a, b) => dir * compare(a[field], b[field]));
      }
      const pick = (r: Row): Row => (opts.fields ? Object.fromEntries(opts.fields.filter((f) => f in r).map((f) => [f, r[f]])) : { ...r });
      return { matched: rows.length, items: rows.slice(0, opts.limit).map(pick) };
    },
  };
}

function compare(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a ?? "").localeCompare(String(b ?? ""));
}

function matchDoc(row: Row, filter: Record<string, unknown>): boolean {
  return Object.entries(filter).every(([k, v]) => {
    if (k === "$and") return (v as Record<string, unknown>[]).every((f) => matchDoc(row, f));
    if (k === "$or") return (v as Record<string, unknown>[]).some((f) => matchDoc(row, f));
    if (k === "$nor") return !(v as Record<string, unknown>[]).some((f) => matchDoc(row, f));
    return matchField(row[k], v, k in row);
  });
}

function sameTypeCmp(a: unknown, b: unknown, ok: (d: number) => boolean): boolean {
  if (typeof a === "number" && typeof b === "number") return ok(a - b);
  if (typeof a === "string" && typeof b === "string") return ok(a < b ? -1 : a > b ? 1 : 0);
  return false; // Mongo: khác kiểu thì không so được
}

function matchField(value: unknown, cond: unknown, present: boolean): boolean {
  if (cond === null || typeof cond !== "object" || Array.isArray(cond)) return value === cond;
  const ops = cond as Record<string, unknown>;
  return Object.entries(ops).every(([op, arg]) => {
    switch (op) {
      case "$eq":
        return value === arg;
      case "$ne":
        return value !== arg;
      case "$gt":
        return sameTypeCmp(value, arg, (d) => d > 0);
      case "$gte":
        return sameTypeCmp(value, arg, (d) => d >= 0);
      case "$lt":
        return sameTypeCmp(value, arg, (d) => d < 0);
      case "$lte":
        return sameTypeCmp(value, arg, (d) => d <= 0);
      case "$in":
        return (arg as unknown[]).includes(value);
      case "$nin":
        return !(arg as unknown[]).includes(value);
      case "$exists":
        return present === arg;
      case "$regex":
        return typeof value === "string" && new RegExp(arg as string, (ops["$options"] as string | undefined) ?? "").test(value);
      case "$options":
        return true;
      case "$not":
        return !matchField(value, arg, present);
      default:
        return false; // guard đã chặn; tới đây là lỗi lập trình → không khớp gì
    }
  });
}
```
`apps/mcp-server/src/query/mongo-store.ts`

```ts
import type { QueryCollection } from "@nexus/shared";
import { MongoClient, type Document, type Filter } from "mongodb";
import type { FindOptions, ReadOnlyStore, Row } from "./store.ts";

/**
 * Bản Mongo của ReadOnlyStore — kết nối RIÊNG bằng user chỉ có role "read" (infra/mongo/create-reader.js).
 * Chưa chạy ở sandbox dựng bài (không có MongoDB). Kiểm trên máy bạn: lệnh ở Lab Nexus S5.2.
 */
export async function createMongoReadOnlyStore(uri: string): Promise<{ store: ReadOnlyStore; close: () => Promise<void> }> {
  const client = new MongoClient(uri, {
    appName: "nexus-mcp-query",
    readPreference: "secondaryPreferred", // truy vấn của LLM không tranh tài nguyên với primary
    serverSelectionTimeoutMS: 3_000,
  });
  await client.connect();
  const db = client.db();
  const store: ReadOnlyStore = {
    async find(collection: QueryCollection, filter: Record<string, unknown>, opts: FindOptions) {
      const col = db.collection<Document>(collection);
      const f = filter as Filter<Document>;
      const projection = opts.fields ? Object.fromEntries(opts.fields.map((k) => [k, 1])) : undefined;
      const cursor = col
        .find(f, { maxTimeMS: 2_000, ...(projection ? { projection } : {}) })
        .limit(opts.limit);
      if (opts.sort) cursor.sort({ [opts.sort.field]: opts.sort.order === "asc" ? 1 : -1 });
      const [matched, docs] = await Promise.all([col.countDocuments(f, { maxTimeMS: 2_000 }), cursor.toArray()]);
      return { matched, items: docs.map(({ _id, ...rest }): Row => ({ id: _id, ...rest })) };
    },
  };
  return { store, close: () => client.close() };
}
```
`apps/mcp-server/src/tools/query.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { QueryInputSchema, QueryOutputSchema, RESOURCE, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { FIELDS } from "../query/catalog.ts";
import { checkFilter } from "../query/filter-guard.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerQuery(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.query,
    {
      title: "Truy vấn dữ liệu (chỉ đọc)",
      description:
        `Truy vấn chỉ đọc trên customers hoặc orders bằng filter kiểu MongoDB. Field và toán tử hợp lệ ở resource ${RESOURCE.schema}. ` +
        "Dùng khi các tool chuyên biệt (nexus_list_customers, nexus_search_customers) không đủ. " +
        "Đếm bằng matched; items tối đa 50.",
      inputSchema: QueryInputSchema.shape,
      outputSchema: QueryOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.query, deps.log, async ({ collection, filter, fields, sort, limit }) => {
      const guard = checkFilter(collection, filter);
      if (!guard.ok) {
        deps.log.warn("query filter rejected", { collection, at: guard.at, problem: guard.problem });
        return toolFail({ what: `Filter bị từ chối tại "${guard.at}": ${guard.problem}.`, next: `Sửa filter theo ${RESOURCE.schema} rồi gọi lại.` });
      }
      const known = FIELDS[collection];
      const bad = [...(fields ?? []), ...(sort ? [sort.field] : [])].filter((f) => !known.has(f));
      if (bad.length > 0) {
        return toolFail({ what: `Field không có trong ${collection}: ${bad.join(", ")}.`, next: `Field hợp lệ: ${[...known].join(", ")}.` });
      }
      const r = await deps.query.find(collection, filter, { fields, sort, limit });
      return toolOk(QueryOutputSchema, { collection, matched: r.matched, returned: r.items.length, items: r.items.map((x) => ({ ...x })) });
    }),
  );
}
```
`apps/mcp-server/src/resources/schema.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RESOURCE } from "@nexus/shared";
import { SCHEMA_DOC } from "../query/catalog.ts";

/** M5 · S5.2: schema publish thành resource — host đưa vào context TRƯỚC khi model viết filter. */
export function registerSchema(server: McpServer): void {
  server.registerResource(
    "schema",
    RESOURCE.schema,
    {
      title: "Schema dữ liệu Nexus",
      description: "Collection, field, kiểu và toán tử mà nexus_query chấp nhận. Đưa vào context trước khi model truy vấn dữ liệu.",
      mimeType: "text/markdown",
      size: Buffer.byteLength(SCHEMA_DOC),
      annotations: { audience: ["assistant"], priority: 0.8 },
    },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/markdown", text: SCHEMA_DOC }] }),
  );
}
```
`infra/mongo/create-reader.js`

```js
// mongosh "mongodb://admin:<mật khẩu>@127.0.0.1:27017/admin?replicaSet=rs0" infra/mongo/create-reader.js
// User riêng cho tool nexus_query: chỉ role "read" trên db nexus (M5 · S5.2).
// Chưa chạy ở sandbox dựng bài (không có MongoDB).
const pwd = process.env.NEXUS_READER_PASSWORD;
if (!pwd) throw new Error("đặt NEXUS_READER_PASSWORD trước khi chạy");
const admin = db.getSiblingDB("admin");
if (admin.getUser("nexus_reader")) {
  admin.updateUser("nexus_reader", { pwd, roles: [{ role: "read", db: "nexus" }] });
} else {
  admin.createUser({ user: "nexus_reader", pwd, roles: [{ role: "read", db: "nexus" }] });
}
printjson(admin.getUser("nexus_reader", { showPrivileges: false }));
```

</details>

<details>
<summary>Tra khi test đỏ</summary>

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| Filter có `$expr`/`$function` vẫn chạy | Blacklist chỉ có `$where` | Allow-list: toán tử nào không có trong danh sách là từ chối |
| `$where` lồng trong `$or` lọt | Guard chỉ duyệt cấp đầu | Duyệt đệ quy vào `$and`/`$or`/`$nor`, `$not` |
| Field lạ (`passwordHash`) chạy được, trả rỗng | Không kiểm field — model tưởng “không có ai” | Kiểm field theo catalog; lỗi liệt kê field hợp lệ |
| `TS7053 … can't be used to index type` khi thêm collection | Thêm vào `QUERY_COLLECTIONS` mà chưa thêm schema/field | Đúng ý đồ — tsc chỉ từng chỗ phải thêm (output thật ở S5.5) |
| Mongo: `MongoServerError: not authorized … insert` trong log | Code nào đó dùng nhầm kết nối read-only để ghi | Đúng là DB đang bảo vệ bạn; tìm chỗ ghi nhầm |
| Mongo: `Authentication failed` | Thiếu `authSource=admin` trong URI của `nexus_reader` | User tạo trong db `admin` → thêm `authSource=admin` |
| Truy vấn của LLM làm chậm cả app | Không `maxTimeMS`, đọc từ primary | `maxTimeMS: 2000`, `readPreference: secondaryPreferred` |
| Harness Lab 21 cho qua câu ghi | Chỉ kiểm chữ đầu câu SQL | Kết nối read-only của driver; kiểm câu lệnh chỉ để báo lỗi rõ |

</details>

### Filter đi qua đâu, ai từ chối

**Sơ đồ (Luồng dữ liệu) — Filter do LLM viết đi qua đâu, ai có quyền từ chối nó?**

```mermaid
flowchart LR
    schema["nexus://schema (sinh từ Zod)"] -- "đọc trước" --> llm["LLM"]
    llm -- "filter" --> guard["nexus_query: guard allow-list"]
    guard -- "find" --> store["✓ ReadOnlyStore: chỉ find()"]
    guard -- "từ chối" --> bad["✗ isError: chỉ đúng chỗ sai"]
    guard -. "nếu lọt" .-> db["✓ DB role read: ghi bị từ chối"]
    classDef hl fill:#f5d9c8,stroke:#b8583a,stroke-width:3px
    class guard hl
```

**Đọc sơ đồ:** Trên: host đưa nexus://schema vào context TRƯỚC, LLM viết filter đúng field. Giữa: guard allow-list của tool. Phải: store chỉ có hàm find, kết nối bằng user DB chỉ có role read. Hai lớp chặn độc lập: code (guard) và DB (role). *Màu: đỏ gạch + ✗ + viền đứt = bị chặn/sai · vàng mù tạt + ? + viền chấm = cần xem lại · xanh ô-liu + ✓ = chạy đúng. Nét đứt = đường chỉ có khi guard có lỗ.*


Hai lớp độc lập, mỗi lớp đủ để chặn một nửa vấn đề:

- **Guard (code):** chặn toán tử chạy mã và mẫu tốn tài nguyên — thứ DB **cho phép** user `read` làm (đọc vẫn là đọc, kể cả `$where` chạy JS trong lúc đọc). Role `read` không chặn được `$where`.
- **Role `read` (DB):** chặn ghi — thứ guard **có thể** bỏ sót (lỗi lập trình, driver mới thêm cú pháp, một dev thêm tool ghi nhầm kết nối). Guard không bao giờ chứng minh được là không có lỗ.

### Phần khác C# thật sự

**1. Không có SQL injection kiểu chuỗi, nhưng có operator injection.** Filter Mongo là một **chương trình nhỏ**: `$where` chạy JavaScript trên server DB, `$function`/`$accumulator` cũng vậy, `$expr` cho phép biểu thức tùy ý. Không cần ghép chuỗi vẫn bị tấn công — chỉ cần chấp nhận object do người khác viết.

**2. `unknown` buộc bạn duyệt.** Schema input là `z.record(z.string(), z.unknown())`. TS không cho dùng `value.$regex` khi chưa thu hẹp kiểu — guard viết theo kiểu “chứng minh từng tầng” (`isPlainObject`, `isPrimitive`) chứ không `as any`.

**3. Một nguồn cho field.** `catalog.ts` đọc field từ chính `CustomerSchema`/`OrderSchema` bằng `z.toJSONSchema` (Zod 4). Guard và tài liệu `nexus://schema` không thể lệch nhau, và thêm field vào schema là cả hai cập nhật.

**4. Model không tự đọc resource.** Như M4: host phải đưa `nexus://schema` vào context (Nexus web làm ở M11, giống glossary). Trong lúc chờ: description của `nexus_query` trỏ tới resource, và lỗi của tool liệt kê field hợp lệ — model sai lần 1 thì lần 2 đúng.

**5. Read-only còn là chuyện hiệu năng.** Truy vấn do LLM viết không lường trước được: `maxTimeMS: 2000` cắt truy vấn chậm, `readPreference: secondaryPreferred` đẩy sang secondary (replica set của M2), `limit ≤ 50` + `matched` để đếm mà không kéo về.

**6. `RegExp` của JS không có timeout.** .NET có `matchTimeout`; JS thì không. `(a+)+$` trên chuỗi `aaaa…!` chặn event loop hàng giây. Guard chặn lượng từ lồng nhau và độ dài; với Mongo, regex chạy trên server và `maxTimeMS` là lưới cuối.

### Bẫy dev .NET hay vấp

#### Bẫy 1 — blacklist `$where`

Thói quen “chặn cái nguy hiểm đã biết”:

`lesson-code/m5/traps/blacklist-guard.ts`

```ts
// Bẫy 1 (S5.2) — dịch thẳng "chặn $where": blacklist trên chuỗi JSON. So với allow-list của Nexus.
import { checkFilter } from "../../../nexus/apps/mcp-server/src/query/filter-guard.ts";

const BLACKLIST = ["$where"];
const blacklistOk = (filter: Record<string, unknown>): boolean => !BLACKLIST.some((op) => JSON.stringify(filter).includes(op));

const EVIL: Array<[string, Record<string, unknown>]> = [
  ["$where", { $where: "sleep(5000) || true" }],
  ["$expr + $function", { $expr: { $function: { body: "function(){return true}", args: [], lang: "js" } } }],
  ["$function trên field", { amount: { $function: { body: "function(){}", args: [], lang: "js" } } }],
  ["$accumulator trong $expr", { $expr: { $gt: [{ $accumulator: { init: "function(){}", accumulate: "function(){}", lang: "js" } }, 0] } }],
  ["regex ReDoS", { product: { $regex: "^(a+)+$" } }],
  ["field ẩn", { passwordHash: { $exists: true } }],
];

console.log(`${"filter độc".padEnd(26)} ${"blacklist $where".padEnd(18)} allow-list Nexus`);
for (const [label, f] of EVIL) {
  const g = checkFilter("orders", f);
  console.log(`${label.padEnd(26)} ${(blacklistOk(f) ? "✗ cho qua" : "✓ chặn").padEnd(18)} ${g.ok ? "✗ cho qua" : `✓ chặn tại ${g.at}`}`);
}
```

```console
$ node m5/traps/blacklist-guard.ts
filter độc                 blacklist $where   allow-list Nexus
$where                     ✓ chặn             ✓ chặn tại $where
$expr + $function          ✗ cho qua          ✓ chặn tại $expr
$function trên field       ✗ cho qua          ✓ chặn tại amount.$function
$accumulator trong $expr   ✗ cho qua          ✓ chặn tại $expr
regex ReDoS                ✗ cho qua          ✓ chặn tại product.$regex
field ẩn                   ✗ cho qua          ✓ chặn tại passwordHash
```

Blacklist chặn đúng 1/6: cái tên bạn đã nghĩ tới. Mongo thêm toán tử mới qua từng bản; allow-list mặc định từ chối thứ chưa biết, blacklist mặc định cho qua.

#### Bẫy 2 — “chỉ cho SELECT” bằng regex, kết nối có quyền ghi

Chạy bằng SQLite (C50 dùng SQLite; nguyên tắc y hệt với Mongo):

`lesson-code/m5/traps/sqlite-select-only.ts`

```ts
// Bẫy 2 (S5.2) — "chỉ cho SELECT" bằng regex trên câu SQL, kết nối có quyền ghi. Rồi cùng câu đó trên kết nối read-only.
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const file = path.join(mkdtempSync(path.join(tmpdir(), "m5-sqlite-")), "shop.db");
const setup = new DatabaseSync(file);
setup.exec("CREATE TABLE orders(id TEXT PRIMARY KEY, amount INTEGER); INSERT INTO orders VALUES ('o1',100),('o2',200),('o3',300);");
setup.close();

const looksLikeSelect = (sql: string): boolean => /^\s*(select|with)\b/i.test(sql); // "WITH" để cho CTE đi qua
const SQL = "WITH x AS (SELECT 1) DELETE FROM orders RETURNING id";
console.log(`câu SQL: ${SQL}`);
console.log(`regex "chỉ SELECT/WITH" cho qua: ${looksLikeSelect(SQL)}`);

const count = (db: DatabaseSync): unknown => (db.prepare("SELECT count(*) AS n FROM orders").get() as { n: number }).n;

const rw = new DatabaseSync(file);
console.log(`\nkết nối thường — trước: ${count(rw)} đơn`);
console.log("chạy:", JSON.stringify(rw.prepare(SQL).all()));
console.log(`sau: ${count(rw)} đơn`);
rw.exec("INSERT INTO orders VALUES ('o1',100),('o2',200),('o3',300);");
rw.close();

const ro = new DatabaseSync(file, { readOnly: true });
console.log(`\nkết nối readOnly — trước: ${count(ro)} đơn`);
try {
  ro.prepare(SQL).all();
} catch (err) {
  console.log(`DB từ chối: ${(err as Error).message}`);
}
console.log(`sau: ${count(ro)} đơn`);
```

```console
$ node --disable-warning=ExperimentalWarning m5/traps/sqlite-select-only.ts
câu SQL: WITH x AS (SELECT 1) DELETE FROM orders RETURNING id
regex "chỉ SELECT/WITH" cho qua: true

kết nối thường — trước: 3 đơn
chạy: [{"id":"o1"},{"id":"o2"},{"id":"o3"}]
sau: 0 đơn

kết nối readOnly — trước: 3 đơn
DB từ chối: attempt to write a readonly database
sau: 3 đơn
```

Regex cho `WITH` qua để không chặn CTE hợp lệ — và `DELETE` đi theo. Cùng câu đó trên kết nối `readOnly`: DB từ chối, dữ liệu nguyên vẹn. Đây là câu trả lời cho Review của Lab 21: validation ở code đi xa tới đâu cũng không thay được quyền ở DB.

#### Bẫy 3 — gọi hàm ghi trên cửa chỉ đọc

`lesson-code/m5/tsc-traps/readonly-store-write.ts`

```ts
import type { Deps } from "../../../nexus/apps/mcp-server/src/deps.ts";

export const purge = (deps: Deps) => deps.query.deleteMany("orders", { status: "refunded" });
```

> ❌ **TS2339** (dòng 3, cột 49): Property 'deleteMany' does not exist on type 'ReadOnlyStore'.

Lỗi bạn muốn có. Với `IRepository<T>` đầy đủ CRUD (bản dịch thẳng bên dưới), dòng này compile sạch và chạy — chỉ dừng được nhờ role `read` của DB, nếu có.

### Code mẫu & pattern

#### Code production

`apps/mcp-server/src/query/filter-guard.ts`

```ts
import type { QueryCollection } from "@nexus/shared";
import { ALLOWED_FIELD_OPS, ALLOWED_LOGICAL_OPS, FIELDS, LIMITS } from "./catalog.ts";

/**
 * Kiểm filter do LLM gửi lên TRƯỚC khi tới DB (M5 · S5.2).
 * Allow-list: chỉ toán tử + field có trong danh sách mới qua. Không blacklist "$where" — thiếu 1 cái là lọt.
 * Đây là lớp 2. Lớp 1 là user DB chỉ có quyền read (DB tự từ chối ghi, kể cả khi guard có lỗ).
 */
export type Primitive = string | number | boolean | null;
export type GuardResult = { ok: true } | { ok: false; at: string; problem: string };

const FIELD_OPS: ReadonlySet<string> = new Set(ALLOWED_FIELD_OPS);
const LOGICAL_OPS: ReadonlySet<string> = new Set(ALLOWED_LOGICAL_OPS);
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);
/** Lượng từ lồng nhau kiểu (a+)+ — mẫu ReDoS kinh điển. */
const NESTED_QUANTIFIER = /\([^)]*[+*][^)]*\)[+*{]/;

const isPrimitive = (v: unknown): v is Primitive => v === null || ["string", "number", "boolean"].includes(typeof v);
const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;

export function checkFilter(collection: QueryCollection, filter: Record<string, unknown>): GuardResult {
  let nodes = 0;
  const fail = (at: string, problem: string): GuardResult => ({ ok: false, at, problem });

  function doc(node: Record<string, unknown>, at: string, depth: number): GuardResult {
    if (depth > LIMITS.depth) return fail(at, `lồng quá ${LIMITS.depth} tầng`);
    for (const [key, value] of Object.entries(node)) {
      const here = at ? `${at}.${key}` : key;
      if (++nodes > LIMITS.nodes) return fail(here, `quá ${LIMITS.nodes} điều kiện`);
      if (FORBIDDEN_KEYS.has(key)) return fail(here, "tên khóa bị cấm");
      if (key.startsWith("$")) {
        if (!LOGICAL_OPS.has(key)) return fail(here, `toán tử ${key} không được phép ở cấp tài liệu (cho phép: ${ALLOWED_LOGICAL_OPS.join(", ")})`);
        if (!Array.isArray(value) || value.length === 0 || value.length > 10) return fail(here, `${key} cần mảng 1–10 điều kiện`);
        for (const [i, sub] of value.entries()) {
          if (!isPlainObject(sub)) return fail(`${here}[${i}]`, "mỗi điều kiện là 1 object");
          const r = doc(sub, `${here}[${i}]`, depth + 1);
          if (!r.ok) return r;
        }
        continue;
      }
      if (!FIELDS[collection].has(key)) return fail(here, `field không có trong ${collection} (có: ${[...FIELDS[collection]].join(", ")})`);
      const r = fieldValue(value, here, depth + 1);
      if (!r.ok) return r;
    }
    return { ok: true };
  }

  function fieldValue(value: unknown, at: string, depth: number): GuardResult {
    if (isPrimitive(value)) return { ok: true }; // so khớp bằng
    if (!isPlainObject(value)) return fail(at, "giá trị phải là chuỗi/số/boolean/null hoặc object toán tử");
    if (depth > LIMITS.depth) return fail(at, `lồng quá ${LIMITS.depth} tầng`);
    const keys = Object.keys(value);
    if (keys.length === 0) return fail(at, "object toán tử rỗng");
    for (const op of keys) {
      const here = `${at}.${op}`;
      if (++nodes > LIMITS.nodes) return fail(here, `quá ${LIMITS.nodes} điều kiện`);
      if (!op.startsWith("$")) return fail(here, "so khớp nguyên object con không được hỗ trợ — dùng toán tử");
      if (!FIELD_OPS.has(op)) return fail(here, `toán tử ${op} không được phép (cho phép: ${ALLOWED_FIELD_OPS.join(" ")})`);
      const v = value[op];
      switch (op) {
        case "$in":
        case "$nin":
          if (!Array.isArray(v) || v.length > LIMITS.inSize || !v.every(isPrimitive)) return fail(here, `${op} cần mảng ≤ ${LIMITS.inSize} giá trị đơn`);
          break;
        case "$exists":
          if (typeof v !== "boolean") return fail(here, "$exists cần true/false");
          break;
        case "$regex": {
          if (typeof v !== "string" || v.length > LIMITS.regexLength) return fail(here, `$regex cần chuỗi ≤ ${LIMITS.regexLength} ký tự`);
          if (NESTED_QUANTIFIER.test(v)) return fail(here, "$regex có lượng từ lồng nhau (nguy cơ ReDoS)");
          try {
            new RegExp(v);
          } catch {
            return fail(here, "$regex không hợp lệ");
          }
          break;
        }
        case "$options":
          if (typeof v !== "string" || !/^[imsx]{0,4}$/.test(v)) return fail(here, "$options chỉ gồm i m s x");
          break;
        case "$not": {
          const r = fieldValue(v, here, depth + 1);
          if (!r.ok) return r;
          if (isPrimitive(v)) return fail(here, "$not cần object toán tử");
          break;
        }
        default:
          if (!isPrimitive(v)) return fail(here, `${op} cần giá trị đơn`);
      }
    }
    return { ok: true };
  }

  return doc(filter, "", 1);
}
```
`apps/mcp-server/src/query/catalog.ts`

```ts
import { CustomerSchema, OrderSchema, TaskSchema, type QueryCollection } from "@nexus/shared";
import { z } from "zod";

/**
 * 1 nguồn sự thật cho: field nào truy vấn được (guard) + tài liệu schema cho LLM (resource nexus://schema).
 * Sinh từ chính Zod schema của dữ liệu — đổi schema là tài liệu đổi theo, không ai phải nhớ sửa tay.
 */
const SCHEMAS = { customers: CustomerSchema, orders: OrderSchema, tasks: TaskSchema } as const satisfies Record<QueryCollection, z.ZodObject>;

const NOTES: Partial<Record<QueryCollection, Record<string, string>>> = {
  customers: {
    id: "Id khách, dạng cus_007",
    name: "Tên tổ chức (có dấu)",
    email: "Email liên hệ",
    city: "Thành phố",
    tier: "Gói dịch vụ",
    createdAt: "Ngày bắt đầu dùng, ISO 8601 UTC",
  },
  tasks: {
    id: "Id việc, dạng task_0042",
    title: "Tiêu đề",
    status: "todo | doing | done",
    assignee: "Tên đăng nhập người phụ trách",
    customerId: "Khách liên quan (có thể null)",
    dueDate: "Hạn YYYY-MM-DD (có thể null)",
    createdAt: "Lúc tạo, ISO 8601 UTC",
    updatedAt: "Lúc sửa gần nhất",
  },
};

const EXAMPLES: Record<QueryCollection, string[]> = {
  customers: ['{"city":"Hà Nội","tier":"pro"}', '{"tier":{"$in":["pro","enterprise"]}}'],
  orders: ['{"status":"paid","amount":{"$gte":20000000}}', '{"customerId":"cus_007","createdAt":{"$gte":"2026-07-01"}}'],
  tasks: ['{"assignee":"lan","status":{"$ne":"done"}}', '{"dueDate":{"$lt":"2026-08-01"},"status":"todo"}'],
};

export const ALLOWED_FIELD_OPS = ["$eq", "$ne", "$gt", "$gte", "$lt", "$lte", "$in", "$nin", "$exists", "$regex", "$options", "$not"] as const;
export const ALLOWED_LOGICAL_OPS = ["$and", "$or", "$nor"] as const;
export const LIMITS = { depth: 4, nodes: 40, inSize: 50, regexLength: 64 } as const;

interface FieldDoc {
  name: string;
  type: string;
  note: string;
}

function describeFields(c: QueryCollection): FieldDoc[] {
  const js = z.toJSONSchema(SCHEMAS[c]) as { properties?: Record<string, { type?: string; enum?: unknown[]; format?: string; description?: string }> };
  return Object.entries(js.properties ?? {}).map(([name, p]) => ({
    name,
    type: p.enum ? p.enum.map((v) => JSON.stringify(v)).join(", ") : p.format ? `${p.type} (${p.format})` : (p.type ?? "?"),
    note: p.description ?? NOTES[c]?.[name] ?? "",
  }));
}

export const FIELDS: Record<QueryCollection, ReadonlySet<string>> = {
  customers: new Set(describeFields("customers").map((f) => f.name)),
  orders: new Set(describeFields("orders").map((f) => f.name)),
  tasks: new Set(describeFields("tasks").map((f) => f.name)),
};

function render(): string {
  const parts = [
    "# Schema dữ liệu Nexus",
    "",
    "Đọc trước khi gọi `nexus_query`. Chỉ đọc; tool không ghi được gì. Field không có trong bảng → lỗi.",
  ];
  for (const c of Object.keys(SCHEMAS) as QueryCollection[]) {
    parts.push("", `## ${c}`, "", "| field | kiểu | ghi chú |", "|---|---|---|");
    for (const f of describeFields(c)) parts.push(`| \`${f.name}\` | ${f.type} | ${f.note} |`);
    parts.push("", `Ví dụ filter: ${EXAMPLES[c].map((e) => `\`${e}\``).join(" · ")}`);
  }
  parts.push(
    "",
    "## Toán tử",
    "",
    `Cho phép trên field: ${ALLOWED_FIELD_OPS.map((o) => `\`${o}\``).join(" ")}. Ghép điều kiện: ${ALLOWED_LOGICAL_OPS.map((o) => `\`${o}\``).join(" ")}.`,
    "Mọi toán tử khác bị từ chối — gồm `$where`, `$function`, `$accumulator`, `$expr` (chạy mã / biểu thức trên server DB).",
    `Giới hạn: sâu ≤ ${LIMITS.depth} tầng · ≤ ${LIMITS.nodes} điều kiện · \`$in\` ≤ ${LIMITS.inSize} giá trị · \`$regex\` ≤ ${LIMITS.regexLength} ký tự · limit ≤ 50.`,
    "Ngày là chuỗi ISO 8601 so sánh theo thứ tự chuỗi: `\"2026-07-01\"` ≤ mọi thời điểm trong tháng 7/2026.",
    "Đếm: dùng `matched` trong kết quả, không đếm `items`. Tổng doanh thu theo nhóm: dùng `nexus_revenue_by`, đừng tự cộng.",
  );
  return `${parts.join("\n")}\n`;
}

/** Sinh 1 lần lúc import (schema không đổi khi server đang chạy). */
export const SCHEMA_DOC = render();
```
`apps/mcp-server/src/tools/query.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { QueryInputSchema, QueryOutputSchema, RESOURCE, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { FIELDS } from "../query/catalog.ts";
import { checkFilter } from "../query/filter-guard.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerQuery(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.query,
    {
      title: "Truy vấn dữ liệu (chỉ đọc)",
      description:
        `Truy vấn chỉ đọc trên customers hoặc orders bằng filter kiểu MongoDB. Field và toán tử hợp lệ ở resource ${RESOURCE.schema}. ` +
        "Dùng khi các tool chuyên biệt (nexus_list_customers, nexus_search_customers) không đủ. " +
        "Đếm bằng matched; items tối đa 50.",
      inputSchema: QueryInputSchema.shape,
      outputSchema: QueryOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.query, deps.log, async ({ collection, filter, fields, sort, limit }) => {
      const guard = checkFilter(collection, filter);
      if (!guard.ok) {
        deps.log.warn("query filter rejected", { collection, at: guard.at, problem: guard.problem });
        return toolFail({ what: `Filter bị từ chối tại "${guard.at}": ${guard.problem}.`, next: `Sửa filter theo ${RESOURCE.schema} rồi gọi lại.` });
      }
      const known = FIELDS[collection];
      const bad = [...(fields ?? []), ...(sort ? [sort.field] : [])].filter((f) => !known.has(f));
      if (bad.length > 0) {
        return toolFail({ what: `Field không có trong ${collection}: ${bad.join(", ")}.`, next: `Field hợp lệ: ${[...known].join(", ")}.` });
      }
      const r = await deps.query.find(collection, filter, { fields, sort, limit });
      return toolOk(QueryOutputSchema, { collection, matched: r.matched, returned: r.items.length, items: r.items.map((x) => ({ ...x })) });
    }),
  );
}
```

#### Pattern: Cổng chỉ đọc — interface hẹp + quyền DB hẹp

**Vấn đề:** tool cho LLM truy vấn tự do cần được **đảm bảo** chỉ đọc — không phải “hiện tại chỉ gọi find”, mà là không thể gọi gì khác, ở cả tầng code lẫn tầng DB.

**Tương đương C#:** `IReadOnlyRepository<T>` (ISP), phía query của CQRS, cộng connection string riêng với login chỉ có `db_datareader`.

**Dịch thẳng vs kiểu TS:**

`lesson-code/m5/patterns/generic-repository.direct.ts`

```ts
// Dịch thẳng từ C#: IRepository<T> đủ CRUD tiêm vào tool truy vấn, "chỉ đọc" là quy ước.
export interface IRepository<T> {
  find(filter: Record<string, unknown>, limit: number): Promise<T[]>;
  insert(item: T): Promise<void>;
  update(filter: Record<string, unknown>, patch: Partial<T>): Promise<number>;
  delete(filter: Record<string, unknown>): Promise<number>;
}

export class QueryToolHandler<T> {
  private readonly repo: IRepository<T>;
  constructor(repo: IRepository<T>) {
    this.repo = repo;
  }
  // Chỉ gọi find… hôm nay. Không gì ngăn PR sau thêm "dọn dữ liệu rác" vào đây.
  async handle(filter: Record<string, unknown>, limit: number): Promise<T[]> {
    return this.repo.find(filter, limit);
  }
}

// Cùng 1 connection string (user có quyền readWrite) cho mọi repository — đăng ký 1 lần trong DI
export const CONNECTION_STRING = "mongodb://nexus_app:secret@db:27017/nexus";
```
`apps/mcp-server/src/query/store.ts`

```ts
import type { QueryCollection } from "@nexus/shared";

export type Row = Readonly<Record<string, unknown>>;

export interface FindOptions {
  fields?: readonly string[] | undefined;
  sort?: { field: string; order: "asc" | "desc" } | undefined;
  limit: number;
}

/**
 * Cửa truy vấn của tool nexus_query — CHỈ có đọc (M5 · S5.2).
 * Không có insert/update/delete trên kiểu: code tool không gọi được hàm ghi, kể cả do nhầm.
 * Bản Mongo còn đi qua user DB chỉ có role "read": DB từ chối ghi dù code có lỗ.
 */
export interface ReadOnlyStore {
  find(collection: QueryCollection, filter: Record<string, unknown>, opts: FindOptions): Promise<{ matched: number; items: Row[] }>;
}
```
`apps/mcp-server/src/query/mongo-store.ts`

```ts
import type { QueryCollection } from "@nexus/shared";
import { MongoClient, type Document, type Filter } from "mongodb";
import type { FindOptions, ReadOnlyStore, Row } from "./store.ts";

/**
 * Bản Mongo của ReadOnlyStore — kết nối RIÊNG bằng user chỉ có role "read" (infra/mongo/create-reader.js).
 * Chưa chạy ở sandbox dựng bài (không có MongoDB). Kiểm trên máy bạn: lệnh ở Lab Nexus S5.2.
 */
export async function createMongoReadOnlyStore(uri: string): Promise<{ store: ReadOnlyStore; close: () => Promise<void> }> {
  const client = new MongoClient(uri, {
    appName: "nexus-mcp-query",
    readPreference: "secondaryPreferred", // truy vấn của LLM không tranh tài nguyên với primary
    serverSelectionTimeoutMS: 3_000,
  });
  await client.connect();
  const db = client.db();
  const store: ReadOnlyStore = {
    async find(collection: QueryCollection, filter: Record<string, unknown>, opts: FindOptions) {
      const col = db.collection<Document>(collection);
      const f = filter as Filter<Document>;
      const projection = opts.fields ? Object.fromEntries(opts.fields.map((k) => [k, 1])) : undefined;
      const cursor = col
        .find(f, { maxTimeMS: 2_000, ...(projection ? { projection } : {}) })
        .limit(opts.limit);
      if (opts.sort) cursor.sort({ [opts.sort.field]: opts.sort.order === "asc" ? 1 : -1 });
      const [matched, docs] = await Promise.all([col.countDocuments(f, { maxTimeMS: 2_000 }), cursor.toArray()]);
      return { matched, items: docs.map(({ _id, ...rest }): Row => ({ id: _id, ...rest })) };
    },
  };
  return { store, close: () => client.close() };
}
```

- Bản dịch thẳng: `IRepository<T>` generic đủ CRUD tiêm vào handler; “chỉ đọc” là một dòng comment; cùng 1 connection string `readWrite` cho mọi repository. Một PR “dọn dữ liệu rác” sau này compile sạch.
- Bản TS: interface đúng 1 hàm `find` theo **nhu cầu của tool** (không generic theo entity); bản Mongo tự tạo `MongoClient` riêng từ `MONGO_READONLY_URI`. Quyền hẹp ở 2 tầng: kiểu không có hàm ghi, user DB không có quyền ghi.
- Composition root (`deps.ts`) là chỗ duy nhất biết có 2 kết nối; tool chỉ thấy `deps.query`.

**Khi nào KHÔNG dùng:** tool có nghiệp vụ ghi rõ ràng (đổi gói, tạo việc) — dùng repository có hàm ghi cụ thể theo nghiệp vụ (`updateTier`), không phải store generic. Đừng tách interface đọc/ghi cho mọi repository “cho chuẩn CQRS”: chỉ cửa nào nhận **input tự do** (filter do LLM viết) mới cần cửa riêng + user DB riêng.

### Trắc nghiệm S5.2

1. Theo output thật, blacklist chỉ chứa `$where` chặn được bao nhiêu filter độc trong 6?
   - A. 1 — `$expr`+`$function`, `$accumulator`, `$function` trên field, ReDoS, field ẩn đều lọt
   - B. 6 — vì mọi toán tử chạy JS đều chứa chữ where
   - C. 0 — `JSON.stringify` đổi `$where` thành `$where`

   <details><summary>Đáp án</summary>

   **A.** Allow-list mặc định từ chối thứ chưa biết. Output Nexus: cả 6 bị chặn, chỉ đúng chỗ (`$expr`, `amount.$function`…).

   </details>

2. User Mongo `nexus_reader` có role `read`. LLM gửi `{"$where": "sleep(5000) || true"}` và guard có lỗ cho qua. Chuyện gì xảy ra?
   - A. DB từ chối vì user chỉ có quyền đọc
   - B. DB chạy — `$where` là thao tác đọc; role `read` chặn ghi, không chặn chạy JS lúc đọc. Đó là việc của guard
   - C. Driver Node chặn `$where`

   <details><summary>Đáp án</summary>

   **B.** Hai lớp chặn hai thứ khác nhau: guard chặn toán tử nguy hiểm, role chặn ghi. (Phần Mongo chưa chạy ở sandbox.)

   </details>

3. Vì sao field của guard và nội dung `nexus://schema` cùng sinh từ `CustomerSchema`/`OrderSchema`?
   - A. Để tài liệu model đọc và luật guard áp không bao giờ lệch nhau; thêm field là cả hai cập nhật
   - B. Vì `z.toJSONSchema` nhanh hơn viết tay
   - C. Vì Mongo yêu cầu JSON Schema

   <details><summary>Đáp án</summary>

   **A.** Hai danh sách viết tay sẽ lệch: tài liệu nói có `amount`, guard chưa cho — model làm đúng mà vẫn bị từ chối.

   </details>


---

## S5.2 · Cheat Sheet

### Toán tử

| Nhóm | Cho phép | Bị từ chối (ví dụ) |
|---|---|---|
| Trên field | `$eq $ne $gt $gte $lt $lte $in $nin $exists $regex $options $not` | `$function`, `$where`, `$elemMatch`, `$jsonSchema`, `$text` |
| Ghép điều kiện | `$and $or $nor` (1–10 điều kiện) | `$expr`, `$where` ở cấp tài liệu |
| Giới hạn | sâu ≤ 4 · ≤ 40 điều kiện · `$in` ≤ 50 · `$regex` ≤ 64 ký tự, không `(x+)+` | object con không có toán tử, khóa `__proto__` |
| Kết quả | `limit` ≤ 50, `fields` ≤ 8, đếm bằng `matched` | — |

### 2 lớp chỉ đọc

| Lớp | Cách làm | Chặn |
|---|---|---|
| Kiểu (code) | `interface ReadOnlyStore { find() }` | Gọi nhầm hàm ghi → lỗi compile |
| DB | User `nexus_reader`, role `read`, URI riêng | Mọi lệnh ghi, kể cả khi code có lỗ |
| Hiệu năng | `maxTimeMS: 2000`, `secondaryPreferred` | Truy vấn chậm của LLM kéo sập primary |

### Lệnh

```console
$ node scripts/read.ts nexus://schema
$ node scripts/call.ts nexus_query '{"collection":"orders","filter":{"status":"paid","amount":{"$gte":45000000}},"limit":3}'
$ node scripts/query-probe.ts
```

### Pattern của session

| Pattern | Session | Tương đương C# / .NET | Dùng khi |
|---|---|---|---|
| Cổng chỉ đọc: interface hẹp + quyền DB hẹp | S5.2 | `IReadOnlyRepository<T>` / CQRS query side + login SQL chỉ `db_datareader` | Tool cho LLM truy vấn tự do: không có hàm ghi trên kiểu, không có quyền ghi trên DB |



---

## S5.2 · Code

### Cây thư mục

```txt
nexus/
├─ packages/shared/src/order.ts · query.ts         OrderSchema, QUERY_COLLECTIONS, QueryInput/OutputSchema
├─ apps/mcp-server/src/
│  ├─ orders/seed-data.ts · repository.ts           600 đơn cố định (LCG), OrderRepository
│  ├─ query/catalog.ts                              FIELDS + SCHEMA_DOC sinh từ Zod
│  ├─ query/filter-guard.ts                         checkFilter: allow-list đệ quy
│  ├─ query/store.ts · memory-store.ts · mongo-store.ts
│  ├─ tools/query.ts · resources/schema.ts
│  └─ deps.ts · env.ts                              MONGO_READONLY_URI, deps.query
├─ apps/mcp-server/scripts/query-probe.ts
└─ infra/mongo/create-reader.js
lesson-code/m5/
├─ traps/blacklist-guard.ts · sqlite-select-only.ts
├─ tsc-traps/readonly-store-write.ts
└─ patterns/generic-repository.direct.ts
```

### packages/shared

`packages/shared/src/order.ts`

```ts
import { z } from "zod";

export const PRODUCTS = ["Gói Pro", "Gói Enterprise", "Tư vấn", "Đào tạo", "Tích hợp API"] as const;
export const ProductSchema = z.enum(PRODUCTS);
export const ORDER_STATUSES = ["paid", "pending", "refunded"] as const;

export const OrderSchema = z.object({
  id: z.string().regex(/^ord_\d{5}$/).describe("Mã đơn, dạng ord_00042"),
  customerId: z.string().describe("Id khách (cus_007) — nối với customers.id"),
  product: ProductSchema.describe(`Sản phẩm: ${PRODUCTS.join(", ")}`),
  amount: z.number().int().positive().describe("Số tiền VND, số nguyên"),
  status: z.enum(ORDER_STATUSES).describe("paid = đã thu (tính doanh thu) · pending · refunded"),
  city: z.string().describe("Thành phố của khách lúc đặt (khu vực)"),
  createdAt: z.iso.datetime().describe("Thời điểm đặt, ISO 8601 UTC"),
});
export type Order = z.infer<typeof OrderSchema>;
```
`packages/shared/src/query.ts`

```ts
import { z } from "zod";

/** Collection mà tool truy vấn được — whitelist, không phải mọi collection trong DB (M5 · S5.2). */
export const QUERY_COLLECTIONS = ["customers", "orders", "tasks"] as const;
export type QueryCollection = (typeof QUERY_COLLECTIONS)[number];

export const QueryInputSchema = z.object({
  collection: z.enum(QUERY_COLLECTIONS).describe(`Collection: ${QUERY_COLLECTIONS.join(", ")} — field xem ở resource nexus://schema`),
  filter: z
    .record(z.string(), z.unknown())
    .default({})
    .describe('Filter kiểu MongoDB, chỉ toán tử đọc: {"city":"Hà Nội","amount":{"$gte":5000000}}'),
  fields: z.array(z.string()).max(8).optional().describe("Chỉ lấy các field này (mặc định: mọi field)"),
  sort: z.object({ field: z.string(), order: z.enum(["asc", "desc"]) }).optional(),
  limit: z.number().int().min(1).max(50).default(20).describe("Số bản ghi tối đa (1–50)"),
});

export const QueryOutputSchema = z.object({
  collection: z.enum(QUERY_COLLECTIONS),
  matched: z.number().int().describe("Tổng số bản ghi khớp — dùng để đếm"),
  returned: z.number().int(),
  items: z.array(z.record(z.string(), z.unknown())),
});
```

### apps/mcp-server

`apps/mcp-server/src/query/catalog.ts`

```ts
import { CustomerSchema, OrderSchema, TaskSchema, type QueryCollection } from "@nexus/shared";
import { z } from "zod";

/**
 * 1 nguồn sự thật cho: field nào truy vấn được (guard) + tài liệu schema cho LLM (resource nexus://schema).
 * Sinh từ chính Zod schema của dữ liệu — đổi schema là tài liệu đổi theo, không ai phải nhớ sửa tay.
 */
const SCHEMAS = { customers: CustomerSchema, orders: OrderSchema, tasks: TaskSchema } as const satisfies Record<QueryCollection, z.ZodObject>;

const NOTES: Partial<Record<QueryCollection, Record<string, string>>> = {
  customers: {
    id: "Id khách, dạng cus_007",
    name: "Tên tổ chức (có dấu)",
    email: "Email liên hệ",
    city: "Thành phố",
    tier: "Gói dịch vụ",
    createdAt: "Ngày bắt đầu dùng, ISO 8601 UTC",
  },
  tasks: {
    id: "Id việc, dạng task_0042",
    title: "Tiêu đề",
    status: "todo | doing | done",
    assignee: "Tên đăng nhập người phụ trách",
    customerId: "Khách liên quan (có thể null)",
    dueDate: "Hạn YYYY-MM-DD (có thể null)",
    createdAt: "Lúc tạo, ISO 8601 UTC",
    updatedAt: "Lúc sửa gần nhất",
  },
};

const EXAMPLES: Record<QueryCollection, string[]> = {
  customers: ['{"city":"Hà Nội","tier":"pro"}', '{"tier":{"$in":["pro","enterprise"]}}'],
  orders: ['{"status":"paid","amount":{"$gte":20000000}}', '{"customerId":"cus_007","createdAt":{"$gte":"2026-07-01"}}'],
  tasks: ['{"assignee":"lan","status":{"$ne":"done"}}', '{"dueDate":{"$lt":"2026-08-01"},"status":"todo"}'],
};

export const ALLOWED_FIELD_OPS = ["$eq", "$ne", "$gt", "$gte", "$lt", "$lte", "$in", "$nin", "$exists", "$regex", "$options", "$not"] as const;
export const ALLOWED_LOGICAL_OPS = ["$and", "$or", "$nor"] as const;
export const LIMITS = { depth: 4, nodes: 40, inSize: 50, regexLength: 64 } as const;

interface FieldDoc {
  name: string;
  type: string;
  note: string;
}

function describeFields(c: QueryCollection): FieldDoc[] {
  const js = z.toJSONSchema(SCHEMAS[c]) as { properties?: Record<string, { type?: string; enum?: unknown[]; format?: string; description?: string }> };
  return Object.entries(js.properties ?? {}).map(([name, p]) => ({
    name,
    type: p.enum ? p.enum.map((v) => JSON.stringify(v)).join(", ") : p.format ? `${p.type} (${p.format})` : (p.type ?? "?"),
    note: p.description ?? NOTES[c]?.[name] ?? "",
  }));
}

export const FIELDS: Record<QueryCollection, ReadonlySet<string>> = {
  customers: new Set(describeFields("customers").map((f) => f.name)),
  orders: new Set(describeFields("orders").map((f) => f.name)),
  tasks: new Set(describeFields("tasks").map((f) => f.name)),
};

function render(): string {
  const parts = [
    "# Schema dữ liệu Nexus",
    "",
    "Đọc trước khi gọi `nexus_query`. Chỉ đọc; tool không ghi được gì. Field không có trong bảng → lỗi.",
  ];
  for (const c of Object.keys(SCHEMAS) as QueryCollection[]) {
    parts.push("", `## ${c}`, "", "| field | kiểu | ghi chú |", "|---|---|---|");
    for (const f of describeFields(c)) parts.push(`| \`${f.name}\` | ${f.type} | ${f.note} |`);
    parts.push("", `Ví dụ filter: ${EXAMPLES[c].map((e) => `\`${e}\``).join(" · ")}`);
  }
  parts.push(
    "",
    "## Toán tử",
    "",
    `Cho phép trên field: ${ALLOWED_FIELD_OPS.map((o) => `\`${o}\``).join(" ")}. Ghép điều kiện: ${ALLOWED_LOGICAL_OPS.map((o) => `\`${o}\``).join(" ")}.`,
    "Mọi toán tử khác bị từ chối — gồm `$where`, `$function`, `$accumulator`, `$expr` (chạy mã / biểu thức trên server DB).",
    `Giới hạn: sâu ≤ ${LIMITS.depth} tầng · ≤ ${LIMITS.nodes} điều kiện · \`$in\` ≤ ${LIMITS.inSize} giá trị · \`$regex\` ≤ ${LIMITS.regexLength} ký tự · limit ≤ 50.`,
    "Ngày là chuỗi ISO 8601 so sánh theo thứ tự chuỗi: `\"2026-07-01\"` ≤ mọi thời điểm trong tháng 7/2026.",
    "Đếm: dùng `matched` trong kết quả, không đếm `items`. Tổng doanh thu theo nhóm: dùng `nexus_revenue_by`, đừng tự cộng.",
  );
  return `${parts.join("\n")}\n`;
}

/** Sinh 1 lần lúc import (schema không đổi khi server đang chạy). */
export const SCHEMA_DOC = render();
```
`apps/mcp-server/src/query/filter-guard.ts`

```ts
import type { QueryCollection } from "@nexus/shared";
import { ALLOWED_FIELD_OPS, ALLOWED_LOGICAL_OPS, FIELDS, LIMITS } from "./catalog.ts";

/**
 * Kiểm filter do LLM gửi lên TRƯỚC khi tới DB (M5 · S5.2).
 * Allow-list: chỉ toán tử + field có trong danh sách mới qua. Không blacklist "$where" — thiếu 1 cái là lọt.
 * Đây là lớp 2. Lớp 1 là user DB chỉ có quyền read (DB tự từ chối ghi, kể cả khi guard có lỗ).
 */
export type Primitive = string | number | boolean | null;
export type GuardResult = { ok: true } | { ok: false; at: string; problem: string };

const FIELD_OPS: ReadonlySet<string> = new Set(ALLOWED_FIELD_OPS);
const LOGICAL_OPS: ReadonlySet<string> = new Set(ALLOWED_LOGICAL_OPS);
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);
/** Lượng từ lồng nhau kiểu (a+)+ — mẫu ReDoS kinh điển. */
const NESTED_QUANTIFIER = /\([^)]*[+*][^)]*\)[+*{]/;

const isPrimitive = (v: unknown): v is Primitive => v === null || ["string", "number", "boolean"].includes(typeof v);
const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;

export function checkFilter(collection: QueryCollection, filter: Record<string, unknown>): GuardResult {
  let nodes = 0;
  const fail = (at: string, problem: string): GuardResult => ({ ok: false, at, problem });

  function doc(node: Record<string, unknown>, at: string, depth: number): GuardResult {
    if (depth > LIMITS.depth) return fail(at, `lồng quá ${LIMITS.depth} tầng`);
    for (const [key, value] of Object.entries(node)) {
      const here = at ? `${at}.${key}` : key;
      if (++nodes > LIMITS.nodes) return fail(here, `quá ${LIMITS.nodes} điều kiện`);
      if (FORBIDDEN_KEYS.has(key)) return fail(here, "tên khóa bị cấm");
      if (key.startsWith("$")) {
        if (!LOGICAL_OPS.has(key)) return fail(here, `toán tử ${key} không được phép ở cấp tài liệu (cho phép: ${ALLOWED_LOGICAL_OPS.join(", ")})`);
        if (!Array.isArray(value) || value.length === 0 || value.length > 10) return fail(here, `${key} cần mảng 1–10 điều kiện`);
        for (const [i, sub] of value.entries()) {
          if (!isPlainObject(sub)) return fail(`${here}[${i}]`, "mỗi điều kiện là 1 object");
          const r = doc(sub, `${here}[${i}]`, depth + 1);
          if (!r.ok) return r;
        }
        continue;
      }
      if (!FIELDS[collection].has(key)) return fail(here, `field không có trong ${collection} (có: ${[...FIELDS[collection]].join(", ")})`);
      const r = fieldValue(value, here, depth + 1);
      if (!r.ok) return r;
    }
    return { ok: true };
  }

  function fieldValue(value: unknown, at: string, depth: number): GuardResult {
    if (isPrimitive(value)) return { ok: true }; // so khớp bằng
    if (!isPlainObject(value)) return fail(at, "giá trị phải là chuỗi/số/boolean/null hoặc object toán tử");
    if (depth > LIMITS.depth) return fail(at, `lồng quá ${LIMITS.depth} tầng`);
    const keys = Object.keys(value);
    if (keys.length === 0) return fail(at, "object toán tử rỗng");
    for (const op of keys) {
      const here = `${at}.${op}`;
      if (++nodes > LIMITS.nodes) return fail(here, `quá ${LIMITS.nodes} điều kiện`);
      if (!op.startsWith("$")) return fail(here, "so khớp nguyên object con không được hỗ trợ — dùng toán tử");
      if (!FIELD_OPS.has(op)) return fail(here, `toán tử ${op} không được phép (cho phép: ${ALLOWED_FIELD_OPS.join(" ")})`);
      const v = value[op];
      switch (op) {
        case "$in":
        case "$nin":
          if (!Array.isArray(v) || v.length > LIMITS.inSize || !v.every(isPrimitive)) return fail(here, `${op} cần mảng ≤ ${LIMITS.inSize} giá trị đơn`);
          break;
        case "$exists":
          if (typeof v !== "boolean") return fail(here, "$exists cần true/false");
          break;
        case "$regex": {
          if (typeof v !== "string" || v.length > LIMITS.regexLength) return fail(here, `$regex cần chuỗi ≤ ${LIMITS.regexLength} ký tự`);
          if (NESTED_QUANTIFIER.test(v)) return fail(here, "$regex có lượng từ lồng nhau (nguy cơ ReDoS)");
          try {
            new RegExp(v);
          } catch {
            return fail(here, "$regex không hợp lệ");
          }
          break;
        }
        case "$options":
          if (typeof v !== "string" || !/^[imsx]{0,4}$/.test(v)) return fail(here, "$options chỉ gồm i m s x");
          break;
        case "$not": {
          const r = fieldValue(v, here, depth + 1);
          if (!r.ok) return r;
          if (isPrimitive(v)) return fail(here, "$not cần object toán tử");
          break;
        }
        default:
          if (!isPrimitive(v)) return fail(here, `${op} cần giá trị đơn`);
      }
    }
    return { ok: true };
  }

  return doc(filter, "", 1);
}
```
`apps/mcp-server/src/query/store.ts`

```ts
import type { QueryCollection } from "@nexus/shared";

export type Row = Readonly<Record<string, unknown>>;

export interface FindOptions {
  fields?: readonly string[] | undefined;
  sort?: { field: string; order: "asc" | "desc" } | undefined;
  limit: number;
}

/**
 * Cửa truy vấn của tool nexus_query — CHỈ có đọc (M5 · S5.2).
 * Không có insert/update/delete trên kiểu: code tool không gọi được hàm ghi, kể cả do nhầm.
 * Bản Mongo còn đi qua user DB chỉ có role "read": DB từ chối ghi dù code có lỗ.
 */
export interface ReadOnlyStore {
  find(collection: QueryCollection, filter: Record<string, unknown>, opts: FindOptions): Promise<{ matched: number; items: Row[] }>;
}
```
`apps/mcp-server/src/query/memory-store.ts`

```ts
import type { QueryCollection } from "@nexus/shared";
import type { FindOptions, ReadOnlyStore, Row } from "./store.ts";

type Source = () => Promise<readonly Row[]>;

/** Bản RAM cùng hợp đồng với Mongo: tự đánh giá filter (chỉ các toán tử guard cho qua). */
export function createMemoryReadOnlyStore(sources: Record<QueryCollection, Source>): ReadOnlyStore {
  return {
    async find(collection, filter, opts: FindOptions) {
      const rows = (await sources[collection]()).filter((r) => matchDoc(r, filter));
      if (opts.sort) {
        const { field, order } = opts.sort;
        const dir = order === "asc" ? 1 : -1;
        rows.sort((a, b) => dir * compare(a[field], b[field]));
      }
      const pick = (r: Row): Row => (opts.fields ? Object.fromEntries(opts.fields.filter((f) => f in r).map((f) => [f, r[f]])) : { ...r });
      return { matched: rows.length, items: rows.slice(0, opts.limit).map(pick) };
    },
  };
}

function compare(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a ?? "").localeCompare(String(b ?? ""));
}

function matchDoc(row: Row, filter: Record<string, unknown>): boolean {
  return Object.entries(filter).every(([k, v]) => {
    if (k === "$and") return (v as Record<string, unknown>[]).every((f) => matchDoc(row, f));
    if (k === "$or") return (v as Record<string, unknown>[]).some((f) => matchDoc(row, f));
    if (k === "$nor") return !(v as Record<string, unknown>[]).some((f) => matchDoc(row, f));
    return matchField(row[k], v, k in row);
  });
}

function sameTypeCmp(a: unknown, b: unknown, ok: (d: number) => boolean): boolean {
  if (typeof a === "number" && typeof b === "number") return ok(a - b);
  if (typeof a === "string" && typeof b === "string") return ok(a < b ? -1 : a > b ? 1 : 0);
  return false; // Mongo: khác kiểu thì không so được
}

function matchField(value: unknown, cond: unknown, present: boolean): boolean {
  if (cond === null || typeof cond !== "object" || Array.isArray(cond)) return value === cond;
  const ops = cond as Record<string, unknown>;
  return Object.entries(ops).every(([op, arg]) => {
    switch (op) {
      case "$eq":
        return value === arg;
      case "$ne":
        return value !== arg;
      case "$gt":
        return sameTypeCmp(value, arg, (d) => d > 0);
      case "$gte":
        return sameTypeCmp(value, arg, (d) => d >= 0);
      case "$lt":
        return sameTypeCmp(value, arg, (d) => d < 0);
      case "$lte":
        return sameTypeCmp(value, arg, (d) => d <= 0);
      case "$in":
        return (arg as unknown[]).includes(value);
      case "$nin":
        return !(arg as unknown[]).includes(value);
      case "$exists":
        return present === arg;
      case "$regex":
        return typeof value === "string" && new RegExp(arg as string, (ops["$options"] as string | undefined) ?? "").test(value);
      case "$options":
        return true;
      case "$not":
        return !matchField(value, arg, present);
      default:
        return false; // guard đã chặn; tới đây là lỗi lập trình → không khớp gì
    }
  });
}
```
`apps/mcp-server/src/query/mongo-store.ts`

```ts
import type { QueryCollection } from "@nexus/shared";
import { MongoClient, type Document, type Filter } from "mongodb";
import type { FindOptions, ReadOnlyStore, Row } from "./store.ts";

/**
 * Bản Mongo của ReadOnlyStore — kết nối RIÊNG bằng user chỉ có role "read" (infra/mongo/create-reader.js).
 * Chưa chạy ở sandbox dựng bài (không có MongoDB). Kiểm trên máy bạn: lệnh ở Lab Nexus S5.2.
 */
export async function createMongoReadOnlyStore(uri: string): Promise<{ store: ReadOnlyStore; close: () => Promise<void> }> {
  const client = new MongoClient(uri, {
    appName: "nexus-mcp-query",
    readPreference: "secondaryPreferred", // truy vấn của LLM không tranh tài nguyên với primary
    serverSelectionTimeoutMS: 3_000,
  });
  await client.connect();
  const db = client.db();
  const store: ReadOnlyStore = {
    async find(collection: QueryCollection, filter: Record<string, unknown>, opts: FindOptions) {
      const col = db.collection<Document>(collection);
      const f = filter as Filter<Document>;
      const projection = opts.fields ? Object.fromEntries(opts.fields.map((k) => [k, 1])) : undefined;
      const cursor = col
        .find(f, { maxTimeMS: 2_000, ...(projection ? { projection } : {}) })
        .limit(opts.limit);
      if (opts.sort) cursor.sort({ [opts.sort.field]: opts.sort.order === "asc" ? 1 : -1 });
      const [matched, docs] = await Promise.all([col.countDocuments(f, { maxTimeMS: 2_000 }), cursor.toArray()]);
      return { matched, items: docs.map(({ _id, ...rest }): Row => ({ id: _id, ...rest })) };
    },
  };
  return { store, close: () => client.close() };
}
```
`apps/mcp-server/src/tools/query.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { QueryInputSchema, QueryOutputSchema, RESOURCE, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { FIELDS } from "../query/catalog.ts";
import { checkFilter } from "../query/filter-guard.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerQuery(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.query,
    {
      title: "Truy vấn dữ liệu (chỉ đọc)",
      description:
        `Truy vấn chỉ đọc trên customers hoặc orders bằng filter kiểu MongoDB. Field và toán tử hợp lệ ở resource ${RESOURCE.schema}. ` +
        "Dùng khi các tool chuyên biệt (nexus_list_customers, nexus_search_customers) không đủ. " +
        "Đếm bằng matched; items tối đa 50.",
      inputSchema: QueryInputSchema.shape,
      outputSchema: QueryOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.query, deps.log, async ({ collection, filter, fields, sort, limit }) => {
      const guard = checkFilter(collection, filter);
      if (!guard.ok) {
        deps.log.warn("query filter rejected", { collection, at: guard.at, problem: guard.problem });
        return toolFail({ what: `Filter bị từ chối tại "${guard.at}": ${guard.problem}.`, next: `Sửa filter theo ${RESOURCE.schema} rồi gọi lại.` });
      }
      const known = FIELDS[collection];
      const bad = [...(fields ?? []), ...(sort ? [sort.field] : [])].filter((f) => !known.has(f));
      if (bad.length > 0) {
        return toolFail({ what: `Field không có trong ${collection}: ${bad.join(", ")}.`, next: `Field hợp lệ: ${[...known].join(", ")}.` });
      }
      const r = await deps.query.find(collection, filter, { fields, sort, limit });
      return toolOk(QueryOutputSchema, { collection, matched: r.matched, returned: r.items.length, items: r.items.map((x) => ({ ...x })) });
    }),
  );
}
```
`apps/mcp-server/src/resources/schema.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RESOURCE } from "@nexus/shared";
import { SCHEMA_DOC } from "../query/catalog.ts";

/** M5 · S5.2: schema publish thành resource — host đưa vào context TRƯỚC khi model viết filter. */
export function registerSchema(server: McpServer): void {
  server.registerResource(
    "schema",
    RESOURCE.schema,
    {
      title: "Schema dữ liệu Nexus",
      description: "Collection, field, kiểu và toán tử mà nexus_query chấp nhận. Đưa vào context trước khi model truy vấn dữ liệu.",
      mimeType: "text/markdown",
      size: Buffer.byteLength(SCHEMA_DOC),
      annotations: { audience: ["assistant"], priority: 0.8 },
    },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/markdown", text: SCHEMA_DOC }] }),
  );
}
```
`apps/mcp-server/src/orders/seed-data.ts`

```ts
import { PRODUCTS, type Customer, type Order } from "@nexus/shared";

/** LCG cố định: cùng seed → cùng dữ liệu ở mọi máy (để số liệu trong bài chạy lại ra y nguyên). */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const PRICE: Record<(typeof PRODUCTS)[number], readonly [number, number]> = {
  "Gói Pro": [2_400_000, 6_000_000],
  "Gói Enterprise": [15_000_000, 40_000_000],
  "Tư vấn": [5_000_000, 20_000_000],
  "Đào tạo": [8_000_000, 25_000_000],
  "Tích hợp API": [10_000_000, 50_000_000],
};

/** n đơn hàng rải đều 12 tháng 2025-10 → 2026-09, giờ UTC. */
export function seedOrders(customers: readonly Customer[], n = 600, seed = 2026): Order[] {
  const r = rng(seed);
  const start = Date.UTC(2025, 9, 1);
  const end = Date.UTC(2026, 9, 1);
  const out: Order[] = [];
  for (let i = 0; i < n; i++) {
    const c = customers[Math.floor(r() * customers.length)];
    if (!c) continue;
    const product = PRODUCTS[Math.floor(r() * PRODUCTS.length)] ?? "Gói Pro";
    const [lo, hi] = PRICE[product];
    const amount = Math.round((lo + r() * (hi - lo)) / 100_000) * 100_000;
    const p = r();
    out.push({
      id: `ord_${String(i + 1).padStart(5, "0")}`,
      customerId: c.id,
      product,
      amount,
      status: p < 0.88 ? "paid" : p < 0.96 ? "pending" : "refunded",
      city: c.city,
      createdAt: new Date(start + Math.floor(r() * (end - start))).toISOString(),
    });
  }
  return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
```
`apps/mcp-server/scripts/query-probe.ts`

```ts
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
```

### infra

`infra/mongo/create-reader.js`

```js
// mongosh "mongodb://admin:<mật khẩu>@127.0.0.1:27017/admin?replicaSet=rs0" infra/mongo/create-reader.js
// User riêng cho tool nexus_query: chỉ role "read" trên db nexus (M5 · S5.2).
// Chưa chạy ở sandbox dựng bài (không có MongoDB).
const pwd = process.env.NEXUS_READER_PASSWORD;
if (!pwd) throw new Error("đặt NEXUS_READER_PASSWORD trước khi chạy");
const admin = db.getSiblingDB("admin");
if (admin.getUser("nexus_reader")) {
  admin.updateUser("nexus_reader", { pwd, roles: [{ role: "read", db: "nexus" }] });
} else {
  admin.createUser({ user: "nexus_reader", pwd, roles: [{ role: "read", db: "nexus" }] });
}
printjson(admin.getUser("nexus_reader", { showPrivileges: false }));
```

### lesson-code

`lesson-code/m5/traps/blacklist-guard.ts`

```ts
// Bẫy 1 (S5.2) — dịch thẳng "chặn $where": blacklist trên chuỗi JSON. So với allow-list của Nexus.
import { checkFilter } from "../../../nexus/apps/mcp-server/src/query/filter-guard.ts";

const BLACKLIST = ["$where"];
const blacklistOk = (filter: Record<string, unknown>): boolean => !BLACKLIST.some((op) => JSON.stringify(filter).includes(op));

const EVIL: Array<[string, Record<string, unknown>]> = [
  ["$where", { $where: "sleep(5000) || true" }],
  ["$expr + $function", { $expr: { $function: { body: "function(){return true}", args: [], lang: "js" } } }],
  ["$function trên field", { amount: { $function: { body: "function(){}", args: [], lang: "js" } } }],
  ["$accumulator trong $expr", { $expr: { $gt: [{ $accumulator: { init: "function(){}", accumulate: "function(){}", lang: "js" } }, 0] } }],
  ["regex ReDoS", { product: { $regex: "^(a+)+$" } }],
  ["field ẩn", { passwordHash: { $exists: true } }],
];

console.log(`${"filter độc".padEnd(26)} ${"blacklist $where".padEnd(18)} allow-list Nexus`);
for (const [label, f] of EVIL) {
  const g = checkFilter("orders", f);
  console.log(`${label.padEnd(26)} ${(blacklistOk(f) ? "✗ cho qua" : "✓ chặn").padEnd(18)} ${g.ok ? "✗ cho qua" : `✓ chặn tại ${g.at}`}`);
}
```
`lesson-code/m5/traps/sqlite-select-only.ts`

```ts
// Bẫy 2 (S5.2) — "chỉ cho SELECT" bằng regex trên câu SQL, kết nối có quyền ghi. Rồi cùng câu đó trên kết nối read-only.
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const file = path.join(mkdtempSync(path.join(tmpdir(), "m5-sqlite-")), "shop.db");
const setup = new DatabaseSync(file);
setup.exec("CREATE TABLE orders(id TEXT PRIMARY KEY, amount INTEGER); INSERT INTO orders VALUES ('o1',100),('o2',200),('o3',300);");
setup.close();

const looksLikeSelect = (sql: string): boolean => /^\s*(select|with)\b/i.test(sql); // "WITH" để cho CTE đi qua
const SQL = "WITH x AS (SELECT 1) DELETE FROM orders RETURNING id";
console.log(`câu SQL: ${SQL}`);
console.log(`regex "chỉ SELECT/WITH" cho qua: ${looksLikeSelect(SQL)}`);

const count = (db: DatabaseSync): unknown => (db.prepare("SELECT count(*) AS n FROM orders").get() as { n: number }).n;

const rw = new DatabaseSync(file);
console.log(`\nkết nối thường — trước: ${count(rw)} đơn`);
console.log("chạy:", JSON.stringify(rw.prepare(SQL).all()));
console.log(`sau: ${count(rw)} đơn`);
rw.exec("INSERT INTO orders VALUES ('o1',100),('o2',200),('o3',300);");
rw.close();

const ro = new DatabaseSync(file, { readOnly: true });
console.log(`\nkết nối readOnly — trước: ${count(ro)} đơn`);
try {
  ro.prepare(SQL).all();
} catch (err) {
  console.log(`DB từ chối: ${(err as Error).message}`);
}
console.log(`sau: ${count(ro)} đơn`);
```
`lesson-code/m5/patterns/generic-repository.direct.ts`

```ts
// Dịch thẳng từ C#: IRepository<T> đủ CRUD tiêm vào tool truy vấn, "chỉ đọc" là quy ước.
export interface IRepository<T> {
  find(filter: Record<string, unknown>, limit: number): Promise<T[]>;
  insert(item: T): Promise<void>;
  update(filter: Record<string, unknown>, patch: Partial<T>): Promise<number>;
  delete(filter: Record<string, unknown>): Promise<number>;
}

export class QueryToolHandler<T> {
  private readonly repo: IRepository<T>;
  constructor(repo: IRepository<T>) {
    this.repo = repo;
  }
  // Chỉ gọi find… hôm nay. Không gì ngăn PR sau thêm "dọn dữ liệu rác" vào đây.
  async handle(filter: Record<string, unknown>, limit: number): Promise<T[]> {
    return this.repo.find(filter, limit);
  }
}

// Cùng 1 connection string (user có quyền readWrite) cho mọi repository — đăng ký 1 lần trong DI
export const CONNECTION_STRING = "mongodb://nexus_app:secret@db:27017/nexus";
```

---

## S5.3 — Bọc REST API & rate limit

Mục tiêu: biến API của bên thứ ba thành bộ tool **ổn định**: auth ở một chỗ, thay được nhà cung cấp, gặp `429` thì biết lúc nào chờ và lúc nào trả lỗi ngay, không bao giờ treo tool và không bao giờ tạo bản ghi trùng khi thử lại.

### C# → TS/Node

| Khái niệm C# | Tương đương TS/Node | Khác ở đâu |
|---|---|---|
| `IHttpClientFactory` + typed client | `createApiClient({...})` trả object 2 hàm `get`/`post` | Hàm + closure, không đăng ký DI |
| `DelegatingHandler` (auth, retry, logging) | Tùy chọn `auth`, `retry`, `log` của 1 hàm | Không có pipeline handler; 1 vòng lặp đọc từ trên xuống |
| Polly `WaitAndRetryAsync` + jitter | `backoff()` full jitter (chờ ngẫu nhiên trong `[0, trần]` để các client không thử lại cùng lúc) + `retryOrThrow` | ~40 dòng tự viết, không thêm thư viện |
| `response.Headers.RetryAfter` (`Delta` / `Date`) | `parseRetryAfter(header, now)` | Header là chuỗi thô — tự xử lý cả số giây lẫn HTTP-date |
| `CancellationTokenSource.CreateLinkedTokenSource` + `CancelAfter` | `AbortSignal.any([...])` + `AbortSignal.timeout(ms)` | Ghép 3 nguồn hủy: client MCP hủy, ngân sách cả lời gọi, timeout từng lần thử |
| `HttpRequestException.StatusCode` | `ApiError` có `kind` (union 7 giá trị), `status`, `retryAfterMs` | `switch (err.kind)` được tsc kiểm đủ nhánh (Bẫy 3) |
| Header `Idempotency-Key` (kiểu Stripe) | Cùng header, key = hash nội dung | Model tự gọi lại tool cũng không tạo trùng |
| Typed client trả DTO của vendor | Adapter đổi `customer_id` → `customerId` ngay tại biên | DTO của vendor không lọt vào tool (anti-corruption layer) |

### Lab

#### Lab C50 — 23 REST API Wrapper · 24 Keys and Rate Limits

**Mục tiêu:** Lab 23 biến `list` và `create` của một REST API thành tool, với auth header và thiết kế thay được endpoint; Lab 24 đối mặt với `429` và quyết định: chờ, hay bỏ cuộc và trả về.

- [ ] Lab 23 xanh.
- [ ] Lab 24 xanh.

**Lệnh nghiệm thu** (repo C50 — chưa chạy ở sandbox dựng bài):

```console
$ npm run check
```

Cần nắm để tự làm:

- Lab 23: key/token đọc từ biến môi trường, gắn vào header ở **một** chỗ; base URL cũng từ cấu hình. Review “swappable design”: harness có thể trỏ server của bạn sang API giả — code không được dán cứng URL.
- Không để key lọt vào text lỗi, log, hay `structuredContent`.
- `create` trả về bản ghi vừa tạo (id), không chỉ “OK” — model cần id cho bước sau.
- Lab 24: đọc `Retry-After` (2 dạng: số giây, hoặc ngày giờ HTTP). Câu Review “chờ, hay bỏ cuộc và trả về” = so thời gian phải chờ với một ngưỡng bạn đặt; quá ngưỡng thì trả lỗi **có số giây** để model báo người dùng.
- Đừng thử lại trong vòng lặp không chờ (Bẫy 1), và cân nhắc thử lại `create` (Bẫy 2).

#### Lab Nexus S5.3 — client HTTP chung + helpdesk

**Mục tiêu:** `http/api-client.ts` dùng chung cho mọi API ngoài (timeout, retry an toàn, `Retry-After`, ngân sách thời gian); helpdesk qua cổng `HelpdeskPort` + adapter HTTP; 2 tool `nexus_list_tickets`, `nexus_create_ticket`; dịch vụ tỷ giá của M3 chuyển sang client chung.

- [ ] `node scripts/rate-demo.ts`: kịch bản 1 — lời gọi #6–#8 mỗi cái ~1000 ms và vẫn trả `total=14`; kịch bản 2 — `isError` “cần đợi 30 giây” trong < 100 ms, helpdesk chỉ thấy 2 request; kịch bản 4 — token sai: 1 request, không thử lại; kịch bản 5 — lần 2 `created=false`, helpdesk “tạo 1”.
- [ ] Gặp 429 kéo dài thì trả lỗi rõ ràng thay vì treo tool.
- [ ] Chỉ `api-client.ts` gọi `fetch`: `grep -rnE "\bfetch\(|doFetch\(" src | cut -d: -f1 | sort -u` → `src/http/api-client.ts`.
- [ ] Token chỉ đến từ env: `grep -rn "dev-helpdesk-token" src | wc -l` → `0`.
- [ ] Đổi nhà cung cấp helpdesk = viết adapter mới cho `HelpdeskPort`; không file nào trong `src/tools` import `http-helpdesk.ts`.
- [ ] `rates/client.ts` dùng `createApiClient` (refactor, xem diff); `nexus_get_exchange_rate` vẫn trả câu lỗi như M3.

**Lệnh nghiệm thu:**

```console
$ node scripts/rate-demo.ts
$ grep -rnE "\bfetch\(|doFetch\(" src | cut -d: -f1 | sort -u
$ grep -rn "dev-helpdesk-token" src | wc -l
$ grep -rln "http-helpdesk" src/tools | wc -l
```

**Gợi ý hướng làm:** viết `scripts/stub/helpdesk.ts` trước (để có cái mà bị chặn); rồi `http/api-client.ts` → `helpdesk/port.ts` + `http-helpdesk.ts` → `tools/helpdesk-errors.ts` + 2 tool → `helpdeskFromEnv` trong `deps.ts` → `scripts/rate-demo.ts`.

Output thật — server Nexus thật (stdio) gọi helpdesk giả lập qua HTTP thật, 5 kịch bản:

```console
$ node scripts/rate-demo.ts

== 1 · 8 lời gọi liền nhau, bucket 5 request, hồi 1 request/giây
   #1    47 ms  total=14
   #2     4 ms  total=14
   #3     3 ms  total=14
   #4     2 ms  total=14
   #5     3 ms  total=14
   #6  1006 ms  total=14
   #7  1007 ms  total=14
   #8  1006 ms  total=14
   helpdesk thấy: 11 request · 3 lần 429 · tạo 0 · trả lại 0

== 2 · bị chặn dài: Retry-After 30 giây (> maxWaitMs 5 s)
   #1    48 ms  total=40
   #2     3 ms  [isError] Helpdesk đang giới hạn tần suất (cần đợi 30 giây). Đừng gọi lại ngay. Báo người dùng thử lại sau 30 giây.
   helpdesk thấy: 2 request · 1 lần 429 · tạo 0 · trả lại 0

== 3 · Retry-After dạng HTTP-date
   #1    51 ms  total=40
   #2  1608 ms  total=40
   helpdesk thấy: 4 request · 2 lần 429 · tạo 0 · trả lại 0

== 4 · token sai
   #1    45 ms  [isError] Nexus chưa được cấu hình đúng quyền truy cập helpdesk. Không thử lại; báo người dùng liên hệ quản trị viên.
   helpdesk thấy: 1 request · 0 lần 429 · tạo 0 · trả lại 0

== 5 · tạo ticket 2 lần cùng nội dung (bucket 1: lần 2 dính 429 rồi thử lại)
   #1    49 ms  ticket T-1041 · created=true
   #2  1009 ms  ticket T-1041 · created=false
   helpdesk thấy: 3 request · 1 lần 429 · tạo 1 · trả lại 1
```

Đọc kịch bản 3: `Retry-After` dạng HTTP-date chỉ chính xác tới **giây** — client chờ phần lẻ còn lại rồi gọi lại hơi sớm, ăn thêm một `429`, rồi mới qua (2 lần 429, 1169 ms). Không sai, nhưng là lý do `maxAttempts` phải > 2.

<details>
<summary>Xem sau khi làm xong — lời giải Lab Nexus S5.3</summary>

`apps/mcp-server/src/http/api-client.ts`

```ts
import type { z } from "zod";
import type { Logger } from "../log.ts";

/**
 * Client HTTP dùng chung cho mọi API bên thứ ba (M5 · S5.3).
 *  - Auth header lấy qua hàm (token xoay vòng được), không dán cứng.
 *  - 429/503: tôn trọng Retry-After. Chờ nếu ngắn và còn ngân sách; dài thì trả lỗi NGAY kèm số giây.
 *  - Lỗi mạng / 5xx / timeout: chỉ thử lại khi an toàn (GET, hoặc POST có Idempotency-Key), backoff mũ + jitter.
 *  - Ngân sách thời gian cho cả lời gọi (budgetMs): tool không bao giờ treo quá mức này.
 */
export type ApiErrorKind = "auth" | "not_found" | "bad_request" | "rate_limited" | "unavailable" | "timeout" | "bad_response";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | undefined;
  /** Bên kia bảo đợi bao lâu (đã quy ra ms) — chỉ có với rate_limited / unavailable. */
  readonly retryAfterMs: number | undefined;
  constructor(kind: ApiErrorKind, message: string, status?: number, retryAfterMs?: number) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

export interface RetryPolicy {
  /** Tổng số lần gửi, tính cả lần đầu. */
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** Retry-After dài hơn mức này → không chờ, trả lỗi ngay. */
  maxWaitMs: number;
  /** Thời gian tối đa cho cả lời gọi, gồm mọi lần thử và thời gian chờ. */
  budgetMs: number;
}

export interface ApiClientOptions {
  name: string;
  baseUrl: string;
  timeoutMs: number;
  retry: RetryPolicy;
  auth?: () => Record<string, string>;
  log?: Logger;
  fetch?: typeof fetch;
  sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
  random?: () => number;
  now?: () => number;
}

export interface RequestOptions<S extends z.ZodType> {
  schema: S;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  /** POST chỉ được thử lại khi có key — bên kia nhận key trùng thì trả kết quả cũ, không tạo bản 2. */
  idempotencyKey?: string;
  signal?: AbortSignal;
}

export interface ApiClient {
  get<S extends z.ZodType>(path: string, opts: RequestOptions<S>): Promise<z.infer<S>>;
  post<S extends z.ZodType>(path: string, opts: RequestOptions<S>): Promise<z.infer<S>>;
}

/** Retry-After: số giây ("30") hoặc HTTP-date ("Wed, 21 Oct 2026 07:28:00 GMT"). */
export function parseRetryAfter(value: string | null, now: number): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  if (/^\d+$/.test(value.trim())) return Number(value.trim()) * 1_000;
  const at = Date.parse(value);
  return Number.isNaN(at) ? undefined : Math.max(0, at - now);
}

const defaultSleep = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(signal.reason);
    }, { once: true });
  });

export function createApiClient(o: ApiClientOptions): ApiClient {
  const doFetch = o.fetch ?? fetch;
  const sleep = o.sleep ?? defaultSleep;
  const random = o.random ?? Math.random;
  const now = o.now ?? Date.now;

  async function request<S extends z.ZodType>(method: "GET" | "POST", path: string, opts: RequestOptions<S>): Promise<z.infer<S>> {
    const url = new URL(path, o.baseUrl);
    for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v));
    const retrySafe = method === "GET" || opts.idempotencyKey !== undefined;
    const started = now();
    const budget = AbortSignal.timeout(o.retry.budgetMs);
    const outer = opts.signal ? AbortSignal.any([opts.signal, budget]) : budget;

    for (let attempt = 1; ; attempt++) {
      const left = o.retry.budgetMs - (now() - started);
      const backoff = (): number => Math.round(random() * Math.min(o.retry.maxDelayMs, o.retry.baseDelayMs * 2 ** (attempt - 1)));
      /** Chờ rồi thử lại nếu còn lượt + còn ngân sách; không thì ném lỗi. */
      const retryOrThrow = async (wait: number, err: ApiError): Promise<void> => {
        if (attempt >= o.retry.maxAttempts || wait > left - o.timeoutMs) throw err;
        o.log?.warn("api retry", { api: o.name, attempt, waitMs: wait, reason: err.kind, status: err.status });
        await sleep(wait, outer);
      };

      const headers: Record<string, string> = { accept: "application/json", ...(o.auth?.() ?? {}) };
      if (opts.body !== undefined) headers["content-type"] = "application/json";
      if (opts.idempotencyKey) headers["idempotency-key"] = opts.idempotencyKey;
      const attemptSignal = AbortSignal.any([outer, AbortSignal.timeout(Math.min(o.timeoutMs, Math.max(1, left)))]);

      let res: Response;
      try {
        res = await doFetch(url, { method, headers, signal: attemptSignal, ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}) });
      } catch {
        if (opts.signal?.aborted) throw new ApiError("timeout", `${o.name}: lời gọi bị hủy.`);
        const kind = attemptSignal.aborted ? "timeout" : "unavailable";
        const err = new ApiError(kind, kind === "timeout" ? `${o.name} không trả lời kịp.` : `Không kết nối được ${o.name}.`);
        if (!retrySafe) throw err; // POST không key: có thể bên kia ĐÃ xử lý — thử lại là tạo trùng
        await retryOrThrow(backoff(), err);
        continue;
      }

      if (res.ok) {
        const body: unknown = await res.json().catch(() => undefined);
        const parsed = opts.schema.safeParse(body);
        if (!parsed.success) throw new ApiError("bad_response", `${o.name} trả dữ liệu không đúng định dạng.`, res.status);
        return parsed.data;
      }

      const detail = await res.text().catch(() => "");
      if (res.status === 401 || res.status === 403) throw new ApiError("auth", `${o.name} từ chối xác thực (HTTP ${res.status}).`, res.status);
      if (res.status === 404) throw new ApiError("not_found", `${o.name}: không tìm thấy.`, res.status);
      if (res.status === 400 || res.status === 422) throw new ApiError("bad_request", `${o.name} từ chối dữ liệu: ${detail.slice(0, 200)}`, res.status);
      if (res.status === 429 || res.status === 503) {
        const ra = parseRetryAfter(res.headers.get("retry-after"), now());
        const kind = res.status === 429 ? "rate_limited" : "unavailable";
        const err = new ApiError(kind, `${o.name} ${res.status === 429 ? "đang giới hạn tần suất" : "tạm quá tải"}.`, res.status, ra);
        // 429: bên kia CHƯA xử lý request → thử lại an toàn cả với POST. 503 không chắc → theo retrySafe.
        if (res.status === 503 && !retrySafe) throw err;
        if (ra !== undefined && ra > o.retry.maxWaitMs) throw err; // chờ quá lâu: trả về ngay để tool không treo
        await retryOrThrow(ra ?? backoff(), err);
        continue;
      }
      const err = new ApiError("unavailable", `${o.name} lỗi HTTP ${res.status}.`, res.status);
      if (!retrySafe || res.status < 500) throw err;
      await retryOrThrow(backoff(), err);
    }
  }

  return {
    get: (path, opts) => request("GET", path, opts),
    post: (path, opts) => request("POST", path, opts),
  };
}
```
`apps/mcp-server/src/helpdesk/port.ts`

```ts
import type { Ticket } from "@nexus/shared";

/**
 * Cổng tới hệ thống helpdesk (M5 · S5.3). Tool chỉ biết cổng này — đổi nhà cung cấp là viết adapter mới,
 * không sửa tool. Kiểu dữ liệu là của Nexus (camelCase), không phải của vendor.
 */
export interface HelpdeskPort {
  listTickets(q: { status?: Ticket["status"] | undefined; customerId?: string | undefined; limit: number }, signal?: AbortSignal): Promise<{ total: number; items: Ticket[] }>;
  createTicket(
    input: { customerId: string; subject: string; body: string; priority: Ticket["priority"] },
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<{ ticket: Ticket; created: boolean }>;
}
```
`apps/mcp-server/src/helpdesk/http-helpdesk.ts`

```ts
import { TICKET_PRIORITIES, TICKET_STATUSES, type Ticket } from "@nexus/shared";
import { z } from "zod";
import type { ApiClient } from "../http/api-client.ts";
import type { HelpdeskPort } from "./port.ts";

/** Hình dạng của VENDOR (snake_case) — chỉ sống trong file này (anti-corruption layer). */
const VendorTicket = z.object({
  id: z.string(),
  customer_id: z.string(),
  subject: z.string(),
  status: z.enum(TICKET_STATUSES),
  priority: z.enum(TICKET_PRIORITIES),
  created_at: z.string(),
});
const VendorList = z.object({ data: z.array(VendorTicket), total: z.number().int() });
const VendorCreated = z.object({ ticket: VendorTicket, replayed: z.boolean() });

const toTicket = (t: z.infer<typeof VendorTicket>): Ticket => ({
  id: t.id,
  customerId: t.customer_id,
  subject: t.subject,
  status: t.status,
  priority: t.priority,
  createdAt: t.created_at,
});

export function createHttpHelpdesk(api: ApiClient): HelpdeskPort {
  return {
    async listTickets({ status, customerId, limit }, signal) {
      const r = await api.get("/v1/tickets", {
        schema: VendorList,
        query: { status, customer: customerId, limit },
        ...(signal ? { signal } : {}),
      });
      return { total: r.total, items: r.data.map(toTicket) };
    },
    async createTicket(input, idempotencyKey, signal) {
      const r = await api.post("/v1/tickets", {
        schema: VendorCreated,
        body: { customer_id: input.customerId, subject: input.subject, body: input.body, priority: input.priority },
        idempotencyKey,
        ...(signal ? { signal } : {}),
      });
      return { ticket: toTicket(r.ticket), created: !r.replayed };
    },
  };
}
```
`apps/mcp-server/src/tools/helpdesk-errors.ts`

```ts
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ApiError } from "../http/api-client.ts";
import { toolFail } from "../tool-result.ts";

/** Dịch ApiError → câu model đọc được + bước tiếp theo. Lỗi lạ: ném tiếp cho instrument. */
export function helpdeskFailure(err: unknown): CallToolResult {
  if (!(err instanceof ApiError)) throw err;
  const secs = err.retryAfterMs !== undefined ? Math.ceil(err.retryAfterMs / 1000) : undefined;
  switch (err.kind) {
    case "rate_limited":
      return toolFail({
        what: `Helpdesk đang giới hạn tần suất${secs !== undefined ? ` (cần đợi ${secs} giây)` : ""}.`,
        next: `Đừng gọi lại ngay. Báo người dùng thử lại${secs !== undefined ? ` sau ${secs} giây` : " sau ít phút"}.`,
      });
    case "auth":
      return toolFail({ what: "Nexus chưa được cấu hình đúng quyền truy cập helpdesk.", next: "Không thử lại; báo người dùng liên hệ quản trị viên." });
    case "timeout":
    case "unavailable":
      return toolFail({ what: "Helpdesk không phản hồi.", next: "Thử lại sau ít phút; không đoán nội dung ticket." });
    case "bad_request":
      return toolFail({ what: err.message, next: "Sửa dữ liệu theo thông báo rồi gọi lại." });
    case "not_found":
    case "bad_response":
      return toolFail({ what: "Helpdesk trả kết quả không dùng được.", next: "Báo người dùng; không thử lại liên tục." });
  }
}
```
`apps/mcp-server/src/tools/create-ticket.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CreateTicketInputSchema, CreateTicketOutputSchema, TOOL } from "@nexus/shared";
import { createHash } from "node:crypto";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";
import { helpdeskFailure } from "./helpdesk-errors.ts";

/** Cùng nội dung → cùng key: model gọi lại (hoặc client retry) không tạo ticket thứ 2. */
const idemKey = (customerId: string, subject: string, body: string): string =>
  createHash("sha256").update(`${customerId}\n${subject}\n${body}`).digest("hex").slice(0, 32);

export function registerCreateTicket(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.createTicket,
    {
      title: "Tạo ticket hỗ trợ",
      description:
        "Tạo 1 ticket trên helpdesk cho 1 khách. Gọi khi người dùng yêu cầu ghi nhận sự cố/yêu cầu hỗ trợ. " +
        "Gọi lại với cùng nội dung không tạo bản trùng (created=false).",
      inputSchema: CreateTicketInputSchema.shape,
      outputSchema: CreateTicketOutputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    instrument(TOOL.createTicket, deps.log, async ({ customerId, subject, body, priority }, extra) => {
      if (!(await deps.customers.get(customerId))) {
        return toolFail({ what: `Không có khách hàng ${customerId}.`, next: "Lấy id đúng bằng nexus_search_customers trước khi tạo ticket." });
      }
      try {
        const r = await deps.helpdesk.createTicket({ customerId, subject, body, priority }, idemKey(customerId, subject, body), extra.signal);
        return toolOk(CreateTicketOutputSchema, r);
      } catch (err) {
        return helpdeskFailure(err);
      }
    }),
  );
}
```
`apps/mcp-server/src/deps.ts`

```ts
import type { CustomerRepository } from "./customers/repository.ts";
import { createMemoryCustomerRepository } from "./customers/memory-repository.ts";
import { createMongoCustomerRepository } from "./customers/mongo-repository.ts";
import { seedCustomers } from "./customers/seed-data.ts";
import { connectMongo } from "./db.ts";
import type { Env } from "./env.ts";
import { openRoot } from "./files/safe-path.ts";
import { createHttpHelpdesk } from "./helpdesk/http-helpdesk.ts";
import type { HelpdeskPort } from "./helpdesk/port.ts";
import { createApiClient } from "./http/api-client.ts";
import { createMongoOrderRepository } from "./orders/mongo-repository.ts";
import { createMemoryOrderRepository, type OrderRepository } from "./orders/repository.ts";
import { seedOrders } from "./orders/seed-data.ts";
import { createMemoryReadOnlyStore } from "./query/memory-store.ts";
import { createMongoReadOnlyStore } from "./query/mongo-store.ts";
import type { ReadOnlyStore, Row } from "./query/store.ts";
import { createMemoryTaskRepository } from "./tasks/memory-repository.ts";
import { createMongoTaskRepository } from "./tasks/mongo-repository.ts";
import type { TaskRepository } from "./tasks/repository.ts";
import { seedTasks } from "./tasks/seed-data.ts";
import { createLogger, type Logger } from "./log.ts";
import { createRatesClient, type RatesClient } from "./rates/client.ts";

/** Mọi thứ tool cần — composition root ghép 1 lần, tool nhận qua tham số (M3). */
export interface Deps {
  log: Logger;
  customers: CustomerRepository;
  rates: RatesClient;
  /** realpath của thư mục export (M5 · S5.1) */
  exportsDir: string;
  orders: OrderRepository;
  /** Cửa chỉ đọc cho nexus_query (M5 · S5.2) */
  query: ReadOnlyStore;
  /** Helpdesk bên ngoài qua client HTTP chung (M5 · S5.3) */
  helpdesk: HelpdeskPort;
  /** Việc nội bộ (M5 · S5.5) */
  tasks: TaskRepository;
  close(): Promise<void>;
}

export function helpdeskFromEnv(env: Pick<Env, "HELPDESK_URL" | "HELPDESK_TOKEN">, log: Logger): HelpdeskPort {
  const token = env.HELPDESK_TOKEN;
  return createHttpHelpdesk(
    createApiClient({
      name: "Helpdesk",
      baseUrl: env.HELPDESK_URL,
      timeoutMs: 3_000,
      retry: { maxAttempts: 4, baseDelayMs: 200, maxDelayMs: 2_000, maxWaitMs: 5_000, budgetMs: 10_000 },
      auth: () => (token ? { authorization: `Bearer ${token}` } : {}),
      log,
    }),
  );
}

/** Store RAM đọc từ repository — cùng hợp đồng với store Mongo dùng user read-only. */
export function memoryQueryStore(customers: CustomerRepository, orders: OrderRepository, tasks: TaskRepository): ReadOnlyStore {
  return createMemoryReadOnlyStore({
    customers: async () => (await customers.list({ limit: 1_000_000 })).items as readonly Row[],
    orders: async () => (await orders.all()) as readonly Row[],
    tasks: async () => (await tasks.page({}, undefined, 1_000_000)).items as readonly Row[],
  });
}

export async function createDeps(env: Env): Promise<Deps> {
  const log = createLogger();
  const rates = createRatesClient(env.RATES_URL, env.RATES_TIMEOUT_MS);
  const exportsDir = await openRoot(env.NEXUS_EXPORT_DIR);
  const helpdesk = helpdeskFromEnv(env, log);
  if (env.NEXUS_DATA === "memory") {
    const seed = seedCustomers();
    const customers = createMemoryCustomerRepository(seed);
    const orders = createMemoryOrderRepository(seedOrders(seed));
    const tasks = createMemoryTaskRepository(seedTasks());
    return { log, rates, exportsDir, helpdesk, customers, orders, tasks, query: memoryQueryStore(customers, orders, tasks), close: async () => undefined };
  }
  const mongo = await connectMongo(env.MONGO_URI);
  const ro = await createMongoReadOnlyStore(env.MONGO_READONLY_URI);
  return {
    log,
    rates,
    exportsDir,
    helpdesk,
    customers: createMongoCustomerRepository(mongo.db),
    orders: createMongoOrderRepository(mongo.db),
    tasks: createMongoTaskRepository(mongo.db),
    query: ro.store,
    close: async () => {
      await Promise.all([mongo.close(), ro.close()]);
    },
  };
}
```

Dịch vụ tỷ giá của M3 chuyển sang client chung (diff thật S5.2 → S5.3):

`apps/mcp-server/src/rates/client.ts`

```diff
 import type { CURRENCIES } from "@nexus/shared";
+import { z } from "zod";
+import { ApiError, createApiClient } from "../http/api-client.ts";
 
 export type Currency = (typeof CURRENCIES)[number];
 }
 
+const RateBody = z.object({ rate: z.number().positive(), asOf: z.string().optional() });
+
+/** M5 · S5.3: dùng client HTTP chung (timeout, retry GET có backoff, Retry-After) thay fetch tự viết. */
 export function createRatesClient(baseUrl: string, timeoutMs: number, fetchImpl: typeof fetch = fetch): RatesClient {
+  const api = createApiClient({
+    name: "Dịch vụ tỷ giá",
+    baseUrl,
+    timeoutMs,
+    fetch: fetchImpl,
+    retry: { maxAttempts: 2, baseDelayMs: 200, maxDelayMs: 1_000, maxWaitMs: 2_000, budgetMs: timeoutMs + 1_500 },
+  });
   return {
     async get(from, signal) {
-      const timeout = AbortSignal.timeout(timeoutMs);
-      const s = signal ? AbortSignal.any([signal, timeout]) : timeout;
-      let res: Response;
       try {
-        res = await fetchImpl(`${baseUrl}/rates/${from}`, { signal: s });
-      } catch {
-        if (timeout.aborted) throw new RatesError("timeout", `Dịch vụ tỷ giá không trả lời trong ${timeoutMs / 1000} giây.`);
-        throw new RatesError("unavailable", "Không kết nối được dịch vụ tỷ giá.");
-      }
-      if (!res.ok) throw new RatesError("unavailable", `Dịch vụ tỷ giá trả lỗi HTTP ${res.status}.`);
-      const body: unknown = await res.json();
-      if (typeof body !== "object" || body === null || typeof (body as { rate?: unknown }).rate !== "number") {
-        throw new RatesError("bad_response", "Dịch vụ tỷ giá trả dữ liệu không đúng định dạng.");
+        const body = await api.get(`/rates/${from}`, { schema: RateBody, ...(signal ? { signal } : {}) });
+        return { from, rate: body.rate, asOf: body.asOf ?? new Date().toISOString() };
+      } catch (err) {
+        if (!(err instanceof ApiError)) throw err;
+        if (err.kind === "timeout") throw new RatesError("timeout", `Dịch vụ tỷ giá không trả lời trong ${timeoutMs / 1000} giây.`);
+        if (err.kind === "bad_response") throw new RatesError("bad_response", "Dịch vụ tỷ giá trả dữ liệu không đúng định dạng.");
+        throw new RatesError("unavailable", err.status ? `Dịch vụ tỷ giá trả lỗi HTTP ${err.status}.` : "Không kết nối được dịch vụ tỷ giá.");
       }
-      const b = body as { rate: number; asOf?: unknown };
-      return { from, rate: b.rate, asOf: typeof b.asOf === "string" ? b.asOf : new Date().toISOString() };
     },
   };
```

</details>

<details>
<summary>Tra khi test đỏ</summary>

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| Tool treo hàng chục giây khi bị chặn | Chờ đúng `Retry-After` dù nó là 30 giây | `maxWaitMs`: dài hơn thì trả lỗi có số giây ngay |
| Vendor khóa API key sau vài phút | Thử lại 429 trong vòng lặp không chờ | Đọc `Retry-After`; không có thì backoff mũ + jitter; giới hạn `maxAttempts` |
| Ticket bị tạo 2–3 lần | Thử lại POST khi timeout | POST chỉ thử lại khi có `Idempotency-Key`; 429 thì an toàn |
| `MaxListenersExceededWarning … abort listeners` | Dùng chung 1 `AbortSignal` cho hàng nghìn `fetch` | Mỗi lần thử 1 signal mới ghép bằng `AbortSignal.any`, và không thử lại vô hạn |
| Lỗi `401` bị thử lại 4 lần | Gom mọi status ≥ 400 vào “thử lại” | 401/403/404/400/422: không thử lại |
| `TS2366 Function lacks ending return statement` | `switch (err.kind)` thiếu nhánh | Thêm nhánh — tsc đang làm đúng việc |
| Token lộ trong output tool | `err.message` của vendor chứa header/URL | Dịch lỗi sang câu của Nexus (`helpdeskFailure`), chi tiết ra stderr |
| Harness Lab 24 báo tool chờ quá lâu | Không có ngân sách tổng; mỗi lần thử timeout riêng | Ngân sách cho cả lời gọi (`budgetMs`) |

</details>

### Chờ hay trả về ngay

**Sơ đồ (Trình tự) — Helpdesk trả 429: tool chờ hay trả về ngay?**

```mermaid
sequenceDiagram
    participant T as Tool
    participant A as api-client
    participant H as Helpdesk
    T->>A: 1. listTickets
    A->>H: 2. GET /v1/tickets
    H-->>A: 3. 429 Retry-After: 1
    A->>H: 4. chờ 1 s, GET lại
    H-->>T: 5. 200 → toolOk
    A-->>T: 6. Retry-After 30 > maxWaitMs → ApiError → isError ngay
    Note over A,H: ✗ retry không chờ: 6220 request / 2 s
```

**Đọc sơ đồ:** Ba cột, đọc ①→⑥. ①–⑤: Retry-After 1 giây ≤ maxWaitMs → client tự chờ rồi gọi lại, tool vẫn trả dữ liệu. ⑥: Retry-After 30 giây > maxWaitMs 5 giây → không chờ, tool trả isError có số giây ngay. *Màu: đỏ gạch + ✗ + viền đứt = bị chặn/sai · vàng mù tạt + ? + viền chấm = cần xem lại · xanh ô-liu + ✓ = chạy đúng. Nhãn = HTTP hoặc kết quả tool.*


Luật của `api-client.ts`, theo thứ tự kiểm:

| Tình huống | Bên kia đã xử lý chưa? | Làm gì |
|---|---|---|
| `401` / `403` / `404` / `400` / `422` | Đã — và câu trả lời sẽ không đổi | Ném ngay, không thử lại |
| `429`, `Retry-After` ≤ `maxWaitMs`, còn ngân sách | **Chưa** (bị từ chối trước khi xử lý) | Chờ đúng `Retry-After` rồi thử lại — an toàn cả với POST |
| `429`, `Retry-After` > `maxWaitMs` | Chưa | Ném `rate_limited` kèm `retryAfterMs` → tool trả “cần đợi N giây” |
| `503` | Thường là chưa, không chắc | Như 429 nếu `retrySafe`, không thì ném |
| Timeout / lỗi mạng / `5xx` khác | **Không biết** | Chỉ thử lại khi `retrySafe` (GET, hoặc POST có `Idempotency-Key`), backoff mũ + jitter |
| Hết lượt hoặc hết ngân sách | — | Ném lỗi cuối cùng |

### Phần khác C# thật sự

**1. Không có pipeline handler.** Thay vì 3 lớp `DelegatingHandler` lồng nhau, 1 hàm nhận cấu hình là **dữ liệu** (`RetryPolicy`). Đọc vòng lặp `for (attempt…)` là thấy hết hành vi; test bằng cách truyền `fetch`, `sleep`, `random`, `now` giả.

**2. Ba nguồn hủy, một signal.** `extra.signal` (client MCP hủy lời gọi tool), `AbortSignal.timeout(budgetMs)` (ngân sách cả lời gọi), `AbortSignal.timeout(timeoutMs)` (mỗi lần thử) ghép bằng `AbortSignal.any` — tương đương linked token source, nhưng tạo mới mỗi lần thử để không tích listener (Bẫy 1).

**3. Câu hỏi đúng là “bên kia đã xử lý chưa?”.** `429` nói rõ là chưa → thử lại POST an toàn. Timeout thì không biết: request có thể đã tới, đã ghi DB, chỉ câu trả lời bị mất. Thử lại lúc đó chỉ an toàn khi bên kia khử trùng được (`Idempotency-Key`).

**4. Model cũng là một vòng retry.** Model thấy lỗi có thể tự gọi lại tool với cùng tham số. Key của Nexus là **hash nội dung** (`customerId + subject + body`) chứ không phải UUID mỗi lần gọi — nên cả lần gọi lại của model cũng trả `created=false` thay vì tạo ticket thứ 2.

**5. Lỗi phải có hạn dùng.** “Helpdesk đang giới hạn tần suất (cần đợi 30 giây). Đừng gọi lại ngay.” — model có thể báo người dùng một con số, thay vì gọi lại 10 lần trong 2 giây và làm vendor khóa key.

**6. Biên dịch vendor → Nexus ngay tại adapter.** Zod schema của vendor (`VendorTicket`) chỉ sống trong `http-helpdesk.ts`. Vendor đổi `created_at` thành `createdAt` hay thêm field: sửa 1 file, tool và `packages/shared` không biết.

### Bẫy dev .NET hay vấp

#### Bẫy 1 — gặp 429 thì `continue`

`lesson-code/m5/traps/retry-no-wait.ts`

```ts
// Bẫy 1 (S5.3) — dịch thẳng "gặp 429 thì thử lại" mà không đọc Retry-After: dội bom API trong lúc bị chặn.
import type { AddressInfo } from "node:net";
import { startHelpdeskStub } from "../../../nexus/apps/mcp-server/scripts/stub/helpdesk.ts";

const stub = await startHelpdeskStub({ port: 0, token: "t", capacity: 1, refillPerSec: 1, retryAfterSec: 30 });
const url = `http://127.0.0.1:${(stub.server.address() as AddressInfo).port}/v1/tickets`;

async function listTicketsNaive(signal: AbortSignal): Promise<number> {
  for (;;) {
    const res = await fetch(url, { headers: { authorization: "Bearer t" }, signal });
    if (res.status === 429) continue; // "retry"
    return res.status;
  }
}

await listTicketsNaive(AbortSignal.timeout(5_000)); // lần 1 dùng hết bucket
const t0 = performance.now();
try {
  const status = await listTicketsNaive(AbortSignal.timeout(2_000));
  console.log(`trả ${status} sau ${Math.round(performance.now() - t0)} ms`);
} catch (err) {
  console.log(`dừng sau ${Math.round(performance.now() - t0)} ms vì ${(err as Error).name}`);
}
console.log(`helpdesk nhận ${stub.stats.requests} request, trả 429 cho ${stub.stats.rejected429} — trong khi đã bảo "đợi 30 giây"`);
stub.server.close();
```

```console
$ node m5/traps/retry-no-wait.ts
(node:2478) MaxListenersExceededWarning: Possible EventTarget memory leak detected. 1501 abort listeners added to [AbortSignal]. MaxListeners is 1500. Use events.setMaxListeners() to increase limit
(Use `node --trace-warnings ...` to show where the warning was created)
(node:2478) MaxListenersExceededWarning: Possible EventTarget memory leak detected. 1502 abort listeners added to [AbortSignal]. MaxListeners is 1500. Use events.setMaxListeners() to increase limit
dừng sau 2030 ms vì TimeoutError
helpdesk nhận 6220 request, trả 429 cho 6219 — trong khi đã bảo "đợi 30 giây"
```

(… còn 2148 dòng `MaxListenersExceededWarning` cùng nội dung, chỉ khác con số listener — lên tới 3309 — đã cắt; chạy lại lệnh trên để xem đủ.)

Hai vấn đề trong một: 6220 request trong 2 giây vào một API đã nói rõ “đợi 30 giây” (vendor thật sẽ khóa key), và cùng 1 `signal` truyền vào hàng nghìn `fetch` — mỗi `fetch` gắn 1 listener `abort` mà không gỡ kịp, Node cảnh báo rò bộ nhớ.

#### Bẫy 2 — thử lại POST khi timeout

Stub tạo ticket **xong** rồi mới trả lời chậm 500 ms; client timeout 300 ms:

`lesson-code/m5/traps/retry-post.ts`

```ts
// Bẫy 2 (S5.3) — retry POST khi timeout, không Idempotency-Key: bên kia ĐÃ tạo ticket, chỉ trả lời chậm.
import type { AddressInfo } from "node:net";
import { z } from "zod";
import { createApiClient, type RequestOptions } from "../../../nexus/apps/mcp-server/src/http/api-client.ts";
import { startHelpdeskStub } from "../../../nexus/apps/mcp-server/scripts/stub/helpdesk.ts";

const body = { customer_id: "cus_007", subject: "Không xuất được hóa đơn", body: "Lỗi 500" };

async function naive(url: string): Promise<void> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await fetch(url, { method: "POST", headers: { authorization: "Bearer t", "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(300) });
      return;
    } catch {
      // timeout → "thử lại cho chắc"
    }
  }
}

async function nexus(base: string, key: string | undefined): Promise<string> {
  const api = createApiClient({
    name: "Helpdesk",
    baseUrl: base,
    timeoutMs: 300,
    auth: () => ({ authorization: "Bearer t" }),
    retry: { maxAttempts: 3, baseDelayMs: 50, maxDelayMs: 200, maxWaitMs: 1_000, budgetMs: 3_000 },
  });
  const opts: RequestOptions<z.ZodUnknown> = { schema: z.unknown(), body, ...(key ? { idempotencyKey: key } : {}) };
  try {
    await api.post("/v1/tickets", opts);
    return "thành công";
  } catch (err) {
    return `lỗi ${(err as Error).message}`;
  }
}

for (const [label, run] of [
  ["vòng for tự viết, không key", async (b: string) => { await naive(`${b}/v1/tickets`); return "xong"; }],
  ["api-client Nexus, không key", (b: string) => nexus(b, undefined)],
  ["api-client Nexus, có key", (b: string) => nexus(b, "k-123")],
] as const) {
  const stub = await startHelpdeskStub({ port: 0, token: "t", capacity: 10, refillPerSec: 10, postDelayMs: 500 });
  const base = `http://127.0.0.1:${(stub.server.address() as AddressInfo).port}`;
  const result = await run(base);
  await new Promise((r) => setTimeout(r, 600)); // đợi stub xử lý xong request cuối
  console.log(`${label.padEnd(30)} → ${result.padEnd(40)} helpdesk: ${stub.stats.requests} POST, tạo ${stub.stats.created} ticket, trả lại ${stub.stats.replayed}`);
  stub.server.close();
}
```

```console
$ node m5/traps/retry-post.ts
vòng for tự viết, không key    → xong                                     helpdesk: 3 POST, tạo 3 ticket, trả lại 0
api-client Nexus, không key    → lỗi Helpdesk không trả lời kịp.          helpdesk: 1 POST, tạo 1 ticket, trả lại 0
api-client Nexus, có key       → thành công                               helpdesk: 2 POST, tạo 1 ticket, trả lại 1
```

Vòng `for` tự viết: 3 ticket cho 1 yêu cầu. `api-client` không key: không thử lại, báo lỗi — đúng, vì không biết bên kia đã tạo chưa (và thật ra đã tạo 1). Có key: thử lại an toàn, bên kia trả lại ticket cũ (`trả lại 1`), vẫn chỉ 1 ticket.

#### Bẫy 3 — `switch` thiếu nhánh lỗi

`lesson-code/m5/tsc-traps/non-exhaustive.ts`

```ts
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ApiError } from "../../../nexus/apps/mcp-server/src/http/api-client.ts";

export function failure(err: ApiError): CallToolResult {
  switch (err.kind) {
    case "rate_limited":
    case "timeout":
    case "unavailable":
      return { isError: true, content: [{ type: "text", text: "Helpdesk không phản hồi. Thử lại sau." }] };
    case "auth":
    case "bad_request":
      return { isError: true, content: [{ type: "text", text: err.message }] };
  }
}
```

> ❌ **TS2366** (dòng 4, cột 41): Function lacks ending return statement and return type does not include 'undefined'.

`ApiError.kind` là union 7 giá trị; `switch` mới có 5. Với C# `enum` + `switch` thiếu `case`, code vẫn build. Ở đây tsc chặn: thêm `kind` mới vào `api-client.ts` là mọi chỗ dịch lỗi đỏ lên.

### Code mẫu & pattern

#### Code production

`apps/mcp-server/src/http/api-client.ts`

```ts
import type { z } from "zod";
import type { Logger } from "../log.ts";

/**
 * Client HTTP dùng chung cho mọi API bên thứ ba (M5 · S5.3).
 *  - Auth header lấy qua hàm (token xoay vòng được), không dán cứng.
 *  - 429/503: tôn trọng Retry-After. Chờ nếu ngắn và còn ngân sách; dài thì trả lỗi NGAY kèm số giây.
 *  - Lỗi mạng / 5xx / timeout: chỉ thử lại khi an toàn (GET, hoặc POST có Idempotency-Key), backoff mũ + jitter.
 *  - Ngân sách thời gian cho cả lời gọi (budgetMs): tool không bao giờ treo quá mức này.
 */
export type ApiErrorKind = "auth" | "not_found" | "bad_request" | "rate_limited" | "unavailable" | "timeout" | "bad_response";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | undefined;
  /** Bên kia bảo đợi bao lâu (đã quy ra ms) — chỉ có với rate_limited / unavailable. */
  readonly retryAfterMs: number | undefined;
  constructor(kind: ApiErrorKind, message: string, status?: number, retryAfterMs?: number) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

export interface RetryPolicy {
  /** Tổng số lần gửi, tính cả lần đầu. */
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** Retry-After dài hơn mức này → không chờ, trả lỗi ngay. */
  maxWaitMs: number;
  /** Thời gian tối đa cho cả lời gọi, gồm mọi lần thử và thời gian chờ. */
  budgetMs: number;
}

export interface ApiClientOptions {
  name: string;
  baseUrl: string;
  timeoutMs: number;
  retry: RetryPolicy;
  auth?: () => Record<string, string>;
  log?: Logger;
  fetch?: typeof fetch;
  sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
  random?: () => number;
  now?: () => number;
}

export interface RequestOptions<S extends z.ZodType> {
  schema: S;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  /** POST chỉ được thử lại khi có key — bên kia nhận key trùng thì trả kết quả cũ, không tạo bản 2. */
  idempotencyKey?: string;
  signal?: AbortSignal;
}

export interface ApiClient {
  get<S extends z.ZodType>(path: string, opts: RequestOptions<S>): Promise<z.infer<S>>;
  post<S extends z.ZodType>(path: string, opts: RequestOptions<S>): Promise<z.infer<S>>;
}

/** Retry-After: số giây ("30") hoặc HTTP-date ("Wed, 21 Oct 2026 07:28:00 GMT"). */
export function parseRetryAfter(value: string | null, now: number): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  if (/^\d+$/.test(value.trim())) return Number(value.trim()) * 1_000;
  const at = Date.parse(value);
  return Number.isNaN(at) ? undefined : Math.max(0, at - now);
}

const defaultSleep = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(signal.reason);
    }, { once: true });
  });

export function createApiClient(o: ApiClientOptions): ApiClient {
  const doFetch = o.fetch ?? fetch;
  const sleep = o.sleep ?? defaultSleep;
  const random = o.random ?? Math.random;
  const now = o.now ?? Date.now;

  async function request<S extends z.ZodType>(method: "GET" | "POST", path: string, opts: RequestOptions<S>): Promise<z.infer<S>> {
    const url = new URL(path, o.baseUrl);
    for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v));
    const retrySafe = method === "GET" || opts.idempotencyKey !== undefined;
    const started = now();
    const budget = AbortSignal.timeout(o.retry.budgetMs);
    const outer = opts.signal ? AbortSignal.any([opts.signal, budget]) : budget;

    for (let attempt = 1; ; attempt++) {
      const left = o.retry.budgetMs - (now() - started);
      const backoff = (): number => Math.round(random() * Math.min(o.retry.maxDelayMs, o.retry.baseDelayMs * 2 ** (attempt - 1)));
      /** Chờ rồi thử lại nếu còn lượt + còn ngân sách; không thì ném lỗi. */
      const retryOrThrow = async (wait: number, err: ApiError): Promise<void> => {
        if (attempt >= o.retry.maxAttempts || wait > left - o.timeoutMs) throw err;
        o.log?.warn("api retry", { api: o.name, attempt, waitMs: wait, reason: err.kind, status: err.status });
        await sleep(wait, outer);
      };

      const headers: Record<string, string> = { accept: "application/json", ...(o.auth?.() ?? {}) };
      if (opts.body !== undefined) headers["content-type"] = "application/json";
      if (opts.idempotencyKey) headers["idempotency-key"] = opts.idempotencyKey;
      const attemptSignal = AbortSignal.any([outer, AbortSignal.timeout(Math.min(o.timeoutMs, Math.max(1, left)))]);

      let res: Response;
      try {
        res = await doFetch(url, { method, headers, signal: attemptSignal, ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}) });
      } catch {
        if (opts.signal?.aborted) throw new ApiError("timeout", `${o.name}: lời gọi bị hủy.`);
        const kind = attemptSignal.aborted ? "timeout" : "unavailable";
        const err = new ApiError(kind, kind === "timeout" ? `${o.name} không trả lời kịp.` : `Không kết nối được ${o.name}.`);
        if (!retrySafe) throw err; // POST không key: có thể bên kia ĐÃ xử lý — thử lại là tạo trùng
        await retryOrThrow(backoff(), err);
        continue;
      }

      if (res.ok) {
        const body: unknown = await res.json().catch(() => undefined);
        const parsed = opts.schema.safeParse(body);
        if (!parsed.success) throw new ApiError("bad_response", `${o.name} trả dữ liệu không đúng định dạng.`, res.status);
        return parsed.data;
      }

      const detail = await res.text().catch(() => "");
      if (res.status === 401 || res.status === 403) throw new ApiError("auth", `${o.name} từ chối xác thực (HTTP ${res.status}).`, res.status);
      if (res.status === 404) throw new ApiError("not_found", `${o.name}: không tìm thấy.`, res.status);
      if (res.status === 400 || res.status === 422) throw new ApiError("bad_request", `${o.name} từ chối dữ liệu: ${detail.slice(0, 200)}`, res.status);
      if (res.status === 429 || res.status === 503) {
        const ra = parseRetryAfter(res.headers.get("retry-after"), now());
        const kind = res.status === 429 ? "rate_limited" : "unavailable";
        const err = new ApiError(kind, `${o.name} ${res.status === 429 ? "đang giới hạn tần suất" : "tạm quá tải"}.`, res.status, ra);
        // 429: bên kia CHƯA xử lý request → thử lại an toàn cả với POST. 503 không chắc → theo retrySafe.
        if (res.status === 503 && !retrySafe) throw err;
        if (ra !== undefined && ra > o.retry.maxWaitMs) throw err; // chờ quá lâu: trả về ngay để tool không treo
        await retryOrThrow(ra ?? backoff(), err);
        continue;
      }
      const err = new ApiError("unavailable", `${o.name} lỗi HTTP ${res.status}.`, res.status);
      if (!retrySafe || res.status < 500) throw err;
      await retryOrThrow(backoff(), err);
    }
  }

  return {
    get: (path, opts) => request("GET", path, opts),
    post: (path, opts) => request("POST", path, opts),
  };
}
```
`apps/mcp-server/src/helpdesk/http-helpdesk.ts`

```ts
import { TICKET_PRIORITIES, TICKET_STATUSES, type Ticket } from "@nexus/shared";
import { z } from "zod";
import type { ApiClient } from "../http/api-client.ts";
import type { HelpdeskPort } from "./port.ts";

/** Hình dạng của VENDOR (snake_case) — chỉ sống trong file này (anti-corruption layer). */
const VendorTicket = z.object({
  id: z.string(),
  customer_id: z.string(),
  subject: z.string(),
  status: z.enum(TICKET_STATUSES),
  priority: z.enum(TICKET_PRIORITIES),
  created_at: z.string(),
});
const VendorList = z.object({ data: z.array(VendorTicket), total: z.number().int() });
const VendorCreated = z.object({ ticket: VendorTicket, replayed: z.boolean() });

const toTicket = (t: z.infer<typeof VendorTicket>): Ticket => ({
  id: t.id,
  customerId: t.customer_id,
  subject: t.subject,
  status: t.status,
  priority: t.priority,
  createdAt: t.created_at,
});

export function createHttpHelpdesk(api: ApiClient): HelpdeskPort {
  return {
    async listTickets({ status, customerId, limit }, signal) {
      const r = await api.get("/v1/tickets", {
        schema: VendorList,
        query: { status, customer: customerId, limit },
        ...(signal ? { signal } : {}),
      });
      return { total: r.total, items: r.data.map(toTicket) };
    },
    async createTicket(input, idempotencyKey, signal) {
      const r = await api.post("/v1/tickets", {
        schema: VendorCreated,
        body: { customer_id: input.customerId, subject: input.subject, body: input.body, priority: input.priority },
        idempotencyKey,
        ...(signal ? { signal } : {}),
      });
      return { ticket: toTicket(r.ticket), created: !r.replayed };
    },
  };
}
```
`apps/mcp-server/src/tools/list-tickets.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListTicketsInputSchema, ListTicketsOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolOk } from "../tool-result.ts";
import { helpdeskFailure } from "./helpdesk-errors.ts";

export function registerListTickets(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.listTickets,
    {
      title: "Ticket hỗ trợ",
      description: "Liệt kê ticket trên helpdesk bên ngoài, lọc theo trạng thái và/hoặc khách. Đếm bằng total.",
      inputSchema: ListTicketsInputSchema.shape,
      outputSchema: ListTicketsOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    instrument(TOOL.listTickets, deps.log, async ({ status, customerId, limit }, extra) => {
      try {
        const r = await deps.helpdesk.listTickets({ status, customerId, limit }, extra.signal);
        return toolOk(ListTicketsOutputSchema, { total: r.total, returned: r.items.length, items: r.items });
      } catch (err) {
        return helpdeskFailure(err);
      }
    }),
  );
}
```

#### Pattern: Chính sách retry là dữ liệu + 1 hàm bọc `fetch`

**Vấn đề:** mọi API ngoài cần cùng một bộ hành vi (auth, timeout, retry an toàn, `Retry-After`, ngân sách) — viết lại ở từng client thì mỗi client sai một kiểu.

**Tương đương C#:** `services.AddHttpClient<T>().AddHttpMessageHandler<AuthHandler>().AddStandardResilienceHandler()` — pipeline `DelegatingHandler` + Polly.

**Dịch thẳng vs kiểu TS:**

`lesson-code/m5/patterns/delegating-handlers.direct.ts`

```ts
// Dịch thẳng từ C#: HttpMessageHandler pipeline (DelegatingHandler) + policy class kiểu Polly.
export abstract class DelegatingHandler {
  protected inner: DelegatingHandler | undefined;
  setInner(h: DelegatingHandler): this {
    this.inner = h;
    return this;
  }
  abstract send(req: Request): Promise<Response>;
}

export class AuthHandler extends DelegatingHandler {
  private readonly token: string;
  constructor(token: string) {
    super();
    this.token = token;
  }
  send(req: Request): Promise<Response> {
    req.headers.set("authorization", `Bearer ${this.token}`);
    return this.inner!.send(req);
  }
}

export class RetryHandler extends DelegatingHandler {
  private readonly retries: number;
  constructor(retries: number) {
    super();
    this.retries = retries;
  }
  async send(req: Request): Promise<Response> {
    let res = await this.inner!.send(req.clone());
    for (let i = 0; i < this.retries && (res.status === 429 || res.status >= 500); i++) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i)); // không đọc Retry-After, không phân biệt GET/POST
      res = await this.inner!.send(req.clone());
    }
    return res;
  }
}

export class FetchHandler extends DelegatingHandler {
  send(req: Request): Promise<Response> {
    return fetch(req);
  }
}

export class HttpClientFactory {
  static create(token: string): DelegatingHandler {
    return new AuthHandler(token).setInner(new RetryHandler(3).setInner(new FetchHandler()));
  }
}
```
`apps/mcp-server/src/http/api-client.ts`

```ts
import type { z } from "zod";
import type { Logger } from "../log.ts";

/**
 * Client HTTP dùng chung cho mọi API bên thứ ba (M5 · S5.3).
 *  - Auth header lấy qua hàm (token xoay vòng được), không dán cứng.
 *  - 429/503: tôn trọng Retry-After. Chờ nếu ngắn và còn ngân sách; dài thì trả lỗi NGAY kèm số giây.
 *  - Lỗi mạng / 5xx / timeout: chỉ thử lại khi an toàn (GET, hoặc POST có Idempotency-Key), backoff mũ + jitter.
 *  - Ngân sách thời gian cho cả lời gọi (budgetMs): tool không bao giờ treo quá mức này.
 */
export type ApiErrorKind = "auth" | "not_found" | "bad_request" | "rate_limited" | "unavailable" | "timeout" | "bad_response";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | undefined;
  /** Bên kia bảo đợi bao lâu (đã quy ra ms) — chỉ có với rate_limited / unavailable. */
  readonly retryAfterMs: number | undefined;
  constructor(kind: ApiErrorKind, message: string, status?: number, retryAfterMs?: number) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

export interface RetryPolicy {
  /** Tổng số lần gửi, tính cả lần đầu. */
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** Retry-After dài hơn mức này → không chờ, trả lỗi ngay. */
  maxWaitMs: number;
  /** Thời gian tối đa cho cả lời gọi, gồm mọi lần thử và thời gian chờ. */
  budgetMs: number;
}

export interface ApiClientOptions {
  name: string;
  baseUrl: string;
  timeoutMs: number;
  retry: RetryPolicy;
  auth?: () => Record<string, string>;
  log?: Logger;
  fetch?: typeof fetch;
  sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
  random?: () => number;
  now?: () => number;
}

export interface RequestOptions<S extends z.ZodType> {
  schema: S;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  /** POST chỉ được thử lại khi có key — bên kia nhận key trùng thì trả kết quả cũ, không tạo bản 2. */
  idempotencyKey?: string;
  signal?: AbortSignal;
}

export interface ApiClient {
  get<S extends z.ZodType>(path: string, opts: RequestOptions<S>): Promise<z.infer<S>>;
  post<S extends z.ZodType>(path: string, opts: RequestOptions<S>): Promise<z.infer<S>>;
}

/** Retry-After: số giây ("30") hoặc HTTP-date ("Wed, 21 Oct 2026 07:28:00 GMT"). */
export function parseRetryAfter(value: string | null, now: number): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  if (/^\d+$/.test(value.trim())) return Number(value.trim()) * 1_000;
  const at = Date.parse(value);
  return Number.isNaN(at) ? undefined : Math.max(0, at - now);
}

const defaultSleep = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(signal.reason);
    }, { once: true });
  });

export function createApiClient(o: ApiClientOptions): ApiClient {
  const doFetch = o.fetch ?? fetch;
  const sleep = o.sleep ?? defaultSleep;
  const random = o.random ?? Math.random;
  const now = o.now ?? Date.now;

  async function request<S extends z.ZodType>(method: "GET" | "POST", path: string, opts: RequestOptions<S>): Promise<z.infer<S>> {
    const url = new URL(path, o.baseUrl);
    for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v));
    const retrySafe = method === "GET" || opts.idempotencyKey !== undefined;
    const started = now();
    const budget = AbortSignal.timeout(o.retry.budgetMs);
    const outer = opts.signal ? AbortSignal.any([opts.signal, budget]) : budget;

    for (let attempt = 1; ; attempt++) {
      const left = o.retry.budgetMs - (now() - started);
      const backoff = (): number => Math.round(random() * Math.min(o.retry.maxDelayMs, o.retry.baseDelayMs * 2 ** (attempt - 1)));
      /** Chờ rồi thử lại nếu còn lượt + còn ngân sách; không thì ném lỗi. */
      const retryOrThrow = async (wait: number, err: ApiError): Promise<void> => {
        if (attempt >= o.retry.maxAttempts || wait > left - o.timeoutMs) throw err;
        o.log?.warn("api retry", { api: o.name, attempt, waitMs: wait, reason: err.kind, status: err.status });
        await sleep(wait, outer);
      };

      const headers: Record<string, string> = { accept: "application/json", ...(o.auth?.() ?? {}) };
      if (opts.body !== undefined) headers["content-type"] = "application/json";
      if (opts.idempotencyKey) headers["idempotency-key"] = opts.idempotencyKey;
      const attemptSignal = AbortSignal.any([outer, AbortSignal.timeout(Math.min(o.timeoutMs, Math.max(1, left)))]);

      let res: Response;
      try {
        res = await doFetch(url, { method, headers, signal: attemptSignal, ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}) });
      } catch {
        if (opts.signal?.aborted) throw new ApiError("timeout", `${o.name}: lời gọi bị hủy.`);
        const kind = attemptSignal.aborted ? "timeout" : "unavailable";
        const err = new ApiError(kind, kind === "timeout" ? `${o.name} không trả lời kịp.` : `Không kết nối được ${o.name}.`);
        if (!retrySafe) throw err; // POST không key: có thể bên kia ĐÃ xử lý — thử lại là tạo trùng
        await retryOrThrow(backoff(), err);
        continue;
      }

      if (res.ok) {
        const body: unknown = await res.json().catch(() => undefined);
        const parsed = opts.schema.safeParse(body);
        if (!parsed.success) throw new ApiError("bad_response", `${o.name} trả dữ liệu không đúng định dạng.`, res.status);
        return parsed.data;
      }

      const detail = await res.text().catch(() => "");
      if (res.status === 401 || res.status === 403) throw new ApiError("auth", `${o.name} từ chối xác thực (HTTP ${res.status}).`, res.status);
      if (res.status === 404) throw new ApiError("not_found", `${o.name}: không tìm thấy.`, res.status);
      if (res.status === 400 || res.status === 422) throw new ApiError("bad_request", `${o.name} từ chối dữ liệu: ${detail.slice(0, 200)}`, res.status);
      if (res.status === 429 || res.status === 503) {
        const ra = parseRetryAfter(res.headers.get("retry-after"), now());
        const kind = res.status === 429 ? "rate_limited" : "unavailable";
        const err = new ApiError(kind, `${o.name} ${res.status === 429 ? "đang giới hạn tần suất" : "tạm quá tải"}.`, res.status, ra);
        // 429: bên kia CHƯA xử lý request → thử lại an toàn cả với POST. 503 không chắc → theo retrySafe.
        if (res.status === 503 && !retrySafe) throw err;
        if (ra !== undefined && ra > o.retry.maxWaitMs) throw err; // chờ quá lâu: trả về ngay để tool không treo
        await retryOrThrow(ra ?? backoff(), err);
        continue;
      }
      const err = new ApiError("unavailable", `${o.name} lỗi HTTP ${res.status}.`, res.status);
      if (!retrySafe || res.status < 500) throw err;
      await retryOrThrow(backoff(), err);
    }
  }

  return {
    get: (path, opts) => request("GET", path, opts),
    post: (path, opts) => request("POST", path, opts),
  };
}
```

- Bản dịch thẳng: abstract class + 3 handler + factory + `inner!` (non-null assertion vì `setInner` có thể chưa gọi). Retry không đọc `Retry-After`, không phân biệt GET/POST, không có ngân sách — 3 lỗi của Bẫy 1–2 nằm sẵn trong “pattern chuẩn”.
- Bản TS: `RetryPolicy` là object dữ liệu; `createApiClient` là 1 closure, phụ thuộc (`fetch`, `sleep`, `random`, `now`) truyền qua tùy chọn để test. Mọi quyết định retry nằm trong 1 vòng lặp — đọc từ trên xuống là hiểu, không phải lần theo chuỗi handler.
- Refactor `rates/client.ts` (diff ở lời giải): bỏ 15 dòng tự xử lý timeout/parse, giữ nguyên hợp đồng `RatesClient` và câu lỗi cho model.

**Khi nào KHÔNG dùng:** 1 lời gọi nội bộ trong cùng mạng, không rate limit, không quan trọng nếu lỗi → `fetch` + `AbortSignal.timeout` là đủ. Đừng tự viết circuit breaker, bulkhead, hedging khi chưa có số đo cần tới chúng — lúc đó dùng thư viện (`cockatiel`) thay vì mở rộng hàm này.

### Trắc nghiệm S5.3

1. Theo output thật kịch bản 2, helpdesk trả `429` với `Retry-After: 30` (> `maxWaitMs` 5 s). Tool làm gì?
   - A. Chờ 30 giây rồi gọi lại
   - B. Thử lại 4 lần theo backoff
   - C. Trả `isError` “cần đợi 30 giây” sau 3 ms; helpdesk chỉ thấy 2 request

   <details><summary>Đáp án</summary>

   **C.** Chờ quá ngưỡng là treo tool; thử lại là dội bom. Trả về ngay kèm con số để model báo người dùng.

   </details>

2. POST tạo ticket bị timeout. Khi nào `api-client` thử lại?
   - A. Chỉ khi request có `Idempotency-Key` — không có key thì không biết bên kia đã tạo chưa
   - B. Luôn thử lại vì timeout là lỗi tạm thời
   - C. Không bao giờ thử lại POST, kể cả khi `429`

   <details><summary>Đáp án</summary>

   **A.** Output thật: không key → 1 POST, 1 ticket, báo lỗi; có key → 2 POST, 1 ticket, “trả lại 1”. Với `429` thì thử lại an toàn cả khi không key.

   </details>

3. Vì sao `nexus_create_ticket` sinh `Idempotency-Key` từ hash nội dung chứ không phải `crypto.randomUUID()` mỗi lần gọi?
   - A. UUID không hợp lệ trong header
   - B. Model có thể tự gọi lại tool với cùng tham số; key giống nhau thì lần gọi lại của model cũng không tạo ticket trùng
   - C. Hash ngắn hơn UUID

   <details><summary>Đáp án</summary>

   **B.** UUID mới mỗi lần chỉ chống trùng trong vòng retry của `api-client`, không chống được lần gọi lại ở tầng model.

   </details>


---

## S5.3 · Cheat Sheet

### `createApiClient`

```txt
const api = createApiClient({
  name: "Helpdesk", baseUrl: env.HELPDESK_URL, timeoutMs: 3_000,
  retry: { maxAttempts: 4, baseDelayMs: 200, maxDelayMs: 2_000, maxWaitMs: 5_000, budgetMs: 10_000 },
  auth: () => ({ authorization: `Bearer ${token}` }),     // gọi mỗi lần → token xoay vòng được
  log,
})
await api.get("/v1/tickets", { schema: VendorList, query: { status, limit }, signal })
await api.post("/v1/tickets", { schema: VendorCreated, body, idempotencyKey, signal })
```

### Status → hành vi

| Status | `ApiError.kind` | Thử lại? |
|---|---|---|
| 2xx, sai schema | `bad_response` | Không |
| 401 / 403 | `auth` | Không |
| 404 | `not_found` | Không |
| 400 / 422 | `bad_request` | Không |
| 429 | `rate_limited` (+ `retryAfterMs`) | Có, nếu `Retry-After` ≤ `maxWaitMs` và còn ngân sách |
| 503 | `unavailable` | Như 429, chỉ khi `retrySafe` |
| 5xx khác, timeout, mạng | `unavailable` / `timeout` | Chỉ khi `retrySafe` (GET hoặc có `Idempotency-Key`) |

### `Retry-After`

| Dạng | Ví dụ | Quy ra |
|---|---|---|
| Số giây | `30` | 30 000 ms |
| HTTP-date | `Sun, 04 Oct 2026 01:52:00 GMT` | ngày đó − bây giờ (độ phân giải 1 s) |
| Không có | — | backoff: `random() × min(maxDelay, base × 2^(n−1))` |

### Lệnh

```console
$ node scripts/helpdesk-stub.ts --capacity 1 --refill 1 --retry-after 30 &
$ HELPDESK_TOKEN=dev-helpdesk-token node scripts/call.ts nexus_list_tickets '{}'
$ node scripts/rate-demo.ts
```

### Pattern của session

| Pattern | Session | Tương đương C# / .NET | Dùng khi |
|---|---|---|---|
| Chính sách retry là dữ liệu + 1 hàm bọc `fetch` | S5.3 | `DelegatingHandler` + Polly (`AddStandardResilienceHandler`) | Mọi API bên thứ ba: timeout, retry an toàn, `Retry-After`, ngân sách thời gian |



---

## S5.3 · Code

### Cây thư mục

```txt
nexus/
├─ packages/shared/src/helpdesk.ts                 TicketSchema, List/CreateTicket I/O
├─ apps/mcp-server/src/
│  ├─ http/api-client.ts                           ApiError, RetryPolicy, parseRetryAfter, createApiClient
│  ├─ helpdesk/port.ts · http-helpdesk.ts          HelpdeskPort + adapter (schema vendor snake_case)
│  ├─ tools/helpdesk-errors.ts · list-tickets.ts · create-ticket.ts
│  ├─ rates/client.ts                              refactor: dùng createApiClient
│  └─ deps.ts · env.ts                             helpdeskFromEnv, HELPDESK_URL, HELPDESK_TOKEN
└─ apps/mcp-server/scripts/
   ├─ stub/helpdesk.ts · helpdesk-stub.ts          helpdesk giả lập: Bearer, token bucket, Retry-After, Idempotency-Key
   └─ rate-demo.ts                                 5 kịch bản qua server thật
lesson-code/m5/
├─ traps/retry-no-wait.ts · retry-post.ts
├─ tsc-traps/non-exhaustive.ts
└─ patterns/delegating-handlers.direct.ts
```

### packages/shared

`packages/shared/src/helpdesk.ts`

```ts
import { z } from "zod";
import { CustomerIdSchema } from "./customer.ts";

export const TICKET_STATUSES = ["open", "pending", "closed"] as const;
export const TICKET_PRIORITIES = ["low", "normal", "high"] as const;

export const TicketSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  subject: z.string(),
  status: z.enum(TICKET_STATUSES),
  priority: z.enum(TICKET_PRIORITIES),
  createdAt: z.string(),
});
export type Ticket = z.infer<typeof TicketSchema>;

export const ListTicketsInputSchema = z.object({
  status: z.enum(TICKET_STATUSES).optional().describe("open | pending | closed"),
  customerId: CustomerIdSchema.optional(),
  limit: z.number().int().min(1).max(50).default(20),
});
export const ListTicketsOutputSchema = z.object({
  total: z.number().int(),
  returned: z.number().int(),
  items: z.array(TicketSchema),
});

export const CreateTicketInputSchema = z.object({
  customerId: CustomerIdSchema,
  subject: z.string().trim().min(5).max(120),
  body: z.string().trim().min(1).max(2_000),
  priority: z.enum(TICKET_PRIORITIES).default("normal"),
});
export const CreateTicketOutputSchema = z.object({
  ticket: TicketSchema,
  created: z.boolean().describe("false = yêu cầu trùng, trả lại ticket đã tạo trước đó (không tạo bản 2)"),
});
```

### apps/mcp-server

`apps/mcp-server/src/http/api-client.ts`

```ts
import type { z } from "zod";
import type { Logger } from "../log.ts";

/**
 * Client HTTP dùng chung cho mọi API bên thứ ba (M5 · S5.3).
 *  - Auth header lấy qua hàm (token xoay vòng được), không dán cứng.
 *  - 429/503: tôn trọng Retry-After. Chờ nếu ngắn và còn ngân sách; dài thì trả lỗi NGAY kèm số giây.
 *  - Lỗi mạng / 5xx / timeout: chỉ thử lại khi an toàn (GET, hoặc POST có Idempotency-Key), backoff mũ + jitter.
 *  - Ngân sách thời gian cho cả lời gọi (budgetMs): tool không bao giờ treo quá mức này.
 */
export type ApiErrorKind = "auth" | "not_found" | "bad_request" | "rate_limited" | "unavailable" | "timeout" | "bad_response";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | undefined;
  /** Bên kia bảo đợi bao lâu (đã quy ra ms) — chỉ có với rate_limited / unavailable. */
  readonly retryAfterMs: number | undefined;
  constructor(kind: ApiErrorKind, message: string, status?: number, retryAfterMs?: number) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

export interface RetryPolicy {
  /** Tổng số lần gửi, tính cả lần đầu. */
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** Retry-After dài hơn mức này → không chờ, trả lỗi ngay. */
  maxWaitMs: number;
  /** Thời gian tối đa cho cả lời gọi, gồm mọi lần thử và thời gian chờ. */
  budgetMs: number;
}

export interface ApiClientOptions {
  name: string;
  baseUrl: string;
  timeoutMs: number;
  retry: RetryPolicy;
  auth?: () => Record<string, string>;
  log?: Logger;
  fetch?: typeof fetch;
  sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
  random?: () => number;
  now?: () => number;
}

export interface RequestOptions<S extends z.ZodType> {
  schema: S;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  /** POST chỉ được thử lại khi có key — bên kia nhận key trùng thì trả kết quả cũ, không tạo bản 2. */
  idempotencyKey?: string;
  signal?: AbortSignal;
}

export interface ApiClient {
  get<S extends z.ZodType>(path: string, opts: RequestOptions<S>): Promise<z.infer<S>>;
  post<S extends z.ZodType>(path: string, opts: RequestOptions<S>): Promise<z.infer<S>>;
}

/** Retry-After: số giây ("30") hoặc HTTP-date ("Wed, 21 Oct 2026 07:28:00 GMT"). */
export function parseRetryAfter(value: string | null, now: number): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  if (/^\d+$/.test(value.trim())) return Number(value.trim()) * 1_000;
  const at = Date.parse(value);
  return Number.isNaN(at) ? undefined : Math.max(0, at - now);
}

const defaultSleep = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(signal.reason);
    }, { once: true });
  });

export function createApiClient(o: ApiClientOptions): ApiClient {
  const doFetch = o.fetch ?? fetch;
  const sleep = o.sleep ?? defaultSleep;
  const random = o.random ?? Math.random;
  const now = o.now ?? Date.now;

  async function request<S extends z.ZodType>(method: "GET" | "POST", path: string, opts: RequestOptions<S>): Promise<z.infer<S>> {
    const url = new URL(path, o.baseUrl);
    for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v));
    const retrySafe = method === "GET" || opts.idempotencyKey !== undefined;
    const started = now();
    const budget = AbortSignal.timeout(o.retry.budgetMs);
    const outer = opts.signal ? AbortSignal.any([opts.signal, budget]) : budget;

    for (let attempt = 1; ; attempt++) {
      const left = o.retry.budgetMs - (now() - started);
      const backoff = (): number => Math.round(random() * Math.min(o.retry.maxDelayMs, o.retry.baseDelayMs * 2 ** (attempt - 1)));
      /** Chờ rồi thử lại nếu còn lượt + còn ngân sách; không thì ném lỗi. */
      const retryOrThrow = async (wait: number, err: ApiError): Promise<void> => {
        if (attempt >= o.retry.maxAttempts || wait > left - o.timeoutMs) throw err;
        o.log?.warn("api retry", { api: o.name, attempt, waitMs: wait, reason: err.kind, status: err.status });
        await sleep(wait, outer);
      };

      const headers: Record<string, string> = { accept: "application/json", ...(o.auth?.() ?? {}) };
      if (opts.body !== undefined) headers["content-type"] = "application/json";
      if (opts.idempotencyKey) headers["idempotency-key"] = opts.idempotencyKey;
      const attemptSignal = AbortSignal.any([outer, AbortSignal.timeout(Math.min(o.timeoutMs, Math.max(1, left)))]);

      let res: Response;
      try {
        res = await doFetch(url, { method, headers, signal: attemptSignal, ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}) });
      } catch {
        if (opts.signal?.aborted) throw new ApiError("timeout", `${o.name}: lời gọi bị hủy.`);
        const kind = attemptSignal.aborted ? "timeout" : "unavailable";
        const err = new ApiError(kind, kind === "timeout" ? `${o.name} không trả lời kịp.` : `Không kết nối được ${o.name}.`);
        if (!retrySafe) throw err; // POST không key: có thể bên kia ĐÃ xử lý — thử lại là tạo trùng
        await retryOrThrow(backoff(), err);
        continue;
      }

      if (res.ok) {
        const body: unknown = await res.json().catch(() => undefined);
        const parsed = opts.schema.safeParse(body);
        if (!parsed.success) throw new ApiError("bad_response", `${o.name} trả dữ liệu không đúng định dạng.`, res.status);
        return parsed.data;
      }

      const detail = await res.text().catch(() => "");
      if (res.status === 401 || res.status === 403) throw new ApiError("auth", `${o.name} từ chối xác thực (HTTP ${res.status}).`, res.status);
      if (res.status === 404) throw new ApiError("not_found", `${o.name}: không tìm thấy.`, res.status);
      if (res.status === 400 || res.status === 422) throw new ApiError("bad_request", `${o.name} từ chối dữ liệu: ${detail.slice(0, 200)}`, res.status);
      if (res.status === 429 || res.status === 503) {
        const ra = parseRetryAfter(res.headers.get("retry-after"), now());
        const kind = res.status === 429 ? "rate_limited" : "unavailable";
        const err = new ApiError(kind, `${o.name} ${res.status === 429 ? "đang giới hạn tần suất" : "tạm quá tải"}.`, res.status, ra);
        // 429: bên kia CHƯA xử lý request → thử lại an toàn cả với POST. 503 không chắc → theo retrySafe.
        if (res.status === 503 && !retrySafe) throw err;
        if (ra !== undefined && ra > o.retry.maxWaitMs) throw err; // chờ quá lâu: trả về ngay để tool không treo
        await retryOrThrow(ra ?? backoff(), err);
        continue;
      }
      const err = new ApiError("unavailable", `${o.name} lỗi HTTP ${res.status}.`, res.status);
      if (!retrySafe || res.status < 500) throw err;
      await retryOrThrow(backoff(), err);
    }
  }

  return {
    get: (path, opts) => request("GET", path, opts),
    post: (path, opts) => request("POST", path, opts),
  };
}
```
`apps/mcp-server/src/helpdesk/port.ts`

```ts
import type { Ticket } from "@nexus/shared";

/**
 * Cổng tới hệ thống helpdesk (M5 · S5.3). Tool chỉ biết cổng này — đổi nhà cung cấp là viết adapter mới,
 * không sửa tool. Kiểu dữ liệu là của Nexus (camelCase), không phải của vendor.
 */
export interface HelpdeskPort {
  listTickets(q: { status?: Ticket["status"] | undefined; customerId?: string | undefined; limit: number }, signal?: AbortSignal): Promise<{ total: number; items: Ticket[] }>;
  createTicket(
    input: { customerId: string; subject: string; body: string; priority: Ticket["priority"] },
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<{ ticket: Ticket; created: boolean }>;
}
```
`apps/mcp-server/src/helpdesk/http-helpdesk.ts`

```ts
import { TICKET_PRIORITIES, TICKET_STATUSES, type Ticket } from "@nexus/shared";
import { z } from "zod";
import type { ApiClient } from "../http/api-client.ts";
import type { HelpdeskPort } from "./port.ts";

/** Hình dạng của VENDOR (snake_case) — chỉ sống trong file này (anti-corruption layer). */
const VendorTicket = z.object({
  id: z.string(),
  customer_id: z.string(),
  subject: z.string(),
  status: z.enum(TICKET_STATUSES),
  priority: z.enum(TICKET_PRIORITIES),
  created_at: z.string(),
});
const VendorList = z.object({ data: z.array(VendorTicket), total: z.number().int() });
const VendorCreated = z.object({ ticket: VendorTicket, replayed: z.boolean() });

const toTicket = (t: z.infer<typeof VendorTicket>): Ticket => ({
  id: t.id,
  customerId: t.customer_id,
  subject: t.subject,
  status: t.status,
  priority: t.priority,
  createdAt: t.created_at,
});

export function createHttpHelpdesk(api: ApiClient): HelpdeskPort {
  return {
    async listTickets({ status, customerId, limit }, signal) {
      const r = await api.get("/v1/tickets", {
        schema: VendorList,
        query: { status, customer: customerId, limit },
        ...(signal ? { signal } : {}),
      });
      return { total: r.total, items: r.data.map(toTicket) };
    },
    async createTicket(input, idempotencyKey, signal) {
      const r = await api.post("/v1/tickets", {
        schema: VendorCreated,
        body: { customer_id: input.customerId, subject: input.subject, body: input.body, priority: input.priority },
        idempotencyKey,
        ...(signal ? { signal } : {}),
      });
      return { ticket: toTicket(r.ticket), created: !r.replayed };
    },
  };
}
```
`apps/mcp-server/src/tools/helpdesk-errors.ts`

```ts
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ApiError } from "../http/api-client.ts";
import { toolFail } from "../tool-result.ts";

/** Dịch ApiError → câu model đọc được + bước tiếp theo. Lỗi lạ: ném tiếp cho instrument. */
export function helpdeskFailure(err: unknown): CallToolResult {
  if (!(err instanceof ApiError)) throw err;
  const secs = err.retryAfterMs !== undefined ? Math.ceil(err.retryAfterMs / 1000) : undefined;
  switch (err.kind) {
    case "rate_limited":
      return toolFail({
        what: `Helpdesk đang giới hạn tần suất${secs !== undefined ? ` (cần đợi ${secs} giây)` : ""}.`,
        next: `Đừng gọi lại ngay. Báo người dùng thử lại${secs !== undefined ? ` sau ${secs} giây` : " sau ít phút"}.`,
      });
    case "auth":
      return toolFail({ what: "Nexus chưa được cấu hình đúng quyền truy cập helpdesk.", next: "Không thử lại; báo người dùng liên hệ quản trị viên." });
    case "timeout":
    case "unavailable":
      return toolFail({ what: "Helpdesk không phản hồi.", next: "Thử lại sau ít phút; không đoán nội dung ticket." });
    case "bad_request":
      return toolFail({ what: err.message, next: "Sửa dữ liệu theo thông báo rồi gọi lại." });
    case "not_found":
    case "bad_response":
      return toolFail({ what: "Helpdesk trả kết quả không dùng được.", next: "Báo người dùng; không thử lại liên tục." });
  }
}
```
`apps/mcp-server/src/tools/list-tickets.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListTicketsInputSchema, ListTicketsOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolOk } from "../tool-result.ts";
import { helpdeskFailure } from "./helpdesk-errors.ts";

export function registerListTickets(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.listTickets,
    {
      title: "Ticket hỗ trợ",
      description: "Liệt kê ticket trên helpdesk bên ngoài, lọc theo trạng thái và/hoặc khách. Đếm bằng total.",
      inputSchema: ListTicketsInputSchema.shape,
      outputSchema: ListTicketsOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    instrument(TOOL.listTickets, deps.log, async ({ status, customerId, limit }, extra) => {
      try {
        const r = await deps.helpdesk.listTickets({ status, customerId, limit }, extra.signal);
        return toolOk(ListTicketsOutputSchema, { total: r.total, returned: r.items.length, items: r.items });
      } catch (err) {
        return helpdeskFailure(err);
      }
    }),
  );
}
```
`apps/mcp-server/src/tools/create-ticket.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CreateTicketInputSchema, CreateTicketOutputSchema, TOOL } from "@nexus/shared";
import { createHash } from "node:crypto";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";
import { helpdeskFailure } from "./helpdesk-errors.ts";

/** Cùng nội dung → cùng key: model gọi lại (hoặc client retry) không tạo ticket thứ 2. */
const idemKey = (customerId: string, subject: string, body: string): string =>
  createHash("sha256").update(`${customerId}\n${subject}\n${body}`).digest("hex").slice(0, 32);

export function registerCreateTicket(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.createTicket,
    {
      title: "Tạo ticket hỗ trợ",
      description:
        "Tạo 1 ticket trên helpdesk cho 1 khách. Gọi khi người dùng yêu cầu ghi nhận sự cố/yêu cầu hỗ trợ. " +
        "Gọi lại với cùng nội dung không tạo bản trùng (created=false).",
      inputSchema: CreateTicketInputSchema.shape,
      outputSchema: CreateTicketOutputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    instrument(TOOL.createTicket, deps.log, async ({ customerId, subject, body, priority }, extra) => {
      if (!(await deps.customers.get(customerId))) {
        return toolFail({ what: `Không có khách hàng ${customerId}.`, next: "Lấy id đúng bằng nexus_search_customers trước khi tạo ticket." });
      }
      try {
        const r = await deps.helpdesk.createTicket({ customerId, subject, body, priority }, idemKey(customerId, subject, body), extra.signal);
        return toolOk(CreateTicketOutputSchema, r);
      } catch (err) {
        return helpdeskFailure(err);
      }
    }),
  );
}
```
`apps/mcp-server/src/rates/client.ts`

```ts
import type { CURRENCIES } from "@nexus/shared";
import { z } from "zod";
import { ApiError, createApiClient } from "../http/api-client.ts";

export type Currency = (typeof CURRENCIES)[number];
export interface Rate {
  from: Currency;
  rate: number;
  asOf: string;
}

/** Lỗi đã dịch sẵn thành câu LLM đọc được (M3 · S3.4). */
export class RatesError extends Error {
  readonly kind: "timeout" | "unavailable" | "bad_response";
  constructor(kind: RatesError["kind"], message: string) {
    super(message);
    this.name = "RatesError";
    this.kind = kind;
  }
}

export interface RatesClient {
  get(from: Currency, signal?: AbortSignal): Promise<Rate>;
}

const RateBody = z.object({ rate: z.number().positive(), asOf: z.string().optional() });

/** M5 · S5.3: dùng client HTTP chung (timeout, retry GET có backoff, Retry-After) thay fetch tự viết. */
export function createRatesClient(baseUrl: string, timeoutMs: number, fetchImpl: typeof fetch = fetch): RatesClient {
  const api = createApiClient({
    name: "Dịch vụ tỷ giá",
    baseUrl,
    timeoutMs,
    fetch: fetchImpl,
    retry: { maxAttempts: 2, baseDelayMs: 200, maxDelayMs: 1_000, maxWaitMs: 2_000, budgetMs: timeoutMs + 1_500 },
  });
  return {
    async get(from, signal) {
      try {
        const body = await api.get(`/rates/${from}`, { schema: RateBody, ...(signal ? { signal } : {}) });
        return { from, rate: body.rate, asOf: body.asOf ?? new Date().toISOString() };
      } catch (err) {
        if (!(err instanceof ApiError)) throw err;
        if (err.kind === "timeout") throw new RatesError("timeout", `Dịch vụ tỷ giá không trả lời trong ${timeoutMs / 1000} giây.`);
        if (err.kind === "bad_response") throw new RatesError("bad_response", "Dịch vụ tỷ giá trả dữ liệu không đúng định dạng.");
        throw new RatesError("unavailable", err.status ? `Dịch vụ tỷ giá trả lỗi HTTP ${err.status}.` : "Không kết nối được dịch vụ tỷ giá.");
      }
    },
  };
}
```

### scripts

`apps/mcp-server/scripts/stub/helpdesk.ts`

```ts
// Helpdesk "bên thứ ba" giả lập cho dev/test (M5 · S5.3): Bearer token, rate limit token bucket, Idempotency-Key.
import { createServer, type IncomingMessage, type Server } from "node:http";

export interface StubOptions {
  port: number;
  token: string;
  /** Token bucket: tối đa `capacity` request liên tiếp, hồi `refillPerSec` request/giây. */
  capacity: number;
  refillPerSec: number;
  /** Ép Retry-After cố định (giây) — mô phỏng bị chặn dài. Không đặt: tính theo bucket. */
  retryAfterSec?: number;
  /** Gửi Retry-After dạng HTTP-date thay vì số giây. */
  httpDate?: boolean;
  /** POST: tạo ticket xong mới chậm trả lời bấy nhiêu ms — mô phỏng timeout SAU KHI đã xử lý. */
  postDelayMs?: number;
}

export interface StubStats {
  requests: number;
  rejected429: number;
  created: number;
  replayed: number;
}

interface VendorTicket {
  id: string;
  customer_id: string;
  subject: string;
  status: "open" | "pending" | "closed";
  priority: "low" | "normal" | "high";
  created_at: string;
}

const STATUSES = ["open", "pending", "closed"] as const;
const PRIORITIES = ["low", "normal", "high"] as const;

function seedTickets(): VendorTicket[] {
  return Array.from({ length: 40 }, (_, i) => ({
    id: `T-${1001 + i}`,
    customer_id: `cus_${String((i * 7) % 30 + 1).padStart(3, "0")}`,
    subject: `Yêu cầu hỗ trợ số ${i + 1}`,
    status: STATUSES[i % 3] ?? "open",
    priority: PRIORITIES[i % 3] ?? "normal",
    created_at: new Date(Date.UTC(2026, 8, 1 + (i % 28))).toISOString(),
  }));
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : undefined;
}

export function startHelpdeskStub(o: StubOptions): Promise<{ server: Server; stats: StubStats; tickets: VendorTicket[] }> {
  const tickets = seedTickets();
  const byKey = new Map<string, VendorTicket>();
  const stats: StubStats = { requests: 0, rejected429: 0, created: 0, replayed: 0 };
  let tokens = o.capacity;
  let last = Date.now();
  let blockedUntil = 0; // chế độ retryAfterSec: hết bucket là khóa cứng đúng bấy nhiêu giây

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://stub");
    const send = (status: number, body: unknown, headers: Record<string, string> = {}): void => {
      res.writeHead(status, { "content-type": "application/json", ...headers });
      res.end(JSON.stringify(body));
    };
    if (url.pathname === "/__stats") return send(200, stats);
    stats.requests++;
    if (req.headers.authorization !== `Bearer ${o.token}`) return send(401, { error: "invalid_token" });

    const now = Date.now();
    tokens = Math.min(o.capacity, tokens + ((now - last) / 1000) * o.refillPerSec);
    last = now;
    if (o.retryAfterSec !== undefined && tokens < 1 && blockedUntil <= now) blockedUntil = now + o.retryAfterSec * 1000;
    if (tokens < 1 || now < blockedUntil) {
      stats.rejected429++;
      const sec = now < blockedUntil ? Math.ceil((blockedUntil - now) / 1000) : Math.ceil((1 - tokens) / o.refillPerSec);
      const value = o.httpDate ? new Date(now + sec * 1000).toUTCString() : String(sec);
      return send(429, { error: "rate_limited" }, { "retry-after": value });
    }
    tokens -= 1;

    if (req.method === "GET" && url.pathname === "/v1/tickets") {
      const status = url.searchParams.get("status");
      const customer = url.searchParams.get("customer");
      const limit = Number(url.searchParams.get("limit") ?? 20);
      const all = tickets.filter((t) => (!status || t.status === status) && (!customer || t.customer_id === customer));
      return send(200, { data: all.slice(0, limit), total: all.length });
    }
    if (req.method === "POST" && url.pathname === "/v1/tickets") {
      const key = req.headers["idempotency-key"];
      if (typeof key === "string" && byKey.has(key)) {
        stats.replayed++;
        return send(200, { ticket: byKey.get(key), replayed: true });
      }
      const b = (await readBody(req)) as Partial<VendorTicket> & { body?: string };
      if (!b?.customer_id || !b.subject) return send(422, { error: "customer_id và subject là bắt buộc" });
      const t: VendorTicket = {
        id: `T-${1001 + tickets.length}`,
        customer_id: b.customer_id,
        subject: b.subject,
        status: "open",
        priority: b.priority ?? "normal",
        created_at: new Date().toISOString(),
      };
      tickets.push(t);
      stats.created++;
      if (typeof key === "string") byKey.set(key, t);
      if (o.postDelayMs) await new Promise((r) => setTimeout(r, o.postDelayMs));
      return send(201, { ticket: t, replayed: false });
    }
    send(404, { error: "not_found" });
  });
  return new Promise((resolve) => server.listen(o.port, "127.0.0.1", () => resolve({ server, stats, tickets })));
}
```
`apps/mcp-server/scripts/helpdesk-stub.ts`

```ts
// node scripts/helpdesk-stub.ts [--port 4020] [--capacity 5] [--refill 1] [--retry-after 30] [--http-date]
import { parseArgs } from "node:util";
import { startHelpdeskStub } from "./stub/helpdesk.ts";

const { values } = parseArgs({
  options: {
    port: { type: "string", default: "4020" },
    token: { type: "string", default: "dev-helpdesk-token" },
    capacity: { type: "string", default: "5" },
    refill: { type: "string", default: "1" },
    "retry-after": { type: "string" },
    "http-date": { type: "boolean", default: false },
  },
});
await startHelpdeskStub({
  port: Number(values.port),
  token: values.token,
  capacity: Number(values.capacity),
  refillPerSec: Number(values.refill),
  ...(values["retry-after"] ? { retryAfterSec: Number(values["retry-after"]) } : {}),
  httpDate: values["http-date"],
});
process.stderr.write(`helpdesk-stub :${values.port}\n`);
```
`apps/mcp-server/scripts/rate-demo.ts`

```ts
// node scripts/rate-demo.ts — server Nexus thật (stdio) gọi helpdesk giả lập có rate limit qua HTTP thật.
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { TOOL } from "@nexus/shared";
import type { AddressInfo } from "node:net";
import { connect } from "./client.ts";
import { startHelpdeskStub, type StubOptions } from "./stub/helpdesk.ts";

const TOKEN = "dev-helpdesk-token";

async function scenario(title: string, stubOpts: Omit<StubOptions, "port" | "token">, token: string, run: (c: Client) => Promise<void>): Promise<void> {
  const stub = await startHelpdeskStub({ port: 0, token: TOKEN, ...stubOpts });
  const url = `http://127.0.0.1:${(stub.server.address() as AddressInfo).port}`;
  const client = await connect({ HELPDESK_URL: url, HELPDESK_TOKEN: token });
  console.log(`\n== ${title}`);
  await run(client);
  console.log(`   helpdesk thấy: ${stub.stats.requests} request · ${stub.stats.rejected429} lần 429 · tạo ${stub.stats.created} · trả lại ${stub.stats.replayed}`);
  await client.close();
  stub.server.close();
}

async function timed(c: Client, name: string, args: Record<string, unknown>): Promise<string> {
  const t0 = performance.now();
  const r = (await c.callTool({ name, arguments: args })) as CallToolResult;
  const ms = Math.round(performance.now() - t0);
  const text = r.content.map((x) => (x.type === "text" ? x.text : "")).join("");
  const body = r.isError ? `[isError] ${text}` : summarize(r.structuredContent);
  return `${String(ms).padStart(5)} ms  ${body}`;
}

function summarize(s: unknown): string {
  const o = s as { total?: number; created?: boolean; ticket?: { id: string } };
  if (o.ticket) return `ticket ${o.ticket.id} · created=${o.created}`;
  return `total=${o.total}`;
}

await scenario("1 · 8 lời gọi liền nhau, bucket 5 request, hồi 1 request/giây", { capacity: 5, refillPerSec: 1 }, TOKEN, async (c) => {
  for (let i = 1; i <= 8; i++) console.log(`   #${i} ${await timed(c, TOOL.listTickets, { status: "open" })}`);
});

await scenario("2 · bị chặn dài: Retry-After 30 giây (> maxWaitMs 5 s)", { capacity: 1, refillPerSec: 1, retryAfterSec: 30 }, TOKEN, async (c) => {
  console.log(`   #1 ${await timed(c, TOOL.listTickets, {})}`);
  console.log(`   #2 ${await timed(c, TOOL.listTickets, {})}`);
});

await scenario("3 · Retry-After dạng HTTP-date", { capacity: 1, refillPerSec: 1, httpDate: true }, TOKEN, async (c) => {
  console.log(`   #1 ${await timed(c, TOOL.listTickets, {})}`);
  console.log(`   #2 ${await timed(c, TOOL.listTickets, {})}`);
});

await scenario("4 · token sai", { capacity: 5, refillPerSec: 1 }, "token-cu-da-thu-hoi", async (c) => {
  console.log(`   #1 ${await timed(c, TOOL.listTickets, {})}`);
});

await scenario("5 · tạo ticket 2 lần cùng nội dung (bucket 1: lần 2 dính 429 rồi thử lại)", { capacity: 1, refillPerSec: 1 }, TOKEN, async (c) => {
  const args = { customerId: "cus_007", subject: "Không xuất được hóa đơn", body: "Nút Xuất PDF báo lỗi 500 từ sáng nay.", priority: "high" };
  console.log(`   #1 ${await timed(c, TOOL.createTicket, args)}`);
  console.log(`   #2 ${await timed(c, TOOL.createTicket, args)}`);
});
```

### lesson-code

`lesson-code/m5/traps/retry-no-wait.ts`

```ts
// Bẫy 1 (S5.3) — dịch thẳng "gặp 429 thì thử lại" mà không đọc Retry-After: dội bom API trong lúc bị chặn.
import type { AddressInfo } from "node:net";
import { startHelpdeskStub } from "../../../nexus/apps/mcp-server/scripts/stub/helpdesk.ts";

const stub = await startHelpdeskStub({ port: 0, token: "t", capacity: 1, refillPerSec: 1, retryAfterSec: 30 });
const url = `http://127.0.0.1:${(stub.server.address() as AddressInfo).port}/v1/tickets`;

async function listTicketsNaive(signal: AbortSignal): Promise<number> {
  for (;;) {
    const res = await fetch(url, { headers: { authorization: "Bearer t" }, signal });
    if (res.status === 429) continue; // "retry"
    return res.status;
  }
}

await listTicketsNaive(AbortSignal.timeout(5_000)); // lần 1 dùng hết bucket
const t0 = performance.now();
try {
  const status = await listTicketsNaive(AbortSignal.timeout(2_000));
  console.log(`trả ${status} sau ${Math.round(performance.now() - t0)} ms`);
} catch (err) {
  console.log(`dừng sau ${Math.round(performance.now() - t0)} ms vì ${(err as Error).name}`);
}
console.log(`helpdesk nhận ${stub.stats.requests} request, trả 429 cho ${stub.stats.rejected429} — trong khi đã bảo "đợi 30 giây"`);
stub.server.close();
```
`lesson-code/m5/traps/retry-post.ts`

```ts
// Bẫy 2 (S5.3) — retry POST khi timeout, không Idempotency-Key: bên kia ĐÃ tạo ticket, chỉ trả lời chậm.
import type { AddressInfo } from "node:net";
import { z } from "zod";
import { createApiClient, type RequestOptions } from "../../../nexus/apps/mcp-server/src/http/api-client.ts";
import { startHelpdeskStub } from "../../../nexus/apps/mcp-server/scripts/stub/helpdesk.ts";

const body = { customer_id: "cus_007", subject: "Không xuất được hóa đơn", body: "Lỗi 500" };

async function naive(url: string): Promise<void> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await fetch(url, { method: "POST", headers: { authorization: "Bearer t", "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(300) });
      return;
    } catch {
      // timeout → "thử lại cho chắc"
    }
  }
}

async function nexus(base: string, key: string | undefined): Promise<string> {
  const api = createApiClient({
    name: "Helpdesk",
    baseUrl: base,
    timeoutMs: 300,
    auth: () => ({ authorization: "Bearer t" }),
    retry: { maxAttempts: 3, baseDelayMs: 50, maxDelayMs: 200, maxWaitMs: 1_000, budgetMs: 3_000 },
  });
  const opts: RequestOptions<z.ZodUnknown> = { schema: z.unknown(), body, ...(key ? { idempotencyKey: key } : {}) };
  try {
    await api.post("/v1/tickets", opts);
    return "thành công";
  } catch (err) {
    return `lỗi ${(err as Error).message}`;
  }
}

for (const [label, run] of [
  ["vòng for tự viết, không key", async (b: string) => { await naive(`${b}/v1/tickets`); return "xong"; }],
  ["api-client Nexus, không key", (b: string) => nexus(b, undefined)],
  ["api-client Nexus, có key", (b: string) => nexus(b, "k-123")],
] as const) {
  const stub = await startHelpdeskStub({ port: 0, token: "t", capacity: 10, refillPerSec: 10, postDelayMs: 500 });
  const base = `http://127.0.0.1:${(stub.server.address() as AddressInfo).port}`;
  const result = await run(base);
  await new Promise((r) => setTimeout(r, 600)); // đợi stub xử lý xong request cuối
  console.log(`${label.padEnd(30)} → ${result.padEnd(40)} helpdesk: ${stub.stats.requests} POST, tạo ${stub.stats.created} ticket, trả lại ${stub.stats.replayed}`);
  stub.server.close();
}
```
`lesson-code/m5/patterns/delegating-handlers.direct.ts`

```ts
// Dịch thẳng từ C#: HttpMessageHandler pipeline (DelegatingHandler) + policy class kiểu Polly.
export abstract class DelegatingHandler {
  protected inner: DelegatingHandler | undefined;
  setInner(h: DelegatingHandler): this {
    this.inner = h;
    return this;
  }
  abstract send(req: Request): Promise<Response>;
}

export class AuthHandler extends DelegatingHandler {
  private readonly token: string;
  constructor(token: string) {
    super();
    this.token = token;
  }
  send(req: Request): Promise<Response> {
    req.headers.set("authorization", `Bearer ${this.token}`);
    return this.inner!.send(req);
  }
}

export class RetryHandler extends DelegatingHandler {
  private readonly retries: number;
  constructor(retries: number) {
    super();
    this.retries = retries;
  }
  async send(req: Request): Promise<Response> {
    let res = await this.inner!.send(req.clone());
    for (let i = 0; i < this.retries && (res.status === 429 || res.status >= 500); i++) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i)); // không đọc Retry-After, không phân biệt GET/POST
      res = await this.inner!.send(req.clone());
    }
    return res;
  }
}

export class FetchHandler extends DelegatingHandler {
  send(req: Request): Promise<Response> {
    return fetch(req);
  }
}

export class HttpClientFactory {
  static create(token: string): DelegatingHandler {
    return new AuthHandler(token).setInner(new RetryHandler(3).setInner(new FetchHandler()));
  }
}
```

---

## S5.4 — Search, CSV & không trả dữ liệu thô

Mục tiêu: trả lời câu hỏi về **con số** bằng con số đã tính sẵn ở nguồn — không đổ bản ghi thô vào context để model tự đếm/cộng — và chứng minh bằng số đo rằng không tool nào vượt ngân sách context trong trường hợp xấu nhất.

### C# → TS/Node

| Khái niệm C# | Tương đương TS/Node | Khác ở đâu |
|---|---|---|
| EF Core `GroupBy(o => o.City).Select(g => new RevenueRow(...))` | `orders.revenueBy(by, range)` — bản Mongo là `$group` | Tổng hợp chạy trong DB; tool nhận ≤ 24 dòng |
| Trả `List<OrderDto>` | `matched` + `totalAmount` + `sample` ≤ 20 | Người đọc là model: trả theo token, cộng hàng trăm số kém |
| `TimeZoneInfo.ConvertTime(..., "SE Asia Standard Time")` | `vnMonth()` (+7 giờ) / `$dateToString` có `timezone` | `Date` của JS không có “ngày theo múi giờ”; tự cộng offset, hoặc để DB làm |
| CsvHelper | `parseCsv` (RFC 4180) | Không cần thư viện cho 1 định dạng, nhưng tuyệt đối không `split(",")` |
| `decimal.Parse("1.250.000", vi-VN)` | `parseNumber` nhận dạng dấu chấm hàng nghìn | `Number("1.250.000")` là `NaN` (Bẫy 2) |
| Không có tương đương | `size-audit.ts`: gọi mọi tool với tham số xấu nhất, đếm token | Ngân sách context là yêu cầu phi chức năng **có số** (25 000 token) |
| `Dictionary<ToolName, T>` | `Record<ToolName, T>` | `Record` buộc đủ mọi khóa lúc compile (Bẫy 4) |
| OData `$top` / `$count` | `top`, `sample`, `limit` có `max` trong schema | Trần nằm trong JSON Schema — model thấy trước khi gọi |

### Lab

#### Lab C50 — 25 Search Tool · 26 CSV Analysis

**Mục tiêu:** Lab 25 trả kết quả tìm kiếm ở dạng tóm tắt; Lab 26 phân tích CSV bằng cách tách tổng hợp và lọc thành các tool riêng — và hiểu vì sao thiết kế không bao giờ trả dữ liệu thô.

- [ ] Lab 25 xanh.
- [ ] Lab 26 xanh.

**Lệnh nghiệm thu** (repo C50 — chưa chạy ở sandbox dựng bài):

```console
$ npm run check
```

Cần nắm để tự làm:

- Lab 25: kết quả tóm tắt gồm **tổng số khớp**, N mục đầu với đúng các field cần, và câu gợi ý thu hẹp khi bị cắt. Review “định dạng không ăn hết context”: so số ký tự của bản bạn trả với bản `JSON.stringify` nguyên bản ghi.
- Lab 26: tool tổng hợp (nhóm + đếm/cộng) và tool lọc (điều kiện → số dòng khớp, vài mẫu) là **2 tool**. Câu Review “vì sao không bao giờ trả dữ liệu thô”: kích thước tăng theo dữ liệu, model cộng sai, và dữ liệu thô lộ ra ngoài nhiều hơn cần.
- CSV thật có ô chứa dấu phẩy trong ngoặc kép, xuống dòng trong ô, BOM ở đầu file Excel, CRLF. Đọc đúng chuẩn trước khi tính.
- Tên cột sai → lỗi liệt kê các cột có (model sửa được ở lần sau).

#### Lab Nexus S5.4 — `nexus_revenue_by`, `nexus_find_orders`, `nexus_analyze_export`

**Mục tiêu:** doanh thu theo tháng (giờ VN) / thành phố / sản phẩm tính trong nguồn; lọc đơn trả đếm + tổng + vài mẫu; phân tích file CSV trong thư mục export mà không trả dòng nào; và `size-audit` chứng minh mọi tool ≤ 25 000 token.

- [ ] `node scripts/call.ts nexus_revenue_by '{"by":"month"}'` → 13 dòng tháng (`2025-10` … `2026-10` theo giờ VN), `totalRevenue` = `9072400000`.
- [ ] `nexus_analyze_export` trên `2026-09/don-hang.csv` (lọc `trang_thai = paid`, cộng `so_tien` theo `san_pham`) ra 5 nhóm có tổng đúng bằng `totalRevenue` ở trên — 2 đường độc lập, 1 con số.
- [ ] Cột không có → `isError` liệt kê cột có trong file.
- [ ] `pnpm --filter @nexus/mcp-server size-audit` → mọi dòng `✓`, dòng cuối `OK: 23 tool, lớn nhất … token` (≤ 25 000).
- [ ] Không tool nào trả hơn khoảng 25k token trong trường hợp xấu nhất (roadmap) — trên dữ liệu gấp 100+ lần dữ liệu mẫu.
- [ ] Thêm tool mới mà quên kịch bản xấu nhất trong `size-audit.ts` → lỗi compile (`TS2741`).

**Lệnh nghiệm thu:**

```console
$ node scripts/seed-exports.ts
$ node scripts/call.ts nexus_revenue_by '{"by":"month"}'
$ node scripts/call.ts nexus_analyze_export '{"path":"2026-09/don-hang.csv","groupBy":"san_pham","sum":"so_tien","where":{"column":"trang_thai","equals":"paid"}}'
$ pnpm size-audit
```

**Gợi ý hướng làm:** `packages/shared/src/revenue.ts` (3 cặp schema, trần trong schema) → `revenueBy`/`find` trong `OrderRepository` (cả 2 bản) → `csv/parse.ts` → 3 tool → `scripts/seed-exports.ts` → `scripts/size-audit.ts`.

Output thật — 6 lệnh (CSV do `seed-exports.ts` sinh từ cùng 600 đơn mẫu):

```console
$ node scripts/seed-exports.ts
đã ghi 600 dòng vào var/exports/2026-09/don-hang.csv
$ node scripts/call.ts nexus_revenue_by '{"by":"month"}'
{"by":"month","from":"*","to":"*","currency":"VND","totalRevenue":9072400000,"totalOrders":527,"rows":[{"key":"2025-10","orders":49,"revenue":882200000,"share":0.097},{"key":"2025-11","orders":50,"revenue":867600000,"share":0.096},{"key":"2025-12","orders":43,"revenue":738400000,"share":0.081},{"key":"2026-01","orders":37,"revenue":563500000,"share":0.062},{"key":"2026-02","orders":30,"revenue":408100000,"share":0.045},{"key":"2026-03","orders":41,"revenue":767200000,"share":0.085},{"key":"2026-04","orders":55,"revenue":898900000,"share":0.099},{"key":"2026-05","orders":46,"revenue":886000000,"share":0.098},{"key":"2026-06","orders":44,"revenue":740900000,"share":0.082},{"key":"2026-07","orders":51,"revenue":956500000,"share":0.105},{"key":"2026-08","orders":40,"revenue":619800000,"share":0.068},{"key":"2026-09","orders":40,"revenue":728600000,"share":0.08},{"key":"2026-10","orders":1,"revenue":14700000,"share":0.002}],"omitted":0}
$ node scripts/call.ts nexus_revenue_by '{"by":"city","from":"2026-07","to":"2026-09"}'
{"by":"city","from":"2026-07","to":"2026-09","currency":"VND","totalRevenue":2304900000,"totalOrders":131,"rows":[{"key":"Hà Nội","orders":47,"revenue":954900000,"share":0.414},{"key":"TP.HCM","orders":28,"revenue":529400000,"share":0.23},{"key":"Hải Phòng","orders":21,"revenue":313500000,"share":0.136},{"key":"Cần Thơ","orders":19,"revenue":294400000,"share":0.128},{"key":"Đà Nẵng","orders":16,"revenue":212700000,"share":0.092}],"omitted":0}
$ node scripts/call.ts nexus_find_orders '{"customerId":"cus_007","sample":2}'
{"matched":24,"totalAmount":417100000,"sample":[{"id":"ord_00523","customerId":"cus_007","product":"Tích hợp API","amount":44400000,"status":"paid","createdAt":"2026-07-24T23:24:20.923Z"},{"id":"ord_00343","customerId":"cus_007","product":"Đào tạo","amount":18200000,"status":"paid","createdAt":"2026-07-12T21:05:10.980Z"}]}
$ node scripts/call.ts nexus_analyze_export '{"path":"2026-09/don-hang.csv","groupBy":"san_pham","sum":"so_tien","where":{"column":"trang_thai","equals":"paid"}}'
{"path":"2026-09/don-hang.csv","columns":["ma_don","khach_hang","san_pham","so_tien","trang_thai","thanh_pho","thang","ghi_chu"],"rowCount":600,"matchedRows":527,"skippedRows":0,"groups":[{"key":"Tích hợp API","rows":109,"sum":3066500000},{"key":"Gói Enterprise","rows":96,"sum":2482800000},{"key":"Đào tạo","rows":104,"sum":1710300000},{"key":"Tư vấn","rows":106,"sum":1334000000},{"key":"Gói Pro","rows":112,"sum":478800000}],"omitted":0}
$ node scripts/call.ts nexus_analyze_export '{"path":"2026-09/don-hang.csv","groupBy":"product"}'
[isError] Không có cột: product. Cột có trong file: ma_don, khach_hang, san_pham, so_tien, trang_thai, thanh_pho, thang, ghi_chu.
```

Cộng 5 nhóm của `nexus_analyze_export`: 3.066.500.000 + 2.482.800.000 + 1.710.300.000 + 1.334.000.000 + 478.800.000 = **9.072.400.000** — khớp `totalRevenue` của `nexus_revenue_by` từ DB. Để ý tháng `2026-10` có 1 đơn: đơn đặt lúc tối 30/09 giờ UTC đã là ngày 01/10 ở Việt Nam (Bẫy 3).

Output thật — mọi tool, tham số xấu nhất, dữ liệu gấp 100+ lần mẫu:

```console
$ node scripts/size-audit.ts
dữ liệu: 10030 khách · 50000 đơn · 100000 việc · 301 file export · CSV 20000 dòng · 40 ticket · ngân sách 25000 token
tool                               ký tự   token  +structured  kết luận
nexus_read_export                  24084    6027        12054  ✓
nexus_list_tasks                   10511    4127         8254  ✓
nexus_list_exports                  8022    3304         6608  ✓
nexus_query                         7485    2886         5772  ✓
nexus_search_customers              6515    1897         4605  ✓
nexus_list_tickets                  5904    2093         4186  ✓
nexus_list_customers                3847    1309         2618  ✓
nexus_find_orders                   2807    1016         2032  ✓
nexus_analyze_export                1351     546         1092  ✓
nexus_revenue_by                    1000     377          754  ✓
nexus_create_task                    316     113          226  ✓
nexus_update_task                    221      84          168  ✓
nexus_generate_report                142      62          124  ✓
nexus_get_customer                   142      58          116  ✓
nexus_create_ticket                  171      58          116  ✓
nexus_get_time                       114      53          106  ✓
nexus_ping                            45      23           46  ✓
nexus_chart_customers_by_city         79      44           44  ✓ + 1 ảnh
nexus_update_customer_tier            73      20           40  ✓
nexus_export_customers                49      17           34  ✓
nexus_get_exchange_rate              101      30           30  ✓ (isError)
nexus_delete_task                     33      12           24  ✓
nexus_delete_customer                 31      11           22  ✓
OK: 23 tool, lớn nhất 12054 token
```

Đọc cột: `token` là phần host Nexus đưa vào context (text + dòng `resource_link`); `+structured` là khi host gửi **cả** `structuredContent` (nhiều host làm vậy) — `toolOk` của M3 trả cùng dữ liệu ở 2 dạng nên con số gấp đôi. Ngân sách so với cột lớn hơn. Tool lớn nhất là `nexus_read_export` vì `maxBytes ≤ 32 000` (32 KB tiếng Việt ≈ 6 000 token) — trần nằm trong **schema**, nâng lên 128 KB là audit đỏ ngay.

<details>
<summary>Xem sau khi làm xong — lời giải Lab Nexus S5.4</summary>

`apps/mcp-server/src/tools/revenue-by.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RevenueByInputSchema, RevenueByOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerRevenueBy(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.revenueBy,
    {
      title: "Doanh thu theo nhóm",
      description:
        "Tổng doanh thu (đơn đã thu tiền) theo tháng, thành phố hoặc sản phẩm — số đã cộng sẵn trong DB. " +
        "Dùng cho mọi câu hỏi \"doanh thu bao nhiêu / tháng nào cao nhất / khu vực nào\". " +
        "Đừng tự cộng từ nexus_find_orders hay nexus_query. Tháng tính theo giờ Việt Nam.",
      inputSchema: RevenueByInputSchema.shape,
      outputSchema: RevenueByOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.revenueBy, deps.log, async ({ by, from, to, top }) => {
      if (from !== undefined && to !== undefined && from > to) {
        return toolFail({ what: `Khoảng tháng ngược: from ${from} > to ${to}.`, next: "Đổi chỗ from và to." });
      }
      const groups = await deps.orders.revenueBy(by, { from, to });
      const totalRevenue = groups.reduce((s, g) => s + g.revenue, 0);
      const totalOrders = groups.reduce((s, g) => s + g.orders, 0);
      const ordered = by === "month" ? groups.sort((a, b) => a.key.localeCompare(b.key)).slice(-top) : groups.sort((a, b) => b.revenue - a.revenue).slice(0, top);
      const rows = ordered.map((g) => ({ ...g, share: totalRevenue === 0 ? 0 : Math.round((g.revenue / totalRevenue) * 1000) / 1000 }));
      return toolOk(RevenueByOutputSchema, {
        by,
        from: from ?? "*",
        to: to ?? "*",
        currency: "VND",
        totalRevenue,
        totalOrders,
        rows,
        omitted: groups.length - rows.length,
      });
    }),
  );
}
```
`apps/mcp-server/src/orders/repository.ts`

```ts
import type { Order } from "@nexus/shared";

export type Dimension = "month" | "city" | "product";
export interface MonthRange {
  from?: string | undefined;
  to?: string | undefined;
}
export interface RevenueRow {
  key: string;
  orders: number;
  revenue: number;
}
export interface OrderFilter extends MonthRange {
  customerId?: string | undefined;
  product?: string | undefined;
  city?: string | undefined;
  status?: Order["status"] | undefined;
  minAmount?: number | undefined;
}

/** Đơn hàng (M5 · S5.2). S5.4: tổng hợp NGAY TRONG nguồn dữ liệu — tool không bao giờ kéo hết đơn về rồi tự cộng. */
export interface OrderRepository {
  /** Toàn bộ đơn — chỉ dùng cho store RAM và seed; tool không bao giờ trả thẳng kết quả này. */
  all(): Promise<readonly Order[]>;
  /** Doanh thu = đơn status "paid"; tháng tính theo giờ Việt Nam (glossary). */
  revenueBy(by: Dimension, range: MonthRange): Promise<RevenueRow[]>;
  find(filter: OrderFilter, sample: number): Promise<{ matched: number; totalAmount: number; sample: Order[] }>;
}

/** "2026-08-31T20:00:00Z" → "2026-09": tháng theo giờ Việt Nam (UTC+7, không có giờ mùa hè). */
export const vnMonth = (iso: string): string => new Date(Date.parse(iso) + 7 * 3_600_000).toISOString().slice(0, 7);

const inRange = (m: string, r: MonthRange): boolean => (r.from === undefined || m >= r.from) && (r.to === undefined || m <= r.to);

export function createMemoryOrderRepository(seed: readonly Order[]): OrderRepository {
  const rows: readonly Order[] = seed.map((o) => Object.freeze({ ...o }));
  return {
    async all() {
      return rows;
    },
    async revenueBy(by, range) {
      const groups = new Map<string, RevenueRow>();
      for (const o of rows) {
        const m = vnMonth(o.createdAt);
        if (o.status !== "paid" || !inRange(m, range)) continue;
        const key = by === "month" ? m : by === "city" ? o.city : o.product;
        const g = groups.get(key) ?? { key, orders: 0, revenue: 0 };
        g.orders += 1;
        g.revenue += o.amount;
        groups.set(key, g);
      }
      return [...groups.values()];
    },
    async find(f, sample) {
      const hit = rows.filter(
        (o) =>
          (f.customerId === undefined || o.customerId === f.customerId) &&
          (f.product === undefined || o.product === f.product) &&
          (f.city === undefined || o.city === f.city) &&
          (f.status === undefined || o.status === f.status) &&
          (f.minAmount === undefined || o.amount >= f.minAmount) &&
          inRange(vnMonth(o.createdAt), f),
      );
      const newest = [...hit].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, sample);
      return { matched: hit.length, totalAmount: hit.reduce((s, o) => s + o.amount, 0), sample: newest };
    },
  };
}
```
`apps/mcp-server/src/orders/mongo-repository.ts`

```ts
import type { Order } from "@nexus/shared";
import type { Db, Document } from "mongodb";
import type { Dimension, MonthRange, OrderFilter, OrderRepository, RevenueRow } from "./repository.ts";

type OrderDoc = Omit<Order, "id"> & { _id: string };

const TZ = "Asia/Ho_Chi_Minh";
/** Tháng theo giờ VN, tính trong DB. createdAt lưu chuỗi ISO → đổi sang Date trước. */
const MONTH_EXPR = { $dateToString: { format: "%Y-%m", date: { $dateFromString: { dateString: "$createdAt" } }, timezone: TZ } };

function monthMatch(r: MonthRange): Document[] {
  if (r.from === undefined && r.to === undefined) return [];
  return [
    { $addFields: { _month: MONTH_EXPR } },
    { $match: { _month: { ...(r.from ? { $gte: r.from } : {}), ...(r.to ? { $lte: r.to } : {}) } } },
  ];
}

/** Bản Mongo — chưa chạy ở sandbox dựng bài (không có Mongo). Index gợi ý: { status: 1, createdAt: 1 }. */
export function createMongoOrderRepository(db: Db): OrderRepository {
  const col = db.collection<OrderDoc>("orders");
  return {
    async all() {
      const docs = await col.find({}).sort({ createdAt: 1 }).toArray();
      return docs.map(({ _id, ...rest }) => ({ id: _id, ...rest }));
    },
    async revenueBy(by: Dimension, range: MonthRange) {
      const key = by === "month" ? MONTH_EXPR : by === "city" ? "$city" : "$product";
      const pipeline: Document[] = [
        { $match: { status: "paid" } }, // $match sớm để dùng index
        ...monthMatch(range),
        { $group: { _id: key, orders: { $sum: 1 }, revenue: { $sum: "$amount" } } },
        { $project: { _id: 0, key: "$_id", orders: 1, revenue: 1 } },
      ];
      return col.aggregate<RevenueRow>(pipeline, { maxTimeMS: 5_000 }).toArray();
    },
    async find(f: OrderFilter, sample: number) {
      const match: Document = {
        ...(f.customerId ? { customerId: f.customerId } : {}),
        ...(f.product ? { product: f.product } : {}),
        ...(f.city ? { city: f.city } : {}),
        ...(f.status ? { status: f.status } : {}),
        ...(f.minAmount !== undefined ? { amount: { $gte: f.minAmount } } : {}),
      };
      const [res] = await col
        .aggregate<{ total: Array<{ matched: number; totalAmount: number }>; sample: OrderDoc[] }>(
          [
            { $match: match },
            ...monthMatch(f),
            {
              $facet: {
                total: [{ $group: { _id: null, matched: { $sum: 1 }, totalAmount: { $sum: "$amount" } } }],
                sample: [{ $sort: { createdAt: -1 } }, { $limit: sample }, { $project: { _month: 0 } }],
              },
            },
          ],
          { maxTimeMS: 5_000 },
        )
        .toArray();
      const t = res?.total[0];
      return {
        matched: t?.matched ?? 0,
        totalAmount: t?.totalAmount ?? 0,
        sample: (res?.sample ?? []).map(({ _id, ...rest }) => ({ id: _id, ...rest })),
      };
    },
  };
}
```
`apps/mcp-server/src/tools/find-orders.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FindOrdersInputSchema, FindOrdersOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolOk } from "../tool-result.ts";

export function registerFindOrders(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.findOrders,
    {
      title: "Lọc đơn hàng",
      description:
        "Lọc đơn hàng theo khách, sản phẩm, thành phố, trạng thái, số tiền, khoảng tháng. Trả SỐ ĐẾM + TỔNG TIỀN + vài đơn mẫu mới nhất, " +
        "không trả toàn bộ danh sách. Doanh thu theo nhóm thì dùng nexus_revenue_by.",
      inputSchema: FindOrdersInputSchema.shape,
      outputSchema: FindOrdersOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.findOrders, deps.log, async ({ sample, ...filter }) => {
      const r = await deps.orders.find(filter, sample);
      return toolOk(FindOrdersOutputSchema, {
        matched: r.matched,
        totalAmount: r.totalAmount,
        sample: r.sample.map(({ id, customerId, product, amount, status, createdAt }) => ({ id, customerId, product, amount, status, createdAt })),
      });
    }),
  );
}
```
`apps/mcp-server/src/tools/analyze-export.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AnalyzeExportInputSchema, AnalyzeExportOutputSchema, TOOL } from "@nexus/shared";
import path from "node:path";
import { parseCsv, parseNumber } from "../csv/parse.ts";
import type { Deps } from "../deps.ts";
import { readHead, resolveExisting } from "../files/safe-path.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

const MAX_CSV_BYTES = 5_000_000;

export function registerAnalyzeExport(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.analyzeExport,
    {
      title: "Phân tích file CSV",
      description:
        "Đếm / cộng 1 file CSV trong thư mục export theo 1 cột (group by), có thể lọc 1 cột bằng 1 giá trị. " +
        "Trả bảng tổng hợp, KHÔNG trả dòng dữ liệu thô. Dùng thay cho nexus_read_export khi cần con số từ CSV.",
      inputSchema: AnalyzeExportInputSchema.shape,
      outputSchema: AnalyzeExportOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.analyzeExport, deps.log, async ({ path: userPath, groupBy, sum, where, top }) => {
      const r = await resolveExisting(deps.exportsDir, userPath);
      if (!r.ok) {
        if (r.reason === "outside") deps.log.warn("export path denied", { path: userPath, detail: r.detail });
        return toolFail({ what: `Không đọc được "${userPath}".`, next: "Chỉ dùng path do nexus_list_exports trả về." });
      }
      if (path.extname(r.rel).toLowerCase() !== ".csv") return toolFail({ what: `"${userPath}" không phải .csv.`, next: "Chọn 1 file .csv từ nexus_list_exports." });
      const head = await readHead(r.path, MAX_CSV_BYTES);
      if (head.truncated) return toolFail({ what: `File lớn hơn ${MAX_CSV_BYTES / 1e6} MB.`, next: "Báo người dùng tách file hoặc nhập vào hệ thống." });
      const csv = parseCsv(head.text);
      const col = (name: string): number => csv.header.indexOf(name);
      const missing = [groupBy, ...(sum ? [sum] : []), ...(where ? [where.column] : [])].filter((c) => col(c) < 0);
      if (missing.length > 0) return toolFail({ what: `Không có cột: ${missing.join(", ")}.`, next: `Cột có trong file: ${csv.header.join(", ")}.` });

      const gi = col(groupBy);
      const si = sum ? col(sum) : -1;
      const wi = where ? col(where.column) : -1;
      const groups = new Map<string, { key: string; rows: number; sum: number }>();
      let matchedRows = 0;
      let skippedRows = 0;
      for (const row of csv.rows) {
        if (where && (row[wi] ?? "") !== where.equals) continue;
        matchedRows++;
        const key = row[gi] ?? "";
        const g = groups.get(key) ?? { key, rows: 0, sum: 0 };
        g.rows++;
        if (si >= 0) {
          const n = parseNumber(row[si] ?? "");
          if (n === undefined) skippedRows++;
          else g.sum += n;
        }
        groups.set(key, g);
      }
      const sorted = [...groups.values()].sort((a, b) => (si >= 0 ? b.sum - a.sum : b.rows - a.rows));
      const kept = sorted.slice(0, top).map((g) => (si >= 0 ? g : { key: g.key, rows: g.rows }));
      return toolOk(AnalyzeExportOutputSchema, {
        path: r.rel,
        columns: csv.header,
        rowCount: csv.rows.length,
        matchedRows,
        skippedRows,
        groups: kept,
        omitted: sorted.length - kept.length,
      });
    }),
  );
}
```
`apps/mcp-server/src/csv/parse.ts`

```ts
/**
 * CSV theo RFC 4180: dấu phẩy, ngoặc kép bao ô, "" là 1 dấu ngoặc, xuống dòng trong ô có ngoặc (M5 · S5.4).
 * Không dùng split(","): "Cà phê, trà" là 1 ô, không phải 2.
 */
export interface Csv {
  header: string[];
  rows: string[][];
}

export function parseCsv(text: string): Csv {
  const out: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // bỏ BOM của Excel
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"' && cell === "") quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      out.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    out.push(row);
  }
  const [header = [], ...rows] = out.filter((r) => !(r.length === 1 && r[0] === ""));
  return { header: header.map((h) => h.trim()), rows };
}

/** "1.250.000", "1,250,000.5", " 42 " → số; không phải số → undefined. */
export function parseNumber(raw: string): number | undefined {
  const s = raw.trim().replace(/\s/g, "");
  if (s === "") return undefined;
  const normalized = /^\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, "") : s.replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
}
```
`packages/shared/src/revenue.ts`

```ts
import { z } from "zod";
import { CitySchema, CustomerIdSchema } from "./customer.ts";
import { ExportPathSchema } from "./exports.ts";
import { ORDER_STATUSES, ProductSchema } from "./order.ts";

const Month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "tháng dạng YYYY-MM, ví dụ 2026-07");

// ---------- nexus_revenue_by (M5 · S5.4): tổng hợp, không trả đơn hàng ----------
export const REVENUE_DIMENSIONS = ["month", "city", "product"] as const;
export const RevenueByInputSchema = z.object({
  by: z.enum(REVENUE_DIMENSIONS).describe("Nhóm theo: month (giờ Việt Nam) | city | product"),
  from: Month.optional().describe("Từ tháng (gồm), YYYY-MM"),
  to: Month.optional().describe("Tới tháng (gồm), YYYY-MM"),
  top: z.number().int().min(1).max(24).default(24).describe("Giữ N nhóm lớn nhất (month: giữ theo thời gian)"),
});
export const RevenueRowSchema = z.object({
  key: z.string(),
  orders: z.number().int(),
  revenue: z.number().int().describe("VND"),
  share: z.number().describe("Tỉ trọng trên tổng, 0–1, làm tròn 3 chữ số"),
});
export const RevenueByOutputSchema = z.object({
  by: z.enum(REVENUE_DIMENSIONS),
  from: z.string(),
  to: z.string(),
  currency: z.literal("VND"),
  totalRevenue: z.number().int(),
  totalOrders: z.number().int(),
  rows: z.array(RevenueRowSchema),
  omitted: z.number().int().describe("Số nhóm bị bỏ do top (doanh thu của chúng vẫn nằm trong totalRevenue)"),
});

// ---------- nexus_find_orders: lọc + tóm tắt + vài mẫu ----------
export const FindOrdersInputSchema = z.object({
  customerId: CustomerIdSchema.optional(),
  product: ProductSchema.optional(),
  city: CitySchema.optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  minAmount: z.number().int().min(0).optional().describe("VND"),
  from: Month.optional(),
  to: Month.optional(),
  sample: z.number().int().min(0).max(20).default(5).describe("Số đơn mẫu (mới nhất) kèm theo, 0–20"),
});
export const FindOrdersOutputSchema = z.object({
  matched: z.number().int().describe("Tổng số đơn khớp — dùng để đếm"),
  totalAmount: z.number().int().describe("Tổng tiền các đơn khớp (mọi trạng thái đã lọc), VND"),
  sample: z.array(
    z.object({ id: z.string(), customerId: z.string(), product: z.string(), amount: z.number().int(), status: z.string(), createdAt: z.string() }),
  ),
});

// ---------- nexus_analyze_export: phân tích CSV trong thư mục export ----------
export const AnalyzeExportInputSchema = z.object({
  path: ExportPathSchema,
  groupBy: z.string().min(1).max(64).describe("Tên cột để nhóm"),
  sum: z.string().min(1).max(64).optional().describe("Tên cột số để cộng (bỏ trống = chỉ đếm)"),
  where: z.object({ column: z.string(), equals: z.string() }).optional().describe("Chỉ lấy dòng có column == equals"),
  top: z.number().int().min(1).max(30).default(20),
});
export const AnalyzeExportOutputSchema = z.object({
  path: z.string(),
  columns: z.array(z.string()),
  rowCount: z.number().int().describe("Số dòng dữ liệu đã đọc (không tính tiêu đề)"),
  matchedRows: z.number().int(),
  skippedRows: z.number().int().describe("Dòng có cột sum không phải số"),
  groups: z.array(z.object({ key: z.string(), rows: z.number().int(), sum: z.number().optional() })),
  omitted: z.number().int(),
});
```
`apps/mcp-server/scripts/size-audit.ts`

```ts
// pnpm size-audit — gọi MỌI tool với tham số xấu nhất trên dữ liệu lớn, đo phần host đưa vào context. Thoát 1 nếu tool nào > ngân sách.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { TOOL, type ToolName } from "@nexus/shared";
import { Tiktoken } from "js-tiktoken/lite";
import o200k from "js-tiktoken/ranks/o200k_base";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { createMemoryCustomerRepository } from "../src/customers/memory-repository.ts";
import { seedCustomers } from "../src/customers/seed-data.ts";
import { helpdeskFromEnv, memoryQueryStore, type Deps } from "../src/deps.ts";
import { openRoot } from "../src/files/safe-path.ts";
import { createLogger } from "../src/log.ts";
import { createMemoryOrderRepository } from "../src/orders/repository.ts";
import { createMemoryTaskRepository } from "../src/tasks/memory-repository.ts";
import { seedTasks } from "../src/tasks/seed-data.ts";
import { seedOrders } from "../src/orders/seed-data.ts";
import { createRatesClient } from "../src/rates/client.ts";
import { createServer } from "../src/server.ts";
import { startHelpdeskStub } from "./stub/helpdesk.ts";

const BUDGET = 25_000; // token / 1 kết quả tool (roadmap M5 · S5.4)
const enc = new Tiktoken(o200k); // ước lượng: tokenizer o200k_base, không phải tokenizer của mọi model

// ---------- dữ liệu xấu nhất: lớn hơn dữ liệu mẫu hàng trăm lần ----------
const seed = seedCustomers(10_000);
const customers = createMemoryCustomerRepository(seed);
const orders = createMemoryOrderRepository(seedOrders(seed, 50_000));
const tasks = createMemoryTaskRepository(seedTasks(100_000));
const exportsDir = await openRoot(path.join(await mkdtemp(path.join(tmpdir(), "nexus-audit-")), "exports"));
await mkdir(path.join(exportsDir, "bulk"), { recursive: true });
for (let i = 0; i < 300; i++) await writeFile(path.join(exportsDir, "bulk", `bao-cao-${String(i).padStart(3, "0")}.txt`), "x");
await writeFile(path.join(exportsDir, "dai.txt"), "Nội dung rất dài có dấu tiếng Việt. ".repeat(20_000));
const csv = ["ma,nhom,so_tien", ...Array.from({ length: 20_000 }, (_, i) => `r${i},nhom-${i},${(i % 97) * 1000}`)].join("\n");
await writeFile(path.join(exportsDir, "lon.csv"), csv);
const stub = await startHelpdeskStub({ port: 0, token: "t", capacity: 1_000, refillPerSec: 1_000 });
const log = createLogger("error");

const deps: Deps = {
  log,
  customers,
  orders,
  tasks,
  query: memoryQueryStore(customers, orders, tasks),
  rates: createRatesClient("http://127.0.0.1:9", 300),
  exportsDir,
  helpdesk: helpdeskFromEnv({ HELPDESK_URL: `http://127.0.0.1:${(stub.server.address() as AddressInfo).port}`, HELPDESK_TOKEN: "t" }, log),
  close: async () => undefined,
};

/** Record<ToolName, …>: thêm tool mới mà quên kịch bản xấu nhất → lỗi compile, không phải quên âm thầm. */
const WORST: Record<ToolName, Record<string, unknown>> = {
  [TOOL.ping]: {},
  [TOOL.getTime]: {},
  [TOOL.listCustomers]: { limit: 50 },
  [TOOL.getCustomer]: { id: "cus_001" },
  [TOOL.getExchangeRate]: { from: "USD" },
  [TOOL.chartCustomersByCity]: {},
  [TOOL.updateCustomerTier]: { id: "cus_002", tier: "enterprise" },
  [TOOL.deleteCustomer]: { id: "cus_003" },
  [TOOL.generateReport]: {},
  [TOOL.searchCustomers]: { query: "khach", limit: 100 },
  [TOOL.listExports]: {},
  [TOOL.readExport]: { path: "dai.txt", maxBytes: 32_000 },
  [TOOL.exportCustomers]: { filename: "tat-ca.csv" },
  [TOOL.query]: { collection: "customers", filter: {}, limit: 50 },
  [TOOL.listTickets]: { limit: 50 },
  [TOOL.createTicket]: { customerId: "cus_001", subject: "Kiểm tra kích thước", body: "x".repeat(2_000) },
  [TOOL.revenueBy]: { by: "month", top: 24 },
  [TOOL.findOrders]: { sample: 20 },
  [TOOL.analyzeExport]: { path: "lon.csv", groupBy: "nhom", sum: "so_tien", top: 30 },
  [TOOL.listTasks]: { limit: 50 },
  [TOOL.createTask]: { title: "Kiểm tra kích thước ".repeat(6).trim(), assignee: "lan", customerId: "cus_001", dueDate: "2026-12-31" },
  [TOOL.updateTask]: { id: "task_0001", status: "done", assignee: "minh", dueDate: null },
  [TOOL.deleteTask]: { id: "task_0002" },
};

/** Đúng cách host Nexus web (M4) ghép kết quả tool thành chuỗi cho LLM. */
function toText(r: CallToolResult): { text: string; images: number } {
  let images = 0;
  const text = r.content
    .map((c) => {
      if (c.type === "text") return c.text;
      if (c.type === "resource_link") return `[resource_link] ${c.uri} ${c.title ?? c.name}`;
      if (c.type === "image") {
        images++;
        return "[image]";
      }
      return `[${c.type}]`;
    })
    .join("\n");
  return { text, images };
}

const server = createServer(deps);
const [ct, st] = InMemoryTransport.createLinkedPair();
await server.connect(st);
const client = new Client({ name: "size-audit", version: "1.0.0" });
await client.connect(ct);

const { tools } = await client.listTools();
console.log(`dữ liệu: ${seed.length} khách · 50000 đơn · 100000 việc · 301 file export · CSV 20000 dòng · 40 ticket · ngân sách ${BUDGET} token`);
console.log(`${"tool".padEnd(32)} ${"ký tự".padStart(7)} ${"token".padStart(7)} ${"+structured".padStart(12)}  kết luận`);
let over = 0;
const rows: Array<[string, number, number, number, string]> = [];
for (const t of tools) {
  const args = WORST[t.name as ToolName];
  const r = (await client.callTool({ name: t.name, arguments: args })) as CallToolResult;
  const { text, images } = toText(r);
  const tokens = enc.encode(text).length;
  const both = tokens + (r.structuredContent ? enc.encode(JSON.stringify(r.structuredContent)).length : 0);
  const ok = both <= BUDGET;
  if (!ok) over++;
  rows.push([t.name, text.length, tokens, both, `${ok ? "✓" : "✗ VƯỢT"}${r.isError ? " (isError)" : ""}${images ? ` + ${images} ảnh` : ""}`]);
}
rows.sort((a, b) => b[3] - a[3]);
for (const [name, chars, tokens, both, verdict] of rows) {
  console.log(`${name.padEnd(32)} ${String(chars).padStart(7)} ${String(tokens).padStart(7)} ${String(both).padStart(12)}  ${verdict}`);
}
await client.close();
stub.server.close();
console.log(over === 0 ? `OK: ${tools.length} tool, lớn nhất ${rows[0]?.[3]} token` : `${over} tool vượt ngân sách`);
process.exit(over === 0 ? 0 : 1);
```

Hai chỗ chỉ đường cho model sang tool tổng hợp (diff thật S5.3 → S5.4):

`apps/mcp-server/src/tools/read-export.ts`

```diff
       description:
         "Đọc phần đầu 1 file văn bản (.csv, .md, .txt, .json) trong thư mục export. path lấy từ nexus_list_exports. " +
-        "File dài bị cắt ở maxBytes (truncated=true).",
+        "File dài bị cắt ở maxBytes (truncated=true). Cần con số từ CSV (đếm, tổng theo cột) thì dùng nexus_analyze_export, đừng đọc thô.",
       inputSchema: ReadExportInputSchema.shape,
       outputSchema: ReadExportOutputSchema.shape,
```

`apps/mcp-server/src/query/catalog.ts`

```diff
     `Giới hạn: sâu ≤ ${LIMITS.depth} tầng · ≤ ${LIMITS.nodes} điều kiện · \`$in\` ≤ ${LIMITS.inSize} giá trị · \`$regex\` ≤ ${LIMITS.regexLength} ký tự · limit ≤ 50.`,
     "Ngày là chuỗi ISO 8601 so sánh theo thứ tự chuỗi: `\"2026-07-01\"` ≤ mọi thời điểm trong tháng 7/2026.",
-    "Đếm: dùng `matched` trong kết quả, không đếm `items`.",
+    "Đếm: dùng `matched` trong kết quả, không đếm `items`. Tổng doanh thu theo nhóm: dùng `nexus_revenue_by`, đừng tự cộng.",
   );
   return `${parts.join("\n")}\n`;
```

</details>

<details>
<summary>Tra khi test đỏ</summary>

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| `size-audit` đỏ ở 1 tool list | Trần `limit` quá cao, hoặc mỗi mục kéo theo object con | Hạ `max` trong schema; chỉ trả field cần; dày thì đổi sang `resource_link` (M4) |
| Tổng `analyze_export` ≠ `revenue_by` | CSV đọc sai (split), số parse sai (`Number`), hoặc lọc trạng thái khác nhau | `parseCsv` + `parseNumber`; cùng định nghĩa “doanh thu = paid” |
| Doanh thu tháng lệch số kế toán | Nhóm theo tháng UTC | Tháng theo giờ VN: `vnMonth` / `$dateToString` có `timezone` |
| `skippedRows` > 0 | Cột tiền có ô rỗng/chữ | Báo trong kết quả (đã có); không âm thầm coi là 0 |
| `TS2741 Property 'nexus_…' is missing` ở `size-audit.ts` | Thêm tool mới | Đúng ý đồ — thêm kịch bản xấu nhất cho tool đó |
| Model tự cộng `items` của `nexus_query` | Description không chỉ đường | Description + `nexus://schema` nói “dùng `nexus_revenue_by`, đừng tự cộng” |
| Harness Lab 26 báo kết quả chứa dữ liệu thô | Tool lọc trả nguyên dòng | Trả số dòng khớp + vài mẫu có giới hạn |

</details>

### Cái gì đi vào context

**Sơ đồ (Luồng dữ liệu) — 50 000 đơn hàng: cái gì thật sự đi vào context?**

```mermaid
flowchart LR
    db["orders: 50 000 đơn"] -- "$group" --> rev["nexus_revenue_by: ≤ 24 dòng"]
    db -- "$facet" --> find["nexus_find_orders: đếm + ≤ 20 mẫu"]
    rev -- "377 token" --> llm["LLM"]
    find -- "1016 token" --> llm
    db -.-> naive["✗ Trả nguyên danh sách"]
    naive -. "2.8 M token" .-> llm
    classDef hl fill:#f5d9c8,stroke:#b8583a,stroke-width:3px
    class rev hl
```

**Đọc sơ đồ:** Trái: dữ liệu ở nguồn. Giữa: hai tool tổng hợp — cộng/đếm NGAY trong nguồn, chỉ trả số và vài mẫu. Phải: context của LLM. Nét đứt dưới là bản dịch thẳng: trả nguyên danh sách để LLM tự cộng. *Màu: đỏ gạch + ✗ + viền đứt = bị chặn/sai · vàng mù tạt + ? + viền chấm = cần xem lại · xanh ô-liu + ✓ = chạy đúng. Nhãn mũi tên = token thật đo bằng o200k_base.*


### Phần khác C# thật sự

**1. Người đọc kết quả trả tiền theo token và cộng kém.** Trong Web API, client là code — đưa 600 dòng cho nó tự `Sum()` là chuyện bình thường. Ở đây client là model: 600 đơn tốn 33 444 token, và cộng 527 số tiền bằng “suy nghĩ” là chờ sai. Nguyên tắc: số nào trả lời được bằng `$group` thì trả kết quả `$group`.

**2. Tổng hợp và lọc là 2 tool.** `nexus_revenue_by` trả **nhóm** (≤ 24 dòng); `nexus_find_orders` trả **một tập** (đếm + tổng + ≤ 20 mẫu). Gộp làm một (“lọc rồi nhóm theo tùy chọn”) thì schema rối, model chọn sai tham số. Description mỗi tool nói rõ khi nào dùng tool kia.

**3. Ngày tháng là của người dùng, không phải của server.** `createdAt` lưu UTC (đúng). Nhưng “doanh thu tháng 9” là tháng 9 **ở Việt Nam**. JS `Date` không có kiểu “ngày tại múi giờ X” — cộng offset cố định (+7, VN không đổi giờ mùa hè) hoặc để Mongo làm với `timezone: "Asia/Ho_Chi_Minh"`.

**4. CSV là dữ liệu do người tạo.** BOM của Excel, CRLF, ô có dấu phẩy/ngoặc kép/xuống dòng, `1.250.000` kiểu kế toán VN. Parse đúng chuẩn 1 lần ở `csv/parse.ts`; tool chỉ làm việc với bảng đã parse.

**5. Ngân sách là test, không phải lời hứa.** `size-audit.ts` dựng dữ liệu lớn hơn mẫu hàng trăm lần (10 030 khách, 50 000 đơn, 100 000 việc, 301 file) và gọi **mọi** tool. Trần thật nằm ở schema (`limit`, `top`, `sample`, `maxBytes`) — kích thước kết quả không phụ thuộc kích thước dữ liệu.

**6. Tiếng Việt tốn token hơn.** 24 084 ký tự của `nexus_read_export` là 6 027 token (≈ 4 ký tự/token); JSON số liệu tiếng Anh thường 3–4 ký tự/token. Ước lượng “ký tự / 4” vẫn tạm được cho JSON, nhưng đo thì chắc hơn.

### Bẫy dev .NET hay vấp

#### Bẫy 1 — `return Ok(orders)`: trả nguyên danh sách, hoặc cắt bớt

`lesson-code/m5/traps/raw-orders.ts`

```ts
// Bẫy 1 (S5.4) — dịch thẳng "GET /orders": tool trả danh sách đơn, để LLM tự đếm/cộng.
import { Tiktoken } from "js-tiktoken/lite";
import o200k from "js-tiktoken/ranks/o200k_base";
import { seedCustomers } from "../../../nexus/apps/mcp-server/src/customers/seed-data.ts";
import { seedOrders } from "../../../nexus/apps/mcp-server/src/orders/seed-data.ts";
import { createMemoryOrderRepository } from "../../../nexus/apps/mcp-server/src/orders/repository.ts";

const enc = new Tiktoken(o200k);
const listOrdersNaive = (orders: readonly object[]): string => JSON.stringify({ items: orders });

for (const n of [600, 50_000]) {
  const orders = seedOrders(seedCustomers(), n);
  const text = listOrdersNaive(orders);
  console.log(`${String(n).padStart(6)} đơn → ${text.length.toLocaleString("en")} ký tự · ${enc.encode(text).length.toLocaleString("en")} token`);
}

// "Thì cắt còn 50 cho vừa context" — rồi LLM cộng 50 dòng đó
const all = seedOrders(seedCustomers(), 600);
const first50 = all.slice(0, 50).filter((o) => o.status === "paid").reduce((s, o) => s + o.amount, 0);
const real = (await createMemoryOrderRepository(all).revenueBy("month", {})).reduce((s, g) => s + g.revenue, 0);
console.log(`\ncắt còn 50 đơn đầu, LLM cộng: ${first50.toLocaleString("vi-VN")} VND`);
console.log(`nexus_revenue_by (cộng trong nguồn): ${real.toLocaleString("vi-VN")} VND — lệch ${Math.round((1 - first50 / real) * 100)}%`);
```

```console
$ node m5/traps/raw-orders.ts
   600 đơn → 92,305 ký tự · 33,444 token
 50000 đơn → 7,695,855 ký tự · 2,787,202 token

cắt còn 50 đơn đầu, LLM cộng: 798.900.000 VND
nexus_revenue_by (cộng trong nguồn): 9.072.400.000 VND — lệch 91%
```

600 đơn đã vượt ngân sách 25k; năm sau 50 000 đơn là 2,8 triệu token — không host nào nhận nổi. “Thì cắt còn 50” làm mọi thứ tệ hơn: kết quả **trông** hợp lệ nhưng tổng lệch 91%, và không có lỗi nào báo.

#### Bẫy 2 — CSV bằng `split(",")`, tiền bằng `Number()`

`lesson-code/m5/traps/csv-split.ts`

```ts
// Bẫy 2 (S5.4) — đọc CSV bằng split(","): ô có dấu phẩy / xuống dòng trong ngoặc kép làm lệch cột.
import { readFile } from "node:fs/promises";
import { parseCsv, parseNumber } from "../../../nexus/apps/mcp-server/src/csv/parse.ts";

const FILE = new URL("../../../nexus/apps/mcp-server/var/exports/2026-09/don-hang.csv", import.meta.url);
const text = await readFile(FILE, "utf8").catch(() => {
  console.log("chưa có file — chạy trước: (cd nexus/apps/mcp-server && node scripts/seed-exports.ts)");
  process.exit(1);
});

function naive(t: string): { rows: number; sums: Map<string, number> } {
  const [head = "", ...lines] = t.trim().split("\n");
  const cols = head.split(",");
  const pi = cols.indexOf("san_pham");
  const si = cols.indexOf("so_tien");
  const sums = new Map<string, number>();
  for (const line of lines) {
    const cells = line.split(",");
    sums.set(cells[pi] ?? "?", (sums.get(cells[pi] ?? "?") ?? 0) + (parseNumber(cells[si] ?? "") ?? 0));
  }
  return { rows: lines.length, sums };
}

const n = naive(text);
const csv = parseCsv(text);
const ok = new Map<string, number>();
const pi = csv.header.indexOf("san_pham");
const si = csv.header.indexOf("so_tien");
for (const r of csv.rows) ok.set(r[pi] ?? "?", (ok.get(r[pi] ?? "?") ?? 0) + (parseNumber(r[si] ?? "") ?? 0));

console.log(`số dòng dữ liệu: split = ${n.rows} · parseCsv = ${csv.rows.length}`);
console.log(`${"san_pham".padEnd(16)} ${"split(\",\")".padStart(16)} ${"parseCsv".padStart(16)}`);
for (const [k, v] of [...ok].sort((a, b) => b[1] - a[1])) {
  console.log(`${k.padEnd(16)} ${(n.sums.get(k) ?? 0).toLocaleString("vi-VN").padStart(16)} ${v.toLocaleString("vi-VN").padStart(16)}`);
}
const junk = [...n.sums.keys()].filter((k) => !ok.has(k));
console.log(`split tạo thêm ${junk.length} "sản phẩm" rác, ví dụ: ${junk.slice(0, 3).map((k) => JSON.stringify(k)).join(", ")}`);
console.log(`và nếu dùng Number() cho cột tiền: Number("1.250.000") = ${Number("1.250.000")}`);
```

```console
$ node m5/traps/csv-split.ts
số dòng dữ liệu: split = 750 · parseCsv = 600
san_pham               split(",")         parseCsv
Tích hợp API        3.017.700.000    3.554.000.000
Gói Enterprise      2.240.500.000    2.852.900.000
Đào tạo             1.446.400.000    1.908.200.000
Tư vấn              1.271.200.000    1.557.800.000
Gói Pro               407.500.000      532.900.000
split tạo thêm 2 "sản phẩm" rác, ví dụ: " chi nhánh 2\"", "?"
và nếu dùng Number() cho cột tiền: Number("1.250.000") = NaN
```

Tên khách `Cà phê Phố Cổ, chi nhánh 2` (trong ngoặc kép) bị tách làm 2 cột → cả dòng lệch sang phải, sản phẩm thành `" chi nhánh 2\""`. Ghi chú có xuống dòng → 1 dòng thành 2 (750 “dòng” thay vì 600). Và kể cả khi cột đúng, `Number("1.250.000")` vẫn là `NaN`.

#### Bẫy 3 — tháng bằng `createdAt.slice(0, 7)`

`lesson-code/m5/traps/utc-month.ts`

```ts
// Bẫy 3 (S5.4) — nhóm theo tháng bằng createdAt.slice(0, 7): tháng UTC, không phải tháng Việt Nam.
import { seedCustomers } from "../../../nexus/apps/mcp-server/src/customers/seed-data.ts";
import { seedOrders } from "../../../nexus/apps/mcp-server/src/orders/seed-data.ts";
import { vnMonth } from "../../../nexus/apps/mcp-server/src/orders/repository.ts";

const paid = seedOrders(seedCustomers()).filter((o) => o.status === "paid");
const count = (key: (iso: string) => string): Map<string, number> => {
  const m = new Map<string, number>();
  for (const o of paid) m.set(key(o.createdAt), (m.get(key(o.createdAt)) ?? 0) + o.amount);
  return m;
};
const utc = count((iso) => iso.slice(0, 7));
const vn = count(vnMonth);
console.log(`${"tháng".padEnd(8)} ${"UTC slice(0,7)".padStart(16)} ${"giờ VN".padStart(16)}`);
for (const k of [...new Set([...utc.keys(), ...vn.keys()])].sort()) {
  const a = utc.get(k) ?? 0;
  const b = vn.get(k) ?? 0;
  if (a !== b) console.log(`${k.padEnd(8)} ${a.toLocaleString("vi-VN").padStart(16)} ${b.toLocaleString("vi-VN").padStart(16)}`);
}
const moved = paid.filter((o) => o.createdAt.slice(0, 7) !== vnMonth(o.createdAt));
console.log(`${moved.length}/${paid.length} đơn đã thu bị xếp sai tháng; ví dụ ${moved[0]?.id} lúc ${moved[0]?.createdAt} là ${moved[0] ? vnMonth(moved[0].createdAt) : ""} ở Việt Nam`);
```

```console
$ node m5/traps/utc-month.ts
tháng      UTC slice(0,7)           giờ VN
2025-10       886.600.000      882.200.000
2025-11       900.700.000      867.600.000
2025-12       700.900.000      738.400.000
2026-02       411.600.000      408.100.000
2026-03       768.400.000      767.200.000
2026-04       929.600.000      898.900.000
2026-05       880.100.000      886.000.000
2026-06       721.400.000      740.900.000
2026-07       946.500.000      956.500.000
2026-09       743.300.000      728.600.000
2026-10                 0       14.700.000
9/527 đơn đã thu bị xếp sai tháng; ví dụ ord_00529 lúc 2025-10-31T21:18:14.391Z là 2025-11 ở Việt Nam
```

9 đơn đặt từ 17:00 tới 23:59 UTC ngày cuối tháng bị tính vào tháng trước. Lệch mỗi tháng vài chục triệu — đủ để số của Nexus khác số kế toán, và không ai biết vì sao.

#### Bẫy 4 — thêm tool, quên đo

`lesson-code/m5/tsc-traps/worst-missing.ts`

```ts
import { TOOL, type ToolName } from "../../../nexus/packages/shared/src/index.ts";

export const WORST: Record<ToolName, Record<string, unknown>> = {
  [TOOL.ping]: {},
  [TOOL.getTime]: {},
  [TOOL.listCustomers]: { limit: 50 },
  [TOOL.getCustomer]: { id: "cus_001" },
  [TOOL.getExchangeRate]: { from: "USD" },
  [TOOL.chartCustomersByCity]: {},
  [TOOL.updateCustomerTier]: { id: "cus_002", tier: "enterprise" },
  [TOOL.deleteCustomer]: { id: "cus_003" },
  [TOOL.generateReport]: {},
  [TOOL.searchCustomers]: { query: "khach", limit: 100 },
  [TOOL.listExports]: {},
  [TOOL.readExport]: { path: "dai.txt", maxBytes: 32_000 },
  [TOOL.exportCustomers]: { filename: "tat-ca.csv" },
  [TOOL.query]: { collection: "customers", filter: {}, limit: 50 },
  [TOOL.listTickets]: { limit: 50 },
  [TOOL.createTicket]: { customerId: "cus_001", subject: "Kiểm tra", body: "x" },
  [TOOL.findOrders]: { sample: 20 },
  [TOOL.analyzeExport]: { path: "lon.csv", groupBy: "nhom", sum: "so_tien", top: 30 },
  [TOOL.listTasks]: { limit: 50 },
  [TOOL.createTask]: { title: "Kiểm tra", assignee: "lan" },
  [TOOL.updateTask]: { id: "task_0001", status: "done" },
  [TOOL.deleteTask]: { id: "task_0002" },
};
```

> ❌ **TS2741** (dòng 3, cột 14): Property 'nexus_revenue_by' is missing in type '{ nexus_ping: {}; nexus_get_time: {}; nexus_list_customers: { limit: number; }; nexus_get_customer: { id: string; }; nexus_get_exchange_rate: { from: string; }; nexus_chart_customers_by_city: {}; ... 15 more ...; nexus_delete_task: { ...; }; }' but required in type 'Record<ToolName, Record<string, unknown>>'.

Lỗi bạn muốn có. `WORST` khai `Record<ToolName, …>` nên mỗi tên trong `TOOL` phải có kịch bản xấu nhất. Bản C# `Dictionary<string, object>` sẽ compile và tool mới không bao giờ được đo.

### Code mẫu & pattern

#### Code production

`apps/mcp-server/src/tools/revenue-by.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RevenueByInputSchema, RevenueByOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerRevenueBy(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.revenueBy,
    {
      title: "Doanh thu theo nhóm",
      description:
        "Tổng doanh thu (đơn đã thu tiền) theo tháng, thành phố hoặc sản phẩm — số đã cộng sẵn trong DB. " +
        "Dùng cho mọi câu hỏi \"doanh thu bao nhiêu / tháng nào cao nhất / khu vực nào\". " +
        "Đừng tự cộng từ nexus_find_orders hay nexus_query. Tháng tính theo giờ Việt Nam.",
      inputSchema: RevenueByInputSchema.shape,
      outputSchema: RevenueByOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.revenueBy, deps.log, async ({ by, from, to, top }) => {
      if (from !== undefined && to !== undefined && from > to) {
        return toolFail({ what: `Khoảng tháng ngược: from ${from} > to ${to}.`, next: "Đổi chỗ from và to." });
      }
      const groups = await deps.orders.revenueBy(by, { from, to });
      const totalRevenue = groups.reduce((s, g) => s + g.revenue, 0);
      const totalOrders = groups.reduce((s, g) => s + g.orders, 0);
      const ordered = by === "month" ? groups.sort((a, b) => a.key.localeCompare(b.key)).slice(-top) : groups.sort((a, b) => b.revenue - a.revenue).slice(0, top);
      const rows = ordered.map((g) => ({ ...g, share: totalRevenue === 0 ? 0 : Math.round((g.revenue / totalRevenue) * 1000) / 1000 }));
      return toolOk(RevenueByOutputSchema, {
        by,
        from: from ?? "*",
        to: to ?? "*",
        currency: "VND",
        totalRevenue,
        totalOrders,
        rows,
        omitted: groups.length - rows.length,
      });
    }),
  );
}
```
`apps/mcp-server/src/tools/analyze-export.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AnalyzeExportInputSchema, AnalyzeExportOutputSchema, TOOL } from "@nexus/shared";
import path from "node:path";
import { parseCsv, parseNumber } from "../csv/parse.ts";
import type { Deps } from "../deps.ts";
import { readHead, resolveExisting } from "../files/safe-path.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

const MAX_CSV_BYTES = 5_000_000;

export function registerAnalyzeExport(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.analyzeExport,
    {
      title: "Phân tích file CSV",
      description:
        "Đếm / cộng 1 file CSV trong thư mục export theo 1 cột (group by), có thể lọc 1 cột bằng 1 giá trị. " +
        "Trả bảng tổng hợp, KHÔNG trả dòng dữ liệu thô. Dùng thay cho nexus_read_export khi cần con số từ CSV.",
      inputSchema: AnalyzeExportInputSchema.shape,
      outputSchema: AnalyzeExportOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.analyzeExport, deps.log, async ({ path: userPath, groupBy, sum, where, top }) => {
      const r = await resolveExisting(deps.exportsDir, userPath);
      if (!r.ok) {
        if (r.reason === "outside") deps.log.warn("export path denied", { path: userPath, detail: r.detail });
        return toolFail({ what: `Không đọc được "${userPath}".`, next: "Chỉ dùng path do nexus_list_exports trả về." });
      }
      if (path.extname(r.rel).toLowerCase() !== ".csv") return toolFail({ what: `"${userPath}" không phải .csv.`, next: "Chọn 1 file .csv từ nexus_list_exports." });
      const head = await readHead(r.path, MAX_CSV_BYTES);
      if (head.truncated) return toolFail({ what: `File lớn hơn ${MAX_CSV_BYTES / 1e6} MB.`, next: "Báo người dùng tách file hoặc nhập vào hệ thống." });
      const csv = parseCsv(head.text);
      const col = (name: string): number => csv.header.indexOf(name);
      const missing = [groupBy, ...(sum ? [sum] : []), ...(where ? [where.column] : [])].filter((c) => col(c) < 0);
      if (missing.length > 0) return toolFail({ what: `Không có cột: ${missing.join(", ")}.`, next: `Cột có trong file: ${csv.header.join(", ")}.` });

      const gi = col(groupBy);
      const si = sum ? col(sum) : -1;
      const wi = where ? col(where.column) : -1;
      const groups = new Map<string, { key: string; rows: number; sum: number }>();
      let matchedRows = 0;
      let skippedRows = 0;
      for (const row of csv.rows) {
        if (where && (row[wi] ?? "") !== where.equals) continue;
        matchedRows++;
        const key = row[gi] ?? "";
        const g = groups.get(key) ?? { key, rows: 0, sum: 0 };
        g.rows++;
        if (si >= 0) {
          const n = parseNumber(row[si] ?? "");
          if (n === undefined) skippedRows++;
          else g.sum += n;
        }
        groups.set(key, g);
      }
      const sorted = [...groups.values()].sort((a, b) => (si >= 0 ? b.sum - a.sum : b.rows - a.rows));
      const kept = sorted.slice(0, top).map((g) => (si >= 0 ? g : { key: g.key, rows: g.rows }));
      return toolOk(AnalyzeExportOutputSchema, {
        path: r.rel,
        columns: csv.header,
        rowCount: csv.rows.length,
        matchedRows,
        skippedRows,
        groups: kept,
        omitted: sorted.length - kept.length,
      });
    }),
  );
}
```
`apps/mcp-server/src/csv/parse.ts`

```ts
/**
 * CSV theo RFC 4180: dấu phẩy, ngoặc kép bao ô, "" là 1 dấu ngoặc, xuống dòng trong ô có ngoặc (M5 · S5.4).
 * Không dùng split(","): "Cà phê, trà" là 1 ô, không phải 2.
 */
export interface Csv {
  header: string[];
  rows: string[][];
}

export function parseCsv(text: string): Csv {
  const out: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // bỏ BOM của Excel
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"' && cell === "") quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      out.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    out.push(row);
  }
  const [header = [], ...rows] = out.filter((r) => !(r.length === 1 && r[0] === ""));
  return { header: header.map((h) => h.trim()), rows };
}

/** "1.250.000", "1,250,000.5", " 42 " → số; không phải số → undefined. */
export function parseNumber(raw: string): number | undefined {
  const s = raw.trim().replace(/\s/g, "");
  if (s === "") return undefined;
  const normalized = /^\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, "") : s.replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
}
```

#### Pattern: Tổng hợp tại nguồn (projection thay entity)

**Vấn đề:** câu hỏi “doanh thu theo khu vực quý 3” cần 5 con số, nhưng đường dễ nhất là trả 131 đơn và để người đọc tự cộng.

**Tương đương C#:** LINQ `GroupBy(...).Select(g => new RevenueRow(g.Key, g.Count(), g.Sum(x => x.Amount)))` mà EF Core dịch thành `GROUP BY` — trả projection DTO, không trả entity.

**Dịch thẳng vs kiểu TS:**

`lesson-code/m5/patterns/order-report.direct.ts`

```ts
// Dịch thẳng từ C#: service trả List<OrderDto>, tool serialize nguyên danh sách, "AI tự tổng hợp".
export interface OrderDto {
  id: string;
  customerId: string;
  product: string;
  amount: number;
  status: string;
  city: string;
  createdAt: string;
}

export interface IOrderService {
  getOrders(from?: string, to?: string): Promise<OrderDto[]>;
}

export class OrdersToolHandler {
  private readonly service: IOrderService;
  constructor(service: IOrderService) {
    this.service = service;
  }
  async handle(from?: string, to?: string): Promise<{ content: Array<{ type: "text"; text: string }> }> {
    const orders = await this.service.getOrders(from, to);
    // "Trả đủ dữ liệu cho AI linh hoạt" — 600 đơn hôm nay, 50 000 đơn năm sau
    return { content: [{ type: "text", text: JSON.stringify(orders) }] };
  }
}
```
`apps/mcp-server/src/orders/repository.ts`

```ts
import type { Order } from "@nexus/shared";

export type Dimension = "month" | "city" | "product";
export interface MonthRange {
  from?: string | undefined;
  to?: string | undefined;
}
export interface RevenueRow {
  key: string;
  orders: number;
  revenue: number;
}
export interface OrderFilter extends MonthRange {
  customerId?: string | undefined;
  product?: string | undefined;
  city?: string | undefined;
  status?: Order["status"] | undefined;
  minAmount?: number | undefined;
}

/** Đơn hàng (M5 · S5.2). S5.4: tổng hợp NGAY TRONG nguồn dữ liệu — tool không bao giờ kéo hết đơn về rồi tự cộng. */
export interface OrderRepository {
  /** Toàn bộ đơn — chỉ dùng cho store RAM và seed; tool không bao giờ trả thẳng kết quả này. */
  all(): Promise<readonly Order[]>;
  /** Doanh thu = đơn status "paid"; tháng tính theo giờ Việt Nam (glossary). */
  revenueBy(by: Dimension, range: MonthRange): Promise<RevenueRow[]>;
  find(filter: OrderFilter, sample: number): Promise<{ matched: number; totalAmount: number; sample: Order[] }>;
}

/** "2026-08-31T20:00:00Z" → "2026-09": tháng theo giờ Việt Nam (UTC+7, không có giờ mùa hè). */
export const vnMonth = (iso: string): string => new Date(Date.parse(iso) + 7 * 3_600_000).toISOString().slice(0, 7);

const inRange = (m: string, r: MonthRange): boolean => (r.from === undefined || m >= r.from) && (r.to === undefined || m <= r.to);

export function createMemoryOrderRepository(seed: readonly Order[]): OrderRepository {
  const rows: readonly Order[] = seed.map((o) => Object.freeze({ ...o }));
  return {
    async all() {
      return rows;
    },
    async revenueBy(by, range) {
      const groups = new Map<string, RevenueRow>();
      for (const o of rows) {
        const m = vnMonth(o.createdAt);
        if (o.status !== "paid" || !inRange(m, range)) continue;
        const key = by === "month" ? m : by === "city" ? o.city : o.product;
        const g = groups.get(key) ?? { key, orders: 0, revenue: 0 };
        g.orders += 1;
        g.revenue += o.amount;
        groups.set(key, g);
      }
      return [...groups.values()];
    },
    async find(f, sample) {
      const hit = rows.filter(
        (o) =>
          (f.customerId === undefined || o.customerId === f.customerId) &&
          (f.product === undefined || o.product === f.product) &&
          (f.city === undefined || o.city === f.city) &&
          (f.status === undefined || o.status === f.status) &&
          (f.minAmount === undefined || o.amount >= f.minAmount) &&
          inRange(vnMonth(o.createdAt), f),
      );
      const newest = [...hit].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, sample);
      return { matched: hit.length, totalAmount: hit.reduce((s, o) => s + o.amount, 0), sample: newest };
    },
  };
}
```
`apps/mcp-server/src/orders/mongo-repository.ts`

```ts
import type { Order } from "@nexus/shared";
import type { Db, Document } from "mongodb";
import type { Dimension, MonthRange, OrderFilter, OrderRepository, RevenueRow } from "./repository.ts";

type OrderDoc = Omit<Order, "id"> & { _id: string };

const TZ = "Asia/Ho_Chi_Minh";
/** Tháng theo giờ VN, tính trong DB. createdAt lưu chuỗi ISO → đổi sang Date trước. */
const MONTH_EXPR = { $dateToString: { format: "%Y-%m", date: { $dateFromString: { dateString: "$createdAt" } }, timezone: TZ } };

function monthMatch(r: MonthRange): Document[] {
  if (r.from === undefined && r.to === undefined) return [];
  return [
    { $addFields: { _month: MONTH_EXPR } },
    { $match: { _month: { ...(r.from ? { $gte: r.from } : {}), ...(r.to ? { $lte: r.to } : {}) } } },
  ];
}

/** Bản Mongo — chưa chạy ở sandbox dựng bài (không có Mongo). Index gợi ý: { status: 1, createdAt: 1 }. */
export function createMongoOrderRepository(db: Db): OrderRepository {
  const col = db.collection<OrderDoc>("orders");
  return {
    async all() {
      const docs = await col.find({}).sort({ createdAt: 1 }).toArray();
      return docs.map(({ _id, ...rest }) => ({ id: _id, ...rest }));
    },
    async revenueBy(by: Dimension, range: MonthRange) {
      const key = by === "month" ? MONTH_EXPR : by === "city" ? "$city" : "$product";
      const pipeline: Document[] = [
        { $match: { status: "paid" } }, // $match sớm để dùng index
        ...monthMatch(range),
        { $group: { _id: key, orders: { $sum: 1 }, revenue: { $sum: "$amount" } } },
        { $project: { _id: 0, key: "$_id", orders: 1, revenue: 1 } },
      ];
      return col.aggregate<RevenueRow>(pipeline, { maxTimeMS: 5_000 }).toArray();
    },
    async find(f: OrderFilter, sample: number) {
      const match: Document = {
        ...(f.customerId ? { customerId: f.customerId } : {}),
        ...(f.product ? { product: f.product } : {}),
        ...(f.city ? { city: f.city } : {}),
        ...(f.status ? { status: f.status } : {}),
        ...(f.minAmount !== undefined ? { amount: { $gte: f.minAmount } } : {}),
      };
      const [res] = await col
        .aggregate<{ total: Array<{ matched: number; totalAmount: number }>; sample: OrderDoc[] }>(
          [
            { $match: match },
            ...monthMatch(f),
            {
              $facet: {
                total: [{ $group: { _id: null, matched: { $sum: 1 }, totalAmount: { $sum: "$amount" } } }],
                sample: [{ $sort: { createdAt: -1 } }, { $limit: sample }, { $project: { _month: 0 } }],
              },
            },
          ],
          { maxTimeMS: 5_000 },
        )
        .toArray();
      const t = res?.total[0];
      return {
        matched: t?.matched ?? 0,
        totalAmount: t?.totalAmount ?? 0,
        sample: (res?.sample ?? []).map(({ _id, ...rest }) => ({ id: _id, ...rest })),
      };
    },
  };
}
```

- Bản dịch thẳng: service trả `OrderDto[]`, handler `JSON.stringify` nguyên mảng — đúng kiểu “Web API trả DTO, client tự xử lý”. Kích thước tăng tuyến tính theo dữ liệu (Bẫy 1).
- Bản TS: hợp đồng repository nói **câu hỏi** (`revenueBy(by, range)`) chứ không nói **bảng** (`getOrders`). Bản Mongo là pipeline `$match` → `$group` → `$project` chạy trong DB; bản RAM cùng hợp đồng. Tool chỉ thêm `share`, `top`, `omitted` — kích thước kết quả có trần, không phụ thuộc số đơn.
- `RevenueRow` là kiểu kết quả riêng (projection), không tái dùng `Order`.

**Khi nào KHÔNG dùng:** người dùng muốn **xem** từng bản ghi (“5 đơn mới nhất của cus_007”) — trả mẫu có trần (`sample`) hoặc `resource_link`. Câu hỏi tổng hợp quá đa dạng để viết sẵn từng hàm → `nexus_query` có allow-list (S5.2) hoặc một tool aggregation có allow-list stage — đừng mở `$group` tùy ý cho model. Và đừng tổng hợp trong RAM của MCP server sau khi kéo hết dữ liệu về: bản RAM của Nexus chỉ để chạy được không cần DB.

### Trắc nghiệm S5.4

1. Theo `size-audit` (đo thật), vì sao cột `+structured` gấp đôi cột `token` với hầu hết tool?
   - A. `toolOk` trả cùng dữ liệu 2 lần: text JSON trong `content` và `structuredContent`; host gửi cả hai thì model đọc cả hai
   - B. `structuredContent` được nén kém hơn
   - C. Tokenizer đếm dấu ngoặc 2 lần

   <details><summary>Đáp án</summary>

   **A.** Ngân sách phải so với trường hợp host gửi cả hai. `nexus_read_export` lớn nhất: 6 027 → 12 054 token.

   </details>

2. Vì sao `nexus_revenue_by` theo tháng có dòng `2026-10` dù dữ liệu mẫu chỉ tới 30/09?
   - A. Lỗi làm tròn tháng
   - B. Có 1 đơn đặt lúc tối 30/09 giờ UTC — đã là 01/10 ở Việt Nam; tháng tính theo giờ VN
   - C. Seed sinh thiếu 1 ngày

   <details><summary>Đáp án</summary>

   **B.** Bẫy 3: nhóm theo `slice(0, 7)` của chuỗi UTC đặt sai 9/527 đơn.

   </details>

3. Kết quả “cắt còn 50 đơn đầu rồi để LLM cộng” sai 91% (đo thật). Sửa đúng là gì?
   - A. Tăng lên 500 đơn
   - B. Bảo LLM cộng cẩn thận hơn trong description
   - C. Cộng trong nguồn (`$group`) và trả tổng; cần xem đơn thì trả `sample` có trần

   <details><summary>Đáp án</summary>

   **C.** Không có số dòng thô nào vừa đủ lớn để đúng vừa đủ nhỏ để vừa context khi dữ liệu tăng.

   </details>


---

## S5.4 · Cheat Sheet

### Tool nào cho câu hỏi nào

| Câu hỏi | Tool | Trả |
|---|---|---|
| “Doanh thu tháng/khu vực/sản phẩm…” | `nexus_revenue_by` | ≤ 24 dòng `{key, orders, revenue, share}` + tổng |
| “Có bao nhiêu đơn / tổng tiền của X” | `nexus_find_orders` | `matched`, `totalAmount`, ≤ 20 mẫu mới nhất |
| “File CSV này: tổng theo cột …” | `nexus_analyze_export` | ≤ 30 nhóm + `rowCount`, `skippedRows` |
| “Đọc file” (văn bản ngắn) | `nexus_read_export` | ≤ 32 000 byte đầu |
| Câu hỏi lạ, cần filter tự do | `nexus_query` (S5.2) | `matched` + ≤ 50 bản ghi |

### Trần trong schema

| Tool | Trần | Worst-case đo thật |
|---|---|---|
| `nexus_read_export` | `maxBytes ≤ 32 000` | 12 054 token (cả structured) |
| `nexus_list_tasks` | `limit ≤ 50` | 8 254 |
| `nexus_list_exports` | 100 file | 6 608 |
| `nexus_query` | `limit ≤ 50`, `fields ≤ 8` | 5 772 |
| `nexus_revenue_by` | `top ≤ 24` | 754 |

### Ngày & số

| Việc | Viết |
|---|---|
| Tháng theo giờ VN (RAM) | `vnMonth(iso)` = cộng 7 giờ rồi `slice(0, 7)` |
| Tháng theo giờ VN (Mongo) | `$dateToString: { format: "%Y-%m", date, timezone: "Asia/Ho_Chi_Minh" }` |
| Số kiểu `1.250.000` | `parseNumber` — không `Number()` |

### Lệnh

```console
$ node scripts/call.ts nexus_revenue_by '{"by":"city","from":"2026-07","to":"2026-09"}'
$ node scripts/call.ts nexus_find_orders '{"customerId":"cus_007","sample":2}'
$ node scripts/size-audit.ts
```

### Pattern của session

| Pattern | Session | Tương đương C# / .NET | Dùng khi |
|---|---|---|---|
| Tổng hợp tại nguồn (projection thay entity) | S5.4 | LINQ `GroupBy(...).Select(new RevenueRow(...))` dịch thành `GROUP BY` | Câu hỏi về con số: trả số đã cộng + vài mẫu, không trả bản ghi |



---

## S5.4 · Code

### Cây thư mục

```txt
nexus/
├─ packages/shared/src/revenue.ts                RevenueBy, FindOrders, AnalyzeExport I/O
├─ apps/mcp-server/src/
│  ├─ orders/repository.ts                       revenueBy, find, vnMonth (bản RAM)
│  ├─ orders/mongo-repository.ts                 $group, $facet, $dateToString timezone
│  ├─ csv/parse.ts                               parseCsv (RFC 4180), parseNumber
│  └─ tools/revenue-by.ts · find-orders.ts · analyze-export.ts
└─ apps/mcp-server/scripts/seed-exports.ts · size-audit.ts
lesson-code/m5/
├─ traps/raw-orders.ts · csv-split.ts · utc-month.ts
├─ tsc-traps/worst-missing.ts
└─ patterns/order-report.direct.ts
```

### packages/shared

`packages/shared/src/revenue.ts`

```ts
import { z } from "zod";
import { CitySchema, CustomerIdSchema } from "./customer.ts";
import { ExportPathSchema } from "./exports.ts";
import { ORDER_STATUSES, ProductSchema } from "./order.ts";

const Month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "tháng dạng YYYY-MM, ví dụ 2026-07");

// ---------- nexus_revenue_by (M5 · S5.4): tổng hợp, không trả đơn hàng ----------
export const REVENUE_DIMENSIONS = ["month", "city", "product"] as const;
export const RevenueByInputSchema = z.object({
  by: z.enum(REVENUE_DIMENSIONS).describe("Nhóm theo: month (giờ Việt Nam) | city | product"),
  from: Month.optional().describe("Từ tháng (gồm), YYYY-MM"),
  to: Month.optional().describe("Tới tháng (gồm), YYYY-MM"),
  top: z.number().int().min(1).max(24).default(24).describe("Giữ N nhóm lớn nhất (month: giữ theo thời gian)"),
});
export const RevenueRowSchema = z.object({
  key: z.string(),
  orders: z.number().int(),
  revenue: z.number().int().describe("VND"),
  share: z.number().describe("Tỉ trọng trên tổng, 0–1, làm tròn 3 chữ số"),
});
export const RevenueByOutputSchema = z.object({
  by: z.enum(REVENUE_DIMENSIONS),
  from: z.string(),
  to: z.string(),
  currency: z.literal("VND"),
  totalRevenue: z.number().int(),
  totalOrders: z.number().int(),
  rows: z.array(RevenueRowSchema),
  omitted: z.number().int().describe("Số nhóm bị bỏ do top (doanh thu của chúng vẫn nằm trong totalRevenue)"),
});

// ---------- nexus_find_orders: lọc + tóm tắt + vài mẫu ----------
export const FindOrdersInputSchema = z.object({
  customerId: CustomerIdSchema.optional(),
  product: ProductSchema.optional(),
  city: CitySchema.optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  minAmount: z.number().int().min(0).optional().describe("VND"),
  from: Month.optional(),
  to: Month.optional(),
  sample: z.number().int().min(0).max(20).default(5).describe("Số đơn mẫu (mới nhất) kèm theo, 0–20"),
});
export const FindOrdersOutputSchema = z.object({
  matched: z.number().int().describe("Tổng số đơn khớp — dùng để đếm"),
  totalAmount: z.number().int().describe("Tổng tiền các đơn khớp (mọi trạng thái đã lọc), VND"),
  sample: z.array(
    z.object({ id: z.string(), customerId: z.string(), product: z.string(), amount: z.number().int(), status: z.string(), createdAt: z.string() }),
  ),
});

// ---------- nexus_analyze_export: phân tích CSV trong thư mục export ----------
export const AnalyzeExportInputSchema = z.object({
  path: ExportPathSchema,
  groupBy: z.string().min(1).max(64).describe("Tên cột để nhóm"),
  sum: z.string().min(1).max(64).optional().describe("Tên cột số để cộng (bỏ trống = chỉ đếm)"),
  where: z.object({ column: z.string(), equals: z.string() }).optional().describe("Chỉ lấy dòng có column == equals"),
  top: z.number().int().min(1).max(30).default(20),
});
export const AnalyzeExportOutputSchema = z.object({
  path: z.string(),
  columns: z.array(z.string()),
  rowCount: z.number().int().describe("Số dòng dữ liệu đã đọc (không tính tiêu đề)"),
  matchedRows: z.number().int(),
  skippedRows: z.number().int().describe("Dòng có cột sum không phải số"),
  groups: z.array(z.object({ key: z.string(), rows: z.number().int(), sum: z.number().optional() })),
  omitted: z.number().int(),
});
```

### apps/mcp-server

`apps/mcp-server/src/orders/repository.ts`

```ts
import type { Order } from "@nexus/shared";

export type Dimension = "month" | "city" | "product";
export interface MonthRange {
  from?: string | undefined;
  to?: string | undefined;
}
export interface RevenueRow {
  key: string;
  orders: number;
  revenue: number;
}
export interface OrderFilter extends MonthRange {
  customerId?: string | undefined;
  product?: string | undefined;
  city?: string | undefined;
  status?: Order["status"] | undefined;
  minAmount?: number | undefined;
}

/** Đơn hàng (M5 · S5.2). S5.4: tổng hợp NGAY TRONG nguồn dữ liệu — tool không bao giờ kéo hết đơn về rồi tự cộng. */
export interface OrderRepository {
  /** Toàn bộ đơn — chỉ dùng cho store RAM và seed; tool không bao giờ trả thẳng kết quả này. */
  all(): Promise<readonly Order[]>;
  /** Doanh thu = đơn status "paid"; tháng tính theo giờ Việt Nam (glossary). */
  revenueBy(by: Dimension, range: MonthRange): Promise<RevenueRow[]>;
  find(filter: OrderFilter, sample: number): Promise<{ matched: number; totalAmount: number; sample: Order[] }>;
}

/** "2026-08-31T20:00:00Z" → "2026-09": tháng theo giờ Việt Nam (UTC+7, không có giờ mùa hè). */
export const vnMonth = (iso: string): string => new Date(Date.parse(iso) + 7 * 3_600_000).toISOString().slice(0, 7);

const inRange = (m: string, r: MonthRange): boolean => (r.from === undefined || m >= r.from) && (r.to === undefined || m <= r.to);

export function createMemoryOrderRepository(seed: readonly Order[]): OrderRepository {
  const rows: readonly Order[] = seed.map((o) => Object.freeze({ ...o }));
  return {
    async all() {
      return rows;
    },
    async revenueBy(by, range) {
      const groups = new Map<string, RevenueRow>();
      for (const o of rows) {
        const m = vnMonth(o.createdAt);
        if (o.status !== "paid" || !inRange(m, range)) continue;
        const key = by === "month" ? m : by === "city" ? o.city : o.product;
        const g = groups.get(key) ?? { key, orders: 0, revenue: 0 };
        g.orders += 1;
        g.revenue += o.amount;
        groups.set(key, g);
      }
      return [...groups.values()];
    },
    async find(f, sample) {
      const hit = rows.filter(
        (o) =>
          (f.customerId === undefined || o.customerId === f.customerId) &&
          (f.product === undefined || o.product === f.product) &&
          (f.city === undefined || o.city === f.city) &&
          (f.status === undefined || o.status === f.status) &&
          (f.minAmount === undefined || o.amount >= f.minAmount) &&
          inRange(vnMonth(o.createdAt), f),
      );
      const newest = [...hit].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, sample);
      return { matched: hit.length, totalAmount: hit.reduce((s, o) => s + o.amount, 0), sample: newest };
    },
  };
}
```
`apps/mcp-server/src/orders/mongo-repository.ts`

```ts
import type { Order } from "@nexus/shared";
import type { Db, Document } from "mongodb";
import type { Dimension, MonthRange, OrderFilter, OrderRepository, RevenueRow } from "./repository.ts";

type OrderDoc = Omit<Order, "id"> & { _id: string };

const TZ = "Asia/Ho_Chi_Minh";
/** Tháng theo giờ VN, tính trong DB. createdAt lưu chuỗi ISO → đổi sang Date trước. */
const MONTH_EXPR = { $dateToString: { format: "%Y-%m", date: { $dateFromString: { dateString: "$createdAt" } }, timezone: TZ } };

function monthMatch(r: MonthRange): Document[] {
  if (r.from === undefined && r.to === undefined) return [];
  return [
    { $addFields: { _month: MONTH_EXPR } },
    { $match: { _month: { ...(r.from ? { $gte: r.from } : {}), ...(r.to ? { $lte: r.to } : {}) } } },
  ];
}

/** Bản Mongo — chưa chạy ở sandbox dựng bài (không có Mongo). Index gợi ý: { status: 1, createdAt: 1 }. */
export function createMongoOrderRepository(db: Db): OrderRepository {
  const col = db.collection<OrderDoc>("orders");
  return {
    async all() {
      const docs = await col.find({}).sort({ createdAt: 1 }).toArray();
      return docs.map(({ _id, ...rest }) => ({ id: _id, ...rest }));
    },
    async revenueBy(by: Dimension, range: MonthRange) {
      const key = by === "month" ? MONTH_EXPR : by === "city" ? "$city" : "$product";
      const pipeline: Document[] = [
        { $match: { status: "paid" } }, // $match sớm để dùng index
        ...monthMatch(range),
        { $group: { _id: key, orders: { $sum: 1 }, revenue: { $sum: "$amount" } } },
        { $project: { _id: 0, key: "$_id", orders: 1, revenue: 1 } },
      ];
      return col.aggregate<RevenueRow>(pipeline, { maxTimeMS: 5_000 }).toArray();
    },
    async find(f: OrderFilter, sample: number) {
      const match: Document = {
        ...(f.customerId ? { customerId: f.customerId } : {}),
        ...(f.product ? { product: f.product } : {}),
        ...(f.city ? { city: f.city } : {}),
        ...(f.status ? { status: f.status } : {}),
        ...(f.minAmount !== undefined ? { amount: { $gte: f.minAmount } } : {}),
      };
      const [res] = await col
        .aggregate<{ total: Array<{ matched: number; totalAmount: number }>; sample: OrderDoc[] }>(
          [
            { $match: match },
            ...monthMatch(f),
            {
              $facet: {
                total: [{ $group: { _id: null, matched: { $sum: 1 }, totalAmount: { $sum: "$amount" } } }],
                sample: [{ $sort: { createdAt: -1 } }, { $limit: sample }, { $project: { _month: 0 } }],
              },
            },
          ],
          { maxTimeMS: 5_000 },
        )
        .toArray();
      const t = res?.total[0];
      return {
        matched: t?.matched ?? 0,
        totalAmount: t?.totalAmount ?? 0,
        sample: (res?.sample ?? []).map(({ _id, ...rest }) => ({ id: _id, ...rest })),
      };
    },
  };
}
```
`apps/mcp-server/src/csv/parse.ts`

```ts
/**
 * CSV theo RFC 4180: dấu phẩy, ngoặc kép bao ô, "" là 1 dấu ngoặc, xuống dòng trong ô có ngoặc (M5 · S5.4).
 * Không dùng split(","): "Cà phê, trà" là 1 ô, không phải 2.
 */
export interface Csv {
  header: string[];
  rows: string[][];
}

export function parseCsv(text: string): Csv {
  const out: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // bỏ BOM của Excel
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"' && cell === "") quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      out.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    out.push(row);
  }
  const [header = [], ...rows] = out.filter((r) => !(r.length === 1 && r[0] === ""));
  return { header: header.map((h) => h.trim()), rows };
}

/** "1.250.000", "1,250,000.5", " 42 " → số; không phải số → undefined. */
export function parseNumber(raw: string): number | undefined {
  const s = raw.trim().replace(/\s/g, "");
  if (s === "") return undefined;
  const normalized = /^\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, "") : s.replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
}
```
`apps/mcp-server/src/tools/revenue-by.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RevenueByInputSchema, RevenueByOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerRevenueBy(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.revenueBy,
    {
      title: "Doanh thu theo nhóm",
      description:
        "Tổng doanh thu (đơn đã thu tiền) theo tháng, thành phố hoặc sản phẩm — số đã cộng sẵn trong DB. " +
        "Dùng cho mọi câu hỏi \"doanh thu bao nhiêu / tháng nào cao nhất / khu vực nào\". " +
        "Đừng tự cộng từ nexus_find_orders hay nexus_query. Tháng tính theo giờ Việt Nam.",
      inputSchema: RevenueByInputSchema.shape,
      outputSchema: RevenueByOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.revenueBy, deps.log, async ({ by, from, to, top }) => {
      if (from !== undefined && to !== undefined && from > to) {
        return toolFail({ what: `Khoảng tháng ngược: from ${from} > to ${to}.`, next: "Đổi chỗ from và to." });
      }
      const groups = await deps.orders.revenueBy(by, { from, to });
      const totalRevenue = groups.reduce((s, g) => s + g.revenue, 0);
      const totalOrders = groups.reduce((s, g) => s + g.orders, 0);
      const ordered = by === "month" ? groups.sort((a, b) => a.key.localeCompare(b.key)).slice(-top) : groups.sort((a, b) => b.revenue - a.revenue).slice(0, top);
      const rows = ordered.map((g) => ({ ...g, share: totalRevenue === 0 ? 0 : Math.round((g.revenue / totalRevenue) * 1000) / 1000 }));
      return toolOk(RevenueByOutputSchema, {
        by,
        from: from ?? "*",
        to: to ?? "*",
        currency: "VND",
        totalRevenue,
        totalOrders,
        rows,
        omitted: groups.length - rows.length,
      });
    }),
  );
}
```
`apps/mcp-server/src/tools/find-orders.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FindOrdersInputSchema, FindOrdersOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolOk } from "../tool-result.ts";

export function registerFindOrders(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.findOrders,
    {
      title: "Lọc đơn hàng",
      description:
        "Lọc đơn hàng theo khách, sản phẩm, thành phố, trạng thái, số tiền, khoảng tháng. Trả SỐ ĐẾM + TỔNG TIỀN + vài đơn mẫu mới nhất, " +
        "không trả toàn bộ danh sách. Doanh thu theo nhóm thì dùng nexus_revenue_by.",
      inputSchema: FindOrdersInputSchema.shape,
      outputSchema: FindOrdersOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.findOrders, deps.log, async ({ sample, ...filter }) => {
      const r = await deps.orders.find(filter, sample);
      return toolOk(FindOrdersOutputSchema, {
        matched: r.matched,
        totalAmount: r.totalAmount,
        sample: r.sample.map(({ id, customerId, product, amount, status, createdAt }) => ({ id, customerId, product, amount, status, createdAt })),
      });
    }),
  );
}
```
`apps/mcp-server/src/tools/analyze-export.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AnalyzeExportInputSchema, AnalyzeExportOutputSchema, TOOL } from "@nexus/shared";
import path from "node:path";
import { parseCsv, parseNumber } from "../csv/parse.ts";
import type { Deps } from "../deps.ts";
import { readHead, resolveExisting } from "../files/safe-path.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

const MAX_CSV_BYTES = 5_000_000;

export function registerAnalyzeExport(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.analyzeExport,
    {
      title: "Phân tích file CSV",
      description:
        "Đếm / cộng 1 file CSV trong thư mục export theo 1 cột (group by), có thể lọc 1 cột bằng 1 giá trị. " +
        "Trả bảng tổng hợp, KHÔNG trả dòng dữ liệu thô. Dùng thay cho nexus_read_export khi cần con số từ CSV.",
      inputSchema: AnalyzeExportInputSchema.shape,
      outputSchema: AnalyzeExportOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.analyzeExport, deps.log, async ({ path: userPath, groupBy, sum, where, top }) => {
      const r = await resolveExisting(deps.exportsDir, userPath);
      if (!r.ok) {
        if (r.reason === "outside") deps.log.warn("export path denied", { path: userPath, detail: r.detail });
        return toolFail({ what: `Không đọc được "${userPath}".`, next: "Chỉ dùng path do nexus_list_exports trả về." });
      }
      if (path.extname(r.rel).toLowerCase() !== ".csv") return toolFail({ what: `"${userPath}" không phải .csv.`, next: "Chọn 1 file .csv từ nexus_list_exports." });
      const head = await readHead(r.path, MAX_CSV_BYTES);
      if (head.truncated) return toolFail({ what: `File lớn hơn ${MAX_CSV_BYTES / 1e6} MB.`, next: "Báo người dùng tách file hoặc nhập vào hệ thống." });
      const csv = parseCsv(head.text);
      const col = (name: string): number => csv.header.indexOf(name);
      const missing = [groupBy, ...(sum ? [sum] : []), ...(where ? [where.column] : [])].filter((c) => col(c) < 0);
      if (missing.length > 0) return toolFail({ what: `Không có cột: ${missing.join(", ")}.`, next: `Cột có trong file: ${csv.header.join(", ")}.` });

      const gi = col(groupBy);
      const si = sum ? col(sum) : -1;
      const wi = where ? col(where.column) : -1;
      const groups = new Map<string, { key: string; rows: number; sum: number }>();
      let matchedRows = 0;
      let skippedRows = 0;
      for (const row of csv.rows) {
        if (where && (row[wi] ?? "") !== where.equals) continue;
        matchedRows++;
        const key = row[gi] ?? "";
        const g = groups.get(key) ?? { key, rows: 0, sum: 0 };
        g.rows++;
        if (si >= 0) {
          const n = parseNumber(row[si] ?? "");
          if (n === undefined) skippedRows++;
          else g.sum += n;
        }
        groups.set(key, g);
      }
      const sorted = [...groups.values()].sort((a, b) => (si >= 0 ? b.sum - a.sum : b.rows - a.rows));
      const kept = sorted.slice(0, top).map((g) => (si >= 0 ? g : { key: g.key, rows: g.rows }));
      return toolOk(AnalyzeExportOutputSchema, {
        path: r.rel,
        columns: csv.header,
        rowCount: csv.rows.length,
        matchedRows,
        skippedRows,
        groups: kept,
        omitted: sorted.length - kept.length,
      });
    }),
  );
}
```
`apps/mcp-server/scripts/seed-exports.ts`

```ts
// node scripts/seed-exports.ts — tạo vài file "kế toán tải lên" trong thư mục export để thử S5.1/S5.4.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { seedCustomers } from "../src/customers/seed-data.ts";
import { loadEnv } from "../src/env.ts";
import { seedOrders } from "../src/orders/seed-data.ts";
import { vnMonth } from "../src/orders/repository.ts";

const dir = loadEnv().NEXUS_EXPORT_DIR;
const customers = seedCustomers();
const byId = new Map<string, string>(customers.map((c) => [c.id, c.name]));
const orders = seedOrders(customers);
const NOTES = ["", "Gia hạn, có VAT", 'Khách nói "gấp"', "Chuyển khoản\nngày 2"];
const q = (s: string): string => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
const vnd = (n: number): string => n.toLocaleString("de-DE"); // 1.250.000 — kiểu kế toán VN hay xuất

const lines = ["ma_don,khach_hang,san_pham,so_tien,trang_thai,thanh_pho,thang,ghi_chu"];
orders.forEach((o, i) => {
  const name = byId.get(o.customerId) ?? "";
  lines.push([o.id, i % 5 === 0 ? `${name}, chi nhánh 2` : name, o.product, vnd(o.amount), o.status, o.city, vnMonth(o.createdAt), NOTES[i % NOTES.length] ?? ""].map(q).join(","));
});
await mkdir(path.join(dir, "2026-09"), { recursive: true });
await writeFile(path.join(dir, "2026-09", "don-hang.csv"), `﻿${lines.join("\r\n")}\r\n`);
await writeFile(path.join(dir, "2026-09", "ghi-chu.md"), "# Ghi chú tháng 9\n\nĐã đối soát xong 600 đơn.\n");
console.log(`đã ghi ${orders.length} dòng vào ${path.relative(process.cwd(), path.join(dir, "2026-09", "don-hang.csv"))}`);
```
`apps/mcp-server/scripts/size-audit.ts`

```ts
// pnpm size-audit — gọi MỌI tool với tham số xấu nhất trên dữ liệu lớn, đo phần host đưa vào context. Thoát 1 nếu tool nào > ngân sách.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { TOOL, type ToolName } from "@nexus/shared";
import { Tiktoken } from "js-tiktoken/lite";
import o200k from "js-tiktoken/ranks/o200k_base";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { createMemoryCustomerRepository } from "../src/customers/memory-repository.ts";
import { seedCustomers } from "../src/customers/seed-data.ts";
import { helpdeskFromEnv, memoryQueryStore, type Deps } from "../src/deps.ts";
import { openRoot } from "../src/files/safe-path.ts";
import { createLogger } from "../src/log.ts";
import { createMemoryOrderRepository } from "../src/orders/repository.ts";
import { createMemoryTaskRepository } from "../src/tasks/memory-repository.ts";
import { seedTasks } from "../src/tasks/seed-data.ts";
import { seedOrders } from "../src/orders/seed-data.ts";
import { createRatesClient } from "../src/rates/client.ts";
import { createServer } from "../src/server.ts";
import { startHelpdeskStub } from "./stub/helpdesk.ts";

const BUDGET = 25_000; // token / 1 kết quả tool (roadmap M5 · S5.4)
const enc = new Tiktoken(o200k); // ước lượng: tokenizer o200k_base, không phải tokenizer của mọi model

// ---------- dữ liệu xấu nhất: lớn hơn dữ liệu mẫu hàng trăm lần ----------
const seed = seedCustomers(10_000);
const customers = createMemoryCustomerRepository(seed);
const orders = createMemoryOrderRepository(seedOrders(seed, 50_000));
const tasks = createMemoryTaskRepository(seedTasks(100_000));
const exportsDir = await openRoot(path.join(await mkdtemp(path.join(tmpdir(), "nexus-audit-")), "exports"));
await mkdir(path.join(exportsDir, "bulk"), { recursive: true });
for (let i = 0; i < 300; i++) await writeFile(path.join(exportsDir, "bulk", `bao-cao-${String(i).padStart(3, "0")}.txt`), "x");
await writeFile(path.join(exportsDir, "dai.txt"), "Nội dung rất dài có dấu tiếng Việt. ".repeat(20_000));
const csv = ["ma,nhom,so_tien", ...Array.from({ length: 20_000 }, (_, i) => `r${i},nhom-${i},${(i % 97) * 1000}`)].join("\n");
await writeFile(path.join(exportsDir, "lon.csv"), csv);
const stub = await startHelpdeskStub({ port: 0, token: "t", capacity: 1_000, refillPerSec: 1_000 });
const log = createLogger("error");

const deps: Deps = {
  log,
  customers,
  orders,
  tasks,
  query: memoryQueryStore(customers, orders, tasks),
  rates: createRatesClient("http://127.0.0.1:9", 300),
  exportsDir,
  helpdesk: helpdeskFromEnv({ HELPDESK_URL: `http://127.0.0.1:${(stub.server.address() as AddressInfo).port}`, HELPDESK_TOKEN: "t" }, log),
  close: async () => undefined,
};

/** Record<ToolName, …>: thêm tool mới mà quên kịch bản xấu nhất → lỗi compile, không phải quên âm thầm. */
const WORST: Record<ToolName, Record<string, unknown>> = {
  [TOOL.ping]: {},
  [TOOL.getTime]: {},
  [TOOL.listCustomers]: { limit: 50 },
  [TOOL.getCustomer]: { id: "cus_001" },
  [TOOL.getExchangeRate]: { from: "USD" },
  [TOOL.chartCustomersByCity]: {},
  [TOOL.updateCustomerTier]: { id: "cus_002", tier: "enterprise" },
  [TOOL.deleteCustomer]: { id: "cus_003" },
  [TOOL.generateReport]: {},
  [TOOL.searchCustomers]: { query: "khach", limit: 100 },
  [TOOL.listExports]: {},
  [TOOL.readExport]: { path: "dai.txt", maxBytes: 32_000 },
  [TOOL.exportCustomers]: { filename: "tat-ca.csv" },
  [TOOL.query]: { collection: "customers", filter: {}, limit: 50 },
  [TOOL.listTickets]: { limit: 50 },
  [TOOL.createTicket]: { customerId: "cus_001", subject: "Kiểm tra kích thước", body: "x".repeat(2_000) },
  [TOOL.revenueBy]: { by: "month", top: 24 },
  [TOOL.findOrders]: { sample: 20 },
  [TOOL.analyzeExport]: { path: "lon.csv", groupBy: "nhom", sum: "so_tien", top: 30 },
  [TOOL.listTasks]: { limit: 50 },
  [TOOL.createTask]: { title: "Kiểm tra kích thước ".repeat(6).trim(), assignee: "lan", customerId: "cus_001", dueDate: "2026-12-31" },
  [TOOL.updateTask]: { id: "task_0001", status: "done", assignee: "minh", dueDate: null },
  [TOOL.deleteTask]: { id: "task_0002" },
};

/** Đúng cách host Nexus web (M4) ghép kết quả tool thành chuỗi cho LLM. */
function toText(r: CallToolResult): { text: string; images: number } {
  let images = 0;
  const text = r.content
    .map((c) => {
      if (c.type === "text") return c.text;
      if (c.type === "resource_link") return `[resource_link] ${c.uri} ${c.title ?? c.name}`;
      if (c.type === "image") {
        images++;
        return "[image]";
      }
      return `[${c.type}]`;
    })
    .join("\n");
  return { text, images };
}

const server = createServer(deps);
const [ct, st] = InMemoryTransport.createLinkedPair();
await server.connect(st);
const client = new Client({ name: "size-audit", version: "1.0.0" });
await client.connect(ct);

const { tools } = await client.listTools();
console.log(`dữ liệu: ${seed.length} khách · 50000 đơn · 100000 việc · 301 file export · CSV 20000 dòng · 40 ticket · ngân sách ${BUDGET} token`);
console.log(`${"tool".padEnd(32)} ${"ký tự".padStart(7)} ${"token".padStart(7)} ${"+structured".padStart(12)}  kết luận`);
let over = 0;
const rows: Array<[string, number, number, number, string]> = [];
for (const t of tools) {
  const args = WORST[t.name as ToolName];
  const r = (await client.callTool({ name: t.name, arguments: args })) as CallToolResult;
  const { text, images } = toText(r);
  const tokens = enc.encode(text).length;
  const both = tokens + (r.structuredContent ? enc.encode(JSON.stringify(r.structuredContent)).length : 0);
  const ok = both <= BUDGET;
  if (!ok) over++;
  rows.push([t.name, text.length, tokens, both, `${ok ? "✓" : "✗ VƯỢT"}${r.isError ? " (isError)" : ""}${images ? ` + ${images} ảnh` : ""}`]);
}
rows.sort((a, b) => b[3] - a[3]);
for (const [name, chars, tokens, both, verdict] of rows) {
  console.log(`${name.padEnd(32)} ${String(chars).padStart(7)} ${String(tokens).padStart(7)} ${String(both).padStart(12)}  ${verdict}`);
}
await client.close();
stub.server.close();
console.log(over === 0 ? `OK: ${tools.length} tool, lớn nhất ${rows[0]?.[3]} token` : `${over} tool vượt ngân sách`);
process.exit(over === 0 ? 0 : 1);
```

### lesson-code

`lesson-code/m5/traps/raw-orders.ts`

```ts
// Bẫy 1 (S5.4) — dịch thẳng "GET /orders": tool trả danh sách đơn, để LLM tự đếm/cộng.
import { Tiktoken } from "js-tiktoken/lite";
import o200k from "js-tiktoken/ranks/o200k_base";
import { seedCustomers } from "../../../nexus/apps/mcp-server/src/customers/seed-data.ts";
import { seedOrders } from "../../../nexus/apps/mcp-server/src/orders/seed-data.ts";
import { createMemoryOrderRepository } from "../../../nexus/apps/mcp-server/src/orders/repository.ts";

const enc = new Tiktoken(o200k);
const listOrdersNaive = (orders: readonly object[]): string => JSON.stringify({ items: orders });

for (const n of [600, 50_000]) {
  const orders = seedOrders(seedCustomers(), n);
  const text = listOrdersNaive(orders);
  console.log(`${String(n).padStart(6)} đơn → ${text.length.toLocaleString("en")} ký tự · ${enc.encode(text).length.toLocaleString("en")} token`);
}

// "Thì cắt còn 50 cho vừa context" — rồi LLM cộng 50 dòng đó
const all = seedOrders(seedCustomers(), 600);
const first50 = all.slice(0, 50).filter((o) => o.status === "paid").reduce((s, o) => s + o.amount, 0);
const real = (await createMemoryOrderRepository(all).revenueBy("month", {})).reduce((s, g) => s + g.revenue, 0);
console.log(`\ncắt còn 50 đơn đầu, LLM cộng: ${first50.toLocaleString("vi-VN")} VND`);
console.log(`nexus_revenue_by (cộng trong nguồn): ${real.toLocaleString("vi-VN")} VND — lệch ${Math.round((1 - first50 / real) * 100)}%`);
```
`lesson-code/m5/traps/csv-split.ts`

```ts
// Bẫy 2 (S5.4) — đọc CSV bằng split(","): ô có dấu phẩy / xuống dòng trong ngoặc kép làm lệch cột.
import { readFile } from "node:fs/promises";
import { parseCsv, parseNumber } from "../../../nexus/apps/mcp-server/src/csv/parse.ts";

const FILE = new URL("../../../nexus/apps/mcp-server/var/exports/2026-09/don-hang.csv", import.meta.url);
const text = await readFile(FILE, "utf8").catch(() => {
  console.log("chưa có file — chạy trước: (cd nexus/apps/mcp-server && node scripts/seed-exports.ts)");
  process.exit(1);
});

function naive(t: string): { rows: number; sums: Map<string, number> } {
  const [head = "", ...lines] = t.trim().split("\n");
  const cols = head.split(",");
  const pi = cols.indexOf("san_pham");
  const si = cols.indexOf("so_tien");
  const sums = new Map<string, number>();
  for (const line of lines) {
    const cells = line.split(",");
    sums.set(cells[pi] ?? "?", (sums.get(cells[pi] ?? "?") ?? 0) + (parseNumber(cells[si] ?? "") ?? 0));
  }
  return { rows: lines.length, sums };
}

const n = naive(text);
const csv = parseCsv(text);
const ok = new Map<string, number>();
const pi = csv.header.indexOf("san_pham");
const si = csv.header.indexOf("so_tien");
for (const r of csv.rows) ok.set(r[pi] ?? "?", (ok.get(r[pi] ?? "?") ?? 0) + (parseNumber(r[si] ?? "") ?? 0));

console.log(`số dòng dữ liệu: split = ${n.rows} · parseCsv = ${csv.rows.length}`);
console.log(`${"san_pham".padEnd(16)} ${"split(\",\")".padStart(16)} ${"parseCsv".padStart(16)}`);
for (const [k, v] of [...ok].sort((a, b) => b[1] - a[1])) {
  console.log(`${k.padEnd(16)} ${(n.sums.get(k) ?? 0).toLocaleString("vi-VN").padStart(16)} ${v.toLocaleString("vi-VN").padStart(16)}`);
}
const junk = [...n.sums.keys()].filter((k) => !ok.has(k));
console.log(`split tạo thêm ${junk.length} "sản phẩm" rác, ví dụ: ${junk.slice(0, 3).map((k) => JSON.stringify(k)).join(", ")}`);
console.log(`và nếu dùng Number() cho cột tiền: Number("1.250.000") = ${Number("1.250.000")}`);
```
`lesson-code/m5/traps/utc-month.ts`

```ts
// Bẫy 3 (S5.4) — nhóm theo tháng bằng createdAt.slice(0, 7): tháng UTC, không phải tháng Việt Nam.
import { seedCustomers } from "../../../nexus/apps/mcp-server/src/customers/seed-data.ts";
import { seedOrders } from "../../../nexus/apps/mcp-server/src/orders/seed-data.ts";
import { vnMonth } from "../../../nexus/apps/mcp-server/src/orders/repository.ts";

const paid = seedOrders(seedCustomers()).filter((o) => o.status === "paid");
const count = (key: (iso: string) => string): Map<string, number> => {
  const m = new Map<string, number>();
  for (const o of paid) m.set(key(o.createdAt), (m.get(key(o.createdAt)) ?? 0) + o.amount);
  return m;
};
const utc = count((iso) => iso.slice(0, 7));
const vn = count(vnMonth);
console.log(`${"tháng".padEnd(8)} ${"UTC slice(0,7)".padStart(16)} ${"giờ VN".padStart(16)}`);
for (const k of [...new Set([...utc.keys(), ...vn.keys()])].sort()) {
  const a = utc.get(k) ?? 0;
  const b = vn.get(k) ?? 0;
  if (a !== b) console.log(`${k.padEnd(8)} ${a.toLocaleString("vi-VN").padStart(16)} ${b.toLocaleString("vi-VN").padStart(16)}`);
}
const moved = paid.filter((o) => o.createdAt.slice(0, 7) !== vnMonth(o.createdAt));
console.log(`${moved.length}/${paid.length} đơn đã thu bị xếp sai tháng; ví dụ ${moved[0]?.id} lúc ${moved[0]?.createdAt} là ${moved[0] ? vnMonth(moved[0].createdAt) : ""} ở Việt Nam`);
```
`lesson-code/m5/patterns/order-report.direct.ts`

```ts
// Dịch thẳng từ C#: service trả List<OrderDto>, tool serialize nguyên danh sách, "AI tự tổng hợp".
export interface OrderDto {
  id: string;
  customerId: string;
  product: string;
  amount: number;
  status: string;
  city: string;
  createdAt: string;
}

export interface IOrderService {
  getOrders(from?: string, to?: string): Promise<OrderDto[]>;
}

export class OrdersToolHandler {
  private readonly service: IOrderService;
  constructor(service: IOrderService) {
    this.service = service;
  }
  async handle(from?: string, to?: string): Promise<{ content: Array<{ type: "text"; text: string }> }> {
    const orders = await this.service.getOrders(from, to);
    // "Trả đủ dữ liệu cho AI linh hoạt" — 600 đơn hôm nay, 50 000 đơn năm sau
    return { content: [{ type: "text", text: JSON.stringify(orders) }] };
  }
}
```

---

## S5.5 — CRUD đầy đủ & pagination

Mục tiêu: thiết kế bộ tool theo **việc người dùng làm** chứ không bê nguyên REST controller, và duyệt danh sách dài bằng cursor sao cho đủ 1000/1000 bản ghi, không trùng, không sót — kể cả khi dữ liệu bị thêm/xóa giữa lúc duyệt.

### C# → TS/Node

| Khái niệm C# | Tương đương TS/Node | Khác ở đâu |
|---|---|---|
| `Skip((page - 1) * size).Take(size)` + `TotalCount` | Keyset (phân trang theo giá trị khóa của bản ghi cuối) `(createdAt, id) > after`, lấy `limit + 1` | Không đếm tổng mỗi trang; thêm/xóa giữa chừng không làm trùng hay sót |
| `ContinuationToken` (Cosmos DB), `Pageable<T>` (Azure SDK) | `nextCursor` base64url mờ | Model chỉ chép lại nguyên văn — không tự tính “trang 3” |
| `PagedResult { Page, TotalPages }` | `{ items, hasMore, nextCursor? }` | Hết trang = **không có** `nextCursor` — cùng quy ước phân trang của chính MCP (`tools/list`, `resources/list`) |
| `TasksController`: GET/POST/PUT/PATCH/DELETE → 1 tool mỗi action | 4 tool theo việc: liệt kê, giao, cập nhật, xóa | “Hoàn thành”, “giao lại”, “dời hạn” cùng là `nexus_update_task` |
| `JsonPatchDocument<T>` | Field tùy chọn + `.refine` “ít nhất 1 thay đổi” | Model không phải viết `op` / `path` / `value` |
| `IValidatableObject.Validate` | `.refine` trên `z.object` — truyền **cả object** vào `inputSchema` | `.shape` làm rơi `.refine` (Bẫy 3) |
| `Guid TaskId` | `TaskId` branded (`task_0042`) | Id thô vào repository là lỗi compile (Bẫy 4) |
| Index `(CreatedAt, Id)` | `{ createdAt: 1, _id: 1 }` | Keyset không có index = quét cả collection mỗi trang |

### Lab

#### Lab C50 — 27 Task Management Server · 28 Pagination

**Mục tiêu:** Lab 27 cho server một bộ CRUD đầy đủ và cân nhắc độ phủ API với thiết kế theo workflow; Lab 28 cắt 1000 bản ghi bằng cursor và báo đúng cách khi không còn trang sau.

- [ ] Lab 27 xanh.
- [ ] Lab 28 xanh.

**Lệnh nghiệm thu** (repo C50 — chưa chạy ở sandbox dựng bài):

```console
$ npm run check
```

Cần nắm để tự làm:

- Lab 27: đủ tạo / đọc / sửa / xóa là yêu cầu tối thiểu. Câu Review “độ phủ API vs thiết kế workflow”: model chọn tool theo **description**; 7 tool gần giống nhau làm nó chọn sai. Gom thao tác theo việc người dùng nói (“đánh dấu xong”, “giao cho Minh”), và tool xóa phải có annotation phá hủy (M3).
- Lab 28: cursor là chuỗi **mờ** mã hóa vị trí, không phải số trang trần. Sắp xếp phải **ổn định và duy nhất** — nếu khóa sắp xếp có thể trùng (thời điểm tạo), thêm khóa phụ.
- Câu Review “báo không còn trang sau”: xem cách chính spec MCP báo hết trang cho `tools/list` / `resources/list` — harness thường kiểm đúng quy ước đó.
- Cursor rác hoặc cursor cũ → lỗi rõ ràng, không lặng lẽ trả trang đầu (M6 · Lab 34 đi sâu: không hợp lệ vs hết hạn).

#### Lab Nexus S5.5 — `tasks`: 4 tool + cursor

**Mục tiêu:** việc nội bộ của team (gọi lại khách, gửi báo giá…) với 4 tool theo workflow; `nexus_list_tasks` lọc theo trạng thái / người / khách / hạn và phân trang bằng keyset cursor; `nexus_query` truy vấn được `tasks`.

- [ ] `node scripts/page-all.ts` → `28 trang`, `trang cuối có nextCursor: false`; `✓ … nhận 1000 · trùng 0 · sót 0`; lọc `lan`/`todo` khớp `nexus_query matched`; `✓ 3 · xóa 6 + tạo 4 giữa chừng … trùng 0 · sót 0`; cursor bị sửa và cursor của bộ lọc khác → `isError`.
- [ ] Duyệt đủ 1.000 bản ghi qua cursor, không trùng, không sót (roadmap).
- [ ] `nexus_update_task` không kèm thay đổi nào → `-32602 … cần ít nhất 1 thay đổi`.
- [ ] `nexus_delete_task` có `destructiveHint: true`; description chỉ sang `nexus_update_task status=done` cho việc đã xong.
- [ ] `nexus_query` truy vấn được `collection: "tasks"`; field `tasks` có trong `nexus://schema`.
- [ ] `pnpm check` xanh; smoke có dòng `✓ nexus_list_tasks qua cursor → 1000 việc`.

**Lệnh nghiệm thu:**

```console
$ cd apps/mcp-server && node scripts/page-all.ts
$ node scripts/call.ts nexus_update_task '{"id":"task_0002"}'
$ cd ../.. && pnpm check
```

**Gợi ý hướng làm:** `packages/shared/src/task.ts` → `tasks/repository.ts` (hợp đồng + `afterKey`/`byKey`) → bản RAM + seed 1000 việc (5 việc/1 thời điểm) → `tasks/cursor.ts` → 4 tool → thêm `"tasks"` vào `QUERY_COLLECTIONS` rồi để tsc dẫn đường → `scripts/page-all.ts`.

Output thật — 5 lời gọi:

```console
$ node scripts/call.ts nexus_list_tasks '{"assignee":"lan","status":"todo","dueBefore":"2026-07-15","limit":2}'
{"returned":2,"items":[{"id":"task_0006","title":"Gọi lại cus_006","status":"todo","assignee":"lan","customerId":"cus_006","dueDate":"2026-07-06","createdAt":"2026-07-01T00:01:00.000Z","updatedAt":"2026-07-01T00:01:00.000Z"},{"id":"task_0011","title":"Gọi lại cus_011","status":"todo","assignee":"lan","customerId":"cus_011","dueDate":"2026-07-11","createdAt":"2026-07-01T00:02:00.000Z","updatedAt":"2026-07-01T00:02:00.000Z"}],"hasMore":true,"nextCursor":"eyJ2IjoxLCJjIjoiMjAyNi0wNy0wMVQwMDowMjowMC4wMDBaIiwiaSI6InRhc2tfMDAxMSIsImYiOiJrdDE4MFhkLXFKNzUifQ"}
$ node scripts/call.ts nexus_create_task '{"title":"Gọi lại khách về hóa đơn tháng 9","assignee":"lan","customerId":"cus_007","dueDate":"2026-10-06"}'
{"task":{"id":"task_1001","title":"Gọi lại khách về hóa đơn tháng 9","status":"todo","assignee":"lan","customerId":"cus_007","dueDate":"2026-10-06","createdAt":"2026-10-03T18:52:55.867Z","updatedAt":"2026-10-03T18:52:55.867Z"}}
$ node scripts/call.ts nexus_update_task '{"id":"task_0002","status":"done","dueDate":null}'
{"task":{"id":"task_0002","title":"Gửi báo giá cho cus_002","status":"done","assignee":"minh","customerId":"cus_002","dueDate":null,"createdAt":"2026-07-01T00:00:00.000Z","updatedAt":"2026-10-03T18:52:56.507Z"},"changed":["status","dueDate"]}
$ node scripts/call.ts nexus_update_task '{"id":"task_0002"}'
[isError] MCP error -32602: Input validation error: Invalid arguments for tool nexus_update_task: cần ít nhất 1 thay đổi: status, assignee, dueDate hoặc title
$ node scripts/call.ts nexus_delete_task '{"id":"task_9999"}'
[isError] Không có việc task_9999 để xóa. Tìm id bằng nexus_list_tasks.
```

Output thật — duyệt qua server thật (stdio), có xóa/tạo chen vào giữa:

```console
$ node scripts/page-all.ts
1 · không lọc, limit 37: 28 trang · 77 ms · trang cuối có nextCursor: false
✓    so với 1000 id task_0001…task_1000: nhận 1000 · trùng 0 · sót 0
2 · lọc {"assignee":"lan","status":"todo"}: 12 trang · 114 việc · nexus_query matched = 114
✓ 3 · xóa 6 + tạo 4 giữa chừng (limit 50): nhận 1001 · trùng 0 · sót 0
4 · cursor bị sửa 1 ký tự → [isError] cursor không hợp lệ. Chép nguyên văn nextCursor của trang trước, hoặc bỏ cursor để bắt đầu từ trang đầu.
    cursor của bộ lọc khác  → [isError] cursor này thuộc một bộ lọc khác. Gọi lại với đúng bộ lọc của trang trước, hoặc bỏ cursor để bắt đầu từ trang đầu.
    nextCursor trông thế này: eyJ2IjoxLCJjIjoiMjAyNi0wNy0wMVQwMDowMTowMC4wMDBaIiwiaSI6InRhc2tfMDAwNiIsImYiOiJiTmpPeHdiNkVSRU4ifQ
```

Output thật — `pnpm check` sau cả module (typecheck 2 package → smoke → attack → page-all → size-audit):

```console
$ pnpm check

> nexus@ check /home/claude/nexus
> pnpm typecheck && pnpm smoke && pnpm verify


> nexus@ typecheck /home/claude/nexus
> pnpm -r typecheck

Scope: 2 of 3 workspace projects
packages/shared typecheck$ tsc -p tsconfig.json
packages/shared typecheck: Done
apps/mcp-server typecheck$ tsc -p tsconfig.json
apps/mcp-server typecheck: Done

> nexus@ smoke /home/claude/nexus
> pnpm --filter @nexus/mcp-server smoke


> @nexus/mcp-server@ smoke /home/claude/nexus/apps/mcp-server
> node scripts/smoke.ts

tools (23): nexus_ping, nexus_get_time, nexus_list_customers, nexus_get_customer, nexus_get_exchange_rate, nexus_chart_customers_by_city, nexus_update_customer_tier, nexus_delete_customer, nexus_generate_report, nexus_search_customers, nexus_list_exports, nexus_read_export, nexus_export_customers, nexus_query, nexus_list_tickets, nexus_create_ticket, nexus_revenue_by, nexus_find_orders, nexus_analyze_export, nexus_list_tasks, nexus_create_task, nexus_update_task, nexus_delete_task
✓ mọi tool có outputSchema
✓ mọi tool có readOnlyHint
✓ nexus_list_customers Hà Nội → total 12
✓ resources/list (33) có nexus://docs/glossary
✓ resources/read glossary → 861 ký tự
✓ prompts/get nexus_weekly_summary → 2 message
✓ subscribe cus_007 + đổi gói → updated
✓ unsubscribe → im lặng
✓ nexus_read_export ../../etc/passwd → bị chặn
✓ nexus_query $where → bị từ chối
✓ nexus_revenue_by product → tổng 9.072.400.000
✓ nexus_list_tasks qua cursor → 1000 việc
✓ resources/list có nexus://schema
smoke: OK

> nexus@ verify /home/claude/nexus
> pnpm --filter @nexus/mcp-server verify


> @nexus/mcp-server@ verify /home/claude/nexus/apps/mcp-server
> node scripts/attack-export.ts && node scripts/page-all.ts && node scripts/size-audit.ts

thư mục cho phép: <tmp>/exports · 12 kiểu tấn công đọc + 2 kiểu tấn công ghi

✓ chặn  cổ điển          "../../../../../../etc/passwd"                   → -32602 schema
✓ chặn  tuyệt đối        "/etc/passwd"                                    → -32602 schema
✓ chặn  mã hóa %2F       "..%2F..%2F..%2F..%2F..%2F..%2Fetc%2Fpasswd"     → -32602 schema
✓ chặn  mã hóa %2e       "%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/etc/passwd"  → -32602 schema
✓ chặn  mã hóa 2 lần     "..%252f..%252fetc%252fpasswd"                   → -32602 schema
✓ chặn  ....//           "....//....//etc/passwd"                         → -32602 schema
✓ chặn  backslash        "..\\..\\secret.env"                             → -32602 schema
✓ chặn  đi vào rồi ra    "2026-09/../../secret.env"                       → -32602 schema
✓ chặn  thư mục anh em   "../exports-evil/secret.txt"                     → -32602 schema
✓ chặn  NUL byte         "bao-cao.md\u0000.png"                           → -32602 schema
✓ chặn  symlink file     "link-secret.txt"                                → isError
✓ chặn  symlink thư mục  "linkdir/passwd"                                 → isError
✓ chặn  ghi ra ngoài     {"filename":"../../tmp/x.csv"}                   → -32602 schema
✓ chặn  ghi đè symlink   {"filename":"khach.csv","overwrite":true}        → isError: Không ghi được "khach.csv". Chọn tên file khác.
✓ secret.env không bị ghi đè
✓ hợp lệ  đường thường     "2026-09/doanh-thu.csv"                          → ĐỌC ĐƯỢC: "thang,doanh_thu\n2026-09,1250000000\n"

OK: 0 lọt
1 · không lọc, limit 37: 28 trang · 79 ms · trang cuối có nextCursor: false
✓    so với 1000 id task_0001…task_1000: nhận 1000 · trùng 0 · sót 0
2 · lọc {"assignee":"lan","status":"todo"}: 12 trang · 114 việc · nexus_query matched = 114
✓ 3 · xóa 6 + tạo 4 giữa chừng (limit 50): nhận 1001 · trùng 0 · sót 0
4 · cursor bị sửa 1 ký tự → [isError] cursor không hợp lệ. Chép nguyên văn nextCursor của trang trước, hoặc bỏ cursor để bắt đầu từ trang đầu.
    cursor của bộ lọc khác  → [isError] cursor này thuộc một bộ lọc khác. Gọi lại với đúng bộ lọc của trang trước, hoặc bỏ cursor để bắt đầu từ trang đầu.
    nextCursor trông thế này: eyJ2IjoxLCJjIjoiMjAyNi0wNy0wMVQwMDowMTowMC4wMDBaIiwiaSI6InRhc2tfMDAwNiIsImYiOiJiTmpPeHdiNkVSRU4ifQ
dữ liệu: 10030 khách · 50000 đơn · 100000 việc · 301 file export · CSV 20000 dòng · 40 ticket · ngân sách 25000 token
tool                               ký tự   token  +structured  kết luận
nexus_read_export                  24084    6027        12054  ✓
nexus_list_tasks                   10511    4127         8254  ✓
nexus_list_exports                  8022    3304         6608  ✓
nexus_query                         7485    2886         5772  ✓
nexus_search_customers              6515    1897         4605  ✓
nexus_list_tickets                  5904    2093         4186  ✓
nexus_list_customers                3847    1309         2618  ✓
nexus_find_orders                   2807    1016         2032  ✓
nexus_analyze_export                1351     546         1092  ✓
nexus_revenue_by                    1000     377          754  ✓
nexus_create_task                    316     113          226  ✓
nexus_update_task                    221      84          168  ✓
nexus_generate_report                142      62          124  ✓
nexus_get_customer                   142      58          116  ✓
nexus_create_ticket                  171      58          116  ✓
nexus_get_time                       114      53          106  ✓
nexus_ping                            45      23           46  ✓
nexus_chart_customers_by_city         79      44           44  ✓ + 1 ảnh
nexus_update_customer_tier            73      20           40  ✓
nexus_export_customers                49      17           34  ✓
nexus_get_exchange_rate              101      30           30  ✓ (isError)
nexus_delete_task                     33      12           24  ✓
nexus_delete_customer                 31      11           22  ✓
OK: 23 tool, lớn nhất 12054 token
```

<details>
<summary>Xem sau khi làm xong — lời giải Lab Nexus S5.5</summary>

`apps/mcp-server/src/tasks/cursor.ts`

```ts
import { createHash } from "node:crypto";
import { z } from "zod";
import type { TaskFilter, TaskKey } from "./repository.ts";

/**
 * Cursor mờ (opaque) cho keyset pagination (M5 · S5.5).
 * Bên trong: vị trí cuối trang trước + dấu vân tay của bộ lọc. Model chỉ việc chép nguyên văn.
 * Không phải số trang/offset: chèn/xóa giữa chừng không làm trùng hay sót bản ghi còn tồn tại.
 * (M6 · S6.4 thêm hạn dùng + chữ ký để phân biệt cursor hết hạn với cursor bị sửa.)
 */
const CursorBody = z.object({ v: z.literal(1), c: z.string(), i: z.string(), f: z.string() });

export function filterFingerprint(f: TaskFilter): string {
  const stable = JSON.stringify([f.status ?? null, f.assignee ?? null, f.customerId ?? null, f.dueBefore ?? null]);
  return createHash("sha256").update(stable).digest("base64url").slice(0, 12);
}

export function encodeCursor(last: TaskKey, f: TaskFilter): string {
  return Buffer.from(JSON.stringify({ v: 1, c: last.createdAt, i: last.id, f: filterFingerprint(f) })).toString("base64url");
}

export type Decoded = { ok: true; after: TaskKey } | { ok: false; reason: "malformed" | "other_filter" };

export function decodeCursor(raw: string, f: TaskFilter): Decoded {
  let body: unknown;
  try {
    body = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  const p = CursorBody.safeParse(body);
  if (!p.success) return { ok: false, reason: "malformed" };
  if (p.data.f !== filterFingerprint(f)) return { ok: false, reason: "other_filter" };
  return { ok: true, after: { createdAt: p.data.c, id: p.data.i } };
}
```
`apps/mcp-server/src/tools/list-tasks.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListTasksInputSchema, ListTasksOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { decodeCursor, encodeCursor } from "../tasks/cursor.ts";
import { keyOf } from "../tasks/repository.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerListTasks(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.listTasks,
    {
      title: "Danh sách việc",
      description:
        "Việc nội bộ, lọc theo trạng thái, người phụ trách, khách, hạn (dueBefore cho \"việc quá hạn\"). Trả theo trang. " +
        "hasMore=true thì gọi lại với cursor = nextCursor và GIỮ NGUYÊN bộ lọc; hasMore=false là hết, không gọi tiếp.",
      inputSchema: ListTasksInputSchema.shape,
      outputSchema: ListTasksOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.listTasks, deps.log, async ({ cursor, limit, ...filter }) => {
      let after;
      if (cursor !== undefined) {
        const d = decodeCursor(cursor, filter);
        if (!d.ok) {
          return d.reason === "other_filter"
            ? toolFail({ what: "cursor này thuộc một bộ lọc khác.", next: "Gọi lại với đúng bộ lọc của trang trước, hoặc bỏ cursor để bắt đầu từ trang đầu." })
            : toolFail({ what: "cursor không hợp lệ.", next: "Chép nguyên văn nextCursor của trang trước, hoặc bỏ cursor để bắt đầu từ trang đầu." });
        }
        after = d.after;
      }
      const page = await deps.tasks.page(filter, after, limit);
      const last = page.items.at(-1);
      return toolOk(ListTasksOutputSchema, {
        returned: page.items.length,
        items: page.items,
        hasMore: page.hasMore,
        ...(page.hasMore && last ? { nextCursor: encodeCursor(keyOf(last), filter) } : {}),
      });
    }),
  );
}
```
`apps/mcp-server/src/tasks/repository.ts`

```ts
import type { Task, TaskId } from "@nexus/shared";

export interface TaskFilter {
  status?: Task["status"] | undefined;
  assignee?: string | undefined;
  customerId?: string | undefined;
  dueBefore?: string | undefined;
}
/** Khóa sắp xếp ổn định: createdAt có thể trùng (tạo hàng loạt) → thêm id để phân định. */
export interface TaskKey {
  createdAt: string;
  id: string;
}
export interface TaskPatch {
  status?: Task["status"] | undefined;
  assignee?: string | undefined;
  dueDate?: string | null | undefined;
  title?: string | undefined;
}

export interface TaskRepository {
  /** Keyset: trả các việc có (createdAt, id) > after, theo thứ tự tăng dần, tối đa limit. */
  page(filter: TaskFilter, after: TaskKey | undefined, limit: number): Promise<{ items: Task[]; hasMore: boolean }>;
  get(id: TaskId): Promise<Task | null>;
  create(input: { title: string; assignee: string; customerId?: string | undefined; dueDate?: string | undefined }): Promise<Task>;
  update(id: TaskId, patch: TaskPatch): Promise<{ task: Task; changed: string[] } | null>;
  delete(id: TaskId): Promise<boolean>;
}

export const keyOf = (t: Task): TaskKey => ({ createdAt: t.createdAt, id: t.id });
export const afterKey = (t: Task, k: TaskKey): boolean => t.createdAt > k.createdAt || (t.createdAt === k.createdAt && t.id > k.id);
export const byKey = (a: Task, b: Task): number => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);

export const matches = (t: Task, f: TaskFilter): boolean =>
  (f.status === undefined || t.status === f.status) &&
  (f.assignee === undefined || t.assignee === f.assignee) &&
  (f.customerId === undefined || t.customerId === f.customerId) &&
  (f.dueBefore === undefined || (t.dueDate !== null && t.dueDate < f.dueBefore));
```
`apps/mcp-server/src/tasks/memory-repository.ts`

```ts
import type { Task, TaskId } from "@nexus/shared";
import { afterKey, byKey, matches, type TaskPatch, type TaskRepository } from "./repository.ts";

export function createMemoryTaskRepository(seed: readonly Task[], now: () => Date = () => new Date()): TaskRepository {
  const rows = new Map(seed.map((t) => [t.id, { ...t }]));
  let seq = Math.max(0, ...seed.map((t) => Number(t.id.slice(5))));
  return {
    async page(filter, after, limit) {
      const hit = [...rows.values()].filter((t) => matches(t, filter) && (after === undefined || afterKey(t, after))).sort(byKey);
      return { items: hit.slice(0, limit).map((t) => ({ ...t })), hasMore: hit.length > limit };
    },
    async get(id: TaskId) {
      const t = rows.get(id);
      return t ? { ...t } : null;
    },
    async create(input) {
      const at = now().toISOString();
      const t: Task = {
        id: `task_${String(++seq).padStart(4, "0")}`,
        title: input.title,
        status: "todo",
        assignee: input.assignee,
        customerId: input.customerId ?? null,
        dueDate: input.dueDate ?? null,
        createdAt: at,
        updatedAt: at,
      };
      rows.set(t.id, t);
      return { ...t };
    },
    async update(id: TaskId, patch: TaskPatch) {
      const t = rows.get(id);
      if (!t) return null;
      const changed: string[] = [];
      for (const k of ["status", "assignee", "dueDate", "title"] as const) {
        const v = patch[k];
        if (v !== undefined && t[k] !== v) {
          Object.assign(t, { [k]: v });
          changed.push(k);
        }
      }
      if (changed.length > 0) t.updatedAt = now().toISOString();
      return { task: { ...t }, changed };
    },
    async delete(id: TaskId) {
      return rows.delete(id);
    },
  };
}
```
`apps/mcp-server/src/tasks/mongo-repository.ts`

```ts
import type { Task, TaskId } from "@nexus/shared";
import type { Db, Filter } from "mongodb";
import type { TaskFilter, TaskKey, TaskPatch, TaskRepository } from "./repository.ts";

type TaskDoc = Omit<Task, "id"> & { _id: string };
const toTask = ({ _id, ...rest }: TaskDoc): Task => ({ id: _id, ...rest });

/**
 * Bản Mongo — chưa chạy ở sandbox dựng bài (không có Mongo).
 * Index bắt buộc cho keyset: { createdAt: 1, _id: 1 } (+ { assignee: 1, createdAt: 1, _id: 1 } cho "việc của tôi").
 */
export function createMongoTaskRepository(db: Db): TaskRepository {
  const col = db.collection<TaskDoc>("tasks");
  const where = (f: TaskFilter, after: TaskKey | undefined): Filter<TaskDoc> => ({
    ...(f.status ? { status: f.status } : {}),
    ...(f.assignee ? { assignee: f.assignee } : {}),
    ...(f.customerId ? { customerId: f.customerId } : {}),
    ...(f.dueBefore ? { dueDate: { $ne: null, $lt: f.dueBefore } } : {}),
    ...(after
      ? { $or: [{ createdAt: { $gt: after.createdAt } }, { createdAt: after.createdAt, _id: { $gt: after.id } }] }
      : {}),
  });
  return {
    async page(filter, after, limit) {
      const docs = await col.find(where(filter, after)).sort({ createdAt: 1, _id: 1 }).limit(limit + 1).toArray();
      return { items: docs.slice(0, limit).map(toTask), hasMore: docs.length > limit };
    },
    async get(id: TaskId) {
      const d = await col.findOne({ _id: id });
      return d ? toTask(d) : null;
    },
    async create(input) {
      const at = new Date().toISOString();
      // Id tuần tự qua collection counters (findOneAndUpdate + $inc, upsert)
      const c = await db
        .collection<{ _id: string; seq: number }>("counters")
        .findOneAndUpdate({ _id: "tasks" }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" });
      const doc: TaskDoc = {
        _id: `task_${String(c?.seq ?? Date.now()).padStart(4, "0")}`,
        title: input.title,
        status: "todo",
        assignee: input.assignee,
        customerId: input.customerId ?? null,
        dueDate: input.dueDate ?? null,
        createdAt: at,
        updatedAt: at,
      };
      await col.insertOne(doc);
      return toTask(doc);
    },
    async update(id: TaskId, patch: TaskPatch) {
      const before = await col.findOne({ _id: id });
      if (!before) return null;
      const set: Partial<TaskDoc> = {};
      const changed: string[] = [];
      for (const k of ["status", "assignee", "dueDate", "title"] as const) {
        const v = patch[k];
        if (v !== undefined && before[k] !== v) {
          Object.assign(set, { [k]: v });
          changed.push(k);
        }
      }
      if (changed.length === 0) return { task: toTask(before), changed };
      const after = await col.findOneAndUpdate({ _id: id }, { $set: { ...set, updatedAt: new Date().toISOString() } }, { returnDocument: "after" });
      return after ? { task: toTask(after), changed } : null;
    },
    async delete(id: TaskId) {
      return (await col.deleteOne({ _id: id })).deletedCount === 1;
    },
  };
}
```
`apps/mcp-server/src/tools/update-task.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL, UpdateTaskInputSchema, UpdateTaskOutputSchema } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerUpdateTask(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.updateTask,
    {
      title: "Cập nhật việc",
      description:
        "Hoàn thành (status=done), chuyển trạng thái, giao lại (assignee), dời hạn (dueDate; null = bỏ hạn) hoặc sửa tiêu đề 1 việc. " +
        "Chỉ gửi field cần đổi. Kết quả có changed = các field thực sự đổi.",
      // Cả object (không phải .shape): giữ .refine "cần ít nhất 1 thay đổi" — .shape làm rơi refine
      inputSchema: UpdateTaskInputSchema,
      outputSchema: UpdateTaskOutputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    instrument(TOOL.updateTask, deps.log, async ({ id, ...patch }) => {
      const r = await deps.tasks.update(id, patch);
      if (!r) return toolFail({ what: `Không có việc ${id}.`, next: "Tìm id bằng nexus_list_tasks." });
      return toolOk(UpdateTaskOutputSchema, r);
    }),
  );
}
```
`apps/mcp-server/src/tools/delete-task.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DeleteTaskInputSchema, DeleteTaskOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerDeleteTask(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.deleteTask,
    {
      title: "Xóa việc",
      description: "Xóa vĩnh viễn 1 việc tạo nhầm. Việc đã làm xong thì dùng nexus_update_task status=done, KHÔNG xóa.",
      inputSchema: DeleteTaskInputSchema.shape,
      outputSchema: DeleteTaskOutputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    instrument(TOOL.deleteTask, deps.log, async ({ id }) => {
      if (!(await deps.tasks.delete(id))) return toolFail({ what: `Không có việc ${id} để xóa.`, next: "Tìm id bằng nexus_list_tasks." });
      return toolOk(DeleteTaskOutputSchema, { id, deleted: true });
    }),
  );
}
```
`packages/shared/src/task.ts`

```ts
import { z } from "zod";
import { CustomerIdSchema } from "./customer.ts";

export const TASK_STATUSES = ["todo", "doing", "done"] as const;
export const TaskStatusSchema = z.enum(TASK_STATUSES);
export const TaskIdSchema = z.string().regex(/^task_\d{4,}$/, "id việc có dạng task_0042").brand<"TaskId">();
export type TaskId = z.infer<typeof TaskIdSchema>;
const DateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ngày dạng YYYY-MM-DD");
const Assignee = z.string().regex(/^[a-z][a-z0-9._-]{1,31}$/, "assignee là tên đăng nhập, ví dụ lan hoặc minh.tran");

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: TaskStatusSchema,
  assignee: z.string(),
  customerId: z.string().nullable(),
  dueDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Task = z.infer<typeof TaskSchema>;

// ---------- nexus_list_tasks: lọc theo cách người dùng hỏi + cursor ----------
export const ListTasksInputSchema = z.object({
  status: TaskStatusSchema.optional(),
  assignee: Assignee.optional().describe("Việc của ai"),
  customerId: CustomerIdSchema.optional(),
  dueBefore: DateOnly.optional().describe("Hạn trước ngày này (YYYY-MM-DD) — dùng cho \"việc quá hạn\""),
  cursor: z.string().max(200).optional().describe("nextCursor của trang trước; bỏ trống = trang đầu"),
  limit: z.number().int().min(1).max(50).default(20),
});
export const ListTasksOutputSchema = z.object({
  returned: z.number().int(),
  items: z.array(TaskSchema),
  hasMore: z.boolean().describe("false = đây là trang cuối"),
  nextCursor: z.string().optional().describe("Chỉ có khi hasMore = true; truyền nguyên văn vào lần gọi sau CÙNG bộ lọc"),
});

// ---------- nexus_create_task ----------
export const CreateTaskInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  assignee: Assignee,
  customerId: CustomerIdSchema.optional(),
  dueDate: DateOnly.optional(),
});
export const TaskResultSchema = z.object({ task: TaskSchema });

// ---------- nexus_update_task: đổi trạng thái, giao lại, dời hạn — 1 tool cho cả 3 việc ----------
export const UpdateTaskInputSchema = z
  .object({
    id: TaskIdSchema,
    status: TaskStatusSchema.optional().describe("done = hoàn thành"),
    assignee: Assignee.optional().describe("Giao lại cho người khác"),
    dueDate: DateOnly.nullable().optional().describe("Dời hạn; null = bỏ hạn"),
    title: z.string().trim().min(3).max(120).optional(),
  })
  .refine((v) => v.status !== undefined || v.assignee !== undefined || v.dueDate !== undefined || v.title !== undefined, {
    message: "cần ít nhất 1 thay đổi: status, assignee, dueDate hoặc title",
  });
export const UpdateTaskOutputSchema = z.object({ task: TaskSchema, changed: z.array(z.string()) });

// ---------- nexus_delete_task ----------
export const DeleteTaskInputSchema = z.object({ id: TaskIdSchema });
export const DeleteTaskOutputSchema = z.object({ id: z.string(), deleted: z.literal(true) });
```

Thêm `tasks` vào `nexus_query` (diff thật S5.4 → S5.5):

`packages/shared/src/query.ts`

```diff
 
 /** Collection mà tool truy vấn được — whitelist, không phải mọi collection trong DB (M5 · S5.2). */
-export const QUERY_COLLECTIONS = ["customers", "orders"] as const;
+export const QUERY_COLLECTIONS = ["customers", "orders", "tasks"] as const;
 export type QueryCollection = (typeof QUERY_COLLECTIONS)[number];
 
```

`apps/mcp-server/src/query/catalog.ts`

```diff
-import { CustomerSchema, OrderSchema, type QueryCollection } from "@nexus/shared";
+import { CustomerSchema, OrderSchema, TaskSchema, type QueryCollection } from "@nexus/shared";
 import { z } from "zod";
 
  * Sinh từ chính Zod schema của dữ liệu — đổi schema là tài liệu đổi theo, không ai phải nhớ sửa tay.
  */
-const SCHEMAS = { customers: CustomerSchema, orders: OrderSchema } as const satisfies Record<QueryCollection, z.ZodObject>;
+const SCHEMAS = { customers: CustomerSchema, orders: OrderSchema, tasks: TaskSchema } as const satisfies Record<QueryCollection, z.ZodObject>;
 
 const NOTES: Partial<Record<QueryCollection, Record<string, string>>> = {
     createdAt: "Ngày bắt đầu dùng, ISO 8601 UTC",
   },
+  tasks: {
+    id: "Id việc, dạng task_0042",
+    title: "Tiêu đề",
+    status: "todo | doing | done",
+    assignee: "Tên đăng nhập người phụ trách",
+    customerId: "Khách liên quan (có thể null)",
+    dueDate: "Hạn YYYY-MM-DD (có thể null)",
+    createdAt: "Lúc tạo, ISO 8601 UTC",
+    updatedAt: "Lúc sửa gần nhất",
+  },
 };
 
   customers: ['{"city":"Hà Nội","tier":"pro"}', '{"tier":{"$in":["pro","enterprise"]}}'],
   orders: ['{"status":"paid","amount":{"$gte":20000000}}', '{"customerId":"cus_007","createdAt":{"$gte":"2026-07-01"}}'],
+  tasks: ['{"assignee":"lan","status":{"$ne":"done"}}', '{"dueDate":{"$lt":"2026-08-01"},"status":"todo"}'],
 };
 
   customers: new Set(describeFields("customers").map((f) => f.name)),
   orders: new Set(describeFields("orders").map((f) => f.name)),
+  tasks: new Set(describeFields("tasks").map((f) => f.name)),
 };
 
```

`apps/mcp-server/scripts/size-audit.ts`

```diff
 import { createLogger } from "../src/log.ts";
 import { createMemoryOrderRepository } from "../src/orders/repository.ts";
+import { createMemoryTaskRepository } from "../src/tasks/memory-repository.ts";
+import { seedTasks } from "../src/tasks/seed-data.ts";
 import { seedOrders } from "../src/orders/seed-data.ts";
 import { createRatesClient } from "../src/rates/client.ts";
 const customers = createMemoryCustomerRepository(seed);
 const orders = createMemoryOrderRepository(seedOrders(seed, 50_000));
+const tasks = createMemoryTaskRepository(seedTasks(100_000));
 const exportsDir = await openRoot(path.join(await mkdtemp(path.join(tmpdir(), "nexus-audit-")), "exports"));
 await mkdir(path.join(exportsDir, "bulk"), { recursive: true });
   customers,
   orders,
-  query: memoryQueryStore(customers, orders),
+  tasks,
+  query: memoryQueryStore(customers, orders, tasks),
   rates: createRatesClient("http://127.0.0.1:9", 300),
   exportsDir,
   [TOOL.findOrders]: { sample: 20 },
   [TOOL.analyzeExport]: { path: "lon.csv", groupBy: "nhom", sum: "so_tien", top: 30 },
+  [TOOL.listTasks]: { limit: 50 },
+  [TOOL.createTask]: { title: "Kiểm tra kích thước ".repeat(6).trim(), assignee: "lan", customerId: "cus_001", dueDate: "2026-12-31" },
+  [TOOL.updateTask]: { id: "task_0001", status: "done", assignee: "minh", dueDate: null },
+  [TOOL.deleteTask]: { id: "task_0002" },
 };
 
 
 const { tools } = await client.listTools();
-console.log(`dữ liệu: ${seed.length} khách · 50000 đơn · 301 file export · CSV 20000 dòng · 40 ticket · ngân sách ${BUDGET} token`);
+console.log(`dữ liệu: ${seed.length} khách · 50000 đơn · 100000 việc · 301 file export · CSV 20000 dòng · 40 ticket · ngân sách ${BUDGET} token`);
 console.log(`${"tool".padEnd(32)} ${"ký tự".padStart(7)} ${"token".padStart(7)} ${"+structured".padStart(12)}  kết luận`);
 let over = 0;
```

</details>

<details>
<summary>Tra khi test đỏ</summary>

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| Duyệt bằng limit 37 thiếu 75 bản ghi, limit 50 thì đủ | Keyset chỉ theo `createdAt`; 5 bản ghi cùng thời điểm | Khóa `(createdAt, id)`; so `createdAt >` **hoặc** `=` và `id >` |
| Trùng/sót khi có người thêm/xóa lúc đang duyệt | Offset pagination | Keyset — vị trí là “sau bản ghi X”, không phải “sau N bản ghi” |
| Model gọi tiếp mãi sau trang cuối | Trang cuối vẫn trả `nextCursor` (rỗng / `null` / trỏ vào trang rỗng) | Không có `nextCursor` khi hết; `hasMore: false` nói thẳng |
| Trang 2 trộn việc của 2 người | Model đổi bộ lọc mà giữ cursor | Vân tay bộ lọc trong cursor → `isError` “thuộc bộ lọc khác” |
| `nexus_update_task {"id":…}` chạy không đổi gì | `inputSchema: X.shape` làm rơi `.refine` | Truyền cả `z.object` vào `inputSchema` |
| `TS2345 … '$brand<"TaskId">'` | Truyền id thô vào repository | `TaskIdSchema.parse` ở biên (schema tool đã làm) |
| Mongo: trang sau chậm dần | Thiếu index `{ createdAt: 1, _id: 1 }` | Tạo index; kiểm bằng `explain` (M10) |
| Harness Lab 28 báo sai cách báo hết trang | Trả `nextCursor: ""` hoặc `null` | Bỏ hẳn field |

</details>

### Một lời gọi `nexus_list_tasks` đi qua đâu

**Sơ đồ (Luồng quyết định) — nexus_list_tasks nhận 1 lời gọi: trang nào, và báo hết trang thế nào?**

```mermaid
flowchart TD
    ev["nexus_list_tasks {bộ lọc, cursor?, limit}"] --> q1{"cursor hợp lệ?"}
    q1 -- "sai" --> rno["✗ isError, không đoán trang"]
    q1 -- "đúng / trang đầu" --> q2{"còn bản thứ limit+1?"}
    q2 -- "còn" --> rsame["✓ items + nextCursor"]
    q2 -- "hết" --> ryes["✓ items, hasMore=false, không nextCursor"]
```

**Đọc sơ đồ:** Đọc từ trên xuống. Câu 1: cursor (nếu có) giải mã được và thuộc ĐÚNG bộ lọc này không. Câu 2: lấy limit + 1 bản ghi sau vị trí (createdAt, id) — có bản thứ limit + 1 nghĩa là còn trang. *Màu: đỏ gạch + ✗ + viền đứt = bị chặn/sai · vàng mù tạt + ? + viền chấm = cần xem lại · xanh ô-liu + ✓ = chạy đúng.*


### Workflow hay độ phủ API

| Người dùng nói | Bản dịch thẳng (7 tool) | Nexus (4 tool) |
|---|---|---|
| “Việc của tôi quá hạn” | `get_tasks` (page, pageSize, sortBy…) rồi tự lọc | `nexus_list_tasks {assignee, dueBefore}` |
| “Giao việc gọi lại cus_007 cho Lan” | `post_task` (6 field, `status` tùy ý) | `nexus_create_task` — mới tạo luôn là `todo` |
| “Xong việc task_0002” | `patch_task` với `[{op:"replace", path:"/status", value:"done"}]` | `nexus_update_task {id, status: "done"}` |
| “Dời hạn sang thứ Hai, giao cho Minh” | `put_task` (phải gửi đủ mọi field, dễ xóa nhầm field khác) | `nexus_update_task {id, dueDate, assignee}` — chỉ field đổi |
| “Có bao nhiêu việc todo” | `count_tasks` | `nexus_query {collection: "tasks", filter}` → `matched` (S5.2) |
| “Xóa việc tạo nhầm” | `delete_task` | `nexus_delete_task` (`destructiveHint`, description nói không xóa việc đã xong) |

Đếm không phải là việc của tool phân trang: trả `total` mỗi trang là `countDocuments` trên cả collection mỗi lần gọi. Model cần đếm thì đã có `nexus_query` (đếm bằng `matched`).

### Mở rộng whitelist mà không sót chỗ nào

Thêm `"tasks"` vào `QUERY_COLLECTIONS` (1 dòng) rồi chạy tsc **trước** khi sửa gì khác:

```console
$ npx tsc -p tsconfig.json
scripts/size-audit.ts(51,7): error TS2739: Type '{ nexus_ping: {}; nexus_get_time: {}; nexus_list_customers: { limit: number; }; nexus_get_customer: { id: string; }; nexus_get_exchange_rate: { from: string; }; nexus_chart_customers_by_city: {}; ... 12 more ...; nexus_analyze_export: { ...; }; }' is missing the following properties from type 'Record<ToolName, Record<string, unknown>>': nexus_list_tasks, nexus_create_task, nexus_update_task, nexus_delete_task
src/deps.ts(51,36): error TS2345: Argument of type '{ customers: () => Promise<readonly Readonly<Record<string, unknown>>[]>; orders: () => Promise<readonly Readonly<Record<string, unknown>>[]>; }' is not assignable to parameter of type 'Record<"customers" | "orders" | "tasks", Source>'.
  Property 'tasks' is missing in type '{ customers: () => Promise<readonly Readonly<Record<string, unknown>>[]>; orders: () => Promise<readonly Readonly<Record<string, unknown>>[]>; }' but required in type 'Record<"customers" | "orders" | "tasks", Source>'.
src/query/catalog.ts(8,77): error TS1360: Type '{ readonly customers: z.ZodObject<{ id: z.core.$ZodBranded<z.ZodString, "CustomerId", "out">; name: z.ZodString; email: z.ZodEmail; city: z.ZodEnum<{ "H\u00E0 N\u1ED9i": "Hà Nội"; "H\u1EA3i Ph\u00F2ng": "Hải Phòng"; "TP.HCM": "TP.HCM"; "\u0110\u00E0 N\u1EB5ng": "Đà Nẵng"; "C\u1EA7n Th\u01A1": "Cần Thơ"; }>; tier: z....' does not satisfy the expected type 'Record<"customers" | "orders" | "tasks", ZodObject<$ZodLooseShape, $strip>>'.
  Property 'tasks' is missing in type '{ readonly customers: z.ZodObject<{ id: z.core.$ZodBranded<z.ZodString, "CustomerId", "out">; name: z.ZodString; email: z.ZodEmail; city: z.ZodEnum<{ "H\u00E0 N\u1ED9i": "Hà Nội"; "H\u1EA3i Ph\u00F2ng": "Hải Phòng"; "TP.HCM": "TP.HCM"; "\u0110\u00E0 N\u1EB5ng": "Đà Nẵng"; "C\u1EA7n Th\u01A1": "Cần Thơ"; }>; tier: z....' but required in type 'Record<"customers" | "orders" | "tasks", ZodObject<$ZodLooseShape, $strip>>'.
src/query/catalog.ts(21,7): error TS2741: Property 'tasks' is missing in type '{ customers: string[]; orders: string[]; }' but required in type 'Record<"customers" | "orders" | "tasks", string[]>'.
src/query/catalog.ts(37,29): error TS7053: Element implicitly has an 'any' type because expression of type '"customers" | "orders" | "tasks"' can't be used to index type '{ readonly customers: ZodObject<{ id: $ZodBranded<ZodString, "CustomerId", "out">; name: ZodString; email: ZodEmail; city: ZodEnum<{ "H\u00E0 N\u1ED9i": "Hà Nội"; "H\u1EA3i Ph\u00F2ng": "Hải Phòng"; "TP.HCM": "TP.HCM"; "\u0110\u00E0 N\u1EB5ng": "Đà Nẵng"; "C\u1EA7n Th\u01A1": "Cần Thơ"; }>; tier: ZodEnum<...>; creat...'.
  Property 'tasks' does not exist on type '{ readonly customers: ZodObject<{ id: $ZodBranded<ZodString, "CustomerId", "out">; name: ZodString; email: ZodEmail; city: ZodEnum<{ "H\u00E0 N\u1ED9i": "Hà Nội"; "H\u1EA3i Ph\u00F2ng": "Hải Phòng"; "TP.HCM": "TP.HCM"; "\u0110\u00E0 N\u1EB5ng": "Đà Nẵng"; "C\u1EA7n Th\u01A1": "Cần Thơ"; }>; tier: ZodEnum<...>; creat...'.
src/query/catalog.ts(45,14): error TS2741: Property 'tasks' is missing in type '{ customers: Set<string>; orders: Set<string>; }' but required in type 'Record<"customers" | "orders" | "tasks", ReadonlySet<string>>'.
```

6 lỗi = 6 chỗ phải sửa: store RAM thiếu nguồn `tasks`, catalog thiếu schema/field, và `size-audit` thiếu kịch bản xấu nhất cho 4 tool mới. Không cần nhớ — compiler liệt kê. Đó là lý do mọi bảng trong M5 khai bằng `Record<Union, …>` thay vì object tự do.

### Phần khác C# thật sự

**1. Người gọi không biết “trang”.** Client REST tính `page=3`; model thì không nên — nó sẽ đoán `offset: 200`, gọi lặp, hoặc nhảy trang. Cursor mờ là thứ duy nhất nó được làm: chép nguyên văn sang lần gọi sau.

**2. Báo hết bằng sự vắng mặt.** Có `nextCursor` = còn; không có = hết. Chính spec MCP phân trang `tools/list`, `resources/list` theo cách này. `hasMore` đi kèm để model đọc thẳng, không phải suy ra.

**3. Vị trí là “sau bản ghi X”, không phải “sau N bản ghi”.** Keyset giữ đúng vị trí khi có người thêm/xóa phía trước; offset thì dịch theo (Bẫy 1). Khóa phải **duy nhất** — `createdAt` không duy nhất khi import hàng loạt, nên ghép `id` (Bẫy 2).

**4. Cursor mang theo bộ lọc nó thuộc về.** Model có thể đổi `status` mà giữ cursor; không kiểm thì trang sau là “việc `done` có `createdAt` sau 1 việc `todo`” — vô nghĩa mà không ai biết. Vân tay bộ lọc (12 ký tự SHA-256) chặn chuyện đó.

**5. Mờ không có nghĩa là bí mật.** `eyJ2IjoxLCJjIjoi…` là base64url của `{"v":1,"c":"2026-07-01T00:01:00.000Z","i":"task_0006","f":"…"}` — ai cũng đọc được và sửa được. Đừng nhét dữ liệu nhạy cảm vào; M6 · S6.4 thêm chữ ký và hạn dùng để phân biệt cursor bị sửa với cursor hết hạn.

**6. `.shape` là bản sao các field, không phải schema.** Đăng ký tool bằng `X.shape` thì SDK dựng lại `z.object` từ các field — mọi `.refine`, `.superRefine`, `.transform` gắn trên object bị mất, ở cả SDK 1.30, 1.32 lẫn v2 (output ở Cheat Sheet Tổng quan, dòng B).

### Bẫy dev .NET hay vấp

#### Bẫy 1 — `Skip((page - 1) * size).Take(size)`

Cùng kịch bản 3 của `page-all.ts`: sau trang 2, xóa 3 việc đã đọc + 3 việc chưa đọc, tạo 4 việc mới:

`lesson-code/m5/traps/offset-paging.ts`

```ts
// Bẫy 1 (S5.5) — dịch thẳng Skip((page-1)*size).Take(size): dữ liệu đổi giữa lúc duyệt là trùng / sót.
import type { Task } from "../../../nexus/packages/shared/src/index.ts";
import { seedTasks } from "../../../nexus/apps/mcp-server/src/tasks/seed-data.ts";

function scenario(order: "cũ → mới" | "mới → cũ"): void {
  let rows: Task[] = seedTasks(1_000);
  const sort = (): Task[] => [...rows].sort((a, b) => (order === "cũ → mới" ? 1 : -1) * (a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)));
  const seen: string[] = [];
  const size = 50;
  for (let p = 1; ; p++) {
    const items = sort().slice((p - 1) * size, p * size); // offset = (page - 1) * size
    seen.push(...items.map((t) => t.id));
    if (p === 2) {
      // Giống hệt kịch bản 3 của page-all.ts: xóa 3 việc đã đọc + 3 chưa đọc, tạo 4 việc mới
      const del = new Set(["task_0001", "task_0010", "task_0020", "task_0500", "task_0750", "task_0999"]);
      rows = rows.filter((t) => !del.has(t.id));
      for (let i = 0; i < 4; i++) {
        const at = new Date(Date.UTC(2026, 9, 1, 0, i)).toISOString();
        rows.push({ id: `task_${1001 + i}`, title: "mới", status: "todo", assignee: "minh", customerId: null, dueDate: null, createdAt: at, updatedAt: at });
      }
    }
    if (items.length < size) break;
  }
  const expected = new Set(rows.map((t) => t.id).concat(["task_0001", "task_0010", "task_0020"]));
  const set = new Set(seen);
  const missing = [...expected].filter((id) => !set.has(id));
  console.log(`offset, sắp ${order}: nhận ${seen.length} · trùng ${seen.length - set.size} · sót ${missing.length}${missing.length ? ` (vd ${missing.slice(0, 3).join(", ")})` : ""}`);
}

scenario("cũ → mới");
scenario("mới → cũ");
```

```console
$ node m5/traps/offset-paging.ts
offset, sắp cũ → mới: nhận 998 · trùng 0 · sót 3 (vd task_0101, task_0102, task_0103)
offset, sắp mới → cũ: nhận 998 · trùng 3 · sót 7 (vd task_1001, task_1002, task_1003)
```

Sắp cũ → mới: 3 việc đã đọc bị xóa làm mọi thứ phía sau dịch lên 3 vị trí — `task_0101…0103` không bao giờ được trả. Sắp mới → cũ (kiểu “mới nhất trước” rất phổ biến): việc mới chen lên đầu đẩy mọi thứ xuống — vừa trùng 3, vừa sót 7. Keyset của Nexus cùng kịch bản: 0 trùng, 0 sót.

#### Bẫy 2 — keyset chỉ theo `createdAt`

`lesson-code/m5/traps/keyset-no-tiebreak.ts`

```ts
// Bẫy 2 (S5.5) — keyset chỉ theo createdAt ("WHERE createdAt > @last"): 5 việc tạo cùng 1 thời điểm → sót.
import { seedTasks } from "../../../nexus/apps/mcp-server/src/tasks/seed-data.ts";

const rows = seedTasks(1_000).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
for (const limit of [37, 50]) {
  const seen = new Set<string>();
  let last: string | undefined;
  for (;;) {
    const items = rows.filter((t) => last === undefined || t.createdAt > last).slice(0, limit);
    items.forEach((t) => seen.add(t.id));
    if (items.length < limit) break;
    last = items.at(-1)?.createdAt;
  }
  console.log(`limit ${limit}: nhận ${seen.size}/1000 — sót ${1000 - seen.size}`);
}
console.log(`createdAt trùng nhau: ${rows.length - new Set(rows.map((t) => t.createdAt)).size} việc có thời điểm tạo trùng việc khác`);
```

```console
$ node m5/traps/keyset-no-tiebreak.ts
limit 37: nhận 925/1000 — sót 75
limit 50: nhận 1000/1000 — sót 0
createdAt trùng nhau: 800 việc có thời điểm tạo trùng việc khác
```

Bẫy ẩn kép: với `limit` 50 (chia hết cho 5 việc/thời điểm) **không sót gì** — test của bạn xanh. Model gọi với `limit` 37 thì mất 75 việc. Khóa phụ `id` làm khóa sắp xếp duy nhất.

#### Bẫy 3 — `inputSchema: Schema.shape` làm rơi `.refine`

`lesson-code/m5/traps/shape-drops-refine.ts`

```ts
// Bẫy 3 (S5.5) — registerTool({ inputSchema: Schema.shape }) làm rơi .refine của object.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { UpdateTaskInputSchema } from "../../../nexus/packages/shared/src/index.ts";

const server = new McpServer({ name: "trap", version: "1.0.0" });
server.registerTool("update_shape", { inputSchema: UpdateTaskInputSchema.shape }, async (args) => ({
  content: [{ type: "text", text: `handler CHẠY với ${JSON.stringify(args)} — không có gì để đổi` }],
}));
server.registerTool("update_object", { inputSchema: UpdateTaskInputSchema }, async (args) => ({
  content: [{ type: "text", text: `handler chạy với ${JSON.stringify(args)}` }],
}));
const [a, b] = InMemoryTransport.createLinkedPair();
await server.connect(b);
const client = new Client({ name: "c", version: "1" });
await client.connect(a);
for (const name of ["update_shape", "update_object"]) {
  const r = (await client.callTool({ name, arguments: { id: "task_0042" } })) as CallToolResult;
  console.log(`${name.padEnd(14)} → ${r.isError ? "[isError] " : ""}${r.content.map((c) => (c.type === "text" ? c.text : "")).join("")}`);
}
await client.close();
```

```console
$ node m5/traps/shape-drops-refine.ts
update_shape   → handler CHẠY với {"id":"task_0042"} — không có gì để đổi
update_object  → [isError] MCP error -32602: Input validation error: Invalid arguments for tool update_object: cần ít nhất 1 thay đổi: status, assignee, dueDate hoặc title
```

M3–M4 đăng ký bằng `.shape` vì mọi ràng buộc nằm trên field. `UpdateTaskInputSchema` có ràng buộc **giữa các field** (ít nhất 1 thay đổi) — chỉ sống trên object. Nexus truyền cả object cho tool này; SDK v2 khuyến nghị làm vậy cho mọi tool.

#### Bẫy 4 — id thô vào repository

`lesson-code/m5/tsc-traps/task-id-string.ts`

```ts
import type { TaskRepository } from "../../../nexus/apps/mcp-server/src/tasks/repository.ts";

export const finish = (repo: TaskRepository, id: string) => repo.update(id, { status: "done" });
```

> ❌ **TS2345** (dòng 3, cột 73): Argument of type 'string' is not assignable to parameter of type 'string & $brand<"TaskId">'. Type 'string' is not assignable to type '$brand<"TaskId">'.

Giống `CustomerId` của M3: id phải qua `TaskIdSchema` (ở biên — schema của tool) trước khi tới repository.

### Code mẫu & pattern

#### Code production

`apps/mcp-server/src/tasks/cursor.ts`

```ts
import { createHash } from "node:crypto";
import { z } from "zod";
import type { TaskFilter, TaskKey } from "./repository.ts";

/**
 * Cursor mờ (opaque) cho keyset pagination (M5 · S5.5).
 * Bên trong: vị trí cuối trang trước + dấu vân tay của bộ lọc. Model chỉ việc chép nguyên văn.
 * Không phải số trang/offset: chèn/xóa giữa chừng không làm trùng hay sót bản ghi còn tồn tại.
 * (M6 · S6.4 thêm hạn dùng + chữ ký để phân biệt cursor hết hạn với cursor bị sửa.)
 */
const CursorBody = z.object({ v: z.literal(1), c: z.string(), i: z.string(), f: z.string() });

export function filterFingerprint(f: TaskFilter): string {
  const stable = JSON.stringify([f.status ?? null, f.assignee ?? null, f.customerId ?? null, f.dueBefore ?? null]);
  return createHash("sha256").update(stable).digest("base64url").slice(0, 12);
}

export function encodeCursor(last: TaskKey, f: TaskFilter): string {
  return Buffer.from(JSON.stringify({ v: 1, c: last.createdAt, i: last.id, f: filterFingerprint(f) })).toString("base64url");
}

export type Decoded = { ok: true; after: TaskKey } | { ok: false; reason: "malformed" | "other_filter" };

export function decodeCursor(raw: string, f: TaskFilter): Decoded {
  let body: unknown;
  try {
    body = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  const p = CursorBody.safeParse(body);
  if (!p.success) return { ok: false, reason: "malformed" };
  if (p.data.f !== filterFingerprint(f)) return { ok: false, reason: "other_filter" };
  return { ok: true, after: { createdAt: p.data.c, id: p.data.i } };
}
```
`apps/mcp-server/src/tools/list-tasks.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListTasksInputSchema, ListTasksOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { decodeCursor, encodeCursor } from "../tasks/cursor.ts";
import { keyOf } from "../tasks/repository.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerListTasks(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.listTasks,
    {
      title: "Danh sách việc",
      description:
        "Việc nội bộ, lọc theo trạng thái, người phụ trách, khách, hạn (dueBefore cho \"việc quá hạn\"). Trả theo trang. " +
        "hasMore=true thì gọi lại với cursor = nextCursor và GIỮ NGUYÊN bộ lọc; hasMore=false là hết, không gọi tiếp.",
      inputSchema: ListTasksInputSchema.shape,
      outputSchema: ListTasksOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.listTasks, deps.log, async ({ cursor, limit, ...filter }) => {
      let after;
      if (cursor !== undefined) {
        const d = decodeCursor(cursor, filter);
        if (!d.ok) {
          return d.reason === "other_filter"
            ? toolFail({ what: "cursor này thuộc một bộ lọc khác.", next: "Gọi lại với đúng bộ lọc của trang trước, hoặc bỏ cursor để bắt đầu từ trang đầu." })
            : toolFail({ what: "cursor không hợp lệ.", next: "Chép nguyên văn nextCursor của trang trước, hoặc bỏ cursor để bắt đầu từ trang đầu." });
        }
        after = d.after;
      }
      const page = await deps.tasks.page(filter, after, limit);
      const last = page.items.at(-1);
      return toolOk(ListTasksOutputSchema, {
        returned: page.items.length,
        items: page.items,
        hasMore: page.hasMore,
        ...(page.hasMore && last ? { nextCursor: encodeCursor(keyOf(last), filter) } : {}),
      });
    }),
  );
}
```
`apps/mcp-server/src/tasks/repository.ts`

```ts
import type { Task, TaskId } from "@nexus/shared";

export interface TaskFilter {
  status?: Task["status"] | undefined;
  assignee?: string | undefined;
  customerId?: string | undefined;
  dueBefore?: string | undefined;
}
/** Khóa sắp xếp ổn định: createdAt có thể trùng (tạo hàng loạt) → thêm id để phân định. */
export interface TaskKey {
  createdAt: string;
  id: string;
}
export interface TaskPatch {
  status?: Task["status"] | undefined;
  assignee?: string | undefined;
  dueDate?: string | null | undefined;
  title?: string | undefined;
}

export interface TaskRepository {
  /** Keyset: trả các việc có (createdAt, id) > after, theo thứ tự tăng dần, tối đa limit. */
  page(filter: TaskFilter, after: TaskKey | undefined, limit: number): Promise<{ items: Task[]; hasMore: boolean }>;
  get(id: TaskId): Promise<Task | null>;
  create(input: { title: string; assignee: string; customerId?: string | undefined; dueDate?: string | undefined }): Promise<Task>;
  update(id: TaskId, patch: TaskPatch): Promise<{ task: Task; changed: string[] } | null>;
  delete(id: TaskId): Promise<boolean>;
}

export const keyOf = (t: Task): TaskKey => ({ createdAt: t.createdAt, id: t.id });
export const afterKey = (t: Task, k: TaskKey): boolean => t.createdAt > k.createdAt || (t.createdAt === k.createdAt && t.id > k.id);
export const byKey = (a: Task, b: Task): number => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);

export const matches = (t: Task, f: TaskFilter): boolean =>
  (f.status === undefined || t.status === f.status) &&
  (f.assignee === undefined || t.assignee === f.assignee) &&
  (f.customerId === undefined || t.customerId === f.customerId) &&
  (f.dueBefore === undefined || (t.dueDate !== null && t.dueDate < f.dueBefore));
```

#### Pattern: Keyset cursor mờ + tool theo workflow

**Vấn đề:** danh sách dài phải duyệt được hết, đúng, khi dữ liệu đổi; và người gọi (model) phải dùng được mà không hiểu cách phân trang bên trong.

**Tương đương C#:** `WHERE (CreatedAt > @c) OR (CreatedAt = @c AND Id > @i) ORDER BY CreatedAt, Id` + continuation token kiểu Cosmos DB / `Pageable<T>` của Azure SDK; phía API là các endpoint theo use case thay vì CRUD 1:1.

**Dịch thẳng vs kiểu TS:**

`lesson-code/m5/patterns/task-api.direct.ts`

```ts
// Dịch thẳng từ C#: TasksController 1:1 thành tool — đủ "độ phủ API", phân trang page/pageSize.
export interface TaskDto {
  id: string;
  title: string;
  status: "todo" | "doing" | "done";
  assignee: string;
  customerId: string | null;
  dueDate: string | null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface JsonPatchOp {
  op: "replace" | "add" | "remove";
  path: string;
  value?: unknown;
}

/** 7 tool cho model chọn, mỗi tool = 1 action của controller. */
export const TASK_TOOLS = [
  { name: "get_task", input: ["id"] },
  { name: "get_tasks", input: ["page", "pageSize", "sortBy", "sortDir", "status", "assignee"] },
  { name: "post_task", input: ["title", "status", "assignee", "customerId", "dueDate"] },
  { name: "put_task", input: ["id", "title", "status", "assignee", "customerId", "dueDate"] },
  { name: "patch_task", input: ["id", "operations: JsonPatchOp[]"] },
  { name: "delete_task", input: ["id"] },
  { name: "count_tasks", input: ["status", "assignee"] },
] as const;

export function paginate<T>(rows: readonly T[], page: number, pageSize: number): PagedResult<T> {
  return {
    items: rows.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    totalCount: rows.length,
    totalPages: Math.ceil(rows.length / pageSize),
  };
}
```
`apps/mcp-server/src/tasks/cursor.ts`

```ts
import { createHash } from "node:crypto";
import { z } from "zod";
import type { TaskFilter, TaskKey } from "./repository.ts";

/**
 * Cursor mờ (opaque) cho keyset pagination (M5 · S5.5).
 * Bên trong: vị trí cuối trang trước + dấu vân tay của bộ lọc. Model chỉ việc chép nguyên văn.
 * Không phải số trang/offset: chèn/xóa giữa chừng không làm trùng hay sót bản ghi còn tồn tại.
 * (M6 · S6.4 thêm hạn dùng + chữ ký để phân biệt cursor hết hạn với cursor bị sửa.)
 */
const CursorBody = z.object({ v: z.literal(1), c: z.string(), i: z.string(), f: z.string() });

export function filterFingerprint(f: TaskFilter): string {
  const stable = JSON.stringify([f.status ?? null, f.assignee ?? null, f.customerId ?? null, f.dueBefore ?? null]);
  return createHash("sha256").update(stable).digest("base64url").slice(0, 12);
}

export function encodeCursor(last: TaskKey, f: TaskFilter): string {
  return Buffer.from(JSON.stringify({ v: 1, c: last.createdAt, i: last.id, f: filterFingerprint(f) })).toString("base64url");
}

export type Decoded = { ok: true; after: TaskKey } | { ok: false; reason: "malformed" | "other_filter" };

export function decodeCursor(raw: string, f: TaskFilter): Decoded {
  let body: unknown;
  try {
    body = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  const p = CursorBody.safeParse(body);
  if (!p.success) return { ok: false, reason: "malformed" };
  if (p.data.f !== filterFingerprint(f)) return { ok: false, reason: "other_filter" };
  return { ok: true, after: { createdAt: p.data.c, id: p.data.i } };
}
```
`apps/mcp-server/src/tools/list-tasks.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListTasksInputSchema, ListTasksOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { decodeCursor, encodeCursor } from "../tasks/cursor.ts";
import { keyOf } from "../tasks/repository.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerListTasks(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.listTasks,
    {
      title: "Danh sách việc",
      description:
        "Việc nội bộ, lọc theo trạng thái, người phụ trách, khách, hạn (dueBefore cho \"việc quá hạn\"). Trả theo trang. " +
        "hasMore=true thì gọi lại với cursor = nextCursor và GIỮ NGUYÊN bộ lọc; hasMore=false là hết, không gọi tiếp.",
      inputSchema: ListTasksInputSchema.shape,
      outputSchema: ListTasksOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.listTasks, deps.log, async ({ cursor, limit, ...filter }) => {
      let after;
      if (cursor !== undefined) {
        const d = decodeCursor(cursor, filter);
        if (!d.ok) {
          return d.reason === "other_filter"
            ? toolFail({ what: "cursor này thuộc một bộ lọc khác.", next: "Gọi lại với đúng bộ lọc của trang trước, hoặc bỏ cursor để bắt đầu từ trang đầu." })
            : toolFail({ what: "cursor không hợp lệ.", next: "Chép nguyên văn nextCursor của trang trước, hoặc bỏ cursor để bắt đầu từ trang đầu." });
        }
        after = d.after;
      }
      const page = await deps.tasks.page(filter, after, limit);
      const last = page.items.at(-1);
      return toolOk(ListTasksOutputSchema, {
        returned: page.items.length,
        items: page.items,
        hasMore: page.hasMore,
        ...(page.hasMore && last ? { nextCursor: encodeCursor(keyOf(last), filter) } : {}),
      });
    }),
  );
}
```

- Bản dịch thẳng: 7 tool theo action của controller, `PagedResult` với `page`/`totalPages` (đếm cả collection mỗi trang), `patch_task` bắt model viết JSON Patch, `put_task` bắt gửi đủ field. `paginate` là offset — mang sẵn Bẫy 1.
- Bản TS: 4 tool theo việc; cursor là **hàm** encode/decode quanh 1 Zod schema (`CursorBody`) — kiểm hình dạng, phiên bản (`v: 1`) và vân tay bộ lọc trong 1 chỗ; kết quả decode là union `ok | malformed | other_filter`, tool `switch` thành 2 câu lỗi khác nhau cho model.
- Repository không biết cursor: nó nhận `after: TaskKey` (đã giải mã). Đổi định dạng cursor (thêm chữ ký ở M6) không đụng tới repository.

**Khi nào KHÔNG dùng:** danh sách nhỏ có trần cứng (≤ 50 khách theo thành phố của `nexus_list_customers`) — trả hết + `total`, không phân trang. Người dùng cần **nhảy** tới trang N (bảng admin ở M9) — offset vẫn hợp lý cho UI người dùng, chỉ không hợp cho model duyệt hết. Và đừng gom mọi thao tác vào 1 tool `manage_task {action: …}` — đó là quá tay theo chiều ngược lại: model mất description riêng cho từng việc.

### Trắc nghiệm S5.5

1. Theo output thật, keyset chỉ theo `createdAt` với `limit` 50 sót bao nhiêu, `limit` 37 sót bao nhiêu?
   - A. Cả hai sót 75
   - B. `limit` 50 sót 0, `limit` 37 sót 75 — dữ liệu có 5 việc/thời điểm, 50 chia hết cho 5 nên bug bị che
   - C. Cả hai sót 0 vì `createdAt` có tới mili giây

   <details><summary>Đáp án</summary>

   **B.** Bug ẩn theo kích thước trang: test với 1 giá trị `limit` không đủ. Khóa sắp xếp phải duy nhất: `(createdAt, id)`.

   </details>

2. Trang cuối của `nexus_list_tasks` trả gì để model biết dừng?
   - A. `hasMore: false` và **không có** field `nextCursor`
   - B. `nextCursor: ""`
   - C. `nextCursor: null` và `total` bằng số đã nhận

   <details><summary>Đáp án</summary>

   **A.** Cùng quy ước phân trang của MCP cho `tools/list`/`resources/list`: có cursor là còn, không có là hết.

   </details>

3. Model lấy `nextCursor` từ lần gọi `{assignee: "lan"}` rồi gọi `{status: "done", cursor}`. Nexus làm gì (output thật)?
   - A. Trả trang 2 của việc `done`
   - B. Bỏ qua cursor, trả trang đầu
   - C. `isError`: “cursor này thuộc một bộ lọc khác” — cursor mang vân tay bộ lọc

   <details><summary>Đáp án</summary>

   **C.** Không kiểm thì trang trả về là ghép vị trí của danh sách này với bộ lọc của danh sách khác — trông hợp lệ, nghĩa thì sai.

   </details>


---

## S5.5 · Cheat Sheet

### Keyset cursor

| Bước | Code |
|---|---|
| Khóa sắp xếp | `(createdAt, id)` — phải duy nhất |
| Trang | `page(filter, after, limit)` lấy `limit + 1`; có bản thứ `limit + 1` → `hasMore` |
| Mã hóa | `base64url(JSON {v: 1, c: createdAt, i: id, f: vân tay bộ lọc})` |
| Hết trang | `hasMore: false`, **không** có `nextCursor` |
| Cursor sai | `malformed` → “không hợp lệ”; `other_filter` → “thuộc bộ lọc khác” — cả hai `isError` |
| Mongo | `{$or: [{createdAt: {$gt: c}}, {createdAt: c, _id: {$gt: i}}]}` + sort `{createdAt: 1, _id: 1}` + index cùng thứ tự |

### 4 tool `tasks`

| Tool | Annotation | Ghi chú |
|---|---|---|
| `nexus_list_tasks` | `readOnlyHint` | lọc `status`, `assignee`, `customerId`, `dueBefore`; `limit ≤ 50`; cursor |
| `nexus_create_task` | ghi, không phá hủy | mới tạo luôn `todo`; kiểm `customerId` tồn tại |
| `nexus_update_task` | `idempotentHint` | chỉ field đổi; ≥ 1 thay đổi (`.refine`, đăng ký cả object); trả `changed` |
| `nexus_delete_task` | `destructiveHint` | cho việc tạo nhầm; việc xong thì `status: "done"` |

### Lệnh

```console
$ node scripts/call.ts nexus_list_tasks '{"assignee":"lan","status":"todo","limit":2}'
$ node scripts/call.ts nexus_update_task '{"id":"task_0002","status":"done"}'
$ node scripts/page-all.ts
```

### Pattern của session

| Pattern | Session | Tương đương C# / .NET | Dùng khi |
|---|---|---|---|
| Keyset cursor mờ + tool theo workflow | S5.5 | `WHERE (CreatedAt, Id) > (@c, @i)` + continuation token (Cosmos DB, Azure SDK `Pageable<T>`) | Danh sách dài, dữ liệu đổi khi đang duyệt; model chỉ cần chép cursor |



---

## S5.5 · Code

### Cây thư mục

```txt
nexus/
├─ packages/shared/src/task.ts                     TaskSchema, TaskIdSchema, 4 cặp I/O
├─ packages/shared/src/query.ts                    QUERY_COLLECTIONS + "tasks"
├─ apps/mcp-server/src/
│  ├─ tasks/repository.ts                          TaskKey, page/get/create/update/delete, afterKey, byKey
│  ├─ tasks/memory-repository.ts · mongo-repository.ts · seed-data.ts
│  ├─ tasks/cursor.ts                              encode/decode + vân tay bộ lọc
│  ├─ tools/list-tasks.ts · create-task.ts · update-task.ts · delete-task.ts
│  └─ query/catalog.ts                             + tasks
└─ apps/mcp-server/scripts/page-all.ts · smoke.ts
lesson-code/m5/
├─ traps/offset-paging.ts · keyset-no-tiebreak.ts · shape-drops-refine.ts
├─ tsc-traps/task-id-string.ts
└─ patterns/task-api.direct.ts
```

### packages/shared

`packages/shared/src/task.ts`

```ts
import { z } from "zod";
import { CustomerIdSchema } from "./customer.ts";

export const TASK_STATUSES = ["todo", "doing", "done"] as const;
export const TaskStatusSchema = z.enum(TASK_STATUSES);
export const TaskIdSchema = z.string().regex(/^task_\d{4,}$/, "id việc có dạng task_0042").brand<"TaskId">();
export type TaskId = z.infer<typeof TaskIdSchema>;
const DateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ngày dạng YYYY-MM-DD");
const Assignee = z.string().regex(/^[a-z][a-z0-9._-]{1,31}$/, "assignee là tên đăng nhập, ví dụ lan hoặc minh.tran");

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: TaskStatusSchema,
  assignee: z.string(),
  customerId: z.string().nullable(),
  dueDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Task = z.infer<typeof TaskSchema>;

// ---------- nexus_list_tasks: lọc theo cách người dùng hỏi + cursor ----------
export const ListTasksInputSchema = z.object({
  status: TaskStatusSchema.optional(),
  assignee: Assignee.optional().describe("Việc của ai"),
  customerId: CustomerIdSchema.optional(),
  dueBefore: DateOnly.optional().describe("Hạn trước ngày này (YYYY-MM-DD) — dùng cho \"việc quá hạn\""),
  cursor: z.string().max(200).optional().describe("nextCursor của trang trước; bỏ trống = trang đầu"),
  limit: z.number().int().min(1).max(50).default(20),
});
export const ListTasksOutputSchema = z.object({
  returned: z.number().int(),
  items: z.array(TaskSchema),
  hasMore: z.boolean().describe("false = đây là trang cuối"),
  nextCursor: z.string().optional().describe("Chỉ có khi hasMore = true; truyền nguyên văn vào lần gọi sau CÙNG bộ lọc"),
});

// ---------- nexus_create_task ----------
export const CreateTaskInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  assignee: Assignee,
  customerId: CustomerIdSchema.optional(),
  dueDate: DateOnly.optional(),
});
export const TaskResultSchema = z.object({ task: TaskSchema });

// ---------- nexus_update_task: đổi trạng thái, giao lại, dời hạn — 1 tool cho cả 3 việc ----------
export const UpdateTaskInputSchema = z
  .object({
    id: TaskIdSchema,
    status: TaskStatusSchema.optional().describe("done = hoàn thành"),
    assignee: Assignee.optional().describe("Giao lại cho người khác"),
    dueDate: DateOnly.nullable().optional().describe("Dời hạn; null = bỏ hạn"),
    title: z.string().trim().min(3).max(120).optional(),
  })
  .refine((v) => v.status !== undefined || v.assignee !== undefined || v.dueDate !== undefined || v.title !== undefined, {
    message: "cần ít nhất 1 thay đổi: status, assignee, dueDate hoặc title",
  });
export const UpdateTaskOutputSchema = z.object({ task: TaskSchema, changed: z.array(z.string()) });

// ---------- nexus_delete_task ----------
export const DeleteTaskInputSchema = z.object({ id: TaskIdSchema });
export const DeleteTaskOutputSchema = z.object({ id: z.string(), deleted: z.literal(true) });
```

### apps/mcp-server

`apps/mcp-server/src/tasks/repository.ts`

```ts
import type { Task, TaskId } from "@nexus/shared";

export interface TaskFilter {
  status?: Task["status"] | undefined;
  assignee?: string | undefined;
  customerId?: string | undefined;
  dueBefore?: string | undefined;
}
/** Khóa sắp xếp ổn định: createdAt có thể trùng (tạo hàng loạt) → thêm id để phân định. */
export interface TaskKey {
  createdAt: string;
  id: string;
}
export interface TaskPatch {
  status?: Task["status"] | undefined;
  assignee?: string | undefined;
  dueDate?: string | null | undefined;
  title?: string | undefined;
}

export interface TaskRepository {
  /** Keyset: trả các việc có (createdAt, id) > after, theo thứ tự tăng dần, tối đa limit. */
  page(filter: TaskFilter, after: TaskKey | undefined, limit: number): Promise<{ items: Task[]; hasMore: boolean }>;
  get(id: TaskId): Promise<Task | null>;
  create(input: { title: string; assignee: string; customerId?: string | undefined; dueDate?: string | undefined }): Promise<Task>;
  update(id: TaskId, patch: TaskPatch): Promise<{ task: Task; changed: string[] } | null>;
  delete(id: TaskId): Promise<boolean>;
}

export const keyOf = (t: Task): TaskKey => ({ createdAt: t.createdAt, id: t.id });
export const afterKey = (t: Task, k: TaskKey): boolean => t.createdAt > k.createdAt || (t.createdAt === k.createdAt && t.id > k.id);
export const byKey = (a: Task, b: Task): number => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);

export const matches = (t: Task, f: TaskFilter): boolean =>
  (f.status === undefined || t.status === f.status) &&
  (f.assignee === undefined || t.assignee === f.assignee) &&
  (f.customerId === undefined || t.customerId === f.customerId) &&
  (f.dueBefore === undefined || (t.dueDate !== null && t.dueDate < f.dueBefore));
```
`apps/mcp-server/src/tasks/memory-repository.ts`

```ts
import type { Task, TaskId } from "@nexus/shared";
import { afterKey, byKey, matches, type TaskPatch, type TaskRepository } from "./repository.ts";

export function createMemoryTaskRepository(seed: readonly Task[], now: () => Date = () => new Date()): TaskRepository {
  const rows = new Map(seed.map((t) => [t.id, { ...t }]));
  let seq = Math.max(0, ...seed.map((t) => Number(t.id.slice(5))));
  return {
    async page(filter, after, limit) {
      const hit = [...rows.values()].filter((t) => matches(t, filter) && (after === undefined || afterKey(t, after))).sort(byKey);
      return { items: hit.slice(0, limit).map((t) => ({ ...t })), hasMore: hit.length > limit };
    },
    async get(id: TaskId) {
      const t = rows.get(id);
      return t ? { ...t } : null;
    },
    async create(input) {
      const at = now().toISOString();
      const t: Task = {
        id: `task_${String(++seq).padStart(4, "0")}`,
        title: input.title,
        status: "todo",
        assignee: input.assignee,
        customerId: input.customerId ?? null,
        dueDate: input.dueDate ?? null,
        createdAt: at,
        updatedAt: at,
      };
      rows.set(t.id, t);
      return { ...t };
    },
    async update(id: TaskId, patch: TaskPatch) {
      const t = rows.get(id);
      if (!t) return null;
      const changed: string[] = [];
      for (const k of ["status", "assignee", "dueDate", "title"] as const) {
        const v = patch[k];
        if (v !== undefined && t[k] !== v) {
          Object.assign(t, { [k]: v });
          changed.push(k);
        }
      }
      if (changed.length > 0) t.updatedAt = now().toISOString();
      return { task: { ...t }, changed };
    },
    async delete(id: TaskId) {
      return rows.delete(id);
    },
  };
}
```
`apps/mcp-server/src/tasks/mongo-repository.ts`

```ts
import type { Task, TaskId } from "@nexus/shared";
import type { Db, Filter } from "mongodb";
import type { TaskFilter, TaskKey, TaskPatch, TaskRepository } from "./repository.ts";

type TaskDoc = Omit<Task, "id"> & { _id: string };
const toTask = ({ _id, ...rest }: TaskDoc): Task => ({ id: _id, ...rest });

/**
 * Bản Mongo — chưa chạy ở sandbox dựng bài (không có Mongo).
 * Index bắt buộc cho keyset: { createdAt: 1, _id: 1 } (+ { assignee: 1, createdAt: 1, _id: 1 } cho "việc của tôi").
 */
export function createMongoTaskRepository(db: Db): TaskRepository {
  const col = db.collection<TaskDoc>("tasks");
  const where = (f: TaskFilter, after: TaskKey | undefined): Filter<TaskDoc> => ({
    ...(f.status ? { status: f.status } : {}),
    ...(f.assignee ? { assignee: f.assignee } : {}),
    ...(f.customerId ? { customerId: f.customerId } : {}),
    ...(f.dueBefore ? { dueDate: { $ne: null, $lt: f.dueBefore } } : {}),
    ...(after
      ? { $or: [{ createdAt: { $gt: after.createdAt } }, { createdAt: after.createdAt, _id: { $gt: after.id } }] }
      : {}),
  });
  return {
    async page(filter, after, limit) {
      const docs = await col.find(where(filter, after)).sort({ createdAt: 1, _id: 1 }).limit(limit + 1).toArray();
      return { items: docs.slice(0, limit).map(toTask), hasMore: docs.length > limit };
    },
    async get(id: TaskId) {
      const d = await col.findOne({ _id: id });
      return d ? toTask(d) : null;
    },
    async create(input) {
      const at = new Date().toISOString();
      // Id tuần tự qua collection counters (findOneAndUpdate + $inc, upsert)
      const c = await db
        .collection<{ _id: string; seq: number }>("counters")
        .findOneAndUpdate({ _id: "tasks" }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" });
      const doc: TaskDoc = {
        _id: `task_${String(c?.seq ?? Date.now()).padStart(4, "0")}`,
        title: input.title,
        status: "todo",
        assignee: input.assignee,
        customerId: input.customerId ?? null,
        dueDate: input.dueDate ?? null,
        createdAt: at,
        updatedAt: at,
      };
      await col.insertOne(doc);
      return toTask(doc);
    },
    async update(id: TaskId, patch: TaskPatch) {
      const before = await col.findOne({ _id: id });
      if (!before) return null;
      const set: Partial<TaskDoc> = {};
      const changed: string[] = [];
      for (const k of ["status", "assignee", "dueDate", "title"] as const) {
        const v = patch[k];
        if (v !== undefined && before[k] !== v) {
          Object.assign(set, { [k]: v });
          changed.push(k);
        }
      }
      if (changed.length === 0) return { task: toTask(before), changed };
      const after = await col.findOneAndUpdate({ _id: id }, { $set: { ...set, updatedAt: new Date().toISOString() } }, { returnDocument: "after" });
      return after ? { task: toTask(after), changed } : null;
    },
    async delete(id: TaskId) {
      return (await col.deleteOne({ _id: id })).deletedCount === 1;
    },
  };
}
```
`apps/mcp-server/src/tasks/seed-data.ts`

```ts
import type { Task } from "@nexus/shared";

const ASSIGNEES = ["lan", "minh", "hoa", "tuan", "linh"] as const;
const VERBS = ["Gọi lại", "Gửi báo giá cho", "Gia hạn hợp đồng", "Xử lý ticket của", "Đối soát công nợ"] as const;

/** n việc; mỗi 5 việc tạo CÙNG 1 thời điểm (import hàng loạt) → createdAt trùng nhau là chuyện thật. */
export function seedTasks(n = 1_000): Task[] {
  const base = Date.UTC(2026, 6, 1);
  return Array.from({ length: n }, (_, i) => {
    const at = new Date(base + Math.floor(i / 5) * 60_000).toISOString();
    const cus = `cus_${String((i % 30) + 1).padStart(3, "0")}`;
    return {
      id: `task_${String(i + 1).padStart(4, "0")}`,
      title: `${VERBS[i % VERBS.length]} ${cus}`,
      status: i % 7 === 0 ? "done" : i % 3 === 0 ? "doing" : "todo",
      assignee: ASSIGNEES[i % ASSIGNEES.length] ?? "lan",
      customerId: i % 4 === 0 ? null : cus,
      dueDate: i % 6 === 0 ? null : new Date(base + (i % 90) * 86_400_000).toISOString().slice(0, 10),
      createdAt: at,
      updatedAt: at,
    };
  });
}
```
`apps/mcp-server/src/tasks/cursor.ts`

```ts
import { createHash } from "node:crypto";
import { z } from "zod";
import type { TaskFilter, TaskKey } from "./repository.ts";

/**
 * Cursor mờ (opaque) cho keyset pagination (M5 · S5.5).
 * Bên trong: vị trí cuối trang trước + dấu vân tay của bộ lọc. Model chỉ việc chép nguyên văn.
 * Không phải số trang/offset: chèn/xóa giữa chừng không làm trùng hay sót bản ghi còn tồn tại.
 * (M6 · S6.4 thêm hạn dùng + chữ ký để phân biệt cursor hết hạn với cursor bị sửa.)
 */
const CursorBody = z.object({ v: z.literal(1), c: z.string(), i: z.string(), f: z.string() });

export function filterFingerprint(f: TaskFilter): string {
  const stable = JSON.stringify([f.status ?? null, f.assignee ?? null, f.customerId ?? null, f.dueBefore ?? null]);
  return createHash("sha256").update(stable).digest("base64url").slice(0, 12);
}

export function encodeCursor(last: TaskKey, f: TaskFilter): string {
  return Buffer.from(JSON.stringify({ v: 1, c: last.createdAt, i: last.id, f: filterFingerprint(f) })).toString("base64url");
}

export type Decoded = { ok: true; after: TaskKey } | { ok: false; reason: "malformed" | "other_filter" };

export function decodeCursor(raw: string, f: TaskFilter): Decoded {
  let body: unknown;
  try {
    body = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  const p = CursorBody.safeParse(body);
  if (!p.success) return { ok: false, reason: "malformed" };
  if (p.data.f !== filterFingerprint(f)) return { ok: false, reason: "other_filter" };
  return { ok: true, after: { createdAt: p.data.c, id: p.data.i } };
}
```
`apps/mcp-server/src/tools/list-tasks.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListTasksInputSchema, ListTasksOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { decodeCursor, encodeCursor } from "../tasks/cursor.ts";
import { keyOf } from "../tasks/repository.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerListTasks(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.listTasks,
    {
      title: "Danh sách việc",
      description:
        "Việc nội bộ, lọc theo trạng thái, người phụ trách, khách, hạn (dueBefore cho \"việc quá hạn\"). Trả theo trang. " +
        "hasMore=true thì gọi lại với cursor = nextCursor và GIỮ NGUYÊN bộ lọc; hasMore=false là hết, không gọi tiếp.",
      inputSchema: ListTasksInputSchema.shape,
      outputSchema: ListTasksOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.listTasks, deps.log, async ({ cursor, limit, ...filter }) => {
      let after;
      if (cursor !== undefined) {
        const d = decodeCursor(cursor, filter);
        if (!d.ok) {
          return d.reason === "other_filter"
            ? toolFail({ what: "cursor này thuộc một bộ lọc khác.", next: "Gọi lại với đúng bộ lọc của trang trước, hoặc bỏ cursor để bắt đầu từ trang đầu." })
            : toolFail({ what: "cursor không hợp lệ.", next: "Chép nguyên văn nextCursor của trang trước, hoặc bỏ cursor để bắt đầu từ trang đầu." });
        }
        after = d.after;
      }
      const page = await deps.tasks.page(filter, after, limit);
      const last = page.items.at(-1);
      return toolOk(ListTasksOutputSchema, {
        returned: page.items.length,
        items: page.items,
        hasMore: page.hasMore,
        ...(page.hasMore && last ? { nextCursor: encodeCursor(keyOf(last), filter) } : {}),
      });
    }),
  );
}
```
`apps/mcp-server/src/tools/create-task.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CreateTaskInputSchema, TaskResultSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerCreateTask(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.createTask,
    {
      title: "Giao việc",
      description: "Tạo 1 việc mới (trạng thái todo) giao cho 1 người, có thể gắn khách và hạn. Gọi khi người dùng muốn giao/ghi nhận việc cần làm.",
      inputSchema: CreateTaskInputSchema.shape,
      outputSchema: TaskResultSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    instrument(TOOL.createTask, deps.log, async ({ title, assignee, customerId, dueDate }) => {
      if (customerId !== undefined && !(await deps.customers.get(customerId))) {
        return toolFail({ what: `Không có khách hàng ${customerId}.`, next: "Lấy id đúng bằng nexus_search_customers, hoặc tạo việc không gắn khách." });
      }
      const task = await deps.tasks.create({ title, assignee, customerId, dueDate });
      return toolOk(TaskResultSchema, { task });
    }),
  );
}
```
`apps/mcp-server/src/tools/update-task.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL, UpdateTaskInputSchema, UpdateTaskOutputSchema } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerUpdateTask(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.updateTask,
    {
      title: "Cập nhật việc",
      description:
        "Hoàn thành (status=done), chuyển trạng thái, giao lại (assignee), dời hạn (dueDate; null = bỏ hạn) hoặc sửa tiêu đề 1 việc. " +
        "Chỉ gửi field cần đổi. Kết quả có changed = các field thực sự đổi.",
      // Cả object (không phải .shape): giữ .refine "cần ít nhất 1 thay đổi" — .shape làm rơi refine
      inputSchema: UpdateTaskInputSchema,
      outputSchema: UpdateTaskOutputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    instrument(TOOL.updateTask, deps.log, async ({ id, ...patch }) => {
      const r = await deps.tasks.update(id, patch);
      if (!r) return toolFail({ what: `Không có việc ${id}.`, next: "Tìm id bằng nexus_list_tasks." });
      return toolOk(UpdateTaskOutputSchema, r);
    }),
  );
}
```
`apps/mcp-server/src/tools/delete-task.ts`

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DeleteTaskInputSchema, DeleteTaskOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerDeleteTask(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.deleteTask,
    {
      title: "Xóa việc",
      description: "Xóa vĩnh viễn 1 việc tạo nhầm. Việc đã làm xong thì dùng nexus_update_task status=done, KHÔNG xóa.",
      inputSchema: DeleteTaskInputSchema.shape,
      outputSchema: DeleteTaskOutputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    instrument(TOOL.deleteTask, deps.log, async ({ id }) => {
      if (!(await deps.tasks.delete(id))) return toolFail({ what: `Không có việc ${id} để xóa.`, next: "Tìm id bằng nexus_list_tasks." });
      return toolOk(DeleteTaskOutputSchema, { id, deleted: true });
    }),
  );
}
```

### scripts

`apps/mcp-server/scripts/page-all.ts`

```ts
// node scripts/page-all.ts — duyệt 1000 việc qua nexus_list_tasks bằng cursor (server thật, stdio): không trùng, không sót.
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { TOOL, type Task } from "@nexus/shared";
import { connect } from "./client.ts";

interface Page {
  items: Task[];
  hasMore: boolean;
  nextCursor?: string;
}

async function call(c: Client, name: string, args: Record<string, unknown>): Promise<CallToolResult> {
  return (await c.callTool({ name, arguments: args })) as CallToolResult;
}
async function page(c: Client, args: Record<string, unknown>): Promise<Page> {
  const r = await call(c, TOOL.listTasks, args);
  if (r.isError) throw new Error(r.content.map((x) => (x.type === "text" ? x.text : "")).join(""));
  return r.structuredContent as unknown as Page;
}

/** Đi hết các trang; onPage chạy sau mỗi trang (để chen thay đổi vào giữa chừng). */
async function walk(c: Client, filter: Record<string, unknown>, limit: number, onPage?: (n: number) => Promise<void>): Promise<{ ids: string[]; pages: number; lastHasCursor: boolean }> {
  const ids: string[] = [];
  let cursor: string | undefined;
  let pages = 0;
  for (;;) {
    const p = await page(c, { ...filter, limit, ...(cursor ? { cursor } : {}) });
    pages++;
    ids.push(...p.items.map((t) => t.id));
    await onPage?.(pages);
    if (!p.hasMore) return { ids, pages, lastHasCursor: p.nextCursor !== undefined };
    cursor = p.nextCursor;
  }
}

const report = (label: string, ids: string[], expected: ReadonlySet<string>): void => {
  const seen = new Set(ids);
  const dup = ids.length - seen.size;
  const missing = [...expected].filter((id) => !seen.has(id)).length;
  console.log(`${dup === 0 && missing === 0 ? "✓" : "✗"} ${label}: nhận ${ids.length} · trùng ${dup} · sót ${missing}`);
};

const c = await connect();

// 1 · Duyệt hết, không lọc
const t0 = performance.now();
const all = await walk(c, {}, 37);
const universe = new Set(all.ids);
console.log(`1 · không lọc, limit 37: ${all.pages} trang · ${Math.round(performance.now() - t0)} ms · trang cuối có nextCursor: ${all.lastHasCursor}`);
report("   so với 1000 id task_0001…task_1000", all.ids, new Set(Array.from({ length: 1000 }, (_, i) => `task_${String(i + 1).padStart(4, "0")}`)));

// 2 · Có lọc — đối chiếu với nexus_query (đếm bằng matched)
const filter = { assignee: "lan", status: "todo" };
const lan = await walk(c, filter, 10);
const q = await call(c, TOOL.query, { collection: "tasks", filter, limit: 1 });
console.log(`2 · lọc ${JSON.stringify(filter)}: ${lan.pages} trang · ${lan.ids.length} việc · nexus_query matched = ${(q.structuredContent as { matched: number }).matched}`);

// 3 · Dữ liệu đổi GIỮA lúc duyệt: sau trang 2 xóa 3 việc đã đọc + 3 việc chưa đọc, tạo 4 việc mới
const deleted = ["task_0001", "task_0010", "task_0020", "task_0500", "task_0750", "task_0999"];
const created: string[] = [];
const live = await walk(c, {}, 50, async (n) => {
  if (n !== 2) return;
  for (const id of deleted) await call(c, TOOL.deleteTask, { id });
  for (let i = 0; i < 4; i++) {
    const r = await call(c, TOOL.createTask, { title: `Việc mới ${i + 1} trong lúc duyệt`, assignee: "minh" });
    created.push((r.structuredContent as { task: Task }).task.id);
  }
});
const stillThere = new Set([...universe].filter((id) => !deleted.slice(3).includes(id)));
for (const id of created) stillThere.add(id);
report(`3 · xóa ${deleted.length} + tạo ${created.length} giữa chừng (limit 50)`, live.ids, stillThere);

// 4 · Cursor sai
const first = await page(c, { limit: 5 });
const bad = await call(c, TOOL.listTasks, { limit: 5, cursor: `${first.nextCursor ?? ""}x` });
const other = await call(c, TOOL.listTasks, { limit: 5, status: "done", ...(first.nextCursor ? { cursor: first.nextCursor } : {}) });
const text = (r: CallToolResult): string => r.content.map((x) => (x.type === "text" ? x.text : "")).join("");
console.log(`4 · cursor bị sửa 1 ký tự → ${bad.isError ? "[isError] " : ""}${text(bad)}`);
console.log(`    cursor của bộ lọc khác  → ${other.isError ? "[isError] " : ""}${text(other)}`);
console.log(`    nextCursor trông thế này: ${first.nextCursor}`);
await c.close();
```
`apps/mcp-server/scripts/smoke.ts`

```ts
// pnpm smoke — server thật + client thật qua InMemoryTransport, dữ liệu RAM. Thoát 1 nếu có ✗.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ResourceUpdatedNotificationSchema, type CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { PROMPT, RESOURCE, TOOL, customerUri } from "@nexus/shared";
import { createMemoryCustomerRepository } from "../src/customers/memory-repository.ts";
import { seedCustomers } from "../src/customers/seed-data.ts";
import { helpdeskFromEnv, memoryQueryStore, type Deps } from "../src/deps.ts";
import { createMemoryOrderRepository } from "../src/orders/repository.ts";
import { createMemoryTaskRepository } from "../src/tasks/memory-repository.ts";
import { seedTasks } from "../src/tasks/seed-data.ts";
import { seedOrders } from "../src/orders/seed-data.ts";
import { createLogger } from "../src/log.ts";
import { createRatesClient } from "../src/rates/client.ts";
import { createServer } from "../src/server.ts";
import { openRoot } from "../src/files/safe-path.ts";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

let failed = 0;
const ok = (cond: boolean, msg: string): void => {
  if (!cond) failed++;
  console.log(`${cond ? "✓" : "✗"} ${msg}`);
};

const seed = seedCustomers();
const customers = createMemoryCustomerRepository(seed);
const orders = createMemoryOrderRepository(seedOrders(seed));
const tasks = createMemoryTaskRepository(seedTasks());
const deps: Deps = {
  log: createLogger("error"),
  customers,
  orders,
  tasks,
  query: memoryQueryStore(customers, orders, tasks),
  helpdesk: helpdeskFromEnv({ HELPDESK_URL: "http://127.0.0.1:9", HELPDESK_TOKEN: undefined }, createLogger("error")),
  rates: createRatesClient("http://127.0.0.1:9", 500),
  exportsDir: await openRoot(await mkdtemp(path.join(tmpdir(), "nexus-smoke-"))),
  close: async () => undefined,
};
const server = createServer(deps);
const [ct, st] = InMemoryTransport.createLinkedPair();
await server.connect(st);
const client = new Client({ name: "smoke", version: "1.0.0" });
await client.connect(ct);

const { tools } = await client.listTools();
console.log(`tools (${tools.length}): ${tools.map((t) => t.name).join(", ")}`);
const noOut = tools.filter((t) => t.name !== TOOL.chartCustomersByCity && !t.outputSchema).map((t) => t.name);
ok(noOut.length === 0, `mọi tool có outputSchema${noOut.length ? ` — thiếu: ${noOut.join(", ")}` : ""}`);
ok(tools.every((t) => t.annotations?.readOnlyHint !== undefined), "mọi tool có readOnlyHint");

const call = async (name: string, args: Record<string, unknown>): Promise<CallToolResult> =>
  (await client.callTool({ name, arguments: args })) as CallToolResult;
const hn = await call(TOOL.listCustomers, { city: "Hà Nội" });
ok((hn.structuredContent as { total?: number } | undefined)?.total === 12, "nexus_list_customers Hà Nội → total 12");

const { resources } = await client.listResources();
ok(resources.some((r) => r.uri === RESOURCE.glossary), `resources/list (${resources.length}) có ${RESOURCE.glossary}`);
const g = await client.readResource({ uri: RESOURCE.glossary });
const gText = g.contents[0] && "text" in g.contents[0] ? g.contents[0].text : "";
ok(gText.length > 500, `resources/read glossary → ${gText.length} ký tự`);

const p = await client.getPrompt({ name: PROMPT.weeklySummary, arguments: { team: "sales" } });
ok(p.messages.length === 2, `prompts/get ${PROMPT.weeklySummary} → ${p.messages.length} message`);

const got: string[] = [];
client.setNotificationHandler(ResourceUpdatedNotificationSchema, (n) => {
  got.push(n.params.uri);
});
await client.subscribeResource({ uri: customerUri("cus_007") });
await call(TOOL.updateCustomerTier, { id: "cus_007", tier: "enterprise" });
await new Promise((r) => setTimeout(r, 20));
ok(got.includes(customerUri("cus_007")), "subscribe cus_007 + đổi gói → updated");
await client.unsubscribeResource({ uri: customerUri("cus_007") });
await call(TOOL.updateCustomerTier, { id: "cus_007", tier: "pro" });
await new Promise((r) => setTimeout(r, 20));
ok(got.length === 1, "unsubscribe → im lặng");

// ---------- M5 ----------
const text = (r: CallToolResult): string => r.content.map((c) => (c.type === "text" ? c.text : "")).join("");
const trav = await call(TOOL.readExport, { path: "../../etc/passwd" });
ok(trav.isError === true && !text(trav).includes("root:"), "nexus_read_export ../../etc/passwd → bị chặn");
const where = await call(TOOL.query, { collection: "customers", filter: { $where: "1" } });
ok(where.isError === true, "nexus_query $where → bị từ chối");
const rev = await call(TOOL.revenueBy, { by: "product" });
ok((rev.structuredContent as { totalRevenue?: number } | undefined)?.totalRevenue === 9_072_400_000, "nexus_revenue_by product → tổng 9.072.400.000");
let cursor: string | undefined;
let seen = 0;
for (;;) {
  const p = (await call(TOOL.listTasks, { limit: 50, ...(cursor ? { cursor } : {}) })).structuredContent as { returned: number; hasMore: boolean; nextCursor?: string };
  seen += p.returned;
  if (!p.hasMore) break;
  cursor = p.nextCursor;
}
ok(seen === 1000, `nexus_list_tasks qua cursor → ${seen} việc`);
const { resources: all } = await client.listResources();
ok(all.some((r) => r.uri === RESOURCE.schema), "resources/list có nexus://schema");

await client.close();
await server.close();
console.log(failed === 0 ? "smoke: OK" : `smoke: ${failed} lỗi`);
process.exit(failed === 0 ? 0 : 1);
```

### lesson-code

`lesson-code/m5/traps/offset-paging.ts`

```ts
// Bẫy 1 (S5.5) — dịch thẳng Skip((page-1)*size).Take(size): dữ liệu đổi giữa lúc duyệt là trùng / sót.
import type { Task } from "../../../nexus/packages/shared/src/index.ts";
import { seedTasks } from "../../../nexus/apps/mcp-server/src/tasks/seed-data.ts";

function scenario(order: "cũ → mới" | "mới → cũ"): void {
  let rows: Task[] = seedTasks(1_000);
  const sort = (): Task[] => [...rows].sort((a, b) => (order === "cũ → mới" ? 1 : -1) * (a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)));
  const seen: string[] = [];
  const size = 50;
  for (let p = 1; ; p++) {
    const items = sort().slice((p - 1) * size, p * size); // offset = (page - 1) * size
    seen.push(...items.map((t) => t.id));
    if (p === 2) {
      // Giống hệt kịch bản 3 của page-all.ts: xóa 3 việc đã đọc + 3 chưa đọc, tạo 4 việc mới
      const del = new Set(["task_0001", "task_0010", "task_0020", "task_0500", "task_0750", "task_0999"]);
      rows = rows.filter((t) => !del.has(t.id));
      for (let i = 0; i < 4; i++) {
        const at = new Date(Date.UTC(2026, 9, 1, 0, i)).toISOString();
        rows.push({ id: `task_${1001 + i}`, title: "mới", status: "todo", assignee: "minh", customerId: null, dueDate: null, createdAt: at, updatedAt: at });
      }
    }
    if (items.length < size) break;
  }
  const expected = new Set(rows.map((t) => t.id).concat(["task_0001", "task_0010", "task_0020"]));
  const set = new Set(seen);
  const missing = [...expected].filter((id) => !set.has(id));
  console.log(`offset, sắp ${order}: nhận ${seen.length} · trùng ${seen.length - set.size} · sót ${missing.length}${missing.length ? ` (vd ${missing.slice(0, 3).join(", ")})` : ""}`);
}

scenario("cũ → mới");
scenario("mới → cũ");
```
`lesson-code/m5/traps/keyset-no-tiebreak.ts`

```ts
// Bẫy 2 (S5.5) — keyset chỉ theo createdAt ("WHERE createdAt > @last"): 5 việc tạo cùng 1 thời điểm → sót.
import { seedTasks } from "../../../nexus/apps/mcp-server/src/tasks/seed-data.ts";

const rows = seedTasks(1_000).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
for (const limit of [37, 50]) {
  const seen = new Set<string>();
  let last: string | undefined;
  for (;;) {
    const items = rows.filter((t) => last === undefined || t.createdAt > last).slice(0, limit);
    items.forEach((t) => seen.add(t.id));
    if (items.length < limit) break;
    last = items.at(-1)?.createdAt;
  }
  console.log(`limit ${limit}: nhận ${seen.size}/1000 — sót ${1000 - seen.size}`);
}
console.log(`createdAt trùng nhau: ${rows.length - new Set(rows.map((t) => t.createdAt)).size} việc có thời điểm tạo trùng việc khác`);
```
`lesson-code/m5/traps/shape-drops-refine.ts`

```ts
// Bẫy 3 (S5.5) — registerTool({ inputSchema: Schema.shape }) làm rơi .refine của object.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { UpdateTaskInputSchema } from "../../../nexus/packages/shared/src/index.ts";

const server = new McpServer({ name: "trap", version: "1.0.0" });
server.registerTool("update_shape", { inputSchema: UpdateTaskInputSchema.shape }, async (args) => ({
  content: [{ type: "text", text: `handler CHẠY với ${JSON.stringify(args)} — không có gì để đổi` }],
}));
server.registerTool("update_object", { inputSchema: UpdateTaskInputSchema }, async (args) => ({
  content: [{ type: "text", text: `handler chạy với ${JSON.stringify(args)}` }],
}));
const [a, b] = InMemoryTransport.createLinkedPair();
await server.connect(b);
const client = new Client({ name: "c", version: "1" });
await client.connect(a);
for (const name of ["update_shape", "update_object"]) {
  const r = (await client.callTool({ name, arguments: { id: "task_0042" } })) as CallToolResult;
  console.log(`${name.padEnd(14)} → ${r.isError ? "[isError] " : ""}${r.content.map((c) => (c.type === "text" ? c.text : "")).join("")}`);
}
await client.close();
```
`lesson-code/m5/patterns/task-api.direct.ts`

```ts
// Dịch thẳng từ C#: TasksController 1:1 thành tool — đủ "độ phủ API", phân trang page/pageSize.
export interface TaskDto {
  id: string;
  title: string;
  status: "todo" | "doing" | "done";
  assignee: string;
  customerId: string | null;
  dueDate: string | null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface JsonPatchOp {
  op: "replace" | "add" | "remove";
  path: string;
  value?: unknown;
}

/** 7 tool cho model chọn, mỗi tool = 1 action của controller. */
export const TASK_TOOLS = [
  { name: "get_task", input: ["id"] },
  { name: "get_tasks", input: ["page", "pageSize", "sortBy", "sortDir", "status", "assignee"] },
  { name: "post_task", input: ["title", "status", "assignee", "customerId", "dueDate"] },
  { name: "put_task", input: ["id", "title", "status", "assignee", "customerId", "dueDate"] },
  { name: "patch_task", input: ["id", "operations: JsonPatchOp[]"] },
  { name: "delete_task", input: ["id"] },
  { name: "count_tasks", input: ["status", "assignee"] },
] as const;

export function paginate<T>(rows: readonly T[], page: number, pageSize: number): PagedResult<T> {
  return {
    items: rows.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    totalCount: rows.length,
    totalPages: Math.ceil(rows.length / pageSize),
  };
}
```

---

## Kiểm tra cuối — Module 5

Hai phần: trắc nghiệm chấm theo session (qua khi **mọi** session ≥ 80%), và thực hành trên repo Nexus của bạn. Câu hỏi khác với 3 câu cuối mỗi session.

### Trắc nghiệm S5.1 — File & path traversal

1. `path.resolve("/srv/exports", "/etc/passwd")` trả gì?
   - A. `/srv/exports/etc/passwd`
   - B. `/etc/passwd` — input tuyệt đối thắng, root bị bỏ
   - C. Ném lỗi vì input tuyệt đối
   - D. `/srv/exports`

   <details><summary>Đáp án</summary>

   **B.** Vì vậy “chuẩn hóa” không phải “kiểm”: sau `resolve` vẫn phải so với root. `path.join` thì cho `/srv/exports/etc/passwd`.

   </details>

2. `nexus_list_exports` lọc bằng `Dirent.isFile()` từ `readdir(..., { withFileTypes: true })`. Vì sao không dùng `stat(p).isFile()`?
   - A. `stat` đi theo symlink nên symlink tới file thật cũng là “file”; `Dirent.isFile()` là `false` với symlink
   - B. `stat` chậm hơn
   - C. `Dirent` không có trên Linux
   - D. Không khác nhau

   <details><summary>Đáp án</summary>

   **A.** Liệt kê symlink là mời model đọc nó. `lstat` cũng đúng; `stat` thì sai.

   </details>

3. Root cấu hình là `/var/folders/x/exports` trên macOS. Không `realpath` root lúc khởi động thì sao?
   - A. Không sao, macOS không có symlink
   - B. `realpath` của mọi file trả `/private/var/...` — không nằm trong `/var/...` theo chữ, mọi file hợp lệ bị coi là “ngoài”
   - C. Mọi path tấn công lọt qua
   - D. Node tự sửa

   <details><summary>Đáp án</summary>

   **B.** So 2 đường dẫn thì cả 2 phải cùng là đường dẫn thật. `openRoot` làm việc đó 1 lần.

   </details>

4. Tại sao text lỗi trả model chỉ nói “nằm ngoài thư mục export”, còn lý do chi tiết (`symlink trỏ ra ngoài…`) chỉ ra stderr?
   - A. Model chép text lỗi cho người dùng; chi tiết giúp kẻ tấn công dò cấu trúc server. Người vận hành đọc stderr
   - B. Vì stderr nhanh hơn
   - C. Vì MCP cấm text dài trong `isError`
   - D. Để tiết kiệm token

   <details><summary>Đáp án</summary>

   **A.** Lỗi cho model ≠ lỗi cho người vận hành. Lỗi bảo mật là sự kiện cần ghi lại, không phải gợi ý cho bên tấn công.

   </details>

### Trắc nghiệm S5.2 — DB chỉ đọc & schema

1. `$regex` có trong allow-list. Vì sao `{"name": {"$regex": "^(a+)+$"}}` vẫn bị chặn?
   - A. Vì regex có ký tự `^`
   - B. Lượng từ lồng nhau `(a+)+` là mẫu ReDoS; `RegExp` của JS không có timeout
   - C. Vì `$regex` chỉ dùng được với `$options`
   - D. Vì tên field sai

   <details><summary>Đáp án</summary>

   **B.** Allow-list toán tử chưa đủ — giá trị của toán tử cũng là input. `maxTimeMS` của Mongo là lưới cuối.

   </details>

2. Thêm field `phone` vào `CustomerSchema`. Phải sửa gì để guard cho filter theo `phone` và `nexus://schema` có dòng `phone`?
   - A. Không gì cả — `catalog.ts` sinh cả 2 từ Zod schema
   - B. Thêm `phone` vào danh sách field của guard
   - C. Sửa file markdown của resource
   - D. Thêm `phone` vào `ALLOWED_FIELD_OPS`

   <details><summary>Đáp án</summary>

   **A.** 1 nguồn sự thật. (Câu hỏi khác: có nên cho LLM lọc theo số điện thoại không — đó là chuyện quyền riêng tư, bài thực hành 2.)

   </details>

3. Store Mongo dùng `readPreference: "secondaryPreferred"` và `maxTimeMS: 2000`. Mục đích?
   - A. Để đọc dữ liệu mới nhất
   - B. Truy vấn do LLM viết không lường trước được: đẩy sang secondary và cắt truy vấn chậm, không kéo sập primary
   - C. Bắt buộc với user role `read`
   - D. Để bật change stream

   <details><summary>Đáp án</summary>

   **B.** Read-only không chỉ là “không ghi” mà còn “không làm chậm phần ghi”. (Phần Mongo chưa chạy ở sandbox.)

   </details>

4. Filter `{"city": {"name": "Hà Nội"}}` (object con không có toán tử). Nexus làm gì?
   - A. Coi là `city == "Hà Nội"`
   - B. So khớp nguyên object như Mongo
   - C. Từ chối: “so khớp nguyên object con không được hỗ trợ — dùng toán tử”
   - D. Bỏ qua điều kiện đó

   <details><summary>Đáp án</summary>

   **C.** Mongo so khớp nguyên object con theo thứ tự field — dễ ra 0 kết quả mà model tưởng “không có ai”. Từ chối rõ ràng tốt hơn kết quả rỗng sai.

   </details>

### Trắc nghiệm S5.3 — REST & rate limit

1. Kịch bản 3 (đo thật): `Retry-After` dạng HTTP-date, tool vẫn trả dữ liệu nhưng helpdesk thấy 2 lần 429. Vì sao?
   - A. HTTP-date chỉ chính xác tới giây — client chờ phần lẻ rồi gọi lại hơi sớm, ăn thêm 1 lần 429, lần sau mới qua
   - B. Client không parse được HTTP-date nên chờ 0 ms mãi
   - C. Stub trả sai giờ
   - D. Do jitter

   <details><summary>Đáp án</summary>

   **A.** Không sai, nhưng là lý do `maxAttempts` phải > 2 và ngân sách phải đủ cho vài lần chờ.

   </details>

2. Helpdesk trả `401`. `api-client` thử lại mấy lần (kịch bản 4, đo thật)?
   - A. 4 lần theo `maxAttempts`
   - B. 1 lần sau khi chờ backoff
   - C. 0 — `401` không đổi khi thử lại; helpdesk thấy đúng 1 request, tool báo “cấu hình quyền truy cập”
   - D. Thử tới hết ngân sách

   <details><summary>Đáp án</summary>

   **C.** Chỉ thử lại thứ có thể tự hết: 429, 503, lỗi mạng, 5xx (khi an toàn).

   </details>

3. Vì sao mỗi lần thử, `api-client` tạo signal mới bằng `AbortSignal.any([...])` thay vì truyền thẳng 1 signal cho mọi `fetch`?
   - A. Mỗi `fetch` gắn 1 listener `abort` vào signal được truyền; dùng chung 1 signal cho nhiều lần gọi làm listener tích tụ (`MaxListenersExceededWarning`)
   - B. `AbortSignal` chỉ dùng được 1 lần
   - C. Để mỗi lần thử có timeout riêng — không liên quan listener
   - D. `fetch` không nhận signal ngoài

   <details><summary>Đáp án</summary>

   **A.** Bẫy 1 cho thấy cả hai vấn đề: dội 6220 request và cảnh báo rò 1500+ listener. Timeout riêng từng lần cũng là lý do thứ hai.

   </details>

4. Công ty chuyển helpdesk sang nhà cung cấp khác. Sửa những file nào?
   - A. Mọi tool liên quan ticket
   - B. 1 adapter mới implement `HelpdeskPort` + 1 dòng ghép ở `deps.ts`; `src/tools` không đổi
   - C. `packages/shared/src/helpdesk.ts`
   - D. `api-client.ts`

   <details><summary>Đáp án</summary>

   **B.** Kiểu dữ liệu của tool là của Nexus; hình dạng của vendor chỉ sống trong adapter.

   </details>

### Trắc nghiệm S5.4 — Tổng hợp & ngân sách

1. `nexus_analyze_export` (CSV) và `nexus_revenue_by` (DB) cùng ra 9.072.400.000. Điều đó chứng minh gì?
   - A. 2 đường độc lập (parse CSV vs tổng hợp ở nguồn) dùng cùng định nghĩa “doanh thu = đơn paid” và cùng đúng — kiểm chéo
   - B. CSV và DB là cùng 1 file
   - C. Không chứng minh gì
   - D. Tool CSV gọi tool DB

   <details><summary>Đáp án</summary>

   **A.** Khi 2 con số lệch, 1 trong 2 đường sai (split, `Number`, múi giờ…) — đó là cách bắt Bẫy 2–3 trong dữ liệu thật.

   </details>

2. Ai đó nâng `maxBytes` của `nexus_read_export` lên 128 000. Chuyện gì xảy ra khi chạy `pnpm check`?
   - A. Không gì, schema chỉ là gợi ý
   - B. `size-audit` đỏ: 32 KB đã ≈ 6 000 token (≈ 12 000 nếu host gửi cả structured), 128 KB vượt 25 000
   - C. tsc báo lỗi
   - D. Smoke đỏ

   <details><summary>Đáp án</summary>

   **B.** Trần nằm trong schema; ngân sách được đo bằng test chạy trên dữ liệu xấu nhất.

   </details>

3. Vì sao pipeline Mongo của `revenueBy` mở đầu bằng `{ $match: { status: "paid" } }`?
   - A. Lọc sớm để dùng index và giảm số document đi vào `$group`
   - B. Mongo bắt buộc `$match` đứng đầu
   - C. Để đổi múi giờ
   - D. Để `$group` chạy song song

   <details><summary>Đáp án</summary>

   **A.** Cùng nguyên tắc với `WHERE` trước `GROUP BY` — M10 đo bằng `explain`.

   </details>

4. Người dùng hỏi “5 đơn mới nhất của cus_007”. Tool nào, trả gì?
   - A. `nexus_revenue_by {by: "product"}`
   - B. `nexus_find_orders {customerId: "cus_007", sample: 5}` — `matched`, `totalAmount` và 5 đơn mẫu mới nhất
   - C. `nexus_query` không giới hạn
   - D. `nexus_read_export`

   <details><summary>Đáp án</summary>

   **B.** Xem từng bản ghi thì trả mẫu có trần; không trả cả danh sách.

   </details>

### Trắc nghiệm S5.5 — CRUD & cursor

1. Vì sao `nexus_list_tasks` không trả `total`?
   - A. Đếm cả collection mỗi trang là tốn; model cần đếm thì dùng `nexus_query` (`matched`)
   - B. Vì MCP cấm field `total`
   - C. Vì cursor đã chứa tổng
   - D. Vì tổng luôn là 1000

   <details><summary>Đáp án</summary>

   **A.** Tách việc: phân trang để duyệt, `nexus_query` để đếm (S5.2).

   </details>

2. Offset pagination sắp “mới nhất trước”, có 4 việc mới được tạo sau khi đã đọc 2 trang. Kết quả thật?
   - A. Không ảnh hưởng vì việc mới nằm cuối
   - B. Trùng 3 và sót 7 — việc mới chen lên đầu đẩy mọi thứ xuống, cộng thêm 3 việc bị xóa
   - C. Chỉ sót 4 việc mới
   - D. Lỗi runtime

   <details><summary>Đáp án</summary>

   **B.** Keyset cùng kịch bản: 0 trùng, 0 sót.

   </details>

3. Cursor của Nexus là base64url của JSON đọc được. Có cần mã hóa/ký nó ngay ở M5 không?
   - A. Có — cursor là bí mật
   - B. Không bắt buộc: cursor không chứa dữ liệu nhạy cảm, sửa cursor bị bắt bởi kiểm hình dạng + vân tay bộ lọc; M6 thêm chữ ký và hạn dùng để phân biệt “bị sửa” với “hết hạn”
   - C. Không bao giờ cần
   - D. Phải dùng JWT

   <details><summary>Đáp án</summary>

   **B.** Mờ là để model không tự tính trang, không phải để giấu.

   </details>

4. “Dời hạn việc task_0042 sang 12/10 và giao cho Minh” — model gọi gì?
   - A. `nexus_update_task {"id":"task_0042","dueDate":"2026-10-12","assignee":"minh"}` — 1 lời gọi, chỉ field đổi
   - B. `nexus_delete_task` rồi `nexus_create_task`
   - C. 2 lời gọi `nexus_update_task`, mỗi field 1 lần
   - D. `put_task` với đủ mọi field

   <details><summary>Đáp án</summary>

   **A.** Thiết kế theo workflow: 1 tool cập nhật nhận nhiều thay đổi tùy chọn; kết quả `changed` cho biết field nào thực sự đổi.

   </details>

### Chấm điểm

*(Bản HTML có nút chấm điểm theo session.)*

### Thực hành

Làm trên repo Nexus của bạn. Không có lời giải — nghiệm thu bằng lệnh.

#### Bài 1 — thư mục thứ hai + 3 kiểu tấn công mới

Tool `nexus_read_attachment` đọc file đính kèm trong `NEXUS_ATTACH_DIR` (khác thư mục export), dùng lại `files/safe-path.ts` — không copy.

- [ ] Thêm vào `attack-export.ts` (hoặc 1 script mới) 3 kiểu: path dài 10 000 ký tự; symlink vòng (`a → b → a`); path trỏ vào **thư mục** thay vì file.
- [ ] Cả 3 bị chặn bằng `isError` hoặc `-32602`, không treo, không crash server (lời gọi tiếp theo vẫn chạy).
- [ ] Không file nào trong `src/tools` gọi `realpath` trực tiếp: `grep -rn "realpath" src/tools | wc -l` → `0`.

#### Bài 2 — giảm lộ dữ liệu cá nhân trong `nexus_query`

- [ ] Kết quả `customers` mặc định **không** có `email`; chỉ có khi `fields` ghi rõ `email`.
- [ ] Filter có `$regex` trên `email` bị từ chối (chặn dò email bằng regex), so khớp bằng vẫn được.
- [ ] `nexus://schema` ghi rõ 2 luật trên — sinh tự động, không viết tay.
- [ ] `node scripts/query-probe.ts` thêm 2 dòng cho 2 luật mới; `pnpm check` xanh.

#### Bài 3 — cursor của vendor

Stub helpdesk trả thêm `next_page_token` khi còn ticket. `nexus_list_tickets` nhận `cursor` và trả `nextCursor` của **Nexus** (bọc token của vendor + vân tay bộ lọc), không đưa token vendor ra ngoài nguyên văn.

- [ ] Duyệt 40 ticket với `limit: 7` → 40, 0 trùng, 0 sót; trang cuối không có `nextCursor`.
- [ ] Đổi bộ lọc giữa chừng → `isError` “thuộc bộ lọc khác”.
- [ ] Bị `429` giữa chừng (bucket nhỏ) vẫn duyệt hết nhờ `api-client` chờ `Retry-After`.

#### Bài 4 — doanh thu theo gói

- [ ] `nexus_revenue_by` thêm `by: "tier"` (gói hiện tại của khách); bản RAM và bản Mongo (`$lookup` — chưa chạy được ở sandbox thì phải qua `tsc`).
- [ ] Tổng 3 nhóm `free`/`pro`/`enterprise` = `totalRevenue` của `by: "month"`.
- [ ] `size-audit` vẫn `OK`, tool mới nằm trong `WORST` (tsc buộc).

#### Bài 5 — Exit check: 5 kiểu lạm dụng cho 1 tool mới

Thiết kế (và viết) `nexus_import_customers_csv {path}`: đọc CSV trong thư mục export, tạo khách mới.

- [ ] Bảng 5 dòng: kiểu lạm dụng · ví dụ cụ thể cho **tool này** · lớp chặn · lệnh/test chứng minh. Không chép bảng ở Cheat Sheet Tổng quan — mỗi ví dụ phải dùng tham số của tool này.
- [ ] Mỗi dòng có 1 test chạy được trong `pnpm check` (đỏ trước khi chặn, xanh sau khi chặn).
- [ ] Gợi ý hướng nghĩ (không phải đáp án): file nằm ở đâu, file to cỡ nào, dữ liệu trong ô có thể là gì, gọi 2 lần thì sao, kết quả trả về dài cỡ nào.

#### Bài 6 — chưa chạy được ở sandbox

- [ ] Mongo (M2): tạo `nexus_reader` bằng `infra/mongo/create-reader.js`; chứng minh ghi bị DB từ chối; chạy `query-probe.ts`, `page-all.ts` với `NEXUS_DATA=mongo` — kết quả cùng hình dạng với bản RAM.
- [ ] Mongo: `db.tasks.find({...keyset...}).sort({ createdAt: 1, _id: 1 }).explain("executionStats")` — có `IXSCAN`, không `COLLSCAN` (cần index `{ createdAt: 1, _id: 1 }`).
- [ ] Claude Desktop: hỏi “doanh thu quý 3 theo khu vực” và “liệt kê hết việc của Lan” — ghi lại model gọi tool nào, có dùng `nextCursor` đúng không, có tự cộng số không.
