---
title: Elastic Load Balancing and Auto Scaling
slug: elastic-load-balancing-auto-scaling
topic: aws-saa-c03
order: 44
module: 2
moduleTitle: Compute & Identity Foundations
kind: section
---

# Module 2 — Elastic Load Balancing and Auto Scaling
Bài 2.44–2.62 · Domain thi: Resilient Architectures 26% · High-Performing Architectures 24%

Bài kỹ thuật: 2.45 Scaling Up vs Scaling Out · 2.46 EC2 Auto Scaling · 2.48 HA & Fault Tolerance · 2.49 Elastic Load Balancing · 2.50 ALB and NLB Deployments · 2.52 EC2 Scaling Policies · 2.54 Cross-Zone Load Balancing · 2.55 Session State and Session Stickiness · 2.56 Secure Listeners for ELB
Bài meta *(gộp Cheat Sheet)*: 2.44 Introduction · 2.59 Exam Cram · 2.60 Architecture Patterns · 2.61 Quiz · 2.62 Cheat Sheets
Bài HOL *(gộp Lab tổng)*: 2.47 · 2.51 · 2.53 · 2.57 · 2.58

---

## 🗺️ Roadmap tiến độ Module 2

| # | Section | Bài | Trạng thái |
|---|---|---|---|
| 1 | AWS IAM | 2.1–2.16 | ✅ Đã học |
| 2a | Amazon EC2 — Part 1: Core & Networking | 2.17–2.35 | ✅ Đã học |
| 2b | Amazon EC2 — Part 2: Lifecycle & Pricing | 2.36–2.43 | ✅ Đã học |
| **3** | **Elastic Load Balancing and Auto Scaling** | **2.44–2.62** | **👉 Đang học** |
| 4 | AWS Organizations and Control Tower | 2.63–2.72 | ⏳ Chưa học |

---

## 2.45 — Scaling Up vs Scaling Out

### 1. Khái niệm + ví dụ đời sống
Scale Up (vertical) = nâng cấp instance mạnh hơn. Scale Out (horizontal) = thêm nhiều instance cùng loại chạy song song. Giống quán ăn đông khách: Scale Up là xây bếp lớn hơn cho 1 đầu bếp giỏi hơn (có trần công suất), Scale Out là thuê thêm nhiều đầu bếp làm cùng lúc (gần như không giới hạn nếu bếp đủ rộng).

### 2. Lệnh quan trọng
Không có lệnh riêng — đây là quyết định kiến trúc trước khi cấu hình ASG/ELB.

📖 **Từ điển flag nhanh**

Không áp dụng.

### 3. So sánh nhanh

| | Scale Up | Scale Out |
|---|---|---|
| Cách làm | Đổi instance lớn hơn | Thêm instance cùng loại |
| Downtime | Có (stop/resize) | Không (nếu stateless) |
| Giới hạn | Có trần | Gần như không giới hạn |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Điều kiện Scale Out | App phải stateless | Session/state lưu ngoài instance (ElastiCache, DynamoDB) |

### 5. Cách dùng nâng cao / pattern thực tế
```bash
aws ec2 modify-instance-attribute --instance-id i-xxxx --instance-type t3.xlarge
# resize instance — CẦN stop trước, không thể đổi type khi đang running
```
TMĐT/sàn giao dịch thiết kế app tier stateless ngay từ đầu (session ở Redis/DynamoDB) để scale out tự do qua Auto Scaling Group, đáp ứng traffic tăng vọt dịp khuyến mãi mà không cần downtime — trong khi startup giai đoạn đầu hay scale up database vì đơn giản nhưng nhanh chóng chạm trần.

### 6. Cấu hình/thiết lập liên quan
Không áp dụng — đây là quyết định kiến trúc, không có file cấu hình riêng.

### 7. Vị trí trong kiến trúc (ẩn dụ nhà máy)
Scale Up là **xây thêm 1 tầng cho cùng 1 dây chuyền**, Scale Out là **dựng thêm dây chuyền song song**. Mọi kiến trúc chịu tải cao đều ưu tiên thiết kế Scale Out được ở app tier, Scale Up chỉ dùng cho tầng khó chia nhỏ (vd primary database).

### 8. Quiz
1. Vì sao kiến trúc chịu tải cao ưu tiên thiết kế scale out? → **Gần như không giới hạn, không downtime, khác Scale Up có trần cứng**
2. Điều kiện bắt buộc để Scale Out hoạt động đúng? → **Ứng dụng phải stateless**
3. Scale Up có luôn kèm downtime không? → **Có, vì phải stop/start để resize**
4. Tầng nào thường buộc phải Scale Up? → **Primary database instance**
5. TMĐT thiết kế app tier stateless để làm gì? → **Scale out tự do qua ASG, không cần downtime**

