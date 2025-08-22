#!/bin/bash

# 🚀 Billboard God - Railway Deployment Script
# This script helps deploy Billboard God to Railway

echo "🚀 Billboard God - Railway Deployment Helper"
echo "============================================="
echo

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo "   Commit your changes first:"
    echo "   git add ."
    echo "   git commit -m 'Deploy to Railway'"
    echo "   git push"
    echo
fi

# Check current branch
BRANCH=$(git branch --show-current)
echo "📋 Current branch: $BRANCH"

if [ "$BRANCH" != "main" ]; then
    echo "⚠️  Warning: You're not on 'main' branch"
    echo "   Railway deploys from 'main' branch by default"
    echo "   Switch to main: git checkout main"
    echo
fi

# Check if railway.json exists
if [ -f "railway.json" ]; then
    echo "✅ railway.json found"
else
    echo "❌ railway.json not found"
    echo "   This file is required for Railway deployment"
    exit 1
fi

# Check if package.json has start script
if grep -q '"start"' package.json; then
    echo "✅ npm start script found"
else
    echo "❌ npm start script not found in package.json"
    exit 1
fi

echo
echo "📝 Next Steps:"
echo "1. Go to https://railway.app"
echo "2. Sign in with GitHub"
echo "3. Click 'New Project'"
echo "4. Select 'Deploy from GitHub repo'"
echo "5. Choose 'baranskyi/billboard-god'"
echo "6. Add environment variables:"
echo "   - SESSION_SECRET=your-secret-key"
echo "   - PORT=\${{PORT}}"
echo "7. Generate public domain in Settings"
echo
echo "🔗 Your app will be available at:"
echo "   https://billboard-god-production-xxxx.up.railway.app"
echo
echo "📧 For email setup, see EMAIL_SETUP_RAILWAY.md"
echo
echo "Happy deploying! 🎉"
