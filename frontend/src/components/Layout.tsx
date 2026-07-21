import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
  onLogout: () => void;
}

const Layout: React.FC<Props> = ({ children, onLogout }) => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/contacts', label: 'Contacts', icon: '👤' },
    { path: '/conversations', label: 'Conversations', icon: '💬' },
    { path: '/reminders', label: 'Reminders', icon: '⏰' },
    { path: '/birthdays', label: 'Birthdays', icon: '🎂' },
    { path: '/tags', label: 'Tags', icon: '🏷️' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        className="glass"
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: 1400,
            margin: '0 auto'
          }}
        >
          <Link
            to="/"
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              textDecoration: 'none'
            }}
            className="glow-text"
          >
            📱 Contacts DB
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={isActive(item.path) ? 'btn btn-primary' : 'btn btn-muted'}
                style={{ padding: '10px 16px' }}
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Hamburger */}
          <button
            className="hamburger-menu"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <span className="hamburger-icon"></span>
          </button>
        </div>
      </header>

      {/* Mobile Overlay */}
      <div
        className={`mobile-nav-overlay ${menuOpen ? 'active' : ''}`}
        onClick={closeMenu}
      />

      {/* Mobile Menu */}
      <div className={`mobile-nav-menu ${menuOpen ? 'active' : ''}`}>
        <button
          onClick={closeMenu}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '1.5rem',
            cursor: 'pointer',
            alignSelf: 'flex-end',
            marginBottom: 16
          }}
        >
          ✕
        </button>

        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            onClick={closeMenu}
            style={{
              display: 'block',
              padding: '14px 16px',
              marginBottom: 8,
              borderRadius: 8,
              textDecoration: 'none',
              color: 'white',
              background: isActive(item.path) ? 'var(--primary)' : 'transparent'
            }}
          >
            {item.icon} {item.label}
          </Link>
        ))}

        <button
          onClick={() => { closeMenu(); onLogout(); }}
          className="btn btn-danger"
          style={{ marginTop: 24, width: '100%' }}
        >
          🔒 Lock App
        </button>
      </div>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: '24px',
          maxWidth: 1400,
          margin: '0 auto',
          width: '100%'
        }}
      >
        {children}
      </main>

      {/* Footer */}
      <footer
        className="desktop-footer"
        style={{
          textAlign: 'center',
          padding: '16px',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          borderTop: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        Personal Contacts Database © 2025
      </footer>
    </div>
  );
};

export default Layout;