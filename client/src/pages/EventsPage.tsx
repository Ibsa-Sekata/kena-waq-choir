import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../api/axios';
import type { Event } from '../types';

function EventCard({ event, index }: { event: Event; index: number }) {
  const date = new Date(event.eventDate);
  const isPast = event.eventDate < new Date().toISOString().split('T')[0];

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      style={{ overflow: 'hidden' }}
    >
      <div style={{
        background: isPast
          ? 'linear-gradient(135deg, var(--color-navy-light), var(--color-navy))'
          : 'linear-gradient(135deg, var(--color-gold-dark), var(--color-gold))',
        padding: '1.25rem 1.5rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        <div style={{ textAlign: 'center', minWidth: 52 }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: isPast ? 'var(--color-gold)' : 'var(--color-navy)', lineHeight: 1 }}>
            {date.getDate()}
          </div>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: isPast ? 'rgba(255,255,255,0.6)' : 'rgba(13,27,42,0.7)', textTransform: 'uppercase' }}>
            {date.toLocaleString('default', { month: 'short' })} {date.getFullYear()}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700,
            color: isPast ? 'white' : 'var(--color-navy)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {event.title}
          </h3>
        </div>
      </div>

      <div style={{ padding: '1.25rem 1.5rem' }}>
        <p style={{ color: 'var(--color-gray-500)', fontSize: '0.85rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          📍 {event.location}
        </p>
        <p style={{ color: 'var(--color-gray-600)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          {event.description.slice(0, 140)}{event.description.length > 140 ? '…' : ''}
        </p>
        {event.registrationUrl && !isPast && (
          <a
            href={event.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
          >
            Register Now →
          </a>
        )}
      </div>
    </motion.div>
  );
}

export default function EventsPage() {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('id');

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => apiClient.get('/events').then(r => r.data),
  });

  const today = new Date().toISOString().split('T')[0];
  const upcoming = events
    .filter(e => e.eventDate >= today)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  const past = events
    .filter(e => e.eventDate < today)
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate));

  return (
    <div>
      <div className="page-hero">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="page-hero-title">Events</h1>
            <p className="page-hero-subtitle">Concerts, programs, and celebrations</p>
          </motion.div>
        </div>
      </div>

      <div className="container" style={{ padding: '3rem 1.25rem' }}>
        {isLoading && (
          <div className="grid-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 220, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        )}

        {/* Upcoming */}
        <section style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-navy)' }}>
              Upcoming Events
            </h2>
            <div style={{ flex: 1, height: 1, background: 'var(--color-gray-200)' }} />
            {upcoming.length > 0 && (
              <span style={{ background: 'rgba(212,168,67,0.12)', color: 'var(--color-gold-dark)', borderRadius: 'var(--radius-full)', padding: '0.2rem 0.7rem', fontSize: '0.8rem', fontWeight: 600 }}>
                {upcoming.length}
              </span>
            )}
          </div>

          {upcoming.length === 0 && !isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-gray-100)', borderRadius: 'var(--radius-lg)', color: 'var(--color-gray-400)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📅</div>
              <p>No upcoming events at this time. Check back soon!</p>
            </div>
          ) : (
            <div className="grid-2">
              {upcoming.map((event, i) => (
                <div key={event.id} id={`event-${event.id}`} style={{ scrollMarginTop: '5rem' }}>
                  <EventCard event={event} index={i} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Past */}
        {past.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                Past Events
              </h2>
              <div style={{ flex: 1, height: 1, background: 'var(--color-gray-200)' }} />
            </div>
            <div className="grid-2">
              {past.map((event, i) => (
                <EventCard key={event.id} event={event} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
