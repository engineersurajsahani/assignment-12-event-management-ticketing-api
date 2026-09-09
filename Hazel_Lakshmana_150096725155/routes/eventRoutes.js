const r = require("express").Router();
const c = require("../controllers/eventController");
const auth = require("../middleware/auth");
const role = require("../middleware/checkRole");

r.get("/", c.listEvents);

r.get("/:id", c.getEvent);

r.post("/", auth, role("organizer"), c.createEvent);

r.put("/:id", auth, role("organizer"), c.updateEvent);

r.delete("/:id", auth, role("organizer"), c.deleteEvent);

r.get(
    "/:id/attendees",
    auth,
    role("organizer"),
    c.listAttendees
);

module.exports = r;
