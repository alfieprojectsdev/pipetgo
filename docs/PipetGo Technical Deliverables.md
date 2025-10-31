# PipetGo Technical Deliverables

---

## 1. REQUIREMENTS DOCUMENT

### 1.1 Functional Requirements

#### FR1: User Management & Authentication
- **FR1.1:** Users register with email/password (email verification required)
- **FR1.2:** System supports 4 roles: CLIENT, LAB_ADMIN, LAB_STAFF, PLATFORM_ADMIN
- **FR1.3:** Users can update profile (name, contact info, password)
- **FR1.4:** Password reset via email token
- **FR1.5:** Session management with JWT (7-day expiry, refresh tokens)

#### FR2: Lab Profile Management (LAB_ADMIN only)
- **FR2.1:** Lab admin creates lab profile (name, description, location, certifications)
- **FR2.2:** Lab admin adds/edits/deactivates services offered
- **FR2.3:** Each service includes: name, category, description, price, unit type, turnaround time
- **FR2.4:** Lab location stored as JSONB `{address, city, province, coordinates}`
- **FR2.5:** Certifications displayed as badges (ISO, FDA, DOH accreditations)

#### FR3: Service Discovery (All Users)
- **FR3.1:** Browse all active lab services (paginated, 20 per page)
- **FR3.2:** Filter by: category, price range, location (city), turnaround time
- **FR3.3:** Search by service name or lab name (basic text matching)
- **FR3.4:** View service details: description, lab info, pricing breakdown
- **FR3.5:** Anonymous users can browse but must register to submit orders

#### FR4: Order Management
**CLIENT perspective:**
- **FR4.1:** Client submits order request (select service, describe sample, provide contact details)
- **FR4.2:** Contact details captured as JSONB snapshot (email, phone, shipping address)
- **FR4.3:** Client views order history with status tracking
- **FR4.4:** Client downloads results when order status = COMPLETED

**LAB_ADMIN perspective:**
- **FR4.5:** Lab views incoming orders for their services
- **FR4.6:** Lab updates order status: PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
- **FR4.7:** Lab uploads result files (PDF/Excel/Images, max 10MB per file)
- **FR4.8:** Lab adds internal notes (not visible to client)

**PLATFORM_ADMIN perspective:**
- **FR4.9:** Admin views all platform orders across all labs
- **FR4.10:** Admin can intervene in disputes (mark order CANCELLED with refund flag)

#### FR5: File Attachments
- **FR5.1:** Support file types: PDF, XLSX, JPG, PNG
- **FR5.2:** Maximum 5 files per order, 10MB per file
- **FR5.3:** Files categorized: specification (client uploads), result (lab uploads), certificate (lab uploads)
- **FR5.4:** Secure access: only order participants (client + lab + admin) can download
- **FR5.5:** Files stored with virus scanning (ClamAV or cloud service)

#### FR6: Notifications (MVP: Email only)
- **FR6.1:** Email on order status change (CLIENT + LAB_ADMIN)
- **FR6.2:** Email when results uploaded (CLIENT)
- **FR6.3:** Email for new order received (LAB_ADMIN)
- **FR6.4:** Welcome email on registration (ALL)

#### FR7: Payment Tracking (Mock for MVP)
- **FR7.1:** Order record includes `estimated_price` field
- **FR7.2:** Payment status enum: UNPAID, PAID, REFUNDED, FAILED
- **FR7.3:** Admin dashboard shows revenue metrics (total, by lab, by month)
- **FR7.4:** No actual payment processing in Stage 1—button shows "Payment integration coming soon"

---

### 1.2 Non-Functional Requirements

#### NFR1: Performance
- **NFR1.1:** Page load time < 2 seconds on 3G connection
- **NFR1.2:** API response time < 500ms for read operations
- **NFR1.3:** Database queries optimized with indexes on foreign keys, email, order status
- **NFR1.4:** Support 100 concurrent users (MVP scale)

#### NFR2: Security
- **NFR2.1:** Passwords hashed with bcrypt (10 rounds)
- **NFR2.2:** HTTPS enforced (SSL certificate via Vercel/hosting provider)
- **NFR2.3:** SQL injection prevented via Prisma parameterized queries
- **NFR2.4:** XSS protection: sanitize user inputs, CSP headers enabled
- **NFR2.5:** CSRF tokens for state-changing operations
- **NFR2.6:** Rate limiting: 100 requests/minute per IP for public routes, 20/minute for auth routes
- **NFR2.7:** File uploads scanned for malware before storage

#### NFR3: Reliability
- **NFR3.1:** 99% uptime target (reasonable for MVP on Vercel/Neon free tiers)
- **NFR3.2:** Database backups daily (Neon automated backups)
- **NFR3.3:** Error logging to Sentry (capture exceptions, not PII)
- **NFR3.4:** Graceful degradation: if file upload fails, show error but don't crash order flow

#### NFR4: Scalability (Future-proofing)
- **NFR4.1:** Database schema supports multi-tenancy (each lab isolated by `lab_id`)
- **NFR4.2:** Stateless API design (JWT tokens, no server-side sessions beyond NextAuth)
- **NFR4.3:** Prepared for horizontal scaling (no hard-coded file paths, use env vars)

#### NFR5: Maintainability
- **NFR5.1:** TypeScript strict mode enabled
- **NFR5.2:** ESLint + Prettier configured (consistent code style)
- **NFR5.3:** Database migrations tracked (Prisma migrate)
- **NFR5.4:** API endpoints documented (inline comments, consider Swagger later)
- **NFR5.5:** Component-driven architecture (reusable UI components)

#### NFR6: Usability
- **NFR6.1:** Mobile-responsive (Tailwind breakpoints: sm, md, lg)
- **NFR6.2:** Accessible (WCAG 2.1 AA: semantic HTML, ARIA labels, keyboard navigation)
- **NFR6.3:** Filipino-friendly: support Tagalog content (db field `locale`, default 'en')
- **NFR6.4:** Error messages user-friendly, not technical jargon

#### NFR7: Compliance
- **NFR7.1:** Privacy policy displayed (GDPR-inspired, PH Data Privacy Act)
- **NFR7.2:** Users can request data export (JSON dump of their orders/profile)
- **NFR7.3:** Users can request account deletion (soft delete, retain orders for audit)

---

## 2. ENTITY RELATIONSHIP DIAGRAM (ERD)

### 2.1 Mermaid Diagram

