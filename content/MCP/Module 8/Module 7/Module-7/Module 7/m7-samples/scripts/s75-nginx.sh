#!/usr/bin/env bash
# S7.5 — dựng lại "EC2" trong máy: Nginx thật (deploy/nginx/mcp.conf, đổi domain → localhost, cert tự ký)
# + 2 instance stateless + authorization server dev, rồi chạy trọn luồng OAuth qua https://localhost:8443/mcp.
#   BUFFERING=on scripts/s75-nginx.sh                  → buffering bật, nhưng SDK gửi X-Accel-Buffering: no → vẫn stream
#   BUFFERING=on IGNORE_ACCEL=1 scripts/s75-nginx.sh   → proxy bỏ qua header đó → progress dồn cục (bẫy)
set -euo pipefail
export NO_PROXY="*" no_proxy="*"   # máy có HTTPS_PROXY: localhost đi thẳng
cd "$(dirname "$0")/.."
W=$(mktemp -d)
PIDS=()
cleanup() {
  for p in "${PIDS[@]}"; do kill "$p" 2>/dev/null || true; done
  [ -f "$W/nginx.pid" ] && nginx -p "$W" -c "$W/nginx.conf" -s stop 2>/dev/null || true
  rm -rf "$W"
}
trap cleanup EXIT

openssl req -x509 -newkey rsa:2048 -nodes -days 1 -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost" -keyout "$W/key.pem" -out "$W/cert.pem" 2>/dev/null

# Cùng file với production; chỉ đổi domain, cert, cổng.
sed -e "s#mcp.example.com#localhost#g" \
    -e "s#/etc/letsencrypt/live/localhost/fullchain.pem#$W/cert.pem#" \
    -e "s#/etc/letsencrypt/live/localhost/privkey.pem#$W/key.pem#" \
    -e "s#listen 80;#listen 127.0.0.1:8080;#" -e "s#listen 443 ssl http2;#listen 127.0.0.1:8443 ssl http2;#" \
    -e "s#127.0.0.1:3001#127.0.0.1:3601#" -e "s#127.0.0.1:3002#127.0.0.1:3602#" \
    -e "s#root /var/www/certbot;#root $W;#" \
    -e "s#proxy_buffering off;#proxy_buffering ${BUFFERING:-off};${IGNORE_ACCEL:+ proxy_ignore_headers X-Accel-Buffering;}#" \
    deploy/nginx/mcp.conf > "$W/mcp.conf"
cat > "$W/nginx.conf" <<EOF
pid $W/nginx.pid;
error_log $W/error.log;
events {}
http {
  access_log $W/access.log;
  client_body_temp_path $W; proxy_temp_path $W; fastcgi_temp_path $W; uwsgi_temp_path $W; scgi_temp_path $W;
  include $W/mcp.conf;
}
EOF

echo "❯ nginx -t"
nginx -t -p "$W" -c "$W/nginx.conf" 2>&1 | sed "s#$W#<tmp>#g"
nginx -p "$W" -c "$W/nginx.conf"

RES=https://localhost:8443/mcp
ISS=http://127.0.0.1:3400
ISSUER=$ISS RESOURCES=$RES node scripts/dev-auth.ts 2>"$W/auth.log" & PIDS+=($!)
for port in 3601 3602; do
  MODE=stateless PORT=$port INSTANCE="ec2-$port" BEHIND_PROXY=true ALLOWED_HOSTS=localhost DATA_FILE="$W/tasks.json" \
  MCP_RESOURCE=$RES AUTH_ISSUER=$ISS AUTH_JWKS_URI=$ISS/jwks node src/main.ts 2>>"$W/mcp.log" & PIDS+=($!)
done
sleep 1.5

echo "❯ curl -s https://localhost:8443/healthz   (2 lần)"
for _ in 1 2; do curl -s --cacert "$W/cert.pem" https://localhost:8443/healthz; echo; done
echo "❯ curl -si -X POST https://localhost:8443/mcp   (không token)"
curl -si --cacert "$W/cert.pem" -X POST https://localhost:8443/mcp -H 'content-type: application/json' -d '{}' \
  | grep -iE '^(HTTP|www-authenticate)' | tr -d '\r'
echo "❯ curl -s http://localhost:8080/mcp -o /dev/null -w '%{http_code} → %{redirect_url}'"
curl -s http://localhost:8080/mcp -o /dev/null -w '%{http_code} → %{redirect_url}\n'
echo "❯ curl -sk --resolve evil.example:8443:127.0.0.1 -X POST https://evil.example:8443/mcp   (rebinding: Host lạ lọt qua Nginx)"
curl -sk --resolve evil.example:8443:127.0.0.1 https://evil.example:8443/mcp -X POST -H 'content-type: application/json' -d '{}'; echo

echo "❯ RESOURCE=$RES ISSUER=$ISS node scripts/s74-oauth-flow.ts   (client qua Nginx + TLS)"
NODE_EXTRA_CA_CERTS="$W/cert.pem" RESOURCE=$RES ISSUER=$ISS node scripts/s74-oauth-flow.ts
echo "❯ log 2 instance"
sed "s#$W#<tmp>#g" "$W/mcp.log"
