const rateLimit = require('express-rate-limit');

const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many booking requests from this IP, please try again after 1 minute'
  }
});

module.exports = { bookingLimiter };
