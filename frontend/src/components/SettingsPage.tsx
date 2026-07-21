import React, { useRef, useState } from 'react';
import {
  changePassword,
  emergencyResetPassword,
  downloadBackup,
  restoreBackup
} from '../api/api';

interface Props {
  onLogout: () => void;
  lockTimeout: number;
  onTimeoutChange: (minutes: number) => void;
}

const TIMEOUT_OPTIONS = [
  { label: 'Never', value: 0 },
  { label: '1 minute', value: 1 },
  { label: '5 minutes', value: 5 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
];

const SettingsPage: React.FC<Props> = ({ onLogout, lockTimeout, onTimeoutChange }) => {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showEmergencyReset, setShowEmergencyReset] = useState(false);
  const [emergencyNew, setEmergencyNew] = useState('');
  const [emergencyConfirm, setEmergencyConfirm] = useState('');
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [emergencyError, setEmergencyError] = useState('');
  const [emergencyLoading, setEmergencyLoading] = useState(false);

  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPass !== confirm) {
      setError('Passwords do not match');
      return;
    }

    if (newPass.length < 4) {
      setError('Min 4 characters');
      return;
    }

    setLoading(true);
    try {
      await changePassword(current, newPass);
      setMessage('✅ Password changed!');
      setCurrent('');
      setNewPass('');
      setConfirm('');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmergencyMessage('');
    setEmergencyError('');

    if (emergencyNew !== emergencyConfirm) {
      setEmergencyError('Passwords do not match');
      return;
    }

    if (emergencyNew.length < 4) {
      setEmergencyError('Min 4 characters');
      return;
    }

    setEmergencyLoading(true);
    try {
      await emergencyResetPassword(emergencyNew);
      setEmergencyMessage('✅ Password has been reset!');
      setEmergencyNew('');
      setEmergencyConfirm('');
      setShowEmergencyReset(false);
    } catch (e: any) {
      setEmergencyError(e.response?.data?.error || 'Reset failed');
    } finally {
      setEmergencyLoading(false);
    }
  };

  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    try {
      const data = await downloadBackup();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personal-receipts-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Backup failed:', e);
      alert('Backup failed. Please try again.');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (!json?.version || !Array.isArray(json.contacts)) {
          setRestoreError('Invalid backup file. Please select a valid backup.');
          return;
        }
        setPendingRestore(json);
        setShowRestoreConfirm(true);
        setRestoreError('');
      } catch {
        setRestoreError('Could not read file. Make sure it is a valid JSON backup.');
      }
    };

    reader.readAsText(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestore) return;

    setRestoreLoading(true);
    setShowRestoreConfirm(false);

    try {
      await restoreBackup(pendingRestore);
      setRestoreMessage('✅ Restore complete! All data has been replaced.');
      setPendingRestore(null);
    } catch (e: any) {
      setRestoreError(e.response?.data?.error || 'Restore failed. Please try again.');
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }} className="glow-text">⚙️ Settings</h1>

      {/* Auto-Lock Timer */}
      <div className="card">
        <div className="section-title">⏱️ Auto-Lock Timer</div>
        <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: '0.9rem' }}>
          Automatically lock the app after a period of inactivity.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {TIMEOUT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onTimeoutChange(opt.value)}
              className={lockTimeout === opt.value ? 'btn btn-primary' : 'btn btn-muted'}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <p style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {lockTimeout > 0
            ? `🔐 App will lock after ${TIMEOUT_OPTIONS.find(o => o.value === lockTimeout)?.label} of inactivity`
            : '⚠️ Auto-lock is disabled'}
        </p>
      </div>

      {/* Change Password */}
      <div className="card">
        <div className="section-title">🔒 Change Password</div>

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Current Password</label>
            <input type="password" value={current} onChange={e => setCurrent(e.target.value)} placeholder="Current password" />
          </div>

          <div>
            <label style={labelStyle}>New Password</label>
            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password" />
          </div>

          <div>
            <label style={labelStyle}>Confirm</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm new password" />
          </div>

          {error && <Alert type="error">{error}</Alert>}
          {message && <Alert type="success">{message}</Alert>}

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Saving...' : '🔒 Change Password'}
          </button>
        </form>
      </div>

      {/* Emergency Reset */}
      <div className="card">
        <div className="section-title">🚨 Emergency Password Reset</div>
        <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: '0.9rem' }}>
          Forgot your password? Reset it here without needing the old one.
        </p>

        {!showEmergencyReset ? (
          <button onClick={() => setShowEmergencyReset(true)} className="btn btn-danger">
            🚨 Reset Password
          </button>
        ) : (
          <form onSubmit={handleEmergencyReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>New Password</label>
              <input type="password" value={emergencyNew} onChange={e => setEmergencyNew(e.target.value)} placeholder="New password" />
            </div>

            <div>
              <label style={labelStyle}>Confirm New Password</label>
              <input type="password" value={emergencyConfirm} onChange={e => setEmergencyConfirm(e.target.value)} placeholder="Confirm new password" />
            </div>

            {emergencyError && <Alert type="error">{emergencyError}</Alert>}
            {emergencyMessage && <Alert type="success">{emergencyMessage}</Alert>}

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" disabled={emergencyLoading} className="btn btn-danger">
                {emergencyLoading ? 'Resetting...' : '🚨 Confirm Reset'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowEmergencyReset(false);
                  setEmergencyError('');
                  setEmergencyMessage('');
                }}
                className="btn btn-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Backup & Restore */}
      <div className="card">
        <div className="section-title">💾 Backup & Restore</div>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: '0.9rem' }}>
          Export all your contacts, conversations, tags, reminders, and settings to a JSON file.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>📤 Export Backup</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
              Downloads a complete backup of all your data as a JSON file.
            </p>

            <button onClick={handleDownloadBackup} disabled={backupLoading} className="btn btn-primary">
              {backupLoading ? 'Preparing...' : '📥 Download Backup'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>📥 Restore from Backup</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
              ⚠️ Restoring will replace ALL current data. This cannot be undone.
            </p>

            {restoreError && <Alert type="error">{restoreError}</Alert>}
            {restoreMessage && <Alert type="success">{restoreMessage}</Alert>}

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleRestoreFileSelect}
              style={{ display: 'none' }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={restoreLoading}
              className="btn btn-danger"
            >
              {restoreLoading ? 'Restoring...' : '📂 Select Backup File'}
            </button>
          </div>
        </div>
      </div>

      {/* Restore Confirm Dialog */}
      {showRestoreConfirm && pendingRestore && (
        <div
          onClick={() => setShowRestoreConfirm(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 5000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{ maxWidth: 440, width: '100%' }}
          >
            <div className="section-title">⚠️ Confirm Restore</div>

            <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
              You are about to restore from a backup exported on:
            </p>

            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                marginBottom: 16,
                fontWeight: 700,
              }}
            >
              📅 {new Date(pendingRestore.exported_at).toLocaleString()}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginBottom: 20,
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
              }}
            >
              <div>👤 Contacts: <strong style={{ color: '#fff' }}>{pendingRestore.contacts?.length || 0}</strong></div>
              <div>💬 Conversations: <strong style={{ color: '#fff' }}>{pendingRestore.conversations?.length || 0}</strong></div>
              <div>🏷️ Tags: <strong style={{ color: '#fff' }}>{pendingRestore.tags?.length || 0}</strong></div>
              <div>⏰ Reminders: <strong style={{ color: '#fff' }}>{pendingRestore.reminders?.length || 0}</strong></div>
            </div>

            <p
              style={{
                color: 'var(--danger)',
                fontSize: '0.85rem',
                fontWeight: 700,
                marginBottom: 20,
              }}
            >
              ⚠️ All current data will be permanently replaced.
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleConfirmRestore} className="btn btn-danger" style={{ flex: 1 }}>
                ✅ Yes, Restore
              </button>
              <button
                onClick={() => {
                  setShowRestoreConfirm(false);
                  setPendingRestore(null);
                }}
                className="btn btn-muted"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session */}
      <div className="card">
        <div className="section-title">🚪 Session</div>
        <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
          Lock the app. You'll need your password to re-enter.
        </p>
        <button onClick={onLogout} className="btn btn-danger">
          🔒 Lock App Now
        </button>
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: 6,
  display: 'block'
};

const Alert: React.FC<{ type: 'success' | 'error'; children: React.ReactNode }> = ({ type, children }) => (
  <div
    style={{
      background: type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(255,61,113,0.15)',
      color: type === 'success' ? 'var(--success)' : 'var(--danger)',
      padding: '10px 14px',
      borderRadius: 10,
      fontSize: '0.85rem',
      border: `1px solid ${type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(255,61,113,0.3)'}`,
    }}
  >
    {children}
  </div>
);

export default SettingsPage;