# SAA-C03 — Module 6: Vận hành, Bảo mật & Quản trị
## 🔹 Section: Monitoring, Logging, and Auditing (6.18 – 6.31)

**Domain thi liên quan:** Design Resilient Architectures (26%) + Design Secure Architectures (30%) — CloudWatch alarm/metric, CloudTrail, EventBridge automation là nhóm câu hỏi "phát hiện sự cố nhanh nhất" và "audit ai làm gì" xuất hiện dày đặc.

**Danh sách 14 bài trong section:**

| # | Tên bài | Loại |
|---|---|---|
| 6.18 | Introduction | meta |
| 6.19 | Amazon CloudWatch Overview | kỹ thuật |
| 6.20 | [HOL] Create a Custom Metric and Alarm | lab |
| 6.21 | Amazon CloudWatch Logs | kỹ thuật |
| 6.22 | The Unified CloudWatch Agent | kỹ thuật |
| 6.23 | AWS CloudTrail | kỹ thuật |
| 6.24 | [HOL] Create a Trail in AWS CloudTrail | lab |
| 6.25 | Amazon EventBridge (Refresher) | kỹ thuật |
| 6.26 | [HOL] Create EventBridge rule for CloudTrail API calls | lab |
| 6.27 | Metric Analysis and Tracing | kỹ thuật |
| 6.28–6.31 | Exam Cram / Architecture Patterns / Quiz / Cheat Sheets | meta (gộp Cheat Sheet cuối file) |

**Roadmap tiến độ Module 6** (3 section):

- [x] ✅ 🔹 Deployment and Management
- [x] **🔹 Monitoring, Logging, and Auditing** ← đang học (file này)
- [ ] 🔹 Security

---

## 6.19 — Amazon CloudWatch Overview

**1. Khái niệm + ví dụ đời sống**
CloudWatch là dịch vụ giám sát trung tâm của AWS: thu thập **metric** (số liệu theo thời gian, VD CPUUtilization), cho phép tạo **Alarm** (báo động khi metric vượt ngưỡng), và **Dashboard** (bảng hiển thị trực quan). Ví dụ đời sống: giống bảng đồng hồ đo áp suất/nhiệt độ gắn khắp nhà máy — kim chỉ vượt vạch đỏ thì còi báo động (Alarm) kêu ngay, không cần người đứng canh 24/7.

Cơ chế chính:
- Metric mặc định (namespace `AWS/EC2`, `AWS/RDS`...) thu thập tự động mỗi 5 phút (Basic) hoặc 1 phút (Detailed Monitoring, trả phí thêm).
- **Custom Metric**: tự đẩy số liệu riêng của ứng dụng (VD số đơn hàng/phút) bằng `put-metric-data`.
- **Alarm** có 3 trạng thái: OK / ALARM / INSUFFICIENT_DATA.

**2. Lệnh quan trọng**

```bash
aws cloudwatch put-metric-data --namespace "MyApp" \
  --metric-name OrdersPerMinute --value 42   # đẩy custom metric

aws cloudwatch put-metric-alarm --alarm-name high-cpu \
  --metric-name CPUUtilization --namespace AWS/EC2 \
  --statistic Average --period 300 --threshold 80 \
  --comparison-operator GreaterThanThreshold --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:...:topic/ops-alert   # báo động qua SNS khi vượt ngưỡng

aws cloudwatch describe-alarms --state-value ALARM   # xem alarm đang kêu

aws cloudwatch get-metric-statistics --namespace AWS/EC2 \
  --metric-name CPUUtilization --start-time 2026-08-01T00:00:00Z \
  --end-time 2026-08-02T00:00:00Z --period 3600 --statistics Average
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `put-metric-data` | — | Đẩy custom metric của ứng dụng lên CloudWatch |
| `put-metric-alarm` | — | Tạo alarm theo dõi 1 metric |
| `--period` | — | Độ dài 1 khoảng đánh giá (giây), VD 300 = 5 phút |
| `--evaluation-periods` | — | Số khoảng liên tiếp phải vi phạm mới chuyển ALARM (tránh báo động giả do spike tạm thời) |
| `--comparison-operator` | — | Điều kiện so sánh (GreaterThanThreshold, LessThanThreshold...) |
| `describe-alarms` | — | Liệt kê alarm theo trạng thái |

**3. So sánh nhanh**

| Tiêu chí | Basic Monitoring | Detailed Monitoring |
|---|---|---|
| Tần suất | 5 phút | 1 phút |
| Chi phí | Miễn phí | Trả phí thêm |
| Dùng khi | Giám sát thông thường | Cần phát hiện sự cố nhanh (auto scaling nhạy) |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Metric retention | 15 tháng (tự động giảm độ phân giải theo thời gian) | Dữ liệu >63 ngày chỉ còn granularity 1 giờ |
| Custom metric | Trả phí theo số metric + số API call | Cân nhắc gộp nhiều số liệu vào ít metric hơn (dimension) |
| Alarm evaluation periods | Mặc định nên đặt ≥2 | Tránh false alarm do 1 spike ngắn |

**5. Cách dùng nâng cao / pattern thực tế**
Dùng **Composite Alarm** (kết hợp nhiều alarm con bằng AND/OR) để tránh báo động giả — VD chỉ báo thật sự nghiêm trọng khi CPU cao **VÀ** đồng thời queue backlog tăng, tránh spam alert khi chỉ 1 chỉ số tăng đơn lẻ do traffic tạm thời. Case thực tế: sàn TMĐT dịp sale lớn cần alarm "instance sắp quá tải" nhạy hơn bình thường — bật Detailed Monitoring (1 phút) cho ASG trong 3 ngày sale, kết hợp alarm CPU + alarm ALB TargetResponseTime để scale sớm trước khi khách hàng bị timeout, rồi tắt Detailed Monitoring sau sale để tiết kiệm chi phí.

**6. Cấu hình/thiết lập liên quan**
Composite alarm (CLI rút gọn):
```bash
aws cloudwatch put-composite-alarm --alarm-name critical-overload \
  --alarm-rule "ALARM(high-cpu) AND ALARM(high-queue-depth)" \
  --alarm-actions arn:aws:sns:...:topic/pager-duty
