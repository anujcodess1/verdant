import 'dotenv/config';

const toNum = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBool = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  return value === 'true' || value === '1';
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: toNum(process.env.PORT, 8787),
  mongoUri: process.env.MONGODB_URI,
  mongoDb: process.env.MONGODB_DB || 'verdant',
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  jwtSecret: process.env.JWT_SECRET,
  sessionTtlDays: toNum(process.env.SESSION_TTL_DAYS, 30),
  webOrigin: process.env.WEB_ORIGIN || 'http://localhost:5173',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
  cronEnabled: toBool(process.env.CRON_ENABLED, true),
  cronSchedule: process.env.CRON_SCHEDULE || '*/5 * * * *',
  reminderHour: toNum(process.env.REMINDER_HOUR, 19),
  secureCookie: toBool(process.env.SECURE_COOKIE, (process.env.NODE_ENV || 'development') === 'production'),
  historyStartKey: process.env.HISTORY_START_KEY || '2020-01-01',
  rateLimitWindowMinutes: toNum(process.env.RATE_LIMIT_WINDOW_MINUTES, 15),
  rateLimitMax: toNum(process.env.RATE_LIMIT_MAX, 600),
};

export const SESSION_COOKIE = 'verdant_session';