```mermaid
erDiagram
    USERS ||--o{ LABS : owns
    USERS ||--o{ ORDERS : "creates (as client)"
    USERS ||--o{ ATTACHMENTS : uploads
    USERS ||--o{ AUDIT_LOGS : triggers
    
    LABS ||--o{ LAB_SERVICES : offers
    LABS ||--o{ ORDERS : fulfills
    
    LAB_SERVICES ||--o{ ORDERS : "included in"
    
    ORDERS ||--o{ ATTACHMENTS : contains
    ORDERS ||--o{ AUDIT_LOGS : tracks
    
    USERS {
        string id PK
        string email UK
        string password_hash
        string name
        enum role "CLIENT|LAB_ADMIN|LAB_STAFF|PLATFORM_ADMIN"
        timestamp created_at
        timestamp updated_at
    }
    
    LABS {
        string id PK
        string owner_id FK
        string name
        text description
        jsonb location "address, city, coordinates"
        string[] certifications
        timestamp created_at
        timestamp updated_at
    }
    
    LAB_SERVICES {
        string id PK
        string lab_id FK
        string name
        text description
        string category "Chromatography, Rheology, etc"
        decimal price_per_unit
        string unit_type "sample, hour, test"
        int turnaround_days
        boolean is_active
        timestamp created_at
    }
    
    ORDERS {
        string id PK
        string client_id FK
        string lab_id FK
        string service_id FK
        enum status "PENDING|CONFIRMED|IN_PROGRESS|COMPLETED|CANCELLED"
        text sample_description
        text special_instructions
        jsonb client_details "email, phone, shipping_address"
        decimal estimated_price
        enum payment_status "UNPAID|PAID|REFUNDED|FAILED"
        timestamp created_at
        timestamp updated_at
    }
    
    ATTACHMENTS {
        string id PK
        string order_id FK
        string uploaded_by FK
        string file_name
        string file_url
        string file_type "pdf, xlsx, jpg, png"
        int file_size_bytes
        enum attachment_type "specification|result|certificate"
        timestamp created_at
    }
    
    AUDIT_LOGS {
        string id PK
        string entity_type "order, user, lab"
        string entity_id
        string action "created, updated, status_changed"
        jsonb old_values
        jsonb new_values
        string user_id FK
        string ip_address
        timestamp created_at
    }
```

---

### 2.2 ERD Explanation & Design Decisions

#### Core Entities

**USERS (Central Identity)**
- Single table for all roles (CLIENT, LAB_ADMIN, LAB_STAFF, PLATFORM_ADMIN)
- **Why not separate tables?** Role changes are rare; JOIN overhead not worth the complexity
- **Indexes:** `email` (unique), `role` (filter queries)

**LABS (Service Provider Profiles)**
- One-to-many with USERS via `owner_id` (one admin owns a lab)
- `location` as JSONB allows flexible address formats without rigid schema
- **Trade-off:** JSONB harder to validate, but queries like "find labs in Quezon City" are simpler
- **Indexes:** `owner_id`, GIN index on `location` for JSON queries

