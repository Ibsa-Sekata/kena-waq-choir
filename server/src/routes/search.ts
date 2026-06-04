import { Router, Request, Response } from 'express';
import pool from '../db';
import { Song, Event, SearchResult } from '../types';

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapRowToSong(row: any): Song {
  return {
    id: row.id,
    title: row.title,
    audioUrl: row.audio_url,
    cloudinaryPublicId: row.cloudinary_public_id,
    videoUrl: row.video_url ?? undefined,
    category: row.category,
    downloadUrl: row.download_url ?? undefined,
    isPublished: Boolean(row.is_published),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

function mapRowToEvent(row: any): Event {
  return {
    id: row.id,
    title: row.title,
    eventDate:
      row.event_date instanceof Date
        ? row.event_date.toISOString().split('T')[0]
        : String(row.event_date),
    location: row.location,
    description: row.description,
    registrationUrl: row.registration_url ?? undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

// ─── GET /api/search?q=&type= ─────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { q, type } = req.query as { q?: string; type?: string };
  const keyword = (q ?? '').trim();
  const searchType = (type ?? 'all').toLowerCase();

  if (!['songs', 'events', 'all'].includes(searchType)) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'type must be one of: songs, events, all.',
        fields: { type: 'type must be one of: songs, events, all.' },
      },
    });
    return;
  }

  try {
    let songs: Song[] = [];
    let events: Event[] = [];

    // ── Songs ──────────────────────────────────────────────────────────────
    if (searchType === 'songs' || searchType === 'all') {
      if (keyword) {
        const [rows] = await pool.execute<any[]>(
          'SELECT * FROM songs WHERE is_published = 1 AND MATCH(title) AGAINST(? IN BOOLEAN MODE) ORDER BY id ASC',
          [keyword],
        );
        songs = (rows as any[]).map(mapRowToSong);
      } else {
        const [rows] = await pool.execute<any[]>(
          'SELECT * FROM songs WHERE is_published = 1 ORDER BY id ASC',
        );
        songs = (rows as any[]).map(mapRowToSong);
      }
    }

    // ── Events ─────────────────────────────────────────────────────────────
    if (searchType === 'events' || searchType === 'all') {
      if (keyword) {
        const [rows] = await pool.execute<any[]>(
          'SELECT * FROM events WHERE MATCH(title, location, description) AGAINST(? IN BOOLEAN MODE) ORDER BY event_date ASC',
          [keyword],
        );
        events = (rows as any[]).map(mapRowToEvent);
      } else {
        const [rows] = await pool.execute<any[]>(
          'SELECT * FROM events ORDER BY event_date ASC',
        );
        events = (rows as any[]).map(mapRowToEvent);
      }
    }

    const result: SearchResult = { songs, events };
    res.json(result);
  } catch (err) {
    console.error('[GET /api/search]', err);
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Search failed.' } });
  }
});

export default router;
