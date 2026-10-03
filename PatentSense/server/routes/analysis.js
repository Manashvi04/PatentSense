const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db/database');
const { authenticateToken } = require('./auth');
const { analyzePatentNovelty } = require('../nlp/similarity');

// 1. Submit a patent for analysis
router.post('/submit', authenticateToken, async (req, res) => {
  const { title, abstract, description, technologyDomain, keywords } = req.body;

  if (!title || !abstract || !description || !technologyDomain) {
    return res.status(400).json({ error: 'Title, abstract, description, and technology domain are required.' });
  }

  try {
    const analysisResults = await analyzePatentNovelty(title, abstract, description);

    // Save to history with domain and keywords (stored as JSON array)
    const keywordsStr = keywords ? JSON.stringify(keywords) : '[]';

    const query = `
      INSERT INTO analysis_history (
        user_id, title, abstract, description, technology_domain, keywords, novelty_score,
        similarity_percentage, ai_summary, closest_patent_id, raw_results_json, is_favorite
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;

    const result = await run(query, [
      req.user.id,
      title,
      abstract,
      description,
      technologyDomain,
      keywordsStr,
      analysisResults.noveltyScore,
      analysisResults.similarityPercentage,
      analysisResults.aiSummary,
      analysisResults.closestPatent.id,
      JSON.stringify(analysisResults.topMatches)
    ]);

    res.status(201).json({
      id: result.id,
      ...analysisResults,
      technologyDomain,
      keywords
    });
  } catch (error) {
    console.error('Error analyzing patent:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 2. Toggle Favorite status
router.put('/history/:id/favorite', authenticateToken, async (req, res) => {
  const { isFavorite } = req.body;
  try {
    const favoriteInt = isFavorite ? 1 : 0;
    const result = await run(
      "UPDATE analysis_history SET is_favorite = ? WHERE id = ? AND user_id = ?",
      [favoriteInt, req.params.id, req.user.id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Record not found or unauthorized' });
    }
    res.json({ success: true, isFavorite });
  } catch (err) {
    console.error('Error toggling favorite:', err);
    res.status(500).json({ error: 'Failed to update favorite status.' });
  }
});

// 3. Get search history list for active user
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT h.id, h.title, h.novelty_score, h.similarity_percentage, h.technology_domain, h.keywords, h.is_favorite, h.created_at, p.title as closest_patent_title, p.patent_number as closest_patent_number
      FROM analysis_history h
      LEFT JOIN patents p ON h.closest_patent_id = p.id
      WHERE h.user_id = ?
      ORDER BY h.created_at DESC
    `;
    const history = await all(query, [req.user.id]);
    
    // Parse keywords for each history record
    const parsedHistory = history.map(item => ({
      ...item,
      keywords: item.keywords ? JSON.parse(item.keywords) : [],
      is_favorite: !!item.is_favorite
    }));

    res.json(parsedHistory);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Delete report
router.delete('/history/:id', authenticateToken, async (req, res) => {
  try {
    const result = await run(
      "DELETE FROM analysis_history WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Record not found or unauthorized' });
    }
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete report.' });
  }
});

// 5. Get single history record details
router.get('/history/:id', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT h.*, p.title as closest_patent_title, p.patent_number as closest_patent_number, p.category as closest_patent_category
      FROM analysis_history h
      LEFT JOIN patents p ON h.closest_patent_id = p.id
      WHERE h.id = ? AND h.user_id = ?
    `;
    const record = await get(query, [req.params.id, req.user.id]);
    if (!record) {
      return res.status(404).json({ error: 'Analysis record not found' });
    }

    const topMatches = JSON.parse(record.raw_results_json);

    res.json({
      id: record.id,
      title: record.title,
      abstract: record.abstract,
      description: record.description,
      technologyDomain: record.technology_domain,
      keywords: record.keywords ? JSON.parse(record.keywords) : [],
      noveltyScore: record.novelty_score,
      similarityPercentage: record.similarity_percentage,
      aiSummary: record.ai_summary,
      isFavorite: !!record.is_favorite,
      created_at: record.created_at,
      closestPatent: {
        id: record.closest_patent_id,
        title: record.closest_patent_title,
        patent_number: record.closest_patent_number,
        category: record.closest_patent_category
      },
      topMatches
    });
  } catch (error) {
    console.error('Error fetching history details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 6. Get aggregate statistics for the dashboard
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const countRow = await get("SELECT COUNT(*) as totalScans FROM analysis_history WHERE user_id = ?", [userId]);
    const avgRow = await get("SELECT AVG(novelty_score) as avgNovelty FROM analysis_history WHERE user_id = ?", [userId]);
    const favRow = await get("SELECT COUNT(*) as count FROM analysis_history WHERE user_id = ? AND is_favorite = 1", [userId]);
    
    // Distribution metrics
    const distRows = await all(`
      SELECT 
        SUM(CASE WHEN novelty_score >= 75 THEN 1 ELSE 0 END) as highCount,
        SUM(CASE WHEN novelty_score >= 45 AND novelty_score < 75 THEN 1 ELSE 0 END) as mediumCount,
        SUM(CASE WHEN novelty_score < 45 THEN 1 ELSE 0 END) as lowCount
      FROM analysis_history 
      WHERE user_id = ?
    `, [userId]);

    // Categories analyzed
    const categoryRows = await all(`
      SELECT p.category, COUNT(h.id) as count
      FROM analysis_history h
      JOIN patents p ON h.closest_patent_id = p.id
      WHERE h.user_id = ?
      GROUP BY p.category
      ORDER BY count DESC
    `, [userId]);

    // Recent scans
    const recentScans = await all(`
      SELECT id, title, novelty_score, similarity_percentage, created_at
      FROM analysis_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `, [userId]);

    res.json({
      totalScans: countRow.totalScans || 0,
      avgNovelty: avgRow.avgNovelty ? Math.round(avgRow.avgNovelty) : 0,
      totalFavorites: favRow.count || 0,
      distribution: {
        high: distRows[0].highCount || 0,
        medium: distRows[0].mediumCount || 0,
        low: distRows[0].lowCount || 0
      },
      categories: categoryRows,
      recentScans
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 7. Search reference patents
router.get('/patents', authenticateToken, async (req, res) => {
  const { search, category } = req.query;
  try {
    let sql = "SELECT * FROM patents WHERE 1=1";
    const params = [];

    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }

    if (search) {
      sql += " AND (title LIKE ? OR abstract LIKE ? OR patent_number LIKE ?)";
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    sql += " ORDER BY title ASC";
    const patents = await all(sql, params);
    res.json(patents);
  } catch (error) {
    console.error('Error searching patents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
