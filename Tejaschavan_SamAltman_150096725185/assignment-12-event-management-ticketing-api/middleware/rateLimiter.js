const rateLimit = require('express-rate-limit');

/**
 * Rate limiter specifically configured for ticket booking:
 * - 10 booking requests per 1-minute window per IP / User
 * - Responds with 429 Too Many Requests
 */
const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // Limit each IP / user to 10 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // If user is authenticated, rate limit per user ID; otherwise fallback to IP
    return req.user && req.user.id ? req.user.id : req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many booking attempts, please try again later.'
    });
  }
});

/**
 * General API rate limiter (defense-in-depth):
 * - 100 requests per 1-minute window
 */
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 100, // Limit each IP to 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please slow down.'
    });
  }
});

module.exports = {
  bookingLimiter,
  generalLimiter
};
