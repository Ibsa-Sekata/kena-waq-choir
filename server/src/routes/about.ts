import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../db';
import { authenticateJWT } from '../middleware/auth';
import { AboutContent, HistoryMilestone } from '../types';

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapRowToAbout(row: any): AboutContent {
  return {
    id: row.id,
    mission: row.mission,
    vision: row.vision,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

function mapRowToMilestone(row: any): HistoryMilestone {
  return {
    id: row.id,
    year: Number(row.year),
    description: row.description,
    sortOrder: row.sort_order,
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

// ─── GET /api/about ───────────────────────────────────────────────────────────

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [contentRows] = await pool.execute<any[]>(
      'SELECT * FROM about_content ORDER BY id ASC LIMIT 1',
    );
    const [milestoneRows] = await pool.execute<any[]>(
      'SELECT * FROM history_milestones ORDER BY sort_order ASC, year ASC',
    );

    const content = (contentRows as any[]).length > 0 ? mapRowToAbout((contentRows as any[])[0]) : null;
    const milestones = (milestoneRows as any[]).map(mapRowToMilestone);

    res.json({ content, milestones });
  } catch (err) {
    console.error('[GET /api/about]', err);
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to fetch about content.' } });
  }
});

// ─── PUT /api/about (admin) ───────────────────────────────────────────────────

const updateAboutValidation = [
  body('mission').optional().trim().notEmpty().withMessage('Mission cannot be empty.'),
  body('vision').optional().trim().notEmpty().withMessage('Vision cannot be empty.'),
  body('milestones').optional().isArray().withMessage('Milestones must be an array.'),
  body('milestones.*.year')
    .optional()
    .isInt({ min: 1900, max: 2100 })
    .withMessage('Milestone year must be a valid year.'),
  body('milestones.*.description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Milestone description cannot be empty.'),
  body('milestones.*.sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Milestone sort order must be a non-negative integer.'),
];

router.put(
  '/',
  authenticateJWT,
  updateAboutValidation,
  async (req: Request, res: Response): Promise<void> => {
    if (validationErrors(req, res)) return;

    const {
      mission,
      vision,
      milestones,
    } = req.body as {
      mission?: string;
      vision?: string;
      milestones?: Array<{
        id?: number;
        year: number;
        description: string;
        sortOrder?: number;
      }>;
    };

    try {
      // ── Update or insert about_content ────────────────────────────────────
      const [contentRows] = await pool.execute<any[]>(
        'SELECT * FROM about_content ORDER BY id ASC LIMIT 1',
      );

      if ((contentRows as any[]).length > 0) {
        const existing = (contentRows as any[])[0];
        await pool.execute('UPDATE about_content SET mission = ?, vision = ? WHERE id = ?', [
          mission?.trim() ?? existing.mission,
          vision?.trim() ?? existing.vision,
          existing.id,
        ]);
      } else {
        // Bootstrap the single about_content row
        if (!mission || !vision) {
          res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Mission and vision are required when creating about content.',
              fields: {
                ...(mission ? {} : { mission: 'Mission is required.' }),
                ...(vision ? {} : { vision: 'Vision is required.' }),
              },
            },
          });
          return;
        }
        await pool.execute('INSERT INTO about_content (mission, vision) VALUES (?, ?)', [
          mission.trim(),
          vision.trim(),
        ]);
      }

      // ── Upsert milestones ─────────────────────────────────────────────────
      if (milestones && Array.isArray(milestones)) {
        for (const milestone of milestones) {
          if (milestone.id) {
            // Update existing milestone
            await pool.execute(
              'UPDATE history_milestones SET year = ?, description = ?, sort_order = ? WHERE id = ?',
              [
                milestone.year,
                milestone.description.trim(),
                milestone.sortOrder ?? 0,
                milestone.id,
              ],
            );
          } else {
            // Insert new milestone
            await pool.execute(
              'INSERT INTO history_milestones (year, description, sort_order) VALUES (?, ?, ?)',
              [milestone.year, milestone.description.trim(), milestone.sortOrder ?? 0],
            );
          }
        }
      }

      // ── Return updated state ──────────────────────────────────────────────
      const [updatedContent] = await pool.execute<any[]>(
        'SELECT * FROM about_content ORDER BY id ASC LIMIT 1',
      );
      const [updatedMilestones] = await pool.execute<any[]>(
        'SELECT * FROM history_milestones ORDER BY sort_order ASC, year ASC',
      );

      res.json({
        content: mapRowToAbout((updatedContent as any[])[0]),
        milestones: (updatedMilestones as any[]).map(mapRowToMilestone),
      });
    } catch (err) {
      console.error('[PUT /api/about]', err);
      res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to update about content.' } });
    }
  },
);

export default router;
