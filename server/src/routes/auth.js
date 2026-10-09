import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config.js';
import { User } from '../models/User.js';
import { ApiError, badRequest } from '../lib/http.js';
import { parse, profileUpdateSchema } from '../lib/validation.js';
import { wrap } from '../lib/async-route.js';
import { clearSession, requireAuth, sendSession } from '../middleware/session.js';

const client = new OAuth2Client(config.googleClientId);
export const authRouter = Router();

export function safeTimeZone(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return value.trim();
  } catch {
    return null;
  }
}

async function upsertUser({ googleId, email, name, picture, timezone }) {
  let user = googleId ? await User.findOne({ googleId }) : null;
  if (!user && email) user = await User.findOne({ email });
  if (!user) user = new User({ googleId, email, name, picture });
  if (googleId && !user.googleId) user.googleId = googleId;
  if (email && !user.email) user.email = email;
  if (name) user.name = name;
  if (picture) user.picture = picture;
  const tz = safeTimeZone(timezone) || safeTimeZone(user.timezone);
  if (tz && (!user.timezone || user.timezone === 'UTC')) user.timezone = tz;
  if (!user.timezone || user.timezone === 'UTC') {
    user.timezone = safeTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone) || 'UTC';
  }
  await user.save();
  return user;
}

authRouter.post(
  '/google',
  wrap(async (req, res) => {
    const { idToken, timezone } = req.body ?? {};
    if (typeof idToken !== 'string' || idToken.length < 24) throw badRequest('idToken is required');
    if (!config.googleClientId) throw new ApiError(500, 'Google sign-in is not configured on this server');
    const ticket = await client.verifyIdToken({ idToken, audience: config.googleClientId });
    const payload = ticket.getPayload();
    if (!payload?.sub) throw new ApiError(401, 'Google rejected the sign-in token');
    const user = await upsertUser({
      googleId: payload.sub,
      email: payload.email ? String(payload.email).toLowerCase() : null,
      name: payload.name || payload.email || 'Forest grower',
      picture: payload.picture || '',
      timezone,
    });
    sendSession(res, user);
    res.json({ ok: true, user: user.toPublic() });
  }),
);

authRouter.get(
  '/me',
  wrap(async (req, res) => {
    if (!req.sessionUserId) return res.json({ ok: true, user: null });
    const user = await User.findById(req.sessionUserId);
    if (!user) return res.json({ ok: true, user: null });
    return res.json({ ok: true, user: user.toPublic() });
  }),
);

authRouter.patch(
  '/me',
  requireAuth,
  wrap(async (req, res) => {
    const input = parse(profileUpdateSchema, req.body);
    if (input.name) req.user.name = input.name;
    if (input.timezone) {
      const tz = safeTimeZone(input.timezone);
      if (tz) req.user.timezone = tz;
    }
    if (input.startOfWeek !== undefined) req.user.startOfWeek = input.startOfWeek;
    if (input.onboarded !== undefined) req.user.onboarded = input.onboarded;
    await req.user.save();
    res.json({ ok: true, user: req.user.toPublic() });
  }),
);

authRouter.post('/logout', (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});
