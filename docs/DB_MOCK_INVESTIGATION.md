# Database Mocking Investigation - 2025-11-07

## Problem
Attempting to use pg-mem 3.0.5 as an in-memory PostgreSQL database for Prisma testing.

## Investigation Summary

### Initial Approach: `createPrisma()` Method
- **Issue**: `createPrisma()` method does NOT exist in pg-mem 3.0.5 LibAdapters
- **Root Cause**: Architect referenced outdated pg-mem API in design spec

### Second Approach: `bindServer()` Method
- **Implementation**: Uses pg-mem's `bindServer()` to create TCP server
- **Requires**: `pg-server` package (installed with --legacy-peer-deps)
- **Result**: Protocol version mismatch between Prisma and pg-server
- **Error**: `Unsupported protocol version: 1234.5679`
- **Root Cause**: Prisma's wire protocol implementation not fully compatible with pg-mem server emulation

## Available pg-mem 3.0.5 Adapters

```typescript
interface LibAdapters {
  createPg(): { Pool, Client }              // ✅ Works with pg package
  createPgPromise()                         // ✅ Works with pg-promise
  createTypeormDataSource()                 // ✅ Works with TypeORM
  createKnex()                              // ✅ Works with Knex
  createKysely()                            // ✅ Works with Kysely
  createMikroOrm()                          // ✅ Works with MikroORM
  createPostgresJsTag()                     // ✅ Works with postgres.js
  bindServer()                              // ⚠️ Partial - Protocol issues with Prisma
}
```

**Key Finding**: Prisma is NOT directly supported by pg-mem adapters.

## Why Prisma + pg-mem is Problematic

1. **Protocol Incompatibility**: Prisma uses PostgreSQL wire protocol features that pg-mem's server emulation doesn't fully support
2. **Connection Management**: Prisma expects full connection pool behavior that's hard to mock
3. **Query Engine**: Prisma's Rust-based query engine makes direct interception difficult

## Recommended Alternatives

### Option 1: SQLite In-Memory (Recommended for Unit Tests)
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
  },
})

// vitest.setup.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db', // SQLite file-based or :memory:
    },
  },
})
```

**Pros:**
- Native Prisma support
- Fast in-memory mode
- No external dependencies

**Cons:**
- Minor dialect differences from PostgreSQL
- Some PostgreSQL-specific features unavailable (JSONB operators, enums)

### Option 2: Docker PostgreSQL (Recommended for Integration Tests)
```bash
# docker-compose.test.yml
services:
  postgres-test:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: pipetgo_test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - "5433:5432"
```

```typescript
// vitest.setup.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/pipetgo_test',
    },
  },
})

// Run migrations before tests
await prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE')
await prisma.$executeRawUnsafe('CREATE SCHEMA public')
await execSync('npx prisma migrate deploy')
```

**Pros:**
- Full PostgreSQL compatibility
- Tests real database behavior
- Catches dialect-specific issues

**Cons:**
- Requires Docker
- Slower than in-memory
- CI/CD complexity

### Option 3: Mock Prisma Client (Recommended for Unit Tests)
```typescript
// tests/mocks/prisma.ts
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

export const prismaMock = mockDeep<PrismaClient>()

beforeEach(() => {
  mockReset(prismaMock)
})

// tests/api/orders.test.ts
import { prismaMock } from '../mocks/prisma'

describe('POST /api/orders', () => {
  it('creates order with QUOTE_REQUESTED status', async () => {
    prismaMock.labService.findUnique.mockResolvedValue({
      id: 'service-1',
      pricingMode: 'QUOTE_REQUIRED',
      pricePerUnit: null,
      // ...
    })

    prismaMock.order.create.mockResolvedValue({
      id: 'order-1',
      status: 'QUOTE_REQUESTED',
      quotedPrice: null,
      // ...
    })

    // Test API route logic
  })
})
```

**Pros:**
- Fast unit tests
- No database required
- Full control over test data

**Cons:**
- Doesn't test real SQL queries
- Requires mocking all Prisma calls
- Can become verbose

### Option 4: Testcontainers (Best of Both Worlds)
```typescript
import { PostgreSqlContainer } from '@testcontainers/postgresql'

let container: PostgreSqlContainer
let prisma: PrismaClient

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:15-alpine').start()

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: container.getConnectionString(),
      },
    },
  })

  await execSync('npx prisma migrate deploy')
})

afterAll(async () => {
  await prisma.$disconnect()
  await container.stop()
})
```

**Pros:**
- Real PostgreSQL in tests
- Auto-cleanup
- CI/CD friendly
- Isolated test environment

**Cons:**
- Requires Docker
- Startup overhead (~2-5s per test suite)

## Recommended Testing Strategy for PipetGo

Based on CLAUDE.md requirements:

```
Unit Tests (Fast)
├── Mock Prisma for API route logic
├── Use jest-mock-extended
└── Focus on business logic, not database queries

Integration Tests (Comprehensive)
├── Use Testcontainers PostgreSQL
├── Test full quotation workflow
├── Verify database constraints
└── Test multi-role authorization with real data

CI/CD
├── Use Docker Compose for integration tests
└── Parallel test execution with isolated databases
```

## Action Items

1. **Remove pg-mem approach** - Not compatible with Prisma
2. **Install jest-mock-extended** - For unit test mocking
3. **Add Testcontainers** - For integration tests
4. **Update vitest.setup.ts** - Use appropriate strategy per test type
5. **Update CLAUDE.md** - Document correct testing approach

## Files to Update

- `/home/user/pipetgo/src/lib/db-mock.ts` - Remove or repurpose
- `/home/user/pipetgo/vitest.setup.ts` - Use mock or testcontainers
- `/home/user/pipetgo/tests/lib/db-mock.test.ts` - Remove or convert to integration test
- `/home/user/pipetgo/package.json` - Add jest-mock-extended and/or @testcontainers/postgresql

## Conclusion

**pg-mem cannot be used with Prisma due to protocol incompatibility.** The architect's design referenced a non-existent API method (`createPrisma()`).

**Recommended immediate action**: Switch to **jest-mock-extended for unit tests** and **Testcontainers for integration tests**.
