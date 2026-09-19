const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ success: false, message: 'Access denied: No role specified' });
    }

    const hasRole = allowedRoles.some(
      (role) => role.toLowerCase() === req.user.role.toLowerCase()
    );

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: requires one of [${allowedRoles.join(', ')}] role`
      });
    }

    next();
  };
};

module.exports = checkRole;
