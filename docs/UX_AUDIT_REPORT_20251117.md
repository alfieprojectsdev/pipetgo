# PipetGo UI/UX Audit Report

**Date:** 2025-11-17
**Status:** CSS Fixed - Accessibility Issues Identified
**Auditor:** @agent-ux-reviewer

---

## Executive Summary

CSS rendering infrastructure is **properly configured** with PostCSS, Tailwind, and local fonts. The application has **good accessibility foundations** (Radix UI, semantic HTML in places, keyboard support) but suffers from **several P0 accessibility violations** that must be fixed before production. Mobile responsiveness is functional but needs refinement. The B2B quotation workflow is clear, but error handling and success feedback need improvement.

---

## CSS Rendering Verification

✅ **Tailwind utilities applied** - Extensive use throughout (spacing, colors, typography, layout)
✅ **Color scheme working** - HSL-based CSS variables properly configured in `globals.css`
✅ **Typography correct** - Inter font loaded via next/font localFont, proper weights (400, 600)
✅ **Layout/spacing correct** - Flexbox, grid, padding/margin utilities used consistently

**Files Verified:**
- `/home/user/pipetgo/postcss.config.js` - Tailwind + Autoprefixer configured
- `/home/user/pipetgo/tailwind.config.ts` - Comprehensive config with color system, animations
- `/home/user/pipetgo/src/app/globals.css` - @tailwind directives + CSS variables for theme
- `/home/user/pipetgo/src/app/layout.tsx` - Font loading with `localFont`, globals.css imported

**Build Output:**
- Generated CSS: `24KB` compressed
- Includes Tailwind reset, utilities, custom theme variables
- All responsive breakpoints present (sm: 640px, md: 768px, lg: 1024px)

---

## Critical Issues (P0) - MUST FIX

### 1. Form Inputs Missing Proper Label Association
**File:** `/home/user/pipetgo/src/app/order/[serviceId]/page.tsx`
**Lines:** 207-363 (multiple inputs)

**Issue:** Form inputs use plain `<label>` elements without `htmlFor` attributes matching input `id` attributes. This violates WCAG 2.1 AA 1.3.1 (Info and Relationships).

**Example violations:**
```tsx
// Line 207-218 - Label has no htmlFor, input has no id
<label className="block text-sm font-medium mb-1">
  Sample Description *
</label>
<textarea
  value={formData.sampleDescription}
  onChange={(e) => setFormData(prev => ({ ...prev, sampleDescription: e.target.value }))}
  className="w-full..."
  required
/>
```

**Impact:** Screen readers cannot programmatically associate labels with inputs. Users with visual impairments won't know what each field is for when navigating with assistive technology.

**Fix Required:**
```tsx
<label htmlFor="sampleDescription" className="block text-sm font-medium mb-1">
  Sample Description *
</label>
<textarea
  id="sampleDescription"
  value={formData.sampleDescription}
  onChange={(e) => setFormData(prev => ({ ...prev, sampleDescription: e.target.value }))}
  className="w-full..."
  required
/>
```

**All affected fields:**
- sampleDescription (line 207-218)
- specialInstructions (line 221-232)
- contactEmail (line 295-305)
- contactPhone (line 307-318)
- organization (line 322-331)
- street, city, postal (lines 337-363)

---

### 2. Status Badges Rely Only on Visual Color
**Files:**
- `/home/user/pipetgo/src/app/dashboard/client/page.tsx` (line 209-211)
- `/home/user/pipetgo/src/app/dashboard/lab/page.tsx` (line 226-228)

**Issue:** Order status badges use only color to convey information, violating WCAG 2.1 AA 1.4.1 (Use of Color).

```tsx
// Line 209-211 - Status only conveyed by color class
<span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
  {getStatusText(order.status)}
</span>
```

**Impact:** Screen reader users hear "Quote Ready for Review" but don't know it's a status badge. Color-blind users may not distinguish status types.

**Fix Required:**
```tsx
<span
  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
  role="status"
  aria-label={`Order status: ${getStatusText(order.status)}`}
>
  {getStatusText(order.status)}
</span>
```

---

### 3. Badge Component Uses Div Instead of Span
**File:** `/home/user/pipetgo/src/components/ui/badge.tsx` (line 36)

**Issue:** Badge component uses `<div>` for inline content, creating incorrect document structure.

```tsx
// Line 36 - Block element used for inline badge
function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
```

**Impact:** Badges are inline elements but use block-level `<div>`, causing layout issues and semantic incorrectness.

**Fix Required:**
```tsx
function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
```

