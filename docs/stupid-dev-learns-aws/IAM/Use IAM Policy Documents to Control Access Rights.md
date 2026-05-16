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

---

## 🎯 Quiz — 10 SAA-C03 Questions

> **Choose your mode before starting:**
> - 🅰️ **Instant Mode** — reveal each answer right after you choose
> - 🅱️ **Exam Mode** — answer all 10 first, then open all reveals at the end

---

### Q1 · 🟢 Beginner · Explicit Deny

In an IAM policy, what does an **explicit Deny** do when another policy explicitly **Allows** the same action?

- A) The Deny is ignored if the Allow was created first
- B) The Deny overrides the Allow — it always wins, no exceptions
- C) The Deny applies only to root users
- D) The Deny applies only if no Allow exists for that action

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) The Deny overrides the Allow — it always wins, no exceptions**

**Why:** This is the foundational rule of IAM policy evaluation. An explicit Deny cannot be overridden by any Allow, regardless of policy type, order, or source. This is how you create hard blockers that even admins cannot bypass.

**Why the others are wrong:**
- ❌ A) Policy creation order has zero effect on evaluation
- ❌ C) Deny applies to all identities, not just root
- ❌ D) This describes an implicit deny (the default), not an explicit Deny

**Policy evaluation logic:**
```
Is there an explicit DENY? ──YES──▶ DENIED 🚫
        │
       NO
        │
        ▼
Is there an explicit ALLOW? ──YES──▶ ALLOWED ✅
        │
       NO
        │
        ▼
   Implicit DENY 🚫
   (default: nothing allowed)
```

**⚠️ If you chose A or D:** Remember — explicit Deny is a one-way valve. It blocks regardless of any Allow in any other policy attached to that identity.

</details>

---

### Q2 · 🟢 Beginner · Required Policy Elements

What are the **three required elements** of every IAM policy statement?

- A) Principal, Action, Condition
- B) Effect, Action, Resource
- C) Version, Statement, Principal
- D) Effect, Principal, Condition

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) Effect, Action, Resource**

**Why:** Every statement must answer: *Should this be allowed or denied? (Effect)* — *What API operations? (Action)* — *On which AWS resource? (Resource)*. Without all three, the statement is either invalid or dangerously broad.

**Why the others are wrong:**
- ❌ A) `Principal` is optional in identity-based policies (it's used in resource-based policies)
- ❌ C) `Version` and `Statement` are top-level policy fields, not statement elements
- ❌ D) `Condition` is optional; `Principal` is not required in identity-based policies

**Anatomy of a policy statement:**
```json
{
  "Statement": [
    {
      "Effect":   "Allow",      // ← Required: Allow or Deny
      "Action":   "s3:GetObject", // ← Required: what API call
      "Resource": "arn:aws:s3:::my-bucket/*", // ← Required: which resource
      "Condition": { ... }      // Optional: adds constraints
    }
  ]
}
```

**⚠️ If you chose A:** `Principal` is common in S3 bucket policies and trust policies — but NOT required in identity-based policies attached to users/groups/roles.

</details>

---

### Q3 · 🟢 Beginner · Policy Types

Which IAM policy type is attached **directly to an AWS resource** such as an S3 bucket?

- A) Identity-based policy
- B) Inline policy
- C) Resource-based policy
- D) AWS Managed policy

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: C) Resource-based policy**

**Why:** Resource-based policies are attached to the resource itself (e.g., S3 bucket policy, SQS queue policy, Lambda resource policy). They control who can access that resource. Identity-based policies are attached to the identity (user/role) and control what that identity can do.

**Why the others are wrong:**
- ❌ A) Identity-based policies attach to users, groups, or roles — not resources
- ❌ B) Inline policies are embedded inside a specific user, group, or role — still identity-side
- ❌ D) AWS Managed policies are AWS-maintained identity-based policies

**Policy attachment sides:**
```
IDENTITY SIDE                    RESOURCE SIDE
─────────────                    ─────────────
IAM User ──┐                     S3 Bucket ──── Bucket Policy
IAM Group ─┼── Identity-based    SQS Queue ──── Queue Policy
IAM Role ──┘    Policy           Lambda ──────── Resource Policy
                                 KMS Key ─────── Key Policy

Both sides evaluated together when
an identity accesses a resource
```

