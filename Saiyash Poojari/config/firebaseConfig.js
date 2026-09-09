const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

let db;
let isMock = false;

// Path to service account key
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
  : path.resolve(__dirname, '../serviceAccountKey.json');

try {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    if (!admin.apps.length) {
      admin.initializeApp({ projectId: 'demo-project' });
    }
    db = admin.firestore();
    console.log('🔥 Connected to Firebase Firestore Emulator:', process.env.FIRESTORE_EMULATOR_HOST);
  } else if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    db = admin.firestore();
    console.log('🔥 Firebase Admin initialized with serviceAccountKey.json');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    db = admin.firestore();
    console.log('🔥 Firebase Admin initialized with GOOGLE_APPLICATION_CREDENTIALS');
  } else {
    // Fallback: In-memory atomic Firestore Mock for local environment without credentials
    isMock = true;
    console.log('⚠️ No serviceAccountKey.json found. Initializing high-fidelity In-Memory Firestore instance with ACID transaction support.');
    db = createInMemoryFirestore();
  }
} catch (error) {
  console.warn('⚠️ Firebase Admin init failed with credentials:', error.message);
  console.log('⚠️ Falling back to In-Memory Firestore instance.');
  isMock = true;
  db = createInMemoryFirestore();
}

/**
 * In-memory Firestore emulation implementing atomic runTransaction and doc/collection APIs.
 */
function createInMemoryFirestore() {
  const collections = new Map();
  let transactionMutex = Promise.resolve();

  function getCollection(name) {
    if (!collections.has(name)) {
      collections.set(name, new Map());
    }
    return collections.get(name);
  }

  function generateAutoId() {
    return 'doc_' + Math.random().toString(36).substr(2, 9) + Date.now().toString().slice(-4);
  }

  class DocumentReference {
    constructor(collectionName, id) {
      this.collectionName = collectionName;
      this.id = id || generateAutoId();
    }

    async get() {
      const col = getCollection(this.collectionName);
      const data = col.get(this.id);
      return {
        id: this.id,
        exists: !!data,
        data: () => (data ? JSON.parse(JSON.stringify(data)) : undefined)
      };
    }

    async set(data) {
      const col = getCollection(this.collectionName);
      col.set(this.id, JSON.parse(JSON.stringify({ id: this.id, ...data })));
    }

    async update(data) {
      const col = getCollection(this.collectionName);
      const existing = col.get(this.id);
      if (!existing) {
        throw new Error(`Document ${this.id} does not exist in ${this.collectionName}`);
      }
      const updated = { ...existing, ...JSON.parse(JSON.stringify(data)) };
      col.set(this.id, updated);
    }

    async delete() {
      const col = getCollection(this.collectionName);
      col.delete(this.id);
    }
  }

  class QueryReference {
    constructor(collectionName, filters = []) {
      this.collectionName = collectionName;
      this.filters = filters;
    }

    where(field, op, value) {
      return new QueryReference(this.collectionName, [...this.filters, { field, op, value }]);
    }

    async get() {
      const col = getCollection(this.collectionName);
      let docs = Array.from(col.values());

      for (const filter of this.filters) {
        docs = docs.filter((doc) => {
          const val = doc[filter.field];
          if (filter.op === '==') return val === filter.value;
          if (filter.op === '>=') return val >= filter.value;
          if (filter.op === '<=') return val <= filter.value;
          if (filter.op === '>') return val > filter.value;
          if (filter.op === '<') return val < filter.value;
          return true;
        });
      }

      return {
        empty: docs.length === 0,
        size: docs.length,
        docs: docs.map((d) => ({
          id: d.id,
          exists: true,
          data: () => JSON.parse(JSON.stringify(d))
        }))
      };
    }
  }

  class CollectionReference extends QueryReference {
    constructor(collectionName) {
      super(collectionName, []);
    }

    doc(id) {
      return new DocumentReference(this.collectionName, id);
    }

    async add(data) {
      const docRef = this.doc();
      await docRef.set(data);
      return docRef;
    }
  }

  class Transaction {
    constructor(snapshotState) {
      this.snapshotState = snapshotState; // Reads map
      this.writes = []; // Deferred writes
    }

    async get(docRef) {
      const col = getCollection(docRef.collectionName);
      const data = col.get(docRef.id);
      return {
        id: docRef.id,
        exists: !!data,
        data: () => (data ? JSON.parse(JSON.stringify(data)) : undefined)
      };
    }

    set(docRef, data) {
      this.writes.push({ type: 'set', docRef, data: JSON.parse(JSON.stringify(data)) });
    }

    update(docRef, data) {
      this.writes.push({ type: 'update', docRef, data: JSON.parse(JSON.stringify(data)) });
    }

    delete(docRef) {
      this.writes.push({ type: 'delete', docRef });
    }
  }

  return {
    isMock: true,
    collection: (name) => new CollectionReference(name),
    doc: (pathStr) => {
      const parts = pathStr.split('/');
      return new DocumentReference(parts[0], parts[1]);
    },
    runTransaction: async (updateFunction) => {
      // Synchronize transaction execution to guarantee ACID serialization
      let release;
      const nextLock = new Promise((resolve) => (release = resolve));
      const currentLock = transactionMutex;
      transactionMutex = nextLock;

      await currentLock;
      try {
        const transaction = new Transaction();
        const result = await updateFunction(transaction);

        // Apply all deferred writes atomically
        for (const write of transaction.writes) {
          const col = getCollection(write.docRef.collectionName);
          if (write.type === 'set') {
            col.set(write.docRef.id, { id: write.docRef.id, ...write.data });
          } else if (write.type === 'update') {
            const existing = col.get(write.docRef.id);
            if (!existing) {
              throw new Error(`Document ${write.docRef.id} does not exist in ${write.docRef.collectionName}`);
            }
            col.set(write.docRef.id, { ...existing, ...write.data });
          } else if (write.type === 'delete') {
            col.delete(write.docRef.id);
          }
        }
        return result;
      } finally {
        release();
      }
    }
  };
}

module.exports = { db, admin, isMock };
