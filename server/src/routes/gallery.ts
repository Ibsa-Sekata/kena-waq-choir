import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import pool from '../db';
import { authenticateJWT } from '../middleware/auth';
import { uploadToCloudinary, destroyCloudinaryAsset } from '../services/cloudinary';
import { GalleryItem } from '../types';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapRowToGalleryItem(row: any): GalleryItem {
  return {
    id: row.id,
    albumId: row.album_id,
    albumName: row.album_name ?? row.name ?? '',
    mediaUrl: row.media_url,
    cloudinaryPublicId: row.cloudinary_public_id,
    mediaType: row.media_type,
    caption: row.caption ?? undefined,
    eventId: row.event_id ?? undefined,
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

// ─── GET /api/gallery ─────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { album } = req.query as { album?: string };

    let sql: string;
    const params: unknown[] = [];

    if (album && album.trim()) {
      sql = `
        SELECT gi.*, a.name AS album_name
        FROM gallery_items gi
        JOIN albums a ON gi.album_id = a.id
        WHERE a.name = ?
        ORDER BY gi.created_at DESC
      `;
      params.push(album.trim());
    } else {
      sql = `
        SELECT gi.*, a.name AS album_name
        FROM gallery_items gi
        JOIN albums a ON gi.album_id = a.id
        ORDER BY gi.created_at DESC
      `;
    }

    const [rows] = await pool.execute<any[]>(sql, params);
    res.json((rows as any[]).map(mapRowToGalleryItem));
  } catch (err) {
    console.error('[GET /api/gallery]', err);
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to fetch gallery.' } });
  }
});

// ─── GET /api/gallery/albums ──────────────────────────────────────────────────
// NOTE: Must be defined before /:id to avoid "albums" being treated as an id.

router.get('/albums', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute<any[]>('SELECT * FROM albums ORDER BY name ASC');
    res.json(
      (rows as any[]).map((row) => ({
        id: row.id,
        name: row.name,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
      })),
    );
  } catch (err) {
    console.error('[GET /api/gallery/albums]', err);
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to fetch albums.' } });
  }
});

// ─── POST /api/gallery (admin) ────────────────────────────────────────────────

const createGalleryItemValidation = [
  body('albumName').trim().notEmpty().withMessage('Album name is required.'),
  body('mediaType')
    .trim()
    .notEmpty()
    .withMessage('Media type is required.')
    .isIn(['photo', 'video'])
    .withMessage('Media type must be photo or video.'),
  body('caption').optional({ nullable: true }).trim(),
  body('eventId').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Event ID must be a positive integer.'),
];

router.post(
  '/',
  authenticateJWT,
  upload.single('media'),
  createGalleryItemValidation,
  async (req: Request, res: Response): Promise<void> => {
    if (validationErrors(req, res)) return;

    if (!req.file) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Media file is required.',
          fields: { media: 'Media file is required.' },
        },
      });
      return;
    }

    const { albumName, mediaType, caption, eventId } = req.body as {
      albumName: string;
      mediaType: 'photo' | 'video';
      caption?: string;
      eventId?: string;
    };

    const resourceType = mediaType === 'video' ? 'video' : 'image';

    let uploadResult: { publicId: string; secureUrl: string; resourceType: string };
    try {
      uploadResult = await uploadToCloudinary(req.file.buffer, 'kennawaq/gallery', resourceType);
    } catch (err) {
      console.error('[POST /api/gallery] Cloudinary upload failed:', err);
      res.status(502).json({
        error: { code: 'MEDIA_UPLOAD_FAILED', message: 'Failed to upload media file.' },
      });
      return;
    }

    try {
      // Upsert album — get or create
      await pool.execute('INSERT IGNORE INTO albums (name) VALUES (?)', [albumName.trim()]);
      const [albumRows] = await pool.execute<any[]>('SELECT id FROM albums WHERE name = ?', [
        albumName.trim(),
      ]);
      const albumId = (albumRows as any[])[0].id;

      const [result] = await pool.execute<any>(
        'INSERT INTO gallery_items (album_id, media_url, cloudinary_public_id, media_type, caption, event_id) VALUES (?, ?, ?, ?, ?, ?)',
        [
          albumId,
          uploadResult.secureUrl,
          uploadResult.publicId,
          mediaType,
          caption?.trim() || null,
          eventId ? parseInt(eventId, 10) : null,
        ],
      );

      const insertId = (result as any).insertId;
      const [rows] = await pool.execute<any[]>(
        `SELECT gi.*, a.name AS album_name
         FROM gallery_items gi
         JOIN albums a ON gi.album_id = a.id
         WHERE gi.id = ?`,
        [insertId],
      );
      res.status(201).json(mapRowToGalleryItem((rows as any[])[0]));
    } catch (err) {
      console.error('[POST /api/gallery] DB insert failed:', err);
      await destroyCloudinaryAsset(uploadResult.publicId, resourceType);
      res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to save gallery item.' } });
    }
  },
);

