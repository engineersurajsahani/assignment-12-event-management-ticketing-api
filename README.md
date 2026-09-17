# 🎟️ Event Management & Ticketing API

A backend **Event Management & Live Ticketing REST API** built using **Node.js, Express.js and Firebase Firestore**.

The project implements JWT authentication, role-based access control for **Organizer** and **Attendee**, atomic Firestore transactions for ticket booking, API rate limiting, and interactive Swagger/OpenAPI documentation.

**Live Deployed Render Link:**
https://event-ticketing-api-4hzw.onrender.com/

---

## 📌 Assignment Objective

Develop a high-concurrency event ticketing API backed by Firebase Firestore.

The API allows:

- Organizers to create and manage events.
- Attendees to browse upcoming events and purchase tickets.
- Ticket inventory to be updated safely using Firestore `runTransaction`.
- Booking routes to be protected with rate limiting.
- All endpoints to be documented using Swagger UI.

---

## 🛠️ Tech Stack

- **Node.js**
- **Express.js**
- **Firebase Firestore**
- **Firebase Admin SDK**
- **JWT**
- **bcryptjs**
- **express-rate-limit**
- **Swagger UI**
- **swagger-jsdoc**
- **dotenv**
- **cors**

---

## 📂 Project Structure

```text
JUI_TAWDE/
│
├── config/
│   ├── firebaseConfig.js
│   └── swagger.js
│
├── controllers/
│   ├── authController.js
│   ├── eventController.js
│   └── ticketController.js
│
├── middleware/
│   ├── auth.js
│   ├── checkRole.js
│   ├── errorHandler.js
│   └── rateLimiter.js
│
├── routes/
│   ├── authRoutes.js
│   ├── eventRoutes.js
│   └── ticketRoutes.js
│
├── docs/
│
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

---

# 🚀 Getting Started

## 1. Clone or extract the project

Open the project folder in VS Code.

Then open the terminal inside the project folder.

---

## 2. Install dependencies

Run:

```bash
npm install
```

---

## 3. Create a Firebase Project

1. Open the **Firebase Console**.
2. Create a new Firebase project.
3. Open **Firestore Database**.
4. Create the database.
5. Go to **Project Settings → Service Accounts**.
6. Generate a new private key.

You can use the downloaded JSON file as:

```text
serviceAccountKey.json
```

Place it in the project root:

```text
assignment-12-event-ticketing-api/
├── serviceAccountKey.json
├── server.js
├── package.json
└── ...
```

The file is already included in `.gitignore`.

### Alternative

Instead of using `serviceAccountKey.json`, configure the Firebase credentials in `.env`.

---

# 🔐 Environment Variables

Create a file named:

```text
.env
```

Use `.env.example` as the template.

Example:

```env
PORT=5000
JWT_SECRET=your_long_random_secret

FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-firebase-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

**Never upload `.env` or `serviceAccountKey.json` to GitHub.**

---

# ▶️ Run the Server

### Normal mode

```bash
npm start
```

### Development mode

```bash
npm run dev
```

If everything is configured correctly, the terminal will show:

```text
Server running at http://localhost:5000
Swagger UI: http://localhost:5000/api-docs
```

---

# 📚 Swagger Documentation

Open:

```text
http://localhost:5000/api-docs
```

Swagger provides an interactive interface for testing all API endpoints.

---

# 🔐 Authentication

The API supports two roles:

### Organizer

Organizers can:

- Create events
- Update their own events
- Delete their own events
- View attendees for their own events

### Attendee

Attendees can:

- Browse events
- Book tickets
- View their tickets
- Cancel their tickets

---

# 📋 API Endpoints

## Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register as Attendee or Organizer |
| POST | `/api/auth/login` | Public | Login and receive JWT |
| GET | `/api/auth/profile` | Authenticated | Get current user profile |

---

## Event Management

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/events` | Public | Browse upcoming events |
| GET | `/api/events/:id` | Public | View event details |
| POST | `/api/events` | Organizer | Create an event |
| PUT | `/api/events/:id` | Organizer | Update owned event |
| DELETE | `/api/events/:id` | Organizer | Delete owned event |
| GET | `/api/events/:id/attendees` | Organizer | View event attendees |

Event filtering supports:

```text
GET /api/events?category=Technology&city=Mumbai
```

---

## Ticket Booking

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/tickets/book` | Attendee | Book tickets atomically |
| GET | `/api/tickets/my-tickets` | Attendee | View purchased tickets |
| POST | `/api/tickets/:id/cancel` | Attendee | Cancel a ticket |

The booking endpoint is rate limited to:

```text
10 requests per minute
```

Requests beyond the limit receive:

```text
429 Too Many Requests
```

---

# 🧪 Testing Flow

## Step 1 — Register an Organizer

**POST**

```text
http://localhost:5000/api/auth/register
```

Body:

