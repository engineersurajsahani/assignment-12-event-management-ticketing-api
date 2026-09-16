const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('../config/firebaseConfig');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!['Organizer', 'Attendee'].includes(role)) {
      return res.status(400).json({ message: 'Role must be Organizer or Attendee' });
    }

    const existing = await db.collection('users').where('email', '==', email).get();
    if (!existing.empty) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRef = await db.collection('users').add({
      name,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      id: userRef.id,
      name,
      email,
      role,
      token: generateToken(userRef.id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const snapshot = await db.collection('users').where('email', '==', email).get();
    if (snapshot.empty) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      id: userDoc.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(userDoc.id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/profile
const getProfile = async (req, res) => {
  const { password, ...safeUser } = req.user;
  res.json(safeUser);
};

module.exports = { register, login, getProfile };