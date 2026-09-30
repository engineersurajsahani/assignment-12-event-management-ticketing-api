const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    const jsonString = raw.startsWith('{')
      ? raw
      : Buffer.from(raw, 'base64').toString('utf8');
    serviceAccount = JSON.parse(jsonString);
  } catch (err) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env variable:', err.message);
  }
}

if (!serviceAccount) {
  const localKeyPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  if (fs.existsSync(localKeyPath)) {
    serviceAccount = require(localKeyPath);
  }
}

if (!serviceAccount) {
  throw new Error(
    'Firebase service account key not found! Please set FIREBASE_SERVICE_ACCOUNT env variable or upload serviceAccountKey.json as a Secret File on Render.'
  );
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = {
  admin,
  db
};