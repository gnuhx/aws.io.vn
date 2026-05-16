# Managing IAM Users and AWS Resource Access

---

## 📘 Concept

**IAM Users** are individual identities created inside your AWS account. Each represents a person or application that needs to interact with AWS.

AWS resource access is managed through a combination of:
- **IAM Users** → for humans/apps needing long-term credentials
- **IAM Groups** → collection of users sharing the same permissions
- **IAM Roles** → temporary access assumed by users, services, or apps
- **IAM Policies** → the actual permission rules attached to any of the above

How they connect:

```
IAM User → belongs to → IAM Group → has attached → IAM Policy
IAM User → can assume → IAM Role → has attached → IAM Policy
AWS Service → assumes → IAM Role → to access → AWS Resource
```

Key rules:
- **One user = one person** — never share credentials
- **Assign permissions via Groups**, not directly to users
- **Use Roles for AWS services** (EC2, Lambda) — never embed access keys in code
- **Principle of Least Privilege** — give only what's needed, nothing more

---

## ⚠️ What Happens Without It?

| Risk | Consequence |
|------|-------------|
| Sharing IAM users | Can't audit who did what; one person leaves = change everyone's password |
| No groups, direct policies | Permissions chaos; impossible to manage at scale |
| Access keys in code | Keys pushed to GitHub = instant breach |
| Using root instead of IAM users | God-mode exposed daily (covered last topic) |
| No role for EC2/Lambda | App needs hardcoded credentials — a ticking time bomb |

Real damage: Dev hardcodes `AWS_ACCESS_KEY` in a React app → pushed to public GitHub → **bot scrapes it in 4 minutes** → crypto mining bill arrives by morning.

---

## 🏗️ Sample in Real Project

**Scenario:** You're running a startup with devs, a DevOps engineer, a data analyst, and a Lambda function that reads S3.

**Step 1 — Create Groups with policies:**
```
Group: Developers      → Policy: PowerUserAccess (no IAM)
Group: DevOps          → Policy: AdministratorAccess
Group: DataAnalysts    → Policy: AmazonAthenaFullAccess + S3 read-only
```

**Step 2 — Create Users and assign to Groups:**
```
alice → Developers
bob   → Developers
carol → DevOps
dave  → DataAnalysts
```

**Step 3 — Create a Role for Lambda (not a user!):**
```json
{
  "Effect": "Allow",
  "Action": ["s3:GetObject"],
  "Resource": "arn:aws:s3:::data-bucket/*"
}
```
Lambda assumes this role automatically — **zero hardcoded keys**.

**Step 4 — Enable MFA for all human users**

**Step 5 — Rotate access keys every 90 days (or use roles instead)**

---

## 🏭 Funny Factory Story

At **CloudFactory Inc.**, there was only one worker badge — and everyone shared it. It was named **"admin@factory.com"**.

Alice used it to check reports. Bob used it to fix machines. Dave used it to order supplies. And one day, someone used it to order **10,000 rubber ducks** — again. Nobody knew who. The badge log just said *"admin"* 47 times.

The boss had enough. He introduced the **IAM Badge System**:
- Every worker gets their **own badge** with their name on it
- Badges are grouped: **Developers**, **DevOps**, **Analysts**
- The factory robots (Lambda, EC2) get **robot passes** (Roles) — auto-issued, auto-expired, no name badge needed
- Dave from Accounting? His badge **only opens the finance room** now

The next duck order was traced immediately to Dave. He claimed it was an accident. The badge logs disagreed. 🦆

Dave was reassigned to the rubber duck liquidation team.

---

> 💡 **Exam tip:** AWS SAA-C03 key rules:
> - **IAM Users** → humans with long-term credentials
> - **IAM Roles** → for AWS services, cross-account access, or federated users
> - **Never use root** for daily tasks
> - **Groups can't be nested** (no group inside a group)
> - One IAM user can belong to **multiple groups**
> - Roles use **temporary credentials** (more secure than access keys)

---

## 🎯 Quiz — 10 SAA-C03 Questions

> **Choose your mode before starting:**
> - 🅰️ **Instant Mode** — reveal each answer right after you choose
> - 🅱️ **Exam Mode** — answer all 10 first, then open all reveals at the end

