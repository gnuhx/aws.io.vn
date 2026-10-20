# Module 12 · Portfolio projects

_AI chat streaming · Stripe Checkout + webhook · Inngest việc nền · LeetCode clone với Judge0 · Realtime Postgres → SSE_

**Đã chạy với:** Node 22.22.0 · Next.js 16.4.2 · React 19.3.1 · TypeScript 7.0.2 · ai 7.0.146 · @ai-sdk/react 4.0.150 · stripe 23.0.0 · inngest 4.25.0 · @inngest/test 1.0.0 · @electric-sql/pglite 0.5.10 · zod 4.6.7 · tsx 4.23.15 · playwright-core 1.64.1 + Chromium

App build bằng `next build`, chạy bằng `next start`; script `m12/*.ts` gọi HTTP hoặc điều khiển **Chromium thật**; mọi file kiểm bằng `npx tsc -p .` (strict). Sandbox không có tài khoản/khoá nên dùng **bản thay thế cùng hợp đồng**: **LLM** = provider giả theo đúng interface `LanguageModelV4` của AI SDK (đổi sang OpenAI/Anthropic chỉ đổi 1 dòng); **Stripe** = webhook ký bằng chính SDK Stripe (`generateTestHeaderString`, cùng HMAC với Stripe thật) — riêng bước tạo Checkout Session cần mạng nên **chưa chạy ở sandbox**; **Inngest** = test engine chính thức `@inngest/test` (cùng engine thực thi step), gửi event thật cần Dev Server/Cloud nên **chưa chạy**; **Judge0** = mini judge cùng request/response/status (Judge0 thật cần Docker + isolate); **Supabase Realtime** = PGlite (Postgres WASM) + trigger `LISTEN/NOTIFY` + SSE — cùng mô hình "DB tự đẩy thay đổi".

Vị trí: Đã học Module 11 · Next.js App Router (RSC, Server Actions, Drizzle + auth, Cache Components) · **Đang học Module 12** · Sắp tới Phase 13 · Review code AI generate (checklist 13.2, luyện mỗi tuần)

## Bài 12.1 · AI Chat streaming: AI SDK, SSE, dừng giữa chừng, lưu lịch sử

_Nguồn roadmap: [NextAI] AI Chat App với streaming (model selection, streaming response, message persistence)_

### 1 · Một câu & nằm ở đâu
LLM trả lời chậm (vài giây) nhưng sinh **từng token** — nên đừng bắt người dùng nhìn spinner: route handler gọi `streamText()` và trả `toUIMessageStreamResponse()` = 1 response **SSE** (`text/event-stream`) đẩy từng mẩu chữ về; client dùng `useChat()` nối chữ vào tin nhắn. Truyền `abortSignal: req.signal` để khi người dùng bấm Dừng / đóng tab thì **huỷ luôn lời gọi model** (đỡ tốn tiền). Lưu lịch sử trong `onEnd` khi stream kết thúc. Mọi thứ client gửi (model, độ dài) đều phải kiểm ở server.

**[Trình duyệt]** → **[Route Handler · Action]** → **[Dịch vụ ngoài: LLM · Stripe · Judge0]** → Việc nền: Inngest → DB → **[Đẩy về client: stream · SSE]**

<details><summary>m12/chat/lib/models.ts — provider GIẢ cùng hợp đồng LanguageModelV4: token đổ về đều đặn như API thật, log khi bị huỷ</summary>

`m12/chat/lib/models.ts`

```tsx
// Provider GIẢ cùng hợp đồng LanguageModelV4 của AI SDK — thay OpenAI/Anthropic ở sandbox (không có API key).
// Máy thật chỉ đổi dòng tạo model: import { openai } from "@ai-sdk/openai"; fast: openai("gpt-…")
import "server-only";
import type { LanguageModelV4StreamPart } from "@ai-sdk/provider";
import { MockLanguageModelV4 } from "ai/test";

const usage = (n: number) => ({
  inputTokens: { total: 20, noCache: 20, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: n, text: n, reasoning: undefined },
});
const answer = (q: string) =>
  `Bạn hỏi: "${q}". Gợi ý của barista: buổi sáng latte nóng, buổi chiều cold brew ít đá, ` +
  `cần chút ngọt thì mocha. Hạt hôm nay rang vừa, hậu vị sô-cô-la. Nhớ uống thêm nước lọc nhé!`;

function fake(name: string, msPerToken: number) {
  return new MockLanguageModelV4({
    doStream: async ({ prompt }) => {
      const last = prompt.at(-1);
      const q = last?.role === "user" ? last.content.map((p) => (p.type === "text" ? p.text : "")).join("") : "";
      const tokens = answer(q).split(/(?<= )/);           // "token" = 1 từ kèm dấu cách
      let i = 0;
      console.log(`[server] ${name}: bắt đầu, sẽ phát ${tokens.length} token`);
      let timer: ReturnType<typeof setInterval> | undefined;
      const stream = new ReadableStream<LanguageModelV4StreamPart>({
        start(c) {                                         // như API thật: token cứ đổ về, không chờ ai đọc
          c.enqueue({ type: "stream-start", warnings: [] });
          c.enqueue({ type: "text-start", id: "t1" });
          timer = setInterval(() => {
            if (i < tokens.length) return c.enqueue({ type: "text-delta", id: "t1", delta: tokens[i++] });
            clearInterval(timer);
            c.enqueue({ type: "text-end", id: "t1" });
            c.enqueue({ type: "finish", finishReason: { unified: "stop", raw: "stop" }, usage: usage(i) });
            c.close();
            console.log(`[server] ${name}: phát xong ${i}/${tokens.length} token`);
          }, msPerToken);
        },
        cancel() {
          clearInterval(timer);
          console.log(`[server] ${name}: bị huỷ sau ${i}/${tokens.length} token`); // provider thật: ngắt HTTP, ngừng tính tiền
        },
      });
      return { stream };
    },
  });
}

export const models = { fast: fake("fast", 30), smart: fake("smart", 90) };
export type ModelId = keyof typeof models;
```

</details>

<details><summary>m12/chat/lib/chats.ts — lưu lịch sử chat (thay bảng messages)</summary>

`m12/chat/lib/chats.ts`

```tsx
// Lưu lịch sử chat (thay bảng messages trong DB): key = chat id
import "server-only";
import type { UIMessage } from "ai";

const store = globalThis as unknown as { chats?: Map<string, UIMessage[]> };
store.chats ??= new Map();

export const loadChat = (id: string): UIMessage[] => store.chats!.get(id) ?? [];

export function saveChat(id: string, messages: UIMessage[], aborted: boolean) {
  store.chats!.set(id, messages);
  const last = messages.at(-1);
  const text = last?.parts.map((p) => (p.type === "text" ? p.text : "")).join("") ?? "";
  console.log(`[server] lưu chat ${id}: ${messages.length} tin${aborted ? " (bị dừng giữa chừng)" : ""}, tin cuối ${text.length} ký tự`);
}
```

</details>

<details><summary>m12/chat/app/chat/[id]/page.tsx — /chat/:id — server nạp lịch sử, client tiếp tục</summary>

`m12/chat/app/chat/[id]/page.tsx`

```tsx
// /chat/:id — server nạp lịch sử đã lưu, client tiếp tục cuộc trò chuyện
import { loadChat } from "../../../lib/chats";
import Chat from "./Chat";

export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Chat id={id} initialMessages={loadChat(id)} />;
}
```

</details>

<details><summary>m12/sse.ts — script ví dụ 1: đọc SSE từng sự kiện</summary>

`m12/sse.ts`

```tsx
// Câu trả lời đi trên dây thế nào? POST /api/chat như useChat làm, in từng sự kiện SSE kèm mốc thời gian
import { serve } from "./serve";

const srv = await serve("m12/chat", 3201);
const body = { id: "sse-demo", model: "fast", messages: [{ id: "u1", role: "user", parts: [{ type: "text", text: "Chiều nay uống gì?" }] }] };
const t0 = Date.now();
const res = await fetch(srv.origin + "/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
console.log(`+${String(Date.now() - t0).padStart(4)}ms  HTTP ${res.status} · content-type: ${res.headers.get("content-type")}`);

const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
let buf = "", deltas = 0, chars = 0;
for (;;) {
  const { done, value } = await reader.read();
  if (done) break;
  buf += value;
  for (let i = buf.indexOf("\n\n"); i >= 0; i = buf.indexOf("\n\n")) {      // SSE: mỗi sự kiện kết thúc bằng dòng trống
    const event = buf.slice(0, i); buf = buf.slice(i + 2);
    const at = `+${String(Date.now() - t0).padStart(4)}ms`;
    if (event.includes('"text-delta"')) {
      deltas++; chars += (JSON.parse(event.slice(6)) as { delta: string }).delta.length;
      if (deltas <= 3) console.log(`${at}  ${event}`);
      if (deltas === 4) console.log("          … (các text-delta tiếp theo không in)");
    } else console.log(`${at}  ${event}`);
  }
}
console.log(`Tổng: ${deltas} text-delta, ${chars} ký tự`);
console.log("Log server:", srv.serverLines().join(" / "));
await srv.close();
```

</details>

<details><summary>m12/chatui.ts — script ví dụ 2: Chromium dùng giao diện chat</summary>

`m12/chatui.ts`

```tsx
// Chromium thật dùng giao diện chat: xem chữ hiện dần; bấm Dừng; F5 xem lịch sử đã lưu
import { serve } from "./serve";
import { launch } from "./browser";

const mode = process.argv[2] ?? "stream";
const srv = await serve("m12/chat", 3202);
const p = await (await launch()).newPage();
await p.goto(srv.origin + "/chat/" + mode);
const reply = async () => (await p.locator("li").allInnerTexts()).filter((t) => t.startsWith("Barista")).at(-1) ?? "";
const status = () => p.getByRole("status").innerText();

async function ask(q: string, model: string) {
  await p.getByLabel("Model").selectOption(model);
  await p.getByLabel("Câu hỏi").fill(q);
  await p.getByRole("button", { name: "Gửi" }).click();
  return Date.now();
}
if (mode === "stream") {
  const t0 = await ask("Chiều nay uống gì?", "fast");
  for (const ms of [300, 700, 1100]) {
    await p.waitForTimeout(ms - (Date.now() - t0));
    console.log(`+${ms}ms  status=${(await status()).padEnd(9)} màn hình: ${(await reply()).length} ký tự`);
  }
  await p.getByRole("status").filter({ hasText: "ready" }).waitFor();
  console.log(`+${Date.now() - t0}ms status=ready     ${await reply()}`);
} else {
  const t0 = await ask("Gợi ý món ngọt?", "smart");
  await p.waitForTimeout(800);
  await p.getByRole("button", { name: "Dừng" }).click();
  await p.waitForTimeout(500);
  console.log(`Bấm Dừng ở +800ms → status=${await status()} · ${(await reply()).length} ký tự: "${await reply()}"`);
  await p.reload();
  console.log(`F5 → ${(await p.locator("li").allInnerTexts()).length} tin từ server: ${(await p.locator("li").allInnerTexts()).map((t) => t.slice(0, 24) + "…").join(" | ")}`);
  void t0;
}
console.log("Log server:", srv.serverLines().join(" / "));
await p.context().browser()?.close();
await srv.close();
```

</details>

<details><summary>m12/traps/public-key/.env.production — bẫy 3: khoá có tiền tố NEXT_PUBLIC_</summary>

`m12/traps/public-key/.env.production`

```dotenv
# AI gợi ý: "client không đọc được OPENAI_KEY → thêm tiền tố NEXT_PUBLIC_"
NEXT_PUBLIC_OPENAI_KEY=sk-proj-CoffeeShop7f3a9
```

</details>

### 2 · Concept
| Khái niệm | Trong bài | Ghi chú | Bên C# |
|---|---|---|---|
| `streamText()` | Gọi model, nhận luồng token | Provider là 1 dòng: `openai("…")`, `anthropic("…")`, hoặc provider giả | `IAsyncEnumerable<string>` từ SDK OpenAI .NET |
| UI message stream | `toUIMessageStreamResponse()` → SSE: `start`, `text-delta`…, `finish`, `[DONE]` | `useChat` hiểu sẵn định dạng này | SSE từ Minimal API / SignalR |
| `useChat()` | `messages` (mỗi tin có `parts`), `status`: submitted → streaming → ready, `sendMessage`, `stop` | Mặc định POST `/api/chat` | — |
| Huỷ | `abortSignal: req.signal`: client ngắt → huỷ gọi model | Không truyền → model sinh hết, vẫn tính tiền (bẫy 2) | `HttpContext.RequestAborted` (CancellationToken) |
| Lưu lịch sử | `onEnd({ messages, isAborted })` ghi DB; trang server nạp lại khi F5 | Lưu cả khi bị dừng giữa chừng | — |
| Chọn model | Client gửi `model` trong body; server tra danh sách cho phép | Không tin client (mục 7) | — |

### 3 · Flow / lifecycle
**Gõ câu hỏi → chữ hiện dần: dữ liệu đi qua những đâu?**

```mermaid
flowchart LR
  N0["sendMessage<br/><small>POST /api/chat</small>"]
  N1["route.ts<br/><small>streamText + abortSignal</small>"]
  N2["Model<br/><small>token đổ về liên tục</small>"]
  N3["SSE<br/><small>data: text-delta…</small>"]
  N4["useChat<br/><small>nối delta vào parts</small>"]
  N5["onEnd<br/><small>lưu lịch sử</small>"]
  N0 --> N1
  N1 --> N2
  N2 --> N3
  N3 --> N4
  N4 --> N5
```

Đọc sơ đồ: Trái → phải: `useChat` POST lịch sử chat; route gọi `streamText` kèm `req.signal`; model đổ token về; AI SDK đóng gói thành sự kiện SSE `text-delta`; `useChat` nối từng mẩu vào tin nhắn đang hiện; stream xong (hoặc bị dừng) thì `onEnd` lưu lịch sử.

### 4 · Ví dụ thực tế
**Ví dụ 1.** Route chat: nhận `{ id, messages, model }`, gọi model, trả SSE. `m12/sse.ts` gửi đúng request mà `useChat` gửi, rồi in từng sự kiện kèm mốc thời gian (chỉ in 3 `text-delta` đầu).

`m12/chat/app/api/chat/route.ts`

```tsx
// POST /api/chat — nhận lịch sử chat, gọi model, STREAM câu trả lời về theo từng token
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { saveChat } from "../../../lib/chats";
import { models, type ModelId } from "../../../lib/models";

type Body = { id: string; messages: UIMessage[]; model?: ModelId };

export async function POST(req: Request) {
  const { id, messages, model = "fast" } = (await req.json()) as Body;
  const result = streamText({
    model: models[model],
    system: "Bạn là barista của Coffee Shop, trả lời ngắn gọn.",
    messages: await convertToModelMessages(messages),    // UIMessage (có parts, id) → định dạng model hiểu
    abortSignal: req.signal,                             // client ngắt kết nối → huỷ luôn lời gọi model
  });
  return result.toUIMessageStreamResponse({              // SSE: mỗi sự kiện 1 dòng "data: {...}"
    originalMessages: messages,
    onEnd: ({ messages: all, isAborted }) => saveChat(id, all, isAborted), // lưu khi stream kết thúc
  });
}
```

```console
❯ npx next build m12/chat > /dev/null && npx tsx m12/sse.ts
+ 142ms  HTTP 200 · content-type: text/event-stream
+ 164ms  data: {"type":"start"}
+ 164ms  data: {"type":"start-step"}
+ 164ms  data: {"type":"text-start","id":"t1"}
+ 194ms  data: {"type":"text-delta","id":"t1","delta":"Bạn "}
+ 228ms  data: {"type":"text-delta","id":"t1","delta":"hỏi: "}
+ 254ms  data: {"type":"text-delta","id":"t1","delta":"\"Chiều "}
          … (các text-delta tiếp theo không in)
+1403ms  data: {"type":"text-end","id":"t1"}
+1403ms  data: {"type":"finish-step"}
+1403ms  data: {"type":"finish","finishReason":"stop"}
+1407ms  data: [DONE]
Tổng: 39 text-delta, 191 ký tự
Log server: [server] fast: bắt đầu, sẽ phát 39 token / [server] fast: phát xong 39/39 token / [server] lưu chat sse-demo: 2 tin, tin cuối 191 ký tự
```

Header về sau ~0,15 giây, chữ đầu tiên sau ~0,2 giây — người dùng thấy câu trả lời bắt đầu trong khi model còn viết tiếp hơn 1 giây. Dây truyền là SSE thuần: mỗi sự kiện 1 dòng `data: {...}` + dòng trống, kết thúc bằng `[DONE]`. `convertToModelMessages` đổi `UIMessage` (có `id`, `parts` cho UI) sang định dạng model hiểu. `onEnd` chạy sau khi stream đóng: lưu 2 tin (câu hỏi + trả lời) — dữ liệu nằm ở server, không phải localStorage.

**Ví dụ 2.** Client: `useChat` giữ toàn bộ trạng thái. Chọn model gửi kèm theo từng lần qua `body`. `m12/chatui.ts` dùng Chromium thật: lần 1 xem chữ hiện dần; lần 2 chọn model `smart` (chậm), bấm **Dừng** ở +800ms rồi F5.

`m12/chat/app/chat/[id]/Chat.tsx`

```tsx
"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useState } from "react";

const textOf = (m: UIMessage) => m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

export default function Chat({ id, initialMessages }: { id: string; initialMessages: UIMessage[] }) {
  const { messages, sendMessage, status, stop } = useChat({ id, messages: initialMessages }); // mặc định POST /api/chat
  const [input, setInput] = useState("");
  const [model, setModel] = useState("fast");
  const busy = status === "submitted" || status === "streaming";
  return (
    <main>
      <ul>{messages.map((m) => <li key={m.id}>{`${m.role === "user" ? "Bạn" : "Barista"}: ${textOf(m)}`}</li>)}</ul>
      <form onSubmit={(e) => { e.preventDefault(); void sendMessage({ text: input }, { body: { model } }); setInput(""); }}>
        <select aria-label="Model" value={model} onChange={(e) => setModel(e.target.value)}>
          <option value="fast">fast</option><option value="smart">smart</option>
        </select>
        <input aria-label="Câu hỏi" value={input} onChange={(e) => setInput(e.target.value)} />
        <button disabled={busy || !input.trim()}>Gửi</button>
        {busy && <button type="button" onClick={() => void stop()}>Dừng</button>}{/* 2 nút riêng, không đổi type tại chỗ */}
      </form>
      <p role="status">{status}</p>
    </main>
  );
}
```

