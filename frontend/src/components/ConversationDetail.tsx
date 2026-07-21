import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getConversation, deleteConversation, getContact, getTags, getContactTags } from '../api/api';

const ConversationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [conv, setConv] = useState<any>(null);
  const [contact, setContact] = useState<any>(null);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      const data = await getConversation(Number(id));
      setConv(data);

      if (data.primary_contact_id) {
        const c = await getContact(data.primary_contact_id);
        setContact(c);

        const tagData = await getContactTags(data.primary_contact_id);
        const allTags = await getTags();

        let ids: number[] = [];
        if (Array.isArray(tagData)) {
          ids = tagData.map((t: any) => typeof t === 'number' ? t : t.id).filter(Boolean);
        } else if (tagData?.tag_ids) {
          ids = tagData.tag_ids;
        }

        setTags(allTags.filter((t: any) => ids.includes(t.id)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this conversation?')) {
      await deleteConversation(Number(id));
      navigate('/conversations');
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
      Loading...
    </div>
  );

  if (!conv) return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
      Conversation not found.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 700 }}>

      {/* Back */}
      <Link to="/conversations" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        ← Back to Communications
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }} className="glow-text">
          {conv.subject || 'Untitled'}
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate(`/conversations/${id}/edit`)} className="btn btn-muted">
            ✏️ Edit
          </button>
          <button onClick={handleDelete} className="btn btn-danger">
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Contact */}
      {contact && (
        <Link
          to={`/contacts/${contact.id}`}
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
        >
          {conv.profile_picture ? (
            <img src={conv.profile_picture} alt="" className="avatar" style={{ width: 40, height: 40 }} />
          ) : (
            <div className="avatar-placeholder" style={{ width: 40, height: 40 }}>
              {conv.primary_username?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 800 }}>{conv.primary_username}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{conv.application}</div>
          </div>
        </Link>
      )}

      {/* Meta */}
      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            📅 {new Date(conv.date_time).toLocaleString()}
          </span>
          {contact && (contact.city || contact.state) && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              📍 {[contact.city, contact.state].filter(Boolean).join(', ')}
            </span>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tags.map((t: any) => (
              <span
                key={t.id}
                style={{
                  padding: '2px 10px',
                  borderRadius: 999,
                  background: 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  color: 'var(--primary-light)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {conv.conversation_summary && (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            SUMMARY
          </div>
          <div style={{ lineHeight: 1.6 }}>{conv.conversation_summary}</div>
        </div>
      )}

      {/* Notes */}
      {conv.notes && (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            NOTES
          </div>
          <div style={{ lineHeight: 1.6 }}>{conv.notes}</div>
        </div>
      )}

    </div>
  );
};

export default ConversationDetail;