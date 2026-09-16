const { db } = require('../config/firebaseConfig');

// POST /api/tickets/book (Attendee, rate-limited)
const bookTicket = async (req, res) => {
  const { eventId, quantity, attendeeName, attendeeEmail } = req.body;
  const userId = req.user.id;
  const qty = parseInt(quantity, 10);

  if (!eventId || !qty || qty < 1 || !attendeeName || !attendeeEmail) {
    return res.status(400).json({ success: false, message: 'Missing or invalid fields' });
  }

  const eventRef = db.collection('events').doc(eventId);
  const ticketRef = db.collection('tickets').doc();

  try {
    const result = await db.runTransaction(async (t) => {
      const eventDoc = await t.get(eventRef);
      if (!eventDoc.exists) {
        throw new Error('Event not found');
      }

      const eventData = eventDoc.data();
      if (eventData.availableTickets < qty) {
        throw new Error('Insufficient tickets available');
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

    res.status(201).json({ success: true, message: 'Tickets booked successfully', data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/tickets/my-tickets (Attendee)
const getMyTickets = async (req, res) => {
  try {
    const snapshot = await db.collection('tickets')
      .where('userId', '==', req.user.id)
      .get();

    const tickets = snapshot.docs.map(doc => doc.data());
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/tickets/:id/cancel (Attendee)
const cancelTicket = async (req, res) => {
  const ticketRef = db.collection('tickets').doc(req.params.id);

  try {
    const result = await db.runTransaction(async (t) => {
      const ticketDoc = await t.get(ticketRef);
      if (!ticketDoc.exists) {
        throw new Error('Ticket not found');
      }

      const ticket = ticketDoc.data();
      if (ticket.userId !== req.user.id) {
        throw new Error('You do not own this ticket');
      }
      if (ticket.status === 'cancelled') {
        throw new Error('Ticket already cancelled');
      }

      const eventRef = db.collection('events').doc(ticket.eventId);
      const eventDoc = await t.get(eventRef);

      if (eventDoc.exists) {
        t.update(eventRef, {
          availableTickets: eventDoc.data().availableTickets + ticket.quantity
        });
      }

      t.update(ticketRef, { status: 'cancelled' });

      return { ...ticket, status: 'cancelled' };
    });

    res.json({ success: true, message: 'Ticket cancelled', data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { bookTicket, getMyTickets, cancelTicket };