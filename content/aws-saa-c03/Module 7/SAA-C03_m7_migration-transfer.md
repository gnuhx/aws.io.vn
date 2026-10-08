# SAA-C03 · Module 7 — Mở rộng & Về đích
## 🔹 Section: Migration and Transfer (7.1 – 7.12)

**Domain thi liên quan:** Design Resilient Architectures (26%) · Design Cost-Optimized Architectures (20%) — migration hầu như luôn đi kèm bài toán resilience khi cutover + tối ưu chi phí băng thông/thời gian di dời.

**Danh sách bài trong section:**

| Bài | Tên | Loại |
|---|---|---|
| 7.1 | Introduction | meta |
| 7.2 | AWS Migration Tools Overview | kỹ thuật |
| 7.3 | AWS Application Discovery Service | kỹ thuật |
| 7.4 | AWS Database Migration Service (DMS) | kỹ thuật |
| 7.5 | AWS Application Migration Service (MGN) | kỹ thuật |
| 7.6 | AWS DataSync | kỹ thuật |
| 7.7 | AWS Snow Family | kỹ thuật |
| 7.8 | The 7 Rs of Migration | kỹ thuật |
| 7.9 | Exam Cram | meta |
| 7.10 | Architecture Patterns | meta |
| 7.11 | Migration and Transfer Quiz | meta |
| 7.12 | Cheat Sheets | meta |

> ⚠️ Section này **không có bài `[HOL]` nào trong roadmap gốc**. Lab tổng ở BƯỚC 1.5 là lab **tự dựng** mô phỏng kịch bản di dời thật, dùng EC2/RDS free tier đóng vai hệ thống "on-premise" giả lập.

---

## 🗺️ Roadmap tiến độ — Module 7

- [x] ✅ **🔹 Migration and Transfer (7.1–7.12)** ← đang học
- [ ] ⏳ 🔹 Web, Mobile, ML, and Cost Management (7.13–7.24)
- [ ] ⏳ 🔹 Full-Length Practice Exam (7.25)
- [ ] ⏳ 🔹 Final Exam Preparation (7.26–7.27)

*(Kế thừa nhà máy nền đầy đủ từ Module 1→6: Route 53/CloudFront ở cổng, VPC + SG/NACL, ALB/NLB, EC2/ASG + Lambda, RDS/Aurora + ElastiCache, S3, SQS/SNS/EventBridge/Step Functions/API Gateway, ECS/EKS/ECR, CloudFormation/Beanstalk/Config/Secrets Manager, CloudWatch/CloudTrail, và toàn bộ lớp phủ an ninh IAM/KMS/GuardDuty/WAF/Shield/Cognito/ACM.)*

---

# BƯỚC 1 — Nội dung từng bài kỹ thuật

## 7.2 — AWS Migration Tools Overview

### 1. Khái niệm + ví dụ đời sống
AWS không có "1 nút bấm" để migrate — mà cung cấp **1 bộ công cụ theo từng giai đoạn**: đánh giá (Assess) → lên kế hoạch (Mobilize) → thực thi (Migrate & Modernize). **AWS Migration Hub** là bảng điều khiển trung tâm theo dõi tiến độ của mọi công cụ này ở 1 nơi duy nhất. Ví dụ đời sống: công ty chuyển nhà trọn gói có 1 bảng điều phối trung tâm theo dõi cùng lúc đội khảo sát, đội đóng gói, đội xe tải, đội lắp đặt — dù mỗi đội dùng công cụ khác nhau.

- **Assess**: AWS Application Discovery Service (khảo sát hạ tầng hiện có), Migration Evaluator (ước tính TCO khi lên AWS)
- **Mobilize**: AWS Migration Hub, Migration Hub Strategy Recommendations (tự động đề xuất chiến lược 7R)
- **Migrate & Modernize**: AWS DMS (database), AWS MGN (server/lift-and-shift), AWS DataSync (file), AWS Snow Family (offline/petabyte-scale), AWS Transfer Family (SFTP/FTPS/FTP managed)

### 2. Lệnh quan trọng

```bash
# Set home region cho Migration Hub (chỉ set được 1 lần cho mỗi account)
aws migrationhub-config create-home-region-control \
  --home-region us-east-1 \
  --target '{"Type":"ACCOUNT","Id":"123456789012"}' \
  --dry-run false

# Xem toàn bộ tiến độ migration đang track qua Migration Hub
aws migrationhub list-progress-update-streams

# Liệt kê tài nguyên đã tạo (artifact) gắn với 1 migration task
aws migrationhub list-created-artifacts \
  --progress-update-stream "OnPremStream" \
  --migration-task-name "AppServer-01"
```

**Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--home-region` | Home Region | Region chính lưu metadata Migration Hub, set 1 lần duy nhất, không đổi được sau đó |
| `--target` | Migration Target | Đối tượng (account/org) áp dụng home region control |
| `--dry-run` | Dry Run | `false` = thực thi thật; `true` = chỉ kiểm tra quyền, không tạo gì |
| `--progress-update-stream` | Progress Update Stream | Kênh nhận cập nhật tiến độ từ 1 công cụ migration cụ thể (vd on-prem tool tự custom) |
| `--migration-task-name` | Migration Task | Tên định danh 1 tác vụ di dời cụ thể (vd tên server/app đang chuyển) |

### 3. So sánh nhanh

| Nhóm | Mục đích | Dịch vụ tiêu biểu | Khi nào dùng |
|---|---|---|---|
| Assess | Biết mình có gì, nên chuyển gì trước | Application Discovery Service, Migration Evaluator | Trước khi lên kế hoạch, chưa biết rõ hạ tầng hiện tại |
| Mobilize | Lên chiến lược + theo dõi tổng | Migration Hub, Strategy Recommendations | Sau khi có dữ liệu Discovery, cần quyết định 7R cho từng app |
| Migrate & Modernize | Thực thi di dời thật | DMS, MGN, DataSync, Snow Family | Khi đã chốt chiến lược, bắt đầu chuyển thật |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Home Region | Set 1 lần/account | Không thể đổi sau khi đã set — chọn kỹ trước |
| Migration Hub | Miễn phí | Bản thân Hub không tính phí, chỉ trả phí các service migration thật sự dùng bên dưới |

### 5. Cách dùng nâng cao / pattern thực tế
**Migration Hub Strategy Recommendations** tự động chấm điểm và đề xuất 1 trong 7 chiến lược (7R, xem bài 7.8) cho từng server dựa trên dữ liệu thu thập từ Application Discovery Service — không cần con người rà thủ công từng app.

**Case thực tế:** một ngân hàng có ~800 máy chủ on-premise tích lũy qua 15 năm, không ai còn nhớ rõ server nào phụ thuộc server nào. Đội hạ tầng chạy Discovery Agent trong 2 tuần để thu thập dependency + utilization, sau đó dùng Strategy Recommendations để tự động phân loại: server ít traffic, công nghệ cũ → Retire; server chạy .NET còn support → Rehost; hệ thống core banking → Refactor dài hạn. Việc này rút thời gian lập kế hoạch từ nhiều tháng xuống còn vài tuần.

### 7. Vị trí trong kiến trúc (nhà máy nền)
Đây **không phải 1 trạm sản xuất** trong nhà máy — mà là **"phòng kế hoạch mở rộng"** đứng tách biệt hẳn ngoài dây chuyền, quan sát toàn bộ bản đồ nhà máy hiện tại (cũ) và nhà máy mới (AWS) để quyết định nên xây trạm nào theo cách nào. Nó không nằm trong luồng xử lý request của khách hàng.

### 8. 5 câu hỏi ôn tập
1. **Q:** Home Region của Migration Hub có đổi được sau khi set không? **A:** Không — chỉ set được 1 lần cho mỗi account, cần chọn cẩn thận.
2. **Q:** Công cụ nào tự động đề xuất chiến lược 7R cho từng server? **A:** Migration Hub Strategy Recommendations, dựa trên dữ liệu từ Application Discovery Service.
3. **Q:** Migration Hub có tính phí riêng không? **A:** Không, bản thân Hub miễn phí — chỉ trả phí các service migration thật (DMS, MGN...) chạy bên dưới.
4. **Q:** Nhóm "Assess" gồm những dịch vụ nào? **A:** Application Discovery Service và Migration Evaluator.
5. **Q:** Vì sao ngân hàng trong case thực tế cần chạy Discovery Agent trước khi quyết định 7R? **A:** Vì không có dữ liệu dependency/utilization chính xác thì không thể phân loại đúng chiến lược, dễ gây downtime khi tắt nhầm server còn phụ thuộc.

---

## 7.3 — AWS Application Discovery Service

### 1. Khái niệm + ví dụ đời sống
Dịch vụ khảo sát hạ tầng on-premise **trước khi** di dời: thu thập cấu hình server, mức sử dụng tài nguyên (CPU/RAM/disk/network), và **dependency giữa các server** (server nào gọi tới server nào). Ví dụ đời sống: đội khảo sát đến đo đạc, chụp ảnh nhà cũ trước khi chuyển đồ, ghi chú "tủ lạnh này cắm chung ổ với lò vi sóng" để biết cái gì phải dời cùng lúc.

- **Agentless Discovery Connector**: OVA deploy trên VMware vCenter, không cần cài gì trên guest OS — thu thập cấu hình + utilization ở mức VM.
- **Agent-based (Discovery Agent)**: cài trực tiếp trên từng server (VM hoặc physical, Windows/Linux) — thu thập chi tiết hơn: process đang chạy, network connection theo port, giúp vẽ **dependency map** chính xác.

### 2. Lệnh quan trọng

```bash
# Bắt đầu thu thập dữ liệu từ các agent đã cài
aws discovery start-data-collection-by-agent-ids \
  --agent-ids i-0abc123 i-0def456

# Xem danh sách agent đã đăng ký và trạng thái
aws discovery describe-agents

# Export toàn bộ dữ liệu discovery ra CSV để phân tích/đưa vào Strategy Recommendations
aws discovery start-export-task \
  --export-data-format CSV
```

**Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--agent-ids` | Agent Identifiers | ID của các Discovery Agent đã cài trên server on-prem cần bật thu thập dữ liệu |
| `--export-data-format` | Export Format | Định dạng file xuất ra (CSV) chứa toàn bộ dữ liệu inventory/dependency đã thu thập |

### 3. So sánh nhanh

| Loại | Setup | Phạm vi thu thập | Hỗ trợ physical server? |
|---|---|---|---|
| Agentless Connector | Deploy 1 OVA trên vCenter, không đụng guest OS | Cấu hình VM + utilization tổng quát | Không (chỉ VMware VM) |
| Discovery Agent | Cài agent trên từng server | Chi tiết process + network connection → dependency map chính xác | Có (VM lẫn physical) |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Thời gian lưu dữ liệu | 90 ngày sau khi ngừng thu thập | Sau đó dữ liệu bị xóa, cần export trước nếu cần lưu lâu |
| Nơi export | Amazon S3 | Dữ liệu CSV export ra để phân tích offline hoặc nạp vào Migration Hub Strategy Recommendations |

### 5. Cách dùng nâng cao / pattern thực tế
Dữ liệu dependency-map từ Discovery Agent là **đầu vào bắt buộc** để Migration Hub Strategy Recommendations chấm điểm 7R chính xác — thiếu bước này, đề xuất 7R chỉ dựa trên đoán, dễ sai.

**Case thực tế:** một chuỗi bán lẻ có hệ thống POS legacy chạy trên network nội bộ mà tài liệu kiến trúc đã thất lạc từ nhiều năm trước. Trước khi tắt bất kỳ server nào để migrate, đội hạ tầng cài Discovery Agent trong 3 tuần để vẽ lại bản đồ dependency thật, phát hiện ra 1 server "tưởng không ai dùng" thực chất đang phục vụ báo cáo tồn kho cuối ngày cho toàn bộ chuỗi cửa hàng — tránh được sự cố downtime nghiêm trọng nếu tắt nhầm.

### 6. Cấu hình/thiết lập liên quan
Discovery Agent cần IAM policy quản lý là `AWSApplicationDiscoveryAgentAccess` gắn cho role mà agent dùng để gửi dữ liệu về AWS; cài đặt qua file `.rpm` (Linux) hoặc `.msi` (Windows) tải từ console Migration Hub, cấu hình endpoint region + access key lúc setup lần đầu.

### 7. Vị trí trong kiến trúc (nhà máy nền)
Cùng nhóm **"phòng kế hoạch mở rộng"** như Migration Hub (bài 7.2) — là **đội khảo sát hiện trường**, thu thập dữ liệu đầu vào cho phòng kế hoạch trước khi quyết định xây trạm mới nào trong nhà máy AWS.

