import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const GRADE_COLORS: Record<string, string> = {
  Unranked: '#888888',
  Bronze:   '#CD7F32',
  Silver:   '#C0C0C0',
  Gold:     '#FFD700',
};

function GradePill({ grade }: { grade: string }) {
  const color = GRADE_COLORS[grade] ?? '#888888';
  return (
    <span
      className="pixel-font"
      style={{
        fontSize: '0.4rem',
        color,
        border: `2px solid ${color}`,
        padding: '0.25rem 0.5rem',
        boxShadow: `2px 2px 0 ${color}44`,
        whiteSpace: 'nowrap',
        letterSpacing: '0.05em',
        lineHeight: 1.6,
      }}
      aria-label={`Grade: ${grade}`}
    >
      {grade.toUpperCase()}
    </span>
  );
}

const activeStyle: React.CSSProperties = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'var(--pixel-gold)',
  textDecoration: 'none',
  borderBottom: '2px solid var(--pixel-gold)',
  paddingBottom: '2px',
};

const inactiveStyle: React.CSSProperties = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#ccc',
  textDecoration: 'none',
  borderBottom: '2px solid transparent',
  paddingBottom: '2px',
  transition: 'color 0.15s',
};

const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties =>
  isActive ? activeStyle : inactiveStyle;

const navLinks = [
  { to: '/dashboard',     label: 'Dashboard' },
  { to: '/cv-upload',     label: 'Upload CV' },
  { to: '/courses',       label: 'Courses' },
  { to: '/learning-path', label: '🗺️ Path' },
  { to: '/jobs',          label: 'Jobs' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const user   = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <nav
      style={{
        backgroundColor: 'var(--pixel-accent)',
        borderBottom: '4px solid var(--pixel-gold)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
      aria-label="Main navigation"
    >
      {/* ── Top bar ── */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '56px',
        }}
      >
        {/* Logo */}
        <NavLink
          to="/dashboard"
          style={{ textDecoration: 'none', flexShrink: 0 }}
          aria-label="Talent Bridge home"
        >
          <span
            className="pixel-font"
            style={{ color: 'var(--pixel-gold)', fontSize: '0.6rem', letterSpacing: '0.05em' }}
          >
            TALENT BRIDGE
          </span>
        </NavLink>

        {/* Desktop nav links (hidden on mobile via CSS) */}
        <div
          id="desktop-links"
          style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}
          role="menubar"
          aria-label="Desktop navigation"
        >
          {navLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} style={navLinkStyle} role="menuitem">
              {label}
            </NavLink>
          ))}
        </div>

        {/* Grade pill + logout — always visible */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          {user && <GradePill grade={user.grade} />}

          {/* Logout — visible on desktop only; mobile gets it in dropdown */}
          <button
            onClick={handleLogout}
            className="pixel-btn"
            id="desktop-logout"
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: '0.4rem',
              padding: '0.4rem 0.7rem',
              backgroundColor: 'transparent',
              color: '#e74c3c',
              border: '2px solid #e74c3c',
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
            aria-label="Logout"
          >
            LOGOUT
          </button>

          {/* Hamburger button — hidden on desktop via CSS */}
          <button
            id="hamburger-btn"
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              color: '#e0e0e0',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem',
              lineHeight: 1,
              display: 'none',        /* CSS overrides to flex on mobile */
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown menu ── */}
      {menuOpen && (
        <div
          id="mobile-menu"
          role="menu"
          aria-label="Mobile navigation"
          style={{
            backgroundColor: 'var(--pixel-accent)',
            borderTop: '2px solid #334',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              style={navLinkStyle}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}

          {/* Grade + logout in mobile dropdown */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid #334',
              flexWrap: 'wrap',
            }}
          >
            {user && <GradePill grade={user.grade} />}
            <button
              onClick={() => { setMenuOpen(false); handleLogout(); }}
              className="pixel-btn"
              style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '0.4rem',
                padding: '0.4rem 0.7rem',
                backgroundColor: 'transparent',
                color: '#e74c3c',
                border: '2px solid #e74c3c',
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
              aria-label="Logout"
            >
              LOGOUT
            </button>
          </div>
        </div>
      )}

      {/* Desktop logout and desktop-links visibility controlled via index.css media queries */}
      <style>{`
        @media (max-width: 640px) {
          #desktop-links   { display: none !important; }
          #desktop-logout  { display: none !important; }
          #hamburger-btn   { display: flex !important; }
        }
        @media (min-width: 641px) {
          #mobile-menu   { display: none !important; }
          #hamburger-btn { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
