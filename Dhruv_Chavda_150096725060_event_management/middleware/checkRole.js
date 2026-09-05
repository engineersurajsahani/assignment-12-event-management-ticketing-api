/**
 * Role-Based Access Control Guard
 * @param  {...string} roles - Permitted roles (Organizer, Attendee)
 */
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User role not found'
      });
    }

    const normalizedAllowed = roles.map(r => r.toLowerCase());
    const userRole = req.user.role.toLowerCase();

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: '${req.user.role}' role is not authorized to access this route`
      });
    }

    next();
  };
};

module.exports = { checkRole };
