const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/checkRole');
const { bookingLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * /api/tickets/book:
 *   post:
 *     summary: Book a ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               attendeeName:
 *                 type: string
 *               attendeeEmail:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ticket booked
 */
router.post('/book', authenticate, checkRole(['Attendee']), bookingLimiter, ticketController.bookTicket);

/**
 * @swagger
 * /api/tickets/my-tickets:
 *   get:
 *     summary: Get my tickets
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tickets
 */
router.get('/my-tickets', authenticate, checkRole(['Attendee']), ticketController.getMyTickets);

/**
 * @swagger
 * /api/tickets/{id}/cancel:
 *   post:
 *     summary: Cancel a ticket
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
router.post('/:id/cancel', authenticate, checkRole(['Attendee']), ticketController.cancelTicket);

module.exports = router;
