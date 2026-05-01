export interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string; // HTML string
  date: string;    // ISO date string
  readTime: number; // minutes
  tags: string[];
}
