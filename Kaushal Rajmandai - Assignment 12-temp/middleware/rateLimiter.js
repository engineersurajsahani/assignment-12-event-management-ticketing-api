const rateLimit = require('express-rate-limit');

const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { success: false, message: 'Too many booking requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { bookingLimiter };