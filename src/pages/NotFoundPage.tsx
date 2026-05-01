import { Link } from 'react-router-dom';
import './NotFoundPage.css';

export default function NotFoundPage() {
  return (
    <main className="not-found-page">
      <div className="not-found-inner">
        <span className="not-found-code">404</span>
        <h1 className="not-found-title">Page not found</h1>
        <p className="not-found-message">
          This page doesn't exist. The post may have been moved or the URL is incorrect.
        </p>
        <Link to="/" className="not-found-home-link">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
