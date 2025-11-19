# Back Office Implementation Tasks
## Delegatable Task Breakdown for @agent-developer

**Reference**: `docs/ADR_LAB_ADMIN_BACK_OFFICE_20251119.md`
**Total Estimate**: 12-15 hours across 3 phases
**Deployment Strategy**: Incremental (ship Phase 1, test, then Phase 2, then Phase 3)

---

## 🎯 PHASE 1: Service Management (4-5 hours) - PRIORITY P1

**Goal**: Lab admins can create/edit/disable services without developer intervention

### Task 1.1: Create Service Listing Page Skeleton (30 mins)
**Delegation**:
```
Task for @agent-developer: Create service listing page skeleton

File: src/app/dashboard/lab/services/page.tsx (NEW FILE)
Lines: Create new file (~50 lines)

Requirements:
- 'use client' directive (Next.js App Router client component)
- Page title: "Manage Services"
- "Add Service" button (top right, placeholder onClick)
- Empty state when no services: "No services yet. Add your first service to get started."
- Use shadcn/ui Card, Button components

Example structure:
```typescript
'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function ServicesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Services</h1>
        <Button>Add Service</Button>
      </div>
      {/* Empty state or table will go here */}
    </div>
  )
}
```

Acceptance criteria:
- [ ] Page renders without errors
- [ ] "Add Service" button exists (placeholder)
- [ ] Empty state displays when no services
```

---

### Task 1.2: Create Service Table Component (1 hour)
**Delegation**:
```
Task for @agent-developer: Create service table component with enable/disable toggles

Files:
- src/app/dashboard/lab/services/components/ServiceTable.tsx (NEW)
- src/app/dashboard/lab/services/page.tsx (UPDATE - import and use ServiceTable)

Requirements:
- Fetch services from GET /api/services?labId=X&active=all (extend existing endpoint)
- shadcn/ui Table component with columns:
  - Name (string)
  - Category (badge)
  - Pricing Mode (badge: QUOTE_REQUIRED=yellow, FIXED=green, HYBRID=blue)
  - Price (₱X,XXX.XX or "Quote Required")
  - Turnaround (X days or "N/A")
  - Active (toggle switch)
- Enable/disable toggle: PATCH /api/services/[id] { active: true/false }
- Loading state: Skeleton rows
- Error state: "Failed to load services" message

Acceptance criteria:
- [ ] Table fetches and displays all services (active + inactive)
- [ ] Toggle switch enables/disables service
- [ ] Pricing mode badges color-coded correctly
- [ ] Loading skeleton displayed while fetching
```

---

### Task 1.3: Create Service Validation Schema (15 mins)
**Delegation**:
```
Task for @agent-developer: Create service validation schema

File: src/lib/validations/service.ts (NEW FILE)
Lines: ~40 lines

Requirements:
- Zod schema for service creation/update
- Fields:
  - name: 3-200 characters, required
  - description: max 1000 characters, optional
  - category: enum (Chemical Analysis, Microbiological Testing, Physical Testing, Environmental Testing, Food Safety, Other)
  - pricingMode: enum (QUOTE_REQUIRED, FIXED, HYBRID)
  - pricePerUnit: positive number, max 1000000, optional (required if FIXED or HYBRID)
  - unitType: string, default "per_sample"
  - turnaroundDays: positive integer, max 365, optional
  - sampleRequirements: max 500 characters, optional
- Refinement: Validate pricePerUnit required for FIXED/HYBRID modes

Example:
```typescript
import { z } from 'zod'

export const serviceSchema = z.object({
  // ... fields ...
}).refine(
  (data) => data.pricingMode === 'QUOTE_REQUIRED' || data.pricePerUnit !== undefined,
  { message: 'Price required for FIXED and HYBRID modes', path: ['pricePerUnit'] }
)
```

Acceptance criteria:
- [ ] Schema validates all required fields
- [ ] Refinement catches missing price for FIXED/HYBRID
- [ ] Schema exports: serviceSchema, createServiceSchema, updateServiceSchema
```

---

