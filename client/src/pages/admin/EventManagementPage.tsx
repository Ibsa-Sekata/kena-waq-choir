import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../api/axios';
import AdminLayout from './AdminLayout';
import type { Event } from '../../types';

type EventForm = { title: string; eventDate: string; location: string; description: string; registrationUrl?: string };

function EventFormModal({ event, onClose }: { event?: Event; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<EventForm>({
    defaultValues: event ? { title: event.title, eventDate: event.eventDate, location: event.location, description: event.description, registrationUrl: event.registrationUrl || '' } : {},
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data: EventForm) => {
    setSaving(true); setError('');
    try {
      if (event) await apiClient.put(`/events/${event.id}`, data);
      else await apiClient.post('/events', data);
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      onClose();
    } catch { setError('Failed to save. Please try again.'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '2rem', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-navy)' }}>{event ? 'Edit Event' : 'Add New Event'}</h2>
          <button onClick={onClose} style={{ fontSize: '1.25rem', color: 'var(--color-gray-400)' }}>✕</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Event Title *</label>
            <input className="form-input" placeholder="Concert name" {...register('title', { required: 'Required' })} />
            {errors.title && <span className="form-error">{errors.title.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input className="form-input" type="date" {...register('eventDate', { required: 'Required' })} />
            {errors.eventDate && <span className="form-error">{errors.eventDate.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Location *</label>
            <input className="form-input" placeholder="Venue, City" {...register('location', { required: 'Required' })} />
            {errors.location && <span className="form-error">{errors.location.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="form-textarea" placeholder="Event details..." {...register('description', { required: 'Required' })} />
            {errors.description && <span className="form-error">{errors.description.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Registration URL (optional)</label>
            <input className="form-input" placeholder="https://tickets.example.com/..." {...register('registrationUrl')} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Saving…' : event ? 'Save Changes' : 'Add Event'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function EventManagementPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | Event | null>(null);

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['admin-events'],
    queryFn: () => apiClient.get('/events').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/events/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-events'] }),
  });

  const today = new Date().toISOString().split('T')[0];

  return (
    <AdminLayout title="Event Management">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--color-gray-500)' }}>{events.length} events total</p>
        <button className="btn btn-primary" onClick={() => setModal('create')}>+ Add Event</button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {events.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-gray-400)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📅</div>
              <p>No events yet. Add your first event!</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-gray-100)', borderBottom: '1px solid var(--color-gray-200)' }}>
                  {['Title', 'Date', 'Location', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((event, i) => {
                  const isPast = event.eventDate < today;
                  return (
                    <tr key={event.id} style={{ borderBottom: i < events.length - 1 ? '1px solid var(--color-gray-100)' : 'none' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--color-navy)' }}>{event.title}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--color-gray-600)', fontSize: '0.875rem' }}>
                        {new Date(event.eventDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--color-gray-500)', fontSize: '0.85rem' }}>{event.location}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600,
                          background: isPast ? 'rgba(107,114,128,0.1)' : 'rgba(34,197,94,0.1)',
                          color: isPast ? 'var(--color-gray-500)' : '#15803d',
                        }}>
                          {isPast ? 'Past' : 'Upcoming'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-outline" onClick={() => setModal(event)}>Edit</button>
                          <button onClick={() => { if (window.confirm(`Delete "${event.title}"?`)) deleteMutation.mutate(event.id); }}
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '0.3rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <EventFormModal
            event={modal !== 'create' ? modal : undefined}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
