import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRouter from './routes/auth';
import songsRouter from './routes/songs';
import eventsRouter from './routes/events';
import membersRouter from './routes/members';
import galleryRouter from './routes/gallery';
import searchRouter from './routes/search';
import contactRouter from './routes/contact';
import aboutRouter from './routes/about';

dotenv.config();

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authRouter);
app.use('/api/songs', songsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/members', membersRouter);
app.use('/api/gallery', galleryRouter);
app.use('/api/search', searchRouter);
app.use('/api', contactRouter);   // handles /api/contact and /api/join
app.use('/api/about', aboutRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.',
    },
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
    },
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '5000', 10);

app.listen(PORT, () => {
  console.info(`KennaWaq Choir API listening on port ${PORT}`);
});

export default app;
