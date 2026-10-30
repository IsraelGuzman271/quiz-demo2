const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/leaderboard/overall
 * Overall leaderboard ranked by total completed quiz attempts.
 * Incomplete attempts are strictly excluded.
 * Ties broken by average percentage, then earliest completion date.
 */
router.get('/overall', async (req, res) => {
  try {
    const leaderboard = await db.getOverallLeaderboard();
    return res.json({
      status: 'success',
      type: 'overall',
      count: leaderboard.length,
      leaderboard,
    });
  } catch (err) {
    console.error('[LEADERBOARD] Error fetching overall leaderboard:', err);
    return res.status(500).json({ error: 'Failed to retrieve overall leaderboard.' });
  }
});

/**
 * GET /api/leaderboard/quiz/:id
 * Per-quiz leaderboard ranked by each user's highest score on that specific quiz.
 * Displays completed attempt count and best percentage.
 * Incomplete attempts are strictly excluded.
 */
router.get('/quiz/:id', async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await db.getQuizById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: `Quiz "${quizId}" not found.` });
    }

    const leaderboard = await db.getQuizLeaderboard(quizId);
    return res.json({
      status: 'success',
      type: 'per-quiz',
      quizId: quiz.id,
      quizTitle: quiz.title,
      category: quiz.category,
      difficulty: quiz.difficulty,
      count: leaderboard.length,
      leaderboard,
    });
  } catch (err) {
    console.error('[LEADERBOARD] Error fetching quiz leaderboard:', err);
    return res.status(500).json({ error: 'Failed to retrieve quiz leaderboard.' });
  }
});

module.exports = router;
