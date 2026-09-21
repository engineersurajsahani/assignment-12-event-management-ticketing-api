const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");
const bookingRateLimiter = require("../middleware/rateLimiter");
const { register, login, profile } = require("../controllers/authController");
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getAttendees,
} = require("../controllers/eventController");
const { bookTicket, myTickets, cancelTicket } = require("../controllers/ticketController");

// ---------- AUTH ----------

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register as Attendee or Organizer
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [Attendee, Organizer] }
 *     responses:
 *       201: { description: User registered }
 *       400: { description: Bad request }
 */
router.post("/auth/register", register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login and obtain a JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful, returns token }
 *       404: { description: User not found }
 */
router.post("/auth/login", login);

/**
 * @openapi
 * /auth/profile:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [Auth]
 *     security: [{ tokenAuth: [] }]
 *     responses:
 *       200: { description: User profile }
 *       400: { description: Token missing or invalid }
 */
router.get("/auth/profile", auth, profile);

// ---------- EVENTS ----------

/**
 * @openapi
 * /events:
 *   get:
 *     summary: Browse all events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of events }
 */
router.get("/events", getEvents);

/**
 * @openapi
 * /events/{id}:
 *   get:
 *     summary: View event details and live remaining ticket count
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Event details }
 *       404: { description: Event not found }
 */
router.get("/events/:id", getEventById);

/**
 * @openapi
 * /events:
 *   post:
 *     summary: Create a new event (Organizer only)
 *     tags: [Events]
 *     security: [{ tokenAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, category, eventDate, venue, ticketPrice, totalCapacity]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               category: { type: string }
 *               eventDate: { type: string, format: date-time }
 *               venue: { type: string }
 *               city: { type: string }
 *               ticketPrice: { type: number }
 *               totalCapacity: { type: integer }
 *     responses:
 *       201: { description: Event created }
 *       403: { description: Forbidden — Organizer role required }
 */
router.post("/events", auth, checkRole("Organizer"), createEvent);

/**
 * @openapi
 * /events/{id}:
 *   put:
 *     summary: Update event details (must own the event)
 *     tags: [Events]
 *     security: [{ tokenAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Event updated }
 *       403: { description: Forbidden — not the event owner }
 *       404: { description: Event not found }
 */
router.put("/events/:id", auth, checkRole("Organizer"), updateEvent);

/**
 * @openapi
 * /events/{id}:
 *   delete:
 *     summary: Cancel and delete an event (must own the event)
 *     tags: [Events]
 *     security: [{ tokenAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Event deleted }
 *       403: { description: Forbidden — not the event owner }
 *       404: { description: Event not found }
 */
router.delete("/events/:id", auth, checkRole("Organizer"), deleteEvent);

/**
 * @openapi
 * /events/{id}/attendees:
 *   get:
 *     summary: List all registered attendees for an event (Organizer, must own event)
 *     tags: [Events]
 *     security: [{ tokenAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of confirmed tickets/attendees }
 *       403: { description: Forbidden — not the event owner }
 */
router.get("/events/:id/attendees", auth, checkRole("Organizer"), getAttendees);

// ---------- TICKETS ----------

/**
 * @openapi
 * /tickets/book:
 *   post:
 *     summary: Book tickets for an event (Attendee only, rate limited to 10 requests/min)
 *     tags: [Tickets]
 *     security: [{ tokenAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId, quantity, attendeeName, attendeeEmail]
 *             properties:
 *               eventId: { type: string }
 *               quantity: { type: integer }
 *               attendeeName: { type: string }
 *               attendeeEmail: { type: string }
 *     responses:
 *       201: { description: Tickets booked successfully }
 *       400: { description: Insufficient tickets or bad request }
 *       429: { description: Too many booking requests }
 */
router.post("/tickets/book", auth, checkRole("Attendee"), bookingRateLimiter, bookTicket);

/**
 * @openapi
 * /tickets/my-tickets:
 *   get:
 *     summary: View the logged-in attendee's purchased tickets
 *     tags: [Tickets]
 *     security: [{ tokenAuth: [] }]
 *     responses:
 *       200: { description: List of tickets }
 */
router.get("/tickets/my-tickets", auth, checkRole("Attendee"), myTickets);

/**
 * @openapi
 * /tickets/{id}/cancel:
 *   post:
 *     summary: Cancel a ticket and restore inventory
 *     tags: [Tickets]
 *     security: [{ tokenAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Ticket cancelled }
 *       400: { description: Ticket not found or not yours }
 */
router.post("/tickets/:id/cancel", auth, checkRole("Attendee"), cancelTicket);

module.exports = router;
