# Module 11 · Next.js App Router

_Server/Client Components · Route Handlers · Server Actions · Drizzle + auth · Cache Components · Metadata · CRUD lạc quan_

**Đã chạy với:** Node 22.22.0 · Next.js 16.4.2 (Turbopack) · React 19.3.1 · TypeScript 7.0.2 · zod 4.6.7 · drizzle-orm 0.45.4 · drizzle-kit 0.31.11 · @electric-sql/pglite 0.5.10 · jose 6.2.13 · tsx 4.23.15 · playwright-core 1.64.1 + Chromium

Mọi app được build bằng `next build` thật rồi chạy bằng `next start` (production); các script `m11/*.ts` gọi HTTP như curl hoặc điều khiển **Chromium thật**. Code TS/TSX kiểm bằng `npx tsc -p .` (strict, không `any`). **Postgres** ở sandbox là **PGlite** — Postgres thật biên dịch sang WASM chạy trong process, cùng hợp đồng với `drizzle-orm/node-postgres` (máy thật chỉ đổi driver + `DATABASE_URL`). **OAuth Google/GitHub (Better Auth, Clerk) và deploy Vercel không chạy được ở sandbox** (cần tài khoản/khoá): bài 11.3 dùng session JWT ký bằng `jose` theo pattern DAL trong tài liệu Next.js — đúng vị trí mà Better Auth/Clerk cắm vào. Mốc giờ trong log là UTC.

Vị trí: Đã học Module 10 · Deployment & Build (vite build, SPA fallback, cache header, CI) · **Đang học Module 11** · Sắp tới Module 12 · Portfolio projects (AI chat streaming, Stripe, Inngest, judge, realtime)

## Bài 11.1 · Routing & Server/Client Components: thư mục = URL, mặc định chạy ở server

_Nguồn roadmap: [NextAI] App Router vs Page Router → Nested & Dynamic Routing → Server Components → Client Components · [Academind] Understanding React Server Components → Combining Server and Client Components → Using the use() Hook_

### 1 · Một câu & nằm ở đâu
App Router: **thư mục = URL**, `page.tsx` trong thư mục = trang, `layout.tsx` bọc mọi trang con, `[id]` = tham số động. Mọi component **mặc định là Server Component**: chạy trên server (lúc build nếu trang tĩnh, mỗi request nếu động), `async/await` thẳng vào DB, và **không gửi JS** xuống trình duyệt. Cần `useState` / `onClick` thì đặt `"use client"` ở đầu file — đó là **ranh giới**: file đó và mọi thứ nó import thành bundle cho trình duyệt. Đặt ranh giới càng thấp (ở "lá" của cây) càng tốt.

**[Trình duyệt]** → proxy.ts → **[Route: page / route.ts]** → **[Server Component · Action]** → DAL · DB → Cache · HTML/RSC

<details><summary>m11/app/lib/menu.ts — tầng dữ liệu giả: có import "server-only" và 1 chuỗi kết nối bí mật</summary>

`m11/app/lib/menu.ts`

```tsx
// "Tầng dữ liệu" giả: chỉ được chạy trên server (import vào client component là build lỗi)
import "server-only";

const CONN = "postgres://app:pg_secret_1234@db.internal/coffee"; // bí mật: không bao giờ được xuống trình duyệt
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type Drink = { id: string; name: string; price: number; desc: string };
export type Review = { by: string; stars: number; text: string };

const DRINKS: Drink[] = [
  { id: "latte", name: "Latte", price: 45000, desc: "Espresso + sữa nóng" },
  { id: "mocha", name: "Mocha", price: 50000, desc: "Espresso + sô-cô-la + sữa" },
  { id: "cold-brew", name: "Cold Brew", price: 55000, desc: "Ủ lạnh 18 giờ" },
];

export async function getDrinks(): Promise<Drink[]> {
  console.log(`[server] getDrinks() qua ${CONN.split("@")[1]}`);
  await sleep(30);
  return DRINKS;
}

export async function getDrink(id: string): Promise<Drink | undefined> {
  await sleep(30);
  return DRINKS.find((d) => d.id === id);
}

export async function getReviews(id: string): Promise<Review[]> {
  await sleep(1200); // truy vấn chậm: không được chặn cả trang
  return [{ by: "An", stars: 5, text: `${id} ngon, đậm vị` }, { by: "Bình", stars: 3, text: "Hơi ngọt" }];
}
```

</details>

<details><summary>m11/app/app/layout.tsx — root layout bọc mọi trang (≈ _Layout.cshtml)</summary>

`m11/app/app/layout.tsx`

```tsx
// Root layout: bọc MỌI trang, render 1 lần, giữ nguyên khi điều hướng giữa các trang con (≈ _Layout.cshtml)
import Link from "next/link";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <nav>
          <Link href="/">Trang chủ</Link> · <Link href="/menu">Thực đơn</Link> · <Link href="/orders">Đơn hàng</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
```

</details>

<details><summary>m11/app/app/menu/page.tsx — /menu — Server Component async, await thẳng dữ liệu</summary>

`m11/app/app/menu/page.tsx`

```tsx
// /menu — Server Component async: await thẳng tầng dữ liệu, không useEffect, không API trung gian
import Link from "next/link";
import { getDrinks } from "../../lib/menu";

export default async function MenuPage() {
  const drinks = await getDrinks();
  return (
    <>
      <h1>Thực đơn</h1>
      <ul>
        {drinks.map((d) => (
          <li key={d.id}><Link href={`/menu/${d.id}`}>{d.name}</Link></li>
        ))}
      </ul>
    </>
  );
}
```

</details>

<details><summary>m11/app/app/menu/[id]/reviews/ReviewList.tsx — client component dùng use() — ví dụ 3</summary>

`m11/app/app/menu/[id]/reviews/ReviewList.tsx`

```tsx
"use client";

import { use, useState } from "react";
import type { Review } from "../../../../lib/menu"; // import type: xoá khi biên dịch, không kéo code server

export default function ReviewList({ reviews }: { reviews: Promise<Review[]> }) {
  const list = use(reviews);                 // chưa xong → "treo" tới Suspense gần nhất
  const [best, setBest] = useState(false);
  const shown = best ? list.filter((r) => r.stars >= 4) : list;
  return (
    <>
      <button onClick={() => setBest(!best)}>{best ? "Xem tất cả" : "Chỉ 4★+"}</button>
      <ul>{shown.map((r) => <li key={r.by}>{r.stars}★ {r.by}: {r.text}</li>)}</ul>
    </>
  );
}
```

</details>

<details><summary>m11/serve.ts — chạy next start cho các script kiểm tra, gom log server</summary>

`m11/serve.ts`

```tsx
// Chạy `next start` cho 1 app đã build, đợi sẵn sàng, gom log server (stdout của Node)
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const nextBin = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));

export async function serve(appDir: string, port: number) {
  const proc = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
    cwd: appDir,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  });
  const logs: string[] = [];
  const onData = (b: Buffer) => b.toString().split("\n").filter(Boolean).forEach((l) => logs.push(l));
  proc.stdout.on("data", onData);
  proc.stderr.on("data", onData);
  const origin = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) {
    try { await fetch(origin + "/__ping"); break; } catch { await new Promise((r) => setTimeout(r, 150)); }
  }
  logs.length = 0; // bỏ banner khởi động, chỉ giữ log do request sinh ra
  return {
    origin,
    logs,
    /** chỉ các dòng do code của bạn console.log với tiền tố [server] */
    serverLines: () => logs.filter((l) => l.includes("[server]")),
    close: () => new Promise<void>((ok) => {
      if (proc.exitCode !== null) return ok();
      const t = setTimeout(() => proc.kill("SIGKILL"), 3000);
      proc.on("exit", () => { clearTimeout(t); ok(); });
      proc.kill("SIGTERM");
    }),
  };
}
```

</details>

<details><summary>m11/where.ts — script ví dụ 2: Chromium + soi thư mục bundle</summary>

`m11/where.ts`

```tsx
// Code nào chạy ở đâu? Chromium thật mở /menu/latte, bấm nút; tách log server và console trình duyệt
import { serve } from "./serve";
import { launch } from "./browser";
import { countFiles } from "./grep";

const srv = await serve("m11/app", 3101);
const browser = await launch();
const page = await browser.newPage();
const inBrowser: string[] = [];
page.on("console", (m) => inBrowser.push(m.text()));
page.on("response", (r) => { if (r.status() >= 400) inBrowser.push(`(request ${r.status()}: ${new URL(r.url()).pathname})`); });

await page.goto(srv.origin + "/menu/latte");
await page.getByRole("button", { name: /\(0\)/ }).click();
await page.getByRole("button", { name: /\(1\)/ }).waitFor();

console.log("Terminal của server (next start):");
srv.logs.forEach((l) => console.log("  " + l));
console.log("Console của trình duyệt (DevTools):");
inBrowser.forEach((l) => console.log("  " + l));
console.log("Bundle:");
console.log(`  "pg_secret" trong .next/static (tải xuống trình duyệt): ${countFiles("m11/app/.next/static", "pg_secret")} file`);
console.log(`  "pg_secret" trong .next/server (chỉ nằm ở server):    ${countFiles("m11/app/.next/server", "pg_secret")} file`);
console.log(`  "vào giỏ" (chữ của AddToCart) trong .next/static:     ${countFiles("m11/app/.next/static", "vào giỏ")} file`);
await browser.close();
await srv.close();
```

</details>

<details><summary>m11/stream.ts — script ví dụ 3: đọc HTML theo từng chunk</summary>

`m11/stream.ts`

```tsx
// HTML có thật sự tới từng đợt không? Đọc body của /menu/latte/reviews theo từng chunk + mốc thời gian
import { serve } from "./serve";

const srv = await serve("m11/app", 3102);
const t0 = Date.now();
const res = await fetch(srv.origin + "/menu/latte/reviews");
console.log(`+${Date.now() - t0}ms  HTTP ${res.status}  Transfer-Encoding: ${res.headers.get("transfer-encoding")}`);

const reader = res.body!.getReader();
const dec = new TextDecoder();
let i = 0;
for (;;) {
  const { done, value } = await reader.read();
  if (done) break;
  const html = dec.decode(value);
  const marks = ["Đánh giá latte", "Đang tải đánh giá…", "latte ngon, đậm vị"].filter((s) => html.includes(s));
  console.log(`+${String(Date.now() - t0).padStart(4)}ms  chunk ${++i}  ${String(value.length).padStart(5)} byte  có: ${marks.join(" | ") || "(script/RSC payload)"}`);
}
await srv.close();
```

</details>

### 2 · Concept
| Khái niệm | Trong App Router | Ghi chú | Bên C# |
|---|---|---|---|
| Route | `app/menu/[id]/page.tsx` → `/menu/latte` | Thư mục không có `page.tsx` thì không thành URL; `(nhom)` gom thư mục mà không vào URL | `[Route("menu/{id}")]`, Razor Pages |
| File đặc biệt | `layout` (bọc, giữ nguyên khi chuyển trang) · `loading` · `error` · `not-found` · `route.ts` (API, bài 11.2) | Đặt cạnh `page.tsx`, áp cho cả nhánh con | `_Layout.cshtml` |
| Server Component (mặc định) | Chạy ở server, được `async`, đọc DB/secret thẳng; ra HTML + **RSC payload** (cây component dạng dữ liệu) | Không state, không effect, không event | Razor view |
| Client Component | `"use client"` → vào bundle trình duyệt; **vẫn SSR 1 lần** cho HTML đầu, rồi **hydrate** (gắn event vào HTML có sẵn) | Props qua ranh giới phải serialize được — không truyền hàm | Blazor WASM component |
| Tĩnh ○ vs động ƒ | Không đọc gì theo request → render **lúc build** (○); `[id]` không liệt kê trước, cookie, header → render **mỗi request** (ƒ) | Đọc ngay ở bảng route của `next build` | Output cache vs render động |
| `use(promise)` | Server bắt đầu truy vấn, truyền **Promise** xuống client; client `use()`; `<Suspense>` hiện fallback trong lúc chờ | HTML được **stream**: phần nhanh tới trước | `IAsyncEnumerable` streaming |

### 3 · Flow / lifecycle
**Request /menu/latte đi qua những bước nào tới khi nút bấm được?**

```mermaid
flowchart LR
  N0["GET /menu/latte<br/><small>trình duyệt xin URL</small>"]
  N1["Khớp thư mục<br/><small>app/menu/[id]</small>"]
  N2["Server Component<br/><small>await getDrink() ở server</small>"]
  N3["HTML + RSC<br/><small>client comp SSR luôn</small>"]
  N4["Hydrate<br/><small>chỉ JS của use client</small>"]
  N5["Bấm nút<br/><small>useState ở trình duyệt</small>"]
  N0 --> N1
  N1 --> N2
  N2 --> N3
  N3 --> N4
  N4 --> N5
```

Đọc sơ đồ: Trái → phải: trình duyệt xin URL; Next khớp thư mục `app/menu/[id]/page.tsx`; Server Component `await` dữ liệu ngay trên server; Next trả HTML hoàn chỉnh (client component cũng được render sẵn) kèm RSC payload; trình duyệt chỉ tải JS của phần `"use client"` để hydrate; từ đó `useState` chạy ở trình duyệt.

### 4 · Ví dụ thực tế
**Ví dụ 1.** Ba trang thực đơn là ba thư mục: `app/menu/page.tsx` (/menu, mở ở mục 1), `app/menu/[id]/page.tsx` (/menu/latte, bên dưới) và `app/menu/[id]/reviews/page.tsx`. Build production, lọc bảng route phần menu.

`m11/app/app/menu/[id]/page.tsx`

```tsx
// /menu/latte, /menu/mocha… — thư mục [id] = tham số động (≈ [Route("menu/{id}")])
import { notFound } from "next/navigation";
import { getDrink } from "../../../lib/menu";
import AddToCart from "./AddToCart";

type Props = { params: Promise<{ id: string }> };

export default async function DrinkPage({ params }: Props) {
  const { id } = await params;              // params là Promise từ Next 15
  const drink = await getDrink(id);
  if (!drink) notFound();                    // → trang 404 (not-found.tsx nếu có)
  console.log(`[server] render /menu/${id}`);
  return (
    <article>
      <h1>{drink.name}</h1>
      <p>{drink.desc} — {drink.price.toLocaleString("vi-VN")}đ</p>
      <AddToCart name={drink.name} />
    </article>
  );
}
```

```console
❯ npx next build m11/app 2>&1 | grep -E "Route|/menu|server\]|^○|^ƒ  \("
[server] getDrinks() qua db.internal/coffee
Route (app)
├ ○ /menu
├ ƒ /menu/[id]
├ ƒ /menu/[id]/reviews
○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

`[server] getDrinks()` in ra **trong lúc build**: `/menu` không đọc gì theo request nên Next render sẵn thành HTML tĩnh (○) — request thật chỉ nhận file HTML, component không chạy lại. `/menu/[id]` có tham số chưa biết trước nên là ƒ: render mỗi request (muốn tĩnh thì export `generateStaticParams()` liệt kê id — bài 11.4). `params` là `Promise` từ Next 15: phải `await`. `notFound()` ném tín hiệu để Next trả 404. Bảng đầy đủ còn route của các bài sau, `grep` chỉ giữ phần menu.

**Ví dụ 2.** `AddToCart` là client component duy nhất của trang. Script `m11/where.ts` (mở ở mục 1) chạy `next start`, mở `/menu/latte` bằng Chromium, bấm nút 1 lần, rồi in log ở **hai nơi** và soi thư mục bundle.

`m11/app/app/menu/[id]/AddToCart.tsx`

```tsx
"use client"; // ranh giới: file này + mọi thứ nó import được gửi xuống trình duyệt

import { useState } from "react";

export default function AddToCart({ name }: { name: string }) {
  const [qty, setQty] = useState(0);
  console.log(`[AddToCart] render qty=${qty}`);
  return (
    <button onClick={() => setQty(qty + 1)}>
      Thêm {name} vào giỏ ({qty})
    </button>
  );
}
```

```console
❯ npx tsx m11/where.ts
Terminal của server (next start):
  [server] render /menu/latte
  [AddToCart] render qty=0
Console của trình duyệt (DevTools):
  [AddToCart] render qty=0
  [AddToCart] render qty=1
Bundle:
  "pg_secret" trong .next/static (tải xuống trình duyệt): 0 file
  "pg_secret" trong .next/server (chỉ nằm ở server):    6 file
  "vào giỏ" (chữ của AddToCart) trong .next/static:     1 file
```

`[server] render` chỉ có ở terminal server. `AddToCart` render ở **cả hai nơi**: 1 lần trên server (SSR ra HTML có sẵn nút "(0)"), rồi trên trình duyệt khi hydrate và mỗi lần state đổi. Vì vậy "client" nghĩa là "có mặt ở trình duyệt", không phải "chỉ chạy ở trình duyệt" — đừng đụng `window` trong thân render. Chuỗi `pg_secret` nằm trong các file ở `.next/server`, **0 file** ở `.next/static` (thứ trình duyệt tải về): Server Component không bao giờ vào bundle. Chữ "vào giỏ" có trong 1 chunk JS — đó là code của AddToCart.

**Ví dụ 3.** `getReviews()` mất 1,2 giây. Thay vì `await` (cả trang đợi), trang truyền thẳng **Promise** cho `ReviewList` (client, mở ở mục 1) — bên đó gọi `use(reviews)`. `m11/stream.ts` đọc body HTTP theo từng chunk kèm mốc thời gian.

`m11/app/app/menu/[id]/reviews/page.tsx`

```tsx
// Truy vấn chậm KHÔNG chặn trang: truyền Promise xuống client, bọc Suspense, client use() để mở
import { Suspense } from "react";
import { getReviews } from "../../../../lib/menu";
import ReviewList from "./ReviewList";

type Props = { params: Promise<{ id: string }> };

export default async function ReviewsPage({ params }: Props) {
  const { id } = await params;
  const reviews = getReviews(id);           // KHÔNG await — bắt đầu truy vấn, giữ Promise
  return (
    <>
      <h1>{`Đánh giá ${id}`}</h1>
      <Suspense fallback={<p>Đang tải đánh giá…</p>}>
        <ReviewList reviews={reviews} />
      </Suspense>
    </>
  );
}
```

```console
❯ npx tsx m11/stream.ts
+149ms  HTTP 200  Transfer-Encoding: chunked
+ 153ms  chunk 1   1636 byte  có: Đánh giá latte | Đang tải đánh giá…
+ 153ms  chunk 2   5768 byte  có: Đánh giá latte | Đang tải đánh giá…
+1291ms  chunk 3    170 byte  có: latte ngon, đậm vị
+1292ms  chunk 4   1063 byte  có: latte ngon, đậm vị
+1292ms  chunk 5     14 byte  có: (script/RSC payload)
```

Chunk đầu tới sau ~0,15–0,2 giây với tiêu đề và fallback "Đang tải đánh giá…" — trình duyệt vẽ được ngay. Kết nối **vẫn mở** (`Transfer-Encoding: chunked`); hơn 1 giây sau server đẩy tiếp chunk chứa đánh giá kèm script thay fallback bằng nội dung thật. Đây là streaming SSR: không API riêng, không `useEffect` + loading state tự viết. `use()` khác hook thường: gọi được trong `if`, nhận Promise hoặc Context.

### 5 · Thử thật / bẫy
**Bẫy 1.** **Dùng `useState` trong file chưa có `"use client"`** — copy component từ project Vite sang `app/`.

`m11/traps/no-client/app/page.tsx`

```tsx
// ❌ Dùng useState nhưng quên "use client" — mọi file trong app/ mặc định là Server Component
import { useState } from "react";

