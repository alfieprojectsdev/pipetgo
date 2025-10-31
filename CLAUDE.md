# PipetGo - Project Guide for Claude Code

**Last Updated:** 2025-10-25
**Project Stage:** Stage 1 MVP Complete - Stage 2 Quotation Redesign Required
**Critical Context:** B2B Quotation Marketplace (NOT E-commerce)

---

## 🎯 Project Mission

**PipetGo** is a B2B marketplace connecting businesses with ISO 17025 certified laboratory testing services across the Philippines. **Think "Alibaba RFQ for lab testing"** - NOT an instant-checkout e-commerce platform.

**Core Value Proposition:**
```
Client submits RFQ (Request for Quote) → Lab reviews requirements →
Lab provides custom pricing → Client approves quote → Testing proceeds →
Certified results delivered
```

**⚠️ CRITICAL BUSINESS CONTEXT (October 2025):**

The system was initially built as **e-commerce** (instant fixed pricing) but the CEO expects **B2B quotation workflow**. See `docs/QUOTATION_SYSTEM_AUDIT_20251013.md` for full analysis.

**Current Alignment Score:** 🔴 20% - Major redesign required

**CEO Directive:**
> "Quotations are to be expected; can we make it default?"

---

## Root Instance Coordination

This project is coordinated by the **root-level Claude instance** in `/home/ltpt420/repos/claude-config/`.

### Before Starting Work in This Project

**ALWAYS perform these checks:**

1. ✅ Check root instance status: `/home/ltpt420/repos/claude-config/ROOT_INSTANCE.md`
2. ✅ Read shared alerts: `/home/ltpt420/repos/claude-config/coordination/shared-alerts.md`
3. ✅ Check priorities: `/home/ltpt420/repos/claude-config/coordination/priority-queue.md`
4. ✅ Update pipetgo status: `/home/ltpt420/repos/claude-config/coordination/project-status/pipetgo-status.md`

### Root Instance Roles

**Coordination:** Manages priorities and resolves conflicts across all projects (parkboard, pipetgo, carpool-app)

**Development:** Creates new agents/commands that get deployed to this project

**Documentation:** Maintains agent standards and prompt engineering patterns

### When to Escalate to Root Instance

- **Critical failures** affecting multiple projects or production
- **Need for new agents/commands** that could benefit other projects (e.g., B2B quotation patterns)
- **Pattern discoveries** that should be generalized (add to prompt-engineering.md)
- **Cross-project coordination** required (shared resources, dependencies)
- **Blocking issues** that affect project priorities

### Communication Format

**For urgent issues, create an alert in shared-alerts.md:**

```markdown
### YYYY-MM-DD HH:MM: [Brief Description]

**Priority:** URGENT
**Project:** pipetgo
**Impact:** [what's affected]
**Action Required:** [specific action]
```

**For status updates, modify pipetgo-status.md:**

```markdown
**Active Instances:** [count]
**Current Work:** [description]
**Blockers:** [any blockers]
**ETA:** [completion estimate]
```

---

## Technology Stack

**Frontend:**
- Next.js 14.2.4 (App Router, React Server Components)
- React 18.3.1
- TypeScript 5.5.2
- Tailwind CSS 3.4.4
- shadcn/ui components

**Backend:**
- Next.js API Routes (App Router)
- Prisma 5.15.0 (PostgreSQL ORM)
- NextAuth 4.24.7 (session-based auth)
- Zod 3.23.8 (runtime validation)

**Database:**
- PostgreSQL (Neon serverless)
- Prisma schema with quotation support ✅

**Testing:**
- Vitest 3.2.4
- React Testing Library 16.3.0
- 111 passing tests (utilities + validation only)

**File Storage:**
- UploadThing 7.7.4 (PDF results, sample specs)

---

## Project Structure

