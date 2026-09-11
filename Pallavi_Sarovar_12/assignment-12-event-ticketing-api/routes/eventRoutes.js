const express = require('express');
const controller = require('../controllers/eventController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

const router = express.Router();

/**
 * @swagger
 * /api/events:
 *   get:
 *     tags: [Events]
 *     summary: Browse upcoming events
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *     responses:
 *       200: { description: Upcoming events }
 */
router.get('/', controller.getEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     tags: [Events]
 *     summary: Get event details and live ticket count
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Event details }
 *       404: { description: Event not found }
 */
router.get('/:id', controller.getEvent);

/**
 * @swagger
 * /api/events:
 *   post:
 *     tags: [Events]
 *     summary: Create an event (Organizer only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       201: { description: Event created }
 *       403: { description: Organizer role required }
 */
router.post('/', auth, checkRole('organizer'), controller.createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     tags: [Events]
 *     summary: Update an owned event (Organizer only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Event updated }
 *       403: { description: Not event owner }
 */
router.put('/:id', auth, checkRole('organizer'), controller.updateEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     tags: [Events]
 *     summary: Cancel and delete an owned event (Organizer only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Event deleted }
 */
router.delete('/:id', auth, checkRole('organizer'), controller.deleteEvent);

/**
 * @swagger
 * /api/events/{id}/attendees:
 *   get:
 *     tags: [Events]
 *     summary: List registered attendees for an owned event
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Attendee list }
 */
router.get('/:id/attendees', auth, checkRole('organizer'), controller.getAttendees);

module.exports = router;