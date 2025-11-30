# ADR: Password Authentication Merge Strategy

**Status:** Proposed - 2025-11-30

**Authors:** @architect

**Related Documents:**
- `docs/Parallel_UAT_Implementation_20251120.md`
- `docs/SECURE_PASSWORD_SETUP_SUMMARY.md`
- `docs/POST_UAT_SECURITY_IMPLEMENTATION_PLAN.md`

---

## Executive Summary

**Adopt technical debt branch security implementation while preserving main branch field naming.**

The technical debt branch (`claude/code-review-technical-debt-01CRYQpqox1EwsjNs5UMHuic`) has superior security (timing attack protection, dedicated password module, rate limiting), but uses `passwordHash` field name. Main branch uses `hashedPassword` with 4 lab accounts already seeded. **Solution:** Rename branch's `passwordHash` → `hashedPassword` before merge, adopt all branch security features, cherry-pick UI improvements separately.

---

## 1. Security Comparison

### Feature-by-Feature Analysis

| Security Feature | Main Branch | Technical Debt Branch | Winner |
|-----------------|-------------|----------------------|--------|
| **Password hashing** | ✅ bcrypt (12 rounds) | ✅ bcrypt (12 rounds) | TIE |
| **Timing attack protection** | ❌ No fake hash verification | ✅ Fake hash when user absent | **BRANCH** |
| **Password utilities module** | ❌ Inline bcrypt.compare() | ✅ `src/lib/password.ts` | **BRANCH** |
| **Password strength validation** | ❌ None | ✅ `validatePasswordStrength()` | **BRANCH** |
| **Rate limiting** | ❌ None (CVSS 7.5) | ✅ Upstash Redis (5/15min) | **BRANCH** |
| **Schema field name** | ✅ `hashedPassword` (standard) | ❌ `passwordHash` (non-standard) | **MAIN** |
| **Seeded data** | ✅ 4 lab accounts with passwords | ❌ None | **MAIN** |
| **Test coverage** | ✅ 378 tests passing | ✅ 492 tests passing | **BRANCH** |

### Critical Security Issues

**Main Branch Vulnerabilities:**
1. **Timing Attack (Medium Severity):** Login time leaks user existence
   - When user doesn't exist: Fast response (no bcrypt)
   - When user exists: Slow response (bcrypt.compare)
   - Attacker can enumerate valid emails via timing analysis

2. **No Rate Limiting (High Severity - CVSS 7.5):**
   - Unlimited login attempts
   - Credential stuffing possible
   - Brute-force attacks unmitigated

**Branch Solutions:**
1. **Timing Attack Mitigation:**
   ```typescript
   // Always runs bcrypt.compare (constant time)
   const FAKE_PASSWORD_HASH = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKKhkP.Eim'

   if (!user) {
     // Fake verification prevents timing leak
     await verifyPassword(credentials.password, FAKE_PASSWORD_HASH)
     return null
   }
   ```

2. **Rate Limiting (Upstash Redis):**
   - Login: 5 attempts per 15 minutes per IP
   - Set Password: 5 attempts per hour per user ID
   - Graceful degradation (fail open if Redis unavailable)
   - 70 additional tests for rate limiting logic

### Security Score Impact

| Metric | Main Branch | After Merge | Improvement |
|--------|-------------|-------------|-------------|
| Overall Security | 6.5/10 | 9.0/10 | +2.5 |
| Auth Vulnerabilities | 2 critical | 0 critical | 100% reduction |
| Test Coverage | 378 tests | 492 tests | +30% |
| CVSS Issues | 1 (7.5) | 0 | Eliminated |

---

## 2. Field Name Standardization

### Recommendation: Keep `hashedPassword`

**Rationale:**

1. **Ecosystem Alignment:**
   - NextAuth docs use `hashedPassword` in examples
   - Prisma guides use `hashedPassword` for password fields
   - Industry standard (Django, Rails use `password_hash` but JS uses `hashedPassword`)

2. **Migration Complexity:**
   - Main branch: 4 lab accounts with `hashedPassword` already seeded
   - Branch: No production data, only schema difference
   - **Lower risk:** Change branch schema (dev) vs migrate production data (main)

3. **Git History Clarity:**
   - Main branch has `hashedPassword` since Nov 20 (commit 5fe1056)
   - Branch diverged after, used `passwordHash` independently
   - Standardizing to main's naming preserves primary branch history

4. **Code Readability:**
   - `hashedPassword` more descriptive (adjective + noun)
   - `passwordHash` sounds like hash algorithm name
   - `hashedPassword` clearer for onboarding developers

**Decision:** Rename `passwordHash` → `hashedPassword` in branch before merge.

---

## 3. Security Feature Adoption Plan

### Phase 1: Field Name Unification (Branch-Side Changes)

**Objective:** Make branch compatible with main's schema.

**Changes Required:**

1. **Prisma Schema (`prisma/schema.prisma`):**
   ```diff
   model User {
     id            String    @id @default(cuid())
     email         String    @unique
   - passwordHash  String?   // Bcrypt password hash (nullable for OAuth-only users)
   + hashedPassword String?  // Nullable - existing users have none
     role          UserRole  @default(CLIENT)
     ...
   }
   ```

2. **Password Module (`src/lib/password.ts`):**
   - No changes needed (functions are field-agnostic)
   - `hashPassword()` and `verifyPassword()` work with any field name

