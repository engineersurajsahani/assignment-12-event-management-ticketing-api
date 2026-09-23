const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { bookingRateLimiter } = require('../middleware/rateLimiter');
const { bookTicket, getMyTickets, cancelTicket } = require('../controllers/ticketController');

/**
 * @swagger
 * /api/tickets/book:
 *   post:
 *     summary: Atomic Ticket Booking (Attendee only, Rate Limited)
 *     tags: [Tickets]
 *     security: [{ bearerAuth: [] }]
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
 *       201: { description: Tickets booked }
 *       429: { description: Rate limit exceeded }
 */
router.post('/book', authenticateToken, checkRole('Attendee'), bookingRateLimiter, bookTicket);

/**
 * @swagger
 * /api/tickets/my-tickets:
 *   get:
 *     summary: View purchased tickets for current user
 *     tags: [Tickets]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Purchased tickets list }
 */
router.get('/my-tickets', authenticateToken, checkRole('Attendee'), getMyTickets);

/**
 * @swagger
 * /api/tickets/{id}/cancel:
 *   post:
 *     summary: Cancel ticket & restore inventory
 *     tags: [Tickets]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Ticket cancelled }
 */
router.post('/:id/cancel', authenticateToken, checkRole('Attendee'), cancelTicket);

module.exports = router;