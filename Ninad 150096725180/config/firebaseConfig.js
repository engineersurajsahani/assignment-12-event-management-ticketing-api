const admin = require('firebase-admin');

try {
  const serviceAccount = require('../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin Initialized successfully.');
} catch (error) {
  console.log('Firebase Admin Initialization Error: Please make sure serviceAccountKey.json exists.');
}

const db = admin.firestore ? admin.firestore() : null;

module.exports = { admin, db };
