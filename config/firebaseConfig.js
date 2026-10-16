const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

/**
 * Initializes the Firebase Admin SDK using a service account key.
 * The path is read from GOOGLE_APPLICATION_CREDENTIALS in .env
 * (defaults to ./serviceAccountKey.json in the project root).
 */
function initializeFirebase() {
  if (admin.apps.length) {
    return admin;
  }

  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      try {
        serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8'));
      } catch (err) {
        console.error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:', err.message);
      }
    }
  }

  if (!serviceAccount) {
    const keyPath = path.resolve(
      process.cwd(),
      process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json'
    );
    try {
      serviceAccount = require(keyPath);
    } catch (err) {
      console.warn(
        '\n[Firebase] Notice: serviceAccountKey.json not found and FIREBASE_SERVICE_ACCOUNT not configured.',
        '\nConfigure FIREBASE_SERVICE_ACCOUNT in your Vercel Environment Variables to enable Firestore operations.\n'
      );
      return admin;
    }
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log('[Firebase] Admin SDK initialized');
  return admin;
}

const firebaseAdmin = initializeFirebase();
let realDb = null;
function getFirestoreDb() {
  if (!realDb && admin.apps.length) {
    realDb = admin.firestore();
  }
  return realDb;
}

function createSafeProxy(targetGetter) {
  return new Proxy(function() {}, {
    get(target, prop) {
      const real = targetGetter();
      if (real) {
        const val = real[prop];
        return typeof val === 'function' ? val.bind(real) : val;
      }
      return (...args) => {
        const r = targetGetter();
        if (r && typeof r[prop] === 'function') {
          return r[prop](...args);
        }
        return createSafeProxy(() => {
          const live = targetGetter();
          if (!live) {
            throw new Error('Firebase credentials not configured. Please set FIREBASE_SERVICE_ACCOUNT in your environment variables.');
          }
          return typeof live[prop] === 'function' ? live[prop](...args) : live[prop];
        });
      };
    },
    apply(target, thisArg, argArray) {
      const real = targetGetter();
      if (real && typeof real === 'function') {
        return real.apply(thisArg, argArray);
      }
      return createSafeProxy(() => {
        const r = targetGetter();
        if (!r) {
          throw new Error('Firebase credentials not configured. Please set FIREBASE_SERVICE_ACCOUNT in your environment variables.');
        }
        return typeof r === 'function' ? r.apply(thisArg, argArray) : r;
      });
    }
  });
}

const safeDb = new Proxy({}, {
  get(target, prop) {
    const dbInstance = getFirestoreDb();
    if (dbInstance) {
      const val = dbInstance[prop];
      return typeof val === 'function' ? val.bind(dbInstance) : val;
    }
    return (...args) => {
      const currentDb = getFirestoreDb();
      if (currentDb && typeof currentDb[prop] === 'function') {
        return currentDb[prop](...args);
      }
      return createSafeProxy(() => {
        const d = getFirestoreDb();
        if (!d) {
          throw new Error('Firebase credentials not configured. Please set FIREBASE_SERVICE_ACCOUNT in your environment variables.');
        }
        return typeof d[prop] === 'function' ? d[prop](...args) : d[prop];
      });
    };
  }
});

module.exports = {
  admin: firebaseAdmin,
  db: safeDb
};
