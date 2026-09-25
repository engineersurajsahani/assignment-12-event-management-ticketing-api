const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

function buildCredential() {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,

      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    });
  }

  const serviceAccountPath = path.resolve(
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json'
  );


  const serviceAccount = require(serviceAccountPath);
  return admin.credential.cert(serviceAccount);
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: buildCredential()
    });
  } catch (err) {
    console.error('❌ Failed to initialize Firebase Admin SDK.');
    console.error('   Make sure serviceAccountKey.json exists (see .env.example) or that');
    console.error('   FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY are set.');
    console.error('   Original error:', err.message);
    process.exit(1);
  }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
