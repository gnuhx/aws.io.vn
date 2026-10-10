#!/usr/bin/env bash
# sudo bash deploy/ec2-bootstrap.sh <domain> <email>
set -euo pipefail
DOMAIN="${1:?cần domain, ví dụ nexus.example.com}"
EMAIL="${2:?cần email cho Lets Encrypt}"
cd "$(dirname "$0")/.."

apt-get update -y
apt-get install -y docker.io docker-compose-v2 nginx certbot python3-certbot-nginx
systemctl enable --now docker nginx

test -f /etc/nexus/web.env || { echo "thiếu /etc/nexus/web.env (xem deploy/web.env.example)"; exit 1; }
chmod 600 /etc/nexus/web.env

docker compose -f deploy/docker-compose.prod.yml up -d --build
docker compose -f deploy/docker-compose.prod.yml exec -T web node /app/mcp/dist/seed.js || true

sed "s/nexus.example.com/${DOMAIN}/g" deploy/nginx/nexus.conf > /etc/nginx/sites-available/nexus.conf
cp deploy/nginx/nexus-locations.conf /etc/nginx/snippets/
ln -sf /etc/nginx/sites-available/nexus.conf /etc/nginx/sites-enabled/nexus.conf
rm -f /etc/nginx/sites-enabled/default
certbot certonly --nginx -d "$DOMAIN" -m "$EMAIL" --agree-tos --non-interactive
nginx -t
systemctl reload nginx
echo "OK: https://${DOMAIN}/chat"
