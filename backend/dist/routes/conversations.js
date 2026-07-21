"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../database"));
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    try {
        const search = req.query.search;
        let query = `
      SELECT conv.*, c.primary_username, c.profile_picture
      FROM conversations conv
      JOIN contacts c ON c.id = conv.primary_contact_id
    `;
        const params = [];
        if (search) {
            query += ' WHERE conv.subject LIKE ? OR c.primary_username LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }
        query += ' ORDER BY conv.date_time DESC LIMIT 50';
        const conversations = database_1.default.prepare(query).all(...params);
        const getParticipants = database_1.default.prepare(`
      SELECT cp.contact_id, c.primary_username, c.profile_picture
      FROM conversation_participants cp
      JOIN contacts c ON c.id = cp.contact_id
      WHERE cp.conversation_id = ?
    `);
        const getDocs = database_1.default.prepare('SELECT * FROM conversation_documents WHERE conversation_id = ?');
        res.json(conversations.map((conv) => ({
            ...conv,
            participants: getParticipants.all(conv.id),
            documents: getDocs.all(conv.id),
        })));
    }
    catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});
router.get('/recent', (_req, res) => {
    try {
        res.json(database_1.default.prepare(`
      SELECT conv.*, c.primary_username, c.profile_picture
      FROM conversations conv
      JOIN contacts c ON c.id = conv.primary_contact_id
      ORDER BY conv.date_time DESC LIMIT 10
    `).all());
    }
    catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});
router.get('/:id', (req, res) => {
    try {
        const conv = database_1.default.prepare(`
      SELECT conv.*, c.primary_username, c.profile_picture
      FROM conversations conv
      JOIN contacts c ON c.id = conv.primary_contact_id
      WHERE conv.id = ?
    `).get(req.params.id);
        if (!conv)
            return res.status(404).json({ error: 'Not found' });
        const participants = database_1.default.prepare(`
      SELECT cp.contact_id, c.primary_username, c.profile_picture
      FROM conversation_participants cp
      JOIN contacts c ON c.id = cp.contact_id
      WHERE cp.conversation_id = ?
    `).all(req.params.id);
        const documents = database_1.default.prepare('SELECT * FROM conversation_documents WHERE conversation_id = ?').all(req.params.id);
        res.json({ ...conv, participants, documents });
    }
    catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});
router.post('/', (req, res) => {
    try {
        const { subject, primary_contact_id, date_time, application, location, conversation_summary, additional_contact_ids } = req.body;
        const transaction = database_1.default.transaction(() => {
            const result = database_1.default.prepare(`
        INSERT INTO conversations (subject, primary_contact_id, date_time, application, location, conversation_summary)
        VALUES (?,?,?,?,?,?)
      `).run(subject, primary_contact_id, date_time || new Date().toISOString(), application, location || null, conversation_summary || null);
            const convId = result.lastInsertRowid;
            if (additional_contact_ids?.length) {
                const ins = database_1.default.prepare('INSERT OR IGNORE INTO conversation_participants (conversation_id, contact_id) VALUES (?,?)');
                for (const cid of additional_contact_ids)
                    ins.run(convId, cid);
            }
            return convId;
        });
        const convId = transaction();
        res.status(201).json(database_1.default.prepare('SELECT * FROM conversations WHERE id = ?').get(convId));
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create' });
    }
});
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { subject, primary_contact_id, date_time, application, location, conversation_summary, additional_contact_ids } = req.body;
        const transaction = database_1.default.transaction(() => {
            database_1.default.prepare(`
        UPDATE conversations SET subject=?, primary_contact_id=?, date_time=?,
        application=?, location=?, conversation_summary=?, updated_at=datetime('now')
        WHERE id=?
      `).run(subject, primary_contact_id, date_time, application, location || null, conversation_summary || null, id);
            if (additional_contact_ids) {
                database_1.default.prepare('DELETE FROM conversation_participants WHERE conversation_id = ?').run(id);
                const ins = database_1.default.prepare('INSERT OR IGNORE INTO conversation_participants (conversation_id, contact_id) VALUES (?,?)');
                for (const cid of additional_contact_ids)
                    ins.run(id, cid);
            }
        });
        transaction();
        res.json(database_1.default.prepare('SELECT * FROM conversations WHERE id = ?').get(id));
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to update' });
    }
});
router.delete('/:id', (req, res) => {
    try {
        database_1.default.prepare('DELETE FROM conversations WHERE id = ?').run(req.params.id);
        res.json({ message: 'Deleted' });
    }
    catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});
// Upload documents to a conversation
router.post('/:id/documents', (req, res) => {
    (0, upload_1.uploadDocuments)(req, res, (err) => {
        if (err)
            return res.status(400).json({ error: err.message });
        const files = req.files;
        if (!files?.length)
            return res.status(400).json({ error: 'No files' });
        const ins = database_1.default.prepare('INSERT INTO conversation_documents (conversation_id, file_path, file_name, file_type, file_size) VALUES (?,?,?,?,?)');
        const docs = [];
        for (const file of files) {
            const fp = `/uploads/documents/${file.filename}`;
            ins.run(req.params.id, fp, file.originalname, file.mimetype, file.size);
            docs.push({ file_path: fp, file_name: file.originalname, file_type: file.mimetype, file_size: file.size });
        }
        res.json({ documents: docs });
    });
});
// Delete a document
router.delete('/:convId/documents/:docId', (req, res) => {
    try {
        database_1.default.prepare('DELETE FROM conversation_documents WHERE id = ?').run(req.params.docId);
        res.json({ message: 'Deleted' });
    }
    catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});
exports.default = router;
