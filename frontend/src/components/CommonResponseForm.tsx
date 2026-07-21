import React, { useState, useEffect } from 'react';
import { createCommonResponse, updateCommonResponse } from '../api/api';

interface CommonResponse {
  id: number;
  title: string;
  category: string;
  body: string;
  is_favorite: number;
}

interface Props {
  existing: CommonResponse | null;
  categories: string[];
  onSave: () => void;
  onCancel: () => void;
}

const CommonResponseForm: React.FC<Props> = ({
  existing,
  categories,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [newCategory, setNewCategory] = useState('');
  const [body, setBody] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});

  // Pre-fill when editing
  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setCategory(existing.category);
      setBody(existing.body);
      setIsFavorite(existing.is_favorite === 1);
    }
  }, [existing]);

  const validate = () => {
    const e: { title?: string; body?: string } = {};
    if (!title.trim()) e.title = 'Title is required.';
    if (!body.trim()) e.body = 'Response text is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalCategory = newCategory.trim() || category;

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        category: finalCategory,
        body: body.trim(),
        is_favorite: isFavorite,
      };

      if (existing) {
        await updateCommonResponse(existing.id, payload);
      } else {
        await createCommonResponse(payload);
      }

      onSave();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const charCount = body.length;
  const charColor =
    charCount > 1800 ? 'var(--danger)'
    : charCount > 1400 ? '#fbbf24'
    : 'var(--text-muted)';

  return (
    <div className="card" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
      }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          {existing ? '✏️ Edit Response' : '➕ New Response'}
        </div>
        <button onClick={onCancel} className="btn btn-muted" style={{ padding: '6px 12px' }}>
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Title */}
        <div>
          <label style={labelStyle}>Title *</label>
          <input
            type="text"
            value={title}
            onChange={e => { setTitle(e.target.value); setErrors(er => ({ ...er, title: undefined })); }}
            placeholder="e.g., Casual Greeting, Thank You"
            maxLength={100}
            autoFocus
          />
          {errors.title && (
            <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: 4 }}>
              {errors.title}
            </div>
          )}
        </div>

        {/* Category row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              disabled={!!newCategory.trim()}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.12)',
                background: newCategory.trim()
                  ? 'rgba(255,255,255,0.02)'
                  : 'rgba(255,255,255,0.06)',
                color: newCategory.trim() ? 'var(--text-muted)' : 'inherit',
                fontSize: '0.9rem',
                cursor: newCategory.trim() ? 'not-allowed' : 'pointer',
                opacity: newCategory.trim() ? 0.5 : 1,
              }}
            >
              <option value="General">General</option>
              {categories
                .filter(c => c !== 'General')
                .map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Or New Category</label>
            <input
              type="text"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              placeholder="Create new..."
              maxLength={50}
            />
            {newCategory.trim() && (
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--accent)',
                marginTop: 4,
                fontWeight: 600,
              }}>
                Will create category: "{newCategory.trim()}"
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
          }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Response Text *</label>
            <span style={{ fontSize: '0.75rem', color: charColor, fontWeight: 700 }}>
              {charCount} / 2000
            </span>
          </div>
          <textarea
            value={body}
            onChange={e => { setBody(e.target.value); setErrors(er => ({ ...er, body: undefined })); }}
            placeholder="Type your response here..."
            maxLength={2000}
            rows={6}
            style={{ resize: 'vertical', lineHeight: 1.6 }}
          />
          {errors.body && (
            <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: 4 }}>
              {errors.body}
            </div>
          )}
        </div>

        {/* Live preview */}
        {body.trim() && (
          <div>
            <label style={labelStyle}>💬 Preview</label>
            <div style={{
              padding: '12px 16px',
              borderRadius: 12,
              borderBottomLeftRadius: 4,
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.25)',
              fontSize: '0.88rem',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {body}
            </div>
          </div>
        )}

        {/* Favorite checkbox */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          borderRadius: 10,
          background: isFavorite ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)',
          border: isFavorite ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(255,255,255,0.08)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
          onClick={() => setIsFavorite(f => !f)}
        >
          <input
            type="checkbox"
            checked={isFavorite}
            onChange={() => setIsFavorite(f => !f)}
            onClick={e => e.stopPropagation()}
            style={{ width: 18, height: 18, cursor: 'pointer' }}
          />
          <span style={{
            fontWeight: 700,
            fontSize: '0.9rem',
            color: isFavorite ? '#fbbf24' : 'var(--text-muted)',
          }}>
            ⭐ Mark as Favorite
          </span>
          {isFavorite && (
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginLeft: 'auto',
            }}>
              Will appear on Dashboard
            </span>
          )}
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: 10,
          paddingTop: 4,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          marginTop: 4,
        }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ flex: 1 }}
          >
            {saving
              ? 'Saving...'
              : existing
                ? '💾 Update Response'
                : '✅ Create Response'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-muted"
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  marginBottom: 6,
  display: 'block',
};

export default CommonResponseForm;
