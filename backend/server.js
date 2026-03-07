require('dotenv').config();
const express = require('express');
const cors = require('cors');

const vehicleRoutes = require('./routes/vehicles');
const optionsRoutes = require('./routes/options');
const userRoutes    = require('./routes/users');
const authRoutes    = require('./routes/auth');
const authenticate  = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', authenticate, vehicleRoutes);
app.use('/api/options', authenticate, optionsRoutes);
app.use('/api/users', authenticate, userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
