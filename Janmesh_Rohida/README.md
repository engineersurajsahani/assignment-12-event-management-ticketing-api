# Event Management & Ticketing API with Firebase & Swagger

Production-quality Node.js REST API for Event Ticketing built with Express.js, Firebase Firestore (ACID Transactions), JWT Role-Based Access Control, anti-scalping rate limiting, and interactive Swagger/OpenAPI documentation.

---

## 📌 Features & Highlights

- **Firestore ACID Concurrency Transactions (`runTransaction`)**: Ensures zero overselling under heavy concurrent ticket booking requests.
- **JWT Role-Based Access Control (RBAC)**: Distinct permissions for `Organizer` (create/update/delete events, view attendees) and `Attendee` (book tickets, view my tickets, cancel bookings).
- **Anti-Scalper Rate Limiting**: Strict 10 req/min limit on `POST /api/tickets/book` enforced via `express-rate-limit`.
- **OpenAPI 3.0 Documentation**: Full JSDoc @swagger tags with interactive Swagger UI at `/api-docs`, customized with a Coffee Brown theme.
- **Themed Test Interface**: Off-white and Coffee Brown styled Web UI at `/` for manual end-to-end API testing.

---

## 📁 Directory Structure

```text
assignment-12-event-management-ticketing-api/
└── Janmesh_Rohida/
    ├── config/
    │   ├── firebaseConfig.js    # Firebase Admin Firestore initialization
    │   └── swagger.js           # OpenAPI 3.0 specification & custom CSS
    ├── controllers/
    │   ├── authController.js    # Register, Login, Get Profile
    │   ├── eventController.js   # List, Get, Create, Update, Delete events, List Attendees
    │   └── ticketController.js  # Transactional Ticket Booking, My Tickets, Cancel Ticket
    ├── middleware/
    │   ├── auth.js              # JWT verification middleware
    │   ├── checkRole.js         # Role guard middleware factory (Organizer vs Attendee)
    │   └── rateLimiter.js       # express-rate-limit (10 req/min for booking)
    ├── routes/
    │   ├── authRoutes.js        # /api/auth routes with @swagger comments
    │   ├── eventRoutes.js       # /api/events routes with @swagger comments
    │   └── ticketRoutes.js      # /api/tickets routes with @swagger comments
    ├── public/                  # Lightweight Coffee Brown themed test UI
    │   ├── index.html
    │   ├── style.css
    │   └── app.js
    ├── serviceAccountKey.example.json  # Placeholder structure for Firebase credentials
    ├── .env.example
    ├── .gitignore
    ├── package.json
    ├── server.js
    └── README.md
```

---

## 🚀 Setup & Installation

### 1. Prerequisites
- Node.js (v16+ recommended)
- Firebase Project with Firestore Database enabled

### 2. Firebase Credentials Setup
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a project and enable **Firestore Database** in production or test mode.
3. Go to **Project Settings** -> **Service Accounts**.
4. Click **Generate new private key** to download your JSON file.
5. Save this file as `serviceAccountKey.json` inside `Janmesh_Rohida/` (Do NOT commit this file to git).

### 3. Local Installation
```bash
cd Janmesh_Rohida

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env

# Start development server
npm run dev
```

The server will start on `http://localhost:5000`.

---

## 📚 Interactive API Documentation (Swagger UI)

Access the interactive Swagger UI documentation at:
👉 **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**

The Swagger UI is styled with a custom Coffee Brown & Off-White theme matching the application design system.

---

## 🔌 API Endpoints Table

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user as `Attendee` or `Organizer` |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT token |
| `GET` | `/api/auth/profile` | Authenticated | Retrieve current user profile & role |

### Event Management (`/api/events`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/events` | Public | Browse all events (supports `?category=...&city=...`) |
| `GET` | `/api/events/:id` | Public | View event details & live remaining ticket count |
| `POST` | `/api/events` | Organizer | Create a new event |
| `PUT` | `/api/events/:id` | Organizer | Update event details (must own event) |
| `DELETE` | `/api/events/:id` | Organizer | Cancel/delete event (must own event) |
| `GET` | `/api/events/:id/attendees` | Organizer | List registered attendees for an event (must own event) |

### Ticket Booking & Anti-Scalping (`/api/tickets`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/tickets/book` | Attendee | Book tickets atomically (Rate limit: 10 req/min) |
| `GET` | `/api/tickets/my-tickets` | Attendee | View logged-in attendee's purchased tickets |
| `POST` | `/api/tickets/:id/cancel` | Attendee | Cancel booking & restore event inventory atomically |

---

## 🧪 Testing & Verification Guide

### 1. Concurrency Oversell Protection Test
- Register an `Organizer` account and create an event with `totalCapacity: 5`.
- Register an `Attendee` account and obtain a JWT token.
- Send **10 concurrent POST requests** to `/api/tickets/book` requesting 1 ticket each using `Promise.all` or cURL/Postman.
- **Verification**: Exactly 5 requests will succeed (status 201). The remaining requests will return status 400 (`Insufficient tickets available`). `availableTickets` in Firestore will be exactly `0`, never negative!

### 2. Rate Limiting Test
- Send **11 rapid requests** within 60 seconds to `POST /api/tickets/book`.
- **Verification**: The 11th request will be rejected with HTTP status **429 Too Many Requests**:
```json
{
  "success": false,
  "message": "Too many booking attempts. Please try again in a minute."
}
```

---

## ☁️ Deploying to Render

1. **Push to GitHub** (Ensure `serviceAccountKey.json` and `.env` are in `.gitignore`):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Event Ticketing API"
   git branch -M main
   git remote add origin https://github.com/<your-username>/assignment-12-event-management-ticketing-api.git
   git push -u origin main
   ```
2. **Create Render Web Service**:
   - Root Directory: `Janmesh_Rohida`
   - Build Command: `npm install`
   - Start Command: `node server.js`
3. **Environment Variables**:
   - `FIREBASE_SERVICE_ACCOUNT`: Paste full content of `serviceAccountKey.json` as a single-line JSON string.
   - `JWT_SECRET`: Any secure secret string.

---

## 🛡️ License
Distributed under the ISC License.

Deployment Link - https://github.com/janmesh16/assignment-12-event-management-ticketing-api
