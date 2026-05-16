# Practice Exercises: Policy Management, Users & Groups

---

## 🧪 Part 1 — Create Users, Groups & Attach Policies

**Scenario:** You just joined a startup as the AWS admin. Set up the team from scratch.

---

### Exercise 1.1 — Create IAM Groups

Create 3 groups with the following managed policies:

| Group Name | Attached Policy |
|------------|----------------|
| `dev-team` | `AmazonEC2FullAccess` + `AmazonS3ReadOnlyAccess` |
| `data-team` | `AmazonAthenaFullAccess` + `AmazonS3ReadOnlyAccess` |
| `ops-team` | `AdministratorAccess` |

**Console steps:**
```
IAM → User Groups → Create Group
→ Group name: dev-team
→ Attach policy: AmazonEC2FullAccess
→ Attach policy: AmazonS3ReadOnlyAccess
→ Create Group
```

---

### Exercise 1.2 — Create IAM Users

Create these users and assign to groups:

| Username | Group | MFA Required |
|----------|-------|--------------|
| `alice` | `dev-team` | ✅ Yes |
| `bob` | `dev-team` | ✅ Yes |
| `carol` | `data-team` | ✅ Yes |
| `dave` | `ops-team` | ✅ Yes |

**Console steps:**
```
IAM → Users → Create User
→ Username: alice
→ Access type: AWS Management Console access
→ Add to group: dev-team
→ Require MFA: Yes
```

---

### Exercise 1.3 — Verify Permissions

Log in as `alice` and test:
- ✅ Can she list EC2 instances?
- ✅ Can she read from S3?
- ❌ Can she create an S3 bucket? *(should be denied)*
- ❌ Can she access IAM? *(should be denied)*

**Expected result:** Alice can view EC2 and read S3 — nothing more.

---

## 🎯 Quiz — 10 SAA-C03 Questions

> **Choose your mode before starting:**
> - 🅰️ **Instant Mode** — reveal each answer right after you choose
> - 🅱️ **Exam Mode** — answer all 10 first, then open all reveals at the end

---

### Q1 · 🟢 Beginner · Group-Based Permission Assignment

A new backend developer joins the startup. The `dev-team` group already has `AmazonEC2FullAccess` and `AmazonS3ReadOnlyAccess`. How should you grant the new developer the same permissions?

- A) Attach both policies directly to the new developer's IAM user
- B) Add the new developer's IAM user to the `dev-team` group
- C) Create a new IAM group just for the new developer
- D) Copy the policies from an existing developer's user

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) Add the new developer's IAM user to the `dev-team` group**

**Why:** Groups exist precisely for this scenario. Adding the user to the group takes 10 seconds and inherits all policies automatically. When group policies change later, all members benefit without individual updates.

**Why the others are wrong:**
- ❌ A) Direct policy attachment works but creates a maintenance problem at scale — you must update each user individually when permissions change
- ❌ C) A single-user group defeats the purpose of groups
- ❌ D) You cannot "copy" policies from a user in IAM; policies must be attached individually

**Group membership at scale:**
```
dev-team group
  Policy: AmazonEC2FullAccess
  Policy: AmazonS3ReadOnlyAccess
    │
    ├── alice    ← existing
    ├── bob      ← existing
    └── NEW_DEV  ← add here ✅

Result: NEW_DEV instantly inherits
both policies. No other changes needed.
```

**⚠️ If you chose A:** It works once but becomes unmanageable at 10+ developers. IAM best practice is always: permissions on groups, users join groups.

</details>

---

### Q2 · 🟢 Beginner · AWS Managed Policy Scope

The `ops-team` group has `AdministratorAccess`. The `dev-team` has `AmazonEC2FullAccess`. What can `dev-team` members do that `ops-team` members CANNOT?

- A) List all EC2 instances
- B) Create and delete IAM users
- C) Nothing — AdministratorAccess includes all EC2 permissions and more
- D) Access EC2 in regions where AdministratorAccess is restricted

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: C) Nothing — `AdministratorAccess` is a superset of all other permissions**

