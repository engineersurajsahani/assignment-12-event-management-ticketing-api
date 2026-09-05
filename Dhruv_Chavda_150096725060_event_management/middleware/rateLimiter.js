const rateLimit = require('express-rate-limit');

/**
 * Strict Rate Limiter for Ticket Booking
 * Limits requests to 10 per 60-second window to prevent scalper bots & DDoS
 */
const bookingRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 booking requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  statusCode: 429,
  message: {
    success: false,
    message: 'Too Many Requests: Booking rate limit exceeded (10 requests per minute). Please try again later.'
  }
});

module.exports = { bookingRateLimiter };