### Task 1.4: Implement POST /api/services (30 mins)
**Delegation**:
```
Task for @agent-developer: Implement service creation API endpoint

File: src/app/api/services/route.ts (EXTEND existing GET route)
Lines: Add ~40 lines (POST handler)

Requirements:
- Auth: getServerSession, verify LAB_ADMIN role
- Ownership: Fetch lab where ownerId = session.user.id
- Validate: Use serviceSchema.parse()
- Create: prisma.labService.create({ data: { ...validatedData, labId: lab.id } })
- Return: 201 Created with service object
- Error handling: 401 (not authenticated), 403 (not LAB_ADMIN), 404 (lab not found), 400 (validation error)

Security:
- NEVER trust labId from request body (always use lab.id from ownership check)
- Verify session.user.role === 'LAB_ADMIN'

Acceptance criteria:
- [ ] Endpoint returns 201 with created service
- [ ] Non-LAB_ADMIN gets 403
- [ ] Invalid data gets 400 with Zod errors
- [ ] Lab admin cannot create service for other labs
```

---

### Task 1.5: Implement PATCH /api/services/[id] (30 mins)
**Delegation**:
```
Task for @agent-developer: Implement service update API endpoint

File: src/app/api/services/[id]/route.ts (NEW FILE)
Lines: ~50 lines (PATCH handler)

Requirements:
- Auth: Verify LAB_ADMIN
- Ownership: Fetch service where id = params.id AND lab.ownerId = session.user.id
- If not found: 404 (don't leak whether service exists but belongs to different lab)
- Validate: Use updateServiceSchema (all fields optional)
- Update: prisma.labService.update()
- Return: 200 OK with updated service

Acceptance criteria:
- [ ] Lab admin can update their own services
- [ ] Lab admin cannot update other labs' services (404)
- [ ] Partial updates work (only changed fields)
- [ ] Validation errors return 400
```

---

### Task 1.6: Create "Create Service" Modal (1 hour)
**Delegation**:
```
Task for @agent-developer: Create service creation modal component

File: src/app/dashboard/lab/services/components/CreateServiceModal.tsx (NEW)
Lines: ~120 lines

Requirements:
- shadcn/ui Dialog component
- react-hook-form with zodResolver(serviceSchema)
- Fields:
  - Name (text input, required)
  - Category (select dropdown, required)
  - Pricing Mode (radio buttons, required)
  - Price Per Unit (number input, shown only if FIXED or HYBRID)
  - Unit Type (text input, default "per_sample")
  - Turnaround Days (number input, optional)
  - Description (textarea, optional)
  - Sample Requirements (textarea, optional)
- Submit: POST /api/services
- Success: Toast notification "Service created", close modal, trigger parent refresh
- Error: Display error message in modal, don't close

Example structure:
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

export function CreateServiceModal({ isOpen, onClose, onSuccess }) {
  const form = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: { pricingMode: 'QUOTE_REQUIRED', unitType: 'per_sample' }
  })

  async function onSubmit(data) {
    const res = await fetch('/api/services', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    if (res.ok) {
      toast.success('Service created')
      onSuccess()
      onClose()
    }
  }

  return <Dialog open={isOpen} onOpenChange={onClose}>
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* form fields */}
    </form>
  </Dialog>
}
```

Acceptance criteria:
- [ ] Modal opens/closes correctly
- [ ] Price field shown only for FIXED/HYBRID
- [ ] Client validation prevents invalid data
- [ ] Success closes modal and refreshes table
- [ ] Errors displayed in modal
```

---

### Task 1.7: Create "Edit Service" Modal (45 mins)
**Delegation**:
```
Task for @agent-developer: Create service editing modal (similar to CreateServiceModal)

File: src/app/dashboard/lab/services/components/EditServiceModal.tsx (NEW)
Lines: ~110 lines

Requirements:
- Same as CreateServiceModal, but:
  - Pre-populate form with existing service data
  - Submit: PATCH /api/services/[id]
  - Toast: "Service updated"

Accept props: { service: LabService, isOpen, onClose, onSuccess }

