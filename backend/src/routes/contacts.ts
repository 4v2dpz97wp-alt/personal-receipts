import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db, { INTEREST_KEYS } from '../database';

const router = Router();

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({ storage });

const b = (v: any) => (v === true || v === 1 || v === '1' || v === 'true') ? 1 : 0;
const s = (v: any) => (v === undefined || v === null || v === '') ? null : v;

const BOOL_KEYS = new Set([
  'flag_avoid', 'flag_twisted', 'flag_favorite', 'flag_hot', 'flag_local', 'flag_lets_meet',
  'have_we_met', 'do_i_want_to_meet', 'do_they_want_to_meet', ...INTEREST_KEYS,
]);

const FIELD_KEYS = [
  'primary_username', 'primary_messaging_app', 'real_name', 'date_of_birth', 'phone_number', 'email',
  'city', 'state', 'country', 'notes',
  'flag_avoid', 'flag_twisted', 'flag_favorite', 'flag_hot', 'flag_local', 'flag_lets_meet',
  'have_we_met', 'hang_out_again', 'hang_out_again_explanation',
  'who_interested_in_meeting', 'likelihood_of_meeting',
  'do_i_want_to_meet', 'do_they_want_to_meet', 'meeting_focus',
  ...INTEREST_KEYS,
];

function buildValues(d: any) {
  return FIELD_KEYS.map(k => {
    if (BOOL_KEYS.has(k)) return b(d[k]);
    if (k === 'likelihood_of_meeting') return Number.isFinite(Number(d[k])) ? Number(d[k]) : 5;
    if (k === 'primary_messaging_app') return d[k] || 'Other';
    if (k === 'primary_username') return String(d[k] || '').trim();
    return s(d[k]);
  });
}

function saveRelations(contactId: number, d: any) {
  if (Array.isArray(d.social_apps)) {
    db.prepare(`DELETE FROM contact_social_apps WHERE contact_id = ?`).run(contactId);
    const ins = db.prepare(`INSERT INTO contact_social_apps (contact_id, app_name, username) VALUES (?, ?, ?)`);
    for (const a of d.social_apps) {
      const u = String(a?.username || '').trim();
      if (u) ins.run(contactId, a.app_name || 'Other', u);
    }
  }
  if (Array.isArray(d.associations)) {
    db.prepare(`DELETE FROM contact_associations WHERE contact_id = ? OR associated_contact_id = ?`).run(contactId, contactId);
    const ins = db.prepare(`INSERT OR IGNORE INTO contact_associations (contact_id, associated_contact_id) VALUES (?, ?)`);
    for (const raw of d.associations) {
      const aid = Number(typeof raw === 'object' ? raw?.id : raw);
      if (aid && aid !== contactId) { ins.run(contactId, aid); ins.run(aid, contactId); }
    }
  }
}

function getFullContact(contactId: number) {
  const contact = db.prepare(`SELECT * FROM contacts WHERE id = ?`).get(contactId) as any;
  if (!contact) return null;
  contact.social_apps = db.prepare(`SELECT * FROM contact_social_apps WHERE contact_id = ?`).all(contactId);
  contact.photos = db.prepare(`SELECT * FROM contact_photos WHERE contact_id = ? ORDER BY uploaded_at DESC, id DESC`).all(contactId);
  contact.username_history = db.prepare(`SELECT * FROM contact_username_history WHERE contact_id = ? ORDER BY archived_at DESC`).all(contactId);
  contact.associations = db.prepare(`
    SELECT c.id, c.primary_username, c.profile_picture
    FROM contacts c JOIN contact_associations ca ON ca.associated_contact_id = c.id
    WHERE ca.contact_id = ? ORDER BY c.primary_username
  `).all(contactId);
  contact.direct_conversations = db.prepare(`SELECT * FROM conversations WHERE primary_contact_id = ? ORDER BY date_time DESC`).all(contactId);
  contact.indirect_conversations = db.prepare(`
    SELECT c.* FROM conversations c JOIN conversation_participants cp ON cp.conversation_id = c.id
    WHERE cp.contact_id = ? AND c.primary_contact_id != ? ORDER BY c.date_time DESC
  `).all(contactId, contactId);
  return contact;
}

