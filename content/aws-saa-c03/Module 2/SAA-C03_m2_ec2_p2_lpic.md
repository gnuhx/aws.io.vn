# Module 2 — Amazon EC2 · Part 2: Lifecycle & Pricing
Bài 2.36–2.43 · Domain thi: High-Performing Architectures 24% · Resilient Architectures 26% · Cost-Optimized Architectures 20%

Danh sách bài: 2.36 EC2 Instance Lifecycle · 2.37 Nitro Instances and Nitro Enclaves · 2.38 EC2 Pricing Options · 2.39 EC2 Pricing Use Cases · 2.40 Exam Cram *(meta)* · 2.41 Architecture Patterns *(meta)* · 2.42 EC2 Quiz *(meta)* · 2.43 Cheat Sheets *(meta)*

---

## 🗺️ Roadmap tiến độ Module 2

| # | Section | Bài | Trạng thái |
|---|---|---|---|
| 1 | AWS IAM | 2.1–2.16 | ✅ Đã học |
| 2a | Amazon EC2 — Part 1: Core & Networking | 2.17–2.35 | ✅ Đã học |
| **2b** | **Amazon EC2 — Part 2: Lifecycle & Pricing** | **2.36–2.43** | **👉 Đang học** |
| 3 | Elastic Load Balancing and Auto Scaling | 2.44–2.62 | ✅ Đã học |
| 4 | AWS Organizations and Control Tower | 2.63–2.72 | ⏳ Chưa học |

---

## 2.36 — EC2 Instance Lifecycle

### 1. Khái niệm + ví dụ đời sống
Instance đi qua các trạng thái `pending → running → stopping → stopped → terminated`. Giống hợp đồng thuê xe: đang chạy (`running`) tính tiền thuê theo giờ; tạm gửi xe vào bãi (`stopped`) không tính tiền thuê nhưng vẫn tính phí giữ xe (EBS); trả xe hẳn (`terminated`) là hết hợp đồng, không lấy lại được.

### 2. Lệnh quan trọng
```bash
aws ec2 stop-instances --instance-ids i-xxxx
aws ec2 modify-instance-attribute --instance-id i-xxxx --disable-api-termination
aws ec2 describe-instance-status --instance-ids i-xxxx
```

📖 **Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `stop-instances` | — | Dừng instance, giữ nguyên EBS |
| `--disable-api-termination` | — | Bật Termination Protection, chặn terminate nhầm qua API/Console |
| `describe-instance-status` | — | Xem trạng thái + status check hiện tại |

### 3. So sánh nhanh

| Trạng thái | Phí compute | EBS | Instance Store |
|---|---|---|---|
| `running` | Có | Giữ nguyên | Giữ nguyên |
| `stopped` | Không | Giữ nguyên | Mất hoàn toàn |
| `terminated` | Không | Mất (trừ `DeleteOnTermination=false`) | Mất hoàn toàn |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Instance Store khi stop | Mất hoàn toàn | Khác EBS-backed, luôn giữ nguyên dữ liệu |
| `DeleteOnTermination` | true/false | Mặc định true — EBS root volume bị xóa theo khi terminate |

### 5. Cách dùng nâng cao / pattern thực tế
```bash
aws scheduler create-schedule --name stop-dev-nightly \
  --schedule-expression "cron(0 20 * * ? *)" \
  --target '{"Arn":"arn:aws:scheduler:::aws-sdk:ec2:stopInstances","Input":"{...}"}'
```
Team vận hành dev/staging dùng EventBridge Scheduler tự động stop toàn bộ instance ngoài giờ hành chính (dựa trên tag `Environment=dev`) — kỹ thuật cost-optimization đơn giản nhưng hiệu quả, phổ biến ở hầu hết công ty ngân sách cloud hạn chế.