**Why:** `AdministratorAccess` grants `"Action": "*"` on `"Resource": "*"` — literally everything. Any permission that `AmazonEC2FullAccess` grants is already included in `AdministratorAccess`.

**Why the others are wrong:**
- ❌ A) `AdministratorAccess` fully includes `ec2:DescribeInstances` and all EC2 actions
- ❌ B) IAM user management requires IAM permissions — `AdministratorAccess` has all of those too
- ❌ D) `AdministratorAccess` is not region-restricted

**Permission inclusion:**
```
AdministratorAccess
  "Action": "*"        ← ALL services
  "Resource": "*"      ← ALL resources

Contains (among everything else):
  ✅ AmazonEC2FullAccess    (ec2:*)
  ✅ AmazonS3FullAccess     (s3:*)
  ✅ IAMFullAccess          (iam:*)
  ✅ AmazonRDSFullAccess    (rds:*)
  ✅ ... every other policy

dev-team has a subset.
ops-team has the superset.
```

**⚠️ If you chose B:** `AdministratorAccess` DOES include IAM; `PowerUserAccess` (a different policy) excludes IAM. Don't confuse the two.

</details>

---

### Q3 · 🟢 Beginner · Verifying Permission Boundaries

Alice is in `dev-team` which has `AmazonS3ReadOnlyAccess`. She tries to create a new S3 bucket. What happens?

- A) The bucket is created because she has "S3 access"
- B) She is prompted to request additional permissions
- C) The operation is denied because S3ReadOnlyAccess only allows read operations
- D) She can create buckets but not upload files to them

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: C) The operation is denied — S3ReadOnlyAccess only allows read operations**

**Why:** `AmazonS3ReadOnlyAccess` grants only `s3:Get*` and `s3:List*` actions. `s3:CreateBucket` is a write action not included. IAM default is deny — if the action isn't explicitly allowed, it's blocked.

**Why the others are wrong:**
- ❌ A) "S3 access" is vague — IAM only grants exactly what the policy specifies
- ❌ B) AWS doesn't present an approval prompt; it returns `AccessDenied` immediately
- ❌ D) If she can't create the bucket, she certainly can't manage its contents either

**S3ReadOnlyAccess — what it actually allows:**
```
AmazonS3ReadOnlyAccess grants:
  ✅ s3:GetObject          (download files)
  ✅ s3:GetBucketPolicy    (read bucket config)
  ✅ s3:ListBucket         (list files in bucket)
  ✅ s3:ListAllMyBuckets   (list all buckets)

  ❌ s3:CreateBucket       (blocked)
  ❌ s3:PutObject          (blocked)
  ❌ s3:DeleteObject       (blocked)
  ❌ s3:DeleteBucket       (blocked)
```

**⚠️ If you chose A:** "Has S3 access" is exactly the kind of vague thinking that leads to real-world permission misconfigurations. Always look at the specific actions the policy grants.

</details>

---

### Q4 · 🟡 Intermediate · Multi-Group User

A data engineer needs EC2 start/stop access AND Athena query access. `dev-team` has EC2 access; `data-team` has Athena access. What should you do?

- A) Create a new `dev-data-team` group combining both policies
- B) Add the data engineer to both `dev-team` and `data-team`
- C) Attach both group policies directly to the data engineer's IAM user
- D) The data engineer must pick one group only

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) Add the data engineer to both `dev-team` and `data-team`**

**Why:** IAM users can belong to multiple groups (up to 10). Their effective permissions are the union of all groups. This is cleaner than creating a new group for every permission combination.

**Why the others are wrong:**
- ❌ A) Creating a new group for every combination leads to group sprawl; you'd end up with dozens of combinations
- ❌ C) Direct policy attachment creates drift — if `dev-team` policy changes, this user won't inherit the update
- ❌ D) IAM has no such restriction; multi-group membership is supported and recommended

**Multi-group permission union:**
```
data-engineer user
  │
  ├── dev-team   → AmazonEC2FullAccess
  └── data-team  → AmazonAthenaFullAccess
                   AmazonS3ReadOnlyAccess

Effective permissions:
  = AmazonEC2FullAccess
  + AmazonAthenaFullAccess
  + AmazonS3ReadOnlyAccess
  (union of all Allows from all groups)

Note: A Deny in ANY group applies to ALL
```

