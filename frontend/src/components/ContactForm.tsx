import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createContact,
  updateContact,
  getContact,
  getContactLookups,
  uploadContactPhotos,
  setProfilePicture,
  deletePhoto,
  getTags,
  getContactTags,
  setContactTags,
} from '../api/api';
import { MESSAGING_APPS, US_STATES, COUNTRIES } from '../types';

const FOCUS_OPTIONS = ['Single', 'Triple', 'Groups Preferred'];

const defaultForm = {
  primary_username: '',
  primary_messaging_app: 'Other',
  flag_avoid: false,
  flag_twisted: false,
  flag_favorite: false,
  flag_hot: false,
  flag_local: false,
  flag_lets_meet: false,
  real_name: '',
  date_of_birth: '',
  phone_number: '',
  email: '',
  city: '',
  state: '',
  country: 'United States',
  // Meeting Possibility
  have_we_met: false,
  hang_out_again: '',            // 'Yes' | 'No' | ''
  hang_out_again_explanation: '',
  do_i_want_to_meet: false,
  do_they_want_to_meet: false,
  meeting_focus: '',
  // Interests
  interest_top: false,
  interest_bottom: false,
  interest_vers: false,
  interest_oral: false,
  interest_making_out: false,
  interest_leather: false,
  interest_gear: false,
  interest_cum: false,
  interest_body_contact: false,
  interest_passionate: false,
  interest_rough: false,
  interest_groups: false,
  interest_threeways: false,
  interest_race_play: false,
  interest_piggy: false,
  interest_role_play: false,
  interest_age_play: false,
  interest_cum_dump: false,
  interest_younger: false,
  interest_older: false,
  interest_hairy: false,
  interest_smooth: false,
  interest_muscular: false,
  interest_jocks: false,
  social_apps: [] as any[],
  associations: [] as number[],
};

const INTERESTS = [
  { key: 'interest_top', label: 'Top' },
  { key: 'interest_bottom', label: 'Bottom' },
  { key: 'interest_vers', label: 'Vers' },
  { key: 'interest_oral', label: 'Oral' },
  { key: 'interest_making_out', label: 'Making Out' },
  { key: 'interest_leather', label: 'Leather' },
  { key: 'interest_gear', label: 'Gear' },
  { key: 'interest_cum', label: 'Cum' },
  { key: 'interest_body_contact', label: 'Body Contact' },
  { key: 'interest_passionate', label: 'Passionate' },
  { key: 'interest_rough', label: 'Rough' },
  { key: 'interest_groups', label: 'Groups' },
  { key: 'interest_threeways', label: 'Threeways' },
  { key: 'interest_race_play', label: 'Race Play' },
  { key: 'interest_piggy', label: 'Piggy' },
  { key: 'interest_role_play', label: 'Role Play' },
  { key: 'interest_age_play', label: 'Age Play' },
  { key: 'interest_cum_dump', label: 'Cum Dump' },
  { key: 'interest_younger', label: 'Younger' },
  { key: 'interest_older', label: 'Older' },
  { key: 'interest_hairy', label: 'Hairy' },
  { key: 'interest_smooth', label: 'Smooth' },
  { key: 'interest_muscular', label: 'Muscular' },
  { key: 'interest_jocks', label: 'Jocks' },
];

const FLAGS = [
  { key: 'flag_avoid', label: '🚫 Avoid', color: 'var(--danger)' },
  { key: 'flag_twisted', label: '🌀 Twisted', color: '#a855f7' },
  { key: 'flag_favorite', label: '⭐ Favorite', color: '#fbbf24' },
  { key: 'flag_hot', label: '🔥 Hot', color: '#fb7185' },
  { key: 'flag_local', label: '📍 Local', color: '#3498db' },
  { key: 'flag_lets_meet', label: "🤝 Let's Meet", color: '#2ecc71' },
];

const ContactForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(defaultForm);

  // Unified photos
  const [existingPhotos, setExistingPhotos] = useState<any[]>([]);       // already saved on server
  const [profilePicPath, setProfilePicPath] = useState<string>('');      // current saved profile pic
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);        // pending uploads
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [newProfileIndex, setNewProfileIndex] = useState<number | null>(null); // which pending file becomes profile

  const [contactLookups, setContactLookups] = useState<any[]>([]);
  const [associationSearch, setAssociationSearch] = useState('');
  const [associationsOpen, setAssociationsOpen] = useState(false);

  const [photoModal, setPhotoModal] = useState<{ src: string; alt: string } | null>(null);

  const [allTags, setAllTags] = useState<any[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    loadLookups();
    loadAllTags();
    if (isEditing && id) {
      loadContact(parseInt(id));
      loadContactTags(parseInt(id));
    }
  }, [id]);

  useEffect(() => {
    return () => {
      newPhotoPreviews.forEach(p => { if (p.startsWith('blob:')) URL.revokeObjectURL(p); });
    };
  }, [newPhotoPreviews]);

  const loadLookups = async () => {
    try {
      const data = await getContactLookups();
      setContactLookups(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load contact lookups:', e);
      setContactLookups([]);
    }
  };

  const loadAllTags = async () => {
    try {
      const data = await getTags();
      setAllTags(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load tags:', e);
    }
  };

  const loadContactTags = async (contactId: number) => {
    try {
      const tagData = await getContactTags(contactId);
      let ids: number[] = [];
      if (Array.isArray(tagData)) {
        ids = tagData.map((t: any) => typeof t === 'number' ? t : t.id).filter(Boolean);
      } else if (tagData?.tag_ids) {
        ids = tagData.tag_ids;
      }
      setSelectedTagIds(ids);
    } catch (e) {
      console.error('Failed to load contact tags:', e);
    }
  };

  const truthy = (v: any) => v === 1 || v === true;

  const loadContact = async (contactId: number) => {
    try {
      const c = await getContact(contactId);
      const next: any = { ...defaultForm };

      Object.keys(defaultForm).forEach(k => {
        if (k === 'social_apps' || k === 'associations') return;
        const v = c?.[k];
        if (typeof (defaultForm as any)[k] === 'boolean') next[k] = truthy(v);
        else next[k] = v ?? (defaultForm as any)[k];
      });

      // Normalise older "Hell No"/"Yes"-style values into Yes/No
      if (next.hang_out_again && next.hang_out_again !== 'Yes' && next.hang_out_again !== 'No') {
        next.hang_out_again = /no/i.test(next.hang_out_again) ? 'No' : 'Yes';
      }
      next.country = c?.country || 'United States';
      next.social_apps = Array.isArray(c?.social_apps) ? c.social_apps : [];
      next.associations = Array.isArray(c?.associations)
        ? c.associations.map((a: any) => typeof a === 'number' ? a : a.id).filter(Boolean)
        : [];

      setForm(next);
      setExistingPhotos(Array.isArray(c?.photos) ? c.photos : []);
      setProfilePicPath(c?.profile_picture || '');
    } catch (e) {
      console.error('Failed to load contact:', e);
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));
  const toggle = (field: string) => setForm(prev => ({ ...prev, [field]: !(prev as any)[field] }));

  // ---- Photos ----
  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    setNewPhotoFiles(prev => [...prev, ...files]);
    setNewPhotoPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    // If there is no profile picture at all yet, auto-select the first new photo
    if (!profilePicPath && newProfileIndex === null && newPhotoFiles.length === 0) {
      setNewProfileIndex(0);
    }
    e.target.value = '';
  };

  const removeNewPhoto = (idx: number) => {
    setNewPhotoFiles(prev => prev.filter((_, i) => i !== idx));
    setNewPhotoPreviews(prev => {
      const removed = prev[idx];
      if (removed && removed.startsWith('blob:')) URL.revokeObjectURL(removed);
      return prev.filter((_, i) => i !== idx);
    });
    setNewProfileIndex(prev => {
      if (prev === null) return null;
      if (prev === idx) return null;
      return prev > idx ? prev - 1 : prev;
    });
  };

  const chooseExistingAsProfile = async (photoPath: string) => {
    if (!id) return;
    try {
      await setProfilePicture(parseInt(id), photoPath);
      setProfilePicPath(photoPath);
      setNewProfileIndex(null);
    } catch (e) {
      console.error(e);
      alert('Failed to set profile picture');
    }
  };

  const removeExistingPhoto = async (photoId: number, photoPath: string) => {
    if (!id || !window.confirm('Delete this photo?')) return;
    try {
      await deletePhoto(parseInt(id), photoId);
      setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
      if (profilePicPath === photoPath) setProfilePicPath('');
    } catch (e) {
      console.error(e);
      alert('Failed to delete photo');
    }
  };

  const currentProfileSrc =
    newProfileIndex !== null && newPhotoPreviews[newProfileIndex]
      ? newPhotoPreviews[newProfileIndex]
      : profilePicPath;

  // ---- Social apps ----
  const addSocialApp = () =>
    setForm(prev => ({ ...prev, social_apps: [...prev.social_apps, { app_name: 'Other', username: '' }] }));
  const removeSocialApp = (index: number) =>
    setForm(prev => ({ ...prev, social_apps: prev.social_apps.filter((_: any, i: number) => i !== index) }));
  const updateSocialApp = (index: number, field: string, value: string) =>
    setForm(prev => {
      const apps = [...prev.social_apps];
      apps[index] = { ...apps[index], [field]: value };
      return { ...prev, social_apps: apps };
    });

  // ---- Associations ----
  const toggleAssociation = (contactId: number) => {
    setForm(prev => {
      const exists = prev.associations.includes(contactId);
      return {
        ...prev,
        associations: exists ? prev.associations.filter(x => x !== contactId) : [...prev.associations, contactId],
      };
    });
    setAssociationsOpen(false);
  };
  const removeAssociation = (contactId: number) =>
    setForm(prev => ({ ...prev, associations: prev.associations.filter(x => x !== contactId) }));

  // ---- Submit ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.primary_username.trim()) { alert('Username is required'); return; }

    // Clean up meeting branches that don't apply
    const payload: any = { ...form };
    if (form.have_we_met) {
      payload.do_i_want_to_meet = false;
      payload.do_they_want_to_meet = false;
      payload.meeting_focus = '';
      if (form.hang_out_again !== 'No') payload.hang_out_again_explanation = '';
    } else {
      payload.hang_out_again = '';
      payload.hang_out_again_explanation = '';
      if (!(form.do_i_want_to_meet && form.do_they_want_to_meet)) payload.meeting_focus = '';
    }

    setSaving(true);
    try {
      let contactId: number;
      if (isEditing && id) {
        await updateContact(parseInt(id), payload);
        contactId = parseInt(id);
      } else {
        const created = await createContact(payload);
        contactId = created.id;
      }

      if (newPhotoFiles.length > 0) {
        const result = await uploadContactPhotos(contactId, newPhotoFiles);
        const chosen = newProfileIndex !== null ? result?.uploaded?.[newProfileIndex] : null;
        if (chosen?.photo_path) {
          await setProfilePicture(contactId, chosen.photo_path);
        }
      }

      await setContactTags(contactId, selectedTagIds);
      navigate(`/contacts/${contactId}`);
    } catch (err) {
      console.error('Save failed:', err);
      alert('Error saving contact. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const associationOptions = (Array.isArray(contactLookups) ? contactLookups : [])
    .filter(c => !id || c.id !== parseInt(id))
    .filter(c => (c.primary_username || '').toLowerCase().includes(associationSearch.trim().toLowerCase()));

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Photo Modal */}
      {photoModal && (
        <div
          onClick={() => setPhotoModal(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 900, background: 'rgba(15,15,26,0.96)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{photoModal.alt}</div>
              <button type="button" className="btn btn-muted" onClick={() => setPhotoModal(null)} style={{ padding: '6px 12px' }}>✕ Close</button>
            </div>
            <img src={photoModal.src} alt={photoModal.alt} style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 12 }} />
          </div>
        </div>
      )}

      <h1 className="glow-text" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
        {isEditing ? '✏️ Edit Contact' : '➕ New Contact'}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ===== Profile ===== */}
        <div className="card">
          <div className="section-title">👤 Profile</div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
            {currentProfileSrc ? (
              <img
                src={currentProfileSrc}
                alt="Profile"
                onClick={() => setPhotoModal({ src: currentProfileSrc, alt: 'Profile Photo' })}
                style={{ width: 130, height: 130, borderRadius: '50%', objectFit: 'cover', marginBottom: 8, border: '3px solid var(--accent)', cursor: 'zoom-in' }}
              />
            ) : (
              <div style={{ width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', marginBottom: 8 }}>
                📷
              </div>
            )}
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Profile photo — choose it from the 📸 Photos section below
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={labelStyle}>Primary Username *</label>
              <input type="text" value={form.primary_username} onChange={e => set('primary_username', e.target.value)} placeholder="Username" required />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={labelStyle}>Primary Messaging App</label>
              <select value={form.primary_messaging_app} onChange={e => set('primary_messaging_app', e.target.value)}>
                {MESSAGING_APPS.map(app => <option key={app} value={app}>{app}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Flags</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
              {FLAGS.map(flag => (
                <button
                  key={flag.key}
                  type="button"
                  onClick={() => toggle(flag.key)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: `1px solid ${(form as any)[flag.key] ? flag.color : 'rgba(255,255,255,0.15)'}`,
                    background: (form as any)[flag.key] ? `${flag.color}22` : 'transparent',
                    color: (form as any)[flag.key] ? flag.color : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {flag.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ===== Contact Information (now includes Social Apps) ===== */}
        <div className="card">
          <div className="section-title">📇 Contact Information</div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={labelStyle}>Real Name</label>
              <input type="text" value={form.real_name} onChange={e => set('real_name', e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={labelStyle}>Date of Birth</label>
              <input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={labelStyle}>Phone Number</label>
              <input type="tel" value={form.phone_number} onChange={e => set('phone_number', e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={labelStyle}>City</label>
              <input type="text" value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={labelStyle}>State</label>
              <select value={form.state} onChange={e => set('state', e.target.value)}>
                <option value="">Select State</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={labelStyle}>Country</label>
              <select value={form.country} onChange={e => set('country', e.target.value)}>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Social Apps moved here */}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <label style={{ ...labelStyle, fontSize: '0.9rem', color: '#fff', marginBottom: 12 }}>💬 Social Apps</label>

            {Array.isArray(form.social_apps) && form.social_apps.map((app, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={labelStyle}>App</label>
                  <select value={app.app_name} onChange={e => updateSocialApp(i, 'app_name', e.target.value)}>
                    {MESSAGING_APPS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <label style={labelStyle}>Username</label>
                  <input type="text" value={app.username} onChange={e => updateSocialApp(i, 'username', e.target.value)} />
                </div>
                <button type="button" className="btn btn-danger" onClick={() => removeSocialApp(i)}>✕</button>
              </div>
            ))}

            <button type="button" className="btn btn-outline" onClick={addSocialApp}>➕ Add App</button>
          </div>
        </div>

        {/* ===== Meeting Possibility (revised) ===== */}
        <div className="card">
          <div className="section-title">🤝 Meeting Possibility</div>

          <label style={labelStyle}>Have We Met?</label>
          <YesNo value={form.have_we_met} onChange={v => set('have_we_met', v)} />

          {form.have_we_met ? (
            <div style={{ marginTop: 16, paddingLeft: 14, borderLeft: '2px solid var(--accent)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Meet Again?</label>
                <YesNo
                  value={form.hang_out_again === 'Yes' ? true : form.hang_out_again === 'No' ? false : null}
                  onChange={v => set('hang_out_again', v ? 'Yes' : 'No')}
                />
              </div>
              {form.hang_out_again === 'No' && (
                <div>
                  <label style={labelStyle}>Why?</label>
                  <textarea
                    value={form.hang_out_again_explanation}
                    onChange={e => set('hang_out_again_explanation', e.target.value)}
                    style={{ minHeight: 90 }}
                    placeholder="Explain why not..."
                  />
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginTop: 16, paddingLeft: 14, borderLeft: '2px solid var(--accent)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Do I Want to Meet?</label>
                <YesNo value={form.do_i_want_to_meet} onChange={v => set('do_i_want_to_meet', v)} />
              </div>
              <div>
                <label style={labelStyle}>Do They Seem Interested in Meeting?</label>
                <YesNo value={form.do_they_want_to_meet} onChange={v => set('do_they_want_to_meet', v)} />
              </div>
              {form.do_i_want_to_meet && form.do_they_want_to_meet && (
                <div>
                  <label style={labelStyle}>Meeting Focus</label>
                  <select value={form.meeting_focus} onChange={e => set('meeting_focus', e.target.value)}>
                    <option value="">Select...</option>
                    {FOCUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===== Interests ===== */}
        <div className="card">
          <div className="section-title">🎯 Interests</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {INTERESTS.map(interest => (
              <button
                key={interest.key}
                type="button"
                onClick={() => toggle(interest.key)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: `1px solid ${(form as any)[interest.key] ? 'var(--primary)' : 'rgba(255,255,255,0.15)'}`,
                  background: (form as any)[interest.key] ? 'rgba(99,102,241,0.18)' : 'transparent',
                  color: (form as any)[interest.key] ? 'var(--primary-light)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                {interest.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===== Tags ===== */}
        {allTags.length > 0 && (
          <div className="card">
            <div className="section-title">🏷️ Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {allTags.map(tag => {
                const active = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setSelectedTagIds(prev => prev.includes(tag.id) ? prev.filter(x => x !== tag.id) : [...prev, tag.id])}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 999,
                      border: active ? `1px solid ${tag.color}` : '1px solid rgba(255,255,255,0.15)',
                      background: active ? `${tag.color}22` : 'transparent',
                      color: active ? tag.color : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {active ? '✓ ' : ''}{tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== Associations ===== */}
        <div className="card">
          <div className="section-title">🔗 Associations</div>
          <label style={labelStyle}>Known Contacts</label>

          <button type="button" className="btn btn-muted" onClick={() => setAssociationsOpen(prev => !prev)} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
            {associationsOpen ? '▲ Close Associations' : `▼ Select Associations (${form.associations.length})`}
          </button>

          {associationsOpen && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15, 15, 26, 0.95)' }}>
              <input type="text" value={associationSearch} onChange={e => setAssociationSearch(e.target.value)} placeholder="Search contacts..." style={{ marginBottom: 10 }} />
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {associationOptions.map(c => {
                  const selected = form.associations.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 10, cursor: 'pointer', background: selected ? 'rgba(99,102,241,0.16)' : 'transparent', marginBottom: 6 }}
                    >
                      <input type="checkbox" checked={selected} onChange={() => toggleAssociation(c.id)} style={{ width: 18, height: 18 }} />
                      {c.profile_picture ? (
                        <img src={c.profile_picture} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {c.primary_username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{c.primary_username}</span>
                    </label>
                  );
                })}
                {associationOptions.length === 0 && (
                  <div style={{ color: 'var(--text-muted)', padding: 12, textAlign: 'center' }}>No results</div>
                )}
              </div>
            </div>
          )}

          {form.associations.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {form.associations.map(aid => {
                const found = contactLookups.find(c => c.id === aid);
                const label = found?.primary_username || `#${aid}`;
                return (
                  <div key={aid} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 999, background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.35)' }}>
                    {found?.profile_picture ? (
                      <img src={found.profile_picture} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>
                        {label.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span style={{ color: '#fff', fontWeight: 800 }}>{label}</span>
                    <button type="button" onClick={() => removeAssociation(aid)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: '1rem', lineHeight: 1, padding: 0 }}>✕</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ===== Photos (unified) ===== */}
        <div className="card">
          <div className="section-title">📸 Photos</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
            Upload all photos here. Click <strong style={{ color: '#fff' }}>👤 Set Profile</strong> on any photo to make it the profile picture.
          </p>

          <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
            📁 Upload Photos
            <input type="file" accept="image/*" multiple onChange={handleAddPhotos} style={{ display: 'none' }} />
          </label>

          {/* Existing saved photos */}
          {existingPhotos.length > 0 && (
            <>
              <div style={{ ...labelStyle, marginTop: 18 }}>Saved Photos</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                {existingPhotos.map(p => {
                  const isProfile = newProfileIndex === null && profilePicPath === p.photo_path;
                  return (
                    <PhotoTile
                      key={p.id}
                      src={p.photo_path}
                      isProfile={isProfile}
                      onZoom={() => setPhotoModal({ src: p.photo_path, alt: 'Photo' })}
                      onSetProfile={() => chooseExistingAsProfile(p.photo_path)}
                      onRemove={() => removeExistingPhoto(p.id, p.photo_path)}
                    />
                  );
                })}
              </div>
            </>
          )}

          {/* New pending photos */}
          {newPhotoPreviews.length > 0 && (
            <>
              <div style={{ ...labelStyle, marginTop: 18 }}>New Photos ({newPhotoPreviews.length}) — will upload when you save</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                {newPhotoPreviews.map((src, idx) => (
                  <PhotoTile
                    key={src}
                    src={src}
                    isProfile={newProfileIndex === idx}
                    onZoom={() => setPhotoModal({ src, alt: `New photo ${idx + 1}` })}
                    onSetProfile={() => setNewProfileIndex(idx)}
                    onRemove={() => removeNewPhoto(idx)}
                  />
                ))}
              </div>
            </>
          )}

          {existingPhotos.length === 0 && newPhotoPreviews.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 12 }}>No photos yet.</p>
          )}
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginBottom: 32 }}>
          <button type="button" className="btn btn-muted" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEditing ? 'Update Contact' : 'Create Contact'}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ---------- Helpers ---------- */

const YesNo: React.FC<{ value: boolean | null; onChange: (v: boolean) => void }> = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
    <button type="button" className={value === true ? 'btn btn-primary' : 'btn btn-muted'} onClick={() => onChange(true)} style={{ minWidth: 90 }}>Yes</button>
    <button type="button" className={value === false ? 'btn btn-primary' : 'btn btn-muted'} onClick={() => onChange(false)} style={{ minWidth: 90 }}>No</button>
  </div>
);

const PhotoTile: React.FC<{
  src: string; isProfile: boolean;
  onZoom: () => void; onSetProfile: () => void; onRemove: () => void;
}> = ({ src, isProfile, onZoom, onSetProfile, onRemove }) => (
  <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '1', border: isProfile ? '3px solid var(--accent)' : '1px solid rgba(255,255,255,0.1)' }}>
    <img src={src} alt="" onClick={onZoom} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} />
    {isProfile ? (
      <span style={{ position: 'absolute', top: 6, left: 6, background: 'var(--accent)', color: '#000', fontSize: '0.62rem', fontWeight: 900, padding: '2px 6px', borderRadius: 4 }}>PROFILE</span>
    ) : (
      <button type="button" onClick={onSetProfile} style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.75)', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 6px', fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer' }}>👤 Set Profile</button>
    )}
    <button type="button" onClick={onRemove} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.75)', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: '0.7rem' }}>✕</button>
  </div>
);

const labelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  marginBottom: 6,
  display: 'block',
};

export default ContactForm;