**LAB_SERVICES (Service Catalog)**
- Belongs to one LAB, many orders can reference one service
- `category` as TEXT (not foreign key to categories table) — categories are stable, not user-generated
- `is_active` flag for soft-delete (don't break historical orders)
- **Indexes:** `lab_id`, `category`, `is_active`

**ORDERS (Transaction Core)**
- Links CLIENT (user), LAB, and SERVICE
- `client_details` as JSONB captures **point-in-time contact info** (critical for audits if client updates profile later)
- State machine: `PENDING` → `CONFIRMED` → `IN_PROGRESS` → `COMPLETED` | `CANCELLED`
- **Why no separate Quotes table?** Conflates workflow; quotes are implicit in status transitions
- **Indexes:** `client_id`, `lab_id`, `service_id`, `status`, `created_at`

**ATTACHMENTS (Files)**
- Separate table (not embedded in orders) for:
  - Metadata tracking (size, uploader, type)
  - Multiple files per order
  - Access control (query who uploaded)
- `attachment_type` distinguishes client specs from lab results
- **Indexes:** `order_id`, `uploaded_by`

**AUDIT_LOGS (Compliance Trail)**
- Tracks all critical actions (order status changes, user updates)
- `old_values` / `new_values` as JSONB stores snapshots for diffs
- **Use case:** "Who changed this order to CANCELLED and when?"
- **Indexes:** `entity_type`, `entity_id`, `created_at`

---

#### Relationships Summary

| Relationship | Cardinality | Constraint |
|--------------|-------------|------------|
| User → Labs | 1:N | One user owns multiple labs (future: multi-lab admins) |
| Lab → Services | 1:N | One lab offers many services |
| User (client) → Orders | 1:N | One client has many orders |
| Lab → Orders | 1:N | One lab fulfills many orders |
| Service → Orders | 1:N | One service appears in many orders |
| Order → Attachments | 1:N | One order has multiple files |
| User → Attachments | 1:N | One user uploads multiple files |
| Order → Audit Logs | 1:N | One order has many history entries |

---

#### Normalization Trade-offs

**What's normalized (3NF):**
- Users, Labs, Services (no redundant data)
- Foreign keys maintain referential integrity

**Strategic denormalization:**
- `orders.client_details` (JSONB): Violates 1NF but essential for legal/audit reasons (addresses change!)
- `labs.location` (JSONB): Faster geospatial queries, avoids overly complex address normalization

**What's NOT in the schema (intentionally deferred):**
- **Reviews table:** Stage 3 feature
- **Quotes table:** Merged into order status workflow
- **LogisticsTasks table:** MVP mocks logistics; add in Stage 2 when integrating Lalamove API
- **Transactions table:** Payment processing deferred to Stage 2

---

## 3. API ENDPOINTS SPECIFICATION

### 3.1 Authentication Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | No | Create new user account |
| POST | `/api/auth/signin` | No | NextAuth credential login |
| POST | `/api/auth/signout` | Yes | Invalidate session |
| POST | `/api/auth/forgot-password` | No | Send password reset email |
| POST | `/api/auth/reset-password` | No | Reset password with token |
| GET | `/api/auth/session` | No | Get current session (NextAuth) |

**Example: POST /api/auth/register**
```typescript
// Request
{
  "email": "researcher@example.com",
  "password": "SecurePass123!",
  "name": "Juan dela Cruz",
  "role": "CLIENT" // or LAB_ADMIN
}

// Response (201 Created)
{
  "user": {
    "id": "clx9k2m3n0000qe8t5h1g2v4w",
    "email": "researcher@example.com",
    "name": "Juan dela Cruz",
    "role": "CLIENT"
  }
}

// Error Response (400)
{
  "error": "Email already registered"
}
```

---

### 3.2 User Management Endpoints

| Method | Endpoint | Auth Required | Roles | Description |
|--------|----------|---------------|-------|-------------|
| GET | `/api/users/me` | Yes | All | Get current user profile |
| PATCH | `/api/users/me` | Yes | All | Update own profile |
| DELETE | `/api/users/me` | Yes | All | Delete own account (soft delete) |

---

### 3.3 Lab Management Endpoints

| Method | Endpoint | Auth Required | Roles | Description |
|--------|----------|---------------|-------|-------------|
| POST | `/api/labs` | Yes | LAB_ADMIN | Create lab profile |
| GET | `/api/labs` | No | All | List all labs (public) |
| GET | `/api/labs/:id` | No | All | Get lab details |
| PATCH | `/api/labs/:id` | Yes | LAB_ADMIN (owner) | Update lab profile |
| DELETE | `/api/labs/:id` | Yes | LAB_ADMIN (owner) | Deactivate lab |

**Example: POST /api/labs**
```typescript
// Request
{
  "name": "Makati Testing Laboratory",
  "description": "ISO 17025 certified analytical services",
  "location": {
    "address": "123 Ayala Avenue",
    "city": "Makati",
    "province": "Metro Manila",
    "coordinates": { "lat": 14.5547, "lng": 121.0244 }
  },
  "certifications": ["ISO 17025", "FDA LTO"]
}

// Response (201 Created)
{
  "lab": {
    "id": "clx9k2m3n0001qe8t5h1g2v4x",
    "ownerId": "clx9k2m3n0000qe8t5h1g2v4w",
    "name": "Makati Testing Laboratory",
    "location": {...},
    "certifications": ["ISO 17025", "FDA LTO"],
    "createdAt": "2025-09-30T12:00:00Z"
  }
}
```

---

### 3.4 Lab Services Endpoints

| Method | Endpoint | Auth Required | Roles | Description |
|--------|----------|---------------|-------|-------------|
| POST | `/api/labs/:labId/services` | Yes | LAB_ADMIN (owner) | Add service to lab |
| GET | `/api/services` | No | All | Browse all services (with filters) |
| GET | `/api/services/:id` | No | All | Get service details |
| PATCH | `/api/services/:id` | Yes | LAB_ADMIN (owner) | Update service |
| DELETE | `/api/services/:id` | Yes | LAB_ADMIN (owner) | Deactivate service |

**Query Parameters for GET /api/services:**
- `category` (string): Filter by category (e.g., "Chromatography")
- `minPrice` / `maxPrice` (number): Price range filter
- `city` (string): Filter by lab location city
- `maxTurnaround` (number): Filter by turnaround days
- `page` (number): Pagination (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)

**Example: GET /api/services?category=Rheology&city=Quezon%20City**
```typescript
// Response (200 OK)
{
  "services": [
    {
      "id": "clx9k2m3n0002qe8t5h1g2v4y",
      "labId": "clx9k2m3n0001qe8t5h1g2v4x",
      "lab": {
        "name": "Makati Testing Laboratory",
        "location": { "city": "Quezon City" }
      },
      "name": "Viscosity Testing",
      "category": "Rheology",
      "pricePerUnit": 2500.00,
      "unitType": "sample",
      "turnaroundDays": 3
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "totalPages": 3
  }
}
```

---

### 3.5 Order Management Endpoints

| Method | Endpoint | Auth Required | Roles | Description |
|--------|----------|---------------|-------|-------------|
| POST | `/api/orders` | Yes | CLIENT | Submit new order request |
| GET | `/api/orders` | Yes | All | List orders (filtered by role) |
| GET | `/api/orders/:id` | Yes | Participants | Get order details |
| PATCH | `/api/orders/:id` | Yes | LAB_ADMIN, ADMIN | Update order status |
| DELETE | `/api/orders/:id` | Yes | ADMIN | Cancel order (with reason) |

**Access Control Logic:**
- CLIENT sees only their own orders
- LAB_ADMIN sees orders for their lab's services
- PLATFORM_ADMIN sees all orders

**Example: POST /api/orders**
```typescript
// Request
{
  "serviceId": "clx9k2m3n0002qe8t5h1g2v4y",
  "sampleDescription": "3 liquid polymer samples, each 50mL, for viscosity analysis at 25°C",
  "specialInstructions": "Handle with care, temperature-sensitive",
  "clientDetails": {
    "contactEmail": "researcher@example.com",
    "contactPhone": "+639171234567",
    "shippingAddress": {
      "street": "456 Katipunan Avenue",
      "city": "Quezon City",
      "province": "Metro Manila",
      "postalCode": "1108"
    }
  }
}

// Response (201 Created)
{
  "order": {
    "id": "clx9k2m3n0003qe8t5h1g2v4z",
    "clientId": "clx9k2m3n0000qe8t5h1g2v4w",
    "labId": "clx9k2m3n0001qe8t5h1g2v4x",
    "serviceId": "clx9k2m3n0002qe8t5h1g2v4y",
    "status": "PENDING",
    "estimatedPrice": 2500.00,
    "paymentStatus": "UNPAID",
    "createdAt": "2025-09-30T14:30:00Z"
  }
}
```

**Example: PATCH /api/orders/:id (Status Update)**
```typescript
// Request (LAB_ADMIN updating status)
{
  "status": "CONFIRMED"
}

// Response (200 OK)
{
  "order": {
    "id": "clx9k2m3n0003qe8t5h1g2v4z",
    "status": "CONFIRMED",
    "updatedAt": "2025-09-30T15:00:00Z"
  }
}

// Triggers:
// - Audit log entry created
// - Email notification sent to client
```

---

### 3.6 File Attachment Endpoints

| Method | Endpoint | Auth Required | Roles | Description |
|--------|----------|---------------|-------|-------------|
| POST | `/api/orders/:orderId/attachments` | Yes | CLIENT, LAB_ADMIN | Upload file to order |
| GET | `/api/orders/:orderId/attachments` | Yes | Participants | List order files |
| GET | `/api/attachments/:id/download` | Yes | Participants | Download file (signed URL) |
| DELETE | `/api/attachments/:id` | Yes | Uploader, ADMIN | Delete file |

**Example: POST /api/orders/:orderId/attachments**
```typescript
// Request (multipart/form-data)
// FormData: { file: File, attachmentType: "result" }

// Response (201 Created)
{
  "attachment": {
    "id": "clx9k2m3n0004qe8t5h1g2v5a",
    "orderId": "clx9k2m3n0003qe8t5h1g2v4z",
    "uploadedBy": "clx9k2m3n0001qe8t5h1g2v4x",
    "fileName": "viscosity_results.pdf",
    "fileUrl": "/uploads/clx9k2m3n0004qe8t5h1g2v5a.pdf",
    "fileType": "pdf",
    "fileSizeBytes": 245760,
    "attachmentType": "result",
    "createdAt": "2025-10-01T09:00:00Z"
  }
}
```

---

### 3.7 Admin Endpoints

| Method | Endpoint | Auth Required | Roles | Description |
|--------|----------|---------------|-------|-------------|
| GET | `/api/admin/stats` | Yes | PLATFORM_ADMIN | Platform metrics (orders, revenue) |
| GET | `/api/admin/users` | Yes | PLATFORM_ADMIN | List all users |
| PATCH | `/api/admin/users/:id` | Yes | PLATFORM_ADMIN | Update user role |
| GET | `/api/admin/audit-logs` | Yes | PLATFORM_ADMIN | View audit trail |

---

### 3.8 Error Response Format (Standard)

All API errors follow this structure:

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR", // UNAUTHORIZED, NOT_FOUND, etc.
    "message": "Sample description must be at least 10 characters",
    "details": [
      {
        "field": "sampleDescription",
        "issue": "String must contain at least 10 characters"
      }
    ]
  }
}
```

**HTTP Status Codes:**
- `200` OK — Success
- `201` Created — Resource created
- `400` Bad Request — Validation error
- `401` Unauthorized — Not authenticated
- `403` Forbidden — Authenticated but insufficient permissions
- `404` Not Found — Resource doesn't exist
- `500` Internal Server Error — Server-side failure

---

## 4. SYSTEM ARCHITECTURE DIAGRAM

### 4.1 High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser]
        MOB[Mobile Browser]
    end
    
    subgraph "CDN & Edge"
        VERCEL[Vercel Edge Network]
    end
    
    subgraph "Application Layer - Next.js 14"
        NEXTJS[Next.js App Router]
        SSR[Server Components]
        API[API Routes /api/*]
        AUTH[NextAuth.js Middleware]
    end
    
    subgraph "Business Logic"
        SERVICES[Service Handlers]
        VALIDATION[Zod Schemas]
        AUTHZ[Authorization Logic]
    end
    
    subgraph "Data Layer"
        PRISMA[Prisma ORM]
        NEON[(Neon PostgreSQL)]
    end
    
    subgraph "External Services"
        EMAIL[SendGrid Email]
        STORAGE[Local FS / S3 Future]
        SENTRY[Sentry Error Tracking]
    end
    
    WEB --> VERCEL
    MOB --> VERCEL
    VERCEL --> NEXTJS
    NEXTJS --> SSR
    NEXTJS --> API
    API --> AUTH
    AUTH --> SERVICES
    SERVICES --> VALIDATION
    SERVICES --> AUTHZ
    SERVICES --> PRISMA
    PRISMA --> NEON
    SERVICES --> EMAIL
    SERVICES --> STORAGE
    SERVICES --> SENTRY
    
    style NEON fill:#3b82f6
    style VERCEL fill:#10b981
    style NEXTJS fill:#8b5cf6
```

