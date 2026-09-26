# Visitor Management System (MERN)

A full-stack visitor management system: staff (Admin / Security / Employee) log in,
register visitors with a photo, generate a QR-coded pass and a printable PDF badge,
and check visitors in/out by scanning the QR code. Admins and Security can search
and filter the visit log and export it to Excel.

## Features

- **Authentication & Role-Based Access Control** — JWT login for `Admin`, `Security`
  and `Employee` roles. The frontend has a real login screen, stores the token, sends
  it as an `Authorization: Bearer <token>` header on every API call, and shows/hides
  pages based on role.
- **Visitor registration with photo upload** — the registration form accepts a photo
  (`multipart/form-data`, handled with `multer`), stored on the server and shown on
  the visitor's badge.
- **QR pass generation** — each registration creates a `Pass` document and a QR code
  (via `qrcode`) encoding the pass ID.
- **PDF badge generation** — a printable badge (photo + visitor details + QR code) is
  generated with `pdfkit` and can be downloaded immediately after registration.
- **QR check-in / check-out** — the Scanner page reads a pass's QR code and the API
  automatically toggles between `Check-In` and `Check-Out` based on the visitor's last
  logged action.
- **Admin Dashboard** — search by name/phone/email, filter by action and date range,
  and export the filtered log to Excel (`xlsx`).

## Project structure

```
├── backend/           # Express + MongoDB API
│   ├── server.js
│   ├── seed.js         # creates demo staff logins + a sample visitor/pass
│   └── src/
│       ├── config/      # MongoDB connection
│       ├── controllers/ # auth + visitor business logic
│       ├── middleware/  # JWT auth, role checks, photo upload (multer)
│       ├── models/      # User, Visitor, Pass, CheckLog, Appointment, Task
│       ├── routes/      # /api/auth, /api/visitors
│       └── utils/       # mailer, PDF badge generator
└── frontend/           # React + Vite + Tailwind CSS
    └── src/
        ├── api/          # axios instance that attaches the JWT
        ├── context/      # AuthContext (login/logout/current user)
        ├── components/   # Navbar, ProtectedRoute
        └── pages/        # Login, Dashboard, PreRegister, Scanner
```

## Prerequisites

- Node.js 18+
- A MongoDB database (local `mongod` or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env   # then fill in MONGO_URI and JWT_SECRET at minimum
npm run seed            # creates demo staff users + one sample visitor/pass
npm run dev              # starts the API on http://localhost:5000
```

Environment variables (`backend/.env`):

| Variable        | Required | Description                                                         |
|-----------------|----------|-----------------------------------------------------------------------|
| `MONGO_URI`     | yes      | MongoDB connection string                                            |
| `JWT_SECRET`    | yes      | Secret used to sign JWTs                                              |
| `PORT`          | no       | Defaults to `5000`                                                    |
| `EMAIL_USER` / `EMAIL_PASS` | no | Gmail credentials to email visitors their pass. Registration works fine without these — email sending is just skipped. |
| `CLIENT_ORIGIN` | no       | Comma-separated list of allowed frontend origins for CORS             |

Running `npm run seed` prints three demo logins (password for all: `Password123!`):

| Role     | Email             |
|----------|-------------------|
| Admin    | admin@demo.com    |
| Security | security@demo.com |
| Employee | employee@demo.com |

> Change/remove these before using the app with real data.

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL to your backend URL
npm run dev              # starts the app on http://localhost:5173
```

`frontend/.env`:

```
VITE_API_URL=http://localhost:5000
```

## 3. Using the app

1. Go to `/login` and sign in as `Employee` (or `Admin`) to reach **Register Visitor**.
2. Fill in the visitor's details, optionally attach a photo, and submit. A QR pass and
   PDF badge are generated; download the badge from the confirmation screen.
3. Sign in as `Security` (or `Admin`) and open **Scan Pass**. Scanning the visitor's QR
   code records a **Check-In**; scanning the same code again later records a
   **Check-Out** — no extra button needed, the API toggles automatically.
4. Open **Dashboard** (Admin/Security) to search, filter by action/date, and export the
   log to Excel.

## API reference

| Method | Endpoint                        | Access             | Description                                    |
|--------|----------------------------------|---------------------|------------------------------------------------|
| POST   | `/api/auth/register`             | public (setup only) | Create a staff user (`Admin`/`Security`/`Employee`) |
| POST   | `/api/auth/login`                | public              | Returns `{ token, role, name }`                 |
| GET    | `/api/auth/me`                   | authenticated       | Returns the current user (for session restore) |
| POST   | `/api/visitors/register`         | Admin, Employee     | `multipart/form-data`: `name, email, phone, purpose, validUntil, photo` |
| POST   | `/api/visitors/scan`             | Admin, Security     | Body: `{ qrData: passId }`; toggles check-in/out |
| GET    | `/api/visitors/logs`             | Admin, Security     | Query: `search, action, from, to`               |
| GET    | `/api/visitors`                  | Admin, Security     | Query: `search, status`; visitors + their pass   |
| GET    | `/api/visitors/badge/:passId`    | public (unguessable ID) | Downloads the visitor's PDF badge          |

## Deployment notes

- **Backend**: deploy `backend/` to a Node host (Render, Railway, etc.). Set the env
  vars above. Uploaded photos and generated badges are written to the server's local
  disk (`backend/uploads`, `backend/badges`) — on hosts with an ephemeral filesystem
  (e.g. free Render/Vercel tiers) these are cleared on redeploy/restart, so for a
  production deployment swap the storage layer for a persistent store (e.g. S3 or
  Cloudinary) if you need uploads to survive restarts.
- **Frontend**: deploy `frontend/` (e.g. to Vercel) and set `VITE_API_URL` to your
  deployed backend's URL in the project's environment variables.
- Set `CLIENT_ORIGIN` on the backend to your deployed frontend URL so CORS allows it.

## Screenshots

Screenshots aren't included in this archive — add them here after you run the app
locally or against your deployment, e.g.:

```
docs/screenshots/login.png
docs/screenshots/register-visitor.png
docs/screenshots/badge-pdf.png
docs/screenshots/scanner.png
docs/screenshots/dashboard.png
```

A quick way to capture a full set: log in as each role, register a visitor with a
photo, download its badge, scan the pass twice (check-in then check-out), and screenshot
the dashboard with a search/filter applied.
