const { rateLimit } = require('express-rate-limit');

const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many booking requests. Please try again after a minute.'
  }
});

module.exports = { bookingLimiter };