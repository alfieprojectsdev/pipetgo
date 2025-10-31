# PipetGo MVP - Build Roadmap & Next Steps

**Current Status**: Basic structure exists, needs completion and polish
**Target**: Fully functional Stage 1 MVP
**Timeline**: 6-8 weeks (420 hours estimated)

---

## Component Completion Status

### ✅ Completed Components
- [x] Database schema (Prisma)
- [x] NextAuth.js configuration
- [x] Basic UI components (Button, Card - 2 components)
- [x] Homepage with service catalog
- [x] Dashboard routing structure (client/lab/admin)
- [x] API route structure (services, orders, auth)
- [x] Seed data with 3 demo users

### ⚠️ Partially Complete
- [ ] Dashboard pages (exist but need completion)
- [ ] Order submission flow (routing exists, forms incomplete)
- [ ] Service filtering/search (basic structure only)

### ❌ Missing Critical Components
- [ ] Complete UI component library
- [ ] Order management components
- [ ] File upload interface (mock)
- [ ] Status tracking components
- [ ] Form validation implementations
- [ ] Error handling & toast notifications
- [ ] Loading states throughout

---

## Priority Build Queue

### PHASE 1: Foundation (Week 1-2, 80 hours)

#### 1.1 Complete UI Component Library
**Priority**: CRITICAL
**Estimated**: 24 hours

Missing components to build:
```typescript
// src/components/ui/
- [ ] badge.tsx          // Order status badges
- [ ] input.tsx          // Form inputs
- [ ] textarea.tsx       // Sample description fields
- [ ] select.tsx         // Dropdown selectors
- [ ] label.tsx          // Form labels
- [ ] form.tsx           // Form wrapper components
- [ ] dialog.tsx         // Modal dialogs
- [ ] alert.tsx          // Alert messages
- [ ] spinner.tsx        // Loading indicators
- [ ] avatar.tsx         // User avatars
- [ ] dropdown-menu.tsx  // Action menus
- [ ] tabs.tsx           // Tab navigation
```

**Implementation Steps**:
1. Use shadcn/ui CLI to generate base components:
   ```bash
   npx shadcn-ui@latest add badge
   npx shadcn-ui@latest add input
   npx shadcn-ui@latest add textarea
   # ... etc
   ```
2. Customize Tailwind theme in `tailwind.config.ts`
3. Test each component in Storybook (optional) or simple test page

**Deliverable**: Complete UI kit ready for feature components

---

#### 1.2 Toast Notification System
**Priority**: HIGH (Better UX than alerts)
**Estimated**: 8 hours

Port the toast system from ParkBoard:
- [ ] Create `ToastNotification.tsx` context provider
- [ ] Add animations to `globals.css`
- [ ] Wrap app with `ToastProvider` in layout
- [ ] Replace `console.error` and `alert()` calls with toasts

**Benefits**:
- Non-blocking error messages
- Consistent user feedback
- Professional polish
- Better than browser alerts

---

#### 1.3 Zod Validation Schemas
**Priority**: CRITICAL
**Estimated**: 16 hours

Complete validation schemas in `lib/validations/`:

```typescript
// order.schema.ts
export const orderSubmissionSchema = z.object({
  serviceId: z.string().cuid(),
  sampleDescription: z.string().min(20).max(500),
  specialInstructions: z.string().max(500).optional(),
  clientDetails: z.object({
    contactName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().regex(/^(09|\+639)\d{9}$/),
    shippingAddress: z.object({
      street: z.string(),
      city: z.string(),
      province: z.string(),
      postalCode: z.string().optional()
    })
  })
})

// service.schema.ts
export const serviceFilterSchema = z.object({
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  city: z.string().optional(),
  maxTurnaround: z.number().optional()
})

// lab.schema.ts
export const labProfileSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(20),
  location: z.object({
    address: z.string(),
    city: z.string(),
    province: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional()
  }),
  certifications: z.array(z.string())
})
```

**Integration**:
- Use with React Hook Form in all forms
- Validate in API routes before Prisma operations
- Return typed validation errors to client

---

#### 1.4 Error Handling Utilities
**Priority**: HIGH
**Estimated**: 12 hours

Create consistent error handling:

