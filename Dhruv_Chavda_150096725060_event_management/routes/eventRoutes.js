const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventAttendees
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/checkRole');

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event listing and organizer management
 */

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Browse all upcoming events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category (e.g. Technology, Music)
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city / venue
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title/description keyword
 *     responses:
 *       200:
 *         description: List of events
 */
router.get('/', getEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event details by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 */
router.get('/:id', getEventById);

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event listing (Organizer only)
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, category, eventDate, venue, ticketPrice, totalCapacity]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Global Cloud & AI Summit 2026
 *               description:
 *                 type: string
 *                 example: Flagship conference on Cloud & AI architectures
 *               category:
 *                 type: string
 *                 example: Technology
 *               eventDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-06-15T09:00:00.000Z
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
 *         description: Event created
 *       403:
 *         description: Forbidden (Organizer role required)
 */
router.post('/', protect, checkRole('Organizer'), createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update event details (Organizer must own event)
 *     tags: [Events]
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
 *         description: Event updated
 *       403:
 *         description: Forbidden
 */
router.put('/:id', protect, checkRole('Organizer'), updateEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete/Cancel event (Organizer must own event)
 *     tags: [Events]
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
 *         description: Event deleted
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', protect, checkRole('Organizer'), deleteEvent);

/**
 * @swagger
 * /api/events/{id}/attendees:
 *   get:
 *     summary: List registered attendees for an event (Organizer only)
 *     tags: [Events]
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
 *         description: List of attendees
 *       403:
 *         description: Forbidden
 */
router.get('/:id/attendees', protect, checkRole('Organizer'), getEventAttendees);

module.exports = router;
