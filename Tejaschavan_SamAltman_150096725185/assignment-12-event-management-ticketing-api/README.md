# Event Management & Ticketing API

A production-quality, enterprise-grade RESTful API built with **Node.js**, **Express.js**, **Google Cloud Firestore (Firebase Admin SDK)**, **JWT Role-Based Access Control (RBAC)**, **Express Rate Limiting**, and interactive **Swagger/OpenAPI 3.0** documentation.

---

## 🚀 Features & Highlights

- **Custom JWT Authentication & RBAC**: Secure authentication using `bcryptjs` for password hashing and `jsonwebtoken` for signed tokens. Built with role-based access control supporting `organizer` and `attendee` roles.
- **Atomic Inventory & Booking Transactions**: All ticket reservations and cancellations utilize Firestore atomic transactions (`db.runTransaction`) to guarantee strict consistency and completely eliminate race conditions and overselling.
- **Smart Event Management**: Full event lifecycle management for organizers (creation, delta-aware capacity updates, deletion with automated cascading ticket cancellations).
- **Advanced Filtering**: Search upcoming events filtered by category and city (via intelligent venue substring matching).
- **Targeted Rate Limiting**: Dedicated rate limiter on ticket booking (`POST /api/tickets/book`) restricting attendees to **10 requests per minute** to thwart automated bot spam and hoarding.
- **Interactive Swagger / OpenAPI 3.0**: Auto-generated documentation and sandbox UI served at `/api-docs`.
- **Postman Collection Included**: Comprehensive collection (`postman_collection.json`) with automated token management and runner scripts for concurrency and rate-limit validation.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime** | Node.js (v18+) | Server execution environment |
| **Framework** | Express.js (v4.x) | HTTP server & routing architecture |
| **Database** | Firebase Admin (Firestore) | NoSQL document database with ACID transactions |
| **Security** | `jsonwebtoken`, `bcryptjs` | JWT issuance/verification & salted password hashing |
| **Rate Limiting** | `express-rate-limit` | Traffic shaping and spam protection |
| **API Documentation** | `swagger-ui-express`, `swagger-jsdoc` | OpenAPI 3.0 specification & interactive UI |
| **Environment** | `dotenv`, `cors` | Configuration & Cross-Origin Resource Sharing |
| **Dev Tooling** | `nodemon` | Hot-reloading development server |

---

## 📁 Project Structure

```
assignment-12-event-ticketing-api/
├── config/
│   ├── firebaseConfig.js       # Firebase Admin & Firestore initialization
│   └── swagger.js              # Swagger/OpenAPI 3.0 JSDoc configuration
├── controllers/
│   ├── authController.js       # Register, Login, Get Profile
│   ├── eventController.js      # CRUD events, get upcoming, organizer rosters
│   └── ticketController.js     # Atomic booking, cancellations, attendee history
├── middleware/
│   ├── auth.js                 # JWT Bearer verification middleware
│   ├── checkRole.js            # authorizeRoles('organizer', 'attendee') RBAC
│   └── rateLimiter.js          # Booking endpoint rate limiter (10 req/min)
├── routes/
│   ├── authRoutes.js           # Auth routes with Swagger annotations
│   ├── eventRoutes.js          # Event routes with Swagger annotations
│   └── ticketRoutes.js         # Ticket routes with Swagger annotations
├── docs/                       # Destination folder for submission screenshots
│   └── .gitkeep
├── postman_collection.json     # Postman collection (v2.1) with runner tests
├── serviceAccountKey.example.json # Placeholder structure for Firebase credentials
├── .env.example                # Environment variable template
├── .gitignore                  # Git ignore rules (protects credentials & modules)
├── package.json                # Project manifest & dependency list
├── server.js                   # Application entrypoint & middleware assembly
└── README.md                   # Comprehensive technical documentation
```

---

## 🗄️ Firestore Data Model

### 1. `users` Collection
Custom JWT authentication is backed directly by a Firestore `users` collection:
```json
{
  "id": "usr_auto_generated_id",
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "passwordHash": "$2a$10$e8wF...hashed_string",
  "role": "organizer | attendee",
  "createdAt": "2026-09-08T14:30:00.000Z"
}
```

### 2. `events` Collection
```json
{
  "id": "evt_auto_generated_id",
  "title": "Cloud & AI Summit 2026",
  "description": "Annual conference exploring cloud architecture and AI agents.",
  "category": "Technology",
  "eventDate": "2026-11-20T09:00:00.000Z",
  "venue": "Grand Convention Center, BKC, Mumbai",
  "organizerId": "usr_auto_generated_id",
  "ticketPrice": 149.99,
  "totalCapacity": 500,
  "availableTickets": 495,
  "createdAt": "2026-09-08T10:00:00.000Z",
  "updatedAt": "2026-09-08T10:30:00.000Z"
}
```

