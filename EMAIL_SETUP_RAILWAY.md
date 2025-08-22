# Email Service Setup for Railway Deployment

This guide will help you set up email functionality for Billboard God deployed on Railway.com using Gmail SMTP.

## 🚀 Quick Setup Steps

### 1. Create Gmail App Password

1. **Go to Gmail Settings**:
   - Open [Gmail](https://gmail.com)
   - Click your profile picture → "Manage your Google Account"

2. **Enable 2-Factor Authentication** (if not already enabled):
   - Go to "Security" tab
   - Under "Signing in to Google", click "2-Step Verification"
   - Follow the setup process

3. **Generate App Password**:
   - Still in "Security" tab
   - Under "Signing in to Google", click "App passwords"
   - Select "Mail" as the app
   - Select "Other" as device and name it "Billboard God Railway"
   - **Copy the 16-character password** - you'll need this!

### 2. Configure Railway Environment Variables

1. **Open your Railway project**:
   - Go to [Railway.app](https://railway.app)
   - Open your Billboard God project

2. **Add Environment Variables**:
   - Go to "Variables" tab in your project
   - Add the following variables:

```bash
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM=your-gmail-address@gmail.com

# Other required variables (if not set)
SESSION_SECRET=your-super-secret-session-key-here
PORT=3000
NODE_ENV=production
```

### 3. Example Configuration

Replace with your actual values:

```bash
EMAIL_SERVICE=gmail
EMAIL_USER=john.doe@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_FROM=john.doe@gmail.com
SESSION_SECRET=my-super-secret-key-for-sessions-2024
```

## 🔧 Alternative Email Providers

### SendGrid (Recommended for Production)

1. **Sign up for SendGrid**:
   - Go to [SendGrid.com](https://sendgrid.com)
   - Create free account (100 emails/day free)

2. **Get API Key**:
   - Go to Settings → API Keys
   - Create new API key with "Mail Send" permissions

3. **Railway Variables**:
```bash
EMAIL_SERVICE=sendgrid
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

### Mailgun

1. **Sign up for Mailgun**:
   - Go to [Mailgun.com](https://mailgun.com)
   - Verify your domain or use sandbox

2. **Railway Variables**:
```bash
EMAIL_SERVICE=mailgun
EMAIL_USER=your-mailgun-username
EMAIL_PASS=your-mailgun-password
EMAIL_FROM=noreply@yourdomain.com
MAILGUN_DOMAIN=your-domain.com
```

## 🧪 Testing Email Setup

### Test with Curl

After deployment, test the email system:

```bash
# Replace YOUR_RAILWAY_URL with your actual Railway URL
curl -X POST https://your-app.railway.app/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Test Account

Use the built-in test account to verify functionality:
- **Email**: `woofer.ua@gmail.com`
- **Code**: `111111`

This account works without email sending for testing purposes.

## 🛠️ Troubleshooting

### Common Issues

1. **"Invalid login" error**:
   - Make sure 2FA is enabled on Gmail
   - Use App Password, not regular password
   - Check EMAIL_USER matches the Gmail account

2. **"Connection timeout"**:
   - Railway might block certain SMTP ports
   - Try alternative email services like SendGrid

3. **Emails not sending**:
   - Check Railway logs: `railway logs`
   - Verify all environment variables are set
   - Test with the test account first

### Check Logs

View Railway logs to debug email issues:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and view logs
railway login
railway logs
```

## 🔒 Security Best Practices

1. **Never commit credentials**:
   - Keep `.env` files in `.gitignore`
   - Use Railway environment variables only

2. **Use App Passwords**:
   - Never use your main Gmail password
   - Generate unique app passwords for each service

3. **Rotate credentials**:
   - Change app passwords periodically
   - Remove unused app passwords

## 📧 Email Templates

The system sends professional emails with:
- **Subject**: "Billboard God - Authentication Code"
- **6-digit codes** with 10-minute expiration
- **HTML formatting** for better appearance

## 🚀 Deployment

After setting environment variables:

1. **Redeploy** (if needed):
   ```bash
   railway deploy
   ```

2. **Test the system**:
   - Visit your Railway URL
   - Try registering with your email
   - Check for authentication codes

## 📱 Production Tips

1. **Email Limits**:
   - Gmail: 500 emails/day
   - SendGrid Free: 100 emails/day
   - Consider upgrading for higher volume

2. **Monitoring**:
   - Check Railway metrics
   - Monitor email delivery rates
   - Set up error alerts

3. **Backup Plan**:
   - Have multiple email providers configured
   - Implement fallback mechanisms

---

## ✅ Verification Checklist

- [ ] Gmail 2FA enabled
- [ ] App password generated
- [ ] Railway environment variables set
- [ ] Application redeployed
- [ ] Test email sent successfully
- [ ] Authentication flow working
- [ ] Production domain configured (optional)

Your Billboard God application should now have fully functional email authentication! 🎉
