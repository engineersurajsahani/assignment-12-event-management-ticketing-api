const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/firebaseConfig');

const getEvents = async (req, res, next) => {
  try {
    const { category, city } = req.query;
    const snapshot = await db.collection('events').get();
    let events = snapshot.docs.map((doc) => doc.data());

    if (category) {
      events = events.filter((e) => e.category.toLowerCase() === category.toLowerCase());
    }

    if (city) {
      events = events.filter(
        (e) => e.venue && e.venue.toLowerCase().includes(city.toLowerCase())
      );
    }

    return res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (err) {
    next(err);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('events').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    return res.status(200).json({
      success: true,
      data: doc.data()
    });
  } catch (err) {
    next(err);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const { title, description, category, eventDate, venue, ticketPrice, totalCapacity } = req.body;

    if (!title || !category || !eventDate || !venue || ticketPrice === undefined || totalCapacity === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required event fields' });
    }

    const price = Number(ticketPrice);
    const capacity = Number(totalCapacity);

    if (isNaN(price) || price < 0 || isNaN(capacity) || capacity <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid ticket price or capacity' });
    }

    const eventId = `event_${uuidv4().slice(0, 8)}`;
    const eventRef = db.collection('events').doc(eventId);

    const newEvent = {
      id: eventId,
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category.trim(),
      eventDate,
      venue: venue.trim(),
      organizerId: req.user.id,
      ticketPrice: price,
      totalCapacity: capacity,
      availableTickets: capacity,
      createdAt: new Date().toISOString()
    };

    await eventRef.set(newEvent);

    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: newEvent
    });
  } catch (err) {
    next(err);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eventRef = db.collection('events').doc(id);
    const doc = await eventRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const eventData = doc.data();
    if (eventData.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only edit your own events' });
    }

    const { title, description, category, eventDate, venue, ticketPrice } = req.body;
    const updates = {};

    if (title) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (category) updates.category = category.trim();
    if (eventDate) updates.eventDate = eventDate;
    if (venue) updates.venue = venue.trim();
    if (ticketPrice !== undefined) updates.ticketPrice = Number(ticketPrice);

    const updated = await eventRef.update(updates);

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eventRef = db.collection('events').doc(id);
    const doc = await eventRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const eventData = doc.data();
    if (eventData.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only delete your own events' });
    }

    await eventRef.delete();

    return res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

const getEventAttendees = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eventRef = db.collection('events').doc(id);
    const doc = await eventRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const ticketsSnapshot = await db.collection('tickets').where('eventId', '==', id).get();
    const tickets = ticketsSnapshot.docs.map((d) => d.data());

    return res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventAttendees
};