---

## 2.46 — Amazon EC2 Auto Scaling

### 1. Khái niệm + ví dụ đời sống
Auto Scaling Group (ASG) tự động thêm/bớt instance dựa trên Launch Template + policy min/max/desired capacity. Giống hệ thống tự động gọi thêm nhân viên ca gấp khi quán đông và tự cho nghỉ khi vắng khách — không cần quản lý đứng canh theo dõi từng phút.

### 2. Lệnh quan trọng
```bash
aws autoscaling create-auto-scaling-group --auto-scaling-group-name my-asg \
  --launch-template LaunchTemplateName=my-template,Version='$Latest' \
  --min-size 2 --max-size 10 --desired-capacity 2 \
  --vpc-zone-identifier "subnet-aaa,subnet-bbb" \
  --health-check-type ELB --health-check-grace-period 300
```

📖 **Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--min-size` / `--max-size` | — | Biên dưới/trên số instance ASG được phép giữ |
| `--desired-capacity` | — | Số instance ASG cố gắng duy trì |
| `--vpc-zone-identifier` | — | Danh sách subnet ASG được phép launch instance vào |
| `--health-check-type ELB` | — | Check cả tầng application, không chỉ OS status check |
| `--health-check-grace-period` | — | Thời gian ân hạn trước khi bắt đầu check health (mặc định 300s) |

### 3. So sánh nhanh
Không áp dụng — bài này không có 2 khái niệm con dễ nhầm.

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| desired-capacity | Phải trong [min, max] | Ràng buộc bắt buộc |
| health-check-grace-period | Mặc định 300s | Tránh terminate nhầm instance mới khởi động |

### 5. Cách dùng nâng cao / pattern thực tế
```bash
aws autoscaling set-instance-health --instance-id i-xxxx --health-status Unhealthy
# ép ASG coi 1 instance cụ thể là unhealthy để test cơ chế tự thay thế (self-healing)
```
Mọi công ty vận hành web/app server production đều đặt EC2 sau ASG thay vì launch tay — kể cả traffic ổn định, ASG vẫn đáng dùng chỉ để có **self-healing**: instance chết vì lỗi phần cứng/OS crash tự động được thay thế mà không cần kỹ sư trực nửa đêm.

### 6. Cấu hình/thiết lập liên quan
**Launch Template** là nguồn cấu hình bắt buộc cho ASG (đã học ở 2.18) — mọi thay đổi AMI/instance type cho fleet đều thực hiện qua version mới của Launch Template, không sửa tay từng instance.

### 7. Vị trí trong kiến trúc (ẩn dụ nhà máy)
ASG là **quản đốc tự động** của xưởng — không chỉ gọi thêm/giảm công nhân mà còn tự phát hiện và thay thế công nhân "bệnh" (instance lỗi). Đây là lý do ASG gần như luôn đi kèm ELB: ELB phân phối việc, ASG đảm bảo đủ công nhân khỏe mạnh đứng nhận việc.

### 8. Quiz
1. Self-healing của ASG nghĩa là gì? → **Instance lỗi tự động bị terminate và thay thế**
2. Vì sao ASG gần như luôn đi kèm ELB? → **ELB phân phối traffic, ASG đảm bảo đủ instance khỏe mạnh**
3. `--health-check-type ELB` khác gì mặc định EC2? → **Kiểm tra cả tầng application, không chỉ OS**
4. Vì sao nên dùng ASG kể cả khi traffic ổn định? → **Để có self-healing**
5. `health-check-grace-period` dùng để làm gì? → **Tránh terminate nhầm instance mới khởi động**

---

## 2.48 — High Availability and Fault Tolerance

### 1. Khái niệm + ví dụ đời sống
HA = hệ thống vẫn hoạt động khi có sự cố nhưng có thể gián đoạn ngắn. FT = tiếp tục hoạt động ngay lập tức, không gián đoạn — tốn kém hơn nhiều vì cần dư thừa hoàn toàn. Giống sân bay: HA là có đường băng dự phòng nhưng máy bay phải chờ vài phút chuyển hướng khi đường chính hỏng; FT là có sẵn 2 đường băng hoạt động song song, máy bay không bao giờ phải chờ.

### 2. Lệnh quan trọng
Không có lệnh riêng — đây là khái niệm thiết kế, không phải thao tác CLI.

📖 **Từ điển flag nhanh**

Không áp dụng.

### 3. So sánh nhanh

| | HA | FT |
|---|---|---|
| Gián đoạn khi lỗi | Có, ngắn (vài giây) | Không |
| Chi phí | Vừa phải | Cao (dư thừa hoàn toàn) |
| Ví dụ | Multi-AZ RDS failover, ASG thay instance | 2 hệ thống song song độc lập |

### 4. Giới hạn/tham số quan trọng
Không áp dụng — trọng tâm là phân biệt đúng khái niệm khi đề thi mô tả tình huống.

### 5. Cách dùng nâng cao / pattern thực tế
SaaS B2B thông thường dùng Multi-AZ + ASG + ELB → đạt HA, đủ cho SLA 99.9%. Sàn giao dịch/hệ thống thanh toán core cần FT thực sự — chạy song song 2 hệ thống độc lập, không khoảnh khắc nào thiếu instance xử lý, chấp nhận chi phí gấp đôi để đạt SLA 99.99%+.

### 6. Cấu hình/thiết lập liên quan
Không áp dụng.

### 7. Vị trí trong kiến trúc (ẩn dụ nhà máy)
HA là **có dây chuyền dự phòng, chuyển qua mất vài giây khi dây chính hỏng**. FT là **2 dây chuyền chạy song song thật sự, không có khoảnh khắc nào ngừng sản xuất**. Phần lớn hệ thống business chỉ cần HA; rất ít hệ thống thực sự cần FT vì chi phí dư thừa tăng gấp đôi/ba.

### 8. Quiz
1. Khác biệt cốt lõi giữa HA và FT? → **HA chấp nhận gián đoạn ngắn, FT không gián đoạn dù có lỗi**
2. Vì sao rất ít hệ thống thực sự cần FT? → **Chi phí dư thừa tăng gấp đôi/ba so với HA**
3. SaaS B2B với Multi-AZ ASG+ELB đạt mức nào? → **HA**
4. Hệ thống nào thường cần FT thực sự? → **Giao dịch tài chính real-time, y tế**
5. HA có nghĩa là không bao giờ downtime dù 1 giây không? → **Không — đó là định nghĩa của FT**

---

## 2.49 — Amazon Elastic Load Balancing

### 1. Khái niệm + ví dụ đời sống
ELB phân phối traffic đến nhiều target qua 1 endpoint DNS duy nhất, tự động health check và loại target lỗi khỏi vòng quay. Giống tổng đài trung tâm của công ty — khách gọi vào 1 số duy nhất, tổng đài tự chuyển đến nhân viên đang rảnh, không cần khách biết ai đang trực.

### 2. Lệnh quan trọng
```bash
aws elbv2 create-load-balancer --name web-alb --subnets subnet-aaa subnet-bbb \
  --security-groups sg-alb --type application
