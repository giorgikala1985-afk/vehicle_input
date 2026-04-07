const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── BULK IMPORT helper ─────────────────────────────────
async function bulkInsert(res, table, names) {
  const rows = names.filter(n => n && n.trim()).map(n => ({ name: n.trim() }));
  if (rows.length === 0) return res.status(400).json({ error: 'No valid names provided' });
  const { error } = await supabase.from(table).insert(rows);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ inserted: rows.length });
}

router.post('/makes/bulk',       async (req, res) => bulkInsert(res, 'vehicle_makes',   req.body.names || []));

// POST /api/options/linkmodels  { pairs: [{make, model}] }
router.post('/linkmodels', async (req, res) => {
  const pairs = req.body.pairs || [];
  if (pairs.length === 0) return res.status(400).json({ error: 'No pairs provided' });

  const unique = [...new Map(
    pairs.filter(p => p.make && p.model)
         .map(p => [`${p.make}||${p.model}`, { name: p.model, make_name: p.make }])
  ).values()];

  const { error } = await supabase
    .from('vehicle_models')
    .insert(unique);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ inserted: unique.length });
});
router.post('/models/bulk', async (req, res) => {
  if (req.body.pairs) {
    const pairs = req.body.pairs;
    const unique = [...new Map(
      pairs.filter(p => p.make && p.model)
           .map(p => [p.model, { name: p.model, make_name: p.make }])
    ).values()];
    if (unique.length === 0) return res.status(400).json({ error: 'No valid pairs' });
    const { error } = await supabase
      .from('vehicle_models')
      .upsert(unique, { onConflict: 'name', ignoreDuplicates: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ inserted: unique.length });
  }
  return bulkInsert(res, 'vehicle_models', req.body.names || []);
});
router.post('/bodies/bulk',      async (req, res) => bulkInsert(res, 'vehicle_bodies',  req.body.names || []));
router.post('/dealers/bulk', async (req, res) => {
  console.log('dealers/bulk body:', JSON.stringify(req.body).slice(0, 300));
  if (req.body.rows) {
    const rows = req.body.rows
      .filter(r => r.name && r.name.trim())
      .map(r => ({
        name: r.name.trim(),
        ...(r.loc_price !== undefined && r.loc_price !== '' ? { loc_price: r.loc_price } : {}),
        ...(r.inv_add   !== undefined && r.inv_add   !== '' ? { inv_add:   r.inv_add   } : {}),
      }));
    if (rows.length === 0) return res.status(400).json({ error: 'No valid rows provided' });
    const { error } = await supabase.from('dealers').insert(rows);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ inserted: rows.length });
  }
  return bulkInsert(res, 'dealers', req.body.names || []);
});
router.post('/sub-dealers/bulk', async (req, res) => {
  if (req.body.rows) {
    const rows = req.body.rows
      .filter(r => r.name && r.name.trim())
      .map(r => ({
        name: r.name.trim(),
        ...(r.loc_price !== undefined && r.loc_price !== '' ? { loc_price: r.loc_price } : {}),
        ...(r.inv_add   !== undefined && r.inv_add   !== '' ? { inv_add:   r.inv_add   } : {}),
      }));
    if (rows.length === 0) return res.status(400).json({ error: 'No valid rows provided' });
    const { error } = await supabase.from('sub_dealers').insert(rows);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ inserted: rows.length });
  }
  return bulkInsert(res, 'sub_dealers', req.body.names || []);
});
router.post('/dealer-jrs/bulk', async (req, res) => {
  if (req.body.rows) {
    const rows = req.body.rows
      .filter(r => r.name && r.name.trim())
      .map(r => ({
        name: r.name.trim(),
        ...(r.loc_price !== undefined && r.loc_price !== '' ? { loc_price: r.loc_price } : {}),
        ...(r.inv_add   !== undefined && r.inv_add   !== '' ? { inv_add:   r.inv_add   } : {}),
      }));
    if (rows.length === 0) return res.status(400).json({ error: 'No valid rows provided' });
    const { error } = await supabase.from('dealer_jrs').insert(rows);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ inserted: rows.length });
  }
  return bulkInsert(res, 'dealer_jrs', req.body.names || []);
});

