const express = require('express');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const bookingLimiter = require('../middleware/rateLimiter');
const ticketController = require('../controllers/ticketController');

const router = express.Router();

router.post('/book', auth, checkRole('Attendee'), bookingLimiter, ticketController.bookTicket);
router.get('/my-tickets', auth, checkRole('Attendee'), ticketController.getMyTickets);
router.post('/:id/cancel', auth, checkRole('Attendee'), ticketController.cancelTicket);

module.exports = router;
