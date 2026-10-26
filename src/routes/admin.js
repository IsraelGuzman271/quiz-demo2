const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../auth');

// All routes in this router require admin role
router.use(requireAdmin);

/**
 * GET /api/admin/overview
 * Restricted to administrators only.
 * Returns system statistics and all registered users (excluding password hashes).
 */
router.get('/overview', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    const playerCount = users.filter((u) => u.role === 'player').length;
    const adminCount = users.filter((u) => u.role === 'admin').length;

    return res.json({
      status: 'success',
      message: 'Admin authorization granted.',
      adminUser: req.session.username,
      stats: {
        totalUsers: users.length,
        players: playerCount,
        admins: adminCount,
      },
      users,
    });
  } catch (err) {
    console.error('[ADMIN] Overview error:', err);
    return res.status(500).json({
      error: 'Failed to retrieve admin system overview.',
    });
  }
});

/**
 * POST /api/admin/system-action
 * Restricted admin action (e.g. system broadcast or maintenance toggle)
 */
router.post('/system-action', (req, res) => {
  const { actionName = 'system_diagnostics' } = req.body;
  return res.json({
    status: 'success',
    executedAction: actionName,
    executedBy: req.session.username,
    timestamp: new Date().toISOString(),
    message: `Administrative action "${actionName}" executed successfully.`,
  });
});

module.exports = router;