3. **Auth Configuration (`src/lib/auth.ts`):**
   ```diff
   const user = await prisma.user.findUnique({
     where: { email: credentials.email.toLowerCase() },
     select: {
       id: true,
       email: true,
       name: true,
       role: true,
   -   passwordHash: true
   +   hashedPassword: true
     }
   })

   // ...

   - if (!user.passwordHash) {
   + if (!user.hashedPassword) {
       return null
     }

   - const validPassword = await verifyPassword(credentials.password, user.passwordHash)
   + const validPassword = await verifyPassword(credentials.password, user.hashedPassword)
   ```

4. **Seed Script (`prisma/seed.ts`):**
   - Use main branch seed script (already has `hashedPassword`)
   - Branch seed script has no password data to preserve

5. **Migration Script:**
   ```typescript
   // No migration needed - branch has no production data
   // After field rename, run: npm run db:push
   ```

**Verification Checklist:**
- [ ] All references to `passwordHash` replaced with `hashedPassword`
- [ ] `npm run type-check` passes (0 TypeScript errors)
- [ ] Schema push succeeds: `npm run db:push`
- [ ] Seed script runs: `npm run db:seed`
- [ ] All 492 tests pass: `npm run test:run`

### Phase 2: Security Feature Integration (Main Branch Merge)

**Objective:** Bring branch security features to main.

**Files to Merge:**

1. **New Files (direct copy):**
   - `src/lib/password.ts` - Password utilities module
   - `src/lib/rate-limit.ts` - Rate limiting utilities
   - `tests/lib/password.test.ts` - Password module tests
   - `tests/lib/rate-limit.test.ts` - Rate limiting tests
   - `tests/api/auth/nextauth-ratelimit.test.ts` - Login rate limiting tests

2. **Modified Files (careful merge):**
   - `src/lib/auth.ts` - Add timing attack protection, integrate `verifyPassword()`
   - `src/app/api/auth/[...nextauth]/route.ts` - Add rate limiting
   - `package.json` - Add Upstash dependencies
   - `package-lock.json` - Auto-generated from package.json

3. **Files to Keep from Main:**
   - `prisma/schema.prisma` - Main's `hashedPassword` field
   - `prisma/seed.ts` - Main's 4 lab accounts with passwords
   - All UI files (unchanged by password auth)

**Merge Strategy:**

```bash
# On branch (before merge)
git checkout claude/code-review-technical-debt-01CRYQpqox1EwsjNs5UMHuic

# 1. Rename field in branch
# (Manual edits to schema, auth.ts as shown above)

# 2. Test branch changes
npm run type-check
npm run test:run
npm run db:push

# 3. Switch to main
git checkout main

# 4. Cherry-pick password utilities (clean commits, no conflicts)
git cherry-pick dd5c4e3  # P0-1 password auth
git cherry-pick 800242f  # P0-2 rate limiting

# 5. Resolve conflicts (prefer main's hashedPassword)
git checkout --ours prisma/schema.prisma  # Keep main's schema
git checkout --theirs src/lib/password.ts # Take branch's module
git checkout --theirs src/lib/rate-limit.ts # Take branch's rate limiter

# 6. Manual merge of src/lib/auth.ts
# - Keep main's hashedPassword field references
# - Add branch's timing attack protection
# - Add branch's verifyPassword() import

# 7. Verify
npm install  # Install Upstash dependencies
npm run type-check
npm run test:run
```

**Risk Mitigation:**

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Schema conflict | High | Medium | Use main's schema, rename in branch first |
| Test failures | Medium | Medium | Run branch tests after rename before merge |
| Rate limit broken | Low | High | Fail-open design (Redis optional) |
| Seeded data lost | Low | Critical | Never touch main's seed.ts |

### Phase 3: Environment Configuration

**Production Environment Variables:**

```env
# Existing (no changes)
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://pipetgo.com"
NEXTAUTH_SECRET="..."
UPLOADTHING_SECRET="..."
UPLOADTHING_APP_ID="..."

# NEW - Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"  # Required for production
UPSTASH_REDIS_REST_TOKEN="xxx"                   # Required for production
```

**Development Behavior:**
- If Redis env vars not set: Rate limiting disabled (fail-open)
- If Redis connection fails: Rate limiting disabled (logged error)
- **No breaking changes for local development**

**Deployment Steps:**
1. Create Upstash Redis database (free tier: 10k requests/day)
2. Add env vars to Vercel project settings
3. Deploy main branch with merged security features
4. Monitor Upstash analytics dashboard for rate limit events

---

## 4. Migration Path

### Step-by-Step Implementation

#### **BEFORE MERGE: Branch Preparation**

**Step 1: Checkout Branch**
```bash
git checkout claude/code-review-technical-debt-01CRYQpqox1EwsjNs5UMHuic
git pull origin claude/code-review-technical-debt-01CRYQpqox1EwsjNs5UMHuic
```

**Step 2: Field Rename (Local Changes)**

Edit `prisma/schema.prisma`:
```diff
- passwordHash  String?
+ hashedPassword String?
```

Edit `src/lib/auth.ts` (3 occurrences):
```diff
- passwordHash: true
+ hashedPassword: true

- if (!user.passwordHash) {
+ if (!user.hashedPassword) {

- await verifyPassword(credentials.password, user.passwordHash)
+ await verifyPassword(credentials.password, user.hashedPassword)
```

