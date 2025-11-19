# PipetGo! Improvement Laundry List
**Generated**: 2025-11-19
**Token Budget**: $77 remaining
**Strategy**: Non-breaking improvements + technical debt resolution

---

## 🔴 PRIORITY 1: TECHNICAL DEBT (Fix ASAP)

### TD-1: Add Tests for Analytics API ⚠️ CRITICAL
**Priority**: P0 (No tests for production API)
**Time**: 1.5 hours
**Effort**: Medium
**Risk**: High (untested business logic)

**Why**: `/api/analytics` endpoint has complex calculations but zero tests. Revenue calculations, quote metrics, and top services logic are untested.

**Tasks**:
1. Create `tests/api/analytics/route.test.ts`
2. Test revenue calculations (monthly breakdown, growth %)
3. Test quote metrics (acceptance rate, avg price)
4. Test order volume aggregation
5. Test top services sorting
6. Test timeframe filters (last30days, last90days, thisYear, allTime)
7. Test authorization (LAB_ADMIN only)
8. Test ownership verification (lab.ownerId === user.id)

**Acceptance Criteria**:
- ✅ Minimum 15 test cases
- ✅ 100% code coverage for analytics route
- ✅ All edge cases covered (empty data, single order, etc.)

---

### TD-2: Fix TypeScript `any` Types 🔧
**Priority**: P1 (Type safety issues)
**Time**: 1 hour
**Effort**: Low
**Risk**: Medium (runtime type errors possible)

**Why**: 21 files use `any` type, defeating TypeScript's type safety. This can lead to runtime errors that TypeScript should catch.

**Files to Fix** (sample):
- `src/app/dashboard/lab/analytics/components/RevenueChart.tsx` - Recharts tooltip props
- `src/app/dashboard/lab/analytics/components/OrderVolumeChart.tsx` - Recharts tooltip props
- `src/app/api/analytics/route.ts` - Helper function parameters
- `src/app/dashboard/lab/services/components/CreateServiceModal.tsx` - Error handling

**Pattern**:
```typescript
// ❌ BEFORE
function CustomTooltip({ active, payload }: any) {

// ✅ AFTER
interface TooltipProps {
  active?: boolean
  payload?: Array<{
    payload: {
      month: string
      revenue: number
      orderCount: number
    }
  }>
}
function CustomTooltip({ active, payload }: TooltipProps) {
```

**Acceptance Criteria**:
- ✅ Zero `any` types in src/ directory (except test files)
- ✅ TypeScript strict mode passes
- ✅ All tests still passing

---

### TD-3: Add React Error Boundaries 🛡️
**Priority**: P1 (Production resilience)
**Time**: 30 minutes
**Effort**: Low
**Risk**: Medium (unhandled errors crash entire app)

**Why**: Currently, any unhandled error in React components crashes the entire app. Error boundaries provide graceful degradation.

**Implementation**:
1. Create `src/components/ErrorBoundary.tsx`
2. Wrap analytics dashboard in error boundary
3. Wrap service management in error boundary
4. Add fallback UI with "Something went wrong" message
5. Log errors to console (or future error tracking service)

**Pattern**:
```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <AnalyticsPage />
</ErrorBoundary>
```

**Acceptance Criteria**:
- ✅ Error boundary component created
- ✅ Applied to all dashboard pages
- ✅ Fallback UI displays on error
- ✅ Errors logged to console

---

### TD-4: Implement Password Authentication 🔐
**Priority**: P2 (Security enhancement)
**Time**: 2 hours
**Effort**: Medium
**Risk**: Low (well-documented pattern)

**Why**: Current email-only auth is MVP simplification. Production needs password authentication. Multiple TODOs in `src/lib/auth.ts` mark this.

**Tasks**:
1. Add `passwordHash` field to User model (Prisma migration)
2. Implement password hashing with bcrypt
3. Update sign-in validation schema
4. Add password input to sign-in form
5. Add password validation to CredentialsProvider
6. Add password reset flow (optional, can defer)

**Acceptance Criteria**:
- ✅ Users can sign in with email + password
- ✅ Passwords hashed with bcrypt (cost factor 10)
- ✅ Backward compatible (existing users can still sign in via email until they set password)
- ✅ Tests for password validation

---

### TD-5: Add Pagination to Service Table 📄
**Priority**: P2 (Performance/UX)
**Time**: 1 hour
**Effort**: Low
**Risk**: Low (standard pattern)

**Why**: Service table loads all services at once. A lab with 100+ services will have slow load times and poor UX.

