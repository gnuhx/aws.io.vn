# Module 2 — Amazon EC2 · Part 1: Core & Networking
Bài 2.17–2.35 · Domain thi: High-Performing Architectures 24% · Resilient Architectures 26%

Danh sách bài: 2.17 Introduction *(meta)* · 2.18 EC2 Overview · 2.19 [HOL] · 2.20 [HOL] · 2.21 User Data and Metadata · 2.22 [HOL] · 2.23 [HOL] · 2.24 Access Keys and IAM Roles with EC2 · 2.25 [HOL] · 2.26 [HOL] · 2.27 EC2 Placement Groups · 2.28 Network Interfaces (ENI, ENA, EFA) · 2.29 Public/Private/Elastic IP · 2.30 NAT for Public Addresses · 2.31 [HOL] · 2.32 Private Subnets and Bastion Hosts · 2.33 [HOL] · 2.34 NAT Gateways and NAT Instances · 2.35 [HOL]

---

## 🗺️ Roadmap tiến độ Module 2

| # | Section | Bài | Trạng thái |
|---|---|---|---|
| 1 | AWS IAM | 2.1–2.16 | ✅ Đã học |
| **2a** | **Amazon EC2 — Part 1: Core & Networking** | **2.17–2.35** | **👉 Đang học** |
| 2b | Amazon EC2 — Part 2: Lifecycle & Pricing | 2.36–2.43 | ✅ Đã học trước đó |
| 3 | Elastic Load Balancing and Auto Scaling | 2.44–2.62 | ✅ Đã học trước đó |
| 4 | AWS Organizations and Control Tower | 2.63–2.72 | ⏳ Chưa học |

---

## 2.18 — Amazon EC2 Overview

### 1. Khái niệm + ví dụ đời sống
EC2 là dịch vụ cho thuê máy chủ ảo theo nhu cầu, trả tiền theo mức dùng thực tế. Giống thuê xe theo ngày ở hãng cho thuê xe — bạn chọn loại xe (instance type) phù hợp nhu cầu chuyến đi, trả tiền theo số ngày dùng, không cần mua đứt cả chiếc xe.

### 2. Lệnh quan trọng
```bash
aws ec2 run-instances --image-id ami-0abcd1234 --instance-type t3.micro \
  --key-name mykey --security-group-ids sg-xxxx --subnet-id subnet-xxxx
aws ec2 describe-instance-types --instance-types t3.micro --query "InstanceTypes[0].VCpuInfo"
aws ec2 describe-instances --filters "Name=instance-state-name,Values=running"
```

📖 **Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--image-id` | AMI = Amazon Machine Image | Bản snapshot OS + software cài sẵn, khuôn mẫu tạo instance |
| `--instance-type` | — | Loại phần cứng ảo (CPU/RAM/network) |
| `--key-name` | — | Tên key pair SSH dùng đăng nhập lần đầu |
| `--security-group-ids` | SG = Security Group | Firewall ảo cấp instance |
| `--subnet-id` | — | Subnet trong VPC nơi instance được đặt |
| `--query` | JMESPath query | Lọc riêng phần JSON cần lấy thay vì trả về toàn bộ |
| `--filters` | — | Lọc kết quả describe theo điều kiện (key=value) |

### 3. So sánh nhanh — Instance Family

| Family | Tối ưu cho | Ví dụ |
|---|---|---|
| General Purpose | Cân bằng CPU/RAM, web server | t3, m6i |
| Compute Optimized | CPU nặng, batch, ML inference | c6i |
| Memory Optimized | RAM nặng, in-memory DB, cache | r6i |
| Storage Optimized | IOPS/throughput cao | i4i |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| vCPU-based quota | Theo family, soft limit | Giới hạn tổng vCPU chạy cùng lúc, không phải số instance |
| Free Tier | 750h/tháng | Áp dụng t2.micro/t3.micro trong 12 tháng đầu tài khoản |
| CPU Credit (T family) | Burstable | Hết credit → instance bị throttle CPU |

### 5. Cách dùng nâng cao / pattern thực tế
```bash
aws ec2 modify-instance-attribute --instance-id i-xxxx \
  --credit-specification CpuCredits=unlimited