```typescript
// lib/utils/api-error.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message)
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    )
  }

  console.error('Unexpected error:', error)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}

// Usage in API routes
if (!session) {
  throw new ApiError(401, 'Authentication required', 'UNAUTHORIZED')
}
```

**Apply to**:
- All API routes in `src/app/api/`
- Client-side fetch error handling
- Form submission error handling

---

#### 1.5 Loading States & Skeletons
**Priority**: MEDIUM
**Estimated**: 20 hours

Add loading UX throughout:

```typescript
// components/ui/skeleton.tsx
export function ServiceCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      </CardContent>
    </Card>
  )
}
```

Create skeletons for:
- Service cards (homepage)
- Order lists (dashboards)
- Dashboard stats
- Profile forms

**Pattern**:
```typescript
if (isLoading) return <ServiceCardSkeleton count={6} />
if (error) return <ErrorState message={error} retry={refetch} />
return <ServiceGrid services={data} />
```

---

### PHASE 2: Core Features (Week 3-4, 120 hours)

#### 2.1 Complete Order Submission Flow
**Priority**: CRITICAL (Core user journey)
**Estimated**: 48 hours

**Components to build**:

```typescript
// components/features/orders/order-form.tsx
- Service selection (dropdown or cards)
- Sample description textarea
- Client details form (contact, shipping)
- Special instructions (optional)
- Price estimate display
- Submit with validation
- Success redirect to dashboard

// components/features/orders/service-selector.tsx
- Display service name, lab, category
- Show price and turnaround time
- Link to full service details

// components/features/orders/contact-form.tsx
- Contact name, email, phone
- Shipping address fields
- Philippine address format
- Validation with real-time feedback
```

**API Integration**:
```typescript
// app/api/orders/route.ts POST
1. Validate session
2. Validate request body with Zod
3. Check service exists and is active
4. Create order with PENDING status
5. Create clientDetails JSON snapshot
6. Return order with included service/lab
7. Send notification (Stage 2)
```

**User Flow**:
1. Browse services → Click "Request Test"
2. If not logged in → Redirect to signin
3. Show order form with selected service
4. Fill form → Validate → Submit
5. Show success toast → Redirect to client dashboard
6. See order with PENDING status

---

#### 2.2 Client Dashboard
**Priority**: CRITICAL
**Estimated**: 32 hours

Complete `src/app/dashboard/client/page.tsx`:

**Features**:
- [ ] List all user's orders (active + past)
- [ ] Filter by status (tabs: Active, Completed, Cancelled)
- [ ] Sort by date (newest first)
- [ ] Order cards showing:
  - Service name and lab
  - Status badge with color coding
  - Sample description (truncated)
  - Submission and update dates
  - Price (if quoted)
  - Download results button (if COMPLETED)
- [ ] Empty state when no orders
- [ ] Refresh button
- [ ] Search/filter by service name

**Components**:
```typescript
// components/features/orders/order-card.tsx
interface OrderCardProps {
  order: Order & {
    service: LabService & { lab: Lab }
    attachments: Attachment[]
  }
  showActions?: boolean
}

// components/features/orders/order-status-badge.tsx
const statusConfig = {
  PENDING: { color: 'yellow', label: 'Pending Review' },
  ACKNOWLEDGED: { color: 'blue', label: 'Acknowledged' },
  IN_PROGRESS: { color: 'purple', label: 'Testing' },
  COMPLETED: { color: 'green', label: 'Completed' },
  CANCELLED: { color: 'red', label: 'Cancelled' }
}

// components/features/orders/order-timeline.tsx
Show order status progression with dates
```

**Data Fetching**:
```typescript
// Client-side
const { data: orders, isLoading } = useQuery({
  queryKey: ['orders', session.user.id],
  queryFn: () => fetch('/api/orders').then(r => r.json())
})

// Or server-side (recommended)
const orders = await prisma.order.findMany({
  where: { clientId: session.user.id },
  include: {
    service: { include: { lab: true } },
    attachments: { where: { attachmentType: 'result' } }
  },
  orderBy: { createdAt: 'desc' }
})
```

---

#### 2.3 Lab Admin Dashboard
**Priority**: CRITICAL
**Estimated**: 40 hours

Complete `src/app/dashboard/lab/page.tsx`:

