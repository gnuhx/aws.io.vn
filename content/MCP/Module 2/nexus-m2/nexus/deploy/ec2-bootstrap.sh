#!/usr/bin/env bash
# Chạy MỘT lần trên EC2 Ubuntu 24.04 mới tạo:  sudo bash deploy/ec2-bootstrap.sh nexus.example.com you@example.com
# Idempotent: chạy lại không hỏng gì.
set -euo pipefail

DOMAIN="${1:?Cần domain, ví dụ nexus.example.com}"
EMAIL="${2:?Cần email đăng ký cert}"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Docker Engine + Compose plugin (repo chính thức của Docker)"
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  # shellcheck source=/dev/null
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -q
  apt-get install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
# Docker tự chạy khi boot → container có restart: unless-stopped tự lên lại sau reboot
systemctl enable --now docker

echo "==> Nginx + Certbot"
apt-get install -y -q nginx certbot python3-certbot-nginx
systemctl enable --now nginx

echo "==> Secret của app (không nằm trong repo)"
install -d -m 700 /etc/nexus
if [[ ! -f /etc/nexus/web.env ]]; then
  install -m 600 "$REPO_DIR/deploy/web.env.example" /etc/nexus/web.env
  echo "!! Sửa /etc/nexus/web.env (ANTHROPIC_API_KEY) rồi chạy lại script." >&2
  exit 1
fi

echo "==> Build + chạy container"
docker compose -f "$REPO_DIR/deploy/docker-compose.prod.yml" up -d --build
docker compose -f "$REPO_DIR/deploy/docker-compose.prod.yml" exec -T web node mcp/dist/seed.js

echo "==> Nginx site (HTTP trước, để certbot xác thực domain)"
install -m 644 "$REPO_DIR/deploy/nginx/nexus-locations.conf" /etc/nginx/snippets/nexus-locations.conf
mkdir -p /var/www/certbot
cat > /etc/nginx/sites-available/nexus.conf <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    include /etc/nginx/snippets/nexus-locations.conf;
}
EOF
ln -sf /etc/nginx/sites-available/nexus.conf /etc/nginx/sites-enabled/nexus.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "==> HTTPS: certbot lấy cert, tự thêm block 443 + redirect, cài timer gia hạn"
certbot --nginx -d "$DOMAIN" -m "$EMAIL" --agree-tos --non-interactive --redirect
systemctl list-timers --all | grep -q certbot && echo "certbot.timer: OK (tự gia hạn)"

echo "==> Xong: https://${DOMAIN}/chat"
