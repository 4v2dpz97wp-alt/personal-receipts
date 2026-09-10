"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../database"));
const router = (0, express_1.Router)();
// GET all responses (with optional search & category filter)
router.get('/', (_req, res) => {
    try {
        const { search, category, favorites } = _req.query;
        let query = `SELECT * FROM common_responses WHERE 1=1`;
        const params = [];
        if (search) {
            query += ` AND (title LIKE ? OR body LIKE ? OR category LIKE ?)`;
            const term = `%${search}%`;
            params.push(term, term, term);
        }
        if (category) {
            query += ` AND category = ?`;
            params.push(category);
        }
        if (favorites === 'true') {
            query += ` AND is_favorite = 1`;
        }
        query += ` ORDER BY is_favorite DESC, usage_count DESC, title ASC`;
        const rows = database_1.default.prepare(query).all(...params);
        res.json(rows);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to load responses' });
    }
});
// GET all unique categories
router.get('/categories', (_req, res) => {
    try {
        const rows = database_1.default.prepare(`SELECT DISTINCT category FROM common_responses ORDER BY category`).all();
        res.json(rows.map(r => r.category));
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to load categories' });
    }
});
// GET favorites only
router.get('/favorites', (_req, res) => {
    try {
        const rows = database_1.default.prepare(`SELECT * FROM common_responses WHERE is_favorite = 1
       ORDER BY usage_count DESC, title ASC`).all();
        res.json(rows);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to load favorites' });
    }
});
// GET single response
router.get('/:id', (req, res) => {
    try {
        const row = database_1.default.prepare(`SELECT * FROM common_responses WHERE id = ?`).get(req.params.id);
        if (!row)
            return res.status(404).json({ error: 'Not found' });
        res.json(row);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to load response' });
    }
});
// CREATE response
router.post('/', (req, res) => {
    try {
        const { title, category, body, is_favorite } = req.body;
        if (!title?.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }
        if (!body?.trim()) {
            return res.status(400).json({ error: 'Response body is required' });
        }
        const result = database_1.default.prepare(`
      INSERT INTO common_responses (title, category, body, is_favorite)
      VALUES (?, ?, ?, ?)
    `).run(title.trim(), category?.trim() || 'General', body.trim(), is_favorite ? 1 : 0);
        const row = database_1.default.prepare(`SELECT * FROM common_responses WHERE id = ?`).get(result.lastInsertRowid);
        res.status(201).json(row);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create response' });
    }
});
// UPDATE response
router.put('/:id', (req, res) => {
    try {
        const { title, category, body, is_favorite } = req.body;
        if (!title?.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }
        if (!body?.trim()) {
            return res.status(400).json({ error: 'Response body is required' });
        }
        database_1.default.prepare(`
      UPDATE common_responses
      SET title = ?, category = ?, body = ?, is_favorite = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(title.trim(), category?.trim() || 'General', body.trim(), is_favorite ? 1 : 0, req.params.id);
        const row = database_1.default.prepare(`SELECT * FROM common_responses WHERE id = ?`).get(req.params.id);
        if (!row)
            return res.status(404).json({ error: 'Not found' });
        res.json(row);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to update response' });
    }
});
// TOGGLE favorite
router.post('/:id/toggle-favorite', (req, res) => {
    try {
        const row = database_1.default.prepare(`SELECT * FROM common_responses WHERE id = ?`).get(req.params.id);
        if (!row)
            return res.status(404).json({ error: 'Not found' });
        const newVal = row.is_favorite === 1 ? 0 : 1;
        database_1.default.prepare(`
      UPDATE common_responses
      SET is_favorite = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newVal, req.params.id);
        const updated = database_1.default.prepare(`SELECT * FROM common_responses WHERE id = ?`).get(req.params.id);
        res.json(updated);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to toggle favorite' });
    }
});
// INCREMENT usage count (called when copied)
router.post('/:id/increment-usage', (req, res) => {
    try {
        database_1.default.prepare(`
      UPDATE common_responses
      SET usage_count = usage_count + 1, updated_at = datetime('now')
      WHERE id = ?
    `).run(req.params.id);
        const row = database_1.default.prepare(`SELECT * FROM common_responses WHERE id = ?`).get(req.params.id);
        if (!row)
            return res.status(404).json({ error: 'Not found' });
        res.json(row);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to increment usage' });
    }
});
// DELETE response
router.delete('/:id', (req, res) => {
    try {
        const row = database_1.default.prepare(`SELECT id FROM common_responses WHERE id = ?`).get(req.params.id);
        if (!row)
            return res.status(404).json({ error: 'Not found' });
        database_1.default.prepare(`DELETE FROM common_responses WHERE id = ?`).run(req.params.id);
        res.json({ success: true });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to delete response' });
    }
});
exports.default = router;
