## 🧪 Part 3 — Simulate, Audit & Troubleshoot

**Scenario:** Something's wrong with permissions. Find it, fix it.

---

### Exercise 3.1 — Use IAM Policy Simulator

Test policies **before** applying them in production.

```
AWS Console → IAM → Policy Simulator
→ Select User: alice
→ Service: S3
→ Action: DeleteBucket
→ Run Simulation
→ Expected result: DENIED ✅
```

**Tasks to simulate:**
| User | Action | Expected |
|------|--------|----------|
| alice | `ec2:TerminateInstances` | ❌ Deny |
| alice | `ec2:StopInstances` | ✅ Allow |
| carol | `s3:GetObject` on `analytics-data-bucket` | ✅ Allow |
| carol | `s3:GetObject` on `prod-bucket` | ❌ Deny |
| dave | `iam:CreateUser` | ✅ Allow |

---

### Exercise 3.2 — Audit with IAM Access Analyzer

Find **overly permissive** or **unused** permissions.

```
IAM → Access Analyzer → Create Analyzer
→ Analyzer name: startup-analyzer
→ Zone of trust: Current account
→ Create

Review findings:
- Any public S3 bucket policies?
- Any cross-account role trust issues?
- Any unused access keys older than 90 days?
```

---

### Exercise 3.3 — Troubleshoot a Broken Permission

**Problem:** Bob (dev-team) says he can't list EC2 instances. Fix it.

**Debugging steps:**
```
Step 1 → IAM → Users → bob → Permissions tab
         Check which policies are attached (via group or direct)

Step 2 → IAM → Policy Simulator → select bob
         Test ec2:DescribeInstances
         Look for explicit Deny overriding Allow

Step 3 → Check if bob is in the correct group
         IAM → Users → bob → Groups tab

Step 4 → Check the custom policy for typos in Action or Resource ARN

Step 5 → Fix and re-simulate → confirm Allow ✅
```

**Common culprits:**
- Typo in action name (`ec2:DescribeInstance` vs `ec2:DescribeInstances`)
- Wrong ARN region or account ID
- An **explicit Deny** somewhere overriding the Allow
- User removed from group accidentally

---

> 💡 **Exam tips across all 3 parts:**
> - **Explicit Deny always wins** — even if 10 policies Allow it
> - **Policy Simulator** is your best friend for pre-testing
> - **Access Analyzer** finds unintended public/cross-account exposure
> - Customer Managed Policies > AWS Managed Policies for least privilege
> - Always test with the **actual user**, not just the policy in isolation

---

## 🎯 Quiz — 10 SAA-C03 Questions

> **Choose your mode before starting:**
> - 🅰️ **Instant Mode** — reveal each answer right after you choose
> - 🅱️ **Exam Mode** — answer all 10 first, then open all reveals at the end

---

### Q1 · 🟢 Beginner · Policy Simulator Purpose

What is the primary purpose of the IAM Policy Simulator?

- A) To automatically generate IAM policies based on your usage patterns
- B) To test whether a specific IAM action will be allowed or denied for a given user or role — before applying policies in production
- C) To simulate AWS service outages and test how applications respond
- D) To estimate cost savings from IAM policy optimization

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) Test Allow or Deny outcomes before applying policies**

**Why:** The Policy Simulator lets you select a user or role, choose a service and action, and see exactly what the outcome would be — with the specific policy statement that caused it. This prevents "oops, I just locked out all developers" moments in production.

**Why the others are wrong:**
- ❌ A) IAM Access Advisor (not Simulator) shows which services a user has accessed; neither auto-generates policies
- ❌ C) The Simulator is specifically for IAM evaluation, not service availability testing
- ❌ D) IAM has no cost optimization tool; Cost Explorer handles billing

**Policy Simulator workflow:**
```
Before deploying a new policy:

1. Open: IAM → Policy Simulator
2. Select: User (e.g., alice)
3. Choose: Service (EC2), Action (TerminateInstances)
4. Click: Run Simulation
5. Result:
   ┌────────────────────────────────────┐
   │ Action: ec2:TerminateInstances     │
   │ Result: DENIED                     │
   │ Reason: Explicit Deny in           │
   │         DevTeam-EC2-NoTerminate    │
   └────────────────────────────────────┘
6. Verify all expected outcomes before
   deploying to production ✅
```

**⚠️ If you chose A:** IAM Access Advisor (different tool) shows services accessed, but it still doesn't auto-generate policies. Always review and write policies intentionally.

</details>

---

### Q2 · 🟢 Beginner · Access Analyzer Purpose

IAM Access Analyzer helps you:

