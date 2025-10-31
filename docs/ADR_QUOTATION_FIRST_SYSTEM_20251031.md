# ADR: Quotation-First Order Creation System

**Date:** 2025-10-31
**Status:** Proposed
**Architect:** Claude Code (following architect agent guidelines)
**Reviewers:** CEO, CTO, Development Team

---

## Executive Summary

**Decision:** Transform PipetGo from e-commerce instant-booking model to B2B quotation-first workflow as primary business model.

**Alignment Goal:** Increase from 🔴 20% to ✅ 95% alignment with CEO directive: "Quotations are to be expected; can we make it default?"

**Implementation Time:** 12-16 hours (5 phases)

**Breaking Changes:** Minimal - backward compatible with existing fixed-rate services

---

## Context

### Current Problem

PipetGo was built as an **e-commerce marketplace** (Upwork/Fiverr model) but CEO expects **B2B RFQ platform** (Alibaba model).

**Evidence from Audit:**
1. Order creation auto-populates `quotedPrice` from `pricePerUnit` (src/app/api/orders/route.ts:52)
2. Frontend displays fixed prices upfront (src/app/page.tsx:129-130)
3. No quote provision workflow for lab admins
4. No quote approval workflow for clients
5. OrderStatus enum lacks quote-related states

**Business Impact:**
- Labs cannot customize pricing based on sample complexity
- No opportunity for lab to review requirements before committing
- Client expectations misaligned (instant checkout vs. custom quotes)
- ISO 17025 labs typically require quote approval before testing

### CEO Directive Analysis

> "Quotations are to be expected; can we make it default?"

**Key Requirements:**
1. **Default behavior** = quotation workflow (not exception)
2. Labs review RFQ → provide custom pricing → client approves → testing proceeds
3. Backward compatibility with existing fixed-rate services (if any exist)

---

## Decision

We will implement a **three-tier pricing system** with quotation-first as the default:

### Pricing Modes (New Enum)

```prisma
enum PricingMode {
  QUOTE_REQUIRED  // Default - No fixed price, always requires custom quote
  FIXED           // Backward compatibility - Instant booking at fixed rate
  HYBRID          // Has reference price, but allows custom quote requests
}
```