**⚠️ If you chose B:** Inline policies are embedded in an identity (user/role), not a resource. They are identity-based, just non-reusable ones.

</details>

---

### Q4 · 🟡 Intermediate · Unexpected Denial

A developer has `AmazonS3FullAccess` attached to their IAM user. They try to upload a file to a specific S3 bucket and receive `Access Denied`. What is the MOST LIKELY cause?

- A) `AmazonS3FullAccess` does not include upload permissions
- B) An explicit Deny in the S3 bucket policy or another attached policy is overriding the Allow
- C) The developer needs to log out and back in to refresh permissions
- D) S3 upload requires a separate paid add-on

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) An explicit Deny in the S3 bucket policy or another attached policy is overriding the Allow**

**Why:** `AmazonS3FullAccess` allows all S3 actions. The only way to get `Access Denied` with that policy is if something else is explicitly denying access: a bucket policy, an SCP from AWS Organizations, a permissions boundary, or another identity-based policy with an explicit Deny.

**Why the others are wrong:**
- ❌ A) `AmazonS3FullAccess` uses `"Action": "s3:*"` which includes `s3:PutObject`
- ❌ C) IAM permissions take effect immediately; no logout required
- ❌ D) S3 access is not a paid add-on; it's part of standard AWS services

**Layered policy evaluation:**
```
Developer attempts s3:PutObject
           │
    Check all policies:
    ┌──────────────────────┐
    │ AmazonS3FullAccess   │ → ALLOW s3:*
    │ Bucket Policy        │ → DENY s3:PutObject ← overrides!
    │ SCP (if Org)         │
    └──────────────────────┘
           │
   Explicit Deny found ──▶ DENIED 🚫
   (even though IAM says Allow)
```

**⚠️ If you chose A:** When a broadly-permissive policy is in play and you still see Deny, always look for an explicit Deny in another policy source — bucket policy, SCP, or permission boundary.

</details>

---

### Q5 · 🟡 Intermediate · Least Privilege — Best Policy

A Lambda function only needs to read one item from a DynamoDB table. Which policy BEST follows least privilege?

- A) `{"Effect": "Allow", "Action": "*", "Resource": "*"}`
- B) `{"Effect": "Allow", "Action": "dynamodb:*", "Resource": "arn:aws:dynamodb:us-east-1:123:table/orders"}`
- C) `{"Effect": "Allow", "Action": "dynamodb:GetItem", "Resource": "arn:aws:dynamodb:us-east-1:123:table/orders"}`
- D) `{"Effect": "Allow", "Action": "dynamodb:GetItem", "Resource": "*"}`

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: C) Specific action on specific resource ARN**

**Why:** Least privilege = the exact action needed (`GetItem`) on the exact resource (specific table ARN). Nothing more.

**Why the others are wrong:**
- ❌ A) Wildcard action + wildcard resource — worst possible policy; grants access to everything
- ❌ B) `dynamodb:*` allows Delete, Create, Scan, and all other operations — way more than needed
- ❌ D) `GetItem` is correct but `"Resource": "*"` applies to ALL DynamoDB tables in the account

**Least privilege spectrum:**
```
MOST PERMISSIVE ◄──────────────────► LEAST PERMISSIVE

"Action":"*"      "Action":"dynamodb:*"   "Action":"dynamodb:GetItem"
"Resource":"*"    "Resource":"arn:..table" "Resource":"arn:..table/orders"
  ☠️ Never          ⚠️ Too broad              ✅ Correct
```

**⚠️ If you chose D:** You got the action right but left the resource open. Always scope the Resource ARN to the specific table, bucket, or function involved.

</details>

---

### Q6 · 🟡 Intermediate · Default Behavior

An IAM user is created with no policies attached. They try to list EC2 instances. What happens?

- A) The action is allowed because AWS trusts users inside the same account
- B) The action is denied — default IAM behavior is implicit deny for all actions
- C) The action is allowed but logged for review
- D) The user is prompted to request access from their admin

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) The action is denied — default IAM behavior is implicit deny**