```
Thực tế cần đụng tới khi: alarm đơn lẻ gây báo động giả quá nhiều (alert fatigue), cần logic kết hợp điều kiện.

**7. Vị trí trong kiến trúc (nhà máy nền)**
CloudWatch là **lớp phủ mới** — hệ thống **đồng hồ đo + còi báo động** gắn lên mọi trạm trong nhà máy (Xưởng lắp ráp, Sảnh phân luồng, Kho tổng...), không phải 1 trạm xử lý request mà là công cụ quan sát toàn bộ. Đứng cạnh nhóm camera an ninh (GuardDuty, Config) nhưng vai trò khác: đo hiệu suất/tình trạng vận hành, không phải phát hiện bất thường bảo mật.

**8. 5 câu hỏi ôn tập**
1. Muốn tránh báo động giả do 1 spike ngắn, chỉnh tham số nào? → `--evaluation-periods` (tăng số khoảng liên tiếp cần vi phạm).
2. Sàn TMĐT muốn phát hiện quá tải nhạy hơn dịp sale, dùng gì? → Bật Detailed Monitoring (1 phút) tạm thời.
3. Kết hợp nhiều alarm bằng AND/OR để tránh alert fatigue gọi là gì? → Composite Alarm.
4. Metric mặc định lưu tối đa bao lâu? → 15 tháng (giảm granularity theo thời gian).
5. CloudWatch khớp vào đâu trong nhà máy nền? → Lớp phủ đồng hồ đo + còi báo động, gắn lên mọi trạm, khác vai trò với camera an ninh.

---

## 6.21 — Amazon CloudWatch Logs

**1. Khái niệm + ví dụ đời sống**
CloudWatch Logs thu thập, lưu trữ, và cho phép tìm kiếm log text từ EC2, Lambda, RDS, VPC Flow Logs... Log được tổ chức theo **Log Group** (nhóm theo ứng dụng/service) và **Log Stream** (1 nguồn cụ thể trong group, VD 1 instance). Ví dụ đời sống: giống sổ nhật ký ca trực của từng xưởng (log stream), gom chung vào tủ hồ sơ theo từng phân xưởng (log group), có thể tra cứu lại bất cứ lúc nào.

**2. Lệnh quan trọng**

```bash
aws logs create-log-group --log-group-name /myapp/prod

aws logs put-retention-policy --log-group-name /myapp/prod --retention-in-days 30

aws logs filter-log-events --log-group-name /myapp/prod \
  --filter-pattern "ERROR" --start-time 1735689600000   # tìm log lỗi trong khoảng thời gian

aws logs create-log-metric-filter --log-group-name /myapp/prod \
  --filter-name error-count --filter-pattern "ERROR" \
  --metric-transformations metricName=ErrorCount,metricNamespace=MyApp,metricValue=1
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `create-log-group` | — | Tạo nhóm log mới (theo ứng dụng/service) |
| `put-retention-policy` | — | Đặt số ngày giữ log (mặc định giữ vĩnh viễn, tốn phí nếu quên đặt) |
| `filter-log-events` | — | Tìm log theo pattern, khoảng thời gian |
| `create-log-metric-filter` | — | Biến 1 pattern log (VD "ERROR") thành custom metric để tạo alarm |

**3. So sánh nhanh**

| Tiêu chí | CloudWatch Logs | CloudTrail |
|---|---|---|
| Nội dung | Log ứng dụng/hệ thống (text tự do) | Log lệnh API có cấu trúc (ai, khi nào, gọi gì) |
| Nguồn | EC2/Lambda/RDS/VPC Flow Logs... | Mọi API call trong account |
| Dùng khi | Debug lỗi ứng dụng | Audit hành vi/bảo mật |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Retention mặc định | Never expire (giữ vĩnh viễn) | Quên đặt retention → tốn phí lưu trữ tăng dần theo thời gian |
| Kích thước 1 log event | Tối đa 256KB | Log quá dài bị cắt |
| Metric Filter | Biến log pattern → CloudWatch metric | Cho phép alarm trên nội dung log, không chỉ số liệu hệ thống |

