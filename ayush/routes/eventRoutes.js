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
const checkRole = require('../middleware/checkRole');

router.get('/', getEvents);

router.get('/:id', getEventById);

router.post('/', auth, checkRole('Organizer'), createEvent);

router.put('/:id', auth, checkRole('Organizer'), updateEvent);

router.delete('/:id', auth, checkRole('Organizer'), deleteEvent);

router.get('/:id/attendees', auth, checkRole('Organizer'), getEventAttendees);

module.exports = router;
