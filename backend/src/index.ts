import express from 'express';
import cors from 'cors';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db, { initializeDatabase } from './database';
import contactsRouter from './routes/contacts';
import conversationsRouter from './routes/conversations';
import remindersRouter from './routes/reminders';
import commonResponsesRouter from './routes/commonResponses';

const app = express();
const PORT = 3001;
const JWT_SECRET = 'pr_secret_key_2025';

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ===== AUTH MIDDLEWARE =====
const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ===== HEALTH =====
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ===== AUTH =====
app.get('/api/auth/status', (_req, res) => {
  try {
    const row = db.prepare(`SELECT value FROM app_settings WHERE key = ?`).get('password_hash') as any;
    res.json({ hasPassword: !!row?.value });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to check auth status' });
  }
});

app.post('/api/auth/setup', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const existing = db.prepare(`SELECT value FROM app_settings WHERE key = ?`).get('password_hash') as any;
    if (existing?.value) {
      return res.status(400).json({ error: 'Password already set' });
    }

    const hash = await bcrypt.hash(password, 10);
    db.prepare(`INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`)
      .run('password_hash', hash);

    const token = jwt.sign({ authenticated: true }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to setup password' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { password } = req.body;
    const row = db.prepare(`SELECT value FROM app_settings WHERE key = ?`).get('password_hash') as any;

    if (!row?.value) {
      return res.status(400).json({ error: 'No password set' });
    }

    const valid = await bcrypt.compare(password, row.value);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = jwt.sign({ authenticated: true }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/verify', authMiddleware, (_req, res) => {
  res.json({ valid: true });
});

app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters' });
    }

    const row = db.prepare(`SELECT value FROM app_settings WHERE key = ?`).get('password_hash') as any;
    if (!row?.value) {
      return res.status(400).json({ error: 'No password set' });
    }

    const valid = await bcrypt.compare(currentPassword, row.value);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    db.prepare(`UPDATE app_settings SET value = ? WHERE key = ?`).run(hash, 'password_hash');

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

app.post('/api/auth/emergency-reset', async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    const existing = db.prepare(`SELECT id FROM app_settings WHERE key = ?`).get('password_hash') as any;

    if (existing?.id) {
      db.prepare(`UPDATE app_settings SET value = ? WHERE key = ?`).run(hash, 'password_hash');
    } else {
      db.prepare(`INSERT INTO app_settings (key, value) VALUES (?, ?)`).run('password_hash', hash);
    }

    const token = jwt.sign({ authenticated: true }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Emergency reset failed' });
  }
});

// ===== TAGS =====

// ✅ SPECIFIC routes FIRST
app.get('/api/tags/contact/:contactId', authMiddleware, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT t.*
      FROM tags t
      JOIN contact_tags ct ON ct.tag_id = t.id
      WHERE ct.contact_id = ?
      ORDER BY t.name
    `).all(req.params.contactId);

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load contact tags' });
  }
});

app.post('/api/tags/contact/:contactId', authMiddleware, (req, res) => {
  try {
    const { tag_ids } = req.body;
    const contactId = Number(req.params.contactId);

    db.prepare(`DELETE FROM contact_tags WHERE contact_id = ?`).run(contactId);

    if (Array.isArray(tag_ids)) {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO contact_tags (contact_id, tag_id)
        VALUES (?, ?)
      `);
      tag_ids.forEach((tagId: number) => {
        stmt.run(contactId, tagId);
      });
    }

    const rows = db.prepare(`
      SELECT t.*
      FROM tags t
      JOIN contact_tags ct ON ct.tag_id = t.id
      WHERE ct.contact_id = ?
      ORDER BY t.name
    `).all(contactId);

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to save contact tags' });
  }
});

