# SAA-C03 · Module 7 — Mở rộng & Về đích
## 🔹 Section: Full-Length Practice Exam + Final Exam Preparation (7.25 – 7.27)

> ⚠️ Section này **không áp dụng format 8-mục/4-tab** như các section trước — vì đây không phải service AWS cụ thể mà là 2 bài về **chiến thuật thi** + **1 bài thi thử tổng**. Nội dung dưới đây là 1 file tips ngắn gọn.

**Danh sách bài:**

| Bài | Tên | Loại |
|---|---|---|
| 7.25 | AWS Certified Solutions Architect Associate Practice Exam | Bài thi thử tổng (65 câu, mô phỏng đề thật) |
| 7.26 | Study & Exam Preparation Tips | Chiến thuật ôn thi + làm bài |
| 7.27 | Bonus Lesson | Ghi chú thêm cuối khóa (thường là lời khuyên tổng kết + hướng dẫn đăng ký thi thật) |

---

## 🗺️ Roadmap tiến độ — Module 7 (hoàn tất)

- [x] ✅ 🔹 Migration and Transfer (7.1–7.12)
- [x] ✅ 🔹 Web, Mobile, ML, and Cost Management (7.13–7.24)
- [x] ✅ **🔹 Full-Length Practice Exam + Final Exam Preparation (7.25–7.27)** ← đang học
- [x] ✅ **TOÀN BỘ ROADMAP SAA-C03 (Module 1 → 7) ĐÃ HOÀN THÀNH**

🎉 Đây là section cuối cùng của toàn bộ roadmap. Sau section này, bước tiếp theo là **luyện đề thật + đăng ký thi**, không còn nội dung lý thuyết mới nào trong khóa.

---

## 📝 7.25 — Full-Length Practice Exam: cách khai thác cho đúng

Bài 7.25 là 1 bài thi thử ~65 câu mô phỏng cấu trúc đề thật (thời gian ~130 phút). Đừng chỉ "làm cho xong" — cách dùng đúng:

1. **Làm nghiêm túc như thi thật lần đầu**: đủ thời gian, không tra cứu, không dừng giữa chừng. Mục đích là đo điểm xuất phát thật, không phải để học kiến thức mới.
2. **Sau khi nộp bài, review TỪNG câu sai** — kể cả câu đúng nhưng bạn "đoán mò" hoặc phân vân giữa 2 đáp án. Ghi lại vào 1 file riêng: `câu hỏi → vì sao mình chọn sai → khái niệm cần ôn lại`.
3. **Phân loại lỗi sai theo domain** (Resilient/High-Performing/Secure/Cost-Optimized) để biết mình yếu domain nào nhất — đối chiếu với tỷ trọng thi thật (Secure 30% > Resilient 26% > High-Performing 24% > Cost 20%) để ưu tiên ôn đúng chỗ ảnh hưởng điểm nhiều nhất.
4. **Làm lại bài thi thử sau 1–2 tuần ôn tập bổ sung** (nếu khóa có nhiều hơn 1 bài practice exam, hoặc dùng bộ đề khác) — so sánh điểm để đo tiến bộ thật, không chỉ "nhớ đáp án cũ".

> ⚠️ Đừng học thuộc đáp án của bài practice exam để "được điểm cao" — đề thi thật sẽ không lặp lại y hệt câu hỏi. Mục tiêu là hiểu **vì sao** đáp án đó đúng, để áp dụng được cho câu hỏi khác cùng chủ đề.

---

## 🎯 7.26 — Study & Exam Preparation Tips (chiến thuật ôn thi + làm bài)

### Trước khi thi
- Ôn lại toàn bộ **Cheat Sheet** đã gộp ở cuối mỗi section trong suốt 7 module — đây là bản tóm tắt cô đọng nhất, hiệu quả hơn đọc lại toàn bộ transcript.
- Đảm bảo nắm chắc các cặp dịch vụ **hay bị nhầm lẫn** xuyên suốt khóa (ví dụ: ALB vs NLB, S3 Standard vs IA vs Glacier, RDS vs Aurora, SQS vs SNS vs EventBridge, DMS vs MGN, Security Group vs NACL...) — đề thi SAA-C03 rất hay khai thác đúng những cặp này bằng tình huống thực tế thay vì hỏi định nghĩa suông.
- Rà lại phần **Giới hạn/tham số** (con số cụ thể: quota, TTL, kích thước tối đa...) đã ghi trong từng bài — đề thi hay hỏi trực tiếp các con số này.

