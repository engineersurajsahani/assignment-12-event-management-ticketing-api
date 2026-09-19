# 🎟️ Event Management & Ticketing REST API (Assignment 12)

🚀 **Live Deployment Links:**
- **Render:** [https://samarth-assignment-12-event-ticketing-api.onrender.com](https://samarth-assignment-12-event-ticketing-api.onrender.com)
- **Vercel:** [https://samarth-assignment-12-event-ticketi.vercel.app](https://samarth-assignment-12-event-ticketi.vercel.app)

---

- **Name:** Samarth Navale
- **Roll No:** 150096725148
- **Cohort:** Sam Altman

---

A high-concurrency **Event Ticketing & Live Booking REST API** backed by **Google Firebase Firestore**, secured with **JWT Role-Based Access Control** (`Organizer` vs `Attendee`), hardened with **API Rate Limiting** to prevent ticket-scalping bots, and documented comprehensively with **Swagger OpenAPI 3.0**. Features Firestore atomic transactions (`runTransaction`) to guarantee tickets are never oversold under concurrent load.

---

## 🚀 Features

- 🔐 **JWT Authentication & RBAC**: Strict separation of roles (`Organizer` creates events, `Attendee` books tickets).
- 🎪 **Event Management**: Create, browse, update, filter by category/city, and inspect attendee rosters.
- 🎟️ **Atomic Concurrency Transactions**: Zero overselling via transactional inventory checks and decrements.
- 🛡️ **Anti-Bot Rate Limiting**: Max 10 booking requests/min using `express-rate-limit`.
- 📊 **Swagger OpenAPI 3.0**: Interactive documentation available at `/api-docs`.
- 📮 **Postman Collection Included**: Complete collection with token variables and role tests.

---

## 📁 Project Folder Structure

```text
📂 Assignment12/
├── 📄 render.yaml
├── 📄 vercel.json
├── 📄 Assignment 12.txt
├── 📄 README.md
└── 📂 Samarth_Navale_150096725148/
    ├── 📄 server.js
    ├── 📄 package.json
    ├── 📄 .env & .env.example
    ├── 📄 .gitignore
    ├── 📄 render.yaml & vercel.json
    ├── 📄 README.md
    ├── 📂 config/
    │   ├── 📄 firebaseConfig.js
    │   └── 📄 swagger.js
    ├── 📂 middleware/
    │   ├── 📄 auth.js
    │   ├── 📄 checkRole.js
    │   ├── 📄 rateLimiter.js
    │   ├── 📄 logger.js
    │   └── 📄 errorHandler.js
    ├── 📂 controllers/
    │   ├── 📄 authController.js
    │   ├── 📄 eventController.js
    │   └── 📄 ticketController.js
    ├── 📂 routes/
    │   ├── 📄 authRoutes.js
    │   ├── 📄 eventRoutes.js
    │   └── 📄 ticketRoutes.js
    └── 📂 docs/
        ├── 📄 swagger.yaml
        └── 📂 postman/
            └── 📄 EventTicketingAPI.postman_collection.json
```

---

## 🛠️ Tech Stack & Dependencies

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database / Auth:** Firebase Admin Firestore & JWT
- **Documentation:** Swagger UI Express & OpenAPI 3.0
- **Security:** Helmet, CORS, Express Rate Limit
- **Testing:** Supertest

---

## ⚙️ Environment Variables

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=supersecretjwtkey_event12
```

---

## 🧪 Testing

```bash
cd Samarth_Navale_150096725148
npm install
npm test
```
