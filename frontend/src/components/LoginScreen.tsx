import React, { useState } from 'react';
import { setupPassword, login } from '../api/api';

interface Props {
  hasPassword: boolean;
  onSuccess: () => void;
}

const LoginScreen: React.FC<Props> = ({ hasPassword, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      const result = hasPassword ? await login(password) : await setupPassword(password);
      localStorage.setItem('pr_token', result.token);
      onSuccess();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, rgba(99,102,241,0.35), transparent 35%), radial-gradient(circle at bottom right, rgba(236,72,153,0.22), transparent 35%), linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 440,
          width: '100%',
          boxShadow: '0 0 70px rgba(99, 102, 241, 0.25)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Premium Lock / Face ID style graphic */}
        <div
          style={{
            width: 92,
            height: 92,
            borderRadius: 28,
            margin: '0 auto 18px',
            border: '2px solid rgba(255,255,255,0.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'linear-gradient(135deg, rgba(99,102,241,0.22), rgba(236,72,153,0.16))',
            boxShadow: '0 0 40px rgba(99,102,241,0.25)',
          }}
        >
          <div style={{ fontSize: '2.8rem' }}>
            {hasPassword ? '🔐' : '🧾'}
          </div>
        </div>

        <h1
          style={{ fontSize: '1.7rem', fontWeight: 900, marginBottom: 8 }}
          className="glow-text"
        >
          Personal Receipts
        </h1>

        <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
          {hasPassword
            ? 'Enter your passcode to unlock your private database'
            : 'Create a passcode to protect your private database'}
        </p>

        {hasPassword && (
          <div
            style={{
              margin: '0 auto 22px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            👁️ Face-ID style lock screen
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16, textAlign: 'left' }}>
            <label
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                marginBottom: 6,
                display: 'block',
              }}
            >
              {hasPassword ? 'Passcode' : 'Create Passcode'}
            </label>

            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter passcode..."
                autoFocus
                autoComplete={hasPassword ? 'current-password' : 'new-password'}
                style={{ paddingRight: 48 }}
              />

              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {!hasPassword && (
            <div style={{ marginBottom: 16, textAlign: 'left' }}>
              <label
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  marginBottom: 6,
                  display: 'block',
                }}
              >
                Confirm Passcode
              </label>

              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Confirm passcode..."
                autoComplete="new-password"
              />
            </div>
          )}

          {error && (
            <div
              style={{
                background: 'rgba(255,61,113,0.15)',
                color: 'var(--danger)',
                padding: '10px 14px',
                borderRadius: 10,
                marginBottom: 16,
                fontSize: '0.85rem',
                border: '1px solid rgba(255,61,113,0.25)',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '1rem',
              justifyContent: 'center',
            }}
          >
            {loading ? 'Please wait...' : hasPassword ? '🔓 Unlock' : '🔒 Set Passcode'}
          </button>
        </form>

        <p
          style={{
            marginTop: 18,
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
          }}
        >
          Your data stays protected behind your local passcode.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;