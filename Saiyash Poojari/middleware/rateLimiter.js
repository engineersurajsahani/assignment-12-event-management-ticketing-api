const rateLimit = require('express-rate-limit');

const bookingRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 10, // Max 10 booking attempts per window per IP
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many booking requests from this IP. Scalper bot prevention active. Please try again after 1 minute.'
  }
});

module.exports = { bookingRateLimiter };