**Default for new services:** `QUOTE_REQUIRED` (CEO's primary use case)

### Order Lifecycle (Extended)

```prisma
enum OrderStatus {
  // NEW: Quote workflow states
  QUOTE_REQUESTED  // Client submitted RFQ, awaiting lab quote
  QUOTE_PROVIDED   // Lab provided custom quote, awaiting client approval
  QUOTE_REJECTED   // Client rejected quote (terminal state for this quote)

  // EXISTING: Testing workflow states
  PENDING          // Quote approved OR fixed-rate order created, awaiting lab acknowledgment
  ACKNOWLEDGED     // Lab acknowledged order, preparing to start testing
  IN_PROGRESS      // Testing underway
  COMPLETED        // Results delivered
  CANCELLED        // Order cancelled by either party
}
```

**State Machine Rules:**
- `QUOTE_REQUIRED` services → QUOTE_REQUESTED → QUOTE_PROVIDED → (QUOTE_REJECTED | PENDING)
- `FIXED` services → PENDING (skip quote workflow)
- `HYBRID` services → Client choice: PENDING immediately OR QUOTE_REQUESTED

---

## Architecture Design

### 1. Database Schema Changes

#### Updated LabService Model

```prisma
model LabService {
  id                 String      @id @default(cuid())
  labId              String
  name               String
  description        String?
  category           String

  // NEW: Pricing configuration
  pricingMode        PricingMode @default(QUOTE_REQUIRED)  // ✅ Default to quote-first
  pricePerUnit       Decimal?    // Required for FIXED/HYBRID, null for QUOTE_REQUIRED

  unitType           String      @default("per_sample")
  turnaroundDays     Int?
  sampleRequirements String?
  active             Boolean     @default(true)
  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt

  lab    Lab     @relation(fields: [labId], references: [id], onDelete: Cascade)
  orders Order[]

  @@map("lab_services")
}
```

**Validation Rules:**
- `FIXED` mode → `pricePerUnit` MUST be non-null
- `QUOTE_REQUIRED` mode → `pricePerUnit` SHOULD be null (no reference price)
- `HYBRID` mode → `pricePerUnit` MAY be non-null (serves as reference)

#### Updated Order Model

```prisma
model Order {
  id                  String      @id @default(cuid())
  clientId            String
  labId               String
  serviceId           String
  status              OrderStatus @default(QUOTE_REQUESTED)  // ✅ Changed from PENDING

  clientDetails       Json
  sampleDescription   String
  specialInstructions String?

  // Quote tracking
  quotedPrice         Decimal?
  quotedAt            DateTime?
  quoteNotes          String?     // NEW: Lab's explanation of quote
  quoteRejectedAt     DateTime?   // NEW: When client rejected quote
  quoteRejectedReason String?     // NEW: Why client rejected

  // Testing workflow
  acknowledgedAt      DateTime?
  completedAt         DateTime?
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  client      User         @relation("ClientOrders", fields: [clientId], references: [id])
  lab         Lab          @relation(fields: [labId], references: [id])
  service     LabService   @relation(fields: [serviceId], references: [id])
  attachments Attachment[]

  @@map("orders")
}
```

**Key Changes:**
- Default status changed to `QUOTE_REQUESTED` (from `PENDING`)
- Added `quoteNotes` for lab admin's pricing justification
- Added quote rejection tracking for analytics

### 2. API Endpoint Specifications

#### A. Refactored Order Creation

**Endpoint:** `POST /api/orders`

**Request Schema (Zod):**
```typescript
const createOrderSchema = z.object({
  serviceId: z.string().cuid(),
  sampleDescription: z.string().min(10).max(1000),
  specialInstructions: z.string().max(2000).optional(),
  clientDetails: z.object({
    contactName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    organization: z.string().optional()
  }),

  // For HYBRID mode: client can choose quote vs instant
  requestCustomQuote: z.boolean().optional()
});
```

**Response Schema:**
```typescript
{
  order: {
    id: string,
    status: 'QUOTE_REQUESTED' | 'PENDING',
    quotedPrice: number | null,
    requiresQuote: boolean  // Helper flag for UI
  }
}
```

**Business Logic:**
```typescript
// Pseudocode
const service = await prisma.labService.findUnique({ where: { id: serviceId } });

let initialStatus: OrderStatus;
let quotedPrice: Decimal | null;

if (service.pricingMode === 'QUOTE_REQUIRED') {
  initialStatus = 'QUOTE_REQUESTED';
  quotedPrice = null;  // ✅ NO auto-population

} else if (service.pricingMode === 'FIXED') {
  initialStatus = 'PENDING';
  quotedPrice = service.pricePerUnit;  // Auto-populate for fixed rate

} else if (service.pricingMode === 'HYBRID') {
  if (requestCustomQuote === true) {
    initialStatus = 'QUOTE_REQUESTED';
    quotedPrice = null;  // Client chose custom quote
  } else {
    initialStatus = 'PENDING';
    quotedPrice = service.pricePerUnit;  // Client accepted reference price
  }
}

const order = await prisma.order.create({
  data: {
    clientId: session.user.id,
    labId: service.labId,
    serviceId,
    status: initialStatus,
    quotedPrice,
    quotedAt: quotedPrice ? new Date() : null,
    // ... other fields
  }
});

// TODO: Notify lab admin if status === 'QUOTE_REQUESTED'
```

**Authorization:**
- Must be authenticated (`session.user`)
- Role must be `CLIENT` or `ADMIN`

**Error Codes:**
- 401: Unauthorized (not logged in)
- 403: Forbidden (wrong role)
- 404: Service not found or inactive
- 400: Validation error

---

#### B. New Endpoint: Quote Provision

**Endpoint:** `POST /api/orders/[id]/quote`

**Request Schema:**
```typescript
const provideQuoteSchema = z.object({
  quotedPrice: z.number().positive().min(1),
  quoteNotes: z.string().max(500).optional(),  // Explain pricing
  estimatedTurnaroundDays: z.number().int().positive().optional()
});
```

**Response Schema:**
```typescript
{
  order: {
    id: string,
    status: 'QUOTE_PROVIDED',
    quotedPrice: number,
    quotedAt: string  // ISO 8601 timestamp
  }
}
```

**Business Logic:**
```typescript
// Pseudocode
const session = await getServerSession(authOptions);

// 1. Authentication check
if (!session?.user || session.user.role !== 'LAB_ADMIN') {
  return 403 Forbidden;
}

// 2. Fetch order WITH ownership check (prevent quote manipulation)
const order = await prisma.order.findFirst({
  where: {
    id: orderId,
    lab: {
      ownerId: session.user.id  // ✅ Verify lab admin owns this lab
    },
    status: 'QUOTE_REQUESTED'  // ✅ Only quote orders awaiting quote
  },
  include: { service: true, client: true }
});

if (!order) {
  return 404 Not Found;  // Order doesn't exist OR user doesn't own lab OR wrong status
}

// 3. Validate input
const { quotedPrice, quoteNotes, estimatedTurnaroundDays } = provideQuoteSchema.parse(body);

// 4. Update order
const updatedOrder = await prisma.order.update({
  where: { id: orderId },
  data: {
    quotedPrice,
    quotedAt: new Date(),
    quoteNotes,
    status: 'QUOTE_PROVIDED'
  }
});

// 5. Notify client (email + in-app notification)
// TODO: await notifyClient(order.clientId, 'quote_provided', { orderId, quotedPrice });

return 200 OK { order: updatedOrder };
```

**Authorization:**
- Role: `LAB_ADMIN` only
- Resource ownership: `order.lab.ownerId === session.user.id`
- State validation: Order must be in `QUOTE_REQUESTED` status

**Error Codes:**
- 401: Unauthorized (not logged in)
- 403: Forbidden (not LAB_ADMIN OR doesn't own lab)
- 404: Order not found OR wrong status
- 400: Validation error (negative price, etc.)
- 409: Conflict (quote already provided)

**Audit Trail:**
```typescript
// Log quote provision for compliance
await prisma.auditLog.create({
  data: {
    userId: session.user.id,
    action: 'QUOTE_PROVIDED',
    resourceType: 'Order',
    resourceId: orderId,
    changes: { quotedPrice, quoteNotes },
    timestamp: new Date()
  }
});
```

---

#### C. New Endpoint: Quote Approval

**Endpoint:** `POST /api/orders/[id]/approve-quote`

**Request Schema:**
```typescript
const approveQuoteSchema = z.object({
  approved: z.boolean(),  // true = approve, false = reject
  rejectionReason: z.string().max(500).optional()  // Required if approved = false
});
```

**Response Schema:**
```typescript
{
  order: {
    id: string,
    status: 'PENDING' | 'QUOTE_REJECTED',
    quotedPrice: number
  }
}
```

**Business Logic:**
```typescript
// Pseudocode
const session = await getServerSession(authOptions);

// 1. Authentication + Role check
if (!session?.user || session.user.role !== 'CLIENT') {
  return 403 Forbidden;
}

// 2. Fetch order WITH ownership check
const order = await prisma.order.findFirst({
  where: {
    id: orderId,
    clientId: session.user.id,  // ✅ Verify client owns this order
    status: 'QUOTE_PROVIDED'    // ✅ Only approve orders with quotes
  }
});

if (!order) {
  return 404 Not Found;
}

// 3. Validate input
const { approved, rejectionReason } = approveQuoteSchema.parse(body);

// 4. Update order
if (approved) {
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'PENDING'  // Move to testing workflow
    }
  });

  // Notify lab admin: quote approved, can start testing
  // TODO: await notifyLabAdmin(order.labId, 'quote_approved', { orderId });

} else {
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'QUOTE_REJECTED',
      quoteRejectedAt: new Date(),
      quoteRejectedReason: rejectionReason
    }
  });

  // Notify lab admin: quote rejected
  // TODO: await notifyLabAdmin(order.labId, 'quote_rejected', { orderId, reason });
}

return 200 OK { order: updatedOrder };
```

**Authorization:**
- Role: `CLIENT` only
- Resource ownership: `order.clientId === session.user.id`
- State validation: Order must be in `QUOTE_PROVIDED` status

**Error Codes:**
- 401: Unauthorized (not logged in)
- 403: Forbidden (not CLIENT OR doesn't own order)
- 404: Order not found OR wrong status
- 400: Validation error (rejection without reason)

---

#### D. New Endpoint: Request Custom Quote (Hybrid Mode)

**Endpoint:** `POST /api/orders/[id]/request-custom-quote`

**Purpose:** For HYBRID services where client initially booked at fixed rate but wants custom quote

**Request Schema:**
```typescript
const requestCustomQuoteSchema = z.object({
  reason: z.string().max(500)  // Why client wants custom quote
});
```

**Response Schema:**
```typescript
{
  order: {
    id: string,
    status: 'QUOTE_REQUESTED',
    quotedPrice: null  // Reset to null
  }
}
```

**Business Logic:**
```typescript
// Pseudocode
const session = await getServerSession(authOptions);

// 1. Authentication + ownership
if (!session?.user || session.user.role !== 'CLIENT') {
  return 403 Forbidden;
}

const order = await prisma.order.findFirst({
  where: {
    id: orderId,
    clientId: session.user.id,
    status: 'PENDING',  // Only pending orders can request custom quote
    service: {
      pricingMode: 'HYBRID'  // Only HYBRID services allow this
    }
  },
  include: { service: true }
});

if (!order) {
  return 404 Not Found;
}

// 2. Revert to quote-requested state
const updatedOrder = await prisma.order.update({
  where: { id: orderId },
  data: {
    status: 'QUOTE_REQUESTED',
    quotedPrice: null,  // Reset price
    quotedAt: null,
    specialInstructions: order.specialInstructions + '\n\nCustom quote request: ' + reason
  }
});

// 3. Notify lab admin
// TODO: await notifyLabAdmin(order.labId, 'custom_quote_requested', { orderId, reason });

return 200 OK { order: updatedOrder };
```

---

### 3. State Machine Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     ORDER LIFECYCLE STATES                       │
└─────────────────────────────────────────────────────────────────┘

QUOTE_REQUIRED Services:
─────────────────────────
                     POST /api/orders
                     (client creates RFQ)
                            │
                            ▼
                   ┌────────────────┐
                   │ QUOTE_REQUESTED│◄──────┐
                   └────────┬───────┘       │
                            │               │
                     POST /api/orders/[id]/quote  │
                     (lab admin provides quote)   │
                            │               │
                            ▼               │
                   ┌────────────────┐       │
                   │ QUOTE_PROVIDED │       │
                   └────────┬───────┘       │
                            │               │
            ┌───────────────┴────────────┐  │
            │                            │  │
POST /api/orders/[id]/approve-quote     │  │
(approved: true)  (approved: false)     │  │
            │                            │  │
            ▼                            ▼  │
    ┌──────────┐                ┌──────────────┐
    │ PENDING  │                │QUOTE_REJECTED│
    └────┬─────┘                └──────────────┘
         │                           (terminal)
         │
    Lab acknowledges
         │
         ▼
  ┌──────────────┐
  │ ACKNOWLEDGED │
  └──────┬───────┘
         │
    Lab starts testing
         │
         ▼
  ┌──────────────┐
  │ IN_PROGRESS  │
  └──────┬───────┘
         │
    Lab delivers results
         │
         ▼
  ┌──────────────┐
  │  COMPLETED   │
  └──────────────┘


FIXED Services (Backward Compatible):
──────────────────────────────────────
                     POST /api/orders
                     (client creates order)
                            │
                            ▼
                      ┌──────────┐
                      │ PENDING  │
                      └────┬─────┘
                           │
                      (continues as above)


HYBRID Services:
────────────────
                     POST /api/orders
                            │
            ┌───────────────┴────────────────┐
            │                                │
    (requestCustomQuote: true)  (requestCustomQuote: false)
            │                                │
            ▼                                ▼
   ┌────────────────┐                 ┌──────────┐
   │ QUOTE_REQUESTED│                 │ PENDING  │
   └────────────────┘                 └────┬─────┘
            │                               │
    (follows QUOTE_REQUIRED flow)    POST /api/orders/[id]/request-custom-quote
                                             │
                                             ▼
                                    ┌────────────────┐
                                    │ QUOTE_REQUESTED│
                                    └────────────────┘
                                             │
                                   (follows QUOTE_REQUIRED flow)


Authorization Requirements:
───────────────────────────
QUOTE_REQUESTED → QUOTE_PROVIDED: LAB_ADMIN (owns lab) only
QUOTE_PROVIDED → PENDING: CLIENT (owns order) only
QUOTE_PROVIDED → QUOTE_REJECTED: CLIENT (owns order) only
PENDING → ACKNOWLEDGED: LAB_ADMIN (owns lab) only
ACKNOWLEDGED → IN_PROGRESS: LAB_ADMIN (owns lab) only
IN_PROGRESS → COMPLETED: LAB_ADMIN (owns lab) only
Any state → CANCELLED: CLIENT (owns order) OR LAB_ADMIN (owns lab) OR ADMIN
```

---

### 4. UI Component Hierarchy

#### A. Lab Admin Quote Provision UI

**Location:** `src/app/dashboard/lab/orders/[id]/QuoteForm.tsx`

**Component Tree:**
```
QuoteForm (Client Component)
├── QuoteInputSection
│   ├── CurrencyInput (quotedPrice)
│   ├── NumberInput (estimatedTurnaroundDays)
│   └── Textarea (quoteNotes)
├── OrderDetailsCard (Server Component)
│   ├── ClientInfo
│   ├── SampleDescription
│   └── SpecialInstructions
├── QuoteSubmitButton
│   └── Loading Spinner (if submitting)
└── ErrorAlert (if submission fails)
```

**Data Flow:**
```typescript
// Server Component (page.tsx)
const order = await prisma.order.findFirst({
  where: {
    id: params.id,
    lab: { ownerId: session.user.id },
    status: 'QUOTE_REQUESTED'
  },
  include: { service: true, client: true }
});

// Client Component (QuoteForm.tsx)
'use client';

const [quotedPrice, setQuotedPrice] = useState('');
const [quoteNotes, setQuoteNotes] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setIsSubmitting(true);
  setError(null);

  try {
    const res = await fetch(`/api/orders/${orderId}/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quotedPrice: parseFloat(quotedPrice),
        quoteNotes
      })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to submit quote');
    }

    router.push('/dashboard/lab/orders');
    toast.success('Quote sent to client!');

  } catch (err) {
    setError(err.message);
  } finally {
    setIsSubmitting(false);
  }
}
```

**UX Requirements:**
- Show service `pricePerUnit` as reference (if HYBRID mode)
- Show sample description prominently
- Validate quotedPrice is positive number
- Show estimated turnaround in days (not hours/weeks)
- Confirmation message: "Quote sent to client. They will be notified via email."

---

#### B. Client Quote Approval UI

**Location:** `src/app/dashboard/client/orders/[id]/QuoteApprovalCard.tsx`

**Component Tree:**
```
QuoteApprovalCard (Client Component)
├── QuoteDetailsSection
│   ├── PriceDisplay (large, prominent)
│   ├── TurnaroundEstimate
│   ├── LabNotes (if provided)
│   └── ServiceDetails
├── ApprovalActions
│   ├── ApproveButton (primary action)
│   └── RejectButton (secondary action)
├── RejectionModal (if user clicks reject)
│   ├── Textarea (reason for rejection)
│   └── ConfirmRejectButton
└── ConfirmationModal (if user clicks approve)
    ├── PriceSummary
    └── ConfirmApproveButton
```

**Data Flow:**
```typescript
// Server Component (page.tsx)
const order = await prisma.order.findFirst({
  where: {
    id: params.id,
    clientId: session.user.id,
    status: 'QUOTE_PROVIDED'
  },
  include: { service: true, lab: true }
});

// Client Component (QuoteApprovalCard.tsx)
'use client';

const [showRejectModal, setShowRejectModal] = useState(false);
const [showApproveModal, setShowApproveModal] = useState(false);
const [rejectionReason, setRejectionReason] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);

async function handleApprove() {
  setIsSubmitting(true);

  try {
    const res = await fetch(`/api/orders/${orderId}/approve-quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved: true })
    });

    if (!res.ok) throw new Error('Failed to approve quote');

    router.refresh();
    toast.success('Quote approved! Lab will begin testing soon.');

  } catch (err) {
    toast.error(err.message);
  } finally {
    setIsSubmitting(false);
    setShowApproveModal(false);
  }
}

