const { v4: uuidv4 } = require('uuid');

const store = {
  users: [],
  events: [
    {
      id: 'event_techconf_2026',
      title: 'Global Cloud & AI Summit 2026',
      description: 'Annual flagship backend conference',
      category: 'Technology',
      eventDate: '2026-06-15T09:00:00Z',
      venue: 'Bandra Kurla Complex, Mumbai',
      organizerId: 'usr_organizer_01',
      ticketPrice: 1499,
      totalCapacity: 500,
      availableTickets: 482,
      createdAt: '2026-03-01T12:00:00Z'
    }
  ],
  tickets: []
};

const createMockDocRef = (collectionName, docId) => {
  const id = docId || uuidv4();

  return {
    id,
    get: async () => {
      const item = store[collectionName]?.find((d) => d.id === id);
      return {
        id,
        exists: !!item,
        data: () => (item ? { ...item } : undefined)
      };
    },
    set: async (data) => {
      const col = store[collectionName] || (store[collectionName] = []);
      const idx = col.findIndex((d) => d.id === id);
      const record = { ...data, id };
      if (idx >= 0) {
        col[idx] = record;
      } else {
        col.push(record);
      }
      return record;
    },
    update: async (data) => {
      const col = store[collectionName] || (store[collectionName] = []);
      const idx = col.findIndex((d) => d.id === id);
      if (idx === -1) {
        throw new Error('Document not found');
      }
      col[idx] = { ...col[idx], ...data };
      return col[idx];
    },
    delete: async () => {
      const col = store[collectionName] || (store[collectionName] = []);
      const idx = col.findIndex((d) => d.id === id);
      if (idx >= 0) {
        col.splice(idx, 1);
      }
      return { success: true };
    }
  };
};

const createMockCollectionRef = (collectionName) => {
  return {
    doc: (docId) => createMockDocRef(collectionName, docId),
    get: async () => {
      const items = store[collectionName] || [];
      return {
        empty: items.length === 0,
        size: items.length,
        docs: items.map((item) => ({
          id: item.id,
          exists: true,
          data: () => ({ ...item })
        }))
      };
    },
    where: (field, op, value) => {
      const items = (store[collectionName] || []).filter((item) => {
        if (op === '==') return item[field] === value;
        if (op === '>=') return item[field] >= value;
        if (op === '<=') return item[field] <= value;
        return true;
      });
      return {
        get: async () => ({
          empty: items.length === 0,
          size: items.length,
          docs: items.map((item) => ({
            id: item.id,
            exists: true,
            data: () => ({ ...item })
          }))
        })
      };
    }
  };
};

const db = {
  collection: (name) => createMockCollectionRef(name),
  runTransaction: async (updateFunction) => {
    const transaction = {
      get: async (docRef) => docRef.get(),
      set: async (docRef, data) => docRef.set(data),
      update: async (docRef, data) => docRef.update(data),
      delete: async (docRef) => docRef.delete()
    };
    return await updateFunction(transaction);
  }
};

module.exports = { db, store };
