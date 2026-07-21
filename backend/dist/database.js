"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const db = new better_sqlite3_1.default(path_1.default.join(__dirname, '..', 'personal_receipts.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
function initializeDatabase() {
    db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_picture TEXT,
      primary_username TEXT NOT NULL,
      primary_messaging_app TEXT NOT NULL DEFAULT 'Other',
      flag_avoid INTEGER NOT NULL DEFAULT 0,
      flag_twisted INTEGER NOT NULL DEFAULT 0,
      flag_favorite INTEGER NOT NULL DEFAULT 0,
      flag_hot INTEGER NOT NULL DEFAULT 0,
      real_name TEXT,
      date_of_birth TEXT,
      phone_number TEXT,
      email TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      have_we_met INTEGER NOT NULL DEFAULT 0,
      hang_out_again TEXT,
      hang_out_again_explanation TEXT,
      who_interested_in_meeting TEXT,
      likelihood_of_meeting INTEGER DEFAULT 5,
      interest_top INTEGER NOT NULL DEFAULT 0,
      interest_bottom INTEGER NOT NULL DEFAULT 0,
      interest_vers INTEGER NOT NULL DEFAULT 0,
      interest_oral INTEGER NOT NULL DEFAULT 0,
      interest_making_out INTEGER NOT NULL DEFAULT 0,
      interest_leather INTEGER NOT NULL DEFAULT 0,
      interest_gear INTEGER NOT NULL DEFAULT 0,
      interest_cum INTEGER NOT NULL DEFAULT 0,
      interest_body_contact INTEGER NOT NULL DEFAULT 0,
      interest_passionate INTEGER NOT NULL DEFAULT 0,
      interest_rough INTEGER NOT NULL DEFAULT 0,
      interest_groups INTEGER NOT NULL DEFAULT 0,
      interest_threeways INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_social_apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      app_name TEXT NOT NULL,
      username TEXT NOT NULL,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS contact_associations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      associated_contact_id INTEGER NOT NULL,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
      FOREIGN KEY (associated_contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
      UNIQUE(contact_id, associated_contact_id)
    );

    CREATE TABLE IF NOT EXISTS contact_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      photo_path TEXT NOT NULL,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT NOT NULL,
      primary_contact_id INTEGER NOT NULL,
      date_time TEXT NOT NULL DEFAULT (datetime('now')),
      application TEXT NOT NULL,
      location TEXT,
      conversation_summary TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (primary_contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conversation_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      contact_id INTEGER NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
      UNIQUE(conversation_id, contact_id)
    );

    CREATE TABLE IF NOT EXISTS conversation_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT,
      file_size INTEGER,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#6C5CE7',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
      UNIQUE(contact_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL
    );
  `);
    console.log('✅ Database ready');
}
exports.default = db;
