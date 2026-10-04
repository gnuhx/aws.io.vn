# 📘 SAA-C03 — Module 4: Tài liệu học đầy đủ (4.53 → 4.69)

> Gom toàn bộ phần giải thích đã làm trong chat. Đi kèm 4 file HTML minh họa (xem cuối file).
> Ẩn dụ xuyên suốt: **nhà máy** — EC2 = xưởng chế biến, RDS = kho tổng, ElastiCache = quầy tạm cạnh xưởng, DynamoDB = kệ hàng mã vạch.

## Mục lục
- [4.53 ElastiCache](#453--amazon-elasticache)
- [4.54 Scaling ElastiCache](#454--scaling-elasticache)
- [Hỏi đáp: Redis restart có mất data không? ElastiCache chạy trên gì?](#hỏi-đáp-phụ-về-elasticache)
- [4.55 DynamoDB](#455--amazon-dynamodb)
- [4.57 DynamoDB Streams](#457--dynamodb-streams)
- [4.58 DAX](#458--dynamodb-accelerator-dax)
- [4.59 Global Tables](#459--dynamodb-global-tables)
- [4.61 Redshift](#461--amazon-redshift)
- [4.62 EMR](#462--amazon-emr)
- [4.63 Kinesis](#463--amazon-kinesis)
- [4.64 Athena và Glue](#464--amazon-athena-và-aws-glue)
- [4.66 OpenSearch](#466--amazon-opensearch-service)
- [4.67 AWS Batch](#467--aws-batch)
- [4.68 Other Database Services](#468--other-database-services)
- [4.69 Other Analytics Services](#469--other-analytics-services)
- [Bức tranh lớn + câu chốt hạ](#bức-tranh-lớn--câu-chốt-hạ)
- [Danh sách file HTML](#danh-sách-file-html)

---

## 4.53 — Amazon ElastiCache

### Khái niệm + ví dụ
Dịch vụ cache **in-memory** do AWS quản lý: dữ liệu nằm trong RAM nên đọc/ghi ở mức micro-giây thay vì mili-giây như DB thường.

| | Redis | Memcached |
|---|---|---|
| Persistence | Có (snapshot) | **Không** |
| Replication / HA | Có | Không built-in |
| Cấu trúc dữ liệu | Phong phú: string, list, hash, set, sorted set | Chỉ key-value string |
| Threading | Single-threaded | **Multi-threaded** |

**Ẩn dụ**: quầy tạm cạnh xưởng — để sẵn vài món hay dùng, khỏi chạy vào kho tổng (DB) mỗi lần.

### Pattern nâng cao / case thực tế
| Pattern | Cách chạy | Ưu | Nhược |
|---|---|---|---|
| **Lazy Loading (Cache-Aside)** | App check cache → miss thì query DB → ghi vào cache → trả kết quả | Chỉ cache dữ liệu thực sự được hỏi | Lần đầu luôn miss (chậm); dữ liệu có thể cũ (stale) |
| **Write-Through** | Mỗi lần ghi DB thì ghi luôn vào cache | Cache luôn mới | Ghi chậm hơn (2 nơi); tốn cache cho dữ liệu ít đọc |

**Case**: "Top sản phẩm bán chạy" trên trang chủ TMĐT — Lazy Loading, TTL 5 phút. Không cần real-time tuyệt đối, đổi lấy việc giảm tải RDS giờ cao điểm.

### Cấu hình liên quan
Redis cần bật **Cluster Mode + Replication Group** cho HA (chi tiết ở 4.54).

### Vị trí kiến trúc (nhà máy nền)
Khớp đúng trạm **quầy tạm ngay cạnh Kho tổng RDS** đã có — không phải trạm mới. Cache luôn đứng trước DB mà nó đang giảm tải.

### Luồng request đầy đủ (file `luong-request.html`)
**Cache HIT** (6 bước): Mobile App → ALB → EC2 → EC2 hỏi ElastiCache → HIT, trả ngay → EC2 trả về app. RDS không bị chạm.
**Cache MISS** (8 bước): giống trên đến bước hỏi cache → MISS → EC2 query RDS → RDS trả data → EC2 ghi ngược (SET) vào cache với TTL 5 phút → trả về app.

---

## 4.54 — Scaling ElastiCache

### Khái niệm
**Vertical Scaling (Scale Up)**: đổi node type lớn hơn. Áp dụng cho cả Redis và Memcached. Với Redis có Replication Group thì resize online, có 1 khoảnh khắc failover ngắn.

**Horizontal Scaling (Scale Out)** — Redis và Memcached làm khác nhau hẳn:

| Kiểu | Cách scale | Scale được gì | Giới hạn |
|---|---|---|---|
| **Redis — Cluster Mode Disabled** | 1 primary + tối đa **5 read replica** | **Chỉ đọc** | Ghi vẫn dồn vào 1 primary |
| **Redis — Cluster Mode Enabled** | Sharding theo **16384 hash slot**, tối đa **500 shard**, mỗi shard có primary + replica | **Cả đọc lẫn ghi** | Phức tạp hơn; cẩn thận hot key |
| **Memcached** | Thêm node, client dùng **consistent hashing** (Auto Discovery) | Đọc + ghi | Thêm/bớt node làm một phần key bị hash lại → cache miss tạm thời |

### Ví dụ thực tế — Flash Sale 11/11
Traffic tăng 10 lần, cache báo CPU 90% + eviction tăng vọt:
- **Đọc nhiều** (xem sản phẩm) → thêm Read Replica, không downtime.
- **Ghi nhiều** (session, giỏ hàng) → bật Cluster Mode Enabled, thêm shard.
- **Memcached cache session** → chỉ có cách thêm node, chấp nhận miss tạm thời.

### Cấu hình liên quan
ElastiCache hỗ trợ **Auto Scaling** (target tracking theo CPU/memory) để tự thêm/bớt replica hoặc shard — hữu ích khi traffic có chu kỳ.

### Chốt hạ
**Read Replica chỉ scale đọc, Sharding scale cả đọc lẫn ghi, Memcached thêm node thì chấp nhận mất cache tạm thời.**

---

## Hỏi đáp phụ về ElastiCache

### Restart server có mất hết data Redis không?
**Memcached**: luôn mất 100% khi node restart.

**Redis**: tùy cấu hình.

| Tình huống | Mất data? |
|---|---|
| Chỉ 1 node, không replica, không backup | **Mất hết** |
| Có Replication Group | Gần như không mất — failover sang replica đã đồng bộ |
| Có Automatic Backup (RDB snapshot) | Khôi phục từ snapshot gần nhất, chỉ mất phần ghi sau snapshot cuối |
| Xoá hẳn cluster | Mất hết, trừ khi có snapshot thủ công |

**Điểm hay nhầm**: ElastiCache **KHÔNG hỗ trợ AOF** (Append-Only File), chỉ có **RDB snapshot**. Nên vẫn có khoảng hở mất dữ liệu giữa 2 lần snapshot nếu không có replica.

**Có đáng lo không?** Nếu Redis chỉ làm cache thì mất là miss rồi query lại RDS, không sao. Nếu Redis là nơi lưu chính (session, giỏ hàng, leaderboard không có bản gốc ở DB khác) thì **bắt buộc** Replication Group + Backup.

### ElastiCache chạy trên những gì?
Node chạy trên **EC2** (nên tên node giống tên instance: `cache.r6g.large`), AWS quản lý hết phần vận hành.

| Dịch vụ | Vai trò |
|---|---|
| EC2 | Compute chạy engine Redis/Memcached |
| VPC + Subnet Group | Chọn subnet đặt node |
| Security Group | Kiểm soát ai được kết nối |
| S3 | Lưu snapshot backup Redis |
| KMS | Mã hoá at-rest (backup) và in-transit (TLS) |
| CloudWatch | Metrics: CPU, memory, evictions, hit/miss ratio |
| IAM | Phân quyền tạo/sửa/xoá cluster |

Khác RDS: dữ liệu chính của ElastiCache nằm trong **RAM**, không có ổ đĩa EBS giữ data sống — gốc rễ của chuyện restart mất data.

---

## 4.55 — Amazon DynamoDB

### Khái niệm + ví dụ
NoSQL **fully managed**, key-value/document. Khác RDS: **không có schema cứng** (ngoài Primary Key), **không hỗ trợ JOIN**.

Primary Key có 2 kiểu:
- **Simple**: chỉ Partition Key (VD `user_id`)
- **Composite**: Partition Key + Sort Key (VD `user_id` + `order_date`)

**Ẩn dụ**: hệ thống kệ hàng đánh mã vạch — quét mã (partition key) là nhảy thẳng tới đúng ngăn. Muốn tìm theo tiêu chí khác phải có "bảng chỉ mục phụ" (Index).

### Pattern nâng cao / case thực tế
- **Capacity mode**: **Provisioned** (đặt cứng RCU/WCU, rẻ nếu traffic ổn định) vs **On-Demand** (tự scale, trả theo request, hợp traffic thất thường).
- **Hot Partition**: quá nhiều request dồn vào 1 partition key (VD 1 sản phẩm viral) → partition đó bị throttle dù cả bảng còn dư capacity, vì RCU/WCU chia theo partition. Cách chữa: thêm "salt" ngẫu nhiên vào key (VD `product_id` + số 0-9).
- **Case**: session người dùng, giỏ hàng, bảng xếp hạng game — cần độ trễ single-digit millisecond, scale hàng triệu request/giây, không cần transaction phức tạp.

### Cấu hình liên quan
| Index | Đặc điểm |
|---|---|
| **GSI** (Global Secondary Index) | Query theo attribute khác, có partition/sort key riêng. Thêm được sau |
| **LSI** (Local Secondary Index) | Cùng partition key bảng gốc, chỉ đổi sort key. **Phải tạo lúc khởi tạo bảng**, không thêm sau được |

### Vị trí kiến trúc
Đứng **song song** với RDS như lựa chọn khác cho tầng lưu trữ — không phải nâng cấp của RDS, mà là công cụ khác cho bài toán khác (scale ngang cực lớn, đọc/ghi đơn giản, không join).

---

## 4.57 — DynamoDB Streams

### Khái niệm + ví dụ
Luồng ghi lại **mọi thay đổi** (insert/update/delete) trên bảng gần real-time, lưu **24 giờ**. Bản chất là CDC (Change Data Capture).

**Ẩn dụ**: camera an ninh gắn tại kệ hàng, ghi từng lần có ai lấy/thêm/đổi hàng.

4 kiểu view khi đọc stream:
| View | Nội dung |
|---|---|
| `KEYS_ONLY` | Chỉ biết key nào bị đổi |
| `NEW_IMAGE` | Trạng thái mới sau khi đổi |
| `OLD_IMAGE` | Trạng thái cũ trước khi đổi |
| `NEW_AND_OLD_IMAGES` | Cả hai, để so sánh |

### Pattern nâng cao / case thực tế
Gắn **Lambda trigger**. Case: khách đặt đơn → item mới vào DynamoDB → Stream bắn sự kiện → Lambda gửi email xác nhận **và** trừ tồn kho ở bảng khác, app không phải tự gọi 2 nơi.
Ứng dụng khác: đồng bộ sang OpenSearch, audit log, và là **cơ chế nền của Global Tables**.

### Vị trí kiến trúc
Không phải trạm riêng, mà là "vòi" gắn thẳng vào DynamoDB bắn sự kiện ra Lambda hoặc dịch vụ khác.

---

## 4.58 — DynamoDB Accelerator (DAX)

### Khái niệm + ví dụ
Cache in-memory **chuyên dụng cho DynamoDB**.

| | ElastiCache | DAX |
|---|---|---|
| Dùng cho | RDS hoặc bất kỳ dữ liệu nào | **Chỉ DynamoDB** |
| Logic cache | Tự code (Lazy Loading/Write-Through) | Tự động, chỉ đổi endpoint |
| API | Redis/Memcached riêng | Dùng chung DynamoDB SDK, gần như không sửa code |

### Pattern nâng cao / case thực tế
Giảm độ trễ đọc từ millisecond xuống **microsecond** cho workload đọc lặp lại cùng 1 item (trang sản phẩm hot, leaderboard real-time). DAX chạy dạng cluster riêng (1 primary + replica), managed hoàn toàn.

### Vị trí kiến trúc
Đứng **xen giữa App và DynamoDB** — y hệt ElastiCache đứng giữa App và RDS. Không dùng cho RDS.

---

## 4.59 — DynamoDB Global Tables

### Khái niệm + ví dụ
Replicate 1 bảng ra **nhiều region**, mỗi region đều **đọc + ghi** (**active-active**), khác kiểu 1 primary nhiều read-replica của RDS. Cơ chế đồng bộ chạy bằng **DynamoDB Streams** ở bên dưới.

**Ẩn dụ**: nhiều chi nhánh kho ở nhiều thành phố, chi nhánh nào cũng bán được tại chỗ rồi tự đồng bộ về nhau.

### Pattern nâng cao / case thực tế
Case: app toàn cầu (game, TMĐT quốc tế), user ở US/EU/Asia ghi/đọc vào region gần nhất nên độ trễ thấp.

**Trade-off**:
- Chỉ **eventual consistency** giữa các region (thường dưới 1 giây nhưng không đảm bảo).
- Xung đột (2 region sửa cùng item gần như đồng thời) giải quyết bằng **last-writer-wins** (timestamp mới hơn thắng) → phải thiết kế để tránh mất update quan trọng.

### Vị trí kiến trúc
Không phải trạm mới, mà là nhân bản cả cụm kệ hàng ra nhiều thành phố, nối nhau bằng đường ống Stream 2 chiều.

### Chốt hạ
**Global Tables chính là Streams chạy ngầm giữa các region.**

---

## 4.61 — Amazon Redshift

**Khái niệm**: Data warehouse lưu dạng **columnar** (theo cột), tối ưu **OLAP** (phân tích, tổng hợp hàng triệu dòng), không phải OLTP.
Kiến trúc: **Leader node** (nhận query, lập kế hoạch, gộp kết quả) + nhiều **Compute node** (chạy song song).
**Redshift Spectrum**: query thẳng dữ liệu ở S3 mà không cần load vào Redshift.

**Ví dụ**: tổng doanh thu 5 năm theo khu vực, ngành hàng — RDS quét từng dòng rất chậm, Redshift chỉ đọc đúng cột `revenue`, `region`.
**Ẩn dụ**: phòng thống kê trung tâm tổng hợp báo cáo toàn nhà máy, chỉ quan tâm con số lớn.

---

## 4.62 — Amazon EMR

**Khái niệm**: cụm Hadoop/Spark **managed** cho xử lý dữ liệu lớn kiểu batch, thường đọc/ghi trực tiếp S3 (EMRFS).

| Node | Vai trò |
|---|---|
| **Master** | Điều phối cluster |
| **Core** | Lưu trữ + xử lý (chạy HDFS nếu có) |
| **Task** | Chỉ xử lý, không lưu trữ → hợp **Spot Instance** vì mất cũng không sao |

**Ví dụ**: xử lý 10TB log clickstream, chạy cluster vài giờ rồi tắt, trả tiền theo giờ dùng.
**Ẩn dụ**: đội thợ thuê ngoài kéo tới xử lý lô hàng khổng lồ vài giờ rồi giải tán.

---

## 4.63 — Amazon Kinesis

**Khái niệm**: nạp dữ liệu **streaming real-time** từ bất kỳ nguồn nào (clickstream, IoT, log). Khác DynamoDB Streams (chỉ bắt thay đổi của 1 bảng).

| Loại | Dùng khi |
|---|---|
| **Data Streams** | Tự viết consumer (EC2/Lambda) xử lý real-time theo shard. Linh hoạt nhất, tự quản lý scaling |
| **Data Firehose** | Không cần code consumer, tự đổ vào S3/Redshift/OpenSearch, gần real-time (buffer vài chục giây) |
| **Data Analytics** | Chạy SQL/Flink ngay trên luồng đang chảy |
| **Video Streams** | Nạp video/audio streaming (camera), tích hợp Rekognition |

**Ví dụ**: hàng triệu click từ app mobile → Firehose → tự ghi vào S3 theo từng phút.

---

## 4.64 — Amazon Athena và AWS Glue

**Athena**: query engine **serverless**, chạy SQL thẳng trên file ở S3 (Parquet, CSV, JSON). Tính phí theo **dung lượng dữ liệu quét**.
**Glue**: ETL serverless.
- **Glue Crawler**: quét S3, đoán schema, ghi vào **Glue Data Catalog** (metadata dùng chung cho Athena, Redshift Spectrum, EMR).
- **Glue Jobs**: Spark serverless để transform dữ liệu.

**Luồng 5 bước**: log JSON ở S3 → Crawler quét → ghi schema vào Data Catalog → Athena đọc catalog biết cấu trúc → bạn chạy SELECT, Athena quét S3 và trả kết quả.

---

## 4.66 — Amazon OpenSearch Service

**Khái niệm**: bản managed của Elasticsearch/OpenSearch, đi kèm OpenSearch Dashboards (giống Kibana).

2 use case chính:
- **Full-text search**: tìm theo từ khóa mờ, gợi ý, xếp hạng độ liên quan — thứ DynamoDB/RDS làm không tốt.
- **Log analytics**: gom log từ CloudWatch Logs / Kinesis Firehose về 1 nơi, dò lỗi tập trung (giống ELK stack).

---

## 4.67 — AWS Batch

**Khái niệm**: chạy **batch job quy mô lớn**, tự cấp EC2 (kể cả Spot), xếp hàng qua **Job Queue**, đóng gói job bằng Docker (**Job Definition**).
**Luồng**: Job → Job Queue → Compute Environment (tự cấp EC2/Spot) → chạy xong giải phóng, trả tiền đúng compute đã dùng.
**Khác EMR**: EMR dành cho Hadoop/Spark; Batch tổng quát hơn, chạy bất kỳ workload Docker nào (render video, mô phỏng khoa học, tính toán tài chính).

---

## 4.68 — Other Database Services

| Dịch vụ | Là gì | Dùng khi |
|---|---|---|
| **DocumentDB** | Tương thích MongoDB | App đã quen MongoDB |
| **Neptune** | Graph database | Mạng xã hội, gợi ý dựa trên quan hệ |
| **Keyspaces** | Tương thích Cassandra | Ghi cực lớn, phân tán nhiều region |
| **Timestream** | Time-series database | Cảm biến IoT, metrics theo thời gian |
| **QLDB** | Ledger database, log bất biến | Audit trail, lịch sử giao dịch không được sửa |
| **MemoryDB for Redis** | Redis có durability thật | Dùng làm primary database tốc độ cao (khác ElastiCache chỉ là cache) |

---

## 4.69 — Other Analytics Services

| Dịch vụ | Là gì |
|---|---|
| **QuickSight** | BI dashboard, kết nối Redshift/Athena/S3 |
| **MSK** | Apache Kafka managed, lựa chọn thay thế Kinesis |
| **Lake Formation** | Quản lý quyền truy cập tập trung cho Data Lake trên S3 |
| **Glue DataBrew** | Làm sạch dữ liệu bằng giao diện kéo-thả, không cần code |

---

## Bức tranh lớn + câu chốt hạ

**Pipeline dữ liệu**: nguồn (App/IoT, RDS/DynamoDB) → **Kinesis** nạp vào → **S3** chứa → **Glue** tạo schema → **EMR** (xử lý nặng) / **Athena** (query trực tiếp) / **Redshift** (báo cáo tổng hợp) → **QuickSight** hiển thị. **OpenSearch** (search/log) và **Batch** (job nặng) đứng ngoài luồng này.

| Cụm | Chốt hạ |
|---|---|
| ElastiCache | EC2 luôn hỏi cache trước; MISS thì đi vòng qua RDS rồi ghi ngược vào cache |
| Scaling ElastiCache | Replica chỉ scale đọc, Sharding scale cả đọc lẫn ghi |
| DynamoDB | Global Tables = Streams chạy ngầm giữa các region |
| DAX vs ElastiCache | DAX chỉ cho DynamoDB và tự động; ElastiCache dùng chung và tự code logic |
| Data & Analytics | Kinesis nạp → S3 chứa → Glue schema → EMR/Athena/Redshift xử lý → QuickSight hiển thị |

---

## Danh sách file HTML

Giải nén zip rồi mở từng file bằng trình duyệt (không phụ thuộc nhau):

| File | Bài | Nội dung |
|---|---|---|
| `luong-request.html` | 4.53 | Luồng Mobile App → ALB → EC2 → ElastiCache → RDS, toggle HIT/MISS, bấm từng bước |
| `scaling-elasticache.html` | 4.54 | 4 tab: Vertical, thêm Read Replica, Cluster Mode (Sharding), Memcached thêm node |
| `dynamodb-suite.html` | 4.55 / 4.57 / 4.58 / 4.59 | 4 tab: Hot Key, Streams → Lambda, DAX Hit/Miss, Global Tables |
| `data-analytics-suite.html` | 4.61 → 4.69 | 9 tab: Tổng quan pipeline + từng dịch vụ |

## ⚠️ Chưa có trong tài liệu này
- HOL: 4.56, 4.60, 4.65
- Meta: 4.70 (Exam Cram), 4.71 (Architecture Patterns), 4.72 (Quiz), 4.73 (Cheat Sheets)
- 4.1 → 4.52 (S3, Block/File Storage, RDS, Aurora, RDS Proxy)
