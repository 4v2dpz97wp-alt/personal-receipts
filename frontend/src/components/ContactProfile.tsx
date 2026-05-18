import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getContact, createConversation, deletePhoto } from '../api/api';

const STEALTH_OPTIONS = [
  'They wanted me to go stealth',
  'They had no opinion either way',
  'They wanted me on camera'
];

const ContactProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showStealthModal, setShowStealthModal] = useState(false);

  useEffect(() => { if (id) load(parseInt(id)); }, [id]);

  const load = async (cid: number) => {
    try { setContact(await getContact(cid)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
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
      alert(`Note added: ${subject}`);
      load(contact.id);
    } catch (e) { console.error(e); alert('Failed to add note'); }
  };

  const handleDecline = () => quickNote('Declined Private Room Invite', 'Declined their private room invite.');

  const handleStealth = (option: string) => {
    quickNote('Stealth Preference', option);
    setShowStealthModal(false);
  };

  const handleRoomWithOthers = () => quickNote('Only Joins Room With Others', 'This person would only join the room if other people were present.');

  const handleDeletePhoto = async (photoId: number) => {
    if (!contact || !window.confirm('Delete this photo?')) return;
    try { await deletePhoto(contact.id, photoId); load(contact.id); }
    catch (e) { console.error(e); }
  };

  if (loading) return <div style={loadingStyle}>Loading profile...</div>;
  if (!contact) return <div style={loadingStyle}>Contact not found.</div>;

  const initial = contact.primary_username.charAt(0).toUpperCase();

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
    <div>
      {/* Stealth Modal */}
      {showStealthModal && (
        <div style={modalOverlayStyle} onClick={() => setShowStealthModal(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16, color: '#2d3436' }}>🔇 Stealth Preference</h3>
            <p style={{ color: '#636e72', marginBottom: 20 }}>Select their camera/stealth preference:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {STEALTH_OPTIONS.map(option => (
                <button key={option} onClick={() => handleStealth(option)}
                  style={{ padding: '12px 20px', borderRadius: 8, border: '2px solid #dfe6e9', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', textAlign: 'left', color: '#2d3436' }}>
                  {option}
                </button>
              ))}
            </div>
            <button onClick={() => setShowStealthModal(false)}
              style={{ marginTop: 16, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#636e72', color: '#fff', cursor: 'pointer', fontWeight: 600, width: '100%' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => navigate(-1)} style={btnStyle('#636e72')}>← Back</button>
        <Link to={`/contacts/${contact.id}/edit`} style={btnStyle('#6C5CE7')}>✏️ Edit</Link>
        <Link to={`/conversations/new?contact=${contact.id}`} style={btnStyle('#00b894')}>💬 Add Note</Link>
        <button onClick={handleDecline} style={btnStyle('#fdcb6e', '#2d3436')}>🚫 Decline Room</button>
        <button onClick={() => setShowStealthModal(true)} style={btnStyle('#0984e3')}>🔇 Stealth</button>
        <button onClick={handleRoomWithOthers} style={btnStyle('#e17055')}>👥 Only With Others</button>
      </div>

      {/* Profile Header */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {contact.profile_picture ? (
            <img src={contact.profile_picture} alt="" style={{ width: 130, height: 130, borderRadius: '50%', objectFit: 'cover', border: '4px solid #f0f0f5', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 130, height: 130, borderRadius: '50%', background: 'linear-gradient(135deg, #a29bfe, #6C5CE7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
              {initial}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>{contact.primary_username}</h1>
            {contact.real_name && <p style={{ color: '#636e72', fontSize: '1rem', marginBottom: 10 }}>{contact.real_name}</p>}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {contact.flag_favorite === 1 && <span style={flagStyle('#b8860b', '#fff8e1')}>⭐ Favorite</span>}
              {contact.flag_hot === 1 && <span style={flagStyle('#ff6348', '#fff0ed')}>🔥 Hot</span>}
              {contact.flag_twisted === 1 && <span style={flagStyle('#a855f7', '#f5f0ff')}>🌀 Twisted</span>}
              {contact.flag_avoid === 1 && <span style={flagStyle('#ff6b6b', '#fff0f0')}>🚫 Avoid</span>}
            </div>
            <p style={{ color: '#636e72', fontSize: '0.9rem' }}>Primary App: <strong>{contact.primary_messaging_app}</strong></p>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>📇 Contact Information</div>
        <div style={gridStyle}>
          {contact.date_of_birth && <DI label="Date of Birth" value={new Date(contact.date_of_birth).toLocaleDateString()} />}
          {contact.phone_number && <DI label="Phone" value={contact.phone_number} />}
          {contact.email && <DI label="Email" value={contact.email} />}
          {(contact.city || contact.state || contact.country) && <DI label="Location" value={[contact.city, contact.state, contact.country].filter(Boolean).join(', ')} />}
        </div>
      </div>

      {/* Social Apps */}
      {contact.social_apps?.length > 0 && (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>💬 Social & Messaging Apps</div>
          <div style={gridStyle}>
            {contact.social_apps.map((app: any, i: number) => <DI key={i} label={app.app_name} value={app.username} />)}
          </div>
        </div>
      )}

      {/* Meeting Possibility */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>🤝 Meeting Possibility</div>
        <div style={gridStyle}>
          <DI label="Have We Met?" value={contact.have_we_met ? 'Yes ✅' : 'No ❌'} />
          {contact.have_we_met === 1 && contact.hang_out_again && <DI label="Hang Out Again?" value={contact.hang_out_again} />}
          {contact.hang_out_again === 'Hell No' && contact.hang_out_again_explanation && <DI label="Why Not" value={contact.hang_out_again_explanation} />}
          {contact.have_we_met === 0 && contact.who_interested_in_meeting && <DI label="Meeting Interest" value={contact.who_interested_in_meeting} />}
          {contact.have_we_met === 0 && <DI label="Likelihood" value={`${contact.likelihood_of_meeting}/10`} />}
        </div>
      </div>

      {/* Interests */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>🎯 Interests</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {interests.map(interest => {
            const active = contact[interest.key] === 1;
            return (
              <span key={interest.key} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600,
                background: active ? '#6C5CE722' : '#f5f6fa',
                color: active ? '#6C5CE7' : '#b2bec3',
                border: `1px solid ${active ? '#a29bfe' : '#dfe6e9'}`,
              }}>
                {interest.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Associations */}
      {contact.associations?.length > 0 && (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>🔗 Associations</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {contact.associations.map((a: any) => (
              <Link key={a.id} to={`/contacts/${a.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px 4px 4px', background: '#f5f6fa', borderRadius: 20, textDecoration: 'none', color: 'inherit' }}>
                {a.profile_picture ? (
                  <img src={a.profile_picture} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#a29bfe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>
                    {a.primary_username.charAt(0).toUpperCase()}
                  </div>
                )}
                <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{a.primary_username}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Direct Conversations */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={sectionTitleStyle}>📞 Direct Conversations</div>
        </div>
        {contact.direct_conversations?.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f6fa' }}>
                <th style={thStyle}>Subject</th>
                <th style={thStyle}>App</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Summary</th>
              </tr>
            </thead>
            <tbody>
              {contact.direct_conversations.map((conv: any) => (
                <tr key={conv.id} style={{ borderBottom: '1px solid #f0f0f5', cursor: 'pointer' }}
                  onClick={() => navigate(`/conversations/${conv.id}/edit`)}>
                  <td style={tdStyle}>{conv.subject}</td>
                  <td style={tdStyle}>{conv.application}</td>
                  <td style={tdStyle}>{new Date(conv.date_time).toLocaleDateString()}</td>
                  <td style={tdStyle}>{conv.conversation_summary?.substring(0, 60) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#636e72', textAlign: 'center', padding: 24 }}>No direct conversations yet.</p>
        )}
      </div>

      {/* Indirect Conversations */}
      {contact.indirect_conversations?.length > 0 && (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>👥 Indirect Conversations</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f6fa' }}>
                <th style={thStyle}>Subject</th>
                <th style={thStyle}>App</th>
                <th style={thStyle}>Date</th>
              </tr>
            </thead>
            <tbody>
              {contact.indirect_conversations.map((conv: any) => (
                <tr key={conv.id} style={{ borderBottom: '1px solid #f0f0f5', cursor: 'pointer' }}
                  onClick={() => navigate(`/conversations/${conv.id}/edit`)}>
                  <td style={tdStyle}>{conv.subject}</td>
                  <td style={tdStyle}>{conv.application}</td>
                  <td style={tdStyle}>{new Date(conv.date_time).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Photos */}
      {contact.photos?.length > 0 && (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>📸 Photos</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
            {contact.photos.map((photo: any) => (
              <div key={photo.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1' }}>
                <img src={photo.photo_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => handleDeletePhoto(photo.id)}
                  style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: '0.7rem' }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DI: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div style={{ fontSize: '0.75rem', color: '#636e72', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: '0.9rem', color: '#2d3436' }}>{value}</div>
  </div>
);

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' };
const sectionTitleStyle: React.CSSProperties = { fontSize: '1rem', fontWeight: 700, color: '#6C5CE7', marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid #f0f0f5' };
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 };
const thStyle: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#636e72', textTransform: 'uppercase' };
const tdStyle: React.CSSProperties = { padding: '10px 14px', fontSize: '0.85rem' };
const loadingStyle: React.CSSProperties = { textAlign: 'center', padding: 48, color: '#636e72' };
const flagStyle = (color: string, bg: string): React.CSSProperties => ({ background: bg, color, padding: '4px 12px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 });
const btnStyle = (bg: string, color = '#fff'): React.CSSProperties => ({ background: bg, color, padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 });
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 };
const modalStyle: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: 32, maxWidth: 450, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' };

export default ContactProfile;
