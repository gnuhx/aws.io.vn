# SAA-C03 · Module 5 — Modern Architecture (Containers & Serverless)
## 🔹 Section: Serverless Applications (5.15 – 5.32)

**Domain thi liên quan:** Design High-Performing Architectures (24%) · Design Resilient Architectures (26%) · Design Cost-Optimized Architectures (20%)

**Danh sách bài trong section:**

| Bài | Tên | Loại |
|---|---|---|
| 5.15 | Introduction | meta |
| 5.16 | Serverless Services and Event-Driven Architecture | kỹ thuật |
| 5.17 | AWS Lambda | kỹ thuật |
| 5.18 | [HOL] Create Function to Resize Instance | lab (gộp) |
| 5.19 | Application Integration Services Overview | kỹ thuật |
| 5.20 | Amazon SQS | kỹ thuật |
| 5.21 | Amazon SNS | kỹ thuật |
| 5.22 | [HOL] Simple Event-Driven App | lab (gộp) |
| 5.23 | AWS Step Functions | kỹ thuật |
| 5.24 | [HOL] Create a State Machine | lab (gộp) |
| 5.25 | Amazon EventBridge | kỹ thuật |
| 5.26 | [HOL] Create Event Bus and Rule | lab (gộp) |
| 5.27 | Amazon API Gateway | kỹ thuật |
| 5.28 | [HOL] Simple HTTP API | lab (gộp) |
| 5.29 | Exam Cram | meta |
| 5.30 | Architecture Patterns | meta |
| 5.31 | Serverless Applications Quiz | meta |
| 5.32 | Cheat Sheets | meta |

---

## 🗺️ Roadmap tiến độ — Module 5

- [x] ✅ 🔹 Docker Containers and ECS (5.1–5.14)
- [x] ✅ **🔹 Serverless Applications (5.15–5.32)** ← đang học

*(Kế thừa nhà máy nền từ section trước: Đội trưởng ECS + Đội trưởng EKS tại Xưởng lắp ráp, Kho khuôn mẫu ECR.)*

---

# BƯỚC 1 — Nội dung từng bài kỹ thuật

## 5.16 — Serverless Services and Event-Driven Architecture

### 1. Khái niệm + ví dụ đời sống
**Serverless** không có nghĩa là "không có server" — mà là **bạn không thấy, không quản lý server** (AWS lo hết việc patch/scale/provision), bạn chỉ trả tiền theo lượng dùng thực tế, không trả cho lúc rảnh. **Event-Driven Architecture (EDA)** là cách thiết kế hệ thống mà các thành phần phản ứng với **sự kiện** (event) thay vì gọi trực tiếp lẫn nhau — thành phần A không cần biết thành phần B tồn tại, chỉ cần "phát tín hiệu" ra và ai quan tâm thì tự xử lý.

Ví dụ đời sống: **Serverless** như thuê taxi thay vì mua ô tô riêng — chỉ trả tiền cho chuyến đi, không trả tiền lúc xe đậu trong gara. **Event-Driven** như hệ thống chuông báo trong nhà máy — công nhân không cần đứng canh máy A xong việc chưa, chỉ cần nghe chuông reo là biết tới lượt mình.

- **Producer**: nơi phát sinh sự kiện (vd: 1 file mới upload lên S3).
- **Event Router**: nơi định tuyến sự kiện (SQS/SNS/EventBridge).
- **Consumer**: nơi xử lý sự kiện (thường là Lambda).

### 2. Lệnh quan trọng
*(Bài này là khái niệm tổng quan, không có lệnh CLI riêng — lệnh cụ thể nằm ở các bài Lambda/SQS/SNS/EventBridge phía sau.)*

**Từ điển thuật ngữ nhanh:**

| Thuật ngữ | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| EDA | Event-Driven Architecture | Kiến trúc phản ứng theo sự kiện, không gọi trực tiếp |
| Producer | — | Nơi phát sinh sự kiện |
| Consumer | — | Nơi xử lý sự kiện |
| Decoupling | — | Tách rời các thành phần để không phụ thuộc trực tiếp lẫn nhau |
| Cold Start | — | Độ trễ lần đầu khởi động 1 hàm serverless chưa "ấm" |

### 3. So sánh nhanh

| Tiêu chí | Kiến trúc truyền thống (Request/Response trực tiếp) | Event-Driven Architecture |
|---|---|---|
| Liên kết | Chặt (A gọi trực tiếp B, B lỗi thì A lỗi theo) | Lỏng (A phát event, B tự xử lý riêng) |
| Chịu lỗi | B sập → A cũng bị ảnh hưởng ngay | B sập → event vẫn nằm trong hàng đợi, xử lý lại sau |
| Scale | Phải scale đồng bộ | Producer/Consumer scale độc lập nhau |

### 4. Giới hạn/tham số quan trọng
*(Không có tham số số liệu cụ thể ở bài khái niệm này — xem các bài SQS/SNS/EventBridge/Lambda.)*

### 5. Cách dùng nâng cao / pattern thực tế
Pattern nền tảng cần nhớ: **Fan-out** — 1 event được phát ra 1 lần (SNS) nhưng nhiều consumer khác nhau (nhiều SQS queue) cùng nhận và xử lý độc lập, không cái nào chặn cái nào.

**Case thực tế**: 1 nền tảng TMĐT khi có đơn hàng mới cần đồng thời: trừ kho, gửi email xác nhận, ghi log phân tích, cập nhật dashboard vận hành — nếu gọi tuần tự 4 service này trực tiếp, chỉ cần service gửi email chậm là toàn bộ đơn hàng bị delay. Chuyển sang EDA: đặt 1 sự kiện "OrderCreated" duy nhất, 4 consumer độc lập tự lắng nghe và xử lý song song, event gửi email chậm không ảnh hưởng tới việc trừ kho.

### 6. Cấu hình/thiết lập liên quan
*(Không có, đây là bài khái niệm nền tảng.)*

### 7. Vị trí trong kiến trúc (nhà máy nền)
Đây là **nguyên lý vận hành** của **mục 9 Nhà máy nền — Hệ thống loa phóng thanh & bảng thông báo (SQS/SNS/EventBridge)**: lý do các trạm trong nhà máy không cần đứng chờ nhau trực tiếp mà chỉ cần nghe loa/bảng thông báo. Không phải trạm mới, mà là "lý thuyết vận hành" đứng sau mục 9.

### 8. 5 câu hỏi ôn tập
1. Serverless nghĩa là gì, có phải "không có server" không? → *Không — vẫn có server, chỉ là AWS quản lý, bạn không thấy/không patch.*
2. Event-Driven Architecture khác kiến trúc gọi trực tiếp ở điểm nào? → *Liên kết lỏng — producer không cần biết consumer tồn tại.*
3. Fan-out pattern là gì? → *1 event phát 1 lần, nhiều consumer độc lập cùng nhận và xử lý song song.*
4. Vì sao TMĐT trong case thực tế chuyển sang EDA? → *Để service chậm (gửi email) không làm delay các service khác (trừ kho).*
5. EDA khớp vào đâu trong nhà máy nền? → *Là nguyên lý vận hành của mục 9 (loa phóng thanh & bảng thông báo).*

---

## 5.17 — AWS Lambda

### 1. Khái niệm + ví dụ đời sống
Lambda là dịch vụ **chạy code theo sự kiện, không cần quản lý server** — bạn chỉ upload code (hoặc container image), Lambda tự cấp phát tài nguyên khi có sự kiện gọi tới, chạy xong rồi "biến mất", trả tiền theo số lần gọi + thời gian chạy (tính theo ms). Ví dụ đời sống: Lambda như **thợ thời vụ gọi qua app** — chỉ xuất hiện đúng lúc có việc, làm xong là về, không cần trả lương cố định như thợ biên chế (EC2).

- **Trigger**: sự kiện kích hoạt Lambda chạy (S3 upload, API Gateway request, SQS message, EventBridge rule...).
- **Handler**: hàm chính được gọi khi Lambda thực thi.
- **Cold Start**: độ trễ lần đầu khi Lambda cần khởi tạo môi trường chạy (chưa có sẵn "instance ấm").

