import { Song } from '../types';

/**
 * Deterministic Daily Worship Song algorithm.
 *
 * Selects a song based on the UTC day index (days since Unix epoch).
 * No cron job or database flag required — the same song is returned
 * for all requests on the same UTC calendar day.
 *
 * Algorithm:
 *   dayIndex = floor(nowUtcMs / 86_400_000)
 *   pool     = worship songs if non-empty, else all published songs
 *   selected = pool[ dayIndex % pool.length ]
 *
 * Implemented fully in Task 4.
 */
export function getDailyWorshipSong(songs: Song[], nowUtcMs: number): Song {
  if (songs.length === 0) {
    throw new Error('No songs available to select from.');
  }

  const worshipSongs = songs.filter((s) => s.category === 'worship');
  const pool = worshipSongs.length > 0 ? worshipSongs : songs;

  const dayIndex = Math.floor(nowUtcMs / 86_400_000);
  return pool[dayIndex % pool.length];
}
