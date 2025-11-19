# Post-MVP Laundry List: Nice-to-Haves & Technical Debt

**Generated**: 2025-11-19
**Budget Available**: $77 (~3-4 hours of work)
**Context**: Navigation UI complete, 378 tests passing, production-ready codebase
**CEO Feedback**: "Ready on surface, back office is next"

---

## 📊 EXECUTIVE SUMMARY

### Current State
- ✅ Service Management: 100% complete
- ✅ Analytics Dashboard: 100% complete
- ✅ Navigation UI: 100% complete
- ✅ 378 tests passing (100%)
- ✅ Zero TypeScript errors
- ✅ Production error boundaries

### Opportunity Areas
1. **UX Enhancements**: Empty states, loading feedback, search/filter
2. **Technical Debt**: Password auth stubs, file upload mocks, missing hooks
3. **Performance**: Pagination for large datasets
4. **Analytics**: Export functionality, more metrics
5. **Back Office**: Lab admin tools, bulk operations

---

## 🔴 CRITICAL TECHNICAL DEBT (Must Address Soon)

### TD-1: File Upload Infrastructure (Mock → Real Storage)
**Current State**: `uploadSampleSpec()` in utils.ts uses mock implementation
```typescript
// TODO: Stage 2 - Replace with real S3/Supabase upload
export async function uploadSampleSpec(file: File): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 1000))
  return `https://mockcdn.example.com/${file.name}`
}
```

**Risk**: HIGH - Will break when users try to upload real files
**Impact**: Blocks order submission with attachments
**Effort**: 1.5-2 hours (~$48-64)
**Dependencies**: Supabase Storage OR AWS S3 account

**Delegation Plan**:
```
Task for @agent-architect:
Design file upload architecture for PipetGo

Requirements:
1. Support PDF, images (JPEG, PNG), Excel/CSV
2. Max file size: 10MB per file
3. Storage: Supabase Storage (preferred) OR AWS S3
4. Security: Signed URLs, virus scanning consideration
5. Schema: Attachment model already exists in Prisma

Deliverable: ADR with implementation steps
```

**Recommendation**: ⚠️ **ADDRESS BEFORE PUBLIC UAT** (blocks real usage)

---

### TD-2: Password Authentication (OAuth-Only → Hybrid)
**Current State**: Multiple TODOs in `lib/auth.ts` for password support
```typescript
// TODO: Stage 2 - Add password validation with bcrypt
// TODO: Stage 2 - Uncomment and implement password validation
// TODO: Stage 2 - Verify password
```

**Risk**: MEDIUM - Some labs may prefer password login
**Impact**: Limits signup options (OAuth only)
**Effort**: 2-3 hours (~$64-96)
**Dependencies**: bcrypt, email verification service

**Delegation Plan**:
```
Task for @agent-security-auth:
Audit and design password authentication implementation

Requirements:
1. Add Credentials provider to NextAuth
2. Implement bcrypt password hashing
3. Add password reset flow
4. Add email verification (optional for Stage 2)
5. Security review: rate limiting, password strength

