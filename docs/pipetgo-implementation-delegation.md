# PipetGo Implementation Delegation to Web Claude

**Created:** 2025-11-17
**Purpose:** Comprehensive handoff for delegating remaining implementation phases to Claude Code Web instance
**Current Status:** Phase 5 Complete (Testing/QA) - Ready for Phase 6+ or Deployment

---

## 🎯 Project Overview

**PipetGo** is a B2B marketplace connecting businesses with ISO 17025 certified laboratory testing services in the Philippines.

**Business Model:** Quotation-first marketplace (like "Alibaba RFQ for lab testing")
- Client submits Request for Quote (RFQ)
- Lab reviews and provides custom pricing
- Client approves quote
- Testing proceeds → Certified results delivered

**NOT an e-commerce instant-checkout platform** - this is critical context.

---

## 📊 Current Implementation Status

### ✅ COMPLETED PHASES

#### **Phase 1: Foundation** ✅
- TypeScript types system (200+ lines)
- Zod validation schemas
- Utility functions (67 tests passing)
- Base UI components (Button, Card, Input, Label, Textarea, Select, Badge, Alert)
- Testing infrastructure (Vitest + React Testing Library)
- **Tests:** 111/111 passing

#### **Phase 2-3: API Routes & Components** ✅
- All API endpoints functional
- Feature components (OrderCard, ServiceCard, etc.)
- **Tests:** 217 tests passing

#### **Phase 4: Quote Workflow UI** ✅
- Three pricing modes: QUOTE_REQUIRED, FIXED, HYBRID
- Quote provision UI (lab admin)
- Quote approval UI (client)
- Hybrid pricing toggle
- **Tests:** 227 tests passing

#### **Phase 5: E2E Testing & QA** ✅
- Comprehensive E2E test suite (10 E2E tests)
- Security audit (P0 vulnerabilities fixed)
- Accessibility audit (WCAG 2.1 AA - 98/100 Lighthouse score)
- Performance baseline established
- **Tests:** 227/227 passing, <5s execution time

#### **Testing Infrastructure Upgrade** ✅ (Nov 2025)
- Dual-mode database (mock + live)
- Map-based in-memory DB (replaced pg-mem)
- USE_MOCK_DB environment toggle
- Mock DB: 233 tests passing in 7.56s
- **Files Added:**
  - `src/lib/db-mock.ts` (301 lines)
  - `tests/lib/db-mock.test.ts` (136 lines)
  - Complete documentation

### 🟡 DEPLOYMENT READY (Not Yet Deployed)

**Status:** ✅ Ready for production deployment

**Pre-Deployment Checklist:**
- [x] All tests passing (233/233 mock, 227/227 integration)
- [x] Zero linting errors
- [x] Zero TypeScript errors
- [x] Build succeeds
- [x] P0 security vulnerabilities resolved
- [x] WCAG 2.1 AA compliant
- [ ] Database indexes created (see DEPLOYMENT_CHECKLIST.md)
- [ ] Environment variables configured in Vercel
- [ ] Staging environment smoke tests

**Deployment Guides Available:**
- `VERCEL_DEPLOYMENT_GUIDE.md` (untracked file, needs commit)
- `NEONDB_DEPLOYMENT_GUIDE.md`
- `docs/DEPLOYMENT_CHECKLIST.md`

---

## 📋 REMAINING PHASES (Stage 2+)

### Option A: Deploy Phase 5 to Production First
**Recommended:** Ship what's ready, iterate based on real user feedback

**Steps:**
1. Create database indexes (SQL in DEPLOYMENT_CHECKLIST.md)
2. Configure Vercel environment variables
3. Deploy to staging → smoke test → production
4. Monitor for 1-2 weeks
5. Then proceed to Stage 2 features

**Benefits:**
- Get real user feedback early
- Validate business model assumptions
- MVP in production sooner
- Incremental risk

---

### Option B: Continue Stage 2 Development Pre-Launch
**Stage 2: Professional Polish** (NOT started - 6-8 weeks estimated)

#### Phase 6: Real Authentication
**Current:** Email-only mock authentication (NextAuth configured but basic)
**Goal:** Production-grade auth with password hashing, session management

**Tasks:**
- [ ] Implement bcrypt password hashing
- [ ] Add password reset flow
- [ ] Email verification
- [ ] Session refresh tokens
- [ ] Rate limiting on auth endpoints (5 attempts/15min)
- [ ] 2FA (optional)

**Files to Modify:**
- `src/lib/auth.ts` - NextAuth configuration
- `src/app/api/auth/[...nextauth]/route.ts`
- Add: `src/app/api/auth/reset-password/route.ts`
- Add: `src/app/api/auth/verify-email/route.ts`

