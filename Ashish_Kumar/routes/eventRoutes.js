const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const authenticateToken = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management and discovery
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
 *         description: Filter events by category (e.g. Technology, Music)
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter events by city in venue
 *     responses:
 *       200:
 *         description: List of upcoming events
 */
router.get("/", eventController.getEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: View event details & live remaining ticket count
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
 *         description: Event details
 *       404:
 *         description: Event not found
 */
router.get("/:id", eventController.getEventById);

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event listing (Organizer only)
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
 *                 example: Global Cloud & AI Summit 2026
 *               description:
 *                 type: string
 *                 example: Annual flagship backend conference
 *               category:
 *                 type: string
 *                 example: Technology
 *               eventDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-06-15T09:00:00Z
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
 *       403:
 *         description: Forbidden - Requires Organizer role
 */
router.post("/", authenticateToken, checkRole("Organizer"), eventController.createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update event details (Organizer must own event)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
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
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       403:
 *         description: Forbidden - Not the event owner
 *       404:
 *         description: Event not found
 */
router.put("/:id", authenticateToken, checkRole("Organizer"), eventController.updateEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Cancel and delete event (Organizer must own event)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       403:
 *         description: Forbidden - Not the event owner
 *       404:
 *         description: Event not found
 */
router.delete("/:id", authenticateToken, checkRole("Organizer"), eventController.deleteEvent);

/**
 * @swagger
 * /api/events/{id}/attendees:
 *   get:
 *     summary: List all registered attendees for an event (Organizer only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of registered attendees
 *       403:
 *         description: Forbidden - Not the event owner
 *       404:
 *         description: Event not found
 */
router.get("/:id/attendees", authenticateToken, checkRole("Organizer"), eventController.getEventAttendees);

module.exports = router;
