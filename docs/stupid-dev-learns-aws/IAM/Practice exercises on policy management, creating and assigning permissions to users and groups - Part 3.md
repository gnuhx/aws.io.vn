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