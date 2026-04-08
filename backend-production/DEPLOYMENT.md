# Deployment Guide

## 🚀 Production Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Prisma Client generated
- [ ] Security settings verified
- [ ] Health checks tested

### Environment Variables

Ensure these are set in your deployment platform:

#### Required
```bash
DATABASE_URL=mysql://...
JWT_SECRET=<strong-random-32-char-string>
FRONTEND_URL_CLIENT=https://...
FRONTEND_URL_TRAINER=https://...
FRONTEND_URL_ADMIN=https://...
NODE_ENV=production
```

#### Optional
```bash
PORT=3000
APP_BASE_URL=https://your-api.com
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
```

### Railway Deployment

1. **Create New Project**
   - Go to Railway dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"

2. **Add MySQL Database**
   - Click "+ New" → "Database" → "Add MySQL"
   - Railway will provide `DATABASE_URL` automatically

3. **Configure Service**
   - Connect your GitHub repository
   - Select `backend-production` folder (if in monorepo)
   - Railway will auto-detect Node.js

4. **Set Environment Variables**
   ```bash
   DATABASE_URL=<from MySQL service>
   JWT_SECRET=<generate-strong-secret>
   FRONTEND_URL_CLIENT=<your-client-url>
   FRONTEND_URL_TRAINER=<your-trainer-url>
   FRONTEND_URL_ADMIN=<your-admin-url>
   NODE_ENV=production
   ```

5. **Configure Build & Start**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Root Directory: `backend-production` (if in monorepo)

6. **Deploy**
   - Railway will automatically deploy on push
   - Check logs for any errors

### Generating JWT_SECRET

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Post-Deployment Verification

1. **Check Health Endpoints**
   ```bash
   curl https://your-api.railway.app/health
   curl https://your-api.railway.app/health/db
   ```

2. **Test API Endpoints**
   - Try authentication endpoints
   - Verify CORS is working
   - Check error responses

3. **Monitor Logs**
   - Watch for any errors
   - Check database connections
   - Verify all routes are accessible

### Common Issues

#### Database Connection Failed
- Verify `DATABASE_URL` is correct
- Check if database service is running
- Verify network connectivity

#### JWT_SECRET Error
- Ensure JWT_SECRET is set
- Must be at least 32 characters
- Should be unique per environment

#### CORS Errors
- Verify `FRONTEND_URL_*` variables
- Check URLs include protocol (https://)
- Ensure no trailing slashes

#### Build Failures
- Check Node.js version (>=18)
- Verify all dependencies in package.json
- Check TypeScript compilation errors

### Rollback

If deployment fails:
1. Go to Railway dashboard
2. Select deployment
3. Click "Redeploy" → Select previous successful deployment

### Monitoring

Set up monitoring for:
- Application uptime
- Database connection status
- API response times
- Error rates
- Resource usage

---

**Ready for Production** ✅

