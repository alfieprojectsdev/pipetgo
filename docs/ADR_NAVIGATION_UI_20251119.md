# ADR: Dashboard Navigation UI Architecture
**Date**: 2025-11-19
**Status**: Approved
**Deciders**: Development Team, CEO (implicit - wants Service Management discoverable)
**Context**: Service Management System functional but not accessible via navigation

---

## Problem Statement

The Service Management System (`/dashboard/lab/services`) and Analytics Dashboard (`/dashboard/lab/analytics`) are fully functional but not discoverable. Users must know direct URLs or manually navigate. This creates poor UX and blocks CEO's user testing goals.

**CEO Quote**: *"Where to start building list of services to be posted?"*
**Answer**: `/dashboard/lab/services` - but users can't find it!

---

## Decision

Implement **Option C: Hybrid Navigation** (Top navigation bar + Breadcrumbs)

### Architecture

```
Dashboard Layout
├── Top Navigation Bar (role-based menu items)
├── Breadcrumb Trail (contextual location)
└── Main Content (existing pages)
```

**Why Option C**:
- ✅ Clean, modern look (top nav)
- ✅ Context awareness (breadcrumbs)
- ✅ Mobile-friendly (hamburger collapse)
- ✅ Quick to implement (~1-1.5 hours)
- ✅ Uses existing shadcn/ui components
- ✅ Minimal disruption to existing layouts

**Alternatives Considered**:
- ❌ Option A (Sidebar): Takes up horizontal space, harder on mobile
- ❌ Option B (Top nav only): No contextual location info

---

## Component Design

### File Structure

```
src/app/dashboard/
├── layout.tsx                          # Updated with navigation
├── components/
│   ├── DashboardNav.tsx                # Top navigation bar (client component)
│   ├── Breadcrumbs.tsx                 # Breadcrumb trail (client component)
│   └── MobileNav.tsx                   # Mobile hamburger menu (client component)
```

### 1. DashboardNav Component

**Purpose**: Role-based top navigation menu

**Interface**:
```typescript
interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles: ('CLIENT' | 'LAB_ADMIN' | 'ADMIN')[]
}

interface DashboardNavProps {
  role: 'CLIENT' | 'LAB_ADMIN' | 'ADMIN'
  currentPath: string
}
```

**Navigation Items by Role**:

**CLIENT**:
- 🏠 Dashboard → `/dashboard/client`
- 📦 My Orders → `/dashboard/client/orders` (future)

**LAB_ADMIN**:
- 🏠 Dashboard → `/dashboard/lab`
- 📋 Orders → `/dashboard/lab` (current home shows orders)
- 🧪 Services → `/dashboard/lab/services` ⭐
- 📊 Analytics → `/dashboard/lab/analytics` ⭐

**ADMIN**:
- 🏠 Dashboard → `/dashboard/admin`
- 🏢 Labs → `/dashboard/admin/labs` (future)
- 👥 Users → `/dashboard/admin/users` (future)

**Active State**: Highlight current page with `bg-blue-100 text-blue-700`

---

### 2. Breadcrumbs Component

**Purpose**: Show contextual location in dashboard

**Route Mapping**:
```typescript
const breadcrumbMap: Record<string, string[]> = {
  '/dashboard/client': ['Dashboard'],
  '/dashboard/lab': ['Dashboard'],
  '/dashboard/lab/services': ['Dashboard', 'Services'],
  '/dashboard/lab/analytics': ['Dashboard', 'Analytics'],
  '/dashboard/lab/orders/[id]/quote': ['Dashboard', 'Orders', 'Quote'],
  '/dashboard/admin': ['Dashboard'],
}
```

**Dynamic Segments**: Replace `[id]` with actual order ID (e.g., "Order #ABC123")

**Behavior**:
- Last item (current page) not clickable
- Intermediate items are links
- Mobile: Show only last 2 items if trail is long

---

### 3. Mobile Navigation

**Breakpoints**:
- Desktop (≥768px): Full horizontal nav
- Mobile (<768px): Hamburger menu with slide-out sheet

**shadcn/ui Components Used**:
- `Sheet` (mobile drawer)
- `Button` (nav items, hamburger trigger)
- Icons from `lucide-react`

---

## Implementation Plan

### Phase 1: Base Navigation Component (20 min)
**File**: `src/app/dashboard/components/DashboardNav.tsx`

