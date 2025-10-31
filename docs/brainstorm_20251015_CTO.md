# 🧠 PipetGo: Technical Architecture & Business Strategy - CTO Perspective
**Generated:** 2025-10-15
**Audience:** CTO / Solo Developer
**Context:** Stage 1 Foundation Complete, Quotation System Refactor Required

> "The CEO knows what to build. You know how to build it. Together you'll figure out if it's worth building."

This document is your technical and strategic guide for taking PipetGo from foundation to launch. It addresses the critical technical decisions, architectural trade-offs, and implementation priorities from a developer's perspective.

---

## 🎯 Part 1: Current State - What You've Built

### Foundation Complete ✅

**Technical Infrastructure:**
- ✅ Next.js 14 (App Router) with TypeScript
- ✅ PostgreSQL database (Neon serverless)
- ✅ Prisma ORM with type-safe queries
- ✅ NextAuth v4 authentication (email-only for now)
- ✅ Zod validation schemas (44 passing tests)
- ✅ Utility functions (67 passing tests, 100% coverage)
- ✅ shadcn/ui base components (8 installed)
- ✅ Vitest testing infrastructure (111 tests passing)

**Architecture Decisions Made:**
- ✅ Monolithic Next.js app (right choice for MVP)
- ✅ Server-side rendering where possible (performance)
- ✅ Type-safe database access (Prisma generates types)
- ✅ Role-based access control (CLIENT, LAB_ADMIN, ADMIN)
- ✅ RESTful API routes (standard, scalable)

**Development Workflow:**
- ✅ TypeScript for type safety
- ✅ ESLint for code quality
- ✅ Prettier for formatting (assumed)
- ✅ Git version control

---

## 🚨 Part 2: Critical Misalignment Discovered

### The Problem (22.5% Alignment Score)

**What CEO Expects:**
> "Quotations are to be expected; can we make it default?"

**What System Currently Does:**
```typescript
// ❌ WRONG: Auto-populates fixed price
const order = await prisma.order.create({
  data: {
    quotedPrice: service.pricePerUnit,  // Instant pricing
    status: 'PENDING'
  }
})
```

**What System Should Do:**
```typescript
// ✅ RIGHT: Wait for lab to provide quote
const order = await prisma.order.create({
  data: {
    quotedPrice: null,                  // No price yet
    status: 'QUOTE_REQUESTED'          // Awaiting quote
  }
})
```

### Impact Assessment

**Files Affected:**
- `src/app/api/orders/route.ts` - Order creation logic
- `src/app/page.tsx` - Homepage shows fixed prices
- `src/app/dashboard/lab/page.tsx` - No quote management UI
- `src/app/dashboard/client/page.tsx` - No quote approval flow
- `prisma/schema.prisma` - Needs `pricing_mode` field
- `prisma/seed.ts` - Creates FIXED pricing services

**Code Rewrite Required:**
- Backend: ~30% (API routes)
- Frontend: ~40% (UI conditionals)
- Database: ~10% (schema additions)
- Tests: ~50% (quotation logic untested)

**Estimated Effort:** 64-80 hours (as documented in QUOTATION_SYSTEM_AUDIT)

---

## 🏗️ Part 3: Technical Refactor Plan (3-Week Sprint)

### Week 1: Database & Backend (16-20 hours)

#### Task 1: Schema Migration (2 hours)
```prisma
// Add to prisma/schema.prisma

enum PricingMode {
  FIXED           // Show price upfront (current behavior)
  QUOTE_REQUIRED  // Hide price, require custom quote
  HYBRID          // Show estimate, allow customization
}

model LabService {
  // ... existing fields
  pricing_mode  PricingMode @default(FIXED)
  // Makes pricePerUnit nullable conditionally
}

enum OrderStatus {
  QUOTE_REQUESTED  // NEW: Client requested quote
  QUOTE_PROVIDED   // NEW: Lab provided custom quote
  PENDING          // Client approved quote, awaiting acknowledgment
  ACKNOWLEDGED     // Lab acknowledged order
  IN_PROGRESS      // Testing in progress
  COMPLETED        // Results uploaded
  CANCELLED        // Order cancelled
}
```

**Commands:**
```bash
npx prisma migrate dev --name add_quotation_system
npx prisma generate
npm run db:seed  # Update seed with mix of pricing modes
```

---

