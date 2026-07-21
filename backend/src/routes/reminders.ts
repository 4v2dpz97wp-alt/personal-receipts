import { Router, Request, Response } from 'express';
import db from '../database';

const router = Router();

// GET all reminders
router.get('/', (_req: Request, res: Response) => {
  try {
    const reminders = db.prepare(`
      SELECT r.*, c.primary_username, c.profile_picture
      FROM reminders r
      LEFT JOIN contacts c ON c.id = r.contact_id
      ORDER BY r.completed ASC, datetime(r.due_at) ASC
    `).all();

    res.json(reminders);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load reminders' });
  }
});

// GET due reminders
router.get('/due', (_req: Request, res: Response) => {
  try {
    const reminders = db.prepare(`
      SELECT r.*, c.primary_username, c.profile_picture
      FROM reminders r
      LEFT JOIN contacts c ON c.id = r.contact_id
      WHERE r.completed = 0
        AND r.notify = 1
        AND datetime(r.due_at) <= datetime('now', '+15 minutes')
      ORDER BY datetime(r.due_at) ASC
    `).all();

    res.json(reminders);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load due reminders' });
  }
});

// CREATE reminder
router.post('/', (req: Request, res: Response) => {
  try {
    const { title, note, due_at, contact_id, notify } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!due_at) {
      return res.status(400).json({ error: 'Due date/time is required' });
    }

    const result = db.prepare(`
      INSERT INTO reminders (title, note, due_at, contact_id, notify)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      title.trim(),
      note || null,
      due_at,
      contact_id || null,
      notify === false ? 0 : 1
    );

    const reminder = db.prepare(`
      SELECT r.*, c.primary_username, c.profile_picture
      FROM reminders r
      LEFT JOIN contacts c ON c.id = r.contact_id
      WHERE r.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(reminder);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

// UPDATE reminder
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { title, note, due_at, contact_id, completed, notify } = req.body;

    db.prepare(`
      UPDATE reminders
      SET title = ?, note = ?, due_at = ?, contact_id = ?, completed = ?, notify = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      title,
      note || null,
      due_at,
      contact_id || null,
      completed ? 1 : 0,
      notify === false ? 0 : 1,
      req.params.id
    );

    const reminder = db.prepare(`
      SELECT r.*, c.primary_username, c.profile_picture
      FROM reminders r
      LEFT JOIN contacts c ON c.id = r.contact_id
      WHERE r.id = ?
    `).get(req.params.id);

    res.json(reminder);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

// COMPLETE / UNDO
router.post('/:id/complete', (req: Request, res: Response) => {
  try {
    const complete = req.body.complete ? 1 : 0;

    db.prepare(`
      UPDATE reminders
      SET completed = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(complete, req.params.id);

    const reminder = db.prepare(`
      SELECT r.*, c.primary_username, c.profile_picture
      FROM reminders r
      LEFT JOIN contacts c ON c.id = r.contact_id
      WHERE r.id = ?
    `).get(req.params.id);

    res.json(reminder);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update reminder status' });
  }
});

// DELETE reminder
router.delete('/:id', (req: Request, res: Response) => {
  try {
    db.prepare(`DELETE FROM reminders WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

export default router;