Tôi đang học AWS Certified Solutions Architect – Associate (SAA-C03) theo roadmap trong project ("roadmap.md").
Mục tiêu: đọc nhanh, nắm cốt lõi, viết theo format cụ thể/tra cứu nhanh kiểu LPIC (bảng flag, bảng so sánh, bảng tham số, ẩn dụ đi kèm map kiến trúc thật) — tuyệt đối tránh viết mơ hồ/chung chung, có lab tay + quiz ôn.

📌 Thông tin session

1. Module — [Module X: Tên module] · Domain thi liên quan: [Design Resilient Architectures 26% / Design High-Performing Architectures 24% / Design Secure Architectures 30% / Design Cost-Optimized Architectures 20%]
2. Section — [Tên section 🔹] · Gồm các bài: [liệt kê số bài + tên bài theo đúng roadmap.md]
3. Nội dung — học theo BƯỚC 1 bên dưới

---

## BƯỚC -1 — Kiểm tra chuyển Module (làm TRƯỚC BƯỚC 0)

So sánh Module của section sắp học với Module của section **gần nhất đã tạo file** trong conversation này (dựa theo lịch sử chat hoặc file đã xuất trước đó).

- Nếu **cùng Module** với lần trước → bỏ qua, học bình thường theo BƯỚC 0.
- Nếu đây là **Module MỚI** (khác với module vừa học trước đó trong cùng đoạn chat) → dừng lại, **không generate nội dung**, thay vào đó hiển thị NGUYÊN VĂN khối cảnh báo sau ở đầu câu trả lời (không rút gọn, không diễn giải lại):

> ## ⚠️ BẮT ĐẦU MODULE MỚI — VUI LÒNG MỞ CHAT MỚI
> Bạn vừa hoàn thành xong **Module [X-1]** và chuẩn bị sang **Module [X]: [Tên module mới]**.
> Để tránh conversation quá dài (giảm chất lượng file HTML/quiz về sau do context bị nhồi nhét), vui lòng **mở 1 đoạn chat mới** trong project này, sau đó dán lại prompt template kèm thông tin session của Module [X] để bắt đầu.
> Roadmap tiến độ tính đến giờ: [liệt kê nhanh các module/section đã hoàn thành ✅].

Chỉ generate nội dung Module mới này **nếu user xác nhận muốn tiếp tục trong chat hiện tại bất chấp cảnh báo** (vd user reply "cứ làm tiếp đi" / "không cần đâu"). Nếu user im lặng hoặc mở chat mới, không cần làm gì thêm.

---

## BƯỚC 0 — Xác định section

Tra "roadmap.md": đúng module + section (🔹), danh sách bài con bên trong (số + tên), domain thi liên quan + % tương ứng, danh sách các section khác cùng module theo đúng thứ tự (để dựng roadmap tiến độ ở BƯỚC 2).

Tách bài trong section thành 2 nhóm:
- **Bài kỹ thuật** (có nội dung riêng: khái niệm, lệnh, dịch vụ cụ thể) → áp dụng đầy đủ BƯỚC 1.
- **Bài "meta"** (Introduction, Exam Cram, Architecture Patterns, Quiz, Cheat Sheets — không có nội dung kỹ thuật riêng) → KHÔNG tách quiz/lab riêng, gộp tóm tắt vào phần Cheat Sheet cuối section.

---

## BƯỚC 1 — Với MỖI BÀI KỸ THUẬT trong section, lặp lại đúng 8 mục sau (theo format LPIC, cụ thể — không viết mơ hồ/chung chung):

1. **Khái niệm + ví dụ đời sống** — 2-4 câu đi thẳng vào bản chất, kèm 1 ví dụ đời sống ngắn gọn giúp hình dung ngay (vd DNS = danh bạ điện thoại toàn cầu). Nếu khái niệm có 2 cơ chế/luồng dễ nhầm, liệt kê ngắn gọn từng luồng bằng bullet.

2. **Lệnh quan trọng** — các lệnh CLI hay dùng/hay thi nhất, mỗi lệnh có comment ngắn ngay dòng đó. Sau đó bắt buộc kèm **bảng "Từ điển flag nhanh"**:

   | Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
   |---|---|---|
   | (mỗi flag/lệnh xuất hiện ở trên) | (viết tắt đầy đủ tiếng Anh) | (giải thích ngắn, 1 dòng) |

   Không bỏ sót flag nào đã dùng ở mục lệnh — đây là phần giúp tra cứu nhanh, không phải phần tóm tắt.

