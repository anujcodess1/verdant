import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { ApiError } from './lib/http.js';
import { attachUser } from './middleware/session.js';
import { authRouter } from './routes/auth.js';
import { healthRouter } from './routes/health.js';
import { habitRouter } from './routes/habits.js';
import { dashboardRouter } from './routes/dashboard.js';
import { notificationRouter } from './routes/notifications.js';
import { systemRouter } from './routes/system.js';
import { buildAuthLimiter, buildApiLimiter } from './middleware/limiter.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const webDist = path.resolve(here, '../../web/dist');

function allowOrigin(origin) {
  if (!origin) return true;
  const allowed = new Set([
    config.webOrigin,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    `http://localhost:${config.port}`,
    `http://127.0.0.1:${config.port}`,
    ...config.allowedOrigins,
  ]);
  return allowed.has(origin);
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", 'https://accounts.google.com'],
          frameSrc: ["'self'", 'https://accounts.google.com'],
          connectSrc: ["'self'", 'https://accounts.google.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://accounts.google.com'],
          fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          frameAncestors: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use((req, res, next) => {
    if (req.headers.origin && req.headers.origin === `${req.protocol}://${req.get('host')}`) {
      delete req.headers.origin;
    }
    next();
  });

  app.use(
    cors({
      origin: (origin, next) =>
        next(allowOrigin(origin) ? null : new ApiError(403, `Origin ${origin} is not allowed`)),
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '128kb' }));
  app.use(cookieParser());
  app.use(attachUser);

  app.use('/api/health', healthRouter);
  app.use('/health', healthRouter);

  app.use('/api/auth', buildAuthLimiter(), authRouter);
  app.use('/api/habits', habitRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/notifications', notificationRouter);
  app.use('/api', buildApiLimiter(), systemRouter);

  app.use('/api', (req, res) => {
    res.status(404).json({ ok: false, error: { message: 'Endpoint not found' } });
  });

  if (existsSync(webDist)) {
    app.use(express.static(webDist, { maxAge: '1d', index: false }));
    app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(webDist, 'index.html')));
  }

  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    if (existsSync(webDist)) return res.sendFile(path.join(webDist, 'index.html'));
    return res.status(404).json({ ok: false, error: { message: 'Frontend not built. Run pnpm build.' } });
  });

  app.use((err, req, res, next) => {
    const status = err instanceof ApiError ? err.status : Number(err?.status) || 500;
    const message = status >= 500 ? 'Something went wrong on our side' : err.message || 'Request failed';
    if (status >= 500) console.error(err);
    res.status(status).json({ ok: false, error: { message, details: err.details } });
  });

  return app;
}
