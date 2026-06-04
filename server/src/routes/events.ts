import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../db';
import { authenticateJWT } from '../middleware/auth';
import { Event } from '../types';

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── GET /api/events ──────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query as { q?: string };

    let sql: string;
    const params: unknown[] = [];

    if (q && q.trim()) {
      sql =
        'SELECT * FROM events WHERE MATCH(title, location, description) AGAINST(? IN BOOLEAN MODE) ORDER BY event_date ASC';
      params.push(q.trim());
    } else {
      sql = 'SELECT * FROM events ORDER BY event_date ASC';
    }

    const [rows] = await pool.execute<any[]>(sql, params);
    res.json((rows as any[]).map(mapRowToEvent));
  } catch (err) {
    console.error('[GET /api/events]', err);
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to fetch events.' } });
  }
});

// ─── GET /api/events/:id ──────────────────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute<any[]>('SELECT * FROM events WHERE id = ?', [id]);

    if ((rows as any[]).length === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Event not found.' } });
      return;
    }

    res.json(mapRowToEvent((rows as any[])[0]));
  } catch (err) {
    console.error('[GET /api/events/:id]', err);
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to fetch event.' } });
  }
});

// ─── POST /api/events (admin) ─────────────────────────────────────────────────

const createEventValidation = [
  body('title').trim().notEmpty().withMessage('Title is required.'),
  body('eventDate')
    .trim()
    .notEmpty()
    .withMessage('Event date is required.')
    .isISO8601()
    .withMessage('Event date must be a valid ISO 8601 date (YYYY-MM-DD).'),
  body('location').trim().notEmpty().withMessage('Location is required.'),
  body('description').trim().notEmpty().withMessage('Description is required.'),
  body('registrationUrl').optional({ nullable: true }).trim().isURL().withMessage('Registration URL must be a valid URL.'),
];

router.post(
  '/',
  authenticateJWT,
  createEventValidation,
  async (req: Request, res: Response): Promise<void> => {
    if (validationErrors(req, res)) return;

    const { title, eventDate, location, description, registrationUrl } = req.body as {
      title: string;
      eventDate: string;
      location: string;
      description: string;
      registrationUrl?: string;
    };

    try {
      const [result] = await pool.execute<any>(
        'INSERT INTO events (title, event_date, location, description, registration_url) VALUES (?, ?, ?, ?, ?)',
        [
          title.trim(),
          eventDate.trim(),
          location.trim(),
          description.trim(),
          registrationUrl?.trim() || null,
        ],
      );

      const insertId = (result as any).insertId;
      const [rows] = await pool.execute<any[]>('SELECT * FROM events WHERE id = ?', [insertId]);
      res.status(201).json(mapRowToEvent((rows as any[])[0]));
    } catch (err) {
      console.error('[POST /api/events]', err);
      res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to create event.' } });
    }
  },
);

// ─── PUT /api/events/:id (admin) ──────────────────────────────────────────────

const updateEventValidation = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty.'),
  body('eventDate')
    .optional()
    .trim()
    .isISO8601()
    .withMessage('Event date must be a valid ISO 8601 date (YYYY-MM-DD).'),
  body('location').optional().trim().notEmpty().withMessage('Location cannot be empty.'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty.'),
  body('registrationUrl').optional({ nullable: true }).trim().isURL().withMessage('Registration URL must be a valid URL.'),
];

router.put(
  '/:id',
  authenticateJWT,
  updateEventValidation,
  async (req: Request, res: Response): Promise<void> => {
    if (validationErrors(req, res)) return;

    const { id } = req.params;
    const { title, eventDate, location, description, registrationUrl } = req.body as {
      title?: string;
      eventDate?: string;
      location?: string;
      description?: string;
      registrationUrl?: string;
    };

    try {
      const [rows] = await pool.execute<any[]>('SELECT * FROM events WHERE id = ?', [id]);
      if ((rows as any[]).length === 0) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Event not found.' } });
        return;
      }

      const existing = (rows as any[])[0];
      await pool.execute(
        'UPDATE events SET title = ?, event_date = ?, location = ?, description = ?, registration_url = ? WHERE id = ?',
        [
          title?.trim() ?? existing.title,
          eventDate?.trim() ?? existing.event_date,
          location?.trim() ?? existing.location,
          description?.trim() ?? existing.description,
          registrationUrl !== undefined ? registrationUrl.trim() || null : existing.registration_url,
          id,
        ],
      );

      const [updated] = await pool.execute<any[]>('SELECT * FROM events WHERE id = ?', [id]);
      res.json(mapRowToEvent((updated as any[])[0]));
    } catch (err) {
      console.error('[PUT /api/events/:id]', err);
      res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to update event.' } });
    }
  },
);

// ─── DELETE /api/events/:id (admin) ───────────────────────────────────────────

router.delete('/:id', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute<any[]>('SELECT * FROM events WHERE id = ?', [id]);
    if ((rows as any[]).length === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Event not found.' } });
      return;
    }

    // Cascade delete of gallery_items is handled by the FK constraint (ON DELETE CASCADE)
    await pool.execute('DELETE FROM events WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('[DELETE /api/events/:id]', err);
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to delete event.' } });
  }
});

export default router;
