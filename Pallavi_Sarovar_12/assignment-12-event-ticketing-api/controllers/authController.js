const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebaseConfig');

function createToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'attendee' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }

    if (!['attendee', 'organizer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be attendee or organizer.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must contain at least 6 characters.' });
    }

    const emailLower = email.trim().toLowerCase();
    const existing = await db.collection('users').where('email', '==', emailLower).limit(1).get();

    if (!existing.empty) {
      return res.status(409).json({ success: false, message: 'Email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const ref = db.collection('users').doc();

    const user = {
      id: ref.id,
      name: name.trim(),
      email: emailLower,
      passwordHash,
      role,
      createdAt: new Date().toISOString()
    };

    await ref.set(user);

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = createToken(safeUser);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: { user: safeUser, token }
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const snapshot = await db.collection('users')
      .where('email', '==', email.trim().toLowerCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = snapshot.docs[0].data();
    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.json({
      success: true,
      message: 'Login successful.',
      data: { user: safeUser, token: createToken(safeUser) }
    });
  } catch (error) {
    next(error);
  }
};

exports.profile = async (req, res, next) => {
  try {
    const doc = await db.collection('users').doc(req.user.id).get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = doc.data();
    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};