const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebaseConfig');

const JWT_SECRET = process.env.JWT_SECRET || 'assignment12_ticketing_secret_key_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const usersRef = () => db.collection('users');

const sanitizeUser = (doc) => {
  const data = { id: doc.id, ...doc.data() };
  delete data.password;
  return data;
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register as Attendee or Organizer
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name:          { type: string, example: Kunal Sharma }
 *               email:         { type: string, example: kunal@gmail.com }
 *               password:      { type: string, format: password, example: securePass123 }
 *               role:          { type: string, enum: [attendee, organizer], example: attendee }
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error / duplicate email
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email and password are required' });
    }

    const normalizedRole = role === 'organizer' ? 'organizer' : 'attendee';
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const emailKey = email.trim().toLowerCase();
    const existing = await usersRef().where('email', '==', emailKey).limit(1).get();
    if (!existing.empty) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const userRef = usersRef().doc();
    const hashedPassword = await bcrypt.hash(password, 10);

    await userRef.set({
      id: userRef.id,
      name,
      email: emailKey,
      password: hashedPassword,
      role: normalizedRole,
      createdAt: new Date().toISOString()
    });

    const doc = await userRef.get();
    const token = jwt.sign(
      { id: doc.id, email: emailKey, role: normalizedRole },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user: sanitizeUser(doc), token }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate and obtain JWT token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, example: kunal@gmail.com }
 *               password: { type: string, format: password, example: securePass123 }
 *     responses:
 *       200:
 *         description: Login successful, token issued
 *       401:
 *         description: Invalid credentials
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }

    const emailKey = email.trim().toLowerCase();
    const snapshot = await usersRef().where('email', '==', emailKey).limit(1).get();
    if (snapshot.empty) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: userDoc.id, email: userData.email, role: userData.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: sanitizeUser(userDoc), token }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Retrieve authenticated user profile & role
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized / invalid token
 */
exports.profile = async (req, res, next) => {
  try {
    const doc = await usersRef().doc(req.user.id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, data: sanitizeUser(doc) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};