### 2. Lệnh quan trọng
```bash
aws lambda create-function \
  --function-name my-func --runtime nodejs20.x \
  --role arn:aws:iam::123456789012:role/lambda-exec-role \
  --handler index.handler --zip-file fileb://function.zip   # tạo function mới

aws lambda invoke --function-name my-func --payload '{"key":"value"}' response.json  # gọi thử function
aws lambda update-function-code --function-name my-func --zip-file fileb://function.zip  # deploy code mới
aws lambda update-function-configuration --function-name my-func --memory-size 512 --timeout 30  # đổi cấu hình
aws lambda create-event-source-mapping --function-name my-func \
  --event-source-arn arn:aws:sqs:ap-southeast-1:123456789012:my-queue --batch-size 10  # gắn trigger SQS
aws lambda publish-version --function-name my-func           # đóng băng 1 version cụ thể
aws lambda create-alias --function-name my-func --name prod --function-version 3  # tạo alias trỏ version
```

**Từ điển flag nhanh:**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--runtime` | — | Ngôn ngữ/phiên bản môi trường chạy (nodejs, python, java...) |
| `--role` | — | IAM Role Lambda mượn để chạy (Execution Role) |
| `--handler` | — | Tên hàm entry-point được gọi khi trigger |
| `--zip-file fileb://` | binary file | Nạp code đóng gói dạng zip từ local |
| `--memory-size` | — | RAM cấp cho function (CPU tỉ lệ thuận theo RAM) |
| `--timeout` | — | Thời gian tối đa 1 lần chạy trước khi bị kill |
| `create-event-source-mapping` | — | Gắn 1 nguồn sự kiện dạng poll (SQS/Kinesis/DynamoDB Streams) vào Lambda |
| `--batch-size` | — | Số message/record gộp lại gửi 1 lần cho Lambda xử lý |
| `publish-version` | — | Đóng băng snapshot code hiện tại thành 1 version bất biến |
| `create-alias` | — | Tên trỏ tới 1 version cụ thể (vd `prod` → version 3) |

### 3. So sánh nhanh

| Tiêu chí | Lambda | EC2 trong ASG | ECS/EKS (container) |
|---|---|---|---|
| Quản lý hạ tầng | Không thấy gì | Tự quản lý OS | AWS lo phần lớn (Fargate) hoặc tự quản (EC2) |
| Billing | Theo số lần gọi + ms chạy | Theo giờ instance chạy | Theo task/giờ EC2 |
| Thời gian chạy tối đa | 15 phút/lần gọi | Không giới hạn | Không giới hạn |
| Phù hợp | Việc ngắn, event-driven, tải không đều | Việc chạy liên tục, cần kiểm soát OS | Microservice đóng gói sẵn, cần chạy lâu dài |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Timeout tối đa | 15 phút (900 giây) | Việc dài hơn phải dùng Step Functions/ECS thay vì Lambda |
| Memory | 128 MB – 10,240 MB | CPU được cấp tỉ lệ thuận theo memory chọn |
| Ephemeral storage (`/tmp`) | Mặc định 512 MB, tối đa 10,240 MB | Có thể tăng riêng, tính phí thêm nếu vượt mặc định |
| Deployment package (zip) | Tối đa 50 MB (upload trực tiếp), 250 MB (unzipped) | Vượt giới hạn thì dùng Lambda Container Image (tối đa 10 GB) |
| Concurrent executions | Mặc định 1,000/account/region | Có thể xin tăng quota, hoặc set Reserved Concurrency riêng cho từng function |

### 5. Cách dùng nâng cao / pattern thực tế
Pattern ít người để ý: **Provisioned Concurrency** — giữ sẵn N "instance ấm" của Lambda để loại bỏ cold start cho các workload nhạy cảm về latency (khác Reserved Concurrency chỉ giới hạn số lượng chạy tối đa, không giữ ấm).

**Case thực tế**: 1 công ty fintech có API xử lý thanh toán realtime chạy trên Lambda, SLA yêu cầu p99 latency dưới 200ms — nhưng cold start (~1-2s với runtime nặng) thỉnh thoảng làm SLA vi phạm vào giờ thấp điểm (function "nguội" do lâu không được gọi). Đội SRE bật Provisioned Concurrency = 5 cho function này, đảm bảo luôn có 5 instance ấm sẵn sàng, loại bỏ hoàn toàn cold start cho phần lớn traffic.

### 6. Cấu hình/thiết lập liên quan
Biến môi trường + cấu hình cơ bản qua CLI/Console, hoặc IaC (CloudFormation/SAM):
```yaml
# template.yaml (AWS SAM) - vị trí: gốc thư mục project serverless
Resources:
  MyFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: index.handler
      Runtime: nodejs20.x
      MemorySize: 512
      Timeout: 30
      Environment:
        Variables:
          TABLE_NAME: my-table
      Events:
        ApiEvent:
          Type: Api
          Properties: { Path: /hello, Method: get }
```
Thực tế cần đụng khi: thêm biến môi trường mới (connection string, feature flag), tăng memory/timeout khi function bị timeout thật, hoặc thêm trigger mới (Events section).

### 7. Vị trí trong kiến trúc (nhà máy nền)
Đây chính là **"thợ thời vụ" đã được nhắc tới sẵn trong mục 5 Nhà máy nền** — đứng cùng vị trí Xưởng lắp ráp với EC2/ECS, nhưng được gọi tới làm đúng lúc có việc (trigger) rồi biến mất, không biên chế cố định. Không phải trạm mới — bài này là lúc thợ thời vụ chính thức "ra mắt" đầy đủ vai trò.

### 8. 5 câu hỏi ôn tập
1. Vì sao gọi Lambda là "serverless" dù thực chất vẫn chạy trên server? → *Vì người dùng không thấy/không quản lý server, AWS lo toàn bộ hạ tầng.*
2. Provisioned Concurrency khác Reserved Concurrency ở điểm nào? → *Provisioned giữ sẵn instance ấm loại bỏ cold start; Reserved chỉ giới hạn số lượng chạy tối đa.*
3. Timeout tối đa của 1 lần gọi Lambda là bao nhiêu? → *15 phút (900 giây).*
4. Vì sao fintech trong case thực tế bật Provisioned Concurrency? → *Loại bỏ cold start để đảm bảo SLA p99 latency dưới 200ms.*
5. Lambda khớp vào đâu trong nhà máy nền? → *Thợ thời vụ tại Xưởng lắp ráp (mục 5) — cùng vị trí EC2/ECS, gọi tới khi có việc rồi biến mất.*

---

## 5.19 — Application Integration Services Overview

### 1. Khái niệm + ví dụ đời sống
Đây là bài tổng quan giới thiệu **3 dịch vụ "kết nối/nhắn tin" chính** của AWS trước khi đi sâu từng cái ở các bài sau — mỗi dịch vụ giải quyết 1 kiểu giao tiếp khác nhau giữa các thành phần:

- **SQS (Simple Queue Service)**: hàng đợi tin nhắn — 1 message chỉ được **1 consumer** xử lý (point-to-point), dùng để đệm/giảm tải.
- **SNS (Simple Notification Service)**: pub/sub — 1 message được **phát tới nhiều subscriber** cùng lúc (fan-out).
- **EventBridge**: event bus có **luật lọc (rule) thông minh theo nội dung sự kiện**, định tuyến tới nhiều đích khác nhau, tích hợp cả dịch vụ AWS lẫn SaaS bên thứ 3.

Ví dụ đời sống: SQS như **hộp thư đến chờ xử lý** (1 lá thư chỉ 1 người mở và xử lý); SNS như **loa phát thanh công cộng** (ai đăng ký nghe đều nghe được cùng lúc); EventBridge như **tổng đài phân loại thư tự động** (đọc nội dung, tự quyết định chuyển thư này cho phòng ban nào theo quy tắc).

### 2. Lệnh quan trọng
*(Bài tổng quan, lệnh chi tiết ở 3 bài riêng SQS/SNS/EventBridge phía sau.)*

**Từ điển thuật ngữ nhanh:**