- A) Monitor who logged into the AWS Console in the last 24 hours
- B) Identify resources shared with external entities or that have overly permissive access beyond your trust zone
- C) Automatically fix overly permissive policies
- D) Track IAM user password changes

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) Identify resources shared externally or overly permissive access**

**Why:** Access Analyzer examines resource-based policies (S3 buckets, IAM roles, KMS keys, SQS queues, Lambda functions) and reports findings when access is granted outside your defined "zone of trust" — such as to another AWS account, to `Principal: *` (public), or to an unknown external entity.

**Why the others are wrong:**
- ❌ A) CloudTrail + CloudWatch handles login monitoring; Access Analyzer is not real-time event-based
- ❌ C) Access Analyzer finds problems; it does NOT auto-fix them. Remediation is always manual
- ❌ D) IAM Credentials Report tracks password changes; Access Analyzer focuses on access exposure

**Access Analyzer findings example:**
```
IAM Access Analyzer (zone of trust: account 123456789)

Finding 1: S3 Bucket "public-data"
  Status: ACTIVE
  Issue: Bucket policy allows Principal: *
         (public internet access)
  Action: Review — is this intentional?

Finding 2: IAM Role "audit-role"
  Status: ACTIVE
  Issue: Trust policy allows
         arn:aws:iam::999999999:root
         (external account, not in trust zone)
  Action: Verify — is this an authorized auditor?

Finding 3: Lambda function "process-payments"
  Status: ACTIVE
  Issue: Resource policy allows
         Principal: arn:aws:iam::888888888:*
  Action: Investigate — unknown account
```

**⚠️ If you chose C:** Access Analyzer is a detection and reporting tool, not a remediation tool. Human review and action is always required.

</details>

---

### Q3 · 🟢 Beginner · First Debugging Step

Bob reports he cannot list EC2 instances even though he's supposed to be in `dev-team`. What should you check FIRST?

- A) Call AWS Support and report an EC2 service issue
- B) Check Bob's IAM user permissions and verify his group membership in the IAM console
- C) Delete and recreate Bob's IAM user
- D) Verify EC2 service health in the AWS Service Health Dashboard

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) Check Bob's IAM user permissions and group membership**

**Why:** The most common cause of unexpected `AccessDenied` is a misconfiguration — wrong group, wrong policy attached, or a Deny overriding an Allow. Start with the simplest explanation: verify the actual state of Bob's IAM configuration before assuming a service issue.

**Why the others are wrong:**
- ❌ A) EC2 service issues are rare and would affect all users; IAM misconfig is far more common
- ❌ C) Deleting and recreating fixes nothing if the root cause is a missing group assignment or wrong policy
- ❌ D) If EC2 was down, all users would be affected — not just Bob

**Systematic debugging approach:**
```
Bob reports: "Cannot list EC2 instances"
            │
Step 1: IAM → Users → bob → Permissions tab
         → What policies are attached?
         → Which groups is he in?
            │
Step 2: IAM → Users → bob → Groups tab
         → Is bob actually in dev-team?
         → Maybe he was accidentally removed
            │
Step 3: IAM → Policy Simulator → select bob
         → Test ec2:DescribeInstances
         → Result shows: DENY with reason
            │
Step 4: Open the policy that caused the Deny
         → Look for typos, wrong ARNs
         → Look for explicit Deny
            │
Step 5: Fix → re-simulate → confirm Allow ✅
```

**⚠️ If you chose A or D:** Service issues affect all users equally. If only Bob has the problem, it's almost certainly an IAM configuration issue.

</details>

---

### Q4 · 🟡 Intermediate · Simulator Shows Allow but Real Access Fails

You run the Policy Simulator for alice with `ec2:StopInstances` — result is **ALLOWED**. But Alice gets `Access Denied` in the real AWS Console. What is the MOST LIKELY explanation?

- A) The Policy Simulator is unreliable and should not be trusted
- B) Alice's browser cache is stale and needs clearing
- C) A Service Control Policy (SCP) from AWS Organizations is denying the action — SCPs are not always reflected in the account-level Policy Simulator
- D) `ec2:StopInstances` requires MFA even when the policy allows it

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: C) An SCP from AWS Organizations is blocking the action but wasn't simulated**

**Why:** The IAM Policy Simulator evaluates identity-based and resource-based policies within an account. But it does NOT always include SCPs applied at the AWS Organizations level. An SCP Deny from a parent OU will block the action in real life — but the simulator in the member account may show ALLOW because it's not simulating the full org policy stack.

**Why the others are wrong:**
- ❌ A) The Simulator is accurate for what it simulates — it's just incomplete regarding org-level SCPs
- ❌ B) Browser cache doesn't affect IAM authorization decisions; these are server-side
- ❌ D) `ec2:StopInstances` doesn't inherently require MFA unless a specific Condition policy enforces it