Acceptance criteria:
- [ ] Form pre-populated with service data
- [ ] Update saves changes correctly
- [ ] Partial updates work (only changed fields sent)
```

---

### Task 1.8: Implement Bulk Enable/Disable (45 mins)
**Delegation**:
```
Task for @agent-developer: Implement bulk service operations

Files:
- src/app/api/services/bulk/route.ts (NEW)
- src/app/dashboard/lab/services/components/BulkActionsBar.tsx (NEW)

Requirements:
API Route:
- POST /api/services/bulk
- Body: { action: 'enable' | 'disable', serviceIds: string[] }
- Verify all services belong to lab admin's lab
- Update: prisma.labService.updateMany({ where: { id: { in: serviceIds } }, data: { active: true/false } })
- Return: { updated: count }

UI Component:
- Show when ≥1 service selected
- Buttons: "Enable Selected", "Disable Selected"
- Confirmation modal before action

Acceptance criteria:
- [ ] Bulk enable updates all selected services
- [ ] Cannot bulk update services of other labs
- [ ] Confirmation required before action
```

---

### Task 1.9: Add Tests for Service Management (1 hour)
**Delegation**:
```
Task for @agent-developer: Add comprehensive tests for service management

Files:
- src/lib/validations/__tests__/service.test.ts (NEW)
- src/app/api/services/__tests__/route.test.ts (NEW)
- src/app/api/services/[id]/__tests__/route.test.ts (NEW)

Requirements:
Unit Tests (Validation):
- Valid service data passes
- Missing required fields fail
- Price required for FIXED/HYBRID
- Invalid price/turnaround fail

Integration Tests (API):
- POST /api/services creates service
- Non-LAB_ADMIN gets 403
- Lab admin cannot create for other labs
- PATCH /api/services/[id] updates service
- Lab admin cannot update other labs' services

Acceptance criteria:
- [ ] All tests pass
- [ ] Coverage >80% for service management code
```

---

## 🎯 PHASE 2: Analytics Dashboard (5-6 hours) - PRIORITY P2

**Goal**: Lab admins can view revenue, quote performance, and service insights

### Task 2.1: Create Analytics API Endpoint (2 hours)
**Delegation**:
```
Task for @agent-developer: Create analytics aggregation API endpoint

File: src/app/api/labs/[id]/analytics/route.ts (NEW)
Lines: ~150 lines

Requirements:
- Auth: Verify LAB_ADMIN owns lab (id = params.id, lab.ownerId = session.user.id)
- Aggregate queries:
  1. Revenue:
     - Total revenue (all COMPLETED orders)
     - This month revenue
     - Last month revenue
     - Last 6 months revenue (array)
  2. Quote metrics:
     - Quote approval rate (QUOTE_PROVIDED → PENDING / total QUOTE_PROVIDED)
     - Average quote value
     - Average turnaround days
     - Quotes pending (QUOTE_PROVIDED count)
  3. Order volume:
     - Orders by status (group by)
     - Last 30 days orders (array)
  4. Top services:
     - Top 5 by order volume
     - Top 5 by revenue
- Return: Single JSON object with all analytics
- Performance: < 500ms target

Example query (revenue):
```typescript
const completedOrders = await prisma.order.findMany({
  where: { labId: params.id, status: 'COMPLETED' },
  select: { quotedPrice: true, completedAt: true }
})

const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.quotedPrice), 0)
```

Acceptance criteria:
- [ ] Endpoint returns all analytics data
- [ ] Query completes in < 500ms for 500 orders
- [ ] Approval rate calculation correct
- [ ] Revenue grouped by month correctly
```

---

### Task 2.2: Install Recharts Library (5 mins)
**Command**: `npm install recharts`

---

### Task 2.3: Create Revenue Chart Component (1.5 hours)
**Delegation**:
```
Task for @agent-developer: Create revenue chart component using Recharts

File: src/app/dashboard/lab/analytics/components/RevenueChart.tsx (NEW)
Lines: ~80 lines

Requirements:
- Recharts LineChart component
- Data: last6Months array from analytics API
- X-axis: Month names (Jun, Jul, Aug, etc.)
- Y-axis: Revenue (₱)
- Tooltip: Show exact revenue on hover
- Responsive: width 100%, height 300px
- Color: Green line (matches brand)