```console
❯ npx tsx m12/chatui.ts stream
+300ms  status=streaming màn hình: 39 ký tự
+700ms  status=streaming màn hình: 104 ký tự
+1100ms  status=streaming màn hình: 162 ký tự
+1407ms status=ready     Barista: Bạn hỏi: "Chiều nay uống gì?". Gợi ý của barista: buổi sáng latte nóng, buổi chiều cold brew ít đá, cần chút ngọt thì mocha. Hạt hôm nay rang vừa, hậu vị sô-cô-la. Nhớ uống thêm nước lọc nhé!
Log server: [server] fast: bắt đầu, sẽ phát 39 token / [server] fast: phát xong 39/39 token / [server] lưu chat stream: 2 tin, tin cuối 191 ký tự

❯ npx tsx m12/chatui.ts stop
Bấm Dừng ở +800ms → status=ready · 42 ký tự: "Barista: Bạn hỏi: "Gợi ý món ngọt?". Gợi ý"
F5 → 2 tin từ server: Bạn: Gợi ý món ngọt?… | Barista: Bạn hỏi: "Gợi ý…
Log server: [server] smart: bắt đầu, sẽ phát 39 token / [server] smart: bị huỷ sau 8/39 token / [server] lưu chat stop: 2 tin, tin cuối 34 ký tự
```

`status` đi `streaming` → `ready`, số ký tự trên màn hình tăng dần. Bấm Dừng: `stop()` huỷ fetch → server nhận `req.signal` → **model bị huỷ sau 8/39 token**; `onEnd` vẫn chạy và lưu phần đã sinh, nên F5 thấy đúng 2 tin. Nút Gửi và Dừng là **2 phần tử riêng**: bản đầu tôi viết đổi `type` của cùng 1 nút tại chỗ, Chromium bắt được lỗi — bấm Dừng làm React đổi nút thành `submit` ngay trong cú click → form gửi thêm 1 tin rỗng.

### 5 · Thử thật / bẫy
**Bẫy 1.** **Đợi model viết xong mới trả 1 cục JSON** — "cho đơn giản, khỏi lo stream".

`m12/chat/app/api/chat-buffered/route.ts`

```tsx
// ❌ Chờ model viết XONG mới trả 1 cục JSON — "cho đơn giản, khỏi lo stream"
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { models } from "../../../lib/models";

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: UIMessage[] };
  const result = streamText({ model: models.smart, messages: await convertToModelMessages(messages) });
  return Response.json({ text: await result.text }); // await toàn bộ câu trả lời
}
```

```console
❯ npx tsx m12/ttfb.ts
/api/chat           byte đầu tiên sau  144ms · xong sau 3762ms · 2414 byte
/api/chat-buffered  byte đầu tiên sau 3652ms · xong sau 3653ms · 255 byte
```

Cùng model, cùng câu hỏi: bản stream có byte đầu tiên sau ~150ms, bản chờ hết thì người dùng nhìn spinner gần 4 giây. Tổng thời gian như nhau — khác nhau ở **cảm nhận**: chữ hiện sau 0,15s thì người ta đọc dần; 4s trắng thì người ta bấm F5 (và bạn trả tiền 2 lần).

**Bẫy 2.** **Không truyền `abortSignal`** cho model. Người dùng bỏ đi sau 0,5 giây.

`m12/chat/app/api/chat-noabort/route.ts`

```tsx
// ❌ Giống /api/chat nhưng KHÔNG truyền abortSignal cho model
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { models } from "../../../lib/models";

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: UIMessage[] };
  const result = streamText({ model: models.smart, messages: await convertToModelMessages(messages) });
  return result.toUIMessageStreamResponse();
}
```

```console
❯ npx tsx m12/abort.ts
/api/chat          client huỷ ở +500ms → [server] smart: bắt đầu, sẽ phát 39 token / [server] smart: bị huỷ sau 5/39 token / [server] lưu chat abort: 2 tin, tin cuối 20 ký tự
/api/chat-noabort  client huỷ ở +500ms → [server] smart: bắt đầu, sẽ phát 39 token / [server] smart: phát xong 39/39 token
```

Có `abortSignal`: model bị huỷ sau vài token. Không có: client đã đi từ lâu mà model vẫn sinh đủ 39/39 token — với API thật bạn trả tiền cho cả phần không ai đọc, và giữ 1 kết nối tới provider vô ích. Đây là `CancellationToken` của thế giới Next: luôn nối `req.signal` xuống mọi lời gọi tốn tiền.

**Bẫy 3.** **Gọi thẳng OpenAI từ trình duyệt** bằng khoá `NEXT_PUBLIC_OPENAI_KEY` — AI gợi ý thêm tiền tố vì client "không đọc được biến".

`m12/traps/public-key/app/page.tsx`

```tsx
"use client"; // ❌ gọi thẳng OpenAI từ trình duyệt bằng khoá có tiền tố NEXT_PUBLIC_

import { useState } from "react";

export default function Page() {
  const [reply, setReply] = useState("");
  async function ask() {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4.1-mini", input: "Chiều nay uống gì?" }),
    });
    setReply(JSON.stringify(await res.json()));
  }
  return <><button onClick={ask}>Hỏi</button><p>{reply}</p></>;
}
```

```console
❯ npx next build m12/traps/public-key > /dev/null && grep -rho "sk-proj-[A-Za-z0-9]*" m12/traps/public-key/.next/static/
sk-proj-CoffeeShop7f3a9
```

Next **thay chữ** mọi `process.env.NEXT_PUBLIC_*` vào bundle lúc build (như `VITE_*` ở Module 10) — khoá nằm nguyên văn trong file JS công khai, ai cũng lấy được và tiêu tiền của bạn. Khoá LLM chỉ sống ở server; trình duyệt gọi `/api/chat` của bạn. Lỡ build ra rồi: thu hồi khoá ngay.

### 6 · Tóm tắt bằng hình
**(a) Cây thư mục sau bài này**

```text
sandbox/
├─ package.json  [SỬA]  ← + ai, @ai-sdk/react, stripe, inngest, @inngest/test
├─ tsconfig.json  [SỬA]  ← include m11 + m12
└─ m12/chat/  [MỚI]  ← app Next của bài
   ├─ lib/models.ts · chats.ts  [MỚI]  ← provider giả cùng hợp đồng · lưu lịch sử
   ├─ app/api/chat/route.ts  [MỚI]  ← streamText → SSE, abortSignal, onEnd
   ├─ app/chat/[id]/page.tsx · Chat.tsx  [MỚI]  ← nạp lịch sử · useChat
   └─ app/api/chat-buffered · chat-noabort  [MỚI]  ← bẫy 1, 2
m12/serve.ts · browser.ts · sse.ts · chatui.ts · ttfb.ts · abort.ts  [MỚI]  ← script
m12/traps/public-key/  [MỚI]  ← bẫy 3
m12/ex1/start · ex1/solution · ex1/check.ts  [MỚI]  ← bài Làm ngay
```

**(b) Đọc trong 10 giây**

**Route chat an toàn cần đủ mấy thứ?**

```mermaid
flowchart LR
  N0["Kiểm input<br/><small>model, độ dài, số tin</small>"]
  N1["streamText<br/><small>abortSignal: req.signal</small>"]
  N2["Trả SSE ngay<br/><small>toUIMessageStream…</small>"]
  N3["onEnd<br/><small>lưu lịch sử</small>"]
  N0 --> N1
  N1 --> N2
  N2 --> N3
```

Đọc sơ đồ: Kiểm input trước khi tốn tiền gọi model, nối `req.signal` để huỷ được, trả stream ngay, lưu khi xong.

### 7 · Làm ngay (≤ 10 phút)
**Mục tiêu:** `m12/ex1/start/app/api/chat/route.ts` do AI viết: tin hết những gì client gửi — model lạ làm server 500, câu hỏi dài bao nhiêu cũng gửi cho model (tốn tiền). Chỉ sửa file này.

File khởi đầu:

`m12/ex1/start/app/api/chat/route.ts`

```tsx
// ← CHỈ sửa file này. AI viết: tin hết những gì client gửi lên
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { models, type ModelId } from "../../../../../chat/lib/models";

type Body = { messages: UIMessage[]; model: ModelId };

export async function POST(req: Request) {
  const { messages, model } = (await req.json()) as Body;
  const result = streamText({
    model: models[model],
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
  });
  return result.toUIMessageStreamResponse();
}
```

Chạy file khởi đầu (đang đỏ):

```console
❯ npx next build m12/ex1/start > /dev/null && npx tsx m12/ex1/check.ts m12/ex1/start
✗ model "gpt-9-ultra" → 400 (không phải 500, không gọi model)  → 500 
✗ câu hỏi 600 ký tự → 413  → 200 data: {"type":"start"} data: {"type":"start-step"} data: {"type":"text
✗ messages không phải mảng → 400  → 500 
✓ hợp lệ → 200 text/event-stream, có text-delta
1/4 đạt · số lần gọi model: 2
```

Tiêu chí nghiệm thu:

- [ ] `model: "gpt-9-ultra"` → 400 (không phải 500), không gọi model
- [ ] Câu hỏi 600 ký tự → 413
- [ ] `messages` không phải mảng → 400
- [ ] Request hợp lệ → 200 `text/event-stream` có `text-delta`; cả bài chỉ gọi model đúng 1 lần

Lệnh nghiệm thu:

```bash
npx next build m12/ex1/start > /dev/null && npx tsx m12/ex1/check.ts m12/ex1/start && npx tsc -p .
```

Lời giải tham chiếu chạy ra (output cần đạt):

```console
❯ npx next build m12/ex1/solution > /dev/null && npx tsx m12/ex1/check.ts m12/ex1/solution
✓ model "gpt-9-ultra" → 400 (không phải 500, không gọi model)
✓ câu hỏi 600 ký tự → 413
✓ messages không phải mảng → 400
✓ hợp lệ → 200 text/event-stream, có text-delta
4/4 đạt · số lần gọi model: 1
```

<details><summary>Gợi ý nếu bị đỏ</summary>

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| model lạ → 500 | `models["gpt-9-ultra"]` là `undefined` | Zod: `z.enum(["fast", "smart"])`, sai → 400 |
| messages sai cấu trúc vẫn lọt | Ép kiểu `as Body` không kiểm gì lúc chạy | `safeValidateUIMessages({ messages })` của AI SDK |
| Lỗi "Unexpected end of JSON" | Body rỗng / không phải JSON | `await req.json().catch(() => null)` rồi để Zod báo 400 |

`m12/ex1/start/app/api/chat/route.ts` (diff)

```diff
-// ← CHỈ sửa file này. AI viết: tin hết những gì client gửi lên
-import { convertToModelMessages, streamText, type UIMessage } from "ai";
-import { models, type ModelId } from "../../../../../chat/lib/models";
+// ← CHỈ sửa file này. Mọi thứ từ client đều là input chưa tin được: model, độ dài, số tin
+import { convertToModelMessages, safeValidateUIMessages, streamText } from "ai";
+import { z } from "zod";
+import { models } from "../../../../../chat/lib/models";
 
-type Body = { messages: UIMessage[]; model: ModelId };
+const Body = z.object({ model: z.enum(["fast", "smart"]).default("fast"), messages: z.array(z.unknown()).min(1).max(20) });
+const MAX_CHARS = 500;
 
 export async function POST(req: Request) {
-  const { messages, model } = (await req.json()) as Body;
+  const body = Body.safeParse(await req.json().catch(() => null));
+  if (!body.success) return Response.json({ error: "Body không hợp lệ (model / messages)" }, { status: 400 });
+  const msgs = await safeValidateUIMessages({ messages: body.data.messages });    // đúng cấu trúc UIMessage?
+  if (!msgs.success) return Response.json({ error: "messages sai cấu trúc" }, { status: 400 });
+  const last = msgs.data.at(-1)!.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
+  if (last.length > MAX_CHARS) return Response.json({ error: `Câu hỏi tối đa ${MAX_CHARS} ký tự` }, { status: 413 });
   const result = streamText({
-    model: models[model],
-    messages: await convertToModelMessages(messages),
+    model: models[body.data.model],
+    messages: await convertToModelMessages(msgs.data),
     abortSignal: req.signal,
   });
```

</details>

### 8 · 3 câu hỏi nhanh
1. Phỏng vấn: "Vì sao stream câu trả lời LLM? Dùng SSE hay WebSocket?"

   <details><summary>Đáp án</summary>

   Model sinh từng token trong vài giây; stream cho thấy chữ sau ~100–200ms thay vì chờ hết (bẫy 1), và cho phép dừng giữa chừng. SSE là đủ: luồng 1 chiều server → client trên HTTP thường, qua được proxy/CDN, tự có định dạng sự kiện; câu hỏi mới đi bằng POST riêng. WebSocket khi cần 2 chiều liên tục (giọng nói realtime, cộng tác).

   </details>

2. "Người dùng bấm Dừng: chuyện gì xảy ra từ trình duyệt tới provider?"

   <details><summary>Đáp án</summary>

   `useChat.stop()` huỷ fetch → kết nối HTTP đóng → `req.signal` ở route bị abort → `streamText` (nhờ `abortSignal`) huỷ request tới provider → provider ngừng sinh và ngừng tính tiền → `onEnd` chạy với `isAborted: true`, lưu phần đã có. Thiếu `abortSignal` là đứt mắt xích giữa (bẫy 2).

   </details>

3. Review code AI: `/api/chat` lấy `model` từ body không kiểm, không có `abortSignal`, lưu lịch sử ngay đầu handler (trước khi gọi model), và có thêm 1 component gọi thẳng `api.openai.com` với `NEXT_PUBLIC_OPENAI_KEY` "cho nhanh". Góp ý?

   <details><summary>Đáp án</summary>

   (1) Validate model bằng danh sách cho phép + giới hạn độ dài/số tin (mục 7). (2) `abortSignal: req.signal`. (3) Lưu trong `onEnd` — lưu đầu handler thì mất câu trả lời. (4) Xoá component gọi thẳng provider, thu hồi khoá đã lộ (bẫy 3); mọi lời gọi model đi qua route của bạn để còn kiểm quyền, giới hạn tần suất, ghi log chi phí.

   </details>


---

## Bài 12.2 · Thanh toán Stripe: Checkout + webhook có chữ ký, idempotent

_Nguồn roadmap: [NextAI] Payment integration (Stripe / Polar / Razorpay)_

### 1 · Một câu & nằm ở đâu
Không tự xử lý thẻ. Server tạo **Checkout Session** (kèm `metadata.orderId`) → chuyển khách sang trang của Stripe → khách trả tiền → Stripe **redirect** khách về `success_url` (chỉ để hiển thị) **và** gọi **webhook** về server bạn. Webhook mới là nguồn sự thật: kiểm chữ ký HMAC trên **body thô** (`req.text()`), nhớ `event.id` đã xử lý (Stripe có thể gửi lại nhiều lần), kiểm trạng thái + số tiền, rồi mới giao hàng — đúng 1 lần.

Trình duyệt → **[Route Handler · Action]** → **[Dịch vụ ngoài: LLM · Stripe · Judge0]** → Việc nền: Inngest → **[DB]** → Đẩy về client: stream · SSE

<details><summary>m12/shop/lib/stripe.ts — client Stripe phía server, secret lấy từ env</summary>

`m12/shop/lib/stripe.ts`

```tsx
// Client Stripe phía server. Khoá thật nằm trong env, KHÔNG có tiền tố NEXT_PUBLIC_
import "server-only";
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_sandbox_khong_goi_mang");
// Lấy từ Dashboard → Webhooks (hoặc `stripe listen` in ra khi dev)
export const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_sandbox_demo";
```

</details>

<details><summary>m12/shop/lib/orders.ts — đơn hàng, kho, email, event đã xử lý (thay DB)</summary>

`m12/shop/lib/orders.ts`

```tsx
// Đơn hàng, tồn kho, email đã gửi, event đã xử lý — trong bộ nhớ (thay DB)
import "server-only";

export type Order = { id: number; items: string; amount: number; status: "pending" | "paid" };
type Db = { orders: Order[]; stock: number; emails: string[]; seen: Set<string> };
const g = globalThis as unknown as { shop?: Db };
g.shop ??= {
  orders: [
    { id: 1, items: "2× Latte", amount: 90000, status: "pending" },
    { id: 2, items: "1× Mocha", amount: 50000, status: "pending" },
  ],
  stock: 10, emails: [], seen: new Set(),
};
export const db = g.shop;
export const getOrder = (id: number) => db.orders.find((o) => o.id === id);

// Giao hàng: trừ kho + gửi email — CHỈ được chạy đúng 1 lần cho mỗi đơn
export function fulfil(order: Order) {
  order.status = "paid";
  db.stock -= 1;
  db.emails.push(`Biên nhận đơn #${order.id}`);
  console.log(`[server] giao đơn #${order.id}: kho còn ${db.stock}, đã gửi ${db.emails.length} email`);
}
```

</details>

<details><summary>m12/shop/app/orders/[id]/page.tsx — trang đơn: chỉ ĐỌC trạng thái</summary>

`m12/shop/app/orders/[id]/page.tsx`

```tsx
// Trang đơn hàng: chỉ ĐỌC trạng thái. "Đã thanh toán" chỉ xuất hiện khi webhook đã xác nhận
import { notFound } from "next/navigation";
import { getOrder } from "../../../lib/orders";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const order = getOrder(Number((await params).id));
  if (!order) notFound();
  return <h1>{`Đơn #${order.id} (${order.items}): ${order.status === "paid" ? "Đã thanh toán" : "Đang chờ thanh toán"}`}</h1>;
}
```

</details>

<details><summary>m12/stripe-sim.ts — đóng vai Stripe: payload + header stripe-signature do SDK Stripe ký</summary>

`m12/stripe-sim.ts`

```tsx
// Giả lập Stripe gửi webhook: payload JSON thụt lề 2 dấu cách (đúng như Stripe gửi) + header
// stripe-signature do chính SDK Stripe tạo bằng secret — cùng thuật toán HMAC-SHA256 với Stripe thật
import Stripe from "stripe";

