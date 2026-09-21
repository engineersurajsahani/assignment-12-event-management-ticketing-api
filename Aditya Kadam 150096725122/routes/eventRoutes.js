const express = require('express');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const eventController = require('../controllers/eventController');

const router = express.Router();

router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);

router.post('/', auth, checkRole('Organizer'), eventController.createEvent);
router.put('/:id', auth, checkRole('Organizer'), eventController.updateEvent);
router.delete('/:id', auth, checkRole('Organizer'), eventController.deleteEvent);

router.get('/:id/attendees', auth, checkRole('Organizer'), eventController.getEventAttendees);

module.exports = router;