**Features**:
- [ ] List incoming orders for lab's services
- [ ] Group by status (Pending, In Progress, Completed)
- [ ] Action buttons per status:
  - PENDING → "Acknowledge Order"
  - ACKNOWLEDGED → "Start Testing"
  - IN_PROGRESS → "Upload Results" (opens dialog)
  - Show client contact details
- [ ] Order details modal/panel
- [ ] Mock file upload interface
- [ ] Add internal notes (not visible to client)
- [ ] Quick stats (pending count, today's completions)

**Status Update Flow**:
```typescript
// components/features/orders/order-actions.tsx
async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
) {
  const response = await fetch(`/api/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: newStatus })
  })

  if (response.ok) {
    showSuccess('Order status updated')
    refetchOrders()
  }
}

// For COMPLETED status
async function uploadResults(orderId: string) {
  // Stage 1: Generate mock file URL
  const mockFileUrl = `https://mock-storage/results/${orderId}.pdf`

  await fetch(`/api/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'COMPLETED',
      attachments: [{
        fileName: 'test-results.pdf',
        fileUrl: mockFileUrl,
        fileType: 'application/pdf',
        attachmentType: 'result'
      }]
    })
  })

  showSuccess('Results uploaded successfully')
}
```

**Lab Context**:
```typescript
// Get lab owned by current user
const lab = await prisma.lab.findFirst({
  where: { ownerId: session.user.id }
})

if (!lab) {
  return <CreateLabProfile />
}

// Fetch lab's orders
const orders = await prisma.order.findMany({
  where: { labId: lab.id },
  include: {
    client: true,
    service: true,
    attachments: true
  },
  orderBy: { createdAt: 'desc' }
})
```

---

### PHASE 3: Enhancement (Week 5-6, 100 hours)

#### 3.1 Platform Admin Dashboard
**Priority**: MEDIUM
**Estimated**: 32 hours

Complete `src/app/dashboard/admin/page.tsx`:

**Features**:
- [ ] Platform-wide statistics:
  - Total orders (all time, this month)
  - Revenue (mock totals from quotedPrice)
  - Active labs count
  - Active clients count
  - Orders by status (pie chart or bars)
  - Top categories
- [ ] Recent activity feed
- [ ] All orders table with filters:
  - Filter by lab, status, date range
  - Search by client email or order ID
  - Export to CSV (optional)
- [ ] User management panel:
  - List all users
  - View role distribution
  - Change user roles (with confirmation)
- [ ] Lab approval workflow (Stage 2)

**Components**:
```typescript
// components/features/admin/stats-card.tsx
<StatsCard
  title="Total Orders"
  value={totalOrders}
  change="+12% from last month"
  icon={<OrderIcon />}
/>

// components/features/admin/orders-table.tsx
<DataTable
  columns={orderColumns}
  data={orders}
  filters={['status', 'lab', 'dateRange']}
  sortable
/>

// components/features/admin/user-management.tsx
List users with role badges, change role dropdown
```

---

#### 3.2 Service Catalog Enhancements
**Priority**: MEDIUM
**Estimated**: 24 hours

Improve homepage service browsing:

**Add**:
- [ ] Category filter chips (Food Safety, Environmental, Chemical)
- [ ] Price range slider
- [ ] Location filter (city dropdown)
- [ ] Turnaround time filter
- [ ] Search by service/lab name
- [ ] Sort options (price, turnaround, newest)
- [ ] Pagination (20 per page)
- [ ] Service detail modal/page

**Components**:
```typescript
// components/features/services/service-filters.tsx
<FilterBar>
  <CategoryFilter />
  <PriceRangeFilter />
  <LocationFilter />
  <TurnaroundFilter />
</FilterBar>

// components/features/services/service-card.tsx
Enhance with:
- Lab name and location
- Category badge
- Price display
- Turnaround time
- "Request Test" CTA
- Lab certifications icons

// components/features/services/service-detail.tsx
Full service details page/modal:
- Complete description
- Lab info and location map (placeholder)
- Certifications
- Sample requirements
- Pricing breakdown
- Similar services
```

**API Enhancement**:
```typescript
// app/api/services/route.ts
Add query param filtering:
- ?category=food_safety
- ?minPrice=1000&maxPrice=5000
- ?city=manila
- ?maxTurnaround=7
- ?search=microbiology
- ?page=1&limit=20
```

---

#### 3.3 Lab Profile Management
**Priority**: MEDIUM
**Estimated**: 24 hours

Create lab profile pages:

**Routes**:
- `/dashboard/lab/profile` - View/edit lab profile
- `/dashboard/lab/services` - Manage services

**Features**:
- [ ] Lab profile form:
  - Name, description
  - Location (address fields)
  - Certifications (multi-select or tags)
  - Logo upload (mock in Stage 1)
- [ ] Service management:
  - Add new service form
  - Edit service details
  - Activate/deactivate services
  - Set pricing and turnaround
- [ ] Preview how lab appears to clients

**Components**:
```typescript
// components/features/labs/lab-profile-form.tsx
<Form {...form}>
  <Input name="name" label="Lab Name" />
  <Textarea name="description" />
  <LocationFields />
  <CertificationSelector />
  <Button type="submit">Save Profile</Button>
</Form>

// components/features/labs/service-management.tsx
<ServiceList>
  {services.map(service => (
    <ServiceItem
      key={service.id}
      service={service}
      onEdit={openEditDialog}
      onToggle={toggleActive}
    />
  ))}
  <AddServiceButton onClick={openAddDialog} />
</ServiceList>
```

---

#### 3.4 Mock File Upload Interface
**Priority**: HIGH (User-facing feature)
**Estimated**: 20 hours

Create file upload UI (generates mock URLs):

**Components**:
```typescript
// components/features/orders/file-uploader.tsx
export function FileUploader({ orderId, onComplete }: Props) {
  const [files, setFiles] = useState<File[]>([])

  const handleUpload = async () => {
    // Stage 1: Mock upload
    const mockAttachments = files.map((file, i) => ({
      fileName: file.name,
      fileUrl: `https://mock-storage.pipetgo.com/${orderId}/${i}.pdf`,
      fileType: file.type,
      fileSize: file.size,
      attachmentType: 'result'
    }))

    await fetch(`/api/orders/${orderId}/attachments`, {
      method: 'POST',
      body: JSON.stringify({ attachments: mockAttachments })
    })

    showSuccess('Results uploaded successfully!')
    onComplete()
  }

  return (
    <div className="border-2 border-dashed rounded-lg p-8">
      <input
        type="file"
        accept=".pdf,.xlsx,.jpg,.png"
        multiple
        onChange={e => setFiles(Array.from(e.target.files || []))}
      />
      <FileList files={files} onRemove={removeFile} />
      <Button onClick={handleUpload}>Upload Files</Button>
      <p className="text-sm text-gray-500 mt-2">
        Stage 1: Mock upload (no real file storage)
      </p>
    </div>
  )
}

