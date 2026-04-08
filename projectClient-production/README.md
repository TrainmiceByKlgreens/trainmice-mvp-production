# TrainMICE Client Portal

Production-ready client-facing web application for TrainMICE platform built with React, TypeScript, Vite, and Tailwind CSS.

## 🚀 Features

- ✅ **Production-Ready**: Optimized build configuration for Vercel
- ✅ **Type-Safe**: Full TypeScript support with strict mode
- ✅ **Modern Stack**: React 18, Vite 7, Tailwind CSS, React Router
- ✅ **Responsive**: Mobile-friendly design
- ✅ **Fast**: Optimized bundle splitting and code splitting

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Backend API running (TrainMICE backend)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd projectClient-production
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   ```env
   VITE_API_URL=https://your-backend-api.com/api
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

## 🏗️ Build

### Development Build
```bash
npm run build
npm run preview
```

### Production Build
The build command is optimized for production:
```bash
npm run build
```

The `dist/` folder will contain the production-ready files.

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration

3. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-backend-api.com/api`

4. **Deploy**
   - Vercel will automatically deploy on every push
   - Preview deployments for pull requests

### Other Platforms

Similar setup applies for:
- Netlify
- Cloudflare Pages
- GitHub Pages (with static hosting)

## 📁 Project Structure

```
projectClient-production/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # API client and utilities
│   ├── utils/          # Helper functions
│   ├── App.tsx         # Main app component with routing
│   └── main.tsx        # Application entry point
├── public/             # Static assets
├── dist/               # Build output (generated)
├── .env.example        # Environment variables template
├── vercel.json         # Vercel configuration
├── vite.config.ts      # Vite configuration
└── package.json
```

## 🔒 Security

- Environment variables for API URLs
- No hardcoded secrets
- CORS handled by backend
- Secure headers via Vercel configuration

## 🐛 Troubleshooting

### API Connection Issues
- Verify `VITE_API_URL` is set correctly
- Check backend CORS configuration
- Ensure backend is accessible from your domain

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be >= 18)
- Verify all dependencies are installed

### Vercel Deployment Issues
- Check build logs in Vercel dashboard
- Verify environment variables are set
- Ensure `vercel.json` is configured correctly

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run typecheck    # Type check without emitting files
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |

### Vite Configuration

The build is optimized with:
- Code splitting (vendor, icons chunks)
- Terser minification
- Source maps disabled in production
- Optimized asset handling

## 📄 License

ISC

## 👥 Support

For issues and questions, please open an issue on GitHub.

---

**Production Ready** ✅ | **Vercel Optimized** ✅ | **Zero Errors** ✅