#### Task 2: Order Creation API (4 hours)
```typescript
// src/app/api/orders/route.ts

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const validation = orderCreateSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors },
      { status: 400 }
    )
  }

  // Get service to check pricing mode
  const service = await prisma.labService.findUnique({
    where: { id: validation.data.serviceId }
  })

  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }

  // Determine initial status and price based on pricing mode
  const initialStatus =
    service.pricing_mode === 'QUOTE_REQUIRED'
      ? 'QUOTE_REQUESTED'
      : 'PENDING'

  const initialPrice =
    service.pricing_mode === 'FIXED'
      ? service.pricePerUnit
      : null

  const order = await prisma.order.create({
    data: {
      ...validation.data,
      clientId: session.user.id,
      labId: service.labId,
      status: initialStatus,
      quotedPrice: initialPrice,
      quotedAt: service.pricing_mode === 'FIXED' ? new Date() : null
    },
    include: {
      service: true,
      lab: true,
      client: { select: { id: true, name: true, email: true } }
    }
  })

  return NextResponse.json({ data: order }, { status: 201 })
}
```

---

#### Task 3: Quote Management Endpoints (6 hours)
```typescript
// src/app/api/orders/[id]/quote/route.ts

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { quoteSchema } from '@/lib/validations/quote'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  // Auth check
  if (!session || session.user.role !== 'LAB_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const validation = quoteSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors },
      { status: 400 }
    )
  }

  // Verify order exists and belongs to lab
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { lab: true }
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (order.lab.adminId !== session.user.id) {
    return NextResponse.json(
      { error: 'You can only quote orders for your lab' },
      { status: 403 }
    )
  }

  if (order.status !== 'QUOTE_REQUESTED') {
    return NextResponse.json(
      { error: 'Order is not awaiting quote' },
      { status: 409 }
    )
  }

  // Update order with quote
  const updatedOrder = await prisma.order.update({
    where: { id: params.id },
    data: {
      quotedPrice: validation.data.quotedPrice,
      quotedAt: new Date(),
      status: 'QUOTE_PROVIDED'
    },
    include: {
      service: true,
      lab: true,
      client: { select: { id: true, name: true, email: true } }
    }
  })

  return NextResponse.json({ data: updatedOrder }, { status: 200 })
}
```

```typescript
// src/app/api/orders/[id]/approve-quote/route.ts

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id }
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Only client who created order can approve
  if (order.clientId !== session.user.id) {
    return NextResponse.json(
      { error: 'You can only approve your own orders' },
      { status: 403 }
    )
  }

  if (order.status !== 'QUOTE_PROVIDED') {
    return NextResponse.json(
      { error: 'No quote to approve' },
      { status: 409 }
    )
  }

  const updatedOrder = await prisma.order.update({
    where: { id: params.id },
    data: { status: 'PENDING' },
    include: {
      service: true,
      lab: true
    }
  })

  return NextResponse.json({ data: updatedOrder }, { status: 200 })
}
```

---

#### Task 4: Validation Schemas (2 hours)
```typescript
// src/lib/validations/quote.ts

import { z } from 'zod'

export const quoteSchema = z.object({
  quotedPrice: z.number()
    .positive('Quote must be a positive number')
    .max(1000000, 'Quote exceeds maximum allowed'),
  notes: z.string().optional()
})

export type QuoteInput = z.infer<typeof quoteSchema>
```

---

#### Task 5: Update Seed Data (2 hours)
```typescript
// prisma/seed.ts

const services = [
  // FIXED pricing services (existing behavior)
  {
    name: 'Water Quality Testing',
    pricing_mode: 'FIXED',
    pricePerUnit: 2500,
    // ... rest
  },

  // QUOTE_REQUIRED services (new)
  {
    name: 'XRF Spectroscopy Analysis',
    pricing_mode: 'QUOTE_REQUIRED',
    pricePerUnit: null,  // No fixed price
    description: 'Custom elemental analysis pricing based on sample complexity',
    // ... rest
  },

  // HYBRID services (for future)
  {
    name: 'Tensile Strength Testing',
    pricing_mode: 'HYBRID',
    pricePerUnit: 5000,  // Baseline estimate
    description: 'Base price shown, final quote provided after sample review',
    // ... rest
  }
]
```

---

### Week 2: Frontend & UI (16-20 hours)

