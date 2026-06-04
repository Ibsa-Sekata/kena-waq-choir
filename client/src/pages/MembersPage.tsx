import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import apiClient from '../api/axios';
import type { Member } from '../types';

const ROLE_ORDER = ['Choir Leader', 'Soprano', 'Alto', 'Tenor', 'Bass'] as const;
const ROLE_ICONS: Record<string, string> = {
  'Choir Leader': '👑',
  'Soprano': '🎶',
  'Alto': '🎵',
  'Tenor': '🎤',
  'Bass': '🎸',
};

function MemberCard({ member, index }: { member: Member; index: number }) {
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      style={{ padding: '1.5rem', textAlign: 'center' }}
    >
      <div style={{
        width: 90, height: 90, borderRadius: '50%', margin: '0 auto 1rem',
        overflow: 'hidden', border: '3px solid var(--color-gold)',
        background: 'linear-gradient(135deg, var(--color-navy), var(--color-navy-light))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2.5rem',
      }}>
        {member.imageUrl && !member.imageUrl.includes('placeholder') ? (
          <img
            src={member.imageUrl}
            alt={member.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : '🎵'}
      </div>
      <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-navy)', marginBottom: '0.25rem' }}>
        {member.name}
      </h3>
      <p style={{ color: 'var(--color-gray-500)', fontSize: '0.85rem' }}>{member.role}</p>
    </motion.div>
  );
}

export default function MembersPage() {
  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ['members'],
    queryFn: () => apiClient.get('/members').then(r => r.data),
  });

  const grouped = ROLE_ORDER.reduce((acc, role) => {
    const group = members.filter(m => m.roleCategory === role);
    if (group.length > 0) acc[role] = group;
    return acc;
  }, {} as Record<string, Member[]>);

  return (
    <div>
      <div className="page-hero">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="page-hero-title">Our Team</h1>
            <p className="page-hero-subtitle">The voices behind KennaWaq Choir</p>
          </motion.div>
        </div>
      </div>

      <div className="container" style={{ padding: '3rem 1.25rem' }}>
        {isLoading && (
          <div className="grid-cards">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        )}

        {!isLoading && members.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-gray-400)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
            <p style={{ fontSize: '1.1rem' }}>No members found</p>
          </div>
        )}

        {Object.entries(grouped).map(([role, group]) => (
          <section key={role} style={{ marginBottom: '3.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{ROLE_ICONS[role] || '🎵'}</span>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700,
                color: 'var(--color-navy)',
              }}>
                {role === 'Choir Leader' ? 'Choir Leadership' : `${role}s`}
              </h2>
              <div style={{ flex: 1, height: 1, background: 'var(--color-gray-200)' }} />
              <span style={{
                background: 'rgba(212,168,67,0.12)', color: 'var(--color-gold-dark)',
                borderRadius: 'var(--radius-full)', padding: '0.2rem 0.7rem',
                fontSize: '0.8rem', fontWeight: 600,
              }}>
                {group.length}
              </span>
            </div>
            <div className="grid-cards">
              {group.map((member, i) => (
                <MemberCard key={member.id} member={member} index={i} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
