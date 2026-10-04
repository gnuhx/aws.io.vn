# SAA-C03 · Module 7 — Mở rộng & Về đích
## 🔹 Section: Web, Mobile, ML, and Cost Management (7.13 – 7.24)

**Domain thi liên quan:** Design Cost-Optimized Architectures (20%) · Design High-Performing Architectures (24%) — section này gộp 2 mảng tưởng không liên quan (web/mobile/ML) và cost management, nhưng cả 2 đều rơi vào nhóm "công cụ hỗ trợ" phủ lên nhà máy nền chứ không phải hạ tầng lõi.

**Danh sách bài trong section:**

| Bài | Tên | Loại |
|---|---|---|
| 7.13 | Introduction | meta |
| 7.14 | AWS Amplify and AppSync | kỹ thuật |
| 7.15 | AWS Device Farm | kỹ thuật |
| 7.16 | AWS Machine Learning and AI Services | kỹ thuật |
| 7.17 | [HOL] Process and Analyze Videos | lab (gộp) |
| 7.18 | AWS License Manager | kỹ thuật |
| 7.19 | AWS Compute Optimizer | kỹ thuật |
| 7.20 | [HOL] AWS Budgets | lab (gộp) |
| 7.21 | [HOL] AWS Cost Explorer | lab (gộp) |
| 7.22 | [HOL] Cost Allocation Tags | lab (gộp) |
| 7.23 | AWS Cost Management Tools | kỹ thuật |
| 7.24 | [HOL] AWS Cost Management Tools | lab (gộp) |

---

## 🗺️ Roadmap tiến độ — Module 7

- [x] ✅ 🔹 Migration and Transfer (7.1–7.12)
- [x] ✅ **🔹 Web, Mobile, ML, and Cost Management (7.13–7.24)** ← đang học
- [ ] ⏳ 🔹 Full-Length Practice Exam (7.25)
- [ ] ⏳ 🔹 Final Exam Preparation (7.26–7.27)

*(Kế thừa nhà máy nền đầy đủ tới hết Module 7 - Section 1: Route 53/CloudFront, VPC+SG/NACL, ALB/NLB, EC2/ASG+Lambda, RDS/Aurora+ElastiCache, S3, SQS/SNS/EventBridge/Step Functions/API Gateway, ECS/EKS/ECR, CloudFormation/Beanstalk/Config/Secrets Manager, CloudWatch/CloudTrail, lớp phủ an ninh IAM/KMS/GuardDuty/WAF/Shield/Cognito/ACM, và nhóm "phòng kế hoạch mở rộng + đội di dời" từ Migration and Transfer: Migration Hub/Discovery, DMS, MGN, DataSync, Snow Family, 7 Rs.)*

---

# BƯỚC 1 — Nội dung từng bài kỹ thuật

## 7.14 — AWS Amplify and AppSync

### 1. Khái niệm + ví dụ đời sống
**AWS Amplify** là bộ framework + CLI + hosting giúp dựng nhanh app web/mobile full-stack (frontend + backend serverless) với auth/API/storage tích hợp sẵn. **AWS AppSync** là dịch vụ **GraphQL managed**, hỗ trợ real-time subscriptions và offline sync. Ví dụ đời sống: Amplify như bộ đồ nghề lắp nhà lắp ghép nhanh (prefab) cho developer front-end, không cần tự xây từng viên gạch backend; AppSync là "tổng đài GraphQL" trả lời đúng câu khách hỏi thay vì trả nguyên cả kho REST.

- **Amplify Hosting**: CI/CD tự động deploy static/SSR site từ Git repo
- **Amplify Libraries**: SDK client-side kết nối Cognito/AppSync/S3
- **AppSync**: GraphQL managed, resolver kết nối trực tiếp DynamoDB/Lambda/RDS, hỗ trợ subscription real-time

### 2. Lệnh quan trọng

```bash
amplify init                       # Khởi tạo project Amplify mới
amplify add api                    # Thêm API (chọn GraphQL = AppSync, hoặc REST = API Gateway)
amplify push                       # Deploy backend lên AWS thật

aws appsync create-graphql-api \
  --name my-api --authentication-type API_KEY
```

**Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `amplify init` | Initialize | Tạo project Amplify mới, sinh cấu hình local |
| `amplify add api` | Add API | Thêm resource API (GraphQL/AppSync hoặc REST/API Gateway) |
| `amplify push` | Push | Deploy backend đã cấu hình local lên tài khoản AWS thật |
| `--authentication-type` | Auth Type | Cơ chế xác thực API (API_KEY, AWS_IAM, Cognito User Pools...) |

### 3. So sánh nhanh