#### Task 1: Service Card Component (3 hours)
```typescript
// src/components/features/ServiceCard.tsx

'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { LabService } from '@prisma/client'

export function ServiceCard({ service }: { service: LabService }) {
  const isPriceFixed = service.pricing_mode === 'FIXED'
  const showEstimate = service.pricing_mode === 'HYBRID'

  return (
    <Card>
      <CardHeader>
        <Badge>{service.category}</Badge>
        <CardTitle>{service.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">{service.description}</p>

        <div className="flex items-center justify-between">
          {isPriceFixed && (
            <>
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(service.pricePerUnit)}
              </span>
              <Button>Order Now</Button>
            </>
          )}

          {showEstimate && (
            <>
              <div>
                <span className="text-sm text-gray-500">Starting at</span>
                <span className="text-xl font-bold text-gray-900 block">
                  {formatCurrency(service.pricePerUnit)}
                </span>
              </div>
              <Button variant="outline">Request Quote</Button>
            </>
          )}

          {service.pricing_mode === 'QUOTE_REQUIRED' && (
            <>
              <span className="text-teal-600 font-semibold">Custom Quote</span>
              <Button variant="outline">Request Quote</Button>
            </>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p>Turnaround: {service.turnaroundDays} days</p>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

#### Task 2: Lab Quote Management UI (4 hours)
```typescript
// src/components/features/QuoteForm.tsx

'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface QuoteFormProps {
  orderId: string
  onQuoteSubmitted: () => void
}

export function QuoteForm({ orderId, onQuoteSubmitted }: QuoteFormProps) {
  const [quoteAmount, setQuoteAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/orders/${orderId}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotedPrice: parseFloat(quoteAmount) })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit quote')
      }

      onQuoteSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Alert className="bg-amber-50 border-amber-200">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle>Quote Required</AlertTitle>
      <AlertDescription>
        <form onSubmit={handleSubmit} className="mt-2 space-y-2">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Enter quote amount"
              value={quoteAmount}
              onChange={(e) => setQuoteAmount(e.target.value)}
              disabled={isSubmitting}
              required
              min="0"
              step="0.01"
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Send Quote'}
            </Button>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>
      </AlertDescription>
    </Alert>
  )
}
```

---

#### Task 3: Client Quote Approval UI (4 hours)
```typescript
// src/components/features/QuoteApprovalCard.tsx

'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { Order } from '@prisma/client'

interface QuoteApprovalCardProps {
  order: Order & {
    lab: { name: string }
    service: { name: string }
  }
  onApproved: () => void
  onDeclined: () => void
}

