# Vercel Deployment Guide

## Issue 1: Domain Name (`brandforge-xi.vercel.app` instead of `brandforge.vercel.app`)

### Fix the Domain Name:

1. **Go to Vercel Dashboard** → Your Project → **Settings** → **Domains**
2. You'll see your current domain: `brandforge-xi.vercel.app`
3. Click **"Edit"** or **"Add Domain"**
4. Enter: `brandforge.vercel.app`
5. Vercel will verify and update it

**OR** via Vercel CLI:
```bash
vercel domains add brandforge.vercel.app
```

**Note**: The `-xi` suffix is auto-generated. You can change it in project settings.

---

## Issue 2: Seeing Default Next.js Page Instead of Your App

This usually means:
- Wrong branch is deployed
- Build cache issue
- Environment variables missing

### Fix Steps:

#### 1. Check Which Branch is Deployed
- Go to **Vercel Dashboard** → **Deployments**
- Check the **"Source"** column - make sure it says `main` (or your main branch)
- If it's a different branch, click **"..."** → **"Promote to Production"**

#### 2. Verify Environment Variables
Go to **Settings** → **Environment Variables** and ensure these are set:

**Required:**
- `MONGODB_URI` - Your MongoDB connection string
- `GEMINI_API_KEY` - Your Gemini API key
- `ANTHROPIC_API_KEY` - Your Anthropic API key (optional but recommended)

**Optional:**
- `USE_ANTHROPIC_FALLBACK` - Set to `false` to save costs
- `ANTHROPIC_MODEL` - Set to `claude-haiku-20240307` (cheapest)
- `NEXT_PUBLIC_APP_URL` - Your Vercel URL (auto-set, but can override)
- `NODE_ENV` - Should be `production` (auto-set by Vercel)

#### 3. Clear Build Cache and Redeploy
1. Go to **Deployments** → Click on latest deployment
2. Click **"..."** → **"Redeploy"**
3. Check **"Use existing Build Cache"** → **Uncheck it**
4. Click **"Redeploy"**

#### 4. Check Build Logs
- Go to **Deployments** → Click on deployment → **"Build Logs"**
- Look for errors or warnings
- Common issues:
  - Missing environment variables
  - Build errors
  - TypeScript errors

#### 5. Force a Fresh Deployment
```bash
# In your local project
git commit --allow-empty -m "Force redeploy"
git push origin main
```

---

## Verification Checklist

After deployment, verify:

- [ ] Domain is `brandforge.vercel.app` (or your custom domain)
- [ ] Home page shows "Forge Your Brand Identity" (not default Next.js page)
- [ ] Environment variables are set correctly
- [ ] Build logs show no errors
- [ ] API routes work (`/api/analyze-website`)

---

## Common Issues

### "Module not found" errors
- Check that all dependencies are in `package.json`
- Make sure `optionalDependencies` (like Puppeteer) are handled correctly

### "Environment variable not found"
- Add all required env vars in Vercel dashboard
- Make sure they're set for **Production** environment
- Redeploy after adding variables

### "API route timeout"
- Check `vercel.json` - maxDuration is set to 60s
- For longer operations, consider increasing or using background jobs

### Still seeing default Next.js page
- Check that `src/app/page.tsx` exists and has your code
- Verify the build is using the correct branch
- Clear cache and redeploy

---

## Quick Fix Commands

```bash
# Check Vercel project status
vercel ls

# View current domains
vercel domains ls

# Add custom domain
vercel domains add brandforge.vercel.app

# Pull environment variables (to verify)
vercel env pull .env.vercel

# Redeploy
vercel --prod
```

---

## Need Help?

If you're still seeing the default Next.js page:
1. Check the **deployment source** (branch)
2. Verify **environment variables** are set
3. Check **build logs** for errors
4. Try a **fresh deployment** with cache cleared