export default function Page() {
  const [qty, setQty] = useState(0);
  return <button onClick={() => setQty(qty + 1)}>Thêm vào giỏ ({qty})</button>;
}
```

```console
❯ npx next build m11/traps/no-client
> Build error occurred
Error: Turbopack build failed with 1 error:
./m11/traps/no-client/app/page.tsx:2:10
Error: You're importing a module that depends on `useState` into a React Server Component module. This API is only available in Client Components. To fix, mark the file (or its parent) with the `"use client"` directive.
    Learn more: https://nextjs.org/docs/app/api-reference/directives/use-client
  1 | // ❌ Dùng useState nhưng quên "use client" — mọi file trong app/ mặc định là Server Component
> 2 | import { useState } from "react";
    |          ^^^^^^^^
  3 |
  4 | export default function Page() {
  5 |   const [qty, setQty] = useState(0);
```

(… còn 10 dòng — đã trích dòng 6–16 / 21 của `npx next build m11/traps/no-client`)

Lỗi lúc build, chỉ đúng dòng. Đừng vội thêm `"use client"` cho cả trang — hỏi trước: phần nào thật sự cần chạy ở trình duyệt? Thường chỉ cần tách nút ra file riêng (mục 7).

**Bẫy 2.** **Truyền hàm từ Server Component xuống Client Component** — thói quen "callback prop" từ React thuần.

`m11/traps/fn-prop/app/page.tsx`

```tsx
// ❌ Server Component truyền HÀM xuống Client Component qua props
import Picker from "./Picker";

export default function Page() {
  const drinks = ["Latte", "Mocha"];
  return <Picker drinks={drinks} onPick={(name: string) => console.log("chọn", name)} />;
}
```

```console
❯ npx next build m11/traps/fn-prop
  Generating static pages using 1 worker (0/3) ...
Error occurred prerendering page "/". Read more: https://nextjs.org/docs/messages/prerender-error
Error: Event handlers cannot be passed to Client Component props.
  {drinks: ..., onPick: function onPick}
                        ^^^^^^^^^^^^^^^
If you need interactivity, consider converting part of this to a Client Component.
```

(… còn 13 dòng — đã trích dòng 9–14 / 19 của `npx next build m11/traps/fn-prop`)

Props đi qua ranh giới bằng cách **serialize** thành RSC payload (như JSON, thêm Date/Map/Promise). Hàm là code chạy ở server, không gửi qua mạng được. Sửa: để client component tự định nghĩa `onPick`; cần gọi về server thì truyền **Server Action** (hàm `"use server"`, bài 11.2) — loại hàm duy nhất qua được ranh giới.

**Bẫy 3.** **Client component import file có secret.** AI đặt `"use client"` cho cả trang vì có ô nhập mã, rồi import luôn hàm kiểm mã giảm giá gọi API đối tác bằng khoá bí mật (`lib/pricing.ts`).

`m11/traps/leak/app/page.tsx`

```tsx
"use client"; // cần useState cho ô nhập mã → AI đặt "use client" ở cả trang

import { useState } from "react";
import { checkPromo } from "../lib/pricing"; // import từ client → cả file pricing.ts vào bundle

export default function Page() {
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState(0);
  return (
    <>
      <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Mã giảm giá" />
      <button onClick={() => checkPromo(code).then(setPercent)}>Áp mã</button>
      <p>Latte: {45000 * (1 - percent / 100)}đ</p>
    </>
  );
}
```

```console
❯ npx next build m11/traps/leak > /dev/null && grep -rho "sk_promo_LIVE_[a-z0-9]*" m11/traps/leak/.next/static/
sk_promo_LIVE_9f2c

❯ npx next build m11/traps/leak-guard
> Build error occurred
Error: Turbopack build failed with 2 errors:
./m11/traps/leak-guard/lib/pricing.ts:2:1
Error: You're importing a module that depends on "server-only". This API is only available in Server Components in the App Router, but you are using it in the Pages Router.
    Learn more: https://nextjs.org/docs/app/building-your-application/rendering/server-components
  1 | // Cùng file, thêm 1 dòng: import từ client là build lỗi ngay
> 2 | import "server-only";
    | ^^^^^^^^^^^^^^^^^^^^^
  3 | const PROMO_API_KEY = "sk_promo_LIVE_9f2c";
  4 |
  5 | export async function checkPromo(code: string): Promise<number> {
Import traces:
  Client Component Browser:
    ./m11/traps/leak-guard/lib/pricing.ts [Client Component Browser]
    ./m11/traps/leak-guard/app/page.tsx [Client Component Browser]
    ./m11/traps/leak-guard/app/page.tsx [Server Component]
```

(… còn 39 dòng — đã trích dòng 6–16, 20–24 / 55 của `npx next build m11/traps/leak-guard`)

Lần 1: không lỗi, không cảnh báo — `grep` tìm thấy nguyên khoá trong file JS công khai mà ai mở trang cũng tải về. Lần 2: cùng code, chỉ thêm 1 dòng `import "server-only"` vào đầu `lib/pricing.ts`: build **đỏ ngay** và in đường import (thông báo nhắc "Pages Router" là lạc đề, gốc là import từ client). Thêm dòng này vào mọi file chạm DB, secret, SDK server — như `lib/menu.ts`.

### 6 · Tóm tắt bằng hình
**(a) Cây thư mục sau bài này**

```text
sandbox/
├─ package.json  [SỬA]  ← next, react, zod, drizzle, jose, playwright-core…
├─ tsconfig.json  [SỬA]  ← strict, include m11, bỏ .next
└─ m11/
   ├─ app/  [MỚI]  ← 1 app Next dùng cho cả module
   │  ├─ lib/menu.ts  [MỚI]  ← "server-only" + dữ liệu + secret
   │  └─ app/layout.tsx · menu/page.tsx  [MỚI]  ← layout gốc · /menu ○ tĩnh
   │     menu/[id]/page.tsx · AddToCart.tsx  [MỚI]  ← ƒ động + 1 lá client
   │     menu/[id]/reviews/page.tsx · ReviewList.tsx  [MỚI]  ← Promise + Suspense + use()
   ├─ serve.ts · browser.ts · grep.ts  [MỚI]  ← next start, Chromium, soi bundle
   ├─ where.ts · stream.ts  [MỚI]  ← script ví dụ 2, 3
   ├─ traps/no-client · fn-prop · leak · leak-guard  [MỚI]  ← 3 bẫy
   └─ ex1/start · ex1/solution · ex1/check.ts  [MỚI]  ← bài Làm ngay
```

**(b) Đọc trong 10 giây**

**Viết 1 component mới: server hay client?**

```mermaid
flowchart LR
  N0["Component mới<br/><small>mặc định Server</small>"]
  N1["Cần state/event?<br/><small>hook, onClick, window</small>"]
  N0 --> N1
  O0["Không<br/><small>giữ Server, await DB</small>"]
  N1 --> O0
  O1["Có, 1 phần<br/><small>tách lá use client</small>"]
  N1 --> O1
  O2["Dữ liệu chậm<br/><small>Promise + Suspense</small>"]
  N1 --> O2
```

Đọc sơ đồ: Mặc định để Server. Chỉ phần cần state/event mới tách thành file `"use client"` nhỏ; dữ liệu chậm thì truyền Promise + Suspense thay vì bắt cả trang đợi.

### 7 · Làm ngay (≤ 10 phút)
**Mục tiêu:** `m11/ex1/start` là trang "Món đặc biệt" do AI sinh: cả trang `"use client"` chỉ vì có nút Thích, nên import `lib/special.ts` (có `server-only`) làm build đỏ. Tách sao cho trang là Server Component, chỉ nút là client.

File khởi đầu:

`m11/ex1/start/app/page.tsx`

```tsx
"use client"; // AI thêm dòng này vì trang có nút Thích

import { useState } from "react";
import { getSpecial } from "../lib/special";

export default function Page() {
  const special = getSpecial();
  const [likes, setLikes] = useState(0);
  return (
    <article>
      <h1>Món đặc biệt: {special.name}</h1>
      <button onClick={() => setLikes(likes + 1)}>Thích ({likes})</button>
    </article>
  );
}
```

Chạy file khởi đầu (đang đỏ):

```console
❯ npx next build m11/ex1/start
> Build error occurred
Error: Turbopack build failed with 2 errors:
./m11/ex1/start/lib/special.ts:2:1
Error: You're importing a module that depends on "server-only". This API is only available in Server Components in the App Router, but you are using it in the Pages Router.
    Learn more: https://nextjs.org/docs/app/building-your-application/rendering/server-components
  1 | // Món đặc biệt hôm nay — đọc từ "DB", kèm giá vốn nội bộ (không được lộ ra trình duyệt)
> 2 | import "server-only";
    | ^^^^^^^^^^^^^^^^^^^^^
  3 |
  4 | const COST_SHEET = { name: "Bạc xỉu", cost: "giá vốn 9.800đ — NỘI BỘ" };
  5 |
```

(… còn 44 dòng — đã trích dòng 6–16 / 55 của `npx next build m11/ex1/start`)

Tiêu chí nghiệm thu:

- [ ] Build xanh mà **không** xoá dòng `import "server-only"` trong `lib/special.ts`
- [ ] Tắt JavaScript vẫn thấy "Món đặc biệt: Bạc xỉu" (HTML render ở server)
- [ ] Bật JavaScript: bấm Thích 2 lần → "Thích (2)"
- [ ] Chuỗi giá vốn "NỘI BỘ" không có trong `.next/static`; `app/page.tsx` không còn `"use client"`

Lệnh nghiệm thu:

```bash
npx next build m11/ex1/start && npx tsx m11/ex1/check.ts m11/ex1/start
```

Lời giải tham chiếu chạy ra (output cần đạt):

```console
❯ npx next build m11/ex1/solution > /dev/null && npx tsx m11/ex1/check.ts m11/ex1/solution
✓ Tắt JavaScript vẫn thấy 'Món đặc biệt: Bạc xỉu' (HTML render ở server)
✓ Bật JavaScript: bấm Thích 2 lần → (2)
✓ Giá vốn nội bộ không có trong .next/static
✓ app/page.tsx là Server Component (không có "use client")
4/4 đạt
```

<details><summary>Gợi ý nếu bị đỏ</summary>

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| "…depends on server-only… Pages Router" | File có `"use client"` import `lib/special.ts` | Bỏ `"use client"` ở page, chuyển nút sang file mới `app/LikeButton.tsx` |
| "useState … only available in Client Components" | Đã bỏ `"use client"` nhưng page vẫn dùng `useState` | Cả state lẫn `onClick` nằm trong LikeButton (`"use client"` + `useState` + `<button>`) |
| Check 1 ✗: h1 rỗng khi tắt JS | Lấy dữ liệu trong `useEffect` | Gọi `getSpecial()` thẳng trong Server Component |

`m11/ex1/start/app/page.tsx` (diff)

```diff
-"use client"; // AI thêm dòng này vì trang có nút Thích
-
-import { useState } from "react";
 import { getSpecial } from "../lib/special";
+import LikeButton from "./LikeButton";
 
 export default function Page() {
   const special = getSpecial();
-  const [likes, setLikes] = useState(0);
   return (
     <article>
       <h1>Món đặc biệt: {special.name}</h1>
-      <button onClick={() => setLikes(likes + 1)}>Thích ({likes})</button>
+      <LikeButton />
     </article>
   );
```

</details>

### 8 · 3 câu hỏi nhanh
1. Phỏng vấn: "Server Component khác SSR kiểu cũ thế nào? Client Component có render ở server không?"

   <details><summary>Đáp án</summary>

   SSR kiểu cũ (Pages Router, CRA + SSR) render cả cây ra HTML rồi gửi **toàn bộ JS** để hydrate lại hết. Với RSC, Server Component chạy **chỉ ở server**, không có trong bundle, kết quả gửi dạng RSC payload; chỉ Client Component được hydrate → ít JS hơn, đọc DB trực tiếp. Client Component **vẫn** SSR 1 lần cho HTML đầu (ví dụ 2: log AddToCart ở cả 2 nơi) — "client" nghĩa là có mặt ở trình duyệt.

   </details>

2. "Đặt `"use client"` ở `app/layout.tsx` cho tiện được không?"

   <details><summary>Đáp án</summary>

   Layout và mọi thứ nó import thành client → mất `async`, không export `metadata` được (bài 11.4), bundle phình. Trang con truyền qua `children` vẫn là Server Component (đi qua props, không qua import), nhưng không nên. Cách chuẩn khi cần Provider (theme, TanStack Query): tạo `Providers.tsx` có `"use client"` nhận `children`, layout vẫn là Server Component và bọc `<Providers>{children}</Providers>`.

   </details>

3. Review code AI: trang `/menu` có `"use client"`, `useEffect(() => fetch("/api/menu").then(r => r.json()).then(setMenu), [])`, kèm route handler `/api/menu` đọc DB. Góp ý?

   <details><summary>Đáp án</summary>

   3 tầng thừa (client → API → DB): trang trắng + spinner, thêm 1 vòng mạng, HTML không có dữ liệu (SEO kém), bundle to, thiếu xử lý lỗi/race (roadmap 13.2). Sửa: page là Server Component `async`, gọi thẳng hàm DB có `import "server-only"`; xoá route handler nếu không ai ngoài app dùng; phần tương tác (lọc, thêm giỏ) tách thành lá `"use client"`.

   </details>


---

## Bài 11.2 · Route Handlers & Server Actions: API cho người ngoài, action cho form của bạn

_Nguồn roadmap: [NextAI] Route Handlers GET/POST/PUT/PATCH/DELETE → Deep Dive into Server Actions_

### 1 · Một câu & nằm ở đâu
Hai cách nhận yêu cầu ghi dữ liệu. **Route Handler** (`app/api/orders/route.ts` export `GET`/`POST`/`PATCH`/`DELETE`) = Minimal API: nhận `Request` chuẩn Web, trả `Response`, URL do bạn chọn — cho app mobile, webhook, đối tác. **Server Action** = hàm `async` trong file `"use server"`; form/nút gọi thẳng như gọi hàm, Next tự sinh endpoint POST có id ẩn — cho UI của chính app. Cả hai đều là **endpoint công khai**: validate input (Zod) và kiểm quyền bên trong. Ghi xong gọi `revalidatePath()` để trang server render lại.

Trình duyệt → proxy.ts → **[Route: page / route.ts]** → **[Server Component · Action]** → DAL · DB → Cache · HTML/RSC

<details><summary>m11/app/lib/orders.ts — schema Zod + "bảng" đơn hàng trong bộ nhớ (globalThis)</summary>

`m11/app/lib/orders.ts`

```tsx
// "Bảng" đơn hàng trong bộ nhớ (thay DB) + schema kiểm tra input — dùng chung cho route handler và server action
import "server-only";
import { z } from "zod";

export const OrderInput = z.object({
  drink: z.enum(["Latte", "Mocha", "Cold Brew"], { error: "Món không có trong thực đơn" }),
  qty: z.coerce.number({ error: "Số lượng phải là số" }).int().min(1, "Ít nhất 1 ly").max(10, "Tối đa 10 ly"),
});
export type Order = z.infer<typeof OrderInput> & { id: number; status: "new" | "served" };

// globalThis: mọi route (page, route handler, action) trong cùng process thấy chung 1 mảng
const db = globalThis as unknown as { orders?: Order[]; seq?: number };
db.orders ??= [
  { id: 1, drink: "Latte", qty: 2, status: "served" },
  { id: 2, drink: "Mocha", qty: 1, status: "new" },
];
db.seq ??= 2;

export const listOrders = (): Order[] => db.orders!;
export const findOrder = (id: number) => db.orders!.find((o) => o.id === id);

export function addOrder(input: z.infer<typeof OrderInput>): Order {
  const order: Order = { ...input, id: ++db.seq!, status: "new" };
  db.orders!.push(order);
  return order;
}
export function removeOrder(id: number): boolean {
  const before = db.orders!.length;
  db.orders = db.orders!.filter((o) => o.id !== id);
  return db.orders.length < before;
}
export function setStatus(id: number, status: Order["status"]) {
  const o = findOrder(id);
  if (o) o.status = status;
  return o;
}
```

</details>

<details><summary>m11/app/app/api/orders/[id]/route.ts — PATCH / DELETE với tham số động</summary>

`m11/app/app/api/orders/[id]/route.ts`

```tsx
// /api/orders/:id — PATCH đổi trạng thái, DELETE xoá. Tham số động lấy từ context.params (Promise)
import { NextResponse } from "next/server";
import { findOrder, removeOrder, setStatus } from "../../../../lib/orders";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const id = Number((await params).id);
  const { status } = (await req.json()) as { status?: string };
  if (status !== "new" && status !== "served") {
    return NextResponse.json({ error: "status phải là new | served" }, { status: 400 });
  }
  const order = setStatus(id, status);
  return order ? NextResponse.json(order) : NextResponse.json({ error: "Không có đơn" }, { status: 404 });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const id = Number((await params).id);
  if (!findOrder(id)) return NextResponse.json({ error: "Không có đơn" }, { status: 404 });
  removeOrder(id);
  return new Response(null, { status: 204 });
}
```

</details>

<details><summary>m11/app/app/orders/page.tsx — /orders — Server Component liệt kê đơn</summary>

`m11/app/app/orders/page.tsx`

```tsx
// /orders — Server Component đọc thẳng dữ liệu; form tạo đơn là Client Component nhỏ
import { listOrders } from "../../lib/orders";
import OrderForm from "./OrderForm";

export default function OrdersPage() {
  const orders = listOrders();
  return (
    <>
      <h1>Đơn hàng</h1>
      <ul>
        {orders.map((o) => (
          <li key={o.id}>#{o.id} · {o.qty}× {o.drink} · {o.status}</li>
        ))}
      </ul>
      <OrderForm />
    </>
  );
}
```

</details>

<details><summary>m11/app/app/orders/OrderForm.tsx — form client: useActionState + useFormStatus</summary>

`m11/app/app/orders/OrderForm.tsx`

```tsx
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createOrder, type FormState } from "./actions"; // import Server Action vào client: chỉ nhận về 1 "tham chiếu" gọi qua mạng

function Submit() {
  const { pending } = useFormStatus();                    // form cha đang gửi?
  return <button disabled={pending}>{pending ? "Đang gửi…" : "Đặt món"}</button>;
}

export default function OrderForm() {
  const [state, formAction] = useActionState<FormState, FormData>(createOrder, { ok: true, message: "" });
  return (
    <form action={formAction}>
      <select name="drink" defaultValue="Latte">
        <option>Latte</option><option>Mocha</option><option>Cold Brew</option>
      </select>
      <input name="qty" type="number" defaultValue={1} aria-label="Số lượng" />
      <Submit />
      {state.message && <p role="status">{state.message}</p>}
    </form>
  );
}
```

</details>

<details><summary>m11/api.ts — script ví dụ 1: gọi API như client bên ngoài</summary>

`m11/api.ts`

```tsx
// Gọi /api/orders như 1 client bên ngoài (app mobile, Postman, curl) — in method, path, status, body
import { serve } from "./serve";

const srv = await serve("m11/app", 3103);
async function call(method: string, path: string, body?: unknown) {
  const res = await fetch(srv.origin + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const loc = res.headers.get("location");
  console.log(`${method.padEnd(6)} ${path.padEnd(16)} ${body ? JSON.stringify(body).padEnd(30) : "".padEnd(30)} → ${res.status}${loc ? ` Location: ${loc}` : ""} ${text}`);
}
await call("GET", "/api/orders");
await call("POST", "/api/orders", { drink: "Mocha", qty: 3 });
await call("POST", "/api/orders", { drink: "Trà sữa", qty: 0 });
await call("PATCH", "/api/orders/3", { status: "served" });
await call("DELETE", "/api/orders/1");
await call("DELETE", "/api/orders/99");
await call("GET", "/api/orders");
await srv.close();
```

</details>

<details><summary>m11/action.ts — script ví dụ 2: Chromium đặt món, có và không có JavaScript</summary>

`m11/action.ts`

```tsx
// Chromium thật: đặt món qua form dùng Server Action; xem request đi đâu; thử lại khi TẮT JavaScript
import type { Page } from "playwright-core";
import { serve } from "./serve";
import { launch } from "./browser";

const srv = await serve("m11/app", 3104);
const browser = await launch();
const list = async (p: Page) => (await p.locator("li").allInnerTexts()).join(" | ");

async function order(p: Page, label: string, drink: string, qty: string) {
  const before = (await p.getByRole("status").count()) ? await p.getByRole("status").innerText() : "";
  await p.getByRole("combobox").selectOption(drink);
  await p.getByLabel("Số lượng").fill(qty);
  await p.getByRole("button", { name: "Đặt món" }).click();
  await p.waitForFunction((b) => (document.querySelector("[role=status]")?.textContent ?? "") !== b, before);
  console.log(`${label.padEnd(26)} → "${await p.getByRole("status").innerText()}" · danh sách: ${await list(p)}`);
}

const p = await browser.newPage();
p.on("request", (r) => {
  if (r.method() === "POST") console.log(`  ↳ request: POST ${new URL(r.url()).pathname}  Next-Action: ${(r.headers()["next-action"] ?? "").slice(0, 12)}…`);
});
await p.goto(srv.origin + "/orders");
await order(p, "JS bật: 3× Mocha", "Mocha", "3");
await order(p, "JS bật: 0× Latte", "Latte", "0");

const noJs = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
await noJs.goto(srv.origin + "/orders");
await order(noJs, "JS TẮT: 2× Cold Brew", "Cold Brew", "2");
console.log("Log server:", srv.serverLines().join(" / "));
await browser.close();
await srv.close();
```

</details>

### 2 · Concept
| | Route Handler | Server Action | Bên C# |
|---|---|---|---|
| Khai báo | `app/api/orders/route.ts`: `export async function POST(req: Request)` | File `"use server"`: `export async function createOrder(prev, formData)` | `app.MapPost(...)` vs `OnPostAsync` của Razor Pages |
| URL | Cố định, bạn chọn: `/api/orders/:id` | Next tự sinh: POST vào URL trang hiện tại + header `Next-Action: <id>` | — |
| Ai gọi | Bất kỳ HTTP client: mobile, webhook, curl | Form, nút, `startTransition` trong app — import như hàm | — |
| Input | `await req.json()`, `params` (Promise) | `FormData` (form) hoặc tham số serialize được | Model binding |
| Sau khi ghi | Status chuẩn: 201, 400, 404, 204 | Trả state cho `useActionState`; `revalidatePath` / `redirect` | `return Page()` / `RedirectToPage` |
| Tắt JavaScript | — | Form vẫn chạy (progressive enhancement) | Form HTML thường |

### 3 · Flow / lifecycle
**Bấm "Đặt món" → danh sách mới hiện ra, qua những bước nào?**

```mermaid
flowchart LR
  N0["Bấm Đặt món<br/><small>form action</small>"]
  N1["POST /orders<br/><small>header Next-Action</small>"]
  N2["createOrder<br/><small>Zod safeParse → ghi</small>"]
  N3["Đánh dấu cũ<br/><small>/orders cần render lại</small>"]
  N4["1 response<br/><small>kết quả + RSC trang mới</small>"]
  N5["UI cập nhật<br/><small>không F5</small>"]
  N0 --> N1
  N1 --> N2
  N2 --> N3
  N3 --> N4
  N4 --> N5
```

Đọc sơ đồ: Trình duyệt gửi form thành 1 POST tới chính URL trang kèm id của action; server chạy hàm của bạn (validate → ghi); `revalidatePath` đánh dấu `/orders` đã cũ nên Next render lại ngay trong response đó → 1 vòng mạng trả cả kết quả action lẫn danh sách mới, không F5.

### 4 · Ví dụ thực tế
**Ví dụ 1.** Route handler cho `/api/orders` (file `[id]/route.ts` cho PATCH/DELETE mở ở mục 1). Script `m11/api.ts` gọi như 1 client bên ngoài.

`m11/app/app/api/orders/route.ts`

```tsx
// /api/orders — Route Handler: export hàm trùng tên HTTP method, nhận Request chuẩn Web, trả Response
import { NextResponse } from "next/server";
import { z } from "zod";
import { addOrder, listOrders, OrderInput } from "../../../lib/orders";

export async function GET() {
  return NextResponse.json(listOrders());
}

export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  const parsed = OrderInput.safeParse(body);       // ≈ ModelState.IsValid
  if (!parsed.success) {
    return NextResponse.json({ errors: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  }
  const order = addOrder(parsed.data);
  return NextResponse.json(order, { status: 201, headers: { Location: `/api/orders/${order.id}` } });
}
```

```console
❯ npx tsx m11/api.ts
GET    /api/orders                                     → 200 [{"id":1,"drink":"Latte","qty":2,"status":"served"},{"id":2,"drink":"Mocha","qty":1,"status":"new"}]
POST   /api/orders      {"drink":"Mocha","qty":3}      → 201 Location: /api/orders/3 {"drink":"Mocha","qty":3,"id":3,"status":"new"}
POST   /api/orders      {"drink":"Trà sữa","qty":0}    → 400 {"errors":{"drink":["Món không có trong thực đơn"],"qty":["Ít nhất 1 ly"]}}
PATCH  /api/orders/3    {"status":"served"}            → 200 {"drink":"Mocha","qty":3,"id":3,"status":"served"}
DELETE /api/orders/1                                   → 204 
DELETE /api/orders/99                                  → 404 {"error":"Không có đơn"}
GET    /api/orders                                     → 200 [{"id":2,"drink":"Mocha","qty":1,"status":"new"},{"drink":"Mocha","qty":3,"id":3,"status":"served"}]
```

Mỗi hàm export là 1 HTTP method; method không export → Next tự trả 405. Zod `safeParse` ≈ `ModelState.IsValid`: sai thì 400 kèm lỗi theo field, còn `z.infer` cho luôn kiểu TS của input. Route handler luôn ƒ (động) và GET không bị cache mặc định (từ Next 15). Không `[ApiController]`, không DI container: chỉ là hàm `Request → Response`, test được bằng cách gọi thẳng.

**Ví dụ 2.** Cùng việc "tạo đơn" nhưng cho UI của chính app: không có `/api`, form gọi thẳng `createOrder`. `OrderForm.tsx` (mục 1) dùng `useActionState` giữ kết quả, `useFormStatus` khoá nút khi đang gửi. `m11/action.ts` đặt món bằng Chromium, rồi lặp lại khi **tắt** JavaScript.

`m11/app/app/orders/actions.ts`

```tsx
"use server"; // mọi export của file này là Server Action: Next tự sinh 1 endpoint POST cho mỗi hàm

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addOrder, OrderInput } from "../../lib/orders";

export type FormState = { ok: boolean; message: string };

export async function createOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = OrderInput.safeParse(Object.fromEntries(formData)); // input từ client = KHÔNG tin
  if (!parsed.success) {
    return { ok: false, message: Object.values(z.flattenError(parsed.error).fieldErrors).flat().join(", ") };
  }
  const order = addOrder(parsed.data);
  console.log(`[server] createOrder → #${order.id} ${order.qty}× ${order.drink}`);
  revalidatePath("/orders"); // báo Next: HTML/RSC của /orders đã cũ → render lại với dữ liệu mới
  return { ok: true, message: `Đã tạo đơn #${order.id}` };
}
```

```console
❯ npx tsx m11/action.ts
  ↳ request: POST /orders  Next-Action: 608a29aabcac…
JS bật: 3× Mocha           → "Đã tạo đơn #3" · danh sách: #1 · 2× Latte · served | #2 · 1× Mocha · new | #3 · 3× Mocha · new
  ↳ request: POST /orders  Next-Action: 608a29aabcac…
JS bật: 0× Latte           → "Ít nhất 1 ly" · danh sách: #1 · 2× Latte · served | #2 · 1× Mocha · new | #3 · 3× Mocha · new
JS TẮT: 2× Cold Brew       → "Đã tạo đơn #4" · danh sách: #1 · 2× Latte · served | #2 · 1× Mocha · new | #3 · 3× Mocha · new | #4 · 2× Cold Brew · new
Log server: [server] createOrder → #3 3× Mocha / [server] createOrder → #4 2× Cold Brew
```

Request thật là `POST /orders` (chính URL trang) kèm header `Next-Action` — id do Next sinh lúc build, bạn không viết endpoint nào. Danh sách cập nhật ngay nhờ `revalidatePath("/orders")` (trang ○ tĩnh được render lại). Khi JS tắt, form vẫn gửi như HTML thuần và server trả trang hoàn chỉnh — `useActionState` hỗ trợ sẵn. Phía client, `createOrder` chỉ là 1 "tham chiếu" gọi qua mạng; code của hàm không vào bundle.

### 5 · Thử thật / bẫy
**Bẫy 1.** **"Nút này chỉ admin thấy" nên action khỏi kiểm quyền.** Trang quản trị có nút "Xoá hết đơn"; người lạ không đăng nhập, không trình duyệt thử gọi nó.

`m11/traps/public-action/app/actions.ts`

```tsx
"use server";

import { listOrders, removeOrder } from "../../../app/lib/orders";

// ❌ Không hỏi "ai đang gọi?" — tin rằng chỉ admin thấy nút thì chỉ admin gọi được
export async function deleteAllOrders() {
  for (const o of [...listOrders()]) removeOrder(o.id);
  console.log("[server] deleteAllOrders() đã chạy");
}
```

```console
❯ npx next build m11/traps/public-action > /dev/null && npx tsx m11/forge.ts
GET  /  → <h1>2 đơn</h1> · action id lộ trong HTML: $ACTION_ID_0056bbbfa2c82…
POST /  (không cookie, không đăng nhập) → 200
GET  /  → <h1>0 đơn</h1>
Log server: [server] deleteAllOrders() đã chạy
```

Mỗi Server Action là **1 endpoint POST công khai**. Id nằm ngay trong HTML (để form chạy khi không có JS) hoặc trong chunk JS; có id là gọi được. Ẩn nút ở UI không phải bảo mật. Sửa: đầu mỗi action ghi dữ liệu nhạy cảm, gọi `verifySession()` và kiểm vai trò (bài 11.3) — như `[Authorize]` trên từng action của controller.

**Bẫy 2.** **Ghi xong quên `revalidatePath`.** Cùng trang đơn hàng, action giống ví dụ 2 nhưng thiếu 1 dòng.

`m11/traps/no-revalidate/app/actions.ts`

```tsx
"use server";

import { z } from "zod";
import { addOrder, OrderInput } from "../../../app/lib/orders";

export type FormState = { ok: boolean; message: string };

// ❌ Ghi dữ liệu xong nhưng không revalidatePath("/orders")
export async function createOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = OrderInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: z.prettifyError(parsed.error) };
  const order = addOrder(parsed.data);
  return { ok: true, message: `Đã tạo đơn #${order.id}` };
}
```

```console
❯ npx next build m11/traps/no-revalidate > /dev/null && npx tsx m11/stale.ts
Mở trang        → #1 · 2× Latte · served | #2 · 1× Mocha · new
Bấm Đặt món     → "Đã tạo đơn #3" · #1 · 2× Latte · served | #2 · 1× Mocha · new
F5              → #1 · 2× Latte · served | #2 · 1× Mocha · new
Header trang    → x-nextjs-cache: HIT · cache-control: s-maxage=31536000
```

Action chạy thành công ("Đã tạo đơn #3") nhưng danh sách đứng yên, F5 vẫn 2 đơn: trang là ○ — HTML render lúc build, nằm trong cache (`x-nextjs-cache: HIT`, `s-maxage` 1 năm). Không ai báo nó cũ thì nó cũ mãi. Thêm `revalidatePath("/")` (hoặc `updateTag`, bài 11.4) thì Next render lại ngay trong response của action.

**Bẫy 3.** **Server Component gọi route handler của chính app** bằng `fetch("/api/orders")` — thói quen từ SPA.

`m11/traps/self-fetch/app/page.tsx`

```tsx
// ❌ Server Component gọi lại route handler của CHÍNH app bằng fetch đường dẫn tương đối
type Order = { id: number; drink: string; qty: number };