### 6. Cấu hình/thiết lập liên quan
**Tag phân loại** — gắn `Environment=dev` để script tự động lọc đúng nhóm instance cần stop:
```bash
aws ec2 create-tags --resources i-xxxx --tags Key=Environment,Value=dev
```
Thực tế dùng khi: cần scale việc quản lý chi phí cho hàng chục/hàng trăm instance mà không phải chọn tay từng cái.

### 7. Vị trí trong kiến trúc (ẩn dụ nhà máy)
Instance Lifecycle giống **ca làm việc của công nhân** — đến ca (`running`) tính lương, nghỉ giữa ca (`stopped`) vẫn giữ đồ đạc cá nhân (EBS) nhưng không tính lương, nghỉ việc hẳn (`terminated`) dọn sạch bàn làm việc. Production luôn bật Termination Protection để tránh "sa thải nhầm" do thao tác sai.

### 8. Quiz
1. Instance `stopped` có tính phí compute không? → **Không, nhưng EBS vẫn tính phí lưu trữ**
2. Vì sao team dev/staging hay tự động stop instance ngoài giờ? → **Cắt giảm chi phí compute**
3. Instance Store có giữ dữ liệu sau khi stop không? → **Không, mất hoàn toàn**
4. Flag nào bật Termination Protection? → **--disable-api-termination**
5. Vì sao production luôn nên bật Termination Protection? → **Tránh xóa nhầm do thao tác console/CLI sai**

---

## 2.37 — Nitro Instances and Nitro Enclaves

### 1. Khái niệm + ví dụ đời sống
Nitro System tách phần networking/storage ra phần cứng chuyên dụng (Nitro Card) thay vì xử lý qua hypervisor software. Giống dây chuyền sản xuất chuyên biệt hóa — mỗi trạm (network, storage) có máy chuyên dụng riêng thay vì 1 máy tổng làm hết mọi việc, giúp toàn bộ dây chuyền chạy nhanh hơn.

### 2. Lệnh quan trọng
```bash
aws ec2 run-instances --image-id ami-xxxx --instance-type m5.xlarge \
  --enclave-options 'Enabled=true'
```

📖 **Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--enclave-options` | — | Bật Nitro Enclaves cho instance (cần instance type hỗ trợ) |
| `Enabled=true` | — | Cờ bật tính năng bên trong JSON tham số |

### 3. So sánh nhanh

| | Instance Nitro-based | Instance thế hệ cũ (Xen) |
|---|---|---|
| ENA mặc định | Có | Không luôn có |
| EBS-optimized | Mặc định | Cần bật riêng |
| Hỗ trợ Nitro Enclaves | Có (tùy type) | Không |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Nitro Enclaves network | Không có | Chỉ giao tiếp qua vsock nội bộ |
| Nitro Enclaves storage | Không bền vững | Mất khi enclave dừng |

### 5. Cách dùng nâng cao / pattern thực tế
```bash
aws ec2 describe-instance-types --instance-types m5.xlarge \
  --query "InstanceTypes[0].HypervisorInfo"