---

### Q1 · 🟢 Beginner · EC2 Access to S3

An EC2 instance needs to read files from an S3 bucket. What is the RECOMMENDED approach?

- A) Create an IAM user with access keys and store them in the EC2 user data script
- B) Create an IAM role with S3 read permissions and attach it to the EC2 instance profile
- C) Grant the S3 bucket public read access
- D) Use the root account credentials in the application code

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) Create an IAM role and attach it to the EC2 instance profile**

**Why:** IAM roles provide temporary, automatically-rotated credentials via the EC2 instance metadata service. The application reads credentials automatically — no hardcoded keys, no manual rotation. This is the AWS-designed pattern for service-to-service access.

**Why the others are wrong:**
- ❌ A) Hardcoded keys in user data are exposed in plaintext and never rotate automatically
- ❌ C) Making S3 public exposes the data to the entire internet
- ❌ D) Root credentials should never be used in code; this is the riskiest option possible

**Role-based EC2 to S3 flow:**
```
EC2 Instance
     │
  Instance Profile (attached IAM Role)
     │
     ▼
Metadata Service (169.254.169.254)
provides temporary credentials:
  - AccessKeyId
  - SecretAccessKey
  - SessionToken
  - Expiration (auto-rotates)
     │
     ▼
Application calls S3 API
with temporary credentials ✅
(no keys stored anywhere in code)
```

**⚠️ If you chose A:** Access keys in user data appear in the EC2 console, system logs, and anywhere the instance is copied — a very common real-world breach vector.

</details>

---

### Q2 · 🟢 Beginner · New Team Member

A new developer joins the team. What is the BEST way to give them the same permissions as the rest of the development team?

- A) Share the existing developer's IAM user credentials temporarily
- B) Copy one developer's IAM user and rename it
- C) Add the new developer's IAM user to the existing developer IAM group
- D) Attach the required policies directly to the new IAM user

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: C) Add the new developer's IAM user to the existing developer IAM group**

**Why:** Groups make permission management scalable. Adding a user to a group instantly grants all group permissions. When policies change, you update the group once — not every individual user.

**Why the others are wrong:**
- ❌ A) Sharing credentials destroys accountability — audit trails become meaningless
- ❌ B) Copying users is not a real IAM feature; even if done manually, it creates drift and maintenance burden
- ❌ D) Direct policy attachment works but is unscalable — when the team policy changes, you must update 50 individual users

**Group membership benefit:**
```
Before groups:
  alice → Policy A, Policy B, Policy C
  bob   → Policy A, Policy B, Policy C   ← manage 3 policies × N users
  carol → Policy A, Policy B, Policy C

After groups:
  dev-group → Policy A, Policy B, Policy C
    ├── alice
    ├── bob
    └── carol   ← manage 1 group; users just join/leave
```

**⚠️ If you chose D:** It works but creates a maintenance problem. If you later need to update permissions, you must find and update every individual user instead of one group.

</details>

---

### Q3 · 🟢 Beginner · Services and Roles

Which IAM entity should AWS Lambda use to access DynamoDB?

- A) An IAM User with access keys embedded in the Lambda environment variables
- B) An IAM Role with a trust policy allowing Lambda to assume it
- C) The root account credentials passed as Lambda environment variables
- D) An IAM Group that contains the Lambda function

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) An IAM Role with a trust policy allowing Lambda to assume it**

**Why:** AWS services assume roles via the trust policy (`"Service": "lambda.amazonaws.com"`). Lambda automatically receives temporary credentials without any keys being stored anywhere. This is the only AWS-supported secure pattern for service access.

**Why the others are wrong:**
- ❌ A) Environment variables are visible to anyone with Lambda console access; keys don't auto-rotate
- ❌ C) Root credentials in code is catastrophically dangerous
- ❌ D) IAM Groups are for users only; services cannot be group members

**Lambda execution role flow:**
```
Lambda function invoked
         │
  Lambda service assumes
  the execution role:
    Trust policy:
    { "Service": "lambda.amazonaws.com" }
         │
  AWS STS issues temp credentials
         │
  Lambda code calls DynamoDB
  using those temp credentials ✅
         │
  Credentials expire automatically
  (Lambda gets fresh ones next invoke)
```

