import React, { useState, useEffect } from 'react';
import { getTags, createTag, updateTag, deleteTag } from '../api/api';

const PRESET_COLORS = [
  '#6C5CE7', '#00B894', '#0984E3', '#E17055',
  '#A855F7', '#FDCB6E', '#FF6B6B', '#00CEC9',
  '#636E72', '#FD79A8', '#55EFC4', '#74B9FF'
];

const TagsManager: React.FC = () => {
  const [tags, setTags] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6C5CE7');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setTags(await getTags()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const tag = await createTag(newName.trim(), newColor);
      setTags(prev => [...prev, tag]);
      setNewName('');
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to create tag');
    }
  };

  const handleEdit = (tag: any) => {
    setEditId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const handleUpdate = async () => {
    if (!editId) return;
    try {
      const updated = await updateTag(editId, editName, editColor);
      setTags(prev => prev.map(t => t.id === editId ? updated : t));
      setEditId(null);
    } catch (e) { alert('Failed to update tag'); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete tag "${name}"? It will be removed from all contacts.`)) return;
    try {
      await deleteTag(id);
      setTags(prev => prev.filter(t => t.id !== id));
    } catch (e) { alert('Failed to delete tag'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}>Loading tags...</div>;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 24 }}>🏷️ Tags & Categories</h1>

      {/* Create Tag */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>Create New Tag</div>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={labelStyle}>Tag Name</label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Close Friend, Online Only..."
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Color</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {PRESET_COLORS.map(color => (
                <button key={color} type="button" onClick={() => setNewColor(color)}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: color, border: newColor === color ? '3px solid #2d3436' : '3px solid transparent', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
          <button type="submit" style={btnPrimary}>➕ Create Tag</button>
        </form>
      </div>

      {/* Tags List */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>All Tags ({tags.length})</div>
        {tags.length === 0 ? (
          <p style={{ color: '#636e72', textAlign: 'center', padding: 24 }}>No tags yet. Create your first tag above.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tags.map(tag => (
              <div key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#f5f6fa', borderRadius: 10 }}>
                {editId === tag.id ? (
                  <>
                    <input value={editName} onChange={e => setEditName(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                    <div style={{ display: 'flex', gap: 4 }}>
                      {PRESET_COLORS.map(color => (
                        <button key={color} type="button" onClick={() => setEditColor(color)}
                          style={{ width: 22, height: 22, borderRadius: '50%', background: color, border: editColor === color ? '2px solid #2d3436' : '2px solid transparent', cursor: 'pointer' }} />
                      ))}
                    </div>
                    <button onClick={handleUpdate} style={btnSuccess}>Save</button>
                    <button onClick={() => setEditId(null)} style={btnSecondary}>Cancel</button>
                  </>
                ) : (
                  <>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: tag.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontWeight: 600, color: '#2d3436' }}>{tag.name}</span>
                    <span style={{ background: tag.color + '22', color: tag.color, padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>{tag.name}</span>
                    <button onClick={() => handleEdit(tag)} style={btnSecondary}>✏️</button>
                    <button onClick={() => handleDelete(tag.id, tag.name)} style={btnDanger}>🗑️</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 28, marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' };
const sectionTitleStyle: React.CSSProperties = { fontSize: '1rem', fontWeight: 700, color: '#6C5CE7', marginBottom: 20, paddingBottom: 10, borderBottom: '2px solid #f0f0f5' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#2d3436', marginBottom: 6 };
const inputStyle: React.CSSProperties = { padding: '10px 14px', border: '2px solid #dfe6e9', borderRadius: 8, fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' };
const btnPrimary: React.CSSProperties = { background: '#6C5CE7', color: '#fff', padding: '10px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' };
const btnSecondary: React.CSSProperties = { background: '#636e72', color: '#fff', padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' };
const btnSuccess: React.CSSProperties = { background: '#00b894', color: '#fff', padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' };
const btnDanger: React.CSSProperties = { background: '#ff6b6b', color: '#fff', padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' };

export default TagsManager;
