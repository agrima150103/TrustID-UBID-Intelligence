const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "..", "trustid.db"));

db.pragma("journal_mode = WAL");

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS department_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_system TEXT NOT NULL,
      source_record_id TEXT NOT NULL,
      business_name TEXT NOT NULL,
      normalized_name TEXT,
      address TEXT NOT NULL,
      pin_code TEXT,
      district TEXT,
      sector TEXT,
      pan_hash TEXT,
      gstin_hash TEXT,
      proprietor_hash TEXT,
      phone_hash TEXT,
      raw_pan_present INTEGER DEFAULT 0,
      raw_gstin_present INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ubids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ubid TEXT UNIQUE NOT NULL,
      canonical_name TEXT NOT NULL,
      canonical_address TEXT,
      pin_code TEXT,
      district TEXT,
      sector TEXT,
      status TEXT DEFAULT 'Unknown',
      confidence REAL DEFAULT 0,
      integrity_score REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ubid_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ubid TEXT NOT NULL,
      record_id INTEGER NOT NULL,
      confidence REAL NOT NULL,
      decision TEXT NOT NULL,
      explanation TEXT,
      reviewer_status TEXT DEFAULT 'auto',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(record_id) REFERENCES department_records(id)
    );

    CREATE TABLE IF NOT EXISTS review_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_a INTEGER NOT NULL,
      record_b INTEGER NOT NULL,
      confidence REAL NOT NULL,
      explanation TEXT,
      status TEXT DEFAULT 'pending',
      reviewer_decision TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activity_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_system TEXT NOT NULL,
      source_record_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      event_date TEXT NOT NULL,
      signal_strength INTEGER DEFAULT 1,
      description TEXT,
      joined_ubid TEXT,
      join_confidence REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS integrity_flags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ubid TEXT,
      flag_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      explanation TEXT,
      evidence TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      actor TEXT NOT NULL,
      payload TEXT NOT NULL,
      previous_hash TEXT,
      current_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

module.exports = {
  db,
  initDb
};
