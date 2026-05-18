import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        🧾 <span>Personal Receipts</span>
      </Link>
      <div className="navbar-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          Dashboard
        </Link>
        <Link to="/contacts" className={location.pathname === '/contacts' ? 'active' : ''}>
          Contacts
        </Link>
        <Link to="/conversations" className={location.pathname === '/conversations' ? 'active' : ''}>
          Communications
        </Link>
      </div>
    </nav>
  )
}