# Dual-Mode Database Implementation for PipetGo

**Created:** 2025-11-07
**Purpose:** Enable toggle-able mock vs live database testing
**Inspiration:** `/home/ltpt420/repos/claude-config/coordination/ClaudeWebvsLocalClaude_workflow-design.md`

---

## 🎯 Goal

Enable two interchangeable database environments:

- **Mock Mode (pg-mem):** In-memory PostgreSQL emulation for fast testing, Web Claude development, and CI/CD
- **Live Mode (Neon):** Real PostgreSQL connection for integration testing, staging, and production

**Key Requirement:** Same code, same query interfaces, toggle via environment variable.

---

## 📋 Current State Analysis

### Existing Architecture

**Database Client:** `/src/lib/db.ts`
- Singleton Prisma Client pattern
- Global instance preservation for hot-reload
- Development logging enabled
- Graceful shutdown in production

**Test Setup:** `vitest.setup.ts` + `vitest.config.ts`
- jsdom environment for React component testing
- Global test utilities enabled
- Coverage configured (v8 provider)
- Mocks: Next.js router, next/image, NextAuth
- Current DATABASE_URL: `postgresql://test:test@localhost:5432/test`

**Prisma Schema:** `prisma/schema.prisma`
- 8 models: User, Lab, LabService, Order, Sample, Attachment, Account, Session
- 3 enums: UserRole, PricingMode, OrderStatus
- Complex relationships (labs, orders, services)

### Current Testing Pattern

```typescript
// tests/e2e/quote-workflow.test.ts
vi.mock('@/lib/db', () => ({
  prisma: {
    labService: { findUnique: vi.fn() },
    order: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() }
  }
}))
```

**Issue:** Manual mocking for each test is brittle and doesn't test real SQL logic.

---

## 🏗️ Proposed Architecture

### 1. Environment Variable Toggle

```bash
# .env or .env.local
USE_MOCK_DB=true              # Toggle: true = pg-mem, false = Neon
DATABASE_URL="postgresql://ltpt420:mannersmakethman@localhost:5432/pipetgo_dev"
```

### 2. Enhanced Database Client (`src/lib/db.ts`)

```typescript
/**
 * Dual-Mode Database Client
 * =========================
 * Toggles between pg-mem (mock) and Neon (live) based on USE_MOCK_DB env var.
 *
 * Mock Mode: Fast, in-memory, no external connections (Web Claude, CI/CD)
 * Live Mode: Real Postgres, full integration testing (Local Claude, Staging)
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient

if (process.env.USE_MOCK_DB === 'true') {
  // Import pg-mem dynamically (only when needed)
  const { newDb } = await import('pg-mem')
  const { createPrismaMock } = await import('@/lib/db-mock')

  console.log('🧪 Using pg-mem (mock database)')

  prisma = await createPrismaMock()

} else {
  console.log('🌐 Using Neon (live database)')

  prisma = globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
  }
}

export { prisma }

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
```

### 3. Mock Database Factory (`src/lib/db-mock.ts`)

**New file** that creates pg-mem instance with Prisma schema loaded.