**5. Cách dùng nâng cao / pattern thực tế**
Dùng **Metric Filter** để biến tần suất xuất hiện chuỗi `"ERROR"` hoặc `"5xx"` trong log ứng dụng thành 1 CloudWatch metric, sau đó gắn Alarm — phát hiện lỗi ứng dụng ngay cả khi CPU/Memory vẫn bình thường (lỗi logic, không phải lỗi tài nguyên). Case thực tế: 1 team vận hành K8s có hàng chục pod, log được đẩy qua CloudWatch Logs Agent, đặt Metric Filter đếm số dòng `"OutOfMemoryError"` — khi vượt ngưỡng 5 lần/5 phút thì alarm bắn qua SNS, phát hiện sự cố memory leak sớm hơn nhiều so với chờ pod crash rồi mới biết.

**6. Cấu hình/thiết lập liên quan**
Retention policy set qua Console/CLI (không có mặc định an toàn — cần chủ động đặt):
```bash
aws logs put-retention-policy --log-group-name /myapp/prod --retention-in-days 90
```
Thực tế cần đụng tới khi: audit chi phí CloudWatch thấy log group tăng dung lượng vô hạn vì quên đặt retention — đây là lỗi rất phổ biến khi mới setup.

**7. Vị trí trong kiến trúc (nhà máy nền)**
CloudWatch Logs là **nhánh mở rộng** của hệ thống đồng hồ đo (CloudWatch) — thay vì đo số liệu, nó lưu **sổ nhật ký chi tiết dạng chữ** từ mọi trạm (xưởng, sảnh, kho) để tra cứu lại khi cần điều tra sự cố cụ thể.

**8. 5 câu hỏi ôn tập**
1. CloudWatch Logs khác CloudTrail ở điểm nào? → Logs = log ứng dụng/hệ thống tự do; CloudTrail = log API có cấu trúc.
2. Retention mặc định của log group là gì, rủi ro gì nếu không đặt? → Giữ vĩnh viễn, tốn phí lưu trữ tăng dần.
3. Biến pattern "ERROR" trong log thành metric để alarm gọi là gì? → Metric Filter.
4. Team K8s phát hiện memory leak sớm bằng cách nào? → Metric Filter đếm "OutOfMemoryError" + Alarm.
5. CloudWatch Logs khớp vào đâu trong nhà máy nền? → Nhánh mở rộng của CloudWatch, sổ nhật ký chi tiết dạng chữ từ mọi trạm.

---

## 6.22 — The Unified CloudWatch Agent

**1. Khái niệm + ví dụ đời sống**
CloudWatch mặc định (hypervisor-level) chỉ thấy được metric "nhìn từ ngoài" instance (CPU, Network, Disk I/O ở tầng ảo hóa) — **không thấy được bên trong OS** như dung lượng RAM đang dùng hay % ổ đĩa đầy. Unified CloudWatch Agent là phần mềm cài **bên trong** EC2/on-premise server để thu thập thêm các chỉ số "nhìn từ trong" (Memory, Disk Usage theo %) và đẩy log OS lên CloudWatch Logs. Ví dụ đời sống: đồng hồ đo ngoài tường xưởng chỉ biết "xưởng đang hoạt động hay không" (CPU/Network), còn Agent giống 1 nhân viên đứng bên trong xưởng tự báo cáo "kho nguyên liệu bên trong sắp hết" (Memory/Disk usage) — thứ đứng ngoài không thể thấy được.

**2. Lệnh quan trọng**

