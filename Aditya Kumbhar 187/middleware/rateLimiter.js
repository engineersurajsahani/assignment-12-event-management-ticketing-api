const rateLimit = require("express-rate-limit");

// Strict rate limiter for ticket booking to prevent scalper bots (10 requests per minute)
const bookingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 10, // Limit each IP to 10 booking requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many booking requests from this IP, please try again after 1 minute."
  }
});

// General API rate limiter (100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes."
  }
});

module.exports = {
  bookingLimiter,
  apiLimiter
};
