/**
 * Role-Based Access Control Middleware
 * Restricts access to endpoints based on user roles (e.g. 'organizer', 'attendee').
 *
 * @param {...string} roles - Allowed roles for the endpoint
 * @returns {Function} Express middleware function
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User context missing'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access denied. Requires one of the following roles: [${roles.join(', ')}]`
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
