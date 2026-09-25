const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management endpoints for browsing and organizer management
 */

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Browse all events (optional category and city filters)
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter events by category (e.g. Technology, Music, Business)
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter events by city in venue (e.g. Mumbai, Bangalore)
 *     responses:
 *       200:
 *         description: List of events retrieved successfully
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
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       category:
 *                         type: string
 *                       eventDate:
 *                         type: string
 *                       venue:
 *                         type: string
 *                       organizerId:
 *                         type: string
 *                       ticketPrice:
 *                         type: number
 *                       totalCapacity:
 *                         type: integer
 *                       availableTickets:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 */
router.get('/', eventController.listEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event details and live remaining ticket count
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details retrieved
 *       404:
 *         description: Event not found
 */
router.get('/:id', eventController.getEventById);

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event (Organizer only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - eventDate
 *               - venue
 *               - ticketPrice
 *               - totalCapacity
 *             properties:
 *               title:
 *                 type: string
 *                 example: Global Cloud & AI Summit 2026
 *               description:
 *                 type: string
 *                 example: Annual flagship backend conference
 *               category:
 *                 type: string
 *                 example: Technology
 *               eventDate:
 *                 type: string
 *                 example: "2026-06-15T09:00:00Z"
 *               venue:
 *                 type: string
 *                 example: Bandra Kurla Complex, Mumbai
 *               ticketPrice:
 *                 type: number
 *                 example: 1499
 *               totalCapacity:
 *                 type: integer
 *                 example: 500
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Organizer role
 */
router.post('/', auth, checkRole('Organizer'), eventController.createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update an existing event (Organizer must own the event)
 *     tags: [Events]
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
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               eventDate:
 *                 type: string
 *               venue:
 *                 type: string
 *               ticketPrice:
 *                 type: number
 *               totalCapacity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       403:
 *         description: Forbidden - Not the event owner or not an Organizer
 *       404:
 *         description: Event not found
 */
router.put('/:id', auth, checkRole('Organizer'), eventController.updateEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Cancel or delete an event (Organizer must own the event)
 *     tags: [Events]
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
 *         description: Forbidden - Not the event owner or not an Organizer
 *       404:
 *         description: Event not found
 */
router.delete('/:id', auth, checkRole('Organizer'), eventController.deleteEvent);

/**
 * @swagger
 * /api/events/{id}/attendees:
 *   get:
 *     summary: List registered attendees for an event (Organizer must own the event)
 *     tags: [Events]
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
 *         description: Registered attendees list retrieved
 *       403:
 *         description: Forbidden - Not the event owner or not an Organizer
 *       404:
 *         description: Event not found
 */
router.get('/:id/attendees', auth, checkRole('Organizer'), eventController.listAttendees);

module.exports = router;