---

### 4.2 Architecture Component Details

#### **Client Layer**
- **Web Browser:** Desktop/laptop users (Chrome, Firefox, Safari)
- **Mobile Browser:** Responsive design (Tailwind breakpoints), primary access method for Philippines market

#### **CDN & Edge Network**
- **Vercel Edge:** Static assets cached globally, Next.js edge middleware for auth checks
- **Benefits:** Fast page loads even on slow connections, automatic SSL

#### **Application Layer (Next.js 14)**
- **App Router:** File-based routing (`app/` directory structure)
- **Server Components:** Default for data fetching (reduces client JS bundle)
- **API Routes:** RESTful endpoints in `app/api/` folder
- **NextAuth Middleware:** Protects routes, injects session into requests

**Key Files:**
```
app/
├── (auth)/           # Auth pages (login, register)
├── (marketing)/      # Public pages (home, about)
├── dashboard/        # Role-based dashboards
│   ├── client/
│   ├── lab/
│   └── admin/
├── api/              # API routes
│   ├── auth/[...nextauth]/
│   ├── orders/
│   ├── services/
│   └── labs/
└── layout.tsx        # Root layout with AuthProvider
```

#### **Business Logic Layer**
- **Service Handlers:** Business logic isolated from API routes (testable)
  - `OrderService.createOrder()`
  - `LabService.updateProfile()`
- **Zod Schemas:** Input validation schemas shared between client/server
- **Authorization Logic:** Role-based access control functions
  - `canUpdateOrder(user, order)` → boolean

#### **Data Layer**
- **Prisma ORM:** Type-safe database queries, automatic migrations
- **Neon PostgreSQL:** Serverless Postgres (auto-scaling, branching for dev/staging)
- **Connection Pooling:** Prisma handles pooling, Neon supports max 100 connections (free tier)

#### **External Services**
- **SendGrid:** Email delivery (transactional emails, templates)
- **Storage:** MVP uses local filesystem (`/public/uploads`), migrate to S3/UploadThing in Stage 2
- **Sentry:** Error tracking, performance monitoring, user feedback collection

---

### 4.3 Data Flow Example: Order Submission

```mermaid
sequenceDiagram
    participant Client
    participant NextJS
    participant Auth
    participant OrderService
    participant Prisma
    participant DB
    participant Email
    
    Client->>NextJS: POST /api/orders
    NextJS->>Auth: Verify session
    Auth-->>NextJS: User authenticated (CLIENT role)
    NextJS->>OrderService: createOrder(data, user)
    OrderService->>OrderService: Validate with Zod
    OrderService->>Prisma: db.order.create()
    Prisma->>DB: INSERT INTO orders
    DB-->>Prisma: Order created
    Prisma-->>OrderService: Order object
    OrderService->>Prisma: db.auditLog.create()
    OrderService->>Email: Send confirmation to client
    OrderService->>Email: Notify lab of new order
    OrderService-->>NextJS: { order }
    NextJS-->>Client: 201 Created
```