```bash
# Cài agent trên Amazon Linux
sudo yum install amazon-cloudwatch-agent -y

# Tạo config bằng wizard tương tác
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard

# Khởi chạy agent với config file
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `amazon-cloudwatch-agent-config-wizard` | — | Tạo file config JSON tương tác (chọn metric/log muốn thu thập) |
| `amazon-cloudwatch-agent-ctl` | — | Điều khiển agent (start/stop/status) |
| `-a fetch-config` | action | Nạp config mới cho agent |
| `-m ec2` | mode | Chỉ định môi trường chạy (ec2/onPremise) |

**3. So sánh nhanh**

| Tiêu chí | Metric mặc định (Hypervisor) | Unified CloudWatch Agent |
|---|---|---|
| Phạm vi | Nhìn từ ngoài instance | Nhìn từ trong OS |
| Metric | CPU, Network, Disk I/O, Status Check | + Memory %, Disk Usage %, custom app log |
| Cần cài đặt | Không (tự có) | Có (cài agent + IAM Role cho phép PutMetricData) |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| IAM Role yêu cầu | `CloudWatchAgentServerPolicy` | Instance Role phải có quyền PutMetricData/PutLogEvents |
| Memory Utilization | Không có mặc định, phải cài Agent | Câu thi hay bẫy: tưởng CloudWatch mặc định đã có sẵn Memory metric |

**5. Cách dùng nâng cao / pattern thực tế**
Dùng Agent để đẩy log ứng dụng (VD `/var/log/myapp/*.log`) trực tiếp lên CloudWatch Logs cùng lúc với metric Memory/Disk, gộp chung 1 agent thay vì cài riêng lẻ nhiều tool giám sát. Case thực tế: 1 công ty chạy workload legacy Java trên EC2 hay bị OOM (out of memory) nhưng CPU luôn thấp — team vận hành từng không phát hiện được vì chỉ nhìn CPU/Network mặc định; sau khi cài Unified Agent theo dõi Memory %, thấy rõ pattern rỉ bộ nhớ tăng dần theo giờ, từ đó đặt alarm cảnh báo trước khi OOM crash.

**6. Cấu hình/thiết lập liên quan**
File config JSON (rút gọn) chỉ định metric muốn thu:
```json
{
  "metrics": {"metrics_collected": {"mem": {"measurement": ["mem_used_percent"]}}},
  "logs": {"logs_collected": {"files": {"collect_list": [
    {"file_path": "/var/log/myapp/app.log", "log_group_name": "/myapp/prod"}
  ]}}}
}
```
Thực tế cần đụng tới khi: cần giám sát Memory/Disk mà console EC2 mặc định không có, hoặc cần centralize log ứng dụng.

**7. Vị trí trong kiến trúc (nhà máy nền)**
Unified CloudWatch Agent là **nhánh mở rộng** của hệ thống đồng hồ đo (CloudWatch) — đặt "cảm biến bên trong" từng máy trong Xưởng lắp ráp (EC2), bổ sung thứ đồng hồ đo ngoài tường (metric mặc định) không thấy được.

**8. 5 câu hỏi ôn tập**
1. Vì sao CloudWatch mặc định không thấy % RAM đang dùng? → Chỉ đo ở tầng hypervisor (ngoài instance), không thấy bên trong OS.
2. Muốn có Memory Utilization metric, cần làm gì? → Cài Unified CloudWatch Agent.
3. Agent cần quyền IAM gì để hoạt động? → CloudWatchAgentServerPolicy (PutMetricData/PutLogEvents).
4. Case Java OOM ở trên phát hiện được nhờ gì? → Theo dõi Memory % qua Agent, thấy pattern rỉ bộ nhớ.
5. Agent khớp vào đâu trong nhà máy nền? → Nhánh mở rộng CloudWatch, cảm biến bên trong từng máy ở Xưởng lắp ráp.

---

## 6.23 — AWS CloudTrail

**1. Khái niệm + ví dụ đời sống**
CloudTrail ghi lại **mọi lệnh gọi API** trong account (ai, khi nào, từ IP nào, gọi hành động gì, thành công hay bị từ chối) — bật mặc định 90 ngày (Event history), nhưng để lưu lâu dài/nhiều region cần tạo **Trail** ghi log vào S3. Ví dụ đời sống: giống camera an ninh ghi hình + sổ ra vào ở MỌI cửa trong nhà máy, ghi lại "ai mở cửa nào lúc mấy giờ" — không phải để biết cửa đang mở hay đóng (đó là việc của Config), mà để biết **ai đã làm hành động đó**.

2 loại event:
- **Management events**: hành động quản trị (tạo/xóa EC2, sửa IAM policy...) — bật mặc định.
- **Data events**: hành động ở mức dữ liệu (VD GetObject/PutObject trên S3, Lambda Invoke) — phải bật thêm, tốn phí cao hơn vì tần suất lớn.

**2. Lệnh quan trọng**

```bash
aws cloudtrail create-trail --name org-trail \
  --s3-bucket-name my-cloudtrail-logs --is-multi-region-trail

aws cloudtrail start-logging --name org-trail

aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=Username,AttributeValue=alice \
  --max-results 10   # tra cứu 90 ngày gần nhất không cần trail

aws cloudtrail put-event-selectors --trail-name org-trail \
  --event-selectors '[{"ReadWriteType":"All","DataResources":[{"Type":"AWS::S3::Object","Values":["arn:aws:s3:::my-bucket/"]}]}]'
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `create-trail` | — | Tạo trail ghi log liên tục vào S3 |
| `--is-multi-region-trail` | — | Ghi log API call ở TẤT CẢ region, không chỉ region hiện tại |
| `start-logging` | — | Bật ghi log cho trail đã tạo |
| `lookup-events` | — | Tra cứu Event History 90 ngày (không cần trail, miễn phí) |
| `put-event-selectors` | — | Cấu hình ghi thêm Data events (VD S3 object-level) |

**3. So sánh nhanh**

| Tiêu chí | Event History (mặc định) | Trail (tự tạo) |
|---|---|---|
| Thời gian lưu | 90 ngày | Vô thời hạn (lưu trong S3) |
| Phạm vi region | Chỉ xem qua console từng region | Multi-region nếu bật |
| Data events | Không có | Có thể bật thêm |
| Chi phí | Miễn phí | Trả phí S3 storage + Data events |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Event History mặc định | 90 ngày, chỉ Management events | Không cần cấu hình, luôn bật sẵn |
| Log file integrity validation | Tùy chọn bật thêm | Dùng hash để chứng minh log không bị chỉnh sửa — quan trọng cho compliance/forensic |
| Data events | Tính phí theo số event | S3/Lambda data event volume lớn, cân nhắc trước khi bật toàn bộ |

**5. Cách dùng nâng cao / pattern thực tế**
Bật **Log file integrity validation** khi cần dùng CloudTrail log làm bằng chứng pháp lý/forensic — chứng minh log gốc chưa bị ai chỉnh sửa sau khi ghi. Case thực tế: sau khi phát hiện 1 S3 bucket nhạy cảm bị truy cập lạ, đội security dùng `lookup-events` lọc theo `EventName=GetObject` và `Username` để xác định chính xác IAM user/role nào đã đọc file đó, từ IP nào, tại thời điểm nào — dựng lại toàn bộ timeline sự cố mà không cần dựa vào ước đoán.

**6. Cấu hình/thiết lập liên quan**
Bật integrity validation lúc tạo trail:
```bash
aws cloudtrail update-trail --name org-trail --enable-log-file-validation
```
Thực tế cần đụng tới khi: công ty cần tuân thủ chuẩn bảo mật (SOC2, PCI-DSS) yêu cầu chứng minh log không bị giả mạo.

**7. Vị trí trong kiến trúc (nhà máy nền)**
CloudTrail khớp vào **lớp phủ camera an ninh** — nhưng khác Config (kiểm tra trạng thái) và GuardDuty (phát hiện kẻ lạ): CloudTrail là **sổ ghi "ai mở cửa nào lúc mấy giờ"**, ghi lại hành động của mọi người có thẻ ra vào hợp lệ lẫn bất hợp lệ.

**8. 5 câu hỏi ôn tập**
1. Event History mặc định lưu bao lâu, không cần cấu hình gì? → 90 ngày, chỉ Management events.
2. Muốn ghi log API call ở tất cả region, dùng flag nào? → `--is-multi-region-trail`.
3. Data events khác Management events ở điểm nào? → Data events là hành động mức dữ liệu (S3 GetObject, Lambda Invoke), phải bật thêm và tốn phí cao hơn.
4. Chứng minh log CloudTrail chưa bị chỉnh sửa dùng tính năng gì? → Log file integrity validation.
5. CloudTrail khớp vào đâu trong nhà máy nền? → Lớp phủ camera an ninh, sổ ghi ai làm hành động gì (khác Config = kiểm tra trạng thái, GuardDuty = phát hiện kẻ lạ).

---

## 6.25 — Amazon EventBridge (Refresher)

**1. Khái niệm + ví dụ đời sống**
EventBridge (đã học sơ ở Module 5) là "bảng thông báo" nhận **event** từ AWS service, ứng dụng riêng, hoặc SaaS bên thứ 3, rồi định tuyến (route) tới target dựa trên **rule** (pattern matching trên nội dung event) — không cần các trạm gọi trực tiếp lẫn nhau. Trong bài này, trọng tâm là kết hợp với **CloudTrail** để tạo automation phản ứng theo hành vi API thời gian thực, khác với Config Auto Remediation (phản ứng theo trạng thái cấu hình).

**2. Lệnh quan trọng**

```bash
aws events put-rule --name detect-root-login \
  --event-pattern '{"source":["aws.signin"],"detail-type":["AWS Console Sign In via CloudTrail"],"detail":{"userIdentity":{"type":["Root"]}}}'

aws events put-targets --rule detect-root-login \
  --targets '[{"Id":"1","Arn":"arn:aws:sns:...:topic/security-alert"}]'

aws events list-rules   # xem các rule đang cấu hình
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `put-rule` | — | Tạo rule với event pattern để match |
| `--event-pattern` | — | JSON mô tả điều kiện match event (source, detail-type, detail) |
| `put-targets` | — | Gắn target (Lambda/SNS/SQS/Step Functions...) nhận event khi rule match |

**3. So sánh nhanh**

| Tiêu chí | EventBridge + CloudTrail | Config Auto Remediation |
|---|---|---|
| Trigger theo | Hành động API xảy ra (real-time) | Trạng thái cấu hình lệch chuẩn |
| Độ trễ | Gần tức thời | Theo chu kỳ đánh giá Config rule |
| Ví dụ dùng | Phát hiện root login → alert ngay | Phát hiện S3 public → tự sửa lại private |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Số target / rule | Tối đa 5 | Cần SNS fan-out nếu muốn gửi nhiều nơi hơn |
| Event bus | Default bus nhận event AWS service tự động | Custom bus cho ứng dụng riêng |

**5. Cách dùng nâng cao / pattern thực tế**
Kết hợp EventBridge rule match trực tiếp trên CloudTrail management event (không cần đợi SNS/Lambda trung gian) để phản ứng gần như tức thời với hành vi nhạy cảm (VD ai đó login bằng root account, hoặc gọi `DeleteTrail`/`StopLogging` — dấu hiệu điển hình của kẻ tấn công cố xóa dấu vết). Case thực tế: đội security ở 1 công ty fintech đặt rule EventBridge bắt sự kiện `StopLogging`/`DeleteTrail` trên CloudTrail, target thẳng vào Lambda tự động bật lại logging + gửi cảnh báo khẩn cấp qua SNS tới on-call engineer trong vài giây, thay vì phải chờ phát hiện thủ công.

**6. Cấu hình/thiết lập liên quan**
Event pattern phát hiện hành vi xóa dấu vết:
```json
{"source": ["aws.cloudtrail"], "detail-type": ["AWS API Call via CloudTrail"],
 "detail": {"eventName": ["StopLogging", "DeleteTrail"]}}
```
Thực tế cần đụng tới khi: cần giám sát chủ động (proactive) các hành vi bảo mật nhạy cảm thay vì chỉ tra cứu log sau sự cố.

**7. Vị trí trong kiến trúc (nhà máy nền)**
EventBridge vẫn đúng vị trí **hệ thống loa phóng thanh & bảng thông báo** đã có từ Module 5 — ở đây chỉ mở rộng thêm nguồn phát tin là **CloudTrail** (camera an ninh), biến việc ghi log thành hành động phản ứng tức thời thay vì chỉ lưu trữ thụ động.

**8. 5 câu hỏi ôn tập**
1. EventBridge+CloudTrail khác Config Auto Remediation ở tốc độ phản ứng thế nào? → Gần tức thời (theo hành động API) vs theo chu kỳ đánh giá rule.
2. Dấu hiệu điển hình kẻ tấn công cố xóa dấu vết trên CloudTrail là gì? → Gọi `StopLogging`/`DeleteTrail`.
3. 1 rule EventBridge gắn tối đa bao nhiêu target? → 5.
4. Fintech company dùng EventBridge+Lambda để làm gì khi phát hiện StopLogging? → Tự động bật lại logging + cảnh báo SNS ngay.
5. EventBridge khớp vào đâu trong nhà máy nền? → Vẫn là hệ thống loa phóng thanh/bảng thông báo (từ Module 5), nay nhận thêm tin từ CloudTrail.

---

## 6.27 — Metric Analysis and Tracing

**1. Khái niệm + ví dụ đời sống**
Khi hệ thống có nhiều microservice/Lambda gọi lẫn nhau, 1 request chậm có thể do bất kỳ service nào trong chuỗi — **AWS X-Ray** giúp "vẽ bản đồ" đường đi của 1 request qua từng service (gọi là **trace**, gồm nhiều **segment**/**subsegment**), đo thời gian ở từng chặng để biết chính xác chặng nào chậm. Ví dụ đời sống: giống gắn định vị GPS vào từng lô hàng đi qua nhiều trạm trong nhà máy — biết chính xác lô hàng bị kẹt ở trạm nào, mất bao lâu ở mỗi trạm, thay vì chỉ biết "đơn hàng giao trễ" chung chung.

