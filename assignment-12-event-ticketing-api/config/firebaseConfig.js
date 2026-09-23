const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config();

function loadServiceAccount() {
  // 1. Render/Railway-style secret: FIREBASE_SERVICE_ACCOUNT = full service-account JSON
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      console.log('[firebase] Loading credentials from FIREBASE_SERVICE_ACCOUNT env var');
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT is set but is not valid JSON.');
    }
  }

  // 2. Standard GCP credential path
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('[firebase] Loading credentials from GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
    return require(path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS));
  }

  // 3. Explicit path to a service account file
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    console.log('[firebase] Loading credentials from FIREBASE_SERVICE_ACCOUNT_PATH:', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    return require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH));
  }

  // 4. Default file at project root
  const defaultPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  console.log('[firebase] Loading credentials from default file:', defaultPath);
  return require(defaultPath);
}

let serviceAccountKey;
try {
  serviceAccountKey = loadServiceAccount();
} catch (error) {
  const message =
    'Firebase credentials not found. Add the FIREBASE_SERVICE_ACCOUNT env variable ' +
    '(full service-account JSON), or provide serviceAccountKey.json / GOOGLE_APPLICATION_CREDENTIALS / ' +
    'FIREBASE_SERVICE_ACCOUNT_PATH. Original error: ' + error.message;
  throw new Error(message);
}

console.log('[firebase] Service account key id in use:', serviceAccountKey.private_key_id);

initializeApp({
  credential: cert(serviceAccountKey)
});

const db = getFirestore();

module.exports = { db };