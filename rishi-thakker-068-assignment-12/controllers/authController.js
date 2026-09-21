const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../config/firebaseConfig");

const usersCollection = db.collection("users");

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "name, email, password and role are required" });
    }

    if (!["Attendee", "Organizer"].includes(role)) {
      return res.status(400).json({ message: "role must be 'Attendee' or 'Organizer'" });
    }

    const existing = await usersCollection.where("email", "==", email).limit(1).get();
    if (!existing.empty) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRef = usersCollection.doc();
    const newUser = {
      id: userRef.id,
      name,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString(),
    };

    await userRef.set(newUser);

    res.status(201).json({
      message: "User registered successfully",
      user: { id: newUser.id, name, email, role },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const snapshot = await usersCollection.where("email", "==", email).limit(1).get();
    if (snapshot.empty) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = snapshot.docs[0].data();
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      "itm",
      { expiresIn: "1d" }
    );

    res.status(200).json({ message: "Login successful", token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.profile = async (req, res) => {
  try {
    const doc = await usersCollection.doc(req.user.id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...userSafe } = doc.data();
    res.status(200).json(userSafe);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