```
pipetgo/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── api/               # Backend API routes
│   │   │   ├── orders/        # ⚠️ NEEDS REFACTOR (e-commerce logic)
│   │   │   ├── services/      # Service catalog
│   │   │   └── labs/          # Lab profiles
│   │   ├── dashboard/         # Role-based dashboards
│   │   │   ├── client/        # Client RFQ tracking
│   │   │   ├── lab/           # Lab quote management
│   │   │   └── admin/         # Platform oversight
│   │   ├── auth/              # Authentication pages
│   │   ├── order/             # ⚠️ NEEDS REFACTOR (shows fixed prices)
│   │   └── page.tsx           # Homepage
│   │
│   ├── components/
│   │   └── ui/                # shadcn/ui base components
│   │
│   ├── lib/
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── utils.ts           # Utility functions (20+ helpers)
│   │   └── validations/       # Zod schemas
│   │
│   └── types/
│       └── index.ts           # TypeScript definitions
│
├── prisma/
│   ├── schema.prisma          # Database schema (quotation-ready ✅)
│   └── seed.ts                # Demo data
│
├── docs/                      # Comprehensive documentation (15,000+ lines)
│   ├── QUOTATION_SYSTEM_AUDIT_20251013.md  # 🔴 READ THIS FIRST
│   ├── SCAFFOLD_GUIDE.md      # Implementation examples
│   ├── SITEMAP_AND_USER_FLOWS_20251013.md
│   └── Business_Model_Strategy_report_20251015.md
│
└── tests/
    └── lib/                   # 111 passing tests
```

---

## Database Schema

**ALWAYS reference:** `prisma/schema.prisma` (single source of truth)

### Key Models

#### User & Authentication
```prisma
enum UserRole {
  CLIENT      // Submits RFQs, approves quotes
  LAB_ADMIN   // Reviews RFQs, provides custom quotes
  ADMIN       // Platform oversight
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  role          UserRole @default(CLIENT)

  ownedLabs     Lab[]
  clientOrders  Order[]  @relation("ClientOrders")
}
```

#### Lab Services
```prisma
model LabService {
  id             String   @id @default(cuid())
  labId          String
  name           String
  description    String?
  category       String
  pricePerUnit   Decimal? // ✅ NULLABLE - allows quote-only services
  unitType       String   @default("per_sample")
  turnaroundDays Int?
  active         Boolean  @default(true)

  // ⚠️ MISSING: pricing_mode field (FIXED | QUOTE_REQUIRED | HYBRID)
}
```

**Critical Pattern:**
- `pricePerUnit` being `null` means service requires custom quote
- `pricePerUnit` with value allows instant pricing (optional for hybrid model)

#### Orders (RFQ Workflow)
```prisma
enum OrderStatus {
  PENDING        // Initial RFQ submission
  ACKNOWLEDGED   // Lab acknowledged, reviewing
  IN_PROGRESS    // Testing underway
  COMPLETED      // Results delivered
  CANCELLED

  // ⚠️ MISSING: QUOTE_REQUESTED, AWAITING_QUOTE, QUOTE_APPROVED
}

model Order {
  id                  String      @id @default(cuid())
  clientId            String
  labId               String
  serviceId           String
  status              OrderStatus @default(PENDING)

  clientDetails       Json        // Contact info
  sampleDescription   String      // What to test
  specialInstructions String?     // Custom requirements

  quotedPrice         Decimal?    // ✅ Lab's custom quote
  quotedAt            DateTime?   // ✅ When quote was provided

  acknowledgedAt      DateTime?
  completedAt         DateTime?
}
```

**Critical Quotation Fields:**
- `quotedPrice` - Lab-provided custom price (NOT auto-populated from `pricePerUnit`)
- `quotedAt` - Timestamp when quote was sent to client

**⚠️ Current Implementation Issue:**
Order creation logic auto-populates `quotedPrice` from `pricePerUnit` (e-commerce behavior). This needs refactoring to support quotation workflow.

#### Attachments (Sample Specs & Results)
```prisma
model Attachment {
  id             String   @id @default(cuid())
  orderId        String
  uploadedById   String
  fileName       String
  fileUrl        String   // UploadThing CDN URL
  attachmentType String   // 'specification', 'result', 'certificate'
}
```

---

## Multi-Role Authorization Patterns

### Role-Based Access Control (RBAC)

**Implementation Pattern (Server-Side Verification):**
```typescript
// ALWAYS verify role server-side (NEVER trust client)
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'LAB_ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Proceed with lab-admin-only logic
}
```

**Critical Security Principle:**
- ✅ Server-side role verification required for ALL API routes
- ❌ NEVER trust `req.body.userId` or `req.body.role` from client
- ✅ ALWAYS use `session.user.id` from NextAuth session

### Resource Ownership Verification

