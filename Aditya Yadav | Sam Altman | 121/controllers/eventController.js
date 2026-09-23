const { db } = require('../config/firebaseConfig');

// Browse all events (Public)
exports.getAllEvents = async (req, res) => {
  try {
    const { category, city, search } = req.query;
    const eventsSnapshot = await db.collection('events').get();
    let events = [];

    eventsSnapshot.forEach(doc => {
      events.push(doc.data());
    });

    if (category) {
      events = events.filter(e => e.category && e.category.toLowerCase() === category.toLowerCase());
    }

    if (city) {
      events = events.filter(e => e.city && e.city.toLowerCase() === city.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      events = events.filter(e =>
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.venue && e.venue.toLowerCase().includes(q))
      );
    }

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// View event details
exports.getEventById = async (req, res) => {
  try {
    const eventDoc = await db.collection('events').doc(req.params.id).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({
      success: true,
      data: eventDoc.data()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create new event (Organizer)
exports.createEvent = async (req, res) => {
  try {
    const { title, description, category, city, eventDate, venue, ticketPrice, totalCapacity } = req.body;
    const organizerId = req.user.id;

    if (!title || !category || !eventDate || !venue || ticketPrice === undefined || !totalCapacity) {
      return res.status(400).json({
        success: false,
        message: 'title, category, eventDate, venue, ticketPrice, and totalCapacity are required'
      });
    }

    const capacity = parseInt(totalCapacity, 10);
    const eventRef = db.collection('events').doc();

    const newEvent = {
      id: eventRef.id,
      title: title.trim(),
      description: description || '',
      category: category.trim(),
      city: city || 'Mumbai',
      eventDate,
      venue: venue.trim(),
      organizerId,
      ticketPrice: Number(ticketPrice),
      totalCapacity: capacity,
      availableTickets: capacity,
      createdAt: new Date().toISOString()
    };

    await eventRef.set(newEvent);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: newEvent
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update event (Organizer must own event)
exports.updateEvent = async (req, res) => {
  try {
    const eventRef = db.collection('events').doc(req.params.id);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const eventData = eventDoc.data();
    if (eventData.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only update your own events' });
    }

    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    delete updates.id;
    delete updates.organizerId;

    await eventRef.update(updates);
    const updatedDoc = await eventRef.get();

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: updatedDoc.data()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete event (Organizer must own event)
exports.deleteEvent = async (req, res) => {
  try {
    const eventRef = db.collection('events').doc(req.params.id);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const eventData = eventDoc.data();
    if (eventData.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only delete your own events' });
    }

    await eventRef.delete();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// List attendees for organizer's event
exports.getEventAttendees = async (req, res) => {
  try {
    const eventDoc = await db.collection('events').doc(req.params.id).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const eventData = eventDoc.data();
    if (eventData.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only view attendees for your own events' });
    }

    const ticketsSnapshot = await db.collection('tickets').get();
    const attendees = [];

    ticketsSnapshot.forEach(doc => {
      const ticket = doc.data();
      if (ticket.eventId === req.params.id && ticket.status === 'confirmed') {
        attendees.push(ticket);
      }
    });

    res.status(200).json({
      success: true,
      count: attendees.length,
      data: attendees
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
