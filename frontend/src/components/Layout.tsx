import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
  onLogout: () => void;
}

const Layout: React.FC<Props> = ({ children, onLogout }) => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  const navLinks = [
    { path: '/', label: '📋 Dashboard' },
    { path: '/contacts', label: '📇 Contacts' },
    { path: '/conversations', label: '💬 Communications' },
    { path: '/birthdays', label: '🎂 Birthdays' },
    { path: '/tags', label: '🏷️ Tags' },
    { path: '/settings', label: '⚙️ Settings' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Desktop Nav */}
      <nav style={{ background: '#1a1a2e', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, position: 'sticky', top: 0, zIndex: 100 }}>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 700 }}>
          🧾 Personal Receipts
        </Link>

        {/* Desktop Links */}
        <div style={{ display: 'flex', gap: 4 }} className="desktop-nav">
          {navLinks.map(link => (
            <Link key={link.path} to={link.path}
              style={{ color: isActive(link.path) ? '#fff' : '#b2bec3', textDecoration: 'none', padding: '6px 12px', borderRadius: 8, fontWeight: 500, fontSize: '0.85rem', background: isActive(link.path) ? '#2d2d44' : 'transparent' }}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile Hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)}
          style={{ display: 'none', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
          className="hamburger">
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{ background: '#2d2d44', position: 'sticky', top: 64, zIndex: 99, padding: '12px 0' }} className="mobile-menu">
          {navLinks.map(link => (
            <Link key={link.path} to={link.path}
              onClick={() => setMenuOpen(false)}
              style={{ display: 'block', color: isActive(link.path) ? '#fff' : '#b2bec3', textDecoration: 'none', padding: '12px 24px', fontWeight: 500, fontSize: '0.95rem', background: isActive(link.path) ? '#3d3d5c' : 'transparent' }}>
              {link.label}
            </Link>
          ))}
          <button onClick={() => { localStorage.removeItem('pr_token'); onLogout(); }}
            style={{ display: 'block', width: '100%', textAlign: 'left', color: '#ff6b6b', background: 'none', border: 'none', padding: '12px 24px', fontWeight: 500, fontSize: '0.95rem', cursor: 'pointer' }}>
            🔒 Lock App
          </button>
        </div>
      )}

      <main style={{ padding: '24px 16px', maxWidth: 1400, margin: '0 auto' }}>
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="mobile-bottom-nav" style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1a1a2e', borderTop: '1px solid #2d2d44', zIndex: 100 }}>
        {[
          { path: '/', label: '📋', text: 'Home' },
          { path: '/contacts', label: '📇', text: 'Contacts' },
          { path: '/conversations', label: '💬', text: 'Comms' },
          { path: '/birthdays', label: '🎂', text: 'Bdays' },
          { path: '/settings', label: '⚙️', text: 'Settings' },
        ].map(link => (
          <Link key={link.path} to={link.path}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', textDecoration: 'none', color: isActive(link.path) ? '#a29bfe' : '#636e72', fontSize: '0.65rem', gap: 2 }}>
            <span style={{ fontSize: '1.3rem' }}>{link.label}</span>
            {link.text}
          </Link>
        ))}
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: block !important; }
          .mobile-bottom-nav { display: flex !important; }
          main { padding-bottom: 80px !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu { display: none !important; }
        }
        * { box-sizing: border-box; }
        input, select, textarea, button { font-family: inherit; }
        @media (max-width: 600px) {
          h1 { font-size: 1.4rem !important; }
          table { font-size: 0.8rem; }
        }
      `}</style>
    </div>
  );
};

export default Layout;
