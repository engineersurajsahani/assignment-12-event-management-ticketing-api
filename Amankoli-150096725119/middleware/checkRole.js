// middleware/checkRole.js
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ success: false, message: 'Forbidden: No role assigned' });
    }

    const userRole = req.user.role.toLowerCase();
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Only [${allowedRoles.join(', ')}] can perform this action.`
      });
    }

    next();
  };
};

module.exports = checkRole;
