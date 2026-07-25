import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const modes = [
  { label: 'AWS', to: '/', match: '/learning/stupid-dev-learns-aws' },
  { label: 'MCP', to: '/learning/study-mcp', match: '/learning/study-mcp' },
  { label: 'React', to: '/learning/study-react', match: '/learning/study-react' },
];

export default function Header() {
  const { pathname } = useLocation();

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <span className="header-logo-icon">☁</span>
          <span className="header-logo-text">aws.io.vn</span>
        </Link>
        <nav className="header-modes" aria-label="Study mode">
          {modes.map((mode) => {
            const isActive =
              pathname === '/' ? mode.to === '/' : pathname.startsWith(mode.match);
            return (
              <Link
                key={mode.label}
                to={mode.to}
                className={`header-mode${isActive ? ' header-mode--active' : ''}`}
              >
                {mode.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