| Thuật ngữ | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| SQS | Simple Queue Service | Hàng đợi tin nhắn point-to-point |
| SNS | Simple Notification Service | Pub/Sub broadcast tới nhiều subscriber |
| EventBridge | — | Event bus có rule lọc nội dung, định tuyến thông minh |
| Point-to-point | — | 1 message → đúng 1 consumer xử lý |
| Pub/Sub | Publish/Subscribe | 1 message → nhiều subscriber cùng nhận |

### 3. So sánh nhanh

| Tiêu chí | SQS | SNS | EventBridge |
|---|---|---|---|
| Mô hình | Point-to-point (1 message/1 consumer) | Pub/Sub (1-nhiều) | Event bus có rule lọc theo nội dung |
| Ai đọc | Consumer chủ động poll | Subscriber được đẩy tới | Target được route theo rule |
| Tích hợp SaaS bên thứ 3 | Không | Không | Có (partner event sources) |
| Dùng khi | Đệm tải, xử lý tuần tự đáng tin cậy | Broadcast đơn giản 1-nhiều | Định tuyến phức tạp theo nội dung event |

### 4. Giới hạn/tham số quan trọng
*(Xem chi tiết ở từng bài SQS/SNS/EventBridge riêng.)*

### 5. Cách dùng nâng cao / pattern thực tế
Pattern kết hợp thường gặp: **SNS + SQS Fan-out** — 1 SNS topic phát ra, nhiều SQS queue subscribe vào cùng topic đó, mỗi queue phục vụ 1 team/service khác nhau xử lý độc lập, vẫn giữ được độ tin cậy point-to-point của SQS cho từng nhánh.

**Case thực tế**: 1 sàn giao dịch cần khi có 1 giao dịch khớp lệnh, đồng thời: team risk cần queue riêng để tính rủi ro, team accounting cần queue riêng để ghi sổ, team notification cần queue riêng để báo khách hàng — mỗi team dùng SQS riêng subscribe vào chung 1 SNS topic "TradeMatched", tránh việc 1 team code lỗi làm ảnh hưởng queue của team khác.

### 6. Cấu hình/thiết lập liên quan
*(Không có, xem chi tiết từng dịch vụ ở bài sau.)*

### 7. Vị trí trong kiến trúc (nhà máy nền)
Đây là bài giới thiệu tổng quan cho **mục 9 Nhà máy nền — Hệ thống loa phóng thanh & bảng thông báo**, xác nhận rõ 3 "kiểu loa" khác nhau sẽ được mô tả chi tiết ở 3 trạm con tiếp theo (SQS, SNS, EventBridge).

### 8. 5 câu hỏi ôn tập
1. SQS khác SNS ở mô hình gửi nhận nào? → *SQS point-to-point (1 message/1 consumer); SNS pub/sub (1-nhiều).*
2. EventBridge khác SNS ở điểm nào? → *EventBridge lọc/định tuyến theo nội dung event bằng rule, kể cả tích hợp SaaS bên thứ 3.*
3. SNS + SQS Fan-out giải quyết vấn đề gì? → *Broadcast 1 sự kiện tới nhiều team, mỗi team xử lý độc lập qua queue riêng.*
4. Vì sao sàn giao dịch trong case thực tế dùng nhiều SQS subscribe 1 SNS topic? → *Để 1 team lỗi code không ảnh hưởng tới queue xử lý của team khác.*
5. Bài tổng quan này khớp vào đâu trong nhà máy nền? → *Giới thiệu 3 kiểu loa của mục 9, chi tiết từng trạm ở các bài sau.*

---

## 5.20 — Amazon SQS

### 1. Khái niệm + ví dụ đời sống
SQS là dịch vụ **hàng đợi tin nhắn được quản lý hoàn toàn** — producer gửi message vào queue, consumer chủ động **poll** (kéo) message ra xử lý, xong thì xóa khỏi queue. Dùng để **đệm tải** (buffer) và **tách rời** (decouple) producer/consumer, tránh consumer chậm làm sập cả hệ thống. Ví dụ đời sống: SQS như **hộp thư đến ở quầy tiếp nhận** — người gửi bỏ thư vào hộp rồi đi luôn, không cần chờ người nhận đọc ngay; người nhận rảnh lúc nào thì lấy thư ra xử lý lúc đó.

- **Standard Queue**: throughput gần như không giới hạn, **at-least-once delivery** (có thể trùng), thứ tự **không đảm bảo**.
- **FIFO Queue**: đảm bảo thứ tự đúng + **exactly-once processing**, nhưng throughput giới hạn hơn.
- **Visibility Timeout**: khoảng thời gian message "ẩn" khỏi các consumer khác sau khi 1 consumer đã lấy ra xử lý — tránh 2 consumer xử lý trùng 1 message.
- **DLQ (Dead Letter Queue)**: nơi chứa message xử lý thất bại quá N lần, để không lặp vô hạn.

### 2. Lệnh quan trọng
```bash
aws sqs create-queue --queue-name my-queue                              # tạo Standard Queue
aws sqs create-queue --queue-name my-queue.fifo --attributes FifoQueue=true  # tạo FIFO Queue (bắt buộc hậu tố .fifo)
aws sqs send-message --queue-url <url> --message-body "hello"           # gửi 1 message vào queue
aws sqs receive-message --queue-url <url> --max-number-of-messages 5    # consumer poll message ra
aws sqs delete-message --queue-url <url> --receipt-handle <handle>      # xóa message sau khi xử lý xong
aws sqs set-queue-attributes --queue-url <url> \
  --attributes VisibilityTimeout=60,RedrivePolicy='{"deadLetterTargetArn":"<dlq-arn>","maxReceiveCount":3}'  # cấu hình DLQ
```

