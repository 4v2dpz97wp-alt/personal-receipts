import React, { useEffect, useState, useCallback } from 'react';
import {
  getCommonResponses,
  getCommonResponseCategories,
  deleteCommonResponse,
  toggleFavoriteResponse,
  incrementResponseUsage,
} from '../api/api';
import CommonResponseForm from './CommonResponseForm';

interface CommonResponse {
  id: number;
  title: string;
  category: string;
  body: string;
  is_favorite: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

const CommonResponses: React.FC = () => {
  const [responses, setResponses] = useState<CommonResponse[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingResponse, setEditingResponse] = useState<CommonResponse | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<CommonResponse | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadResponses();
  }, [search, selectedCategory, favoritesOnly]);

  const loadResponses = useCallback(async () => {
    try {
      const data = await getCommonResponses({
        search: search || undefined,
        category: selectedCategory || undefined,
        favorites: favoritesOnly || undefined,
      });
      setResponses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, favoritesOnly]);

  const loadCategories = async () => {
    try {
      const data = await getCommonResponseCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleCopy = async (response: CommonResponse) => {
    try {
      await navigator.clipboard.writeText(response.body);
      setCopiedId(response.id);
      setTimeout(() => setCopiedId(null), 2000);
      showToast('✅ Copied to clipboard!');
      await incrementResponseUsage(response.id);
      // Update usage count locally
      setResponses(prev =>
        prev.map(r =>
          r.id === response.id
            ? { ...r, usage_count: r.usage_count + 1 }
            : r
        )
      );
    } catch (e) {
      console.error(e);
      showToast('❌ Failed to copy');
    }
  };

  const handleToggleFavorite = async (response: CommonResponse) => {
    try {
      const updated = await toggleFavoriteResponse(response.id);
      setResponses(prev =>
        prev.map(r => (r.id === response.id ? updated : r))
      );
      showToast(
        updated.is_favorite ? '⭐ Added to favorites!' : '☆ Removed from favorites.'
      );
      loadCategories();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteCommonResponse(deleteConfirm.id);
      setResponses(prev => prev.filter(r => r.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      showToast('🗑️ Response deleted.');
      loadCategories();
    } catch (e) {
      console.error(e);
      showToast('❌ Failed to delete.');
    }
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingResponse(null);
    loadResponses();
    loadCategories();
    showToast(editingResponse ? '✅ Response updated!' : '✅ Response created!');
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingResponse(null);
  };

  const openEdit = (response: CommonResponse) => {
    setEditingResponse(response);
    setShowForm(true);
  };

  const openNew = () => {
    setEditingResponse(null);
    setShowForm(true);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setFavoritesOnly(false);
  };

  const hasFilters = search || selectedCategory || favoritesOnly;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ===== TOAST ===== */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          background: 'rgba(15,15,26,0.97)',
          border: '1px solid rgba(99,102,241,0.4)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: '0.9rem',
          zIndex: 9999,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast}
        </div>
      )}

      {/* ===== DELETE MODAL ===== */}
      {deleteConfirm && (
        <div
          onClick={() => setDeleteConfirm(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.78)',
            zIndex: 5000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="card"
            style={{ width: '100%', maxWidth: 420 }}
          >
            <div className="section-title" style={{ color: 'var(--danger)' }}>
              🗑️ Delete Response
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
              Are you sure you want to delete:
            </p>
            <p style={{ fontWeight: 800, marginBottom: 20 }}>
              "{deleteConfirm.title}"
            </p>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              marginBottom: 20,
            }}>
              This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleDelete}
                className="btn btn-primary"
                style={{
                  background: 'var(--danger)',
                  borderColor: 'var(--danger)',
                  flex: 1,
                }}
              >
                🗑️ Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn btn-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== FORM MODAL ===== */}
      {showForm && (
        <div
          onClick={handleFormCancel}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.78)',
            zIndex: 5000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
            overflowY: 'auto',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560 }}>
            <CommonResponseForm
              existing={editingResponse}
              categories={categories}
              onSave={handleFormSave}
              onCancel={handleFormCancel}
            />
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
            💬 Common Responses
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            Save and copy your frequently used chat responses.
          </p>
        </div>
        <button onClick={openNew} className="btn btn-primary">
          ➕ Add Response
        </button>
      </div>

      {/* ===== SEARCH & FILTERS ===== */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              type="text"
              placeholder="🔍 Search responses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: 'inherit',
              fontSize: '0.9rem',
              cursor: 'pointer',
              minWidth: 150,
            }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Favorites toggle */}
          <button
            onClick={() => setFavoritesOnly(f => !f)}
            className={favoritesOnly ? 'btn btn-primary' : 'btn btn-muted'}
            style={{
              borderColor: favoritesOnly ? '#fbbf24' : undefined,
              color: favoritesOnly ? '#fbbf24' : undefined,
              background: favoritesOnly ? 'rgba(251,191,36,0.12)' : undefined,
            }}
          >
            ⭐ Favorites
          </button>

          {/* Clear filters */}
          {hasFilters && (
            <button onClick={clearFilters} className="btn btn-muted">
              ✕ Clear
            </button>
          )}
        </div>

        {/* Active filter tags */}
        {hasFilters && (
          <div style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            marginTop: 12,
          }}>
            {search && (
              <span style={filterBadgeStyle}>
                Search: "{search}"
                <button
                  onClick={() => setSearch('')}
                  style={filterBadgeCloseStyle}
                >✕</button>
              </span>
            )}
            {selectedCategory && (
              <span style={filterBadgeStyle}>
                Category: {selectedCategory}
                <button
                  onClick={() => setSelectedCategory('')}
                  style={filterBadgeCloseStyle}
                >✕</button>
              </span>
            )}
            {favoritesOnly && (
              <span style={{ ...filterBadgeStyle, borderColor: '#fbbf2466', color: '#fbbf24' }}>
                ⭐ Favorites only
                <button
                  onClick={() => setFavoritesOnly(false)}
                  style={filterBadgeCloseStyle}
                >✕</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ===== RESULTS COUNT ===== */}
      <div style={{
        color: 'var(--text-muted)',
        fontSize: '0.82rem',
        fontWeight: 700,
        paddingLeft: 2,
      }}>
        {loading ? 'Loading...' : `${responses.length} response${responses.length !== 1 ? 's' : ''} found`}
      </div>

      {/* ===== RESPONSES LIST ===== */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          Loading responses...
        </div>
      ) : responses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>💬</div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 8 }}>
            No responses found
          </div>
          <div style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
            {hasFilters
              ? 'Try adjusting your search or filters.'
              : 'Add your first common response to get started!'}
          </div>
          {!hasFilters && (
            <button onClick={openNew} className="btn btn-primary">
              ➕ Add First Response
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {responses.map(response => {
            const isExpanded = expandedId === response.id;
            const isCopied = copiedId === response.id;
            const isFav = response.is_favorite === 1;
            const isLong = response.body.length > 160;

            return (
              <div
                key={response.id}
                className="card"
                style={{
                  padding: 16,
                  borderLeft: isFav
                    ? '3px solid #fbbf24'
                    : '3px solid transparent',
                  transition: 'border-color 0.2s ease',
                }}
              >
                {/* Top row: title + actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginBottom: 10,
                }}>
                  {/* Title & meta */}
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontWeight: 900, fontSize: '1rem', marginBottom: 4 }}>
                      {response.title}
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}>
                      <span style={{
                        padding: '2px 10px',
                        borderRadius: 999,
                        background: 'rgba(99,102,241,0.14)',
                        border: '1px solid rgba(99,102,241,0.3)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--primary-light)',
                      }}>
                        {response.category}
                      </span>
                      {response.usage_count > 0 && (
                        <span style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          fontWeight: 600,
                        }}>
                          Used {response.usage_count}×
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    flexShrink: 0,
                    flexWrap: 'wrap',
                  }}>
                    {/* Favorite toggle */}
                    <button
                      onClick={() => handleToggleFavorite(response)}
                      className="btn btn-muted"
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      style={{
                        padding: '7px 10px',
                        borderColor: isFav ? '#fbbf24' : undefined,
                        color: isFav ? '#fbbf24' : undefined,
                        background: isFav ? 'rgba(251,191,36,0.1)' : undefined,
                      }}
                    >
                      {isFav ? '⭐' : '☆'}
                    </button>

                    {/* Copy */}
                    <button
                      onClick={() => handleCopy(response)}
                      className="btn btn-muted"
                      style={{
                        borderColor: isCopied ? 'var(--success)' : 'var(--accent)',
                        color: isCopied ? 'var(--success)' : 'var(--accent)',
                        background: isCopied
                          ? 'rgba(16,185,129,0.1)'
                          : 'rgba(99,102,241,0.08)',
                        transition: 'all 0.2s ease',
                        fontWeight: 700,
                      }}
                    >
                      {isCopied ? '✅ Copied!' : '📋 Copy'}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEdit(response)}
                      className="btn btn-muted"
                      style={{ padding: '7px 12px' }}
                    >
                      ✏️ Edit
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteConfirm(response)}
                      className="btn btn-muted"
                      style={{
                        padding: '7px 12px',
                        borderColor: 'var(--danger)',
                        color: 'var(--danger)',
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Response body preview */}
                <div
                  onClick={() => isLong && setExpandedId(isExpanded ? null : response.id)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: '0.88rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    cursor: isLong ? 'pointer' : 'default',
                    overflow: 'hidden',
                    maxHeight: isExpanded ? 'none' : '80px',
                    position: 'relative',
                  }}
                >
                  {response.body}
                  {isLong && !isExpanded && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0, left: 0, right: 0,
                      height: 36,
                      background: 'linear-gradient(transparent, rgba(15,15,26,0.95))',
                      borderRadius: '0 0 10px 10px',
                    }} />
                  )}
                </div>
                {isLong && (
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : response.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-light)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginTop: 6,
                      padding: 0,
                    }}
                  >
                    {isExpanded ? '▲ Show less' : '▼ Show more'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ===== STYLE HELPERS =====
const filterBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 10px',
  borderRadius: 999,
  background: 'rgba(99,102,241,0.14)',
  border: '1px solid rgba(99,102,241,0.3)',
  color: 'var(--primary-light)',
  fontSize: '0.78rem',
  fontWeight: 700,
};

const filterBadgeCloseStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'inherit',
  cursor: 'pointer',
  fontWeight: 900,
  padding: 0,
  fontSize: '0.85rem',
  lineHeight: 1,
};

export default CommonResponses;