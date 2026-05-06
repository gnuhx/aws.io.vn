import { Link } from 'react-router-dom';
import './LazierDeleteAccountPage.css';

export default function LazierDeleteAccountPage() {
  return (
    <main className="lazier-delete-page">
      <article className="lazier-delete-article">
        <Link
          className="lazier-delete-back"
          to="/projects/lazier"
        >
          ← Back to Lazier app page
        </Link>

        <header className="lazier-delete-header">
          <h1>Delete Your Lazier Account</h1>
          <p className="lazier-delete-subtitle">Lazier by Gnuh Le</p>
        </header>

        <section className="lazier-delete-section">
          <p>
            Lazier is a habit tracking app developed by Gnuh Le. This page
            explains how to request deletion of your account and all associated
            data.
          </p>
        </section>

        <section className="lazier-delete-section">
          <h2>How to delete your account</h2>
          <div className="lazier-delete-option">
            <h3>Option 1 — In the app (immediate)</h3>
            <ol>
              <li>Open Lazier on your Android device.</li>
              <li>Go to the Profile tab.</li>
              <li>Tap &quot;Delete account&quot;.</li>
              <li>Enter your password to confirm.</li>
              <li>Your account and all data are deleted immediately.</li>
            </ol>
          </div>
          <div className="lazier-delete-option">
            <h3>Option 2 — By email (if you no longer have the app)</h3>
            <p>
              Send an email to{' '}
              <a href="mailto:huyhunglenguyen@gmail.com">
                huyhunglenguyen@gmail.com
              </a>{' '}
              with subject <strong>&quot;Delete my Lazier account&quot;</strong>{' '}
              and include your username. We will process the request within 7
              days.
            </p>
          </div>
        </section>

        <section className="lazier-delete-section">
          <h2>What gets deleted</h2>
          <ul>
            <li>
              Your username and password hash — deleted permanently from our
              servers.
            </li>
            <li>
              All synced habit data (habit names, descriptions, reminder
              settings) — deleted permanently.
            </li>
            <li>All habit completion logs — deleted permanently.</li>
            <li>
              All local data on your device — deleted immediately when you use
              the in-app option.
            </li>
          </ul>
        </section>

        <section className="lazier-delete-section">
          <h2>What is retained</h2>
          <p>
            No data is retained after deletion. We do not keep backups of
            deleted accounts.
          </p>
        </section>

        <section className="lazier-delete-section">
          <h2>Contact</h2>
          <p>
            For questions:{' '}
            <a href="mailto:huyhunglenguyen@gmail.com">
              huyhunglenguyen@gmail.com
            </a>
          </p>
        </section>
      </article>
    </main>
  );
}
