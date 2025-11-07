<!-- copied from claude-config/coordination/PIPETGO_DUAL_MODE_DB_HANDOFF.md -->
# PipetGo: Dual-Mode Database Implementation Handoff

**Created:** 2025-11-07 14:50 UTC
**For Instance:** pipetgo-claude
**Estimated Duration:** 5-8 hours
**Status:** Ready for implementation

---

## 🎯 Mission

Implement toggle-able dual-mode database system for PipetGo testing:
- **Mock Mode:** pg-mem (in-memory PostgreSQL) for fast tests, Web Claude development, CI/CD
- **Live Mode:** Neon PostgreSQL for integration testing, staging, production

**Toggle:** Environment variable `USE_MOCK_DB=true/false`

---

## 📚 Context Documents (READ THESE FIRST)

**CRITICAL - Read before starting:**

1. **Design Specification (350 lines):**
   `/home/ltpt420/repos/pipetgo/docs/DUAL_MODE_DATABASE_IMPLEMENTATION.md`
   - Complete architecture with code examples
   - Environment variable setup
   - Test migration examples

2. **Architecture Decision Record (25KB):**
   `/home/ltpt420/repos/pipetgo/docs/ADR_DUAL_MODE_DATABASE.md`
   - Architect's review and approval
   - Answers to 7 key architecture questions
   - Risk assessment and mitigation
   - When to use mock vs live mode

3. **Reference Workflow:**
   `/home/ltpt420/repos/claude-config/coordination/ClaudeWebvsLocalClaude_workflow-design.md`
   - Original inspiration for dual-mode design

---

## ✅ Pre-Implementation Checklist

Before starting, verify:

- [ ] Read all 3 context documents above
- [ ] Understand the 4 implementation phases
- [ ] Current tests are passing (227/227)
- [ ] No uncommitted changes in pipetgo repo
- [ ] You're on the correct branch (main or feature branch)

---

## 🏗️ Implementation Phases

### Phase 1: Infrastructure (1-2 hours)

**Goal:** Create mock database factory and update db client with toggle logic

**Tasks:**

1. **Install pg-mem dependency:**
   ```bash
   cd /home/ltpt420/repos/pipetgo
   npm install --save-dev pg-mem
   ```

2. **Create `src/lib/db-mock.ts` (NEW FILE):**
   - Implement `createPrismaMock()` function
   - Implement `generateMockSchema()` with Prisma schema
   - Implement `seedMockDatabase()` with test fixtures
   - See design spec for complete implementation

3. **Update `src/lib/db.ts`:**
   - Add `USE_MOCK_DB` environment variable check
   - Dynamically import pg-mem when `USE_MOCK_DB=true`
   - Keep existing PrismaClient logic for live mode
   - Add console logging for clarity

4. **Update `vitest.setup.ts`:**
   - Set `USE_MOCK_DB=true` by default for tests
   - Add `beforeAll` hook to seed mock database
   - Keep existing mocks (Next.js router, etc.)

5. **Update `package.json` scripts:**
   ```json
   {
     "test:mock": "USE_MOCK_DB=true vitest",
     "test:live": "USE_MOCK_DB=false vitest",
     "test:run:mock": "USE_MOCK_DB=true vitest run",
     "test:run:live": "USE_MOCK_DB=false vitest run"
   }
   ```

**Acceptance Criteria:**
- [ ] `npm run test:mock` runs without errors
- [ ] Mock DB initializes with seeded data
- [ ] Console log shows "🧪 Using pg-mem (mock database)"
- [ ] No regression in existing test behavior

