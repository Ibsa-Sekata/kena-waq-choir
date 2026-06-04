import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../api/axios';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import type { Song, Event } from '../types';

function SongCard({ song, allSongs }: { song: Song; allSongs: Song[] }) {
  const { play, state } = useAudioPlayer();
  const isPlaying = state.currentTrack?.id === song.id && state.isPlaying;

  return (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <button
        onClick={() => play(song, allSongs)}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        style={{
          width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
          background: isPlaying
            ? 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))'
            : 'var(--color-navy)',
          color: isPlaying ? 'var(--color-navy)' : 'var(--color-gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', transition: 'all 0.2s',
          border: '2px solid var(--color-gold)',
        }}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {song.title}
        </p>
        <span className={`badge badge-${song.category}`} style={{ marginTop: '0.25rem' }}>
          {song.category}
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { play } = useAudioPlayer();

  const { data: dailySong } = useQuery<Song>({
    queryKey: ['daily-worship'],
    queryFn: () => apiClient.get('/songs/daily-worship').then(r => r.data),
  });

  const { data: songs = [] } = useQuery<Song[]>({
    queryKey: ['songs'],
    queryFn: () => apiClient.get('/songs').then(r => r.data),
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => apiClient.get('/events').then(r => r.data),
  });

  const today = new Date().toISOString().split('T')[0];
  const upcomingEvent = events.find(e => e.eventDate >= today);
  const featuredSongs = songs.slice(0, 4);

  return (
    <div>
      {/* ── Hero ── */}
      <section
        style={{
          minHeight: '92vh',
          background: 'linear-gradient(135deg, var(--color-navy) 0%, #0a1628 50%, #1a2a3a 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden', textAlign: 'center',
        }}
      >
        {/* Decorative circles */}
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${300 + i * 200}px`, height: `${300 + i * 200}px`,
            borderRadius: '50%',
            border: `1px solid rgba(212,168,67,${0.06 - i * 0.015})`,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }} />
        ))}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 30%, rgba(212,168,67,0.08) 0%, transparent 65%)',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.3)',
              borderRadius: 'var(--radius-full)', padding: '0.4rem 1rem',
              color: 'var(--color-gold)', fontSize: '0.8rem', fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem',
            }}>
              🎵 Welcome to KennaWaq Choir
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(2.8rem, 8vw, 5.5rem)',
              fontWeight: 700, color: 'var(--color-white)', lineHeight: 1.1,
              marginBottom: '1.25rem',
            }}>
              Lifting Voices<br />
              <span style={{ color: 'var(--color-gold)' }}>in Worship</span>
            </h1>

            <p style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', color: 'rgba(255,255,255,0.7)',
              maxWidth: 560, margin: '0 auto 2.5rem', lineHeight: 1.7,
            }}>
              Experience the power of praise through music that touches the soul and glorifies God.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/songs')}>
                🎵 Listen Now
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => navigate('/contact')}>
                Join the Choir
              </button>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', letterSpacing: '0.1em',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
        }}>
          <span>SCROLL</span>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, rgba(212,168,67,0.5), transparent)' }} />
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ background: 'var(--color-navy)', padding: '2.5rem 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
            {[
              { num: '50+', label: 'Members' },
              { num: '100+', label: 'Songs' },
              { num: '10+', label: 'Years' },
              { num: '200+', label: 'Concerts' },
            ].map(({ num, label }) => (
              <div key={label}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 700, color: 'var(--color-gold)' }}>{num}</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Daily Worship Song ── */}
      {dailySong && (
        <section style={{ padding: '5rem 0', background: 'var(--color-off-white)' }}>
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <h2 className="section-title">Daily Worship Song</h2>
              <div className="section-divider" />
              <p className="section-subtitle">A new song of praise every day</p>

              <div style={{
                maxWidth: 600, margin: '0 auto',
                background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%)',
                borderRadius: 'var(--radius-xl)', padding: '2.5rem',
                display: 'flex', alignItems: 'center', gap: '2rem',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid rgba(212,168,67,0.2)',
                flexWrap: 'wrap',
              }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
                }}>
                  🎵
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'var(--color-gold)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
                    Today's Featured Song
                  </p>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'white', marginBottom: '0.5rem' }}>
                    {dailySong.title}
                  </h3>
                  <span className={`badge badge-${dailySong.category}`}>{dailySong.category}</span>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => play(dailySong, [dailySong])}
                  style={{ flexShrink: 0 }}
                >
                  ▶ Play Now
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Featured Songs ── */}
      {featuredSongs.length > 0 && (
        <section style={{ padding: '5rem 0' }}>
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <h2 className="section-title">Our Music</h2>
              <div className="section-divider" />
              <p className="section-subtitle">Songs of worship, praise, and celebration</p>

              <div className="grid-cards" style={{ marginBottom: '2rem' }}>
                {featuredSongs.map(song => (
                  <SongCard key={song.id} song={song} allSongs={songs} />
                ))}
              </div>

              <div style={{ textAlign: 'center' }}>
                <Link to="/songs" className="btn btn-outline">View All Songs →</Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Upcoming Event ── */}
      {upcomingEvent && (
        <section style={{ padding: '5rem 0', background: 'var(--color-navy)' }}>
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <h2 className="section-title" style={{ color: 'white' }}>Upcoming Event</h2>
              <div className="section-divider" />
              <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.55)' }}>Don't miss our next performance</p>

              <div style={{
                maxWidth: 700, margin: '0 auto',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(212,168,67,0.2)',
                borderRadius: 'var(--radius-xl)', padding: '2.5rem',
              }}>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))',
                    borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
                    textAlign: 'center', minWidth: 64, flexShrink: 0,
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-navy)', lineHeight: 1 }}>
                      {new Date(upcomingEvent.eventDate).getDate()}
                    </div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-navy)', textTransform: 'uppercase' }}>
                      {new Date(upcomingEvent.eventDate).toLocaleString('default', { month: 'short' })}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'white', marginBottom: '0.5rem' }}>
                      {upcomingEvent.title}
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                      📍 {upcomingEvent.location}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      {upcomingEvent.description.slice(0, 150)}{upcomingEvent.description.length > 150 ? '…' : ''}
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                      {upcomingEvent.registrationUrl && (
                        <a href={upcomingEvent.registrationUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                          Register Now
                        </a>
                      )}
                      <Link to="/events" className="btn btn-outline btn-sm">View All Events</Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section style={{
        padding: '5rem 0',
        background: 'linear-gradient(135deg, var(--color-gold-dark) 0%, var(--color-gold) 100%)',
        textAlign: 'center',
      }}>
        <div className="container">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '1rem' }}>
              Ready to Join the Choir?
            </h2>
            <p style={{ color: 'rgba(13,27,42,0.7)', fontSize: '1.1rem', marginBottom: '2rem', maxWidth: 480, margin: '0 auto 2rem' }}>
              We welcome all voices. Come worship with us and be part of something beautiful.
            </p>
            <Link to="/contact" className="btn btn-lg" style={{ background: 'var(--color-navy)', color: 'var(--color-gold)', border: '2px solid var(--color-navy)' }}>
              Apply to Join →
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
