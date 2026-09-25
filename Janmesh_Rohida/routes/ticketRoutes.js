const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const bookingLimiter = require('../middleware/rateLimiter');

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket booking, my-tickets viewing, and cancellation with atomic concurrency protection and rate limiting
 */

/**
 * @swagger
 * /api/tickets/book:
 *   post:
 *     summary: Book event tickets atomically (Attendee only - 10 req/min rate limit)
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
 *               - attendeeName
 *               - attendeeEmail
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
 *         description: Tickets booked successfully via Firestore transaction
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
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     eventId:
 *                       type: string
 *                     eventTitle:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     attendeeName:
 *                       type: string
 *                     attendeeEmail:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     totalPaid:
 *                       type: number
 *                     bookingRef:
 *                       type: string
 *                       example: TKT-2026-88219
 *                     status:
 *                       type: string
 *                       example: confirmed
 *                     bookedAt:
 *                       type: string
 *       400:
 *         description: Insufficient tickets available or invalid event ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Attendee role
 *       429:
 *         description: "Too many booking attempts (Rate limit exceeded: >10 req/min)"
 */
router.post('/book', auth, checkRole('Attendee'), bookingLimiter, ticketController.bookTicket);

/**
 * @swagger
 * /api/tickets/my-tickets:
 *   get:
 *     summary: View all purchased tickets for logged-in Attendee
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of purchased tickets retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Attendee role
 */
router.get('/my-tickets', auth, checkRole('Attendee'), ticketController.myTickets);

/**
 * @swagger
 * /api/tickets/{id}/cancel:
 *   post:
 *     summary: Cancel ticket booking and restore available tickets inventory atomically
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
 *         description: Ticket already cancelled or invalid ticket ID
 *       403:
 *         description: Forbidden - You can only cancel your own ticket
 *       404:
 *         description: Ticket not found
 */
router.post('/:id/cancel', auth, checkRole('Attendee'), ticketController.cancelTicket);

module.exports = router;
