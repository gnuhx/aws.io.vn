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

## 🎯 Quiz — 10 SAA-C03 Questions

> **Choose your mode before starting:**
> - 🅰️ **Instant Mode** — reveal each answer right after you choose
> - 🅱️ **Exam Mode** — answer all 10 first, then open all reveals at the end

---

### Q1 · 🟢 Beginner · What Is Least Privilege

A company creates an IAM policy for a Lambda function that only reads one S3 bucket. Which policy best represents least privilege?

- A) `{"Effect": "Allow", "Action": "*", "Resource": "*"}`
- B) `{"Effect": "Allow", "Action": "s3:*", "Resource": "*"}`
- C) `{"Effect": "Allow", "Action": ["s3:GetObject","s3:ListBucket"], "Resource": "arn:aws:s3:::reports-bucket/*"}`
- D) `{"Effect": "Allow", "Action": ["s3:GetObject","s3:ListBucket"], "Resource": "*"}`

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: C) Specific actions on specific resource ARN**

**Why:** Least privilege = only the actions required (`GetObject` + `ListBucket`) on only the specific resource (`reports-bucket`). This is the minimum permission needed to do the job.

**Why the others are wrong:**
- ❌ A) Allows all actions on all AWS services — the most dangerous possible policy
- ❌ B) `s3:*` includes Delete, Create, and policy management — far more than read access
- ❌ D) Correct actions but `"Resource": "*"` applies them to ALL buckets in the account

**Least privilege visualization:**
```
OPTION A:  ████████████████████████████ ALL AWS SERVICES (dangerous)
OPTION B:  ██████████████              ALL S3 operations (too broad)
OPTION D:  ████                        Right actions, ALL buckets (too broad)
OPTION C:  ██                          Right actions, ONE bucket ✅ (correct)
```

**⚠️ If you chose D:** You got the actions right but left the resource open. Always scope Resource to the specific ARN when you know it.

</details>

---

### Q2 · 🟢 Beginner · AWS Managed Policy Scope Problem

The `data-team` has `AmazonS3ReadOnlyAccess`. This policy grants read access to:

- A) Only the buckets you specify during policy creation
- B) Only buckets in the `us-east-1` region
- C) All S3 buckets in the entire AWS account
- D) S3 buckets created by the data team only

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: C) All S3 buckets in the entire AWS account**

**Why:** AWS Managed Policies use `"Resource": "*"` for broad usability. `AmazonS3ReadOnlyAccess` grants `s3:Get*` and `s3:List*` on every bucket — including buckets containing financial data, customer PII, or audit logs. This is why custom policies scoped to specific buckets are preferred.

**Why the others are wrong:**
- ❌ A) AWS Managed Policies are pre-built and not customizable at creation time; resource scope is baked in as `*`
- ❌ B) S3 is a global service; IAM policies don't restrict S3 by region natively
- ❌ D) S3 doesn't track bucket "ownership" in a way that IAM policies can filter on

**Why this matters in Exercise 2.1:**
```
Before custom policy (AWS Managed):
  data-team can read:
    ✅ analytics-data-bucket   (intended)
    ✅ payroll-bucket           (unintended ❌)
    ✅ legal-archive-bucket     (unintended ❌)
    ✅ ALL other buckets        (too broad)

After custom policy:
  data-team can read:
    ✅ analytics-data-bucket   (intended ✅)
    ❌ payroll-bucket           (blocked ✅)
    ❌ everything else          (blocked ✅)
```

**⚠️ If you chose A:** AWS Managed Policies are not configurable at attachment time. They always apply exactly as AWS wrote them — usually with `"Resource": "*"`.

</details>

---

### Q3 · 🟢 Beginner · Explicit Deny for Destructive Operations

Developers should be able to start and stop EC2 instances but NEVER terminate them. Which policy structure achieves this?

- A) Allow `ec2:StartInstances` and `ec2:StopInstances` only — IAM default deny covers terminate
- B) Allow `ec2:StartInstances`, `ec2:StopInstances`, and `ec2:DescribeInstances`, plus an explicit Deny on `ec2:TerminateInstances`
- C) Allow `ec2:*` and rely on training to prevent terminations
- D) Allow `ec2:StartInstances` and `ec2:StopInstances`, then ask AWS Support to block terminate

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) Allow specific actions + explicit Deny on terminate**

