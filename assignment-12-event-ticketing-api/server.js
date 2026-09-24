require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const { generalLimiter } = require('./middleware/rateLimiter');

const { db } = require('./config/firebaseConfig');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(generalLimiter);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Event Management & Ticketing API is running',
    docs: '/api-docs'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customSiteTitle: 'Event Ticketing API — Swagger Docs'
}));

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

db.collection('events').limit(1).get()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Firestore connected successfully`);
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Swagger docs:  http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to Firestore:', error.message);
    process.exit(1);
  });