**Security Patterns (from Washboard):**
```typescript
// NEVER accept user_id from client
// ❌ const { user_id } = req.body;
// ✅ const user_id = req.user.userId; // from session

// Session regeneration after login
await session.regenerate();

// Rate limiting
if (attempts > 5 && timeSince < 15min) {
  return Response.json({ error: 'Too many attempts' }, { status: 429 });
}
```

**Check for P0 vulnerability:**
```bash
rg "req\.body\.user_id"
rg "userId.*req\.body"
```

**Estimated Time:** 2-3 weeks

---

#### Phase 7: Real File Upload (S3/UploadThing)
**Current:** Mock file uploads (URLs stored, no real storage)
**Goal:** Actual file upload to UploadThing CDN

**Tasks:**
- [ ] Configure UploadThing (keys already in .env)
- [ ] Implement file upload component
- [ ] Add progress indicators
- [ ] File type validation (PDF, images only)
- [ ] File size limits (10MB max)
- [ ] Virus scanning (ClamAV integration)
- [ ] Preview generation for images

**Files to Create:**
- `src/components/FileUpload.tsx`
- `src/app/api/uploadthing/route.ts`
- `src/lib/uploadthing.ts`

**UploadThing Setup:**
```bash
npm install uploadthing @uploadthing/react
```

**Estimated Time:** 1-2 weeks

---

#### Phase 8: Email Notifications
**Current:** No email notifications
**Goal:** Automated emails for order status changes

**Tasks:**
- [ ] Configure email provider (SendGrid/Resend)
- [ ] Email templates (React Email)
- [ ] Triggers for status changes:
  - Order created → Lab notified
  - Quote provided → Client notified
  - Quote approved → Lab notified
  - Results uploaded → Client notified
- [ ] Unsubscribe management
- [ ] Email preview in dev mode

**Email Events:**
```typescript
// When order created
await sendEmail({
  to: lab.email,
  subject: 'New Order Request',
  template: 'order-created',
  data: { orderNumber, clientName, service }
});
```

**Estimated Time:** 1-2 weeks

---

#### Phase 9: Payment Integration
**Current:** "Coming Soon" placeholder
**Goal:** Accept payments via PayMongo (Philippine payment gateway)

**Tasks:**
- [ ] PayMongo account setup
- [ ] Payment intent API
- [ ] Checkout flow UI
- [ ] Webhook handling (payment success/failure)
- [ ] Refund support
- [ ] Invoice generation
- [ ] Payment history dashboard

**Security Critical:**
- NEVER store credit card details
- Use PayMongo hosted checkout
- Verify webhooks with signature
- Log all payment events

**Estimated Time:** 2-3 weeks

---

### Stage 3: Scale & Growth (Future)

**Not Prioritized Yet** - Wait for user feedback from Stage 2

- Advanced search (Elasticsearch/Algolia)
- Reviews & ratings system
- Lab verification badges
- Multi-language support
- Mobile app (React Native)
- Analytics dashboard
- Bulk order discounts

---

## 🎯 Implementation Plans (To Be Generated by CLI Claude)

You mentioned: **"i'll generate these later with claude code cli pipetgo instance"**

When you create implementation plans, use this structure:

### Implementation Plan Template

```markdown
# Phase [X]: [Feature Name] - Implementation Plan

**Estimated Time:** [hours/days]
**Dependencies:** [What must be complete first]
**Risk Level:** [Low/Medium/High]

## Architecture Decision

**Approach:** [Chosen solution]
**Alternatives Considered:** [Other options]
**Rationale:** [Why this approach]

## Implementation Steps

### Step 1: [Task Name]
**Files to Modify:**
- `path/to/file.ts` (lines X-Y)
- `path/to/other.ts` (new file)

**Code Changes:**
```typescript
// Specific code examples
```

**Tests:**
- [ ] Unit test: describe('feature', () => {})
- [ ] Integration test: API endpoint
- [ ] E2E test: User workflow

**Acceptance Criteria:**
- [ ] Specific, testable criteria
- [ ] Performance benchmarks
- [ ] Security checks

### Step 2: [Next Task]
...

## Rollback Plan

If implementation fails:
1. Revert commits: `git revert ABC123`
2. Restore database: [specific steps]
3. Clear cache: [if applicable]

## Monitoring & Validation

**After Deploy:**
- Check error logs for [specific errors]
- Monitor [specific metrics]
- Verify [specific user flows]
```

---

## 🔧 Development Workflow for Web Claude

