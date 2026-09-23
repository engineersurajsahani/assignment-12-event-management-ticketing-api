const { db, admin } = require('../config/firebaseConfig');

const EVENTS_COLLECTION = 'events';
const TICKETS_COLLECTION = 'tickets';
const USERS_COLLECTION = 'users';

/**
 * Book tickets for an event using an atomic Firestore transaction
 * Attendee only: POST /api/tickets/book (Rate-limited)
 */
const bookTickets = async (req, res) => {
  try {
    const { eventId, quantity, attendeeName } = req.body;

    if (!eventId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: eventId and quantity are required'
      });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: quantity must be a positive integer greater than 0'
      });
    }

    // Fetch attendee name if not supplied in body
    let finalAttendeeName = attendeeName ? attendeeName.trim() : '';
    if (!finalAttendeeName) {
      const userDoc = await db.collection(USERS_COLLECTION).doc(req.user.id).get();
      if (userDoc.exists) {
        finalAttendeeName = userDoc.data().name || 'Attendee';
      } else {
        finalAttendeeName = 'Attendee';
      }
    }

    const eventRef = db.collection(EVENTS_COLLECTION).doc(eventId);
    const ticketRef = db.collection(TICKETS_COLLECTION).doc();

    // Execute atomic transaction to prevent race conditions and overselling
    const resultTicket = await db.runTransaction(async (transaction) => {
      const eventDoc = await transaction.get(eventRef);

      if (!eventDoc.exists) {
        throw new Error('Event not found');
      }

      const eventData = eventDoc.data();

      if (eventData.availableTickets < qty) {
        throw new Error(
          `Insufficient tickets available. Only ${eventData.availableTickets} tickets remaining`
        );
      }

      const newAvailable = eventData.availableTickets - qty;

      // Decrement available tickets
      transaction.update(eventRef, {
        availableTickets: newAvailable
      });

      // Generate unique booking reference
      const timestampSuffix = Date.now().toString().slice(-6);
      const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
      const bookingRef = `TKT-${timestampSuffix}${randomSuffix}`;

      const totalPaid = (eventData.ticketPrice || 0) * qty;

      const ticketData = {
        id: ticketRef.id,
        eventId,
        eventTitle: eventData.title || '',
        userId: req.user.id,
        attendeeName: finalAttendeeName,
        attendeeEmail: req.user.email,
        quantity: qty,
        totalPaid,
        bookingRef,
        status: 'confirmed',
        bookedAt: new Date().toISOString()
      };

      // Create ticket document
      transaction.set(ticketRef, ticketData);

      return ticketData;
    });

    return res.status(201).json({
      success: true,
      message: 'Tickets booked successfully',
      data: resultTicket
    });
  } catch (error) {
    console.error('Book tickets error:', error.message);
    // Per spec: return 400 with error message on transaction failure (event not found, insufficient tickets, etc.)
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to book tickets'
    });
  }
};

/**
 * Get all tickets booked by the authenticated attendee
 * Attendee only: GET /api/tickets/my-tickets
 */
const getMyTickets = async (req, res) => {
  try {
    const snapshot = await db
      .collection(TICKETS_COLLECTION)
      .where('userId', '==', req.user.id)
      .get();

    let tickets = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by bookedAt descending
    tickets.sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt));

    return res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    console.error('Get my tickets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error fetching your tickets',
      error: error.message
    });
  }
};

/**
 * Cancel a ticket and restore event capacity atomically
 * Attendee only: POST /api/tickets/:id/cancel
 */
const cancelTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticketRef = db.collection(TICKETS_COLLECTION).doc(id);
    const ticketDoc = await ticketRef.get();

    if (!ticketDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const ticket = ticketDoc.data();

    // Enforce ownership: attendee can only cancel their own ticket
    if (ticket.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot cancel tickets belonging to another user'
      });
    }

    if (ticket.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Ticket is already cancelled'
      });
    }

    const eventRef = db.collection(EVENTS_COLLECTION).doc(ticket.eventId);

    // Atomically cancel ticket and restore available tickets in parent event
    await db.runTransaction(async (transaction) => {
      const liveTicketDoc = await transaction.get(ticketRef);
      if (!liveTicketDoc.exists) {
        throw new Error('Ticket not found');
      }
      if (liveTicketDoc.data().status === 'cancelled') {
        throw new Error('Ticket is already cancelled');
      }

      const eventDoc = await transaction.get(eventRef);

      if (eventDoc.exists) {
        const eventData = eventDoc.data();
        const updatedAvailable = (eventData.availableTickets || 0) + ticket.quantity;
        transaction.update(eventRef, {
          availableTickets: updatedAvailable
        });
      }

      transaction.update(ticketRef, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      });
    });

    const updatedTicket = {
      id: ticketDoc.id,
      ...ticket,
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      message: 'Ticket cancelled successfully and inventory restored',
      data: updatedTicket
    });
  } catch (error) {
    console.error('Cancel ticket error:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to cancel ticket'
    });
  }
};

module.exports = {
  bookTickets,
  getMyTickets,
  cancelTicket
};
