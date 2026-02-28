# 🚀 Vercel Deployment Guide — Real Estate Platform

## ❌ Why You Got 404: NOT_FOUND

Your Vercel deployment showed `404: NOT_FOUND` because of **3 issues**:

| # | Problem | Fix |
|---|---------|-----|
| 1 | Vercel deployed from repo root (`bolad/`) but app is in `real-estate-platform/` | ✅ `vercel.json` added at repo root |
| 2 | `experimental.serverComponentsExternalPackages` deprecated in Next.js 14.1 | ✅ Fixed in `next.config.mjs` |
| 3 | `DATABASE_URL` points to `localhost` — Vercel can't reach your local MySQL | ⚠️ Requires cloud MySQL setup |

---

## ✅ Step-by-Step Fix

### Step 1: Commit & Push the Fixes

```bash
git add vercel.json real-estate-platform/next.config.mjs
git commit -m "fix: vercel deployment config + next.config serverExternalPackages"
git push origin main
```

---

### Step 2: Set Up Cloud MySQL Database

Vercel **cannot** connect to your local MySQL (`localhost:3307`).
You need a cloud MySQL provider. **Recommended options (free tier available):**

#### Option A: Railway (Easiest — MySQL)
1. Go to [railway.app](https://railway.app)
2. New Project → Add MySQL
3. Click on the MySQL service → **Connect** tab
4. Copy the `DATABASE_URL` (format: `mysql://user:pass@host:port/dbname`)

#### Option B: PlanetScale (MySQL-compatible, generous free tier)
1. Go to [planetscale.com](https://planetscale.com)
2. Create database → Get connection string
3. Select **Prisma** as framework → copy the `DATABASE_URL`
4. ⚠️ PlanetScale doesn't support foreign keys — add `relationMode = "prisma"` to schema

#### Option C: Aiven (MySQL, free tier)
1. Go to [aiven.io](https://aiven.io)
2. Create MySQL service → copy connection string

---

### Step 3: Run Prisma Migration on Cloud DB

After getting your cloud `DATABASE_URL`:

```bash
cd real-estate-platform

# Set the cloud DATABASE_URL temporarily
set DATABASE_URL=mysql://user:pass@host:port/dbname

# Push schema to cloud database
npx prisma db push

# Optional: seed initial data
node run-seed.mjs
```

---

### Step 4: Configure Environment Variables in Vercel

Go to your Vercel project → **Settings** → **Environment Variables**

Add ALL of these:

```
DATABASE_URL          = mysql://user:pass@cloud-host:port/real_estate_db
JWT_SECRET            = your-super-secret-jwt-key-min-32-chars-change-this
JWT_EXPIRES_IN        = 7d
JWT_REFRESH_SECRET    = your-refresh-secret-key-min-32-chars
JWT_REFRESH_EXPIRES_IN = 30d
NEXT_PUBLIC_APP_URL   = https://your-app.vercel.app
NEXT_PUBLIC_APP_NAME  = عقارات السعودية | Saudi Real Estate
NODE_ENV              = production
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = your-google-maps-key (optional)
```

> ⚠️ **Important**: Set these for **Production**, **Preview**, and **Development** environments.

---

### Step 5: Verify Vercel Project Settings

In Vercel Dashboard → Your Project → **Settings** → **General**:

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Root Directory | *(leave empty — handled by vercel.json)* |
| Build Command | *(leave empty — handled by vercel.json)* |
| Output Directory | *(leave empty — handled by vercel.json)* |
| Install Command | *(leave empty — handled by vercel.json)* |
| Node.js Version | 20.x |

---

### Step 6: Redeploy

After pushing the fixes and setting env vars:

1. Go to Vercel Dashboard → **Deployments**
2. Click the **3 dots** on the latest deployment → **Redeploy**
3. Or push a new commit to trigger auto-deploy

---

## 🔍 Vercel Build Logs — What to Look For

If build fails, check **Deployments** → click deployment → **Build Logs**:

| Error | Fix |
|-------|-----|
| `Can't reach database server` | DATABASE_URL not set or wrong |
| `Module not found: next-intl` | Run `npm install` in `real-estate-platform/` |
| `Environment variable not found: JWT_SECRET` | Add to Vercel env vars |
| `EPERM: operation not permitted` | Prisma generate issue — already fixed in vercel.json |

---

## 🌐 After Successful Deployment

Update `NEXT_PUBLIC_APP_URL` in Vercel env vars to your actual domain:
```
NEXT_PUBLIC_APP_URL = https://bolad.vercel.app
```

Then redeploy once more.

---

## 📋 Quick Checklist

- [ ] `vercel.json` committed at repo root
- [ ] `next.config.mjs` updated (serverExternalPackages)
- [ ] Cloud MySQL database created
- [ ] `DATABASE_URL` set in Vercel env vars
- [ ] `JWT_SECRET` set in Vercel env vars
- [ ] `NEXT_PUBLIC_APP_URL` set to your Vercel domain
- [ ] Prisma schema pushed to cloud DB (`npx prisma db push`)
- [ ] Redeployed on Vercel

---

## 🆘 Still Getting 404?

If you still see 404 after all steps, try this alternative:

**In Vercel Dashboard → Settings → General → Root Directory:**
Set it to: `real-estate-platform`

Then clear the `vercel.json` build/install commands (Vercel will auto-detect Next.js).
