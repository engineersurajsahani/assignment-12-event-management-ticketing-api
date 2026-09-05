const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebaseConfig');

const generateToken = (id, email, name, role) => {
  return jwt.sign(
    { id, email, name, role },
    process.env.JWT_SECRET || 'super_secret_event_jwt_key_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register a new user (Attendee or Organizer)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    const normalizedRole = role && role.toLowerCase() === 'organizer' ? 'Organizer' : 'Attendee';
    const emailLower = email.toLowerCase().trim();

    // Check if user already exists
    const usersRef = db.collection('users');
    const existingUsers = await usersRef.where('email', '==', emailLower).get();

    if (!existingUsers.empty) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user document
    const userDocRef = usersRef.doc();
    const newUser = {
      id: userDocRef.id,
      name: name.trim(),
      email: emailLower,
      password: hashedPassword,
      role: normalizedRole,
      createdAt: new Date().toISOString()
    };

    await userDocRef.set(newUser);

    const token = generateToken(newUser.id, newUser.email, newUser.name, newUser.role);

    res.status(201).json({
      success: true,
      message: `${normalizedRole} registered successfully`,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Authenticate user & get JWT
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const emailLower = email.toLowerCase().trim();
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', emailLower).get();

    if (snapshot.empty) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = snapshot.docs[0].data();
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user.id, user.email, user.name, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
};