const stripe = new Stripe("sk_test_sandbox_khong_goi_mang");
export const SECRET = "whsec_sandbox_demo";

export function checkoutEvent(id: string, orderId: number, amount: number, type = "checkout.session.completed") {
  const session = { id: `cs_test_${id}`, object: "checkout.session", amount_total: amount, payment_status: "paid", metadata: { orderId: String(orderId) } };
  return JSON.stringify({ id, object: "event", type, data: { object: session } }, null, 2);
}
export const sign = (payload: string, secret = SECRET) => stripe.webhooks.generateTestHeaderString({ payload, secret });

export async function deliver(origin: string, path: string, payload: string, signature = sign(payload)) {
  const res = await fetch(origin + path, { method: "POST", headers: { "stripe-signature": signature, "content-type": "application/json" }, body: payload });
  return `${res.status} ${await res.text()}`;
}
```

</details>

<details><summary>m12/webhook.ts — script ví dụ 2</summary>

`m12/webhook.ts`

```tsx
// Webhook từ đầu tới cuối: hợp lệ, gửi lại, bị sửa, không chữ ký — trạng thái đơn đổi khi nào?
import { serve } from "./serve";
import { checkoutEvent, deliver, sign } from "./stripe-sim";

const srv = await serve("m12/shop", 3211);
const path = "/api/webhooks/stripe";
const page = async () => (await (await fetch(srv.origin + "/orders/1")).text()).match(/<h1>(.*?)<\/h1>/)?.[1];

console.log(`Trang /orders/1 trước webhook:     ${await page()}`);
const evt = checkoutEvent("evt_001", 1, 90000);
console.log(`1. Webhook hợp lệ                  → ${await deliver(srv.origin, path, evt)}`);
console.log(`   Trang /orders/1:                ${await page()}`);
console.log(`2. Stripe gửi lại đúng evt_001     → ${await deliver(srv.origin, path, evt)}`);
const forged = evt.replace('"orderId": "1"', '"orderId": "2"');
console.log(`3. Sửa orderId, giữ chữ ký cũ      → ${await deliver(srv.origin, path, forged, sign(evt))}`);
console.log(`4. Ký bằng secret khác             → ${await deliver(srv.origin, path, checkoutEvent("evt_002", 2, 50000), sign(evt, "whsec_ke_gian"))}`);
console.log("Log server:", srv.serverLines().join(" / "));
await srv.close();
```

</details>

<details><summary>m12/shoptraps.ts — script chạy 3 bẫy</summary>

`m12/shoptraps.ts`

```tsx
// 3 bẫy của bài 12.2: npx tsx m12/shoptraps.ts json|thanks|noidem
import { serve } from "./serve";
import { checkoutEvent, deliver } from "./stripe-sim";

const which = process.argv[2] ?? "json";
const srv = await serve("m12/shop", 3212);
const page = async (id: number) => (await (await fetch(`${srv.origin}/orders/${id}`)).text()).match(/<h1>(.*?)<\/h1>/)?.[1];

if (which === "json") {
  const reply = await deliver(srv.origin, "/api/webhooks/stripe-json", checkoutEvent("evt_101", 1, 90000));
  console.log(`Webhook hợp lệ gửi vào route dùng req.json() → ${reply.split("\n")[0]}`);
} else if (which === "thanks") {
  const res = await fetch(`${srv.origin}/orders/2/thanks?from=stripe`);        // gõ tay URL, không qua Stripe
  console.log(`Mở /orders/2/thanks?from=stripe (chưa trả đồng nào) → ${res.status}`);
  console.log(`Trang /orders/2: ${await page(2)}`);
} else {
  const evt = checkoutEvent("evt_201", 1, 90000);
  for (const n of [1, 2]) console.log(`Lần gửi ${n} của evt_201 → ${await deliver(srv.origin, "/api/webhooks/stripe-noidem", evt)}`);
}
console.log("Log server:", srv.serverLines().join(" / ") || "(không có)");
await srv.close();
```

</details>

### 2 · Concept
| Bước | Ai làm | Ghi chú | Bên C# |
|---|---|---|---|
| Tạo Checkout Session | Server: `stripe.checkout.sessions.create({ line_items, metadata, success_url })` | `idempotencyKey`: bấm 2 lần vẫn 1 session | Stripe.net `SessionService.CreateAsync` |
| Khách trả tiền | Trang của Stripe (không phải app bạn) | Thẻ test `4242 4242 4242 4242` | — |
| `success_url` | Stripe redirect khách về | **Chỉ để hiển thị** — ai cũng gõ tay được (bẫy 2) | — |
| Webhook | Stripe POST `checkout.session.completed` + header `stripe-signature` (HMAC-SHA256) | **Nguồn sự thật** để đánh dấu đã trả | `EventUtility.ConstructEvent` |
| Kiểm chữ ký | `constructEvent(rawBody, header, secret)` | Cần body **thô** — parse rồi stringify lại là hỏng (bẫy 1) | — |
| Idempotent | Lưu `event.id` đã xử lý + chỉ giao đơn đang `pending` + so số tiền | Trả 2xx nhanh; lỗi/timeout → Stripe gửi lại | — |

### 3 · Flow / lifecycle
**Khách bấm Thanh toán → đơn thành "Đã thanh toán" qua những bước nào?**

```mermaid
flowchart LR
  N0["Tạo Session<br/><small>server gọi Stripe</small>"]
  N1["Trang Stripe<br/><small>khách nhập thẻ</small>"]
  N2["Redirect về<br/><small>success_url: chỉ hiển thị</small>"]
  N3["Webhook<br/><small>Stripe POST + chữ ký</small>"]
  N4["Kiểm chữ ký<br/><small>HMAC trên body thô</small>"]
  N5["Giao 1 lần<br/><small>theo event.id</small>"]
  N0 --> N1
  N1 --> N2
  N2 --> N3
  N3 --> N4
  N4 --> N5
```

Đọc sơ đồ: Trái → phải: server tạo Session gắn orderId; khách trả trên trang Stripe; Stripe redirect khách về (trang chỉ đọc trạng thái) và song song POST webhook; route kiểm chữ ký trên body thô, bỏ qua event đã xử lý, kiểm số tiền rồi mới giao hàng.

### 4 · Ví dụ thực tế
**Ví dụ 1.** Server Action tạo Checkout Session cho 1 đơn rồi chuyển khách sang Stripe.

`m12/shop/app/checkout/actions.ts`

```tsx
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getOrder } from "../../lib/orders";
import { stripe } from "../../lib/stripe";

export async function startCheckout(orderId: number) {
  const order = getOrder(orderId);
  if (!order || order.status !== "pending") throw new Error("Đơn không hợp lệ");
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items: [{ quantity: 1, price_data: { currency: "vnd", unit_amount: order.amount, product_data: { name: order.items } } }],
      metadata: { orderId: String(order.id) },               // webhook dùng để biết đơn nào
      success_url: `${origin}/orders/${order.id}?from=stripe`, // chỉ để HIỂN THỊ — không xác nhận gì
      cancel_url: `${origin}/orders/${order.id}`,
    },
    { idempotencyKey: `checkout-order-${order.id}` },        // bấm 2 lần → vẫn 1 session
  );
  redirect(session.url!);                                    // https://checkout.stripe.com/c/pay/cs_test_…
}
```


> ⚠ **Chưa chạy ở sandbox.** Cần `STRIPE_SECRET_KEY` thật và mạng tới `api.stripe.com`. Mong đợi khi chạy thật: `session.url` dạng `https://checkout.stripe.com/c/pay/cs_test_…`, trình duyệt sang trang thanh toán của Stripe; nhập thẻ test `4242 4242 4242 4242` (hạn bất kỳ trong tương lai, CVC bất kỳ); trả xong Stripe redirect về `success_url` và gần như cùng lúc gửi webhook `checkout.session.completed`. Dev local: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` in ra `whsec_…` để đặt vào `STRIPE_WEBHOOK_SECRET`.

VND là tiền tệ không có phần lẻ nên `unit_amount` là số đồng (USD thì tính bằng cent). `metadata.orderId` là sợi dây nối Session với đơn của bạn — webhook đọc lại nó. `idempotencyKey` theo đơn: khách bấm 2 lần (hoặc mạng gửi lại) vẫn chỉ 1 Session. Không bao giờ để client gửi số tiền: server tự tính từ đơn trong DB.

**Ví dụ 2.** Route nhận webhook. Stripe thật không gọi được vào sandbox, nên `m12/stripe-sim.ts` (mục 1) đóng vai Stripe: payload JSON thụt lề như Stripe gửi, header `stripe-signature` tạo bằng chính SDK Stripe — cùng thuật toán HMAC với Stripe thật.

`m12/shop/app/api/webhooks/stripe/route.ts`

```tsx
// POST /api/webhooks/stripe — Stripe gọi vào đây khi thanh toán xong. Đây là nguồn sự thật duy nhất.
import type Stripe from "stripe";
import { db, fulfil, getOrder } from "../../../../lib/orders";
import { stripe, WEBHOOK_SECRET } from "../../../../lib/stripe";

export async function POST(req: Request) {
  const raw = await req.text();                                  // body THÔ, đúng từng byte Stripe đã ký
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, req.headers.get("stripe-signature") ?? "", WEBHOOK_SECRET);
  } catch (e) {
    return new Response(`Chữ ký không hợp lệ: ${(e as Error).message.split(".")[0]}`, { status: 400 });
  }
  if (db.seen.has(event.id)) return Response.json({ ok: true, duplicate: true }); // Stripe gửi lại → bỏ qua
  db.seen.add(event.id);

  if (event.type === "checkout.session.completed") {
    const s = event.data.object;
    const order = getOrder(Number(s.metadata?.orderId));
    if (order && order.status === "pending" && s.amount_total === order.amount) fulfil(order);
  }
  return Response.json({ ok: true });                             // 2xx nhanh, nếu không Stripe sẽ gửi lại
}
```

```console
❯ npx next build m12/shop > /dev/null && npx tsx m12/webhook.ts
Trang /orders/1 trước webhook:     Đơn #1 (2× Latte): Đang chờ thanh toán
1. Webhook hợp lệ                  → 200 {"ok":true}
   Trang /orders/1:                Đơn #1 (2× Latte): Đã thanh toán
2. Stripe gửi lại đúng evt_001     → 200 {"ok":true,"duplicate":true}
3. Sửa orderId, giữ chữ ký cũ      → 400 Chữ ký không hợp lệ: No signatures found matching the expected signature for payload
4. Ký bằng secret khác             → 400 Chữ ký không hợp lệ: No signatures found matching the expected signature for payload
Log server: [server] giao đơn #1: kho còn 9, đã gửi 1 email
```

Trước webhook: "Đang chờ thanh toán" — dù khách có thể đã ở trang success. Webhook hợp lệ → giao hàng (kho 9, 1 email). Stripe gửi lại cùng `evt_001` → `duplicate`, không giao lần 2. Ai đó sửa `orderId` trong body mà giữ chữ ký cũ → 400: chữ ký phủ **từng byte** của body. Ký bằng secret khác → 400. Trả 2xx nhanh: xử lý nặng (email, PDF) đẩy sang việc nền (bài 12.3).

### 5 · Thử thật / bẫy
**Bẫy 1.** **Đọc body bằng `req.json()` rồi `JSON.stringify` lại để kiểm chữ ký.**

`m12/shop/app/api/webhooks/stripe-json/route.ts`

```tsx
// ❌ Đọc body bằng req.json() rồi stringify lại để kiểm chữ ký — "body nào chả là body"
import { stripe, WEBHOOK_SECRET } from "../../../../lib/stripe";

export async function POST(req: Request) {
  const body: unknown = await req.json();
  try {
    const event = stripe.webhooks.constructEvent(JSON.stringify(body), req.headers.get("stripe-signature") ?? "", WEBHOOK_SECRET);
    return Response.json({ ok: true, type: event.type });
  } catch (e) {
    return new Response((e as Error).message, { status: 400 });
  }
}
```

```console
❯ npx tsx m12/shoptraps.ts json
Webhook hợp lệ gửi vào route dùng req.json() → 400 No signatures found matching the expected signature for payload. Are you passing the raw request body you received from Stripe? 
Log server: (không có)
```

Stripe gửi JSON có thụt lề và xuống dòng; stringify lại thành 1 dòng → khác byte → HMAC khác → webhook **hợp lệ** cũng bị từ chối. Stripe nhận 400, gửi lại nhiều lần, rồi tắt endpoint. Luôn `await req.text()` trước, kiểm chữ ký trên chuỗi đó, sau đó dùng `event` đã parse sẵn.

**Bẫy 2.** **Đánh dấu "đã trả" ở trang `success_url`** — "Stripe redirect về đây thì chắc trả rồi".

`m12/shop/app/orders/[id]/thanks/page.tsx`

```tsx
// ❌ Trang success_url: "Stripe đã redirect về đây thì chắc đã trả tiền rồi" → đánh dấu đã thanh toán
import { fulfil, getOrder } from "../../../../lib/orders";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string }> };

export default async function ThanksPage({ params, searchParams }: Props) {
  const order = getOrder(Number((await params).id));
  if (order && order.status === "pending" && (await searchParams).from === "stripe") fulfil(order);
  return <h1>Cảm ơn bạn đã thanh toán!</h1>;
}
```

```console
❯ npx tsx m12/shoptraps.ts thanks
Mở /orders/2/thanks?from=stripe (chưa trả đồng nào) → 200
Trang /orders/2: Đơn #2 (1× Mocha): Đã thanh toán
Log server: [server] giao đơn #2: kho còn 9, đã gửi 1 email
```

URL là thứ ai cũng gõ được: mở `/orders/2/thanks?from=stripe` là có đơn "Đã thanh toán", trừ kho, gửi email — không đồng nào vào tài khoản. Ngược lại, khách trả xong nhưng đóng tab trước khi redirect thì đơn mãi "chưa trả". Trang success chỉ **đọc** trạng thái (có thể hiện "đang xác nhận…"); ghi trạng thái là việc của webhook.

**Bẫy 3.** **Webhook không idempotent**: kiểm chữ ký đúng nhưng không nhớ event nào đã xử lý, không xét trạng thái đơn.

`m12/shop/app/api/webhooks/stripe-noidem/route.ts`

```tsx
// ❌ Kiểm chữ ký đúng, nhưng KHÔNG nhớ event nào đã xử lý, KHÔNG xét trạng thái đơn
import type Stripe from "stripe";
import { fulfil, getOrder } from "../../../../lib/orders";
import { stripe, WEBHOOK_SECRET } from "../../../../lib/stripe";

export async function POST(req: Request) {
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, req.headers.get("stripe-signature") ?? "", WEBHOOK_SECRET);
  } catch {
    return new Response("bad signature", { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const order = getOrder(Number(event.data.object.metadata?.orderId));
    if (order) fulfil(order);
  }
  return Response.json({ ok: true });
}
```

```console
❯ npx tsx m12/shoptraps.ts noidem
Lần gửi 1 của evt_201 → 200 {"ok":true}
Lần gửi 2 của evt_201 → 200 {"ok":true}
Log server: [server] giao đơn #1: kho còn 9, đã gửi 1 email / [server] giao đơn #1: kho còn 8, đã gửi 2 email
```

Stripe đảm bảo "ít nhất 1 lần", không phải "đúng 1 lần": khi server bạn chậm/lỗi/timeout, cùng event được gửi lại. Không chặn thì mỗi lần gửi lại là 1 lần trừ kho, 1 email, 1 lần cộng điểm. Chặn bằng 2 lớp: `event.id` đã xử lý (bảng `processed_events` có unique) và trạng thái nghiệp vụ (`pending` → `paid` chỉ 1 lần).

### 6 · Tóm tắt bằng hình
**(a) Cây thư mục sau bài này**

```text
m12/shop/  [MỚI]  ← app Next của bài
├─ lib/stripe.ts · orders.ts  [MỚI]  ← client Stripe · đơn, kho, event đã xử lý
├─ app/checkout/actions.ts  [MỚI]  ← tạo Checkout Session (cần khoá thật)
├─ app/api/webhooks/stripe/route.ts  [MỚI]  ← body thô → chữ ký → idempotent → giao
├─ app/orders/[id]/page.tsx  [MỚI]  ← chỉ đọc trạng thái
└─ app/api/webhooks/stripe-json · stripe-noidem · orders/[id]/thanks  [MỚI]  ← 3 bẫy
m12/stripe-sim.ts · webhook.ts · shoptraps.ts  [MỚI]  ← đóng vai Stripe + script
m12/ex2/start · ex2/solution · ex2/check.ts  [MỚI]  ← bài Làm ngay
```

**(b) Đọc trong 10 giây**

**Webhook thanh toán chuẩn làm gì, theo thứ tự nào?**

```mermaid
flowchart LR
  N0["req.text()<br/><small>body thô</small>"]
  N1["constructEvent<br/><small>chữ ký HMAC</small>"]
  N2["event.id mới?<br/><small>không → bỏ qua</small>"]
  N3["Đơn + số tiền<br/><small>pending, khớp</small>"]
  N4["Giao + 2xx<br/><small>việc nặng → nền</small>"]
  N0 --> N1
  N1 --> N2
  N2 --> N3
  N3 --> N4
```

Đọc sơ đồ: Body thô → kiểm chữ ký → bỏ qua event đã thấy → kiểm đơn + số tiền → giao hàng → trả 2xx nhanh.

### 7 · Làm ngay (≤ 10 phút)
**Mục tiêu:** `m12/ex2/start/app/api/webhooks/stripe/route.ts`: chữ ký đã kiểm đúng, nhưng Stripe gửi lại là giao lại, và số tiền không khớp vẫn giao. Chỉ sửa file này.

