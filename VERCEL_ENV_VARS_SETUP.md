# Vercel Environment Variables Setup

**Issue:** Redis environment variables missing from Vercel Production environment
**Impact:** Rate limiting initialization fails → NextAuth handler crashes → 500 errors

---

## Quick Setup Guide

### Step 1: Access Environment Variables

1. Go to https://vercel.com
2. Select the **pipetgo** project
3. Click **Settings** (in the top navigation)
4. Click **Environment Variables** (in the left sidebar)

### Step 2: Add Redis Variables

Add these **two** environment variables:

#### Variable 1: UPSTASH_REDIS_REST_URL

```
Key:   UPSTASH_REDIS_REST_URL
Value: https://alive-tarpon-42748.upstash.io
```

**Environment selection:**
- ✅ Production (check this)
- ⬜ Preview (optional, recommended for testing)
- ⬜ Development (not needed)

#### Variable 2: UPSTASH_REDIS_REST_TOKEN

```
Key:   UPSTASH_REDIS_REST_TOKEN
Value: Aab8AAIncDI4YTM1ZDNjMjBiYTE0ZjFhYjMyYTQ5M2QyMjQ2YTNjZnAyNDI3NDg
```

**Environment selection:**
- ✅ Production (check this)
- ⬜ Preview (optional, recommended for testing)
- ⬜ Development (not needed)

### Step 3: Save and Redeploy

After adding both variables:

**Option A: Redeploy from Vercel Dashboard**
1. Go to **Deployments** tab
2. Find the latest deployment (commit `f232852` from ~08:22 UTC today)
3. Click the **three dots** (⋯) → **Redeploy**
4. Confirm the redeploy

**Option B: Redeploy via Git Push**
```bash
cd /home/finch/repos/pipetgo

# Create empty commit to trigger redeploy
git commit --allow-empty -m "chore: redeploy with Redis env vars"
git push origin main

# Vercel will auto-deploy (takes 1-2 minutes)
```

---

## Why This Matters

### The Problem Chain

1. **Code uses rate limiting** (`src/app/api/auth/[...nextauth]/route.ts`):
   ```typescript
   import { loginRateLimiter } from '@/lib/rate-limit'
   const rateLimit = await checkRateLimit(loginRateLimiter, ip)
   ```

2. **Rate limiter needs Redis** (`src/lib/rate-limit.ts`):
   ```typescript
   const redis = Redis.fromEnv()  // Reads UPSTASH_REDIS_REST_*
   export const loginRateLimiter = new Ratelimit({
     redis,
     limiter: Ratelimit.slidingWindow(5, "15 m")
   })
   ```

3. **Without env vars**:
   - `Redis.fromEnv()` throws error or returns invalid instance
   - Rate limiter initialization fails
   - POST handler crashes before reaching NextAuth
   - Returns 500 with empty body

4. **Other endpoints work** because:
   - GET handler doesn't use rate limiting
   - `/providers`, `/csrf` use GET handler only
   - Only POST to `/callback/credentials` triggers rate limit check

---

## Verification After Redeploy

### Wait for Deployment
```bash
# Monitor deployment status
gh api repos/alfieprojectsdev/pipetgo/deployments --jq '.[0] | {created_at, sha}'

# Wait until you see a NEW deployment (created_at after current time)
```

### Test 1: Check Environment (Quick)
```bash
# This should work if Redis is initialized
curl -s https://www.pipetgo.com/api/auth/providers | python3 -m json.tool
```

### Test 2: Test Login Endpoint
```python
python3 << 'EOF'
import requests

# Get CSRF
csrf_resp = requests.get('https://www.pipetgo.com/api/auth/csrf')
csrf_token = csrf_resp.json()['csrfToken']

# Try login
resp = requests.post(
    'https://www.pipetgo.com/api/auth/callback/credentials',
    data={
        'csrfToken': csrf_token,
        'email': 'lab1@pgtestinglab.com',
        'password': 'wrongpassword',  # Intentionally wrong
        'callbackUrl': '/'
    },
    allow_redirects=False
)

print(f"Status Code: {resp.status_code}")
print(f"Expected: 302 (redirect) or 401 (auth failed)")
print(f"NOT Expected: 500 (server error)")

if resp.status_code == 500:
    print("❌ STILL BROKEN - Check Vercel logs for new error")
elif resp.status_code in [302, 401, 200]:
    print("✅ FIXED - No more 500 errors!")
else:
    print(f"⚠️  UNEXPECTED - Status {resp.status_code}")
EOF
```

