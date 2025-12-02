# Database Architecture

**Last Updated:** 2025-12-01
**Database:** PostgreSQL 16 (Neon Serverless)
**ORM:** Prisma 5.15.0

---

## Table of Contents

1. [Entity-Relationship Diagram](#entity-relationship-diagram)
2. [Core Models Deep Dive](#core-models-deep-dive)
3. [Pricing Mode Implications](#pricing-mode-implications)
4. [Indexing Strategy](#indexing-strategy)
5. [Migration Strategy](#migration-strategy)
6. [Performance Considerations](#performance-considerations)
7. [Data Integrity Rules](#data-integrity-rules)

---

## Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     PipetGo Database Schema (ER Diagram)                │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐                ┌──────────────────┐
│      User        │                │   Account        │
├──────────────────┤                │  (NextAuth)      │
│ id (PK)          │◀───────────────│ userId (FK)      │
│ email (UNIQUE)   │   1:N          │ provider         │
│ hashedPassword?  │                │ providerAccountId│
│ role             │                └──────────────────┘
│ createdAt        │
└────────┬─────────┘
         │ 1:N (ownedLabs)
         │
         ├──────────────────────────────┐
         │                              │
         ▼                              ▼
┌──────────────────┐          ┌──────────────────┐
│      Lab         │          │   Order          │
├──────────────────┤          │  (CLIENT role)   │
│ id (PK)          │          ├──────────────────┤
│ ownerId (FK)─────┼─────┐    │ id (PK)          │
│ name             │     │    │ clientId (FK)────┼────┐
│ description      │     │    │ labId (FK)───────┼────┼───┐
│ location (JSON)  │     │    │ serviceId (FK)───┼────┼───┼──┐
│ certifications[] │     │    │ status           │    │   │  │
└────────┬─────────┘     │    │ quotedPrice?     │    │   │  │
         │ 1:N           │    │ quotedAt?        │    │   │  │
         │               │    │ quoteNotes?      │    │   │  │
         │               │    └──────────┬───────┘    │   │  │
         ▼               │               │ 1:N        │   │  │
┌──────────────────┐     │               │            │   │  │
│   LabService     │     │               │            │   │  │
├──────────────────┤     │               ▼            │   │  │
│ id (PK)          │     │    ┌──────────────────┐    │   │  │
│ labId (FK)───────┼─────┘    │   Attachment     │    │   │  │
│ name             │          ├──────────────────┤    │   │  │
│ pricingMode ───────────┐    │ id (PK)          │    │   │  │
│ pricePerUnit?    │     │    │ orderId (FK)─────┼────┘   │  │
│ category         │     │    │ uploadedById (FK)│        │  │
│ active           │     │    │ fileUrl          │        │  │
└──────────────────┘     │    │ attachmentType   │        │  │
                         │    └──────────────────┘        │  │
                         │                                 │  │
         ┌───────────────┘                                 │  │
         │                                                 │  │
         ▼                                                 │  │
┌──────────────────┐                                      │  │
│  PricingMode     │                                      │  │
│  (Enum)          │                                      │  │
├──────────────────┤                                      │  │
│ QUOTE_REQUIRED   │  ← Default: Always requires quote   │  │
│ FIXED            │  ← Backward compat: Instant booking  │  │
│ HYBRID           │  ← Flexible: Reference OR custom    │  │
└──────────────────┘                                      │  │
                                                          │  │
┌──────────────────┐                                      │  │
│  OrderStatus     │                                      │  │
│  (Enum)          │                                      │  │
├──────────────────┤                                      │  │
│ QUOTE_REQUESTED  │  ← RFQ submitted, awaiting quote    │  │
│ QUOTE_PROVIDED   │  ← Quote provided, awaiting decision │  │
│ QUOTE_REJECTED   │  ← Client rejected quote            │  │
│ PENDING          │  ← Quote approved, awaiting ack      │  │
│ ACKNOWLEDGED     │  ← Lab acknowledged order            │  │
│ IN_PROGRESS      │  ← Testing underway                  │  │
│ COMPLETED        │  ← Results delivered                 │  │
│ CANCELLED        │  ← Order cancelled                   │  │
└──────────────────┘                                      │  │
                                                          │  │
┌──────────────────┐                                      │  │
│   UserRole       │                                      │  │
│   (Enum)         │                                      │  │
├──────────────────┤                                      │  │
│ CLIENT           │  ← Default: Submit RFQs              │  │
│ LAB_ADMIN        │  ← Requires password: Provide quotes │  │
│ ADMIN            │  ← Platform oversight                │  │
└──────────────────┘                                      │  │
                                                          │  │
Relationships:                                            │  │
• User 1:N Lab (User owns multiple labs)                  │  │
• User 1:N Order (Client submits multiple orders) ────────┘  │
• Lab 1:N LabService (Lab offers multiple services)          │
• Lab 1:N Order (Lab receives multiple orders) ───────────────┘
• LabService 1:N Order (Service booked multiple times)
• Order 1:N Attachment (Order has multiple files)
• User 1:N Attachment (User uploads multiple files)
```

---

## Core Models Deep Dive

### User Model

**Purpose:** Represents all system users (clients, lab admins, platform admins).

**Schema:**
```prisma
// prisma/schema.prisma (lines 60-79)
model User {
  id              String    @id @default(cuid())
  name            String?
  email           String    @unique
  hashedPassword  String?                    // ✅ Nullable: LAB_ADMIN requires, CLIENT optional
  emailVerified   DateTime?
  image           String?
  role            UserRole  @default(CLIENT) // ✅ Default: Most users are clients
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  accounts        Account[]
  sessions        Session[]
  ownedLabs       Lab[]
  clientOrders    Order[]      @relation("ClientOrders")
  attachments     Attachment[]

  @@map("users")
}
```

**Key Design Decisions:**

1. **`hashedPassword` is Nullable**
   - **Why:** Supports both password-based (LAB_ADMIN) and passwordless (CLIENT) auth
   - **Validation:** If `role = LAB_ADMIN`, `hashedPassword` MUST be set (enforced in application layer)

2. **`email` is Unique**
   - **Why:** Single account per email (prevents duplicate registrations)
   - **Case-sensitivity:** Stored lowercase (`credentials.email.toLowerCase()`)

3. **`role` Defaults to CLIENT**
   - **Why:** Most users are businesses submitting RFQs (not lab admins)
   - **Upgrade path:** CLIENT can become LAB_ADMIN by setting password + admin approval

4. **Relations:**
   - `ownedLabs`: User owns multiple labs (future: multi-lab operators)
   - `clientOrders`: User submits multiple RFQs (client perspective)
   - `attachments`: User uploads files (results, specifications)

---

### Lab Model

**Purpose:** Represents ISO 17025 certified laboratories offering testing services.

**Schema:**
```prisma
// prisma/schema.prisma (lines 89-104)
model Lab {
  id             String   @id @default(cuid())
  ownerId        String
  name           String
  description    String?
  location       Json?                // ✅ Flexible: { city, province, coordinates }
  certifications String[]             // ✅ Array: ["ISO 17025", "ILAC", "NABL"]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  owner          User         @relation(fields: [ownerId], references: [id])
  services       LabService[]
  orders         Order[]

  @@map("labs")
}
```

**Key Design Decisions:**

1. **`location` is JSON (Not Separate Table)**
   - **Why:** Flexible schema for different location types
   - **Example:** `{ "city": "Quezon City", "province": "Metro Manila", "lat": 14.6760, "lng": 121.0437 }`
   - **Tradeoff:** Cannot query "all labs in Metro Manila" efficiently (future: add `province` column + index)

2. **`certifications` is Array (Not Junction Table)**
   - **Why:** Certifications are simple strings, no need for full model
   - **Example:** `["ISO 17025:2017", "ISO 9001:2015", "ILAC-MRA"]`
   - **Tradeoff:** Cannot filter by certification efficiently (future: JSON column + GIN index)

3. **One Owner per Lab**
   - **Why:** Simplifies ownership verification (`lab.ownerId === session.user.id`)
   - **Future:** Add `LabMember` junction table for multi-user labs

---

### LabService Model

**Purpose:** Represents testing services offered by labs (with pricing strategy).

**Schema:**
```prisma
// prisma/schema.prisma (lines 106-126)
model LabService {
  id                 String      @id @default(cuid())
  labId              String
  name               String
  description        String?
  category           String                          // ✅ Not enum: Flexible categories
  pricingMode        PricingMode @default(QUOTE_REQUIRED) // ✅ Default: B2B quote workflow
  pricePerUnit       Decimal?                        // ✅ Nullable: Required for FIXED/HYBRID
  unitType           String      @default("per_sample")
  turnaroundDays     Int?
  sampleRequirements String?
  active             Boolean     @default(true)
  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt

  lab                Lab     @relation(fields: [labId], references: [id], onDelete: Cascade)
  orders             Order[]

  @@index([active, category, labId])
  @@map("lab_services")
}
```

**Key Design Decisions:**

1. **`pricingMode` Enum (Default: QUOTE_REQUIRED)**
   - **Why:** B2B-first platform (quotation is primary workflow)
   - **Labs opt-in to FIXED/HYBRID:** Must explicitly set `pricePerUnit` + change mode

2. **`pricePerUnit` is Nullable**
   - **Constraint:** QUOTE_REQUIRED → `pricePerUnit = null`
   - **Constraint:** FIXED/HYBRID → `pricePerUnit != null`
   - **Validation:** Enforced in application layer (Zod schema)

3. **`category` is String (Not Enum)**
   - **Why:** Flexible taxonomy (labs define own categories)
   - **Example:** "Microbiology", "Chemistry", "Environmental", "Food Safety"
   - **Future:** Add `ServiceCategory` table with standardized names

4. **Composite Index: `[active, category, labId]`**
   - **Query:** "Find all active services in 'Chemistry' category"
   - **Performance:** Index covers common filter (90% of queries)

5. **`onDelete: Cascade` for Lab**
   - **Why:** If lab deleted, all services deleted (prevent orphaned services)
   - **Tradeoff:** Cannot soft-delete lab (must first deactivate services)

---

### Order Model

**Purpose:** Represents RFQ submissions and the complete order lifecycle.

**Schema:**
```prisma
// prisma/schema.prisma (lines 128-157)
model Order {
  id                      String      @id @default(cuid())
  clientId                String
  labId                   String
  serviceId               String
  status                  OrderStatus @default(QUOTE_REQUESTED) // ✅ Default: B2B workflow

  // RFQ Details (CLIENT-provided)
  clientDetails           Json        // ✅ Flexible: Contact info, shipping address
  sampleDescription       String      // ✅ Required: What to test
  specialInstructions     String?

  // Quote Fields (LAB_ADMIN-provided)
  quotedPrice             Decimal?    // ✅ Custom quote (separate from pricePerUnit)
  quotedAt                DateTime?
  quoteNotes              String?
  estimatedTurnaroundDays Int?

  // Approval/Rejection Fields (CLIENT-provided)
  quoteApprovedAt         DateTime?
  quoteRejectedAt         DateTime?
  quoteRejectedReason     String?

  // Lifecycle Timestamps
  acknowledgedAt          DateTime?
  completedAt             DateTime?
  createdAt               DateTime    @default(now())
  updatedAt               DateTime    @updatedAt

  client                  User         @relation("ClientOrders", fields: [clientId], references: [id])
  lab                     Lab          @relation(fields: [labId], references: [id])
  service                 LabService   @relation(fields: [serviceId], references: [id])
  attachments             Attachment[]

  @@index([clientId, status, createdAt(sort: Desc)])
  @@index([labId, status, createdAt(sort: Desc)])
  @@map("orders")
}
```

**Key Design Decisions:**

1. **`clientDetails` is JSON (Not Foreign Key)**
   - **Why:** Denormalize contact info (snapshot at order creation)
   - **Example:** `{ "contactEmail": "buyer@company.com", "contactPhone": "+63...", "shippingAddress": {...} }`
   - **Reasoning:** If client updates email, old orders retain original contact info (immutable history)

2. **`quotedPrice` Separate from `service.pricePerUnit`**
   - **Why:** Custom quotes differ from catalog prices
   - **Example:** Service lists ₱5000, lab quotes ₱12000 (complex sample)
   - **Validation:** For FIXED mode, `quotedPrice` auto-populated from `pricePerUnit` (but stored separately for audit trail)

3. **Separate Approval/Rejection Fields**
   - **Why:** Track both outcomes (analytics: quote approval rate, rejection reasons)
   - **Pattern:** `quoteApprovedAt` XOR `quoteRejectedAt` (never both)

4. **Composite Indexes:**
   - **Client Index:** `[clientId, status, createdAt DESC]`
     - **Query:** "Show my orders, filtered by status, newest first"
     - **Performance:** 90% of client dashboard queries
   - **Lab Index:** `[labId, status, createdAt DESC]`
     - **Query:** "Show orders for my lab, filtered by status, newest first"
     - **Performance:** 90% of lab admin dashboard queries

5. **Status Default: QUOTE_REQUESTED**
   - **Why:** B2B-first (quotation is primary workflow)
   - **Override:** For FIXED mode, application layer sets `status = 'PENDING'` before insert

---

### Attachment Model

**Purpose:** Stores file metadata for order-related documents (results, specifications).

**Schema:**
```prisma
// prisma/schema.prisma (lines 159-175)
model Attachment {
  id             String   @id @default(cuid())
  orderId        String
  uploadedById   String
  fileName       String
  fileUrl        String                          // ✅ UploadThing CDN URL
  fileType       String                          // ✅ MIME type (e.g., "application/pdf")
  fileSize       Int?
  attachmentType String                          // ✅ "specification", "result", "accreditation_certificate"
  createdAt      DateTime @default(now())

  order          Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
  uploadedBy     User  @relation(fields: [uploadedById], references: [id])

  @@index([orderId, attachmentType, createdAt(sort: Desc)])
  @@map("attachments")
}
```

**Key Design Decisions:**

1. **`fileUrl` Stores CDN URL (Not File Content)**
   - **Why:** UploadThing handles storage (S3-backed CDN)
   - **Example:** `"https://uploadthing.com/f/abc123.pdf"`
   - **Tradeoff:** Vendor lock-in to UploadThing (migration requires re-uploading files)

2. **`attachmentType` is String (Not Enum)**
   - **Why:** Flexible attachment types (future: "invoice", "dispute_evidence")
   - **Common values:** "specification", "result", "accreditation_certificate"

3. **`uploadedById` Tracks Uploader**
   - **Why:** Audit trail (who uploaded this file?)
   - **Security:** Authorization check (only order participants can upload)

4. **`onDelete: Cascade` for Order**
   - **Why:** If order deleted, attachments deleted (prevent orphaned files)
   - **Tradeoff:** UploadThing files not auto-deleted (must call `utapi.deleteFiles()`)

5. **Composite Index: `[orderId, attachmentType, createdAt DESC]`**
   - **Query:** "Show all result PDFs for this order, newest first"
   - **Performance:** Common query for order detail page

---

## Pricing Mode Implications

### Database Constraints by Pricing Mode

| Pricing Mode | `pricePerUnit` | Initial `quotedPrice` | Initial `status` | Lab Intervention |
|--------------|----------------|----------------------|------------------|------------------|
| QUOTE_REQUIRED | `null` (required) | `null` | QUOTE_REQUESTED | Always required |
| FIXED | NOT NULL | Auto-populated | PENDING | Never required |
| HYBRID | NOT NULL | Conditional | Conditional | Optional |

---

### Query Patterns by Pricing Mode

**Find all services requiring quotes:**
```sql
SELECT * FROM lab_services
WHERE pricing_mode = 'QUOTE_REQUIRED'
  AND active = true;
```

**Find all orders awaiting quotes:**
```sql
SELECT * FROM orders
WHERE status = 'QUOTE_REQUESTED'
  AND lab_id = $1
ORDER BY created_at DESC;
```

**Find all instant bookings (no quote needed):**
```sql
SELECT * FROM orders
WHERE status = 'PENDING'
  AND quoted_at IS NOT NULL  -- Auto-populated timestamp
  AND quote_approved_at IS NULL  -- Not from quote approval workflow
ORDER BY created_at DESC;
```

---

## Indexing Strategy

### Existing Indexes (Prisma Schema)

**LabService Indexes:**
```prisma
@@index([active, category, labId])
```

**Rationale:**
- **Query 1:** "Find all active Chemistry services"
  - Filter: `WHERE active = true AND category = 'Chemistry'`
  - Index covers: `[active, category]` prefix
- **Query 2:** "Find all active services for Lab X"
  - Filter: `WHERE active = true AND labId = 'lab-x'`
  - Index covers: `[active, labId]` (category not used)

---

**Order Indexes:**
```prisma
@@index([clientId, status, createdAt(sort: Desc)])
@@index([labId, status, createdAt(sort: Desc)])
```

**Rationale:**
- **Client Dashboard Query:**
  ```sql
  SELECT * FROM orders
  WHERE client_id = $1
    AND status = 'QUOTE_PROVIDED'  -- Filter by status
  ORDER BY created_at DESC
  LIMIT 20;
  ```
  - Index used: `[clientId, status, createdAt DESC]`
  - Performance: Index-only scan (no table access needed)

- **Lab Admin Dashboard Query:**
  ```sql
  SELECT * FROM orders
  WHERE lab_id = $1
    AND status = 'QUOTE_REQUESTED'
  ORDER BY created_at DESC
  LIMIT 20;
  ```
  - Index used: `[labId, status, createdAt DESC]`
  - Performance: Index-only scan

---

**Attachment Indexes:**
```prisma
@@index([orderId, attachmentType, createdAt(sort: Desc)])
```

**Rationale:**
- **Order Detail Page Query:**
  ```sql
  SELECT * FROM attachments
  WHERE order_id = $1
    AND attachment_type = 'result'
  ORDER BY created_at DESC;
  ```
  - Index used: `[orderId, attachmentType, createdAt DESC]`
  - Performance: Index-only scan

---

### Future Index Recommendations

**Index 1: Email Lookup (Already Unique)**
```prisma
// Already exists in schema
email String @unique
```
- **Reason:** Login queries (`WHERE email = $1`) use unique constraint as index
- **Performance:** O(log n) lookup

---

**Index 2: Quote Provision Ownership Check**
```sql
-- Recommended index
CREATE INDEX idx_orders_lab_ownership ON orders(lab_id, id);
```

**Query:**
```sql
SELECT * FROM orders
WHERE id = $1
  AND lab_id IN (
    SELECT id FROM labs WHERE owner_id = $2
  );
```

**Why Not in Schema Yet:**
- Current queries use `prisma.order.findFirst()` with nested `lab.ownerId` filter
- Prisma generates subquery, existing `[labId, ...]` index sufficient
- Future: If ownership checks become bottleneck, add explicit index

---

**Index 3: Service Catalog Search (Future)**
```sql
-- For full-text search on service names/descriptions
CREATE INDEX idx_lab_services_search ON lab_services
USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));
```

**Query:**
```sql
SELECT * FROM lab_services
WHERE to_tsvector('english', name || ' ' || description) @@ plainto_tsquery('english', 'heavy metal water');
```

**Why Not in Schema Yet:**
- Stage 1-2: Simple filtering (category, lab name)
- Stage 3: Full-text search across service descriptions (add GIN index)

---

## Migration Strategy

### Development: `db:push` (Rapid Iteration)

**Command:**
```bash
npm run db:push
```

**Behavior:**
- Syncs Prisma schema to database without migration files
- Destructive: Drops/recreates tables if schema changed incompatibly
- Fast: No migration file generation

**Use Case:**
- Local development (database is disposable)
- Prototyping new features

**Warning:**
- **NEVER use in production** (data loss risk)

---

### Production: `db:migrate` (Versioned Migrations)

**Command:**
```bash
npm run db:migrate
```

**Behavior:**
- Generates migration file (SQL statements)
- Non-destructive: Uses `ALTER TABLE` instead of `DROP TABLE`
- Versioned: Migration files committed to Git

**Example Migration (Add `pricingMode` Column):**
```sql
-- migrations/20251115_add_pricing_mode.sql
ALTER TABLE lab_services
ADD COLUMN pricing_mode TEXT NOT NULL DEFAULT 'QUOTE_REQUIRED';

-- Update existing services (backward compatibility)
UPDATE lab_services
SET pricing_mode = CASE
  WHEN price_per_unit IS NOT NULL THEN 'FIXED'
  ELSE 'QUOTE_REQUIRED'
END;
```

**Rollback Migration:**
```sql
-- migrations/20251115_add_pricing_mode_rollback.sql
ALTER TABLE lab_services
DROP COLUMN pricing_mode;
```

---

### Migration Best Practices

1. **Test on Staging First**
   - Run migration on Neon branch database (preview deployment)
   - Verify data integrity (no null violations, no constraint failures)

2. **Always Provide Rollback Script**
   - Document how to undo migration (in comments or separate file)
   - Example: "To rollback, run: DROP COLUMN pricing_mode"

3. **Avoid Destructive Changes**
   - ❌ `DROP TABLE` (use soft delete: `active = false`)
   - ❌ `ALTER COLUMN DROP NOT NULL` (might orphan foreign keys)
   - ✅ `ADD COLUMN` with default value (safe)
   - ✅ `CREATE INDEX CONCURRENTLY` (non-blocking)

4. **Batch Large Updates**
   - Updating 1M+ rows blocks writes (10+ seconds)
   - Use batching:
     ```sql
     UPDATE orders SET status = 'PENDING'
     WHERE status = 'QUOTE_APPROVED'
     LIMIT 1000;  -- Repeat until 0 rows affected
     ```

---

## Performance Considerations

### Constraint 1: Neon Serverless Connection Limits

**Free Tier:**
- 10 concurrent connections
- 100ms cold start (after 5 minutes idle)

**Impact:**
- Vercel serverless functions create new connection per request
- 50 concurrent users → 50 connections → Exceeds limit

**Mitigation:**
- **Prisma Connection Pooling** (built-in):
  ```typescript
  // lib/db.ts (lines 5-9)
  export const prisma = globalForPrisma.prisma || new PrismaClient()

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
  ```
  - Singleton pattern reuses connection across requests
  - Connection pool size: 10 (configurable via `?connection_limit=10`)

- **Future: Prisma Data Proxy** (connection pooling service)
  - Prisma manages connections (1000+ pooled)
  - Cost: $25/month (Stage 3+)

---

### Constraint 2: Decimal Precision for Pricing

**Prisma Decimal Type:**
```prisma
quotedPrice Decimal?  // Stored as NUMERIC in PostgreSQL
```

**Precision:** Arbitrary precision (no floating-point errors)

**Example:**
```javascript
// ✅ CORRECT (Using Prisma Decimal)
quotedPrice: new Prisma.Decimal("12345.67")

// ❌ WRONG (JavaScript Number - floating-point errors)
quotedPrice: 12345.67  // Might become 12345.669999999
```

**Why This Matters:**
- Financial calculations must be exact (₱12,345.67 = ₱12,345.67, not ₱12,345.66999)
- Audit trail integrity (quotedPrice in database matches invoice)

---

### Constraint 3: JSON Column Query Performance

**`clientDetails` is JSON:**
```prisma
clientDetails Json  // PostgreSQL JSONB type
```

**Query Performance:**
```sql
-- Slow: No index on JSON field
SELECT * FROM orders
WHERE client_details->>'contactEmail' = 'client@example.com';
```

**Mitigation (Future):**
```sql
-- Create GIN index on JSON field
CREATE INDEX idx_orders_client_email ON orders
USING GIN ((client_details->'contactEmail'));
```

**Current Status:**
- No JSON queries in production (filter by `clientId`, not `contactEmail`)
- Future: If searching orders by contact email becomes common, add GIN index

---

## Data Integrity Rules

### Rule 1: Pricing Mode ↔ pricePerUnit Constraint

**Application-Level Validation (Zod):**
```typescript
const labServiceSchema = z.object({
  pricingMode: z.enum(['QUOTE_REQUIRED', 'FIXED', 'HYBRID']),
  pricePerUnit: z.number().positive().optional()
}).refine(
  (data) => {
    if (data.pricingMode === 'QUOTE_REQUIRED') {
      return data.pricePerUnit === undefined || data.pricePerUnit === null
    } else {
      return data.pricePerUnit !== undefined && data.pricePerUnit !== null
    }
  },
  {
    message: 'FIXED/HYBRID modes require pricePerUnit, QUOTE_REQUIRED must not have pricePerUnit'
  }
)
```

**Future: Database-Level Constraint (PostgreSQL Check):**
```sql
ALTER TABLE lab_services
ADD CONSTRAINT check_pricing_mode_price CHECK (
  (pricing_mode = 'QUOTE_REQUIRED' AND price_per_unit IS NULL) OR
  (pricing_mode IN ('FIXED', 'HYBRID') AND price_per_unit IS NOT NULL)
);
```

---

### Rule 2: Order Status ↔ Quote Fields Constraint

**Invariant:**
- `status = QUOTE_PROVIDED` → `quotedPrice IS NOT NULL AND quotedAt IS NOT NULL`
- `status = PENDING` → `quotedPrice IS NOT NULL`

**Validation (Application Layer):**
```typescript
if (order.status === 'QUOTE_PROVIDED' && !order.quotedPrice) {
  throw new Error('QUOTE_PROVIDED status requires quotedPrice')
}
```

**Future: Database Trigger (Complex):**
```sql
CREATE OR REPLACE FUNCTION validate_order_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'QUOTE_PROVIDED' AND (NEW.quoted_price IS NULL OR NEW.quoted_at IS NULL) THEN
    RAISE EXCEPTION 'QUOTE_PROVIDED requires quotedPrice and quotedAt';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_order_status
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION validate_order_status();
```

---

### Rule 3: Mutual Exclusion (Approval XOR Rejection)

**Invariant:**
- `quoteApprovedAt` and `quoteRejectedAt` cannot both be set

**Validation (Application Layer):**
```typescript
if (order.quoteApprovedAt && order.quoteRejectedAt) {
  throw new Error('Order cannot be both approved and rejected')
}
```

**Future: Database Check Constraint:**
```sql
ALTER TABLE orders
ADD CONSTRAINT check_approval_xor_rejection CHECK (
  (quote_approved_at IS NULL) OR (quote_rejected_at IS NULL)
);
```

---

## Summary: Database Optimization Checklist

**Current Optimizations (In Place):**
- [x] Composite indexes on `orders` (clientId, labId queries)
- [x] Composite index on `lab_services` (active, category filters)
- [x] Composite index on `attachments` (orderId queries)
- [x] Prisma connection pooling (singleton pattern)
- [x] Decimal precision for financial fields
- [x] Cascade deletes (prevent orphaned records)

**Future Optimizations (Stage 3+):**
- [ ] GIN index on `clientDetails` JSON (email search)
- [ ] Full-text search index on `lab_services.name/description`
- [ ] Database-level pricing mode constraint (enforce pricePerUnit requirement)
- [ ] Database-level status transition triggers (enforce state machine)
- [ ] Prisma Data Proxy (connection pooling at scale)
- [ ] Read replicas for analytics queries (separate from transactional DB)

---

**Document Owner:** Architecture Mentor
**Review Cadence:** After schema changes
**Related Documents:**
- `PRICING_AND_QUOTATION_SYSTEM.md` - Order lifecycle and pricing logic
- `API_DESIGN_PATTERNS.md` - Database transaction patterns
- `prisma/schema.prisma` - Single source of truth for schema
