const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// A simple in-memory mock for users since Firebase Auth isn't fully set up for this assignment
// In a real app, this would use Firebase Authentication or a 'users' collection in Firestore.
const { db } = require('../config/firebaseConfig');

exports.register = async (req, res) => {
  try {
    const { email, password, role, name } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!['Attendee', 'Organizer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const userRef = db.collection('users').doc(email);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      email,
      name: name || '',
      role,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    await userRef.set(newUser);

    res.status(201).json({ success: true, message: 'Registration successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userRef = db.collection('users').doc(email);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = userDoc.data();

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const payload = {
      id: userDoc.id, // using email as ID for simplicity
      role: user.role,
      email: user.email,
      name: user.name
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

    res.json({ success: true, token, role: user.role });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  res.json({ success: true, user: req.user });
};
