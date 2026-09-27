const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const bookingLimiter = require('../middleware/rateLimiter');

/**
 * @swagger
 * /api/tickets/book:
 *   post:
 *     summary: Book tickets (Rate Limited)
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
 *               quantity:
 *                 type: integer
 *               attendeeName:
 *                 type: string
 *               attendeeEmail:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tickets booked successfully
 */
router.post('/book', bookingLimiter, auth, checkRole('Attendee'), ticketController.bookTicket);

/**
 * @swagger
 * /api/tickets/my-tickets:
 *   get:
 *     summary: View purchased tickets
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tickets
 */
router.get('/my-tickets', auth, checkRole('Attendee'), ticketController.getMyTickets);

/**
 * @swagger
 * /api/tickets/{id}/cancel:
 *   post:
 *     summary: Cancel ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket cancelled
 */
router.post('/:id/cancel', auth, checkRole('Attendee'), ticketController.cancelTicket);

module.exports = router;