**Pattern: Verify user owns resource before modification:**
```typescript
// Example: Lab admin updating order status
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  // 1. Verify authentication
  if (!session?.user || session.user.role !== 'LAB_ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Fetch resource with ownership check
  const order = await prisma.order.findFirst({
    where: {
      id: params.id,
      lab: {
        ownerId: session.user.id  // ✅ Verify lab belongs to this user
      }
    }
  });

  if (!order) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  // 3. Proceed with update
  const updated = await prisma.order.update({
    where: { id: params.id },
    data: { status: 'ACKNOWLEDGED' }
  });

  return Response.json(updated);
}
```

**Critical Pattern:**
- ✅ Combine resource lookup with ownership check in single query
- ✅ Return 404 (not 403) when resource doesn't exist OR user doesn't own it
- ❌ NEVER fetch resource first, then check ownership separately (timing attack risk)

---

## Critical Business Logic: Quotation Workflow

### Current State (E-commerce) vs Required State (RFQ)

**❌ Current Implementation (WRONG):**
```typescript
// src/app/api/orders/route.ts (current)
const service = await prisma.labService.findUnique({ where: { id: serviceId } });

const order = await prisma.order.create({
  data: {
    clientId: session.user.id,
    serviceId,
    quotedPrice: service.pricePerUnit,  // ❌ Auto-populates fixed price
    quotedAt: new Date(),               // ❌ Instant quote timestamp
    status: 'PENDING'
  }
});
```

**✅ Required Implementation (CORRECT):**
```typescript
// Future refactor: Quotation-first workflow
const service = await prisma.labService.findUnique({ where: { id: serviceId } });

// Scenario 1: Quote-required service
if (!service.pricePerUnit) {
  const order = await prisma.order.create({
    data: {
      clientId: session.user.id,
      serviceId,
      quotedPrice: null,        // ✅ No price yet (awaiting lab quote)
      quotedAt: null,           // ✅ No quote timestamp yet
      status: 'QUOTE_REQUESTED' // ⚠️ New status needed in enum
    }
  });

  // TODO: Notify lab admin of new RFQ
  return Response.json({ order, requiresQuote: true });
}

// Scenario 2: Hybrid mode (fixed price available, but allow custom quote)
// Allow client to choose: instant booking OR request custom quote
```

**Critical Requirement:**
When @database-manager or @architect designs quotation system, it MUST:
1. Add `QUOTE_REQUESTED`, `QUOTE_PROVIDED`, `QUOTE_APPROVED` to OrderStatus enum
2. Prevent auto-population of `quotedPrice` from `pricePerUnit`
3. Create notification system for lab admins when RFQ submitted
4. Add quote approval workflow for clients

---

## API Endpoints

### Current Endpoints (E-commerce Model)

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/services` | GET | Fetch lab services | ✅ Working |
| `/api/orders` | GET, POST | Order management | ⚠️ Needs refactor |
| `/api/orders/[id]` | PATCH | Update order status | ⚠️ Needs refactor |
| `/api/auth/[...nextauth]` | * | NextAuth authentication | ✅ Working |

### Required Endpoints (RFQ Model)

**New endpoints needed for quotation workflow:**
- `POST /api/orders/[id]/quote` - Lab admin provides custom quote
- `POST /api/orders/[id]/approve-quote` - Client approves quote
- `POST /api/orders/[id]/request-custom-quote` - Client requests custom quote (hybrid mode)

---

## Testing Strategy

### Test Commands

```bash
npm run test              # Run all tests (Vitest)
npm run test:ui           # Interactive test UI
npm run test:coverage     # Generate coverage report
npm run test:run          # CI mode (non-watch)
npm run type-check        # TypeScript type checking
npm run lint              # ESLint
```

### Current Test Coverage

**✅ Existing Tests (111 passing):**
- `tests/lib/utils.test.ts` - Utility functions
- `tests/lib/validations/*.test.ts` - Zod schemas

**⚠️ Missing Tests (Critical for Quotation System):**
- Order creation with `quotedPrice = null`
- Quote provision workflow (lab admin → client)
- Quote approval workflow (client → lab)
- Authorization checks (role-based access)
- Resource ownership verification

### TDD Workflow for Quotation Redesign

**ALWAYS follow this order:**

1. **Write failing test first:**
```typescript
// tests/api/orders/quotation.test.ts
describe('POST /api/orders - Quotation Mode', () => {
  it('should create order without quotedPrice when service has no pricePerUnit', async () => {
    const service = await createService({ pricePerUnit: null });
    const response = await POST('/api/orders', {
      serviceId: service.id,
      clientDetails: { /* ... */ }
    });

    expect(response.status).toBe(201);
    expect(response.data.quotedPrice).toBeNull();  // ✅ No auto-population
    expect(response.data.status).toBe('QUOTE_REQUESTED');
  });
});
```

2. **Run test (it fails):**
```bash
npm run test:run
```

3. **Implement minimal code to pass test:**
```typescript
// src/app/api/orders/route.ts
export async function POST(req: Request) {
  const service = await prisma.labService.findUnique({ where: { id: serviceId } });

  const order = await prisma.order.create({
    data: {
      clientId: session.user.id,
      serviceId,
      quotedPrice: service.pricePerUnit ? service.pricePerUnit : null,  // ✅ Conditional
      status: service.pricePerUnit ? 'PENDING' : 'QUOTE_REQUESTED'
    }
  });

  return Response.json(order, { status: 201 });
}
```

4. **Verify test passes:**
```bash
npm run test:run
```

5. **Refactor while keeping tests green**

---

## Error Handling Patterns

### API Route Error Handling

**Standard Pattern (NextAuth Session + Zod Validation):**
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { orderSchema } from '@/lib/validations/order';

export async function POST(req: Request) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate request body
    const body = await req.json();
    const validatedData = orderSchema.parse(body);  // Throws if invalid

    // 3. Business logic
    const order = await prisma.order.create({
      data: {
        ...validatedData,
        clientId: session.user.id
      }
    });

    return Response.json(order, { status: 201 });

  } catch (error) {
    // 4. Differentiated error handling
    if (error instanceof z.ZodError) {
      return Response.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    if (error.code === 'P2002') {  // Prisma unique constraint
      return Response.json({
        error: 'Resource already exists'
      }, { status: 409 });
    }

    console.error('Order creation failed:', error);
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
```

