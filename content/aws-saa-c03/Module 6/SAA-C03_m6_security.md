# SAA-C03 — Module 6: Vận hành, Bảo mật & Quản trị
## 🔹 Section: Security (6.32 – 6.52)

**Domain thi liên quan:** Design Secure Architectures (30% — nặng nhất trong 4 domain) — Identity Federation, KMS vs CloudHSM, WAF vs Shield, GuardDuty vs Macie là nhóm câu hỏi tình huống dày đặc nhất trong đề thi thật.

**Danh sách 21 bài trong section:**

| # | Tên bài | Loại |
|---|---|---|
| 6.32 | Introduction | meta |
| 6.33 | AWS Directory Service | kỹ thuật |
| 6.34 | Identity Providers and Federation | kỹ thuật |
| 6.35 | [HOL] IAM Identity Center in Action | lab |
| 6.36 | Amazon Cognito | kỹ thuật |
| 6.37 | Encryption Primer | kỹ thuật |
| 6.38 | AWS Key Management Service (KMS) | kỹ thuật |
| 6.39 | [HOL] Encrypt and Decrypt Data with AWS KMS | lab |
| 6.40 | AWS CloudHSM | kỹ thuật |
| 6.41 | AWS Certificate Manager | kỹ thuật |
| 6.42 | [HOL] SSL/TLS Certificate in ACM | lab |
| 6.43 | AWS Web Application Firewall (WAF) | kỹ thuật |
| 6.44 | Amazon Inspector | kỹ thuật |
| 6.45 | Amazon Macie | kỹ thuật |
| 6.46 | AWS GuardDuty | kỹ thuật |
| 6.47 | AWS Shield | kỹ thuật |
| 6.48 | Defense In-Depth | kỹ thuật |
| 6.49–6.52 | Exam Cram / Architecture Patterns / Quiz / Cheat Sheets | meta (gộp Cheat Sheet cuối file) |

**Roadmap tiến độ Module 6** (3 section — **hoàn tất Module 6 sau file này**):

- [x] ✅ 🔹 Deployment and Management
- [x] ✅ 🔹 Monitoring, Logging, and Auditing
- [x] **🔹 Security** ← đang học (file này)

---

## 6.33 — AWS Directory Service

**1. Khái niệm + ví dụ đời sống**
AWS Directory Service cung cấp Microsoft Active Directory (AD) managed trên AWS, dùng khi công ty đã có hệ sinh thái Windows/AD on-premise cần mở rộng lên cloud. Ví dụ đời sống: giống 1 "sổ hộ khẩu trung tâm" của toàn nhà máy — biết ai thuộc phòng ban nào, có quyền vào khu nào — thay vì mỗi xưởng tự lập danh sách riêng.

3 loại:
- **AWS Managed Microsoft AD**: AD thật đầy đủ tính năng, AWS quản lý domain controller.
- **AD Connector**: proxy kết nối tới AD on-premise sẵn có, không lưu trữ dữ liệu user trên AWS.
- **Simple AD**: AD tương thích cơ bản (Samba), rẻ, ít tính năng, phù hợp nhu cầu nhỏ.

**2. Lệnh quan trọng**

```bash
aws ds create-microsoft-ad --name corp.example.com \
  --password 'P@ssw0rd123' --vpc-settings VpcId=vpc-abc,SubnetIds=subnet-1,subnet-2

aws ds connect-directory --name corp.example.com \
  --connect-settings VpcId=vpc-abc,SubnetIds=subnet-1,subnet-2,\
CustomerDnsIps=10.0.0.5,CustomerUserName=admin   # AD Connector nối AD on-premise

aws ds describe-directories   # xem trạng thái directory đang có
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `create-microsoft-ad` | Directory Service | Tạo AWS Managed Microsoft AD |
| `connect-directory` | — | Tạo AD Connector proxy tới AD on-premise |
| `--vpc-settings` | — | VPC + subnet nơi domain controller đặt |
| `describe-directories` | — | Liệt kê trạng thái các directory |

**3. So sánh nhanh**

| Tiêu chí | Managed Microsoft AD | AD Connector | Simple AD |
|---|---|---|---|
| Dữ liệu user | Lưu trên AWS | Vẫn ở on-premise (proxy) | Lưu trên AWS |
| Tính năng | Đầy đủ AD thật | Phụ thuộc AD gốc | Cơ bản (Samba) |
| Dùng khi | Cần AD độc lập trên cloud | Đã có AD on-premise, chỉ cần cầu nối | Nhu cầu nhỏ, tiết kiệm chi phí |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ý nghĩa | Ghi chú |
|---|---|---|
| AD Connector | Không lưu trữ credential trên AWS | Phù hợp yêu cầu compliance "dữ liệu user không rời khỏi on-premise" |
| Simple AD | Không hỗ trợ trust relationship, MFA nâng cao | Giới hạn hơn Managed AD thật |

**5. Cách dùng nâng cao / pattern thực tế**
Dùng **AD Connector** khi công ty có chính sách bảo mật bắt buộc dữ liệu nhân sự/credential không được rời khỏi datacenter nội bộ — AD Connector chỉ đóng vai trò proxy xác thực, không sao chép dữ liệu user lên AWS. Case thực tế: 1 ngân hàng đã có AD on-premise quản lý toàn bộ nhân viên, khi migrate ứng dụng nội bộ lên AWS (EC2 chạy Windows) cần nhân viên đăng nhập bằng đúng tài khoản AD cũ — dùng AD Connector nối vào AD on-premise, không cần đồng bộ/duplicate user database lên cloud, vẫn tuân thủ chính sách compliance.

**6. Cấu hình/thiết lập liên quan**
Yêu cầu network: AD on-premise cần kết nối VPN/Direct Connect tới VPC trước khi tạo AD Connector. Thực tế cần đụng tới khi: bắt đầu dự án hybrid identity, phải đảm bảo route network thông trước khi cấu hình Directory Service.

**7. Vị trí trong kiến trúc (nhà máy nền)**
AWS Directory Service là **lớp phủ mới** thuộc nhóm "thẻ ra vào" (IAM) — nhưng thay vì AWS tự quản danh sách nhân viên, nó là **sổ hộ khẩu trung tâm kiểu Windows/AD** dùng khi công ty đã có hệ thống nhân sự AD từ trước, đứng cạnh IAM trong lớp phủ an ninh.

**8. 5 câu hỏi ôn tập**
1. AD Connector khác Managed Microsoft AD ở điểm nào? → AD Connector chỉ proxy, không lưu dữ liệu user trên AWS.
2. Ngân hàng cần dùng lại tài khoản AD cũ mà không duplicate dữ liệu lên cloud, chọn gì? → AD Connector.
3. Loại nào rẻ nhất, ít tính năng nhất? → Simple AD.
4. AD Connector cần điều kiện network gì trước khi tạo? → VPN/Direct Connect thông tới AD on-premise.
5. Directory Service khớp vào đâu trong nhà máy nền? → Lớp phủ an ninh, cạnh IAM — sổ hộ khẩu kiểu AD.

---

## 6.34 — Identity Providers and Federation

**1. Khái niệm + ví dụ đời sống**
Federation cho phép người dùng đăng nhập bằng danh tính đã có sẵn ở nơi khác (Identity Provider — IdP như Active Directory, Google, Okta) để lấy quyền tạm thời vào AWS, thay vì tạo IAM User riêng cho từng người. Ví dụ đời sống: giống dùng **thẻ ra vào của công ty mẹ** để vào thăm 1 chi nhánh khác, thay vì phải làm 1 thẻ ra vào mới cho mỗi chi nhánh.

2 kiểu chính:
- **SAML 2.0 Federation**: dùng cho enterprise identity (AD, Okta) — trả về SAML assertion, đổi lấy temporary credentials qua STS.
- **Web Identity Federation / OIDC**: dùng cho ứng dụng consumer (đăng nhập bằng Google/Facebook) — thường qua Cognito Identity Pool.

**2. Lệnh quan trọng**

```bash
aws iam create-saml-provider --name CorpADFederation \
  --saml-metadata-document file://adfs-metadata.xml

aws sts assume-role-with-saml \
  --role-arn arn:aws:iam::123456789012:role/FederatedRole \
  --principal-arn arn:aws:iam::123456789012:saml-provider/CorpADFederation \
  --saml-assertion file://assertion.xml   # đổi SAML assertion lấy temp credentials

aws sts assume-role-with-web-identity \
  --role-arn arn:aws:iam::123456789012:role/WebAppRole \
  --role-session-name app-session --web-identity-token file://google-token.jwt
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `create-saml-provider` | SAML = Security Assertion Markup Language | Đăng ký IdP enterprise (AD/Okta) với IAM |
| `assume-role-with-saml` | STS = Security Token Service | Đổi SAML assertion lấy AWS temp credentials |
| `assume-role-with-web-identity` | OIDC = OpenID Connect | Đổi token từ Google/Facebook lấy AWS temp credentials |

**3. So sánh nhanh**

| Tiêu chí | SAML Federation | Web Identity Federation |
|---|---|---|
| Dùng cho | Nhân viên nội bộ (AD/Okta) | Người dùng cuối ứng dụng (mobile/web app) |
| IdP điển hình | Active Directory, Okta, ADFS | Google, Facebook, Amazon, Apple |
| Thường đi kèm | IAM Identity Center | Amazon Cognito Identity Pool |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ý nghĩa | Ghi chú |
|---|---|---|
| Temporary credentials | Hết hạn sau khoảng thời gian cấu hình (thường 1h, tối đa tùy role) | Không bao giờ là credentials vĩnh viễn — điểm khác biệt cốt lõi với IAM User |
| Nguyên tắc chính | Không tạo IAM User cho từng nhân viên khi đã có IdP | Best practice bảo mật, giảm quản lý credential rải rác |

