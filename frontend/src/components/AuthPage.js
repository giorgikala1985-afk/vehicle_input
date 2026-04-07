import { useState } from 'react';
import { FaCar, FaEnvelope, FaLock } from 'react-icons/fa';

const BASE = process.env.REACT_APP_API_URL || '';

export default function AuthPage({ onLogin }) {
  const [mode, setMode]         = useState('login'); // 'login' | 'register'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(`${BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Something went wrong.'); return; }
      localStorage.setItem('vehicle_token', d.token);
      localStorage.setItem('vehicle_user', JSON.stringify(d.user));
      onLogin(d.user);
    } catch {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <FaCar style={{ fontSize: 32, color: '#4f46e5' }} />
          <h1 style={styles.title}>Vehicle Manager</h1>
        </div>

        <div style={styles.tabs}>
          <button style={{ ...styles.tabBtn, ...(mode === 'login' ? styles.tabActive : {}) }} onClick={() => { setMode('login'); setError(null); }}>Sign In</button>
          <button style={{ ...styles.tabBtn, ...(mode === 'register' ? styles.tabActive : {}) }} onClick={() => { setMode('register'); setError(null); }}>Sign Up</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}><FaEnvelope style={styles.icon} /> Email</label>
            <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}><FaLock style={styles.icon} /> Password</label>
            <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: 'sans-serif' },
  card: { background: '#fff', borderRadius: 12, padding: '40px 36px', width: '100%', maxWidth: 400, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' },
  logo: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  title: { margin: 0, fontSize: 22, color: '#1a1a2e', fontWeight: 700 },
  tabs: { display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 24, gap: 0 },
  tabBtn: { flex: 1, padding: '10px 0', background: 'none', border: 'none', fontSize: 14, fontWeight: 600, color: '#94a3b8', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -2, transition: 'color 0.15s' },
  tabActive: { color: '#4f46e5', borderBottom: '2px solid #4f46e5' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 13, color: '#555', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 },
  icon: { color: '#4f46e5', fontSize: 12 },
  input: { padding: '9px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, outline: 'none' },
  button: { marginTop: 8, padding: 12, background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  error: { color: '#dc2626', fontSize: 13, margin: 0 },
};
