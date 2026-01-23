# 🚀 Deploy to Render - Quick Start

Your app is **ready to deploy** with all security fixes applied!

## ✅ What's Done

1. ✅ Git repository initialized
2. ✅ All code committed
3. ✅ API keys removed from code (now secure!)
4. ✅ .env file protected from Git

## 🎯 3 Steps to Deploy

### Step 1: Create GitHub Repository

1. Go to: https://github.com/new
2. Name: `retailedge-trading-tournament`
3. Privacy: **Private** (recommended) or Public
4. **DO NOT** check any initialization options
5. Click "Create repository"

### Step 2: Push Your Code

Copy the **HTTPS** URL from GitHub (looks like: `https://github.com/YOUR_USERNAME/retailedge-trading-tournament.git`)

Then run these commands:

```bash
git remote add origin https://github.com/YOUR_USERNAME/retailedge-trading-tournament.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Render

1. **Go to Render**: https://dashboard.render.com/
2. **Sign up/Login** (can use GitHub account)
3. **Click "New +"** → "Web Service"
4. **Connect GitHub** and select your repository
5. **Configure**:
   - Name: `retailedge-trading-tournament`
   - Build Command: `npm install && npm run build`
   - Start Command: `node proxy-server.js`
6. **Add Environment Variables** (Click "Advanced"):

   Copy these from your `.env` file:
   ```
   NODE_ENV=production
   PORT=3002
   ANTHROPIC_API_KEY=<your_key_from_.env>
   FMP_API_KEY=<your_key_from_.env>
   DEEPSEEK_API_KEY=<your_key_from_.env>
   ```

7. **Click "Create Web Service"**
8. **Wait 3-5 minutes** for deployment

### Done! 🎉

Your app will be live at: `https://retailedge-trading-tournament.onrender.com`

## 🔑 Important: Getting Your API Keys

Open your `.env` file to copy the API keys:

```bash
# On Windows
notepad .env

# Or just view it
type .env
```

Copy the values after the `=` sign for each key.

## 📝 Full Documentation

See `RENDER_DEPLOYMENT.md` for complete guide with troubleshooting.

## 🆘 Need Help?

**App won't start?**
- Check "Logs" tab in Render dashboard
- Verify all environment variables are set
- Make sure you copied the full API keys

**Build fails?**
- Check "Events" tab for error details
- Try rebuilding: Click "Manual Deploy" → "Clear build cache & deploy"

**API errors?**
- Verify API keys are correct in Render environment variables
- Check that you didn't copy extra spaces

---

**Ready to deploy?** Follow the 3 steps above! 🚀
