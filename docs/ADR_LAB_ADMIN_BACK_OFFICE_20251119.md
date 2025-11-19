# ADR: Lab Admin Back Office Enhancements
## Architecture Decision Record

**Status**: Proposed
**Date**: 2025-11-19
**Author**: Claude Code Engineering Team
**Context**: CEO feedback "I think it's ready on the surface. Back office is next"

---

## Context

### Business Need

**CEO Feedback** (November 2025):
> "I think it's ready on the surface. Back office is next"

- **"Surface"**: Client-facing RFQ submission + quote approval flows ✅ Complete
- **"Back office"**: Lab admin interface improvements for managing their business ⚠️ Gaps identified

### Current Lab Admin Dashboard Limitations

**Location**: `src/app/dashboard/lab/page.tsx`

**Current Features**:
- ✅ Order listing with status badges
- ✅ "Provide Quote" button → `/dashboard/lab/orders/[id]/quote`
- ✅ Basic stats (pending quotes, active tests, completed orders)
- ✅ Pagination (12 orders per page)

**Critical Gaps**:
1. ❌ **No service management**: Lab admin cannot create/edit their service catalog
   - Impact: Requires developer intervention to add new tests
   - Scale issue: 500 labs need 5000+ services - unmaintainable manually

2. ❌ **No analytics**: No revenue insights, quote performance metrics
   - Impact: Lab admins can't optimize pricing or identify popular services
   - Business problem: No data-driven decision making

3. ❌ **Limited workflow tools**: No search, filter, bulk operations, CSV export
   - Impact: High-volume labs (50+ orders/week) waste time on manual tasks
   - Efficiency problem: Can't export to accounting software

---

## Decision

Implement THREE major back office enhancements:

### 1. Service Management Interface

**Component Hierarchy**:
```
/dashboard/lab/services/
├── page.tsx                 // Service listing table
├── components/
│   ├── ServiceTable.tsx     // Table with enable/disable toggles
│   ├── CreateServiceModal.tsx  // Modal for creating service
│   ├── EditServiceModal.tsx    // Modal for editing service
│   └── BulkActionsBar.tsx      // Enable all, disable all, duplicate
```

**Why Modals** (vs dedicated pages):
- ✅ Faster workflow (no page navigation)
- ✅ Context preservation (stay on service listing)
- ✅ Matches shadcn/ui patterns (Dialog component)
- ❌ Con: Complex forms may feel cramped (mitigate with clear layout)

**API Endpoints**:
```typescript
// Service Management
POST   /api/services                    // Create service
GET    /api/services?labId=X&active=all // List all lab services (extend existing)
PATCH  /api/services/[id]               // Update service
DELETE /api/services/[id]               // Soft delete (set active=false)
POST   /api/services/bulk               // Bulk enable/disable

// Request/Response Schemas
POST /api/services {
  labId: string,        // Verified from session
  name: string,
  description?: string,
  category: string,     // Dropdown: "Chemical", "Microbiological", etc.
  pricingMode: "QUOTE_REQUIRED" | "FIXED" | "HYBRID",
  pricePerUnit?: number,  // Required if FIXED or HYBRID
  unitType: string,       // Default: "per_sample"
  turnaroundDays?: number,
  sampleRequirements?: string
}

PATCH /api/services/[id] {
  // Same fields as POST, all optional
}

POST /api/services/bulk {
  action: "enable" | "disable",
  serviceIds: string[]
}
```

**UI Flow** (Create Service):
1. Lab admin clicks "Add Service" button
2. Modal opens with form
3. Fill required fields:
   - Service name (text input, required)
   - Category (dropdown, required)
   - Pricing mode (radio buttons: Quote Required, Fixed Price, Hybrid)
   - If Fixed/Hybrid: Price per unit (number input)
   - Description (textarea, optional)
   - Turnaround days (number input, optional)
   - Sample requirements (textarea, optional)
4. Client-side validation:
   - Name: 3-200 characters
   - Price: Positive number, 2 decimal places, max ₱1,000,000
   - Turnaround: Positive integer, max 365 days
5. Click "Create Service"
6. POST /api/services
7. Success: Toast notification "Service created", modal closes, table refreshes
8. Error: Show error message in modal, don't close

**Validation Schema** (Zod):
```typescript
// src/lib/validations/service.ts
export const serviceSchema = z.object({
  labId: z.string().cuid(),
  name: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(['Chemical Analysis', 'Microbiological Testing', 'Physical Testing', 'Environmental Testing', 'Food Safety', 'Other']),
  pricingMode: z.enum(['QUOTE_REQUIRED', 'FIXED', 'HYBRID']),
  pricePerUnit: z.number().positive().max(1000000).optional(),
  unitType: z.string().default('per_sample'),
  turnaroundDays: z.number().int().positive().max(365).optional(),
  sampleRequirements: z.string().max(500).optional()
}).refine(
  (data) => data.pricingMode === 'QUOTE_REQUIRED' || data.pricePerUnit !== undefined,
  { message: 'Price required for FIXED and HYBRID pricing modes', path: ['pricePerUnit'] }
)
```

