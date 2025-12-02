# API Design Patterns

**Last Updated:** 2025-12-01
**Framework:** Next.js 14 App Router API Routes

---

## Table of Contents

1. [RESTful Conventions](#restful-conventions)
2. [Standard Request/Response Patterns](#standard-requestresponse-patterns)
3. [Error Handling Patterns](#error-handling-patterns)
4. [Authentication Middleware Pattern](#authentication-middleware-pattern)
5. [Ownership Verification Pattern](#ownership-verification-pattern)
6. [Transaction Patterns](#transaction-patterns)
7. [Validation Patterns (Zod)](#validation-patterns-zod)
8. [Pagination and Filtering](#pagination-and-filtering)

---

## RESTful Conventions

### HTTP Method Semantics

| Method | Purpose | Idempotent | Safe | Example |
|--------|---------|------------|------|---------|
| **GET** | Retrieve resource(s) | ✅ Yes | ✅ Yes | `GET /api/orders` |
| **POST** | Create resource | ❌ No | ❌ No | `POST /api/orders` |
| **PATCH** | Partial update | ✅ Yes* | ❌ No | `PATCH /api/orders/[id]` |
| **PUT** | Full replacement | ✅ Yes | ❌ No | `PUT /api/orders/[id]` (not used) |
| **DELETE** | Remove resource | ✅ Yes | ❌ No | `DELETE /api/orders/[id]` |

*Idempotent in PipetGo: State transitions follow strict rules (QUOTE_PROVIDED → PENDING always same result)

---

### Resource Naming Conventions

**Pattern:** `/api/{resource}/{id?}/{sub-resource|action}`

**Examples:**

| Endpoint | Purpose | HTTP Method |
|----------|---------|-------------|
| `/api/orders` | List/create orders | GET, POST |
| `/api/orders/[id]` | Get/update/delete order | GET, PATCH, DELETE |
| `/api/orders/[id]/quote` | Provide quote (action) | POST |
| `/api/orders/[id]/approve-quote` | Approve quote (action) | POST |
| `/api/services` | List/create services | GET, POST |
| `/api/services/[id]` | Get/update/delete service | GET, PATCH, DELETE |

**Action Routes (Non-RESTful):**
- Use hyphenated names: `approve-quote`, `request-custom-quote`
- Always POST (state-changing actions)
- Reason: State transitions are actions, not resource updates

---

### URL Structure Best Practices

✅ **GOOD:**
```
POST /api/orders/order-123/quote
POST /api/orders/order-123/approve-quote
```

❌ **BAD (RPC-style):**
```
POST /api/provideQuote?orderId=order-123
POST /api/approveQuote?orderId=order-123
```

**Why RESTful is Better:**
- Resource-oriented (orders are resources, quotes are sub-resources)
- Cacheable (GET /api/orders/order-123 can be cached)
- Stateless (URL contains all context)

---

## Standard Request/Response Patterns

### Standard Success Response

**Pattern:**
```typescript
export async function GET(req: Request) {
  // ... business logic
  return NextResponse.json(data, { status: 200 })
}
```

**Response Format:**
```json
{
  "id": "clx1a2b3c4d5e6f7g8h9",
  "status": "QUOTE_PROVIDED",
  "quotedPrice": 12000,
  "quotedAt": "2025-12-01T10:00:00Z",
  "service": {
    "name": "Fatty Acid Analysis"
  },
  "lab": {
    "name": "Advanced Lab"
  }
}
```

**Key Principles:**
- Return full object (not just ID)
- Include related entities (service, lab) via Prisma `include`
- Use ISO 8601 timestamps (UTC)
- Use camelCase (JavaScript convention)

---

### Standard Error Response

**Pattern:**
```typescript
return NextResponse.json(
  { error: 'Human-readable message' },
  { status: 400 }
)
```

**Error Response Format:**
```json
{
  "error": "Validation error",
  "details": [
    {
      "path": ["quotedPrice"],
      "message": "Price must be positive"
    }
  ]
}
```

**HTTP Status Codes (Semantic):**

| Code | Meaning | When to Use |
|------|---------|-------------|
| **200** | OK | Successful GET, POST, PATCH |
| **201** | Created | Successful resource creation (POST) |
| **400** | Bad Request | Validation error (Zod schema) |
| **401** | Unauthorized | Not authenticated (no session) |
| **403** | Forbidden | Authenticated but wrong role |
| **404** | Not Found | Resource doesn't exist OR access denied |
| **409** | Conflict | State transition error (quote already provided) |
| **500** | Internal Server Error | Unexpected error (database crash) |

**Important: 404 vs 403**
- Use 404 for both "not found" AND "access denied"
- Reason: Prevents information leakage (attacker can't probe for resource existence)

---

## Error Handling Patterns

### Pattern 1: Differentiated Error Handling

**Implementation:**
```typescript
// src/app/api/orders/[id]/quote/route.ts (lines 123-154)
try {
  // Business logic
  const result = await prisma.$transaction(/* ... */)
  return NextResponse.json(result, { status: 200 })

} catch (error) {
  // 1. Zod validation errors (400)
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Validation error', details: error.errors },
      { status: 400 }
    )
  }

  // 2. Transaction errors (custom error messages)
  if (error instanceof Error) {
    if (error.message === 'ORDER_NOT_FOUND') {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (error.message.startsWith('QUOTE_ALREADY_PROVIDED:')) {
      const currentStatus = error.message.split(':')[1]
      return NextResponse.json(
        { error: `Quote already provided (current status: ${currentStatus})` },
        { status: 409 }
      )
    }
  }

  // 3. Prisma errors (database constraints)
  if (error.code === 'P2002') {  // Unique constraint violation
    return NextResponse.json(
      { error: 'Resource already exists' },
      { status: 409 }
    )
  }

  // 4. Unexpected errors (500)
  console.error('Quote provision failed:', error)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

**Why Differentiate?**
- Client needs different UX for different errors
- Validation errors → Show field-level errors
- Conflict errors → Show "please refresh page" message
- Unexpected errors → Show generic "something went wrong" message

---

### Pattern 2: Safe Error Logging

**❌ WRONG (Leaks Sensitive Data):**
```typescript
catch (error) {
  return NextResponse.json(
    { error: error.message },  // ❌ Might contain database query
    { status: 500 }
  )
}
```

**✅ CORRECT (Sanitized Error Messages):**
```typescript
catch (error) {
  console.error('Order creation failed:', error)  // ✅ Log full error server-side

  return NextResponse.json(
    { error: 'Internal server error' },  // ✅ Generic message to client
    { status: 500 }
  )
}
```

**What to Hide from Client:**
- Database connection strings
- SQL queries
- File paths (`/home/user/app/src/...`)
- Internal error codes (`P2002`, `ECONNREFUSED`)

---

### Pattern 3: Custom Error Classes

**Future Implementation:**
```typescript
// lib/errors.ts
export class QuoteAlreadyProvidedError extends Error {
  constructor(public currentStatus: string) {
    super(`Quote already provided (current status: ${currentStatus})`)
    this.name = 'QuoteAlreadyProvidedError'
  }
}

// API route
try {
  // ...
  if (result.count === 0) {
    throw new QuoteAlreadyProvidedError(order.status)
  }
} catch (error) {
  if (error instanceof QuoteAlreadyProvidedError) {
    return NextResponse.json(
      { error: error.message },
      { status: 409 }
    )
  }
}
```

**Benefits:**
- Type-safe error handling
- Cleaner error differentiation (no string matching)
- Easier testing (mock specific error types)

---

## Authentication Middleware Pattern

### Standard Pattern (Applied to All Protected Routes)

**Template:**
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  // Step 1: Authentication check
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Step 2: Authorization check (role verification)
  if (session.user.role !== 'REQUIRED_ROLE') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Step 3: Business logic (user is authenticated AND authorized)
  // ...
}
```

**Why Not Real Middleware?**
- Next.js 14 middleware runs at edge (cannot access database)
- `getServerSession()` requires Prisma (database access)
- Solution: Inline authentication checks (standard pattern repeated in each route)

---

### Multi-Role Endpoints

**Pattern: Allow Multiple Roles**
```typescript
// GET /api/orders - Accessible by CLIENT, LAB_ADMIN, ADMIN
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // No role restriction - filter data based on role
  const whereClause: { clientId?: string; labId?: string } = {}

  if (session.user.role === 'CLIENT') {
    whereClause.clientId = session.user.id  // Only show user's orders
  } else if (session.user.role === 'LAB_ADMIN') {
    const lab = await prisma.lab.findFirst({
      where: { ownerId: session.user.id }
    })
    if (lab) {
      whereClause.labId = lab.id  // Only show lab's orders
    }
  }
  // ADMIN sees all orders (no filter)

  const orders = await prisma.order.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(orders)
}
```

**Key Principle:**
> "Authorization is not binary. Filter data based on role, don't block access entirely."

---

## Ownership Verification Pattern

### Pattern: Combine Resource Lookup + Ownership Check

**Template:**
```typescript
// POST /api/orders/[id]/quote
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  // 1. Role check
  if (session.user.role !== 'LAB_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Ownership check (combined with resource lookup)
  const order = await prisma.order.findFirst({
    where: {
      id: params.id,
      lab: {
        ownerId: session.user.id  // ✅ Implicit ownership check
      }
    }
  })

  if (!order) {
    // Could mean:
    // - Order doesn't exist
    // - Order exists but lab doesn't belong to this user
    // Return 404 for both (don't leak existence)
    return NextResponse.json(
      { error: 'Order not found or access denied' },
      { status: 404 }
    )
  }

  // 3. Business logic (ownership verified)
  // ...
}
```

**Why Single Query?**
- Performance: 1 query instead of 2 (fetch order, then fetch lab)
- Security: Atomic check (no TOCTOU race condition)
- Simplicity: Less code, fewer edge cases

---

### Anti-Pattern: Separate Fetch + Check

**❌ WRONG (Race Condition):**
```typescript
// Step 1: Fetch order
const order = await prisma.order.findUnique({ where: { id: params.id } })

if (!order) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

// Step 2: Fetch lab
const lab = await prisma.lab.findUnique({ where: { id: order.labId } })

// Step 3: Check ownership
if (lab.ownerId !== session.user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })  // ❌ Leaks existence
}
```

**Problems:**
- 3 queries instead of 1 (slow)
- Returns 403 when unauthorized (leaks existence)
- Race condition: Lab ownership could change between step 2 and 3

---

## Transaction Patterns

### Pattern 1: Atomic State Transitions

**Use Case:** Prevent race conditions during quote provision.

**Implementation:**
```typescript
// src/app/api/orders/[id]/quote/route.ts (lines 65-116)
const result = await prisma.$transaction(async (tx) => {
  // Step 1: Atomic update - only succeeds if status = QUOTE_REQUESTED
  const updateResult = await tx.order.updateMany({
    where: {
      id: params.id,
      status: 'QUOTE_REQUESTED'  // ✅ Atomic condition
    },
    data: {
      quotedPrice: validatedData.quotedPrice,
      quotedAt: new Date(),
      status: 'QUOTE_PROVIDED',
      quoteNotes: validatedData.quoteNotes,
      estimatedTurnaroundDays: validatedData.estimatedTurnaroundDays
    }
  })

  // Step 2: Check if update actually happened
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

  // Step 3: Fetch updated order with includes
  const updatedOrder = await tx.order.findUnique({
    where: { id: params.id },
    include: {
      service: true,
      lab: true,
      client: true
    }
  })

  // TODO (Future): Create notification in same transaction
  // await tx.notification.create({
  //   data: {
  //     userId: updatedOrder.clientId,
  //     type: 'QUOTE_PROVIDED',
  //     orderId: updatedOrder.id
  //   }
  // })

  return updatedOrder
})
```

**Why Transaction?**
- **Atomicity:** Quote provision + notification succeed together (or fail together)
- **Isolation:** Other requests see either old state (QUOTE_REQUESTED) or new state (QUOTE_PROVIDED), never intermediate
- **Consistency:** Database remains in valid state (no orphaned quotes)

---

### Pattern 2: Optimistic Concurrency Control

**Use Case:** Prevent lost updates when multiple users edit same resource.

**Future Implementation:**
```prisma
model Order {
  id      String @id
  version Int    @default(0)  // Optimistic lock version
}
```

```typescript
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { version, ...updates } = await req.json()

  const result = await prisma.order.updateMany({
    where: {
      id: params.id,
      version: version  // ✅ Only update if version matches
    },
    data: {
      ...updates,
      version: { increment: 1 }  // Increment version
    }
  })

  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Order was modified by another user. Please refresh and try again.' },
      { status: 409 }
    )
  }

  return NextResponse.json({ success: true })
}
```

**Why Not Used Yet?**
- Current use case: State transitions are one-way (no concurrent edits)
- Future: If order editing becomes collaborative, add version field

---

### Pattern 3: Nested Transactions (Prisma Limitation)

**❌ NOT SUPPORTED by Prisma:**
```typescript
await prisma.$transaction(async (tx) => {
  // Outer transaction

  await tx.$transaction(async (tx2) => {  // ❌ Prisma doesn't support nested transactions
    // Inner transaction
  })
})
```

**Workaround: Flatten Transaction**
```typescript
await prisma.$transaction(async (tx) => {
  // Step 1
  const order = await tx.order.update(/* ... */)

  // Step 2
  const notification = await tx.notification.create(/* ... */)

  // Step 3
  const audit = await tx.auditLog.create(/* ... */)

  // All steps succeed together or fail together
})
```

---

## Validation Patterns (Zod)

### Pattern 1: Shared Validation Schemas

**Location:** `src/lib/validations/`

**Example: Quote Validation**
```typescript
// src/lib/validations/quote.ts (lines 9-29)
export const provideQuoteSchema = z.object({
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

export type ProvideQuoteInput = z.infer<typeof provideQuoteSchema>
```

**Usage in API Route:**
```typescript
import { provideQuoteSchema } from '@/lib/validations/quote'

export async function POST(req: Request) {
  const body = await req.json()

  try {
    const validatedData = provideQuoteSchema.parse(body)  // ✅ Type-safe
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
  }
}
```

**Benefits:**
- **Type Safety:** `validatedData` has type `ProvideQuoteInput`
- **Reusability:** Same schema used in client forms and API routes
- **Documentation:** Schema is self-documenting (min/max values, error messages)

---

### Pattern 2: Conditional Validation (Refine)

**Use Case:** Rejection reason required only when rejecting quote.

**Implementation:**
```typescript
// src/lib/validations/quote.ts (lines 39-56)
export const approveQuoteSchema = z.object({
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

**Test Cases:**
```typescript
// ✅ Valid: Approval without reason
approveQuoteSchema.parse({ approved: true })

// ✅ Valid: Rejection with reason
approveQuoteSchema.parse({
  approved: false,
  rejectionReason: 'Price exceeds our budget'
})

// ❌ Invalid: Rejection without reason
approveQuoteSchema.parse({ approved: false })
// Error: "Rejection reason is required when rejecting quote"
```

---

### Pattern 3: Transform and Sanitize

**Use Case:** Trim whitespace from string inputs.

**Implementation:**
```typescript
quoteNotes: z.string()
  .max(500)
  .optional()
  .transform(val => val?.trim())  // ✅ Auto-trim whitespace
```

**Before/After:**
```typescript
// Input: "  Complex analysis  \n"
// After validation: "Complex analysis"
```

**Why Transform?**
- Data consistency (no leading/trailing whitespace in database)
- Better UX (prevent "  " from passing validation)

---

## Pagination and Filtering

### Pattern: Query Parameter Filtering

**Implementation:**
```typescript
// GET /api/orders?status=QUOTE_PROVIDED&limit=20&offset=0
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  const whereClause: { clientId?: string; status?: string } = {}

  if (session.user.role === 'CLIENT') {
    whereClause.clientId = session.user.id
  }

  if (status) {
    whereClause.status = status as OrderStatus
  }

  const orders = await prisma.order.findMany({
    where: whereClause,
    skip: offset,
    take: limit,
    orderBy: { createdAt: 'desc' }
  })

  const total = await prisma.order.count({ where: whereClause })

  return NextResponse.json({
    data: orders,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  })
}
```

**Response:**
```json
{
  "data": [/* orders */],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### Pattern: Cursor-Based Pagination (Future)

**Why Cursor-Based?**
- Stable pagination (no missing/duplicate items when data changes)
- Better performance for large datasets (no `OFFSET` query)

**Implementation:**
```typescript
// GET /api/orders?cursor=clx1a2b3c4d5e6f7g8h9&limit=20
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const cursor = searchParams.get('cursor')
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  const orders = await prisma.order.findMany({
    take: limit + 1,  // Fetch one extra to determine if there's more
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' }
  })

  const hasMore = orders.length > limit
  const data = hasMore ? orders.slice(0, limit) : orders
  const nextCursor = hasMore ? data[data.length - 1].id : null

  return NextResponse.json({
    data,
    pagination: {
      nextCursor,
      hasMore
    }
  })
}
```

---

## API Design Anti-Patterns

### ❌ Anti-Pattern 1: Mixing GET with Side Effects

**Wrong:**
```typescript
// ❌ BAD: GET request modifies database
export async function GET(req: Request, { params }: { params: { id: string } }) {
  await prisma.order.update({
    where: { id: params.id },
    data: { viewCount: { increment: 1 } }  // ❌ Side effect
  })

  const order = await prisma.order.findUnique({ where: { id: params.id } })
  return NextResponse.json(order)
}
```

**Why Wrong?**
- GET should be idempotent and safe (no side effects)
- Browser prefetching might trigger GET (unintended view count increment)
- Caching breaks (cache serves stale view counts)

**Correct:**
```typescript
// ✅ GOOD: Use POST for state-changing actions
export async function POST(req: Request, { params }: { params: { id: string } }) {
  await prisma.order.update({
    where: { id: params.id },
    data: { viewCount: { increment: 1 } }
  })

  return NextResponse.json({ success: true })
}
```

---

### ❌ Anti-Pattern 2: Nested Resource URLs

**Wrong:**
```typescript
// ❌ BAD: Deeply nested URLs
POST /api/labs/[labId]/services/[serviceId]/orders/[orderId]/quote
```

**Why Wrong?**
- URL too long (hard to read, prone to typos)
- Multiple database lookups (lab → service → order → quote)
- Fragile (if service moves to different lab, URL breaks)

**Correct:**
```typescript
// ✅ GOOD: Shallow URLs with resource ID
POST /api/orders/[orderId]/quote
```

**Reasoning:**
- Order ID is globally unique (no need to include lab/service in URL)
- Ownership verification done server-side (not URL-based)

---

### ❌ Anti-Pattern 3: Exposing Internal IDs in URLs

**Current State (Acceptable for Stage 1-2):**
```
/api/orders/clx1a2b3c4d5e6f7g8h9  // ✅ CUID (random, non-sequential)
```

**Why Acceptable:**
- CUIDs are unpredictable (attacker can't enumerate orders)
- Authorization checks prevent unauthorized access

**Future (Stage 3+):**
```
/api/orders/ORD-2025-000123  // Human-readable order number
```

**Why Better:**
- UX: Clients can reference "Order ORD-2025-000123" in emails
- Still require authorization checks (order number alone doesn't grant access)

---

**Document Owner:** Architecture Mentor
**Review Cadence:** After API changes
**Related Documents:**
- `AUTHENTICATION_AND_AUTHORIZATION.md` - Security patterns
- `PRICING_AND_QUOTATION_SYSTEM.md` - State transition logic
- `DATABASE_ARCHITECTURE.md` - Transaction isolation levels
- `TESTING_PHILOSOPHY.md` - API route testing strategies
