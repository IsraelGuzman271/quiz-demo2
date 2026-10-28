const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth');
const db = require('../db');

/**
 * GET /api/player/dashboard
 * Protected route accessible to any authenticated user (player or admin)
 */
router.get('/dashboard', requireAuth, (req, res) => {
  return res.json({
    status: 'success',
    message: `Welcome to the Player Zone, ${req.session.username}!`,
    player: {
      userId: req.session.userId,
      username: req.session.username,
      role: req.session.userRole,
    },
    quizzesAvailable: 4,
    rank: 'Active Quizzer',
  });
});

/**
 * GET /api/player/history
 * Returns the authenticated player's personal attempt history and stats.
 * Strictly scoped to req.session.userId so players only access their own history.
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const includeIncomplete = req.query.includeIncomplete === 'true';
    const attempts = await db.getQuizAttemptsByUserId(req.session.userId, !includeIncomplete);
    const stats = await db.getUserQuizStats(req.session.userId);

    return res.json({
      status: 'success',
      userId: req.session.userId,
      username: req.session.username,
      count: attempts.length,
      stats,
      attempts,
    });
  } catch (err) {
    console.error('[PLAYER] Error fetching history:', err);
    return res.status(500).json({ error: 'Failed to retrieve player history.' });
  }
});

module.exports = router;
