# Construction Management App

Fullstack web application for construction project management.

This project is currently in the initial development stage.

Backend is set up with Express, Prisma and PostgreSQL. Frontend is initialized with React + Vite. Basic project structure is ready and development continues.

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

construction-project/
  construction-backend/
  construction-frontend/

---

## Getting Started

### Clone repository

git clone https://github.com/Aleks-man/construction-app.git
cd construction-app

---

## Backend

cd construction-backend
npm install

Create .env file:

DATABASE_URL=postgresql://user:password@localhost:5432/db_name

Run database setup:

npx prisma generate
npx prisma migrate dev

Start backend:

npm run dev

Backend runs on:
http://localhost:3000

---

## Frontend

cd ../construction-frontend
npm install
npm run dev

Frontend runs on:
http://localhost:5173

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
- API routes protected with authentication and role-based access contro
- Database seed added for initial admin user setup

---

## Note

This is an early-stage project. Features and structure will be extended during development.