aws elbv2 create-target-group --name web-tg --protocol HTTP --port 80 \
  --vpc-id vpc-xxxx --health-check-path /health
```

📖 **Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--type` | — | Loại ELB: `application` (ALB) / `network` (NLB) / `gateway` |
| `--health-check-path` | — | Đường dẫn ELB gọi định kỳ để kiểm tra target còn sống |

### 3. So sánh nhanh

| Loại ELB | Tầng | Dùng cho |
|---|---|---|
| ALB | Layer 7 | HTTP/HTTPS, routing theo path/host |
| NLB | Layer 4 | TCP/UDP hiệu năng cực cao, static IP |
| Gateway LB | Layer 3/4 | Appliance bảo mật bên thứ 3 |

### 4. Giới hạn/tham số quan trọng
Không áp dụng — chọn sai loại ELB (không phải số liệu) là lỗi hay gặp nhất.

### 5. Cách dùng nâng cao / pattern thực tế
```bash
aws elbv2 describe-target-health --target-group-arn $TG_ARN
```
Mọi hệ thống web production đều đặt ELB trước app tier — kể cả chỉ 1 instance, vì ELB cho phép thay instance (maintenance, deploy version mới) mà DNS client dùng không đổi, tránh phải update DNS mỗi lần đổi hạ tầng.

### 6. Cấu hình/thiết lập liên quan
**Health check path** (`/health`) — endpoint app cần tự implement để trả về 200 khi service khỏe mạnh. Thực tế dùng khi: mọi Target Group đều cần endpoint này, thiếu nó ELB sẽ dùng path mặc định `/` có thể không phản ánh đúng tình trạng service.

