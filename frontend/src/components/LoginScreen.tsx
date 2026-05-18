import React, { useState } from 'react';
import { setupPassword, login } from '../api/api';

interface Props {
  hasPassword: boolean;
  onSuccess: () => void;
}

const LoginScreen: React.FC<Props> = ({ hasPassword, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!hasPassword && password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (hasPassword) {
        result = await login(password);
      } else {
        result = await setupPassword(password);
      }
      localStorage.setItem('pr_token', result.token);
      onSuccess();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 40, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🧾</div>
          <h1 style={{ fontSize: '1.8rem', color: '#2d3436', marginBottom: 8 }}>Personal Receipts</h1>
          <p style={{ color: '#636e72', fontSize: '0.95rem' }}>
            {hasPassword ? 'Enter your password to continue' : 'Set up a password to protect your data'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              {hasPassword ? 'Password' : 'Create Password'}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password..."
              style={inputStyle}
              autoFocus
            />
          </div>

          {!hasPassword && (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Confirm password..."
                style={inputStyle}
              />
            </div>
          )}

          {error && (
            <div style={{ background: '#fff0f0', color: '#ff6b6b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.9rem', border: '1px solid #ffcdd2' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: '100%', background: '#6C5CE7', color: '#fff', padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>
            {loading ? 'Please wait...' : hasPassword ? '🔓 Unlock' : '🔒 Set Password & Enter'}
          </button>
        </form>

        {!hasPassword && (
          <p style={{ textAlign: 'center', color: '#b2bec3', fontSize: '0.8rem', marginTop: 16 }}>
            Your password is stored locally and encrypted.
          </p>
        )}
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#2d3436', marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', border: '2px solid #dfe6e9', borderRadius: 8, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' };

export default LoginScreen;