### 8. 5 câu hỏi ôn tập
1. **Q:** Agentless Connector có hỗ trợ physical server không? **A:** Không — chỉ hỗ trợ VM trên VMware vCenter.
2. **Q:** Muốn có dependency map chi tiết theo network connection, dùng loại nào? **A:** Discovery Agent (agent-based), vì thu thập tới mức process/port.
3. **Q:** Dữ liệu discovery lưu bao lâu sau khi dừng thu thập? **A:** 90 ngày, sau đó bị xóa nếu không export.
4. **Q:** Export dữ liệu discovery ra đâu để phân tích? **A:** Amazon S3, dạng CSV.
5. **Q:** Vì sao case chuỗi bán lẻ cần chạy Discovery Agent 3 tuần thay vì tắt máy luôn? **A:** Vì thiếu tài liệu dependency thật, cần thời gian đủ dài để agent bắt được toàn bộ pattern kết nối, tránh tắt nhầm server còn đang phục vụ chức năng quan trọng.

---

## 7.4 — AWS Database Migration Service (DMS)

### 1. Khái niệm + ví dụ đời sống
DMS di dời **database** với downtime tối thiểu, hỗ trợ cả **homogeneous** (Oracle → Oracle) lẫn **heterogeneous** (Oracle → Aurora PostgreSQL — cần dùng kèm **AWS SCT - Schema Conversion Tool** để convert schema/code trước khi DMS chuyển data). Ví dụ đời sống: xe tải chuyên chở đồ dễ vỡ, có thể chạy liên tục nhiều chuyến trong khi kho cũ vẫn hoạt động bình thường (đồng bộ thay đổi liên tục), tới khi kho mới đã đầy đủ y hệt thì mới "khóa kho cũ, mở kho mới" trong vài phút.

- **Full Load**: copy toàn bộ dữ liệu hiện có sang target 1 lần.
- **CDC (Change Data Capture)**: sau full load, tiếp tục bắt các thay đổi (insert/update/delete) từ source và áp lên target theo thời gian thực, cho tới khi sẵn sàng cutover.
- **Replication instance**: 1 EC2 instance được DMS quản lý, chạy engine replication — không phải server ứng dụng của bạn.

### 2. Lệnh quan trọng

```bash
# Tạo replication instance (server trung gian chạy engine chuyển dữ liệu)
aws dms create-replication-instance \
  --replication-instance-identifier dms-repl-01 \
  --replication-instance-class dms.t3.micro \
  --allocated-storage 20 \
  --multi-az false

# Tạo endpoint trỏ vào database nguồn
aws dms create-endpoint \
  --endpoint-identifier source-oracle \
  --endpoint-type source \
  --engine-name oracle \
  --server-name onprem-db.company.local \
  --port 1521

# Tạo và chạy replication task (full-load + cdc)
aws dms create-replication-task \
  --replication-task-identifier task-01 \
  --migration-type full-load-and-cdc \
  --table-mappings file://table-mappings.json
```

**Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--replication-instance-class` | Replication Instance Class | Kích thước EC2 chạy engine DMS (vd `dms.t3.micro` cho test/free tier) |
| `--allocated-storage` | Allocated Storage | Dung lượng ổ đĩa (GB) gắn cho replication instance để lưu log/cache trong lúc chuyển |
| `--multi-az` | Multi-AZ | Bật standby replication instance ở AZ khác để HA khi chạy production |
| `--endpoint-type` | Endpoint Type | `source` hoặc `target` — database nguồn hay đích |
| `--engine-name` | Database Engine | Loại engine (oracle, mysql, postgres, aurora...) của endpoint |
| `--migration-type` | Migration Type | `full-load`, `cdc`, hoặc `full-load-and-cdc` — kiểu chạy task |
| `--table-mappings` | Table Mappings | File JSON định nghĩa bảng nào được chuyển, có transform gì không |

### 3. So sánh nhanh

| Migration type | Khi nào dùng | Downtime |
|---|---|---|
| Full Load only | Data tĩnh, không đổi trong lúc migrate (vd môi trường test) | Cần dừng ghi vào source trong lúc chạy |
| Full Load + CDC | Production đang chạy, cần downtime tối thiểu | Gần như 0 cho tới lúc cutover thật |
| CDC only | Đã full-load xong trước đó bằng cách khác, chỉ cần đồng bộ tiếp | Không cần full load lại |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Replication instance class | `dms.t3.micro` → `dms.r5.24xlarge` | Chọn theo throughput/số task chạy song song |
| Multi-AZ | Optional, tính thêm phí gấp đôi instance | Chỉ bật khi cần HA cho task chạy dài hạn/production |
| Heterogeneous migration | Cần AWS SCT convert schema trước | DMS chỉ chuyển **data**, không tự convert stored procedure/schema khác engine |

### 5. Cách dùng nâng cao / pattern thực tế
Bật **Multi-AZ** cho replication instance khi task chạy CDC dài ngày trong production để tránh single point of failure làm gián đoạn đồng bộ.

**Case thực tế:** một sàn giao dịch chứng khoán cần di dời database Oracle on-premise sang Aurora PostgreSQL nhưng downtime tối đa cho phép chỉ 5 phút (ngoài giờ giao dịch). Đội hạ tầng dùng AWS SCT convert schema + stored procedure trước, sau đó chạy DMS full-load-and-cdc trong nhiều ngày để đồng bộ liên tục, và chỉ thực hiện cutover (chuyển traffic ứng dụng sang Aurora) đúng vào khung giờ thị trường đóng cửa cuối tuần.

### 6. Cấu hình/thiết lập liên quan
**Endpoint** cấu hình bằng JSON/tham số CLI chứa connection info (server, port, credential qua Secrets Manager); **Task settings** JSON định nghĩa `table-mappings` (chọn schema/table nào, transform rule như đổi tên cột) — cần đụng tới khi migrate chỉ 1 phần database thay vì toàn bộ, hoặc cần rename/filter dữ liệu khi chuyển đổi engine.

### 7. Vị trí trong kiến trúc (nhà máy nền)
Khớp vào **"Kho tổng — RDS/Aurora"** nhưng đóng vai **"đội bốc dỡ hàng chuyên trách tạm thời"** — đứng giữa kho cũ (database on-premise, ngoài nhà máy) và kho tổng mới (RDS/Aurora trong khuôn viên VPC), hoạt động trong giai đoạn chuyển đổi rồi được tháo dỡ (xóa replication instance) sau khi cutover xong.

### 8. 5 câu hỏi ôn tập
1. **Q:** DMS có tự convert schema khi chuyển Oracle sang Aurora PostgreSQL không? **A:** Không — cần dùng AWS SCT convert schema trước, DMS chỉ chuyển data.
2. **Q:** Muốn downtime gần như 0 khi database production vẫn đang ghi liên tục, dùng migration type nào? **A:** `full-load-and-cdc`.
3. **Q:** Replication instance của DMS chạy trên hạ tầng gì? **A:** 1 EC2 instance do DMS quản lý (chọn qua `--replication-instance-class`).
4. **Q:** Khi nào nên bật Multi-AZ cho replication instance? **A:** Khi task CDC chạy dài hạn trong production, cần HA tránh gián đoạn đồng bộ.
5. **Q:** Trong case sàn giao dịch, vì sao phải cutover đúng lúc thị trường đóng cửa? **A:** Vì giới hạn downtime cho phép rất thấp (5 phút), cần chọn thời điểm traffic thấp nhất để giảm rủi ro và ảnh hưởng.

---

## 7.5 — AWS Application Migration Service (MGN)

### 1. Khái niệm + ví dụ đời sống
MGN thực hiện **lift-and-shift** cho toàn bộ server (physical, VM, cloud khác) sang AWS bằng cách replicate liên tục ở mức **block-level**, không cần convert OS/ứng dụng. AWS khuyến nghị dùng MGN thay cho CloudEndure Migration (dịch vụ cũ, MGN là bản kế thừa mặc định). Ví dụ đời sống: chở nguyên khối căn nhà (không tháo dỡ đồ đạc bên trong) sang vị trí mới, dựng lại y hệt kiến trúc cũ trên nền đất mới (EC2).

- **Continuous replication**: agent trên source server liên tục đẩy thay đổi block-level vào **staging area** (EC2 nhẹ, chi phí thấp) trên AWS.
- **Test instance**: launch thử 1 bản sao từ dữ liệu đã replicate để verify hoạt động đúng, không ảnh hưởng server thật.
- **Cutover**: launch instance production thật từ dữ liệu đã replicate mới nhất, rồi chuyển traffic sang.

### 2. Lệnh quan trọng

```bash
# Xem danh sách source server đang được MGN theo dõi
aws mgn describe-source-servers

