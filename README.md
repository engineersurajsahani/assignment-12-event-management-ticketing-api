# 🎟️ Assignment 12: Event Management & Ticketing API with Firebase & Swagger

**Name:** Rishi Thakker
**Roll No:** 150096725068
**Cohort:** Sam Altman
**Deployed Link:** https://assignment-12-event-management-ticketing-a0o8.onrender.com/

Backend for an Event Ticketing & Live Booking system built with **Node.js, Express, Firebase Firestore, JWT Role-Based Access Control (Organizer/Attendee), express-rate-limit, and Swagger/OpenAPI**. Uses Firestore's `runTransaction` so ticket bookings can never oversell an event, even under concurrent requests.

## Features
- JWT authentication with `Organizer` / `Attendee` roles baked into the token
- Firestore ACID transactions on booking and cancellation — `availableTickets` never goes negative
- Rate-limited booking route (10 requests/min per IP) to block scalper bots
- Organizer-owns-event checks on update/delete/attendees routes
- Full interactive Swagger UI at `/api-docs`

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register. Body: `name, email, password, role` |
| POST | `/api/auth/login` | Public | Login, returns a JWT `token` |
| GET | `/api/auth/profile` | Token | Get current user's profile & role |

### Events
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/events` | Public | Browse events. Query: `?category=&city=` |
| GET | `/api/events/:id` | Public | Event details + live `availableTickets` |
| POST | `/api/events` | Organizer | Create an event |
| PUT | `/api/events/:id` | Organizer (owner) | Update event details |
| DELETE | `/api/events/:id` | Organizer (owner) | Delete an event |
| GET | `/api/events/:id/attendees` | Organizer (owner) | List confirmed attendees |

### Tickets
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/tickets/book` | Attendee, **rate limited 10/min** | Atomic booking via Firestore transaction |
| GET | `/api/tickets/my-tickets` | Attendee | View own tickets |
| POST | `/api/tickets/:id/cancel` | Attendee (owner) | Cancel a ticket, restores inventory |

### Docs
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api-docs` | Interactive Swagger UI |

## Testing Checklist (from assignment spec)
1. Start the server and open `http://localhost:5000/api-docs`.
2. Register an Organizer, create an event with `totalCapacity: 5`.
3. Register an Attendee, log in, book tickets repeatedly across a couple of tabs/requests — confirm `availableTickets` never drops below 0.
4. Send more than 10 booking requests within 60 seconds → expect `429 Too Many Requests`.
5. Cancel a ticket → confirm `availableTickets` goes back up by that ticket's `quantity`.

## Folder Structure
```text
rishi-thakker-068-assignment-12/
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
├── serviceAccountKey.json   # you add this — gitignored, never commit
├── .gitignore
├── package.json
├── server.js
└── README.md
```
