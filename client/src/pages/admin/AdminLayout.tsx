import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/admin', icon: '🏠', label: 'Dashboard', exact: true },
  { to: '/admin/songs', icon: '🎵', label: 'Songs' },
  { to: '/admin/events', icon: '📅', label: 'Events' },
  { to: '/admin/members', icon: '👥', label: 'Members' },
  { to: '/admin/gallery', icon: '📸', label: 'Gallery' },
];

export default function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <header style={{
        background: 'var(--color-navy)', color: 'white',
        padding: '0 1.5rem', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🎵</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-gold)', fontSize: '1rem' }}>KennaWaq Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem' }}>← View Site</Link>
          <button onClick={handleLogout} style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '0.3rem 0.85rem', fontSize: '0.8rem', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{ width: 220, background: 'white', borderRight: '1px solid var(--color-gray-200)', padding: '1.5rem 0', flexShrink: 0, minHeight: 'calc(100vh - 64px)' }}>
          <nav>
            {navItems.map(({ to, icon, label, exact }) => {
              const isActive = exact ? location.pathname === to : location.pathname.startsWith(to) && to !== '/admin';
              const isExactActive = to === '/admin' && location.pathname === '/admin';
              const active = isExactActive || (!exact && isActive);
              return (
                <Link
                  key={to}
                  to={to}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.7rem 1.25rem', margin: '0.1rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: active ? 'rgba(212,168,67,0.1)' : 'transparent',
                    color: active ? 'var(--color-gold-dark)' : 'var(--color-gray-600)',
                    fontWeight: active ? 600 : 400,
                    fontSize: '0.9rem',
                    transition: 'all 0.15s',
                    textDecoration: 'none',
                    borderLeft: active ? '3px solid var(--color-gold)' : '3px solid transparent',
                  }}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '1.5rem' }}>
            {title}
          </h1>
          {children}
        </main>
      </div>
    </div>
  );
}