File khởi đầu:

`m12/ex2/start/app/api/webhooks/stripe/route.ts`

```tsx
// ← CHỈ sửa file này. Kiểm chữ ký đã đúng, nhưng còn thiếu gì?
import type Stripe from "stripe";
import { fulfil, getOrder } from "../../../../../../shop/lib/orders";
import { stripe, WEBHOOK_SECRET } from "../../../../../../shop/lib/stripe";

export async function POST(req: Request) {
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, req.headers.get("stripe-signature") ?? "", WEBHOOK_SECRET);
  } catch {
    return new Response("Chữ ký không hợp lệ", { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const order = getOrder(Number(event.data.object.metadata?.orderId));
    if (order) fulfil(order);
  }
  return Response.json({ ok: true });
}
```

Chạy file khởi đầu (đang đỏ):

```console
❯ npx next build m12/ex2/start > /dev/null && npx tsx m12/ex2/check.ts m12/ex2/start
✗ evt_301 (đơn #1) gửi 3 lần → kho 9, 1 email  → kho 7, 3 email
✗ evt_302 trả 1000đ cho đơn #2 (50000đ) → #2 vẫn pending  → #1:paid #2:paid
✓ payment_intent.created → 200, không đổi gì
✓ chữ ký sai → 400
2/4 đạt
```

Tiêu chí nghiệm thu:

- [ ] Cùng `evt_301` gửi 3 lần → kho 9, đúng 1 email
- [ ] Event trả 1000đ cho đơn #2 (50000đ) → đơn #2 vẫn `pending`
- [ ] `payment_intent.created` → 200, không đổi gì
- [ ] Chữ ký sai → 400

Lệnh nghiệm thu:

```bash
npx next build m12/ex2/start > /dev/null && npx tsx m12/ex2/check.ts m12/ex2/start && npx tsc -p .
```

Lời giải tham chiếu chạy ra (output cần đạt):

```console
❯ npx next build m12/ex2/solution > /dev/null && npx tsx m12/ex2/check.ts m12/ex2/solution
✓ evt_301 (đơn #1) gửi 3 lần → kho 9, 1 email
✓ evt_302 trả 1000đ cho đơn #2 (50000đ) → #2 vẫn pending
✓ payment_intent.created → 200, không đổi gì
✓ chữ ký sai → 400
4/4 đạt
```

<details><summary>Gợi ý nếu bị đỏ</summary>

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| kho 7, 3 email | Không nhớ `event.id` | `if (db.seen.has(event.id)) return …`, rồi `db.seen.add(event.id)` |
| #2 thành paid với 1000đ | Không so `amount_total` với `order.amount` | Khác → không giao, ghi log cảnh báo, vẫn trả 200 |
| Trả 400/500 khi số tiền lệch | Stripe sẽ gửi lại mãi | Lỗi nghiệp vụ: trả 2xx + ghi log để người xử lý; 4xx chỉ cho chữ ký sai |

`m12/ex2/start/app/api/webhooks/stripe/route.ts` (diff)

```diff
 // ← CHỈ sửa file này. Kiểm chữ ký đã đúng, nhưng còn thiếu gì?
 import type Stripe from "stripe";
-import { fulfil, getOrder } from "../../../../../../shop/lib/orders";
+import { db, fulfil, getOrder } from "../../../../../../shop/lib/orders";
 import { stripe, WEBHOOK_SECRET } from "../../../../../../shop/lib/stripe";
 
     return new Response("Chữ ký không hợp lệ", { status: 400 });
   }
+  if (db.seen.has(event.id)) return Response.json({ ok: true, duplicate: true });  // 1. idempotent theo event.id
+  db.seen.add(event.id);
   if (event.type === "checkout.session.completed") {
-    const order = getOrder(Number(event.data.object.metadata?.orderId));
-    if (order) fulfil(order);
+    const s = event.data.object;
+    const order = getOrder(Number(s.metadata?.orderId));
+    if (!order || order.status !== "pending") return Response.json({ ok: true });     // 2. đơn đã xử lý rồi
+    if (s.amount_total !== order.amount) {                                            // 3. số tiền phải khớp
+      console.log(`[server] CẢNH BÁO: đơn #${order.id} cần ${order.amount}, Stripe báo ${s.amount_total}`);
+      return Response.json({ ok: true });
+    }
+    fulfil(order);
   }
   return Response.json({ ok: true });
```

</details>

### 8 · 3 câu hỏi nhanh
1. Phỏng vấn: "Vì sao không cập nhật đơn ngay khi Stripe redirect về `success_url`?"

   <details><summary>Đáp án</summary>

   Redirect đi qua trình duyệt của khách: gõ tay được (bẫy 2), có thể không bao giờ xảy ra (đóng tab, mất mạng), và không mang bằng chứng nào. Webhook là server-to-server, có chữ ký HMAC bằng secret chỉ bạn và Stripe biết. Trang success chỉ đọc trạng thái, có thể hiện "đang xác nhận" và tự làm mới vài giây.

   </details>

2. "Webhook trả 500 hoặc timeout thì sao?"

   <details><summary>Đáp án</summary>

   Stripe coi là chưa giao được và gửi lại với khoảng chờ tăng dần, kéo dài tới khoảng 3 ngày ở chế độ live; endpoint lỗi kéo dài có thể bị tắt. Hệ quả: handler phải idempotent (bẫy 3) và trả 2xx nhanh — việc chậm (email, PDF, CRM) đẩy sang hàng đợi/việc nền.

   </details>

3. Review code AI: webhook dùng `req.json()`, không lưu `event.id`, gửi email + tạo PDF hoá đơn + gọi CRM tuần tự (~12 giây) rồi mới trả 200. Góp ý?

   <details><summary>Đáp án</summary>

   (1) `req.text()` + `constructEvent` trên body thô (bẫy 1). (2) Idempotent theo `event.id` + trạng thái đơn (bẫy 3). (3) 12 giây dễ timeout → Stripe gửi lại → càng nhiều bản trùng. Đánh dấu đơn đã trả rồi `inngest.send({ name: "shop/order.paid" })` (bài 12.3), trả 200 trong vài chục ms; email/PDF/CRM là các step riêng, retry riêng.

   </details>


---

## Bài 12.3 · Việc nền với Inngest: step bền, sleep dài, chạy song song

_Nguồn roadmap: [NextAI] Background jobs (Inngest — AI agent jobs, long-running task)_

### 1 · Một câu & nằm ở đâu
Request phải trả lời nhanh; việc chậm/dài/hay lỗi (email, PDF, gọi AI, "nhắc sau 1 ngày") đẩy ra ngoài bằng **event**: `inngest.send({ name, data })`. Inngest gọi lại app qua `/api/inngest` để chạy **function** của bạn. Bên trong, mỗi `step.run(id, fn)` là 1 checkpoint **bền**: chạy xong thì kết quả được lưu; Inngest gọi lại **cả thân hàm từ đầu** cho bước kế tiếp, step đã xong trả ngay kết quả cũ (memoize). Hệ quả: mọi tác dụng phụ và mọi thứ ngẫu nhiên phải nằm **trong** step. `step.sleep("1d")` không giữ process nào cả.

Trình duyệt → **[Route Handler · Action]** → Dịch vụ ngoài: LLM · Stripe · Judge0 → **[Việc nền: Inngest]** → DB → Đẩy về client: stream · SSE

<details><summary>m12/jobs/client.ts — 1 client Inngest cho cả app</summary>

`m12/jobs/client.ts`

```tsx
// 1 client Inngest cho cả app (≈ 1 IBackgroundJobClient của Hangfire)
import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "coffee-shop" });
```

</details>

<details><summary>m12/jobs/effects.ts — tác dụng phụ giả (email, SMS…) có đếm số lần chạy</summary>

`m12/jobs/effects.ts`

```tsx
// Tác dụng phụ "thật" (gửi email, gọi API…) — đếm số lần chạy để thấy cái gì bị lặp
export const sent = { receipts: 0, emails: 0, reviews: 0, sms: 0 };
export const outbox: string[] = [];                      // nội dung các email đã gửi
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function makeReceipt(orderId: number) {
  sent.receipts++;
  await sleep(20);
  return `BN-${orderId}-${String(sent.receipts).padStart(3, "0")}`;
}
export async function sendEmail(to: string, text: string) {
  sent.emails++;
  outbox.push(text);
  console.log(`  ✉ email #${sent.emails} → ${to}: ${text}`);
}
export async function askReview(orderId: number) {
  sent.reviews++;
  console.log(`  ★ xin đánh giá đơn #${orderId}`);
}
export async function sendSms(text: string) {
  sent.sms++;
  console.log(`  ☎ SMS #${sent.sms}: ${text}`);
}
```

</details>

<details><summary>m12/jobs/run-fulfil.ts — chạy hàm bằng InngestTestEngine (không cần server)</summary>

`m12/jobs/run-fulfil.ts`

```tsx
// Chạy fulfilOrder bằng test engine của Inngest (cùng engine thực thi step như Inngest thật, không cần server)
import { InngestTestEngine } from "@inngest/test";
import { sent } from "./effects";
import { fulfilOrder } from "./fulfil";

const t = new InngestTestEngine({
  function: fulfilOrder,
  events: [{ name: "shop/order.paid", data: { orderId: 7, email: "an@cafe.vn" } }],
  steps: [{ id: "cho-1-ngay", handler() {} }],              // tua nhanh step.sleep
});
const { result } = await t.execute();
console.log("Kết quả:", JSON.stringify(result));
console.log("Số lần thật sự chạy:", JSON.stringify(sent));
```

</details>

<details><summary>m12/jobs/run-notify.ts — script ví dụ 2</summary>

`m12/jobs/run-notify.ts`

```tsx
// So thời gian: 3 step song song (Promise.all) — mỗi step tốn 300ms
import { InngestTestEngine } from "@inngest/test";
import { notifyNewOrder } from "./notify";

const t0 = Date.now();
const { result } = await new InngestTestEngine({ function: notifyNewOrder, events: [{ name: "shop/order.paid", data: {} }] }).execute();
console.log(JSON.stringify(result));
console.log(`Tổng thời gian hàm: ${Date.now() - t0}ms`);
```

</details>

<details><summary>m12/inngest-route.ts — script ví dụ 3</summary>

`m12/inngest-route.ts`

```tsx
// Inngest gọi vào app qua GET/PUT/POST /api/inngest. Deploy thiếu cấu hình thì sao?
import { serve } from "./serve";

const mode = process.env.INNGEST_DEV ? "INNGEST_DEV=1 (máy dev)" : "production, chưa đặt INNGEST_SIGNING_KEY";
const srv = await serve("m12/shop", 3232);
const res = await fetch(srv.origin + "/api/inngest");
console.log(`[${mode}] GET /api/inngest → ${res.status} ${await res.text()}`);
const why = srv.logs.find((l) => l.includes("signing key"));
if (why) console.log(`Log server: ${why}`);
await srv.close();
```

</details>

### 2 · Concept
| Khái niệm | Inngest | Ghi chú | Bên C# |
|---|---|---|---|
| Function | `inngest.createFunction({ id, triggers, retries }, handler)` | Kích hoạt bởi event hoặc cron | Hangfire job, Azure Durable Function |
| Gửi event | `await inngest.send({ name: "shop/order.paid", data })` | Trả về ngay, việc chạy sau | `BackgroundJob.Enqueue(...)` |
| `step.run(id, fn)` | Checkpoint bền: xong → lưu kết quả; retry **riêng** từng step | Kết quả phải serialize được (JSON) | Activity function |
| Replay | Mỗi bước, Inngest gọi lại cả thân hàm; step đã xong không chạy lại | Code ngoài step chạy lại mỗi lần (bẫy) | Orchestrator replay của Durable Functions |
| `step.sleep("1d")` | Hàm kết thúc, 1 ngày sau Inngest gọi lại | Không vướng timeout serverless | `context.CreateTimer` |
| `serve()` ở `/api/inngest` | Inngest gọi **vào** app bằng HTTP | Production cần `INNGEST_SIGNING_KEY` | — |

### 3 · Flow / lifecycle
**Webhook báo đã trả tiền → email ngay, xin đánh giá sau 1 ngày: chạy thế nào?**

```mermaid
flowchart LR
  N0["inngest.send<br/><small>event order.paid</small>"]
  N1["Inngest<br/><small>gọi /api/inngest</small>"]
  N2["Lần gọi 1<br/><small>chạy step 1, lưu</small>"]
  N3["Lần gọi 2…<br/><small>step cũ: kết quả lưu</small>"]
  N4["step.sleep<br/><small>hàm dừng 1 ngày</small>"]
  N5["Gọi lại<br/><small>xin đánh giá</small>"]
  N0 --> N1
  N1 --> N2
  N2 --> N3
  N3 --> N4
  N4 --> N5
```

Đọc sơ đồ: Trái → phải: webhook gửi event rồi trả 200 ngay; Inngest gọi `/api/inngest` nhiều lần — mỗi lần chạy thêm đúng 1 step mới, các step cũ trả kết quả đã lưu; tới `step.sleep` thì hàm kết thúc hẳn, 1 ngày sau Inngest gọi lại để chạy step cuối.

### 4 · Ví dụ thực tế
**Ví dụ 1.** Hàm giao đơn: tạo biên nhận, gửi email, chờ 1 ngày, xin đánh giá. Chạy bằng `InngestTestEngine` (mục 1) — engine thực thi step chính thức của Inngest, tua nhanh `step.sleep`.

`m12/jobs/fulfil.ts`

```tsx
// Việc nền sau khi đơn đã thanh toán. Mỗi step.run là 1 checkpoint bền: chạy xong → kết quả được lưu,
// lần gọi lại sau KHÔNG chạy lại step đó mà nhận ngay kết quả cũ (memoize)
import { inngest } from "./client";
import { askReview, makeReceipt, sendEmail } from "./effects";

