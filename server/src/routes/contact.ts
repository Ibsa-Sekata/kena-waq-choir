import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../db';

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
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed.', fields },
    });
    return true;
  }
  return false;
}

// ─── POST /api/contact ────────────────────────────────────────────────────────

const contactValidation = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('A valid email address is required.'),
  body('message').trim().notEmpty().withMessage('Message is required.'),
];

router.post('/contact', contactValidation, async (req: Request, res: Response): Promise<void> => {
  if (validationErrors(req, res)) return;

  const { name, email, message } = req.body as {
    name: string;
    email: string;
    message: string;
  };

  try {
    const [result] = await pool.execute<any>(
      'INSERT INTO contact_submissions (name, email, message) VALUES (?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), message.trim()],
    );

    res.status(201).json({
      id: (result as any).insertId,
      message: 'Your message has been received. We will get back to you soon.',
    });
  } catch (err) {
    console.error('[POST /api/contact]', err);
    res.status(500).json({
      error: { code: 'DATABASE_ERROR', message: 'Failed to submit contact form.' },
    });
  }
});

// ─── POST /api/join ───────────────────────────────────────────────────────────

const joinValidation = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('voiceType')
    .trim()
    .notEmpty()
    .withMessage('Voice type is required.')
    .isIn(['Soprano', 'Alto', 'Tenor', 'Bass'])
    .withMessage('Voice type must be one of: Soprano, Alto, Tenor, Bass.'),
  body('experienceLevel').trim().notEmpty().withMessage('Experience level is required.'),
  body('message').optional({ nullable: true }).trim(),
];

router.post('/join', joinValidation, async (req: Request, res: Response): Promise<void> => {
  if (validationErrors(req, res)) return;

  const { name, voiceType, experienceLevel, message } = req.body as {
    name: string;
    voiceType: string;
    experienceLevel: string;
    message?: string;
  };

  try {
    const [result] = await pool.execute<any>(
      'INSERT INTO join_applications (name, voice_type, experience_level, message) VALUES (?, ?, ?, ?)',
      [name.trim(), voiceType.trim(), experienceLevel.trim(), message?.trim() || null],
    );

    res.status(201).json({
      id: (result as any).insertId,
      message: 'Your application has been received. We will be in touch soon.',
    });
  } catch (err) {
    console.error('[POST /api/join]', err);
    res.status(500).json({
      error: { code: 'DATABASE_ERROR', message: 'Failed to submit join application.' },
    });
  }
});

export default router;
