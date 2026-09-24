const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin initialized with serviceAccountKey.json");
  } else {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || "event-ticketing-187"
    });
    console.log("Firebase Admin initialized with Project ID");
  }
}

const db = admin.firestore();

module.exports = { admin, db };
