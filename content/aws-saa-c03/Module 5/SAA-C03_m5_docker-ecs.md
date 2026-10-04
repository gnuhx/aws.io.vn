# SAA-C03 · Module 5 — Modern Architecture (Containers & Serverless)
## 🔹 Section: Docker Containers and ECS (5.1 – 5.14)

**Domain thi liên quan:** Design High-Performing Architectures (24%) · Design Resilient Architectures (26%) · Design Cost-Optimized Architectures (20%)

**Danh sách bài trong section:**

| Bài | Tên | Loại |
|---|---|---|
| 5.1 | Introduction | meta |
| 5.2 | Docker Containers and Microservices | kỹ thuật |
| 5.3 | Amazon Elastic Container Service (ECS) | kỹ thuật |
| 5.4 | Amazon ECS and IAM Roles | kỹ thuật |
| 5.5 | Scaling Amazon ECS | kỹ thuật |
| 5.6 | Amazon ECS with ALB | kỹ thuật |
| 5.7 | [HOL] Launch Docker Containers on AWS Fargate | lab (gộp) |
| 5.8 | Amazon Elastic Kubernetes Service (EKS) | kỹ thuật |
| 5.9 | Amazon Elastic Container Registry (ECR) | kỹ thuật |
| 5.10 | [HOL] AWS App Runner | lab (gộp) |
| 5.11 | Exam Cram | meta |
| 5.12 | Architecture Patterns | meta |
| 5.13 | Containers Quiz | meta |
| 5.14 | Cheat Sheets | meta |

---

## 🗺️ Roadmap tiến độ — Module 5

- [x] ✅ **🔹 Docker Containers and ECS (5.1–5.14)** ← đang học
- [ ] ⏳ 🔹 Serverless Applications (5.15–5.32)

*(Kế thừa nhà máy nền từ Module 4: Kho tổng RDS/Aurora + RDS Proxy + Aurora Global DB, Quầy tạm ElastiCache, Kho linh hoạt DynamoDB (+Streams/DAX/Global Tables), Phòng phân tích RedShift/EMR/Athena-Glue/OpenSearch, Băng chuyền Kinesis, Thợ gọi-tới AWS Batch.)*

---

# BƯỚC 1 — Nội dung từng bài kỹ thuật

## 5.2 — Docker Containers and Microservices

### 1. Khái niệm + ví dụ đời sống
Container là 1 gói phần mềm đóng sẵn: code + thư viện + runtime + config, chạy độc lập nhờ chia sẻ chung kernel của OS host (khác VM — mỗi VM có nguyên 1 OS riêng). Ví dụ đời sống: **container vận chuyển đường biển** — hàng hóa (app) được đóng vào 1 khung chuẩn (image), khung này chạy được trên bất kỳ tàu/cảng nào (bất kỳ máy chủ nào có Docker Engine) mà không cần đóng gói lại.

Microservices là cách chia 1 ứng dụng lớn thành nhiều service nhỏ độc lập (mỗi service 1 container), thay vì 1 khối monolith — mỗi service scale/deploy riêng.

- **Docker Image**: bản thiết kế đóng băng (read-only), build 1 lần từ `Dockerfile`.
- **Docker Container**: bản instance đang chạy thật của image đó (read-write layer thêm lên trên).

### 2. Lệnh quan trọng
```bash
docker build -t my-app:v1 .          # build image từ Dockerfile trong thư mục hiện tại
docker images                        # liệt kê image đang có local
docker run -d -p 8080:80 my-app:v1   # chạy container, map cổng 8080 host -> 80 container
docker ps                            # liệt kê container đang chạy
docker ps -a                         # liệt kê cả container đã dừng
docker logs -f <container_id>        # xem log real-time
docker exec -it <container_id> bash  # vào shell bên trong container đang chạy
docker stop <container_id>           # dừng container
docker rmi my-app:v1                 # xóa image
```

**Từ điển flag nhanh:**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `-t` | tag | Gắn tên:phiên bản cho image |
| `-d` | detached | Chạy container ở background, không giữ terminal |
| `-p` | publish | Map cổng host:container |
| `-a` (trong `ps -a`) | all | Hiện cả container đã dừng, không chỉ đang chạy |
| `-f` (trong `logs -f`) | follow | Theo dõi log liên tục như `tail -f` |
| `-it` | interactive + tty | Mở terminal tương tác bên trong container |
| `FROM` | — | Chỉ định base image trong Dockerfile |
| `COPY` | — | Copy file từ host vào image |
| `RUN` | — | Chạy lệnh lúc build image (vd cài package) |
| `CMD` | — | Lệnh chạy khi container khởi động (chỉ 1 CMD/image) |

### 3. So sánh nhanh

| Tiêu chí | Virtual Machine | Container |
|---|---|---|
| OS | Mỗi VM 1 kernel riêng (hypervisor) | Dùng chung kernel host |
| Khởi động | Vài phút | Vài giây |
| Kích thước | GB | MB |
| Cách ly | Mạnh (hardware-level) | Yếu hơn (process-level, cùng kernel) |
| Ví dụ AWS | EC2 instance | ECS Task / EKS Pod |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Docker Hub image size (free) | không giới hạn cứng, nhưng rate-limit pull | 100 pull/6h cho anonymous — lý do nên dùng ECR riêng |
| Layer cache | Mỗi dòng Dockerfile = 1 layer | Sắp xếp `COPY package.json` trước `COPY . .` để cache tốt hơn |

### 5. Cách dùng nâng cao / pattern thực tế
Kỹ thuật ít người để ý: **multi-stage build** — dùng nhiều `FROM` trong 1 Dockerfile để build ở stage 1 (có compiler nặng) rồi chỉ copy artifact sang stage 2 (image runtime nhẹ), giảm image cuối từ 1GB xuống còn vài chục MB.

**Case thực tế**: 1 startup SaaS đang chạy monolith Node.js trên vài EC2 cố định, mỗi lần release phải SSH vào từng máy để `git pull` + restart — dễ lệch version giữa các máy, rollback thủ công chậm. Đội engineer đóng gói app thành Docker image, build multi-stage để giảm size, đẩy lên registry — bước tiếp theo (5.3) sẽ dùng ECS để chạy các image này với rollout đồng nhất.

