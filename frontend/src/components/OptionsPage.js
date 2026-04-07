import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

const BASE = process.env.REACT_APP_API_URL || '';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('vehicle_token') || ''}`
});

const CAR_INFO_SECTIONS = [
  { key: 'makes',  label: 'Makes',  endpoint: `${BASE}/api/options/makes`  },
  { key: 'models', label: 'Models', endpoint: `${BASE}/api/options/models` },
  { key: 'bodies', label: 'Bodies', endpoint: `${BASE}/api/options/bodies` },
  { key: 'users',  label: 'Users',  endpoint: null },
];

const DEALER_SECTIONS = [
  { key: 'dealers',     label: 'Dealers',     endpoint: `${BASE}/api/options/dealers`     },
  { key: 'sub-dealers', label: 'Sub-Dealers', endpoint: `${BASE}/api/options/sub-dealers` },
  { key: 'dealer-jrs',  label: 'Dealer Jr.',  endpoint: `${BASE}/api/options/dealer-jrs`  },
];

function ListManager({ endpoint, label, extraColumns }) {
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [newName, setNewName]       = useState('');
  const [saving, setSaving]         = useState(false);
  const [editId, setEditId]         = useState(null);
  const [editName, setEditName]     = useState('');
  const [editExtra, setEditExtra]   = useState({});
  const [importing, setImporting]   = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    fetch(endpoint, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { if (active) setItems(Array.isArray(data) ? data : []); })
      .catch(() => { if (active) setError('Failed to load.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [endpoint]);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(endpoint, { headers: authHeaders() });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { setError('Failed to load.'); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true); setError('');
    try {
      const res = await fetch(endpoint, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      setNewName(''); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    setError('');
    try {
      const body = { name: editName.trim(), ...editExtra };
      const res = await fetch(`${endpoint}/${id}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      setEditId(null); setEditExtra({}); load();
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete this ${label.slice(0, -1).toLowerCase()}?`)) return;
    setError('');
    try {
      const res = await fetch(`${endpoint}/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to delete');
      load();
    } catch (err) { setError(err.message); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true); setError(''); setImportResult(null);
    try {
      const buffer = await file.arrayBuffer();
      const wb     = XLSX.read(buffer, { type: 'array' });
      const ws     = wb.Sheets[wb.SheetNames[0]];

      if (extraColumns && extraColumns.length > 0) {
        // Read as objects using header row
        const jsonRows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const rows = jsonRows
          .map(r => {
            const obj = { name: String(r['name'] || r['Name'] || r['NAME'] || '').trim() };
            extraColumns.forEach(({ excelKey, fieldKey }) => {
              const val = r[excelKey];
              obj[fieldKey] = val !== undefined && val !== '' ? val : undefined;
            });
            return obj;
          })
          .filter(r => r.name);
        if (rows.length === 0) throw new Error('No data found. Make sure your file has a "name" column.');
        const res = await fetch(`${endpoint}/bulk`, {
          method: 'POST', headers: authHeaders(),
          body: JSON.stringify({ rows }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Import failed');
        setImportResult(`Imported ${d.inserted} item${d.inserted !== 1 ? 's' : ''}.`);
        load();
      } else {
        const sheetRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const names = sheetRows.slice(1).map(r => String(r[0] || '').trim()).filter(Boolean);
        if (names.length === 0) throw new Error('No data found in the first column.');
        const res = await fetch(`${endpoint}/bulk`, {
          method: 'POST', headers: authHeaders(),
          body: JSON.stringify({ names }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Import failed');
        setImportResult(`Imported ${d.inserted} item${d.inserted !== 1 ? 's' : ''}.`);
        load();
      }
    } catch (err) { setError(err.message); }
    finally { setImporting(false); e.target.value = ''; }
  };

  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <span style={s.cardTitle}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {importResult && (
            <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>{importResult}</span>
          )}
          <button
            onClick={() => { setImportResult(null); fileRef.current.click(); }}
            disabled={importing}
            style={s.importBtn}
            title="Import from Excel (.xlsx)"
          >
            {importing ? 'Importing…' : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Import Excel
              </>
            )}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImport} />
          <span style={s.badge}>{items.length} {items.length === 1 ? 'item' : 'items'}</span>
        </div>
      </div>

      <form onSubmit={handleAdd} style={s.addForm}>
        <input
          type="text"
          placeholder={`Add new ${label.slice(0, -1).toLowerCase()}…`}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          style={s.input}
          onFocus={e => e.target.style.borderColor = '#4f46e5'}
          onBlur={e => e.target.style.borderColor = 'var(--input-border)'}
        />
        <button type="submit" disabled={saving || !newName.trim()} style={{
          ...s.addBtn,
          background: saving || !newName.trim() ? 'var(--surface2)' : '#4f46e5',
          color: saving || !newName.trim() ? 'var(--subtle)' : '#fff',
          cursor: saving || !newName.trim() ? 'not-allowed' : 'pointer',
        }}>
          {saving ? 'Adding…' : '+ Add'}
        </button>
      </form>

      {error && <div style={s.errorBox}>{error}</div>}

      <div style={s.hint}>
        {extraColumns && extraColumns.length > 0
          ? `For Excel import: use columns "name", ${extraColumns.map(c => `"${c.excelKey}"`).join(', ')} in the header row.`
          : 'For Excel import: put names in column A, first row is treated as header and skipped.'}
      </div>

      {loading ? (
        <div style={s.empty}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={s.empty}>No {label.toLowerCase()} yet. Add one above or import from Excel.</div>
      ) : (
        <div>
          {extraColumns && extraColumns.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', background: 'var(--surface2)', borderRadius: 6, marginBottom: 4, gap: 8 }}>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)' }}>Name</span>
              {extraColumns.map(({ label: colLabel, fieldKey }) => (
                <span key={fieldKey} style={{ width: 110, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)' }}>{colLabel}</span>
              ))}
              <span style={{ width: 60 }} />
            </div>
          )}
          {items.map((item, i) => (
            <div
              key={item.id}
              style={{ ...s.row, borderBottom: i < items.length - 1 ? '1px solid var(--surface2)' : 'none' }}
              onMouseEnter={e => { if (editId !== item.id) e.currentTarget.style.background = 'var(--surface2)'; }}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
            >
              {editId === item.id ? (
                <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                  <input
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleUpdate(item.id); if (e.key === 'Escape') { setEditId(null); setEditExtra({}); } }}
                    style={{ ...s.input, flex: 1, minWidth: 120, borderColor: '#4f46e5' }}
                    placeholder="Name"
                  />
                  {extraColumns && extraColumns.map(({ fieldKey }) => (
                    <input
                      key={fieldKey}
                      type="number"
                      value={editExtra[fieldKey] ?? ''}
                      onChange={e => setEditExtra(ex => ({ ...ex, [fieldKey]: e.target.value }))}
                      placeholder=""
                      style={{ ...s.input, width: 110, borderColor: '#4f46e5' }}
                    />
                  ))}
                  <button onClick={() => handleUpdate(item.id)} style={s.saveBtn}>Save</button>
                  <button onClick={() => { setEditId(null); setEditExtra({}); }} style={s.cancelBtn}>Cancel</button>
                </div>
              ) : (
                <>
                  <span style={s.itemName}>{item.name}</span>
                  {extraColumns && extraColumns.map(({ fieldKey }) => (
                    <span key={fieldKey} style={{ width: 110, fontSize: 13, color: 'var(--text)' }}>
                      {item[fieldKey] !== undefined && item[fieldKey] !== null ? item[fieldKey] : <span style={{ color: 'var(--subtle)' }}>—</span>}
                    </span>
                  ))}
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => {
                        setEditId(item.id);
                        setEditName(item.name);
                        if (extraColumns) {
                          const extra = {};
                          extraColumns.forEach(({ fieldKey }) => { extra[fieldKey] = item[fieldKey] ?? ''; });
                          setEditExtra(extra);
                        }
                      }}
                      style={s.iconBtn} title="Edit"
                      onMouseEnter={e => e.currentTarget.style.color = '#4f46e5'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={s.iconBtn} title="Delete"
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const USER_EMPTY = { first_name: '', last_name: '', email: '', phone: '', role: 'member' };

function RoleBadge({ role }) {
  const isAdmin = role === 'admin';
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      background: isAdmin ? '#ede9fe' : 'var(--surface2)',
      color: isAdmin ? '#7c3aed' : 'var(--muted)',
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>{isAdmin ? 'Admin' : 'Member'}</span>
  );
}

function UserManager() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [form, setForm]         = useState(USER_EMPTY);
  const [saving, setSaving]     = useState(false);
  const [editId, setEditId]     = useState(null);
  const [editForm, setEditForm] = useState(USER_EMPTY);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${BASE}/api/users`, { headers: authHeaders() });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch { setError('Failed to load users.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.email.trim()) { setError('First name and email are required.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`${BASE}/api/users`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed');
      setForm(USER_EMPTY); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (id) => {
    if (!editForm.first_name.trim() || !editForm.email.trim()) { setError('First name and email are required.'); return; }
    setError('');
    try {
      const res = await fetch(`${BASE}/api/users/${id}`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify(editForm),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed');
      setEditId(null); load();
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    setError('');
    try {
      const res = await fetch(`${BASE}/api/users/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to delete');
      load();
    } catch (err) { setError(err.message); }
  };

  const roleSelect = (val, onChange) => (
    <select style={{ ...s.input, flex: 'none', width: '100%' }} value={val} onChange={e => onChange(e.target.value)}>
      <option value="member">Member</option>
      <option value="admin">Admin</option>
    </select>
  );

  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <span style={s.cardTitle}>Users</span>
        <span style={s.badge}>{users.length} {users.length === 1 ? 'user' : 'users'}</span>
      </div>
      <form onSubmit={handleAdd} style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface2)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <input style={s.input} placeholder="First name *" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} onFocus={e => e.target.style.borderColor='#4f46e5'} onBlur={e => e.target.style.borderColor='var(--input-border)'} />
          <input style={s.input} placeholder="Last name" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} onFocus={e => e.target.style.borderColor='#4f46e5'} onBlur={e => e.target.style.borderColor='var(--input-border)'} />
          <input style={s.input} placeholder="Email *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} onFocus={e => e.target.style.borderColor='#4f46e5'} onBlur={e => e.target.style.borderColor='var(--input-border)'} />
          <input style={s.input} placeholder="Phone number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} onFocus={e => e.target.style.borderColor='#4f46e5'} onBlur={e => e.target.style.borderColor='var(--input-border)'} />
          <div style={{ gridColumn: '1 / -1' }}>{roleSelect(form.role, v => setForm(f => ({ ...f, role: v })))}</div>
        </div>
        <button type="submit" disabled={saving} style={{ ...s.addBtn, background: saving ? 'var(--surface2)' : '#4f46e5', color: saving ? 'var(--subtle)' : '#fff', cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Adding…' : '+ Add User'}
        </button>
      </form>
      {error && <div style={s.errorBox}>{error}</div>}
      {loading ? (
        <div style={s.empty}>Loading…</div>
      ) : users.length === 0 ? (
        <div style={s.empty}>No users yet. Add one above.</div>
      ) : (
        <div>
          {users.map((u, i) => (
            <div key={u.id} style={{ ...s.row, flexDirection: 'column', alignItems: 'stretch', borderBottom: i < users.length - 1 ? '1px solid var(--surface2)' : 'none' }}>
              {editId === u.id ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input style={s.input} placeholder="First name *" value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} autoFocus />
                  <input style={s.input} placeholder="Last name" value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} />
                  <input style={s.input} placeholder="Email *" type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                  <input style={s.input} placeholder="Phone number" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                  <div style={{ gridColumn: '1 / -1' }}>{roleSelect(editForm.role, v => setEditForm(f => ({ ...f, role: v })))}</div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, marginTop: 4 }}>
                    <button onClick={() => handleUpdate(u.id)} style={s.saveBtn}>Save</button>
                    <button onClick={() => setEditId(null)} style={s.cancelBtn}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{u.first_name} {u.last_name}</span>
                      <RoleBadge role={u.role} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{u.email}{u.phone ? ` · ${u.phone}` : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => { setEditId(u.id); setEditForm({ first_name: u.first_name || '', last_name: u.last_name || '', email: u.email || '', phone: u.phone || '', role: u.role || 'member' }); }} style={s.iconBtn} title="Edit" onMouseEnter={e => e.currentTarget.style.color='#4f46e5'} onMouseLeave={e => e.currentTarget.style.color='var(--border)'}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => handleDelete(u.id)} style={s.iconBtn} title="Delete" onMouseEnter={e => e.currentTarget.style.color='#ef4444'} onMouseLeave={e => e.currentTarget.style.color='var(--border)'}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubTabBar({ sections, active, onSelect, color }) {
  return (
    <div style={{ display: 'flex', gap: 2, background: 'var(--surface2)', borderRadius: 10, padding: 4, marginBottom: 20, width: 'fit-content' }}>
      {sections.map(sec => (
        <button
          key={sec.key}
          onClick={() => onSelect(sec.key)}
          style={{
            padding: '7px 18px', border: 'none', borderRadius: 7,
            fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
            background: active === sec.key ? 'var(--surface)' : 'transparent',
            color: active === sec.key ? color : 'var(--muted)',
            boxShadow: active === sec.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            fontFamily: 'inherit',
          }}
        >
          {sec.label}
        </button>
      ))}
    </div>
  );
}

export default function OptionsPage() {
  const [mainTab, setMainTab]   = useState('car-info');
  const [carInfoTab, setCarInfoTab] = useState('makes');
  const [dealerTab, setDealerTab]   = useState('dealers');

  const MAIN_TABS = [
    {
      key: 'car-info', label: 'Car Info', color: '#4f46e5',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      ),
    },
    {
      key: 'dealers', label: 'Dealers', color: '#0891b2',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
  ];

  const activeCarInfo = CAR_INFO_SECTIONS.find(s => s.key === carInfoTab);
  const activeDealer  = DEALER_SECTIONS.find(s => s.key === dealerTab);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.title}>Options</h2>
        <p style={s.subtitle}>Manage dropdown values used in the vehicle entry form.</p>
      </div>

      <div style={s.layout}>
        <div style={s.sidebar}>
          {MAIN_TABS.map(tab => {
            const isActive = mainTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setMainTab(tab.key)}
                style={{
                  ...s.sideTabBtn,
                  background: isActive ? 'var(--surface2)' : 'transparent',
                  color: isActive ? tab.color : 'var(--muted)',
                  borderLeft: isActive ? `3px solid ${tab.color}` : '3px solid transparent',
                }}
              >
                <span style={{ color: isActive ? tab.color : 'var(--subtle)' }}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={s.content}>
          {mainTab === 'car-info' && (
            <>
              <SubTabBar sections={CAR_INFO_SECTIONS} active={carInfoTab} onSelect={setCarInfoTab} color="#4f46e5" />
              {carInfoTab === 'users' ? (
                <UserManager />
              ) : (
                activeCarInfo && <ListManager key={activeCarInfo.key} endpoint={activeCarInfo.endpoint} label={activeCarInfo.label} />
              )}
            </>
          )}

          {mainTab === 'dealers' && (
            <>
              <SubTabBar sections={DEALER_SECTIONS} active={dealerTab} onSelect={setDealerTab} color="#0891b2" />
              {activeDealer && (
                <ListManager
                  key={activeDealer.key}
                  endpoint={activeDealer.endpoint}
                  label={activeDealer.label}
                  extraColumns={['dealers', 'sub-dealers', 'dealer-jrs'].includes(activeDealer.key) ? [
                    { excelKey: 'loc_price', fieldKey: 'loc_price', label: 'Loc Price' },
                    { excelKey: 'InvAdd',    fieldKey: 'inv_add',   label: 'Inv Add'   },
                  ] : undefined}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page:     { maxWidth: 820, margin: '0', padding: '32px 24px' },
  header:   { marginBottom: 24 },
  title:    { margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: 'var(--text)' },
  subtitle: { margin: 0, fontSize: 13, color: 'var(--subtle)' },
  layout:   { display: 'flex', gap: 20, alignItems: 'flex-start' },
  sidebar: {
    display: 'flex', flexDirection: 'column', gap: 2,
    background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)',
    padding: '8px 0', minWidth: 160, flexShrink: 0,
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  sideTabBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 18px', border: 'none', background: 'transparent',
    fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s',
    fontFamily: 'inherit', textAlign: 'left', width: '100%',
  },
  content: { flex: 1, minWidth: 0 },
  card: {
    background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)',
    overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  cardHeader: {
    padding: '16px 20px', borderBottom: '1px solid var(--surface2)',
    background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  cardTitle: { fontWeight: 700, fontSize: 15, color: 'var(--text)' },
  badge: {
    fontSize: 12, fontWeight: 600, color: 'var(--muted)',
    background: 'var(--surface2)', borderRadius: 20, padding: '3px 10px',
  },
  importBtn: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '5px 12px', border: '1px solid var(--border)', borderRadius: 7,
    background: 'var(--surface)', color: '#4f46e5', fontWeight: 600, fontSize: 12,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
  },
  addForm: { display: 'flex', gap: 8, padding: '14px 20px', borderBottom: '1px solid var(--surface2)' },
  input: {
    flex: 1, padding: '8px 10px', border: '1px solid var(--input-border)', borderRadius: 8,
    fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    background: 'var(--input-bg)', color: 'var(--text)', transition: 'border-color 0.15s',
  },
  addBtn: {
    padding: '8px 18px', border: 'none', borderRadius: 8,
    fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', transition: 'all 0.15s', fontFamily: 'inherit',
  },
  errorBox: {
    margin: '10px 20px', padding: '10px 14px', background: '#fef2f2',
    color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13,
  },
  hint: {
    padding: '6px 20px 10px', fontSize: 11, color: 'var(--subtle)',
    borderBottom: '1px solid var(--surface2)',
  },
  empty:    { padding: '28px 20px', color: 'var(--subtle)', fontSize: 13 },
  row: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 20px', background: 'var(--surface)', transition: 'background 0.1s',
  },
  itemName: { flex: 1, fontSize: 14, color: 'var(--text)', fontWeight: 500 },
  iconBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--muted)', padding: 4, borderRadius: 6, transition: 'color 0.12s', lineHeight: 1,
  },
  saveBtn: {
    padding: '7px 14px', background: '#4f46e5', color: '#fff',
    border: 'none', borderRadius: 7, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
  },
  cancelBtn: {
    padding: '7px 12px', background: 'none', border: '1px solid var(--border)',
    borderRadius: 7, fontSize: 12, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit',
  },
};
