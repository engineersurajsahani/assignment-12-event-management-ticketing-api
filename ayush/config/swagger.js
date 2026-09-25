const swaggerJSDoc = require('swagger-jsdoc');

const PORT = process.env.PORT || 5000;

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Event Management & Ticketing API',
    version: '1.0.0',
    description:
      'A high-concurrency Event Ticketing & Live Booking REST API backed by Firebase Firestore, ' +
      'secured with JWT Role-Based Access Control (Organizer vs Attendee), hardened with rate ' +
      'limiting on booking routes, and documented with OpenAPI 3.0.'
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: 'Local development server'
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
      Event: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'event_techconf_2026' },
          title: { type: 'string', example: 'Global Cloud & AI Summit 2026' },
          description: { type: 'string', example: 'Annual flagship backend conference' },
          category: { type: 'string', example: 'Technology' },
          city: { type: 'string', example: 'Mumbai' },
          eventDate: { type: 'string', format: 'date-time', example: '2026-06-15T09:00:00Z' },
          venue: { type: 'string', example: 'Bandra Kurla Complex, Mumbai' },
          organizerId: { type: 'string', example: 'usr_organizer_01' },
          ticketPrice: { type: 'number', example: 1499 },
          totalCapacity: { type: 'integer', example: 500 },
          availableTickets: { type: 'integer', example: 482 },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Ticket: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'ticket_rec_88219' },
          eventId: { type: 'string', example: 'event_techconf_2026' },
          eventTitle: { type: 'string', example: 'Global Cloud & AI Summit 2026' },
          userId: { type: 'string', example: 'usr_attendee_99' },
          attendeeName: { type: 'string', example: 'Kunal Sharma' },
          attendeeEmail: { type: 'string', example: 'kunal@gmail.com' },
          quantity: { type: 'integer', example: 2 },
          totalPaid: { type: 'number', example: 2998 },
          bookingRef: { type: 'string', example: 'TKT-2026-88219' },
          status: { type: 'string', enum: ['confirmed', 'cancelled'], example: 'confirmed' },
          bookedAt: { type: 'string', format: 'date-time' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Something went wrong' }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }]
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js', './controllers/*.js']
};

module.exports = swaggerJSDoc(options);
