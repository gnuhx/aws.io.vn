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


