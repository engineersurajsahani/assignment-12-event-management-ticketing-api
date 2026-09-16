const express = require('express');
const router = express.Router();
const { bookTicket, getMyTickets, cancelTicket } = require('../controllers/ticketController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/checkRole');
const { bookingLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * /api/tickets/book:
 *   post:
 *     summary: Book tickets for an event (Attendee, rate-limited to 10/min)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201: { description: Tickets booked successfully }
 *       429: { description: Too many requests }
 */
router.post('/book', protect, checkRole('Attendee'), bookingLimiter, bookTicket);

/**
 * @swagger
 * /api/tickets/my-tickets:
 *   get:
 *     summary: View purchased tickets
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: List of tickets }
 */
router.get('/my-tickets', protect, checkRole('Attendee'), getMyTickets);

/**
 * @swagger
 * /api/tickets/{id}/cancel:
 *   post:
 *     summary: Cancel a ticket and restore inventory
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Ticket cancelled }
 */
router.post('/:id/cancel', protect, checkRole('Attendee'), cancelTicket);

module.exports = router;