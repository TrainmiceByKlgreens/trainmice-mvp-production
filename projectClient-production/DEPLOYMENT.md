# Vercel Deployment Guide

## Quick Deploy

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Production-ready client portal"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel auto-detects Vite

3. **Configure Environment Variables**
   - Go to Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-backend-api.com/api`

4. **Deploy**
   - Click "Deploy"
   - Your app will be live in ~2 minutes!

## Environment Variables

Required for production:

```env
VITE_API_URL=https://your-backend-api.com/api
```

**Note**: Always use `https://` for production API URLs.

## Custom Domain

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

## Preview Deployments

- Every push to a branch creates a preview
- Pull requests get automatic preview URLs
- Preview deployments use production build

## Build Configuration

Vercel automatically detects:
- ✅ Build command: `npm run build`
- ✅ Output directory: `dist`
- ✅ Framework: Vite
- ✅ Node.js version: Auto-detected

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all dependencies in `package.json`
- Ensure TypeScript compiles: `npm run typecheck`

### Environment Variables Not Working
- Variable must start with `VITE_` for Vite to expose it
- Redeploy after adding/changing variables
- Check spelling in Vercel dashboard

### API Connection Errors
- Verify `VITE_API_URL` is correct
- Check backend CORS allows your Vercel domain
- Test API endpoint directly

### Routing Issues (404 on Refresh)
- `vercel.json` includes SPA rewrite rules
- All routes should redirect to `index.html`
- Verify `rewrites` configuration

---

**Ready for Production** ✅

