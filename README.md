# PipetGo — B2B Lab Testing Marketplace

PipetGo is a B2B Request-for-Quote (RFQ) platform connecting businesses with ISO 17025 certified laboratory testing services in the Philippines. It is **not an e-commerce platform** — labs provide custom quotes for each engagement rather than fixed catalog prices.

**Core flow:**
```
Client submits RFQ → Lab provides quote → Client approves → Testing proceeds → Results delivered
```

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14.2.4 (App Router), React 18.3.1, TypeScript 5.5.2, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Neon serverless), Prisma 5.15.0 |
| Auth | NextAuth 4.24.7, credentials provider with bcrypt |
| File storage | UploadThing 7.7.4 |
| Rate limiting | Upstash Redis (optional, disabled without env vars) |
| Analytics | GoatCounter (privacy-friendly, no cookies) |
| Testing | Vitest 3.x (unit/integration), Playwright 1.56.1 (E2E) |

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon serverless recommended)

### 1. Clone and install

```bash
git clone <repo-url>
cd pipetgo-mvp
npm install
```

### 2. Configure environment

Create `.env.local` with the following variables:

```env
# Required
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""           # openssl rand -base64 32

# File uploads (required for attachment functionality)
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="..."

# Rate limiting (optional — disabled when absent)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Analytics (optional — disabled when absent)
NEXT_PUBLIC_GOATCOUNTER_URL="https://pipetgo.goatcounter.com/count"
```

### 3. Set up the database

```bash
npm run db:push    # Apply schema to database
npm run db:seed    # Load demo data and accounts
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Accounts

The seed script creates the following accounts. Only the lab admin account has a password set — the others require configuration outside the seed.

| Role | Email | Password | Notes |
|---|---|---|---|
| Lab Admin | `lab@testinglab.com` | `TestPassword123!` | Metro Manila Testing Laboratory |
| Client | `client@example.com` | — | Requires password setup via `/api/auth/set-password` |
| Platform Admin | `admin@pipetgo.com` | — | Requires password setup |
| Lab Admin | `lab2@pgtestlab.com` | — | Testing Lab 2 (Pasig City) |
| Lab Admin | `lab3@pgtstlab.com` | — | Testing Lab 3 (Quezon City) |
| Lab Admin | `lab4@testlabpg.com` | — | Testing Lab 4 (Makati City) |

The seeded lab (Metro Manila Testing Laboratory) includes 23 services spanning food safety, environmental testing, microscopy, thermal analysis, mechanical testing, biological testing, and more. Additional labs each have 8 services.

---

## RFQ Workflow

### Pricing modes

Services operate in one of three modes:

| Mode | Behavior |
|---|---|
| `QUOTE_REQUIRED` | Always requires a custom quote from the lab (default) |
| `FIXED` | Instant booking at a fixed price, skips quote workflow |
| `HYBRID` | Client chooses: accept reference price or request a custom quote |

### Order status machine

```
QUOTE_REQUESTED → QUOTE_PROVIDED → PENDING → ACKNOWLEDGED → IN_PROGRESS → COMPLETED
                       ↓
                 QUOTE_REJECTED
```

- `QUOTE_REQUESTED` — Client submitted RFQ, awaiting lab quote
- `QUOTE_PROVIDED` — Lab provided price, awaiting client approval
- `QUOTE_REJECTED` — Client rejected the quote
- `PENDING` — Quote approved (or fixed-rate order), awaiting lab acknowledgment
- `ACKNOWLEDGED` — Lab acknowledged the order
- `IN_PROGRESS` — Testing underway
- `COMPLETED` — Results delivered

---

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes (co-located with __tests__)
│   ├── auth/             # Sign in/out pages
│   ├── dashboard/
│   │   ├── client/       # Client: RFQ submission and tracking
│   │   ├── lab/          # Lab Admin: quote provision, analytics
│   │   └── admin/        # Platform Admin: oversight
│   └── order/            # Order submission flow
├── components/
│   ├── ui/               # shadcn/ui base components
│   └── analytics/        # GoatCounter tracking
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Prisma singleton
│   ├── rate-limit.ts     # Upstash Redis rate limiting
│   ├── utils.ts          # Utility functions
│   └── validations/      # Zod schemas
└── types/                # TypeScript definitions

prisma/
├── schema.prisma         # Database schema (authoritative)
└── seed.ts               # Demo data

tests/
├── lib/                  # Unit tests for utilities and validations
└── e2e/                  # Playwright end-to-end tests
```

---

## API Endpoints

### Orders

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/orders` | Any role | List orders filtered by role |
| `POST` | `/api/orders` | CLIENT | Submit new RFQ |
| `GET` | `/api/orders/[id]` | Owner | Get order detail |
| `PATCH` | `/api/orders/[id]` | LAB_ADMIN | Update order status |
| `POST` | `/api/orders/[id]/quote` | LAB_ADMIN | Provide quote |
| `POST` | `/api/orders/[id]/approve-quote` | CLIENT | Approve or reject quote |
| `POST` | `/api/orders/[id]/request-custom-quote` | CLIENT | Request custom quote (HYBRID mode) |

### Services

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/services` | Public | List services (paginated, filterable) |
| `GET` | `/api/services/[id]` | LAB_ADMIN | Get single service detail |
| `POST` | `/api/services` | LAB_ADMIN | Create service |
| `POST` | `/api/services/bulk` | ADMIN | Bulk operations |

