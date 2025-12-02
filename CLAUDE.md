# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Last Updated:** 2025-12-01
**Project:** PipetGo - B2B Lab Testing Marketplace
**Status:** Quotation system implemented, 233 tests passing

---

## Project Overview

PipetGo is a B2B marketplace connecting businesses with ISO 17025 certified laboratory testing services in the Philippines. **This is NOT an e-commerce platform** - it's a Request-for-Quote (RFQ) system where labs provide custom pricing.

**Core Flow:**
```
Client submits RFQ → Lab provides quote → Client approves → Testing proceeds → Results delivered
```

### Technology Stack

- **Frontend:** Next.js 14.2.4 (App Router), React 18.3.1, TypeScript 5.5.2, Tailwind CSS
- **Backend:** Next.js API Routes, NextAuth 4.24.7 (session-based auth)
- **Database:** PostgreSQL (Neon serverless), Prisma 5.15.0
- **Testing:** Vitest 3.2.4, Playwright 1.56.1, React Testing Library 16.3.0
- **File Storage:** UploadThing 7.7.4
- **Analytics:** GoatCounter (privacy-friendly, no cookies)

---

## Common Commands

### Development
```bash
npm run dev                 # Start dev server (localhost:3000)
npm run build              # Production build
npm start                  # Start production server
npm run type-check         # TypeScript validation
npm run lint               # ESLint
```

### Testing
```bash
npm test                   # Run all tests (watch mode)
npm run test:run           # Run tests once (CI mode)
npm run test:ui            # Interactive test UI
npm run test:coverage      # Generate coverage report
npm run test:mock          # Use mock database
npm run test:live          # Use live database
```

### Database
```bash
npm run db:push            # Push schema (development)
npm run db:migrate         # Generate migration (production)
npm run db:seed            # Seed demo data
npm run db:studio          # Open Prisma Studio GUI
npm run db:reset           # ⚠️ DESTRUCTIVE - Reset and reseed
```

### Specialized
```bash
npm run screenshots:portfolio  # Capture UI screenshots for documentation
```

---

## Architecture Overview

### Pricing System (Critical Context)

PipetGo supports three pricing modes via the `PricingMode` enum:

1. **QUOTE_REQUIRED** - Default, always requires lab quote (true B2B)
2. **FIXED** - Instant booking with fixed price (backward compatibility)
3. **HYBRID** - Shows reference price but client can request custom quote

**Order Status Flow:**
```
QUOTE_REQUESTED → QUOTE_PROVIDED → PENDING → ACKNOWLEDGED → IN_PROGRESS → COMPLETED
                      ↓
                QUOTE_REJECTED
```

### Multi-Role Authorization

Three user roles with distinct permissions:

- **CLIENT** - Submit RFQs, approve quotes, view own orders
- **LAB_ADMIN** - Provide quotes, manage lab orders, upload results
- **ADMIN** - Platform oversight, view all activity

**Critical Security Pattern:**
```typescript
// ALWAYS verify role server-side
const session = await getServerSession(authOptions);
if (!session?.user) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

// ALWAYS verify resource ownership
const order = await prisma.order.findFirst({
  where: {
    id: params.id,
    lab: { ownerId: session.user.id } // Ownership check
  }
});
```

### Key Database Models

**User** - Authentication + role management
**Lab** - Laboratory profiles
**LabService** - Test offerings with pricing modes
**Order** - RFQ → Quote → Testing workflow
**Attachment** - File uploads (specs, results)

See `prisma/schema.prisma` for complete schema.

---

## Critical Patterns

### 1. Never Trust Client Input

```typescript
// ❌ WRONG
const { quotedPrice } = await req.json();
await prisma.order.create({ data: { quotedPrice } });

// ✅ CORRECT
const session = await getServerSession(authOptions);
if (session.user.role !== 'LAB_ADMIN') {
  return Response.json({ error: 'Forbidden' }, { status: 403 });
}
// Verify ownership before allowing quote
```

### 2. Combine Authentication + Authorization

```typescript
// Return 404 (not 403) when resource doesn't exist OR user lacks access
const order = await prisma.order.findFirst({
  where: {
    id: orderId,
    lab: { ownerId: session.user.id } // Implicit ownership check
  }
});

if (!order) {
  return Response.json({ error: 'Not found' }, { status: 404 });
}
```

### 3. Use Prisma Singleton

```typescript
// Import from lib/db.ts (NEVER create new PrismaClient)
import { prisma } from '@/lib/db';
```

### 4. Validate All Inputs with Zod

```typescript
import { orderSchema } from '@/lib/validations/order';

const body = await req.json();
const validatedData = orderSchema.parse(body); // Throws if invalid
```

### 5. Use Transactions for Multi-Step Operations

```typescript
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  const notification = await tx.notification.create({
    data: { userId: labOwnerId, orderId: order.id }
  });
  return { order, notification };
});
```

---

## API Endpoints

### Orders
- `GET /api/orders` - List orders (filtered by user role)
- `POST /api/orders` - Create order/RFQ
- `PATCH /api/orders/[id]` - Update order status
- `POST /api/orders/[id]/quote` - Lab admin provides quote
- `POST /api/orders/[id]/approve-quote` - Client approves quote
- `POST /api/orders/[id]/request-custom-quote` - Request custom quote (hybrid mode)

### Services
- `GET /api/services` - List lab services with filters
- `GET /api/services/[id]` - Get single service
- `POST /api/services/bulk` - Bulk operations (admin)

### Authentication
- `/api/auth/[...nextauth]` - NextAuth endpoints
- `POST /api/auth/set-password` - Password management

