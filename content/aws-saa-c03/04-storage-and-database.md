---
title: Storage and database patterns
topic: aws-saa-c03
order: 4
---

# Storage and database patterns

## The big picture
Data is not one thing. Some workloads need durable object storage, some need block storage, and some need relational or NoSQL databases with different performance characteristics.

## Core building blocks
- S3: object storage for files, backups, logs, and static assets.
- EBS: block storage for EC2 instances.
- RDS: managed relational database.
- DynamoDB: managed NoSQL data store with fast key-value access.

## Real project example
A web app stores user uploads in S3, keeps session data in ElastiCache or DynamoDB, and stores transactional orders in RDS. Each data type has a storage service that matches its access pattern.

## Decision flow
- Need static or large object files? Use S3.
- Need database transactions with SQL joins? Use RDS.
- Need high-throughput access with simple key lookups? Use DynamoDB.
- Need fast repeated reads? Add caching.

## Good practice
Decouple storage from compute. Keep the app layer focused on business logic while the data services store and protect the actual data.

> **Pro tip:** choose the database based on access patterns, not just because it is familiar.

## Looking back at the big picture
Storage patterns are about speed, durability, cost, and access model. The same application often uses multiple storage services together.

## Self-draw
- Why is S3 a good fit for large file uploads?
- What is the advantage of RDS for transactional systems?
- When would NoSQL be preferable over an RDS relational model?
