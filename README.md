# PolliT - Prediction Market MVP

**Ready for Vercel Deployment** 🚀

This repository contains a complete prediction market platform optimized for deployment on Vercel.

## 🎯 Quick Deploy to Vercel

### Prerequisites
- Node.js 18+
- Vercel account ([sign up here](https://vercel.com))
- Backend deployed (Railway/Render recommended)

### Deploy in 3 Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Ready for Vercel"
   git remote add origin https://github.com/yourusername/pollit666.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Next.js
     - **Root Directory**: `frontend`
     - Build settings are auto-detected ✅
   - Click "Deploy"

3. **Set Environment Variables**
   In Vercel Dashboard → Settings → Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_MARKET_FACTORY_ADDRESS=0x...
   ```
   Then redeploy.

### Or Use CLI

```bash
cd frontend
npm install -g vercel
vercel
```

## 📁 Project Structure

```
pollit666/
├── frontend/          # Next.js app (deploy to Vercel)
├── backend/           # Express API (deploy to Railway/Render)
├── contracts/         # Smart contracts (deploy to blockchain)
└── docs/              # Documentation
```

## 🔧 What's Included

✅ **Frontend (Next.js)**
- Configured for Vercel deployment
- Tailwind CSS setup
- Wallet integration (RainbowKit/Wagmi)
- All dependencies included

✅ **Backend (Express)**
- RESTful API
- PostgreSQL ready
- CORS configured

✅ **Smart Contracts**
- Solidity contracts
- Hardhat configuration
- Deployment scripts

## 📚 Documentation

- **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)**: 5-minute quick start
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)**: Complete deployment guide

## 🌐 Deployment Architecture

```
┌─────────────┐
│   Vercel    │  ← Frontend (Next.js)
│             │
└──────┬──────┘
       │ API Calls
       ↓
┌─────────────┐
│   Railway/  │  ← Backend (Express)
│   Render    │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ PostgreSQL  │  ← Database
└─────────────┘
```

## 🚀 Environment Variables

### Frontend (Vercel)
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_MARKET_FACTORY_ADDRESS` - Contract address

### Backend (Railway/Render)
- `DATABASE_URL` - PostgreSQL connection string
- `RPC_URL` - Ethereum RPC endpoint
- `MARKET_FACTORY_ADDRESS` - Contract address
- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS

## ✅ Pre-Deployment Checklist

- [x] Frontend configured for Vercel
- [x] Tailwind CSS dependencies added
- [x] Vercel configuration file included
- [x] Deployment scripts ready
- [x] Documentation complete

## 🎉 After Deployment

1. Test your site is live
2. Connect wallet (MetaMask/RainbowKit)
3. Verify API connectivity
4. Test market creation
5. Test trading functionality

## 📖 Full Documentation

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed instructions.

## 🆘 Troubleshooting

**Build fails?**
- Check Node.js version (18+)
- Verify all dependencies in package.json
- Check build logs in Vercel dashboard

**Can't connect to backend?**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend is running
- Verify CORS settings

## 📝 License

MIT

---

**Ready to deploy?** Follow the [Quick Deploy Guide](./QUICK_DEPLOY.md)!
