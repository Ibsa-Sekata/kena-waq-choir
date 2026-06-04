import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../api/axios';
import AdminLayout from './AdminLayout';
import type { GalleryItem, Album } from '../../types';

type UploadForm = { albumName: string; mediaType: string; caption?: string; media?: FileList };

function UploadModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<UploadForm>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data: UploadForm) => {
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('albumName', data.albumName);
      fd.append('mediaType', data.mediaType);
      if (data.caption) fd.append('caption', data.caption);
      if (data.media?.[0]) fd.append('media', data.media[0]);
      await apiClient.post('/gallery', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      qc.invalidateQueries({ queryKey: ['admin-gallery'] });
      qc.invalidateQueries({ queryKey: ['admin-albums'] });
      onClose();
    } catch { setError('Failed to upload. Please try again.'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '2rem', width: '100%', maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-navy)' }}>Upload Media</h2>
          <button onClick={onClose} style={{ fontSize: '1.25rem', color: 'var(--color-gray-400)' }}>✕</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Album Name *</label>
            <input className="form-input" placeholder="e.g. Easter 2024 Highlights" {...register('albumName', { required: 'Required' })} />
            {errors.albumName && <span className="form-error">{errors.albumName.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Media Type *</label>
            <select className="form-select" {...register('mediaType', { required: 'Required' })}>
              <option value="">Select type</option>
              <option value="photo">Photo</option>
              <option value="video">Video</option>
            </select>
            {errors.mediaType && <span className="form-error">{errors.mediaType.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Media File *</label>
            <input type="file" accept="image/*,video/*" {...register('media')} style={{ padding: '0.5rem', border: '1.5px solid var(--color-gray-200)', borderRadius: 'var(--radius-md)', width: '100%' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Caption (optional)</label>
            <input className="form-input" placeholder="Describe this photo/video" {...register('caption')} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Uploading…' : '⬆ Upload'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function GalleryManagementPage() {
  const qc = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState('');

  const { data: albums = [] } = useQuery<Album[]>({
    queryKey: ['admin-albums'],
    queryFn: () => apiClient.get('/gallery/albums').then(r => r.data),
  });

  const { data: items = [], isLoading } = useQuery<GalleryItem[]>({
    queryKey: ['admin-gallery', selectedAlbum],
    queryFn: () => {
      const params = selectedAlbum ? `?album=${encodeURIComponent(selectedAlbum)}` : '';
      return apiClient.get(`/gallery${params}`).then(r => r.data);
    },
  });

  const deleteItem = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/gallery/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-gallery'] }),
  });

  const deleteAlbum = useMutation({
    mutationFn: (name: string) => apiClient.delete(`/gallery/albums/${encodeURIComponent(name)}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-gallery'] }); qc.invalidateQueries({ queryKey: ['admin-albums'] }); setSelectedAlbum(''); },
  });

  return (
    <AdminLayout title="Gallery Management">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setSelectedAlbum('')}
            style={{ padding: '0.35rem 0.9rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600, border: '1.5px solid', borderColor: selectedAlbum === '' ? 'var(--color-gold)' : 'var(--color-gray-200)', background: selectedAlbum === '' ? 'var(--color-gold)' : 'transparent', color: selectedAlbum === '' ? 'var(--color-navy)' : 'var(--color-gray-600)', cursor: 'pointer' }}
          >All</button>
          {albums.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                onClick={() => setSelectedAlbum(a.name)}
                style={{ padding: '0.35rem 0.9rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600, border: '1.5px solid', borderColor: selectedAlbum === a.name ? 'var(--color-gold)' : 'var(--color-gray-200)', background: selectedAlbum === a.name ? 'var(--color-gold)' : 'transparent', color: selectedAlbum === a.name ? 'var(--color-navy)' : 'var(--color-gray-600)', cursor: 'pointer' }}
              >{a.name}</button>
              <button
                onClick={() => { if (window.confirm(`Delete album "${a.name}" and ALL its items?`)) deleteAlbum.mutate(a.name); }}
                style={{ color: '#dc2626', fontSize: '0.75rem', padding: '0.2rem 0.4rem', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
                title="Delete album"
              >✕</button>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}>+ Upload Media</button>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-gray-400)', background: 'white', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📸</div>
          <p>No media yet. Upload your first photo or video!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
          {items.map(item => (
            <div key={item.id} style={{ background: 'white', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative' }}>
              <div style={{ paddingBottom: '75%', position: 'relative', background: 'var(--color-navy)' }}>
                {item.mediaType === 'photo' ? (
                  <img src={item.mediaUrl} alt={item.caption || ''} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem' }}>🎬</div>
                )}
                <div style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', background: 'rgba(0,0,0,0.6)', borderRadius: 'var(--radius-sm)', padding: '0.15rem 0.4rem', fontSize: '0.65rem', color: 'white' }}>
                  {item.mediaType === 'video' ? '🎬' : '📷'}
                </div>
              </div>
              <div style={{ padding: '0.6rem' }}>
                {item.caption && <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginBottom: '0.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.caption}</p>}
                <p style={{ fontSize: '0.7rem', color: 'var(--color-gold-dark)', fontWeight: 600, marginBottom: '0.4rem' }}>{item.albumName}</p>
                <button
                  onClick={() => { if (window.confirm('Delete this item?')) deleteItem.mutate(item.id); }}
                  style={{ width: '100%', background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', padding: '0.3rem', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
      </AnimatePresence>
    </AdminLayout>
  );
}