---

## Important Issues (P1) - SHOULD FIX

### 4. Error Handling Uses Browser alert()
**Files:**
- `/home/user/pipetgo/src/app/dashboard/client/page.tsx` (lines 78, 82, 113, 117)
- `/home/user/pipetgo/src/app/dashboard/lab/page.tsx` (lines 74, 77)
- `/home/user/pipetgo/src/app/order/[serviceId]/page.tsx` (lines 109, 113, 117)

**Issue:** Uses browser `alert()` for error messages, which interrupts screen readers and provides poor UX.

**Impact:**
- Screen readers interrupt current context to announce alert
- Modal dialogs block all interaction
- Not dismissible with Esc key in some browsers
- Inconsistent styling across browsers

**Fix Required:** Implement accessible toast notification component (e.g., Radix UI Toast or shadcn/ui Toast).

---

### 5. Loading States Lack Accessibility Announcements
**Files:**
- `/home/user/pipetgo/src/app/page.tsx` (lines 126-127)
- `/home/user/pipetgo/src/app/dashboard/client/page.tsx` (line 152)
- `/home/user/pipetgo/src/app/dashboard/lab/page.tsx` (line 145)

**Issue:** Loading text lacks `role="status"` or `aria-live` to announce state changes to screen readers.

```tsx
// Line 126-127 - No accessibility attributes
{isLoading ? (
  <div className="text-center">Loading services...</div>
) : (
```

**Fix Required:**
```tsx
{isLoading ? (
  <div className="text-center" role="status" aria-live="polite">
    <span className="sr-only">Loading services, please wait</span>
    Loading services...
  </div>
) : (
```

---

### 6. Form Grid Too Cramped on Mobile
**File:** `/home/user/pipetgo/src/app/order/[serviceId]/page.tsx`

**Lines:** 294-319 (email/phone), 345-363 (city/postal)

**Issue:** Two-column grid (`grid-cols-2`) applied at all breakpoints, making inputs too narrow on small screens.

```tsx
// Line 294 - No breakpoint for 2-column grid
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium mb-1">
      Contact Email *
    </label>
```

**Impact:** On 320px screens, email/phone inputs only 150px wide, difficult to read input content and labels may wrap awkwardly.

**Fix Required:**
```tsx
<div className="grid sm:grid-cols-2 gap-4">
```

**Applies to:**
- Email/Phone grid (line 294)
- City/Postal grid (line 345)

---

### 7. Dashboard Stats Grid Skips Tablet Breakpoint
**Files:**
- `/home/user/pipetgo/src/app/dashboard/client/page.tsx` (line 291)
- `/home/user/pipetgo/src/app/dashboard/lab/page.tsx` (line 169)

**Issue:** Stats grid goes from 1 column to 4 columns with no intermediate breakpoint.

```tsx
// Line 291 - Jumps from 1 to 4 columns
<div className="grid md:grid-cols-4 gap-4">
```

**Impact:** On tablet (768px), 4 narrow columns create cramped layout. Better UX with 2 columns on tablet.

**Fix Required:**
```tsx
<div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
```

---

### 8. Success Actions Provide No Visual Feedback
**Files:**
- `/home/user/pipetgo/src/app/dashboard/client/page.tsx` (lines 73-74, 108-109)
- `/home/user/pipetgo/src/app/order/[serviceId]/page.tsx` (line 109)

**Issue:** After approving/rejecting quotes or submitting orders, success state uses `alert()` or silent refresh.

```tsx
// Line 73-74 - Silent refresh, no confirmation
if (response.ok) {
  setApprovalDialogOpen(false)
  fetchOrders()  // User sees nothing until data reloads
}
```

**Impact:** User uncertainty - "Did my action succeed?" No immediate visual confirmation.

**Fix Required:** Add toast notification: "Quote approved successfully" with green checkmark icon.

---

### 9. Missing Visual Loading Indicator for Async Actions
**File:** `/home/user/pipetgo/src/app/order/[serviceId]/page.tsx` (lines 372-377)

**Issue:** Submit button shows text "Submitting..." but no spinner or visual indicator.

```tsx
// Line 372-377 - Text only, no spinner
<Button type="submit" className="w-full" disabled={isSubmitting}>
  {isSubmitting ? 'Submitting...' :
    service.pricingMode === 'QUOTE_REQUIRED' ? 'Submit RFQ' :
    // ...
  }
</Button>
```

**Impact:** Users may think page is frozen, especially on slow connections.

**Fix Required:** Add loading spinner icon before "Submitting..." text.

