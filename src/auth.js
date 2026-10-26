/**
 * Authentication and Authorization module.
 * Provides bcrypt password hashing, verification, and role-based access control middleware.
 */

const bcrypt = require('bcryptjs');

const BCRYPT_SALT_ROUNDS = 10;

/**
 * Hash plain-text password using bcrypt
 */
async function hashPassword(plainTextPassword) {
  if (!plainTextPassword || typeof plainTextPassword !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  return bcrypt.hash(plainTextPassword, BCRYPT_SALT_ROUNDS);
}

/**
 * Verify plain-text password against bcrypt hash
 */
async function verifyPassword(plainTextPassword, hashedPassword) {
  if (!plainTextPassword || !hashedPassword) {
    return false;
  }
  return bcrypt.compare(plainTextPassword, hashedPassword);
}

/**
 * Middleware: Requires the user to be logged in
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: 'Authentication required. Please log in.',
    });
  }
  next();
}

/**
 * Middleware: Requires the user to have the 'admin' role
 */
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: 'Authentication required. Please log in.',
    });
  }

  if (req.session.userRole !== 'admin') {
    return res.status(403).json({
      error: 'Access denied. Administrator privileges required.',
    });
  }

  next();
}

module.exports = {
  hashPassword,
  verifyPassword,
  requireAuth,
  requireAdmin,
};
