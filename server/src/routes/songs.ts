import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import pool from '../db';
import { authenticateJWT } from '../middleware/auth';
import { uploadToCloudinary, destroyCloudinaryAsset } from '../services/cloudinary';
import { getDailyWorshipSong } from '../services/dailyWorship';
import { Song } from '../types';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

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

function validationErrors(req: Request, res: Response): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const fields: Record<string, string> = {};
    for (const err of errors.array()) {
      const field = (err as { path?: string }).path ?? 'unknown';
      if (!fields[field]) fields[field] = err.msg;
    }
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed.', fields },
    });
    return true;
  }
  return false;
}

// ─── GET /api/songs ───────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, q } = req.query as { category?: string; q?: string };

    let sql: string;
    const params: unknown[] = [];

    if (q && q.trim()) {
      // FULLTEXT search on title only (category is ENUM, not FULLTEXT-indexable)
      const searchTerm = q.trim();
      if (category && category.trim()) {
        sql =
          'SELECT * FROM songs WHERE is_published = 1 AND category = ? AND MATCH(title) AGAINST(? IN BOOLEAN MODE) ORDER BY id ASC';
        params.push(category.trim(), searchTerm);
      } else {
        sql =
          'SELECT * FROM songs WHERE is_published = 1 AND MATCH(title) AGAINST(? IN BOOLEAN MODE) ORDER BY id ASC';
        params.push(searchTerm);
      }
    } else if (category && category.trim()) {
      sql = 'SELECT * FROM songs WHERE is_published = 1 AND category = ? ORDER BY id ASC';
      params.push(category.trim());
    } else {
      sql = 'SELECT * FROM songs WHERE is_published = 1 ORDER BY id ASC';
    }

    const [rows] = await pool.execute<any[]>(sql, params);
    res.json(rows.map(mapRowToSong));
  } catch (err) {
    console.error('[GET /api/songs]', err);
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to fetch songs.' } });
  }
});

// ─── GET /api/songs/daily-worship ─────────────────────────────────────────────
// NOTE: This route MUST be defined before /:id to avoid "daily-worship" being
// treated as an id parameter.

router.get('/daily-worship', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Fetch all published worship songs first; fallback to all published songs
    const [worshipRows] = await pool.execute<any[]>(
      "SELECT * FROM songs WHERE is_published = 1 AND category = 'worship' ORDER BY id ASC",
    );

    let songs: Song[];
    if ((worshipRows as any[]).length > 0) {
      songs = (worshipRows as any[]).map(mapRowToSong);
    } else {
      const [allRows] = await pool.execute<any[]>(
        'SELECT * FROM songs WHERE is_published = 1 ORDER BY id ASC',
      );
      songs = (allRows as any[]).map(mapRowToSong);
    }

    if (songs.length === 0) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'No songs available.' },
      });
      return;
    }

    const song = getDailyWorshipSong(songs, Date.now());
    res.json(song);
  } catch (err) {
    console.error('[GET /api/songs/daily-worship]', err);
    res.status(500).json({
      error: { code: 'DATABASE_ERROR', message: 'Failed to fetch daily worship song.' },
    });
  }
});

// ─── GET /api/songs/:id ───────────────────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute<any[]>(
      'SELECT * FROM songs WHERE id = ? AND is_published = 1',
      [id],
    );

    if ((rows as any[]).length === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Song not found.' } });
      return;
    }

    res.json(mapRowToSong((rows as any[])[0]));
  } catch (err) {
    console.error('[GET /api/songs/:id]', err);
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to fetch song.' } });
  }
});

// ─── POST /api/songs (admin) ──────────────────────────────────────────────────