**Why:** IAM starts from zero trust. Every action is implicitly denied unless there is an explicit Allow. A user with no policies has no permissions whatsoever — not even read access.

**Why the others are wrong:**
- ❌ A) Being in the same account grants nothing by itself; permissions must be explicitly granted
- ❌ C) IAM doesn't log-and-allow; it simply denies
- ❌ D) AWS doesn't present a UI prompt; the API returns an `AccessDenied` error

**IAM default state:**
```
New IAM user created
        │
 Zero policies attached
        │
        ▼
  Attempts ANY action
        │
        ▼
  Implicit DENY 🚫
  (no Allow found)
        │
        ▼
 API returns:
 "An error occurred (AccessDenied)"
```

**⚠️ If you chose A:** Same-account membership is irrelevant. IAM requires explicit grants. This is the "zero trust" foundation of AWS security.

</details>

---

### Q7 · 🔴 Hard · Deny vs Allow Priority

An IAM policy has two statements:
1. `Allow` on `s3:*` for `"Resource": "*"`
2. `Deny` on `s3:DeleteBucket` for `"Resource": "*"`

A user with this policy tries to delete an S3 bucket. What happens?

- A) Allowed — because `s3:*` includes `s3:DeleteBucket`
- B) Denied — because explicit Deny overrides the Allow in all cases
- C) Allowed — because the Allow statement appears first in the policy
- D) Allowed — because the wildcard `*` in the Allow is broader than the specific Deny

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) Denied — because explicit Deny overrides the Allow in all cases**

**Why:** Statement order is irrelevant. Breadth of the Allow is irrelevant. Explicit Deny wins unconditionally. This is the core rule. A `Deny` on a specific action in any statement of any attached policy blocks that action completely.

**Why the others are wrong:**
- ❌ A) `s3:*` does include DeleteBucket but the explicit Deny blocks it
- ❌ C) Statement order in a policy document has no effect on evaluation
- ❌ D) Specificity of the Allow does not help; Deny wins regardless

**Evaluation proof:**
```
User attempts s3:DeleteBucket
          │
  Policy evaluation starts
          │
  Statement 1: Allow s3:*  ──── Matches ✅
  Statement 2: Deny s3:DeleteBucket ── Matches ✅
          │
  Explicit Deny found?
     YES → DENIED 🚫 (end of evaluation)

Note: Would be denied even if 100 Allow
statements all explicitly allow DeleteBucket
```

**⚠️ If you chose A or D:** The breadth or specificity of an Allow never matters when an explicit Deny is present. Deny is the final word.

</details>

---

### Q8 · 🔴 Hard · Multi-Source Deny

A user belongs to two IAM groups:
- **Group A**: `Allow ec2:*` on all resources
- **Group B**: `Deny ec2:TerminateInstances` on all resources

The user also has a direct inline policy: `Allow ec2:TerminateInstances` on all resources.

Can the user terminate EC2 instances?

- A) Yes — the inline policy is the most specific override
- B) No — the explicit Deny in Group B overrides all Allows from all sources
- C) Yes — inline policies always take precedence over group policies
- D) It depends on which policy was most recently updated

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) No — the explicit Deny in Group B overrides all Allows from all sources**

**Why:** IAM collects ALL policies from ALL sources (groups, direct attachments, inline policies) and evaluates them together. A single explicit Deny from any source kills the action — regardless of how many Allows exist.

**Why the others are wrong:**
- ❌ A) There is no concept of "most specific inline policy wins" in IAM
- ❌ C) Inline policies have no inherent precedence over group policies
- ❌ D) Policy update time has zero effect on evaluation

**Multi-source evaluation:**
```
User attempts ec2:TerminateInstances
               │
     Collect ALL policies:
   ┌─────────────────────────┐
   │ Group A:  Allow ec2:*   │
   │ Group B:  Deny terminate│ ← explicit Deny
   │ Inline:   Allow terminate│
   └─────────────────────────┘
               │
  Any explicit Deny? ─YES─▶ DENIED 🚫
  (Deny from Group B wins over
   Allows from Group A + Inline)
```

**⚠️ If you chose A or C:** This is a common exam trap. Inline policies and group policies are evaluated equally. The only thing that "wins" is an explicit Deny.

