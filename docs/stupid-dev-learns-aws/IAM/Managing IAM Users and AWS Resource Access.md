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