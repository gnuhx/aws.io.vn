We already have an existing blog website built with:
- Vite
- React
- TypeScript
- TailwindCSS

I want to add a new special blog type called:
"Learning Tree Blog"

This is NOT a normal article page.

Example:
"Stupid Dev Learns AWS 🤡"

The page should visually behave like an interactive roadmap / Git tree / skill tree.

Concept:
- The blog itself is the root node.
- Topics are branches.
- Lessons are child nodes inside topics.
- Users can click nodes to open lesson content.
- Nodes are connected visually like a Git graph or roadmap.

Example structure:

Stupid Dev Learns AWS 🤡(root)
├── AWS Basics
│   ├── What is AWS?
│   ├── IAM Basics
│   ├── EC2 Introduction
│
├── Networking
│   ├── VPC
│   ├── Subnets
│   ├── Security Groups
│
├── Deployment
│   ├── Docker on AWS
│   ├── ECS
│   ├── CI/CD

Important requirements:
- Reuse the existing blog system and component architecture.
- Lessons are still blog posts/components.
- Only the visualization and navigation are different.
- No backend required.
- Data comes from static TypeScript config files.

Tech requirements:
- React Flow for tree visualization
- TailwindCSS styling
- Framer Motion animations
- localStorage for saving progress

Features:
1. Interactive roadmap tree
2. Expand/collapse topic branches
3. Click lesson node → open lesson page/modal/sidebar
4. Completed lesson tracking
5. Progress percentage
6. Zoom and pan canvas
7. Minimap
8. Animated edges
9. Dark developer-style UI
10. Responsive design

Data structure example:

export const awsLearningTree = {
  id: "stupid-dev-learns-aws",
  title: "Stupid Dev Learns AWS 🤡",
  topics: [
    {
      id: "aws-basics",
      title: "AWS Basics",
      lessons: [
        {
          id: "what-is-aws",
          title: "What is AWS?",
          slug: "/blog/aws/what-is-aws"
        }
      ]
    }
  ]
}

Generate:
- scalable folder structure
- reusable roadmap components
- React Flow integration
- custom node components
- tree layout logic
- expand/collapse functionality
- progress tracking system
- example implementation
- modern UI design

The UI should feel like:
- GitHub graph
- SourceTree
- roadmap.sh
- RPG skill tree
- developer learning dashboard