export default async function OrdersPage() {
  const res = await fetch("/api/orders");
  const orders = (await res.json()) as Order[];
  return <ul>{orders.map((o) => <li key={o.id}>{o.qty}× {o.drink}</li>)}</ul>;
}
```

```console
❯ npx next build m11/traps/self-fetch
  Generating static pages using 1 worker (0/3) ...
Error occurred prerendering page "/". Read more: https://nextjs.org/docs/messages/prerender-error
TypeError: Failed to parse URL from /api/orders
    at async c (m11/traps/self-fetch/app/page.tsx:5:15)
  3 |
  4 | export default async function OrdersPage() {
> 5 |   const res = await fetch("/api/orders");
    |               ^
  6 |   const orders = (await res.json()) as Order[];
  7 |   return <ul>{orders.map((o) => <li key={o.id}>{o.qty}× {o.drink}</li>)}</ul>;
```

(… còn 25 dòng — đã trích dòng 9–18 / 35 của `npx next build m11/traps/self-fetch`)

Ở server không có "origin hiện tại" nên URL tương đối không parse được. Thêm `http://localhost:3000` thì còn tệ hơn: 1 vòng HTTP thừa tới chính mình, lúc build server chưa chạy nên gãy, mất kiểu dữ liệu. Server Component gọi **thẳng hàm** trong `lib/orders.ts`; route handler để dành cho người gọi bên ngoài.

### 6 · Tóm tắt bằng hình
**(a) Cây thư mục sau bài này**

```text
m11/
├─ app/lib/orders.ts  [MỚI]  ← Zod schema + "bảng" đơn (globalThis)
├─ app/app/api/orders/route.ts  [MỚI]  ← GET · POST
├─ app/app/api/orders/[id]/route.ts  [MỚI]  ← PATCH · DELETE
├─ app/app/orders/page.tsx  [MỚI]  ← ○ danh sách, đọc thẳng dữ liệu
├─ app/app/orders/actions.ts  [MỚI]  ← "use server" createOrder
├─ app/app/orders/OrderForm.tsx  [MỚI]  ← useActionState + useFormStatus
├─ api.ts · action.ts · forge.ts · stale.ts  [MỚI]  ← script ví dụ + bẫy
├─ traps/public-action · no-revalidate · self-fetch  [MỚI]  ← 3 bẫy
└─ ex2/start · ex2/solution · ex2/check.ts  [MỚI]  ← bài Làm ngay
```

**(b) Đọc trong 10 giây**

**Cần nhận yêu cầu ghi dữ liệu: dùng gì?**

```mermaid
flowchart LR
  N0["Ghi dữ liệu<br/><small>tạo / sửa / xoá</small>"]
  N1["Ai gọi?<br/><small>trong hay ngoài app</small>"]
  N0 --> N1
  O0["UI của app<br/><small>Server Action</small>"]
  N1 --> O0
  O1["Mobile, webhook<br/><small>Route Handler</small>"]
  N1 --> O1
  O2["Cả hai<br/><small>chung hàm trong lib/</small>"]
  N1 --> O2
```

Đọc sơ đồ: Hỏi "ai gọi?". UI của chính app → Server Action. Bên ngoài (mobile, webhook) → Route Handler. Cả hai → logic đặt ở `lib/`, mỗi bên là 1 lớp mỏng gọi vào.

### 7 · Làm ngay (≤ 10 phút)
**Mục tiêu:** `m11/ex2/start`: mỗi đơn có nút "Huỷ #id" gọi action `cancelOrder` do AI viết — xoá bất kể trạng thái, tin id từ client, không làm mới danh sách. Chỉ sửa `app/actions.ts`.

File khởi đầu:

`m11/ex2/start/app/actions.ts`

```tsx
"use server"; // ← CHỈ sửa file này

import { removeOrder } from "../../../app/lib/orders";

export async function cancelOrder(_prev: string, formData: FormData): Promise<string> {
  const id = Number(formData.get("id"));
  removeOrder(id);
  return `Đã huỷ #${id}`;
}
```

Chạy file khởi đầu (đang đỏ):

```console
❯ npx next build m11/ex2/start > /dev/null && npx tsx m11/ex2/check.ts m11/ex2/start
✗ Huỷ #1 (served) → báo không huỷ được, #1 vẫn còn  → "Đã huỷ #1", còn 1 dòng
✗ Huỷ #2 (new) → biến mất khỏi danh sách, không cần F5  → locator.waitFor: Timeout 3000ms exceeded.
✗ Sửa hidden input thành 99 rồi bấm → "Không có đơn"  → "Đã huỷ #99"
0/3 đạt
```

Tiêu chí nghiệm thu:

- [ ] Huỷ đơn đã phục vụ (#1) → "Đơn #1 đã phục vụ, không huỷ được", đơn vẫn còn
- [ ] Huỷ đơn mới (#2) → biến mất khỏi danh sách ngay, không F5
- [ ] Sửa hidden input thành 99 (giả lập request bị chỉnh) → "Không có đơn"
- [ ] `npx tsc -p .` không lỗi

Lệnh nghiệm thu:

```bash
npx next build m11/ex2/start > /dev/null && npx tsx m11/ex2/check.ts m11/ex2/start && npx tsc -p .
```

Lời giải tham chiếu chạy ra (output cần đạt):

```console
❯ npx next build m11/ex2/solution > /dev/null && npx tsx m11/ex2/check.ts m11/ex2/solution
✓ Huỷ #1 (served) → báo không huỷ được, #1 vẫn còn
✓ Huỷ #2 (new) → biến mất khỏi danh sách, không cần F5
✓ Sửa hidden input thành 99 rồi bấm → "Không có đơn"
3/3 đạt
```

<details><summary>Gợi ý nếu bị đỏ</summary>

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| #2 vẫn còn sau khi huỷ | Thiếu `revalidatePath` | `revalidatePath("/")` sau khi xoá |
| "Đã huỷ #99" | Tin id từ client | `findOrder(id)` trước; không có → trả "Không có đơn" |
| Check 1 báo "Đã huỷ #1" | Không kiểm `status` | `order.status === "served"` → trả thông báo, không xoá |

`m11/ex2/start/app/actions.ts` (diff)

```diff
 "use server"; // ← CHỈ sửa file này
 
