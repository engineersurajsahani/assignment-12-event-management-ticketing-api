const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebaseConfig');

const USERS_COLLECTION = 'users';

/**
 * Register a new user (Organizer or Attendee)
 * Role defaults to 'attendee' if omitted or invalid.
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: name, email, and password are required'
      });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: password must be at least 6 characters long'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: invalid email format'
      });
    }

    // Role sanitation: only 'organizer' or 'attendee', default to 'attendee'
    const assignedRole = role === 'organizer' ? 'organizer' : 'attendee';

    // Check if user already exists
    const userSnapshot = await db
      .collection(USERS_COLLECTION)
      .where('email', '==', normalizedEmail)
      .get();

    if (!userSnapshot.empty) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const createdAt = new Date().toISOString();
    const newUserRef = db.collection(USERS_COLLECTION).doc();

    const userData = {
      id: newUserRef.id,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: assignedRole,
      createdAt
    };

    await newUserRef.set(userData);

    // Return profile without passwordHash
    const { passwordHash: _, ...safeUser } = userData;

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: safeUser
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      error: error.message
    });
  }
};

/**
 * Login user and generate JWT token
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: email and password are required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Query Firestore for user by email
    const userSnapshot = await db
      .collection(USERS_COLLECTION)
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // Compare passwords
    const isMatch = await bcrypt.compare(password, userData.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Sign JWT
    const payload = {
      id: userData.id || userDoc.id,
      role: userData.role,
      email: userData.email
    };

    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_event_ticketing_api_2026';
    const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

    const token = jwt.sign(payload, secret, { expiresIn });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        id: userData.id || userDoc.id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      error: error.message
    });
  }
};

/**
 * Get authenticated user profile
 */
const getProfile = async (req, res) => {
  try {
    const userDoc = await db.collection(USERS_COLLECTION).doc(req.user.id).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    const userData = userDoc.data();
    const { passwordHash: _, ...safeProfile } = userData;

    return res.status(200).json({
      success: true,
      data: {
        id: userDoc.id,
        ...safeProfile
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error fetching profile',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getProfile
};