# CpuCredits=unlimited: cho phép instance T-family v ẫn giữ hiệu năng khi hết burst credit,
# thay vì bị throttle — trả thêm phí nhưng tránh downtime lúc traffic spike bất ngờ
```
Startup traffic khó đoán hay bật `T3 Unlimited` cho các instance chạy business logic quan trọng, chấp nhận phụ phí nhỏ để tránh bị throttle CPU đúng lúc traffic tăng đột ngột — rẻ hơn nhiều so với việc phải scale up khẩn cấp giữa sự cố.

### 6. Cấu hình/thiết lập liên quan
**Launch Template** (JSON) — khuôn cấu hình launch tái sử dụng, dùng khi cần launch nhất quán qua Auto Scaling Group:
```json
{
  "ImageId": "ami-0abcd1234",
  "InstanceType": "t3.micro",
  "KeyName": "mykey",
  "SecurityGroupIds": ["sg-xxxx"]
}
```
Thực tế dùng khi: mọi kiến trúc có ASG đều cần Launch Template làm nguồn cấu hình chuẩn, tránh launch tay từng instance dẫn đến cấu hình lệch nhau (config drift).

### 7. Vị trí trong kiến trúc (ẩn dụ nhà máy)
EC2 là **công nhân đứng máy trực tiếp sản xuất** — khác Lambda là "thợ thời vụ" chỉ đến làm khi có việc rồi về ngay. Trong stack 3-tier chuẩn `Client → ALB → [EC2 App Tier] → RDS`, EC2 nằm ở tầng xử lý logic nghiệp vụ, giữa load balancer và database — tầng duy nhất bạn toàn quyền cài runtime tùy ý.

### 8. Quiz
1. Vì sao chọn sai instance family là lỗi cost-optimization hay gặp? → **Trả phí cao hơn cần thiết mà không cải thiện hiệu năng tương ứng**
2. `CpuCredits=unlimited` giải quyết vấn đề gì? → **Tránh instance T-family bị throttle khi hết burst credit lúc traffic tăng đột ngột**
3. Launch Template dùng để làm gì trong kiến trúc có ASG? → **Làm nguồn cấu hình chuẩn, tránh config drift khi launch tay**
4. EC2 nằm ở đâu trong stack 3-tier chuẩn? → **Giữa ALB và RDS, tầng xử lý logic nghiệp vụ**
5. `--query` trong AWS CLI dùng cú pháp nào để lọc? → **JMESPath**

---

## 2.21 — Amazon EC2 User Data and Metadata

### 1. Khái niệm + ví dụ đời sống
Metadata là thông tin tự thân instance (IP, instance-id...), truy cập qua `169.254.169.254`. User Data là script chạy đúng 1 lần lúc launch (bootstrap). Metadata giống thẻ nhân viên đeo sẵn (tự mô tả bản thân), User Data giống tờ hướng dẫn việc cần làm dán sẵn ở bàn làm việc ngày đầu tiên — chỉ đọc 1 lần lúc mới vào ca.

### 2. Lệnh quan trọng
```bash
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
curl -H "X-aws-ec2-metadata-token: $TOKEN" \
  http://169.254.169.254/latest/meta-data/instance-id
```

📖 **Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `-X PUT` | Request method | IMDSv2 dùng PUT để lấy token, chống SSRF tốt hơn IMDSv1 (GET) |
| `-H` | Header | Gắn header HTTP vào request |
| `X-aws-ec2-metadata-token-ttl-seconds` | Time To Live | Thời gian sống của token, tối đa 21600s (6h) |
| `X-aws-ec2-metadata-token` | — | Header mang token khi gọi API metadata thật |

### 3. So sánh nhanh

| | Metadata | User Data |
|---|---|---|
| Mục đích | Thông tin về instance | Script bootstrap |
| Khi chạy | Đọc bất kỳ lúc nào | Chỉ lúc launch (mặc định) |
| Endpoint | `/latest/meta-data/` | `/latest/user-data` |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Kích thước User Data | ≤ 16 KB | Base64-encoded |
| Token TTL (IMDSv2) | Tối đa 21600s (6h) | Có thể set ngắn hơn |
| HttpTokens | `optional` / `required` | `required` = bắt buộc IMDSv2, chặn IMDSv1 |

### 5. Cách dùng nâng cao / pattern thực tế
```bash
aws ec2 modify-instance-metadata-options --instance-id i-xxxx \
  --http-tokens required --http-endpoint enabled
# --http-tokens required: ép buộc toàn bộ truy cập metadata phải qua IMDSv2, chặn hoàn toàn IMDSv1
```
Checklist audit CIS AWS Benchmark luôn kiểm tra `HttpTokens=required` trên toàn bộ instance để giảm rủi ro SSRF — đây là câu compliance thật sự nhiều công ty phải chạy định kỳ, không phải lý thuyết suông.

### 6. Cấu hình/thiết lập liên quan
**User Data script** — truyền qua `--user-data file://install.sh`, cú pháp bắt đầu bằng shebang:
```bash
#!/bin/bash
yum update -y
yum install -y httpd
systemctl enable httpd --now
```
Thực tế dùng khi: Auto Scaling Group launch instance mới cần tự cài phần mềm/join cluster (K8s `kubeadm join`, ECS agent register) ngay lúc khởi động, không cần kỹ sư SSH vào tay.

