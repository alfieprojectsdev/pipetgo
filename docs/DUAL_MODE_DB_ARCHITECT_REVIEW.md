# Architect Review: Dual-Mode Database Implementation

**Task for @agent-architect**

## Context

PipetGo currently uses Vitest with manual Prisma mocks for testing. We want to implement a toggle-able dual-mode database system:

- **Mock Mode:** pg-mem (in-memory PostgreSQL) for fast tests, Web Claude development, CI/CD
- **Live Mode:** Neon PostgreSQL for integration testing, staging, production

## Design Document

Please review: `/home/ltpt420/repos/pipetgo/docs/DUAL_MODE_DATABASE_IMPLEMENTATION.md`

## Questions for Architect

1. **Schema Parity:** The proposed `generateMockSchema()` manually replicates the Prisma schema in SQL. Should we instead:
   - Option A: Generate SQL from Prisma schema programmatically
   - Option B: Export Prisma schema to SQL file and load it
   - Option C: Keep manual SQL (easier to maintain)

2. **Prisma Adapter:** The design uses pg-mem's `createPrisma()` adapter. Is this the correct approach, or should we use a different pg-mem adapter (e.g., `createPg()`, `createPgPromise()`)?

3. **Test Isolation:** Should each test get its own pg-mem instance, or share one instance with transaction rollback between tests?

4. **Seed Data:** Should seed data be:
   - Loaded once in `beforeAll` (faster, shared state)
   - Loaded per-test in `beforeEach` (slower, isolated)
   - Mix: Base data in `beforeAll`, test-specific in `beforeEach`

5. **Performance:** Are there performance concerns with dynamically importing pg-mem on every test run?

6. **Migration Strategy:** How should we handle existing tests that use manual mocks? Mass migration or gradual?

7. **Type Safety:** Will TypeScript correctly infer types when switching between mock and live Prisma clients?

## Architecture Decision Record

Please create an ADR documenting:

- ✅ Chosen approach (mock vs live toggle)
- ✅ Why pg-mem over alternatives (e.g., Docker Postgres, SQLite)
- ✅ Trade-offs and limitations
- ✅ Migration path for existing tests
- ✅ When to use mock vs live mode
- ✅ Future extensibility (e.g., adding Redis mocks)

## Deliverables

1. **ADR Document:** `docs/ADR_DUAL_MODE_DATABASE.md`
2. **Schema Strategy Recommendation:** How to maintain schema parity
3. **Test Migration Plan:** Step-by-step guide for updating existing tests
4. **Risk Assessment:** What could go wrong and how to mitigate

## Constraints

- ❌ No implementation in this review (architect doesn't write code)
- ✅ Focus on architecture, patterns, and recommendations
- ✅ Consider maintainability and developer experience
- ✅ Align with existing PipetGo patterns (Vitest, Prisma, Next.js)

---

**Time Estimate:** 30-45 minutes
**Expected Output:** ADR + recommendations for implementation