**Security** (API route):
```typescript
// src/app/api/services/route.ts
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  // 1. Verify LAB_ADMIN role
  if (session?.user?.role !== 'LAB_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Verify lab ownership
  const lab = await prisma.lab.findFirst({
    where: { ownerId: session.user.id }
  })

  if (!lab) {
    return NextResponse.json({ error: 'Lab not found' }, { status: 404 })
  }

  // 3. Parse and validate
  const body = await req.json()
  const validatedData = serviceSchema.parse({ ...body, labId: lab.id })

  // 4. Create service
  const service = await prisma.labService.create({
    data: validatedData
  })

  return NextResponse.json(service, { status: 201 })
}
```

**Implementation Time**: 4-5 hours
- Task 1.1: Service listing table with enable/disable toggles (1 hour)
- Task 1.2: Create service modal + validation (1.5 hours)
- Task 1.3: Edit service modal (1 hour)
- Task 1.4: Bulk operations (enable all, disable all) (1 hour)
- Task 1.5: API routes + tests (1 hour)

---

### 2. Analytics Dashboard

**Component Hierarchy**:
```
/dashboard/lab/analytics/
├── page.tsx                 // Analytics dashboard layout
├── components/
│   ├── RevenueChart.tsx     // Line chart (revenue over time)
│   ├── QuoteMetrics.tsx     // Stats cards (approval rate, avg price)
│   ├── OrderVolumeChart.tsx // Bar chart (orders by status)
│   └── TopServices.tsx      // Table (top 5 by volume/revenue)
```

**Why Dedicated Page** (vs integrated widgets):
- ✅ Focused analytics experience (no distractions)
- ✅ More space for charts (dashboard crowded with orders)
- ✅ Can add more widgets in future without cluttering main dashboard
- ❌ Con: Extra navigation step (mitigate with prominent nav link)

**Widgets**:

#### 2.1 Revenue Metrics
```typescript
// GET /api/labs/[id]/analytics/revenue

{
  totalRevenue: 125000,           // All-time completed orders
  thisMonth: 35000,
  lastMonth: 28000,
  percentChange: 25.0,            // (thisMonth - lastMonth) / lastMonth * 100
  last6Months: [
    { month: 'Jun', revenue: 18000 },
    { month: 'Jul', revenue: 22000 },
    { month: 'Aug', revenue: 28000 },
    { month: 'Sep', revenue: 31000 },
    { month: 'Oct', revenue: 28000 },
    { month: 'Nov', revenue: 35000 }
  ]
}
```

**Query Pattern**:
```typescript
// Real-time approach (acceptable for Stage 2: <500 labs)
const orders = await prisma.order.findMany({
  where: {
    labId: lab.id,
    status: 'COMPLETED',
    completedAt: {
      gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) // Last 6 months
    }
  },
  select: {
    quotedPrice: true,
    completedAt: true
  }
})

// Group by month in application code (Prisma doesn't have GROUP BY month)
const monthlyRevenue = orders.reduce((acc, order) => {
  const month = format(order.completedAt, 'MMM')
  acc[month] = (acc[month] || 0) + Number(order.quotedPrice)
  return acc
}, {})
```

**Performance**: Expected query time < 300ms for 500 completed orders

**Chart Library**: **Recharts** (React-first, simple, responsive)
```bash
npm install recharts
```

#### 2.2 Quote Metrics
```typescript
// GET /api/labs/[id]/analytics/quotes

{
  quoteApprovalRate: 78.5,        // QUOTE_PROVIDED → PENDING / total QUOTE_PROVIDED
  averageQuoteValue: 4250,
  averageTurnaroundDays: 5,
  quotesPending: 12               // Current QUOTE_PROVIDED count
}
```

**Query Pattern**:
```typescript
const [provided, approved] = await Promise.all([
  // Total quotes provided
  prisma.order.count({
    where: {
      labId: lab.id,
      status: { in: ['QUOTE_PROVIDED', 'PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED'] }
    }
  }),

  // Quotes approved (moved past QUOTE_PROVIDED)
  prisma.order.count({
    where: {
      labId: lab.id,
      status: { in: ['PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED'] },
      quoteApprovedAt: { not: null }
    }
  })
])

const approvalRate = provided > 0 ? (approved / provided * 100) : 0

// Average quote value
const avgQuote = await prisma.order.aggregate({
  where: { labId: lab.id, quotedPrice: { not: null } },
  _avg: { quotedPrice: true }
})

// Average turnaround
const avgTurnaround = await prisma.order.aggregate({
  where: { labId: lab.id, estimatedTurnaroundDays: { not: null } },
  _avg: { estimatedTurnaroundDays: true }
})
```

