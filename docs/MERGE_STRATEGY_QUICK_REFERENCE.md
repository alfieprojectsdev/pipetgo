# Password Auth Merge - Quick Reference

**Full Details:** `docs/ADR_PASSWORD_AUTH_MERGE_STRATEGY.md`

**Last Updated:** 2025-11-30

---

## Executive Summary

**Decision:** Adopt technical debt branch security, rename `passwordHash` → `hashedPassword` before merge.

**Winner:** Technical debt branch (timing attack protection + rate limiting)

**Risk:** Medium (field rename required, careful cherry-pick)

**Timeline:** 4 weeks

---

## Critical Actions

### 1. Branch Preparation (Do FIRST)

```bash
# Checkout branch
git checkout claude/code-review-technical-debt-01CRYQpqox1EwsjNs5UMHuic

# CRITICAL: Rename passwordHash → hashedPassword in:
# - prisma/schema.prisma (line 67)
# - src/lib/auth.ts (3 occurrences)

# Verify
npm run type-check  # Must pass
npm run test:run    # Must show 492 passing
```

### 2. Security Merge

```bash
# Switch to main
git checkout main
git checkout -b feat/password-auth-security-merge

# Cherry-pick (AFTER branch field rename)
git cherry-pick dd5c4e3  # Password auth
git cherry-pick 800242f  # Rate limiting

# Install dependencies
npm install

# Verify
npm run test:run    # Must show 492 passing
npm run type-check  # Must pass
```

### 3. UI Merge (Optional, After Security)

```bash
# On main (after security merged)
git cherry-pick 2a825d4  # TIER 1 & 2 UI
git cherry-pick e0484d0  # TIER 3 UI

# Verify
npm run test:run    # 442+ tests passing
```

---

## Field Name Changes

### Schema Change

```diff
model User {
  id            String    @id
  email         String    @unique
- passwordHash  String?   // ❌ Branch version
+ hashedPassword String?  // ✅ Main version
  role          UserRole  @default(CLIENT)
}
```

### Code Changes (src/lib/auth.ts)

```diff
const user = await prisma.user.findUnique({
  select: {
-   passwordHash: true
+   hashedPassword: true
  }
})

- if (!user.passwordHash) {
+ if (!user.hashedPassword) {
    return null
  }

- await verifyPassword(password, user.passwordHash)
+ await verifyPassword(password, user.hashedPassword)
```

---

## Security Improvements

| Feature | Main | Branch |
|---------|------|--------|
| **Timing attack protection** | ❌ | ✅ |
| **Rate limiting** | ❌ | ✅ |
| **Password module** | ❌ | ✅ |
| **Test coverage** | 378 | 492 |
| **Security score** | 6.5/10 | 9.0/10 |

---

## Environment Variables (New)

```env
# Production only (Upstash Redis)
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxx"

# Development: Leave empty (rate limiting disabled)
```

---

## Verification Checklist

**Before Merge:**
- [ ] Field renamed in branch (passwordHash → hashedPassword)
- [ ] Branch tests pass (492 tests)
- [ ] TypeScript check passes (0 errors)

**After Merge:**
- [ ] Main tests pass (492 tests)
- [ ] TypeScript check passes (0 errors)
- [ ] Manual login works (4 lab accounts)
- [ ] Rate limiting triggers (6 failed attempts → 429)
- [ ] Timing attack protected (response times constant)

**Production:**
- [ ] Upstash Redis created
- [ ] Environment variables set in Vercel
- [ ] Rate limiting active (test 429 response)
- [ ] CEO demo successful

---

## Rollback Procedure (Emergency)

```bash
# If merge breaks production
git checkout main
git log --oneline -5  # Find commit before merge
git revert <merge-commit-hash>
git push origin main

# Document what broke
# Fix in feature branch
# Re-merge after fix verified
```

---

## Files to Merge

### New Files (Direct Copy)
- `src/lib/password.ts` - Password utilities
- `src/lib/rate-limit.ts` - Rate limiting
- `tests/lib/password.test.ts` - Password tests (44)
- `tests/lib/rate-limit.test.ts` - Rate limit tests (43)
- `tests/api/auth/nextauth-ratelimit.test.ts` - Login rate limit tests (21)

### Modified Files (Careful Merge)
- `src/lib/auth.ts` - Add timing protection, use verifyPassword()
- `src/app/api/auth/[...nextauth]/route.ts` - Add rate limiting
- `package.json` - Add Upstash dependencies

### Files to Keep from Main (DO NOT TOUCH)
- `prisma/schema.prisma` - Main's hashedPassword field
- `prisma/seed.ts` - Main's 4 lab accounts
- All UI files (not affected by password auth)

---

## Key Decisions

1. **Field Name:** `hashedPassword` (main's convention)
2. **Merge Method:** Cherry-pick (not direct merge)
3. **Merge Order:** Security first, UI second
4. **Rate Limiting:** Fail-open (Redis optional)
5. **Timeline:** 4 weeks (branch prep → security → UI → production)

---

## Common Mistakes to Avoid

❌ **Merging without renaming field first** → TypeScript errors, broken tests

❌ **Modifying main's seed.ts** → Loses 4 lab accounts with passwords

❌ **Direct merge instead of cherry-pick** → Brings in all branch changes

❌ **Deploying without Redis configured** → Rate limiting disabled (but works)

❌ **Forgetting to run tests after cherry-pick** → Broken code merged

---

## Success Metrics

- ✅ 492 tests passing (up from 378)
- ✅ Security score 9.0/10 (up from 6.5)
- ✅ Zero CVSS vulnerabilities
- ✅ CEO demo successful (lab admin login)

---

## Quick Commands

```bash
# Field rename (branch)
sed -i 's/passwordHash/hashedPassword/g' prisma/schema.prisma src/lib/auth.ts

# Cherry-pick security
git cherry-pick dd5c4e3 800242f

# Verify merge
npm run type-check && npm run test:run && npm run build

# Test rate limiting
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"lab1@pgtestinglab.com","password":"wrong"}' \
  --repeat 6
```

---

## Help

**Questions?** Read full ADR: `docs/ADR_PASSWORD_AUTH_MERGE_STRATEGY.md`

**Issues?** Check Appendices B & C for testing scripts

**Emergency?** See Section 6 "Risk Assessment" and rollback procedure
