# 🎟️ Event Management & Ticketing API

A high-concurrency Event Ticketing & Live Booking REST API backed by **Google Firebase Firestore**, secured with **JWT Role-Based Access Control** (`Organizer` vs `Attendee`), hardened with **API rate limiting** to prevent ticket-scalping bots, and documented with **Swagger / OpenAPI 3.0**.

## Features

- Firestore ACID transactions (`runTransaction`) so tickets are never oversold under concurrent booking traffic
- JWT auth with `Organizer` / `Attendee` role-based access control
- Strict rate limiting (default 10 requests/min per user) on the booking endpoint
- Interactive Swagger UI at `/api-docs`
- Clean layered architecture: `routes/` → `controllers/` → Firestore

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

You need a **Firebase project** with Firestore enabled, and a service account:

1. Go to Firebase Console → Project Settings → Service Accounts.
2. Click "Generate new private key" and save the file as `serviceAccountKey.json` in the project root (already gitignored), **or**
3. Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` directly in `.env` (useful when deploying to a host without file uploads).

### 3. Run the server

```bash
npm run dev     # with nodemon (auto-restart)
# or
npm start
```

The API will be available at `http://localhost:5000`, and Swagger docs at `http://localhost:5000/api-docs`.

## API Overview

### Authentication
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register as `Attendee` or `Organizer` |
| POST | `/api/auth/login` | Public | Authenticate and obtain a JWT |
| GET | `/api/auth/profile` | Authenticated | Get profile & role |

### Events
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/events` | Public | Browse upcoming events (`?category=&city=`) |
| GET | `/api/events/:id` | Public | Event details + live ticket count |
| POST | `/api/events` | Organizer | Create event |
| PUT | `/api/events/:id` | Organizer (owner) | Update event |
| DELETE | `/api/events/:id` | Organizer (owner) | Cancel/delete event |
| GET | `/api/events/:id/attendees` | Organizer (owner) | List attendees |

### Tickets
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/tickets/book` | Attendee | Atomic booking, rate limited (10/min) |
| GET | `/api/tickets/my-tickets` | Attendee | View own tickets |
| POST | `/api/tickets/:id/cancel` | Attendee (owner) | Cancel ticket & restore inventory |

## Testing Concurrency & Rate Limiting

1. Visit `http://localhost:5000/api-docs`.
2. Register an Organizer, create an event with `totalCapacity: 5`.
3. Register/login as an Attendee and fire several concurrent `POST /api/tickets/book` calls — `availableTickets` will never go below 0 thanks to the Firestore transaction.
4. Send more than 10 booking requests within 60 seconds to confirm you get a `429 Too Many Requests` response.

## Project Structure

```
event-management-ticketing-api/
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
├── docs/               # place Swagger UI / Firestore screenshots here
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## License

MIT