```json
{
  "name": "Organizer One",
  "email": "organizer@example.com",
  "password": "Test12345",
  "role": "Organizer"
}
```

Copy the JWT token from the response.

---

## Step 2 — Create an Event

Use the Organizer token:

```text
Authorization: Bearer YOUR_ORGANIZER_TOKEN
```

**POST**

```text
http://localhost:5000/api/events
```

Body:

```json
{
  "title": "Global Cloud & AI Summit 2027",
  "description": "Annual backend technology conference",
  "category": "Technology",
  "eventDate": "2027-06-15T09:00:00Z",
  "venue": "Bandra Kurla Complex, Mumbai",
  "ticketPrice": 1499,
  "totalCapacity": 5
}
```

Save the returned `eventId`.

---

## Step 3 — Register an Attendee

**POST**

```text
http://localhost:5000/api/auth/register
```

Body:

```json
{
  "name": "Attendee One",
  "email": "attendee@example.com",
  "password": "Test12345",
  "role": "Attendee"
}
```

Login using:

```text
POST /api/auth/login
```

Save the Attendee JWT token.

---

## Step 4 — Book Tickets

Use the Attendee token:

```text
Authorization: Bearer YOUR_ATTENDEE_TOKEN
```

**POST**

```text
http://localhost:5000/api/tickets/book
```

Body:

```json
{
  "eventId": "YOUR_EVENT_ID",
  "quantity": 2,
  "attendeeName": "Attendee One",
  "attendeeEmail": "attendee@example.com"
}
```

The API will:

1. Check whether the event exists.
2. Check available ticket inventory.
3. Decrease `availableTickets`.
4. Create the ticket document.
5. Calculate `totalPaid`.

These operations occur inside a Firestore transaction.

---

## Step 5 — View My Tickets

**GET**

```text
http://localhost:5000/api/tickets/my-tickets
```

Use the Attendee JWT.

---

## Step 6 — Cancel a Ticket

Copy the ticket ID from the previous response.

**POST**

```text
http://localhost:5000/api/tickets/YOUR_TICKET_ID/cancel
```

The ticket becomes:

```text
status: cancelled
```

and the event's available ticket count is restored.

---

# ⚡ Concurrency Protection

The ticket booking operation uses Firestore:

```javascript
db.runTransaction(...)
```

The transaction:

1. Reads the event.
2. Checks `availableTickets`.
3. Decreases the inventory.
4. Creates the ticket record.

This prevents concurrent requests from overselling the available ticket inventory.

---

# 🛡️ Rate Limiting

The booking endpoint is protected by:

```text
express-rate-limit
```

Limit:

```text
10 requests / 60 seconds
```

Expected response after exceeding the limit:

```text
429 Too Many Requests
```

---

# ❌ Authentication & Authorization Tests

### No token

Try:

```text
POST /api/events
```

without a Bearer token.

Expected:

```text
401 Unauthorized
```

### Wrong role

Try creating an event using an Attendee token.

Expected:

```text
403 Forbidden
```

This verifies the Organizer/Attendee role guard.

---

# 🗄️ Firestore Collections

## `events`

Example:

```json
{
  "id": "event_techconf_2027",
  "title": "Global Cloud & AI Summit 2027",
  "description": "Annual backend conference",
  "category": "Technology",
  "eventDate": "2027-06-15T09:00:00Z",
  "venue": "Bandra Kurla Complex, Mumbai",
  "organizerId": "USER_ID",
  "ticketPrice": 1499,
  "totalCapacity": 5,
  "availableTickets": 5,
  "createdAt": "2026-09-17T12:00:00Z"
}
```

## `tickets`

Example:

```json
{
  "id": "ticket_001",
  "eventId": "event_techconf_2027",
  "eventTitle": "Global Cloud & AI Summit 2027",
  "userId": "USER_ID",
  "attendeeName": "Attendee One",
  "attendeeEmail": "attendee@example.com",
  "quantity": 2,
  "totalPaid": 2998,
  "bookingRef": "TKT-123456",
  "status": "confirmed",
  "bookedAt": "2026-09-17T12:10:00Z"
}
```

---

# 📊 Assignment Requirements Covered

| Requirement | Implementation |
|---|---|
| Firestore database | Firebase Admin SDK + Firestore |
| JWT authentication | `jsonwebtoken` |
| Role-based access | Organizer / Attendee middleware |
| Atomic ticket booking | Firestore `runTransaction()` |
| Ticket inventory | `availableTickets` |
| Rate limiting | `express-rate-limit` |
| Swagger documentation | `swagger-jsdoc` + `swagger-ui-express` |
| Error handling | Central error middleware |
| REST API architecture | Routes + Controllers + Middleware |
| Ticket cancellation | Inventory restored transactionally |


---


## 👩‍💻 Author

**Jui Tawde**

Backend Development Assignment — Assignment 12
