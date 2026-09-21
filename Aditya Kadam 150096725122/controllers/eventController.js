const { getDb } = require('../config/firebaseConfig');

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management endpoints
 */

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Browse all upcoming events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city in venue
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 */

exports.getAllEvents = async (req, res) => {
  const { category, city } = req.query;

  try {
    const db = getDb();
    let eventsRef = db.collection('events');
    let query = eventsRef.orderBy('eventDate', 'asc');

    if (category) {
      query = eventsRef.where('category', '==', category).orderBy('eventDate', 'asc');
    }

    const snapshot = await query.get();

    let events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (city) {
      events = events.filter(event => 
        event.venue.toLowerCase().includes(city.toLowerCase())
      );
    }

    events = events.filter(event => new Date(event.eventDate) > new Date());

    res.status(200).json({ success: true, count: events.length, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event details
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 */

exports.getEventById = async (req, res) => {
  try {
    const db = getDb();
    const eventDoc = await db.collection('events').doc(req.params.id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({ success: true, data: { id: eventDoc.id, ...eventDoc.data() } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event (Organizer only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - eventDate
 *               - venue
 *               - ticketPrice
 *               - totalCapacity
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               eventDate:
 *                 type: string
 *                 format: date-time
 *               venue:
 *                 type: string
 *               ticketPrice:
 *                 type: number
 *               totalCapacity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       403:
 *         description: Forbidden - Organizer access required
 */

exports.createEvent = async (req, res) => {
  const { title, description, category, eventDate, venue, ticketPrice, totalCapacity } = req.body;

  if (!title || !description || !category || !eventDate || !venue || !ticketPrice || !totalCapacity) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }

  try {
    const db = getDb();
    const eventRef = db.collection('events').doc();
    const eventData = {
      id: eventRef.id,
      title,
      description,
      category,
      eventDate: new Date(eventDate).toISOString(),
      venue,
      organizerId: req.user.id,
      ticketPrice: parseFloat(ticketPrice),
      totalCapacity: parseInt(totalCapacity, 10),
      availableTickets: parseInt(totalCapacity, 10),
      createdAt: new Date().toISOString()
    };

    await eventRef.set(eventData);

    res.status(201).json({ success: true, message: 'Event created successfully', data: eventData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update an event (Organizer only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               eventDate:
 *                 type: string
 *                 format: date-time
 *               venue:
 *                 type: string
 *               ticketPrice:
 *                 type: number
 *               totalCapacity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       403:
 *         description: Forbidden - Not event owner
 *       404:
 *         description: Event not found
 */

exports.updateEvent = async (req, res) => {
  const { title, description, category, eventDate, venue, ticketPrice, totalCapacity } = req.body;

  try {
    const db = getDb();
    const eventDoc = await db.collection('events').doc(req.params.id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const eventData = eventDoc.data();

    if (eventData.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this event' });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (eventDate) updateData.eventDate = new Date(eventDate).toISOString();
    if (venue) updateData.venue = venue;
    if (ticketPrice) updateData.ticketPrice = parseFloat(ticketPrice);
    if (totalCapacity) {
      const newTotal = parseInt(totalCapacity, 10);
      updateData.totalCapacity = newTotal;
      updateData.availableTickets = newTotal - (eventData.totalCapacity - eventData.availableTickets);
    }

    await db.collection('events').doc(req.params.id).update(updateData);

    const updatedDoc = await db.collection('events').doc(req.params.id).get();
    res.status(200).json({ success: true, message: 'Event updated successfully', data: { id: updatedDoc.id, ...updatedDoc.data() } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete an event (Organizer only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       403:
 *         description: Forbidden - Not event owner
 *       404:
 *         description: Event not found
 */

exports.deleteEvent = async (req, res) => {
  try {
    const db = getDb();
    const eventDoc = await db.collection('events').doc(req.params.id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const eventData = eventDoc.data();

    if (eventData.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this event' });
    }

    await db.collection('events').doc(req.params.id).delete();

    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/events/{id}/attendees:
 *   get:
 *     summary: List all attendees for an event (Organizer only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of attendees
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ticket'
 *       403:
 *         description: Forbidden - Not event owner
 *       404:
 *         description: Event not found
 */

exports.getEventAttendees = async (req, res) => {
  try {
    const db = getDb();
    const eventDoc = await db.collection('events').doc(req.params.id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const eventData = eventDoc.data();

    if (eventData.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this event' });
    }

    const ticketsSnapshot = await db.collection('tickets')
      .where('eventId', '==', req.params.id)
      .where('status', '==', 'confirmed')
      .get();

    const attendees = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json({ success: true, count: attendees.length, data: attendees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
