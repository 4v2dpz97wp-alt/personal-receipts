import React, { useState } from 'react';
import { changePassword } from '../api/api';

interface Props {
  onLogout: () => void;
}

const SettingsPage: React.FC<Props> = ({ onLogout }) => {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); setError('');
    if (newPass !== confirm) { setError('New passwords do not match'); return; }
    if (newPass.length < 4) { setError('Password must be at least 4 characters'); return; }
    setLoading(true);
    try {
      await changePassword(current, newPass);
      setMessage('✅ Password changed successfully!');
      setCurrent(''); setNewPass(''); setConfirm('');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to change password');
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    if (window.confirm('Log out? You will need your password to get back in.')) {
      localStorage.removeItem('pr_token');
      onLogout();
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 24 }}>⚙️ Settings</h1>

      {/* Change Password */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>🔒 Change Password</div>
        <form onSubmit={handleChangePassword}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Current Password</label>
            <input type="password" value={current} onChange={e => setCurrent(e.target.value)} style={inputStyle} placeholder="Current password" />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>New Password</label>
            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} style={inputStyle} placeholder="New password (min 4 chars)" />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Confirm New Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} style={inputStyle} placeholder="Confirm new password" />
          </div>
          {error && <div style={{ background: '#fff0f0', color: '#ff6b6b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>{error}</div>}
          {message && <div style={{ background: '#f0fff8', color: '#00b894', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>{message}</div>}
          <button type="submit" disabled={loading} style={btnPrimary}>
            {loading ? 'Saving...' : '🔒 Change Password'}
          </button>
        </form>
      </div>

      {/* Logout */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>🚪 Session</div>
        <p style={{ color: '#636e72', marginBottom: 16 }}>You are currently logged in. Click below to lock the app.</p>
        <button onClick={handleLogout} style={btnDanger}>🔒 Lock App</button>
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 28, marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' };
const sectionTitleStyle: React.CSSProperties = { fontSize: '1rem', fontWeight: 700, color: '#6C5CE7', marginBottom: 20, paddingBottom: 10, borderBottom: '2px solid #f0f0f5' };
const formGroupStyle: React.CSSProperties = { marginBottom: 16 };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#2d3436', marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '2px solid #dfe6e9', borderRadius: 8, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' };
const btnPrimary: React.CSSProperties = { background: '#6C5CE7', color: '#fff', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600 };
const btnDanger: React.CSSProperties = { background: '#ff6b6b', color: '#fff', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600 };

export default SettingsPage;
