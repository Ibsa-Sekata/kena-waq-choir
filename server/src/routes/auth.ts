import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { JwtPayload } from '../types';

const router = Router();

// ─── Validation Rules ─────────────────────────────────────────────────────────

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('A valid email address is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

router.post('/login', loginValidation, async (req: Request, res: Response): Promise<void> => {
  // 1. Validate inputs
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const fields: Record<string, string> = {};
    for (const err of errors.array()) {
      const field = (err as { path?: string }).path ?? 'unknown';
      if (!fields[field]) fields[field] = err.msg;
    }
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed.',
        fields,
      },
    });
    return;
  }

  const { email, password } = req.body as { email: string; password: string };

  try {
    // 2. Look up admin by email (parameterized query)
    const [rows] = await pool.execute<any[]>('SELECT * FROM admins WHERE email = ?', [
      email.toLowerCase().trim(),
    ]);

    const admin = rows[0];

    // 3. Verify password (constant-time comparison via bcrypt)
    const passwordMatch =
      admin != null ? await bcrypt.compare(password, admin.password_hash) : false;

    if (!admin || !passwordMatch) {
      res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
      return;
    }

    // 4. Sign JWT
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Server configuration error.',
        },
      });
      return;
    }

    const payload: JwtPayload = { adminId: admin.id, email: admin.email };
    const token = jwt.sign(payload, secret, { expiresIn: '24h' });

    res.json({ token });
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'An unexpected error occurred.',
      },
    });
  }
});

export default router;
