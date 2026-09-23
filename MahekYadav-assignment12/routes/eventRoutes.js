const r=require("express").Router(),c=require("../controllers/eventController"),auth=require("../middleware/auth"),role=require("../middleware/checkRole");
/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Browse upcoming events
 *     tags: [Events]
 *     parameters:
 *       - {in: query, name: category, schema: {type: string}}
 *       - {in: query, name: city, schema: {type: string}}
 *     responses:
 *       200: {description: Upcoming events}
 */
r.get("/",c.listEvents);
/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: View event details and remaining tickets
 *     tags: [Events]
 *     parameters:
 *       - {in: path, name: id, required: true, schema: {type: string}}
 *     responses:
 *       200: {description: Event details}
 */
r.get("/:id",c.getEvent);
/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create event
 *     tags: [Events]
 *     security: [{bearerAuth: []}]
 *     responses:
 *       201: {description: Event created}
 */
r.post("/",auth,role("organizer"),c.createEvent);
/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update owned event
 *     tags: [Events]
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200: {description: Event updated}
 */
r.put("/:id",auth,role("organizer"),c.updateEvent);
/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Cancel and delete owned event
 *     tags: [Events]
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200: {description: Event deleted}
 */
r.delete("/:id",auth,role("organizer"),c.deleteEvent);
/**
 * @swagger
 * /api/events/{id}/attendees:
 *   get:
 *     summary: List attendees for owned event
 *     tags: [Events]
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200: {description: Attendee list}
 */
r.get("/:id/attendees",auth,role("organizer"),c.listAttendees);
module.exports=r;
