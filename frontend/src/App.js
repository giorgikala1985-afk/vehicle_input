import { useState } from 'react';
import VehicleForm from './components/VehicleForm';
import Transactions from './components/Transactions';
import OptionsPage from './components/OptionsPage';

const TABS = [
  { key: 'entry',        label: 'Entry Info' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'options',      label: 'Options' },
];

function App() {
  const [tab, setTab] = useState('entry');

  return (
    <div style={styles.app}>
      <div style={styles.nav}>
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
  content: { padding: '24px 0' }
};

export default App;
