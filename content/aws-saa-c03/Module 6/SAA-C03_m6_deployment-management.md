# SAA-C03 — Module 6: Vận hành, Bảo mật & Quản trị
## 🔹 Section: Deployment and Management (6.1 – 6.17)

**Domain thi liên quan:** Design Resilient Architectures (26%) + Design Cost-Optimized Architectures (20%) — CloudFormation, Config, Secrets Manager, RPO/RTO là nhóm câu tình huống rất hay gặp ("công ty cần rollback hạ tầng an toàn", "cần audit trạng thái tài nguyên", "chọn chiến lược DR phù hợp ngân sách").

**Danh sách 17 bài trong section:**

| # | Tên bài | Loại |
|---|---|---|
| 6.1 | Introduction | meta |
| 6.2 | Infrastructure as Code with AWS CloudFormation | kỹ thuật |
| 6.3 | [HOL] Creating and Updating Stacks | lab |
| 6.4 | [HOL] Create Nested Stack using the AWS CLI | lab |
| 6.5 | Platform as a Service with AWS Elastic Beanstalk | kỹ thuật |
| 6.6 | [HOL] Create an Elastic Beanstalk Application | lab |
| 6.7 | SSM Parameter Store | kỹ thuật |
| 6.8 | AWS Config | kỹ thuật |
| 6.9 | [HOL] SSM Automation and Config Rules | lab |
| 6.10 | AWS Secrets Manager | kỹ thuật |
| 6.11 | AWS Resource Access Manager | kỹ thuật |
| 6.12 | [HOL] Share a Subnet Across Accounts | lab |
| 6.13 | RPO, RTO, and DR Strategies | kỹ thuật |
| 6.14–6.17 | Exam Cram / Architecture Patterns / Quiz / Cheat Sheets | meta (gộp Cheat Sheet cuối file) |

**Roadmap tiến độ Module 6** (3 section):

- [x] **🔹 Deployment and Management** ← đang học (file này)
- [ ] 🔹 Monitoring, Logging, and Auditing
- [ ] 🔹 Security

---

## 6.2 — Infrastructure as Code with AWS CloudFormation

**1. Khái niệm + ví dụ đời sống**
CloudFormation là dịch vụ IaC (Infrastructure as Code): mô tả toàn bộ hạ tầng (VPC, EC2, RDS, IAM...) trong 1 file YAML/JSON gọi là **template**, AWS tự tạo/sửa/xóa đúng thứ tự phụ thuộc (dependency graph) khi bạn deploy. Ví dụ đời sống: thay vì xây nhà máy bằng tay từng viên gạch (click console), bạn đưa **bản vẽ kỹ thuật** (template) cho nhà thầu (CloudFormation) và họ tự dựng đúng y hệt, lặp lại được ở bất kỳ khu đất nào (region/account khác).

Cơ chế chính:
- **Stack** = 1 lần deploy của 1 template = tập hợp resource được quản lý cùng nhau (tạo/sửa/xóa đồng bộ).
- **Change Set** = xem trước (dry-run) những gì sẽ thay đổi trước khi thực sự update stack — tránh xóa nhầm resource production.
- **Nested Stack** = 1 stack cha gọi nhiều stack con (VD: network-stack, database-stack, app-stack tách riêng nhưng deploy cùng lúc).
- **Drift Detection** = phát hiện khi ai đó sửa tay resource ngoài CloudFormation (console) làm lệch khỏi template gốc.

**2. Lệnh quan trọng**

```bash
aws cloudformation create-stack \
  --stack-name my-vpc-stack \
  --template-body file://vpc.yaml \
  --parameters ParameterKey=EnvType,ParameterValue=prod \
  --capabilities CAPABILITY_NAMED_IAM   # cần khi template tạo IAM role/policy

aws cloudformation update-stack \
  --stack-name my-vpc-stack \
  --template-body file://vpc-v2.yaml

aws cloudformation create-change-set \
  --stack-name my-vpc-stack \
  --change-set-name preview-01 \
  --template-body file://vpc-v2.yaml   # xem trước thay đổi, chưa apply

aws cloudformation execute-change-set \
  --change-set-name preview-01 --stack-name my-vpc-stack

aws cloudformation detect-stack-drift --stack-name my-vpc-stack   # kiểm tra lệch config tay

aws cloudformation delete-stack --stack-name my-vpc-stack
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `create-stack` | — | Tạo mới toàn bộ resource theo template |
| `update-stack` | — | Cập nhật stack đang chạy theo template mới |
| `--template-body` | — | Nội dung template (local file, dùng `file://`) |
| `--capabilities CAPABILITY_NAMED_IAM` | — | Xác nhận cho phép CFN tạo IAM resource có tên tường minh (an toàn: bắt buộc user tự ý thức) |
| `create-change-set` | — | Tạo bản xem trước thay đổi, chưa thi hành |
| `execute-change-set` | — | Thi hành đúng change set đã duyệt |
| `detect-stack-drift` | Drift = trôi dạt | Phát hiện resource bị sửa tay ngoài luồng CFN |
| `delete-stack` | — | Xóa toàn bộ resource trong stack (đúng thứ tự ngược dependency) |

**3. So sánh nhanh**

| Tiêu chí | CloudFormation | Elastic Beanstalk | Terraform (ngoài AWS) |
|---|---|---|---|
| Phạm vi | Toàn bộ resource AWS bất kỳ | Chỉ ứng dụng web (EC2+ELB+ASG+RDS đóng gói sẵn) | Đa cloud (AWS/GCP/Azure) |
| Độ chi tiết | Kiểm soát từng resource | Trừu tượng hóa, ít tùy biến hơn | Kiểm soát chi tiết như CFN |
| State | AWS tự quản (stack) | AWS tự quản | Cần tự quản state file |
| Dùng khi | Hạ tầng phức tạp, nhiều tầng | Deploy nhanh app web đơn giản | Team đã có sẵn multi-cloud |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Số resource / stack | Tối đa 500 | Vượt quá phải tách nested stack |
| Số parameter / template | Tối đa 200 | Ít khi chạm, nhưng cần biết khi template quá lớn |
| Thời gian timeout mặc định | Không giới hạn cứng, tùy `CreationPolicy`/`Timeout` | Nên set `Timeout` cho `WaitCondition`/ASG creation policy |
| Rollback mặc định | Tự rollback khi create thất bại | Có thể tắt bằng `--disable-rollback` (chỉ nên dùng lúc debug) |