```
Công ty fintech/xử lý dữ liệu nhạy cảm (thẻ thanh toán, khóa mã hóa) dùng Nitro Enclaves để xử lý dữ liệu cực nhạy cảm trong môi trường cô lập hoàn toàn khỏi OS chính — kể cả người có quyền root trên instance cha cũng không truy cập được, đáp ứng compliance PCI-DSS nghiêm ngặt.

### 6. Cấu hình/thiết lập liên quan
**Enclave options (JSON)** khi launch:
```json
{"Enabled": true}
```
Thực tế dùng khi: cần xử lý secret/khóa mã hóa/dữ liệu định danh mà ngay cả root trên instance cha cũng không được thấy.

### 7. Vị trí trong kiến trúc (ẩn dụ nhà máy)
Nitro là **nền móng nhà xưởng thế hệ mới** — giúp mọi máy móc phía trên (ENA, EBS-optimized) tự động chạy nhanh hơn mà không cần công nhân cấu hình gì thêm. Nitro Enclaves là "phòng thí nghiệm niêm phong" trong xưởng — biệt lập hoàn toàn, không cửa sổ, không cửa ra vào, chỉ có 1 đường ống dữ liệu mã hóa duy nhất nối với xưởng chính.

### 8. Quiz
1. Nitro System cải thiện điều gì so với ảo hóa truyền thống? → **Tách networking/storage ra phần cứng chuyên dụng, giảm hao phí ảo hóa**
2. Vì sao ENA có sẵn mặc định trên instance hiện đại? → **Vì chạy trên nền Nitro System**
3. Ai thực sự cần Nitro Enclaves? → **Công ty xử lý dữ liệu cực nhạy cảm, cần compliance nghiêm ngặt**
4. Có thể SSH vào Nitro Enclave không? → **Không**
5. Nitro Enclave giao tiếp với instance cha qua đâu? → **vsock nội bộ**

---

## 2.38 — Amazon EC2 Pricing Options

### 1. Khái niệm + ví dụ đời sống
On-Demand (trả theo giờ, không cam kết), Reserved/Savings Plans (cam kết 1-3 năm, giảm sâu), Spot (đấu giá tài nguyên dư, có thể bị thu hồi), Dedicated Host (phần cứng vật lý riêng). Giống các gói cước điện thoại: trả sau theo dùng (On-Demand), gói cam kết theo năm giảm giá (Reserved), vé máy bay standby giá rẻ nhưng có thể bị dời chuyến (Spot), thuê nguyên cả tổng đài riêng (Dedicated Host).

### 2. Lệnh quan trọng
```bash
aws ec2 request-spot-instances --instance-count 1 --launch-specification file://spot-spec.json
aws ec2 describe-spot-price-history --instance-types t3.micro
```

📖 **Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `request-spot-instances` | — | Yêu cầu launch Spot Instance |
| `--launch-specification` | — | File JSON mô tả cấu hình instance muốn launch |
| `describe-spot-price-history` | — | Xem lịch sử giá Spot để tránh launch lúc giá cao bất thường |

### 3. So sánh nhanh

| Model | Cam kết | Tiết kiệm |
|---|---|---|
| On-Demand | Không | 0% |
| Reserved/Savings Plans | 1-3 năm | 40-72% |
| Spot | Không | Đến 90% |
| Dedicated Host | Theo nhu cầu | Thấp nhất |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Spot Interruption Notice | 2 phút | Cảnh báo trước khi thu hồi |
| Savings Plans commitment | 1 hoặc 3 năm | Cam kết theo $/giờ, không theo instance cụ thể |

### 5. Cách dùng nâng cao / pattern thực tế
```bash
aws autoscaling create-auto-scaling-group --auto-scaling-group-name mixed-asg \
  --mixed-instances-policy file://mixed-policy.json
