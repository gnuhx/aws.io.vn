export interface LearningTreeLesson {
  id: string;
  title: string;
  postId: string;
  summary: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface LearningTreeTopic {
  id: string;
  title: string;
  description: string;
  accent: string;
  lessons: LearningTreeLesson[];
}

export interface LearningTree {
  id: string;
  title: string;
  description: string;
  estimatedHours: string;
  level: string;
  topics: LearningTreeTopic[];
}