// ✅ DYNAMIC routes AFTER
app.get('/api/tags', authMiddleware, (_req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM tags ORDER BY name`).all();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load tags' });
  }
});

app.post('/api/tags', authMiddleware, (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Tag name required' });
    }
    const result = db.prepare(`
      INSERT INTO tags (name, color) VALUES (?, ?)
    `).run(name.trim(), color || '#6C5CE7');
    const row = db.prepare(`SELECT * FROM tags WHERE id = ?`).get(result.lastInsertRowid);
    res.json(row);
  } catch (e: any) {
    console.error(e);
    if (String(e.message || '').includes('UNIQUE')) {
      return res.status(400).json({ error: 'Tag already exists' });
    }
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

app.put('/api/tags/:id', authMiddleware, (req, res) => {
  try {
    const { name, color } = req.body;
    db.prepare(`
      UPDATE tags SET name = ?, color = ? WHERE id = ?
    `).run(name, color, req.params.id);
    const row = db.prepare(`SELECT * FROM tags WHERE id = ?`).get(req.params.id);
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

app.delete('/api/tags/:id', authMiddleware, (req, res) => {
  try {
    db.prepare(`DELETE FROM tags WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

// ===== CONVERSATION TAGS =====
app.get('/api/conversation-tags/:convId', authMiddleware, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT t.*
      FROM tags t
      JOIN conversation_tags ct ON ct.tag_id = t.id
      WHERE ct.conversation_id = ?
      ORDER BY t.name
    `).all(req.params.convId);

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load conversation tags' });
  }
});

app.post('/api/conversation-tags/:convId', authMiddleware, (req, res) => {
  try {
    const { tag_ids } = req.body;
    const convId = Number(req.params.convId);

    db.prepare(`DELETE FROM conversation_tags WHERE conversation_id = ?`).run(convId);

    if (Array.isArray(tag_ids)) {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO conversation_tags (conversation_id, tag_id)
        VALUES (?, ?)
      `);

      tag_ids.forEach((tagId: number) => {
        stmt.run(convId, tagId);
      });
    }

    const rows = db.prepare(`
      SELECT t.*
      FROM tags t
      JOIN conversation_tags ct ON ct.tag_id = t.id
      WHERE ct.conversation_id = ?
      ORDER BY t.name
    `).all(convId);

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to save conversation tags' });
  }
});

// ===== BIRTHDAYS =====
app.get('/api/birthdays/upcoming', authMiddleware, (_req, res) => {
  try {
    const rows = db.prepare(`
      SELECT id, primary_username, real_name, date_of_birth, profile_picture
      FROM contacts
      WHERE date_of_birth IS NOT NULL AND date_of_birth != ''
      ORDER BY
        CASE
          WHEN strftime('%m-%d', date_of_birth) >= strftime('%m-%d', 'now')
            THEN strftime('%m-%d', date_of_birth)
          ELSE strftime('%m-%d', date(date_of_birth, '+1 year'))
        END
      LIMIT 20
    `).all();

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load birthdays' });
  }
});

