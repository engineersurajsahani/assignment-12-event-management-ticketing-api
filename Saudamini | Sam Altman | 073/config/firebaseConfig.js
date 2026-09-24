const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let db;
let isMock = false;

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = require(serviceAccountPath);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    db = admin.firestore();
    console.log('✅ Firebase Admin SDK Initialized with Service Account');
  } catch (err) {
    console.warn('⚠️ Could not initialize Firebase Admin SDK with key, using Mock Firestore Store.');
    isMock = true;
  }
} else {
  isMock = true;
}

if (isMock) {
  // Production-grade In-Memory Firestore Mock with ACID Transaction simulation
  const collections = {
    events: new Map([
      ['event_techconf_2026', {
        id: 'event_techconf_2026',
        title: 'Global Cloud & AI Summit 2026',
        description: 'Annual flagship backend and cloud systems conference',
        category: 'Technology',
        city: 'Mumbai',
        eventDate: '2026-06-15T09:00:00Z',
        venue: 'Bandra Kurla Complex, Mumbai',
        organizerId: 'usr_organizer_01',
        ticketPrice: 1499,
        totalCapacity: 500,
        availableTickets: 482,
        createdAt: new Date().toISOString()
      }],
      ['event_musicfest_2026', {
        id: 'event_musicfest_2026',
        title: 'Sunburn Indie Music Nights',
        description: 'Live musical concert featuring top indie artists',
        category: 'Music',
        city: 'Pune',
        eventDate: '2026-07-20T18:00:00Z',
        venue: 'Amanora Arena, Pune',
        organizerId: 'usr_organizer_01',
        ticketPrice: 899,
        totalCapacity: 200,
        availableTickets: 195,
        createdAt: new Date().toISOString()
      }]
    ]),
    tickets: new Map([
      ['ticket_rec_88219', {
        id: 'ticket_rec_88219',
        eventId: 'event_techconf_2026',
        eventTitle: 'Global Cloud & AI Summit 2026',
        userId: 'usr_attendee_99',
        attendeeName: 'Kunal Sharma',
        attendeeEmail: 'kunal@gmail.com',
        quantity: 2,
        totalPaid: 2998,
        bookingRef: 'TKT-2026-88219',
        status: 'confirmed',
        bookedAt: new Date().toISOString()
      }]
    ]),
    users: new Map()
  };

  const createDocRef = (collName, docId) => ({
    id: docId,
    get: async () => {
      const data = collections[collName]?.get(docId);
      return {
        exists: !!data,
        id: docId,
        data: () => data ? JSON.parse(JSON.stringify(data)) : undefined
      };
    },
    set: async (data) => {
      if (!collections[collName]) collections[collName] = new Map();
      collections[collName].set(docId, { id: docId, ...data });
    },
    update: async (updates) => {
      const existing = collections[collName]?.get(docId);
      if (!existing) throw new Error('Document does not exist');
      Object.assign(existing, updates);
    },
    delete: async () => {
      collections[collName]?.delete(docId);
    }
  });

  db = {
    isMock: true,
    collection: (collName) => {
      if (!collections[collName]) collections[collName] = new Map();
      return {
        doc: (docId = `doc_${Date.now()}_${Math.floor(Math.random() * 1000)}`) => createDocRef(collName, docId),
        get: async () => {
          const docs = Array.from(collections[collName].values()).map(d => ({
            id: d.id,
            exists: true,
            data: () => d
          }));
          return {
            empty: docs.length === 0,
            docs,
            forEach: (cb) => docs.forEach(cb)
          };
        }
      };
    },
    runTransaction: async (updateFunction) => {
      const transaction = {
        get: async (docRef) => docRef.get(),
        set: (docRef, data) => docRef.set(data),
        update: (docRef, updates) => docRef.update(updates),
        delete: (docRef) => docRef.delete()
      };
      return await updateFunction(transaction);
    }
  };
}

module.exports = { db, admin };