### 7. Vị trí trong kiến trúc (ẩn dụ nhà máy)
User Data là **tờ hướng dẫn ca làm đầu tiên** dán sẵn ở bàn — công nhân mới (instance mới) tự đọc và làm theo mà không cần quản lý (kỹ sư) đứng chỉ tay. Trong kiến trúc thật, đây là cầu nối giữa **AMI tĩnh** (đóng băng lúc build) và **cấu hình runtime động** (chỉ biết lúc launch) — nằm ngay trước khi app code thật sự chạy, và được ASG gọi lại mỗi lần scale-out.

### 8. Quiz
1. Vì sao IMDSv2 an toàn hơn IMDSv1? → **Bắt buộc lấy token qua PUT trước, chống khai thác SSRF**
2. `--http-tokens required` dùng để làm gì? → **Ép buộc toàn bộ truy cập metadata phải qua IMDSv2**
3. Giới hạn kích thước User Data? → **16 KB**
4. ASG gọi lại User Data khi nào? → **Mỗi lần scale-out, để instance mới tự cấu hình**
5. Audit CIS AWS Benchmark kiểm tra thiết lập nào liên quan bài này? → **HttpTokens=required trên toàn bộ instance**

---

## 2.24 — Access Keys and IAM Roles with EC2

### 1. Khái niệm + ví dụ đời sống
Access Key là credential tĩnh dài hạn — không nên nhúng vào EC2. IAM Role gắn qua Instance Profile, cấp credential tạm thời tự xoay vòng. Access Key giống chìa khóa nhà riêng đưa người lạ giữ hộ — mất là mất luôn, phải đổi khóa cả nhà. IAM Role giống thẻ khách tạm thời — hết hạn tự vô hiệu, không ai cần thu hồi tay.

### 2. Lệnh quan trọng
```bash
aws iam create-role --role-name EC2-S3-Read --assume-role-policy-document file://trust.json
aws iam create-instance-profile --instance-profile-name EC2-S3-Read-Profile
aws iam add-role-to-instance-profile --instance-profile-name EC2-S3-Read-Profile --role-name EC2-S3-Read
aws ec2 associate-iam-instance-profile --instance-id i-xxxx --iam-instance-profile Name=EC2-S3-Read-Profile
```

📖 **Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--assume-role-policy-document` | Trust policy | Quy định AI được mặc role này (vd service `ec2.amazonaws.com`) |
| `--role-name` | — | Tên Role IAM |
| `--instance-profile-name` | — | Tên Instance Profile — lớp bọc để gắn Role vào EC2 |
| `associate-iam-instance-profile` | — | Gắn Instance Profile vào instance đang chạy, không cần restart |

### 3. So sánh nhanh

| | Access Key | IAM Role |
|---|---|---|
| Thời hạn | Dài hạn, tĩnh | Tạm thời, tự xoay vòng (STS) |
| Rủi ro rò rỉ | Cao (commit nhầm Git) | Thấp — hết hạn tự vô hiệu |
| Gắn vào EC2 | Không nên | Chuẩn khuyến nghị |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Instance Profile / instance | Tối đa 1 | Role bên trong có thể chứa nhiều Policy |
| MaxSessionDuration | 1h – 12h (mặc định thường 6h) | Thời gian trước khi STS token tự xoay lại |

### 5. Cách dùng nâng cao / pattern thực tế
```bash
aws ec2 replace-iam-instance-profile-association \
  --iam-instance-profile Name=New-Profile --association-id iip-assoc-xxxx
# thay Instance Profile của instance đang chạy mà KHÔNG cần dừng/restart —
# hữu ích khi cần đổi quyền hạn giữa chừng vòng đời instance
```
Audit SOC2/ISO 27001 luôn có hạng mục "no long-lived credentials on compute resources" — kiểm tra chính xác việc Access Key có bị hardcode trong code/`.env`/user data trên EC2 hay không. Nhiều vụ rò rỉ AWS nổi tiếng bắt nguồn từ access key commit nhầm lên GitHub.

### 6. Cấu hình/thiết lập liên quan
**Trust policy JSON** (`trust.json`) — quy định service nào được assume role:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ec2.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
```
Thực tế dùng khi: tạo mới bất kỳ Role nào định gắn cho EC2 — thiếu đúng `Principal` này thì role tạo xong cũng không gắn được vào instance.

### 7. Vị trí trong kiến trúc (ẩn dụ nhà máy)
Role là **đồng phục tạm thời** cấp đúng khu vực cần thiết cho ca làm, hết ca đổi công nhân khác thì đồng phục không theo người cũ. Đây là điểm giao thực sự giữa IAM (đã học ở section trước) và EC2: quyền hạn không còn là thuộc tính tĩnh gắn chết vào server, mà là **danh tính runtime** được AWS STS cấp phát và xoay vòng động.