**5. Cách dùng nâng cao / pattern thực tế**
Federation loại bỏ hoàn toàn nhu cầu tạo IAM User cho hàng nghìn nhân viên — thay vào đó, IAM Role + trust policy với IdP là đủ, giảm rủi ro rò rỉ access key dài hạn. Case thực tế: 1 tập đoàn 5000 nhân viên có AD nội bộ, dùng SAML Federation qua IAM Identity Center để nhân viên login 1 lần (SSO) vào AD, tự động có quyền truy cập đúng theo group AD (VD nhóm "DevOps" tự có quyền EC2, nhóm "Finance" tự có quyền Cost Explorer) — không ai cần IAM User riêng, khi nhân viên nghỉ việc chỉ cần vô hiệu hóa ở AD là mất quyền AWS ngay lập tức.

**6. Cấu hình/thiết lập liên quan**
Trust policy của Role cho phép SAML provider assume:
```json
{"Effect": "Allow", "Principal": {"Federated": "arn:aws:iam::123456789012:saml-provider/CorpADFederation"},
 "Action": "sts:AssumeRoleWithSAML", "Condition": {"StringEquals": {"SAML:aud": "https://signin.aws.amazon.com/saml"}}}
```
Thực tế cần đụng tới khi: setup SSO lần đầu giữa AD/Okta và AWS, cần khớp đúng metadata giữa 2 bên.

**7. Vị trí trong kiến trúc (nhà máy nền)**
Federation là **lớp phủ mới** cùng nhóm IAM — đóng vai "cổng công nhận thẻ ra vào của công ty đối tác", cho phép người có thẻ ở nơi khác (IdP ngoài) vào nhà máy mà không cần cấp thẻ ra vào riêng (IAM User) cho từng người.

**8. 5 câu hỏi ôn tập**
1. Federation giải quyết vấn đề gì so với tạo IAM User cho từng nhân viên? → Không cần tạo/quản lý credential riêng cho hàng nghìn người, giảm rủi ro rò rỉ access key.
2. SAML Federation dùng cho ai, Web Identity Federation dùng cho ai? → SAML: nhân viên nội bộ (AD/Okta); Web Identity: người dùng cuối app (Google/Facebook).
3. Khi nhân viên nghỉ việc, cách nào tắt quyền AWS nhanh nhất khi dùng Federation? → Vô hiệu hóa tài khoản ở AD/IdP gốc, quyền AWS mất theo ngay.
4. Đổi SAML assertion lấy temp credentials dùng lệnh STS nào? → assume-role-with-saml.
5. Federation khớp vào đâu trong nhà máy nền? → Lớp phủ IAM, cổng công nhận thẻ ra vào của công ty đối tác.

---

## 6.36 — Amazon Cognito

**1. Khái niệm + ví dụ đời sống**
Cognito quản lý xác thực người dùng cuối cho ứng dụng mobile/web (không phải nhân viên nội bộ). Gồm 2 thành phần độc lập:
- **User Pool**: quản lý danh tính người dùng (đăng ký, đăng nhập, MFA, quên mật khẩu) — trả về JWT token.
- **Identity Pool**: đổi JWT token (từ User Pool hoặc IdP ngoài như Google) lấy **temporary AWS credentials** để app gọi trực tiếp AWS service (VD upload thẳng lên S3 từ mobile app).

Ví dụ đời sống: User Pool giống **quầy lễ tân cấp thẻ khách** cho khách vãng lai (không phải nhân viên), Identity Pool giống **đổi thẻ khách đó lấy chìa khóa tạm thời** vào đúng khu vực khách được phép dùng.

**2. Lệnh quan trọng**

```bash
aws cognito-idp create-user-pool --pool-name my-app-users \
  --policies file://password-policy.json --mfa-configuration OPTIONAL

aws cognito-idp sign-up --client-id abc123 --username alice@example.com \
  --password 'P@ssw0rd1' --user-attributes Name=email,Value=alice@example.com

aws cognito-identity create-identity-pool --identity-pool-name my_app_identity \
  --allow-unauthenticated-identities \
  --cognito-identity-providers ProviderName=cognito-idp.ap-southeast-1.amazonaws.com/us-east-1_abc,ClientId=abc123
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `create-user-pool` | — | Tạo kho quản lý danh tính người dùng |
| `--mfa-configuration` | — | Bật MFA (OFF/OPTIONAL/ON) cho user pool |
| `sign-up` | — | Người dùng tự đăng ký tài khoản |
| `create-identity-pool` | — | Tạo pool đổi token → temp AWS credentials |
| `--allow-unauthenticated-identities` | — | Cho phép khách chưa đăng nhập vẫn có quyền hạn chế (guest access) |

**3. So sánh nhanh**

| Tiêu chí | User Pool | Identity Pool |
|---|---|---|
| Vai trò | Quản lý danh tính (đăng ký/đăng nhập) | Cấp temp AWS credentials |
| Trả về | JWT token | AWS Access Key/Secret/Session Token tạm thời |
| Dùng độc lập | Có thể dùng riêng (chỉ cần xác thực) | Cần input là token (từ User Pool hoặc IdP khác) |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ý nghĩa | Ghi chú |
|---|---|---|
| MFA | OFF / OPTIONAL / ON (bắt buộc) | Nên bật ON cho app tài chính/nhạy cảm |
| Guest access | Qua Identity Pool unauthenticated | Quyền phải giới hạn chặt bằng IAM Role riêng cho guest |

**5. Cách dùng nâng cao / pattern thực tế**
Kết hợp User Pool (xác thực) + Identity Pool (cấp quyền S3 PutObject giới hạn theo `${cognito-identity.amazonaws.com:sub}` trong policy) để mỗi user mobile chỉ upload được vào đúng "thư mục" của riêng mình trong 1 bucket S3 chung, không đụng được file của user khác — không cần backend trung gian xử lý upload. Case thực tế: app chia sẻ ảnh cho người dùng cá nhân, hàng triệu user đăng ký qua Cognito User Pool, mobile app dùng Identity Pool lấy temp credentials để **upload thẳng ảnh lên S3** (không qua server trung gian), giảm tải hoàn toàn cho backend so với việc mọi upload phải đi qua 1 API server.

**6. Cấu hình/thiết lập liên quan**
IAM policy giới hạn theo user (Identity Pool):
```json
{"Effect": "Allow", "Action": "s3:PutObject",
 "Resource": "arn:aws:s3:::my-bucket/${cognito-identity.amazonaws.com:sub}/*"}
