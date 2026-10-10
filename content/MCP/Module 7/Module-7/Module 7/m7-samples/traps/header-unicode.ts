// Bẫy S7.4 — viết câu lỗi tiếng Việt vào header WWW-Authenticate.
import express from "express";

const app = express();
app.post("/mcp", (_req, res) => {
  res.set("WWW-Authenticate", `Bearer error="invalid_token", error_description="token hết hạn"`).status(401).json({ error: "invalid_token" });
});
const http = app.listen(3902, "127.0.0.1");
const r = await fetch("http://127.0.0.1:3902/mcp", { method: "POST" });
console.log(`client nhận: ${r.status} ${r.headers.get("www-authenticate") ?? "(không có WWW-Authenticate)"} · body: ${(await r.text()).split("\n")[0]?.slice(0, 80)}`);
http.close();