### 7. Vị trí trong kiến trúc (ẩn dụ nhà máy)
ELB là **cổng tiếp nhận đơn hàng trung tâm** của xưởng — khách hàng chỉ biết 1 địa chỉ duy nhất, không cần biết đơn được xử lý bởi dây chuyền nào phía sau. Nằm ngay trước app tier trong stack `Client → CloudFront → ELB → EC2/ASG → RDS`.

### 8. Quiz
1. Vì sao EC2 app server hiếm khi cần Public IP riêng khi có ELB? → **Traffic luôn qua ELB trước**
2. Lợi ích của ELB kể cả khi chỉ có 1 instance? → **Cho phép thay instance mà DNS client dùng không đổi**
3. `--health-check-path` dùng để làm gì? → **Đường dẫn ELB gọi định kỳ kiểm tra target còn sống**
4. Loại ELB nào dùng cho appliance bảo mật bên thứ 3? → **Gateway Load Balancer**
5. NLB phù hợp cho nhu cầu nào ALB không đáp ứng? → **Hiệu năng cực cao, static IP, TCP/UDP thuần**

---

## 2.50 — ALB and NLB Deployments

### 1. Khái niệm + ví dụ đời sống
ALB định tuyến theo nội dung HTTP (path, host, header); NLB định tuyến theo IP/port thuần, giữ nguyên IP gốc client. Giống lễ tân thông minh đọc nội dung yêu cầu để chuyển đúng phòng ban (ALB) so với đường ống trực tiếp không qua trung gian, giữ nguyên tín hiệu gốc (NLB).

### 2. Lệnh quan trọng
```bash
aws elbv2 create-listener --load-balancer-arn $ALB_ARN --protocol HTTP --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN
aws elbv2 create-rule --listener-arn $LISTENER_ARN --priority 10 \
  --conditions Field=path-pattern,Values='/api/*' --actions Type=forward,TargetGroupArn=$API_TG_ARN
```

📖 **Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `create-rule` | — | Thêm rule routing theo điều kiện vào Listener của ALB |
| `--conditions Field=path-pattern` | — | Điều kiện routing dựa theo path URL |
| `--priority` | — | Thứ tự ưu tiên rule khi có nhiều rule khớp |

### 3. So sánh nhanh

| | ALB | NLB |
|---|---|---|
| Tầng | Layer 7 | Layer 4 |
| Routing | Path/host/header | IP/port |
| Giữ IP gốc client | Không (X-Forwarded-For) | Có |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| IP gốc client qua ALB | Header `X-Forwarded-For` | ALB không giữ IP gốc trực tiếp |

### 5. Cách dùng nâng cao / pattern thực tế
Startup SaaS dùng ALB route `/api/*` đến backend service A, `/admin/*` đến service B trên cùng 1 load balancer — giảm số lượng ELB cần quản lý. Công ty gaming/streaming real-time cần latency cực thấp và giữ nguyên client IP để chống gian lận (anti-cheat) dùng NLB thay vì ALB.

### 6. Cấu hình/thiết lập liên quan
**Listener Rule** (path-based routing) — cấu hình qua `create-rule` như ví dụ mục 2. Thực tế dùng khi: kiến trúc microservices cần route nhiều service qua cùng 1 domain/ALB.

### 7. Vị trí trong kiến trúc (ẩn dụ nhà máy)
ALB là **lễ tân đọc hiểu yêu cầu** rồi phân việc đúng phòng ban; NLB là **đường ống trực tiếp tốc độ cao**, không đọc nội dung, chỉ chuyển tiếp nguyên vẹn. ALB là lựa chọn mặc định cho web app hiện đại, NLB chỉ cần khi ALB không đáp ứng được về hiệu năng hoặc giao thức.

### 8. Quiz
1. Vì sao ALB là lựa chọn mặc định cho web app hiện đại? → **Routing linh hoạt theo path/host, phù hợp microservices**
2. NLB được chọn khi nào thay vì ALB? → **Traffic cực lớn, cần giữ IP client, hoặc giao thức không phải HTTP**
3. Muốn lấy IP gốc client khi dùng ALB, đọc gì? → **Header X-Forwarded-For**
4. `--conditions Field=path-pattern` dùng để làm gì? → **Định tuyến theo path URL**
5. Công ty gaming cần giữ IP client chống gian lận nên chọn gì? → **NLB**

---

## 2.52 — EC2 Scaling Policies