### 6. Cấu hình/thiết lập liên quan
`Dockerfile` mẫu tối giản, vị trí: gốc thư mục source code.
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
CMD ["node", "dist/server.js"]
```
Thực tế cần đụng vào khi: thêm dependency mới (sửa `RUN npm install`), đổi cổng lắng nghe (sửa `EXPOSE`/code app), hoặc tối ưu size image trước khi đẩy production.

### 7. Vị trí trong kiến trúc (nhà máy nền)
Docker/container **chưa phải 1 trạm cụ thể** — nó là **khuôn đúc di động** để đóng gói công việc của thợ, thay cho việc phải xây nguyên 1 xưởng (VM/EC2) cho mỗi loại việc. Khuôn đúc này sẽ được **Đội trưởng điều phối (ECS/EKS, bài 5.3/5.8)** đặt vào đúng vị trí **Xưởng lắp ráp (mục 5 Nhà máy nền)** để vận hành. Đây là bước chuẩn bị nguyên liệu, chưa gắn vào bản đồ nền.

### 8. 5 câu hỏi ôn tập
1. Vì sao container khởi động nhanh hơn VM? → *Vì dùng chung kernel host, không phải boot cả 1 OS riêng.*
2. Multi-stage build giải quyết vấn đề gì? → *Giảm size image cuối bằng cách chỉ giữ lại artifact, bỏ compiler/tool build.*
3. Trong case startup SaaS, vấn đề gốc trước khi dùng Docker là gì? → *Deploy thủ công từng máy, dễ lệch version, rollback chậm.*
4. `docker run -p 8080:80` nghĩa là gì? → *Map cổng 8080 trên host sang cổng 80 bên trong container.*
5. Docker image quan hệ thế nào với vị trí trong nhà máy nền? → *Là khuôn đúc di động, chưa phải trạm — sẽ được ECS/EKS đặt vào Xưởng lắp ráp.*

---

## 5.3 — Amazon Elastic Container Service (ECS)

### 1. Khái niệm + ví dụ đời sống
ECS là dịch vụ **điều phối container** (container orchestration) của AWS: quyết định container nào chạy ở đâu, bao nhiêu bản, tự khởi động lại khi container chết. Ví dụ đời sống: ECS như **đội trưởng ca sản xuất** — cầm danh sách khuôn đúc (task definition) cần chạy, phân công thợ máy (EC2 hoặc Fargate) thực thi, phát hiện máy nào hỏng thì lập tức giao việc sang máy khác.

Hai khái niệm lõi:
- **Task Definition**: bản thiết kế (JSON) mô tả container nào, image nào, CPU/RAM bao nhiêu, port nào.
- **Task**: 1 lần chạy thật của task definition đó (giống 1 container instance đang sống).
- **Service**: giữ cho luôn có đúng N task chạy (tự thay task chết), thường đi kèm ALB.
- **Cluster**: nhóm hạ tầng (EC2 hoặc Fargate) mà các task chạy trên đó.

Hai launch type:
- **EC2 launch type**: bạn tự quản lý fleet EC2 làm "sàn nhà xưởng", ECS chỉ điều phối container lên đó — trả tiền theo EC2, kiểm soát OS/patch.
- **Fargate launch type**: serverless, không thấy EC2 nào cả, AWS tự cấp phát hạ tầng theo đúng CPU/RAM khai báo trong task definition — trả tiền theo task chạy.

### 2. Lệnh quan trọng
```bash
aws ecs create-cluster --cluster-name my-cluster                       # tạo cluster
aws ecs register-task-definition --cli-input-json file://task-def.json # đăng ký task definition
aws ecs create-service \
  --cluster my-cluster --service-name my-service \
  --task-definition my-task:1 --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-abc],securityGroups=[sg-abc],assignPublicIp=ENABLED}"
aws ecs list-tasks --cluster my-cluster                                 # liệt kê task đang chạy
aws ecs describe-services --cluster my-cluster --services my-service    # xem chi tiết service
aws ecs update-service --cluster my-cluster --service my-service --desired-count 4  # scale thủ công
aws ecs stop-task --cluster my-cluster --task <task-arn>                # dừng 1 task
```

**Từ điển flag nhanh:**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--cluster-name` | — | Tên cluster ECS |
| `--cli-input-json` | — | Nạp cấu hình từ file JSON thay vì gõ tay từng flag |
| `--desired-count` | — | Số task muốn duy trì chạy song song |
| `--launch-type` | — | `EC2` hoặc `FARGATE` — quyết định ai quản lý hạ tầng |
| `awsvpcConfiguration` | AWS VPC networking mode | Bắt buộc với Fargate — mỗi task có ENI riêng trong VPC |
| `assignPublicIp` | — | Task Fargate có cần public IP để ra Internet không (subnet public) |
| `--desired-count` (update) | — | Đổi số lượng task đang chạy, dùng để scale thủ công |

### 3. So sánh nhanh

| Tiêu chí | EC2 launch type | Fargate launch type |
|---|---|---|
| Quản lý hạ tầng | Bạn tự patch/scale EC2 | AWS tự quản lý hoàn toàn |
| Billing | Theo EC2 instance chạy (kể cả rảnh) | Theo vCPU/RAM task thực sự dùng, theo giây |
| Khởi động task | Nhanh nếu EC2 đã có sẵn slot trống | Chậm hơn chút (phải cấp phát hạ tầng mới) |
| Dùng khi | Cần tối ưu chi phí cao, kiểm soát OS, GPU đặc thù | Ưu tiên đơn giản, ít vận hành, workload không đều |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Fargate CPU/Memory combo | vd 0.25 vCPU – 0.5GB đến 4 vCPU – 30GB | Phải chọn đúng cặp hợp lệ theo bảng AWS, không tự do phối |
| Task definition revision | Tăng dần 1,2,3... | Update service sẽ rolling ra revision mới, revision cũ vẫn lưu để rollback |
| Container health check | Interval mặc định 30s | Có thể cấu hình riêng trong task definition, khác health check của ALB |

### 5. Cách dùng nâng cao / pattern thực tế
Ít người để ý: `aws ecs execute-command` cho phép **SSH-like vào bên trong 1 task Fargate đang chạy** (cần bật `enableExecuteCommand` khi tạo service) để debug mà không cần mở port SSH nào — vì Fargate vốn không cho SSH trực tiếp.

**Case thực tế**: 1 sàn giao dịch (trading platform) có microservice tính phí giao dịch, traffic dao động mạnh sáng/tối phiên. Trước đây chạy trên vài EC2 cố định 24/7 dù ban đêm gần như không ai giao dịch — lãng phí rõ. Chuyển sang ECS Fargate: task tự tăng/giảm theo Service Auto Scaling (bài 5.5), trả tiền đúng theo giờ giao dịch đông, không phải trả cho EC2 rảnh ban đêm.

### 6. Cấu hình/thiết lập liên quan
`task-def.json` — vị trí: file JSON đăng ký qua CLI hoặc Console.
```json
{
  "family": "my-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/my-app:v1",
      "portMappings": [{ "containerPort": 80, "protocol": "tcp" }],
      "essential": true
    }
  ]
}
```
Thực tế cần sửa khi: đổi image version (tag mới sau mỗi lần build ECR), tăng CPU/memory khi app cần nhiều tài nguyên hơn, hoặc thêm container phụ (sidecar, vd log agent).

