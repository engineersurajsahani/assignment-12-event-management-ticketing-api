const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User profile role not found.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Action requires role: ${allowedRoles.join(' or ')}. Your role is: ${req.user.role}`
      });
    }

    next();
  };
};

module.exports = checkRole;
