"""cut.py <in> <out> <regex-giữ-lại-thêm…>: giữ dòng ❯, bỏ dòng khớp regex DROP; in số dòng bỏ. Không sửa chữ dòng nào."""
import re, sys
src = open(sys.argv[1]).read().rstrip("\n").split("\n")
drop = re.compile(sys.argv[3])
keep = [l for i, l in enumerate(src) if i == 0 or l.startswith("❯ ") or not drop.search(l)]
open(sys.argv[2], "w").write("\n".join(keep) + "\n")
print(f"{len(src) - len(keep)} dòng bỏ")
