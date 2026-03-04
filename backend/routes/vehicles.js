const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const toNull = (v) => (v === '' || v === undefined) ? null : v;
const toNum  = (v) => (v === '' || v === undefined || v === null) ? null : Number(v);

// POST /api/vehicles - create a new vehicle entry
router.post('/', async (req, res) => {
  const b = req.body;

  const { data, error } = await supabase
    .from('vehicles')
    .insert([{
      stock:    toNull(b.stock),
      year:     toNum(b.year),
      make:     toNull(b.make),
      model:    toNull(b.model),
      body:     toNull(b.body),
      vin:      toNull(b.vin),
      lot:      toNull(b.lot),
      auction:  toNull(b.auction),
      product_type: toNull(b.product_type),
      auc_won_date:  toNull(b.auc_won_date),
      payment_due_date: toNull(b.payment_due_date),
      auction_due: toNull(b.auction_due),
      storage:  toNum(b.storage),
      auction_payment_amount: toNum(b.auction_payment_amount),
      auction_payment_date:   toNull(b.auction_payment_date),
      customer: toNull(b.customer),
      customer_payment_date:   toNull(b.customer_payment_date),
      customer_payment_amount: toNum(b.customer_payment_amount),
      local_transportation_amount:        toNum(b.local_transportation_amount),
      local_transportation_due_date:      toNull(b.local_transportation_due_date),
      local_transportation_payment_date:  toNull(b.local_transportation_payment_date),
      transportation_sales_amount:        toNum(b.transportation_sales_amount),
      transportation_sales_due_date:      toNull(b.transportation_sales_due_date)
    }]);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

// GET /api/vehicles - list all vehicle entries
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

module.exports = router;
