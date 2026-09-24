const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authenticateJWT = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { ticketBookingLimiter } = require('../middleware/rateLimiter');

// All ticket routes require authentication
router.use(authenticateJWT);

/**
 * @swagger
 * /api/tickets/book:
 *   post:
 *     summary: Atomic Ticket Booking with ACID transaction & 10 req/min rate limiter
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
 *               quantity:
 *                 type: number
 *               attendeeName:
 *                 type: string
 *               attendeeEmail:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tickets booked successfully
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/book', checkRole('Attendee'), ticketBookingLimiter, ticketController.bookTicket);

/**
 * @swagger
 * /api/tickets/my-tickets:
 *   get:
 *     summary: View purchased tickets for authenticated Attendee
 *     tags: [Tickets]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of purchased tickets
 */
router.get('/my-tickets', checkRole('Attendee'), ticketController.getMyTickets);

/**
 * @swagger
 * /api/tickets/{id}/cancel:
 *   post:
 *     summary: Cancel ticket & restore ticket inventory
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
 */
router.post('/:id/cancel', checkRole('Attendee'), ticketController.cancelTicket);

module.exports = router;
