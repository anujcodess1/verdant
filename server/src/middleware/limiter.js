import rateLimit from 'express-rate-limit';
import { config } from '../config.js';

const options = (max, windowMinutes) => ({
  windowMs: windowMinutes * 60000,
  limit: max,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => config.env === 'development' && req.path.startsWith('/health'),
  message: { ok: false, error: { message: 'Too many requests, slow down for a moment' } },
});

export function buildAuthLimiter() {
  return rateLimit(options(40, config.rateLimitWindowMinutes));
}

export function buildApiLimiter() {
  return rateLimit(options(config.rateLimitMax, config.rateLimitWindowMinutes));
}
