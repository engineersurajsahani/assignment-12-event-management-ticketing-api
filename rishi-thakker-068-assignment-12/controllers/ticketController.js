const { db } = require("../config/firebaseConfig");

const eventsCollection = db.collection("events");
const ticketsCollection = db.collection("tickets");

exports.bookTicket = async (req, res) => {
  const { eventId, quantity, attendeeName, attendeeEmail } = req.body;
  const userId = req.user.id;
  const qty = parseInt(quantity, 10);

  if (!eventId || !qty || qty < 1 || !attendeeName || !attendeeEmail) {
    return res.status(400).json({ message: "eventId, quantity, attendeeName and attendeeEmail are required" });
  }

  const eventRef = eventsCollection.doc(eventId);
  const ticketRef = ticketsCollection.doc();

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

      // Decrement available tickets atomically within the transaction so
      // concurrent bookings can never push availableTickets below 0.
      t.update(eventRef, {
        availableTickets: eventData.availableTickets - qty,
      });

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
        status: "confirmed",
        bookedAt: new Date().toISOString(),
      };

      t.set(ticketRef, newTicket);
      return newTicket;
    });

    res.status(201).json({ message: "Tickets booked successfully", data: result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.myTickets = async (req, res) => {
  try {
    const snapshot = await ticketsCollection.where("userId", "==", req.user.id).get();
    const tickets = snapshot.docs.map((doc) => doc.data());
    res.status(200).json(tickets);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.cancelTicket = async (req, res) => {
  const ticketRef = ticketsCollection.doc(req.params.id);

  try {
    const result = await db.runTransaction(async (t) => {
      const ticketDoc = await t.get(ticketRef);
      if (!ticketDoc.exists) {
        throw new Error("Ticket not found");
      }

      const ticket = ticketDoc.data();
      if (ticket.userId !== req.user.id) {
        throw new Error("This ticket does not belong to you");
      }
      if (ticket.status === "cancelled") {
        throw new Error("Ticket is already cancelled");
      }

      const eventRef = eventsCollection.doc(ticket.eventId);
      const eventDoc = await t.get(eventRef);
      if (eventDoc.exists) {
        t.update(eventRef, {
          availableTickets: eventDoc.data().availableTickets + ticket.quantity,
        });
      }

      t.update(ticketRef, { status: "cancelled" });
      return { ...ticket, status: "cancelled" };
    });

    res.status(200).json({ message: "Ticket cancelled successfully", data: result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
