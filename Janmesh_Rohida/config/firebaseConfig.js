const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

if (!admin.apps.length) {
  let credential;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : process.env.FIREBASE_SERVICE_ACCOUNT;
      credential = admin.credential.cert(serviceAccount);
      console.log('🔒 Firebase Admin initializing via FIREBASE_SERVICE_ACCOUNT environment variable.');
    } catch (err) {
      console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT environment variable:', err.message);
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    credential = admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    console.log('🔒 Firebase Admin initializing via GOOGLE_APPLICATION_CREDENTIALS path.');
  } else {
    const keyPath = path.join(__dirname, '../serviceAccountKey.json');
    if (fs.existsSync(keyPath)) {
      const serviceAccount = require(keyPath);
      credential = admin.credential.cert(serviceAccount);
      console.log('🔒 Firebase Admin initializing via local serviceAccountKey.json file.');
    } else {
      console.warn('⚠️ Warning: serviceAccountKey.json not found and FIREBASE_SERVICE_ACCOUNT env variable is not set.');
      console.warn('Please add serviceAccountKey.json to project root or set FIREBASE_SERVICE_ACCOUNT for database operations.');
    }
  }

  try {
    if (credential) {
      admin.initializeApp({ credential });
      console.log('✅ Firebase Admin initialized successfully.');
    } else {
      // Fallback initialization (e.g. for GCP/Firebase hosting or local testing before keys are provided)
      admin.initializeApp();
      console.log('ℹ️ Firebase Admin initialized with default credentials.');
    }
  } catch (error) {
    console.warn('ℹ️ Firebase Admin initialization notice:', error.message);
  }
}

const db = admin.firestore();

module.exports = { admin, db };