Example:
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function RevenueChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

Acceptance criteria:
- [ ] Chart displays last 6 months data
- [ ] Tooltip shows formatted revenue
- [ ] Responsive on mobile
```

---

### Task 2.4: Create Quote Metrics Cards (1 hour)
**Delegation**:
```
Task for @agent-developer: Create quote metrics stat cards

File: src/app/dashboard/lab/analytics/components/QuoteMetrics.tsx (NEW)
Lines: ~60 lines

Requirements:
- 4 shadcn/ui Card components in 2x2 grid
- Metrics:
  1. Quote Approval Rate (percentage, green if >75%, yellow if 50-75%, red if <50%)
  2. Average Quote Value (₱X,XXX)
  3. Average Turnaround Days (X days)
  4. Quotes Pending (count)
- Data: From analytics API
- Mobile: Stack vertically

Acceptance criteria:
- [ ] All 4 cards display correct data
- [ ] Approval rate color-coded correctly
- [ ] Responsive layout (2x2 → 1x4 on mobile)
```

---

### Task 2.5: Create Order Volume Chart (1 hour)
**Delegation**:
```
Task for @agent-developer: Create order volume bar chart

File: src/app/dashboard/lab/analytics/components/OrderVolumeChart.tsx (NEW)
Lines: ~70 lines

Requirements:
- Recharts BarChart component
- Data: byStatus array from analytics API
- X-axis: Status names
- Y-axis: Count
- Bar colors: Match status badge colors (yellow=QUOTE_REQUESTED, green=QUOTE_PROVIDED, etc.)

Acceptance criteria:
- [ ] Chart shows all order statuses
- [ ] Bar colors match dashboard status badges
- [ ] Responsive
```

---

### Task 2.6: Create Top Services Table (30 mins)
**Delegation**:
```
Task for @agent-developer: Create top services table with tabs

File: src/app/dashboard/lab/analytics/components/TopServices.tsx (NEW)
Lines: ~50 lines

Requirements:
- shadcn/ui Tabs component with 2 tabs: "By Volume" and "By Revenue"
- Table columns: Rank, Service Name, Value (order count OR revenue)
- Data: topByVolume and topByRevenue from analytics API
- Top 5 only

Acceptance criteria:
- [ ] Tabs switch between volume and revenue
- [ ] Top 5 services ranked correctly
- [ ] Revenue formatted as currency
```

---

### Task 2.7: Create Analytics Page (30 mins)
**Delegation**:
```
Task for @agent-developer: Create analytics dashboard page

File: src/app/dashboard/lab/analytics/page.tsx (NEW)
Lines: ~100 lines

Requirements:
- Fetch analytics data: GET /api/labs/[id]/analytics
- Layout sections:
  1. Revenue Chart
  2. Quote Metrics (4 cards)
  3. Order Volume Chart
  4. Top Services
- Loading state: Skeleton for each section
- Error state: "Failed to load analytics"

Acceptance criteria:
- [ ] Page fetches analytics data
- [ ] All components render with data
- [ ] Loading skeletons displayed while fetching
- [ ] Page loads in < 2 seconds
```

---

### Task 2.8: Add Tests for Analytics (1 hour)
**Delegation**:
```
Task for @agent-developer: Add tests for analytics

Files:
- src/app/api/labs/[id]/analytics/__tests__/route.test.ts (NEW)

Requirements:
Integration Tests:
- Analytics API returns correct data structure
- Revenue calculations correct
- Approval rate calculated correctly
- Top services ranked correctly
- Performance: Query < 500ms

Edge Cases:
- Lab with 0 orders returns empty analytics
- Lab with only PENDING orders (no revenue)

Acceptance criteria:
- [ ] All tests pass
- [ ] Performance test validates < 500ms
```

---

## 🎯 PHASE 3: Workflow Improvements (3-4 hours) - PRIORITY P2

**Goal**: Search, filter, bulk operations, CSV export for efficiency

### Task 3.1: Add Database Indexes (15 mins)
**Delegation**:
```
Task for @agent-developer: Add database indexes for search performance