// GET all contacts
router.get('/', (req: Request, res: Response) => {
  try {
    const { search, favorites } = req.query;
    let query = `SELECT * FROM contacts WHERE 1=1`;
    const params: any[] = [];
    if (favorites === 'true') query += ` AND flag_favorite = 1`;
    if (search) {
      query += ` AND (primary_username LIKE ? OR real_name LIKE ? OR notes LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    query += ` ORDER BY primary_username COLLATE NOCASE ASC`;
    res.json(db.prepare(query).all(...params));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load contacts' });
  }
});

// GET lookups
router.get('/lookup/all', (_req: Request, res: Response) => {
  try {
    res.json(db.prepare(`SELECT id, primary_username, profile_picture FROM contacts ORDER BY primary_username COLLATE NOCASE ASC`).all());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load lookups' });
  }
});

// GET all username history
router.get('/username-history/all', (_req: Request, res: Response) => {
  try {
    res.json(db.prepare(`
      SELECT h.*, c.primary_username, c.profile_picture
      FROM contact_username_history h JOIN contacts c ON c.id = h.contact_id
      ORDER BY h.archived_at DESC
    `).all());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load username history' });
  }
});

// GET single contact
router.get('/:id', (req: Request, res: Response) => {
  try {
    const contact = getFullContact(Number(req.params.id));
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json(contact);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load contact' });
  }
});

// CREATE
router.post('/', (req: Request, res: Response) => {
  try {
    const d = req.body;
    if (!String(d.primary_username || '').trim()) return res.status(400).json({ error: 'Username is required' });
    const placeholders = FIELD_KEYS.map(() => '?').join(', ');
    const result = db.prepare(`INSERT INTO contacts (${FIELD_KEYS.join(', ')}) VALUES (${placeholders})`).run(...buildValues(d));
    const contactId = Number(result.lastInsertRowid);
    saveRelations(contactId, d);
    res.status(201).json(getFullContact(contactId));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// UPDATE
router.put('/:id', (req: Request, res: Response) => {
  try {
    const d = req.body;
    const contactId = Number(req.params.id);
    const setClause = FIELD_KEYS.map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE contacts SET ${setClause}, updated_at = datetime('now') WHERE id = ?`).run(...buildValues(d), contactId);
    saveRelations(contactId, d);
    res.json(getFullContact(contactId));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// UPLOAD single profile picture (also added to gallery)
router.post('/:id/profile-picture', upload.single('profile_picture'), (req: Request, res: Response) => {
  try {
    const contactId = Number(req.params.id);
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file' });
    const photoPath = `/uploads/${file.filename}`;
    db.prepare(`INSERT INTO contact_photos (contact_id, photo_path) VALUES (?, ?)`).run(contactId, photoPath);
    db.prepare(`UPDATE contacts SET profile_picture = ?, updated_at = datetime('now') WHERE id = ?`).run(photoPath, contactId);
    res.json({ profile_picture: photoPath });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

// UPLOAD gallery photos
router.post('/:id/photos', upload.array('photos', 30), (req: Request, res: Response) => {
  try {
    const contactId = Number(req.params.id);
    const files = (req.files as Express.Multer.File[]) || [];
    const uploaded: any[] = [];
    const ins = db.prepare(`INSERT INTO contact_photos (contact_id, photo_path) VALUES (?, ?)`);
    for (const f of files) {
      const r = ins.run(contactId, `/uploads/${f.filename}`);
      uploaded.push(db.prepare(`SELECT * FROM contact_photos WHERE id = ?`).get(r.lastInsertRowid));
    }
    const photos = db.prepare(`SELECT * FROM contact_photos WHERE contact_id = ? ORDER BY uploaded_at DESC, id DESC`).all(contactId);
    res.json({ photos, uploaded });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to upload photos' });
  }
});

// SET profile picture from gallery
router.post('/:id/set-profile-picture', (req: Request, res: Response) => {
  try {
    const { photo_path } = req.body;
    if (!photo_path) return res.status(400).json({ error: 'photo_path required' });
    db.prepare(`UPDATE contacts SET profile_picture = ?, updated_at = datetime('now') WHERE id = ?`).run(photo_path, req.params.id);
    res.json({ success: true, profile_picture: photo_path });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to set profile picture' });
  }
});

// DELETE photo
router.delete('/:id/photos/:photoId', (req: Request, res: Response) => {
  try {
    const contactId = Number(req.params.id);
    const photo = db.prepare(`SELECT * FROM contact_photos WHERE id = ? AND contact_id = ?`).get(req.params.photoId, contactId) as any;
    if (photo) {
      db.prepare(`DELETE FROM contact_photos WHERE id = ?`).run(photo.id);
      const c = db.prepare(`SELECT profile_picture FROM contacts WHERE id = ?`).get(contactId) as any;
      if (c?.profile_picture === photo.photo_path) {
        db.prepare(`UPDATE contacts SET profile_picture = NULL WHERE id = ?`).run(contactId);
      }
      const abs = path.join(uploadsDir, path.basename(photo.photo_path));
      if (fs.existsSync(abs)) { try { fs.unlinkSync(abs); } catch {} }
    }
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// ARCHIVE username
router.post('/:id/archive-username', (req: Request, res: Response) => {
  try {
    const { new_username } = req.body;
    const contactId = Number(req.params.id);
    if (!String(new_username || '').trim()) return res.status(400).json({ error: 'New username required' });
    const current = db.prepare(`SELECT primary_username FROM contacts WHERE id = ?`).get(contactId) as any;
    if (!current) return res.status(404).json({ error: 'Contact not found' });
    db.transaction(() => {
      db.prepare(`INSERT INTO contact_username_history (contact_id, archived_username) VALUES (?, ?)`).run(contactId, current.primary_username);
      db.prepare(`DELETE FROM contact_username_history WHERE contact_id = ? AND archived_username = ?`).run(contactId, new_username.trim());
      db.prepare(`UPDATE contacts SET primary_username = ?, updated_at = datetime('now') WHERE id = ?`).run(new_username.trim(), contactId);
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
