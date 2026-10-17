const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/database');
const { authenticateToken } = require('./auth');
const { logActivity } = require('../utils/logger');

// Middleware to verify Administrator privileges
const verifyAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ code: 'ADMIN_REQUIRED', error: 'Access denied. Administrative access required.' });
  }
  return next();
};

// Admin metrics & analytics
router.get('/stats', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const usersCount = await get("SELECT COUNT(*) as count FROM users");
    const scansCount = await get("SELECT COUNT(*) as count FROM analysis_history");
    const avgNovelty = await get("SELECT AVG(novelty_score) as avg FROM analysis_history");
    const patentsCount = await get('SELECT COUNT(*) as count FROM patents');

    // Real user growth: registrations per day for the last 7 days
    const userGrowthRows = await all(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= DATE('now', '-6 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Real search activity: scans per day for the last 7 days
    const searchTrendRows = await all(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM analysis_history
      WHERE created_at >= DATE('now', '-6 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Build a 7-day map (fill missing days with 0)
    const buildDayMap = (rows) => {
      const map = {};
      rows.forEach(r => { map[r.date] = r.count; });
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-US', { weekday: 'short' });
        result.push({ date: label, count: map[key] || 0 });
      }
      return result;
    };

    res.json({
      totalUsers: usersCount.count,
      totalSearches: scansCount.count,
      referencePatents: patentsCount.count,
      avgNovelty: avgNovelty.avg ? Math.round(avgNovelty.avg) : 0,
      userGrowth: buildDayMap(userGrowthRows),
      searchTrends: buildDayMap(searchTrendRows)
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Manage users list
router.get('/users', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const users = await all("SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users list.' });
  }
});

// Update user role
router.put('/users/:id/role', authenticateToken, verifyAdmin, async (req, res) => {
  const { role } = req.body;
  const targetId = Number(req.params.id);
  if (!Number.isSafeInteger(targetId) || targetId <= 0) return res.status(400).json({ error: 'Invalid user ID.' });
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified.' });
  }
  try {
    const target = await get('SELECT id, role FROM users WHERE id = ?', [targetId]);
    if (!target) return res.status(404).json({ error: 'User not found.' });
    if (targetId === req.user.id && role !== 'admin') return res.status(400).json({ error: 'You cannot remove your own administrator role.' });
    if (target.role === 'admin' && role !== 'admin') {
      const admins = await get("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
      if (admins.count <= 1) return res.status(409).json({ error: 'The last administrator cannot be demoted.' });
    }
    await run('UPDATE users SET role = ? WHERE id = ?', [role, targetId]);
    await logActivity('INFO', `User ID ${targetId} role updated to '${role}' by admin ID ${req.user.id}.`, req.user.id);
    res.json({ success: true, message: `User role successfully updated to ${role}.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// Delete a user
router.delete('/users/:id', authenticateToken, verifyAdmin, async (req, res) => {
  const targetId = Number(req.params.id);
  if (!Number.isSafeInteger(targetId) || targetId <= 0) return res.status(400).json({ error: 'Invalid user ID.' });
  try {
    if (targetId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account from admin panel.' });
    }
    const target = await get('SELECT id, role FROM users WHERE id = ?', [targetId]);
    if (!target) return res.status(404).json({ error: 'User not found.' });
    if (target.role === 'admin') {
      const admins = await get("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
      if (admins.count <= 1) return res.status(409).json({ error: 'The last administrator cannot be deleted.' });
    }
    await run('DELETE FROM password_reset_tokens WHERE user_id = ?', [targetId]);
    await run('DELETE FROM analysis_history WHERE user_id = ?', [targetId]);
    await run('DELETE FROM saved_patents WHERE user_id = ?', [targetId]);
    await run('DELETE FROM activity_logs WHERE user_id = ?', [targetId]);
    await run('DELETE FROM users WHERE id = ?', [targetId]);
    await logActivity('WARNING', `User ID ${targetId} deleted by admin ID ${req.user.id}.`, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// Real activity logs from DB (last 50 entries)
router.get('/logs', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const logs = await all(
      "SELECT level, message, created_at as timestamp FROM activity_logs ORDER BY created_at DESC LIMIT 50"
    );

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity logs.' });
  }
});

// Feedback: stored in activity_logs with level='FEEDBACK' (real persistence)
router.get('/feedback', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const feedbackRows = await all(
      "SELECT id, message, created_at FROM activity_logs WHERE level = 'FEEDBACK' ORDER BY created_at DESC LIMIT 20"
    );
    res.json(feedbackRows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feedback.' });
  }
});

// Submit feedback (any authenticated user)
router.post('/feedback', authenticateToken, async (req, res) => {
  const { message } = req.body;
  if (!message || message.trim().length < 5) {
    return res.status(400).json({ error: 'Feedback message is required (min 5 chars).' });
  }
  try {
    await run(
      "INSERT INTO activity_logs (level, message, user_id) VALUES ('FEEDBACK', ?, ?)",
      [message.trim(), req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit feedback.' });
  }
});

module.exports = { router };
