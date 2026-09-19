const express = require('express');
const router = express.Router();
const {
  bookTicket,
  getMyTickets,
  cancelTicket
} = require('../controllers/ticketController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { bookingLimiter } = require('../middleware/rateLimiter');

router.post('/book', auth, checkRole('Attendee'), bookingLimiter, bookTicket);
router.get('/my-tickets', auth, checkRole('Attendee'), getMyTickets);
router.post('/:id/cancel', auth, checkRole('Attendee'), cancelTicket);

module.exports = router;
