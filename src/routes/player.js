const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth');

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
    quizzesAvailable: 5,
    rank: 'Novice Quizzer',
  });
});

module.exports = router;