**⚠️ If you chose A:** This approach is valid but creates management overhead. Adding to multiple groups keeps group definitions clean and single-purpose.

</details>

---

### Q5 · 🟡 Intermediate · When Deny Blocks an Admin

`dave` is in `ops-team` with `AdministratorAccess`. You add a second policy to `ops-team` with an explicit `Deny` on `s3:DeleteBucket`. Dave tries to delete an S3 bucket. What happens?

- A) Dave can delete the bucket because `AdministratorAccess` outranks the Deny
- B) Dave is blocked — the explicit Deny overrides `AdministratorAccess`
- C) Dave needs to temporarily remove himself from `ops-team` to delete the bucket
- D) The Deny only applies to non-admin users

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) Dave is blocked — explicit Deny overrides AdministratorAccess**

**Why:** This is a critical real-world pattern. You can use explicit Deny to create hard guardrails that even admins cannot bypass. This is how organizations protect critical resources: apply an `AdministratorAccess` equivalent but add specific Denies for destructive operations.

**Why the others are wrong:**
- ❌ A) `AdministratorAccess` is an AWS Managed Policy with `Allow *`. An explicit Deny from another policy in the same evaluation context always wins
- ❌ C) IAM doesn't have a "temporary remove yourself" mechanism; permissions are always evaluated as attached
- ❌ D) Explicit Deny applies to ALL identities — admin status provides no exception

**Guardrail with explicit Deny:**
```
ops-team policies:
  Policy 1: AdministratorAccess → Allow *:*
  Policy 2: SafetyGuardrail     → Deny s3:DeleteBucket

Dave attempts s3:DeleteBucket:
  Found Allow? YES (from Policy 1)
  Found Deny?  YES (from Policy 2)
               │
         Deny wins 🚫

This is INTENTIONAL — use explicit Deny
to protect critical operations even from admins
```

**⚠️ If you chose A:** `AdministratorAccess` is the broadest Allow but it's still just an Allow. Any explicit Deny beats it. This is how you build a safety net on top of admin access.

</details>

---

### Q6 · 🟡 Intermediate · Group Permission Inheritance

`alice` is in `dev-team` which has `AmazonS3ReadOnlyAccess`. You attach `AmazonS3FullAccess` directly to Alice's IAM user. Alice now tries to upload a file to S3. What happens?

- A) Blocked — group policies override user policies
- B) Allowed — IAM takes the union of all Allows; `AmazonS3FullAccess` from her user policy allows uploads
- C) Allowed only if Alice is also in `ops-team`
- D) The group's read-only policy cancels the user's full access policy

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) Allowed — IAM takes the union of all Allows**

**Why:** IAM does not have policy precedence based on where the policy is attached (group vs. user). All policies are collected and evaluated together. Group's `S3ReadOnly` allows reads. User's `S3FullAccess` adds write allows. No Deny exists → upload is allowed.

**Why the others are wrong:**
- ❌ A) There is no concept of "group policies override user policies" in IAM; they're evaluated equally
- ❌ C) Group membership doesn't affect this logic
- ❌ D) More permissive doesn't cancel less permissive — they add together (union)

**Permission union diagram:**
```
Alice's effective permissions:
  From dev-team: AmazonS3ReadOnlyAccess
    → Allow s3:Get*, s3:List*
  From direct:   AmazonS3FullAccess
    → Allow s3:*

Combined (union):
  Allow s3:Get*   ✅ (from group)
  Allow s3:List*  ✅ (from group)
  Allow s3:Put*   ✅ (from direct)
  Allow s3:Delete* ✅ (from direct)
  Allow s3:Create* ✅ (from direct)

No explicit Deny anywhere → Upload succeeds ✅
```

**⚠️ If you chose A or D:** IAM has no "most restrictive wins" rule for Allows. Only explicit Deny wins unconditionally. Without a Deny, broader permissions prevail through the union.

