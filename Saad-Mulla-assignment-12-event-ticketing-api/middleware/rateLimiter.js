const rateLimit = require('express-rate-limit');

const bookingRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many booking attempts from this IP. Please try again after a minute.'
  }
});

module.exports = { bookingRateLimiter };