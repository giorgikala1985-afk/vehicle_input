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
  auction_invoice_initial: '',
  auction_invoice_actual: '',
  auction_payment_amount: '', auction_payment_date: '',
  customer: '', customer_payment_date: '', customer_payment_amount: '',
  cash_received: '',
  customer_due_date_auction: '', customer_due_date_transportation: '',
  customer_due_auction: '', customer_due_transportation: '', customer_due_insurance: '',
  auction_payment_status: '',
  dealer: '', dealer_amount: '', dealer_date: '',
  sub_dealer: '', sub_dealer_amount: '', sub_dealer_date: '',
  local_transportation_amount: '', local_transportation_due_date: '',
  local_transportation_payment_date: '',
  transportation_sales_amount: '', transportation_sales_due_date: '',
  ocean_freight: '', tch: '', auction_additional_charges: '', other_services: ''
};

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('vehicle_token') || ''}`
});

export default function VehicleForm() {
  const [form, setForm]           = useState(initialState);
  const [status, setStatus]       = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [makes, setMakes]         = useState([]);
  const [models, setModels]       = useState([]);
  const [bodies, setBodies]       = useState([]);
  const [dealers, setDealers]     = useState([]);
  const [subDealers, setSubDealers] = useState([]);

  useEffect(() => {
    const base = process.env.REACT_APP_API_URL || '';
    const h = { headers: authHeaders() };
    fetch(`${base}/api/options/makes`, h).then(r => r.json()).then(d => setMakes(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${base}/api/options/bodies`, h).then(r => r.json()).then(d => setBodies(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${base}/api/options/dealers`, h).then(r => r.json()).then(d => setDealers(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${base}/api/options/sub-dealers`, h).then(r => r.json()).then(d => setSubDealers(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    const base = process.env.REACT_APP_API_URL || '';
    const url = form.make
      ? `${base}/api/options/models?make=${encodeURIComponent(form.make)}`
      : `${base}/api/options/models`;
    fetch(url, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setModels(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [form.make]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value, ...(name === 'make' ? { model: '' } : {}) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/vehicles`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        let msg = `Server error ${res.status}`;
        try { const j = await res.json(); msg = j.error || msg; } catch {}
        throw new Error(msg);
      }
      setStatus('success');
      setShowPopup(true);
      setForm(initialState);
    } catch (err) {
      setStatus(err.message || 'error');
    } finally {
      setLoading(false);
    }
  };

  const field = (label, name, type = 'text', Icon = null) => (
    <div style={st.field}>
      <label style={st.label}>
        {Icon && <Icon style={st.labelIcon} />}
        {label}
      </label>
      <input
        style={st.input}
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
      />
    </div>
  );

  const dropdown = (label, name, options, Icon = null) => (
    <div style={st.field}>
      <label style={st.label}>
        {Icon && <Icon style={st.labelIcon} />}
        {label}
      </label>
      <select style={st.input} name={name} value={form[name]} onChange={handleChange}>
        <option value="">-- Select --</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );

  const searchableDropdown = (label, name, options, Icon = null, onChangeSideEffect = null) => (
    <SearchableDropdown
      label={label}
      Icon={Icon}
      options={options}
      value={form[name]}
      onChange={val => {
        setForm(f => ({ ...f, [name]: val }));
        if (onChangeSideEffect) onChangeSideEffect(val);
      }}
    />
  );

  return (
    <>
    <div style={st.page}>
      <div style={st.card}>
        <h2 style={st.title}>
          <FaCar style={{ marginRight: 10, color: '#4f46e5' }} />
          Vehicle Entry Form
        </h2>
        <form onSubmit={handleSubmit}>

          <Section title="Vehicle Info" color="#4f46e5">
            {field('Stock', 'stock', 'text', FaHashtag)}
            {field('Year', 'year', 'number', FaCalendarAlt)}
            {searchableDropdown('Make', 'make', makes.map(m => m.name), FaCar, () => setForm(f => ({ ...f, model: '' })))}
            {searchableDropdown('Model', 'model', models.map(m => m.name), FaSitemap)}
            {searchableDropdown('Body', 'body', bodies.map(b => b.name), FaTruck)}
            {field('VIN', 'vin', 'text', FaBarcode)}
            {field('Lot', 'lot', 'text', FaMapMarkerAlt)}
            {dropdown('Auc.', 'auction', ['Copart', 'IAAI'], FaGavel)}
            {dropdown('Product Type', 'product_type', ['eBay Dismantling', 'Export'], FaBoxOpen)}
            {form.product_type === 'Export' && searchableDropdown('Dealer', 'dealer', dealers.map(d => d.name), FaUser)}
            {form.product_type === 'Export' && field('Dealer Amount', 'dealer_amount', 'number', FaDollarSign)}
            {form.product_type === 'Export' && field('Dealer Date', 'dealer_date', 'date', FaCalendarCheck)}
            {form.product_type === 'Export' && searchableDropdown('Sub-Dealer', 'sub_dealer', subDealers.map(d => d.name), FaUser)}
            {form.product_type === 'Export' && field('Sub-Dealer Amount', 'sub_dealer_amount', 'number', FaDollarSign)}
            {form.product_type === 'Export' && field('Sub-Dealer Date', 'sub_dealer_date', 'date', FaCalendarCheck)}
          </Section>

          <Section title="Auc. Payment" color="#0891b2">
            {field('Auc Won Date', 'auc_won_date', 'date', FaCalendarCheck)}
            {field('Payment Due Date', 'payment_due_date', 'date', FaCalendarTimes)}
            {field('Auc. Due', 'auction_due', 'date', FaClock)}
            {field('Storage', 'storage', 'number', FaWarehouse)}
            {field('Auc. Invoice (Initial)', 'auction_invoice_initial', 'number', FaDollarSign)}
            {field('Auc. Invoice (Actual)', 'auction_invoice_actual', 'number', FaDollarSign)}
            {field('Auc. Payment Amount', 'auction_payment_amount', 'number', FaDollarSign)}
            {field('Auc. Payment Date', 'auction_payment_date', 'date', FaCalendarCheck)}
            {field('Auc. Additional Charges', 'auction_additional_charges', 'number', FaDollarSign)}
            {field('Other Services', 'other_services', 'number', FaDollarSign)}
            {dropdown('Auc. Payment Status', 'auction_payment_status', ['Pending', 'Paid', 'Overdue'], FaCheckCircle)}
          </Section>

          <Section title="Cust." color="#059669">
            {field('Cust.', 'customer', 'text', FaUser)}
            {field('Cust. Payment Date', 'customer_payment_date', 'date', FaCalendarCheck)}
            {field('Cust. Payment Amount', 'customer_payment_amount', 'number', FaDollarSign)}
            {dropdown('Cash Received', 'cash_received', ['USA', 'GEORGIA'], FaDollarSign)}
            {field('Cust. Due Date - Auc.', 'customer_due_date_auction', 'date', FaCalendarTimes)}
            {field('Cust. Due Date - Transp.', 'customer_due_date_transportation', 'date', FaCalendarTimes)}
            {field('Cust. Due - Auc.', 'customer_due_auction', 'number', FaDollarSign)}
            {field('Cust. Due - Transp.', 'customer_due_transportation', 'number', FaDollarSign)}
            {field('Cust. Due - Insurance', 'customer_due_insurance', 'number', FaDollarSign)}
          </Section>

          <Section title="Transp." color="#d97706">
            {field('Local Transp. Amount', 'local_transportation_amount', 'number', FaDollarSign)}
            {field('Local Transp. Due Date', 'local_transportation_due_date', 'date', FaCalendarTimes)}
            {field('Local Transp. Payment Date', 'local_transportation_payment_date', 'date', FaCalendarCheck)}
            {field('Transp. Sales Amount', 'transportation_sales_amount', 'number', FaShippingFast)}
            {field('Transp. Sales Due Date (by customer)', 'transportation_sales_due_date', 'date', FaCalendarTimes)}
            {field('Ocean Freight', 'ocean_freight', 'number', FaDollarSign)}
            {field('TCH', 'tch', 'number', FaDollarSign)}
          </Section>

          {status && status !== 'success' && (
            <p style={st.error}>{status}</p>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
            <button type="submit" style={st.button} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>

    {showPopup && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: '36px 40px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', minWidth: 280 }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>✅</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>Submitted Successfully!</h3>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: '#64748b' }}>Vehicle entry has been saved.</p>
          <button
            onClick={() => setShowPopup(false)}
            style={{ padding: '10px 36px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            OK
          </button>
        </div>
      </div>
    )}
    </>
  );
}

function SearchableDropdown({ label, Icon, options, value, onChange }) {
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
    <div style={st.field} ref={ref}>
      <label style={st.label}>
        {Icon && <Icon style={st.labelIcon} />}
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <div
          style={{ ...st.input, display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6 }}
          onClick={() => setOpen(o => !o)}
        >
          {open ? (
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              onClick={e => e.stopPropagation()}
              placeholder="Search…"
              style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, background: 'transparent', fontFamily: 'inherit', color: 'var(--text)' }}
            />
          ) : (
            <span style={{ flex: 1, color: value ? 'var(--text)' : 'var(--subtle)', fontSize: 14 }}>
              {value || '-- Select --'}
            </span>
          )}
          {value && !open && (
            <span onClick={clear} style={{ color: 'var(--subtle)', fontSize: 16, lineHeight: 1, padding: '0 2px', cursor: 'pointer' }}>×</span>
          )}
          <span style={{ color: 'var(--subtle)', fontSize: 10 }}>{open ? '▲' : '▼'}</span>
        </div>
        {open && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 160, overflowY: 'auto', marginTop: 4,
          }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '8px 12px', color: 'var(--subtle)', fontSize: 12 }}>No matches</div>
            ) : (
              filtered.map(opt => (
                <div
                  key={opt}
                  onMouseDown={() => select(opt)}
                  style={{
                    padding: '7px 12px', cursor: 'pointer', fontSize: 13,
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
    </div>
  );
}

function Section({ title, children, color }) {
  return (
    <div style={st.section}>
      <h3 style={{ ...st.sectionTitle, borderBottomColor: color, color }}>
        {title}
      </h3>
      <div style={st.grid}>{children}</div>
    </div>
  );
}

const st = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    display: 'flex',
    justifyContent: 'center',
    padding: '40px 16px',
  },
  card: {
    background: 'var(--surface)',
    borderRadius: 16,
    padding: 36,
    width: '100%',
    maxWidth: 920,
    boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
    border: '1px solid var(--border)',
  },
  title: {
    margin: '0 0 28px',
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'center',
  },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    borderBottom: '2px solid',
    paddingBottom: 8,
    marginBottom: 18,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
  },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: {
    fontSize: 12,
    color: 'var(--muted)',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelIcon: { color: '#4f46e5', fontSize: 11 },
  input: {
    padding: '9px 12px',
    border: '1px solid var(--input-border)',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    background: 'var(--input-bg)',
    color: 'var(--text)',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '12px 52px',
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.3,
    boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
  },
  success: { color: '#16a34a', marginBottom: 12, display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 600 },
  error: { color: '#dc2626', marginBottom: 12, fontSize: 14 },
};
