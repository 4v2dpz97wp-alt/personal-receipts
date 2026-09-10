import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '..', 'personal_receipts.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export const INTEREST_KEYS = [
  'interest_top', 'interest_bottom', 'interest_vers', 'interest_oral', 'interest_making_out',
  'interest_leather', 'interest_gear', 'interest_cum', 'interest_body_contact', 'interest_passionate',
  'interest_rough', 'interest_groups', 'interest_threeways',
  'interest_race_play', 'interest_piggy', 'interest_role_play', 'interest_age_play', 'interest_cum_dump',
  'interest_younger', 'interest_older', 'interest_hairy', 'interest_smooth', 'interest_muscular', 'interest_jocks',
];

export function initializeDatabase(): void {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_picture TEXT,
        primary_username TEXT NOT NULL,
        primary_messaging_app TEXT NOT NULL DEFAULT 'Other',
        flag_avoid INTEGER NOT NULL DEFAULT 0,
        flag_twisted INTEGER NOT NULL DEFAULT 0,
        flag_favorite INTEGER NOT NULL DEFAULT 0,
        flag_hot INTEGER NOT NULL DEFAULT 0,
        flag_local INTEGER NOT NULL DEFAULT 0,
        flag_lets_meet INTEGER NOT NULL DEFAULT 0,
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
        do_i_want_to_meet INTEGER DEFAULT 0,
        do_they_want_to_meet INTEGER DEFAULT 0,
        meeting_focus TEXT,
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

      CREATE TABLE IF NOT EXISTS contact_username_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id INTEGER NOT NULL,
        archived_username TEXT NOT NULL,
        archived_at TEXT NOT NULL DEFAULT (datetime('now')),
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

      CREATE TABLE IF NOT EXISTS conversation_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
        UNIQUE(conversation_id, tag_id)
      );

      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        note TEXT,
        due_at TEXT NOT NULL,
        contact_id INTEGER,
        completed INTEGER NOT NULL DEFAULT 0,
        notify INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS account_emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email_address TEXT NOT NULL,
        date_activated TEXT NOT NULL DEFAULT (datetime('now')),
        reset_reminder_date TEXT NOT NULL,
        date_expired TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS common_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'General',
        body TEXT NOT NULL,
        is_favorite INTEGER NOT NULL DEFAULT 0,
        usage_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Safe auto-migration: adds any missing columns to an existing database
    const safeAddColumn = (columnDef: string) => {
      try {
        db.prepare(`ALTER TABLE contacts ADD COLUMN ${columnDef}`).run();
        console.log(`✅ Added column: ${columnDef.split(' ')[0]}`);
      } catch (e) {
        // already exists
      }
    };

    safeAddColumn("flag_local INTEGER NOT NULL DEFAULT 0");
    safeAddColumn("flag_lets_meet INTEGER NOT NULL DEFAULT 0");
    safeAddColumn("do_i_want_to_meet INTEGER DEFAULT 0");
    safeAddColumn("do_they_want_to_meet INTEGER DEFAULT 0");
    safeAddColumn("meeting_focus TEXT");
    safeAddColumn("notes TEXT");
    INTEREST_KEYS.forEach(k => safeAddColumn(`${k} INTEGER NOT NULL DEFAULT 0`));

    console.log('✅ Database tables ready');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
  }
}

export default db;