// ===== BACKUP =====
app.get('/api/backup', authMiddleware, (_req, res) => {
  try {
    const backup = {
      version: 1,
      exported_at: new Date().toISOString(),
      contacts: db.prepare('SELECT * FROM contacts').all(),
      social_apps: db.prepare('SELECT * FROM contact_social_apps').all(),
      associations: db.prepare('SELECT * FROM contact_associations').all(),
      photos: db.prepare('SELECT * FROM contact_photos').all(),
      username_history: db.prepare('SELECT * FROM contact_username_history').all(),
      conversations: db.prepare('SELECT * FROM conversations').all(),
      participants: db.prepare('SELECT * FROM conversation_participants').all(),
      documents: db.prepare('SELECT * FROM conversation_documents').all(),
      tags: db.prepare('SELECT * FROM tags').all(),
      contact_tags: db.prepare('SELECT * FROM contact_tags').all(),
      conversation_tags: db.prepare('SELECT * FROM conversation_tags').all(),
      reminders: db.prepare('SELECT * FROM reminders').all(),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="personal-receipts-backup-${new Date().toISOString().split('T')[0]}.json"`
    );

    res.json(backup);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Backup failed' });
  }
});

// ===== RESTORE =====
app.post('/api/restore', authMiddleware, (req, res) => {
  try {
    const backup = req.body;

    if (!backup?.version || !Array.isArray(backup.contacts)) {
      return res.status(400).json({ error: 'Invalid backup file' });
    }

    const restore = db.transaction(() => {
      db.prepare('DELETE FROM conversation_tags').run();
      db.prepare('DELETE FROM contact_tags').run();
      db.prepare('DELETE FROM tags').run();
      db.prepare('DELETE FROM conversation_documents').run();
      db.prepare('DELETE FROM conversation_participants').run();
      db.prepare('DELETE FROM conversations').run();
      db.prepare('DELETE FROM contact_photos').run();
      db.prepare('DELETE FROM contact_associations').run();
      db.prepare('DELETE FROM contact_social_apps').run();
      db.prepare('DELETE FROM contact_username_history').run();
      db.prepare('DELETE FROM reminders').run();
      db.prepare('DELETE FROM contacts').run();

      for (const c of backup.contacts || []) {
        db.prepare(`
          INSERT OR REPLACE INTO contacts (
            id, profile_picture, primary_username, primary_messaging_app,
            flag_avoid, flag_twisted, flag_favorite, flag_hot,
            real_name, date_of_birth, phone_number, email,
            city, state, country,
            have_we_met, hang_out_again, hang_out_again_explanation,
            who_interested_in_meeting, likelihood_of_meeting,
            interest_top, interest_bottom, interest_vers, interest_oral,
            interest_making_out, interest_leather, interest_gear,
            interest_cum, interest_body_contact, interest_passionate,
            interest_rough, interest_groups, interest_threeways,
            notes, created_at, updated_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).run(
          c.id, c.profile_picture, c.primary_username, c.primary_messaging_app,
          c.flag_avoid, c.flag_twisted, c.flag_favorite, c.flag_hot,
          c.real_name, c.date_of_birth, c.phone_number, c.email,
          c.city, c.state, c.country,
          c.have_we_met, c.hang_out_again, c.hang_out_again_explanation,
          c.who_interested_in_meeting, c.likelihood_of_meeting,
          c.interest_top, c.interest_bottom, c.interest_vers, c.interest_oral,
          c.interest_making_out, c.interest_leather, c.interest_gear,
          c.interest_cum, c.interest_body_contact, c.interest_passionate,
          c.interest_rough, c.interest_groups, c.interest_threeways,
          c.notes, c.created_at, c.updated_at
        );
      }

      for (const a of backup.social_apps || []) {
        db.prepare(`
          INSERT OR REPLACE INTO contact_social_apps (id, contact_id, app_name, username)
          VALUES (?,?,?,?)
        `).run(a.id, a.contact_id, a.app_name, a.username);
      }

      for (const a of backup.associations || []) {
        db.prepare(`
          INSERT OR IGNORE INTO contact_associations (id, contact_id, associated_contact_id)
          VALUES (?,?,?)
        `).run(a.id, a.contact_id, a.associated_contact_id);
      }

      for (const p of backup.photos || []) {
        db.prepare(`
          INSERT OR REPLACE INTO contact_photos (id, contact_id, photo_path, uploaded_at)
          VALUES (?,?,?,?)
        `).run(p.id, p.contact_id, p.photo_path, p.uploaded_at);
      }

      for (const u of backup.username_history || []) {
        db.prepare(`
          INSERT OR REPLACE INTO contact_username_history (id, contact_id, archived_username, archived_at)
          VALUES (?,?,?,?)
        `).run(u.id, u.contact_id, u.archived_username, u.archived_at);
      }

      for (const c of backup.conversations || []) {
        db.prepare(`
          INSERT OR REPLACE INTO conversations (
            id, subject, primary_contact_id, date_time,
            application, location, conversation_summary, created_at, updated_at
          ) VALUES (?,?,?,?,?,?,?,?,?)
        `).run(
          c.id, c.subject, c.primary_contact_id, c.date_time,
          c.application, c.location, c.conversation_summary,
          c.created_at, c.updated_at
        );
      }

      for (const p of backup.participants || []) {
        db.prepare(`
          INSERT OR IGNORE INTO conversation_participants (id, conversation_id, contact_id)
          VALUES (?,?,?)
        `).run(p.id, p.conversation_id, p.contact_id);
      }

      for (const d of backup.documents || []) {
        db.prepare(`
          INSERT OR REPLACE INTO conversation_documents (
            id, conversation_id, file_path, file_name, file_type, file_size, uploaded_at
          ) VALUES (?,?,?,?,?,?,?)
        `).run(
          d.id, d.conversation_id, d.file_path, d.file_name,
          d.file_type, d.file_size, d.uploaded_at
        );
      }

      for (const t of backup.tags || []) {
        db.prepare(`
          INSERT OR REPLACE INTO tags (id, name, color, created_at)
          VALUES (?,?,?,?)
        `).run(t.id, t.name, t.color, t.created_at);
      }

      for (const ct of backup.contact_tags || []) {
        db.prepare(`
          INSERT OR IGNORE INTO contact_tags (id, contact_id, tag_id)
          VALUES (?,?,?)
        `).run(ct.id, ct.contact_id, ct.tag_id);
      }

      for (const ct of backup.conversation_tags || []) {
        db.prepare(`
          INSERT OR IGNORE INTO conversation_tags (id, conversation_id, tag_id)
          VALUES (?,?,?)
        `).run(ct.id, ct.conversation_id, ct.tag_id);
      }

      for (const r of backup.reminders || []) {
        db.prepare(`
          INSERT OR REPLACE INTO reminders (
            id, title, note, due_at, contact_id, completed, notify, created_at, updated_at
          ) VALUES (?,?,?,?,?,?,?,?,?)
        `).run(
          r.id, r.title, r.note, r.due_at,
          r.contact_id, r.completed, r.notify,
          r.created_at, r.updated_at
        );
      }
    });

    restore();
    res.json({ success: true, message: 'Restore complete' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Restore failed' });
  }
});
// ===== ACCOUNT EMAILS =====