# Launch test instance để verify trước khi cutover thật
aws mgn start-test \
  --source-server-id s-1234567890abcdef0

# Bắt đầu cutover thật (launch production instance)
aws mgn start-cutover \
  --source-server-id s-1234567890abcdef0

# Hoàn tất, dừng replication sau khi đã xác nhận cutover ổn định
aws mgn finalize-cutover \
  --source-server-id s-1234567890abcdef0
```

**Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--source-server-id` | Source Server Identifier | ID định danh server on-prem/cloud khác đang được MGN replicate |
| `start-test` | Test Launch | Launch 1 instance thử từ dữ liệu replicated, không ảnh hưởng production |
| `start-cutover` | Cutover | Launch instance production thật, chuẩn bị cắt traffic sang AWS |
| `finalize-cutover` | Finalize | Đánh dấu hoàn tất, dừng replication cho server đó |

### 3. So sánh nhanh

| Tiêu chí | AWS MGN | AWS DMS |
|---|---|---|
| Đối tượng di dời | Toàn bộ server (OS + app + data) | Chỉ database |
| Cơ chế | Block-level replication liên tục | Full load + CDC ở mức bản ghi/table |
| Kết quả sau migrate | EC2 instance y hệt server gốc | Database engine trên RDS/Aurora (có thể khác engine gốc) |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Replication agent | Cài nhẹ trên source, không cần reboot | Không làm gián đoạn server đang chạy production |
| Staging area | Dùng instance type nhỏ, rẻ | Chỉ dùng để nhận dữ liệu replicate, không phải nơi chạy production |
| Launch Template | Cấu hình instance type/subnet/SG cho target | Set trước khi `start-test`/`start-cutover` |

### 5. Cách dùng nâng cao / pattern thực tế
Luôn chạy `start-test` trước để verify ứng dụng hoạt động đúng trên AWS (network, license, driver) trước khi thực hiện `start-cutover` thật — tránh downtime ngoài kế hoạch.

**Case thực tế:** một startup SaaS phải rời datacenter thuê ngoài trong 30 ngày vì hết hợp đồng, có hơn 100 VM VMware đang chạy nhiều microservice khác nhau. Đội hạ tầng cài MGN agent lên toàn bộ VM để replicate liên tục trong 2 tuần, chạy `start-test` cho từng nhóm service để verify trước, rồi thực hiện `start-cutover` hàng loạt vào cuối tuần khi traffic thấp nhất, giữ được gần như 100% uptime trong suốt quá trình.

### 6. Cấu hình/thiết lập liên quan
**Launch Template** (trong EC2, được MGN tham chiếu) định nghĩa instance type, subnet, security group, IAM instance profile cho server đích — cần chỉnh khi muốn target instance khác cấu hình so với mặc định MGN đề xuất, hoặc cần đặt đúng subnet private theo kiến trúc VPC đã thiết kế.

### 7. Vị trí trong kiến trúc (nhà máy nền)
Khớp vào **"Xưởng lắp ráp — EC2"** — MGN là **"đội dựng nhà y hệt bản gốc"**, đưa nguyên khối server cũ (ngoài nhà máy) vào đúng vị trí xưởng lắp ráp (EC2, trong subnet private) của nhà máy nền mới trên AWS.

### 8. 5 câu hỏi ôn tập
1. **Q:** MGN thay thế dịch vụ nào trước đây? **A:** AWS CloudEndure Migration.
2. **Q:** Bước nào nên làm trước khi cutover thật? **A:** `start-test` — launch instance thử để verify.
3. **Q:** MGN replicate dữ liệu ở mức nào? **A:** Block-level, liên tục.
4. **Q:** Sau khi cutover ổn định, cần gọi lệnh gì để hoàn tất? **A:** `finalize-cutover`.
5. **Q:** Trong case startup SaaS, vì sao cần chạy test theo từng nhóm service thay vì cutover hết 1 lần? **A:** Để giảm rủi ro — nếu 1 nhóm gặp lỗi cấu hình network/license trên AWS thì chỉ ảnh hưởng nhóm đó, không sập toàn bộ hệ thống cùng lúc.

---

## 7.6 — AWS DataSync

### 1. Khái niệm + ví dụ đời sống
DataSync chuyển **file/dữ liệu** giữa on-premise storage (NFS/SMB) và AWS storage (S3, EFS, FSx), hoặc giữa các AWS storage với nhau — có thể chạy **1 lần** hoặc **định kỳ theo lịch** để đồng bộ liên tục. Ví dụ đời sống: băng chuyền tự động chở hàng theo lịch cố định giữa 2 kho, tự nhận diện món nào mới/đổi để chỉ chở đúng phần thay đổi (incremental), không chở lại toàn bộ mỗi lần.