#### 2.3 Order Volume Chart
```typescript
// GET /api/labs/[id]/analytics/orders

{
  byStatus: [
    { status: 'QUOTE_REQUESTED', count: 8 },
    { status: 'QUOTE_PROVIDED', count: 12 },
    { status: 'PENDING', count: 5 },
    { status: 'IN_PROGRESS', count: 15 },
    { status: 'COMPLETED', count: 143 }
  ],
  last30Days: [
    { date: '2025-10-20', count: 3 },
    { date: '2025-10-21', count: 5 },
    // ... 30 days
  ]
}
```

**Chart Type**: Bar chart (orders by status), Line chart (orders over time)

#### 2.4 Top Services
```typescript
// GET /api/labs/[id]/analytics/services

{
  topByVolume: [
    { serviceId: 'xyz', name: 'Water Quality Testing', orderCount: 45 },
    { serviceId: 'abc', name: 'Soil Analysis', orderCount: 38 },
    // ... top 5
  ],
  topByRevenue: [
    { serviceId: 'xyz', name: 'Water Quality Testing', revenue: 54000 },
    // ... top 5
  ]
}
```

**Query Pattern**:
```typescript
// Top services by volume
const topByVolume = await prisma.labService.findMany({
  where: { labId: lab.id },
  include: {
    orders: {
      where: { status: 'COMPLETED' },
      select: { id: true }
    }
  },
  orderBy: {
    orders: { _count: 'desc' }
  },
  take: 5
})

// Top services by revenue
const topByRevenue = await prisma.labService.findMany({
  where: { labId: lab.id },
  include: {
    orders: {
      where: { status: 'COMPLETED' },
      select: { quotedPrice: true }
    }
  },
  take: 5
})

// Calculate revenue in application code
const servicesWithRevenue = topByRevenue.map(service => ({
  ...service,
  revenue: service.orders.reduce((sum, o) => sum + Number(o.quotedPrice), 0)
})).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
```

**Implementation Time**: 5-6 hours
- Task 2.1: Analytics API endpoint (aggregate queries) (2 hours)
- Task 2.2: Revenue chart component (Recharts line chart) (1.5 hours)
- Task 2.3: Quote metrics cards (1 hour)
- Task 2.4: Order volume chart (1 hour)
- Task 2.5: Top services table (30 mins)

---

### 3. Workflow Improvements

**Component Hierarchy**:
```
/dashboard/lab/
├── page.tsx (enhanced with search/filter)
├── components/
│   ├── OrderSearch.tsx         // Debounced search input
│   ├── OrderFilters.tsx        // Status, date range, category filters
│   ├── BulkActionsBar.tsx      // Bulk acknowledge, export CSV
│   └── OrderTable.tsx          // Table with checkboxes
```

**Why Inline Filters** (vs separate modal):
- ✅ Faster workflow (no extra clicks)
- ✅ See filter results immediately
- ✅ Industry standard (Gmail, Asana, Notion all use inline filters)
- ❌ Con: Takes vertical space (mitigate with collapsible filter panel)

#### 3.1 Search
**UI**: Text input above order table, placeholder "Search by client, service, or order ID"

**Implementation**:
```typescript
const [searchQuery, setSearchQuery] = useState('')
const [debouncedQuery, setDebouncedQuery] = useState('')

// Debounce search (300ms delay)
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(searchQuery)
  }, 300)
  return () => clearTimeout(timer)
}, [searchQuery])

// Fetch orders with search query
useEffect(() => {
  fetchOrders({ search: debouncedQuery, ...filters })
}, [debouncedQuery, filters])
```

**API**:
```typescript
// GET /api/orders?labId=X&search=water
// Returns orders where:
// - client.name contains "water" OR
// - client.email contains "water" OR
// - service.name contains "water" OR
// - id starts with "water"

const orders = await prisma.order.findMany({
  where: {
    labId: labId,
    OR: [
      { client: { name: { contains: search, mode: 'insensitive' } } },
      { client: { email: { contains: search, mode: 'insensitive' } } },
      { service: { name: { contains: search, mode: 'insensitive' } } },
      { id: { startsWith: search } }
    ]
  },
  include: { client: true, service: true }
})
```

**Performance**: Full-text search on 500 orders < 200ms (with indexes)

