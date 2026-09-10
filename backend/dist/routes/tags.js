"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../database"));
const router = (0, express_1.Router)();
// GET all tags
router.get('/', (_req, res) => {
    try {
        const tags = database_1.default.prepare('SELECT * FROM tags ORDER BY name ASC').all();
        res.json(tags);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch tags' });
    }
});
// GET tags for a contact
router.get('/contact/:cid', (req, res) => {
    try {
        const { cid } = req.params;
        const tags = database_1.default.prepare('SELECT tag_id FROM contact_tags WHERE contact_id = ?').all(cid);
        res.json(tags.map((t) => t.tag_id));
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch contact tags' });
    }
});
// POST set tags for a contact
router.post('/contact/:cid', (req, res) => {
    try {
        const { cid } = req.params;
        const { tag_ids } = req.body;
        const transaction = database_1.default.transaction(() => {
            database_1.default.prepare('DELETE FROM contact_tags WHERE contact_id = ?').run(cid);
            const insert = database_1.default.prepare('INSERT INTO contact_tags (contact_id, tag_id) VALUES (?, ?)');
            for (const tagId of tag_ids) {
                insert.run(cid, tagId);
            }
        });
        transaction();
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to set contact tags' });
    }
});
// POST create tag
router.post('/', (req, res) => {
    try {
        const { name, color } = req.body;
        const result = database_1.default.prepare('INSERT INTO tags (name, color) VALUES (?, ?)').run(name, color);
        const tag = database_1.default.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(tag);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create tag' });
    }
});
// PUT update tag
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, color } = req.body;
        database_1.default.prepare('UPDATE tags SET name = ?, color = ? WHERE id = ?').run(name, color, id);
        const tag = database_1.default.prepare('SELECT * FROM tags WHERE id = ?').get(id);
        res.json(tag);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update tag' });
    }
});
// DELETE tag
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        database_1.default.prepare('DELETE FROM contact_tags WHERE tag_id = ?').run(id);
        database_1.default.prepare('DELETE FROM tags WHERE id = ?').run(id);
        res.json({ message: 'Tag deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete tag' });
    }
});
exports.default = router;
