import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../api/axios';
import AdminLayout from './AdminLayout';
import type { Member } from '../../types';

type MemberForm = { name: string; role: string; roleCategory: string; image?: FileList };

function MemberFormModal({ member, onClose }: { member?: Member; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<MemberForm>({
    defaultValues: member ? { name: member.name, role: member.role, roleCategory: member.roleCategory } : {},
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data: MemberForm) => {
    setSaving(true); setError('');
    try {
      if (member) {
        const fd = new FormData();
        fd.append('name', data.name);
        fd.append('role', data.role);
        fd.append('roleCategory', data.roleCategory);
        if (data.image?.[0]) fd.append('image', data.image[0]);
        await apiClient.put(`/members/${member.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        const fd = new FormData();
        fd.append('name', data.name);
        fd.append('role', data.role);
        fd.append('roleCategory', data.roleCategory);
        if (data.image?.[0]) fd.append('image', data.image[0]);
        await apiClient.post('/members', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      qc.invalidateQueries({ queryKey: ['admin-members'] });
      onClose();
    } catch { setError('Failed to save. Please try again.'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '2rem', width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-navy)' }}>{member ? 'Edit Member' : 'Add New Member'}</h2>
          <button onClick={onClose} style={{ fontSize: '1.25rem', color: 'var(--color-gray-400)' }}>✕</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" placeholder="Member name" {...register('name', { required: 'Required' })} />
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Role Title *</label>
            <input className="form-input" placeholder="e.g. Lead Soprano, Choir Director" {...register('role', { required: 'Required' })} />
            {errors.role && <span className="form-error">{errors.role.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Voice Category *</label>
            <select className="form-select" {...register('roleCategory', { required: 'Required' })}>
              <option value="">Select category</option>
              <option value="Choir Leader">Choir Leader</option>
              <option value="Soprano">Soprano</option>
              <option value="Alto">Alto</option>
              <option value="Tenor">Tenor</option>
              <option value="Bass">Bass</option>
            </select>
            {errors.roleCategory && <span className="form-error">{errors.roleCategory.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Profile Photo {!member && '*'}</label>
            <input type="file" accept="image/*" {...register('image')} style={{ padding: '0.5rem', border: '1.5px solid var(--color-gray-200)', borderRadius: 'var(--radius-md)', width: '100%' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Saving…' : member ? 'Save Changes' : 'Add Member'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function MemberManagementPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | Member | null>(null);

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ['admin-members'],
    queryFn: () => apiClient.get('/members').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/members/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-members'] }),
  });

  return (
    <AdminLayout title="Member Management">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--color-gray-500)' }}>{members.length} members total</p>
        <button className="btn btn-primary" onClick={() => setModal('create')}>+ Add Member</button>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {members.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-gray-400)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👥</div>
              <p>No members yet. Add your first member!</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-gray-100)', borderBottom: '1px solid var(--color-gray-200)' }}>
                  {['Photo', 'Name', 'Role', 'Category', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((member, i) => (
                  <tr key={member.id} style={{ borderBottom: i < members.length - 1 ? '1px solid var(--color-gray-100)' : 'none' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: 'var(--color-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                        {member.imageUrl ? <img src={member.imageUrl} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : '🎵'}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--color-navy)' }}>{member.name}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-gray-600)', fontSize: '0.875rem' }}>{member.role}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(212,168,67,0.1)', color: 'var(--color-gold-dark)' }}>
                        {member.roleCategory}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-sm btn-outline" onClick={() => setModal(member)}>Edit</button>
                        <button onClick={() => { if (window.confirm(`Delete "${member.name}"?`)) deleteMutation.mutate(member.id); }}
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '0.3rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <MemberFormModal
            member={modal !== 'create' ? modal : undefined}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
