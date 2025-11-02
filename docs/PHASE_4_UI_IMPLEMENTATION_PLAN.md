# Phase 4: UI Implementation Plan

**Date Created:** 2025-11-01
**Status:** Ready for Implementation
**Estimated Duration:** 5 hours (3 sessions)
**Current Alignment:** 85% → Expected: 95%

---

## 🎯 Overview

**Goal:** Build complete UI for quotation-first workflow, making the system fully operational for end users.

**Dependencies:** ✅ Phase 3 complete (API endpoints functional, 217 tests passing)

**Deliverables:**
- Updated service catalog with pricing mode indicators
- HYBRID mode order creation UI
- Lab admin quote provision form
- Client quote approval interface
- Enhanced status badges for quote workflow

---

## 📋 Session Breakdown

### **Session 1: Service Catalog & Order Creation (2 hours)**

**Tasks:**
1. Update service catalog with pricing mode badges (45 min)
2. Update order creation page for HYBRID mode (1h 15m)

**Expected Completion:** All pricing modes visually clear to users

---

### **Session 2: Lab Admin Quote Form (1.5 hours)**

**Tasks:**
1. Create QuoteForm component (1h 30m)

**Expected Completion:** Lab admins can provide quotes via UI

---

### **Session 3: Client Approval & Status Badges (1.5 hours)**

**Tasks:**
1. Create QuoteApprovalCard component (1 hour)
2. Add quote status badge variants (30 min)

**Expected Completion:** Clients can approve/reject quotes, all statuses visible

---

## 🎨 UX Decisions - APPROVED DEFAULTS

### 1. Pricing Mode Badge Colors ✅

**Approved Design:**
- **QUOTE_REQUIRED:** Blue (info variant)
  - Rationale: Professional, indicates "information needed"
- **FIXED:** Green (success variant)
  - Rationale: Instant booking = success/ready state
- **HYBRID:** Purple (purple variant)
  - Rationale: Unique color, indicates flexibility/options

**Implementation:**
```tsx
function getPricingModeVariant(mode: string) {
  const variants = {
    'QUOTE_REQUIRED': 'info',     // Blue
    'FIXED': 'success',            // Green
    'HYBRID': 'purple'             // Purple
  }
  return variants[mode] || 'default'
}
```

---

### 2. HYBRID Mode Default Behavior ✅

**Approved Design:** Option A - Checkbox with default to instant booking

**UI:**
```tsx
<div className="flex items-start space-x-2">
  <input
    type="checkbox"
    id="requestCustomQuote"
    checked={requestCustomQuote}
    onChange={(e) => setRequestCustomQuote(e.target.checked)}
  />
  <label htmlFor="requestCustomQuote" className="text-sm">
    Request custom quote instead of reference price ({formatCurrency(service.pricePerUnit)})
  </label>
</div>

{requestCustomQuote ? (
  <Alert variant="info">
    You'll submit an RFQ and receive a custom quote from the lab.
  </Alert>
) : (
  <Alert variant="success">
    You'll book at the reference price: {formatCurrency(service.pricePerUnit)}
  </Alert>
)}

<Button type="submit">
  {requestCustomQuote ? 'Submit RFQ' : `Book Service - ${formatCurrency(service.pricePerUnit)}`}
</Button>
```

**Rationale:**
- Simpler UX (one decision point)
- Default to instant booking (faster for users)
- Clear visual feedback with Alert components
- Single submit button adapts to choice

---

### 3. Quote Approval Confirmation ✅

**Approved Design:** Simple browser `confirm()` dialog

**Implementation:**
```tsx
const handleApprove = async () => {
  if (!confirm('Approve this quote and proceed with testing?')) return

  // Submit approval
}
```

**Rationale:**
- Faster to implement (no modal component needed)
- Native browser UI (familiar to users)
- Prevents accidental clicks
- Can upgrade to custom modal in Phase 5 if needed

---

### 4. Quote Rejection Reasons - Lab Admin Visibility ✅

**Approved Design:** YES - Show rejection reasons to lab admins

**Implementation:**
- `Order` model already has `quoteRejectedReason` field
- Lab dashboard will display rejection reason for QUOTE_REJECTED orders

**Display in Lab Dashboard:**
```tsx
{order.status === 'QUOTE_REJECTED' && (
  <Alert variant="warning" className="mt-2">
    <p className="font-medium">Quote Rejected by Client</p>
    <p className="text-sm mt-1">Reason: {order.quoteRejectedReason}</p>
    <p className="text-xs text-gray-600 mt-2">
      Rejected on {formatDate(order.quoteRejectedAt)}
    </p>
  </Alert>
)}
```

**Rationale:**
- **Business Intelligence:** Labs learn market expectations
- **Service Improvement:** Identify pricing issues
- **Relationship Building:** Opportunity for labs to adjust offers
- **Transparency:** Professional B2B practice

