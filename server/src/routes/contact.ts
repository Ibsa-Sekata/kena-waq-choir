import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../db';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validationErrors(req: Request, res: Response): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const fields: Record<string, string> = {};
    for (const err of errors.array()) {
      const field = (err as { path?: string }).path ?? 'unknown';
      if (!fields[field]) fields[field] = err.msg;
    }
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed.', fields } });
    return true;
  }
  return false;
}

// ─── POST /api/contact ────────────────────────────────────────────────────────

router.post('/contact', [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('A valid email is required.'),
  body('message').trim().notEmpty().withMessage('Message is required.'),
], async (req: Request, res: Response): Promise<void> => {
  if (validationErrors(req, res)) return;
  const { name, email, message } = req.body;
  try {
    const [result] = await pool.execute<any>(
      'INSERT INTO contact_submissions (name, email, message) VALUES (?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), message.trim()],
    );
    res.status(201).json({ id: (result as any).insertId, message: 'Your message has been received. We will get back to you soon.' });
  } catch (err) {
    console.error('[POST /api/contact]', err);
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to submit contact form.' } });
  }
});

// ─── GET /api/contact (admin) ─────────────────────────────────────────────────

router.get('/contact', authenticateJWT, async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute<any[]>('SELECT * FROM contact_submissions ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('[GET /api/contact]', err);
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to fetch contact submissions.' } });
  }
});

// ─── DELETE /api/contact/:id (admin) ─────────────────────────────────────────

router.delete('/contact/:id', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.execute('DELETE FROM contact_submissions WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error('[DELETE /api/contact/:id]', err);
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to delete submission.' } });
  }
});

// ─── POST /api/join ───────────────────────────────────────────────────────────

router.post('/join', [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('voiceType').trim().notEmpty().withMessage('Voice type is required.')
    .isIn(['Soprano', 'Alto', 'Tenor', 'Bass']).withMessage('Voice type must be one of: Soprano, Alto, Tenor, Bass.'),
  body('experienceLevel').trim().notEmpty().withMessage('Experience level is required.'),
  body('message').optional({ nullable: true }).trim(),
], async (req: Request, res: Response): Promise<void> => {
  if (validationErrors(req, res)) return;
  const { name, voiceType, experienceLevel, message } = req.body;
  try {
    const [result] = await pool.execute<any>(
      'INSERT INTO join_applications (name, voice_type, experience_level, message, status) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), voiceType.trim(), experienceLevel.trim(), message?.trim() || null, 'pending'],
    );
    res.status(201).json({ id: (result as any).insertId, message: 'Your application has been received. We will be in touch soon.' });
  } catch (err) {
    console.error('[POST /api/join]', err);
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to submit join application.' } });
  }
});

// ─── GET /api/join (admin) ────────────────────────────────────────────────────

router.get('/join', authenticateJWT, async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute<any[]>('SELECT * FROM join_applications ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('[GET /api/join]', err);
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to fetch applications.' } });
  }
});

// ─── PATCH /api/join/:id (admin) — approve / reject ──────────────────────────

router.patch('/join/:id', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  const { status, adminNotes } = req.body as { status: string; adminNotes?: string };
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Status must be pending, approved, or rejected.' } });
    return;
  }
  try {
    // Get the application first
    const [appRows] = await pool.execute<any[]>('SELECT * FROM join_applications WHERE id = ?', [req.params.id]);
    if ((appRows as any[]).length === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found.' } });
      return;
    }
    const app = (appRows as any[])[0];
    const wasAlreadyApproved = app.status === 'approved';

    // Update application status
    await pool.execute(
      'UPDATE join_applications SET status = ?, admin_notes = ? WHERE id = ?',
      [status, adminNotes?.trim() || null, req.params.id],
    );

    // ── Auto-add to members when approved ─────────────────────────────────
    // Map voice_type to role_category (they match exactly)
    // Only add if this is a NEW approval (not already approved)
    if (status === 'approved' && !wasAlreadyApproved) {
      // Check if member with this name already exists to avoid duplicates
      const [existingMember] = await pool.execute<any[]>(
        'SELECT id FROM members WHERE name = ? AND role_category = ?',
        [app.name, app.voice_type],
      );

      if ((existingMember as any[]).length === 0) {
        const placeholder = `https://ui-avatars.com/api/?name=${encodeURIComponent(app.name)}&background=1a1a2e&color=d4a843&size=200&bold=true`;
        await pool.execute(
          `INSERT INTO members (name, role, role_category, image_url, cloudinary_public_id, is_active)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [
            app.name,
            `${app.voice_type} — ${app.experience_level}`,
            app.voice_type,   // voice_type matches role_category enum values exactly
            placeholder,
            `join_approval_${req.params.id}`,
          ],
        );
      }
    }

    // If rejected and was approved before, deactivate the member
    if (status === 'rejected' && wasAlreadyApproved) {
      await pool.execute(
        'UPDATE members SET is_active = 0 WHERE name = ? AND cloudinary_public_id = ?',
        [app.name, `join_approval_${req.params.id}`],
      );
    }

    const [updated] = await pool.execute<any[]>('SELECT * FROM join_applications WHERE id = ?', [req.params.id]);
    res.json((updated as any[])[0]);
  } catch (err) {
    console.error('[PATCH /api/join/:id]', err);
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to update application.' } });
  }
});

// ─── DELETE /api/join/:id (admin) ────────────────────────────────────────────

router.delete('/join/:id', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.execute('DELETE FROM join_applications WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error('[DELETE /api/join/:id]', err);
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to delete application.' } });
  }
});

export default router;
