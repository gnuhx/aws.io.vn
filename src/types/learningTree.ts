export interface LearningTreeLesson {
  id: string;
  title: string;
  /** Post id rendered inline inside the tree UI. Omit when using externalUrl instead. */
  postId?: string;
  /** Standalone HTML lesson (own styling/JS) served from public/ and shown in an iframe. */
  externalUrl?: string;
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
  path: string;
  title: string;
  excerpt: string;
  description: string;
  estimatedHours: string;
  level: string;
  date: string;
  tags: string[];
  topics: LearningTreeTopic[];
}
