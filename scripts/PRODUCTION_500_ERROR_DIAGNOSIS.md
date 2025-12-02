# Production 500 Error - Diagnostic Guide

**Error:** `POST /api/auth/callback/credentials` returns 500 with empty JSON body

**Symptom:** "Unexpected end of JSON input" on client side

---

## Likely Root Causes (In Order of Probability)

### 1. Missing Environment Variable: `NEXTAUTH_SECRET` ⚠️ MOST LIKELY

**Evidence:**
- NextAuth requires `NEXTAUTH_SECRET` to encrypt session tokens
- If missing, NextAuth crashes during authentication
- Crash produces 500 error with no response body

**How to Check:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `NEXTAUTH_SECRET` exists for **Production** environment
3. Value should be a long random string (32+ characters)

**How to Fix:**
```bash
# Generate new secret:
openssl rand -base64 32

# Add to Vercel:
# 1. Go to Settings → Environment Variables
# 2. Add variable:
#    Name: NEXTAUTH_SECRET
#    Value: <generated secret>
#    Environment: Production
# 3. Redeploy application
```

---

### 2. Missing Environment Variable: `DATABASE_URL`

**Evidence:**
- Prisma needs `DATABASE_URL` to connect to Neon
- If missing/incorrect, database connection fails
- Authentication queries fail → 500 error

**How to Check:**
1. Vercel Dashboard → Settings → Environment Variables
2. Verify `DATABASE_URL` exists and points to correct Neon database
3. Format: `postgresql://user:password@host/database?sslmode=require`

**How to Fix:**
1. Get connection string from Neon dashboard
2. Update in Vercel environment variables
3. Redeploy

---

### 3. Bcrypt Module Not in Production Build

**Evidence:**
- bcryptjs is a dependency for password hashing
- If not included in production build, import fails
- `verifyPassword()` crashes → 500 error

**How to Check:**
```bash
# Verify bcryptjs is in dependencies (not devDependencies)
grep bcryptjs package.json
```

**Expected:**
```json
"dependencies": {
  "bcryptjs": "^3.0.2"
}
```

**How to Fix:**
If bcryptjs is in devDependencies, move it:
```bash
npm install --save bcryptjs
git commit -am "fix: move bcryptjs to production dependencies"
git push
```

---

### 4. Rate Limiting Redis Connection Failure

**Evidence:**
- Rate limiting uses Upstash Redis
- If Redis credentials are invalid, connection might crash
- However, code has fail-open logic (should NOT cause 500)

**How to Check:**
1. Vercel Dashboard → Settings → Environment Variables
2. Check if these exist:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

**How to Fix:**
If variables are INCORRECT (not missing), either:
- **Option A:** Fix the values (get from Upstash dashboard)
- **Option B:** Delete them entirely (rate limiting will disable, which is OK for now)

---

## Diagnostic Steps (Do These in Order)

### Step 1: Check Vercel Function Logs

**This is the FASTEST way to find the actual error:**

1. Go to Vercel Dashboard
2. Click on your project (pipetgo)
3. Go to **Deployments** → Click on latest deployment
4. Go to **Functions** tab
5. Look for `/api/auth/callback/credentials` function
6. Check the logs for error messages

**What to look for:**
- `Error: NEXTAUTH_SECRET not set` → Missing env var
- `PrismaClientInitializationError` → Database connection issue
- `Cannot find module 'bcryptjs'` → Missing dependency
- Any other error with stack trace

### Step 2: Verify Environment Variables

Go to Settings → Environment Variables and verify:

| Variable | Required | Current Status |
|----------|----------|----------------|
| `NEXTAUTH_SECRET` | ✅ YES | ❓ CHECK |
| `NEXTAUTH_URL` | ✅ YES | Should be https://www.pipetgo.com |
| `DATABASE_URL` | ✅ YES | ❓ CHECK (Neon connection string) |
| `UPSTASH_REDIS_REST_URL` | ⚠️ Optional | Can be empty |
| `UPSTASH_REDIS_REST_TOKEN` | ⚠️ Optional | Can be empty |
| `UPLOADTHING_SECRET` | ⚠️ Optional | Not needed for auth |
| `UPLOADTHING_APP_ID` | ⚠️ Optional | Not needed for auth |

### Step 3: Verify Database Passwords Were Set

Run this query in Neon SQL console:

```sql
SELECT email, "hashedPassword" IS NOT NULL as has_password
FROM users
WHERE email = 'lab1@pgtestinglab.com';
```

**Expected:** `has_password = true`

If `false`, the UPDATE didn't work. Re-run `scripts/EXECUTE_THIS_NOW.sql`

### Step 4: Test with Different User

If lab1@pgtestinglab.com still fails, try creating a new test user:

```sql
-- Create simple test user
INSERT INTO users (id, email, name, role, "hashedPassword", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'test@test.com',
  'Test User',
  'LAB_ADMIN',
  '$2b$12$h/kWZYI1SIPahWOiWtprveXbw/Tzpgyr0wOaPik/kZvAb49UFl/YK', -- Same hash as lab1
  NOW(),
  NOW()
);
```

Then try logging in with:
- Email: test@test.com
- Password: HSmgGnbBcZ!zRsGQsnDkNHnu (same as lab1)

If this works but lab1 doesn't, there's something specific about lab1's user record.

---

## Most Likely Fix (90% confidence)

**Add `NEXTAUTH_SECRET` to Vercel:**

```bash
# 1. Generate secret locally
openssl rand -base64 32

# 2. Copy the output (e.g., "abc123xyz...")

# 3. Go to Vercel Dashboard
#    → Settings
#    → Environment Variables
#    → Add Variable
#      Name: NEXTAUTH_SECRET
#      Value: <paste generated secret>
#      Environments: Production (check the box)
#
# 4. Click Save

# 5. Redeploy
#    → Go to Deployments tab
#    → Click "..." on latest deployment
#    → Click "Redeploy"
```

**After redeploy:**
- Wait 1-2 minutes for deployment to complete
- Try logging in again at www.pipetgo.com/auth/signin
- Should work now!

---

## If Still Failing After NEXTAUTH_SECRET

Check Vercel function logs (Step 1 above) to see the ACTUAL error message.

Common errors you might see:

### "PrismaClientInitializationError"
**Fix:** DATABASE_URL is wrong or Neon database is unreachable
- Verify connection string in Vercel env vars
- Test connection string locally:
  ```bash
  DATABASE_URL="<your_connection_string>" npx prisma db pull
  ```

### "bcryptjs module not found"
**Fix:** bcryptjs not installed in production
- Check package.json: bcryptjs should be in `dependencies`, not `devDependencies`
- If wrong section, fix and redeploy

### "Cannot read property 'hashedPassword' of null"
**Fix:** User doesn't exist in database
- Re-run verification query (Step 3)
- User might not have been created yet

---

## Quick Checklist

Before asking for help, verify:

- [ ] `NEXTAUTH_SECRET` exists in Vercel production env vars
- [ ] `DATABASE_URL` exists and points to correct Neon database
- [ ] Database password update was successful (verification query shows `has_password = true`)
- [ ] Checked Vercel function logs for actual error message
- [ ] Tried redeploying after fixing env vars
- [ ] Waited 1-2 minutes after redeploy before testing

---

## Contact Points

**Vercel Dashboard:** https://vercel.com/[your-project]
**Neon Dashboard:** https://console.neon.tech
**Function Logs:** Vercel Dashboard → Deployments → Latest → Functions

---

**Next Step:** Check Vercel function logs first. That will tell us exactly what's crashing.
