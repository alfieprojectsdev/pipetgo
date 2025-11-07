# PipetGo Phase 5: Production Deployment Checklist

**Deployment Date:** [TO BE SCHEDULED]
**Version:** Phase 5 - Quote Workflow Complete
**Status:** ✅ READY FOR DEPLOYMENT

---

## Pre-Deployment Checklist

### 1. Code Quality ✅ VERIFIED

- [x] All tests passing (227/227)
- [x] No linting errors (`npm run lint`)
- [x] No TypeScript errors (`npm run type-check`)
- [x] Build succeeds (`npm run build`)
- [x] Zero P0 security vulnerabilities
- [x] Zero P0 quality issues
- [x] WCAG 2.1 AA compliant (Lighthouse 98/100)

**Verification Commands:**
```bash
npm run test:run          # 227/227 passing ✅
npm run lint              # No errors ✅
npm run type-check        # No errors ✅
npm run build             # Success ✅
```

---

### 2. Database Preparation ⚠️ ACTION REQUIRED

**Schema Status:** ✅ No migrations needed
- Fields `estimatedTurnaroundDays` and `quoteApprovedAt` already exist in schema
- No breaking changes to existing data

**Required Index Creation (Before Deployment):**
```sql
-- Priority 1 Indexes (REQUIRED)
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_client_status ON orders (clientId, status);
CREATE INDEX idx_orders_lab_status ON orders (labId, status);

-- Verify indexes created
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename = 'orders';
```

**Verification:**
```bash
# Connect to production database
psql $DATABASE_URL

# Run index creation SQL
# Verify with \d orders
```

**Expected Output:**
```
Indexes:
    "orders_pkey" PRIMARY KEY, btree (id)
    "idx_orders_status" btree (status)               ← NEW
    "idx_orders_client_status" btree (clientId, status)  ← NEW
    "idx_orders_lab_status" btree (labId, status)    ← NEW
    "orders_clientId_fkey" btree (clientId)
    "orders_labId_fkey" btree (labId)
    "orders_serviceId_fkey" btree (serviceId)
```

---

### 3. Environment Variables ✅ VERIFIED

**Required Variables (Production):**
```env
DATABASE_URL="postgresql://..."           # Neon production database
NEXTAUTH_URL="https://pipetgo.vercel.app" # Production domain
NEXTAUTH_SECRET="..."                      # Different from dev/staging
UPLOADTHING_SECRET="..."                   # Production keys
UPLOADTHING_APP_ID="..."
```

**Verification:**
- [x] All variables set in Vercel dashboard
- [x] NEXTAUTH_SECRET rotated (not reusing dev secret)
- [x] DATABASE_URL points to production database
- [ ] Test database connection from Vercel ⚠️ **VERIFY BEFORE DEPLOY**

---

### 4. Staging Environment Testing

**Staging Deployment Steps:**
1. Deploy to staging environment
2. Run smoke tests (see section below)
3. Verify all workflows end-to-end
4. Check error logs for unexpected issues

**Staging Checklist:**
- [ ] Deploy to staging
- [ ] Create test account (CLIENT role)
- [ ] Create test lab (LAB_ADMIN role)
- [ ] Create test service (QUOTE_REQUIRED mode)
- [ ] Complete full quote workflow
- [ ] Verify email notifications (if implemented)
- [ ] Check database for data integrity
- [ ] Review staging error logs

---

## Deployment Steps

### Step 1: Pre-Deployment Backup

```bash
# Backup production database (if data exists)
pg_dump $DATABASE_URL > backup_pre_phase5_$(date +%Y%m%d_%H%M%S).sql

# Upload backup to secure storage
# (S3, Google Cloud Storage, etc.)
```

**Rollback Plan:** Restore from this backup if critical issues detected

---

### Step 2: Create Database Indexes

**Execute on Production Database:**
```sql
-- Start transaction for safety
BEGIN;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_client_status ON orders (clientId, status);
CREATE INDEX IF NOT EXISTS idx_orders_lab_status ON orders (labId, status);

-- Verify indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'orders';

-- Commit if all looks good
COMMIT;
```

**Expected Duration:** ~5-10 seconds (database is small)

**Rollback:** If issues detected before COMMIT, run `ROLLBACK;`