-import { removeOrder } from "../../../app/lib/orders";
+import { revalidatePath } from "next/cache";
+import { findOrder, removeOrder } from "../../../app/lib/orders";
 
 export async function cancelOrder(_prev: string, formData: FormData): Promise<string> {
   const id = Number(formData.get("id"));
+  const order = findOrder(id);                     // id đến từ client: có thể bị sửa
+  if (!order) return "Không có đơn";
+  if (order.status === "served") return `Đơn #${id} đã phục vụ, không huỷ được`;
   removeOrder(id);
+  revalidatePath("/");
   return `Đã huỷ #${id}`;
 }
```

</details>

### 8 · 3 câu hỏi nhanh
1. Phỏng vấn: "Khi nào Route Handler, khi nào Server Action?"

   <details><summary>Đáp án</summary>

   Server Action: thao tác ghi từ UI của chính app — ít code, có kiểu từ đầu tới cuối, chạy cả khi tắt JS, trả kết quả + UI mới trong 1 response. Route Handler: có người gọi ngoài app (mobile, webhook Stripe — bài 12.2), cần URL/method/status ổn định, cần GET cho bên khác đọc, cần stream (bài 12.1). Action luôn là POST và không dùng để đọc dữ liệu (đọc thì Server Component). Logic chung để ở `lib/`.

   </details>

2. "Server Action có cần lo CSRF không?"

   <details><summary>Đáp án</summary>

   Next so header `Origin` với `Host` của request action và chỉ nhận POST, nên trang lạ không lợi dụng cookie của user để gọi được (đứng sau proxy đổi host thì khai `allowedOrigins` cho Server Actions trong `next.config`). Cookie session nên `SameSite=Lax` (bài 11.3). Nhưng chống CSRF không thay được kiểm quyền: request tự gửi không kèm Origin (như `forge.ts`) hoặc user hợp lệ nhưng sai vai trò vẫn phải bị chặn bên trong action.

   </details>

3. Review code AI: form tạo đơn `"use client"`, `onSubmit` gọi `fetch("/api/orders", { method: "POST" })`, xong `router.refresh()`, nút không khoá khi đang gửi, chỉ validate ở client. Góp ý?

   <details><summary>Đáp án</summary>

   UI nội bộ → Server Action + `useActionState` (bỏ route handler nếu chỉ form này dùng). Khoá nút bằng `useFormStatus` / `isPending` để chặn gửi 2 lần. `revalidatePath` trong action thay `router.refresh()` (server biết trang nào cũ, 1 vòng mạng). Validate lại ở server bằng Zod `safeParse` — validate ở client chỉ là UX.

   </details>


---

## Bài 11.3 · Data layer: Drizzle + Postgres, và auth bằng session + DAL

_Nguồn roadmap: [NextAI] ORM & Prisma → Drizzle ORM → Better Auth Google/GitHub → Clerk authentication_

### 1 · Một câu & nằm ở đâu
ORM trong Next chỉ chạy ở server (Server Component, Action, Route Handler). **Drizzle** = khai báo bảng bằng TS (code-first như EF Core), `drizzle-kit generate` sinh migration SQL, query builder gần SQL và có kiểu đầy đủ. Auth gồm 3 lớp: **`proxy.ts`** chặn sớm (chỉ xem có cookie chưa — kiểm tra lạc quan), **DAL** `verifySession()` verify chữ ký JWT ở **mọi** page/action/route cần quyền (chốt thật), và UI ẩn/hiện. Better Auth / Clerk làm sẵn session + OAuth, nhưng bạn vẫn phải gọi kiểm tra trong DAL.

Trình duyệt → **[proxy.ts]** → Route: page / route.ts → **[Server Component · Action]** → **[DAL · DB]** → Cache · HTML/RSC

<details><summary>m11/db/drizzle.config.ts — cấu hình drizzle-kit (≈ dotnet ef)</summary>

`m11/db/drizzle.config.ts`

```tsx
// Cấu hình drizzle-kit (CLI sinh migration) — ≈ dotnet ef migrations add
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./m11/db/schema.ts",
  out: "./m11/db/migrations",
});
```

</details>

<details><summary>m11/db/client.ts — mở PGlite, chạy migration, seed — máy thật đổi sang node-postgres</summary>

`m11/db/client.ts`

```tsx
// Kết nối DB. Sandbox: PGlite = Postgres thật biên dịch sang WASM, chạy trong process (không cần server)
// Máy thật: import { drizzle } from "drizzle-orm/node-postgres"; drizzle(process.env.DATABASE_URL!)
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "./schema";
import * as relations from "./relations";

export async function openDb(opts: { logSql?: boolean } = {}) {
  const client = new PGlite(); // in-memory
  let ready = false; // chỉ in SQL của bạn, không in SQL của migrate/seed
  const db = drizzle({
    client,
    schema: { ...schema, ...relations },
    logger: { logQuery: (q, p) => void (opts.logSql && ready && console.log(`  SQL: ${q}  -- params ${JSON.stringify(p)}`)) },
  });
  await migrate(db, { migrationsFolder: "m11/db/migrations" }); // ≈ Database.Migrate()
  await db.insert(schema.drinks).values([
    { name: "Latte", price: 45000 }, { name: "Mocha", price: 50000 }, { name: "Cold Brew", price: 55000 },
  ]);
  await db.insert(schema.users).values([{ email: "admin@cafe.vn", role: "admin" }, { email: "an@cafe.vn" }]);
  ready = true;
  return { db, client };
}
```

</details>

<details><summary>m11/db/relations.ts — quan hệ cho relational query (≈ navigation property)</summary>

`m11/db/relations.ts`

```tsx
// Quan hệ cho relational query (db.query.*.findMany({ with })) — ≈ navigation property của EF Core
import { relations } from "drizzle-orm";
import { drinks, orders } from "./schema";

export const ordersRelations = relations(orders, ({ one }) => ({
  drink: one(drinks, { fields: [orders.drinkId], references: [drinks.id] }),
}));
export const drinksRelations = relations(drinks, ({ many }) => ({ orders: many(orders) }));
```

</details>

<details><summary>m11/app/lib/session.ts — ký / verify JWT bằng jose, đặt cookie httpOnly</summary>

`m11/app/lib/session.ts`

```tsx
// Session = JWT ký HS256 nằm trong cookie httpOnly (≈ cookie auth của ASP.NET, nhưng tự viết)
import "server-only";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

const key = new TextEncoder().encode(process.env.SESSION_SECRET ?? "dev-only-secret-change-me-32-bytes!!");
export type Session = { email: string; role: "staff" | "admin" };

export async function signSession(s: Session): Promise<string> {
  return new SignJWT(s).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("2h").sign(key);
}

export async function readSession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<Session>(token, key, { algorithms: ["HS256"] }); // kiểm chữ ký + hạn
    return { email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export async function createSession(s: Session) {
  const jar = await cookies();
  jar.set("session", await signSession(s), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 7200 });
}

export async function deleteSession() {
  (await cookies()).delete("session");
}
```

</details>

<details><summary>m11/app/lib/users.ts — tài khoản mẫu, mật khẩu băm scrypt</summary>

`m11/app/lib/users.ts`

```tsx
// Tài khoản mẫu. Thật: bảng users + bcrypt/argon2, salt riêng từng user (hoặc để Better Auth / Clerk lo)
import "server-only";
import { scryptSync, timingSafeEqual } from "node:crypto";
import type { Session } from "./session";

const hash = (pw: string) => scryptSync(pw, "demo-salt", 32);
const USERS = [
  { email: "admin@cafe.vn", role: "admin", hash: hash("admin123") },
  { email: "an@cafe.vn", role: "staff", hash: hash("an123") },
] as const;