// ── MAKES ──────────────────────────────────────────────
router.get('/makes', async (req, res) => {
  const { data, error } = await supabase.from('vehicle_makes').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/makes', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  const { data, error } = await supabase.from('vehicle_makes').insert([{ name: name.trim() }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/makes/:id', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  const { data, error } = await supabase.from('vehicle_makes').update({ name: name.trim() }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/makes/:id', async (req, res) => {
  const { error } = await supabase.from('vehicle_makes').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Deleted' });
});

// ── MODELS ─────────────────────────────────────────────
router.get('/models', async (req, res) => {
  let query = supabase.from('vehicle_models').select('*').order('name');
  if (req.query.make) query = query.eq('make_name', req.query.make);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/models', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  const { data, error } = await supabase.from('vehicle_models').insert([{ name: name.trim() }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/models/:id', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  const { data, error } = await supabase.from('vehicle_models').update({ name: name.trim() }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/models/:id', async (req, res) => {
  const { error } = await supabase.from('vehicle_models').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Deleted' });
});

// ── BODIES ─────────────────────────────────────────────
router.get('/bodies', async (req, res) => {
  const { data, error } = await supabase.from('vehicle_bodies').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/bodies', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  const { data, error } = await supabase.from('vehicle_bodies').insert([{ name: name.trim() }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/bodies/:id', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  const { data, error } = await supabase.from('vehicle_bodies').update({ name: name.trim() }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/bodies/:id', async (req, res) => {
  const { error } = await supabase.from('vehicle_bodies').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Deleted' });
});

// ── DEALERS ────────────────────────────────────────────
router.get('/dealers', async (req, res) => {
  const { data, error } = await supabase.from('dealers').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
router.post('/dealers', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  const { data, error } = await supabase.from('dealers').insert([{ name: name.trim() }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});
router.put('/dealers/:id', async (req, res) => {
  const { name, loc_price, inv_add } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  const updates = { name: name.trim() };
  if (loc_price !== undefined) updates.loc_price = loc_price === '' ? null : Number(loc_price);
  if (inv_add   !== undefined) updates.inv_add   = inv_add   === '' ? null : Number(inv_add);
  const { data, error } = await supabase.from('dealers').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
router.delete('/dealers/:id', async (req, res) => {
  const { error } = await supabase.from('dealers').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Deleted' });
});

// ── SUB-DEALERS ─────────────────────────────────────────
router.get('/sub-dealers', async (req, res) => {
  const { data, error } = await supabase.from('sub_dealers').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
router.post('/sub-dealers', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  const { data, error } = await supabase.from('sub_dealers').insert([{ name: name.trim() }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});
router.put('/sub-dealers/:id', async (req, res) => {
  const { name, loc_price, inv_add } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  const updates = { name: name.trim() };
  if (loc_price !== undefined) updates.loc_price = loc_price === '' ? null : Number(loc_price);
  if (inv_add   !== undefined) updates.inv_add   = inv_add   === '' ? null : Number(inv_add);
  const { data, error } = await supabase.from('sub_dealers').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
router.delete('/sub-dealers/:id', async (req, res) => {
  const { error } = await supabase.from('sub_dealers').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Deleted' });
});

// ── DEALER JRS ──────────────────────────────────────────
router.get('/dealer-jrs', async (req, res) => {
  const { data, error } = await supabase.from('dealer_jrs').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
router.post('/dealer-jrs', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  const { data, error } = await supabase.from('dealer_jrs').insert([{ name: name.trim() }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});
router.put('/dealer-jrs/:id', async (req, res) => {
  const { name, loc_price, inv_add } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  const updates = { name: name.trim() };
  if (loc_price !== undefined) updates.loc_price = loc_price === '' ? null : Number(loc_price);
  if (inv_add   !== undefined) updates.inv_add   = inv_add   === '' ? null : Number(inv_add);
  const { data, error } = await supabase.from('dealer_jrs').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
router.delete('/dealer-jrs/:id', async (req, res) => {
  const { error } = await supabase.from('dealer_jrs').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Deleted' });
});

module.exports = router;
