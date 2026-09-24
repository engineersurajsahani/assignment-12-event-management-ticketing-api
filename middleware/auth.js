const jwt = require("jsonwebtoken");

// Verify JWT token from Authorization header
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token is required"
    });
  }

  try {
    const secret = process.env.JWT_SECRET || "my_super_secret_jwt_key_2026_ticketing_app";
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // { id, email, role, name }
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

module.exports = authenticateToken;