### 7. Vị trí trong kiến trúc (nhà máy nền)
ECS là **Đội trưởng điều phối** đứng ngay tại **Xưởng lắp ráp (mục 5 Nhà máy nền)** — thay vì thợ cố định biên chế (EC2 trần trong ASG) hoặc thợ thời vụ gọi riêng lẻ (Lambda), ECS điều phối các **khuôn đúc container** chạy trên chính nền EC2 (launch type EC2, vẫn trong subnet private của khuôn viên VPC) hoặc trên nền hoàn toàn không thấy máy (launch type Fargate — vẫn nằm trong khuôn viên VPC nhờ `awsvpc` mode, chỉ là AWS giấu hạ tầng vật lý). Đây là **nhánh mới gắn thẳng vào mục 5**, không thay thế EC2/ASG mà là 1 cách khác để lấp đầy xưởng lắp ráp.

### 8. 5 câu hỏi ôn tập
1. Khác biệt cốt lõi giữa EC2 launch type và Fargate launch type? → *EC2: bạn quản lý hạ tầng; Fargate: AWS quản lý, bạn chỉ khai CPU/RAM.*
2. Vì sao sàn giao dịch trong case thực tế chuyển sang Fargate? → *Traffic dao động mạnh, EC2 cố định lãng phí ban đêm — Fargate trả tiền theo mức dùng thật.*
3. `execute-command` dùng để làm gì và vì sao quan trọng với Fargate? → *Debug bên trong task đang chạy mà không cần SSH — vì Fargate không hỗ trợ SSH trực tiếp.*
4. Task definition với Service khác nhau thế nào? → *Task definition là bản thiết kế; Service là cơ chế giữ đúng N task luôn chạy từ bản thiết kế đó.*
5. ECS khớp vào đâu trong nhà máy nền? → *Đội trưởng điều phối tại Xưởng lắp ráp (mục 5), chạy trên nền EC2 hoặc Fargate, vẫn trong khuôn viên VPC.*

---

## 5.4 — Amazon ECS and IAM Roles

### 1. Khái niệm + ví dụ đời sống
ECS dùng **2 loại IAM Role riêng biệt** cho mỗi task — dễ nhầm nhất trong cả section này:
- **Task Execution Role**: thẻ ra vào của **ECS Agent** (hạ tầng), dùng để *khởi động* task — pull image từ ECR, gửi log lên CloudWatch Logs, lấy secret từ Secrets Manager lúc container chưa chạy.
- **Task Role**: thẻ ra vào của **chính ứng dụng bên trong container** khi đang chạy — vd code gọi `s3:GetObject`, `dynamodb:PutItem`.

Ví dụ đời sống: Task Execution Role như **thẻ của đội hậu cần dựng sân khấu** (chuẩn bị trước khi diễn — kéo màn, bật đèn), Task Role như **thẻ của diễn viên đang biểu diễn trên sân khấu** (chỉ dùng khi show đang chạy) — 2 thẻ khác nhau, không dùng lẫn.

### 2. Lệnh quan trọng
```bash
aws iam create-role --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://ecs-trust-policy.json         # tạo role, trust ECS
aws iam attach-role-policy --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy  # gắn managed policy chuẩn
aws iam attach-role-policy --role-name myAppTaskRole \
  --policy-arn arn:aws:iam::123456789012:policy/MyAppS3ReadPolicy     # gắn quyền riêng cho app
```

**Từ điển flag nhanh:**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--assume-role-policy-document` | Trust Policy | Xác định "ai" (service nào) được phép mượn role này |
| `--policy-arn` | Amazon Resource Name | Định danh duy nhất của 1 IAM policy |
| `AmazonECSTaskExecutionRolePolicy` | — | Managed policy chuẩn AWS cấp sẵn cho Task Execution Role |

### 3. So sánh nhanh

| Tiêu chí | Task Execution Role | Task Role |
|---|---|---|
| Ai dùng | ECS Agent / hạ tầng | Code ứng dụng bên trong container |
| Khi nào dùng | Trước/trong lúc khởi động task | Trong lúc task đang chạy, xử lý business logic |
| Quyền ví dụ | `ecr:GetDownloadUrlForLayer`, `logs:CreateLogStream` | `s3:GetObject`, `dynamodb:Query` |
| Khai báo trong task-def | field `executionRoleArn` | field `taskRoleArn` |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| 1 task = 2 role riêng | executionRoleArn + taskRoleArn | Có thể dùng cùng 1 role cho cả 2 nhưng KHÔNG nên (vi phạm least privilege) |
| Session credentials | Tự động refresh qua metadata endpoint nội bộ | Container gọi `169.254.170.2` (ECS credentials endpoint), không cần hardcode key |

### 5. Cách dùng nâng cao / pattern thực tế
Pattern hay bị hỏi thi: nếu app trong container tự gọi `aws sts get-caller-identity` sẽ trả về **Task Role**, không phải Task Execution Role — vì Execution Role chỉ tồn tại trong vòng đời khởi động, ứng dụng runtime không "thấy" nó.

**Case thực tế**: 1 ngân hàng số có microservice xử lý giao dịch chạy trên ECS, audit yêu cầu chứng minh **container không có quyền dư thừa**. Đội bảo mật tách rõ: Task Execution Role chỉ có quyền pull ECR + ghi log (theo đúng managed policy chuẩn, không thêm gì), Task Role chỉ có đúng `dynamodb:PutItem/GetItem` trên 1 bảng cụ thể — khi audit, chứng minh ngay container không thể tự ý đọc bucket S3 khác vì Task Role không có quyền đó.

### 6. Cấu hình/thiết lập liên quan
Trong `task-def.json`, thêm 2 field:
```json
{
  "family": "my-task",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/myAppTaskRole"
}
```
Thực tế cần đụng khi: app cần gọi thêm 1 AWS service mới (thêm quyền vào Task Role, KHÔNG phải Execution Role), hoặc khi audit bảo mật yêu cầu rà soát least-privilege.

### 7. Vị trí trong kiến trúc (nhà máy nền)
Đây chính là **lớp thẻ ra vào IAM (mục 10 Nhà máy nền)** áp riêng vào **Đội trưởng ECS + khuôn đúc container tại Xưởng lắp ráp (mục 5)** — không phải trạm mới, mà là minh chứng cụ thể IAM phủ xuống tận cấp task chứ không chỉ cấp EC2 instance như trước (IAM Instance Profile ở Module 2).

### 8. 5 câu hỏi ôn tập
1. Task Execution Role dùng để làm gì, khác Task Role ở điểm nào? → *Execution Role phục vụ hạ tầng khởi động task (pull image, ghi log); Task Role phục vụ code app lúc chạy.*
2. `aws sts get-caller-identity` gọi từ trong container trả về role nào? → *Task Role — vì đó là role app runtime thấy được.*
3. Vì sao ngân hàng số trong case thực tế tách riêng 2 role rõ ràng? → *Để chứng minh least-privilege khi audit — container không có quyền dư ngoài đúng nhu cầu.*
4. Field nào trong task definition khai báo Task Role? → *`taskRoleArn`.*
5. IAM Role của ECS khớp vào đâu trong nhà máy nền? → *Là lớp thẻ ra vào (mục 10) áp xuống tận cấp task tại Xưởng lắp ráp (mục 5), không phải trạm mới.*

---

## 5.5 — Scaling Amazon ECS

### 1. Khái niệm + ví dụ đời sống
ECS có **2 tầng scaling độc lập**, dễ nhầm là 1:
- **Service Auto Scaling**: tăng/giảm **số lượng task** (giống ASG scale số EC2) dựa trên CloudWatch metric (CPU/Memory Utilization, hoặc ALB Request Count Per Target).
- **Cluster Auto Scaling (Capacity Provider)**: chỉ áp dụng với **EC2 launch type** — tăng/giảm **số EC2 instance làm nền** khi task không còn chỗ chạy. Fargate không cần tầng này vì AWS tự lo hạ tầng.

Ví dụ đời sống: Service Auto Scaling như **tăng/giảm số ca làm việc của thợ trong xưởng có sẵn**; Cluster Auto Scaling như **xây thêm/dỡ bớt cả nhà xưởng** khi xưởng hiện tại hết chỗ chứa thợ.

### 2. Lệnh quan trọng
```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/my-cluster/my-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 --max-capacity 10                       # khai báo target có thể scale

