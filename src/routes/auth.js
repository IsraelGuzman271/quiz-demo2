const express = require('express');
const router = express.Router();
const db = require('../db');
const { hashPassword, verifyPassword } = require('../auth');

// Email regex validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register
 * Register a new user with 'player' or 'admin' role
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role = 'player' } = req.body;

    // Validation: username
    if (!username || typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 30) {
      return res.status(400).json({
        error: 'Username must be between 3 and 30 characters.',
      });
    }

    const cleanUsername = username.trim();
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return res.status(400).json({
        error: 'Username can only contain alphanumeric characters and underscores.',
      });
    }

    // Validation: email
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        error: 'A valid email address is required.',
      });
    }
    const cleanEmail = email.trim().toLowerCase();

    // Validation: password
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long.',
      });
    }

    // Validation: role
    const assignedRole = role === 'admin' ? 'admin' : 'player';

    // Check if username already exists
    const existingUsername = await db.getUserByUsername(cleanUsername);
    if (existingUsername) {
      return res.status(400).json({
        error: 'Username is already taken.',
      });
    }

    // Check if email already exists
    const existingEmail = await db.getUserByEmail(cleanEmail);
    if (existingEmail) {
      return res.status(400).json({
        error: 'An account with this email already exists.',
      });
    }

    // Hash password securely with bcrypt
    const passwordHash = await hashPassword(password);

    // Persist to PostgreSQL database
    const newUser = await db.createUser({
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      role: assignedRole,
    });

    // Establish session
    req.session.userId = newUser.id;
    req.session.username = newUser.username;
    req.session.userRole = newUser.role;

    return res.status(201).json({
      message: 'Registration successful.',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        created_at: newUser.created_at,
      },
    });
  } catch (err) {
    console.error('[AUTH] Registration error:', err);
    return res.status(500).json({
      error: 'An unexpected server error occurred during registration.',
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user by username/email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { identifier, username, email, password } = req.body || {};
    const rawId = identifier || username || email;

    if (!rawId || !password) {
      return res.status(400).json({
        error: 'Identifier (username or email) and password are required.',
      });
    }

    const cleanIdentifier = String(rawId).trim();

    // Look up by username first, then by email
    let user = await db.getUserByUsername(cleanIdentifier);
    if (!user && cleanIdentifier.includes('@')) {
      user = await db.getUserByEmail(cleanIdentifier);
    }

    // Secure rejection: uniform 401 response without disclosing whether username exists or password mismatch
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials. Please verify your details and try again.',
      });
    }

    // Verify password with bcrypt
    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid credentials. Please verify your details and try again.',
      });
    }

    // Store in session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.userRole = user.role;

    return res.status(200).json({
      message: 'Login successful.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    return res.status(500).json({
      error: 'An unexpected server error occurred during login.',
    });
  }
});

/**
 * POST /api/auth/logout
 * Terminate user session
 */
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('[AUTH] Logout session destruction error:', err);
        return res.status(500).json({ error: 'Could not log out. Please try again.' });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: 'Logged out successfully.' });
    });
  } else {
    return res.status(200).json({ message: 'Logged out successfully.' });
  }
});

/**
 * GET /api/auth/me
 * Retrieve currently logged-in user profile
 */
router.get('/me', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.json({ user: null });
  }

  try {
    const user = await db.getUserById(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.json({ user: null });
    }

    return res.json({ user });
  } catch (err) {
    console.error('[AUTH] /me error:', err);
    return res.status(500).json({ error: 'Failed to retrieve session profile.' });
  }
});

module.exports = router;
