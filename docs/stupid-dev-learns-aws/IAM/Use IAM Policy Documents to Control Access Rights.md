# Use IAM Policy Documents to Control Access Rights

---

## 📘 Concept

An **IAM Policy Document** is a JSON file that defines **who can do what to which resource** in AWS.

Every policy has 3 core questions:
- **Who?** → Principal (user, role, service)
- **What?** → Actions (e.g., `s3:GetObject`, `ec2:StartInstances`)
- **Which resource?** → ARN of the resource

A basic policy document looks like this:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}
```

Key concepts:
- **Effect** → `Allow` or `Deny`
- **Action** → AWS API calls being permitted/denied
- **Resource** → Which specific AWS resource it applies to
- **Explicit Deny always wins** over Allow — no exceptions

Policy types:
| Type | Description |
|------|-------------|
| **Identity-based** | Attached to a user, group, or role |
| **Resource-based** | Attached to a resource (e.g., S3 bucket policy) |
| **AWS Managed** | Pre-built by AWS (e.g., `AdministratorAccess`) |
| **Customer Managed** | You write and control it |
| **Inline** | Embedded directly into one user/role (avoid these) |

---

## ⚠️ What Happens Without It?

| Risk | Consequence |
|------|-------------|
| No policies = no access control | Every IAM user can do anything |
| Over-permissive policies (`*:*`) | One compromised user = full blast radius |
| No explicit denies | Can't block sensitive actions even for admins |
| Inline policies everywhere | Hard to audit, can't reuse, nightmare to manage |

Real damage: A developer's IAM user with `"Action": "*", "Resource": "*"` gets leaked → attacker **deletes all S3 buckets, RDS databases, and terminates every EC2** — no recovery if no backups.

---

## 🏗️ Sample in Real Project

**Scenario:** You're building a backend API on AWS with a team of devs, a CI/CD pipeline, and an S3 bucket for uploads.

**Dev Team IAM Policy** — can read logs but can't touch production:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:GetLogEvents",
        "logs:DescribeLogStreams"
      ],
      "Resource": "arn:aws:logs:us-east-1:123456789:log-group:/app/dev/*"
    },
    {
      "Effect": "Deny",
      "Action": "*",
      "Resource": "arn:aws:s3:::prod-uploads/*"
    }
  ]
}
```

**CI/CD Role Policy** — only deploys Lambda, nothing else:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:UpdateFunctionCode",
        "lambda:PublishVersion"
      ],
      "Resource": "arn:aws:lambda:us-east-1:123456789:function:my-api"
    }
  ]
}
```

Result: Even if the CI/CD pipeline is hacked, the attacker can **only update one Lambda** — nothing else.

---

## 🏭 Funny Factory Story

At **CloudFactory Inc.**, there are no job descriptions. Every worker can walk into any room and press any button.

Dave from accounting wandered into the machine room and pressed a big red button labeled *"DO NOT PRESS."* It shut down all the conveyor belts, deleted the inventory system, and ordered 10,000 more rubber ducks. *(The first batch still hadn't been dealt with.)*

The boss finally introduced **Access Badges** (IAM Policies):
- Accountants → only enter the finance room
- Developers → only touch the dev machines
- CI/CD Robot → only allowed to pull levers labeled "deploy"

Dave tried to enter the machine room again. The door beeped red. Dave sulked.

The conveyor belts hummed peacefully. The rubber ducks were slowly being sold off. 🦆🦆🦆

---

> 💡 **Exam tip:** AWS SAA-C03 loves these rules:
> - **Explicit Deny > Everything** — always wins, no matter what
> - **Default is Deny** — nothing is allowed unless explicitly granted
> - If asked about least-privilege → think **customer managed policies with specific actions and ARNs**, never `*:*`