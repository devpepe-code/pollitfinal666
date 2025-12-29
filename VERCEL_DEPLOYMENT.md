# Vercel Deployment Guide

This guide will help you deploy your Prediction Market MVP to Vercel.

## Architecture Overview

Your project consists of:
- **Frontend**: Next.js app in `/frontend` directory
- **Backend**: Express.js API server in `/backend` directory
- **Smart Contracts**: Deployed to blockchain (separate process)

## Deployment Strategy

### Option 1: Frontend on Vercel + Backend on Railway/Render (Recommended)

This is the recommended approach as it's simpler and doesn't require major refactoring.

#### Step 1: Deploy Frontend to Vercel

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

4. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? (Select your account)
   - Link to existing project? **No**
   - Project name? (e.g., `prediction-market-frontend`)
   - Directory? **./** (current directory)
   - Override settings? **No**

5. **Configure Environment Variables** in Vercel Dashboard:
   - Go to your project → Settings → Environment Variables
   - Add the following:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
     NEXT_PUBLIC_MARKET_FACTORY_ADDRESS=0x... (your deployed contract address)
     ```

6. **Redeploy** after adding environment variables:
   ```bash
   vercel --prod
   ```

#### Step 2: Deploy Backend to Railway (or Render)

**Railway Deployment:**

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect it's a Node.js project
5. Set the **Root Directory** to `backend`
6. Add environment variables:
   ```
   DATABASE_URL=postgresql://... (Railway provides PostgreSQL)
   RPC_URL=https://... (your Ethereum RPC endpoint)
   MARKET_FACTORY_ADDRESS=0x... (your deployed contract address)
   PORT=3001
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
7. Railway will automatically deploy and provide a URL

**Render Deployment:**

1. Go to [render.com](https://render.com) and sign up/login
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `prediction-market-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables (same as Railway above)
6. Click "Create Web Service"

#### Step 3: Update Frontend Environment Variables

After deploying the backend, update your Vercel environment variables:
- `NEXT_PUBLIC_API_URL` → Your Railway/Render backend URL

Then redeploy:
```bash
cd frontend
vercel --prod
```

### Option 2: Deploy Everything to Vercel (Advanced)

If you want to deploy the backend as serverless functions on Vercel, you'll need to:

1. Convert Express routes to Vercel serverless functions
2. Set up a serverless-compatible database (e.g., Vercel Postgres)
3. This requires significant refactoring

See `VERCEL_SERVERLESS_BACKEND.md` for details (if created).

## Vercel Project Settings

When deploying from the Vercel dashboard (instead of CLI):

1. **Import Project** from GitHub
2. **Configure Project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

## Environment Variables Checklist

### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_API_URL` - Backend API URL
- [ ] `NEXT_PUBLIC_MARKET_FACTORY_ADDRESS` - Deployed MarketFactory contract address

### Backend (Railway/Render)
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `RPC_URL` - Ethereum RPC endpoint (e.g., Infura, Alchemy)
- [ ] `MARKET_FACTORY_ADDRESS` - Deployed MarketFactory contract address
- [ ] `PORT` - Server port (usually 3001)
- [ ] `FRONTEND_URL` - Frontend URL for CORS

## Database Setup

### Railway PostgreSQL
Railway automatically provides a PostgreSQL database. The connection string is available in the environment variables.

### Render PostgreSQL
1. Create a new PostgreSQL database in Render
2. Copy the Internal Database URL
3. Add it as `DATABASE_URL` environment variable

### Manual Setup
If deploying database separately:
```bash
# Run migrations
psql $DATABASE_URL < backend/database.sql
```

## Post-Deployment Checklist

- [ ] Frontend deployed and accessible
- [ ] Backend deployed and accessible
- [ ] Database connected and migrations run
- [ ] Environment variables configured
- [ ] CORS configured correctly
- [ ] Smart contracts deployed to blockchain
- [ ] Frontend can connect to backend API
- [ ] Wallet connection works (MetaMask/RainbowKit)

## Troubleshooting

### Frontend can't connect to backend
- Check `NEXT_PUBLIC_API_URL` is set correctly
- Verify backend is running and accessible
- Check CORS settings in backend

### Build fails
- Ensure all dependencies are in `package.json`
- Check Node.js version (should be 18+)
- Review build logs in Vercel dashboard

### Database connection errors
- Verify `DATABASE_URL` is correct
- Check database is accessible from deployment platform
- Ensure migrations have been run

### CORS errors
- Update `FRONTEND_URL` in backend environment variables
- Check backend CORS configuration allows your frontend domain

## Custom Domain

To add a custom domain:
1. Go to Vercel project → Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions

## Continuous Deployment

Vercel automatically deploys on every push to your main branch. To disable:
- Go to Settings → Git
- Configure deployment settings

## Monitoring

- **Vercel Analytics**: Enable in project settings
- **Backend Logs**: Check Railway/Render logs dashboard
- **Error Tracking**: Consider adding Sentry or similar

## Next Steps

After deployment:
1. Test all features end-to-end
2. Set up monitoring and alerts
3. Configure backup strategy for database
4. Set up CI/CD pipelines
5. Add error tracking and analytics

