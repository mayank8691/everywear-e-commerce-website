import bcrypt from 'bcryptjs';
import { rateLimit } from 'express-rate-limit';
import { Router } from 'express';
import User from '../models/User.js';
import { clearSessionCookie, publicUser, requireAuth, sessionCookieName, setSessionCookie } from '../middleware/auth.js';

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Please try again later.' },
});
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', authLimiter, async (request, response, next) => {
  try {
    const name = String(request.body.name || '').trim();
    const email = String(request.body.email || '').trim().toLowerCase();
    const password = String(request.body.password || '');
    if (name.length < 2 || name.length > 80 || !emailPattern.test(email) || password.length < 8) {
      return response.status(400).json({ message: 'Enter a name, valid email, and password of at least 8 characters.' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, role: 'customer' });
    setSessionCookie(response, user);
    response.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return response.status(409).json({ message: 'An account with this email already exists.' });
    next(error);
  }
});

router.post('/login', authLimiter, async (request, response, next) => {
  try {
    const email = String(request.body.email || '').trim().toLowerCase();
    const password = String(request.body.password || '');
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return response.status(401).json({ message: 'Email or password is incorrect.' });
    }
    setSessionCookie(response, user);
    response.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.get('/me', (request, response, next) => {
  if (!request.cookies[sessionCookieName]) return response.json({ user: null });
  requireAuth(request, response, () => response.json({ user: publicUser(request.user) }));
});

router.post('/logout', (_request, response) => {
  clearSessionCookie(response);
  response.json({ ok: true });
});

export default router;