**Required Index**:
```prisma
// prisma/schema.prisma
model Order {
  @@index([labId, createdAt(sort: Desc)])  // Existing
  @@index([clientId])  // New - for search
}

model User {
  @@index([name])  // New - for search
  @@index([email])  // New - for search
}

model LabService {
  @@index([name])  // New - for search
}
```

#### 3.2 Filters
**UI**: Dropdown selects for:
- Status (All, Quote Requested, Quote Provided, Pending, etc.)
- Date range (Last 7 days, Last 30 days, Last 90 days, All time, Custom)
- Service category (All, Chemical, Microbiological, etc.)

**Implementation**:
```typescript
const [filters, setFilters] = useState({
  status: 'all',
  dateRange: 'all',
  category: 'all'
})

// Apply filters to API query
const queryParams = new URLSearchParams({
  labId: lab.id,
  ...(filters.status !== 'all' && { status: filters.status }),
  ...(filters.dateRange !== 'all' && {
    startDate: getDateRangeStart(filters.dateRange),
    endDate: new Date().toISOString()
  }),
  ...(filters.category !== 'all' && { category: filters.category })
})

fetch(`/api/orders?${queryParams}`)
```

#### 3.3 Bulk Operations
**UI**: Checkboxes on each order row, "Select All" checkbox in header, action bar appears when ≥1 selected

**Actions**:
- Bulk Acknowledge (PENDING → ACKNOWLEDGED)
- Bulk Start Testing (ACKNOWLEDGED → IN_PROGRESS)
- Export Selected to CSV

**Implementation**:
```typescript
const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())

function handleSelectAll(checked: boolean) {
  if (checked) {
    setSelectedOrders(new Set(orders.map(o => o.id)))
  } else {
    setSelectedOrders(new Set())
  }
}

async function handleBulkAcknowledge() {
  const orderIds = Array.from(selectedOrders)

  const res = await fetch('/api/orders/bulk/acknowledge', {
    method: 'POST',
    body: JSON.stringify({ orderIds })
  })

  if (res.ok) {
    toast.success(`${orderIds.length} orders acknowledged`)
    setSelectedOrders(new Set())
    fetchOrders()  // Refresh
  }
}
```

**API**:
```typescript
// POST /api/orders/bulk/acknowledge
// Body: { orderIds: string[] }

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const { orderIds } = await req.json()

  // Verify all orders belong to this lab admin's lab
  const orders = await prisma.order.findMany({
    where: {
      id: { in: orderIds },
      lab: { ownerId: session.user.id }
    }
  })

  if (orders.length !== orderIds.length) {
    return NextResponse.json({ error: 'Some orders not found' }, { status: 404 })
  }

  // Bulk update with transaction
  const result = await prisma.order.updateMany({
    where: {
      id: { in: orderIds },
      status: 'PENDING'  // Only update if currently PENDING
    },
    data: {
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date()
    }
  })

  return NextResponse.json({ updated: result.count })
}
```

#### 3.4 CSV Export
**UI**: "Export CSV" button (exports visible orders OR selected orders)

**Implementation** (Client-side):
```typescript
import { unparse } from 'papaparse'

function handleExportCSV() {
  const ordersToExport = selectedOrders.size > 0
    ? orders.filter(o => selectedOrders.has(o.id))
    : orders

  const csv = unparse(ordersToExport.map(order => ({
    'Order ID': order.id,
    'Client Name': order.client.name,
    'Client Email': order.client.email,
    'Service': order.service.name,
    'Status': order.status,
    'Quoted Price': order.quotedPrice ? `₱${order.quotedPrice}` : 'N/A',
    'Submitted Date': format(new Date(order.createdAt), 'yyyy-MM-dd'),
    'Completion Date': order.completedAt ? format(new Date(order.completedAt), 'yyyy-MM-dd') : 'N/A'
  })))

  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lab-orders-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
```

**Dependencies**:
```bash
npm install papaparse
npm install --save-dev @types/papaparse
npm install date-fns  # Already installed
```

**Implementation Time**: 3-4 hours
- Task 3.1: Debounced search input + API (1 hour)
- Task 3.2: Filter dropdowns + API (1 hour)
- Task 3.3: Bulk acknowledge/start API endpoints (1 hour)
- Task 3.4: CSV export (client-side with papaparse) (30 mins)
- Task 3.5: Database indexes for search performance (30 mins)

---

## Consequences

### Positive

1. **Lab Self-Service**:
   - Labs can manage service catalog without developer intervention
   - Reduces support burden (no manual service creation requests)
   - Scales to 500 labs (Stage 2 target)

2. **Data-Driven Decisions**:
   - Revenue analytics help labs optimize pricing
   - Quote approval rate identifies services that need price adjustment
   - Top services data helps labs focus on profitable offerings