**2. Lệnh quan trọng**

```bash
# Cài X-Ray daemon/SDK trong ứng dụng (Node.js ví dụ)
npm install aws-xray-sdk

aws xray get-trace-summaries --start-time 2026-08-01T00:00:00 \
  --end-time 2026-08-01T01:00:00   # liệt kê trace trong khoảng thời gian

aws xray get-service-graph --start-time 2026-08-01T00:00:00 \
  --end-time 2026-08-01T01:00:00   # bản đồ dependency giữa các service
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| X-Ray | — | Dịch vụ distributed tracing của AWS |
| Segment | — | Dữ liệu thời gian xử lý ở 1 service |
| Subsegment | — | Chi tiết hơn trong 1 segment (VD gọi DB, gọi API ngoài) |
| `get-service-graph` | — | Trả về sơ đồ quan hệ + latency giữa các service |

**3. So sánh nhanh**

| Tiêu chí | CloudWatch Metric | X-Ray Trace |
|---|---|---|
| Câu hỏi trả lời | "Hệ thống có đang chậm/lỗi không?" (tổng quan) | "Chậm ở đâu, tại sao?" (chi tiết từng chặng) |
| Dữ liệu | Số liệu tổng hợp theo thời gian | Đường đi chi tiết của từng request |
| Dùng cùng nhau | Alarm phát hiện vấn đề | X-Ray điều tra nguyên nhân gốc |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ý nghĩa | Ghi chú |
|---|---|---|
| Sampling rate mặc định | 1 request/giây + 5% số request còn lại | Tránh trace 100% gây overhead/chi phí lớn |
| Retention trace | 30 ngày | Sau đó cần export nếu cần lưu lâu hơn |

**5. Cách dùng nâng cao / pattern thực tế**
Tùy chỉnh **sampling rule** để trace 100% các request tới 1 API endpoint quan trọng (VD checkout) trong khi vẫn giữ sampling rate thấp cho các endpoint ít quan trọng — cân bằng giữa độ chi tiết điều tra và chi phí. Case thực tế: hệ thống microservices của sàn TMĐT có luồng checkout đi qua 5 service (cart → inventory → payment → order → notification); khi khách báo "thanh toán bị treo", đội dev dùng X-Ray Service Graph thấy ngay **payment service** có latency p99 tăng đột biến do gọi API ngân hàng ngoài chậm — khoanh vùng nguyên nhân trong vài phút thay vì phải soát log từng service riêng lẻ.

**6. Cấu hình/thiết lập liên quan**
Sampling rule ưu tiên endpoint quan trọng:
```json
{"rules": [{"description": "checkout-full-trace", "host": "*", "http_method": "POST",
  "url_path": "/checkout", "fixed_target": 1, "rate": 1.0}]}