### Test 3: Manual Browser Test
```
1. Open: https://www.pipetgo.com/auth/signin
2. Enter: lab1@pgtestinglab.com
3. Password: HSmgGnbBcZ!zRsGQsnDkNHnu
4. Click "Sign in"

Expected outcomes:
✅ Login succeeds → Redirects to dashboard
✅ "Invalid credentials" error message
❌ 500 error or blank page
```

---

## Common Issues

### Issue 1: Variables Not Taking Effect

**Symptom:** Still getting 500 after adding vars
**Cause:** Deployment didn't pick up new environment variables
**Solution:**
```bash
# Force complete rebuild
git commit --allow-empty -m "chore: force rebuild"
git push
```

### Issue 2: Wrong Environment Selected

**Symptom:** Preview works but Production doesn't
**Cause:** Variables only added to Preview environment
**Solution:** Re-add variables with "Production" checked

### Issue 3: Typo in Variable Names

**Symptom:** Still fails with Redis errors in logs
**Cause:** Variable names must be EXACT:
- ✅ `UPSTASH_REDIS_REST_URL` (correct)
- ❌ `UPSTASH_REDIS_URL` (wrong)
- ❌ `REDIS_REST_URL` (wrong)

---

## Additional Environment Variables

While you're in the Environment Variables page, verify these are also set for **Production**:

### Critical Variables
```
DATABASE_URL          = postgresql://neondb_owner:...
NEXTAUTH_SECRET       = 0s9JQtXNbLOgUZu0EXtYvZMNpUoVdkVMeIF/BSX7QiE=
NEXTAUTH_URL          = https://www.pipetgo.com  (⚠️ should be www.pipetgo.com, not pipetgo.vercel.app)
```

### Optional Variables
```
SENDGRID_API_KEY      = SG.xxx... (if using email)
SENTRY_DSN            = https://xxx@sentry.io/xxx (if using error tracking)
NEXT_PUBLIC_GOATCOUNTER_URL = https://ithinkandicode.goatcounter.com/count
```

**Note:** Variables prefixed with `NEXT_PUBLIC_` are embedded in the client bundle and visible to users. Don't use this prefix for secrets!

---

## Timeline Expectation

```
T+0 min:  Add environment variables in Vercel dashboard
T+0 min:  Trigger redeploy (via dashboard or git push)
T+1 min:  Deployment builds
T+2 min:  Deployment completes
T+2 min:  CDN cache clears
T+3 min:  Test login endpoint → Should work! ✅
```

---

## If It Still Fails

After adding env vars and redeploying, if it STILL returns 500:

1. **Download fresh logs** from Vercel:
   - Deployments → Active deployment → Logs
   - Look for the actual error message
   - Should show a DIFFERENT error than "req.query undefined"

2. **Check Redis connection**:
   ```bash
   # Test Redis endpoint directly
   curl -H "Authorization: Bearer Aab8AAIncDI4YTM1ZDNjMjBiYTE0ZjFhYjMyYTQ5M2QyMjQ2YTNjZnAyNDI3NDg" \
     https://alive-tarpon-42748.upstash.io/ping

   # Should return: {"result":"PONG"}
   ```

3. **Report back** with:
   - New error message from logs
   - Status code returned
   - Any headers showing different deployment ID

---

## Success Criteria

✅ Login endpoint returns 302/401 instead of 500
✅ No errors in Vercel logs for `/callback/credentials`
✅ Can successfully login with valid credentials
✅ Rate limiting works (try 6 failed logins, should get 429)

---

**Next Steps:**
1. Add the two Redis environment variables to Vercel dashboard
2. Redeploy (via dashboard or git push)
3. Wait 2-3 minutes
4. Run the verification tests above
5. Report back with results!
