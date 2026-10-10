#!/usr/bin/env bash
# CHỈ dùng trên máy test (ghi đè /etc/nginx/snippets/nexus-locations.conf).
# Đo 5 cấu hình location /api/chat: chữ đầu tiên tới lúc nào, bao nhiêu mốc thời gian khác nhau.
# Cần: web chạy ở 127.0.0.1:3000, site nexus-local-test.conf (cổng 8080) đã bật.
set -euo pipefail
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
SNIPPET=/etc/nginx/snippets/nexus-locations.conf

run() { # $1 = tên cấu hình, $2 = directive thêm vào location /api/chat
  cat > "$SNIPPET" <<CONF
location = /api/chat {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    $2
}
location / { proxy_pass http://127.0.0.1:3000; }
CONF
  nginx -t 2>/dev/null && nginx -s reload 2>/dev/null
  sleep 1
  local out first last n
  out=$(node "$REPO/apps/web/scripts/chat-probe.ts" http://127.0.0.1:8080)
  first=$(grep '"text"' <<<"$out" | head -1 | awk '{print $1}')
  last=$(grep '"done"' <<<"$out" | awk '{print $1}')
  n=$(grep ' ms ' <<<"$out" | awk '{print $1}' | sort -u | wc -l)
  printf "%-58s chữ đầu: %5s ms · done: %5s ms · %2s mốc thời gian khác nhau\n" "$1" "$first" "$last" "$n"
}

run "A. mặc định (buffering on) + route gửi X-Accel-Buffering" ""
run "B. buffering on + bỏ qua X-Accel-Buffering" "proxy_ignore_headers X-Accel-Buffering;"
run "C. B + gzip cho application/x-ndjson" "proxy_ignore_headers X-Accel-Buffering; gzip on; gzip_proxied any; gzip_types application/x-ndjson;"
run "D. C + proxy_buffering off" "proxy_ignore_headers X-Accel-Buffering; proxy_buffering off; gzip on; gzip_proxied any; gzip_types application/x-ndjson;"
run "E. proxy_buffering off + gzip off (cấu hình bài)" "proxy_buffering off; gzip off;"

install -m 644 "$REPO/deploy/nginx/nexus-locations.conf" "$SNIPPET" && nginx -s reload 2>/dev/null
