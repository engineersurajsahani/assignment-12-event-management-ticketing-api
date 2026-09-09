const { db } = require('../config/firebaseConfig');

/**
 * @desc Browse all upcoming events (supports ?category=Technology&city=Mumbai)
 * @route GET /api/events
 */
exports.getAllEvents = async (req, res) => {
  try {
    const { category, city, venue } = req.query;
    let eventsRef = db.collection('events');

    let snapshot = await eventsRef.get();
    let events = snapshot.docs ? snapshot.docs.map((doc) => doc.data()) : [];

    // Filter by category if provided
    if (category) {
      events = events.filter(
        (e) => e.category && e.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by city / venue keyword if provided
    const locationQuery = city || venue;
    if (locationQuery) {
      events = events.filter(
        (e) => e.venue && e.venue.toLowerCase().includes(locationQuery.toLowerCase())
      );
    }

    return res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Get all events error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving events.',
      error: error.message
    });
  }
};

/**
 * @desc View event details & live remaining ticket count
 * @route GET /api/events/:id
 */
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const eventDoc = await db.collection('events').doc(id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: `Event with ID '${id}' not found.`
      });
    }

    const eventData = eventDoc.data();

    return res.status(200).json({
      success: true,
      data: eventData
    });
  } catch (error) {
    console.error('Get event by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving event details.',
      error: error.message
    });
  }
};

/**
 * @desc Create new event listing (Organizer only)
 * @route POST /api/events
 */
exports.createEvent = async (req, res) => {
  try {
    const { title, description, category, eventDate, venue, ticketPrice, totalCapacity } = req.body;

    if (!title || !category || !eventDate || !venue || ticketPrice === undefined || !totalCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, category, eventDate, venue, ticketPrice, and totalCapacity.'
      });
    }

    const capacity = parseInt(totalCapacity, 10);
    const price = parseFloat(ticketPrice);

    if (isNaN(capacity) || capacity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'totalCapacity must be a positive integer.'
      });
    }

    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        message: 'ticketPrice must be a non-negative number.'
      });
    }

    const eventRef = db.collection('events').doc();
    const eventId = eventRef.id || `event_${Date.now()}`;

    const newEvent = {
      id: eventId,
      title,
      description: description || '',
      category,
      eventDate: new Date(eventDate).toISOString(),
      venue,
      organizerId: req.user.id,
      ticketPrice: price,
      totalCapacity: capacity,
      availableTickets: capacity,
      createdAt: new Date().toISOString()
    };

    await eventRef.set(newEvent);

    return res.status(201).json({
      success: true,
      message: 'Event created successfully.',
      data: newEvent
    });
  } catch (error) {
    console.error('Create event error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating event.',
      error: error.message
    });
  }
};

/**
 * @desc Update event details (Organizer must own event)
 * @route PUT /api/events/:id
 */
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const eventRef = db.collection('events').doc(id);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: `Event with ID '${id}' not found.`
      });
    }

    const eventData = eventDoc.data();

    // Verify Organizer ownership
    if (eventData.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only update events that you organized.'
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
      const capacityDiff = newCapacity - eventData.totalCapacity;
      updates.totalCapacity = newCapacity;
      updates.availableTickets = Math.max(0, eventData.availableTickets + capacityDiff);
    }

    await eventRef.update(updates);

    const updatedDoc = await eventRef.get();

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      data: updatedDoc.data()
    });
  } catch (error) {
    console.error('Update event error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating event.',
      error: error.message
    });
  }
};

/**
 * @desc Cancel and delete event (Organizer must own event)
 * @route DELETE /api/events/:id
 */
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const eventRef = db.collection('events').doc(id);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: `Event with ID '${id}' not found.`
      });
    }

    const eventData = eventDoc.data();

    if (eventData.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only delete events that you organized.'
      });
    }

    await eventRef.delete();

    return res.status(200).json({
      success: true,
      message: `Event '${eventData.title}' (ID: ${id}) deleted successfully.`
    });
  } catch (error) {
    console.error('Delete event error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting event.',
      error: error.message
    });
  }
};

/**
 * @desc List all registered attendees for an event (Organizer must own event)
 * @route GET /api/events/:id/attendees
 */
exports.getEventAttendees = async (req, res) => {
  try {
    const { id } = req.params;
    const eventDoc = await db.collection('events').doc(id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: `Event with ID '${id}' not found.`
      });
    }

    const eventData = eventDoc.data();

    if (eventData.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only view attendee rosters for events you organized.'
      });
    }

    const ticketsSnapshot = await db.collection('tickets').where('eventId', '==', id).get();
    const tickets = ticketsSnapshot.docs ? ticketsSnapshot.docs.map((doc) => doc.data()) : [];

    return res.status(200).json({
      success: true,
      eventId: id,
      eventTitle: eventData.title,
      totalAttendees: tickets.reduce((sum, t) => sum + (t.status === 'confirmed' ? t.quantity : 0), 0),
      data: tickets
    });
  } catch (error) {
    console.error('Get event attendees error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving event attendees.',
      error: error.message
    });
  }
};
