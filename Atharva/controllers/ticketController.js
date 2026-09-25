const { db } = require('../config/firebaseConfig');

exports.bookTicket = async (req, res, next) => {
  const { eventId, quantity, attendeeName, attendeeEmail } = req.body;
  const userId = req.user.id;
  const qty = parseInt(quantity, 10);

  if (!qty || qty <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid quantity' });
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

    res.status(201).json({ success: true, message: 'Tickets booked successfully', data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMyTickets = async (req, res) => {
  try {
    const ticketsSnapshot = await db.collection('tickets').where('userId', '==', req.user.id).get();
    const tickets = ticketsSnapshot.docs.map(doc => doc.data());
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelTicket = async (req, res) => {
  const ticketId = req.params.id;
  const userId = req.user.id;

  const ticketRef = db.collection('tickets').doc(ticketId);

  try {
    await db.runTransaction(async (t) => {
      const ticketDoc = await t.get(ticketRef);
      
      if (!ticketDoc.exists) {
        throw new Error('Ticket not found');
      }
      
      const ticketData = ticketDoc.data();
      
      if (ticketData.userId !== userId) {
        throw new Error('Not authorized to cancel this ticket');
      }
      
      if (ticketData.status === 'cancelled') {
        throw new Error('Ticket is already cancelled');
      }

      const eventRef = db.collection('events').doc(ticketData.eventId);
      const eventDoc = await t.get(eventRef);
      
      if (eventDoc.exists) {
        t.update(eventRef, {
          availableTickets: eventDoc.data().availableTickets + ticketData.quantity
        });
      }

      t.update(ticketRef, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      });
    });

    res.json({ success: true, message: 'Ticket cancelled successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