| Tiêu chí | Amplify | AppSync |
|---|---|---|
| Phạm vi | Toàn bộ toolchain (frontend + backend + hosting + CI/CD) | Chỉ riêng tầng API (GraphQL) |
| Vai trò | Bộ khung dựng app end-to-end | 1 thành phần backend mà Amplify có thể dùng bên trong |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Direct Lambda resolver timeout | 30 giây | Nếu xử lý lâu hơn cần tách qua Step Functions/async pattern |
| Subscription | Real-time qua WebSocket | Khác hẳn REST polling truyền thống |

### 5. Cách dùng nâng cao / pattern thực tế
Dùng **Direct Resolver** của AppSync gọi thẳng DynamoDB (bỏ qua Lambda) để giảm latency cho các thao tác CRUD đơn giản.

**Case thực tế:** một startup mobile game cần bảng leaderboard realtime cập nhật liên tục cho hàng nghìn người chơi cùng lúc. Dùng AppSync subscription để push update tới toàn bộ client đang mở app ngay khi có điểm mới, thay vì mỗi client phải polling API liên tục gây tốn tài nguyên và độ trễ cao.

### 6. Cấu hình/thiết lập liên quan
Schema định nghĩa trong file `schema.graphql`; resolver mapping template viết bằng VTL (Velocity Template Language) hoặc JS resolver — cần chỉnh khi muốn custom logic transform request/response giữa client và data source (DynamoDB/Lambda/RDS).

### 7. Vị trí trong kiến trúc (nhà máy nền)
Gắn cạnh **"Sảnh phân luồng — API Gateway"** như 1 nhánh mới: **"quầy tiếp tân nhanh cho ứng dụng web/mobile"**, đứng song song API Gateway nhưng chuyên trả lời theo kiểu GraphQL (khách hỏi gì trả đúng thứ đó), kết nối trực tiếp vào Xưởng lắp ráp Lambda và Kho tổng DynamoDB.

### 8. 5 câu hỏi ôn tập
1. **Q:** Amplify và AppSync khác nhau ở điểm nào? **A:** Amplify là toàn bộ toolchain dựng app; AppSync chỉ là tầng API GraphQL mà Amplify có thể dùng bên trong.
2. **Q:** AppSync hỗ trợ cơ chế nào để cập nhật dữ liệu real-time tới client? **A:** Subscriptions qua WebSocket.
3. **Q:** Direct Resolver trong AppSync giúp ích gì? **A:** Gọi thẳng data source (vd DynamoDB) bỏ qua Lambda, giảm latency cho thao tác đơn giản.
4. **Q:** Resolver mapping template của AppSync viết bằng ngôn ngữ gì? **A:** VTL (hoặc JS resolver).
5. **Q:** Vì sao case leaderboard game chọn AppSync subscription thay vì polling REST API? **A:** Vì polling liên tục tốn tài nguyên và có độ trễ cao; subscription đẩy update ngay khi có thay đổi, phù hợp dữ liệu realtime với lượng client lớn.

---

## 7.15 — AWS Device Farm

### 1. Khái niệm + ví dụ đời sống
Dịch vụ test ứng dụng mobile/web trên **thiết bị thật** trong cloud, không cần mua hàng trăm điện thoại thật để test đủ hãng/đời máy. Ví dụ đời sống: phòng lab QA ảo có sẵn hàng trăm điện thoại thật, thuê theo giờ thay vì mua đứt từng cái.

- **Automated testing**: chạy test suite (Appium, Espresso, XCTest...) trên nhiều thiết bị song song
- **Remote access**: điều khiển trực tiếp 1 thiết bị thật qua trình duyệt để debug thủ công

### 2. Lệnh quan trọng

```bash
aws devicefarm create-project --name "MyMobileApp"

aws devicefarm schedule-run \
  --project-arn arn:aws:devicefarm:...:project:xxx \
  --app-arn arn:aws:devicefarm:...:upload:yyy \
  --device-pool-arn arn:aws:devicefarm:...:devicepool:zzz \
  --test '{"type":"APPIUM_JAVA_TESTNG"}'

aws devicefarm list-devices
```

**Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--project-arn` | Project ARN | Định danh project Device Farm chứa các lần chạy test |
| `--app-arn` | Application ARN | File `.apk`/`.ipa` đã upload lên Device Farm |
| `--device-pool-arn` | Device Pool | Nhóm thiết bị thật (hãng/đời máy/OS version) sẽ chạy test |
| `--test` | Test Type | Loại framework test (Appium, Espresso, XCTest...) |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Concurrent devices | Theo gói dịch vụ | Số thiết bị chạy song song ảnh hưởng tốc độ hoàn thành test suite |

### 5. Cách dùng nâng cao / pattern thực tế
Tích hợp Device Farm vào pipeline **CodePipeline/CodeBuild** để tự động chạy test mỗi lần có build mới, chặn merge nếu test fail trên bất kỳ thiết bị nào.

**Case thực tế:** một app fintech mobile banking cần đảm bảo hoạt động đúng trên 50+ dòng máy Android khác cấu hình trước mỗi lần release, vì lỗi hiển thị sai số dư tài khoản trên 1 dòng máy cụ thể có thể gây khiếu nại nghiêm trọng. Đội QA tự động hóa toàn bộ test suite chạy qua Device Farm trong CI/CD, thay vì phải test thủ công tốn nhiều ngày mỗi release.

### 6. Cấu hình/thiết lập liên quan
Upload file `.apk`/`.ipa` lên Device Farm; định nghĩa test spec bằng YAML (`testspec.yml`) chỉ rõ bước cài đặt dependency, lệnh chạy test — cần chỉnh khi test suite cần thêm bước setup đặc biệt trước khi chạy.

### 7. Vị trí trong kiến trúc (nhà máy nền)
Đứng **ngoài luồng production** của nhà máy — là **"phòng QA kiểm định trước khi xuất xưởng"**, không phục vụ request thật của khách hàng mà kiểm tra chất lượng app trước khi release ra ngoài.

### 8. 5 câu hỏi ôn tập
1. **Q:** Device Farm test trên thiết bị giả lập hay thiết bị thật? **A:** Thiết bị thật (real device farm trong cloud AWS).
2. **Q:** 2 chế độ sử dụng chính của Device Farm là gì? **A:** Automated testing (chạy test suite) và Remote access (điều khiển thủ công qua browser).
3. **Q:** Test spec của Device Farm định nghĩa bằng định dạng gì? **A:** YAML (`testspec.yml`).
4. **Q:** Vì sao nên tích hợp Device Farm vào CI/CD thay vì chạy thủ công? **A:** Tự động hóa, phát hiện lỗi sớm mỗi lần build mới, tiết kiệm thời gian so với test thủ công.
5. **Q:** Trong case fintech, vì sao cần test trên 50+ dòng máy thay vì vài máy phổ biến? **A:** Vì lỗi hiển thị sai trên dù chỉ 1 dòng máy cụ thể (vd sai số dư tài khoản) có thể gây hậu quả nghiêm trọng với ứng dụng tài chính.

---

## 7.16 — AWS Machine Learning and AI Services

### 1. Khái niệm + ví dụ đời sống
Nhóm dịch vụ AI/ML **managed, pre-trained** — gọi API dùng ngay, không cần tự train model. Ví dụ đời sống: thuê chuyên gia bên ngoài xử lý việc chuyên môn (nhận diện ảnh, dịch thuật, phiên âm giọng nói...) thay vì tự đào tạo nhân viên nội bộ từ đầu.

- **Amazon Rekognition**: nhận diện ảnh/video (object, face, content moderation)
- **Amazon Comprehend**: NLP — phân tích sentiment, entity trong văn bản
- **Amazon Transcribe**: speech-to-text
- **Amazon Polly**: text-to-speech
- **Amazon Translate**: dịch ngôn ngữ
- **Amazon Lex**: xây dựng chatbot/voice bot
- **Amazon Textract**: OCR trích xuất dữ liệu từ document/form
- **Amazon SageMaker**: build/train/deploy model **custom** (khác nhóm trên vốn pre-trained sẵn)

### 2. Lệnh quan trọng

```bash
aws rekognition detect-labels --image '{"S3Object":{"Bucket":"my-bucket","Name":"photo.jpg"}}'

aws comprehend detect-sentiment --text "Sản phẩm này rất tốt" --language-code vi

aws transcribe start-transcription-job \
  --transcription-job-name job1 \
  --media MediaFileUri=s3://my-bucket/audio.mp3 \
  --language-code vi-VN

aws textract analyze-document \
  --document '{"S3Object":{"Bucket":"my-bucket","Name":"form.png"}}' \
  --feature-types '["FORMS"]'
```

**Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--image` | Image Source | Vị trí ảnh (S3) để Rekognition phân tích |
| `--text` | Input Text | Văn bản đầu vào cho Comprehend phân tích |
| `--language-code` | Language Code | Mã ngôn ngữ xử lý (vd `vi`, `vi-VN`, `en-US`) |
| `--media` | Media Source | File audio/video nguồn cho Transcribe |
| `--feature-types` | Feature Types | Loại trích xuất Textract cần (FORMS, TABLES...) |

### 3. So sánh nhanh