aws application-autoscaling put-scaling-policy \
  --service-namespace ecs --resource-id service/my-cluster/my-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-target-tracking --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://policy.json   # tạo policy target tracking
```

**Từ điển flag nhanh:**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `register-scalable-target` | — | Khai báo resource nào (ECS service) sẽ được auto scale |
| `--scalable-dimension` | — | Chiều scale — ở đây là số task mong muốn (`DesiredCount`) |
| `--min-capacity` / `--max-capacity` | — | Biên dưới/trên số task |
| `TargetTrackingScaling` | — | Loại policy giữ 1 metric bám theo giá trị target (giống ASG) |

### 3. So sánh nhanh

| Tiêu chí | Service Auto Scaling | Cluster Auto Scaling (Capacity Provider) |
|---|---|---|
| Scale cái gì | Số task | Số EC2 instance nền |
| Áp dụng launch type | Cả EC2 và Fargate | Chỉ EC2 |
| Trigger | CloudWatch metric của service | Task pending vì thiếu tài nguyên trên cluster |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Target Tracking metric phổ biến | `ECSServiceAverageCPUUtilization` | Giữ CPU trung bình bám theo % target, giống ASG |
| Step Scaling | tùy chỉnh theo ngưỡng | Dùng khi cần phản ứng theo bậc thay vì bám 1 target duy nhất |

### 5. Cách dùng nâng cao / pattern thực tế
Pattern nâng cao: kết hợp scale theo **ALB Request Count Per Target** thay vì chỉ CPU — hợp lý hơn cho app I/O-bound (chờ DB/API ngoài nhiều hơn là tốn CPU), vì CPU thấp không có nghĩa là app đang rảnh.

**Case thực tế**: 1 nền tảng TMĐT có service ECS xử lý giỏ hàng — CPU luôn thấp (chủ yếu chờ gọi DynamoDB) nhưng khi vào giờ flash sale, số request tăng vọt làm latency tăng dù CPU chưa cao. Đội SRE đổi metric scale từ CPU sang `ALBRequestCountPerTarget`, giúp service tăng task đúng lúc traffic tăng thay vì đợi CPU chạm ngưỡng (lúc đó đã trễ).

### 6. Cấu hình/thiết lập liên quan
`policy.json` cho target tracking:
```json
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleOutCooldown": 60,
  "ScaleInCooldown": 120
}
```
Thực tế cần chỉnh khi: metric mặc định (CPU) không phản ánh đúng tải thật (đổi sang ALB request count), hoặc scale-in quá nhanh gây dao động (tăng `ScaleInCooldown`).

### 7. Vị trí trong kiến trúc (nhà máy nền)
Service Auto Scaling khớp vào đúng cơ chế **"đông thợ hơn khi đơn hàng tăng"** đã mô tả sẵn ở mục 5 Nhà máy nền — chỉ là áp dụng cho task container thay vì EC2 trần. Cluster Auto Scaling (Capacity Provider) là phần **mở rộng chính mặt bằng xưởng (EC2 nền)** khi launch type là EC2 — cùng vị trí mục 5, không phải trạm mới.

### 8. 5 câu hỏi ôn tập
1. Service Auto Scaling và Cluster Auto Scaling khác nhau ở điểm nào? → *Service scale số task; Cluster scale số EC2 nền (chỉ launch type EC2).*
2. Vì sao TMĐT trong case thực tế đổi metric từ CPU sang ALB request count? → *Vì service I/O-bound, CPU thấp dù đang quá tải request thật.*
3. Fargate có cần Cluster Auto Scaling không? → *Không — AWS tự quản lý hạ tầng, không có khái niệm EC2 nền để scale.*
4. `ScaleInCooldown` dùng để làm gì? → *Ngăn scale-in quá nhanh gây dao động số task liên tục.*
5. Scaling ECS khớp vào đâu trong nhà máy nền? → *Đúng cơ chế "đông thợ khi đơn hàng tăng" ở mục 5, áp dụng cho task/EC2 nền tùy launch type.*

---

## 5.6 — Amazon ECS with ALB

### 1. Khái niệm + ví dụ đời sống
Khi 1 service ECS chạy nhiều task trên cùng 1 EC2 (launch type EC2), mỗi task cần cổng khác nhau vì cùng share 1 IP máy chủ — đây là lý do cần **Dynamic Port Mapping**: ALB tự biết task nào đang lắng nghe cổng nào qua Target Group kiểu `ip` hoặc thông qua ECS tự đăng ký. Với Fargate, mỗi task có ENI + IP riêng (nhờ `awsvpc` mode) nên không cần dynamic port — ALB trỏ thẳng theo IP task.

Ví dụ đời sống: Dynamic Port Mapping như **nhiều gian hàng trong cùng 1 tòa nhà (1 EC2)** — mỗi gian phải có số phòng riêng (cổng riêng) dù chung địa chỉ tòa nhà, và có 1 sảnh lễ tân (ALB) biết chính xác khách cần phòng nào.

### 2. Lệnh quan trọng
```bash
aws elbv2 create-target-group \
  --name ecs-tg --protocol HTTP --port 80 \
  --vpc-id vpc-abc --target-type ip                     # target-type ip bắt buộc cho Fargate/awsvpc mode

aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> --protocol HTTP --port 80 \
  --default-actions Type=forward,TargetGroupArn=<tg-arn>  # gắn listener trỏ vào target group

aws ecs create-service \
  --cluster my-cluster --service-name my-service \
  --task-definition my-task:1 --desired-count 2 \
  --load-balancers "targetGroupArn=<tg-arn>,containerName=app,containerPort=80"  # gắn service với ALB