- **DataSync Agent**: 1 VM (OVA) deploy on-premise, kết nối tới NFS/SMB share, đóng vai trò cầu nối gửi dữ liệu lên AWS.
- **Task**: định nghĩa location nguồn, location đích, filter, và lịch chạy (schedule).

### 2. Lệnh quan trọng

```bash
# Tạo location trỏ vào NFS share on-premise (qua agent)
aws datasync create-location-nfs \
  --server-hostname 10.0.1.50 \
  --subdirectory /export/data \
  --on-prem-config AgentArns=arn:aws:datasync:...:agent/agent-01

# Tạo location đích là S3 bucket
aws datasync create-location-s3 \
  --s3-bucket-arn arn:aws:s3:::my-migration-bucket \
  --s3-config BucketAccessRoleArn=arn:aws:iam::...:role/DataSyncRole

# Tạo task đồng bộ giữa 2 location, chạy theo lịch
aws datasync create-task \
  --source-location-arn arn:aws:datasync:...:location/loc-nfs \
  --destination-location-arn arn:aws:datasync:...:location/loc-s3 \
  --schedule ScheduleExpression="cron(0 2 * * ? *)"

# Bắt đầu chạy task ngay (ngoài lịch)
aws datasync start-task-execution --task-arn arn:aws:datasync:...:task/task-01
```

**Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--server-hostname` | NFS Server Hostname | Địa chỉ server NFS on-premise cần đồng bộ |
| `--on-prem-config` | On-Premises Config | Trỏ tới DataSync Agent (VM) làm cầu nối tới hạ tầng on-prem |
| `--s3-config` | S3 Configuration | IAM role cho phép DataSync ghi vào bucket S3 đích |
| `--schedule` | Schedule Expression | Biểu thức cron định nghĩa tần suất task tự chạy |
| `start-task-execution` | Task Execution | Kích hoạt task chạy ngay lập tức, không chờ lịch |

### 3. So sánh nhanh

| Tiêu chí | AWS DataSync | Storage Gateway (File Gateway) |
|---|---|---|
| Mục đích chính | Transfer dữ liệu 1 lần hoặc định kỳ, tối ưu tốc độ | Truy cập file liên tục kiểu file share, cache local |
| Use case điển hình | Migration 1 lần, backup định kỳ hàng đêm | Ứng dụng on-prem cần đọc/ghi S3 như 1 NFS/SMB share hàng ngày |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Encryption in-transit | TLS mặc định | Không cần cấu hình thêm |
| Verify sau transfer | Checksum tự động | Đảm bảo dữ liệu đích khớp nguồn |
| Destination hỗ trợ | S3, EFS, FSx (Windows/Lustre/OpenZFS) | Không giới hạn chỉ S3 |

### 5. Cách dùng nâng cao / pattern thực tế
Kết hợp DataSync task schedule với **EventBridge** để trigger thêm bước xử lý sau khi transfer xong (vd gọi Lambda kiểm tra checksum, gửi thông báo SNS).

**Case thực tế:** một hãng hậu kỳ phim cần đồng bộ hàng chục TB file dựng phim (media) mỗi đêm từ NAS on-premise lên S3 để phục vụ render farm chạy trên EC2/ECS. Thay vì di dời toàn bộ 1 lần (bất khả thi vì dữ liệu vẫn tiếp tục phát sinh), đội kỹ thuật cấu hình DataSync task chạy theo lịch cron mỗi đêm, chỉ đồng bộ phần file mới/thay đổi trong ngày.

### 6. Cấu hình/thiết lập liên quan
Agent deploy dạng OVA trên VMware/Hyper-V/KVM (hoặc EC2 AMI nếu nguồn cũng ở trên AWS); cần **activation key** lấy từ console khi setup agent lần đầu để agent đăng ký với tài khoản AWS — cần đụng tới khi agent bị mất kết nối/cần re-activate.

### 7. Vị trí trong kiến trúc (nhà máy nền)
Khớp vào **"Kho hàng tĩnh — S3"** (hoặc EFS/FSx) — DataSync là **"băng chuyền nối kho cũ ngoài nhà máy với kho mới trong/ngoài khuôn viên"**, chạy **định kỳ** khác với MGN/DMS vốn chỉ chạy 1 lần trong giai đoạn cutover.

### 8. 5 câu hỏi ôn tập
1. **Q:** DataSync khác Storage Gateway File Gateway ở điểm nào? **A:** DataSync tối ưu cho transfer 1 lần/định kỳ tốc độ cao, Storage Gateway tối ưu cho truy cập file liên tục hàng ngày kiểu file share.
2. **Q:** DataSync có hỗ trợ đích là EFS/FSx không hay chỉ S3? **A:** Có, hỗ trợ cả S3, EFS, và FSx (Windows/Lustre/OpenZFS).
3. **Q:** Muốn agent kết nối được với AWS lần đầu, cần gì? **A:** Activation key lấy từ console.
4. **Q:** Sau khi transfer, DataSync verify dữ liệu bằng cách nào? **A:** Checksum tự động so sánh nguồn và đích.
5. **Q:** Trong case hãng phim, vì sao không di dời toàn bộ dữ liệu 1 lần mà phải chạy định kỳ? **A:** Vì dữ liệu media vẫn tiếp tục phát sinh mỗi ngày, cần đồng bộ liên tục thay vì 1 lần duy nhất.

---

## 7.7 — AWS Snow Family

### 1. Khái niệm + ví dụ đời sống
Thiết bị **vật lý** để chuyển dữ liệu khối lượng lớn khi đường truyền mạng quá chậm hoặc không khả thi — nguyên tắc kinh điển: *"không đường truyền nào nhanh bằng 1 xe tải chở đầy ổ cứng"*. Ví dụ đời sống: khi đường ống nước quá nhỏ để bơm hết cả bể nước trong thời gian hợp lý, người ta chở nguyên bể bằng xe tải thay vì cố bơm qua ống.

- **Snowcone**: nhỏ gọn (~8TB), dùng cho edge computing hoặc lượng data nhỏ, có thể gửi qua DataSync online hoặc gửi vật lý về AWS.
- **Snowball Edge** (Storage Optimized ~80TB / Compute Optimized): vừa lưu trữ vừa **chạy compute tại chỗ** (EC2 instance, Lambda) ngay trên thiết bị, không chỉ là ổ cứng di động.
- **Snowmobile**: container 45-foot kéo bằng xe tải, chở tới 100PB — dùng cho di dời toàn bộ datacenter cực lớn.

### 2. Lệnh quan trọng

```bash
# Tạo job order thiết bị Snowball Edge
aws snowball create-job \
  --job-type IMPORT \
  --resources '{}' \
  --snowball-type EDGE_STORAGE_OPTIMIZED \
  --shipping-option SECOND_DAY

