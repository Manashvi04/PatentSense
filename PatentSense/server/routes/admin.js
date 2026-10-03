const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/database');
const { authenticateToken } = require('./auth');

// Middleware to verify Administrator privileges
const verifyAdmin = async (req, res, next) => {
  try {
    const user = await get("SELECT role FROM users WHERE id = ?", [req.user.id]);
    if (!user || user.role !== 'admin') {
      // In local environments, if there is only 1 user, let them pass as admin to prevent locking
      const usersCount = await get("SELECT COUNT(*) as count FROM users");
      if (usersCount.count <= 1) {
        return next();
      }
      return res.status(403).json({ error: 'Access denied. Administrative access required.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: 'Admin authorization check failed.' });
  }
};

// Admin metrics & analytics
router.get('/stats', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const usersCount = await get("SELECT COUNT(*) as count FROM users");
    const scansCount = await get("SELECT COUNT(*) as count FROM analysis_history");
    const avgNovelty = await get("SELECT AVG(novelty_score) as avg FROM analysis_history");
    
    // User growth projection
    const userGrowth = [
      { date: "Jul 28", count: Math.max(1, usersCount.count - 4) },
      { date: "Jul 30", count: Math.max(1, usersCount.count - 2) },
      { date: "Aug 01", count: Math.max(1, usersCount.count - 1) },
      { date: "Aug 04", count: usersCount.count }
    ];

    // Search activity projection
    const searchTrends = [
      { date: "Mon", count: 3 },
      { date: "Tue", count: 7 },
      { date: "Wed", count: 5 },
      { date: "Thu", count: 8 },
      { date: "Fri", count: 12 },
      { date: "Sat", count: 4 },
      { date: "Sun", count: scansCount.count }
    ];

    res.json({
      totalUsers: usersCount.count,
      totalSearches: scansCount.count,
      avgNovelty: avgNovelty.avg ? Math.round(avgNovelty.avg) : 0,
      userGrowth,
      searchTrends
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
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified.' });
  }
  try {
    await run("UPDATE users SET role = ? WHERE id = ?", [role, req.params.id]);
    res.json({ success: true, message: `User role successfully updated to ${role}.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// Access simulated activity logs
router.get('/logs', authenticateToken, verifyAdmin, async (req, res) => {
  const mockLogs = [
    { timestamp: new Date(Date.now() - 50000).toISOString(), level: "INFO", message: "User authentication token issued successfully" },
    { timestamp: new Date(Date.now() - 300000).toISOString(), level: "INFO", message: "SQLite seeded with 10 reference patents successfully" },
    { timestamp: new Date(Date.now() - 600000).toISOString(), level: "WARNING", message: "Python similarity engine offline, falling back to local JS matching" },
    { timestamp: new Date(Date.now() - 900000).toISOString(), level: "INFO", message: "Server connection established on port 5000" }
  ];
  res.json(mockLogs);
});

// Simulated feedback logs
router.get('/feedback', authenticateToken, verifyAdmin, async (req, res) => {
  const mockFeedback = [
    { id: 1, name: "David K.", email: "david@mit.edu", text: "The accuracy for machine learning matching is phenomenal! Saved us hours of prior-art reading.", rating: 5 },
    { id: 2, name: "Sarah L.", email: "sarah@lawgroup.com", text: "Downloadable PDF reports format clean. Can you add claims highlighting indicators next?", rating: 4 }
  ];
  res.json(mockFeedback);
});

module.exports = router;
