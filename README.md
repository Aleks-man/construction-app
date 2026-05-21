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

## Features

Backend:
- User, project, stage and task management
- Extended task model with description, priority, due date and timestamps
- Task filtering by status, priority, assignee, stage and due date range
- Assigned workers can update the status of their own tasks
- PostgreSQL database integration with Prisma ORM
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control for protected API routes
- Initial admin user setup with Prisma seed
- CORS configuration for frontend-backend communication
- Layered structure with routes, controllers, services and repositories

Frontend:
- React and Vite project scaffold
- TypeScript setup
- Frontend authentication flow with login screen, token storage and protected routes
- Frontend API clients for authentication and projects
- Frontend application development in progress

---

## API Overview

Auth:
- `POST /auth/login`
- `GET /auth/me`

Users:
- `GET /users`
- `POST /users`
- `GET /users/:id`
- `PATCH /users/:id`
- `DELETE /users/:id`

Projects:
- `GET /projects`
- `POST /projects`
- `GET /projects/:id`
- `PATCH /projects/:id`
- `DELETE /projects/:id`

Project members:
- `GET /project-users`
- `POST /project-users`
- `DELETE /project-users/:projectId/:userId`

Stages:
- `GET /stages`
- `POST /stages`
- `GET /stages/:id`
- `PATCH /stages/:id`
- `DELETE /stages/:id`

Tasks:
- `GET /tasks`
- `POST /tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id/status`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`

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

Backend core functionality is implemented. Frontend development is in progress.

---

## Note

Features and structure will be extended during development.
