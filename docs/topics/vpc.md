Build me a new Blog as : "AWS VPC — Pho24h Factory".

## Core Features

1. A visual **flowchart** showing all AWS VPC components as factory nodes
2. Each node has an emoji icon, title, and subtitle
3. **Hover** a node → shows a tooltip preview
4. **Click** a node → opens a side panel with:
   - Concept explanation (what is it?)
   - Real project example
   - Funny Pho24h factory story
   - Exam tip (SAA-C03)
5. Animated transitions, clean design

## Tech Stack

- React 18 + TypeScript
- Tailwind CSS for styling
- Framer Motion for animations
- No external chart library — build the flowchart with pure CSS/SVG

## File Structure to Create

src/
  components/
    FlowChart/
      FlowChart.tsx          # Main chart container
      FlowNode.tsx           # Individual node component
      FlowArrow.tsx          # Arrow/connector between nodes
      flowchart.types.ts     # TypeScript interfaces
    SidePanel/
      SidePanel.tsx          # Sliding panel for content
      ConceptCard.tsx        # Concept explanation section
      StoryCard.tsx          # Funny story section
      ExamTip.tsx            # SAA-C03 exam tip section
    Tooltip/
      Tooltip.tsx            # Hover tooltip preview
  data/
    vpc-nodes.data.ts        # All node content data
  hooks/
    useSelectedNode.ts       # State hook for selected node
  App.tsx
  index.tsx

## TypeScript Interfaces

Create these interfaces in flowchart.types.ts:

interface VPCNode {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  color: NodeColor;
  position: { x: number; y: number };
  concept: string;
  realExample: string;
  funnyStory: string;
  examTip: string;
  connections: string[]; // array of node ids this connects to
}

type NodeColor = 'blue' | 'teal' | 'coral' | 'purple' | 'amber' | 'gray' | 'green' | 'red';

interface SidePanelProps {
  node: VPCNode | null;
  onClose: () => void;
}

## Node Data (vpc-nodes.data.ts)

Create all 12 VPC nodes with this data:

