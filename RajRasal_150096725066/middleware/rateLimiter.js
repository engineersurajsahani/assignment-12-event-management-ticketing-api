const rateLimit = require('express-rate-limit');

// 10 booking requests per minute limit to prevent bot scalping
const ticketBookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many booking attempts from this IP. Please try again after 60 seconds.'
  }
});

module.exports = { ticketBookingLimiter };