### Before Starting Any Phase

1. **Check root coordination:**
   ```bash
   # Read shared alerts
   cat /home/ltpt420/repos/claude-config/coordination/shared-alerts.md

   # Check priorities
   cat /home/ltpt420/repos/claude-config/coordination/priority-queue.md
   ```

2. **Pull latest changes:**
   ```bash
   cd /home/ltpt420/repos/pipetgo
   git fetch origin
   git pull origin main
   ```

3. **Verify tests pass:**
   ```bash
   npm run test:run:mock  # Should show 233/233 passing
   ```

4. **Check for security issues:**
   ```bash
   rg "req\.body\.user_id"  # Should return nothing
   rg "TODO|FIXME|XXX" --type ts  # Review todos
   ```

### During Implementation

1. **Follow TDD workflow:**
   - Write test first (it fails)
   - Implement minimal code to pass
   - Refactor while tests stay green
   - Commit frequently

2. **Use TodoWrite to track progress:**
   ```
   todos: [
     { content: "Implement bcrypt password hashing", status: "in_progress", activeForm: "Implementing bcrypt..." },
     { content: "Add password reset flow", status: "pending", activeForm: "Adding password reset..." }
   ]
   ```

3. **Commit conventions:**
   ```bash
   git commit -m "feat(auth): implement bcrypt password hashing

   - Add bcrypt dependency
   - Hash passwords on registration
   - Verify passwords on login
   - Update auth.ts with password comparison

   Tests: 15 new tests for password hashing"
   ```

### After Completing Each Phase

1. **Verify quality gates:**
   ```bash
   npm run test:run:mock    # All tests pass
   npm run lint             # Zero errors
   npm run type-check       # Zero errors
   npm run build            # Build succeeds
   ```

2. **Security audit:**
   ```bash
   rg "req\.body\.user_id"      # P0 vulnerability
   rg "req\.body\.driver_id"    # Resource hijacking
   rg "\`SELECT.*\$\{" --type ts  # SQL injection
   ```

3. **Update documentation:**
   - Update `docs/IMPLEMENTATION_STATUS.md`
   - Create phase summary (e.g., `PHASE_6_AUTH_SUMMARY.md`)
   - Update `CLAUDE.md` if architecture changed

4. **Push to GitHub:**
   ```bash
   git push origin claude/phase-6-authentication-<session-id>
   ```

---

## 🚨 Critical Patterns (From Washboard Experience)

### Security Patterns

#### ❌ NEVER Accept user_id from Client
```typescript
// P0 VULNERABILITY - Client can spoof any user
const { user_id, ... } = req.body;
await db.order.create({ data: { user_id, ... }});
```

#### ✅ ALWAYS Use Session user_id
```typescript
// SECURE - Server-side session verification
const session = await getServerSession(authOptions);
const user_id = session.user.userId;  // NOT from req.body
await db.order.create({ data: { user_id, ... }});
```

#### Session Regeneration
```typescript
// After successful login, regenerate session ID
await session.regenerate();
```

#### Rate Limiting
```typescript
// 5 attempts per 15 minutes
if (attempts > 5 && Date.now() - firstAttempt < 15 * 60 * 1000) {
  return Response.json({ error: 'Too many attempts' }, { status: 429 });
}
```

#### SQL Injection Prevention
```typescript
// ❌ VULNERABLE
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ SAFE - Parameterized query
const user = await db.user.findUnique({ where: { email } });
```

### Database Optimization

#### Index Strategy
```sql
-- Most restrictive column FIRST (10-50x performance impact)
-- ✅ CORRECT
CREATE INDEX idx_orders_lab_status ON orders (labId, status);

-- ❌ WRONG (status has low cardinality)
CREATE INDEX idx_orders_status_lab ON orders (status, labId);
```

#### Query Optimization
```typescript
// Use EXPLAIN ANALYZE before optimizing
// RULE 0: Correctness first, then performance
// -$1000 penalty for premature optimization without measurements
```

### Real-Time Architecture Decision