### 1. Khái niệm + ví dụ đời sống
Target Tracking (giữ metric ở mức mục tiêu), Step Scaling (thêm/bớt theo bậc dựa CloudWatch Alarm), Scheduled Scaling (theo lịch cố định). Giống 3 cách quản lý nhân sự quán ăn: tự động gọi thêm người khi đông (Target Tracking), gọi thêm theo từng mức độ đông cụ thể (Step Scaling), hoặc sắp lịch trước ca đông vào cuối tuần (Scheduled).

### 2. Lệnh quan trọng
```bash
aws autoscaling put-scaling-policy --auto-scaling-group-name my-asg \
  --policy-name cpu-target-tracking --policy-type TargetTrackingScaling \
  --target-tracking-configuration file://ttconfig.json
```

📖 **Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--policy-type` | — | `TargetTrackingScaling` / `StepScaling` / `SimpleScaling` |
| `--target-tracking-configuration` | — | File JSON chứa TargetValue + metric muốn theo dõi |

### 3. So sánh nhanh

| Loại policy | Cần tự tạo Alarm? | Đặc điểm |
|---|---|---|
| Target Tracking | Không (tự động) | Giữ 1 metric ở mức mục tiêu |
| Step Scaling | Có | Scale theo bậc dựa mức vượt ngưỡng |
| Scheduled Scaling | Không (theo lịch) | Scale theo thời gian cố định |

### 4. Giới hạn/tham số quan trọng
Không áp dụng — trọng tâm là chọn đúng loại policy theo tình huống.

### 5. Cách dùng nâng cao / pattern thực tế
```bash
aws autoscaling put-scheduled-update-group-action --auto-scaling-group-name web-asg \
  --scheduled-action-name pre-sale-scale-up \
  --start-time "2026-11-27T00:00:00Z" --min-size 6 --max-size 20 --desired-capacity 6
```
TMĐT biết trước lịch sale (0h Black Friday) dùng Scheduled Scaling để tăng sẵn capacity **trước khi** traffic đổ vào, tránh độ trễ vài phút của scaling tự động phản ứng theo metric thực tế — lỗi "scale quá tay gây dao động liên tục" (flapping) cũng cần tránh khi chọn ngưỡng Step Scaling.

### 6. Cấu hình/thiết lập liên quan
**`ttconfig.json`** (Target Tracking config):
```json
{"TargetValue": 50, "PredefinedMetricSpecification": {"PredefinedMetricType": "ASGAverageCPUUtilization"}}
```
Thực tế dùng khi: đây là cấu hình mặc định nên bắt đầu với hầu hết ứng dụng web trước khi cần tinh chỉnh phức tạp hơn.

### 7. Vị trí trong kiến trúc (ẩn dụ nhà máy)
Scaling Policy là **luật chơi** quyết định quản đốc (ASG) phản ứng nhanh/chậm, chính xác hay quá tay. Chọn sai dẫn đến 2 lỗi kinh điển: scale quá chậm (downtime lúc traffic tăng đột ngột) hoặc scale quá tay (dao động liên tục, tốn chi phí).

### 8. Quiz
1. Vì sao TMĐT dùng Scheduled Scaling cho sự kiện đã biết trước? → **Tăng sẵn capacity trước khi traffic đổ vào, tránh độ trễ**
2. Lỗi scale quá tay gây dao động liên tục gọi là gì? → **Flapping**
3. Target Tracking có cần tự tạo CloudWatch Alarm không? → **Không, tự động**
4. Step Scaling khác Target Tracking ở điểm nào? → **Cần định nghĩa Alarm thủ công, scale theo bậc**
5. Đa số web app nên bắt đầu với loại policy nào? → **Target Tracking**

---

## 2.54 — Cross-Zone Load Balancing

### 1. Khái niệm + ví dụ đời sống
Khi bật, ELB phân phối traffic đều cho mọi target ở mọi AZ. Khi tắt, mỗi node ELB chỉ phân phối cho target cùng AZ. Giống hệ thống tổng đài đa chi nhánh: bật Cross-Zone là tổng đài trung tâm biết hết nhân viên ở mọi chi nhánh và điều phối đều; tắt là mỗi chi nhánh chỉ tự lo khách của chi nhánh mình.

### 2. Lệnh quan trọng
```bash
aws elbv2 modify-load-balancer-attributes --load-balancer-arn $ALB_ARN \
  --attributes Key=load_balancing.cross_zone.enabled,Value=true
aws elbv2 describe-load-balancer-attributes --load-balancer-arn $ALB_ARN
```

📖 **Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--attributes Key=load_balancing.cross_zone.enabled` | — | Công tắc bật/tắt Cross-Zone Load Balancing |

### 3. So sánh nhanh

