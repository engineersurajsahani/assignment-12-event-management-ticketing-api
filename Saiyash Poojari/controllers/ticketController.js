const { db } = require('../config/firebaseConfig');

/**
 * @desc Atomic Booking: 10 requests / min limit. Decrements tickets via transaction
 * @route POST /api/tickets/book
 */
exports.bookTicket = async (req, res, next) => {
  const { eventId, quantity, attendeeName, attendeeEmail } = req.body;
  const userId = req.user ? req.user.id : null;
  const qty = parseInt(quantity, 10);

  if (!eventId || isNaN(qty) || qty <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid eventId and a positive ticket quantity.'
    });
  }

  const name = attendeeName || (req.user ? req.user.name : 'Attendee');
  const email = attendeeEmail || (req.user ? req.user.email : 'attendee@example.com');

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

      // 1. Decrement available tickets
      t.update(eventRef, {
        availableTickets: eventData.availableTickets - qty
      });

      // 2. Create ticket document
      const randomRefNum = Math.floor(10000 + Math.random() * 90000);
      const bookingRef = `TKT-2026-${randomRefNum}`;
      const newTicket = {
        id: ticketRef.id,
        eventId,
        eventTitle: eventData.title,
        userId,
        attendeeName: name,
        attendeeEmail: email,
        quantity: qty,
        totalPaid: qty * (eventData.ticketPrice || 0),
        bookingRef,
        status: 'confirmed',
        bookedAt: new Date().toISOString()
      };

      t.set(ticketRef, newTicket);
      return newTicket;
    });

    return res.status(201).json({
      success: true,
      message: 'Tickets booked successfully',
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc View purchased tickets for authenticated Attendee
 * @route GET /api/tickets/my-tickets
 */
exports.getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const ticketsSnapshot = await db.collection('tickets').where('userId', '==', userId).get();

    const tickets = ticketsSnapshot.docs ? ticketsSnapshot.docs.map((doc) => doc.data()) : [];

    return res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    console.error('Get my tickets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving tickets.',
      error: error.message
    });
  }
};

/**
 * @desc Cancel ticket & restore ticket inventory via transaction
 * @route POST /api/tickets/:id/cancel
 */
exports.cancelTicket = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const ticketRef = db.collection('tickets').doc(id);

  try {
    const result = await db.runTransaction(async (t) => {
      const ticketDoc = await t.get(ticketRef);
      if (!ticketDoc.exists) {
        throw new Error('Ticket not found');
      }

      const ticketData = ticketDoc.data();

      if (ticketData.userId !== userId) {
        throw new Error('Unauthorized. You do not own this ticket.');
      }

      if (ticketData.status === 'cancelled') {
        throw new Error('Ticket is already cancelled.');
      }

      const eventRef = db.collection('events').doc(ticketData.eventId);
      const eventDoc = await t.get(eventRef);

      if (eventDoc.exists) {
        const eventData = eventDoc.data();
        // Restore ticket inventory
        t.update(eventRef, {
          availableTickets: eventData.availableTickets + ticketData.quantity
        });
      }

      // Mark ticket as cancelled
      t.update(ticketRef, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      });

      return {
        ...ticketData,
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Ticket cancelled successfully and inventory restored',
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
