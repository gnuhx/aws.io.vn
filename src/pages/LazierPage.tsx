import { Link } from 'react-router-dom';
import './LazierPage.css';

const features = [
  {
    icon: '📋',
    title: 'Habit tracking',
    description: 'Create and manage unlimited habits with ease.',
  },
  {
    icon: '🔔',
    title: 'Reminders',
    description: 'Optional daily reminders so you never miss a day.',
  },
  {
    icon: '📱',
    title: 'Works offline',
    description: 'All data stored locally on your device by default.',
  },
  {
    icon: '☁️',
    title: 'Optional cloud sync',
    description: 'Sign in to sync your habits across devices.',
  },
];

export default function LazierPage() {
  return (
    <main className="lazier-page">
      <section className="lazier-hero">
        <p className="lazier-eyebrow">Android project showcase</p>
        <h1 className="lazier-title">Lazier</h1>
        <p className="lazier-tagline">Build good habits, one day at a time.</p>
        <div className="lazier-actions">
          <a
            className="lazier-button lazier-button-primary"
            href="#"
          >
            Get it on Google Play
          </a>
          <Link
            className="lazier-button lazier-button-secondary"
            to="/projects/lazier/privacy"
          >
            Privacy Policy
          </Link>
        </div>
      </section>

      <section className="lazier-section">
        <header className="lazier-section-header">
          <h2>Features</h2>
        </header>
        <div className="lazier-feature-grid">
          {features.map((feature) => (
            <article key={feature.title} className="lazier-feature-card">
              <span className="lazier-feature-icon" aria-hidden="true">
                {feature.icon}
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lazier-section">
        <header className="lazier-section-header">
          <h2>About</h2>
        </header>
        <p className="lazier-about">
          Lazier is a no-nonsense habit tracker built for Android. No ads, no
          subscriptions, no trackers. Just you and your habits. Your data stays
          on your device unless you choose to sync.
        </p>
      </section>

      <footer className="lazier-footer">
        <span>© 2025 Gnuh Le · </span>
        <Link to="/projects/lazier/privacy">Privacy Policy</Link>
      </footer>
    </main>
  );
}
