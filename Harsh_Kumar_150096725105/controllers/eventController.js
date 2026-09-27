const { db } = require('../config/firebaseConfig');

exports.getAllEvents = async (req, res) => {
  try {
    const { category, city } = req.query;
    let eventsRef = db.collection('events');
    
    if (category) {
      eventsRef = eventsRef.where('category', '==', category);
    }
    // Firebase requires compound index for multiple where clauses, keeping it simple for now
    
    const snapshot = await eventsRef.get();
    const events = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (city && data.venue && !data.venue.includes(city)) return;
      events.push({ id: doc.id, ...data });
    });

    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const doc = await db.collection('events').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, description, category, eventDate, venue, ticketPrice, totalCapacity } = req.body;
    
    const eventRef = db.collection('events').doc();
    const newEvent = {
      title,
      description,
      category,
      eventDate,
      venue,
      organizerId: req.user.id,
      ticketPrice: Number(ticketPrice),
      totalCapacity: Number(totalCapacity),
      availableTickets: Number(totalCapacity),
      createdAt: new Date().toISOString()
    };
    
    await eventRef.set(newEvent);
    res.status(201).json({ success: true, data: { id: eventRef.id, ...newEvent } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const eventRef = db.collection('events').doc(req.params.id);
    const doc = await eventRef.get();
    
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Event not found' });
    
    if (doc.data().organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this event' });
    }
    
    await eventRef.update(req.body);
    res.json({ success: true, message: 'Event updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const eventRef = db.collection('events').doc(req.params.id);
    const doc = await eventRef.get();
    
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Event not found' });
    
    if (doc.data().organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
    }
    
    await eventRef.delete();
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
