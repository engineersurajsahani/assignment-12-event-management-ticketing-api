const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Usually you would load the service account from a JSON file
// const serviceAccount = require('../serviceAccountKey.json');
// For this assignment, we might mock it or require it if present
let db;
try {
  const serviceAccount = require('../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  db = admin.firestore();
  console.log('Firebase initialized');
} catch (err) {
  console.warn('Firebase initialization failed (missing serviceAccountKey.json)');
  // Fallback for tests if needed
}

module.exports = { admin, db };
