import { useState, useEffect } from 'react';

const BASE = process.env.REACT_APP_API_URL || '';

const columns = [
  { key: 'stock', label: 'Stock' },
  { key: 'year', label: 'Year' },
  { key: 'make', label: 'Make' },
  { key: 'model', label: 'Model' },
  { key: 'body', label: 'Body' },
  { key: 'vin', label: 'VIN' },
  { key: 'lot', label: 'Lot' },
  { key: 'auction', label: 'Auction' },
  { key: 'product_type', label: 'Product Type' },
  { key: 'auc_won_date', label: 'Auc Won Date' },
  { key: 'payment_due_date', label: 'Payment Due Date' },
  { key: 'auction_due', label: 'Auction Due' },
  { key: 'storage', label: 'Storage' },
  { key: 'auction_payment_amount', label: 'Auction Payment Amount' },
  { key: 'auction_payment_date', label: 'Auction Payment Date' },
  { key: 'customer', label: 'Customer' },
  { key: 'customer_payment_date', label: 'Customer Payment Date' },
  { key: 'customer_payment_amount', label: 'Customer Payment Amount' },
  { key: 'local_transportation_amount', label: 'Local Transportation Amount' },
  { key: 'local_transportation_due_date', label: 'Local Transportation Due Date' },
  { key: 'local_transportation_payment_date', label: 'Local Transportation Payment Date' },
  { key: 'transportation_sales_amount', label: 'Transportation Sales Amount' },
  { key: 'transportation_sales_due_date', label: 'Transportation Sales Due Date' },
];

export default function Transactions() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/vehicles`)
      .then(res => res.json())
      .then(data => { setVehicles(data); setLoading(false); })
      .catch(() => { setError('Failed to load data.'); setLoading(false); });
  }, []);

  const allSelected = vehicles.length > 0 && selected.size === vehicles.length;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(vehicles.map(v => v.id)));
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
      await Promise.all([...selected].map(id =>
        fetch(`${BASE}/api/vehicles/${id}`, { method: 'DELETE' })
      ));
      setVehicles(v => v.filter(x => !selected.has(x.id)));
      setSelected(new Set());
    } catch {
      alert('Failed to delete some entries. Try again.');
    } finally {
      setDeleting(false);
    }
  };

  const startEdit = (v) => {
    setEditId(v.id);
    setEditData({ ...v });
  };

  const cancelEdit = () => { setEditId(null); setEditData({}); };

  const handleEditChange = (key, val) => {
    setEditData(d => ({ ...d, [key]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/vehicles/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      if (!res.ok) throw new Error();
      setVehicles(v => v.map(x => x.id === editId ? { ...editData } : x));
      setEditId(null);
      setEditData({});
    } catch {
      alert('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={styles.msg}>Loading...</p>;
  if (error) return <p style={{ ...styles.msg, color: '#dc2626' }}>{error}</p>;
  if (vehicles.length === 0) return <p style={styles.msg}>No entries yet.</p>;

  return (
    <div style={styles.wrapper}>
      {selected.size > 0 && (
        <div style={styles.toolbar}>
          <span style={styles.selectedCount}>{selected.size} selected</span>
          <button style={styles.deleteBtn} onClick={handleDeleteSelected} disabled={deleting}>
            {deleting ? 'Deleting...' : `Delete (${selected.size})`}
          </button>
        </div>
      )}
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th style={styles.th}>Actions</th>
              {columns.map(col => (
                <th key={col.key} style={styles.th}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v, i) => {
              const isEditing = editId === v.id;
              const rowStyle = selected.has(v.id)
                ? styles.rowSelected
                : i % 2 === 0 ? styles.rowEven : styles.rowOdd;
              return (
                <tr key={v.id} style={rowStyle}>
                  <td style={styles.td}>
                    <input
                      type="checkbox"
                      checked={selected.has(v.id)}
                      onChange={() => toggleOne(v.id)}
                    />
                  </td>
                  <td style={styles.td}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
                          {saving ? '...' : 'Save'}
                        </button>
                        <button style={styles.cancelBtn} onClick={cancelEdit}>Cancel</button>
                      </div>
                    ) : (
                      <button style={styles.editBtn} onClick={() => startEdit(v)}>Edit</button>
                    )}
                  </td>
                  {columns.map(col => (
                    <td key={col.key} style={styles.td}>
                      {isEditing ? (
                        <input
                          style={styles.editInput}
                          value={editData[col.key] ?? ''}
                          onChange={e => handleEditChange(col.key, e.target.value)}
                        />
                      ) : (
                        v[col.key] ?? '—'
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { padding: '0 8px' },
  toolbar: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 16px', background: '#fef2f2',
    border: '1px solid #fca5a5', borderRadius: 8, marginBottom: 12
  },
  selectedCount: { fontSize: 13, fontWeight: 600, color: '#dc2626' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 1200 },
  th: {
    background: '#4f46e5', color: '#fff', padding: '10px 12px',
    textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600
  },
  td: { padding: '8px 12px', whiteSpace: 'nowrap', color: '#333' },
  rowEven: { background: '#fff' },
  rowOdd: { background: '#f5f5ff' },
  rowSelected: { background: '#ede9fe' },
  msg: { color: '#888', padding: 24, textAlign: 'center' },
  deleteBtn: {
    padding: '6px 14px', background: '#dc2626', color: '#fff',
    border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600
  },
  editBtn: {
    padding: '4px 10px', background: '#e0e7ff', color: '#4f46e5',
    border: '1px solid #a5b4fc', borderRadius: 4, cursor: 'pointer',
    fontSize: 12, fontWeight: 600
  },
  saveBtn: {
    padding: '4px 10px', background: '#4f46e5', color: '#fff',
    border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600
  },
  cancelBtn: {
    padding: '4px 10px', background: '#f3f4f6', color: '#444',
    border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', fontSize: 12
  },
  editInput: {
    padding: '3px 6px', border: '1px solid #a5b4fc', borderRadius: 4,
    fontSize: 12, width: 120, outline: 'none'
  }
};
