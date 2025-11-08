# Web Claude Instructions - PipetGo

**Created:** 2025-11-08
**For Instance:** pipetgo Web Claude or CLI Claude
**Priority:** HIGH (Security + Analytics)
**Source:** Cross-project lessons from Washboard

---

## 🎯 Mission

Apply security patterns, add analytics, and prevent common vulnerabilities based on lessons learned from Washboard production implementation.

---

## ⚠️ CRITICAL: Security Patterns

### 1. Check for user_id from Client (P0 - CRITICAL)

**Search for this vulnerability (using ripgrep - faster):**
```bash
rg "req\.body\.user_id"
rg "userId.*req\.body"
rg "user_id.*req\.body"

# ripgrep automatically:
# - Skips node_modules/, .git/, .next/
# - Shows colored output
# - Searches recursively
# - Is 5-10x faster than grep
```

**The Problem:**
```typescript
// ❌ CRITICAL VULNERABILITY
const { user_id, ... } = req.body;  // Client can spoof ANY user
await db.order.create({ data: { user_id, ... }});
// Attacker can create orders as any user!
```

**The Fix:**
```typescript
// ✅ SECURE
const user_id = req.user.userId;  // From authenticated session
const { ... } = req.body;  // user_id NOT from client
await db.order.create({ data: { user_id, ... }});
```

**Where to Check in PipetGo:**
- Quote request API (`POST /api/quotes/request`)
- Order creation API (`POST /api/orders/create`)
- Any endpoint that creates/modifies user data

**Action:** Audit ALL API endpoints that write to database.

---

### 2. Add Rate Limiting to Auth Endpoints

```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 5,                     // 5 attempts
  message: 'Too many login attempts'
});

app.post('/api/auth/login', loginLimiter, loginHandler);
```

**Where to Add:**
- `/api/auth/login`
- `/api/auth/signup`
- `/api/auth/reset-password` (if exists)

---

### 3. SQL Injection Check

**Search for vulnerabilities (using ripgrep):**
```bash
rg "\`SELECT.*\$\{" --type ts --type js
rg "query.*\$\{" --type ts --type js

# --type ts --type js limits to TypeScript/JavaScript files
```

**All queries must be parameterized:**
```typescript
// ❌ VULNERABLE
const query = `SELECT * FROM labs WHERE name = '${labName}'`;

// ✅ SECURE
const query = 'SELECT * FROM labs WHERE name = $1';
const result = await db.query(query, [labName]);
```

---

## 📊 Add GoatCounter Analytics

### Level 1: Pageviews (2 minutes - DO THIS NOW)

**Add to `src/app/layout.tsx`:**
```typescript
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        {process.env.NODE_ENV === 'production' && (
          <Script
            data-goatcounter="https://ithinkandicode.goatcounter.com/count"
            src="https://gc.zgo.at/count.js"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  )
}
```

---

### Level 2: Event Tracking (30 minutes - RECOMMENDED)

**Create `src/lib/analytics.ts`:**
```typescript
export function trackEvent(eventName: string) {
  if (typeof window !== 'undefined' && window.goatcounter) {
    window.goatcounter.count({
      path: `/event/${eventName}`,
      title: eventName,
      event: true
    });
  }
}
```

**Track these events:**
```typescript
// Quote workflow
trackEvent('quote-requested');       // When customer requests quote
trackEvent('quote-provided');        // When lab provides quote
trackEvent('quote-approved');        // When customer approves
trackEvent('order-created');         // When order created

// User actions
trackEvent('signup-completed');
trackEvent('lab-search-used');
trackEvent('service-filter-applied');
```

**Privacy rule:** Only track anonymous usage patterns. NO personal data (names, emails, prices).

---

## 🔧 Database Optimization

### Check Index Column Order

**Pattern:** Most restrictive column FIRST in multi-column indexes

**Example:**
```sql
-- ❌ WRONG - Inefficient
CREATE INDEX idx_orders_service_lab ON orders(service_id, lab_id);

-- Query: WHERE lab_id = 123 AND service_id = 456
-- Index scans all service_ids across all labs first

-- ✅ CORRECT - Efficient
CREATE INDEX idx_orders_lab_service ON orders(lab_id, service_id);

-- Query filters by lab_id first (narrower), then service_id
```

**Action:** Review existing indexes in Prisma schema or database.

---

## ✅ Acceptance Criteria

**Security (CRITICAL):**
- [ ] NO user_id accepted from req.body in ANY endpoint
- [ ] Rate limiting on /api/auth/* endpoints
- [ ] 100% parameterized SQL queries (no string concatenation)
- [ ] Session regeneration on login (if using sessions)
- [ ] Secure cookie settings (httpOnly, secure, sameSite)

**Analytics (QUICK WIN):**
- [ ] GoatCounter Level 1 added (pageviews)
- [ ] Production-only loading (NODE_ENV check)
- [ ] Level 2 event tracking (optional but recommended)

**Database (PERFORMANCE):**
- [ ] Multi-column indexes reviewed for column order
- [ ] Query performance tested with EXPLAIN ANALYZE

---

## 📚 Reference

**Full patterns:** `/home/ltpt420/repos/claude-config/coordination/CROSS_PROJECT_LESSONS_LEARNED.md`

**Important:** These are TEMPLATES to adapt, not recipes to copy blindly. Understand WHY each pattern exists, then adapt to PipetGo's specific use case.

---

## 🚀 Quick Start

**High-Impact, Low-Effort (30 minutes):**
1. Add GoatCounter Level 1 (2 min)
2. Search for req.body.user_id vulnerabilities (10 min)
3. Fix any found vulnerabilities (15 min)
4. Add rate limiting to auth endpoints (3 min)

**Medium-Effort (2-3 hours):**
5. Full SQL injection audit
6. GoatCounter Level 2 event tracking
7. Database index review

---

**Estimated Total:** 30 min (quick wins) to 3 hours (comprehensive)

---

*Auto-synced from `/home/ltpt420/repos/claude-config/coordination/handoffs/pipetgo.md`*
*Last synced: 2025-11-08*