File: prisma/schema.prisma (UPDATE)
Lines: Add 3 indexes

Requirements:
Add indexes to:
- User model: @@index([name]), @@index([email])
- LabService model: @@index([name])

Run migration: npm run db:migrate

Acceptance criteria:
- [ ] Indexes created successfully
- [ ] Migration file generated
- [ ] Search queries benefit from indexes (check query plan)
```

---

### Task 3.2: Extend GET /api/orders with Search/Filter (1 hour)
**Delegation**:
```
Task for @agent-developer: Add search and filter capabilities to orders API

File: src/app/api/orders/route.ts (EXTEND existing GET handler)
Lines: Add ~40 lines

Requirements:
- Query params:
  - search: string (searches client name, email, service name, order ID)
  - status: OrderStatus (filters by status)
  - startDate: ISO date (filters orders >= startDate)
  - endDate: ISO date (filters orders <= endDate)
  - category: string (filters by service category)
- Prisma query with OR conditions for search, AND conditions for filters
- Maintain existing pagination (page, limit)

Example:
```typescript
const where = {
  labId: labId,
  ...(search && {
    OR: [
      { client: { name: { contains: search, mode: 'insensitive' } } },
      { client: { email: { contains: search, mode: 'insensitive' } } },
      { service: { name: { contains: search, mode: 'insensitive' } } },
      { id: { startsWith: search } }
    ]
  }),
  ...(status && { status }),
  ...(startDate && { createdAt: { gte: new Date(startDate) } }),
  ...(endDate && { createdAt: { lte: new Date(endDate) } })
}
```

Acceptance criteria:
- [ ] Search finds orders by client, service, ID
- [ ] Filters work correctly (status, date range)
- [ ] Search + filters work together (AND logic)
- [ ] Query < 500ms with indexes
```

---

### Task 3.3: Create Search Input Component (30 mins)
**Delegation**:
```
Task for @agent-developer: Create debounced search input

File: src/app/dashboard/lab/components/OrderSearch.tsx (NEW)
Lines: ~40 lines

Requirements:
- shadcn/ui Input with search icon
- Debounce: 300ms delay before triggering onChange
- Clear button (X icon) when query exists
- Placeholder: "Search by client, service, or order ID"

Example:
```typescript
const [searchQuery, setSearchQuery] = useState('')

useEffect(() => {
  const timer = setTimeout(() => {
    onSearchChange(searchQuery)
  }, 300)
  return () => clearTimeout(timer)
}, [searchQuery])
```

Acceptance criteria:
- [ ] Search triggers after 300ms delay
- [ ] Clear button clears search
- [ ] Enter key triggers search immediately
```

---

### Task 3.4: Create Filter Dropdowns (30 mins)
**Delegation**:
```
Task for @agent-developer: Create filter dropdown components

File: src/app/dashboard/lab/components/OrderFilters.tsx (NEW)
Lines: ~60 lines

Requirements:
- 3 shadcn/ui Select components:
  1. Status (All, Quote Requested, Quote Provided, Pending, Acknowledged, In Progress, Completed)
  2. Date Range (All, Last 7 days, Last 30 days, Last 90 days)
  3. Category (All, Chemical, Microbiological, Physical, Environmental, Food Safety, Other)
- Apply filters immediately on change (trigger parent onFilterChange)

Acceptance criteria:
- [ ] Filters trigger parent callback on change
- [ ] "All" option clears filter
- [ ] Filters work together
```

---

### Task 3.5: Add Checkboxes to Order Table (15 mins)
**Delegation**:
```
Task for @agent-developer: Add checkboxes to lab dashboard order table

File: src/app/dashboard/lab/components/OrderTable.tsx (UPDATE existing or NEW)
Lines: Add ~20 lines

Requirements:
- Add checkbox column (first column)
- "Select All" checkbox in header
- Track selected orders in Set<string>
- Pass selectedOrders to parent component

