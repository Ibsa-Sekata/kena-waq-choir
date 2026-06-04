import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import pool from '../db';
import { authenticateJWT } from '../middleware/auth';
import { uploadToCloudinary, destroyCloudinaryAsset } from '../services/cloudinary';
import { Member } from '../types';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapRowToMember(row: any): Member {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    roleCategory: row.role_category,
    imageUrl: row.image_url,
    cloudinaryPublicId: row.cloudinary_public_id,
    isActive: Boolean(row.is_active),
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

// ─── GET /api/members ─────────────────────────────────────────────────────────

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute<any[]>(
      'SELECT * FROM members WHERE is_active = 1 ORDER BY role_category ASC, name ASC',
    );
    res.json((rows as any[]).map(mapRowToMember));
  } catch (err) {
    console.error('[GET /api/members]', err);
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to fetch members.' } });
  }
});

// ─── POST /api/members (admin) ────────────────────────────────────────────────

const createMemberValidation = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('role').trim().notEmpty().withMessage('Role is required.'),
  body('roleCategory')
    .trim()
    .notEmpty()
    .withMessage('Role category is required.')
    .isIn(['Choir Leader', 'Soprano', 'Alto', 'Tenor', 'Bass'])
    .withMessage('Role category must be one of: Choir Leader, Soprano, Alto, Tenor, Bass.'),
];

router.post(
  '/',
  authenticateJWT,
  upload.single('image'),
  createMemberValidation,
  async (req: Request, res: Response): Promise<void> => {
    if (validationErrors(req, res)) return;

    if (!req.file) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Member image is required.',
          fields: { image: 'Member image is required.' },
        },
      });
      return;
    }

    const { name, role, roleCategory } = req.body as {
      name: string;
      role: string;
      roleCategory: string;
    };

    let uploadResult: { publicId: string; secureUrl: string; resourceType: string };
    try {
      uploadResult = await uploadToCloudinary(req.file.buffer, 'kennawaq/members', 'image');
    } catch (err) {
      console.error('[POST /api/members] Cloudinary upload failed:', err);
      res.status(502).json({
        error: { code: 'MEDIA_UPLOAD_FAILED', message: 'Failed to upload member image.' },
      });
      return;
    }

    try {
      const [result] = await pool.execute<any>(
        'INSERT INTO members (name, role, role_category, image_url, cloudinary_public_id, is_active) VALUES (?, ?, ?, ?, ?, 1)',
        [name.trim(), role.trim(), roleCategory.trim(), uploadResult.secureUrl, uploadResult.publicId],
      );

      const insertId = (result as any).insertId;
      const [rows] = await pool.execute<any[]>('SELECT * FROM members WHERE id = ?', [insertId]);
      res.status(201).json(mapRowToMember((rows as any[])[0]));
    } catch (err) {
      console.error('[POST /api/members] DB insert failed:', err);
      await destroyCloudinaryAsset(uploadResult.publicId, 'image');
      res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to save member.' } });
    }
  },
);

// ─── PUT /api/members/:id (admin) ─────────────────────────────────────────────

const updateMemberValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('role').optional().trim().notEmpty().withMessage('Role cannot be empty.'),
  body('roleCategory')
    .optional()
    .trim()
    .isIn(['Choir Leader', 'Soprano', 'Alto', 'Tenor', 'Bass'])
    .withMessage('Role category must be one of: Choir Leader, Soprano, Alto, Tenor, Bass.'),
];

router.put(
  '/:id',
  authenticateJWT,
  upload.single('image'),
  updateMemberValidation,
  async (req: Request, res: Response): Promise<void> => {
    if (validationErrors(req, res)) return;

    const { id } = req.params;
    const { name, role, roleCategory } = req.body as {
      name?: string;
      role?: string;
      roleCategory?: string;
    };

    try {
      const [rows] = await pool.execute<any[]>('SELECT * FROM members WHERE id = ?', [id]);
      if ((rows as any[]).length === 0) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Member not found.' } });
        return;
      }

      const existing = (rows as any[])[0];
      let newImageUrl: string = existing.image_url;
      let newPublicId: string = existing.cloudinary_public_id;
      let oldPublicId: string | null = null;

      // If a new image was uploaded, replace the Cloudinary asset
      if (req.file) {
        let uploadResult: { publicId: string; secureUrl: string; resourceType: string };
        try {
          uploadResult = await uploadToCloudinary(req.file.buffer, 'kennawaq/members', 'image');
        } catch (err) {
          console.error('[PUT /api/members/:id] Cloudinary upload failed:', err);
          res.status(502).json({
            error: { code: 'MEDIA_UPLOAD_FAILED', message: 'Failed to upload member image.' },
          });
          return;
        }
        oldPublicId = existing.cloudinary_public_id;
        newImageUrl = uploadResult.secureUrl;
        newPublicId = uploadResult.publicId;
      }

      await pool.execute(
        'UPDATE members SET name = ?, role = ?, role_category = ?, image_url = ?, cloudinary_public_id = ? WHERE id = ?',
        [
          name?.trim() ?? existing.name,
          role?.trim() ?? existing.role,
          roleCategory?.trim() ?? existing.role_category,
          newImageUrl,
          newPublicId,
          id,
        ],
      );

      // Clean up old Cloudinary asset after successful DB update
      if (oldPublicId) {
        await destroyCloudinaryAsset(oldPublicId, 'image');
      }

      const [updated] = await pool.execute<any[]>('SELECT * FROM members WHERE id = ?', [id]);
      res.json(mapRowToMember((updated as any[])[0]));
    } catch (err) {
      console.error('[PUT /api/members/:id]', err);
      res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to update member.' } });
    }
  },
);

// ─── DELETE /api/members/:id (admin) ──────────────────────────────────────────

router.delete('/:id', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute<any[]>('SELECT * FROM members WHERE id = ?', [id]);
    if ((rows as any[]).length === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Member not found.' } });
      return;
    }

    const member = (rows as any[])[0];
    await pool.execute('DELETE FROM members WHERE id = ?', [id]);
    await destroyCloudinaryAsset(member.cloudinary_public_id, 'image');

    res.status(204).send();
  } catch (err) {
    console.error('[DELETE /api/members/:id]', err);
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Failed to delete member.' } });
  }
});

export default router;
