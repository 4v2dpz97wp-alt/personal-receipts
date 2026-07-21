import { Router, Request, Response } from 'express';
import db from '../database';
import { uploadProfilePicture, uploadAdditionalPhotos } from '../middleware/upload';

const router = Router();

// GET all contacts
router.get('/', (req: Request, res: Response) => {
  try {
    const search = req.query.search as string;
    const favoritesOnly = req.query.favorites === 'true';
    let query = 'SELECT * FROM contacts';
    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      conditions.push('(primary_username LIKE ? OR real_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (favoritesOnly) conditions.push('flag_favorite = 1');

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY updated_at DESC';

    res.json(db.prepare(query).all(...params));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// GET contact lookup for dropdowns
router.get('/lookup/all', (_req: Request, res: Response) => {
  try {
    const contacts = db.prepare(
      'SELECT id, primary_username, profile_picture FROM contacts ORDER BY primary_username ASC'
    ).all();
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// GET all username histories in bulk (for contacts table search)
router.get('/username-histories/all', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT contact_id, archived_username
      FROM contact_username_history
      ORDER BY archived_at DESC
    `).all() as { contact_id: number; archived_username: string }[];

    // Build a map: { contactId: ['oldname1', 'oldname2'] }
    const map: Record<number, string[]> = {};
    for (const row of rows) {
      if (!map[row.contact_id]) map[row.contact_id] = [];
      map[row.contact_id].push(row.archived_username);
    }

    res.json(map);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch username histories' });
  }
});

// ARCHIVE current username and set new one
router.post('/:id/archive-username', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { new_username } = req.body;

    if (!new_username || !String(new_username).trim()) {
      return res.status(400).json({ error: 'New username is required' });
    }

    const trimmed = String(new_username).trim();

    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as any;
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (contact.primary_username === trimmed) {
      return res.status(400).json({ error: 'New username must be different from current username' });
    }

    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO contact_username_history (contact_id, archived_username)
        VALUES (?, ?)
      `).run(id, contact.primary_username);

      db.prepare(`
        UPDATE contacts
        SET primary_username = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(trimmed, id);
    });

    transaction();

    const updated = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to archive username' });
  }
});

// GET single contact
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    const socialApps = db.prepare('SELECT * FROM contact_social_apps WHERE contact_id = ?').all(id);

    const associations = db.prepare(`
      SELECT ca.id as association_id, c.id, c.primary_username, c.profile_picture
      FROM contact_associations ca
      JOIN contacts c ON c.id = ca.associated_contact_id
      WHERE ca.contact_id = ?
    `).all(id);

    const photos = db.prepare(`
      SELECT * FROM contact_photos
      WHERE contact_id = ?
      ORDER BY uploaded_at DESC
    `).all(id);

    const usernameHistory = db.prepare(`
      SELECT * FROM contact_username_history
      WHERE contact_id = ?
      ORDER BY archived_at DESC
    `).all(id);

    const directConversations = db.prepare(`
      SELECT * FROM conversations
      WHERE primary_contact_id = ?
      ORDER BY date_time DESC
    `).all(id);

    const indirectConversations = db.prepare(`
      SELECT conv.* FROM conversations conv
      JOIN conversation_participants cp ON cp.conversation_id = conv.id
      WHERE cp.contact_id = ? AND conv.primary_contact_id != ?
      ORDER BY conv.date_time DESC
    `).all(id, id);

    res.json({
      ...(contact as any),
      social_apps: socialApps,
      associations,
      photos,
      username_history: usernameHistory,
      direct_conversations: directConversations,
      indirect_conversations: indirectConversations
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// POST create contact
router.post('/', (req: Request, res: Response) => {
  try {
    const body = req.body;

    const transaction = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO contacts (
          primary_username, primary_messaging_app,
          flag_avoid, flag_twisted, flag_favorite, flag_hot,
          real_name, date_of_birth, phone_number, email,
          city, state, country,
          have_we_met, hang_out_again, hang_out_again_explanation,
          who_interested_in_meeting, likelihood_of_meeting,
          interest_top, interest_bottom, interest_vers, interest_oral,
          interest_making_out, interest_leather, interest_gear,
          interest_cum, interest_body_contact, interest_passionate,
          interest_rough, interest_groups, interest_threeways
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        body.primary_username,
        body.primary_messaging_app || 'Other',
        body.flag_avoid ? 1 : 0,
        body.flag_twisted ? 1 : 0,
        body.flag_favorite ? 1 : 0,
        body.flag_hot ? 1 : 0,
        body.real_name || null,
        body.date_of_birth || null,
        body.phone_number || null,
        body.email || null,
        body.city || null,
        body.state || null,
        body.country || null,
        body.have_we_met ? 1 : 0,
        body.hang_out_again || null,
        body.hang_out_again_explanation || null,
        body.who_interested_in_meeting || null,
        body.likelihood_of_meeting || 5,
        body.interest_top ? 1 : 0,
        body.interest_bottom ? 1 : 0,
        body.interest_vers ? 1 : 0,
        body.interest_oral ? 1 : 0,
        body.interest_making_out ? 1 : 0,
        body.interest_leather ? 1 : 0,
        body.interest_gear ? 1 : 0,
        body.interest_cum ? 1 : 0,
        body.interest_body_contact ? 1 : 0,
        body.interest_passionate ? 1 : 0,
        body.interest_rough ? 1 : 0,
        body.interest_groups ? 1 : 0,
        body.interest_threeways ? 1 : 0
      );

      const contactId = result.lastInsertRowid;

      if (body.social_apps?.length) {
        const insertApp = db.prepare(
          'INSERT INTO contact_social_apps (contact_id, app_name, username) VALUES (?,?,?)'
        );
        for (const app of body.social_apps) {
          if (app.app_name && app.username) insertApp.run(contactId, app.app_name, app.username);
        }
      }

      if (body.associations?.length) {
        const insertAssoc = db.prepare(
          'INSERT OR IGNORE INTO contact_associations (contact_id, associated_contact_id) VALUES (?,?)'
        );
        for (const assocId of body.associations) {
          insertAssoc.run(contactId, assocId);
          insertAssoc.run(assocId, contactId);
        }
      }

      return contactId;
    });

    const contactId = transaction();
    res.status(201).json(db.prepare('SELECT * FROM contacts WHERE id = ?').get(contactId));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// PUT update contact
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE contacts SET
          primary_username=?, primary_messaging_app=?,
          flag_avoid=?, flag_twisted=?, flag_favorite=?, flag_hot=?,
          real_name=?, date_of_birth=?, phone_number=?, email=?,
          city=?, state=?, country=?,
          have_we_met=?, hang_out_again=?, hang_out_again_explanation=?,
          who_interested_in_meeting=?, likelihood_of_meeting=?,
          interest_top=?, interest_bottom=?, interest_vers=?, interest_oral=?,
          interest_making_out=?, interest_leather=?, interest_gear=?,
          interest_cum=?, interest_body_contact=?, interest_passionate=?,
          interest_rough=?, interest_groups=?, interest_threeways=?,
          updated_at=datetime('now')
        WHERE id=?
      `).run(
        body.primary_username,
        body.primary_messaging_app || 'Other',
        body.flag_avoid ? 1 : 0,
        body.flag_twisted ? 1 : 0,
        body.flag_favorite ? 1 : 0,
        body.flag_hot ? 1 : 0,
        body.real_name || null,
        body.date_of_birth || null,
        body.phone_number || null,
        body.email || null,
        body.city || null,
        body.state || null,
        body.country || null,
        body.have_we_met ? 1 : 0,
        body.hang_out_again || null,
        body.hang_out_again_explanation || null,
        body.who_interested_in_meeting || null,
        body.likelihood_of_meeting || 5,
        body.interest_top ? 1 : 0,
        body.interest_bottom ? 1 : 0,
        body.interest_vers ? 1 : 0,
        body.interest_oral ? 1 : 0,
        body.interest_making_out ? 1 : 0,
        body.interest_leather ? 1 : 0,
        body.interest_gear ? 1 : 0,
        body.interest_cum ? 1 : 0,
        body.interest_body_contact ? 1 : 0,
        body.interest_passionate ? 1 : 0,
        body.interest_rough ? 1 : 0,
        body.interest_groups ? 1 : 0,
        body.interest_threeways ? 1 : 0,
        id
      );

      if (body.social_apps) {
        db.prepare('DELETE FROM contact_social_apps WHERE contact_id = ?').run(id);
        const insertApp = db.prepare(
          'INSERT INTO contact_social_apps (contact_id, app_name, username) VALUES (?,?,?)'
        );
        for (const app of body.social_apps) {
          if (app.app_name && app.username) insertApp.run(id, app.app_name, app.username);
        }
      }

      if (body.associations) {
        db.prepare('DELETE FROM contact_associations WHERE contact_id = ?').run(id);
        db.prepare('DELETE FROM contact_associations WHERE associated_contact_id = ?').run(id);
        const insertAssoc = db.prepare(
          'INSERT OR IGNORE INTO contact_associations (contact_id, associated_contact_id) VALUES (?,?)'
        );
        for (const assocId of body.associations) {
          insertAssoc.run(id, assocId);
          insertAssoc.run(assocId, id);
        }
      }
    });

    transaction();
    res.json(db.prepare('SELECT * FROM contacts WHERE id = ?').get(id));
  } catch (error) {
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// DELETE contact
router.delete('/:id', (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
    res.json({ message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// Upload profile picture
router.post('/:id/profile-picture', (req: Request, res: Response) => {
  uploadProfilePicture(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = `/uploads/profile-pictures/${req.file.filename}`;
    db.prepare(`
      UPDATE contacts
      SET profile_picture = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(filePath, req.params.id);

    res.json({ profile_picture: filePath });
  });
});

// Upload additional photos
router.post('/:id/photos', (req: Request, res: Response) => {
  uploadAdditionalPhotos(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const files = req.files as Express.Multer.File[];
    if (!files?.length) return res.status(400).json({ error: 'No files uploaded' });

    const insertPhoto = db.prepare(
      'INSERT INTO contact_photos (contact_id, photo_path) VALUES (?,?)'
    );

    const photos: string[] = [];
    for (const file of files) {
      const filePath = `/uploads/additional-photos/${file.filename}`;
      insertPhoto.run(req.params.id, filePath);
      photos.push(filePath);
    }

    res.json({ photos });
  });
});

// Delete a photo
router.delete('/:contactId/photos/:photoId', (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM contact_photos WHERE id = ?').run(req.params.photoId);
    res.json({ message: 'Photo deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export default router;