const vpcNodes: VPCNode[] = [
  {
    id: 'internet',
    icon: '🌐',
    title: 'Internet',
    subtitle: 'Wild street outside the factory',
    color: 'blue',
    position: { x: 50, y: 2 },
    concept: 'The public internet. Not owned by AWS. Represents all external traffic — users, bots, APIs — trying to reach your servers.',
    realExample: 'When a user types yourapp.com in their browser, that request comes FROM the internet and must pass through your security layers before reaching your server.',
    funnyStory: '🌐 The wild street outside Pho24h. Full of hungry customers (legit users), delivery bikes (API calls), and the occasional drunk guy trying to kick down your door at 3am (hackers). You cannot control the street — only control who gets through your front gate.',
    examTip: '💡 SAA-C03: The internet is untrusted by default. Nothing enters your VPC without an Internet Gateway + Route Table entry + Security Group rule. Three gates, not one.',
    connections: ['igw', 'egress-igw', 'carrier-gw']
  },
  {
    id: 'igw',
    icon: '🚪',
    title: 'Internet Gateway',
    subtitle: 'Front gate — 2-way traffic',
    color: 'coral',
    position: { x: 50, y: 16 },
    concept: 'The Internet Gateway (IGW) is the bridge between your VPC and the public internet. It allows two-way traffic — requests IN, responses OUT. Without it, your VPC is a sealed bunker.',
    realExample: 'Your web server in a public subnet receives traffic from users worldwide because the IGW is attached and a Route Table points 0.0.0.0/0 to the IGW.',
    funnyStory: '🚪 The grand front gate of Pho24h. Open 24 hours. Security guard checks everyone coming in and going out. Without this gate, your factory is invisible — customers stand outside confused, Google Maps shows nothing, you go bankrupt. The gate must be ATTACHED to the VPC and ADDED to the Route Table or it does nothing. A gate lying on the ground is not a gate.',
    examTip: '💡 SAA-C03: Common trap — students attach the IGW but forget to add a route in the Route Table pointing to it. Both steps are required. One IGW per VPC maximum.',
    connections: ['route-table', 'elastic-ip']
  },
  {
    id: 'egress-igw',
    icon: '🚶',
    title: 'Egress-only IGW',
    subtitle: 'One-way exit door — IPv6 only',
    color: 'teal',
    position: { x: 85, y: 2 },
    concept: 'Egress-Only Internet Gateway allows IPv6 traffic to go OUT from your private instances to the internet, but blocks any incoming connections. IPv6 equivalent of NAT Gateway.',
    realExample: 'An EC2 instance with an IPv6 address in a private subnet needs to download updates. You use Egress-Only IGW so it can reach out, but nobody can reach back in.',
    funnyStory: '🚶 The emergency fire exit at the back of Pho24h. Staff can walk out to buy ingredients. But it has a heavy one-way lock — delivery guys try to push it open from outside and it does not budge. "EXIT ONLY, BRO." The door does not care how important your delivery is.',
    examTip: '💡 SAA-C03: Only for IPv6. For IPv4 private-to-internet traffic, use NAT Gateway instead. Egress-Only IGW appears less frequently on the exam but know the IPv6 distinction.',
    connections: []
  },
  {
    id: 'carrier-gw',
    icon: '📡',
    title: 'Carrier Gateway',
    subtitle: '5G / mobile network access',
    color: 'teal',
    position: { x: 15, y: 2 },
    concept: 'Carrier Gateway connects your VPC to carrier networks (like Verizon, T-Mobile) for ultra-low-latency mobile/5G applications using AWS Wavelength zones.',
    realExample: 'A real-time mobile gaming company deploys servers in Wavelength zones close to 5G towers. The Carrier Gateway connects those servers to the carrier network for sub-10ms latency.',
    funnyStory: '📡 Pho24h installs a drone landing pad on the roof for 5G delivery drones from Viettel. It cost a fortune. It looks extremely cool. Exactly 0 drones have landed. Most factories never use this. But it is THERE, gleaming in the sun, ready for the future of pho delivery.',
    examTip: '💡 SAA-C03: Very rarely tested. If you see a question about 5G, ultra-low latency mobile apps, or AWS Wavelength — Carrier Gateway is your answer. Skip deep study on this one.',
    connections: []
  },
  {
    id: 'route-table',
    icon: '🗺️',
    title: 'Route Table',
    subtitle: 'Road signs for all traffic',
    color: 'purple',
    position: { x: 50, y: 30 },
    concept: 'A Route Table contains rules (routes) that determine where network traffic is directed. Every subnet must be associated with a route table. Each route has a destination (CIDR) and a target (where to send it).',
    realExample: 'Public subnet route table: 0.0.0.0/0 → Internet Gateway (send internet traffic to the front gate). Private subnet route table: 0.0.0.0/0 → NAT Gateway (send internet-bound traffic to the proxy).',
    funnyStory: '🗺️ The factory directory board at every junction. New delivery guy arrives with three boxes. He checks the board: Kitchen → turn left. Office → upstairs. Internet → use the front gate. Without this board, he stands in the middle of the factory crying, boxes slowly getting cold. The pho gets cold. Nobody is happy.',
    examTip: '💡 SAA-C03: The most specific route always wins. 10.0.1.0/24 beats 10.0.0.0/16 beats 0.0.0.0/0. This is called "longest prefix match." Also remember: each subnet can only be associated with ONE route table at a time.',
    connections: ['vpc-boundary']
  },
  {
    id: 'dhcp',
    icon: '📋',
    title: 'DHCP Option Sets',
    subtitle: 'Staff welcome pack',
    color: 'gray',
    position: { x: 15, y: 30 },
    concept: 'DHCP Option Sets automatically configure new servers joining your network — providing hostname, DNS server, NTP server, and domain name. Think of it as the automatic onboarding kit for new EC2 instances.',
    realExample: 'When your company uses an internal DNS server (not AWS default), you create a custom DHCP Option Set pointing to your DNS IP. All new EC2 instances automatically use your corporate DNS.',
    funnyStory: '📋 HR at Pho24h has a laminated welcome pack for every new worker: here is your name tag (hostname), here is the office phone book (DNS server), here is your locker number (IP address config). Without this pack, new workers wander around asking "what is my name? who do I call? where do I sit?" Complete chaos on the first day.',
    examTip: '💡 SAA-C03: You can only have ONE DHCP option set per VPC. To change DNS settings, create a new option set and associate it — you cannot edit an existing one. Rarely a deep question.',
    connections: []
  },
  {
    id: 'elastic-ip',
    icon: '📌',
    title: 'Elastic IP',
    subtitle: 'Permanent VIP address',
    color: 'amber',
    position: { x: 85, y: 16 },
    concept: 'An Elastic IP is a static, public IPv4 address you can reserve and assign to EC2 instances or NAT Gateways. Unlike regular public IPs that change on restart, Elastic IPs stay the same forever.',
    realExample: 'A payment processing server needs a fixed IP so banks can whitelist it in their firewall. Without Elastic IP, the IP changes every restart and banks block it again.',
    funnyStory: '📌 Normal servers are like food carts — different corner every day. Customers are confused. "Was it on Nguyen Hue yesterday? Now it is on Le Loi?" You rent an Elastic IP — now Pho24h is ALWAYS at 1 Pho Street forever. Even if you renovate (restart the server), the address never changes. VIP treatment. The fancy red pin on the map. Costs money if you reserve it but do not use it — AWS charges for waste.',
    examTip: '💡 SAA-C03: Elastic IPs are FREE when attached to a running instance. You get CHARGED when the EIP is allocated but NOT attached (or attached to a stopped instance). AWS hates wasted IPs.',
    connections: []
  },
  {
    id: 'prefix-list',
    icon: '📝',
    title: 'Managed Prefix Lists',
    subtitle: 'Approved vendor list',
    color: 'gray',
    position: { x: 85, y: 30 },
    concept: 'A Managed Prefix List is a reusable set of CIDR blocks. Instead of typing the same list of IP ranges into 10 different Security Groups or Route Tables, you create one Prefix List and reference it everywhere.',
    realExample: 'Your company has 5 office locations each with their own IP range. Create one Prefix List with all 5 ranges. Add it to all your Security Groups. When a new office opens, update the Prefix List once — all Security Groups update automatically.',
    funnyStory: '📝 Pho24h has 50 supply room doors. Each door has a sign: "Only approved suppliers allowed." Instead of writing the same 20 supplier addresses on all 50 doors individually, the smart manager makes ONE laminated approved supplier list and photocopies it to every door. New supplier? Update the master list once. All 50 doors update. The old manager who typed each door individually has RSI in both hands.',
    examTip: '💡 SAA-C03: Prefix Lists are referenced by Security Groups and Route Tables. AWS maintains some prefix lists for its own services (like S3 and CloudFront IPs) called "AWS-managed prefix lists" — useful for allowing traffic to AWS services without knowing their IP ranges.',
    connections: []
  },
  {
    id: 'public-subnet',
    icon: '🍜',
    title: 'Public Subnet',
    subtitle: 'Front restaurant — internet-facing',
    color: 'teal',
    position: { x: 25, y: 55 },
    concept: 'A Public Subnet is a subnet whose Route Table has a route to an Internet Gateway. Resources here can receive traffic from the internet (if Security Group allows). Typically holds web servers, load balancers, and NAT Gateways.',
    realExample: 'Your Application Load Balancer sits in the public subnet across 2 Availability Zones. It receives traffic from users globally and forwards it to EC2 instances in private subnets.',
    funnyStory: '🍜 The front dining room of Pho24h. Bright lights, open door, big sign "OPEN 24H." Customers walk in directly from the street. Tables are visible from outside. Anyone can see the menu. The waiters (web servers) handle all orders here. You want people to find this place easily — that is the whole point. The secret kitchen is in the back where nobody goes.',
    examTip: '💡 SAA-C03: A subnet is NOT automatically public just because it is in a VPC with an IGW. It must have a Route Table entry pointing to the IGW AND "Auto-assign public IPv4" enabled. Both required.',
    connections: ['private-subnet', 'web-server', 'route-server', 'peering']
  },
  {
    id: 'private-subnet',
    icon: '🔒',
    title: 'Private Subnet',
    subtitle: 'Secret kitchen — no direct internet',
    color: 'blue',
    position: { x: 75, y: 55 },
    concept: 'A Private Subnet has NO direct route to an Internet Gateway. Resources here cannot be reached from the internet and cannot reach out directly either. They use NAT Gateway to initiate outbound connections.',
    realExample: 'Your RDS database, ElastiCache cluster, and backend microservices all live in private subnets. They can talk to the web servers in the public subnet but are completely invisible to the outside world.',
    funnyStory: '🔒 The secret kitchen of Pho24h. No windows. Reinforced door. The 20-hour broth recipe lives here. Customers never see this room. Even most staff cannot enter. The chefs (databases) work here in peace, away from the chaos of the dining room. If a chef needs supplies from outside, they do not walk out the front door — they send the NAT Gateway ninja to buy things secretly.',
    examTip: '💡 SAA-C03: Private subnets still need outbound internet access for things like OS updates. That is what NAT Gateway is for. Private subnets CAN communicate with other AWS services (like S3) privately using VPC Endpoints — avoiding the internet entirely.',
    connections: ['public-subnet', 'database', 'nat-gw']
  },
  {
    id: 'web-server',
    icon: '🖥️',
    title: 'Web Server / Load Balancer',
    subtitle: 'Takes customer orders',
    color: 'teal',
    position: { x: 25, y: 68 },
    concept: 'EC2 instances or Application Load Balancers in the public subnet handle incoming HTTP/HTTPS traffic. The Load Balancer distributes requests across multiple EC2 instances for high availability.',
    realExample: 'Netflix runs Application Load Balancers in public subnets that receive streaming requests and route them to backend services in private subnets based on the URL path.',
    funnyStory: '🖥️ The waiter station at Pho24h. Multiple waiters (EC2 instances) stand ready. The head waiter (Load Balancer) assigns tables efficiently: "Table 1 go to Waiter A, Table 2 go to Waiter B." If Waiter A collapses from overwork, the Load Balancer stops sending him tables. The restaurant keeps running. The pho keeps flowing.',
    examTip: '💡 SAA-C03: ALB (Application Load Balancer) works at Layer 7 (HTTP/HTTPS) and can route based on URL path or hostname. NLB (Network Load Balancer) works at Layer 4 (TCP/UDP) for ultra-high performance. Know when to use which.',
    connections: []
  },
  {
    id: 'route-server',
    icon: '🚦',
    title: 'Route Server',
    subtitle: 'Smart dynamic traffic controller',
    color: 'purple',
    position: { x: 25, y: 78 },
    concept: 'Route Server enables dynamic routing using BGP (Border Gateway Protocol) between your VPC and external network appliances (like SD-WAN devices or firewalls). It automatically updates route tables without manual intervention.',
    realExample: 'A company connects their on-premise network to AWS via a 3rd-party firewall appliance. Route Server handles the BGP session, automatically propagating route changes from on-premise into the VPC route tables.',
    funnyStory: '🚦 The old route table was a paper sign nailed to the wall — someone had to climb a ladder to update it. The Route Server is the smart traffic controller with a headset and walkie-talkie: "Road to kitchen blocked — reroute via loading dock B! Main supplier changed address — all drivers updated automatically!" He talks to everyone in real time. The paper sign is now in the museum.',
    examTip: '💡 SAA-C03: Route Server is a newer service, less frequently tested. Know that it uses BGP for dynamic routing with network appliances. For static routing questions, Route Tables are still the answer.',
    connections: []
  },
  {
    id: 'peering',
    icon: '🤝',
    title: 'Peering Connection',
    subtitle: 'Secret tunnel to other VPC',
    color: 'blue',
    position: { x: 25, y: 88 },
    concept: 'VPC Peering creates a private network connection between two VPCs. Traffic flows directly between them using private IP addresses without going through the internet, a VPN, or a gateway.',
    realExample: 'A company has a production VPC and a logging VPC. They set up peering so the production servers can send logs to the logging VPC privately, without those logs ever touching the public internet.',
    funnyStory: '🤝 Pho24h Factory A (main restaurant) and Pho Factory B (the secret sauce plant across town) dig a private underground tunnel. Sauce barrels roll through the tunnel at night. No trucks on public roads. No competitors seeing the delivery. No traffic cameras catching the secret recipe transport. Just two factories, one tunnel, zero witnesses.',
    examTip: '💡 SAA-C03: Peering is NON-TRANSITIVE. If A peers with B, and B peers with C, then A CANNOT talk to C through B. You need direct peering for each pair. For many VPCs, use Transit Gateway instead — it solves the transitive problem.',
    connections: []
  },
  {
    id: 'database',
    icon: '🗄️',
    title: 'Database',
    subtitle: 'Secret 20-hour broth recipe',
    color: 'blue',
    position: { x: 75, y: 68 },
    concept: 'RDS, DynamoDB, ElastiCache and other data stores live in private subnets. They are only accessible from within the VPC — never directly from the internet. Your web servers talk to them using private IP addresses.',
    realExample: 'Airbnb runs RDS PostgreSQL in private subnets in Multi-AZ mode. Only their backend application servers (also in private subnets) can connect. The database port is never exposed to the internet.',
    funnyStory: '🗄️ The database is the sacred broth recipe vault, locked in a fireproof safe in the deepest part of the secret kitchen. The recipe took 20 years and 20 hours to perfect. No customer ever sees it. No random staff touches it. Only the head chef (backend API) knows the combination. The safe has no windows. The room has no outside door. And there are three padlocks just in case.',
    examTip: '💡 SAA-C03: RDS in a private subnet still needs outbound internet access for updates — use NAT Gateway. For private connectivity to RDS without internet, ensure Security Groups allow traffic from your application servers only. Never put a database in a public subnet.',
    connections: []
  },
  {
    id: 'nat-gw',
    icon: '🥷',
    title: 'NAT Gateway',
    subtitle: 'Secret proxy shopper',
    color: 'coral',
    position: { x: 75, y: 78 },
    concept: 'NAT (Network Address Translation) Gateway allows instances in a PRIVATE subnet to initiate outbound connections to the internet while preventing the internet from initiating connections back. It lives in the PUBLIC subnet but serves the private subnet.',
    realExample: 'Your private EC2 instance running a backend API needs to download npm packages and security updates from the internet. NAT Gateway handles these outbound requests while keeping the instance unreachable from outside.',
    funnyStory: '🥷 Kitchen staff (private subnet) need to buy fresh ingredients online. But they cannot walk out the front door — they are secret. So they whisper to the NAT Gateway ninja who has an office at the side of the front building: "Psst... order 10kg of beef bones from Lazada." The ninja goes out, buys the stuff, comes back, delivers it. The delivery guy only ever sees the ninja\'s face. The kitchen staff remain anonymous. Nobody knows the secret chef exists.',
    examTip: '💡 SAA-C03: NAT Gateway lives in the PUBLIC subnet, not the private subnet. It needs its own Elastic IP. It is managed by AWS (highly available within an AZ). For multi-AZ redundancy, create one NAT Gateway per AZ. NAT Gateway is preferred over NAT Instance — more reliable, no patching needed.',
    connections: []
  }
];