**⚠️ If you chose A:** Lambda environment variables are encrypted at rest but visible to anyone who can view the function configuration. They also never rotate — a leaked key stays compromised until manually rotated.

</details>

---

### Q4 · 🟡 Intermediate · Compromised Access Key

A developer accidentally pushed their IAM access key to a public GitHub repository. What is the CORRECT immediate response?

- A) Make the GitHub repository private immediately
- B) Rotate the access key in IAM
- C) Immediately deactivate and delete the compromised access key, then audit CloudTrail for unauthorized activity
- D) Create a new IAM user with new access keys

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: C) Deactivate and delete the key, then audit CloudTrail**

**Why:** Bots scan GitHub continuously — keys are often compromised within minutes of exposure. Making the repo private does not help because the key is already out. Rotating (not deleting) leaves the old key alive during the rotation window. You must delete immediately, then understand what damage was done.

**Why the others are wrong:**
- ❌ A) The key is already scraped by bots; making the repo private doesn't revoke the key
- ❌ B) Rotation changes the secret half but the old key may still work briefly during transition; also bots may have already used it
- ❌ D) Creating a new user doesn't revoke the old key — the compromised key must be explicitly deleted

**Incident timeline:**
```
Key pushed to GitHub
       │ (seconds)
       ▼
Bots scan public repos 24/7
       │ (minutes)
       ▼
Key found and tested
       │
       ▼
Your correct response:
  ① Deactivate key in IAM (immediate)
  ② Delete key in IAM (permanent)
  ③ Check CloudTrail for last 24h
     → What actions were taken?
     → From which IPs?
  ④ Assess blast radius
  ⑤ Rotate other credentials
     if the same person has multiple
```

**⚠️ If you chose B:** Rotation changes the secret but the compromised key may have been used already. Delete is always the answer when a key has been publicly exposed.

</details>

---

### Q5 · 🟡 Intermediate · Access Key Age Enforcement

A company wants to ensure all IAM access keys are rotated within 90 days. Which combination enforces AND monitors this?

- A) AWS CloudTrail alone
- B) AWS IAM Credentials Report + AWS Config rule `access-keys-rotated`
- C) Amazon GuardDuty
- D) AWS Trusted Advisor (free tier only)

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) IAM Credentials Report + AWS Config rule `access-keys-rotated`**

**Why:** The IAM Credentials Report is a downloadable CSV showing every user's key age, last use, and rotation date. AWS Config's `access-keys-rotated` managed rule continuously evaluates all keys against the max age threshold and marks non-compliant keys — triggering alerts via SNS.

**Why the others are wrong:**
- ❌ A) CloudTrail records API calls but doesn't track key age compliance
- ❌ C) GuardDuty detects threat behaviors (unusual API calls, crypto mining) — not credential age
- ❌ D) Trusted Advisor has a basic credential check but only on the free tier for a subset of checks; Config is more comprehensive

**Enforcement architecture:**
```
All IAM Users
     │
 IAM Credentials Report
 (downloadable CSV, schedule weekly)
     │ feeds into
 AWS Config Rule: access-keys-rotated
 (evaluates every key daily)
     │
 ┌───┴──────────────┐
NON-COMPLIANT    COMPLIANT
(key > 90 days)  ✅
     │
 Config marks NON_COMPLIANT
     │
 SNS notification → email / Slack
     │
 Admin rotates key
```

**⚠️ If you chose C:** GuardDuty is threat detection, not compliance management. A 91-day-old key is not inherently a threat — it's a policy violation. Different tools for different problems.

</details>

---

### Q6 · 🟡 Intermediate · IAM Group Facts

Which statement about IAM groups is TRUE?

- A) Groups can contain other groups (nested groups)
- B) Groups can assume IAM roles
- C) A user can belong to multiple groups, and permissions from all groups are combined
- D) Groups have their own login credentials and console access

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: C) A user can belong to multiple groups, and permissions from all groups are combined**

**Why:** IAM groups are flat containers. A user can be in up to 10 groups. Their effective permissions are the union of all Allow statements from all groups, minus any explicit Denies.

