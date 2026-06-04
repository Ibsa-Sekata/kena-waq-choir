import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import apiClient from '../api/axios';
import type { AboutContent, HistoryMilestone } from '../types';

export default function AboutPage() {
  const { data, isLoading } = useQuery<{ content: AboutContent | null; milestones: HistoryMilestone[] }>({
    queryKey: ['about'],
    queryFn: () => apiClient.get('/about').then(r => r.data),
  });

  const content = data?.content;
  const milestones = data?.milestones ?? [];

  const defaultMission = 'KennaWaq Choir exists to glorify God through music, to inspire and uplift the community, and to spread the message of hope and faith through the universal language of song.';
  const defaultVision = 'To be a beacon of musical excellence and spiritual encouragement in Ethiopia and beyond, nurturing talented voices and creating transformative worship experiences that draw people closer to God.';

  return (
    <div>
      <div className="page-hero">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="page-hero-title">About KennaWaq Choir</h1>
            <p className="page-hero-subtitle">Our story, mission, and vision</p>
          </motion.div>
        </div>
      </div>

      <div className="container" style={{ padding: '4rem 1.25rem' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />)}
          </div>
        ) : (
          <>
            {/* Intro */}
            <motion.div
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 4rem' }}
            >
              <h2 className="section-title">Who We Are</h2>
              <div className="section-divider" />
              <p style={{ color: 'var(--color-gray-600)', fontSize: '1.05rem', lineHeight: 1.8 }}>
                KennaWaq Choir is a passionate group of worshippers dedicated to glorifying God through the gift of music. Based in Addis Ababa, Ethiopia, we have been lifting voices in praise since 2015.
              </p>
            </motion.div>

            {/* Mission & Vision */}
            <div className="grid-2" style={{ marginBottom: '4rem', gap: '2rem' }}>
              <motion.div
                initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                style={{
                  background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%)',
                  borderRadius: 'var(--radius-xl)', padding: '2.5rem',
                  border: '1px solid rgba(212,168,67,0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                  }}>🎯</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-gold)' }}>
                    Our Mission
                  </h3>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.8, fontSize: '0.95rem' }}>
                  {content?.mission || defaultMission}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                style={{
                  background: 'linear-gradient(135deg, var(--color-gold-dark) 0%, var(--color-gold) 100%)',
                  borderRadius: 'var(--radius-xl)', padding: '2.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'rgba(13,27,42,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                  }}>🌟</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                    Our Vision
                  </h3>
                </div>
                <p style={{ color: 'rgba(13,27,42,0.8)', lineHeight: 1.8, fontSize: '0.95rem' }}>
                  {content?.vision || defaultVision}
                </p>
              </motion.div>
            </div>

            {/* Values */}
            <motion.div
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              style={{ marginBottom: '4rem' }}
            >
              <h2 className="section-title">Our Values</h2>
              <div className="section-divider" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                {[
                  { icon: '🙏', title: 'Faith', desc: 'Rooted in deep faith and devotion to God' },
                  { icon: '🎵', title: 'Excellence', desc: 'Committed to musical excellence in every performance' },
                  { icon: '🤝', title: 'Community', desc: 'Building a family of worshippers together' },
                  { icon: '❤️', title: 'Love', desc: 'Spreading love through the power of music' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="card" style={{ padding: '1.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{icon}</div>
                    <h4 style={{ fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.5rem' }}>{title}</h4>
                    <p style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem', lineHeight: 1.6 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* History Timeline */}
            {milestones.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              >
                <h2 className="section-title">Our History</h2>
                <div className="section-divider" />
                <p className="section-subtitle">A journey of faith and music</p>

                <div style={{ maxWidth: 640, margin: '0 auto' }}>
                  <div className="timeline">
                    {milestones.map((m) => (
                      <div key={m.id} className="timeline-item">
                        <div className="timeline-dot" />
                        <div className="timeline-year">{m.year}</div>
                        <div className="timeline-desc">{m.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