```
Thực tế cần đụng tới khi: cần điều tra sâu 1 luồng nghiệp vụ quan trọng mà sampling mặc định (5%) không đủ dữ liệu để phân tích.

**7. Vị trí trong kiến trúc (nhà máy nền)**
X-Ray là **nhánh mở rộng** của hệ thống đồng hồ đo (CloudWatch) — thay vì đo từng trạm riêng lẻ, nó gắn **định vị GPS theo từng lô hàng (request)** xuyên suốt nhiều trạm, cho biết chính xác lô hàng bị kẹt ở trạm nào trong chuỗi Sảnh phân luồng → Xưởng lắp ráp → Kho tổng → Thợ thời vụ.

**8. 5 câu hỏi ôn tập**
1. X-Ray trả lời câu hỏi gì mà CloudWatch Metric không trả lời được? → Chậm ở chặng/service nào cụ thể trong 1 request, không chỉ "có chậm không".
2. Sampling rate mặc định của X-Ray là gì? → 1 request/giây + 5% số còn lại.
3. Muốn trace 100% cho 1 API quan trọng, làm gì? → Tùy chỉnh Sampling Rule riêng cho endpoint đó.
4. Case sàn TMĐT phát hiện checkout treo do đâu, bằng công cụ gì? → Payment service latency tăng do gọi API ngân hàng ngoài chậm, phát hiện qua X-Ray Service Graph.
5. X-Ray khớp vào đâu trong nhà máy nền? → Nhánh mở rộng CloudWatch, định vị GPS theo từng request xuyên suốt các trạm.

---

## 🧪 BƯỚC 1.5 — Lab tổng: Dựng hệ thống giám sát + audit toàn diện

🧭 **Bối cảnh:** Sếp yêu cầu bạn thiết lập giám sát cho 1 app đang chạy trên EC2: theo dõi Memory (mặc định không có), báo động khi có lỗi trong log, ghi lại mọi hành động API để audit, và tự động cảnh báo khi có ai cố xóa dấu vết log.

```bash
# ===== BƯỚC 1: Custom metric + alarm cơ bản (bài 6.19/6.20) =====
aws cloudwatch put-metric-alarm --alarm-name high-cpu \
  --metric-name CPUUtilization --namespace AWS/EC2 \
  --statistic Average --period 300 --threshold 80 \
  --comparison-operator GreaterThanThreshold --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:ap-southeast-1:123456789012:topic/ops-alert

