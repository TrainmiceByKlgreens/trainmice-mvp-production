# TrainMICE Backend API

Production-ready backend API for TrainMICE platform built with Express, TypeScript, Prisma, and PostgreSQL.

## 🚀 Features

- ✅ **Production-Ready**: Enhanced security, error handling, and logging
- ✅ **Type-Safe**: Full TypeScript support with strict mode
- ✅ **Secure**: Helmet.js security headers, CORS validation, JWT authentication
- ✅ **Database**: Prisma ORM with PostgreSQL
- ✅ **Health Checks**: Built-in health check endpoints
- ✅ **Error Handling**: Comprehensive error handling and logging
- ✅ **Email Support**: Optional SMTP email (disabled by default to prevent timeouts)

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL database
- Railway account (recommended) or any hosting platform

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd backend-production
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Strong random secret (min 32 chars)
   - `FRONTEND_URL_*`: Your frontend application URLs
   - Other optional settings

4. **Generate Prisma Client**
   ```bash
   npm run db:generate
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate:deploy
   ```

## 🏃 Running the Application

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Production with Environment
```bash
NODE_ENV=production npm start
```

## 📁 Project Structure

```
backend-production/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # Prisma client setup
│   │   └── env.ts       # Environment variables
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # JWT authentication
│   │   └── upload.ts    # File upload handling
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── scripts/         # Database scripts
│   └── server.ts        # Application entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── dist/                # Compiled JavaScript (generated)
├── .env.example         # Environment variables template
├── package.json
└── tsconfig.json
```

## 🔒 Security Features

- **Helmet.js**: Security headers protection
- **CORS**: Configurable origin validation
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Express-validator for request validation
- **Environment Validation**: Required env vars checked on startup
- **Password Hashing**: bcryptjs for secure password storage

## 🌐 API Endpoints

### Health Checks
- `GET /health` - Server health check
- `GET /health/db` - Database connection check

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification

### Other endpoints
See route files in `src/routes/` for complete API documentation.

## 🗄️ Database

### Prisma Commands

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes (development)
npm run db:push

# Create migration
npm run db:migrate

# Apply migrations (production)
npm run db:migrate:deploy

# Open Prisma Studio
npm run db:studio
```

## 📦 Deployment

### Railway (Recommended)

1. **Create a new Railway project**
2. **Add PostgreSQL database service**
3. **Add Node.js service**
4. **Connect to your GitHub repository**
5. **Set environment variables** in Railway dashboard:
   - `DATABASE_URL` (auto-provided if using Railway PostgreSQL)
   - `JWT_SECRET` (generate a strong secret)
   - `FRONTEND_URL_CLIENT`, `FRONTEND_URL_TRAINER`, `FRONTEND_URL_ADMIN`
   - `NODE_ENV=production`
   - `PORT` (Railway auto-provides this)

6. **Configure build settings**:
   - Build command: `npm install && npm run build`
   - Start command: `npm start`

### Other Platforms

Similar setup applies for other platforms like:
- Heroku
- AWS Elastic Beanstalk
- DigitalOcean App Platform
- Vercel (Serverless)

## 🔍 Health Monitoring

The application provides health check endpoints:

```bash
# Server health
curl https://your-api.com/health

# Database health
curl https://your-api.com/health/db
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify `DATABASE_URL` is correct
   - Check database is accessible
   - Verify network/firewall settings

2. **JWT_SECRET Error**
   - Ensure `JWT_SECRET` is set in production
   - Must be at least 32 characters

3. **CORS Errors**
   - Verify `FRONTEND_URL_*` environment variables
   - Check URLs are correct and include protocol (https://)

4. **Email Timeout Errors**
   - Email is disabled by default
   - To enable, configure SMTP settings
   - See `EMAIL_DISABLED.md` for details

## 📝 Environment Variables

See `.env.example` for all available environment variables.

**Required in Production:**
- `DATABASE_URL`
- `JWT_SECRET`
- At least one `FRONTEND_URL_*`

**Optional:**
- `SMTP_*` (for email functionality)
- `MAX_FILE_SIZE`
- `ALLOWED_MIME_TYPES`

## 🛠️ Development

### Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma Client
npm run db:studio    # Open Prisma Studio
```

## 📄 License

ISC

## 👥 Support

For issues and questions, please open an issue on GitHub.

---

**Production Ready** ✅ | **Security Hardened** ✅ | **Fully Documented** ✅
