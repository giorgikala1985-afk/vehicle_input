import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

const SECTIONS = [
  { key: 'makes',  label: 'Makes',  endpoint: '/api/options/makes'  },
  { key: 'models', label: 'Models', endpoint: '/api/options/models' },
  { key: 'bodies', label: 'Bodies', endpoint: '/api/options/bodies' },
];

function ListManager({ endpoint, label }) {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [newName, setNewName]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [editId, setEditId]     = useState(null);
  const [editName, setEditName] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    fetch(endpoint)
      .then(r => r.json())
      .then(data => { if (active) setItems(Array.isArray(data) ? data : []); })
      .catch(() => { if (active) setError('Failed to load.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [endpoint]);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(endpoint);
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`${endpoint}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      setEditId(null); load();
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete this ${label.slice(0, -1).toLowerCase()}?`)) return;
    setError('');
    try {
      const res = await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
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
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      // Take first column, skip header row, filter empties
      const names = rows.slice(1).map(r => String(r[0] || '').trim()).filter(Boolean);
      if (names.length === 0) throw new Error('No data found in the first column.');

      const res = await fetch(`${endpoint}/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Import failed');
      setImportResult(`Imported ${d.inserted} item${d.inserted !== 1 ? 's' : ''}.`);
      load();
    } catch (err) { setError(err.message); }
    finally { setImporting(false); e.target.value = ''; }
  };

  return (
    <div style={s.card}>
      {/* Header */}
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

      {/* Add form */}
      <form onSubmit={handleAdd} style={s.addForm}>
        <input
          type="text"
          placeholder={`Add new ${label.slice(0, -1).toLowerCase()}…`}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          style={s.input}
          onFocus={e => e.target.style.borderColor = '#4f46e5'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
        <button type="submit" disabled={saving || !newName.trim()} style={{
          ...s.addBtn,
          background: saving || !newName.trim() ? '#e2e8f0' : '#4f46e5',
          color: saving || !newName.trim() ? '#94a3b8' : '#fff',
          cursor: saving || !newName.trim() ? 'not-allowed' : 'pointer',
        }}>
          {saving ? 'Adding…' : '+ Add'}
        </button>
      </form>

      {error && <div style={s.errorBox}>{error}</div>}

      {/* Hint */}
      <div style={s.hint}>
        For Excel import: put names in column A, first row is treated as header and skipped.
      </div>

      {/* List */}
      {loading ? (
        <div style={s.empty}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={s.empty}>No {label.toLowerCase()} yet. Add one above or import from Excel.</div>
      ) : (
        <div>
          {items.map((item, i) => (
            <div
              key={item.id}
              style={{ ...s.row, borderBottom: i < items.length - 1 ? '1px solid #f8fafc' : 'none' }}
              onMouseEnter={e => { if (editId !== item.id) e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              {editId === item.id ? (
                <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                  <input
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleUpdate(item.id); if (e.key === 'Escape') setEditId(null); }}
                    style={{ ...s.input, flex: 1, borderColor: '#4f46e5' }}
                  />
                  <button onClick={() => handleUpdate(item.id)} style={s.saveBtn}>Save</button>
                  <button onClick={() => setEditId(null)} style={s.cancelBtn}>Cancel</button>
                </div>
              ) : (
                <>
                  <span style={s.itemName}>{item.name}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => { setEditId(item.id); setEditName(item.name); }}
                      style={s.iconBtn}
                      title="Edit"
                      onMouseEnter={e => e.currentTarget.style.color = '#4f46e5'}
                      onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={s.iconBtn}
                      title="Delete"
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
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

export default function OptionsPage() {
  const [activeTab, setActiveTab] = useState('makes');
  const active = SECTIONS.find(s => s.key === activeTab);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.title}>Options</h2>
        <p style={s.subtitle}>Manage dropdown values used in the vehicle entry form.</p>
      </div>

      {/* Sub-tabs */}
      <div style={s.tabBar}>
        {SECTIONS.map(sec => (
          <button
            key={sec.key}
            onClick={() => setActiveTab(sec.key)}
            style={{
              ...s.tabBtn,
              background: activeTab === sec.key ? '#fff' : 'transparent',
              color: activeTab === sec.key ? '#4f46e5' : '#64748b',
              boxShadow: activeTab === sec.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {active && <ListManager key={active.key} endpoint={active.endpoint} label={active.label} />}
    </div>
  );
}

const s = {
  page: { maxWidth: 560, margin: '0 auto', padding: '32px 16px' },
  header: { marginBottom: 24 },
  title: { margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#1e293b' },
  subtitle: { margin: 0, fontSize: 13, color: '#94a3b8' },
  tabBar: {
    display: 'flex', gap: 2, background: '#f1f5f9', borderRadius: 10,
    padding: 4, marginBottom: 24, width: 'fit-content',
  },
  tabBtn: {
    padding: '7px 20px', border: 'none', borderRadius: 7,
    fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
  },
  card: {
    background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0',
    overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  cardHeader: {
    padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
    background: '#fafbfc', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  cardTitle: { fontWeight: 700, fontSize: 15, color: '#1e293b' },
  badge: {
    fontSize: 12, fontWeight: 600, color: '#64748b',
    background: '#f1f5f9', borderRadius: 20, padding: '3px 10px',
  },
  importBtn: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '5px 12px', border: '1px solid #e2e8f0', borderRadius: 7,
    background: '#fff', color: '#4f46e5', fontWeight: 600, fontSize: 12,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
  },
  addForm: { display: 'flex', gap: 8, padding: '14px 20px', borderBottom: '1px solid #f1f5f9' },
  input: {
    flex: 1, padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8,
    fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    transition: 'border-color 0.15s',
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
    padding: '6px 20px 10px', fontSize: 11, color: '#94a3b8',
    borderBottom: '1px solid #f1f5f9',
  },
  empty: { padding: '28px 20px', color: '#94a3b8', fontSize: 13 },
  row: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 20px', background: '#fff', transition: 'background 0.1s',
  },
  itemName: { flex: 1, fontSize: 14, color: '#1e293b', fontWeight: 500 },
  iconBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#cbd5e1', padding: 4, borderRadius: 6, transition: 'color 0.12s', lineHeight: 1,
  },
  saveBtn: {
    padding: '7px 14px', background: '#4f46e5', color: '#fff',
    border: 'none', borderRadius: 7, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
  },
  cancelBtn: {
    padding: '7px 12px', background: 'none', border: '1px solid #e2e8f0',
    borderRadius: 7, fontSize: 12, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit',
  },
};
