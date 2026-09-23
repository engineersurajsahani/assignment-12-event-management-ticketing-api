const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * Validates the JWT Bearer token from the Authorization header,
 * decodes the payload, and attaches `req.user` = { id, role, email }.
 */
const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Missing or invalid Bearer token'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Token not provided'
      });
    }

    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_event_ticketing_api_2026';
    const decoded = jwt.verify(token, secret);

    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Token has expired'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid token signature or payload'
    });
  }
};

module.exports = auth;
