const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided. Include an Authorization: Bearer <token> header.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError' ? 'Token expired, please log in again.' : 'Invalid or malformed token.';
    return res.status(401).json({ success: false, message });
  }
}

module.exports = auth;
