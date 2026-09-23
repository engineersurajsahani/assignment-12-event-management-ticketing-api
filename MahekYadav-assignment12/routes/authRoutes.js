const r=require("express").Router(),c=require("../controllers/authController"),auth=require("../middleware/auth");
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register an attendee or organizer
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name,email,password]
 *             properties:
 *               name: {type: string, example: Kunal Sharma}
 *               email: {type: string, example: kunal@gmail.com}
 *               password: {type: string, example: password123}
 *               role: {type: string, enum: [attendee,organizer], example: attendee}
 *     responses:
 *       201: {description: Registered}
 */
r.post("/register",c.register);
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login and receive JWT
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email,password]
 *             properties:
 *               email: {type: string}
 *               password: {type: string}
 *     responses:
 *       200: {description: Login successful}
 */
r.post("/login",c.login);
/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current profile
 *     tags: [Authentication]
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200: {description: Profile}
 */
r.get("/profile",auth,c.profile);module.exports=r;