export default vpcNodes;

## FlowChart Layout

The chart is laid out as a vertical flow:

Layer 1 (top, outside VPC): Internet node centered
Layer 2: IGW centered, Egress-Only IGW right, Carrier GW left
Layer 3: Route Table centered, DHCP left, Elastic IP right, Prefix List far right
Layer 4 (inside VPC dashed border):
  Left column (Public Subnet): Web Server, Route Server, Peering Connection
  Right column (Private Subnet): Database, NAT Gateway
Layer 5 (bottom): Infra services row

Use absolute positioning with percentage-based x/y coordinates so it scales responsively.

## Side Panel Behavior

- Opens from the RIGHT side, sliding in with Framer Motion
- Width: 420px on desktop, full width on mobile
- Contains tabs or sections:
  1. 📖 Concept — what is it + 2-3 sentence explanation
  2. 🏗️ Real Example — real company/project usage
  3. 🍜 Pho Story — funny factory analogy
  4. 🎯 Exam Tip — SAA-C03 specific tip
- Close button (X) top right
- Clicking outside or pressing Escape closes it

## Node Component Design

Each node should:
- Have a colored background matching its NodeColor (soft pastel)
- Show the emoji icon (28px) + title (13px bold) + subtitle (11px muted)
- On hover: slight scale up (1.03), border brightens, cursor pointer
- On click: adds a "selected" ring/glow border
- Show a small tooltip on hover (positioned above the node) with first 80 chars of concept

