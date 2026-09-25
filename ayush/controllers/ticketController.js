const { db } = require('../config/firebaseConfig');

const EVENTS_COLLECTION = 'events';
const TICKETS_COLLECTION = 'tickets';

exports.bookTicket = async (req, res) => {
  try {
    const { eventId, quantity, attendeeName, attendeeEmail } = req.body;
    const userId = req.user.id;
    const qty = parseInt(quantity, 10);

    if (!eventId || !qty || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'eventId and a positive integer quantity are required.'
      });
    }
    if (!attendeeName || !attendeeEmail) {
      return res.status(400).json({ success: false, message: 'attendeeName and attendeeEmail are required.' });
    }

    const eventRef = db.collection(EVENTS_COLLECTION).doc(eventId);
    const ticketRef = db.collection(TICKETS_COLLECTION).doc();

    const result = await db.runTransaction(async (t) => {
      const eventDoc = await t.get(eventRef);

      if (!eventDoc.exists) {
        throw new Error('Event not found');
      }

      const eventData = eventDoc.data();

      if (eventData.availableTickets < qty) {
        throw new Error(
          `Insufficient tickets available. Only ${eventData.availableTickets} left.`
        );
      }


      t.update(eventRef, {
        availableTickets: eventData.availableTickets - qty
      });


      const bookingRef = `TKT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
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

    return res.status(201).json({ success: true, message: 'Tickets booked successfully.', data: result });
  } catch (error) {
    console.error('bookTicket error:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMyTickets = async (req, res) => {
  try {
    const snapshot = await db
      .collection(TICKETS_COLLECTION)
      .where('userId', '==', req.user.id)
      .get();

    const tickets = snapshot.docs
      .map((doc) => doc.data())
      .sort((a, b) => (a.bookedAt < b.bookedAt ? 1 : -1));

    return res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    console.error('getMyTickets error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch tickets.' });
  }
};

exports.cancelTicket = async (req, res) => {
  try {
    const ticketRef = db.collection(TICKETS_COLLECTION).doc(req.params.id);

    const result = await db.runTransaction(async (t) => {
      const ticketDoc = await t.get(ticketRef);

      if (!ticketDoc.exists) {
        throw new Error('Ticket not found');
      }

      const ticket = ticketDoc.data();

      if (ticket.userId !== req.user.id) {
        const err = new Error('You do not own this ticket');
        err.statusCode = 403;
        throw err;
      }

      if (ticket.status === 'cancelled') {
        const err = new Error('Ticket is already cancelled');
        err.statusCode = 400;
        throw err;
      }

      const eventRef = db.collection(EVENTS_COLLECTION).doc(ticket.eventId);
      const eventDoc = await t.get(eventRef);

      t.update(ticketRef, { status: 'cancelled', cancelledAt: new Date().toISOString() });

      if (eventDoc.exists) {
        const eventData = eventDoc.data();
        t.update(eventRef, {
          availableTickets: eventData.availableTickets + ticket.quantity
        });
      }

      return { ...ticket, status: 'cancelled' };
    });

    return res.status(200).json({ success: true, message: 'Ticket cancelled successfully.', data: result });
  } catch (error) {
    console.error('cancelTicket error:', error.message);
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};
