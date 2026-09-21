const rateLimit = require('express-rate-limit');

const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many booking requests. Please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many booking requests. Maximum 10 requests per minute allowed. Please try again later.'
    });
  }
});

module.exports = bookingLimiter;
