import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

const BASE = process.env.REACT_APP_API_URL || '';

const authHeaders = () => ({
  'Content-Type': 'application/json',
});

const columns = [
  { key: 'stock', label: 'Stock' },
  { key: 'year', label: 'Year' },
  { key: 'make', label: 'Make' },
  { key: 'model', label: 'Model' },
  { key: 'body', label: 'Body' },
  { key: 'vin', label: 'VIN' },
  { key: 'lot', label: 'Lot' },
  { key: 'auction', label: 'Auc.' },
  { key: 'product_type', label: 'Product Type' },
  { key: 'dealer', label: 'Dealer' },
  { key: 'dealer_amount', label: 'Dealer Amount' },
  { key: 'dealer_date', label: 'Dealer Date' },
  { key: 'sub_dealer', label: 'Sub-Dealer' },
  { key: 'sub_dealer_amount', label: 'Sub-Dealer Amount' },
  { key: 'sub_dealer_date', label: 'Sub-Dealer Date' },
  { key: 'auc_won_date', label: 'Auc Won Date' },
  { key: 'payment_due_date', label: 'Payment Due Date' },
  { key: 'auction_due', label: 'Auc. Due' },
  { key: 'storage', label: 'Storage' },
  { key: 'auction_invoice_initial', label: 'Auc. Invoice (Initial)' },
  { key: 'auction_invoice_actual', label: 'Auc. Invoice (Actual)' },
  { key: 'auction_additional_charges', label: 'Auc. Additional Charges' },
  { key: 'auction_payment_amount', label: 'Auc. Payment Amount' },
  { key: 'auction_payment_date', label: 'Auc. Payment Date' },
  { key: 'auction_payment_status', label: 'Auc. Payment Status' },
  { key: 'customer', label: 'Cust.' },
  { key: 'customer_payment_date', label: 'Cust. Payment Date' },
  { key: 'customer_payment_amount', label: 'Cust. Payment Amount' },
  { key: 'cash_received', label: 'Cash Received' },
  { key: 'local_transportation_amount', label: 'Local Transp. Amount' },
  { key: 'local_transportation_due_date', label: 'Local Transp. Due Date' },
  { key: 'local_transportation_payment_date', label: 'Local Transp. Payment Date' },
  { key: 'transportation_sales_amount', label: 'Transp. Sales Amount' },
  { key: 'transportation_sales_due_date', label: 'Transp. Sales Due Date' },
  { key: 'ocean_freight', label: 'Ocean Freight' },
  { key: 'tch', label: 'TCH' },
  { key: 'other_services', label: 'Other Services' },
];

const SECTIONS = [
  {
    title: 'Vehicle Info', color: '#4f46e5',
    fields: ['stock', 'year', 'make', 'model', 'body', 'vin', 'lot', 'auction', 'product_type',
             'dealer', 'dealer_amount', 'dealer_date', 'sub_dealer', 'sub_dealer_amount', 'sub_dealer_date']
  },
  {
    title: 'Auc. Payment', color: '#0891b2',
    fields: ['auc_won_date', 'payment_due_date', 'auction_due', 'storage', 'auction_invoice_initial', 'auction_invoice_actual', 'auction_additional_charges', 'other_services', 'auction_payment_amount', 'auction_payment_date', 'auction_payment_status']
  },
  {
    title: 'Cust.', color: '#059669',
    fields: ['customer', 'customer_payment_date', 'customer_payment_amount', 'cash_received']
  },
  {
    title: 'Transp.', color: '#d97706',
    fields: ['local_transportation_amount', 'local_transportation_due_date', 'local_transportation_payment_date', 'transportation_sales_amount', 'transportation_sales_due_date', 'ocean_freight', 'tch']
  },
];

