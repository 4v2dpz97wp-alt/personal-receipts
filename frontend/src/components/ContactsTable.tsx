import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getContacts, deleteContact } from '../api/api';

const ContactsTable: React.FC = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await getContacts();
      setContacts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Delete "${name}"?`)) {
      await deleteContact(id);
      setContacts(prev => prev.filter(c => c.id !== id));
    }
  };

  const filtered = contacts.filter(c =>
    c.primary_username.toLowerCase().includes(search.toLowerCase()) ||
    (c.real_name && c.real_name.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div style={loadingStyle}>Loading contacts...</div>;

  return (
    <div>
      <div style={headerStyle}>
        <h1 style={{ fontSize: '1.8rem' }}>📇 Contacts</h1>
        <Link to="/contacts/new" style={btnStyle('#6C5CE7')}>➕ Add Contact</Link>
      </div>

      <input
        type="text"
        placeholder="🔍 Search contacts..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={searchStyle}
      />

      <div style={cardStyle}>
        {filtered.length === 0 ? (
          <div style={emptyStyle}>
            <h3>No contacts found</h3>
            <p style={{ color: '#636e72' }}>Add your first contact to get started.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f6fa' }}>
                <th style={thStyle}>Contact</th>
                <th style={thStyle}>App</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Flags</th>
                <th style={thStyle}>Met?</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(contact => (
                <tr key={contact.id} style={{ borderBottom: '1px solid #f0f0f5' }}>
                  <td style={tdStyle}>
                    <Link to={`/contacts/${contact.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                      {contact.profile_picture ? (
                        <img src={contact.profile_picture} alt="" style={avatarStyle} />
                      ) : (
                        <div style={avatarPlaceholderStyle}>
                          {contact.primary_username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{contact.primary_username}</div>
                        {contact.real_name && <div style={{ fontSize: '0.8rem', color: '#636e72' }}>{contact.real_name}</div>}
                      </div>
                    </Link>
                  </td>
                  <td style={tdStyle}>{contact.primary_messaging_app}</td>
                  <td style={tdStyle}>{[contact.city, contact.state].filter(Boolean).join(', ') || '—'}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {contact.flag_favorite === 1 && <span style={flagStyle('#b8860b', '#fff8e1')}>⭐</span>}
                      {contact.flag_hot === 1 && <span style={flagStyle('#ff6348', '#fff0ed')}>🔥</span>}
                      {contact.flag_twisted === 1 && <span style={flagStyle('#a855f7', '#f5f0ff')}>🌀</span>}
                      {contact.flag_avoid === 1 && <span style={flagStyle('#ff6b6b', '#fff0f0')}>🚫</span>}
                    </div>
                  </td>
                  <td style={tdStyle}>{contact.have_we_met ? '✅' : '❌'}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link to={`/contacts/${contact.id}/edit`} style={btnStyle('#636e72')}>✏️</Link>
                      <button onClick={() => handleDelete(contact.id, contact.primary_username)} style={btnStyle('#ff6b6b')}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 };
const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.08)', overflow: 'hidden' };
const thStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#636e72', letterSpacing: '0.5px' };
const tdStyle: React.CSSProperties = { padding: '12px 16px' };
const avatarStyle: React.CSSProperties = { width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' };
const avatarPlaceholderStyle: React.CSSProperties = { width: 36, height: 36, borderRadius: '50%', background: '#a29bfe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem' };
const loadingStyle: React.CSSProperties = { textAlign: 'center', padding: 48, color: '#636e72' };
const emptyStyle: React.CSSProperties = { textAlign: 'center', padding: 48 };
const searchStyle: React.CSSProperties = { width: '100%', maxWidth: 400, padding: '10px 16px', border: '2px solid #dfe6e9', borderRadius: 12, fontSize: '0.9rem', marginBottom: 16, outline: 'none' };
const btnStyle = (bg: string): React.CSSProperties => ({ background: bg, color: '#fff', padding: '8px 16px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 });
const flagStyle = (color: string, bg: string): React.CSSProperties => ({ background: bg, color, padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 });

export default ContactsTable;
