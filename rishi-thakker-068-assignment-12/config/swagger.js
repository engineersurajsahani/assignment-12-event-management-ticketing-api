const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Event Management & Ticketing API",
      version: "1.0.0",
      description: "Event ticketing API with Firebase Firestore, JWT RBAC, and rate-limited booking.",
    },
    servers: [{ url: "http://localhost:5000/api" }],
    components: {
      securitySchemes: {
        tokenAuth: {
          type: "apiKey",
          in: "header",
          name: "token",
        },
      },
    },
  },
  apis: ["./router/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
