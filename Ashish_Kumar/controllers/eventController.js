const { db } = require("../config/firebaseConfig");

// Get all events (with optional filtering by category and city/venue)
exports.getEvents = async (req, res) => {
  try {
    const { category, city } = req.query;
    let query = db.collection("events");

    if (category) {
      query = query.where("category", "==", category);
    }

    const snapshot = await query.get();
    let events = [];

    snapshot.forEach((doc) => {
      events.push(doc.data());
    });

    // In-memory filter for city in venue if specified
    if (city) {
      events = events.filter(
        (event) => event.venue && event.venue.toLowerCase().includes(city.toLowerCase())
      );
    }

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single event by ID
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("events").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    res.status(200).json({
      success: true,
      data: doc.data()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create a new event (Organizer only)
exports.createEvent = async (req, res) => {
  try {
    const { title, description, category, eventDate, venue, ticketPrice, totalCapacity } = req.body;

    if (!title || !eventDate || !venue || !ticketPrice || !totalCapacity) {
      return res.status(400).json({
        success: false,
        message: "Title, eventDate, venue, ticketPrice, and totalCapacity are required"
      });
    }

    const capacity = parseInt(totalCapacity, 10);
    const price = parseFloat(ticketPrice);

    const eventRef = db.collection("events").doc();
    const newEvent = {
      id: eventRef.id,
      title,
      description: description || "",
      category: category || "General",
      eventDate,
      venue,
      organizerId: req.user.id,
      ticketPrice: price,
      totalCapacity: capacity,
      availableTickets: capacity,
      createdAt: new Date().toISOString()
    };

    await eventRef.set(newEvent);

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: newEvent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update an existing event (Organizer only & must own event)
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const eventRef = db.collection("events").doc(id);
    const doc = await eventRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    const eventData = doc.data();

    // Verify ownership
    if (eventData.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only update your own events"
      });
    }

    const { title, description, category, eventDate, venue, ticketPrice } = req.body;
    const updates = {};

    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category) updates.category = category;
    if (eventDate) updates.eventDate = eventDate;
    if (venue) updates.venue = venue;
    if (ticketPrice !== undefined) updates.ticketPrice = parseFloat(ticketPrice);

    await eventRef.update(updates);

    const updatedDoc = await eventRef.get();

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: updatedDoc.data()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete an event (Organizer only & must own event)
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const eventRef = db.collection("events").doc(id);
    const doc = await eventRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    const eventData = doc.data();

    // Verify ownership
    if (eventData.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only delete your own events"
      });
    }

    await eventRef.delete();

    res.status(200).json({
      success: true,
      message: "Event deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get registered attendees for an event (Organizer only)
exports.getEventAttendees = async (req, res) => {
  try {
    const { id } = req.params;
    const eventDoc = await db.collection("events").doc(id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    const eventData = eventDoc.data();

    // Verify ownership
    if (eventData.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only view attendees for your own events"
      });
    }

    const ticketsSnapshot = await db
      .collection("tickets")
      .where("eventId", "==", id)
      .where("status", "==", "confirmed")
      .get();

    const attendees = [];
    ticketsSnapshot.forEach((doc) => {
      attendees.push(doc.data());
    });

    res.status(200).json({
      success: true,
      count: attendees.length,
      data: attendees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
