const r=require("express").Router(),c=require("../controllers/ticketController"),auth=require("../middleware/auth"),role=require("../middleware/checkRole"),{bookingRateLimiter}=require("../middleware/rateLimiter");
/**
 * @swagger
 * /api/tickets/book:
 *   post:
 *     summary: Book tickets with atomic Firestore transaction
 *     description: Limited to 10 requests per minute.
 *     tags: [Tickets]
 *     security: [{bearerAuth: []}]
 *     responses:
 *       201: {description: Tickets booked}
 *       429: {description: Too many requests}
 */
r.post("/book",auth,role("attendee"),bookingRateLimiter,c.bookTicket);
/**
 * @swagger
 * /api/tickets/my-tickets:
 *   get:
 *     summary: View purchased tickets
 *     tags: [Tickets]
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200: {description: User tickets}
 */
r.get("/my-tickets",auth,role("attendee"),c.getMyTickets);
/**
 * @swagger
 * /api/tickets/{id}/cancel:
 *   post:
 *     summary: Cancel ticket and restore inventory
 *     tags: [Tickets]
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200: {description: Ticket cancelled}
 */
r.post("/:id/cancel",auth,role("attendee"),c.cancelTicket);
module.exports=r;
