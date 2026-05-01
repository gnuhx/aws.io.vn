import { Link } from 'react-router-dom';
import './Header.css';

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <span className="header-logo-icon">☁</span>
          <span className="header-logo-text">aws.io.vn</span>
        </Link>
        <p className="header-tagline">Learning AWS, one service at a time.</p>
      </div>
    </header>
  );
}