# Xem trạng thái job
aws snowball describe-job --job-id JID1234567-abcd

# Liệt kê toàn bộ job đã tạo
aws snowball list-jobs
```

**Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--job-type` | Job Type | `IMPORT` (đưa data vào AWS) hoặc `EXPORT` (lấy data ra khỏi AWS) |
| `--snowball-type` | Device Type | Loại thiết bị (`EDGE_STORAGE_OPTIMIZED`, `EDGE_COMPUTE_OPTIMIZED`...) |
| `--shipping-option` | Shipping Speed | Tốc độ vận chuyển thiết bị (ảnh hưởng thời gian nhận/trả) |

### 3. So sánh nhanh

| Thiết bị | Dung lượng | Có compute tại chỗ? | Use case |
|---|---|---|---|
| Snowcone | ~8TB | Có (giới hạn, nhỏ) | Data nhỏ, edge location chật hẹp (vd trên xe, ngoài hiện trường) |
| Snowball Edge | ~80TB (Storage) | Có (EC2/Lambda tại chỗ) | Migration hàng chục-trăm TB hoặc cần xử lý dữ liệu ngay tại edge |
| Snowmobile | Tới 100PB | Không (chỉ vận chuyển) | Di dời toàn bộ datacenter cỡ petabyte |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Encryption | KMS tự động, 256-bit | Mã hóa toàn bộ dữ liệu trên thiết bị |
| Xóa dữ liệu | Tự động sau khi AWS import xong | Theo tiêu chuẩn NIST 800-88 |
| Chi phí | Tính theo ngày thuê thiết bị + phí vận chuyển | Giữ thiết bị càng lâu, phí càng cao |

### 5. Cách dùng nâng cao / pattern thực tế
Dùng **OpsHub** (ứng dụng desktop quản lý local) để cấu hình và chạy EC2/Lambda ngay trên Snowball Edge tại hiện trường, xử lý sơ bộ dữ liệu trước khi gửi về AWS — giảm dung lượng cần chuyển và có kết quả gần như real-time tại chỗ.

**Case thực tế:** một công ty dầu khí thu thập dữ liệu khảo sát địa chất tại giàn khoan ngoài khơi, nơi không có kết nối Internet ổn định. Đội kỹ thuật dùng Snowball Edge Compute Optimized để chạy inference AI phân tích dữ liệu địa chấn ngay tại giàn khoan, chỉ gửi kết quả đã xử lý (dung lượng nhỏ hơn nhiều so với dữ liệu thô) về AWS khi thiết bị được vận chuyển vào bờ.

### 7. Vị trí trong kiến trúc (nhà máy nền)
Nằm ở **"cổng vào/ra vật lý ngoài nhà máy"** — không đi qua lớp network layer (Route 53/CloudFront/VPC) như luồng request khách hàng thông thường, mà là **"cửa nhận hàng hóa riêng"** đưa thẳng dữ liệu vật lý vào kho tổng/kho tĩnh (S3, EBS) sau khi thiết bị được AWS nhận và import.

### 8. 5 câu hỏi ôn tập
1. **Q:** Thiết bị nào phù hợp để di dời toàn bộ 1 datacenter cỡ petabyte? **A:** Snowmobile.
2. **Q:** Thiết bị nào có thể chạy EC2/Lambda ngay tại chỗ? **A:** Snowball Edge (Storage/Compute Optimized).
3. **Q:** Dữ liệu trên Snow device được xóa khi nào? **A:** Tự động sau khi AWS đã import thành công vào hệ thống, theo chuẩn NIST 800-88.
4. **Q:** Công cụ nào giúp quản lý compute local trên Snowball Edge? **A:** AWS OpsHub.
5. **Q:** Trong case dầu khí, vì sao xử lý ngay tại giàn khoan thay vì gửi dữ liệu thô về AWS? **A:** Vì không có Internet ổn định để truyền dữ liệu thô dung lượng lớn, và xử lý tại chỗ cho kết quả gần real-time, giảm dung lượng cần vận chuyển.

---

## 7.8 — The 7 Rs of Migration

### 1. Khái niệm + ví dụ đời sống
7 chiến lược cơ bản khi di dời 1 ứng dụng lên AWS. Ví dụ đời sống — khi chuyển nhà: có món **bỏ luôn** không mang theo (Retire), có món **để lại nhà cũ** (Retain), có món **chuyển y nguyên** sang nhà mới (Rehost), có món **đóng nguyên khối tủ** chuyển cả cụm (Relocate), có món **mua đồ mới** thay vì mang theo (Repurchase), có món **chuyển nhưng đổi kiểu dáng** cho vừa nhà mới (Replatform), và có món phải **đóng lại hoàn toàn theo thiết kế mới** (Refactor).

| Chiến lược | Ý nghĩa | Ví dụ AWS |
|---|---|---|
| **Retire** | Ngừng dùng, không migrate | Tắt hẳn app không còn ai dùng |
| **Retain** | Giữ nguyên tại chỗ (chưa migrate) | App còn hợp đồng license dài hạn on-prem |
| **Rehost** | "Lift-and-shift", chuyển nguyên trạng | Dùng AWS MGN đưa VM sang EC2 |
| **Relocate** | Di dời nguyên khối hạ tầng ảo hóa | VMware Cloud on AWS |
| **Repurchase** | Bỏ hệ thống cũ, mua giải pháp SaaS mới | Chuyển CRM tự viết sang Salesforce |
| **Replatform** | Chuyển và thay đổi 1 phần nền tảng, giữ kiến trúc chính | Migrate DB sang RDS thay vì tự quản lý trên EC2 |
| **Refactor / Re-architect** | Thiết kế lại hoàn toàn để tận dụng cloud-native | Viết lại monolith thành microservices + Lambda |

### 3. So sánh nhanh