| | ALB | NLB |
|---|---|---|
| Cross-Zone mặc định | Bật, miễn phí | Tắt, cần tự bật |

### 4. Giới hạn/tham số quan trọng
Không áp dụng số liệu cụ thể — kiểm tra tài liệu AWS mới nhất về chính sách phí Cross-Zone của NLB.

### 5. Cách dùng nâng cao / pattern thực tế
Hệ thống có traffic không đồng đều giữa các AZ (do zonal outage tạm thời hoặc scale-out lệch) luôn nên bật Cross-Zone để tránh 1 AZ gánh tải gấp đôi AZ còn lại — tình huống dễ xảy ra khi ASG scale out không đồng đều hoặc 1 AZ vừa mất instance do sự cố.

### 6. Cấu hình/thiết lập liên quan
Không áp dụng file riêng — chỉ là 1 attribute bật/tắt trên ELB.

### 7. Vị trí trong kiến trúc (ẩn dụ nhà máy)
Cross-Zone Load Balancing là **công tắc điều phối liên chi nhánh** của tổng đài trung tâm — quyết định traffic có bị lệch tải khi số "nhân viên" (instance) giữa các chi nhánh (AZ) không đều nhau.

### 8. Quiz
1. Cross-Zone Load Balancing giải quyết vấn đề gì? → **Tránh 1 AZ quá tải khi số instance giữa các AZ không đều**
2. Khi tắt Cross-Zone, mỗi node ELB phân phối traffic cho đâu? → **Chỉ target trong cùng AZ**
3. Loại ELB nào mặc định bật Cross-Zone miễn phí? → **ALB**
4. Tình huống nào dễ khiến instance giữa các AZ lệch nhau? → **ASG scale-out không đồng đều hoặc 1 AZ mất instance**
5. NLB có bật Cross-Zone mặc định giống ALB không? → **Không, là tùy chọn cần tự bật**

---

## 2.55 — Session State and Session Stickiness

### 1. Khái niệm + ví dụ đời sống
Sticky session dùng cookie đảm bảo user luôn được route về đúng 1 instance trong suốt phiên làm việc. Giống việc luôn được phục vụ bởi đúng 1 nhân viên quen thuộc trong quán — tiện nhưng nếu nhân viên đó bận/nghỉ thì khách phải chờ, thay vì được người khác phục vụ ngay.

### 2. Lệnh quan trọng
```bash
aws elbv2 modify-target-group-attributes --target-group-arn $TG_ARN \
  --attributes Key=stickiness.enabled,Value=true Key=stickiness.type,Value=lb_cookie
```

📖 **Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `stickiness.enabled` | — | Bật/tắt sticky session cho Target Group |
| `stickiness.type` | — | `lb_cookie` (ELB tự tạo) hoặc `app_cookie` (dùng cookie do app tự set) |

### 3. So sánh nhanh
Không áp dụng — bài này không có 2 loại con dễ nhầm ngoài `lb_cookie` vs `app_cookie` (đã liệt kê ở flag table).

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Rủi ro chính | Traffic dồn lệch | Instance có nhiều session dính bị quá tải hơn instance khác |

### 5. Cách dùng nâng cao / pattern thực tế
Hệ thống legacy monolith cũ (chưa refactor sang stateless) buộc phải bật sticky session để hoạt động đúng trong khi chờ migrate session ra Redis/ElastiCache. Kiến trúc microservices hiện đại gần như không bao giờ dùng sticky session — session luôn lưu ngoài instance ngay từ đầu.

### 6. Cấu hình/thiết lập liên quan
**Target Group attributes** — bật qua CLI như ví dụ mục 2, hoặc Console tab "Attributes" của Target Group. Thực tế dùng khi: cần giải pháp tạm thời (workaround) cho app cũ trong lúc chờ refactor, không phải giải pháp lâu dài.

### 7. Vị trí trong kiến trúc (ẩn dụ nhà máy)
Sticky Session là **quy tắc phục vụ khách quen** áp đặt lên hệ thống điều phối tự động — hữu ích tạm thời nhưng đi ngược lại triết lý cân bằng tải thật sự. Đây là giải pháp workaround, không phải kiến trúc chuẩn nên hướng tới.

### 8. Quiz
1. Vì sao sticky session là giải pháp tạm thời, không phải kiến trúc chuẩn? → **Phá vỡ tính stateless cần thiết để scale out mượt**
2. Hệ thống nào buộc phải dùng sticky session? → **App lưu session trong memory instance, chưa refactor**
3. `stickiness.type=app_cookie` khác `lb_cookie` ở điểm nào? → **app_cookie dùng cookie do chính app tự set, lb_cookie do ELB tự tạo**
4. Sticky session dùng cơ chế gì để giữ user về đúng instance? → **Cookie**
5. Rủi ro chính khi bật sticky session? → **Traffic dồn lệch về 1 số instance có nhiều session dính**