### 8. Quiz
1. `replace-iam-instance-profile-association` có cần restart instance không? → **Không**
2. Hạng mục audit SOC2/ISO27001 nào liên quan trực tiếp bài này? → **No long-lived credentials on compute resources**
3. Trust policy thiếu đúng Principal thì hậu quả gì? → **Role tạo xong không gắn được vào EC2**
4. 1 instance gắn tối đa bao nhiêu Instance Profile? → **1**
5. "Danh tính runtime" nghĩa là gì? → **Quyền hạn cấp phát động qua Role, không cố định như Access Key**

---

## 2.27 — EC2 Placement Groups

### 1. Khái niệm + ví dụ đời sống
Placement Group kiểm soát cách instance được đặt vật lý trên hạ tầng AWS. Giống chọn chỗ ngồi rạp phim — ngồi sát nhau để nói chuyện nhanh (Cluster), ngồi tách xa để tránh cùng gặp sự cố (Spread), hoặc chia theo dãy ghế riêng (Partition).

### 2. Lệnh quan trọng
```bash
aws ec2 create-placement-group --group-name hpc-cluster --strategy cluster
aws ec2 run-instances --placement GroupName=hpc-cluster,PartitionNumber=1 --count 4
```

📖 **Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--strategy` | — | Loại placement: `cluster` / `spread` / `partition` |
| `--placement` | — | Gắn instance vào 1 placement group lúc launch |
| `PartitionNumber` | — | Chỉ định partition cụ thể, chỉ dùng khi `strategy=partition` |

### 3. So sánh nhanh

| Loại | Mục đích | Đặc điểm |
|---|---|---|
| Cluster | Latency thấp (HPC) | Cùng 1 AZ, rack gần nhau |
| Spread | Tránh single point of failure | Phần cứng riêng, max 7/AZ |
| Partition | Hệ phân tán lớn (Kafka, Cassandra) | Chia partition, mỗi rack riêng |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Spread instance/AZ | Tối đa 7 | Ràng buộc cứng |
| Cluster Placement Group | Cùng 1 AZ | Không thể merge 2 group khác nhau |

### 5. Cách dùng nâng cao / pattern thực tế
```bash
aws ec2 describe-placement-groups --group-names hpc-cluster --query "PlacementGroups[0].State"
```
Sàn giao dịch chứng khoán/crypto dùng Cluster Placement Group cho matching engine — chênh lệch vài chục microsecond latency giữa các node có thể ảnh hưởng trực tiếp kết quả giao dịch.

### 6. Cấu hình/thiết lập liên quan
Không áp dụng — Placement Group không có file cấu hình riêng, chỉ khai báo qua tham số lúc launch.

### 7. Vị trí trong kiến trúc (ẩn dụ nhà máy)
Placement Group là **cách sắp xếp dây chuyền trong xưởng** — quyết định khoảng cách vật lý giữa các máy (instance). Đây là tầng hạ tầng vật lý bên dưới compute layer, phần lớn ứng dụng web/business thông thường không bao giờ chạm tới, chỉ có ý nghĩa khi latency giữa các node là yếu tố sống còn.

### 8. Quiz
1. Loại placement group nào phù hợp HPC low-latency? → **Cluster**
2. Spread Placement Group tối đa bao nhiêu instance/AZ? → **7**
3. Kafka/Cassandra dùng loại nào để 1 rack lỗi không kéo sập cả cluster? → **Partition**
4. Vì sao đa số ứng dụng web không cần Placement Group? → **AWS tự đặt instance hợp lý, latency không phải yếu tố quyết định**
5. Có thể merge 2 Cluster Placement Group khác nhau không? → **Không**

---

## 2.28 — Network Interfaces (ENI, ENA, EFA)

### 1. Khái niệm + ví dụ đời sống
ENI (Elastic Network Interface) là card mạng ảo gắn vào instance. ENA (Elastic Network Adapter) là driver mạng hiệu năng cao. EFA (Elastic Fabric Adapter) là ENA mở rộng cho HPC/ML, thêm giao tiếp OS-bypass. ENI như cổng mạng vật lý, ENA như loại cáp tốc độ cao, EFA như đường truyền chuyên dụng siêu tốc chỉ dùng khi có nhu cầu cực đặc thù.

### 2. Lệnh quan trọng
```bash
aws ec2 create-network-interface --subnet-id subnet-xxxx --groups sg-xxxx
aws ec2 attach-network-interface --network-interface-id eni-xxxx --instance-id i-xxxx --device-index 1
aws ec2 detach-network-interface --attachment-id eni-attach-xxxx --force
```

📖 **Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--groups` | Security Groups | Gắn SG cho ENI ngay lúc tạo |
| `--device-index` | — | Thứ tự card mạng; 0 là ENI chính (không detach được), 1+ là phụ |
| `--force` | — | Gỡ ENI ngay cả khi instance đang chạy, dùng cho failover khẩn cấp |