**Why:** While implicit deny (no Allow for terminate) would technically work, an explicit Deny provides stronger protection. If someone later adds `AmazonEC2FullAccess` to the same group, the implicit deny would disappear — but an explicit Deny in another policy would still win. Defense in depth.

**Why the others are wrong:**
- ❌ A) This works only as long as no other policy adds `ec2:*`; explicit Deny is more durable
- ❌ C) Training is not access control; human error happens; policies are the real guard
- ❌ D) AWS Support cannot modify customer IAM policies

**Explicit Deny as a durable guardrail:**
```
Developer policy:
  Allow: StartInstances, StopInstances ✅
  Deny:  TerminateInstances 🚫

Later someone adds AmazonEC2FullAccess:
  AmazonEC2FullAccess: Allow ec2:* ✅
  Explicit Deny still: Deny Terminate 🚫

Result: Terminate is STILL blocked ✅
The Deny persists across policy additions

Without explicit Deny:
  Add ec2:* policy → terminate suddenly allowed ❌
```

**⚠️ If you chose A:** The implicit deny approach is fragile. Any future Allow policy that includes `ec2:TerminateInstances` would suddenly permit it. Explicit Deny creates a hard constraint that survives policy additions.

</details>

---

### Q4 · 🟡 Intermediate · S3 Resource ARN Structure

Exercise 2.1 uses two Resource ARNs for the S3 policy:
```
"arn:aws:s3:::analytics-data-bucket"
"arn:aws:s3:::analytics-data-bucket/*"
```
Why are BOTH required?

- A) AWS requires duplicate ARNs for redundancy
- B) The first ARN covers bucket-level operations (like `ListBucket`); the second covers object-level operations (like `GetObject`)
- C) The first is for console access; the second is for CLI access
- D) Both ARNs are equivalent — you only need one of them

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) The first covers bucket-level actions; the second covers object-level actions**

**Why:** S3 actions have two scopes in IAM:
- **Bucket actions** (`s3:ListBucket`, `s3:GetBucketPolicy`) → apply to the bucket ARN: `arn:aws:s3:::bucket-name`
- **Object actions** (`s3:GetObject`, `s3:PutObject`) → apply to objects ARN: `arn:aws:s3:::bucket-name/*`

If you only include `/*`, `s3:ListBucket` returns "Access Denied". If you only include the bucket ARN, `s3:GetObject` returns "Access Denied".

**Why the others are wrong:**
- ❌ A) IAM doesn't require redundancy; both ARNs serve different purposes
- ❌ C) Console and CLI use the same IAM evaluation; no distinction exists
- ❌ D) They are NOT equivalent — one scopes bucket-level, one scopes object-level

**S3 ARN scoping rules:**
```
Action                    │ Correct Resource ARN
──────────────────────────┼────────────────────────────────
s3:ListBucket             │ arn:aws:s3:::my-bucket
s3:GetBucketPolicy        │ arn:aws:s3:::my-bucket
s3:GetBucketVersioning    │ arn:aws:s3:::my-bucket
──────────────────────────┼────────────────────────────────
s3:GetObject              │ arn:aws:s3:::my-bucket/*
s3:PutObject              │ arn:aws:s3:::my-bucket/*
s3:DeleteObject           │ arn:aws:s3:::my-bucket/*

Policy needs BOTH lines to support
ListBucket + GetObject together ✅
```

**⚠️ If you chose D:** This is a very common S3 policy mistake. A policy with only `/*` will deny `s3:ListBucket`. A policy with only the bucket ARN will deny `s3:GetObject`. You need both.

</details>

---

### Q5 · 🟡 Intermediate · Customer Managed vs AWS Managed

Why is a Customer Managed Policy (`DataTeam-S3-ReadOnly`) BETTER than the AWS Managed `AmazonS3ReadOnlyAccess` for the data team?