---

### 4.4 Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Vercel (Production)             │
│  ┌────────────────────────────────────┐ │
│  │  Next.js App (Serverless Functions)│ │
│  │  - Auto-scaling                    │ │
│  │  - Edge middleware                 │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
              │
              │ Database Connection
              │ (PostgreSQL wire protocol)
              ▼
┌─────────────────────────────────────────┐
│      Neon (Serverless Postgres)         │
│  ┌────────────────────────────────────┐ │
│  │  Main Branch (Production)          │ │
│  │  - Daily backups                   │ │
│  │  - Point-in-time recovery          │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Environment Variables:**
```bash
# .env.local (development)
DATABASE_URL="postgresql://user:pass@localhost:5432/pipetgo"
NEXTAUTH_SECRET="generate-with-openssl-rand"
NEXTAUTH_URL="http://localhost:3000"

# .env.production (Vercel)
DATABASE_URL="postgresql://user:pass@neon.tech/pipetgo?sslmode=require"
NEXTAUTH_SECRET="production-secret"
NEXTAUTH_URL="https://pipetgo.vercel.app"
SENDGRID_API_KEY="SG.xxx"
SENTRY_DSN="https://xxx@sentry.io/xxx"
```

---

## 5. TASK BREAKDOWN & ROADMAP

### 5.1 Stage 1: Functional MVP (6-8 weeks)

#### **Milestone 1: Project Setup (Week 1)**

**Tasks:**
- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Configure Tailwind CSS, ESLint, Prettier
- [ ] Set up Prisma with Neon PostgreSQL
- [ ] Create initial database schema (users, labs, lab_services, orders)
- [ ] Run first migration: `prisma migrate dev --name init`
- [ ] Create seed script with sample data (3 labs, 15 services, 5 users)
- [ ] Set up Git repository, .gitignore, README

**Deliverables:**
- Working dev environment
- Database schema deployed
- Seed data loaded

**Estimated Time:** 5-7 days

---

#### **Milestone 2: Authentication System (Week 2)**

**Tasks:**
- [ ] Install and configure NextAuth.js v4
- [ ] Create auth API routes (`/api/auth/[...nextauth]`)
- [ ] Implement Credentials provider (email/password)
- [ ] Create Prisma adapter for NextAuth sessions
- [ ] Build registration page (`/auth/register`)
  - Form with email, password, name, role selection
  - Zod validation schema
  - Password hashing with bcrypt
- [ ] Build login page (`/auth/login`)
  - Form with email/password
  - Error handling (invalid credentials, account not found)
- [ ] Create `AuthProvider` wrapper for session context
- [ ] Implement auth middleware for protected routes
- [ ] Create `/api/auth/register` endpoint
- [ ] Add password reset functionality (email token-based)
- [ ] Test all auth flows (register, login, logout, session persistence)

**Deliverables:**
- Fully functional authentication
- Protected route middleware
- Session management working

**Estimated Time:** 7-10 days

---

#### **Milestone 3: User & Lab Profile Management (Week 3)**

**Tasks:**
- [ ] Create `/api/users/me` endpoint (GET, PATCH)
- [ ] Build user profile page (`/dashboard/profile`)
  - Edit name, email (require password confirmation)
  - Change password form
- [ ] Create `/api/labs` endpoints (POST, GET, PATCH)
- [ ] Build lab creation form (LAB_ADMIN only)
  - Fields: name, description, location (address, city, province)
  - Certifications input (multi-select or comma-separated)
- [ ] Build lab profile view page (`/labs/[id]`)
  - Display lab info, certifications, services offered
- [ ] Build lab management dashboard (`/dashboard/lab/settings`)
  - Edit lab profile
  - View lab statistics (orders received, revenue)
- [ ] Implement role-based access control
  - Middleware: `withAuth(['LAB_ADMIN'])`
  - Utility: `canManageLab(user, labId)`
- [ ] Add form validation with Zod for all inputs

**Deliverables:**
- User profile CRUD
- Lab profile CRUD
- Role-based dashboards

**Estimated Time:** 7-10 days

---

#### **Milestone 4: Service Catalog & Discovery (Week 4)**

**Tasks:**
- [ ] Create `/api/services` endpoints (GET list, GET by ID)
- [ ] Create `/api/labs/[labId]/services` endpoint (POST)
- [ ] Build service creation form (LAB_ADMIN only)
  - Fields: name, category, description, price, unit type, turnaround
  - Category dropdown (predefined list: Chromatography, Rheology, etc.)
- [ ] Build service listing page (`/services`)
  - Grid/list view with pagination
  - Filter sidebar (category, price range, city, turnaround)
  - Search bar (by service name or lab name)
- [ ] Build service detail page (`/services/[id]`)
  - Service info, lab info, pricing breakdown
  - "Request This Service" button (redirects to order form)
- [ ] Build lab's service management page (`/dashboard/lab/services`)
  - List services, add new, edit, deactivate
- [ ] Implement database indexes for performance
  - Index: `lab_services(lab_id, is_active, category)`
  - Index: `labs(location->>'city')` (GIN index for JSONB)
- [ ] Add pagination logic (use Prisma `skip` and `take`)

**Deliverables:**
- Public service catalog
- Service filtering/search
- Lab service management

**Estimated Time:** 7-10 days

---

#### **Milestone 5: Order Management System (Week 5-6)**

**Tasks:**
- [ ] Create `/api/orders` endpoints (POST, GET, PATCH)
- [ ] Build order submission form (`/order/new?serviceId=xxx`)
  - Sample description textarea (min 10 chars)
  - Special instructions textarea
  - Contact details: email, phone, shipping address
  - Display service info and estimated price
- [ ] Create order confirmation page (`/order/[id]/confirmation`)
  - Order details, status, next steps
- [ ] Build client order dashboard (`/dashboard/client/orders`)
  - List all orders with status badges
  - Filter by status
  - Click to view details
- [ ] Build client order detail page (`/dashboard/client/orders/[id]`)
  - Order info, timeline, attachments
  - Download results button (when status = COMPLETED)
- [ ] Build lab order dashboard (`/dashboard/lab/orders`)
  - List incoming orders for lab's services
  - Status filter, sort by date
  - Acknowledge/update status buttons