### 3. So sánh nhanh

| | ENI | ENA | EFA |
|---|---|---|---|
| Là gì | Card mạng ảo | Driver hiệu năng cao | ENA + OS-bypass |
| Dùng cho | Kết nối cơ bản, failover | Băng thông cao (100Gbps) | HPC, MPI, ML distributed |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Số ENI tối đa/instance | Phụ thuộc instance type | Instance lớn hơn cho phép nhiều ENI hơn |
| ENI device-index 0 | Không thể detach | Là ENI chính của instance |

### 5. Cách dùng nâng cao / pattern thực tế
```bash
aws ec2 modify-network-interface-attribute --network-interface-id eni-xxxx --groups sg-new
```
Team vận hành production dùng detach/attach ENI để chuyển traffic sang instance dự phòng trong vài giây khi phát hiện lỗi phần cứng — nhanh hơn nhiều so với gán lại Elastic IP hoặc đổi DNS.

### 6. Cấu hình/thiết lập liên quan
Không áp dụng — cấu hình ENI thực hiện qua tham số CLI/Console, không có file riêng. Lưu ý: OS bên trong instance cần tự nhận diện network interface phụ (không tự DHCP như eth0 chính).

### 7. Vị trí trong kiến trúc (ẩn dụ nhà máy)
ENI là **cổng giao hàng** của xưởng, ENA/EFA là chất lượng con đường cao tốc dẫn đến cổng đó. Mọi instance hiện đại (Nitro-based) đã có sẵn ENI+ENA mặc định — không cần cấu hình gì thêm để có hiệu năng mạng tốt; EFA là lớp hiếm khi chạm tới trừ khi bài toán thực sự là HPC/distributed training.

### 8. Quiz
1. Vì sao đa số ứng dụng không cần cấu hình ENA thủ công? → **Instance Nitro-based đã có sẵn ENA mặc định**
2. Ai thực sự cần EFA? → **Cluster huấn luyện AI đa node GPU (distributed training)**
3. ENI device-index 0 có thể detach không? → **Không**
4. Kỹ thuật failover bằng ENI nhanh hơn cách nào? → **Gán lại Elastic IP hoặc đổi DNS**
5. `--force` trong detach-network-interface dùng khi nào? → **Instance đang chạy vẫn muốn gỡ ngay (failover khẩn cấp)**

---

## 2.29 — Public, Private and Elastic IP Addresses

### 1. Khái niệm + ví dụ đời sống
Private IP cố định trong VPC. Public IP tự cấp, đổi mỗi lần stop/start. Elastic IP (EIP) là public IP tĩnh, giữ nguyên dù stop/start. Private IP như số phòng nội bộ công ty, Public IP như sim điện thoại tạm cấp mỗi lần đổi, EIP như số điện thoại cố định giữ mãi mãi.

### 2. Lệnh quan trọng
```bash
aws ec2 allocate-address --domain vpc
aws ec2 associate-address --instance-id i-xxxx --allocation-id eipalloc-xxxx
aws ec2 release-address --allocation-id eipalloc-xxxx
```