### 3. `tickets` Collection
```json
{
  "id": "tkt_auto_generated_id",
  "eventId": "evt_auto_generated_id",
  "eventTitle": "Cloud & AI Summit 2026",
  "userId": "usr_attendee_id",
  "attendeeName": "Alice Attendee",
  "attendeeEmail": "alice@example.com",
  "quantity": 2,
  "totalPaid": 299.98,
  "bookingRef": "TKT-847291AB",
  "status": "confirmed | cancelled",
  "bookedAt": "2026-09-08T12:00:00.000Z",
  "cancelledAt": "2026-09-08T13:00:00.000Z"
}
```

---

## 🏛️ Architectural Decisions & Assumptions

1. **Custom JWT Auth vs Firebase Authentication**:
   - Per requirements, authentication uses `jsonwebtoken` and `bcryptjs` with user records stored in the Firestore `users` collection. This provides direct RBAC control without requiring client-side Firebase Auth SDKs.
2. **City Filtering via Venue Substring**:
   - As events do not have a dedicated `city` schema field, the `GET /api/events?city=Mumbai` filter performs a case-insensitive substring match against the `venue` string.
3. **Total Capacity Update Delta Formula**:
   - When an organizer modifies `totalCapacity` via `PUT /api/events/:id`:
     $$\text{bookedTickets} = \text{current totalCapacity} - \text{current availableTickets}$$
     $$\text{new availableTickets} = \text{new totalCapacity} - \text{bookedTickets}$$
   - If `new totalCapacity < bookedTickets`, the API rejects the update with HTTP 400 to prevent negative availability or invalidating already purchased tickets.
4. **Cascading Event Cancellation**:
   - When an organizer deletes an event (`DELETE /api/events/:id`), a Firestore batch write marks all associated ticket documents as `status: 'cancelled'` prior to deleting the event document.
5. **Rate Limiting Scope & Identity**:
   - The booking rate limiter (10 req/min) is applied specifically to `POST /api/tickets/book`.
   - The key generator prioritizes `req.user.id` for authenticated attendees and falls back to `req.ip`.

---

## 🔒 Concurrency & Transactional Integrity

To prevent **race conditions and overselling**, ticket purchases and cancellations use `db.runTransaction`:

```javascript
// Booking Transaction Flow
await db.runTransaction(async (t) => {
  const eventDoc = await t.get(eventRef);
  if (!eventDoc.exists) throw new Error('Event not found');

  const data = eventDoc.data();
  if (data.availableTickets < requestedQuantity) {
    throw new Error(`Insufficient tickets available. Only ${data.availableTickets} remaining`);
  }

  // 1. Decrement availableTickets
  t.update(eventRef, { availableTickets: data.availableTickets - requestedQuantity });
  
  // 2. Persist new ticket document
  t.set(ticketRef, ticketData);
});
```

- **ACID Guarantee**: If two attendees attempt to purchase the last available ticket concurrently, Firestore evaluates the transactions sequentially. The second transaction observes `availableTickets == 0` and fails cleanly with HTTP 400.
- **Cancellation Restitution**: Ticket cancellation also runs inside a transaction, updating the ticket status to `'cancelled'` and atomically returning the ticket quantity to `availableTickets`.

---

## 📋 API Endpoints Matrix

| Method | Endpoint | Access / Role | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register organizer or attendee | 201, 400, 500 |
| `POST` | `/api/auth/login` | Public | Login and receive JWT token | 200, 400, 401, 500 |
| `GET` | `/api/auth/profile` | Authenticated | Get current user profile | 200, 401, 404, 500 |
| `GET` | `/api/events` | Public | List upcoming events (filtered by `category`, `city`) | 200, 500 |
| `GET` | `/api/events/:id` | Public | Get event details with live `availableTickets` | 200, 404, 500 |
| `POST` | `/api/events` | Organizer | Create a new event | 201, 400, 401, 403, 500 |
| `PUT` | `/api/events/:id` | Organizer (Owner) | Update event & adjust capacity safely | 200, 400, 401, 403, 404, 500 |
| `DELETE`| `/api/events/:id` | Organizer (Owner) | Cancel all tickets and delete event | 200, 401, 403, 404, 500 |
| `GET` | `/api/events/:id/attendees` | Organizer (Owner) | View confirmed attendee roster for event | 200, 401, 403, 404, 500 |
| `POST` | `/api/tickets/book` | Attendee (Rate Limited) | Book tickets atomically (10 req/min limit) | 201, 400, 401, 403, 429, 500 |
| `GET` | `/api/tickets/my-tickets` | Attendee | List tickets booked by authenticated attendee | 200, 401, 403, 500 |
| `POST` | `/api/tickets/:id/cancel` | Attendee (Owner) | Cancel ticket and restore event capacity | 200, 400, 401, 403, 404, 500 |

