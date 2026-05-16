export type Difficulty = 'beginner' | 'intermediate' | 'hard' | 'expert';

export interface QuizOption {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuizQuestion {
  id: string;
  difficulty: Difficulty;
  topic: string;
  question: string;
  options: QuizOption[];
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  wrongExplanations: Partial<Record<'A' | 'B' | 'C' | 'D', string>>;
  flowchart: string;
  wrongGuidance: string;
}

export interface LessonQuiz {
  postId: string;
  questions: QuizQuestion[];
}

export const quizzes: LessonQuiz[] = [
  {
    postId: 'iam-secure-root-account',
    questions: [
      {
        id: 'root-q1',
        difficulty: 'beginner',
        topic: 'First Action on a New Account',
        question: 'A company just signed up for AWS. The security team asks what should be done FIRST to protect the account. What do you recommend?',
        options: [
          { id: 'A', text: 'Create an S3 bucket for CloudTrail logs' },
          { id: 'B', text: 'Enable MFA on the root user' },
          { id: 'C', text: 'Set up a billing alarm' },
          { id: 'D', text: 'Register a custom domain in Route 53' },
        ],
        correct: 'B',
        explanation: 'The root account is the most powerful identity in AWS. One leaked password without MFA is enough to lose the entire account. MFA is the highest-impact, lowest-effort first action.',
        wrongExplanations: {
          A: 'Logging is important but useless if an attacker already has root access.',
          C: 'Billing alarms alert you after damage — they do not prevent it.',
          D: 'Domain registration has nothing to do with account security.',
        },
        flowchart: `New AWS account created
        │
        ▼
   Is MFA on root?
   ┌────┴────┐
  NO        YES
   │         │
   ▼         ▼
CRITICAL  Safe baseline ✅
  RISK    proceed to next steps
   │
   ▼
Entire account at risk
from single password leak`,
        wrongGuidance: 'Remember — securing root is always step zero. Everything else (logging, billing, networking) is layered on top of this foundation.',
      },
      {
        id: 'root-q2',
        difficulty: 'beginner',
        topic: 'Root Access Keys',
        question: 'Your security audit finds that the AWS root account has active access keys. What is the CORRECT action?',
        options: [
          { id: 'A', text: 'Rotate the access keys every 30 days' },
          { id: 'B', text: 'Store the access keys in AWS Secrets Manager' },
          { id: 'C', text: 'Delete the access keys immediately' },
          { id: 'D', text: 'Add MFA to the access keys' },
        ],
        correct: 'C',
        explanation: 'Root access keys are one of the most dangerous things in AWS. They grant programmatic full access to everything with no MFA protection. AWS explicitly recommends they should never exist. Rotation is not enough — the keys must be gone.',
        wrongExplanations: {
          A: 'Rotation reduces exposure window but still leaves the fundamental risk alive.',
          B: 'Secrets Manager protects secrets but does not eliminate the risk of root keys existing.',
          D: 'Access keys cannot have MFA attached; MFA only protects console logins.',
        },
        flowchart: `Root access keys found
        │
        ▼
Are they used by any app?
   ┌────┴────┐
  YES        NO
   │         │
   ▼         ▼
Migrate app  Delete
to IAM role  immediately ✅
   │
   ▼
Then delete root
access keys too ✅`,
        wrongGuidance: 'On SAA-C03, "delete" is always the correct answer for root access keys. Rotation is not sufficient when the keys have been exposed.',
      },
      {
        id: 'root-q3',
        difficulty: 'beginner',
        topic: 'When to Use Root',
        question: 'A developer says: "My IAM user lacks permission to do X. Can I just use root?" What is the CORRECT response?',
        options: [
          { id: 'A', text: 'Yes — root can always do what IAM cannot' },
          { id: 'B', text: 'Yes — but only during business hours' },
          { id: 'C', text: 'No — root should only be used for tasks that explicitly require it, like closing the account or managing root MFA' },
          { id: 'D', text: 'No — root accounts are disabled after the first IAM user is created' },
        ],
        correct: 'C',
        explanation: 'Root is not a shortcut for missing IAM permissions. The fix is to grant the IAM user the right permissions. Root is reserved for a small list of account-level tasks: changing account name, closing the account, restoring IAM access if locked out, etc.',
        wrongExplanations: {
          A: 'Conceptually true but dangerous reasoning — root is not a convenience tool.',
          B: 'There is no time-based restriction on root; this option is made up.',
          D: 'Root cannot be disabled; it always exists.',
        },
        flowchart: `Tasks that REQUIRE root (SAA-C03 list):
✅ Close the AWS account
✅ Change AWS account name or email
✅ Restore IAM access if locked out
✅ Enable/disable AWS Support plan
✅ Manage root MFA device
✅ Create GovCloud account

Everything else → use IAM`,
        wrongGuidance: 'This reasoning is the most common way root gets misused. Fix IAM permissions; do not reach for root.',
      },
      {
        id: 'root-q4',
        difficulty: 'intermediate',
        topic: 'Root Monitoring',
        question: 'Your security team wants to be immediately alerted whenever anyone logs in as root. Which combination achieves this?',
        options: [
          { id: 'A', text: 'AWS Config + SNS' },
          { id: 'B', text: 'AWS CloudTrail + Amazon EventBridge + SNS' },
          { id: 'C', text: 'AWS Trusted Advisor + Email' },
          { id: 'D', text: 'IAM Access Analyzer + CloudWatch' },
        ],
        correct: 'B',
        explanation: 'CloudTrail records the ConsoleLogin event for root. EventBridge (formerly CloudWatch Events) watches for that specific event and triggers an SNS notification. This is the AWS-recommended pattern.',
        wrongExplanations: {
          A: 'AWS Config checks configuration state, not real-time login events.',
          C: 'Trusted Advisor gives periodic recommendations, not real-time alerts.',
          D: 'Access Analyzer detects resource exposure, not login events.',
        },
        flowchart: `Root user logs in
       │
       ▼
CloudTrail records
ConsoleLogin event
       │
       ▼
EventBridge rule matches:
{ source: "aws.signin",
  detail.userIdentity.type: "Root" }
       │
       ▼
SNS Topic triggered
       │
       ▼
Email / PagerDuty / Slack
alert fires within seconds ⚡`,
        wrongGuidance: 'Config is for resource configuration drift, not event-driven alerting on user logins.',
      },
      {
        id: 'root-q5',
        difficulty: 'intermediate',
        topic: 'Full Root Hardening',
        question: 'Which combination of actions provides the BEST protection for the root account?',
        options: [
          { id: 'A', text: 'Enable MFA on root only' },
          { id: 'B', text: 'Enable MFA + delete root access keys + use a strong unique password + store credentials in a password manager' },
          { id: 'C', text: 'Delete root access keys + restrict root to one AWS region' },
          { id: 'D', text: 'Create a strong password and share it with the security team only' },
        ],
        correct: 'B',
        explanation: 'This is the full hardening checklist. Each element addresses a different attack vector: MFA blocks credential theft, no access keys blocks programmatic exploitation, a strong password raises brute-force difficulty, and a password manager prevents insecure storage.',
        wrongExplanations: {
          A: 'MFA alone is strong but incomplete — access keys could still exist.',
          C: 'Root cannot be restricted to a single region; it is global.',
          D: 'Sharing credentials — even with a small team — creates accountability and revocation problems.',
        },
        flowchart: `Root account created
    ✅ Enable MFA (hardware key preferred)
    ✅ Delete all root access keys
    ✅ Set long, unique password
    ✅ Store in a password manager
    ✅ Set CloudTrail alert on root login
    ✅ Never use root for daily work
        │
   Root is now hardened 🔒`,
        wrongGuidance: 'MFA alone is the most impactful single action, but SAA-C03 often asks for the complete best-practice answer.',
      },
      {
        id: 'root-q6',
        difficulty: 'intermediate',
        topic: 'Root Cannot Be Deleted',
        question: 'A security engineer argues: "We should delete the root user entirely to eliminate the risk." What do you tell them?',
        options: [
          { id: 'A', text: 'Great idea — you can delete root in IAM under Security Credentials' },
          { id: 'B', text: 'Root cannot be deleted or disabled; you can only secure it by removing access keys and enabling MFA' },
          { id: 'C', text: 'Root can be disabled using an AWS Organizations SCP' },
          { id: 'D', text: 'Root is automatically deleted 90 days after the first IAM admin user is created' },
        ],
        correct: 'B',
        explanation: 'The root user is permanently tied to the AWS account. There is no way to delete or disable it. The correct mitigation is: remove access keys, enable MFA, lock credentials away, and monitor for usage.',
        wrongExplanations: {
          A: 'There is no "delete root" option in IAM — this option does not exist.',
          C: 'SCPs can restrict what root does in member accounts (partially), but cannot disable root login entirely.',
          D: 'Root is never automatically removed; this is completely false.',
        },
        flowchart: `Root user
    │
    ├── ✅ CAN: Enable MFA
    ├── ✅ CAN: Delete access keys
    ├── ✅ CAN: Change password
    ├── ✅ CAN: Monitor with CloudTrail
    │
    ├── ❌ CANNOT: Delete root user
    ├── ❌ CANNOT: Disable root login
    └── ❌ CANNOT: Restrict root to a region`,
        wrongGuidance: 'SCPs can limit what root can do in member accounts, but they cannot prevent root from logging in or fully disable it.',
      },
      {
        id: 'root-q7',
        difficulty: 'hard',
        topic: 'SCPs and Root in AWS Organizations',
        question: 'A company uses AWS Organizations and wants to ensure root users of member accounts cannot launch EC2 instances. Which approach is CORRECT?',
        options: [
          { id: 'A', text: 'Attach an IAM policy to the root user in each member account' },
          { id: 'B', text: 'Create an SCP denying ec2:RunInstances and attach it to the member account\'s OU' },
          { id: 'C', text: 'Root users in member accounts bypass all SCPs, so this is not possible' },
          { id: 'D', text: 'Delete the root users of all member accounts' },
        ],
        correct: 'B',
        explanation: 'SCPs act as guardrails at the account level. They restrict what ANY identity in that account can do — including the root user of that member account. This is one of the most important distinctions on SAA-C03.',
        wrongExplanations: {
          A: 'You cannot attach IAM policies to root; root bypasses IAM permission boundaries — but NOT SCPs.',
          C: 'This is false — SCPs DO restrict root users in member accounts.',
          D: 'Root users cannot be deleted.',
        },
        flowchart: `Management Account
        │
    SCP attached to OU
        │
        ▼
  Member Account
        │
  ┌─────┴─────┐
  │           │
IAM Users   Root User
  │           │
  └─────┬─────┘
        │
    Both restricted
    by the SCP ✅
        │
    ec2:RunInstances
      → DENIED`,
        wrongGuidance: 'This is a critical SAA-C03 trap. Root in a member account is NOT all-powerful — SCPs override it. Only the root of the management account is unrestricted by SCPs.',
      },
      {
        id: 'root-q8',
        difficulty: 'hard',
        topic: 'Incident Response After Root Breach',
        question: 'A CloudTrail alert fires: root logged in from an unknown IP at 3 AM and launched 200 GPU instances. What is the CORRECT incident response sequence?',
        options: [
          { id: 'A', text: 'Change root password → enable MFA → terminate instances → review CloudTrail' },
          { id: 'B', text: 'Terminate the EC2 instances first → then change root password' },
          { id: 'C', text: 'Contact AWS Support → wait for their response before taking any action' },
          { id: 'D', text: 'Delete all IAM users in case they are involved' },
        ],
        correct: 'A',
        explanation: 'The first priority is cutting off the attacker\'s access by changing credentials and enabling MFA. Only then should you clean up resources. If you terminate instances first, the attacker can simply launch more while they still have access.',
        wrongExplanations: {
          B: 'Cleaning up resources while the attacker still has active credentials is ineffective — they will just re-launch.',
          C: 'You should take containment action immediately; AWS Support can be notified in parallel.',
          D: 'Deleting IAM users is drastic and may not be related to the breach.',
        },
        flowchart: `Root login detected at 3AM
           │
    Step 1: Change root password
    (cut off current session)
           │
    Step 2: Enable/verify MFA on root
    (block future unauthorized login)
           │
    Step 3: Terminate rogue EC2 instances
    (stop the billing)
           │
    Step 4: Review full CloudTrail
    (understand scope of access)
           │
    Step 5: Notify AWS Support
    (request billing review)`,
        wrongGuidance: 'Containment comes before cleanup. Always revoke access first.',
      },
      {
        id: 'root-q9',
        difficulty: 'hard',
        topic: 'Root-Only Tasks',
        question: 'An IAM admin with AdministratorAccess tries to change the AWS account\'s email address. The operation fails. Why?',
        options: [
          { id: 'A', text: 'AdministratorAccess does not include billing permissions' },
          { id: 'B', text: 'Changing the account email address requires root account access — it cannot be done with any IAM user' },
          { id: 'C', text: 'The IAM user needs IAMFullAccess in addition to AdministratorAccess' },
          { id: 'D', text: 'This can only be done via the AWS CLI, not the console' },
        ],
        correct: 'B',
        explanation: 'A small set of account-level tasks are root-only, regardless of IAM permissions. Even AdministratorAccess cannot perform these. Changing the account name/email is on that list.',
        wrongExplanations: {
          A: 'Billing access is separate but that is not the issue here.',
          C: 'No combination of IAM policies enables root-only tasks.',
          D: 'The method (console vs CLI) is irrelevant — root-only tasks require root regardless.',
        },
        flowchart: `ROOT-ONLY TASKS (no IAM policy can unlock):
✅ Change account name or email
✅ Close the AWS account
✅ Enable IAM access to Billing console
✅ Restore lost IAM admin access
✅ Change/remove root MFA
✅ Create GovCloud account
✅ Register as seller on Marketplace

Everything else → IAM admin can do it`,
        wrongGuidance: 'AdministratorAccess is extremely broad but there is a hard boundary for root-only tasks that no IAM policy can cross.',
      },
      {
        id: 'root-q10',
        difficulty: 'expert',
        topic: 'Full Root Security Policy',
        question: 'A security policy states: "No AWS account root credentials shall exist in any form." Which actions FULLY satisfy this policy\'s intent without violating AWS constraints?',
        options: [
          { id: 'A', text: 'Delete the root IAM user entry and store the email in a vault' },
          { id: 'B', text: 'Enable MFA on root, delete all root access keys, set a long random password stored in a vault accessible only to 2 authorized people, and enable CloudTrail root login alerts' },
          { id: 'C', text: 'Transfer root ownership to AWS Support for safekeeping' },
          { id: 'D', text: 'Enable AWS SSO and deny root login via an SCP at the org level' },
        ],
        correct: 'B',
        explanation: 'Root cannot be deleted — it is permanently tied to the account. The policy\'s intent is "no one should be able to easily use root credentials." The correct implementation is to make root credentials effectively inaccessible for daily use while maintaining emergency access under strict controls.',
        wrongExplanations: {
          A: 'The root IAM user cannot be deleted; this option is not possible in AWS.',
          C: 'AWS Support cannot take ownership of root credentials; this service does not exist.',
          D: 'SCPs restrict what root does in member accounts but cannot fully block root login in the management account.',
        },
        flowchart: `Root email + password
        │
    Stored in: enterprise vault
    Access: 2 named people only
    Review: quarterly
                    │
    MFA: hardware key (FIDO2)
    Stored separately from password
                    │
    Access keys: DELETED
    Verified monthly by audit
                    │
    CloudTrail + EventBridge
    Alert fires within 60s
    of any root console login

Result: Root exists but is effectively
inaccessible for unauthorized use ✅`,
        wrongGuidance: 'SCPs at the org level are powerful but the management account root is exempt from SCPs. A complete solution must include the credential hardening in option B.',
      },
    ],
  },
  {
    postId: 'iam-policy-documents',
    questions: [
      {
        id: 'policy-q1',
        difficulty: 'beginner',
        topic: 'Explicit Deny Rule',
        question: 'In an IAM policy, what does an explicit Deny do when another policy explicitly Allows the same action?',
        options: [
          { id: 'A', text: 'The Deny is ignored if the Allow was created first' },
          { id: 'B', text: 'The Deny overrides the Allow — it always wins, no exceptions' },
          { id: 'C', text: 'The Deny applies only to root users' },
          { id: 'D', text: 'The Deny applies only if no Allow exists for that action' },
        ],
        correct: 'B',
        explanation: 'This is the foundational rule of IAM policy evaluation. An explicit Deny cannot be overridden by any Allow, regardless of policy type, order, or source. This is how you create hard blockers that even admins cannot bypass.',
        wrongExplanations: {
          A: 'Policy creation order has zero effect on evaluation.',
          C: 'Deny applies to all identities, not just root.',
          D: 'That describes an implicit deny (the default), not an explicit Deny statement.',
        },
        flowchart: `Is there an explicit DENY?
──YES──▶ DENIED 🚫
        │
       NO
        │
        ▼
Is there an explicit ALLOW?
──YES──▶ ALLOWED ✅
        │
       NO
        │
        ▼
   Implicit DENY 🚫
   (default: nothing allowed)`,
        wrongGuidance: 'Explicit Deny is a one-way valve. It blocks regardless of any Allow in any other policy attached to that identity.',
      },
      {
        id: 'policy-q2',
        difficulty: 'beginner',
        topic: 'Required Policy Elements',
        question: 'What are the three required elements of every IAM policy statement?',
        options: [
          { id: 'A', text: 'Principal, Action, Condition' },
          { id: 'B', text: 'Effect, Action, Resource' },
          { id: 'C', text: 'Version, Statement, Principal' },
          { id: 'D', text: 'Effect, Principal, Condition' },
        ],
        correct: 'B',
        explanation: 'Every statement must answer: Should this be allowed or denied? (Effect) — What API operations? (Action) — On which AWS resource? (Resource). Without all three, the statement is either invalid or dangerously broad.',
        wrongExplanations: {
          A: 'Principal is optional in identity-based policies (it is used in resource-based policies).',
          C: 'Version and Statement are top-level policy fields, not statement elements.',
          D: 'Condition is optional; Principal is not required in identity-based policies.',
        },
        flowchart: `{
  "Statement": [
    {
      "Effect":   "Allow",       ← Required
      "Action":   "s3:GetObject",← Required
      "Resource": "arn:...",     ← Required
      "Condition": { ... }       ← Optional
    }
  ]
}`,
        wrongGuidance: 'Principal is common in S3 bucket policies and trust policies — but NOT required in identity-based policies attached to users/groups/roles.',
      },
      {
        id: 'policy-q3',
        difficulty: 'beginner',
        topic: 'Policy Types',
        question: 'Which IAM policy type is attached directly to an AWS resource such as an S3 bucket?',
        options: [
          { id: 'A', text: 'Identity-based policy' },
          { id: 'B', text: 'Inline policy' },
          { id: 'C', text: 'Resource-based policy' },
          { id: 'D', text: 'AWS Managed policy' },
        ],
        correct: 'C',
        explanation: 'Resource-based policies are attached to the resource itself (e.g., S3 bucket policy, SQS queue policy, Lambda resource policy). They control who can access that resource. Identity-based policies are attached to the identity (user/role).',
        wrongExplanations: {
          A: 'Identity-based policies attach to users, groups, or roles — not resources.',
          B: 'Inline policies are embedded inside a specific user, group, or role — still identity-side.',
          D: 'AWS Managed policies are AWS-maintained identity-based policies.',
        },
        flowchart: `IDENTITY SIDE          RESOURCE SIDE
─────────────          ─────────────
IAM User ──┐           S3 Bucket ──── Bucket Policy
IAM Group ─┼── Ident.  SQS Queue ──── Queue Policy
IAM Role ──┘   Policy  Lambda ─────── Resource Policy
                        KMS Key ────── Key Policy

Both sides evaluated together when
an identity accesses a resource`,
        wrongGuidance: 'Inline policies are embedded in an identity (user/role), not a resource. They are identity-based, just non-reusable ones.',
      },
      {
        id: 'policy-q4',
        difficulty: 'intermediate',
        topic: 'Unexpected Denial',
        question: 'A developer has AmazonS3FullAccess attached to their IAM user. They try to upload to a specific S3 bucket and receive "Access Denied". What is the MOST LIKELY cause?',
        options: [
          { id: 'A', text: 'AmazonS3FullAccess does not include upload permissions' },
          { id: 'B', text: 'An explicit Deny in the S3 bucket policy or another attached policy is overriding the Allow' },
          { id: 'C', text: 'The developer needs to log out and back in to refresh permissions' },
          { id: 'D', text: 'S3 upload requires a separate paid add-on' },
        ],
        correct: 'B',
        explanation: 'AmazonS3FullAccess allows all S3 actions. The only way to get Access Denied with that policy is if something else is explicitly denying access: a bucket policy, an SCP from AWS Organizations, a permissions boundary, or another identity-based policy with an explicit Deny.',
        wrongExplanations: {
          A: 'AmazonS3FullAccess uses "Action": "s3:*" which includes s3:PutObject.',
          C: 'IAM permissions take effect immediately; no logout required.',
          D: 'S3 access is not a paid add-on.',
        },
        flowchart: `Developer attempts s3:PutObject
           │
    Check all policies:
  IAM: AmazonS3FullAccess → ALLOW s3:*
  Bucket Policy           → DENY s3:PutObject ← overrides!
  SCP (if Org)            → ?
           │
   Explicit Deny found ──▶ DENIED 🚫
   (even though IAM says Allow)`,
        wrongGuidance: 'When a broadly-permissive policy is in play and you still see Deny, always look for an explicit Deny in another policy source — bucket policy, SCP, or permission boundary.',
      },
      {
        id: 'policy-q5',
        difficulty: 'intermediate',
        topic: 'Least Privilege',
        question: 'A Lambda function only needs to read one item from a DynamoDB table. Which policy BEST follows least privilege?',
        options: [
          { id: 'A', text: '{"Effect":"Allow","Action":"*","Resource":"*"}' },
          { id: 'B', text: '{"Effect":"Allow","Action":"dynamodb:*","Resource":"arn:...:table/orders"}' },
          { id: 'C', text: '{"Effect":"Allow","Action":"dynamodb:GetItem","Resource":"arn:...:table/orders"}' },
          { id: 'D', text: '{"Effect":"Allow","Action":"dynamodb:GetItem","Resource":"*"}' },
        ],
        correct: 'C',
        explanation: 'Least privilege = the exact action needed (GetItem) on the exact resource (specific table ARN). Nothing more.',
        wrongExplanations: {
          A: 'Wildcard action + wildcard resource — worst possible policy; grants access to everything in AWS.',
          B: 'dynamodb:* allows Delete, Create, Scan, and all other operations — far more than needed.',
          D: 'GetItem is correct but "Resource":"*" applies to ALL DynamoDB tables in the account.',
        },
        flowchart: `MOST PERMISSIVE ◄──────────────► LEAST PERMISSIVE

"Action":"*"     "Action":"dynamodb:*"   "Action":"dynamodb:GetItem"
"Resource":"*"   "Resource":"arn:..table" "Resource":"arn:..table/orders"
  ☠️ Never         ⚠️ Too broad              ✅ Correct`,
        wrongGuidance: 'Always scope the Resource ARN to the specific table, bucket, or function involved.',
      },
      {
        id: 'policy-q6',
        difficulty: 'intermediate',
        topic: 'Default Behavior',
        question: 'An IAM user is created with no policies attached. They try to list EC2 instances. What happens?',
        options: [
          { id: 'A', text: 'The action is allowed because AWS trusts users inside the same account' },
          { id: 'B', text: 'The action is denied — default IAM behavior is implicit deny for all actions' },
          { id: 'C', text: 'The action is allowed but logged for review' },
          { id: 'D', text: 'The user is prompted to request access from their admin' },
        ],
        correct: 'B',
        explanation: 'IAM starts from zero trust. Every action is implicitly denied unless there is an explicit Allow. A user with no policies has no permissions whatsoever.',
        wrongExplanations: {
          A: 'Being in the same account grants nothing by itself; permissions must be explicitly granted.',
          C: 'IAM does not log-and-allow; it simply denies.',
          D: 'AWS does not present a UI prompt; the API returns an AccessDenied error.',
        },
        flowchart: `New IAM user — zero policies attached
        │
  Attempts ANY action
        │
        ▼
  Implicit DENY 🚫
  (no Allow found)
        │
        ▼
 API returns:
 "An error occurred (AccessDenied)"`,
        wrongGuidance: 'Same-account membership is irrelevant. IAM requires explicit grants. This is the "zero trust" foundation of AWS security.',
      },
      {
        id: 'policy-q7',
        difficulty: 'hard',
        topic: 'Deny vs Allow Priority',
        question: 'A policy has: (1) Allow s3:* on *, and (2) Deny s3:DeleteBucket on *. A user with this policy tries to delete an S3 bucket. What happens?',
        options: [
          { id: 'A', text: 'Allowed — because s3:* includes s3:DeleteBucket' },
          { id: 'B', text: 'Denied — because explicit Deny overrides the Allow in all cases' },
          { id: 'C', text: 'Allowed — because the Allow statement appears first in the policy' },
          { id: 'D', text: 'Allowed — because the wildcard Allow is broader than the specific Deny' },
        ],
        correct: 'B',
        explanation: 'Statement order is irrelevant. Breadth of the Allow is irrelevant. Explicit Deny wins unconditionally. A Deny on a specific action in any statement of any attached policy blocks that action completely.',
        wrongExplanations: {
          A: 's3:* does include DeleteBucket but the explicit Deny blocks it.',
          C: 'Statement order in a policy document has no effect on evaluation.',
          D: 'Specificity of the Allow does not help; Deny wins regardless.',
        },
        flowchart: `User attempts s3:DeleteBucket
          │
  Statement 1: Allow s3:*  ──── Matches ✅
  Statement 2: Deny DeleteBucket ─ Matches ✅
          │
  Explicit Deny found?
     YES → DENIED 🚫 (end of evaluation)

Would be denied even if 100 Allow
statements all explicitly allow DeleteBucket`,
        wrongGuidance: 'The breadth or specificity of an Allow never matters when an explicit Deny is present. Deny is the final word.',
      },
      {
        id: 'policy-q8',
        difficulty: 'hard',
        topic: 'Multi-Source Deny',
        question: 'A user is in Group A (Allow ec2:*) and Group B (Deny ec2:TerminateInstances). They also have an inline policy (Allow ec2:TerminateInstances). Can they terminate EC2 instances?',
        options: [
          { id: 'A', text: 'Yes — the inline policy is the most specific override' },
          { id: 'B', text: 'No — the explicit Deny in Group B overrides all Allows from all sources' },
          { id: 'C', text: 'Yes — inline policies always take precedence over group policies' },
          { id: 'D', text: 'It depends on which policy was most recently updated' },
        ],
        correct: 'B',
        explanation: 'IAM collects ALL policies from ALL sources (groups, direct attachments, inline policies) and evaluates them together. A single explicit Deny from any source kills the action — regardless of how many Allows exist.',
        wrongExplanations: {
          A: 'There is no concept of "most specific inline policy wins" in IAM.',
          C: 'Inline policies have no inherent precedence over group policies.',
          D: 'Policy update time has zero effect on evaluation.',
        },
        flowchart: `User attempts ec2:TerminateInstances
               │
     Collect ALL policies:
   Group A:  Allow ec2:*
   Group B:  Deny terminate  ← explicit Deny
   Inline:   Allow terminate
               │
  Any explicit Deny?
  YES ─▶ DENIED 🚫
  (Deny from Group B wins over
   Allows from Group A + Inline)`,
        wrongGuidance: 'Inline policies and group policies are evaluated equally. The only thing that "wins" is an explicit Deny.',
      },
      {
        id: 'policy-q9',
        difficulty: 'hard',
        topic: 'Condition Keys — MFA',
        question: 'You want a policy that denies all S3 actions unless the user authenticated with MFA. Which Condition block achieves this?',
        options: [
          { id: 'A', text: '"Condition":{"Bool":{"aws:SecureTransport":"false"}}' },
          { id: 'B', text: '"Condition":{"BoolIfExists":{"aws:MultiFactorAuthPresent":"false"}}' },
          { id: 'C', text: '"Condition":{"StringEquals":{"iam:MFAAuthenticated":"true"}}' },
          { id: 'D', text: '"Condition":{"Bool":{"aws:MFAEnabled":"false"}}' },
        ],
        correct: 'B',
        explanation: 'aws:MultiFactorAuthPresent is the correct global condition key. BoolIfExists handles cases where the key might not be present (e.g., CLI sessions without MFA). When this condition evaluates to true (MFA not present), the Deny fires.',
        wrongExplanations: {
          A: 'aws:SecureTransport checks HTTPS vs HTTP — nothing to do with MFA.',
          C: 'iam:MFAAuthenticated is not a valid global condition key in IAM.',
          D: 'aws:MFAEnabled is not a valid condition key; the correct one is aws:MultiFactorAuthPresent.',
        },
        flowchart: `User calls S3 API
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
proceeds   (Deny fires)`,
        wrongGuidance: 'The exact key aws:MultiFactorAuthPresent appears on SAA-C03. aws:MFAEnabled does not exist.',
      },
      {
        id: 'policy-q10',
        difficulty: 'expert',
        topic: 'Tag-Based Conditional Access',
        question: 'You want developers to start/stop EC2 instances tagged Environment:dev but NEVER touch instances tagged Environment:prod. Which policy structure achieves this?',
        options: [
          { id: 'A', text: 'Create separate IAM groups per environment and assign instances to them' },
          { id: 'B', text: 'Use a Condition on the Allow with ec2:ResourceTag/Environment:dev, plus a separate explicit Deny with ec2:ResourceTag/Environment:prod' },
          { id: 'C', text: 'Use a Resource ARN filter to limit access to dev instances only' },
          { id: 'D', text: 'Create separate AWS accounts for dev and prod environments' },
        ],
        correct: 'B',
        explanation: 'IAM condition keys for resource tags (ec2:ResourceTag/TagKey) let you scope actions to instances with specific tags. The Allow scopes access to dev-tagged instances. The explicit Deny provides a hard backstop against prod.',
        wrongExplanations: {
          A: 'IAM groups manage users, not EC2 instances; you cannot assign instances to groups.',
          C: 'EC2 instance ARNs do not encode the environment tag; you cannot filter by tag via ARN alone.',
          D: 'Separate accounts is a valid isolation strategy but is drastic for just permission scoping within one team.',
        },
        flowchart: `Developer attempts action on EC2 instance
              │
    What tag does the instance have?
    ┌──────────┬──────────┐
  "dev"     "prod"    no tag
    │          │          │
  Allow ✅  Deny 🚫   Deny 🚫
            (explicit) (no Allow matches)`,
        wrongGuidance: 'Resource ARNs for EC2 do not contain tags. Tag-based access control must use Condition keys, not ARN patterns.',
      },
    ],
  },
  {
    postId: 'iam-users-and-permanent-credentials',
    questions: [
      {
        id: 'users-q1',
        difficulty: 'beginner',
        topic: 'EC2 Access to S3',
        question: 'An EC2 instance needs to read files from an S3 bucket. What is the RECOMMENDED approach?',
        options: [
          { id: 'A', text: 'Create an IAM user with access keys and store them in the EC2 user data script' },
          { id: 'B', text: 'Create an IAM role with S3 read permissions and attach it to the EC2 instance profile' },
          { id: 'C', text: 'Grant the S3 bucket public read access' },
          { id: 'D', text: 'Use the root account credentials in the application code' },
        ],
        correct: 'B',
        explanation: 'IAM roles provide temporary, automatically-rotated credentials via the EC2 instance metadata service. The application reads credentials automatically — no hardcoded keys, no manual rotation.',
        wrongExplanations: {
          A: 'Hardcoded keys in user data are exposed in plaintext and never rotate automatically.',
          C: 'Making S3 public exposes the data to the entire internet.',
          D: 'Root credentials should never be used in code.',
        },
        flowchart: `EC2 Instance
     │
  Instance Profile (attached IAM Role)
     │
     ▼
Metadata Service (169.254.169.254)
provides temporary credentials:
  AccessKeyId, SecretKey,
  SessionToken, Expiration (auto-rotates)
     │
     ▼
Application calls S3 API
with temporary credentials ✅
(no keys stored anywhere in code)`,
        wrongGuidance: 'Access keys in user data appear in the EC2 console, system logs, and anywhere the instance is copied — a very common real-world breach vector.',
      },
      {
        id: 'users-q2',
        difficulty: 'beginner',
        topic: 'New Team Member',
        question: 'A new developer joins the team. What is the BEST way to give them the same permissions as the rest of the development team?',
        options: [
          { id: 'A', text: 'Share the existing developer\'s IAM user credentials temporarily' },
          { id: 'B', text: 'Copy one developer\'s IAM user and rename it' },
          { id: 'C', text: 'Add the new developer\'s IAM user to the existing developer IAM group' },
          { id: 'D', text: 'Attach the required policies directly to the new IAM user' },
        ],
        correct: 'C',
        explanation: 'Groups make permission management scalable. Adding a user to a group instantly grants all group permissions. When policies change, you update the group once — not every individual user.',
        wrongExplanations: {
          A: 'Sharing credentials destroys accountability — audit trails become meaningless.',
          B: 'Copying users is not a real IAM feature; even if done manually, it creates drift and maintenance burden.',
          D: 'Direct policy attachment works but when the team policy changes, you must update every individual user.',
        },
        flowchart: `Before groups:
  alice → Policy A, B, C
  bob   → Policy A, B, C   ← N users × M policies to manage
  carol → Policy A, B, C

After groups:
  dev-group → Policy A, B, C
    ├── alice
    ├── bob
    └── carol  ← 1 group to manage; users join/leave`,
        wrongGuidance: 'It works once but creates a maintenance problem. If you later update permissions, you must find and update every individual user instead of one group.',
      },
      {
        id: 'users-q3',
        difficulty: 'beginner',
        topic: 'Services and Roles',
        question: 'Which IAM entity should AWS Lambda use to access DynamoDB?',
        options: [
          { id: 'A', text: 'An IAM User with access keys embedded in the Lambda environment variables' },
          { id: 'B', text: 'An IAM Role with a trust policy allowing Lambda to assume it' },
          { id: 'C', text: 'The root account credentials passed as Lambda environment variables' },
          { id: 'D', text: 'An IAM Group that contains the Lambda function' },
        ],
        correct: 'B',
        explanation: 'AWS services assume roles via the trust policy ("Service": "lambda.amazonaws.com"). Lambda automatically receives temporary credentials without any keys being stored anywhere.',
        wrongExplanations: {
          A: 'Environment variables are visible to anyone with Lambda console access; keys do not auto-rotate.',
          C: 'Root credentials in code is catastrophically dangerous.',
          D: 'IAM Groups are for users only; services cannot be group members.',
        },
        flowchart: `Lambda function invoked
         │
  Lambda service assumes
  the execution role:
    Trust: "Service":"lambda.amazonaws.com"
         │
  AWS STS issues temp credentials
         │
  Lambda code calls DynamoDB
  using those temp credentials ✅
         │
  Credentials expire automatically`,
        wrongGuidance: 'Lambda environment variables are encrypted at rest but visible to anyone who can view the function configuration. They also never rotate.',
      },
      {
        id: 'users-q4',
        difficulty: 'intermediate',
        topic: 'Compromised Access Key',
        question: 'A developer accidentally pushed their IAM access key to a public GitHub repo. What is the CORRECT immediate response?',
        options: [
          { id: 'A', text: 'Make the GitHub repository private immediately' },
          { id: 'B', text: 'Rotate the access key in IAM' },
          { id: 'C', text: 'Immediately deactivate and delete the compromised access key, then audit CloudTrail for unauthorized activity' },
          { id: 'D', text: 'Create a new IAM user with new access keys' },
        ],
        correct: 'C',
        explanation: 'Bots scan GitHub continuously — keys are often compromised within minutes of exposure. Making the repo private does not help because the key is already out. You must delete immediately, then understand what damage was done.',
        wrongExplanations: {
          A: 'The key is already scraped by bots; making the repo private does not revoke the key.',
          B: 'Rotation changes the secret half but the old key may still work briefly; also bots may have already used it.',
          D: 'Creating a new user does not revoke the old key — the compromised key must be explicitly deleted.',
        },
        flowchart: `Key pushed to GitHub
       │ (seconds)
       ▼
Bots scan public repos 24/7
       │ (minutes)
       ▼
Key found and tested by bots
       │
Correct response:
  ① Deactivate key in IAM (immediate)
  ② Delete key in IAM (permanent)
  ③ Check CloudTrail for last 24h
     → What actions were taken?
     → From which IPs?
  ④ Assess blast radius`,
        wrongGuidance: 'Rotation changes the secret but the compromised key may have been used already. Delete is always the answer when a key has been publicly exposed.',
      },
      {
        id: 'users-q5',
        difficulty: 'intermediate',
        topic: 'Access Key Age Enforcement',
        question: 'A company wants to ensure all IAM access keys are rotated within 90 days. Which combination enforces AND monitors this?',
        options: [
          { id: 'A', text: 'AWS CloudTrail alone' },
          { id: 'B', text: 'AWS IAM Credentials Report + AWS Config rule access-keys-rotated' },
          { id: 'C', text: 'Amazon GuardDuty' },
          { id: 'D', text: 'AWS Trusted Advisor (free tier only)' },
        ],
        correct: 'B',
        explanation: 'The IAM Credentials Report shows every user\'s key age, last use, and rotation date. AWS Config\'s access-keys-rotated managed rule continuously evaluates all keys against the max age threshold and marks non-compliant keys.',
        wrongExplanations: {
          A: 'CloudTrail records API calls but does not track key age compliance.',
          C: 'GuardDuty detects threat behaviors — not credential age policy violations.',
          D: 'Trusted Advisor has a basic check but Config is more comprehensive and automatable.',
        },
        flowchart: `All IAM Users
     │
 IAM Credentials Report (CSV)
 shows key age per user
     │
 AWS Config Rule: access-keys-rotated
 evaluates every key daily
     │
 ┌───┴──────────────────┐
NON-COMPLIANT        COMPLIANT ✅
(key > 90 days)
     │
 Config marks NON_COMPLIANT
 SNS notification → admin action`,
        wrongGuidance: 'GuardDuty is threat detection, not compliance management. Different tools for different problems.',
      },
      {
        id: 'users-q6',
        difficulty: 'intermediate',
        topic: 'IAM Group Facts',
        question: 'Which statement about IAM groups is TRUE?',
        options: [
          { id: 'A', text: 'Groups can contain other groups (nested groups)' },
          { id: 'B', text: 'Groups can assume IAM roles' },
          { id: 'C', text: 'A user can belong to multiple groups, and permissions from all groups are combined' },
          { id: 'D', text: 'Groups have their own login credentials and console access' },
        ],
        correct: 'C',
        explanation: 'IAM groups are flat containers. A user can be in up to 10 groups. Their effective permissions are the union of all Allow statements from all groups, minus any explicit Denies.',
        wrongExplanations: {
          A: 'Groups CANNOT be nested — this is a hard IAM limitation. Group-in-group does not exist.',
          B: 'Groups cannot assume roles; only users, services, and other roles can assume roles.',
          D: 'Groups have no credentials and no console login; they are purely policy containers.',
        },
        flowchart: `User "alice" is in:
  ├── dev-team (EC2 full, S3 read)
  └── data-team (Athena full, S3 read)

Effective permissions:
  = Union of all Allows from both groups
  = EC2 full + Athena full + S3 read

If ANY group has explicit Deny X:
  = X is denied regardless of other groups`,
        wrongGuidance: 'Nested groups is the most common IAM misconception. Groups are a flat collection — no hierarchy allowed.',
      },
      {
        id: 'users-q7',
        difficulty: 'hard',
        topic: 'SAML Federation',
        question: 'A company uses a corporate SAML identity provider (Okta). Employees need AWS access without individual IAM users. Which approach is CORRECT?',
        options: [
          { id: 'A', text: 'Create one shared IAM user per department and distribute credentials' },
          { id: 'B', text: 'Configure AWS IAM Identity Center with SAML federation to the corporate IdP, mapping groups to IAM roles' },
          { id: 'C', text: 'Use root account credentials shared via a corporate password manager' },
          { id: 'D', text: 'Create IAM users with the same usernames as the corporate directory' },
        ],
        correct: 'B',
        explanation: 'SAML federation allows corporate users to authenticate with their existing credentials and receive temporary AWS credentials via STS AssumeRoleWithSAML. No IAM users are created per person. This is the enterprise-standard pattern.',
        wrongExplanations: {
          A: 'Shared credentials eliminate accountability and are impossible to secure.',
          C: 'Root credentials should never be shared — catastrophic risk.',
          D: 'Creating IAM users defeats the purpose of federation and creates a sync problem as the directory changes.',
        },
        flowchart: `Employee opens AWS Console
          │
  Redirected to corporate IdP (Okta)
          │
  Employee logs in with corporate creds
          │
  IdP issues SAML assertion
          │
  Browser posts assertion to AWS
          │
  AWS STS: AssumeRoleWithSAML
  → issues temp credentials
          │
  Employee lands in AWS Console
  with correct IAM role ✅
  (no IAM user created)`,
        wrongGuidance: 'Creating shadow IAM users from a corporate directory is a maintenance nightmare — you must sync every hire, termination, and name change. Federation eliminates this entirely.',
      },
      {
        id: 'users-q8',
        difficulty: 'hard',
        topic: 'Organization-Wide MFA',
        question: 'A company has 500 IAM users across multiple AWS accounts in an Organization. They need to enforce MFA for all users. What is the MOST SCALABLE approach?',
        options: [
          { id: 'A', text: 'Attach an MFA-enforcement inline policy to every IAM user manually' },
          { id: 'B', text: 'Create one IAM group per account with an MFA policy and add all users' },
          { id: 'C', text: 'Use an SCP at the AWS Organizations level denying all actions when aws:MultiFactorAuthPresent is false' },
          { id: 'D', text: 'Use AWS Config to flag non-MFA users weekly' },
        ],
        correct: 'C',
        explanation: 'An SCP applied to the root OU covers every account, every user, every role simultaneously. It is one policy change that enforces MFA across 500 users in any number of accounts.',
        wrongExplanations: {
          A: 'Applying policies to 500 users manually is operationally impossible to maintain.',
          B: 'Per-account groups scale better than per-user but still require setup per account.',
          D: 'Config flags but does not block; users can still act without MFA until someone reviews the report.',
        },
        flowchart: `AWS Organization (root OU)
    │
  SCP: Deny all when
       MultiFactorAuthPresent = false
    │
  ┌──┴──────────────────┐
  │      │              │
Account A  Account B  Account C

All IAM Users + Roles in ALL accounts
must use MFA for every API call ✅

One policy → covers everyone`,
        wrongGuidance: 'Config is a compliance monitoring tool, not an enforcement tool. For enforcement, use SCPs or Deny-based IAM policies.',
      },
      {
        id: 'users-q9',
        difficulty: 'hard',
        topic: 'ECS Fargate and Secrets Manager',
        question: 'An app running on ECS Fargate gets AccessDenied when calling secretsmanager:GetSecretValue. What is the MOST LIKELY cause?',
        options: [
          { id: 'A', text: 'Secrets Manager is not available in the Fargate launch type' },
          { id: 'B', text: 'The ECS task IAM role does not have secretsmanager:GetSecretValue permission for that secret\'s ARN' },
          { id: 'C', text: 'The secret must be in the same region as the ECS cluster' },
          { id: 'D', text: 'Fargate tasks must use access keys to call Secrets Manager' },
        ],
        correct: 'B',
        explanation: 'ECS Fargate tasks use a task IAM role (not the task execution role) for application-level AWS API calls. If secretsmanager:GetSecretValue is not in that role\'s policy, the call is denied.',
        wrongExplanations: {
          A: 'Secrets Manager works fully with Fargate; there is no such limitation.',
          C: 'Cross-region access to Secrets Manager is supported and does not cause AccessDenied.',
          D: 'Fargate uses the task IAM role for temp credentials; access keys are not required.',
        },
        flowchart: `ECS Task Definition
     │
  Task Execution Role
  (ECS agent: pull image, push logs)
     │
  Task Role ← THIS ONE
  (application code calls AWS APIs)
     │
  Must include:
   secretsmanager:GetSecretValue
   on the specific secret ARN ✅`,
        wrongGuidance: 'Task roles automatically provide temp credentials to the container via metadata service — no access keys needed or wanted.',
      },
      {
        id: 'users-q10',
        difficulty: 'expert',
        topic: 'Third-Party Auditor Access',
        question: 'A third-party auditing firm needs read-only access to your AWS account for 2 weeks, with no permanent IAM users created. Which approach is MOST SECURE?',
        options: [
          { id: 'A', text: 'Create a temporary IAM user with SecurityAudit policy and share credentials' },
          { id: 'B', text: 'Create a cross-account IAM role with a trust policy for the auditor\'s AWS account ID, require an ExternalId condition, and attach SecurityAudit managed policy' },
          { id: 'C', text: 'Share root credentials with the auditing firm for the 2-week period' },
          { id: 'D', text: 'Create a temporary IAM user, set a password expiry of 14 days, then delete it' },
        ],
        correct: 'B',
        explanation: 'Cross-account IAM roles are the industry-standard pattern for third-party access. The auditors use their own AWS credentials to assume your role — no credentials are shared. ExternalId prevents the "confused deputy" attack. Access is revoked instantly by removing the trust policy.',
        wrongExplanations: {
          A: 'Sharing IAM credentials means the auditor can use them after the engagement; hard to fully revoke.',
          C: 'Root credentials — absolutely never shared under any circumstances.',
          D: 'Password expiry is unreliable; access keys persist; does not prevent access key abuse.',
        },
        flowchart: `Auditor's AWS Account (123456789)
         │
  Auditor runs: aws sts assume-role
    --role-arn arn:aws:iam::YOUR:role/AuditRole
    --external-id "agreed-secret-12345"
         │
YOUR Account trust policy evaluated:
  Principal: arn:aws:iam::123456789:root
  Condition: ExternalId = "agreed-secret"
         │
  Match → Issue temp credentials (1h)
  Auditor has read-only access ✅

After engagement:
  Delete trust policy → zero access instantly`,
        wrongGuidance: 'IAM users are hard to fully clean up. Access keys survive password expiry. Cross-account roles with ExternalId are the correct enterprise answer.',
      },
    ],
  },
  {
    postId: 'iam-policy-management-part-1',
    questions: [
      {
        id: 'p1-q1', difficulty: 'beginner', topic: 'Group-Based Assignment',
        question: 'A new backend developer joins. The dev-team group already has AmazonEC2FullAccess and AmazonS3ReadOnlyAccess. How should you grant them the same permissions?',
        options: [
          { id: 'A', text: 'Attach both policies directly to the new developer\'s IAM user' },
          { id: 'B', text: 'Add the new developer\'s IAM user to the dev-team group' },
          { id: 'C', text: 'Create a new IAM group just for the new developer' },
          { id: 'D', text: 'Copy the policies from an existing developer\'s user' },
        ],
        correct: 'B',
        explanation: 'Groups exist precisely for this scenario. Adding the user to the group takes seconds and inherits all policies automatically. When group policies change later, all members benefit without individual updates.',
        wrongExplanations: {
          A: 'Direct policy attachment works but creates a maintenance problem at scale.',
          C: 'A single-user group defeats the purpose of groups.',
          D: 'You cannot "copy" policies from a user in IAM; policies must be attached individually.',
        },
        flowchart: `dev-team group
  Policy: AmazonEC2FullAccess
  Policy: AmazonS3ReadOnlyAccess
    │
    ├── alice    ← existing
    ├── bob      ← existing
    └── NEW_DEV  ← add here ✅

NEW_DEV instantly inherits both policies.
No other changes needed.`,
        wrongGuidance: 'IAM best practice is always: permissions on groups, users join groups.',
      },
      {
        id: 'p1-q2', difficulty: 'beginner', topic: 'AdministratorAccess Scope',
        question: 'The ops-team has AdministratorAccess. The dev-team has AmazonEC2FullAccess. What can dev-team do that ops-team CANNOT?',
        options: [
          { id: 'A', text: 'List all EC2 instances' },
          { id: 'B', text: 'Create and delete IAM users' },
          { id: 'C', text: 'Nothing — AdministratorAccess includes all EC2 permissions and more' },
          { id: 'D', text: 'Access EC2 in regions where AdministratorAccess is restricted' },
        ],
        correct: 'C',
        explanation: 'AdministratorAccess grants "Action":"*" on "Resource":"*" — literally everything. Any permission that AmazonEC2FullAccess grants is already included in AdministratorAccess.',
        wrongExplanations: {
          A: 'AdministratorAccess fully includes ec2:DescribeInstances and all EC2 actions.',
          B: 'IAM user management is fully included in AdministratorAccess.',
          D: 'AdministratorAccess is not region-restricted.',
        },
        flowchart: `AdministratorAccess:
  "Action": "*"   ← ALL services
  "Resource": "*" ← ALL resources

Contains everything including:
  ✅ AmazonEC2FullAccess (ec2:*)
  ✅ AmazonS3FullAccess  (s3:*)
  ✅ IAMFullAccess       (iam:*)
  ✅ Every other policy

dev-team has a subset.
ops-team has the superset.`,
        wrongGuidance: 'AdministratorAccess DOES include IAM; PowerUserAccess (a different policy) excludes IAM. Do not confuse the two.',
      },
      {
        id: 'p1-q3', difficulty: 'beginner', topic: 'Verifying Permission Boundaries',
        question: 'Alice is in dev-team which has AmazonS3ReadOnlyAccess. She tries to create a new S3 bucket. What happens?',
        options: [
          { id: 'A', text: 'The bucket is created because she has "S3 access"' },
          { id: 'B', text: 'She is prompted to request additional permissions' },
          { id: 'C', text: 'The operation is denied because S3ReadOnlyAccess only allows read operations' },
          { id: 'D', text: 'She can create buckets but not upload files to them' },
        ],
        correct: 'C',
        explanation: 'AmazonS3ReadOnlyAccess grants only s3:Get* and s3:List* actions. s3:CreateBucket is a write action not included. IAM default is deny — if the action is not explicitly allowed, it is blocked.',
        wrongExplanations: {
          A: '"S3 access" is vague — IAM only grants exactly what the policy specifies.',
          B: 'AWS does not present an approval prompt; it returns AccessDenied immediately.',
          D: 'If she cannot create the bucket, she certainly cannot manage its contents either.',
        },
        flowchart: `AmazonS3ReadOnlyAccess grants:
  ✅ s3:GetObject          (download files)
  ✅ s3:GetBucketPolicy    (read bucket config)
  ✅ s3:ListBucket         (list files)
  ✅ s3:ListAllMyBuckets   (list all buckets)

  ❌ s3:CreateBucket       (blocked)
  ❌ s3:PutObject          (blocked)
  ❌ s3:DeleteObject       (blocked)`,
        wrongGuidance: '"Has S3 access" is exactly the kind of vague thinking that leads to real-world permission misconfigurations. Always look at the specific actions the policy grants.',
      },
      {
        id: 'p1-q4', difficulty: 'intermediate', topic: 'Multi-Group User',
        question: 'A data engineer needs EC2 start/stop AND Athena query access. dev-team has EC2; data-team has Athena. What should you do?',
        options: [
          { id: 'A', text: 'Create a new dev-data-team group combining both policies' },
          { id: 'B', text: 'Add the data engineer to both dev-team and data-team' },
          { id: 'C', text: 'Attach both group policies directly to the data engineer\'s IAM user' },
          { id: 'D', text: 'The data engineer must pick one group only' },
        ],
        correct: 'B',
        explanation: 'IAM users can belong to multiple groups (up to 10). Their effective permissions are the union of all groups. This is cleaner than creating a new group for every permission combination.',
        wrongExplanations: {
          A: 'Creating a new group for every combination leads to group sprawl.',
          C: 'Direct policy attachment creates drift — if dev-team policy changes, this user will not inherit the update.',
          D: 'IAM has no such restriction; multi-group membership is supported and recommended.',
        },
        flowchart: `data-engineer user
  │
  ├── dev-team   → AmazonEC2FullAccess
  └── data-team  → AmazonAthenaFullAccess
                   AmazonS3ReadOnlyAccess

Effective permissions:
  = AmazonEC2FullAccess
  + AmazonAthenaFullAccess
  + AmazonS3ReadOnlyAccess
  (union of all Allows)

Note: A Deny in ANY group applies to ALL`,
        wrongGuidance: 'Adding to multiple groups keeps group definitions clean and single-purpose.',
      },
      {
        id: 'p1-q5', difficulty: 'intermediate', topic: 'Deny Blocks Admin',
        question: 'dave is in ops-team with AdministratorAccess. You add an explicit Deny on s3:DeleteBucket to ops-team. Dave tries to delete an S3 bucket. What happens?',
        options: [
          { id: 'A', text: 'Dave can delete the bucket because AdministratorAccess outranks the Deny' },
          { id: 'B', text: 'Dave is blocked — the explicit Deny overrides AdministratorAccess' },
          { id: 'C', text: 'Dave needs to temporarily remove himself from ops-team to delete the bucket' },
          { id: 'D', text: 'The Deny only applies to non-admin users' },
        ],
        correct: 'B',
        explanation: 'You can use explicit Deny to create hard guardrails that even admins cannot bypass. This is how organizations protect critical resources: broad permissions with specific Deny guardrails on destructive operations.',
        wrongExplanations: {
          A: 'AdministratorAccess is an Allow. An explicit Deny from another policy always wins.',
          C: 'IAM does not have a "temporarily remove yourself" mechanism.',
          D: 'Explicit Deny applies to ALL identities — admin status provides no exception.',
        },
        flowchart: `ops-team policies:
  Policy 1: AdministratorAccess → Allow *:*
  Policy 2: SafetyGuardrail     → Deny s3:DeleteBucket

Dave attempts s3:DeleteBucket:
  Found Allow? YES (from Policy 1)
  Found Deny?  YES (from Policy 2)
               │
         Deny wins 🚫

Use explicit Deny to protect critical
operations even from admins ✅`,
        wrongGuidance: 'AdministratorAccess is the broadest Allow but it is still just an Allow. Any explicit Deny beats it.',
      },
      {
        id: 'p1-q6', difficulty: 'intermediate', topic: 'Permission Union',
        question: 'alice is in dev-team (AmazonS3ReadOnlyAccess). You also attach AmazonS3FullAccess directly to Alice\'s IAM user. Alice tries to upload a file to S3. What happens?',
        options: [
          { id: 'A', text: 'Blocked — group policies override user policies' },
          { id: 'B', text: 'Allowed — IAM takes the union of all Allows; AmazonS3FullAccess from her user policy allows uploads' },
          { id: 'C', text: 'Allowed only if Alice is also in ops-team' },
          { id: 'D', text: 'The group\'s read-only policy cancels the user\'s full access policy' },
        ],
        correct: 'B',
        explanation: 'IAM does not have policy precedence based on where the policy is attached (group vs. user). All policies are collected and evaluated together. No Deny exists → upload is allowed.',
        wrongExplanations: {
          A: 'There is no concept of "group policies override user policies" in IAM; they are evaluated equally.',
          C: 'Group membership does not affect this logic.',
          D: 'More permissive does not cancel less permissive — they add together (union).',
        },
        flowchart: `Alice's effective permissions:
  From dev-team: Allow s3:Get*, s3:List*
  From direct:   Allow s3:*

Combined (union):
  Allow s3:Get*    ✅ (from group)
  Allow s3:List*   ✅ (from group)
  Allow s3:Put*    ✅ (from direct)
  Allow s3:Delete* ✅ (from direct)

No explicit Deny anywhere → Upload succeeds ✅`,
        wrongGuidance: 'IAM has no "most restrictive wins" rule for Allows. Only explicit Deny wins unconditionally.',
      },
      {
        id: 'p1-q7', difficulty: 'hard', topic: 'Bucket Policy vs IAM',
        question: 'Alice has AmazonS3FullAccess. An S3 bucket policy explicitly denies s3:PutObject for alice. Alice tries to upload to that bucket. What happens?',
        options: [
          { id: 'A', text: 'Upload succeeds because her IAM user policy allows it' },
          { id: 'B', text: 'Upload is denied because the bucket policy\'s explicit Deny overrides the IAM Allow' },
          { id: 'C', text: 'IAM user policies always override bucket policies' },
          { id: 'D', text: 'Alice needs AdministratorAccess to bypass bucket policies' },
        ],
        correct: 'B',
        explanation: 'When an identity accesses a resource, AWS evaluates BOTH the identity-based policy AND the resource-based policy (bucket policy) together. An explicit Deny in either source blocks the action.',
        wrongExplanations: {
          A: 'IAM Allows do not override resource-based Denies; both are evaluated together.',
          C: 'There is no IAM rule where user policies override bucket policies.',
          D: 'Even AdministratorAccess cannot override an explicit Deny.',
        },
        flowchart: `Alice attempts s3:PutObject on "prod-uploads"
               │
  AWS evaluates ALL applicable policies:
  IAM User: AmazonS3FullAccess → Allow s3:* ✅
  Bucket Policy: Deny PutObject for alice 🚫
               │
  Explicit Deny found → DENIED
  (even though IAM says Allow)`,
        wrongGuidance: 'Resource policies and identity policies are evaluated together, and any Deny in either wins.',
      },
      {
        id: 'p1-q8', difficulty: 'hard', topic: 'MFA CLI Enforcement',
        question: 'All users have: "Deny * where aws:MultiFactorAuthPresent = false". Alice\'s CLI profile does NOT include an MFA session token. She runs "aws s3 ls". What happens?',
        options: [
          { id: 'A', text: 'The command succeeds because CLI access bypasses MFA requirements' },
          { id: 'B', text: 'The command is denied because the condition matches (no MFA present = Deny fires)' },
          { id: 'C', text: 'The command succeeds only for read actions' },
          { id: 'D', text: 'The Deny only applies to console logins, not CLI' },
        ],
        correct: 'B',
        explanation: 'The condition aws:MultiFactorAuthPresent = false evaluates to TRUE when no MFA session token is present. Since the Deny condition is satisfied, the Deny applies. CLI and Console are treated equally by IAM conditions.',
        wrongExplanations: {
          A: 'CLI has no inherent bypass of IAM conditions.',
          C: 'Read vs write action type does not matter here — the Deny applies to Action: "*".',
          D: 'aws:MultiFactorAuthPresent applies to all API calls, regardless of console or CLI origin.',
        },
        flowchart: `Without MFA session (BLOCKED):
  aws s3 ls → AccessDenied 🚫
  (MultiFactorAuthPresent = false → Deny fires)

Correct CLI workflow with MFA:
  Step 1: aws sts get-session-token
          --serial-number arn:...mfa-device
          --token-code 123456
          → returns temp credentials + SessionToken

  Step 2: Export temp credentials
  Step 3: aws s3 ls → succeeds ✅
          (MultiFactorAuthPresent = true)`,
        wrongGuidance: 'IAM conditions do not distinguish between CLI and console. The condition evaluates the credentials used.',
      },
      {
        id: 'p1-q9', difficulty: 'hard', topic: 'IAM Policy Variables',
        question: 'You have 20 developers each needing access to their own S3 "folder" (dev-uploads/{username}/). What is the MOST MAINTAINABLE approach?',
        options: [
          { id: 'A', text: 'Create 20 separate IAM users each with a custom inline policy' },
          { id: 'B', text: 'Create 20 separate IAM groups, one per developer' },
          { id: 'C', text: 'Create one IAM group with a policy using ${aws:username} variable to scope access to each user\'s own prefix' },
          { id: 'D', text: 'Grant all developers AmazonS3FullAccess and rely on honor system' },
        ],
        correct: 'C',
        explanation: 'IAM policy variables resolve at evaluation time to the calling user\'s identity. ${aws:username} becomes "alice" when Alice calls the API, and "bob" when Bob calls it. One policy handles all 20 users with perfect per-user scoping.',
        wrongExplanations: {
          A: '20 inline policies = 20 things to maintain; adding developer #21 requires another manual policy.',
          B: '20 groups = same overhead as 20 inline policies.',
          D: 'Honor systems fail; least privilege must be enforced.',
        },
        flowchart: `Policy Resource: "arn:aws:s3:::dev-uploads/\${aws:username}/*"

When alice calls s3:GetObject on dev-uploads/alice/file.txt:
  \${aws:username} → "alice"
  Matches: dev-uploads/alice/* ✅ Allowed

When alice calls s3:GetObject on dev-uploads/bob/file.txt:
  \${aws:username} → "alice"
  Pattern: dev-uploads/alice/*
  Request: dev-uploads/bob/... ❌ No match → Denied`,
        wrongGuidance: 'IAM policy variables are designed exactly for this pattern — one policy, personalized behavior per user.',
      },
      {
        id: 'p1-q10', difficulty: 'expert', topic: 'Temporary Contractor Access',
        question: 'A startup needs 3 contractors to have Console access for exactly 2 weeks. No permanent credentials should remain after the engagement. Which is the BEST approach?',
        options: [
          { id: 'A', text: 'Create IAM users for contractors, note to delete them after 2 weeks' },
          { id: 'B', text: 'Create temporary IAM users with console access and schedule a Lambda to delete users on day 15' },
          { id: 'C', text: 'Configure IAM Identity Center with time-limited permission assignments; remove the assignment after 2 weeks' },
          { id: 'D', text: 'Share an existing employee\'s IAM user credentials temporarily' },
        ],
        correct: 'C',
        explanation: 'IAM Identity Center manages access assignments centrally. Removing the assignment immediately revokes access. No credentials exist to revoke or chase down. This is the cleanest enterprise approach for temporary external access.',
        wrongExplanations: {
          A: '"Note to delete" is error-prone — humans forget; orphaned credentials are a real risk.',
          B: 'Lambda deletion is operational overhead with failure modes; access keys persist past password expiry.',
          D: 'Sharing credentials destroys accountability and is against IAM security best practices.',
        },
        flowchart: `Day 0: Create Identity Center assignment
  → Contractor gets SSO access ✅

Day 1-13: Contractor works
  → All actions logged in CloudTrail
    under contractor's unique identity

Day 14: Engagement ends
  ① Remove Identity Center assignment
     → Role becomes unassumable instantly
  ② Disable/delete the SSO user
  ③ No credentials to revoke anywhere ✅
  ④ Full audit trail preserved`,
        wrongGuidance: '"Note to delete" is a manual process. IAM users are frequently forgotten and left active for months after contractors leave.',
      },
    ],
  },
  {
    postId: 'iam-policy-management-part-2',
    questions: [
      {
        id: 'p2-q1', difficulty: 'beginner', topic: 'What Is Least Privilege',
        question: 'A Lambda function only reads one S3 bucket. Which policy BEST represents least privilege?',
        options: [
          { id: 'A', text: '{"Effect":"Allow","Action":"*","Resource":"*"}' },
          { id: 'B', text: '{"Effect":"Allow","Action":"s3:*","Resource":"*"}' },
          { id: 'C', text: '{"Effect":"Allow","Action":["s3:GetObject","s3:ListBucket"],"Resource":"arn:aws:s3:::reports-bucket/*"}' },
          { id: 'D', text: '{"Effect":"Allow","Action":["s3:GetObject","s3:ListBucket"],"Resource":"*"}' },
        ],
        correct: 'C',
        explanation: 'Least privilege = only the actions required (GetObject + ListBucket) on only the specific resource (reports-bucket). This is the minimum permission needed to do the job.',
        wrongExplanations: {
          A: 'Allows all actions on all AWS services — the most dangerous possible policy.',
          B: 's3:* includes Delete, Create, and policy management — far more than read access.',
          D: 'Correct actions but "Resource":"*" applies them to ALL buckets in the account.',
        },
        flowchart: `OPTION A:  ALL AWS SERVICES (extremely dangerous)
OPTION B:  ALL S3 operations (too broad)
OPTION D:  Right actions, ALL buckets (too broad)
OPTION C:  Right actions, ONE bucket ✅ (correct)`,
        wrongGuidance: 'Always scope Resource to the specific ARN when you know it.',
      },
      {
        id: 'p2-q2', difficulty: 'beginner', topic: 'AWS Managed Policy Scope',
        question: 'The data-team has AmazonS3ReadOnlyAccess. This policy grants read access to:',
        options: [
          { id: 'A', text: 'Only the buckets you specify during policy creation' },
          { id: 'B', text: 'Only buckets in the us-east-1 region' },
          { id: 'C', text: 'All S3 buckets in the entire AWS account' },
          { id: 'D', text: 'S3 buckets created by the data team only' },
        ],
        correct: 'C',
        explanation: 'AWS Managed Policies use "Resource":"*" for broad usability. AmazonS3ReadOnlyAccess grants s3:Get* and s3:List* on every bucket — including buckets containing financial data, customer PII, or audit logs.',
        wrongExplanations: {
          A: 'AWS Managed Policies are pre-built and not customizable at creation time.',
          B: 'S3 is a global service; IAM policies do not restrict S3 by region natively.',
          D: 'S3 does not track bucket "ownership" in a way that IAM policies can filter on.',
        },
        flowchart: `Before custom policy (AWS Managed):
  data-team can read:
    ✅ analytics-data-bucket   (intended)
    ✅ payroll-bucket           (unintended ❌)
    ✅ legal-archive-bucket     (unintended ❌)

After custom policy:
  data-team can read:
    ✅ analytics-data-bucket   (intended ✅)
    ❌ payroll-bucket           (blocked ✅)`,
        wrongGuidance: 'AWS Managed Policies are not configurable at attachment time. They always apply exactly as AWS wrote them — usually with "Resource":"*".',
      },
      {
        id: 'p2-q3', difficulty: 'beginner', topic: 'Explicit Deny for Destructive Operations',
        question: 'Developers should start and stop EC2 instances but NEVER terminate them. Which policy structure achieves this?',
        options: [
          { id: 'A', text: 'Allow ec2:StartInstances and ec2:StopInstances only — IAM default deny covers terminate' },
          { id: 'B', text: 'Allow StartInstances, StopInstances, DescribeInstances, plus an explicit Deny on ec2:TerminateInstances' },
          { id: 'C', text: 'Allow ec2:* and rely on training to prevent terminations' },
          { id: 'D', text: 'Allow StartInstances and StopInstances, then ask AWS Support to block terminate' },
        ],
        correct: 'B',
        explanation: 'While implicit deny would technically work, an explicit Deny provides stronger protection. If someone later adds AmazonEC2FullAccess to the same group, the implicit deny would disappear — but an explicit Deny would still win.',
        wrongExplanations: {
          A: 'This works only as long as no other policy adds ec2:*; explicit Deny is more durable.',
          C: 'Training is not access control; human error happens; policies are the real guard.',
          D: 'AWS Support cannot modify customer IAM policies.',
        },
        flowchart: `Developer policy:
  Allow: StartInstances, StopInstances ✅
  Deny:  TerminateInstances 🚫

Later someone adds AmazonEC2FullAccess:
  AmazonEC2FullAccess: Allow ec2:* ✅
  Explicit Deny still: Deny Terminate 🚫

Result: Terminate is STILL blocked ✅
The Deny persists across policy additions

Without explicit Deny:
  Add ec2:* policy → terminate suddenly allowed ❌`,
        wrongGuidance: 'The implicit deny approach is fragile. Any future Allow policy that includes ec2:TerminateInstances would suddenly permit it.',
      },
      {
        id: 'p2-q4', difficulty: 'intermediate', topic: 'S3 Resource ARN Structure',
        question: 'Exercise 2.1 uses two Resource ARNs: "arn:aws:s3:::analytics-data-bucket" and "arn:aws:s3:::analytics-data-bucket/*". Why are BOTH required?',
        options: [
          { id: 'A', text: 'AWS requires duplicate ARNs for redundancy' },
          { id: 'B', text: 'The first ARN covers bucket-level operations (ListBucket); the second covers object-level operations (GetObject)' },
          { id: 'C', text: 'The first is for console access; the second is for CLI access' },
          { id: 'D', text: 'Both ARNs are equivalent — you only need one of them' },
        ],
        correct: 'B',
        explanation: 'S3 actions have two scopes in IAM: bucket actions (s3:ListBucket) apply to the bucket ARN, while object actions (s3:GetObject) apply to the objects ARN (with /*). If you only include /*, s3:ListBucket returns Access Denied.',
        wrongExplanations: {
          A: 'IAM does not require redundancy; both ARNs serve different purposes.',
          C: 'Console and CLI use the same IAM evaluation; no distinction exists.',
          D: 'They are NOT equivalent — one scopes bucket-level, one scopes object-level.',
        },
        flowchart: `Action                │ Correct Resource ARN
──────────────────────┼────────────────────────────
s3:ListBucket         │ arn:aws:s3:::my-bucket
s3:GetBucketPolicy    │ arn:aws:s3:::my-bucket
──────────────────────┼────────────────────────────
s3:GetObject          │ arn:aws:s3:::my-bucket/*
s3:PutObject          │ arn:aws:s3:::my-bucket/*
s3:DeleteObject       │ arn:aws:s3:::my-bucket/*

Policy needs BOTH lines to support
ListBucket + GetObject together ✅`,
        wrongGuidance: 'A policy with only /* will deny s3:ListBucket. A policy with only the bucket ARN will deny s3:GetObject. You need both.',
      },
      {
        id: 'p2-q5', difficulty: 'intermediate', topic: 'Customer vs AWS Managed',
        question: 'Why is a Customer Managed Policy (DataTeam-S3-ReadOnly) BETTER than AWS Managed AmazonS3ReadOnlyAccess for the data team?',
        options: [
          { id: 'A', text: 'Customer Managed Policies are free; AWS Managed Policies cost extra per attachment' },
          { id: 'B', text: 'Customer Managed Policies can be scoped to specific resources and actions matching your exact need' },
          { id: 'C', text: 'AWS Managed Policies can only be attached to users, not groups' },
          { id: 'D', text: 'Customer Managed Policies automatically update when new S3 features are released' },
        ],
        correct: 'B',
        explanation: 'The key advantage of Customer Managed Policies is precision. You control the exact actions and exact resource ARNs. AWS Managed Policies are intentionally broad to be reusable across many customers.',
        wrongExplanations: {
          A: 'Both policy types are free; IAM itself has no per-policy cost.',
          C: 'Both policy types can be attached to users, groups, and roles.',
          D: 'AWS Managed Policies actually auto-update (AWS maintains them); Customer Managed Policies require manual updates.',
        },
        flowchart: `AWS Managed (AmazonS3ReadOnlyAccess):
  Action: s3:Get*, s3:List*
  Resource: *                ← ALL buckets, always

Customer Managed (DataTeam-S3-ReadOnly):
  Action: s3:GetObject, s3:ListBucket
  Resource: arn:aws:s3:::analytics-data-bucket
            arn:aws:s3:::analytics-data-bucket/*
                             ← ONE bucket ✅

Trade-off:
  AWS Managed: less maintenance, less precise
  Customer Managed: more maintenance, more precise ✅`,
        wrongGuidance: 'This is backwards. AWS Managed Policies are maintained by AWS and receive updates. Customer Managed Policies are your responsibility.',
      },
      {
        id: 'p2-q6', difficulty: 'intermediate', topic: 'Policy Variable Self-Service',
        question: 'AllUsers-SelfMFA policy uses "Resource":"arn:aws:iam::*:user/${aws:username}". Alice tries to enable MFA for Bob using this policy. What happens?',
        options: [
          { id: 'A', text: 'Alice can manage MFA for Bob because they are in the same account' },
          { id: 'B', text: 'Alice is denied — ${aws:username} resolves to "alice", so the ARN only matches Alice\'s own user' },
          { id: 'C', text: 'Alice can manage MFA for anyone in her group' },
          { id: 'D', text: 'The operation requires root access' },
        ],
        correct: 'B',
        explanation: '${aws:username} is an IAM policy variable that resolves to the username of the caller at evaluation time. When Alice calls the API, it becomes arn:aws:iam::*:user/alice. Bob\'s ARN is different — no match → denied.',
        wrongExplanations: {
          A: 'Same account does not matter; the Resource ARN pattern must match the target.',
          C: 'Group membership does not affect what resource ARN the variable resolves to.',
          D: 'Root is not required for MFA management when the right policy is in place.',
        },
        flowchart: `Alice calls iam:EnableMFADevice for Bob:
  Target: arn:aws:iam::123:user/bob

Policy Resource:
  arn:aws:iam::*:user/\${aws:username}
  = arn:aws:iam::*:user/alice

Does resource match the target?
  Policy allows: .../user/alice
  Request is:    .../user/bob  ← NO MATCH

Result: DENIED 🚫

Alice calls for herself:
  Target: arn:aws:iam::123:user/alice → MATCH ✅`,
        wrongGuidance: 'IAM does not have an "account family trust" concept. Every API call is evaluated against the exact policy conditions.',
      },
      {
        id: 'p2-q7', difficulty: 'hard', topic: 'Blast Radius with Least Privilege',
        question: 'A CI/CD pipeline role allows StartInstances, StopInstances, DescribeInstances and denies TerminateInstances. The pipeline is compromised. What is the blast radius?',
        options: [
          { id: 'A', text: 'Attacker can delete all EC2 instances and their data' },
          { id: 'B', text: 'Attacker can start/stop instances but cannot terminate them or affect any other service' },
          { id: 'C', text: 'Attacker gains full AWS account access through the EC2 service' },
          { id: 'D', text: 'Attacker can stop production instances, potentially causing an outage' },
        ],
        correct: 'D',
        explanation: 'The policy allows ec2:StopInstances on all resources. An attacker could stop any running EC2 instance, causing a production outage. They cannot terminate (permanent deletion), but stopping is still damaging. "Least privilege" still needs careful thought.',
        wrongExplanations: {
          A: 'Terminate is explicitly denied — instances cannot be deleted.',
          B: 'Stopping production instances IS significant damage; "cannot terminate" does not mean "safe".',
          C: 'EC2 permissions do not grant access to other services; IAM is service-scoped.',
        },
        flowchart: `Compromised role capabilities:
  ✅ ec2:StartInstances    → start stopped instances
  ✅ ec2:StopInstances     → STOP RUNNING INSTANCES ⚠️
  ✅ ec2:DescribeInstances → enumerate all EC2 (recon)
  🚫 ec2:TerminateInstances → blocked (data safe)
  🚫 s3:*, rds:*, iam:*   → no permissions

Real damage:
  → Stop all production web servers → site goes down
  → Stop DB instances → data inaccessible (not lost)`,
        wrongGuidance: '"Cannot terminate" is reassuring but does not mean the attacker is harmless. Stopping production instances is a significant availability attack.',
      },
      {
        id: 'p2-q8', difficulty: 'hard', topic: 'Inline Policy Override Attempt',
        question: 'A group policy has Deny ec2:TerminateInstances. A developer argues: "If I attach an inline policy allowing ec2:TerminateInstances, I can bypass the Deny." Are they correct?',
        options: [
          { id: 'A', text: 'Yes — inline policies are evaluated separately and can override group policies' },
          { id: 'B', text: 'Yes — inline policies attached directly to a user always win' },
          { id: 'C', text: 'No — explicit Deny from any source overrides all Allows from all sources' },
          { id: 'D', text: 'It depends on which policy was attached most recently' },
        ],
        correct: 'C',
        explanation: 'IAM collects ALL policies — group policies, direct policies, inline policies — and evaluates them together. An explicit Deny in ANY policy blocks the action. There is no "most specific wins" or "inline policy takes precedence" rule.',
        wrongExplanations: {
          A: 'There is no separate evaluation for inline policies; all policies are evaluated together.',
          B: 'Inline policies do not "win" over group policies in any scenario.',
          D: 'Attachment time/order has zero effect on IAM evaluation.',
        },
        flowchart: `Developer's argument:
  "Group Deny + Inline Allow = Allow wins?"

IAM reality:
  Collect all policies:
    Group policy: Deny ec2:TerminateInstances
    Inline policy: Allow ec2:TerminateInstances

  Is there any explicit Deny?
    YES → DENIED 🚫 (always, no exceptions)

  The inline Allow is completely irrelevant
  once an explicit Deny is found.`,
        wrongGuidance: 'If inline policies could bypass group Denies, every security guardrail could be defeated by any user who can attach inline policies to themselves. IAM was designed to prevent this.',
      },
      {
        id: 'p2-q9', difficulty: 'hard', topic: 'Resource ARN Precision',
        question: 'A Lambda function logs to CloudWatch. Which Resource ARN is MOST SECURE for a policy allowing logs:PutLogEvents?',
        options: [
          { id: 'A', text: '"Resource":"*" — allows logging to any log group' },
          { id: 'B', text: '"Resource":"arn:aws:logs:*:*:*" — allows any CloudWatch Logs resource' },
          { id: 'C', text: '"Resource":"arn:aws:logs:us-east-1:123456789:log-group:/aws/lambda/my-function:log-stream:*"' },
          { id: 'D', text: '"Resource":"arn:aws:logs:us-east-1:123456789:log-group:*" — all log groups in the region' },
        ],
        correct: 'C',
        explanation: 'The Lambda function only needs to write to its own log streams. The most secure Resource ARN targets the exact log group and log stream pattern for that function. This prevents the Lambda from injecting fake logs into other applications\' log streams.',
        wrongExplanations: {
          A: '"Resource":"*" allows writing to ANY log group — a compromised Lambda could inject fake logs into security audit streams.',
          B: 'Even broader — *:*:* matches all CloudWatch Logs resources.',
          D: 'All log groups in the region — still too broad.',
        },
        flowchart: `logs:PutLogEvents → needs log-stream ARN (with :log-stream:*)
logs:CreateLogGroup → needs log-group ARN
logs:CreateLogStream → needs log-group ARN

Most secure Lambda logging policy:
  logs:CreateLogGroup  → arn:.../log-group:/aws/lambda/my-function
  logs:CreateLogStream → arn:.../log-group:/aws/lambda/my-function:*
  logs:PutLogEvents    → arn:.../log-group:/aws/lambda/my-function:log-stream:*`,
        wrongGuidance: 'When a Lambda function is compromised, overly broad logging permissions mean an attacker could write fake entries to audit or security log groups — obscuring attack evidence.',
      },
      {
        id: 'p2-q10', difficulty: 'expert', topic: 'Instance Type Restriction',
        question: 'You want to prevent developers from launching expensive GPU instances (p4d.*). They should only launch t3.* instance types. Which IAM element achieves this?',
        options: [
          { id: 'A', text: 'Use separate IAM roles for each instance type family' },
          { id: 'B', text: 'Add a Condition on ec2:RunInstances using ec2:InstanceType matching t3.*, plus explicit Deny for expensive types' },
          { id: 'C', text: 'Use AWS Budgets to stop the account when GPU instances appear' },
          { id: 'D', text: 'Use a resource-based policy on EC2' },
        ],
        correct: 'B',
        explanation: 'IAM condition key ec2:InstanceType lets you scope ec2:RunInstances to specific instance families. The Allow + Condition grants only t3 family. The explicit Deny for expensive types adds a hard backstop for defense in depth.',
        wrongExplanations: {
          A: 'Separate roles do not restrict instance types; a developer could still launch any type through the same role.',
          C: 'Budgets detect overspend but do not prevent the launch; you detect the violation after the fact.',
          D: 'EC2 does not support resource-based policies (unlike S3 or Lambda).',
        },
        flowchart: `Developer tries ec2:RunInstances:
  t3.medium → Condition matches t3.* → ALLOWED ✅
  t3.xlarge → Condition matches t3.* → ALLOWED ✅
  m5.large  → Doesn't match t3.*    → DENIED (no Allow matches)
  p4d.24xl  → Matches explicit Deny → DENIED 🚫 (hard block)`,
        wrongGuidance: 'Budgets are reactive — the instance already exists and is billing you before the alert fires. IAM conditions are preventive — the launch request is rejected before the instance starts.',
      },
    ],
  },
  {
    postId: 'iam-policy-management-part-3',
    questions: [
      {
        id: 'p3-q1', difficulty: 'beginner', topic: 'Policy Simulator Purpose',
        question: 'What is the primary purpose of the IAM Policy Simulator?',
        options: [
          { id: 'A', text: 'To automatically generate IAM policies based on your usage patterns' },
          { id: 'B', text: 'To test whether a specific IAM action will be allowed or denied for a given user or role before applying policies in production' },
          { id: 'C', text: 'To simulate AWS service outages and test how applications respond' },
          { id: 'D', text: 'To estimate cost savings from IAM policy optimization' },
        ],
        correct: 'B',
        explanation: 'The Policy Simulator lets you select a user or role, choose a service and action, and see exactly what the outcome would be — with the specific policy statement that caused it. This prevents production lockout incidents.',
        wrongExplanations: {
          A: 'IAM Access Advisor shows which services a user has accessed; neither auto-generates policies.',
          C: 'The Simulator is specifically for IAM evaluation, not service availability testing.',
          D: 'IAM has no cost optimization tool; Cost Explorer handles billing.',
        },
        flowchart: `Before deploying a new policy:

1. Open: IAM → Policy Simulator
2. Select: User (e.g., alice)
3. Choose: Service (EC2), Action (TerminateInstances)
4. Click: Run Simulation
5. Result:
   Action: ec2:TerminateInstances
   Result: DENIED
   Reason: Explicit Deny in DevTeam-EC2-NoTerminate
6. Verify all expected outcomes before deploying ✅`,
        wrongGuidance: 'IAM Access Advisor (different tool) shows services accessed, but it does not auto-generate policies.',
      },
      {
        id: 'p3-q2', difficulty: 'beginner', topic: 'Access Analyzer Purpose',
        question: 'IAM Access Analyzer helps you:',
        options: [
          { id: 'A', text: 'Monitor who logged into the AWS Console in the last 24 hours' },
          { id: 'B', text: 'Identify resources shared with external entities or that have overly permissive access beyond your trust zone' },
          { id: 'C', text: 'Automatically fix overly permissive policies' },
          { id: 'D', text: 'Track IAM user password changes' },
        ],
        correct: 'B',
        explanation: 'Access Analyzer examines resource-based policies (S3 buckets, IAM roles, KMS keys, SQS queues, Lambda functions) and reports findings when access is granted outside your defined zone of trust — such as to another AWS account or to Principal: * (public).',
        wrongExplanations: {
          A: 'CloudTrail + CloudWatch handles login monitoring; Access Analyzer is not real-time event-based.',
          C: 'Access Analyzer finds problems; it does NOT auto-fix them. Remediation is always manual.',
          D: 'IAM Credentials Report tracks password changes; Access Analyzer focuses on access exposure.',
        },
        flowchart: `IAM Access Analyzer (zone of trust: your account)

Finding 1: S3 Bucket "public-data"
  Issue: Bucket policy allows Principal: *
  Action: Review — is this intentional?

Finding 2: IAM Role "audit-role"
  Issue: Trust policy allows external account 999
  Action: Verify — is this an authorized auditor?

Finding 3: Lambda "process-payments"
  Issue: Resource policy allows unknown account 888
  Action: Investigate — unknown account ⚠️`,
        wrongGuidance: 'Access Analyzer is a detection and reporting tool, not a remediation tool. Human review and action is always required.',
      },
      {
        id: 'p3-q3', difficulty: 'beginner', topic: 'First Debugging Step',
        question: 'Bob reports he cannot list EC2 instances even though he should be in dev-team. What should you check FIRST?',
        options: [
          { id: 'A', text: 'Call AWS Support and report an EC2 service issue' },
          { id: 'B', text: 'Check Bob\'s IAM user permissions and verify his group membership in the IAM console' },
          { id: 'C', text: 'Delete and recreate Bob\'s IAM user' },
          { id: 'D', text: 'Verify EC2 service health in the AWS Service Health Dashboard' },
        ],
        correct: 'B',
        explanation: 'The most common cause of unexpected AccessDenied is a misconfiguration — wrong group, wrong policy, or a Deny overriding an Allow. Start with the simplest explanation: verify the actual state of Bob\'s IAM configuration.',
        wrongExplanations: {
          A: 'EC2 service issues are rare and would affect all users; IAM misconfig is far more common.',
          C: 'Deleting and recreating fixes nothing if the root cause is a missing group assignment.',
          D: 'If EC2 was down, all users would be affected — not just Bob.',
        },
        flowchart: `Bob reports: "Cannot list EC2 instances"
            │
Step 1: IAM → Users → bob → Permissions tab
         → What policies are attached?
         → Which groups is he in?
            │
Step 2: IAM → Users → bob → Groups tab
         → Is bob actually in dev-team?
            │
Step 3: IAM → Policy Simulator → select bob
         → Test ec2:DescribeInstances
         → Result shows: DENY with reason
            │
Step 4: Open the policy that caused the Deny
         → Look for typos, wrong ARNs
            │
Step 5: Fix → re-simulate → confirm Allow ✅`,
        wrongGuidance: 'Service issues affect all users equally. If only Bob has the problem, it is almost certainly an IAM configuration issue.',
      },
      {
        id: 'p3-q4', difficulty: 'intermediate', topic: 'Simulator vs SCP',
        question: 'Policy Simulator shows ec2:StopInstances as ALLOWED for alice, but she gets Access Denied in the real Console. What is the MOST LIKELY explanation?',
        options: [
          { id: 'A', text: 'The Policy Simulator is unreliable and should not be trusted' },
          { id: 'B', text: 'Alice\'s browser cache is stale and needs clearing' },
          { id: 'C', text: 'A Service Control Policy from AWS Organizations is denying the action but was not included in the account-level Simulator run' },
          { id: 'D', text: 'ec2:StopInstances requires MFA even when the policy allows it' },
        ],
        correct: 'C',
        explanation: 'The IAM Policy Simulator evaluates identity-based and resource-based policies within an account. But it does NOT always include SCPs applied at the AWS Organizations level. An SCP Deny from a parent OU will block the action in real life.',
        wrongExplanations: {
          A: 'The Simulator is accurate for what it simulates — it is just incomplete regarding org-level SCPs.',
          B: 'Browser cache does not affect IAM authorization decisions; these are server-side.',
          D: 'ec2:StopInstances does not inherently require MFA unless a specific Condition policy enforces it.',
        },
        flowchart: `Full real-world evaluation order:
1. SCPs (AWS Organizations)   ← Simulator may NOT include this
2. Resource-based policies    ← Simulator includes
3. Identity-based policies    ← Simulator includes
4. Permission boundaries      ← Simulator includes (if selected)

Real deny:
  SCP → Deny ec2:StopInstances in this account
         ↓
  Simulator (account level) → ignores SCP → shows Allow
  Real API call → SCP evaluated → DENIED 🚫

Always verify: Check Org-level SCPs when
simulator says Allow but console says Denied`,
        wrongGuidance: 'The Simulator is a valuable tool — just understand its limitations. SCPs from other accounts are not always captured.',
      },
      {
        id: 'p3-q5', difficulty: 'intermediate', topic: 'Block Public Access',
        question: 'Access Analyzer reports S3 bucket "dev-assets" has a bucket policy allowing Principal:* with s3:GetObject. You confirm it should NOT be public. What is the FASTEST remediation?',
        options: [
          { id: 'A', text: 'Delete the bucket and recreate it without the public policy' },
          { id: 'B', text: 'Remove the Principal:* statement from the bucket policy' },
          { id: 'C', text: 'Enable S3 Block Public Access on the bucket — this overrides the bucket policy regardless of its content' },
          { id: 'D', text: 'Move the bucket to a private VPC subnet' },
        ],
        correct: 'C',
        explanation: 'S3 Block Public Access is a feature that overrides any bucket policy or ACL that would grant public access — even if the policy explicitly allows Principal:*. It is the fastest and most reliable protection.',
        wrongExplanations: {
          A: 'Deleting and recreating is destructive and causes data loss risk.',
          B: 'Editing the bucket policy is correct but slower — Block Public Access is safer and faster as the immediate action.',
          D: 'S3 is not a VPC resource; S3 buckets do not live in subnets.',
        },
        flowchart: `S3 Bucket
  │
  ├── Block Public Access (bucket level) ← overrides everything
  │
  ├── Bucket Policy: Allow Principal: * ← this is the problem
  └── ACL settings

When Block Public Access = ON:
  The bucket policy's "Principal:*" Allow
  is effectively nullified.
  Public requests → BLOCKED ✅

Additional step: also fix the bucket policy
(remove the Principal:* statement) as follow-up`,
        wrongGuidance: 'Editing the bucket policy is the correct permanent fix — but Block Public Access is the safe immediate action.',
      },
      {
        id: 'p3-q6', difficulty: 'intermediate', topic: 'Silent Misconfiguration',
        question: 'During Exercise 3.3, the policy had "ec2:DescribeInstance" (missing the trailing s). What TYPE of error does this cause?',
        options: [
          { id: 'A', text: 'A policy validation error — IAM rejects the unknown action name and refuses to save' },
          { id: 'B', text: 'A syntax error — the JSON is malformed' },
          { id: 'C', text: 'A silent misconfiguration — IAM saves the policy without error, but the unknown action is ignored, causing unexpected Deny' },
          { id: 'D', text: 'A deployment error — the policy can be saved but cannot be attached to a group' },
        ],
        correct: 'C',
        explanation: 'IAM does NOT validate action names against a known list at save time. You can write "ec2:DescribeInstance" (wrong) and IAM will accept the policy. But since that action does not exist, it never matches any real API call — a silent bug.',
        wrongExplanations: {
          A: 'IAM does NOT reject unknown action names; it saves the policy successfully.',
          B: 'The JSON can be syntactically valid even with wrong action names.',
          D: 'The policy attaches and is active — it just silently does not do what you intended.',
        },
        flowchart: `Policy written:
  { "Action": "ec2:DescribeInstance" }  ← typo (missing 's')

IAM response when saving: "Policy created ✅"
No error. No warning. No validation.

Bob tries ec2:DescribeInstances:
  IAM looks for matching Allow:
    "ec2:DescribeInstance" ≠ ec2:DescribeInstances
    No other Allows found
    → Implicit Deny 🚫

Lesson: Always verify action names against
AWS documentation. Use Policy Simulator to
confirm ALLOW before deploying.`,
        wrongGuidance: 'IAM trusts you to write correct action names. It does not validate them. Always test with the Policy Simulator after writing custom policies.',
      },
      {
        id: 'p3-q7', difficulty: 'hard', topic: 'Cross-Account Trust Vulnerability',
        question: 'Access Analyzer flags a role trust policy with "Principal":{"AWS":"arn:aws:iam::*:root"}. Why is this CRITICAL?',
        options: [
          { id: 'A', text: 'The * wildcard in the ARN means any AWS account can assume this role' },
          { id: 'B', text: 'The :root suffix means only root accounts can assume the role, which is too restrictive' },
          { id: 'C', text: 'The trust policy is missing a Condition block, making it read-only' },
          { id: 'D', text: 'Cross-account trust policies must use account IDs, not ARNs' },
        ],
        correct: 'A',
        explanation: 'In a principal ARN, the * replaces the account ID. arn:aws:iam::*:root means "the root principal of any AWS account" — since :root means any principal in that account, this effectively allows any IAM identity from any AWS account to attempt to assume this role.',
        wrongExplanations: {
          B: 'In trust policies, :root does not mean the root user — it means any principal in that account. It is the opposite of restrictive.',
          C: 'Missing Condition does not make a policy read-only; it just removes additional constraints.',
          D: 'You CAN use ARNs in trust policies; the problem is the wildcard account ID.',
        },
        flowchart: `Vulnerable trust policy:
  "Principal":{"AWS":"arn:aws:iam::*:root"}
  = ANY identity in ANY AWS account

Correct trust policy (specific auditor):
  "Principal":{"AWS":"arn:aws:iam::123456789:root"}
  = Only principals from account 123456789

Even better (with ExternalId):
  "Principal":{"AWS":"arn:aws:iam::123456789:root"},
  "Condition":{"StringEquals":{"sts:ExternalId":"secret"}}
  = Account 123456789 + must know the secret ✅`,
        wrongGuidance: ':root in a trust policy Principal means any IAM principal in that account (not the root user). It is maximally permissive for that account.',
      },
      {
        id: 'p3-q8', difficulty: 'hard', topic: 'Athena + S3 Resource Policy',
        question: 'Carol has AmazonAthenaFullAccess. The Policy Simulator confirms all Athena actions are ALLOWED. She still gets Access Denied when running a query. What is the MOST LIKELY cause?',
        options: [
          { id: 'A', text: 'Athena requires a paid upgrade to enable multi-user access' },
          { id: 'B', text: 'AmazonAthenaFullAccess does not include query execution permissions' },
          { id: 'C', text: 'The S3 bucket storing Athena query results has a bucket policy that denies Carol\'s access' },
          { id: 'D', text: 'Carol needs to be in both data-team and ops-team to run Athena queries' },
        ],
        correct: 'C',
        explanation: 'Athena requires an S3 location to write query results. If the bucket policy for that results bucket denies Carol\'s access, Athena cannot write the results — and the query fails with AccessDenied. The IAM Simulator only evaluated Carol\'s IAM policies, not the resource-based S3 bucket policy.',
        wrongExplanations: {
          A: 'Athena is a standard pay-per-use service with no user-count limitations.',
          B: 'AmazonAthenaFullAccess does include athena:StartQueryExecution and all query actions.',
          D: 'Group membership does not affect this; the issue is the S3 resource policy.',
        },
        flowchart: `Carol runs Athena query:
         │
  Athena needs to write results to S3
         │
  Bucket policy evaluated for S3 write:
  Bucket: athena-query-results
  Policy: Deny all except ops-team  ← blocks Carol
         │
  Access Denied 🚫
  (even though Athena IAM is fine)

Fix: Add carol (or data-team group) to
the S3 results bucket policy, or use
a bucket that all teams can write to`,
        wrongGuidance: 'When the Policy Simulator says ALLOW but the action still fails, look for resource-based policies (S3, SQS, KMS) that create a separate Deny layer.',
      },
      {
        id: 'p3-q9', difficulty: 'hard', topic: 'Credentials Report',
        question: 'AWS Config flags dave\'s access key as non-compliant (older than 90 days). Dave says he "rotated it last week." How do you verify his claim?',
        options: [
          { id: 'A', text: 'Ask Dave to show you the creation timestamp in his terminal' },
          { id: 'B', text: 'Check the IAM Credentials Report — it shows access_key_last_rotated and last_used_date per user' },
          { id: 'C', text: 'Check EC2 CloudWatch Logs for access key events' },
          { id: 'D', text: 'Check the AWS Cost Explorer for recent API activity' },
        ],
        correct: 'B',
        explanation: 'The IAM Credentials Report is a downloadable CSV that shows every IAM user\'s key metadata: creation date, last rotation date, last used date, and MFA status. This is the authoritative, AWS-generated audit artifact.',
        wrongExplanations: {
          A: 'Dave could show a fake terminal session; the IAM Credentials Report is generated by AWS and cannot be falsified.',
          C: 'CloudWatch Logs captures application logs, not IAM credential metadata.',
          D: 'Cost Explorer shows billing, not credential rotation history.',
        },
        flowchart: `IAM → Credential Report → Download CSV

Relevant columns for dave's key:
  user                     → dave
  access_key_1_active      → true
  access_key_1_last_rotated → 2026-02-01  ← actual date
  access_key_1_last_used   → 2026-05-10

If last_rotated = 2026-02-01 and today = 2026-05-15:
  That's 103 days ago — NON-COMPLIANT
  Dave's "last week" claim is incorrect

The report is generated by AWS, not by users —
it cannot be falsified.`,
        wrongGuidance: 'User-provided evidence can be fabricated. The Credentials Report is generated by AWS and cannot be manipulated by the user.',
      },
      {
        id: 'p3-q10', difficulty: 'expert', topic: 'Full Policy Debugging',
        question: 'The Policy Simulator shows ec2:DescribeInstances as DENIED for alice even though you intended to Allow it. This policy is attached to alice\'s group:\n\nAllow: [ec2:StartInstances, ec2:StopInstances]\nDeny: ec2:TerminateInstances\n\nWhat is the root cause?',
        options: [
          { id: 'A', text: 'The Deny on TerminateInstances is blocking DescribeInstances too' },
          { id: 'B', text: 'ec2:DescribeInstances is missing from the Allow — it was never granted, so it is implicitly denied' },
          { id: 'C', text: 'The Deny statement must come before the Allow statement' },
          { id: 'D', text: 'ec2:DescribeInstances requires AdministratorAccess' },
        ],
        correct: 'B',
        explanation: 'The policy only explicitly allows StartInstances and StopInstances. ec2:DescribeInstances is not mentioned. IAM\'s default is implicit deny. If an action is not explicitly allowed somewhere, it is denied. The Deny on TerminateInstances has no effect on DescribeInstances.',
        wrongExplanations: {
          A: 'A Deny on "TerminateInstances" only blocks "TerminateInstances" — it has no effect on "DescribeInstances".',
          C: 'Statement order has absolutely no effect on IAM evaluation — this is a persistent myth.',
          D: 'ec2:DescribeInstances is a standard describe action; it does not require admin access.',
        },
        flowchart: `Policy allows:
  Statement 1: Allow StartInstances, StopInstances
               → DescribeInstances NOT listed
  Statement 2: Deny TerminateInstances
               → DescribeInstances NOT mentioned

No Allow found for DescribeInstances
  → Implicit Deny applies (default)

Root cause: ec2:DescribeInstances was omitted

Fix: Add it to Statement 1:
  "Action": [
    "ec2:StartInstances",
    "ec2:StopInstances",
    "ec2:DescribeInstances"  ← add this
  ]

Re-simulate → ALLOWED ✅`,
        wrongGuidance: 'A Deny is precise — it only blocks the exact actions listed in its Action field. Deny spreads to "similar" actions is a dangerous misconception.',
      },
    ],
  },
];

export function getQuizByPostId(postId: string): LessonQuiz | undefined {
  return quizzes.find((q) => q.postId === postId);
}
