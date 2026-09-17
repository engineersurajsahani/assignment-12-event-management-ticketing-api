const { db } = require("../config/firebaseConfig");

const bookTicket = async (req, res) => {
  try {
    const {
      eventId,
      quantity,
      attendeeName,
      attendeeEmail
    } = req.body;

    const qty = Number.parseInt(quantity, 10);

    if (!eventId || !Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "eventId and a positive integer quantity are required"
      });
    }

    const eventRef = db.collection("events").doc(eventId);
    const ticketRef = db.collection("tickets").doc();

    const ticket = await db.runTransaction(async (transaction) => {
      const eventDoc = await transaction.get(eventRef);

      if (!eventDoc.exists) {
        throw new Error("Event not found");
      }

      const event = eventDoc.data();

      if (event.availableTickets < qty) {
        throw new Error("Insufficient tickets available");
      }

      const newTicket = {
        id: ticketRef.id,
        eventId,
        eventTitle: event.title,
        userId: req.user.id,
        attendeeName: attendeeName || req.user.name,
        attendeeEmail: attendeeEmail || req.user.email,
        quantity: qty,
        totalPaid: qty * Number(event.ticketPrice),
        bookingRef: `TKT-${Date.now().toString().slice(-6)}`,
        status: "confirmed",
        bookedAt: new Date().toISOString()
      };

      transaction.update(eventRef, {
        availableTickets: event.availableTickets - qty
      });

      transaction.set(ticketRef, newTicket);

      return newTicket;
    });

    return res.status(201).json({
      success: true,
      message: "Tickets booked successfully",
      data: ticket
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getMyTickets = async (req, res, next) => {
  try {
    const snapshot = await db
      .collection("tickets")
      .where("userId", "==", req.user.id)
      .get();

    const tickets = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};

const cancelTicket = async (req, res) => {
  try {
    const ticketRef = db.collection("tickets").doc(req.params.id);

    const cancelledTicket = await db.runTransaction(async (transaction) => {
      const ticketDoc = await transaction.get(ticketRef);

      if (!ticketDoc.exists) {
        throw new Error("Ticket not found");
      }

      const ticket = ticketDoc.data();

      if (ticket.userId !== req.user.id) {
        throw new Error("You can only cancel your own ticket");
      }

      if (ticket.status === "cancelled") {
        throw new Error("Ticket is already cancelled");
      }

      const eventRef = db.collection("events").doc(ticket.eventId);
      const eventDoc = await transaction.get(eventRef);

      if (!eventDoc.exists) {
        throw new Error("Event not found");
      }

      const event = eventDoc.data();

      transaction.update(eventRef, {
        availableTickets: event.availableTickets + ticket.quantity
      });

      transaction.update(ticketRef, {
        status: "cancelled",
        cancelledAt: new Date().toISOString()
      });

      return {
        ...ticket,
        status: "cancelled"
      };
    });

    return res.json({
      success: true,
      message: "Ticket cancelled and inventory restored",
      data: cancelledTicket
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  bookTicket,
  getMyTickets,
  cancelTicket
};