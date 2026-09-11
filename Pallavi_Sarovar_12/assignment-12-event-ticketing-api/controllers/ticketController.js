const { db } = require('../config/firebaseConfig');

exports.bookTicket = async (req, res, next) => {
  try {
    const { eventId, quantity, attendeeName, attendeeEmail } = req.body;
    const qty = Number.parseInt(quantity, 10);

    if (!eventId || !Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ success: false, message: 'eventId and a positive integer quantity are required.' });
    }
    if (!attendeeName || !attendeeEmail) {
      return res.status(400).json({ success: false, message: 'attendeeName and attendeeEmail are required.' });
    }

    const eventRef = db.collection('events').doc(eventId);
    const ticketRef = db.collection('tickets').doc();

    const result = await db.runTransaction(async (t) => {
      const eventDoc = await t.get(eventRef);

      if (!eventDoc.exists) throw new Error('Event not found.');

      const eventData = eventDoc.data();

      if (new Date(eventData.eventDate) <= new Date()) {
        throw new Error('This event has already started or completed.');
      }

      if (eventData.availableTickets < qty) {
        throw new Error('Insufficient tickets available.');
      }

      const bookingRef = `TKT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

      const newTicket = {
        id: ticketRef.id,
        eventId,
        eventTitle: eventData.title,
        userId: req.user.id,
        attendeeName: String(attendeeName).trim(),
        attendeeEmail: String(attendeeEmail).trim().toLowerCase(),
        quantity: qty,
        totalPaid: qty * Number(eventData.ticketPrice),
        bookingRef,
        status: 'confirmed',
        bookedAt: new Date().toISOString()
      };

      t.update(eventRef, {
        availableTickets: eventData.availableTickets - qty
      });

      t.set(ticketRef, newTicket);
      return newTicket;
    });

    res.status(201).json({
      success: true,
      message: 'Tickets booked successfully.',
      data: result
    });
  } catch (error) {
    if (error.message === 'Event not found.' || error.message.includes('Insufficient') || error.message.includes('already started')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

exports.myTickets = async (req, res, next) => {
  try {
    const snapshot = await db.collection('tickets')
      .where('userId', '==', req.user.id)
      .orderBy('bookedAt', 'desc')
      .get();

    res.json({
      success: true,
      count: snapshot.size,
      data: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelTicket = async (req, res, next) => {
  try {
    const ticketRef = db.collection('tickets').doc(req.params.id);
    const ticketDoc = await ticketRef.get();

    if (!ticketDoc.exists) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    const ticket = ticketDoc.data();

    if (ticket.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only cancel your own ticket.' });
    }
    if (ticket.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Ticket is already cancelled.' });
    }

    const eventRef = db.collection('events').doc(ticket.eventId);

    await db.runTransaction(async (t) => {
      const [freshTicketDoc, eventDoc] = await Promise.all([
        t.get(ticketRef),
        t.get(eventRef)
      ]);

      if (!freshTicketDoc.exists) throw new Error('Ticket not found.');
      if (!eventDoc.exists) throw new Error('Event not found.');

      const freshTicket = freshTicketDoc.data();
      if (freshTicket.status === 'cancelled') throw new Error('Ticket is already cancelled.');

      t.update(ticketRef, { status: 'cancelled', cancelledAt: new Date().toISOString() });
      t.update(eventRef, {
        availableTickets: eventDoc.data().availableTickets + freshTicket.quantity
      });
    });

    res.json({ success: true, message: 'Ticket cancelled and inventory restored.' });
  } catch (error) {
    if (['Ticket not found.', 'Event not found.', 'Ticket is already cancelled.'].includes(error.message)) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};