**Critical Principles:**
- ✅ ALWAYS catch and differentiate error types (Zod, Prisma, generic)
- ✅ Return appropriate HTTP status codes (400, 401, 403, 404, 409, 500)
- ✅ Log errors server-side but sanitize error messages to client
- ❌ NEVER expose sensitive error details (database queries, file paths) to client

### Client-Side Error Handling

**Pattern: React Hook Form + Zod + Error States:**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orderSchema } from '@/lib/validations/order';

export default function OrderForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(orderSchema),  // Client-side validation
    defaultValues: { /* ... */ }
  });

  async function onSubmit(data: z.infer<typeof orderSchema>) {
    setSubmitError(null);

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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}

      {submitError && (
        <div className="text-red-600">{submitError}</div>
      )}
    </form>
  );
}
```

---

## Database Operations

### Prisma Client Best Practices

**ALWAYS use singleton pattern:**
```typescript
// lib/db.ts (existing pattern)
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Critical Pattern:**
- ✅ Import `prisma` from `@/lib/db` (NOT `new PrismaClient()` in every file)
- ✅ Use Prisma's type-safe query builder (NOT raw SQL unless necessary)
- ✅ Use transactions for multi-step operations

### Prisma Transactions

**Pattern: Multi-step operations (order + notification):**
```typescript
const result = await prisma.$transaction(async (tx) => {
  // Step 1: Create order
  const order = await tx.order.create({
    data: { /* ... */ }
  });

  // Step 2: Create notification for lab admin
  const notification = await tx.notification.create({
    data: {
      userId: order.lab.ownerId,
      type: 'NEW_RFQ',
      orderId: order.id
    }
  });

  return { order, notification };
});
```

**When to use transactions:**
- ✅ Multiple related writes that must succeed together
- ✅ Order creation + notification + audit log
- ❌ Simple single-record operations (unnecessary overhead)

### Schema Migrations

```bash
# Development: Push schema changes without migration files
npm run db:push

# Production: Generate migration files
npm run db:migrate

# View database in GUI
npm run db:studio

# Reset database (⚠️ DESTRUCTIVE)
npm run db:reset
```

**Critical Pattern:**
- Development: Use `db:push` for rapid iteration
- Production: Use `db:migrate` for versioned migrations
- ALWAYS test migrations on staging before production

---

## Agent Organization

PipetGo uses a **hybrid agent system**:

**Generic Agents (Symlinked from `/home/ltpt420/repos/claude-config/`):**
- `architect.md` → Portfolio-wide design and ADRs
- `database-manager.md` → Generic database optimization
- `debugger.md` → Systematic bug investigation
- `developer.md` → TDD implementation
- `quality-reviewer.md` → Production failure detection
- `security-auth.md` → Authentication and security audits
- `technical-writer.md` → Code-level documentation
- `ux-reviewer.md` → UI/UX and accessibility

