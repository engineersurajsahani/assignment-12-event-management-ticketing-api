const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Management & Ticketing API',
      version: '1.0.0',
      description:
        'A production-quality REST API for event creation, ticket inventory booking with atomic transactions to prevent overselling, role-based access control (JWT RBAC), rate limiting, and comprehensive OpenAPI documentation.',
      contact: {
        name: 'API Support Team',
        email: 'support@eventticketing.dev'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5050}`,
        description: 'Local Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'usr_abc123' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            role: { type: 'string', enum: ['organizer', 'attendee'], example: 'attendee' },
            createdAt: { type: 'string', format: 'date-time', example: '2026-09-08T10:00:00.000Z' }
          }
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'evt_tech_2026' },
            title: { type: 'string', example: 'Tech Innovation Summit 2026' },
            description: { type: 'string', example: 'Keynotes and workshops on latest tech trends.' },
            category: { type: 'string', example: 'Technology' },
            eventDate: { type: 'string', format: 'date-time', example: '2026-11-20T10:00:00.000Z' },
            venue: { type: 'string', example: 'Grand Convention Center, Mumbai' },
            organizerId: { type: 'string', example: 'usr_org_123' },
            ticketPrice: { type: 'number', example: 49.99 },
            totalCapacity: { type: 'integer', example: 100 },
            availableTickets: { type: 'integer', example: 95 },
            createdAt: { type: 'string', format: 'date-time', example: '2026-09-08T10:00:00.000Z' }
          }
        },
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'tkt_9824058' },
            eventId: { type: 'string', example: 'evt_tech_2026' },
            eventTitle: { type: 'string', example: 'Tech Innovation Summit 2026' },
            userId: { type: 'string', example: 'usr_att_49204' },
            attendeeName: { type: 'string', example: 'John Doe' },
            attendeeEmail: { type: 'string', format: 'email', example: 'john@example.com' },
            quantity: { type: 'integer', example: 2 },
            totalPaid: { type: 'number', example: 99.98 },
            bookingRef: { type: 'string', example: 'TKT-485921AB' },
            status: { type: 'string', enum: ['confirmed', 'cancelled'], example: 'confirmed' },
            bookedAt: { type: 'string', format: 'date-time', example: '2026-09-08T12:00:00.000Z' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error description message' }
          }
        }
      }
    }
  },
  apis: [path.resolve(__dirname, '../routes/*.js')]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
