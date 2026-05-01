import PostCard from '../components/PostCard';
import { posts } from '../data/posts';
import './HomePage.css';

export default function HomePage() {
  const sorted = [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <main className="home-page">
      <section className="home-hero">
        <h1 className="home-hero-title">AWS Learning Blog</h1>
        <p className="home-hero-sub">
          Hands-on notes from studying AWS — cloud fundamentals, core services, and real-world patterns.
        </p>
      </section>
      <section className="post-list">
        {sorted.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </section>
    </main>
  );
}