| 7R | Effort | Thời gian | Tool AWS liên quan |
|---|---|---|---|
| Retire | Rất thấp | Ngay lập tức | — |
| Retain | Không cần làm gì | — | — |
| Rehost | Thấp | Nhanh nhất trong nhóm "chuyển thật" | AWS MGN |
| Relocate | Thấp-trung bình | Nhanh | VMware Cloud on AWS |
| Repurchase | Trung bình (đổi quy trình vận hành) | Trung bình | — (chuyển sang SaaS bên thứ 3) |
| Replatform | Trung bình | Trung bình | AWS DMS, RDS |
| Refactor | Cao nhất | Dài nhất | Lambda, ECS/EKS, kiến trúc serverless/microservices |

### 5. Cách dùng nâng cao / pattern thực tế
Migration Hub Strategy Recommendations tự động chấm điểm 7R cho từng server dựa trên dữ liệu Discovery (tech stack, dependency, mức utilization) — nhưng quyết định cuối cùng vẫn cần con người cân nhắc thêm yếu tố nghiệp vụ (ROI dài hạn, rủi ro, ràng buộc hợp đồng).

**Case thực tế:** một tập đoàn bán lẻ có 500 ứng dụng legacy tích lũy qua nhiều năm sáp nhập công ty con. Đội kiến trúc dùng Strategy Recommendations phân loại nhanh: ~150 app ít traffic, công nghệ lỗi thời → Retire; ~250 app ổn định, ít thay đổi → Rehost bằng MGN để nhanh chóng thoát khỏi datacenter cũ; ~100 app còn giá trị kinh doanh lâu dài, tốn nhiều chi phí vận hành → đưa vào lộ trình Refactor sang serverless trong 2 năm tiếp theo để tối ưu chi phí dài hạn.

### 7. Vị trí trong kiến trúc (nhà máy nền)
7R **không phải 1 trạm** trong nhà máy — mà là **bộ tiêu chí quyết định** dùng để chọn cách xây MỖI trạm trong nhà máy (dùng nguyên khối cũ đưa vào Xưởng lắp ráp EC2 hay đóng mới hoàn toàn bằng Lambda/serverless). Áp dụng cho mọi trạm đã học từ Module 2 đến giờ, không chỉ riêng migration.

### 8. 5 câu hỏi ôn tập
1. **Q:** Chiến lược nào tương ứng với "lift-and-shift" và dùng tool AWS nào? **A:** Rehost, dùng AWS MGN.
2. **Q:** Chuyển CRM tự viết sang dùng Salesforce thuộc chiến lược nào? **A:** Repurchase.
3. **Q:** Chiến lược nào tốn effort và thời gian nhiều nhất? **A:** Refactor/Re-architect.
4. **Q:** "Retain" nghĩa là gì? **A:** Giữ nguyên hệ thống tại chỗ, chưa di dời (thường vì ràng buộc hợp đồng/kỹ thuật).
5. **Q:** Trong case tập đoàn bán lẻ, vì sao 100 app "còn giá trị kinh doanh lâu dài" lại chọn Refactor thay vì Rehost? **A:** Vì Rehost chỉ giải quyết bài toán ngắn hạn (thoát datacenter), trong khi Refactor giúp tối ưu chi phí vận hành và khả năng mở rộng về lâu dài cho những app còn giá trị chiến lược.

---

# BƯỚC 1.5 — Lab tổng của section

> ⚠️ Section gốc không có bài `[HOL]` nào — lab dưới đây được **tự dựng** để mô phỏng đúng công việc thật 1 kỹ sư mới được giao trong tuần đầu, dùng EC2/RDS free tier đóng vai hệ thống "on-premise" giả lập (vì không có datacenter thật để thao tác).

### 🧭 Bối cảnh
Bạn vừa join 1 công ty đang có kế hoạch rời datacenter thuê ngoài. Sếp giao nhiệm vụ: dựng 1 pilot nhỏ chứng minh 4 công cụ migration chính (Discovery, DMS, MGN, DataSync) hoạt động đúng trên 1 hệ thống giả lập, trước khi trình bày kế hoạch di dời thật cho 800 server.

### Bước 1 — Dựng "on-premise" giả lập
```bash
# Launch 1 EC2 t2.micro đóng vai "server on-prem" (free tier)
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --instance-type t2.micro \
  --key-name my-key \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=onprem-simulated}]'
# → Đây là "nhà cũ" giả lập, thực tế sẽ là server VMware/physical thật
```

### Bước 2 — Application Discovery Service
```bash
# SSH vào EC2 vừa tạo, cài Discovery Agent (agent-based vì không có vCenter)
sudo ./aws-discovery-agent.sh -r us-east-1 -k <access-key> -s <secret-key>

# Từ máy local, kích hoạt thu thập dữ liệu
aws discovery start-data-collection-by-agent-ids --agent-ids <agent-id>
# → Verify: vào console Migration Hub > Discover, thấy server xuất hiện kèm utilization
```

### Bước 3 — AWS DMS (migrate database)
```bash
# Tạo 2 RDS free tier: source-db (đóng vai Oracle/MySQL "on-prem"), target-db (Aurora)
aws rds create-db-instance --db-instance-identifier source-db --db-instance-class db.t3.micro --engine mysql ...
aws rds create-db-instance --db-instance-identifier target-db --db-instance-class db.t3.micro --engine aurora-mysql ...

# Tạo replication instance nhỏ nhất để tiết kiệm chi phí
aws dms create-replication-instance --replication-instance-identifier dms-lab --replication-instance-class dms.t3.micro --allocated-storage 20

# Tạo endpoint + task full-load-and-cdc, chạy thử với 1 bảng test
aws dms create-endpoint --endpoint-identifier src --endpoint-type source --engine-name mysql --server-name <source-db-endpoint> --port 3306
aws dms create-endpoint --endpoint-identifier tgt --endpoint-type target --engine-name aurora --server-name <target-db-endpoint> --port 3306
aws dms create-replication-task --replication-task-identifier lab-task --migration-type full-load-and-cdc --table-mappings file://table-mappings.json --source-endpoint-arn <src-arn> --target-endpoint-arn <tgt-arn> --replication-instance-arn <dms-lab-arn>
```

### Bước 4 — AWS MGN (test cutover, KHÔNG finalize)
```bash
# Cài MGN agent lên EC2 "onprem-simulated" ở Bước 1
sudo ./aws-replication-installer-init.py --region us-east-1 --aws-access-key-id <key> --aws-secret-access-key <secret>

# Chờ replication đạt trạng thái "Healthy" trên console MGN, sau đó test launch
aws mgn start-test --source-server-id <server-id>
# → CHỈ dừng ở đây, KHÔNG chạy start-cutover/finalize-cutover trong lab để tránh tạo thêm instance production tốn phí
```