export function QuoteApprovalCard({
  order,
  onApproved,
  onDeclined
}: QuoteApprovalCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/orders/${order.id}/approve-quote`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to approve quote')
      onApproved()
    } catch (err) {
      console.error(err)
      alert('Failed to approve quote')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDecline = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' })
      })
      if (!response.ok) throw new Error('Failed to decline quote')
      onDeclined()
    } catch (err) {
      console.error(err)
      alert('Failed to decline quote')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-teal-200 bg-teal-50">
      <CardHeader>
        <CardTitle>Quote Received</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-2">
          {order.lab.name} has provided a quote for your test request.
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Service: {order.service.name}
        </p>

        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-gray-600">Quoted Price:</span>
          <span className="text-3xl font-bold text-gray-900">
            {formatCurrency(order.quotedPrice!)}
          </span>
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1 bg-teal-500 hover:bg-teal-600"
            onClick={handleApprove}
            disabled={isSubmitting}
          >
            Approve Quote
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDecline}
            disabled={isSubmitting}
          >
            Decline
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

#### Task 4: Update Homepage (2 hours)
```typescript
// src/app/page.tsx

// Replace fixed price display with conditional rendering
{services.map(service => (
  <ServiceCard key={service.id} service={service} />
))}
```

---

#### Task 5: Update Dashboard Pages (3 hours)
```typescript
// src/app/dashboard/lab/page.tsx

// Add QuoteForm for orders with status QUOTE_REQUESTED
{orders
  .filter(order => order.status === 'QUOTE_REQUESTED')
  .map(order => (
    <div key={order.id}>
      <OrderCard order={order} />
      <QuoteForm
        orderId={order.id}
        onQuoteSubmitted={() => router.refresh()}
      />
    </div>
  ))}

// src/app/dashboard/client/page.tsx

// Add QuoteApprovalCard for orders with status QUOTE_PROVIDED
{orders
  .filter(order => order.status === 'QUOTE_PROVIDED')
  .map(order => (
    <QuoteApprovalCard
      key={order.id}
      order={order}
      onApproved={() => router.refresh()}
      onDeclined={() => router.refresh()}
    />
  ))}
```

---

### Week 3: Testing & Polish (12-16 hours)

#### Task 1: Unit Tests (6 hours)
```typescript
// src/lib/validations/__tests__/quote.test.ts

import { describe, it, expect } from 'vitest'
import { quoteSchema } from '../quote'

describe('quoteSchema', () => {
  it('accepts valid quote amounts', () => {
    const result = quoteSchema.safeParse({ quotedPrice: 15000 })
    expect(result.success).toBe(true)
  })

  it('rejects negative amounts', () => {
    const result = quoteSchema.safeParse({ quotedPrice: -100 })
    expect(result.success).toBe(false)
  })

  it('rejects extremely large amounts', () => {
    const result = quoteSchema.safeParse({ quotedPrice: 10000000 })
    expect(result.success).toBe(false)
  })
})

// src/app/api/__tests__/orders-quote.test.ts

import { describe, it, expect, beforeEach } from 'vitest'
import { POST } from '../orders/[id]/quote/route'

describe('POST /api/orders/[id]/quote', () => {
  beforeEach(async () => {
    // Set up test database state
  })

  it('allows lab admin to provide quote', async () => {
    // Mock session as LAB_ADMIN
    const request = new Request('http://localhost:3000/api/orders/test-id/quote', {
      method: 'POST',
      body: JSON.stringify({ quotedPrice: 15000 })
    })

    const response = await POST(request, { params: { id: 'test-id' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.status).toBe('QUOTE_PROVIDED')
    expect(data.data.quotedPrice).toBe(15000)
  })

  it('prevents clients from providing quotes', async () => {
    // Mock session as CLIENT
    // Should return 403
  })

  it('validates quote amount', async () => {
    // Test invalid amounts
    // Should return 400
  })
})
```

---

#### Task 2: Integration Tests (4 hours)
```typescript
// tests/integration/quotation-workflow.test.ts

import { describe, it, expect } from 'vitest'
import { prisma } from '@/lib/db'

describe('Quotation Workflow', () => {
  it('completes full quote-request to approval flow', async () => {
    // 1. Client creates order for QUOTE_REQUIRED service
    const order = await prisma.order.create({
      data: {
        serviceId: 'quote-required-service-id',
        clientId: 'test-client-id',
        labId: 'test-lab-id',
        sampleDescription: 'Test sample',
        status: 'QUOTE_REQUESTED',
        quotedPrice: null
      }
    })

    expect(order.status).toBe('QUOTE_REQUESTED')
    expect(order.quotedPrice).toBeNull()

    // 2. Lab provides quote
    const quotedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        quotedPrice: 15000,
        quotedAt: new Date(),
        status: 'QUOTE_PROVIDED'
      }
    })

    expect(quotedOrder.status).toBe('QUOTE_PROVIDED')
    expect(quotedOrder.quotedPrice).toBe(15000)

    // 3. Client approves quote
    const approvedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'PENDING' }
    })

    expect(approvedOrder.status).toBe('PENDING')
  })
})
```

---

#### Task 3: E2E Tests (Playwright) (4 hours)
```typescript
// tests/e2e/quotation.spec.ts

import { test, expect } from '@playwright/test'

test('complete quotation workflow', async ({ page }) => {
  // 1. Client requests quote
  await page.goto('/services/xrf-analysis')
  await expect(page.locator('text=Custom Quote')).toBeVisible()
  await page.click('button:has-text("Request Quote")')

  await page.fill('[name="sampleDescription"]', 'Steel sample testing')
  await page.click('button[type="submit"]')

  // 2. Verify order created with QUOTE_REQUESTED
  await page.goto('/dashboard/client')
  await expect(page.locator('text=Quote Requested')).toBeVisible()

  // 3. Lab provides quote (simulate lab session)
  // ... lab login flow
  await page.goto('/dashboard/lab')
  await page.fill('[name="quoteAmount"]', '15000')
  await page.click('button:has-text("Send Quote")')
  await expect(page.locator('text=Quote Provided')).toBeVisible()

  // 4. Client approves quote
  // ... client login flow
  await page.goto('/dashboard/client')
  await page.click('button:has-text("Approve Quote")')
  await expect(page.locator('text=Pending')).toBeVisible()
})
```

---

## 🎯 Part 4: Technical Debt & Future Architecture

### Current Technical Debt (Intentional for MVP)

#### 1. Authentication (Email-Only)
**Current:**
```typescript
// No password validation
// No email verification
// No password reset
```

**Stage 2 Upgrade:**
```typescript
// Add bcrypt password hashing
// Add email verification with tokens
// Add password reset flow
// Add rate limiting
```

**Effort:** 2-3 weeks
**Priority:** Before 100 users

---

#### 2. File Upload (Mock URLs)
**Current:**
```typescript
// Result files are just URLs (no actual storage)
const attachment = {
  url: 'https://example.com/results/mock.pdf',
  type: 'RESULT'
}
```

**Stage 2 Upgrade:**
```typescript
// Use UploadThing or AWS S3
import { UploadButton } from '@uploadthing/react'

