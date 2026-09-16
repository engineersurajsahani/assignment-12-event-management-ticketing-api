// middleware/auth.js
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebaseConfig');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userDoc = await db.collection('users').doc(decoded.id).get();
    if (!userDoc.exists) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = { id: userDoc.id, ...userDoc.data() };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

module.exports = { protect };