3. **Operational Efficiency**:
   - Bulk operations save time for high-volume labs (50+ orders/week)
   - CSV export enables accounting integration
   - Search/filter reduces time to find specific orders

4. **Incremental Deployment**:
   - Can ship Service Management first (highest priority)
   - Then Analytics (business insights)
   - Then Workflow Tools (efficiency)
   - No all-or-nothing deployment risk

### Negative

1. **Complexity Added**:
   - 3 new pages, 10+ new components
   - 6+ new API endpoints
   - More code to test and maintain

2. **Performance Considerations**:
   - Analytics queries aggregate 100-500 orders (< 500ms expected, but needs monitoring)
   - Search on 3 tables (User, LabService, Order) requires indexes
   - Chart rendering adds ~500ms to page load

3. **User Learning Curve**:
   - Lab admins need to understand PricingMode (QUOTE_REQUIRED vs FIXED vs HYBRID)
   - Analytics dashboard requires basic understanding of metrics (approval rate, etc.)
   - More features = more onboarding needed

### Risks

**Risk 1: Analytics queries too slow**
- **Mitigation**: Add database indexes (search, filters, aggregations)
- **Fallback**: If queries > 1 second, implement daily aggregation cache (DailyLabStats model)

**Risk 2: CSV export memory issues for large datasets**
- **Mitigation**: Limit export to 500 orders at a time
- **Fallback**: If client-side export fails, implement server-side streaming CSV

**Risk 3: Bulk operations unintended consequences**
- **Mitigation**: Require confirmation modal before bulk acknowledge/start
- **Mitigation**: Log all bulk operations for audit trail
- **Fallback**: Add "Undo" feature for bulk operations (soft delete pattern)

---

## Implementation Roadmap

### Phase 1: Service Management (4-5 hours)

**Priority**: P1 (CEO priority, unblocks self-service)

**Tasks** (delegatable to @agent-developer in 5-20 line increments):

1. **Task 1.1**: Create service listing page skeleton (30 mins)
   - File: `src/app/dashboard/lab/services/page.tsx`
   - Create basic page layout with header "Manage Services"
   - Add "Add Service" button (placeholder)
   - Add empty state: "No services yet. Add your first service."

2. **Task 1.2**: Create service table component (1 hour)
   - File: `src/app/dashboard/lab/services/components/ServiceTable.tsx`
   - shadcn/ui Table component
   - Columns: Name, Category, Pricing Mode, Price, Turnaround, Active (toggle)
   - Fetch services: GET `/api/services?labId=X&active=all`
   - Enable/disable toggle: PATCH `/api/services/[id]` { active: true/false }

3. **Task 1.3**: Create service validation schema (15 mins)
   - File: `src/lib/validations/service.ts`
   - Zod schema (see specification above)
   - Export `serviceSchema`, `createServiceSchema`, `updateServiceSchema`

4. **Task 1.4**: Implement POST /api/services endpoint (30 mins)
   - File: `src/app/api/services/route.ts` (extend existing)
   - Auth: Verify LAB_ADMIN role + lab ownership
   - Validate: Use serviceSchema
   - Create: prisma.labService.create()
   - Return: 201 Created with service object

5. **Task 1.5**: Implement PATCH /api/services/[id] endpoint (30 mins)
   - File: `src/app/api/services/[id]/route.ts`
   - Auth: Verify LAB_ADMIN owns service's lab
   - Validate: Use updateServiceSchema (all fields optional)
   - Update: prisma.labService.update()
   - Return: 200 OK with updated service

6. **Task 1.6**: Create "Create Service" modal (1 hour)
   - File: `src/app/dashboard/lab/services/components/CreateServiceModal.tsx`
   - shadcn/ui Dialog component
   - Form fields: Name, Category (dropdown), Pricing Mode (radio), Price (conditional), Description (textarea)
   - Client validation: react-hook-form + zodResolver(serviceSchema)
   - Submit: POST /api/services
   - Success: Toast notification, close modal, refresh table

7. **Task 1.7**: Create "Edit Service" modal (45 mins)
   - File: `src/app/dashboard/lab/services/components/EditServiceModal.tsx`
   - Similar to CreateServiceModal, but pre-populated with existing values
   - Submit: PATCH /api/services/[id]

8. **Task 1.8**: Implement bulk enable/disable (45 mins)
   - File: `src/app/api/services/bulk/route.ts`
   - POST /api/services/bulk { action: 'enable' | 'disable', serviceIds: string[] }
   - Verify all services belong to lab admin's lab
   - Update: prisma.labService.updateMany()

