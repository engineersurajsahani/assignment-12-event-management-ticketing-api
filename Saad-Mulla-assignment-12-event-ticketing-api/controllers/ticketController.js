const { db } = require('../config/firebaseConfig');

// Atomic Ticket Booking with Firestore Transaction
const bookTicket = async (req, res) => {
  const { eventId, quantity, attendeeName, attendeeEmail } = req.body;
  const userId = req.user.id;
  const qty = parseInt(quantity, 10);

  if (!eventId || !qty || qty <= 0 || !attendeeName || !attendeeEmail) {
    return res.status(400).json({ success: false, message: 'eventId, valid quantity, attendeeName, and attendeeEmail are required.' });
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

      // 1. Decrement available tickets
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

const getMyTickets = async (req, res) => {
  try {
    const snapshot = await db.collection('tickets').where('userId', '==', req.user.id).get();
    const tickets = snapshot.docs.map(doc => doc.data());
    return res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel Ticket and Restore Inventory Transaction
const cancelTicket = async (req, res) => {
  const ticketId = req.params.id;
  const ticketRef = db.collection('tickets').doc(ticketId);

  try {
    await db.runTransaction(async (t) => {
      const ticketDoc = await t.get(ticketRef);
      if (!ticketDoc.exists) {
        throw new Error('Ticket not found');
      }

      const ticketData = ticketDoc.data();
      if (ticketData.userId !== req.user.id) {
        throw new Error('You are not authorized to cancel this ticket');
      }

      if (ticketData.status === 'cancelled') {
        throw new Error('Ticket is already cancelled');
      }

      const eventRef = db.collection('events').doc(ticketData.eventId);
      const eventDoc = await t.get(eventRef);

      // Restore inventory if event exists
      if (eventDoc.exists) {
        const eventData = eventDoc.data();
        t.update(eventRef, {
          availableTickets: eventData.availableTickets + ticketData.quantity
        });
      }

      // Mark ticket as cancelled
      t.update(ticketRef, { status: 'cancelled' });
    });

    return res.status(200).json({ success: true, message: 'Ticket cancelled successfully and inventory restored.' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getEventAttendees = async (req, res) => {
  try {
    const eventId = req.params.id;
    const eventDoc = await db.collection('events').doc(eventId).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (eventDoc.data().organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view attendees for this event.' });
    }

    const snapshot = await db.collection('tickets')
      .where('eventId', '==', eventId)
      .where('status', '==', 'confirmed')
      .get();

    const attendees = snapshot.docs.map(doc => doc.data());
    return res.status(200).json({ success: true, count: attendees.length, data: attendees });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { bookTicket, getMyTickets, cancelTicket, getEventAttendees };