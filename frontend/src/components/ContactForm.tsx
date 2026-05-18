import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createContact, updateContact, getContact, getContactLookups, uploadProfilePicture, uploadAdditionalPhotos } from '../api/api';
import { MESSAGING_APPS, HANG_OUT_OPTIONS, MEETING_INTEREST_OPTIONS, US_STATES, COUNTRIES } from '../types';

const defaultForm = {
  primary_username: '',
  primary_messaging_app: 'Other',
  flag_avoid: false, flag_twisted: false, flag_favorite: false, flag_hot: false,
  real_name: '', date_of_birth: '', phone_number: '', email: '',
  city: '', state: '', country: 'United States',
  have_we_met: false, hang_out_again: '', hang_out_again_explanation: '',
  who_interested_in_meeting: '', likelihood_of_meeting: 5,
  interest_top: false, interest_bottom: false, interest_vers: false,
  interest_oral: false, interest_making_out: false, interest_leather: false,
  interest_gear: false, interest_cum: false, interest_body_contact: false,
  interest_passionate: false, interest_rough: false, interest_groups: false,
  interest_threeways: false,
  social_apps: [] as any[], associations: [] as number[],
};

const ContactForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(defaultForm);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [additionalPhotoFiles, setAdditionalPhotoFiles] = useState<File[]>([]);
  const [contactLookups, setContactLookups] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    loadLookups();
    if (isEditing && id) loadContact(parseInt(id));
  }, [id]);

  const loadLookups = async () => {
    try { setContactLookups(await getContactLookups()); }
    catch (e) { console.error(e); }
  };

  const loadContact = async (contactId: number) => {
    try {
      const c = await getContact(contactId);
      setForm({
        primary_username: c.primary_username,
        primary_messaging_app: c.primary_messaging_app,
        flag_avoid: c.flag_avoid === 1, flag_twisted: c.flag_twisted === 1,
        flag_favorite: c.flag_favorite === 1, flag_hot: c.flag_hot === 1,
        real_name: c.real_name || '', date_of_birth: c.date_of_birth || '',
        phone_number: c.phone_number || '', email: c.email || '',
        city: c.city || '', state: c.state || '', country: c.country || 'United States',
        have_we_met: c.have_we_met === 1, hang_out_again: c.hang_out_again || '',
        hang_out_again_explanation: c.hang_out_again_explanation || '',
        who_interested_in_meeting: c.who_interested_in_meeting || '',
        likelihood_of_meeting: c.likelihood_of_meeting || 5,
        interest_top: c.interest_top === 1, interest_bottom: c.interest_bottom === 1,
        interest_vers: c.interest_vers === 1, interest_oral: c.interest_oral === 1,
        interest_making_out: c.interest_making_out === 1, interest_leather: c.interest_leather === 1,
        interest_gear: c.interest_gear === 1, interest_cum: c.interest_cum === 1,
        interest_body_contact: c.interest_body_contact === 1, interest_passionate: c.interest_passionate === 1,
        interest_rough: c.interest_rough === 1, interest_groups: c.interest_groups === 1,
        interest_threeways: c.interest_threeways === 1,
        social_apps: c.social_apps || [],
        associations: c.associations?.map((a: any) => a.id) || [],
      });
      if (c.profile_picture) setProfilePicPreview(c.profile_picture);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const set = (field: string, value: any) => setForm(p => ({ ...p, [field]: value }));
  const toggle = (field: string) => setForm(p => ({ ...p, [field]: !(p as any)[field] }));

  const handleProfilePic = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setProfilePicFile(file); setProfilePicPreview(URL.createObjectURL(file)); }
  };

  const addSocialApp = () => setForm(p => ({ ...p, social_apps: [...p.social_apps, { app_name: 'Other', username: '' }] }));
  const removeSocialApp = (i: number) => setForm(p => ({ ...p, social_apps: p.social_apps.filter((_, idx) => idx !== i) }));
  const updateSocialApp = (i: number, field: string, value: string) => {
    setForm(p => {
      const apps = [...p.social_apps];
      apps[i] = { ...apps[i], [field]: value };
      return { ...p, social_apps: apps };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.primary_username.trim()) { alert('Username is required'); return; }
    setSaving(true);
    try {
      let contactId: number;
      if (isEditing && id) {
        await updateContact(parseInt(id), form);
        contactId = parseInt(id);
      } else {
        const c = await createContact(form);
        contactId = c.id;
      }
      if (profilePicFile) await uploadProfilePicture(contactId, profilePicFile);
      if (additionalPhotoFiles.length > 0) await uploadAdditionalPhotos(contactId, additionalPhotoFiles);
      navigate(`/contacts/${contactId}`);
    } catch (e) {
      console.error(e);
      alert('Error saving. Please try again.');
    } finally { setSaving(false); }
  };

  if (loading) return <div style={loadingStyle}>Loading...</div>;

  const interests = [
    { key: 'interest_top', label: 'Top' }, { key: 'interest_bottom', label: 'Bottom' },
    { key: 'interest_vers', label: 'Vers' }, { key: 'interest_oral', label: 'Oral' },
    { key: 'interest_making_out', label: 'Making Out' }, { key: 'interest_leather', label: 'Leather' },
    { key: 'interest_gear', label: 'Gear' }, { key: 'interest_cum', label: 'Cum' },
    { key: 'interest_body_contact', label: 'Body Contact' }, { key: 'interest_passionate', label: 'Passionate' },
    { key: 'interest_rough', label: 'Rough' }, { key: 'interest_groups', label: 'Groups' },
    { key: 'interest_threeways', label: 'Threeways' },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 24 }}>{isEditing ? '✏️ Edit Contact' : '➕ New Contact'}</h1>

      <form onSubmit={handleSubmit}>

        {/* Profile Picture & Basic Info */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>👤 Profile</div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
            {profilePicPreview ? (
              <img src={profilePicPreview} alt="Profile" style={{ width: 130, height: 130, borderRadius: '50%', objectFit: 'cover', marginBottom: 12, border: '4px solid #dfe6e9' }} />
            ) : (
              <div style={{ width: 130, height: 130, borderRadius: '50%', background: '#dfe6e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', marginBottom: 12 }}>📷</div>
            )}
            <label style={{ ...btnStyle('#6C5CE7'), cursor: 'pointer' }}>
              Upload Photo
              <input type="file" accept="image/*" onChange={handleProfilePic} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={rowStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Primary Username *</label>
              <input type="text" value={form.primary_username} onChange={e => set('primary_username', e.target.value)} placeholder="Username" style={inputStyle} required />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Primary Messaging App</label>
              <select value={form.primary_messaging_app} onChange={e => set('primary_messaging_app', e.target.value)} style={inputStyle}>
                {MESSAGING_APPS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Flags</label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
              {[
                { key: 'flag_avoid', label: '🚫 Avoid', color: '#ff6b6b' },
                { key: 'flag_twisted', label: '🌀 Twisted', color: '#a855f7' },
                { key: 'flag_favorite', label: '⭐ Favorite', color: '#fdcb6e' },
                { key: 'flag_hot', label: '🔥 Hot', color: '#ff6348' },
              ].map(flag => (
                <button key={flag.key} type="button" onClick={() => toggle(flag.key)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: `2px solid ${(form as any)[flag.key] ? flag.color : '#dfe6e9'}`, background: (form as any)[flag.key] ? `${flag.color}22` : '#fff', color: (form as any)[flag.key] ? flag.color : '#636e72', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                  {flag.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>📇 Contact Information</div>
          <div style={rowStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Real Name</label>
              <input type="text" value={form.real_name} onChange={e => set('real_name', e.target.value)} placeholder="Their real name" style={inputStyle} />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Date of Birth</label>
              <input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={rowStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Phone Number</label>
              <input type="tel" value={form.phone_number} onChange={e => set('phone_number', e.target.value)} placeholder="Phone" style={inputStyle} />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="Email" style={inputStyle} />
            </div>
          </div>
          <div style={rowStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>City</label>
              <input type="text" value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" style={inputStyle} />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>State</label>
              <select value={form.state} onChange={e => set('state', e.target.value)} style={inputStyle}>
                <option value="">Select State</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Country</label>
              <select value={form.country} onChange={e => set('country', e.target.value)} style={inputStyle}>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Social Apps */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>💬 Social & Messaging Apps</div>
          {form.social_apps.map((app, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-end' }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>App</label>
                <select value={app.app_name} onChange={e => updateSocialApp(i, 'app_name', e.target.value)} style={inputStyle}>
                  {MESSAGING_APPS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Username</label>
                <input type="text" value={app.username} onChange={e => updateSocialApp(i, 'username', e.target.value)} placeholder="Username on this app" style={inputStyle} />
              </div>
              <button type="button" onClick={() => removeSocialApp(i)} style={{ ...btnStyle('#ff6b6b'), marginBottom: 2 }}>✕</button>
            </div>
          ))}
          <button type="button" onClick={addSocialApp} style={{ ...btnStyle('#6C5CE7'), background: 'transparent', border: '2px solid #6C5CE7', color: '#6C5CE7' }}>
            ➕ Add App
          </button>
        </div>

        {/* Meeting Possibility */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>🤝 Meeting Possibility</div>

          <div style={{ marginBottom: 16 }}>
            <button type="button" onClick={() => toggle('have_we_met')}
              style={{ padding: '8px 16px', borderRadius: 8, border: `2px solid ${form.have_we_met ? '#00b894' : '#dfe6e9'}`, background: form.have_we_met ? '#00b89422' : '#fff', color: form.have_we_met ? '#00b894' : '#636e72', fontWeight: 600, cursor: 'pointer' }}>
              {form.have_we_met ? '✅ We Have Met' : '❌ Have We Met?'}
            </button>
          </div>

          {form.have_we_met && (
            <div style={rowStyle}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Hang Out Again?</label>
                <select value={form.hang_out_again} onChange={e => set('hang_out_again', e.target.value)} style={inputStyle}>
                  <option value="">Select...</option>
                  {HANG_OUT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              {form.hang_out_again === 'Hell No' && (
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Why Not?</label>
                  <textarea value={form.hang_out_again_explanation} onChange={e => set('hang_out_again_explanation', e.target.value)} placeholder="What happened?" style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
                </div>
              )}
            </div>
          )}

          {!form.have_we_met && (
            <>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Who Is Interested in Meeting?</label>
                <select value={form.who_interested_in_meeting} onChange={e => set('who_interested_in_meeting', e.target.value)} style={inputStyle}>
                  <option value="">Select...</option>
                  {MEETING_INTEREST_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>Likelihood of Meeting: {form.likelihood_of_meeting}/10</label>
                <input type="range" min={0} max={10} value={form.likelihood_of_meeting} onChange={e => set('likelihood_of_meeting', parseInt(e.target.value))} style={{ width: '100%', marginTop: 8 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#636e72' }}>
                  <span>Not Likely</span><span>Very Likely</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Interests */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>🎯 Interests</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {interests.map(interest => (
              <button key={interest.key} type="button" onClick={() => toggle(interest.key)}
                style={{ padding: '8px 16px', borderRadius: 20, border: `2px solid ${(form as any)[interest.key] ? '#6C5CE7' : '#dfe6e9'}`, background: (form as any)[interest.key] ? '#6C5CE722' : '#fff', color: (form as any)[interest.key] ? '#6C5CE7' : '#636e72', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                {interest.label}
              </button>
            ))}
          </div>
        </div>

        {/* Associations */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>🔗 Associations</div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Known Contacts</label>
            <select multiple value={form.associations.map(String)}
              onChange={e => setForm(p => ({ ...p, associations: Array.from(e.target.selectedOptions, o => parseInt(o.value)) }))}
              style={{ ...inputStyle, minHeight: 120 }}>
              {contactLookups.filter(c => !id || c.id !== parseInt(id)).map(c => (
                <option key={c.id} value={c.id}>{c.primary_username}</option>
              ))}
            </select>
            <small style={{ color: '#636e72' }}>Hold Cmd (Mac) to select multiple</small>
          </div>
        </div>

        {/* Additional Photos */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>📸 Additional Photos</div>
          <input type="file" accept="image/*" multiple onChange={e => setAdditionalPhotoFiles(e.target.files ? Array.from(e.target.files) : [])} />
          {additionalPhotoFiles.length > 0 && <p style={{ color: '#636e72', marginTop: 8 }}>{additionalPhotoFiles.length} file(s) selected</p>}
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginBottom: 32 }}>
          <button type="button" onClick={() => navigate(-1)} style={btnStyle('#636e72')}>Cancel</button>
          <button type="submit" disabled={saving} style={btnStyle('#6C5CE7')}>
            {saving ? 'Saving...' : isEditing ? 'Update Contact' : 'Create Contact'}
          </button>
        </div>
      </form>
    </div>
  );
};

const sectionStyle: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 28, marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' };
const sectionTitleStyle: React.CSSProperties = { fontSize: '1rem', fontWeight: 700, color: '#6C5CE7', marginBottom: 20, paddingBottom: 10, borderBottom: '2px solid #f0f0f5' };
const formGroupStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, flex: 1 };
const rowStyle: React.CSSProperties = { display: 'flex', gap: 16, marginBottom: 16 };
const labelStyle: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 600, color: '#2d3436' };
const inputStyle: React.CSSProperties = { padding: '10px 14px', border: '2px solid #dfe6e9', borderRadius: 8, fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' };
const loadingStyle: React.CSSProperties = { textAlign: 'center', padding: 48, color: '#636e72' };
const btnStyle = (bg: string): React.CSSProperties => ({ background: bg, color: '#fff', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 6 });

export default ContactForm;
