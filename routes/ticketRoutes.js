const express = require("express");

const {
  bookTicket,
  getMyTickets,
  cancelTicket
} = require("../controllers/ticketController");

const authenticate = require("../middleware/auth");

const router = express.Router();

router.post("/book", authenticate, bookTicket);

router.get("/my-tickets", authenticate, getMyTickets);

router.delete("/:id", authenticate, cancelTicket);

module.exports = router;