| Tiêu chí | AI Services (Rekognition, Comprehend...) | Amazon SageMaker |
|---|---|---|
| Model | Pre-trained sẵn, gọi API dùng ngay | Tự train/fine-tune model theo dữ liệu riêng |
| Thời gian triển khai | Rất nhanh (chỉ gọi API) | Cần thời gian chuẩn bị data + train + deploy |
| Khi nào dùng | Bài toán phổ biến (ảnh, text, giọng nói chuẩn) | Bài toán đặc thù, cần độ chính xác cao theo domain riêng |

### 5. Cách dùng nâng cao / pattern thực tế
Kết hợp **S3 event notification → Lambda → Rekognition** để tự động xử lý ngay khi có ảnh mới upload, không cần polling hay xử lý thủ công.

**Case thực tế:** một sàn thương mại điện tử nhận hàng triệu ảnh sản phẩm do người bán tự upload mỗi ngày. Hệ thống dùng Rekognition tự động detect nội dung không phù hợp (content moderation) ngay khi ảnh được upload lên S3, chặn hiển thị công khai trước khi có nhân viên kiểm duyệt thủ công xác nhận lại.

### 7. Vị trí trong kiến trúc (nhà máy nền)
Nhóm trạm mới **"phòng ban chuyên gia thuê ngoài"** gắn cạnh Xưởng lắp ráp Lambda/EC2 — được gọi tới xử lý tác vụ chuyên biệt (ảnh, văn bản, giọng nói) rồi trả kết quả về cho trạm gọi, không phải trạm sản xuất chính trong luồng xử lý request thông thường.

### 8. 5 câu hỏi ôn tập
1. **Q:** Dịch vụ nào dùng để chuyển giọng nói thành văn bản? **A:** Amazon Transcribe.
2. **Q:** Dịch vụ nào trích xuất dữ liệu từ form/document dạng ảnh? **A:** Amazon Textract.
3. **Q:** Điểm khác biệt chính giữa nhóm AI Services và SageMaker? **A:** AI Services dùng model pre-trained sẵn, gọi API ngay; SageMaker cho phép tự train model theo dữ liệu riêng.
4. **Q:** Dịch vụ nào phù hợp để xây chatbot? **A:** Amazon Lex.
5. **Q:** Trong case sàn TMĐT, vì sao cần tự động hóa content moderation bằng Rekognition thay vì chỉ dựa vào nhân viên kiểm duyệt? **A:** Vì khối lượng ảnh quá lớn (hàng triệu ảnh/ngày), tự động lọc trước giúp giảm tải và chặn nội dung xấu hiển thị công khai ngay lập tức trước khi con người kịp xử lý.

---

## 7.18 — AWS License Manager

### 1. Khái niệm + ví dụ đời sống
Quản lý tập trung **license phần mềm BYOL** (Bring Your Own License) khi chạy trên AWS, tránh vi phạm điều khoản license (Windows Server, SQL Server, Oracle...) hoặc vượt số lượng đã mua. Ví dụ đời sống: sổ theo dõi giấy phép sử dụng thiết bị trong công ty, tự động cảnh báo khi có người dùng vượt quá số lượng license đã mua.

- Theo dõi theo **core, socket, hoặc instance** (tùy điều khoản license của nhà cung cấp phần mềm)
- **Rules** có thể ngăn launch thêm instance mới nếu sẽ vượt giới hạn license đã cấu hình

### 2. Lệnh quan trọng

```bash
aws license-manager create-license-configuration \
  --name "SQLServer-Standard" \
  --license-counting-type vCPU \
  --license-count 100 \
  --license-count-hard-limit

aws license-manager list-usage-for-license-configuration \
  --license-configuration-arn arn:aws:license-manager:...:license-configuration:xxx
```

**Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--license-counting-type` | Counting Type | Đơn vị đếm license (vCPU, Core, Socket, Instance) |
| `--license-count` | License Count | Tổng số license được phép sử dụng |
| `--license-count-hard-limit` | Hard Limit | Nếu bật, chặn cứng launch thêm khi vượt giới hạn (không chỉ cảnh báo) |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Rule enforcement | Chỉ chặn launch **mới** | Không tự động dừng instance đang chạy đã vi phạm từ trước |

### 5. Cách dùng nâng cao / pattern thực tế
Tích hợp License Manager với **AWS Organizations** để enforce license tập trung trên toàn bộ account trong 1 tổ chức, không chỉ 1 account riêng lẻ.

**Case thực tế:** một tập đoàn có nhiều team tự launch Windows Server/SQL Server rải rác trên nhiều account AWS khác nhau, không ai theo dõi tổng số license đang dùng thực tế. Đội hạ tầng triển khai License Manager ở cấp Organization để theo dõi tập trung, tránh bị phạt nặng khi Microsoft audit license compliance.

### 7. Vị trí trong kiến trúc (nhà máy nền)
Thuộc nhóm **"lớp phủ toàn nhà máy"** như IAM/KMS — License Manager là **"sổ theo dõi giấy phép sử dụng thiết bị"** áp lên toàn bộ Xưởng lắp ráp EC2, không phải 1 trạm sản xuất riêng.

### 8. 5 câu hỏi ôn tập
1. **Q:** License Manager dùng cho mô hình license nào? **A:** BYOL (Bring Your Own License).
2. **Q:** License Manager có thể theo dõi theo những đơn vị nào? **A:** Core, socket, hoặc instance (tùy cấu hình `license-counting-type`).
3. **Q:** Hard limit trong License Manager làm gì? **A:** Chặn cứng việc launch thêm instance khi sẽ vượt số license cấu hình, thay vì chỉ cảnh báo.
4. **Q:** License Manager có tự dừng instance đang chạy vi phạm không? **A:** Không — chỉ chặn launch mới, không tự động dừng instance cũ.
5. **Q:** Vì sao tập đoàn trong case nên dùng License Manager ở cấp Organization thay vì từng account riêng? **A:** Vì license được mua theo tổng số dùng toàn công ty, cần theo dõi tập trung xuyên suốt nhiều account mới tránh vi phạm khi audit.

---

## 7.19 — AWS Compute Optimizer

### 1. Khái niệm + ví dụ đời sống
Dùng **Machine Learning** phân tích lịch sử sử dụng CPU/RAM/network của EC2, EBS, Lambda, Auto Scaling Group để đề xuất **right-sizing** — đổi sang loại/kích thước tối ưu hơn cả hiệu năng lẫn chi phí. Ví dụ đời sống: chuyên gia phân tích hóa đơn điện nước hàng tháng của nhà bạn, đề xuất đổi sang gói dịch vụ phù hợp hơn với thói quen sử dụng thực tế thay vì đoán mò.

### 2. Lệnh quan trọng

```bash
aws compute-optimizer get-ec2-instance-recommendations \
  --instance-arns arn:aws:ec2:...:instance/i-0123456789

aws compute-optimizer get-auto-scaling-group-recommendations \
  --auto-scaling-group-arns arn:aws:autoscaling:...:autoScalingGroup:xxx
```

**Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--instance-arns` | Instance ARNs | Danh sách EC2 instance cần lấy đề xuất right-sizing |
| `--auto-scaling-group-arns` | ASG ARNs | Danh sách Auto Scaling Group cần đề xuất tối ưu |

### 3. So sánh nhanh

| Tiêu chí | Compute Optimizer | Cost Explorer Rightsizing Recommendations |
|---|---|---|
| Trọng tâm | Phân tích ML sâu về performance (CPU/RAM/network) | Tập trung góc độ chi phí, ít chi tiết performance hơn |
| Phạm vi | EC2, EBS, Lambda, ASG | Chủ yếu EC2 |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Dữ liệu tối thiểu | 14 ngày (CloudWatch mặc định) | Cần đủ dữ liệu mới có recommendation đáng tin |
| Enhanced infrastructure metrics | Trả phí thêm, tới 3 tháng dữ liệu | Chính xác hơn cho hệ thống có traffic theo mùa |

### 5. Cách dùng nâng cao / pattern thực tế
Bật **Enhanced infrastructure metrics** để phân tích dựa trên 3 tháng dữ liệu thay vì 14 ngày mặc định, tránh đề xuất sai khi hệ thống có tính mùa vụ.

**Case thực tế:** một công ty game có traffic tăng vọt vào dịp lễ Tết nhưng thấp điểm quanh năm. Nếu chỉ dùng 14 ngày dữ liệu mặc định (rơi đúng giai đoạn thấp điểm), Compute Optimizer có thể đề xuất downsize nhầm instance, gây quá tải khi vào mùa cao điểm. Bật Enhanced metrics giúp nhìn được toàn bộ chu kỳ traffic trước khi quyết định.

### 7. Vị trí trong kiến trúc (nhà máy nền)
Thuộc nhóm lớp phủ giám sát như CloudWatch — Compute Optimizer là **"phòng kế toán kỹ thuật"** theo dõi hiệu suất Xưởng lắp ráp EC2/ASG/Lambda để đề xuất tinh gọn, không phải trạm sản xuất.

