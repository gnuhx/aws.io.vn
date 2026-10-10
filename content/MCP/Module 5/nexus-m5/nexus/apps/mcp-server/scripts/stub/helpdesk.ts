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
