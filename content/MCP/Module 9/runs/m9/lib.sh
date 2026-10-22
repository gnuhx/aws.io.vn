# Mỗi lệnh: in "❯ lệnh" rồi stdout+stderr nguyên văn của chính lệnh đó (chỉ bỏ mã màu ANSI).
export NEXT_TELEMETRY_DISABLED=1 FORCE_COLOR=0
r() { echo "❯ $1"; bash -c "$1" 2>&1 | sed 's/\x1b\[[0-9;]*m//g'; }
start_server() { (cd /home/claude/m9/apps/web && nohup npx next start -p 3009 > /home/claude/m9/apps/web/server.log 2>&1 &) ; for i in $(seq 1 60); do curl -s -o /dev/null localhost:3009/favicon.ico && return 0; sleep 0.5; done; echo "server không lên"; }
stop_server() { pkill -f "next start -p 3009"; pkill -f "next-server"; sleep 1; }
