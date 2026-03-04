import { useState, useEffect } from 'react';

export default function Transactions() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/vehicles')
      .then(res => res.json())
      .then(data => { setVehicles(data); setLoading(false); })
      .catch(() => { setError('Failed to load data.'); setLoading(false); });
  }, []);

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

  if (loading) return <p style={styles.msg}>Loading...</p>;
  if (error) return <p style={{ ...styles.msg, color: '#dc2626' }}>{error}</p>;
  if (vehicles.length === 0) return <p style={styles.msg}>No entries yet.</p>;

  return (
    <div style={styles.wrapper}>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} style={styles.th}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v, i) => (
              <tr key={v.id} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                {columns.map(col => (
                  <td key={col.key} style={styles.td}>{v[col.key] ?? '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { overflowX: 'auto', padding: '0 8px' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 1200 },
  th: {
    background: '#4f46e5', color: '#fff', padding: '10px 12px',
    textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600
  },
  td: { padding: '8px 12px', whiteSpace: 'nowrap', color: '#333' },
  rowEven: { background: '#fff' },
  rowOdd: { background: '#f5f5ff' },
  msg: { color: '#888', padding: 24, textAlign: 'center' }
};
