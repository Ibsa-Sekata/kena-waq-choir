import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/axios';
import AdminLayout from './AdminLayout';

type Submission = {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

export default function ContactSubmissionsPage() {
  const qc = useQueryClient();

  const { data: submissions = [], isLoading } = useQuery<Submission[]>({
    queryKey: ['contact-submissions'],
    queryFn: () => apiClient.get('/contact').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/contact/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contact-submissions'] }),
  });

  return (
    <AdminLayout title="Contact Submissions">
      <p style={{ color: 'var(--color-gray-500)', marginBottom: '1.5rem' }}>
        {submissions.length} message{submissions.length !== 1 ? 's' : ''} received
      </p>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-gray-400)', background: 'white', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📩</div>
          <p>No contact messages yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {submissions.map(sub => (
            <div key={sub.id} style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid var(--color-gold)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: '1rem' }}>{sub.name}</h3>
                  <a href={`mailto:${sub.email}`} style={{ color: 'var(--color-gold-dark)', fontSize: '0.875rem', textDecoration: 'underline' }}>{sub.email}</a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ color: 'var(--color-gray-400)', fontSize: '0.8rem' }}>
                    {new Date(sub.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                  <a
                    href={`mailto:${sub.email}?subject=Re: Your message to KennaWaq Choir`}
                    className="btn btn-sm btn-outline"
                    style={{ flexShrink: 0 }}
                  >
                    Reply
                  </a>
                  <button
                    onClick={() => { if (window.confirm(`Delete message from "${sub.name}"?`)) deleteMutation.mutate(sub.id); }}
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '0.3rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p style={{ color: 'var(--color-gray-600)', fontSize: '0.9rem', lineHeight: 1.7, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
                {sub.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