1. Create client component with role-based navigation
2. Define navigation items array (CLIENT, LAB_ADMIN, ADMIN)
3. Use `usePathname()` for active state
4. Desktop: Horizontal flex layout
5. Mobile: Render hamburger button (placeholder)

**Validation**: Navigation shows for LAB_ADMIN with Services & Analytics links

---

### Phase 2: Breadcrumbs Component (15 min)
**File**: `src/app/dashboard/components/Breadcrumbs.tsx`

1. Create client component
2. Parse current pathname
3. Map to breadcrumb labels
4. Render: Home → Parent → Current
5. Style: Gray text, chevron separators, last item bold

**Validation**: Breadcrumbs show "Dashboard > Services" on `/dashboard/lab/services`

---

### Phase 3: Mobile Navigation (20 min)
**File**: `src/app/dashboard/components/MobileNav.tsx`

1. Create Sheet-based mobile menu
2. Hamburger button trigger (Menu icon from lucide-react)
3. Slide-out drawer with navigation items
4. Close on item click
5. Media queries: Hide mobile nav on desktop, hide desktop nav on mobile

**Validation**: Mobile hamburger opens drawer with navigation items

---

### Phase 4: Layout Integration (10 min)
**File**: `src/app/dashboard/layout.tsx`

1. Import DashboardNav and Breadcrumbs
2. Get session for user role
3. Render structure:
   ```tsx
   <DashboardNav role={session.user.role} />
   <div className="container mx-auto p-4">
     <Breadcrumbs />
     {children}
   </div>
   ```
4. Ensure ErrorBoundary wrapper preserved

**Validation**: Navigation appears on all dashboard pages

---

### Phase 5: Accessibility & Testing (15 min)

1. **Semantic HTML**:
   - `<nav aria-label="Dashboard navigation">`
   - `<ol aria-label="Breadcrumb">`

2. **Keyboard Navigation**:
   - Tab through nav items
   - Enter to activate
   - Escape to close mobile menu

3. **ARIA Attributes**:
   - `aria-current="page"` on active nav item
   - `aria-label` on navigation regions
   - `aria-expanded` on mobile menu trigger

4. **Screen Reader Test**:
   - Read navigation aloud
   - Verify breadcrumb trail makes sense

**Validation**: All accessibility checks pass

---

## Code Examples

### DashboardNav.tsx (Simplified)

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Beaker, BarChart3, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavItem {
  label: string
  href: string
  icon: any
  roles: string[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/lab', icon: Home, roles: ['LAB_ADMIN'] },
  { label: 'Orders', href: '/dashboard/lab', icon: ClipboardList, roles: ['LAB_ADMIN'] },
  { label: 'Services', href: '/dashboard/lab/services', icon: Beaker, roles: ['LAB_ADMIN'] },
  { label: 'Analytics', href: '/dashboard/lab/analytics', icon: BarChart3, roles: ['LAB_ADMIN'] },
]

export function DashboardNav({ role }: { role: string }) {
  const pathname = usePathname()
  const roleItems = navItems.filter(item => item.roles.includes(role))

  return (
    <nav className="border-b bg-white" aria-label="Dashboard navigation">
      <div className="container mx-auto flex gap-2 p-4">
        {roleItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Button
              key={item.href}
              variant={isActive ? "secondary" : "ghost"}
              asChild
              aria-current={isActive ? "page" : undefined}
            >
              <Link href={item.href} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            </Button>
          )
        })}
      </div>
    </nav>
  )
}
```

### Breadcrumbs.tsx (Simplified)

```typescript
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

