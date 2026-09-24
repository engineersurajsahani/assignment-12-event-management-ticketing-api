const { db } = require('../config/firebaseConfig');

// Atomic Ticket Booking with Firestore runTransaction
exports.bookTicket = async (req, res) => {
  const { eventId, quantity, attendeeName, attendeeEmail } = req.body;
  const userId = req.user.id;
  const qty = parseInt(quantity, 10);

  if (!eventId || !qty || qty <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid eventId and positive quantity are required'
    });
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
        throw new Error(`Insufficient tickets available. Only ${eventData.availableTickets} left.`);
      }

      // 1. Decrement available tickets atomically
      t.update(eventRef, {
        availableTickets: eventData.availableTickets - qty
      });

      // 2. Create ticket document
      const bookingRef = `TKT-${Date.now().toString().slice(-6)}`;
      const newTicket = {
        id: ticketRef.id,
        eventId,
        eventTitle: eventData.title,
        userId,
        attendeeName: attendeeName || req.user.name,
        attendeeEmail: attendeeEmail || req.user.email,
        quantity: qty,
        totalPaid: qty * eventData.ticketPrice,
        bookingRef,
        status: 'confirmed',
        bookedAt: new Date().toISOString()
      };

      t.set(ticketRef, newTicket);
      return newTicket;
    });

    res.status(201).json({
      success: true,
      message: 'Tickets booked successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// View purchased tickets for authenticated Attendee
exports.getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const ticketsSnapshot = await db.collection('tickets').get();
    const myTickets = [];

    ticketsSnapshot.forEach(doc => {
      const ticket = doc.data();
      if (ticket.userId === userId) {
        myTickets.push(ticket);
      }
    });

    res.status(200).json({
      success: true,
      count: myTickets.length,
      data: myTickets
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Cancel ticket & restore ticket inventory via transaction
exports.cancelTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const userId = req.user.id;

    const ticketRef = db.collection('tickets').doc(ticketId);

    const result = await db.runTransaction(async (t) => {
      const ticketDoc = await t.get(ticketRef);
      if (!ticketDoc.exists) {
        throw new Error('Ticket not found');
      }

      const ticketData = ticketDoc.data();
      if (ticketData.userId !== userId) {
        throw new Error('Unauthorized: You can only cancel your own tickets');
      }

      if (ticketData.status === 'cancelled') {
        throw new Error('Ticket is already cancelled');
      }

      const eventRef = db.collection('events').doc(ticketData.eventId);
      const eventDoc = await t.get(eventRef);

      if (eventDoc.exists) {
        const eventData = eventDoc.data();
        t.update(eventRef, {
          availableTickets: eventData.availableTickets + ticketData.quantity
        });
      }

      t.update(ticketRef, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      });

      return { ticketId, status: 'cancelled' };
    });

    res.status(200).json({
      success: true,
      message: 'Ticket cancelled successfully and inventory restored',
      data: result
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
