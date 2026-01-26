# Deployment Guide for RetailEdge Pro

This guide covers deploying the application to various platforms.

## 📋 Prerequisites

1. **Build the application:**
   ```bash
   npm install
   npm run build
   ```

2. **Environment Variables** (if needed):
   - `ANTHROPIC_API_KEY` or `CLAUDE_API_KEY` - For Claude AI analysis
   - `PORT` - Server port (default: 3002)

## 🚀 Deployment Options

### Option 1: Vercel (Recommended - Easiest)

**Steps:**
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

**Or use Vercel Dashboard:**
1. Go to [vercel.com](https://vercel.com)
2. Import your Git repository
3. Vercel will auto-detect the `vercel.json` configuration
4. Deploy!

**Note:** Vercel will handle both frontend (static files) and backend (API routes via `proxy-server.js`)

---

### Option 2: Netlify

**Steps:**
1. Install Netlify CLI: `npm i -g netlify-cli`
2. Login: `netlify login`
3. Deploy: `netlify deploy --prod`

**Or use Netlify Dashboard:**
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the `dist` folder
3. Or connect your Git repository

**Note:** For API routes, you'll need to set up Netlify Functions separately.

---

### Option 3: Render (Full-Stack Hosting)

**Steps:**
1. Go to [render.com](https://render.com)
2. Create a new "Web Service"
3. Connect your Git repository
4. Render will auto-detect `render.yaml`
5. Deploy!

**Advantages:**
- Free tier available
- Handles both frontend and backend
- Auto-deploys on Git push

---

### Option 4: Railway

**Steps:**
1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Connect your Git repository
4. Railway will auto-detect Node.js
5. Set start command: `node proxy-server.js`
6. Deploy!

---

### Option 5: Heroku

**Steps:**
1. Install Heroku CLI: `npm i -g heroku`
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Deploy: `git push heroku main`

**Create `Procfile`:**
```
web: node proxy-server.js
```

---

### Option 6: GitHub Pages (Frontend Only)

**Note:** This only works for the frontend. Backend API won't work.

**Steps:**
1. Build: `npm run build`
2. Copy `dist` folder contents to `docs` folder
3. Push to GitHub
4. Go to repository Settings → Pages
5. Select `docs` folder as source
6. Save

---

## 🔧 Configuration Files

- **`vercel.json`** - Vercel deployment configuration
- **`netlify.toml`** - Netlify deployment configuration
- **`render.yaml`** - Render deployment configuration

## 📝 Important Notes

1. **CORS:** The proxy server handles CORS for external APIs
2. **Environment Variables:** Set API keys in your platform's environment variables section
3. **Port:** Most platforms auto-assign ports. The code uses `process.env.PORT || 3002`
4. **Static Files:** All frontend files are in the `dist/` folder
5. **Backend:** The `proxy-server.js` handles API routes and serves static files

## 🐛 Troubleshooting

- **Build fails:** Make sure all dependencies are in `package.json`
- **API routes not working:** Check that the platform supports Node.js serverless functions
- **Static files not loading:** Verify the `dist` folder is being served correctly
- **CORS errors:** Ensure the proxy server is running and accessible

## 🌐 Recommended Platform

**For easiest deployment:** Use **Vercel** - it handles everything automatically and has a generous free tier.

**For full control:** Use **Render** or **Railway** - they provide full Node.js hosting.
