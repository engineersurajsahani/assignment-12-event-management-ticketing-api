const r = require("express").Router();
const c = require("../controllers/ticketController");
const auth = require("../middleware/auth");
const role = require("../middleware/checkRole");
const { bookingRateLimiter } = require("../middleware/rateLimiter");

r.post(
    "/book",
    auth,
    role("attendee"),
    bookingRateLimiter,
    c.bookTicket
);

r.get(
    "/my-tickets",
    auth,
    role("attendee"),
    c.getMyTickets
);

r.post(
    "/:id/cancel",
    auth,
    role("attendee"),
    c.cancelTicket
);

module.exports = r;
