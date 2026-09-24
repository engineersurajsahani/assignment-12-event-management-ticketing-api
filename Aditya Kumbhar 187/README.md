# Assignment 12: Event Management & Ticketing API with Firebase & Swagger

**Student Name:** Aditya Kumbhar  
**Roll No:** 187  
**Track:** Backend Development  
**Tech Stack:** Node.js, Express.js, Firebase Admin (Firestore), JWT, bcryptjs, express-rate-limit, swagger-ui-express, swagger-jsdoc, dotenv, cors  
Live Link: https://assignment-12-event-management-ticketing-vtwr.onrender.com/ 
---

## 📌 1. Project Overview

This project is a high-concurrency **Event Ticketing & Live Booking REST API** backed by **Google Firebase Firestore**. It features **JWT Role-Based Access Control** (`Organizer` vs `Attendee`), bot protection via **API Rate Limiting** using `express-rate-limit`, Firestore **ACID Transactions (`runTransaction`)** to prevent ticket overselling, and complete interactive API documentation via **Swagger OpenAPI 3.0**.

---

## ✨ 2. Key Features

- **Firestore ACID Transactions:** Uses `db.runTransaction()` for atomic ticket booking and cancellations, guaranteeing `availableTickets` never drops below zero during concurrent requests.
- **Role-Based Access Control (RBAC):** Distinct roles for `Organizer` (create, update, delete events, view attendees) and `Attendee` (book, view, cancel tickets).
- **Anti-Bot Rate Limiting:** Strict rate limiter on `/api/tickets/book` (10 requests/minute per IP) to prevent ticket scalping bots.
- **Interactive Swagger UI Documentation:** Full OpenAPI 3.0 specs available interactively at `/api-docs`.
- **JWT Authentication & bcrypt Hashing:** Secure password hashing and token-based route protection.

---

## 🗄️ 3. Firestore Document Schemas

### 1. `events` Collection
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

### 2. `tickets` Collection
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

### 3. `users` Collection
```json
{
  "id": "usr_organizer_01",
  "name": "Aditya Kumbhar",
  "email": "aditya@example.com",
  "password": "$2a$10$hashedpassword...",
  "role": "Organizer",
  "createdAt": "2026-03-01T10:00:00Z"
}
```

---

## 📋 4. API Endpoints Specification

### 🔐 Authentication

| Method | Endpoint | Role Access | Description |
|---|---|:---:|---|
| `POST` | `/api/auth/register` | Public | Register as `Attendee` or `Organizer` |
| `POST` | `/api/auth/login` | Public | Authenticate and obtain JWT token |
| `GET` | `/api/auth/profile` | Authenticated | Retrieve authenticated user profile & role |

### 🎪 Event Management

| Method | Endpoint | Role Access | Description |
|---|---|:---:|---|
| `GET` | `/api/events` | Public | Browse all upcoming events (supports `?category=Technology&city=Mumbai`) |
| `GET` | `/api/events/:id` | Public | View event details & live remaining ticket count |
| `POST` | `/api/events` | **Organizer** | Create new event listing |
| `PUT` | `/api/events/:id` | **Organizer** | Update event details (Organizer must own event) |
| `DELETE` | `/api/events/:id` | **Organizer** | Cancel and delete event |
| `GET` | `/api/events/:id/attendees` | **Organizer** | List all registered attendees for the event |

### 🎟️ Ticket Booking & Scalper Protection

| Method | Endpoint | Role Access | Description |
|---|---|:---:|---|
| `POST` | `/api/tickets/book` | **Attendee** | **Atomic Booking**: 10 req/min limit. Decrements tickets via transaction |
| `GET` | `/api/tickets/my-tickets` | **Attendee** | View purchased tickets |
| `POST` | `/api/tickets/:id/cancel` | **Attendee** | Cancel ticket & restore ticket inventory |

### 📚 Interactive Swagger Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api-docs` | Full interactive Swagger UI documentation for all endpoints |

---

## 📁 5. Directory Structure

```text
Aditya Kumbhar 187, assignment 12/
├── config/
│   ├── firebaseConfig.js    # Firebase Admin Firestore initialization
│   └── swagger.js           # Swagger specification config
├── controllers/
│   ├── authController.js    # Register, login, profile
│   ├── eventController.js   # CRUD events & attendees
│   └── ticketController.js  # Atomic transaction booking & cancellation
├── middleware/
│   ├── auth.js              # JWT verification
│   ├── checkRole.js         # Organizer vs Attendee RBAC guard
│   └── rateLimiter.js       # Strict booking & general rate limits
├── routes/
│   ├── authRoutes.js        # Auth endpoints with Swagger JSDoc
│   ├── eventRoutes.js       # Event endpoints with Swagger JSDoc
│   └── ticketRoutes.js      # Ticket endpoints with Swagger JSDoc
├── serviceAccountKey.json.example
├── .env
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

---

## 🚀 6. Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file (or copy from `.env.example`):
```env
PORT=5001
JWT_SECRET=my_super_secret_jwt_key_2026_ticketing_app
FIREBASE_PROJECT_ID=event-ticketing-187
```

*(Optional: Place your Firebase `serviceAccountKey.json` in the root folder for production Firebase connection).*

### 3. Start Server
```bash
# Start server
npm start

# Or in development mode with nodemon
npm run dev
```

---

## 🧪 7. Testing & Verification

1. Start server and visit `http://localhost:5001/api-docs` to view Swagger UI.
2. Register an organizer on `POST /api/auth/register` with `{ "role": "Organizer" }`.
3. Create an event on `POST /api/events` with `totalCapacity: 5`.
4. Register an attendee and book tickets via `POST /api/tickets/book`.
5. Verify that sending more than 10 requests in a minute triggers `429 Too Many Requests`.