### Other

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/analytics` | LAB_ADMIN | Lab revenue and quote metrics |
| `*` | `/api/auth/[...nextauth]` | — | NextAuth endpoints |
| `POST` | `/api/auth/set-password` | Authenticated | Set or change password |

The analytics endpoint accepts a `timeframe` query parameter: `last30days` (default), `last90days`, `thisYear`, or `allTime`.

---

## Testing

### Unit and integration tests (Vitest)

Tests support two database modes:

```bash
npm run test:run           # Run once (uses mock DB by default)
npm run test:run:mock      # Explicit mock DB (pg-mem, fast, isolated)
npm run test:run:live      # Live PostgreSQL (integration testing)
npm run test               # Watch mode
npm run test:ui            # Interactive Vitest UI
npm run test:coverage      # Coverage report
```

Test files are co-located with API routes under `src/app/api/*/__tests__/` and in `tests/lib/`.

### End-to-end tests (Playwright)

E2E tests run against Chromium by default. Start the dev server before running.

```bash
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # Interactive Playwright UI
npm run test:e2e:headed    # Run with browser visible
npm run test:e2e:debug     # Debug mode
npm run test:e2e:report    # View last run report
```

E2E tests live in `tests/e2e/`. The base URL defaults to `http://localhost:3000` and can be overridden with `PLAYWRIGHT_TEST_BASE_URL`.

### Production login verification

```bash
npm run test:production:logins   # Smoke-test credentials against a live deployment
```

---

## Available Scripts

```bash
# Development
npm run dev                  # Start dev server (localhost:3000)
npm run build                # Production build
npm start                    # Start production server
npm run lint                 # ESLint
npm run type-check           # TypeScript validation

# Testing
npm run test                 # Vitest watch mode
npm run test:run             # Vitest single run
npm run test:mock            # Watch mode, mock DB
npm run test:live            # Watch mode, live DB
npm run test:run:mock        # Single run, mock DB
npm run test:run:live        # Single run, live DB
npm run test:ui              # Vitest interactive UI
npm run test:coverage        # Coverage report
npm run test:e2e             # Playwright E2E
npm run test:e2e:ui          # Playwright interactive UI
npm run test:e2e:headed      # Playwright with visible browser
npm run test:e2e:debug       # Playwright debug mode
npm run test:e2e:report      # View Playwright HTML report
npm run test:production:logins  # Verify production credentials

# Database
npm run db:push              # Push schema (development)
npm run db:migrate           # Generate migration file (production)
npm run db:seed              # Seed demo data
npm run db:studio            # Open Prisma Studio GUI
npm run db:reset             # ⚠️ DESTRUCTIVE — reset and reseed

# Utilities
npm run screenshots:portfolio  # Capture UI screenshots
```

---

## Deployment (Vercel)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add all required environment variables in the Vercel dashboard
4. Run `npm run db:migrate` against the production database before deploying
5. Verify file uploads (UploadThing) and auth are working after deploy

---

## Payment Integration Readiness

Payment processing is not yet implemented, but the codebase has the foundational hooks in place for integration.

### What already exists

| Component | Status | Detail |
|---|---|---|
| Payment amount field | ✅ Ready | `Order.quotedPrice` (`Decimal?`) stores the agreed price from the RFQ workflow — this becomes the charge amount |
| Order status machine | ✅ Extensible | A `PAYMENT_PENDING` or `PAID` state can be inserted between `PENDING` and `ACKNOWLEDGED` with minimal schema change |
| Webhook directory | ⚠️ Empty | `src/app/api/webhooks/` exists but has no route handlers — payment provider webhook receivers go here |
| Environment config | ✅ Pattern established | `UPLOADTHING_*` shows the existing pattern for adding third-party service keys (e.g. `PAYMONGO_SECRET_KEY`) |

### Recommended payment partners (Philippines B2B)

| Provider | Best for | Notes |
|---|---|---|
| **PayMongo** | Philippines-native, GCash + Maya + cards | REST API, webhook-first, sandbox available |
| **Xendit** | Enterprise B2B invoicing | Supports bank transfer, e-wallets, invoices with payment links |
| **Stripe** | International clients | Higher FX fees for PHP, but best developer experience |

### What is needed to go live

1. Add `PAYMENT_PENDING` status to the `OrderStatus` enum in `prisma/schema.prisma`
2. Create `POST /api/orders/[id]/initiate-payment` — calls payment provider, stores provider's payment ID on the order
3. Create `POST /api/webhooks/payment` — receives provider confirmation, transitions order to `PAID` → `ACKNOWLEDGED`
4. Add `paymentIntentId` and `paidAt` fields to the `Order` model
5. Add provider secret key to environment variables

Payment would slot in at the `PENDING` stage: after the client approves a quote, before the lab begins work.

See `docs/Business_Model_Strategy_report_20251015.md` for payment timing strategy (upfront vs. milestone vs. post-delivery).

---

## Current Limitations

- **No real-time updates** — Status changes require a page refresh
- **No email notifications** — SendGrid is installed but not yet integrated
- **No payment processing** — `quotedPrice` is stored but no payment provider is integrated yet

---

## License

All source code and assets in this repository are the exclusive, proprietary intellectual property of **PIPETGO, Inc.**.

**All Rights Reserved.**

This repository is made public for demonstration, portfolio review, and limited access by authorized team members, advisors, and investors only. Cloning, modification, distribution, or commercial use of this codebase by unauthorized third parties is strictly prohibited. The code is provided "as is" and is **NOT** licensed for open-source use.