3. **So sánh nhanh** — CHỈ khi bài có ≥2 khái niệm/loại con dễ nhầm (vd ALB vs NLB, S3 Standard vs IA). Trình bày bảng ngắn: cột đầu là tên loại, các cột sau là tiêu chí phân biệt + ví dụ cụ thể. Nếu bài không có gì để so sánh, bỏ qua mục này (không ép có).

4. **Giới hạn/tham số quan trọng** — bảng liệt kê các con số/tham số hay ra thi (quota, default value, TTL, kích thước tối đa...):

   | Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
   |---|---|---|
   | ... | ... | (khi nào cần quan tâm số này) |

5. **Cách dùng nâng cao / pattern thực tế** — 1 lệnh/kỹ thuật nâng cao ít người biết (vd `dig +trace`), giải thích nó lộ ra điều gì. Ngay sau đó là **1 case thực tế cụ thể** theo loại hình công ty (sàn giao dịch, ngân hàng, startup SaaS, TMĐT, team vận hành K8s...) đang dùng khái niệm này để giải quyết vấn đề gì — không bịa số liệu/tên công ty thật, nhưng tình huống phải cụ thể, có thể hình dung được ngay, không viết chung chung kiểu "giúp tối ưu hệ thống".

6. **Cấu hình/thiết lập liên quan** (chỉ khi có — vd file, JSON policy, launch template, biến môi trường...): nêu rõ vị trí/tên, cú pháp mẫu, cách chỉnh sửa, và **khi nào thực tế cần đụng tới** (không phải lý thuyết suông). Nếu bài không có gì để cấu hình, bỏ qua mục này.

7. **Vị trí trong kiến trúc (ẩn dụ nhà máy)** — 1-2 câu ẩn dụ CỤ THỂ, không sáo rỗng (vd "DNS là tổng đài nhà máy, /etc/hosts là sổ tay cá nhân tra nhanh hơn nhưng chỉ biết vài số quen"), NGAY SAU ĐÓ phải map chính xác vào vị trí thật trong 1 stack AWS chuẩn (vd nằm giữa tầng nào và tầng nào, thay thế/bổ sung cho service nào). Ẩn dụ chỉ là lối vào, phần map vào kiến trúc thật mới là trọng tâm — không dừng lại ở ẩn dụ suông.

8. **5 câu hỏi ôn tập** — ưu tiên hỏi thẳng vào mục 5 (pattern thực tế) và mục 7 (vị trí kiến trúc), không chỉ hỏi định nghĩa suông. Có đáp án kèm giải thích 1 dòng.

(Không tách lab riêng cho từng bài — lab gộp chung ở cấp section, xem BƯỚC 1.5)

---

## BƯỚC 1.5 — Lab tổng của section (chỉ 1 lab duy nhất, không phải per-bài)

Gộp toàn bộ phần [HOL] liên quan trong section thành **1 lab liền mạch duy nhất**, mô phỏng đúng task 1 kỹ sư mới vào công ty sẽ được giao trong tuần đầu — đi theo thứ tự logic thật (vd: VPC → IAM Role → Bastion → NAT Gateway → tối ưu chi phí bằng VPC Endpoint), trên AWS Free Tier (t2.micro/t3.micro).

Gồm:
- 🧭 **Bối cảnh** ngắn (1-2 câu) — nối lab với 1 tình huống thật đã nêu ở BƯỚC 1.
- **Step-by-step copy-paste được**, mỗi bước có comment ngắn giải thích tại sao làm bước đó (không chỉ giải thích flag).
- **Lệnh verify** cuối lab.
- **Cleanup** đầy đủ.
- **Lưu ý dễ sai/dễ tốn phí**.

(Nếu section quá dài — ước lượng bài kỹ thuật > ~15 bài: chia đôi Part 1/Part 2 theo cụm sub-topic tự nhiên, mỗi part có lab tổng riêng, đặt tên file hậu tố `_p1`/`_p2`.)

---

## BƯỚC 2 — Xuất file GỘP CHO CẢ SECTION

Xuất 2 file DUY NHẤT cho toàn bộ section, đặt tên `SAA-C03_m[X]_[section-slug].md` / `.html` (hoặc `_p1`/`_p2` nếu chia phần).

### File .md
1 file duy nhất, cuộn từ trên xuống là học hết cả section: Module & Section (tên đầy đủ + domain % + danh sách bài, đánh dấu bài "meta") → Roadmap tiến độ (tất cả section cùng module, highlight section đang học) → nội dung từng bài kỹ thuật theo BƯỚC 1 → Lab tổng (BƯỚC 1.5) → Cheat Sheet (gộp cả Exam Cram + Architecture Patterns tóm tắt).

