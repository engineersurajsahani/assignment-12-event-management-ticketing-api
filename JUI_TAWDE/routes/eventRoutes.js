const express = require("express");

const {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  listAttendees
} = require("../controllers/eventController");

const authenticate = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

const router = express.Router();

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Browse upcoming events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: Event list
 */
router.get("/", listEvents);

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
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event details
 */
router.get("/:id", getEvent);

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Event created
 */
router.post("/", authenticate, checkRole("Organizer"), createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update an owned event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Event updated
 */
router.put("/:id", authenticate, checkRole("Organizer"), updateEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete an owned event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Event deleted
 */
router.delete("/:id", authenticate, checkRole("Organizer"), deleteEvent);

/**
 * @swagger
 * /api/events/{id}/attendees:
 *   get:
 *     summary: List attendees for an owned event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendee list
 */
router.get(
  "/:id/attendees",
  authenticate,
  checkRole("Organizer"),
  listAttendees
);

module.exports = router;