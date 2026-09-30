const { db } = require("../config/firebaseConfig");

const createEvent = async (req, res) => {
  try {
    const { name, description, date, venue, ticketPrice, totalTickets } =
      req.body;

    if (
      !name ||
      !description ||
      !date ||
      !venue ||
      ticketPrice === undefined ||
      !totalTickets
    ) {
      return res.status(400).json({
        message: "All event details are required"
      });
    }

    const event = {
      name,
      description,
      date,
      venue,
      ticketPrice: Number(ticketPrice),
      totalTickets: Number(totalTickets),
      availableTickets: Number(totalTickets),
      organizerId: req.user.userId,
      createdAt: new Date()
    };

    const eventRef = await db.collection("events").add(event);

    res.status(201).json({
      message: "Event created successfully",
      eventId: eventRef.id,
      event
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create event"
    });
  }
};

const getEvents = async (req, res) => {
  try {
    const snapshot = await db.collection("events").get();

    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(events);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch events"
    });
  }
};

const getEventById = async (req, res) => {
  try {
    const eventDoc = await db
      .collection("events")
      .doc(req.params.id)
      .get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    res.json({
      id: eventDoc.id,
      ...eventDoc.data()
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch event"
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const eventRef = db.collection("events").doc(req.params.id);

    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    const event = eventDoc.data();

    if (event.organizerId !== req.user.userId) {
      return res.status(403).json({
        message: "You can only update your own events"
      });
    }

    await eventRef.update({
      ...req.body,
      updatedAt: new Date()
    });

    res.json({
      message: "Event updated successfully"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update event"
    });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const eventRef = db.collection("events").doc(req.params.id);

    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    const event = eventDoc.data();

    if (event.organizerId !== req.user.userId) {
      return res.status(403).json({
        message: "You can only delete your own events"
      });
    }

    await eventRef.delete();

    res.json({
      message: "Event deleted successfully"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete event"
    });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
};