**Commit Message:**
```
feat(testing): implement dual-mode database infrastructure

Add toggle-able mock/live database system using pg-mem.

Changes:
- Create src/lib/db-mock.ts with pg-mem factory
- Update src/lib/db.ts with USE_MOCK_DB toggle
- Update vitest.setup.ts to enable mock mode
- Add test:mock/test:live scripts to package.json

Mock mode enables fast testing without Neon connection.
Live mode preserves integration testing capability.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

### Phase 2: Pilot Migration (1-2 hours)

**Goal:** Migrate 1-2 test files to validate dual-mode system

**Recommended Pilot Test:**
- `tests/api/orders/route.test.ts` (if it exists)
- OR create a new simple test file

**Tasks:**

1. **Choose pilot test file**
2. **Remove manual Prisma mocks:**
   ```typescript
   // REMOVE THIS:
   vi.mock('@/lib/db', () => ({
     prisma: { /* manual mocks */ }
   }))
   ```

3. **Use real Prisma queries:**
   ```typescript
   // ADD THIS:
   import { prisma } from '@/lib/db'

   // Now queries hit mock DB with seeded data
   const service = await prisma.labService.findUnique({
     where: { id: 'service-quote-1' }
   })
   ```

4. **Add test-specific data in beforeEach:**
   ```typescript
   beforeEach(async () => {
     // Create test-specific order
     await prisma.order.create({
       data: {
         id: 'test-order-1',
         clientId: 'user-client-1',
         labId: 'lab-1',
         serviceId: 'service-quote-1',
         status: 'QUOTE_REQUESTED'
       }
     })
   })
   ```

5. **Run both modes:**
   ```bash
   npm run test:run:mock  # Should pass
   npm run test:run:live  # Should pass with local DB
   ```

**Acceptance Criteria:**
- [ ] Pilot test passes in mock mode
- [ ] Pilot test passes in live mode (with local Postgres)
- [ ] Mock mode is faster than before (<5 seconds)
- [ ] Test uses real Prisma queries (not mocks)

**Commit Message:**
```
test(pilot): migrate pilot test to dual-mode database

Migrate [test file name] to use dual-mode database system.

Removed manual Prisma mocks in favor of real queries against
mock database. Tests now validate actual SQL behavior.

Mock mode: <X>ms, Live mode: <Y>ms

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

### Phase 3: E2E Migration (2-3 hours)

**Goal:** Migrate main E2E test suite (`tests/e2e/quote-workflow.test.ts`)

**Tasks:**

1. **Read existing test file:**
   - Identify all manual mocks
   - Map to real Prisma queries

2. **Remove manual mocks:**
   - Remove `vi.mock('@/lib/db')` block
   - Remove individual mock function setups

3. **Update to real queries:**
   - Use seeded data from `seedMockDatabase()`
   - Create test-specific data in `beforeEach`
   - Clean up transient data between tests

4. **Expected line reduction:**
   - Current: ~842 lines (with mocks)
   - Target: ~600 lines (with real queries)

5. **Validate all test cases pass:**
   ```bash
   npm run test:run:mock
   ```

**Acceptance Criteria:**
- [ ] All E2E tests pass in mock mode
- [ ] Test file is shorter (less boilerplate)
- [ ] Tests use real Prisma queries
- [ ] Mock mode completes in <5 seconds
- [ ] Live mode works with local Postgres

**Commit Message:**
```
test(e2e): migrate quote workflow to dual-mode database

Migrate E2E test suite to use dual-mode database system.

Changes:
- Remove 200+ lines of manual Prisma mocks
- Use real Prisma queries against mock database
- Validates actual SQL behavior and schema
- Tests pass in both mock and live modes

Performance:
- Mock mode: <5 seconds (target met)
- Live mode: <60 seconds (target met)

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

### Phase 4: Documentation & Completion (1 hour)

**Goal:** Update documentation and finalize dual-mode system

**Tasks:**

1. **Update `CLAUDE.md`:**
   - Add "Dual-Mode Database Testing" section
   - Document when to use mock vs live mode
   - Include usage examples
   - Performance benchmarks

2. **Update `.env.example`:**
   ```bash
   # Dual-Mode Database Testing
   # Toggle between mock (pg-mem) and live (Neon) database
   # Mock: Fast tests, no credentials needed (Web Claude, CI/CD)
   # Live: Integration tests, requires real Postgres (Local development)
   USE_MOCK_DB=true

   # Live Mode Database URL (ignored when USE_MOCK_DB=true)
   DATABASE_URL="postgresql://ltpt420:mannersmakethman@localhost:5432/pipetgo_dev"
   ```

3. **Create usage guide in `docs/`:**
   - Quick start for dual-mode testing
   - Troubleshooting common issues
   - Performance comparison

4. **Run full test suite:**
   ```bash
   npm run test:run:mock    # All 227+ tests
   npm run test:coverage    # Coverage report
   ```

5. **Benchmark performance:**
   - Record mock mode time
   - Record live mode time (if available)
   - Document in `docs/DUAL_MODE_DATABASE_IMPLEMENTATION.md`

**Acceptance Criteria:**
- [ ] All 227+ tests pass in mock mode
- [ ] CLAUDE.md updated with dual-mode section
- [ ] .env.example includes USE_MOCK_DB
- [ ] Performance benchmarks documented
- [ ] Usage guide created

**Final Commit Message:**
```
docs(testing): complete dual-mode database implementation