```
Thực tế cần đụng tới khi: cần cách ly dữ liệu giữa các user trong cùng 1 bucket dùng chung mà không tạo bucket riêng cho mỗi user.

**7. Vị trí trong kiến trúc (nhà máy nền)**
Cognito là **trạm mới** đứng ở "quầy lễ tân cho khách vãng lai" — khác IAM (thẻ ra vào cho nhân viên/hệ thống nội bộ) và Directory Service/Federation (cho nhân viên có sẵn danh tính doanh nghiệp). Gắn ở lớp phủ an ninh, phục vụ riêng luồng người dùng cuối của ứng dụng (mobile/web) truy cập trực tiếp vào Kho hàng (S3) hoặc trạm khác.

**8. 5 câu hỏi ôn tập**
1. User Pool và Identity Pool khác nhau ở điểm nào? → User Pool quản lý danh tính (trả JWT); Identity Pool đổi token lấy temp AWS credentials.
2. Muốn mobile app upload thẳng lên S3 không qua server trung gian, cần gì? → Cognito Identity Pool cấp temp credentials.
3. Muốn mỗi user chỉ upload vào đúng thư mục riêng trong bucket chung, làm sao? → IAM policy dùng biến `${cognito-identity.amazonaws.com:sub}`.
4. Guest access (chưa đăng nhập) qua Cognito gọi là gì? → Unauthenticated identities.
5. Cognito khớp vào đâu trong nhà máy nền? → Trạm mới, quầy lễ tân cho khách vãng lai (người dùng cuối app), khác IAM/Federation (nhân viên nội bộ).

---

## 6.37 — Encryption Primer

**1. Khái niệm + ví dụ đời sống**
Kiến thức nền trước khi học KMS: phân biệt **encryption at rest** (mã hóa dữ liệu khi lưu trữ — ổ cứng, S3, DB) và **encryption in transit** (mã hóa khi truyền đi — TLS/SSL). Và phân biệt **symmetric encryption** (1 khóa dùng cả mã hóa lẫn giải mã, nhanh, dùng cho dữ liệu lớn) với **asymmetric encryption** (cặp khóa public/private, chậm hơn, dùng cho trao đổi khóa/chữ ký số). Ví dụ đời sống: symmetric giống 1 chìa khóa dùng để khóa và mở cùng 1 cái tủ; asymmetric giống hộp thư có khe bỏ thư công khai (public key, ai cũng bỏ thư vào được) nhưng chỉ 1 chìa duy nhất (private key) mở được hộp lấy thư ra.

**2. Lệnh quan trọng**
(Bài lý thuyết nền, không có lệnh CLI riêng — áp dụng thực tế ở bài 6.38 KMS.)

| Khái niệm | Ý nghĩa |
|---|---|
| Encryption at rest | Mã hóa dữ liệu khi lưu trữ (disk, S3, DB) |
| Encryption in transit | Mã hóa dữ liệu khi truyền (TLS/SSL) |
| Symmetric | 1 khóa dùng chung mã hóa + giải mã |
| Asymmetric | Cặp khóa public (mã hóa/verify) + private (giải mã/sign) |

**3. So sánh nhanh**

| Tiêu chí | Symmetric | Asymmetric |
|---|---|---|
| Tốc độ | Nhanh | Chậm hơn nhiều |
| Số khóa | 1 khóa dùng chung | Cặp khóa public/private |
| Dùng cho | Mã hóa dữ liệu lớn (file, DB) | Trao đổi khóa, chữ ký số, TLS handshake |
| Ví dụ thuật toán | AES-256 | RSA, ECC |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ý nghĩa | Ghi chú |
|---|---|---|
| AES-256 | Chuẩn symmetric phổ biến nhất AWS dùng | KMS mặc định dùng AES-256 cho symmetric CMK |
| TLS handshake | Dùng asymmetric để trao đổi, sau đó chuyển sang symmetric cho phần dữ liệu | Kết hợp cả 2 loại — vừa an toàn vừa nhanh |

**5. Cách dùng nâng cao / pattern thực tế**
Hiểu rõ 2 loại encryption giúp trả lời đúng câu thi "vì sao TLS dùng asymmetric để bắt tay (handshake) nhưng lại chuyển sang symmetric cho phần truyền dữ liệu thực tế" — vì asymmetric an toàn hơn cho trao đổi khóa ban đầu (không cần chia sẻ khóa bí mật qua kênh chưa an toàn) nhưng quá chậm nếu dùng cho toàn bộ luồng dữ liệu lớn. Case thực tế: khi thiết kế API nội bộ giữa các service cần ký (sign) payload để chống giả mạo, dùng asymmetric key pair (private key ký, public key verify) thay vì symmetric — vì symmetric đòi hỏi cả 2 bên giữ chung 1 bí mật, rủi ro hơn nếu 1 bên bị lộ.

**6. Cấu hình/thiết lập liên quan**
Không có cấu hình cụ thể ở bài này — nền tảng khái niệm áp dụng trực tiếp vào cấu hình KMS Key Type (Symmetric/Asymmetric) ở bài 6.38.

**7. Vị trí trong kiến trúc (nhà máy nền)**
Encryption Primer không phải 1 trạm — là **nguyên lý vận hành của tủ khóa trung tâm (KMS)** sắp học tiếp theo, cần hiểu trước khi biết KMS tạo ra loại khóa nào cho việc gì.

**8. 5 câu hỏi ôn tập**
1. Encryption at rest và in transit khác nhau ở đâu? → At rest = mã hóa lúc lưu trữ; in transit = mã hóa lúc truyền đi.
2. Vì sao symmetric nhanh hơn nhưng TLS vẫn cần asymmetric lúc đầu? → Asymmetric an toàn cho trao đổi khóa ban đầu qua kênh chưa an toàn, sau đó chuyển symmetric cho tốc độ.
3. Ký số (sign) để chống giả mạo dùng loại khóa nào? → Asymmetric (private key ký, public key verify).
4. AES-256 thuộc loại encryption nào? → Symmetric.
5. Bài này khớp vào đâu trong nhà máy nền? → Không phải trạm, là nguyên lý vận hành nền của KMS.

---

## 6.38 — AWS Key Management Service (KMS)

**1. Khái niệm + ví dụ đời sống**
KMS là dịch vụ quản lý khóa mã hóa tập trung, tích hợp sẵn với hầu hết dịch vụ AWS (S3, EBS, RDS...) để mã hóa dữ liệu mà không cần tự quản khóa. Ví dụ đời sống: **tủ khóa trung tâm** của nhà máy, giữ chìa khóa (Customer Master Key/CMK) cho mọi kho/tủ trong nhà máy — không phải mỗi kho tự giữ chìa riêng dễ thất lạc.

Cơ chế **Envelope Encryption**: KMS không trực tiếp mã hóa toàn bộ dữ liệu lớn (chậm) — nó tạo ra **Data Key**, dùng Data Key mã hóa dữ liệu thực tế (nhanh, symmetric), rồi chính Data Key đó được KMS mã hóa lại bằng CMK và lưu kèm dữ liệu. Muốn giải mã: gọi KMS giải mã Data Key trước, rồi dùng Data Key đó giải mã dữ liệu.

**2. Lệnh quan trọng**

```bash
aws kms create-key --description "prod-app-key" --key-usage ENCRYPT_DECRYPT

aws kms create-alias --alias-name alias/prod-app-key --target-key-id <key-id>

aws kms generate-data-key --key-id alias/prod-app-key \
  --key-spec AES_256   # tạo data key cho envelope encryption

aws kms encrypt --key-id alias/prod-app-key --plaintext fileb://secret.txt \
  --output text --query CiphertextBlob | base64 --decode > secret.enc

aws kms decrypt --ciphertext-blob fileb://secret.enc

aws kms enable-key-rotation --key-id alias/prod-app-key   # tự xoay khóa hàng năm
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `create-key` | CMK = Customer Master Key | Tạo khóa mã hóa mới |
| `create-alias` | — | Đặt tên dễ nhớ cho key ID (nên dùng thay vì key ID trực tiếp) |
| `generate-data-key` | — | Tạo Data Key cho Envelope Encryption |
| `encrypt` / `decrypt` | — | Mã hóa/giải mã trực tiếp qua KMS (chỉ nên dùng cho dữ liệu nhỏ như secret, không phải file lớn) |
| `enable-key-rotation` | — | Bật tự động xoay khóa hàng năm (chỉ áp dụng symmetric CMK do AWS quản lý) |

**3. So sánh nhanh**

| Tiêu chí | AWS Managed Key | Customer Managed Key (CMK) |
|---|---|---|
| Kiểm soát policy | Không tùy chỉnh được | Tùy chỉnh Key Policy chi tiết |
| Rotation | Tự động, không tắt được | Tùy chọn bật/tắt |
| Chi phí | Miễn phí | Trả phí theo key/tháng + API call |
| Dùng khi | Nhu cầu cơ bản, không cần kiểm soát | Cần audit trail chi tiết, cross-account sharing |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ý nghĩa | Ghi chú |
|---|---|---|
| Kích thước dữ liệu encrypt trực tiếp | Tối đa 4KB | Vì vậy dữ liệu lớn phải dùng Envelope Encryption (Data Key) |
| Key rotation | Hàng năm (tự động, chỉ CMK symmetric AWS-managed key material) | Không áp dụng cho asymmetric hoặc imported key material |
| Grant | Cấp quyền tạm thời/có điều kiện dùng key mà không sửa Key Policy | Dùng cho ứng dụng cần quyền tạm thời, thu hồi nhanh |

**5. Cách dùng nâng cao / pattern thực tế**
Dùng **Key Policy** kết hợp điều kiện (`kms:ViaService`) để giới hạn 1 CMK chỉ được dùng bởi 1 service cụ thể (VD chỉ cho phép S3 dùng key này mã hóa, không cho EC2 dùng trực tiếp) — kiểm soát chặt hơn IAM policy thông thường vì Key Policy luôn được đánh giá đầu tiên. Case thực tế: ngân hàng cần chứng minh mọi dữ liệu khách hàng trong RDS được mã hóa bằng khóa riêng của họ (không dùng AWS Managed Key mặc định) để dễ audit và có thể **thu hồi quyền truy cập tức thời** (disable key) nếu phát hiện rò rỉ — điều không thể làm được nếu dùng AWS Managed Key (không kiểm soát được).

**6. Cấu hình/thiết lập liên quan**
Key Policy giới hạn theo service:
```json
{"Effect": "Allow", "Principal": {"AWS": "*"}, "Action": "kms:Decrypt",
 "Resource": "*", "Condition": {"StringEquals": {"kms:ViaService": "s3.ap-southeast-1.amazonaws.com"}}}
```
Thực tế cần đụng tới khi: cần audit chặt việc dùng key theo từng service, hoặc cross-account key sharing (thêm account khác vào Key Policy).

**7. Vị trí trong kiến trúc (nhà máy nền)**
KMS đúng là **tủ khóa trung tâm** đã mô tả sẵn trong bản đồ nền — giữ chìa khóa của mọi kho (S3, RDS, EBS). Bài này bổ sung chi tiết cơ chế **Envelope Encryption** (tủ khóa không tự mở từng thùng hàng lớn, mà cấp 1 chìa tạm cho từng thùng, rồi giữ bản sao chìa tạm đó trong tủ chính).

**8. 5 câu hỏi ôn tập**
1. Vì sao KMS không mã hóa trực tiếp file lớn mà dùng Envelope Encryption? → Encrypt trực tiếp giới hạn 4KB, dữ liệu lớn cần Data Key mã hóa nhanh (symmetric) rồi mới mã hóa Data Key bằng CMK.
2. AWS Managed Key khác Customer Managed Key ở điểm nào quan trọng nhất? → CMK tùy chỉnh được Key Policy, có thể disable/thu hồi tức thời; Managed Key thì không.
3. Ngân hàng cần thu hồi quyền truy cập dữ liệu tức thời khi rò rỉ, nên dùng loại key nào? → Customer Managed Key (có thể disable ngay).
4. Giới hạn 1 CMK chỉ cho S3 dùng, không cho EC2 dùng trực tiếp, dùng điều kiện gì? → `kms:ViaService`.
5. KMS khớp vào đâu trong nhà máy nền? → Đúng là tủ khóa trung tâm đã có sẵn — bổ sung cơ chế Envelope Encryption.

---

## 6.40 — AWS CloudHSM

