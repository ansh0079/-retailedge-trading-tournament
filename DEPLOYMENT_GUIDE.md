# 🚀 Deployment Guide

This guide will help you deploy the RetailEdge Pro application to various platforms.

## 📋 Prerequisites

1. **Build the application** (already done):
   ```bash
   npm run build
   ```

2. **Ensure all dependencies are installed**:
   ```bash
   npm install
   ```

## 🌐 Deployment Options

### Option 1: Vercel (Recommended - Easiest)

Vercel is the easiest option for Node.js applications.

#### Steps:

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   Follow the prompts. The `vercel.json` file is already configured.

4. **For production deployment**:
   ```bash
   vercel --prod
   ```

#### Environment Variables (Set in Vercel Dashboard):

Go to your project settings → Environment Variables and add:
- `ANTHROPIC_API_KEY` - Your Claude API key
- `FINNHUB_KEY` - Your Finnhub API key (if used)
- `SERPER_API_KEY` - Your Serper API key (if used)

**Note**: Update `proxy-server.js` to use `process.env.ANTHROPIC_API_KEY` instead of hardcoded key.

---

### Option 2: Netlify

Netlify supports Node.js functions and static hosting.

#### Steps:

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**:
   ```bash
   netlify login
   ```

3. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

4. **Set environment variables** in Netlify Dashboard:
   - Go to Site settings → Environment variables
   - Add your API keys

**Note**: You may need to create a Netlify function for the proxy server. See `netlify.toml` for configuration.

---

### Option 3: Railway

Railway is great for full-stack applications.

#### Steps:

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login**:
   ```bash
   railway login
   ```

3. **Initialize and deploy**:
   ```bash
   railway init
   railway up
   ```

4. **Set environment variables** in Railway Dashboard

---

### Option 4: Render

Render provides free hosting for Node.js apps.

#### Steps:

1. **Create a new Web Service** on Render
2. **Connect your Git repository** (GitHub/GitLab)
3. **Build Command**: `npm run build`
4. **Start Command**: `node proxy-server.js`
5. **Set environment variables** in Render Dashboard

---

### Option 5: Static Hosting (GitHub Pages, Cloudflare Pages)

If you want to deploy just the static frontend (without the proxy server):

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to:
   - **GitHub Pages**: Push `dist` folder to `gh-pages` branch
   - **Cloudflare Pages**: Connect repo and set build output to `dist`
   - **Firebase Hosting**: Use `firebase deploy`

**Note**: Without the proxy server, API features that require CORS proxying may not work.

---

## 🔧 Pre-Deployment Checklist

Before deploying, make sure to:

- [ ] **Update API keys** to use environment variables instead of hardcoded values
- [ ] **Test the build** locally: `npm run build && node proxy-server.js`
- [ ] **Remove sensitive data** from code
- [ ] **Update CORS settings** if needed for your domain
- [ ] **Set up environment variables** on your hosting platform

---

## 🔐 Security Notes

1. **Never commit API keys** to Git
2. **Use environment variables** for all sensitive data
3. **Update `proxy-server.js`** to read from `process.env`:
   ```javascript
   const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || 'fallback-key';
   ```

---

## 📝 Quick Deploy Commands

### Vercel (Fastest)
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Netlify
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### Local Testing
```bash
npm run build
node proxy-server.js
# Open http://localhost:3002
```

---

## 🆘 Troubleshooting

### Build Fails
- Check Node.js version (should be 14+)
- Run `npm install` again
- Check for errors in build output

### API Not Working
- Verify environment variables are set
- Check CORS settings
- Ensure proxy server is running

### Static Files Not Loading
- Verify `dist` folder exists and has files
- Check file paths in HTML
- Ensure build completed successfully

---

## 📞 Support

For deployment issues:
1. Check the platform's documentation
2. Review build logs
3. Test locally first with `node proxy-server.js`