- [ ] Build lab order detail page (`/dashboard/lab/orders/[id]`)
  - Order details, client contact info
  - Status update buttons (CONFIRMED → IN_PROGRESS → COMPLETED)
  - Upload results section
  - Internal notes field (not visible to client)
- [ ] Implement order state machine validation
  - `PENDING` can only go to `CONFIRMED` or `CANCELLED`
  - `CONFIRMED` can only go to `IN_PROGRESS`
  - Etc.
- [ ] Create audit log entries on status changes
- [ ] Build admin order dashboard (`/dashboard/admin/orders`)
  - View all platform orders
  - Filter by lab, status, date range
  - Override/cancel orders

**Deliverables:**
- Complete order workflow
- Role-based order views
- State machine enforcement

**Estimated Time:** 10-14 days

---

#### **Milestone 6: File Upload & Management (Week 6-7)**

**Tasks:**
- [ ] Create `/api/orders/[orderId]/attachments` endpoint (POST)
- [ ] Set up file storage in `/public/uploads` directory
  - Generate unique filenames (UUID + extension)
  - Organize by order ID: `/public/uploads/[orderId]/[fileId].pdf`
- [ ] Implement file validation
  - Allowed types: PDF, XLSX, JPG, PNG
  - Max size: 10MB per file
  - Max 5 files per order
- [ ] Build file upload UI component
  - Drag-and-drop or click to select
  - Progress indicator
  - Preview thumbnail for images
- [ ] Add upload section to lab order detail page
  - Select attachment type (result, certificate)
  - Upload button with validation feedback
- [ ] Add attachments list to order detail pages
  - Display file name, type, size, uploader, date
  - Download button (generates secure download URL)
- [ ] Create `/api/attachments/[id]/download` endpoint
  - Verify user has access to order
  - Stream file with correct Content-Type header
- [ ] Implement access control
  - Only order participants (client + lab + admin) can access files
  - Function: `canAccessAttachment(user, attachment)`
- [ ] Add virus scanning (basic: file type validation; advanced: ClamAV integration deferred to Stage 2)

**Deliverables:**
- File upload system
- Secure file downloads
- Access control enforcement

**Estimated Time:** 7-10 days

---

#### **Milestone 7: Notifications & Email System (Week 7)**

**Tasks:**
- [ ] Set up SendGrid account and API key
- [ ] Create email service utility (`/lib/email.ts`)
  - Functions: `sendOrderConfirmation()`, `sendStatusUpdate()`, `sendResultsReady()`
- [ ] Design email templates (HTML + text fallback)
  - Welcome email (on registration)
  - Order confirmation (client)
  - New order notification (lab)
  - Status change notifications (client + lab)
  - Results ready notification (client)
- [ ] Integrate email sending into order workflow
  - Trigger on order creation
  - Trigger on status change
  - Trigger on file upload (if type = result)
- [ ] Add email preferences to user profile
  - Checkbox: "Email me on order status changes"
  - Checkbox: "Email me when results are ready"
