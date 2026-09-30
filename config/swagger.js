const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Event Management & Ticketing API",
      version: "1.0.0",
      description:
        "REST API for event management and ticket booking using Firebase."
    },
    servers: [
      {
        url: "http://localhost:5050",
        description: "Local server"
      }
    ]
  },
  apis: ["./routes/*.js"]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;