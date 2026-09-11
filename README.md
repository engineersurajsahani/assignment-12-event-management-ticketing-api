# Event Management & Ticketing API

A RESTful backend API for managing events and ticket bookings using Node.js, Express.js, Firebase Firestore, JWT authentication, and Swagger/OpenAPI.

The application supports organizer and attendee roles, event management, ticket booking, ticket cancellation, Firestore transactions, rate limiting, and role-based access control.

---

## Overview

The Event Management & Ticketing API provides a complete backend system for creating events and managing ticket bookings.

The application has two main user roles:

- Organizer
- Attendee

Organizers can create and manage their own events and view attendees.

Attendees can browse events, book tickets, view their bookings, and cancel their tickets.

Firebase Firestore is used for database storage, while JWT is used for authentication and authorization.

---

## Features

### Authentication

- User registration
- User login
- JWT-based authentication
- Password hashing using bcrypt
- User profile endpoint
- Role-based authorization

### Event Management

- Browse upcoming events
- View event details
- Filter events by category
- Filter events by city
- Create events
- Update owned events
- Delete owned events
- View event attendees
- Event capacity tracking
- Upcoming event filtering

### Ticket Management

- Book event tickets
- View personal tickets
- Cancel booked tickets
- Automatic ticket inventory restoration
- Booking reference generation
- Total payment calculation
- Prevention of ticket overselling

### Firestore Transactions

Ticket booking uses a Firestore atomic transaction.

The transaction checks ticket availability and updates the event inventory together. This prevents multiple simultaneous booking requests from selling more tickets than the available event capacity.

### Rate Limiting

The ticket booking endpoint is protected using express-rate-limit.

Maximum allowed requests:

10 requests per minute

Requests exceeding the limit receive HTTP 429 Too Many Requests.

### Swagger Documentation

Swagger UI provides interactive API documentation and testing.

Swagger endpoint:

/api-docs

---

## Technologies Used

- Node.js
- Express.js
- Firebase Firestore
- Firebase Admin SDK
- JWT
- bcrypt
- Swagger / OpenAPI
- express-rate-limit
- dotenv
- CORS

---

## Project Structure

Pallavi_Sarovar_12/
└── assignment-12-event-ticketing-api/
    ├── config/
    │   ├── firebaseConfig.js
    │   └── swagger.js
    ├── controllers/
    │   ├── authController.js
    │   ├── eventController.js
    │   └── ticketController.js
    ├── docs/
    │   └── API testing screenshots
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
    ├── README.md
    └── server.js

---

## Installation

### 1. Install Dependencies

Run the following command inside the project directory:

npm install

### 2. Configure Environment Variables

Create a .env file using .env.example as a reference.

The environment configuration includes the server port and JWT configuration.

### 3. Configure Firebase

Create a Firebase project and enable Cloud Firestore.

Configure Firebase Admin SDK using the service account credentials.

Firebase credentials must remain private and must not be committed to GitHub.

### 4. Start the Server

Run:

npm start

The API will start on the configured port.

---

## Swagger API Documentation

After starting the server, open the following endpoint in your browser:

/api-docs

Swagger UI provides interactive documentation for authentication, events, and ticket-related endpoints.

---

## API Endpoints

### Authentication

| Method | Endpoint | Access |
|---|---|---|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/auth/profile | Authenticated |

### Events

| Method | Endpoint | Access |
|---|---|---|
| GET | /api/events | Public |
| GET | /api/events/:id | Public |
| POST | /api/events | Organizer |
| PUT | /api/events/:id | Event Owner |
| DELETE | /api/events/:id | Event Owner |
| GET | /api/events/:id/attendees | Event Owner |

### Tickets

| Method | Endpoint | Access |
|---|---|---|
| POST | /api/tickets/book | Attendee |
| GET | /api/tickets/my-tickets | Attendee |
| POST | /api/tickets/:id/cancel | Ticket Owner |

---

## Ticket Booking Flow

