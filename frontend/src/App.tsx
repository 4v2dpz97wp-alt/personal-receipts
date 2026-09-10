import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// @ts-ignore
import './index.css';
// @ts-ignore
import './styles/buttons.css';
// @ts-ignore
import './styles/cards.css';
// @ts-ignore
import './styles/tables.css';
// @ts-ignore
import './styles/responsive.css';

import Layout from './components/Layout';
import ConversationDetail from './components/ConversationDetail';
import Dashboard from './components/Dashboard';
import ContactsTable from './components/ContactsTable';
import ContactForm from './components/ContactForm';
import ContactProfile from './components/ContactProfile';
import ConversationsTable from './components/ConversationsTable';
import ConversationForm from './components/ConversationForm';
import BirthdaysPage from './components/BirthdaysPage';
import TagsManager from './components/TagsManager';
import SettingsPage from './components/SettingsPage';
import LoginScreen from './components/LoginScreen';
import RemindersPage from './components/RemindersPage';
import CommonResponses from './components/CommonResponses';

import { checkAuthStatus, verifyToken, getDueReminders } from './api/api';
import { useAutoLock } from './hooks/useAutoLock';

const LOCK_TIMEOUT_KEY = 'pr_lock_timeout';

/* ═══════════════════════════════════════════════════════
   Wrap every page in Layout so children renders correctly
   ═══════════════════════════════════════════════════════ */
const WithLayout: React.FC<{
  children: React.ReactNode;
  onLogout: () => void;
}> = ({ children, onLogout }) => (
  <Layout onLogout={onLogout}>{children}</Layout>
);

const App: React.FC = () => {
  const [authState, setAuthState] = useState<
    'loading' | 'no-password' | 'locked' | 'unlocked'
  >('loading');
  const [hasPassword, setHasPassword] = useState(false);
  const [lockTimeout, setLockTimeout] = useState<number>(() => {
    const saved = localStorage.getItem(LOCK_TIMEOUT_KEY);
    return saved ? parseInt(saved) : 5;
  });

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const status = await checkAuthStatus();
      setHasPassword(status.hasPassword);

      if (!status.hasPassword) {
        setAuthState('no-password');
        return;
      }

      const token = localStorage.getItem('pr_token');
      if (!token) {
        setAuthState('locked');
        return;
      }

      try {
        await verifyToken();
        setAuthState('unlocked');
      } catch {
        localStorage.removeItem('pr_token');
        setAuthState('locked');
      }
    } catch (e) {
      console.error(e);
      setAuthState('unlocked');
    }
  };

  const handleLock = () => {
    localStorage.removeItem('pr_token');
    setAuthState('locked');
  };

  const handleTimeoutChange = (minutes: number) => {
    setLockTimeout(minutes);
    localStorage.setItem(LOCK_TIMEOUT_KEY, String(minutes));
  };

  useAutoLock({
    timeoutMinutes: lockTimeout,
    onLock: handleLock,
    enabled: authState === 'unlocked' && hasPassword && lockTimeout > 0,
  });

  const handleAuthSuccess = () => setAuthState('unlocked');

  useEffect(() => {
    if (authState !== 'unlocked') return;
    if (!('Notification' in window)) return;

    const checkDue = async () => {
      try {
        const due = await getDueReminders();
        const seen = JSON.parse(
          localStorage.getItem('pr_notified_reminders') || '[]'
        ) as number[];

        let changed = false;
        for (const r of due) {
          if (!seen.includes(r.id)) {
            changed = true;
            seen.push(r.id);
            if (Notification.permission === 'granted') {
              new Notification(r.title, {
                body: r.primary_username
                  ? `Reminder for ${r.primary_username} • due ${new Date(r.due_at).toLocaleString()}`
                  : `Due ${new Date(r.due_at).toLocaleString()}`,
              });
            }
          }
        }

        if (changed) {
          localStorage.setItem(
            'pr_notified_reminders',
            JSON.stringify(seen.slice(-200))
          );
        }
      } catch (e) {
        console.error('Reminder notification check failed:', e);
      }
    };

    checkDue();
    const interval = window.setInterval(checkDue, 60000);
    return () => window.clearInterval(interval);
  }, [authState]);

  if (authState === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a1a2e',
          color: '#fff',
          fontSize: '1.2rem',
        }}
      >
        🧾 Loading Personal Receipts...
      </div>
    );
  }

  if (authState === 'no-password' || authState === 'locked') {
    return (
      <LoginScreen hasPassword={hasPassword} onSuccess={handleAuthSuccess} />
    );
  }

  return (
    // ✅ Added future flags to fix React Router warnings
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* ── Contacts ── */}
        <Route
          path="/contacts"
          element={
            <WithLayout onLogout={handleLock}>
              <ContactsTable />
            </WithLayout>
          }
        />
        <Route
          path="/contacts/new"
          element={
            <WithLayout onLogout={handleLock}>
              <ContactForm />
            </WithLayout>
          }
        />
        <Route
          path="/contacts/:id"
          element={
            <WithLayout onLogout={handleLock}>
              <ContactProfile />
            </WithLayout>
          }
        />
        <Route
          path="/contacts/:id/edit"
          element={
            <WithLayout onLogout={handleLock}>
              <ContactForm />
            </WithLayout>
          }
        />

        {/* ── Conversations ── */}
        <Route
          path="/conversations"
          element={
            <WithLayout onLogout={handleLock}>
              <ConversationsTable />
            </WithLayout>
          }
        />
        <Route
          path="/conversations/new"
          element={
            <WithLayout onLogout={handleLock}>
              <ConversationForm />
            </WithLayout>
          }
        />
        <Route
          path="/conversations/:id"
          element={
            <WithLayout onLogout={handleLock}>
              <ConversationDetail />
            </WithLayout>
          }
        />
        <Route
          path="/conversations/:id/edit"
          element={
            <WithLayout onLogout={handleLock}>
              <ConversationForm />
            </WithLayout>
          }
        />

        {/* ── Other pages ── */}
        <Route
          path="/birthdays"
          element={
            <WithLayout onLogout={handleLock}>
              <BirthdaysPage />
            </WithLayout>
          }
        />
        <Route
          path="/tags"
          element={
            <WithLayout onLogout={handleLock}>
              <TagsManager />
            </WithLayout>
          }
        />
        <Route
          path="/reminders"
          element={
            <WithLayout onLogout={handleLock}>
              <RemindersPage />
            </WithLayout>
          }
        />
        <Route
          path="/responses"
          element={
            <WithLayout onLogout={handleLock}>
              <CommonResponses />
            </WithLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <WithLayout onLogout={handleLock}>
              <SettingsPage
                onLogout={handleLock}
                lockTimeout={lockTimeout}
                onTimeoutChange={handleTimeoutChange}
              />
            </WithLayout>
          }
        />

        {/* ── Dashboard / catch-all ── */}
        <Route
          path="/"
          element={
            <WithLayout onLogout={handleLock}>
              <Dashboard />
            </WithLayout>
          }
        />
        <Route
          path="*"
          element={
            <WithLayout onLogout={handleLock}>
              <Dashboard />
            </WithLayout>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;