# Construction Management App

Full-stack construction project management application for organizing projects, stages, teams and field tasks.

The project is built as a portfolio-grade full-stack application with role-based access, JWT authentication, PostgreSQL persistence and a React dashboard for day-to-day project work.

Live demo: https://construction-app-mauve.vercel.app

Demo account:
```txt
email: admin@test.com
password: DemoAdmin_2026_App_passW
```

---

## Tech Stack

Frontend:
- React
- TypeScript
- Vite
- React Router

Backend:
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT
- bcrypt

---

## Core Features

Backend:
- Layered Express architecture with routes, controllers, services and repositories
- PostgreSQL database integration through Prisma ORM
- JWT authentication with current-user endpoint
- Password hashing with bcrypt
- Role-based access control for protected API routes
- User, project, project member, stage and task management
- Safe user deletion with project membership cleanup and task unassignment
- Unique project name validation with conflict responses
- Transactional project deletion with related stages, tasks and members
- Transactional stage deletion with related tasks
- Extended task model with description, priority, due date and timestamps
- Task filtering by status, priority, assignee, stage and due date range
- Assigned workers can update only their own task statuses
- Project activity log for project, member, stage and task changes
- Initial admin user setup with Prisma seed
- CORS configuration for frontend-backend communication
- Backend API tests for authentication, project validation and worker task permissions

Frontend:
- Protected authentication flow with login, token storage and redirect handling
- Shared dashboard layout with navigation, user role display and logout
- Projects page with project creation, duplicate-name feedback and project cards
- Project details page with project summary, stages, tasks and project members
- Project name editing and admin-only project deletion
- Project member management with user creation, assignment and removal
- Admin user management page with role filters, user creation and deletion
- Stage creation, editing and deletion with confirmation
- Task creation with title, description, priority, due date and assignee
- Task editing and deletion for admins and managers
- Role-aware task status updates
- Project activity timeline for recent team actions
- My Tasks dashboard with filters, task summary and quick status updates
- Loading, empty and error states for main workflows

---

## User Roles

Admin:
- Manage projects, stages, tasks and project members
- Create users and assign them to projects
- Delete projects
- View team tasks across projects

Manager:
- Manage projects, stages and tasks
- Manage current project members where allowed by the UI
- View team tasks across projects

Worker:
- View assigned tasks
- Update the status of assigned tasks
- Cannot create or delete management entities

---

## Main Workflows

- Sign in with the seeded admin account
- Create a project with a unique name
- Add project members or create new users
- Create stages inside a project
- Create and assign tasks inside stages
- Edit project, stage and task details
- Track task progress from project details or the My Tasks dashboard
- Delete tasks, stages or projects with confirmation where the role allows it

---

## Screenshots

### Login

![Login screen](docs/screenshots/login.png)

### Projects

![Projects page](docs/screenshots/projects.png)

### Project Details

![Project details page](docs/screenshots/project-details.png)

### My Tasks

![My Tasks dashboard](docs/screenshots/my-tasks.png)

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
- `GET /projects/:id/activity`
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
    prisma/
    src/
      controllers/
      middlewares/
      repositories/
      routes/
      services/
      utils/
  construction-frontend/
    src/
      api/
      auth/
      components/
      layout/
      pages/
```

---

## Getting Started

### Clone repository

```bash
git clone https://github.com/Aleks-man/construction-app.git
cd construction-app
```

---

## Backend Setup

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
NODE_ENV="development"
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

---

## Frontend Setup

```bash
cd ../construction-frontend
npm install
npm run dev
```

Frontend runs on:

```txt
http://localhost:5173
```

Create local frontend environment file if the backend URL differs from the default:

```bash
copy .env.example .env
```

```env
VITE_API_URL="http://localhost:3000"
```

---

## Deployment

Recommended free deployment setup:
- Frontend: Vercel
- Backend: Render
- Database: Neon PostgreSQL

### Backend Deployment

Deploy `construction-backend` as a Node.js web service.

Environment variables:

```env
DATABASE_URL="postgresql://..."
NODE_ENV="production"
FRONTEND_ORIGINS="https://your-frontend-domain.vercel.app"
JWT_SECRET="replace-with-a-long-random-production-secret"
JWT_EXPIRES_IN="1d"
SEED_ADMIN_EMAIL="admin@test.com"
SEED_ADMIN_PASSWORD="replace-with-a-demo-password"
```

The hosting platform usually provides `PORT` automatically in production.

Build command:

```bash
npm ci --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build
```

If the host installs only production dependencies during build, TypeScript may fail because type packages are stored in `devDependencies`. Keep dev dependencies available during the build step, for example by setting:

```env
NPM_CONFIG_PRODUCTION=false
```

Start command:

```bash
npm start
```

After the first deployment, create the demo admin user:

```bash
npm run seed
```

### Frontend Deployment

Deploy `construction-frontend` as a Vite application.

Environment variables:

```env
VITE_API_URL="https://your-backend-domain.onrender.com"
```

Build command:

```bash
npm run build
```

Output directory:

```txt
dist
```

The frontend includes a Vercel rewrite configuration so protected routes and project detail URLs continue to work after a browser refresh.

Note: if the backend is hosted on a free Render instance, the first request after inactivity may take a few seconds while the service wakes up.

---

## Useful Checks

Backend build:

```bash
cd construction-backend
npm run build
```

Backend API tests:

```bash
cd construction-backend
npm test
```

Frontend lint and build:

```bash
cd construction-frontend
npm run lint
npm run build
```

Health check:

```http
GET http://localhost:3000/health
```

Login:

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

## Development Status

The core backend and frontend workflows are implemented. The application currently covers authentication, role-based access control, project management, stage management, task management, member assignment, activity history and a role-aware My Tasks dashboard.

Planned improvements may include deployment configuration, broader test coverage, richer reporting, file attachments and realtime updates.
