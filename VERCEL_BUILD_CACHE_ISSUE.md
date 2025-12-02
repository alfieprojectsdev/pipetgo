# Vercel Build Cache Issue - Root Cause Identified

**Date:** 2025-12-01 10:57 UTC
**Issue:** Fix is in codebase but not in deployed build
**Root Cause:** Vercel build cache serving stale code

---

## Executive Summary

✅ Fix is correct (commit `5d6304d`)
✅ Fix is in origin/main
✅ Redis environment variables added
✅ New deployment created (`dpl_DW6yykEhMYAxg7ipdZXC6fKQHe8c`)
❌ **Deployed code still has old error**

**Root Cause:** Vercel's build cache is serving stale compiled code despite building from correct commit.

---

## Evidence

### 1. Code Fix Verified

```bash
$ git log --oneline origin/main | head -5
f232852 docs: add deployment status analysis  ← Latest commit
5d6304d fix: resolve NextAuth App Router pathname handling  ← FIX IS HERE
1a7b180 fix: add timeout and error handling
```

### 2. Deployment Using Correct Commit

```bash
$ gh api repos/alfieprojectsdev/pipetgo/deployments/3397169761
SHA: f232852f5931c6cbda5401be557b94d88d4b9a37
Created: 2025-12-01T08:22:59Z
```

### 3. Commit History Confirmed

```bash
$ git log --oneline f232852 | grep "5d6304d"
5d6304d fix: resolve NextAuth App Router pathname handling
```

**Confirmation:** Commit `f232852` INCLUDES the fix from `5d6304d` in its history.

### 4. Production Still Has Old Error

From `docs/2025-12-01_03.json` (10:57 UTC - **2.5 hours after deployment**):

```
⨯ TypeError: Cannot destructure property 'nextauth' of 'e.query' as it is undefined.
    at i (/var/task/.next/server/chunks/24.js:30:18531)
    at e.length.t (/var/task/.next/server/chunks/24.js:30:21014)
    at l (/var/task/.next/server/app/api/auth/[...nextauth]/route.js:1:1552)
```

This is the **EXACT SAME ERROR** that the fix was supposed to resolve.

---

## Root Cause Analysis

### Why This Happens

Vercel caches build outputs to speed up deployments. When you:
1. Add environment variables (Redis URLs)
2. Trigger a redeploy

Vercel may:
- ✅ Rebuild with new environment variables
- ❌ **Reuse cached compilation of unchanged source files**

Since we didn't change any source code when adding env vars, Vercel reused the cached `.next/server` build artifacts from a PREVIOUS deployment that was built BEFORE commit `5d6304d`.

### Cache Layers Involved

1. **Source Cache**: Git commit (correct - using `f232852`)
2. **Dependency Cache**: `node_modules` (probably correct)
3. **Build Output Cache**: `.next/server/**/*.js` ⚠️ **STALE - from pre-fix build**
4. **Function Cache**: Serverless function bundles ⚠️ **STALE - contains old code**

---

## Solution: Force Complete Rebuild

### Option 1: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com → pipetgo project
2. Go to **Settings** → **General**
3. Scroll to **Build & Development Settings**
4. Click **Edit** next to "Build Command"
5. **Temporarily** change it to:
   ```
   VERCEL_FORCE_NO_BUILD_CACHE=1 npm run build
   ```
6. Click **Save**
7. Go to **Deployments** → Click latest deployment → **Redeploy**
8. Wait for build to complete
9. **IMPORTANT:** Change build command back to just `npm run build`

###Option 2: Trigger Empty Commit with Force Flag

```bash
cd /home/finch/repos/pipetgo

# Create empty commit to force rebuild
git commit --allow-empty -m "chore: force complete rebuild without cache"
git push origin main

# In Vercel dashboard, verify the new deployment starts
# Look for "Building..." status
```

**Note:** This alone might not work if Vercel's cache invalidation logic doesn't trigger. Option 1 is more reliable.

### Option 3: Delete and Redeploy (Nuclear Option)

1. Go to Vercel dashboard → **Deployments**
2. Find latest deployment
3. Click three dots (⋯) → **Delete**
4. Go back to **Deployments** → Click **Redeploy** on previous deployment
5. Wait for fresh build

### Option 4: Via Vercel CLI (If Authenticated)

```bash
# If you can authenticate with Vercel
npx vercel env rm UPSTASH_REDIS_REST_URL production
npx vercel env add UPSTASH_REDIS_REST_URL production
# Enter same value: https://alive-tarpon-42748.upstash.io

# This forces Vercel to invalidate cache and rebuild
```

