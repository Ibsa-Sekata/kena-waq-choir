import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

const adminLinks = [
  { to: '/admin/songs', icon: '🎵', label: 'Songs', desc: 'Add, edit, delete songs', color: '#4f46e5' },
  { to: '/admin/events', icon: '📅', label: 'Events', desc: 'Manage concerts & programs', color: '#0891b2' },
  { to: '/admin/members', icon: '👥', label: 'Members', desc: 'Manage choir members', color: '#059669' },
  { to: '/admin/gallery', icon: '📸', label: 'Gallery', desc: 'Upload photos & videos', color: '#d97706' },
  { to: '/admin/about', icon: '📖', label: 'About Page', desc: 'Edit mission, vision & history', color: '#7c3aed' },
  { to: '/admin/join-applications', icon: '🎤', label: 'Join Applications', desc: 'Review & approve applicants', color: '#db2777' },
  { to: '/admin/contact-submissions', icon: '📩', label: 'Contact Messages', desc: 'Read visitor messages', color: '#0369a1' },
];

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const { data: songs = [] } = useQuery({ queryKey: ['admin-songs'], queryFn: () => apiClient.get('/songs').then(r => r.data) });
  const { data: events = [] } = useQuery({ queryKey: ['admin-events'], queryFn: () => apiClient.get('/events').then(r => r.data) });
  const { data: members = [] } = useQuery({ queryKey: ['admin-members'], queryFn: () => apiClient.get('/members').then(r => r.data) });
  const { data: gallery = [] } = useQuery({ queryKey: ['admin-gallery'], queryFn: () => apiClient.get('/gallery').then(r => r.data) });
  const { data: applications = [] } = useQuery({ queryKey: ['join-applications'], queryFn: () => apiClient.get('/join').then(r => r.data) });
  const { data: contacts = [] } = useQuery({ queryKey: ['contact-submissions'], queryFn: () => apiClient.get('/contact').then(r => r.data) });

  const pendingApps = (applications as any[]).filter((a: any) => a.status === 'pending').length;

  const stats = [
    { label: 'Songs', value: (songs as any[]).length, icon: '🎵' },
    { label: 'Events', value: (events as any[]).length, icon: '📅' },
    { label: 'Members', value: (members as any[]).length, icon: '👥' },
    { label: 'Gallery Items', value: (gallery as any[]).length, icon: '📸' },
    { label: 'Join Requests', value: pendingApps, icon: '🎤', highlight: pendingApps > 0 },
    { label: 'Messages', value: (contacts as any[]).length, icon: '📩' },
  ];

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Admin Navbar */}
      <header style={{
        background: 'var(--color-navy)', color: 'white',
        padding: '0 1.5rem', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🎵</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-gold)', fontSize: '1rem' }}>KennaWaq Admin</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>CONTROL PANEL</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>← View Site</Link>
          <button onClick={handleLogout} className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)' }}>
            Logout
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.25rem' }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--color-gray-500)', marginBottom: '2rem' }}>Welcome back! Manage your choir content below.</p>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
            {stats.map(({ label, value, icon, highlight }: any) => (
              <div key={label} style={{ background: highlight ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : 'white', borderRadius: 'var(--radius-lg)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)', textAlign: 'center', border: highlight ? '2px solid var(--color-gold)' : 'none' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>{icon}</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: highlight ? 'var(--color-gold-dark)' : 'var(--color-navy)', lineHeight: 1 }}>{value}</div>
                <div style={{ color: 'var(--color-gray-500)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{label}</div>
                {highlight && <div style={{ fontSize: '0.7rem', color: '#b45309', fontWeight: 600, marginTop: '0.25rem' }}>Needs Review</div>}
              </div>
            ))}
          </div>

          {/* Management Cards */}
          <h2 style={{ fontWeight: 700, color: 'var(--color-navy)', marginBottom: '1.25rem', fontSize: '1.1rem' }}>Manage Content</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {adminLinks.map(({ to, icon, label, desc, color }, i) => (
              <motion.div key={to} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Link to={to} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'white', borderRadius: 'var(--radius-lg)', padding: '1.5rem',
                    boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s',
                    borderLeft: `4px solid ${color}`,
                    display: 'flex', alignItems: 'center', gap: '1rem',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'; }}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                      {icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.2rem' }}>{label}</div>
                      <div style={{ color: 'var(--color-gray-500)', fontSize: '0.8rem' }}>{desc}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', color: 'var(--color-gray-400)', fontSize: '1.1rem' }}>→</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