### 8. 5 câu hỏi ôn tập
1. **Q:** Compute Optimizer dùng công nghệ gì để đưa ra đề xuất? **A:** Machine Learning phân tích lịch sử sử dụng tài nguyên.
2. **Q:** Cần tối thiểu bao nhiêu ngày dữ liệu để có recommendation mặc định? **A:** 14 ngày.
3. **Q:** Compute Optimizer hỗ trợ những loại tài nguyên nào? **A:** EC2, EBS, Lambda, Auto Scaling Group.
4. **Q:** Enhanced infrastructure metrics giúp ích gì? **A:** Phân tích dựa trên tới 3 tháng dữ liệu thay vì 14 ngày, chính xác hơn cho hệ thống có tính mùa vụ.
5. **Q:** Vì sao công ty game trong case cần bật Enhanced metrics? **A:** Vì traffic có tính mùa vụ rõ rệt, 14 ngày mặc định có thể rơi vào giai đoạn thấp điểm và gây đề xuất downsize sai lầm.

---

## 7.23 — AWS Cost Management Tools

### 1. Khái niệm + ví dụ đời sống
Bộ công cụ theo dõi & tối ưu chi phí: **AWS Budgets** (đặt ngưỡng cảnh báo), **Cost Explorer** (phân tích lịch sử & dự báo), **Cost and Usage Report - CUR** (chi tiết nhất, xuất ra S3), **Cost Allocation Tags** (gắn tag để phân bổ chi phí theo team/project), **Savings Plans/Reserved Instances** (cam kết dài hạn để giảm giá), **Trusted Advisor** (gợi ý tổng hợp cả cost/security/performance). Ví dụ đời sống: phòng kế toán công ty có nhiều công cụ khác nhau — 1 cái cảnh báo khi vượt ngân sách, 1 cái vẽ biểu đồ chi tiêu quá khứ, 1 cái xuất báo cáo chi tiết theo từng phòng ban.

### 2. Lệnh quan trọng

```bash
aws budgets create-budget \
  --account-id 123456789012 \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json

aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-02-01 \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --group-by Type=TAG,Key=Project

aws ce get-rightsizing-recommendation --service AmazonEC2
```

**Từ điển flag nhanh**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--budget` | Budget Definition | File JSON định nghĩa ngân sách (amount, thời gian, loại chi phí theo dõi) |
| `--notifications-with-subscribers` | Notification Config | Cấu hình ai nhận cảnh báo khi vượt ngưỡng |
| `--granularity` | Granularity | Độ chi tiết theo thời gian (DAILY/MONTHLY/HOURLY) khi truy vấn Cost Explorer |
| `--group-by` | Group By | Nhóm chi phí theo tiêu chí (vd tag `Project`) |
| `--metrics` | Cost Metric | Loại số liệu chi phí lấy về (UnblendedCost, AmortizedCost...) |

### 3. So sánh nhanh

| Công cụ | Mục đích | Khi nào dùng |
|---|---|---|
| AWS Budgets | Đặt ngưỡng, cảnh báo khi vượt | Muốn chủ động biết trước khi chi phí vượt kiểm soát |
| Cost Explorer | Phân tích lịch sử + dự báo xu hướng | Muốn hiểu chi phí đã dùng ra sao, dự đoán tháng tới |
| Cost and Usage Report (CUR) | Báo cáo chi tiết nhất, xuất ra S3 | Cần phân tích sâu bằng Athena/QuickSight, tích hợp BI |
| Cost Allocation Tags | Gắn nhãn để phân bổ chi phí theo team/project | Cần biết ai/phòng ban nào tiêu bao nhiêu |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Cost Explorer data delay | ~24 giờ | Không phải realtime tuyệt đối |
| CUR granularity | Tối thiểu daily | Có thể tăng chi tiết hơn theo resource ID |
| Cost Allocation Tags | Cần **activate** thủ công | User-defined tag không tự lên report nếu chưa bật trong Billing console |

### 5. Cách dùng nâng cao / pattern thực tế
Dùng **Budget Actions** để tự động thực thi hành động (áp IAM policy hoặc Service Control Policy) khi vượt ngưỡng, thay vì chỉ gửi email cảnh báo thụ động.

**Case thực tế:** một startup có ngân sách cloud hạn chế thiết lập Budget Action tự động áp SCP chặn launch thêm EC2 instance mới ngay khi chi phí tháng chạm 90% ngân sách đã định, tránh tình trạng "cháy túi" ngoài kiểm soát trước khi có người kịp can thiệp thủ công.

### 6. Cấu hình/thiết lập liên quan
Budget định nghĩa qua JSON (`amount`, `timePeriod`, `notificationThreshold`); Cost Allocation Tag cần vào **Billing and Cost Management console > Cost allocation tags** để **activate** thủ công (tag đã gắn trên resource nhưng chưa activate sẽ không xuất hiện trong report) — cần đụng tới ngay khi bắt đầu dự án mới muốn theo dõi chi phí riêng.

### 7. Vị trí trong kiến trúc (nhà máy nền)
Nhóm **"phòng kế toán trung tâm"** giám sát toàn bộ chi phí vận hành nhà máy — không phải trạm sản xuất, mà là lớp phủ tài chính áp lên **tất cả** các trạm đã học từ Module 2 tới giờ.

### 8. 5 câu hỏi ôn tập
1. **Q:** Công cụ nào cho phân tích chi tiết nhất, xuất ra S3 để dùng Athena/QuickSight? **A:** Cost and Usage Report (CUR).
2. **Q:** Vì sao tag đã gắn trên resource mà không thấy trong Cost Explorer? **A:** Vì Cost Allocation Tag cần được **activate** thủ công trong Billing console trước.
3. **Q:** Budget Actions khác gì so với Budget notification thông thường? **A:** Budget Actions tự động thực thi hành động (vd áp SCP chặn resource), không chỉ gửi cảnh báo email thụ động.
4. **Q:** Dữ liệu Cost Explorer có độ trễ khoảng bao lâu? **A:** Khoảng 24 giờ, không phải realtime tuyệt đối.
5. **Q:** Trong case startup, Budget Action giúp ích gì so với chỉ nhận email cảnh báo? **A:** Tự động chặn resource mới ngay khi vượt ngưỡng, tránh chi phí tiếp tục phát sinh trong lúc chờ con người phản ứng với email cảnh báo.

---

# BƯỚC 1.5 — Lab tổng của section

### 🧭 Bối cảnh
Bạn được giao 2 việc trong tuần đầu: (1) dựng 1 pipeline tự động xử lý video khách hàng upload bằng Rekognition, và (2) thiết lập bộ theo dõi chi phí đầy đủ (Budget + Cost Explorer + Cost Allocation Tags) cho toàn bộ dự án — vì sếp vừa bị "sốc hóa đơn" AWS tháng trước.

### Bước 1 — Pipeline xử lý video tự động (Rekognition)
```bash
# Tạo S3 bucket nhận video upload
aws s3 mb s3://video-pipeline-lab

