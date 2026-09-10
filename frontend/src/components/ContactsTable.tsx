import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { getContacts, deleteContact, getTags, getContactTags, getAllUsernameHistories } from '../api/api';

type ViewMode = 'table' | 'cards' | 'gallery';
type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a' | 'favorites';

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

const AVOID = {
  cardBorder: '1px solid rgba(255, 0, 80, 0.9)',
  cardBg: 'linear-gradient(180deg, rgba(70,0,15,0.97), rgba(30,0,8,0.98))',
  cardShadow: '0 0 18px rgba(255,0,80,0.55), 0 0 45px rgba(255,0,80,0.22), inset 0 0 28px rgba(255,0,80,0.1)',
  cardAnimation: 'avoidPulse 2.4s ease-in-out infinite',
  stripe: 'linear-gradient(90deg, #ff004c, #ff3366, #ff004c)',
  stripeShadow: '0 0 16px rgba(255,0,80,0.95)',
  avatarRing: '0 0 0 3px #ff004c, 0 0 18px rgba(255,0,80,0.75)',
  username: '#ff3d70' as const,
  usernameShadow: '0 0 14px rgba(255,0,80,0.85)',
  tableBg: 'rgba(90, 0, 25, 0.45)',
  tableInset: 'inset 5px 0 0 #ff004c',
  galleryBorder: '3px solid #ff004c',
  galleryShadow: '0 0 22px rgba(255,0,80,0.65), 0 0 50px rgba(255,0,80,0.25)',
};

const PhotoHover: React.FC<{ src: string; children: React.ReactNode }> = ({ src, children }) => {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pw = 230;
    const ph = 230;

    let left = rect.left + rect.width / 2 - pw / 2;
    if (left < 10) left = 10;
    if (left + pw > vw - 10) left = vw - pw - 10;

    let top = rect.top > ph + 20 ? rect.top - ph - 10 : rect.bottom + 10;
    if (top < 10) top = 10;
    if (top + ph > vh - 10) top = vh - ph - 10;

    setCoords({ top, left });
    setShow(true);
  };

  return (
    <div ref={ref} style={{ display: 'inline-flex', flexShrink: 0 }} onMouseEnter={handleEnter} onMouseLeave={() => setShow(false)}>
      {children}
      {show && ReactDOM.createPortal(
        <div onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()} style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 99999, padding: 5, background: 'var(--card-bg, #1a1a2e)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)', animation: 'photoHoverIn 0.15s ease-out', pointerEvents: 'none' }}>
          <img src={src} alt="" style={{ width: 220, height: 220, objectFit: 'cover', borderRadius: 11, display: 'block' }} />
        </div>, document.body
      )}
    </div>
  );
};