- A) Customer Managed Policies are free; AWS Managed Policies cost extra per attachment
- B) Customer Managed Policies can be scoped to specific resources, matching exactly what the team needs — not all S3 buckets
- C) AWS Managed Policies can only be attached to users, not groups
- D) Customer Managed Policies automatically update when new S3 features are released

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) Customer Managed Policies allow precise resource scoping**

**Why:** The key advantage of Customer Managed Policies is precision. You control the exact actions and exact resource ARNs. AWS Managed Policies are intentionally broad to be reusable across many customers — that breadth makes them too permissive for specific workloads.

**Why the others are wrong:**
- ❌ A) Both policy types are free; IAM itself has no per-policy cost
- ❌ C) Both policy types can be attached to users, groups, and roles
- ❌ D) AWS Managed Policies actually do auto-update (AWS maintains them); Customer Managed Policies require manual updates — this is the opposite

**Comparison:**
```
AWS Managed (AmazonS3ReadOnlyAccess):
  Action: s3:Get*, s3:List*
  Resource: *                ← ALL buckets, always

Customer Managed (DataTeam-S3-ReadOnly):
  Action: s3:GetObject, s3:ListBucket
  Resource: arn:aws:s3:::analytics-data-bucket
            arn:aws:s3:::analytics-data-bucket/*
                             ← ONE bucket, exactly right

Trade-off:
  AWS Managed: less maintenance, less precise
  Customer Managed: more maintenance, more precise ✅
```

**⚠️ If you chose D:** This is actually backwards. AWS Managed Policies are maintained by AWS and receive updates. Customer Managed Policies are your responsibility — you must update them when service APIs change.

</details>

---

### Q6 · 🟡 Intermediate · Policy Variable Self-Service Scope

The `AllUsers-SelfMFA` policy uses `"Resource": "arn:aws:iam::*:user/${aws:username}"`. Alice is logged in and tries to enable MFA for Bob using this policy. What happens?

- A) Alice can manage MFA for Bob because they're in the same account
- B) Alice is denied — `${aws:username}` resolves to `alice`, so the resource ARN only matches Alice's own user
- C) Alice can manage MFA for anyone in her group
- D) The operation requires root access

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) Alice is denied — the variable resolves to her own username**

**Why:** `${aws:username}` is an IAM policy variable that resolves to the username of the caller at evaluation time. When Alice calls the API, it becomes `arn:aws:iam::*:user/alice`. Bob's user ARN is `arn:aws:iam::*:user/bob` — that's a different ARN, so no match → denied.

**Why the others are wrong:**
- ❌ A) Same account doesn't matter; the Resource ARN pattern must match the target
- ❌ C) Group membership doesn't affect what resource ARN the variable resolves to
- ❌ D) Root is not required for MFA management when the right policy is in place

**Variable resolution in action:**
```
Alice (username: "alice") calls:
  iam:EnableMFADevice
  for target: arn:aws:iam::123:user/bob

Policy Resource:
  arn:aws:iam::*:user/${aws:username}
  = arn:aws:iam::*:user/alice     ← resolves to Alice's ARN

Does resource match the target?
  Policy allows: .../user/alice
  Request is:    .../user/bob     ← NO MATCH

Result: DENIED 🚫 (Alice can only manage her own MFA)

Alice calls iam:EnableMFADevice for herself:
  Target: arn:aws:iam::123:user/alice
  Policy: arn:aws:iam::*:user/alice  ← MATCH ✅
  Result: ALLOWED
```

**⚠️ If you chose A:** IAM doesn't have an "account family trust" concept for individual user actions. Every API call is evaluated against the exact policy conditions, including resource ARN matching.

</details>

---

### Q7 · 🔴 Hard · Blast Radius with Least Privilege

A CI/CD pipeline role has the `DevTeam-EC2-NoTerminate` policy: allows StartInstances, StopInstances, DescribeInstances; denies TerminateInstances. The pipeline is compromised by an attacker. What is the blast radius?

