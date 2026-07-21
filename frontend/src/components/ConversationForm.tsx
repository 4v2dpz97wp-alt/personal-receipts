import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Select from 'react-select';
import {
  createConversation,
  updateConversation,
  getConversation,
  getContactLookups,
  uploadConversationDocuments,
  deleteConversationDocument,
  getTags,
  getConversationTags,
  setConversationTags,
} from '../api/api';
import { CONVERSATION_APPS } from '../types';

const ConversationForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);

  const [form, setForm] = useState({
    subject: '',
    primary_contact_id: null as number | null,
    date_time: new Date().toISOString().slice(0, 16),
    application: '',
    location: '',
    conversation_summary: '',
    additional_contact_ids: [] as number[],
  });

  const [contacts, setContacts] = useState<any[]>([]);
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [existingDocs, setExistingDocs] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  const [allTags, setAllTags] = useState<any[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  useEffect(() => {
    loadContacts();
    loadAllTags();

    const contactParam = searchParams.get('contact');
    if (contactParam) setForm(prev => ({ ...prev, primary_contact_id: parseInt(contactParam) }));
    if (isEditing && id) loadConversation(parseInt(id));
  }, [id]);

  const loadContacts = async () => {
    try { setContacts(await getContactLookups()); }
    catch (e) { console.error(e); }
  };

  const loadAllTags = async () => {
    try {
      const tags = await getTags();
      setAllTags(Array.isArray(tags) ? tags : []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadConversation = async (convId: number) => {
    try {
      const conv = await getConversation(convId);
      setForm({
        subject: conv.subject,
        primary_contact_id: conv.primary_contact_id,
        date_time: conv.date_time.slice(0, 16),
        application: conv.application,
        location: conv.location || '',
        conversation_summary: conv.conversation_summary || '',
        additional_contact_ids: conv.participants?.map((p: any) => p.contact_id) || [],
      });
      setExistingDocs(conv.documents || []);

      try {
        const convTags = await getConversationTags(convId);
        const ids = Array.isArray(convTags)
          ? convTags.map((t: any) => (typeof t === 'number' ? t : t.id)).filter(Boolean)
          : [];
        setSelectedTagIds(ids);
      } catch (e) {
        console.error(e);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoc = async (docId: number) => {
    if (!id || !window.confirm('Delete this document?')) return;
    try {
      await deleteConversationDocument(parseInt(id), docId);
      setExistingDocs(prev => prev.filter(d => d.id !== docId));
    } catch (e) { alert('Failed to delete document'); }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type?.startsWith('image/')) return '🖼️';
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('word') || type?.includes('document')) return '📝';
    if (type?.includes('sheet') || type?.includes('csv') || type?.includes('excel')) return '📊';
    if (type?.startsWith('video/')) return '🎬';
    if (type?.startsWith('audio/')) return '🎵';
    return '📎';
  };

  const handleToggleTag = (tagId: number) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(x => x !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.subject || !form.primary_contact_id || !form.application) {
      alert('Subject, Contact, and Application are required.');
      return;
    }

    setSaving(true);
    try {
      let convId: number;

      if (isEditing && id) {
        await updateConversation(parseInt(id), form);
        convId = parseInt(id);
      } else {
        const conv = await createConversation(form);
        convId = conv.id;
      }

      // Save tags
      await setConversationTags(convId, selectedTagIds);

      if (docFiles.length > 0) {
        await uploadConversationDocuments(convId, docFiles);
      }

      navigate('/conversations');
    } catch (e) {
      console.error(e);
      alert('Error saving. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const contactOptions = contacts.map(c => ({
    value: c.id,
    label: c.primary_username,
    pic: c.profile_picture
  }));

  const formatContactOption = (option: any) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {option.pic ? (
        <img src={option.pic} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#a29bfe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
          {option.label?.charAt(0).toUpperCase()}
        </div>
      )}
      <span>{option.label}</span>
    </div>
  );

  if (loading) return <div style={loadingStyle}>Loading...</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 24 }}>{isEditing ? '✏️ Edit Communication' : '💬 New Communication'}</h1>

      <form onSubmit={handleSubmit}>

        {/* Details */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>📝 Details</div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Subject *</label>
            <input
              type="text"
              value={form.subject}
              onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
              placeholder="What was this about?"
              style={inputStyle}
              required
            />
          </div>

          <div style={rowStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Contact *</label>
              <Select
                options={contactOptions}
                value={contactOptions.find(opt => opt.value === form.primary_contact_id) || null}
                onChange={(selected: any) => setForm(p => ({ ...p, primary_contact_id: selected?.value || null }))}
                formatOptionLabel={formatContactOption}
                placeholder="Search for a contact..."
                isClearable
                styles={selectStyles}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Date & Time</label>
              <input
                type="datetime-local"
                value={form.date_time}
                onChange={e => setForm(p => ({ ...p, date_time: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={rowStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Application *</label>
              <select
                value={form.application}
                onChange={e => setForm(p => ({ ...p, application: e.target.value }))}
                style={inputStyle}
                required
              >
                <option value="">Select app...</option>
                {CONVERSATION_APPS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {form.application === 'In Person' && (
              <div style={formGroupStyle}>
                <label style={labelStyle}>Where?</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="Location"
                  style={inputStyle}
                />
              </div>
            )}
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Summary</label>
            <textarea
              value={form.conversation_summary}
              onChange={e => setForm(p => ({ ...p, conversation_summary: e.target.value }))}
              placeholder="What was discussed?"
              style={{ ...inputStyle, minHeight: 120, resize: 'vertical' } as any}
            />
          </div>
        </div>

        {/* Tags */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>🏷️ Tags</div>

          {allTags.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No tags yet. Create tags on the <a href="/tags" style={{ color: '#6C5CE7' }}>Tags page</a>.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {allTags.map(tag => {
                const active = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleToggleTag(tag.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 999,
                      border: active ? `2px solid ${tag.color}` : '2px solid #dfe6e9',
                      background: active ? `${tag.color}22` : 'transparent',
                      color: active ? tag.color : '#636e72',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {active ? '✓ ' : ''}{tag.name}
                  </button>
                );
              })}
            </div>
          )}

          {selectedTagIds.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {allTags
                .filter(t => selectedTagIds.includes(t.id))
                .map(t => (
                  <span
                    key={t.id}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 999,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      background: `${t.color}22`,
                      color: t.color,
                      border: `1px solid ${t.color}55`,
                    }}
                  >
                    {t.name}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Additional Contacts */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>👥 Additional Contacts</div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Others in this conversation</label>
            <Select
              isMulti
              options={contactOptions.filter(opt => opt.value !== form.primary_contact_id)}
              value={contactOptions.filter(opt => form.additional_contact_ids.includes(opt.value))}
              onChange={(selected: any) => setForm(p => ({
                ...p,
                additional_contact_ids: selected ? selected.map((s: any) => s.value) : []
              }))}
              formatOptionLabel={formatContactOption}
              placeholder="Search and select additional contacts..."
              styles={selectStyles}
            />
          </div>
        </div>

        {/* Documents */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>📎 Documents & Attachments</div>

          {existingDocs.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Existing Files</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {existingDocs.map(doc => (
                  <div
                    key={doc.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f5f6fa', borderRadius: 8 }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{getFileIcon(doc.file_type)}</span>
                    <div style={{ flex: 1 }}>
                      <a
                        href={doc.file_path}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#6C5CE7', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}
                      >
                        {doc.file_name}
                      </a>
                      {doc.file_size && (
                        <span style={{ color: '#b2bec3', fontSize: '0.75rem', marginLeft: 8 }}>
                          {formatFileSize(doc.file_size)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteDoc(doc.id)}
                      style={{ background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={formGroupStyle}>
            <label style={labelStyle}>Upload Files</label>
            <div
              style={{
                border: '2px dashed #dfe6e9',
                borderRadius: 8,
                padding: 20,
                textAlign: 'center',
                cursor: 'pointer',
                background: '#fafafa'
              }}
            >
              <input
                type="file"
                multiple
                onChange={e => setDocFiles(e.target.files ? Array.from(e.target.files) : [])}
                style={{ display: 'none' }}
                id="doc-upload"
              />
              <label htmlFor="doc-upload" style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>📁</div>
                <p style={{ color: '#636e72', fontWeight: 600, margin: 0 }}>Click to select files</p>
                <p style={{ color: '#b2bec3', fontSize: '0.8rem', margin: '4px 0 0' }}>
                  PDF, Word, Excel, Images, Video, Audio (max 50MB each)
                </p>
              </label>
            </div>

            {docFiles.length > 0 && (
              <div style={{ marginTop: 10 }}>
                {docFiles.map((file, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: '0.85rem' }}
                  >
                    <span>{getFileIcon(file.type)}</span>
                    <span style={{ flex: 1, fontWeight: 500 }}>{file.name}</span>
                    <span style={{ color: '#b2bec3' }}>{formatFileSize(file.size)}</span>
                    <button
                      type="button"
                      onClick={() => setDocFiles(prev => prev.filter((_, idx) => idx !== i))}
                      style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontWeight: 700 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginBottom: 32 }}>
          <button type="button" onClick={() => navigate(-1)} style={btnSecondary}>Cancel</button>
          <button type="submit" disabled={saving} style={btnPrimary}>
            {saving ? 'Saving...' : isEditing ? 'Update' : 'Save Communication'}
          </button>
        </div>
      </form>
    </div>
  );
};

const selectStyles = {
  control: (base: any) => ({
    ...base,
    borderRadius: 8,
    border: '2px solid #dfe6e9',
    minHeight: 42,
    boxShadow: 'none',
    '&:hover': { borderColor: '#6C5CE7' }
  }),
  multiValue: (base: any) => ({ ...base, borderRadius: 16, background: '#f0f0f5' }),
  option: (base: any, state: any) => ({
    ...base,
    background: state.isFocused ? '#f0f0f5' : '#fff',
    color: '#2d3436',
    cursor: 'pointer'
  }),
};

const sectionStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  padding: 28,
  marginBottom: 24,
  boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 700,
  color: '#6C5CE7',
  marginBottom: 20,
  paddingBottom: 10,
  borderBottom: '2px solid #f0f0f5'
};

const formGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  flex: 1,
  marginBottom: 8
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  marginBottom: 16,
  flexWrap: 'wrap'
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#2d3436'
};

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  border: '2px solid #dfe6e9',
  borderRadius: 8,
  fontSize: '0.9rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box'
};

const loadingStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 48,
  color: '#636e72'
};

const btnPrimary: React.CSSProperties = {
  background: '#6C5CE7',
  color: '#fff',
  padding: '10px 24px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.9rem'
};

const btnSecondary: React.CSSProperties = {
  background: '#636e72',
  color: '#fff',
  padding: '10px 24px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.9rem'
};

export default ConversationForm;