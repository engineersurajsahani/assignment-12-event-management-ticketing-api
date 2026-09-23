# Assignment 12 - Event Management & Ticketing API

A high-concurrency event ticketing REST API using Node.js, Express.js, Firebase Firestore, JWT role-based access control, rate limiting and Swagger/OpenAPI 3.0.

Live link: https://event-ticketing-api-w2vs.onrender.com


## Features
- Attendee and Organizer registration/login
- JWT authentication and role-based authorization
- Organizer-only event CRUD
- Attendee-only ticket booking and cancellation
- Firestore `runTransaction()` for atomic inventory updates
- Transactional ticket cancellation with inventory restoration
- Booking rate limit: 10 requests per minute
- Upcoming event filtering by category and city
- Swagger interactive documentation
- Firestore persistence

## Project Structure
```text
assignment-12-event-ticketing-api/
├── config/
│   ├── firebaseConfig.js
│   └── swagger.js
├── controllers/
│   ├── authController.js
│   ├── eventController.js
│   └── ticketController.js
├── middleware/
│   ├── auth.js
│   ├── checkRole.js
│   └── rateLimiter.js
├── routes/
│   ├── authRoutes.js
│   ├── eventRoutes.js
│   └── ticketRoutes.js
├── docs/
├── serviceAccountKey.example.json
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## Firebase Setup
1. Create a Firebase project and enable Firestore.
2. Open Project settings → Service accounts.
3. Generate a Firebase Admin SDK private key.
4. Save the downloaded key locally as `serviceAccountKey.json` (never commit it).
5. Alternatively configure `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` in `.env`.

## Installation
```bash
npm install
cp .env.example .env
```
Set a strong `JWT_SECRET` and Firebase credentials.

## Run
```bash
npm run dev
```
or
```bash
npm start
```

API: `http://localhost:5000`

Swagger: `http://localhost:5000/api-docs`

## Authentication
Register:
```json
{
  "name":"Kunal Sharma",
  "email":"kunal@gmail.com",
  "password":"password123",
  "role":"attendee"
}
```
Organizer uses `"role":"organizer"`.

Login returns a JWT. Send it as:
```text
Authorization: Bearer YOUR_TOKEN
```

## Endpoints
### Authentication
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/profile`

### Events
- GET `/api/events`
- GET `/api/events/:id`
- POST `/api/events` — Organizer
- PUT `/api/events/:id` — Organizer/owner
- DELETE `/api/events/:id` — Organizer/owner
- GET `/api/events/:id/attendees` — Organizer/owner

### Tickets
- POST `/api/tickets/book` — Attendee, rate limited
- GET `/api/tickets/my-tickets` — Attendee
- POST `/api/tickets/:id/cancel` — Attendee

### Documentation
- GET `/api-docs`

## Atomic Booking
Booking uses Firestore `runTransaction()`. The event is read, available inventory is checked, the inventory is decremented, and the ticket document is created in one transaction. Firestore retries conflicting transactions, preventing concurrent bookings from committing an oversold inventory state.

## Rate Limiting
`POST /api/tickets/book` allows **10 requests per 60 seconds**. Excess requests receive HTTP `429 Too Many Requests`.

## Firestore Collections
### users
Stores user profile, hashed password and role.

### events
Stores title, description, category, event date, venue, city, organizer ID, ticket price, total capacity and available tickets.

### tickets
Stores event ID, attendee information, quantity, payment total, booking reference, status and booking timestamp.

## Testing Checklist
- [ ] Register Organizer
- [ ] Register Attendee
- [ ] Login and copy JWT
- [ ] Open Swagger at `/api-docs`
- [ ] Create an event with `totalCapacity: 5`
- [ ] Book tickets as attendee
- [ ] Verify `availableTickets` decreases
- [ ] Run concurrent booking attempts and verify inventory never becomes negative
- [ ] Send more than 10 booking requests in 60 seconds and verify `429`
- [ ] Cancel a ticket and verify inventory is restored
- [ ] Verify organizer/attendee role restrictions
- [ ] Verify Firestore `users`, `events` and `tickets` records

## Submission
Suggested repository:
`itm-assignment-12-event-ticketing-api`

Place screenshots of Swagger UI and Firestore records in `/docs`.
