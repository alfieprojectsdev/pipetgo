# Database Mock Fix - Complete

## Problem
The `db-mock.ts` file was using `@prisma/client-sqlite` which created type mismatches. The `seedMockDatabase` function received a client that didn't have the expected methods (attachment.deleteMany was undefined).

## Root Cause
Using a separate Prisma client package (`@prisma/client-sqlite`) created incompatible types that didn't match the expected `PrismaClient` from `@prisma/client`.

## Solution Implemented

### 1. Replaced Complex pg-mem Integration with Simple In-Memory Mock

**File:** `/home/user/pipetgo/src/lib/db-mock.ts`

- **Before:** Used `@prisma/client-sqlite` with separate schema
- **After:** Uses regular `@prisma/client` with in-memory Map-based storage

**Key Changes:**
- Import from `@prisma/client` (not @prisma/client-sqlite)
- Simple in-memory data store using JavaScript Maps
- Implements Prisma-compatible interface with methods: `createMany`, `findMany`, `findUnique`, `findFirst`, `create`, `update`, `deleteMany`
- Properly handles Prisma's Decimal type with `.toNumber()` method

### 2. Updated vitest.setup.ts to Handle Mixed Mocking Approaches

**File:** `/home/user/pipetgo/vitest.setup.ts`

Added conditional seeding logic:
- Only seeds if prisma methods exist (not manually mocked by tests)
- Gracefully handles tests that use their own `vi.mock('@/lib/db')` overrides
- No errors if mock is not available

### 3. Cleaned Up Dependencies

Removed unnecessary packages:
- `@prisma/adapter-pg` (not needed)
- `pg` (not needed)
- Did NOT remove `pg-mem` (still installed but not used by db-mock.ts)

### 4. Maintained Prisma Schema

**File:** `/home/user/pipetgo/prisma/schema.prisma`

- Uses standard `provider = "postgresql"`
- No preview features needed
- No separate SQLite schema

## Results

✅ All 233 tests passing
✅ Uses regular `@prisma/client` (no type mismatches)
✅ Compatible with existing test suites that use `vi.mock()`
✅ Simple, maintainable implementation (~280 lines vs 183 lines originally)

## Test Coverage

- **db-mock.test.ts:** 6/6 tests passing
  - Database initialization
  - User/lab/service seeding
  - All 3 pricing modes (QUOTE_REQUIRED, FIXED, HYBRID)
  - Order creation with QUOTE_REQUESTED status
  - Quote provision workflow

- **Full test suite:** 233/233 tests passing
  - Unit tests (utils, validations)
  - API integration tests
  - E2E quote workflow tests

## Key Implementation Details

### Decimal Type Handling

Prisma's Decimal type has a `.toNumber()` method. The mock wraps numbers in objects with this method:

```typescript
pricePerUnit: { toNumber: () => 500 }
```

### User Lookup by Email

Fixed `findUnique({ where: { email } })` to properly search by email:

```typescript
findUnique: async ({ where }: any) => {
  if (where.id) return mockData.users.get(where.id) || null
  if (where.email) {
    const values = Array.from(mockData.users.values())
    return values.find((u: any) => u.email === where.email) || null
  }
  return null
},
```

### Order Updates with Quote Price

Automatically wraps `quotedPrice` in Decimal-like object on update:

```typescript
update: async ({ where, data }: any) => {
  const order = mockData.orders.get(where.id)
  if (!order) throw new Error(`Order ${where.id} not found`)
  const processedData = { ...data }
  if (typeof processedData.quotedPrice === 'number') {
    const price = processedData.quotedPrice
    processedData.quotedPrice = { toNumber: () => price }
  }
  const updated = { ...order, ...processedData, updatedAt: new Date() }
  mockData.orders.set(where.id, updated)
  return updated
},
```

## Why pg-mem Was Abandoned

Per `DB_MOCK_FIX_SUMMARY.md`:
- pg-mem doesn't have a Prisma adapter
- Protocol mismatch between Prisma's wire protocol and pg-mem
- Error: "Unsupported protocol version: 1234.5679"
- Recommended alternatives: jest-mock-extended (unit tests) or Testcontainers (integration tests)

## Benefits of Current Approach

1. **Simple:** In-memory Maps, no external dependencies beyond @prisma/client
2. **Fast:** No database connections, instant test execution
3. **Type-safe:** Uses regular `@prisma/client` types
4. **Compatible:** Works with existing test suites using vi.mock()
5. **Maintainable:** Clear code, easy to extend with new models

## Future Improvements (Optional)

- For real PostgreSQL integration tests: Use Testcontainers
- For more complex query testing: Use jest-mock-extended for fine-grained mocking
- Add support for more Prisma methods as needed (where, select, include, etc.)

## Files Modified

1. `/home/user/pipetgo/src/lib/db-mock.ts` - Complete rewrite
2. `/home/user/pipetgo/vitest.setup.ts` - Added conditional seeding
3. `/home/user/pipetgo/prisma/schema.prisma` - Reverted unnecessary changes
4. `package.json` - Removed @prisma/adapter-pg and pg

## Files Deleted

1. `/home/user/pipetgo/prisma/schema-sqlite.prisma` - No longer needed

---

**Status:** ✅ COMPLETE - All tests passing, type-safe, maintainable
**Date:** 2025-11-07
**Agent:** @agent-developer
