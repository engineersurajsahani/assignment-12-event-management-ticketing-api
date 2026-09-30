const express = require("express");

const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
} = require("../controllers/eventController");

const authenticate = require("../middleware/auth");
const checkOrg = require("../middleware/checkOrg");

const router = express.Router();

router.get("/", getEvents);

router.get("/:id", getEventById);

router.post("/", authenticate, checkOrg, createEvent);

router.put("/:id", authenticate, checkOrg, updateEvent);

router.delete("/:id", authenticate, checkOrg, deleteEvent);

module.exports = router;