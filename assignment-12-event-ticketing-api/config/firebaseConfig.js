const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config();

const path = require('path');
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, '..', 'serviceAccountKey.json');
const serviceAccountKey = require(serviceAccountPath);

initializeApp({
  credential: cert(serviceAccountKey)
});

const db = getFirestore();

module.exports = { db };