// Virus scanning
// Signed URLs (temporary access)
// File size limits
// File type validation
```

**Effort:** 1-2 weeks
**Priority:** Before production launch

---

#### 3. Email Notifications (None)
**Current:**
```typescript
// No notifications, users check dashboard manually
```

**Stage 2 Upgrade:**
```typescript
// Use SendGrid or Resend
// Transactional emails:
//   - Quote received
//   - Quote provided
//   - Results uploaded
//   - Order status changes
```

**Effort:** 1 week
**Priority:** Before 10 customers

---

#### 4. Payment Processing (None)
**Current:**
```typescript
// No payment integration
// Manual billing/invoicing
```

**Stage 2 Upgrade:**
```typescript
// Stripe or Paymongo integration
// Invoice generation
// Payment tracking
// Subscription management (if applicable)
```

**Effort:** 3-4 weeks
**Priority:** After quotation refactor

---

### Architectural Considerations for Scale

#### When to Migrate from Monolith?

**Current: Monolithic Next.js App**
```
Next.js (Single Deployment)
├── Frontend (React)
├── API Routes (Node.js)
├── Auth (NextAuth)
└── Database (PostgreSQL)
```

**Pros:**
- Simple to develop and deploy
- Low latency (everything colocated)
- Easy to reason about

**Cons:**
- Can't scale components independently
- All features share same resources

**When to Extract Services:**

**Candidate 1: Email Notifications (First to Extract)**
- Independent from core business logic
- Can fail without breaking app
- Easy to queue-based architecture

**Effort:** 1-2 weeks
**Trigger:** 100+ orders/day (email volume high)

---

**Candidate 2: File Processing/Storage**
- CPU-intensive (PDF generation, virus scanning)
- Independent from request/response cycle
- Isolated failure domain

**Effort:** 2-3 weeks
**Trigger:** 50+ file uploads/day

---

**Candidate 3: Analytics/Reporting**
- OLAP queries slow down OLTP database
- Can use different database (ClickHouse, BigQuery)
- Batch processing (doesn't need real-time)

**Effort:** 3-4 weeks
**Trigger:** Dashboard queries take >2 seconds

---

**Rule of Thumb:** Don't extract until:
- Feature is a proven bottleneck (monitoring shows it)
- You've tried vertical scaling first (bigger database, caching)
- You have revenue to justify complexity ($50k+ MRR)

---

## 📊 Part 5: Monitoring & Observability (Stage 2)

### What to Monitor (After Launch)

#### Application Performance
```typescript
// Add performance monitoring
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0
})

// Track API route performance
Sentry.startTransaction({
  name: 'POST /api/orders',
  op: 'http.server'
})
```

#### Database Performance
```sql
-- Slow query log (PostgreSQL)
ALTER DATABASE pipetgo SET log_min_duration_statement = 1000;

-- Monitor connection pool
SELECT * FROM pg_stat_activity;
```

#### User Behavior
```typescript
// Posthog or Mixpanel
analytics.track('quote_requested', {
  serviceId: service.id,
  category: service.category,
  userId: session.user.id
})

analytics.track('quote_provided', {
  orderId: order.id,
  quotedPrice: order.quotedPrice,
  labId: order.labId
})

analytics.track('quote_approved', {
  orderId: order.id,
  timeToApproval: timeDiff(order.quotedAt, new Date())
})
```

---

### Error Tracking (Stage 2)

**Recommended:** Sentry (free tier: 5k errors/month)

```typescript
// Automatic error capture
try {
  await prisma.order.create({ ... })
} catch (error) {
  Sentry.captureException(error, {
    tags: { route: '/api/orders', method: 'POST' },
    user: { id: session.user.id, email: session.user.email }
  })
  throw error
}
```

---

## 🚀 Part 6: Development Workflow & Best Practices

### Git Workflow (Recommended)

```bash
# Feature branch workflow
git checkout -b feature/quotation-refactor

# Small, focused commits
git add src/app/api/orders/route.ts
git commit -m "feat: add quote-required order creation logic"

git add src/components/features/QuoteForm.tsx
git commit -m "feat: add lab quote submission form"

# Push to remote (backup + collaboration)
git push origin feature/quotation-refactor

