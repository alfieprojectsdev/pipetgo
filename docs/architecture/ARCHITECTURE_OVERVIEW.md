# Architecture Overview

**Last Updated:** 2025-12-01
**Status:** Production-Ready (Stage 2: User Testing + Back Office Development)

---

## Table of Contents

1. [System Context](#system-context)
2. [Critical Business Context](#critical-business-context)
3. [Container Architecture](#container-architecture)
4. [Key Architectural Decisions](#key-architectural-decisions)
5. [Technology Choices and Justifications](#technology-choices-and-justifications)
6. [Deployment Model](#deployment-model)
7. [Constraints and Tradeoffs](#constraints-and-tradeoffs)

---

## System Context

### What is PipetGo?

PipetGo is a **B2B marketplace connecting businesses with ISO 17025 certified laboratory testing services** across the Philippines. It is explicitly **NOT an e-commerce platform** - it follows a quotation-first workflow similar to Alibaba's RFQ (Request-for-Quote) system.

```
┌─────────────────────────────────────────────────────────────────┐
│                         PipetGo System                          │
│                                                                 │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐       │
│  │  CLIENT  │────────▶│ RFQ      │────────▶│   LAB    │       │
│  │(Business)│         │Marketplace│         │ (ISO     │       │
│  │          │◀────────│ Platform  │◀────────│ 17025)   │       │
│  └──────────┘  Quote  └──────────┘  Quote  └──────────┘       │
│                                                                 │
│  Flow: Submit RFQ → Lab Quotes → Client Approves → Testing     │
└─────────────────────────────────────────────────────────────────┘
```

### External Actors

1. **CLIENT (Business Users)**
   - Submit RFQs (Request for Quote) for lab testing services
   - Review and approve/reject custom quotes from labs
   - Track order progress and download certified test results
   - Authentication: Email-only (no password initially, passwordless by default)

2. **LAB_ADMIN (Laboratory Administrators)**
   - Review incoming RFQs from clients
   - Provide custom pricing based on sample complexity
   - Manage order lifecycle (acknowledge → in-progress → complete)
   - Upload certified test results (PDF via UploadThing)
   - Authentication: **Requires password** (bcrypt hashed, 12 rounds)

3. **ADMIN (Platform Administrators)**
   - Platform oversight and monitoring
   - Lab onboarding and verification
   - Dispute resolution
   - Authentication: Email-only (internal staff)

4. **External Services**
   - **Neon PostgreSQL**: Serverless database (production)
   - **UploadThing**: File storage for attachments (PDFs, certificates)
   - **GoatCounter**: Privacy-friendly analytics (no cookies, GDPR-compliant)

---

## Critical Business Context

### Why NOT E-commerce?

**Decision:** PipetGo is a B2B RFQ marketplace, NOT an instant-checkout platform.

**Reasoning:**

1. **Laboratory testing requires custom pricing**
   - Sample complexity varies wildly (simple pH test vs complex toxicology screen)
   - Volume discounts for bulk orders (100 samples != 100x price)
   - Turnaround time negotiation (rush orders cost more)
   - Accreditation requirements differ per client industry

2. **Fixed pricing is an anti-pattern for this domain**
   - A "Fatty Acid Analysis" service cannot have a single fixed price
   - Price depends on: number of fatty acids to profile, sample matrix, required detection limits
   - Lab needs to review RFQ details before committing to price

3. **Business model alignment**
   - Alibaba RFQ model proven for B2B complex services
   - Labs compete on quality, turnaround time, and price
   - Custom quotes reduce platform leakage (labs taking clients offline)

**Mental Model:**
> "Think Alibaba RFQ for lab testing, NOT Amazon instant checkout."

---

## Container Architecture

### High-Level Component View

```
┌────────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ Client       │  │ Lab Admin    │  │ Admin        │            │
│  │ Dashboard    │  │ Dashboard    │  │ Dashboard    │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│         │                 │                 │                      │
└─────────┼─────────────────┼─────────────────┼──────────────────────┘
          │                 │                 │
          │        HTTPS / JSON (Session Cookies)
          │                 │                 │
┌─────────▼─────────────────▼─────────────────▼──────────────────────┐
│              Next.js 14 (App Router) - Vercel                       │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Frontend (React Server Components)                        │   │
│  │  - Role-based dashboards                                   │   │
│  │  - Quote review UI                                         │   │
│  │  - Service catalog                                         │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  API Routes (Backend)                                      │   │
│  │  - POST /api/orders (create RFQ)                          │   │
│  │  - POST /api/orders/[id]/quote (lab provides quote)       │   │
│  │  - POST /api/orders/[id]/approve-quote (client decision)  │   │
│  │  - GET /api/services (catalog)                            │   │
│  └──────────────────────┬─────────────────────────────────────┘   │
│                         │                                           │
│  ┌──────────────────────▼──────────────────────────────────────┐  │
│  │  NextAuth 4.24.7 (Session Middleware)                      │  │
│  │  - JWT-based sessions (stateless)                          │  │
│  │  - Role verification (CLIENT, LAB_ADMIN, ADMIN)            │  │
│  │  - Bcrypt password verification for LAB_ADMIN              │  │
│  └──────────────────────┬──────────────────────────────────────┘  │
│                         │                                           │
└─────────────────────────┼───────────────────────────────────────────┘
                          │
                    Prisma ORM
                          │
┌─────────────────────────▼───────────────────────────────────────────┐
│                    Neon PostgreSQL (Serverless)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Users      │  │   Orders     │  │  LabServices │             │
│  │   Labs       │  │  Attachments │  │              │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘

External Services:
┌──────────────────┐  ┌──────────────────┐
│  UploadThing     │  │  GoatCounter     │
│  (File Storage)  │  │  (Analytics)     │
└──────────────────┘  └──────────────────┘
```

---

## Key Architectural Decisions

### ADR-001: Next.js App Router (Not Pages Router)

**Decision:** Use Next.js 14 App Router with React Server Components.

**Context:**
- App Router offers better performance (streaming SSR, server components)
- Colocation of components with routes improves maintainability
- Pages Router is legacy (Next.js 13+ recommends App Router)

**Consequences:**
- ✅ Server components reduce client-side JavaScript (faster page loads)
- ✅ Built-in loading.tsx and error.tsx conventions
- ❌ Learning curve for developers familiar with Pages Router
- ❌ Some third-party libraries not yet compatible with Server Components

**Why This Matters:**
Server components allow us to fetch data (orders, quotes) without client-side API calls, reducing latency for users. Dashboard pages render faster because data is streamed from database → server component → HTML (no JavaScript waterfall).

---

### ADR-002: Session-Based Auth (Not Token-Based)

**Decision:** Use NextAuth with JWT sessions stored in HTTP-only cookies.

**Context:**
- Need role-based access control (CLIENT, LAB_ADMIN, ADMIN)
- LAB_ADMIN requires password authentication (sensitive quote provision)
- CLIENT and ADMIN use passwordless email login (easier onboarding)

**Reasoning:**

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| JWT in localStorage | Fast, stateless | XSS vulnerable, no revocation | ❌ REJECTED |
| Session DB (Prisma) | Revocable, secure | Database query per request | ❌ REJECTED (latency) |
| **JWT in HTTP-only cookie** | **Secure, stateless, fast** | **Manual revocation needed** | ✅ **CHOSEN** |

**Implementation:**
- NextAuth stores JWT in HTTP-only cookie (not accessible via JavaScript)
- JWT payload includes: `{ id, email, role }`
- Token verified on server-side via `getServerSession(authOptions)`
- 30-day session expiry (configurable)

**Why This Matters:**
HTTP-only cookies prevent XSS attacks (malicious JavaScript cannot steal token). Stateless JWTs mean no database query per request (critical for serverless Vercel deployment where connection pooling is limited).

**Tradeoff:**
- Cannot revoke sessions immediately (JWT valid until expiry)
- Mitigation: Short session expiry (30 days) + future token blacklist for urgent revocations

See: `src/lib/auth.ts` (lines 98-101)

---

### ADR-003: Three Pricing Modes (Not Binary)

**Decision:** Support three pricing modes: QUOTE_REQUIRED, FIXED, HYBRID.

**Context:**
- Stage 1 prototype used binary: fixed price OR quote-required
- User feedback: "Some services have catalog pricing but we want volume discounts"
- Labs want flexibility: simple tests (fixed) vs complex tests (custom quote)

**Reasoning:**

1. **QUOTE_REQUIRED** (Default, True B2B)
   - No `pricePerUnit` in database
   - Order created with `status = QUOTE_REQUESTED`, `quotedPrice = null`
   - Lab must provide custom quote before client can approve
   - **Use case:** Complex testing (toxicology, fatty acid profiling)

2. **FIXED** (Backward Compatibility)
   - Service has fixed `pricePerUnit`
   - Order created with `status = PENDING`, `quotedPrice = pricePerUnit`
   - No quote workflow, instant booking
   - **Use case:** Commodity testing (pH, moisture content)

3. **HYBRID** (Flexible, Best of Both)
   - Service has reference `pricePerUnit` (shown as "Starting at ₱X")
   - Client chooses: accept reference price OR request custom quote
   - If `requestCustomQuote = true` → QUOTE_REQUESTED workflow
   - If `requestCustomQuote = false` → PENDING instant booking
   - **Use case:** Scalable services (unit price for 1-10 samples, discount for 100+)

**Why This Matters:**
HYBRID mode reduces friction for small orders (instant booking) while allowing negotiation for bulk orders. This prevents platform leakage (clients asking for quotes offline to get bulk discounts).

**Mental Model:**
> "QUOTE_REQUIRED is pure B2B negotiation. FIXED is pure e-commerce. HYBRID is 'instant checkout with escape hatch for custom pricing'."

See: `prisma/schema.prisma` (lines 16-20), `src/app/api/orders/route.ts` (lines 47-83)

---

### ADR-004: Atomic State Transitions (Prevent Race Conditions)

**Decision:** Use Prisma `updateMany` with status check for state transitions.

**Context:**
- Multiple lab admins might quote the same order simultaneously
- Client might approve while lab admin is editing quote
- Race condition: two quotes provided, client sees wrong price

**Reasoning:**

**❌ WRONG (Race Condition Vulnerable):**
```typescript
// Step 1: Read order (status = QUOTE_REQUESTED)
const order = await prisma.order.findUnique({ where: { id } })

// Step 2: Check status
if (order.status !== 'QUOTE_REQUESTED') {
  throw new Error('Order already quoted')
}

// ⚠️ RACE CONDITION HERE: Another admin could update between step 2 and 3

// Step 3: Update order
await prisma.order.update({
  where: { id },
  data: { status: 'QUOTE_PROVIDED', quotedPrice }
})
```

**✅ CORRECT (Atomic Check-and-Update):**
```typescript
// Atomic: update succeeds ONLY if status is QUOTE_REQUESTED
const result = await prisma.order.updateMany({
  where: {
    id,
    status: 'QUOTE_REQUESTED'  // ✅ Atomic condition
  },
  data: {
    status: 'QUOTE_PROVIDED',
    quotedPrice,
    quotedAt: new Date()
  }
})

// Check if update actually happened (count will be 0 if status was already changed)
if (result.count === 0) {
  // Status was NOT QUOTE_REQUESTED (either doesn't exist or already quoted)
  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) throw new Error('ORDER_NOT_FOUND')
  throw new Error(`QUOTE_ALREADY_PROVIDED:${order.status}`)
}
```

**Why This Matters:**
Database-level atomic operations prevent race conditions. Two lab admins clicking "Submit Quote" simultaneously will result in exactly one success (first writer wins) and one 409 Conflict error (second writer gets clear error message).

**Tradeoff:**
- `updateMany` returns `{ count }` instead of updated record (requires second query to fetch result)
- Mitigation: Wrap in transaction to keep consistent

See: `src/app/api/orders/[id]/quote/route.ts` (lines 65-94)

---

### ADR-005: Dual-Mode Database Testing (Mock + Live)

**Decision:** Support testing with pg-mem (in-memory mock) OR live PostgreSQL.

**Context:**
- CI/CD needs fast tests without database setup
- Local development needs realistic testing against PostgreSQL schema
- Developers want choice: speed (mock) vs realism (live)

**Reasoning:**

| Approach | Speed | Realism | CI/CD Friendly | Decision |
|----------|-------|---------|----------------|----------|
| Always mock | ⚡ Fast | ❌ Low | ✅ Yes | ❌ REJECTED |
| Always live DB | 🐢 Slow | ✅ High | ❌ No (setup overhead) | ❌ REJECTED |
| **Dual-mode (env flag)** | **✅ Both** | **✅ Both** | **✅ Yes** | ✅ **CHOSEN** |

**Implementation:**
```typescript
// tests/setup.ts
if (process.env.TEST_DATABASE_URL) {
  // Use live PostgreSQL (local development)
  prisma = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL })
} else {
  // Use pg-mem (CI/CD, default)
  const db = newDb()
  const mockPrisma = await db.adapters.createPrisma()
  prisma = mockPrisma
}
```

**Why This Matters:**
Developers get fast feedback loop in CI/CD (mock) but can validate against real PostgreSQL locally (live). This catches schema mismatches (pg-mem might not support all Prisma features) before production.

**Tradeoff:**
- Maintaining two test modes requires discipline (tests must work in both)
- Mitigation: CI runs both modes (mock for speed, live for final validation)

See: `tests/lib/db-mock.test.ts`, `CLAUDE.md` (Testing Strategy section)

---

### ADR-006: Co-located API Route Tests (Not Separate test/ Directory)

**Decision:** Place API route tests next to the route file.

**Context:**
- Next.js 14 App Router uses file-based routing
- API routes scattered across `src/app/api/` subdirectories
- Developers want tests close to implementation

**Reasoning:**

**Option A: Separate test/ directory (Traditional)**
```
src/app/api/orders/route.ts
tests/api/orders/route.test.ts
```
- ✅ Clean separation of concerns
- ❌ Far from implementation (cognitive load to find test)
- ❌ Importing route handlers requires relative path gymnastics

**Option B: Co-located tests (CHOSEN)**
```
src/app/api/orders/route.ts
src/app/api/orders/route.test.ts (imported in tests/)
```
OR
```
tests/api/orders/route.test.ts (imports from @/app/api/orders/route)
```

**Actual Implementation (Mixed):**
- E2E workflow tests: `tests/e2e/quote-workflow.test.ts`
- API route unit tests: `tests/api/[route]/[method].test.ts`

**Why This Matters:**
Large test files (800+ lines for E2E quote workflow) are easier to navigate when they cover a complete business workflow (not fragmented by file location).

See: `tests/e2e/quote-workflow.test.ts` (841 lines, tests all 3 pricing modes + authorization)

---

## Technology Choices and Justifications

### Frontend: Next.js 14 + React 18 + TypeScript

**Why Next.js 14?**
- Server components reduce client-side JavaScript (faster page loads for B2B users)
- Built-in API routes (no separate backend server needed)
- Vercel deployment optimized for Next.js (automatic edge caching)

**Why TypeScript?**
- Database schema types generated by Prisma (type-safe queries)
- Prevents runtime errors (quotedPrice?: number | null enforced at compile time)
- Better IDE autocomplete (VSCode infers Zod schema types)

**Tradeoff:**
- React Server Components still maturing (some libraries incompatible)
- TypeScript strict mode requires discipline (noUncheckedIndexedAccess = true)

---

### Backend: Next.js API Routes + Prisma ORM

**Why NOT separate backend server (Express, Fastify)?**
- Monorepo complexity (separate frontend/backend repos)
- Deployment complexity (two services to coordinate)
- Next.js API routes sufficient for CRUD operations

**Why Prisma?**
- Type-safe query builder (prevents SQL injection, generates TypeScript types)
- Migration system (versioned schema changes)
- Neon serverless compatible (connection pooling built-in)

**Tradeoff:**
- Prisma ORM adds abstraction layer (raw SQL sometimes needed for complex queries)
- Mitigation: Use `prisma.$queryRaw` for performance-critical queries

---

### Database: PostgreSQL (Neon Serverless)

**Why PostgreSQL (not MongoDB, MySQL)?**
- Relational data (Orders belong to Labs, Labs belong to Users)
- ACID transactions required (quote provision + notification must succeed together)
- JSON columns for flexible data (clientDetails, shipping address)

**Why Neon Serverless?**
- Auto-scaling (no manual provisioning)
- Branch databases for preview deployments (Vercel integration)
- Connection pooling built-in (critical for serverless functions)

**Tradeoff:**
- Vendor lock-in to Neon (migration to self-hosted PostgreSQL requires connection string change)
- Cold start latency (first query after idle period ~100ms slower)

---

### Authentication: NextAuth 4.24.7

**Why NextAuth (not Auth0, Clerk)?**
- Open-source (no vendor lock-in)
- Prisma adapter built-in (user data in our database)
- Custom credentials provider (bcrypt password for LAB_ADMIN)

**Why NOT Auth0?**
- Cost ($240/year for 1000 active users)
- Overkill for simple role-based auth
- User data stored externally (complicates queries)

**Tradeoff:**
- No built-in MFA (must implement manually)
- No social login out-of-box (Google OAuth requires custom provider)

---

### File Storage: UploadThing 7.7.4

**Why UploadThing (not AWS S3, Cloudinary)?**
- React components for file upload (drop-in UI)
- Next.js integration (API routes auto-generated)
- CDN included (no separate CloudFront setup)

**Why NOT AWS S3?**
- Configuration complexity (IAM policies, CORS, presigned URLs)
- No built-in UI components (must build uploader from scratch)

**Tradeoff:**
- Vendor lock-in (file URLs specific to UploadThing CDN)
- Cost ($0.10/GB storage, $0.10/GB bandwidth - acceptable for PDFs)

---

### Analytics: GoatCounter

**Why GoatCounter (not Google Analytics, Mixpanel)?**
- Privacy-friendly (no cookies, no personal data, GDPR-compliant)
- Lightweight (3.5KB script, <50ms load time)
- Self-hostable (can migrate to self-hosted later)

**Why NOT Google Analytics?**
- GDPR compliance headaches (cookie banners, consent management)
- Overkill for simple pageview tracking
- Privacy concerns (data sent to Google)

**Tradeoff:**
- Limited analytics features (no funnels, cohorts, segmentation)
- Mitigation: GoatCounter for pageviews, custom events tracked server-side

See: `docs/ADR_GOATCOUNTER_LEVEL1_ANALYTICS.md`

---

## Deployment Model

### Production Environment (Vercel)

```
┌─────────────────────────────────────────────────────────────────┐
│                      Vercel Edge Network                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Edge Functions (Middleware)                            │  │
│  │  - Rate limiting (NextAuth login attempts)              │  │
│  │  - Session validation                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Serverless Functions (API Routes)                      │  │
│  │  - Auto-scaling (0 to thousands of concurrent requests) │  │
│  │  - 10-second timeout (sufficient for database queries)  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                           ↓
                    (Prisma Connection Pool)
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│              Neon PostgreSQL (Serverless)                       │
│  - Auto-suspend after 5 minutes idle                            │
│  - Cold start: ~100ms                                           │
│  - 10 concurrent connections (free tier)                        │
└─────────────────────────────────────────────────────────────────┘
```

**Deployment Strategy:**
1. Push to `main` branch → Vercel auto-deploys
2. Pull request → Preview deployment (separate Neon branch database)
3. Merge PR → Preview deployment promoted to production

**Environment Variables (Production):**
- `DATABASE_URL`: Neon connection string (pooling enabled)
- `NEXTAUTH_SECRET`: Cryptographically random 32-byte key
- `UPLOADTHING_SECRET`: UploadThing API key
- `NEXT_PUBLIC_GOATCOUNTER_URL`: Analytics endpoint

---

## Constraints and Tradeoffs

### Constraint 1: Serverless Function Timeout (10s)

**Impact:**
- Complex queries must complete in <10 seconds
- Bulk operations (seeding 100 services) must use batching

**Mitigation:**
- Use database indexes for frequently queried fields
- Batch large operations (100 records per transaction)
- Show "Processing..." UI for operations >2 seconds

---

### Constraint 2: Neon Connection Limit (10 concurrent)

**Impact:**
- High traffic (50+ concurrent requests) may hit connection limit
- Each API route holds connection during query

**Mitigation:**
- Prisma connection pooling (reuse connections)
- Reduce query time (add indexes, optimize Prisma queries)
- Upgrade to Neon paid tier (1000 connections) if needed

See: `prisma/schema.prisma` (lines 154-156 for indexes)

---

### Constraint 3: No Real-Time Notifications (Yet)

**Impact:**
- Lab admin must refresh dashboard to see new RFQs
- Client must refresh to see quote updates

**Mitigation (Current):**
- Show "Last updated: X seconds ago" timestamp
- Poll API every 30 seconds on dashboard pages

**Future Solution:**
- Add WebSocket support (Vercel supports WebSockets)
- Use Pusher or Ably for real-time events

---

### Tradeoff: Complexity vs Flexibility

**Decision:** Support three pricing modes (not just fixed/quote binary).

**Complexity Added:**
- Conditional logic in order creation (lines 47-83 in route.ts)
- Additional test cases (3x test suite size)
- UI must explain difference between FIXED, QUOTE_REQUIRED, HYBRID

**Flexibility Gained:**
- Labs can use single platform for all service types
- Clients get instant booking for simple tests, negotiation for complex tests
- Reduces platform leakage (no need to go offline for bulk discounts)

**Verdict:**
✅ Worth it. User feedback confirms HYBRID mode is critical for real-world usage.

---

## Mental Models for Developers

### 1. "PipetGo is Alibaba RFQ, not Amazon"

When implementing features, ask: "Does this support negotiation, or instant checkout?"
- Instant checkout → Use FIXED pricing mode
- Negotiation → Use QUOTE_REQUIRED or HYBRID

### 2. "Always verify ownership AND role"

Every API route must check:
1. User is authenticated (`session.user` exists)
2. User has correct role (`session.user.role === 'LAB_ADMIN'`)
3. User owns the resource (`lab.ownerId === session.user.id`)

### 3. "State transitions are one-way (mostly)"

Order status flows forward:
```
QUOTE_REQUESTED → QUOTE_PROVIDED → PENDING → ACKNOWLEDGED → IN_PROGRESS → COMPLETED
                         ↓
                   QUOTE_REJECTED
```

Only exception: QUOTE_REJECTED can transition back to QUOTE_REQUESTED (re-negotiation).

---

## Next Steps (Stage 3)

1. **Back Office Features**
   - Lab analytics dashboard (quote conversion rate, revenue)
   - Dispute resolution workflow
   - Lab verification system (upload ISO 17025 certificates)

2. **Real-Time Notifications**
   - WebSocket integration for instant RFQ alerts
   - Email notifications (SendGrid or Resend)

3. **Payment Integration**
   - Escrow system (client pays platform, platform pays lab after completion)
   - PayMaya or GCash integration (Philippines)

4. **Advanced Pricing**
   - Tiered pricing (1-10 samples: ₱X, 11-50: ₱Y, 51+: ₱Z)
   - Rush order surcharges

---

**Document Owner:** Architecture Mentor
**Review Cadence:** Quarterly (update after major features)
**Related Documents:**
- `AUTHENTICATION_AND_AUTHORIZATION.md` - Security deep dive
- `PRICING_AND_QUOTATION_SYSTEM.md` - State machine details
- `DATABASE_ARCHITECTURE.md` - Schema and indexing
- `API_DESIGN_PATTERNS.md` - RESTful conventions
- `TESTING_PHILOSOPHY.md` - Dual-mode testing strategy
