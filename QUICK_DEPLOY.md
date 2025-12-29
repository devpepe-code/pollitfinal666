# Quick Deploy to Vercel

## Prerequisites
- Node.js 18+ installed
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Backend deployed (Railway/Render) - see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

## Quick Start (5 minutes)

### Option 1: Using Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Navigate to frontend
cd frontend

# Deploy
vercel

# Follow prompts, then set environment variables in Vercel Dashboard
# Redeploy to production
vercel --prod
```

### Option 2: Using Deployment Script

```bash
# Make script executable (if not already)
chmod +x deploy-vercel.sh

# Run deployment script
./deploy-vercel.sh

# For production
./deploy-vercel.sh --prod
```

### Option 3: Using Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
4. Add environment variables (see below)
5. Click "Deploy"

## Required Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_MARKET_FACTORY_ADDRESS=0x...
```

## After Deployment

1. ✅ Check your site is live
2. ✅ Test wallet connection
3. ✅ Verify API calls work
4. ✅ Test market creation
5. ✅ Test trading functionality

## Troubleshooting

**Build fails?**
- Check Node.js version (should be 18+)
- Ensure all dependencies are installed
- Check build logs in Vercel dashboard

**Can't connect to backend?**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend is running and accessible
- Verify CORS settings

**Wallet not connecting?**
- Check browser console for errors
- Ensure MetaMask/RainbowKit is configured correctly
- Verify network settings match your contracts

## Next Steps

- Set up custom domain
- Enable Vercel Analytics
- Configure monitoring
- Set up CI/CD

For detailed instructions, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

