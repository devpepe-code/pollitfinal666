#!/bin/bash

# Quick Vercel Deployment Script
# This script helps you deploy the frontend to Vercel

set -e

echo "🚀 Starting Vercel Deployment..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed."
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Navigate to frontend directory
cd frontend

echo "📁 Current directory: $(pwd)"
echo ""

# Check if .env.local exists and warn about environment variables
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found"
    echo "📝 Make sure to set these environment variables in Vercel Dashboard:"
    echo "   - NEXT_PUBLIC_API_URL"
    echo "   - NEXT_PUBLIC_MARKET_FACTORY_ADDRESS"
    echo ""
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
echo ""

if [ "$1" == "--prod" ]; then
    echo "🚀 Deploying to PRODUCTION..."
    vercel --prod
else
    echo "🧪 Deploying to PREVIEW..."
    vercel
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Set environment variables in Vercel Dashboard"
echo "   2. Redeploy if needed: ./deploy-vercel.sh --prod"
echo "   3. Check deployment status in Vercel Dashboard"
echo ""