### Bước 5 — AWS DataSync (đồng bộ định kỳ)
```bash
# Tạo 2 S3 bucket đóng vai "kho cũ" và "kho mới" (đơn giản hóa vì không có NAS on-prem thật)
aws s3 mb s3://lab-source-bucket
aws s3 mb s3://lab-target-bucket

aws datasync create-location-s3 --s3-bucket-arn arn:aws:s3:::lab-source-bucket --s3-config BucketAccessRoleArn=<role-arn>
aws datasync create-location-s3 --s3-bucket-arn arn:aws:s3:::lab-target-bucket --s3-config BucketAccessRoleArn=<role-arn>
aws datasync create-task --source-location-arn <loc-1> --destination-location-arn <loc-2>
aws datasync start-task-execution --task-arn <task-arn>
```

### Bước 6 — Snow Family (chỉ xem giao diện, KHÔNG order thật)
Vào console Snow Family > Create job, điền thử thông tin job Snowball Edge, xem qua các bước config — **dừng lại trước bước "Place order"**, không xác nhận gửi để tránh phát sinh phí thiết bị + vận chuyển thật.

### ✅ Lệnh verify
```bash
aws discovery describe-agents                                  # Agent đã đăng ký & đang thu thập
aws dms describe-replication-tasks --query 'ReplicationTasks[*].Status'  # Task DMS đang chạy/hoàn tất
aws mgn describe-source-servers                                 # Server MGN ở trạng thái đã test
aws datasync describe-task-execution --task-execution-arn <arn> # Kết quả lần chạy DataSync gần nhất
```

### 🧹 Cleanup
```bash
aws ec2 terminate-instances --instance-ids <onprem-simulated-id>
aws dms delete-replication-task --replication-task-arn <task-arn>
aws dms delete-replication-instance --replication-instance-arn <dms-lab-arn>
aws rds delete-db-instance --db-instance-identifier source-db --skip-final-snapshot
aws rds delete-db-instance --db-instance-identifier target-db --skip-final-snapshot
aws mgn disconnect-from-service --source-server-id <server-id>   # Gỡ server khỏi MGN
aws datasync delete-task --task-arn <task-arn>
aws s3 rb s3://lab-source-bucket --force
aws s3 rb s3://lab-target-bucket --force
```

### ⚠️ Lưu ý dễ sai/dễ tốn phí
- **DMS replication instance tính phí theo giờ dù task không chạy** — nhớ xóa ngay sau khi test xong, đừng để "quên chạy qua đêm".
- **MGN `start-test` sẽ tạo 1 EC2 instance thật** (mặc định theo Launch Template) — nhớ terminate sau khi verify xong, và **tuyệt đối không** gọi `start-cutover`/`finalize-cutover` trong lab thử nghiệm.
- **Snowball Edge chỉ nên demo tạo job tới bước xem cấu hình** — nếu lỡ "Place order" thật, AWS sẽ tính phí thiết bị + vận chuyển dù bạn hủy sau đó.
- RDS free tier chỉ miễn phí cho `db.t3.micro`/`db.t2.micro` trong 12 tháng đầu — kiểm tra kỹ trước khi tạo cả 2 instance source/target.

---

# 📋 Cheat Sheet (gộp Exam Cram + Architecture Patterns)

### Exam Cram — những điểm hay bị hỏi nhất
- **7 Rs** là framework tư duy được hỏi trực tiếp bằng tình huống (vd "công ty muốn ngừng vận hành app cũ không ai dùng" → Retire; "muốn chuyển nhanh nhất, ít thay đổi nhất" → Rehost).
- **DMS di dời database**, **MGN di dời cả server (OS+app+data)** — đề thi hay đánh lừa 2 khái niệm này.
- **DataSync** cho file/object storage, chạy được **định kỳ**; khác với DMS/MGN chủ yếu chạy 1 lần trong giai đoạn cutover.
- **Snowball Edge có compute**, Snowmobile thì **không** — chỉ là phương tiện vận chuyển thuần túy cho khối lượng cực lớn (petabyte).
- **Heterogeneous DB migration** (khác engine) luôn cần **AWS SCT** trước khi chạy DMS.
- **Application Discovery Service** là bước "khảo sát" bắt buộc trước khi Migration Hub Strategy Recommendations có thể đề xuất 7R chính xác.

### Architecture Patterns — pattern chuẩn cần nhớ nằm lòng
**Discovery → Strategy Recommendations (chọn 7R) → DMS (data) / MGN (server) / DataSync (file, định kỳ) / Snow Family (khi mạng quá chậm) → Migration Hub (theo dõi tổng tiến độ toàn bộ pipeline).**

- Heterogeneous DB: **SCT (convert schema) → DMS (full-load + CDC) → cutover**.
- Lift-and-shift hàng loạt VM: **MGN agent → continuous replication → test launch → cutover theo lô, ưu tiên giờ traffic thấp**.
- Dữ liệu phát sinh liên tục cần đồng bộ: **DataSync + schedule (cron) + EventBridge trigger xử lý sau transfer**.
- Không có network khả thi: **Snowball Edge/Snowmobile → import vào S3/EBS → xử lý tiếp trong AWS**.

---

## 🏭 Trạm mới thêm vào nhà máy nền ở section này

- **Phòng kế hoạch mở rộng** (Migration Hub + Application Discovery Service + Strategy Recommendations) — đứng tách biệt ngoài dây chuyền sản xuất, quan sát toàn bộ bản đồ nhà máy cũ và mới để lên kế hoạch.
- **Đội bốc dỡ hàng chuyên trách tạm thời** (AWS DMS) — gắn giữa kho cũ (database on-prem) và Kho tổng RDS/Aurora, hoạt động tạm thời trong giai đoạn chuyển đổi.
- **Đội dựng nhà y hệt bản gốc** (AWS MGN) — đưa nguyên khối server cũ vào đúng vị trí Xưởng lắp ráp EC2.
- **Băng chuyền nối kho cũ-mới chạy định kỳ** (AWS DataSync) — gắn cùng khu Kho hàng tĩnh S3/EFS/FSx, khác MGN/DMS ở chỗ chạy lặp lại theo lịch.
- **Cửa nhận hàng hóa vật lý** (AWS Snow Family) — cổng vào/ra riêng ngoài luồng network layer thông thường (Route 53/CloudFront/VPC), đưa thẳng dữ liệu vật lý vào Kho tổng/Kho tĩnh.
- **7 Rs** — không phải trạm, là bộ tiêu chí quyết định cách xây mỗi trạm hiện có trong toàn bộ nhà máy.
