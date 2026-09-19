require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const setupSwagger = require('./config/swagger');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(logger);

setupSwagger(app);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Event Management & Ticketing REST API is running',
    student: {
      name: 'Samarth Navale',
      roll_no: '150096725148',
      cohort: 'Sam Altman'
    },
    docs: '/api-docs',
    endpoints: {
      auth: ['POST /api/auth/register', 'POST /api/auth/login', 'GET /api/auth/profile'],
      events: [
        'GET /api/events',
        'GET /api/events/:id',
        'POST /api/events',
        'PUT /api/events/:id',
        'DELETE /api/events/:id',
        'GET /api/events/:id/attendees'
      ],
      tickets: [
        'POST /api/tickets/book',
        'GET /api/tickets/my-tickets',
        'POST /api/tickets/:id/cancel'
      ]
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Event Ticketing API running on port ${PORT}`);
  });
}

module.exports = app;
