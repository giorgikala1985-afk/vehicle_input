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
      auction_invoice_initial: toNum(b.auction_invoice_initial),
      auction_invoice_actual: toNum(b.auction_invoice_actual),
      auction_payment_amount: toNum(b.auction_payment_amount),
      auction_payment_date:   toNull(b.auction_payment_date),
      auction_payment_status: toNull(b.auction_payment_status),
      customer: toNull(b.customer),
      customer_payment_date:   toNull(b.customer_payment_date),
      customer_payment_amount: toNum(b.customer_payment_amount),
      cash_received: toNull(b.cash_received),
      customer_due_date_auction:        toNull(b.customer_due_date_auction),
      customer_due_date_transportation: toNull(b.customer_due_date_transportation),
      customer_due_auction:        toNum(b.customer_due_auction),
      customer_due_transportation: toNum(b.customer_due_transportation),
      customer_due_insurance:      toNum(b.customer_due_insurance),
      local_transportation_amount:        toNum(b.local_transportation_amount),
      local_transportation_due_date:      toNull(b.local_transportation_due_date),
      local_transportation_payment_date:  toNull(b.local_transportation_payment_date),
      transportation_sales_amount:        toNum(b.transportation_sales_amount),
      transportation_sales_due_date:      toNull(b.transportation_sales_due_date),
      dealer:                             toNull(b.dealer),
      dealer_amount:                      toNum(b.dealer_amount),
      dealer_date:                        toNull(b.dealer_date),
      sub_dealer:                         toNull(b.sub_dealer),
      sub_dealer_amount:                  toNum(b.sub_dealer_amount),
      sub_dealer_date:                    toNull(b.sub_dealer_date),
      ocean_freight:                      toNum(b.ocean_freight),
      tch:                                toNum(b.tch),
      auction_additional_charges:         toNum(b.auction_additional_charges),
      other_services:                     toNum(b.other_services),
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

// PUT /api/vehicles/:id
router.put('/:id', async (req, res) => {
  const b = req.body;
  const { error } = await supabase
    .from('vehicles')
    .update({
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
      auction_invoice_initial: toNum(b.auction_invoice_initial),
      auction_invoice_actual: toNum(b.auction_invoice_actual),
      auction_payment_amount: toNum(b.auction_payment_amount),
      auction_payment_date:   toNull(b.auction_payment_date),
      auction_payment_status: toNull(b.auction_payment_status),
      customer: toNull(b.customer),
      customer_payment_date:   toNull(b.customer_payment_date),
      customer_payment_amount: toNum(b.customer_payment_amount),
      cash_received: toNull(b.cash_received),
      customer_due_date_auction:        toNull(b.customer_due_date_auction),
      customer_due_date_transportation: toNull(b.customer_due_date_transportation),
      customer_due_auction:        toNum(b.customer_due_auction),
      customer_due_transportation: toNum(b.customer_due_transportation),
      customer_due_insurance:      toNum(b.customer_due_insurance),
      local_transportation_amount:        toNum(b.local_transportation_amount),
      local_transportation_due_date:      toNull(b.local_transportation_due_date),
      local_transportation_payment_date:  toNull(b.local_transportation_payment_date),
      transportation_sales_amount:        toNum(b.transportation_sales_amount),
      transportation_sales_due_date:      toNull(b.transportation_sales_due_date),
      dealer:                             toNull(b.dealer),
      dealer_amount:                      toNum(b.dealer_amount),
      dealer_date:                        toNull(b.dealer_date),
      sub_dealer:                         toNull(b.sub_dealer),
      sub_dealer_amount:                  toNum(b.sub_dealer_amount),
      sub_dealer_date:                    toNull(b.sub_dealer_date),
      ocean_freight:                      toNum(b.ocean_freight),
      tch:                                toNum(b.tch),
      auction_additional_charges:         toNum(b.auction_additional_charges),
      other_services:                     toNum(b.other_services),
    })
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// DELETE /api/vehicles/:id
router.delete('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', req.params.id)
    .select();

  console.log('DELETE', req.params.id, { data, error });
  if (error) return res.status(400).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: 'Row not found or RLS blocked delete' });
  res.json({ success: true });
});

// POST /api/vehicles/bulk - import multiple vehicles from Excel
router.post('/bulk', async (req, res) => {
  const rows = req.body;
  if (!Array.isArray(rows) || rows.length === 0)
    return res.status(400).json({ error: 'No rows provided.' });

  const records = rows.map(b => ({
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
    cash_received: toNull(b.cash_received),
    local_transportation_amount:        toNum(b.local_transportation_amount),
    local_transportation_due_date:      toNull(b.local_transportation_due_date),
    local_transportation_payment_date:  toNull(b.local_transportation_payment_date),
    transportation_sales_amount:        toNum(b.transportation_sales_amount),
    transportation_sales_due_date:      toNull(b.transportation_sales_due_date),
    dealer:        toNull(b.dealer),
    dealer_amount: toNum(b.dealer_amount),
    dealer_date:   toNull(b.dealer_date),
    sub_dealer:        toNull(b.sub_dealer),
    sub_dealer_amount: toNum(b.sub_dealer_amount),
    sub_dealer_date:   toNull(b.sub_dealer_date),
    ocean_freight:               toNum(b.ocean_freight),
    tch:                         toNum(b.tch),
    auction_additional_charges:  toNum(b.auction_additional_charges),
    other_services:              toNum(b.other_services),
  }));

  const { data, error } = await supabase.from('vehicles').insert(records);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, inserted: records.length });
});

module.exports = router;