### Trong lúc thi
- **Đọc kỹ từ khóa yêu cầu** trong câu hỏi: "MOST cost-effective", "LEAST operational overhead", "HIGHLY available", "MINIMUM downtime" — mỗi từ khóa định hướng tới 1 domain/tiêu chí khác nhau, nhiều đáp án "đúng về mặt kỹ thuật" nhưng sai vì không khớp đúng tiêu chí câu hỏi yêu cầu.
- **Loại trừ trước, chọn sau**: thường có 2/4 đáp án sai rõ ràng (vi phạm best practice cơ bản) — loại 2 đáp án đó trước, sau đó so sánh kỹ 2 đáp án còn lại theo đúng từ khóa yêu cầu.
- **Đánh dấu "Flag for review"** với câu phân vân, làm hết các câu chắc chắn trước, quay lại sau — tránh mất thời gian quá lâu ở 1 câu khó ngay từ đầu.
- Quản lý thời gian: ~130 phút cho 65 câu ≈ **2 phút/câu** — nếu 1 câu mất hơn 3 phút mà vẫn phân vân, flag lại và đi tiếp.

### Sau khi thi (nếu chưa đạt)
- AWS cho phép thi lại sau **14 ngày** kể từ lần thi gần nhất — dùng báo cáo điểm theo domain (score report) để biết chính xác domain nào cần ôn thêm trước khi đăng ký thi lại.

---

## 📌 7.27 — Bonus Lesson (ghi chú thêm cuối khóa)

Phần này trong khóa gốc thường là lời khuyên tổng kết + hướng dẫn thực tế đăng ký thi (đặt lịch qua Pearson VUE/PSI, chọn thi tại trung tâm hay online proctored, mang giấy tờ gì). Vì không phải nội dung kỹ thuật, chỉ tóm tắt các điểm cần nhớ:

- Kiểm tra kỹ **giấy tờ tùy thân** hợp lệ theo yêu cầu của đơn vị tổ chức thi trước ngày thi ít nhất vài ngày.
- Nếu thi online proctored: kiểm tra không gian thi (bàn trống, không có giấy/màn hình thứ 2), test camera/mic trước giờ thi.
- Certification (nếu đậu) có hiệu lực theo thời hạn quy định của AWS — nhớ note lịch để lên kế hoạch renew/recertify sau này.

---

## ✅ Checklist ôn thi cuối cùng (tổng hợp toàn khóa)

- [ ] Đã làm ít nhất 1 bài Full-Length Practice Exam nghiêm túc, review hết câu sai
- [ ] Đã rà lại Cheat Sheet của **cả 7 module** (không chỉ Module 7)
- [ ] Nắm chắc các cặp dịch vụ dễ nhầm xuyên suốt khóa (xem danh sách ở mục 7.26)
- [ ] Nắm chắc các con số giới hạn/tham số hay ra thi (không cần nhớ tuyệt đối, nhưng biết tra nhanh)
- [ ] Hiểu rõ ý nghĩa 4 domain thi và tỷ trọng: Design Secure (30%) > Design Resilient (26%) > Design High-Performing (24%) > Design Cost-Optimized (20%)
- [ ] Đã luyện tập kỹ năng đọc từ khóa yêu cầu trong câu hỏi (MOST/LEAST/HIGHLY/MINIMUM...)
- [ ] Đã chuẩn bị giấy tờ + kiểm tra hình thức thi (tại trung tâm hoặc online proctored)

---

## 🏭 Trạm mới thêm vào nhà máy nền ở section này

Không có — section này là chiến thuật ôn thi + thi thử, không phải service AWS mới nên **không thêm trạm nào vào nhà máy nền**. Bản đồ nhà máy nền tại thời điểm này đã đầy đủ toàn bộ Module 1 → 7, sẵn sàng dùng làm bản tổng ôn thi cuối cùng.
