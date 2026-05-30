# Project Management App

Full-stack project management application for organizing projects, teams, stages and tasks.

The project includes role-based access control, JWT authentication, PostgreSQL persistence, activity history and a responsive React dashboard.

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
- i18next

Backend:
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT
- bcrypt

---

## Features

Backend:
- Layered Express architecture with routes, controllers, services and repositories
- PostgreSQL integration through Prisma ORM
- JWT authentication and current-user endpoint
- Password hashing with bcrypt
- Role-based access control for Admin, Manager and Worker users
- User contact profile, project member, stage and task management
- Unique project name validation
- Safe user deletion with project membership cleanup and task unassignment
- Transactional project deletion with related stages, tasks and members
- Transactional stage deletion with related tasks
- Extended task model with description, priority, due date and timestamps
- Task filtering by status, priority, assignee, stage and due date range
- Worker permission rules for assigned task status updates
- Manager permissions scoped to assigned projects
- Project activity log for project, member, stage and task changes
- Prisma seed for initial admin user
- Backend API tests for authentication, project validation and worker task permissions

Frontend:
- Protected login flow with token storage and redirects
- English/Russian language switcher with saved preference
- Responsive dashboard layout with navigation and logout
- Project creation, editing, membership badge and deletion
- Project details page with stages, tasks, members and activity history
- User and project member management with contact details
- Task creation, editing, deletion, filtering and role-aware status updates
- My Tasks dashboard scoped by user role and project assignment
- Confirmation dialogs for destructive actions
- Loading, empty and error states

---

## User Roles

Admin:
- Manages users, projects, members, stages and tasks
- Can delete projects and users
- Can view work across projects

Manager:
- Manages projects, stages, tasks and project members where available
- Can view team work across projects

Worker:
- Views assigned tasks
- Updates the status of assigned tasks
- Cannot create or delete management entities

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
      i18n/
      layout/
      pages/
```

---

## Local Setup

Clone repository:

```bash
git clone https://github.com/Aleks-man/construction-app.git
cd construction-app
```

Backend:

```bash
cd construction-backend
npm install
copy .env.example .env
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev
```

Backend runs on:

```txt
http://localhost:3000
```

Default local admin:

```txt
email: admin@test.com
password: 123456
```

Frontend:

```bash
cd ../construction-frontend
npm install
copy .env.example .env
npm run dev
```

Frontend runs on:

```txt
http://localhost:5173
```

On Windows PowerShell, if `npx prisma ...` is blocked by execution policy, use `npx.cmd prisma ...` instead.

---

## Environment Variables

Backend `.env`:

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

Frontend `.env`:

```env
VITE_API_URL="http://localhost:3000"
```

---

## Deployment

Current setup:
- Frontend: Vercel
- Backend: Render
- Database: Neon PostgreSQL

Backend build command:

```bash
npm ci --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build
```

Backend start command:

```bash
npm start
```

Frontend build command:

```bash
npm run build
```

Frontend output directory:

```txt
dist
```

Production environment variables should include:

```env
DATABASE_URL="postgresql://..."
NODE_ENV="production"
FRONTEND_ORIGINS="https://your-frontend-domain.vercel.app"
JWT_SECRET="replace-with-a-long-random-production-secret"
JWT_EXPIRES_IN="1d"
VITE_API_URL="https://your-backend-domain.onrender.com"
```

If the backend is hosted on a free Render instance, the first request after inactivity may take a few seconds while the service wakes up.

---

## Checks

Backend:

```bash
cd construction-backend
npm run build
npm test
```

Frontend:

```bash
cd construction-frontend
npm run lint
npm run build
```

Health check:

```http
GET http://localhost:3000/health
```
