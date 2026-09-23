const { db, admin } = require('../config/firebaseConfig');

const EVENTS_COLLECTION = 'events';
const TICKETS_COLLECTION = 'tickets';

/**
 * Get upcoming events with optional category and city (venue match) filters
 * Public access: GET /api/events
 */
const getEvents = async (req, res) => {
  try {
    const { category, city } = req.query;
    const nowIso = new Date().toISOString();

    // Query upcoming events
    const snapshot = await db
      .collection(EVENTS_COLLECTION)
      .where('eventDate', '>=', nowIso)
      .orderBy('eventDate', 'asc')
      .get();

    let events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    // In-memory filter for category if provided
    if (category) {
      const categoryLower = category.toLowerCase().trim();
      events = events.filter(
        (event) => event.category && event.category.toLowerCase() === categoryLower
      );
    }

    // In-memory filter for city (searched as substring in venue field)
    if (city) {
      const cityLower = city.toLowerCase().trim();
      events = events.filter(
        (event) => event.venue && event.venue.toLowerCase().includes(cityLower)
      );
    }

    return res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Get events error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error fetching events',
      error: error.message
    });
  }
};

/**
 * Get single event by ID with live availableTickets count
 * Public access: GET /api/events/:id
 */
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const eventDoc = await db.collection(EVENTS_COLLECTION).doc(id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: eventDoc.id,
        ...eventDoc.data()
      }
    });
  } catch (error) {
    console.error('Get event by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error fetching event details',
      error: error.message
    });
  }
};

/**
 * Create a new event
 * Organizer only: POST /api/events
 */
const createEvent = async (req, res) => {
  try {
    const {
      title,
      description = '',
      category = 'General',
      eventDate,
      venue,
      ticketPrice,
      totalCapacity
    } = req.body;

    // Validation
    if (!title || !eventDate || !venue || ticketPrice === undefined || totalCapacity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: title, eventDate, venue, ticketPrice, and totalCapacity are required'
      });
    }

    const priceNum = Number(ticketPrice);
    const capacityNum = parseInt(totalCapacity, 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: ticketPrice must be a positive number greater than 0'
      });
    }

    if (isNaN(capacityNum) || capacityNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: totalCapacity must be a positive integer greater than 0'
      });
    }

    // Verify valid date
    const parsedDate = new Date(eventDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: eventDate must be a valid ISO 8601 date string'
      });
    }

    const newEventRef = db.collection(EVENTS_COLLECTION).doc();
    const eventData = {
      id: newEventRef.id,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      eventDate: parsedDate.toISOString(),
      venue: venue.trim(),
      organizerId: req.user.id,
      ticketPrice: priceNum,
      totalCapacity: capacityNum,
      availableTickets: capacityNum, // Initially equal to total capacity
      createdAt: new Date().toISOString()
    };

    await newEventRef.set(eventData);

    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: eventData
    });
  } catch (error) {
    console.error('Create event error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error creating event',
      error: error.message
    });
  }
};

/**
 * Update event details
 * Organizer only: PUT /api/events/:id
 * Enforces ownership and handles totalCapacity re-computation
 */
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const eventRef = db.collection(EVENTS_COLLECTION).doc(id);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const event = eventDoc.data();

    // Enforce ownership: organizer must own this event
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to update this event'
      });
    }

    const {
      title,
      description,
      category,
      eventDate,
      venue,
      ticketPrice,
      totalCapacity
    } = req.body;

    const updates = {
      updatedAt: new Date().toISOString()
    };

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (category !== undefined) updates.category = category.trim();
    if (venue !== undefined) updates.venue = venue.trim();

    if (eventDate !== undefined) {
      const parsedDate = new Date(eventDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed: eventDate must be a valid ISO 8601 date string'
        });
      }
      updates.eventDate = parsedDate.toISOString();
    }

    if (ticketPrice !== undefined) {
      const priceNum = Number(ticketPrice);
      if (isNaN(priceNum) || priceNum <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed: ticketPrice must be a positive number greater than 0'
        });
      }
      updates.ticketPrice = priceNum;
    }

    // Capacity update formula:
    // bookedTickets = current totalCapacity - current availableTickets
    // new availableTickets = new totalCapacity - bookedTickets
    if (totalCapacity !== undefined) {
      const newCapacity = parseInt(totalCapacity, 10);
      if (isNaN(newCapacity) || newCapacity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed: totalCapacity must be a positive integer greater than 0'
        });
      }

      const bookedTickets = (event.totalCapacity || 0) - (event.availableTickets || 0);

      if (newCapacity < bookedTickets) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce total capacity to ${newCapacity}. Already booked tickets: ${bookedTickets}`
        });
      }

      updates.totalCapacity = newCapacity;
      updates.availableTickets = newCapacity - bookedTickets;
    }

    await eventRef.update(updates);

    const updatedDoc = await eventRef.get();

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    });
  } catch (error) {
    console.error('Update event error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error updating event',
      error: error.message
    });
  }
};

/**
 * Delete event and cancel associated tickets
 * Organizer only: DELETE /api/events/:id
 */
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const eventRef = db.collection(EVENTS_COLLECTION).doc(id);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const event = eventDoc.data();

    // Enforce ownership
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to delete this event'
      });
    }

    // Fetch and cancel associated tickets using batch write
    const ticketsSnapshot = await db
      .collection(TICKETS_COLLECTION)
      .where('eventId', '==', id)
      .get();

    const batch = db.batch();

    ticketsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: 'cancelled',
        cancelledReason: 'Event deleted by organizer',
        cancelledAt: new Date().toISOString()
      });
    });

    // Delete the event doc itself
    batch.delete(eventRef);

    await batch.commit();

    return res.status(200).json({
      success: true,
      message: 'Event and associated tickets cancelled and deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error deleting event',
      error: error.message
    });
  }
};

/**
 * Get attendees list for an event
 * Organizer only: GET /api/events/:id/attendees
 * Enforces ownership: only event's organizer can view attendees
 */
const getEventAttendees = async (req, res) => {
  try {
    const { id } = req.params;
    const eventDoc = await db.collection(EVENTS_COLLECTION).doc(id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const event = eventDoc.data();

    // Ownership check
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only view attendees for events you organized'
      });
    }

    // Query confirmed tickets for this event
    const ticketsSnapshot = await db
      .collection(TICKETS_COLLECTION)
      .where('eventId', '==', id)
      .where('status', '==', 'confirmed')
      .get();

    const attendees = ticketsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        attendeeName: data.attendeeName,
        attendeeEmail: data.attendeeEmail,
        quantity: data.quantity,
        totalPaid: data.totalPaid,
        bookingRef: data.bookingRef,
        bookedAt: data.bookedAt
      };
    });

    return res.status(200).json({
      success: true,
      count: attendees.length,
      data: attendees
    });
  } catch (error) {
    console.error('Get event attendees error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error fetching attendees',
      error: error.message
    });
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
