const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db/database');
const { authenticateToken } = require('./auth');
const axios = require('axios');
const FLASK_URL = (process.env.FLASK_URL || 'http://127.0.0.1:5001').replace(/\/$/, '');
const { logActivity } = require('../utils/logger');

const parseKeywords = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value.split(',').map((keyword) => keyword.trim()).filter(Boolean);
  }
};

const requestSimilarPatents = async (query, candidates) => {
  let response;
  try {
    response = await axios.post(`${FLASK_URL}/api/similarity`, { query, candidates }, {
      timeout: Number(process.env.AI_REQUEST_TIMEOUT_MS) || 120000,
    });
  } catch (error) {
    const unavailable = error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED' || !error.response;
    const serviceError = new Error(unavailable
      ? 'The similarity analysis service is unavailable. Please try again shortly.'
      : error.response?.data?.error || 'The similarity analysis service could not complete the request.');
    serviceError.status = unavailable ? 503 : error.response?.status || 502;
    serviceError.code = unavailable ? 'AI_SERVICE_UNAVAILABLE' : 'AI_SERVICE_ERROR';
    throw serviceError;
  }

  const candidateById = new Map(candidates.map((candidate) => [String(candidate.id), candidate]));
  const results = (Array.isArray(response.data?.results) ? response.data.results : [])
    .map((match) => {
      const candidate = candidateById.get(String(match.id));
      const rawScore = Number(match.similarities?.overall);
      if (!candidate || !Number.isFinite(rawScore)) return null;
      const score = Math.max(0, Math.min(100, Math.round(rawScore)));
      const similarities = Object.fromEntries(['title', 'abstract', 'description'].map((field) => {
        const value = Number(match.similarities?.[field]);
        return [field, Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0];
      }));
      return { ...candidate, similarity: score, similarities: { ...similarities, overall: score } };
    })
    .filter(Boolean)
    .sort((a, b) => b.similarity - a.similarity);

  return {
    results,
    retrievalMethod: response.data?.retrieval_method || 'unknown',
    minimumSimilarity: Number(response.data?.minimum_similarity) || 0,
  };
};

const getNoveltyGuidance = (noveltyScore) => {
  if (noveltyScore >= 70) return 'Lower similarity was found in the searched patent set. Review the closest references and claim scope before drawing conclusions.';
  if (noveltyScore >= 40) return 'Some overlap was found. Compare the closest references against each individual claim limitation.';
  return 'Strong similarity was found to at least one reference. Review that reference and consider claim distinctions with a patent professional.';
};

router.post('/extract', authenticateToken, express.raw({ type: 'application/octet-stream', limit: '25mb' }), async (req, res) => {
  const encodedFilename = req.get('x-filename');
  let filename;
  try {
    filename = decodeURIComponent(encodedFilename || '').split(/[\\/]/).pop();
  } catch {
    return res.status(400).json({ code: 'INVALID_FILENAME', error: 'Upload filename is invalid.' });
  }
  const extension = filename.toLowerCase().split('.').pop();
  if (!['pdf', 'docx', 'txt'].includes(extension)) {
    return res.status(415).json({ code: 'UNSUPPORTED_FILE_TYPE', error: 'Upload a PDF, DOCX, or TXT file.' });
  }
  if (!Buffer.isBuffer(req.body) || !req.body.length) {
    return res.status(400).json({ code: 'EMPTY_UPLOAD', error: 'The uploaded file is empty.' });
  }
  try {
    const response = await axios.post(`${FLASK_URL}/api/extract`, req.body, {
      headers: { 'Content-Type': 'application/octet-stream', 'X-Filename': encodeURIComponent(filename) },
      timeout: Number(process.env.AI_REQUEST_TIMEOUT_MS) || 120000,
      maxBodyLength: 25 * 1024 * 1024,
    });
    res.json(response.data);
  } catch (error) {
    const unavailable = error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED' || !error.response;
    const status = unavailable ? 503 : error.response.status;
    res.status(status).json({
      code: unavailable ? 'AI_SERVICE_UNAVAILABLE' : error.response.data?.code || 'DOCUMENT_EXTRACTION_FAILED',
      error: unavailable ? 'The document extraction service is unavailable. Please try again shortly.' : error.response.data?.error || 'Document extraction failed.',
    });
  }
});