**Step 3: Verify Branch Changes**
```bash
npm run type-check          # Should pass (0 errors)
npm run test:run            # Should pass (492 tests)
npm run db:push             # Schema sync (local only)
npm run db:seed             # Verify seed works
npm run dev                 # Test login manually
```

**Step 4: Commit Field Rename**
```bash
git add prisma/schema.prisma src/lib/auth.ts
git commit -m "refactor: rename passwordHash to hashedPassword for main branch compatibility

- Aligns with main branch schema field naming
- No functional changes, pure rename
- Preparation for merge to main"
```

**Step 5: Push Updated Branch**
```bash
git push origin claude/code-review-technical-debt-01CRYQpqox1EwsjNs5UMHuic
```

#### **MERGE TO MAIN: Security Integration**

**Step 6: Switch to Main**
```bash
git checkout main
git pull origin main
```

**Step 7: Create Feature Branch**
```bash
git checkout -b feat/password-auth-security-merge
```

**Step 8: Cherry-Pick Password Auth**
```bash
# Commit dd5c4e3: Password authentication implementation
git cherry-pick dd5c4e3

# Expected conflicts: prisma/schema.prisma (already resolved in branch)
# Resolution: Use updated branch version (hashedPassword)
git checkout --theirs prisma/schema.prisma
git add prisma/schema.prisma
git cherry-pick --continue
```

**Step 9: Cherry-Pick Rate Limiting**
```bash
# Commit 800242f: Rate limiting implementation
git cherry-pick 800242f

# Expected conflicts: None (new files only)
```

**Step 10: Install Dependencies**
```bash
npm install  # Adds @upstash/ratelimit and @upstash/redis
```

**Step 11: Verify Merge**
```bash
npm run type-check          # Should pass
npm run lint                # Should pass
npm run test:run            # Should pass (492 tests)
```

**Step 12: Test Manual Login**
```bash
npm run db:push             # Sync schema
npm run db:seed             # Seed 4 lab accounts
npm run dev                 # Start dev server

# Test Cases:
# 1. Login lab1@pgtestinglab.com (password-protected account)
# 2. Verify timing attack protection (measure response times)
# 3. Trigger rate limit (6 failed attempts → 429 response)
# 4. Verify fail-open (unset Redis env vars, login should work)
```

**Step 13: Commit Merge**
```bash
git add .
git commit -m "$(cat <<'EOF'
feat: merge password authentication security from technical debt branch

## Security Improvements

**Timing Attack Protection:**
- Constant-time user existence checks via fake bcrypt verification
- Prevents email enumeration via login timing analysis
- FAKE_PASSWORD_HASH used when user doesn't exist

**Rate Limiting (Upstash Redis):**
- Login: 5 attempts per 15 minutes per IP
- Set Password: 5 attempts per hour per user ID
- Graceful degradation (fail-open if Redis unavailable)
- 70 new tests for rate limiting logic

**Password Module:**
- Dedicated src/lib/password.ts with hashPassword() and verifyPassword()
- Password strength validation (8+ chars, complexity requirements)
- Random password generation for testing
- Consistent error handling

## Field Naming

- Standardized on `hashedPassword` (main branch convention)
- Branch's `passwordHash` renamed to `hashedPassword` before merge
- No data migration needed (branch had no production data)

## Dependencies

- @upstash/ratelimit: ^2.0.7
- @upstash/redis: ^1.35.6

## Environment Variables (Production)

- UPSTASH_REDIS_REST_URL: Redis endpoint
- UPSTASH_REDIS_REST_TOKEN: Redis auth token
- Optional in development (rate limiting disabled without them)

## Test Coverage

- 492 tests passing (up from 378)
- +70 rate limiting tests
- +44 password module tests
- All existing tests preserved

## Breaking Changes

None. Backward compatible with:
- Existing seeded accounts (4 lab admins with hashedPassword)
- Accounts without passwords (email-only auth still works)
- Local development (Redis optional)

## Security Score

- Before: 6.5/10 (timing attack, no rate limiting)
- After: 9.0/10 (both vulnerabilities mitigated)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Step 14: Final Verification**
```bash
# Run full test suite
npm run test:run

# Type checking
npm run type-check

# Linting
npm run lint

