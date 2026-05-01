import { Link } from 'react-router-dom';
import type { Post } from '../types/post';
import './PostCard.css';

interface Props {
  post: Post;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function PostCard({ post }: Props) {
  return (
    <article className="post-card">
      <div className="post-card-tags">
        {post.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>
      <Link to={`/post/${post.id}`} className="post-card-title-link">
        <h2 className="post-card-title">{post.title}</h2>
      </Link>
      <p className="post-card-excerpt">{post.excerpt}</p>
      <div className="post-card-meta">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span className="meta-sep">·</span>
        <span>{post.readTime} min read</span>
      </div>
    </article>
  );
}
