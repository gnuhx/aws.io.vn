import type { Post } from '../types/post';

export const posts: Post[] = [
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
];

export function getPostById(id: string): Post | undefined {
  return posts.find((p) => p.id === id);
}
