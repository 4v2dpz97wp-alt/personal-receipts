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
// ===== AUTH ROUTES =====
// Check if password exists
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
// First-time password setup
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
        database_1.default.prepare(`
      INSERT OR REPLACE INTO app_settings (key, value)
      VALUES (?, ?)
    `).run('password_hash', hash);
        const token = jsonwebtoken_1.default.sign({ authenticated: true }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to setup password' });
    }
});
// Login
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
// Verify token
app.get('/api/auth/verify', authMiddleware, (_req, res) => {
    res.json({ valid: true });
});
// Change password with old password
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
// ✅ Emergency reset without old password
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
// ===== TAGS ROUTES =====
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
        if (!name?.trim())
            return res.status(400).json({ error: 'Tag name required' });
        const result = database_1.default.prepare(`
      INSERT INTO tags (name, color)
      VALUES (?, ?)
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
      UPDATE tags
      SET name = ?, color = ?
      WHERE id = ?
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
// ===== MAIN APP ROUTES =====
app.use('/api/contacts', authMiddleware, contacts_1.default);
app.use('/api/conversations', authMiddleware, conversations_1.default);
// ===== START SERVER =====
(0, database_1.initializeDatabase)();
console.log('✅ Database initialized');
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
