import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/* ══════════════════════════════════════════════════════
   PROTECT — Verify JWT + attach user to request
   ══════════════════════════════════════════════════════ */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Reject requests from banned users immediately
      if (req.user.status === 'banned') {
        return res.status(403).json({ message: 'Your account has been permanently banned.' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

/* ══════════════════════════════════════════════════════
   ADMIN — Full admin access only
   ══════════════════════════════════════════════════════ */
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

/* ══════════════════════════════════════════════════════
   MODERATOR — Admin or moderator access
   Can review reports, take moderation actions on content/users
   ══════════════════════════════════════════════════════ */
export const moderator = (req, res, next) => {
  const allowedRoles = ['admin', 'moderator'];
  if (req.user && allowedRoles.includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as a moderator' });
  }
};

/* ══════════════════════════════════════════════════════
   CONTENT REVIEWER — Admin, moderator, or content_reviewer
   Can view reports and manage post status
   ══════════════════════════════════════════════════════ */
export const contentReviewer = (req, res, next) => {
  const allowedRoles = ['admin', 'moderator', 'content_reviewer'];
  if (req.user && allowedRoles.includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized to review content' });
  }
};

/* ══════════════════════════════════════════════════════
   STAFF — Any elevated role (can read admin data)
   Includes support_admin who can view users and issue warnings
   ══════════════════════════════════════════════════════ */
export const staff = (req, res, next) => {
  const allowedRoles = ['admin', 'moderator', 'content_reviewer', 'support_admin'];
  if (req.user && allowedRoles.includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as staff' });
  }
};

/* ══════════════════════════════════════════════════════
   OPTIONAL PROTECT — Attaches user if token present,
   continues without error if no token (for public routes
   that show different content when logged in)
   ══════════════════════════════════════════════════════ */
export const optionalProtect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch {
    // Token invalid / expired — continue as anonymous
    req.user = null;
  }
  next();
};