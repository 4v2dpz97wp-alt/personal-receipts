import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getContact,
  createConversation,
  deletePhoto,
  archivePrimaryUsername,
  getTags,
  getContactTags,
  setContactTags,
} from '../api/api';

const STEALTH_OPTIONS = [
  'They wanted me to go stealth',
  'They had no opinion either way',
  'They wanted me on camera'
];

type Tab = 'profile' | 'timeline' | 'communications' | 'photos' | 'usernames';

const ContactProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showStealthModal, setShowStealthModal] = useState(false);
  const [photoModal, setPhotoModal] = useState<{ src: string; alt: string } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);

  const [allTags, setAllTags] = useState<any[]>([]);
  const [contactTagIds, setContactTagIds] = useState<number[]>([]);
  const [tagSaving, setTagSaving] = useState(false);

  useEffect(() => {
    if (id) {
      load(parseInt(id));
      loadTags(parseInt(id));
    }
  }, [id]);

  const load = async (cid: number) => {
    try {
      setContact(await getContact(cid));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async (cid: number) => {
    try {
      const [all, contactTags] = await Promise.all([
        getTags(),
        getContactTags(cid),
      ]);

      setAllTags(Array.isArray(all) ? all : []);
      const ids = Array.isArray(contactTags)
        ? contactTags.map((t: any) => (typeof t === 'number' ? t : t.id)).filter(Boolean)
        : [];

      setContactTagIds(ids);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTag = async (tagId: number) => {
    if (!id) return;
    const cid = parseInt(id);
    const newIds = contactTagIds.includes(tagId)
      ? contactTagIds.filter(x => x !== tagId)
      : [...contactTagIds, tagId];

    setContactTagIds(newIds);
    setTagSaving(true);
    try {
      await setContactTags(cid, newIds);
    } catch (e) {
      console.error(e);
      setContactTagIds(contactTagIds);
    } finally {
      setTagSaving(false);
    }
  };

  const quickNote = async (subject: string, summary: string) => {
    if (!contact) return;
    try {
      await createConversation({
        subject,
        primary_contact_id: contact.id,
        date_time: new Date().toISOString(),
        application: 'Zoom Private Room',
        location: null,
        conversation_summary: summary,
        additional_contact_ids: [],
      });
      alert(`✅ Note added: ${subject}`);
      load(contact.id);
    } catch (e) {
      console.error(e);
      alert('Failed to add note');
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!contact || !window.confirm('Delete this photo?')) return;
    try {
      await deletePhoto(contact.id, photoId);
      setPhotoModal(null);
      load(contact.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleArchiveUsername = async () => {
    if (!contact) return;
    const trimmed = newUsername.trim();
    if (!trimmed) { alert('Please enter a new username'); return; }
    if (trimmed === contact.primary_username) { alert('New username must be different'); return; }

    setUsernameLoading(true);
    try {
      await archivePrimaryUsername(contact.id, trimmed);
      setShowUsernameModal(false);
      setNewUsername('');
      await load(contact.id);
      setActiveTab('usernames');
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to change username');
    } finally {
      setUsernameLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading profile...</div>;
  }

  if (!contact) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Contact not found.</div>;
  }

  const initial = contact.primary_username?.charAt(0).toUpperCase() || '?';

  const interests = [
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

  const directConversations = contact.direct_conversations || [];
  const indirectConversations = contact.indirect_conversations || [];

  const allConversations = [
    ...directConversations.map((c: any) => ({ ...c, type: 'direct' })),
    ...indirectConversations.map((c: any) => ({ ...c, type: 'indirect' })),
  ].sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Photo Modal */}
      {photoModal && (
        <div
          onClick={() => setPhotoModal(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 1000, background: 'rgba(15,15,26,0.96)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 12 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 12 }}>
              <div style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{photoModal.alt}</div>
              <button className="btn btn-muted" type="button" onClick={() => setPhotoModal(null)} style={{ padding: '6px 12px' }}>✕ Close</button>
            </div>
            <img src={photoModal.src} alt={photoModal.alt} style={{ width: '100%', height: 'auto', borderRadius: 12 }} />
          </div>
        </div>
      )}

      {/* Username Modal */}
      {showUsernameModal && (
        <div
          onClick={() => { if (!usernameLoading) { setShowUsernameModal(false); setNewUsername(''); } }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: '100%', maxWidth: 460 }}>
            <div className="section-title">🪪 Change Primary Username</div>
            <p style={{ color: 'var(--text-muted)', marginBottom: 14 }}>
              Current: <strong style={{ color: '#fff' }}>{contact.primary_username}</strong>
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>New Primary Username</label>
              <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Enter new username" autoFocus />
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 18 }}>
              The current username will be archived and shown in the Usernames tab.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={handleArchiveUsername} className="btn btn-primary" disabled={usernameLoading}>
                {usernameLoading ? 'Saving...' : '✅ Save Username'}
              </button>
              <button type="button" onClick={() => { setShowUsernameModal(false); setNewUsername(''); }} className="btn btn-muted" disabled={usernameLoading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stealth Modal */}
      {showStealthModal && (
        <div
          onClick={() => setShowStealthModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ maxWidth: 420, width: '100%' }}>
            <h3 style={{ marginBottom: 16, color: 'var(--accent)' }}>🔇 Stealth Preference</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {STEALTH_OPTIONS.map(option => (
                <button key={option} onClick={() => { quickNote('Stealth Preference', option); setShowStealthModal(false); }} className="btn btn-muted" style={{ textAlign: 'left' }}>
                  {option}
                </button>
              ))}
            </div>
            <button onClick={() => setShowStealthModal(false)} className="btn btn-muted" style={{ width: '100%', marginTop: 16 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => navigate(-1)} className="btn btn-muted">← Back</button>
        <Link to={`/contacts/${contact.id}/edit`} className="btn btn-primary">✏️ Edit</Link>
        <Link to={`/conversations/new?contact=${contact.id}`} className="btn btn-muted">💬 Add Note</Link>
        <button type="button" onClick={() => { setNewUsername(''); setShowUsernameModal(true); }} className="btn btn-muted" style={{ borderColor: 'var(--primary)', color: 'var(--primary-light)' }}>
          🪪 Change Username
        </button>
        <button onClick={() => quickNote('Declined Private Room Invite', 'Declined their private room invite.')} className="btn btn-muted" style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }}>🚫 Decline</button>
        <button onClick={() => setShowStealthModal(true)} className="btn btn-muted" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>🔇 Stealth</button>
        <button onClick={() => quickNote('Only Joins Room With Others', 'Would only join room if others were present.')} className="btn btn-muted" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>👥 Only With Others</button>
        <button
          onClick={() => quickNote('No Response to Messages on Zoom', `No response to messages on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}.`)}
          className="btn btn-muted"
          style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }}
        >
          📵 No Response
        </button>
      </div>

      {/* Profile Header */}
      <div className="card">
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {contact.profile_picture ? (
            <img
              src={contact.profile_picture}
              alt=""
              className="avatar avatar-lg"
              style={{ cursor: 'zoom-in' }}
              onClick={() => setPhotoModal({ src: contact.profile_picture, alt: `${contact.primary_username} - Profile Photo` })}
            />
          ) : (
            <div className="avatar-placeholder avatar-lg">{initial}</div>
          )}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 4 }} className="glow-text">{contact.primary_username}</h1>
            {contact.real_name && <p style={{ color: 'var(--text-muted)', marginBottom: 10 }}>{contact.real_name}</p>}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {contact.flag_favorite === 1 && <span className="flag flag-favorite">⭐ Favorite</span>}
              {contact.flag_hot === 1 && <span className="flag flag-hot">🔥 Hot</span>}
              {contact.flag_twisted === 1 && <span className="flag flag-twisted">🌀 Twisted</span>}
              {contact.flag_avoid === 1 && <span className="flag flag-avoid">🚫 Avoid</span>}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Primary App: <strong style={{ color: 'var(--accent)' }}>{contact.primary_messaging_app}</strong>
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
              💬 {allConversations.length} communication{allConversations.length !== 1 ? 's' : ''} logged
            </p>

            {contactTagIds.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {allTags
                  .filter(t => contactTagIds.includes(t.id))
                  .map(t => (
                    <span
                      key={t.id}
                      style={{
                        padding: '3px 10px',
                        borderRadius: 999,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: `${t.color}22`,
                        color: t.color,
                        border: `1px solid ${t.color}55`,
                      }}
                    >
                      {t.name}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {([
          { key: 'profile', label: '📋 Profile' },
          { key: 'timeline', label: `📅 Timeline (${allConversations.length})` },
          { key: 'communications', label: `📞 Communications (${directConversations.length + indirectConversations.length})` },
          { key: 'photos', label: `📸 Photos (${contact.photos?.length || 0})` },
          { key: 'usernames', label: `🗂️ Usernames (${(contact.username_history?.length || 0) + 1})` },
        ] as { key: Tab; label: string }[]).map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={activeTab === tab.key ? 'btn btn-primary' : 'btn btn-muted'}
            style={{ padding: '10px 18px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card">
            <div className="section-title">
              🏷️ Tags
              {tagSaving && <span style={{ marginLeft: 10, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>Saving...</span>}
            </div>

            {allTags.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No tags yet. <Link to="/tags" style={{ color: 'var(--primary-light)' }}>Create tags here</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {allTags.map(tag => {
                  const active = contactTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleToggleTag(tag.id)}
                      style={{
                        padding: '6px 14px',
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
            )}
          </div>

          <div className="card">
            <div className="section-title">📇 Contact Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
              {contact.date_of_birth && <DI label="Birthday" value={new Date(contact.date_of_birth).toLocaleDateString()} />}
              {contact.phone_number && <DI label="Phone" value={contact.phone_number} />}
              {contact.email && <DI label="Email" value={contact.email} />}
              {(contact.city || contact.state || contact.country) && (
                <DI label="Location" value={[contact.city, contact.state, contact.country].filter(Boolean).join(', ')} />
              )}
            </div>
          </div>

          {contact.social_apps?.length > 0 && (
            <div className="card">
              <div className="section-title">💬 Social Apps</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                {contact.social_apps.map((app: any, i: number) => <DI key={i} label={app.app_name} value={app.username} />)}
              </div>
            </div>
          )}

          <div className="card">
            <div className="section-title">🤝 Meeting Possibility</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
              <DI label="Have We Met?" value={contact.have_we_met ? 'Yes ✅' : 'No ❌'} />
              {contact.have_we_met === 1 && contact.hang_out_again && <DI label="Again?" value={contact.hang_out_again} />}
              {contact.hang_out_again === 'Hell No' && contact.hang_out_again_explanation && <DI label="Why Not" value={contact.hang_out_again_explanation} />}
              {contact.have_we_met === 0 && contact.who_interested_in_meeting && <DI label="Interest" value={contact.who_interested_in_meeting} />}
              {contact.have_we_met === 0 && <DI label="Likelihood" value={`${contact.likelihood_of_meeting}/10`} />}
            </div>
          </div>

          <div className="card">
            <div className="section-title">🎯 Interests</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {interests.map(i => (
                <span key={i.key} className={`interest-tag ${contact[i.key] === 1 ? 'interest-active' : 'interest-inactive'}`}>
                  {i.label}
                </span>
              ))}
            </div>
          </div>

          {contact.associations?.length > 0 && (
  <div className="card">
    <div className="section-title">🔗 Associations</div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {contact.associations.map((a: any) => (
        <Link
          key={a.id}
          to={`/contacts/${a.id}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 16px', borderRadius: 999,
            background: 'rgba(99,102,241,0.14)',
            border: '1px solid rgba(99,102,241,0.3)',
            textDecoration: 'none', color: 'inherit',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
        >
          {a.profile_picture ? (
            <img
              src={a.profile_picture}
              alt=""
              style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', fontWeight: 800, color: '#fff',
              flexShrink: 0,
            }}>
              {a.primary_username?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>{a.primary_username}</span>
        </Link>
      ))}
    </div>
  </div>
)}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {allConversations.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <p>No communications logged yet.</p>
              <Link to={`/conversations/new?contact=${contact.id}`} className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
                💬 Add First Note
              </Link>
            </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: 32 }}>
              <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 2, background: 'rgba(99,102,241,0.3)', borderRadius: 2 }} />
              {allConversations.map((conv: any, idx: number) => {
                const isFirst = idx === 0;
                const date = new Date(conv.date_time);
                return (
                  <div key={conv.id} style={{ position: 'relative', marginBottom: 20 }}>
                    <div style={{ position: 'absolute', left: -27, top: 18, width: 14, height: 14, borderRadius: '50%', background: conv.type === 'direct' ? 'var(--primary)' : 'var(--text-muted)', border: '2px solid rgba(15,15,26,1)', zIndex: 1 }} />
                    <div className="card" style={{ padding: 16, borderLeft: `3px solid ${conv.type === 'direct' ? 'var(--primary)' : 'rgba(255,255,255,0.15)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                            <span style={{ fontWeight: 900, fontSize: '0.95rem' }}>{conv.subject}</span>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: conv.type === 'direct' ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.07)', color: conv.type === 'direct' ? 'var(--primary-light)' : 'var(--text-muted)' }}>
                              {conv.type === 'direct' ? 'Direct' : 'Indirect'}
                            </span>
                            {isFirst && (
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: 'rgba(16,185,129,0.18)', color: 'var(--success)' }}>
                                Latest
                              </span>
                            )}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <span>📱 {conv.application}</span>
                            <span>📅 {date.toLocaleDateString()}</span>
                            <span>🕐 {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {conv.conversation_summary && (
                            <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                              {conv.conversation_summary}
                            </div>
                          )}
                        </div>
                        <button onClick={() => navigate(`/conversations/${conv.id}/edit`)} className="btn btn-muted" style={{ padding: '6px 12px', flexShrink: 0 }}>✏️</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'communications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card">
            <div className="section-title">📞 Direct Conversations</div>
            {directConversations.length > 0 ? (
              <table>
                <thead><tr><th>Subject</th><th>App</th><th>Date</th><th>Summary</th></tr></thead>
                <tbody>
                  {directConversations.map((conv: any) => (
                    <tr key={conv.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/conversations/${conv.id}/edit`)}>
                      <td style={{ fontWeight: 600 }}>{conv.subject}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{conv.application}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{new Date(conv.date_time).toLocaleDateString()}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{conv.conversation_summary?.substring(0, 60) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No direct conversations yet.</p>
            )}
          </div>

          <div className="card">
            <div className="section-title">👥 Indirect Conversations</div>
            {indirectConversations.length > 0 ? (
              <table>
                <thead><tr><th>Subject</th><th>App</th><th>Date</th><th>Summary</th></tr></thead>
                <tbody>
                  {indirectConversations.map((conv: any) => (
                    <tr key={conv.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/conversations/${conv.id}/edit`)}>
                      <td style={{ fontWeight: 600 }}>{conv.subject}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{conv.application}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{new Date(conv.date_time).toLocaleDateString()}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{conv.conversation_summary?.substring(0, 60) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No indirect conversations yet.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'photos' && (
        <div className="card">
          {contact.photos?.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
              {contact.photos.map((p: any) => (
                <div key={p.id} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '1' }}>
                  <img
                    src={p.photo_path}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }}
                    onClick={() => setPhotoModal({ src: p.photo_path, alt: `Photo - ${contact.primary_username}` })}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeletePhoto(p.id); }}
                    style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <p>No additional photos yet.</p>
              <Link to={`/contacts/${contact.id}/edit`} className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>📸 Add Photos</Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'usernames' && (
        <div className="card">
          <div className="section-title">🗂️ Username History</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: 14, borderRadius: 12, background: 'rgba(99,102,241,0.16)', border: '1px solid rgba(99,102,241,0.3)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>CURRENT PRIMARY USERNAME</div>
              <div style={{ fontWeight: 900, fontSize: '1rem' }}>{contact.primary_username}</div>
            </div>

            {contact.username_history?.length > 0 ? (
              contact.username_history.map((u: any) => (
                <div
                  key={u.id}
                  style={{ padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
                >
                  <div>
                    <div style={{ fontWeight: 800 }}>{u.archived_username}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 4 }}>
                      Archived on {new Date(u.archived_at).toLocaleString()}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-muted"
                    style={{ borderColor: 'var(--success)', color: 'var(--success)', padding: '8px 14px' }}
                    onClick={async () => {
                      if (!window.confirm(`Restore "${u.archived_username}" as the primary username?\n\nCurrent username "${contact.primary_username}" will be archived.`)) return;
                      try {
                        await archivePrimaryUsername(contact.id, u.archived_username);
                        await load(contact.id);
                      } catch (e: any) {
                        alert(e?.response?.data?.error || 'Failed to restore username');
                      }
                    }}
                  >
                    ♻️ Restore
                  </button>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', padding: 8 }}>No archived usernames yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const DI: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: '0.9rem' }}>{value}</div>
  </div>
);

const labelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  marginBottom: 6,
  display: 'block',
};

export default ContactProfile;