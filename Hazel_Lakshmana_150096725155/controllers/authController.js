const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../config/firebaseConfig");

const token = (u) =>
    jwt.sign(
        {
            id: u.id,
            email: u.email,
            role: u.role,
            name: u.name
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "2h"
        }
    );

exports.register = async (req, res) => {
    try {
        const { name, email, password, role = "attendee" } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "name, email and password are required."
            });
        }

        if (!["attendee", "organizer"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be attendee or organizer."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters."
            });
        }

        const e = email.trim().toLowerCase();

        const q = await db
            .collection("users")
            .where("email", "==", e)
            .limit(1)
            .get();

        if (!q.empty) {
            return res.status(409).json({
                success: false,
                message: "Email already registered."
            });
        }

        const ref = db.collection("users").doc();

        const u = {
            id: ref.id,
            name: name.trim(),
            email: e,
            passwordHash: await bcrypt.hash(password, 12),
            role,
            createdAt: new Date().toISOString()
        };

        await ref.set(u);

        const safe = {
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role
        };

        res.status(201).json({
            success: true,
            message: "Registration successful.",
            data: {
                user: safe,
                token: token(safe)
            }
        });
    } catch (e) {
        console.error(e);

        res.status(500).json({
            success: false,
            message: "Registration failed."
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "email and password are required."
            });
        }

        const e = email.trim().toLowerCase();

        const q = await db
            .collection("users")
            .where("email", "==", e)
            .limit(1)
            .get();

        if (q.empty) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const u = q.docs[0].data();

        if (!await bcrypt.compare(password, u.passwordHash)) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const safe = {
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role
        };

        res.json({
            success: true,
            message: "Login successful.",
            data: {
                user: safe,
                token: token(safe)
            }
        });
    } catch (e) {
        console.error(e);

        res.status(500).json({
            success: false,
            message: "Login failed."
        });
    }
};

exports.profile = async (req, res) => {
    try {
        const d = await db
            .collection("users")
            .doc(req.user.id)
            .get();

        if (!d.exists) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const u = d.data();

        res.json({
            success: true,
            data: {
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                createdAt: u.createdAt
            }
        });
    } catch (e) {
        console.error(e);

        res.status(500).json({
            success: false,
            message: "Could not load profile."
        });
    }
};
