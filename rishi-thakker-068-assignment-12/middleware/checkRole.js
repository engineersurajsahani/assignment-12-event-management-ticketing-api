// Usage: checkRole("Organizer") or checkRole("Attendee") — must run AFTER auth,
// since it reads request.user.role set by the decoded JWT.
const checkRole = (...allowedRoles) => {
  return (request, response, next) => {
    if (!request.user || !request.user.role) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return response.status(403).json({ message: "Forbidden: insufficient permissions" });
    }

    next();
  };
};

module.exports = checkRole;
