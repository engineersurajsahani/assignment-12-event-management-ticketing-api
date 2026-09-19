const { db } = require('../config/firebaseConfig');

const bookTicket = async (req, res, next) => {
  const { eventId, quantity, attendeeName, attendeeEmail } = req.body;
  const userId = req.user.id;
  const qty = parseInt(quantity, 10);

  if (!eventId || isNaN(qty) || qty <= 0 || !attendeeName || !attendeeEmail) {
    return res.status(400).json({ success: false, message: 'All booking fields are required with valid quantity' });
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
        attendeeName: attendeeName.trim(),
        attendeeEmail: attendeeEmail.trim().toLowerCase(),
        quantity: qty,
        totalPaid: qty * eventData.ticketPrice,
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
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

const getMyTickets = async (req, res, next) => {
  try {
    const ticketsSnapshot = await db.collection('tickets').where('userId', '==', req.user.id).get();
    const tickets = ticketsSnapshot.docs.map((d) => d.data());

    return res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (err) {
    next(err);
  }
};

const cancelTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticketRef = db.collection('tickets').doc(id);
    const doc = await ticketRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const ticketData = doc.data();
    if (ticketData.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only cancel your own tickets' });
    }

    if (ticketData.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Ticket is already cancelled' });
    }

    const eventRef = db.collection('events').doc(ticketData.eventId);
    const eventDoc = await eventRef.get();
    if (eventDoc.exists) {
      const eventData = eventDoc.data();
      await eventRef.update({
        availableTickets: eventData.availableTickets + ticketData.quantity
      });
    }

    const updatedTicket = await ticketRef.update({ status: 'cancelled' });

    return res.status(200).json({
      success: true,
      message: 'Ticket cancelled successfully',
      data: updatedTicket
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  bookTicket,
  getMyTickets,
  cancelTicket
};
