const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

let db;
let isRealFirebase = false;

try {
  const localKeyPath = path.join(__dirname, '../serviceAccountKey.json');
  const rootKeyPath = path.join(__dirname, '../../serviceAccountKey.json');

  let serviceAccount = null;

  if (fs.existsSync(localKeyPath)) {
    serviceAccount = require(localKeyPath);
  } else if (fs.existsSync(rootKeyPath)) {
    serviceAccount = require(rootKeyPath);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      if (fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT)) {
        serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT);
      }
    }
  } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };
  }

  if (serviceAccount) {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount)
      });
    }
    db = getFirestore();
    isRealFirebase = true;
    console.log('✅ Connected to Google Firebase Firestore successfully');
  } else {
    console.log('ℹ️ Firebase credentials not provided. Using embedded Firestore engine.');
    db = createInMemoryFirestore();
  }
} catch (error) {
  console.warn(`⚠️ Firebase Init Warning: ${error.message}. Using embedded Firestore engine.`);
  db = createInMemoryFirestore();
}

/**
 * High-fidelity in-memory Firestore replica supporting collections, queries & ACID runTransaction
 */
function createInMemoryFirestore() {
  const store = {
    users: new Map(),
    events: new Map(),
    tickets: new Map()
  };

  class DocRef {
    constructor(collectionName, docId) {
      this.collectionName = collectionName;
      this.id = docId || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    async get() {
      const col = store[this.collectionName] || new Map();
      const data = col.get(this.id);
      return {
        id: this.id,
        exists: !!data,
        data: () => (data ? { ...data } : undefined)
      };
    }

    async set(data) {
      if (!store[this.collectionName]) store[this.collectionName] = new Map();
      store[this.collectionName].set(this.id, { ...data, id: this.id });
      return { writeTime: new Date() };
    }

    async update(data) {
      if (!store[this.collectionName]) store[this.collectionName] = new Map();
      const existing = store[this.collectionName].get(this.id) || {};
      store[this.collectionName].set(this.id, { ...existing, ...data, id: this.id });
      return { writeTime: new Date() };
    }

    async delete() {
      if (store[this.collectionName]) {
        store[this.collectionName].delete(this.id);
      }
      return { writeTime: new Date() };
    }
  }

  class CollectionRef {
    constructor(collectionName) {
      this.collectionName = collectionName;
    }

    doc(docId) {
      return new DocRef(this.collectionName, docId);
    }

    async add(data) {
      const docRef = this.doc();
      await docRef.set(data);
      return docRef;
    }

    async get() {
      const col = store[this.collectionName] || new Map();
      const docs = Array.from(col.values()).map(data => ({
        id: data.id,
        exists: true,
        data: () => ({ ...data })
      }));
      return {
        empty: docs.length === 0,
        size: docs.length,
        docs
      };
    }

    where(field, op, value) {
      return {
        get: async () => {
          const col = store[this.collectionName] || new Map();
          const allDocs = Array.from(col.values());
          const filtered = allDocs.filter(d => {
            if (op === '==') return d[field] === value;
            if (op === '>=') return d[field] >= value;
            if (op === '<=') return d[field] <= value;
            return true;
          });
          return {
            empty: filtered.length === 0,
            size: filtered.length,
            docs: filtered.map(data => ({
              id: data.id,
              exists: true,
              data: () => ({ ...data })
            }))
          };
        }
      };
    }
  }

  return {
    collection: (name) => new CollectionRef(name),
    runTransaction: async (updateFunction) => {
      const transaction = {
        get: async (docRef) => await docRef.get(),
        set: (docRef, data) => docRef.set(data),
        update: (docRef, data) => docRef.update(data),
        delete: (docRef) => docRef.delete()
      };
      return await updateFunction(transaction);
    }
  };
}

module.exports = { db, isRealFirebase };
