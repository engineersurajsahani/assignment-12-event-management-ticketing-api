# 🎟️ Event Management & Ticketing API

A high-concurrency Event Ticketing & Live Booking REST API backed by Google Firebase Firestore.

## 👨‍🎓 Student Details

**Name:** Harsh Kumar  
**Roll No.:** 150096725105  
**Course:** BTech CSE  
**Assignment:** 12 — Event Management & Ticketing API with Firebase & Swagger  

## ✨ Features

- **Event Management:** Create, update, delete, and browse events.
- **Ticketing Engine:** Allows users to book tickets and cancel bookings.
- **ACID Transactions:** Implements Firestore atomic transactions (`runTransaction`) for concurrent ticket decrements.
- **Rate Limiting:** Protects ticketing endpoints with strict rate limiting to prevent bot spam and DDoS.
- **Swagger Documentation:** Auto-generates OpenAPI 3.0 documentation using Swagger UI and JSDoc.
- **Role-Based Access Control:** Differentiates permissions between `Organizer` and `Attendee`.

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** Google Firebase Firestore
- **Authentication:** JSON Web Tokens (JWT), bcryptjs
- **Security & Tools:** express-rate-limit, swagger-ui-express, swagger-jsdoc, dotenv

## 📁 Project Structure

```text
Harsh-Assignment-12-Event-Management-Ticketing-Api/
├── config/
│   ├── firebaseConfig.js    # Firebase Admin Firestore init
│   └── swagger.js           # Swagger specification config
├── controllers/
│   ├── authController.js    # JWT logic
│   ├── eventController.js   # Event CRUD operations
│   └── ticketController.js  # Transactional booking logic
├── middleware/
│   ├── auth.js              # JWT verification
│   ├── checkRole.js         # Organizer vs Attendee guard
│   └── rateLimiter.js       # Strict booking rate limit
├── routes/
│   ├── authRoutes.js
│   ├── eventRoutes.js
│   └── ticketRoutes.js
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js installed
- A Firebase project with a generated `serviceAccountKey.json`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/harsh4421/Harsh-Assignment-12-Event-Management-Ticketing-Api.git
   ```

2. Navigate to the project directory:
   ```bash
   cd Harsh-Assignment-12-Event-Management-Ticketing-Api
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Place your Firebase `serviceAccountKey.json` in the root folder.

5. Create a `.env` file based on `.env.example`:
   ```env
   PORT=5000
   JWT_SECRET=your_super_secret_jwt_key
   ```

6. Start the server:
   ```bash
   npm start
   ```

   For development with nodemon:
   ```bash
   npm run dev
   ```

7. Access the **Swagger API Documentation** at:
   ```
   http://localhost:5000/api-docs
   ```

## 📋 API Endpoints Summary

See the fully interactive **Swagger Documentation** (`/api-docs`) for detailed requests and responses.

- **Auth:** `/api/auth/register`, `/api/auth/login`, `/api/auth/profile`
- **Events:** `/api/events` (CRUD for events), `/api/events/:id/attendees`
- **Tickets:** `/api/tickets/book` (Rate Limited), `/api/tickets/my-tickets`, `/api/tickets/:id/cancel`
