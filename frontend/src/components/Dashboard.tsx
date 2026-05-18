import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getContacts, getRecentConversations } from '../api/api';

const Dashboard: React.FC = () => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [favs, recents, all] = await Promise.all([
        getContacts(undefined, true),
        getRecentConversations(),
        getContacts(),
      ]);
      setFavorites(favs);
      setRecent(recents);
      setAllContacts(all);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = search
    ? allContacts.filter(c =>
        c.primary_username.toLowerCase().includes(search.toLowerCase()) ||
        (c.real_name && c.real_name.toLowerCase().includes(search.toLowerCase()))
      )
    : [];

  if (loading) return <div style={loadingStyle}>Loading...</div>;

  return (
    <div>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={{ fontSize: '1.8rem' }}>📋 Dashboard</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/contacts/new" style={btnStyle('#6C5CE7')}>➕ Add Contact</Link>
          <Link to="/conversations/new" style={btnStyle('#636e72')}>💬 New Communication</Link>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 24, position: 'relative', maxWidth: 400 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 16px 10px 40px', border: '2px solid #dfe6e9', borderRadius: 12, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Search Results */}
      {search && filtered.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <h3 style={{ marginBottom: 12 }}>Search Results ({filtered.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {filtered.map(c => <ContactCard key={c.id} contact={c} />)}
          </div>
        </div>
      )}

      {/* Favorites */}
      {favorites.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 16 }}>⭐ Favorites</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            {favorites.map(c => <ContactCard key={c.id} contact={c} />)}
          </div>
        </div>
      )}

      {/* Recent Conversations */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.2rem' }}>💬 Recent Conversations</h2>
          <Link to="/conversations" style={btnStyle('#6C5CE7')}>View All</Link>
        </div>
        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#636e72' }}>
            <p>No conversations yet. Add your first contact and log a conversation!</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f6fa' }}>
                <th style={thStyle}>Contact</th>
                <th style={thStyle}>Subject</th>
                <th style={thStyle}>App</th>
                <th style={thStyle}>Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((conv: any) => (
                <tr key={conv.id} style={{ borderBottom: '1px solid #f0f0f5' }}>
                  <td style={tdStyle}>
                    <Link to={`/contacts/${conv.primary_contact_id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit' }}>
                      {conv.profile_picture ? (
                        <img src={conv.profile_picture} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#a29bfe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>
                          {conv.primary_username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span style={{ fontWeight: 600 }}>{conv.primary_username}</span>
                    </Link>
                  </td>
                  <td style={tdStyle}>{conv.subject}</td>
                  <td style={tdStyle}>{conv.application}</td>
                  <td style={tdStyle}>{new Date(conv.date_time).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const ContactCard: React.FC<{ contact: any }> = ({ contact }) => (
  <Link to={`/contacts/${contact.id}`} style={{ background: '#fff', borderRadius: 12, padding: 16, textAlign: 'center', textDecoration: 'none', color: 'inherit', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'block', transition: 'transform 0.2s' }}>
    {contact.profile_picture ? (
      <img src={contact.profile_picture} alt="" style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', marginBottom: 10 }} />
    ) : (
      <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg, #a29bfe, #6C5CE7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.6rem', fontWeight: 700, margin: '0 auto 10px' }}>
        {contact.primary_username.charAt(0).toUpperCase()}
      </div>
    )}
    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 }}>{contact.primary_username}</div>
    <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
      {contact.flag_twisted === 1 && <span style={{ background: '#f5f0ff', color: '#a855f7', padding: '2px 6px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 600 }}>🌀</span>}
      {contact.flag_hot === 1 && <span style={{ background: '#fff0ed', color: '#ff6348', padding: '2px 6px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 600 }}>🔥</span>}
      {contact.flag_avoid === 1 && <span style={{ background: '#fff0f0', color: '#ff6b6b', padding: '2px 6px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 600 }}>🚫</span>}
    </div>
  </Link>
);

const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 };
const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' };
const thStyle: React.CSSProperties = { padding: '10px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#636e72', textTransform: 'uppercase' };
const tdStyle: React.CSSProperties = { padding: '10px 16px', fontSize: '0.9rem' };
const loadingStyle: React.CSSProperties = { textAlign: 'center', padding: 48, color: '#636e72' };
const btnStyle = (bg: string): React.CSSProperties => ({ background: bg, color: '#fff', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 8 });

export default Dashboard;
