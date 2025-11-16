# NeonDB Deployment Guide for PipetGo

## Quick Answer: SQL Files to Run

For **fresh deployment** (new database):
1. Run: `prisma/migrations/20251031111656_add_quotation_system/migration.sql`
2. Run: `prisma/deployment.sql`

For **existing database** (update only):
1. Run: `prisma/deployment.sql` only

---

## Detailed Deployment Instructions

### Option 1: Fresh Database (New Deployment)

If you're deploying to a **completely empty NeonDB database**:

```bash
# 1. Connect to NeonDB production database
psql "$DATABASE_URL"

# 2. Run the main migration (creates all tables)
\i prisma/migrations/20251031111656_add_quotation_system/migration.sql

# 3. Run the deployment SQL (adds missing fields and indexes)
\i prisma/deployment.sql

# 4. Exit psql
\q
```

**Alternative using file redirection:**
```bash
# Run main migration
psql "$DATABASE_URL" < prisma/migrations/20251031111656_add_quotation_system/migration.sql

# Run deployment updates
psql "$DATABASE_URL" < prisma/deployment.sql
```

---

### Option 2: Update Existing Database

If your database **already has tables** from the previous migration:

```bash
# Connect to NeonDB
psql "$DATABASE_URL"

# Run only the deployment SQL (safe - uses IF NOT EXISTS)
\i prisma/deployment.sql

# Exit
\q
```

**Or using file redirection:**
```bash
psql "$DATABASE_URL" < prisma/deployment.sql
```

---

### Option 3: Using Prisma CLI (Recommended for Development)

For **development database** updates:

```bash
# Push schema changes to development database
npm run db:push

# Or create and apply migrations
npm run db:migrate
```

⚠️ **Note:** Prisma CLI connects using `DATABASE_URL` from `.env.local`

---

## What Each SQL File Does

### 1. `migration.sql` (Main Schema)
**File:** `prisma/migrations/20251031111656_add_quotation_system/migration.sql`

**What it creates:**
- ✅ All database tables (users, labs, orders, etc.)
- ✅ Enums (UserRole, PricingMode, OrderStatus)
- ✅ Foreign key relationships
- ✅ Basic indexes (primary keys, foreign keys)

**Size:** 171 lines
**Run when:** Fresh database deployment only

---

### 2. `deployment.sql` (Updates & Optimization)
**File:** `prisma/deployment.sql`

**What it adds:**
- ✅ Missing columns (`estimatedTurnaroundDays`, `quoteApprovedAt`)
- ✅ Performance indexes (required for production)
  - `idx_orders_status`
  - `idx_orders_client_status`
  - `idx_orders_lab_status`

**Size:** ~70 lines
**Run when:** Always (safe with `IF NOT EXISTS` clauses)
**Purpose:** Brings database in sync with Phase 5 requirements

---

## Environment Setup

### Development Database

```bash
# Edit .env.local
DATABASE_URL="postgresql://neondb_owner:npg_QWYgB1Nmqoh4@ep-flat-voice-a1se0mqp-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

### Production Database

```bash
# Edit .env.production
DATABASE_URL="postgresql://neondb_owner:npg_whN0LTIer1OS@ep-withered-tree-a17pkftr-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

---

## Verification Steps

After running the SQL files, verify everything is correct:

```sql
-- 1. Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables:
-- Account
-- Session
-- VerificationToken
-- attachments
-- lab_services
-- labs
-- orders
-- users

-- 2. Verify new columns in orders table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders'
AND column_name IN ('estimatedTurnaroundDays', 'quoteApprovedAt');

-- Expected output:
--  estimatedTurnaroundDays | integer          | YES
--  quoteApprovedAt         | timestamp        | YES

-- 3. Verify performance indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'orders'
ORDER BY indexname;

-- Expected indexes:
--  idx_orders_client_status  ← NEW
--  idx_orders_lab_status     ← NEW
--  idx_orders_status         ← NEW
--  orders_clientId_fkey
--  orders_labId_fkey
--  orders_pkey
--  orders_serviceId_fkey

-- 4. Check row counts (should show existing data if updating)
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM labs) as labs,
  (SELECT COUNT(*) FROM lab_services) as services,
  (SELECT COUNT(*) FROM orders) as orders;
```

---

## Troubleshooting

### Error: "relation already exists"
**Solution:** You're running `migration.sql` on an existing database. Use `deployment.sql` only.

### Error: "column already exists"
**Solution:** This is expected! The SQL uses `IF NOT EXISTS` - it's safe to ignore.

### Error: "password authentication failed"
**Solution:** Check that you're using the correct password from `.env.dev` or `.env.prod`

### Error: "SSL connection required"
**Solution:** Ensure your connection string includes `?sslmode=require&channel_binding=require`

---

## Deployment Checklist

### Pre-Deployment
- [ ] Database passwords rotated (stored in `.env.dev` and `.env.prod`)
- [ ] Environment files configured (`.env.local` and `.env.production`)
- [ ] Backup existing data (if updating production database)

### Deployment
- [ ] Run appropriate SQL file(s) based on scenario
- [ ] Verify tables created (see Verification Steps)
- [ ] Verify columns added (`estimatedTurnaroundDays`, `quoteApprovedAt`)
- [ ] Verify indexes created (3 new indexes)

### Post-Deployment
- [ ] Test database connection from Vercel
- [ ] Run `npm run db:push` locally to verify schema sync
- [ ] Check application logs for database errors
- [ ] Verify quote workflow works end-to-end

---

## Rollback Plan

If you need to undo the deployment changes:

```sql
-- Remove new indexes (safe to drop)
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_client_status;
DROP INDEX IF EXISTS idx_orders_lab_status;

-- Remove new columns (⚠️ DATA LOSS if columns have data)
ALTER TABLE orders DROP COLUMN IF EXISTS "estimatedTurnaroundDays";
ALTER TABLE orders DROP COLUMN IF EXISTS "quoteApprovedAt";
```

⚠️ **Warning:** Dropping columns deletes data permanently. Only rollback if absolutely necessary.

---

## Next Steps After Database Deployment

1. **Deploy to Vercel:**
   ```bash
   git push origin main
   ```
   Vercel will auto-deploy when it detects the push.

2. **Set Vercel Environment Variables:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add `DATABASE_URL` (production connection string)
   - Add `NEXTAUTH_SECRET` (from `.env.production`)
   - Add `NEXTAUTH_URL` (`https://pipetgo.vercel.app`)

3. **Test Production Deployment:**
   - Visit https://pipetgo.vercel.app
   - Sign in with test account
   - Create a test order
   - Verify quote workflow works

---

## Related Documentation

- **Deployment Checklist:** `docs/DEPLOYMENT_CHECKLIST.md`
- **Performance Baseline:** `docs/PERFORMANCE_BASELINE_PHASE5.md`
- **Database Schema:** `prisma/schema.prisma`
- **Environment Setup:** `.env.example`

---

**Last Updated:** 2025-11-08
**Database Version:** Phase 5 Complete (v1.0.0-phase5-complete)