const breadcrumbMap: Record<string, { label: string; href: string }[]> = {
  '/dashboard/lab': [{ label: 'Dashboard', href: '/dashboard/lab' }],
  '/dashboard/lab/services': [
    { label: 'Dashboard', href: '/dashboard/lab' },
    { label: 'Services', href: '/dashboard/lab/services' }
  ],
  '/dashboard/lab/analytics': [
    { label: 'Dashboard', href: '/dashboard/lab' },
    { label: 'Analytics', href: '/dashboard/lab/analytics' }
  ],
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const breadcrumbs = breadcrumbMap[pathname] || []

  if (breadcrumbs.length <= 1) return null

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-2 text-sm text-gray-600">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <li key={crumb.href} className="flex items-center gap-2">
              {isLast ? (
                <span className="font-medium text-gray-900">{crumb.label}</span>
              ) : (
                <>
                  <Link href={crumb.href} className="hover:text-gray-900">
                    {crumb.label}
                  </Link>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
```

### layout.tsx Integration

```typescript
// src/app/dashboard/layout.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DashboardNav } from './components/DashboardNav'
import { Breadcrumbs } from './components/Breadcrumbs'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <DashboardNav role={session.user.role} />
        <main className="container mx-auto p-4 md:p-6 lg:p-8">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </ErrorBoundary>
  )
}
```

---

## Accessibility Checklist

### Semantic HTML
- ✅ `<nav>` for navigation regions
- ✅ `<ol>` for breadcrumbs (ordered list)
- ✅ Proper heading hierarchy (h1, h2, etc.)

### ARIA Attributes
- ✅ `aria-label="Dashboard navigation"` on nav
- ✅ `aria-label="Breadcrumb"` on breadcrumb nav
- ✅ `aria-current="page"` on active nav item
- ✅ `aria-expanded` on mobile menu trigger

### Keyboard Navigation
- ✅ Tab through all nav items
- ✅ Enter/Space to activate links
- ✅ Escape to close mobile menu
- ✅ Focus visible (outline on focus)

### Screen Reader Support
- ✅ Navigation region announced
- ✅ Current page indicated
- ✅ Breadcrumb trail readable
- ✅ Icon descriptions (aria-hidden on decorative icons)

### Color Contrast
- ✅ Text: 4.5:1 minimum (WCAG AA)
- ✅ Active state: 3:1 minimum
- ✅ Focus indicators: 3:1 minimum

---

## Mobile Responsiveness

### Breakpoint Strategy

**Desktop (≥768px)**:
```css
.desktop-nav {
  display: flex;  /* Horizontal nav */
}

.mobile-nav {
  display: none;  /* Hide hamburger */
}

.nav-label {
  display: inline; /* Show full labels */
}
```

**Mobile (<768px)**:
```css
.desktop-nav {
  display: none;   /* Hide horizontal nav */
}

.mobile-nav {
  display: block;  /* Show hamburger */
}

.nav-label {
  display: none;   /* Icons only (or in drawer) */
}
```

### Mobile Menu Behavior

1. **Trigger**: Hamburger icon (Menu from lucide-react)
2. **Container**: shadcn/ui Sheet (slide-out drawer)
3. **Content**: Full navigation items (with labels)
4. **Close**: X button + click outside + item selection
5. **Animation**: Slide from left, smooth transition

---

## Performance Considerations

### Bundle Size
- Navigation components: ~5KB (gzipped)
- Icons (lucide-react): Already imported elsewhere
- shadcn/ui Sheet: Already in project
- **Total Added**: <10KB

### Runtime Performance
- Client components (CSR)
- No API calls (static navigation)
- Pathname from Next.js router (no extra state)
- **Impact**: Negligible (<1ms render time)

### Hydration
- Server renders initial HTML (layout.tsx)
- Client hydrates interactive nav
- No layout shift (reserved space)

---

## Testing Strategy

### Unit Tests
```typescript
describe('DashboardNav', () => {
  it('shows LAB_ADMIN navigation items', () => {
    render(<DashboardNav role="LAB_ADMIN" />)
    expect(screen.getByText('Services')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
  })

  it('highlights active page', () => {
    render(<DashboardNav role="LAB_ADMIN" />)
    const servicesLink = screen.getByText('Services')
    expect(servicesLink).toHaveAttribute('aria-current', 'page')
  })
})
```

### Integration Tests
1. Navigate to `/dashboard/lab/services`
2. Verify "Services" highlighted in nav
3. Verify breadcrumb shows "Dashboard > Services"
4. Click "Analytics" in nav
5. Verify navigation to `/dashboard/lab/analytics`
6. Verify breadcrumb updates to "Dashboard > Analytics"

### Manual Tests
1. **Desktop**: All nav items visible and clickable
2. **Mobile**: Hamburger menu opens/closes
3. **Keyboard**: Tab through nav, Enter to activate
4. **Screen Reader**: Announce navigation correctly
5. **All Roles**: CLIENT, LAB_ADMIN, ADMIN see correct menus

---

## Migration Strategy

### Rollout Plan

**Phase 1: Lab Admin Only** (First Deploy)
- Add navigation to LAB_ADMIN dashboard
- Services & Analytics links visible
- Test with CEO and friends

**Phase 2: All Roles** (After UAT Feedback)
- Extend to CLIENT and ADMIN dashboards
- Add role-specific navigation items
- Handle edge cases from feedback

**Backwards Compatibility**:
- ✅ Direct URLs still work (`/dashboard/lab/services`)
- ✅ No breaking changes to existing pages
- ✅ ErrorBoundary preserved
- ✅ Graceful degradation if JS disabled (links still work)

---

## Success Metrics

### Qualitative
- ✅ CEO can find Service Management without instructions
- ✅ Users understand current location (breadcrumbs)
- ✅ Mobile users can navigate easily
- ✅ Accessible to keyboard/screen reader users

### Quantitative
- ✅ 0 navigation-related bugs in UAT
- ✅ <10KB added bundle size
- ✅ <1ms navigation render time
- ✅ 100% test coverage for navigation components

### User Feedback (UAT)
- "How do I get to Services?" → Navigate naturally
- "Where am I?" → Read breadcrumbs
- "Can I use keyboard?" → Tab + Enter works
- "Works on my phone?" → Hamburger menu functional

---

## Risks & Mitigation

### Risk 1: Layout Shifts
**Risk**: Navigation causes content jump
**Mitigation**: Reserve fixed height for nav bar, smooth transitions

### Risk 2: Mobile Menu Conflicts
**Risk**: Sheet component conflicts with existing modals
**Mitigation**: Use z-index layers, test modal interactions

### Risk 3: Route Changes Break Breadcrumbs
**Risk**: New routes added, breadcrumbs not updated
**Mitigation**: Document breadcrumb map clearly, add "missing route" fallback

### Risk 4: Accessibility Gaps
**Risk**: Keyboard nav or screen readers don't work
**Mitigation**: Test with actual assistive tech, follow WCAG 2.1 AA

---

## Implementation Timeline

**Total Estimated Time**: 1.5 hours (~$40-60 budget)

| Phase | Time | Cumulative |
|-------|------|------------|
| 1. DashboardNav component | 20 min | 20 min |
| 2. Breadcrumbs component | 15 min | 35 min |
| 3. Mobile navigation | 20 min | 55 min |
| 4. Layout integration | 10 min | 65 min |
| 5. Accessibility & testing | 15 min | 80 min |
| **Buffer/polish** | 10 min | **90 min** |

**Dependencies**:
- shadcn/ui components (already installed)
- lucide-react icons (already installed)
- Next.js 14 App Router (already using)

**No Blockers**: Can implement immediately

---

## Alternatives Considered

### Alternative 1: Sidebar Navigation
**Pros**: More space for menu items, common pattern
**Cons**: Takes horizontal space, harder mobile implementation
**Verdict**: ❌ Rejected - Not optimal for mobile

### Alternative 2: Dropdown Menus
**Pros**: Compact, can nest items
**Cons**: More complex, harder accessibility, extra clicks
**Verdict**: ❌ Rejected - Overkill for current needs

### Alternative 3: Just Breadcrumbs (No Top Nav)
**Pros**: Minimal, less dev time
**Cons**: Doesn't solve discoverability problem
**Verdict**: ❌ Rejected - Doesn't meet requirements

---

## Decision Rationale

**Why Hybrid Navigation (Top Nav + Breadcrumbs)**:

1. **Discoverability**: Top nav makes Services & Analytics visible
2. **Context**: Breadcrumbs show current location
3. **Mobile**: Collapses to hamburger menu
4. **Quick**: ~1.5 hours implementation
5. **Familiar**: Standard pattern users recognize
6. **Accessible**: Easy to implement WCAG 2.1 AA compliance
7. **Scalable**: Can add more nav items easily

**Trade-offs Accepted**:
- Slightly more components than breadcrumbs-only
- Need to maintain route-to-breadcrumb mapping
- Mobile menu adds complexity

**Benefits Gained**:
- CEO's requirement met (Service Management discoverable)
- Professional dashboard UX
- Production-ready navigation system
- Foundation for future pages

---

## References

- WCAG 2.1 AA Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Next.js App Router Layouts: https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts
- shadcn/ui Sheet: https://ui.shadcn.com/docs/components/sheet
- Accessible Navigation Patterns: https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/

---

**Decision**: ✅ Approved
**Next Step**: Implement according to this ADR
**Estimated Effort**: 1.5 hours (~$40-60)
**Expected Completion**: Same session (with $61 budget available)
