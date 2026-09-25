# 🎟️ Event Management & Ticketing API

RESTful Event Management and Ticket Booking API using **Node.js**, **Express.js**, **Firebase Firestore**, **Firebase Authentication**, JWT, Rate Limiting, and Swagger.

## 🌐 Live Deployment

https://assignment-12-event-management-ticketing-4bbd.onrender.com

## 📚 Swagger Documentation

https://assignment-12-event-management-ticketing-4bbd.onrender.com/api-docs

## 🛠️ Tech Stack

* Node.js
* Express.js
* Firebase Firestore
* Firebase Admin SDK
* JWT Authentication
* bcryptjs
* express-rate-limit
* Swagger / OpenAPI
* dotenv
* CORS

## ✨ Features

* User registration and login
* JWT authentication
* Role-Based Access Control
* Organizer and Attendee roles
* Event creation and management
* Browse and filter upcoming events
* Ticket booking system
* Atomic Firestore transactions
* Prevention of ticket overselling
* Ticket cancellation with inventory restoration
* Attendee booking history
* Organizer attendee management
* Rate limiting for booking routes
* Interactive Swagger API documentation

## 👥 User Roles

| Role      | Access                                                    |
| --------- | --------------------------------------------------------- |
| Attendee  | Browse events, book tickets, view tickets, cancel tickets |
| Organizer | Create, update and delete events, view event attendees    |

## 📌 Main API Routes

### Authentication

| Method | Route                |
| ------ | -------------------- |
| POST   | `/api/auth/register` |
| POST   | `/api/auth/login`    |
| GET    | `/api/auth/profile`  |

### Events

| Method | Route             |
| ------ | ----------------- |
| GET    | `/api/events`     |
| GET    | `/api/events/:id` |
| POST   | `/api/events`     |
| PUT    | `/api/events/:id` |
| DELETE | `/api/events/:id` |

### Tickets

| Method | Route                       |
| ------ | --------------------------- |
| POST   | `/api/tickets/book`         |
| GET    | `/api/tickets/my-tickets`   |
| POST   | `/api/tickets/:id/cancel`   |
| GET    | `/api/events/:id/attendees` |

### Swagger

| Method | Route       |
| ------ | ----------- |
| GET    | `/api-docs` |

## 🔥 Firestore

The API uses Firebase Firestore with two main collections:

* `events`
* `tickets`

Ticket booking uses Firestore `runTransaction` to safely decrease available ticket counts and prevent overselling during concurrent bookings.

## 🛡️ Security

* JWT authentication
* Role-based route protection
* Password hashing with bcryptjs
* Rate limiting on ticket booking
* Protected organizer and attendee operations

## 📁 Project Structure

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
├── serviceAccountKey.json
├── .env
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## 🧪 Testing

* Register an Organizer and create an event.
* Register an Attendee and book tickets.
* Test multiple bookings for limited ticket capacity.
* Verify that tickets are never oversold.
* Test ticket cancellation and inventory restoration.
* Test role-based access restrictions.
* Test rate limiting with more than 10 booking requests within 60 seconds.
* Verify all endpoints through Swagger UI.

---

### Assignment 12 – Event Management & Ticketing API with Firebase & Swagger
