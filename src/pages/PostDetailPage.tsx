import { useParams, Link, Navigate } from 'react-router-dom';
import { getPostById } from '../data/posts';
import './PostDetailPage.css';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const post = id ? getPostById(id) : undefined;

  if (!post) {
    return <Navigate to="/404" replace />;
  }

  return (
    <main className="post-detail-page">
      <article className="post-article">
        <header className="post-header">
          <div className="post-tags">
            {post.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="post-title">{post.title}</h1>
          <div className="post-meta">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span className="meta-sep">·</span>
            <span>{post.readTime} min read</span>
          </div>
        </header>

        <div
          className="post-body"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <footer className="post-footer">
          <Link to="/" className="back-link">
            ← Back to all posts
          </Link>
        </footer>
      </article>
    </main>
  );
}