**PipetGo-Specific Agents (Local files):**
- `pipetgo-business-model-strategy.md` → Revenue models, platform leakage prevention, go-to-market strategy, financial projections (delegates to @architect for technical design)

**Why Symlinks?**
- Generic agents maintained centrally in `claude-config` repo
- Updates propagate to all projects automatically
- PipetGo-specific agents capture business strategy knowledge
- Business model agent focuses on WHAT and WHY (not technical implementation)

**Delegation Flow:**
```
Business Strategy → Technical Design → Implementation → Documentation

@pipetgo-business-model-strategy (commission vs subscription?)
    ↓
@architect (design hybrid pricing schema, API contracts)
    ↓
@developer (implement Prisma schema, API routes, tests)
    ↓
@technical-writer (JSDoc comments, API docs)
```

---

## Agent Usage Examples

### @architect - Quotation System Redesign

**When to invoke:**
- Redesigning order creation flow for RFQ workflow
- Adding pricing_mode field to LabService model
- Designing quote approval workflow

**Example invocation:**
```
Task for @architect:

Design the quotation-first order creation workflow for PipetGo.

Requirements:
1. Support services with no fixed pricePerUnit (quote required)
2. Support hybrid mode (fixed price OR custom quote)
3. Add QUOTE_REQUESTED, QUOTE_PROVIDED, QUOTE_APPROVED statuses
4. Design lab admin quote provision UI flow
5. Design client quote approval flow
6. Notification system for quote lifecycle

Context:
- See docs/QUOTATION_SYSTEM_AUDIT_20251013.md for current state
- Current OrderStatus enum: PENDING, ACKNOWLEDGED, IN_PROGRESS, COMPLETED, CANCELLED
- Database schema: prisma/schema.prisma (quotedPrice and quotedAt fields exist)

Deliverable:
- ADR (Architecture Decision Record)
- Updated Prisma schema with new enums/fields
- API endpoint specifications
- UI component hierarchy
```

### @database-manager - Schema Optimization

**When to invoke:**
- Adding pricing_mode field to LabService
- Adding new OrderStatus enum values
- Optimizing quote-related queries

**Example invocation:**
```
Task for @database-manager:

Add pricing_mode field to LabService model and update OrderStatus enum for quotation workflow.

Current Schema (prisma/schema.prisma:95-113):
model LabService {
  pricePerUnit Decimal? // Nullable
}

enum OrderStatus {
  PENDING
  ACKNOWLEDGED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

Required Changes:
1. Add pricing_mode field: enum('FIXED', 'QUOTE_REQUIRED', 'HYBRID')
2. Add OrderStatus values: QUOTE_REQUESTED, QUOTE_PROVIDED, QUOTE_APPROVED
3. Ensure migration is reversible (provide rollback script)

Scale Context:
- Stage 1: <100 labs, <1000 orders/month
- Stage 2: 500 labs, 5000 orders/month
- No premature optimization needed

Deliverable:
- Updated schema.prisma
- Migration file with up/down scripts
- Index recommendations (if query patterns identified)
```

### @security-auth - Quote Authorization

**When to invoke:**
- Implementing quote provision API (lab admin only)
- Implementing quote approval API (client only, resource ownership)
- Reviewing role-based access control

**Example invocation:**
```
Task for @security-auth:

Review authorization for quote provision workflow.

API Endpoint: POST /api/orders/[id]/quote
Purpose: Lab admin provides custom quote for client's RFQ

Current Implementation (src/app/api/orders/[id]/quote/route.ts):
[paste implementation]

Security Requirements:
1. Only LAB_ADMIN role can provide quotes
2. Lab admin can only quote for orders assigned to their lab
3. Cannot modify quote after client approves
4. Audit trail for quote changes

Context:
- NextAuth session-based auth (session.user.id, session.user.role)
- Prisma schema: Order.labId → Lab.ownerId must match session.user.id

Review Checklist:
- Role verification (server-side)
- Resource ownership verification
- State machine validation (can only quote if status = QUOTE_REQUESTED)
- Audit logging for quote provision
```

### @developer - Implement Quote UI

**When to invoke:**
- Implementing quote provision form (lab admin dashboard)
- Implementing quote approval button (client dashboard)
- Refactoring order creation to support RFQ workflow

