const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebaseConfig');

const USERS_COLLECTION = 'users';
const VALID_ROLES = ['Organizer', 'Attendee'];

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'name, email, password and role are all required.'
      });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `role must be one of: ${VALID_ROLES.join(', ')}`
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const usersRef = db.collection(USERS_COLLECTION);
    const existing = await usersRef.where('email', '==', email.toLowerCase()).limit(1).get();

    if (!existing.empty) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserRef = usersRef.doc();

    const userDoc = {
      id: newUserRef.id,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString()
    };

    await newUserRef.set(userDoc);

    const token = signToken(userDoc);
    const { password: _pw, ...safeUser } = userDoc;

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: { user: safeUser, token }
    });
  } catch (error) {
    console.error('register error:', error);
    return res.status(500).json({ success: false, message: 'Failed to register user.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required.' });
    }

    const usersRef = db.collection(USERS_COLLECTION);
    const snapshot = await usersRef.where('email', '==', email.toLowerCase()).limit(1).get();

    if (snapshot.empty) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const userDoc = snapshot.docs[0].data();
    const isMatch = await bcrypt.compare(password, userDoc.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken(userDoc);
    const { password: _pw, ...safeUser } = userDoc;

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: { user: safeUser, token }
    });
  } catch (error) {
    console.error('login error:', error);
    return res.status(500).json({ success: false, message: 'Failed to log in.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userRef = db.collection(USERS_COLLECTION).doc(req.user.id);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { password: _pw, ...safeUser } = doc.data();
    return res.status(200).json({ success: true, data: safeUser });
  } catch (error) {
    console.error('getProfile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};
