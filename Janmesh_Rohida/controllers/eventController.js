const { db } = require('../config/firebaseConfig');

// GET /api/events (Public - Browse events with optional category & city filters)
exports.listEvents = async (req, res, next) => {
  try {
    const { category, city } = req.query;
    let query = db.collection('events');

    if (category) {
      query = query.where('category', '==', category);
    }

    const snapshot = await query.get();
    let events = [];

    snapshot.forEach(doc => {
      events.push({ id: doc.id, ...doc.data() });
    });

    // Optional city filter on venue string (case-insensitive)
    if (city) {
      const cityLower = city.toLowerCase();
      events = events.filter(e => e.venue && e.venue.toLowerCase().includes(cityLower));
    }

    return res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/events/:id (Public - Event details & live remaining ticket count)
exports.getEventById = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const eventDoc = await db.collection('events').doc(eventId).get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: { id: eventDoc.id, ...eventDoc.data() }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/events (Organizer only - Create Event)
exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, category, eventDate, venue, ticketPrice, totalCapacity } = req.body;
    const organizerId = req.user.id;

    if (!title || !description || !category || !eventDate || !venue || ticketPrice === undefined || !totalCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required event details: title, description, category, eventDate, venue, ticketPrice, totalCapacity'
      });
    }

    const capacityNum = parseInt(totalCapacity, 10);
    const priceNum = parseFloat(ticketPrice);

    if (isNaN(capacityNum) || capacityNum <= 0) {
      return res.status(400).json({ success: false, message: 'totalCapacity must be a positive integer' });
    }

    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ success: false, message: 'ticketPrice must be a non-negative number' });
    }

    const eventRef = db.collection('events').doc();
    const newEvent = {
      id: eventRef.id,
      title,
      description,
      category,
      eventDate: new Date(eventDate).toISOString(),
      venue,
      organizerId,
      ticketPrice: priceNum,
      totalCapacity: capacityNum,
      availableTickets: capacityNum, // initially availableTickets = totalCapacity
      createdAt: new Date().toISOString()
    };

    await eventRef.set(newEvent);

    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: newEvent
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/events/:id (Organizer only - Update Event, must own event)
exports.updateEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const organizerId = req.user.id;
    const eventRef = db.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const existingEvent = eventDoc.data();

    // Ownership check
    if (existingEvent.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only update events that you organized'
      });
    }

    const { title, description, category, eventDate, venue, ticketPrice, totalCapacity } = req.body;
    const updates = {};

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (eventDate !== undefined) updates.eventDate = new Date(eventDate).toISOString();
    if (venue !== undefined) updates.venue = venue;
    if (ticketPrice !== undefined) updates.ticketPrice = parseFloat(ticketPrice);
    if (totalCapacity !== undefined) {
      const newCapacity = parseInt(totalCapacity, 10);
      const diff = newCapacity - existingEvent.totalCapacity;
      updates.totalCapacity = newCapacity;
      updates.availableTickets = Math.max(0, existingEvent.availableTickets + diff);
    }

    await eventRef.update(updates);
    const updatedDoc = await eventRef.get();

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: { id: updatedDoc.id, ...updatedDoc.data() }
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/events/:id (Organizer only - Delete Event, must own event)
exports.deleteEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const organizerId = req.user.id;
    const eventRef = db.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Ownership check
    if (eventDoc.data().organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only delete events that you organized'
      });
    }

    await eventRef.delete();

    return res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/events/:id/attendees (Organizer only - List registered attendees for event)
exports.listAttendees = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const organizerId = req.user.id;

    // Ownership verification
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (eventDoc.data().organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only view attendees for your own events'
      });
    }

    const ticketsSnapshot = await db.collection('tickets')
      .where('eventId', '==', eventId)
      .where('status', '==', 'confirmed')
      .get();

    const attendees = [];
    ticketsSnapshot.forEach(doc => {
      const data = doc.data();
      attendees.push({
        ticketId: doc.id,
        bookingRef: data.bookingRef,
        attendeeName: data.attendeeName,
        attendeeEmail: data.attendeeEmail,
        quantity: data.quantity,
        totalPaid: data.totalPaid,
        bookedAt: data.bookedAt,
        userId: data.userId
      });
    });

    return res.status(200).json({
      success: true,
      count: attendees.length,
      data: attendees
    });
  } catch (error) {
    next(error);
  }
};