```

**Từ điển flag nhanh:**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `--target-type ip` | — | Target group trỏ thẳng theo IP task (bắt buộc cho Fargate) |
| `--target-type instance` | — | Target group trỏ theo EC2 instance + cổng dynamic (dùng cho EC2 launch type kiểu cũ) |
| `--load-balancers` | — | Gắn service ECS với 1 target group cụ thể |
| `containerPort` | — | Cổng bên trong container mà ALB forward traffic tới |

### 3. So sánh nhanh

| Tiêu chí | EC2 launch type (dynamic port) | Fargate (awsvpc mode) |
|---|---|---|
| Target type | `instance` (thường) | `ip` (bắt buộc) |
| Số IP | Nhiều task chung 1 IP EC2, khác port | Mỗi task 1 ENI + IP riêng |
| Security Group | Gắn ở EC2 instance | Gắn trực tiếp ở từng task |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Health check deregistration delay | mặc định 300s | Có thể giảm để rolling deploy nhanh hơn, cẩn thận request đang xử lý bị cắt |
| Số target group / service | 1 target group / 1 load balancer config trong service | Muốn nhiều path/port cần thêm listener rule |

### 5. Cách dùng nâng cao / pattern thực tế
Pattern hay dùng: **Blue/Green deployment qua CodeDeploy + 2 target group** cho ECS service — traffic chuyển dần từ target group cũ sang mới, rollback tức thì nếu health check mới fail, không downtime.

**Case thực tế**: 1 team vận hành K8s-adjacent (nhưng vẫn dùng ECS cho phần workload đơn giản hơn) cần release version mới của API mỗi tuần mà không được downtime dù 1 giây (SLA khách hàng doanh nghiệp). Họ cấu hình ECS service update với deployment configuration `minimumHealthyPercent: 100%, maximumPercent: 200%` — luôn giữ đủ task cũ chạy trong lúc task mới khởi động và pass health check trước khi ALB chuyển traffic.

### 6. Cấu hình/thiết lập liên quan
Trong `create-service`, thêm `deploymentConfiguration`:
```json
{
  "deploymentConfiguration": {
    "minimumHealthyPercent": 100,
    "maximumPercent": 200
  }
}
```
Thực tế cần chỉnh khi: cần release zero-downtime (tăng `maximumPercent`), hoặc khi cluster giới hạn tài nguyên không cho phép chạy dư task (giảm `maximumPercent` nhưng chấp nhận có gián đoạn ngắn).

### 7. Vị trí trong kiến trúc (nhà máy nền)
Đây là ứng dụng cụ thể của **mục 4 Nhà máy nền — Sảnh phân luồng ALB** khi đối tượng phân luồng không còn là EC2 nguyên khối mà là **từng task container** tại Xưởng lắp ráp (mục 5) — không phải trạm mới, chỉ là ALB "nhìn xuống" tới cấp task/IP thay vì cấp EC2.

### 8. 5 câu hỏi ôn tập
1. Vì sao Fargate luôn dùng target-type `ip`? → *Vì mỗi task Fargate có ENI/IP riêng nhờ awsvpc mode, không share port như EC2 launch type.*
2. Dynamic Port Mapping giải quyết vấn đề gì? → *Nhiều task chung 1 EC2 cần cổng khác nhau vì chung IP máy chủ.*
3. `maximumPercent: 200%` trong deployment configuration nghĩa là gì? → *Cho phép tạm chạy gấp đôi desired count trong lúc rolling update, đảm bảo đủ task cũ+mới không downtime.*
4. Security Group gắn ở đâu khi dùng Fargate với ALB? → *Gắn trực tiếp ở từng task (ENI riêng), không phải ở EC2.*
5. ECS + ALB khớp vào đâu trong nhà máy nền? → *Vẫn là Sảnh phân luồng ALB (mục 4), chỉ phân luồng xuống tới cấp task tại Xưởng lắp ráp (mục 5).*

---

## 5.8 — Amazon Elastic Kubernetes Service (EKS)

### 1. Khái niệm + ví dụ đời sống
EKS là dịch vụ **Kubernetes được AWS quản lý control plane** — thay vì dùng "ngôn ngữ điều phối" riêng của AWS (ECS Task/Service/Cluster), EKS dùng chuẩn **Kubernetes mở** (Pod, Deployment, Service, Node) mà nhiều công ty đã quen dùng on-premise hoặc đa-cloud. Ví dụ đời sống: nếu ECS là **đội trưởng nói tiếng riêng của nhà máy AWS**, EKS là **đội trưởng nói ngôn ngữ quốc tế chuẩn (Kubernetes)** — ai từng làm việc ở nhà máy khác (GCP/on-prem) cũng hiểu ngay cách chỉ huy.

- **Control Plane**: AWS quản lý hoàn toàn (API server, etcd...), bạn không thấy, không SSH vào được.
- **Worker Node**: EC2 (Managed Node Group hoặc self-managed) hoặc **Fargate profile** (serverless, giống ECS Fargate).
- **Pod**: đơn vị nhỏ nhất chạy container trong Kubernetes (tương đương gần với Task của ECS).

### 2. Lệnh quan trọng
```bash
eksctl create cluster --name my-cluster --region ap-southeast-1 --nodegroup-name ng-1 --node-type t3.medium --nodes 2  # tạo cluster + node group nhanh
aws eks update-kubeconfig --name my-cluster --region ap-southeast-1    # nạp cấu hình để kubectl kết nối được
kubectl get nodes                                                       # liệt kê worker node
kubectl get pods -A                                                     # liệt kê pod ở mọi namespace
kubectl apply -f deployment.yaml                                        # deploy 1 Deployment từ file YAML
kubectl scale deployment my-app --replicas=5                            # scale số pod thủ công
```

**Từ điển flag nhanh:**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `eksctl` | EKS command-line tool | Công cụ chính thức tạo/xóa cluster EKS nhanh (không phải aws cli thuần) |
| `update-kubeconfig` | — | Ghi thông tin kết nối cluster vào `~/.kube/config` để `kubectl` dùng |
| `kubectl` | Kubernetes control | CLI chuẩn Kubernetes, dùng chung mọi nơi (không riêng AWS) |
| `-A` | all-namespaces | Xem tài nguyên ở mọi namespace, không chỉ `default` |
| `--replicas` | — | Số bản sao (pod) mong muốn của 1 Deployment |

### 3. So sánh nhanh

| Tiêu chí | Amazon ECS | Amazon EKS |
|---|---|---|
| Chuẩn điều phối | Riêng của AWS | Kubernetes mở, chuẩn ngành |
| Độ phức tạp | Đơn giản hơn, ít khái niệm | Nhiều khái niệm hơn (Pod, Service, Ingress, ConfigMap...) |
| Chi phí control plane | Miễn phí (chỉ trả hạ tầng chạy task) | Có phí cố định/cluster/giờ cho control plane |
| Portability | Gắn chặt AWS | Dễ mang sang cloud khác/on-prem vì cùng chuẩn K8s |
| Dùng khi | Team nhỏ, không cần đa-cloud, ưu tiên đơn giản | Team đã có kinh nghiệm K8s, cần portability hoặc hệ sinh thái K8s (Helm, Istio...) |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| EKS control plane fee | tính theo giờ/cluster | Cộng thêm phí worker node (EC2/Fargate) riêng |
| Managed Node Group | tự động patch AMI, tích hợp ASG | Vẫn phải tự quản lý version Kubernetes upgrade |
| Fargate profile trên EKS | chọn theo namespace | Không phải mọi pod đều chạy được trên Fargate (vd cần hostNetwork sẽ không hỗ trợ) |

### 5. Cách dùng nâng cao / pattern thực tế
Pattern ít người để ý: dùng `kubectl get pods -o wide` để xem pod đang chạy trên node nào, hoặc `kubectl describe pod <name>` để lộ ra lý do pod Pending (thường do thiếu tài nguyên trên node group, giống lý do Cluster Auto Scaling cần trigger ở ECS).

**Case thực tế**: 1 công ty đa quốc gia đã vận hành Kubernetes on-premise nhiều năm, muốn dịch chuyển 1 phần workload lên cloud nhưng giữ nguyên toàn bộ pipeline CI/CD, Helm chart, monitoring (Prometheus) đã có sẵn cho Kubernetes — không muốn viết lại toàn bộ theo khái niệm ECS. Họ chọn EKS vì giữ nguyên được tooling K8s hiện có, chỉ cần trỏ `kubectl` sang cluster mới trên AWS, giảm effort di trú so với viết lại bằng ECS.

### 6. Cấu hình/thiết lập liên quan
`deployment.yaml` mẫu:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels: { app: my-app }
  template:
    metadata:
      labels: { app: my-app }
    spec:
      containers:
        - name: app
          image: 123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/my-app:v1
          ports: [{ containerPort: 80 }]
```
Thực tế cần đụng khi: đổi image version, đổi số `replicas`, hoặc thêm `resources.limits` để tránh 1 pod ăn hết tài nguyên node.