// components/features/orders/attachment-list.tsx
Display uploaded files with download links (mock)
```

**API**:
```typescript
// app/api/orders/[id]/attachments/route.ts
POST - Create attachment records
GET - List attachments for order
```

---

### PHASE 4: Polish (Week 7-8, 120 hours)

#### 4.1 Mobile Responsiveness
**Priority**: HIGH
**Estimated**: 32 hours

Test and fix on mobile viewports:
- [ ] Homepage service grid (2 cols → 1 col)
- [ ] Dashboard layouts (sidebar → hamburger)
- [ ] Forms (stacked fields)
- [ ] Tables (horizontal scroll or cards)
- [ ] Modals (full-screen on mobile)
- [ ] Touch-friendly buttons and inputs

**Tailwind Breakpoints**:
```typescript
// Use responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
<Button className="w-full sm:w-auto">
<Card className="p-4 md:p-6">
```

---

#### 4.2 Authentication Polish
**Priority**: MEDIUM
**Estimated**: 16 hours

Improve auth experience:
- [ ] Custom signin page (replace NextAuth default)
- [ ] Custom signup page
- [ ] Better error messages
- [ ] "Remember me" functionality
- [ ] Redirect to intended page after login
- [ ] Session timeout warning
- [ ] Logout confirmation

**Create**:
```typescript
// app/auth/signin/page.tsx
Custom signin page with:
- Email input
- "New user? Sign up" link
- Better branding
- Error display
- Loading state

