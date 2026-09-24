const { db } = require("../config/firebaseConfig");

// Book tickets atomically using Firestore runTransaction (Attendee only)
exports.bookTicket = async (req, res) => {
  const { eventId, quantity, attendeeName, attendeeEmail } = req.body;
  const userId = req.user.id;
  const qty = parseInt(quantity, 10);

  if (!eventId || !qty || qty <= 0) {
    return res.status(400).json({
      success: false,
      message: "Valid eventId and positive quantity are required"
    });
  }

  const name = attendeeName || req.user.name;
  const email = attendeeEmail || req.user.email;

  const eventRef = db.collection("events").doc(eventId);
  const ticketRef = db.collection("tickets").doc();

  try {
    const result = await db.runTransaction(async (t) => {
      const eventDoc = await t.get(eventRef);

      if (!eventDoc.exists) {
        throw new Error("Event not found");
      }

      const eventData = eventDoc.data();

      if (eventData.availableTickets < qty) {
        throw new Error("Insufficient tickets available");
      }

      // 1. Decrement available tickets in event
      t.update(eventRef, {
        availableTickets: eventData.availableTickets - qty
      });

      // 2. Create ticket document
      const bookingRef = `TKT-${Date.now().toString().slice(-6)}`;
      const newTicket = {
        id: ticketRef.id,
        eventId: eventId,
        eventTitle: eventData.title,
        userId: userId,
        attendeeName: name,
        attendeeEmail: email,
        quantity: qty,
        totalPaid: qty * (eventData.ticketPrice || 0),
        bookingRef: bookingRef,
        status: "confirmed",
        bookedAt: new Date().toISOString()
      };

      t.set(ticketRef, newTicket);
      return newTicket;
    });

    res.status(201).json({
      success: true,
      message: "Tickets booked successfully",
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all tickets purchased by the logged-in attendee
exports.getMyTickets = async (req, res) => {
  try {
    const snapshot = await db
      .collection("tickets")
      .where("userId", "==", req.user.id)
      .get();

    const tickets = [];
    snapshot.forEach((doc) => {
      tickets.push(doc.data());
    });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Cancel ticket and restore event capacity atomically
exports.cancelTicket = async (req, res) => {
  const { id } = req.params;
  const ticketRef = db.collection("tickets").doc(id);

  try {
    await db.runTransaction(async (t) => {
      const ticketDoc = await t.get(ticketRef);

      if (!ticketDoc.exists) {
        throw new Error("Ticket not found");
      }

      const ticketData = ticketDoc.data();

      if (ticketData.userId !== req.user.id) {
        throw new Error("Forbidden: You cannot cancel another user's ticket");
      }

      if (ticketData.status === "cancelled") {
        throw new Error("Ticket is already cancelled");
      }

      const eventRef = db.collection("events").doc(ticketData.eventId);
      const eventDoc = await t.get(eventRef);

      // 1. Mark ticket as cancelled
      t.update(ticketRef, {
        status: "cancelled",
        cancelledAt: new Date().toISOString()
      });

      // 2. Restore available tickets in event if event still exists
      if (eventDoc.exists) {
        const eventData = eventDoc.data();
        t.update(eventRef, {
          availableTickets: (eventData.availableTickets || 0) + ticketData.quantity
        });
      }
    });

    res.status(200).json({
      success: true,
      message: "Ticket cancelled successfully and capacity restored"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
