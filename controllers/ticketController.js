const { db } = require("../config/firebaseConfig");

const bookTicket = async (req, res) => {
  try {
    const { eventId, quantity } = req.body;

    if (!eventId || !quantity) {
      return res.status(400).json({
        message: "Event ID and quantity are required"
      });
    }

    const ticketQuantity = Number(quantity);

    if (ticketQuantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than 0"
      });
    }

    const eventRef = db.collection("events").doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    const event = eventDoc.data();

    if (event.availableTickets < ticketQuantity) {
      return res.status(400).json({
        message: "Not enough tickets available"
      });
    }

    const totalAmount = event.ticketPrice * ticketQuantity;

    await eventRef.update({
      availableTickets: event.availableTickets - ticketQuantity
    });

    const ticket = {
      eventId,
      userId: req.user.userId,
      quantity: ticketQuantity,
      totalAmount,
      status: "confirmed",
      bookedAt: new Date()
    };

    const ticketRef = await db.collection("tickets").add(ticket);

    res.status(201).json({
      message: "Ticket booked successfully",
      ticketId: ticketRef.id,
      ticket
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to book ticket"
    });
  }
};

const getMyTickets = async (req, res) => {
  try {
    const snapshot = await db
      .collection("tickets")
      .where("userId", "==", req.user.userId)
      .get();

    const tickets = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(tickets);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch tickets"
    });
  }
};

const cancelTicket = async (req, res) => {
  try {
    const ticketRef = db.collection("tickets").doc(req.params.id);
    const ticketDoc = await ticketRef.get();

    if (!ticketDoc.exists) {
      return res.status(404).json({
        message: "Ticket not found"
      });
    }

    const ticket = ticketDoc.data();

    if (ticket.userId !== req.user.userId) {
      return res.status(403).json({
        message: "You can only cancel your own ticket"
      });
    }

    if (ticket.status === "cancelled") {
      return res.status(400).json({
        message: "Ticket is already cancelled"
      });
    }

    const eventRef = db.collection("events").doc(ticket.eventId);
    const eventDoc = await eventRef.get();

    if (eventDoc.exists) {
      const event = eventDoc.data();

      await eventRef.update({
        availableTickets:
          event.availableTickets + ticket.quantity
      });
    }

    await ticketRef.update({
      status: "cancelled",
      cancelledAt: new Date()
    });

    res.json({
      message: "Ticket cancelled successfully"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to cancel ticket"
    });
  }
};

module.exports = {
  bookTicket,
  getMyTickets,
  cancelTicket
};