const { db } = require('../config/firebaseConfig');

// @desc    Book ticket atomically using Firestore ACID runTransaction (Rate limited)
// @route   POST /api/tickets/book
// @access  Private (Attendee Only)
exports.bookTicket = async (req, res, next) => {
  try {
    const { eventId, quantity, attendeeName, attendeeEmail } = req.body;
    const userId = req.user.id;

    if (!eventId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide eventId and quantity'
      });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer >= 1'
      });
    }

    const eventRef = db.collection('events').doc(eventId);
    const ticketRef = db.collection('tickets').doc();

    // Firestore ACID transaction for concurrency ticket booking
    const result = await db.runTransaction(async (t) => {
      const eventDoc = await t.get(eventRef);

      if (!eventDoc.exists) {
        throw new Error(`Event not found with ID ${eventId}`);
      }

      const eventData = eventDoc.data();

      // Check remaining ticket availability
      if (eventData.availableTickets < qty) {
        throw new Error(`Insufficient tickets available. Requested: ${qty}, Remaining: ${eventData.availableTickets}`);
      }

      // 1. Decrement available ticket count atomically
      t.update(eventRef, {
        availableTickets: eventData.availableTickets - qty
      });

      // 2. Generate unique booking reference & create ticket document
      const bookingRef = `TKT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
      const newTicket = {
        id: ticketRef.id,
        eventId,
        eventTitle: eventData.title,
        userId,
        attendeeName: attendeeName || req.user.name || 'Attendee',
        attendeeEmail: attendeeEmail || req.user.email,
        quantity: qty,
        unitPrice: eventData.ticketPrice,
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
      message: 'Tickets booked successfully via atomic transaction',
      data: result
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get tickets purchased by authenticated attendee
// @route   GET /api/tickets/my-tickets
// @access  Private (Attendee Only)
exports.getMyTickets = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const ticketsSnapshot = await db.collection('tickets').where('userId', '==', userId).get();

    const tickets = [];
    ticketsSnapshot.docs.forEach(doc => {
      tickets.push(doc.data());
    });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel ticket and restore inventory atomically via runTransaction
// @route   POST /api/tickets/:id/cancel
// @access  Private (Attendee Only)
exports.cancelTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const ticketRef = db.collection('tickets').doc(id);

    const result = await db.runTransaction(async (t) => {
      const ticketDoc = await t.get(ticketRef);

      if (!ticketDoc.exists) {
        throw new Error(`Ticket with ID ${id} not found`);
      }

      const ticketData = ticketDoc.data();

      if (ticketData.userId !== userId) {
        throw new Error('Forbidden: You can only cancel your own tickets');
      }

      if (ticketData.status === 'cancelled') {
        throw new Error('Ticket is already cancelled');
      }

      // Restore ticket quantity in event document
      const eventRef = db.collection('events').doc(ticketData.eventId);
      const eventDoc = await t.get(eventRef);

      if (eventDoc.exists) {
        const eventData = eventDoc.data();
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
        status: 'cancelled'
      };
    });

    res.status(200).json({
      success: true,
      message: 'Ticket successfully cancelled and inventory restored',
      data: result
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