---

### 5. Custom Quote Request Button (HYBRID Mode) ✅

**Approved Design:** Option A - Button in client dashboard order details

**Placement:**
```tsx
// In client order card (status: PENDING, pricingMode: HYBRID)
<Card>
  <CardHeader>
    <CardTitle>Order #{order.id.substring(0, 8)}</CardTitle>
    <Badge variant="warning">Pending</Badge>
  </CardHeader>
  <CardContent>
    <p>Current Price: {formatCurrency(order.quotedPrice)}</p>
    <p className="text-sm text-gray-600">
      Booked at reference price for {order.service.name}
    </p>

    {/* NEW: Request custom quote button */}
    <Button
      variant="outline"
      size="sm"
      onClick={() => handleRequestCustomQuote(order.id)}
      className="mt-3"
    >
      Request Custom Quote Instead
    </Button>
  </CardContent>
</Card>
```

**Flow:**
1. Client clicks "Request Custom Quote Instead"
2. Modal/confirmation: "Are you sure? This will reset your order to quote status."
3. Call `POST /api/orders/[id]/request-custom-quote` with reason
4. Order transitions: PENDING → QUOTE_REQUESTED
5. Lab admin sees updated RFQ in dashboard

**Rationale:**
- Discoverable (button visible in order details)
- Contextual (only for HYBRID + PENDING orders)
- Clear action (button label explains intent)
- Simpler than dedicated page

---

## 📝 Implementation Details

### Task 1: Service Catalog Updates (45 min)

**File:** `src/app/page.tsx`

**Changes:**
1. Update `LabService` interface:
```tsx
interface LabService {
  id: string
  name: string
  description: string
  category: string
  pricingMode: 'QUOTE_REQUIRED' | 'FIXED' | 'HYBRID'  // NEW
  pricePerUnit: number | null  // Can be null for QUOTE_REQUIRED
  turnaroundDays: number
  lab: {
    name: string
    location: any
  }
}
```

2. Add pricing mode badge to service cards
3. Update pricing display logic
4. Add helper functions (`getPricingModeVariant`, `getPricingModeLabel`)

**Visual Examples:**

**QUOTE_REQUIRED Service:**
```
┌────────────────────────────────────┐
│ Fatty Acid Analysis  [Quote Required] │ <- Blue badge
│                                    │
│ Comprehensive fatty acid profiling│
│ for food samples.                  │
│                                    │
│ ℹ️ Custom quote required          │
│    Submit RFQ to get pricing      │
│                                    │
│ [Request Quote]                    │
└────────────────────────────────────┘
```

**FIXED Service:**
```
┌────────────────────────────────────┐
│ pH Testing          [Fixed Rate]   │ <- Green badge
│                                    │
│ Standard pH measurement for        │
│ liquid samples.                    │
│                                    │
│ ₱500.00                           │ <- Large, bold
│                                    │
│ [Book Service]                     │
└────────────────────────────────────┘
```

**HYBRID Service:**
```
┌────────────────────────────────────┐
│ Gas Chromatography [Flexible Pricing] │ <- Purple badge
│                                    │
│ GC analysis with custom options.   │
│                                    │
│ From ₱2,000 or request custom quote│
│                                    │
│ [View Options]                     │
└────────────────────────────────────┘
```

---

### Task 2: Order Creation Page Updates (1h 15m)

**File:** `src/app/order/[serviceId]/page.tsx`

**Changes:**
1. Fetch service with `pricingMode` field
2. Add `requestCustomQuote` state for HYBRID services
3. Conditional UI based on pricing mode
4. Update form submission payload

**State Management:**
```tsx
const [requestCustomQuote, setRequestCustomQuote] = useState(false)
const [service, setService] = useState<LabService | null>(null)
```

**Conditional Rendering:**
```tsx
{service.pricingMode === 'QUOTE_REQUIRED' && (
  <Alert variant="info">
    This service requires a custom quote. Submit your requirements below,
    and the lab will provide pricing within 24-48 hours.
  </Alert>
)}

{service.pricingMode === 'FIXED' && (
  <div className="bg-green-50 p-4 rounded">
    <p className="font-medium">Fixed Rate Service</p>
    <p className="text-2xl font-bold text-green-600">
      {formatCurrency(service.pricePerUnit)}
    </p>
  </div>
)}

{service.pricingMode === 'HYBRID' && (
  <div className="space-y-3">
    <div className="flex items-start space-x-2">
      <input
        type="checkbox"
        id="requestCustomQuote"
        checked={requestCustomQuote}
        onChange={(e) => setRequestCustomQuote(e.target.checked)}
      />
      <label htmlFor="requestCustomQuote">
        Request custom quote instead of reference price ({formatCurrency(service.pricePerUnit)})
      </label>
    </div>

    {requestCustomQuote ? (
      <Alert variant="info">
        You'll submit an RFQ and receive a custom quote from the lab.
      </Alert>
    ) : (
      <Alert variant="success">
        You'll book at the reference price: {formatCurrency(service.pricePerUnit)}
      </Alert>
    )}
  </div>
)}
```

