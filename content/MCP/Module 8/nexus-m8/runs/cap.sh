#!/usr/bin/env bash
# cap.sh <out-file> <cwd> <command...>  — ghi "❯ lệnh" + stdout/stderr nguyên văn (không sửa chữ)
out="$1"; cwd="$2"; shift 2
cmd="$*"
{ printf '❯ %s\n' "$cmd"; (cd "$cwd" && bash -c "$cmd" 2>&1); } > "$out"
echo "[$(wc -l < "$out") dòng] $out"
