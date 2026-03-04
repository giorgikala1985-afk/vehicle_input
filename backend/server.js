require('dotenv').config();
const express = require('express');
const cors = require('cors');

const vehicleRoutes = require('./routes/vehicles');
const optionsRoutes = require('./routes/options');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/vehicles', vehicleRoutes);
app.use('/api/options', optionsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
