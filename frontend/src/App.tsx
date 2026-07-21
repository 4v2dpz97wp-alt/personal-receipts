import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// @ts-ignore: allow side-effect CSS imports without type declarations
import './index.css';
// @ts-ignore: allow side-effect CSS imports without type declarations
import './styles/buttons.css';
// @ts-ignore: allow side-effect CSS imports without type declarations
import './styles/cards.css';
// @ts-ignore: allow side-effect CSS imports without type declarations
import './styles/tables.css';
// @ts-ignore: allow side-effect CSS imports without type declarations
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

const App: React.FC = () => {
  const [authState, setAuthState] = useState<'loading' | 'no-password' | 'locked' | 'unlocked'>('loading');
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
  // Reminder notifications
  useEffect(() => {
    if (authState !== 'unlocked') return;
    if (!('Notification' in window)) return;

    const checkDue = async () => {
      try {
        const due = await getDueReminders();
        const seen = JSON.parse(localStorage.getItem('pr_notified_reminders') || '[]') as number[];

        let changed = false;

        for (const r of due) {
          if (!seen.includes(r.id)) {
            changed = true;
            seen.push(r.id);

            if (Notification.permission === 'granted') {
              new Notification(r.title, {
                body: r.primary_username
                  ? `Reminder for ${r.primary_username} • due ${new Date(r.due_at).toLocaleString()}`
                  : `Due ${new Date(r.due_at).toLocaleString()}`
              });
            }
          }
        }

        if (changed) {
          localStorage.setItem('pr_notified_reminders', JSON.stringify(seen.slice(-200)));
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
          fontSize: '1.2rem'
        }}
      >
        🧾 Loading Personal Receipts...
      </div>
    );
  }

  if (authState === 'no-password' || authState === 'locked') {
    return <LoginScreen hasPassword={hasPassword} onSuccess={handleAuthSuccess} />;
  }

  return (
    <Router>
      <Layout onLogout={handleLock}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/contacts" element={<ContactsTable />} />
          <Route path="/contacts/new" element={<ContactForm />} />
          <Route path="/contacts/:id" element={<ContactProfile />} />
          <Route path="/contacts/:id/edit" element={<ContactForm />} />
          <Route path="/conversations/:id" element={<ConversationDetail />} />
          <Route path="/conversations" element={<ConversationsTable />} />
          <Route path="/conversations/new" element={<ConversationForm />} />
          <Route path="/conversations/:id/edit" element={<ConversationForm />} />
          <Route path="/birthdays" element={<BirthdaysPage />} />
          <Route path="/conversations/:id" element={<ConversationDetail />} />
          <Route path="/tags" element={<TagsManager />} />
          <Route path="/reminders" element={<RemindersPage />} />
          <Route path="/responses" element={<CommonResponses />} />
          <Route
            path="/settings"
            element={
              <SettingsPage
                onLogout={handleLock}
                lockTimeout={lockTimeout}
                onTimeoutChange={handleTimeoutChange}
              />
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;