export const fulfilOrder = inngest.createFunction(
  { id: "fulfil-order", retries: 4, triggers: [{ event: "shop/order.paid" }] },
  async ({ event, step }) => {
    const orderId = Number(event.data.orderId);
    console.log(`thân hàm chạy (đơn #${orderId})`);
    const receipt = await step.run("tao-bien-nhan", () => makeReceipt(orderId));
    await step.run("gui-email", () => sendEmail(String(event.data.email), `Biên nhận ${receipt}`));
    await step.sleep("cho-1-ngay", "1d");                    // không giữ process: hàm kết thúc, 1 ngày sau Inngest gọi lại
    await step.run("xin-danh-gia", () => askReview(orderId));
    return { receipt };
  },
);
```

```console
❯ npx tsx m12/jobs/run-fulfil.ts
thân hàm chạy (đơn #7)
thân hàm chạy (đơn #7)
  ✉ email #1 → an@cafe.vn: Biên nhận BN-7-001
thân hàm chạy (đơn #7)
  ★ xin đánh giá đơn #7
thân hàm chạy (đơn #7)
Kết quả: {"receipt":"BN-7-001"}
Số lần thật sự chạy: {"receipts":1,"emails":1,"reviews":1,"sms":0}
```

"thân hàm chạy" in **4 lần** — mỗi lần Inngest gọi lại để chạy thêm 1 step — nhưng biên nhận, email, đánh giá mỗi thứ chỉ chạy **1 lần**: step đã xong được trả lại từ bộ nhớ, không chạy lại. Biên nhận `BN-7-001` tạo ở lần 1 vẫn y nguyên ở lần 4. Nếu step "gui-email" lỗi, Inngest retry riêng step đó (tối đa `retries: 4`), không tạo lại biên nhận.

**Ví dụ 2.** 3 việc độc lập (email khách, SMS quầy bar, cập nhật CRM), mỗi việc 300ms. Bọc `Promise.all` quanh các `step.run`.

`m12/jobs/notify.ts`

```tsx
// 3 thông báo độc lập → chạy song song bằng Promise.all; mỗi cái vẫn là 1 step riêng (retry riêng)
import { inngest } from "./client";

const slow = async (what: string, ms: number) => {
  const t0 = Date.now();
  await new Promise((r) => setTimeout(r, ms));
  return `${what} xong sau ${Date.now() - t0}ms`;
};

export const notifyNewOrder = inngest.createFunction(
  { id: "bao-don-moi", triggers: [{ event: "shop/order.paid" }] },
  async ({ step }) => {
    const all = await Promise.all([
      step.run("email-khach", () => slow("email", 300)),
      step.run("sms-quay-bar", () => slow("sms", 300)),
      step.run("cap-nhat-crm", () => slow("crm", 300)),
    ]);
    return all;
  },
);
```

```console
❯ npx tsx m12/jobs/run-notify.ts
["email xong sau 300ms","sms xong sau 320ms","crm xong sau 333ms"]
Tổng thời gian hàm: 434ms
```

3 step chạy song song: tổng ~0,4 giây thay vì 0,9 giây tuần tự. Mỗi việc vẫn là 1 step riêng: SMS lỗi thì chỉ SMS được thử lại, email đã gửi không gửi lần 2. ≈ `Task.WhenAll` nhưng mỗi task bền và retry độc lập.

**Ví dụ 3.** Gắn vào Next: 1 route `/api/inngest` (Inngest gọi vào đây). Thử gọi nó như Inngest sẽ gọi — trên server production chưa cấu hình, rồi ở chế độ dev.

`m12/shop/app/api/inngest/route.ts`

```tsx
// /api/inngest — Inngest (Cloud hoặc Dev Server) gọi VÀO đây để chạy từng step của hàm
import { serve } from "inngest/next";
import { inngest } from "../../../../jobs/client";
import { fulfilOrder } from "../../../../jobs/fulfil";

export const { GET, POST, PUT } = serve({ client: inngest, functions: [fulfilOrder] });
```

```console
❯ npx tsx m12/inngest-route.ts
[production, chưa đặt INNGEST_SIGNING_KEY] GET /api/inngest → 500 {"code":"internal_server_error"}
Log server: In cloud mode but no signing key found. For local dev, set the INNGEST_DEV=1 env var. For production, set the INNGEST_SIGNING_KEY env var

❯ INNGEST_DEV=1 npx tsx m12/inngest-route.ts
[INNGEST_DEV=1 (máy dev)] GET /api/inngest → 200 {"extra":{"native_crypto":true},"has_event_key":false,"has_signing_key":false,"function_count":1,"mode":"dev","schema_version":"2024-05-24"}
```

> ⚠ **Chưa chạy ở sandbox.** Gửi event thật (`inngest.send`) cần Inngest Dev Server (`npx inngest-cli@latest dev`, tải binary) hoặc Inngest Cloud + `INNGEST_EVENT_KEY`. Mong đợi: webhook gọi `await inngest.send({ name: "shop/order.paid", data: { orderId, email } })` trả về sau vài chục ms kèm id event; giao diện Dev Server (`localhost:8288`) hiện 1 lần chạy `fulfil-order` với 4 step, step `cho-1-ngay` ở trạng thái đang ngủ.

Deploy thiếu `INNGEST_SIGNING_KEY`: 500 và log nói rõ cách sửa — Inngest chỉ chấp nhận request có chữ ký (giống webhook Stripe, theo chiều ngược lại). Với `INNGEST_DEV=1`: endpoint tự mô tả (1 function, chế độ dev). Webhook ở bài 12.2 nên đổi `fulfil(order)` thành `inngest.send(...)` để trả 200 ngay.

### 5 · Thử thật / bẫy
**Bẫy 1.** **Gửi email ở thân hàm, ngoài `step.run`** — "chỉ 1 dòng, bọc step làm gì".

`m12/jobs/traps/outside.ts`

```tsx
// ❌ Gửi email ở THÂN hàm, ngoài step.run — "chỉ là 1 dòng, bọc step làm gì"
import { inngest } from "../client";
import { askReview, makeReceipt, sendEmail } from "../effects";

export const fulfilBad = inngest.createFunction(
  { id: "fulfil-bad", triggers: [{ event: "shop/order.paid" }] },
  async ({ event, step }) => {
    const orderId = Number(event.data.orderId);
    await sendEmail(String(event.data.email), `Cảm ơn bạn đã đặt đơn #${orderId}`); // ← ngoài step
    const receipt = await step.run("tao-bien-nhan", () => makeReceipt(orderId));
    await step.run("xin-danh-gia", () => askReview(orderId));
    return { receipt };
  },
);
```

```console
❯ npx tsx m12/jobs/traps/run.ts outside
  ✉ email #1 → an@cafe.vn: Cảm ơn bạn đã đặt đơn #7
  ✉ email #2 → an@cafe.vn: Cảm ơn bạn đã đặt đơn #7
  ★ xin đánh giá đơn #7
  ✉ email #3 → an@cafe.vn: Cảm ơn bạn đã đặt đơn #7
Kết quả: {"receipt":"BN-7-001"} · số lần thật sự chạy: {"receipts":1,"emails":3,"reviews":1,"sms":0}
```

Hàm có 2 step nên thân hàm chạy 3 lần → khách nhận **3 email** "Cảm ơn", trong khi biên nhận và lời xin đánh giá (trong step) chỉ 1 lần. Quy tắc: thân hàm chỉ để **điều phối**; mọi thứ chạm thế giới bên ngoài (email, API, DB) nằm trong `step.run`.

**Bẫy 2.** **Sinh giá trị ngẫu nhiên ở thân hàm** rồi dùng trong nhiều step.

`m12/jobs/traps/random.ts`

```tsx
// ❌ Sinh mã giảm giá bằng Math.random() ở thân hàm rồi dùng trong nhiều step
import { inngest } from "../client";
import { sendEmail, sendSms } from "../effects";

export const promoBad = inngest.createFunction(
  { id: "promo-bad", triggers: [{ event: "shop/customer.created" }] },
  async ({ step }) => {
    const code = `KM-${Math.floor(Math.random() * 9000 + 1000)}`;          // ← mỗi lần thân hàm chạy lại: mã mới
    await step.run("email-ma", () => sendEmail("an@cafe.vn", `Mã của bạn: ${code}`));
    await step.run("sms-ma", () => sendSms(`Nhắc: mã ${code} hết hạn sau 3 ngày`));
    return { codeLuuVaoDb: code };
  },
);
```

```console
❯ npx tsx m12/jobs/traps/run.ts random
  ✉ email #1 → an@cafe.vn: Mã của bạn: KM-3269
  ☎ SMS #1: Nhắc: mã KM-9061 hết hạn sau 3 ngày
Kết quả hàm: {"codeLuuVaoDb":"KM-9987"}
```

Mỗi lần thân hàm chạy lại, `Math.random()` ra mã mới: email gửi 1 mã, SMS gửi mã khác, mã lưu DB lại là mã thứ ba. Mọi thứ không tất định (`Math.random`, `Date.now`, `crypto.randomUUID`, gọi API) phải bọc trong `step.run` để được memoize: `const code = await step.run("tao-ma", () => …)`.

### 6 · Tóm tắt bằng hình
**(a) Cây thư mục sau bài này**

```text
m12/jobs/  [MỚI]  ← việc nền dùng chung
├─ client.ts · effects.ts  [MỚI]  ← client Inngest · tác dụng phụ có đếm
├─ fulfil.ts · run-fulfil.ts  [MỚI]  ← step bền + sleep · chạy bằng test engine
├─ notify.ts · run-notify.ts  [MỚI]  ← step song song
└─ traps/outside.ts · random.ts · run.ts  [MỚI]  ← 2 bẫy
m12/shop/app/api/inngest/route.ts  [MỚI]  ← serve(): Inngest gọi vào app
m12/inngest-route.ts  [MỚI]  ← script ví dụ 3
m12/ex3/start · ex3/solution · ex3/check.ts  [MỚI]  ← bài Làm ngay
```

**(b) Đọc trong 10 giây**

**Dòng code này đặt ở đâu trong 1 Inngest function?**

```mermaid
flowchart LR
  N0["Dòng code<br/><small>trong function</small>"]
  N1["Loại gì?"]
  N0 --> N1
  O0["Email, API, random<br/><small>step.run(id, fn)</small>"]
  N1 --> O0
  O1["Chờ phút / ngày<br/><small>step.sleep</small>"]
  N1 --> O1
  O2["if, ghép dữ liệu<br/><small>thân hàm</small>"]
  N1 --> O2
```

Đọc sơ đồ: Chạm bên ngoài hoặc không tất định → trong `step.run`. Chờ lâu → `step.sleep`. Độc lập nhau → `Promise.all` các step. Còn lại (if/else, ghép dữ liệu) để ở thân hàm.

### 7 · Làm ngay (≤ 10 phút)
**Mục tiêu:** `m12/ex3/start/welcome.ts`: chào khách mới → tạo mã giảm giá → 3 ngày sau nhắc mã sắp hết hạn. Khách đang nhận 3 email chào, và mã trong email nhắc khác mã đã lưu. Chỉ sửa file này.

File khởi đầu:

`m12/ex3/start/welcome.ts`

```tsx
// ← CHỈ sửa file này
import { inngest } from "../../jobs/client";
import { sendEmail } from "../../jobs/effects";
import { saveCoupon } from "./coupons";

export const welcome = inngest.createFunction(
  { id: "chao-khach-moi", triggers: [{ event: "shop/customer.created" }] },
  async ({ event, step }) => {
    const email = String(event.data.email);
    await sendEmail(email, "Chào mừng bạn tới Coffee Shop!");
    const code = `KM-${Math.floor(Math.random() * 9000 + 1000)}`;
    await step.run("luu-ma", () => saveCoupon(email, code));
    await step.sleep("cho-3-ngay", "3d");
    await step.run("nhac-ma", () => sendEmail(email, `Mã ${code} sắp hết hạn`));
    return { code };
  },
);
```

Chạy file khởi đầu (đang đỏ):

```console
❯ npx tsx m12/ex3/check.ts start
  ✉ email #1 → an@cafe.vn: Chào mừng bạn tới Coffee Shop!
  ✉ email #2 → an@cafe.vn: Chào mừng bạn tới Coffee Shop!
  ✉ email #3 → an@cafe.vn: Mã KM-4533 sắp hết hạn
  ✉ email #4 → an@cafe.vn: Chào mừng bạn tới Coffee Shop!
✗ Email chào mừng gửi đúng 1 lần  → 3 lần
✗ Mã trong DB = mã trong email nhắc = mã hàm trả về  → DB KM-4694, email "Mã KM-4533 sắp hết hạn", trả về KM-9088
✗ Tổng cộng đúng 2 email (chào + nhắc)  → 4 email
✓ Vẫn chờ 3 ngày bằng step.sleep("cho-3-ngay", "3d")
1/4 đạt
```

Tiêu chí nghiệm thu:

- [ ] Email chào mừng gửi đúng 1 lần
- [ ] Mã trong DB = mã trong email nhắc = mã hàm trả về
- [ ] Tổng cộng đúng 2 email (chào + nhắc), vẫn có `step.sleep("cho-3-ngay", "3d")`
- [ ] `npx tsc -p .` không lỗi

Lệnh nghiệm thu:

```bash
npx tsx m12/ex3/check.ts start && npx tsc -p .
```

Lời giải tham chiếu chạy ra (output cần đạt):

```console
❯ npx tsx m12/ex3/check.ts solution
  ✉ email #1 → an@cafe.vn: Chào mừng bạn tới Coffee Shop!
  ✉ email #2 → an@cafe.vn: Mã KM-6231 sắp hết hạn
✓ Email chào mừng gửi đúng 1 lần
✓ Mã trong DB = mã trong email nhắc = mã hàm trả về
✓ Tổng cộng đúng 2 email (chào + nhắc)
✓ Vẫn chờ 3 ngày bằng step.sleep("cho-3-ngay", "3d")
4/4 đạt
```

<details><summary>Gợi ý nếu bị đỏ</summary>

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| 3 email chào | `sendEmail` ở thân hàm chạy lại mỗi lần replay | `await step.run("email-chao", () => sendEmail(…))` |
| Mã lệch nhau | `Math.random()` ở thân hàm | `const code = await step.run("tao-ma", () => …)` |
| Lỗi "duplicate step"/kết quả lạ khi đổi id | 2 step trùng id hoặc đổi thứ tự step đã chạy | Mỗi step 1 id riêng, mô tả việc nó làm |

`m12/ex3/start/welcome.ts` (diff)

```diff
   async ({ event, step }) => {
     const email = String(event.data.email);
-    await sendEmail(email, "Chào mừng bạn tới Coffee Shop!");
-    const code = `KM-${Math.floor(Math.random() * 9000 + 1000)}`;
+    await step.run("email-chao", () => sendEmail(email, "Chào mừng bạn tới Coffee Shop!"));  // tác dụng phụ → step
+    const code = await step.run("tao-ma", () => `KM-${Math.floor(Math.random() * 9000 + 1000)}`); // ngẫu nhiên → step
     await step.run("luu-ma", () => saveCoupon(email, code));
     await step.sleep("cho-3-ngay", "3d");
```

</details>

### 8 · 3 câu hỏi nhanh
1. Phỏng vấn: "Sao không gửi email bằng `void sendEmail()` sau khi trả response cho nhanh?"

   <details><summary>Đáp án</summary>

   Trên serverless, process có thể bị đóng ngay khi response xong → việc chạy dở mất tích; lỗi thì không ai retry; không có lịch sử để xem/chạy lại. Hàng đợi/việc nền (Inngest, Hangfire, Azure Queue + Function) cho: bền (sống qua deploy/crash), retry có backoff, giới hạn đồng thời, quan sát được từng bước.

   </details>

2. "Vì sao code ngoài `step.run` chạy nhiều lần? Quy tắc rút ra?"

   <details><summary>Đáp án</summary>

   Inngest không giữ process giữa các bước: mỗi bước là 1 HTTP request mới gọi lại hàm từ đầu, step đã xong trả kết quả đã lưu (ví dụ 1: thân hàm 4 lần, mỗi step 1 lần). Nên thân hàm phải tất định và không có tác dụng phụ; mọi I/O, ngẫu nhiên, thời gian hiện tại → trong step; id step ổn định, không đổi thứ tự step khi đã có lần chạy dở dang.

   </details>

3. Review code AI: function "xử lý đơn" gọi `await fetch(crmUrl)` ở thân hàm, rồi 1 `step.run("all", …)` ôm cả email + PDF + SMS; webhook Stripe gọi `inngest.send` **không** `await`. Góp ý?

   <details><summary>Đáp án</summary>

   (1) `fetch` ở thân hàm chạy lại mỗi replay → đưa vào step. (2) 1 step ôm 3 việc: PDF lỗi thì retry lại cả email + SMS → tách 3 step (song song bằng `Promise.all`). (3) Không `await inngest.send` trên serverless có thể mất event khi function kết thúc → `await`; cân nhắc khoá idempotency theo `orderId` để webhook gửi lại không tạo 2 lần chạy.

   </details>


---

## Bài 12.4 · LeetCode clone: chấm code qua Judge0 — process riêng, timeout, test ẩn

_Nguồn roadmap: [NextAI] LeetCode Clone (Judge0 integration, role-based access, Prisma schema phức tạp)_

### 1 · Một câu & nằm ở đâu
Không bao giờ chạy code người dùng trong process app (`eval`, `new Function`, `vm`). Gửi sang **Judge0**: `POST /submissions` với `language_id`, `source_code`, `stdin`, `expected_output`, giới hạn thời gian/bộ nhớ → nhận `status`: 3 Accepted, 4 Wrong Answer, 5 Time Limit Exceeded, 6 Compilation Error, 11 Runtime Error. Mỗi đề có test **công khai** và test **ẩn**: chạy lần lượt, dừng ở test hỏng đầu tiên, trả verdict + vị trí — **không** trả input/đáp án test ẩn. Bài lớn/đông người dùng chế độ bất đồng bộ: nộp lấy `token`, rồi poll (hoặc callback).

Trình duyệt → **[Route Handler · Action]** → **[Dịch vụ ngoài: LLM · Stripe · Judge0]** → Việc nền: Inngest → **[DB]** → Đẩy về client: stream · SSE

<details><summary>m12/judge/judge0.ts — hợp đồng Judge0: kiểu request/response, bảng status, base64</summary>

`m12/judge/judge0.ts`

```tsx
// Hợp đồng Judge0 CE (POST /submissions). Giữ đúng tên field → đổi sang Judge0 thật chỉ cần đổi JUDGE0_URL
export type Submission = {
  language_id: number;          // 63 = JavaScript (Node.js) trong Judge0 CE
  source_code: string;
  stdin?: string;
  expected_output?: string;
  cpu_time_limit?: number;      // giây
  memory_limit?: number;        // KB
};
export type Result = {
  token?: string;
  status: { id: number; description: string };
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  time: string | null;          // giây, dạng chuỗi như Judge0
};
export const STATUS: Record<number, string> = {
  1: "In Queue", 2: "Processing", 3: "Accepted", 4: "Wrong Answer",
  5: "Time Limit Exceeded", 6: "Compilation Error", 11: "Runtime Error (NZEC)",
};
export const JAVASCRIPT = 63;
export const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
export const unb64 = (s: string | null | undefined) => (s == null ? null : Buffer.from(s, "base64").toString("utf8"));
```

</details>

<details><summary>m12/judge/mini-judge.ts — mini judge cùng hợp đồng: process riêng, env trống, giới hạn RAM, giết khi quá giờ, hàng đợi 1 worker</summary>

`m12/judge/mini-judge.ts`

```tsx
// Mini judge cùng hợp đồng Judge0 (tập con) — thay cho Judge0 thật ở sandbox (Judge0 cần Docker + isolate).
//   POST /submissions?base64_encoded=true&wait=true|false   GET /submissions/:token?base64_encoded=true
// Mỗi bài nộp chạy trong 1 PROCESS RIÊNG: env rỗng, giới hạn RAM, giết khi quá giờ. Hàng đợi 1 worker.
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { b64, STATUS, unb64, type Result, type Submission } from "./judge0";

const norm = (s: string) => s.replace(/\r\n/g, "\n").split("\n").map((l) => l.trimEnd()).join("\n").trimEnd();
const done = (id: number, extra: Partial<Result> = {}): Result =>
  ({ status: { id, description: STATUS[id] }, stdout: null, stderr: null, compile_output: null, time: null, ...extra });

export const stats = { runs: 0 };                    // số lần thực sự chạy code (để đo "dừng sớm")
function execute(sub: Submission): Promise<Result> {
  stats.runs++;
  const file = join(mkdtempSync(join(tmpdir(), "judge-")), "main.js");
  writeFileSync(file, sub.source_code);
  const syntax = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (syntax.status !== 0) return Promise.resolve(done(6, { compile_output: syntax.stderr.split("\n").filter((l) => l.trim()).slice(1).join("\n") }));
  return new Promise((resolve) => {
    const t0 = process.hrtime.bigint();
    const child = spawn(process.execPath, [`--max-old-space-size=${Math.floor((sub.memory_limit ?? 128000) / 1024)}`, file], { env: { NODE_ENV: "production" } }); // env TRỐNG: không kế thừa secret
    let out = "", err = "", killed = false;
    const timer = setTimeout(() => { killed = true; child.kill("SIGKILL"); }, (sub.cpu_time_limit ?? 2) * 1000);
    child.stdout.on("data", (d: Buffer) => (out += d));
    child.stderr.on("data", (d: Buffer) => (err += d));
    child.on("close", (code) => {
      clearTimeout(timer);
      const time = (Number(process.hrtime.bigint() - t0) / 1e9).toFixed(3);
      if (killed) return resolve(done(5, { time }));
      if (code !== 0) return resolve(done(11, { stderr: err.split("\n").find((l) => /Error/.test(l)) ?? err, time }));
      const ok = sub.expected_output === undefined || norm(out) === norm(sub.expected_output);
      resolve(done(ok ? 3 : 4, { stdout: out, time }));
    });
    child.stdin.end(sub.stdin ?? "");
  });
}

// Hàng đợi 1 worker: bài nộp sau phải chờ (status 1 → 2 → kết quả), như Judge0 khi đông
const results = new Map<string, Result>();
let chain = Promise.resolve();
function enqueue(sub: Submission) {
  const token = randomUUID();
  results.set(token, done(1, { token }));
  chain = chain.then(async () => {
    results.set(token, done(2, { token }));
    results.set(token, { ...(await execute(sub)), token });
  });
  return token;
}
const enc = (r: Result): Result => ({ ...r, stdout: r.stdout && b64(r.stdout), stderr: r.stderr && b64(r.stderr), compile_output: r.compile_output && b64(r.compile_output) });

export function startJudge(port: number) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    const send = (code: number, body: unknown) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
    if (req.method === "POST" && url.pathname === "/submissions") {
      let raw = ""; for await (const c of req) raw += c;
      const s = JSON.parse(raw) as Submission;
      const sub = { ...s, source_code: unb64(s.source_code)!, stdin: unb64(s.stdin ?? "") ?? "", expected_output: s.expected_output === undefined ? undefined : unb64(s.expected_output)! };
      const token = enqueue(sub);
      if (url.searchParams.get("wait") !== "true") return send(201, { token });
      await chain;
      return send(201, enc(results.get(token)!));
    }
    const m = url.pathname.match(/^\/submissions\/([\w-]+)$/);
    if (req.method === "GET" && m && results.has(m[1])) return send(200, enc(results.get(m[1])!));
    send(404, { error: "not found" });
  });
  return new Promise<{ url: string; close: () => void }>((ok) =>
    server.listen(port, "127.0.0.1", () => ok({ url: `http://127.0.0.1:${port}`, close: () => server.close() })));
}
```

</details>

<details><summary>m12/judge/client.ts — client gọi Judge0 (thật hoặc mini), đổi URL bằng JUDGE0_URL</summary>

`m12/judge/client.ts`

```tsx
// Client gọi Judge0 (thật hoặc mini judge) — base64 để không vỡ dấu tiếng Việt / xuống dòng
import { b64, unb64, type Result, type Submission } from "./judge0";

const JUDGE0_URL = process.env.JUDGE0_URL ?? "http://127.0.0.1:2358"; // Judge0 thật: https://<host>, kèm header X-Auth-Token

export async function judge(sub: Submission, wait = true): Promise<Result> {
  const body = { ...sub, source_code: b64(sub.source_code), stdin: b64(sub.stdin ?? ""), expected_output: sub.expected_output && b64(sub.expected_output) };
  const res = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=${wait}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  return decode((await res.json()) as Result);
}

export async function poll(token: string): Promise<Result> {
  return decode((await (await fetch(`${JUDGE0_URL}/submissions/${token}?base64_encoded=true`)).json()) as Result);
}

const decode = (r: Result): Result => ({ ...r, stdout: unb64(r.stdout), stderr: unb64(r.stderr), compile_output: unb64(r.compile_output) });
```

</details>

<details><summary>m12/ex4/problem.ts — đề + 4 test (2 ẩn) + 3 bài nộp mẫu cho mục 7</summary>

`m12/ex4/problem.ts`

```tsx
// Đề "Tổng lớn nhất của đoạn con liên tiếp" + 4 test (2 công khai, 2 ẩn) + 3 bài nộp mẫu (KHÔNG sửa file này)
export type TestCase = { stdin: string; expected: string; hidden: boolean };

const big = Array.from({ length: 200_000 }, (_, i) => ((i * 7919) % 201) - 100);   // n = 200 000
const kadane = (a: number[]) => { let best = a[0], cur = 0; for (const x of a) { cur = Math.max(x, cur + x); best = Math.max(best, cur); } return best; };

export const tests: TestCase[] = [
  { stdin: "5\n1 -2 3 4 -1", expected: "7", hidden: false },
  { stdin: "3\n2 2 2", expected: "6", hidden: false },
  { stdin: "4\n-3 -1 -4 -2", expected: "-1", hidden: true },                    // toàn số âm
  { stdin: `${big.length}\n${big.join(" ")}`, expected: String(kadane(big)), hidden: true },
];

const read = `const [, line] = require("fs").readFileSync(0, "utf8").split("\\n"); const a = line.trim().split(" ").map(Number);`;
export const submissions: Record<string, string> = {
  "Kadane đúng": `${read}\nlet best = a[0], cur = 0;\nfor (const x of a) { cur = Math.max(x, cur + x); best = Math.max(best, cur); }\nconsole.log(best);`,
  "khởi tạo best = 0": `${read}\nlet best = 0, cur = 0;\nfor (const x of a) { cur = Math.max(0, cur + x); best = Math.max(best, cur); }\nconsole.log(best);`,
  "vét cạn O(n²)": `${read}\nlet best = -Infinity;\nfor (let i = 0; i < a.length; i++) { let s = 0; for (let j = i; j < a.length; j++) { s += a[j]; if (s > best) best = s; } }\nconsole.log(best);`,
};
```

</details>

### 2 · Concept
| Khái niệm | Trong bài | Ghi chú | Bên C# |
|---|---|---|---|
| Judge0 | Dịch vụ chạy code trong sandbox (isolate, cgroups); REST `POST /submissions` | Tự host bằng Docker hoặc dùng bản cloud | — |
| Submission | `language_id` (63 = JavaScript), `source_code`, `stdin`, `expected_output`, `cpu_time_limit` | `base64_encoded=true`: không vỡ dấu, xuống dòng | DTO |
| Status | 1 In Queue · 2 Processing · 3 Accepted · 4 WA · 5 TLE · 6 Compilation Error · 11 Runtime Error | Tự map sang verdict hiển thị | enum |
| `wait=true` vs token | Đồng bộ (dev, bài nhỏ) vs nộp → `token` → poll / `callback_url` | Production: token + callback | — |
| Test ẩn | Bảng `test_cases(problem_id, stdin, expected, hidden)`; chỉ trả verdict + vị trí | Chống học thuộc đáp án | — |
| Phân quyền | Chỉ admin tạo đề/test — kiểm trong DAL (bài 11.3); schema: problems, test_cases, submissions | Prisma/Drizzle đều được | `[Authorize(Roles = "Admin")]` |

### 3 · Flow / lifecycle
**Bấm "Nộp bài" → verdict: code đi qua những đâu?**

```mermaid
flowchart LR
  N0["Nộp bài<br/><small>Server Action</small>"]
  N1["Lấy test<br/><small>công khai + ẩn</small>"]
  N2["Judge0<br/><small>POST /submissions</small>"]
  N3["Process riêng<br/><small>env trống, timeout</small>"]
  N4["So output<br/><small>chuẩn hoá khoảng trắng</small>"]
  N5["Verdict<br/><small>dừng ở test hỏng đầu</small>"]
  N0 --> N1
  N1 --> N2
  N2 --> N3
  N3 --> N4
  N4 --> N5
```

Đọc sơ đồ: Trái → phải: action lấy test (công khai + ẩn) từ DB; mỗi test là 1 submission gửi Judge0; Judge0 chạy trong process cô lập có timeout; so output sau khi chuẩn hoá khoảng trắng; dừng ở test hỏng đầu tiên và chỉ trả chi tiết của test công khai.

### 4 · Ví dụ thực tế
**Ví dụ 1.** Đề "Cộng 2 số": stdin `2 3`, đáp án `5`. Nộp 5 bài khác nhau qua client Judge0 (mục 1) tới mini judge.

`m12/judge/submit.ts`

```tsx
// 5 bài nộp cho đề "Cộng 2 số" (stdin "2 3" → "5") — mỗi bài ra 1 trạng thái Judge0 khác nhau
import { judge } from "./client";
import { JAVASCRIPT } from "./judge0";
import { startJudge } from "./mini-judge";

const j = await startJudge(2358);
const read = `const [a, b] = require("fs").readFileSync(0, "utf8").trim().split(" ").map(Number);`;
const solutions: Record<string, string> = {
  "đúng": `${read}\nconsole.log(a + b);`,
  "sai": `${read}\nconsole.log(a - b);`,
  "lặp vô hạn": `${read}\nwhile (true) {}`,
  "sai cú pháp": `${read}\nconsole.log(a + b;`,
  "ném lỗi": `${read}\nconsole.log(a.foo.bar);`,
};
for (const [name, source_code] of Object.entries(solutions)) {
  const r = await judge({ language_id: JAVASCRIPT, source_code, stdin: "2 3", expected_output: "5", cpu_time_limit: 1 });
  const lines = (r.stdout ?? r.stderr ?? r.compile_output ?? "").trim().split("\n");
  const detail = lines.find((l) => /Error/.test(l)) ?? lines[0];
  console.log(`${name.padEnd(12)} → ${String(r.status.id).padStart(2)} ${r.status.description.padEnd(21)} time=${(r.time ?? "-").padEnd(5)} ${detail}`);
}
j.close();
```

```console
❯ npx tsx m12/judge/submit.ts
đúng         →  3 Accepted              time=0.049 5
sai          →  4 Wrong Answer          time=0.053 -1
lặp vô hạn   →  5 Time Limit Exceeded   time=1.007 
sai cú pháp  →  6 Compilation Error     time=-     SyntaxError: missing ) after argument list
ném lỗi      → 11 Runtime Error (NZEC)  time=0.052 TypeError: Cannot read properties of undefined (reading 'bar')
```

Đủ 5 trạng thái chính. Lặp vô hạn bị giết đúng ở giới hạn 1 giây (`time=1.00x`) — server của bạn không bị ảnh hưởng. Sai cú pháp bị chặn trước khi chạy (`node --check`, như bước biên dịch). Ném lỗi → exit code ≠ 0 → 11 kèm dòng lỗi. Đổi sang Judge0 thật chỉ cần đặt `JUDGE0_URL` (+ header xác thực) — tên field, status giữ nguyên.

**Ví dụ 2.** Chế độ bất đồng bộ: nộp 3 bài cùng lúc với `wait=false`, nhận token ngay, rồi poll 250ms/lần. Mini judge chỉ có 1 worker nên bài sau phải xếp hàng — như Judge0 khi đông người nộp.

`m12/judge/poll.ts`

```tsx
// Chế độ bất đồng bộ (wait=false): nộp 3 bài cùng lúc → nhận token ngay → hỏi lại (poll) tới khi xong.
// Judge chỉ có 1 worker nên bài sau phải xếp hàng — giống Judge0 khi đông người nộp.
import { judge, poll } from "./client";
import { JAVASCRIPT } from "./judge0";
import { startJudge } from "./mini-judge";

const j = await startJudge(2358);
const slow = `const end = Date.now() + 400; while (Date.now() < end) {}\nconsole.log(5);`; // chạy 0,4 giây
const t0 = Date.now();
const at = () => `+${String(Date.now() - t0).padStart(4)}ms`;
const tokens = await Promise.all([1, 2, 3].map(async () =>
  (await judge({ language_id: JAVASCRIPT, source_code: slow, expected_output: "5" }, false)).token!));
console.log(`${at()}  nộp 3 bài, nhận ngay 3 token: ${tokens.map((t) => t.slice(0, 8)).join(", ")}`);

for (let done = false; !done; await new Promise((r) => setTimeout(r, 250))) {
  const all = await Promise.all(tokens.map(poll));
  console.log(`${at()}  ${all.map((r, i) => `#${i + 1} ${r.status.description}`).join(" · ")}`);
  done = all.every((r) => r.status.id >= 3);
}
j.close();
```

```console
❯ npx tsx m12/judge/poll.ts
+ 123ms  nộp 3 bài, nhận ngay 3 token: 011c3db5, 9c021fb6, b5408550
+ 150ms  #1 Processing · #2 In Queue · #3 In Queue
+ 413ms  #1 Processing · #2 In Queue · #3 In Queue
+ 670ms  #1 Accepted · #2 Processing · #3 In Queue
+ 927ms  #1 Accepted · #2 Processing · #3 In Queue
+1182ms  #1 Accepted · #2 Accepted · #3 Processing
+1438ms  #1 Accepted · #2 Accepted · #3 Processing
+1693ms  #1 Accepted · #2 Accepted · #3 Accepted
```

Request nộp trả về ngay (không giữ kết nối tới khi chấm xong); trạng thái đi `In Queue → Processing → Accepted` theo thứ tự hàng đợi. Trong app: action nộp lưu `token` vào bảng submissions, UI poll (hoặc nhận đẩy qua SSE — bài 12.5); Judge0 thật còn hỗ trợ `callback_url` để tự gọi về khi xong, khỏi poll.

### 5 · Thử thật / bẫy
**Bẫy 1.** **Chạy code người dùng bằng `new Function`/`eval` ngay trong process API** — "cho nhanh, khỏi dựng Judge0".

`m12/judge/traps/eval-runner.ts`

```tsx
// ❌ "Chạy code người dùng cho nhanh": new Function ngay trong process của API
import { judge } from "../client";
import { startJudge } from "../mini-judge";

process.env.DATABASE_URL = "postgres://admin:S3cret@db.internal/coffee"; // process API thật luôn có biến kiểu này

function runInsideApi(code: string): string {
  const out: string[] = [];
  new Function("print", code)((s: unknown) => out.push(String(s)));      // chạy với toàn quyền của server
  return out.join("\n");
}

const attack = `print(process.env.DATABASE_URL)`;
console.log(`new Function trong process API  → ${runInsideApi(attack)}`);

const j = await startJudge(2358);
const r = await judge({ language_id: 63, source_code: `console.log(process.env.DATABASE_URL ?? "(không có)")` });
console.log(`mini judge (process riêng)      → ${r.stdout?.trim()}`);
j.close();
```

```console
❯ npx tsx m12/judge/traps/eval-runner.ts
new Function trong process API  → postgres://admin:S3cret@db.internal/coffee
mini judge (process riêng)      → (không có)
```

1 dòng code nộp là lộ chuỗi kết nối DB — cùng cách đó đọc được file, gọi mạng nội bộ, xoá dữ liệu. `vm` của Node cũng **không** phải ranh giới bảo mật. Judge0 (và mini judge) chạy mỗi bài trong process riêng với env trống; Judge0 thật còn cô lập bằng isolate (cgroups, namespace, chặn mạng).

**Bẫy 2.** **Chạy code trong event loop của server, không timeout.** Một người nộp `while (true) {}`.

`m12/judge/traps/inproc-server.ts`

```tsx
// ❌ API chấm bài chạy code ngay trong event loop của chính nó (không process riêng, không timeout)
import { createServer } from "node:http";

createServer(async (req, res) => {
  if (req.url === "/health") return res.end("ok");
  let code = "";
  for await (const c of req) code += c;
  new Function(code)();                                    // while(true){} → event loop kẹt vĩnh viễn
  res.end("done");
}).listen(4100, "127.0.0.1", () => console.log("api sẵn sàng"));
```

```console
❯ npx tsx m12/judge/traps/hang.ts
GET /health trước          → 200 sau 103ms
GET /health sau bài nộp    → không trả lời sau 2006ms
GET /health lần nữa        → không trả lời sau 2003ms
```

Node chạy JavaScript trên 1 luồng: vòng lặp vô hạn chiếm luồng đó, mọi request khác — kể cả `/health` — đứng im, load balancer tưởng server chết. Process riêng + giết khi quá giờ (ví dụ 1: TLE sau 1 giây) giữ server luôn sống.

**Bẫy 3.** **So output bằng `===`** với đáp án trong file.

`m12/judge/traps/compare.ts`

```tsx
// ❌ So output bằng === : đáp án đúng nhưng khác khoảng trắng/xuống dòng
const expected = "5\n";                                         // file đáp án thường kết thúc bằng \n
const outputs = { "console.log(5)": "5\n", "process.stdout.write('5')": "5", "in thêm dấu cách": "5 \n", "Windows (CRLF)": "5\r\n" };
const norm = (s: string) => s.replace(/\r\n/g, "\n").split("\n").map((l) => l.trimEnd()).join("\n").trimEnd();

for (const [how, out] of Object.entries(outputs)) {
  const strict = out === expected ? "Accepted" : "Wrong Answer";
  const fair = norm(out) === norm(expected) ? "Accepted" : "Wrong Answer";
  console.log(`${how.padEnd(26)} ${JSON.stringify(out).padEnd(8)} → so ===: ${strict.padEnd(12)} · so sau chuẩn hoá: ${fair}`);
}
```

```console
❯ npx tsx m12/judge/traps/compare.ts
console.log(5)             "5\n"    → so ===: Accepted     · so sau chuẩn hoá: Accepted
process.stdout.write('5')  "5"      → so ===: Wrong Answer · so sau chuẩn hoá: Accepted
in thêm dấu cách           "5 \n"   → so ===: Wrong Answer · so sau chuẩn hoá: Accepted
Windows (CRLF)             "5\r\n"  → so ===: Wrong Answer · so sau chuẩn hoá: Accepted
```

Đáp án đúng nhưng thiếu `\n` cuối, thừa dấu cách, hay xuống dòng kiểu Windows đều thành Wrong Answer — người dùng mất niềm tin vào hệ thống. Chuẩn hoá trước khi so: `\r\n` → `\n`, bỏ khoảng trắng cuối mỗi dòng và cuối bài (như `norm()` trong mini judge). Judge0 tự làm việc này khi bạn gửi `expected_output`.

### 6 · Tóm tắt bằng hình
**(a) Cây thư mục sau bài này**

```text
m12/judge/  [MỚI]  ← chấm bài
├─ judge0.ts · client.ts  [MỚI]  ← hợp đồng Judge0 · client (đổi URL là sang Judge0 thật)
├─ mini-judge.ts  [MỚI]  ← bản thay thế cùng hợp đồng: process riêng, timeout, hàng đợi
├─ submit.ts · poll.ts  [MỚI]  ← ví dụ 1, 2
└─ traps/eval-runner.ts · inproc-server.ts · hang.ts · compare.ts  [MỚI]  ← 3 bẫy
m12/ex4/problem.ts · start/grade.ts · solution/grade.ts · check.ts  [MỚI]  ← bài Làm ngay
```

**(b) Đọc trong 10 giây**

**Chấm 1 bài nộp an toàn cần những gì?**

```mermaid
flowchart LR
  N0["Lấy test<br/><small>theo thứ tự, có ẩn</small>"]
  N1["Judge0<br/><small>process riêng, timeout</small>"]
  N2["Hỏng → dừng<br/><small>không chạy test sau</small>"]
  N3["Trả verdict<br/><small>ẩn: không lộ chi tiết</small>"]
  N0 --> N1
  N1 --> N2
  N2 --> N3
```

Đọc sơ đồ: Code người dùng không bao giờ chạy trong app; Judge0 lo cô lập + giới hạn; app lo thứ tự test, dừng sớm và giữ kín test ẩn.

### 7 · Làm ngay (≤ 10 phút)
**Mục tiêu:** `m12/ex4/start/grade.ts` do AI viết: chạy hết mọi test kể cả khi đã hỏng, trả toàn bộ input/đáp án (cả test ẩn) về trình duyệt, và báo mọi lỗi là "Wrong Answer". Chỉ sửa file này (đề + bài nộp mẫu ở `m12/ex4/problem.ts`, mục 1).

File khởi đầu:

`m12/ex4/start/grade.ts`

```tsx
// ← CHỈ sửa file này. AI viết: chạy hết mọi test, trả về toàn bộ chi tiết cho trình duyệt
import { judge } from "../../judge/client";
import { JAVASCRIPT } from "../../judge/judge0";
import type { TestCase } from "../problem";

export async function grade(code: string, tests: TestCase[]) {
  const results = [];
  for (const t of tests) {
    const r = await judge({ language_id: JAVASCRIPT, source_code: code, stdin: t.stdin, expected_output: t.expected, cpu_time_limit: 1 });
    results.push({ input: t.stdin.slice(0, 40), expected: t.expected, got: r.stdout?.trim(), status: r.status.description });
  }
  const passed = results.filter((r) => r.status === "Accepted").length;
  return { verdict: passed === tests.length ? "Accepted" : "Wrong Answer", passed, total: tests.length, results };
}
```

Chạy file khởi đầu (đang đỏ):

```console
❯ npx tsx m12/ex4/check.ts start
✓ Kadane đúng → Accepted 4/4
✗ best = 0 → Wrong Answer ở test 3, dừng ngay (chạy 3 lần)  → 4 lần chạy · {"verdict":"Wrong Answer","passed":3,"total":4,"results":[{"input":"5\
✗ Kết quả không chứa input/đáp án của test ẩn ("-3 -1 -4 -2", "-1")  → {"verdict":"Wrong Answer","passed":3,"total":4,"results":[{"input":"5\n1 -2 3 4 -1","expec
✗ vét cạn O(n²) → Time Limit Exceeded (không phải Wrong Answer)  → {"verdict":"Wrong Answer","passed":3,"total":4,"results":[{"input":"5\n1 -2 3 4 
1/4 đạt
```

Tiêu chí nghiệm thu:

- [ ] Kadane đúng → Accepted 4/4
- [ ] Khởi tạo `best = 0` → Wrong Answer ở test 3, chỉ chạy judge 3 lần (dừng ngay)
- [ ] Kết quả không chứa input/đáp án của test ẩn
- [ ] Vét cạn O(n²) → Time Limit Exceeded (không phải Wrong Answer)

Lệnh nghiệm thu:

```bash
npx tsx m12/ex4/check.ts start && npx tsc -p .
```

Lời giải tham chiếu chạy ra (output cần đạt):

```console
❯ npx tsx m12/ex4/check.ts solution
✓ Kadane đúng → Accepted 4/4
✓ best = 0 → Wrong Answer ở test 3, dừng ngay (chạy 3 lần)
✓ Kết quả không chứa input/đáp án của test ẩn ("-3 -1 -4 -2", "-1")
✓ vét cạn O(n²) → Time Limit Exceeded (không phải Wrong Answer)
4/4 đạt
```

<details><summary>Gợi ý nếu bị đỏ</summary>

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| 4 lần chạy cho bài sai | Vòng lặp không dừng khi hỏng | `if (r.status.id !== 3) return …` ngay trong vòng lặp |
| Lộ "-3 -1 -4 -2" | Trả `results` đầy đủ | Test ẩn: `detail: null`, chỉ trả `where: "test 3/4 (ẩn)"` |
| O(n²) báo Wrong Answer | Tự suy verdict từ số test qua | Dùng `r.status.description` của Judge0 |

`m12/ex4/start/grade.ts` (diff)

```diff
-// ← CHỈ sửa file này. AI viết: chạy hết mọi test, trả về toàn bộ chi tiết cho trình duyệt
+// ← CHỈ sửa file này. Dừng ở test hỏng đầu tiên, giữ kín test ẩn, báo đúng loại lỗi
 import { judge } from "../../judge/client";
 import { JAVASCRIPT } from "../../judge/judge0";
 
 export async function grade(code: string, tests: TestCase[]) {
-  const results = [];
-  for (const t of tests) {
+  for (const [i, t] of tests.entries()) {
     const r = await judge({ language_id: JAVASCRIPT, source_code: code, stdin: t.stdin, expected_output: t.expected, cpu_time_limit: 1 });
-    results.push({ input: t.stdin.slice(0, 40), expected: t.expected, got: r.stdout?.trim(), status: r.status.description });
+    if (r.status.id === 3) continue;
+    const where = `test ${i + 1}/${tests.length}${t.hidden ? " (ẩn)" : ""}`;
+    const detail = t.hidden ? null : { input: t.stdin, expected: t.expected, got: r.stdout?.trim() ?? r.stderr }; // test ẩn: không lộ
+    return { verdict: r.status.description, passed: i, total: tests.length, where, detail };
   }
-  const passed = results.filter((r) => r.status === "Accepted").length;
-  return { verdict: passed === tests.length ? "Accepted" : "Wrong Answer", passed, total: tests.length, results };
+  return { verdict: "Accepted", passed: tests.length, total: tests.length };
 }
```

</details>

### 8 · 3 câu hỏi nhanh
1. Phỏng vấn: "Sao không chạy code người dùng bằng `vm` / `isolated-vm` / worker thread trong server Node?"

   <details><summary>Đáp án</summary>

   `vm` không phải ranh giới bảo mật (tài liệu Node nói rõ); worker thread chung process, chung quyền file/mạng/env. Cần cô lập ở mức hệ điều hành: process riêng + user không quyền + cgroups (CPU, RAM) + namespace (không mạng, filesystem tạm) — đúng thứ Judge0/isolate làm. App chỉ gửi code đi và nhận verdict.

   </details>

2. "Bài vét cạn O(n²) qua hết test công khai nhưng bị status 5 ở test ẩn. UI nên nói gì?"

   <details><summary>Đáp án</summary>

   "Time Limit Exceeded ở test 4/4 (ẩn)" + thời gian giới hạn; không hiện input (lớn, và là test ẩn). Gợi ý chung: "thuật toán chưa đủ nhanh với dữ liệu lớn". Đừng gộp TLE thành Wrong Answer — 2 lỗi khác bản chất (đúng nhưng chậm vs sai).

   </details>

3. Review code AI cho LeetCode clone: route `POST /api/problems` (tạo đề) không kiểm quyền; `/api/submit` gọi Judge0 `wait=true` tuần tự cho 50 test trong 1 request và trả mảng 50 kết quả kèm đáp án. Góp ý?

   <details><summary>Đáp án</summary>

   (1) Tạo đề: `verifySession()` + role admin trong DAL (11.3). (2) 50 test × `wait=true` dễ quá timeout serverless: nộp batch/token, lưu submission, poll hoặc `callback_url`; hoặc đẩy chấm sang việc nền (12.3). (3) Dừng ở test hỏng đầu, chỉ trả chi tiết test công khai (mục 7). (4) Giới hạn tần suất nộp theo user.

   </details>


---

## Bài 12.5 · Realtime: Postgres NOTIFY → SSE → EventSource (mô hình Supabase Realtime)

_Nguồn roadmap: [NextAI] Supabase/Convex real-time app_

### 1 · Một câu & nằm ở đâu
"Realtime" = server **đẩy** thay đổi xuống client thay vì client hỏi lại liên tục. Nguồn sự kiện tốt nhất là **DB**: trigger Postgres gọi `pg_notify` mỗi khi INSERT/UPDATE, server `LISTEN` kênh đó (Supabase Realtime làm đúng việc này cho bạn). Đường xuống trình duyệt: **SSE** — 1 route trả `text/event-stream` giữ kết nối mở; client `new EventSource(url)` trong `useEffect` và **phải** `es.close()` khi rời trang. Chạy nhiều instance thì pub/sub trong bộ nhớ không đủ — cần broker chung (Postgres, Redis, Supabase).

**[Trình duyệt]** → Route Handler · Action → Dịch vụ ngoài: LLM · Stripe · Judge0 → Việc nền: Inngest → **[DB]** → **[Đẩy về client: stream · SSE]**

<details><summary>m12/live/lib/bus.ts — subscribe(): LISTEN kênh orders, đếm số kết nối để soi rò rỉ</summary>

`m12/live/lib/bus.ts`

```tsx
// Đăng ký nhận thay đổi đơn hàng từ Postgres (LISTEN). Đếm số người nghe để soi rò rỉ kết nối.
import "server-only";
import { db, type Change } from "./db";

const g = globalThis as unknown as { listeners?: number };
g.listeners ??= 0;
export const listenerCount = () => g.listeners!;

export async function subscribe(onChange: (c: Change) => void): Promise<() => Promise<void>> {
  const unlisten = await (await db()).listen("orders", (payload) => onChange(JSON.parse(payload) as Change));
  g.listeners!++;
  let closed = false;
  return async () => {
    if (closed) return;
    closed = true;
    g.listeners!--;
    await unlisten();
  };
}
```

</details>

<details><summary>m12/live/app/actions.ts — placeOrder / markServed — ghi DB, trigger tự phát sự kiện</summary>

`m12/live/app/actions.ts`

```tsx
"use server";

import { db } from "../lib/db";

export async function placeOrder(formData: FormData) {
  await (await db()).query("insert into orders (drink) values ($1)", [String(formData.get("drink"))]);
}

export async function markServed(id: number) {
  await (await db()).query("update orders set status = 'served' where id = $1", [id]);
}
```

</details>

<details><summary>m12/live/app/barista/page.tsx — màn hình quầy: server đọc danh sách ban đầu</summary>

`m12/live/app/barista/page.tsx`

```tsx
// Màn hình quầy: server đọc danh sách hiện có, client nghe thay đổi tiếp theo
import { db, type Order } from "../../lib/db";
import Board from "./Board";

export const dynamic = "force-dynamic";

export default async function BaristaPage() {
  const { rows } = await (await db()).query<Order>("select * from orders order by id");
  return <><h1>Quầy pha chế</h1><Board initial={rows} /></>;
}
```

</details>

<details><summary>m12/live/notify-demo.ts — script ví dụ 1</summary>

`m12/live/notify-demo.ts`

```tsx
// Không HTTP, không React: chỉ Postgres. Đăng ký LISTEN rồi ghi dữ liệu — ai báo cho ai?
import { db } from "./lib/db";

const pg = await db();
const t0 = Date.now();
const unlisten = await pg.listen("orders", (payload) => console.log(`+${String(Date.now() - t0).padStart(3)}ms  NOTIFY orders: ${payload}`));
console.log(`+${String(Date.now() - t0).padStart(3)}ms  LISTEN orders`);
await pg.query("insert into orders (drink) values ($1)", ["Mocha"]);
await pg.query("update orders set status = 'served' where id = $1", [1]);
await pg.query("select count(*) from orders");                         // SELECT: không có thông báo nào
await unlisten();
await pg.query("insert into orders (drink) values ($1)", ["Cold Brew"]);  // đã UNLISTEN: không nhận nữa
console.log(`Trong bảng: ${JSON.stringify((await pg.query("select id, drink, status from orders order by id")).rows)}`);
```

</details>

<details><summary>m12/sse-live.ts — script ví dụ 2</summary>

`m12/sse-live.ts`

```tsx
// Mở /api/orders/stream như EventSource làm, rồi ghi dữ liệu từ "người khác" — sự kiện về lúc nào?
import { serve } from "./serve";

const srv = await serve("m12/live", 3241);
await fetch(srv.origin + "/api/orders");                       // khởi động Postgres trước (PGlite mất vài giây lần đầu)
const t0 = Date.now();
const at = () => `+${String(Date.now() - t0).padStart(4)}ms`;
const listeners = async () => ((await (await fetch(srv.origin + "/api/debug")).json()) as { listeners: number }).listeners;
const add = (drink: string) => fetch(srv.origin + "/api/orders", { method: "POST", body: JSON.stringify({ drink }) });

const ac = new AbortController();
const res = await fetch(srv.origin + "/api/orders/stream", { signal: ac.signal });
while ((await listeners()) === 0) await new Promise((r) => setTimeout(r, 20)); // đợi LISTEN đăng ký xong
console.log(`${at()}  HTTP ${res.status} ${res.headers.get("content-type")} · đang nghe: ${await listeners()}`);
const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
void (async () => {
  for (;;) {
    const { done, value } = await reader.read().catch(() => ({ done: true, value: "" }));
    if (done) break;
    for (const ev of value.split("\n\n").filter(Boolean)) console.log(`${at()}  nhận: ${ev}`);
  }
})();
await new Promise((r) => setTimeout(r, 300)); console.log(`${at()}  người khác POST Mocha`); await add("Mocha");
await new Promise((r) => setTimeout(r, 300)); console.log(`${at()}  người khác POST Cold Brew`); await add("Cold Brew");
await new Promise((r) => setTimeout(r, 300));
ac.abort();
await new Promise((r) => setTimeout(r, 200));
console.log(`${at()}  client ngắt kết nối · đang nghe: ${await listeners()}`);
await srv.close();
```

</details>

<details><summary>m12/live-ui.ts — script ví dụ 3: 2 trình duyệt</summary>

`m12/live-ui.ts`

```tsx
// 2 trình duyệt: khách đặt món, màn hình quầy tự hiện đơn mới — không F5, không hỏi lại server
import { serve } from "./serve";
import { launch } from "./browser";

const srv = await serve("m12/live", 3242);
const browser = await launch();
const barista = await browser.newPage();
let requests = 0;
barista.on("request", () => requests++);
await barista.goto(srv.origin + "/barista");
await barista.waitForTimeout(500);
requests = 0;                                                   // chỉ đếm request SAU khi trang đã mở xong

const customer = await browser.newPage();
await customer.goto(srv.origin + "/menu");
for (const drink of ["Mocha", "Cold Brew"]) {
  await customer.getByLabel("Món").selectOption(drink);
  const t0 = Date.now();
  await customer.getByRole("button", { name: "Đặt" }).click();
  await barista.getByText(drink).waitFor();
  console.log(`Khách đặt ${drink.padEnd(9)} → màn hình quầy hiện sau ${Date.now() - t0}ms`);
}
console.log(`Màn hình quầy: ${(await barista.locator("li").allInnerTexts()).join(" | ")}`);
console.log(`Request trang quầy gửi thêm trong lúc đó: ${requests}`);
await browser.close();
await srv.close();
```

</details>

### 2 · Concept
| Cách | Cơ chế | Khi nào | Bên C# |
|---|---|---|---|
| Polling | `setInterval(fetch, 2000)` | Dữ liệu đổi chậm, ít người xem | `Timer` + `HttpClient` |
| SSE | 1 GET mở lâu, server ghi `data: …` + dòng trống; `EventSource` tự nối lại (`retry`) | 1 chiều server → client: bảng đơn, thông báo, tiến độ | SignalR (transport Server-Sent Events) |
| WebSocket | 2 chiều, giao thức riêng | Chat 2 chiều dày, game, cộng tác | SignalR WebSockets |
| Nguồn sự kiện | Trigger + `pg_notify` → `LISTEN` | DB là nguồn sự thật: ai ghi (app, admin, job) cũng phát | SqlDependency / Service Broker |
| Supabase Realtime | `supabase.channel().on("postgres_changes", …)` | Không tự viết LISTEN + SSE | — |
| Nhiều instance | Pub/sub trong bộ nhớ chỉ thấy trong 1 process (bẫy 3) | Cần broker chung: Postgres, Redis, Supabase | SignalR backplane (Redis) |

### 3 · Flow / lifecycle
**Khách đặt món → màn hình quầy hiện ngay: ai đẩy cho ai?**

```mermaid
flowchart LR
  N0["placeOrder<br/><small>INSERT orders</small>"]
  N1["Trigger<br/><small>pg_notify kênh orders</small>"]
  N2["LISTEN<br/><small>subscribe() ở server</small>"]
  N3["SSE<br/><small>data: {op, row}</small>"]
  N4["EventSource<br/><small>onmessage → setState</small>"]
  N5["Rời trang<br/><small>es.close() → UNLISTEN</small>"]
  N0 --> N1
  N1 --> N2
  N2 --> N3
  N3 --> N4
  N4 --> N5
```

Đọc sơ đồ: Trái → phải: action chỉ INSERT; trigger trong Postgres phát `pg_notify`; route SSE đang `LISTEN` nhận và ghi 1 sự kiện `data:` vào kết nối mở sẵn; `EventSource` gọi `onmessage` → `setState`; rời trang thì `es.close()` → server `UNLISTEN`.

### 4 · Ví dụ thực tế
**Ví dụ 1.** Chỉ Postgres (PGlite), chưa có HTTP hay React: tạo bảng + trigger, `LISTEN`, rồi ghi dữ liệu.

`m12/live/lib/db.ts`

```tsx
// Postgres (PGlite) + trigger: mỗi INSERT/UPDATE trên orders → pg_notify('orders', <dòng dạng JSON>)
// Đây đúng là cơ chế Supabase Realtime dựa trên: DB tự "đẩy" thay đổi, app không phải hỏi lại
import { PGlite } from "@electric-sql/pglite";

const SCHEMA = `
  create table orders (id serial primary key, drink text not null, status text not null default 'new');
  create function notify_order() returns trigger language plpgsql as $$
  begin
    perform pg_notify('orders', json_build_object('op', TG_OP, 'row', row_to_json(new))::text);
    return new;
  end $$;
  create trigger orders_changed after insert or update on orders
    for each row execute function notify_order();
  insert into orders (drink) values ('Latte');`;

const g = globalThis as unknown as { liveDb?: Promise<PGlite> };
export const db = () => (g.liveDb ??= (async () => {
  const pg = new PGlite();
  await pg.exec(SCHEMA);
  return pg;
})());

export type Order = { id: number; drink: string; status: "new" | "served" };
export type Change = { op: "INSERT" | "UPDATE"; row: Order };
```

```console
❯ npx tsx m12/live/notify-demo.ts
+  2ms  LISTEN orders
+  7ms  NOTIFY orders: {"op" : "INSERT", "row" : {"id":2,"drink":"Mocha","status":"new"}}
+ 10ms  NOTIFY orders: {"op" : "UPDATE", "row" : {"id":1,"drink":"Latte","status":"served"}}
Trong bảng: [{"id":1,"drink":"Latte","status":"served"},{"id":2,"drink":"Mocha","status":"new"},{"id":3,"drink":"Cold Brew","status":"new"}]
```

INSERT và UPDATE đều phát sự kiện trong vài ms, kèm cả dòng dữ liệu dạng JSON; SELECT không phát gì; sau `unlisten` thì không nhận nữa dù vẫn ghi. Vì sự kiện đến từ trigger, **mọi** đường ghi (app, trang admin, job nền, sửa tay bằng SQL) đều phát — không sót như khi tự gọi `emit()` trong từng action.

**Ví dụ 2.** Route SSE: giữ kết nối mở, mỗi thông báo từ Postgres thành 1 sự kiện `data:`. `m12/sse-live.ts` mở stream như `EventSource`, rồi "người khác" đặt 2 món qua API.

`m12/live/app/api/orders/stream/route.ts`

```tsx
// GET /api/orders/stream — Server-Sent Events: 1 kết nối HTTP mở lâu, server đẩy "data: …\n\n" khi có thay đổi
import { subscribe } from "../../../../lib/bus";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const enc = new TextEncoder();
  let stop = async () => {};
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(enc.encode("retry: 2000\n\n"));              // mất kết nối → trình duyệt tự nối lại sau 2s
      stop = await subscribe((change) => controller.enqueue(enc.encode(`data: ${JSON.stringify(change)}\n\n`)));
      req.signal.addEventListener("abort", () => void stop());         // client đóng tab / es.close()
    },
    cancel: () => stop(),
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform" },
  });
}
```

```console
❯ npx next build m12/live > /dev/null && npx tsx m12/sse-live.ts
+  65ms  HTTP 200 text/event-stream · đang nghe: 1
+  89ms  nhận: retry: 2000
+ 388ms  người khác POST Mocha
+ 407ms  nhận: data: {"op":"INSERT","row":{"id":2,"drink":"Mocha","status":"new"}}
+ 707ms  người khác POST Cold Brew
+ 720ms  nhận: data: {"op":"INSERT","row":{"id":3,"drink":"Cold Brew","status":"new"}}
+1224ms  client ngắt kết nối · đang nghe: 0
```

Sự kiện tới sau khoảng 10–30ms kể từ lúc ghi. `retry: 2000` dặn trình duyệt tự nối lại sau 2 giây nếu đứt. Client ngắt → `req.signal` abort → `UNLISTEN` → số kết nối về 0: không rò rỉ phía server. `Cache-Control: no-cache, no-transform` để proxy/CDN không gom (buffer) stream.

**Ví dụ 3.** Màn hình quầy: server render danh sách hiện có, client mở `EventSource` để nhận phần tiếp theo. `m12/live-ui.ts`: 2 trang Chromium — khách đặt món ở 1 trang, đo thời gian tới khi trang quầy hiện đơn.

`m12/live/app/barista/Board.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import type { Change, Order } from "../../lib/db";

export default function Board({ initial }: { initial: Order[] }) {
  const [orders, setOrders] = useState(initial);
  useEffect(() => {
    const es = new EventSource("/api/orders/stream");             // 1 kết nối, server đẩy về
    es.onmessage = (e) => {
      const change = JSON.parse(e.data as string) as Change;
      if (change.op === "INSERT") setOrders((list) => [...list, change.row]);
    };
    return () => es.close();                                        // rời trang → đóng kết nối
  }, []);
  return <ul>{orders.map((o) => <li key={o.id}>{`#${o.id} ${o.drink} · ${o.status}`}</li>)}</ul>;
}
```

```console
❯ npx tsx m12/live-ui.ts
Khách đặt Mocha     → màn hình quầy hiện sau 146ms
Khách đặt Cold Brew → màn hình quầy hiện sau 80ms
Màn hình quầy: #1 Latte · new | #2 Mocha · new | #3 Cold Brew · new
Request trang quầy gửi thêm trong lúc đó: 0
```

> ⚠ **Chưa chạy ở sandbox.** Supabase Realtime cần 1 project Supabase (URL + anon key) và bật Realtime cho bảng. Mã tương đương thay `EventSource`: `const ch = supabase.channel("orders").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (p) => …).subscribe()`, cleanup bằng `supabase.removeChannel(ch)`. Mong đợi: cùng hành vi — đơn mới hiện ở màn hình quầy sau vài chục tới vài trăm ms, không cần route SSE tự viết.

Đơn hiện ở màn hình quầy sau ~0,1–0,15 giây tính từ lúc khách bấm (gồm cả action ghi DB), và trang quầy **không gửi thêm request nào** — chỉ 1 kết nối SSE mở sẵn. Danh sách ban đầu đến từ server (F5 vẫn đủ); SSE chỉ mang thay đổi.

### 5 · Thử thật / bẫy
**Bẫy 1.** **"Realtime" bằng polling 2 giây/lần** — cách AI hay viết đầu tiên.

`m12/live/app/barista-poll/PollBoard.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import type { Order } from "../../lib/db";

// ❌ "Realtime" bằng cách hỏi lại server mỗi 2 giây
export default function PollBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    const load = () => fetch("/api/orders").then((r) => r.json()).then((rows: Order[]) => setOrders(rows));
    void load();
    const id = setInterval(load, 2000);
    return () => clearInterval(id);
  }, []);
  return <ul>{orders.map((o) => <li key={o.id}>{`#${o.id} ${o.drink} · ${o.status}`}</li>)}</ul>;
}
```

```console
❯ npx tsx m12/poll-vs-sse.ts
/barista-poll  thấy đơn mới sau 1432ms · gửi 11 request trong 7,5 giây
/barista       thấy đơn mới sau  129ms · gửi 3 request trong 7,5 giây
```

Polling thấy đơn mới chậm tới 2 giây (trung bình 1 giây) và gửi request đều đặn kể cả khi không có gì — nhân với 50 màn hình là 25 request/giây vào DB cho không. SSE: thấy sau ~0,1 giây; 3 request của nó đều nằm lúc trang vừa mở (1 kết nối SSE + 2 prefetch link `/menu` của Next), sau đó im lặng. Polling vẫn hợp lý khi dữ liệu đổi chậm và ít người xem — chọn có ý thức.

**Bẫy 2.** **Mở `EventSource` trong `useEffect` mà không `return () => es.close()`.**

`m12/live/app/barista-leak/LeakyBoard.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import type { Change, Order } from "../../lib/db";

// ❌ Mở EventSource trong useEffect nhưng KHÔNG return cleanup
export default function LeakyBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    const es = new EventSource("/api/orders/stream");
    es.onmessage = (e) => {
      const change = JSON.parse(e.data as string) as Change;
      if (change.op === "INSERT") setOrders((list) => [...list, change.row]);
    };
  }, []);
  return <ul>{orders.map((o) => <li key={o.id}>{`#${o.id} ${o.drink}`}</li>)}</ul>;
}
```

```console
❯ npx tsx m12/leak.ts
/barista       sau 3 lần đi/về → server đang giữ 1 kết nối LISTEN (cần 1)
/barista-leak  sau 3 lần đi/về → server đang giữ 4 kết nối LISTEN (cần 1)
```

Mỗi lần quay lại trang (điều hướng phía client bằng `<Link>`, component mount lại) là thêm 1 kết nối, cái cũ không ai đóng: server giữ 4 kết nối LISTEN cho 1 người dùng, trình duyệt giữ 4 kết nối HTTP (trên HTTP/1.1 chỉ có 6 kết nối/domain — đủ làm trang treo). Đúng mục "thiếu cleanup" trong checklist roadmap 13.2.

**Bẫy 3.** **Pub/sub bằng `EventEmitter` trong bộ nhớ** rồi deploy 2 instance (2 container sau load balancer, hoặc serverless scale ra).

`m12/live/lib/membus.ts`

```tsx
// ❌ Pub/sub bằng EventEmitter trong bộ nhớ của PROCESS — chạy tốt… khi chỉ có 1 server
import "server-only";
import { EventEmitter } from "node:events";

