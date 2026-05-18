import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
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
import { checkAuthStatus, verifyToken } from './api/api';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<'loading' | 'no-password' | 'locked' | 'unlocked'>('loading');
  const [hasPassword, setHasPassword] = useState(false);

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
      if (!token) { setAuthState('locked'); return; }

      try {
        await verifyToken();
        setAuthState('unlocked');
      } catch {
        localStorage.removeItem('pr_token');
        setAuthState('locked');
      }
    } catch (e) {
      setAuthState('unlocked'); // If backend is down, skip auth
    }
  };

  const handleAuthSuccess = () => setAuthState('unlocked');
  const handleLogout = () => setAuthState('locked');

  if (authState === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e', color: '#fff', fontSize: '1.2rem' }}>
        🧾 Loading Personal Receipts...
      </div>
    );
  }

  if (authState === 'no-password' || authState === 'locked') {
    return <LoginScreen hasPassword={hasPassword} onSuccess={handleAuthSuccess} />;
  }

  return (
    <Router>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/contacts" element={<ContactsTable />} />
          <Route path="/contacts/new" element={<ContactForm />} />
          <Route path="/contacts/:id" element={<ContactProfile />} />
          <Route path="/contacts/:id/edit" element={<ContactForm />} />
          <Route path="/conversations" element={<ConversationsTable />} />
          <Route path="/conversations/new" element={<ConversationForm />} />
          <Route path="/conversations/:id/edit" element={<ConversationForm />} />
          <Route path="/birthdays" element={<BirthdaysPage />} />
          <Route path="/tags" element={<TagsManager />} />
          <Route path="/settings" element={<SettingsPage onLogout={handleLogout} />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
