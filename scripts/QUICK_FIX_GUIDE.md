# Quick Production Fix - Step-by-Step

**Issues Fixed:**
1. ✅ "ROLLBACK required" error → Separated scripts (no transactions)
2. ✅ `relation "User" does not exist` → Fixed table name (`users` not `User`)

**Root Cause:**
- Prisma schema maps User model to lowercase `users` table (line 78: `@@map("users")`)
- Original scripts used `"User"` (capitalized) which doesn't exist

**Solution:** Run corrected scripts in order (now using `users` table)

---

## Execute These Scripts in Order

### 1. Check if users exist

**File:** `scripts/01-check-users-exist.sql`

```sql
SELECT email, role, "hashedPassword" IS NOT NULL as has_password, "createdAt"
FROM "User"
WHERE email IN (
  'lab1@pgtestinglab.com',
  'lab2@pgtestlab.com',
  'lab3@pgtstlab.com',
  'lab4@testlabpg.com'
)
ORDER BY email;
```

**What to expect:**
- **4 rows returned:** Users exist → Skip step 2, go to step 3
- **0 rows returned:** Users don't exist → Run step 2, then step 3
- **Some rows (1-3):** Partial data → Note which are missing, run step 2 selectively

---

### 2. Create users (ONLY if step 1 returned 0 rows)

**File:** `scripts/02-create-users.sql`

```sql
INSERT INTO "User" (id, email, name, role, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'lab1@pgtestinglab.com', 'Testing Lab 1 Admin', 'LAB_ADMIN', NOW(), NOW()),
  (gen_random_uuid(), 'lab2@pgtestlab.com', 'Testing Lab 2 Admin', 'LAB_ADMIN', NOW(), NOW()),
  (gen_random_uuid(), 'lab3@pgtstlab.com', 'Testing Lab 3 Admin', 'LAB_ADMIN', NOW(), NOW()),
  (gen_random_uuid(), 'lab4@testlabpg.com', 'Testing Lab 4 Admin', 'LAB_ADMIN', NOW(), NOW());
```

**What to expect:**
- Success message: "INSERT 0 4" (4 rows inserted)
- If error "duplicate key value": Users already exist, skip this step

---

### 3. Add passwords (ALWAYS run this)

**File:** `scripts/03-update-passwords.sql`

**⚠️ IMPORTANT:** Copy and paste the ENTIRE contents of `03-update-passwords.sql`

This includes 4 UPDATE statements (one per user).

**What to expect:**
- 4 success messages: "UPDATE 1" for each statement
- If you see "UPDATE 0": User with that email doesn't exist (check spelling)

**This is IDEMPOTENT** - safe to run multiple times!

---

### 4. Verify success

**File:** `scripts/04-verify-success.sql`

```sql
SELECT email, role, "hashedPassword" IS NOT NULL as has_password,
       LEFT("hashedPassword", 10) as hash_preview, "updatedAt"
FROM "User"
WHERE email IN (
  'lab1@pgtestinglab.com',
  'lab2@pgtestlab.com',
  'lab3@pgtstlab.com',
  'lab4@testlabpg.com'
)
ORDER BY email;
```

**What to expect:**
- 4 rows
- All with `has_password = true`
- All with `hash_preview = $2b$12$...`
- Recent `updatedAt` timestamps

---

## Test Login

After all 4 scripts complete successfully:

1. Go to: **https://www.pipetgo.com/auth/signin**

2. Enter credentials:
   - **Email:** lab1@pgtestinglab.com
   - **Password:** HSmgGnbBcZ!zRsGQsnDkNHnu

3. Click **Sign In**

**Expected:** Redirect to lab dashboard (no errors)

**If login fails:**
- Check browser console for errors
- Verify password copied correctly (no spaces)
- Re-run step 4 (verify) to confirm password was saved

---

## Troubleshooting

### Error: "ROLLBACK required"

**Cause:** You tried to run a multi-statement script with BEGIN/COMMIT

**Fix:** Run scripts individually (steps 1-4 above) without BEGIN/COMMIT

### Error: "duplicate key value"

**Cause:** Users already exist in database

**Fix:** Skip step 2 (create users), go directly to step 3 (update passwords)

### Error: "UPDATE 0" (no rows updated)

**Cause:** User with that email doesn't exist

**Fix:**
1. Check step 1 results - which users exist?
2. For missing users, run individual INSERT:
```sql
INSERT INTO "User" (id, email, name, role, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'lab1@pgtestinglab.com', 'Testing Lab 1 Admin', 'LAB_ADMIN', NOW(), NOW());
```
3. Re-run step 3 for that user

### Login still fails after password update

**Check these:**

1. **Verify password in database:**
```sql
SELECT email, "hashedPassword" FROM "User" WHERE email = 'lab1@pgtestinglab.com';
```
Should return non-NULL hash starting with `$2b$12$`

2. **Check Vercel environment variables:**
- Go to Vercel dashboard → Settings → Environment Variables
- Verify `NEXTAUTH_SECRET` is set
- Verify `DATABASE_URL` points to correct Neon database

3. **Check Vercel logs:**
- Go to Vercel dashboard → Deployments → Latest → Functions
- Look for authentication errors in logs

---

## Why This Approach Works

**Previous approach (failed):**
- One big SQL file with mixed SELECT/BEGIN/COMMIT
- Neon console can't parse this properly
- Transaction fails → "ROLLBACK required" error

**New approach (works):**
- Separate files for each step
- Each file has ONLY one type of operation
- No explicit transactions (Neon auto-commits)
- Idempotent - safe to re-run

**Key insight:** Neon console executes each statement immediately. Mixing queries with transactions causes parsing errors.

---

## Time Estimate

- **Step 1 (check):** 30 seconds
- **Step 2 (create users, if needed):** 30 seconds
- **Step 3 (update passwords):** 1 minute
- **Step 4 (verify):** 30 seconds
- **Testing login:** 2 minutes

**Total:** ~5 minutes

---

## Success Confirmation

You'll know it worked when:

✅ Step 4 shows all users with `has_password = true`
✅ Login at www.pipetgo.com succeeds
✅ Lab dashboard loads after login
✅ No errors in browser console
✅ No 500 errors in Vercel logs

**Then you're done!** 🎉

---

**Next:** Distribute credentials to lab admins from `scripts/ALL_ACCOUNT_CREDENTIALS.md`