**Serverless (Vercel/Netlify):**
- Use polling (LISTEN/NOTIFY doesn't work)
- 30-second intervals acceptable
- 165 concurrent users = 330 queries/min = 0.4 compute hours/month (FREE tier)

**Dedicated Server (Railway/Render):**
- Can use LISTEN/NOTIFY + WebSocket
- More complex but real-time

**For PipetGo:** Polling is fine (B2B workflow, not chat)

---

## 📁 Key Files Reference

### Current Architecture

**Database:**
- `prisma/schema.prisma` - Prisma schema (PostgreSQL)
- `src/lib/db.ts` - Prisma client (dual-mode: mock/live)
- `src/lib/db-mock.ts` - In-memory mock database

**Authentication:**
- `src/lib/auth.ts` - NextAuth configuration
- `src/app/api/auth/[...nextauth]/route.ts` - Auth API

**API Routes:**
- `src/app/api/services/route.ts` - Service catalog
- `src/app/api/orders/route.ts` - Order CRUD
- `src/app/api/orders/[id]/quote/route.ts` - Quote provision
- `src/app/api/orders/[id]/approve-quote/route.ts` - Quote approval

**Testing:**
- `tests/lib/db-mock.test.ts` - Mock DB tests (136 tests)
- `tests/e2e/quote-workflow.test.ts` - E2E tests (10 tests)
- `vitest.setup.ts` - Test configuration

**Documentation:**
- `CLAUDE.md` - Project guide for Claude Code
- `docs/MVP_BUILD_ROADMAP.md` - Complete roadmap (8 weeks, 420 hours)
- `docs/DEPLOYMENT_CHECKLIST.md` - Pre-deployment checklist
- `docs/PHASE5_E2E_TESTS_SUMMARY.md` - Phase 5 summary

---

## 🎓 Learning Resources in Codebase

Many files include **🎓 Learning sections** explaining:
- Why certain patterns were chosen
- Common pitfalls to avoid
- TypeScript best practices
- Next.js patterns

**Examples:**
- `src/components/ui/button.tsx` - ForwardRef pattern
- `src/lib/utils.ts` - Utility function patterns
- `docs/SCAFFOLD_GUIDE.md` - 5,000+ line implementation guide

---

## 🚀 Quick Start Commands

### Development
```bash
cd /home/ltpt420/repos/pipetgo
npm run dev              # Start dev server (http://localhost:3000)
npm run test:run:mock    # Run tests with mock DB (233 tests)
npm run test:run:live    # Run tests with live DB (227 tests)
npm run lint             # ESLint
npm run type-check       # TypeScript check
npm run build            # Production build
```

### Database
```bash
# Connect to Neon DB
psql $DATABASE_URL

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed database
npx prisma db seed
```

### Testing
```bash
# Mock DB (fast, no external dependencies)
USE_MOCK_DB=true npm run test:run

# Live DB (integration tests)
USE_MOCK_DB=false npm run test:run

# Watch mode
npm run test:watch
```

---

## 🎯 Recommended Next Steps (Your Choice)

### Option 1: Ship MVP to Production (Recommended)
**Time:** 1-2 days
**Value:** Real user feedback, validate business model

**Steps:**
1. Commit `VERCEL_DEPLOYMENT_GUIDE.md`
2. Create database indexes
3. Deploy to Vercel staging
4. Smoke test
5. Deploy to production
6. Monitor for 1-2 weeks

**After shipping:** Iterate based on feedback

---

### Option 2: Phase 6 - Real Authentication
**Time:** 2-3 weeks
**Value:** Production-grade security

**Generate implementation plan first** (with CLI Claude), then delegate to Web Claude for execution.

---

### Option 3: Phase 7 - Real File Upload
**Time:** 1-2 weeks
**Value:** Actual file handling

**Lower priority than auth** - current mock uploads work for MVP validation.

---

## 📞 Escalation to Root Claude

**Escalate when:**
- Critical security vulnerabilities discovered
- Need new agents/commands
- Cross-project patterns discovered
- Blocking issues affecting priorities

**How to escalate:**
```markdown
# /home/ltpt420/repos/claude-config/coordination/shared-alerts.md

### 2025-11-XX HH:MM: [Brief Description]

**Priority:** URGENT
**Project:** pipetgo
**Impact:** [what's affected]
**Action Required:** [specific action]
```

---

## 💡 Final Notes

**Tests are your safety net:**
- 233 mock DB tests run in 7.56s
- Run them frequently
- Never skip quality gates

**Security is non-negotiable:**
- Check for `req.body.user_id` vulnerability before every commit
- Never trust client data
- Always verify ownership

**Documentation as you go:**
- Future you will thank you
- Phase summaries help track progress
- Update CLAUDE.md when architecture changes

**When in doubt:**
- Check CLAUDE.md for project-specific patterns
- Read washboard lessons: `/home/ltpt420/repos/claude-config/coordination/CROSS_PROJECT_LESSONS_LEARNED.md`
- Ask for clarification rather than assume

---

**Ready to continue?** Choose your path (deploy MVP vs continue Stage 2), generate implementation plans with CLI Claude, then delegate execution to Web Claude using this handoff as context.

🚀 **Good luck!**
