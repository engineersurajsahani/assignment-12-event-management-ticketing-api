const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebaseConfig');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_event_management_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * @desc Register a new user (Attendee or Organizer)
 * @route POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.'
      });
    }

    const userRole = role && ['attendee', 'organizer'].includes(role.toLowerCase())
      ? role.toLowerCase()
      : 'attendee';

    // Check if user already exists
    const usersRef = db.collection('users');
    const existingUsers = await usersRef.where('email', '==', email.toLowerCase()).get();

    if (!existingUsers.empty) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user doc
    const newDocRef = usersRef.doc();
    const userId = newDocRef.id || `usr_${Date.now()}`;

    const newUser = {
      id: userId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: userRole,
      createdAt: new Date().toISOString()
    };

    await newDocRef.set(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { id: userId, name, email: newUser.email, role: userRole },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: {
        id: userId,
        name,
        email: newUser.email,
        role: userRole,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration.',
      error: error.message
    });
  }
};

/**
 * @desc Login user & get JWT token
 * @route POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.'
      });
    }

    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.where('email', '==', email.toLowerCase()).get();

    if (userSnapshot.empty) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // Verify password
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: userData.id, name: userData.name, email: userData.email, role: userData.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
      error: error.message
    });
  }
};

/**
 * @desc Get current authenticated user profile
 * @route GET /api/auth/profile
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    const userData = userDoc.data();
    delete userData.password;

    return res.status(200).json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving user profile.',
      error: error.message
    });
  }
};