**Why the others are wrong:**
- ❌ A) Groups CANNOT be nested — this is a hard IAM limitation. Group-in-group does not exist.
- ❌ B) Groups cannot assume roles; only users, services, and other roles can assume roles
- ❌ D) Groups have no credentials and no console login; they are purely policy containers

**Group permission merging:**
```
User "alice" is in:
  ├── dev-team (EC2 full, S3 read)
  └── data-team (Athena full, S3 read)

Effective permissions:
  = Union of all Allows from both groups
  = EC2 full + Athena full + S3 read

If ANY group has explicit Deny X:
  = X is denied regardless of other groups
```

**⚠️ If you chose A:** Nested groups is the most common IAM misconception. Groups are a flat collection — no hierarchy allowed. If you need hierarchical permissions, use permission boundaries or SCPs.

</details>

---

### Q7 · 🔴 Hard · SAML Federation

A company uses a corporate SAML identity provider (Okta). Employees need to access AWS without individual IAM users being created for each person. Which approach is CORRECT?

- A) Create one shared IAM user per department and distribute credentials
- B) Configure AWS IAM Identity Center (SSO) with SAML federation to the corporate IdP, mapping groups to IAM roles
- C) Use root account credentials shared via a corporate password manager
- D) Create IAM users with the same usernames as the corporate directory

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) AWS IAM Identity Center with SAML federation**

**Why:** SAML federation allows corporate users to authenticate with their existing credentials (Okta, AD) and receive temporary AWS credentials via STS `AssumeRoleWithSAML`. No IAM users are created per person. Access is centrally managed in the IdP. This is the enterprise-standard pattern.

**Why the others are wrong:**
- ❌ A) Shared credentials eliminate accountability and are impossible to secure
- ❌ C) Root credentials should never be shared — catastrophic risk
- ❌ D) Creating IAM users defeats the purpose of federation and creates a sync problem as the directory changes

**SAML federation flow:**
```
Employee opens AWS Console
          │
  Redirected to corporate IdP (Okta)
          │
  Employee logs in with corporate creds
          │
  IdP validates identity
          │
  IdP issues SAML assertion
  (signed XML with role mappings)
          │
  Browser posts assertion to AWS
  (https://signin.aws.amazon.com/saml)
          │
  AWS STS: AssumeRoleWithSAML
  → issues temp credentials
          │
  Employee lands in AWS Console
  with correct IAM role ✅
  (no IAM user created)
```

**⚠️ If you chose D:** Creating shadow IAM users from a corporate directory is a maintenance nightmare — you must sync every hire, termination, and name change. Federation eliminates this entirely.

</details>

---

### Q8 · 🔴 Hard · Organization-Wide MFA

A company has 500 IAM users across multiple AWS accounts in an Organization. They need to enforce MFA for all users. What is the MOST SCALABLE approach?

- A) Attach an MFA-enforcement inline policy to every IAM user manually
- B) Create one IAM group per account with an MFA policy and add all users
- C) Use an SCP at the AWS Organizations level denying all actions when `aws:MultiFactorAuthPresent` is `false`
- D) Use AWS Config to flag non-MFA users weekly

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: C) SCP at the AWS Organizations level**

**Why:** An SCP applied to the root OU covers every account, every user, every role simultaneously. It's one policy change that enforces MFA across 500 users in any number of accounts. No per-user or per-account changes needed.

**Why the others are wrong:**
- ❌ A) Applying policies to 500 users manually is operationally impossible to maintain
- ❌ B) Per-account groups scale better than per-user but still require setup per account
- ❌ D) Config flags but doesn't block; users can still act without MFA until someone reviews the report

**SCP enforcement scope:**
```
AWS Organization (root OU)
    │
  SCP: Deny all actions when
       MultiFactorAuthPresent = false
    │
  ┌──┴──────────────────┐
  │      │              │
Account A  Account B  Account C
  │
All IAM Users + Roles
in ALL accounts
must use MFA for every API call ✅

One policy → covers everyone
```

**⚠️ If you chose D:** Config is a compliance monitoring tool, not an enforcement tool. It tells you who violates the rule but doesn't prevent the violation. For enforcement, use SCPs or Deny-based IAM policies.

</details>

---

### Q9 · 🔴 Hard · ECS Fargate and Secrets Manager