const createSongValidation = [
  body('title').trim().notEmpty().withMessage('Title is required.'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required.')
    .isIn(['worship', 'live', 'album'])
    .withMessage('Category must be worship, live, or album.'),
];

router.post(
  '/',
  authenticateJWT,
  upload.single('audio'),
  createSongValidation,
  async (req: Request, res: Response): Promise<void> => {
    if (validationErrors(req, res)) return;

    if (!req.file) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Audio file is required.', fields: { audio: 'Audio file is required.' } },
      });
      return;
    }

    const { title, category, videoUrl, downloadUrl } = req.body as {
      title: string;
      category: string;
      videoUrl?: string;
      downloadUrl?: string;
    };

    let uploadResult: { publicId: string; secureUrl: string; resourceType: string };
    try {
      uploadResult = await uploadToCloudinary(req.file.buffer, 'kennawaq/songs', 'video');
    } catch (err) {
      console.error('[POST /api/songs] Cloudinary upload failed:', err);
      res.status(502).json({
        error: { code: 'MEDIA_UPLOAD_FAILED', message: 'Failed to upload audio file.' },
      });
      return;
    }

    try {
      const [result] = await pool.execute<any>(
        'INSERT INTO songs (title, audio_url, cloudinary_public_id, video_url, category, download_url, is_published) VALUES (?, ?, ?, ?, ?, ?, 1)',
        [
          title.trim(),
          uploadResult.secureUrl,
          uploadResult.publicId,
          videoUrl?.trim() || null,
          category.trim(),
          downloadUrl?.trim() || null,
        ],
      );

      const insertId = (result as any).insertId;
      const [rows] = await pool.execute<any[]>('SELECT * FROM songs WHERE id = ?', [insertId]);
      res.status(201).json(mapRowToSong((rows as any[])[0]));
    } catch (err) {
      console.error('[POST /api/songs] DB insert failed:', err);
      // Best-effort cleanup of uploaded asset
      await destroyCloudinaryAsset(uploadResult.publicId, 'video');
      res.status(500).json({
        error: { code: 'DATABASE_ERROR', message: 'Failed to save song.' },
      });
    }
  },
);

// ─── PUT /api/songs/:id (admin) ───────────────────────────────────────────────

const updateSongValidation = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty.'),
  body('category')
    .optional()
    .trim()
    .isIn(['worship', 'live', 'album'])
    .withMessage('Category must be worship, live, or album.'),
];

router.put(
  '/:id',
  authenticateJWT,
  updateSongValidation,
  async (req: Request, res: Response): Promise<void> => {
    if (validationErrors(req, res)) return;

    const { id } = req.params;
    const { title, category, videoUrl, downloadUrl } = req.body as {
      title?: string;
      category?: string;
      videoUrl?: string;
      downloadUrl?: string;
    };

    try {
      const [rows] = await pool.execute<any[]>('SELECT * FROM songs WHERE id = ?', [id]);
      if ((rows as any[]).length === 0) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Song not found.' } });
        return;
      }

      const existing = (rows as any[])[0];
      await pool.execute(
        'UPDATE songs SET title = ?, category = ?, video_url = ?, download_url = ? WHERE id = ?',
        [
          title?.trim() ?? existing.title,
          category?.trim() ?? existing.category,
          videoUrl !== undefined ? videoUrl.trim() || null : existing.video_url,
          downloadUrl !== undefined ? downloadUrl.trim() || null : existing.download_url,
          id,
        ],
      );

      const [updated] = await pool.execute<any[]>('SELECT * FROM songs WHERE id = ?', [id]);
      res.json(mapRowToSong((updated as any[])[0]));
    } catch (err) {
      console.error('[PUT /api/songs/:id]', err);
      res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to update song.' } });
    }
  },
);

// ─── DELETE /api/songs/:id (admin) ────────────────────────────────────────────

router.delete('/:id', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute<any[]>('SELECT * FROM songs WHERE id = ?', [id]);
    if ((rows as any[]).length === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Song not found.' } });
      return;
    }

    const song = (rows as any[])[0];

    // Delete DB record first, then clean up Cloudinary (best-effort)
    await pool.execute('DELETE FROM songs WHERE id = ?', [id]);
    await destroyCloudinaryAsset(song.cloudinary_public_id, 'video');

    res.status(204).send();
  } catch (err) {
    console.error('[DELETE /api/songs/:id]', err);
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to delete song.' } });
  }
});

export default router;
