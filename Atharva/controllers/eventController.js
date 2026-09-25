const { db } = require('../config/firebaseConfig');

exports.createEvent = async (req, res) => {
  try {
    const { title, description, category, eventDate, venue, ticketPrice, totalCapacity } = req.body;
    
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

    const eventRef = await db.collection('events').add(newEvent);
    // add ID to document
    await eventRef.update({ id: eventRef.id });
    newEvent.id = eventRef.id;

    res.status(201).json({ success: true, data: newEvent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEvents = async (req, res) => {
  try {
    let eventsRef = db.collection('events');
    
    if (req.query.category) {
      eventsRef = eventsRef.where('category', '==', req.query.category);
    }
    
    // Simplistic city filter, in real app might require a better text search
    const snapshot = await eventsRef.get();
    let events = snapshot.docs.map(doc => doc.data());
    
    if (req.query.city) {
      events = events.filter(e => e.venue && e.venue.toLowerCase().includes(req.query.city.toLowerCase()));
    }
    
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const eventDoc = await db.collection('events').doc(req.params.id).get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    res.json({ success: true, data: eventDoc.data() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const eventRef = db.collection('events').doc(req.params.id);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    if (eventDoc.data().organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this event' });
    }
    
    await eventRef.update(req.body);
    
    res.json({ success: true, message: 'Event updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const eventRef = db.collection('events').doc(req.params.id);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    if (eventDoc.data().organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
    }
    
    await eventRef.delete();
    
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEventAttendees = async (req, res) => {
  try {
    const eventRef = db.collection('events').doc(req.params.id);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    if (eventDoc.data().organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    const ticketsSnapshot = await db.collection('tickets').where('eventId', '==', req.params.id).where('status', '==', 'confirmed').get();
    const attendees = ticketsSnapshot.docs.map(doc => {
      const data = doc.data();
      return { name: data.attendeeName, email: data.attendeeEmail, quantity: data.quantity };
    });
    
    res.json({ success: true, data: attendees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
