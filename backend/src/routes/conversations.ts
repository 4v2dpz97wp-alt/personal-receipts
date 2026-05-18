import { Router, Request, Response } from 'express';
import db from '../database';
import { uploadDocuments } from '../middleware/upload';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const search = req.query.search as string;
    let query = `
      SELECT conv.*, c.primary_username, c.profile_picture
      FROM conversations conv
      JOIN contacts c ON c.id = conv.primary_contact_id
    `;
    const params: any[] = [];
    if (search) { query += ' WHERE conv.subject LIKE ? OR c.primary_username LIKE ?'; params.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY conv.date_time DESC LIMIT 50';
    const conversations = db.prepare(query).all(...params);

    const getParticipants = db.prepare(`
      SELECT cp.contact_id, c.primary_username, c.profile_picture
      FROM conversation_participants cp
      JOIN contacts c ON c.id = cp.contact_id
      WHERE cp.conversation_id = ?
    `);
    const getDocs = db.prepare('SELECT * FROM conversation_documents WHERE conversation_id = ?');

    res.json(conversations.map((conv: any) => ({
      ...conv,
      participants: getParticipants.all(conv.id),
      documents: getDocs.all(conv.id),
    })));
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/recent', (_req: Request, res: Response) => {
  try {
    res.json(db.prepare(`
      SELECT conv.*, c.primary_username, c.profile_picture
      FROM conversations conv
      JOIN contacts c ON c.id = conv.primary_contact_id
      ORDER BY conv.date_time DESC LIMIT 10
    `).all());
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const conv = db.prepare(`
      SELECT conv.*, c.primary_username, c.profile_picture
      FROM conversations conv
      JOIN contacts c ON c.id = conv.primary_contact_id
      WHERE conv.id = ?
    `).get(req.params.id);
    if (!conv) return res.status(404).json({ error: 'Not found' });
    const participants = db.prepare(`
      SELECT cp.contact_id, c.primary_username, c.profile_picture
      FROM conversation_participants cp
      JOIN contacts c ON c.id = cp.contact_id
      WHERE cp.conversation_id = ?
    `).all(req.params.id);
    const documents = db.prepare('SELECT * FROM conversation_documents WHERE conversation_id = ?').all(req.params.id);
    res.json({ ...(conv as any), participants, documents });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { subject, primary_contact_id, date_time, application, location, conversation_summary, additional_contact_ids } = req.body;
    const transaction = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO conversations (subject, primary_contact_id, date_time, application, location, conversation_summary)
        VALUES (?,?,?,?,?,?)
      `).run(subject, primary_contact_id, date_time || new Date().toISOString(), application, location || null, conversation_summary || null);
      const convId = result.lastInsertRowid;
      if (additional_contact_ids?.length) {
        const ins = db.prepare('INSERT OR IGNORE INTO conversation_participants (conversation_id, contact_id) VALUES (?,?)');
        for (const cid of additional_contact_ids) ins.run(convId, cid);
      }
      return convId;
    });
    const convId = transaction();
    res.status(201).json(db.prepare('SELECT * FROM conversations WHERE id = ?').get(convId));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to create' }); }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { subject, primary_contact_id, date_time, application, location, conversation_summary, additional_contact_ids } = req.body;
    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE conversations SET subject=?, primary_contact_id=?, date_time=?,
        application=?, location=?, conversation_summary=?, updated_at=datetime('now')
        WHERE id=?
      `).run(subject, primary_contact_id, date_time, application, location || null, conversation_summary || null, id);
      if (additional_contact_ids) {
        db.prepare('DELETE FROM conversation_participants WHERE conversation_id = ?').run(id);
        const ins = db.prepare('INSERT OR IGNORE INTO conversation_participants (conversation_id, contact_id) VALUES (?,?)');
        for (const cid of additional_contact_ids) ins.run(id, cid);
      }
    });
    transaction();
    res.json(db.prepare('SELECT * FROM conversations WHERE id = ?').get(id));
  } catch (e) { res.status(500).json({ error: 'Failed to update' }); }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM conversations WHERE id = ?').run(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// Upload documents to a conversation
router.post('/:id/documents', (req: Request, res: Response) => {
  uploadDocuments(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const files = req.files as Express.Multer.File[];
    if (!files?.length) return res.status(400).json({ error: 'No files' });
    const ins = db.prepare('INSERT INTO conversation_documents (conversation_id, file_path, file_name, file_type, file_size) VALUES (?,?,?,?,?)');
    const docs: any[] = [];
    for (const file of files) {
      const fp = `/uploads/documents/${file.filename}`;
      ins.run(req.params.id, fp, file.originalname, file.mimetype, file.size);
      docs.push({ file_path: fp, file_name: file.originalname, file_type: file.mimetype, file_size: file.size });
    }
    res.json({ documents: docs });
  });
});

// Delete a document
router.delete('/:convId/documents/:docId', (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM conversation_documents WHERE id = ?').run(req.params.docId);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

export default router;