# Build verification
npm run build
```

**Step 15: Push Feature Branch**
```bash
git push origin feat/password-auth-security-merge
```

#### **VERIFICATION CHECKPOINTS**

After each step, verify:

- ✅ **TypeScript:** `npm run type-check` (0 errors)
- ✅ **Tests:** `npm run test:run` (all passing)
- ✅ **Lint:** `npm run lint` (0 warnings)
- ✅ **Manual Login:** Test with lab1@pgtestinglab.com
- ✅ **Git History:** `git log --oneline` (clean commits)

**If Any Check Fails:**
1. Stop immediately
2. Document error
3. Run `git status` to identify changed files
4. Rollback: `git reset --hard HEAD~1`
5. Re-read instructions, retry step

---

## 5. UI Improvements Compatibility

### Dependency Analysis

**Question:** Will UI improvements (TIER 1-3) break after password auth changes?

**Answer:** No. UI improvements are completely independent of password authentication.

**Evidence:**

1. **No Field References:**
   ```bash
   # Check UI files for password field references
   $ grep -r "passwordHash\|hashedPassword" src/components/ui/ src/app/dashboard/ src/app/page.tsx src/app/order/
   # Result: No matches
   ```

2. **Component Changes (TIER 1-3):**
   - Status badge colors (`getStatusColor()` in `utils.ts`)
   - Form field error states (`Input`, `Textarea`, `FormField` components)
   - Mobile responsiveness (Tailwind classes only)
   - Empty states (markup + icons)
   - Order timeline component (uses `OrderStatus` enum, not password fields)

3. **Zero Overlap:**
   - Password auth: `src/lib/auth.ts`, `src/lib/password.ts`, Prisma schema
   - UI improvements: `src/components/ui/*`, `src/app/dashboard/*`, `utils.ts`
   - **No shared files modified**

### Safe Merge Order

**Option A: Security First (Recommended)**
```bash
1. Merge password auth security → main
2. Verify all 492 tests pass
3. Cherry-pick UI improvements (commits 2a825d4, e0484d0)
4. Verify all 442 UI tests pass
```

**Rationale:** Security is higher priority (CVSS 7.5 issue). If UI merge conflicts occur, easier to resolve without security code in the way.

**Option B: UI First (Alternative)**
```bash
1. Cherry-pick UI improvements → main
2. Verify all 442 UI tests pass
3. Merge password auth security
4. Verify all 492 tests pass
```

**Rationale:** UI improvements ready for demo, low risk. Security can be deployed after user testing.

**Recommendation:** Use **Option A (Security First)** for production. Use **Option B (UI First)** if demo urgency overrides security priority.

### UI Merge Commands

```bash
# After password auth merged to main
git checkout main
git pull origin main

# Cherry-pick TIER 1 & 2 improvements
git cherry-pick 2a825d4

# Cherry-pick TIER 3 improvements
git cherry-pick e0484d0

# Verify
npm run test:run  # Should show 442+ tests passing
npm run dev       # Visual verification
```

**Expected Conflicts:** None (UI files don't overlap with password auth files)

---

## 6. Risk Assessment

### What Could Go Wrong

| Risk | Probability | Impact | Severity | Mitigation |
|------|-------------|--------|----------|------------|
| **Field name mismatch after merge** | Medium | Critical | P0 | Rename in branch FIRST, verify TypeScript passes |
| **Seeded lab accounts lost** | Low | Critical | P0 | NEVER modify main's seed.ts, use --ours for conflicts |
| **Rate limiting breaks login** | Low | High | P1 | Fail-open design (Redis optional), test without env vars |
| **Tests fail after merge** | Medium | Medium | P1 | Run tests after EACH cherry-pick, rollback if fail |
| **Timing attack protection broken** | Low | High | P1 | Test with fake hash, measure response times |
| **Redis dependency adds cost** | Low | Low | P2 | Use Upstash free tier (10k requests/day, sufficient for Stage 2) |
| **UI improvements conflict** | Very Low | Low | P2 | No shared files, visual verification only |

### Mitigation Strategies

**P0 Risks (Critical):**

1. **Field Name Mismatch:**
   - **Prevention:** Rename `passwordHash` → `hashedPassword` in branch before any merge
   - **Detection:** `npm run type-check` will fail if mismatch exists
   - **Rollback:** `git reset --hard HEAD~1` if TypeScript errors appear
   - **Validation:** Check `prisma/schema.prisma` line 67 matches main

2. **Seeded Data Loss:**
   - **Prevention:** Never modify main's `prisma/seed.ts` during merge
   - **Detection:** Compare `git diff main HEAD -- prisma/seed.ts` (should be empty)
   - **Rollback:** `git checkout main -- prisma/seed.ts` if accidentally modified
   - **Validation:** Verify 4 lab accounts exist after `db:seed`

**P1 Risks (High):**

3. **Rate Limiting Breaks Login:**
   - **Prevention:** Test without Redis env vars (fail-open mode)
   - **Detection:** Login fails with 500 error instead of 401/429
   - **Rollback:** Remove rate limit check from `auth.ts` authorize()
   - **Validation:** Login succeeds even when Redis unreachable

4. **Tests Fail After Merge:**
   - **Prevention:** Run `npm run test:run` after each cherry-pick
   - **Detection:** Test suite exits with code 1
   - **Rollback:** `git cherry-pick --abort` or `git reset --hard HEAD~1`
   - **Validation:** All 492 tests pass before committing

5. **Timing Attack Protection Broken:**
   - **Prevention:** Test fake hash verification with non-existent user
   - **Detection:** Login response faster for non-existent users
   - **Rollback:** Restore fake hash constant from branch
   - **Validation:** Measure 10 failed logins (existing vs non-existing users), timing difference <50ms

**P2 Risks (Medium):**

6. **Redis Cost:**
   - **Prevention:** Use Upstash free tier (10k req/day = ~208 req/hour)
   - **Detection:** Upstash dashboard shows quota exceeded
   - **Rollback:** Rate limiting fails open (no impact)
   - **Validation:** Monitor first 7 days, upgrade if >8k req/day

7. **UI Conflicts:**
   - **Prevention:** Cherry-pick UI commits separately after security merge
   - **Detection:** Git merge conflict in UI files
   - **Rollback:** `git cherry-pick --abort`, merge manually
   - **Validation:** Visual review of all dashboard pages

### Rollback Procedure

**Emergency Reversal (if merge breaks production):**

```bash
# IMMEDIATE: Revert main to previous state
git checkout main
git log --oneline -5  # Find commit BEFORE merge
git revert <merge-commit-hash>
git push origin main --force-with-lease  # ⚠️ DESTRUCTIVE, only if necessary

# FAST ROLLBACK: Reset to pre-merge state
git reset --hard <commit-before-merge>
git push origin main --force  # ⚠️ NUCLEAR OPTION, use with caution

# SAFE ROLLBACK: Revert specific files
git checkout <commit-before-merge> -- src/lib/auth.ts
git checkout <commit-before-merge> -- src/lib/password.ts
git checkout <commit-before-merge> -- src/lib/rate-limit.ts
git commit -m "revert: rollback password auth security (production issue)"
```

**Rollback Checklist:**
1. ✅ Document what broke (screenshots, logs, error messages)
2. ✅ Notify team in Slack/Discord (if applicable)
3. ✅ Create rollback commit with detailed message
4. ✅ Verify rollback with `npm run test:run`
5. ✅ Deploy rollback immediately
6. ✅ Post-mortem: Why did it break? How to prevent?

### Testing Strategy

**Pre-Merge Testing (Branch):**
- [ ] `npm run type-check` (0 errors)
- [ ] `npm run lint` (0 warnings)
- [ ] `npm run test:run` (492 tests pass)
- [ ] `npm run db:push && npm run db:seed` (schema + data)
- [ ] Manual login test (lab1@pgtestinglab.com)

**Post-Merge Testing (Main):**
- [ ] `npm run type-check` (0 errors)
- [ ] `npm run lint` (0 warnings)
- [ ] `npm run test:run` (492 tests pass)
- [ ] `npm run build` (production build succeeds)
- [ ] Manual login test (all 4 lab accounts)
- [ ] Rate limit test (6 failed attempts → 429)
- [ ] Timing attack test (measure response times)
- [ ] Fail-open test (unset Redis vars, login works)

**Production Deployment Testing:**
- [ ] Staging deployment (Vercel preview)
- [ ] Rate limiting active (Redis configured)
- [ ] Login works for all user types
- [ ] 429 responses have Retry-After header
- [ ] Monitoring dashboard shows events
- [ ] CEO demo (lab admin login + quote workflow)

---

## 7. Testing Strategy (Detailed)

### Tests to Add/Modify

**New Tests (from branch, already implemented):**

1. **Password Module Tests (`tests/lib/password.test.ts` - 44 tests):**
   - `hashPassword()` success cases
   - `hashPassword()` validation (empty, too short, too long)
   - `verifyPassword()` success and failure cases
   - `validatePasswordStrength()` complexity rules
   - `generateRandomPassword()` entropy checks

2. **Rate Limit Tests (`tests/lib/rate-limit.test.ts` - 43 tests):**
   - IP extraction from headers (Cloudflare, nginx, standard)
   - Rate limit check with Redis configured
   - Rate limit check without Redis (fail-open)
   - Retry-After calculation
   - 429 response format validation

3. **Login Rate Limit Tests (`tests/api/auth/nextauth-ratelimit.test.ts` - 21 tests):**
   - Successful login under limit
   - 429 after exceeding limit
   - Retry-After header accuracy
   - X-RateLimit-* headers present
   - Different IPs isolated (no global limit)

4. **Set Password Rate Limit Tests (`tests/api/auth/set-password/route.test.ts` - 6 new):**
   - Successful password set under limit
   - 429 after exceeding limit (user-specific)
   - Rate limit reset after time window

**Modified Tests (adapt for hashedPassword):**

5. **Auth Tests (update field references):**
   - `tests/lib/auth.test.ts` - Update user fixtures to use `hashedPassword`
   - Any API tests creating users with passwords

**Tests to Keep from Main:**

6. **Existing Tests (378 tests):**
   - Utils tests (`tests/lib/utils.test.ts`)
   - Validation tests (`tests/lib/validations/*.test.ts`)
   - All non-auth API route tests

### Test Execution Plan

**Phase 1: Branch Testing (Before Merge)**
```bash
# On branch (after field rename)
npm run test:run  # Expect 492 tests passing

# Specific test suites
npm run test -- tests/lib/password.test.ts
npm run test -- tests/lib/rate-limit.test.ts
npm run test -- tests/api/auth/nextauth-ratelimit.test.ts
```

**Phase 2: Merge Testing (During Cherry-Pick)**
```bash
# After each cherry-pick
npm run test:run  # Should incrementally add tests

# After password auth cherry-pick
npm run test -- tests/lib/password.test.ts  # +44 tests

# After rate limiting cherry-pick
npm run test -- tests/lib/rate-limit.test.ts  # +43 tests
npm run test -- tests/api/auth/nextauth-ratelimit.test.ts  # +21 tests
```

**Phase 3: Integration Testing (After Full Merge)**
```bash
# Full test suite
npm run test:run  # Expect 492 tests passing

# Coverage report
npm run test:coverage  # Should show improved coverage

# Specific auth flow testing
npm run test -- tests/api/auth/  # All auth-related tests
```

**Phase 4: Manual Testing (Before Deployment)**

| Test Case | Expected Result | Verification |
|-----------|-----------------|--------------|
| Login with valid password | 200 OK, session created | Check session cookie |
| Login with wrong password | 401 Unauthorized | No session cookie |
| Login with non-existent user | 401 Unauthorized (same timing) | Measure response time |
| 6 failed login attempts | 429 Too Many Requests | Check Retry-After header |
| Login without Redis vars | 200 OK (fail-open) | Rate limiting skipped |
| Password strength validation | Client-side errors | Form shows validation messages |

---

## 8. Consequences

### Benefits

**Security:**
- ✅ Eliminates timing attack vulnerability (user enumeration)
- ✅ Eliminates CVSS 7.5 vulnerability (no rate limiting)
- ✅ Adds password strength validation (prevents weak passwords)
- ✅ Improves security score from 6.5/10 → 9.0/10

**Code Quality:**
- ✅ Dedicated password module (single responsibility)
- ✅ Reusable password utilities (hashPassword, verifyPassword, validateStrength)
- ✅ +114 tests (30% increase in test coverage)
- ✅ Better code organization (auth.ts simpler)

**Operational:**
- ✅ Fail-open design (Redis outage doesn't break auth)
- ✅ Rate limit monitoring (Upstash analytics dashboard)
- ✅ Standard HTTP headers (Retry-After, X-RateLimit-*)
- ✅ CEO demo ready (secure password auth for lab admins)

**Developer Experience:**
- ✅ Clear password validation errors (8+ chars, complexity)
- ✅ Consistent field naming (`hashedPassword` across codebase)
- ✅ Well-documented utilities (JSDoc comments)
- ✅ Easy to extend (add password reset, 2FA later)

### Tradeoffs

**Complexity Added:**
- ⚠️ New dependency (Upstash Redis) requires account setup
- ⚠️ Additional env vars (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
- ⚠️ More files to maintain (password.ts, rate-limit.ts)
- ⚠️ 114 more tests to maintain

**Migration Risk:**
- ⚠️ Field rename in branch introduces conflict risk
- ⚠️ Cherry-pick process more complex than direct merge
- ⚠️ Testing requires manual verification (timing attacks)

**Operational Overhead:**
- ⚠️ Redis monitoring required (Upstash dashboard)
- ⚠️ Rate limit tuning may be needed (5/15min too strict?)
- ⚠️ User support for "too many requests" errors

### Accepted Limitations

**Rate Limiting Constraints:**
- Upstash free tier: 10k requests/day (sufficient for Stage 2)
- IP-based limiting (VPN users share limit)
- Fail-open design (no auth if Redis down)

**Password Policy Enforcement:**
- No password expiration (intentional, user-hostile)
- No password history (prevents reuse, but adds complexity)
- No breach detection (future enhancement)

**Field Naming:**
- `hashedPassword` not universally standard (some use `password_hash`)
- TypeScript verbosity (longer field name)
- Migration to different name in future would be painful

---

## 9. Future Enhancements

**Post-Merge Improvements (Not Blocking):**

1. **Password Reset Flow (P1):**
   - Email-based password reset with tokens
   - Reset token expiration (1 hour)
   - Rate limiting for reset requests (3/hour per email)
   - Estimated effort: 2-3 days

2. **Password Breach Detection (P2):**
   - Integration with HaveIBeenPwned API
   - Client-side k-anonymity check (no password sent)
   - Warning on signup/login if password breached
   - Estimated effort: 1 day

3. **Rate Limit Tuning (P2):**
   - Analytics review after 1 month
   - Adjust limits based on actual traffic
   - Whitelist trusted IPs (office, CI/CD)
   - Estimated effort: 2 hours

4. **Two-Factor Authentication (P3):**
   - TOTP (Google Authenticator, Authy)
   - SMS backup codes (optional)
   - Recovery codes for account recovery
   - Estimated effort: 3-5 days

5. **Session Management (P3):**
   - Active session listing (see all logged-in devices)
   - Remote logout (revoke sessions)
   - Session expiration notifications
   - Estimated effort: 2 days

**Monitoring & Observability:**

6. **Security Dashboard (P2):**
   - Failed login attempts by IP
   - Rate limit events visualization
   - Password change audit log
   - Estimated effort: 1-2 days

7. **Alerting Rules (P1):**
   - Spike in failed logins (10+ in 1 minute)
   - Rate limit exceeded frequently (same IP)
   - Upstash Redis connection failures
   - Estimated effort: 4 hours (using Vercel monitoring)

---

## 10. Implementation Timeline

### Week 1: Branch Preparation

| Day | Task | Owner | Status |
|-----|------|-------|--------|
| Mon | Field rename (passwordHash → hashedPassword) | @architect | Pending |
| Mon | Run tests on branch (verify 492 passing) | @quality-reviewer | Pending |
| Tue | Manual testing (timing attack, rate limit) | @security-auth | Pending |
| Tue | Document field rename commit | @technical-writer | Pending |
| Wed | Push updated branch | @developer | Pending |

### Week 2: Security Merge

| Day | Task | Owner | Status |
|-----|------|-------|--------|
| Mon | Create feature branch (feat/password-auth-security-merge) | @developer | Pending |
| Mon | Cherry-pick password auth (dd5c4e3) | @developer | Pending |
| Mon | Cherry-pick rate limiting (800242f) | @developer | Pending |
| Tue | Resolve conflicts (schema, auth.ts) | @developer | Pending |
| Tue | Run full test suite (492 tests) | @quality-reviewer | Pending |
| Wed | Manual testing (all 4 lab accounts) | @security-auth | Pending |
| Wed | Code review (security focus) | @security-auth | Pending |
| Thu | Deploy to staging (Vercel preview) | @developer | Pending |
| Thu | CEO demo (verify login works) | @ux-reviewer | Pending |
| Fri | Merge to main | @architect | Pending |

### Week 3: UI Merge

| Day | Task | Owner | Status |
|-----|------|-------|--------|
| Mon | Cherry-pick TIER 1 & 2 UI (2a825d4) | @developer | Pending |
| Mon | Cherry-pick TIER 3 UI (e0484d0) | @developer | Pending |
| Tue | Visual verification (all dashboards) | @ux-reviewer | Pending |
| Tue | Mobile testing (responsive layouts) | @ux-reviewer | Pending |
| Wed | Deploy to staging | @developer | Pending |
| Wed | CEO demo (UI improvements) | @ux-reviewer | Pending |
| Thu | Merge to main | @architect | Pending |

### Week 4: Production Deployment

| Day | Task | Owner | Status |
|-----|------|-------|--------|
| Mon | Create Upstash Redis database | @developer | Pending |
| Mon | Add env vars to Vercel | @developer | Pending |
| Tue | Deploy to production | @developer | Pending |
| Tue | Verify rate limiting active | @security-auth | Pending |
| Wed | Monitor Upstash dashboard (24h) | @developer | Pending |
| Wed | User testing with friends | @architect | Pending |
| Thu | Collect feedback, prioritize fixes | @architect | Pending |
| Fri | Retrospective, document lessons | @architect | Pending |

**Total Estimated Time:** 20 days (4 weeks)

**Critical Path:** Branch preparation → Security merge → Production deployment

---

## 11. Success Criteria

### Merge Success

- ✅ All 492 tests passing
- ✅ Zero TypeScript errors
- ✅ Zero linting warnings
- ✅ Production build succeeds
- ✅ Manual login works (4 lab accounts)
- ✅ Rate limiting triggers (6 failed attempts → 429)
- ✅ Timing attack protection active (constant time responses)

### Security Success

- ✅ CVSS 7.5 vulnerability eliminated (rate limiting active)
- ✅ Timing attack vulnerability eliminated (fake hash verification)
- ✅ Security score 9.0/10 or higher
- ✅ No new vulnerabilities introduced
- ✅ Upstash Redis monitoring active

### Operational Success

- ✅ Zero production incidents (1 week post-deploy)
- ✅ <1% rate limit false positives (legitimate users blocked)
- ✅ Redis uptime >99.9% (Upstash SLA)
- ✅ Fail-open works (auth succeeds if Redis down)
- ✅ CEO demo successful (lab admin login + quote workflow)

### Developer Success

- ✅ Clear documentation (this ADR)
- ✅ Easy to test (npm run test:run)
- ✅ Easy to rollback (documented procedure)
- ✅ Easy to extend (add password reset later)

---

## 12. Alternatives Considered

### Alternative 1: Keep passwordHash, Rename in Main

**Approach:** Change main branch to use `passwordHash` instead of `hashedPassword`.

**Pros:**
- No changes needed in branch
- Branch already has working tests

**Cons:**
- ❌ Main branch has 4 seeded lab accounts with `hashedPassword`
- ❌ Requires migration script to rename data in production
- ❌ Higher risk (data loss if migration fails)
- ❌ Non-standard naming (ecosystem uses `hashedPassword`)

**Rejected:** Data migration risk too high for minimal benefit.

---

### Alternative 2: Direct Merge (No Cherry-Pick)

**Approach:** Merge entire branch to main, resolve all conflicts.

**Pros:**
- Simpler process (one merge)
- Git history preserves branch lineage

**Cons:**
- ❌ Brings in all branch commits (including experimental changes)
- ❌ UI improvements mixed with security changes (harder to rollback)
- ❌ Conflict resolution more complex (180+ file changes)

**Rejected:** Too risky. Cherry-pick allows surgical extraction of security features.

---

### Alternative 3: Reimplement Security in Main

**Approach:** Read branch code, rewrite in main from scratch.

**Pros:**
- Clean implementation (no merge conflicts)
- Opportunity to simplify/improve

**Cons:**
- ❌ Duplicates effort (114 tests already written)
- ❌ High risk of introducing bugs
- ❌ Loses branch test coverage
- ❌ Wastes 3-5 days of development time

**Rejected:** Not DRY. Branch implementation already proven and tested.

---

### Alternative 4: Deploy Both Implementations (A/B Test)

**Approach:** Keep both `hashedPassword` and `passwordHash`, support both in code.

**Pros:**
- Zero migration risk
- Gradual rollout possible

**Cons:**
- ❌ Dual maintenance burden (2 field names)
- ❌ Code complexity (check both fields everywhere)
- ❌ Confusing for developers
- ❌ Technical debt accumulates

**Rejected:** Adds complexity without benefit. Standardization is better.

---

## 13. References

**Related ADRs:**
- `docs/ADR_AUTHENTICATION_ARCHITECTURE_20251117.md` - Original auth design
- `docs/ADR_GOATCOUNTER_LEVEL1_ANALYTICS.md` - Analytics implementation

**Security Documents:**
- `docs/POST_UAT_SECURITY_IMPLEMENTATION_PLAN.md` - P0 security fixes
- `docs/Parallel_UAT_Implementation_20251120.md` - Parallel implementation strategy
- `docs/SECURE_PASSWORD_SETUP_SUMMARY.md` - Password setup guide

**Implementation Plans:**
- `docs/AUTH_ENHANCEMENT_IMPLEMENTATION_PLAN.md` - Auth roadmap
- `docs/IMPROVEMENT_LAUNDRY_LIST_20251119.md` - Technical debt catalog

**External References:**
- OWASP Top 10 (A07:2021 - Authentication Failures)
- NIST SP 800-63B (Digital Identity Guidelines)
- Upstash Rate Limiting Docs (https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
- bcrypt Best Practices (12 rounds for 2025)

---

## Appendix A: Field Rename Script

**Automated Rename (Branch-Side):**

```bash
#!/bin/bash
# scripts/rename-password-field.sh

set -e  # Exit on error

echo "🔄 Renaming passwordHash → hashedPassword in branch..."

# 1. Prisma schema
echo "📝 Updating prisma/schema.prisma..."
sed -i 's/passwordHash/hashedPassword/g' prisma/schema.prisma

# 2. Auth configuration
echo "📝 Updating src/lib/auth.ts..."
sed -i 's/passwordHash/hashedPassword/g' src/lib/auth.ts

# 3. Type checking
echo "🔍 Running TypeScript check..."
npm run type-check

# 4. Test suite
echo "🧪 Running tests..."
npm run test:run

# 5. Git commit
echo "📦 Committing changes..."
git add prisma/schema.prisma src/lib/auth.ts
git commit -m "refactor: rename passwordHash to hashedPassword for main branch compatibility"

echo "✅ Field rename complete! Safe to merge to main."
```

**Usage:**
```bash
chmod +x scripts/rename-password-field.sh
./scripts/rename-password-field.sh
```

---

## Appendix B: Timing Attack Test Script

**Manual Timing Verification:**

```bash
#!/bin/bash
# scripts/test-timing-attack.sh

set -e

echo "⏱️ Testing timing attack protection..."

# Requires: curl, bc (for math)

# Test 1: Non-existent user (should still run bcrypt)
echo "Testing non-existent user (should be slow)..."
START=$(date +%s%N)
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com","password":"wrongpass"}' \
  > /dev/null 2>&1
END=$(date +%s%N)
TIME1=$(echo "scale=3; ($END - $START) / 1000000000" | bc)
echo "Time: ${TIME1}s"

# Test 2: Existing user, wrong password (should be slow)
echo "Testing existing user with wrong password..."
START=$(date +%s%N)
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"lab1@pgtestinglab.com","password":"wrongpass"}' \
  > /dev/null 2>&1
END=$(date +%s%N)
TIME2=$(echo "scale=3; ($END - $START) / 1000000000" | bc)
echo "Time: ${TIME2}s"

# Calculate difference
DIFF=$(echo "scale=3; $TIME2 - $TIME1" | bc | sed 's/-//')

echo ""
echo "📊 Results:"
echo "  Non-existent user: ${TIME1}s"
echo "  Existing user:     ${TIME2}s"
echo "  Difference:        ${DIFF}s"

# Check if timing difference is acceptable (<100ms)
if (( $(echo "$DIFF < 0.1" | bc -l) )); then
  echo "✅ PASS: Timing difference <100ms (timing attack protected)"
else
  echo "❌ FAIL: Timing difference >${DIFF}s (timing attack possible)"
  exit 1
fi
```

**Usage:**
```bash
chmod +x scripts/test-timing-attack.sh
npm run dev  # Start server in another terminal
./scripts/test-timing-attack.sh
```

---

## Appendix C: Rate Limit Test Script

**Manual Rate Limit Verification:**

```bash
#!/bin/bash
# scripts/test-rate-limit.sh

set -e

echo "🚦 Testing rate limiting..."

URL="http://localhost:3000/api/auth/callback/credentials"
EMAIL="lab1@pgtestinglab.com"
WRONG_PASS="wrongpassword"

echo "Sending 6 failed login attempts..."

for i in {1..6}; do
  echo "Attempt $i..."
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$URL" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$WRONG_PASS\"}")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  echo "  HTTP $HTTP_CODE: $BODY"

  if [ "$HTTP_CODE" == "429" ]; then
    echo "✅ PASS: Rate limit triggered after $i attempts"
    echo "Response body: $BODY"
    exit 0
  fi

  sleep 1
done

echo "❌ FAIL: No rate limit after 6 attempts"
exit 1
```

**Usage:**
```bash
chmod +x scripts/test-rate-limit.sh
npm run dev  # Start server with Redis configured
./scripts/test-rate-limit.sh
```

---

## Decision

**APPROVED:** Adopt technical debt branch security implementation with field rename to `hashedPassword`.

**Next Steps:**
1. @developer: Execute field rename in branch (Appendix A script)
2. @quality-reviewer: Verify 492 tests pass after rename
3. @developer: Cherry-pick security commits to main (Section 4)
4. @security-auth: Manual testing (timing attack, rate limit - Appendices B & C)
5. @architect: Merge to main, deploy to production

**Estimated Completion:** 2025-12-20 (4 weeks from approval)

---

**Last Updated:** 2025-11-30
**Status:** Pending Review
**Reviewers:** @security-auth, @quality-reviewer, @developer
