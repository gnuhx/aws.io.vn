# nexus-m9 — code + output thật của Module 9

- `nexus/` — repo pnpm (apps/web Next.js 16.4.1 + packages/shared). `.git` có 6 commit: "M9 baseline…", "M9 S9.1" … "M9 S9.5";
  mỗi bài trong trang = code ở đúng commit đó (`git show`).
- `runs/m9/` — output chạy thật. `lib.sh` có hàm `r` (in "❯ lệnh" rồi output nguyên văn, chỉ bỏ mã màu ANSI) và `start_server`.
  `check-page.txt` = kết quả check_lessons.py trên trang HTML.
- `lesson-code/m9/traps/` — bản CỐ Ý sai của từng bẫy (chép đè vào repo lúc chạy, chạy xong trả lại bản đúng).

Chạy lại:

    cd nexus && pnpm install
    cp apps/web/.env.example apps/web/.env.local   # điền BETTER_AUTH_SECRET
    cd apps/web && npx next build && npx next start -p 3009
    ./scripts/signin.sh lan minh an                 # tạo 3 người dùng demo + cookie
    ./scripts/dash.sh lan /acme/dashboard

Chưa chạy ở sandbox: MongoDB thật (store RAM cùng hợp đồng async — M10 thay), đăng nhập Google/GitHub (cần OAuth app),
HTTPS (cookie `__Secure-`), LLM thật (provider giả `lib/llm/fake.ts`).
