const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'vehicle-app-secret-key';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  // Check if email already registered
  const { data: existing } = await supabase.from('app_users').select('id, password_hash').eq('email', email).single();
  if (existing?.password_hash) return res.status(400).json({ error: 'This account is already registered. Please sign in.' });

  const password_hash = await bcrypt.hash(password, 10);

  let user;
  if (existing) {
    // Email already in app_users (added by admin) — just set password
    const { data, error } = await supabase.from('app_users').update({ password_hash }).eq('id', existing.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    user = data;
  } else {
    // New user — create record
    const { data, error } = await supabase.from('app_users').insert([{ email, password_hash }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    user = data;
  }

  const token = jwt.sign({ id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role || 'member' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role || 'member' } });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const { data: user, error: findErr } = await supabase
    .from('app_users').select('*').eq('email', email).single();

  if (findErr || !user) return res.status(401).json({ error: 'Invalid email or password.' });
  if (!user.password_hash) return res.status(401).json({ error: 'Account not registered yet. Please register first.' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

  const token = jwt.sign({ id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role || 'member' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role || 'member' } });
});

module.exports = router;
