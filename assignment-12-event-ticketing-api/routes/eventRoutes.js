const express = require('express');
const { getEvents, getEventById, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { getAttendees } = require('../controllers/ticketController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

const router = express.Router();

router.get('/', getEvents);
router.get('/:id/attendees', auth, checkRole('organizer'), getAttendees);
router.get('/:id', getEventById);
router.post('/', auth, checkRole('organizer'), createEvent);
router.put('/:id', auth, checkRole('organizer'), updateEvent);
router.delete('/:id', auth, checkRole('organizer'), deleteEvent);

module.exports = router;