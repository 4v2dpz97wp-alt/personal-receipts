import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from '../database';

const router = Router();

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({ storage });

// GET all contacts
router.get('/', (req: Request, res: Response) => {
  try {
    const { search, favorites } = req.query;
    let query = `SELECT * FROM contacts WHERE 1=1`;
    const params: any[] = [];

    if (favorites === 'true') {
      query += ` AND flag_favorite = 1`;
    }

    if (search) {
      query += ` AND (primary_username LIKE ? OR real_name LIKE ? OR notes LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY primary_username COLLATE NOCASE ASC`;
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load contacts' });
  }
});

// GET contact lookup list
router.get('/lookup/all', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(`SELECT id, primary_username, profile_picture FROM contacts ORDER BY primary_username ASC`).all();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load lookups' });
  }
});

// GET single contact profile with relations
router.get('/:id', (req: Request, res: Response) => {
  try {
    const contactId = Number(req.params.id);
    const contact = db.prepare(`SELECT * FROM contacts WHERE id = ?`).get(contactId) as any;

    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    contact.social_apps = db.prepare(`SELECT * FROM contact_social_apps WHERE contact_id = ?`).all(contactId);
    contact.photos = db.prepare(`SELECT * FROM contact_photos WHERE contact_id = ? ORDER BY uploaded_at DESC`).all(contactId);
    contact.username_history = db.prepare(`SELECT * FROM contact_username_history WHERE contact_id = ? ORDER BY archived_at DESC`).all(contactId);

    contact.associations = db.prepare(`
      SELECT c.id, c.primary_username, c.profile_picture 
      FROM contacts c
      JOIN contact_associations ca ON ca.associated_contact_id = c.id
      WHERE ca.contact_id = ?
    `).all(contactId);

    contact.direct_conversations = db.prepare(`
      SELECT * FROM conversations WHERE primary_contact_id = ? ORDER BY date_time DESC
    `).all(contactId);

    contact.indirect_conversations = db.prepare(`
      SELECT c.* FROM conversations c
      JOIN conversation_participants cp ON cp.conversation_id = c.id
      WHERE cp.contact_id = ? AND c.primary_contact_id != ?
      ORDER BY c.date_time DESC
    `).all(contactId, contactId);

    res.json(contact);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load contact' });
  }
});

// CREATE contact
router.post('/', (req: Request, res: Response) => {
  try {
    const d = req.body;
    const stmt = db.prepare(`
      INSERT INTO contacts (
        primary_username, primary_messaging_app, real_name, date_of_birth,
        phone_number, email, city, state, country, notes,
        flag_favorite, flag_hot, flag_twisted, flag_avoid, flag_local, flag_lets_meet,
        have_we_met, hang_out_again, hang_out_again_explanation,
        do_i_want_to_meet, do_they_want_to_meet, meeting_focus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      d.primary_username, d.primary_messaging_app || 'Other', d.real_name || null, d.date_of_birth || null,
      d.phone_number || null, d.email || null, d.city || null, d.state || null, d.country || null, d.notes || null,
      d.flag_favorite ? 1 : 0, d.flag_hot ? 1 : 0, d.flag_twisted ? 1 : 0, d.flag_avoid ? 1 : 0,
      d.flag_local ? 1 : 0, d.flag_lets_meet ? 1 : 0,
      d.have_we_met ? 1 : 0, d.hang_out_again || null, d.hang_out_again_explanation || null,
      d.do_i_want_to_meet ? 1 : 0, d.do_they_want_to_meet ? 1 : 0, d.meeting_focus || null
    );

    const created = db.prepare(`SELECT * FROM contacts WHERE id = ?`).get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// UPDATE contact
router.put('/:id', (req: Request, res: Response) => {
  try {
    const d = req.body;
    db.prepare(`
      UPDATE contacts SET
        primary_username = ?, primary_messaging_app = ?, real_name = ?, date_of_birth = ?,
        phone_number = ?, email = ?, city = ?, state = ?, country = ?, notes = ?,
        flag_favorite = ?, flag_hot = ?, flag_twisted = ?, flag_avoid = ?, flag_local = ?, flag_lets_meet = ?,
        have_we_met = ?, hang_out_again = ?, hang_out_again_explanation = ?,
        do_i_want_to_meet = ?, do_they_want_to_meet = ?, meeting_focus = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      d.primary_username, d.primary_messaging_app, d.real_name || null, d.date_of_birth || null,
      d.phone_number || null, d.email || null, d.city || null, d.state || null, d.country || null, d.notes || null,
      d.flag_favorite ? 1 : 0, d.flag_hot ? 1 : 0, d.flag_twisted ? 1 : 0, d.flag_avoid ? 1 : 0,
      d.flag_local ? 1 : 0, d.flag_lets_meet ? 1 : 0,
      d.have_we_met ? 1 : 0, d.hang_out_again || null, d.hang_out_again_explanation || null,
      d.do_i_want_to_meet ? 1 : 0, d.do_they_want_to_meet ? 1 : 0, d.meeting_focus || null,
      req.params.id
    );

    const updated = db.prepare(`SELECT * FROM contacts WHERE id = ?`).get(req.params.id);
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// SET Profile Picture from gallery
router.post('/:id/set-profile-picture', (req: Request, res: Response) => {
  try {
    const { photo_path } = req.body;
    db.prepare(`UPDATE contacts SET profile_picture = ?, updated_at = datetime('now') WHERE id = ?`).run(
      photo_path, req.params.id
    );
    res.json({ success: true, profile_picture: photo_path });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to set profile picture' });
  }
});

// UPLOAD gallery photos (Unified uploader)
router.post('/:id/photos', upload.array('photos', 20), (req: Request, res: Response) => {
  try {
    const contactId = Number(req.params.id);
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const insert = db.prepare(`INSERT INTO contact_photos (contact_id, photo_path) VALUES (?, ?)`);
      for (const file of files) {
        insert.run(contactId, `/uploads/${file.filename}`);
      }
    }
    const photos = db.prepare(`SELECT * FROM contact_photos WHERE contact_id = ? ORDER BY uploaded_at DESC`).all(contactId);
    res.json({ photos });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to upload photos' });
  }
});

// DELETE single photo
router.delete('/:id/photos/:photoId', (req: Request, res: Response) => {
  try {
    db.prepare(`DELETE FROM contact_photos WHERE id = ? AND contact_id = ?`).run(req.params.photoId, req.params.id);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// ARCHIVE Primary Username
router.post('/:id/archive-username', (req: Request, res: Response) => {
  try {
    const { new_username } = req.body;
    const contactId = Number(req.params.id);
    const current = db.prepare(`SELECT primary_username FROM contacts WHERE id = ?`).get(contactId) as any;

    if (!current) return res.status(404).json({ error: 'Contact not found' });

    db.transaction(() => {
      db.prepare(`INSERT INTO contact_username_history (contact_id, archived_username) VALUES (?, ?)`).run(
        contactId, current.primary_username
      );
      db.prepare(`UPDATE contacts SET primary_username = ?, updated_at = datetime('now') WHERE id = ?`).run(
        new_username.trim(), contactId
      );
    })();

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to change username' });
  }
});

// DELETE contact
router.delete('/:id', (req: Request, res: Response) => {
  try {
    db.prepare(`DELETE FROM contacts WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

export default router;
