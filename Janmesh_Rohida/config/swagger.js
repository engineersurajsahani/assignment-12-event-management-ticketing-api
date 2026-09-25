const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Management & Ticketing API',
      version: '1.0.0',
      description: 'High-concurrency Event Management & Ticketing REST API built with Node.js, Express, Firebase Firestore (ACID Transactions), JWT RBAC, and Anti-Scalper Rate Limiting.',
      contact: {
        name: 'Janmesh Rohida'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
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
      }
    }
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

// Custom CSS to apply the required Coffee Brown & White theme to Swagger UI
const customCss = `
  .swagger-ui .topbar { background-color: #6F4E37 !important; border-bottom: 3px solid #4A3222; }
  .swagger-ui .topbar .download-wrapper .button { background-color: #4A3222 !important; border-color: #4A3222 !important; }
  .swagger-ui .info .title { color: #3B2A20 !important; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
  .swagger-ui .scheme-container { background-color: #FBF7F0 !important; border-radius: 8px; box-shadow: none; border: 1px solid #E4D5C3; }
  .swagger-ui .btn.execute { background-color: #6F4E37 !important; border-color: #6F4E37 !important; color: #FFFFFF !important; font-weight: bold; }
  .swagger-ui .btn.execute:hover { background-color: #4A3222 !important; border-color: #4A3222 !important; }
  .swagger-ui .opblock.opblock-post { border-color: #A9745B !important; background: rgba(169, 116, 91, 0.08) !important; }
  .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #6F4E37 !important; }
  .swagger-ui .opblock.opblock-get { border-color: #D2B48C !important; background: rgba(210, 180, 140, 0.12) !important; }
  .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #8B6F5B !important; }
  .swagger-ui .opblock.opblock-put { border-color: #A9745B !important; background: rgba(169, 116, 91, 0.1) !important; }
  .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #A9745B !important; }
  .swagger-ui .opblock.opblock-delete { border-color: #8B3A3A !important; background: rgba(139, 58, 58, 0.08) !important; }
  .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #8B3A3A !important; }
  .swagger-ui a.nostyle, .swagger-ui a.nostyle:visited { color: #3B2A20 !important; font-weight: 600; }
  .swagger-ui .btn.authorize { color: #6F4E37 !important; border-color: #6F4E37 !important; }
  .swagger-ui .btn.authorize svg { fill: #6F4E37 !important; }
`;

module.exports = { swaggerSpec, customCss };
