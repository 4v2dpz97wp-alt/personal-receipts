import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getConversations,
  deleteConversation,
  getContact,
  getTags,
  getContactTags,
  getConversationTags
} from '../api/api';

const INTEREST_FILTERS: { key: string; label: string }[] = [
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
];

const ConversationsTable: React.FC = () => {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [selectedInterestKeys, setSelectedInterestKeys] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tagSearch, setTagSearch] = useState('');

  const [tags, setTags] = useState<any[]>([]);
  const [contactById, setContactById] = useState<Record<number, any>>({});
  const [contactTagIdsById, setContactTagIdsById] = useState<Record<number, number[]>>({});
  const [convTagIdsById, setConvTagIdsById] = useState<Record<number, number[]>>({});

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const convs = await getConversations();
      setConversations(convs);

      const uniqueContactIds = Array.from(
        new Set(convs.map((c: any) => c.primary_contact_id).filter(Boolean))
      ) as number[];

      // Load contacts
      try {
        const contactsArr = await Promise.all(
          uniqueContactIds.map((cid: number) =>
            getContact(cid).catch(() => null)
          )
        );
        const contactMap: Record<number, any> = {};
        contactsArr.forEach((c: any) => { if (c) contactMap[c.id] = c; });
        setContactById(contactMap);
      } catch {
        console.warn('Could not load contact details');
      }

      // Load tags
      try {
        const tagsData = await getTags();
        setTags(tagsData);

        // Contact tags — used for filtering
        const tagMaps = await Promise.all(
          uniqueContactIds.map(async (cid: number) => {
            try {
              const tagData = await getContactTags(cid);
              let ids: number[] = [];
              if (Array.isArray(tagData)) {
                ids = tagData.map((t: any) => (typeof t === 'number' ? t : t.id)).filter(Boolean);
              } else if (tagData?.tag_ids) {
                ids = tagData.tag_ids;
              }
              return { id: cid, ids };
            } catch {
              return { id: cid, ids: [] as number[] };
            }
          })
        );
        const contactTagMap: Record<number, number[]> = {};
        tagMaps.forEach(m => { contactTagMap[m.id] = m.ids; });
        setContactTagIdsById(contactTagMap);

        // Conversation tags — used for display on cards
        const convTagMaps = await Promise.all(
          convs.map(async (conv: any) => {
            try {
              const tagData = await getConversationTags(conv.id);
              let ids: number[] = [];
              if (Array.isArray(tagData)) {
                ids = tagData.map((t: any) => (typeof t === 'number' ? t : t.id)).filter(Boolean);
              } else if (tagData?.tag_ids) {
                ids = tagData.tag_ids;
              }
              return { id: conv.id, ids };
            } catch {
              return { id: conv.id, ids: [] as number[] };
            }
          })
        );
        const convTagMap: Record<number, number[]> = {};
        convTagMaps.forEach(m => { convTagMap[m.id] = m.ids; });
        setConvTagIdsById(convTagMap);

      } catch {
        console.warn('Could not load tags');
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredTags = useMemo(() => {
    const t = tagSearch.trim().toLowerCase();
    if (!t) return tags;
    return tags.filter((x: any) => (x.name || '').toLowerCase().includes(t));
  }, [tags, tagSearch]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const cityTerm = cityFilter.trim().toLowerCase();

    return conversations.filter(conv => {
      const matchesSearch =
        conv.subject?.toLowerCase().includes(term) ||
        conv.primary_username?.toLowerCase().includes(term);

      const contact = contactById[conv.primary_contact_id];
      const haystack = contact
        ? `${contact.city || ''} ${contact.state || ''} ${contact.country || ''}`.toLowerCase()
        : '';
      const matchesCity = cityTerm.length === 0 || haystack.includes(cityTerm);

      const matchesInterests =
        selectedInterestKeys.length === 0 ||
        (contact && selectedInterestKeys.some(k => contact[k] === 1 || contact[k] === true));

      const contactTagIds = contactTagIdsById[conv.primary_contact_id] || [];
      const matchesTags =
        selectedTagIds.length === 0 ||
        selectedTagIds.some(tid => contactTagIds.includes(tid));

      return matchesSearch && matchesCity && matchesInterests && matchesTags;
    });
  }, [conversations, search, cityFilter, selectedInterestKeys, selectedTagIds, contactById, contactTagIdsById]);

  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) =>
      new Date(b.date_time).getTime() - new Date(a.date_time).getTime()
    );
  }, [filtered]);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation?')) {
      await deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
    }
  };

  const activeFilterCount =
    (cityFilter.trim() ? 1 : 0) +
    selectedInterestKeys.length +
    selectedTagIds.length;

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
      Loading...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }} className="glow-text">
          Communications
        </h1>
        <Link to="/conversations/new" className="btn btn-primary">
          ➕ New Communication
        </Link>
      </div>

      {/* Search */}
      <div style={{ maxWidth: 400 }}>
        <input
          type="text"
          placeholder="🔍 Search communications..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <details style={{
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '10px 14px',
        background: 'rgba(255,255,255,0.03)',
        fontSize: '0.85rem',
      }}>
        <summary style={{
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          ⚙️ Filters {activeFilterCount > 0 && (
            <span style={{
              marginLeft: 8,
              background: 'var(--primary)',
              color: '#fff',
              borderRadius: 999,
              padding: '2px 8px',
              fontSize: '0.75rem',
              fontWeight: 800,
            }}>
              {activeFilterCount}
            </span>
          )}
        </summary>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>

          {/* City Filter */}
          <div>
            <label style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontWeight: 700,
              marginBottom: 4,
              display: 'block'
            }}>
              City / State
            </label>
            <input
              type="text"
              placeholder="e.g. Dallas, TX"
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              style={{ maxWidth: 280, fontSize: '0.85rem', padding: '8px 12px' }}
            />
          </div>

          {/* Interests Filter */}
          <div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontWeight: 700,
              marginBottom: 6
            }}>
              Interests
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {INTEREST_FILTERS.map(i => {
                const active = selectedInterestKeys.includes(i.key);
                return (
                  <button
                    key={i.key}
                    type="button"
                    onClick={() => {
                      setSelectedInterestKeys(prev =>
                        prev.includes(i.key)
                          ? prev.filter(x => x !== i.key)
                          : [...prev, i.key]
                      );
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 16,
                      border: active
                        ? '1px solid var(--primary)'
                        : '1px solid rgba(255,255,255,0.15)',
                      background: active ? 'rgba(99,102,241,0.2)' : 'transparent',
                      color: active ? 'var(--primary-light)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    {i.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags Filter */}
          {tags.length > 0 && (
            <div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                fontWeight: 700,
                marginBottom: 6
              }}>
                Tags
              </div>
              <input
                type="text"
                placeholder="Search tags..."
                value={tagSearch}
                onChange={e => setTagSearch(e.target.value)}
                style={{ maxWidth: 200, marginBottom: 8, fontSize: '0.8rem', padding: '6px 10px' }}
              />
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                maxHeight: 120,
                overflowY: 'auto'
              }}>
                {filteredTags.map((t: any) => {
                  const active = selectedTagIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTagIds(prev =>
                          prev.includes(t.id)
                            ? prev.filter(x => x !== t.id)
                            : [...prev, t.id]
                        );
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 16,
                        border: active
                          ? '1px solid var(--primary)'
                          : '1px solid rgba(255,255,255,0.15)',
                        background: active ? 'rgba(99,102,241,0.2)' : 'transparent',
                        color: active ? 'var(--primary-light)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setCityFilter('');
                setSelectedInterestKeys([]);
                setSelectedTagIds([]);
                setTagSearch('');
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                alignSelf: 'flex-start',
              }}
            >
              ✕ Clear All Filters
            </button>
          )}

        </div>
      </details>

      {/* Cards */}
      {sortedFiltered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          <h3>No communications found</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sortedFiltered.map(conv => {
            const contact = contactById[conv.primary_contact_id];
            const summary = conv.conversation_summary || '';
            const convTagIds = convTagIdsById[conv.id] || [];
            const convTags = tags.filter((t: any) => convTagIds.includes(t.id));

            return (
              <div
                key={conv.id}
                className="card"
                style={{ cursor: 'pointer', padding: 16 }}
                onClick={() => navigate(`/conversations/${conv.id}`)}
              >

                {/* Top Row — Contact + Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  alignItems: 'flex-start',
                  flexWrap: 'wrap'
                }}>
                  <Link
                    to={`/contacts/${conv.primary_contact_id}`}
                    onClick={e => e.stopPropagation()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      textDecoration: 'none'
                    }}
                  >
                    {conv.profile_picture ? (
                      <img
                        src={conv.profile_picture}
                        alt=""
                        className="avatar"
                        style={{ width: 32, height: 32 }}
                      />
                    ) : (
                      <div
                        className="avatar-placeholder"
                        style={{ width: 32, height: 32, fontSize: '0.8rem' }}
                      >
                        {conv.primary_username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 800 }}>{conv.primary_username}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {conv.application}
                      </div>
                    </div>
                  </Link>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/conversations/${conv.id}/edit`);
                      }}
                      className="btn btn-muted"
                      style={{ padding: '6px 12px' }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={e => handleDelete(e, conv.id)}
                      className="btn btn-danger"
                      style={{ padding: '6px 12px' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Subject / Date / Location */}
                <div style={{
                  marginTop: 8,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  alignItems: 'center'
                }}>
                  <div style={{ fontWeight: 800 }}>{conv.subject}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {new Date(conv.date_time).toLocaleDateString()}
                  </div>
                  {contact && (contact.city || contact.state) && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      📍 {[contact.city, contact.state].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>

                {/* Conversation Tags */}
                {convTags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {convTags.map((t: any) => (
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

                {/* Summary */}
                {summary && (
                  <details
                    style={{ marginTop: 8 }}
                    onClick={e => e.stopPropagation()}
                  >
                    <summary style={{
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)'
                    }}>
                      Summary
                    </summary>
                    <div style={{ marginTop: 6, fontSize: '0.9rem' }}>
                      {summary}
                    </div>
                  </details>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default ConversationsTable;