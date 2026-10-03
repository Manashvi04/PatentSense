const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'patentsense.db');

let db;
const dbInitializedPromise = new Promise((resolve, reject) => {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      reject(err);
    } else {
      console.log('Connected to the SQLite database.');
      createTables(resolve, reject);
    }
  });
});

function createTables(resolve, reject) {
  db.serialize(() => {
    // Create users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        organization TEXT DEFAULT '',
        research_interests TEXT DEFAULT '[]',
        theme TEXT DEFAULT 'dark',
        notifications INTEGER DEFAULT 1,
        language TEXT DEFAULT 'en',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create reference patents database
    db.run(`
      CREATE TABLE IF NOT EXISTS patents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patent_number TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        abstract TEXT NOT NULL,
        description TEXT NOT NULL,
        inventors TEXT,
        assignee TEXT,
        filing_date TEXT,
        category TEXT
      )
    `);

    // Create analysis history table
    db.run(`
      CREATE TABLE IF NOT EXISTS analysis_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        abstract TEXT NOT NULL,
        description TEXT NOT NULL,
        technology_domain TEXT,
        keywords TEXT,
        novelty_score REAL NOT NULL,
        similarity_percentage REAL NOT NULL,
        ai_summary TEXT NOT NULL,
        closest_patent_id INTEGER,
        raw_results_json TEXT NOT NULL,
        is_favorite INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (closest_patent_id) REFERENCES patents(id)
      )
    `, (err) => {
      if (err) reject(err);
      else {
        console.log('Database schemas verified and initialized.');
        resolve();
      }
    });
  });
}

// Promisified query wrappers that block until database initialization is complete
const run = (sql, params = []) => {
  return dbInitializedPromise.then(() => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  });
};

const get = (sql, params = []) => {
  return dbInitializedPromise.then(() => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  });
};

const all = (sql, params = []) => {
  return dbInitializedPromise.then(() => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  });
};

module.exports = {
  db,
  dbInitializedPromise,
  run,
  get,
  all
};
