const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { bookingRateLimiter } = require('../middleware/rateLimiter');

/**
 * @openapi
 * tags:
 *   name: Ticket Booking & Scalper Protection
 *   description: High-concurrency ticket booking, rate limiting, ticket list, and ticket cancellation
 */

/**
 * @openapi
 * /api/tickets/book:
 *   post:
 *     summary: Atomic Ticket Booking (Rate Limited to 10 req/min per IP)
 *     tags: [Ticket Booking & Scalper Protection]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TicketBookInput'
 *     responses:
 *       201:
 *         description: Tickets booked successfully via ACID transaction
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Tickets booked successfully
 *                 data:
 *                   $ref: '#/components/schemas/TicketSchema'
 *       400:
 *         description: Insufficient tickets or Event not found
 *       429:
 *         description: Too Many Requests - Rate limit exceeded (Scalper Bot Protection)
 */
router.post('/book', auth, checkRole('attendee'), bookingRateLimiter, ticketController.bookTicket);

/**
 * @openapi
 * /api/tickets/my-tickets:
 *   get:
 *     summary: View purchased tickets for logged-in Attendee
 *     tags: [Ticket Booking & Scalper Protection]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tickets purchased by the attendee
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TicketSchema'
 *       401:
 *         description: Unauthorized
 */
router.get('/my-tickets', auth, checkRole('attendee'), ticketController.getMyTickets);

/**
 * @openapi
 * /api/tickets/{id}/cancel:
 *   post:
 *     summary: Cancel ticket & restore ticket inventory (ACID Transaction)
 *     tags: [Ticket Booking & Scalper Protection]
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Ticket cancelled successfully and inventory restored
 *                 data:
 *                   $ref: '#/components/schemas/TicketSchema'
 *       400:
 *         description: Ticket already cancelled or invalid request
 *       403:
 *         description: Forbidden - Ticket belongs to another user
 */
router.post('/:id/cancel', auth, checkRole('attendee'), ticketController.cancelTicket);

module.exports = router;
