const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Management & Ticketing REST API',
      version: '1.0.0',
      description:
        'High-concurrency Event Ticketing & Live Booking REST API backed by Firebase Firestore, secured with Role-Based Access Control and strict Rate Limiting. Implemented by Raj Rasal (150096725066).',
      contact: {
        name: 'Raj Rasal',
        email: 'rajrasal@itm.edu'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
