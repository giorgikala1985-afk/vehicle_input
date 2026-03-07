import { useState } from 'react';
import VehicleForm from './components/VehicleForm';
import Transactions from './components/Transactions';
import OptionsPage from './components/OptionsPage';
import AuthPage from './components/AuthPage';

const ALL_TABS = [
  { key: 'entry',        label: 'Entry Info',    adminOnly: false },
  { key: 'transactions', label: 'Transactions',  adminOnly: false },
  { key: 'options',      label: 'Options',       adminOnly: true  },
];

function App() {
  const [tab, setTab] = useState('entry');
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vehicle_user')); } catch { return null; }
  });

  const handleLogin = (u) => setUser(u);

  const handleLogout = () => {
    localStorage.removeItem('vehicle_token');
    localStorage.removeItem('vehicle_user');
    setUser(null);
  };

  if (!user) return <AuthPage onLogin={handleLogin} />;

  const isAdmin = user.role === 'admin';
  const tabs = ALL_TABS.filter(t => !t.adminOnly || isAdmin);

  return (
    <div style={styles.app}>
      <div style={styles.nav}>
        {tabs.map(t => (
          <button
            key={t.key}
            style={tab === t.key ? { ...styles.tab, ...styles.tabActive } : styles.tab}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
        <div style={styles.userArea}>
          <span style={styles.userName}>{user.first_name} {user.last_name}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Sign Out</button>
        </div>
      </div>

      <div style={styles.content}>
        {tab === 'entry'        && <VehicleForm />}
        {tab === 'transactions' && <Transactions />}
        {tab === 'options'      && isAdmin && <OptionsPage />}
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
    gap: 4
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
  userArea: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 },
  userName: { fontSize: 13, fontWeight: 600, color: '#4f46e5' },
  logoutBtn: { padding: '6px 14px', border: '1px solid #e0e0e0', borderRadius: 6, background: '#fff', fontSize: 13, fontWeight: 600, color: '#666', cursor: 'pointer' }
};

export default App;
