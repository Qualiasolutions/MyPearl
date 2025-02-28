#!/bin/bash

echo "🚀 Preparing for Netlify deployment..."

# Install dependencies if needed
echo "📦 Checking dependencies..."
npm install

# Build Next.js application
echo "🔨 Building application..."
npm run build

echo "✅ Build completed!"
echo ""
echo "To deploy to Netlify, you have two options:"
echo ""
echo "Option 1: Use Netlify CLI (recommended)"
echo "1. Run 'npx netlify login' to log in to your Netlify account"
echo "2. Run 'npx netlify init' to set up your site (if not already done)"
echo "3. Run 'npx netlify deploy --prod' to deploy to production"
echo ""
echo "Option 2: Manual deployment via Netlify UI"
echo "1. Go to app.netlify.com"
echo "2. Import your project from GitHub"
echo "3. Configure build settings:"
echo "   - Build command: next build"
echo "   - Publish directory: .next"
echo ""
echo "For more details, check netlify-deploy-instructions.md" 