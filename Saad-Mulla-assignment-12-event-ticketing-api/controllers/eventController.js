const { db } = require('../config/firebaseConfig');

const getAllEvents = async (req, res) => {
  try {
    const { category, city } = req.query;
    let query = db.collection('events');

    if (category) {
      query = query.where('category', '==', category);
    }

    const snapshot = await query.get();
    let events = snapshot.docs.map(doc => doc.data());

    if (city) {
      events = events.filter(e => e.venue && e.venue.toLowerCase().includes(city.toLowerCase()));
    }

    return res.status(200).json({ success: true, count: events.length, data: events });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getEventById = async (req, res) => {
  try {
    const doc = await db.collection('events').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    return res.status(200).json({ success: true, data: doc.data() });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createEvent = async (req, res) => {
  try {
    const { title, description, category, eventDate, venue, ticketPrice, totalCapacity } = req.body;

    if (!title || !category || !eventDate || !venue || ticketPrice === undefined || totalCapacity === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required event parameters.' });
    }

    const eventRef = db.collection('events').doc();
    const capacity = parseInt(totalCapacity, 10);
    const price = parseFloat(ticketPrice);

    const newEvent = {
      id: eventRef.id,
      title,
      description: description || '',
      category,
      eventDate,
      venue,
      organizerId: req.user.id,
      ticketPrice: price,
      totalCapacity: capacity,
      availableTickets: capacity,
      createdAt: new Date().toISOString()
    };

    await eventRef.set(newEvent);
    return res.status(201).json({ success: true, message: 'Event created successfully', data: newEvent });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const eventRef = db.collection('events').doc(req.params.id);
    const doc = await eventRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const eventData = doc.data();
    if (eventData.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this event.' });
    }

    const updates = { ...req.body };
    delete updates.id;
    delete updates.organizerId;
    delete updates.availableTickets;

    await eventRef.update(updates);
    const updatedDoc = await eventRef.get();

    return res.status(200).json({ success: true, message: 'Event updated successfully', data: updatedDoc.data() });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const eventRef = db.collection('events').doc(req.params.id);
    const doc = await eventRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (doc.data().organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this event.' });
    }

    await eventRef.delete();
    return res.status(200).json({ success: true, message: 'Event deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent };