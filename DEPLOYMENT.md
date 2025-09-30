# Phase 6: Deployment Guide

## Architecture Overview

```
┌─────────────────────────┐
│  Vercel Frontend        │
│  (React + Vite)         │
│  https://app.vercel.app │
└────────────┬────────────┘
             │ HTTPS
             │ API calls
             ▼
┌─────────────────────────┐
│  Render Backend         │
│  (Node + Express)       │
│  https://backend.onrender.com
└────────────┬────────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
┌─────────────┐ ┌─────────────────────┐
│ MongoDB     │ │ Upstash Redis (REST)│
│ Atlas       │ │ https://...upstash  │
└─────────────┘ └─────────────────────┘
```

## Prerequisites

✅ GitHub Account
✅ MongoDB Atlas Connection String
✅ Razorpay API Keys (live mode)
✅ Cloudinary API Keys
✅ Upstash Redis Credentials (provided)
✅ Domain (optional, for custom URL)

## Step 1: Deploy Backend on Render

### 1.1 Create Render Account
- Go to https://render.com
- Sign up with GitHub

### 1.2 Connect GitHub Repository
- Dashboard → New → Web Service
- Connect your GitHub repo
- Branch: `feature/ci-cd-pipeline` (or main after merging)

### 1.3 Configure Environment Variables

In Render Dashboard, add these as secrets:

```
NODE_ENV = production
PORT = 5000

MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority

JWT_SECRET = [generate with: openssl rand -hex 32]

RAZORPAY_KEY_ID = rzp_live_xxxxx
RAZORPAY_KEY_SECRET = your-secret-key

CLOUDINARY_NAME = your-name
CLOUDINARY_API_KEY = your-key
CLOUDINARY_API_SECRET = your-secret

UPSTASH_REDIS_REST_URL = https://current-boa-100680.upstash.io
UPSTASH_REDIS_REST_TOKEN = gQAAAAAAAYlIAAIocDE1ZTc2OTlmNmFkZTU0NzA3OTYxMDc1MGNlZmE3MjVhZHAxMTAwNjgw

CORS_ORIGIN = https://your-frontend.vercel.app
```

### 1.4 Deploy
- Render will auto-build and deploy
- Get your backend URL (e.g., `https://ffsd-backend.onrender.com`)
- Health check: `https://ffsd-backend.onrender.com/api/health` → Should return 200 OK

## Step 2: Deploy Frontend on Vercel

### 2.1 Create Vercel Account
- Go to https://vercel.com
- Sign up with GitHub

### 2.2 Import Project
- New Project → Import Git Repository
- Select your repo

### 2.3 Configure Build Settings
- Framework: Vite
- Build Command: `cd client && npm run build` (auto-detected)
- Output Directory: `client/dist`
- Install Command: `npm install`

### 2.4 Add Environment Variables

In Vercel Project Settings → Environment Variables:

```
VITE_API_URL = https://ffsd-backend.onrender.com
VITE_CLOUDINARY_KEY = your-key
VITE_RAZORPAY_KEY = rzp_live_xxxxx
```

### 2.5 Deploy
- Vercel will auto-build and deploy
- Get your frontend URL (e.g., `https://your-app.vercel.app`)
- Test: Open in browser → Should load app and make API calls to Render backend

## Step 3: Update Backend CORS

Once you have Vercel URL:

1. Go to Render Dashboard
2. Update `CORS_ORIGIN` env var with your Vercel URL
3. Render will auto-redeploy with new CORS setting

## Step 4: Verify Deployment

### 4.1 Backend Health
```bash
curl https://ffsd-backend.onrender.com/api/health
# Should return: {"status":"ok",...}
```

### 4.2 Frontend to Backend Connection
1. Open browser → https://your-app.vercel.app
2. Login or perform an API call
3. Check Network tab in DevTools
4. Should see successful requests to `https://ffsd-backend.onrender.com/api/...`

### 4.3 Cache Status
```bash
curl https://ffsd-backend.onrender.com/api/health
# Response should include Upstash connection info
```

## Step 5: Testing

### All Features to Test:
- ✅ User Login/Register
- ✅ Property Search
- ✅ Booking Creation
- ✅ Payment via Razorpay (live mode)
- ✅ File Upload (Cloudinary)
- ✅ Admin Dashboard
- ✅ Worker Registration
- ✅ Notifications

## Troubleshooting

### CORS Errors
- Frontend and Backend URLs in CORS_ORIGIN? 
- Check Render logs: `Settings → Logs`

### Redis Connection Failed
- Upstash credentials correct?
- Check env vars in Render Dashboard
- Upstash REST API supports no TLS setup needed

### Payment Failures
- Using LIVE Razorpay keys (not test)?
- API keys have correct permissions?

### Build Failures
- Check Vercel/Render build logs
- All dependencies installed? (`npm ci` working?)
- Frontend build: `npm run build` succeeds locally?

## Useful Commands (Local Testing)

```bash
# Test backend locally with Upstash
UPSTASH_REDIS_REST_URL=https://... \
UPSTASH_REDIS_REST_TOKEN=... \
npm start

# Test frontend locally
cd client
npm run build
npm run preview  # Preview production build
```

## Cost Estimate

- **Vercel**: Free tier (5GB/month)
- **Render**: Free tier (limited, auto-pauses after 15 min inactivity)
- **MongoDB Atlas**: Free tier (512MB)
- **Upstash Redis**: ~$0.20/month (free tier: 10K commands)
- **Cloudinary**: Free tier (25GB/month)
- **Razorpay**: Per transaction (2% + ₹0)

## Next Steps

1. ✅ Deploy backend on Render
2. ✅ Deploy frontend on Vercel
3. ✅ Update CORS_ORIGIN on Render
4. ✅ Test all features
5. ✅ Submit demo URL to instructor

---

**Demo URL Format:**
```
Frontend: https://your-app.vercel.app
Backend: https://ffsd-backend.onrender.com
```

**Video Demo Checklist:**
- [ ] Login with user account
- [ ] Search and filter properties
- [ ] View property details
- [ ] Create booking
- [ ] Make payment (Razorpay)
- [ ] View booking history
- [ ] Admin dashboard (if applicable)
- [ ] Upload document/image (Cloudinary)
