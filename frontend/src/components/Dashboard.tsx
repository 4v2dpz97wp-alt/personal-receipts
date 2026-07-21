import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getContacts,
  getRecentConversations,
  getActiveEmail,
  resetAccountEmail,
  checkEmailReminderDue,
  getFavoriteResponses,
  incrementResponseUsage,
} from '../api/api';

const INTERESTS = [
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

const Dashboard: React.FC = () => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Email state
  const [activeEmail, setActiveEmail] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Favorite responses state
  const [favoriteResponses, setFavoriteResponses] = useState<any[]>([]);
  const [copiedResponseId, setCopiedResponseId] = useState<number | null>(null);

  useEffect(() => { load(); }, []);

  // Check reminder on load and every 60 seconds
  useEffect(() => {
    checkReminder();
    const interval = window.setInterval(checkReminder, 60000);
    return () => window.clearInterval(interval);
  }, []);

  const checkReminder = async () => {
    try {
      const result = await checkEmailReminderDue();
      if (result.due) {
        const dismissed = sessionStorage.getItem('email_reminder_dismissed');
        if (!dismissed) {
          setShowReminderModal(true);
        }
      }
    } catch (e) {
      // Silently fail — no email set up yet
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const all = await getContacts();
      setAllContacts(Array.isArray(all) ? all : []);

      try {
        const favs = await getContacts(undefined, true);
        setFavorites(Array.isArray(favs) ? favs : []);
      } catch {
        setFavorites(
          (Array.isArray(all) ? all : []).filter((c: any) => c.flag_favorite === 1)
        );
      }

      try {
        const recents = await getRecentConversations();
        setRecent(Array.isArray(recents) ? recents : []);
      } catch (e) {
        console.warn('Could not load recent conversations:', e);
        setRecent([]);
      }

      try {
        const email = await getActiveEmail();
        setActiveEmail(email);
      } catch (e) {
        // No email set up yet
      }

      try {
        const favResponses = await getFavoriteResponses();
        setFavoriteResponses(Array.isArray(favResponses) ? favResponses : []);
      } catch (e) {
        // No responses yet
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmail = useCallback(async () => {
    if (!activeEmail?.email_address) return;
    try {
      await navigator.clipboard.writeText(activeEmail.email_address);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (e) {
      alert('Could not copy to clipboard');
    }
  }, [activeEmail]);

  const handleResetEmail = async () => {
    if (!newEmail.trim()) {
      setEmailError('Email address is required');
      return;
    }
    if (!newEmail.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailSaving(true);
    setEmailError('');
    try {
      const result = await resetAccountEmail(newEmail.trim());
      setActiveEmail(result);
      setNewEmail('');
      setShowResetModal(false);
      setShowReminderModal(false);
      sessionStorage.removeItem('email_reminder_dismissed');
    } catch (e) {
      setEmailError('Failed to save email. Please try again.');
    } finally {
      setEmailSaving(false);
    }
  };

  const handleDismissReminder = () => {
    sessionStorage.setItem('email_reminder_dismissed', 'true');
    setShowReminderModal(false);
  };

  const handleCopyResponse = useCallback(async (response: any) => {
    try {
      await navigator.clipboard.writeText(response.body);
      setCopiedResponseId(response.id);
      setTimeout(() => setCopiedResponseId(null), 2000);
      await incrementResponseUsage(response.id);
      setFavoriteResponses(prev =>
        prev.map((r: any) =>
          r.id === response.id
            ? { ...r, usage_count: r.usage_count + 1 }
            : r
        )
      );
    } catch (e) {
      console.error('Copy failed', e);
    }
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return allContacts.filter(c =>
      (c.primary_username || '').toLowerCase().includes(term) ||
      (c.real_name || '').toLowerCase().includes(term)
    );
  }, [search, allContacts]);

  const stats = useMemo(() => {
    const total = allContacts.length;
    const favoriteCount = allContacts.filter(c => c.flag_favorite === 1).length;
    const hotCount = allContacts.filter(c => c.flag_hot === 1).length;
    const avoidCount = allContacts.filter(c => c.flag_avoid === 1).length;
    const twistedCount = allContacts.filter(c => c.flag_twisted === 1).length;
    const metCount = allContacts.filter(
      c => c.have_we_met === 1 || c.have_we_met === true
    ).length;
    const notMetCount = Math.max(total - metCount, 0);
    const birthdaysCount = allContacts.filter(c => !!c.date_of_birth).length;

    const cityCounts: Record<string, number> = {};
    allContacts.forEach(c => {
      const city = [c.city, c.state].filter(Boolean).join(', ');
      if (city) cityCounts[city] = (cityCounts[city] || 0) + 1;
    });

    const topCities = Object.entries(cityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const interestCounts = INTERESTS.map(i => ({
      ...i,
      count: allContacts.filter(
        c => c[i.key] === 1 || c[i.key] === true
      ).length,
    }))
      .filter(i => i.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      total,
      favoriteCount,
      hotCount,
      avoidCount,
      twistedCount,
      metCount,
      notMetCount,
      birthdaysCount,
      topCities,
      interestCounts,
    };
  }, [allContacts]);

  const percent = (value: number, total: number) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ===== RESET EMAIL MODAL ===== */}
      {showResetModal && (
        <div
          onClick={() => {
            setShowResetModal(false);
            setNewEmail('');
            setEmailError('');
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.78)',
            zIndex: 5000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="card"
            style={{ width: '100%', maxWidth: 460 }}
          >
            <div className="section-title">📧 Reset Social Email</div>

            {activeEmail && (
              <div style={{
                marginBottom: 16,
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
              }}>
                Current active email:{' '}
                <strong style={{ color: '#fff' }}>
                  {activeEmail.email_address}
                </strong>
              </div>
            )}

            <p style={{
              color: 'var(--text-muted)',
              fontSize: '0.88rem',
              marginBottom: 16,
              lineHeight: 1.6,
            }}>
              Enter a new email address. The current email will be marked
              as expired and a 14-day reset reminder will be set automatically.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>New Email Address</label>
              <input
                type="email"
                value={newEmail}
                onChange={e => {
                  setNewEmail(e.target.value);
                  setEmailError('');
                }}
                placeholder="Enter new email address"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleResetEmail(); }}
              />
              {emailError && (
                <div style={{
                  color: 'var(--danger)',
                  fontSize: '0.82rem',
                  marginTop: 6,
                }}>
                  {emailError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={handleResetEmail}
                className="btn btn-primary"
                disabled={emailSaving}
                style={{ flex: 1 }}
              >
                {emailSaving ? 'Saving...' : '✅ Set New Email'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  setNewEmail('');
                  setEmailError('');
                }}
                className="btn btn-muted"
                disabled={emailSaving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 14-DAY REMINDER MODAL ===== */}
      {showReminderModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 6000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 460,
              border: '1px solid rgba(251,191,36,0.5)',
              boxShadow: '0 0 40px rgba(251,191,36,0.2)',
            }}
          >
            <div style={{
              fontSize: '2.5rem',
              textAlign: 'center',
              marginBottom: 12,
            }}>
              ⏰
            </div>

            <div className="section-title" style={{
              textAlign: 'center',
              color: '#fbbf24',
            }}>
              Time to Reset Your Social Email
            </div>

            <p style={{
              color: 'var(--text-muted)',
              fontSize: '0.88rem',
              textAlign: 'center',
              marginBottom: 20,
              lineHeight: 1.6,
            }}>
              It has been 14 days since your last email reset.
              {activeEmail && (
                <span>
                  {' '}Your current email is{' '}
                  <strong style={{ color: '#fff' }}>
                    {activeEmail.email_address}
                  </strong>.
                </span>
              )}
              {' '}Enter a new email address below to continue.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>New Email Address</label>
              <input
                type="email"
                value={newEmail}
                onChange={e => {
                  setNewEmail(e.target.value);
                  setEmailError('');
                }}
                placeholder="Enter new email address"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleResetEmail(); }}
              />
              {emailError && (
                <div style={{
                  color: 'var(--danger)',
                  fontSize: '0.82rem',
                  marginTop: 6,
                }}>
                  {emailError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={handleResetEmail}
                className="btn btn-primary"
                disabled={emailSaving}
                style={{ flex: 1 }}
              >
                {emailSaving ? 'Saving...' : '✅ Set New Email'}
              </button>
              <button
                type="button"
                onClick={handleDismissReminder}
                className="btn btn-muted"
                disabled={emailSaving}
              >
                Remind Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900 }} className="glow-text">
            Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            Your contacts, activity, and quick insights.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/contacts/new" className="btn btn-primary">➕ Add Contact</Link>
          <Link to="/conversations/new" className="btn btn-muted">💬 New Comm</Link>
          <Link
            to="/responses"
            className="btn btn-muted"
            style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
          >
            💬 Responses
          </Link>
        </div>
      </div>

      {/* ===== EMAIL CARD ===== */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 4,
            }}>
              Active Social Email
            </div>
            {activeEmail ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                  {activeEmail.email_address}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                }}>
                  Reset by:{' '}
                  {new Date(activeEmail.reset_reminder_date).toLocaleDateString()}
                </span>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                No email set — click Reset to add one.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleCopyEmail}
              disabled={!activeEmail}
              className="btn btn-muted"
              style={{
                borderColor: activeEmail ? 'var(--accent)' : undefined,
                color: activeEmail ? 'var(--accent)' : undefined,
                opacity: activeEmail ? 1 : 0.4,
                transition: 'all 0.2s ease',
              }}
            >
              {copySuccess ? '✅ Copied!' : '📋 Copy Email'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowResetModal(true);
                setNewEmail('');
                setEmailError('');
              }}
              className="btn btn-muted"
              style={{
                borderColor: '#fbbf24',
                color: '#fbbf24',
              }}
            >
              🔄 Reset Social Email
            </button>
          </div>
        </div>

        {activeEmail &&
          new Date(activeEmail.reset_reminder_date) <= new Date() && (
            <div style={{
              marginTop: 12,
              padding: '8px 14px',
              borderRadius: 8,
              background: 'rgba(251,191,36,0.12)',
              border: '1px solid rgba(251,191,36,0.4)',
              color: '#fbbf24',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              ⚠️ Your email reset reminder date has passed.
              Time to set a new email!
            </div>
          )}
      </div>

      {/* ===== SEARCH ===== */}
      <div style={{ maxWidth: 420 }}>
        <input
          type="text"
          placeholder="🔍 Search contacts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ===== SEARCH RESULTS ===== */}
      {search && (
        <div className="card">
          <div className="section-title">
            Search Results ({filtered.length})
          </div>

          {filtered.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', padding: 18 }}>
              No contacts match your search.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              gap: 12,
            }}>
              {filtered.map(c => (
                <Link
                  key={c.id}
                  to={`/contacts/${c.id}`}
                  className="card"
                  style={{
                    textDecoration: 'none',
                    textAlign: 'center',
                    padding: 14,
                    color: 'inherit',
                  }}
                >
                  {c.profile_picture ? (
                    <img
                      src={c.profile_picture}
                      alt=""
                      className="avatar"
                      style={{
                        margin: '0 auto 10px',
                        width: 56,
                        height: 56,
                        display: 'block',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      className="avatar-placeholder"
                      style={{
                        margin: '0 auto 10px',
                        width: 56,
                        height: 56,
                        fontSize: '1.2rem',
                      }}
                    >
                      {(c.primary_username || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                    {c.primary_username}
                  </div>
                  {c.real_name && (
                    <div style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                    }}>
                      {c.real_name}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== STAT CARDS ===== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 14,
      }}>
        <StatCard icon="👤" label="Total Contacts" value={stats.total} accent="var(--primary-light)" />
        <StatCard icon="⭐" label="Favorites" value={stats.favoriteCount} accent="#fbbf24" />
        <StatCard icon="🔥" label="Hot" value={stats.hotCount} accent="#fb7185" />
        <StatCard icon="🚫" label="Avoid" value={stats.avoidCount} accent="var(--danger)" />
        <StatCard icon="🌀" label="Twisted" value={stats.twistedCount} accent="#a855f7" />
        <StatCard icon="🎂" label="Birthdays Saved" value={stats.birthdaysCount} accent="var(--accent)" />
      </div>

      {/* ===== INSIGHTS GRID ===== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 18,
      }}>
        <div className="card">
          <div className="section-title">🤝 Meeting Status</div>
          <MiniBar
            label={`Met (${stats.metCount})`}
            value={percent(stats.metCount, stats.total)}
            color="var(--success)"
          />
          <MiniBar
            label={`Not Met (${stats.notMetCount})`}
            value={percent(stats.notMetCount, stats.total)}
            color="var(--danger)"
          />
          <div style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {stats.total > 0
              ? `${percent(stats.metCount, stats.total)}% of contacts are marked as met.`
              : 'No contacts yet.'}
          </div>
        </div>

        <div className="card">
          <div className="section-title">📍 Top Locations</div>
          {stats.topCities.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>No locations saved yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.topCities.map(item => (
                <MiniBar
                  key={item.city}
                  label={`${item.city} (${item.count})`}
                  value={percent(item.count, stats.total)}
                  color="var(--accent)"
                />
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-title">🎯 Top Interests</div>
          {stats.interestCounts.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>No interests selected yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.interestCounts.map(item => (
                <MiniBar
                  key={item.key}
                  label={`${item.label} (${item.count})`}
                  value={percent(item.count, stats.total)}
                  color="var(--primary-light)"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== FAVORITE CONTACTS ===== */}
      {favorites.length > 0 && (
        <div className="card">
          <div className="section-title">⭐ Favorites</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
            gap: 14,
          }}>
            {favorites.slice(0, 12).map(c => (
              <Link
                key={c.id}
                to={`/contacts/${c.id}`}
                style={{
                  textDecoration: 'none',
                  textAlign: 'center',
                  color: 'inherit',
                  padding: 12,
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {c.profile_picture ? (
                  <img
                    src={c.profile_picture}
                    alt=""
                    className="avatar"
                    style={{ width: 60, height: 60, margin: '0 auto 10px', display: 'block', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="avatar-placeholder"
                    style={{ margin: '0 auto 10px', width: 60, height: 60, fontSize: '1.4rem' }}
                  >
                    {(c.primary_username || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                  {c.primary_username}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                  {c.flag_hot === 1 && <span className="flag flag-hot">🔥</span>}
                  {c.flag_twisted === 1 && <span className="flag flag-twisted">🌀</span>}
                  {c.flag_avoid === 1 && <span className="flag flag-avoid">🚫</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ===== RECENT CONVERSATIONS ===== */}
      <div className="card">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <div className="section-title" style={{ marginBottom: 0 }}>
            💬 Recent Communications
          </div>
          <Link to="/conversations" className="btn btn-muted" style={{ fontSize: '0.8rem' }}>
            View All
          </Link>
        </div>

        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
            No communications yet. Start by adding a contact!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recent.slice(0, 8).map(conv => (
              <div
                key={conv.id}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 14,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Link
                  to={`/contacts/${conv.primary_contact_id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    textDecoration: 'none',
                    color: 'inherit',
                    minWidth: 190,
                  }}
                >
                  {conv.profile_picture ? (
                    <img
                      src={conv.profile_picture}
                      alt=""
                      className="avatar"
                      style={{ width: 38, height: 38, objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className="avatar-placeholder"
                      style={{ width: 38, height: 38, fontSize: '0.85rem' }}
                    >
                      {(conv.primary_username || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 800 }}>{conv.primary_username}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {conv.application || '—'}
                    </div>
                  </div>
                </Link>

                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontWeight: 800 }}>{conv.subject}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(conv.date_time).toLocaleDateString()}
                  </div>
                </div>

                <Link
                  to={`/conversations/${conv.id}/edit`}
                  className="btn btn-muted"
                  style={{ padding: '7px 12px', fontSize: '0.8rem' }}
                >
                  Open
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== FAVORITE RESPONSES ===== */}
      <div className="card">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <div className="section-title" style={{ marginBottom: 0 }}>
            ⭐ Favorite Responses
          </div>
          <Link to="/responses" className="btn btn-muted" style={{ fontSize: '0.8rem' }}>
            View All
          </Link>
        </div>

        {favoriteResponses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 28, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>💬</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>No favorites yet</div>
            <div style={{ fontSize: '0.85rem', marginBottom: 16 }}>
              Star responses on the Responses page to see them here.
            </div>
            <Link to="/responses" className="btn btn-muted" style={{ fontSize: '0.85rem' }}>
              Go to Responses →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {favoriteResponses.map((resp: any) => (
              <div
                key={resp.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(251,191,36,0.06)',
                  border: '1px solid rgba(251,191,36,0.2)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: 3 }}>
                    {resp.title}
                  </div>
                  <div style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {resp.body}
                  </div>
                </div>
                <button
                  onClick={() => handleCopyResponse(resp)}
                  className="btn btn-muted"
                  style={{
                    flexShrink: 0,
                    borderColor: copiedResponseId === resp.id ? 'var(--success)' : 'var(--accent)',
                    color: copiedResponseId === resp.id ? 'var(--success)' : 'var(--accent)',
                    background: copiedResponseId === resp.id
                      ? 'rgba(16,185,129,0.1)'
                      : 'rgba(99,102,241,0.08)',
                    fontWeight: 700,
                    transition: 'all 0.2s ease',
                    fontSize: '0.82rem',
                  }}
                >
                  {copiedResponseId === resp.id ? '✅ Copied!' : '📋 Copy'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

// ===== SUB COMPONENTS =====

const StatCard: React.FC<{
  icon: string;
  label: string;
  value: number;
  accent: string;
}> = ({ icon, label, value, accent }) => (
  <div className="card" style={{ padding: 18 }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    }}>
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800 }}>
          {label}
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: 4 }}>
          {value}
        </div>
      </div>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `${accent}22`,
        border: `1px solid ${accent}55`,
        fontSize: '1.5rem',
      }}>
        {icon}
      </div>
    </div>
  </div>
);

const MiniBar: React.FC<{
  label: string;
  value: number;
  color: string;
}> = ({ label, value, color }) => (
  <div>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      color: 'var(--text-muted)',
      fontSize: '0.82rem',
      fontWeight: 800,
      marginBottom: 6,
      gap: 10,
    }}>
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div style={{
      height: 8,
      background: 'rgba(255,255,255,0.08)',
      borderRadius: 999,
      overflow: 'hidden',
    }}>
      <div style={{
        height: '100%',
        width: `${Math.max(4, Math.min(value, 100))}%`,
        background: color,
        borderRadius: 999,
      }} />
    </div>
  </div>
);

const labelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  marginBottom: 6,
  display: 'block',
};

export default Dashboard;