# mixed-policy.json: phối hợp On-Demand baseline + Spot cho phần vượt ngưỡng trong cùng 1 ASG
```
TMĐT có traffic tăng đột biến dịp lễ nhưng nền tảng chạy quanh năm dùng **Mixed Instances Policy** trong ASG: giữ % On-Demand tối thiểu ổn định, phần scale thêm dùng Spot để tối ưu chi phí mà vẫn tự động fallback về On-Demand nếu Spot bị thu hồi hàng loạt.

### 6. Cấu hình/thiết lập liên quan
**`spot-spec.json`** — cấu hình instance muốn launch dạng Spot:
```json
{"ImageId": "ami-xxxx", "InstanceType": "c6i.large", "SubnetId": "subnet-xxxx"}
```
Thực tế dùng khi: launch Spot Instance qua API/CLI thay vì Console, cần cho batch job hoặc CI/CD runner.

### 7. Vị trí trong kiến trúc (ẩn dụ nhà máy)
Pricing Model giống **hợp đồng lao động khác nhau** trong xưởng — nhân viên chính thức dài hạn (Reserved), nhân viên thời vụ trả theo ngày (On-Demand), lao động tạm được gọi khi có việc và có thể bị cho nghỉ bất kỳ lúc nào (Spot). Chọn đúng loại hợp đồng cho đúng loại công việc là bài toán tài chính vận hành, không phải kỹ thuật thuần.

### 8. Quiz
1. Ngân hàng chạy core banking 24/7 nên chọn pricing model nào? → **Reserved/Savings Plans**
2. Batch job ban đêm chấp nhận gián đoạn nên chọn gì? → **Spot Instance**
3. Spot Instance được cảnh báo thu hồi trước bao lâu? → **2 phút**
4. Mixed Instances Policy trong ASG giải quyết vấn đề gì? → **Phối hợp On-Demand baseline + Spot cho phần scale thêm, tối ưu chi phí mà vẫn ổn định**
5. Khi nào cần Dedicated Host thay vì Reserved Instance? → **Khi cần license theo socket/core vật lý hoặc compliance phần cứng riêng**

---

## 2.39 — EC2 Pricing Use Cases

### 1. Khái niệm + ví dụ đời sống
Bài luyện áp dụng 4 pricing model ở 2.38 vào bài toán thực tế cụ thể — không có khái niệm kỹ thuật mới, trọng tâm là khả năng map đúng tình huống vào pricing model.

### 2. Lệnh quan trọng
Không có lệnh riêng — tái sử dụng toàn bộ lệnh đã học ở bài 2.38.

📖 **Từ điển flag nhanh**

Không áp dụng.

### 3. So sánh nhanh

| Tình huống | Pricing model phù hợp |
|---|---|
| Web server traffic ổn định quanh năm | Reserved/Savings Plans |
| Render phim hàng loạt, không quan trọng khi nào xong | Spot Instance (fleet) |
| Phần mềm cần license theo CPU socket vật lý | Dedicated Host |
| Demo/POC chạy vài giờ rồi tắt | On-Demand |
| TMĐT traffic tăng vọt dịp lễ, nền tảng chạy quanh năm | Reserved cho baseline + On-Demand/Spot cho phần tăng đột biến |

### 4. Giới hạn/tham số quan trọng
Không áp dụng — bài này không có số liệu/quota riêng.

### 5. Cách dùng nâng cao / pattern thực tế
Đây chính là dạng câu hỏi xuất hiện nhiều nhất trong domain Cost-Optimized (20%) — đề thi mô tả 1 tình huống (loại workload, mức độ chấp nhận gián đoạn, thời gian cam kết) và yêu cầu chọn đúng pricing model, không hỏi lý thuyết suông. Case thực tế: startup SaaS B2B mới ra mắt, traffic chưa ổn định, nên bắt đầu bằng On-Demand để giữ linh hoạt, chỉ chuyển sang Reserved sau khi đã quan sát được baseline traffic ổn định qua vài tháng.

### 6. Cấu hình/thiết lập liên quan
Không áp dụng.

### 7. Vị trí trong kiến trúc (ẩn dụ nhà máy)
Đây là bài "thực hành tuyển dụng đúng người đúng việc" trong xưởng — biết công việc nào cần nhân viên chính thức, công việc nào thuê ngoài theo giờ, công việc nào chấp nhận thuê lao động tạm giá rẻ. Kỹ năng này áp dụng trực tiếp vào việc thiết kế ngân sách hạ tầng thật, không chỉ để thi.

### 8. Quiz
1. Web server traffic ổn định quanh năm nên chọn gì? → **Reserved/Savings Plans**
2. Render phim hàng loạt không quan trọng thời gian hoàn thành nên chọn gì? → **Spot Instance**
3. Phần mềm cần license theo CPU socket vật lý cần dùng gì? → **Dedicated Host**
4. TMĐT traffic tăng vọt dịp lễ nhưng nền tảng chạy quanh năm nên phối hợp model nào? → **Reserved cho baseline + On-Demand/Spot cho phần tăng đột biến**
5. Startup mới ra mắt traffic chưa ổn định nên bắt đầu với gì? → **On-Demand, chuyển Reserved sau khi baseline ổn định**

---

## 🧪 Lab tổng — Quản lý vòng đời & tối ưu chi phí EC2

🧭 Bối cảnh: Bạn được giao dọn dẹp chi phí EC2 cho môi trường có nhiều instance dev/test chạy lãng phí ngoài giờ, đồng thời cần dựng 1 Spot Instance cho batch job và bật Termination Protection cho instance production.

```bash
# 1. Gắn tag môi trường để phân loại
aws ec2 create-tags --resources i-devxxxx --tags Key=Environment,Value=dev