- [ ] Test all email flows end-to-end
- [ ] Add email logging (store sent emails in audit_logs for debugging)
- [ ] Handle SendGrid errors gracefully (don't fail order if email fails)

**Deliverables:**
- Email notification system
- Transactional email templates
- Error handling

**Estimated Time:** 5-7 days

---

#### **Milestone 8: UI Polish & Testing (Week 8)**

**Tasks:**
- [ ] Design and implement UI components
  - Service card component
  - Order status badge component
  - Dashboard stat cards
  - Loading states (skeletons)
  - Error states (user-friendly messages)
- [ ] Improve mobile responsiveness
  - Test all pages on mobile viewport
  - Adjust layouts for small screens
  - Ensure forms are touch-friendly
- [ ] Add accessibility features
  - Semantic HTML (proper headings, labels)
  - ARIA labels for interactive elements
  - Keyboard navigation (focus states)
  - Screen reader testing
- [ ] Implement error boundaries (React Error Boundary)
- [ ] Add loading indicators (Suspense boundaries)
- [ ] Create 404 and 500 error pages
- [ ] Write unit tests for critical functions
  - Auth utilities
  - Validation schemas
  - Business logic functions
- [ ] Perform integration testing
  - Test complete user flows (register → order → fulfill)
  - Test role-based access control
  - Test file upload/download
- [ ] Fix bugs discovered during testing
- [ ] Optimize performance
  - Add database indexes (if not already done)
  - Lazy load components
  - Optimize images (Next.js Image component)

**Deliverables:**
- Polished UI
- Accessible interface
- Test coverage
- Bug fixes

**Estimated Time:** 7-10 days

---

#### **Milestone 9: Deployment & Launch (Week 8)**

**Tasks:**
- [ ] Set up Vercel account and project
- [ ] Configure environment variables in Vercel
  - Database URL (Neon production connection string)
  - NextAuth secret and URL
  - SendGrid API key
- [ ] Run database migration on production database
- [ ] Deploy to Vercel (connect GitHub repo, auto-deploy on push)
- [ ] Test production deployment
  - Verify all features work in production
  - Check SSL certificate
  - Test email delivery
- [ ] Set up Sentry for error tracking
  - Install Sentry SDK
  - Configure error reporting
  - Test error capture
- [ ] Create initial admin user in production database
- [ ] Seed production database with sample data (optional)
- [ ] Set up monitoring
  - Vercel Analytics for page views
  - Sentry for errors
  - Database monitoring via Neon dashboard
- [ ] Create backup strategy
  - Neon automatic backups (verify enabled)
  - Document restore procedure
- [ ] Write deployment documentation
  - How to deploy updates
  - Environment variable reference
  - Troubleshooting guide

**Deliverables:**
- Live production site
- Error tracking enabled
- Monitoring in place
- Documentation complete

**Estimated Time:** 3-5 days

---

### 5.2 Stage 1 Summary

**Total Estimated Time:** 6-8 weeks (solo developer, part-time)

**Risks & Mitigation:**

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Scope creep** | Delays MVP launch | Strictly defer non-essential features (payments, logistics, reviews) to Stage 2 |
| **Auth complexity** | Time sink debugging | Use stable NextAuth v4, follow official docs closely, test early |
| **File upload security** | Vulnerabilities | Implement file type validation, size limits, virus scanning (basic); defer advanced scanning to Stage 2 |
| **Performance issues** | Poor UX on slow connections | Add database indexes, lazy load components, test on 3G connection |
| **Email deliverability** | Users don't receive notifications | Use reputable provider (SendGrid), verify domain, test thoroughly |

**Success Criteria for Stage 1:**
- [ ] User can register, log in, and manage profile
- [ ] Lab admin can create lab and add services
- [ ] Client can browse services and submit orders
- [ ] Lab admin can view orders and update status
- [ ] Lab admin can upload result files
- [ ] Client can download results
- [ ] Email notifications sent for key events
- [ ] All features work on mobile devices
- [ ] Site deployed to production with SSL

---

### 5.3 Stage 2: Professional Polish (4-5 weeks post-MVP)

**Focus:** Production-ready features, payment integration, logistics

#### **Milestones:**

**Milestone 1: Payment Integration (Week 1-2)**
- [ ] Set up Stripe account (Philippines)
- [ ] Integrate Stripe Checkout for card payments
- [ ] Create payment flow: Order → Payment → Confirmation
- [ ] Add payment webhooks for status updates
- [ ] Implement refund logic
- [ ] Add Paymongo for GCash/PayMaya (Week 2)
- [ ] Create payment dashboard for admins (revenue tracking)

**Milestone 2: File Storage Migration (Week 2)**
- [ ] Set up S3 bucket or UploadThing account
- [ ] Migrate file upload logic from local to cloud storage
- [ ] Update download endpoint to use signed URLs
- [ ] Migrate existing files from production (if any)
- [ ] Add virus scanning (ClamAV or cloud service)

**Milestone 3: SMS Notifications (Week 2-3)**
- [ ] Set up Semaphore or Twilio account
- [ ] Create SMS service utility
- [ ] Add SMS notifications for critical events (order confirmed, results ready)
- [ ] Add SMS preference to user profile

**Milestone 4: Logistics Integration (Week 3-4)**
- [ ] Set up Lalamove API account
- [ ] Create logistics service (`/lib/logistics.ts`)
- [ ] Add logistics workflow to orders
  - Client provides pickup details
  - Lab confirms sample received
- [ ] Build courier booking UI
- [ ] Add tracking link to order detail page
- [ ] Test end-to-end logistics flow

**Milestone 5: Security Hardening (Week 4)**
- [ ] Implement rate limiting (express-rate-limit or Vercel Edge Config)
- [ ] Add CSRF protection
- [ ] Set up CSP headers
- [ ] Conduct security audit (OWASP Top 10 checklist)
- [ ] Add IP logging to audit logs
- [ ] Implement brute-force protection on login

**Milestone 6: Advanced Order States (Week 5)**
- [ ] Add quote workflow (optional: lab can quote before confirming)
- [ ] Add sample tracking (logged, in transit, received, testing, completed)
- [ ] Add order timeline visualization (client view)
- [ ] Add estimated completion date (based on turnaround + current status)

---

### 5.4 Stage 3: Scale & Growth (3-4 months post-Stage 2)

**Features:**
- Multi-lab search with Elasticsearch or PostgreSQL full-text search
- Reviews and ratings system
- Subscription plans for labs (featured listings, priority support)
- Advanced analytics (client behavior, service popularity, conversion rates)
- Mobile app (React Native, reuse API)
- Internationalization (Tagalog translations)
- Live chat support (Intercom or custom)
- Referral program (client/lab incentives)

---

## 6. DEVELOPMENT GUIDELINES

### 6.1 Coding Standards

**TypeScript:**
- Strict mode enabled (`"strict": true` in tsconfig.json)
- No `any` types (use `unknown` or proper types)
- Explicit return types for functions

**File Naming:**
- Components: PascalCase (`OrderCard.tsx`)
- Utilities: camelCase (`formatPrice.ts`)
- API routes: kebab-case (`create-order.ts`)

**Component Structure:**
```typescript
// Good: Functional component with explicit types
interface OrderCardProps {
  order: Order;
  onStatusChange: (newStatus: OrderStatus) => void;
}

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
  // Component logic
  return <div>...</div>;
}
```

**API Route Pattern:**
```typescript
// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createOrderSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate input
    const body = await req.json();
    const validatedData = createOrderSchema.parse(body);

    // 3. Authorize
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. Business logic (call service layer)
    const order = await OrderService.create(validatedData, session.user.id);

    // 5. Return response
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    // 6. Error handling
    return handleApiError(error);
  }
}
```

---

### 6.2 Git Workflow

**Branch Strategy:**
- `main` — production code
- `develop` — staging/pre-production
- `feature/feature-name` — feature branches
- `bugfix/issue-description` — bug fixes

**Commit Messages:**
```
feat: add order status filtering to lab dashboard
fix: resolve file upload error for large PDFs
docs: update API endpoint documentation
refactor: extract order validation into service layer
test: add unit tests for auth utilities
```

**Before Merging:**
- Run `npm run lint` (no errors)
- Run `npm run type-check` (no TypeScript errors)
- Manually test the feature
- Update documentation if needed

---

### 6.3 Testing Strategy

**Unit Tests (Vitest):**
- Test pure functions (validation, formatting, calculations)
- Test service layer functions (mock Prisma)
- Aim for >70% coverage on critical paths

**Integration Tests:**
- Test API endpoints (use Next.js test environment)
- Test database operations (use test database)
- Test auth flows

**E2E Tests (Playwright - deferred to Stage 2):**
- Test complete user journeys
- Test cross-browser compatibility
- Run before each deployment

---

### 6.4 Database Migration Workflow

**Development:**
```bash
# Create migration after schema changes
npx prisma migrate dev --name add_audit_logs

# This generates:
# - prisma/migrations/20250930_add_audit_logs/migration.sql
# - Updates Prisma Client

# Apply to local database automatically
```

**Production:**
```bash
# Vercel deployment auto-runs:
npm run build
# Which includes: prisma generate && prisma migrate deploy
```

**Best Practices:**
- Never edit migration files manually
- Always test migrations on staging first
- Backup production database before major schema changes
- Use `prisma migrate deploy` for production (not `dev`)

---

## 7. MAINTENANCE & OPERATIONS

### 7.1 Monitoring Checklist

**Daily:**
- [ ] Check Sentry for new errors
- [ ] Review Vercel deployment logs
- [ ] Monitor Neon database performance (connection count, query time)

**Weekly:**
- [ ] Review email delivery reports (SendGrid)
- [ ] Check user feedback/support requests
- [ ] Review order success rate (% completed orders)

**Monthly:**
- [ ] Database backup verification (test restore)
- [ ] Security audit (dependency updates)
- [ ] Performance review (page load times, API response times)
- [ ] User growth metrics (new registrations, active orders)

---

### 7.2 Incident Response Plan

**Issue Severity Levels:**

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| **P0 - Critical** | Site down, data loss | Immediate (< 1 hour) | Database connection failure |
| **P1 - High** | Core feature broken | < 4 hours | Order submission failing |
| **P2 - Medium** | Non-critical feature broken | < 24 hours | Email notifications not sending |
| **P3 - Low** | Minor bug, no impact | < 1 week | UI alignment issue |

**Response Steps:**
1. Acknowledge issue (post in Sentry, log in operations doc)
2. Assess severity and impact (how many users affected?)
3. Implement hotfix or rollback (use Vercel instant rollback if needed)
4. Verify fix in production
5. Post-mortem (document root cause, prevention steps)

---

### 7.3 Backup & Recovery

**Database Backups (Neon):**
- Automated daily backups (retained 7 days on free tier)
- Manual backup before major migrations: `pg_dump`
- Test restore quarterly

**Code Backups:**
- Git repository (GitHub)
- Vercel deployment history (instant rollback)

**Recovery Scenarios:**

**Scenario 1: Accidental data deletion**
- Restore from Neon point-in-time recovery
- Estimated downtime: 15-30 minutes

**Scenario 2: Bad deployment**
- Rollback via Vercel dashboard (1 click)
- Estimated downtime: < 5 minutes

**Scenario 3: Database corruption**
- Restore from last backup
- Replay migrations if needed
- Estimated downtime: 1-2 hours

---

## 8. DECISION LOG (Architecture Decision Records - ADRs)

### ADR-001: Next.js Over Separate Frontend/Backend

**Context:** Need to choose between monolithic Next.js or separate React + Express.

**Decision:** Use Next.js 14 with API Routes (unified codebase).

**Rationale:**
- Simpler deployment (one Vercel project)
- Shared TypeScript types between frontend/backend
- Server Components reduce client JS bundle
- Better for solo developer (less context switching)

**Consequences:**
- Harder to scale backend independently (acceptable for MVP)
- Vendor lock-in to Vercel (mitigated: can deploy Next.js elsewhere)

---

### ADR-002: Neon Over Supabase

**Context:** Need PostgreSQL hosting with good DX.

**Decision:** Use Neon for database, NextAuth for auth (not Supabase).

**Rationale:**
- Neon = pure PostgreSQL (no vendor lock-in to Supabase's ecosystem)
- Prisma + Neon integration is excellent
- Supabase auth/storage not needed (NextAuth + S3 later)
- Neon has better branching for dev/staging

**Consequences:**
- Must handle auth ourselves (acceptable: NextAuth is mature)
- No built-in storage (will integrate S3/UploadThing in Stage 2)

---

### ADR-003: Mock Payments/Logistics in MVP

**Context:** Payment and logistics integration is complex and time-consuming.

**Decision:** Mock these features in Stage 1, integrate in Stage 2.

**Rationale:**
- Focus MVP on core transaction flow (order → fulfill → deliver)
- Payment integration requires legal compliance, testing
- Logistics requires API testing with real couriers
- Can validate demand before investing time

**Consequences:**
- MVP not monetizable immediately (acceptable: validating product-market fit first)
- Must clearly communicate "coming soon" to test users

---

### ADR-004: JSONB for Flexible Data (client_details, location)

**Context:** Some fields (addresses, contact info) have variable structure.

**Decision:** Use JSONB for `orders.client_details` and `labs.location`.

**Rationale:**
- Addresses change; orders need point-in-time snapshot
- Flexible location format (some labs may not have coordinates)
- Simpler queries (no 5-table JOIN for address)

**Consequences:**
- Harder to validate data structure (mitigated: Zod schemas)
- Slightly less performant for filtering (mitigated: GIN indexes)

---

## 9. NEXT STEPS: IMMEDIATE ACTIONS

### Week 1 Checklist

**Day 1-2: Environment Setup**
- [ ] Create new Next.js 14 project: `npx create-next-app@latest pipetgo`
- [ ] Install dependencies: Prisma, NextAuth, Tailwind, Zod, etc.
- [ ] Set up Neon account, create database, get connection string
- [ ] Configure `.env.local` with database URL
- [ ] Initialize Prisma: `npx prisma init`

**Day 3-4: Database Schema**
- [ ] Copy ERD schema to `prisma/schema.prisma`
- [ ] Run first migration: `npx prisma migrate dev --name init`
- [ ] Create seed script (`prisma/seed.ts`) with sample data
- [ ] Run seed: `npm run db:seed`
- [ ] Verify in Prisma Studio: `npx prisma studio`

**Day 5-7: Auth Scaffolding**
- [ ] Install NextAuth and Prisma adapter
- [ ] Create `app/api/auth/[...nextauth]/route.ts`
- [ ] Configure Credentials provider
- [ ] Create registration endpoint
- [ ] Build login/register pages
- [ ] Test auth flow (register → login → session)

---

## 10. CONCLUSION

You now have:

✅ **Reconciled Plan** — Conflicts resolved, tech stack finalized  
✅ **Requirements Document** — FR/NFR clearly defined  
✅ **ERD** — Normalized schema with pragmatic trade-offs  
✅ **API Spec** — 25+ endpoints documented  
✅ **Architecture Diagram** — High-level system design  
✅ **Task Breakdown** — 9 milestones over 6-8 weeks  
✅ **Decision Log** — Key architectural choices explained

**Your next action:** Start Week 1, Day 1 of the roadmap. Build incrementally, test often, and don't hesitate to revisit these docs as the project evolves.

**Remember:**
- Prioritize MVP features ruthlessly (defer everything else to Stage 2)
- Test on real mobile devices (Philippines market = mobile-first)
- Document as you build (future-you will thank present-you)
- Commit small, commit often (easier to debug when things break)

Good luck building PipetGo! 🚀

---

**Document Metadata:**
- **Version:** 1.0
- **Last Updated:** September 30, 2025
- **Author:** Technical Assistant (Claude)
- **Project:** PipetGo — Lab Services Marketplace
- **Status:** Ready for Implementation