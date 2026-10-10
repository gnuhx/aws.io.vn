// "Dịch thẳng từ C#" — S7.2: static ConcurrentDictionary<string, Session> + sticky session ở load balancer. ĐỪNG viết thế này.
import type { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

export class SessionRegistry {
  private static readonly sessions = new Map<string, StreamableHTTPServerTransport>(); // RAM của 1 process
  static add(id: string, t: StreamableHTTPServerTransport) {
    SessionRegistry.sessions.set(id, t);
  }
  static get(id: string): StreamableHTTPServerTransport {
    const t = SessionRegistry.sessions.get(id);
    if (!t) throw new Error(`Session ${id} not found`); // instance khác không bao giờ thấy session này
    return t;
  }
  // Không ai gọi remove khi client biến mất → map phình mãi; deploy/restart → mọi session chết cùng lúc.
}