```typescript
/**
 * Mock Database Factory (pg-mem)
 * ==============================
 * Creates in-memory PostgreSQL database with Prisma schema.
 */

import { newDb, IMemoryDb } from 'pg-mem'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

let mockDb: IMemoryDb | null = null
let mockPrisma: PrismaClient | null = null

export async function createPrismaMock(): Promise<PrismaClient> {
  if (mockPrisma) {
    return mockPrisma
  }

  // Create pg-mem instance
  mockDb = newDb({
    autoCreateForeignKeyIndices: true,
  })

  // Register Prisma data types that pg-mem doesn't support by default
  mockDb.public.registerFunction({
    name: 'current_database',
    returns: 'text',
    implementation: () => 'mock_db',
  })

  mockDb.public.registerFunction({
    name: 'version',
    returns: 'text',
    implementation: () => 'PostgreSQL 15.0 (pg-mem)',
  })

  // Load Prisma schema SQL
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.sql')

  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8')
    mockDb.public.none(schemaSql)
  } else {
    // Fallback: Generate schema from Prisma schema.prisma
    await generateMockSchema(mockDb)
  }

  // Create Prisma adapter
  const { PrismaClient: MockPrismaClient } = mockDb.adapters.createPrisma()
  mockPrisma = new MockPrismaClient() as PrismaClient

  console.log('✅ pg-mem database initialized with Prisma schema')

  return mockPrisma
}

async function generateMockSchema(db: IMemoryDb) {
  /**
   * Generate schema from Prisma schema.prisma
   * This is a simplified version - full implementation would:
   * 1. Run `prisma generate` to get SQL
   * 2. Or manually replicate the schema
   *
   * For now, we'll create the core tables manually
   */

  db.public.none(`
    -- Enums
    CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'LAB_ADMIN', 'ADMIN');
    CREATE TYPE "PricingMode" AS ENUM ('QUOTE_REQUIRED', 'FIXED', 'HYBRID');
    CREATE TYPE "OrderStatus" AS ENUM (
      'QUOTE_REQUESTED', 'QUOTE_PROVIDED', 'QUOTE_REJECTED',
      'PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    );

    -- Users table
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE NOT NULL,
      "emailVerified" TIMESTAMPTZ,
      image TEXT,
      role "UserRole" DEFAULT 'CLIENT',
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );

    -- Labs table
    CREATE TABLE "Lab" (
      id TEXT PRIMARY KEY,
      "ownerId" TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      description TEXT,
      location JSONB,
      certifications TEXT[],
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );

    -- LabService table
    CREATE TABLE "LabService" (
      id TEXT PRIMARY KEY,
      "labId" TEXT NOT NULL REFERENCES "Lab"(id),
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      "sampleTypes" TEXT[],
      "pricingMode" "PricingMode" DEFAULT 'QUOTE_REQUIRED',
      "pricePerUnit" DECIMAL(10,2),
      currency TEXT DEFAULT 'PHP',
      "turnaroundDays" INTEGER,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );

    -- Order table
    CREATE TABLE "Order" (
      id TEXT PRIMARY KEY,
      "clientId" TEXT NOT NULL REFERENCES users(id),
      "labId" TEXT NOT NULL REFERENCES "Lab"(id),
      "serviceId" TEXT NOT NULL REFERENCES "LabService"(id),
      status "OrderStatus" DEFAULT 'QUOTE_REQUESTED',
      "quotedPrice" DECIMAL(10,2),
      "quotedAt" TIMESTAMPTZ,
      "quoteNotes" TEXT,
      "quoteRejectedAt" TIMESTAMPTZ,
      "quoteRejectedReason" TEXT,
      quantity INTEGER DEFAULT 1,
      "sampleDescription" TEXT,
      "requestedTurnaround" INTEGER,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );

    -- Sample table
    CREATE TABLE "Sample" (
      id TEXT PRIMARY KEY,
      "orderId" TEXT NOT NULL REFERENCES "Order"(id),
      "sampleId" TEXT,
      description TEXT,
      "receivedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );

    -- Attachment table
    CREATE TABLE "Attachment" (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES users(id),
      "orderId" TEXT REFERENCES "Order"(id),
      filename TEXT NOT NULL,
      "fileUrl" TEXT NOT NULL,
      "fileType" TEXT,
      "uploadedAt" TIMESTAMPTZ DEFAULT NOW()
    );

    -- NextAuth tables
    CREATE TABLE "Account" (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      "providerAccountId" TEXT NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INTEGER,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT,
      UNIQUE(provider, "providerAccountId")
    );

    CREATE TABLE "Session" (
      id TEXT PRIMARY KEY,
      "sessionToken" TEXT UNIQUE NOT NULL,
      "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE "VerificationToken" (
      identifier TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires TIMESTAMPTZ NOT NULL,
      UNIQUE(identifier, token)
    );
  `)

  console.log('✅ Mock schema generated from Prisma schema')
}

export async function seedMockDatabase() {
  if (!mockPrisma) {
    throw new Error('Mock database not initialized')
  }

  // Seed test data
  await mockPrisma.user.createMany({
    data: [
      {
        id: 'user-client-1',
        email: 'client@test.com',
        name: 'Test Client',
        role: 'CLIENT',
      },
      {
        id: 'user-lab-admin-1',
        email: 'labadmin@test.com',
        name: 'Test Lab Admin',
        role: 'LAB_ADMIN',
      },
    ],
  })

  await mockPrisma.lab.create({
    data: {
      id: 'lab-1',
      ownerId: 'user-lab-admin-1',
      name: 'Test Lab',
      description: 'ISO 17025 certified testing lab',
      certifications: ['ISO 17025', 'FDA Registered'],
    },
  })

  await mockPrisma.labService.createMany({
    data: [
      {
        id: 'service-quote-1',
        labId: 'lab-1',
        name: 'Microbial Load Testing',
        category: 'Microbiology',
        pricingMode: 'QUOTE_REQUIRED',
        turnaroundDays: 7,
      },
      {
        id: 'service-fixed-1',
        labId: 'lab-1',
        name: 'pH Testing',
        category: 'Chemistry',
        pricingMode: 'FIXED',
        pricePerUnit: 500,
        turnaroundDays: 3,
      },
    ],
  })

  console.log('✅ Mock database seeded with test data')
}
```

### 4. Updated Vitest Setup (`vitest.setup.ts`)

```typescript
import { expect, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with React Testing Library matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn()
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  }
}))

// Mock Next.js image
vi.mock('next/image', () => ({
  default: vi.fn().mockImplementation((props: any) => props)
}))

// Mock environment variables for testing
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Enable mock database for tests by default
if (!process.env.USE_MOCK_DB) {
  process.env.USE_MOCK_DB = 'true'
}

if (process.env.USE_MOCK_DB === 'true') {
  console.log('🧪 Tests will use pg-mem (mock database)')

  // Initialize and seed mock database before all tests
  beforeAll(async () => {
    const { seedMockDatabase } = await import('@/lib/db-mock')
    await seedMockDatabase()
  })
} else {
  console.log('🌐 Tests will use live database')
  // Keep mock DATABASE_URL for safety
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/pipetgo_test'
}
```

### 5. Test Script Updates (`package.json`)

```json
{
  "scripts": {
    "test": "vitest",
    "test:mock": "USE_MOCK_DB=true vitest",
    "test:live": "USE_MOCK_DB=false vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run",
    "test:run:mock": "USE_MOCK_DB=true vitest run",
    "test:run:live": "USE_MOCK_DB=false vitest run"
  }
}
```

---

## 🔧 Implementation Steps

### Phase 1: Install Dependencies (5 minutes)

```bash
cd /home/ltpt420/repos/pipetgo
npm install --save-dev pg-mem
```

### Phase 2: Create Mock Database Factory (30 minutes)

1. Create `src/lib/db-mock.ts`
2. Implement `createPrismaMock()` function
3. Implement `generateMockSchema()` with full Prisma schema
4. Implement `seedMockDatabase()` with test fixtures

### Phase 3: Update Database Client (15 minutes)

1. Modify `src/lib/db.ts` to check `USE_MOCK_DB`
2. Dynamically import pg-mem when in mock mode
3. Use original PrismaClient when in live mode
4. Add console logging for clarity

### Phase 4: Update Test Setup (10 minutes)

1. Modify `vitest.setup.ts` to enable mock DB by default
2. Add `beforeAll` hook to seed mock database
3. Update environment variable handling

### Phase 5: Update Package Scripts (5 minutes)

1. Add `test:mock` and `test:live` scripts
2. Add `test:run:mock` and `test:run:live` for CI

### Phase 6: Update Existing Tests (30 minutes)

**Remove manual mocks, rely on dual-mode client:**

```typescript
// BEFORE (manual mocking)
vi.mock('@/lib/db', () => ({
  prisma: {
    labService: { findUnique: vi.fn().mockResolvedValue(mockService) }
  }
}))

// AFTER (use real mock DB)
import { prisma } from '@/lib/db'

// Mock DB already has seeded data, just query it
const service = await prisma.labService.findUnique({
  where: { id: 'service-quote-1' }
})
```

### Phase 7: Testing & Validation (20 minutes)

```bash
# Test mock mode
npm run test:run:mock

# Test live mode (requires local Postgres)
npm run test:run:live

# Run coverage
npm run test:coverage
```

---

## 📊 Benefits

### For Development

✅ **Fast iteration:** Mock DB loads instantly, no connection delays
✅ **No external dependencies:** Tests run without PostgreSQL installed
✅ **Parallel tests:** Each test gets isolated in-memory DB
✅ **Realistic SQL:** pg-mem emulates real PostgreSQL behavior

### For Testing

✅ **True integration tests:** Tests actual Prisma queries, not mocked functions
✅ **Schema validation:** Catch schema issues early
✅ **State isolation:** Each test starts with clean seeded data
✅ **Deterministic:** No race conditions or external state

### For Claude Web Development

✅ **Sandboxed:** No external connections needed
✅ **Fast feedback:** Tests run in milliseconds
✅ **Free compute:** Offload iterations to Web Claude's free tier
✅ **Parity:** Same code runs in both environments

---

## 🚨 Considerations

### Mock DB Limitations

⚠️ **Not 100% PostgreSQL:** pg-mem doesn't support all Postgres features
⚠️ **No real connections:** Can't test connection pooling, timeouts
⚠️ **Performance:** Mock DB performance != real DB performance
⚠️ **Triggers/Functions:** Complex Postgres features may not work

### When to Use Live Mode

- ✅ Integration testing with real DB
- ✅ Performance benchmarking
- ✅ Postgres-specific feature testing (triggers, LISTEN/NOTIFY)
- ✅ Final pre-deployment validation

### When to Use Mock Mode

- ✅ Unit tests for API routes
- ✅ Component tests (no DB needed)
- ✅ CI/CD pipelines (fast, no setup)
- ✅ Web Claude development (no credentials)

---

## 📝 Environment Variable Reference

```bash
# .env.local (local development)
USE_MOCK_DB=false
DATABASE_URL="postgresql://ltpt420:mannersmakethman@localhost:5432/pipetgo_dev"

# .env.test (CI/CD)
USE_MOCK_DB=true
DATABASE_URL="postgresql://mock:mock@localhost:5432/mock"  # Ignored when USE_MOCK_DB=true

# .env (Web Claude)
USE_MOCK_DB=true
# No DATABASE_URL needed
```

---

## 🧪 Example Test Migration

### Before (Manual Mocking)

```typescript
// tests/api/orders/quote.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    order: {
      findFirst: vi.fn().mockResolvedValue({
        id: 'order-1',
        status: 'QUOTE_REQUESTED',
        lab: { ownerId: 'user-lab-admin-1' }
      }),
      update: vi.fn().mockResolvedValue({
        id: 'order-1',
        status: 'QUOTE_PROVIDED',
        quotedPrice: 1500
      })
    }
  }
}))

describe('POST /api/orders/[id]/quote', () => {
  it('allows lab admin to provide quote', async () => {
    // Test with mocked data
  })
})
```

### After (Dual-Mode DB)

```typescript
// tests/api/orders/quote.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/db'

describe('POST /api/orders/[id]/quote', () => {
  beforeEach(async () => {
    // Mock DB is automatically seeded, just create test-specific data
    await prisma.order.create({
      data: {
        id: 'order-test-1',
        clientId: 'user-client-1',
        labId: 'lab-1',
        serviceId: 'service-quote-1',
        status: 'QUOTE_REQUESTED'
      }
    })
  })

  it('allows lab admin to provide quote', async () => {
    // Test with REAL Prisma queries against mock DB
    const order = await prisma.order.findFirst({
      where: { id: 'order-test-1' }
    })

    expect(order?.status).toBe('QUOTE_REQUESTED')

    // Actual API test would go here
  })
})
```

---

## 🎯 Success Criteria

- [ ] `npm install pg-mem` succeeds
- [ ] `src/lib/db-mock.ts` created with schema loader
- [ ] `src/lib/db.ts` updated with toggle logic
- [ ] `vitest.setup.ts` enables mock DB by default
- [ ] `package.json` has mock/live test scripts
- [ ] All existing tests pass in mock mode
- [ ] Tests can run in live mode with local Postgres
- [ ] Console logs clearly indicate which mode is active
- [ ] Documentation updated

---

## 📚 References

- **Inspiration:** `/home/ltpt420/repos/claude-config/coordination/ClaudeWebvsLocalClaude_workflow-design.md`
- **pg-mem Documentation:** https://github.com/oguimbal/pg-mem
- **Prisma Documentation:** https://www.prisma.io/docs
- **Vitest Documentation:** https://vitest.dev

---

**Estimated Total Time:** 2 hours
**Complexity:** Medium
**Risk:** Low (non-breaking, additive changes)