</details>

---

### Q9 · 🔴 Hard · Condition Keys — Enforcing MFA

You want a policy that denies all S3 actions unless the user authenticated with MFA. Which Condition block achieves this?

- A) `"Condition": {"Bool": {"aws:SecureTransport": "false"}}`
- B) `"Condition": {"BoolIfExists": {"aws:MultiFactorAuthPresent": "false"}}`
- C) `"Condition": {"StringEquals": {"iam:MFAAuthenticated": "true"}}`
- D) `"Condition": {"Bool": {"aws:MFAEnabled": "false"}}`

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) `"Condition": {"BoolIfExists": {"aws:MultiFactorAuthPresent": "false"}}`**

**Why:** `aws:MultiFactorAuthPresent` is the correct global condition key. `BoolIfExists` handles cases where the key might not be present (e.g., CLI sessions without MFA). When this condition evaluates to true (MFA not present), the Deny fires.

**Why the others are wrong:**
- ❌ A) `aws:SecureTransport` checks HTTPS vs HTTP — nothing to do with MFA
- ❌ C) `iam:MFAAuthenticated` is not a valid global condition key in IAM
- ❌ D) `aws:MFAEnabled` is not a valid condition key; the correct one is `aws:MultiFactorAuthPresent`

**MFA enforcement policy pattern:**
```json
{
  "Effect": "Deny",
  "Action": "s3:*",
  "Resource": "*",
  "Condition": {
    "BoolIfExists": {
      "aws:MultiFactorAuthPresent": "false"
    }
  }
}
```

```
User calls S3 API
       │
  Did they auth with MFA?
  ┌────┴────┐
 YES        NO
  │          │
  ▼          ▼
Condition  Condition
= false    = true (MFA not present)
  │          │
Allow      DENIED 🚫
proceeds   (Deny fires)
```

**⚠️ If you chose D:** `aws:MFAEnabled` does not exist. The correct key is `aws:MultiFactorAuthPresent`. This exact naming detail appears on SAA-C03.

</details>

---

### Q10 · ⚫ Expert · Tag-Based Conditional Access

A company wants developers to **start/stop EC2 instances tagged `Environment: dev`** but **never touch instances tagged `Environment: prod`**. Which policy structure achieves this?

- A) Create separate IAM groups per environment and assign instances to them
- B) Use a Condition on the Allow with `ec2:ResourceTag/Environment: dev`, plus a separate explicit Deny with `ec2:ResourceTag/Environment: prod`
- C) Use a Resource ARN filter to limit access to dev instances only
- D) Create separate AWS accounts for dev and prod environments

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) Condition on Allow for dev + explicit Deny for prod**

**Why:** IAM condition keys for resource tags (`ec2:ResourceTag/TagKey`) let you scope actions to instances with specific tags. The Allow scopes access to dev-tagged instances. The explicit Deny provides a hard backstop against prod — even if tags are misconfigured.

**Why the others are wrong:**
- ❌ A) IAM groups manage users, not EC2 instances; you can't assign instances to groups
- ❌ C) EC2 instance ARNs don't encode the environment tag; you can't filter by tag via ARN alone
- ❌ D) Separate accounts is a valid isolation strategy but is drastic for just permission scoping within one team

**Tag-based policy structure:**
```json
{
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ec2:StartInstances","ec2:StopInstances"],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "ec2:ResourceTag/Environment": "dev"
        }
      }
    },
    {
      "Effect": "Deny",
      "Action": ["ec2:StartInstances","ec2:StopInstances"],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "ec2:ResourceTag/Environment": "prod"
        }
      }
    }
  ]
}
```

```
Developer attempts action on EC2 instance
              │
    What tag does the instance have?
    ┌──────────┬──────────┐
  "dev"     "prod"    no tag
    │          │          │
  Allow ✅  Deny 🚫   Deny 🚫
            (explicit) (no Allow matches)
```

**⚠️ If you chose C:** Resource ARNs for EC2 look like `arn:aws:ec2:region:account:instance/i-xxx` — they don't contain tags. Tag-based access control must use Condition keys, not ARN patterns.

</details>