// app/auth/signup/page.tsx
Registration form with:
- Name, email inputs
- Role selection (client only for now)
- Terms acceptance checkbox
- Email verification notice
```

---

#### 4.3 Empty States & Onboarding
**Priority**: MEDIUM
**Estimated**: 16 hours

Add helpful empty states:

```typescript
// components/common/empty-state.tsx
<EmptyState
  icon={<OrderIcon />}
  title="No orders yet"
  description="Start by browsing our lab services and submitting a test request"
  action={<Button href="/services">Browse Services</Button>}
/>

// Apply to:
- Dashboard with no orders
- Lab with no services
- Search with no results
- Filtered list with no matches
```

**Onboarding**:
- [ ] Welcome modal on first login
- [ ] Dashboard tour (optional)
- [ ] Tooltips for key actions
- [ ] Help text in forms

---

#### 4.4 Performance Optimization
**Priority**: MEDIUM
**Estimated**: 24 hours

Optimize for speed:
- [ ] Add database indexes (already in schema)
- [ ] Implement pagination on large lists
- [ ] Use Next.js Image component for logos
- [ ] Lazy load dashboard components
- [ ] Optimize Prisma queries (select only needed fields)
- [ ] Add React Query for client-side caching
- [ ] Reduce bundle size (analyze with `next build --analyze`)

**Example Optimizations**:
```typescript
// Don't fetch all fields
const orders = await prisma.order.findMany({
  select: {
    id: true,
    status: true,
    createdAt: true,
    service: {
      select: { name: true, lab: { select: { name: true } } }
    }
  }
})

// Use pagination
const page = parseInt(searchParams.page || '1')
const limit = 20
const skip = (page - 1) * limit

const [orders, total] = await Promise.all([
  prisma.order.findMany({ skip, take: limit }),
  prisma.order.count()
])
```

---

#### 4.5 Testing & Bug Fixes
**Priority**: HIGH
**Estimated**: 32 hours

Manual testing checklist:
- [ ] Complete user flows (client, lab, admin)
- [ ] Test all forms with validation errors
- [ ] Test edge cases (empty lists, errors, slow network)
- [ ] Test role-based access
- [ ] Test status transitions
- [ ] Test mobile responsiveness
- [ ] Browser compatibility (Chrome, Safari, Firefox)
- [ ] Fix all console errors/warnings

**Automated Testing** (Optional, Stage 2):
- Unit tests for utilities
- Integration tests for API routes
- E2E tests with Playwright

---

## Implementation Strategy

### Daily Workflow
1. **Morning**: Pick highest priority incomplete item
2. **Build**: Implement component/feature
3. **Test**: Manual testing in browser
4. **Commit**: Small, atomic commits with clear messages
5. **Document**: Update this roadmap with ✅

### Code Quality Checklist
- [ ] TypeScript strict mode (no `any` types)
- [ ] ESLint passing with no warnings
- [ ] Consistent code style (Prettier)
- [ ] Meaningful variable names
- [ ] Comments for complex logic
- [ ] Error handling in all async functions
- [ ] Loading states for all data fetching
- [ ] Responsive design tested

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/order-submission-flow

# Make changes, commit frequently
git add .
git commit -m "feat: add order submission form with validation"

# Push when feature complete
git push origin feature/order-submission-flow

# Create PR for review (or merge to main if solo)
```

---

## Success Criteria

**MVP is complete when**:
- [x] Database schema deployed
- [ ] User can sign up/in
- [ ] User can browse services
- [ ] Client can submit order request
- [ ] Lab admin can update order status
- [ ] Lab admin can upload mock results
- [ ] Client can view results
- [ ] Admin can see platform overview
- [ ] Mobile responsive
- [ ] No critical bugs
- [ ] Deployable to Vercel

**Total Estimated Hours**: ~420 hours over 8 weeks
**Suggested Pace**: 50-60 hours/week for 8 weeks OR 25-30 hours/week for 16 weeks

---

## Quick Wins to Start

Pick one of these to build momentum:

### Option A: Toast System (8 hours)
Port from ParkBoard, immediate UX improvement

### Option B: Complete UI Kit (24 hours)
Unlock all other feature development

### Option C: Order Form (48 hours)
Core user journey, high impact

---

**Next Action**: Choose which phase/component to start with based on your priorities and time availability. Update this document as you complete items!

**Last Updated**: 2025-09-30