- A) Attacker can delete all EC2 instances and their data
- B) Attacker can start/stop instances but cannot terminate them or affect any other service
- C) Attacker gains full AWS account access through the EC2 service
- D) Attacker can stop production instances, potentially causing an outage

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: D) Attacker can stop production instances — causing potential outage**

**Why:** The policy allows `ec2:StopInstances` on all resources. An attacker could stop any running EC2 instance, causing a production outage. They cannot terminate (permanent deletion), but stopping is still damaging. This shows that "least privilege" still needs careful thought — "least" doesn't mean "harmless."

**Why the others are wrong:**
- ❌ A) Terminate is explicitly denied — instances cannot be deleted
- ❌ B) Stopping production instances IS significant damage; "cannot terminate" doesn't mean "safe"
- ❌ C) EC2 permissions don't grant access to other services; IAM is service-scoped

**Blast radius analysis:**
```
Compromised role capabilities:
  ✅ ec2:StartInstances   → start stopped instances
  ✅ ec2:StopInstances    → STOP RUNNING INSTANCES ⚠️ (outage risk)
  ✅ ec2:DescribeInstances → enumerate all EC2 instances (recon)
  🚫 ec2:TerminateInstances → blocked (data safe)
  🚫 s3:*, rds:*, iam:*  → no permissions (other services safe)

Real damage possible:
  → Stop all production web servers → site goes down
  → Stop DB instances → data inaccessible (not lost)
  → Stop processing servers → batch jobs fail

Lesson: Least privilege limits blast radius
but doesn't eliminate all risk. Design matters.
Further improvement: add resource conditions
to limit to dev instances only (using tags)
```

**⚠️ If you chose B:** "Cannot terminate" is reassuring but doesn't mean the attacker is harmless. Stopping production instances is a significant availability attack — even without permanent data loss.

</details>

---

### Q8 · 🔴 Hard · Inline Policy Override Attempt

A developer has this policy from their group (no terminate):
```json
{"Effect":"Allow","Action":["ec2:StartInstances","ec2:StopInstances"],"Resource":"*"},
{"Effect":"Deny","Action":"ec2:TerminateInstances","Resource":"*"}
```
They argue: *"If I attach an inline policy allowing `ec2:TerminateInstances`, I can bypass the Deny."*
Are they correct?

- A) Yes — inline policies are evaluated separately and can override group policies
- B) Yes — inline policies attached directly to a user always win
- C) No — explicit Deny from any source overrides all Allows from all sources
- D) It depends on which policy was attached most recently

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: C) No — explicit Deny wins regardless of source**

**Why:** IAM collects ALL policies — group policies, direct policies, inline policies — and evaluates them together. An explicit Deny in ANY policy blocks the action. There is no "most specific wins" or "inline policy takes precedence" rule in IAM. Explicit Deny is absolute.

**Why the others are wrong:**
- ❌ A) There is no separate evaluation for inline policies; all policies are evaluated together
- ❌ B) Inline policy does not "win" over group policy in any scenario
- ❌ D) Attachment time/order has zero effect on IAM evaluation

**The explicit Deny principle under attack:**
```
Developer's argument:
  "Group Deny + Inline Allow = Allow wins?"

IAM reality:
  Collect all policies:
    Group policy: Deny ec2:TerminateInstances
    Inline policy: Allow ec2:TerminateInstances

  Is there any explicit Deny?
    YES → DENIED 🚫 (always, no exceptions)

  The inline Allow is completely irrelevant
  once an explicit Deny is found.

Conclusion: Explicit Deny is not bypassable
by adding more Allows — anywhere.
```

**⚠️ If you chose A or B:** This is the most dangerous IAM misconception. If inline policies could bypass group Denies, every security guardrail could be defeated by any user who can attach inline policies to themselves. IAM was designed to prevent this.

</details>

---

### Q9 · 🔴 Hard · Scoping Resource ARN Precisely

A Lambda function logs to CloudWatch. Which Resource ARN is MOST SECURE for a policy allowing `logs:PutLogEvents`?