const ContactsTable: React.FC = () => {
  const navigate = useNavigate();

  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [selectedInterestKeys, setSelectedInterestKeys] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tagSearch, setTagSearch] = useState('');
  const [tags, setTags] = useState<any[]>([]);
  const [contactTagIdsById, setContactTagIdsById] = useState<Record<number, number[]>>({});
  const [usernameHistoryById, setUsernameHistoryById] = useState<Record<number, string[]>>({});
  const [sortMode, setSortMode] = useState<SortOption>('newest');

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('pr_contacts_view');
    if (saved === 'table' || saved === 'cards' || saved === 'gallery') return saved;
    return 'cards';
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const contactsData = await getContacts();
      setContacts(Array.isArray(contactsData) ? contactsData : []);

      try {
        const tagsData = await getTags();
        setTags(Array.isArray(tagsData) ? tagsData : []);
        const tagMaps = await Promise.all(
          contactsData.map(async (c: any) => {
            try {
              const tagData = await getContactTags(c.id);
              let ids: number[] = [];
              if (Array.isArray(tagData)) {
                ids = tagData.map((t: any) => (typeof t === 'number' ? t : t.id)).filter(Boolean);
              } else if (tagData?.tag_ids) {
                ids = tagData.tag_ids;
              }
              return { id: c.id, ids };
            } catch {
              return { id: c.id, ids: [] as number[] };
            }
          })
        );
        const map: Record<number, number[]> = {};
        tagMaps.forEach(m => { map[m.id] = m.ids; });
        setContactTagIdsById(map);
      } catch (tagErr) {
        console.warn('Could not load tags:', tagErr);
      }

      try {
        const historyMap = await getAllUsernameHistories();
        setUsernameHistoryById(historyMap || {});
      } catch (histErr) {
        console.warn('Could not load username histories:', histErr);
      }
    } catch (e) {
      console.error('Error loading contacts:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const cityTerm = cityFilter.trim().toLowerCase();
    return contacts.filter(c => {
      const username = (c.primary_username || '').toLowerCase();
      const realName = (c.real_name || '').toLowerCase();
      let matchesSearch = username.includes(term) || realName.includes(term);
      if (!matchesSearch && term.length > 0) {
        const history = usernameHistoryById[c.id] || [];
        matchesSearch = history.some(h => (h || '').toLowerCase().includes(term));
      }
      const locationText = `${c.city || ''} ${c.state || ''} ${c.country || ''}`.toLowerCase();
      const matchesCity = cityTerm.length === 0 || locationText.includes(cityTerm);
      const matchesInterests = selectedInterestKeys.length === 0 || selectedInterestKeys.some(k => c[k] === 1 || c[k] === true);
      const contactTagIds = contactTagIdsById[c.id] || [];
      const matchesTags = selectedTagIds.length === 0 || selectedTagIds.some(tid => contactTagIds.includes(tid));
      return matchesSearch && matchesCity && matchesInterests && matchesTags;
    });
  }, [contacts, search, cityFilter, selectedInterestKeys, selectedTagIds, contactTagIdsById, usernameHistoryById]);

  const sortedFiltered = useMemo(() => {
    let result = [...filtered];
    if (sortMode === 'a-z') {
      result.sort((a, b) => (a.primary_username || '').localeCompare(b.primary_username || ''));
    } else if (sortMode === 'z-a') {
      result.sort((a, b) => (b.primary_username || '').localeCompare(a.primary_username || ''));
    } else if (sortMode === 'newest') {
      result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else if (sortMode === 'oldest') {
      result.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    } else if (sortMode === 'favorites') {
      result.sort((a, b) => (b.flag_favorite ? 1 : 0) - (a.flag_favorite ? 1 : 0));
    }
    return result;
  }, [filtered, sortMode]);

  const getMatchedHistory = useCallback((c: any): string | null => {
    const term = search.trim().toLowerCase();
    if (!term) return null;
    const currentHit = (c.primary_username || '').toLowerCase().includes(term) || (c.real_name || '').toLowerCase().includes(term);
    if (currentHit) return null;
    const history = usernameHistoryById[c.id] || [];
    return history.find(h => (h || '').toLowerCase().includes(term)) || null;
  }, [search, usernameHistoryById]);

  const filteredTags = useMemo(() => {
    const t = tagSearch.trim().toLowerCase();
    return t ? tags.filter((x: any) => (x.name || '').toLowerCase().includes(t)) : tags;
  }, [tags, tagSearch]);

  const activeFilterCount = (cityFilter.trim() ? 1 : 0) + selectedInterestKeys.length + selectedTagIds.length;

  const handleDelete = async (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation(); e.preventDefault();
    if (window.confirm(`Delete "${name}"?`)) {
      await deleteContact(id);
      setContacts(prev => prev.filter(c => c.id !== id));
    }
  };

  const goToContact = (id: number) => navigate(`/contacts/${id}`);
  const changeView = (mode: ViewMode) => { setViewMode(mode); localStorage.setItem('pr_contacts_view', mode); };
  const initials = (name?: string) => name?.charAt(0)?.toUpperCase() || '?';

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }} className="glow-text">Contacts</h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => changeView('gallery')} className={viewMode === 'gallery' ? 'btn btn-primary' : 'btn btn-muted'} style={{ padding: '8px 14px' }}>🖼️ Gallery</button>
          <button type="button" onClick={() => changeView('cards')} className={viewMode === 'cards' ? 'btn btn-primary' : 'btn btn-muted'} style={{ padding: '8px 14px' }}>🃏 Cards</button>
          <button type="button" onClick={() => changeView('table')} className={viewMode === 'table' ? 'btn btn-primary' : 'btn btn-muted'} style={{ padding: '8px 14px' }}>📋 Table</button>
          <Link to="/contacts/new" className="btn btn-primary">➕ Add Contact</Link>
        </div>
      </div>

      <div style={{ maxWidth: 400 }}>
        <input type="text" placeholder="🔍 Search contacts & past usernames..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={{ maxWidth: 260 }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Sort By</label>
        <select value={sortMode} onChange={e => setSortMode(e.target.value as SortOption)} style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,15,26,0.9)', color: '#fff', fontSize: '0.85rem' }}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="a-z">A → Z</option>
          <option value="z-a">Z → A</option>
          <option value="favorites">Favorites First</option>
        </select>
      </div>

      <details style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', fontSize: '0.85rem' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          ⚙️ Filters {activeFilterCount > 0 && <span style={{ marginLeft: 8, background: 'var(--primary)', color: '#fff', borderRadius: 999, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 800 }}>{activeFilterCount}</span>}
        </summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4, display: 'block' }}>City / State</label>
            <input type="text" placeholder="e.g. Austin, TX" value={cityFilter} onChange={e => setCityFilter(e.target.value)} style={{ maxWidth: 280, fontSize: '0.85rem', padding: '8px 12px' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>Interests</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {INTEREST_FILTERS.map(i => {
                const active = selectedInterestKeys.includes(i.key);
                return <button key={i.key} type="button" onClick={() => setSelectedInterestKeys(prev => prev.includes(i.key) ? prev.filter(x => x !== i.key) : [...prev, i.key])} style={{ padding: '4px 10px', borderRadius: 16, border: active ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.15)', background: active ? 'rgba(99,102,241,0.2)' : 'transparent', color: active ? 'var(--primary-light)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>{i.label}</button>;
              })}
            </div>
          </div>
          {tags.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>Tags</div>
              <input type="text" placeholder="Search tags..." value={tagSearch} onChange={e => setTagSearch(e.target.value)} style={{ maxWidth: 200, marginBottom: 8, fontSize: '0.8rem', padding: '6px 10px' }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
                {filteredTags.map((t: any) => {
                  const active = selectedTagIds.includes(t.id);
                  return <button key={t.id} type="button" onClick={() => setSelectedTagIds(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])} style={{ padding: '4px 10px', borderRadius: 16, border: active ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.15)', background: active ? 'rgba(99,102,241,0.2)' : 'transparent', color: active ? 'var(--primary-light)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>{t.name}</button>;
                })}
              </div>
            </div>
          )}
          {activeFilterCount > 0 && <button type="button" onClick={() => { setCityFilter(''); setSelectedInterestKeys([]); setSelectedTagIds([]); setTagSearch(''); }} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, alignSelf: 'flex-start' }}>✕ Clear All Filters</button>}
        </div>
      </details>

      {sortedFiltered.length === 0 ? (
        <div className="card">
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <h3>No contacts found</h3>
            <p>Add your first contact to get started.</p>
          </div>
        </div>
      ) : viewMode === 'gallery' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 18 }}>
          {sortedFiltered.map(c => {
            const isAvoid = c.flag_avoid === 1;
            const historyHit = getMatchedHistory(c);
            return (
              <div key={c.id} className="card" onClick={() => goToContact(c.id)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') goToContact(c.id); }} style={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'inherit', position: 'relative', transition: 'transform 0.15s ease', cursor: 'pointer', border: isAvoid ? AVOID.cardBorder : undefined, background: isAvoid ? AVOID.cardBg : undefined, boxShadow: isAvoid ? AVOID.cardShadow : undefined, animation: isAvoid ? AVOID.cardAnimation : undefined }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                {isAvoid && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: AVOID.stripe, boxShadow: AVOID.stripeShadow, pointerEvents: 'none' }} />}
                {c.profile_picture ? (
                  <PhotoHover src={c.profile_picture}><img src={c.profile_picture} alt="" style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: '50%', border: isAvoid ? AVOID.galleryBorder : '3px solid rgba(255,255,255,0.1)', boxShadow: isAvoid ? AVOID.galleryShadow : '0 4px 16px rgba(0,0,0,0.3)', marginTop: isAvoid ? 8 : 0 }} /></PhotoHover>
                ) : (<div className="avatar-placeholder" style={{ width: 140, height: 140, fontSize: '2.8rem', borderRadius: '50%', marginTop: isAvoid ? 8 : 0, boxShadow: isAvoid ? AVOID.avatarRing : undefined }}>{initials(c.primary_username)}</div>)}
                <div style={{ marginTop: 14, fontWeight: 900, fontSize: '1rem', textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isAvoid ? AVOID.username : undefined, textShadow: isAvoid ? AVOID.usernameShadow : undefined }}>{c.primary_username}</div>
                {isAvoid && <div style={{ marginTop: 6, fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.5px', color: '#ff004c', textShadow: '0 0 10px rgba(255,0,80,0.9)', textTransform: 'uppercase' }}>🚫 AVOID</div>}
                {historyHit && <div style={{ marginTop: 4, fontSize: '0.72rem', color: 'var(--accent)', fontStyle: 'italic', opacity: 0.85 }}>formerly {historyHit}</div>}
                <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center', minHeight: 22 }}>
                  {c.flag_favorite === 1 && <span style={{ fontSize: '0.9rem' }}>⭐</span>}
                  {c.flag_hot === 1 && <span style={{ fontSize: '0.9rem' }}>🔥</span>}
                  {c.flag_twisted === 1 && <span style={{ fontSize: '0.9rem' }}>🌀</span>}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {sortedFiltered.map(c => {
            const isAvoid = c.flag_avoid === 1;
            const historyHit = getMatchedHistory(c);
            return (
              <div key={c.id} className="card" style={{ padding: 18, position: 'relative', border: isAvoid ? AVOID.cardBorder : undefined, background: isAvoid ? AVOID.cardBg : undefined, boxShadow: isAvoid ? AVOID.cardShadow : undefined, animation: isAvoid ? AVOID.cardAnimation : undefined }}>
                {isAvoid && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: AVOID.stripe, boxShadow: AVOID.stripeShadow, pointerEvents: 'none' }} />}
                <div onClick={() => goToContact(c.id)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') goToContact(c.id); }} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, marginTop: isAvoid ? 6 : 0, cursor: 'pointer' }}>
                  {c.profile_picture ? (
                    <PhotoHover src={c.profile_picture}><img src={c.profile_picture} alt="" className="avatar" style={{ width: 62, height: 62, objectFit: 'cover', borderRadius: '50%', flexShrink: 0, boxShadow: isAvoid ? AVOID.avatarRing : undefined }} /></PhotoHover>
                  ) : (<div className="avatar-placeholder" style={{ width: 62, height: 62, fontSize: '1.4rem', flexShrink: 0, boxShadow: isAvoid ? AVOID.avatarRing : undefined }}>{initials(c.primary_username)}</div>)}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isAvoid ? AVOID.username : undefined, textShadow: isAvoid ? AVOID.usernameShadow : undefined }}>{c.primary_username}</div>
                    {historyHit && <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontStyle: 'italic', opacity: 0.85 }}>formerly {historyHit}</div>}
                    {c.real_name && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.real_name}</div>}
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: 2 }}>{c.primary_messaging_app || '—'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>📍 {[c.city, c.state].filter(Boolean).join(', ') || 'No location'}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>🤝 Met: {c.have_we_met ? '✅ Yes' : '❌ No'}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 26 }}>
                    {c.flag_favorite === 1 && <span className="flag flag-favorite">⭐ Favorite</span>}
                    {c.flag_hot === 1 && <span className="flag flag-hot">🔥 Hot</span>}
                    {c.flag_twisted === 1 && <span className="flag flag-twisted">🌀 Twisted</span>}
                    {c.flag_avoid === 1 && <span className="flag flag-avoid">🚫 Avoid</span>}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16, borderTop: isAvoid ? '1px solid rgba(255,0,80,0.35)' : '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
                  <button type="button" onClick={e => { e.stopPropagation(); goToContact(c.id); }} className="btn btn-muted" style={{ padding: '8px 12px', justifyContent: 'center' }}>View</button>
                  <button type="button" onClick={e => { e.stopPropagation(); navigate(`/conversations/new?contact=${c.id}`); }} className="btn btn-muted" style={{ padding: '8px 12px', justifyContent: 'center' }}>💬 Note</button>
                  <button type="button" onClick={e => { e.stopPropagation(); navigate(`/contacts/${c.id}/edit`); }} className="btn btn-primary" style={{ padding: '8px 12px', justifyContent: 'center' }}>✏️ Edit</button>
                  <button type="button" onClick={e => handleDelete(e, c.id, c.primary_username)} className="btn btn-danger" style={{ padding: '8px 12px' }}>🗑️ Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <table>
            <thead><tr><th>Contact</th><th>App</th><th>Location</th><th>Flags</th><th>Met?</th><th>Actions</th></tr></thead>
            <tbody>
              {sortedFiltered.map(c => {
                const isAvoid = c.flag_avoid === 1;
                const historyHit = getMatchedHistory(c);
                return (
                  <tr key={c.id} onClick={() => goToContact(c.id)} style={{ cursor: 'pointer', background: isAvoid ? AVOID.tableBg : undefined, boxShadow: isAvoid ? AVOID.tableInset : undefined }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {c.profile_picture ? (
                          <PhotoHover src={c.profile_picture}><img src={c.profile_picture} alt="" className="avatar" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: '50%', boxShadow: isAvoid ? AVOID.avatarRing : undefined }} /></PhotoHover>
                        ) : (<div className="avatar-placeholder" style={{ width: 36, height: 36, boxShadow: isAvoid ? AVOID.avatarRing : undefined }}>{initials(c.primary_username)}</div>)}
                        <div>
                          <div style={{ fontWeight: 600, color: isAvoid ? AVOID.username : undefined, textShadow: isAvoid ? AVOID.usernameShadow : undefined }}>{c.primary_username}</div>
                          {historyHit && <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontStyle: 'italic', opacity: 0.85 }}>formerly {historyHit}</div>}
                          {c.real_name && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.real_name}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.primary_messaging_app}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{[c.city, c.state].filter(Boolean).join(', ') || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {c.flag_favorite === 1 && <span className="flag flag-favorite">⭐</span>}
                        {c.flag_hot === 1 && <span className="flag flag-hot">🔥</span>}
                        {c.flag_twisted === 1 && <span className="flag flag-twisted">🌀</span>}
                        {c.flag_avoid === 1 && <span className="flag flag-avoid">🚫</span>}
                      </div>
                    </td>
                    <td>{c.have_we_met ? '✅' : '❌'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button type="button" onClick={e => { e.stopPropagation(); navigate(`/conversations/new?contact=${c.id}`); }} className="btn btn-muted" style={{ padding: '6px 12px' }}>💬</button>
                        <button type="button" onClick={e => { e.stopPropagation(); navigate(`/contacts/${c.id}/edit`); }} className="btn btn-muted" style={{ padding: '6px 12px' }}>✏️</button>
                        <button type="button" onClick={e => handleDelete(e, c.id, c.primary_username)} className="btn btn-danger" style={{ padding: '6px 12px' }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ContactsTable;