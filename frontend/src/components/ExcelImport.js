import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('vehicle_token') || ''}`,
});

export default function ExcelImport() {
  const [rows, setRows]       = useState(null);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult]   = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setResult(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb   = XLSX.read(e.target.result, { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
        setRows(data);
      } catch (err) {
        setResult({ error: 'Failed to parse file: ' + err.message });
        setRows(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleImport = async () => {
    if (!rows || rows.length === 0) return;
    setImporting(true);
    setResult(null);

    try {
      const makes = [...new Set(rows.map(r => String(r['Make'] || '').trim()).filter(Boolean))];

      let makesInserted = 0, modelsInserted = 0, errors = [];

      if (makes.length > 0) {
        const { error } = await supabase
          .from('vehicle_makes')
          .upsert(makes.map(name => ({ name })), { onConflict: 'name', ignoreDuplicates: true });
        if (error) errors.push('Makes: ' + error.message);
        else makesInserted = makes.length;
      }

      if (rows.length > 0) {
        const pairs = rows
          .map(r => ({ make: String(r['Make'] || '').trim(), model: String(r['Model'] || '').trim() }))
          .filter(r => r.make && r.model);

        const CHUNK = 200;
        for (let i = 0; i < pairs.length; i += CHUNK) {
          const chunk = pairs.slice(i, i + CHUNK);
          const res2 = await fetch('/api/options/models/bulk', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ pairs: chunk }),
          });
          const text = await res2.text();
          let d;
          try { d = JSON.parse(text); } catch { throw new Error(`Server error ${res2.status}: ${text.slice(0, 100)}`); }
          if (!res2.ok) { errors.push('Models: ' + (d.error || 'Failed')); break; }
          modelsInserted += chunk.length;
        }
      }

      if (errors.length > 0) {
        setResult({ error: errors.join(' | ') });
      } else {
        setResult({ success: true, makesInserted, modelsInserted });
        setRows(null);
        setFileName('');
      }
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setImporting(false);
    }
  };

  const reset = () => { setRows(null); setFileName(''); setResult(null); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ width: '100%', maxWidth: 700 }}>

        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10 }}>
            📥 Import Makes & Models
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 14 }}>
            Upload an Excel file with <strong>Make</strong> and <strong>Model</strong> columns.
          </p>
        </div>

        {/* Result */}
        {result?.success && (
          <div style={{ padding: '12px 18px', background: 'rgba(22,163,74,0.12)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.3)', borderRadius: 10, fontSize: 14, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            ✅ Imported {result.makesInserted} makes and {result.modelsInserted} models!
            <button onClick={reset} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontWeight: 700, fontSize: 13 }}>Import another</button>
          </div>
        )}
        {result?.error && (
          <div style={{ padding: '12px 18px', background: 'rgba(220,38,38,0.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 10, fontSize: 14, marginBottom: 20 }}>
            ❌ {result.error}
          </div>
        )}

        {/* Upload zone */}
        {!rows && (
          <>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragOver ? '#4f46e5' : 'var(--border)'}`,
                borderRadius: 14, background: dragOver ? 'rgba(79,70,229,0.06)' : 'var(--surface)',
                padding: '56px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Click to choose or drag & drop</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>.xlsx or .xls — needs "Make" and "Model" columns</div>
            </div>
          </>
        )}

        {/* Preview */}
        {rows && rows.length > 0 && (
          <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{fileName}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                  {rows.length} rows · {[...new Set(rows.map(r => r['Make']).filter(Boolean))].length} unique makes · {[...new Set(rows.map(r => r['Model']).filter(Boolean))].length} unique models
                </div>
              </div>
              <button onClick={reset} style={{ padding: '6px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface2)', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Change file
              </button>
              <button onClick={handleImport} disabled={importing} style={{ padding: '8px 22px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: importing ? 'not-allowed' : 'pointer', opacity: importing ? 0.7 : 1, fontFamily: 'inherit' }}>
                {importing ? 'Importing…' : 'Import to Supabase'}
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  <th style={{ padding: '9px 20px', textAlign: 'left', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)', borderBottom: '2px solid var(--border)' }}>Make</th>
                  <th style={{ padding: '9px 20px', textAlign: 'left', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)', borderBottom: '2px solid var(--border)' }}>Model</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                    <td style={{ padding: '8px 20px', color: 'var(--text)' }}>{row['Make'] || '—'}</td>
                    <td style={{ padding: '8px 20px', color: 'var(--text)' }}>{row['Model'] || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {rows.length > 10 && (
              <div style={{ padding: '10px 20px', color: 'var(--muted)', fontSize: 13, borderTop: '1px solid var(--border)' }}>
                + {rows.length - 10} more rows not shown
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
