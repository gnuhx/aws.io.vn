"""Host MCP Apps tối giản (thay Claude Desktop khi dựng bài): nhúng template ui:// vào iframe sandbox, trả lời
ui/initialize, gửi ui/notifications/tool-result, chụp ảnh. Dữ liệu = output THẬT của scripts/task-demo.ts --json-ui.
    python3 apps-host/host_check.py <ui.json> <ảnh.png>
"""
import json
import sys

from playwright.sync_api import sync_playwright

data = json.load(open(sys.argv[1]))
HOST = """<!doctype html><meta charset="utf-8"><body style="margin:0;background:#f3f3f3;padding:12px">
<iframe id="app" sandbox="allow-scripts" style="width:560px;height:260px;border:1px solid #ccc;border-radius:8px;background:#fff"></iframe>
<script>
window.__log = [];
const app = document.getElementById("app");
window.addEventListener("message", (e) => {
  if (e.source !== app.contentWindow) return;              // chỉ nghe đúng iframe của mình
  const m = e.data; window.__log.push("← " + (m.method || ("result#" + m.id)));
  const reply = (msg) => { window.__log.push("→ " + (msg.method || ("result#" + msg.id))); app.contentWindow.postMessage({ jsonrpc: "2.0", ...msg }, "*"); };
  if (m.method === "ui/initialize") reply({ id: m.id, result: { protocolVersion: "2026-01-26", hostInfo: { name: "host-check", version: "1.0.0" }, hostCapabilities: {}, hostContext: { theme: "light" } } });
  if (m.method === "ui/notifications/initialized") reply({ method: "ui/notifications/tool-result", params: window.__toolResult });
});
</script>"""

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={"width": 600, "height": 300})
    page.set_content(HOST)
    page.evaluate("r => { window.__toolResult = r; }", data["toolResult"])
    page.evaluate("h => { document.getElementById('app').srcdoc = h; }", data["html"])
    frame = page.frame_locator("#app")
    frame.locator(".row").first.wait_for(timeout=5000)
    rows = frame.locator(".row").all_inner_texts()
    print("postMessage:", " ".join(page.evaluate("window.__log")))
    print(f"tiêu đề: {frame.locator('#title').inner_text()} · {len(rows)} cột")
    for r in rows:
        print("  ", r.replace("\n", "  "))
    page.locator("#app").screenshot(path=sys.argv[2])
    print(f"ảnh: {sys.argv[2].split('/')[-1]}")
    b.close()
