# CORS Fix for Magic Eden API - Vercel Deployment

## Problem
The Magic Eden API (`api-mainnet.magiceden.dev`) only allows CORS requests from specific origins. While it works with `http://localhost:3000`, it doesn't allow requests from your Vercel deployment domain, causing CORS errors.

## Solution
I've implemented a proxy-based solution that routes Magic Eden API calls through your Vercel backend to avoid CORS restrictions.

## Changes Made

### 1. Updated Frontend Environment Configuration
- **File**: `frontend/.env`
  - Added: `REACT_APP_MAGICEDEN_BASE=/api/proxy`
  - This tells the frontend to use the proxy instead of direct API calls

- **File**: `frontend/.env.production` (new)
  - Ensures production builds use the proxy
  - Contains: `REACT_APP_MAGICEDEN_BASE=/api/proxy`

### 2. Enhanced API Proxy
- **File**: `api/proxy.js`
  - Added proper CORS preflight request handling
  - Improved error handling and logging
  - Set comprehensive CORS headers

### 3. Added Vercel Configuration
- **File**: `vercel.json` (new)
  - Configures proper CORS headers for API routes
  - Sets maximum duration for proxy function

## How It Works

1. **Before**: Frontend → Magic Eden API directly (CORS blocked on Vercel)
2. **After**: Frontend → Your Vercel API Proxy → Magic Eden API (CORS allowed)

The proxy acts as an intermediary, making server-side requests to Magic Eden's API and returning the data with proper CORS headers.

## Deployment Instructions

1. **Commit all changes** to your repository
2. **Deploy to Vercel** - the configuration will automatically be applied
3. **Verify**: Your Vercel app should now be able to fetch Magic Eden data without CORS errors

## Testing Locally

The solution works both locally and in production:
- **Local**: Uses proxy at `http://localhost:3000/api/proxy`
- **Production**: Uses proxy at `https://your-vercel-domain.com/api/proxy`

## Environment Variables in Vercel (if needed)

If you need to override any settings in Vercel:
1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Add environment variables under "Environment Variables"
4. Set `REACT_APP_MAGICEDEN_BASE` to `/api/proxy`

## API Endpoints Affected

All Magic Eden API calls in `frontend/src/utils/magiceden.ts` now route through the proxy:
- Collection stats: `/v2/collections/{symbol}/stats`
- Holder stats: `/v2/collections/{symbol}/holder_stats`
- Listings: `/v2/collections/{symbol}/listings`
- Activity: `/v2/collections/{symbol}/activities`

## Verification

After deployment, you can verify the fix by:
1. Opening your Vercel app
2. Checking the browser's Network tab
3. Confirming API calls go to `/api/proxy/v2/...` instead of `api-mainnet.magiceden.dev`
4. Ensuring no CORS errors appear in the console

The API calls should now work identically to your local environment.
