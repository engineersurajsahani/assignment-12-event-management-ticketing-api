const { db } = require('../config/firebaseConfig');

const eventsRef = () => db.collection('events');
const ticketsRef = () => db.collection('tickets');

const serializeTicket = (doc) => ({ id: doc.id, ...doc.data() });

/**
 * @swagger
 * /api/tickets/book:
 *   post:
 *     summary: Atomic booking (Attendee only) — decrements tickets via Firestore transaction
 *     description: Rate limited to 10 requests/min to prevent ticket-scalping bots.
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId, quantity, attendeeName, attendeeEmail]
 *             properties:
 *               eventId:       { type: string, example: "event_techconf_2026" }
 *               quantity:      { type: integer, minimum: 1, example: 2 }
 *               attendeeName:  { type: string, example: Kunal Sharma }
 *               attendeeEmail: { type: string, example: kunal@gmail.com }
 *     responses:
 *       201:
 *         description: Tickets booked successfully
 *       400:
 *         description: Insufficient tickets / event already started
 *       403:
 *         description: Attendee role required
 *       429:
 *         description: Rate limit exceeded (max 10/min)
 */
exports.bookTicket = async (req, res, next) => {
  const { eventId, quantity, attendeeName, attendeeEmail } = req.body;
  const userId = req.user.id;
  const qty = parseInt(quantity, 10);

  if (!eventId || !attendeeName || !attendeeEmail || isNaN(qty) || qty <= 0) {
    return res.status(400).json({
      success: false,
      message: 'eventId, quantity (>=1), attendeeName and attendeeEmail are required'
    });
  }

  const eventRef = eventsRef().doc(eventId);
  const ticketRef = ticketsRef().doc();

  try {
    const result = await db.runTransaction(async (t) => {
      const eventDoc = await t.get(eventRef);
      if (!eventDoc.exists) {
        throw new Error('Event not found');
      }

      const eventData = eventDoc.data();
      if (eventData.eventDate && eventData.eventDate.toDate && eventData.eventDate.toDate() <= new Date()) {
        throw new Error('Event has already started; bookings are closed');
      }

      if (eventData.availableTickets < qty) {
        throw new Error(`Insufficient tickets available (only ${eventData.availableTickets} left)`);
      }

      t.update(eventRef, {
        availableTickets: eventData.availableTickets - qty
      });

      const bookingRef = `TKT-${Date.now().toString().slice(-6)}`;
      const newTicket = {
        id: ticketRef.id,
        eventId,
        eventTitle: eventData.title,
        userId,
        attendeeName,
        attendeeEmail,
        quantity: qty,
        totalPaid: qty * eventData.ticketPrice,
        bookingRef,
        status: 'confirmed',
        bookedAt: new Date().toISOString()
      };

      t.set(ticketRef, newTicket);
      return newTicket;
    });

    return res.status(201).json({ success: true, message: 'Tickets booked successfully', data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/tickets/my-tickets:
 *   get:
 *     summary: View tickets purchased by the authenticated attendee
 *     tags: [Tickets]
 *     responses:
 *       200:
 *         description: List of the attendee's tickets
 *       401:
 *         description: Unauthorized
 */
exports.myTickets = async (req, res, next) => {
  try {
    const snapshot = await ticketsRef().where('userId', '==', req.user.id).get();
    const tickets = snapshot.docs
      .map(serializeTicket)
      .sort((a, b) => (a.bookedAt < b.bookedAt ? 1 : -1));
    return res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/tickets/{id}/cancel:
 *   post:
 *     summary: Cancel a ticket & restore ticket inventory (Attendee only)
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Ticket document ID
 *     responses:
 *       200:
 *         description: Ticket cancelled, inventory restored
 *       403:
 *         description: Not the owner of this ticket
 *       404:
 *         description: Ticket not found
 */
exports.cancelTicket = async (req, res, next) => {
  const ticketRef = ticketsRef().doc(req.params.id);

  try {
    const result = await db.runTransaction(async (t) => {
      const ticketDoc = await t.get(ticketRef);
      if (!ticketDoc.exists) {
        throw { statusCode: 404, message: 'Ticket not found' };
      }

      const ticketData = ticketDoc.data();
      if (ticketData.userId !== req.user.id) {
        throw { statusCode: 403, message: 'You can only cancel your own tickets' };
      }
      if (ticketData.status === 'cancelled') {
        throw { statusCode: 400, message: 'Ticket is already cancelled' };
      }

      const eventRef = eventsRef().doc(ticketData.eventId);
      const eventDoc = await t.get(eventRef);
      const eventData = eventDoc.exists ? eventDoc.data() : null;

      if (eventData && typeof eventData.availableTickets === 'number') {
        t.update(eventRef, {
          availableTickets: Math.min(eventData.availableTickets + ticketData.quantity, eventData.totalCapacity)
        });
      }

      t.update(ticketRef, { status: 'cancelled' });
      return { id: ticketDoc.id, ...ticketData, status: 'cancelled' };
    });

    return res.status(200).json({ success: true, message: 'Ticket cancelled and inventory restored', data: result });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/events/{id}/attendees:
 *   get:
 *     summary: List all registered attendees for an event (Organizer only)
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Event document ID
 *     responses:
 *       200:
 *         description: List of confirmed attendees
 *       403:
 *         description: Organizer role required
 */
exports.getAttendees = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const eventDoc = await eventsRef().doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const snapshot = await ticketsRef().where('eventId', '==', eventId).get();

    const attendees = snapshot.docs
      .filter((doc) => doc.data().status === 'confirmed')
      .sort((a, b) => (a.data().bookedAt < b.data().bookedAt ? 1 : -1))
      .map((doc) => ({
      id: doc.id,
      attendeeName: doc.data().attendeeName,
      attendeeEmail: doc.data().attendeeEmail,
      quantity: doc.data().quantity,
      bookingRef: doc.data().bookingRef,
      totalPaid: doc.data().totalPaid,
      bookedAt: doc.data().bookedAt
    }));

    return res.status(200).json({
      success: true,
      eventId,
      eventTitle: eventDoc.data().title,
      count: attendees.length,
      data: attendees
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};