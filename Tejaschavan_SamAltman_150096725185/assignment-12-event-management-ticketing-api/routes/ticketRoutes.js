const express = require('express');
const router = express.Router();
const {
  bookTickets,
  getMyTickets,
  cancelTicket
} = require('../controllers/ticketController');
const auth = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/checkRole');
const { bookingLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket booking, cancellation, and user booking history
 */

/**
 * @swagger
 * /api/tickets/book:
 *   post:
 *     summary: Book tickets for an event (Attendee only, Rate limited to 10 req/min)
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
 *                 example: "evt_tech_summit_2026"
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *               attendeeName:
 *                 type: string
 *                 example: "John Doe"
 *     responses:
 *       201:
 *         description: Tickets booked successfully
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
 *                   example: "Tickets booked successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "tkt_9824058"
 *                     eventId:
 *                       type: string
 *                       example: "evt_tech_summit_2026"
 *                     eventTitle:
 *                       type: string
 *                       example: "Cloud & AI Summit 2026"
 *                     userId:
 *                       type: string
 *                       example: "usr_att_49204"
 *                     attendeeName:
 *                       type: string
 *                       example: "John Doe"
 *                     attendeeEmail:
 *                       type: string
 *                       example: "john@example.com"
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *                     totalPaid:
 *                       type: number
 *                       example: 199.98
 *                     bookingRef:
 *                       type: string
 *                       example: "TKT-485921AB"
 *                     status:
 *                       type: string
 *                       example: "confirmed"
 *                     bookedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-09-08T12:00:00.000Z"
 *       400:
 *         description: Validation failure, event not found, or insufficient ticket capacity
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Insufficient tickets available. Only 1 tickets remaining"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires attendee role
 *       429:
 *         description: Rate limit exceeded (more than 10 requests per minute)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Too many booking attempts, please try again later."
 */
router.post(
  '/book',
  auth,
  authorizeRoles('attendee'),
  bookingLimiter,
  bookTickets
);

/**
 * @swagger
 * /api/tickets/my-tickets:
 *   get:
 *     summary: Get all tickets booked by the authenticated attendee
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of attendee tickets
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "tkt_9824058"
 *                       eventId:
 *                         type: string
 *                         example: "evt_tech_summit_2026"
 *                       eventTitle:
 *                         type: string
 *                         example: "Cloud & AI Summit 2026"
 *                       quantity:
 *                         type: integer
 *                         example: 2
 *                       totalPaid:
 *                         type: number
 *                         example: 199.98
 *                       bookingRef:
 *                         type: string
 *                         example: "TKT-485921AB"
 *                       status:
 *                         type: string
 *                         example: "confirmed"
 *                       bookedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-09-08T12:00:00.000Z"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires attendee role
 */
router.get(
  '/my-tickets',
  auth,
  authorizeRoles('attendee'),
  getMyTickets
);

/**
 * @swagger
 * /api/tickets/{id}/cancel:
 *   post:
 *     summary: Cancel a booked ticket and restore event capacity (Attendee owner only)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket document ID
 *         example: "tkt_9824058"
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
 *                   example: "Ticket cancelled successfully and inventory restored"
 *                 data:
 *                   type: object
 *       400:
 *         description: Ticket is already cancelled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ticket belongs to another attendee
 *       404:
 *         description: Ticket not found
 */
router.post(
  '/:id/cancel',
  auth,
  authorizeRoles('attendee'),
  cancelTicket
);

module.exports = router;
