const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authenticateJWT = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: List all upcoming events with optional category/city/search filters
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of matching events
 */
router.get('/', eventController.getAllEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get single event by ID
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
 */
router.get('/:id', eventController.getEventById);

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create new event (Organizer only)
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
 *               category:
 *                 type: string
 *               city:
 *                 type: string
 *               eventDate:
 *                 type: string
 *               venue:
 *                 type: string
 *               ticketPrice:
 *                 type: number
 *               totalCapacity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Event created successfully
 */
router.post('/', authenticateJWT, checkRole('Organizer'), eventController.createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update event (Organizer only)
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
 *         description: Event updated successfully
 */
router.put('/:id', authenticateJWT, checkRole('Organizer'), eventController.updateEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete event (Organizer only)
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
 *         description: Event deleted successfully
 */
router.delete('/:id', authenticateJWT, checkRole('Organizer'), eventController.deleteEvent);

/**
 * @swagger
 * /api/events/{id}/attendees:
 *   get:
 *     summary: View registered attendees for event (Organizer only)
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
 *         description: List of registered attendees
 */
router.get('/:id/attendees', authenticateJWT, checkRole('Organizer'), eventController.getEventAttendees);

module.exports = router;