**Policy evaluation layers the Simulator may miss:**
```
Full real-world evaluation order:
1. SCPs (AWS Organizations)   ← Simulator may NOT include this
2. Resource-based policies    ← Simulator includes
3. Identity-based policies    ← Simulator includes
4. Permission boundaries      ← Simulator includes (if selected)
5. Session policies           ← Simulator includes

Real deny:
  SCP → Deny ec2:StopInstances in this account
         │
         ↓
  Simulator (account level) → ignores SCP → shows Allow
  Real API call → SCP evaluated → DENIED 🚫

Always verify: Check Org-level SCPs when
simulator says Allow but console says Denied
```

**⚠️ If you chose A:** The Simulator is a valuable tool — just understand its limitations. SCPs and permission boundaries from other accounts aren't always captured.

</details>

---

### Q5 · 🟡 Intermediate · Access Analyzer Finding — Public S3 Bucket

Access Analyzer reports: *"S3 bucket `dev-assets` has a bucket policy allowing `Principal: *` with `s3:GetObject`."* You confirm this bucket should NOT be public. What is the FASTEST way to block public access?

- A) Delete the bucket and recreate it without the public policy
- B) Remove the `Principal: *` statement from the bucket policy
- C) Enable S3 Block Public Access on the bucket — this overrides the bucket policy regardless of its content
- D) Move the bucket to a private VPC subnet

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: C) Enable S3 Block Public Access on the bucket**

**Why:** S3 Block Public Access is a feature that overrides any bucket policy or ACL that would grant public access — even if the policy explicitly allows `Principal: *`. It's the fastest and most reliable protection because it doesn't require you to correctly parse and edit the bucket policy.

**Why the others are wrong:**
- ❌ A) Deleting and recreating is destructive and causes data loss risk
- ❌ B) Editing the bucket policy is correct but slower — you must find the right statement and edit carefully. Block Public Access is safer and faster
- ❌ D) S3 is not a VPC resource; S3 buckets don't live in subnets

**Block Public Access hierarchy:**
```
S3 Bucket
  │
  ├── Block Public Access (account level)  ← overrides everything
  ├── Block Public Access (bucket level)   ← overrides bucket policy
  │
  ├── Bucket Policy: Allow Principal: *    ← this is the problem
  └── ACL settings

When Block Public Access = ON:
  The bucket policy's "Principal: *" Allow
  is effectively nullified.
  Public requests → BLOCKED ✅

Additional step: also fix the bucket policy
(remove the Principal:* statement) so the
issue doesn't reappear if BPA is disabled
```

**⚠️ If you chose B:** Editing the bucket policy is the correct permanent fix — but if you make a mistake in the JSON, you might leave the bucket still public. Block Public Access is the safe immediate action; clean up the policy as a follow-up.

</details>

---

### Q6 · 🟡 Intermediate · Silent IAM Misconfiguration

During Exercise 3.3, the policy had `"ec2:DescribeInstance"` (missing the trailing `s`). What TYPE of error does this cause?

- A) A policy validation error — IAM rejects the unknown action name and refuses to save the policy
- B) A syntax error — the JSON is malformed
- C) A silent misconfiguration — IAM saves the policy without error, but the unknown action is ignored, causing unexpected Deny
- D) A deployment error — the policy can be saved but cannot be attached to a group

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: C) Silent misconfiguration — IAM ignores unknown action names**

**Why:** IAM does NOT validate action names against a known list at save time. You can write `"Action": "ec2:DescribeInstance"` (wrong) and IAM will accept the policy. But since `ec2:DescribeInstance` doesn't exist, it never matches any real API call. The result is a policy that appears to allow the action but actually provides no permission — a silent bug.

**Why the others are wrong:**
- ❌ A) IAM does NOT reject unknown action names; it saves the policy successfully
- ❌ B) The JSON can be syntactically valid even with wrong action names
- ❌ D) The policy attaches and is active — it just silently doesn't do what you intended

**The silent failure mode:**
```
Policy written:
  { "Action": "ec2:DescribeInstance" }  ← typo (missing 's')

IAM response when saving: "Policy created ✅"
No error. No warning. No validation.

Bob tries ec2:DescribeInstances:
  IAM looks for matching Allow:
    "ec2:DescribeInstance" — doesn't match ec2:DescribeInstances
    No other Allows found
    → Implicit Deny 🚫

Bob reports: "Can't list EC2 instances"
Admin looks at policy: sees "DescribeInstance" — looks fine
Spends 30 minutes debugging...
Finally catches the missing 's'

Lesson: Always verify action names
against AWS documentation. Use the
Policy Simulator to confirm ALLOW before deploying.
```