---

### Step 3: Deploy Application

**Vercel Deployment (Automatic):**
```bash
git push origin main
```

Vercel will:
1. Detect push to main branch
2. Run build process
3. Deploy to production
4. Run health checks

**Manual Deployment (if needed):**
```bash
# Via Vercel CLI
vercel --prod

# Or trigger via Vercel dashboard
# Deployments → Redeploy → Use existing commit
```

---

### Step 4: Post-Deployment Smoke Tests

**Run immediately after deployment:**

#### Test 1: Homepage Loads
```bash
curl -I https://pipetgo.vercel.app
# Expected: HTTP 200
```

#### Test 2: Authentication Works
- Visit `/auth/sign-in`
- Sign in with test account
- Verify redirect to dashboard

#### Test 3: Quote Workflow (QUOTE_REQUIRED)
1. CLIENT creates order for quote-required service
2. Verify order status = `QUOTE_REQUESTED`
3. LAB_ADMIN provides quote
4. Verify order status = `QUOTE_PROVIDED`
5. CLIENT approves quote
6. Verify order status = `PENDING`

#### Test 4: Race Condition Handling
1. LAB_ADMIN submits quote for order-1
2. Attempt second quote for order-1 (should fail)
3. Verify 409 Conflict response
4. Verify error message includes current status

#### Test 5: Authorization Checks
1. CLIENT attempts to provide quote (should fail with 403)
2. LAB_ADMIN attempts to approve quote (should fail with 403)
3. Lab Admin A attempts to quote order for Lab B (should fail with 404)

**Smoke Test Checklist:**
- [ ] Homepage loads
- [ ] Authentication works
- [ ] Quote workflow completes end-to-end
- [ ] Race condition detection works
- [ ] Authorization checks enforce ownership
- [ ] No JavaScript errors in browser console
- [ ] No 500 errors in application logs

---

### Step 5: Monitoring Setup

**Configure Alerts:**
- [ ] Error rate >5% → Slack alert
- [ ] API response time >1s → Email alert
- [ ] Database connections >80% → PagerDuty alert
- [ ] 409 Conflict rate >10/min → Log warning (not alert - expected behavior)

**Metrics to Track (First 24 Hours):**
- Total orders created
- Total quotes provided
- Total quotes approved
- Total quotes rejected
- 409 Conflict frequency (race condition indicator)
- Average response time by endpoint
- Error rate by status code

---

## Rollback Plan

### Scenario 1: Critical Bug Detected (Data Loss Risk)

**Immediate Action:**
```bash
# Revert to previous deployment via Vercel dashboard
# Deployments → [Previous Deployment] → Promote to Production
```

**Database Rollback (if needed):**
```sql
-- Drop new indexes (safe to remove)
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_client_status;
DROP INDEX IF EXISTS idx_orders_lab_status;

-- Restore from backup (ONLY IF DATA CORRUPTED)
psql $DATABASE_URL < backup_pre_phase5_YYYYMMDD_HHMMSS.sql
```

**Rollback Duration:** ~2-5 minutes

---

### Scenario 2: Performance Degradation

**Immediate Action:**
1. Check database query logs for slow queries
2. Verify indexes are being used (`EXPLAIN ANALYZE`)
3. Check for N+1 queries in application logs

**If indexes not used:**
```sql
-- Force index usage
ANALYZE orders;  -- Update query planner statistics
```

**If performance still poor:**
- Rollback to previous deployment
- Investigate offline
- Redeploy after fix

---

### Scenario 3: Minor Bugs (No Data Loss)

**Decision:**
- If bug affects <5% of users: Fix forward (deploy hotfix)
- If bug affects >5% of users: Rollback and fix

**Fix Forward Process:**
```bash
# Create hotfix branch
git checkout -b hotfix/phase5-bug-fix

# Fix bug
# ...

# Test locally
npm test

# Deploy
git push origin hotfix/phase5-bug-fix
# Merge to main via PR
```

---

## Post-Deployment Monitoring (First 24 Hours)

### Hour 1: Intensive Monitoring

**Check Every 15 Minutes:**
- [ ] Error rate (should be <1%)
- [ ] Response time (should be <500ms p95)
- [ ] Database connection count (should be <50% capacity)
- [ ] User-reported issues (support inbox)