---

## Suggestions (P2) - NICE TO HAVE

### 10. Homepage Heading Hierarchy Issues
**File:** `/home/user/pipetgo/src/app/page.tsx` (lines 94, 105)

**Issue:** H1 ("PipetGo") and H2 ("Find the Right Lab") both appear in header/hero, but semantically H1 should represent main page content.

**Current:**
```tsx
<h1 className="text-2xl font-bold text-gray-900">PipetGo</h1>
{/* ... */}
<h2 className="text-4xl font-bold mb-4">
  Find the Right Lab for Your Testing Needs
</h2>
```

**Recommendation:** Use H1 for hero title, make "PipetGo" a div with aria-label on header landmark.

---

### 11. Inconsistent Status Text Formatting
**Files:**
- `/home/user/pipetgo/src/app/dashboard/client/page.tsx` (lines 136-149) - Uses proper mapping
- `/home/user/pipetgo/src/app/dashboard/lab/page.tsx` (line 227) - Uses `.replace('_', ' ')`

**Issue:** Lab dashboard uses string replacement which only replaces first underscore:

```tsx
// Line 227 - Only replaces first "_"
{order.status.replace('_', ' ')}
```

**Impact:** Status "QUOTE_PROVIDED" would display as "QUOTE PROVIDED" (correct by chance), but pattern is unreliable.

**Recommendation:** Use same `getStatusText()` mapping function as client dashboard for consistency.

---

### 12. Dialog Close Button Focus Indicator Could Be More Prominent
**File:** `/home/user/pipetgo/src/components/ui/dialog.tsx` (line 72)

**Issue:** Complex focus styles but ring color inherits from CSS variable which may not be prominent enough.

```tsx
className="... focus:ring-2 focus:ring-offset-2 ..."
```

**Recommendation:** Explicitly set focus ring color for close button: `focus:ring-blue-500` for consistency.

---

### 13. Empty States Could Use Better Semantic Structure
**Files:**
- `/home/user/pipetgo/src/app/dashboard/client/page.tsx` (lines 188-196)
- `/home/user/pipetgo/src/app/dashboard/lab/page.tsx` (lines 208-213)

**Issue:** Empty states use generic text in CardContent without semantic structure.

**Recommendation:** Add heading and description with proper ARIA attributes:
```tsx
<CardContent className="text-center py-12" role="status">
  <h3 className="text-lg font-medium text-gray-900 mb-2">No test requests yet</h3>
  <p className="text-gray-500 mb-4">Get started by browsing available services</p>
  <Button onClick={() => router.push('/')}>
    Browse Available Services
  </Button>
</CardContent>
```

---

## Accessibility Compliance

**WCAG 2.1 AA Score:** **Non-compliant** (3 P0 violations must be fixed)

**Key Issues:**
1. Form labels not programmatically associated (WCAG 1.3.1)
2. Status information conveyed only by color (WCAG 1.4.1)
3. Incorrect semantic structure (badge component)
4. Loading states not announced to screen readers (WCAG 4.1.3)
5. Error handling uses inaccessible alert() dialogs

**Compliant Areas:**
✅ Keyboard navigation (Tab order logical, Enter/Esc work in dialogs)
✅ Focus indicators visible (buttons, inputs show focus ring)
✅ Dialog component uses Radix UI (accessible by default)
✅ SR-only text for close button ("Close" label)
✅ Semantic HTML in many places (header, main, footer)

---

## Mobile Responsiveness

**320px (Small Mobile):**
- ⚠️ P1: Two-column form grids too cramped (email/phone, city/postal)
- ⚠️ P1: Card content dense, some text may wrap poorly
- ✅ Touch targets adequate (buttons 44x44px minimum)
- ✅ Navigation collapses appropriately

**640px (sm: Mobile Landscape/Small Tablet):**
- ⚠️ P2: Stats grid jumps from 1 to 4 columns, missing 2-column intermediate
- ✅ Service cards stack appropriately (1 column)
- ✅ Form layout functional

**768px (md: Tablet):**
- ⚠️ P1: 4-column stats grid creates narrow cards on tablet
- ✅ Service cards show 2 columns
- ✅ Dashboard layout switches to multi-column

**1024px (lg: Desktop):**
- ✅ All layouts render correctly
- ✅ Service cards show 3 columns
- ✅ Form uses side-by-side layout (order page)

---

## Phase 1 & Phase 2 Implementations (November 2025)

### Service Management System (Lab Admin Dashboard)

**Location:** `/dashboard/lab/services`

