const admin = require("firebase-admin");

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  console.log("Firebase key source: ENV | email:", serviceAccount.client_email);
} else {
  try {
    serviceAccount = require("../serviceAccountKey.json");
    console.log("Firebase key source: FILE | email:", serviceAccount.client_email);
  } catch (e) {
    throw new Error(
      "No Firebase credentials: set FIREBASE_SERVICE_ACCOUNT env var or add serviceAccountKey.json"
    );
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

module.exports = { admin, db };