**Từ điển flag nhanh:**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--attributes FifoQueue=true` | First-In-First-Out | Bật chế độ FIFO cho queue |
| `--message-body` | — | Nội dung message gửi vào queue |
| `--max-number-of-messages` | — | Số message tối đa lấy ra trong 1 lần poll |
| `--receipt-handle` | — | Mã tạm để xác nhận/xóa đúng message đã nhận |
| `VisibilityTimeout` | — | Thời gian message ẩn với consumer khác sau khi 1 consumer đã lấy |
| `RedrivePolicy` | — | Quy tắc đẩy message thất bại sang DLQ |
| `maxReceiveCount` | — | Số lần retry tối đa trước khi đẩy sang DLQ |

### 3. So sánh nhanh

| Tiêu chí | Standard Queue | FIFO Queue |
|---|---|---|
| Thứ tự | Không đảm bảo | Đảm bảo đúng thứ tự gửi |
| Delivery | At-least-once (có thể trùng) | Exactly-once processing |
| Throughput | Gần như không giới hạn | Giới hạn hơn (300 msg/s, hoặc 3,000 msg/s với batching) |
| Tên queue | Tự do | Bắt buộc hậu tố `.fifo` |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Message retention | Mặc định 4 ngày, tối đa 14 ngày | Message không được xử lý quá hạn này sẽ mất |
| Message size tối đa | 256 KB | Lớn hơn thì dùng SQS Extended Client Library (lưu payload thật trên S3) |
| Visibility Timeout mặc định | 30 giây | Nếu Lambda/consumer xử lý lâu hơn, phải tăng timeout này tương ứng |
| Long Polling | tối đa 20 giây/lần poll | Giảm số request rỗng so với Short Polling (0 giây, trả về ngay dù rỗng) |

### 5. Cách dùng nâng cao / pattern thực tế
Pattern hay bị hỏi thi: **Visibility Timeout phải >= Lambda function timeout** khi Lambda là consumer của SQS — nếu không, message có thể bị đẩy lại cho consumer khác trong khi consumer đầu vẫn đang xử lý, gây xử lý trùng.

**Case thực tế**: 1 team vận hành hệ thống xử lý ảnh (resize, watermark) nhận traffic dồn dập vào giờ cao điểm upload — nếu gọi Lambda trực tiếp từ event upload S3 sẽ dễ vượt Concurrent Execution limit khi traffic tăng vọt. Đặt SQS ở giữa: S3 event → SQS queue → Lambda poll dần theo khả năng xử lý, đệm hoàn toàn cú tăng đột biến mà không làm mất request nào, chỉ xử lý chậm lại chứ không sập.

### 6. Cấu hình/thiết lập liên quan
DLQ Redrive Policy (đính kèm ở bước 2), hoặc cấu hình qua Console/CloudFormation:
```json
{
  "deadLetterTargetArn": "arn:aws:sqs:ap-southeast-1:123456789012:my-dlq",
  "maxReceiveCount": 3
}
```
Thực tế cần đụng khi: message liên tục lỗi cần cô lập ra để debug riêng (DLQ), hoặc consumer xử lý chậm hơn dự kiến (tăng Visibility Timeout).

### 7. Vị trí trong kiến trúc (nhà máy nền)
SQS là **1 kiểu loa cụ thể trong mục 9 Nhà máy nền — "hộp thư đợi"**: nơi các trạm (thường là thợ thời vụ Lambda ở mục 5) không cần đứng chờ trực tiếp mà chỉ cần ghé lấy việc khi rảnh. Không phải trạm mới hoàn toàn — là dạng cụ thể đầu tiên hiện thực hóa mục 9.

### 8. 5 câu hỏi ôn tập
1. Standard Queue khác FIFO Queue ở điểm cốt lõi nào? → *FIFO đảm bảo thứ tự + exactly-once; Standard không đảm bảo thứ tự, có thể trùng.*
2. Vì sao Visibility Timeout phải >= Lambda timeout khi Lambda là consumer? → *Tránh message bị đẩy lại cho consumer khác trong khi consumer đầu vẫn đang xử lý.*
3. DLQ dùng để làm gì? → *Cô lập message xử lý thất bại quá N lần, tránh lặp vô hạn.*
4. Vì sao team xử lý ảnh đặt SQS giữa S3 event và Lambda? → *Đệm traffic đột biến, tránh vượt Concurrent Execution limit của Lambda.*
5. SQS khớp vào đâu trong nhà máy nền? → *1 kiểu loa cụ thể ở mục 9 — "hộp thư đợi" cho các trạm lấy việc khi rảnh.*

---

## 5.21 — Amazon SNS

### 1. Khái niệm + ví dụ đời sống
SNS là dịch vụ **pub/sub (publish/subscribe)** — 1 message gửi vào 1 **topic** sẽ được **đẩy (push)** ngay tới **tất cả subscriber** đã đăng ký, không cần subscriber chủ động hỏi như SQS. Ví dụ đời sống: SNS như **loa phát thanh trong nhà máy** — quản đốc thông báo 1 lần, mọi công nhân đã đăng ký nghe kênh đó đều nghe được cùng lúc, không cần ai đi hỏi từng người.

- **Topic**: kênh phát, nơi producer gửi message vào.
- **Subscription**: đăng ký nhận từ 1 topic — có thể là email, SMS, SQS queue, Lambda, HTTP endpoint...
- **Fan-out pattern**: 1 topic, nhiều subscriber loại khác nhau nhận cùng 1 message.

### 2. Lệnh quan trọng
```bash
aws sns create-topic --name order-events                                 # tạo topic
aws sns subscribe --topic-arn <topic-arn> --protocol sqs --notification-endpoint <queue-arn>  # SQS subscribe vào topic
aws sns subscribe --topic-arn <topic-arn> --protocol email --notification-endpoint ops@company.com  # email subscribe
aws sns publish --topic-arn <topic-arn> --message "Order #123 created"   # phát message tới mọi subscriber
aws sns set-subscription-attributes --subscription-arn <sub-arn> \
  --attribute-name FilterPolicy --attribute-value '{"eventType":["OrderCreated"]}'  # lọc message theo attribute
```

**Từ điển flag nhanh:**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--protocol` | — | Loại subscriber (sqs, email, sms, lambda, http/https) |
| `--notification-endpoint` | — | Địa chỉ/ARN đích nhận thông báo |
| `--topic-arn` | — | Định danh topic để publish/subscribe vào |
| `FilterPolicy` | — | Quy tắc lọc — subscriber chỉ nhận message khớp điều kiện, không nhận hết mọi message của topic |

### 3. So sánh nhanh

| Tiêu chí | Amazon SNS | Amazon SQS |
|---|---|---|
| Mô hình | Push tới nhiều subscriber (1-nhiều) | Pull, 1 message/1 consumer |
| Lưu trữ message | Không lưu lâu dài (gửi ngay, không nhận được thì mất trừ khi có retry policy) | Lưu tới khi consumer xóa (tối đa 14 ngày) |
| Loại subscriber | Email, SMS, SQS, Lambda, HTTP | Chỉ consumer tự poll (thường Lambda/EC2/ECS) |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Message size tối đa | 256 KB | Giống SQS, lớn hơn cần Extended Client Library |
| Số subscription/topic | Hàng nghìn, không giới hạn thực tế thấp | Đủ dùng cho hầu hết use case fan-out |
| FIFO Topic | Có hỗ trợ (SNS FIFO) | Đảm bảo thứ tự khi kết hợp với SQS FIFO ở đầu nhận |

### 5. Cách dùng nâng cao / pattern thực tế
Pattern hay dùng: **Message Filtering** qua `FilterPolicy` — thay vì mọi subscriber nhận hết mọi message rồi tự code kiểm tra, để SNS tự lọc trước theo attribute, giảm tải xử lý thừa ở phía consumer.

**Case thực tế**: 1 hệ thống vận hành K8s-adjacent gửi mọi log alert qua 1 topic SNS chung "SystemAlerts", nhưng team database chỉ muốn nhận alert liên quan DB, team network chỉ muốn nhận alert liên quan network. Thay vì cả 2 team cùng nhận hết rồi tự lọc, publisher gắn attribute `service: database` hoặc `service: network` khi publish, mỗi team set `FilterPolicy` riêng khi subscribe — chỉ nhận đúng phần liên quan.

### 6. Cấu hình/thiết lập liên quan
`FilterPolicy` khi subscribe:
```json
{ "eventType": ["OrderCreated", "OrderCancelled"] }
```
Thực tế cần đụng khi: 1 topic chung phục vụ nhiều team nhưng mỗi team chỉ cần 1 phần message, tránh xử lý thừa không cần thiết ở consumer.

### 7. Vị trí trong kiến trúc (nhà máy nền)
SNS là **1 kiểu loa cụ thể khác trong mục 9 Nhà máy nền — "loa phát thanh"**: khác SQS (hộp thư đợi 1 người lấy), SNS phát tới nhiều người nghe cùng lúc. Thường đứng trước nhiều SQS queue theo pattern fan-out (bài 5.19) tại cùng mục 9.

### 8. 5 câu hỏi ôn tập
1. SNS khác SQS ở mô hình gửi nhận nào? → *SNS push tới nhiều subscriber cùng lúc; SQS chỉ 1 consumer poll và xử lý.*
2. FilterPolicy giải quyết vấn đề gì? → *Để SNS tự lọc message theo attribute trước khi đẩy, giảm tải xử lý thừa ở subscriber.*
3. Loại subscriber nào SNS hỗ trợ mà SQS không có khái niệm tương đương? → *Email, SMS, HTTP/HTTPS endpoint (SQS chỉ có consumer tự poll).*
4. Vì sao hệ thống vận hành trong case thực tế dùng FilterPolicy thay vì để mỗi team tự lọc code? → *Giảm tải xử lý thừa, mỗi team chỉ nhận đúng phần liên quan ngay từ SNS.*
5. SNS khớp vào đâu trong nhà máy nền? → *1 kiểu loa khác ở mục 9 — "loa phát thanh" phát tới nhiều người nghe cùng lúc, thường đứng trước nhiều SQS trong pattern fan-out.*

---

## 5.23 — AWS Step Functions

### 1. Khái niệm + ví dụ đời sống
Step Functions điều phối **1 chuỗi bước (workflow)** gồm nhiều Lambda function/service AWS khác theo đúng thứ tự đã định nghĩa trong **State Machine** (dạng JSON/Amazon States Language) — có branching (rẽ nhánh theo điều kiện), retry tự động khi lỗi, chạy song song (Parallel state), và chờ (Wait state). Ví dụ đời sống: nếu Lambda là **từng thợ thời vụ riêng lẻ**, Step Functions là **bản quy trình sản xuất tổng** ghi rõ thợ nào làm trước, thợ nào làm sau, nếu bước nào lỗi thì làm lại bao nhiêu lần, bước nào có thể làm song song.

