const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebaseConfig');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET || 'firebase_ticketing_secure_jwt_key_2026',
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const assignedRole = role && role.toLowerCase() === 'organizer' ? 'Organizer' : 'Attendee';
    const usersSnapshot = await db.collection('users').get();
    let userExists = false;

    usersSnapshot.forEach(doc => {
      if (doc.data().email.toLowerCase() === email.toLowerCase().trim()) {
        userExists = true;
      }
    });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRef = db.collection('users').doc();
    const newUser = {
      id: userRef.id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: assignedRole,
      createdAt: new Date().toISOString()
    };

    await userRef.set(newUser);
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: `${assignedRole} registered successfully`,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const usersSnapshot = await db.collection('users').get();
    let foundUser = null;

    usersSnapshot.forEach(doc => {
      const u = doc.data();
      if (u.email.toLowerCase() === email.toLowerCase().trim()) {
        foundUser = u;
      }
    });

    if (!foundUser) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(foundUser);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
};