const fieldMeta = {
  year: 'number', storage: 'number',
  auction_payment_amount: 'number', auction_invoice_initial: 'number', auction_invoice_actual: 'number',
  auction_additional_charges: 'number', customer_payment_amount: 'number',
  local_transportation_amount: 'number', transportation_sales_amount: 'number',
  dealer_amount: 'number', sub_dealer_amount: 'number',
  ocean_freight: 'number', tch: 'number', other_services: 'number',
  auction_payment_status: 'select',
  auc_won_date: 'date', payment_due_date: 'date', auction_due: 'date',
  auction_payment_date: 'date', customer_payment_date: 'date',
  local_transportation_due_date: 'date', local_transportation_payment_date: 'date',
  transportation_sales_due_date: 'date', dealer_date: 'date', sub_dealer_date: 'date',
  product_type: 'select', cash_received: 'select',
  make: 'searchable', model: 'searchable', body: 'searchable',
  dealer: 'searchable', sub_dealer: 'searchable',
};

function SearchableDropdown({ options, value, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const ref               = useRef();

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (opt) => { onChange(opt); setQuery(''); setOpen(false); };
  const clear  = (e)   => { e.stopPropagation(); onChange(''); setQuery(''); };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        style={{ ...m.input, display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6 }}
        onClick={() => setOpen(o => !o)}
      >
        {open ? (
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onClick={e => e.stopPropagation()}
            placeholder="Search…"
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13, background: 'transparent', fontFamily: 'inherit', color: 'var(--text)' }}
          />
        ) : (
          <span style={{ flex: 1, color: value ? 'var(--text)' : 'var(--subtle)', fontSize: 13 }}>
            {value || '-- Select --'}
          </span>
        )}
        {value && !open && (
          <span onClick={clear} style={{ color: 'var(--subtle)', fontSize: 16, lineHeight: 1, cursor: 'pointer' }}>×</span>
        )}
        <span style={{ color: 'var(--subtle)', fontSize: 10 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 150, overflowY: 'auto', marginTop: 3,
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '6px 10px', color: 'var(--subtle)', fontSize: 12 }}>No matches</div>
          ) : (
            filtered.map(opt => (
              <div
                key={opt}
                onMouseDown={() => select(opt)}
                style={{
                  padding: '6px 10px', cursor: 'pointer', fontSize: 13,
                  background: opt === value ? '#ede9fe' : 'transparent',
                  color: opt === value ? '#4f46e5' : 'var(--text)',
                  fontWeight: opt === value ? 600 : 400,
                }}
                onMouseEnter={e => { if (opt !== value) e.currentTarget.style.background = 'var(--surface2)'; }}
                onMouseLeave={e => { if (opt !== value) e.currentTarget.style.background = 'transparent'; }}
              >
                {opt}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function EditModal({ data, options, onClose, onSave, saving }) {
  const [form, setForm] = useState({ ...data });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const colLabel = (key) => columns.find(c => c.key === key)?.label || key;

  const renderField = (key) => {
    const type  = fieldMeta[key] || 'text';
    const label = colLabel(key);
    const val   = form[key] ?? '';

    if (type === 'searchable') {
      return (
        <div key={key} style={m.field}>
          <label style={m.label}>{label}</label>
          <SearchableDropdown options={options[key] || []} value={val} onChange={v => set(key, v)} />
        </div>
      );
    }

    if (type === 'select') {
      const opts = key === 'product_type' ? ['eBay Dismantling', 'Export'] : key === 'auction_payment_status' ? ['Pending', 'Paid', 'Overdue'] : ['USA', 'GEORGIA'];
      return (
        <div key={key} style={m.field}>
          <label style={m.label}>{label}</label>
          <select style={m.input} value={val} onChange={e => set(key, e.target.value)}>
            <option value="">-- Select --</option>
            {opts.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    }

    return (
      <div key={key} style={m.field}>
        <label style={m.label}>{label}</label>
        <input style={m.input} type={type} value={val} onChange={e => set(key, e.target.value)} />
      </div>
    );
  };

  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={m.modal} onClick={e => e.stopPropagation()}>
        <div style={m.header}>
          <span style={m.headerTitle}>Edit Record</span>
          <button style={m.closeBtn} onClick={onClose}>×</button>
        </div>
        <div style={m.body}>
          {SECTIONS.map(sec => (
            <div key={sec.title} style={m.section}>
              <h3 style={{ ...m.sectionTitle, color: sec.color, borderBottomColor: sec.color }}>
                {sec.title}
              </h3>
              <div style={m.grid}>
                {sec.fields.map(renderField)}
              </div>
            </div>
          ))}
        </div>
        <div style={m.footer}>
          <button style={m.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={m.saveBtn} onClick={() => onSave(form)} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Transactions() {
  const [vehicles, setVehicles]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [selected, setSelected]   = useState(new Set());
  const [deleting, setDeleting]   = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [options, setOptions]     = useState({ make: [], model: [], body: [], dealer: [], sub_dealer: [] });
  const [filters, setFilters]     = useState(() => Object.fromEntries(columns.map(c => [c.key, ''])));

  useEffect(() => {
    const h = { headers: authHeaders() };
    fetch(`${BASE}/api/vehicles`, h)
      .then(res => res.json())
      .then(data => { setVehicles(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError('Failed to load data.'); setLoading(false); });

    fetch(`${BASE}/api/options/makes`, h).then(r => r.json()).then(d => setOptions(o => ({ ...o, make: Array.isArray(d) ? d.map(x => x.name) : [] }))).catch(() => {});
    fetch(`${BASE}/api/options/models`, h).then(r => r.json()).then(d => setOptions(o => ({ ...o, model: Array.isArray(d) ? d.map(x => x.name) : [] }))).catch(() => {});
    fetch(`${BASE}/api/options/bodies`, h).then(r => r.json()).then(d => setOptions(o => ({ ...o, body: Array.isArray(d) ? d.map(x => x.name) : [] }))).catch(() => {});
    fetch(`${BASE}/api/options/dealers`, h).then(r => r.json()).then(d => setOptions(o => ({ ...o, dealer: Array.isArray(d) ? d.map(x => x.name) : [] }))).catch(() => {});
    fetch(`${BASE}/api/options/sub-dealers`, h).then(r => r.json()).then(d => setOptions(o => ({ ...o, sub_dealer: Array.isArray(d) ? d.map(x => x.name) : [] }))).catch(() => {});
  }, []);

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(v => v.id)));
  };

  const toggleOne = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Delete ${selected.size} selected entry/entries?`)) return;
    setDeleting(true);
    try {
      const results = await Promise.all([...selected].map(id =>
        fetch(`${BASE}/api/vehicles/${id}`, { method: 'DELETE', headers: authHeaders() }).then(r => ({ id, ok: r.ok }))
      ));
      const deleted = new Set(results.filter(r => r.ok).map(r => r.id));
      const failed  = results.filter(r => !r.ok).length;
      if (deleted.size > 0) {
        setVehicles(v => v.filter(x => !deleted.has(x.id)));
        setSelected(new Set([...selected].filter(id => !deleted.has(id))));
      }
      if (failed > 0) alert(`${failed} entry/entries could not be deleted.`);
    } catch {
      alert('Failed to delete. Try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async (form) => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/vehicles/${editRecord.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error();
      setVehicles(v => v.map(x => x.id === editRecord.id ? { ...x, ...form } : x));
      setEditRecord(null);
    } catch {
      alert('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  const filtered = vehicles.filter(v =>
    columns.every(col => {
      const fv = filters[col.key];
      if (!fv) return true;
      return String(v[col.key] ?? '').toLowerCase().includes(fv.toLowerCase());
    })
  );

  const allSelected = filtered.length > 0 && filtered.every(v => selected.has(v.id));

  const downloadExcel = () => {
    const data = vehicles.map(v =>
      columns.reduce((row, col) => { row[col.label] = v[col.key] ?? ''; return row; }, {})
    );
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vehicles');
    XLSX.writeFile(wb, 'transactions.xlsx');
  };

  const badgeCols  = new Set(['product_type', 'cash_received']);
  const badgeColor = (key, val) => {
    if (key === 'product_type') return val === 'Export' ? { bg: '#dcfce7', color: '#15803d' } : { bg: '#ede9fe', color: '#6d28d9' };
    if (key === 'cash_received') return val === 'USA' ? { bg: '#dbeafe', color: '#1d4ed8' } : { bg: '#fef9c3', color: '#a16207' };
    return { bg: '#f1f5f9', color: '#475569' };
  };

  if (loading) return <p style={st.msg}>Loading...</p>;
  if (error)   return <p style={{ ...st.msg, color: '#dc2626' }}>{error}</p>;

  return (
    <div style={st.wrapper}>
      {editRecord && (
        <EditModal
          data={editRecord}
          options={options}
          onClose={() => setEditRecord(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}

      <div style={st.topBar}>
        <div style={st.stats}>
          <span style={st.statChip}>
            <span style={st.statDot} />
            {vehicles.length} total
          </span>
          {filtered.length !== vehicles.length && (
            <span style={{ ...st.statChip, background: '#ede9fe', color: '#6d28d9' }}>
              {filtered.length} shown
            </span>
          )}
          {selected.size > 0 && (
            <span style={{ ...st.statChip, background: '#fef2f2', color: '#dc2626' }}>
              {selected.size} selected
            </span>
          )}
        </div>
        <div style={st.actions}>
          {selected.size > 0 && (
            <button style={st.deleteBtn} onClick={handleDeleteSelected} disabled={deleting}>
              {deleting ? 'Deleting…' : `Delete (${selected.size})`}
            </button>
          )}
          <button style={st.excelBtn} onClick={downloadExcel}>↓ Export Excel</button>
        </div>
      </div>

      {vehicles.length === 0 && <p style={st.msg}>No entries yet.</p>}

      {vehicles.length > 0 && (
        <div style={st.card}>
          <div style={st.tableWrap}>
            <table style={st.table}>
              <thead>
                <tr>
                  <th style={st.th} rowSpan={2}>
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                  </th>
                  <th style={st.th} rowSpan={2}>Actions</th>
                  {columns.map(col => (
                    <th key={col.key} style={st.th}>{col.label}</th>
                  ))}
                </tr>
                <tr>
                  {columns.map(col => (
                    <th key={col.key} style={st.filterTh}>
                      <input
                        style={st.filterInput}
                        placeholder="⌕"
                        value={filters[col.key]}
                        onChange={e => setFilter(col.key, e.target.value)}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 2} style={st.emptyRow}>
                      No records match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((v) => (
                    <tr
                      key={v.id}
                      style={selected.has(v.id) ? st.rowSelected : st.row}
                      onMouseEnter={e => { if (!selected.has(v.id)) e.currentTarget.style.background = 'var(--surface2)'; }}
                      onMouseLeave={e => { if (!selected.has(v.id)) e.currentTarget.style.background = ''; }}
                    >
                      <td style={st.td}>
                        <input type="checkbox" checked={selected.has(v.id)} onChange={() => toggleOne(v.id)} />
                      </td>
                      <td style={st.td}>
                        <button style={st.editBtn} onClick={() => setEditRecord(v)}>Edit</button>
                      </td>
                      {columns.map(col => {
                        const val = v[col.key];
                        if (badgeCols.has(col.key) && val) {
                          const bc = badgeColor(col.key, val);
                          return (
                            <td key={col.key} style={st.td}>
                              <span style={{ ...st.badge, background: bc.bg, color: bc.color }}>{val}</span>
                            </td>
                          );
                        }
                        return <td key={col.key} style={st.td}>{val ?? <span style={st.empty}>—</span>}</td>;
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const st = {
  wrapper: { padding: '0 16px 24px' },
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14, flexWrap: 'wrap', gap: 10,
  },
  stats: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  statChip: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    background: 'var(--surface2)', color: 'var(--muted)',
  },
  statDot: { width: 7, height: 7, borderRadius: '50%', background: '#4f46e5', display: 'inline-block' },
  actions: { display: 'flex', gap: 8, alignItems: 'center' },
  excelBtn: {
    padding: '8px 18px', background: '#16a34a', color: '#fff',
    border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  deleteBtn: {
    padding: '8px 16px', background: 'var(--surface)', color: '#dc2626',
    border: '1.5px solid #fca5a5', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  card: {
    background: 'var(--surface)', borderRadius: 12,
    boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)',
    overflow: 'hidden', border: '1px solid var(--border)',
  },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 1400 },
  th: {
    background: '#4f46e5', color: '#fff', padding: '11px 13px',
    textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600,
    fontSize: 12, letterSpacing: 0.3, position: 'sticky', top: 0, zIndex: 2,
  },
  filterTh: {
    background: 'var(--surface2)', padding: '5px 6px',
    borderBottom: '2px solid var(--border)', position: 'sticky', top: 38, zIndex: 1,
  },
  filterInput: {
    width: '100%', boxSizing: 'border-box',
    padding: '4px 8px', fontSize: 12,
    border: '1px solid var(--input-border)', borderRadius: 5,
    outline: 'none', background: 'var(--input-bg)', color: 'var(--text)',
    fontFamily: 'inherit',
  },
  row: { borderBottom: '1px solid var(--border)', transition: 'background 0.1s' },
  rowSelected: { background: '#ede9fe', borderBottom: '1px solid #ddd6fe' },
  td: { padding: '9px 13px', whiteSpace: 'nowrap', color: 'var(--text)' },
  badge: {
    display: 'inline-block', padding: '2px 9px', borderRadius: 20,
    fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
  },
  empty: { color: 'var(--subtle)' },
  editBtn: {
    padding: '4px 12px', background: 'var(--surface2)', color: '#4f46e5',
    border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer',
    fontSize: 12, fontWeight: 600,
  },
  emptyRow: {
    textAlign: 'center', padding: '32px', color: 'var(--subtle)',
    fontSize: 14, fontStyle: 'italic',
  },
  msg: { color: 'var(--subtle)', padding: '40px 24px', textAlign: 'center', fontSize: 15 },
};

const m = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: 'var(--surface)', borderRadius: 16, width: '90%', maxWidth: 800,
    maxHeight: '90vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 12px 48px rgba(0,0,0,0.25)', border: '1px solid var(--border)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 24px', borderBottom: '1px solid var(--border)',
  },
  headerTitle: { fontWeight: 700, fontSize: 17, color: 'var(--text)' },
  closeBtn: {
    background: 'none', border: 'none', fontSize: 22, cursor: 'pointer',
    color: 'var(--subtle)', lineHeight: 1, padding: '0 4px',
  },
  body: { overflowY: 'auto', padding: '20px 24px', flex: 1 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2,
    borderBottom: '2px solid', paddingBottom: 6, margin: '0 0 14px',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    padding: '7px 10px', border: '1px solid var(--input-border)', borderRadius: 7,
    fontSize: 13, outline: 'none', fontFamily: 'inherit',
    background: 'var(--input-bg)', color: 'var(--text)',
  },
  footer: {
    display: 'flex', justifyContent: 'flex-end', gap: 10,
    padding: '16px 24px', borderTop: '1px solid var(--border)',
  },
  cancelBtn: {
    padding: '9px 20px', background: 'none', border: '1px solid var(--border)',
    borderRadius: 8, fontSize: 13, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit',
  },
  saveBtn: {
    padding: '9px 24px', background: '#4f46e5', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
};
