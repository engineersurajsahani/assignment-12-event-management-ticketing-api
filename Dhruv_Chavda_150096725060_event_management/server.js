const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');

// Load environment configuration
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI Documentation Endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '🎟️ Event Ticketing API Swagger Docs'
}));

// Root Health Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🎟️ Event Management & Ticketing REST API (Firebase & Swagger) is running',
    version: '1.0.0',
    documentation: {
      swaggerUi: '/api-docs',
      auth: '/api/auth',
      events: '/api/events',
      tickets: '/api/tickets'
    }
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route Not Found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Event Management API Server running on port ${PORT}`);
  console.log(`📚 Interactive Swagger API Docs available at http://localhost:${PORT}/api-docs`);
});

module.exports = app;