- **State Machine**: định nghĩa toàn bộ workflow (dạng JSON).
- **State**: 1 bước trong workflow (Task, Choice, Parallel, Wait, Fail, Succeed...).
- **Standard Workflow**: chạy tới 1 năm, phù hợp quy trình dài (đặt hàng, phê duyệt).
- **Express Workflow**: chạy tối đa 5 phút, throughput cao, phù hợp xử lý event tần suất lớn.

### 2. Lệnh quan trọng
```bash
aws stepfunctions create-state-machine \
  --name order-workflow --definition file://statemachine.json \
  --role-arn arn:aws:iam::123456789012:role/step-functions-role   # tạo state machine

aws stepfunctions start-execution \
  --state-machine-arn <arn> --input '{"orderId":"123"}'           # chạy 1 lần thực thi

aws stepfunctions describe-execution --execution-arn <execution-arn>  # xem trạng thái 1 lần chạy
aws stepfunctions list-executions --state-machine-arn <arn> --status-filter FAILED  # lọc các lần chạy lỗi
```

**Từ điển flag nhanh:**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--definition` | Amazon States Language | File JSON mô tả toàn bộ workflow |
| `--role-arn` | — | IAM Role Step Functions mượn để gọi các service khác trong workflow |
| `start-execution` | — | Bắt đầu 1 lần chạy thật của state machine |
| `--status-filter` | — | Lọc execution theo trạng thái (RUNNING/SUCCEEDED/FAILED/TIMED_OUT) |

### 3. So sánh nhanh

| Tiêu chí | Standard Workflow | Express Workflow |
|---|---|---|
| Thời gian chạy tối đa | 1 năm | 5 phút |
| Throughput | Thấp hơn | Cao (hàng nghìn execution/giây) |
| Billing | Theo số state transition | Theo thời gian chạy + số request |
| Dùng khi | Quy trình dài, cần audit từng bước | Xử lý event tần suất cao, ngắn hạn |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Standard Workflow max duration | 1 năm | Phù hợp quy trình phê duyệt dài ngày |
| Express Workflow max duration | 5 phút | Không phù hợp workflow chờ người phê duyệt lâu |
| Execution history (Standard) | Lưu chi tiết từng state transition | Dùng để audit/debug từng bước đã chạy |
| Payload giữa các state | Tối đa 256 KB | Payload lớn hơn nên truyền reference (S3 key) thay vì data thật |

### 5. Cách dùng nâng cao / pattern thực tế
Pattern nâng cao: dùng **Retry** và **Catch** ngay trong định nghĩa state — thay vì viết code try/catch thủ công trong từng Lambda, khai báo retry với backoff ngay ở tầng orchestration, tách rời logic nghiệp vụ khỏi logic chịu lỗi.

**Case thực tế**: 1 ngân hàng số có quy trình mở tài khoản gồm nhiều bước: xác minh CMND (gọi API bên thứ 3), kiểm tra danh sách đen (Lambda), tạo tài khoản (DynamoDB), gửi email chào mừng (SNS) — nếu API xác minh CMND bên thứ 3 chập chờn, cần retry 3 lần trước khi báo lỗi cho người dùng. Định nghĩa `Retry` với `IntervalSeconds` và `BackoffRate` ngay trong state đó, tách hoàn toàn khỏi code Lambda, dễ điều chỉnh mà không cần deploy lại function.

### 6. Cấu hình/thiết lập liên quan
`statemachine.json` (Amazon States Language) — vị trí: file JSON đăng ký qua CLI/Console:
```json
{
  "Comment": "Order workflow",
  "StartAt": "VerifyPayment",
  "States": {
    "VerifyPayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ap-southeast-1:123456789012:function:verify-payment",
      "Retry": [{ "ErrorEquals": ["States.TaskFailed"], "IntervalSeconds": 2, "MaxAttempts": 3, "BackoffRate": 2.0 }],
      "Next": "ShipOrder"
    },
    "ShipOrder": { "Type": "Task", "Resource": "arn:aws:lambda:...:ship-order", "End": true }
  }
}
```
Thực tế cần đụng khi: thêm bước mới vào quy trình, chỉnh retry policy khi 1 bước hay chập chờn, hoặc thêm nhánh `Choice` khi cần rẽ nhánh theo điều kiện nghiệp vụ.

### 7. Vị trí trong kiến trúc (nhà máy nền)
Step Functions là **trạm mới**: **"Đội trưởng dây chuyền tổng"** — khác Đội trưởng ECS/EKS (chỉ điều phối container trong phạm vi Xưởng lắp ráp, mục 5), Step Functions điều phối **toàn bộ dây chuyền xuyên nhiều trạm khác nhau** trong nhà máy (gọi Lambda ở mục 5, ghi vào Kho tổng ở mục 6, phát loa ở mục 9...) theo đúng 1 kịch bản (state machine) đã viết sẵn, có cơ chế tự làm lại khi 1 trạm nào đó báo lỗi.

### 8. 5 câu hỏi ôn tập
1. Step Functions khác ECS/EKS ở phạm vi điều phối nào? → *ECS/EKS điều phối container trong Xưởng lắp ráp; Step Functions điều phối xuyên suốt nhiều trạm khác nhau trong cả nhà máy theo kịch bản.*
2. Standard Workflow khác Express Workflow ở điểm nào? → *Standard chạy tới 1 năm, throughput thấp hơn; Express tối đa 5 phút, throughput cao.*
3. Vì sao ngân hàng số dùng Retry ngay trong state thay vì code try/catch trong Lambda? → *Tách logic chịu lỗi khỏi logic nghiệp vụ, dễ điều chỉnh mà không cần deploy lại function.*
4. Payload giữa các state giới hạn bao nhiêu? → *256 KB — lớn hơn nên truyền reference (vd S3 key) thay vì data thật.*
5. Step Functions khớp vào đâu trong nhà máy nền? → *Trạm mới "Đội trưởng dây chuyền tổng", điều phối xuyên nhiều trạm khác nhau theo kịch bản state machine.*

---

## 5.25 — Amazon EventBridge

### 1. Khái niệm + ví dụ đời sống
EventBridge là **event bus thế hệ mới**, mạnh hơn SNS ở khả năng **lọc theo nội dung sự kiện bằng rule pattern** (không chỉ theo attribute đơn giản) và **tích hợp sẵn hàng trăm nguồn sự kiện** — từ chính các dịch vụ AWS (EC2 state change, S3 object created...), tới ứng dụng SaaS bên thứ 3 (Partner Event Source), tới custom event tự định nghĩa. Ví dụ đời sống: nếu SNS là loa phát thanh phát nguyên văn cho ai đăng ký, EventBridge là **tổng đài phân loại thư thông minh** — đọc kỹ nội dung mỗi lá thư (event pattern) rồi tự quyết định chuyển đúng phòng ban nào xử lý.

- **Event Bus**: kênh trung tâm nhận event (default bus, custom bus, hoặc partner bus).
- **Rule**: điều kiện lọc event (event pattern) + danh sách target sẽ nhận nếu khớp.
- **Target**: nơi nhận event khi rule khớp (Lambda, SQS, SNS, Step Functions, API destination...).
- **Schema Registry**: tự động phát hiện + lưu cấu trúc (schema) của event, giúp code consumer chuẩn hơn.

### 2. Lệnh quan trọng
```bash
aws events create-event-bus --name order-events-bus                      # tạo custom event bus

aws events put-rule --name high-value-orders \
  --event-bus-name order-events-bus \
  --event-pattern '{"source":["myapp.orders"],"detail":{"amount":[{"numeric":[">",1000]}]}}'  # tạo rule lọc theo nội dung

aws events put-targets --rule high-value-orders --event-bus-name order-events-bus \
  --targets "Id"="1","Arn"="arn:aws:lambda:ap-southeast-1:123456789012:function:notify-vip"  # gắn target cho rule