**1. Khái niệm + ví dụ đời sống**
CloudHSM cung cấp phần cứng bảo mật chuyên dụng (Hardware Security Module) **single-tenant** — khác KMS là multi-tenant (nhiều khách hàng dùng chung hạ tầng, AWS quản lý). Với CloudHSM, khách hàng **tự quản lý toàn bộ vòng đời khóa**, AWS không có quyền truy cập vào khóa (kể cả admin AWS). Ví dụ đời sống: KMS giống thuê 1 ngăn trong tủ khóa chung của tòa nhà (AWS giữ 1 bản chìa dự phòng để hỗ trợ), CloudHSM giống **mua hẳn 1 két sắt riêng đặt trong phòng riêng**, chỉ mình bạn có chìa, AWS không đụng vào được.

**2. Lệnh quan trọng**

```bash
aws cloudhsmv2 create-cluster --hsm-type hsm1.medium \
  --subnet-ids subnet-1 subnet-2   # tạo cluster HSM

aws cloudhsmv2 create-hsm --cluster-id cluster-abc \
  --availability-zone ap-southeast-1a   # thêm HSM instance vào cluster

aws cloudhsmv2 describe-clusters   # xem trạng thái cluster
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| HSM | Hardware Security Module | Phần cứng chuyên dụng lưu/xử lý khóa mã hóa |
| `create-cluster` | — | Tạo cluster CloudHSM (nhiều HSM instance cho HA) |
| `create-hsm` | — | Thêm HSM instance vào cluster ở 1 AZ |

**3. So sánh nhanh**

| Tiêu chí | KMS | CloudHSM |
|---|---|---|
| Tenancy | Multi-tenant | Single-tenant (riêng cho khách hàng) |
| Quản lý khóa | AWS quản lý hạ tầng, hỗ trợ backup | Khách hàng tự quản 100%, AWS không truy cập được |
| Compliance | Đạt FIPS 140-2 Level 2 (tùy dịch vụ) | Đạt FIPS 140-2 Level 3 — yêu cầu cao hơn |
| Chi phí | Theo request | Theo giờ/HSM instance, đắt hơn nhiều |
| Dùng khi | Nhu cầu mã hóa thông thường | Yêu cầu compliance nghiêm ngặt (PCI-DSS Level 1, HSM riêng theo luật) |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ý nghĩa | Ghi chú |
|---|---|---|
| FIPS 140-2 Level 3 | Chuẩn compliance CloudHSM đạt được | KMS mặc định chỉ đạt Level 2 cho phần lớn hoạt động |
| Mất quyền truy cập | Nếu mất toàn bộ credential quản trị HSM, AWS KHÔNG thể khôi phục | Rủi ro lớn nhất — khác hẳn KMS luôn có AWS hỗ trợ |

**5. Cách dùng nâng cao / pattern thực tế**
Dùng CloudHSM khi luật/quy định ngành (VD tài chính, chính phủ) yêu cầu rõ "khóa mã hóa phải nằm trên phần cứng chuyên dụng single-tenant, nhà cung cấp cloud không được có bất kỳ quyền truy cập nào vào khóa". Case thực tế: 1 công ty thanh toán quốc tế cần đạt chuẩn PCI-DSS mức cao nhất, kiểm toán yêu cầu chứng minh AWS (kể cả nhân viên AWS) không thể truy cập khóa mã hóa dữ liệu thẻ tín dụng dưới bất kỳ hình thức nào — chọn CloudHSM thay vì KMS vì đây là yêu cầu compliance cứng, không phải lựa chọn kỹ thuật đơn thuần.

**6. Cấu hình/thiết lập liên quan**
CloudHSM cần khởi tạo cluster qua CLI/console rồi cấu hình client trên EC2 để app kết nối trực tiếp tới HSM qua network riêng trong VPC. Thực tế cần đụng tới khi: migrate ứng dụng có yêu cầu compliance HSM riêng, cần cài `cloudhsm-client` trên instance ứng dụng.

**7. Vị trí trong kiến trúc (nhà máy nền)**
CloudHSM là **nhánh đặc biệt** cạnh tủ khóa trung tâm (KMS) — thay vì dùng tủ khóa chung của tòa nhà, đây là **1 két sắt riêng biệt hoàn toàn**, chỉ dùng khi yêu cầu compliance bắt buộc không cho phép chia sẻ hạ tầng khóa với ai khác kể cả AWS.

**8. 5 câu hỏi ôn tập**
1. Khác biệt cốt lõi giữa KMS và CloudHSM là gì? → KMS multi-tenant (AWS quản lý hạ tầng); CloudHSM single-tenant (khách hàng tự quản 100%, AWS không truy cập được).
2. Chuẩn compliance nào CloudHSM đạt được mà KMS thường không đạt? → FIPS 140-2 Level 3.
3. Rủi ro lớn nhất khi dùng CloudHSM là gì? → Mất credential quản trị → AWS không thể khôi phục khóa.
4. Công ty thanh toán cần PCI-DSS mức cao nhất, AWS không được truy cập khóa dưới bất kỳ hình thức nào — chọn gì? → CloudHSM.
5. CloudHSM khớp vào đâu trong nhà máy nền? → Nhánh đặc biệt cạnh KMS, két sắt riêng biệt hoàn toàn.

---

## 6.41 — AWS Certificate Manager

**1. Khái niệm + ví dụ đời sống**
ACM (AWS Certificate Manager) cấp và quản lý chứng chỉ SSL/TLS miễn phí, tự động gia hạn khi gắn với dịch vụ AWS được hỗ trợ (ALB, CloudFront, API Gateway...). Ví dụ đời sống: giống **con dấu xác nhận danh tính** của nhà máy được cấp bởi 1 tổ chức uy tín (Certificate Authority), khách hàng nhìn thấy con dấu này thì tin tưởng đây đúng là nhà máy thật, không phải giả mạo — và ACM tự động "đóng dấu mới" trước khi dấu cũ hết hạn, không cần ai nhớ gia hạn tay.

2 cách xác thực quyền sở hữu domain:
- **DNS validation**: thêm CNAME record vào Route 53/DNS provider — được khuyến nghị vì tự động gia hạn hoàn toàn.
- **Email validation**: xác nhận qua email admin domain — cần thao tác tay mỗi lần gia hạn nếu không chuyển sang DNS.

**2. Lệnh quan trọng**

```bash
aws acm request-certificate --domain-name example.com \
  --subject-alternative-names www.example.com \
  --validation-method DNS   # xin cert, khuyến nghị DNS validation

aws acm describe-certificate --certificate-arn arn:aws:acm:...:certificate/abc123

aws acm list-certificates --certificate-statuses ISSUED
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `request-certificate` | — | Xin cấp chứng chỉ mới cho domain |
| `--subject-alternative-names` | SAN | Thêm domain phụ vào cùng 1 chứng chỉ (VD www + apex domain) |
| `--validation-method DNS` | — | Xác thực qua CNAME, cho phép auto-renew hoàn toàn |
| `describe-certificate` | — | Xem trạng thái/chi tiết chứng chỉ |

**3. So sánh nhanh**

| Tiêu chí | DNS Validation | Email Validation |
|---|---|---|
| Auto-renew | Hoàn toàn tự động | Cần xác nhận tay nếu domain đổi chủ/email không còn hoạt động |
| Khuyến nghị | Có (mặc định nên chọn) | Chỉ dùng khi không quản lý được DNS |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ý nghĩa | Ghi chú |
|---|---|---|
| Chi phí | Miễn phí khi dùng với dịch vụ AWS tích hợp (ALB/CloudFront) | Không xuất được private key ra ngoài để dùng ở nơi khác (VD server tự quản) |
| Phạm vi dùng | Chỉ gắn được với service AWS hỗ trợ | Không dùng ACM cert để cài trực tiếp lên server on-premise |

**5. Cách dùng nâng cao / pattern thực tế**
Luôn chọn DNS validation ngay từ đầu để đạt "true auto-renewal" — chứng chỉ email validation vẫn tự renew được NHƯNG chỉ khi ACM còn xác nhận lại được qua email, nếu email domain đổi hoặc không còn dùng sẽ gãy renewal âm thầm, gây downtime SSL bất ngờ. Case thực tế: 1 website thương mại dùng CloudFront + ACM với DNS validation qua Route 53 — chứng chỉ tự động gia hạn vĩnh viễn mà không ai phải nhớ, khác với cách làm cũ (mua cert từ bên thứ 3, phải nhắc lịch gia hạn thủ công mỗi năm, từng có lần quên gây website báo lỗi "not secure" với khách hàng).

**6. Cấu hình/thiết lập liên quan**
CNAME record cần thêm vào DNS (tự động nếu dùng Route 53 cùng account):
```bash
aws route53 change-resource-record-sets --hosted-zone-id Z123 \
  --change-batch file://acm-validation-cname.json
```
Thực tế cần đụng tới khi: domain không quản lý bởi Route 53 (VD DNS provider ngoài), phải tự thêm CNAME thủ công.

**7. Vị trí trong kiến trúc (nhà máy nền)**
ACM là **trạm mới** đứng ngay tại Sảnh phân luồng (ALB) và Kho hàng gần cổng (CloudFront) — đóng vai "con dấu xác nhận danh tính" gắn ở những trạm khách hàng nhìn thấy đầu tiên khi vào nhà máy, đảm bảo khách tin tưởng đúng địa chỉ.

**8. 5 câu hỏi ôn tập**
1. Vì sao nên chọn DNS validation thay vì Email validation? → DNS validation cho phép auto-renew hoàn toàn, không phụ thuộc email admin domain còn hoạt động hay không.
2. ACM certificate có xuất được private key để cài lên server on-premise không? → Không — chỉ dùng được với dịch vụ AWS hỗ trợ.
3. SAN trong request-certificate dùng để làm gì? → Thêm nhiều domain phụ vào cùng 1 chứng chỉ.
4. Chi phí ACM khi dùng với ALB/CloudFront? → Miễn phí.
5. ACM khớp vào đâu trong nhà máy nền? → Trạm mới ở Sảnh phân luồng/CloudFront — con dấu xác nhận danh tính.

