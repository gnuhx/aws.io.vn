import type { LearningTree } from '../types/learningTree';

export const awsLearningTree: LearningTree = {
  id: 'stupid-dev-learns-aws',
  title: 'Stupid Dev Learns AWS',
  description:
    'An interactive developer roadmap for learning AWS fundamentals without pretending the cloud is intuitive on day one.',
  estimatedHours: '12 hours',
  level: 'Beginner to Intermediate',
  topics: [
    {
      id: 'aws-basics',
      title: 'AWS Basics',
      description: 'Start with the core building blocks before touching architecture diagrams.',
      accent: '#f59e0b',
      lessons: [
        {
          id: 'what-is-aws',
          title: 'What is AWS?',
          postId: 'aws-what-is-aws',
          summary: 'A mental model for regions, services, and why AWS feels huge.',
          duration: '5 min',
          difficulty: 'Beginner',
        },
        {
          id: 'iam-basics',
          title: 'IAM Basics',
          postId: 'aws-iam-basics',
          summary: 'Users, groups, policies, and the least-privilege mindset.',
          duration: '7 min',
          difficulty: 'Beginner',
        },
        {
          id: 'ec2-introduction',
          title: 'EC2 Introduction',
          postId: 'aws-ec2-intro',
          summary: 'Virtual servers, key pairs, and security groups in practice.',
          duration: '9 min',
          difficulty: 'Beginner',
        },
      ],
    },
    {
      id: 'networking',
      title: 'Networking',
      description: 'Learn the rails that move packets before you deploy anything serious.',
      accent: '#38bdf8',
      lessons: [
        {
          id: 'vpc',
          title: 'VPC',
          postId: 'aws-vpc-basics',
          summary: 'Your private AWS network and how it sets the blast radius.',
          duration: '6 min',
          difficulty: 'Intermediate',
        },
        {
          id: 'subnets',
          title: 'Subnets',
          postId: 'aws-subnets-basics',
          summary: 'How public and private subnets shape traffic flow.',
          duration: '6 min',
          difficulty: 'Intermediate',
        },
        {
          id: 'security-groups',
          title: 'Security Groups',
          postId: 'aws-security-groups-basics',
          summary: 'Stateful instance firewalls that decide who gets in.',
          duration: '5 min',
          difficulty: 'Intermediate',
        },
      ],
    },
    {
      id: 'deployment',
      title: 'Deployment',
      description: 'Move from single servers toward repeatable, container-friendly delivery.',
      accent: '#a78bfa',
      lessons: [
        {
          id: 'docker-on-aws',
          title: 'Docker on AWS',
          postId: 'aws-docker-on-aws',
          summary: 'Where containers fit across EC2, ECS, and ECR.',
          duration: '7 min',
          difficulty: 'Intermediate',
        },
        {
          id: 'ecs',
          title: 'ECS',
          postId: 'aws-ecs-basics',
          summary: 'Cluster orchestration without managing Kubernetes yourself.',
          duration: '7 min',
          difficulty: 'Intermediate',
        },
        {
          id: 'cicd',
          title: 'CI/CD',
          postId: 'aws-cicd-basics',
          summary: 'Automate build, test, and deployment pipelines on AWS.',
          duration: '8 min',
          difficulty: 'Intermediate',
        },
      ],
    },
  ],
};
