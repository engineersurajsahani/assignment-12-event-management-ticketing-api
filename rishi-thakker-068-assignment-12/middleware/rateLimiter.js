const rateLimit = require("express-rate-limit");

// 10 requests per minute per IP on the booking route, per the assignment spec.
const bookingRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: "Too many booking requests, please try again in a minute" },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = bookingRateLimiter;
