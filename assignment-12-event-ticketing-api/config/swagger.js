const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Assignment 12 — Event Management & Ticketing API',
      version: '1.0.0',
      description:
        'High-concurrency Event Ticketing & Live Booking REST API backed by Google Firebase Firestore. ' +
        'Secured with JWT Role-Based Access Control (Organizer vs Attendee), hardened with API Rate Limiting ' +
        'to prevent ticket-scalping bots, and uses Firestore atomic transactions (runTransaction) so tickets are never oversold.',
      contact: {
        name: 'Daksh Ghandat',
        email: 'dakshghandat@gmail.com'
      }
    },
    servers: [
      { url: `http://localhost:${process.env.PORT || 5001}`, description: 'Local development server' }
    ],
    tags: [
      { name: 'Auth', description: 'Authentication & profile endpoints' },
      { name: 'Events', description: 'Event management (Organizer) & browsing (Public)' },
      { name: 'Tickets', description: 'Ticket booking & scalper protection (Attendee)' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

module.exports = swaggerJsdoc(options);