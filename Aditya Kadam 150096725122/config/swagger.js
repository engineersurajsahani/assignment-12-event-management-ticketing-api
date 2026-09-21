const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Management & Ticketing API',
      version: '1.0.0',
      description: 'REST API for event ticketing and live booking with Firebase Firestore, featuring role-based access control, atomic transactions, and rate limiting'
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['Organizer', 'Attendee'] },
            createdAt: { type: 'string', format: 'date-time' }
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
            availableTickets: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' }
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
            attendeeEmail: { type: 'string', format: 'email' },
            quantity: { type: 'integer' },
            totalPaid: { type: 'number' },
            bookingRef: { type: 'string' },
            status: { type: 'string', enum: ['confirmed', 'cancelled'] },
            bookedAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