**⚠️ If you chose A:** This is a critical fact — IAM trusts you to write correct action names. It doesn't validate them. Always test with the Policy Simulator after writing custom policies.

</details>

---

### Q7 · 🔴 Hard · Cross-Account Trust Vulnerability

Access Analyzer flags this role trust policy as a finding:
```json
{
  "Principal": { "AWS": "arn:aws:iam::*:root" }
}
```
Why is this a CRITICAL security issue?

- A) The `*` wildcard in the ARN means any AWS account can assume this role
- B) The `:root` suffix means only root accounts can assume this role, which is too restrictive
- C) The trust policy is missing a Condition block, making it read-only
- D) Cross-account trust policies must use account IDs, not ARNs

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: A) `*` in the account field means ANY AWS account can assume this role**

**Why:** In a principal ARN, the `*` replaces the account ID. `arn:aws:iam::*:root` means "the root principal of any AWS account" — and since `:root` means any principal in that account (not specifically the root user), this effectively allows any IAM identity from any of the millions of AWS accounts in the world to attempt to assume this role.

**Why the others are wrong:**
- ❌ B) In trust policies, `:root` doesn't mean the root user — it means any principal in that account
- ❌ C) Missing Condition doesn't make a policy read-only; it just removes additional constraints (making it less secure)
- ❌ D) You CAN use ARNs in trust policies; the problem is the wildcard account ID

**Trust policy vulnerability:**
```
Vulnerable trust policy:
  "Principal": { "AWS": "arn:aws:iam::*:root" }
  = ANY identity in ANY AWS account

Correct trust policy (specific auditor):
  "Principal": { "AWS": "arn:aws:iam::123456789:root" }
  = Only principals from account 123456789

Even better (with ExternalId):
  "Principal": { "AWS": "arn:aws:iam::123456789:root" },
  "Condition": {
    "StringEquals": { "sts:ExternalId": "agreed-secret" }
  }
  = Account 123456789 + must know the secret ✅

Wildcard accounts create a role that
any attacker with an AWS account can assume
if they know the role ARN (which may be guessable)
```

**⚠️ If you chose B:** `:root` in a trust policy Principal means any IAM principal in that account (not the root user). It's the opposite of restrictive — it's maximally permissive for that account.

</details>

---

### Q8 · 🔴 Hard · Why Carol Can't Query Athena

Carol is in `data-team` with `AmazonAthenaFullAccess`. The Policy Simulator confirms all Athena actions are ALLOWED for Carol. She still gets `Access Denied` when running a query. What is the MOST LIKELY cause?

- A) Athena requires a paid upgrade to enable multi-user access
- B) `AmazonAthenaFullAccess` doesn't include query execution permissions
- C) The S3 bucket storing Athena query results has a bucket policy that denies Carol's access
- D) Carol needs to be in both `data-team` and `ops-team` to run Athena queries

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: C) The S3 bucket for Athena query results is blocking Carol**

**Why:** Athena requires an S3 location to write query results. If the bucket policy for that results bucket denies Carol's access (or doesn't explicitly allow her), Athena cannot write the results — and the query fails with `AccessDenied`. The IAM Simulator only evaluated Carol's IAM policies, not the resource-based S3 bucket policy.

**Why the others are wrong:**
- ❌ A) Athena is a standard pay-per-use service with no user-count limitations
- ❌ B) `AmazonAthenaFullAccess` does include `athena:StartQueryExecution` and all query actions
- ❌ D) Group membership doesn't affect this; the issue is the S3 resource policy

**Athena query result flow:**
```
Carol runs Athena query:
         │
  Athena needs to write results to S3
         │
  Uses Carol's identity credentials
         │
  Bucket policy evaluated for S3 write:
  ┌──────────────────────────────────┐
  │ Bucket: athena-query-results     │
  │ Policy: Deny all except ops-team │ ← blocks Carol
  └──────────────────────────────────┘
         │
  Access Denied 🚫
  (even though Athena IAM is fine)

Fix: Add carol (or data-team group) to
the S3 results bucket policy, or use
an S3 bucket that all teams can write to
```

**⚠️ If you chose B:** This is a common debugging trap. When the Policy Simulator says ALLOW but the action still fails, look for resource-based policies (S3, SQS, KMS) that create a separate Deny layer. The Simulator only evaluates one side.

</details>

---

### Q9 · 🔴 Hard · Verifying Access Key Rotation Claims