</details>

---

### Q7 · 🔴 Hard · Bucket Policy Overriding IAM Allow

Alice has `AmazonS3FullAccess` on her IAM user (from Q6 above). An S3 bucket policy explicitly denies `s3:PutObject` for `arn:aws:iam::123:user/alice`. Alice tries to upload a file to that bucket. What happens?

- A) Upload succeeds because her IAM user policy allows it
- B) Upload is denied because the bucket policy's explicit Deny overrides the IAM Allow
- C) IAM user policies always override bucket policies
- D) Alice needs `AdministratorAccess` to bypass bucket policies

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) Upload is denied — bucket policy explicit Deny wins**

**Why:** When an identity accesses a resource, AWS evaluates BOTH the identity-based policy AND the resource-based policy (bucket policy) together. An explicit Deny in either source blocks the action. The bucket policy's Deny overrides Alice's IAM Allow.

**Why the others are wrong:**
- ❌ A) IAM Allows do not override resource-based Denies; both are evaluated together
- ❌ C) There is no IAM rule where user policies override bucket policies
- ❌ D) Even `AdministratorAccess` cannot override an explicit Deny — as Q5 established

**Cross-policy evaluation:**
```
Alice attempts s3:PutObject on bucket "prod-uploads"
               │
  AWS evaluates ALL applicable policies:
  ┌─────────────────────────────────┐
  │ IAM User Policy (Alice):        │
  │   AmazonS3FullAccess → Allow s3:*│ → finds Allow ✅
  └─────────────────────────────────┘
  ┌─────────────────────────────────┐
  │ Bucket Policy (prod-uploads):   │
  │   Deny s3:PutObject for alice   │ → finds Deny 🚫
  └─────────────────────────────────┘
               │
  Explicit Deny found → DENIED
  (even though IAM says Allow)
```

**⚠️ If you chose A:** This is the most important cross-policy trap. Resource policies and identity policies are NOT independent — they're evaluated together, and any Deny in either wins.

</details>

---

### Q8 · 🔴 Hard · MFA CLI Enforcement

All IAM users have an MFA-enforcement policy attached: `Deny * where aws:MultiFactorAuthPresent = false`. Alice's CLI profile does NOT pass an MFA session token. She runs `aws s3 ls`. What happens?

- A) The command succeeds because CLI access bypasses MFA requirements
- B) The command is denied because the condition matches (no MFA present = condition is true = Deny fires)
- C) The command succeeds only for read actions
- D) The Deny only applies to console logins, not CLI

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) The command is denied — no MFA present means the Deny condition fires**

**Why:** The condition `aws:MultiFactorAuthPresent = false` evaluates to TRUE when no MFA session token is present (which is the case for standard CLI profiles). Since the Deny condition is satisfied, the Deny applies. CLI and Console are treated equally by IAM conditions — there's no CLI exemption.

**Why the others are wrong:**
- ❌ A) CLI has no inherent bypass of IAM conditions; it's subject to the same policy evaluation
- ❌ C) Read vs write action type doesn't matter here — the Deny applies to `Action: "*"`
- ❌ D) `aws:MultiFactorAuthPresent` applies to all API calls, regardless of console or CLI origin

**MFA CLI workflow (correct way):**
```
Without MFA session (BLOCKED):
  aws s3 ls → AccessDenied 🚫
  (MultiFactorAuthPresent = false → Deny fires)

Correct CLI workflow with MFA:
  Step 1: aws sts get-session-token
          --serial-number arn:...mfa-device
          --token-code 123456
          → returns AccessKeyId, SecretKey, SessionToken

  Step 2: Export temp credentials with SessionToken
          export AWS_SESSION_TOKEN=...

  Step 3: aws s3 ls → succeeds ✅
          (MultiFactorAuthPresent = true → Deny doesn't fire)
```

**⚠️ If you chose A or D:** IAM conditions don't distinguish between CLI and console. The condition evaluates the credentials used — if no MFA session token is in the credentials, MFA is not present.

</details>

---

### Q9 · 🔴 Hard · IAM Policy Variables

