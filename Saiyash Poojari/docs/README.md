# Event Management & Ticketing API Documentation & Verification Evidence

This folder contains verification documentation, interactive Swagger UI previews, and Firestore document collection schemas for **Assignment 12**.

---

## 1. Swagger UI Interactive Documentation

The Swagger UI interactive documentation is served at `/api-docs`.

![Swagger UI Documentation](screenshots/swagger_ui.jpg)

### Endpoints Matrix
- **Authentication**:
  - `POST /api/auth/register` (Public) - Register Organizer or Attendee
  - `POST /api/auth/login` (Public) - Login & receive JWT Token
  - `GET /api/auth/profile` (Authenticated) - Retrieve user profile & role
- **Event Management**:
  - `GET /api/events` (Public) - Filter by `category` & `city`/`venue`
  - `GET /api/events/:id` (Public) - Event details & remaining tickets
  - `POST /api/events` (Organizer) - Create event
  - `PUT /api/events/:id` (Organizer) - Update event
  - `DELETE /api/events/:id` (Organizer) - Cancel/delete event
  - `GET /api/events/:id/attendees` (Organizer) - View attendee roster
- **Ticket Booking & Bot Defense**:
  - `POST /api/tickets/book` (Attendee, Rate-Limited: 10 req/min) - Atomic `runTransaction` ticket booking
  - `GET /api/tickets/my-tickets` (Attendee) - View purchased tickets
  - `POST /api/tickets/:id/cancel` (Attendee) - Cancel ticket & restore inventory via `runTransaction`

---

## 2. Firestore Document Collections

![Firestore Collections Overview](screenshots/firestore_collections.jpg)

### Collections Schema

#### `events` Collection
```json
{
  "id": "event_techconf_2026",
  "title": "Global Cloud & AI Summit 2026",
  "description": "Annual flagship backend conference",
  "category": "Technology",
  "eventDate": "2026-06-15T09:00:00Z",
  "venue": "Bandra Kurla Complex, Mumbai",
  "organizerId": "usr_organizer_01",
  "ticketPrice": 1499,
  "totalCapacity": 500,
  "availableTickets": 482,
  "createdAt": "2026-03-01T12:00:00Z"
}
```

#### `tickets` Collection
```json
{
  "id": "ticket_rec_88219",
  "eventId": "event_techconf_2026",
  "eventTitle": "Global Cloud & AI Summit 2026",
  "userId": "usr_attendee_99",
  "attendeeName": "Kunal Sharma",
  "attendeeEmail": "kunal@gmail.com",
  "quantity": 2,
  "totalPaid": 2998,
  "bookingRef": "TKT-2026-88219",
  "status": "confirmed",
  "bookedAt": "2026-03-02T16:20:00Z"
}
```

#### `users` Collection
```json
{
  "id": "usr_organizer_01",
  "name": "Tech Events Inc",
  "email": "organizer@events.com",
  "password": "$2a$10$...hash...",
  "role": "organizer",
  "createdAt": "2026-03-01T10:00:00Z"
}
```

---

## 3. High-Concurrency Transaction (ACID) Verification Output

```text
🧪 Starting Automated API Integration & Concurrency Test Suite...

1️⃣ Testing Authentication Endpoints...
  [PASS] Register Organizer: ✅ User registered successfully.
  [PASS] Register Attendee: ✅ User registered successfully.
  [PASS] Get Profile: ✅ Role: attendee

2️⃣ Testing Event Management...
  [PASS] Create Event (Capacity: 5): ✅ doc_5080bvzd40621
  [PASS] Filter Events: ✅ Found 1 matching events
  [PASS] Get Event Details: ✅ Available Tickets: 5

3️⃣ Testing High Concurrency Ticket Booking (runTransaction)...
   Launching 5 simultaneous booking requests for total capacity = 5...
  [PASS] Concurrent Bookings Executed: 5/5 succeeded.
  [PASS] Remaining Ticket Count: ✅ 0 Tickets Left

4️⃣ Testing Overbooking Protection...
  [PASS] Overbook Prevention: ✅ Rejected Message: "Insufficient tickets available"

5️⃣ Testing Rate Limiter (Scalper Protection)...
   Sending rapid requests to hit rate limit limit (10 req/min)...
  [PASS] Rate Limit Enforced (HTTP 429): ✅ Too many booking requests from this IP. Scalper bot prevention active. Please try again after 1 minute.

6️⃣ Testing Ticket Listing & Cancellation...
  [PASS] My Tickets List: ✅ Fetched 5 tickets
  [PASS] Ticket Cancelled: ✅ Ticket cancelled successfully and inventory restored
  [PASS] Inventory Restored: ✅ Restored to 1 Ticket

7️⃣ Testing Organizer Attendee Roster...
  [PASS] Organizer Attendee Roster: ✅ Found 5 attendee ticket records

8️⃣ Testing Swagger UI Endpoint...
  [PASS] Swagger UI Accessible: ✅ (HTTP 200)

🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🚀
```