const g = globalThis as unknown as { bus?: EventEmitter };
export const bus = (g.bus ??= new EventEmitter());
```

```console
❯ npx tsx m12/multi.ts
Khách đặt Mocha qua instance A → màn hình (nối B) nhận: (không gì)
Khách đặt Latte qua instance B → màn hình (nối B) nhận: data: {"drink":"Latte","from":"B"}
```

Màn hình quầy nối vào instance B; khách bị load balancer đưa vào A → sự kiện phát trong bộ nhớ của A, B không bao giờ biết. Chạy 1 máy dev thì mọi thứ "chạy tốt". Cần broker dùng chung: Postgres thật (`LISTEN/NOTIFY` như ví dụ 1–2 — mọi instance nối cùng DB), Redis pub/sub, hoặc dịch vụ như Supabase Realtime. (PGlite ở sandbox nằm trong 1 process nên không minh hoạ được bản sửa nhiều instance.)

### 6 · Tóm tắt bằng hình
**(a) Cây thư mục sau bài này**

```text
m12/live/  [MỚI]  ← app Next của bài
├─ lib/db.ts  [MỚI]  ← PGlite + trigger pg_notify
├─ lib/bus.ts · membus.ts  [MỚI]  ← LISTEN có đếm · bẫy 3 (EventEmitter)
├─ app/api/orders/stream/route.ts  [MỚI]  ← SSE: LISTEN → data: …
├─ app/api/orders · api/debug · actions.ts  [MỚI]  ← ghi đơn · đếm kết nối · server actions
├─ app/barista/page.tsx · Board.tsx · menu/page.tsx  [MỚI]  ← màn hình quầy · màn hình khách
└─ app/barista-poll · barista-leak · api/mem  [MỚI]  ← 3 bẫy
m12/live/notify-demo.ts · sse-live.ts · live-ui.ts · poll-vs-sse.ts · leak.ts · multi.ts  [MỚI]  ← script
m12/ex5/start · ex5/solution · ex5/check.ts  [MỚI]  ← bài Làm ngay
```

**(b) Đọc trong 10 giây**

**Thêm realtime cho 1 màn hình: 4 việc**

```mermaid
flowchart LR
  N0["Render ban đầu<br/><small>Server Component</small>"]
  N1["Trigger NOTIFY<br/><small>DB phát thay đổi</small>"]
  N2["Route SSE<br/><small>LISTEN, cleanup</small>"]
  N3["EventSource<br/><small>gộp theo id, close()</small>"]
  N0 --> N1
  N1 --> N2
  N2 --> N3
