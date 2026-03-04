import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import VehicleForm from './components/VehicleForm';
import Transactions from './components/Transactions';
import OptionsPage from './components/OptionsPage';
import AuthPage from './components/AuthPage';

const TABS = [
  { key: 'entry',        label: 'Entry Info' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'options',      label: 'Options' },
];

function App() {
  const [tab, setTab] = useState('entry');
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (authLoading) return <div style={styles.loading}>Loading...</div>;
  if (!session) return <AuthPage />;

  return (
    <div style={styles.app}>
      <div style={styles.nav}>
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map(t => (
            <button
              key={t.key}
              style={tab === t.key ? { ...styles.tab, ...styles.tabActive } : styles.tab}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={styles.userBar}>
          <span style={styles.userEmail}>{session.user.email}</span>
          <button style={styles.signOutBtn} onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>

      <div style={styles.content}>
        {tab === 'entry'        && <VehicleForm />}
        {tab === 'transactions' && <Transactions />}
        {tab === 'options'      && <OptionsPage />}
      </div>
    </div>
  );
}

const styles = {
  app: { minHeight: '100vh', background: '#f0f2f5', fontFamily: 'sans-serif' },
  nav: {
    background: '#fff',
    borderBottom: '1px solid #e0e0e0',
    padding: '0 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  tab: {
    padding: '14px 24px',
    border: 'none',
    borderBottom: '3px solid transparent',
    background: 'transparent',
    fontSize: 14,
    fontWeight: 600,
    color: '#888',
    cursor: 'pointer'
  },
  tabActive: {
    color: '#4f46e5',
    borderBottom: '3px solid #4f46e5'
  },
  content: { padding: '24px 0' },
  userBar: { display: 'flex', alignItems: 'center', gap: 12 },
  userEmail: { fontSize: 13, color: '#555' },
  signOutBtn: {
    padding: '6px 14px', background: '#f3f4f6', border: '1px solid #ddd',
    borderRadius: 6, fontSize: 13, cursor: 'pointer', color: '#444', fontWeight: 500
  },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 16, color: '#888', fontFamily: 'sans-serif' }
};

export default App;
