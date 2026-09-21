const jwt = require('jsonwebtoken');
const { getDb } = require('../config/firebaseConfig');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [Organizer, Attendee]
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input or user already exists
 */

exports.register = async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }

  if (!['Organizer', 'Attendee'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role must be Organizer or Attendee' });
  }

  try {
    const db = getDb();
    const usersRef = db.collection('users');
    const existingUser = await usersRef.where('email', '==', email).get();

    if (!existingUser.empty) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const userRef = usersRef.doc();
    const userData = {
      id: userRef.id,
      email,
      password: hashedPassword,
      name,
      role,
      createdAt: new Date().toISOString()
    };

    await userRef.set(userData);

    const token = jwt.sign(
      { id: userData.id, email: userData.email, role: userData.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userResponse } = userData;
    res.status(201).json({ success: true, message: 'Registration successful', data: { user: userResponse, token } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 */

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  try {
    const db = getDb();
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, userData.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: userData.id, email: userData.email, role: userData.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userResponse } = userData;
    res.status(200).json({ success: true, message: 'Login successful', data: { user: userResponse, token } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */

exports.getProfile = async (req, res) => {
  try {
    const db = getDb();
    const userDoc = await db.collection('users').doc(req.user.id).get();

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { password, ...userResponse } = userDoc.data();
    res.status(200).json({ success: true, data: userResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
