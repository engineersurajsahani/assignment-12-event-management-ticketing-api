const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db, store } = require('../config/firebaseConfig');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password required' });
    }

    const assignedRole = role && role.toLowerCase() === 'organizer' ? 'Organizer' : 'Attendee';

    const exist = store.users.find((u) => u.email === email.toLowerCase());
    if (exist) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const userId = `usr_${uuidv4().slice(0, 8)}`;
    const user = {
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hash,
      role: assignedRole,
      createdAt: new Date().toISOString()
    };

    store.users.push(user);

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'supersecretjwtkey_event12',
      { expiresIn: '7d' }
    );

    const { password: _, ...safeUser } = user;
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user: safeUser, token }
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = store.users.find((u) => u.email === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'supersecretjwtkey_event12',
      { expiresIn: '7d' }
    );

    const { password: _, ...safeUser } = user;
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: safeUser, token }
    });
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = store.users.find((u) => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { password: _, ...safeUser } = user;
    return res.status(200).json({
      success: true,
      data: safeUser
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getProfile };
