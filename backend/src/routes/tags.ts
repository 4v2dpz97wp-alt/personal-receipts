import { Router, Request, Response } from 'express';
import db from '../database';

const router = Router();

// GET all tags
router.get('/', (_req: Request, res: Response) => {
  try {
    const tags = db.prepare('SELECT * FROM tags ORDER BY name ASC').all();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// GET tags for a contact
router.get('/contact/:cid', (req: Request, res: Response) => {
  try {
    const { cid } = req.params;
    const tags = db.prepare(
      'SELECT tag_id FROM contact_tags WHERE contact_id = ?'
    ).all(cid);
    res.json(tags.map((t: any) => t.tag_id));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contact tags' });
  }
});

// POST set tags for a contact
router.post('/contact/:cid', (req: Request, res: Response) => {
  try {
    const { cid } = req.params;
    const { tag_ids } = req.body;

    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM contact_tags WHERE contact_id = ?').run(cid);
      const insert = db.prepare(
        'INSERT INTO contact_tags (contact_id, tag_id) VALUES (?, ?)'
      );
      for (const tagId of tag_ids) {
        insert.run(cid, tagId);
      }
    });

    transaction();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to set contact tags' });
  }
});

// POST create tag
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, color } = req.body;
    const result = db.prepare(
      'INSERT INTO tags (name, color) VALUES (?, ?)'
    ).run(name, color);
    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(tag);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// PUT update tag
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    db.prepare(
      'UPDATE tags SET name = ?, color = ? WHERE id = ?'
    ).run(name, color, id);
    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// DELETE tag
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM contact_tags WHERE tag_id = ?').run(id);
    db.prepare('DELETE FROM tags WHERE id = ?').run(id);
    res.json({ message: 'Tag deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

export default router;