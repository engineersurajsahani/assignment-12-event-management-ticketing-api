const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

if (!admin.apps.length) {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    console.warn(
      '⚠️ Warning: serviceAccountKey.json not found in root. Using default or mock credentials for initialization.'
    );
    // Initialize with application default or dummy project if file is missing in development/test
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'event-ticketing-demo'
    });
  }
}

const db = admin.firestore();

// Optional settings for Firestore
try {
  db.settings({ ignoreUndefinedProperties: true });
} catch (e) {
  // Ignore if already configured
}

module.exports = { admin, db };
