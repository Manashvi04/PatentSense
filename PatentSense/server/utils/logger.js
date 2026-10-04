const { run } = require('../db/database');

/**
 * Inserts a real activity log entry into the activity_logs table.
 * Non-blocking: errors are silently ignored so they never crash callers.
 * @param {string} level   - 'INFO' | 'WARNING' | 'ERROR' | 'FEEDBACK'
 * @param {string} message - Human-readable log message
 * @param {number|null} userId - Optional user ID for attribution
 */
async function logActivity(level, message, userId = null) {
  try {
    await run(
      "INSERT INTO activity_logs (level, message, user_id) VALUES (?, ?, ?)",
      [level, message, userId]
    );
  } catch (_) { /* non-critical — never crash the caller */ }
}

module.exports = { logActivity };