# Tạo Lambda function trigger khi có video mới, gọi Rekognition Video
aws lambda create-function \
  --function-name process-video \
  --runtime python3.12 --handler app.handler \
  --role arn:aws:iam::...:role/VideoPipelineRole \
  --zip-file fileb://function.zip

# Gắn S3 event trigger cho Lambda
aws s3api put-bucket-notification-configuration \
  --bucket video-pipeline-lab \
  --notification-configuration file://notif-config.json

# Trong Lambda: gọi StartLabelDetection để phân tích nội dung video
aws rekognition start-label-detection \
  --video '{"S3Object":{"Bucket":"video-pipeline-lab","Name":"sample.mp4"}}' \
  --notification-channel RoleArn=arn:aws:iam::...:role/RekognitionSNSRole,SNSTopicArn=arn:aws:sns:...:video-results
```

### Bước 2 — Cost Allocation Tags (7.22)
```bash
# Gắn tag lên toàn bộ resource của dự án
aws s3api put-bucket-tagging --bucket video-pipeline-lab \
  --tagging 'TagSet=[{Key=Project,Value=VideoPipeline}]'
aws lambda tag-resource --resource arn:aws:lambda:...:function:process-video \
  --tags Project=VideoPipeline

# Activate tag "Project" trong Billing console (không có CLI — phải làm qua UI)
# Billing and Cost Management > Cost allocation tags > chọn "Project" > Activate
```

### Bước 3 — AWS Budgets (7.20)
```bash
cat > budget.json << 'EOF'
{
  "BudgetName": "VideoPipeline-Monthly",
  "BudgetLimit": {"Amount": "50", "Unit": "USD"},
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST",
  "CostFilters": {"TagKeyValue": ["user:Project$VideoPipeline"]}
}
EOF

aws budgets create-budget \
  --account-id 123456789012 \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

### Bước 4 — Cost Explorer (7.21)
```bash
# Bật Cost Explorer lần đầu (chỉ cần làm 1 lần/account, có thể qua console)
aws ce get-cost-and-usage \
  --time-period Start=2026-08-01,End=2026-09-01 \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --filter '{"Tags":{"Key":"Project","Values":["VideoPipeline"]}}'
```

### Bước 5 — Cost Management Tools tổng hợp (7.24)
```bash
# Kiểm tra rightsizing recommendation cho toàn bộ EC2 (nếu có dùng trong dự án)
aws ce get-rightsizing-recommendation --service AmazonEC2

# Xem Trusted Advisor cost checks (yêu cầu Business/Enterprise support plan)
aws support describe-trusted-advisor-checks --language en \
  --query "checks[?category=='cost_optimizing']"
```

