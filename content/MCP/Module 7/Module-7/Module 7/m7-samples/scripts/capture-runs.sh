#!/usr/bin/env bash
# Chụp lại mọi output dùng trong Module-7 .md vào ../runs/*.txt. Mỗi file: dòng "❯ lệnh" rồi stdout+stderr nguyên văn.
set -uo pipefail
cd "$(dirname "$0")/.."
OUT=../runs
mkdir -p "$OUT"
run() { # run <file> <lệnh...>
  local f=$1; shift
  { echo "❯ $*"; bash -c "$*" 2>&1; } > "$OUT/$f"
}
run versions.txt 'node -v && npx tsc -v && npm ls --depth=0 2>/dev/null | tail -n +2 && nginx -v 2>&1 && openssl version'
run s71-session.txt node scripts/s71-session.ts
run s72-scale.txt node scripts/s72-scale.ts
run s73-guard.txt node scripts/s73-guard.ts
run s74-auth.txt node scripts/s74-auth.ts
run s74-oauth-flow.txt node scripts/s74-oauth-flow.ts
run s75-web.txt node scripts/s75-web.ts
run s75-nginx.txt bash scripts/s75-nginx.sh
run check.txt 'npm run check 2>&1 | grep -E "^(OK|FAILED)"'
# bẫy
run trap-s71-shared-server.txt node traps/shared-server.ts
run trap-s71-body-consumed.txt node traps/body-consumed.ts
run trap-s73-origin-includes.txt node traps/origin-includes.ts
run trap-s73-cors-star.txt node traps/cors-star.ts
run trap-s74-jwt-decode-only.txt node traps/jwt-decode-only.ts
run trap-s74-header-unicode.txt 'node traps/header-unicode.ts 2>&1 | head -4'
run trap-s74-req-auth.txt npx tsc -p traps/tsc/tsconfig.json
run trap-s74-scope-challenge.txt 'AUTH_CHALLENGE_SCOPE=nexus:read node scripts/s74-oauth-flow.ts'
run trap-s75-buffering.txt 'BUFFERING=on IGNORE_ACCEL=1 bash scripts/s75-nginx.sh 2>&1 | grep -E "progress|OAuth flow"; BUFFERING=on bash scripts/s75-nginx.sh 2>&1 | grep -E "progress"'
run trap-s75-http2-on.txt 'W=$(mktemp -d); sed "s#listen 443 ssl http2;#listen 443 ssl;\n    http2 on;#" deploy/nginx/mcp.conf > $W/mcp.conf; printf "events {}\nhttp { include $W/mcp.conf; }\n" > $W/nginx.conf; nginx -t -c $W/nginx.conf 2>&1 | sed "s#$W#<tmp>#g"; rm -rf $W'
run v2-probe.txt 'cd sdk-v2-probe && node probe.ts'
ls -1 "$OUT"
