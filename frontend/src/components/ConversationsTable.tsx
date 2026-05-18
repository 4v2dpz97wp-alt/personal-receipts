import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getConversations, deleteConversation } from '../api/api';

const ConversationsTable: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this conversation?')) {
      await deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
    }
  };

  const filtered = conversations.filter(c =>
    c.subject.toLowerCase().includes(search.toLowerCase()) ||
    (c.primary_username && c.primary_username.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div style={loadingStyle}>Loading communications...</div>;

  return (
    <div>
      <div style={headerStyle}>
        <h1 style={{ fontSize: '1.8rem' }}>💬 Communications</h1>
        <Link to="/conversations/new" style={btnStyle('#6C5CE7')}>➕ New Communication</Link>
      </div>

      <input
        type="text"
        placeholder="🔍 Search conversations..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={searchStyle}
      />

      <div style={cardStyle}>
        {filtered.length === 0 ? (
          <div style={emptyStyle}>
            <h3>No communications found</h3>
            <p style={{ color: '#636e72' }}>Add your first communication note.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f6fa' }}>
                <th style={thStyle}>Contact</th>
                <th style={thStyle}>Subject</th>
                <th style={thStyle}>App</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Summary</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(conv => (
                <tr key={conv.id} style={{ borderBottom: '1px solid #f0f0f5' }}>
                  <td style={tdStyle}>
                    <Link to={`/contacts/${conv.primary_contact_id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit' }}>
                      {conv.profile_picture ? (
                        <img src={conv.profile_picture} alt="" style={avatarStyle} />
                      ) : (
                        <div style={avatarPlaceholderStyle}>
                          {conv.primary_username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span style={{ fontWeight: 600 }}>{conv.primary_username}</span>
                    </Link>
                  </td>
                  <td style={tdStyle}>{conv.subject}</td>
                  <td style={tdStyle}>{conv.application}</td>
                  <td style={tdStyle}>{new Date(conv.date_time).toLocaleDateString()}</td>
                  <td style={tdStyle}>
                    {conv.conversation_summary
                      ? conv.conversation_summary.substring(0, 60) + (conv.conversation_summary.length > 60 ? '...' : '')
                      : '—'}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => navigate(`/conversations/${conv.id}/edit`)} style={btnStyle('#636e72')}>✏️</button>
                      <button onClick={() => handleDelete(conv.id)} style={btnStyle('#ff6b6b')}>🗑️</button>
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
const thStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#636e72' };
const tdStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '0.9rem' };
const avatarStyle: React.CSSProperties = { width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' };
const avatarPlaceholderStyle: React.CSSProperties = { width: 32, height: 32, borderRadius: '50%', background: '#a29bfe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.8rem' };
const loadingStyle: React.CSSProperties = { textAlign: 'center', padding: 48, color: '#636e72' };
const emptyStyle: React.CSSProperties = { textAlign: 'center', padding: 48 };
const searchStyle: React.CSSProperties = { width: '100%', maxWidth: 400, padding: '10px 16px', border: '2px solid #dfe6e9', borderRadius: 12, fontSize: '0.9rem', marginBottom: 16, outline: 'none' };
const btnStyle = (bg: string): React.CSSProperties => ({ background: bg, color: '#fff', padding: '8px 14px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem', border: 'none', cursor: 'pointer' });

export default ConversationsTable;