**5. Cách dùng nâng cao / pattern thực tế**
Dùng `aws cloudformation validate-template` kết hợp `cfn-lint` trước khi commit — lộ ra lỗi cú pháp/logic (VD tham chiếu resource chưa khai báo) mà console không báo rõ. Case thực tế: 1 startup SaaS B2B có 3 environment (dev/staging/prod) giống hệt nhau — thay vì 3 người click tay 3 lần dễ lệch cấu hình, họ viết 1 template CFN với `Parameters` (EnvType) rồi CI/CD pipeline tự `create-stack`/`update-stack` theo đúng tham số môi trường, đảm bảo dev/staging luôn là bản sao chính xác của prod trước khi release — giảm hẳn lỗi "chạy được ở staging nhưng lỗi ở prod do thiếu 1 Security Group rule".

**6. Cấu hình/thiết lập liên quan**
Template tối giản (`vpc.yaml`):
```yaml
Parameters:
  EnvType:
    Type: String
    AllowedValues: [dev, prod]
Resources:
  MyVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      Tags: [{Key: Env, Value: !Ref EnvType}]
Outputs:
  VpcId:
    Value: !Ref MyVPC
    Export: {Name: !Sub "${EnvType}-vpc-id"}
```
Thực tế cần đụng tới khi: thêm resource mới vào hạ tầng đang chạy (sửa template + `update-stack`), hoặc khi 1 stack khác cần dùng lại VPC này (`Fn::ImportValue` đọc `Export` ở trên) — đây chính là cơ chế nối các nested stack.

**7. Vị trí trong kiến trúc (nhà máy nền)**
CloudFormation **không phải 1 trạm sản xuất** trong nhà máy — nó là **bản vẽ kỹ thuật + đội thi công** dựng lên toàn bộ nhà máy (VPC, xưởng, kho...) đúng theo thiết kế, và có thể dỡ/dựng lại y hệt ở khu đất khác. Đây là trạm MỚI, đứng "phía trên" toàn bộ bản đồ nền — không nằm trong luồng xử lý request của khách hàng, mà là công cụ vận hành/xây dựng nhà máy.

**8. 5 câu hỏi ôn tập**
1. Muốn xem trước thay đổi trước khi apply vào stack production, dùng gì? → **Change Set** (tạo bằng `create-change-set`, review rồi mới `execute-change-set`).
2. Ai đó vào console sửa tay 1 Security Group đang được quản lý bởi CFN — làm sao phát hiện? → `detect-stack-drift`.
3. Vì sao startup SaaS 3 môi trường nên dùng CFN thay vì click tay? → Đảm bảo dev/staging/prod giống hệt nhau, giảm lỗi "chạy được ở staging nhưng lỗi ở prod".
4. Muốn 1 stack khác dùng lại VpcId từ stack VPC gốc mà không hardcode? → Dùng `Outputs` + `Export` ở stack gốc, `Fn::ImportValue` ở stack dùng lại (hoặc Nested Stack).
5. CloudFormation khớp vào trạm nào trong nhà máy nền? → Không khớp trạm sản xuất nào — nó là bản vẽ + đội thi công dựng toàn bộ nhà máy.

---

## 6.5 — Platform as a Service with AWS Elastic Beanstalk

**1. Khái niệm + ví dụ đời sống**
Elastic Beanstalk (EB) là PaaS: bạn chỉ upload code (zip/war/jar), EB tự tạo và quản lý EC2 + Auto Scaling Group + ELB + Security Group + CloudWatch alarm bên dưới. Ví dụ đời sống: thay vì tự mua đất, xây xưởng, tuyển thợ (tự dựng EC2/ASG/ELB), bạn thuê 1 xưởng đóng gói sẵn (managed platform) — chỉ việc bỏ nguyên liệu (code) vào là chạy.

2 kiểu môi trường:
- **Web server environment**: chạy app nhận HTTP request qua ELB.
- **Worker environment**: chạy app xử lý job nền, tự tạo SQS queue để nhận task.

**2. Lệnh quan trọng**