Acceptance criteria:
- [ ] Checkboxes toggle selection
- [ ] Select All works correctly
- [ ] Deselect All works
- [ ] Selected state persists during pagination
```

---

### Task 3.6: Implement Bulk Acknowledge API (30 mins)
**Delegation**:
```
Task for @agent-developer: Implement bulk acknowledge orders endpoint

File: src/app/api/orders/bulk/acknowledge/route.ts (NEW)
Lines: ~50 lines

Requirements:
- POST /api/orders/bulk/acknowledge
- Body: { orderIds: string[] }
- Auth: Verify LAB_ADMIN
- Ownership: Verify all orders belong to lab admin's lab
- Update: PENDING → ACKNOWLEDGED (only if currently PENDING)
- Return: { updated: count }

Acceptance criteria:
- [ ] Updates only PENDING orders
- [ ] Cannot update orders of other labs
- [ ] Returns count of updated orders
```

---

### Task 3.7: Implement Bulk Start Testing API (30 mins)
**Delegation**:
```
Task for @agent-developer: Implement bulk start testing endpoint

File: src/app/api/orders/bulk/start/route.ts (NEW)
Lines: ~50 lines

Requirements:
- POST /api/orders/bulk/start
- Body: { orderIds: string[] }
- Update: ACKNOWLEDGED → IN_PROGRESS
- Similar auth/ownership checks as bulk acknowledge

Acceptance criteria:
- [ ] Updates only ACKNOWLEDGED orders
- [ ] Cannot update orders of other labs
```

---

### Task 3.8: Install papaparse for CSV Export (5 mins)
**Command**: `npm install papaparse @types/papaparse`

---

### Task 3.9: Implement CSV Export Component (30 mins)
**Delegation**:
```
Task for @agent-developer: Create CSV export functionality

File: src/app/dashboard/lab/components/CSVExport.tsx (NEW)
Lines: ~40 lines

Requirements:
- Button: "Export CSV"
- Use papaparse to convert orders to CSV
- Columns: Order ID, Client Name, Client Email, Service, Status, Quoted Price, Submitted Date, Completion Date
- Download as: lab-orders-YYYY-MM-DD.csv
- Export selected orders OR all visible orders (if none selected)

Example:
```typescript
import { unparse } from 'papaparse'

function handleExport() {
  const csv = unparse(orders.map(o => ({
    'Order ID': o.id,
    'Client Name': o.client.name,
    // ... other columns
  })))

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lab-orders-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
}
```

Acceptance criteria:
- [ ] CSV contains all specified columns
- [ ] Downloads with correct filename
- [ ] Works for 500+ orders
```

---

### Task 3.10: Create Bulk Actions Bar (30 mins)
**Delegation**:
```
Task for @agent-developer: Create bulk actions toolbar

File: src/app/dashboard/lab/components/BulkActionsBar.tsx (NEW)
Lines: ~50 lines