---

## 6.43 — AWS Web Application Firewall (WAF)

**1. Khái niệm + ví dụ đời sống**
WAF lọc HTTP/HTTPS request ở tầng ứng dụng (Layer 7) dựa trên **Web ACL** chứa các **rule** (chặn SQL injection, XSS, rate limiting theo IP, chặn theo geography...), gắn vào CloudFront, ALB, API Gateway, hoặc AppSync. Ví dụ đời sống: giống **trạm soát người** đứng ngay cổng bảo vệ (Route 53/CloudFront), kiểm tra hành lý từng người vào — không cho mang vật cấm (SQL injection payload), không cho vào quá nhiều lần liên tục (rate limit), chặn người đến từ vùng cấm (geo-blocking).

**2. Lệnh quan trọng**

```bash
aws wafv2 create-web-acl --name my-web-acl --scope CLOUDFRONT \
  --default-action Allow={} --rules file://rules.json \
  --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=myacl

aws wafv2 associate-web-acl --web-acl-arn arn:aws:wafv2:...:webacl/my-web-acl \
  --resource-arn arn:aws:elasticloadbalancing:...:loadbalancer/app/my-alb

aws wafv2 get-sampled-requests --web-acl-arn arn:...:webacl/my-web-acl \
  --rule-metric-name myacl --scope CLOUDFRONT --time-window StartTime=...,EndTime=... \
  --max-items 100   # xem mẫu request bị chặn/cho qua
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `create-web-acl` | ACL = Access Control List | Tạo bộ quy tắc lọc request |
| `--scope CLOUDFRONT` / `REGIONAL` | — | CLOUDFRONT cho CDN (global); REGIONAL cho ALB/API Gateway trong 1 region |
| `associate-web-acl` | — | Gắn Web ACL vào resource cụ thể |
| `get-sampled-requests` | — | Debug xem request nào bị match rule nào |

**3. So sánh nhanh**

| Tiêu chí | WAF | Security Group | NACL |
|---|---|---|---|
| Tầng OSI | Layer 7 (ứng dụng, hiểu nội dung HTTP) | Layer 4 (port/protocol) | Layer 3/4 (IP/port) |
| Hiểu được | SQL injection, XSS trong payload | Chỉ port/IP cho phép | Chỉ port/IP cho phép |
| Gắn vào | CloudFront/ALB/API Gateway/AppSync | ENI (instance) | Subnet |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ý nghĩa | Ghi chú |
|---|---|---|
| Managed Rule Groups | AWS cung cấp sẵn (Core Rule Set, SQLi, bot control...) | Không cần tự viết rule từ đầu cho lỗ hổng phổ biến |
| Rate-based rule | Chặn IP khi vượt X request/5 phút | Chống brute-force/DDoS tầng ứng dụng cơ bản |

**5. Cách dùng nâng cao / pattern thực tế**
Dùng **Rate-based Rule** kết hợp Managed Rule Group (AWSManagedRulesCommonRuleSet) để chặn cả tấn công tầng ứng dụng phổ biến (SQLi/XSS) lẫn brute-force login mà không cần tự viết logic detect. Case thực tế: 1 website tin tức bị bot cào nội dung liên tục (content scraping) gây tải server cao bất thường — đặt WAF rate-based rule giới hạn 100 request/5 phút/IP trên CloudFront, chặn bot mà không ảnh hưởng người dùng thật đọc tin bình thường.

**6. Cấu hình/thiết lập liên quan**
Rate-based rule (JSON rút gọn):
```json
{"Name": "RateLimitRule", "Priority": 1,
 "Statement": {"RateBasedStatement": {"Limit": 2000, "AggregateKeyType": "IP"}},
 "Action": {"Block": {}}}
```
Thực tế cần đụng tới khi: phát hiện traffic bất thường từ 1 dải IP cụ thể, cần chặn nhanh mà không cần thay đổi Security Group.

**7. Vị trí trong kiến trúc (nhà máy nền)**
WAF khớp đúng vai trò đã mô tả sẵn trong bản đồ nền — **trạm soát người ngay tại cổng bảo vệ (Route 53/CloudFront)**, hoặc ngay tại Sảnh phân luồng (ALB) nếu không dùng CloudFront.

**8. 5 câu hỏi ôn tập**
1. WAF khác Security Group ở tầng nào? → WAF Layer 7 (hiểu nội dung HTTP), Security Group Layer 4 (port/protocol).
2. Muốn chặn bot cào nội dung liên tục, dùng loại rule nào? → Rate-based Rule.
3. Scope CLOUDFRONT và REGIONAL khác nhau thế nào? → CLOUDFRONT cho CDN global; REGIONAL cho ALB/API Gateway trong 1 region cụ thể.
4. AWS cung cấp sẵn rule chặn SQLi/XSS phổ biến gọi là gì? → Managed Rule Groups.
5. WAF khớp vào đâu trong nhà máy nền? → Đúng vị trí đã có sẵn — trạm soát người tại cổng bảo vệ/CloudFront hoặc ALB.

---

## 6.44 — Amazon Inspector

**1. Khái niệm + ví dụ đời sống**
Inspector tự động quét **lỗ hổng bảo mật** (vulnerability) trên EC2, container image (ECR), và Lambda function — dựa trên CVE database, network reachability, và cấu hình. Ví dụ đời sống: giống đội kiểm tra an toàn lao động đi khắp nhà máy tìm **vết nứt/hư hỏng thiết bị** (lỗ hổng phần mềm chưa vá) trước khi nó gây tai nạn (bị khai thác tấn công).

**2. Lệnh quan trọng**

```bash
aws inspector2 enable --resource-types EC2 ECR LAMBDA   # bật scan cho các loại resource

aws inspector2 list-findings --filter-criteria \
  '{"severity":[{"comparison":"EQUALS","value":"CRITICAL"}]}'   # xem lỗ hổng nghiêm trọng

aws inspector2 batch-get-account-status   # xem trạng thái bật/tắt scan theo account
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `enable` | — | Bật Inspector scan cho loại resource chỉ định |
| `list-findings` | — | Liệt kê lỗ hổng phát hiện được, lọc theo severity |
| `--filter-criteria` | — | Điều kiện lọc kết quả (severity, resource type...) |

**3. So sánh nhanh**

| Tiêu chí | Inspector | GuardDuty | Config |
|---|---|---|---|
| Phát hiện | Lỗ hổng phần mềm (CVE) trong EC2/ECR/Lambda | Hành vi bất thường/kẻ tấn công đang hoạt động | Trạng thái cấu hình lệch chuẩn |
| Thời điểm | Chủ động quét định kỳ (trước khi bị khai thác) | Phản ứng khi có dấu hiệu tấn công thật | Liên tục theo thay đổi config |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ý nghĩa | Ghi chú |
|---|---|---|
| Severity levels | CRITICAL/HIGH/MEDIUM/LOW/INFORMATIONAL | Ưu tiên xử lý CRITICAL/HIGH trước |
| Network reachability | Kiểm tra xem lỗ hổng có thể bị khai thác từ internet không | Ưu tiên vá lỗ hổng có thể truy cập public trước lỗ hổng chỉ trong private subnet |

**5. Cách dùng nâng cao / pattern thực tế**
Dùng **Network Reachability** analysis để ưu tiên vá lỗ hổng: 1 CVE nghiêm trọng trên instance chỉ ở private subnet, không route được từ internet, rủi ro thực tế thấp hơn nhiều so với CVE trung bình trên instance public — Inspector giúp đội security không lãng phí thời gian vá theo đúng thứ tự severity lý thuyết mà bỏ qua yếu tố "có khai thác được thật không". Case thực tế: đội DevSecOps của công ty SaaS dùng Inspector scan tự động mọi image Docker trước khi push lên ECR trong pipeline CI/CD — build bị chặn (fail pipeline) nếu phát hiện CVE mức CRITICAL, đảm bảo không bao giờ deploy container có lỗ hổng nghiêm trọng đã biết lên production.

**6. Cấu hình/thiết lập liên quan**
Tích hợp CI/CD (khái niệm, không có lệnh chuẩn cố định): pipeline gọi `list-findings` sau khi push image lên ECR, fail build nếu có CRITICAL finding chưa được suppress.

**7. Vị trí trong kiến trúc (nhà máy nền)**
Inspector là **lớp phủ mới** cùng nhóm camera an ninh — đóng vai đội kiểm tra an toàn thiết bị định kỳ (khác GuardDuty là đội tuần tra phát hiện kẻ lạ đang xâm nhập, khác Config là kiểm tra cấu hình có đúng chuẩn không).

**8. 5 câu hỏi ôn tập**
1. Inspector khác GuardDuty ở điểm nào? → Inspector quét lỗ hổng phần mềm chủ động (CVE); GuardDuty phát hiện hành vi tấn công đang xảy ra.
2. Network Reachability giúp ích gì khi ưu tiên vá lỗi? → Biết lỗ hổng có khai thác được từ internet không, ưu tiên đúng rủi ro thực tế thay vì chỉ theo severity lý thuyết.
3. Case CI/CD dùng Inspector để làm gì? → Fail build nếu Docker image có CVE CRITICAL trước khi push lên ECR.
4. Inspector scan được loại resource nào? → EC2, ECR (container image), Lambda.
5. Inspector khớp vào đâu trong nhà máy nền? → Lớp phủ an ninh, đội kiểm tra an toàn thiết bị định kỳ (khác GuardDuty/Config).

---

## 6.45 — Amazon Macie