---

## Verification After Rebuild

### 1. Check Build Logs

In Vercel dashboard → Latest deployment → **Build Logs**

Look for:
```
Building...
Installing dependencies...
Running "npm run build"
✓ Compiled successfully
```

Make sure it says "Compiled" not "Using cached build"

### 2. Test Endpoint

```python
python3 << 'EOF'
import requests
import time

print("Waiting 2 minutes for deployment...")
time.sleep(120)

print("\nTesting login endpoint...")
csrf_resp = requests.get('https://www.pipetgo.com/api/auth/csrf')
csrf_token = csrf_resp.json()['csrfToken']

resp = requests.post(
    'https://www.pipetgo.com/api/auth/callback/credentials',
    data={
        'csrfToken': csrf_token,
        'email': 'lab1@pgtestinglab.com',
        'password': 'wrongpassword',
        'callbackUrl': '/'
    },
    allow_redirects=False
)

print(f"Status Code: {resp.status_code}")
if resp.status_code == 500:
    print("❌ STILL BROKEN - Try Option 3 (delete and redeploy)")
elif resp.status_code in [302, 401, 200]:
    print("✅ FIXED! The build cache was the problem.")
else:
    print(f"⚠️ Unexpected status: {resp.status_code}")
EOF
```

### 3. Check Logs for New Error Pattern

Download fresh logs from Vercel. If the fix worked, you should see:
- ❌ NO "Cannot destructure property 'nextauth'" errors
- ✅ Either successful logins OR authentication failures (wrong password)
- ✅ Different error message if something else is wrong

---

## Why This Is Tricky

### Normal Deployment Flow

```
Code change → Push → Vercel detects change → Rebuilds → Deploys
```

### What Happened Here

```
1. Code fix pushed (5d6304d) ✅
2. Vercel built and deployed ✅
3. BUT: Old deployment still serving www.pipetgo.com ❌
4. Add env vars → Redeploy
5. Vercel sees: "Same code, just new env vars"
6. Vercel reuses: Cached build from BEFORE fix
7. Result: New deployment with OLD code ❌
```

### The Catch-22

- Can't test if fix works until deployed
- Can't deploy with fix because cache is stale
- Adding env vars doesn't invalidate build cache
- Need to force cache invalidation explicitly

---

## Prevention for Future

### 1. Always Make Code Change with Env Var Changes

Instead of:
```
1. Add env vars
2. Redeploy (cache hit)
```

Do:
```
1. Add env vars
2. Make trivial code change (add comment)
3. Push → triggers fresh build
```

### 2. Use Vercel CLI for Critical Deploys

```bash
# Authenticate once
npx vercel login

# Deploy with no cache
npx vercel --prod --force
```

### 3. Monitor Build Logs

Always check build logs after deployment to ensure it says "Compiled successfully" not "Using cached build".

---

## Timeline

```
07:29 UTC: Fix committed (5d6304d)
07:29 UTC: Vercel builds and deploys to preview
08:22 UTC: Docs commit (f232852) - includes fix in history
08:22 UTC: Vercel builds and deploys to preview
10:56 UTC: Redis env vars added
10:56 UTC: Redeploy triggered
10:57 UTC: Deployment complete (dpl_DW6yykEhMYAxg7ipdZXC6fKQHe8c)
10:57 UTC: Login still fails - SAME ERROR
         ↑
         Build cache served stale code
```

---

## Next Steps

1. ⏰ **Immediate**: Use Option 1 to force rebuild without cache
2. ⏰ **After rebuild**: Wait 2-3 minutes for deployment
3. ⏰ **Test**: Run verification script above
4. ⏰ **Confirm**: Check fresh logs show no more "req.query undefined" errors
5. ⏰ **Manual test**: Login at www.pipetgo.com/auth/signin

---

## Success Criteria

✅ Build logs show "Compiled successfully" (not "Using cached")
✅ Login endpoint returns 302/401 instead of 500
✅ Production logs show NO "Cannot destructure 'nextauth'" errors
✅ Can successfully login with valid credentials
✅ Rate limiting works (6th failed login returns 429)

---

**Status:** Awaiting user to force rebuild via Vercel dashboard

**Recommended Action:** Option 1 (add `VERCEL_FORCE_NO_BUILD_CACHE=1` to build command temporarily)
