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

router.post('/makes/bulk',  async (req, res) => bulkInsert(res, 'vehicle_makes',  req.body.names || []));
router.post('/models/bulk', async (req, res) => bulkInsert(res, 'vehicle_models', req.body.names || []));
router.post('/bodies/bulk', async (req, res) => bulkInsert(res, 'vehicle_bodies', req.body.names || []));

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
  const { data, error } = await supabase.from('vehicle_models').select('*').order('name');
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

module.exports = router;
