const { db } = require('../config/firebaseConfig');

function validateEventPayload(body, isUpdate = false) {
  const required = ['title', 'description', 'category', 'eventDate', 'venue', 'city', 'ticketPrice', 'totalCapacity'];

  if (!isUpdate) {
    const missing = required.filter((field) => body[field] === undefined || body[field] === '');
    if (missing.length) return `Missing fields: ${missing.join(', ')}`;
  }

  if (body.eventDate !== undefined && Number.isNaN(Date.parse(body.eventDate))) {
    return 'eventDate must be a valid ISO date.';
  }
  if (body.ticketPrice !== undefined && (!Number.isFinite(Number(body.ticketPrice)) || Number(body.ticketPrice) < 0)) {
    return 'ticketPrice must be a non-negative number.';
  }
  if (body.totalCapacity !== undefined && (!Number.isInteger(Number(body.totalCapacity)) || Number(body.totalCapacity) < 1)) {
    return 'totalCapacity must be a positive integer.';
  }

  return null;
}

exports.getEvents = async (req, res, next) => {
  try {
    const now = new Date().toISOString();
    let query = db.collection('events').where('eventDate', '>=', now);

    if (req.query.category) {
      query = query.where('category', '==', req.query.category);
    }
    if (req.query.city) {
      query = query.where('city', '==', req.query.city);
    }

    const snapshot = await query.orderBy('eventDate', 'asc').get();

    res.json({
      success: true,
      count: snapshot.size,
      data: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    });
  } catch (error) {
    next(error);
  }
};

exports.getEvent = async (req, res, next) => {
  try {
    const doc = await db.collection('events').doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    next(error);
  }
};

exports.createEvent = async (req, res, next) => {
  try {
    const validationError = validateEventPayload(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const eventDate = new Date(req.body.eventDate);
    if (eventDate <= new Date()) {
      return res.status(400).json({ success: false, message: 'eventDate must be in the future.' });
    }

    const ref = db.collection('events').doc();
    const capacity = Number(req.body.totalCapacity);

    const event = {
      id: ref.id,
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      category: req.body.category.trim(),
      eventDate: eventDate.toISOString(),
      venue: req.body.venue.trim(),
      city: req.body.city.trim(),
      organizerId: req.user.id,
      ticketPrice: Number(req.body.ticketPrice),
      totalCapacity: capacity,
      availableTickets: capacity,
      createdAt: new Date().toISOString()
    };

    await ref.set(event);
    res.status(201).json({ success: true, message: 'Event created successfully.', data: event });
  } catch (error) {
    next(error);
  }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const validationError = validateEventPayload(req.body, true);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const ref = db.collection('events').doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists) return res.status(404).json({ success: false, message: 'Event not found.' });

    const event = doc.data();
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only update your own events.' });
    }

    if (req.body.eventDate !== undefined && new Date(req.body.eventDate) <= new Date()) {
      return res.status(400).json({ success: false, message: 'eventDate must be in the future.' });
    }

    const updates = {};
    ['title', 'description', 'category', 'venue', 'city'].forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = String(req.body[field]).trim();
    });
    if (req.body.eventDate !== undefined) updates.eventDate = new Date(req.body.eventDate).toISOString();
    if (req.body.ticketPrice !== undefined) updates.ticketPrice = Number(req.body.ticketPrice);

    if (req.body.totalCapacity !== undefined) {
      const newCapacity = Number(req.body.totalCapacity);
      const sold = event.totalCapacity - event.availableTickets;
      if (newCapacity < sold) {
        return res.status(400).json({ success: false, message: `Capacity cannot be below tickets already sold (${sold}).` });
      }
      updates.totalCapacity = newCapacity;
      updates.availableTickets = newCapacity - sold;
    }

    await ref.update(updates);
    const updated = await ref.get();

    res.json({ success: true, message: 'Event updated successfully.', data: { id: updated.id, ...updated.data() } });
  } catch (error) {
    next(error);
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    const ref = db.collection('events').doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists) return res.status(404).json({ success: false, message: 'Event not found.' });

    if (doc.data().organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only delete your own events.' });
    }

    await ref.delete();
    res.json({ success: true, message: 'Event cancelled and deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

exports.getAttendees = async (req, res, next) => {
  try {
    const eventDoc = await db.collection('events').doc(req.params.id).get();

    if (!eventDoc.exists) return res.status(404).json({ success: false, message: 'Event not found.' });
    if (eventDoc.data().organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only view attendees of your own event.' });
    }

    const snapshot = await db.collection('tickets')
      .where('eventId', '==', req.params.id)
      .where('status', '==', 'confirmed')
      .get();

    res.json({
      success: true,
      count: snapshot.size,
      data: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    });
  } catch (error) {
    next(error);
  }
};