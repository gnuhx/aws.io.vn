import { Link } from 'react-router-dom';
import './LazierPrivacyPage.css';

export default function LazierPrivacyPage() {
  return (
    <main className="lazier-privacy-page">
      <article className="lazier-privacy-article">
        <Link className="lazier-privacy-back" to="/projects/lazier">
          ← Back to Lazier
        </Link>

        <header className="lazier-privacy-header">
          <h1>Lazier – Privacy Policy</h1>
          <p className="lazier-privacy-updated">Last updated: May 5, 2025</p>
        </header>

        <section className="lazier-privacy-section">
          <h2>Overview</h2>
          <p>
            Lazier (&quot;the app&quot;) is an Android habit-tracking app developed by
            Gnuh Le. This policy explains what data the app collects and how it
            is used.
          </p>
        </section>

        <section className="lazier-privacy-section">
          <h2>Data collected</h2>
          <ul>
            <li>
              The app stores habit data (habit names, descriptions, reminder
              times, completion logs) locally on your device by default.
            </li>
            <li>
              If you choose to create an account, the app also collects your
              username and password (sent over HTTPS) and may upload your habit
              data to our servers for cloud sync.
            </li>
            <li>
              The app does not collect any data if you use it without an
              account.
            </li>
          </ul>
        </section>

        <section className="lazier-privacy-section">
          <h2>How we use your data</h2>
          <ul>
            <li>Account credentials are used only for authentication.</li>
            <li>
              Habit data uploaded during sync is stored solely to provide the
              sync feature.
            </li>
            <li>
              We do not sell, share, or use your data for advertising or
              analytics.
            </li>
          </ul>
        </section>

        <section className="lazier-privacy-section">
          <h2>Third-party services</h2>
          <p>
            The app does not include any third-party advertising, analytics, or
            crash reporting SDKs.
          </p>
        </section>

        <section className="lazier-privacy-section">
          <h2>Data security</h2>
          <p>
            All communication between the app and our servers is encrypted using
            HTTPS. Passwords are not stored in plain text.
          </p>
        </section>

        <section className="lazier-privacy-section">
          <h2>Your rights</h2>
          <p>
            You can stop cloud sync at any time by signing out of your account.
            To request deletion of your account and associated data, visit our{' '}
            <Link to="/projects/lazier/delete-account">
              account deletion page
            </Link>{' '}
            or contact us at the email below.
          </p>
        </section>

        <section className="lazier-privacy-section">
          <h2>Contact</h2>
          <p>
            Email:{' '}
            <a href="mailto:huyhunglenguyen@gmail.com">
              huyhunglenguyen@gmail.com
            </a>
          </p>
        </section>

        <section className="lazier-privacy-section">
          <h2>Changes to this policy</h2>
          <p>
            We may update this policy. The &quot;last updated&quot; date at the top
            reflects the most recent revision.
          </p>
        </section>
      </article>
    </main>
  );
}
