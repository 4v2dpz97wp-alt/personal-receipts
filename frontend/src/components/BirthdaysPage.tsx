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

  const getBadge = (days: number) => {
    if (days === 0) return { label: '🎂 TODAY!', bg: '#ff6348', color: '#fff' };
    if (days <= 7) return { label: `${days}d away`, bg: '#ff6b6b', color: '#fff' };
    if (days <= 30) return { label: `${days}d away`, bg: '#fdcb6e', color: '#2d3436' };
    return { label: `${days}d away`, bg: '#f0f0f5', color: '#636e72' };
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}>Loading birthdays...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>🎂 Birthday Reminders</h1>
      <p style={{ color: '#636e72', marginBottom: 24 }}>Upcoming birthdays from your contacts.</p>

      {birthdays.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 48, textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎂</div>
          <h3>No birthdays found</h3>
          <p style={{ color: '#636e72' }}>Add dates of birth to your contacts to see birthday reminders here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {birthdays.map(b => {
            const badge = getBadge(b.days_until);
            return (
              <Link key={b.id} to={`/contacts/${b.id}`} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 16 }}>
                {b.profile_picture ? (
                  <img src={b.profile_picture} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #a29bfe, #6C5CE7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.3rem', flexShrink: 0 }}>
                    {b.primary_username.charAt(0).toUpperCase()}
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#2d3436' }}>{b.primary_username}</div>
                  {b.real_name && <div style={{ color: '#636e72', fontSize: '0.85rem' }}>{b.real_name}</div>}
                  <div style={{ color: '#636e72', fontSize: '0.85rem', marginTop: 2 }}>
                    Turning {b.turning_age} on {new Date(b.next_birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                  </div>
                </div>

                <div style={{ background: badge.bg, color: badge.color, padding: '6px 14px', borderRadius: 20, fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  {badge.label}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BirthdaysPage;
