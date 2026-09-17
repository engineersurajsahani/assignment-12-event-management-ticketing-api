const express = require("express");

const {
  bookTicket,
  getMyTickets,
  cancelTicket
} = require("../controllers/ticketController");

const authenticate = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");
const { bookingLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

/**
 * @swagger
 * /api/tickets/book:
 *   post:
 *     summary: Book tickets using a Firestore transaction
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Tickets booked
 *       429:
 *         description: Rate limit exceeded
 */
router.post(
  "/book",
  authenticate,
  checkRole("Attendee"),
  bookingLimiter,
  bookTicket
);

/**
 * @swagger
 * /api/tickets/my-tickets:
 *   get:
 *     summary: View tickets purchased by the current attendee
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ticket list
 */
router.get(
  "/my-tickets",
  authenticate,
  checkRole("Attendee"),
  getMyTickets
);

/**
 * @swagger
 * /api/tickets/{id}/cancel:
 *   post:
 *     summary: Cancel a ticket and restore event inventory
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ticket cancelled
 */
router.post(
  "/:id/cancel",
  authenticate,
  checkRole("Attendee"),
  cancelTicket
);

module.exports = router;