export function checkLogin(email: string, password: string): Session | null {
  const u = USERS.find((x) => x.email === email);
  return u && timingSafeEqual(u.hash, hash(password)) ? { email: u.email, role: u.role } : null;
}
```

</details>

<details><summary>m11/app/proxy.ts — proxy.ts: không cookie → /login (Next 16, trước là middleware.ts)</summary>

`m11/app/proxy.ts`

```tsx
// proxy.ts (Next 16, trước đây là middleware.ts): chạy TRƯỚC khi route được render
// Chỉ kiểm tra "lạc quan": có cookie chưa → chưa thì đẩy về /login sớm. KHÔNG verify chữ ký, KHÔNG truy vấn DB.
import { NextResponse, type NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  if (!req.cookies.has("session")) {
    return NextResponse.redirect(new URL(`/login?next=${req.nextUrl.pathname}`, req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
```

</details>

<details><summary>m11/app/app/login/actions.ts — action login / logout</summary>

`m11/app/app/login/actions.ts`

```tsx
"use server";

import { redirect } from "next/navigation";
import { createSession, deleteSession } from "../../lib/session";
import { checkLogin } from "../../lib/users";

export async function login(_prev: string, formData: FormData): Promise<string> {
  const user = checkLogin(String(formData.get("email")), String(formData.get("password")));
  if (!user) return "Sai email hoặc mật khẩu";
  await createSession(user);
  redirect("/admin");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
```

</details>

<details><summary>m11/app/app/admin/page.tsx — trang được bảo vệ: gọi verifySession()</summary>

`m11/app/app/admin/page.tsx`

```tsx
// /admin — trang được bảo vệ: proxy chặn sớm, nhưng chốt chặn thật là verifySession() ngay tại đây
import { verifySession } from "../../lib/dal";
import { logout } from "../login/actions";

export default async function AdminPage() {
  const session = await verifySession();
  return (
    <>
      <h1>{`Xin chào ${session.email} (${session.role})`}</h1>
      <form action={logout}><button>Đăng xuất</button></form>
    </>
  );
}
```

</details>

<details><summary>m11/authflow.ts — script ví dụ 3</summary>

`m11/authflow.ts`

```tsx
// Luồng đăng nhập: request thô (như curl) + Chromium thật
import { serve } from "./serve";
import { launch } from "./browser";

const srv = await serve("m11/app", 3107);
async function raw(label: string, cookie?: string) {
  const r = await fetch(srv.origin + "/admin", { redirect: "manual", headers: cookie ? { cookie } : {} });
  console.log(`${label.padEnd(34)} → ${r.status} ${r.headers.get("location") ?? ""}`);
}
await raw("GET /admin, không cookie");
await raw("GET /admin, cookie giả session=abc", "session=abc");

const p = await (await launch()).newPage();
await p.goto(srv.origin + "/admin");
console.log(`Chromium mở /admin                 → đang ở ${new URL(p.url()).pathname}${new URL(p.url()).search}`);
async function login(email: string, pw: string, waitFor: string) {
  await p.getByLabel("Email").fill(email);
  await p.getByLabel("Mật khẩu").fill(pw);
  await p.getByRole("button", { name: "Đăng nhập" }).click();
  const shown = await p.locator(waitFor).innerText();
  console.log(`Đăng nhập ${email} / ${pw.padEnd(6)}      → ${new URL(p.url()).pathname} · "${shown}"`);
}
await login("an@cafe.vn", "sai", "p[role=alert]");
await login("an@cafe.vn", "an123", 'h1:has-text("Xin chào")');
const c = (await p.context().cookies()).find((x) => x.name === "session")!;
console.log(`Cookie session: httpOnly=${c.httpOnly} secure=${c.secure} sameSite=${c.sameSite} · ${c.value.slice(0, 20)}…`);
console.log(`document.cookie trong trang        → ${JSON.stringify(await p.evaluate(() => document.cookie))}`);
await p.context().browser()?.close();
await srv.close();
```

</details>

### 2 · Concept
| Khái niệm | Trong bài | Ghi chú | Bên C# |
|---|---|---|---|
| Schema | `pgTable("orders", {...})` trong `db/schema.ts`; kiểu suy ra bằng `$inferSelect` | Không viết DTO tay | Entity + `DbContext` |
| Migration | `drizzle-kit generate` → `migrations/0000_init.sql`; `migrate()` lúc khởi động hoặc trong CI | SQL thật, review được, commit cùng code | `dotnet ef migrations add`, `Database.Migrate()` |
| Query | `db.select().from(orders).innerJoin(…)` (gần SQL) · `db.query.orders.findMany({ with })` | Giá trị luôn bind `$1`; `sql.raw` thì không | LINQ to Entities, `.Include()` |
| Prisma | Schema riêng `schema.prisma`, client sinh code | Nặng hơn, API cao cấp hơn; cùng vị trí kiến trúc | EF Core "đầy đủ" |
| Session | JWT ký HS256 trong cookie `httpOnly; Secure; SameSite=Lax` | `jose` verify chữ ký + hạn | Cookie authentication handler |
| `proxy.ts` | Chạy trước route khớp `matcher`; chỉ kiểm có cookie → redirect sớm | Không verify nặng, không gọi DB | Middleware trong pipeline |
| DAL | `verifySession()` bọc `cache()`, gọi ở **mọi** nơi đọc/ghi cần quyền | Chốt chặn thật, gần dữ liệu | `[Authorize]` + policy |

### 3 · Flow / lifecycle
**Request tới /admin đi qua mấy lớp kiểm tra?**

```mermaid
flowchart LR
  N0["GET /admin<br/><small>kèm cookie session?</small>"]
  N1["proxy.ts<br/><small>không cookie → /login</small>"]
  N2["page.tsx<br/><small>gọi DAL kiểm session</small>"]
  N3["jwtVerify<br/><small>chữ ký + hạn</small>"]
  N4["Drizzle query<br/><small>chỉ sau bước 4</small>"]
  N5["HTML<br/><small>Xin chào an@cafe.vn</small>"]
  N0 --> N1
  N1 --> N2
  N2 --> N3
  N3 --> N4
  N4 --> N5
```

Đọc sơ đồ: Trái → phải: proxy chặn sớm người chưa có cookie (rẻ, không verify); page gọi `verifySession()` — jose verify chữ ký và hạn, sai thì về `/login`; chỉ khi qua bước này code mới chạm DB. Action và route handler cũng phải gọi lại bước 3, vì chúng không đi qua page.

### 4 · Ví dụ thực tế
**Ví dụ 1.** Ba bảng: món, đơn (khoá ngoại tới món, enum trạng thái), user (enum vai trò). Sinh migration từ schema rồi đọc file SQL.

`m11/db/schema.ts`

```tsx
// Schema Drizzle = "code-first" như EF Core: khai báo bảng bằng TS, drizzle-kit sinh migration SQL
import { integer, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("order_status", ["new", "served"]);
export const roleEnum = pgEnum("role", ["staff", "admin"]);

export const drinks = pgTable("drinks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  price: integer("price").notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  drinkId: integer("drink_id").notNull().references(() => drinks.id),
  qty: integer("qty").notNull(),
  status: statusEnum("status").notNull().default("new"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  role: roleEnum("role").notNull().default("staff"),
});

export type Drink = typeof drinks.$inferSelect;   // kiểu suy ra từ bảng — không viết tay DTO
export type NewOrder = typeof orders.$inferInsert;
```

```console
❯ rm -rf m11/db/migrations && npx drizzle-kit generate --config m11/db/drizzle.config.ts --name init && cat m11/db/migrations/0000_init.sql
Reading config file '/home/claude/sandbox/m11/db/drizzle.config.ts'
3 tables
drinks 3 columns 0 indexes 0 fks
orders 5 columns 0 indexes 1 fks
users 3 columns 0 indexes 0 fks

[✓] Your SQL migration file ➜ m11/db/migrations/0000_init.sql 🚀
CREATE TYPE "public"."role" AS ENUM('staff', 'admin');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('new', 'served');--> statement-breakpoint
CREATE TABLE "drinks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	CONSTRAINT "drinks_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"drink_id" integer NOT NULL,
	"qty" integer NOT NULL,
	"status" "order_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" "role" DEFAULT 'staff' NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_drink_id_drinks_id_fk" FOREIGN KEY ("drink_id") REFERENCES "public"."drinks"("id") ON DELETE no action ON UPDATE no action;
```

drizzle-kit so schema TS với snapshot lần trước (`migrations/meta/`) và sinh SQL chênh lệch — như `dotnet ef migrations add`. File SQL đọc được, review được trong PR, commit cùng code. Enum TS thành `CREATE TYPE … AS ENUM`, `.references()` thành FOREIGN KEY. Áp vào DB: `migrate()` (xem `db/client.ts`) hoặc `drizzle-kit migrate` trong CI trước khi deploy.

**Ví dụ 2.** `openDb()` (mục 1) tạo **PGlite** in-memory — Postgres thật biên dịch sang WASM, thay server Postgres ở sandbox — chạy migration, seed 3 món. Bật log để thấy SQL Drizzle sinh ra.

`m11/db/queries.ts`

```tsx
// Truy vấn có kiểu: insert … returning, join + groupBy — xem SQL Drizzle sinh ra (≈ ToQueryString của EF)
import { desc, eq, sql, sum } from "drizzle-orm";
import { openDb } from "./client";
import { drinks, orders } from "./schema";

const { db } = await openDb({ logSql: true });

console.log("1) Thêm 3 đơn, lấy lại id:");
const added = await db.insert(orders)
  .values([{ drinkId: 1, qty: 2 }, { drinkId: 2, qty: 1 }, { drinkId: 1, qty: 3, status: "served" }])
  .returning({ id: orders.id });
console.log("  →", JSON.stringify(added));

console.log("2) Doanh thu theo món (join + group by):");
const total = sql<number>`sum(${orders.qty} * ${drinks.price})`.mapWith(Number);
const revenue = await db
  .select({ drink: drinks.name, cups: sum(orders.qty).mapWith(Number), total })
  .from(orders)
  .innerJoin(drinks, eq(orders.drinkId, drinks.id))
  .groupBy(drinks.name)
  .orderBy(desc(total));
console.log("  →", JSON.stringify(revenue));

console.log("3) Relational query: đơn 'new' kèm món:");
const pending = await db.query.orders.findMany({
  where: eq(orders.status, "new"),
  columns: { id: true, qty: true },
  with: { drink: { columns: { name: true } } },     // ≈ .Include(o => o.Drink)
});
console.log("  →", JSON.stringify(pending));
```

```console
❯ npx tsx m11/db/queries.ts
1) Thêm 3 đơn, lấy lại id:
  SQL: insert into "orders" ("id", "drink_id", "qty", "status", "created_at") values (default, $1, $2, default, default), (default, $3, $4, default, default), (default, $5, $6, $7, default) returning "id"  -- params [1,2,2,1,1,3,"served"]
  → [{"id":1},{"id":2},{"id":3}]
2) Doanh thu theo món (join + group by):
  SQL: select "drinks"."name", sum("orders"."qty"), sum("orders"."qty" * "drinks"."price") from "orders" inner join "drinks" on "orders"."drink_id" = "drinks"."id" group by "drinks"."name" order by sum("orders"."qty" * "drinks"."price") desc  -- params []
  → [{"drink":"Latte","cups":5,"total":225000},{"drink":"Mocha","cups":1,"total":50000}]
3) Relational query: đơn 'new' kèm món:
  SQL: select "orders"."id", "orders"."qty", "orders_drink"."data" as "drink" from "orders" "orders" left join lateral (select json_build_array("orders_drink"."name") as "data" from (select * from "drinks" "orders_drink" where "orders_drink"."id" = "orders"."drink_id" limit $1) "orders_drink") "orders_drink" on true where "orders"."status" = $2  -- params [1,"new"]
  → [{"id":1,"qty":2,"drink":{"name":"Latte"}},{"id":2,"qty":1,"drink":{"name":"Mocha"}}]
```

Mỗi query in đúng 1 câu SQL — không lazy loading, không N+1 ngầm như navigation property của EF. Giá trị luôn đi qua tham số `$1, $2`. `returning()` trả lại id (≈ EF tự điền `Id` sau `SaveChanges`). `sum()` của Postgres trả `numeric` dạng chuỗi nên cần `.mapWith(Number)`. Relational query với `with` ≈ `.Include()`, gộp thành 1 câu dùng `LATERAL JOIN`. Bài 11.5 gọi Drizzle ngay trong app Next.

**Ví dụ 3.** Đăng nhập = action `login` (mục 1) kiểm mật khẩu, ký JWT, đặt cookie. Trang `/admin` gọi `verifySession()`; `proxy.ts` chặn sớm `/admin/*` khi chưa có cookie. `m11/authflow.ts` gửi request thô như curl, rồi đăng nhập bằng Chromium.

`m11/app/lib/dal.ts`

```tsx
// Data Access Layer: chốt chặn THẬT. Page, Server Action, Route Handler cần quyền đều gọi qua đây
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSession, type Session } from "./session";

// cache(): nhiều component gọi trong cùng 1 request → verify JWT đúng 1 lần (≈ scoped service)
export const verifySession = cache(async (): Promise<Session> => {
  const session = await readSession((await cookies()).get("session")?.value);
  if (!session) redirect("/login");
  return session;
});
```

```console
❯ npx tsx m11/authflow.ts
GET /admin, không cookie           → 307 /login?next=/admin
GET /admin, cookie giả session=abc → 307 /login
Chromium mở /admin                 → đang ở /login?next=/admin
Đăng nhập an@cafe.vn / sai         → /login · "Sai email hoặc mật khẩu"
Đăng nhập an@cafe.vn / an123       → /admin · "Xin chào an@cafe.vn (staff)"
Cookie session: httpOnly=true secure=true sameSite=Lax · eyJhbGciOiJIUzI1NiJ9…
document.cookie trong trang        → ""
```

Không cookie: **proxy** trả 307 về `/login?next=/admin` trước khi trang render. Cookie rác `session=abc`: proxy cho qua (nó chỉ thấy "có cookie"), nhưng `verifySession()` verify chữ ký thất bại → 307 `/login`. Đăng nhập đúng: cookie `httpOnly` (JavaScript không đọc được — `document.cookie` rỗng, XSS không lấy được), `secure`, `SameSite=Lax`. `cache()` của React: 10 component cùng gọi `verifySession()` trong 1 request thì chỉ verify 1 lần.

### 5 · Thử thật / bẫy
**Bẫy 1.** **Ghép input vào SQL bằng `sql.raw`** — AI hay dùng khi query "khó viết bằng builder".

`m11/db/injection.ts`

```tsx
// ❌ Ghép input vào SQL bằng sql.raw — "chỉ là tìm user theo email thôi mà"
import { eq, sql } from "drizzle-orm";
import { openDb } from "./client";
import { users } from "./schema";

const { db } = await openDb();
const input = "x' OR '1'='1"; // kẻ tấn công gõ vào ô email

const bad = await db.execute(sql.raw(`select email, role from users where email = '${input}'`));
console.log("sql.raw(`…'${input}'`)  →", JSON.stringify(bad.rows));

const good = await db.execute(sql`select email, role from users where email = ${input}`); // → $1
console.log("sql`… ${input}`        →", JSON.stringify(good.rows));

const typed = await db.select({ email: users.email }).from(users).where(eq(users.email, input));
console.log("eq(users.email, input) →", JSON.stringify(typed));
```

```console
❯ npx tsx m11/db/injection.ts
sql.raw(`…'${input}'`)  → [{"email":"admin@cafe.vn","role":"admin"},{"email":"an@cafe.vn","role":"staff"}]
sql`… ${input}`        → []
eq(users.email, input) → []
```

`sql.raw` chèn nguyên chuỗi: `' OR '1'='1` biến điều kiện thành luôn đúng → lộ mọi user (nếu đây là hàm đăng nhập thì vào được không cần mật khẩu). Tagged template `sql` và mọi hàm builder (`eq`, `like`…) đều bind thành `$1`. `sql.raw` chỉ dành cho chuỗi do **chính bạn** viết cứng (tên cột cố định), không bao giờ cho input.

**Bẫy 2.** **"Đọc" JWT thay vì "kiểm" JWT.** `decodeJwt` ngắn, không cần secret — AI hay dùng trong proxy hoặc DAL.

`m11/traps/jwt.ts`

```tsx
// ❌ "Đọc" JWT thay vì "kiểm" JWT — decodeJwt ngắn gọn, không cần secret… và không kiểm gì cả
import { decodeJwt, jwtVerify, SignJWT, UnsecuredJWT } from "jose";

const key = new TextEncoder().encode("dev-only-secret-change-me-32-bytes!!");
const readBad = async (t: string) => decodeJwt(t);                                 // chỉ base64-decode
const readGood = async (t: string) => (await jwtVerify(t, key, { algorithms: ["HS256"] })).payload;

// Kẻ tấn công tự tạo token — không biết secret của bạn
const unsigned = new UnsecuredJWT({ email: "hacker@x.com", role: "admin" }).encode();
const otherKey = await new SignJWT({ email: "hacker@x.com", role: "admin" })
  .setProtectedHeader({ alg: "HS256" }).sign(new TextEncoder().encode("khoa-cua-ke-tan-cong-32-bytes!!!!"));

for (const [name, token] of [["token không ký (alg: none)", unsigned], ["token ký bằng khoá khác ", otherKey]]) {
  console.log(`${name}: ${token.slice(0, 36)}…`);
  console.log(`  decodeJwt → ${JSON.stringify(await readBad(token))}`);
  await readGood(token).then(
    (p) => console.log(`  jwtVerify → ${JSON.stringify(p)}`),
    (e: Error) => console.log(`  jwtVerify → ${e.name}: ${e.message}`),
  );
}
```

```console
❯ npx tsx m11/traps/jwt.ts
token không ký (alg: none): eyJhbGciOiJub25lIn0.eyJlbWFpbCI6Imhh…
  decodeJwt → {"email":"hacker@x.com","role":"admin"}
  jwtVerify → JOSEAlgNotAllowed: "alg" (Algorithm) Header Parameter value not allowed
token ký bằng khoá khác : eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6Imh…
  decodeJwt → {"email":"hacker@x.com","role":"admin"}
  jwtVerify → JWSSignatureVerificationFailed: signature verification failed
```

JWT chỉ là base64 + chữ ký. `decodeJwt` đọc phần giữa, **không** kiểm chữ ký: ai cũng tự tạo được token `role: admin`. `jwtVerify` từ chối cả `alg: none` (nhờ `algorithms: ["HS256"]`) lẫn chữ ký bằng khoá khác.

**Bẫy 3.** **Chỉ bảo vệ bằng `proxy.ts`**: action trong `/admin` không gọi `verifySession()` — "đã chặn ở cửa rồi".

`m11/traps/proxy-only/app/admin/actions.ts`

```tsx
"use server";

import { listOrders, removeOrder } from "../../../../app/lib/orders";

// ❌ Không gọi verifySession(): tin rằng proxy đã chặn người lạ ở /admin
export async function wipeOrders() {
  for (const o of [...listOrders()]) removeOrder(o.id);
  console.log(`[server] wipeOrders() đã chạy — còn ${listOrders().length} đơn`);
}
```

```console
❯ npx next build m11/traps/proxy-only > /dev/null && npx tsx m11/bypass.ts
GET  /admin (không cookie)                   → 307 /login
GET  /admin (cookie rác session=x)           → 200 <!DOCTYPE html><html lang="vi"><head><me
Action id đọc từ chunk JS công khai          → 002f14e621cc51a7…
POST /admin + Next-Action + cookie rác       → 200 0:{"a":"$@1","q":"","i":false,"b":"AjJQB
Log server: [server] wipeOrders() đã chạy — còn 0 đơn
```

Proxy chỉ kiểm tra lạc quan: thấy **có** cookie là cho qua. Cookie rác `session=x` đủ mở trang; id của action nằm trong chunk JS ở `/_next/static` — công khai. Kết quả: người lạ xoá sạch đơn. Quy tắc trong tài liệu Next: proxy để chuyển hướng sớm, **kiểm quyền thật ở DAL**, gần dữ liệu — ở mọi page, action, route handler.

### 6 · Tóm tắt bằng hình
**(a) Cây thư mục sau bài này**

```text
m11/
├─ db/schema.ts · relations.ts  [MỚI]  ← bảng + quan hệ (code-first)
├─ db/drizzle.config.ts · client.ts  [MỚI]  ← drizzle-kit · mở PGlite + migrate + seed
├─ db/migrations/0000_init.sql  [MỚI]  ← SINH RA bởi drizzle-kit — commit cùng code
├─ db/queries.ts · injection.ts  [MỚI]  ← ví dụ 2 · bẫy 1
├─ app/proxy.ts  [MỚI]  ← chặn sớm /admin/* khi chưa có cookie
├─ app/lib/session.ts · dal.ts · users.ts  [MỚI]  ← JWT cookie · verifySession() · tài khoản
├─ app/app/login/page.tsx · actions.ts  [MỚI]  ← đăng nhập / đăng xuất
├─ app/app/admin/page.tsx  [MỚI]  ← trang được bảo vệ
├─ authflow.ts · bypass.ts · traps/jwt.ts · traps/proxy-only/  [MỚI]  ← ví dụ 3 · bẫy 2, 3
└─ ex3/start · ex3/solution · ex3/check.ts  [MỚI]  ← bài Làm ngay
```

**(b) Đọc trong 10 giây**

**Mỗi hàm ghi dữ liệu cần quyền phải qua đâu?**

```mermaid
flowchart LR
  N0["Action / route<br/><small>vừa được gọi</small>"]
  N1["verifySession()<br/><small>JWT hợp lệ?</small>"]
  N2["Kiểm vai trò<br/><small>role đủ quyền?</small>"]
  N3["Drizzle<br/><small>query có tham số</small>"]
  N0 --> N1
  N1 --> N2
  N2 --> N3
```

Đọc sơ đồ: Action hay route handler nào cũng tự hỏi 2 câu trước khi chạm DB: JWT có hợp lệ không, vai trò có đủ không. Truy vấn luôn dùng tham số.

### 7 · Làm ngay (≤ 10 phút)
**Mục tiêu:** `m11/ex3/start`: trang quản lý đơn — nhân viên nào đăng nhập cũng xem được (đúng yêu cầu); nút "Xoá #id" gọi `deleteOrder`. AI đã gọi `verifySession()` nhưng quên vai trò → nhân viên thường xoá được đơn. Chỉ sửa `app/actions.ts`.

File khởi đầu:

`m11/ex3/start/app/actions.ts`

```tsx
"use server"; // ← CHỈ sửa file này

import { revalidatePath } from "next/cache";
import { verifySession } from "../../../app/lib/dal";
import { removeOrder } from "../../../app/lib/orders";

export async function deleteOrder(_prev: string, formData: FormData): Promise<string> {
  await verifySession();
  removeOrder(Number(formData.get("id")));
  revalidatePath("/");
  return "Đã xoá";
}
```

Chạy file khởi đầu (đang đỏ):

```console
❯ npx next build m11/ex3/start > /dev/null && npx tsx m11/ex3/check.ts m11/ex3/start
✗ staff bấm Xoá #2 → "Chỉ admin được xoá đơn", #2 vẫn còn  → "(không có thông báo)", sau F5 còn 0 dòng #2
✗ admin bấm Xoá #2 → #2 biến mất  → locator.click: Timeout 3000ms exceeded.
✓ Không cookie → bị đưa về /login
1/3 đạt
```

Tiêu chí nghiệm thu:

- [ ] staff bấm Xoá #2 → "Chỉ admin được xoá đơn", F5 vẫn còn #2
- [ ] admin bấm Xoá #2 → #2 biến mất
- [ ] Không cookie → về `/login`
- [ ] `npx tsc -p .` không lỗi

Lệnh nghiệm thu:

```bash
npx next build m11/ex3/start > /dev/null && npx tsx m11/ex3/check.ts m11/ex3/start && npx tsc -p .
```

Lời giải tham chiếu chạy ra (output cần đạt):

```console
❯ npx next build m11/ex3/solution > /dev/null && npx tsx m11/ex3/check.ts m11/ex3/solution
✓ staff bấm Xoá #2 → "Chỉ admin được xoá đơn", #2 vẫn còn
✓ admin bấm Xoá #2 → #2 biến mất
✓ Không cookie → bị đưa về /login
3/3 đạt
```

<details><summary>Gợi ý nếu bị đỏ</summary>

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| "(không có thông báo)", #2 mất | Không đọc vai trò | `const session = await verifySession()` rồi `if (session.role !== "admin") return "…"` |
| Thêm kiểm vai trò ở `page.tsx` "cho chắc" | Trang phải hiện cho staff (yêu cầu); kiểm ở page cũng không chặn được action | Kiểm ngay trong action |
| Lỗi kiểu khi so `role` | So với chuỗi gõ sai | `Session["role"]` chỉ có `"staff" | "admin"` |

`m11/ex3/start/app/actions.ts` (diff)

```diff
 
 export async function deleteOrder(_prev: string, formData: FormData): Promise<string> {
-  await verifySession();
+  const session = await verifySession();          // ai đang gọi? (verify chữ ký, không chỉ "có cookie")
+  if (session.role !== "admin") return "Chỉ admin được xoá đơn";
   removeOrder(Number(formData.get("id")));
   revalidatePath("/");
```

</details>

### 8 · 3 câu hỏi nhanh
1. "Kiểm quyền 1 lần trong `app/admin/layout.tsx` cho gọn được không?"

   <details><summary>Đáp án</summary>

   Không đủ. Layout không render lại khi điều hướng phía client giữa các trang con (Next giữ layout), nên chỉ kiểm lúc vào; Server Action và Route Handler không đi qua layout; trang con vẫn được gọi riêng qua RSC request. Đặt kiểm tra trong DAL, gọi ở từng page/action/route — `cache()` lo việc không verify lặp trong cùng 1 request.

   </details>

2. Phỏng vấn: "Prisma hay Drizzle?"

   <details><summary>Đáp án</summary>

   Cả hai: schema-as-code, migration, kiểu đầy đủ. Prisma: file `schema.prisma` riêng, client sinh code, API lồng include/select tiện, nặng hơn. Drizzle: thuần TS, gần SQL, nhẹ (hợp serverless/edge), đọc SQL là hiểu. Với dev C#: Prisma ≈ EF Core, Drizzle ≈ Dapper có kiểu + migration. Điều quan trọng hơn chọn ORM: chỉ gọi trong code server (`server-only`), dùng connection pooling khi deploy serverless, migration chạy trong CI.

   </details>

3. Review code AI: `proxy.ts` dùng `decodeJwt` để kiểm `role === "admin"` cho `/admin`; trang và action trong `/admin` không kiểm gì; project đã cài Better Auth. Góp ý?

   <details><summary>Đáp án</summary>

   `decodeJwt` không verify chữ ký → ai cũng giả được token admin (bẫy 2). Chỉ kiểm ở proxy → action vẫn gọi được (bẫy 3). Dùng hàm lấy session phía server của thư viện (Better Auth: `auth.api.getSession`, Clerk: `auth()`) **bên trong DAL**, gọi ở mọi page/action/route cần quyền; proxy chỉ redirect lạc quan khi chưa có cookie.

   </details>


---

## Bài 11.4 · Caching & Metadata: "use cache", cacheTag/updateTag, Partial Prerendering, SEO

_Nguồn roadmap: [NextAI] Caching and Revalidating → Caching with Cache Components (Next.js 16) → Static vs Dynamic Metadata → Title Metadata Deep Dive → Favicons → Static/Dynamic Open Graph Images_

### 1 · Một câu & nằm ở đâu
Bật `cacheComponents` (Next 16): mặc định **không cache gì**; muốn cache thì nói rõ bằng `"use cache"` trong hàm/component, kèm `cacheLife` (sống bao lâu) và `cacheTag` (nhãn để huỷ). Trang thành **vỏ tĩnh** (prerender lúc build, gồm phần có cache) + **lỗ động** trong `<Suspense>` (cookie, header) — Partial Prerendering ◐. Ghi dữ liệu xong: `updateTag` (huỷ ngay, người vừa sửa thấy liền) hoặc `revalidateTag(tag, "max")` (trả bản cũ trước, làm mới nền). Metadata: export `metadata` / `generateMetadata` ở Server Component; `opengraph-image.tsx` sinh ảnh chia sẻ.

Trình duyệt → proxy.ts → Route: page / route.ts → **[Server Component · Action]** → DAL · DB → **[Cache · HTML/RSC]**

<details><summary>m11/cache/next.config.ts — bật cacheComponents (app riêng cho bài này)</summary>

`m11/cache/next.config.ts`

```tsx
import type { NextConfig } from "next";

const config: NextConfig = {
  cacheComponents: true,   // Next 16: mặc định MỌI THỨ là động; muốn cache thì nói rõ bằng "use cache"
  partialPrefetching: true, // đi kèm cacheComponents (Next khuyên bật; bản lớn tới sẽ là mặc định)
};
export default config;
```

</details>

<details><summary>m11/cache/lib/db.ts — "DB" giá món, đếm số lần bị truy vấn</summary>

`m11/cache/lib/db.ts`

```tsx
// "DB" giá món trong bộ nhớ (thay DB thật), đếm số lần bị truy vấn để thấy cache có tác dụng
import "server-only";

export type Drink = { id: string; name: string; price: number };
const g = globalThis as unknown as { drinks?: Drink[]; hits?: number };
g.drinks ??= [
  { id: "latte", name: "Latte", price: 45000 },
  { id: "mocha", name: "Mocha", price: 50000 },
];
g.hits ??= 0;

export async function queryDrinks(): Promise<Drink[]> {
  g.hits!++;
  console.log(`[server] DB query #${g.hits}`);
  await new Promise((r) => setTimeout(r, 300)); // truy vấn chậm
  return structuredClone(g.drinks!);
}
export function savePrice(id: string, price: number) {
  const d = g.drinks!.find((x) => x.id === id);
  if (d) d.price = price;
}
```

</details>

<details><summary>m11/cache/app/page.tsx — "/" = MenuList (có cache) + Greeting (đọc cookie, trong Suspense)</summary>

`m11/cache/app/page.tsx`

```tsx
// "/" = vỏ tĩnh (prerender lúc build) + lỗ động (Suspense) — Partial Prerendering
import { Suspense } from "react";
import { cookies } from "next/headers";
import { getMenu } from "../lib/menu";

export default function Home() {
  return (
    <>
      <MenuList />
      <Suspense fallback={<p>Đang chào…</p>}>
        <Greeting />
      </Suspense>
    </>
  );
}

async function MenuList() {
  const { drinks, at } = await getMenu();                 // có cache → nằm được trong vỏ tĩnh
  return (
    <section>
      <ul>{drinks.map((d) => <li key={d.id}>{`${d.name}: ${d.price}đ`}</li>)}</ul>
      <small>{`dữ liệu lúc ${at}`}</small>
    </section>
  );
}

async function Greeting() {
  const name = (await cookies()).get("name")?.value;       // đọc request → phải động
  return <p>{`Chào ${name ?? "khách"} · ${new Date().toISOString().slice(11, 23)}`}</p>;
}
```

</details>

<details><summary>m11/cache/app/layout.tsx — metadata gốc: title.template, metadataBase</summary>

`m11/cache/app/layout.tsx`

```tsx
// Metadata mặc định cho cả app: trang con chỉ cần đặt title, template tự ghép đuôi
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://coffee.example"),     // gốc để biến URL ảnh OG thành tuyệt đối
  title: { template: "%s · Coffee Shop", default: "Coffee Shop" },
  description: "Cà phê rang mỗi sáng",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><body>{children}</body></html>;
}
```

</details>

<details><summary>m11/cache/app/admin/page.tsx — form sửa giá, 2 nút gọi 2 action</summary>

`m11/cache/app/admin/page.tsx`

```tsx
import { savePriceLater, savePriceNow } from "./actions";

export default function AdminPage() {
  return (
    <form>
      <input name="id" defaultValue="latte" aria-label="Món" />
      <input name="price" type="number" aria-label="Giá" />
      <button formAction={savePriceNow}>Lưu (updateTag)</button>
      <button formAction={savePriceLater}>Lưu (revalidateTag)</button>
    </form>
  );
}
```

</details>

<details><summary>m11/cache/app/drinks/[id]/opengraph-image.tsx — ảnh Open Graph vẽ bằng JSX</summary>

`m11/cache/app/drinks/[id]/opengraph-image.tsx`

```tsx
// Ảnh chia sẻ (Facebook/Zalo/Slack) sinh bằng JSX → PNG lúc build; Next tự gắn <meta property="og:image">
import { ImageResponse } from "next/og";
import { getMenu } from "../../../lib/menu";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const drink = (await getMenu()).drinks.find((d) => d.id === id);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center",
        alignItems: "center", background: "#f2e2c6", color: "#7a3b1e", fontSize: 96 }}>
        <div>{drink?.name ?? id}</div>
        <div style={{ fontSize: 48 }}>{`${drink?.price ?? 0} VND`}</div>
      </div>
    ),
    size,
  );
}
```

</details>

<details><summary>m11/cachedemo.ts — script ví dụ 1</summary>

`m11/cachedemo.ts`

```tsx
// 3 request tới "/" của 2 người khác nhau: phần nào giống hệt nhau, phần nào riêng từng request?
import { serve } from "./serve";
import { pick } from "./cachedemo-pick";

const srv = await serve("m11/cache", 3116);
for (const name of ["An", "Bình", "An"]) {
  const t0 = Date.now();
  const html = await (await fetch(srv.origin + "/", { headers: { cookie: `name=${name}` } })).text();
  const r = pick(html);
  console.log(`cookie name=${name.padEnd(4)} ${String(Date.now() - t0).padStart(3)}ms · ${r.menu} · dữ liệu lúc ${r.at} · "${r.hello}"`);
}
console.log("Log server khi chạy:", srv.serverLines().join(" / ") || "(không truy vấn DB lần nào)");
await srv.close();
```

</details>

<details><summary>m11/tagdemo.ts — script ví dụ 2</summary>

`m11/tagdemo.ts`

```tsx
// Đổi giá rồi đọc lại "/": updateTag (xoá ngay) vs revalidateTag(…, "max") (cũ trước, mới sau)
import { serve } from "./serve";
import { launch } from "./browser";
import { pick } from "./cachedemo-pick";

const srv = await serve("m11/cache", 3117);
const admin = await (await launch()).newPage();
await admin.goto(srv.origin + "/admin");
const home = async (label: string) => {
  const r = pick(await (await fetch(srv.origin + "/")).text());
  console.log(`  ${label.padEnd(23)} → ${r.menu} · dữ liệu lúc ${r.at}`);
};

for (const [price, button] of [["49000", "Lưu (updateTag)"], ["52000", "Lưu (revalidateTag)"]]) {
  srv.logs.length = 0;
  await admin.getByLabel("Giá").fill(price);
  await admin.getByRole("button", { name: button }).click();
  await admin.waitForLoadState("networkidle");
  console.log(`Latte = ${price}, bấm "${button}"`);
  await home("GET / lần 1");
  await admin.waitForTimeout(600);                       // chờ làm mới nền (nếu có)
  await home("GET / lần 2 (sau 600ms)");
  console.log(`  log server: ${srv.serverLines().join(" / ")}`);
}
await admin.context().browser()?.close();
await srv.close();
```

</details>

<details><summary>m11/meta.ts — script ví dụ 3</summary>

`m11/meta.ts`

```tsx
// Bot mạng xã hội / Google đọc gì từ /drinks/latte? (chúng KHÔNG chạy JavaScript)
import { serve } from "./serve";

const srv = await serve("m11/cache", 3118);
const html = await (await fetch(srv.origin + "/drinks/latte")).text();
const tag = (re: RegExp) => html.match(re)?.[1] ?? "(không có)";
console.log("<title>              ", tag(/<title>(.*?)<\/title>/));
console.log("description          ", tag(/<meta name="description" content="(.*?)"/));
console.log("og:title             ", tag(/<meta property="og:title" content="(.*?)"/));
const og = tag(/<meta property="og:image" content="(.*?)"/);
console.log("og:image             ", og);
const img = await fetch(srv.origin + new URL(og).pathname);
const buf = Buffer.from(await img.arrayBuffer());
console.log(`GET ${new URL(og).pathname.slice(0, 40)}… → ${img.status} ${img.headers.get("content-type")} ${buf.length} byte, ${buf.readUInt32BE(16)}×${buf.readUInt32BE(20)}`);
await srv.close();
```

</details>

### 2 · Concept
| Khái niệm | Trong Next 16 | Ghi chú | Bên C# |
|---|---|---|---|
| `cacheComponents: true` | Mặc định động; cache phải opt-in | Next 14–15: `fetch` tự cache ngầm, khó đoán | — |
| `"use cache"` | Dòng đầu hàm/component: lưu kết quả theo **tham số** (key tự sinh) | Không đọc `cookies()`/`headers()` bên trong — truyền vào làm tham số | `IMemoryCache.GetOrCreateAsync`, `[OutputCache]` |
| `cacheLife("hours")` | stale (client dùng tạm) · revalidate (làm mới nền) · expire (bỏ hẳn) | Profile có sẵn: seconds, minutes, hours, days, weeks, max | `SlidingExpiration` / `AbsoluteExpiration` |
| `cacheTag` · `updateTag` · `revalidateTag` | Gắn nhãn; `updateTag`: huỷ ngay (chỉ trong Server Action); `revalidateTag(tag, "max")`: stale-while-revalidate | Huỷ đúng nhóm, không xoá cả cache | `EvictByTagAsync` của OutputCache |
| PPR ◐ | Vỏ HTML tĩnh gửi ngay từ cache, lỗ `<Suspense>` stream theo request | Thứ động nằm ngoài Suspense → build lỗi (bẫy 1) | — |
| Metadata | `export const metadata` · `generateMetadata()` · `title.template` · file `opengraph-image.tsx`, `icon.png` | Chỉ ở Server Component; bot không chạy JS vẫn đọc được | `ViewData["Title"]` + `<meta>` trong `_Layout` |

### 3 · Flow / lifecycle
**Request "/" với Partial Prerendering: phần nào lấy từ cache, phần nào render mới?**

```mermaid
flowchart LR
  N0["Build<br/><small>getMenu() → vỏ tĩnh</small>"]
  N1["GET /<br/><small>cookie name=An</small>"]
  N2["Gửi vỏ ngay<br/><small>thực đơn từ cache</small>"]
  N3["Lỗ Suspense<br/><small>Greeting đọc cookie</small>"]
  N4["Stream vào<br/><small>cùng 1 response</small>"]
  N5["updateTag<br/><small>giá đổi → dựng lại</small>"]
  N0 --> N1
  N1 --> N2
  N2 --> N3
  N3 --> N4
  N4 --> N5
```

Đọc sơ đồ: Trái → phải: lúc build, Next chạy `getMenu()` (có `"use cache"`) và lưu vỏ HTML có sẵn thực đơn. Mỗi request: vỏ được gửi ngay, còn `Greeting` (đọc cookie) render riêng và stream vào chỗ fallback trong cùng response. Khi giá đổi, `updateTag("menu")` làm vỏ và cache dựng lại ở request kế tiếp.

### 4 · Ví dụ thực tế
**Ví dụ 1.** `getMenu()` đánh dấu `"use cache"`, sống theo profile `hours`, gắn nhãn `menu`. Trang `/` (mục 1) đặt `MenuList` ngoài Suspense, `Greeting` (đọc cookie) trong Suspense. Build, rồi gửi 3 request với 2 cookie khác nhau.

`m11/cache/lib/menu.ts`

```tsx
// Hàm đọc dữ liệu có cache: kết quả lưu lại theo tham số, dùng chung cho mọi request/user
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { queryDrinks } from "./db";

export async function getMenu() {
  "use cache";              // ≈ [OutputCache] / IMemoryCache.GetOrCreate, key = tên hàm + tham số
  cacheLife("hours");       // stale 5 phút · revalidate 1 giờ · expire 1 ngày
  cacheTag("menu");         // nhãn để huỷ đúng nhóm cache khi dữ liệu đổi
  const drinks = await queryDrinks();
  return { drinks, at: new Date().toISOString().slice(11, 23) };
}
```

```console
❯ npx next build m11/cache 2>&1 | grep -E "Cache Components|Partial Prefetching|DB query|Route|◐|/admin"
- Cache Components enabled
- Partial Prefetching enabled
[server] DB query #1
Route (app)                       Revalidate  Expire
┌ ◐ /                                     1h      1d
├ ○ /admin
│ ├ ◐ /drinks/[id]
◐  (Partial Prerender)  prerendered as static HTML with dynamic server-streamed content

❯ npx tsx m11/cachedemo.ts
cookie name=An   185ms · Latte: 45000đ, Mocha: 50000đ · dữ liệu lúc 11:39:35.885 · "Chào An · 11:39:38.170"
cookie name=Bình  45ms · Latte: 45000đ, Mocha: 50000đ · dữ liệu lúc 11:39:35.885 · "Chào Bình · 11:39:38.267"
cookie name=An    40ms · Latte: 45000đ, Mocha: 50000đ · dữ liệu lúc 11:39:35.885 · "Chào An · 11:39:38.315"
Log server khi chạy: (không truy vấn DB lần nào)
```

`DB query #1` chạy **lúc build** để dựng vỏ; bảng route ghi `◐ /  1h  1d` — revalidate 1 giờ, expire 1 ngày, lấy từ `cacheLife("hours")`. 3 request: thực đơn và "dữ liệu lúc …" giống hệt nhau (lấy từ vỏ), lời chào khác theo cookie và giờ mới; server **không** truy vấn DB lần nào. Request đầu chậm hơn vì process vừa khởi động.

**Ví dụ 2.** Trang `/admin` (mục 1) có 2 nút lưu giá: 1 gọi `updateTag`, 1 gọi `revalidateTag(…, "max")`. `m11/tagdemo.ts`: Chromium bấm từng nút, rồi đọc `/` 2 lần.

`m11/cache/app/admin/actions.ts`

```tsx
"use server";

import { revalidateTag, updateTag } from "next/cache";
import { savePrice } from "../../lib/db";

const read = (f: FormData) => [String(f.get("id")), Number(f.get("price"))] as const;

export async function savePriceNow(formData: FormData) {
  savePrice(...read(formData));
  updateTag("menu");                 // xoá cache ngay: request kế tiếp đọc DB mới (read-your-own-writes)
}

export async function savePriceLater(formData: FormData) {
  savePrice(...read(formData));
  revalidateTag("menu", "max");      // đánh dấu cũ: request kế tiếp vẫn nhận bản cũ, nền làm mới
}
```

```console
❯ npx tsx m11/tagdemo.ts
Latte = 49000, bấm "Lưu (updateTag)"
  GET / lần 1             → Latte: 49000đ, Mocha: 50000đ · dữ liệu lúc 11:39:42.765
  GET / lần 2 (sau 600ms) → Latte: 49000đ, Mocha: 50000đ · dữ liệu lúc 11:39:42.765
  log server: [server] DB query #1
Latte = 52000, bấm "Lưu (revalidateTag)"
  GET / lần 1             → Latte: 49000đ, Mocha: 50000đ · dữ liệu lúc 11:39:42.765
  GET / lần 2 (sau 600ms) → Latte: 52000đ, Mocha: 50000đ · dữ liệu lúc 11:39:44.048
  log server: [server] DB query #2
```

`updateTag`: lần đọc ngay sau đã thấy 49000 — cache bị huỷ, request kế tiếp chạy lại `getMenu()` (log `DB query`). `revalidateTag(…, "max")`: lần 1 vẫn 49000 (bản cũ, phục vụ tức thì) đồng thời Next làm mới ở nền; lần 2 thấy 52000. Chọn: người vừa sửa cần thấy ngay (form admin, giỏ hàng) → `updateTag`; dữ liệu đổi từ hệ thống khác, trễ 1 nhịp chấp nhận được (webhook CMS, cron) → `revalidateTag`. `updateTag` chỉ gọi được trong Server Action; route handler (webhook) dùng `revalidateTag`.

**Ví dụ 3.** Trang chi tiết món: `generateMetadata` sinh title/description theo dữ liệu; `opengraph-image.tsx` (mục 1) vẽ ảnh chia sẻ bằng JSX. `m11/meta.ts` đọc HTML như bot Facebook/Google (không chạy JS).

`m11/cache/app/drinks/[id]/page.tsx`

```tsx
// /drinks/latte — title, description, Open Graph sinh theo dữ liệu (≈ ViewData["Title"] nhưng có kiểu)
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMenu } from "../../../lib/menu";

type Props = { params: Promise<{ id: string }> };
const find = async (id: string) => (await getMenu()).drinks.find((d) => d.id === id);

export async function generateStaticParams() {
  return (await getMenu()).drinks.map((d) => ({ id: d.id }));     // prerender sẵn từng món
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const drink = await find((await params).id);
  if (!drink) return { title: "Không có món" };
  return {
    title: drink.name,                                             // → "Latte · Coffee Shop" nhờ template
    description: `${drink.name} giá ${drink.price}đ, pha khi bạn gọi`,
    openGraph: { title: `${drink.name} — ${drink.price}đ`, type: "website" },
  };
}

export default async function DrinkPage({ params }: Props) {
  const drink = await find((await params).id);
  if (!drink) notFound();
  return <h1>{drink.name}</h1>;
}
```

```console
❯ npx tsx m11/meta.ts
<title>               Latte · Coffee Shop
description           Latte giá 45000đ, pha khi bạn gọi
og:title              Latte — 45000đ
og:image              https://coffee.example/drinks/latte/opengraph-image?d7834635123383ba
GET /drinks/latte/opengraph-image… → 200 image/png 26172 byte, 1200×630
```

Title ghép từ `title.template` `"%s · Coffee Shop"` ở layout. Thẻ `og:image` Next tự gắn, URL tuyệt đối nhờ `metadataBase`, kèm hash để mạng xã hội không giữ bản cũ. Ảnh là PNG 1200×630 thật. Tất cả nằm trong HTML từ server — SPA Vite (Module 10) phải có SSR/prerender mới làm được. `generateMetadata` và page cùng gọi `getMenu()` → dùng chung cache, không truy vấn 2 lần.

### 5 · Thử thật / bẫy
**Bẫy 1.** **Đọc `cookies()` ở thân trang, không bọc `<Suspense>`**, khi đã bật `cacheComponents`.

`m11/traps/no-suspense/app/page.tsx`

```tsx
// ❌ Bật cacheComponents, đọc cookie ở thân trang, không bọc Suspense
import { cookies } from "next/headers";

export default async function Home() {
  const name = (await cookies()).get("name")?.value ?? "khách";
  return <h1>{`Chào ${name}`}</h1>;
}
```

```console
❯ npx next build m11/traps/no-suspense
- Cache Components enabled
- Partial Prefetching enabled
  Generating static pages using 1 worker (0/3) ...
Error: Route "/": Next.js encountered uncached or runtime data during prerendering.

`fetch(...)`, `cookies()`, `headers()`, `params`, `searchParams`, or `connection()` accessed outside of `<Suspense>` prevents the route from being prerendered, blocking the page load and leading to a slower user experience.

Ways to fix this:
  - [stream] Provide a placeholder with `<Suspense fallback={...}>` around the data access
  - [cache] For uncached data (`fetch`, database calls): cache the access with `"use cache"` (does not apply to `connection()`)
  - [block] Set `export const instant = false` to allow a blocking route
```

(… còn 18 dòng — đã trích dòng 3–4, 11–19 / 29 của `npx next build m11/traps/no-suspense`)

Next từ chối build: dữ liệu theo request nằm ngoài Suspense khiến cả trang không prerender được, user phải chờ trắng. Thông báo liệt kê đúng 3 cách: bọc Suspense (stream — như `Greeting`), cache bằng `"use cache"`, hoặc chấp nhận chặn (`export const instant = false`, hiếm khi đúng). Lỗi ở build tốt hơn phát hiện chậm ở prod.

**Bẫy 2.** **Đọc `cookies()` bên trong hàm `"use cache"`** — "cache gợi ý riêng từng người".

`m11/traps/cache-cookies/app/page.tsx`

```tsx
// ❌ Muốn cache "thực đơn gợi ý theo người dùng" → đọc cookie BÊN TRONG hàm "use cache"
import { cookies } from "next/headers";

async function getSuggestions() {
  "use cache";
  const name = (await cookies()).get("name")?.value ?? "khách";
  return [`Latte cho ${name}`, "Mocha"];
}

export default async function Home() {
  const list = await getSuggestions();
  return <ul>{list.map((s) => <li key={s}>{s}</li>)}</ul>;
}
```

```console
❯ npx next build m11/traps/cache-cookies
  Generating static pages using 1 worker (0/3) ...
⨯ Error: Route "/": `cookies()` can't be read inside `"use cache"`. Read it outside the cached function and pass what you need as an argument.
Learn more: https://nextjs.org/docs/messages/next-request-in-use-cache
    at g (m11/traps/cache-cookies/app/page.tsx:6:23)
  4 | async function getSuggestions() {
  5 |   "use cache";
> 6 |   const name = (await cookies()).get("name")?.value ?? "khách";
    |                       ^
  7 |   return [`Latte cho ${name}`, "Mocha"];
  8 | }
```

(… còn 31 dòng — đã trích dòng 11–20 / 41 của `npx next build m11/traps/cache-cookies`)

Kết quả `"use cache"` dùng chung cho mọi request; nếu đọc cookie bên trong, user B có thể nhận gợi ý của user A — lộ dữ liệu cá nhân. Next chặn ngay. Sửa: đọc cookie **bên ngoài**, truyền giá trị cần (tên, id) làm tham số — tham số nằm trong key cache nên mỗi giá trị có 1 bản riêng.

**Bẫy 3.** **Export `metadata` trong file `"use client"`.**

`m11/traps/client-metadata/app/page.tsx`

```tsx
"use client"; // trang có nút bấm…

import { useState } from "react";

// ❌ …và vẫn export metadata ngay trong file đó
export const metadata = { title: "Thực đơn · Coffee Shop" };

export default function MenuPage() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>Thích ({n})</button>;
}
```

```console
❯ npx next build m11/traps/client-metadata
> Build error occurred
Error: Turbopack build failed with 1 error:
./m11/traps/client-metadata/app/page.tsx:6:14
Error: You are attempting to export "metadata" from a component marked with "use client", which is disallowed. "metadata" must be resolved on the server before the page component is rendered. Keep your page as a Server Component and move Client Component logic to a separate file. Read more: https://nextjs.org/docs/app/api-reference/functions/generate-metadata#why-generatemetadata-is-server-component-only
  4 |
  5 | // ❌ …và vẫn export metadata ngay trong file đó
> 6 | export const metadata = { title: "Thực đơn · Coffee Shop" };
    |              ^^^^^^^^
  7 |
  8 | export default function MenuPage() {
  9 |   const [n, setN] = useState(0);
```

(… còn 19 dòng — đã trích dòng 6–16 / 30 của `npx next build m11/traps/client-metadata`)

Metadata phải có ở server trước khi render. Trang cần tương tác: giữ page là Server Component (export metadata), tách phần bấm ra component client — đúng bài học 11.1.

### 6 · Tóm tắt bằng hình
**(a) Cây thư mục sau bài này**

```text
m11/cache/  [MỚI]  ← app riêng có cacheComponents
├─ next.config.ts  [MỚI]  ← cacheComponents + partialPrefetching
├─ lib/db.ts · lib/menu.ts  [MỚI]  ← "DB" · getMenu() "use cache" + cacheLife + cacheTag
├─ app/layout.tsx  [MỚI]  ← metadata gốc, title.template, metadataBase
├─ app/page.tsx  [MỚI]  ← ◐ vỏ tĩnh + lỗ Suspense
├─ app/admin/page.tsx · actions.ts  [MỚI]  ← updateTag vs revalidateTag
└─ app/drinks/[id]/page.tsx · opengraph-image.tsx  [MỚI]  ← generateMetadata + ảnh OG
m11/cachedemo.ts · cachedemo-pick.ts · tagdemo.ts · meta.ts  [MỚI]  ← script ví dụ
m11/traps/no-suspense · cache-cookies · client-metadata  [MỚI]  ← 3 bẫy
m11/app/app/icon.svg  [MỚI]  ← favicon theo quy ước file: Next tự gắn <link rel="icon">
m11/ex4/start · ex4/solution · ex4/check.ts  [MỚI]  ← bài Làm ngay
```

**(b) Đọc trong 10 giây**

**Dữ liệu này nên nằm ở đâu trong trang?**

```mermaid
flowchart LR
  N0["Dữ liệu cần render<br/><small>menu, giá, user</small>"]
  N1["Theo request?<br/><small>cookie, header, user</small>"]
  N0 --> N1
  O0["Không<br/><small>'use cache' + cacheTag</small>"]
  N1 --> O0
  O1["Có<br/><small>đặt trong Suspense</small>"]
  N1 --> O1
  O2["Vừa ghi xong<br/><small>updateTag(tag)</small>"]
  N1 --> O2
```

Đọc sơ đồ: Không phụ thuộc request → `"use cache"` + `cacheTag`, vào vỏ tĩnh. Phụ thuộc request → đặt trong `<Suspense>`. Vừa ghi xong → `updateTag(tag)` trong action.

### 7 · Làm ngay (≤ 10 phút)
**Mục tiêu:** `m11/ex4/start`: trang `/` hiện giá từ `getMenu()` (đã có `"use cache"` + `cacheTag("menu")`). Trang `/admin` lưu giá mới qua `savePriceAction` — nhưng `/` vẫn hiện giá cũ. Chỉ sửa `app/admin/actions.ts`, không tắt cache.

File khởi đầu:

`m11/ex4/start/app/admin/actions.ts`

```tsx
"use server"; // ← CHỈ sửa file này

import { revalidatePath } from "next/cache";
import { savePrice } from "../../../../cache/lib/db";

export async function savePriceAction(formData: FormData) {
  savePrice(String(formData.get("id")), Number(formData.get("price")));
  revalidatePath("/admin"); // AI viết: "làm mới trang vừa sửa"
}
```

Chạy file khởi đầu (đang đỏ):

```console
❯ npx next build m11/ex4/start > /dev/null && npx tsx m11/ex4/check.ts m11/ex4/start
✓ Trước khi lưu: Latte 45000
✗ GET / ngay sau khi lưu: Latte 52000 (cả 3 lần)  → thấy 45000, 45000, 45000
✓ 3 lần GET / chỉ truy vấn DB tối đa 1 lần (cache vẫn sống)
2/3 đạt
```

Tiêu chí nghiệm thu:

- [ ] Trước khi lưu: Latte 45000
- [ ] Lưu Latte = 52000 ở `/admin` → mọi lần `GET /` ngay sau đó thấy 52000
- [ ] 3 lần `GET /` liền nhau chỉ truy vấn DB tối đa 1 lần (cache vẫn sống)
- [ ] Bảng route vẫn có `◐ /`

Lệnh nghiệm thu:

```bash
npx next build m11/ex4/start && npx tsx m11/ex4/check.ts m11/ex4/start
```

Lời giải tham chiếu chạy ra (output cần đạt):

```console
❯ npx next build m11/ex4/solution > /dev/null && npx tsx m11/ex4/check.ts m11/ex4/solution
✓ Trước khi lưu: Latte 45000
✓ GET / ngay sau khi lưu: Latte 52000 (cả 3 lần)
✓ 3 lần GET / chỉ truy vấn DB tối đa 1 lần (cache vẫn sống)
3/3 đạt
```

<details><summary>Gợi ý nếu bị đỏ</summary>

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| Latte vẫn 45000 | `revalidatePath("/admin")` làm mới sai trang, không đụng cache `menu` | `updateTag("menu")` |
| Lần 1 vẫn 45000, lần sau mới đúng | Dùng `revalidateTag("menu", "max")` — stale-while-revalidate | Người sửa cần thấy ngay → `updateTag` |
| Build lỗi sau khi xoá "use cache" cho nhanh | `MenuList` đọc dữ liệu không cache ngoài Suspense (bẫy 1) | Giữ cache, chỉ huỷ đúng tag |

`m11/ex4/start/app/admin/actions.ts` (diff)

```diff
 "use server"; // ← CHỈ sửa file này
 
-import { revalidatePath } from "next/cache";
+import { updateTag } from "next/cache";
 import { savePrice } from "../../../../cache/lib/db";
 
 export async function savePriceAction(formData: FormData) {
   savePrice(String(formData.get("id")), Number(formData.get("price")));
-  revalidatePath("/admin"); // AI viết: "làm mới trang vừa sửa"
+  updateTag("menu"); // huỷ đúng cache gắn tag "menu" — mọi trang dùng getMenu() thấy giá mới ngay
 }
```

</details>

### 8 · 3 câu hỏi nhanh
1. Phỏng vấn: "Next 14/15 tự cache `fetch`, Next 16 với `cacheComponents` thì sao? Vì sao đổi?"

   <details><summary>Đáp án</summary>

   Next 16: mặc định mọi thứ động, cache phải opt-in bằng `"use cache"` + `cacheLife` + `cacheTag`. Cache ngầm cũ gây lỗi kinh điển "sao dữ liệu không cập nhật", nhiều tầng cache chồng nhau khó đoán. Giờ cache tường minh như `IMemoryCache`, và build báo lỗi khi dữ liệu động không có Suspense, nên trang vẫn có vỏ tĩnh để gửi ngay.

   </details>

2. "`updateTag`, `revalidateTag`, `revalidatePath` khác nhau thế nào?"

   <details><summary>Đáp án</summary>

   `updateTag(tag)`: huỷ ngay mọi cache gắn tag, request kế tiếp đọc mới — chỉ dùng trong Server Action (người sửa thấy liền). `revalidateTag(tag, "max")`: đánh dấu cũ, request kế tiếp nhận bản cũ và kích hoạt làm mới nền — dùng được ở route handler/webhook. `revalidatePath(path)`: làm mới theo URL, mọi dữ liệu của trang đó; tiện nhưng thô — 1 dữ liệu dùng ở 10 trang thì phải gọi 10 path, còn tag thì 1 lần.

   </details>

3. Review code AI: `generateMetadata` gọi `fetch(API)` lấy món, page gọi `fetch(API)` lần nữa; `layout.tsx` có `"use client"` để bọc ThemeProvider nhưng vẫn export `metadata`; ảnh chia sẻ là 1 file `og.png` 300×300 dùng chung. Góp ý?

   <details><summary>Đáp án</summary>

   Gom truy vấn vào 1 hàm có `"use cache"` (như `getMenu`), cả metadata lẫn page gọi nó → 1 lần truy vấn. Layout client không export metadata được (bẫy 3): tách `Providers.tsx` `"use client"`, layout giữ server. Ảnh OG chuẩn 1200×630; dùng `opengraph-image.tsx` theo từng trang để ảnh có tên/giá món, Next tự gắn thẻ và URL tuyệt đối.

   </details>


---

## Bài 11.5 · Ghép lại: Notes CRUD — Drizzle trong Next, Server Actions, useOptimistic, Zod

_Nguồn roadmap: [NextAI] Notes App (full CRUD + Mongo) → ToDo App (Zustand + TanStack Query) → Contact Form Project_

### 1 · Một câu & nằm ở đâu
Một tính năng CRUD chuẩn trong Next: **Server Component** đọc DB (Drizzle) → truyền dữ liệu cho **Client Component** nhỏ → người dùng thao tác → **Server Action** validate bằng Zod, ghi DB, `revalidatePath` → props mới chảy về. `useOptimistic` cho UI đổi **ngay** trong lúc chờ server và **tự hoàn tác** nếu server từ chối. TanStack Query / Zustand vẫn có chỗ (poll, cuộn vô hạn, state UI phức tạp phía client), nhưng CRUD thông thường không cần nữa.

**[Trình duyệt]** → proxy.ts → Route: page / route.ts → **[Server Component · Action]** → **[DAL · DB]** → Cache · HTML/RSC

<details><summary>m11/app/next.config.ts — serverExternalPackages: để Node nạp PGlite (.wasm) thay vì bundle</summary>

`m11/app/next.config.ts`

```tsx
import type { NextConfig } from "next";

const config: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"], // PGlite tự nạp file .wasm → để Node require, không bundle
};
export default config;
```

</details>

<details><summary>m11/app/app/notes/actions.ts — addNote (Zod safeParse, trả lỗi như dữ liệu) · removeNote · togglePin</summary>

`m11/app/app/notes/actions.ts`

```tsx
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { deleteNoteById, insertNote, setPinned } from "../../lib/notes";

const Title = z.string().trim()
  .min(3, "Tiêu đề ít nhất 3 ký tự").max(60, "Tối đa 60 ký tự")
  .refine((t) => !/spam/i.test(t), "Nội dung bị chặn");          // luật chỉ server biết

export async function addNote(formData: FormData): Promise<{ error?: string }> {
  const parsed = Title.safeParse(formData.get("title"));           // safeParse: lỗi là DỮ LIỆU, không throw
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await insertNote(parsed.data);
  revalidatePath("/notes");
  return {};
}

export async function removeNote(id: number) {
  await deleteNoteById(id);
  revalidatePath("/notes");
}

export async function togglePin(id: number, pinned: boolean) {
  await setPinned(id, pinned);
  revalidatePath("/notes");
}
```

</details>

<details><summary>m11/app/app/notes/page.tsx — /notes — Server Component đọc DB, giao cho NoteBoard</summary>

`m11/app/app/notes/page.tsx`

```tsx
// /notes — đọc DB ở server, giao danh sách cho client component lo phần tương tác
import { listNotes } from "../../lib/notes";
import NoteBoard from "./NoteBoard";

export const dynamic = "force-dynamic"; // dữ liệu đổi liên tục, không prerender lúc build

export default async function NotesPage() {
  return (
    <>
      <h1>Ghi chú quầy</h1>
      <NoteBoard notes={await listNotes()} />
    </>
  );
}
```

</details>

<details><summary>m11/notesread.ts — script ví dụ 1</summary>

`m11/notesread.ts`

```tsx
// Không JavaScript: HTML của /notes đã chứa danh sách đọc từ Postgres (PGlite chạy trong process Next)
import { serve } from "./serve";

const srv = await serve("m11/app", 3123);
for (const i of [1, 2]) {
  const t0 = Date.now();
  const res = await fetch(srv.origin + "/notes");
  const html = await res.text();
  const items = [...html.matchAll(/<li>(.*?)(?:<!-- -->)? <button/g)].map((m) => m[1]);
  console.log(`GET /notes lần ${i} → ${res.status} · ${String(Date.now() - t0).padStart(3)}ms · ${items.join(" | ")}`);
}
await srv.close();
```

</details>

<details><summary>m11/notesdemo.ts — script ví dụ 2: đo thời điểm hiện trên màn hình</summary>

`m11/notesdemo.ts`

```tsx
// Chromium: đo khi nào ghi chú HIỆN trên màn hình so với khi server trả lời (server chậm 600ms)
import type { Page } from "playwright-core";
import { serve } from "./serve";
import { launch } from "./browser";

const srv = await serve("m11/app", 3120);
const p = await (await launch()).newPage();
await p.goto(srv.origin + "/notes");
const items = async (pg: Page) => (await pg.locator("li").allInnerTexts()).map((t) => t.replace(/ Xoá$/, "")).join(" | ");
let t0 = 0;
const at = () => `+${String(Date.now() - t0).padStart(3)}ms`;
p.on("response", (r) => { if (r.request().method() === "POST") console.log(`  ${at()}  server trả lời POST`); });

async function add(title: string) {
  console.log(`Thêm "${title}"`);
  await p.getByLabel("Ghi chú").fill(title);
  t0 = Date.now();
  await p.getByRole("button", { name: "Thêm" }).click();
  await p.getByText(`${title} (đang lưu…)`).waitFor();
  console.log(`  ${at()}  màn hình: ${await items(p)}`);
  await p.getByText("(đang lưu…)").waitFor({ state: "detached" });
  const alert = await p.locator("p[role=alert]").count() ? ` · lỗi: "${await p.locator("p[role=alert]").innerText()}"` : "";
  console.log(`  ${at()}  màn hình: ${await items(p)}${alert}`);
}
await add("Pha cold brew");
await add("spam khuyến mãi");

console.log(`Xoá "Lau máy espresso"`);
t0 = Date.now();
await p.locator("li", { hasText: "Lau máy espresso" }).getByRole("button").click();
await p.getByText("Lau máy espresso").waitFor({ state: "detached" });
console.log(`  ${at()}  màn hình: ${await items(p)}`);
await p.waitForTimeout(900);
await p.reload();
console.log(`F5 (đọc lại từ Postgres): ${await items(p)}`);
await p.context().browser()?.close();
await srv.close();
```

</details>

<details><summary>m11/notetraps.ts — script chạy 3 bẫy</summary>

`m11/notetraps.ts`

```tsx
// Chạy 3 bẫy của bài 11.5 trên Chromium thật: node m11/notetraps.ts ghost|double|throw
import { serve } from "./serve";
import { launch } from "./browser";

const which = process.argv[2] ?? "ghost";
const srv = await serve("m11/traps/notes-traps", 3121);
const p = await (await launch()).newPage();
const items = async () => (await p.locator("li").allInnerTexts()).join(" | ");
p.on("pageerror", (e) => console.log(`  pageerror: ${e.message.split("\n")[0]}`));
await p.goto(srv.origin + "/" + which);

if (which === "ghost") {
  await p.getByLabel("Ghi chú").fill("spam khuyến mãi");
  await p.getByRole("button", { name: "Thêm" }).click();
  await p.waitForTimeout(1500);
  console.log(`Sau 1,5s (server đã từ chối): ${await items()}`);
  await p.reload();
  console.log(`F5:                          ${await items()}`);
} else if (which === "double") {
  await p.getByRole("button", { name: "Thêm" }).dblclick();
  await p.waitForTimeout(2000);
  await p.reload();
  console.log(`Double-click "Thêm", F5: ${await items()}`);
} else {
  await p.getByLabel("Ghi chú").fill("ab");
  await p.getByRole("button", { name: "Thêm" }).click();
  await p.waitForTimeout(1500);
  console.log(`Màn hình: ${JSON.stringify((await p.locator("body").innerText()).trim().slice(0, 120))}`);
  console.log(`Log server: ${srv.logs.find((l) => l.includes("ZodError"))} … ${srv.logs.find((l) => l.includes('"message"'))?.trim()}`);
}
await p.context().browser()?.close();
await srv.close();
```

</details>

### 2 · Concept
| Việc | Trong Next (bài này) | Thay cho (SPA) | Bên C# |
|---|---|---|---|
| Đọc danh sách | Server Component `await listNotes()` | `useQuery` + API `GET` | `OnGetAsync` của Razor Page |
| Tạo / sửa / xoá | Server Action + Zod `safeParse` + `revalidatePath` | `useMutation` + `invalidateQueries` | `OnPostAsync` + `ModelState` |
| Phản hồi tức thì | `useOptimistic(props, reducer)` trong transition — hết transition thì về props thật | `onMutate` + rollback tự viết | — |
| Lỗi validation | Action trả `{ error }` như dữ liệu, hiện cạnh form | `throw` → màn hình lỗi | `ModelState.AddModelError` |
| Vẫn cần TanStack Query khi | Poll/refetch định kỳ, cuộn vô hạn, gọi API bên thứ 3 từ trình duyệt | — | — |
| Vẫn cần Zustand khi | State thuần UI dùng chung nhiều nơi ở client: giỏ hàng chưa lưu, bộ lọc, editor | — | — |

### 3 · Flow / lifecycle
**Bấm "Thêm": màn hình đổi lúc nào, dữ liệu thật về lúc nào?**

```mermaid
flowchart LR
  N0["Bấm Thêm<br/><small>form action</small>"]
  N1["apply({ add })<br/><small>hiện ngay</small>"]
  N2["addNote()<br/><small>Zod → insert</small>"]
  N3["Render lại<br/><small>trang /notes</small>"]
  N4["Props mới<br/><small>notes từ Postgres</small>"]
  N5["Thay bản lạc quan<br/><small>hoặc gỡ nếu lỗi</small>"]
  N0 --> N1
  N1 --> N2
  N2 --> N3
  N3 --> N4
  N4 --> N5
```

Đọc sơ đồ: Trái → phải: form action chạy trong transition; `apply()` thêm bản lạc quan nên ghi chú hiện ngay; action validate + ghi Postgres + `revalidatePath`; response mang props mới; khi transition kết thúc, React bỏ bản lạc quan và dùng props thật — server từ chối thì ghi chú tự biến mất.

### 4 · Ví dụ thực tế
**Ví dụ 1.** Tầng dữ liệu Notes dùng Drizzle + PGlite **ngay trong process Next** (1 kết nối dùng chung, khởi tạo lười). Trang `/notes` (mục 1) `await listNotes()`. Đọc HTML 2 lần, không chạy JS.

`m11/app/lib/notes.ts`

```tsx
// Tầng dữ liệu Notes: Drizzle + PGlite (Postgres WASM trong process). Máy thật: đổi sang drizzle-orm/node-postgres
import "server-only";
import { PGlite } from "@electric-sql/pglite";
import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { boolean, pgTable, serial, text } from "drizzle-orm/pg-core";

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  pinned: boolean("pinned").notNull().default(false),
});
export type Note = typeof notes.$inferSelect;

const g = globalThis as unknown as { notesDb?: Promise<ReturnType<typeof drizzle>> };
const db = () => (g.notesDb ??= (async () => {           // 1 kết nối cho cả process (≈ singleton DbContext pool)
  const client = new PGlite();
  await client.exec(`create table notes (id serial primary key, title text not null, pinned boolean not null default false);
    insert into notes (title, pinned) values ('Đặt thêm hạt Arabica', true), ('Lau máy espresso', false);`);
  return drizzle({ client });
})());
const slow = () => new Promise((r) => setTimeout(r, 600)); // mạng + DB chậm: để thấy rõ UI lạc quan

export const listNotes = async () => (await db()).select().from(notes).orderBy(asc(notes.id));
export async function insertNote(title: string) { await slow(); await (await db()).insert(notes).values({ title }); }
export async function deleteNoteById(id: number) { await slow(); await (await db()).delete(notes).where(eq(notes.id, id)); }
export async function setPinned(id: number, pinned: boolean) { await slow(); await (await db()).update(notes).set({ pinned }).where(eq(notes.id, id)); }
```

```console
❯ npx tsx m11/notesread.ts
GET /notes lần 1 → 200 · 4859ms · 📌 Đặt thêm hạt Arabica | Lau máy espresso
GET /notes lần 2 → 200 ·  59ms · 📌 Đặt thêm hạt Arabica | Lau máy espresso
```

HTML đã có sẵn danh sách đọc từ Postgres — không spinner, không API. Lần 1 mất vài giây: PGlite khởi động Postgres WASM lần đầu trong process (Postgres thật thì là chi phí mở pool kết nối, nhỏ hơn nhiều); lần 2 dưới 100ms vì dùng lại kết nối trong `globalThis`. Pattern singleton này cũng tránh mở thêm pool mỗi lần dev server hot-reload.

**Ví dụ 2.** `NoteBoard` nhận `notes` từ server, dùng `useOptimistic` cho thêm và xoá. Server cố ý chậm 600ms. `m11/notesdemo.ts` đo bằng Chromium: lúc nào ghi chú hiện, lúc nào server trả lời — với 1 ghi chú hợp lệ, 1 ghi chú bị luật "spam" (chỉ server biết) từ chối, và 1 lần xoá.

`m11/app/app/notes/NoteBoard.tsx`

```tsx
"use client";

import { startTransition, useOptimistic, useState } from "react";
import type { Note } from "../../lib/notes";
import { addNote, removeNote } from "./actions";

type Shown = Note & { saving?: boolean };
type Change = { add: string } | { remove: number };

export default function NoteBoard({ notes }: { notes: Note[] }) {
  const [shown, apply] = useOptimistic<Shown[], Change>(notes, (list, c) =>
    "add" in c ? [...list, { id: -1, title: c.add, pinned: false, saving: true }] : list.filter((n) => n.id !== c.remove));
  const [error, setError] = useState("");

  async function submit(formData: FormData) {          // form action: React tự bọc trong transition
    apply({ add: String(formData.get("title")) });     // hiện NGAY, chưa chờ server
    setError((await addNote(formData)).error ?? "");   // xong transition: bản lạc quan bị thay bằng props thật
  }
  const remove = (id: number) => startTransition(async () => { apply({ remove: id }); await removeNote(id); });

  return (
    <>
      <form action={submit}><input name="title" aria-label="Ghi chú" /><button>Thêm</button></form>
      {error && <p role="alert">{error}</p>}
      <ul>{shown.map((n) => (
        <li key={n.id}>{`${n.pinned ? "📌 " : ""}${n.title}${n.saving ? " (đang lưu…)" : ""}`} <button onClick={() => remove(n.id)}>Xoá</button></li>
      ))}</ul>
    </>
  );
}
```

```console
❯ npx tsx m11/notesdemo.ts
Thêm "Pha cold brew"
  +156ms  màn hình: 📌 Đặt thêm hạt Arabica | Lau máy espresso | Pha cold brew (đang lưu…)
  +810ms  server trả lời POST
  +1063ms  màn hình: 📌 Đặt thêm hạt Arabica | Lau máy espresso | Pha cold brew
Thêm "spam khuyến mãi"
  +116ms  server trả lời POST
  +110ms  màn hình: 📌 Đặt thêm hạt Arabica | Lau máy espresso | Pha cold brew | spam khuyến mãi (đang lưu…)
  +167ms  màn hình: 📌 Đặt thêm hạt Arabica | Lau máy espresso | Pha cold brew · lỗi: "Nội dung bị chặn"
Xoá "Lau máy espresso"
  + 65ms  màn hình: 📌 Đặt thêm hạt Arabica | Pha cold brew
  +675ms  server trả lời POST
F5 (đọc lại từ Postgres): 📌 Đặt thêm hạt Arabica | Pha cold brew
```

Ghi chú hiện **trước** khi server trả lời (kèm "(đang lưu…)"), rồi được thay bằng bản thật khi props mới về. Ghi chú "spam": hiện ngay, server từ chối → React tự gỡ khi transition kết thúc, lỗi hiện cạnh form — không có dòng rollback nào trong code. Xoá: biến mất trong vài chục ms, server xác nhận sau ~600ms. F5 đọc lại từ Postgres khớp màn hình. Bản lạc quan dùng `id: -1` để không trùng id thật.

### 5 · Thử thật / bẫy
**Bẫy 1.** **"Lạc quan" tự chế bằng `useState`**: copy props vào state, tự push, bỏ qua kết quả trả về.

`m11/traps/notes-traps/app/ghost/GhostBoard.tsx`

```tsx
"use client";

import { useState } from "react";
import type { Note } from "../../../../app/lib/notes";
import { addNote } from "../../../../app/app/notes/actions";

// ❌ "Lạc quan" tự chế bằng useState: copy props vào state, tự push, không ai gỡ ra khi server từ chối
export default function GhostBoard({ notes }: { notes: Note[] }) {
  const [list, setList] = useState(notes);
  async function submit(formData: FormData) {
    setList([...list, { id: -1, title: String(formData.get("title")), pinned: false }]);
    await addNote(formData);                       // bỏ qua kết quả { error }
  }
  return (
    <>
      <form action={submit}><input name="title" aria-label="Ghi chú" /><button>Thêm</button></form>
      <ul>{list.map((n) => <li key={n.id}>{n.title}</li>)}</ul>
    </>
  );
}
```

```console
❯ npx next build m11/traps/notes-traps > /dev/null && npx tsx m11/notetraps.ts ghost
Sau 1,5s (server đã từ chối): Đặt thêm hạt Arabica | Lau máy espresso | spam khuyến mãi
F5:                          Đặt thêm hạt Arabica | Lau máy espresso
```

Server đã từ chối nhưng ghi chú "ma" ở lại màn hình, không lỗi nào hiện; F5 mới biến mất. Thêm nữa, `useState(notes)` chỉ đọc props **lần đầu** — dữ liệu mới từ `revalidatePath` bị bỏ qua. `useOptimistic` giải cả hai: luôn tính từ props thật, bản lạc quan chỉ sống trong transition.

**Bẫy 2.** **Nút gửi không khoá khi đang chờ** — server chậm, người dùng bấm thêm lần nữa.

`m11/traps/notes-traps/app/double/QuickAdd.tsx`

```tsx
"use client";

import { addNote } from "../../../../app/app/notes/actions";

// ❌ Nút không bị khoá khi đang gửi — server chậm 600ms, người dùng sốt ruột bấm thêm
export default function QuickAdd() {
  return (
    <form action={async (formData) => { await addNote(formData); }}>
      <input name="title" aria-label="Ghi chú" defaultValue="Kiểm kho sữa" />
      <button>Thêm</button>
    </form>
  );
}
```

```console
❯ npx tsx m11/notetraps.ts double
Double-click "Thêm", F5: Đặt thêm hạt Arabica | Lau máy espresso | Kiểm kho sữa | Kiểm kho sữa
```

Double-click = 2 lần gọi action = 2 bản ghi trùng. Khoá nút bằng `useFormStatus().pending` (11.2) hoặc `isPending` của `useActionState`; với thao tác tiền bạc thì thêm khoá idempotency ở server (bài 12.2), vì client có thể gửi lại theo cách khác.

**Bẫy 3.** **Validate bằng `.parse()`** (ném lỗi) thay vì `.safeParse()` trong Server Action.

`m11/traps/notes-traps/app/throw/actions.ts`

```tsx
"use server";

import { z } from "zod";
import { insertNote } from "../../../../app/lib/notes";

// ❌ .parse() ném ZodError khi input sai — lỗi "validation" biến thành exception
export async function addNoteStrict(formData: FormData) {
  const title = z.string().trim().min(3, "Tiêu đề ít nhất 3 ký tự").parse(formData.get("title"));
  await insertNote(title);
}
```

```console
❯ npx tsx m11/notetraps.ts throw
  pageerror: Minified React error #441; visit https://react.dev/errors/441 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
Màn hình: "This page couldn’t load\n\nA server error occurred. Reload to try again.\n\nReload\n\nERROR 1683954947"
Log server: Error [ZodError]: [ … "message": "Tiêu đề ít nhất 3 ký tự"
```

Lỗi validation thành exception → production giấu nội dung lỗi, cả trang thành "This page couldn't load", người dùng mất chữ vừa gõ. Lỗi do người dùng nhập sai là **dữ liệu**: `safeParse` rồi trả `{ error }` để hiện cạnh ô nhập. `throw` (và `error.tsx`) dành cho lỗi không lường trước.

### 6 · Tóm tắt bằng hình
**(a) Cây thư mục sau bài này**

```text
m11/app/
├─ next.config.ts  [SỬA]  ← serverExternalPackages: PGlite
├─ lib/notes.ts  [MỚI]  ← bảng notes (Drizzle) + kết nối singleton + CRUD
└─ app/notes/page.tsx · actions.ts · NoteBoard.tsx  [MỚI]  ← đọc ở server · ghi bằng action · UI lạc quan
m11/notesread.ts · notesdemo.ts · notetraps.ts  [MỚI]  ← script ví dụ + bẫy
m11/traps/notes-traps/ (ghost · double · throw)  [MỚI]  ← 3 bẫy trong 1 app
m11/ex5/start · ex5/solution · ex5/check.ts  [MỚI]  ← bài Làm ngay
```

**(b) Đọc trong 10 giây**

**Khung 1 tính năng CRUD trong Next**

```mermaid
flowchart LR
  N0["page.tsx<br/><small>await list() ở server</small>"]
  N1["Client nhỏ<br/><small>useOptimistic</small>"]
  N2["Server Action<br/><small>Zod safeParse → ghi</small>"]
  N3["revalidatePath<br/><small>props mới về</small>"]
  N0 --> N1
  N1 --> N2
  N2 --> N3
```

Đọc sơ đồ: Đọc ở server, tương tác ở lá client, ghi bằng action có Zod, làm mới bằng revalidate, phản hồi tức thì bằng useOptimistic.

### 7 · Làm ngay (≤ 10 phút)
**Mục tiêu:** `m11/ex5/start`: mỗi ghi chú có nút Ghim gọi action `togglePin` (server chậm 600ms) — bấm xong phải chờ gần 1 giây nút mới đổi. Chỉ sửa `app/PinButton.tsx` để nút đổi ngay, vẫn lưu thật.

File khởi đầu:

`m11/ex5/start/app/PinButton.tsx`

```tsx
"use client"; // ← CHỈ sửa file này

import { startTransition } from "react";
import { togglePin } from "../../../app/app/notes/actions";

export default function PinButton({ id, pinned }: { id: number; pinned: boolean }) {
  return (
    <button aria-label={`Ghim #${id}`} onClick={() => startTransition(() => togglePin(id, !pinned))}>
      {pinned ? "📌 Đã ghim" : "Ghim"}
    </button>
  );
}
```

Chạy file khởi đầu (đang đỏ):

```console
❯ npx next build m11/ex5/start > /dev/null && npx tsx m11/ex5/check.ts m11/ex5/start
✗ Bấm Ghim → nút thành "📌 Đã ghim" trong < 300ms  → 964ms
✓ Sau 1,5s và sau F5 vẫn "📌 Đã ghim" (server đã lưu)
✗ Bấm lần nữa → "Ghim" trong < 300ms, F5 vẫn "Ghim"  → 707ms, sau F5 "Ghim"
1/3 đạt
```

Tiêu chí nghiệm thu:

- [ ] Bấm Ghim → nút thành "📌 Đã ghim" trong < 300ms
- [ ] Sau 1,5s và sau F5 vẫn "📌 Đã ghim" (server đã lưu)
- [ ] Bấm lần nữa → "Ghim" trong < 300ms, F5 vẫn "Ghim"
- [ ] `npx tsc -p .` không lỗi

Lệnh nghiệm thu:

```bash
npx next build m11/ex5/start > /dev/null && npx tsx m11/ex5/check.ts m11/ex5/start && npx tsc -p .
```

Lời giải tham chiếu chạy ra (output cần đạt):

```console
❯ npx next build m11/ex5/solution > /dev/null && npx tsx m11/ex5/check.ts m11/ex5/solution
✓ Bấm Ghim → nút thành "📌 Đã ghim" trong < 300ms
✓ Sau 1,5s và sau F5 vẫn "📌 Đã ghim" (server đã lưu)
✓ Bấm lần nữa → "Ghim" trong < 300ms, F5 vẫn "Ghim"
3/3 đạt
```

<details><summary>Gợi ý nếu bị đỏ</summary>

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| Vẫn > 600ms | Nút hiển thị theo prop `pinned` — chỉ đổi khi props mới về | `const [shown, setShown] = useOptimistic(pinned)`, hiển thị theo `shown` |
| Cảnh báo "optimistic state update outside a transition" | Gọi `setShown` ngoài transition | Đặt `setShown` và `await togglePin(…)` trong cùng `startTransition(async () => …)` |
| Bấm lần 2 lại ghim tiếp | Gửi `!pinned` (giá trị cũ) thay vì `!shown` | Tính giá trị mới từ `shown` |

`m11/ex5/start/app/PinButton.tsx` (diff)

```diff
 "use client"; // ← CHỈ sửa file này
 
-import { startTransition } from "react";
+import { startTransition, useOptimistic } from "react";
 import { togglePin } from "../../../app/app/notes/actions";
 
 export default function PinButton({ id, pinned }: { id: number; pinned: boolean }) {
+  const [shown, setShown] = useOptimistic(pinned);       // = pinned khi không có transition đang chạy
+  const click = () => startTransition(async () => {
+    setShown(!shown);                                     // đổi ngay trên màn hình
+    await togglePin(id, !shown);                          // xong → props mới từ server thay bản lạc quan
+  });
   return (
-    <button aria-label={`Ghim #${id}`} onClick={() => startTransition(() => togglePin(id, !pinned))}>
-      {pinned ? "📌 Đã ghim" : "Ghim"}
+    <button aria-label={`Ghim #${id}`} onClick={click}>
+      {shown ? "📌 Đã ghim" : "Ghim"}
     </button>
   );
```

</details>

### 8 · 3 câu hỏi nhanh
1. Phỏng vấn: "App Next có Server Actions rồi, còn cần TanStack Query không?"

   <details><summary>Đáp án</summary>

   Cho CRUD thường thì không: đọc ở Server Component, ghi bằng action + `revalidatePath`, phản hồi tức thì bằng `useOptimistic`. Vẫn cần khi: dữ liệu phải tự làm mới theo thời gian (poll, dashboard), cuộn vô hạn / phân trang phía client, cache phía client giữa nhiều màn hình tương tác dày (editor), hoặc gọi API bên thứ 3 trực tiếp từ trình duyệt. Server state vẫn **không** bỏ vào Zustand.

   </details>

2. "`useOptimistic` khác gì `setState` trước khi gọi API?"

   <details><summary>Đáp án</summary>

   `useOptimistic` luôn tính từ giá trị thật (props) cộng các thay đổi đang chờ, và chỉ sống trong transition: transition xong thì về props thật — thành công thì props mới đã có dữ liệu, thất bại thì tự hoàn tác. Tự `setState` thì phải tự viết rollback, tự đồng bộ khi props đổi (bẫy 1) và dễ lệch giữa UI với DB.

   </details>

3. Review code AI cho Notes: page `"use client"`; Zustand store giữ `notes`; `useEffect` fetch `/api/notes` nạp store; thêm ghi chú = `fetch POST` rồi `set([...notes, newNote])`; không validate ở server. Góp ý?

   <details><summary>Đáp án</summary>

   Server state nằm trong Zustand (roadmap 3.4 cấm) + `useEffect` fetch (thiếu cache, race, SSR rỗng). Viết lại theo khung bài này: page Server Component `await listNotes()`, `NoteBoard` client với `useOptimistic`, action `addNote` dùng Zod `safeParse` trả lỗi như dữ liệu, `revalidatePath`, nút khoá khi pending. Bỏ store và route handler nếu không ai ngoài app dùng.

   </details>

