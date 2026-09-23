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
const auth = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/checkRole');

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event discovery, management, and attendee rosters
 */

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Retrieve list of upcoming events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter events by category (e.g. Technology, Music, Sports)
 *         example: "Technology"
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter events by city (matched as substring against venue)
 *         example: "Mumbai"
 *     responses:
 *       200:
 *         description: List of upcoming events returned successfully
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
 *                         example: "evt_tech_summit_2026"
 *                       title:
 *                         type: string
 *                         example: "Cloud & AI Summit 2026"
 *                       description:
 *                         type: string
 *                         example: "Annual conference exploring modern cloud infrastructure and AI agents."
 *                       category:
 *                         type: string
 *                         example: "Technology"
 *                       eventDate:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-10-15T09:00:00.000Z"
 *                       venue:
 *                         type: string
 *                         example: "Grand Convention Center, Mumbai"
 *                       organizerId:
 *                         type: string
 *                         example: "usr_org_12345"
 *                       ticketPrice:
 *                         type: number
 *                         example: 99.99
 *                       totalCapacity:
 *                         type: integer
 *                         example: 500
 *                       availableTickets:
 *                         type: integer
 *                         example: 495
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-09-08T10:00:00.000Z"
 */
router.get('/', getEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get single event by ID with live availableTickets count
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Firestore document ID of the event
 *         example: "evt_tech_summit_2026"
 *     responses:
 *       200:
 *         description: Event retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "evt_tech_summit_2026"
 *                     title:
 *                         type: string
 *                         example: "Cloud & AI Summit 2026"
 *                     description:
 *                         type: string
 *                         example: "Annual conference exploring modern cloud infrastructure and AI agents."
 *                     category:
 *                         type: string
 *                         example: "Technology"
 *                     eventDate:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-10-15T09:00:00.000Z"
 *                     venue:
 *                         type: string
 *                         example: "Grand Convention Center, Mumbai"
 *                     organizerId:
 *                         type: string
 *                         example: "usr_org_12345"
 *                     ticketPrice:
 *                         type: number
 *                         example: 99.99
 *                     totalCapacity:
 *                         type: integer
 *                         example: 500
 *                     availableTickets:
 *                         type: integer
 *                         example: 495
 *                     createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-09-08T10:00:00.000Z"
 *       404:
 *         description: Event not found
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
 *                   example: "Event not found"
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - eventDate
 *               - venue
 *               - ticketPrice
 *               - totalCapacity
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Cloud & AI Summit 2026"
 *               description:
 *                 type: string
 *                 example: "Annual conference exploring modern cloud infrastructure and AI agents."
 *               category:
 *                 type: string
 *                 example: "Technology"
 *               eventDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-10-15T09:00:00.000Z"
 *               venue:
 *                 type: string
 *                 example: "Grand Convention Center, Mumbai"
 *               ticketPrice:
 *                 type: number
 *                 example: 99.99
 *               totalCapacity:
 *                 type: integer
 *                 example: 500
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
 *                   example: "Event created successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation failed
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
 *                   example: "Validation failed: ticketPrice must be a positive number greater than 0"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires organizer role
 */
router.post('/', auth, authorizeRoles('organizer'), createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update an existing event (Organizer owner only)
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
 *                 example: "Cloud & AI Summit 2026 - Updated"
 *               description:
 *                 type: string
 *                 example: "Expanded workshop tracks included."
 *               category:
 *                 type: string
 *                 example: "Technology"
 *               eventDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-10-16T09:00:00.000Z"
 *               venue:
 *                 type: string
 *                 example: "Grand Convention Center Hall B, Mumbai"
 *               ticketPrice:
 *                 type: number
 *                 example: 120.00
 *               totalCapacity:
 *                 type: integer
 *                 example: 600
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       400:
 *         description: Validation error or cannot reduce total capacity below booked tickets
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not owner of this event
 *       404:
 *         description: Event not found
 */
router.put('/:id', auth, authorizeRoles('organizer'), updateEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete event and cancel associated tickets (Organizer owner only)
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
 *         description: Event and associated tickets cancelled and deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not owner of this event
 *       404:
 *         description: Event not found
 */
router.delete('/:id', auth, authorizeRoles('organizer'), deleteEvent);

/**
 * @swagger
 * /api/events/{id}/attendees:
 *   get:
 *     summary: Get roster of confirmed attendees for an event (Organizer owner only)
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
 *         description: Attendee list retrieved successfully
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
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "tkt_doc_id"
 *                       attendeeName:
 *                         type: string
 *                         example: "Alice Smith"
 *                       attendeeEmail:
 *                         type: string
 *                         example: "alice@example.com"
 *                       quantity:
 *                         type: integer
 *                         example: 2
 *                       totalPaid:
 *                         type: number
 *                         example: 199.98
 *                       bookingRef:
 *                         type: string
 *                         example: "TKT-847291AB"
 *                       bookedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-09-08T11:00:00.000Z"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only event organizer can view attendees
 *       404:
 *         description: Event not found
 */
router.get('/:id/attendees', auth, authorizeRoles('organizer'), getEventAttendees);

module.exports = router;