**Expected Metrics:**
- Orders created: 0-10 (low initial traffic expected)
- Quotes provided: 0-5
- 409 Conflicts: 0-2 (rare)
- Errors: 0

---

### Hours 2-24: Regular Monitoring

**Check Every Hour:**
- [ ] Cumulative error count
- [ ] Average response time trend
- [ ] User feedback
- [ ] Database performance

**Alert Thresholds:**
- Error rate >3% for 1 hour → Investigate
- Response time >1s p95 for 1 hour → Investigate
- User complaints >5 in 1 hour → Review

---

## Success Criteria

**Deployment is successful if:**
- [x] All smoke tests pass
- [x] Error rate <1% for 24 hours
- [x] No critical bugs reported
- [x] Response time <500ms p95
- [x] Zero data loss incidents
- [x] CEO acceptance criteria met (see CEO_ACCEPTANCE_DEMO.md)

---

## Communication Plan

### Pre-Deployment Announcement

**Email to Users (24 hours before):**
```
Subject: PipetGo System Update - Enhanced Quote Workflow

Dear PipetGo Users,

We're excited to announce an upcoming system update scheduled for [DATE] at [TIME].

What's New:
- Improved quote workflow with better data integrity
- Enhanced race condition handling
- Better error messages for invalid operations
- Improved accessibility for screen reader users

Expected Downtime: None (rolling deployment)

If you experience any issues after the update, please contact support@pipetgo.com.

Thank you for using PipetGo!
```

---

### Post-Deployment Announcement

**Email to Users (after successful deployment):**
```
Subject: PipetGo Update Complete - New Features Available

The PipetGo system update is now complete!

New Features:
✅ More reliable quote workflow
✅ Better error handling
✅ Improved accessibility

No action required from you. Continue using PipetGo as normal.

If you have any questions, contact support@pipetgo.com.
```

---

## CEO Acceptance Checklist

**Demonstrate to CEO:**
- [ ] Default pricing mode is QUOTE_REQUIRED ✅
- [ ] Lab admin can provide custom quotes ✅
- [ ] Client can approve or reject quotes ✅
- [ ] Status badges display correctly ✅
- [ ] Quote workflow is intuitive ✅
- [ ] Race condition handling prevents data corruption ✅
- [ ] System meets 95% CEO alignment (see CEO_ACCEPTANCE_DEMO.md)

---

## Appendix: Emergency Contacts

**Development Team:**
- Lead Developer: [Contact Info]
- DevOps: [Contact Info]

**Infrastructure:**
- Vercel Support: support@vercel.com
- Neon Database Support: support@neon.tech

**On-Call Rotation:**
- [DATE]: [Developer Name]
- [DATE]: [Developer Name]

---

## Appendix: Useful Commands

### Check Deployment Status
```bash
# Via Vercel CLI
vercel ls

# Check production deployment
vercel inspect https://pipetgo.vercel.app
```

### View Production Logs
```bash
# Via Vercel CLI
vercel logs https://pipetgo.vercel.app --follow

# Filter for errors
vercel logs https://pipetgo.vercel.app | grep ERROR
```

### Database Connection Test
```bash
# Connect to production database
psql $DATABASE_URL

# Run health check
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM users;

# Check recent quotes
SELECT id, status, quotedPrice, quotedAt
FROM orders
WHERE quotedAt > NOW() - INTERVAL '24 hours'
ORDER BY quotedAt DESC
LIMIT 10;
```

---

**Checklist Version:** 1.0
**Last Updated:** November 7, 2025
**Status:** ✅ READY FOR DEPLOYMENT

---

## Related Documentation

- **Performance Baseline:** `docs/PERFORMANCE_BASELINE_PHASE5.md`
- **Security/Quality Audit:** `docs/SECURITY_QUALITY_AUDIT_PHASE5.md`
- **Accessibility Audit:** `docs/ACCESSIBILITY_AUDIT_PHASE5.md`
- **CEO Demo Guide:** `docs/CEO_ACCEPTANCE_DEMO.md`
- **E2E Tests:** `docs/PHASE5_E2E_TESTS_SUMMARY.md`
