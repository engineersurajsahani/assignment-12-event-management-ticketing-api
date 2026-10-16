const { db } = require('../config/firebaseConfig');

exports.getAllEvents = async (req, res) => {
  try {
    if (!db) return res.status(500).json({ success: false, message: 'Firebase not initialized' });

    let eventsRef = db.collection('events');
    let query = eventsRef;
    
    if (req.query.category) {
      query = query.where('category', '==', req.query.category);
    }

    const snapshot = await query.get();
    let events = [];
    snapshot.forEach(doc => {
      let data = doc.data();
      if (req.query.city) {
          if (data.venue && data.venue.includes(req.query.city)) {
              events.push(data);
          }
      } else {
          events.push(data);
      }
    });

    res.status(200).json({ success: true, data: events });
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
    res.status(200).json({ success: true, data: doc.data() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, description, category, eventDate, venue, ticketPrice, totalCapacity } = req.body;
    
    const eventRef = db.collection('events').doc();
    const newEvent = {
      id: eventRef.id,
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
    res.status(201).json({ success: true, message: 'Event created successfully', data: newEvent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const eventRef = db.collection('events').doc(req.params.id);
    const doc = await eventRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    if (doc.data().organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this event' });
    }

    const updates = req.body;
    if (updates.totalCapacity) {
        const capacityDiff = updates.totalCapacity - doc.data().totalCapacity;
        updates.availableTickets = doc.data().availableTickets + capacityDiff;
    }

    await eventRef.update(updates);
    res.status(200).json({ success: true, message: 'Event updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const eventRef = db.collection('events').doc(req.params.id);
    const doc = await eventRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    if (doc.data().organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this event' });
    }

    await eventRef.delete();
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEventAttendees = async (req, res) => {
    try {
        const eventRef = db.collection('events').doc(req.params.id);
        const eventDoc = await eventRef.get();
        if (!eventDoc.exists) return res.status(404).json({ success: false, message: 'Event not found' });

        if (eventDoc.data().organizerId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const snapshot = await db.collection('tickets').where('eventId', '==', req.params.id).get();
        let attendees = [];
        snapshot.forEach(doc => attendees.push(doc.data()));

        res.status(200).json({ success: true, data: attendees });
    } catch(err) {
        res.status(500).json({ success: false, message: err.message });
    }
}
