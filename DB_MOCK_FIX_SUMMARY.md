# Database Mock Fix Summary

## What I Did

### 1. Updated db-mock.ts to use correct pg-mem 3.0.5 API ✅

**Changes made:**
- ✅ Added `DataType` import from pg-mem
- ✅ Updated `registerFunction` calls to use `DataType.text` (not string 'text')
- ✅ Replaced non-existent `createPrisma()` with `bindServer()`
- ✅ Constructed connection string from `connectionSettings`
- ✅ Added `$connect()` call
- ✅ Updated `resetMockDatabase()` to async with proper disconnection

**File**: `/home/user/pipetgo/src/lib/db-mock.ts`

### 2. Installed Required Dependency

```bash
npm install --save-dev pg-server --legacy-peer-deps
```

### 3. Created Comprehensive Test Suite

**File**: `/home/user/pipetgo/tests/lib/db-mock.test.ts`

Tests cover:
- Database initialization
- Seeded users, labs, and services
- All pricing modes (QUOTE_REQUIRED, FIXED, HYBRID)
- Order creation with QUOTE_REQUESTED status
- Quote provision workflow

## The Problem: Prisma + pg-mem Incompatibility ❌

**Root Issue**: Prisma's wire protocol is **NOT compatible** with pg-mem's server emulation.

### Error Encountered
```
Error: Unsupported protocol version: 1234.5679
```

This is a fundamental compatibility issue - Prisma's Rust-based query engine uses PostgreSQL protocol features that pg-mem cannot fully emulate.

### Why pg-mem Doesn't Work with Prisma

1. **No Prisma Adapter**: pg-mem 3.0.5 has adapters for pg, TypeORM, Knex, Kysely, MikroORM - but NOT Prisma
2. **Protocol Mismatch**: Prisma's wire protocol implementation differs from what pg-server expects
3. **Architecture Mismatch**: Prisma's connection pooling and query engine are tightly coupled to real PostgreSQL

## Recommended Solutions

### Option 1: jest-mock-extended (Unit Tests) ⭐ RECOMMENDED

**Best for**: Fast unit tests of business logic

```bash
npm install --save-dev jest-mock-extended
```

```typescript
// tests/mocks/prisma.ts
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset } from 'jest-mock-extended'

export const prismaMock = mockDeep<PrismaClient>()

beforeEach(() => {
  mockReset(prismaMock)
})

// tests/api/orders.test.ts
import { prismaMock } from '../mocks/prisma'

it('creates order with QUOTE_REQUESTED status', async () => {
  prismaMock.labService.findUnique.mockResolvedValue({
    id: 'service-1',
    pricingMode: 'QUOTE_REQUIRED',
    pricePerUnit: null,
  })

  prismaMock.order.create.mockResolvedValue({
    id: 'order-1',
    status: 'QUOTE_REQUESTED',
  })

  // Test your API logic
})
```

**Pros**: Fast, no database needed, full control
**Cons**: Doesn't test actual SQL queries

### Option 2: Testcontainers (Integration Tests) ⭐ RECOMMENDED

**Best for**: Integration tests with real PostgreSQL

```bash
npm install --save-dev @testcontainers/postgresql
```

```typescript
import { PostgreSqlContainer } from '@testcontainers/postgresql'

let container: PostgreSqlContainer
let prisma: PrismaClient

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:15-alpine').start()

  prisma = new PrismaClient({
    datasources: {
      db: { url: container.getConnectionString() },
    },
  })

  await execSync('npx prisma migrate deploy')
})

afterAll(async () => {
  await prisma.$disconnect()
  await container.stop()
})
```

**Pros**: Real PostgreSQL, full compatibility, isolated
**Cons**: Requires Docker, ~2-5s startup overhead

### Option 3: SQLite In-Memory (Simple Alternative)

**Best for**: Simple tests without PostgreSQL-specific features

```typescript
const prisma = new PrismaClient({
  datasources: {
    db: { url: 'file:./test.db' }, // or 'file::memory:'
  },
})
```

**Pros**: Fast, no external dependencies
**Cons**: Minor dialect differences, no JSONB/enum support

## Recommended Testing Strategy

```
Unit Tests (Fast)
├── Use jest-mock-extended
├── Mock Prisma for API route logic
└── Focus on business logic

Integration Tests (Comprehensive)
├── Use Testcontainers
├── Test quotation workflows
└── Verify database constraints
```

## Next Steps

### Immediate Actions

1. **Choose testing approach** (recommend jest-mock-extended + Testcontainers)
2. **Install dependencies**:
   ```bash
   npm install --save-dev jest-mock-extended @testcontainers/postgresql
   ```
3. **Update vitest.setup.ts** to use appropriate strategy
4. **Remove or repurpose db-mock.ts** (pg-mem won't work)
5. **Update existing tests** to use new approach

### Files to Modify

- `/home/user/pipetgo/vitest.setup.ts` - Switch from pg-mem to mock/testcontainers
- `/home/user/pipetgo/src/lib/db-mock.ts` - Remove or document as non-functional
- `/home/user/pipetgo/tests/**/*.test.ts` - Update to use new mocking strategy

## Investigation Documentation

Full details in: `/home/user/pipetgo/docs/DB_MOCK_INVESTIGATION.md`

## Conclusion

**The db-mock.ts file has been updated to use the correct pg-mem 3.0.5 API**, but **pg-mem fundamentally cannot work with Prisma** due to protocol incompatibility.

**Action Required**: Switch to jest-mock-extended (unit tests) + Testcontainers (integration tests) for a robust testing strategy.

The architect's original design referenced a non-existent `createPrisma()` method from outdated pg-mem documentation. The investigation revealed that pg-mem is not designed to work with Prisma.

**Files Updated**:
- ✅ `/home/user/pipetgo/src/lib/db-mock.ts` - Uses correct pg-mem API (but Prisma incompatible)
- ✅ `/home/user/pipetgo/tests/lib/db-mock.test.ts` - Comprehensive test suite (fails due to protocol issue)
- ✅ `/home/user/pipetgo/docs/DB_MOCK_INVESTIGATION.md` - Full investigation details
- ✅ `/home/user/pipetgo/DB_MOCK_FIX_SUMMARY.md` - This summary

**Recommendation**: Escalate to @architect to redesign testing strategy without pg-mem.