// GET active email
app.get('/api/account-emails/active', authMiddleware, (req, res) => {
  try {
    const row = db.prepare(`
      SELECT * FROM account_emails
      WHERE is_active = 1
      ORDER BY date_activated DESC
      LIMIT 1
    `).get();
    res.json(row || null);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load active email' });
  }
});

// GET all emails
app.get('/api/account-emails', authMiddleware, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM account_emails
      ORDER BY date_activated DESC
    `).all();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load account emails' });
  }
});

// POST reset email
app.post('/api/account-emails/reset', authMiddleware, (req, res) => {
  try {
    const { email_address } = req.body;

    if (!email_address?.trim()) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 14);
    const reminderDateStr = reminderDate.toISOString();

    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE account_emails
        SET is_active = 0, date_expired = datetime('now')
        WHERE is_active = 1
      `).run();

      const result = db.prepare(`
        INSERT INTO account_emails
          (email_address, date_activated, reset_reminder_date, is_active)
        VALUES (?, datetime('now'), ?, 1)
      `).run(email_address.trim(), reminderDateStr);

      return result.lastInsertRowid;
    });

    const newId = transaction();
    const row = db.prepare(`
      SELECT * FROM account_emails WHERE id = ?
    `).get(newId);

    res.status(201).json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to reset email' });
  }
});

// GET check if reminder is due
app.get('/api/account-emails/reminder-due', authMiddleware, (req, res) => {
  try {
    const row = db.prepare(`
      SELECT * FROM account_emails
      WHERE is_active = 1
        AND reset_reminder_date <= datetime('now')
      LIMIT 1
    `).get();

    res.json({ due: !!row, email: row || null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to check reminder' });
  }
});

// ===== MAIN ROUTES =====
app.use('/api/contacts', authMiddleware, contactsRouter);
app.use('/api/conversations', authMiddleware, conversationsRouter);
app.use('/api/reminders', authMiddleware, remindersRouter);
app.use('/api/common-responses', authMiddleware, commonResponsesRouter); // ← ADD THIS

// ===== START =====
initializeDatabase();
console.log('✅ Database initialized');

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});