# Thuật ngữ nghiệp vụ Nexus

Tài liệu tham chiếu cho trợ lý và người dùng. Khi câu hỏi dùng các từ dưới đây, hiểu theo đúng định nghĩa này.

## Khách hàng

- **Khách hàng (customer)**: một doanh nghiệp đang dùng Nexus. Id dạng `cus_` + số, ví dụ `cus_007`.
- **Thành phố**: nơi đặt văn phòng chính của khách. Chỉ có 5 giá trị: Hà Nội, Hải Phòng, TP.HCM, Đà Nẵng, Cần Thơ.
- **Khách mới**: khách có ngày tạo (`createdAt`) nằm trong tuần báo cáo.

## Gói dịch vụ (tier)

- **free**: miễn phí, không có hỗ trợ trực tiếp.
- **pro**: trả phí theo tháng, hỗ trợ trong giờ hành chính.
- **enterprise**: hợp đồng năm, có người phụ trách riêng.
- **Nâng gói (upgrade)**: đổi từ free → pro, pro → enterprise hoặc free → enterprise. Chiều ngược lại là **hạ gói (downgrade)**.

## Chỉ số

- **MRR (Monthly Recurring Revenue)**: doanh thu định kỳ hằng tháng, chỉ tính khách gói pro và enterprise.
- **Churn**: khách rời bỏ (bị xóa khỏi hệ thống) trong kỳ. Tỷ lệ churn = số khách rời bỏ / số khách đầu kỳ.
- **Tuần báo cáo**: từ 00:00 thứ Hai tới 23:59 Chủ nhật, giờ Việt Nam (Asia/Ho_Chi_Minh).

## Nhóm nội bộ

- **sales**: quan tâm khách mới và nâng gói.
- **cs** (customer success): quan tâm khách enterprise, hạ gói và churn.
- **finance**: quan tâm MRR và tỷ giá quy đổi.