// 1. Submit a patent for analysis
router.post('/submit', authenticateToken, async (req, res) => {
  const { title, abstract, claims = '', description, technologyDomain, keywords, sourceFilename = null, sourceFileType = null, sourceText = '' } = req.body;

  if (!title || !abstract || !description || !technologyDomain) {
    return res.status(400).json({ error: 'Title, abstract, description, and technology domain are required.' });
  }
  if (typeof claims !== 'string' || typeof title !== 'string' || typeof abstract !== 'string' || typeof description !== 'string' || typeof sourceText !== 'string') {
    return res.status(400).json({ error: 'Title, abstract, claims, and description must be text.' });
  }
  if (sourceFilename !== null && (typeof sourceFilename !== 'string' || sourceFilename.length > 260)) {
    return res.status(400).json({ error: 'Source filename is invalid.' });
  }
  if (sourceFileType !== null && !['PDF', 'DOCX', 'TXT'].includes(sourceFileType)) {
    return res.status(400).json({ error: 'Source file type is invalid.' });
  }
  if (title.length > 300 || abstract.length > 50000 || claims.length > 100000 || description.length > 500000 || sourceText.length > 500000) {
    return res.status(413).json({ code: 'INVENTION_TEXT_TOO_LARGE', error: 'One or more invention fields exceed the permitted size.' });
  }

  try {
    // Fetch all reference patents to send as candidates
    const candidates = await all('SELECT id, patent_number, title, abstract, description, category, filing_date FROM patents');
    if (!candidates.length) {
      return res.status(503).json({ code: 'NO_REFERENCE_PATENTS', error: 'There are no reference patents available to compare against.' });
    }
    const retrieval = await requestSimilarPatents({ title, abstract, claims, description, sourceText }, candidates);
    const { results } = retrieval;
    if (!results.length) {
      return res.status(422).json({
        code: 'NO_SUITABLE_MATCH',
        error: 'No patent in the current reference set met the similarity threshold. This does not establish novelty; the corpus may not cover the relevant prior art.',
        minimumSimilarity: retrieval.minimumSimilarity,
      });
    }
    const bestMatch = results[0];
    const similarityPercentage = bestMatch.similarity;
    const noveltyScore = 100 - similarityPercentage;
    const noveltyGuidance = getNoveltyGuidance(noveltyScore);
    const aiSummary = `The highest cosine embedding similarity in the searched reference set is ${similarityPercentage}% for ${bestMatch.patent_number} (${bestMatch.title}), using ${retrieval.retrievalMethod}. The invention title, abstract, ${claims.trim() ? 'claims, ' : ''}and description were compared. The inverse ${noveltyScore}% novelty screening index is a corpus-relative signal, not a patentability conclusion. ${noveltyGuidance}`;
    const analysisResults = {
      noveltyScore,
      similarityPercentage,
      noveltyGuidance,
      retrievalMethod: retrieval.retrievalMethod,
      aiSummary,
      closestPatent: bestMatch,
      topMatches: results.map((match) => ({
        id: match.id,
        patent_number: match.patent_number,
        title: match.title,
        abstract: match.abstract,
        description: match.description,
        category: match.category,
        filing_date: match.filing_date,
        similarity: match.similarity,
        similarities: match.similarities,
        overlapTerms: [],
      })),
    };

    // Save to history with domain and keywords (stored as JSON array)
    const keywordsStr = keywords ? JSON.stringify(keywords) : '[]';

    const query = `
      INSERT INTO analysis_history (
        user_id, title, abstract, claims, description, technology_domain, keywords,
        source_filename, source_file_type, source_text, novelty_score, similarity_percentage, ai_summary,
        closest_patent_id, raw_results_json, is_favorite
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;

    const result = await run(query, [
      req.user.id,
      title,
      abstract,
      claims.trim(),
      description,
      technologyDomain,
      keywordsStr,
      sourceFilename,
      sourceFileType,
      sourceText,
      analysisResults.noveltyScore,
      analysisResults.similarityPercentage,
      analysisResults.aiSummary,
      analysisResults.closestPatent.id,
      JSON.stringify(analysisResults.topMatches)
    ]);

    await logActivity('INFO', `Patent analysis submitted: "${title}" — Novelty Score: ${analysisResults.noveltyScore}%`, req.user.id);

    res.status(201).json({
      id: result.id,
      ...analysisResults,
      claims: claims.trim(),
      technologyDomain,
      keywords
    });
  } catch (error) {
    console.error('Error analyzing patent:', error);
    await logActivity('ERROR', `Analysis submission failed for user ${req.user.id}: ${error.message}`, req.user.id);
    res.status(error.status || 500).json({ code: error.code || 'ANALYSIS_FAILED', error: error.message || 'Internal server error' });
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
      keywords: parseKeywords(item.keywords),
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
    await logActivity('INFO', `Analysis record ID ${req.params.id} deleted by user ${req.user.id}.`, req.user.id);
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
      claims: record.claims || '',
      technologyDomain: record.technology_domain,
      sourceFilename: record.source_filename || null,
      sourceFileType: record.source_file_type || null,
      sourceText: record.source_text || '',
      keywords: parseKeywords(record.keywords),
      noveltyScore: record.novelty_score,
      similarityPercentage: record.similarity_percentage,
      noveltyGuidance: getNoveltyGuidance(record.novelty_score),
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

    // Monthly trend (scans per day for last 30 days)
    const monthlyTrend = await all(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM analysis_history
      WHERE user_id = ? AND created_at >= DATE('now', '-29 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [userId]);

    // Weekly trend (scans per day for last 7 days)
    const weeklyTrend = await all(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM analysis_history
      WHERE user_id = ? AND created_at >= DATE('now', '-6 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [userId]);

    // Build day map helper
    const buildDayMap = (rows, days, labelFormat) => {
      const map = {};
      rows.forEach(r => { map[r.date] = r.count; });
      const result = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const label = labelFormat === 'week'
          ? d.toLocaleDateString('en-US', { weekday: 'short' })
          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        result.push({ label, value: map[key] || 0 });
      }
      return result;
    };

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
      recentScans,
      weeklyTrend: buildDayMap(weeklyTrend, 7, 'week'),
      monthlyTrend: buildDayMap(monthlyTrend, 30, 'month')
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
      sql += " AND (title LIKE ? OR abstract LIKE ? OR description LIKE ? OR patent_number LIKE ? OR category LIKE ? OR assignee LIKE ?)";
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    sql += " ORDER BY title ASC";
    const patents = await all(sql, params);
    res.json(patents);
  } catch (error) {
    console.error('Error searching patents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 8. Similarity search endpoint (used by SimilaritySearch workspace)
router.post('/similarity', authenticateToken, async (req, res) => {
  const { query } = req.body;
  if (typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Query text is required.' });
  }
  try {
    const candidates = await all('SELECT id, patent_number, title, abstract, description, category, filing_date FROM patents');
    const retrieval = await requestSimilarPatents({ title: query.trim(), abstract: '', description: '' }, candidates);
    const results = retrieval.results.map((match) => ({
      ...match,
      technology: match.category,
      publication_date: match.filing_date,
      matching_concepts: [],
    }));
    res.json({ results, no_suitable_match: results.length === 0, retrievalMethod: retrieval.retrievalMethod });
  } catch (err) {
    console.error('Similarity search error:', err);
    res.status(err.status || 500).json({ code: err.code || 'SIMILARITY_SEARCH_FAILED', error: err.message || 'Internal server error' });
  }
});

module.exports = router;
