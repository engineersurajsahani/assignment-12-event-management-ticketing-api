const { db } = require('../config/firebaseConfig');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  
  if (role !== 'Organizer' && role !== 'Attendee') {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  if (!db) {
      return res.status(500).json({ success: false, message: 'Firebase not initialized. Please configure serviceAccountKey.json.' });
  }

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    if (!snapshot.empty) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUserRef = usersRef.doc();
    const newUser = {
      id: newUserRef.id,
      name,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString()
    };

    await newUserRef.set(newUser);
    res.status(201).json({ success: true, message: 'User registered successfully', data: { id: newUser.id, name, email, role } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!db) {
      return res.status(500).json({ success: false, message: 'Firebase not initialized. Please configure serviceAccountKey.json.' });
  }
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    if (snapshot.empty) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    let user;
    snapshot.forEach(doc => {
      user = doc.data();
    });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret_key', { expiresIn: '1d' });
    res.status(200).json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.profile = async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};