**Example invocation:**
```
Task for @developer:

Implement quote provision form for lab admin dashboard.

Location: src/app/dashboard/lab/orders/[id]/QuoteForm.tsx

Requirements:
1. Form with quotedPrice input (Decimal, required)
2. Turnaround time estimate (optional)
3. Notes field for quote justification
4. Submit button calls POST /api/orders/[id]/quote
5. Success: Show confirmation, redirect to orders list
6. Error: Display error message

Validation:
- quotedPrice must be positive number
- Format with 2 decimal places
- Use Zod schema from lib/validations/quote.ts

UI:
- Use shadcn/ui components (Input, Button, Textarea)
- Follow existing dashboard layout patterns
- Show order details (service name, client details) above form

Tests:
- Write test FIRST (TDD workflow)
- Test: Successful quote submission
- Test: Validation errors displayed
- Test: Unauthorized access (non-LAB_ADMIN) shows 403
```

### @debugger - Investigate Quote Bug

**When to invoke:**
- Order status not updating after quote provision
- Quote price not displaying in client dashboard
- Authorization failing for valid lab admin

**Example invocation:**
```
Task for @debugger:

Investigate: Quote price not displaying in client dashboard after lab admin provides quote.

Reproduction:
1. Lab admin submits quote via POST /api/orders/[orderId]/quote
2. API returns 200 OK with updated order
3. Client dashboard (dashboard/client/orders/[id]) still shows "Awaiting Quote"
4. Database check: quotedPrice IS populated in orders table

Expected: Client dashboard shows quoted price immediately
Actual: Shows "Awaiting Quote" until page refresh

Context:
- Client dashboard uses server component (no useEffect)
- Order data fetched in page.tsx via prisma.order.findUnique()
- No caching configured (Next.js default fetch cache)

Systematic Investigation Required:
1. Add debug statements to trace data flow
2. Check if quotedPrice included in Prisma select
3. Verify Next.js route cache invalidation
4. Test with hard refresh vs soft navigation

CRITICAL: Remove ALL debug statements before final report.
Use TodoWrite to track all debug modifications.
```

### @quality-reviewer - Production Readiness

**When to invoke:**
- Before deploying quotation system to production
- After major refactor of order creation flow
- Security review of multi-role authorization

**Example invocation:**
```
Task for @quality-reviewer:

Review quotation system implementation for production deployment.

Scope:
- src/app/api/orders/ (all routes)
- src/app/dashboard/lab/orders/ (quote provision UI)
- src/app/dashboard/client/orders/ (quote approval UI)
- prisma/schema.prisma (OrderStatus enum, pricing_mode field)

Critical Failure Checks:
1. Data loss risks: Can quotes be overwritten without audit trail?
2. Security vulnerabilities: Can clients provide their own quotes?
3. Concurrency bugs: Multiple lab admins quoting same order?
4. Performance killers: N+1 queries in order listing?

Standards (from CLAUDE.md):
- All API routes have authentication checks
- All database writes in transactions
- All user inputs validated with Zod
- Error handling with appropriate HTTP codes

Ignore:
- Minor style preferences (variable naming)
- Theoretical edge cases (meteor strike scenarios)
- Performance micro-optimizations without measurement

Deliverable:
- List of BLOCKING issues (must fix before deploy)
- List of IMPORTANT issues (fix within 1 week)
- List of NICE-TO-HAVE improvements
```

### @ux-reviewer - Quote Flow Usability

**When to invoke:**
- Review quote provision form (lab admin)
- Review quote approval flow (client)
- Accessibility check for order status indicators

**Example invocation:**
```
Task for @ux-reviewer:

Review quote provision workflow for lab admin dashboard.

Scope:
- src/app/dashboard/lab/orders/page.tsx (order listing)
- src/app/dashboard/lab/orders/[id]/page.tsx (order detail + quote form)

User Flow:
1. Lab admin sees new RFQ in orders list (status: QUOTE_REQUESTED)
2. Clicks order to view details (client requirements, sample description)
3. Fills out quote form (price, turnaround time, notes)
4. Submits quote
5. Sees confirmation, quote sent to client

WCAG 2.1 AA Requirements:
- Form labels associated with inputs
- Error messages programmatically linked to fields
- Success confirmation announced to screen readers
- Keyboard navigation works without mouse

User Impact Focus:
- Can lab admin easily distinguish quote-requested orders from acknowledged orders?
- Is quote form input clear (what unit is price for)?
- Are validation errors helpful (not just "Invalid input")?
- Is success feedback obvious (not just console.log)?

Ignore:
- Color palette preferences (unless contrast issues)
- Font size preferences (unless readability issue)
- Subjective "looks nicer" suggestions

Deliverable:
- P0 issues: Blocking usability problems (form unusable)
- P1 issues: Important usability issues (confusing but functional)
- P2 issues: Nice-to-have improvements
```

