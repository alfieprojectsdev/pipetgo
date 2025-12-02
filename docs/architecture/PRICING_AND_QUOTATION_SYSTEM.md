# Pricing and Quotation System Architecture

**Last Updated:** 2025-12-01
**System Status:** Production (85% Aligned with B2B Model)

---

## Table of Contents

1. [Why NOT E-commerce](#why-not-e-commerce)
2. [Three Pricing Modes](#three-pricing-modes)
3. [Order Status State Machine](#order-status-state-machine)
4. [Quote Provision Workflow](#quote-provision-workflow)
5. [Quote Approval Workflow](#quote-approval-workflow)
6. [Custom Quote Request (HYBRID Mode)](#custom-quote-request-hybrid-mode)
7. [Database Schema Design](#database-schema-design)
8. [Mental Models](#mental-models)

---

## Why NOT E-commerce

### The Fundamental Problem

**E-commerce assumption:** Product has fixed price, customer adds to cart, instant checkout.

**Laboratory testing reality:**
- Sample complexity varies (coconut oil vs motor oil vs toxic waste)
- Volume matters (1 sample vs 100 samples ≠ 100x price)
- Turnaround negotiable (rush orders cost more)
- Accreditation requirements (food safety vs environmental testing)

**Example: "Fatty Acid Analysis" Service**

```
┌─────────────────────────────────────────────────────────────┐
│  E-commerce Model (WRONG for lab testing)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Service: Fatty Acid Analysis                              │
│  Price: ₱5,000 per sample  ← Fixed, ONE size fits all     │
│                                                             │
│  Client A: Simple coconut oil (5 fatty acids)              │
│  → Overpays ₱5,000 (should be ₱2,000)                     │
│                                                             │
│  Client B: Complex biodiesel (40 fatty acids)              │
│  → Underpays ₱5,000 (should be ₱15,000)                   │
│                                                             │
│  Result: Client A unhappy (too expensive)                  │
│          Client B happy (too cheap, lab loses money)       │
│          Lab goes bankrupt or raises prices               │
└─────────────────────────────────────────────────────────────┘
```

**RFQ Model (Correct):**

```
┌─────────────────────────────────────────────────────────────┐
│  Quotation-First Model (CORRECT for lab testing)           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Service: Fatty Acid Analysis                              │
│  Price: Requires Custom Quote                              │
│                                                             │
│  Client A submits RFQ:                                      │
│    "Coconut oil, 5 fatty acids (C8-C18), 1 sample"        │
│    Lab quotes: ₱2,500 (fair price for simple test)        │
│                                                             │
│  Client B submits RFQ:                                      │
│    "Biodiesel, full FAME profile (40 compounds), 10 samples"│
│    Lab quotes: ₱120,000 (fair price for complex batch)    │
│                                                             │
│  Result: Both clients get fair pricing                     │
│          Lab makes profit on complex tests                 │
│          Platform prevents leakage (no offline negotiation)│
└─────────────────────────────────────────────────────────────┘
```

---

### Business Model Alignment

**Alibaba RFQ Inspiration:**
```
Buyer: "I need 10,000 custom widgets, delivered in 30 days, ISO certified"
Suppliers: [Supplier A quotes $5/unit, Supplier B quotes $4.50/unit]
Buyer: [Selects Supplier B, approves quote]
Platform: [Facilitates transaction, takes commission]
```

**PipetGo Equivalent:**
```
Client: "I need heavy metal testing, 50 water samples, need results in 7 days"
Labs: [Lab A quotes ₱500/sample, Lab B quotes ₱450/sample]
Client: [Selects Lab B, approves quote]
Platform: [Facilitates testing, takes commission]
```

---

## Three Pricing Modes

### Decision Context

**Stage 1 Prototype (Binary):**
- Service either had fixed price OR required quote
- User feedback: "I want to show reference price but allow custom quotes for bulk"

**Stage 2 Implementation (Ternary):**
- Added HYBRID mode to support reference pricing + negotiation

---

### Mode 1: QUOTE_REQUIRED (Default, True B2B)

**Use Case:** Complex testing where pricing cannot be standardized.

**Characteristics:**
- Service has NO `pricePerUnit` in database (`pricePerUnit = null`)
- Order created with `status = QUOTE_REQUESTED`
- Order created with `quotedPrice = null`
- Lab MUST provide custom quote before client can approve

**Example Services:**
- Toxicology screening (depends on number of compounds)
- Microbial analysis (depends on organism types)
- Custom method development

**Client Experience:**
```
1. Client selects service "Advanced Toxicology Screen"
2. UI shows: "Price: Contact for Quote"
3. Client fills RFQ form (sample description, special requirements)
4. Submit → Order created with status QUOTE_REQUESTED
5. Wait for lab to provide quote
6. Receive quote notification → Review → Approve/Reject
```

**Database State:**
```sql
INSERT INTO orders (
  service_id,
  status,
  quoted_price,
  quoted_at
) VALUES (
  'service-toxicology',
  'QUOTE_REQUESTED',  -- No price yet
  NULL,               -- No price yet
  NULL                -- No quote timestamp yet
);
```

**Implementation:**
```typescript
// src/app/api/orders/route.ts (lines 52-56)
if (service.pricingMode === 'QUOTE_REQUIRED') {
  initialStatus = 'QUOTE_REQUESTED'
  quotedPrice = null
  quotedAt = null
}
```

---

### Mode 2: FIXED (Backward Compatibility, E-commerce)

**Use Case:** Commodity testing with standardized pricing.

**Characteristics:**
- Service has fixed `pricePerUnit` in database
- Order created with `status = PENDING` (skip quote workflow)
- Order created with `quotedPrice = pricePerUnit` (auto-populated)
- No lab admin intervention needed (instant booking)

**Example Services:**
- pH testing (single measurement, standard procedure)
- Moisture content (simple gravimetric method)
- Standard water quality parameters

**Client Experience:**
```
1. Client selects service "pH Testing"
2. UI shows: "Price: ₱500 per sample"
3. Client fills booking form (sample details)
4. Submit → Order created with status PENDING (instant booking)
5. Lab receives order notification → Acknowledge → Start testing
```

**Database State:**
```sql
INSERT INTO orders (
  service_id,
  status,
  quoted_price,
  quoted_at
) VALUES (
  'service-ph-testing',
  'PENDING',        -- Ready for lab to acknowledge (quote already "approved")
  500,              -- Auto-populated from service.pricePerUnit
  '2025-12-01'      -- Auto-populated with current timestamp
);
```

**Implementation:**
```typescript
// src/app/api/orders/route.ts (lines 58-62)
} else if (service.pricingMode === 'FIXED') {
  initialStatus = 'PENDING'
  quotedPrice = service.pricePerUnit ? Number(service.pricePerUnit) : null
  quotedAt = new Date()
}
```

---

### Mode 3: HYBRID (Best of Both Worlds)

**Use Case:** Services with reference pricing that benefit from volume discounts.

**Characteristics:**
- Service has `pricePerUnit` (reference price, shown as "Starting at ₱X")
- Client chooses: instant booking OR request custom quote
- If `requestCustomQuote = false` → PENDING (instant booking)
- If `requestCustomQuote = true` → QUOTE_REQUESTED (negotiation)

**Example Services:**
- Moisture content analysis (₱300/sample for 1-10, negotiate for 100+)
- Microbial plate count (₱800/sample standard, negotiate for rush orders)
- Heavy metal screening (₱1200/sample, negotiate for custom panel)

**Client Experience (Instant Booking):**
```
1. Client selects service "Moisture Content Analysis"
2. UI shows: "Starting at ₱300 per sample"
3. Client enters: 5 samples
4. UI shows: "Estimated Total: ₱1,500" + checkbox "Request custom quote for bulk discount"
5. Client leaves checkbox unchecked → Submit
6. Order created with status PENDING (instant booking at ₱300/sample)
```

**Client Experience (Custom Quote):**
```
1. Client selects service "Moisture Content Analysis"
2. UI shows: "Starting at ₱300 per sample"
3. Client enters: 100 samples
4. UI shows: "Estimated Total: ₱30,000" + checkbox "Request custom quote for bulk discount"
5. Client checks checkbox → Submit
6. Order created with status QUOTE_REQUESTED (awaiting lab's volume discount quote)
7. Lab provides quote: ₱20,000 (₱200/sample for 100+)
```

**Database State (Instant Booking):**
```sql
INSERT INTO orders (
  service_id,
  status,
  quoted_price,
  quoted_at
) VALUES (
  'service-moisture',
  'PENDING',        -- Instant booking
  1500,             -- 5 samples × ₱300
  '2025-12-01'
);
```

**Database State (Custom Quote Requested):**
```sql
INSERT INTO orders (
  service_id,
  status,
  quoted_price,
  quoted_at
) VALUES (
  'service-moisture',
  'QUOTE_REQUESTED',  -- Awaiting custom quote
  NULL,               -- Lab will provide volume discount price
  NULL
);
```

**Implementation:**
```typescript
// src/app/api/orders/route.ts (lines 64-76)
} else if (service.pricingMode === 'HYBRID') {
  if (validatedData.requestCustomQuote === true) {
    // Client requested custom quote
    initialStatus = 'QUOTE_REQUESTED'
    quotedPrice = null
    quotedAt = null
  } else {
    // Client accepted reference price (instant booking)
    initialStatus = 'PENDING'
    quotedPrice = service.pricePerUnit ? Number(service.pricePerUnit) : null
    quotedAt = new Date()
  }
}
```

---

### Pricing Mode Comparison Table

| Aspect | QUOTE_REQUIRED | FIXED | HYBRID |
|--------|----------------|-------|--------|
| **pricePerUnit in DB** | `null` | Required | Required (reference) |
| **Initial Status** | QUOTE_REQUESTED | PENDING | CLIENT chooses |
| **Initial quotedPrice** | `null` | Auto-populated | Conditional |
| **Lab Intervention** | Always required | Never required | Optional |
| **Client Experience** | Wait for quote | Instant booking | Client chooses |
| **Platform Leakage Risk** | Low (enforced negotiation) | None (instant) | Low (negotiation available) |
| **Example Services** | Toxicology, Custom Testing | pH, Moisture | Volume-sensitive tests |

---

## Order Status State Machine

### State Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                  Order Status State Machine                        │
└────────────────────────────────────────────────────────────────────┘

                   Order Created (CLIENT)
                           ↓
        ┌──────────────────┴──────────────────┐
        │                                     │
   FIXED/HYBRID                      QUOTE_REQUIRED/HYBRID
   (instant booking)                 (custom quote)
        │                                     │
        ↓                                     ↓
    PENDING ←─────────────────────── QUOTE_REQUESTED
        │                                     │
        │                           Lab provides quote
        │                                     │
        │                                     ↓
        │                            QUOTE_PROVIDED
        │                                     │
        │                          Client decision
        │                                     │
        │                    ┌────────────────┴───────────────┐
        │                    │                                │
        │               Approve                          Reject
        │                    │                                │
        │                    ↓                                ↓
        └──────────────▶ PENDING                    QUOTE_REJECTED
                            │
                Lab acknowledges
                            │
                            ↓
                      ACKNOWLEDGED
                            │
                  Testing begins
                            │
                            ↓
                      IN_PROGRESS
                            │
                Results uploaded
                            │
                            ↓
                       COMPLETED

   (Any status can transition to CANCELLED by client or admin)
```

---

### State Definitions

**QUOTE_REQUESTED** (Initial state for quote-required services)
- **Meaning:** Client submitted RFQ, awaiting lab admin's custom quote
- **Actor:** CLIENT (created order)
- **Next Valid States:** QUOTE_PROVIDED (lab provides quote), CANCELLED
- **Business Logic:** Lab admin must review RFQ details and provide `quotedPrice`

**QUOTE_PROVIDED** (Lab provided quote, awaiting client decision)
- **Meaning:** Lab admin provided custom quote, awaiting client approval/rejection
- **Actor:** LAB_ADMIN (provided quote)
- **Next Valid States:** PENDING (approved), QUOTE_REJECTED (rejected), CANCELLED
- **Business Logic:** Client has 7 days to approve/reject (configurable)

**QUOTE_REJECTED** (Client rejected lab's quote)
- **Meaning:** Client declined the quoted price
- **Actor:** CLIENT (rejected quote)
- **Next Valid States:** QUOTE_REQUESTED (re-negotiation), CANCELLED
- **Business Logic:** Lab can provide revised quote (price adjustment or explanation)

**PENDING** (Quote approved OR instant booking, awaiting lab acknowledgment)
- **Meaning:** Order financially approved, lab must acknowledge before starting work
- **Actor:** CLIENT (approved quote) OR SYSTEM (auto for FIXED mode)
- **Next Valid States:** ACKNOWLEDGED, CANCELLED
- **Business Logic:** Lab has 24 hours to acknowledge (SLA requirement)

**ACKNOWLEDGED** (Lab acknowledged order, preparing to start testing)
- **Meaning:** Lab confirmed order, gathering materials, scheduling testing
- **Actor:** LAB_ADMIN
- **Next Valid States:** IN_PROGRESS, CANCELLED
- **Business Logic:** Lab has 48 hours to start testing

**IN_PROGRESS** (Testing underway)
- **Meaning:** Samples received, testing in progress
- **Actor:** LAB_ADMIN
- **Next Valid States:** COMPLETED, CANCELLED
- **Business Logic:** Lab uploads progress updates (optional)

**COMPLETED** (Results delivered, order closed)
- **Meaning:** Testing finished, certified results uploaded
- **Actor:** LAB_ADMIN (uploaded results)
- **Next Valid States:** None (terminal state)
- **Business Logic:** Client downloads results, can request re-testing (new order)

**CANCELLED** (Order cancelled)
- **Meaning:** Order terminated before completion
- **Actor:** CLIENT, LAB_ADMIN, or ADMIN
- **Next Valid States:** None (terminal state)
- **Business Logic:** Cancellation reason required, refund logic applies

---

### State Transition Rules

**Rule 1: Atomic Transitions (Prevent Race Conditions)**

❌ **WRONG (Vulnerable to race condition):**
```typescript
const order = await prisma.order.findUnique({ where: { id } })

if (order.status !== 'QUOTE_REQUESTED') {
  throw new Error('Cannot quote order in this status')
}

// ⚠️ Race condition: Another admin could update status here

await prisma.order.update({
  where: { id },
  data: { status: 'QUOTE_PROVIDED', quotedPrice }
})
```

✅ **CORRECT (Atomic check-and-update):**
```typescript
// src/app/api/orders/[id]/quote/route.ts (lines 67-79)
const result = await prisma.order.updateMany({
  where: {
    id: params.id,
    status: 'QUOTE_REQUESTED'  // ✅ Only update if status is correct
  },
  data: {
    quotedPrice: validatedData.quotedPrice,
    quotedAt: new Date(),
    status: 'QUOTE_PROVIDED'
  }
})

if (result.count === 0) {
  // Update failed: status was not QUOTE_REQUESTED
  throw new Error('Order status changed during quote provision')
}
```

**Why This Matters:**
- Two lab admins submit quote simultaneously
- First admin's quote succeeds (updateMany count = 1)
- Second admin's quote fails (updateMany count = 0, status already QUOTE_PROVIDED)
- System returns 409 Conflict error to second admin

---

**Rule 2: One-Way Transitions (Mostly)**

**Forward-only transitions:**
```
QUOTE_REQUESTED → QUOTE_PROVIDED → PENDING → ACKNOWLEDGED → IN_PROGRESS → COMPLETED
```

**Allowed backward transition:**
```
QUOTE_REJECTED → QUOTE_REQUESTED (re-negotiation)
```

**Why no backward transitions elsewhere?**
- PENDING → QUOTE_PROVIDED: Quote already approved (client can cancel, not un-approve)
- IN_PROGRESS → ACKNOWLEDGED: Testing started (cannot un-start)
- COMPLETED → IN_PROGRESS: Results uploaded (immutable, can request new order)

---

**Rule 3: Status-Specific Field Requirements**

| Status | Required Fields | Optional Fields | Forbidden Fields |
|--------|----------------|-----------------|------------------|
| QUOTE_REQUESTED | `sampleDescription`, `clientDetails` | `specialInstructions` | `quotedPrice`, `quotedAt` |
| QUOTE_PROVIDED | `quotedPrice`, `quotedAt` | `quoteNotes`, `estimatedTurnaroundDays` | `quoteApprovedAt` |
| PENDING | `quotedPrice`, `quotedAt` | `quoteApprovedAt` (if from QUOTE_PROVIDED) | `quoteRejectedAt` |
| COMPLETED | `completedAt` | Attachment (results PDF) | - |

**Validation Example:**
```typescript
// Ensure quotedPrice is NOT null when status = PENDING
if (order.status === 'PENDING' && order.quotedPrice === null) {
  throw new Error('PENDING orders must have quotedPrice')
}
```

---

## Quote Provision Workflow

### Actors and Responsibilities

**Lab Admin Actions:**
1. Review RFQ details (sample description, special requirements, client contact info)
2. Calculate custom price (consider sample complexity, volume, turnaround time)
3. Provide quote with justification (quote notes)
4. Optionally provide estimated turnaround time

**System Actions:**
1. Validate quote input (price positive, within limits, notes character count)
2. Atomically update order status (QUOTE_REQUESTED → QUOTE_PROVIDED)
3. Record quote timestamp (`quotedAt`)
4. Trigger notification to client (future implementation)

---

### API Endpoint: POST /api/orders/[id]/quote

**Authorization:**
- **Role Required:** LAB_ADMIN
- **Ownership Check:** Lab must belong to authenticated user (`lab.ownerId = session.user.id`)

**Request Body:**
```typescript
{
  quotedPrice: 12000,                          // Required: Custom price (₱)
  quoteNotes: "Complex GC-MS analysis...",     // Optional: Justification
  estimatedTurnaroundDays: 7                   // Optional: Estimated completion time
}
```

**Validation (Zod Schema):**
```typescript
// src/lib/validations/quote.ts (lines 9-29)
const provideQuoteSchema = z.object({
  quotedPrice: z.number()
    .positive('Price must be positive')
    .min(1, 'Price must be at least ₱1')
    .max(1000000, 'Price cannot exceed ₱1,000,000'),

  quoteNotes: z.string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .transform(val => val?.trim()),

  estimatedTurnaroundDays: z.number()
    .int('Turnaround must be whole days')
    .positive('Turnaround must be positive')
    .max(365, 'Turnaround cannot exceed 365 days')
    .optional()
})
```

**Success Response (200):**
```json
{
  "id": "order-123",
  "status": "QUOTE_PROVIDED",
  "quotedPrice": 12000,
  "quotedAt": "2025-12-01T10:00:00Z",
  "quoteNotes": "Complex GC-MS analysis requiring specialized equipment",
  "estimatedTurnaroundDays": 7,
  "service": { "name": "Fatty Acid Analysis" },
  "client": { "email": "client@company.com" }
}
```

**Error Responses:**

| Status | Error Scenario | Response |
|--------|----------------|----------|
| 401 | Not authenticated | `{ "error": "Unauthorized" }` |
| 403 | Not LAB_ADMIN role | `{ "error": "Only lab administrators can provide quotes" }` |
| 404 | Order not found OR not owned by user's lab | `{ "error": "Order not found or access denied" }` |
| 409 | Order status not QUOTE_REQUESTED | `{ "error": "Quote already provided (current status: QUOTE_PROVIDED)" }` |
| 400 | Validation failed | `{ "error": "Validation error", "details": [...] }` |

---

### Implementation Deep Dive

**File:** `src/app/api/orders/[id]/quote/route.ts`

**Step-by-Step Execution:**

1. **Authentication Check (Lines 19-27)**
```typescript
const session = await getServerSession(authOptions)
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

if (session.user.role !== 'LAB_ADMIN') {
  return NextResponse.json(
    { error: 'Only lab administrators can provide quotes' },
    { status: 403 }
  )
}
```

2. **Ownership Verification (Lines 42-54)**
```typescript
const order = await prisma.order.findFirst({
  where: {
    id: params.id,
    lab: {
      ownerId: session.user.id  // ✅ Implicit ownership check
    }
  },
  include: { lab: true, service: true, client: true }
})

if (!order) {
  return NextResponse.json(
    { error: 'Order not found or access denied' },
    { status: 404 }  // ✅ Don't leak existence
  )
}
```

3. **Atomic State Transition (Lines 65-94)**
```typescript
const result = await prisma.$transaction(async (tx) => {
  // Atomic update: only succeeds if status = QUOTE_REQUESTED
  const updateResult = await tx.order.updateMany({
    where: {
      id: params.id,
      status: 'QUOTE_REQUESTED'
    },
    data: {
      quotedPrice: validatedData.quotedPrice,
      quotedAt: new Date(),
      status: 'QUOTE_PROVIDED',
      quoteNotes: validatedData.quoteNotes,
      estimatedTurnaroundDays: validatedData.estimatedTurnaroundDays
    }
  })

  if (updateResult.count === 0) {
    const order = await tx.order.findUnique({
      where: { id: params.id },
      select: { status: true }
    })

    if (!order) {
      throw new Error('ORDER_NOT_FOUND')
    }

    throw new Error(`QUOTE_ALREADY_PROVIDED:${order.status}`)
  }

  return await tx.order.findUnique({
    where: { id: params.id },
    include: { service: true, lab: true, client: true }
  })
})
```

**Why Transaction?**
- Future: Create notification record in same transaction (atomicity)
- Ensures data consistency (quote provision + notification succeed together)

---

## Quote Approval Workflow

### Actors and Responsibilities

**Client Actions:**
1. Review lab's custom quote (price, notes, turnaround time)
2. Decide: Approve (proceed with order) OR Reject (decline quote)
3. If rejecting: Provide rejection reason (feedback to lab)

**System Actions:**
1. Validate approval decision (boolean + optional rejection reason)
2. Atomically update order status:
   - Approve → QUOTE_PROVIDED → PENDING
   - Reject → QUOTE_PROVIDED → QUOTE_REJECTED
3. Record approval/rejection timestamp
4. Trigger notification to lab (future implementation)

---

### API Endpoint: POST /api/orders/[id]/approve-quote

**Authorization:**
- **Role Required:** CLIENT
- **Ownership Check:** Order must belong to authenticated user (`order.clientId = session.user.id`)

**Request Body (Approve):**
```typescript
{
  approved: true
}
```

**Request Body (Reject):**
```typescript
{
  approved: false,
  rejectionReason: "Price exceeds our allocated budget of ₱50,000"
}
```

**Validation (Zod Schema):**
```typescript
// src/lib/validations/quote.ts (lines 39-56)
const approveQuoteSchema = z.object({
  approved: z.boolean({
    required_error: 'Approval decision is required',
    invalid_type_error: 'Approval must be true or false'
  }),

  rejectionReason: z.string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason cannot exceed 500 characters')
    .optional()
    .transform(val => val?.trim())
}).refine(
  (data) => data.approved || (data.rejectionReason && data.rejectionReason.length >= 10),
  {
    message: 'Rejection reason is required when rejecting quote (minimum 10 characters)',
    path: ['rejectionReason']
  }
)
```

**Success Response (Approved, 200):**
```json
{
  "id": "order-123",
  "status": "PENDING",
  "quotedPrice": 12000,
  "quoteApprovedAt": "2025-12-01T11:00:00Z",
  "service": { "name": "Fatty Acid Analysis" },
  "lab": { "name": "Advanced Lab" }
}
```

**Success Response (Rejected, 200):**
```json
{
  "id": "order-123",
  "status": "QUOTE_REJECTED",
  "quotedPrice": 85000,
  "quoteRejectedAt": "2025-12-01T13:00:00Z",
  "quoteRejectedReason": "Price exceeds our allocated budget of ₱50,000",
  "service": { "name": "Toxicology Screen" },
  "lab": { "name": "Premium Lab" }
}
```

**Error Responses:**

| Status | Error Scenario | Response |
|--------|----------------|----------|
| 401 | Not authenticated | `{ "error": "Unauthorized" }` |
| 403 | Not CLIENT role | `{ "error": "Only clients can approve or reject quotes" }` |
| 404 | Order not found OR not owned by user | `{ "error": "Order not found or access denied" }` |
| 409 | Order status not QUOTE_PROVIDED | `{ "error": "Quote can only be approved/rejected when status is QUOTE_PROVIDED (current: PENDING)" }` |
| 400 | Validation failed (missing rejection reason) | `{ "error": "Validation error", "details": [...] }` |

---

### Implementation Deep Dive

**File:** `src/app/api/orders/[id]/approve-quote/route.ts`

**Conditional Update Logic (Lines 76-88):**
```typescript
const updateData = validatedData.approved
  ? {
      // Quote approved: Transition to PENDING
      status: 'PENDING' as const,
      quoteApprovedAt: new Date(),
      quoteRejectedReason: null  // Clear any previous rejection
    }
  : {
      // Quote rejected: Transition to QUOTE_REJECTED
      status: 'QUOTE_REJECTED' as const,
      quoteRejectedReason: validatedData.rejectionReason,
      quoteRejectedAt: new Date()
    }
```

**Atomic State Transition (Lines 90-113):**
```typescript
const result = await prisma.$transaction(async (tx) => {
  const updateResult = await tx.order.updateMany({
    where: {
      id: params.id,
      status: 'QUOTE_PROVIDED'  // ✅ Only update if quote was provided
    },
    data: updateData
  })

  if (updateResult.count === 0) {
    const order = await tx.order.findUnique({
      where: { id: params.id },
      select: { status: true }
    })

    if (!order) {
      throw new Error('ORDER_NOT_FOUND')
    }

    throw new Error(`INVALID_STATUS:${order.status}`)
  }

  return await tx.order.findUnique({
    where: { id: params.id },
    include: { service: true, lab: true, client: true, attachments: true }
  })
})
```

---

## Custom Quote Request (HYBRID Mode)

### Use Case: Volume Discounts

**Scenario:**
- Service: "Moisture Content Analysis" (HYBRID mode)
- Reference Price: ₱300 per sample
- Client wants to test 100 samples

**Client Decision:**
1. **Accept Reference Price:** 100 × ₱300 = ₱30,000 (instant booking)
2. **Request Custom Quote:** Lab might offer ₱200/sample for bulk (₱20,000 total)

---

### API Endpoint: POST /api/orders (with requestCustomQuote flag)

**Request Body (Accept Reference Price):**
```typescript
{
  serviceId: "service-moisture",
  sampleDescription: "100 agricultural soil samples",
  requestCustomQuote: false,  // ✅ Accept ₱300/sample
  clientDetails: { ... }
}
```

**Result:** Order created with `status = PENDING`, `quotedPrice = 30000`

---

**Request Body (Request Custom Quote):**
```typescript
{
  serviceId: "service-moisture",
  sampleDescription: "100 agricultural soil samples, need volume discount",
  requestCustomQuote: true,  // ✅ Request negotiation
  clientDetails: { ... }
}
```

**Result:** Order created with `status = QUOTE_REQUESTED`, `quotedPrice = null`

---

### Implementation

**File:** `src/app/api/orders/route.ts` (lines 64-76)

```typescript
} else if (service.pricingMode === 'HYBRID') {
  if (validatedData.requestCustomQuote === true) {
    // Client requested custom quote
    initialStatus = 'QUOTE_REQUESTED'
    quotedPrice = null
    quotedAt = null
  } else {
    // Client accepted reference price (instant booking)
    initialStatus = 'PENDING'
    quotedPrice = service.pricePerUnit ? Number(service.pricePerUnit) : null
    quotedAt = new Date()
  }
}
```

---

## Database Schema Design

### LabService Model (Pricing Mode)

```prisma
// prisma/schema.prisma (lines 106-126)
model LabService {
  id                 String      @id @default(cuid())
  labId              String
  name               String
  description        String?
  category           String
  pricingMode        PricingMode @default(QUOTE_REQUIRED)  // ✅ Pricing strategy
  pricePerUnit       Decimal?                              // ✅ Nullable for QUOTE_REQUIRED
  unitType           String      @default("per_sample")
  turnaroundDays     Int?
  sampleRequirements String?
  active             Boolean     @default(true)

  lab    Lab     @relation(fields: [labId], references: [id], onDelete: Cascade)
  orders Order[]

  @@index([active, category, labId])
  @@map("lab_services")
}
```

**Key Design Decisions:**

1. **`pricingMode` Enum (Not Boolean)**
   - Supports three modes (not just quote vs fixed)
   - Future-proof: Can add new modes (e.g., TIERED, AUCTION)

2. **`pricePerUnit` Nullable**
   - `null` → QUOTE_REQUIRED (no reference price)
   - Non-null → FIXED or HYBRID (reference price available)

3. **Default: QUOTE_REQUIRED**
   - B2B-first platform (quote workflow is primary)
   - Labs opt-in to FIXED/HYBRID (requires setting `pricePerUnit`)

---

### Order Model (Quote Fields)

```prisma
// prisma/schema.prisma (lines 128-157)
model Order {
  id                      String      @id @default(cuid())
  clientId                String
  labId                   String
  serviceId               String
  status                  OrderStatus @default(QUOTE_REQUESTED)

  // RFQ Details (CLIENT-provided)
  clientDetails           Json
  sampleDescription       String
  specialInstructions     String?

  // Quote Fields (LAB_ADMIN-provided)
  quotedPrice             Decimal?    // ✅ Custom quote from lab
  quotedAt                DateTime?   // ✅ When quote was provided
  quoteNotes              String?     // ✅ Lab's justification
  estimatedTurnaroundDays Int?        // ✅ Lab's estimate

  // Approval/Rejection Fields (CLIENT-provided)
  quoteApprovedAt         DateTime?   // ✅ When client approved
  quoteRejectedAt         DateTime?   // ✅ When client rejected
  quoteRejectedReason     String?     // ✅ Client's feedback

  // Lifecycle Timestamps
  acknowledgedAt          DateTime?
  completedAt             DateTime?
  createdAt               DateTime    @default(now())
  updatedAt               DateTime    @updatedAt

  client      User         @relation("ClientOrders", fields: [clientId], references: [id])
  lab         Lab          @relation(fields: [labId], references: [id])
  service     LabService   @relation(fields: [serviceId], references: [id])
  attachments Attachment[]

  @@index([clientId, status, createdAt(sort: Desc)])
  @@index([labId, status, createdAt(sort: Desc)])
  @@map("orders")
}
```

**Key Design Decisions:**

1. **Separate `quotedPrice` from `service.pricePerUnit`**
   - **Why:** Custom quotes differ from catalog prices
   - **Example:** Catalog shows ₱5000, lab quotes ₱12000 (complex sample)

2. **Both Approval and Rejection Timestamps**
   - **Why:** Analytics (quote approval rate, time-to-decision)
   - **Example:** Track how long clients take to approve quotes

3. **`quoteNotes` for Transparency**
   - **Why:** Justifies custom pricing (builds trust)
   - **Example:** "Requires GC-MS equipment rental (₱5000) + specialist labor (₱7000)"

---

## Mental Models

### Model 1: "Price is NOT Determined at Service Level"

**E-commerce thinking (WRONG):**
> "Service has a price, multiply by quantity, show total."

**B2B thinking (CORRECT):**
> "Service has pricing STRATEGY. Price determined through negotiation OR reference price."

---

### Model 2: "State Transitions are Business Events"

**Each status change is a business event:**
- QUOTE_REQUESTED → Someone needs to act (lab admin)
- QUOTE_PROVIDED → Someone needs to decide (client)
- PENDING → Someone needs to acknowledge (lab admin)
- ACKNOWLEDGED → Someone needs to start work (lab admin)

**Mental Model:**
> "State machine is a TODO list distributed across actors."

---

### Model 3: "HYBRID Mode is 'Instant Checkout with Escape Hatch'"

**Not:** "Service is either fixed OR negotiable"
**Instead:** "Service supports BOTH workflows, client chooses"

**Analogy:**
> "Like Amazon with 'Buy Now' button AND 'Make an Offer' button side-by-side."

---

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Auto-Populating `quotedPrice` from `pricePerUnit`

**Wrong:**
```typescript
const order = await prisma.order.create({
  data: {
    quotedPrice: service.pricePerUnit,  // ❌ Client didn't approve this
    status: 'PENDING'
  }
})
```

**Why This Fails:**
- QUOTE_REQUIRED services have no `pricePerUnit` (field is null)
- Even with HYBRID, client might request custom quote (shouldn't auto-populate)

**Correct:**
```typescript
const order = await prisma.order.create({
  data: {
    quotedPrice: service.pricingMode === 'FIXED' ? service.pricePerUnit : null,
    status: service.pricingMode === 'FIXED' ? 'PENDING' : 'QUOTE_REQUESTED'
  }
})
```

---

### ❌ Anti-Pattern 2: Allowing Status Skips

**Wrong:**
```typescript
// Jumping from QUOTE_REQUESTED directly to IN_PROGRESS
await prisma.order.update({
  where: { id },
  data: { status: 'IN_PROGRESS' }  // ❌ Skipped QUOTE_PROVIDED, PENDING, ACKNOWLEDGED
})
```

**Why This Fails:**
- Violates state machine rules (breaks business logic)
- Missing timestamps (quoteApprovedAt never set)
- Client never saw quote (could dispute price later)

**Correct:**
```typescript
// Follow state machine: QUOTE_REQUESTED → QUOTE_PROVIDED → PENDING → ACKNOWLEDGED → IN_PROGRESS
```

---

### ❌ Anti-Pattern 3: Trusting Client-Provided Prices

**Wrong:**
```typescript
const { quotedPrice } = await req.json()
await prisma.order.update({
  where: { id },
  data: { quotedPrice }  // ❌ Client could send ₱1 instead of ₱10,000
})
```

**Why This Fails:**
- Client could manipulate request (open DevTools, modify fetch call)
- No authorization check (client setting their own price)

**Correct:**
```typescript
// Only LAB_ADMIN can set quotedPrice
if (session.user.role !== 'LAB_ADMIN') {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

// Verify lab admin OWNS the lab
const order = await prisma.order.findFirst({
  where: { id, lab: { ownerId: session.user.id } }
})
```

---

**Document Owner:** Architecture Mentor
**Review Cadence:** After pricing-related changes
**Related Documents:**
- `ARCHITECTURE_OVERVIEW.md` - Business model context
- `DATABASE_ARCHITECTURE.md` - Schema deep dive
- `API_DESIGN_PATTERNS.md` - State transition patterns
- `AUTHENTICATION_AND_AUTHORIZATION.md` - Ownership verification
