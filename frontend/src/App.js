import { useState, useEffect } from 'react';
import VehicleForm from './components/VehicleForm';
import Transactions from './components/Transactions';
import OptionsPage from './components/OptionsPage';
import ExcelImport from './components/ExcelImport';

const LIGHT = {
  '--bg':           '#f0f4f8',
  '--surface':      '#ffffff',
  '--surface2':     '#f8fafc',
  '--border':       '#e2e8f0',
  '--text':         '#1a1a2e',
  '--muted':        '#64748b',
  '--subtle':       '#94a3b8',
  '--input-bg':     '#ffffff',
  '--input-border': '#d1d5db',
};

const DARK = {
  '--bg':           '#0f172a',
  '--surface':      '#1e293b',
  '--surface2':     '#162032',
  '--border':       '#334155',
  '--text':         '#e2e8f0',
  '--muted':        '#94a3b8',
  '--subtle':       '#64748b',
  '--input-bg':     '#1e293b',
  '--input-border': '#475569',
};

const TABS = [
  { key: 'entry',        label: 'Entry Info'   },
  { key: 'transactions', label: 'Transactions' },
  { key: 'import',       label: 'Import Excel' },
  { key: 'options',      label: 'Options'      },
];

function App() {
  const [tab, setTab]     = useState('entry');
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'light');

  useEffect(() => {
    const vars = theme === 'dark' ? DARK : LIGHT;
    Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    document.body.style.background = vars['--bg'];
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'Lexend', -apple-system, sans-serif" }}>
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '15px 22px',
              border: 'none',
              borderBottom: tab === t.key ? '3px solid #4f46e5' : '3px solid transparent',
              background: 'transparent',
              fontSize: 14,
              fontWeight: 600,
              color: tab === t.key ? '#4f46e5' : 'var(--muted)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'color 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}

        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              padding: '6px 11px',
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: 'var(--surface2)',
              fontSize: 15,
              cursor: 'pointer',
              color: 'var(--text)',
              lineHeight: 1,
              transition: 'all 0.15s',
            }}
          >
            {isDark ? '☀' : '☾'}
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 0' }}>
        {tab === 'entry'        && <VehicleForm />}
        {tab === 'transactions' && <Transactions />}
        {tab === 'import'       && <ExcelImport />}
        {tab === 'options'      && <OptionsPage />}
      </div>
    </div>
  );
}

export default App;
