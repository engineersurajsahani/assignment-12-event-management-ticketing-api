const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");
const authenticateToken = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");
const { bookingLimiter } = require("../middleware/rateLimiter");

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket booking, cancellation and management
 */

/**
 * @swagger
 * /api/tickets/book:
 *   post:
 *     summary: Atomic Ticket Booking with ACID Transaction (Attendee only, 10 req/min limit)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - quantity
 *             properties:
 *               eventId:
 *                 type: string
 *                 example: event_techconf_2026
 *               quantity:
 *                 type: integer
 *                 example: 2
 *               attendeeName:
 *                 type: string
 *                 example: Kunal Sharma
 *               attendeeEmail:
 *                 type: string
 *                 example: kunal@gmail.com
 *     responses:
 *       201:
 *         description: Tickets booked successfully
 *       400:
 *         description: Insufficient tickets or invalid input
 *       429:
 *         description: Too many booking attempts (Rate limit exceeded)
 */
router.post(
  "/book",
  authenticateToken,
  checkRole("Attendee"),
  bookingLimiter,
  ticketController.bookTicket
);

/**
 * @swagger
 * /api/tickets/my-tickets:
 *   get:
 *     summary: View tickets purchased by authenticated attendee
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of purchased tickets
 *       403:
 *         description: Forbidden - Requires Attendee role
 */
router.get(
  "/my-tickets",
  authenticateToken,
  checkRole("Attendee"),
  ticketController.getMyTickets
);

/**
 * @swagger
 * /api/tickets/{id}/cancel:
 *   post:
 *     summary: Cancel ticket and restore event capacity (Attendee only)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket ID
 *     responses:
 *       200:
 *         description: Ticket cancelled successfully and inventory restored
 *       400:
 *         description: Cannot cancel ticket or already cancelled
 *       403:
 *         description: Forbidden - Not ticket owner
 */
router.post(
  "/:id/cancel",
  authenticateToken,
  checkRole("Attendee"),
  ticketController.cancelTicket
);

module.exports = router;
