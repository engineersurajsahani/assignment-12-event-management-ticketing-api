const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebaseConfig');

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, role'
      });
    }

    // Role validation
    const validRoles = ['Organizer', 'Attendee'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be either "Organizer" or "Attendee"'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const usersRef = db.collection('users');
    const existingUserSnapshot = await usersRef.where('email', '==', normalizedEmail).limit(1).get();

    if (!existingUserSnapshot.empty) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user document
    const newUserRef = usersRef.doc();
    const newUser = {
      id: newUserRef.id,
      name,
      email: normalizedEmail,
      passwordHash,
      role,
      createdAt: new Date().toISOString()
    };

    await newUserRef.set(newUser);

    // Issue JWT token
    const secret = process.env.JWT_SECRET || 'super_secret_event_ticketing_jwt_key_2026';
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role },
      secret,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', normalizedEmail).limit(1).get();

    if (snapshot.empty) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Issue JWT token
    const secret = process.env.JWT_SECRET || 'super_secret_event_ticketing_jwt_key_2026';
    const token = jwt.sign(
      { id: user.id, role: user.role },
      secret,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/profile
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    const userData = userDoc.data();
    delete userData.passwordHash;

    return res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    next(error);
  }
};
