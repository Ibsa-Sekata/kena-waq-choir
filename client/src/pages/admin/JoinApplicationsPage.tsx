import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import apiClient from '../../api/axios';
import AdminLayout from './AdminLayout';

type Application = {
  id: number;
  name: string;
  voice_type: string;
  experience_level: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
};

const STATUS_COLORS = {
  pending: { bg: 'rgba(245,158,11,0.1)', color: '#b45309', label: '⏳ Pending' },
  approved: { bg: 'rgba(34,197,94,0.1)', color: '#15803d', label: '✅ Approved' },
  rejected: { bg: 'rgba(239,68,68,0.1)', color: '#b91c1c', label: '❌ Rejected' },
};

function ReviewModal({ app, onClose }: { app: Application; onClose: () => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>(app.status);
  const [notes, setNotes] = useState(app.admin_notes || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await apiClient.patch(`/join/${app.id}`, { status, adminNotes: notes });
      qc.invalidateQueries({ queryKey: ['join-applications'] });
      onClose();
    } catch { alert('Failed to update. Try again.'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '2rem', width: '100%', maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-navy)' }}>Review Application</h2>
          <button onClick={onClose} style={{ fontSize: '1.25rem', color: 'var(--color-gray-400)' }}>✕</button>
        </div>

        <div style={{ background: 'var(--color-gray-100)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div><span style={{ color: 'var(--color-gray-500)' }}>Name:</span><br /><strong>{app.name}</strong></div>
            <div><span style={{ color: 'var(--color-gray-500)' }}>Voice Type:</span><br /><strong>{app.voice_type}</strong></div>
            <div><span style={{ color: 'var(--color-gray-500)' }}>Experience:</span><br /><strong>{app.experience_level}</strong></div>
            <div><span style={{ color: 'var(--color-gray-500)' }}>Applied:</span><br /><strong>{new Date(app.created_at).toLocaleDateString()}</strong></div>
          </div>
          {app.message && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-gray-200)', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--color-gray-500)' }}>Message:</span>
              <p style={{ marginTop: '0.25rem', color: 'var(--color-gray-700)' }}>{app.message}</p>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Decision *</label>
          <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="pending">⏳ Pending</option>
            <option value="approved">✅ Approve — Add to Choir</option>
            <option value="rejected">❌ Reject</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Admin Notes (optional)</label>
          <textarea className="form-textarea" placeholder="Internal notes or feedback..." value={notes} onChange={e => setNotes(e.target.value)} style={{ minHeight: 80 }} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={save} disabled={saving} style={{ flex: 1 }}>
            {saving ? 'Saving…' : 'Save Decision'}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </motion.div>
    </div>
  );
}

export default function JoinApplicationsPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Application | null>(null);
  const [filter, setFilter] = useState('all');

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ['join-applications'],
    queryFn: () => apiClient.get('/join').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/join/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['join-applications'] }),
  });

  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter);
  const counts = { all: applications.length, pending: applications.filter(a => a.status === 'pending').length, approved: applications.filter(a => a.status === 'approved').length, rejected: applications.filter(a => a.status === 'rejected').length };

  return (
    <AdminLayout title="Join Applications">
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '0.35rem 1rem', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 600, border: '1.5px solid', borderColor: filter === f ? 'var(--color-gold)' : 'var(--color-gray-200)', background: filter === f ? 'var(--color-gold)' : 'transparent', color: filter === f ? 'var(--color-navy)' : 'var(--color-gray-600)', cursor: 'pointer', textTransform: 'capitalize' }}>
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-gray-400)', background: 'white', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
          <p>No {filter !== 'all' ? filter : ''} applications yet.</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-gray-100)', borderBottom: '1px solid var(--color-gray-200)' }}>
                {['Name', 'Voice Type', 'Experience', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((app, i) => {
                const s = STATUS_COLORS[app.status];
                return (
                  <tr key={app.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--color-gray-100)' : 'none' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--color-navy)' }}>{app.name}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(212,168,67,0.1)', color: 'var(--color-gold-dark)' }}>{app.voice_type}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--color-gray-600)', fontSize: '0.875rem' }}>{app.experience_level}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--color-gray-500)', fontSize: '0.8rem' }}>{new Date(app.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-sm btn-primary" onClick={() => setSelected(app)}>Review</button>
                        <button onClick={() => { if (window.confirm(`Delete application from "${app.name}"?`)) deleteMutation.mutate(app.id); }}
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
        </div>
      )}

      {selected && <ReviewModal app={selected} onClose={() => setSelected(null)} />}
    </AdminLayout>
  );
}
