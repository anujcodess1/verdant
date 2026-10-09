import jwt from 'jsonwebtoken';
import { config, SESSION_COOKIE } from '../config.js';
import { User } from '../models/User.js';
import { unauthorized } from '../lib/http.js';

export function signSession(user) {
  return jwt.sign({ sub: String(user._id) }, config.jwtSecret, { expiresIn: `${config.sessionTtlDays}d` });
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.secureCookie,
    maxAge: config.sessionTtlDays * 86400000,
    path: '/',
  };
}

export function sendSession(res, user) {
  res.cookie(SESSION_COOKIE, signSession(user), cookieOptions());
}

export function clearSession(res) {
  res.clearCookie(SESSION_COOKIE, { ...cookieOptions(), maxAge: undefined });
}

export function attachUser(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return next();
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.sessionUserId = payload.sub;
  } catch {
    return next();
  }
  return next();
}

export async function requireAuth(req, res, next) {
  if (!req.sessionUserId) return next(unauthorized());
  const user = await User.findById(req.sessionUserId);
  if (!user) return next(unauthorized());
  req.user = user;
  return next();
}