## Tooltip Component

- Appears after 400ms hover delay
- Positions ABOVE the node (flips below if near top of screen)
- Dark background, white text, max-width 240px
- Shows: icon + title + first 80 chars of concept + "Click to learn more →"
- Disappears immediately on mouse leave

## Connection Arrows

- SVG lines drawn between connected nodes
- Solid lines for main flow, dashed lines for optional/special connections
- Arrow heads at the destination
- Animate with a subtle dash-offset animation on load

## Styling Guidelines

Colors (Tailwind classes):
- blue:   bg-blue-50   border-blue-600   dark:bg-blue-900
- teal:   bg-emerald-50 border-emerald-600 dark:bg-emerald-900
- coral:  bg-orange-50  border-orange-600  dark:bg-orange-900
- purple: bg-purple-50  border-purple-600  dark:bg-purple-900
- amber:  bg-amber-50   border-amber-600   dark:bg-amber-900
- gray:   bg-gray-100   border-gray-500    dark:bg-gray-800

Typography:
- Node title: font-medium text-sm
- Node subtitle: text-xs text-muted-foreground
- Panel heading: text-xl font-bold
- Panel body: text-sm leading-relaxed

## App.tsx Structure

The app should have:
- A header: "🏭 AWS VPC — Pho24h Factory" with subtitle "Click any component to learn its story"
- The FlowChart component taking 100% width, min-height 800px
- The SidePanel overlaid on the right
- A small legend at the bottom explaining colors
- Dark mode support via Tailwind dark: classes

## Install Dependencies

Run these commands first:
  npm install framer-motion
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p

## Quality Requirements

- Fully typed TypeScript — no `any` types
- All node data in a separate data file (easy to add more nodes later)
- Responsive: works on 1280px+ desktop and 768px tablet
- Accessible: keyboard navigation (Tab to nodes, Enter to open panel, Escape to close)
- All hover and click states clearly visible
- Loading state handled gracefully

Build the complete application. Start with the data file, then types, then components bottom-up (FlowNode → FlowArrow → FlowChart → SidePanel → App).