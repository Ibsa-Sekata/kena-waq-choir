import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../api/axios';
import AdminLayout from './AdminLayout';
import type { Song } from '../../types';

type SongForm = { title: string; category: string; videoUrl?: string; downloadUrl?: string; audio?: FileList };

function SongFormModal({ song, onClose }: { song?: Song; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<SongForm>({
    defaultValues: song ? { title: song.title, category: song.category, videoUrl: song.videoUrl || '', downloadUrl: song.downloadUrl || '' } : {},
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data: SongForm) => {
    setSaving(true); setError('');
    try {
      if (song) {
        await apiClient.put(`/songs/${song.id}`, { title: data.title, category: data.category, videoUrl: data.videoUrl, downloadUrl: data.downloadUrl });
      } else {
        const fd = new FormData();
        fd.append('title', data.title);
        fd.append('category', data.category);
        if (data.videoUrl) fd.append('videoUrl', data.videoUrl);
        if (data.downloadUrl) fd.append('downloadUrl', data.downloadUrl);
        if (data.audio?.[0]) fd.append('audio', data.audio[0]);
        await apiClient.post('/songs', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      qc.invalidateQueries({ queryKey: ['admin-songs'] });
      onClose();
    } catch { setError('Failed to save. Please try again.'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '2rem', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-navy)' }}>{song ? 'Edit Song' : 'Add New Song'}</h2>
          <button onClick={onClose} style={{ fontSize: '1.25rem', color: 'var(--color-gray-400)' }}>✕</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" placeholder="Song title" {...register('title', { required: 'Required' })} />
            {errors.title && <span className="form-error">{errors.title.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-select" {...register('category', { required: 'Required' })}>
              <option value="">Select category</option>
              <option value="worship">Worship</option>
              <option value="live">Live</option>
              <option value="album">Album</option>
            </select>
            {errors.category && <span className="form-error">{errors.category.message}</span>}
          </div>
          {!song && (
            <div className="form-group">
              <label className="form-label">Audio File *</label>
              <input type="file" accept="audio/*" {...register('audio')} style={{ padding: '0.5rem', border: '1.5px solid var(--color-gray-200)', borderRadius: 'var(--radius-md)', width: '100%' }} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Video URL (optional)</label>
            <input className="form-input" placeholder="https://youtube.com/..." {...register('videoUrl')} />
          </div>
          <div className="form-group">
            <label className="form-label">Download URL (optional)</label>
            <input className="form-input" placeholder="https://..." {...register('downloadUrl')} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Saving…' : song ? 'Save Changes' : 'Add Song'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function SongManagementPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | Song | null>(null);

  const { data: songs = [], isLoading } = useQuery<Song[]>({
    queryKey: ['admin-songs'],
    queryFn: () => apiClient.get('/songs').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/songs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-songs'] }),
  });

  const handleDelete = (song: Song) => {
    if (window.confirm(`Delete "${song.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(song.id);
    }
  };

  return (
    <AdminLayout title="Song Management">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--color-gray-500)' }}>{songs.length} songs total</p>
        <button className="btn btn-primary" onClick={() => setModal('create')}>+ Add Song</button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {songs.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-gray-400)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎵</div>
              <p>No songs yet. Add your first song!</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-gray-100)', borderBottom: '1px solid var(--color-gray-200)' }}>
                  {['Title', 'Category', 'Download', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {songs.map((song, i) => (
                  <tr key={song.id} style={{ borderBottom: i < songs.length - 1 ? '1px solid var(--color-gray-100)' : 'none' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--color-navy)' }}>{song.title}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge badge-${song.category}`}>{song.category}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--color-gray-500)', fontSize: '0.85rem' }}>
                      {song.downloadUrl ? '✅ Yes' : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-sm btn-outline" onClick={() => setModal(song)}>Edit</button>
                        <button className="btn btn-sm" onClick={() => handleDelete(song)} style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>Delete</button>
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
          <SongFormModal
            song={modal !== 'create' ? modal : undefined}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