9. **Task 1.9**: Add tests for service management (1 hour)
   - Unit tests: Service validation schema
   - Integration tests: POST /api/services, PATCH /api/services/[id]
   - E2E test: Create service → Edit service → Disable service

**Acceptance Criteria**:
- [ ] Lab admin can view all services (active + inactive)
- [ ] Lab admin can create new service with all fields
- [ ] Validation prevents invalid data (negative price, etc.)
- [ ] Lab admin can edit existing service
- [ ] Lab admin can enable/disable service
- [ ] Lab admin cannot modify services of other labs
- [ ] All tests pass

---

### Phase 2: Analytics Dashboard (5-6 hours)

**Priority**: P2 (business value, not blocking)

**Tasks**:

1. **Task 2.1**: Create analytics API endpoint (2 hours)
   - File: `src/app/api/labs/[id]/analytics/route.ts`
   - Auth: Verify LAB_ADMIN owns lab
   - Aggregate queries:
     - Revenue (total, thisMonth, lastMonth, last6Months)
     - Quote metrics (approval rate, avg quote, avg turnaround, pending count)
     - Order volume (by status, last 30 days)
     - Top services (by volume, by revenue)
   - Return: Single JSON object with all analytics
   - Performance: < 500ms for 500 orders

2. **Task 2.2**: Create analytics page skeleton (30 mins)
   - File: `src/app/dashboard/lab/analytics/page.tsx`
   - Layout: 4 sections (Revenue, Quotes, Orders, Services)
   - Loading states: Skeleton screens for each widget
   - Error states: "Failed to load analytics" message

3. **Task 2.3**: Install Recharts library (5 mins)
   - Command: `npm install recharts`
   - Add to dependencies in package.json

4. **Task 2.4**: Create revenue chart component (1.5 hours)
   - File: `src/app/dashboard/lab/analytics/components/RevenueChart.tsx`
   - Recharts LineChart with X-axis (months), Y-axis (revenue)
   - Data: last6Months from analytics API
   - Tooltip: Show exact revenue on hover
   - Responsive: Width 100%, height 300px

5. **Task 2.5**: Create quote metrics cards (1 hour)
   - File: `src/app/dashboard/lab/analytics/components/QuoteMetrics.tsx`
   - 4 shadcn/ui Card components:
     - Quote Approval Rate (78.5% with green/red color based on threshold)
     - Average Quote Value (₱4,250)
     - Average Turnaround (5 days)
     - Quotes Pending Client Response (12)
   - Layout: 2x2 grid on desktop, stack on mobile

6. **Task 2.6**: Create order volume chart (1 hour)
   - File: `src/app/dashboard/lab/analytics/components/OrderVolumeChart.tsx`
   - Recharts BarChart (X-axis: status, Y-axis: count)
   - Color coding: Match status badge colors from main dashboard

7. **Task 2.7**: Create top services table (30 mins)
   - File: `src/app/dashboard/lab/analytics/components/TopServices.tsx`
   - shadcn/ui Table component
   - Two tabs: "By Volume" and "By Revenue"
   - Top 5 services for each

8. **Task 2.8**: Add tests for analytics (1 hour)
   - Integration test: GET /api/labs/[id]/analytics returns correct data
   - Performance test: Query completes in < 500ms
   - Edge case: Analytics for lab with 0 orders

**Acceptance Criteria**:
- [ ] Analytics page loads in < 2 seconds
- [ ] Revenue chart shows last 6 months correctly
- [ ] Quote approval rate calculated accurately
- [ ] Order volume chart displays all statuses
- [ ] Top services ranked correctly (by volume and revenue)
- [ ] Charts responsive on mobile
- [ ] All tests pass

---

### Phase 3: Workflow Improvements (3-4 hours)

**Priority**: P2 (efficiency improvement, not blocking)

**Tasks**:

1. **Task 3.1**: Add database indexes for search (15 mins)
   - File: `prisma/schema.prisma`
   - Add indexes: User.name, User.email, LabService.name
   - Migration: `npm run db:migrate`

2. **Task 3.2**: Extend GET /api/orders with search/filter (1 hour)
   - File: `src/app/api/orders/route.ts` (extend existing)
   - Query params: search, status, startDate, endDate, category
   - Prisma query with OR conditions for search
   - Prisma query with AND conditions for filters

3. **Task 3.3**: Create search input component (30 mins)
   - File: `src/app/dashboard/lab/components/OrderSearch.tsx`
   - shadcn/ui Input with search icon
   - Debounce: 300ms delay before triggering API call
   - Clear button when query exists

4. **Task 3.4**: Create filter dropdowns (30 mins)
   - File: `src/app/dashboard/lab/components/OrderFilters.tsx`
   - 3 shadcn/ui Select components (status, date range, category)
   - Apply filters immediately on change