# ===== BƯỚC 2: Cài Unified CloudWatch Agent để thấy Memory (bài 6.22) =====
sudo yum install amazon-cloudwatch-agent -y
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
# verify: metric mem_used_percent xuất hiện trong namespace CWAgent sau vài phút

# ===== BƯỚC 3: Log group + metric filter báo lỗi ứng dụng (bài 6.21) =====
aws logs create-log-group --log-group-name /myapp/prod
aws logs put-retention-policy --log-group-name /myapp/prod --retention-in-days 30
aws logs create-log-metric-filter --log-group-name /myapp/prod \
  --filter-name error-count --filter-pattern "ERROR" \
  --metric-transformations metricName=ErrorCount,metricNamespace=MyApp,metricValue=1
aws cloudwatch put-metric-alarm --alarm-name app-error-spike \
  --metric-name ErrorCount --namespace MyApp --statistic Sum --period 300 \
  --threshold 5 --comparison-operator GreaterThanThreshold --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:ap-southeast-1:123456789012:topic/ops-alert

# ===== BƯỚC 4: Bật CloudTrail ghi mọi hành động API (bài 6.23/6.24) =====
aws s3 mb s3://my-cloudtrail-logs-2026
aws cloudtrail create-trail --name org-trail \
  --s3-bucket-name my-cloudtrail-logs-2026 --is-multi-region-trail
aws cloudtrail update-trail --name org-trail --enable-log-file-validation
aws cloudtrail start-logging --name org-trail

