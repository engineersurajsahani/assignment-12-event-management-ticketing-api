const { db } = require('../config/firebaseConfig');

// GET /api/events (Public — filter by category/city)
const getEvents = async (req, res) => {
  try {
    const { category } = req.query;
    let query = db.collection('events');

    if (category) query = query.where('category', '==', category);

    const snapshot = await query.get();
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/events/:id (Public)
const getEventById = async (req, res) => {
  try {
    const doc = await db.collection('events').doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/events (Organizer only)
const createEvent = async (req, res) => {
  try {
    const { title, description, category, eventDate, venue, ticketPrice, totalCapacity } = req.body;

    const eventRef = await db.collection('events').add({
      title,
      description,
      category,
      eventDate,
      venue,
      organizerId: req.user.id,
      ticketPrice: parseFloat(ticketPrice),
      totalCapacity: parseInt(totalCapacity, 10),
      availableTickets: parseInt(totalCapacity, 10),
      createdAt: new Date().toISOString()
    });

    const created = await eventRef.get();
    res.status(201).json({ id: eventRef.id, ...created.data() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/events/:id (Organizer, must own event)
const updateEvent = async (req, res) => {
  try {
    const eventRef = db.collection('events').doc(req.params.id);
    const doc = await eventRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (doc.data().organizerId !== req.user.id) {
      return res.status(403).json({ message: 'You do not own this event' });
    }

    await eventRef.update(req.body);
    const updated = await eventRef.get();

    res.json({ id: updated.id, ...updated.data() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/events/:id (Organizer, must own event)
const deleteEvent = async (req, res) => {
  try {
    const eventRef = db.collection('events').doc(req.params.id);
    const doc = await eventRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (doc.data().organizerId !== req.user.id) {
      return res.status(403).json({ message: 'You do not own this event' });
    }

    await eventRef.delete();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/events/:id/attendees (Organizer, must own event)
const getEventAttendees = async (req, res) => {
  try {
    const eventDoc = await db.collection('events').doc(req.params.id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (eventDoc.data().organizerId !== req.user.id) {
      return res.status(403).json({ message: 'You do not own this event' });
    }

    const ticketsSnapshot = await db.collection('tickets')
      .where('eventId', '==', req.params.id)
      .where('status', '==', 'confirmed')
      .get();

    const attendees = ticketsSnapshot.docs.map(doc => doc.data());
    res.json(attendees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getEvents, getEventById, createEvent, updateEvent, deleteEvent, getEventAttendees };