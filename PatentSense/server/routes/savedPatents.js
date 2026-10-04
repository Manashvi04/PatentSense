const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db/database');
const { authenticateToken } = require('./auth');

// GET all saved patents for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const saved = await all(`
      SELECT sp.id as save_id, sp.saved_at, p.*
      FROM saved_patents sp
      JOIN patents p ON sp.patent_id = p.id
      WHERE sp.user_id = ?
      ORDER BY sp.saved_at DESC
    `, [req.user.id]);
    res.json(saved);
  } catch (err) {
    console.error('Error fetching saved patents:', err);
    res.status(500).json({ error: 'Failed to load saved patents.' });
  }
});

// POST - save a patent (bookmark)
router.post('/:patentId', authenticateToken, async (req, res) => {
  try {
    const patent = await get("SELECT id FROM patents WHERE id = ?", [req.params.patentId]);
    if (!patent) {
      return res.status(404).json({ error: 'Patent not found.' });
    }
    await run(
      "INSERT OR IGNORE INTO saved_patents (user_id, patent_id) VALUES (?, ?)",
      [req.user.id, req.params.patentId]
    );
    res.json({ success: true, message: 'Patent saved to your library.' });
  } catch (err) {
    console.error('Error saving patent:', err);
    res.status(500).json({ error: 'Failed to save patent.' });
  }
});

// DELETE - unsave / remove bookmark
router.delete('/:patentId', authenticateToken, async (req, res) => {
  try {
    const result = await run(
      "DELETE FROM saved_patents WHERE user_id = ? AND patent_id = ?",
      [req.user.id, req.params.patentId]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Saved patent not found.' });
    }
    res.json({ success: true, message: 'Patent removed from your library.' });
  } catch (err) {
    console.error('Error removing saved patent:', err);
    res.status(500).json({ error: 'Failed to remove saved patent.' });
  }
});

// GET - check if a specific patent is saved by the user
router.get('/check/:patentId', authenticateToken, async (req, res) => {
  try {
    const row = await get(
      "SELECT id FROM saved_patents WHERE user_id = ? AND patent_id = ?",
      [req.user.id, req.params.patentId]
    );
    res.json({ isSaved: !!row });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check saved status.' });
  }
});

module.exports = router;
