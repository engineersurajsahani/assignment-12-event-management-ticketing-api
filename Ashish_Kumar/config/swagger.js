const swaggerJSDoc = require("swagger-jsdoc");
const path = require("path");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Event Management & Ticketing API",
      version: "1.0.0",
      description:
        "High-concurrency Event Ticketing & Live Booking REST API built with Node.js, Express, Firebase Firestore, JWT Role-Based Access Control, and Rate Limiting.",
      contact: {
        name: "Aditya Kumbhar",
        email: "aditya@example.com"
      }
    },
    servers: [
      {
        url: "http://localhost:5001",
        description: "Local Development Server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT Bearer token format: Bearer <token>"
        }
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", example: "usr_attendee_01" },
            name: { type: "string", example: "Aditya Kumbhar" },
            email: { type: "string", example: "aditya@example.com" },
            role: { type: "string", enum: ["Attendee", "Organizer"], example: "Attendee" },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        Event: {
          type: "object",
          properties: {
            id: { type: "string", example: "event_techconf_2026" },
            title: { type: "string", example: "Global Cloud & AI Summit 2026" },
            description: { type: "string", example: "Annual flagship backend conference" },
            category: { type: "string", example: "Technology" },
            eventDate: { type: "string", format: "date-time", example: "2026-06-15T09:00:00Z" },
            venue: { type: "string", example: "Bandra Kurla Complex, Mumbai" },
            organizerId: { type: "string", example: "usr_organizer_01" },
            ticketPrice: { type: "number", example: 1499 },
            totalCapacity: { type: "integer", example: 500 },
            availableTickets: { type: "integer", example: 482 },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        Ticket: {
          type: "object",
          properties: {
            id: { type: "string", example: "ticket_rec_88219" },
            eventId: { type: "string", example: "event_techconf_2026" },
            eventTitle: { type: "string", example: "Global Cloud & AI Summit 2026" },
            userId: { type: "string", example: "usr_attendee_99" },
            attendeeName: { type: "string", example: "Kunal Sharma" },
            attendeeEmail: { type: "string", example: "kunal@gmail.com" },
            quantity: { type: "integer", example: 2 },
            totalPaid: { type: "number", example: 2998 },
            bookingRef: { type: "string", example: "TKT-2026-88219" },
            status: { type: "string", enum: ["confirmed", "cancelled"], example: "confirmed" },
            bookedAt: { type: "string", format: "date-time" }
          }
        }
      }
    }
  },
  apis: [path.join(__dirname, "../routes/*.js")]
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

module.exports = swaggerSpec;
