const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('app_users').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { first_name, last_name, email, phone } = req.body;
  if (!first_name || !email) return res.status(400).json({ error: 'First name and email are required.' });
  const { data, error } = await supabase.from('app_users').insert([{ first_name, last_name, email, phone }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', async (req, res) => {
  const { first_name, last_name, email, phone, role } = req.body;
  if (!first_name || !email) return res.status(400).json({ error: 'First name and email are required.' });
  const update = { first_name, last_name, email, phone };
  if (role === 'admin' || role === 'member') update.role = role;
  const { data, error } = await supabase.from('app_users').update(update).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('app_users').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Deleted' });
});

module.exports = router;
