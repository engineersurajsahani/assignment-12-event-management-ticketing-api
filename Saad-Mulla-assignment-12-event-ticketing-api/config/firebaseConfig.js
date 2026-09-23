const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (err) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', err.message);
  }
} else {
  console.warn('WARNING: No Firebase Service Account found. Provide serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT env variable.');
  admin.initializeApp();
}

const db = admin.firestore();
module.exports = { admin, db };