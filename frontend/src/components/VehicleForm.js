import { useState, useEffect, useRef } from 'react';
import {
  FaHashtag, FaCalendarAlt, FaCar, FaSitemap, FaTruck,
  FaBarcode, FaMapMarkerAlt, FaGavel, FaBoxOpen,
  FaCalendarCheck, FaCalendarTimes, FaClock, FaWarehouse,
  FaDollarSign, FaUser, FaShippingFast, FaCheckCircle
} from 'react-icons/fa';

const initialState = {
  stock: '', year: '', make: '', model: '', body: '', vin: '', lot: '',
  auction: '', product_type: '',
  auc_won_date: '', payment_due_date: '', auction_due: '', storage: '',
  auction_payment_amount: '', auction_payment_date: '',
  customer: '', customer_payment_date: '', customer_payment_amount: '',
  local_transportation_amount: '', local_transportation_due_date: '',
  local_transportation_payment_date: '',
  transportation_sales_amount: '', transportation_sales_due_date: ''
};

export default function VehicleForm() {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [makes, setMakes]   = useState([]);
  const [models, setModels] = useState([]);
  const [bodies, setBodies] = useState([]);

  useEffect(() => {
    const base = process.env.REACT_APP_API_URL || '';
    fetch(`${base}/api/options/makes`).then(r => r.json()).then(d => setMakes(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${base}/api/options/models`).then(r => r.json()).then(d => setModels(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${base}/api/options/bodies`).then(r => r.json()).then(d => setBodies(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed to submit');
      setStatus('success');
      setForm(initialState);
    } catch (err) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const field = (label, name, type = 'text', Icon = null) => (
    <div style={styles.field}>
      <label style={styles.label}>
        {Icon && <Icon style={styles.labelIcon} />}
        {label}
      </label>
      <input
        style={styles.input}
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
      />
    </div>
  );

  const dropdown = (label, name, options, Icon = null) => (
    <div style={styles.field}>
      <label style={styles.label}>
        {Icon && <Icon style={styles.labelIcon} />}
        {label}
      </label>
      <select
        style={styles.input}
        name={name}
        value={form[name]}
        onChange={handleChange}
      >
        <option value="">-- Select --</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );

  const searchableDropdown = (label, name, options, Icon = null) => (
    <SearchableDropdown
      label={label}
      Icon={Icon}
      options={options}
      value={form[name]}
      onChange={val => setForm(f => ({ ...f, [name]: val }))}
    />
  );

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>
          <FaCar style={{ marginRight: 10, color: '#4f46e5' }} />
          Vehicle Entry Form
        </h2>
        <form onSubmit={handleSubmit}>

          <Section title="Vehicle Info" color="#4f46e5">
            {field('Stock', 'stock', 'text', FaHashtag)}
            {field('Year', 'year', 'number', FaCalendarAlt)}
            {searchableDropdown('Make', 'make', makes.map(m => m.name), FaCar)}
            {searchableDropdown('Model', 'model', models.map(m => m.name), FaSitemap)}
            {searchableDropdown('Body', 'body', bodies.map(b => b.name), FaTruck)}
            {field('VIN', 'vin', 'text', FaBarcode)}
            {field('Lot', 'lot', 'text', FaMapMarkerAlt)}
            {field('Auction', 'auction', 'text', FaGavel)}
            {dropdown('Product Type', 'product_type', ['eBay Dismantling', 'Export'], FaBoxOpen)}
          </Section>

          <Section title="Auction Payment" color="#0891b2">
            {field('Auc Won Date', 'auc_won_date', 'date', FaCalendarCheck)}
            {field('Payment Due Date', 'payment_due_date', 'date', FaCalendarTimes)}
            {field('Auction Due', 'auction_due', 'date', FaClock)}
            {field('Storage', 'storage', 'number', FaWarehouse)}
            {field('Auction Payment Amount', 'auction_payment_amount', 'number', FaDollarSign)}
            {field('Auction Payment Date', 'auction_payment_date', 'date', FaCalendarCheck)}
          </Section>

          <Section title="Customer" color="#059669">
            {field('Customer', 'customer', 'text', FaUser)}
            {field('Customer Payment Date', 'customer_payment_date', 'date', FaCalendarCheck)}
            {field('Customer Payment Amount', 'customer_payment_amount', 'number', FaDollarSign)}
          </Section>

          <Section title="Transportation" color="#d97706">
            {field('Local Transportation Amount', 'local_transportation_amount', 'number', FaDollarSign)}
            {field('Local Transportation Due Date', 'local_transportation_due_date', 'date', FaCalendarTimes)}
            {field('Local Transportation Payment Date', 'local_transportation_payment_date', 'date', FaCalendarCheck)}
            {field('Transportation Sales Amount', 'transportation_sales_amount', 'number', FaShippingFast)}
            {field('Transportation Sales Due Date (by customer)', 'transportation_sales_due_date', 'date', FaCalendarTimes)}
          </Section>

          {status === 'success' && (
            <p style={styles.success}>
              <FaCheckCircle style={{ marginRight: 6 }} /> Submitted successfully!
            </p>
          )}
          {status === 'error' && (
            <p style={styles.error}>Something went wrong. Try again.</p>
          )}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Entry'}
          </button>
        </form>
      </div>
    </div>
  );
}

function SearchableDropdown({ label, Icon, options, value, onChange }) {
  const [query, setQuery]   = useState('');
  const [open, setOpen]     = useState(false);
  const ref                 = useRef();

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (opt) => { onChange(opt); setQuery(''); setOpen(false); };
  const clear   = (e) => { e.stopPropagation(); onChange(''); setQuery(''); };

  return (
    <div style={styles.field} ref={ref}>
      <label style={styles.label}>
        {Icon && <Icon style={styles.labelIcon} />}
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <div
          style={{ ...styles.input, display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6 }}
          onClick={() => setOpen(o => !o)}
        >
          {open ? (
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              onClick={e => e.stopPropagation()}
              placeholder="Search…"
              style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, background: 'transparent', fontFamily: 'inherit' }}
            />
          ) : (
            <span style={{ flex: 1, color: value ? '#1a1a2e' : '#999', fontSize: 14 }}>
              {value || '-- Select --'}
            </span>
          )}
          {value && !open && (
            <span onClick={clear} style={{ color: '#aaa', fontSize: 16, lineHeight: 1, padding: '0 2px', cursor: 'pointer' }}>×</span>
          )}
          <span style={{ color: '#aaa', fontSize: 10 }}>{open ? '▲' : '▼'}</span>
        </div>
        {open && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
            background: '#fff', border: '1px solid #ddd', borderRadius: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: 150, overflowY: 'auto', marginTop: 2,
          }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '6px 10px', color: '#999', fontSize: 12 }}>No matches</div>
            ) : (
              filtered.map(opt => (
                <div
                  key={opt}
                  onMouseDown={() => select(opt)}
                  style={{
                    padding: '6px 10px', cursor: 'pointer', fontSize: 13,
                    background: opt === value ? '#ede9fe' : 'transparent',
                    color: opt === value ? '#4f46e5' : '#1a1a2e',
                    fontWeight: opt === value ? 600 : 400,
                  }}
                  onMouseEnter={e => { if (opt !== value) e.currentTarget.style.background = '#f5f3ff'; }}
                  onMouseLeave={e => { if (opt !== value) e.currentTarget.style.background = 'transparent'; }}
                >
                  {opt}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children, color }) {
  return (
    <div style={styles.section}>
      <h3 style={{ ...styles.sectionTitle, borderBottomColor: color, color }}>
        {title}
      </h3>
      <div style={styles.grid}>{children}</div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f0f2f5',
    display: 'flex',
    justifyContent: 'center',
    padding: '40px 16px'
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: 32,
    width: '100%',
    maxWidth: 900,
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)'
  },
  title: {
    margin: '0 0 24px',
    fontSize: 24,
    color: '#1a1a2e',
    display: 'flex',
    alignItems: 'center'
  },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottom: '2px solid',
    paddingBottom: 8,
    marginBottom: 16
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '16px'
  },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: {
    fontSize: 13,
    color: '#555',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 5
  },
  labelIcon: { color: '#4f46e5', fontSize: 12 },
  input: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  button: {
    marginTop: 16,
    padding: '12px 32px',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  success: { color: '#16a34a', marginBottom: 12, display: 'flex', alignItems: 'center' },
  error: { color: '#dc2626', marginBottom: 12 }
};
