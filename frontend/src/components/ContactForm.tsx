import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createContact,
  updateContact,
  getContact,
  getContactLookups,
  uploadProfilePicture,
  uploadAdditionalPhotos,
  getTags,
  getContactTags,
  setContactTags,
} from '../api/api';
import {
  MESSAGING_APPS,
  HANG_OUT_OPTIONS,
  MEETING_INTEREST_OPTIONS,
  US_STATES,
  COUNTRIES
} from '../types';

const defaultForm = {
  primary_username: '',
  primary_messaging_app: 'Other',
  flag_avoid: false,
  flag_twisted: false,
  flag_favorite: false,
  flag_hot: false,
  real_name: '',
  date_of_birth: '',
  phone_number: '',
  email: '',
  city: '',
  state: '',
  country: 'United States',
  have_we_met: false,
  hang_out_again: '',
  hang_out_again_explanation: '',
  who_interested_in_meeting: '',
  likelihood_of_meeting: 5,
  // Original interests
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
  // New interests
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
  // Original
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
  // New
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

const ContactForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(defaultForm);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);

  const [additionalPhotoFiles, setAdditionalPhotoFiles] = useState<File[]>([]);
  const [additionalPhotoPreviews, setAdditionalPhotoPreviews] = useState<string[]>([]);

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
      additionalPhotoPreviews.forEach(p => {
        if (p.startsWith('blob:')) URL.revokeObjectURL(p);
      });
      if (profilePicPreview && profilePicPreview.startsWith('blob:')) {
        URL.revokeObjectURL(profilePicPreview);
      }
    };
  }, [additionalPhotoPreviews, profilePicPreview]);

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

  const loadContact = async (contactId: number) => {
    try {
      const c = await getContact(contactId);

      setForm({
        primary_username: c?.primary_username || '',
        primary_messaging_app: c?.primary_messaging_app || 'Other',
        flag_avoid: c?.flag_avoid === 1 || c?.flag_avoid === true,
        flag_twisted: c?.flag_twisted === 1 || c?.flag_twisted === true,
        flag_favorite: c?.flag_favorite === 1 || c?.flag_favorite === true,
        flag_hot: c?.flag_hot === 1 || c?.flag_hot === true,
        real_name: c?.real_name || '',
        date_of_birth: c?.date_of_birth || '',
        phone_number: c?.phone_number || '',
        email: c?.email || '',
        city: c?.city || '',
        state: c?.state || '',
        country: c?.country || 'United States',
        have_we_met: c?.have_we_met === 1 || c?.have_we_met === true,
        hang_out_again: c?.hang_out_again || '',
        hang_out_again_explanation: c?.hang_out_again_explanation || '',
        who_interested_in_meeting: c?.who_interested_in_meeting || '',
        likelihood_of_meeting: c?.likelihood_of_meeting || 5,
        interest_top: c?.interest_top === 1 || c?.interest_top === true,
        interest_bottom: c?.interest_bottom === 1 || c?.interest_bottom === true,
        interest_vers: c?.interest_vers === 1 || c?.interest_vers === true,
        interest_oral: c?.interest_oral === 1 || c?.interest_oral === true,
        interest_making_out: c?.interest_making_out === 1 || c?.interest_making_out === true,
        interest_leather: c?.interest_leather === 1 || c?.interest_leather === true,
        interest_gear: c?.interest_gear === 1 || c?.interest_gear === true,
        interest_cum: c?.interest_cum === 1 || c?.interest_cum === true,
        interest_body_contact: c?.interest_body_contact === 1 || c?.interest_body_contact === true,
        interest_passionate: c?.interest_passionate === 1 || c?.interest_passionate === true,
        interest_rough: c?.interest_rough === 1 || c?.interest_rough === true,
        interest_groups: c?.interest_groups === 1 || c?.interest_groups === true,
        interest_threeways: c?.interest_threeways === 1 || c?.interest_threeways === true,
        interest_race_play: c?.interest_race_play === 1 || c?.interest_race_play === true,
        interest_piggy: c?.interest_piggy === 1 || c?.interest_piggy === true,
        interest_role_play: c?.interest_role_play === 1 || c?.interest_role_play === true,
        interest_age_play: c?.interest_age_play === 1 || c?.interest_age_play === true,
        interest_cum_dump: c?.interest_cum_dump === 1 || c?.interest_cum_dump === true,
        interest_younger: c?.interest_younger === 1 || c?.interest_younger === true,
        interest_older: c?.interest_older === 1 || c?.interest_older === true,
        interest_hairy: c?.interest_hairy === 1 || c?.interest_hairy === true,
        interest_smooth: c?.interest_smooth === 1 || c?.interest_smooth === true,
        interest_muscular: c?.interest_muscular === 1 || c?.interest_muscular === true,
        interest_jocks: c?.interest_jocks === 1 || c?.interest_jocks === true,
        social_apps: Array.isArray(c?.social_apps) ? c.social_apps : [],
        associations: Array.isArray(c?.associations)
          ? c.associations.map((a: any) => typeof a === 'number' ? a : a.id).filter(Boolean)
          : [],
      });

      if (c?.profile_picture) {
        setProfilePicPreview(c.profile_picture);
      }
    } catch (e) {
      console.error('Failed to load contact:', e);
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggle = (field: string) => {
    setForm(prev => ({ ...prev, [field]: !(prev as any)[field] }));
  };

  const handleProfilePic = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (profilePicPreview && profilePicPreview.startsWith('blob:')) {
      URL.revokeObjectURL(profilePicPreview);
    }

    setProfilePicFile(file);
    setProfilePicPreview(URL.createObjectURL(file));
  };

  const handleAdditionalPhotosChange = (files: File[]) => {
    additionalPhotoPreviews.forEach(p => {
      if (p.startsWith('blob:')) URL.revokeObjectURL(p);
    });

    setAdditionalPhotoFiles(files);
    setAdditionalPhotoPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removeAdditionalPreviewAt = (idx: number) => {
    setAdditionalPhotoFiles(prev => prev.filter((_, i) => i !== idx));
    setAdditionalPhotoPreviews(prev => {
      const removed = prev[idx];
      if (removed && removed.startsWith('blob:')) URL.revokeObjectURL(removed);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const addSocialApp = () => {
    setForm(prev => ({
      ...prev,
      social_apps: [...prev.social_apps, { app_name: 'Other', username: '' }]
    }));
  };

  const removeSocialApp = (index: number) => {
    setForm(prev => ({
      ...prev,
      social_apps: prev.social_apps.filter((_: any, i: number) => i !== index)
    }));
  };

  const updateSocialApp = (index: number, field: string, value: string) => {
    setForm(prev => {
      const apps = [...prev.social_apps];
      apps[index] = { ...apps[index], [field]: value };
      return { ...prev, social_apps: apps };
    });
  };

  const toggleAssociation = (contactId: number) => {
    setForm(prev => {
      const exists = prev.associations.includes(contactId);
      return {
        ...prev,
        associations: exists
          ? prev.associations.filter(id => id !== contactId)
          : [...prev.associations, contactId]
      };
    });
    setAssociationsOpen(false);
  };

  const removeAssociation = (contactId: number) => {
    setForm(prev => ({
      ...prev,
      associations: prev.associations.filter(id => id !== contactId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.primary_username.trim()) {
      alert('Username is required');
      return;
    }

    setSaving(true);
    try {
      let contactId: number;

      if (isEditing && id) {
        await updateContact(parseInt(id), form);
        contactId = parseInt(id);
      } else {
        const created = await createContact(form);
        contactId = created.id;
      }

      if (profilePicFile) {
        await uploadProfilePicture(contactId, profilePicFile);
      }

      if (additionalPhotoFiles.length > 0) {
        await uploadAdditionalPhotos(contactId, additionalPhotoFiles);
      }

      // ✅ Save tags
      await setContactTags(contactId, selectedTagIds);

      navigate(`/contacts/${contactId}`);
    } catch (e) {
      console.error('Save failed:', e);
      alert('Error saving contact. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const associationOptions = (Array.isArray(contactLookups) ? contactLookups : [])
    .filter(c => !id || c.id !== parseInt(id))
    .filter(c =>
      (c.primary_username || '')
        .toLowerCase()
        .includes(associationSearch.trim().toLowerCase())
    );

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Photo Modal */}
      {photoModal && (
        <div
          onClick={() => setPhotoModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 5000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 900,
              background: 'rgba(15,15,26,0.96)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 16,
              padding: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{photoModal.alt}</div>
              <button
                type="button"
                className="btn btn-muted"
                onClick={() => setPhotoModal(null)}
                style={{ padding: '6px 12px' }}
              >
                ✕ Close
              </button>
            </div>
            <img
              src={photoModal.src}
              alt={photoModal.alt}
              style={{ width: '100%', borderRadius: 12 }}
            />
          </div>
        </div>
      )}

      <h1 className="glow-text" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
        {isEditing ? '✏️ Edit Contact' : '➕ New Contact'}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Profile */}
        <div className="card">
          <div className="section-title">👤 Profile</div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
            {profilePicPreview ? (
              <img
                src={profilePicPreview}
                alt="Profile"
                onClick={() => setPhotoModal({ src: profilePicPreview, alt: 'Profile Photo' })}
                style={{
                  width: 130,
                  height: 130,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  marginBottom: 12,
                  border: '3px solid rgba(255,255,255,0.15)',
                  cursor: 'zoom-in',
                }}
              />
            ) : (
              <div
                style={{
                  width: 130,
                  height: 130,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  marginBottom: 12,
                }}
              >
                📷
              </div>
            )}

            <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
              Upload Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePic}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={labelStyle}>Primary Username *</label>
              <input
                type="text"
                value={form.primary_username}
                onChange={e => set('primary_username', e.target.value)}
                placeholder="Username"
                required
              />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={labelStyle}>Primary Messaging App</label>
              <select
                value={form.primary_messaging_app}
                onChange={e => set('primary_messaging_app', e.target.value)}
              >
                {MESSAGING_APPS.map(app => (
                  <option key={app} value={app}>{app}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Flags</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
              {[
                { key: 'flag_avoid', label: '🚫 Avoid', color: 'var(--danger)' },
                { key: 'flag_twisted', label: '🌀 Twisted', color: '#a855f7' },
                { key: 'flag_favorite', label: '⭐ Favorite', color: '#fbbf24' },
                { key: 'flag_hot', label: '🔥 Hot', color: '#fb7185' },
              ].map(flag => (
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

        {/* Contact Information */}
        <div className="card">
          <div className="section-title">📇 Contact Information</div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={labelStyle}>Real Name</label>
              <input
                type="text"
                value={form.real_name}
                onChange={e => set('real_name', e.target.value)}
              />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={labelStyle}>Date of Birth</label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={e => set('date_of_birth', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={labelStyle}>Phone Number</label>
              <input
                type="tel"
                value={form.phone_number}
                onChange={e => set('phone_number', e.target.value)}
              />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={labelStyle}>City</label>
              <input
                type="text"
                value={form.city}
                onChange={e => set('city', e.target.value)}
              />
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
        </div>

        {/* Social Apps */}
        <div className="card">
          <div className="section-title">💬 Social Apps</div>

          {Array.isArray(form.social_apps) && form.social_apps.map((app, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-end',
                marginBottom: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={labelStyle}>App</label>
                <select
                  value={app.app_name}
                  onChange={e => updateSocialApp(i, 'app_name', e.target.value)}
                >
                  {MESSAGING_APPS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <label style={labelStyle}>Username</label>
                <input
                  type="text"
                  value={app.username}
                  onChange={e => updateSocialApp(i, 'username', e.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => removeSocialApp(i)}
              >
                ✕
              </button>
            </div>
          ))}

          <button type="button" className="btn btn-outline" onClick={addSocialApp}>
            ➕ Add App
          </button>
        </div>

        {/* Meeting Possibility */}
        <div className="card">
          <div className="section-title">🤝 Meeting Possibility</div>

          <button
            type="button"
            className={form.have_we_met ? 'btn btn-primary' : 'btn btn-muted'}
            onClick={() => toggle('have_we_met')}
          >
            {form.have_we_met ? '✅ We Have Met' : '❌ Have We Met?'}
          </button>

          {form.have_we_met ? (
            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Hang Out Again?</label>
              <select
                value={form.hang_out_again}
                onChange={e => set('hang_out_again', e.target.value)}
              >
                <option value="">Select...</option>
                {HANG_OUT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>

              {form.hang_out_again === 'Hell No' && (
                <div style={{ marginTop: 16 }}>
                  <label style={labelStyle}>Why Not?</label>
                  <textarea
                    value={form.hang_out_again_explanation}
                    onChange={e => set('hang_out_again_explanation', e.target.value)}
                    style={{ minHeight: 100 }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Who Is Interested in Meeting?</label>
              <select
                value={form.who_interested_in_meeting}
                onChange={e => set('who_interested_in_meeting', e.target.value)}
              >
                <option value="">Select...</option>
                {MEETING_INTEREST_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>

              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>
                  Likelihood of Meeting: {form.likelihood_of_meeting}/10
                </label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={form.likelihood_of_meeting}
                  onChange={e => set('likelihood_of_meeting', parseInt(e.target.value))}
                />
              </div>
            </div>
          )}
        </div>

        {/* Interests */}
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
                  border: `1px solid ${(form as any)[interest.key]
                    ? 'var(--primary)'
                    : 'rgba(255,255,255,0.15)'}`,
                  background: (form as any)[interest.key]
                    ? 'rgba(99,102,241,0.18)'
                    : 'transparent',
                  color: (form as any)[interest.key]
                    ? 'var(--primary-light)'
                    : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                {interest.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
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
                    onClick={() => {
                      setSelectedTagIds(prev =>
                        prev.includes(tag.id)
                          ? prev.filter(x => x !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 999,
                      border: active
                        ? `1px solid ${tag.color}`
                        : '1px solid rgba(255,255,255,0.15)',
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

        {/* Associations */}
        <div className="card">
          <div className="section-title">🔗 Associations</div>

          <label style={labelStyle}>Known Contacts</label>

          <button
            type="button"
            className="btn btn-muted"
            onClick={() => setAssociationsOpen(prev => !prev)}
            style={{ alignSelf: 'flex-start', marginTop: 8 }}
          >
            {associationsOpen
              ? '▲ Close Associations'
              : `▼ Select Associations (${form.associations.length})`}
          </button>

          {associationsOpen && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(15, 15, 26, 0.95)',
              }}
            >
              <input
                type="text"
                value={associationSearch}
                onChange={e => setAssociationSearch(e.target.value)}
                placeholder="Search contacts..."
                style={{ marginBottom: 10 }}
              />

              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {associationOptions.map(c => {
                  const selected = form.associations.includes(c.id);
                  return (
                    <label
  key={c.id}
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px',
    borderRadius: 10,
    cursor: 'pointer',
    background: selected ? 'rgba(99,102,241,0.16)' : 'transparent',
    marginBottom: 6,
    transition: 'all 0.15s ease',
  }}
  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = selected ? 'rgba(99,102,241,0.16)' : 'transparent'; }}
>
  <input type="checkbox" checked={selected} onChange={() => toggleAssociation(c.id)} style={{ width: 18, height: 18 }} />
  
  {c.profile_picture ? (
    <img
      src={c.profile_picture}
      alt=""
      style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, transition: 'transform 0.2s ease' }}
      onMouseEnter={e => {
        const img = e.currentTarget as HTMLImageElement;
        img.style.transform = 'scale(1.25)';
        img.style.boxShadow = '0 4px 16px rgba(0,0,0,0.5)';
        img.style.zIndex = '10';
      }}
      onMouseLeave={e => {
        const img = e.currentTarget as HTMLImageElement;
        img.style.transform = 'scale(1)';
        img.style.boxShadow = 'none';
        img.style.zIndex = 'auto';
      }}
    />
  ) : (
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      background: 'rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.75rem', fontWeight: 700, color: '#fff',
      flexShrink: 0,
    }}>
      {c.primary_username?.charAt(0).toUpperCase()}
    </div>
  )}
  
  <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{c.primary_username}</span>
</label>
                  );
                })}

                {associationOptions.length === 0 && (
                  <div style={{ color: 'var(--text-muted)', padding: 12, textAlign: 'center' }}>
                    No results
                  </div>
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
                  <div
                    key={aid}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 999,
                      background: 'rgba(99,102,241,0.18)',
                      border: '1px solid rgba(99,102,241,0.35)',
                    }}
                  >
                    {found?.profile_picture ? (
  <img
    src={found.profile_picture}
    alt=""
    style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
  />
) : (
  <div style={{
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.65rem',
    fontWeight: 700,
    color: '#fff'
  }}>
    {label.charAt(0).toUpperCase()}
  </div>
)}
<span style={{ color: '#fff', fontWeight: 800 }}>{label}</span>
                    <button
                      type="button"
                      onClick={() => removeAssociation(aid)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 900,
                        fontSize: '1rem',
                        lineHeight: 1,
                        padding: 0,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Additional Photos */}
        <div className="card">
          <div className="section-title">📸 Additional Photos</div>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={e => {
              const files = e.target.files ? Array.from(e.target.files) : [];
              handleAdditionalPhotosChange(files);
            }}
          />

          {additionalPhotoPreviews.length > 0 && (
            <>
              <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                {additionalPhotoPreviews.length} file(s) selected
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                gap: 10,
                marginTop: 12,
              }}>
                {additionalPhotoPreviews.map((src, idx) => (
                  <div
                    key={src + idx}
                    style={{
                      position: 'relative',
                      borderRadius: 12,
                      overflow: 'hidden',
                      aspectRatio: '1',
                    }}
                  >
                    <img
                      src={src}
                      alt={`Selected ${idx + 1}`}
                      onClick={() => setPhotoModal({ src, alt: `Selected photo ${idx + 1}` })}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        cursor: 'zoom-in',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeAdditionalPreviewAt(idx)}
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        background: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 26,
                        height: 26,
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginBottom: 32 }}>
          <button
            type="button"
            className="btn btn-muted"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : isEditing ? 'Update Contact' : 'Create Contact'}
          </button>
        </div>

      </form>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  marginBottom: 6,
  display: 'block',
};

export default ContactForm;