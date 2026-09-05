const express = require('express');
const router = express.Router();
const {
  bookTicket,
  getMyTickets,
  cancelTicket
} = require('../controllers/ticketController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/checkRole');
const { bookingRateLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket booking & scalper bot protection
 */

/**
 * @swagger
 * /api/tickets/book:
 *   post:
 *     summary: Atomically book tickets for an event (Attendee only, 10 req/min rate limit)
 *     tags: [Tickets]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId, quantity]
 *             properties:
 *               eventId:
 *                 type: string
 *                 example: doc_12345
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
 *         description: Tickets booked successfully via transaction
 *       400:
 *         description: Insufficient tickets or invalid request
 *       429:
 *         description: Too Many Requests (Rate limit exceeded)
 */
router.post('/book', protect, checkRole('Attendee'), bookingRateLimiter, bookTicket);

/**
 * @swagger
 * /api/tickets/my-tickets:
 *   get:
 *     summary: View purchased tickets for authenticated attendee
 *     tags: [Tickets]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of user tickets
 *       401:
 *         description: Unauthorized
 */
router.get('/my-tickets', protect, checkRole('Attendee'), getMyTickets);

/**
 * @swagger
 * /api/tickets/{id}/cancel:
 *   post:
 *     summary: Cancel ticket and restore event capacity via transaction
 *     tags: [Tickets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket cancelled and inventory restored
 *       400:
 *         description: Ticket already cancelled or error
 */
router.post('/:id/cancel', protect, checkRole('Attendee'), cancelTicket);

module.exports = router;