An application running on ECS Fargate needs to read a secret from AWS Secrets Manager. The application gets `AccessDenied` when calling `GetSecretValue`. What is the MOST LIKELY cause?

- A) Secrets Manager is not available in the Fargate launch type
- B) The ECS task IAM role does not have `secretsmanager:GetSecretValue` permission for that secret's ARN
- C) The secret must be in the same region as the ECS cluster
- D) Fargate tasks must use access keys to call Secrets Manager

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) The ECS task role lacks `secretsmanager:GetSecretValue` permission**

**Why:** ECS Fargate tasks use a task IAM role (not the task execution role) for application-level AWS API calls. If `secretsmanager:GetSecretValue` is not in that role's policy, the call is denied. This is the most common Fargate + Secrets Manager misconfiguration.

**Why the others are wrong:**
- ❌ A) Secrets Manager works fully with Fargate; this is not a limitation
- ❌ C) While same-region is recommended for latency, cross-region access to Secrets Manager is supported and doesn't cause AccessDenied
- ❌ D) Fargate uses the task IAM role for temp credentials; access keys are not required or recommended

**ECS Fargate role anatomy:**
```
ECS Task Definition
     │
  ┌──┴──────────────────────────────┐
  │ Task Execution Role             │
  │ (used by ECS agent to pull      │
  │  image, push logs to CW)        │
  └─────────────────────────────────┘
     │
  ┌──┴──────────────────────────────┐
  │ Task Role ← THIS ONE            │
  │ (used by APPLICATION code       │
  │  to call AWS APIs like          │
  │  Secrets Manager, DynamoDB)     │
  │                                 │
  │ Must include:                   │
  │  secretsmanager:GetSecretValue  │
  │  on the specific secret ARN ✅  │
  └─────────────────────────────────┘
```

**⚠️ If you chose D:** Task roles automatically provide temp credentials to the container via metadata service — no access keys needed or wanted.

</details>

---

### Q10 · ⚫ Expert · Third-Party Auditor Access

A third-party auditing firm needs read-only access to your AWS account for 2 weeks. You want maximum security with no permanent IAM users created. Which approach is MOST SECURE?

- A) Create a temporary IAM user with `SecurityAudit` policy and share credentials
- B) Create a cross-account IAM role with a trust policy for the auditor's AWS account ID, require an `ExternalId` condition, and attach `SecurityAudit` managed policy
- C) Share root credentials with the auditing firm for the 2-week period
- D) Create a temporary IAM user, set a password expiry of 14 days, then delete it

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) Cross-account IAM role with ExternalId condition**

**Why:** This is the industry-standard pattern for third-party access. The auditors use their own AWS credentials to assume your role — no credentials are shared. `ExternalId` prevents the "confused deputy" attack where a malicious actor tricks the auditor's account into assuming your role. No IAM users are created; access is revoked instantly by removing the trust policy.

**Why the others are wrong:**
- ❌ A) Sharing IAM credentials means the auditor can use them after the engagement; hard to fully revoke
- ❌ C) Root credentials — absolutely never shared under any circumstances
- ❌ D) Password expiry is unreliable; the user could be used after the engagement; doesn't prevent access key abuse

**Cross-account role pattern:**
```
Auditor's AWS Account (123456789)
         │
  Auditor runs: aws sts assume-role
    --role-arn arn:aws:iam::YOUR_ACCOUNT:role/AuditRole
    --external-id "agreed-secret-id-12345"
         │
YOUR Account evaluates trust policy:
  Principal: arn:aws:iam::123456789:root
  Condition: ExternalId = "agreed-secret-id-12345"
         │
  Match? → Issue temp credentials (1h)
         │
  Auditor has read-only access ✅
  using their own AWS identity
         │
After engagement:
  Delete trust policy → zero access instantly
  No credentials to revoke or chase
```

**ExternalId prevents "confused deputy":**
```
Without ExternalId:
  Any attacker who knows your role ARN
  + tricks the auditor's account
  → can assume your role ❌

With ExternalId:
  Must know the shared secret too
  → confused deputy attack blocked ✅
```

**⚠️ If you chose A:** The biggest risk with temporary IAM users is that they're hard to fully clean up. Access keys survive password expiry. Cross-account roles with ExternalId are the correct enterprise answer here.

</details>