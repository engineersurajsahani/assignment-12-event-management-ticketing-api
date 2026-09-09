# 🎟️ Event Management & Ticketing API

## 🌐 Live API

**https://event-ticketing-api-w2vs.onrender.com/**

### 📚 Swagger API Documentation

**https://event-ticketing-api-w2vs.onrender.com/api-docs**

---

## 📌 Overview

The Event Management & Ticketing API is a backend application for managing events and handling ticket bookings.

The API is built using **Node.js, Express.js, Firebase Firestore, JWT authentication, Swagger, and rate limiting**.

The system supports two user roles:

- **Organizer** – Create, update, delete events and view attendees
- **Attendee** – Browse events, book tickets, view bookings and cancel tickets

The application uses **Firestore transactions** to ensure that tickets cannot be oversold during concurrent bookings.

---

## 🚀 Features

- 🔐 JWT Authentication
- 👥 Role-Based Access Control
- 🎟️ Event ticket booking
- ⚡ Atomic ticket booking using Firestore transactions
- 🚫 Prevents ticket overselling
- ⏱️ Rate limiting on ticket booking
- 📋 Swagger / OpenAPI documentation
- 🔥 Firebase Firestore database
- 👤 Organizer and Attendee roles
- ❌ Ticket cancellation with inventory restoration
- 🔎 Event filtering by category and city
- 🌐 CORS support
- ⚠️ Centralized error handling

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express.js | REST API framework |
| Firebase Admin SDK | Firebase server integration |
| Cloud Firestore | Database |
| JWT | Authentication |
| bcryptjs | Password hashing |
| express-rate-limit | API rate limiting |
| Swagger UI | API documentation |
| swagger-jsdoc | OpenAPI specification |
| dotenv | Environment variables |
| CORS | Cross-origin requests |

---

## 📂 Project Structure

```text
assignment-12-event-ticketing-api/
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
│   └── rateLimiter.js
│
├── routes/
│   ├── authRoutes.js
│   ├── eventRoutes.js
│   └── ticketRoutes.js
│
├── .env.example
├── .gitignore
├── package.json
├── README.md
├── server.js
└── serviceAccountKey.json