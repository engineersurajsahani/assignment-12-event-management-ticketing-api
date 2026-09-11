const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Assignment 12 - Event Management & Ticketing API',
      version: '1.0.0',
      description:
        'High-concurrency event ticketing REST API using Firebase Firestore transactions, JWT RBAC, rate limiting and Swagger.'
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Local server' }
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
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'Pallavi Sarovar' },
            email: { type: 'string', format: 'email', example: 'pallavi@example.com' },
            password: { type: 'string', format: 'password', example: 'Password123!' },
            role: { type: 'string', enum: ['attendee', 'organizer'], example: 'attendee' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'pallavi@example.com' },
            password: { type: 'string', format: 'password', example: 'Password123!' }
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
            city: { type: 'string' },
            organizerId: { type: 'string' },
            ticketPrice: { type: 'number' },
            totalCapacity: { type: 'integer' },
            availableTickets: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        BookingRequest: {
          type: 'object',
          required: ['eventId', 'quantity', 'attendeeName', 'attendeeEmail'],
          properties: {
            eventId: { type: 'string', example: 'event_techconf_2026' },
            quantity: { type: 'integer', minimum: 1, example: 2 },
            attendeeName: { type: 'string', example: 'Kunal Sharma' },
            attendeeEmail: { type: 'string', format: 'email', example: 'kunal@gmail.com' }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

module.exports = swaggerJSDoc(options);