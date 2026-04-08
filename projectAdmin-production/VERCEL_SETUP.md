# Vercel Deployment - Quick Start

## 🚀 Deploy in 5 Minutes

### Step 1: Push to GitHub
```bash
cd projectAdmin-production
git init
git add .
git commit -m "Production-ready admin dashboard"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Vercel auto-detects:
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Step 3: Configure Environment Variables

In Vercel dashboard:
- Go to **Settings** → **Environment Variables**
- Add:
  ```
  VITE_API_URL = https://your-backend-api.com/api
  ```
- Click **"Redeploy"** to apply

### Step 4: Deploy!

Click **"Deploy"** - Your app will be live in ~2 minutes!

## ✅ Post-Deployment

1. **Test your app**: Visit the deployment URL
2. **Add custom domain** (optional): Settings → Domains
3. **Enable auto-deploy**: Every push to main = new deployment

## 🔧 Troubleshooting

**Build fails?**
- Check build logs in Vercel dashboard
- Verify Node.js version (auto-detected, should be 18+)
- Check environment variables are set

**API not connecting?**
- Verify `VITE_API_URL` is correct
- Ensure backend CORS allows your Vercel domain
- Check network tab in browser console

**404 errors on routes?**
- `vercel.json` should handle SPA routing
- Verify `rewrites` configuration is correct

---

**Ready!** 🎉