---

## ⚡ Setup & Installation

### 1. Prerequisites
- Node.js (v18 or higher) & npm
- A Firebase project with Firestore enabled in Native mode

### 2. Firebase Service Account Setup
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project and navigate to **Project Settings** (gear icon) ➔ **Service accounts**.
3. Under **Firebase Admin SDK**, click **Generate new private key**.
4. Rename the downloaded file to `serviceAccountKey.json` and place it in the root directory:
   ```
   assignment-12-event-ticketing-api/serviceAccountKey.json
   ```
   *(Note: `serviceAccountKey.json` is gitignored to protect credentials)*.

### 3. Environment Configuration
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Configure your variables:
```env
PORT=5050
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=1d
NODE_ENV=development
```

### 4. Install Dependencies & Run
```bash
# Install all dependencies
npm install

# Run development server with hot-reload
npm run dev

# Or start production server
npm start
```

---

## 📖 Interactive Swagger API Documentation

Once the server is running, visit:
👉 **[http://localhost:5050/api-docs](http://localhost:5050/api-docs)**

The Swagger UI allows interactive testing:
1. Click **Authorize** at the top right.
2. Enter `Bearer <your_jwt_token>` obtained from `/api/auth/login`.
3. Test all organizer and attendee endpoints with live request validation.

---

## 🧪 Testing Walkthrough (Step-by-Step)

### Step 1: Boot the API & Open Swagger Docs
1. Run `npm run dev`.
2. Navigate to `http://localhost:5050/api-docs`.

### Step 2: Register & Login Organizer
1. `POST /api/auth/register` with:
   ```json
   {
     "name": "Acme Conferences",
     "email": "organizer@acme.com",
     "password": "password123",
     "role": "organizer"
   }
   ```
2. `POST /api/auth/login` to obtain the organizer JWT token.

### Step 3: Create an Event with Limited Capacity
1. Authorize with the organizer token.
2. `POST /api/events` with payload:
   ```json
   {
     "title": "Agentic AI Workshop",
     "description": "Hands-on engineering workshop",
     "category": "Technology",
     "eventDate": "2026-12-01T10:00:00.000Z",
     "venue": "Convention Center, Mumbai",
     "ticketPrice": 100,
     "totalCapacity": 5
   }
   ```
   *(Notice `availableTickets` is initialized to 5)*.

### Step 4: Register & Login Attendee
1. `POST /api/auth/register` with role `attendee`:
   ```json
   {
     "name": "Bob Attendee",
     "email": "bob@example.com",
     "password": "password123",
     "role": "attendee"
   }
   ```
2. `POST /api/auth/login` with Bob's credentials to obtain the attendee JWT token.

### Step 5: Test Concurrency & Overselling Protection
1. Authorize with attendee token.
2. Send concurrent booking requests (e.g. 3 requests each booking 2 tickets = 6 tickets total):
   ```json
   {
     "eventId": "<created_event_id>",
     "quantity": 2
   }
   ```
3. **Result**: The first two requests succeed (consuming 4 tickets, `availableTickets = 1`). The 3rd request fails with:
   ```json
   {
     "success": false,
     "message": "Insufficient tickets available. Only 1 tickets remaining"
   }
   ```
4. Check Firestore: `availableTickets` is exactly `1` and never negative.

### Step 6: Test Booking Rate Limiter (10 req/min)
1. Using Postman Collection Runner or rapid requests, trigger 15 requests to `POST /api/tickets/book` within 60 seconds.
2. **Result**: Requests 1–10 are evaluated by the business logic; requests 11–15 immediately return:
   ```json
   {
     "success": false,
     "message": "Too many booking attempts, please try again later."
   }
   ```
   with HTTP Status **429 Too Many Requests**.

### Step 7: Ticket Cancellation & Capacity Restoration
1. Call `POST /api/tickets/:id/cancel` for one of Bob's confirmed tickets (quantity 2).
2. **Result**: Ticket status updates to `cancelled`, and `availableTickets` on the parent event automatically increases from `1` to `3`.

---

## 📷 Submission Screenshots

Screenshots of the interactive Swagger UI and the Firestore console should be saved in the `/docs` directory:
- `docs/swagger_ui.png`
- `docs/firestore_users_collection.png`
- `docs/firestore_events_collection.png`
- `docs/firestore_tickets_collection.png`
- `docs/rate_limit_429_test.png`

---

## 📄 License

This project is licensed under the ISC License.
