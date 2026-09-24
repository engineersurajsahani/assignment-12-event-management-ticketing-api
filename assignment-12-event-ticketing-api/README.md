# 🎟️ Assignment 12 — Event Management & Ticketing API

High-concurrency **Event Ticketing & Live Booking REST API** backed by **Google Firebase Firestore**, secured with **JWT Role-Based Access Control** (Organizer vs Attendee), hardened with **API Rate Limiting** against ticket-scalping bots, and documented with **Swagger OpenAPI 3.0**.

Firestore atomic transactions (`runTransaction`) guarantee tickets are **never oversold** under concurrent traffic.

---

## 🛠️ Tech Stack

Node.js · Express.js · Firebase Admin (Firestore) · jsonwebtoken · bcryptjs · express-rate-limit · swagger-ui-express · swagger-jsdoc · dotenv · cors

## 📦 Installation

```bash
npm install
cp .env.example .env          # optional — defaults are provided
npm run dev                   # nodemon
npm start                     # plain node
```

Server starts at `http://localhost:5001` — Swagger UI at [`http://localhost:5001/api-docs`](http://localhost:5001/api-docs). Override with `PORT` in `.env` if needed (macOS AirPlay Receiver occupies port 5000).

## 🔐 Firestore Setup

1. Create a Firebase project and download a `serviceAccountKey.json` (Project Settings → Service accounts → Generate new private key).
2. Place it at the project root (`serviceAccountKey.json`) or point to it via `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env`.
3. The file is git-ignored (`serviceAccountKey.json` in `.gitignore`).

Collections used: `users`, `events`, `tickets`.

## 📋 API Endpoints

### 🔐 Authentication
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register as `attendee` or `organizer` — returns JWT |
| POST | `/api/auth/login` | Public | Login and obtain JWT |
| GET | `/api/auth/profile` | Authenticated | Retrieve user profile & role |

### 🎪 Events
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/events` | Public | Browse upcoming events (`?category=&city=`) |
| GET | `/api/events/:id` | Public | Event details + live remaining tickets |
| POST | `/api/events` | Organizer | Create event listing |
| PUT | `/api/events/:id` | Organizer | Update own event |
| DELETE | `/api/events/:id` | Organizer | Cancel/delete own event |

### 🎟️ Tickets (Attendee)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/tickets/book` | Attendee | **Atomic booking, 10 req/min** — decrements inventory via transaction |
| GET | `/api/tickets/my-tickets` | Attendee | View purchased tickets |
| POST | `/api/tickets/:id/cancel` | Attendee | Cancel ticket & restore inventory |
| GET | `/api/events/:id/attendees` | Organizer | List confirmed attendees |

### 📚 Swagger
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api-docs` | Interactive Swagger UI |

---

## ⚡ Concurrency Safety

`bookTicket` runs inside `db.runTransaction`:

1. Read event document inside the transaction.
2. **Abort if `availableTickets < quantity`** → event is never oversold.
3. Decrement `availableTickets`.
4. Create the ticket document.
5. Commit — Firestore re-runs the transaction if concurrent writers conflict.

`cancelTicket` uses the same pattern to restore inventory (capped at `totalCapacity`).

## 🚨 Rate Limiting (Scalper Protection)

- **Global limiter:** 300 requests / 15 min (all routes).
- **Booking limiter:** **10 requests / 60 s** on `POST /api/tickets/book`.
  Excess requests return **429 Too Many Requests**.

## 🧪 Verification Checklist

```bash
# 1. Register organizer & attendee
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Aarav Mehta","email":"organizer@itm.com","password":"pass123","role":"organizer"}'

curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Kunal Sharma","email":"kunal@gmail.com","password":"pass123","role":"attendee"}'

# 2. Organizer creates event with totalCapacity: 5 (save Authorization: Bearer <organizer-token>)
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ORGANIZER_TOKEN>" \
  -d '{"title":"Global Cloud & AI Summit 2026","description":"Flagship backend conference","category":"Technology","eventDate":"2026-06-15T09:00:00Z","venue":"Bandra Kurla Complex, Mumbai","ticketPrice":1499,"totalCapacity":5}'

# 3. Attendee books tickets atomically
curl -X POST http://localhost:5000/api/tickets/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ATTENDEE_TOKEN>" \
  -d '{"eventId":"<EVENT_ID>","quantity":2,"attendeeName":"Kunal Sharma","attendeeEmail":"kunal@gmail.com"}'

# 4. Fire 11 booking requests in 60s → expect 429 on the 11th
```

Verify in Firestore that `availableTickets` **never drops below 0**, Swagger renders every endpoint, and book-limited routes respond `429` after 10 requests/minute.

## 📁 Project Structure

```
assignment-12-event-ticketing-api/
├── config/
│   ├── firebaseConfig.js    # Firebase Admin Firestore init
│   └── swagger.js           # OpenAPI 3.0 swagger-jsdoc config
├── controllers/
│   ├── authController.js
│   ├── eventController.js
│   └── ticketController.js  # runTransaction booking logic
├── middleware/
│   ├── auth.js              # JWT verification
│   ├── checkRole.js         # Organizer vs Attendee guard
│   └── rateLimiter.js       # general + booking rate limits
├── routes/
│   ├── authRoutes.js
│   ├── eventRoutes.js
│   └── ticketRoutes.js
├── serviceAccountKey.json   # (git-ignored)
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```