// ─── PUT /api/gallery/:id (admin) ─────────────────────────────────────────────

const updateGalleryItemValidation = [
  body('caption').optional({ nullable: true }).trim(),
  body('albumName').optional().trim().notEmpty().withMessage('Album name cannot be empty.'),
];

router.put(
  '/:id',
  authenticateJWT,
  updateGalleryItemValidation,
  async (req: Request, res: Response): Promise<void> => {
    if (validationErrors(req, res)) return;

    const { id } = req.params;
    const { caption, albumName } = req.body as { caption?: string; albumName?: string };

    try {
      const [rows] = await pool.execute<any[]>('SELECT * FROM gallery_items WHERE id = ?', [id]);
      if ((rows as any[]).length === 0) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Gallery item not found.' } });
        return;
      }

      const existing = (rows as any[])[0];
      let albumId: number = existing.album_id;

      if (albumName && albumName.trim()) {
        // Upsert album
        await pool.execute('INSERT IGNORE INTO albums (name) VALUES (?)', [albumName.trim()]);
        const [albumRows] = await pool.execute<any[]>('SELECT id FROM albums WHERE name = ?', [
          albumName.trim(),
        ]);
        albumId = (albumRows as any[])[0].id;
      }

      await pool.execute(
        'UPDATE gallery_items SET caption = ?, album_id = ? WHERE id = ?',
        [caption !== undefined ? caption.trim() || null : existing.caption, albumId, id],
      );

      const [updated] = await pool.execute<any[]>(
        `SELECT gi.*, a.name AS album_name
         FROM gallery_items gi
         JOIN albums a ON gi.album_id = a.id
         WHERE gi.id = ?`,
        [id],
      );
      res.json(mapRowToGalleryItem((updated as any[])[0]));
    } catch (err) {
      console.error('[PUT /api/gallery/:id]', err);
      res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to update gallery item.' } });
    }
  },
);

// ─── DELETE /api/gallery/albums/:albumName (admin) ────────────────────────────
// NOTE: Must be defined before DELETE /:id to avoid routing conflicts.

router.delete(
  '/albums/:albumName',
  authenticateJWT,
  async (req: Request, res: Response): Promise<void> => {
    const { albumName } = req.params;

    try {
      const [albumRows] = await pool.execute<any[]>('SELECT * FROM albums WHERE name = ?', [
        albumName,
      ]);
      if ((albumRows as any[]).length === 0) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Album not found.' } });
        return;
      }

      const album = (albumRows as any[])[0];

      // Fetch all gallery items in this album to destroy their Cloudinary assets
      const [itemRows] = await pool.execute<any[]>(
        'SELECT cloudinary_public_id, media_type FROM gallery_items WHERE album_id = ?',
        [album.id],
      );

      // Delete the album — FK CASCADE removes all gallery_items
      await pool.execute('DELETE FROM albums WHERE id = ?', [album.id]);

      // Best-effort Cloudinary cleanup after DB delete
      for (const item of itemRows as any[]) {
        const resourceType = item.media_type === 'video' ? 'video' : 'image';
        await destroyCloudinaryAsset(item.cloudinary_public_id, resourceType);
      }

      res.status(204).send();
    } catch (err) {
      console.error('[DELETE /api/gallery/albums/:albumName]', err);
      res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to delete album.' } });
    }
  },
);

// ─── DELETE /api/gallery/:id (admin) ──────────────────────────────────────────

router.delete('/:id', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute<any[]>('SELECT * FROM gallery_items WHERE id = ?', [id]);
    if ((rows as any[]).length === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Gallery item not found.' } });
      return;
    }

    const item = (rows as any[])[0];
    const resourceType = item.media_type === 'video' ? 'video' : 'image';

    await pool.execute('DELETE FROM gallery_items WHERE id = ?', [id]);
    await destroyCloudinaryAsset(item.cloudinary_public_id, resourceType);

    res.status(204).send();
  } catch (err) {
    console.error('[DELETE /api/gallery/:id]', err);
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to delete gallery item.' } });
  }
});

export default router;
