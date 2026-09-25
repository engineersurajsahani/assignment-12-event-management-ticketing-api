const { db } = require('../config/firebaseConfig');

const EVENTS_COLLECTION = 'events';

exports.getEvents = async (req, res) => {
  try {
    const { category, city } = req.query;
    let query = db.collection(EVENTS_COLLECTION);

    if (category) {
      query = query.where('category', '==', category);
    }
    if (city) {
      query = query.where('city', '==', city);
    }

    const nowIso = new Date().toISOString();
    const snapshot = await query.get();

    const events = snapshot.docs
      .map((doc) => doc.data())
      .filter((event) => event.eventDate >= nowIso)
      .sort((a, b) => (a.eventDate > b.eventDate ? 1 : -1));

    return res.status(200).json({ success: true, count: events.length, data: events });
  } catch (error) {
    console.error('getEvents error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch events.' });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const doc = await db.collection(EVENTS_COLLECTION).doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    return res.status(200).json({ success: true, data: doc.data() });
  } catch (error) {
    console.error('getEventById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch event.' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, description, category, city, eventDate, venue, ticketPrice, totalCapacity } = req.body;

    if (!title || !eventDate || !venue || ticketPrice === undefined || totalCapacity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'title, eventDate, venue, ticketPrice and totalCapacity are required.'
      });
    }

    if (Number(totalCapacity) <= 0 || Number(ticketPrice) < 0) {
      return res.status(400).json({
        success: false,
        message: 'totalCapacity must be greater than 0 and ticketPrice cannot be negative.'
      });
    }

    const eventsRef = db.collection(EVENTS_COLLECTION);
    const newEventRef = eventsRef.doc();

    const eventDoc = {
      id: newEventRef.id,
      title,
      description: description || '',
      category: category || 'General',
      city: city || '',
      eventDate,
      venue,
      organizerId: req.user.id,
      ticketPrice: Number(ticketPrice),
      totalCapacity: Number(totalCapacity),
      availableTickets: Number(totalCapacity),
      createdAt: new Date().toISOString()
    };

    await newEventRef.set(eventDoc);

    return res.status(201).json({ success: true, message: 'Event created successfully.', data: eventDoc });
  } catch (error) {
    console.error('createEvent error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create event.' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const eventRef = db.collection(EVENTS_COLLECTION).doc(req.params.id);
    const doc = await eventRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = doc.data();
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You do not own this event.' });
    }

    const allowedFields = ['title', 'description', 'category', 'city', 'eventDate', 'venue', 'ticketPrice'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = field === 'ticketPrice' ? Number(req.body[field]) : req.body[field];
      }
    });


    if (req.body.totalCapacity !== undefined) {
      const newCapacity = Number(req.body.totalCapacity);
      const soldTickets = event.totalCapacity - event.availableTickets;

      if (newCapacity < soldTickets) {
        return res.status(400).json({
          success: false,
          message: `totalCapacity cannot be less than tickets already sold (${soldTickets}).`
        });
      }

      updates.totalCapacity = newCapacity;
      updates.availableTickets = newCapacity - soldTickets;
    }

    updates.updatedAt = new Date().toISOString();

    await eventRef.update(updates);
    const updatedDoc = await eventRef.get();

    return res.status(200).json({ success: true, message: 'Event updated successfully.', data: updatedDoc.data() });
  } catch (error) {
    console.error('updateEvent error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update event.' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const eventRef = db.collection(EVENTS_COLLECTION).doc(req.params.id);
    const doc = await eventRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (doc.data().organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You do not own this event.' });
    }

    await eventRef.delete();

    return res.status(200).json({ success: true, message: 'Event cancelled and deleted successfully.' });
  } catch (error) {
    console.error('deleteEvent error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete event.' });
  }
};

exports.getEventAttendees = async (req, res) => {
  try {
    const eventRef = db.collection(EVENTS_COLLECTION).doc(req.params.id);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (eventDoc.data().organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You do not own this event.' });
    }

    const ticketsSnapshot = await db
      .collection('tickets')
      .where('eventId', '==', req.params.id)
      .where('status', '==', 'confirmed')
      .get();

    const attendees = ticketsSnapshot.docs.map((d) => d.data());

    return res.status(200).json({ success: true, count: attendees.length, data: attendees });
  } catch (error) {
    console.error('getEventAttendees error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch attendees.' });
  }
};
