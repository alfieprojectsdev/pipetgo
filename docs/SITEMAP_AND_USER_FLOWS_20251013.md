# PipetGo - Comprehensive Sitemap & User Flows

**Document Version:** 2.0
**Last Updated:** 2025-10-13
**Project:** PipetGo MVP - B2B Laboratory Services Marketplace
**Status:** Stage 1 Implementation Guide (Quotation-First Model)
**Critical Update:** Aligned with CEO directive for quotation-first workflow

---

## ⚠️ Major Changes (October 13, 2025)

1. **Quotation Workflow Integration**
   - Added quote request/approval flow
   - Updated order status transitions
   - Modified service pricing display logic

2. **New API Endpoints**
   - `/api/orders/[id]/quote` - Lab provides quote
   - `/api/orders/[id]/approve-quote` - Client approves quote
   - `/api/services?pricing_mode=X` - Filter by pricing mode

3. **New Status Values**
   - `QUOTE_REQUESTED` - Initial order state
   - `QUOTE_PROVIDED` - Lab has provided quote
   - `PENDING` - Quote approved, awaiting acknowledgment

4. **Updated Permissions**
   - Added quote management permissions
   - Added pricing mode management for services
   - Modified order status transition rules

---

## Table of Contents

1. [Overview](#1-overview)
2. [Sitemap](#2-sitemap)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [User Flow Diagrams](#4-user-flow-diagrams)
5. [Page-by-Page Specifications](#5-page-by-page-specifications)
6. [Navigation Structure](#6-navigation-structure)
7. [URL Schema](#7-url-schema)

---

## 1. Overview

### 1.1 Purpose
This document provides a comprehensive map of all pages, routes, and user interactions in the PipetGo platform, with special emphasis on the quotation-first workflow. It serves as the single source of truth for:
- Frontend developers implementing pages
- UX designers creating wireframes
- Backend developers building API endpoints
- QA engineers writing test cases

### 1.2 Application Architecture
- **Frontend Framework:** Next.js 14 (App Router)
- **Routing:** File-based routing in `app/` directory
- **Authentication:** NextAuth.js v4 with session management
- **Authorization:** Role-based access control (## 5. Page-by-Page Specifications

### 5.1 Public Pages

#### Homepage (/)
- **Purpose:** Showcase platform value proposition
- **Key Components:**
  - Service category browsing
  - Featured laboratories
  - Success stories
  - Registration CTAs
- **Data Requirements:**
  - Featured service list
  - Lab highlights
  - Testimonials

#### Service Catalog (/services)
- **Purpose:** Browse and search services
- **Key Components:**
  - Search filters
  - Pricing mode filters
  - Category navigation
  - Lab filters
- **Query Parameters:**
  - `?pricing_mode`: FIXED | QUOTE_REQUIRED | HYBRID
  - `?category`: Service category
  - `?lab`: Lab ID filter
  - `?search`: Search term

#### Service Detail (/services/[id])
- **Purpose:** View service details and initiate quote
- **Key Components:**
  - Service description
  - Pricing information
  - Quote request form
  - Lab information
- **Dynamic Elements:**
  - Pricing display based on mode
  - Quote request button visibility
  - Authentication state handling

### 5.2 Dashboard Pages

#### Client Dashboard (/dashboard/client)
- **Purpose:** Client's main control center
- **Key Components:**
  - Quote request status
  - Order tracking
  - Recent activities
  - Notifications
- **Data Requirements:**
  - Active quotes list
  - Order history
  - Payment history
  - Lab interactions

#### Lab Dashboard (/dashboard/lab)
- **Purpose:** Lab's operation center
- **Key Components:**
  - Quote requests queue
  - Order management
  - Service catalog
  - Analytics
- **Key Features:**
  - Quote provision interface
  - Service pricing management
  - Order status updates
  - Result upload system

### 5.3 Quote Flow Pages

#### Quote Request Form (/quote/[serviceId])
- **Purpose:** Submit quote request
- **Key Components:**
  - Service details
  - Requirements form
  - File attachments
  - Contact information
- **Validation Rules:**
  - Required fields
  - File size limits
  - Format restrictions

#### Quote Details (/quote/[quoteId]/details)
- **Purpose:** View and manage quote
- **Key Components:**
  - Quote amount
  - Service breakdown
  - Approval interface
  - Communication thread
- **Actions Available:**
  - Approve quote
  - Request revision
  - Decline quote
  - Message lab

---

## 6. Navigation Structure

### 6.1 Main Navigation

#### Public Navigation
```typescript
interface PublicNav {
  home: '/',
  services: '/services',
  labs: '/labs',
  about: '/marketing/about',
  contact: '/marketing/contact',
  howItWorks: '/marketing/how-it-works',
  signin: '/auth/signin',
  signup: '/auth/signup'
}
```

#### Client Navigation
```typescript
interface ClientNav {
  dashboard: '/dashboard/client',
  orders: '/dashboard/client/orders',
  quotes: '/dashboard/client/orders?status=QUOTE_REQUESTED',
  profile: '/dashboard/client/profile',
  settings: '/dashboard/client/settings'
}
```

#### Lab Navigation
```typescript
interface LabNav {
  dashboard: '/dashboard/lab',
  orders: '/dashboard/lab/orders',
  pendingQuotes: '/dashboard/lab/orders?status=QUOTE_REQUESTED',
  services: '/dashboard/lab/services',
  profile: '/dashboard/lab/profile',
  settings: '/dashboard/lab/settings'
}
```

### 6.2 Breadcrumb Structure

```typescript
type BreadcrumbPath = {
  services: {
    label: 'Services',
    path: '/services',
    children: {
      [id: string]: {
        label: string, // Service name
        path: `/services/${id}`
      }
    }
  },
  dashboard: {
    client: {
      label: 'Client Dashboard',
      path: '/dashboard/client',
      children: {
        orders: {
          label: 'Orders',
          path: '/dashboard/client/orders',
          children: {
            [id: string]: {
              label: string, // Order ID
              path: `/dashboard/client/orders/${id}`
            }
          }
        }
      }
    },
    lab: {
      // Similar structure for lab dashboard
    }
  }
}
```

---

## 7. URL Schema

### 7.1 API Endpoints

#### Quote Management
```typescript
interface QuoteEndpoints {
  request: 'POST /api/orders',
  provide: 'POST /api/orders/[id]/quote',
  approve: 'POST /api/orders/[id]/approve-quote',
  decline: 'POST /api/orders/[id]/decline-quote',
  revise: 'POST /api/orders/[id]/revise-quote',
  list: 'GET /api/orders?status=QUOTE_REQUESTED'
}
```

#### Order Management
```typescript
interface OrderEndpoints {
  create: 'POST /api/orders',
  update: 'PATCH /api/orders/[id]',
  delete: 'DELETE /api/orders/[id]',
  list: 'GET /api/orders',
  details: 'GET /api/orders/[id]',
  attachments: 'POST /api/orders/[id]/attachments'
}
```

#### Service Management
```typescript
interface ServiceEndpoints {
  create: 'POST /api/services',
  update: 'PATCH /api/services/[id]',
  delete: 'DELETE /api/services/[id]',
  list: 'GET /api/services',
  details: 'GET /api/services/[id]',
  pricing: 'PATCH /api/services/[id]/pricing'
}
```

### 7.2 URL Patterns

#### Dynamic Routes
- Service pages: `/services/[id]`
- Lab profiles: `/labs/[id]`
- Order details: `/dashboard/[role]/orders/[id]`
- Quote management: `/quote/[serviceId]`

#### Query Parameters
- Status filtering: `?status=QUOTE_REQUESTED`
- Pricing mode: `?pricing_mode=QUOTE_REQUIRED`
- Pagination: `?page=1&limit=20`
- Sorting: `?sort=createdAt&order=desc`

#### URL Structure Rules
1. Use kebab-case for URLs
2. Keep URLs descriptive and semantic
3. Use query parameters for filtering
4. Maintain consistent hierarchy
5. Follow RESTful conventions)
- **Business Logic:** Quotation-first workflow

### 1.3 Key Concepts
- **Public Routes:** Accessible without authentication
- **Protected Routes:** Require authentication
- **Role-Restricted Routes:** Require specific user roles
- **Server Components:** Default for data fetching
- **Client Components:** For interactivity (forms, state management)
- **Pricing Modes:** FIXED | QUOTE_REQUIRED | HYBRID

---

## 2. Sitemap

### 2.1 Visual Sitemap

```
PipetGo Platform
│
├── Public Pages (No Auth Required)
│   ├── / (Homepage)
│   ├── /services (Service Catalog)
│   │   └── ?pricing_mode=QUOTE_REQUIRED (Filtered View)
│   ├── /services/[id] (Service Detail)
│   ├── /labs (Lab Directory)
│   ├── /labs/[id] (Lab Profile)
│   ├── /marketing/about
│   ├── /marketing/contact
│   └── /marketing/how-it-works
│
├── Authentication Pages
│   ├── /auth/signin
│   ├── /auth/signup
│   ├── /auth/error
│   └── /auth/verify-email (Stage 2)
│
├── Client Dashboard (Role: CLIENT)
│   ├── /dashboard/client
│   ├── /dashboard/client/orders
│   │   └── ?status=QUOTE_REQUESTED (Quote Requests)
│   ├── /dashboard/client/orders/[id]
│   │   └── /quote-approval (Quote Approval UI)
│   ├── /dashboard/client/profile
│   └── /dashboard/client/settings
│
├── Lab Admin Dashboard (Role: LAB_ADMIN)
│   ├── /dashboard/lab
│   ├── /dashboard/lab/orders
│   │   └── ?status=QUOTE_REQUESTED (Pending Quotes)
│   ├── /dashboard/lab/orders/[id]
│   │   └── /provide-quote (Quote Input UI)
│   ├── /dashboard/lab/services
│   │   └── ?pricing_mode=X (Filter by Mode)
│   ├── /dashboard/lab/services/new
│   ├── /dashboard/lab/services/[id]/edit
│   ├── /dashboard/lab/profile
│   └── /dashboard/lab/settings
│
├── Platform Admin Dashboard (Role: ADMIN)
│   ├── /dashboard/admin
│   ├── /dashboard/admin/orders
│   │   └── /quotes (Quote Management)
│   ├── /dashboard/admin/labs
│   ├── /dashboard/admin/users
│   ├── /dashboard/admin/analytics
│   └── /dashboard/admin/settings
│
├── Quote Flow (Protected)
│   ├── /quote/[serviceId] (Quote Request Form)
│   ├── /quote/success (Request Confirmation)
│   └── /quote/[quoteId]/details (Quote Details)
│
└── Utility Pages
    ├── /404 (Not Found)
    ├── /500 (Server Error)
    └── /maintenance (Scheduled Downtime)
```

### 2.2 Route Count Summary

| Category | Route Count | Auth Required |
|----------|-------------|---------------|
| Public Pages | 7 | No |
| Auth Pages | 3 | No |
| Client Dashboard | 6 | Yes (CLIENT) |
| Lab Dashboard | 9 | Yes (LAB_ADMIN) |
| Admin Dashboard | 7 | Yes (ADMIN) |
| Quote Flow | 3 | Yes (Any authenticated) |
| Utility Pages | 3 | No |
| **Total** | **38** | - |

---

## 3. User Roles & Permissions

### 3.1 Role Definitions

| Role | Description | Access Level |
|------|-------------|--------------|
| **Anonymous** | Unauthenticated visitor | Browse services, view labs, cannot submit quotes |
| **CLIENT** | Laboratory service client | Request quotes, approve quotes, track orders |
| **LAB_ADMIN** | Laboratory administrator | Provide quotes, manage services, fulfill orders |
| **ADMIN** | Platform administrator | Full access, quote oversight, platform management |

### 3.2 Permission Matrix

| Action | Anonymous | CLIENT | LAB_ADMIN | ADMIN |
|--------|-----------|--------|-----------|-------|
| View service catalog | ✅ | ✅ | ✅ | ✅ |
| View service details | ✅ | ✅ | ✅ | ✅ |
| Request quote | ❌ | ✅ | ✅ | ✅ |
| Provide quote | ❌ | ❌ | ✅ | ✅ |
| Approve quote | ❌ | ✅ | ❌ | ✅ |
| View own quotes | ❌ | ✅ | ❌ | ✅ |
| View lab's quotes | ❌ | ❌ | ✅ | ✅ |
| Set pricing mode | ❌ | ❌ | ✅ | ✅ |
| Update order status | ❌ | ❌ | ✅ | ✅ |
| Upload results | ❌ | ❌ | ✅ | ✅ |
| Create lab profile | ❌ | ❌ | ✅ | ✅ |
| Manage services | ❌ | ❌ | ✅ | ✅ |
| View all users | ❌ | ❌ | ❌ | ✅ |
| Delete orders | ❌ | ❌ | ❌ | ✅ |

---

## 4. User Flow Diagrams

### 4.1 Quote Request Flow

```mermaid
graph TD
    A[Client visits homepage] --> B{Authenticated?}
    B -->|No| C[Browse services as guest]
    B -->|Yes| D[Browse services]

    C --> E[Click 'Request Quote']
    E --> F[Redirect to /auth/signin]
    F --> G[Sign in or sign up]
    G --> H[Redirect back to service]

    D --> I[Click 'Request Quote']
    H --> I
    I --> J[/quote/serviceId page]
    J --> K[Fill quote request form]
    K --> L{Validate form}
    L -->|Invalid| K
    L -->|Valid| M[Submit request]
    M --> N[POST /api/orders with status=QUOTE_REQUESTED]
    N --> O{Success?}
    O -->|No| P[Show error message]
    P --> K
    O -->|Yes| Q[Redirect to /dashboard/client]
    Q --> R[View request in dashboard]
    R --> S[Wait for lab quote]
```

### 4.2 Lab Quote Provision Flow

```mermaid
graph TD
    A[Lab admin logs in] --> B[/dashboard/lab]
    B --> C[View quote requests]
    C --> D[Click request to view details]
    D --> E[/dashboard/lab/orders/orderId/provide-quote]
    E --> F[Review request details]
    F --> G{Decision}

    G -->|Provide Quote| H[Enter quote amount]
    H --> I[Add quote notes]
    I --> J[POST /api/orders/orderId/quote]
    J --> K[Status: QUOTE_PROVIDED]
    K --> L[Client receives quote notification]

    G -->|Reject| M[Update status to CANCELLED]
    M --> N[Add rejection reason]
    N --> O[Client notified]

    L --> P[Wait for client approval]
    P -->|Approved| Q[Status: PENDING]
    P -->|Declined| R[Status: CANCELLED]
```

### 4.3 Quote Approval Flow

```mermaid
graph TD
    A[Client receives quote] --> B[View quote in dashboard]
    B --> C[/dashboard/client/orders/orderId/quote-approval]
    C --> D{Decision}

    D -->|Approve| E[POST /api/orders/orderId/approve-quote]
    E --> F[Status: PENDING]
    F --> G[Lab notified]
    G --> H[Regular order flow begins]

    D -->|Decline| I[Add decline reason]
    I --> J[Status: CANCELLED]
    J --> K[Lab notified]
    K --> L[Quote request closed]
```

[Continued in Part 2...]