- A) `"Resource": "*"` — allows logging to any log group
- B) `"Resource": "arn:aws:logs:*:*:*"` — allows any CloudWatch Logs action
- C) `"Resource": "arn:aws:logs:us-east-1:123456789:log-group:/aws/lambda/my-function:log-stream:*"` — scoped to this function's log streams
- D) `"Resource": "arn:aws:logs:us-east-1:123456789:log-group:*"` — all log groups in the region

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: C) Scoped to the specific function's log streams**

**Why:** The Lambda function only needs to write to its own log streams. The most secure Resource ARN targets the exact log group and log stream pattern for that function. This prevents the Lambda from being used to write to or read other application's logs.

**Why the others are wrong:**
- ❌ A) `"Resource": "*"` allows writing to ANY log group — a compromised Lambda could inject fake logs into security audit streams
- ❌ B) Even broader — `*:*:*` matches all CloudWatch Logs resources including read operations
- ❌ D) All log groups in the region — still too broad; other application logs exposed

**CloudWatch Logs ARN hierarchy:**
```
arn:aws:logs:us-east-1:123456789:log-group:/aws/lambda/my-function:log-stream:*
                                            │
              log-group ARN (bucket-level)  │  log-stream ARN (object-level)

logs:PutLogEvents → needs log-stream ARN (with :log-stream:*)
logs:CreateLogGroup → needs log-group ARN
logs:CreateLogStream → needs log-group ARN

Most secure Lambda logging policy:
  logs:CreateLogGroup    → arn:.../log-group:/aws/lambda/my-function
  logs:CreateLogStream   → arn:.../log-group:/aws/lambda/my-function:*
  logs:PutLogEvents      → arn:.../log-group:/aws/lambda/my-function:log-stream:*
```

**⚠️ If you chose A or B:** When a Lambda function is compromised, overly broad logging permissions mean an attacker could write fake entries to CloudTrail, audit, or security log groups — obscuring attack evidence.

</details>

---

### Q10 · ⚫ Expert · Instance Type Restriction via Conditions

A company wants to prevent developers from accidentally launching expensive GPU instances (like `p4d.24xlarge`). They should only be allowed to launch `t3.*` instance types. Which IAM element achieves this?

- A) Use separate IAM roles for each instance type family
- B) Add a Condition to the Allow for `ec2:RunInstances` using `ec2:InstanceType` matching `t3.*`, plus an explicit Deny for expensive instance types
- C) Use AWS Budgets to stop the account when GPU instances appear
- D) Use a resource-based policy on EC2

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) Condition on ec2:InstanceType + explicit Deny for expensive types**

**Why:** IAM condition key `ec2:InstanceType` lets you scope `ec2:RunInstances` to specific instance families. The Allow + Condition grants only t3 family. The explicit Deny for expensive types adds a hard backstop for defense in depth.

**Why the others are wrong:**
- ❌ A) Separate roles don't restrict instance types; a developer could still launch any type through the same role
- ❌ C) Budgets detect overspend but don't prevent the launch; you'd detect the violation after the fact
- ❌ D) EC2 doesn't support resource-based policies (unlike S3 or Lambda)

**Instance type restriction policy:**
```json
{
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ec2:RunInstances",
      "Resource": "arn:aws:ec2:*:*:instance/*",
      "Condition": {
        "StringLike": {
          "ec2:InstanceType": "t3.*"
        }
      }
    },
    {
      "Effect": "Deny",
      "Action": "ec2:RunInstances",
      "Resource": "arn:aws:ec2:*:*:instance/*",
      "Condition": {
        "StringLike": {
          "ec2:InstanceType": ["p4d.*","p3.*","g4dn.*","inf1.*"]
        }
      }
    }
  ]
}
```

```
Developer tries ec2:RunInstances:
  t3.medium → Condition matches t3.* → ALLOWED ✅
  t3.xlarge → Condition matches t3.* → ALLOWED ✅
  m5.large  → Doesn't match t3.*     → DENIED (implicit, no Allow matches)
  p4d.24xl  → Matches explicit Deny  → DENIED 🚫 (hard block)
```

**⚠️ If you chose C:** Budgets are reactive — the instance already exists and is billing you before the alert fires. IAM conditions are preventive — the launch request is rejected before the instance starts.

</details>
