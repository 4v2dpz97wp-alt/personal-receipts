"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importStar(require("./database"));
const contacts_1 = __importDefault(require("./routes/contacts"));
const conversations_1 = __importDefault(require("./routes/conversations"));
const reminders_1 = __importDefault(require("./routes/reminders"));
const commonResponses_1 = __importDefault(require("./routes/commonResponses"));
const app = (0, express_1.default)();
const PORT = 3001;
const JWT_SECRET = 'pr_secret_key_2025';
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
});
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '..', 'uploads')));
// ===== AUTH MIDDLEWARE =====
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token)
        return res.status(401).json({ error: 'No token' });
    try {
        req.user = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        next();
    }
    catch {
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
        const row = database_1.default.prepare(`SELECT value FROM app_settings WHERE key = ?`).get('password_hash');
        res.json({ hasPassword: !!row?.value });
    }
    catch (e) {
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
        const existing = database_1.default.prepare(`SELECT value FROM app_settings WHERE key = ?`).get('password_hash');
        if (existing?.value) {
            return res.status(400).json({ error: 'Password already set' });
        }
        const hash = await bcryptjs_1.default.hash(password, 10);
        database_1.default.prepare(`INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`)
            .run('password_hash', hash);
        const token = jsonwebtoken_1.default.sign({ authenticated: true }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to setup password' });
    }
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const { password } = req.body;
        const row = database_1.default.prepare(`SELECT value FROM app_settings WHERE key = ?`).get('password_hash');
        if (!row?.value) {
            return res.status(400).json({ error: 'No password set' });
        }
        const valid = await bcryptjs_1.default.compare(password, row.value);
        if (!valid) {
            return res.status(401).json({ error: 'Incorrect password' });
        }
        const token = jsonwebtoken_1.default.sign({ authenticated: true }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token });
    }
    catch (e) {
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
        const row = database_1.default.prepare(`SELECT value FROM app_settings WHERE key = ?`).get('password_hash');
        if (!row?.value) {
            return res.status(400).json({ error: 'No password set' });
        }
        const valid = await bcryptjs_1.default.compare(currentPassword, row.value);
        if (!valid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        const hash = await bcryptjs_1.default.hash(newPassword, 10);
        database_1.default.prepare(`UPDATE app_settings SET value = ? WHERE key = ?`).run(hash, 'password_hash');
        res.json({ success: true });
    }
    catch (e) {
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
        const hash = await bcryptjs_1.default.hash(newPassword, 10);
        const existing = database_1.default.prepare(`SELECT id FROM app_settings WHERE key = ?`).get('password_hash');
        if (existing?.id) {
            database_1.default.prepare(`UPDATE app_settings SET value = ? WHERE key = ?`).run(hash, 'password_hash');
        }
        else {
            database_1.default.prepare(`INSERT INTO app_settings (key, value) VALUES (?, ?)`).run('password_hash', hash);
        }
        const token = jsonwebtoken_1.default.sign({ authenticated: true }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ success: true, token });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Emergency reset failed' });
    }
});
// ===== TAGS =====
// ✅ SPECIFIC routes FIRST
app.get('/api/tags/contact/:contactId', authMiddleware, (req, res) => {
    try {
        const rows = database_1.default.prepare(`
      SELECT t.*
      FROM tags t
      JOIN contact_tags ct ON ct.tag_id = t.id
      WHERE ct.contact_id = ?
      ORDER BY t.name
    `).all(req.params.contactId);
        res.json(rows);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to load contact tags' });
    }
});
app.post('/api/tags/contact/:contactId', authMiddleware, (req, res) => {
    try {
        const { tag_ids } = req.body;
        const contactId = Number(req.params.contactId);
        database_1.default.prepare(`DELETE FROM contact_tags WHERE contact_id = ?`).run(contactId);
        if (Array.isArray(tag_ids)) {
            const stmt = database_1.default.prepare(`
        INSERT OR IGNORE INTO contact_tags (contact_id, tag_id)
        VALUES (?, ?)
      `);
            tag_ids.forEach((tagId) => {
                stmt.run(contactId, tagId);
            });
        }
        const rows = database_1.default.prepare(`
      SELECT t.*
      FROM tags t
      JOIN contact_tags ct ON ct.tag_id = t.id
      WHERE ct.contact_id = ?
      ORDER BY t.name
    `).all(contactId);
        res.json(rows);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to save contact tags' });
    }
});
// ✅ DYNAMIC routes AFTER
app.get('/api/tags', authMiddleware, (_req, res) => {
    try {
        const rows = database_1.default.prepare(`SELECT * FROM tags ORDER BY name`).all();
        res.json(rows);
    }
    catch (e) {
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
        const result = database_1.default.prepare(`
      INSERT INTO tags (name, color) VALUES (?, ?)
    `).run(name.trim(), color || '#6C5CE7');
        const row = database_1.default.prepare(`SELECT * FROM tags WHERE id = ?`).get(result.lastInsertRowid);
        res.json(row);
    }
    catch (e) {
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
        database_1.default.prepare(`
      UPDATE tags SET name = ?, color = ? WHERE id = ?
    `).run(name, color, req.params.id);
        const row = database_1.default.prepare(`SELECT * FROM tags WHERE id = ?`).get(req.params.id);
        res.json(row);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to update tag' });
    }
});
app.delete('/api/tags/:id', authMiddleware, (req, res) => {
    try {
        database_1.default.prepare(`DELETE FROM tags WHERE id = ?`).run(req.params.id);
        res.json({ success: true });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to delete tag' });
    }
});
// ===== CONVERSATION TAGS =====
app.get('/api/conversation-tags/:convId', authMiddleware, (req, res) => {
    try {
        const rows = database_1.default.prepare(`
      SELECT t.*
      FROM tags t
      JOIN conversation_tags ct ON ct.tag_id = t.id
      WHERE ct.conversation_id = ?
      ORDER BY t.name
    `).all(req.params.convId);
        res.json(rows);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to load conversation tags' });
    }
});
app.post('/api/conversation-tags/:convId', authMiddleware, (req, res) => {
    try {
        const { tag_ids } = req.body;
        const convId = Number(req.params.convId);
        database_1.default.prepare(`DELETE FROM conversation_tags WHERE conversation_id = ?`).run(convId);
        if (Array.isArray(tag_ids)) {
            const stmt = database_1.default.prepare(`
        INSERT OR IGNORE INTO conversation_tags (conversation_id, tag_id)
        VALUES (?, ?)
      `);
            tag_ids.forEach((tagId) => {
                stmt.run(convId, tagId);
            });
        }
        const rows = database_1.default.prepare(`
      SELECT t.*
      FROM tags t
      JOIN conversation_tags ct ON ct.tag_id = t.id
      WHERE ct.conversation_id = ?
      ORDER BY t.name
    `).all(convId);
        res.json(rows);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to save conversation tags' });
    }
});
// ===== BIRTHDAYS =====
app.get('/api/birthdays/upcoming', authMiddleware, (_req, res) => {
    try {
        const rows = database_1.default.prepare(`
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
    }
    catch (e) {
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
            contacts: database_1.default.prepare('SELECT * FROM contacts').all(),
            social_apps: database_1.default.prepare('SELECT * FROM contact_social_apps').all(),
            associations: database_1.default.prepare('SELECT * FROM contact_associations').all(),
            photos: database_1.default.prepare('SELECT * FROM contact_photos').all(),
            username_history: database_1.default.prepare('SELECT * FROM contact_username_history').all(),
            conversations: database_1.default.prepare('SELECT * FROM conversations').all(),
            participants: database_1.default.prepare('SELECT * FROM conversation_participants').all(),
            documents: database_1.default.prepare('SELECT * FROM conversation_documents').all(),
            tags: database_1.default.prepare('SELECT * FROM tags').all(),
            contact_tags: database_1.default.prepare('SELECT * FROM contact_tags').all(),
            conversation_tags: database_1.default.prepare('SELECT * FROM conversation_tags').all(),
            reminders: database_1.default.prepare('SELECT * FROM reminders').all(),
        };
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="personal-receipts-backup-${new Date().toISOString().split('T')[0]}.json"`);
        res.json(backup);
    }
    catch (e) {
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
        const restore = database_1.default.transaction(() => {
            database_1.default.prepare('DELETE FROM conversation_tags').run();
            database_1.default.prepare('DELETE FROM contact_tags').run();
            database_1.default.prepare('DELETE FROM tags').run();
            database_1.default.prepare('DELETE FROM conversation_documents').run();
            database_1.default.prepare('DELETE FROM conversation_participants').run();
            database_1.default.prepare('DELETE FROM conversations').run();
            database_1.default.prepare('DELETE FROM contact_photos').run();
            database_1.default.prepare('DELETE FROM contact_associations').run();
            database_1.default.prepare('DELETE FROM contact_social_apps').run();
            database_1.default.prepare('DELETE FROM contact_username_history').run();
            database_1.default.prepare('DELETE FROM reminders').run();
            database_1.default.prepare('DELETE FROM contacts').run();
            for (const c of backup.contacts || []) {
                database_1.default.prepare(`
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
            interest_race_play, interest_piggy, interest_role_play,
            interest_age_play, interest_cum_dump, interest_younger,
            interest_older, interest_hairy, interest_smooth,
            interest_muscular, interest_jocks,
            notes, created_at, updated_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).run(c.id, c.profile_picture, c.primary_username, c.primary_messaging_app, c.flag_avoid, c.flag_twisted, c.flag_favorite, c.flag_hot, c.real_name, c.date_of_birth, c.phone_number, c.email, c.city, c.state, c.country, c.have_we_met, c.hang_out_again, c.hang_out_again_explanation, c.who_interested_in_meeting, c.likelihood_of_meeting, c.interest_top, c.interest_bottom, c.interest_vers, c.interest_oral, c.interest_making_out, c.interest_leather, c.interest_gear, c.interest_cum, c.interest_body_contact, c.interest_passionate, c.interest_rough, c.interest_groups, c.interest_threeways, c.interest_race_play || 0, c.interest_piggy || 0, c.interest_role_play || 0, c.interest_age_play || 0, c.interest_cum_dump || 0, c.interest_younger || 0, c.interest_older || 0, c.interest_hairy || 0, c.interest_smooth || 0, c.interest_muscular || 0, c.interest_jocks || 0, c.notes, c.created_at, c.updated_at);
            }
            for (const a of backup.social_apps || []) {
                database_1.default.prepare(`
          INSERT OR REPLACE INTO contact_social_apps (id, contact_id, app_name, username)
          VALUES (?,?,?,?)
        `).run(a.id, a.contact_id, a.app_name, a.username);
            }
            for (const a of backup.associations || []) {
                database_1.default.prepare(`
          INSERT OR IGNORE INTO contact_associations (id, contact_id, associated_contact_id)
          VALUES (?,?,?)
        `).run(a.id, a.contact_id, a.associated_contact_id);
            }
            for (const p of backup.photos || []) {
                database_1.default.prepare(`
          INSERT OR REPLACE INTO contact_photos (id, contact_id, photo_path, uploaded_at)
          VALUES (?,?,?,?)
        `).run(p.id, p.contact_id, p.photo_path, p.uploaded_at);
            }
            for (const u of backup.username_history || []) {
                database_1.default.prepare(`
          INSERT OR REPLACE INTO contact_username_history (id, contact_id, archived_username, archived_at)
          VALUES (?,?,?,?)
        `).run(u.id, u.contact_id, u.archived_username, u.archived_at);
            }
            for (const c of backup.conversations || []) {
                database_1.default.prepare(`
          INSERT OR REPLACE INTO conversations (
            id, subject, primary_contact_id, date_time,
            application, location, conversation_summary, created_at, updated_at
          ) VALUES (?,?,?,?,?,?,?,?,?)
        `).run(c.id, c.subject, c.primary_contact_id, c.date_time, c.application, c.location, c.conversation_summary, c.created_at, c.updated_at);
            }
            for (const p of backup.participants || []) {
                database_1.default.prepare(`
          INSERT OR IGNORE INTO conversation_participants (id, conversation_id, contact_id)
          VALUES (?,?,?)
        `).run(p.id, p.conversation_id, p.contact_id);
            }
            for (const d of backup.documents || []) {
                database_1.default.prepare(`
          INSERT OR REPLACE INTO conversation_documents (
            id, conversation_id, file_path, file_name, file_type, file_size, uploaded_at
          ) VALUES (?,?,?,?,?,?,?)
        `).run(d.id, d.conversation_id, d.file_path, d.file_name, d.file_type, d.file_size, d.uploaded_at);
            }
            for (const t of backup.tags || []) {
                database_1.default.prepare(`
          INSERT OR REPLACE INTO tags (id, name, color, created_at)
          VALUES (?,?,?,?)
        `).run(t.id, t.name, t.color, t.created_at);
            }
            for (const ct of backup.contact_tags || []) {
                database_1.default.prepare(`
          INSERT OR IGNORE INTO contact_tags (id, contact_id, tag_id)
          VALUES (?,?,?)
        `).run(ct.id, ct.contact_id, ct.tag_id);
            }
            for (const ct of backup.conversation_tags || []) {
                database_1.default.prepare(`
          INSERT OR IGNORE INTO conversation_tags (id, conversation_id, tag_id)
          VALUES (?,?,?)
        `).run(ct.id, ct.conversation_id, ct.tag_id);
            }
            for (const r of backup.reminders || []) {
                database_1.default.prepare(`
          INSERT OR REPLACE INTO reminders (
            id, title, note, due_at, contact_id, completed, notify, created_at, updated_at
          ) VALUES (?,?,?,?,?,?,?,?,?)
        `).run(r.id, r.title, r.note, r.due_at, r.contact_id, r.completed, r.notify, r.created_at, r.updated_at);
            }
        });
        restore();
        res.json({ success: true, message: 'Restore complete' });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Restore failed' });
    }
});
// ===== ACCOUNT EMAILS =====
// GET active email
app.get('/api/account-emails/active', authMiddleware, (req, res) => {
    try {
        const row = database_1.default.prepare(`
      SELECT * FROM account_emails
      WHERE is_active = 1
      ORDER BY date_activated DESC
      LIMIT 1
    `).get();
        res.json(row || null);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to load active email' });
    }
});
// GET all emails
app.get('/api/account-emails', authMiddleware, (req, res) => {
    try {
        const rows = database_1.default.prepare(`
      SELECT * FROM account_emails
      ORDER BY date_activated DESC
    `).all();
        res.json(rows);
    }
    catch (e) {
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
        const transaction = database_1.default.transaction(() => {
            database_1.default.prepare(`
        UPDATE account_emails
        SET is_active = 0, date_expired = datetime('now')
        WHERE is_active = 1
      `).run();
            const result = database_1.default.prepare(`
        INSERT INTO account_emails
          (email_address, date_activated, reset_reminder_date, is_active)
        VALUES (?, datetime('now'), ?, 1)
      `).run(email_address.trim(), reminderDateStr);
            return result.lastInsertRowid;
        });
        const newId = transaction();
        const row = database_1.default.prepare(`
      SELECT * FROM account_emails WHERE id = ?
    `).get(newId);
        res.status(201).json(row);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to reset email' });
    }
});
// GET check if reminder is due
app.get('/api/account-emails/reminder-due', authMiddleware, (req, res) => {
    try {
        const row = database_1.default.prepare(`
      SELECT * FROM account_emails
      WHERE is_active = 1
        AND reset_reminder_date <= datetime('now')
      LIMIT 1
    `).get();
        res.json({ due: !!row, email: row || null });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to check reminder' });
    }
});
// ===== MAIN ROUTES =====
app.use('/api/contacts', authMiddleware, contacts_1.default);
app.use('/api/conversations', authMiddleware, conversations_1.default);
app.use('/api/reminders', authMiddleware, reminders_1.default);
app.use('/api/common-responses', authMiddleware, commonResponses_1.default); // ← ADD THIS
// ===== START =====
(0, database_1.initializeDatabase)();
console.log('✅ Database initialized');
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