AWS Config rule `access-keys-rotated` flags dave's key as non-compliant (older than 90 days). Dave says he "rotated it last week." How do you verify his claim?

- A) Ask Dave to show you the creation timestamp in his terminal
- B) Check the IAM Credentials Report — it shows `access_key_last_rotated` and `access_key_1_last_used_date` per user
- C) Check EC2 CloudWatch Logs for access key events
- D) Check the AWS Cost Explorer for recent API activity

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) Check the IAM Credentials Report**

**Why:** The IAM Credentials Report is a downloadable CSV that shows every IAM user's key metadata: creation date, last rotation date, last used date, and whether MFA is active. This is the authoritative source for auditing credential age and rotation compliance.

**Why the others are wrong:**
- ❌ A) Dave could show a fake terminal session; the IAM Credentials Report is an AWS-generated audit artifact
- ❌ C) CloudWatch Logs captures application logs, not IAM credential metadata
- ❌ D) Cost Explorer shows billing, not credential rotation history

**IAM Credentials Report fields (per user):**
```
IAM → Credential Report → Download CSV

Relevant columns for dave's key:
  user                    → dave
  access_key_1_active     → true
  access_key_1_last_rotated → 2026-02-01T00:00:00+00:00  ← actual date
  access_key_1_last_used_date → 2026-05-10T00:00:00+00:00

If last_rotated = 2026-02-01 and today is 2026-05-15:
  That's 103 days ago — NON-COMPLIANT
  Dave's "last week" claim is incorrect
  (or he rotated informally without AWS recording it
   = he didn't actually rotate the AWS key)

The report is generated by AWS, not by users —
it cannot be falsified.
```

**⚠️ If you chose A:** User-provided evidence can be fabricated. The Credentials Report is generated by AWS and cannot be manipulated by the user — it's the authoritative audit trail.

</details>

---

### Q10 · ⚫ Expert · Full Policy Debugging Flow

After completing all 3 exercises, you create a new policy for alice with this JSON — but the Policy Simulator shows `ec2:DescribeInstances` as **DENIED** for alice even though you intended to Allow it. Walk through the correct debugging sequence and identify the most likely root cause.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ec2:StartInstances", "ec2:StopInstances"],
      "Resource": "*"
    },
    {
      "Effect": "Deny",
      "Action": "ec2:TerminateInstances",
      "Resource": "*"
    }
  ]
}
```

- A) The Deny on TerminateInstances is blocking DescribeInstances too
- B) `ec2:DescribeInstances` is missing from the Allow — it was never granted, so it's implicitly denied
- C) The Deny statement must come before the Allow statement
- D) `ec2:DescribeInstances` requires `AdministratorAccess`

<details>
<summary>💡 Reveal Answer</summary>

**✅ Correct: B) `ec2:DescribeInstances` was never granted — implicit deny**

**Why:** The policy only explicitly allows `StartInstances` and `StopInstances`. `ec2:DescribeInstances` is not mentioned. IAM's default is implicit deny. If an action isn't explicitly allowed somewhere, it's denied. The Deny on TerminateInstances is also unrelated to DescribeInstances.

**Why the others are wrong:**
- ❌ A) A Deny on `TerminateInstances` only blocks `TerminateInstances` — it has no effect on `DescribeInstances`
- ❌ C) Statement order has absolutely no effect on IAM evaluation — this is a persistent myth
- ❌ D) `ec2:DescribeInstances` is a standard describe action; it doesn't require admin access

**Full debugging flow:**
```
Simulator shows: ec2:DescribeInstances → DENIED for alice

Step 1: Check the policy for DescribeInstances
  Statement 1: Allow StartInstances, StopInstances
               → DescribeInstances NOT listed here
  Statement 2: Deny TerminateInstances
               → DescribeInstances NOT mentioned

Step 2: No Allow found for DescribeInstances
  → Implicit Deny applies (default)

Step 3: Check other attached policies (group)
  → If dev-team has old policy with DescribeInstances: check it
  → If no other policy allows it: still denied

Root cause: ec2:DescribeInstances was omitted from the Allow list

Fix: Add ec2:DescribeInstances to Statement 1:
  "Action": [
    "ec2:StartInstances",
    "ec2:StopInstances",
    "ec2:DescribeInstances"  ← add this
  ]

Re-simulate → ALLOWED ✅

Key lesson: Always simulate EVERY action the
user needs before deploying. Don't assume
"related" actions are automatically granted.
```

**⚠️ If you chose A:** This reflects the dangerous mental model that "Deny spreads to similar actions." In IAM, Deny is precise — it only blocks the exact actions listed in its Action field. `TerminateInstances` Deny has zero effect on `DescribeInstances`.

</details>