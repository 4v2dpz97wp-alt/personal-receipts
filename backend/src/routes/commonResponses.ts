import { Router, Request, Response } from 'express';
import db from '../database';

const router = Router();

// GET all responses (with optional search & category filter)
router.get('/', (_req: Request, res: Response) => {
  try {
    const { search, category, favorites } = _req.query;

    let query = `SELECT * FROM common_responses WHERE 1=1`;
    const params: any[] = [];

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

    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load responses' });
  }
});

// GET all unique categories
router.get('/categories', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(
      `SELECT DISTINCT category FROM common_responses ORDER BY category`
    ).all() as { category: string }[];
    res.json(rows.map(r => r.category));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

// GET favorites only
router.get('/favorites', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(
      `SELECT * FROM common_responses WHERE is_favorite = 1
       ORDER BY usage_count DESC, title ASC`
    ).all();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load favorites' });
  }
});

// GET single response
router.get('/:id', (req: Request, res: Response) => {
  try {
    const row = db.prepare(
      `SELECT * FROM common_responses WHERE id = ?`
    ).get(req.params.id);

    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load response' });
  }
});

// CREATE response
router.post('/', (req: Request, res: Response) => {
  try {
    const { title, category, body, is_favorite } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!body?.trim()) {
      return res.status(400).json({ error: 'Response body is required' });
    }

    const result = db.prepare(`
      INSERT INTO common_responses (title, category, body, is_favorite)
      VALUES (?, ?, ?, ?)
    `).run(
      title.trim(),
      category?.trim() || 'General',
      body.trim(),
      is_favorite ? 1 : 0
    );

    const row = db.prepare(
      `SELECT * FROM common_responses WHERE id = ?`
    ).get(result.lastInsertRowid);

    res.status(201).json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create response' });
  }
});

// UPDATE response
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { title, category, body, is_favorite } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!body?.trim()) {
      return res.status(400).json({ error: 'Response body is required' });
    }

    db.prepare(`
      UPDATE common_responses
      SET title = ?, category = ?, body = ?, is_favorite = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      title.trim(),
      category?.trim() || 'General',
      body.trim(),
      is_favorite ? 1 : 0,
      req.params.id
    );

    const row = db.prepare(
      `SELECT * FROM common_responses WHERE id = ?`
    ).get(req.params.id);

    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update response' });
  }
});

// TOGGLE favorite
router.post('/:id/toggle-favorite', (req: Request, res: Response) => {
  try {
    const row = db.prepare(
      `SELECT * FROM common_responses WHERE id = ?`
    ).get(req.params.id) as any;

    if (!row) return res.status(404).json({ error: 'Not found' });

    const newVal = row.is_favorite === 1 ? 0 : 1;

    db.prepare(`
      UPDATE common_responses
      SET is_favorite = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newVal, req.params.id);

    const updated = db.prepare(
      `SELECT * FROM common_responses WHERE id = ?`
    ).get(req.params.id);

    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// INCREMENT usage count (called when copied)
router.post('/:id/increment-usage', (req: Request, res: Response) => {
  try {
    db.prepare(`
      UPDATE common_responses
      SET usage_count = usage_count + 1, updated_at = datetime('now')
      WHERE id = ?
    `).run(req.params.id);

    const row = db.prepare(
      `SELECT * FROM common_responses WHERE id = ?`
    ).get(req.params.id);

    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to increment usage' });
  }
});

// DELETE response
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const row = db.prepare(
      `SELECT id FROM common_responses WHERE id = ?`
    ).get(req.params.id);

    if (!row) return res.status(404).json({ error: 'Not found' });

    db.prepare(`DELETE FROM common_responses WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete response' });
  }
});

export default router;