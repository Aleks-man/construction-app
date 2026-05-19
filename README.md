# Construction Management App

Full-stack web application for construction project management.

This project is currently in active development.

The backend is built with Express, TypeScript, Prisma and PostgreSQL. The frontend is initialized with React and Vite. Core backend features are already implemented, and frontend development continues.

---

## Tech Stack

Frontend:
- React
- TypeScript
- Vite

Backend:
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL

---

## Project Structure

```txt
construction-project/
  construction-backend/
  construction-frontend/
```

---

## Getting Started

### Clone repository

```bash
git clone https://github.com/Aleks-man/construction-app.git
cd construction-app
```

---

## Backend

```bash
cd construction-backend
npm install
```

Create local environment file:

```bash
copy .env.example .env
```

Update `.env` values if needed:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/construction_app"
PORT=3000
FRONTEND_ORIGINS="http://localhost:5173"
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN="1d"
SEED_ADMIN_EMAIL="admin@test.com"
SEED_ADMIN_PASSWORD="123456"
```

Run database setup:

```bash
npx prisma generate
npx prisma migrate dev
```

Create initial admin user:

```bash
npm run seed
```

Default development admin:

```txt
email: admin@test.com
password: 123456
```

Start backend:

```bash
npm run dev
```

Backend runs on:

```txt
http://localhost:3000
```

On Windows PowerShell, if `npx prisma ...` is blocked by execution policy, use `npx.cmd prisma ...` instead.

Health check:

```http
GET http://localhost:3000/health
```

Authentication:

```http
POST http://localhost:3000/auth/login
```

Request body:

```json
{
  "email": "admin@test.com",
  "password": "123456"
}
```

Use the returned token for protected routes:

```txt
Authorization: Bearer <token>
```

Current user endpoint:

```http
GET http://localhost:3000/auth/me
```

---

## Frontend

```bash
cd ../construction-frontend
npm install
npm run dev
```

Frontend runs on:

```txt
http://localhost:5173
```

---

## Current Status

- Project initialized
- Backend setup completed with Express, TypeScript and Prisma
- PostgreSQL connected
- Core CRUD API implemented for users, projects, stages and tasks
- Frontend scaffold created with React and Vite
- CORS configured with allowed frontend origins
- User passwords secured with bcrypt hashing
- JWT authentication added with login and current user endpoints
- API routes protected with authentication and role-based access control
- Prisma database seed configured for bootstrapping the initial admin user

---

## Note

This is an early-stage project. Features and structure will be extended during development.