---

## 2.56 — Secure Listeners for ELB

### 1. Khái niệm + ví dụ đời sống
Secure Listener nhận traffic HTTPS, giải mã SSL/TLS ngay tại ELB (SSL termination), có thể forward tiếp bằng HTTP hoặc HTTPS đến target. Giống trạm kiểm soát an ninh ở cổng chính tòa nhà — khách được kiểm tra kỹ 1 lần ở cổng, bên trong tòa nhà di chuyển tự do (hoặc kiểm tra thêm lần 2 nếu tòa nhà yêu cầu bảo mật cao).

### 2. Lệnh quan trọng
```bash
aws acm request-certificate --domain-name app.example.com --validation-method DNS
aws elbv2 create-listener --load-balancer-arn $ALB_ARN --protocol HTTPS --port 443 \
  --certificates CertificateArn=$CERT_ARN --default-actions Type=forward,TargetGroupArn=$TG_ARN
```

📖 **Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `request-certificate` | ACM = AWS Certificate Manager | Xin certificate SSL/TLS miễn phí, tự động renew |
| `--validation-method DNS` | — | Xác thực quyền sở hữu domain qua bản ghi DNS thay vì email |
| `--certificates CertificateArn` | — | Gắn certificate đã ISSUED vào Listener |

### 3. So sánh nhanh

| | SSL termination tại ELB | HTTPS end-to-end (2 chặng) |
|---|---|---|
| Tải CPU cho EC2 | Thấp | Cao hơn (tự xử lý TLS) |
| Quản lý certificate | Chỉ ở ELB (ACM) | Cả ELB và từng EC2 |
| Phù hợp | Đa số hệ thống | Compliance nghiêm ngặt (PCI-DSS, HIPAA) |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Trạng thái certificate | `ISSUED` | Phải đạt trạng thái này trước khi tạo Listener HTTPS |

### 5. Cách dùng nâng cao / pattern thực tế
```bash
aws acm describe-certificate --certificate-arn $CERT_ARN --query "Certificate.Status"
```
Đa số hệ thống production dùng SSL termination tại ALB + ACM certificate (tự động renew, miễn phí), chấp nhận traffic nội bộ VPC (ELB → EC2) không mã hóa vì VPC vốn đã cô lập. Ngành tài chính/y tế cần compliance nghiêm ngặt (PCI-DSS, HIPAA) bật HTTPS listener cả 2 chặng.

### 6. Cấu hình/thiết lập liên quan
**Certificate validation qua DNS** — cần thêm CNAME record do ACM cung cấp vào Route 53/DNS provider để xác thực quyền sở hữu domain. Thực tế dùng khi: mọi lần xin certificate mới cho domain mới đều cần bước này trước khi certificate chuyển sang `ISSUED`.

### 7. Vị trí trong kiến trúc (ẩn dụ nhà máy)
SSL Termination tại ELB là **trạm kiểm soát an ninh duy nhất ở cổng chính** — giảm tải cho từng "phòng ban" (EC2) không phải tự trang bị máy quét riêng. Đánh đổi: khu vực bên trong xưởng (VPC nội bộ) không được kiểm soát nghiêm ngặt như ở cổng, chấp nhận được vì đã có tường rào (VPC) bao quanh.

### 8. Quiz
1. Lợi ích chính của SSL termination tại ELB thay vì từng EC2? → **Giảm tải CPU cho EC2, đơn giản hóa quản lý certificate**
2. Đánh đổi khi SSL termination tại ELB là gì? → **Traffic ELB→EC2 không mã hóa trừ khi chủ động bật lại**
3. Ngành nào cần mã hóa end-to-end thật sự? → **Tài chính/y tế cần compliance PCI-DSS, HIPAA**
4. Certificate cần đạt trạng thái nào trước khi tạo Listener HTTPS? → **ISSUED**
5. `--validation-method DNS` dùng để làm gì? → **Xác thực quyền sở hữu domain qua bản ghi DNS**

---

## 🧪 Lab tổng — Dựng ASG + ALB hoàn chỉnh với HTTPS

🧭 Bối cảnh: Bạn được giao dựng hạ tầng chịu tải cho 1 web app mới: tự động scale theo CPU, phân phối traffic qua ALB, HTTPS termination, và policy scale theo lịch cho sự kiện sắp tới.

