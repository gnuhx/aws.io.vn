import type { Post } from '../types/post';

export const posts: Post[] = [
  {
    id: 'stupid-dev-learns-aws',
    title: 'Stupid Dev Learns AWS 🤡',
    excerpt:
      'A big AWS learning blog that groups topics into focused roadmaps, starting with IAM.',
    date: '2026-05-15',
    readTime: 6,
    tags: ['Learning Tree', 'AWS'],
    content: '',
    path: '/learning/stupid-dev-learns-aws',
  },
  {
    id: 'lazier-showcase',
    title: 'Lazier — Habit Tracker for Android',
    excerpt:
      'A simple project showcase for Lazier, including the app overview, key features, and the privacy policy page used for Google Play listing details.',
    date: '2025-05-05',
    readTime: 4,
    tags: ['Android', 'Product', 'Privacy Policy'],
    content: '',
    path: '/projects/lazier',
  },
  {
    id: 'aws-lambda-ghost-kitchen',
    title: 'AWS Lambda — Pho24h Ghost Kitchen',
    excerpt:
      'An interactive visual map of AWS Lambda — from triggers (API Gateway, EventBridge, SQS) to execution environments, concurrency, cold starts, and destinations — told through ghost chefs who appear only when an order arrives.',
    date: '2025-05-02',
    readTime: 15,
    tags: ['Lambda', 'Serverless', 'Interactive', 'SAA-C03'],
    content: '',
  },
  {
    id: 'aws-vpc-pho24h',
    title: 'AWS VPC — Pho24h Factory',
    excerpt:
      'An interactive visual map of all 15 AWS VPC components — from Internet Gateway to NAT Gateway — told through the lens of a Vietnamese pho restaurant factory. Click any component to explore its concept, a real-world example, and a funny factory story.',
    date: '2025-05-01',
    readTime: 15,
    tags: ['VPC', 'Networking', 'Interactive', 'SAA-C03'],
    content: '',
  },
  {
    id: 'iam-secure-root-account',
    title: 'Secure your Root Account',
    excerpt:
      'Placeholder lesson for securing the AWS root account before building out IAM access patterns.',
    date: '2026-05-15',
    readTime: 8,
    tags: ['IAM', 'Security', 'Roadmap'],
    content: `
      <h2>Concept</h2>
      <p>
        The <strong>root account</strong> is the god-mode identity created when you first sign up for AWS.
        It has unrestricted access to everything: billing, account deletion, IAM, and every AWS service.
        No normal permission boundary can meaningfully protect you from careless root usage.
      </p>
      <p>
        The safest pattern is simple: enable MFA, avoid using root for daily work, delete root access keys,
        and treat the credentials like a vault key rather than a regular login.
      </p>

      <h2>Best Practices</h2>
      <ul>
        <li><strong>Enable MFA</strong> on the root account immediately.</li>
        <li><strong>Never use root for daily tasks</strong>; create IAM users or roles instead.</li>
        <li><strong>Delete root access keys</strong>, or better, never create them in the first place.</li>
        <li><strong>Store root credentials safely</strong> in a password manager or another controlled vault.</li>
      </ul>

      <h2>What Happens Without It?</h2>
      <table class="lesson-table">
        <thead>
          <tr>
            <th>Risk</th>
            <th>Consequence</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>No MFA on root</td>
            <td>One leaked password can expose the entire AWS account.</td>
          </tr>
          <tr>
            <td>Root used daily</td>
            <td>Every phishing or laptop compromise becomes much more dangerous.</td>
          </tr>
          <tr>
            <td>Root access keys exist</td>
            <td>A leaked key can hand complete AWS control to an attacker.</td>
          </tr>
          <tr>
            <td>No monitoring on root</td>
            <td>Abuse may stay invisible until the bill or damage becomes obvious.</td>
          </tr>
        </tbody>
      </table>
      <p>
        A common real-world failure mode is crypto mining abuse: attackers spin up huge numbers of
        EC2 or GPU instances and leave you with a catastrophic bill before anyone notices.
      </p>

      <h2>Sample in a Real Project</h2>
      <p>
        Imagine you are building a fintech app on AWS. The root account exists because the AWS account exists,
        but it should not become the account people casually sign into every day.
      </p>
      <ol>
        <li>Create the AWS account, then immediately secure the root identity.</li>
        <li>Enable <strong>MFA on root</strong> with an authenticator app or hardware key.</li>
        <li>Create an <strong>IAM admin user</strong> for normal work.</li>
        <li>Attach admin permissions to that IAM identity, not to root usage habits.</li>
        <li>Store the root password in a password manager with strict access control.</li>
        <li>Alert on root sign-ins so unusual activity is visible quickly.</li>
        <li>Use root only for rare account-level tasks or emergencies.</li>
      </ol>

      <h2>Funny Factory Story</h2>
      <p>
        At <strong>CloudFactory Inc.</strong>, the factory has one <strong>Master Key</strong> that unlocks
        every room: the vault, the machines, the boss's office, and everything else.
      </p>
      <p>
        Bob, the new intern, decided to use the Master Key every day because it felt convenient. Then he
        left his bag at a coffee shop. The next morning, a stranger had unlocked every room, repainted
        the walls, fired all the robots, ordered 10,000 rubber ducks on the company credit card, and
        locked everyone out.
      </p>

      <div class="story-chart" aria-label="Funny Factory Story diagram">
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--safe">Master Key</div>
          <div class="story-chart__label">Should stay in the safe</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box">Bob uses it daily</div>
          <div class="story-chart__label">Convenience over safety</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--danger">Bag lost at coffee shop</div>
          <div class="story-chart__label">Credential exposure</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box">Factory chaos</div>
          <div class="story-chart__label">Robots gone, ducks arrive</div>
        </div>
      </div>

      <p>
        The lesson is the same in AWS: the root account is the Master Key. Daily work should use
        a normal employee badge, meaning an IAM user or role. The Master Key should only come out
        for emergencies, with MFA protecting it.
      </p>

      <blockquote class="lesson-tip">
        <p>
          <strong>Exam tip:</strong> The secure answer is always the same pattern:
          enable MFA on root, do not use root for daily tasks, and delete root access keys.
        </p>
      </blockquote>
    `,
    isListed: false,
  },
  {
    id: 'iam-policy-documents',
    title: 'Use IAM Policy Documents to Control Access Rights',
    excerpt:
      'Placeholder lesson for explaining IAM policy document structure and permission logic.',
    date: '2026-05-15',
    readTime: 10,
    tags: ['IAM', 'Policies', 'Roadmap'],
    content: `
      <h2>Concept</h2>
      <p>
        An <strong>IAM policy document</strong> is a JSON document that defines who can do what to which
        resource in AWS. This is the main language AWS uses for access control.
      </p>
      <p>
        Every policy is really answering three questions:
      </p>
      <ul>
        <li><strong>Who?</strong> The principal, such as a user, role, or service.</li>
        <li><strong>What?</strong> The AWS actions being allowed or denied.</li>
        <li><strong>Which resource?</strong> The specific AWS resource identified by ARN.</li>
      </ul>

      <p>A basic policy document looks like this:</p>
      <pre><code>{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}</code></pre>

      <h2>Key Ideas</h2>
      <ul>
        <li><strong>Effect</strong> is either <code>Allow</code> or <code>Deny</code>.</li>
        <li><strong>Action</strong> defines the AWS API operations covered by the rule.</li>
        <li><strong>Resource</strong> limits the policy to specific objects, buckets, functions, or other services.</li>
        <li><strong>Explicit Deny always wins</strong>, even when another statement says allow.</li>
      </ul>

      <h2>Policy Types</h2>
      <table class="lesson-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Identity-based</td>
            <td>Attached to a user, group, or role.</td>
          </tr>
          <tr>
            <td>Resource-based</td>
            <td>Attached directly to a resource such as an S3 bucket.</td>
          </tr>
          <tr>
            <td>AWS Managed</td>
            <td>Prebuilt by AWS, such as <code>AdministratorAccess</code>.</td>
          </tr>
          <tr>
            <td>Customer Managed</td>
            <td>Written and controlled by your team.</td>
          </tr>
          <tr>
            <td>Inline</td>
            <td>Embedded inside one identity; usually harder to reuse and audit.</td>
          </tr>
        </tbody>
      </table>

      <h2>What Happens Without It?</h2>
      <table class="lesson-table">
        <thead>
          <tr>
            <th>Risk</th>
            <th>Consequence</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>No policies</td>
            <td>No meaningful access control model across users or workloads.</td>
          </tr>
          <tr>
            <td>Over-permissive policies</td>
            <td>One compromised identity can affect everything in the account.</td>
          </tr>
          <tr>
            <td>No explicit denies</td>
            <td>It becomes much harder to block especially sensitive actions.</td>
          </tr>
          <tr>
            <td>Inline policies everywhere</td>
            <td>Auditing and reusing permissions becomes painful very quickly.</td>
          </tr>
        </tbody>
      </table>
      <p>
        A single leaked developer identity with <code>"Action": "*", "Resource": "*"</code> can be enough
        to delete buckets, databases, and running instances across the account.
      </p>

      <h2>Sample in a Real Project</h2>
      <p>
        Imagine a backend API on AWS with a development team, a CI/CD pipeline, and an S3 bucket for file uploads.
        The goal is not to make one powerful policy. The goal is to give each actor exactly what it needs.
      </p>

      <p><strong>Developer team policy</strong>: can read logs but cannot touch production uploads.</p>
      <pre><code>{
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
}</code></pre>

      <p><strong>CI/CD role policy</strong>: can update one Lambda function and nothing else.</p>
      <pre><code>{
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
}</code></pre>

      <p>
        If the pipeline is compromised, the blast radius is still contained because the role only has the
        permissions needed for deployment.
      </p>

      <h2>Funny Factory Story</h2>
      <p>
        At <strong>CloudFactory Inc.</strong>, nobody had job boundaries. Every worker could walk into any room
        and press any button.
      </p>
      <p>
        Dave from accounting wandered into the machine room and pressed the big red button labeled
        <em>DO NOT PRESS</em>. Conveyor belts stopped, the inventory system vanished, and yet more rubber ducks
        were ordered.
      </p>

      <div class="story-chart" aria-label="Funny Factory Story diagram">
        <div class="story-chart__column">
          <div class="story-chart__box">No job boundaries</div>
          <div class="story-chart__label">Everyone can enter every room</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box">Dave presses the wrong button</div>
          <div class="story-chart__label">Too much permission for one person</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--danger">Factory chaos</div>
          <div class="story-chart__label">Systems stop, ducks multiply</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--safe">Access badges</div>
          <div class="story-chart__label">Each worker gets only the right room</div>
        </div>
      </div>

      <p>
        IAM policies are those access badges. Accountants should not operate production machines, developers
        should not need billing control, and automation should only have the permissions required for one job.
      </p>

      <blockquote class="lesson-tip">
        <p>
          <strong>Exam tip:</strong> Remember three rules: explicit deny always wins, the default is deny,
          and least privilege means specific actions on specific resources, not <code>*:*</code>.
        </p>
      </blockquote>
    `,
    isListed: false,
  },
  {
    id: 'iam-users-and-permanent-credentials',
    title: 'Managing IAM Users and AWS Resource Access',
    excerpt:
      'Placeholder lesson for managing IAM users, groups, and long-term credentials.',
    date: '2026-05-15',
    readTime: 10,
    tags: ['IAM', 'Users', 'Roadmap'],
    content: `
      <h2>Concept</h2>
      <p>
        <strong>IAM users</strong> are individual identities created inside your AWS account. Each user
        represents a person or application that needs to interact with AWS over time.
      </p>
      <p>
        AWS resource access is usually managed through a combination of users, groups, roles, and policies:
      </p>
      <ul>
        <li><strong>IAM Users</strong> for humans or apps with long-term credentials.</li>
        <li><strong>IAM Groups</strong> for collections of users with shared permissions.</li>
        <li><strong>IAM Roles</strong> for temporary access assumed by users, services, or applications.</li>
        <li><strong>IAM Policies</strong> for the actual permission rules attached to those identities.</li>
      </ul>

      <pre><code>IAM User -> belongs to -> IAM Group -> has attached -> IAM Policy
IAM User -> can assume -> IAM Role -> has attached -> IAM Policy
AWS Service -> assumes -> IAM Role -> to access -> AWS Resource</code></pre>

      <h2>Key Rules</h2>
      <ul>
        <li><strong>One user equals one person</strong>; never share credentials.</li>
        <li><strong>Assign permissions through groups</strong> instead of attaching everything directly to users.</li>
        <li><strong>Use roles for AWS services</strong> like EC2 or Lambda instead of embedding access keys in code.</li>
        <li><strong>Follow least privilege</strong> by granting only what is actually needed.</li>
      </ul>

      <h2>What Happens Without It?</h2>
      <table class="lesson-table">
        <thead>
          <tr>
            <th>Risk</th>
            <th>Consequence</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Sharing IAM users</td>
            <td>You lose accountability because many people appear as one identity.</td>
          </tr>
          <tr>
            <td>No groups, only direct policies</td>
            <td>Permission management becomes inconsistent and hard to scale.</td>
          </tr>
          <tr>
            <td>Access keys in code</td>
            <td>A public leak can become an immediate breach.</td>
          </tr>
          <tr>
            <td>Using root instead of IAM users</td>
            <td>The most powerful identity is exposed during ordinary daily work.</td>
          </tr>
          <tr>
            <td>No roles for EC2 or Lambda</td>
            <td>Applications end up depending on hardcoded credentials.</td>
          </tr>
        </tbody>
      </table>
      <p>
        A very common real-world mistake is hardcoding an AWS access key into frontend or application code,
        pushing it to GitHub, and watching bots discover it within minutes.
      </p>

      <h2>Sample in a Real Project</h2>
      <p>
        Imagine a startup with several developers, one DevOps engineer, one data analyst, and a Lambda
        function that reads files from S3.
      </p>

      <p><strong>Step 1: Create groups with policies</strong></p>
      <pre><code>Group: Developers      -> Policy: PowerUserAccess (no IAM)
Group: DevOps          -> Policy: AdministratorAccess
Group: DataAnalysts    -> Policy: AmazonAthenaFullAccess + S3 read-only</code></pre>

      <p><strong>Step 2: Create users and assign them to groups</strong></p>
      <pre><code>alice -> Developers
bob   -> Developers
carol -> DevOps
dave  -> DataAnalysts</code></pre>

      <p><strong>Step 3: Create a role for Lambda, not a user</strong></p>
      <pre><code>{
  "Effect": "Allow",
  "Action": ["s3:GetObject"],
  "Resource": "arn:aws:s3:::data-bucket/*"
}</code></pre>
      <p>
        Lambda assumes this role automatically, which means there are no hardcoded keys to rotate or leak.
      </p>

      <p><strong>Step 4:</strong> Enable MFA for all human users.</p>
      <p><strong>Step 5:</strong> Rotate access keys regularly, or better, replace them with roles where possible.</p>

      <h2>Funny Factory Story</h2>
      <p>
        At <strong>CloudFactory Inc.</strong>, everyone shared one worker badge named
        <strong> admin@factory.com</strong>.
      </p>
      <p>
        Alice used it to check reports. Bob used it to fix machines. Dave used it to order supplies.
        Then one day somebody ordered 10,000 more rubber ducks, and the logs simply said
        <em> admin </em> again and again.
      </p>

      <div class="story-chart" aria-label="Funny Factory Story diagram">
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--danger">One shared badge</div>
          <div class="story-chart__label">Everyone acts as the same identity</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box">No clear audit trail</div>
          <div class="story-chart__label">Nobody knows who did what</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box">Duck order appears</div>
          <div class="story-chart__label">Still no accountable person</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--safe">Named badges + robot passes</div>
          <div class="story-chart__label">Users for people, roles for machines</div>
        </div>
      </div>

      <p>
        The fix is the IAM model itself: every human gets a named badge, people are grouped by job,
        and factory robots get temporary robot passes instead of human credentials.
      </p>

      <blockquote class="lesson-tip">
        <p>
          <strong>Exam tip:</strong> IAM users are for humans with long-term credentials, roles are for
          services or temporary access, groups cannot be nested, and one IAM user can belong to multiple groups.
        </p>
      </blockquote>
    `,
    isListed: false,
  },
  {
    id: 'iam-policy-management-part-1',
    title: 'Practice Policy Management, Users, and Groups - Part 1',
    excerpt:
      'Hands-on exercise: create IAM groups with managed policies, add users to those groups, and verify the permission boundaries hold.',
    date: '2026-05-15',
    readTime: 12,
    tags: ['IAM', 'Practice', 'Roadmap'],
    content: `
      <h2>What You'll Practice</h2>
      <p>
        You just joined a startup as the AWS admin. Your first task: set up the team from scratch —
        create groups with the right policies, add users to those groups, then verify the permissions hold.
      </p>

      <h2>Exercise 1.1 — Create IAM Groups</h2>
      <p>Create three groups and attach the appropriate managed policies to each.</p>
      <table>
        <thead>
          <tr><th>Group</th><th>Attached Policies</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>dev-team</code></td>
            <td><code>AmazonEC2FullAccess</code> + <code>AmazonS3ReadOnlyAccess</code></td>
          </tr>
          <tr>
            <td><code>data-team</code></td>
            <td><code>AmazonAthenaFullAccess</code> + <code>AmazonS3ReadOnlyAccess</code></td>
          </tr>
          <tr>
            <td><code>ops-team</code></td>
            <td><code>AdministratorAccess</code></td>
          </tr>
        </tbody>
      </table>
      <pre><code>IAM → User Groups → Create Group
→ Group name: dev-team
→ Attach policy: AmazonEC2FullAccess
→ Attach policy: AmazonS3ReadOnlyAccess
→ Create Group

Repeat for data-team and ops-team.</code></pre>

      <h2>Exercise 1.2 — Create IAM Users</h2>
      <p>Create four users and assign each to the right group.</p>
      <table>
        <thead>
          <tr><th>Username</th><th>Group</th><th>MFA</th></tr>
        </thead>
        <tbody>
          <tr><td><code>alice</code></td><td><code>dev-team</code></td><td>Required</td></tr>
          <tr><td><code>bob</code></td><td><code>dev-team</code></td><td>Required</td></tr>
          <tr><td><code>carol</code></td><td><code>data-team</code></td><td>Required</td></tr>
          <tr><td><code>dave</code></td><td><code>ops-team</code></td><td>Required</td></tr>
        </tbody>
      </table>
      <pre><code>IAM → Users → Create User
→ Username: alice
→ Access type: AWS Management Console
→ Add to group: dev-team
→ Require MFA: Yes</code></pre>

      <h2>Exercise 1.3 — Verify Permissions</h2>
      <p>Sign in as <code>alice</code> and confirm the boundaries hold:</p>
      <ul>
        <li>Can she list EC2 instances? <strong>Yes</strong> — EC2 full access via <code>dev-team</code>.</li>
        <li>Can she read from S3? <strong>Yes</strong> — S3 read-only via <code>dev-team</code>.</li>
        <li>Can she create an S3 bucket? <strong>No</strong> — read-only policy blocks writes.</li>
        <li>Can she access IAM? <strong>No</strong> — no IAM policy attached to <code>dev-team</code>.</li>
      </ul>
      <p>Expected: Alice can view EC2 and read S3. Nothing more.</p>

      <h2>Funny Factory Story</h2>
      <p>
        At <strong>CloudFactory Inc.</strong>, there was no such thing as "your department's door."
        Everyone had the same keycard. Alice the dev, Bob the dev, Carol the analyst, Dave the ops lead —
        all four walked into any room they wanted. The rubber duck stockroom. The payroll vault. The server bay.
      </p>
      <p>
        Then one morning, someone had allocated 40 GPU instances overnight. The audit log showed:
        <em>"alice"</em>. Alice was on holiday. She hadn't touched a computer in five days.
        Turns out someone found her keycard — which opened everything — and had a productive evening.
      </p>
      <p>
        Dave called the factory to a halt. By end of day, every worker had a department badge.
      </p>

      <div class="perm-chart" aria-label="CloudFactory department badge system">
        <div class="perm-chart__title">CloudFactory Inc. — New Badge System</div>
        <div class="perm-chart__org">
          <div class="perm-chart__group">
            <div class="perm-chart__group-name">dev-team</div>
            <div class="perm-chart__policies">EC2 Full · S3 Read Only</div>
            <div class="perm-chart__users">
              <span class="perm-chart__user">alice</span>
              <span class="perm-chart__user">bob</span>
            </div>
          </div>
          <div class="perm-chart__group">
            <div class="perm-chart__group-name">data-team</div>
            <div class="perm-chart__policies">Athena Full · S3 Read Only</div>
            <div class="perm-chart__users">
              <span class="perm-chart__user">carol</span>
            </div>
          </div>
          <div class="perm-chart__group">
            <div class="perm-chart__group-name">ops-team</div>
            <div class="perm-chart__policies">Administrator Access</div>
            <div class="perm-chart__users">
              <span class="perm-chart__user">dave</span>
            </div>
          </div>
        </div>
      </div>

      <p>
        The next incident took eleven seconds to resolve. Someone in <code>dev-team</code> had tried to access IAM.
        Access denied. Badge logged. Carol from data-team had tried to launch an EC2 instance.
        Access denied. Badge logged. The rubber duck stockroom stayed untouched.
      </p>

      <blockquote class="lesson-tip">
        <p>
          <strong>Key rule:</strong> Attach permissions to groups, never directly to users.
          When Alice moves to data-team, change her group — not seventeen individual policies.
          That's the difference between a scalable system and a permission spreadsheet nobody trusts.
        </p>
      </blockquote>
    `,
    isListed: false,
  },
  {
    id: 'iam-policy-management-part-2',
    title: 'Practice Policy Management, Users, and Groups - Part 2',
    excerpt:
      'Write three Customer Managed Policies that replace overly broad managed policies with least-privilege access scoped to exactly what each team needs.',
    date: '2026-05-15',
    readTime: 12,
    tags: ['IAM', 'Practice', 'Roadmap'],
    content: `
      <h2>What You'll Practice</h2>
      <p>
        AWS managed policies are a good starting point, but they're almost always too broad for real workloads.
        In this part you'll write three Customer Managed Policies that follow the principle of least privilege.
      </p>

      <h2>Exercise 2.1 — S3 Read-Only for a Specific Bucket</h2>
      <p>
        The <code>data-team</code> currently has <code>AmazonS3ReadOnlyAccess</code>, which grants read access
        to <em>every</em> S3 bucket in the account. Replace it with a policy scoped to
        <code>analytics-data-bucket</code> only.
      </p>
      <pre><code>{
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
}</code></pre>
      <p>
        Create as a <strong>Customer Managed Policy</strong> named <code>DataTeam-S3-ReadOnly</code>,
        attach to the <code>data-team</code> group, then remove <code>AmazonS3ReadOnlyAccess</code>.
      </p>

      <h2>Exercise 2.2 — EC2 Start/Stop, No Terminate</h2>
      <p>
        Developers need to start and stop instances — but a mistaken termination wipes the instance permanently.
        Replace <code>AmazonEC2FullAccess</code> with a policy that explicitly denies terminate.
      </p>
      <pre><code>{
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
}</code></pre>
      <p>
        Name it <code>DevTeam-EC2-NoTerminate</code>, attach to <code>dev-team</code>,
        remove <code>AmazonEC2FullAccess</code>.
      </p>

      <h2>Exercise 2.3 — Self-Service MFA</h2>
      <p>
        Every user should be able to enroll their own MFA device — but nothing else in IAM.
        Attach this policy to all three groups.
      </p>
      <pre><code>{
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
      "Resource": "arn:aws:iam::*:user/\${aws:username}"
    }
  ]
}</code></pre>
      <p>
        Name it <code>AllUsers-SelfMFA</code>. Attach to <code>dev-team</code>,
        <code>data-team</code>, and <code>ops-team</code>.
      </p>

      <h2>Funny Factory Story</h2>
      <p>
        The department badge system was working. But three weeks in, Carol wandered into the wrong room.
      </p>
      <p>
        Her badge said <strong>AmazonS3ReadOnlyAccess</strong>. It opened every S3 room in the building —
        the analytics room, the finance room, the audit archive, the rubber duck procurement room.
        AWS managed badges are written that way: read-only, yes, but across everything.
      </p>
      <p>
        Nobody noticed Carol had been reading the payroll bucket until the compliance scan caught it.
        Dave the admin sighed and rewrote the badge from scratch.
      </p>

      <div class="story-chart" aria-label="Least-privilege policy upgrade">
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--safe">Managed badge<br/>AmazonS3ReadOnly<br/>(all buckets)</div>
          <div class="story-chart__label">Too broad — opens every room</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--danger">Carol reads<br/>payroll-bucket</div>
          <div class="story-chart__label">Compliance flag raised</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box">Custom policy written<br/>DataTeam-S3-ReadOnly</div>
          <div class="story-chart__label">Scoped to one bucket</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--safe">analytics-data-bucket<br/>only. Every other<br/>door stays shut.</div>
          <div class="story-chart__label">Least privilege achieved</div>
        </div>
      </div>

      <p>
        The new badge was etched with precision: <code>analytics-data-bucket</code> only.
        Carol could still do her job. The payroll room stayed closed.
        Nobody worried about the compliance scan again.
      </p>

      <blockquote class="lesson-tip">
        <p>
          <strong>Key rule:</strong> AWS managed policies are a starting point, not a final answer.
          Use Customer Managed Policies to scope access to exactly the resources and actions each team needs.
          An explicit <strong>Deny</strong> always wins over any number of Allows — use it deliberately,
          not accidentally.
        </p>
      </blockquote>
    `,
    isListed: false,
  },
  {
    id: 'iam-policy-management-part-3',
    title: 'Practice Policy Management, Users, and Groups - Part 3',
    excerpt:
      'Use the IAM Policy Simulator to pre-test access, the Access Analyzer to find exposure, and a structured debugging process to fix a broken permission.',
    date: '2026-05-15',
    readTime: 12,
    tags: ['IAM', 'Practice', 'Roadmap'],
    content: `
      <h2>What You'll Practice</h2>
      <p>
        Policies are in place. Now something breaks. In this part you'll use the IAM Policy Simulator
        to pre-test access, the Access Analyzer to find unintended exposure, and a structured debugging
        process to trace and fix a real permission problem.
      </p>

      <h2>Exercise 3.1 — IAM Policy Simulator</h2>
      <p>Test policies before they reach production. Confirm expected Allow and Deny outcomes for each user.</p>
      <pre><code>AWS Console → IAM → Policy Simulator
→ Select User: alice
→ Service: S3
→ Action: DeleteBucket
→ Run Simulation
→ Expected result: DENIED</code></pre>
      <table>
        <thead>
          <tr><th>User</th><th>Action</th><th>Expected</th></tr>
        </thead>
        <tbody>
          <tr><td><code>alice</code></td><td><code>ec2:TerminateInstances</code></td><td>Deny</td></tr>
          <tr><td><code>alice</code></td><td><code>ec2:StopInstances</code></td><td>Allow</td></tr>
          <tr><td><code>carol</code></td><td><code>s3:GetObject</code> on <code>analytics-data-bucket</code></td><td>Allow</td></tr>
          <tr><td><code>carol</code></td><td><code>s3:GetObject</code> on <code>prod-bucket</code></td><td>Deny</td></tr>
          <tr><td><code>dave</code></td><td><code>iam:CreateUser</code></td><td>Allow</td></tr>
        </tbody>
      </table>

      <h2>Exercise 3.2 — IAM Access Analyzer</h2>
      <p>Find overly permissive or unused access before it becomes an incident.</p>
      <pre><code>IAM → Access Analyzer → Create Analyzer
→ Analyzer name: startup-analyzer
→ Zone of trust: Current account
→ Create

Review findings:
- Any public S3 bucket policies?
- Any cross-account role trust issues?
- Any unused access keys older than 90 days?</code></pre>

      <h2>Exercise 3.3 — Troubleshoot a Broken Permission</h2>
      <p>Bob from <code>dev-team</code> reports he can't list EC2 instances. Walk through the fix.</p>
      <pre><code>Step 1 → IAM → Users → bob → Permissions tab
         Check which policies are attached (via group or direct)

Step 2 → IAM → Policy Simulator → select bob
         Test ec2:DescribeInstances
         Look for an explicit Deny overriding Allow

Step 3 → IAM → Users → bob → Groups tab
         Confirm bob is still in dev-team

Step 4 → Open the custom policy
         Check for typos in Action name or Resource ARN

Step 5 → Fix, re-simulate → confirm Allow</code></pre>
      <p>Common culprits:</p>
      <ul>
        <li>Typo in action name — <code>ec2:DescribeInstance</code> vs <code>ec2:DescribeInstances</code></li>
        <li>Wrong ARN region or account ID in Resource</li>
        <li>An explicit <strong>Deny</strong> somewhere overriding the Allow</li>
        <li>User removed from group accidentally</li>
      </ul>

      <h2>Funny Factory Story</h2>
      <p>
        Three months after the new badge system rolled out, Bob filed a complaint:
        <em>"My badge won't open the EC2 room. I've been climbing through the window for a week."</em>
      </p>
      <p>
        Dave pulled up the Policy Simulator — the digital test lock on every door. He loaded Bob's badge,
        selected the EC2 room, ran the test: <strong>DENIED</strong>.
      </p>
      <p>
        But Bob was in <code>dev-team</code>. dev-team had <code>DevTeam-EC2-NoTerminate</code>.
        That policy listed <code>ec2:DescribeInstances</code>. The simulator shouldn't say denied.
      </p>
      <p>
        Dave read the policy JSON one character at a time.
        Line 9: <code>"ec2:DescribeInstance"</code>. No trailing <em>s</em>.
        Seven months of policy management, broken by one missing letter.
      </p>

      <div class="story-chart" aria-label="Permission debugging flow">
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--danger">Bob: access denied<br/>EC2 room locked</div>
          <div class="story-chart__label">User reports broken access</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box">Policy Simulator<br/>test: DENIED</div>
          <div class="story-chart__label">Problem reproduced</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--danger">Typo found<br/>DescribeInstance<br/>(missing s)</div>
          <div class="story-chart__label">Root cause isolated</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--safe">Fix applied<br/>Simulator: ALLOW<br/>Bob stops climbing</div>
          <div class="story-chart__label">Verified and resolved</div>
        </div>
      </div>

      <p>
        The fix took forty seconds. Dave added a rule: every custom policy gets simulator-tested
        before deployment. Bob was grateful. The window frame was not.
      </p>

      <blockquote class="lesson-tip">
        <p>
          <strong>Exam tips across all 3 parts:</strong> An explicit <strong>Deny always wins</strong>,
          even if ten other policies Allow the action. Use the <strong>Policy Simulator</strong> to test
          before any policy goes live. <strong>Access Analyzer</strong> finds unintended public or
          cross-account exposure. Always test with the actual user identity — not just the policy document
          in isolation.
        </p>
      </blockquote>
    `,
    isListed: false,
  },
  {
    id: 'iam-assume-roles-part-1',
    title: 'Practice Creating and Assuming Roles - Part 1',
    excerpt:
      'IAM Roles issue temporary credentials instead of permanent ones. Learn the trust model, how STS works, and why roles are always preferred over access keys for AWS services.',
    date: '2026-05-15',
    readTime: 10,
    tags: ['IAM', 'Roles', 'Roadmap'],
    content: `
      <h2>Concept</h2>
      <p>
        An <strong>IAM Role</strong> is an AWS identity with permissions — but unlike a user, it has
        <strong>no permanent credentials</strong>. Instead, it issues <strong>temporary security
        credentials</strong> when assumed.
      </p>
      <p>Roles are used when:</p>
      <ul>
        <li>An AWS service (EC2, Lambda) needs to call other AWS services</li>
        <li>A user from another AWS account needs access (cross-account)</li>
        <li>A federated user (Google, Active Directory) logs into AWS</li>
        <li>You want to temporarily elevate a user's permissions</li>
      </ul>
      <p><strong>How assuming a role works:</strong></p>
      <pre><code>Entity (User / Service / App)
    → calls sts:AssumeRole
    → AWS STS issues temporary credentials
        (AccessKeyId + SecretAccessKey + SessionToken)
    → Entity uses credentials to access resources
    → Credentials expire (15 min → 12 hrs)</code></pre>

      <table class="lesson-table">
        <thead>
          <tr><th>Component</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>Trust Policy</td><td>WHO can assume this role</td></tr>
          <tr><td>Permission Policy</td><td>WHAT the role can do</td></tr>
          <tr><td>Session Duration</td><td>HOW LONG the credentials last</td></tr>
        </tbody>
      </table>

      <h2>What Happens Without It?</h2>
      <table class="lesson-table">
        <thead>
          <tr><th>Risk</th><th>Consequence</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>No roles for EC2/Lambda</td>
            <td>Must hardcode access keys in code or config</td>
          </tr>
          <tr>
            <td>No cross-account roles</td>
            <td>Must create IAM users in every account</td>
          </tr>
          <tr>
            <td>No role expiry</td>
            <td>Compromised credentials live forever</td>
          </tr>
          <tr>
            <td>Using users for services</td>
            <td>Rotating keys manually = operational nightmare</td>
          </tr>
        </tbody>
      </table>
      <blockquote class="lesson-tip">
        <p>
          Real damage: Lambda with hardcoded keys → dev leaks <code>.env</code> to GitHub → attacker
          has <strong>permanent credentials</strong> until someone notices. With roles, credentials
          expire in 1 hour automatically.
        </p>
      </blockquote>

      <h2>Sample in a Real Project</h2>
      <p><strong>Scenario:</strong> An EC2 instance needs to read from S3 and write logs to CloudWatch.</p>

      <p><strong>Step 1 — Create the Role:</strong></p>
      <pre><code>IAM → Roles → Create Role
→ Trusted entity: AWS Service → EC2
→ Attach policy: AmazonS3ReadOnlyAccess
→ Attach policy: CloudWatchLogsFullAccess
→ Role name: ec2-app-role</code></pre>

      <p><strong>Step 2 — Trust Policy (auto-generated):</strong></p>
      <pre><code>{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ec2.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}</code></pre>

      <p><strong>Step 3 — Attach role to EC2 instance:</strong></p>
      <pre><code>EC2 → Instances → Select instance
→ Actions → Security → Modify IAM Role
→ Select: ec2-app-role → Save</code></pre>

      <p>
        <strong>Result:</strong> EC2 app calls S3 and CloudWatch with zero hardcoded credentials.
        AWS rotates tokens automatically.
      </p>

      <h2>Funny Factory Story</h2>
      <p>
        At <strong>CloudFactory Inc.</strong>, the delivery robot needed to enter the warehouse to pick
        up boxes. But it had no permanent badge — robots aren't trusted with permanent access.
      </p>
      <p>
        So the boss set up a <strong>Temp Pass Kiosk</strong> (AWS STS). Every morning, the robot
        walks up, scans its ID, and gets a pass valid for 1 hour. It enters the warehouse, grabs the
        boxes, delivers them, and the pass expires.
      </p>
      <p>
        Dave tried to steal the robot's pass once. He waited 47 minutes to use it. It had already
        expired. Dave went back to the rubber duck liquidation team. 🦆
      </p>

      <div class="story-chart" aria-label="IAM Role assumption flow — CloudFactory">
        <div class="story-chart__column">
          <div class="story-chart__box">🤖 Robot<br/>(Entity)</div>
          <div class="story-chart__label">calls sts:AssumeRole</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--safe">🎫 Temp Pass Kiosk<br/>(AWS STS)</div>
          <div class="story-chart__label">issues 1-hour credentials</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--safe">🏭 Warehouse<br/>(AWS Resource)</div>
          <div class="story-chart__label">access granted ✅</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--danger">😈 Dave<br/>(Attacker)</div>
          <div class="story-chart__label">pass expired — denied ❌</div>
        </div>
      </div>

      <p>
        The robot never had a permanent badge. It never needed one. That's the beauty of IAM Roles.
      </p>

      <blockquote class="lesson-tip">
        <p>
          <strong>Exam tip (SAA-C03):</strong> Roles = temporary credentials via STS — always prefer
          over access keys for services. Trust Policy = who can assume; Permission Policy = what it
          can do. Cross-account access uses roles, not duplicate IAM users. SCP Deny always wins over
          IAM role permissions. To revoke leaked STS credentials → use <code>aws:TokenIssueTime</code>
          condition deny.
        </p>
      </blockquote>
    `,
    isListed: false,
  },
  {
    id: 'iam-assume-roles-part-2',
    title: 'Practice Creating and Assuming Roles - Part 2',
    excerpt:
      'Hands-on creation of service roles, cross-account roles, and console role switching — with CLI commands, trust policy patterns, and the 1-hour role-chaining cap.',
    date: '2026-05-15',
    readTime: 10,
    tags: ['IAM', 'Roles', 'Roadmap'],
    content: `
      <h2>Concept</h2>
      <p>
        Part 2 goes hands-on — creating roles for real scenarios: <strong>service roles,
        cross-account roles, and role switching</strong> via the AWS Console and CLI.
      </p>
      <p>Three core patterns you must know:</p>
      <pre><code>Pattern 1: Service Role
EC2 / Lambda → assumes role → accesses AWS resources

Pattern 2: Cross-Account Role
Account A User → sts:AssumeRole → Role in Account B → accesses Account B resources

Pattern 3: Role Switching (Console)
IAM User → Switch Role → elevated/scoped access in target account</code></pre>

      <p><strong>Key CLI commands:</strong></p>
      <pre><code># Assume a role and receive temp credentials
aws sts assume-role \\
  --role-arn arn:aws:iam::123456789012:role/my-role \\
  --role-session-name my-session

# Verify which identity is currently active
aws sts get-caller-identity

# Export temp credentials for use in the shell
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_SESSION_TOKEN=...</code></pre>

      <h2>What Happens Without It?</h2>
      <table class="lesson-table">
        <thead>
          <tr><th>Risk</th><th>Consequence</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>No service role pattern</td>
            <td>Devs hardcode keys into EC2/Lambda — keys leak</td>
          </tr>
          <tr>
            <td>No cross-account roles</td>
            <td>IAM users in every account → sprawl, no audit trail</td>
          </tr>
          <tr>
            <td>No role switching</td>
            <td>Admins use high-privilege accounts daily → large blast radius</td>
          </tr>
          <tr>
            <td>No session naming</td>
            <td>Can't trace which session did what in CloudTrail</td>
          </tr>
        </tbody>
      </table>
      <blockquote class="lesson-tip">
        <p>
          Real damage: A team managing 5 accounts creates an IAM user in each one for every
          developer — 20 devs × 5 accounts = <strong>100 credential sets</strong> to rotate, audit,
          and eventually forget. One stale account gets compromised 8 months later.
        </p>
      </blockquote>

      <h2>Sample in a Real Project</h2>
      <p>
        <strong>Scenario:</strong> A DevOps team manages 3 accounts — <code>dev</code>,
        <code>staging</code>, <code>prod</code>. Devs work in <code>dev</code> daily, but a senior
        engineer can switch into <code>prod</code> for deployments.
      </p>

      <p><strong>Step 1 — Create deployment role in the prod account:</strong></p>
      <pre><code>IAM → Roles → Create Role
→ Trusted entity: Another AWS account
→ Account ID: [dev account ID]
→ Attach policy: PowerUserAccess
→ Role name: prod-deploy-role
→ Add condition: MFA required</code></pre>

      <p><strong>Trust Policy for prod-deploy-role:</strong></p>
      <pre><code>{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "AWS": "arn:aws:iam::DEV_ACCOUNT_ID:root"
    },
    "Action": "sts:AssumeRole",
    "Condition": {
      "Bool": { "aws:MultiFactorAuthPresent": "true" }
    }
  }]
}</code></pre>

      <p><strong>Step 2 — Grant the engineer permission to assume it (in dev account):</strong></p>
      <pre><code>{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "sts:AssumeRole",
    "Resource": "arn:aws:iam::PROD_ACCOUNT_ID:role/prod-deploy-role"
  }]
}</code></pre>

      <p><strong>Step 3 — Engineer switches role in the console:</strong></p>
      <pre><code>Top-right menu → Switch Role
→ Account: PROD_ACCOUNT_ID
→ Role: prod-deploy-role
→ Display name: PROD (red)
→ Switch Role</code></pre>

      <p>
        <strong>Result:</strong> Engineer works in <code>dev</code> all day. Switches to
        <code>prod</code> only for deployments — MFA enforced, session logged in CloudTrail,
        auto-expires in 1 hour.
      </p>

      <h2>Funny Factory Story</h2>
      <p>
        <strong>CloudFactory Inc.</strong> now runs 3 buildings — Dev, Staging, and Prod.
      </p>
      <p>
        Junior workers live in the Dev building all day. But one day, Dave wandered into the Prod
        building, pressed a button, and deployed half-finished rubber duck firmware to 50,000
        customers. The ducks quacked in Morse code. Nobody ordered that feature.
      </p>
      <p>
        The boss introduced <strong>Role Switching Passes</strong>: junior workers stay in Dev,
        senior engineers get a Switch Pass only after scanning their MFA fob at the door. The pass
        lasts 1 hour, logs their name in the CloudTrail ledger, and self-destructs after use.
      </p>
      <p>
        Dave applied for a Switch Pass. He was denied. He remains in Dev, surrounded by ducks that
        now say "SOS" in Morse code. 🦆📟
      </p>

      <div class="story-chart" aria-label="Role switching flow — CloudFactory">
        <div class="story-chart__column">
          <div class="story-chart__box">🧑‍💼 Senior Engineer<br/>(Dev Account)</div>
          <div class="story-chart__label">normal daily work</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--safe">🔐 MFA Fob<br/>(STS Kiosk)</div>
          <div class="story-chart__label">identity verified ✅</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--safe">🎫 1-Hour Switch Pass<br/>(temp credentials)</div>
          <div class="story-chart__label">logged in CloudTrail</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box">🏭 Prod Account<br/>PowerUserAccess</div>
          <div class="story-chart__label">session expires in 1 hr</div>
        </div>
      </div>

      <div class="story-chart" aria-label="Dave denied">
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--danger">😈 Dave<br/>(Dev Account)</div>
          <div class="story-chart__label">requests Switch Pass</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--danger">🚫 Denied<br/>(not in Trust Policy)</div>
          <div class="story-chart__label">no credentials issued</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box">🦆📟 Dev Building<br/>SOS ducks</div>
          <div class="story-chart__label">Dave stays put</div>
        </div>
      </div>

      <blockquote class="lesson-tip">
        <p>
          <strong>Exam tips — Part 2:</strong> Switch Role suspends your user session — permissions
          never combine. Both sides must agree for cross-account access. All 3 STS values are
          required: AccessKeyId + SecretAccessKey + SessionToken. IMDS at 169.254.169.254 is how
          EC2 gets credentials automatically. Role chaining hard cap = 1 hour, non-configurable.
          Removing an OIDC provider stops new sessions but does not revoke active ones.
        </p>
      </blockquote>
    `,
    isListed: false,
  },
  {
    id: 'iam-assume-roles-part-3',
    title: 'Practice Creating and Assuming Roles - Part 3',
    excerpt:
      'Advanced role patterns for production: web identity federation, SAML SSO, permission boundaries, and the correct incident response sequence for a compromised role.',
    date: '2026-05-15',
    readTime: 12,
    tags: ['IAM', 'Roles', 'Roadmap'],
    content: `
      <h2>Concept</h2>
      <p>
        Part 3 is the final chapter — <strong>advanced role patterns</strong> used in production:
        federated access, permission boundaries, role chaining strategies, and incident response
        for compromised roles.
      </p>

      <pre><code>Pattern 1: Web Identity Federation
User (Google/Facebook) → OIDC Provider → sts:AssumeRoleWithWebIdentity → AWS Resources

Pattern 2: SAML Federation
Corporate AD User → SAML IdP → sts:AssumeRoleWithSAML → AWS Console/API

Pattern 3: Permission Boundary
Effective Permissions = IAM Policy ∩ Permission Boundary

Pattern 4: Incident Response
Leaked role creds → Deny policy + aws:TokenIssueTime → Full revocation</code></pre>

      <table class="lesson-table">
        <thead>
          <tr><th></th><th>SCP</th><th>Permission Boundary</th></tr>
        </thead>
        <tbody>
          <tr><td>Scope</td><td>Entire AWS account</td><td>Single IAM user or role</td></tr>
          <tr><td>Set by</td><td>Org management account</td><td>IAM admin in same account</td></tr>
          <tr><td>Purpose</td><td>Account-level guardrail</td><td>Delegate admin safely</td></tr>
        </tbody>
      </table>

      <h2>What Happens Without It?</h2>
      <table class="lesson-table">
        <thead>
          <tr><th>Risk</th><th>Consequence</th></tr>
        </thead>
        <tbody>
          <tr><td>No federation</td><td>Every contractor needs a permanent IAM user</td></tr>
          <tr><td>No permission boundaries</td><td>Delegated admins can create roles more powerful than themselves</td></tr>
          <tr><td>No incident response plan</td><td>Leaked role creds stay active until natural expiry</td></tr>
          <tr><td>No SAML/SSO</td><td>100-person company = 100 IAM users to manage manually</td></tr>
        </tbody>
      </table>
      <blockquote class="lesson-tip">
        <p>
          Real damage: A junior admin is delegated IAM permissions with no permission boundary.
          They create a role with <code>AdministratorAccess</code> and use it to bypass all
          restrictions. Classic privilege escalation — a boundary would have made that impossible.
        </p>
      </blockquote>

      <h2>Sample in a Real Project</h2>

      <p><strong>Scenario 1 — Web Identity Federation for a mobile app:</strong></p>
      <pre><code>{
  "Principal": { "Federated": "cognito-identity.amazonaws.com" },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringEquals": {
      "cognito-identity.amazonaws.com:aud": "us-east-1:abc-pool-id"
    }
  }
}</code></pre>
      <p>
        Mobile user logs in via Google → Cognito exchanges token → Role issued → User accesses only
        their own S3 prefix. No IAM user is created.
      </p>

      <p><strong>Scenario 2 — Permission Boundary for delegated admin:</strong></p>
      <pre><code>{
  "Effect": "Allow",
  "Action": ["s3:*", "ec2:*", "cloudwatch:*"],
  "Resource": "*"
}</code></pre>
      <p>
        Attach as Permission Boundary to the junior admin's role. They can create any IAM role —
        but those roles can never exceed S3, EC2, and CloudWatch. Privilege escalation blocked.
      </p>

      <p><strong>Scenario 3 — Incident response for a leaked role:</strong></p>
      <pre><code>{
  "Effect": "Deny",
  "Action": "*",
  "Resource": "*",
  "Condition": {
    "DateLessThan": {
      "aws:TokenIssueTime": "2026-05-17T10:30:00Z"
    }
  }
}</code></pre>
      <p>
        Attach inline to the role → all sessions issued before 10:30 AM are dead instantly. Then
        audit CloudTrail by session name for attacker activity.
      </p>

      <h2>Funny Factory Story</h2>
      <p>
        <strong>CloudFactory Inc.</strong> hired a consultant, 3 Google contractors, and a partner
        company — none of them get permanent badges.
      </p>
      <p>
        The Google contractors log in with their Google accounts. A <strong>Temp Kiosk</strong>
        (Cognito + OIDC) checks their Google ID and prints a 1-hour badge that only opens their
        assigned room. The partner company sends a signed note from their HR system (SAML IdP):
        "These 5 people are verified engineers." The factory hands them badges — no new accounts
        created.
      </p>
      <p>
        Then Dave (now a "junior admin") was given keys to make new badges. He tried to make himself
        a Master Key. But the boss had installed a <strong>Permission Boundary</strong> — Dave's
        badge machine was physically incapable of printing Master Keys. It just beeped sadly.
      </p>
      <p>
        One day a contractor lost their badge. The boss ran the <strong>TokenIssueTime
        revocation</strong> — every badge issued before 10:30 AM stopped working immediately.
        The lost badge beeped red. Dave's self-made badge also beeped red. Nobody was surprised.
        🦆🔐
      </p>

      <div class="story-chart" aria-label="Web Identity Federation flow">
        <div class="story-chart__column">
          <div class="story-chart__box">👷 Google Contractor<br/>(external user)</div>
          <div class="story-chart__label">logs in with Google</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--safe">🎫 OIDC Kiosk<br/>(Cognito / STS)</div>
          <div class="story-chart__label">AssumeRoleWithWebIdentity ✅</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--safe">🏭 Assigned Room<br/>(scoped AWS resource)</div>
          <div class="story-chart__label">1-hour badge — no IAM user</div>
        </div>
      </div>

      <div class="story-chart" aria-label="Permission Boundary blocks Dave">
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--danger">😈 Dave<br/>(Junior Admin)</div>
          <div class="story-chart__label">tries to print Master Key</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--danger">🔒 Permission Boundary<br/>(S3 + EC2 only)</div>
          <div class="story-chart__label">❌ BEEP — intersection caps it</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box">New role effective permissions:<br/>S3 + EC2 only</div>
          <div class="story-chart__label">AdministratorAccess = irrelevant</div>
        </div>
      </div>

      <div class="story-chart" aria-label="TokenIssueTime revocation">
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--danger">🚨 Leaked badge<br/>(active session)</div>
          <div class="story-chart__label">30 min remaining</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box">Inline Deny policy<br/>TokenIssueTime &lt; 10:30 AM</div>
          <div class="story-chart__label">attached to role immediately</div>
        </div>
        <div class="story-chart__arrow">→</div>
        <div class="story-chart__column">
          <div class="story-chart__box story-chart__box--safe">All pre-10:30 sessions<br/>→ dead instantly 🚫</div>
          <div class="story-chart__label">new sessions unaffected ✅</div>
        </div>
      </div>

      <blockquote class="lesson-tip">
        <p>
          <strong>Final exam cheat sheet — all 3 parts:</strong>
          Roles = temp creds via STS (all 3 required). Role chaining cap = 1 hour.
          Trust Policy: Principal = who can assume; <code>aws:MultiFactorAuthPresent</code> = MFA;
          <code>sts:ExternalId</code> = confused deputy protection.
          Permission Boundary: Effective = IAM Policy ∩ Boundary — never additive.
          Federation: OIDC → <code>AssumeRoleWithWebIdentity</code>; SAML → <code>AssumeRoleWithSAML</code>.
          Incident Response: active sessions → <code>aws:TokenIssueTime</code> deny;
          future sessions → remove Trust Policy principals; never delete the role.
        </p>
      </blockquote>
    `,
    isListed: false,
  },
  {
    id: 'lambda-lesson-1',
    title: 'Lesson 1 Lambda',
    excerpt:
      'Placeholder lesson for the first Lambda topic inside Stupid Dev Learns AWS.',
    date: '2026-05-15',
    readTime: 8,
    tags: ['Lambda', 'Serverless', 'Roadmap'],
    content: `
      <p>This lesson is ready for your content.</p>
      <p>Add your first Lambda lesson here.</p>
    `,
    isListed: false,
  },
  {
    id: 'lambda-lesson-2',
    title: 'Lesson 2 Lambda',
    excerpt:
      'Placeholder lesson for the second Lambda topic inside Stupid Dev Learns AWS.',
    date: '2026-05-15',
    readTime: 10,
    tags: ['Lambda', 'Serverless', 'Roadmap'],
    content: `
      <p>This lesson is ready for your content.</p>
      <p>Add your second Lambda lesson here.</p>
    `,
    isListed: false,
  },
  {
    id: 'aws-what-is-aws',
    title: 'What is AWS? A Simple Mental Model Before the Acronyms Attack',
    excerpt:
      'Before memorising service names, build a clear picture of what AWS actually is: regions, services, responsibility, and renting infrastructure on demand.',
    date: '2025-04-06',
    readTime: 5,
    tags: ['AWS', 'Fundamentals', 'Beginner'],
    content: `
      <h2>AWS is a giant rental menu</h2>
      <p>
        Amazon Web Services is a platform where you rent infrastructure instead of buying and operating
        physical hardware yourself. Instead of purchasing servers, networking gear, storage arrays, and
        backup systems, you provision them on demand through a console, CLI, or API.
      </p>

      <h2>Why it feels overwhelming</h2>
      <p>
        AWS is not one product. It is a huge collection of services: compute, storage, databases,
        networking, security, monitoring, analytics, and more. Beginners often feel lost because the
        service catalog is enormous, not because the core idea is complicated.
      </p>

      <h2>The three concepts to learn first</h2>
      <ul>
        <li><strong>Regions</strong> are geographic areas like Singapore or Frankfurt where AWS runs infrastructure.</li>
        <li><strong>Availability Zones</strong> are separate data centers inside a region.</li>
        <li><strong>Services</strong> are the building blocks you combine, like EC2 for servers and S3 for storage.</li>
      </ul>

      <h2>The shared responsibility model</h2>
      <p>
        AWS secures the underlying cloud hardware and facilities. You are still responsible for what you
        deploy inside it: IAM permissions, operating system patches, application bugs, encryption
        settings, and network exposure. "In the cloud" does not mean "someone else handles security."
      </p>

      <h2>Key takeaway</h2>
      <p>
        Think of AWS as programmable infrastructure. You are learning a toolbox, not a single app, and
        the real skill is knowing which building blocks to combine for a specific workload.
      </p>
    `,
  },
  {
    id: 'aws-iam-basics',
    title: 'Getting Started with AWS IAM: Users, Groups, and Policies',
    excerpt:
      'IAM is the gatekeeper of your AWS account. Learn how to create users, organize them into groups, and write policies that grant the least privilege needed.',
    date: '2025-04-10',
    readTime: 7,
    tags: ['IAM', 'Security', 'Fundamentals'],
    content: `
      <h2>What is AWS IAM?</h2>
      <p>
        AWS Identity and Access Management (IAM) is a web service that controls who can sign in to your
        AWS account and what resources they are allowed to use. Think of it as the security department
        of your cloud infrastructure — it issues badges, defines what doors each badge can open, and
        keeps an audit trail of every entry.
      </p>

      <h2>Core Concepts</h2>
      <h3>Users</h3>
      <p>
        An IAM <strong>User</strong> represents a single person or application that interacts with AWS.
        Each user has its own long-term credentials — either a password for the AWS Console or an
        Access Key ID + Secret Access Key for programmatic access via the CLI or SDK.
      </p>
      <p>
        Best practice: never use the root account for day-to-day tasks. Create an IAM user with
        administrative permissions and use that instead.
      </p>

      <h3>Groups</h3>
      <p>
        A <strong>Group</strong> is a collection of IAM users. Attach policies to the group, and every
        member inherits those permissions automatically. When a developer joins the team, add them to
        the <em>Developers</em> group — no need to touch individual policies.
      </p>

      <h3>Policies</h3>
      <p>
        A <strong>Policy</strong> is a JSON document that lists what actions are allowed or denied on
        which resources. AWS provides hundreds of managed policies (like <code>AmazonS3ReadOnlyAccess</code>),
        or you can write inline policies tailored to your exact needs.
      </p>
      <pre><code>{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}</code></pre>

      <h2>The Principle of Least Privilege</h2>
      <p>
        Always grant only the permissions required to perform a task, and nothing more. Start with
        a deny-all stance and add permissions incrementally. This limits the blast radius if
        credentials are ever compromised.
      </p>

      <h2>Multi-Factor Authentication (MFA)</h2>
      <p>
        Enable MFA for every human user, especially anyone with administrator access. A stolen
        password alone is not enough to sign in when MFA is active. AWS supports virtual MFA apps
        (Google Authenticator, Authy), hardware TOTP tokens, and FIDO2 security keys.
      </p>

      <h2>Key Takeaways</h2>
      <ul>
        <li>Never share the root account credentials.</li>
        <li>Use groups to manage permissions at scale.</li>
        <li>Write policies that follow least privilege.</li>
        <li>Enable MFA everywhere it is supported.</li>
        <li>Rotate access keys regularly and delete unused ones.</li>
      </ul>
    `,
  },
  {
    id: 'aws-s3-storage',
    title: 'AWS S3 Explained: Object Storage for the Modern Web',
    excerpt:
      'S3 is one of the oldest and most versatile AWS services. Discover how buckets, objects, and storage classes work — and how to host a static website for almost nothing.',
    date: '2025-04-20',
    readTime: 8,
    tags: ['S3', 'Storage', 'Static Hosting'],
    content: `
      <h2>What is Amazon S3?</h2>
      <p>
        Amazon Simple Storage Service (S3) is an object storage service that offers virtually unlimited
        capacity, high availability (99.99%), and durability (11 nines — 99.999999999%). Unlike a file
        system, S3 stores data as <strong>objects</strong> inside flat containers called <strong>buckets</strong>.
      </p>

      <h2>Key Concepts</h2>
      <h3>Buckets</h3>
      <p>
        A bucket is a top-level namespace for your objects. Bucket names must be globally unique across
        all AWS accounts. You choose an AWS region when creating a bucket; data stays in that region
        unless you explicitly configure replication.
      </p>

      <h3>Objects</h3>
      <p>
        An object is a file plus its metadata. Each object has a <strong>key</strong> (its name/path
        inside the bucket), a <strong>value</strong> (the actual data, up to 5 TB), and optional
        metadata tags. The "folders" you see in the S3 Console are just key prefixes — S3 itself is
        completely flat.
      </p>

      <h3>Storage Classes</h3>
      <p>S3 offers multiple storage classes to balance cost and retrieval speed:</p>
      <ul>
        <li><strong>S3 Standard</strong> — frequent access, low latency, highest cost.</li>
        <li><strong>S3 Standard-IA</strong> — infrequent access, same performance, lower storage cost but a retrieval fee.</li>
        <li><strong>S3 Glacier Instant Retrieval</strong> — archival data accessed once a quarter.</li>
        <li><strong>S3 Glacier Deep Archive</strong> — cheapest tier, retrieval takes hours.</li>
      </ul>
      <p>
        Use <strong>S3 Lifecycle Policies</strong> to automatically transition objects between classes
        or delete them after a set period.
      </p>

      <h2>Hosting a Static Website on S3</h2>
      <p>
        S3 can serve HTML, CSS, and JavaScript files directly over HTTP. This is exactly how this blog
        could be deployed (alongside Netlify). Steps:
      </p>
      <ol>
        <li>Create a bucket with the same name as your domain (e.g., <code>aws.io.vn</code>).</li>
        <li>Enable <em>Static Website Hosting</em> in the bucket properties.</li>
        <li>Set the index document to <code>index.html</code>.</li>
        <li>Attach a bucket policy that allows public <code>s3:GetObject</code> access.</li>
        <li>Point your domain's CNAME to the S3 website endpoint.</li>
      </ol>

      <h2>Security Considerations</h2>
      <p>
        By default, all S3 buckets are private. The <strong>Block Public Access</strong> setting is
        enabled at both the account and bucket level — keep it on unless you deliberately need a
        public bucket (like a static website). Use <strong>bucket policies</strong> and <strong>IAM
        policies</strong> together to control access, and enable <strong>versioning</strong> to
        protect against accidental deletes.
      </p>

      <h2>Key Takeaways</h2>
      <ul>
        <li>S3 is object storage — not a file system or block device.</li>
        <li>Bucket names are globally unique; pick a good one early.</li>
        <li>Choose the right storage class to optimise cost.</li>
        <li>Enable versioning for critical data.</li>
        <li>S3 can host an entire static website cheaply and reliably.</li>
      </ul>
    `,
  },
  {
    id: 'aws-ec2-intro',
    title: 'AWS EC2: Your Virtual Server in the Cloud',
    excerpt:
      'EC2 gives you on-demand virtual machines in minutes. Learn about instance types, key pairs, security groups, and how to SSH into your first Linux server.',
    date: '2025-04-28',
    readTime: 9,
    tags: ['EC2', 'Compute', 'Linux'],
    content: `
      <h2>What is Amazon EC2?</h2>
      <p>
        Amazon Elastic Compute Cloud (EC2) is the backbone of AWS compute. It provides resizable virtual
        machines — called <strong>instances</strong> — that you can launch, stop, resize, and terminate
        on demand. You only pay for the seconds your instance is running (with On-Demand pricing).
      </p>

      <h2>Instance Types</h2>
      <p>
        AWS offers hundreds of instance types grouped into families optimised for different workloads:
      </p>
      <ul>
        <li><strong>t3 / t4g</strong> — burstable, low-cost, great for dev/test and small web servers.</li>
        <li><strong>m7g / m6i</strong> — balanced compute and memory for general-purpose applications.</li>
        <li><strong>c7g / c6i</strong> — compute-optimised for CPU-intensive tasks like video encoding.</li>
        <li><strong>r7g / r6i</strong> — memory-optimised for databases and in-memory caches.</li>
      </ul>
      <p>
        The <em>g</em> suffix denotes AWS Graviton (ARM) processors — they typically offer 20–40%
        better price-performance than equivalent x86 instances.
      </p>

      <h2>Key Pairs</h2>
      <p>
        EC2 uses <strong>key pairs</strong> (public/private RSA or ED25519 keys) for SSH authentication.
        AWS stores the public key; you download the private key (<code>.pem</code> file) once —
        keep it safe and never commit it to source control.
      </p>
      <pre><code># Set correct permissions on the private key
chmod 400 my-key.pem

# SSH into a Linux instance
ssh -i my-key.pem ec2-user@&lt;public-ip&gt;</code></pre>

      <h2>Security Groups</h2>
      <p>
        A <strong>Security Group</strong> acts as a virtual firewall for your instance. It controls
        inbound and outbound traffic at the instance level. Rules are stateful — if you allow inbound
        SSH on port 22, the return traffic is automatically allowed.
      </p>
      <p>Best practices:</p>
      <ul>
        <li>Allow SSH (port 22) only from your own IP address, not <code>0.0.0.0/0</code>.</li>
        <li>Expose only the ports your application needs (e.g., 80/443 for a web server).</li>
        <li>Use separate security groups for each tier (web, app, database).</li>
      </ul>

      <h2>Elastic IP Addresses</h2>
      <p>
        By default, EC2 instances get a new public IP every time they start. An <strong>Elastic IP</strong>
        is a static IPv4 address that you own until you explicitly release it. Assign it to your
        instance so your domain DNS record never needs to change.
      </p>

      <h2>Connecting EC2 to this Blog</h2>
      <p>
        The plan for this project is to deploy a C# ASP.NET Core API to an EC2 instance. The
        React frontend (hosted on Netlify) will call that API via <code>fetch</code>. When that
        time comes, you will need to:
      </p>
      <ol>
        <li>Launch a <code>t3.micro</code> (free tier eligible) Amazon Linux instance.</li>
        <li>Install the .NET runtime and deploy your API.</li>
        <li>Open port 443 in the security group and set up an HTTPS certificate with Let's Encrypt.</li>
        <li>Update the Netlify environment variable with the EC2 API base URL.</li>
      </ol>

      <h2>Key Takeaways</h2>
      <ul>
        <li>EC2 is on-demand virtual infrastructure — you control the OS and everything above it.</li>
        <li>Choose an instance type based on workload; start small and resize if needed.</li>
        <li>Never expose port 22 to the entire internet.</li>
        <li>Use Elastic IPs for servers that need a stable address.</li>
        <li>The free tier includes 750 hours/month of <code>t2.micro</code> or <code>t3.micro</code> usage.</li>
      </ul>
    `,
  },
  {
    id: 'aws-vpc-basics',
    title: 'AWS VPC Basics: Your Private Slice of the Cloud',
    excerpt:
      'A beginner-friendly explanation of what a VPC is, why it exists, and how it gives your AWS resources a private network boundary.',
    date: '2025-05-03',
    readTime: 6,
    tags: ['VPC', 'Networking', 'Beginner'],
    content: `
      <h2>What a VPC really is</h2>
      <p>
        An Amazon VPC (Virtual Private Cloud) is your own logically isolated network inside AWS. It is
        where you define IP ranges, subnets, routing, and security boundaries for resources like EC2,
        load balancers, and databases.
      </p>

      <h2>Why it matters</h2>
      <p>
        Without a VPC, every server would just be "some machine in AWS." With a VPC, you decide which
        systems live together, which ones can talk to the internet, and which ones stay private.
      </p>

      <h2>Common VPC building blocks</h2>
      <ul>
        <li><strong>CIDR block</strong> defines the IP address range for the VPC.</li>
        <li><strong>Subnets</strong> divide the VPC into smaller network segments.</li>
        <li><strong>Route tables</strong> decide where traffic goes.</li>
        <li><strong>Internet gateways</strong> allow public internet connectivity.</li>
      </ul>

      <h2>A practical mental model</h2>
      <p>
        Treat the VPC as the fenced property line for your system. The subnets are rooms inside the
        property, and the routing rules decide which doors are open.
      </p>
    `,
  },
  {
    id: 'aws-subnets-basics',
    title: 'AWS Subnets: Splitting a VPC into Safe Neighborhoods',
    excerpt:
      'Subnets let you separate public-facing workloads from private ones and keep routing choices understandable.',
    date: '2025-05-04',
    readTime: 6,
    tags: ['Subnets', 'Networking', 'Beginner'],
    content: `
      <h2>What a subnet does</h2>
      <p>
        A subnet is a smaller IP range carved out from a VPC. AWS places resources into subnets so you
        can control how those resources communicate and whether they are reachable from the internet.
      </p>

      <h2>Public vs private</h2>
      <p>
        A subnet becomes <strong>public</strong> when its route table sends internet-bound traffic to an
        internet gateway. A subnet is <strong>private</strong> when it does not expose resources
        directly to the internet.
      </p>

      <h2>Why teams split them</h2>
      <ul>
        <li>Web servers often live in public subnets.</li>
        <li>Application servers and databases usually stay in private subnets.</li>
        <li>Separate subnets reduce accidental exposure and make architecture easier to reason about.</li>
      </ul>

      <h2>Key takeaway</h2>
      <p>
        Subnets are about structure. They help you group systems by access pattern and security needs
        instead of dumping everything into one flat network.
      </p>
    `,
  },
  {
    id: 'aws-security-groups-basics',
    title: 'AWS Security Groups: The Firewall Attached to Your Instance',
    excerpt:
      'Security groups are stateful traffic filters that let you define what can reach an AWS resource and what can leave it.',
    date: '2025-05-05',
    readTime: 5,
    tags: ['Security Groups', 'Networking', 'Security'],
    content: `
      <h2>What a security group is</h2>
      <p>
        A security group is a virtual firewall attached to an AWS resource such as an EC2 instance,
        load balancer, or RDS database. It evaluates inbound and outbound traffic rules.
      </p>

      <h2>Stateful behavior</h2>
      <p>
        Security groups are stateful. If inbound traffic is allowed, the response traffic is allowed
        automatically. That makes them simpler to manage than stateless ACL-style rules.
      </p>

      <h2>Good beginner habits</h2>
      <ul>
        <li>Open only the ports you actually need.</li>
        <li>Restrict SSH to your own IP instead of <code>0.0.0.0/0</code>.</li>
        <li>Reference other security groups when services talk to each other.</li>
      </ul>

      <h2>Key takeaway</h2>
      <p>
        Security groups are one of the fastest ways to reduce risk in AWS. Small rule changes can decide
        whether a system is sensibly protected or wide open.
      </p>
    `,
  },
  {
    id: 'aws-docker-on-aws',
    title: 'Docker on AWS: Where Containers Actually Fit',
    excerpt:
      'A grounded overview of how Docker images move through ECR, EC2, ECS, and deployment workflows on AWS.',
    date: '2025-05-06',
    readTime: 7,
    tags: ['Docker', 'AWS', 'Deployment'],
    content: `
      <h2>Docker is the packaging layer</h2>
      <p>
        Docker lets you package an application with its runtime, dependencies, and startup command into
        an image. AWS then gives you multiple places to run that image.
      </p>

      <h2>Typical AWS container path</h2>
      <ol>
        <li>Build an image locally or in CI.</li>
        <li>Push it to Amazon ECR, the container registry.</li>
        <li>Run it on ECS, EKS, or directly on EC2.</li>
      </ol>

      <h2>When Docker helps</h2>
      <p>
        Containers give you consistent environments across laptops, CI pipelines, and production. They
        do not remove the need for networking, secrets management, or observability, but they make
        delivery more repeatable.
      </p>
    `,
  },
  {
    id: 'aws-ecs-basics',
    title: 'AWS ECS Basics: Container Orchestration Without the Kubernetes Overhead',
    excerpt:
      'ECS is AWS’s simpler path for scheduling and scaling containers, especially when you want managed orchestration with fewer moving parts.',
    date: '2025-05-07',
    readTime: 7,
    tags: ['ECS', 'Containers', 'Deployment'],
    content: `
      <h2>What ECS does</h2>
      <p>
        Amazon ECS (Elastic Container Service) runs and manages containers for you. You define a task
        with CPU, memory, image, ports, and environment variables, and ECS handles placement and health.
      </p>

      <h2>Two main modes</h2>
      <ul>
        <li><strong>Fargate</strong> removes server management entirely.</li>
        <li><strong>EC2 launch type</strong> gives you more control but you manage the worker instances.</li>
      </ul>

      <h2>Why beginners like it</h2>
      <p>
        ECS integrates cleanly with load balancers, IAM, CloudWatch, and ECR. It is often a smoother
        first orchestration platform than Kubernetes if your team mainly wants to ship containers.
      </p>
    `,
  },
  {
    id: 'aws-cicd-basics',
    title: 'AWS CI/CD Basics: Automating the Boring and Risky Parts',
    excerpt:
      'A lightweight introduction to build pipelines, deployment stages, and how AWS services can automate releases safely.',
    date: '2025-05-08',
    readTime: 8,
    tags: ['CI/CD', 'DevOps', 'Automation'],
    content: `
      <h2>What CI/CD means</h2>
      <p>
        Continuous Integration is about validating changes early with automated builds and tests.
        Continuous Delivery or Deployment is about moving validated changes toward production with
        consistent, repeatable steps.
      </p>

      <h2>AWS services involved</h2>
      <ul>
        <li><strong>CodePipeline</strong> orchestrates stages.</li>
        <li><strong>CodeBuild</strong> runs build and test jobs.</li>
        <li><strong>CodeDeploy</strong> helps roll out application updates.</li>
      </ul>

      <h2>Why pipelines matter</h2>
      <p>
        Manual deployments are slow, inconsistent, and easy to break. A pipeline gives you confidence
        that every release goes through the same checks and handoff steps.
      </p>
    `,
  },
];

export function getPostById(id: string): Post | undefined {
  return posts.find((p) => p.id === id);
}
