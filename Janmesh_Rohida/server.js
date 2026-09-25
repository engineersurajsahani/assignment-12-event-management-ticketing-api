const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const { swaggerSpec, customCss } = require('./config/swagger');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Swagger UI Route with custom Coffee Brown theme
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customCss }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Event Management & Ticketing API is operational' });
});

// Centralized Error-Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Interactive Swagger API Docs: http://localhost:${PORT}/api-docs`);
});

module.exports = app;