# Merge to main when complete
git checkout main
git merge feature/quotation-refactor
git push origin main
```

---

### Code Review Checklist (Self-Review)

Before committing:
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Tests pass (`npm run test:run`)
- [ ] Linter passes (`npm run lint`)
- [ ] Manual testing done (run dev server)
- [ ] No console.logs left in production code
- [ ] Error handling added (try/catch, validation)
- [ ] Comments added for complex logic

---

### Testing Strategy (TDD Approach)

**1. Write Test First (Red)**
```typescript
describe('order creation with quote required', () => {
  it('creates order with QUOTE_REQUESTED status', async () => {
    const order = await createOrder({
      serviceId: 'quote-required-service',
      sampleDescription: 'Test sample'
    })
    expect(order.status).toBe('QUOTE_REQUESTED')
    expect(order.quotedPrice).toBeNull()
  })
})
```

**2. Write Code to Pass (Green)**
```typescript
async function createOrder(data) {
  return prisma.order.create({
    data: {
      ...data,
      status: 'QUOTE_REQUESTED',
      quotedPrice: null
    }
  })
}
```

**3. Refactor While Tests Pass (Refactor)**
```typescript
async function createOrder(data) {
  const service = await prisma.service.findUnique({
    where: { id: data.serviceId }
  })

  return prisma.order.create({
    data: {
      ...data,
      status: service.pricing_mode === 'QUOTE_REQUIRED'
        ? 'QUOTE_REQUESTED'
        : 'PENDING',
      quotedPrice: service.pricing_mode === 'FIXED'
        ? service.pricePerUnit
        : null
    }
  })
}
```

---

### ADHD/Neurodivergent-Friendly Workflow

**Before Starting a Session:**
1. Check `IMPLEMENTATION_STATUS.md` - Where am I?
2. Review `QUOTATION_SYSTEM_AUDIT_20251013.md` - What's next?
3. Pick ONE small task (timeboxed: 1-2 hours max)

**During Implementation:**
- Focus on ONE file at a time
- Commit after each working change (external memory)
- Test immediately (don't accumulate untested code)
- Take breaks when stuck (Pomodoro: 25 work, 5 break)

**When Overwhelmed:**
- Reference `SCAFFOLD_GUIDE.md` for copy-paste examples
- Ask Claude Code for specific help
- Break task into smaller sub-tasks
- It's okay to leave TODOs and come back later

**Cognitive Load Management:**
- Use code examples as templates (adapt, don't create from scratch)
- Reference documentation liberally (no need to memorize)
- Keep TODO.md file for context switching

```bash
# Before ending session
echo "## Next Session ($(date))" >> TODO.md
echo "- [ ] Finish implementing quote approval endpoint" >> TODO.md
echo "- Current blocker: Not sure how to validate session" >> TODO.md

