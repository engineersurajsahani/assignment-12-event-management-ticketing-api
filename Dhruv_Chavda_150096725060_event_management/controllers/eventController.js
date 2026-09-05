const { db } = require('../config/firebaseConfig');

// @desc    Get all events with category / venue / city filter
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res, next) => {
  try {
    const { category, city, search } = req.query;
    const eventsRef = db.collection('events');
    const snapshot = await eventsRef.get();

    let events = [];
    snapshot.docs.forEach(doc => {
      events.push(doc.data());
    });

    // Apply filtering
    if (category) {
      events = events.filter(e => e.category && e.category.toLowerCase() === category.toLowerCase());
    }
    if (city) {
      events = events.filter(e => e.venue && e.venue.toLowerCase().includes(city.toLowerCase()));
    }
    if (search) {
      events = events.filter(e => 
        (e.title && e.title.toLowerCase().includes(search.toLowerCase())) ||
        (e.description && e.description.toLowerCase().includes(search.toLowerCase()))
      );
    }

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single event details with remaining tickets
// @route   GET /api/events/:id
// @access  Public
exports.getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eventDoc = await db.collection('events').doc(id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: `Event not found with ID ${id}`
      });
    }

    res.status(200).json({
      success: true,
      data: eventDoc.data()
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new event listing
// @route   POST /api/events
// @access  Private (Organizer Only)
exports.createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      eventDate,
      venue,
      ticketPrice,
      totalCapacity
    } = req.body;

    if (!title || !category || !eventDate || !venue || ticketPrice === undefined || !totalCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, category, eventDate, venue, ticketPrice, and totalCapacity'
      });
    }

    const capacity = parseInt(totalCapacity, 10);
    const price = parseFloat(ticketPrice);

    if (capacity <= 0 || price < 0) {
      return res.status(400).json({
        success: false,
        message: 'totalCapacity must be > 0 and ticketPrice must be >= 0'
      });
    }

    const eventDocRef = db.collection('events').doc();
    const newEvent = {
      id: eventDocRef.id,
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category.trim(),
      eventDate: new Date(eventDate).toISOString(),
      venue: venue.trim(),
      organizerId: req.user.id,
      organizerName: req.user.name,
      ticketPrice: price,
      totalCapacity: capacity,
      availableTickets: capacity,
      createdAt: new Date().toISOString()
    };

    await eventDocRef.set(newEvent);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: newEvent
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update event details (Organizer must own event)
// @route   PUT /api/events/:id
// @access  Private (Organizer Only)
exports.updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eventRef = db.collection('events').doc(id);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: `Event not found with ID ${id}`
      });
    }

    const eventData = eventDoc.data();

    // Verify ownership
    if (eventData.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only update events you organized'
      });
    }

    const updates = {};
    if (req.body.title) updates.title = req.body.title.trim();
    if (req.body.description) updates.description = req.body.description.trim();
    if (req.body.category) updates.category = req.body.category.trim();
    if (req.body.eventDate) updates.eventDate = new Date(req.body.eventDate).toISOString();
    if (req.body.venue) updates.venue = req.body.venue.trim();
    if (req.body.ticketPrice !== undefined) updates.ticketPrice = parseFloat(req.body.ticketPrice);

    await eventRef.update(updates);
    const updatedDoc = await eventRef.get();

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: updatedDoc.data()
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete/Cancel event
// @route   DELETE /api/events/:id
// @access  Private (Organizer Only)
exports.deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eventRef = db.collection('events').doc(id);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: `Event not found with ID ${id}`
      });
    }

    const eventData = eventDoc.data();

    if (eventData.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only delete events you organized'
      });
    }

    await eventRef.delete();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
      deletedId: id
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all registered attendees for an event
// @route   GET /api/events/:id/attendees
// @access  Private (Organizer Only)
exports.getEventAttendees = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eventDoc = await db.collection('events').doc(id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: `Event not found with ID ${id}`
      });
    }

    const eventData = eventDoc.data();
    if (eventData.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only view attendees for events you organized'
      });
    }

    const ticketsSnapshot = await db.collection('tickets').where('eventId', '==', id).get();
    const attendees = [];
    ticketsSnapshot.docs.forEach(doc => {
      const ticket = doc.data();
      if (ticket.status === 'confirmed') {
        attendees.push(ticket);
      }
    });

    res.status(200).json({
      success: true,
      count: attendees.length,
      eventTitle: eventData.title,
      data: attendees
    });
  } catch (err) {
    next(err);
  }
};
