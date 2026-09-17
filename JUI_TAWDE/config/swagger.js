const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Event Management & Ticketing API",
      version: "1.0.0",
      description:
        "REST API for event management and ticket booking using Firebase Firestore."
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local development server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    }
  },
  apis: ["./routes/*.js"]
};

module.exports = swaggerJSDoc(options);