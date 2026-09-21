const { getDb } = require('../config/firebaseConfig');

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket booking and management endpoints
 */

/**
 * @swagger
 * /api/tickets/book:
 *   post:
 *     summary: Book tickets (Attendee only)
 *     description: Atomic booking transaction. Rate limited to 10 requests per minute.
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - quantity
 *               - attendeeName
 *               - attendeeEmail
 *             properties:
 *               eventId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               attendeeName:
 *                 type: string
 *               attendeeEmail:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Tickets booked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Invalid input or insufficient tickets
 *       404:
 *         description: Event not found
 *       429:
 *         description: Too many requests - Rate limit exceeded
 */

exports.bookTicket = async (req, res) => {
  const { eventId, quantity, attendeeName, attendeeEmail } = req.body;
  const userId = req.user.id;
  const qty = parseInt(quantity, 10);

  if (!eventId || !quantity || !attendeeName || !attendeeEmail) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }

  if (qty < 1 || qty > 10) {
    return res.status(400).json({ success: false, message: 'Quantity must be between 1 and 10' });
  }

  try {
    const db = getDb();
    const eventRef = db.collection('events').doc(eventId);
    const ticketRef = db.collection('tickets').doc();
    const bookingRef = `TKT-${Date.now().toString().slice(-6)}`;

    const result = await db.runTransaction(async (t) => {
      const eventDoc = await t.get(eventRef);

      if (!eventDoc.exists) {
        throw new Error('Event not found');
      }

      const eventData = eventDoc.data();

      if (new Date(eventData.eventDate) <= new Date()) {
        throw new Error('Cannot book tickets for past events');
      }

      if (eventData.availableTickets < qty) {
        throw new Error(`Insufficient tickets available. Only ${eventData.availableTickets} tickets left`);
      }

      t.update(eventRef, {
        availableTickets: eventData.availableTickets - qty
      });

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
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/tickets/my-tickets:
 *   get:
 *     summary: Get user's booked tickets (Attendee only)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ticket'
 */

exports.getMyTickets = async (req, res) => {
  try {
    const db = getDb();
    const ticketsSnapshot = await db.collection('tickets')
      .where('userId', '==', req.user.id)
      .orderBy('bookedAt', 'desc')
      .get();

    const tickets = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/tickets/{id}/cancel:
 *   post:
 *     summary: Cancel a ticket and restore inventory (Attendee only)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Ticket already cancelled
 *       403:
 *         description: Forbidden - Not ticket owner
 *       404:
 *         description: Ticket not found
 */

exports.cancelTicket = async (req, res) => {
  try {
    const db = getDb();
    const ticketRef = db.collection('tickets').doc(req.params.id);
    const eventRef = db.collection('events');

    const result = await db.runTransaction(async (t) => {
      const ticketDoc = await t.get(ticketRef);

      if (!ticketDoc.exists) {
        throw new Error('Ticket not found');
      }

      const ticketData = ticketDoc.data();

      if (ticketData.userId !== req.user.id) {
        throw new Error('Forbidden: You do not own this ticket');
      }

      if (ticketData.status === 'cancelled') {
        throw new Error('Ticket is already cancelled');
      }

      const eventDoc = await t.get(eventRef.doc(ticketData.eventId));

      if (eventDoc.exists) {
        const eventData = eventDoc.data();
        t.update(eventRef.doc(ticketData.eventId), {
          availableTickets: eventData.availableTickets + ticketData.quantity
        });
      }

      t.update(ticketRef, {
        status: 'cancelled'
      });

      return { ...ticketData, status: 'cancelled' };
    });

    res.status(200).json({ success: true, message: 'Ticket cancelled and inventory restored', data: result });
  } catch (error) {
    let statusCode = 400;
    if (error.message.includes('not found')) statusCode = 404;
    if (error.message.includes('Forbidden')) statusCode = 403;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};
