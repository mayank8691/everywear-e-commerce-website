import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const sessionCookieName = 'everywear_session';
const jwtSecret = process.env.JWT_SECRET || 'everywear-local-development-secret-change-me';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured in production.');
}

export function setSessionCookie(response, user) {
  const token = jwt.sign({ sub: user._id.toString() }, jwtSecret, { expiresIn: '7d' });
  response.cookie(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(response) {
  response.clearCookie(sessionCookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function requireAuth(request, response, next) {
  try {
    const token = request.cookies[sessionCookieName];
    if (!token) return response.status(401).json({ message: 'Sign in to continue.' });
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.sub).select('name email role');
    if (!user) return response.status(401).json({ message: 'Your session has expired. Sign in again.' });
    request.user = user;
    next();
  } catch {
    response.status(401).json({ message: 'Your session has expired. Sign in again.' });
  }
}

export function requireAdmin(request, response, next) {
  if (request.user?.role !== 'admin') {
    return response.status(403).json({ message: 'Administrator access is required.' });
  }
  next();
}

export function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}