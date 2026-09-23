const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { getEventAttendees } = require('../controllers/ticketController');

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all upcoming events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of events }
 */
router.get('/', getAllEvents);

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
 *         schema: { type: string }
 *     responses:
 *       200: { description: Event details }
 */
router.get('/:id', getEventById);

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create new event listing (Organizer only)
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, category, eventDate, venue, ticketPrice, totalCapacity]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               category: { type: string }
 *               eventDate: { type: string }
 *               venue: { type: string }
 *               ticketPrice: { type: number }
 *               totalCapacity: { type: integer }
 *     responses:
 *       201: { description: Event created }
 */
router.post('/', authenticateToken, checkRole('Organizer'), createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update event details (Organizer only)
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Event updated }
 */
router.put('/:id', authenticateToken, checkRole('Organizer'), updateEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete event (Organizer only)
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Event deleted }
 */
router.delete('/:id', authenticateToken, checkRole('Organizer'), deleteEvent);

/**
 * @swagger
 * /api/events/{id}/attendees:
 *   get:
 *     summary: Get registered attendees for an event (Organizer only)
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Attendees list }
 */
router.get('/:id/attendees', authenticateToken, checkRole('Organizer'), getEventAttendees);

module.exports = router;