### 7. Vị trí trong kiến trúc (nhà máy nền)
EKS là **nhánh mới song song với ECS**, cùng đứng ở **Xưởng lắp ráp (mục 5 Nhà máy nền)** — cùng vai trò "đội trưởng điều phối khuôn đúc container", chỉ khác "ngôn ngữ chỉ huy" (Kubernetes chuẩn quốc tế thay vì ngôn ngữ riêng AWS). Worker node của EKS vẫn là EC2 hoặc Fargate, vẫn nằm trong khuôn viên VPC như ECS.

### 8. 5 câu hỏi ôn tập
1. Khác biệt cốt lõi giữa ECS và EKS là gì? → *ECS dùng chuẩn điều phối riêng của AWS; EKS dùng chuẩn Kubernetes mở.*
2. Vì sao công ty đa quốc gia trong case thực tế chọn EKS thay vì ECS? → *Đã có sẵn toàn bộ tooling K8s (Helm, CI/CD, Prometheus), muốn giữ nguyên không viết lại.*
3. `eksctl` khác `aws eks` CLI ở điểm nào? → *`eksctl` là tool chuyên dụng tạo cluster nhanh gọn (nhiều bước gộp 1 lệnh), `aws eks` là CLI chuẩn từng thao tác riêng lẻ.*
4. Control plane của EKS ai quản lý? → *AWS quản lý hoàn toàn, người dùng không SSH/thấy được.*
5. EKS khớp vào đâu trong nhà máy nền? → *Nhánh đội trưởng điều phối thứ 2 (song song ECS) tại Xưởng lắp ráp (mục 5), chạy trên nền EC2 hoặc Fargate.*

---

## 5.9 — Amazon Elastic Container Registry (ECR)

### 1. Khái niệm + ví dụ đời sống
ECR là **registry lưu trữ Docker image riêng tư trên AWS**, tích hợp sẵn IAM để kiểm soát ai được push/pull — thay thế Docker Hub công cộng khi cần bảo mật/tốc độ pull nhanh trong cùng Region. Ví dụ đời sống: ECR như **kho khuôn mẫu nội bộ của nhà máy** — chỉ nhân viên có thẻ ra vào đúng mới lấy được khuôn ra dùng, khác với Docker Hub như **chợ khuôn mẫu công cộng ngoài phố** ai cũng ghé được (trừ khi đặt private).

### 2. Lệnh quan trọng
```bash
aws ecr create-repository --repository-name my-app                      # tạo repo mới
aws ecr get-login-password --region ap-southeast-1 \
  | docker login --username AWS --password-stdin 123456789012.dkr.ecr.ap-southeast-1.amazonaws.com  # đăng nhập docker vào ECR
docker tag my-app:v1 123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/my-app:v1  # gắn tag đúng URI ECR
docker push 123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/my-app:v1  # đẩy image lên ECR
aws ecr describe-images --repository-name my-app                         # xem danh sách image + tag trong repo
aws ecr put-lifecycle-policy --repository-name my-app --lifecycle-policy-text file://lifecycle.json  # tự xóa image cũ
```

**Từ điển flag nhanh:**

| Flag/Lệnh | Viết tắt / nguồn gốc | Ý nghĩa |
|---|---|---|
| `get-login-password` | — | Lấy token tạm thời để login Docker vào registry ECR |
| `--password-stdin` | standard input | Nhận password qua pipe thay vì gõ trực tiếp (an toàn hơn, không lưu history) |
| `docker tag` | — | Gắn tên đầy đủ (registry URI) cho image trước khi push |
| `put-lifecycle-policy` | — | Đặt quy tắc tự động xóa image cũ/không dùng theo điều kiện |

### 3. So sánh nhanh

| Tiêu chí | Amazon ECR | Docker Hub |
|---|---|---|
| Kiểm soát quyền | IAM tích hợp, theo repo | Tài khoản Docker Hub riêng |
| Vị trí | Trong AWS, cùng Region với ECS/EKS | Bên ngoài, qua Internet |
| Rate limit pull | Không giới hạn theo kiểu Docker Hub free | Có rate-limit với tài khoản free/anonymous |
| Scan lỗ hổng | Có sẵn (ECR Image Scanning) | Cần tool ngoài (trừ Docker Hub Pro) |

### 4. Giới hạn/tham số quan trọng

| Khái niệm/Tham số | Giá trị/Ví dụ | Ghi chú |
|---|---|---|
| Login token ECR | hết hạn sau 12 giờ | Phải `get-login-password` lại nếu quá hạn |
| ECR Image Scanning | Basic (miễn phí) hoặc Enhanced (tích hợp Inspector) | Basic quét khi push, Enhanced quét liên tục |
| Lifecycle Policy | theo số lượng image giữ lại hoặc theo tuổi | Tránh phình chi phí lưu trữ image cũ vô hạn |

