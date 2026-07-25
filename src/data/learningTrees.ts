import type { LearningTree } from '../types/learningTree';

export const learningTrees: LearningTree[] = [
  {
    id: 'stupid-dev-learns-aws',
    path: '/learning/stupid-dev-learns-aws',
    title: 'Stupid Dev Learns AWS 🤡',
    excerpt:
      'A parent learning roadmap for AWS topics, with lessons grouped directly under each topic.',
    description:
      'A reusable learning blog where each AWS topic has its own lesson list directly in the roadmap.',
    estimatedHours: 'Growing series',
    level: 'Beginner to Advanced',
    date: '2026-05-15',
    tags: ['Learning Tree', 'AWS'],
    topics: [
      {
        id: 'iam',
        title: 'IAM',
        description:
          'Identity and Access Management fundamentals, policy practice, and role assumption.',
        accent: '#9c7a35',
        lessons: [
          {
            id: 'secure-root-account',
            title: 'Secure your Root Account',
            postId: 'iam-secure-root-account',
            summary:
              'Lock down the root user first so the rest of the account has a safe baseline.',
            duration: '8 min',
            difficulty: 'Beginner',
          },
          {
            id: 'iam-policy-documents',
            title: 'Use IAM Policy Documents to Control Access Rights',
            postId: 'iam-policy-documents',
            summary:
              'Understand the structure of IAM policy JSON and how allow and deny rules work.',
            duration: '10 min',
            difficulty: 'Beginner',
          },
          {
            id: 'iam-users-and-permanent-credentials',
            title: 'Managing IAM Users and AWS Resource Access',
            postId: 'iam-users-and-permanent-credentials',
            summary:
              'Learn how IAM users, groups, and long-lived credentials are managed in practice.',
            duration: '10 min',
            difficulty: 'Beginner',
          },
          {
            id: 'policy-management-part-1',
            title: 'Practice Policy Management, Users, and Groups - Part 1',
            postId: 'iam-policy-management-part-1',
            summary:
              'Start creating policies and attaching permissions to users and groups.',
            duration: '12 min',
            difficulty: 'Intermediate',
          },
          {
            id: 'policy-management-part-2',
            title: 'Practice Policy Management, Users, and Groups - Part 2',
            postId: 'iam-policy-management-part-2',
            summary:
              'Continue the permission workflow with more realistic access-control exercises.',
            duration: '12 min',
            difficulty: 'Intermediate',
          },
          {
            id: 'policy-management-part-3',
            title: 'Practice Policy Management, Users, and Groups - Part 3',
            postId: 'iam-policy-management-part-3',
            summary:
              'Finish the exercise series and reinforce how permission inheritance behaves.',
            duration: '12 min',
            difficulty: 'Intermediate',
          },
          {
            id: 'assume-roles-part-1',
            title: 'Practice Creating and Assuming Roles - Part 1',
            postId: 'iam-assume-roles-part-1',
            summary:
              'Begin with the purpose of IAM roles and the trust model behind them.',
            duration: '10 min',
            difficulty: 'Intermediate',
          },
          {
            id: 'assume-roles-part-2',
            title: 'Practice Creating and Assuming Roles - Part 2',
            postId: 'iam-assume-roles-part-2',
            summary:
              'Continue with the mechanics of creating roles and switching into them safely.',
            duration: '10 min',
            difficulty: 'Intermediate',
          },
          {
            id: 'assume-roles-part-3',
            title: 'Practice Creating and Assuming Roles - Part 3',
            postId: 'iam-assume-roles-part-3',
            summary:
              'Wrap up with role usage patterns and common mistakes to watch for.',
            duration: '10 min',
            difficulty: 'Intermediate',
          },
        ],
      },
      {
        id: 'lambda',
        title: 'Lambda',
        description:
          'Placeholder Lambda track so you can add serverless lessons next.',
        accent: '#6d6f8d',
        lessons: [
          {
            id: 'lambda-lesson-1',
            title: 'Lesson 1 Lambda',
            postId: 'lambda-lesson-1',
            summary:
              'Placeholder for your first Lambda lesson.',
            duration: '8 min',
            difficulty: 'Beginner',
          },
          {
            id: 'lambda-lesson-2',
            title: 'Lesson 2 Lambda',
            postId: 'lambda-lesson-2',
            summary:
              'Placeholder for your second Lambda lesson.',
            duration: '10 min',
            difficulty: 'Beginner',
          },
        ],
      },
    ],
  },
  {
    id: 'study-mcp',
    path: '/learning/study-mcp',
    title: 'Study MCP 🔌',
    excerpt: 'A roadmap for learning the Model Context Protocol — servers, clients, tools, and resources.',
    description: 'A reusable learning blog for MCP concepts and hands-on lessons.',
    estimatedHours: 'Growing series',
    level: 'Beginner to Advanced',
    date: '2026-07-25',
    tags: ['Learning Tree', 'MCP'],
    topics: [
      {
        id: 'mcp-basics',
        title: 'MCP Basics',
        description: 'Foundational MCP concepts: hosts, clients, servers, tools, resources, and prompts.',
        accent: '#6d6f8d',
        lessons: [
          {
            id: 'mcp-lesson-1',
            title: 'What is MCP? The USB-C Port for AI Tools',
            postId: 'mcp-lesson-1',
            summary: 'How MCP standardizes AI-to-tool connections with hosts, clients, and servers.',
            duration: '8 min',
            difficulty: 'Beginner',
          },
          {
            id: 'mcp-lesson-2',
            title: 'Lesson 2 MCP',
            postId: 'mcp-lesson-2',
            summary: 'Placeholder for your second MCP lesson.',
            duration: '10 min',
            difficulty: 'Beginner',
          },
        ],
      },
    ],
  },
  {
    id: 'study-react',
    path: '/learning/study-react',
    title: 'Study React ⚛️',
    excerpt: 'A roadmap for learning React — components, hooks, routing, and state management.',
    description: 'A reusable learning blog for React concepts and hands-on lessons.',
    estimatedHours: 'Growing series',
    level: 'Beginner to Advanced',
    date: '2026-07-25',
    tags: ['Learning Tree', 'React'],
    topics: [
      {
        id: 'react-basics',
        title: 'React Basics',
        description: 'Foundational React concepts: components, JSX, props, state, and the virtual DOM.',
        accent: '#6d6f8d',
        lessons: [
          {
            id: 'react-lesson-1',
            title: 'What is React? Components, JSX, and the Virtual DOM Mental Model',
            postId: 'react-lesson-1',
            summary: 'Why React exists and how components, props, state, and the virtual DOM fit together.',
            duration: '8 min',
            difficulty: 'Beginner',
          },
          {
            id: 'react-lesson-2',
            title: 'Lesson 2 React',
            postId: 'react-lesson-2',
            summary: 'Placeholder for your second React lesson.',
            duration: '10 min',
            difficulty: 'Beginner',
          },
        ],
      },
    ],
  },
];

export function getLearningTreeById(id: string): LearningTree | undefined {
  return learningTrees.find((tree) => tree.id === id);
}
