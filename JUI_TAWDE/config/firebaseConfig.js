const admin = require("firebase-admin");

let credential;

if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {
  credential = admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  });
} else {
  try {
    const serviceAccount = require("../serviceAccountKey.json");
    credential = admin.credential.cert(serviceAccount);
  } catch (error) {
    throw new Error(
      "Firebase credentials not found. Configure the FIREBASE_* variables in .env or add serviceAccountKey.json."
    );
  }
}

if (!admin.apps.length) {
  admin.initializeApp({ credential });
}

const db = admin.firestore();

module.exports = {
  admin,
  db
};