const express = require('express');
const router = express.Router();
const {
  getEvents, getEventById, createEvent, updateEvent, deleteEvent, getEventAttendees
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/checkRole');

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Browse all events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of events }
 */
router.get('/', getEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event details
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
 *     summary: Create a new event (Organizer only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201: { description: Event created }
 */
router.post('/', protect, checkRole('Organizer'), createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update event (Organizer, must own event)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Event updated }
 */
router.put('/:id', protect, checkRole('Organizer'), updateEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete event (Organizer, must own event)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Event deleted }
 */
router.delete('/:id', protect, checkRole('Organizer'), deleteEvent);

/**
 * @swagger
 * /api/events/{id}/attendees:
 *   get:
 *     summary: List all attendees for an event (Organizer, must own event)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: List of attendees }
 */
router.get('/:id/attendees', protect, checkRole('Organizer'), getEventAttendees);

module.exports = router;