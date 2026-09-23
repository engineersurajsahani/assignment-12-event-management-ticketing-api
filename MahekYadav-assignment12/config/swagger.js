const swaggerJSDoc=require("swagger-jsdoc");
module.exports=swaggerJSDoc({
 definition:{
  openapi:"3.0.0",
  info:{title:"Assignment 12 - Event Management & Ticketing API",version:"1.0.0",description:"Firebase Firestore ticketing API with JWT RBAC, atomic transactions, rate limiting and Swagger."},
  servers:[{url:"http://localhost:5000"}],
  components:{
   securitySchemes:{bearerAuth:{type:"http",scheme:"bearer",bearerFormat:"JWT"}},
   schemas:{
    Event:{type:"object",properties:{id:{type:"string"},title:{type:"string"},description:{type:"string"},category:{type:"string"},eventDate:{type:"string",format:"date-time"},venue:{type:"string"},city:{type:"string"},organizerId:{type:"string"},ticketPrice:{type:"number"},totalCapacity:{type:"integer"},availableTickets:{type:"integer"},createdAt:{type:"string",format:"date-time"}}},
    Ticket:{type:"object",properties:{id:{type:"string"},eventId:{type:"string"},eventTitle:{type:"string"},userId:{type:"string"},attendeeName:{type:"string"},attendeeEmail:{type:"string"},quantity:{type:"integer"},totalPaid:{type:"number"},bookingRef:{type:"string"},status:{type:"string",enum:["confirmed","cancelled"]},bookedAt:{type:"string",format:"date-time"}}}
   }
  }
 },
 apis:["./routes/*.js"]
});
