const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'patentsense.db');

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
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL, full_name TEXT NOT NULL, role TEXT DEFAULT 'user',
      organization TEXT DEFAULT '', profession TEXT DEFAULT '', research_interests TEXT DEFAULT '[]', theme TEXT DEFAULT 'dark',
      notifications INTEGER DEFAULT 1, language TEXT DEFAULT 'en', default_domain TEXT DEFAULT 'Artificial Intelligence',
      two_factor INTEGER DEFAULT 0, token_version INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS patents (
      id INTEGER PRIMARY KEY AUTOINCREMENT, patent_number TEXT UNIQUE NOT NULL, title TEXT NOT NULL,
      abstract TEXT NOT NULL, description TEXT NOT NULL, inventors TEXT, assignee TEXT, filing_date TEXT, category TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS analysis_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL,
      abstract TEXT NOT NULL, claims TEXT NOT NULL DEFAULT '', description TEXT NOT NULL,
      technology_domain TEXT, keywords TEXT, source_filename TEXT, source_file_type TEXT, source_text TEXT NOT NULL DEFAULT '',
      novelty_score REAL NOT NULL, similarity_percentage REAL NOT NULL, ai_summary TEXT NOT NULL,
      closest_patent_id INTEGER, raw_results_json TEXT NOT NULL, is_favorite INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (closest_patent_id) REFERENCES patents(id)
    )`,
    `CREATE TABLE IF NOT EXISTS saved_patents (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, patent_id INTEGER NOT NULL,
      saved_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (patent_id) REFERENCES patents(id), UNIQUE(user_id, patent_id)
    )`,
    `CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT, level TEXT NOT NULL DEFAULT 'INFO', message TEXT NOT NULL,
      user_id INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, token_hash TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL, used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS security_migrations (
      name TEXT PRIMARY KEY, applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ];

  db.serialize(() => {
    let remaining = statements.length;
    let failed = false;
    statements.forEach((sql) => db.run(sql, (err) => {
      if (err && !failed) {
        failed = true;
        reject(err);
      }
      remaining -= 1;
      if (remaining === 0 && !failed) {
        ensureAnalysisHistoryColumns(resolve, reject);
      }
    }));
  });
}

function ensureAnalysisHistoryColumns(resolve, reject) {
  db.all('PRAGMA table_info(analysis_history)', (err, columns) => {
    if (err) return reject(err);
    const existing = new Set(columns.map((column) => column.name));
    const migrations = [
      ['claims', "ALTER TABLE analysis_history ADD COLUMN claims TEXT NOT NULL DEFAULT ''"],
      ['source_filename', 'ALTER TABLE analysis_history ADD COLUMN source_filename TEXT'],
      ['source_file_type', 'ALTER TABLE analysis_history ADD COLUMN source_file_type TEXT'],
      ['source_text', "ALTER TABLE analysis_history ADD COLUMN source_text TEXT NOT NULL DEFAULT ''"],
    ].filter(([name]) => !existing.has(name));

    const runNext = () => {
      const migration = migrations.shift();
      if (!migration) {
        return ensureUserColumns(resolve, reject);
      }
      db.run(migration[1], (migrationError) => {
        if (migrationError) return reject(migrationError);
        runNext();
      });
    };
    runNext();
  });
}

function ensureUserColumns(resolve, reject) {
  db.all('PRAGMA table_info(users)', (err, columns) => {
    if (err) return reject(err);
    const existing = new Set(columns.map((column) => column.name));
    const migrations = [
      ['profession', "ALTER TABLE users ADD COLUMN profession TEXT NOT NULL DEFAULT ''"],
      ['default_domain', "ALTER TABLE users ADD COLUMN default_domain TEXT NOT NULL DEFAULT 'Artificial Intelligence'"],
      ['two_factor', 'ALTER TABLE users ADD COLUMN two_factor INTEGER NOT NULL DEFAULT 0'],
      ['token_version', 'ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0'],
    ].filter(([name]) => !existing.has(name));
    const runNext = () => {
      const migration = migrations.shift();
      if (!migration) {
        console.log('Database schemas verified and initialized.');
        return resolve();
      }
      db.run(migration[1], (migrationError) => migrationError ? reject(migrationError) : runNext());
    };
    runNext();
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