**Implementation**:
1. Add pagination to GET `/api/services` endpoint
2. Add `page` and `limit` query parameters
3. Return pagination metadata (total, page, limit, hasMore)
4. Add pagination UI to ServiceTable component
5. Use shadcn/ui Pagination component

**Pattern**:
```typescript
// API: GET /api/services?page=1&limit=20
{
  services: [...],
  pagination: {
    total: 150,
    page: 1,
    limit: 20,
    totalPages: 8,
    hasMore: true
  }
}
```

**Acceptance Criteria**:
- ✅ Pagination works (page 1, 2, 3, etc.)
- ✅ Default limit: 20 services per page
- ✅ Pagination UI displays correctly
- ✅ Loading state during page change

---

### TD-6: Implement Notification System 📬
**Priority**: P2 (Business critical)
**Time**: 2.5 hours
**Effort**: High
**Risk**: Medium (new feature)

**Why**: Multiple TODOs mention notifications. Clients need to know when quotes are ready, lab admins need to know about new RFQs.

**Tasks**:
1. Create Notification model (Prisma schema)
2. Create POST `/api/notifications` endpoint
3. Create GET `/api/notifications` endpoint (user's notifications)
4. Create notification service (createNotification helper)
5. Add notification creation to quote routes
6. Add notification bell icon to dashboard header
7. Add notification dropdown with unread count

**Notification Model**:
```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // 'NEW_RFQ', 'QUOTE_PROVIDED', 'QUOTE_APPROVED'
  title     String
  message   String
  read      Boolean  @default(false)
  orderId   String?
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
  order     Order?   @relation(fields: [orderId], references: [id])
}
```

**Acceptance Criteria**:
- ✅ Notifications created when quote provided
- ✅ Notifications created when quote approved
- ✅ Notifications created when new RFQ submitted
- ✅ Notification bell shows unread count
- ✅ Notifications marked as read when clicked

---

## 🟡 PRIORITY 2: NICE-TO-HAVE FEATURES (Non-Breaking)

### NTH-1: Search & Filter on Services ��
**Priority**: P3 (UX improvement)
**Time**: 1 hour
**Effort**: Low
**Risk**: Low

**Why**: Lab admins with 50+ services need to quickly find specific services.

**Implementation**:
1. Add search input above service table
2. Add category filter dropdown
3. Add pricing mode filter
4. Add active/inactive filter
5. Implement debounced search (300ms delay)
6. Update GET `/api/services` to accept filters

**Acceptance Criteria**:
- ✅ Search by service name (debounced)
- ✅ Filter by category
- ✅ Filter by pricing mode
- ✅ Filter by active status
- ✅ Filters can be combined

---

### NTH-2: Export Analytics to CSV 📊
**Priority**: P3 (Business value)
**Time**: 45 minutes
**Effort**: Low
**Risk**: Low

**Why**: Lab admins want to analyze data in Excel/Google Sheets.

**Implementation**:
1. Add "Export CSV" button to analytics dashboard
2. Create utility function to convert analytics data to CSV
3. Trigger download on button click
4. Include: revenue breakdown, top services, monthly orders

**CSV Format**:
```csv
Month,Revenue,Orders
2024-01,125000,15
2024-02,145000,18
...
```

**Acceptance Criteria**:
- ✅ Button exports current timeframe data
- ✅ CSV downloads with proper filename (analytics-2024-11-19.csv)
- ✅ All metrics included (revenue, orders, top services)

---

### NTH-3: Dashboard Home Page 🏠
**Priority**: P3 (UX improvement)
**Time**: 1.5 hours
**Effort**: Medium
**Risk**: Low

**Why**: Lab admin dashboard currently redirects to orders. A home page with quick stats provides better overview.

**Implementation**:
1. Create `/dashboard/lab` page with overview
2. Show quick stats cards (total services, pending quotes, monthly revenue)
3. Show recent orders (last 5)
4. Show pending actions (quotes to provide, orders to acknowledge)
5. Link to detailed pages (services, analytics, orders)

**Layout**:
```
┌─────────────────────────────────────────┐
│ [Services: 25] [Pending: 3] [Revenue]  │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ Recent Orders (Last 5)                  │
│ [Order 1] [Order 2] [Order 3]          │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ Pending Actions                         │
│ • 3 quotes to provide                   │
│ • 2 orders to acknowledge               │
└─────────────────────────────────────────┘
```

**Acceptance Criteria**:
- ✅ Home page displays at `/dashboard/lab`
- ✅ Quick stats cards show real-time data
- ✅ Recent orders list displays
- ✅ Pending actions list displays
- ✅ Links to detailed pages work

---

### NTH-4: Service Templates 📋
**Priority**: P4 (Time saver)
**Time**: 1.5 hours
**Effort**: Medium
**Risk**: Low

**Why**: Many labs offer similar services (e.g., "Water pH Testing"). Templates speed up service creation.

**Implementation**:
1. Create ServiceTemplate model (Prisma)
2. Pre-populate templates for common lab tests
3. Add "Use Template" button to create service modal
4. Modal shows template list with preview
5. Selecting template pre-fills form

**Common Templates**:
- Water pH Testing (Environmental Testing, ₱500)
- Microbiological Plate Count (Microbiological Testing, ₱1,200)
- Heavy Metals Analysis (Chemical Analysis, ₱2,500)
- E. coli Detection (Food Safety, ₱800)

**Acceptance Criteria**:
- ✅ Templates available in create modal
- ✅ Selecting template pre-fills form
- ✅ Templates can be customized before saving
- ✅ 10+ templates available

---

### NTH-5: Dark Mode Support 🌙
**Priority**: P4 (User preference)
**Time**: 2 hours
**Effort**: Medium
**Risk**: Low

**Why**: Many users prefer dark mode for reduced eye strain. Modern expectation.

**Implementation**:
1. Install `next-themes` for theme management
2. Add theme toggle to header
3. Update Tailwind config for dark mode
4. Add dark mode classes to all components
5. Store theme preference in localStorage

**Pattern**:
```typescript
// Tailwind class
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-gray-100">Text</p>
</div>
```

**Acceptance Criteria**:
- ✅ Theme toggle in header
- ✅ All pages support dark mode
- ✅ Charts readable in dark mode
- ✅ Theme preference persists across sessions

---

### NTH-6: Keyboard Shortcuts ⌨️
**Priority**: P4 (Power user feature)
**Time**: 1 hour
**Effort**: Low
**Risk**: Low

**Why**: Power users want keyboard shortcuts for common actions.

**Shortcuts**:
- `Ctrl+K` or `Cmd+K`: Open command palette (search services)
- `Ctrl+N` or `Cmd+N`: Create new service
- `Ctrl+/` or `Cmd+/`: Show keyboard shortcuts help
- `Escape`: Close modals
- `Tab`: Navigate form fields

**Implementation**:
1. Install `react-hotkeys-hook` or similar
2. Add keyboard listener to dashboard layout
3. Create shortcuts help modal
4. Add visual indicators (tooltips showing shortcuts)

**Acceptance Criteria**:
- ✅ Keyboard shortcuts work
- ✅ Help modal shows all shortcuts
- ✅ Tooltips show keyboard shortcuts
- ✅ No conflicts with browser shortcuts

---

### NTH-7: Recent Activity Feed 📰
**Priority**: P4 (Visibility)
**Time**: 1.5 hours
**Effort**: Medium
**Risk**: Low

**Why**: Lab admins want to see recent activity at a glance.

**Implementation**:
1. Create Activity model (Prisma)
2. Log activities (service created, quote provided, order completed)
3. Create GET `/api/activities` endpoint
4. Add activity feed to dashboard home page
5. Show last 10 activities with timestamps

**Activity Types**:
- "Service created: Water pH Testing"
- "Quote provided for Order #123"
- "Order #456 completed"
- "Service edited: E. coli Detection"

**Acceptance Criteria**:
- ✅ Activities logged automatically
- ✅ Activity feed displays on home page
- ✅ Shows last 10 activities
- ✅ Real-time updates (or refresh on load)

---

### NTH-8: Improved Empty States 🎨
**Priority**: P4 (UX polish)
**Time**: 30 minutes
**Effort**: Low
**Risk**: Low

**Why**: Current empty states are basic. Better empty states guide users to take action.

**Improvements**:
1. Add illustrations to empty states (use Undraw or similar)
2. Add call-to-action buttons
3. Add helpful tips ("Why create services?")
4. Make empty states visually appealing

**Pattern**:
```typescript
<EmptyState
  illustration={<ServiceIllustration />}
  title="No services yet"
  description="Services are the foundation of your lab's offerings. Create your first service to start receiving quote requests."
  action={<Button onClick={openModal}>Create Service</Button>}
  tips={[
    "Tip: Start with your most popular tests",
    "Tip: Use HYBRID mode to offer both fixed and custom pricing"
  ]}
/>
```

**Acceptance Criteria**:
- ✅ Empty states have illustrations
- ✅ Empty states have CTAs
- ✅ Empty states provide helpful tips
- ✅ Visual design consistent

---

### NTH-9: Service Import/Export (Bulk Upload) 📤
**Priority**: P4 (Time saver for new labs)
**Time**: 2 hours
**Effort**: High
**Risk**: Medium

**Why**: Labs with many services want to bulk upload via CSV instead of creating one-by-one.

**Implementation**:
1. Add "Import Services" button to services page
2. CSV format: name, category, pricingMode, pricePerUnit, turnaroundDays, description
3. Parse CSV with papaparse
4. Validate each row with Zod
5. Show preview before import
6. Bulk create services via API
7. Add "Export Services" to download current services as CSV

**CSV Format**:
```csv
name,category,pricingMode,pricePerUnit,turnaroundDays,description
Water pH Testing,Environmental Testing,FIXED,500,3,Basic pH analysis
E. coli Detection,Food Safety,HYBRID,800,5,Standard E. coli screening
```

**Acceptance Criteria**:
- ✅ Import CSV button available
- ✅ CSV validation with error messages
- ✅ Preview shows before import
- ✅ Bulk import creates services
- ✅ Export CSV downloads current services

---

### NTH-10: Analytics Caching 🚀
**Priority**: P4 (Performance)
**Time**: 1 hour
**Effort**: Low
**Risk**: Low

**Why**: Analytics calculations are expensive. Caching improves response time from ~200ms to ~20ms.

**Implementation**:
1. Add cache layer (Redis or in-memory cache)
2. Cache analytics data with TTL (5 minutes)
3. Invalidate cache when new order completed
4. Add cache headers to API response

**Pattern**:
```typescript
// Check cache first
const cacheKey = `analytics:${labId}:${timeframe}`
const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)

// Calculate analytics
const analytics = calculateAnalytics(...)

// Cache for 5 minutes
await redis.setex(cacheKey, 300, JSON.stringify(analytics))
```

**Acceptance Criteria**:
- ✅ Analytics cached for 5 minutes
- ✅ Cache invalidated on new completed order
- ✅ Response time improved (measure with benchmarks)
- ✅ Cache headers set correctly

---

## 📊 SUMMARY & RECOMMENDATIONS

### Time Estimates
| Category | Tasks | Total Time |
|----------|-------|------------|
| **Technical Debt (P0-P2)** | 6 tasks | ~10 hours |
| **Nice-to-Have (P3-P4)** | 10 tasks | ~13 hours |
| **TOTAL** | 16 tasks | ~23 hours |

### Budget Allocation ($77 / ~2.5 hours)
With $77 remaining, you can tackle approximately **2.5 hours of work**. Here's my recommendation:

**Option A: Focus on Critical Technical Debt (Recommended)**
1. ✅ **TD-1: Analytics API Tests** (1.5 hours) - CRITICAL
2. ✅ **TD-2: Fix TypeScript `any`** (1 hour) - HIGH VALUE

**Total**: 2.5 hours, addresses critical technical debt

**Option B: Quick Wins for User Delight**
1. ✅ **TD-3: Error Boundaries** (30 mins) - PRODUCTION SAFETY
2. ✅ **NTH-1: Search & Filter** (1 hour) - HIGH UX VALUE
3. ✅ **NTH-2: Export CSV** (45 mins) - BUSINESS VALUE

**Total**: 2.25 hours, visible improvements for users

**Option C: Balance (Debt + Features)**
1. ✅ **TD-1: Analytics API Tests** (1.5 hours) - CRITICAL
2. ✅ **TD-3: Error Boundaries** (30 mins) - SAFETY
3. ✅ **NTH-2: Export CSV** (45 mins) - QUICK WIN

**Total**: 2.75 hours, balanced approach

---

## 🎯 MY RECOMMENDATION

**Execute Option A** - Focus on technical debt:
1. **Analytics API Tests** (TD-1) - Absolutely critical, untested business logic
2. **Fix TypeScript `any` Types** (TD-2) - Type safety prevents runtime errors

**Why**: These are foundational quality issues that could cause production bugs. Better to fix now before users encounter issues during UAT.

**Alternative**: If you want visible user-facing improvements for UAT, choose **Option B** for quick wins that users will notice and appreciate.

---

## 🚀 NEXT STEPS

**Choose your option** (A, B, or C), and I'll:
1. Create TodoWrite tasks for selected items
2. Delegate to specialized agents (@agent-developer, @agent-quality-reviewer)
3. Implement incrementally (5-20 line changes at a time)
4. Validate each change with tests
5. Commit progressively

Which option would you like to execute?