# Next session
cat TODO.md  # Remember where you left off
```

---

## 🎯 Part 7: The 90-Day Technical Roadmap

### Month 1: Quotation System Refactor (Current Priority)

**Week 1: Backend (20 hours)**
- [ ] Day 1-2: Schema migration + seed update (4 hours)
- [ ] Day 3-4: Order creation API update (6 hours)
- [ ] Day 5-6: Quote management endpoints (6 hours)
- [ ] Day 7: Validation schemas + tests (4 hours)

**Week 2: Frontend (20 hours)**
- [ ] Day 1-2: Service card component (6 hours)
- [ ] Day 3-4: Lab quote management UI (8 hours)
- [ ] Day 5-6: Client quote approval UI (6 hours)

**Week 3: Testing & Deployment (16 hours)**
- [ ] Day 1-2: Unit + integration tests (8 hours)
- [ ] Day 3: E2E tests (4 hours)
- [ ] Day 4: Bug fixes + polish (4 hours)

**Success Criteria:**
- [ ] All tests pass (new + existing)
- [ ] Can create order for QUOTE_REQUIRED service
- [ ] Lab can provide custom quote
- [ ] Client can approve/decline quote
- [ ] Deployed to staging environment

---

### Month 2: Production Features (Authentication, File Upload)

**Week 1-2: Authentication Upgrade (30 hours)**
- [ ] Password hashing (bcrypt)
- [ ] Email verification flow
- [ ] Password reset flow
- [ ] Rate limiting

**Week 3-4: File Upload (20 hours)**
- [ ] UploadThing integration
- [ ] Virus scanning
- [ ] File type validation
- [ ] Result download for clients

**Success Criteria:**
- [ ] Users verify emails before accessing platform
- [ ] Labs can upload real result files
- [ ] Clients can download results
- [ ] No mock URLs in production

---

### Month 3: Notifications & Payment Prep (40 hours)

**Week 1-2: Email Notifications (20 hours)**
- [ ] SendGrid/Resend setup
- [ ] Quote received email
- [ ] Quote provided email
- [ ] Results uploaded email
- [ ] Order status change emails

**Week 3-4: Payment Integration Research (20 hours)**
- [ ] Stripe vs Paymongo evaluation
- [ ] Design payment flow (upfront? after results?)
- [ ] Invoice generation
- [ ] Implement basic integration

**Success Criteria:**
- [ ] All stakeholders receive email notifications
- [ ] Payment flow designed (not necessarily implemented)
- [ ] Ready for pilot launch

---

## 💰 Part 8: Technical Cost Analysis

### Infrastructure Costs (Monthly)

**Development (Current):**
- Neon Database (Free tier): ₱0
- Vercel Hosting (Free tier): ₱0
- UploadThing (Free tier): ₱0
- SendGrid (Free tier): ₱0
- **Total:** ₱0/month

**Production (Stage 1: 0-50 customers):**
- Neon Database (Paid tier): ₱500/month
- Vercel Hosting (Pro): ₱1,000/month
- UploadThing (Paid tier): ₱500/month
- SendGrid (Paid tier): ₱1,000/month
- Domain + SSL: ₱100/month
- **Total:** ~₱3,000/month

**Production (Stage 2: 50-200 customers):**
- Neon Database (Business tier): ₱2,000/month
- Vercel Hosting (Pro): ₱1,000/month
- UploadThing (Business): ₱2,000/month
- SendGrid (Business): ₱2,000/month
- Sentry (Error tracking): ₱1,000/month
- Posthog (Analytics): ₱1,000/month
- **Total:** ~₱9,000/month

**Break-Even Analysis:**
```
If charging ₱500/month per customer:
- Stage 1: 6 customers to break even (₱3,000 costs)
- Stage 2: 18 customers to break even (₱9,000 costs)
```

---

### Development Time Investment

**Already Invested:**
- Foundation (TypeScript, Prisma, Auth): ~40 hours
- Testing infrastructure: ~10 hours
- UI components: ~15 hours
- Documentation: ~20 hours
- **Total:** ~85 hours

**Remaining for MVP:**
- Quotation refactor: ~60 hours (this doc)
- Authentication upgrade: ~30 hours
- File upload: ~20 hours
- Email notifications: ~20 hours
- Testing + polish: ~20 hours
- **Total:** ~150 hours

**Time to Production-Ready MVP:**
- At 20 hrs/week: ~7-8 weeks
- At 40 hrs/week: ~4 weeks
- At 60 hrs/week: ~2.5 weeks

---

## 🔍 Part 9: CEO Collaboration Guide

### What CEO Needs from You

**1. Technical Feasibility Assessments**
When CEO says: "Can we add [feature]?"

Your response framework:
- **Effort:** Small (1-2 days) | Medium (1 week) | Large (2+ weeks)
- **Dependencies:** What needs to be built first?
- **Trade-offs:** What gets delayed if we do this?
- **Risks:** What could go wrong?

Example:
> CEO: "Can we add real-time notifications?"
>
> You: "Yes, but Medium effort (1 week). Requires WebSocket setup. Trade-off: Delays payment integration by 1 week. Risk: Adds complexity to debugging. Recommend: Do email notifications first (same user value, less complexity)."

---

**2. Progress Updates (Weekly)**
Keep CEO informed without overwhelming:

**Format:**
```
Week of [Date]:
✅ Completed:
- Backend quote endpoints (6 hours)
- Lab quote form UI (4 hours)

🚧 In Progress:
- Client quote approval UI (2 hours done, 4 remaining)

⏸️ Blocked:
- None

