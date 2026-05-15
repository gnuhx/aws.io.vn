## 🧪 Part 2 — Write Custom Policies

**Scenario:** AWS managed policies are too broad. Write your own least-privilege policies.

---

### Exercise 2.1 — S3 Read-Only for Specific Bucket

The `data-team` should only read from `analytics-data-bucket`, not any other bucket.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSpecificBucketRead",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::analytics-data-bucket",
        "arn:aws:s3:::analytics-data-bucket/*"
      ]
    }
  ]
}
```

**Task:** Create this as a **Customer Managed Policy** named `DataTeam-S3-ReadOnly` and attach it to `data-team` group. Remove `AmazonS3ReadOnlyAccess` (too broad).

---

### Exercise 2.2 — EC2 Start/Stop Only (No Terminate)

Developers can start and stop EC2 but **never terminate** instances.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowStartStop",
      "Effect": "Allow",
      "Action": [
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:DescribeInstances"
      ],
      "Resource": "*"
    },
    {
      "Sid": "DenyTerminate",
      "Effect": "Deny",
      "Action": "ec2:TerminateInstances",
      "Resource": "*"
    }
  ]
}
```

**Task:** Name it `DevTeam-EC2-NoTerminate`, attach to `dev-team`. Remove `AmazonEC2FullAccess`.

---

### Exercise 2.3 — Self-Service MFA Policy

Allow users to manage their own MFA device — nothing else in IAM.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSelfMFA",
      "Effect": "Allow",
      "Action": [
        "iam:CreateVirtualMFADevice",
        "iam:EnableMFADevice",
        "iam:GetUser",
        "iam:ListMFADevices"
      ],
      "Resource": "arn:aws:iam::*:user/${aws:username}"
    }
  ]
}
```

**Task:** Name it `AllUsers-SelfMFA`, attach to **all 3 groups**.

---