---

## Testing Strategy

### Test Organization

- `tests/lib/` - Utility function tests
- `tests/lib/validations/` - Zod schema tests
- `src/app/api/*/__tests__/` - API route tests (co-located)

### Dual-Mode Database Testing

Tests can run against either:
- **Mock DB** (`USE_MOCK_DB=true`) - Fast, isolated, uses pg-mem
- **Live DB** (`USE_MOCK_DB=false`) - Real PostgreSQL, integration testing

### Writing Tests (TDD Required)

1. Write failing test first
2. Implement minimal code to pass
3. Refactor while keeping tests green
4. Never commit without all tests passing

---

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes with co-located tests
│   ├── auth/             # Sign in/out pages
│   ├── dashboard/        # Role-based dashboards
│   │   ├── client/       # Client RFQ management
│   │   ├── lab/          # Lab quote provision
│   │   └── admin/        # Platform oversight
│   └── order/            # Order submission flow
│
├── components/
│   ├── ui/               # shadcn/ui components
│   └── analytics/        # GoatCounter tracking
│
├── lib/
│   ├── auth.ts           # NextAuth config
│   ├── db.ts             # Prisma singleton
│   ├── utils.ts          # Utility functions (20+ helpers)
│   └── validations/      # Zod schemas
│
└── types/                # TypeScript definitions

prisma/
├── schema.prisma         # Database schema (source of truth)
└── seed.ts               # Demo data

docs/                     # Business strategy, ADRs, guides
```

---

## Environment Variables

```env
# Required
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."  # openssl rand -base64 32

# File uploads
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="..."

# Analytics (optional, leave empty to disable)
NEXT_PUBLIC_GOATCOUNTER_URL="https://pipetgo.goatcounter.com/count"
```

---

## Error Handling Patterns

### API Routes

```typescript
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = orderSchema.parse(body);

    const order = await prisma.order.create({
      data: { ...validatedData, clientId: session.user.id }
    });

    return Response.json(order, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    if (error.code === 'P2002') {
      return Response.json({
        error: 'Resource already exists'
      }, { status: 409 });
    }

    console.error('Error:', error);
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
```

### Client Components

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(orderSchema),
  defaultValues: { /* ... */ }
});

async function onSubmit(data) {
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Request failed');
    }

    const order = await res.json();
    router.push(`/dashboard/client/orders/${order.id}`);
  } catch (error) {
    setSubmitError(error.message);
  }
}
```

---

## Database Migrations

### Development Workflow
```bash
# Make schema changes in prisma/schema.prisma
npm run db:push  # Push directly (no migration files)
```

### Production Workflow
```bash
npm run db:migrate  # Generate migration file
# Review migration before applying
# Test on staging first
```

### Critical Rules
- ALWAYS test migrations on staging before production
- NEVER run `db:reset` on production (data loss)
- Use transactions for multi-step migrations

---

## Pre-Commit Checklist

Before committing code:

- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes (zero warnings)
- [ ] `npm run test:run` passes (all tests green)
- [ ] Manual testing completed (if UI changes)
- [ ] No debug code (console.log, debugger statements)
- [ ] Environment variables documented (if added)

---

## Deployment (Vercel)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in dashboard
4. Deploy automatically on push to main

**Production Checklist:**
- Run `npm run db:migrate` on production DB before deploy
- Verify NEXTAUTH_SECRET is different from development
- Test file uploads work (UploadThing configured)
- Verify analytics tracking (GoatCounter)

---

## Common Gotchas

### 1. Don't Auto-Populate quotedPrice

```typescript
// ❌ WRONG - E-commerce pattern
const order = await prisma.order.create({
  data: {
    quotedPrice: service.pricePerUnit, // Client didn't approve this
    status: 'PENDING'
  }
});

// ✅ CORRECT - RFQ pattern
const order = await prisma.order.create({
  data: {
    quotedPrice: null, // Awaiting lab quote
    status: 'QUOTE_REQUESTED'
  }
});
```

### 2. Next.js App Router Cache

Server components cache by default. After mutations, you may need:

```typescript
import { revalidatePath } from 'next/cache';

// After order update
revalidatePath('/dashboard/client/orders');
```

### 3. Prisma Decimal Type

```typescript
import { Decimal } from '@prisma/client/runtime/library';

// Convert for JSON serialization
const price = order.quotedPrice?.toNumber() ?? null;
```

---

## Key Documentation

- `prisma/schema.prisma` - Database schema (authoritative source)
- `docs/QUOTATION_SYSTEM_AUDIT_20251013.md` - Business context (outdated status, but good context)
- `docs/Business_Model_Strategy_report_20251015.md` - Revenue strategy
- `docs/SCAFFOLD_GUIDE.md` - Component implementation examples
- `docs/ADR_GOATCOUNTER_LEVEL1_ANALYTICS.md` - Analytics decision

---

## Development Philosophy

- **TDD Required** - Write tests first, always
- **Type Safety** - Full TypeScript, leverage Prisma types
- **Security First** - Never trust client, always verify server-side
- **Simple Solutions** - Avoid over-engineering, solve current problem
- **Clean Separation** - API, UI, and data layers independent
- **Production Patterns** - Architecture supports scaling from day 1

---

## When Starting Work

1. Read this CLAUDE.md for project context
2. Check `prisma/schema.prisma` for current database state
3. Run `npm run test:run` to verify baseline
4. For RFQ/quotation work, understand the three pricing modes
5. For auth work, verify you understand role-based access patterns

---

**Maintained By:** Development Team
**Version:** 1.0 (Quotation system implemented)
