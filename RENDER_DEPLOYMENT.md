# 🚀 Render Deployment Guide

Your RetailEdge Pro Trading Tournament is ready to deploy to Render!

## ✅ Prerequisites Complete
- [x] Git repository initialized
- [x] Initial commit created
- [x] .gitignore configured (API keys protected)
- [x] render.yaml configured

## 📝 Step-by-Step Deployment

### Step 1: Push to GitHub

First, create a GitHub repository and push your code:

1. **Go to GitHub** and create a new repository:
   - Visit: https://github.com/new
   - Repository name: `retailedge-trading-tournament` (or your choice)
   - Choose: Private or Public
   - **DO NOT** initialize with README, .gitignore, or license
   - Click "Create repository"

2. **Push your code** (use the commands GitHub shows you):
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Render

1. **Go to Render Dashboard**:
   - Visit: https://dashboard.render.com/
   - Sign up or log in (can use GitHub account)

2. **Create a New Web Service**:
   - Click "New +" button → Select "Web Service"
   - Connect your GitHub account if not already connected
   - Select your repository: `retailedge-trading-tournament`
   - Click "Connect"

3. **Configure the Service**:
   - **Name**: `retailedge-trading-tournament` (or your choice)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node proxy-server.js`
   - **Instance Type**: Free (or paid for better performance)

4. **Add Environment Variables** (Critical!):
   Click "Advanced" → "Add Environment Variable" and add these:

   **IMPORTANT**: Copy these values from your local `.env` file!

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `3002` |
   | `ANTHROPIC_API_KEY` | (Copy from your `.env` file) |
   | `FMP_API_KEY` | (Copy from your `.env` file) |
   | `DEEPSEEK_API_KEY` | (Copy from your `.env` file) |
   | `KIMI_API_KEY` | (Optional - Copy from your `.env` file) |
   | `GEMINI_API_KEY` | (Optional - Copy from your `.env` file) |

5. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically build and deploy your app
   - Wait 3-5 minutes for the initial deployment

### Step 3: Access Your App

Once deployed, Render will give you a URL like:
```
https://retailedge-trading-tournament.onrender.com
```

Visit this URL to access your deployed trading tournament!

## 🔄 Automatic Deployments

From now on, every time you push to GitHub, Render will automatically:
1. Pull the latest code
2. Run the build
3. Deploy the updated version

To update your app:
```bash
# Make your changes
git add .
git commit -m "Your update message"
git push
```

## ⚙️ Important Configuration Notes

### Port Configuration
The app is configured to use `PORT=3002` locally, but Render will automatically assign its own port via the `PORT` environment variable. The proxy-server.js already handles this correctly:

```javascript
const PORT = process.env.PORT || 3002;
```

### API Keys
Your API keys are stored as environment variables on Render and are NOT in your Git repository. This keeps them secure.

### Health Checks
The `render.yaml` file configures a health check on the `/` route, which serves your index.html file.

## 🐛 Troubleshooting

### Build Fails
- Check the "Logs" tab in Render dashboard
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

### App Not Loading
- Check "Events" tab for deployment status
- Verify all environment variables are set correctly
- Check "Logs" for runtime errors

### API Errors
- Verify API keys are set in environment variables
- Check API key validity
- Review proxy-server.js logs

### Tournament Not Starting
- Ensure the server started successfully (check logs)
- Verify the `/` route is responding
- Check browser console for JavaScript errors

## 📊 Free Tier Limitations

Render's free tier includes:
- 750 hours/month (enough for 24/7 operation)
- Automatic sleep after 15 minutes of inactivity
- App wakes up on first request (may take 30-60 seconds)
- 512 MB RAM

For production use, consider upgrading to a paid plan for:
- No sleep/downtime
- More RAM
- Faster performance
- Custom domains

## 🔒 Security Checklist

- [x] API keys stored as environment variables
- [x] .env file excluded from Git
- [x] CORS properly configured
- [x] No hardcoded secrets in code
- [x] All hardcoded API key fallbacks removed from server files
- [x] Server will warn if API keys are not set

**Security Improvements Applied:**
- All API keys have been removed from the codebase
- The server files now only use environment variables
- Your API keys will NOT be visible in your GitHub repository
- The app will display warnings if required API keys are missing

## 📞 Support

If you encounter issues:
1. Check Render logs: Dashboard → Your Service → Logs
2. Review Render documentation: https://render.com/docs
3. Check GitHub repository for updates

## 🎯 Next Steps

1. Test your deployed app thoroughly
2. Set up custom domain (optional)
3. Monitor usage and performance
4. Consider upgrading for production use

Your app is ready to trade! 🚀📈