# ===== BƯỚC 5: EventBridge rule tự cảnh báo khi ai cố xóa dấu vết (bài 6.25/6.26) =====
aws events put-rule --name detect-trail-tamper \
  --event-pattern '{"source":["aws.cloudtrail"],"detail-type":["AWS API Call via CloudTrail"],"detail":{"eventName":["StopLogging","DeleteTrail"]}}'
aws events put-targets --rule detect-trail-tamper \
  --targets '[{"Id":"1","Arn":"arn:aws:sns:ap-southeast-1:123456789012:topic/security-alert"}]'

# ===== VERIFY =====
aws cloudwatch describe-alarms --alarm-names high-cpu app-error-spike
aws logs filter-log-events --log-group-name /myapp/prod --filter-pattern "ERROR"
aws cloudtrail get-trail-status --name org-trail
aws events list-rules --name-prefix detect-trail-tamper

# ===== CLEANUP =====
aws events remove-targets --rule detect-trail-tamper --ids 1
aws events delete-rule --name detect-trail-tamper
aws cloudtrail stop-logging --name org-trail
aws cloudtrail delete-trail --name org-trail
aws s3 rb s3://my-cloudtrail-logs-2026 --force
aws logs delete-log-group --log-group-name /myapp/prod
aws cloudwatch delete-alarms --alarm-names high-cpu app-error-spike
```

**⚠️ Lưu ý dễ sai/dễ tốn phí:**
- Quên `put-retention-policy` cho log group → log giữ vĩnh viễn, chi phí S3-like storage tăng dần âm thầm.
- CloudTrail multi-region trail ghi log ở TẤT CẢ region kể cả region không dùng — S3 bucket phí lưu trữ tăng nếu không có lifecycle rule dọn log cũ.
- Unified CloudWatch Agent cần IAM Role có `CloudWatchAgentServerPolicy` gắn vào instance profile — thiếu quyền agent sẽ chạy nhưng không đẩy được metric (dễ tưởng nhầm agent bị lỗi).
- Data events trên CloudTrail (nếu bật) tính phí theo số lượng — không bật tràn lan cho mọi S3 bucket nếu không thật sự cần audit chi tiết mức object.

---

## 📋 Cheat Sheet — Monitoring, Logging, and Auditing

**Exam Cram nhanh:**
- CloudWatch = đo số liệu + báo động (metric/alarm). CloudWatch Logs = lưu log text tìm kiếm được. Đừng nhầm 2 cái.
- Metric mặc định chỉ thấy "ngoài" instance (CPU/Network/Disk I/O) — muốn Memory/Disk usage % phải cài **Unified CloudWatch Agent**. Đây là bẫy thi rất hay gặp.
- CloudTrail = ai gọi API gì (audit hành vi). Event History mặc định 90 ngày miễn phí; muốn lưu lâu/multi-region phải tạo Trail + S3.
- EventBridge + CloudTrail = phản ứng gần tức thời theo hành vi API; Config Auto Remediation = phản ứng theo chu kỳ đánh giá trạng thái cấu hình. Khác nhau về tốc độ và cơ chế trigger.
- X-Ray = biết CHÍNH XÁC request chậm ở chặng/service nào trong kiến trúc microservices — dùng cùng CloudWatch (biết CÓ chậm không) để điều tra nguyên nhân gốc.

**Architecture Patterns hay gặp:**
- Phát hiện lỗi ứng dụng dù CPU/Memory bình thường → CloudWatch Logs Metric Filter + Alarm.
- Giám sát Memory/Disk trên EC2 → Unified CloudWatch Agent.
- Audit + forensic sau sự cố bảo mật → CloudTrail lookup-events + Log file integrity validation.
- Phát hiện hành vi xóa dấu vết log (StopLogging/DeleteTrail) → EventBridge rule + Lambda/SNS phản ứng ngay.
- Điều tra latency trong kiến trúc microservices/Lambda → AWS X-Ray Service Graph + Sampling Rule tùy chỉnh cho endpoint quan trọng.

---

## 🏭 Trạm mới thêm vào nhà máy nền ở section này

- **CloudWatch (metric/alarm)** — lớp phủ mới: hệ thống đồng hồ đo + còi báo động gắn lên mọi trạm, khác vai trò camera an ninh (GuardDuty/Config).
- **CloudWatch Logs** — nhánh mở rộng của CloudWatch: sổ nhật ký chi tiết dạng chữ từ mọi trạm.
- **Unified CloudWatch Agent** — nhánh mở rộng: cảm biến bên trong từng máy ở Xưởng lắp ráp (EC2), thấy được thứ đồng hồ ngoài tường không thấy (Memory/Disk).
- **CloudTrail** — lớp phủ camera an ninh: sổ ghi ai mở cửa nào lúc mấy giờ (khác Config = kiểm tra trạng thái).
- **EventBridge** — không phải trạm mới (đã có từ Module 5), chỉ mở rộng nguồn phát tin từ CloudTrail để phản ứng tức thời với hành vi API nhạy cảm.
- **AWS X-Ray** — nhánh mở rộng của CloudWatch: định vị GPS theo từng request xuyên suốt nhiều trạm trong chuỗi xử lý.
