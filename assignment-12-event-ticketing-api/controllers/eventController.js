const { db } = require('../config/firebaseConfig');

const { Timestamp } = require('firebase-admin/firestore');

const eventsRef = () => db.collection('events');

const serialize = (doc) => {
  const data = { id: doc.id, ...doc.data() };
  if (data.eventDate && data.eventDate instanceof Timestamp) {
    data.eventDate = data.eventDate.toDate().toISOString();
  }
  if (data.createdAt && data.createdAt instanceof Timestamp) {
    data.createdAt = data.createdAt.toDate().toISOString();
  }
  return data;
};

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Browse all upcoming events (supports ?category & ?city)
 *     tags: [Events]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Filter by event category (e.g. Technology)
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *         description: Filter by venue city (e.g. Mumbai)
 *     responses:
 *       200:
 *         description: List of upcoming events
 *       500:
 *         description: Server error
 */
exports.getEvents = async (req, res, next) => {
  try {
    const { category, city } = req.query;
    const now = new Date();

    let query = eventsRef().where('eventDate', '>', now).orderBy('eventDate', 'asc');

    let snapshot = await query.get();
    let events = snapshot.docs.map(serialize);

    if (category && category.trim()) {
      events = events.filter((e) => e.category === category.trim());
    }
    if (city && city.trim()) {
      events = events.filter((e) => e.city === city.trim());
    }

    return res.status(200).json({ success: true, count: events.length, data: events });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: View event details & live remaining ticket count
 *     tags: [Events]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Event document ID
 *     responses:
 *       200:
 *         description: Event details with live availableTickets count
 *       404:
 *         description: Event not found
 */
exports.getEventById = async (req, res, next) => {
  try {
    const doc = await eventsRef().doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    return res.status(200).json({ success: true, data: serialize(doc) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event listing (Organizer only)
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, eventDate, venue, ticketPrice, totalCapacity]
 *             properties:
 *               title:         { type: string, example: "Global Cloud & AI Summit 2026" }
 *               description:   { type: string, example: "Annual flagship backend conference" }
 *               category:      { type: string, example: Technology }
 *               eventDate:     { type: string, format: date-time, example: "2026-06-15T09:00:00Z" }
 *               venue:         { type: string, example: "Bandra Kurla Complex, Mumbai" }
 *               ticketPrice:   { type: number, example: 1499 }
 *               totalCapacity: { type: number, example: 500 }
 *     responses:
 *       201:
 *         description: Event created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Organizer role required
 */
exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, category, eventDate, venue, ticketPrice, totalCapacity } = req.body;

    if (!title || !eventDate || !venue || !ticketPrice || !totalCapacity) {
      return res.status(400).json({
        success: false,
        message: 'title, eventDate, venue, ticketPrice and totalCapacity are required'
      });
    }

    const eventDateTs = new Date(eventDate);
    if (isNaN(eventDateTs.getTime()) || eventDateTs <= new Date()) {
      return res.status(400).json({ success: false, message: 'eventDate must be a valid future date-time' });
    }

    const price = parseFloat(ticketPrice);
    const capacity = parseInt(totalCapacity, 10);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ success: false, message: 'ticketPrice must be a positive number' });
    }
    if (isNaN(capacity) || capacity <= 0) {
      return res.status(400).json({ success: false, message: 'totalCapacity must be a positive integer' });
    }

    const eventRef = eventsRef().doc();
    const newEvent = {
      id: eventRef.id,
      title,
      description: description || '',
      category: category || 'General',
      venue,
      city: extractCity(venue),
      eventDate: Timestamp.fromDate(eventDateTs),
      organizerId: req.user.id,
      ticketPrice: price,
      totalCapacity: capacity,
      availableTickets: capacity,
      createdAt: Timestamp.fromDate(new Date())
    };

    await eventRef.set(newEvent);
    const doc = await eventRef.get();

    return res.status(201).json({ success: true, message: 'Event created successfully', data: serialize(doc) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update event details (Organizer must own event)
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:         { type: string }
 *               description:   { type: string }
 *               category:      { type: string }
 *               eventDate:     { type: string, format: date-time }
 *               venue:         { type: string }
 *               ticketPrice:   { type: number }
 *               totalCapacity: { type: number }
 *     responses:
 *       200:
 *         description: Event updated
 *       403:
 *         description: Only the owning organizer may update
 *       404:
 *         description: Event not found
 */
exports.updateEvent = async (req, res, next) => {
  try {
    const doc = await eventsRef().doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const eventData = doc.data();
    if (eventData.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only update events you own' });
    }

    const updates = {};
    const { title, description, category, eventDate, venue, ticketPrice, totalCapacity } = req.body;

    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category) updates.category = category;

    if (eventDate) {
      const ts = new Date(eventDate);
      if (isNaN(ts.getTime()) || ts <= new Date()) {
        return res.status(400).json({ success: false, message: 'eventDate must be a valid future date-time' });
      }
      updates.eventDate = Timestamp.fromDate(ts);
    }
    if (venue) {
      updates.venue = venue;
      updates.city = extractCity(venue);
    }

    if (ticketPrice !== undefined) {
      const price = parseFloat(ticketPrice);
      if (isNaN(price) || price <= 0) {
        return res.status(400).json({ success: false, message: 'ticketPrice must be a positive number' });
      }
      updates.ticketPrice = price;
    }

    if (totalCapacity !== undefined) {
      const capacity = parseInt(totalCapacity, 10);
      if (isNaN(capacity) || capacity < eventData.availableTickets) {
        return res.status(400).json({
          success: false,
          message: 'totalCapacity must be a positive integer and not less than tickets already sold'
        });
      }
      updates.totalCapacity = capacity;
      updates.availableTickets = capacity - (eventData.totalCapacity - eventData.availableTickets);
    }

    await eventsRef().doc(req.params.id).update(updates);
    const updated = await eventsRef().doc(req.params.id).get();

    return res.status(200).json({ success: true, message: 'Event updated successfully', data: serialize(updated) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Cancel and delete event (Organizer must own event)
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Event deleted
 *       403:
 *         description: Only the owning organizer may delete
 *       404:
 *         description: Event not found
 */
exports.deleteEvent = async (req, res, next) => {
  try {
    const doc = await eventsRef().doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (doc.data().organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only delete events you own' });
    }

    await eventsRef().doc(req.params.id).delete();
    return res.status(200).json({ success: true, message: 'Event cancelled and deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const extractCity = (venue) => {
  const match = venue.split(',').pop();
  return match ? match.trim() : 'Unknown';
};