1. The attendee logs in and receives a JWT token.
2. The attendee sends a ticket booking request.
3. The API verifies the authenticated user.
4. The API checks whether the event exists.
5. Available ticket capacity is checked.
6. A Firestore transaction is started.
7. The ticket booking is created.
8. Available tickets are decreased.
9. The transaction is committed.
10. Booking details are returned to the attendee.

If insufficient tickets are available, the booking is rejected and the event inventory is not modified.

---

## Ticket Cancellation

When an attendee cancels a ticket:

1. The ticket is verified.
2. Ticket ownership is checked.
3. The ticket status is updated.
4. The cancelled quantity is restored to the event inventory.
5. The update is performed using a Firestore transaction.

This allows cancelled tickets to become available again.

---

## Role-Based Access Control

### Organizer

Organizers can:

- Create events
- Update their own events
- Delete their own events
- View attendees for their own events

### Attendee

Attendees can:

- Browse events
- View event details
- Book tickets
- View their tickets
- Cancel their own tickets

Unauthorized roles are prevented from accessing restricted endpoints.

---

## Rate Limiting

The ticket booking endpoint is limited to 10 requests per minute.

When the limit is exceeded, the API returns:

HTTP 429 Too Many Requests

This protects the booking system from excessive requests.

---

## Firestore Collections

### users

Stores registered user information and roles.

### events

Stores event information, organizer information, pricing, capacity, location, date, and available tickets.

### tickets

Stores ticket bookings, quantities, payment information, booking references, status, and booking timestamps.

---

## Error Handling

The API handles various error conditions including:

- Invalid authentication
- Missing authentication token
- Invalid user roles
- Unauthorized access
- Invalid event IDs
- Insufficient ticket availability
- Invalid booking requests
- Ticket ownership violations
- Rate limit violations
- Firebase/database errors

Appropriate HTTP status codes are returned for successful and unsuccessful requests.

---

## Testing

The API was tested using Swagger UI and Firebase Firestore.

Testing includes:

- User registration
- User login
- User profile
- Event creation
- Event retrieval
- Attendee registration
- Attendee login
- Ticket booking
- Multiple ticket bookings
- Firestore inventory verification
- Insufficient ticket validation
- Ticket cancellation
- Inventory restoration
- My Tickets
- Rate limiting
- Organizer attendee list
- Role-based access restrictions

Screenshots of the API testing and Firestore results are available in the docs folder.

---

## Screenshots

All assignment testing screenshots are stored in:

docs/

The screenshots demonstrate:

- Swagger API testing
- Authentication
- Event creation
- Ticket booking
- Firestore records
- Ticket availability validation
- Rate limiting
- Ticket cancellation
- Inventory restoration
- Role-based access control
- Organizer attendee listing

The screenshots are kept separately in the docs folder to keep the README clean and organized.

---

## Security

Sensitive configuration files must not be committed to the repository.

The following files and folders are excluded from version control:

- .env
- Firebase service account credentials
- node_modules

The repository contains .env.example as a safe configuration reference.

---

## Assignment Requirements

| Requirement | Status |
|---|---|
| Authentication | Complete |
| JWT Authorization | Complete |
| Role-Based Access Control | Complete |
| Event Management | Complete |
| Ticket Booking | Complete |
| Firestore Transactions | Complete |
| Overselling Prevention | Complete |
| Ticket Cancellation | Complete |
| Inventory Restoration | Complete |
| Booking Rate Limiting | Complete |
| Swagger / OpenAPI | Complete |
| Error Handling | Complete |
| Firebase Firestore | Complete |
| API Testing Screenshots | Complete |

---

## Conclusion

This project implements a complete Event Management and Ticketing API with authentication, authorization, event management, ticket booking, Firestore transactions, rate limiting, validation, error handling, and Swagger documentation.

The use of Firestore atomic transactions ensures reliable ticket inventory management and prevents ticket overselling during concurrent bookings.

All API testing screenshots are included in the docs folder.
