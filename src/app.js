const express = require('express');
const session = require('express-session');
const path = require('path');
const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/player');
const adminRoutes = require('./routes/admin');
const quizRoutes = require('./routes/quiz');
const db = require('./db');

function createApp() {
  const app = express();

  // Parsing middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'qa_replit_quiz_secret_key_phase1_foundation',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Set to true if running strictly behind HTTPS in production
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        sameSite: 'lax',
      },
    })
  );

  // Serve static assets from public/ directory
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/player', playerRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/quizzes', quizRoutes);

  // Health and status endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      phase: 'Phase 2: Quiz engine',
      database: db.isInMemoryDatabase() ? 'PostgreSQL (in-memory pg-mem QA)' : 'PostgreSQL (external)',
      timestamp: new Date().toISOString(),
    });
  });

  // Catch-all route to serve the SPA frontend
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });

  return app;
}

module.exports = { createApp };
