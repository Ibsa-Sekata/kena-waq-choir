import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../api/axios';
import type { GalleryItem, Album } from '../types';

export default function GalleryPage() {
  const [selectedAlbum, setSelectedAlbum] = useState<string>('');
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  const { data: albums = [] } = useQuery<Album[]>({
    queryKey: ['albums'],
    queryFn: () => apiClient.get('/gallery/albums').then(r => r.data),
  });

  const { data: items = [], isLoading } = useQuery<GalleryItem[]>({
    queryKey: ['gallery', selectedAlbum],
    queryFn: () => {
      const params = selectedAlbum ? `?album=${encodeURIComponent(selectedAlbum)}` : '';
      return apiClient.get(`/gallery${params}`).then(r => r.data);
    },
  });

  return (
    <div>
      <div className="page-hero">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="page-hero-title">Gallery</h1>
            <p className="page-hero-subtitle">Moments of worship and celebration</p>
          </motion.div>
        </div>
      </div>

      <div className="container" style={{ padding: '3rem 1.25rem' }}>
        {/* Album filter */}
        {albums.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <button
              onClick={() => setSelectedAlbum('')}
              style={{
                padding: '0.4rem 1.1rem', borderRadius: 'var(--radius-full)',
                fontWeight: 600, fontSize: '0.85rem', border: '1.5px solid',
                borderColor: selectedAlbum === '' ? 'var(--color-gold)' : 'var(--color-gray-200)',
                background: selectedAlbum === '' ? 'var(--color-gold)' : 'transparent',
                color: selectedAlbum === '' ? 'var(--color-navy)' : 'var(--color-gray-600)',
                transition: 'all 0.2s',
              }}
            >
              All Albums
            </button>
            {albums.map(album => (
              <button
                key={album.id}
                onClick={() => setSelectedAlbum(album.name)}
                style={{
                  padding: '0.4rem 1.1rem', borderRadius: 'var(--radius-full)',
                  fontWeight: 600, fontSize: '0.85rem', border: '1.5px solid',
                  borderColor: selectedAlbum === album.name ? 'var(--color-gold)' : 'var(--color-gray-200)',
                  background: selectedAlbum === album.name ? 'var(--color-gold)' : 'transparent',
                  color: selectedAlbum === album.name ? 'var(--color-navy)' : 'var(--color-gray-600)',
                  transition: 'all 0.2s',
                }}
              >
                {album.name}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid-cards">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 220, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-gray-400)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
            <p style={{ fontSize: '1.1rem' }}>No gallery items yet</p>
          </div>
        )}

        {/* Grid */}
        {!isLoading && items.length > 0 && (
          <div className="grid-cards">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                className="card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                style={{ cursor: 'pointer', overflow: 'hidden' }}
                onClick={() => setLightbox(item)}
              >
                <div style={{ position: 'relative', paddingBottom: '66%', background: 'var(--color-navy)' }}>
                  {item.mediaType === 'photo' ? (
                    <img
                      src={item.mediaUrl}
                      alt={item.caption || 'Gallery photo'}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.style.display = 'none';
                        el.parentElement!.style.display = 'flex';
                        el.parentElement!.style.alignItems = 'center';
                        el.parentElement!.style.justifyContent = 'center';
                        el.parentElement!.innerHTML = '<span style="font-size:3rem;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)">📸</span>';
                      }}
                    />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-navy-light)' }}>
                      <div style={{ textAlign: 'center', color: 'white' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>▶</div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Video</div>
                      </div>
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', top: '0.5rem', right: '0.5rem',
                    background: 'rgba(0,0,0,0.6)', borderRadius: 'var(--radius-sm)',
                    padding: '0.2rem 0.5rem', fontSize: '0.7rem', color: 'white',
                  }}>
                    {item.mediaType === 'video' ? '🎬' : '📷'}
                  </div>
                </div>
                {item.caption && (
                  <div style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--color-gray-600)' }}>
                    {item.caption}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <button className="lightbox-close" onClick={() => setLightbox(null)} aria-label="Close">✕</button>
            <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '85vh' }}>
              {lightbox.mediaType === 'photo' ? (
                <img
                  src={lightbox.mediaUrl}
                  alt={lightbox.caption || ''}
                  style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
                />
              ) : (
                <video
                  src={lightbox.mediaUrl}
                  controls
                  autoPlay
                  style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 'var(--radius-md)' }}
                />
              )}
              {lightbox.caption && (
                <p style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
                  {lightbox.caption}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