aws events put-events --entries '[{
  "Source": "myapp.orders", "DetailType": "OrderCreated",
  "Detail": "{\"amount\": 1500}", "EventBusName": "order-events-bus"
}]'                                                                       # tự bắn 1 custom event
```

**Từ điển flag nhanh:**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `create-event-bus` | — | Tạo 1 kênh trung tâm riêng (ngoài default bus) |
| `--event-pattern` | — | Điều kiện lọc event theo nội dung (source, detail-type, detail...) |
| `put-targets` | — | Gắn nơi nhận khi rule khớp |
| `put-events` | — | Chủ động gửi 1 custom event vào bus |
| `Source` / `DetailType` / `Detail` | — | 3 trường bắt buộc của 1 event: nguồn phát, loại chi tiết, payload chi tiết |

### 3. So sánh nhanh

| Tiêu chí | Amazon SNS | Amazon EventBridge |
|---|---|---|
| Cách lọc | FilterPolicy theo attribute đơn giản | Event Pattern lọc sâu theo nội dung JSON (kể cả toán tử numeric, prefix...) |
| Nguồn sự kiện | Chỉ từ publisher tự gọi API | Hàng trăm nguồn AWS + SaaS bên thứ 3 (Partner Event Source) có sẵn |
| Schema | Không có registry | Có Schema Registry tự phát hiện cấu trúc event |
| Độ trễ | Rất thấp (gần realtime) | Thấp, nhưng thường dùng cho định tuyến phức tạp hơn là loa đơn giản |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Event size tối đa | 256 KB | Giống SNS/SQS |
| Số rule/event bus | Hàng nghìn | Đủ cho hầu hết hệ thống lớn |
| Archive & Replay | Có thể lưu lại toàn bộ event để replay sau | Hữu ích khi cần debug/test lại đúng sự kiện đã xảy ra |
| Scheduled Rule | Hỗ trợ cron/rate expression | Thay thế cron job truyền thống, kích hoạt Lambda theo lịch |

### 5. Cách dùng nâng cao / pattern thực tế
Pattern ít người để ý: dùng EventBridge **Scheduled Rule** (`rate(5 minutes)` hoặc `cron(...)`) để thay hoàn toàn cho việc tự dựng 1 EC2 chạy cronjob — biến 1 tác vụ định kỳ thành hoàn toàn serverless.

**Case thực tế**: 1 team vận hành cần dọn dẹp file tạm trong S3 mỗi đêm lúc 2AM và đồng thời phải phản ứng ngay khi có sự kiện `EC2 Instance State-change` (để tự động gắn tag/thông báo khi instance nào đó bị stop ngoài kế hoạch — dấu hiệu tiềm ẩn sự cố hoặc vi phạm chính sách). Cả 2 nhu cầu này (theo lịch + theo sự kiện AWS gốc) đều xử lý gọn bằng 2 EventBridge Rule trỏ tới 2 Lambda khác nhau, không cần dựng thêm hạ tầng nào.

### 6. Cấu hình/thiết lập liên quan
Event Pattern mẫu (JSON):
```json
{
  "source": ["aws.ec2"],
  "detail-type": ["EC2 Instance State-change Notification"],
  "detail": { "state": ["stopped"] }
}
```
Scheduled Rule mẫu:
```bash
aws events put-rule --name nightly-cleanup --schedule-expression "cron(0 2 * * ? *)"
```
Thực tế cần đụng khi: thêm điều kiện lọc mới (mở rộng event pattern), hoặc đổi lịch chạy định kỳ (sửa schedule expression).

### 7. Vị trí trong kiến trúc (nhà máy nền)
EventBridge là **phiên bản mở rộng của mục 9 Nhà máy nền — "bảng thông báo trung tâm có luật lọc thông minh"**: cùng vai trò với SNS/SQS (không cần đứng chờ nhau trực tiếp), nhưng có khả năng đọc kỹ nội dung tin nhắn và tự quyết định chuyển cho đúng trạm nào, kể cả nhận tin từ ngoài nhà máy (SaaS bên thứ 3).

### 8. 5 câu hỏi ôn tập
1. EventBridge khác SNS ở khả năng lọc như thế nào? → *EventBridge lọc sâu theo nội dung JSON bằng event pattern (toán tử numeric, prefix...), SNS chỉ lọc theo attribute đơn giản.*
2. Scheduled Rule dùng để thay thế cho cái gì? → *Thay cho việc tự dựng EC2 chạy cronjob — biến tác vụ định kỳ thành serverless.*
3. Archive & Replay trong EventBridge dùng để làm gì? → *Lưu lại event để replay sau, hữu ích khi debug/test lại đúng sự kiện đã xảy ra.*
4. Vì sao team vận hành trong case thực tế dùng 2 EventBridge Rule riêng? → *1 rule theo lịch (cleanup ban đêm), 1 rule theo sự kiện AWS gốc (EC2 state-change) — xử lý gọn bằng 2 rule độc lập.*
5. EventBridge khớp vào đâu trong nhà máy nền? → *Mở rộng của mục 9 — "bảng thông báo trung tâm có luật lọc", nhận cả tin từ ngoài nhà máy (SaaS bên thứ 3).*

---

## 5.27 — Amazon API Gateway

### 1. Khái niệm + ví dụ đời sống
API Gateway là **cổng vào trung tâm cho API** — đứng trước Lambda (hoặc bất kỳ backend nào) để xử lý các việc mà backend không nên tự lo: xác thực, throttling (giới hạn tốc độ), transform request/response, cache, versioning, CORS. Ví dụ đời sống: API Gateway như **quầy lễ tân chuyên nghiệp của tòa nhà văn phòng** — kiểm tra thẻ ra vào (auth), phát số thứ tự tránh quá tải (throttling), hướng dẫn khách đúng phòng ban (routing tới đúng Lambda/backend), thay vì để khách tự đi lang thang vào thẳng từng phòng.

- **REST API**: đầy đủ tính năng nhất (request validation, API key, usage plan...), độ trễ cao hơn 1 chút.
- **HTTP API**: nhẹ hơn, rẻ hơn, độ trễ thấp hơn, ít tính năng hơn REST API — phù hợp phần lớn use case serverless đơn giản.
- **WebSocket API**: cho giao tiếp 2 chiều realtime (chat, live update).

### 2. Lệnh quan trọng
```bash
aws apigatewayv2 create-api --name my-http-api --protocol-type HTTP     # tạo HTTP API (nhẹ, rẻ)

aws apigatewayv2 create-integration --api-id <api-id> \
  --integration-type AWS_PROXY --integration-uri <lambda-arn> \
  --payload-format-version 2.0                                          # gắn Lambda làm backend proxy

aws apigatewayv2 create-route --api-id <api-id> \
  --route-key "GET /hello" --target integrations/<integration-id>       # định nghĩa route

aws apigatewayv2 create-stage --api-id <api-id> --stage-name prod --auto-deploy  # tạo stage, tự deploy khi có thay đổi

aws apigatewayv2 create-usage-plan --name basic-plan --throttle BurstLimit=50,RateLimit=20  # (REST API) giới hạn tốc độ
```

**Từ điển flag nhanh:**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--protocol-type` | — | Loại API: HTTP, WEBSOCKET (v2), hoặc REST (v1 riêng) |
| `AWS_PROXY` | Lambda Proxy Integration | Chuyển nguyên request cho Lambda tự xử lý, không cần mapping template thủ công |
| `--route-key` | — | Định danh route dạng `METHOD /path` |
| `--stage-name` | — | Môi trường deploy (dev/staging/prod), mỗi stage có URL riêng |
| `--auto-deploy` | — | Tự động deploy thay đổi route/integration mới nhất vào stage này |
| `BurstLimit` / `RateLimit` | — | Giới hạn số request tức thời (burst) và trung bình bền vững (rate) |

### 3. So sánh nhanh