# 2. Script stop toàn bộ instance dev ngoài giờ hành chính
aws ec2 describe-instances --filters "Name=tag:Environment,Values=dev" \
  --query "Reservations[].Instances[].InstanceId" --output text | \
  xargs -n1 -I{} aws ec2 stop-instances --instance-ids {}

# 3. Verify EBS vẫn giữ dữ liệu sau khi stop
aws ec2 describe-volumes --filters "Name=attachment.instance-id,Values=i-devxxxx"

# 4. Bật Termination Protection cho instance production
aws ec2 modify-instance-attribute --instance-id i-prodxxxx --disable-api-termination

# 5. Launch Spot Instance cho batch job
aws ec2 run-instances --image-id ami-xxxx --instance-type c6i.large \
  --instance-market-options '{"MarketType":"spot","SpotOptions":{"SpotInstanceType":"one-time"}}' \
  --subnet-id subnet-xxxx

# 6. Kiểm tra giá Spot hiện tại trước khi launch
aws ec2 describe-spot-price-history --instance-types c6i.large --max-items 5
```

✅ Verify: `describe-instances --instance-ids i-prodxxxx --query "Reservations[].Instances[].InstanceLifecycle"` → thấy `spot` cho instance batch; thử terminate instance production → phải bị chặn.

🧹 Cleanup: tắt Termination Protection (`Value=false`) trước khi terminate toàn bộ instance dev/batch/production dùng cho lab.

⚠️ Lưu ý dễ sai/tốn phí: Spot Instance có thể bị thu hồi giữa chừng — batch job cần tự checkpoint tiến độ; quên tắt Termination Protection trước cleanup sẽ khiến lệnh terminate thất bại; instance `stopped` vẫn tính phí EBS nên nếu không cần dữ liệu nữa nên snapshot rồi terminate hẳn.

---

## Cheat Sheet

| Việc | Lệnh/Khái niệm | Ghi nhớ |
|---|---|---|
| Kiểm tra trạng thái | `describe-instances` | `stopped` không mất EBS, mất hoàn toàn Instance Store |
| Chống xóa nhầm | `--disable-api-termination` | Bắt buộc bật cho production |
| Bảo mật dữ liệu cực nhạy cảm | Nitro Enclaves | Không network, không SSH, chỉ vsock |
| Workload ổn định 24/7 | Reserved/Savings Plans | Giảm 40-72% |
| Workload chấp nhận gián đoạn | Spot Instance | Giảm đến 90%, cảnh báo 2 phút |
| Cần phần cứng vật lý riêng | Dedicated Host | Cho license theo socket/core |
| Phối hợp On-Demand + Spot | Mixed Instances Policy (ASG) | Baseline ổn định + scale thêm bằng Spot |

**Pattern chuẩn:** Baseline ổn định dùng Reserved/Savings Plans, phần traffic biến động dùng On-Demand, batch job chấp nhận gián đoạn dùng Spot, dữ liệu cực nhạy cảm cô lập bằng Nitro Enclaves — đây là cách phối hợp pricing model thật của phần lớn hệ thống production, và cũng là dạng câu hỏi lặp lại nhiều nhất ở domain Cost-Optimized (20%).
