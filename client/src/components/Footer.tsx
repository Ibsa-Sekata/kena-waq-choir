import { Link } from 'react-router-dom';

const footerLinks = [
  { to: '/songs', label: 'Songs' },
  { to: '/members', label: 'Members' },
  { to: '/events', label: 'Events' },
  { to: '/about', label: 'About' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact & Join' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        background: 'linear-gradient(180deg, var(--color-navy-light) 0%, var(--color-navy) 100%)',
        color: 'var(--color-white)',
        paddingTop: '3.5rem',
        paddingBottom: '1.5rem',
        marginTop: '5rem',
        borderTop: '1px solid rgba(212,168,67,0.15)',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2.5rem',
            marginBottom: '3rem',
          }}
        >
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                }}
              >
                🎵
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-gold)' }}>
                  KennaWaq Choir
                </div>
              </div>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', lineHeight: 1.7, maxWidth: 240 }}>
              Lifting voices in worship and praise. Spreading the message of hope and faith through music.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              {['📘', '📸', '▶️', '🎵'].map((icon, i) => (
                <button
                  key={i}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    transition: 'background 0.2s',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  aria-label={`Social link ${i + 1}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: 'var(--color-gold)', fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
              Quick Links
            </h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {footerLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    style={{
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '0.875rem',
                      transition: 'color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                  >
                    <span style={{ color: 'var(--color-gold)', fontSize: '0.6rem' }}>▶</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: 'var(--color-gold)', fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
              Get In Touch
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { icon: '📧', text: 'info@kennawaqchoir.com' },
                { icon: '📍', text: 'Addis Ababa, Ethiopia' },
                { icon: '📞', text: '+251 900 000 000' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                  <span>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 style={{ color: 'var(--color-gold)', fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
              Stay Updated
            </h4>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.6 }}>
              Get notified about new songs, events, and choir news.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="email"
                placeholder="Your email"
                style={{
                  flex: 1,
                  padding: '0.55rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.07)',
                  color: 'white',
                  fontSize: '0.85rem',
                  outline: 'none',
                  minWidth: 0,
                }}
              />
              <button
                className="btn btn-primary btn-sm"
                style={{ borderRadius: 'var(--radius-full)', flexShrink: 0 }}
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
            © {year} KennaWaq Choir. All rights reserved.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
            Built with ❤️ for the glory of God
          </p>
        </div>
      </div>
    </footer>
  );
}