### ✅ Lệnh verify
```bash
aws budgets describe-budgets --account-id 123456789012          # Budget đã tạo đúng ngưỡng
aws ce get-cost-and-usage --time-period Start=2026-08-01,End=2026-09-01 --granularity MONTHLY --metrics "UnblendedCost" --group-by Type=TAG,Key=Project   # Chi phí đã phân bổ đúng theo tag
aws rekognition get-label-detection --job-id <job-id>            # Kết quả phân tích video
```

### 🧹 Cleanup
```bash
aws lambda delete-function --function-name process-video
aws s3 rb s3://video-pipeline-lab --force
aws budgets delete-budget --account-id 123456789012 --budget-name VideoPipeline-Monthly
```

### ⚠️ Lưu ý dễ sai/dễ tốn phí
- **Cost Allocation Tag không tự lên report** nếu quên bước "Activate" thủ công trong Billing console — đây là bước hay bị bỏ sót nhất.
- **Cost Explorer có độ trễ ~24h** — đừng hoảng nếu vừa gắn tag mà chưa thấy số liệu ngay.
- Rekognition Video (`start-label-detection`) là **async** — phải poll `get-label-detection` hoặc nhận qua SNS, không trả kết quả ngay lập tức như Rekognition Image.
- Budget Action tự động (SCP chặn resource) cần cấu hình cẩn thận — nếu áp nhầm vào production có thể chặn cả những resource cần thiết.

---

# 📋 Cheat Sheet (gộp Exam Cram + Architecture Patterns)

### Exam Cram — những điểm hay bị hỏi nhất
- **Amplify vs AppSync**: Amplify = toàn bộ toolchain; AppSync = riêng tầng GraphQL API.
- **AI Services (pre-trained) vs SageMaker (tự train)** — đề thi hay hỏi tình huống "cần kết quả nhanh, bài toán phổ biến" (chọn AI Service) vs "cần độ chính xác cao theo domain riêng" (chọn SageMaker).
- **License Manager chỉ chặn launch mới**, không tự dừng instance vi phạm đang chạy.
- **Compute Optimizer cần tối thiểu 14 ngày dữ liệu** — nhớ số này, hay bị hỏi trực tiếp.
- **Cost Allocation Tags phải Activate thủ công** trong Billing console — lỗi rất hay gặp trong thực tế lẫn đề thi.
- **Budget Actions** = tự động hành động (SCP/IAM), khác **Budget notification** chỉ gửi cảnh báo.

### Architecture Patterns — pattern chuẩn cần nhớ nằm lòng
**S3 upload → Lambda trigger → AI Service (Rekognition/Textract/Comprehend) xử lý → lưu kết quả/SNS thông báo** — pattern serverless xử lý nội dung phổ biến nhất.

- Theo dõi chi phí chuẩn: **Cost Allocation Tags (activate) → Cost Explorer (phân tích xu hướng) → AWS Budgets (cảnh báo/action) → CUR (chi tiết sâu qua Athena nếu cần)**.
- Web/mobile app nhanh: **Amplify (frontend + hosting + CI/CD) → AppSync (GraphQL) → DynamoDB/Lambda → Cognito (auth)**.
- Trước khi release app mobile: **Device Farm (test trên thiết bị thật) tích hợp CI/CD**, chặn merge nếu fail.

---

## 🏭 Trạm mới thêm vào nhà máy nền ở section này

- **Quầy tiếp tân nhanh cho web/mobile** (Amplify + AppSync) — song song API Gateway, chuyên trả lời GraphQL, nối vào Xưởng lắp ráp Lambda và Kho tổng DynamoDB.
- **Phòng QA kiểm định trước khi xuất xưởng** (Device Farm) — đứng ngoài luồng production, kiểm tra chất lượng app trước khi release.
- **Phòng ban chuyên gia thuê ngoài** (Rekognition, Comprehend, Transcribe, Polly, Translate, Lex, Textract, SageMaker) — gắn cạnh Xưởng lắp ráp, xử lý tác vụ chuyên biệt rồi trả kết quả.
- **Sổ theo dõi giấy phép thiết bị** (License Manager) — lớp phủ toàn nhà máy áp lên Xưởng lắp ráp EC2.
- **Phòng kế toán kỹ thuật** (Compute Optimizer) — lớp phủ giám sát hiệu suất, đề xuất tinh gọn EC2/ASG/Lambda.
- **Phòng kế toán trung tâm** (Budgets, Cost Explorer, CUR, Cost Allocation Tags) — lớp phủ tài chính áp lên toàn bộ nhà máy.
