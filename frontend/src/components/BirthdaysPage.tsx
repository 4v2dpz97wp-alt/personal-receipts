import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUpcomingBirthdays } from '../api/api';

const BirthdaysPage: React.FC = () => {
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setBirthdays(await getUpcomingBirthdays()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }} className="glow-text">🎂 Birthdays</h1>

      {birthdays.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎂</div>
          <h3>No birthdays found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Add dates of birth to your contacts.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {birthdays.map(b => (
            <Link key={b.id} to={`/contacts/${b.id}`} className="neon-card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16 }}>
              <div className="avatar-placeholder" style={{ width: 50, height: 50, fontSize: '1.2rem', flexShrink: 0 }}>
                {b.primary_username.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--text)' }}>{b.primary_username}</div>
                {b.real_name && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{b.real_name}</div>}
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
                  Turning {b.turning_age} on {new Date(b.next_birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div className="flag" style={{
                background: b.days_until === 0 ? 'rgba(255,61,113,0.2)' : b.days_until <= 7 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
                color: b.days_until === 0 ? 'var(--danger)' : b.days_until <= 7 ? 'var(--warning)' : 'var(--text-muted)',
                fontWeight: 700,
              }}>
                {b.days_until === 0 ? '🎂 TODAY!' : `${b.days_until}d`}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default BirthdaysPage;