📖 **Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--domain vpc` | — | Cấp EIP dùng cho VPC (bắt buộc với VPC hiện đại) |
| `--allocation-id` | — | ID định danh 1 EIP đã cấp phát |
| `release-address` | — | Trả lại EIP cho AWS, bắt buộc khi không dùng nữa để tránh phí |

### 3. So sánh nhanh

| | Private IP | Public IP | Elastic IP |
|---|---|---|---|
| Đổi khi stop/start? | Không | Có | Không |
| Phí | Miễn phí | Miễn phí | Phí nếu không gắn tài nguyên đang chạy |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| EIP/region | 5 mặc định | Soft limit, xin tăng qua Service Quotas |
| EIP idle | Bị tính phí | Không gắn vào tài nguyên đang chạy |

### 5. Cách dùng nâng cao / pattern thực tế
```bash
aws ec2 describe-addresses --query "Addresses[?AssociationId==null]"
# lọc ra các EIP chưa gắn vào tài nguyên nào — công cụ dọn dẹp chi phí định kỳ
```
Elastic IP trong production thực tế chủ yếu gắn vào NAT Gateway, VPN endpoint, hoặc hệ thống legacy cần whitelist IP tĩnh ở firewall đối tác (B2B/ngân hàng) — không phải gắn trực tiếp vào app server.

### 6. Cấu hình/thiết lập liên quan
Không áp dụng — IP address không có file cấu hình riêng phía AWS.

### 7. Vị trí trong kiến trúc (ẩn dụ nhà máy)
Loại IP là **loại danh thiếp** instance dùng để giao tiếp ra ngoài xưởng. Trong kiến trúc production hiện đại, EC2 app server hiếm khi gắn EIP trực tiếp — traffic luôn đi qua ALB/NLB (DNS cố định do AWS quản lý), EC2 phía sau nằm hoàn toàn trong private subnet.

### 8. Quiz
1. Vì sao EC2 app server hiện đại hiếm khi gắn EIP trực tiếp? → **Traffic đi qua ALB/NLB có DNS cố định, EC2 ở hoàn toàn private subnet**
2. Lệnh nào lọc ra EIP chưa gắn tài nguyên nào? → **describe-addresses --query "Addresses[?AssociationId==null]"**
3. Giới hạn EIP mặc định/region? → **5**
4. Khi nào EIP bị tính phí? → **Khi không gắn vào tài nguyên đang chạy**
5. EIP trong production thực tế chủ yếu gắn vào đâu? → **NAT Gateway, VPN endpoint, hệ thống legacy cần whitelist IP**

---

## 2.30 — NAT for Public Addresses

### 1. Khái niệm + ví dụ đời sống
NAT dịch giữa Private IP và Public IP tại Internet Gateway — Public IP không gắn trực tiếp vào network interface của instance. Giống lễ tân công ty nhận thư gửi đến địa chỉ công ty rồi chuyển đúng vào hộp thư nội bộ nhân viên — người ngoài không cần biết địa chỉ nội bộ thật.

### 2. Lệnh quan trọng
Không có lệnh riêng — đây là cơ chế nền tự động của AWS tại Internet Gateway, không cấu hình thủ công.

📖 **Từ điển flag nhanh**

Không áp dụng — bài này không có lệnh/flag để tra cứu.

### 3. So sánh nhanh
Không áp dụng.

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Tỉ lệ NAT tại IGW | 1:1 | 1 Public IP ánh xạ đúng 1 Private IP |

### 5. Cách dùng nâng cao / pattern thực tế
```bash
ip addr    # chạy trong instance có Public IP/EIP — chỉ thấy Private IP
```
Đây là kiến thức nền để debug đúng khi có sự cố — kỹ sư mới thường nhầm tưởng lỗi cấu hình khi thấy `ip addr` chỉ hiện Private IP dù instance rõ ràng có Public IP/EIP.

### 6. Cấu hình/thiết lập liên quan
Không áp dụng.

### 7. Vị trí trong kiến trúc (ẩn dụ nhà máy)
NAT tại IGW là **phòng chuyển thư** của nhà máy — đứng ở biên giới VPC, dịch địa chỉ công khai ↔ nội bộ mà không ai bên trong xưởng cần biết.

### 8. Quiz
1. `ip addr` trong instance có Public IP sẽ hiện gì? → **Chỉ Private IP**
2. NAT 1:1 xảy ra ở đâu? → **Internet Gateway**
3. Đây là kiến thức nền để làm gì trong công việc thật? → **Debug đúng hướng, tránh nhầm tưởng lỗi cấu hình**
4. NAT ở Internet Gateway có cần cấu hình thủ công không? → **Không, tự động**
5. Tỉ lệ NAT 1:1 nghĩa là gì? → **1 Public IP ánh xạ đúng 1 Private IP**

---

## 2.32 — Private Subnets and Bastion Hosts

### 1. Khái niệm + ví dụ đời sống
Private Subnet không route trực tiếp ra Internet Gateway. Bastion Host là EC2 ở Public Subnet, làm cửa ngõ SSH duy nhất vào Private Subnet. Giống bảo vệ ở cổng chính tòa nhà — khách không được đi thẳng vào phòng nội bộ, phải qua cổng bảo vệ trước.

### 2. Lệnh quan trọng
```bash
ssh -J ec2-user@<bastion-public-ip> ec2-user@<private-instance-ip>
```

📖 **Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `-J` | ProxyJump | Nhảy qua Bastion trong 1 lệnh, không cần copy key SSH lên Bastion |
| `-i` | Identity file | Chỉ định file private key SSH dùng để đăng nhập |

### 3. So sánh nhanh

| | Bastion Host truyền thống | SSM Session Manager |
|---|---|---|
| Port 22 công khai | Cần mở | Không cần |
| Quản lý key SSH | Cần | Không cần |
| Log truy cập | Tự cấu hình | Tự động vào CloudTrail |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| SG instance private | Chỉ cho phép port 22 từ SG Bastion | Không mở `0.0.0.0/0` |

### 5. Cách dùng nâng cao / pattern thực tế
```bash
# ~/.ssh/config — đơn giản hóa lệnh SSH nhảy qua Bastion
Host private-app
  HostName <private-instance-ip>
  ProxyJump ec2-user@<bastion-public-ip>
  User ec2-user
