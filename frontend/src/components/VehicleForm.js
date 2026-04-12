import { useState, useEffect, useRef } from 'react';
import { loadFieldOrder } from './OptionsPage';
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
  ocean_freight: '', tch: '', auction_additional_charges: '', other_services: '',
  price_car_invoice_cost: '', price_car_price: '', price_client_price: '', price_transport_base: '',
  price_dealer: '', price_dealer_additional: '', price_dealer_invoice_additional: '',
  price_sub_dealer: '', price_sub_dealer_additional: '', price_sub_dealer_invoice_additional: '',
  price_dealer_jr: '', price_dealer_jr_additional: '', price_dealer_jr_invoice_additional: '',
};

const authHeaders = () => ({
  'Content-Type': 'application/json',
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
  const [dealerJrs, setDealerJrs] = useState([]);

  useEffect(() => {
    const base = process.env.REACT_APP_API_URL || '';
    const h = { headers: authHeaders() };
    fetch(`${base}/api/options/makes`, h).then(r => r.json()).then(d => setMakes(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${base}/api/options/bodies`, h).then(r => r.json()).then(d => setBodies(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${base}/api/options/dealers`, h).then(r => r.json()).then(d => setDealers(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${base}/api/options/sub-dealers`, h).then(r => r.json()).then(d => setSubDealers(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${base}/api/options/dealer-jrs`, h).then(r => r.json()).then(d => setDealerJrs(Array.isArray(d) ? d : [])).catch(() => {});
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

  const priceGroup = (label, mainName, addName, invName, dropdownOpts = null, fullItems = null) => (
    <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
      {dropdownOpts
        ? searchableDropdown(label, mainName, dropdownOpts, FaUser, fullItems ? (val) => {
            const found = fullItems.find(d => d.name === val);
            if (found) {
              setForm(f => ({
                ...f,
                [addName]: found.loc_price != null ? String(found.loc_price) : f[addName],
                [invName]: found.inv_add  != null ? String(found.inv_add)   : f[invName],
              }));
            }
          } : null)
        : field(label, mainName, 'number', FaDollarSign)}
      {field('Additional', addName, 'number', FaDollarSign)}
      {field('Invoice Additional', invName, 'number', FaDollarSign)}
    </div>
  );

  const field = (label, name, type = 'text', Icon = null, required = false) => (
    <div style={st.field}>
      <label style={st.label}>
        {Icon && <Icon style={st.labelIcon} />}
        {label}
        {required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
      </label>
      <input
        style={{ ...st.input, borderColor: required ? '#fca5a580' : undefined }}
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        required={required}
      />
    </div>
  );

  const dropdown = (label, name, options, Icon = null, required = false) => (
    <div style={st.field}>
      <label style={st.label}>
        {Icon && <Icon style={st.labelIcon} />}
        {label}
        {required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
      </label>
      <select style={{ ...st.input, borderColor: required ? '#fca5a580' : undefined }} name={name} value={form[name]} onChange={handleChange} required={required}>
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

          {loadFieldOrder().map(section => {
            const renderField = (f) => {
              const req = !!f.required;
              switch (f.key) {
                case 'stock':    return field('Stock', 'stock', 'text', FaHashtag, req);
                case 'year':     return field('Year', 'year', 'number', FaCalendarAlt, req);
                case 'make':     return searchableDropdown('Make', 'make', makes.map(m => m.name), FaCar, () => setForm(fv => ({ ...fv, model: '' })));
                case 'model':    return searchableDropdown('Model', 'model', models.map(m => m.name), FaSitemap);
                case 'body':     return searchableDropdown('Body', 'body', bodies.map(b => b.name), FaTruck);
                case 'vin':      return field('VIN', 'vin', 'text', FaBarcode, req);
                case 'lot':      return field('Lot', 'lot', 'text', FaMapMarkerAlt, req);
                case 'auction':  return dropdown('Auc.', 'auction', ['Copart', 'IAAI'], FaGavel, req);
                case 'product_type': return dropdown('Product Type', 'product_type', ['eBay Dismantling', 'Export'], FaBoxOpen, req);
                case 'auc_won_date': return field('Auc Won Date', 'auc_won_date', 'date', FaCalendarCheck, req);
                case 'payment_due_date': return field('Payment Due Date', 'payment_due_date', 'date', FaCalendarTimes, req);
                case 'auction_due': return field('Auc. Due', 'auction_due', 'date', FaClock, req);
                case 'storage':  return field('Storage', 'storage', 'number', FaWarehouse, req);
                case 'auction_invoice_initial': return field('Auc. Invoice (Initial)', 'auction_invoice_initial', 'number', FaDollarSign, req);
                case 'auction_invoice_actual':  return field('Auc. Invoice (Actual)', 'auction_invoice_actual', 'number', FaDollarSign, req);
                case 'auction_payment_amount':  return field('Auc. Payment Amount', 'auction_payment_amount', 'number', FaDollarSign, req);
                case 'auction_payment_date':    return field('Auc. Payment Date', 'auction_payment_date', 'date', FaCalendarCheck, req);
                case 'auction_additional_charges': return field('Auc. Additional Charges', 'auction_additional_charges', 'number', FaDollarSign, req);
                case 'other_services': return field('Other Services', 'other_services', 'number', FaDollarSign, req);
                case 'auction_payment_status':  return dropdown('Auc. Payment Status', 'auction_payment_status', ['Pending', 'Paid', 'Overdue'], FaCheckCircle, req);
                case 'customer': return field('Cust.', 'customer', 'text', FaUser, req);
                case 'customer_payment_date':   return field('Cust. Payment Date', 'customer_payment_date', 'date', FaCalendarCheck, req);
                case 'customer_payment_amount': return field('Cust. Payment Amount', 'customer_payment_amount', 'number', FaDollarSign, req);
                case 'cash_received': return dropdown('Cash Received', 'cash_received', ['USA', 'GEORGIA'], FaDollarSign, req);
                case 'customer_due_date_auction': return field('Cust. Due Date - Auc.', 'customer_due_date_auction', 'date', FaCalendarTimes, req);
                case 'customer_due_date_transportation': return field('Cust. Due Date - Transp.', 'customer_due_date_transportation', 'date', FaCalendarTimes, req);
                case 'customer_due_auction': return field('Cust. Due - Auc.', 'customer_due_auction', 'number', FaDollarSign, req);
                case 'customer_due_transportation': return field('Cust. Due - Transp.', 'customer_due_transportation', 'number', FaDollarSign, req);
                case 'customer_due_insurance': return field('Cust. Due - Insurance', 'customer_due_insurance', 'number', FaDollarSign, req);
                case 'local_transportation_amount': return field('Local Transp. Amount', 'local_transportation_amount', 'number', FaDollarSign, req);
                case 'local_transportation_due_date': return field('Local Transp. Due Date', 'local_transportation_due_date', 'date', FaCalendarTimes, req);
                case 'local_transportation_payment_date': return field('Local Transp. Payment Date', 'local_transportation_payment_date', 'date', FaCalendarCheck, req);
                case 'transportation_sales_amount': return field('Transp. Sales Amount', 'transportation_sales_amount', 'number', FaShippingFast, req);
                case 'transportation_sales_due_date': return field('Transp. Sales Due Date', 'transportation_sales_due_date', 'date', FaCalendarTimes, req);
                case 'ocean_freight': return field('Ocean Freight', 'ocean_freight', 'number', FaDollarSign, req);
                case 'tch':      return field('TCH', 'tch', 'number', FaDollarSign, req);
                case 'price_car_invoice_cost': return field('Car Invoice Cost', 'price_car_invoice_cost', 'number', FaDollarSign, req);
                case 'price_car_price':   return field('Car Price', 'price_car_price', 'number', FaDollarSign, req);
                case 'price_client_price': return field('Client Price', 'price_client_price', 'number', FaDollarSign, req);
                case 'price_transport_base': return field('Transport Base Price', 'price_transport_base', 'number', FaDollarSign, req);
                case 'price_dealer':     return form.product_type === 'Export' ? priceGroup('Dealer', 'price_dealer', 'price_dealer_additional', 'price_dealer_invoice_additional', dealers.map(d => d.name), dealers) : null;
                case 'price_sub_dealer': return form.product_type === 'Export' ? priceGroup('Sub-dealer', 'price_sub_dealer', 'price_sub_dealer_additional', 'price_sub_dealer_invoice_additional', subDealers.map(d => d.name)) : null;
                case 'price_dealer_jr':  return form.product_type === 'Export' ? priceGroup('Dealer Jr.', 'price_dealer_jr', 'price_dealer_jr_additional', 'price_dealer_jr_invoice_additional', dealerJrs.map(d => d.name)) : null;
                default: return null;
              }
            };
            return (
              <Section key={section.key} title={section.label} color={section.color}>
                {section.fields.map(f => (
                  <div key={f.key}>{renderField(f)}</div>
                ))}
              </Section>
            );
          })}

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
