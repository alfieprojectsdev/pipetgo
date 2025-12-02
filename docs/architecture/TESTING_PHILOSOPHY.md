# Testing Philosophy and Strategy

**Last Updated:** 2025-12-01
**Test Framework:** Vitest 3.2.4
**Test Coverage:** 233 passing tests

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Dual-Mode Database Testing](#dual-mode-database-testing)
3. [Test Organization](#test-organization)
4. [TDD Workflow](#tdd-workflow)
5. [Testing Patterns](#testing-patterns)
6. [Acceptance Criteria Standards](#acceptance-criteria-standards)
7. [Performance Testing](#performance-testing)

---

## Testing Philosophy

### Core Principles

**Principle 1: Test Behavior, Not Implementation**

❌ **WRONG (Testing Implementation):**
```typescript
it('should call prisma.order.create with correct arguments', () => {
  // Test implementation detail (which Prisma method is called)
  expect(prisma.order.create).toHaveBeenCalledWith({
    data: { /* ... */ }
  })
})
```

✅ **CORRECT (Testing Behavior):**
```typescript
it('should create order with QUOTE_REQUESTED status for quote-required service', async () => {
  // Test observable behavior (order created with correct status)
  const response = await POST('/api/orders', {
    serviceId: 'service-quote-required'
  })

  expect(response.status).toBe(201)
  expect(response.data.status).toBe('QUOTE_REQUESTED')
  expect(response.data.quotedPrice).toBeNull()
})
```

**Why Behavior Testing?**
- Implementation can change (switch from Prisma to raw SQL) without breaking tests
- Tests document what system DOES, not HOW it does it
- Refactoring safe (change internals, tests still pass)

---

**Principle 2: Write Tests BEFORE Code (TDD)**

**TDD Cycle (Red-Green-Refactor):**
```
1. Write failing test (RED)
   ↓
2. Write minimal code to pass test (GREEN)
   ↓
3. Refactor code while keeping test green (REFACTOR)
   ↓
4. Repeat
```

**Example: Implementing Quote Provision**

**Step 1: Write Failing Test**
```typescript
// tests/api/orders/quote.test.ts
it('should provide quote with valid price', async () => {
  const response = await POST('/api/orders/order-1/quote', {
    quotedPrice: 12000
  })

  expect(response.status).toBe(200)
  expect(response.data.quotedPrice).toBe(12000)
  expect(response.data.status).toBe('QUOTE_PROVIDED')
})

// Run test: ❌ FAIL (route doesn't exist yet)
```

**Step 2: Write Minimal Code**
```typescript
// src/app/api/orders/[id]/quote/route.ts
export async function POST(req: Request) {
  const body = await req.json()

  const order = await prisma.order.update({
    where: { id: params.id },
    data: {
      quotedPrice: body.quotedPrice,
      status: 'QUOTE_PROVIDED'
    }
  })

  return NextResponse.json(order)
}

// Run test: ✅ PASS
```

**Step 3: Refactor (Add Validation, Authorization)**
```typescript
// Add authentication check
const session = await getServerSession(authOptions)
if (session.user.role !== 'LAB_ADMIN') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Add validation
const validatedData = quoteSchema.parse(body)

// Add ownership check
const order = await prisma.order.findFirst({
  where: { id: params.id, lab: { ownerId: session.user.id } }
})

// Run test: ✅ PASS (refactoring didn't break behavior)
```

---

**Principle 3: Test Public Interfaces (API Routes)**

**What to Test:**
- ✅ API routes (`POST /api/orders`)
- ✅ Validation schemas (Zod)
- ✅ Utility functions (pure functions)

**What NOT to Test:**
- ❌ Prisma queries (database ORM internals)
- ❌ NextAuth internals (third-party library)
- ❌ React components (separate integration tests with Playwright)

---

## Dual-Mode Database Testing

### The Problem

**Challenge:**
- CI/CD needs fast tests (no database setup overhead)
- Local development needs realistic tests (actual PostgreSQL schema)

**Traditional Solutions:**

| Approach | Speed | Realism | CI-Friendly | Chosen |
|----------|-------|---------|-------------|--------|
| Always mock DB | ⚡ Fast | ❌ Low | ✅ Yes | ❌ No |
| Always use live DB | 🐢 Slow | ✅ High | ❌ No (setup) | ❌ No |
| **Dual-mode (env flag)** | **✅ Both** | **✅ Both** | **✅ Yes** | **✅ YES** |

---

### Implementation: Dual-Mode Strategy

**Environment Variable:**
```bash
# Use live PostgreSQL (local development)
TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/pipetgo_test"

# Use pg-mem (CI/CD, default)
# (leave TEST_DATABASE_URL unset)
```

**Test Setup:**
```typescript
// tests/setup.ts
import { PrismaClient } from '@prisma/client'
import { newDb } from 'pg-mem'

let prisma: PrismaClient

if (process.env.TEST_DATABASE_URL) {
  // Mode 1: Live PostgreSQL
  console.log('Using live PostgreSQL for tests')
  prisma = new PrismaClient({
    datasources: {
      db: { url: process.env.TEST_DATABASE_URL }
    }
  })
} else {
  // Mode 2: pg-mem (in-memory mock)
  console.log('Using pg-mem (in-memory database) for tests')
  const db = newDb()
  const mockPrisma = await db.adapters.createPrisma()
  prisma = mockPrisma
}

export { prisma }
```

---

### Mode 1: pg-mem (In-Memory Mock)

**Pros:**
- ⚡ Fast (no network latency, no disk I/O)
- ✅ CI-friendly (no database server needed)
- ✅ Isolated (each test run gets fresh database)

**Cons:**
- ❌ Feature gaps (some Prisma features not supported)
- ❌ Behavior differences (pg-mem approximates PostgreSQL)

**Example pg-mem Limitation:**
```typescript
// ❌ NOT SUPPORTED by pg-mem
await prisma.$queryRaw`SELECT * FROM orders WHERE created_at > NOW() - INTERVAL '7 days'`

// ✅ SUPPORTED by pg-mem
await prisma.order.findMany({
  where: {
    createdAt: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
  }
})
```

---

### Mode 2: Live PostgreSQL

**Pros:**
- ✅ High realism (actual PostgreSQL behavior)
- ✅ Full feature support (raw SQL, triggers, constraints)
- ✅ Catches schema bugs (migrations work correctly)

**Cons:**
- 🐢 Slower (network + disk I/O)
- ❌ Requires setup (PostgreSQL server + test database)

**Setup Instructions:**
```bash
# 1. Create test database
createdb pipetgo_test

# 2. Run migrations
DATABASE_URL="postgresql://user:pass@localhost:5432/pipetgo_test" npx prisma migrate deploy

# 3. Run tests
TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/pipetgo_test" npm run test
```

---

### When to Use Each Mode

**Use pg-mem (Default) When:**
- Running tests in CI/CD (GitHub Actions, GitLab CI)
- Quick feedback loop (unit tests, local TDD)
- Testing business logic (not database-specific features)

**Use Live PostgreSQL When:**
- Testing migrations (schema changes)
- Testing raw SQL queries (`$queryRaw`)
- Final validation before deployment (Stage 2 → Stage 3)

---

## Test Organization

### Directory Structure

```
tests/
├── e2e/                         # End-to-end workflow tests
│   └── quote-workflow.test.ts   # Full quotation workflow (841 lines)
├── api/                         # API route tests
│   ├── orders/
│   │   └── route.test.ts        # Order creation tests
│   ├── services/
│   │   ├── create.test.ts       # Service creation
│   │   ├── read.test.ts         # Service retrieval
│   │   ├── update.test.ts       # Service modification
│   │   └── bulk.test.ts         # Bulk operations
│   └── auth/
│       └── nextauth-ratelimit.test.ts  # Auth rate limiting
├── lib/                         # Library/utility tests
│   ├── utils.test.ts            # Utility function tests
│   ├── auth.test.ts             # Authentication tests
│   ├── rate-limit.test.ts       # Rate limiting tests
│   └── db-mock.test.ts          # Database mock tests
└── setup.ts                     # Test configuration
```

---

### Test File Naming Conventions

**Pattern:** `{feature}.test.ts` OR `{route-method}.test.ts`

**Examples:**
- `tests/e2e/quote-workflow.test.ts` - Feature-based (entire workflow)
- `tests/api/orders/route.test.ts` - Route-based (specific endpoint)
- `tests/lib/utils.test.ts` - Library-based (utility functions)

---

### Test Organization Pattern: E2E vs Unit

**E2E Tests (Workflow Coverage):**
```typescript
// tests/e2e/quote-workflow.test.ts
describe('E2E: Quote Workflow', () => {
  describe('Test Case 1: QUOTE_REQUIRED Service Workflow', () => {
    it('should complete full workflow: request → provide → approve', async () => {
      // Step 1: Client creates order
      const createResponse = await POST('/api/orders', { /* ... */ })
      expect(createResponse.status).toBe(201)
      expect(createResponse.data.status).toBe('QUOTE_REQUESTED')

      // Step 2: Lab admin provides quote
      const quoteResponse = await POST('/api/orders/order-1/quote', { /* ... */ })
      expect(quoteResponse.status).toBe(200)
      expect(quoteResponse.data.status).toBe('QUOTE_PROVIDED')

      // Step 3: Client approves quote
      const approveResponse = await POST('/api/orders/order-1/approve-quote', { /* ... */ })
      expect(approveResponse.status).toBe(200)
      expect(approveResponse.data.status).toBe('PENDING')
    })
  })
})
```

**Unit Tests (Focused Coverage):**
```typescript
// tests/api/orders/quote.test.ts
describe('POST /api/orders/[id]/quote', () => {
  it('should reject quote from non-LAB_ADMIN user', async () => {
    mockSession({ user: { role: 'CLIENT' } })

    const response = await POST('/api/orders/order-1/quote', {
      quotedPrice: 5000
    })

    expect(response.status).toBe(403)
    expect(response.data.error).toBe('Only lab administrators can provide quotes')
  })

  it('should reject negative quotedPrice', async () => {
    mockSession({ user: { role: 'LAB_ADMIN' } })

    const response = await POST('/api/orders/order-1/quote', {
      quotedPrice: -100
    })

    expect(response.status).toBe(400)
    expect(response.data.details[0].message).toContain('positive')
  })
})
```

**Key Difference:**
- **E2E:** Tests complete user journeys (multiple API calls, state transitions)
- **Unit:** Tests single API route edge cases (validation, authorization)

---

## TDD Workflow

### Standard TDD Cycle (RED-GREEN-REFACTOR)

**Step 1: Write Failing Test (RED)**
```typescript
it('should prevent lab admin from quoting OTHER labs\' orders', async () => {
  mockSession({ user: { id: 'admin-1', role: 'LAB_ADMIN' } })
  mockOrder({ id: 'order-1', labId: 'lab-2' })  // Order belongs to lab-2
  mockLab({ id: 'lab-1', ownerId: 'admin-1' })  // Admin owns lab-1

  const response = await POST('/api/orders/order-1/quote', {
    quotedPrice: 5000
  })

  expect(response.status).toBe(404)  // ❌ Test fails (no ownership check yet)
})
```

**Run test:**
```bash
npm run test -- quote.test.ts
# ❌ Expected: 404, Received: 200
```

---

**Step 2: Write Minimal Code (GREEN)**
```typescript
// src/app/api/orders/[id]/quote/route.ts
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  // Add ownership check
  const order = await prisma.order.findFirst({
    where: {
      id: params.id,
      lab: {
        ownerId: session.user.id  // ✅ Ownership check added
      }
    }
  })

  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // ... rest of quote provision logic
}
```

**Run test:**
```bash
npm run test -- quote.test.ts
# ✅ Test passes
```

---

**Step 3: Refactor (REFACTOR)**
```typescript
// Extract ownership check to reusable function
async function verifyOrderOwnership(orderId: string, userId: string) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      lab: { ownerId: userId }
    }
  })

  if (!order) {
    throw new Error('ORDER_NOT_FOUND_OR_ACCESS_DENIED')
  }

  return order
}

// Use in route
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  try {
    const order = await verifyOrderOwnership(params.id, session.user.id)
    // ... rest of quote provision logic
  } catch (error) {
    if (error.message === 'ORDER_NOT_FOUND_OR_ACCESS_DENIED') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }
}
```

**Run test:**
```bash
npm run test -- quote.test.ts
# ✅ Test still passes (refactoring didn't break behavior)
```

---

## Testing Patterns

### Pattern 1: Mock NextAuth Session

**Setup:**
```typescript
import { vi } from 'vitest'
import { getServerSession } from 'next-auth'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}))
```

**Usage:**
```typescript
it('should allow LAB_ADMIN to provide quote', async () => {
  vi.mocked(getServerSession).mockResolvedValue({
    user: {
      id: 'admin-1',
      role: 'LAB_ADMIN',
      email: 'admin@lab.com'
    }
  } as any)

  const response = await POST('/api/orders/order-1/quote', {
    quotedPrice: 5000
  })

  expect(response.status).toBe(200)
})
```

---

### Pattern 2: Mock Prisma Queries

**Setup:**
```typescript
vi.mock('@/lib/db', () => ({
  prisma: {
    order: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn()
    },
    $transaction: vi.fn()
  }
}))
```

**Usage:**
```typescript
it('should return 404 when order not found', async () => {
  vi.mocked(prisma.order.findFirst).mockResolvedValue(null)  // Order doesn't exist

  const response = await POST('/api/orders/nonexistent/quote', {
    quotedPrice: 5000
  })

  expect(response.status).toBe(404)
})
```

---

### Pattern 3: Mock Transactions

**Implementation:**
```typescript
// tests/e2e/quote-workflow.test.ts (lines 145-149)
vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
  vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 } as any)
  vi.mocked(prisma.order.findUnique).mockResolvedValue(orderWithQuote as any)
  return callback(prisma)
})
```

**Why Mock Transactions?**
- pg-mem transactions behave differently from PostgreSQL
- Easier to test race conditions (simulate concurrent updates)
- Faster (no actual database transaction overhead)

---

### Pattern 4: Test Data Builders

**Pattern: Factory Functions for Test Data**
```typescript
// tests/helpers/factories.ts
export function createTestOrder(overrides = {}) {
  return {
    id: 'order-test-1',
    clientId: 'client-1',
    labId: 'lab-1',
    serviceId: 'service-1',
    status: 'QUOTE_REQUESTED',
    quotedPrice: null,
    quotedAt: null,
    sampleDescription: 'Test sample',
    clientDetails: {
      contactEmail: 'test@example.com',
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        postal: '1234',
        country: 'Philippines'
      }
    },
    createdAt: new Date('2025-12-01'),
    updatedAt: new Date('2025-12-01'),
    ...overrides  // Allow overriding specific fields
  }
}

// Usage in tests
const order = createTestOrder({
  status: 'QUOTE_PROVIDED',
  quotedPrice: 12000
})
```

**Benefits:**
- Reduces boilerplate (don't repeat full object in every test)
- Centralized test data (change schema once, all tests update)
- Clear intent (overrides highlight what's important in test)

---

## Acceptance Criteria Standards

### Definition of "Passing Test"

**Criteria:**
1. ✅ Test passes in BOTH pg-mem AND live PostgreSQL modes
2. ✅ Test is deterministic (same input → same output, always)
3. ✅ Test is isolated (no shared state between tests)
4. ✅ Test is fast (<100ms per test for unit tests)
5. ✅ Test has clear description (readable by non-developer)

---

### Example: Good vs Bad Test Descriptions

**❌ BAD (Implementation-focused):**
```typescript
it('calls updateMany with correct where clause', () => {
  // Tests HOW (implementation detail)
})
```

**✅ GOOD (Behavior-focused):**
```typescript
it('should prevent quote provision when order status is not QUOTE_REQUESTED', async () => {
  // Tests WHAT (observable behavior)
})
```

---

### Code Coverage Expectations

**Current Coverage (233 Tests):**
- ✅ Utility functions: 95%+ coverage
- ✅ Validation schemas: 100% coverage (all Zod schemas tested)
- ⚠️ API routes: ~60% coverage (missing error path tests)

**Target Coverage (Stage 3):**
- API routes: 80%+ (focus on error paths)
- Database queries: 70%+ (edge cases like race conditions)
- Overall: 85%+ (excluding third-party code)

**Coverage Blind Spots (Acceptable):**
- NextAuth internals (third-party, assume tested)
- React components (separate Playwright tests)
- Prisma ORM (database ORM, assume tested)

---

## Performance Testing

### Test Execution Performance

**Current Performance (233 Tests):**
```
Test Files  12 passed (12)
Tests       233 passed (233)
Duration    2.5s (pg-mem) / 8.2s (live PostgreSQL)
```

**Performance Targets:**
- Unit tests: <50ms per test
- E2E tests: <500ms per test (acceptable for workflow tests)
- Full test suite: <10s (pg-mem), <30s (live PostgreSQL)

---

### Slow Test Investigation

**Command:**
```bash
npm run test -- --reporter=verbose
```

**Output:**
```
✓ tests/e2e/quote-workflow.test.ts (841ms)
  ✓ QUOTE_REQUIRED workflow (312ms)  ⚠️ Slow test
  ✓ FIXED workflow (89ms)
  ✓ HYBRID workflow (156ms)
```

**Optimization:**
```typescript
// Before: Multiple database queries
const service = await prisma.labService.findUnique({ where: { id } })
const lab = await prisma.lab.findUnique({ where: { id: service.labId } })
const order = await prisma.order.create({ /* ... */ })

// After: Single query with includes
const service = await prisma.labService.findUnique({
  where: { id },
  include: { lab: true }
})
const order = await prisma.order.create({ /* ... */ })
```

---

### Performance Test (Future)

**Load Test Example:**
```typescript
describe('Performance: Quote Provision', () => {
  it('should handle 100 concurrent quote provisions in <5 seconds', async () => {
    const startTime = Date.now()

    const promises = Array.from({ length: 100 }, (_, i) =>
      POST(`/api/orders/order-${i}/quote`, { quotedPrice: 5000 })
    )

    await Promise.all(promises)

    const duration = Date.now() - startTime
    expect(duration).toBeLessThan(5000)
  }, { timeout: 10000 })
})
```

---

## Test Maintenance

### Test Cleanup Strategy

**Pattern: Use beforeEach/afterEach for Cleanup**
```typescript
describe('POST /api/orders/[id]/quote', () => {
  beforeEach(() => {
    vi.clearAllMocks()  // Clear mock call history
  })

  afterEach(async () => {
    // Cleanup test data (if using live PostgreSQL)
    if (process.env.TEST_DATABASE_URL) {
      await prisma.order.deleteMany({
        where: { id: { startsWith: 'test-' } }
      })
    }
  })
})
```

---

### Test Debugging Tips

**Tip 1: Use `test.only()` for Focused Testing**
```typescript
test.only('should provide quote with valid price', async () => {
  // Only this test runs (ignores others)
})
```

**Tip 2: Use `console.log()` Liberally (Remove Before Commit)**
```typescript
it('should approve quote', async () => {
  const response = await POST('/api/orders/order-1/approve-quote', { approved: true })

  console.log('Response:', JSON.stringify(response.data, null, 2))  // Debug output

  expect(response.status).toBe(200)
})
```

**Tip 3: Use Vitest UI for Interactive Debugging**
```bash
npm run test:ui
```

Opens browser-based test runner with:
- Live test re-run on file save
- Test execution timeline
- Console output per test

---

## Future Testing Improvements

**Stage 3 Roadmap:**

1. **Integration Tests with Playwright**
   - Test full user workflows (UI → API → Database)
   - Visual regression testing (screenshots)

2. **Contract Testing**
   - API contract validation (OpenAPI schema)
   - Prevent breaking changes to API

3. **Mutation Testing**
   - Verify test quality (do tests catch bugs?)
   - Tool: Stryker Mutator

4. **Performance Regression Tests**
   - Track API response times over time
   - Alert when performance degrades >20%

---

**Document Owner:** Architecture Mentor
**Review Cadence:** After major feature additions
**Related Documents:**
- `API_DESIGN_PATTERNS.md` - What to test in API routes
- `DATABASE_ARCHITECTURE.md` - Database testing considerations
- `tests/e2e/quote-workflow.test.ts` - Reference E2E test (841 lines)