### @technical-writer - Quote API Documentation

**When to invoke:**
- After implementing quote provision API
- After implementing quote approval API
- Documenting OrderStatus state machine

**Example invocation:**
```
Task for @technical-writer:

Document the quote provision API endpoint.

Endpoint: POST /api/orders/[id]/quote
File: src/app/api/orders/[id]/quote/route.ts

Requirements:
1. JSDoc comment for POST function (max 100 tokens)
2. Describe purpose, parameters, return value
3. Include example request/response
4. Document authorization requirements
5. List possible error codes

Token Limit: 100 tokens maximum (RULE 0)

Focus on WHY:
- Why does this endpoint exist? (Lab admin provides custom pricing)
- Why is authorization critical? (Prevent quote manipulation)
- Why quotedPrice separate from pricePerUnit? (Custom vs catalog pricing)

Deliverable:
- JSDoc comment above POST function
- Example usage in function comment
- Clear explanation of quote workflow context
```

---

## Development Workflow

### Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local

# Edit .env.local:
# DATABASE_URL="postgresql://..."  # Neon connection string
# NEXTAUTH_URL="http://localhost:3000"
# NEXTAUTH_SECRET="..."  # openssl rand -base64 32
# UPLOADTHING_SECRET="..."  # uploadthing.com dashboard
# UPLOADTHING_APP_ID="..."

# 3. Push schema and seed database
npm run db:push
npm run db:seed

# 4. Start development server
npm run dev
```

### Git Worktree Workflow (Optional)

If using git worktrees (see global CLAUDE.md):

```bash
# Main branch (production testing)
cd /home/ltpt420/repos/pipetgo
npm run dev  # Port 3000

# Feature branch (quotation redesign)
cd .trees/feature-quotation-system
npm run dev -- -p 3001  # Port 3001

# Coordination
cat .trees/.scratchpads/shared.md  # Check alerts
```

### Pre-Commit Checklist

Before committing:
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes (zero warnings)
- [ ] `npm run test:run` passes (all tests green)
- [ ] Manual testing completed (if UI changes)
- [ ] No debug code (console.log, debugger statements)

---

## Critical Patterns & Gotchas

### ⚠️ NEVER: Auto-populate quotedPrice from pricePerUnit

**❌ WRONG (E-commerce pattern):**
```typescript
const order = await prisma.order.create({
  data: {
    quotedPrice: service.pricePerUnit,  // ❌ Client didn't approve this price
    quotedAt: new Date()
  }
});
```

**✅ CORRECT (RFQ pattern):**
```typescript
const order = await prisma.order.create({
  data: {
    quotedPrice: null,        // ✅ Awaiting lab admin quote
    quotedAt: null,
    status: 'QUOTE_REQUESTED'
  }
});
```

### ⚠️ NEVER: Trust client-provided prices

**❌ WRONG:**
```typescript
export async function POST(req: Request) {
  const { quotedPrice } = await req.json();

  const order = await prisma.order.create({
    data: { quotedPrice }  // ❌ Client could manipulate price
  });
}
```

**✅ CORRECT:**
```typescript
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  // Only LAB_ADMIN can set quotedPrice
  if (session.user.role !== 'LAB_ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Verify lab admin owns the lab for this order
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      lab: { ownerId: session.user.id }  // ✅ Ownership check
    }
  });

  if (!order) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const { quotedPrice } = await req.json();
  // Now safe to update
}
```

### ⚠️ ALWAYS: Verify role AND resource ownership

**Pattern:**
```typescript
// Combine authentication + authorization in single query
const order = await prisma.order.findFirst({
  where: {
    id: orderId,
    lab: {
      ownerId: session.user.id  // ✅ Implicit ownership check
    }
  }
});