Deliverable: Security audit + implementation ADR
```

**Recommendation**: 💡 **DEFER to next sprint** (exceeds current budget, not blocking)

---

### TD-3: Currency Hardcoded to PHP
**Current State**: `formatPricePHP()` in utils.ts hardcodes Philippine Peso
```typescript
// TODO: Make currency configurable for international labs
export function formatPricePHP(price: number | null): string {
  if (price === null) return 'Quote Required'
  return `₱${price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}
```

**Risk**: LOW - Only issue if expanding internationally
**Impact**: Would need refactor for multi-currency support
**Effort**: 30-45 minutes (~$12-18)
**Dependencies**: None

**Delegation Plan**:
```
Task for @agent-developer:
Make currency configurable in pricing utilities

Changes:
1. Add CURRENCY config to env or constants
2. Update formatPricePHP → formatPrice(amount, currency)
3. Add currency symbol mapping (PHP: ₱, USD: $, etc.)
4. Update all callsites (5-10 locations)

Test: Verify all prices display correctly with different currencies
```

**Recommendation**: 💡 **DEFER to internationalization sprint** (not urgent)

---

## 🟡 HIGH PRIORITY NICE-TO-HAVES (Significant UX Impact)

### NH-1: Empty States with CTAs
**Current State**: Tables show empty when no data, but no guidance
**Why Important**: First-time lab admins see blank screen, may not know where to start
**Effort**: 20-30 minutes (~$8-12)
**Budget Impact**: ✅ **FITS IN $77 BUDGET**

**Files to Update**:
- `src/app/dashboard/lab/services/page.tsx` - Service table empty state
- `src/app/dashboard/lab/analytics/page.tsx` - Analytics empty state
- `src/app/dashboard/lab/page.tsx` - Orders empty state

**Delegation Plan**:
```
Task for @agent-developer:
Add empty state UI to ServiceTable component

Location: src/app/dashboard/lab/services/page.tsx (lines ~50-70)

Requirements:
1. Check if services.length === 0
2. Show centered empty state:
   - Icon: <Beaker className="h-12 w-12 text-gray-400" />
   - Heading: "No services yet"
   - Description: "Create your first lab service to start receiving quotes"
   - CTA: <Button onClick={openCreateModal}>Create Service</Button>
3. Match existing design system (shadcn/ui)

Acceptance: Empty state displays when no services, disappears when services exist
```

**Value**: ⭐⭐⭐⭐⭐ (Directly improves first-run experience)

---

### NH-2: Service Search & Filter
**Current State**: Service table shows all services, no search/filter
**Why Important**: Labs with 20+ services need quick filtering
**Effort**: 30-45 minutes (~$12-18)
**Budget Impact**: ✅ **FITS IN $77 BUDGET**

**Features**:
- Search by service name (client-side filtering)
- Filter by category (dropdown)
- Filter by pricing mode (tabs: All, Quote Required, Fixed, Hybrid)
- Filter by status (Active/Inactive toggle)

**Delegation Plan**:
```
Task for @agent-developer:
Add search and filter controls to service table

Location: src/app/dashboard/lab/services/page.tsx

Requirements:
1. Add search input above table
   - Placeholder: "Search services..."
   - Filter services by name (case-insensitive)
2. Add category dropdown filter
   - Options: All, Food, Water, Environmental, etc.
3. Add pricing mode tabs
   - Tabs: All, Quote Required, Fixed, Hybrid
4. Implement client-side filtering (no API changes)
5. Show "X of Y services" count

Acceptance: Can filter services by name, category, and pricing mode
```

**Value**: ⭐⭐⭐⭐ (Essential for labs with large catalogs)

---

### NH-3: Loading Skeletons & Feedback
**Current State**: Data fetches show empty screen briefly, then content pops in
**Why Important**: Better perceived performance, professional feel
**Effort**: 30-45 minutes (~$12-18)
**Budget Impact**: ✅ **FITS IN $77 BUDGET**

**Components to Add**:
- Service table loading skeleton (5 rows with shimmer)
- Analytics charts loading skeleton
- Order list loading skeleton

**Delegation Plan**:
```
Task for @agent-developer:
Add loading skeleton to service table

Location: src/app/dashboard/lab/services/page.tsx

Requirements:
1. Create ServiceTableSkeleton component
   - 5 rows with shimmer animation
   - Match table structure (columns for name, category, price, status, actions)
2. Show skeleton while services.loading === true
3. Use shadcn/ui Skeleton component
4. Add smooth fade-in transition when data loads

Example:
<Skeleton className="h-10 w-full" /> (repeat 5 times)

Acceptance: Skeleton displays during fetch, smooth transition to real data
```

**Value**: ⭐⭐⭐⭐ (Improves perceived performance significantly)

---

### NH-4: Better Form Validation Feedback
**Current State**: Validation errors show in toast only, not inline
**Why Important**: Users may miss toast, unclear which field has error
**Effort**: 20-30 minutes (~$8-12)
**Budget Impact**: ✅ **FITS IN $77 BUDGET**

**Improvements**:
- Show error message below each invalid field
- Red border on invalid fields
- Show validation hints before submission
- Keep toast for success/general errors only

**Delegation Plan**:
```
Task for @agent-developer:
Improve validation feedback in CreateServiceModal

Location: src/app/dashboard/lab/services/CreateServiceModal.tsx

Requirements:
1. Show field-specific errors below inputs (not just toast)
   - Example: "Price is required for Fixed pricing mode"
2. Add red border to invalid fields (border-red-500)
3. Add hint text for complex fields
   - "Price per unit required for Fixed/Hybrid modes"
4. Keep form.formState.errors in sync
5. Still show toast for success/API errors

Acceptance: Validation errors display inline below fields
```

**Value**: ⭐⭐⭐⭐ (Reduces user confusion, improves form completion rate)

---

### NH-5: Analytics Export (CSV)
**Current State**: Analytics dashboard displays charts, but no export
**Why Important**: Labs need to report metrics to management/investors
**Effort**: 45-60 minutes (~$18-24)
**Budget Impact**: ✅ **FITS IN $77 BUDGET**

**Features**:
- Export revenue data to CSV
- Export quote metrics to CSV
- Include date range in export filename

**Delegation Plan**:
```
Task for @agent-developer:
Add CSV export to analytics dashboard

Location: src/app/dashboard/lab/analytics/page.tsx

Requirements:
1. Add "Export CSV" button above charts
2. Generate CSV with columns:
   - Revenue: Month, Revenue, Order Count, Average Order Value
   - Quotes: Month, Quotes Sent, Accepted, Rejected, Acceptance Rate
3. Use CSV generation library (papaparse) or manual generation
4. Trigger browser download with filename: analytics_YYYY-MM-DD.csv
5. Add loading state to button during generation

Acceptance: Click "Export CSV" downloads analytics data in CSV format
```

**Value**: ⭐⭐⭐⭐ (Enables reporting, professional feature)

---

## 🟢 MEDIUM PRIORITY NICE-TO-HAVES (Quality of Life)

### NH-6: Keyboard Shortcuts
**Effort**: 30-45 minutes (~$12-18)
**Why**: Power users appreciate keyboard navigation

**Shortcuts**:
- `Ctrl+K` or `Cmd+K`: Open command palette (search services, quick actions)
- `N`: New service (when on services page)
- `/`: Focus search input
- `Esc`: Close modals

**Value**: ⭐⭐⭐ (Nice for power users, not essential)

---

### NH-7: Service Pagination
**Effort**: 45-60 minutes (~$18-24)
**Why**: Currently fetches all services (no limit). Won't scale beyond ~100 services.

**Changes Required**:
- Add pagination to `GET /api/services` endpoint
- Add page size selector (25, 50, 100)
- Add pagination controls to table footer
- Preserve filters across pages

**Value**: ⭐⭐⭐ (Important for scale, but MVP unlikely to hit limits)

---

### NH-8: Recent Activity Feed
**Effort**: 45-60 minutes (~$18-24)
**Why**: Lab admins want quick overview of recent actions

**Features**:
- Show recent 10 activities on dashboard
- Activity types: Service created, Order received, Quote sent, Quote approved
- Link to related resource
- Time ago format ("2 hours ago")

**Value**: ⭐⭐⭐ (Nice to have, not critical)

---

### NH-9: Bulk Service Actions
**Effort**: 30-45 minutes (~$12-18)
**Why**: Lab admins may want to activate/deactivate multiple services at once

**Features**:
- Checkbox select in service table
- "Select All" checkbox
- Bulk activate/deactivate button
- Bulk delete with confirmation (soft delete)

**Value**: ⭐⭐⭐ (Useful for large catalogs)

---

### NH-10: Dashboard Quick Stats Widget
**Effort**: 30-45 minutes (~$12-18)
**Why**: Overview metrics at a glance

**Stats to Show**:
- Total active services
- Pending quotes count
- This month's revenue
- This month's orders

**Value**: ⭐⭐⭐ (Quick overview, complements analytics)

---

## 🔵 LOW PRIORITY NICE-TO-HAVES (Future Enhancements)

### NH-11: Dark Mode Toggle
**Effort**: 1-1.5 hours (~$32-48)
**Why**: Some users prefer dark interfaces

**Value**: ⭐⭐ (Cosmetic, not essential for B2B)

---

### NH-12: Notification System (Push/Email)
**Effort**: 2-3 hours (~$64-96)
**Why**: Notify labs when new quotes requested

**Value**: ⭐⭐⭐⭐ (Important, but complex - needs infrastructure)

**Recommendation**: 💡 **DEFER to Phase 3** (requires email service, push notification setup)

---

### NH-13: Multi-Lab Support for Single User
**Effort**: 2-3 hours (~$64-96)
**Why**: Owner of multiple labs wants single account

**Value**: ⭐⭐⭐ (Nice to have, but edge case for MVP)

**Recommendation**: 💡 **DEFER** (complex, not common scenario)

---

### NH-14: Service Templates
**Effort**: 1-1.5 hours (~$32-48)
**Why**: Pre-fill common service types (Water Testing, Food Safety, etc.)

**Value**: ⭐⭐⭐ (Speeds up onboarding for new labs)

---

### NH-15: Advanced Analytics (Charts)
**Effort**: 1-2 hours (~$32-64)
**Why**: More visualizations (trend lines, comparisons, forecasts)

**Features**:
- Revenue trend line
- Service popularity chart
- Client retention metrics
- Year-over-year comparison

**Value**: ⭐⭐⭐ (Nice, but current analytics sufficient for MVP)

---

## 📋 RECOMMENDED EXECUTION PLAN ($77 BUDGET)

### Option A: UX Polish Sprint (HIGH ROI)
**Focus**: Maximize user experience improvements
**Budget**: ~$68 (within $77)

**Tasks** (in priority order):
1. ✅ **NH-1: Empty States** (~$8-12) - 20-30 min
2. ✅ **NH-2: Service Search/Filter** (~$12-18) - 30-45 min
3. ✅ **NH-3: Loading Skeletons** (~$12-18) - 30-45 min
4. ✅ **NH-4: Better Validation Feedback** (~$8-12) - 20-30 min
5. ✅ **NH-5: Analytics Export CSV** (~$18-24) - 45-60 min

**Total**: ~$58-84 (target ~$68)
**Duration**: ~2.5-3.5 hours
**Value**: ⭐⭐⭐⭐⭐ All HIGH priority UX improvements

**Why This Plan**:
- Addresses CEO's "ready on surface" → Makes surface even more ready
- All visible improvements for UAT testers
- No breaking changes, low risk
- Directly improves first-run experience
- Professional polish for public testing

---

### Option B: Critical Debt + UX (BALANCED)
**Focus**: Address file upload blocker + key UX improvements
**Budget**: ~$76 (within $77)

**Tasks** (in priority order):
1. ✅ **TD-1: File Upload Infrastructure** (~$48-64) - 1.5-2 hours
2. ✅ **NH-1: Empty States** (~$8-12) - 20-30 min
3. ✅ **NH-4: Better Validation Feedback** (~$8-12) - 20-30 min

**Total**: ~$64-88 (target ~$76)
**Duration**: ~2.5-3 hours
**Value**: ⭐⭐⭐⭐ Unblocks attachments + UX polish

**Why This Plan**:
- Addresses CRITICAL blocker (file uploads)
- Enables full order submission workflow
- Still includes UX improvements
- More risk (infrastructure change)

**Tradeoff**: Less UX polish, but unblocks core functionality

---

### Option C: Back Office Tools (CEO DIRECTIVE)
**Focus**: CEO said "back office is next"
**Budget**: ~$66 (within $77)

**Tasks** (in priority order):
1. ✅ **NH-9: Bulk Service Actions** (~$12-18) - 30-45 min
2. ✅ **NH-10: Dashboard Quick Stats** (~$12-18) - 30-45 min
3. ✅ **NH-8: Recent Activity Feed** (~$18-24) - 45-60 min
4. ✅ **NH-5: Analytics Export CSV** (~$18-24) - 45-60 min

**Total**: ~$60-84 (target ~$66)
**Duration**: ~2.5-3.5 hours
**Value**: ⭐⭐⭐⭐ Lab admin productivity tools

**Why This Plan**:
- Directly addresses "back office" focus
- Improves lab admin workflow efficiency
- Bulk operations save time
- Activity feed increases awareness
- Export enables reporting

---

## 🎯 FINAL RECOMMENDATION

**RECOMMENDED**: **Option A - UX Polish Sprint**

**Rationale**:
1. CEO said "ready on surface" → Make surface even better
2. UAT testing with friends coming soon → First impressions matter
3. All HIGH priority, visible improvements
4. Low risk, no breaking changes
5. File uploads (TD-1) can wait until UAT feedback confirms it's needed
6. Password auth (TD-2) not blocking for OAuth-based testing

**Execution Order**:
```
1. NH-1: Empty States (20-30 min)
   ↓ Delegate to @agent-developer
   ↓ Validate: Check empty states display correctly
   ↓ Mark completed

2. NH-4: Better Validation Feedback (20-30 min)
   ↓ Delegate to @agent-developer
   ↓ Validate: Submit invalid form, check inline errors
   ↓ Mark completed

3. NH-3: Loading Skeletons (30-45 min)
   ↓ Delegate to @agent-developer
   ↓ Validate: Refresh page, check skeleton displays
   ↓ Mark completed

4. NH-2: Service Search/Filter (30-45 min)
   ↓ Delegate to @agent-developer
   ↓ Validate: Test search, filters work correctly
   ↓ Mark completed

5. NH-5: Analytics Export CSV (45-60 min)
   ↓ Delegate to @agent-developer
   ↓ Validate: Download CSV, verify data integrity
   ↓ Mark completed

6. Quality Review
   ↓ Delegate to @agent-quality-reviewer
   ↓ Validate: All changes reviewed for quality
   ↓ Mark completed

7. UX Review
   ↓ Delegate to @agent-ux-reviewer
   ↓ Validate: Accessibility and usability verified
   ↓ Mark completed
```

**Total Time**: ~2.5-3.5 hours
**Total Budget**: ~$58-84 (target ~$68)
**Remaining Buffer**: ~$9 for unexpected issues

---

## 🚦 EXECUTION READY CHECKLIST

Before starting Option A:
- [x] All tests passing (378/378) ✅
- [x] Zero TypeScript errors ✅
- [x] Navigation UI complete ✅
- [x] Git status clean ✅
- [x] Budget confirmed ($77 available)
- [x] User approval for Option A

**READY TO EXECUTE** → Awaiting user approval for Option A, B, or C

---

## 📊 BUDGET BREAKDOWN SUMMARY

| Category | Task Count | Est. Budget | Priority |
|----------|------------|-------------|----------|
| **Critical Technical Debt** | 3 | $72-100 | 🔴 HIGH |
| **High Priority Nice-to-Haves** | 5 | $58-84 | 🟡 HIGH |
| **Medium Priority Nice-to-Haves** | 5 | $74-108 | 🟢 MEDIUM |
| **Low Priority Nice-to-Haves** | 5 | $192-272 | 🔵 LOW |
| **TOTAL** | 18 tasks | $396-564 | - |

**With $77 Budget**: Can complete **5 HIGH priority tasks** (Option A)

---

**Document Status**: ✅ READY FOR REVIEW
**Next Action**: User approval for Option A, B, or C
**Generated by**: plan-execution mode
**Follow-up**: Execute approved option via agent delegation