**1. Khái niệm + ví dụ đời sống**
Macie dùng machine learning quét dữ liệu trong S3 để **tự động phát hiện dữ liệu nhạy cảm** (PII — số CMND, thẻ tín dụng, email, thông tin y tế...) và cảnh báo nếu bucket chứa dữ liệu đó đang cấu hình không an toàn (public, không mã hóa). Ví dụ đời sống: giống 1 nhân viên có "mắt thần" đi qua từng kho hàng (S3 bucket), tự phát hiện thùng nào chứa **hàng hóa đặc biệt nhạy cảm** (dữ liệu cá nhân khách hàng) để báo cần bảo vệ kỹ hơn, dù trước đó không ai gắn nhãn rõ ràng.

**2. Lệnh quan trọng**

```bash
aws macie2 enable-macie   # bật Macie cho account

aws macie2 create-classification-job --job-type ONE_TIME \
  --s3-job-definition '{"bucketDefinitions":[{"accountId":"123456789012","buckets":["my-data-bucket"]}]}' \
  --name scan-customer-data

aws macie2 list-findings --finding-criteria \
  '{"criterion":{"severity.description":{"eq":["High"]}}}'
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `enable-macie` | — | Bật Macie cho account |
| `create-classification-job` | — | Tạo job quét bucket S3 tìm dữ liệu nhạy cảm |
| `list-findings` | — | Liệt kê phát hiện (PII tìm thấy, bucket cấu hình rủi ro...) |

**3. So sánh nhanh**

| Tiêu chí | Macie | Inspector | GuardDuty |
|---|---|---|---|
| Đối tượng quét | Nội dung dữ liệu trong S3 (PII) | Lỗ hổng phần mềm EC2/ECR/Lambda | Hành vi mạng/API bất thường |
| Công nghệ | Machine Learning nhận diện pattern PII | CVE database + network analysis | Threat intelligence + anomaly detection |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ý nghĩa | Ghi chú |
|---|---|---|
| Loại dữ liệu nhận diện | PII (tên, email, SSN, thẻ tín dụng...), credential | Có thể tùy chỉnh thêm custom data identifier (regex riêng) |
| Job type | ONE_TIME hoặc SCHEDULED | Scheduled dùng cho compliance kiểm tra định kỳ |

**5. Cách dùng nâng cao / pattern thực tế**
Dùng **Custom Data Identifier** (regex riêng) khi PII chuẩn không đủ — VD công ty có định dạng mã khách hàng nội bộ riêng cần coi là nhạy cảm nhưng Macie mặc định không nhận diện được. Case thực tế: công ty y tế lưu hồ sơ bệnh nhân trên nhiều bucket S3 được tạo qua nhiều năm bởi nhiều team khác nhau, không ai chắc chắn bucket nào còn chứa dữ liệu PII cũ chưa dọn — chạy Macie classification job quét toàn bộ, phát hiện 1 bucket cũ bị bỏ quên vẫn chứa hồ sơ bệnh nhân ở chế độ public-read, kịp thời khóa lại trước khi bị phát hiện bởi bên ngoài (tránh vi phạm HIPAA).

**6. Cấu hình/thiết lập liên quan**
Custom Data Identifier (regex mẫu):
```json
{"name": "internal-customer-id", "regex": "CUST-[0-9]{8}", "keywords": ["customer id"]}
```
Thực tế cần đụng tới khi: dữ liệu nhạy cảm đặc thù công ty không nằm trong danh sách PII chuẩn của Macie.

**7. Vị trí trong kiến trúc (nhà máy nền)**
Macie là **lớp phủ mới** cùng nhóm camera an ninh — chuyên trách riêng **Kho hàng/file tĩnh (S3)**, đóng vai "mắt thần" phát hiện hàng hóa nhạy cảm nằm sai chỗ trong kho, khác Inspector (lỗ hổng phần mềm) và GuardDuty (hành vi tấn công).

**8. 5 câu hỏi ôn tập**
1. Macie chuyên quét loại dữ liệu gì, ở đâu? → Dữ liệu nhạy cảm (PII) trong S3.
2. Muốn nhận diện định dạng dữ liệu nhạy cảm riêng của công ty, dùng gì? → Custom Data Identifier (regex riêng).
3. Case công ty y tế phát hiện gì nhờ Macie? → Bucket cũ bị bỏ quên chứa hồ sơ bệnh nhân ở chế độ public.
4. Macie khác Inspector ở đối tượng quét nào? → Macie quét nội dung dữ liệu (PII) trong S3; Inspector quét lỗ hổng phần mềm EC2/ECR/Lambda.
5. Macie khớp vào đâu trong nhà máy nền? → Lớp phủ an ninh, chuyên trách Kho hàng S3 — mắt thần phát hiện hàng nhạy cảm.

---

## 6.46 — AWS GuardDuty

**1. Khái niệm + ví dụ đời sống**
GuardDuty là dịch vụ phát hiện mối đe dọa (threat detection) liên tục, phân tích VPC Flow Logs, CloudTrail logs, DNS logs bằng machine learning + threat intelligence feed để phát hiện hành vi bất thường (kết nối tới IP độc hại đã biết, EC2 bị compromise đang mining crypto, IAM credential bị dùng bất thường...). Ví dụ đời sống: đúng như mô tả gốc trong bản đồ nền — **đội an ninh tuần tra** phát hiện kẻ lạ, nhưng bài này làm rõ **cách nó phát hiện**: không cần bạn cấu hình rule gì, chỉ cần bật lên, nó tự học "hành vi bình thường" của account rồi báo động khi có gì đó lệch chuẩn.

**2. Lệnh quan trọng**

```bash
aws guardduty create-detector --enable   # bật GuardDuty cho account

aws guardduty list-findings --detector-id abc123 \
  --finding-criteria '{"Criterion":{"severity":{"Gte":7}}}'   # lọc finding severity cao

aws guardduty get-findings --detector-id abc123 --finding-ids finding-xyz
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `create-detector --enable` | — | Bật GuardDuty (chỉ cần 1 bước, không cần cấu hình rule) |
| `list-findings` | — | Liệt kê phát hiện, lọc theo severity (0-8.9) |
| `get-findings` | — | Xem chi tiết 1 finding cụ thể |

**3. So sánh nhanh**

| Tiêu chí | GuardDuty | Inspector | Macie |
|---|---|---|---|
| Phát hiện | Hành vi tấn công/bất thường đang xảy ra | Lỗ hổng phần mềm chưa vá | Dữ liệu nhạy cảm nằm sai chỗ |
| Nguồn dữ liệu | VPC Flow Logs, CloudTrail, DNS logs | CVE database, image scan | Nội dung file trong S3 |
| Cần cấu hình rule | Không — tự học hành vi | Không — tự quét theo CVE | Không — tự nhận diện PII |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ý nghĩa | Ghi chú |
|---|---|---|
| Severity score | 0.1–8.9 (Low/Medium/High) | Ưu tiên xử lý High trước |
| Không cần setup log riêng | Tự động dùng VPC Flow Logs/CloudTrail có sẵn | Không cần bật thủ công các log nguồn trước |

**5. Cách dùng nâng cao / pattern thực tế**
Kết hợp GuardDuty finding với EventBridge để **tự động phản ứng** (VD phát hiện EC2 đang giao tiếp với địa chỉ IP command-and-control đã biết → tự động cô lập instance bằng cách gán Security Group chặn toàn bộ outbound, đồng thời snapshot để điều tra sau) — biến phát hiện thụ động thành phản ứng chủ động (Security Automation). Case thực tế: 1 công ty phát hiện qua GuardDuty finding "UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration" — dấu hiệu access key của 1 EC2 instance bị đánh cắp và dùng từ nơi khác — nhờ tự động hóa với Lambda, hệ thống tự thu hồi credential (rotate/revoke) trong vài giây thay vì chờ người trực phát hiện thủ công có thể mất hàng giờ.

**6. Cấu hình/thiết lập liên quan**
Kết hợp EventBridge rule bắt GuardDuty finding:
```json
{"source": ["aws.guardduty"], "detail-type": ["GuardDuty Finding"],
 "detail": {"severity": [{"numeric": [">=", 7]}]}}
```
Thực tế cần đụng tới khi: cần phản ứng tự động thay vì chỉ nhận email cảnh báo rồi người xử lý thủ công.

**7. Vị trí trong kiến trúc (nhà máy nền)**
GuardDuty đúng vai trò đã mô tả sẵn — **đội an ninh tuần tra phát hiện kẻ lạ**. Bài này làm rõ: GuardDuty tận dụng lại dữ liệu từ CloudTrail (camera ghi hành động) và VPC Flow Logs (ghi lưu lượng mạng) để phân tích, không phải nguồn log riêng.

**8. 5 câu hỏi ôn tập**
1. GuardDuty dùng nguồn dữ liệu nào để phát hiện bất thường? → VPC Flow Logs, CloudTrail logs, DNS logs.
2. Có cần tự viết rule để GuardDuty hoạt động không? → Không — tự học hành vi bình thường và học từ threat intelligence.
3. Case IAM credential bị đánh cắp, giải pháp tự động hóa là gì? → GuardDuty finding + EventBridge + Lambda tự thu hồi credential ngay.
4. Severity score GuardDuty nằm trong khoảng nào? → 0.1–8.9.
5. GuardDuty khớp vào đâu trong nhà máy nền? → Đúng vai trò sẵn có — đội an ninh tuần tra, dùng lại dữ liệu từ CloudTrail + VPC Flow Logs.

---

## 6.47 — AWS Shield

**1. Khái niệm + ví dụ đời sống**
AWS Shield bảo vệ chống tấn công **DDoS (Distributed Denial of Service)** — làm sập dịch vụ bằng cách dội lượng traffic khổng lồ. Ví dụ đời sống: giống **hàng rào chắn đám đông** ở cổng nhà máy, ngăn 1 đám đông giả tạo (botnet) tràn vào làm nghẽn lối đi thật của khách hàng chính đáng.