if (!order) {
  // Could mean: order doesn't exist OR user doesn't own lab
  // Return 404 in both cases (don't leak existence)
  return Response.json({ error: 'Not found' }, { status: 404 });
}
```

### ⚠️ NEVER: Skip validation for "internal" API routes

**❌ WRONG:**
```typescript
// "It's only called from our own UI, so validation is optional"
export async function POST(req: Request) {
  const body = await req.json();
  // ❌ Directly use body without validation
  const order = await prisma.order.create({ data: body });
}
```

**✅ CORRECT:**
```typescript
import { orderSchema } from '@/lib/validations/order';

export async function POST(req: Request) {
  const body = await req.json();
  const validatedData = orderSchema.parse(body);  // ✅ Always validate
  const order = await prisma.order.create({ data: validatedData });
}
```

**Why:** API routes are exposed to internet. Never trust client (even your own UI).

---

## Deployment

### Environment Variables (Production)

Required in production:
```env
DATABASE_URL="postgresql://..."           # Neon production database
NEXTAUTH_URL="https://pipetgo.com"       # Production domain
NEXTAUTH_SECRET="..."                     # Different from dev
UPLOADTHING_SECRET="..."                  # Production keys
UPLOADTHING_APP_ID="..."
```

### Vercel Deployment (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push to main

**Critical:**
- Run `npm run db:migrate` on production database before deploy
- Test migrations on staging environment first
- NEVER run `db:reset` on production (data loss)

---

## Documentation Reference

**Critical Business Context:**
- `docs/QUOTATION_SYSTEM_AUDIT_20251013.md` - Current state analysis
- `docs/Business_Model_Strategy_report_20251015.md` - B2B strategy

**Implementation Guides:**
- `docs/SCAFFOLD_GUIDE.md` - Component examples
- `docs/SITEMAP_AND_USER_FLOWS_20251013.md` - User journey maps

**Technical Specs:**
- `prisma/schema.prisma` - Database schema (single source of truth)
- `src/lib/validations/` - Zod validation schemas

---

## Notes for Claude Instances

### When Starting New Session:

1. **Read this CLAUDE.md first** for project context
2. **Read global CLAUDE.md** (`/home/ltpt420/.claude/CLAUDE.md`) for development conventions
3. **Check quotation audit** (`docs/QUOTATION_SYSTEM_AUDIT_20251013.md`) for current misalignment
4. **Understand B2B context**: This is RFQ marketplace, NOT e-commerce
5. **Follow TDD workflow**: Write tests first, implement after

### When Implementing Quotation System:

1. **Involve @architect first** - Design state machine and API contracts
2. **Use @database-manager** - Add pricing_mode field, update OrderStatus enum
3. **Use @security-auth** - Review quote provision authorization
4. **Follow TDD strictly** - Test quote workflow before implementing
5. **Document state transitions** - OrderStatus changes must be auditable

### When Debugging:

1. **Check role verification** - Most bugs are authorization issues
2. **Check Prisma queries** - Use `db:studio` to verify data
3. **Use @debugger agent** - Systematic evidence gathering required
4. **Remove debug code** - ALL console.log and debug statements before commit

### Communication Style:

User prefers:
- Clear, concise technical communication
- Step-by-step instructions with time estimates
- Code examples over abstract descriptions
- TDD workflow (tests first, always)
- Automation when beneficial

---

**Last Updated:** 2025-10-25
**Version:** 2.0 (Quotation-aware)
**Maintained By:** ltpt420 + Claude Code

---

## Quick Reference

### Most Common Commands

```bash
# Development
npm run dev                # Start dev server
npm run type-check         # TypeScript validation
npm run lint               # ESLint

# Testing
npm run test               # Run tests (watch mode)
npm run test:run           # CI mode
npm run test:coverage      # Coverage report

# Database
npm run db:push            # Push schema (dev)
npm run db:migrate         # Generate migration (prod)
npm run db:seed            # Seed demo data
npm run db:studio          # GUI database browser

# Build
npm run build              # Production build
npm run start              # Start production server
```

### Files to Check Before Making Changes

1. `prisma/schema.prisma` - Database schema
2. `docs/QUOTATION_SYSTEM_AUDIT_20251013.md` - Current state analysis
3. `src/lib/validations/` - Validation schemas (Zod)
4. `src/lib/auth.ts` - NextAuth configuration
5. This CLAUDE.md file

### Port Assignments (Worktrees)

| Worktree | Port | Purpose |
|----------|------|---------|
| Main branch | 3000 | Production testing |
| feature-quotation-system | 3001 | RFQ workflow redesign |
| fix-* | 3002 | Bug fixes |
| dev | 3003 | Experimentation |
