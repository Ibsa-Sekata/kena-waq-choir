import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import apiClient from '../api/axios';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import type { Song } from '../types';

const CATEGORIES = ['all', 'worship', 'live', 'album'] as const;

export default function SongsPage() {
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { play, state } = useAudioPlayer();

  const { data: songs = [], isLoading } = useQuery<Song[]>({
    queryKey: ['songs', category, search],
    queryFn: () => {
      if (search) return apiClient.get(`/search?q=${encodeURIComponent(search)}&type=songs`).then(r => r.data.songs);
      const params = category !== 'all' ? `?category=${category}` : '';
      return apiClient.get(`/songs${params}`).then(r => r.data);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setCategory('all');
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setSearch('');
    setSearchInput('');
  };

  return (
    <div>
      {/* Hero */}
      <div className="page-hero">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="page-hero-title">Our Music</h1>
            <p className="page-hero-subtitle">Songs of worship, praise, and celebration</p>
          </motion.div>
        </div>
      </div>

      <div className="container" style={{ padding: '3rem 1.25rem' }}>
        {/* Search + Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', maxWidth: 480 }}>
            <input
              className="form-input"
              placeholder="Search songs..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>Search</button>
            {search && (
              <button type="button" className="btn btn-ghost" onClick={() => { setSearch(''); setSearchInput(''); }}>✕</button>
            )}
          </form>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                style={{
                  padding: '0.4rem 1.1rem',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 600, fontSize: '0.85rem',
                  border: '1.5px solid',
                  borderColor: category === cat ? 'var(--color-gold)' : 'var(--color-gray-200)',
                  background: category === cat ? 'var(--color-gold)' : 'transparent',
                  color: category === cat ? 'var(--color-navy)' : 'var(--color-gray-600)',
                  transition: 'all 0.2s',
                  textTransform: 'capitalize',
                }}
              >
                {cat === 'all' ? 'All Songs' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid-cards">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 90, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && songs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-gray-400)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎵</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>No songs found</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Try a different search or category</p>
          </div>
        )}

        {/* Songs Grid */}
        {!isLoading && songs.length > 0 && (
          <div className="grid-cards">
            {songs.map((song, i) => {
              const isActive = state.currentTrack?.id === song.id;
              const isPlaying = isActive && state.isPlaying;
              return (
                <motion.div
                  key={song.id}
                  className="card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    padding: '1.25rem',
                    border: isActive ? '2px solid var(--color-gold)' : '2px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                    <button
                      onClick={() => play(song, songs)}
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
                      <p style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-navy)' }}>
                        {song.title}
                      </p>
                      <span className={`badge badge-${song.category}`} style={{ marginTop: '0.2rem' }}>
                        {song.category}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => play(song, songs)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                    >
                      {isPlaying ? '⏸ Pause' : '▶ Play'}
                    </button>
                    {song.downloadUrl && (
                      <a
                        href={song.downloadUrl}
                        download
                        className="btn btn-outline btn-sm"
                        style={{ flexShrink: 0 }}
                        aria-label="Download"
                      >
                        ⬇
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