```
Nhiều tổ chức hiện đại đã thay Bastion truyền thống bằng **AWS Systems Manager Session Manager** — không mở port 22 công khai, không quản lý/xoay key SSH, mọi phiên truy cập tự log vào CloudTrail. SAA-C03 vẫn hỏi Bastion vì đây là pattern nền tảng, nhưng SSM là hướng khuyến nghị hơn trong production mới.

### 6. Cấu hình/thiết lập liên quan
**`~/.ssh/config`** như ví dụ trên — cú pháp `ProxyJump` để không phải gõ lại `-J` mỗi lần. Thực tế dùng khi: kỹ sư SSH vào cùng 1 tập instance private thường xuyên, tránh gõ lệnh dài lặp lại.

### 7. Vị trí trong kiến trúc (ẩn dụ nhà máy)
Bastion Host là **bảo vệ đứng ở cổng chính duy nhất** của toàn xưởng. Đây là điểm kiểm soát truy cập admin tập trung trong kiến trúc thật — mọi audit bảo mật đều muốn thấy 1 điểm truy cập duy nhất, dễ log, dễ giới hạn, thay vì mở SSH rải rác trên nhiều instance.

### 8. Quiz
1. Giải pháp hiện đại nào đang thay thế Bastion truyền thống? → **AWS Systems Manager Session Manager**
2. `-J` trong lệnh SSH dùng để làm gì? → **Nhảy qua Bastion (ProxyJump) trong 1 lệnh**
3. SG instance private nên mở port 22 cho nguồn nào? → **SG của Bastion**
4. Lợi ích chính của SSM Session Manager so với Bastion? → **Không mở port 22 công khai, không quản lý key SSH, tự log CloudTrail**
5. Vì sao audit bảo mật ưu tiên 1 điểm truy cập admin duy nhất? → **Dễ log, dễ giới hạn, giảm bề mặt tấn công**

---

## 2.34 — NAT Gateways and NAT Instances Overview

### 1. Khái niệm + ví dụ đời sống
NAT Gateway cho instance Private Subnet ra Internet (1 chiều), đặt ở Public Subnet. Giống cửa một chiều — người trong nhà ra ngoài mua đồ được, người ngoài không tự vào được.

### 2. Lệnh quan trọng
```bash
aws ec2 create-nat-gateway --subnet-id <public-subnet-id> --allocation-id <eip-allocation-id>
aws ec2 create-route --route-table-id <private-rt-id> \
  --destination-cidr-block 0.0.0.0/0 --nat-gateway-id nat-xxxx
```

📖 **Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--subnet-id` | — | NAT Gateway phải đặt ở Public Subnet |
| `--allocation-id` | — | EIP gắn cho NAT Gateway (bắt buộc) |
| `--destination-cidr-block` | — | `0.0.0.0/0` = default route (mọi traffic ra ngoài) |
| `--nat-gateway-id` | — | Route của Private Subnet trỏ đến NAT Gateway này |

### 3. So sánh nhanh

| | NAT Gateway | NAT Instance |
|---|---|---|
| Quản lý | AWS managed, tự scale | Tự quản lý (là 1 EC2) |
| Băng thông | Đến 100 Gbps | Theo instance type |
| Bảo trì | Không cần patch | Cần tự patch OS |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| NAT Gateway/AZ | 1 (khuyến nghị) | Cần để đạt HA thật sự |
| Chi phí | Theo giờ + theo GB xử lý | Tính phí dù không dùng |

### 5. Cách dùng nâng cao / pattern thực tế
```bash
aws ec2 create-vpc-endpoint --vpc-id $VPC_ID --service-name com.amazonaws.ap-southeast-1.s3 \
  --route-table-ids $PRIVATE_RT_ID --vpc-endpoint-type Gateway
# Gateway VPC Endpoint cho S3: MIỄN PHÍ, cho traffic đi thẳng nội bộ AWS, bypass NAT Gateway hoàn toàn
```
Case study cost-optimization kinh điển: instance private gọi S3 rất nhiều → traffic qua NAT Gateway → tốn phí data processing không cần thiết. Giải pháp trên giúp giảm đáng kể hóa đơn NAT Gateway — câu hỏi domain Cost-Optimized (20%) rất hay gặp.

### 6. Cấu hình/thiết lập liên quan
**Route table entry** của Private Subnet — cú pháp: `Destination: 0.0.0.0/0, Target: nat-xxxx`. Thực tế dùng khi: mọi Private Subnet cần ra Internet đều phải có route này, thiếu route = instance private không kết nối được ra ngoài dù NAT Gateway đã tạo xong.

### 7. Vị trí trong kiến trúc (ẩn dụ nhà máy)
NAT Gateway là **cửa ra một chiều** của xưởng — đối xứng với Bastion Host (cửa vào). NAT Gateway thường là dòng chi phí ẩn lớn nhất trong hóa đơn VPC hàng tháng; hệ thống có traffic outbound lớn nên luôn cân nhắc VPC Endpoint để giảm chi phí.

