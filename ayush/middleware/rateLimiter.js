const rateLimit = require('express-rate-limit');

const bookingRateLimiter = rateLimit({
  windowMs: Number(process.env.BOOKING_RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.BOOKING_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user && req.user.id ? req.user.id : req.ip),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many booking requests. Please slow down and try again shortly.'
    });
  }
});

module.exports = bookingRateLimiter;