```bash
# 1. Launch Template làm khuôn mẫu cho ASG
aws ec2 create-launch-template --launch-template-name web-template \
  --launch-template-data '{"ImageId":"ami-xxxx","InstanceType":"t3.micro","SecurityGroupIds":["sg-xxxx"]}'

# 2. Application Load Balancer + Target Group
aws elbv2 create-load-balancer --name web-alb --subnets subnet-aaa subnet-bbb \
  --security-groups sg-alb --type application
aws elbv2 create-target-group --name web-tg --protocol HTTP --port 80 \
  --vpc-id vpc-xxxx --health-check-path /health

# 3. HTTPS Listener với certificate từ ACM
aws acm request-certificate --domain-name app.example.com --validation-method DNS
aws elbv2 create-listener --load-balancer-arn $ALB_ARN --protocol HTTPS --port 443 \
  --certificates CertificateArn=$CERT_ARN --default-actions Type=forward,TargetGroupArn=$TG_ARN

# 4. Auto Scaling Group gắn Target Group
aws autoscaling create-auto-scaling-group --auto-scaling-group-name web-asg \
  --launch-template LaunchTemplateName=web-template,Version='$Latest' \
  --min-size 2 --max-size 10 --desired-capacity 2 \
  --vpc-zone-identifier "subnet-aaa,subnet-bbb" \
  --target-group-arns $TG_ARN --health-check-type ELB --health-check-grace-period 300

# 5. Target Tracking Policy — giữ CPU ở 50%
aws autoscaling put-scaling-policy --auto-scaling-group-name web-asg \
  --policy-name cpu-target-tracking --policy-type TargetTrackingScaling \
  --target-tracking-configuration '{"TargetValue":50.0,"PredefinedMetricSpecification":{"PredefinedMetricType":"ASGAverageCPUUtilization"}}'

# 6. Scheduled Scaling cho sự kiện sale đã biết trước
aws autoscaling put-scheduled-update-group-action --auto-scaling-group-name web-asg \
  --scheduled-action-name pre-sale-scale-up \
  --start-time "2026-11-27T00:00:00Z" --min-size 6 --max-size 20 --desired-capacity 6

# 7. Verify Cross-Zone Load Balancing (ALB đã mặc định bật)
aws elbv2 describe-load-balancer-attributes --load-balancer-arn $ALB_ARN
```

✅ Verify: `curl -I https://app.example.com` → 200 qua HTTPS; `describe-auto-scaling-groups` → đủ instance healthy; giả lập tải cao và quan sát ASG tự thêm instance qua CloudWatch.

🧹 Cleanup: `delete-scheduled-action` → `delete-policy` → `delete-auto-scaling-group --force-delete` → `delete-listener` → `delete-target-group` → `delete-load-balancer` → `delete-launch-template`.

⚠️ Lưu ý dễ sai/tốn phí: ALB tính phí theo giờ + LCU dù traffic thấp; `--force-delete` sẽ terminate toàn bộ instance trong group, cẩn thận với group production; chứng chỉ ACM chờ validate DNS mất vài phút, đừng tạo Listener HTTPS trước khi cert `ISSUED`.

---

## Cheat Sheet

| Việc | Lệnh/Khái niệm | Ghi nhớ |
|---|---|---|
| Chọn hướng scale | Scale Up vs Scale Out | Scale Out cần app stateless |
| Tự thêm/bớt + tự chữa lành | Auto Scaling Group | Luôn đi kèm ELB trong production |
| Phân biệt độ sẵn sàng | HA vs FT | Đa số hệ thống chỉ cần HA |
| Chọn loại ELB | ALB (L7) / NLB (L4) / GWLB | ALB mặc định, NLB khi cần hiệu năng cực cao/giữ IP |
| Quy tắc scale | Target Tracking / Step / Scheduled | Scheduled cho sự kiện biết trước |
| Cân bằng traffic giữa AZ | Cross-Zone Load Balancing | ALB bật mặc định, NLB cần tự bật |
| Giữ session đúng server | Sticky Session | Chỉ dùng tạm cho app chưa stateless |
| Vị trí mã hóa TLS | SSL Termination tại ELB | ACM tự renew miễn phí |

**Pattern chuẩn:** `Client → ACM HTTPS → ALB (Cross-Zone, Target Tracking) → ASG (health check ELB, self-healing) → EC2 stateless (session ở ElastiCache)` — bộ khung chịu tải chuẩn của gần như mọi hệ thống web production nghiêm túc, không chỉ để thi.