### 8. Quiz
1. NAT Gateway đặt ở subnet nào? → **Public Subnet**
2. Giải pháp cost-optimization khi instance private gọi S3 rất nhiều? → **Thêm Gateway VPC Endpoint cho S3 (miễn phí), bypass NAT Gateway**
3. Vì sao cần 1 NAT Gateway/AZ thay vì dùng chung? → **Tránh single point of failure khi 1 AZ gặp sự cố**
4. Route table Private Subnet thiếu route đến NAT Gateway thì hậu quả gì? → **Instance private không kết nối được ra Internet dù NAT Gateway đã tạo xong**
5. NAT Gateway tính phí theo gì? → **Theo giờ và theo GB xử lý, dù không dùng**

---

## 🧪 Lab tổng — Dựng kiến trúc Public/Private Subnet hoàn chỉnh

🧭 Bối cảnh: Ghép toàn bộ 9 khái niệm trên thành 1 hệ thống thật — đúng những gì 1 kỹ sư mới vào công ty sẽ được giao làm trong tuần đầu.

```bash
# 1. VPC + 2 Subnet
aws ec2 create-vpc --cidr-block 10.0.0.0/16
aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24   # Public
aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24   # Private

# 2. Internet Gateway + Public Route
aws ec2 create-internet-gateway
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID
aws ec2 create-route --route-table-id $PUBLIC_RT_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID

# 3. IAM Role cho App Server (đọc S3)
aws iam create-role --role-name AppServer-S3Read --assume-role-policy-document file://trust.json
aws iam attach-role-policy --role-name AppServer-S3Read --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
aws iam create-instance-profile --instance-profile-name AppServer-Profile
aws iam add-role-to-instance-profile --instance-profile-name AppServer-Profile --role-name AppServer-S3Read

# 4. Bastion Host (Public Subnet)
aws ec2 run-instances --image-id ami-xxxx --instance-type t3.micro \
  --subnet-id $PUBLIC_SUBNET_ID --associate-public-ip-address --security-group-ids $SG_BASTION

# 5. App Server (Private Subnet, User Data + IAM Role)
aws ec2 run-instances --image-id ami-xxxx --instance-type t3.micro \
  --subnet-id $PRIVATE_SUBNET_ID --security-group-ids $SG_APP \
  --iam-instance-profile Name=AppServer-Profile --user-data file://install-httpd.sh

# 6. NAT Gateway cho Private Subnet ra Internet
aws ec2 allocate-address --domain vpc
aws ec2 create-nat-gateway --subnet-id $PUBLIC_SUBNET_ID --allocation-id $EIP_ALLOC_ID
aws ec2 create-route --route-table-id $PRIVATE_RT_ID --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_GW_ID

# 7. (Cost-optimization thật) Gateway VPC Endpoint cho S3 — bypass NAT Gateway
aws ec2 create-vpc-endpoint --vpc-id $VPC_ID --service-name com.amazonaws.ap-southeast-1.s3 \
  --route-table-ids $PRIVATE_RT_ID --vpc-endpoint-type Gateway
```

✅ Verify: `ssh -J ec2-user@<bastion-ip> ec2-user@<app-ip> "systemctl status httpd && aws s3 ls && curl -I https://amazon.com"`

🧹 Cleanup: xóa NAT Gateway → release EIP → terminate instances → xóa route table/subnet/IGW/VPC.

⚠️ Lưu ý dễ sai/tốn phí: NAT Gateway tính phí theo giờ+GB dù không dùng; VPC Endpoint cho S3 miễn phí và nên luôn có trong production thật để giảm phí NAT; quên release EIP là nguồn phí phổ biến nhất.

---

## Cheat Sheet

| Việc | Lệnh/Khái niệm | Ghi nhớ |
|---|---|---|
| Launch instance | `run-instances` | Chọn family theo workload, `CpuCredits=unlimited` nếu cần tránh throttle |
| Bootstrap | User Data ≤16KB | ASG gọi lại mỗi lần scale-out |
| Gắn quyền | Instance Profile + Role | Không hardcode Access Key — audit SOC2/ISO27001 luôn check |
| Failover mạng | Detach/attach ENI | Nhanh hơn đổi EIP/DNS |
| Ra Internet (private) | NAT Gateway | Thêm VPC Endpoint cho S3/DynamoDB để giảm phí |
| Vào SSH (private) | Bastion / SSM Session Manager | SSM là hướng hiện đại hơn |
| Placement Group | Cluster/Spread/Partition | Chỉ cần khi latency giữa node là yếu tố sống còn |

**Pattern chuẩn:** `Public Subnet (Bastion/SSM + NAT Gateway) ↔ Private Subnet (App Server, IAM Role, VPC Endpoint cho S3)` — đây chính là kiến trúc khởi điểm của phần lớn hệ thống production thật, không chỉ để thi.
