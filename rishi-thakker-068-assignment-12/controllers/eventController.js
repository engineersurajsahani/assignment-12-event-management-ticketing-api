const { db } = require("../config/firebaseConfig");

const eventsCollection = db.collection("events");
const ticketsCollection = db.collection("tickets");

exports.getEvents = async (req, res) => {
  try {
    let query = eventsCollection;

    if (req.query.category) {
      query = query.where("category", "==", req.query.category);
    }
    if (req.query.city) {
      query = query.where("city", "==", req.query.city);
    }

    const snapshot = await query.get();
    const events = snapshot.docs.map((doc) => doc.data());

    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const doc = await eventsCollection.doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json(doc.data());
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, description, category, eventDate, venue, city, ticketPrice, totalCapacity } = req.body;

    if (!title || !category || !eventDate || !venue || !ticketPrice || !totalCapacity) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const eventRef = eventsCollection.doc();
    const newEvent = {
      id: eventRef.id,
      title,
      description,
      category,
      eventDate,
      venue,
      city,
      organizerId: req.user.id,
      ticketPrice: Number(ticketPrice),
      totalCapacity: Number(totalCapacity),
      availableTickets: Number(totalCapacity),
      createdAt: new Date().toISOString(),
    };

    await eventRef.set(newEvent);
    res.status(201).json(newEvent);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const eventRef = eventsCollection.doc(req.params.id);
    const doc = await eventRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (doc.data().organizerId !== req.user.id) {
      return res.status(403).json({ message: "You do not own this event" });
    }

    await eventRef.update(req.body);
    const updated = await eventRef.get();
    res.status(200).json(updated.data());
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const eventRef = eventsCollection.doc(req.params.id);
    const doc = await eventRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (doc.data().organizerId !== req.user.id) {
      return res.status(403).json({ message: "You do not own this event" });
    }

    await eventRef.delete();
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getAttendees = async (req, res) => {
  try {
    const eventRef = eventsCollection.doc(req.params.id);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (eventDoc.data().organizerId !== req.user.id) {
      return res.status(403).json({ message: "You do not own this event" });
    }

    const snapshot = await ticketsCollection
      .where("eventId", "==", req.params.id)
      .where("status", "==", "confirmed")
      .get();

    const attendees = snapshot.docs.map((doc) => doc.data());
    res.status(200).json(attendees);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