| Tiêu chí | REST API | HTTP API |
|---|---|---|
| Tính năng | Đầy đủ nhất (API key, usage plan, request validation, WAF) | Tối giản, đủ dùng cho hầu hết serverless app |
| Chi phí | Cao hơn | Thấp hơn (~70%) |
| Độ trễ | Cao hơn 1 chút | Thấp hơn |
| Dùng khi | Cần kiểm soát chi tiết, tích hợp WAF, throttling theo API key | Ưu tiên đơn giản, chi phí thấp, tốc độ nhanh |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Timeout tích hợp | Tối đa 29 giây | Backend (Lambda) chạy lâu hơn sẽ bị API Gateway trả lỗi timeout dù Lambda vẫn đang chạy |
| Payload tối đa | 10 MB | Request/response lớn hơn cần cách khác (vd presigned S3 URL) |
| Throttle mặc định tài khoản | 10,000 request/giây (soft limit) | Có thể xin tăng qua Service Quotas |
| Caching (REST API) | TTL cấu hình được, mặc định 300s | Giảm số lần gọi backend cho response ít đổi |

### 5. Cách dùng nâng cao / pattern thực tế
Pattern hay bị hỏi thi: **API Gateway timeout (29s cứng) luôn ngắn hơn Lambda timeout tối đa (15 phút)** — nếu backend cần chạy lâu hơn 29 giây, phải đổi kiến trúc sang **async pattern**: API Gateway trả về ngay 1 job ID, Lambda xử lý nền, client poll kết quả sau (hoặc dùng WebSocket để đẩy kết quả khi xong).

**Case thực tế**: 1 nền tảng TMĐT có API tạo báo cáo doanh thu theo yêu cầu — việc tổng hợp dữ liệu mất 2-3 phút, gọi trực tiếp qua API Gateway đồng bộ sẽ luôn timeout ở giây 29. Đội kỹ thuật đổi sang: API Gateway nhận request → trigger Step Functions chạy Lambda tổng hợp nền → trả ngay `reportId` cho client → client poll 1 API khác để check trạng thái/tải kết quả khi xong.

### 6. Cấu hình/thiết lập liên quan
CORS cho HTTP API (thường cần khi frontend SPA gọi trực tiếp):
```bash
aws apigatewayv2 update-api --api-id <api-id> \
  --cors-configuration AllowOrigins="*",AllowMethods="GET,POST",AllowHeaders="content-type"
```
Thực tế cần đụng khi: frontend báo lỗi CORS khi gọi API từ domain khác, hoặc cần giới hạn origin cụ thể thay vì `*` khi lên production.

### 7. Vị trí trong kiến trúc (nhà máy nền)
API Gateway là **trạm mới, gắn cùng khu với mục 4 Nhà máy nền (Sảnh phân luồng)** — nhưng chuyên trách cho traffic API/serverless: thay vì ALB đứng trước EC2/container tại Xưởng lắp ráp, API Gateway đứng trước **thợ thời vụ Lambda** (mục 5), làm thêm việc auth/throttling/transform mà ALB không có. 2 trạm này thường **không thay thế nhau** mà phục vụ 2 kiểu backend khác nhau trong cùng khu vực "sảnh đón khách".

### 8. 5 câu hỏi ôn tập
1. REST API khác HTTP API ở điểm nào? → *REST API đầy đủ tính năng hơn (API key, WAF, usage plan) nhưng đắt và chậm hơn; HTTP API tối giản, rẻ, nhanh hơn.*
2. Timeout tối đa của API Gateway là bao nhiêu, có vấn đề gì khi backend chạy lâu? → *29 giây — backend chạy lâu hơn cần chuyển sang async pattern (trả job ID, poll sau).*
3. Vì sao TMĐT trong case thực tế đổi API tạo báo cáo sang async? → *Vì tổng hợp dữ liệu mất 2-3 phút, vượt xa 29s timeout cứng của API Gateway.*
4. AWS_PROXY integration nghĩa là gì? → *Chuyển nguyên request cho Lambda tự xử lý, không cần mapping template thủ công.*
5. API Gateway khớp vào đâu trong nhà máy nền? → *Trạm mới cùng khu Sảnh phân luồng (mục 4), nhưng đứng trước thợ thời vụ Lambda (mục 5) thay vì EC2/container.*

---

# BƯỚC 1.5 — Lab tổng của section

## 🧭 Lab: Xây 1 quy trình xử lý đơn hàng serverless hoàn chỉnh

**Bối cảnh**: Vẫn là startup SaaS ở section trước — lần này sếp giao: xây API nhận đơn hàng (API Gateway + Lambda), xử lý bất đồng bộ qua SQS, thông báo đa kênh qua SNS, orchestrate quy trình xác minh nhiều bước bằng Step Functions, và tự động dọn dẹp theo lịch bằng EventBridge.

### Bước 1 — Tạo Lambda function xử lý đơn hàng (bài 5.17, gộp 5.18)
```bash
mkdir order-lambda && cd order-lambda
cat > index.js << 'EOF'
exports.handler = async (event) => {
  console.log("Order received:", event.body);
  return { statusCode: 200, body: JSON.stringify({ message: "Order received" }) };
};
EOF
zip function.zip index.js

aws iam create-role --role-name lambda-exec-role \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
aws iam attach-role-policy --role-name lambda-exec-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws lambda create-function \
  --function-name process-order --runtime nodejs20.x \
  --role arn:aws:iam::$ACCOUNT_ID:role/lambda-exec-role \
  --handler index.handler --zip-file fileb://function.zip
```

### Bước 2 — Tạo API Gateway HTTP API đứng trước Lambda (bài 5.27, gộp 5.28)
```bash
API_ID=$(aws apigatewayv2 create-api --name order-api --protocol-type HTTP --query 'ApiId' --output text)

aws lambda add-permission --function-name process-order \
  --statement-id apigw-invoke --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:ap-southeast-1:$ACCOUNT_ID:$API_ID/*"

INTEGRATION_ID=$(aws apigatewayv2 create-integration --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri arn:aws:lambda:ap-southeast-1:$ACCOUNT_ID:function:process-order \
  --payload-format-version 2.0 --query 'IntegrationId' --output text)

aws apigatewayv2 create-route --api-id $API_ID \
  --route-key "POST /orders" --target integrations/$INTEGRATION_ID

aws apigatewayv2 create-stage --api-id $API_ID --stage-name prod --auto-deploy
```

### Bước 3 — Tạo SQS queue + DLQ để đệm xử lý đơn hàng (bài 5.20, gộp 5.22)
```bash
DLQ_ARN=$(aws sqs create-queue --queue-name order-dlq --query 'QueueUrl' --output text)
DLQ_ARN=$(aws sqs get-queue-attributes --queue-url $DLQ_ARN --attribute-names QueueArn --query 'Attributes.QueueArn' --output text)

QUEUE_URL=$(aws sqs create-queue --queue-name order-queue \
  --attributes "RedrivePolicy={\"deadLetterTargetArn\":\"$DLQ_ARN\",\"maxReceiveCount\":3}" \
  --query 'QueueUrl' --output text)

aws lambda create-event-source-mapping --function-name process-order \
  --event-source-arn $(aws sqs get-queue-attributes --queue-url $QUEUE_URL --attribute-names QueueArn --query 'Attributes.QueueArn' --output text) \
  --batch-size 5   # Lambda tự poll queue, xử lý dần thay vì bị API Gateway dồn trực tiếp
```

### Bước 4 — Tạo SNS topic thông báo đa kênh (bài 5.21, gộp 5.22)
```bash
TOPIC_ARN=$(aws sns create-topic --name order-notifications --query 'TopicArn' --output text)
aws sns subscribe --topic-arn $TOPIC_ARN --protocol email --notification-endpoint ops@company.com
aws sns subscribe --topic-arn $TOPIC_ARN --protocol sqs --notification-endpoint $DLQ_ARN
aws sns publish --topic-arn $TOPIC_ARN --message "Order pipeline is live"
```