```

Đọc sơ đồ: Server render dữ liệu hiện có; DB phát thay đổi; SSE mang thay đổi xuống; client gộp thay đổi vào state theo id và đóng kết nối khi rời trang.

### 7 · Làm ngay (≤ 10 phút)
**Mục tiêu:** `m12/ex5/start`: màn hình quầy có nút "Xong #id" (action `markServed` → UPDATE → trigger phát sự kiện `op: "UPDATE"`). `Board.tsx` do AI viết thêm 1 dòng cho **mọi** sự kiện → bấm Xong ra 2 dòng #1. Chỉ sửa `app/barista/Board.tsx`.

File khởi đầu:

`m12/ex5/start/app/barista/Board.tsx`

```tsx
"use client"; // ← CHỈ sửa file này

import { useEffect, useState } from "react";
import { markServed } from "../../../../live/app/actions";
import type { Change, Order } from "../../../../live/lib/db";

export default function Board({ initial }: { initial: Order[] }) {
  const [orders, setOrders] = useState(initial);
  useEffect(() => {
    const es = new EventSource("/api/orders/stream");
    es.onmessage = (e) => {
      const change = JSON.parse(e.data as string) as Change;
      setOrders((list) => [...list, change.row]);                 // AI: sự kiện nào cũng thêm 1 dòng
    };
    return () => es.close();
  }, []);
  return (
    <ul>
      {orders.map((o, i) => (
        <li key={i}>{`#${o.id} ${o.drink} · ${o.status}`} <button onClick={() => void markServed(o.id)}>Xong #{o.id}</button></li>
      ))}
    </ul>
  );
}
```

Chạy file khởi đầu (đang đỏ):

```console
❯ npx next build m12/ex5/start > /dev/null && npx tsx m12/ex5/check.ts m12/ex5/start
✓ Bấm Xong #1 → "#1 Latte · served" trong < 500ms
✗ Vẫn đúng 1 dòng #1 (không nhân đôi)  → 2 dòng: #1 Latte · new Xong #1 | #1 Latte · served Xong #1
✓ F5 → #1 vẫn served (đã lưu DB)
2/3 đạt
```

Tiêu chí nghiệm thu:

- [ ] Bấm Xong #1 → "#1 Latte · served" xuất hiện trong < 500ms
- [ ] Vẫn đúng 1 dòng #1 (không nhân đôi)
- [ ] F5 → #1 vẫn served (đã lưu DB)
- [ ] `npx tsc -p .` không lỗi; vẫn giữ `return () => es.close()`

Lệnh nghiệm thu:

```bash
npx next build m12/ex5/start > /dev/null && npx tsx m12/ex5/check.ts m12/ex5/start && npx tsc -p .
```

Lời giải tham chiếu chạy ra (output cần đạt):

```console
❯ npx next build m12/ex5/solution > /dev/null && npx tsx m12/ex5/check.ts m12/ex5/solution
✓ Bấm Xong #1 → "#1 Latte · served" trong < 500ms
✓ Vẫn đúng 1 dòng #1 (không nhân đôi)
✓ F5 → #1 vẫn served (đã lưu DB)
3/3 đạt
```

<details><summary>Gợi ý nếu bị đỏ</summary>

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| 2 dòng #1 | Sự kiện UPDATE cũng bị nối thêm | `op === "UPDATE"` → `list.map(o => o.id === row.id ? row : o)` |
| Cảnh báo trùng key / dòng nhảy lung tung | `key={i}` theo vị trí | `key={o.id}` — id ổn định (roadmap 13.2) |
| Đơn vừa render từ server bị thêm lần nữa | INSERT tới sau khi đã có trong `initial` | Bỏ qua INSERT nếu `list.some(o => o.id === row.id)` |

`m12/ex5/start/app/barista/Board.tsx` (diff)

```diff
     const es = new EventSource("/api/orders/stream");
     es.onmessage = (e) => {
-      const change = JSON.parse(e.data as string) as Change;
-      setOrders((list) => [...list, change.row]);                 // AI: sự kiện nào cũng thêm 1 dòng
+      const { op, row } = JSON.parse(e.data as string) as Change;
+      setOrders((list) =>
+        op === "INSERT" && !list.some((o) => o.id === row.id) ? [...list, row]   // mới: thêm (bỏ qua nếu đã có)
+          : list.map((o) => (o.id === row.id ? row : o)));                       // UPDATE: thay đúng dòng đó
     };
     return () => es.close();
   return (
     <ul>
-      {orders.map((o, i) => (
-        <li key={i}>{`#${o.id} ${o.drink} · ${o.status}`} <button onClick={() => void markServed(o.id)}>Xong #{o.id}</button></li>
+      {orders.map((o) => (
+        <li key={o.id}>{`#${o.id} ${o.drink} · ${o.status}`} <button onClick={() => void markServed(o.id)}>Xong #{o.id}</button></li>
       ))}
     </ul>
```

</details>

### 8 · 3 câu hỏi nhanh
1. Phỏng vấn: "Màn hình quầy pha chế cần realtime: SSE, WebSocket hay polling?"

   <details><summary>Đáp án</summary>

   Dữ liệu chảy 1 chiều server → màn hình, thao tác ngược lại (Xong, đặt món) là request thường → SSE: HTTP thường, tự nối lại, đơn giản, đủ nhanh (~0,1 giây). WebSocket khi cần 2 chiều liên tục (chat nhiều người gõ, cộng tác). Polling khi đổi chậm, ít người xem. Nếu đã dùng Supabase thì Realtime của nó lo luôn phần nghe DB + đẩy xuống.

   </details>

2. "Deploy SSE lên serverless (Vercel) cần lưu ý gì?"

   <details><summary>Đáp án</summary>

   Function có thời lượng chạy tối đa → kết nối sẽ bị cắt định kỳ; `EventSource` tự nối lại (`retry`) nhưng có thể lỡ sự kiện trong lúc đứt → khi nối lại tải lại danh sách hoặc dùng `Last-Event-ID`. Nhiều instance → cần broker chung (bẫy 3). Proxy/CDN không được buffer (`no-transform`). Nhiều người xem → cân nhắc dịch vụ realtime (Supabase, Pusher, Ably) thay vì tự giữ hàng nghìn kết nối.

   </details>

3. Review code AI: `useEffect(() => { const es = new EventSource("/api/stream"); es.onmessage = (e) => setOrders([...orders, JSON.parse(e.data)]); }, [orders])`. Góp ý?

   <details><summary>Đáp án</summary>

   (1) Thiếu cleanup → rò kết nối (bẫy 2). (2) Dependency `[orders]` → mỗi đơn mới lại mở thêm 1 EventSource (cộng dồn với 1). (3) `setOrders([...orders, …])` đọc `orders` cũ trong closure → dùng functional update `setOrders(list => …)` và deps `[]`. (4) Gộp theo `id`, xử lý cả UPDATE (mục 7). (5) Danh sách ban đầu nên render từ server, SSE chỉ mang thay đổi.

   </details>