You have 20 developers and each needs read-only access to their own S3 "folder" (`dev-uploads/{username}/`). What is the MOST MAINTAINABLE approach?

- A) Create 20 separate IAM users each with a custom inline policy scoped to their folder
- B) Create 20 separate IAM groups, one per developer
- C) Create one IAM group with a policy using `${aws:username}` variable to scope access to each user's own prefix
- D) Grant all developers `AmazonS3FullAccess` and rely on honor system

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: C) One group with `${aws:username}` policy variable**

**Why:** IAM policy variables resolve at evaluation time to the calling user's identity. `${aws:username}` becomes `alice` when Alice calls the API, and `bob` when Bob calls it. One policy handles all 20 users with perfect per-user scoping.

**Why the others are wrong:**
- ❌ A) 20 inline policies = 20 things to maintain; adding developer #21 requires another manual policy
- ❌ B) 20 groups = same overhead as 20 inline policies; groups are for different PERMISSION SETS, not per-user customization
- ❌ D) Honor systems fail; least privilege must be enforced, not trusted

**Policy variable in action:**
```json
{
  "Effect": "Allow",
  "Action": ["s3:GetObject", "s3:ListBucket"],
  "Resource": [
    "arn:aws:s3:::dev-uploads",
    "arn:aws:s3:::dev-uploads/${aws:username}/*"
  ]
}
```

```
When alice calls s3:GetObject on dev-uploads/alice/file.txt:
  ${aws:username} resolves to "alice"
  Resource matches: dev-uploads/alice/* ✅ Allowed

When alice calls s3:GetObject on dev-uploads/bob/file.txt:
  ${aws:username} resolves to "alice"
  Resource pattern: dev-uploads/alice/*
  Request: dev-uploads/bob/... ❌ No match → Denied
```

**⚠️ If you chose A or B:** These scale linearly with team size. IAM policy variables are designed exactly for this pattern — one policy, personalized behavior per user.

</details>

---

### Q10 · ⚫ Expert · Temporary Contractor Access

A startup needs to give 3 contractors Console access for exactly 2 weeks. The contractors do NOT have their own AWS accounts. You want no permanent credentials left after the engagement. Which is the BEST approach?

- A) Create IAM users for contractors, note to delete them after 2 weeks
- B) Create temporary IAM users with console access, set account password policy to expire in 14 days, and schedule a Lambda to delete users on day 15
- C) Create an IAM role, configure AWS IAM Identity Center (SSO) with a time-limited assignment, and remove the assignment after 2 weeks — the role itself remains but is unassumable
- D) Share an existing employee's IAM user credentials temporarily

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: C) IAM Identity Center with time-limited role assignment**

**Why:** IAM Identity Center manages access assignments centrally. Removing the assignment immediately revokes access. The underlying role remains but is unassumable without the assignment. No credentials exist to revoke or chase down. This is the cleanest enterprise approach for temporary external access.

**Why the others are wrong:**
- ❌ A) "Note to delete" is error-prone — humans forget; no automation means orphaned credentials risk
- ❌ B) Password expiry stops console login but access keys (if created) persist; Lambda deletion is operational overhead with failure modes
- ❌ D) Sharing credentials destroys accountability and is against IAM security best practices

**Contractor access lifecycle:**
```
Day 0: Contractor engagement starts
  ① Create IAM Identity Center user
     (or federate contractor's existing IdP)
  ② Assign permission set to user
     (e.g., ReadOnly for specific accounts)
  ③ Contractor uses SSO URL to log in

Day 1-13: Contractor works normally
  All actions logged in CloudTrail
  under contractor's unique identity

Day 14: Engagement ends
  ① Remove IAM Identity Center assignment
     → Role becomes unassumable instantly
  ② Disable/delete the Identity Center user
  ③ No credentials to revoke anywhere ✅
  ④ Full audit trail preserved in CloudTrail
```

**⚠️ If you chose A:** "Note to delete" is a manual process. IAM users are frequently forgotten and left active for months after contractors leave. Automation (option B) is better but still complex. Identity Center (option C) removes the problem by design.

</details>

