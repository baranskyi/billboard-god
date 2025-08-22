# 🚀 Railway Deployment Guide for Billboard God

Complete step-by-step guide to deploy Billboard God on Railway with public URL.

## 📋 Prerequisites

- ✅ GitHub account
- ✅ Railway account (free tier available)
- ✅ Billboard God repository on GitHub

## 🎯 Step 1: Create Railway Project

### Option A: Deploy from GitHub (Recommended)

1. **Go to [railway.app](https://railway.app)**
2. **Sign in with GitHub**
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose `baranskyi/billboard-god` repository**
6. **Railway will automatically detect Node.js project**

### Option B: Deploy from Template

1. **Click "Deploy Now" button:**
   
   [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/billboard-god)

## 🎯 Step 2: Configure Environment Variables

After project creation, add these environment variables:

### Required Variables:
```bash
NODE_ENV=production
SESSION_SECRET=your-super-secret-session-key-here-make-it-long-and-random
PORT=${{PORT}}
```

### Email Configuration (Optional but recommended):
```bash
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM=your-email@gmail.com
```

### How to add variables:
1. **Go to your project dashboard**
2. **Click "Variables" tab**
3. **Click "New Variable"**
4. **Add each variable one by one**

## 🎯 Step 3: Enable Public Domain

### Automatic Domain:
1. **In project dashboard, go to "Settings"**
2. **Find "Domains" section**
3. **Click "Generate Domain"**
4. **Railway will create: `https://billboard-god-production-xxxx.up.railway.app`**

### Custom Domain (Optional):
1. **Click "Custom Domain"**
2. **Enter your domain: `yourdomain.com`**
3. **Update DNS records as shown**

## 🎯 Step 4: Deploy Configuration

Make sure these files are properly configured:

### railway.json (already configured):
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Procfile (already configured):
```
web: npm start
```

## 🎯 Step 5: Trigger Deployment

### Automatic Deployment:
- Railway automatically deploys on every GitHub push to `main` branch
- Check "Deployments" tab for status

### Manual Deployment:
1. **Go to "Deployments" tab**
2. **Click "Deploy Latest"**
3. **Wait for build to complete**

## 🎯 Step 6: Verify Deployment

### Check Build Logs:
1. **Go to "Deployments" tab**
2. **Click on latest deployment**
3. **Check build and deploy logs**
4. **Look for "Billboard God running on port XXXX"**

### Test the Application:
1. **Copy the Railway URL**
2. **Open in browser**
3. **Should see Billboard God login page**

## 🔧 Troubleshooting Common Issues

### Issue 1: Build Fails
**Solution**: Check these files exist:
- `package.json` with correct `start` script
- `server.js` in root directory
- All dependencies in `package.json`

### Issue 2: App Starts but No Public URL
**Solution**: 
1. Go to "Settings" → "Domains"
2. Click "Generate Domain"
3. Wait 2-3 minutes for propagation

### Issue 3: "Application Error" on URL
**Solution**: Check logs in "Deployments" tab:
```bash
# Common fixes:
- Add PORT=${{PORT}} environment variable
- Ensure server.js uses process.env.PORT
- Check all dependencies are installed
```

### Issue 4: Email Not Working
**Solution**: 
1. Add email environment variables
2. Use Gmail App Password (not regular password)
3. Test with: `woofer.ua@gmail.com` / code: `111111`

## 🎯 Step 7: Post-Deployment Setup

### Test Authentication:
1. **Visit your Railway URL**
2. **Try test account**:
   - Email: `woofer.ua@gmail.com`
   - Code: `111111`

### Set Up Real Email:
1. **Follow `EMAIL_SETUP_RAILWAY.md`**
2. **Add Gmail App Password**
3. **Test with real email**

## 📱 Railway CLI (Optional)

### Install Railway CLI:
```bash
npm install -g @railway/cli
```

### Connect to Project:
```bash
railway login
railway link
railway status  # Shows your app URL
```

### View Logs:
```bash
railway logs
```

## 🔒 Security Checklist

- [ ] Strong SESSION_SECRET set
- [ ] Email credentials secured
- [ ] Environment variables configured
- [ ] HTTPS enabled (automatic on Railway)
- [ ] No sensitive data in code

## 🎉 Success Indicators

Your deployment is successful when:

- ✅ Build completes without errors
- ✅ App shows "Healthy" status
- ✅ Public URL is accessible
- ✅ Login page loads properly
- ✅ Test authentication works
- ✅ Email sending works (if configured)

## 🆘 Need Help?

### Railway Support:
- [Railway Docs](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)

### Check These Files:
- `server.js` - main application file
- `package.json` - dependencies and scripts
- `railway.json` - Railway configuration
- `EMAIL_SETUP_RAILWAY.md` - email setup

---

## 🎯 Quick Deploy Checklist

1. [ ] Create Railway project from GitHub
2. [ ] Add environment variables (SESSION_SECRET, PORT)
3. [ ] Generate public domain
4. [ ] Wait for deployment to complete
5. [ ] Test the public URL
6. [ ] Set up email (optional)
7. [ ] Test authentication flow

Your Billboard God should now be live at:
`https://billboard-god-production-xxxx.up.railway.app` 🚀
