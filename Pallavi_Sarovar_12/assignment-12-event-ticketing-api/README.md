# 🎟️ Assignment 12: Event Management & Ticketing API

**Track:** Backend Development | **Level:** Advanced  
**Tech Stack:** Node.js, Express.js, Firebase Firestore, JWT, bcryptjs, express-rate-limit, Swagger/OpenAPI 3.0, dotenv, CORS

## 📌 Objective

A high-concurrency Event Management & Ticketing REST API backed by Firebase Firestore.

The project demonstrates:

- Firestore `runTransaction()` for atomic ticket inventory updates
- JWT authentication and role-based access control
- Organizer vs Attendee authorization
- Booking rate limiting: 10 requests/minute
- Swagger/OpenAPI 3.0 interactive documentation
- Upcoming-event filtering
- Ticket cancellation with inventory restoration
- Ownership checks for organizer event management

## 🏗️ Project Structure

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
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## ⚙️ Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Firebase project

Open the Firebase Console, create a project, and enable **Firestore Database**.

You also need a Firebase Admin SDK service account.

Download the service account JSON file and place it in the project root as:

```text
serviceAccountKey.json
```

**Do not commit this file to GitHub. It is already included in `.gitignore`.**

### 3. Create `.env`

Copy `.env.example` to `.env`.

```bash
cp .env.example .env
```

Set a strong JWT secret:

```env
PORT=5000
JWT_SECRET=your_long_random_secret
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

### 4. Start the API

Development mode:

```bash
npm run dev
```

Normal mode:

```bash
npm start
```

Server:

```text
http://localhost:5000
```

Swagger:

```text
http://localhost:5000/api-docs
```

## 🔐 Authentication Flow

### Register

`POST /api/auth/register`

Attendee example:

```json
{
  "name": "Pallavi Sarovar",
  "email": "pallavi@example.com",
  "password": "Password123!",
  "role": "attendee"
}
```

Organizer example:

```json
{
  "name": "Event Organizer",
  "email": "organizer@example.com",
  "password": "Password123!",
  "role": "organizer"
}
```

The response contains a JWT token.

### Login

`POST /api/auth/login`

Use the returned token in Swagger:

```text
Authorize → Bearer <your-token>
```

## 🎪 Create an Event

Login as an organizer, then call:

`POST /api/events`

Example:

```json
{
  "title": "Global Cloud & AI Summit 2026",
  "description": "Annual flagship backend conference",
  "category": "Technology",
  "eventDate": "2026-12-15T09:00:00Z",
  "venue": "Bandra Kurla Complex",
  "city": "Mumbai",
  "ticketPrice": 1499,
  "totalCapacity": 5
}
```

The API automatically sets:

```text
availableTickets = totalCapacity
organizerId = authenticated organizer ID
createdAt = current timestamp
```

## 🎟️ Book Tickets

Login as an attendee and call:

`POST /api/tickets/book`

```json
{
  "eventId": "YOUR_EVENT_ID",
  "quantity": 2,
  "attendeeName": "Pallavi Sarovar",
  "attendeeEmail": "pallavi@example.com"
}
```

Booking uses a Firestore transaction:

1. Reads the event inside the transaction.
2. Checks available inventory.
3. Decrements `availableTickets`.
4. Creates the ticket record.
5. Commits both changes atomically.

This prevents overselling under concurrent requests.

## 🚦 Rate Limiting

`POST /api/tickets/book` allows:

**10 requests per 60 seconds per client IP.**

The 11th request within the window returns:

```text
429 Too Many Requests
```

## ❌ Cancel a Ticket

`POST /api/tickets/:id/cancel`

The cancellation is also performed using a Firestore transaction. The ticket becomes `cancelled` and its quantity is returned to `availableTickets`.

## 📋 Endpoint Summary

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/profile` | Authenticated |
| GET | `/api/events` | Public |
| GET | `/api/events/:id` | Public |
| POST | `/api/events` | Organizer |
| PUT | `/api/events/:id` | Organizer owner |
| DELETE | `/api/events/:id` | Organizer owner |
| POST | `/api/tickets/book` | Attendee + rate limited |
| GET | `/api/tickets/my-tickets` | Attendee |
| POST | `/api/tickets/:id/cancel` | Attendee owner |
| GET | `/api/events/:id/attendees` | Organizer owner |
| GET | `/api-docs` | Public |

## 🧪 Testing Checklist

For the assignment demonstration:

1. Start the server.
2. Open Swagger at `/api-docs`.
3. Register an organizer.
4. Login as organizer and copy JWT.
5. Authorize Swagger.
6. Create an event with `totalCapacity: 5`.
7. Register an attendee.
8. Login as attendee and replace the Swagger token.
9. Book tickets.
10. Check Firestore `events` and `tickets` collections.
11. Verify `availableTickets` decreases correctly.
12. Try booking more tickets than available.
13. Send more than 10 booking requests within 60 seconds and verify `429`.
14. Cancel a ticket and verify inventory is restored.
15. Login as organizer again and test the attendee-list endpoint.
16. Test that an attendee cannot create an event.
17. Test that an organizer cannot use attendee booking routes.
18. Capture screenshots for `/docs`.

## 📸 Suggested Submission Screenshots

Create a `/docs` folder before submission and include:

- Swagger UI showing all endpoints
- Organizer registration/login
- Event creation
- Firestore `events` collection
- Successful ticket booking
- Firestore `tickets` collection
- Remaining ticket count after booking
- `429 Too Many Requests` response
- Ticket cancellation and restored inventory
- Organizer attendee list

## ⚠️ Important

Never upload:

```text
serviceAccountKey.json
.env
```

Both are ignored by `.gitignore`.

For GitHub submission, include the source code and `.env.example`, but keep Firebase credentials private.

## 📤 Submission Repository

Recommended repository name:

```text
itm-assignment-12-event-ticketing-api
```
