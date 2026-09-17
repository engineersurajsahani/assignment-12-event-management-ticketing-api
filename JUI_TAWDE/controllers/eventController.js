const { db } = require("../config/firebaseConfig");

const eventsCollection = () => db.collection("events");

const listEvents = async (req, res, next) => {
  try {
    const snapshot = await eventsCollection().get();

    let events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    // The assignment asks for upcoming events.
    events = events.filter((event) => {
      return new Date(event.eventDate) >= new Date();
    });

    if (req.query.category) {
      events = events.filter(
        (event) =>
          String(event.category).toLowerCase() ===
          String(req.query.category).toLowerCase()
      );
    }

    if (req.query.city) {
      events = events.filter((event) =>
        String(event.venue)
          .toLowerCase()
          .includes(String(req.query.city).toLowerCase())
      );
    }

    events.sort(
      (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
    );

    return res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

const getEvent = async (req, res, next) => {
  try {
    const eventDoc = await eventsCollection().doc(req.params.id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    return res.json({
      success: true,
      data: {
        id: eventDoc.id,
        ...eventDoc.data()
      }
    });
  } catch (error) {
    next(error);
  }
};

const createEvent = async (req, res, next) => {
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

    if (
      !title ||
      !category ||
      !eventDate ||
      !venue ||
      ticketPrice === undefined ||
      totalCapacity === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "title, category, eventDate, venue, ticketPrice and totalCapacity are required"
      });
    }

    if (new Date(eventDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "eventDate must be in the future"
      });
    }

    if (Number(ticketPrice) < 0 || Number(totalCapacity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticketPrice or totalCapacity"
      });
    }

    const eventRef = eventsCollection().doc();

    const event = {
      id: eventRef.id,
      title,
      description: description || "",
      category,
      eventDate,
      venue,
      organizerId: req.user.id,
      ticketPrice: Number(ticketPrice),
      totalCapacity: Number(totalCapacity),
      availableTickets: Number(totalCapacity),
      createdAt: new Date().toISOString()
    };

    await eventRef.set(event);

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event
    });
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const eventRef = eventsCollection().doc(req.params.id);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    const existingEvent = eventDoc.data();

    if (existingEvent.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own event"
      });
    }

    const allowedFields = [
      "title",
      "description",
      "category",
      "eventDate",
      "venue",
      "ticketPrice"
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update"
      });
    }

    await eventRef.update(updates);

    return res.json({
      success: true,
      message: "Event updated successfully",
      data: {
        id: req.params.id,
        ...existingEvent,
        ...updates
      }
    });
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const eventRef = eventsCollection().doc(req.params.id);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    if (eventDoc.data().organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own event"
      });
    }

    await eventRef.delete();

    return res.json({
      success: true,
      message: "Event cancelled and deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

const listAttendees = async (req, res, next) => {
  try {
    const eventDoc = await eventsCollection().doc(req.params.id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    if (eventDoc.data().organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only view attendees for your own event"
      });
    }

    const snapshot = await db
      .collection("tickets")
      .where("eventId", "==", req.params.id)
      .get();

    const attendees = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter((ticket) => ticket.status === "confirmed");

    return res.json({
      success: true,
      count: attendees.length,
      data: attendees
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  listAttendees
};