**Form Submission:**
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  const payload = {
    serviceId,
    sampleDescription,
    specialInstructions,
    clientDetails,
    // Only include for HYBRID services
    ...(service.pricingMode === 'HYBRID' && { requestCustomQuote })
  }

  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (response.ok) {
    const { order } = await response.json()
    router.push('/dashboard/client')
  } else {
    // Handle error
  }
}
```

---

### Task 3: Lab Admin Quote Form (1h 30m)

**New File:** `src/app/dashboard/lab/orders/[id]/QuoteForm.tsx`

**Component Features:**
- ✅ Display order/sample details
- ✅ Quoted price input (₱1 - ₱1,000,000)
- ✅ Quote notes textarea (optional, 500 char max)
- ✅ Estimated turnaround input (optional, 1-365 days)
- ✅ Form validation
- ✅ API integration with error handling
- ✅ Character counter for textarea
- ✅ Loading states

**Validation:**
- Price: Required, positive, min ₱1, max ₱1,000,000
- Notes: Optional, max 500 characters
- Turnaround: Optional, integer, 1-365 days

**Error Handling:**
```tsx
const [error, setError] = useState<string | null>(null)

// Display error
{error && <Alert variant="error">{error}</Alert>}

// Set error from API
if (!response.ok) {
  const data = await response.json()
  setError(data.error || 'Failed to submit quote')
}
```

**Integration in Lab Dashboard:**

Update `src/app/dashboard/lab/page.tsx`:

```tsx
// Add "Provide Quote" button for QUOTE_REQUESTED orders
{order.status === 'QUOTE_REQUESTED' && (
  <Button
    size="sm"
    onClick={() => router.push(`/dashboard/lab/orders/${order.id}`)}
  >
    Provide Quote
  </Button>
)}
```

Create route: `src/app/dashboard/lab/orders/[id]/page.tsx`:

```tsx
'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { QuoteForm } from './QuoteForm'

export default function ProvideQuotePage() {
  const params = useParams()
  const [order, setOrder] = useState(null)

  useEffect(() => {
    fetchOrder()
  }, [])

  const fetchOrder = async () => {
    const response = await fetch(`/api/orders/${params.id}`)
    if (response.ok) {
      const data = await response.json()
      setOrder(data)
    }
  }

  if (!order) return <div>Loading...</div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <QuoteForm orderId={params.id as string} order={order} />
    </div>
  )
}
```

---

### Task 4: Client Quote Approval Card (1 hour)

**New File:** `src/app/dashboard/client/orders/[id]/QuoteApprovalCard.tsx`

**Component Features:**
- ✅ Display quote details (price, date, notes, turnaround)
- ✅ Approve button with confirmation
- ✅ Reject flow with reason textarea
- ✅ Validation (rejection reason min 10 chars)
- ✅ API integration
- ✅ Character counter
- ✅ Error handling
- ✅ Loading states

**Two-Step Rejection Flow:**
1. Click "Reject Quote" → Shows textarea
2. Enter reason (min 10 chars) → Click "Confirm Rejection"
3. Can cancel back to approve/reject buttons

**Integration in Client Dashboard:**

Update `src/app/dashboard/client/page.tsx`:

```tsx
// Import component
import { QuoteApprovalCard } from './orders/[id]/QuoteApprovalCard'

// Render for QUOTE_PROVIDED orders
{order.status === 'QUOTE_PROVIDED' && (
  <QuoteApprovalCard
    orderId={order.id}
    quote={{
      quotedPrice: order.quotedPrice,
      quotedAt: order.quotedAt,
      quoteNotes: order.quoteNotes,
      estimatedTurnaroundDays: order.estimatedTurnaroundDays
    }}
    service={order.service}
  />
)}
```

---

### Task 5: Quote Status Badges (30 min)

**File Updates:**

1. **`src/components/ui/badge.tsx`** - Add variants:
```tsx
const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        // Existing variants
        default: 'bg-gray-100 text-gray-800 border-gray-200',
        success: 'bg-green-100 text-green-800 border-green-200',
        warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        error: 'bg-red-100 text-red-800 border-red-200',
        info: 'bg-blue-100 text-blue-800 border-blue-200',
        purple: 'bg-purple-100 text-purple-800 border-purple-200',

        // NEW: Quote-specific statuses
        'quote-requested': 'bg-blue-100 text-blue-800 border-blue-200',
        'quote-provided': 'bg-purple-100 text-purple-800 border-purple-200',
        'quote-rejected': 'bg-orange-100 text-orange-800 border-orange-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)