Requirements:
- Show when ≥1 order selected
- Display: "{count} orders selected"
- Buttons: "Acknowledge Selected", "Start Testing", "Export CSV"
- Confirmation modal before bulk operations
- Disable buttons based on order status (e.g., can't acknowledge already acknowledged orders)

Acceptance criteria:
- [ ] Bar appears/disappears based on selection
- [ ] Confirmation required before bulk operations
- [ ] Success toast shows "{count} orders updated"
```

---

### Task 3.11: Add Tests for Workflow Improvements (1 hour)
**Delegation**:
```
Task for @agent-developer: Add tests for search, filter, bulk operations

Files:
- src/app/api/orders/__tests__/route.test.ts (UPDATE - add search/filter tests)
- src/app/api/orders/bulk/acknowledge/__tests__/route.test.ts (NEW)
- src/app/api/orders/bulk/start/__tests__/route.test.ts (NEW)

Requirements:
Integration Tests:
- Search finds correct orders
- Filters work (status, date, category)
- Bulk acknowledge updates correct orders
- Bulk start updates correct orders
- Cannot bulk update other labs' orders

Performance Tests:
- Search query < 500ms with 500 orders

Acceptance criteria:
- [ ] All tests pass
- [ ] Coverage >80%
```

---

## 📊 PROGRESS TRACKING

### Phase 1: Service Management
- [ ] Task 1.1: Service listing page skeleton
- [ ] Task 1.2: Service table component
- [ ] Task 1.3: Validation schema
- [ ] Task 1.4: POST /api/services
- [ ] Task 1.5: PATCH /api/services/[id]
- [ ] Task 1.6: Create service modal
- [ ] Task 1.7: Edit service modal
- [ ] Task 1.8: Bulk enable/disable
- [ ] Task 1.9: Tests

**Estimated**: 4-5 hours | **Actual**: _____ | **Status**: ⬜ Not Started

### Phase 2: Analytics Dashboard
- [ ] Task 2.1: Analytics API endpoint
- [ ] Task 2.2: Install Recharts
- [ ] Task 2.3: Revenue chart
- [ ] Task 2.4: Quote metrics cards
- [ ] Task 2.5: Order volume chart
- [ ] Task 2.6: Top services table
- [ ] Task 2.7: Analytics page
- [ ] Task 2.8: Tests

**Estimated**: 5-6 hours | **Actual**: _____ | **Status**: ⬜ Not Started

### Phase 3: Workflow Improvements
- [ ] Task 3.1: Database indexes
- [ ] Task 3.2: Search/filter API
- [ ] Task 3.3: Search input
- [ ] Task 3.4: Filter dropdowns
- [ ] Task 3.5: Order table checkboxes
- [ ] Task 3.6: Bulk acknowledge API
- [ ] Task 3.7: Bulk start API
- [ ] Task 3.8: Install papaparse
- [ ] Task 3.9: CSV export
- [ ] Task 3.10: Bulk actions bar
- [ ] Task 3.11: Tests

**Estimated**: 3-4 hours | **Actual**: _____ | **Status**: ⬜ Not Started

---

## 🚀 DEPLOYMENT CHECKLIST

### Before Phase 1 Deployment
- [ ] All Phase 1 tasks completed
- [ ] All Phase 1 tests passing
- [ ] Manual testing: Create/edit/disable service
- [ ] Type check: `npm run type-check`
- [ ] Lint check: `npm run lint`
- [ ] Build succeeds: `npm run build`

### Before Phase 2 Deployment
- [ ] All Phase 2 tasks completed
- [ ] Analytics queries < 500ms (performance test)
- [ ] Charts render correctly on mobile
- [ ] Manual testing: View analytics, check calculations

### Before Phase 3 Deployment
- [ ] All Phase 3 tasks completed
- [ ] Search returns results < 500ms
- [ ] Bulk operations work correctly
- [ ] CSV export tested with 100+ orders
- [ ] Manual testing: Search → Filter → Bulk acknowledge → Export

---

## 💡 TIPS FOR FUTURE SESSIONS

1. **Start with Phase 1** (service management) - highest CEO priority
2. **Test incrementally** - Don't wait until all tasks done to test
3. **Use TodoWrite** - Track progress with in_progress → completed workflow
4. **Validate early** - Run `npm run type-check` and `npm run test` after each task
5. **Commit frequently** - Small commits (5-20 lines) easier to review/revert
6. **Follow existing patterns** - Match code style in `src/app/dashboard/lab/page.tsx`
7. **Security first** - Always verify lab admin ownership before mutations
8. **Performance matters** - Monitor query times, add indexes if > 500ms

---

## 📚 REFERENCE DOCUMENTS

- **Architecture Decision**: `docs/ADR_LAB_ADMIN_BACK_OFFICE_20251119.md`
- **Prisma Schema**: `prisma/schema.prisma`
- **Existing Lab Dashboard**: `src/app/dashboard/lab/page.tsx`
- **Existing Quote Form**: `src/app/dashboard/lab/orders/[id]/quote/page.tsx`
- **Validation Examples**: `src/lib/validations/order.ts`, `src/lib/validations/quote.ts`
- **API Examples**: `src/app/api/orders/route.ts`, `src/app/api/orders/[id]/quote/route.ts`

---

**Last Updated**: 2025-11-19
**Estimated Total Time**: 12-15 hours across 3 phases
**Deployment Strategy**: Incremental (Phase 1 → Phase 2 → Phase 3)