### File .html — Medium-minimalist, full-width thật, sidebar cố định
- **Nền trắng/off-white, serif cho heading (vd Source Serif 4), sans cho body (vd Inter), mono cho code (vd IBM Plex Mono).** Không dùng card viền kiểu dashboard cho phần lý thuyết — dùng bố cục bài viết (article) với hairline divider.
- **Full-bleed 100% chiều rộng thật**: không có container `max-width` nào bọc toàn trang; padding theo `vw` để co giãn theo màn hình; không scroll ngang.
- **Header/nav trên cùng**: tên section + roadmap tiến độ dạng danh sách ngắn ngang hàng (không phải thanh pill to), sticky.
- **Tabbar 4 tab**, sticky ngay dưới nav: **Lý thuyết / Quiz / Lab / Cheat Sheet** (tách Quiz và Lab thành 2 tab riêng, không gộp chung).
- **Sidebar điều hướng bên trái — BẮT BUỘC dùng `position: fixed`, KHÔNG dùng `position: sticky`** (sticky trong grid sẽ bị trôi mất khi nội dung cột bên phải dài hơn cột sidebar). Sidebar liệt kê đủ số bài trong section, có ở tab Lý thuyết và Quiz, tự highlight bài đang xem khi cuộn (scrollspy qua IntersectionObserver), click nhảy nhanh tới bài.
  - Nội dung không nằm trong sidebar phải dùng `margin-left` bằng đúng bề rộng sidebar để tránh đè lên nhau.
  - Phần header/hero phía trên tab-panel cũng phải né sang phải đúng bề rộng sidebar khi đang ở tab có sidebar (toggle bằng class trên `<body>` lúc chuyển tab) — tránh sidebar đè lên hero.
  - Trên mobile (`max-width: 900px`): ẩn hẳn sidebar, trả `margin-left` về 0.
- **Mỗi bài trong tab Lý thuyết dùng layout 2 cột** để lấp đầy chiều rộng: cột trái (prose, ~55-60%) chứa Khái niệm+ví dụ / Pattern nâng cao+case thực tế / Vị trí kiến trúc (ẩn dụ+map thật); cột phải (~40-45%, có thể dài do nhiều bảng) chứa Lệnh + bảng Từ điển flag nhanh + bảng So sánh (nếu có) + bảng Tham số/giới hạn + Cấu hình liên quan (nếu có).
- **Tab Lab**: layout 2 cột — bối cảnh/verify/cleanup/lưu ý bên trái, toàn bộ script lab bên phải trong 1 code block.
- **Tab Quiz**: lưới 2 cột câu hỏi, dạng click-to-reveal đáp án (không cần chấm điểm phức tạp), có sidebar TOC giống tab Lý thuyết.
- **Tab Cheat Sheet**: lưới card 3 cột (không dùng bảng dài 1 cột) để lấp đầy chiều rộng, cộng 1 khối "Pattern chuẩn" nổi bật cuối trang.

---

## ✅ Checklist trước khi xuất

- [ ] Đã kiểm tra BƯỚC -1 (chuyển module) trước khi làm bất cứ gì khác
- [ ] Lệnh/flag/giá cả đúng, không bịa (nếu không chắc → ghi "cần verify")
- [ ] Mỗi bài kỹ thuật có đủ 8 mục: khái niệm+ví dụ → lệnh+từ điển flag → so sánh (nếu có) → tham số/giới hạn → pattern nâng cao+case thực tế → cấu hình (nếu có) → vị trí kiến trúc (ẩn dụ + map thật) → 5 câu quiz
- [ ] Bảng "Từ điển flag nhanh" không bỏ sót flag nào đã dùng ở mục lệnh
- [ ] Ẩn dụ nhà máy ở mục 7 phải đi kèm map cụ thể vào kiến trúc AWS thật, không dừng ở ẩn dụ suông
- [ ] Chỉ 1 lab tổng/section (hoặc /part nếu chia p1/p2) — KHÔNG tách lab riêng từng bài
- [ ] Bài "meta" không bị tách quiz/lab riêng — đã gộp vào Cheat Sheet
- [ ] Đúng 2 file DUY NHẤT cho cả section
- [ ] HTML: full-width thật (không max-width container), sidebar `position: fixed` (không sticky), hero né đúng sidebar, 4 tab đúng như trên, layout 2 cột ở Lý thuyết/Lab, lưới 3 cột ở Cheat Sheet