5. **Task 3.5**: Add checkboxes to order table (15 mins)
   - File: `src/app/dashboard/lab/components/OrderTable.tsx`
   - Checkbox column (first column)
   - "Select All" checkbox in header
   - Track selected orders in Set<string>

6. **Task 3.6**: Create bulk actions bar (30 mins)
   - File: `src/app/dashboard/lab/components/BulkActionsBar.tsx`
   - Show when ≥1 order selected
   - Buttons: "Acknowledge Selected", "Start Testing", "Export CSV"
   - Confirmation modal before bulk actions

7. **Task 3.7**: Implement POST /api/orders/bulk/acknowledge (30 mins)
   - File: `src/app/api/orders/bulk/acknowledge/route.ts`
   - Verify all orders belong to lab admin's lab
   - Update status: PENDING → ACKNOWLEDGED
   - Return count of updated orders

8. **Task 3.8**: Implement POST /api/orders/bulk/start (30 mins)
   - File: `src/app/api/orders/bulk/start/route.ts`
   - Verify all orders belong to lab admin's lab
   - Update status: ACKNOWLEDGED → IN_PROGRESS
   - Return count of updated orders

9. **Task 3.9**: Install papaparse for CSV export (5 mins)
   - Command: `npm install papaparse @types/papaparse`

10. **Task 3.10**: Implement CSV export (client-side) (30 mins)
    - File: `src/app/dashboard/lab/components/CSVExport.tsx`
    - Use papaparse.unparse() to convert orders to CSV
    - Download as `lab-orders-YYYY-MM-DD.csv`
    - Export selected orders OR all visible orders (if none selected)

11. **Task 3.11**: Add tests for workflow improvements (1 hour)
    - Integration test: Search finds orders correctly
    - Integration test: Filters work (status, date, category)
    - Integration test: Bulk acknowledge updates correct orders
    - E2E test: Search → Select → Bulk acknowledge → Verify status changed

**Acceptance Criteria**:
- [ ] Search returns results in < 500ms
- [ ] Filters work correctly (status, date range, category)
- [ ] Can select individual orders and "Select All"
- [ ] Bulk acknowledge updates only PENDING orders
- [ ] Bulk start testing updates only ACKNOWLEDGED orders
- [ ] CSV export contains correct columns and data
- [ ] Cannot bulk update orders of other labs
- [ ] All tests pass

---

## Testing Strategy

### Unit Tests
- Validation schemas (serviceSchema, updateServiceSchema)
- CSV export formatting (papaparse output)
- Date range calculations (last 30 days, last 6 months)

### Integration Tests
- API endpoints:
  - POST /api/services (create service)
  - PATCH /api/services/[id] (update service)
  - POST /api/services/bulk (bulk enable/disable)
  - GET /api/labs/[id]/analytics (analytics aggregations)
  - GET /api/orders (search + filters)
  - POST /api/orders/bulk/acknowledge
  - POST /api/orders/bulk/start