2 gói:
- **Shield Standard**: miễn phí, tự động bật cho MỌI tài khoản AWS, chống DDoS Layer 3/4 cơ bản (SYN flood, UDP reflection...).
- **Shield Advanced**: trả phí (~3000 USD/tháng), bảo vệ nâng cao Layer 3/4/7, có đội **DRT (DDoS Response Team)** hỗ trợ 24/7, và **cost protection** (hoàn phí scale-out do DDoS gây ra).

**2. Lệnh quan trọng**

```bash
aws shield subscribe   # đăng ký Shield Advanced (Standard đã tự bật sẵn, không cần lệnh gì)

aws shield create-protection --name my-alb-protection \
  --resource-arn arn:aws:elasticloadbalancing:...:loadbalancer/app/my-alb

aws shield describe-attack --attack-id abc123   # xem chi tiết 1 cuộc tấn công đã ghi nhận
```

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| DRT | DDoS Response Team | Đội chuyên gia AWS hỗ trợ trực tiếp khi bị tấn công (chỉ có ở Advanced) |
| `subscribe` | — | Đăng ký Shield Advanced |
| `create-protection` | — | Gắn bảo vệ nâng cao cho 1 resource cụ thể (ALB/CloudFront/EIP/Route 53) |

**3. So sánh nhanh**

| Tiêu chí | Shield Standard | Shield Advanced |
|---|---|---|
| Chi phí | Miễn phí | ~3000 USD/tháng |
| Layer bảo vệ | 3/4 cơ bản | 3/4/7 nâng cao, tích hợp WAF miễn phí |
| Hỗ trợ | Tự động, không có support riêng | DRT 24/7 |
| Cost protection | Không | Có (hoàn phí scale-out do DDoS) |

**4. Giới hạn/tham số quan trọng**

| Khái niệm/Tham số | Giá trị/Ý nghĩa | Ghi chú |
|---|---|---|
| Shield Standard | Tự động bật, không cấu hình gì | Bảo vệ mọi tài khoản AWS mặc định |
| Shield Advanced + WAF | Chi phí WAF được miễn phí khi có Shield Advanced | Giảm chi phí tổng thể khi cần bảo vệ toàn diện |

**5. Cách dùng nâng cao / pattern thực tế**
Kết hợp Shield Advanced + WAF + Route 53 (health check failover) cho kiến trúc "Defense in Depth" chống DDoS đa lớp — Shield chặn ở Layer 3/4 trước khi traffic tới được ứng dụng, WAF lọc tiếp ở Layer 7. Case thực tế: sàn giao dịch tài chính có doanh thu lớn, downtime 1 phút gây thiệt hại đáng kể — mua Shield Advanced không chỉ vì khả năng chặn DDoS mạnh hơn mà còn vì **cost protection**: nếu bị tấn công DDoS khiến Auto Scaling scale-out ồ ạt (tốn tiền EC2 không cần thiết), AWS hoàn lại chi phí scale-out phát sinh do tấn công.

**6. Cấu hình/thiết lập liên quan**
Gắn Shield Advanced protection cho resource + bật proactive engagement (DRT chủ động liên hệ khi phát hiện tấn công lớn) qua console/CLI. Thực tế cần đụng tới khi: doanh nghiệp có SLA uptime cao, cần cam kết hỗ trợ khẩn cấp khi bị tấn công.

**7. Vị trí trong kiến trúc (nhà máy nền)**
Shield khớp đúng vai trò trong bản đồ nền — nằm cùng nhóm lớp phủ an ninh với WAF, nhưng Shield chặn ở **tầng mạng/hàng rào bên ngoài** (Layer 3/4) trước khi WAF (soát người tầng ứng dụng, Layer 7) phải xử lý.

**8. 5 câu hỏi ôn tập**
1. Shield Standard có cần đăng ký hay trả phí không? → Không, tự động bật miễn phí cho mọi account.
2. Shield Advanced có tính năng gì Standard không có? → Layer 7 protection, DRT 24/7, cost protection, tích hợp WAF miễn phí.
3. Vì sao sàn giao dịch mua Shield Advanced ngoài lý do bảo vệ? → Cost protection — hoàn phí scale-out phát sinh do DDoS.
4. Shield bảo vệ chống loại tấn công gì? → DDoS (Distributed Denial of Service).
5. Shield khớp vào đâu trong nhà máy nền? → Lớp phủ an ninh cùng nhóm WAF, chặn ở tầng mạng ngoài (Layer 3/4) trước WAF (Layer 7).

---

## 6.48 — Defense In-Depth

**1. Khái niệm + ví dụ đời sống**
Defense in Depth (phòng thủ theo chiều sâu) là nguyên tắc thiết kế bảo mật: **không dựa vào 1 lớp bảo vệ duy nhất**, mà xếp chồng nhiều lớp độc lập, để nếu 1 lớp bị vượt qua thì lớp sau vẫn chặn được. Đây không phải 1 dịch vụ cụ thể mà là **cách tư duy tổng hợp** toàn bộ dịch vụ bảo mật đã học trong Module 6 (và Module 3 — Security Group/NACL). Ví dụ đời sống: đúng như toàn bộ ẩn dụ nhà máy nền — không chỉ có 1 lớp bảo vệ ở cổng, mà có tường rào (VPC), bảo vệ từng cửa xưởng (Security Group), trạm kiểm soát khuôn viên (NACL), thẻ ra vào (IAM), camera (CloudTrail/GuardDuty), tủ khóa (KMS) — mỗi lớp độc lập, kẻ xấu vượt qua 1 lớp vẫn còn nhiều lớp khác chặn lại.

**2. Lệnh quan trọng**
(Bài tổng hợp tư duy kiến trúc, không có lệnh CLI riêng — áp dụng tất cả dịch vụ đã học.)

| Lớp phòng thủ | Dịch vụ tương ứng |
|---|---|
| Network perimeter | Shield, WAF, NACL |
| Network segmentation | VPC, Security Group, Subnet public/private |
| Identity & Access | IAM, Federation, MFA, IAM Identity Center |
| Data protection | KMS, CloudHSM, ACM (encryption at rest/in transit) |
| Detection & Response | GuardDuty, Inspector, Macie, Config, CloudTrail |

**3. So sánh nhanh**

| Tiêu chí | Single Layer (1 lớp) | Defense in Depth (nhiều lớp) |
|---|---|---|
| Rủi ro | 1 điểm lỗi duy nhất bị vượt qua = toàn bộ hệ thống lộ | Kẻ tấn công phải vượt qua nhiều lớp độc lập |
| Chi phí/độ phức tạp | Thấp | Cao hơn, cần đầu tư vận hành nhiều dịch vụ |
| Khuyến nghị AWS | Không đủ cho production nghiêm túc | Best practice bắt buộc cho hệ thống quan trọng |

**4. Giới hạn/tham số quan trọng**
(Không có bảng tham số số liệu cụ thể — đây là nguyên tắc kiến trúc, không phải dịch vụ có limit kỹ thuật.)

**5. Cách dùng nâng cao / pattern thực tế**
Case thực tế tổng hợp: 1 ngân hàng số thiết kế kiến trúc với **5 lớp độc lập** cho hệ thống core banking — (1) Shield+WAF chặn DDoS/tấn công ứng dụng ở cổng ngoài, (2) NACL+Security Group giới hạn traffic chỉ đúng port cần thiết giữa các tầng (ALB→App→DB), (3) IAM least-privilege + MFA bắt buộc cho mọi truy cập quản trị, (4) KMS mã hóa toàn bộ dữ liệu tĩnh + ACM cho dữ liệu truyền, (5) GuardDuty+Config+CloudTrail giám sát liên tục 24/7. Khi kiểm toán bảo mật (pen test) tìm được 1 lỗ hổng ở Security Group cấu hình sai (lớp 2), dữ liệu khách hàng vẫn an toàn vì vẫn còn IAM (lớp 3) và KMS encryption (lớp 4) chặn tiếp — đây chính là giá trị thực tế của Defense in Depth, không phải lý thuyết suông.

**6. Cấu hình/thiết lập liên quan**
Không có 1 file cấu hình cụ thể — đây là checklist kiến trúc tổng hợp khi review 1 hệ thống: kiểm tra đã có đủ lớp Network/Identity/Data/Detection hay chưa, không có lớp nào "gánh" toàn bộ trách nhiệm bảo mật một mình.

**7. Vị trí trong kiến trúc (nhà máy nền)**
Defense in Depth không phải 1 trạm — là **triết lý thiết kế toàn bộ nhà máy**: mọi lớp phủ an ninh (thẻ ra vào, camera, tủ khóa, trạm soát người) trong bản đồ nền đã mô tả từ đầu prompt chính là hiện thân của nguyên tắc này — không có lớp nào đứng một mình, tất cả xếp chồng lên nhau bảo vệ cùng 1 nhà máy.

**8. 5 câu hỏi ôn tập**
1. Defense in Depth là gì? → Nguyên tắc xếp chồng nhiều lớp bảo mật độc lập, không dựa vào 1 lớp duy nhất.
2. Nếu 1 lớp (VD Security Group) bị cấu hình sai, hệ thống có sụp đổ hoàn toàn không? → Không, nếu thiết kế đúng Defense in Depth — các lớp khác (IAM, KMS...) vẫn chặn được.
3. 5 lớp phòng thủ ngân hàng số ở case trên gồm những gì? → Network perimeter, Network segmentation, Identity, Data protection, Detection & Response.
4. Đây có phải 1 dịch vụ AWS cụ thể không? → Không, là nguyên tắc/tư duy kiến trúc tổng hợp nhiều dịch vụ.
5. Defense in Depth khớp vào đâu trong nhà máy nền? → Chính là triết lý của toàn bộ lớp phủ an ninh đã mô tả từ đầu — nhiều lớp xếp chồng, không lớp nào đứng một mình.

