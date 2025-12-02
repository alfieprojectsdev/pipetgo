# Production Fix - Automated Script

## Quick Start (3 Steps)

### 1. Install Dependencies (if needed)

```bash
npm install
```

This will install `pg` and `dotenv` packages needed to run the script.

### 2. Set Database URL

The script needs the production DATABASE_URL. You have two options:

**Option A: Temporary (one-time use)**
```bash
DATABASE_URL="your-production-neon-url-here" npx tsx scripts/update-production-db.ts
```

**Option B: Via .env file**
```bash
# Create/edit .env file
echo 'DATABASE_URL="your-production-neon-url-here"' >> .env

# Run script
npx tsx scripts/update-production-db.ts
```

### 3. Run the Script

```bash
npx tsx scripts/update-production-db.ts
```

**What it does:**
1. ✅ Connects to production database
2. ✅ Checks which lab admin users exist
3. ✅ Creates any missing users
4. ✅ Updates ALL users with hashed passwords
5. ✅ Verifies passwords were set correctly

---

## Expected Output

```
🔧 Production Database Update Script
=====================================

📡 Connecting to database...
✅ Connected to database

🔍 Step 1: Checking which users exist...
   Found 4 existing users:

   - lab1@pgtestinglab.com: ❌ No password
   - lab2@pgtestlab.com: ❌ No password
   - lab3@pgtstlab.com: ❌ No password
   - lab4@testlabpg.com: ❌ No password

✅ Step 2: All users already exist (skip create)

🔑 Step 3: Updating passwords for all lab admins...
   ✅ Updated: lab1@pgtestinglab.com
   ✅ Updated: lab2@pgtestlab.com
   ✅ Updated: lab3@pgtstlab.com
   ✅ Updated: lab4@testlabpg.com

✅ Step 4: Verifying final state...

   Final Status (4 users):

   ✅ lab1@pgtestinglab.com: Password set
   ✅ lab2@pgtestlab.com: Password set
   ✅ lab3@pgtstlab.com: Password set
   ✅ lab4@testlabpg.com: Password set

============================================================
🎉 SUCCESS! All lab admin accounts have passwords set.

Next step:
1. Go to https://www.pipetgo.com/auth/signin
2. Test login with lab1@pgtestinglab.com
3. Password: (check scripts/ALL_ACCOUNT_CREDENTIALS.md)
============================================================

👋 Disconnected from database
```

---

## If Login Still Fails After Running Script

The script ONLY updates the database passwords. If login still fails with 500 error, the problem is likely:

### Missing Environment Variable in Vercel

**Most likely:** `NEXTAUTH_SECRET` is not set in Vercel

**How to fix:**
1. Generate secret: `openssl rand -base64 32`
2. Go to Vercel Dashboard → Settings → Environment Variables
3. Add:
   - Name: `NEXTAUTH_SECRET`
   - Value: (paste generated secret)
   - Environment: Production ✓
4. Redeploy application
5. Wait 1-2 minutes
6. Try logging in again

**See full diagnostic guide:** `scripts/PRODUCTION_500_ERROR_DIAGNOSIS.md`

---

## Troubleshooting the Script

### Error: "DATABASE_URL not found"

**Fix:** Set DATABASE_URL environment variable

```bash
# Get URL from Neon dashboard
# Format: postgresql://user:password@host/database?sslmode=require

# Set and run:
DATABASE_URL="your-url-here" npx tsx scripts/update-production-db.ts
```

### Error: "relation 'users' does not exist"

**Fix:** Database schema not migrated

```bash
# Run migrations first:
DATABASE_URL="your-url-here" npx prisma db push
# or
DATABASE_URL="your-url-here" npx prisma migrate deploy

# Then run update script again
```

### Error: "connection refused" or "timeout"

**Fix:** Connection string might be wrong or Neon database unreachable

1. Verify connection string from Neon dashboard
2. Ensure string includes `?sslmode=require` at the end
3. Test connection:
   ```bash
   DATABASE_URL="your-url-here" npx prisma db pull
   ```

---

## What the Script Does NOT Fix

This script only:
- ✅ Creates lab admin users (if missing)
- ✅ Sets hashed passwords in database

It does NOT:
- ❌ Fix Vercel environment variables
- ❌ Deploy code changes
- ❌ Fix authentication logic bugs
- ❌ Configure NextAuth settings

If login fails AFTER running this script successfully, check Vercel environment variables (especially `NEXTAUTH_SECRET`).

---

## Alternative: Manual SQL Execution

If you prefer to run SQL manually in Neon console, use:

```
scripts/EXECUTE_THIS_NOW.sql
```

Copy/paste into Neon SQL Editor and execute.

---

## Files in This Directory

| File | Purpose |
|------|---------|
| `update-production-db.ts` | **Automated script** (use this!) |
| `EXECUTE_THIS_NOW.sql` | Manual SQL (if script doesn't work) |
| `01-check-users-exist.sql` | Step 1: Check users |
| `02-create-users.sql` | Step 2: Create missing users |
| `03-update-passwords.sql` | Step 3: Update passwords |
| `04-verify-success.sql` | Step 4: Verify success |
| `PRODUCTION_500_ERROR_DIAGNOSIS.md` | If login still fails |
| `ALL_ACCOUNT_CREDENTIALS.md` | All credentials (CONFIDENTIAL) |

---

**Recommended:** Use `update-production-db.ts` (automated) over manual SQL execution.