📅 Next Week:
- Finish quote approval UI
- Write E2E tests
- Deploy to staging
```

---

**3. Risk Escalation**
When to escalate to CEO:

- **Architecture decision:** "Do we build file upload ourselves or use UploadThing?" (affects budget)
- **Security concern:** "Current auth flow has vulnerability X" (affects launch)
- **Scope creep:** "Feature Y will take 3x longer than expected" (affects timeline)
- **Technical debt:** "We need to refactor Z before adding features" (affects roadmap)

---

### What You Need from CEO

**1. Business Requirements Clarity**
Ask:
- "What's the #1 user problem we're solving this sprint?"
- "If we can only build one feature this month, which one?"
- "What does success look like?" (metrics, user feedback)

**2. User Access for Testing**
Request:
- "Can you connect me with 3 labs for user testing?"
- "Can we do a 30-min demo with a potential customer?"
- "What questions should I ask during testing?"

**3. Decision-Making Authority**
Clarify:
- "Can I choose tech stack for [component]?"
- "Do I need approval for third-party services <₱5k/month?"
- "Can I prioritize tech debt over features if needed?"

---

## 🎯 Part 10: Personal Development Plan

### Skills to Level Up (For This Project)

**High Priority (Need Now):**
1. **Next.js App Router:** Understand RSC, server actions, route handlers
2. **Prisma Advanced:** Transactions, migrations, performance optimization
3. **TypeScript:** Generics, type inference, utility types
4. **Testing:** E2E testing with Playwright, mocking strategies
<!-- commented out OAuth related code for beta testing -->
**Medium Priority (Need in 3 Months):**
1. **Authentication:** OAuth flows, JWT, session management
2. **File Upload:** S3, signed URLs, streaming
3. **Email:** Transactional emails, templates, deliverability
4. **Payment Processing:** Stripe API, webhooks, subscriptions

**Low Priority (Nice to Have):**
1. **DevOps:** Docker, CI/CD, monitoring
2. **Performance:** Caching strategies, database optimization
3. **Security:** OWASP top 10, penetration testing

---

### Learning Resources (Curated)

**Next.js:**
- Official docs: https://nextjs.org/docs
- Lee Robinson's YouTube channel
- Next.js 14 App Router course (6 hours)

**Prisma:**
- Official docs: https://prisma.io/docs
- Prisma schema best practices
- Database performance guide

**Testing:**
- Vitest docs: https://vitest.dev
- Playwright docs: https://playwright.dev
- Kent C. Dodds' testing courses

**General:**
- Theodorus Clarence's blog (Next.js tips)
- Josh Comeau's blog (React patterns)
- Web Dev Simplified (YouTube)

---

## 🚀 Part 11: Your Immediate Next Actions

### This Week (October 15-22)

**Day 1-2 (Monday-Tuesday):**
- [ ] Set up feature branch: `git checkout -b feature/quotation-system`
- [ ] Run database migration (add `pricing_mode`, update `OrderStatus`)
- [ ] Update seed.ts with mix of FIXED/QUOTE_REQUIRED services
- [ ] Test locally: `npm run db:seed`

**Day 3-4 (Wednesday-Thursday):**
- [ ] Update `/api/orders` route (conditional order creation)
- [ ] Create `/api/orders/[id]/quote` endpoint
- [ ] Create `/api/orders/[id]/approve-quote` endpoint
- [ ] Write unit tests for new endpoints

**Day 5-7 (Friday-Sunday):**
- [ ] Build `ServiceCard` component (conditional pricing)
- [ ] Build `QuoteForm` component (lab dashboard)
- [ ] Build `QuoteApprovalCard` component (client dashboard)
- [ ] Test locally: Complete quote workflow manually

---

### Next Week (October 23-29)

**Week 2: Frontend Integration + Testing**
- [ ] Integrate components into dashboard pages
- [ ] Write E2E test for quote workflow
- [ ] Fix bugs found during testing
- [ ] Deploy to staging environment
- [ ] Show CEO the working quote flow

---

### By End of Month (October 30)

**Milestone: Quotation System Complete**
- [ ] All tests passing (unit + integration + E2E)
- [ ] Deployed to staging
- [ ] User acceptance testing with CEO (act as lab + client)
- [ ] Ready for next sprint (authentication upgrade)

---

## 💭 Final Thoughts: You've Got This

**You're 85 Hours In:**
You've built a solid foundation. TypeScript, Prisma, NextAuth, Zod, testing infrastructure - that's ~40% of the work.

**The Refactor is 60 Hours:**
That's 3 weeks at 20 hrs/week. Achievable. The plan is detailed. The code examples are there.

**CEO is Counting on You:**
She knows the lab industry. You know web development. Together you're building something real.

**The Hard Part Isn't Technical:**
The hard part is shipping. Finishing. Not getting lost in perfectionism.

**Your Advantage:**
- You're transitioning from geodesy (you understand data flows, automation, problem-solving)
- You have comprehensive documentation (no guessing)
- You have code scaffolds (adapt, don't create from scratch)
- You have a clear 3-week plan (follow it)

**This Week's Mantra:**
"Ship, don't perfect. Test, then iterate. Progress over perfection."

---

**Now go build it.** 🚀

---

*P.S. - Keep this document open while coding. Reference it when stuck. Update IMPLEMENTATION_STATUS.md weekly.*

*P.P.S. - You're not alone. Claude Code is here. CEO is here. You're building something that will help real labs and real businesses.*

*P.P.P.S. - The quotation refactor is like fixing a GNSS processing pipeline - you've debugged complex systems before. This is the same skill set, just different tools.*
