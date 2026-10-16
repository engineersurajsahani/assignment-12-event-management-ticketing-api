const rateLimit = require('express-rate-limit');

exports.bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many booking requests from this IP, please try again after a minute',
  },
});