### 5. Cách dùng nâng cao / pattern thực tế
Pattern hay dùng: bật **ECR Image Scanning** (tích hợp Amazon Inspector) để tự động quét CVE mỗi lần push image — chặn ngay từ registry trước khi image lỡ được deploy ra production.

**Case thực tế**: 1 ngân hàng số bị audit bảo mật yêu cầu chứng minh mọi image chạy production đều được quét lỗ hổng trước khi deploy. Đội DevOps cấu hình pipeline CI/CD: build image → push lên ECR (tự kích hoạt scan) → pipeline chỉ tiếp tục deploy sang ECS nếu kết quả scan không có CVE mức CRITICAL — biến ECR thành 1 cổng kiểm soát bắt buộc, không chỉ là kho lưu trữ.

### 6. Cấu hình/thiết lập liên quan
`lifecycle.json` — tự xóa image cũ để tiết kiệm chi phí:
```json
{
  "rules": [
    {
      "rulePriority": 1,
      "selection": {
        "tagStatus": "untagged",
        "countType": "sinceImagePushed",
        "countUnit": "days",
        "countNumber": 14
      },
      "action": { "type": "expire" }
    }
  ]
}
```
Thực tế cần đụng khi: repo phình quá nhiều image cũ không dùng (build test/CI để lại), cần dọn tự động thay vì xóa tay.

### 7. Vị trí trong kiến trúc (nhà máy nền)
ECR là **trạm mới**: **"Kho khuôn mẫu nội bộ có khóa"** — đứng gần với logic của Kho ảnh/file tĩnh S3 (mục 8, cũng nằm ngoài tường VPC về mặt network) nhưng chuyên biệt cho container image, có lớp thẻ ra vào IAM (mục 10) riêng theo từng repo. Đội trưởng ECS/EKS tại Xưởng lắp ráp (mục 5) sẽ **kéo khuôn mẫu từ đây về** mỗi khi khởi động task/pod mới (qua Task Execution Role, bài 5.4).

### 8. 5 câu hỏi ôn tập
1. ECR khác Docker Hub ở điểm cốt lõi nào? → *ECR tích hợp IAM theo từng repo, nằm trong AWS, có scan lỗ hổng sẵn; Docker Hub là registry công cộng bên ngoài.*
2. Vì sao ngân hàng số trong case thực tế biến ECR thành "cổng kiểm soát bắt buộc"? → *Pipeline chỉ deploy tiếp nếu ECR scan không phát hiện CVE Critical — đảm bảo mọi image production đều được kiểm tra.*
3. Lifecycle Policy trong ECR giải quyết vấn đề gì? → *Tự động xóa image cũ/untagged để tránh phình chi phí lưu trữ.*
4. Ai (role nào) thực sự kéo image từ ECR khi 1 task ECS khởi động? → *Task Execution Role (bài 5.4), không phải Task Role.*
5. ECR khớp vào đâu trong nhà máy nền? → *Trạm mới "Kho khuôn mẫu có khóa", cạnh logic S3 (mục 8) nhưng chuyên container image, được Xưởng lắp ráp (mục 5) kéo về qua IAM (mục 10).*

---

# BƯỚC 1.5 — Lab tổng của section

## 🧭 Lab: Đưa 1 ứng dụng container hóa lên production-ready trên AWS trong tuần đầu

**Bối cảnh**: Bạn vừa vào 1 startup SaaS (case xuyên suốt bài 5.2–5.9) — nhiệm vụ tuần đầu: đóng gói app Node.js thành Docker image, đẩy lên ECR, chạy trên ECS Fargate với ALB đứng trước, rồi thử nghiệm nhanh AWS App Runner để so sánh mức độ "khỏi lo hạ tầng" tối đa.

### Bước 1 — Chuẩn bị Dockerfile và build image local
```bash
mkdir demo-app && cd demo-app
cat > server.js << 'EOF'
const http = require('http');
http.createServer((req, res) => res.end('Hello from container!')).listen(80);
EOF
cat > Dockerfile << 'EOF'
FROM node:20-alpine
WORKDIR /app
COPY server.js .
CMD ["node", "server.js"]
EOF
docker build -t demo-app:v1 .          # build image, kiểm tra local trước khi đẩy lên cloud
docker run -d -p 8080:80 demo-app:v1   # test nhanh local: curl localhost:8080 phải trả "Hello from container!"
```

### Bước 2 — Tạo ECR repo và đẩy image lên (bài 5.9)
```bash
aws ecr create-repository --repository-name demo-app --region ap-southeast-1
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws ecr get-login-password --region ap-southeast-1 \
  | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com
docker tag demo-app:v1 $ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/demo-app:v1
docker push $ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/demo-app:v1   # image giờ nằm trong "kho khuôn mẫu" riêng
```

### Bước 3 — Tạo 2 IAM Role cho ECS (bài 5.4)
```bash
aws iam create-role --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
aws iam attach-role-policy --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
# Task Role riêng cho app — ví dụ chỉ cần đọc 1 bucket cấu hình, không cần thêm gì khác ở bước demo này
aws iam create-role --role-name demoAppTaskRole \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
```

### Bước 4 — Tạo cluster, task definition, service Fargate (bài 5.3)
```bash
aws ecs create-cluster --cluster-name demo-cluster

cat > task-def.json << EOF
{
  "family": "demo-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256", "memory": "512",
  "executionRoleArn": "arn:aws:iam::$ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::$ACCOUNT_ID:role/demoAppTaskRole",
  "containerDefinitions": [{
    "name": "app",
    "image": "$ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/demo-app:v1",
    "portMappings": [{ "containerPort": 80, "protocol": "tcp" }],
    "essential": true
  }]
}
EOF
aws ecs register-task-definition --cli-input-json file://task-def.json
```

### Bước 5 — Tạo ALB + Target Group kiểu `ip` (bài 5.6), rồi tạo Service
```bash
# Giả định đã có VPC/subnet/SG từ Module 3 — dùng lại đúng khuôn viên đã dựng
aws elbv2 create-target-group --name demo-tg --protocol HTTP --port 80 \
  --vpc-id $VPC_ID --target-type ip

ALB_ARN=$(aws elbv2 create-load-balancer --name demo-alb --subnets $SUBNET_1 $SUBNET_2 \
  --security-groups $SG_ALB --query 'LoadBalancers[0].LoadBalancerArn' --output text)

TG_ARN=$(aws elbv2 describe-target-groups --names demo-tg --query 'TargetGroups[0].TargetGroupArn' --output text)

aws elbv2 create-listener --load-balancer-arn $ALB_ARN --protocol HTTP --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN

aws ecs create-service \
  --cluster demo-cluster --service-name demo-service \
  --task-definition demo-task:1 --desired-count 2 --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2],securityGroups=[$SG_TASK],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$TG_ARN,containerName=app,containerPort=80"  # ALB giờ phân traffic tới 2 task Fargate
```