```

2. **`src/lib/order-status.ts`** - NEW helper file:
```tsx
export function getOrderStatusBadge(status: string) {
  const statusConfig = {
    'QUOTE_REQUESTED': {
      variant: 'quote-requested' as const,
      label: 'Quote Requested',
      description: 'Awaiting lab quote'
    },
    'QUOTE_PROVIDED': {
      variant: 'quote-provided' as const,
      label: 'Quote Provided',
      description: 'Awaiting client approval'
    },
    'QUOTE_REJECTED': {
      variant: 'quote-rejected' as const,
      label: 'Quote Rejected',
      description: 'Client declined quote'
    },
    'PENDING': {
      variant: 'warning' as const,
      label: 'Pending',
      description: 'Awaiting lab acknowledgment'
    },
    'ACKNOWLEDGED': {
      variant: 'info' as const,
      label: 'Acknowledged',
      description: 'Lab confirmed order'
    },
    'IN_PROGRESS': {
      variant: 'purple' as const,
      label: 'In Progress',
      description: 'Testing underway'
    },
    'COMPLETED': {
      variant: 'success' as const,
      label: 'Completed',
      description: 'Results delivered'
    },
    'CANCELLED': {
      variant: 'error' as const,
      label: 'Cancelled',
      description: 'Order cancelled'
    }
  }

  return statusConfig[status as keyof typeof statusConfig] || {
    variant: 'default' as const,
    label: status,
    description: ''
  }
}
```

3. **Update all dashboards** to use helper:
```tsx
import { getOrderStatusBadge } from '@/lib/order-status'

// Replace old badge logic
const statusBadge = getOrderStatusBadge(order.status)
<Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
```

---

## 🎯 Acceptance Criteria

**Must Pass Before Phase 4 Complete:**

### Functional
- [ ] Service catalog shows pricing mode badges (all 3 types)
- [ ] QUOTE_REQUIRED services show "Request Quote" flow
- [ ] FIXED services show instant booking with price
- [ ] HYBRID services show checkbox for custom quote
- [ ] Lab admin can submit quotes via form
- [ ] Client can approve quotes
- [ ] Client can reject quotes with reason (min 10 chars)
- [ ] All quote statuses display correct badges
- [ ] HYBRID orders can request custom quote after instant booking

### Visual/UX
- [ ] Pricing mode badges use correct colors (Blue/Green/Purple)
- [ ] Quote approval card highlights action needed
- [ ] Rejection reason textarea shows character count
- [ ] All forms show loading states during submission
- [ ] Error messages display clearly
- [ ] Responsive design works on mobile

### Technical
- [ ] All API calls use existing Phase 3 endpoints
- [ ] Form validation matches Zod schemas from Phase 2
- [ ] TypeScript compilation clean (zero errors)
- [ ] No console errors in browser
- [ ] All existing 217 tests still pass

---

## 📊 Expected Metrics After Phase 4

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Alignment** | 85% | 95% | +10% |
| **UI Components** | ~8 | ~10 | +2 new |
| **User Workflows** | 2 (instant book, view orders) | 5 (instant, RFQ, quote, approve, reject) | +3 |
| **Pages Updated** | - | 5 | Lab/Client dashboards, catalog, order form, quote pages |
| **CEO Directive** | Backend only | Full end-to-end | ✅ COMPLETE |

---

## 🚀 Ready for Implementation

**All UX decisions finalized:** ✅
**Default choices approved:** ✅
**Time budget confirmed:** ✅ 5 hours (3 sessions)
**Dependencies met:** ✅ Phase 3 APIs functional

**Next Step:** Pipetgo instance begins Phase 4 Session 1 when authorized.

---

## 📝 Notes for Pipetgo Instance

**Key Reminders:**
1. Use existing Badge component - just add new variants
2. Import validation schemas from Phase 2 (`src/lib/validations/quote.ts`)
3. All API endpoints already tested (Phase 3) - just integrate
4. Follow existing dashboard patterns (Card + Button layouts)
5. Use `formatCurrency()` and `formatDate()` from `src/lib/utils`
6. Test with seed data (10 services with different pricing modes)

**Testing Strategy:**
- Test each session's work before moving to next
- Use browser dev tools (not just TypeScript)
- Check mobile responsiveness
- Verify all 3 pricing modes work
- Test error states (invalid inputs)

**Common Pitfalls to Avoid:**
- ❌ Don't create new API endpoints (Phase 3 has everything)
- ❌ Don't skip form validation (use Zod schemas)
- ❌ Don't forget loading states (users need feedback)
- ❌ Don't hardcode status strings (use helper functions)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-01 14:45
**Approved By:** Root Instance (claude-config)
