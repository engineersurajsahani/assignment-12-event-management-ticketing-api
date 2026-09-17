const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { db } = require("../config/firebaseConfig");

const usersCollection = () => db.collection("users");

const createToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "2h"
    }
  );
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role = "Attendee" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "name, email and password are required"
      });
    }

    if (!["Attendee", "Organizer"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "role must be Attendee or Organizer"
      });
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await usersCollection()
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (!existingUser.empty) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRef = usersCollection().doc();

    const user = {
      id: userRef.id,
      name,
      email: normalizedEmail,
      passwordHash,
      role,
      createdAt: new Date().toISOString()
    };

    await userRef.set(user);

    const token = createToken(user);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password are required"
      });
    }

    const normalizedEmail = email.toLowerCase();

    const snapshot = await usersCollection()
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const user = snapshot.docs[0].data();
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = createToken(user);

    return res.json({
      success: true,
      message: "Login successful",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

const profile = (req, res) => {
  return res.json({
    success: true,
    data: req.user
  });
};

module.exports = {
  register,
  login,
  profile
};