Update documentation for dual-mode database system.

Changes:
- Update CLAUDE.md with dual-mode testing guide
- Add USE_MOCK_DB to .env.example
- Document when to use mock vs live mode
- Add performance benchmarks

Results:
- 227/227 tests passing in mock mode
- Mock mode: <5 seconds (16x faster than Docker)
- Web Claude compatible (no credentials needed)
- CI/CD ready (deterministic, parallel)

Closes dual-mode database implementation initiative.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 🚨 Important Reminders

### TDD Workflow (ALWAYS)
1. ✅ Tests first (they should fail)
2. ✅ Implement minimal code to pass
3. ✅ Refactor while keeping tests green
4. ✅ Commit frequently

### Quality Checks (Before EVERY commit)
```bash
npm run type-check  # TypeScript clean
npm run lint        # ESLint clean
npm run test:run    # All tests passing
```

### Schema Parity (CRITICAL)
- ⚠️ Load Prisma-generated SQL in `generateMockSchema()`
- ⚠️ Do NOT manually replicate schema (maintenance nightmare)
- ⚠️ Validate schema parity in development mode

### Error Handling
- If pg-mem doesn't support a Postgres feature, document it
- Fallback to live mode for unsupported features
- Add warnings in console when using workarounds

---

## 📊 Success Criteria

**Functional:**
- [ ] Tests pass in both mock and live mode
- [ ] Schema parity validated
- [ ] All 3 pricing modes seeded (QUOTE_REQUIRED, FIXED, HYBRID)

**Non-Functional:**
- [ ] Mock mode: <5 seconds for all tests
- [ ] Live mode: <60 seconds for all tests
- [ ] Zero TypeScript errors in either mode

**Documentation:**
- [ ] CLAUDE.md updated
- [ ] .env.example includes USE_MOCK_DB
- [ ] Usage guide created
- [ ] Performance benchmarks documented

---

## 🆘 When to Escalate to Root Claude

**Escalate if:**
- ❌ pg-mem doesn't support critical Prisma feature
- ❌ Schema parity cannot be achieved
- ❌ Performance targets not met (>5s mock, >60s live)
- ❌ Blocking issues that affect other projects
- ❌ Need architectural changes to ADR

**How to escalate:**
Add alert to `/home/ltpt420/repos/claude-config/coordination/shared-alerts.md`

---

## 📚 Reference Files

**Design Documents:**
- `/home/ltpt420/repos/pipetgo/docs/DUAL_MODE_DATABASE_IMPLEMENTATION.md` (spec)
- `/home/ltpt420/repos/pipetgo/docs/ADR_DUAL_MODE_DATABASE.md` (ADR)

**Current Implementation:**
- `/home/ltpt420/repos/pipetgo/src/lib/db.ts` (update this)
- `/home/ltpt420/repos/pipetgo/vitest.setup.ts` (update this)
- `/home/ltpt420/repos/pipetgo/vitest.config.ts` (reference)

**Example Tests:**
- `/home/ltpt420/repos/pipetgo/tests/e2e/quote-workflow.test.ts` (migrate this)

---

## 🎯 Expected Outcomes

**After Phase 1:**
- Mock database infrastructure working
- Tests can run with `npm run test:mock`

**After Phase 2:**
- Pilot test using real Prisma queries
- Validation of dual-mode approach

**After Phase 3:**
- All E2E tests migrated
- Real SQL validation working

**After Phase 4:**
- Complete dual-mode system
- Full documentation
- Performance benchmarks

**Total Time:** 5-8 hours across 4 phases

---

**Ready to start? Begin with Phase 1 and work through systematically!**

Good luck, pipetgo-claude! 🚀
