const admin = require('firebase-admin');

let db;

const initializeFirebase = () => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        clientId: process.env.FIREBASE_CLIENT_ID,
        authUri: 'https://accounts.google.com/o/oauth2/auth',
        tokenUri: 'https://oauth2.googleapis.com/token',
        authProviderX509CertUrl: 'https://www.googleapis.com/oauth2/v1/certs',
        clientC509CertUrl: process.env.FIREBASE_CLIENT_CERT_URL
      })
    });
  }
  db = admin.firestore();
  return db;
};

const getDb = () => {
  if (!db) {
    throw new Error('Firebase not initialized. Call initializeFirebase first.');
  }
  return db;
};

module.exports = { initializeFirebase, getDb, db: getDb };
