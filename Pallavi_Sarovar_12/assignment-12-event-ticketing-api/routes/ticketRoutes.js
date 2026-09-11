const express = require('express');
const controller = require('../controllers/ticketController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { bookingLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @swagger
 * /api/tickets/book:
 *   post:
 *     tags: [Tickets]
 *     summary: Book tickets using an atomic Firestore transaction
 *     description: Rate limited to 10 requests per minute.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingRequest'
 *     responses:
 *       201: { description: Tickets booked }
 *       400: { description: Booking rejected }
 *       429: { description: Rate limit exceeded }
 */
router.post('/book', auth, checkRole('attendee'), bookingLimiter, controller.bookTicket);

/**
 * @swagger
 * /api/tickets/my-tickets:
 *   get:
 *     tags: [Tickets]
 *     summary: View tickets purchased by current attendee
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: User tickets }
 */
router.get('/my-tickets', auth, checkRole('attendee'), controller.myTickets);

/**
 * @swagger
 * /api/tickets/{id}/cancel:
 *   post:
 *     tags: [Tickets]
 *     summary: Cancel a purchased ticket and restore inventory
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Ticket cancelled }
 *       403: { description: Not ticket owner }
 */
router.post('/:id/cancel', auth, checkRole('attendee'), controller.cancelTicket);

module.exports = router;