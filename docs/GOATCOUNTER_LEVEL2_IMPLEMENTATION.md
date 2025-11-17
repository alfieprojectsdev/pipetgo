# GoatCounter Level 2 Event Tracking - Implementation Guide

**Created:** 2025-11-08
**Status:** Ready for Implementation
**Effort:** ~30 minutes
**Priority:** RECOMMENDED (provides valuable usage insights)

---

## ✅ Completed

- [x] Analytics utility created: `src/lib/analytics.ts`
- [x] Privacy-first design (no personal data tracking)
- [x] TypeScript type safety
- [x] Predefined event functions

---

## 📍 Where to Add Tracking Calls

### 1. Quote Requested Event

**File:** `src/app/api/orders/route.ts`
**Location:** Line ~94 (after order creation succeeds)
**Code to add:**
```typescript
import { analytics } from '@/lib/analytics'

// After successful order creation
const order = await prisma.order.create({ /* ... */ })

// Track quote request if applicable
if (initialStatus === 'QUOTE_REQUESTED') {
  analytics.quoteRequested()
}

return NextResponse.json(order, { status: 201 })
```

---

### 2. Quote Provided Event

**File:** `src/app/api/orders/[id]/quote/route.ts`
**Location:** Line ~117 (after successful quote provision)
**Code to add:**
```typescript
import { analytics } from '@/lib/analytics'

// After successful quote provision
const result = await prisma.$transaction(/* ... */)

analytics.quoteProvided()

return NextResponse.json(result, { status: 200 })
```

---

### 3. Quote Approved Event

**File:** `src/app/api/orders/[id]/approve-quote/route.ts`
**Location:** After successful quote approval
**Code to add:**
```typescript
import { analytics } from '@/lib/analytics'

// After successful quote approval
const updatedOrder = await prisma.$transaction(/* ... */)

analytics.quoteApproved()

return NextResponse.json(updatedOrder, { status: 200 })
```

---

### 4. Order Created Event

**File:** `src/app/api/orders/route.ts`
**Location:** Line ~102 (after order creation, before return)
**Code to add:**
```typescript
import { analytics } from '@/lib/analytics'

// After successful order creation
const order = await prisma.order.create({ /* ... */ })

// Track order creation with pricing mode
analytics.orderCreated(service.pricingMode)

return NextResponse.json(order, { status: 201 })
```

---

### 5. Signup Completed Event

**File:** `src/lib/auth.ts` (if signup flow exists)
**Location:** After successful user creation
**Code to add:**
```typescript
import { analytics } from '@/lib/analytics'

// After successful user creation
const user = await prisma.user.create({ /* ... */ })

analytics.signupCompleted(user.role === 'LAB_ADMIN' ? 'LAB_ADMIN' : 'CLIENT')
```

**NOTE:** Current implementation uses email-only auth. This event should be added when proper signup flow is implemented in Stage 2.

---

### 6. Lab Search Used Event (Future)

**File:** TBD (when lab search feature is implemented)
**Trigger:** When user submits lab search query
**Code to add:**
```typescript
import { analytics } from '@/lib/analytics'

// When search is executed
analytics.labSearchUsed()
```

---

### 7. Service Filter Applied Event (Future)

**File:** TBD (when service filtering is implemented)
**Trigger:** When user applies category filter
**Code to add:**
```typescript
import { analytics } from '@/lib/analytics'

// When filter is applied
analytics.serviceFilterApplied(selectedCategory)
```

---

## 🧪 Testing

### Manual Testing Checklist

After implementation:

1. **Enable Analytics Locally:**
   ```bash
   # .env.local
   NEXT_PUBLIC_GOATCOUNTER_URL="https://ithinkandicode.goatcounter.com/count"
   ```

2. **Test Each Event:**
   - [ ] Create order (QUOTE_REQUIRED mode) → Check `/event/quote-requested` in GoatCounter
   - [ ] Lab provides quote → Check `/event/quote-provided`
   - [ ] Client approves quote → Check `/event/quote-approved`
   - [ ] Create order (FIXED mode) → Check `/event/order-created?mode=FIXED`
   - [ ] Create order (HYBRID mode) → Check `/event/order-created?mode=HYBRID`

3. **Verify Privacy:**
   - [ ] NO personal data in event paths
   - [ ] NO user IDs, emails, or names in metadata
   - [ ] NO pricing information tracked

4. **Verify GoatCounter Dashboard:**
   - Events appear under "Paths" section
   - Events prefixed with `/event/`
   - Metadata appears as query parameters

---

## 🚀 Deployment

### Production Rollout

1. **Merge implementation**
2. **Deploy to production**
3. **Monitor GoatCounter dashboard** for 1 week
4. **Analyze patterns:**
   - Quote request vs instant booking ratio
   - Quote approval conversion rate
   - Most popular service categories

---

## 📊 Expected Insights

After 1 month of data:

- **Quote Funnel:** Request → Provided → Approved conversion rates
- **Pricing Mode Usage:** FIXED vs HYBRID vs QUOTE_REQUIRED distribution
- **User Behavior:** Client vs Lab Admin activity patterns
- **Feature Adoption:** Search and filter usage (when implemented)

---

## ⚠️ Privacy Compliance

**GDPR Compliance Verified:**
- ✅ No cookies used
- ✅ No personal identifiers tracked
- ✅ Anonymous usage patterns only
- ✅ No consent banner required

**Metadata Guidelines:**
- ✅ Service categories (anonymous)
- ✅ Pricing modes (anonymous)
- ✅ User roles (CLIENT/LAB_ADMIN, no user ID)
- ❌ NEVER: prices, names, emails, user IDs

---

## 📚 Reference

- **Utility Module:** `src/lib/analytics.ts`
- **ADR:** `docs/ADR_GOATCOUNTER_LEVEL1_ANALYTICS.md`
- **GoatCounter Docs:** https://www.goatcounter.com/help

---

**Estimated Implementation Time:** 30 minutes
**Priority:** RECOMMENDED (valuable product insights)
**Risk:** LOW (fail-safe design, no impact on core functionality)
