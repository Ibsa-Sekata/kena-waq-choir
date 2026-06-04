import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

// Extend Express Request to carry the decoded admin payload
declare global {
  namespace Express {
    interface Request {
      admin?: JwtPayload;
    }
  }
}

/**
 * Middleware that validates the Authorization: Bearer <token> header.
 * Returns HTTP 401 for missing, malformed, or expired tokens.
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token is required.',
      },
    });
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix
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

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.admin = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token has expired.',
        },
      });
    } else {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid authentication token.',
        },
      });
    }
  }
}
