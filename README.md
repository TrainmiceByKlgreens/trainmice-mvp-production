# TrainMICE Production Platform

A comprehensive training management platform with separate applications for backend API, admin dashboard, client portal, and trainer portal.

## 📦 Project Structure

This is a monorepo containing four main applications:

```
Trainmice Production/
├── backend-production/          # Backend API (Express + TypeScript + Prisma + MySQL)
├── projectAdmin-production/     # Admin Dashboard (React + Vite + TypeScript)
├── projectClient-production/    # Client Portal (React + Vite + TypeScript)
└── projectTrainer-production/  # Trainer Portal (React + Vite + TypeScript)
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MySQL database (for backend)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd "Trainmice Production"
   ```

2. **Install dependencies for each project**
   ```bash
   # Backend
   cd backend-production
   npm install
   cd ..

   # Admin Dashboard
   cd projectAdmin-production
   npm install
   cd ..

   # Client Portal
   cd projectClient-production
   npm install
   cd ..

   # Trainer Portal
   cd projectTrainer-production
   npm install
   cd ..
   ```

3. **Set up environment variables**

   Each project has its own `.env` file. See individual README files for details:
   - `backend-production/README.md`
   - `projectAdmin-production/README.md`
   - `projectClient-production/README.md`
   - `projectTrainer-production/README.md`

## 📚 Individual Project Documentation

Each project has its own detailed README:

- **[Backend API](./backend-production/README.md)** - Express server with Prisma ORM
- **[Admin Dashboard](./projectAdmin-production/README.md)** - Admin management interface
- **[Client Portal](./projectClient-production/README.md)** - Client-facing application
- **[Trainer Portal](./projectTrainer-production/README.md)** - Trainer management interface

## 🏗️ Architecture

### Backend (`backend-production`)
- **Stack**: Express.js, TypeScript, Prisma ORM, MySQL
- **Features**: RESTful API, JWT authentication, file uploads, email support
- **Deployment**: Railway (recommended) or any Node.js hosting

### Frontend Applications
All three frontend applications share similar tech stacks:
- **Stack**: React 18, TypeScript, Vite 7, Tailwind CSS
- **Deployment**: Vercel (recommended) or any static hosting

## 🚀 Development

### Running All Services Locally

1. **Start Backend** (from `backend-production/`)
   ```bash
   npm run dev
   ```
   Backend runs on `http://localhost:3000` (or PORT from .env)

2. **Start Admin Dashboard** (from `projectAdmin-production/`)
   ```bash
   npm run dev
   ```

3. **Start Client Portal** (from `projectClient-production/`)
   ```bash
   npm run dev
   ```

4. **Start Trainer Portal** (from `projectTrainer-production/`)
   ```bash
   npm run dev
   ```

## 🗄️ Database Setup

1. **Create MySQL database**
2. **Configure `DATABASE_URL` in `backend-production/.env`**
3. **Run migrations** (from `backend-production/`)
   ```bash
   npm run db:generate
   npm run db:migrate:deploy
   ```

## 📦 Deployment

### Backend Deployment
- **Recommended**: Railway
- See [backend-production/DEPLOYMENT.md](./backend-production/DEPLOYMENT.md)

### Frontend Deployment
- **Recommended**: Vercel
- See individual deployment guides:
  - [projectAdmin-production/DEPLOYMENT.md](./projectAdmin-production/DEPLOYMENT.md)
  - [projectClient-production/DEPLOYMENT.md](./projectClient-production/DEPLOYMENT.md)
  - [projectTrainer-production/DEPLOYMENT.md](./projectTrainer-production/DEPLOYMENT.md)

## 🔒 Security

- JWT-based authentication
- Environment variables for sensitive data
- CORS configuration
- Helmet.js security headers (backend)
- Input validation and sanitization

## 🛠️ Tech Stack Summary

### Backend
- Express.js
- TypeScript
- Prisma ORM
- MySQL
- JWT
- bcryptjs
- Nodemailer

### Frontend (All Apps)
- React 18
- TypeScript
- Vite 7
- Tailwind CSS
- React Router (Client & Trainer)
- Lucide React (icons)

## 📝 License

ISC

## 👥 Support

For issues and questions, please open an issue on GitHub.

---

**Production Ready** ✅ | **Fully Documented** ✅ | **Type-Safe** ✅