**Components Implemented:**
- `CreateServiceModal.tsx` (8KB) - Create service form with validation
- `EditServiceModal.tsx` (9.6KB) - Edit form with pre-population
- `ServiceTable.tsx` (12KB) - Table with selection, sorting, actions

**Accessibility Highlights:**
✅ **Modal accessibility (Radix UI Dialog)**
- Focus trap when modal open
- Esc key closes modal
- Backdrop click closes modal
- Aria labels on all form fields
- Error states announced to screen readers

✅ **Table accessibility**
- Semantic `<table>` structure
- `<th>` headers with proper scope
- Checkbox selection with aria-label
- Keyboard navigation (Tab through actions)

✅ **Form validation**
- Real-time validation with clear error messages
- Required fields marked with asterisk
- Error messages programmatically linked to inputs
- Success feedback via toast notifications

**UX Improvements Needed (P1):**
- Add loading spinner during service creation
- Improve empty state message (currently generic)
- Add confirmation dialog for bulk delete (currently instant)

---

### Analytics Dashboard (Lab Admin)

**Location:** `/dashboard/lab/analytics`

**Components Implemented:**
- `RevenueChart.tsx` (5.8KB) - Recharts area chart
- `QuoteMetrics.tsx` (6KB) - Metrics cards
- `OrderVolumeChart.tsx` (5.4KB) - Volume line chart
- `TopServicesTable.tsx` (4.3KB) - Revenue ranking table

**Accessibility Highlights:**
✅ **Chart accessibility**
- Recharts library with ARIA support
- Text alternatives for visual data
- Keyboard accessible (Tab navigation)
- Color contrast meets WCAG AA (blue/green palette)

✅ **Metrics cards**
- Semantic HTML structure
- Clear headings (Revenue, Quote Rate, etc.)
- Screen reader friendly numbers
- Growth percentages announced

**UX Improvements Needed (P1):**
- Add data export (CSV download)
- Add date range filter beyond "last30days"
- Add tooltips for chart data points
- Improve loading states (currently shows skeleton)

---

### Production Error Handling

**Location:** All dashboard pages

**Components Implemented:**
- `ErrorBoundary.tsx` - React class component
- `error.tsx` - Next.js 14 route error handler

**Accessibility Highlights:**
✅ **Error UI**
- Clear error heading (H1)
- User-friendly error message (no stack traces)
- "Try Again" button with keyboard support
- Aria-live region for error announcements

✅ **Coverage**
- Client dashboard: ErrorBoundary
- Lab orders dashboard: ErrorBoundary
- Lab services dashboard: ErrorBoundary
- Lab analytics dashboard: ErrorBoundary
- Admin dashboard: ErrorBoundary

**UX Improvements Needed (P2):**
- Add error reporting (send errors to logging service)
- Add "Contact Support" link in error UI
- Improve error categorization (network vs app errors)

---

## Summary of Required Fixes

### Before Production Deployment (P0):
1. Add `id` and `htmlFor` attributes to all form inputs/labels (9 fields in order form)
2. Add `role="status"` and `aria-label` to status badges
3. Change Badge component from `<div>` to `<span>`

### Within 1 Week (P1):
4. Replace all `alert()` calls with accessible toast notifications
5. Add `role="status" aria-live="polite"` to loading states
6. Fix mobile form grids (use `sm:grid-cols-2` instead of `grid-cols-2`)
7. Fix dashboard stats grid (add `sm:grid-cols-2`)
8. Add toast notifications for success states (quote approval, order submission)
9. Add loading spinner to async action buttons

### Future Improvements (P2):
10. Fix homepage heading hierarchy (H1 for hero title)
11. Unify status text formatting across dashboards
12. Enhance dialog close button focus indicator
13. Improve empty state semantic structure

---

**Overall Assessment:** 8/10 usability after Phase 1 & 2 additions. The application is functional and follows good patterns (Radix UI, Tailwind, responsive utilities). Phase 1 (Service Management) and Phase 2 (Analytics Dashboard) are production-ready with comprehensive accessibility. Remaining P0 issues in order form must be fixed before production; P1 issues before public launch.

**Phase 1 & 2 Quality Score:** 9/10
- Service Management: Excellent modal accessibility, clear forms
- Analytics Dashboard: Good chart accessibility, semantic metrics
- Error Handling: Production-grade error boundaries
- Minor improvements needed: loading states, confirmations, export features

---

**Auditor:** @agent-ux-reviewer
**Date:** 2025-11-17
**Next Review:** After P0 fixes implemented
