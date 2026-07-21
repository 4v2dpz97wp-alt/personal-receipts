import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  createReminder,
  deleteReminder,
  getContactLookups,
  getReminders,
  setReminderComplete,
} from '../api/api';

const RemindersPage: React.FC = () => {
  const [reminders, setReminders] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [contactId, setContactId] = useState('');
  const [notify, setNotify] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [r, c] = await Promise.all([
        getReminders(),
        getContactLookups(),
      ]);

      setReminders(Array.isArray(r) ? r : []);
      setContacts(Array.isArray(c) ? c : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Title is required');
      return;
    }

    if (!dueAt) {
      alert('Due date/time is required');
      return;
    }

    try {
      const created = await createReminder({
        title,
        note,
        due_at: new Date(dueAt).toISOString(),
        contact_id: contactId ? Number(contactId) : null,
        notify,
      });

      setReminders(prev =>
        [...prev, created].sort(
          (a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
        )
      );

      setTitle('');
      setNote('');
      setDueAt('');
      setContactId('');
      setNotify(true);
    } catch (e) {
      console.error(e);
      alert('Failed to create reminder');
    }
  };

  const handleToggleComplete = async (reminder: any) => {
    try {
      const updated = await setReminderComplete(
        reminder.id,
        !(reminder.completed === 1 || reminder.completed === true)
      );

      setReminders(prev => prev.map(r => (r.id === reminder.id ? updated : r)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this reminder?')) return;

    try {
      await deleteReminder(id);
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const grouped = useMemo(() => {
    const now = new Date();

    const overdue = reminders.filter(r =>
      !(r.completed === 1 || r.completed === true) &&
      new Date(r.due_at).getTime() < now.getTime()
    );

    const upcoming = reminders.filter(r =>
      !(r.completed === 1 || r.completed === true) &&
      new Date(r.due_at).getTime() >= now.getTime()
    );

    const completed = reminders.filter(r => r.completed === 1 || r.completed === true);

    return { overdue, upcoming, completed };
  }, [reminders]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
        Loading reminders...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }} className="glow-text">⏰ Reminders</h1>
      </div>

      <div className="card">
        <div className="section-title">➕ Create Reminder</div>

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Reminder title"
            />
          </div>

          <div>
            <label style={labelStyle}>Note</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Optional note"
              style={{ minHeight: 90 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={labelStyle}>Due Date / Time</label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={e => setDueAt(e.target.value)}
              />
            </div>

            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={labelStyle}>Related Contact</label>
              <select value={contactId} onChange={e => setContactId(e.target.value)}>
                <option value="">No contact</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.primary_username}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={notify}
              onChange={e => setNotify(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>
              Enable notification
            </span>
          </label>

          <div>
            <button type="submit" className="btn btn-primary">
              ✅ Save Reminder
            </button>
          </div>
        </form>
      </div>

      <ReminderSection title="⚠️ Overdue" items={grouped.overdue} onToggleComplete={handleToggleComplete} onDelete={handleDelete} />
      <ReminderSection title="📅 Upcoming" items={grouped.upcoming} onToggleComplete={handleToggleComplete} onDelete={handleDelete} />
      <ReminderSection title="✅ Completed" items={grouped.completed} onToggleComplete={handleToggleComplete} onDelete={handleDelete} />
    </div>
  );
};

const ReminderSection: React.FC<{
  title: string;
  items: any[];
  onToggleComplete: (r: any) => void;
  onDelete: (id: number) => void;
}> = ({ title, items, onToggleComplete, onDelete }) => (
  <div className="card">
    <div className="section-title">{title}</div>

    {items.length === 0 ? (
      <div style={{ color: 'var(--text-muted)', padding: 12 }}>None</div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(r => (
          <div
            key={r.id}
            style={{
              padding: 14,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 900 }}>{r.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  ⏰ {new Date(r.due_at).toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => onToggleComplete(r)}
                  className={r.completed ? 'btn btn-muted' : 'btn btn-primary'}
                  style={{ padding: '6px 12px' }}
                >
                  {r.completed ? '↩ Undo' : '✅ Complete'}
                </button>

                <button
                  onClick={() => onDelete(r.id)}
                  className="btn btn-danger"
                  style={{ padding: '6px 12px' }}
                >
                  🗑️
                </button>
              </div>
            </div>

            {r.primary_username && (
              <div style={{ fontSize: '0.85rem' }}>
                🔗 <Link to={`/contacts/${r.contact_id}`} style={{ color: 'var(--accent)' }}>{r.primary_username}</Link>
              </div>
            )}

            {r.note && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                {r.note}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

const labelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  marginBottom: 6,
  display: 'block',
};

export default RemindersPage;