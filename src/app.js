const config = require('./config');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const contactRoutes = require('./routes/contactRoutes');
const eventRoutes = require('./routes/eventRoutes');
const financialRoutes = require('./routes/financialRoutes');
const processRoutes = require('./routes/processRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');

const app = express();

app.post('/api/subscriptions/webhook', express.raw({ type: 'application/json' }), subscriptionRoutes);

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/financials', financialRoutes);
app.use('/api/processos', processRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

module.exports = app;