```bash
eb init my-app --platform python-3.9 --region ap-southeast-1   # khởi tạo project EB local
eb create my-env --instance-type t3.micro --elb-type application   # tạo environment mới
eb deploy   # deploy code hiện tại lên environment đang active
eb status   # xem tình trạng environment (health, version đang chạy)
eb logs   # tải log EC2 bên dưới về xem
eb terminate my-env   # xóa environment (giữ lại application)
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `eb init` | Elastic Beanstalk CLI | Khởi tạo cấu hình project local (`.elasticbeanstalk/config.yml`) |
| `--platform` | — | Runtime nền tảng (Python/Node/Java/Docker...) |
| `eb create` | — | Tạo environment mới (kèm hạ tầng bên dưới) |
| `--elb-type application` | — | Chọn ALB thay vì Classic Load Balancer mặc định cũ |
| `eb deploy` | — | Đóng gói code hiện tại, upload, rolling deploy |
| `eb logs` | — | Kéo log từ instance EC2 bên dưới về máy local |

**3. So sánh nhanh**

| Tiêu chí | Elastic Beanstalk | EC2 tự dựng | ECS/Fargate |
|---|---|---|---|
| Quản lý hạ tầng | AWS tự động (ASG/ELB/SG) | Tự làm hết | AWS quản container, bạn quản task |
| Tùy biến | Trung bình (`.ebextensions`) | Toàn quyền | Cao, cần biết Docker |
| Phù hợp | Team nhỏ cần deploy nhanh | Cần tùy biến sâu OS | Kiến trúc microservices |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Số environment / application | Mặc định 200 / region | Có thể tăng qua Service Quota |
| Deployment policy | All at once / Rolling / Rolling with additional batch / Immutable / Traffic splitting | Chọn theo mức chấp nhận downtime |
| Cấu hình mở rộng | Thư mục `.ebextensions/*.config` | Chạy script/cài package thêm lúc provision |

**5. Cách dùng nâng cao / pattern thực tế**
Dùng deployment policy **Immutable** (tạo ASG mới hoàn toàn song song, chuyển traffic khi healthy 100%, xóa ASG cũ) khi cần zero-downtime tuyệt đối cho version mới có thay đổi lớn — an toàn hơn Rolling vì không bao giờ để version cũ/mới chạy chung 1 lúc quá lâu. Case thực tế: 1 team startup 3 người build MVP thương mại điện tử, không đủ người vận hành hạ tầng — dùng EB với `.ebextensions` cài thêm extension PHP cần thiết, deploy bằng `eb deploy` mỗi ngày nhiều lần mà không cần biết chi tiết ASG/ALB bên dưới, để dồn lực làm sản phẩm.

**6. Cấu hình/thiết lập liên quan**
File `.ebextensions/01-packages.config`:
```yaml
packages:
  yum:
    git: []
option_settings:
  aws:autoscaling:asg:
    MinSize: 2
    MaxSize: 6
```
Thực tế cần đụng tới khi: cần cài thêm package OS, set biến môi trường, hoặc chỉnh thông số ASG mà EB console không cho sửa trực tiếp.

**7. Vị trí trong kiến trúc (nhà máy nền)**
Elastic Beanstalk **không phải trạm mới** mà là **combo đóng gói sẵn** của các trạm đã có: Sảnh phân luồng (ALB) + Xưởng lắp ráp trong ASG (EC2) — chỉ khác là bạn không tự dựng từng trạm, EB dựng hộ theo cấu hình mặc định đã tối ưu. Nằm đúng vị trí ALB + ASG trong bản đồ nền, chỉ khác ở cách "xây" (managed) chứ không phải vị trí mới.

**8. 5 câu hỏi ôn tập**
1. Muốn zero-downtime tuyệt đối khi deploy version có thay đổi lớn, chọn deployment policy nào? → **Immutable**.
2. Worker environment trong EB tự tạo thêm resource gì để nhận job? → **SQS queue**.
3. Vì sao startup 3 người chọn EB thay vì tự dựng EC2/ASG/ALB? → Không đủ người vận hành hạ tầng, cần deploy nhanh mà không quản lý chi tiết.
4. Muốn cài thêm package OS lúc EB provision instance, sửa ở đâu? → `.ebextensions/*.config`.
5. EB khớp vào đâu trong nhà máy nền? → Combo đóng gói sẵn của Sảnh phân luồng (ALB) + Xưởng lắp ráp (ASG/EC2), không phải trạm mới.

---

## 6.7 — SSM Parameter Store

**1. Khái niệm + ví dụ đời sống**
AWS Systems Manager Parameter Store là kho lưu **cấu hình + secret dạng key-value** (connection string, API key, feature flag...), có versioning, mã hóa bằng KMS (loại SecureString), và app đọc qua API/CLI thay vì hardcode trong code. Ví dụ đời sống: thay vì dán số điện thoại quan trọng lên tường xưởng (hardcode trong code), bạn ghi vào **sổ tay dùng chung có khóa** (Parameter Store), ai có quyền mới đọc được, và có thể đổi số mà không cần sửa lại toàn bộ giấy tờ trong xưởng.

2 loại tier:
- **Standard** (miễn phí, tối đa 4KB, không throughput cao)
- **Advanced** (trả phí, tối đa 8KB, throughput cao hơn, hỗ trợ policy hết hạn)

**2. Lệnh quan trọng**

```bash
aws ssm put-parameter --name "/prod/db/password" --value "S3cret!" \
  --type SecureString --key-id alias/my-key   # lưu secret có mã hóa KMS

aws ssm get-parameter --name "/prod/db/password" --with-decryption   # đọc + giải mã

aws ssm get-parameters-by-path --path "/prod/db/" --recursive   # đọc cả nhóm theo path

aws ssm delete-parameter --name "/prod/db/password"
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `put-parameter` | — | Ghi 1 parameter mới hoặc version mới |
| `--type SecureString` | — | Mã hóa giá trị bằng KMS khi lưu |
| `--with-decryption` | — | Giải mã khi đọc (cần quyền KMS Decrypt) |
| `get-parameters-by-path` | — | Lấy hàng loạt theo prefix path, dùng cho nhóm config theo môi trường |

**3. So sánh nhanh**

| Tiêu chí | Parameter Store | Secrets Manager |
|---|---|---|
| Chi phí | Miễn phí (Standard tier) | Trả phí theo secret + API call |
| Auto-rotation | Không có sẵn (phải tự viết Lambda) | Có sẵn, tích hợp RDS/Redshift/DocumentDB |
| Dùng cho | Config chung, feature flag, secret ít đổi | Secret cần rotate định kỳ (DB password) |
| Giới hạn kích thước | 4KB (Standard) / 8KB (Advanced) | 64KB |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ý nghĩa | Ghi chú |
|---|---|---|
| Kích thước tối đa | 4KB (Standard), 8KB (Advanced) | Vượt quá phải chuyển Secrets Manager hoặc S3 |
| Số parameter miễn phí | 10,000 / account (Standard) | Advanced tính phí theo tháng |
| Throughput Standard | Giới hạn thấp hơn Advanced | App gọi tần suất cao nên cache lại, không gọi mỗi request |

**5. Cách dùng nâng cao / pattern thực tế**
Dùng path hierarchy (`/{env}/{service}/{key}`) kết hợp IAM policy theo path prefix để 1 team chỉ đọc được `/staging/*` mà không đụng được `/prod/*` — tách quyền theo môi trường mà không cần tạo nhiều Parameter Store riêng. Case thực tế: 1 công ty vận hành nhiều microservice trên EKS, mỗi service đọc config qua path `/prod/order-service/db-host` lúc container khởi động thay vì bake cứng vào Docker image — đổi config (VD endpoint DB mới sau failover) không cần build lại image, chỉ update parameter rồi restart pod.

**6. Cấu hình/thiết lập liên quan**
IAM policy giới hạn theo path:
```json
{
  "Effect": "Allow",
  "Action": ["ssm:GetParameter", "ssm:GetParametersByPath"],
  "Resource": "arn:aws:ssm:*:123456789012:parameter/staging/*"
}
```
Thực tế cần đụng tới khi: onboard 1 service mới cần đọc config runtime, hoặc khi audit thấy 1 role có quyền đọc rộng hơn cần thiết (path không giới hạn).

**7. Vị trí trong kiến trúc (nhà máy nền)**
Parameter Store là **lớp phủ mới** cùng nhóm với "tủ khóa trung tâm" (KMS) trong lớp an ninh — nhưng đóng vai trò **sổ tay cấu hình dùng chung** cho Xưởng lắp ráp (EC2/ASG) và Thợ thời vụ (Lambda) đọc lúc khởi động/chạy, thay vì hardcode. Gắn vào bản đồ ở lớp phủ toàn nhà máy, cạnh KMS.

**8. 5 câu hỏi ôn tập**
1. Muốn lưu password DB có mã hóa, dùng type nào? → `SecureString` (mã hóa bằng KMS).
2. Vì sao service trên EKS nên đọc config qua Parameter Store thay vì bake vào Docker image? → Đổi config không cần build lại image, chỉ update parameter rồi restart.
3. Parameter Store Standard tier giới hạn kích thước bao nhiêu? → 4KB.
4. Muốn 1 team chỉ đọc được config `/staging/*`, làm sao giới hạn? → IAM policy giới hạn `Resource` theo path prefix.
5. Parameter Store khớp vào đâu trong nhà máy nền? → Lớp phủ toàn nhà máy, cạnh KMS — sổ tay cấu hình dùng chung cho các trạm đọc lúc chạy.

---

## 6.8 — AWS Config

**1. Khái niệm + ví dụ đời sống**
AWS Config liên tục ghi lại **trạng thái cấu hình** của resource (VD: Security Group nào đang mở port nào, bucket S3 nào đang public) và so sánh với **rule** bạn định nghĩa (managed hoặc custom Lambda) để phát hiện resource không tuân thủ (non-compliant). Ví dụ đời sống: giống 1 nhân viên kiểm định đi vòng quanh nhà máy mỗi khi có thay đổi, ghi vào sổ nhật ký "cửa xưởng số 5 vừa được mở khóa lúc 3h chiều", và đối chiếu với quy định an toàn để báo động nếu sai.

Khác CloudTrail: CloudTrail ghi **ai gọi API gì** (hành động), Config ghi **trạng thái cấu hình hiện tại + lịch sử thay đổi** (kết quả).

**2. Lệnh quan trọng**

```bash
aws configservice put-configuration-recorder \
  --configuration-recorder name=default,roleARN=arn:aws:iam::123456789012:role/config-role

aws configservice start-configuration-recorder --configuration-recorder-name default

aws configservice put-config-rule --config-rule file://s3-public-read-prohibited.json

aws configservice get-compliance-details-by-config-rule \
  --config-rule-name s3-bucket-public-read-prohibited   # xem resource nào vi phạm
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `put-configuration-recorder` | — | Định nghĩa recorder ghi lại config (resource type nào theo dõi) |
| `start-configuration-recorder` | — | Bật ghi nhận thay đổi |
| `put-config-rule` | — | Thêm 1 rule kiểm tra tuân thủ (managed hoặc custom) |
| `get-compliance-details-by-config-rule` | — | Liệt kê resource NON_COMPLIANT theo rule |

**3. So sánh nhanh**

| Tiêu chí | AWS Config | CloudTrail |
|---|---|---|
| Ghi lại | Trạng thái cấu hình + lịch sử thay đổi | Lệnh API ai gọi, khi nào |
| Mục đích chính | Kiểm tra tuân thủ (compliance), rollback config | Audit hành vi, điều tra sự cố bảo mật |
| Trigger hành động | Có (Auto Remediation qua SSM Automation) | Không tự remediate, chỉ ghi log |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ý nghĩa | Ghi chú |
|---|---|---|
| Config Recorder | 1 recorder / region / account | Ghi theo resource type đã chọn |
| Compliance status | COMPLIANT / NON_COMPLIANT / NOT_APPLICABLE | Trạng thái trả về khi query rule |
| Aggregator | Gộp compliance nhiều account/region | Dùng khi có AWS Organizations |

**5. Cách dùng nâng cao / pattern thực tế**
Gắn **Auto Remediation** (SSM Automation document) vào Config Rule để tự động sửa khi phát hiện vi phạm (VD: tự động chặn public access của S3 bucket ngay khi Config phát hiện `s3-bucket-public-read-prohibited` = NON_COMPLIANT), không cần chờ người review thủ công. Case thực tế: ngân hàng cần chứng minh với kiểm toán rằng mọi EBS volume đều được mã hóa — bật Config rule `encrypted-volumes`, dùng Config Aggregator gộp compliance của tất cả account trong Organization, xuất báo cáo compliance định kỳ cho đội audit mà không cần tự viết script quét thủ công từng account.

**6. Cấu hình/thiết lập liên quan**
Custom rule bằng Lambda (khi managed rule không đủ):
```json
{
  "ConfigRuleName": "custom-tag-check",
  "Source": {
    "Owner": "CUSTOM_LAMBDA",
    "SourceIdentifier": "arn:aws:lambda:...:function:check-tags",
    "SourceDetails": [{"EventSource": "aws.config", "MessageType": "ConfigurationItemChangeNotification"}]
  }
}
```
Thực tế cần đụng tới khi: managed rule có sẵn (~top hundreds) không cover được yêu cầu nội bộ đặc thù (VD bắt buộc tag `CostCenter` trên mọi resource).

**7. Vị trí trong kiến trúc (nhà máy nền)**
AWS Config là **lớp phủ mới** thuộc nhóm camera an ninh cùng GuardDuty, nhưng khác vai trò: GuardDuty phát hiện **kẻ lạ/hành vi bất thường**, còn Config là **nhân viên kiểm định đi kiểm tra cấu hình từng trạm** có đúng chuẩn quy định hay không, ghi lịch sử để đối chiếu khi cần audit.

**8. 5 câu hỏi ôn tập**
1. Config và CloudTrail khác nhau ở điểm nào? → Config ghi trạng thái cấu hình + lịch sử thay đổi; CloudTrail ghi ai gọi API gì.
2. Muốn tự động sửa khi phát hiện S3 bucket bị public, dùng cơ chế gì? → Auto Remediation qua SSM Automation gắn vào Config Rule.
3. Ngân hàng cần gộp compliance nhiều account trong Organization, dùng tính năng nào? → Config Aggregator.
4. Khi managed rule không đủ (VD cần check tag nội bộ), làm sao? → Viết Custom Config Rule bằng Lambda.
5. Config khớp vào đâu trong nhà máy nền? → Lớp phủ an ninh, đóng vai nhân viên kiểm định cấu hình — khác GuardDuty (phát hiện kẻ lạ).

---

## 6.10 — AWS Secrets Manager

**1. Khái niệm + ví dụ đời sống**
Secrets Manager lưu trữ secret (DB password, API key) có mã hóa KMS, và điểm khác biệt lớn nhất so với Parameter Store là **auto-rotation tích hợp sẵn** với RDS/Aurora/Redshift/DocumentDB — tự đổi password định kỳ mà không cần app restart hay người can thiệp. Ví dụ đời sống: giống 1   hộp khóa số tự động đổi mã mỗi tháng, thông báo mã mới trực tiếp cho những ai được cấp quyền, không cần đi dán lại tờ giấy ghi mã cũ.

**2. Lệnh quan trọng**

```bash
aws secretsmanager create-secret --name prod/db/password \
  --secret-string '{"username":"admin","password":"S3cret!"}'

aws secretsmanager get-secret-value --secret-id prod/db/password

aws secretsmanager rotate-secret --secret-id prod/db/password \
  --rotation-lambda-arn arn:aws:lambda:...:function:rotate-rds \
  --rotation-rules AutomaticallyAfterDays=30
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `create-secret` | — | Tạo secret mới (giá trị tự mã hóa bằng KMS) |
| `get-secret-value` | — | Đọc giá trị secret (đã giải mã) |
| `rotate-secret` | — | Bật rotation định kỳ, cần Lambda rotation function |
| `--rotation-rules AutomaticallyAfterDays` | — | Chu kỳ tự đổi secret (số ngày) |

**3. So sánh nhanh**

| Tiêu chí | Secrets Manager | Parameter Store SecureString |
|---|---|---|
| Auto-rotation | Có sẵn, tích hợp RDS/Aurora/Redshift | Không có sẵn |
| Chi phí | ~0.40 USD/secret/tháng + phí API call | Miễn phí (Standard tier) |
| Giới hạn kích thước | 64KB | 4KB/8KB |
| Dùng khi | Secret cần đổi định kỳ, tuân thủ compliance chặt | Config/secret ít thay đổi, muốn tiết kiệm chi phí |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ý nghĩa | Ghi chú |
|---|---|---|
| Kích thước secret tối đa | 64KB | Đủ cho JSON blob credential phức tạp |
| Chi phí | ~0.40 USD/secret/tháng | Cân nhắc khi có hàng nghìn secret nhỏ |
| Cross-region replication | Hỗ trợ sẵn | Dùng cho DR — secret có ở cả region phụ |

**5. Cách dùng nâng cao / pattern thực tế**
Bật **cross-region replica** cho secret quan trọng để khi failover sang region DR, ứng dụng ở region phụ đã có sẵn secret đồng bộ, không phải tạo lại thủ công giữa lúc khẩn cấp. Case thực tế: sàn giao dịch tài chính bắt buộc đổi password DB mỗi 30 ngày theo chính sách bảo mật nội bộ — dùng Secrets Manager với Lambda rotation function tích hợp sẵn cho RDS, tự động đổi password và cập nhật secret mà không gây downtime, thay vì trước đây phải lên lịch bảo trì thủ công mỗi tháng để đổi password tay.

**6. Cấu hình/thiết lập liên quan**
App đọc secret runtime (Python `boto3`):
```python
import boto3, json
client = boto3.client('secretsmanager')
secret = json.loads(client.get_secret_value(SecretId='prod/db/password')['SecretString'])
```
Thực tế cần đụng tới khi: app cần credential DB lúc khởi động thay vì đọc từ biến môi trường tĩnh — đảm bảo luôn lấy giá trị mới nhất sau khi rotation chạy.

**7. Vị trí trong kiến trúc (nhà máy nền)**
Secrets Manager đứng **cùng khu với Parameter Store** trong lớp phủ an ninh — cùng vai trò "sổ tay bí mật" cho Kho tổng (RDS/Aurora) và Xưởng lắp ráp đọc, nhưng có thêm cơ chế **tự động đổi khóa định kỳ** mà Parameter Store không có.

**8. 5 câu hỏi ôn tập**
1. Khác biệt lớn nhất giữa Secrets Manager và Parameter Store SecureString là gì? → Auto-rotation tích hợp sẵn với RDS/Aurora/Redshift.
2. Sàn giao dịch cần đổi password DB mỗi 30 ngày không downtime — giải pháp nào? → Secrets Manager + Lambda rotation function.
3. Muốn secret sẵn sàng ở region DR khi failover, dùng tính năng gì? → Cross-region replication.
4. Kích thước secret tối đa Secrets Manager hỗ trợ? → 64KB.
5. Secrets Manager khớp vào đâu trong nhà máy nền? → Cùng khu Parameter Store trong lớp phủ an ninh, sổ tay bí mật có tự đổi khóa định kỳ.

---

## 6.11 — AWS Resource Access Manager

**1. Khái niệm + ví dụ đời sống**
AWS RAM (Resource Access Manager) cho phép **chia sẻ resource giữa nhiều account** (trong cùng Organization hoặc account bất kỳ) mà không cần tạo bản sao — VD chia sẻ 1 subnet, Transit Gateway, hay license. Ví dụ đời sống: thay vì mỗi phòng ban tự xây riêng 1 con đường vào khu công nghiệp (duplicate hạ tầng ở mỗi account), công ty xây **1 con đường chung** (subnet/TGW) và cấp quyền đi lại cho các phòng ban khác dùng chung, tiết kiệm đất và chi phí xây dựng.

**2. Lệnh quan trọng**

```bash
aws ram create-resource-share --name shared-subnet \
  --resource-arns arn:aws:ec2:ap-southeast-1:111111111111:subnet/subnet-abc123 \
  --principals 222222222222   # chia sẻ với account cụ thể

aws ram associate-resource-share --resource-share-arn arn:aws:ram:...:resource-share/xxx \
  --principals arn:aws:organizations::111111111111:ou/o-xxx/ou-yyy   # chia sẻ theo OU

aws ram get-resource-shares --resource-owner SELF   # xem các share mình đang chủ

aws ram accept-resource-share-invitation --resource-share-invitation-arn arn:...
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `create-resource-share` | RAM = Resource Access Manager | Tạo 1 resource share mới |
| `--principals` | — | Account ID / OU ARN / Organization ARN được cấp quyền dùng chung |
| `associate-resource-share` | — | Gắn thêm principal hoặc resource vào share đã có |
| `accept-resource-share-invitation` | — | Account nhận share (ngoài Organization) phải accept thủ công |

**3. So sánh nhanh**

| Tiêu chí | RAM | VPC Peering |
|---|---|---|
| Chia sẻ gì | Subnet, TGW, license, resource cụ thể | Kết nối network giữa 2 VPC |
| Trong cùng Organization | Không cần accept thủ công | Vẫn cần accept peering request |
| Loại tài nguyên | Đa dạng (subnet, TGW, License Manager, Route 53 Resolver rule...) | Chỉ network layer |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ý nghĩa | Ghi chú |
|---|---|---|
| Trong cùng AWS Organization | Tự động share, không cần accept | Bật "Enable sharing with AWS Organizations" trước |
| Ngoài Organization | Cần account nhận `accept-resource-share-invitation` | Bảo mật hơn, tránh share nhầm |
| Loại resource hỗ trợ | Subnet, TGW, License Manager, Route 53 Resolver rule, RDS snapshot... | Danh sách mở rộng theo thời gian, cần verify với dịch vụ cụ thể |

**5. Cách dùng nâng cao / pattern thực tế**
Share 1 **Transit Gateway** trung tâm từ account network-hub cho toàn bộ account con trong Organization, để mỗi team tự quản account riêng (dev/staging/prod tách biệt IAM) nhưng vẫn dùng chung 1 network backbone — không phải mỗi team tự tạo TGW riêng gây tốn phí và khó quản lý routing tổng thể. Case thực tế: tập đoàn có nhiều BU (business unit), mỗi BU 1 AWS account riêng để cô lập billing/security, nhưng cần dùng chung 1 subnet trong VPC trung tâm để đặt shared services (VD Active Directory) — dùng RAM share subnet đó cho các account BU thay vì mỗi BU tự dựng lại AD riêng.

**6. Cấu hình/thiết lập liên quan**
Bật share tự động trong Organization (1 lần, ở management account):
```bash
aws ram enable-sharing-with-aws-organization
```
Thực tế cần đụng tới khi: công ty mới áp dụng multi-account strategy (AWS Organizations) và muốn tập trung hóa 1 số resource dùng chung thay vì duplicate ở từng account.

**7. Vị trí trong kiến trúc (nhà máy nền)**
RAM là **trạm mới** đóng vai trò "hợp đồng cho thuê chung" — không nằm trong luồng xử lý request, mà là cơ chế cho phép **nhiều nhà máy (account) khác nhau dùng chung 1 phần hạ tầng** (khuôn viên VPC/subnet, hoặc đường trục Transit Gateway) mà không cần xây trùng lặp. Gắn cạnh AWS Organizations trong lớp quản trị multi-account.

**8. 5 câu hỏi ôn tập**
1. RAM dùng để làm gì khác với VPC Peering? → Chia sẻ resource cụ thể (subnet, TGW, license...) chứ không chỉ kết nối network giữa 2 VPC.
2. Trong cùng AWS Organization, account nhận share có cần accept thủ công không? → Không, tự động share nếu đã bật `enable-sharing-with-aws-organization`.
3. Tập đoàn nhiều BU muốn dùng chung 1 subnet đặt Active Directory — giải pháp nào? → RAM share subnet đó cho các account BU.
4. Muốn share Transit Gateway cho toàn bộ account con, làm gì trước? → Bật sharing với AWS Organizations, rồi `create-resource-share` với TGW.
5. RAM khớp vào đâu trong nhà máy nền? → Trạm mới, "hợp đồng cho thuê chung" hạ tầng giữa các account, cạnh AWS Organizations.

---

## 6.13 — RPO, RTO, and DR Strategies

**1. Khái niệm + ví dụ đời sống**
- **RPO (Recovery Point Objective)**: lượng dữ liệu tối đa chấp nhận mất khi có sự cố, tính bằng thời gian (VD "RPO 1 giờ" = chấp nhận mất tối đa 1 giờ dữ liệu gần nhất).
- **RTO (Recovery Time Objective)**: thời gian tối đa chấp nhận hệ thống ngừng hoạt động trước khi phục hồi xong.

Ví dụ đời sống: RPO giống "bạn save file Word lần cuối lúc nào" (mất bao nhiêu công việc nếu máy tắt đột ngột), RTO giống "bạn mất bao lâu để mở lại máy tính mới và tiếp tục làm việc".

4 chiến lược DR (từ rẻ/chậm → đắt/nhanh):
- **Backup and Restore**: chỉ backup định kỳ, phục hồi khi có sự cố → RPO/RTO cao (giờ-ngày), rẻ nhất.
- **Pilot Light**: hạ tầng core (DB) chạy sẵn ở region phụ với dữ liệu sync, phần compute tắt sẵn → RTO trung bình (phút-giờ).
- **Warm Standby**: bản sao thu nhỏ chạy sẵn toàn bộ stack ở region phụ, scale lên khi failover → RTO thấp hơn (phút).
- **Multi-site Active/Active**: chạy song song đầy đủ ở 2+ region, traffic chia đều → RPO/RTO gần bằng 0, đắt nhất.

**2. Lệnh quan trọng**
(Bài này chủ yếu là khái niệm chiến lược, không có lệnh CLI riêng — các lệnh liên quan nằm ở dịch vụ cụ thể triển khai DR như RDS cross-region read replica, S3 CRR, Route 53 failover routing.)

```bash
aws rds create-db-instance-read-replica \
  --db-instance-identifier prod-db-replica-dr \
  --source-db-instance-identifier prod-db \
  --source-region ap-southeast-1 --region us-east-1   # dùng cho Pilot Light/Warm Standby

aws route53 change-resource-record-sets --hosted-zone-id Z123 \
  --change-batch file://failover-policy.json   # định tuyến failover khi region chính chết
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `RPO` | Recovery Point Objective | Mốc dữ liệu tối đa chấp nhận mất |
| `RTO` | Recovery Time Objective | Thời gian tối đa chấp nhận downtime |
| `create-db-instance-read-replica` (cross-region) | — | Cơ chế đồng bộ dữ liệu sang region DR |
| `route53 failover routing` | — | Tự chuyển traffic sang region phụ khi health check region chính fail |

**3. So sánh nhanh**

| Chiến lược | RPO | RTO | Chi phí | Ví dụ dịch vụ |
|---|---|---|---|---|
| Backup and Restore | Vài giờ | Vài giờ–ngày | $ (thấp nhất) | S3 + AWS Backup |
| Pilot Light | Vài phút | Vài chục phút | $$ | RDS cross-region replica (DB chạy, app tắt) |
| Warm Standby | Vài giây–phút | Vài phút | $$$ | Full stack thu nhỏ chạy sẵn ở region phụ |
| Multi-site Active/Active | ~0 | ~0 | $$$$ (cao nhất) | Route 53 weighted/latency routing 2 region |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| RPO = 0 | Chỉ đạt được với Multi-site Active/Active + đồng bộ đồng thời | Chi phí rất cao, ít công ty cần thật sự |
| Trade-off chính | RTO/RPO càng thấp → chi phí càng cao | Câu thi hay hỏi "chọn chiến lược rẻ nhất đáp ứng RTO X giờ" |

**5. Cách dùng nâng cao / pattern thực tế**
Đề thi SAA-C03 thường cho 1 con số RTO/RPO cụ thể (VD "RTO tối đa 15 phút, ngân sách hạn chế") — pattern trả lời đúng là chọn chiến lược **rẻ nhất vẫn đáp ứng đủ** con số đó, không tự động chọn Active/Active vì nó luôn đắt nhất. Case thực tế: 1 công ty bảo hiểm có hệ thống core ít traffic nhưng luật bắt buộc RPO tối đa 5 phút (không được mất giao dịch) — chọn **Pilot Light** với RDS cross-region read replica đồng bộ liên tục (đáp ứng RPO thấp), nhưng chấp nhận RTO ~30 phút (đủ thời gian scale compute lên) để tránh chi phí Warm Standby/Active-Active không cần thiết.

**6. Cấu hình/thiết lập liên quan**
Route 53 health check + failover record (JSON):
```json
{
  "Type": "A", "SetIdentifier": "primary", "Failover": "PRIMARY",
  "AliasTarget": {"HostedZoneId": "Z1...", "DNSName": "primary-alb.ap-southeast-1.elb.amazonaws.com"},
  "HealthCheckId": "abcd-1234"
}
```
Thực tế cần đụng tới khi: đã có hạ tầng DR ở region phụ, cần cơ chế tự động chuyển traffic (không phải sửa DNS tay lúc khẩn cấp).

**7. Vị trí trong kiến trúc (nhà máy nền)**
RPO/RTO/DR Strategies không phải 1 trạm cụ thể mà là **bản kế hoạch dự phòng cho toàn bộ nhà máy** — mô tả "nếu nhà máy chính (region) cháy, nhà máy phụ (region DR) tiếp quản nhanh đến đâu, mất bao nhiêu hàng tồn (dữ liệu)". Route 53 (trạm bảo vệ cổng) đóng vai trò chuyển hướng khách sang nhà máy phụ khi cần.

**8. 5 câu hỏi ôn tập**
1. RPO đo cái gì, RTO đo cái gì? → RPO = lượng dữ liệu tối đa chấp nhận mất; RTO = thời gian tối đa chấp nhận downtime.
2. Công ty bảo hiểm cần RPO 5 phút, ngân sách hạn chế — chọn chiến lược nào? → **Pilot Light** (DB sync liên tục, compute tắt sẵn, RTO chấp nhận cao hơn).
3. Chiến lược nào đạt RPO/RTO gần bằng 0 nhưng đắt nhất? → **Multi-site Active/Active**.
4. Cơ chế nào tự động chuyển traffic sang region DR khi region chính fail health check? → Route 53 Failover routing policy.
5. Nguyên tắc chọn chiến lược DR khi đề thi cho sẵn RTO/RPO cụ thể? → Chọn chiến lược **rẻ nhất vẫn đáp ứng đủ** con số yêu cầu, không mặc định chọn phương án đắt nhất.

---

## 🧪 BƯỚC 1.5 — Lab tổng: Deploy & Quản trị hạ tầng như 1 kỹ sư mới vào công ty

🧭 **Bối cảnh:** Bạn vừa vào 1 startup, được giao nhiệm vụ tuần đầu: dựng hạ tầng web bằng IaC, deploy 1 app mẫu qua Elastic Beanstalk, thiết lập config/secret tập trung, bật audit compliance, và chia sẻ 1 subnet cho account team khác dùng chung — đúng thứ tự 1 kỹ sư thật sẽ làm.

```bash
# ===== BƯỚC 1: Tạo VPC bằng CloudFormation (bài 6.2/6.3) =====
cat > vpc.yaml << 'EOF'
Parameters:
  EnvType: {Type: String, Default: dev}
Resources:
  MyVPC:
    Type: AWS::EC2::VPC
    Properties: {CidrBlock: 10.0.0.0/16, Tags: [{Key: Env, Value: !Ref EnvType}]}
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties: {VpcId: !Ref MyVPC, CidrBlock: 10.0.1.0/24, AvailabilityZone: !Select [0, !GetAZs '']}
Outputs:
  VpcId: {Value: !Ref MyVVPC, Export: {Name: dev-vpc-id}}
  SubnetId: {Value: !Ref PublicSubnet, Export: {Name: dev-subnet-id}}
EOF
aws cloudformation create-stack --stack-name dev-network --template-body file://vpc.yaml
aws cloudformation wait stack-create-complete --stack-name dev-network   # đợi tạo xong trước khi qua bước sau

# ===== BƯỚC 2: Update stack bằng Change Set — thử thêm 1 subnet nữa (bài 6.3) =====
aws cloudformation create-change-set --stack-name dev-network \
  --change-set-name add-second-subnet --template-body file://vpc-v2.yaml
aws cloudformation describe-change-set --stack-name dev-network --change-set-name add-second-subnet
# review kỹ trước khi execute — tránh xóa nhầm resource
aws cloudformation execute-change-set --stack-name dev-network --change-set-name add-second-subnet

# ===== BƯỚC 3: Nested stack — tách network ra làm module riêng (bài 6.4) =====
aws s3 cp vpc.yaml s3://my-cfn-templates-bucket/vpc.yaml   # nested stack cần template nằm trên S3
cat > root-stack.yaml << 'EOF'
Resources:
  NetworkStack:
    Type: AWS::CloudFormation::Stack
    Properties: {TemplateURL: https://my-cfn-templates-bucket.s3.amazonaws.com/vpc.yaml}
EOF
aws cloudformation create-stack --stack-name root-app-stack --template-body file://root-stack.yaml

# ===== BƯỚC 4: Deploy app mẫu bằng Elastic Beanstalk (bài 6.5/6.6) =====
eb init my-app --platform python-3.9 --region ap-southeast-1
eb create dev-env --instance-type t3.micro --elb-type application
eb deploy
eb status   # verify environment Health = Green

# ===== BƯỚC 5: Đưa config/secret ra khỏi code (bài 6.7/6.10) =====
aws ssm put-parameter --name "/dev/app/log-level" --value "INFO" --type String
aws secretsmanager create-secret --name dev/db/password \
  --secret-string '{"username":"admin","password":"TempPass123!"}'
# app đọc 2 giá trị này lúc khởi động thay vì hardcode trong .env commit lên git

# ===== BƯỚC 6: Bật audit compliance + auto-remediation (bài 6.8/6.9) =====
aws configservice put-configuration-recorder \
  --configuration-recorder name=default,roleARN=arn:aws:iam::123456789012:role/config-role
aws configservice start-configuration-recorder --configuration-recorder-name default
aws configservice put-config-rule --config-rule file://s3-public-read-prohibited.json
# nếu có bucket public → Config đánh dấu NON_COMPLIANT, gắn SSM Automation để tự remediate

# ===== BƯỚC 7: Chia sẻ subnet cho account team khác (bài 6.11/6.12) =====
aws ram create-resource-share --name shared-dev-subnet \
  --resource-arns arn:aws:ec2:ap-southeast-1:123456789012:subnet/subnet-abc123 \
  --principals 222222222222

# ===== VERIFY =====
aws cloudformation describe-stacks --stack-name dev-network --query 'Stacks[0].StackStatus'
eb status
aws ssm get-parameter --name "/dev/app/log-level"
aws configservice get-compliance-details-by-config-rule --config-rule-name s3-bucket-public-read-prohibited
aws ram get-resource-shares --resource-owner SELF

# ===== CLEANUP (đúng thứ tự ngược để tránh lỗi dependency) =====
aws ram delete-resource-share --resource-share-arn <arn-từ-bước-7>
aws configservice stop-configuration-recorder --configuration-recorder-name default
aws configservice delete-config-rule --config-rule-name s3-bucket-public-read-prohibited
aws secretsmanager delete-secret --secret-id dev/db/password --force-delete-without-recovery
aws ssm delete-parameter --name "/dev/app/log-level"
eb terminate dev-env
aws cloudformation delete-stack --stack-name root-app-stack
aws cloudformation delete-stack --stack-name dev-network
```

**⚠️ Lưu ý dễ sai/dễ tốn phí:**
- Nested stack (`AWS::CloudFormation::Stack`) **bắt buộc** template con nằm trên S3 (không dùng `file://` trực tiếp như stack gốc) — quên bước upload S3 là lỗi hay gặp nhất.
- `eb create` mặc định tạo ELB + NAT Gateway (nếu VPC riêng) — NAT Gateway tính phí theo giờ dù không dùng, nhớ `eb terminate` ngay sau khi test xong.
- `secretsmanager delete-secret` mặc định giữ lại 7-30 ngày (recovery window) trước khi xóa hẳn — dùng `--force-delete-without-recovery` khi chắc chắn không cần khôi phục, tránh bị tính phí "ẩn" vì secret vẫn tồn tại trong thời gian chờ xóa.
- Xóa stack cha (nested) trước sẽ tự xóa stack con — không cần xóa tay stack con riêng, xóa tay dễ gây lỗi "stack đang được reference".

---

## 📋 Cheat Sheet — Deployment and Management (gộp Exam Cram + Architecture Patterns + Meta)

**Exam Cram nhanh:**
- CloudFormation = IaC toàn bộ resource; Elastic Beanstalk = PaaS chỉ cho web app, tự dựng ASG/ELB bên dưới.
- Change Set = xem trước thay đổi trước khi apply — luôn nhớ khi câu hỏi nhắc "tránh downtime/xóa nhầm khi update stack".
- Parameter Store: rẻ, không auto-rotate. Secrets Manager: có phí, auto-rotate tích hợp RDS/Aurora.
- AWS Config: trạng thái cấu hình + compliance. CloudTrail: ai gọi API gì. Đừng nhầm 2 dịch vụ này trong câu hỏi audit.
- RAM: chia sẻ resource giữa account, không cần duplicate hạ tầng — hay đi cùng AWS Organizations trong câu hỏi multi-account.
- DR: 4 chiến lược theo thang chi phí/RTO-RPO — Backup&Restore → Pilot Light → Warm Standby → Multi-site Active/Active. Luôn chọn phương án **rẻ nhất đáp ứng đủ yêu cầu**.

**Architecture Patterns hay gặp:**
- Multi-environment (dev/staging/prod) đồng nhất → CloudFormation với Parameters theo env.
- Microservices đọc config runtime → Parameter Store theo path hierarchy `/{env}/{service}/{key}`.
- Compliance audit toàn Organization → AWS Config + Aggregator.
- Multi-account chia sẻ network → RAM share subnet/Transit Gateway.
- DR cho hệ thống RPO thấp/ngân sách vừa phải → Pilot Light với cross-region read replica.

**Quiz tổng hợp (đại diện, xem đủ 5 câu/bài ở từng mục trên):** trọng tâm ôn là phân biệt Config vs CloudTrail, Parameter Store vs Secrets Manager, và chọn đúng chiến lược DR theo RTO/RPO cho sẵn.

---

## 🏭 Trạm mới thêm vào nhà máy nền ở section này

- **CloudFormation** — bản vẽ kỹ thuật + đội thi công dựng toàn bộ nhà máy (không nằm trong luồng xử lý request, là công cụ vận hành/xây dựng).
- **Elastic Beanstalk** — không phải trạm mới, là combo đóng gói sẵn của Sảnh phân luồng (ALB) + Xưởng lắp ráp (ASG/EC2).
- **SSM Parameter Store** + **Secrets Manager** — lớp phủ "sổ tay cấu hình/bí mật" dùng chung, cạnh KMS trong lớp an ninh; Secrets Manager có thêm cơ chế tự đổi khóa định kỳ.
- **AWS Config** — lớp phủ an ninh, nhân viên kiểm định cấu hình (khác GuardDuty là đội tuần tra phát hiện kẻ lạ).
- **AWS RAM** — trạm mới, "hợp đồng cho thuê chung" hạ tầng giữa các account, cạnh AWS Organizations.
- **RPO/RTO/DR Strategies** — không phải trạm, là bản kế hoạch dự phòng toàn nhà máy (nhà máy phụ ở region DR), Route 53 đóng vai chuyển hướng khách khi cần.
