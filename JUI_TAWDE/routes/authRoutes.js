const express = require("express");

const {
  register,
  login,
  profile
} = require("../controllers/authController");

const authenticate = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a user
 *     tags: [Authentication]
 *     responses:
 *       201:
 *         description: Registration successful
 */
router.post("/register", register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login and receive a JWT
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get the current user's profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get("/profile", authenticate, profile);

module.exports = router;