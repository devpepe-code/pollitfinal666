# GitHub Upload Instructions

## 📦 What's in pollit666

This folder contains everything you need to deploy to Vercel:

- ✅ **Frontend** - Next.js app configured for Vercel
- ✅ **Backend** - Express API (deploy separately to Railway/Render)
- ✅ **Contracts** - Smart contracts for blockchain deployment
- ✅ **Documentation** - Complete deployment guides
- ✅ **Configuration** - All Vercel config files included

## 🚀 Quick Upload to GitHub

### Step 1: Initialize Git

```bash
cd pollit666
git init
git add .
git commit -m "Initial commit - Ready for Vercel deployment"
```

### Step 2: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `pollit666`
3. Description: "Prediction Market MVP - Ready for Vercel"
4. Choose Public or Private
5. **Don't** initialize with README (we already have one)
6. Click "Create repository"

### Step 3: Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/pollit666.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## 🌐 Deploy to Vercel

After uploading to GitHub:

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `pollit666` repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework**: Next.js (auto-detected)
4. Add environment variables
5. Deploy!

## 📋 Files Included

- `frontend/` - Next.js app with Vercel config
- `backend/` - Express API server
- `contracts/` - Solidity smart contracts
- `docs/` - Documentation
- `README.md` - Main documentation
- `QUICK_DEPLOY.md` - Quick start guide
- `VERCEL_DEPLOYMENT.md` - Full deployment guide
- `.gitignore` - Git ignore rules

## ✅ Verification

After uploading, verify:
- [ ] All files are in the repository
- [ ] README.md is visible
- [ ] Frontend folder contains vercel.json
- [ ] Package.json files are present

## 🎉 Next Steps

1. Upload to GitHub ✅
2. Deploy to Vercel (see [QUICK_DEPLOY.md](./QUICK_DEPLOY.md))
3. Deploy backend to Railway/Render
4. Set environment variables
5. Test your deployment!

---

**Ready?** Follow the steps above and you'll be live in minutes! 🚀

