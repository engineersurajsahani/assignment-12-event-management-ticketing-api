const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function initializeFirebase() {
  if (admin.apps.length) return admin.firestore();

  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : path.join(process.cwd(), 'serviceAccountKey.json');

  if (fs.existsSync(keyPath)) {
    const serviceAccount = require(keyPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
  } else {
    throw new Error(
      'Firebase credentials not found. Add serviceAccountKey.json or Firebase environment variables.'
    );
  }

  return admin.firestore();
}

const db = initializeFirebase();
module.exports = { admin, db };