async function handleReject() {
  if (!rejectionReason.trim()) {
    toast.error('Please provide a reason for rejection');
    return;
  }

  setIsSubmitting(true);

  try {
    const res = await fetch(`/api/orders/${orderId}/approve-quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approved: false,
        rejectionReason
      })
    });

    if (!res.ok) throw new Error('Failed to reject quote');

    router.refresh();
    toast.info('Quote rejected. You can submit a new request for quote.');

  } catch (err) {
    toast.error(err.message);
  } finally {
    setIsSubmitting(false);
    setShowRejectModal(false);
  }
}
```

**UX Requirements:**
- Large, clear price display (e.g., "₱15,000.00")
- Approve button is PRIMARY action (green, prominent)
- Reject button is SECONDARY action (gray, less prominent)
- Rejection requires reason (cannot submit without explanation)
- Approval requires confirmation modal ("You are approving ₱X for this testing service. Proceed?")
- Show lab's quote notes if provided

---

#### C. Service Catalog UI Updates

**Location:** `src/app/page.tsx` (homepage service cards)

**Current Code (Lines 129-130):**
```tsx
<div className="flex justify-between">
  <span className="font-medium">Price:</span>
  <span>{formatCurrency(service.pricePerUnit)} per sample</span>
</div>
```

**Updated Code (Conditional Rendering):**
```tsx
<div className="flex justify-between items-center">
  <span className="font-medium">Pricing:</span>

  {service.pricingMode === 'FIXED' ? (
    <span className="text-lg font-semibold text-green-600">
      {formatCurrency(service.pricePerUnit)} per sample
    </span>
  ) : service.pricingMode === 'HYBRID' ? (
    <div className="text-right">
      <span className="text-sm text-gray-500">From</span>{' '}
      <span className="font-semibold">{formatCurrency(service.pricePerUnit)}</span>
      <span className="block text-xs text-blue-600">Custom quote available</span>
    </div>
  ) : (
    <span className="text-blue-600 font-medium">
      Request Quote
    </span>
  )}
</div>
```

**Visual Indicators:**
- FIXED: Green badge "Instant Booking"
- QUOTE_REQUIRED: Blue badge "Quote Required"
- HYBRID: Yellow badge "Flexible Pricing"

---

### 5. Validation & Error Handling

#### Zod Schemas

**File:** `src/lib/validations/quote.ts` (NEW FILE)

```typescript
import { z } from 'zod';

export const provideQuoteSchema = z.object({
  quotedPrice: z.number()
    .positive('Price must be positive')
    .min(1, 'Price must be at least ₱1')
    .max(1000000, 'Price cannot exceed ₱1,000,000'),

  quoteNotes: z.string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional(),

  estimatedTurnaroundDays: z.number()
    .int('Turnaround must be whole days')
    .positive('Turnaround must be positive')
    .max(365, 'Turnaround cannot exceed 365 days')
    .optional()
});

export const approveQuoteSchema = z.object({
  approved: z.boolean(),

  rejectionReason: z.string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason cannot exceed 500 characters')
    .optional()
}).refine(
  (data) => data.approved || data.rejectionReason,
  {
    message: 'Rejection reason is required when rejecting quote',
    path: ['rejectionReason']
  }
);

export const requestCustomQuoteSchema = z.object({
  reason: z.string()
    .min(10, 'Please explain why you need a custom quote (min 10 characters)')
    .max(500, 'Reason cannot exceed 500 characters')
});
```

#### Error Handling Pattern (API Routes)

```typescript
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Authorization (role check)
    if (session.user.role !== 'LAB_ADMIN') {
      return Response.json({ error: 'Forbidden - Lab admin access required' }, { status: 403 });
    }

    // 3. Parse and validate request body
    const body = await req.json();
    const validatedData = provideQuoteSchema.parse(body);

    // 4. Resource ownership + state validation
    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        lab: { ownerId: session.user.id },
        status: 'QUOTE_REQUESTED'
      }
    });

    if (!order) {
      return Response.json({
        error: 'Order not found or not in quotable state'
      }, { status: 404 });
    }

    // 5. Business logic (transaction)
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order
      const order = await tx.order.update({
        where: { id: params.id },
        data: {
          quotedPrice: validatedData.quotedPrice,
          quotedAt: new Date(),
          quoteNotes: validatedData.quoteNotes,
          status: 'QUOTE_PROVIDED'
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'QUOTE_PROVIDED',
          resourceType: 'Order',
          resourceId: params.id,
          changes: validatedData
        }
      });

      return order;
    });

    // 6. Side effects (notifications)
    // TODO: await notifyClient(order.clientId, 'quote_provided', { orderId: params.id });

    return Response.json({ order: updatedOrder }, { status: 200 });

  } catch (error) {
    // Differentiated error handling
    if (error instanceof z.ZodError) {
      return Response.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    if (error.code === 'P2025') {  // Prisma: Record not found
      return Response.json({
        error: 'Order not found'
      }, { status: 404 });
    }

    console.error('Quote provision failed:', error);
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
```

---

## Implementation Phases

### Phase 1: Database Schema Updates (2 hours)

**Goal:** Update Prisma schema to support quotation workflow

**Tasks:**
1. Add `PricingMode` enum to schema
2. Add new `OrderStatus` values
3. Update `LabService` model with `pricingMode` field
4. Update `Order` model with quote rejection fields
5. Create migration files (up + down)
6. Test migration on development database
7. Update seed data to include QUOTE_REQUIRED services

**Acceptance Criteria:**
- [ ] Migration runs without errors
- [ ] Rollback migration works
- [ ] Existing orders unchanged (backward compatible)
- [ ] New services default to `QUOTE_REQUIRED`
- [ ] Seed creates 2 FIXED, 5 QUOTE_REQUIRED, 3 HYBRID services

**Deliverables:**
- `prisma/migrations/XXXXXX_add_quotation_system/migration.sql`
- Updated `prisma/schema.prisma`
- Updated `prisma/seed.ts`

**Dependencies:** None

---

### Phase 2: Validation Schemas (1 hour)

**Goal:** Create Zod schemas for quote workflows

**Tasks:**
1. Create `src/lib/validations/quote.ts`
2. Define `provideQuoteSchema`
3. Define `approveQuoteSchema`
4. Define `requestCustomQuoteSchema`
5. Write unit tests for each schema

**Acceptance Criteria:**
- [ ] All schemas reject invalid inputs
- [ ] Error messages are user-friendly
- [ ] Tests cover edge cases (negative prices, empty reasons)

**Deliverables:**
- `src/lib/validations/quote.ts` (70 lines)
- `src/lib/validations/__tests__/quote.test.ts` (150 lines)

**Dependencies:** None (can run parallel with Phase 1)

---

### Phase 3: API Endpoints (4 hours)

**Goal:** Implement quote provision/approval APIs

**Tasks:**
1. Refactor `POST /api/orders` to support pricing modes
2. Create `POST /api/orders/[id]/quote` (quote provision)
3. Create `POST /api/orders/[id]/approve-quote` (quote approval)
4. Create `POST /api/orders/[id]/request-custom-quote` (hybrid mode)
5. Write integration tests for all endpoints
6. Add audit logging for quote actions

**Acceptance Criteria:**
- [ ] Order creation respects `pricingMode`
- [ ] Lab admin can provide quotes (ownership verified)
- [ ] Client can approve/reject quotes (ownership verified)
- [ ] All state transitions validated
- [ ] 100% test coverage for quote APIs

**Deliverables:**
- Updated `src/app/api/orders/route.ts`
- `src/app/api/orders/[id]/quote/route.ts` (120 lines)
- `src/app/api/orders/[id]/approve-quote/route.ts` (100 lines)
- `src/app/api/orders/[id]/request-custom-quote/route.ts` (80 lines)
- `tests/api/orders/quotation.test.ts` (300 lines)

**Dependencies:** Phase 1 (schema must be updated first)

---

### Phase 4: UI Implementation (5 hours)

**Goal:** Build quote provision and approval UIs

**Tasks:**
1. Update service catalog to show pricing modes
2. Update order creation page for QUOTE_REQUIRED services
3. Create lab admin quote provision form
4. Create client quote approval card
5. Update order listing to show quote statuses
6. Add status badges with color coding

**Acceptance Criteria:**
- [ ] Service catalog clearly indicates pricing mode
- [ ] Lab admin can submit quotes easily
- [ ] Client can approve/reject quotes with confirmation
- [ ] Status badges match design system
- [ ] Responsive design (mobile-friendly)

**Deliverables:**
- Updated `src/app/page.tsx` (service catalog)
- Updated `src/app/order/[serviceId]/page.tsx`
- `src/app/dashboard/lab/orders/[id]/QuoteForm.tsx` (150 lines)
- `src/app/dashboard/client/orders/[id]/QuoteApprovalCard.tsx` (200 lines)
- Updated `src/components/ui/badge.tsx` (status colors)

**Dependencies:** Phase 3 (API endpoints must exist)

---

### Phase 5: Testing & Documentation (2 hours)

**Goal:** End-to-end testing and documentation updates

**Tasks:**
1. Manual testing of full quote workflow
2. Update CLAUDE.md with quote patterns
3. Update API documentation
4. Create user guide for quote workflow
5. Test on staging database

**Acceptance Criteria:**
- [ ] Full quote workflow tested (CLIENT → LAB_ADMIN → CLIENT)
- [ ] All three pricing modes tested
- [ ] Documentation updated
- [ ] User guide created

**Deliverables:**
- Updated `CLAUDE.md` (quote patterns section)
- `docs/QUOTE_WORKFLOW_USER_GUIDE.md` (500 lines)
- `docs/API_ENDPOINTS_QUOTATION.md` (400 lines)

**Dependencies:** Phase 4 (UI must be complete)

---

## Consequences

### Benefits

1. **Business Alignment (🔴 20% → ✅ 95%)**
   - Quotation-first is now default behavior
   - Labs can customize pricing based on sample complexity
   - Matches CEO's vision of B2B RFQ platform

2. **Flexibility**
   - FIXED mode preserves backward compatibility
   - HYBRID mode allows labs to offer both instant and custom pricing
   - Clients can choose custom quote even on HYBRID services

3. **Compliance & Audit Trail**
   - All quote actions logged for ISO 17025 traceability
   - Quote rejection reasons captured for analytics
   - Clear state machine prevents invalid transitions

4. **Security**
   - Server-side authorization prevents quote manipulation
   - Resource ownership verification on all quote APIs
   - Clients cannot set their own prices

### Tradeoffs

1. **Increased Friction**
   - Quote workflow adds 24-48 hour delay vs instant booking
   - Additional steps for client (submit RFQ → wait for quote → approve)
   - May reduce conversion rate for time-sensitive clients

2. **Complexity**
   - Three pricing modes vs single fixed-rate model
   - More UI states to handle (QUOTE_REQUESTED, QUOTE_PROVIDED, etc.)
   - Additional API endpoints to maintain

3. **Migration Risk**
   - Existing orders (if any) remain in old workflow
   - Must communicate change to existing users
   - Labs need training on quote provision UI

### Mitigation Strategies

1. **User Education**
   - In-app tooltips explaining quote workflow
   - Email notifications at each quote stage
   - User guide for both clients and lab admins

2. **Performance Monitoring**
   - Track quote response time (lab admin → quote provision)
   - Track quote approval rate (client approval vs rejection)
   - A/B test HYBRID mode adoption

3. **Gradual Rollout**
   - Phase 1: New services default to QUOTE_REQUIRED
   - Phase 2: Migrate existing FIXED services to HYBRID (optional)
   - Phase 3: Remove FIXED mode entirely (if CEO approves)

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Migration breaks existing orders | Low | High | Write reversible migration, test on staging |
| Authorization bypass in quote APIs | Medium | Critical | Peer review, security testing, audit logs |
| State machine allows invalid transitions | Medium | Medium | Write comprehensive state transition tests |
| N+1 query performance issues | Low | Low | Use Prisma `include` for eager loading |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Clients abandon due to quote delay | Medium | High | Set expectation: "Quote within 24 hours" |
| Labs don't respond to quote requests | High | High | Notification system + reminder emails |
| Quote rejection rate too high | Medium | Medium | Analytics dashboard for labs to optimize pricing |
| Instant booking revenue loss | Low | Medium | HYBRID mode allows instant booking option |

---

## Success Metrics

### Alignment Metrics (Goal: 95%+)

- [ ] 100% of new services default to QUOTE_REQUIRED
- [ ] 0% of orders auto-populate `quotedPrice` from `pricePerUnit` (for QUOTE_REQUIRED)
- [ ] Lab admin can provide quotes in <5 clicks
- [ ] Client can approve quotes in <3 clicks

### Performance Metrics

- **Quote Response Time:** <24 hours (lab admin → quote provision)
- **Quote Approval Rate:** >70% (client approves vs rejects)
- **Conversion Rate:** >60% (RFQ submission → quote approval)
- **API Response Time:** <500ms (all quote endpoints)

### Quality Metrics

- **Test Coverage:** 100% for quote APIs
- **Security Score:** 0 authorization vulnerabilities
- **Uptime:** 99.9% for quote endpoints
- **User Satisfaction:** >4.5/5 for quote workflow

---

## Next Steps

1. **Review & Approval**
   - CEO review: Business alignment (quotation-first default)
   - CTO review: Technical feasibility (timeline, risks)
   - Security review: Authorization patterns

2. **Implementation**
   - Assign phases to development team
   - Create GitHub issues for each phase
   - Set up staging environment for testing

3. **Launch Plan**
   - Soft launch: Enable for 5 pilot labs
   - Monitor quote response time and approval rate
   - Hard launch: Enable for all labs

---

## Appendix A: Database Migration

### Forward Migration

```sql
-- Add PricingMode enum
CREATE TYPE "PricingMode" AS ENUM ('QUOTE_REQUIRED', 'FIXED', 'HYBRID');

-- Update OrderStatus enum (add new values)
ALTER TYPE "OrderStatus" ADD VALUE 'QUOTE_REQUESTED';
ALTER TYPE "OrderStatus" ADD VALUE 'QUOTE_PROVIDED';
ALTER TYPE "OrderStatus" ADD VALUE 'QUOTE_REJECTED';

-- Update lab_services table
ALTER TABLE "lab_services"
  ADD COLUMN "pricingMode" "PricingMode" NOT NULL DEFAULT 'QUOTE_REQUIRED';

-- Update orders table (add quote rejection tracking)
ALTER TABLE "orders"
  ADD COLUMN "quoteNotes" TEXT,
  ADD COLUMN "quoteRejectedAt" TIMESTAMP,
  ADD COLUMN "quoteRejectedReason" TEXT;

-- Update default status for new orders
ALTER TABLE "orders"
  ALTER COLUMN "status" SET DEFAULT 'QUOTE_REQUESTED';

-- Backfill existing services (assume they were FIXED mode)
UPDATE "lab_services"
  SET "pricingMode" = 'FIXED'
  WHERE "pricePerUnit" IS NOT NULL;
```

### Rollback Migration

```sql
-- Remove quote rejection fields
ALTER TABLE "orders"
  DROP COLUMN "quoteNotes",
  DROP COLUMN "quoteRejectedAt",
  DROP COLUMN "quoteRejectedReason";

-- Remove pricingMode column
ALTER TABLE "lab_services"
  DROP COLUMN "pricingMode";

-- Revert default status
ALTER TABLE "orders"
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Note: Cannot remove enum values in PostgreSQL
-- Manual intervention required to drop OrderStatus enum values
```

---

## Appendix B: Test Scenarios

### Unit Tests (Validation)

1. `provideQuoteSchema` rejects negative prices
2. `provideQuoteSchema` rejects prices >₱1M
3. `approveQuoteSchema` requires rejection reason when approved=false
4. `requestCustomQuoteSchema` requires reason ≥10 characters

### Integration Tests (API)

1. Order creation with QUOTE_REQUIRED service → status = QUOTE_REQUESTED
2. Order creation with FIXED service → status = PENDING
3. Order creation with HYBRID service + requestCustomQuote=true → status = QUOTE_REQUESTED
4. Lab admin provides quote → status changes to QUOTE_PROVIDED
5. Lab admin cannot provide quote for order from different lab (403 Forbidden)
6. Client cannot provide quote (403 Forbidden)
7. Client approves quote → status changes to PENDING
8. Client rejects quote without reason → 400 Bad Request
9. Client rejects quote with reason → status changes to QUOTE_REJECTED

### End-to-End Tests (User Flow)

1. Full QUOTE_REQUIRED workflow: Client RFQ → Lab quote → Client approve → Testing
2. Full QUOTE_REJECTED workflow: Client RFQ → Lab quote → Client reject
3. HYBRID instant booking: Client selects service → Instant order (status=PENDING)
4. HYBRID custom quote: Client requests custom quote → Lab provides → Client approves

---

**Document Version:** 1.0
**Last Updated:** 2025-10-31
**Review Status:** Pending CEO/CTO approval