---

## 🧪 BƯỚC 1.5 — Lab tổng: Dựng hệ thống bảo mật nhiều lớp cho ứng dụng web

🧭 **Bối cảnh:** Công ty chuẩn bị go-live 1 ứng dụng web xử lý dữ liệu khách hàng — bạn cần thiết lập SSO cho nhân viên, mã hóa dữ liệu, cấp SSL, và bật giám sát bảo mật nhiều lớp trước ngày ra mắt.

```bash
# ===== BƯỚC 1: IAM Identity Center SSO cho nhân viên (bài 6.34/6.35) =====
aws iam create-saml-provider --name CorpADFederation \
  --saml-metadata-document file://adfs-metadata.xml
# tạo IAM Role với trust policy cho phép SAML provider assume — nhân viên login 1 lần qua SSO

# ===== BƯỚC 2: Tạo KMS key mã hóa dữ liệu (bài 6.38/6.39) =====
aws kms create-key --description "prod-app-key" --key-usage ENCRYPT_DECRYPT
aws kms create-alias --alias-name alias/prod-app-key --target-key-id <key-id>
aws kms enable-key-rotation --key-id alias/prod-app-key
# verify: mã hóa thử 1 file test
aws kms encrypt --key-id alias/prod-app-key --plaintext fileb://test.txt \
  --output text --query CiphertextBlob | base64 --decode > test.enc

# ===== BƯỚC 3: Xin SSL certificate cho domain (bài 6.41/6.42) =====
aws acm request-certificate --domain-name app.example.com \
  --validation-method DNS
aws route53 change-resource-record-sets --hosted-zone-id Z123 \
  --change-batch file://acm-validation-cname.json
aws acm describe-certificate --certificate-arn <arn>   # đợi status = ISSUED

# ===== BƯỚC 4: Gắn WAF chặn tấn công tầng ứng dụng (bài 6.43) =====
aws wafv2 create-web-acl --name app-web-acl --scope REGIONAL \
  --default-action Allow={} --rules file://rate-limit-rule.json \
  --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=appacl
aws wafv2 associate-web-acl --web-acl-arn <waf-arn> \
  --resource-arn arn:aws:elasticloadbalancing:...:loadbalancer/app/my-alb

# ===== BƯỚC 5: Bật giám sát lỗ hổng + dữ liệu nhạy cảm + hành vi bất thường (bài 6.44/6.45/6.46) =====
aws inspector2 enable --resource-types EC2 ECR LAMBDA
aws macie2 enable-macie
aws guardduty create-detector --enable

# ===== VERIFY =====
aws acm describe-certificate --certificate-arn <arn> --query 'Certificate.Status'
aws wafv2 get-sampled-requests --web-acl-arn <waf-arn> --rule-metric-name appacl \
  --scope REGIONAL --time-window StartTime=...,EndTime=... --max-items 10
aws inspector2 batch-get-account-status
aws guardduty list-findings --detector-id <detector-id>

# ===== CLEANUP =====
aws guardduty delete-detector --detector-id <detector-id>
aws macie2 disable-macie
aws inspector2 disable --resource-types EC2 ECR LAMBDA
aws wafv2 disassociate-web-acl --resource-arn arn:aws:elasticloadbalancing:...:loadbalancer/app/my-alb
aws wafv2 delete-web-acl --name app-web-acl --scope REGIONAL --id <id> --lock-token <token>
aws acm delete-certificate --certificate-arn <arn>
aws kms schedule-key-deletion --key-id alias/prod-app-key --pending-window-in-days 7
aws iam delete-saml-provider --saml-provider-arn arn:...:saml-provider/CorpADFederation
```

**⚠️ Lưu ý dễ sai/dễ tốn phí:**
- `kms schedule-key-deletion` có thời gian chờ tối thiểu 7 ngày (không xóa ngay lập tức) — đây là thiết kế an toàn cố ý, tránh xóa nhầm khóa đang dùng thật.
- ACM certificate ở trạng thái PENDING_VALIDATION mãi nếu CNAME chưa propagate đúng — kiểm tra kỹ record DNS trước khi report lỗi.
- WAF Web ACL phải `disassociate` khỏi resource TRƯỚC khi `delete`, không xóa được Web ACL đang gắn với ALB.
- GuardDuty/Macie tính phí theo lượng log/dữ liệu quét — nếu chỉ test, nhớ disable ngay sau khi xong để tránh chi phí phát sinh trên tài khoản Free Tier.
- Shield Advanced (~3000 USD/tháng) **không nên bật thử trong lab cá nhân** — chỉ cần hiểu khái niệm qua Shield Standard (đã tự bật sẵn miễn phí).

---

## 📋 Cheat Sheet — Security

**Exam Cram nhanh:**
- Federation (SAML) = nhân viên nội bộ dùng lại danh tính AD/Okta. Cognito = người dùng cuối ứng dụng (mobile/web). Đừng nhầm 2 đối tượng phục vụ khác nhau.
- KMS = tủ khóa chung (multi-tenant), AWS có thể hỗ trợ. CloudHSM = két sắt riêng (single-tenant), AWS KHÔNG truy cập được — chọn khi luật bắt buộc.
- ACM = SSL/TLS miễn phí, tự động gia hạn khi dùng DNS validation — chỉ gắn được với dịch vụ AWS hỗ trợ, không xuất private key.
- WAF (Layer 7, hiểu nội dung HTTP) khác Security Group/NACL (Layer 3/4, chỉ port/IP). Shield chặn DDoS ở tầng mạng trước khi WAF xử lý tầng ứng dụng.
- 3 dịch vụ camera an ninh dễ nhầm: **Inspector** = lỗ hổng phần mềm (CVE) chủ động quét; **Macie** = dữ liệu nhạy cảm (PII) trong S3; **GuardDuty** = hành vi tấn công/bất thường đang xảy ra (threat detection thời gian thực).
- Defense in Depth = triết lý xếp chồng nhiều lớp, không phải 1 dịch vụ — luôn là câu trả lời đúng khi đề hỏi "thiết kế bảo mật toàn diện nhất".

**Architecture Patterns hay gặp:**
- SSO cho hàng nghìn nhân viên, tắt quyền tức thời khi nghỉ việc → SAML Federation qua IAM Identity Center.
- Mobile app upload thẳng S3 không qua server → Cognito User Pool + Identity Pool.
- Compliance yêu cầu AWS không được truy cập khóa → CloudHSM thay vì KMS.
- Chặn bot cào nội dung/brute-force → WAF Rate-based Rule.
- Phát hiện bucket S3 cũ chứa PII bị bỏ quên → Macie classification job.
- Phát hiện + tự động phản ứng credential bị đánh cắp → GuardDuty finding + EventBridge + Lambda.
- Thiết kế bảo mật cho hệ thống tài chính/y tế quan trọng → Defense in Depth nhiều lớp độc lập.

---

## 🏭 Trạm mới thêm vào nhà máy nền ở section này

- **AWS Directory Service** — lớp phủ an ninh cạnh IAM: sổ hộ khẩu trung tâm kiểu Active Directory.
- **Identity Federation** — lớp phủ IAM: cổng công nhận thẻ ra vào của công ty đối tác (SSO nhân viên nội bộ).
- **Amazon Cognito** — trạm mới: quầy lễ tân cho khách vãng lai (người dùng cuối app), khác IAM/Federation.
- **KMS** — xác nhận đúng vị trí tủ khóa trung tâm đã có sẵn, bổ sung cơ chế Envelope Encryption.
- **CloudHSM** — nhánh đặc biệt cạnh KMS: két sắt riêng biệt hoàn toàn (single-tenant), dùng khi compliance bắt buộc.
- **AWS Certificate Manager (ACM)** — trạm mới ở Sảnh phân luồng/CloudFront: con dấu xác nhận danh tính (SSL/TLS).
- **WAF** — xác nhận đúng vị trí trạm soát người tại cổng bảo vệ/CloudFront đã có sẵn.
- **Amazon Inspector** — lớp phủ an ninh: đội kiểm tra an toàn thiết bị định kỳ (lỗ hổng phần mềm).
- **Amazon Macie** — lớp phủ an ninh: mắt thần chuyên trách Kho hàng S3, phát hiện dữ liệu nhạy cảm.
- **GuardDuty** — xác nhận đúng vị trí đội an ninh tuần tra đã có sẵn, làm rõ dùng lại dữ liệu CloudTrail/VPC Flow Logs.
- **AWS Shield** — lớp phủ an ninh cùng nhóm WAF: hàng rào chắn đám đông ở tầng mạng ngoài (trước WAF).
- **Defense in Depth** — không phải trạm, là triết lý xếp chồng toàn bộ lớp phủ an ninh trong bản đồ nền.

---

## 🎉 Module 6 hoàn tất!

Cả 3 section (Deployment & Management, Monitoring/Logging/Auditing, Security) đã xong. Nhà máy nền giờ đã có đầy đủ: bản vẽ thi công (CloudFormation), sổ tay cấu hình/bí mật, nhân viên kiểm định + camera an ninh nhiều lớp, đồng hồ đo + GPS theo request, và toàn bộ lớp phòng thủ Identity/Data/Detection. Chỉ còn **Module 7 — Mở rộng & Về đích** (Migration, Web/Mobile/ML/Cost, Practice Exam) là hoàn thành toàn bộ roadmap SAA-C03.
