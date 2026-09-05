const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '🎟️ Event Management & Live Ticketing REST API',
      version: '1.0.0',
      description: 'Production-ready Event Management & Ticketing REST API backed by Firebase Firestore, featuring JWT RBAC, rate-limited bot protection, and transactional booking.'
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from /api/auth/login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['Attendee', 'Organizer'] }
          }
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            eventDate: { type: 'string', format: 'date-time' },
            venue: { type: 'string' },
            organizerId: { type: 'string' },
            ticketPrice: { type: 'number' },
            totalCapacity: { type: 'integer' },
            availableTickets: { type: 'integer' }
          }
        },
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            eventId: { type: 'string' },
            eventTitle: { type: 'string' },
            userId: { type: 'string' },
            attendeeName: { type: 'string' },
            attendeeEmail: { type: 'string' },
            quantity: { type: 'integer' },
            totalPaid: { type: 'number' },
            bookingRef: { type: 'string' },
            status: { type: 'string', enum: ['confirmed', 'cancelled'] },
            bookedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