### Bước 6 — Bật Service Auto Scaling (bài 5.5)
```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs --resource-id service/demo-cluster/demo-service \
  --scalable-dimension ecs:service:DesiredCount --min-capacity 2 --max-capacity 6

aws application-autoscaling put-scaling-policy \
  --service-namespace ecs --resource-id service/demo-cluster/demo-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-target --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{"TargetValue":70.0,"PredefinedMetricSpecification":{"PredefinedMetricType":"ECSServiceAverageCPUUtilization"}}'
```

### Bước 7 — So sánh nhanh với App Runner (gộp từ 5.10, để thấy sự khác biệt mức độ đơn giản)
```bash
aws apprunner create-service \
  --service-name demo-apprunner \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "'"$ACCOUNT_ID"'.dkr.ecr.ap-southeast-1.amazonaws.com/demo-app:v1",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": { "Port": "80" }
    },
    "AutoDeploymentsEnabled": true
  }'
# App Runner tự tạo cả load balancer + domain HTTPS + scaling — không cần tự dựng ALB/target group/cluster như ECS
```

### ✅ Lệnh verify
```bash
curl http://$(aws elbv2 describe-load-balancers --names demo-alb --query 'LoadBalancers[0].DNSName' --output text)
# Kỳ vọng: "Hello from container!"

aws ecs describe-services --cluster demo-cluster --services demo-service \
  --query 'services[0].{running:runningCount,desired:desiredCount}'
# Kỳ vọng: running == desired == 2
```

### 🧹 Cleanup
```bash
aws ecs update-service --cluster demo-cluster --service demo-service --desired-count 0
aws ecs delete-service --cluster demo-cluster --service demo-service
aws elbv2 delete-listener --listener-arn <listener-arn>
aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN
aws elbv2 delete-target-group --target-group-arn $TG_ARN
aws ecs delete-cluster --cluster demo-cluster
aws ecr batch-delete-image --repository-name demo-app --image-ids imageTag=v1
aws ecr delete-repository --repository-name demo-app --force
aws apprunner delete-service --service-arn <apprunner-service-arn>
aws iam detach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
aws iam delete-role --role-name ecsTaskExecutionRole
aws iam delete-role --role-name demoAppTaskRole
```

### ⚠️ Lưu ý dễ sai/dễ tốn phí
- Quên xóa ALB — ALB tính phí theo giờ dù không có traffic, dễ bị bỏ quên nhất trong lab.
- App Runner tự bật `AutoDeploymentsEnabled` sẽ tự deploy lại mỗi khi có image mới trong ECR — nhớ tắt nếu không muốn tốn phí build lại ngoài ý muốn.
- Fargate task cần `assignPublicIp=ENABLED` nếu đặt ở subnet public để pull được image ECR (hoặc dùng VPC Endpoint cho ECR nếu ở subnet private — xem lại bài 3.11 Module 3).
- Xóa ECR repo phải xóa hết image trước (`--force` để ép xóa cả khi còn image).

---

# 📋 Cheat Sheet — Docker Containers and ECS

### Exam Cram (tóm tắt nhanh)
- **ECS EC2 launch type**: bạn quản lý fleet EC2 nền — trả tiền theo EC2, kiểm soát OS.
- **ECS Fargate**: serverless, trả theo vCPU/RAM task thực dùng, mỗi task có ENI riêng (`awsvpc` mode) → target-type ALB phải là `ip`.
- **Task Execution Role** (hạ tầng: pull ECR, ghi log) ≠ **Task Role** (app runtime gọi AWS service).
- **Service Auto Scaling** (số task) ≠ **Cluster Auto Scaling/Capacity Provider** (số EC2 nền, chỉ EC2 launch type).
- **EKS** = Kubernetes chuẩn mở trên AWS, control plane AWS quản lý, worker node EC2/Fargate.
- **ECR** = registry riêng tư tích hợp IAM, có Image Scanning tích hợp Inspector.
- **App Runner** = mức trừu tượng cao nhất — tự động cả ALB, domain HTTPS, scaling, chỉ cần đưa image/source code vào.

### Architecture Patterns (tóm tắt)
| Tình huống thi hay gặp | Chọn gì |
|---|---|
| Cần chạy container, tối giản vận hành, không cần quản lý server | ECS Fargate |
| Team đã có sẵn Kubernetes/Helm, cần portability đa-cloud | EKS |
| Chỉ cần deploy nhanh 1 container/API, không muốn tự dựng ALB/cluster | App Runner |
| Muốn tối ưu chi phí sâu, kiểm soát tuning OS/kernel | ECS/EKS trên EC2 launch type (không Fargate) |
| Cần audit bảo mật image trước khi deploy | ECR Image Scanning trong pipeline CI/CD |
| App scale theo request nhiều hơn CPU | Service Auto Scaling theo `ALBRequestCountPerTarget` |

> 💡 **Pattern chuẩn cần nhớ nằm lòng**: *Docker build → ECR push (kèm Image Scanning) → ECS/EKS Task/Pod định nghĩa 2 role riêng (Execution vs Task) → chạy trên Fargate (đơn giản) hoặc EC2 (tối ưu chi phí) → ALB target-type `ip` phân traffic → Service Auto Scaling theo đúng metric phản ánh tải thật (CPU hoặc request count) — hoặc bỏ qua tất cả, dùng App Runner nếu chỉ cần nhanh gọn.*

---

## 🏭 Trạm mới thêm vào nhà máy nền ở section này

| Trạm/nhánh mới | Bài | Gắn vào đâu trong bản đồ nền |
|---|---|---|
| **Đội trưởng điều phối khuôn đúc — ECS** | 5.3 | Nhánh mới tại mục 5 (Xưởng lắp ráp), điều phối container trên nền EC2 hoặc Fargate |
| **Đội trưởng điều phối chuẩn quốc tế — EKS** | 5.8 | Nhánh song song với ECS, cùng mục 5, dùng chuẩn Kubernetes mở |
| **Kho khuôn mẫu nội bộ có khóa — ECR** | 5.9 | Trạm mới, logic gần S3 (mục 8) nhưng chuyên container image, có IAM (mục 10) riêng theo repo |

*(Docker/Microservices bài 5.2 chỉ là khái niệm đóng gói, chưa phải trạm. IAM Role của ECS bài 5.4 và Scaling bài 5.5/ALB bài 5.6 đều là ứng dụng cụ thể của lớp IAM (mục 10) và mục 4/5 có sẵn, không phải trạm mới. App Runner (5.10, trong lab) là 1 mức trừu tượng cao hơn của cùng nhánh Xưởng lắp ráp container — tự gộp cả ALB lẫn scaling vào 1 dịch vụ, không tách trạm riêng.)*

*(Tiếp theo → Section: Serverless Applications, nơi thợ thời vụ Lambda sẽ chính thức xuất hiện và hệ thống loa phóng thanh SQS/SNS/EventBridge được mở rộng.)*
