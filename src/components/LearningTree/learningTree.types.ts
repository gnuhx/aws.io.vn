import type { Edge, Node } from '@xyflow/react';
import type { LearningTreeLesson, LearningTreeTopic } from '../../types/learningTree';

export type TreeNodeData = Record<string, unknown> & {
  kind: 'root' | 'topic' | 'lesson';
  title: string;
  subtitle: string;
  accent: string;
  isCollapsed?: boolean;
  isCompleted?: boolean;
  progressText?: string;
  lesson?: LearningTreeLesson;
  topic?: LearningTreeTopic;
  onToggleTopic?: (topicId: string) => void;
  onOpenLesson?: (lesson: LearningTreeLesson) => void;
};

export type TreeFlowNode = Node<TreeNodeData, 'learningTreeNode'>;
export type TreeFlowEdge = Edge<Record<string, never>, 'animatedTreeEdge'>;
