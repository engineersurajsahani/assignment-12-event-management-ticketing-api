const express = require('express');
const { bookTicket, myTickets, cancelTicket } = require('../controllers/ticketController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { bookingLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/book', bookingLimiter, auth, checkRole('attendee'), bookTicket);
router.get('/my-tickets', auth, checkRole('attendee'), myTickets);
router.post('/:id/cancel', auth, checkRole('attendee'), cancelTicket);

module.exports = router;