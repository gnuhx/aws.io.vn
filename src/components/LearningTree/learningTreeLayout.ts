import type { LearningTree, LearningTreeLesson } from '../../types/learningTree';
import type { TreeFlowEdge, TreeFlowNode } from './learningTree.types';

interface BuildTreeFlowOptions {
  collapsedTopicIds: Set<string>;
  completedLessonIds: Set<string>;
  onToggleTopic: (topicId: string) => void;
  onOpenLesson: (lesson: LearningTreeLesson) => void;
}

const ROOT_X = 40;
const ROOT_Y = 80;
const TOPIC_X = 340;
const LESSON_X = 690;
const TOPIC_GAP = 250;
const LESSON_GAP = 108;

export function buildTreeFlow(
  tree: LearningTree,
  options: BuildTreeFlowOptions
): { nodes: TreeFlowNode[]; edges: TreeFlowEdge[] } {
  const nodes: TreeFlowNode[] = [];
  const edges: TreeFlowEdge[] = [];

  const totalLessons = tree.topics.reduce(
    (sum, topic) => sum + topic.lessons.length,
    0
  );
  const completedLessons = tree.topics.reduce(
    (sum, topic) =>
      sum +
      topic.lessons.filter((lesson) =>
        options.completedLessonIds.has(lesson.id)
      ).length,
    0
  );

  nodes.push({
    id: tree.id,
    type: 'learningTreeNode',
    position: { x: ROOT_X, y: ROOT_Y + TOPIC_GAP },
    data: {
      kind: 'root',
      title: tree.title,
      subtitle: tree.description,
      accent: '#f97316',
      progressText: `${completedLessons}/${totalLessons} lessons complete`,
    },
    draggable: false,
    selectable: false,
  });

  tree.topics.forEach((topic, topicIndex) => {
    const topicY = ROOT_Y + topicIndex * TOPIC_GAP;
    const topicCompleted = topic.lessons.filter((lesson) =>
      options.completedLessonIds.has(lesson.id)
    ).length;
    const isCollapsed = options.collapsedTopicIds.has(topic.id);

    nodes.push({
      id: topic.id,
      type: 'learningTreeNode',
      position: { x: TOPIC_X, y: topicY },
      data: {
        kind: 'topic',
        title: topic.title,
        subtitle: topic.description,
        accent: topic.accent,
        topic,
        isCollapsed,
        progressText: `${topicCompleted}/${topic.lessons.length} complete`,
        onToggleTopic: options.onToggleTopic,
      },
      draggable: false,
    });

    edges.push({
      id: `${tree.id}-${topic.id}`,
      source: tree.id,
      target: topic.id,
      type: 'animatedTreeEdge',
      animated: true,
    });

    if (isCollapsed) {
      return;
    }

    topic.lessons.forEach((lesson, lessonIndex) => {
      const lessonY = topicY + lessonIndex * LESSON_GAP;
      const isCompleted = options.completedLessonIds.has(lesson.id);

      nodes.push({
        id: lesson.id,
        type: 'learningTreeNode',
        position: { x: LESSON_X, y: lessonY },
        data: {
          kind: 'lesson',
          title: lesson.title,
          subtitle: `${lesson.duration} • ${lesson.difficulty}`,
          accent: topic.accent,
          lesson,
          isCompleted,
          onOpenLesson: options.onOpenLesson,
        },
        draggable: false,
      });

      edges.push({
        id: `${topic.id}-${lesson.id}`,
        source: topic.id,
        target: lesson.id,
        type: 'animatedTreeEdge',
        animated: true,
      });
    });
  });

  return { nodes, edges };
}
