import React, { useState, useEffect } from 'react';
import { getTags, createTag, deleteTag } from '../api/api';

const COLORS = ['#8b5cf6','#00e5ff','#10b981','#f59e0b','#ff3d71','#ec4899','#6366f1','#14b8a6','#f97316','#64748b'];

const TagsManager: React.FC = () => {
  const [tags, setTags] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#8b5cf6');
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
    } catch (e: any) { alert(e.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete tag "${name}"?`)) return;
    try { await deleteTag(id); setTags(prev => prev.filter(t => t.id !== id)); }
    catch (e) { alert('Failed'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }} className="glow-text">🏷️ Tags</h1>

      <div className="card">
        <div className="section-title">Create New Tag</div>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Name</label>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Tag name..." />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Color</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setNewColor(c)}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: newColor === c ? '3px solid #fff' : '3px solid transparent', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-primary">➕ Create</button>
        </form>
      </div>

      <div className="card">
        <div className="section-title">All Tags ({tags.length})</div>
        {tags.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>No tags yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tags.map(tag => (
              <div key={tag.id} className="neon-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: tag.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontWeight: 600 }}>{tag.name}</span>
                <span style={{ background: tag.color + '22', color: tag.color, padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>{tag.name}</span>
                <button onClick={() => handleDelete(tag.id, tag.name)} className="btn btn-danger" style={{ padding: '4px 10px' }}>🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagsManager;