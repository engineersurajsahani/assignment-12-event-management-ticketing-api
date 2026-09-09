const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

/**
 * @openapi
 * tags:
 *   name: Event Management
 *   description: Event listing, creation, updates, and attendee roster (Organizer vs Attendee)
 */

/**
 * @openapi
 * /api/events:
 *   get:
 *     summary: Browse all upcoming events
 *     tags: [Event Management]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter events by category (e.g., Technology, Music)
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter events by venue/city (e.g., Mumbai)
 *     responses:
 *       200:
 *         description: List of upcoming events
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
 *                     $ref: '#/components/schemas/EventSchema'
 */
router.get('/', eventController.getAllEvents);

/**
 * @openapi
 * /api/events/{id}:
 *   get:
 *     summary: View event details & live remaining ticket count
 *     tags: [Event Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Detailed event information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EventSchema'
 *       404:
 *         description: Event not found
 */
router.get('/:id', eventController.getEventById);

/**
 * @openapi
 * /api/events:
 *   post:
 *     summary: Create new event listing (Organizer only)
 *     tags: [Event Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventInput'
 *     responses:
 *       201:
 *         description: Event created successfully
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
 *                   example: Event created successfully.
 *                 data:
 *                   $ref: '#/components/schemas/EventSchema'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only Organizers can create events
 */
router.post('/', auth, checkRole('organizer'), eventController.createEvent);

/**
 * @openapi
 * /api/events/{id}:
 *   put:
 *     summary: Update event details (Organizer must own event)
 *     tags: [Event Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventInput'
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       403:
 *         description: Forbidden - You can only update events you organized
 *       404:
 *         description: Event not found
 */
router.put('/:id', auth, checkRole('organizer'), eventController.updateEvent);

/**
 * @openapi
 * /api/events/{id}:
 *   delete:
 *     summary: Cancel and delete event (Organizer must own event)
 *     tags: [Event Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       403:
 *         description: Forbidden - You can only delete events you organized
 *       404:
 *         description: Event not found
 */
router.delete('/:id', auth, checkRole('organizer'), eventController.deleteEvent);

/**
 * @openapi
 * /api/events/{id}/attendees:
 *   get:
 *     summary: List all registered attendees for the event (Organizer only)
 *     tags: [Event Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: List of registered attendees
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 eventId:
 *                   type: string
 *                 eventTitle:
 *                   type: string
 *                 totalAttendees:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TicketSchema'
 *       403:
 *         description: Forbidden - Organizer must own the event
 *       404:
 *         description: Event not found
 */
router.get('/:id/attendees', auth, checkRole('organizer'), eventController.getEventAttendees);

module.exports = router;