- Authorization checks (lab admin cannot modify other labs' services/orders)
- State machine validation (bulk acknowledge only works on PENDING orders)

### E2E Tests (Playwright or similar)
- Service management flow:
  1. Create service → Verify appears in table
  2. Edit service → Verify changes saved
  3. Disable service → Verify status updated
- Analytics flow:
  1. Navigate to analytics → Verify charts load
  2. Check revenue data → Verify matches completed orders
- Workflow flow:
  1. Search for order → Verify results
  2. Filter by status → Verify filtered correctly
  3. Select orders → Bulk acknowledge → Verify status changed
  4. Export CSV → Verify downloaded file contains correct data

### Performance Tests
- Analytics API: < 500ms for 500 orders
- Search API: < 500ms with indexes
- Page load: < 2 seconds (analytics dashboard)

---

## Alternatives Considered

### Alternative 1: Real-time Analytics (Rejected)
**Approach**: Calculate analytics on every page load
**Pros**: Always up-to-date, no caching complexity
**Cons**: Slow for large datasets (> 1000 orders), unnecessary load on database
**Decision**: Use real-time for Stage 2 (< 500 labs), implement caching if performance issues arise

### Alternative 2: Dedicated Service Management Pages (Rejected)
**Approach**: `/dashboard/lab/services/create`, `/dashboard/lab/services/[id]/edit`
**Pros**: More space for complex forms, clearer URL structure
**Cons**: Extra navigation steps, slower workflow
**Decision**: Use modals for faster workflow (industry standard)

### Alternative 3: Server-Side CSV Export (Rejected)
**Approach**: API endpoint generates CSV, returns downloadable file
**Pros**: Can handle larger datasets (10,000+ orders)
**Cons**: More complexity (streaming, temp files, cleanup), slower for small datasets
**Decision**: Use client-side papaparse for Stage 2 (< 500 orders per lab), implement server-side if needed

### Alternative 4: NoSQL for Analytics (Rejected)
**Approach**: Use MongoDB or similar for analytics aggregations
**Pros**: Faster aggregations with pre-aggregated collections
**Cons**: Two databases to maintain, data sync complexity, overkill for Stage 2
**Decision**: Use PostgreSQL with indexes, scales to 500 labs

---

## Database Changes

### New Indexes (Performance)
```prisma
// prisma/schema.prisma

model User {
  @@index([name])   // For search
  @@index([email])  // For search
}

model LabService {
  @@index([name])   // For search
}

model Order {
  @@index([labId, createdAt(sort: Desc)])  // Existing
  @@index([clientId])  // New - for search
  @@index([labId, status, createdAt(sort: Desc)])  // New - for filtering
}
```

### Optional: Cached Analytics (Future)
If analytics queries > 500ms, implement daily aggregation cache:

```prisma
model DailyLabStats {
  id                  String   @id @default(cuid())
  labId               String
  date                DateTime @db.Date
  revenue             Decimal  @default(0)
  ordersCompleted     Int      @default(0)
  quotesProvided      Int      @default(0)
  quotesApproved      Int      @default(0)
  createdAt           DateTime @default(now())

  lab                 Lab      @relation(fields: [labId], references: [id])

  @@unique([labId, date])
  @@index([labId, date(sort: Desc)])
}
```

**Aggregation Job** (cron or background worker):
```typescript
// Run daily at midnight
async function aggregateLabStats() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const labs = await prisma.lab.findMany({ select: { id: true } })

  for (const lab of labs) {
    const orders = await prisma.order.findMany({
      where: {
        labId: lab.id,
        createdAt: {
          gte: new Date(yesterday.setHours(0, 0, 0, 0)),
          lt: new Date(yesterday.setHours(23, 59, 59, 999))
        }
      }
    })

    await prisma.dailyLabStats.upsert({
      where: { labId_date: { labId: lab.id, date: yesterday } },
      create: {
        labId: lab.id,
        date: yesterday,
        revenue: orders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + Number(o.quotedPrice), 0),
        ordersCompleted: orders.filter(o => o.status === 'COMPLETED').length,
        quotesProvided: orders.filter(o => o.status === 'QUOTE_PROVIDED').length,
        quotesApproved: orders.filter(o => o.quoteApprovedAt !== null).length
      },
      update: { /* same as create */ }
    })
  }
}
```

**Decision**: Implement only if needed (wait for performance testing with real data)

---

## Success Metrics

### Phase 1: Service Management
- [ ] 100% of labs can create services without developer help
- [ ] Average time to create service < 2 minutes
- [ ] Zero support tickets for "add service" requests

### Phase 2: Analytics Dashboard
- [ ] 80% of labs visit analytics page at least once per week
- [ ] Analytics page load time < 2 seconds
- [ ] Zero errors in analytics calculations (validated against manual counts)

### Phase 3: Workflow Improvements
- [ ] Search query returns results in < 500ms
- [ ] 50% of high-volume labs (>20 orders/week) use bulk operations
- [ ] CSV export used by 30% of labs for accounting integration

### Overall
- [ ] CEO approval: "Back office is ready for launch"
- [ ] All tests pass (unit, integration, E2E)
- [ ] Zero P0 bugs reported during UAT
- [ ] Performance benchmarks met (<2s page load, <500ms queries)

---

## References

- CEO feedback: "I think it's ready on the surface. Back office is next"
- Current lab dashboard: `src/app/dashboard/lab/page.tsx`
- Quote provision form: `src/app/dashboard/lab/orders/[id]/quote/page.tsx`
- Prisma schema: `prisma/schema.prisma`
- shadcn/ui components: https://ui.shadcn.com/
- Recharts documentation: https://recharts.org/
- Papaparse documentation: https://www.papaparse.com/

---

## Approval

**Recommended Next Step**: Review with CEO for approval, then begin Phase 1 (Service Management) implementation.

**Estimated Total Time**: 12-15 hours across 3 phases
**Estimated Sessions**: 3-4 sessions (4 hours per session)
**Deployment Strategy**: Incremental (ship Phase 1, then Phase 2, then Phase 3)

**Questions for CEO**:
1. Priority order: Service Management → Analytics → Workflow (agree)?
2. Analytics widgets: Any specific metrics you want to track?
3. CSV export: Any additional columns needed for accounting?
4. Timeline: All 3 phases before launch, or Phase 1 first then iterate?