### Bước 5 — Tạo Step Functions orchestrate xác minh đơn hàng (bài 5.23, gộp 5.24)
```bash
cat > statemachine.json << EOF
{
  "Comment": "Order verification workflow",
  "StartAt": "VerifyOrder",
  "States": {
    "VerifyOrder": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ap-southeast-1:$ACCOUNT_ID:function:process-order",
      "Retry": [{ "ErrorEquals": ["States.TaskFailed"], "IntervalSeconds": 2, "MaxAttempts": 3, "BackoffRate": 2.0 }],
      "End": true
    }
  }
}
EOF
aws iam create-role --role-name step-functions-role \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"states.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
aws iam attach-role-policy --role-name step-functions-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaRole

aws stepfunctions create-state-machine \
  --name order-workflow --definition file://statemachine.json \
  --role-arn arn:aws:iam::$ACCOUNT_ID:role/step-functions-role
```

### Bước 6 — Tạo EventBridge rule dọn dẹp theo lịch (bài 5.25, gộp 5.26)
```bash
aws events put-rule --name nightly-cleanup --schedule-expression "cron(0 2 * * ? *)"
aws lambda add-permission --function-name process-order \
  --statement-id eventbridge-invoke --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:ap-southeast-1:$ACCOUNT_ID:rule/nightly-cleanup
aws events put-targets --rule nightly-cleanup \
  --targets "Id"="1","Arn"="arn:aws:lambda:ap-southeast-1:$ACCOUNT_ID:function:process-order"
```

### ✅ Lệnh verify
```bash
API_URL=$(aws apigatewayv2 get-api --api-id $API_ID --query 'ApiEndpoint' --output text)
curl -X POST $API_URL/prod/orders -d '{"item":"widget"}'
# Kỳ vọng: {"message":"Order received"}

aws sqs send-message --queue-url $QUEUE_URL --message-body '{"orderId":"999"}'
aws lambda invoke --function-name process-order --payload '{}' /tmp/out.json && cat /tmp/out.json
```

### 🧹 Cleanup
```bash
aws apigatewayv2 delete-api --api-id $API_ID
aws lambda delete-function --function-name process-order
aws sqs delete-queue --queue-url $QUEUE_URL
aws sqs delete-queue --queue-url $DLQ_ARN
aws sns delete-topic --topic-arn $TOPIC_ARN
aws stepfunctions delete-state-machine --state-machine-arn <arn>
aws events remove-targets --rule nightly-cleanup --ids "1"
aws events delete-rule --name nightly-cleanup
aws iam delete-role --role-name lambda-exec-role
aws iam delete-role --role-name step-functions-role
```

### ⚠️ Lưu ý dễ sai/dễ tốn phí
- Quên `aws lambda add-permission` cho API Gateway/EventBridge → gọi vào sẽ báo lỗi `AccessDenied` dù IAM Role Lambda đã đúng (đây là resource-based policy riêng của Lambda, không phải role).
- Visibility Timeout của SQS queue phải >= Lambda timeout, nếu không dễ xử lý trùng message.
- API Gateway HTTP API timeout cứng 29 giây — test với Lambda giả lập chạy lâu để chắc chắn không rơi vào timeout khi demo.
- EventBridge Scheduled Rule chạy đúng giờ UTC — nhớ quy đổi giờ Việt Nam (UTC+7) khi đặt cron.

---

# 📋 Cheat Sheet — Serverless Applications

### Exam Cram (tóm tắt nhanh)
- **Lambda**: timeout tối đa 15 phút, memory 128MB–10GB, Provisioned Concurrency loại bỏ cold start.
- **SQS**: point-to-point, 1 message/1 consumer, Standard (throughput cao, không đảm bảo thứ tự) vs FIFO (đảm bảo thứ tự, exactly-once).
- **SNS**: pub/sub, push tới nhiều subscriber, FilterPolicy lọc theo attribute.
- **Step Functions**: orchestrate nhiều bước/service theo state machine, Standard (tới 1 năm) vs Express (tối đa 5 phút, throughput cao).
- **EventBridge**: event bus lọc sâu theo nội dung (event pattern), tích hợp SaaS bên thứ 3, hỗ trợ Scheduled Rule thay cronjob.
- **API Gateway**: REST API (đầy đủ tính năng) vs HTTP API (nhẹ, rẻ, nhanh) — timeout cứng 29 giây, backend lâu hơn phải chuyển async.

### Architecture Patterns (tóm tắt)
| Tình huống thi hay gặp | Chọn gì |
|---|---|
| Cần đệm tải, tránh consumer chậm làm sập hệ thống | SQS ở giữa producer và consumer |
| 1 sự kiện cần nhiều team/service cùng xử lý độc lập | SNS fan-out (kèm SQS riêng cho mỗi team) |
| Cần lọc sự kiện theo nội dung phức tạp, tích hợp SaaS ngoài | EventBridge thay vì SNS |
| Quy trình nhiều bước, cần retry/rẽ nhánh/audit từng bước | Step Functions |
| API cần backend chạy lâu hơn 29 giây | API Gateway trả job ID ngay, xử lý nền qua Step Functions/SQS, client poll sau |
| Tác vụ định kỳ (cleanup, báo cáo hàng đêm) | EventBridge Scheduled Rule + Lambda, không dựng EC2 cronjob |
| Traffic đột biến khó lường trước | Lambda (scale tự động theo request) thay vì EC2 cố định |

> 💡 **Pattern chuẩn cần nhớ nằm lòng**: *API Gateway (cổng vào, auth/throttle) → Lambda (thợ thời vụ xử lý) → SQS (đệm tải nếu cần xử lý bất đồng bộ) → SNS/EventBridge (thông báo/định tuyến đa đích) → Step Functions (khi cần orchestrate nhiều bước có retry/rẽ nhánh) — chọn EventBridge thay SNS khi cần lọc nội dung sâu hoặc tích hợp SaaS ngoài.*

---

## 🏭 Trạm mới thêm vào nhà máy nền ở section này

| Trạm/nhánh mới | Bài | Gắn vào đâu trong bản đồ nền |
|---|---|---|
| **Thợ thời vụ chính thức — Lambda** | 5.17 | Xác nhận đầy đủ vai trò đã có sẵn trong mục 5 (Xưởng lắp ráp), không phải trạm mới nhưng chính thức "ra mắt" |
| **Hộp thư đợi — SQS** | 5.20 | Kiểu loa cụ thể đầu tiên hiện thực hóa mục 9 (Hệ thống loa phóng thanh) |
| **Loa phát thanh — SNS** | 5.21 | Kiểu loa thứ 2 ở mục 9, push tới nhiều subscriber cùng lúc |
| **Bảng thông báo trung tâm có luật lọc — EventBridge** | 5.25 | Mở rộng mục 9, lọc sâu theo nội dung + nhận tin từ ngoài nhà máy (SaaS) |
| **Đội trưởng dây chuyền tổng — Step Functions** | 5.23 | Trạm mới hoàn toàn — điều phối xuyên nhiều trạm khác nhau trong cả nhà máy (khác ECS/EKS chỉ điều phối trong Xưởng lắp ráp) |
| **Cổng vào API chuyên dụng — API Gateway** | 5.27 | Trạm mới, cùng khu Sảnh phân luồng (mục 4) nhưng đứng trước thợ thời vụ Lambda thay vì EC2/container |

*(Serverless/Event-Driven Architecture bài 5.16 và Application Integration Overview bài 5.19 là khái niệm/nguyên lý nền cho mục 9, không phải trạm riêng.)*

---

## 🎉 Hoàn tất Module 5 — Modern Architecture (Containers & Serverless)

- [x] ✅ 🔹 Docker Containers and ECS
- [x] ✅ 🔹 Serverless Applications

Theo đúng BƯỚC -1 trong prompt template: bạn vừa hoàn thành xong **Module 5**. Nếu chuyển sang **Module 6: Vận hành, Bảo mật & Quản trị**, nên mở 1 đoạn chat mới trong project này để tránh conversation quá dài làm giảm chất lượng file/quiz về sau — nhớ dán kèm mục **"🏭 Trạm mới thêm vào nhà máy nền"** của cả 2 section Module 5 (Đội trưởng ECS/EKS, Kho khuôn mẫu ECR, Thợ thời vụ Lambda, Hộp thư đợi SQS, Loa phát thanh SNS, Bảng thông báo EventBridge, Đội trưởng dây chuyền Step Functions, Cổng vào API Gateway) để giữ tính liền mạch ẩn dụ khi bắt đầu Module 6.
