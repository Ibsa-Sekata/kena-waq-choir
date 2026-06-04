import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/songs', label: 'Songs' },
  { to: '/members', label: 'Members' },
  { to: '/events', label: 'Events' },
  { to: '/about', label: 'About' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact & Join' },
];

export default function Navbar() {
  const { i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 500,
        background: scrolled
          ? 'rgba(13,27,42,0.97)'
          : 'linear-gradient(180deg, rgba(13,27,42,1) 0%, rgba(13,27,42,0.95) 100%)',
        backdropFilter: 'blur(12px)',
        borderBottom: scrolled ? '1px solid rgba(212,168,67,0.2)' : '1px solid transparent',
        transition: 'all 0.3s ease',
        boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.3)' : 'none',
      }}
    >
      <nav
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '70px',
        }}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              flexShrink: 0,
            }}
          >
            🎵
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1.15rem',
                color: 'var(--color-gold)',
                lineHeight: 1.1,
              }}
            >
              KennaWaq
            </div>
            <div
              style={{
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.55)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Choir
            </div>
          </div>
        </Link>

        {/* Desktop links */}
        <ul
          className="nav-desktop"
          style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}
        >
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                style={({ isActive }) => ({
                  color: isActive ? 'var(--color-gold)' : 'rgba(255,255,255,0.82)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.875rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  background: isActive ? 'rgba(212,168,67,0.12)' : 'transparent',
                  transition: 'all 0.2s ease',
                  display: 'block',
                })}
              >
                {link.label}
              </NavLink>
            </li>
          ))}

          {/* Language toggle */}
          <li style={{ marginLeft: '0.5rem' }}>
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'am' : 'en')}
              aria-label="Toggle language"
              style={{
                color: 'var(--color-gold)',
                fontWeight: 600,
                fontSize: '0.75rem',
                padding: '0.3rem 0.65rem',
                border: '1.5px solid rgba(212,168,67,0.5)',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(212,168,67,0.08)',
                transition: 'all 0.2s ease',
                letterSpacing: '0.05em',
              }}
            >
              {i18n.language === 'en' ? 'አማ' : 'EN'}
            </button>
          </li>
        </ul>

        {/* Hamburger */}
        <button
          className="nav-hamburger"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          style={{
            color: 'var(--color-white)',
            fontSize: '1.4rem',
            padding: '0.4rem',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="nav-mobile"
          style={{
            background: 'rgba(13,27,42,0.98)',
            borderTop: '1px solid rgba(212,168,67,0.15)',
            padding: '1rem 1.25rem 1.5rem',
          }}
        >
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  onClick={() => setMenuOpen(false)}
                  style={({ isActive }) => ({
                    color: isActive ? 'var(--color-gold)' : 'rgba(255,255,255,0.85)',
                    fontWeight: isActive ? 600 : 400,
                    display: 'block',
                    padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: isActive ? 'rgba(212,168,67,0.1)' : 'transparent',
                    fontSize: '0.95rem',
                  })}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => { i18n.changeLanguage(i18n.language === 'en' ? 'am' : 'en'); setMenuOpen(false); }}
              style={{
                color: 'var(--color-gold)',
                fontWeight: 600,
                fontSize: '0.85rem',
                padding: '0.4rem 1rem',
                border: '1.5px solid rgba(212,168,67,0.4)',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(212,168,67,0.08)',
              }}
            >
              {i18n.language === 'en' ? 'Switch to አማርኛ' : 'Switch to English'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
