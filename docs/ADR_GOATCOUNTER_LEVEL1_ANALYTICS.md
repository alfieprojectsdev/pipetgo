# ADR: GoatCounter Level 1 Analytics Implementation

**Date:** 2025-11-08
**Status:** Approved
**Decision Makers:** Product Team
**Context:** Privacy-friendly analytics for PipetGo B2B marketplace

---

## Context and Problem Statement

PipetGo needs basic usage analytics to understand:
- Which pages are visited most frequently
- User journey patterns (client vs lab admin vs admin dashboards)
- Platform adoption and engagement metrics
- Performance optimization opportunities

**Requirements:**
- ✅ Privacy-friendly (no personal data, no GDPR notices required)
- ✅ Lightweight (minimal performance impact)
- ✅ Works with Next.js 14 App Router
- ✅ B2B marketplace context (not e-commerce)

## Decision

Implement **GoatCounter Level 1 Analytics** - basic page view tracking only.

### What is "Level 1"?

**Level 1** = Page view tracking ONLY (no custom events, no user identification)

**Tracks:**
- All public pages (homepage, service listings, lab profiles)
- Authenticated dashboard pages (client, lab admin, admin)
- Order flow pages (service selection, RFQ submission, quote review)

**Does NOT track:**
- Individual user identities
- Form input values
- Search queries
- API requests
- Custom events (clicks, downloads, etc.) - saved for Level 2

**Excluded Routes:**
- `/api/*` - API routes (server-side, not user-facing)
- `/_next/*` - Next.js internal routes
- Authentication pages with sensitive data in URL params

### Why GoatCounter?

**Alternatives Considered:**
1. **Google Analytics** ❌ - Privacy concerns, requires GDPR consent, bloated
2. **Plausible Analytics** ⚠️ - Great but costs €9/month (GoatCounter free for <100k views)
3. **Self-hosted Matomo** ❌ - Infrastructure overhead
4. **GoatCounter** ✅ - Privacy-friendly, free tier, lightweight (3.5KB)

**Decision:** GoatCounter hosted service (free tier: <100k pageviews/month)

### Technical Implementation Strategy

#### 1. Script Integration (App Router)

**Location:** `src/app/layout.tsx` (root layout)

```tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}

        {/* GoatCounter Analytics */}
        <Script
          data-goatcounter={process.env.NEXT_PUBLIC_GOATCOUNTER_URL}
          async
          src="//gc.zgo.at/count.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
```

**Key Decisions:**
- ✅ `strategy="afterInteractive"` - Load after page interactive (no blocking)
- ✅ Place before `</body>` - Standard analytics placement
- ✅ Conditional rendering based on env var - Easy to disable in development

#### 2. App Router Navigation Tracking

**Challenge:** Next.js App Router uses client-side navigation (SPA behavior), but GoatCounter only tracks initial page load.

**Solution:** Create `src/components/analytics/goatcounter-tracker.tsx` component:

```tsx
'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export function GoatCounterTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (window.goatcounter) {
      window.goatcounter.count({
        path: pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''),
      })
    }
  }, [pathname, searchParams])

  return null
}
```

**Placement:** Add to root layout as Client Component

#### 3. Environment Configuration

**Required Environment Variables:**

```bash
# .env.local (local development)
NEXT_PUBLIC_GOATCOUNTER_URL="https://pipetgo.goatcounter.com/count"
# Set to empty string to disable analytics in development
```

**Setup Steps:**
1. Create account at goatcounter.com
2. Get unique URL (e.g., `https://pipetgo.goatcounter.com`)
3. Add environment variable
4. Deploy - analytics start immediately

#### 4. Local Development Testing

**Option 1:** Disable analytics locally
```bash
# .env.local
NEXT_PUBLIC_GOATCOUNTER_URL=""
```

**Option 2:** Test with allow_local flag
```tsx
<Script
  data-goatcounter={process.env.NEXT_PUBLIC_GOATCOUNTER_URL}
  data-goatcounter-settings='{"allow_local": true}'
  async
  src="//gc.zgo.at/count.js"
/>
```

**Decision:** Use Option 1 (disable locally) to avoid polluting production analytics with dev traffic.

## Implementation Plan

### Phase 1: Environment Setup (5 lines)
- Add `NEXT_PUBLIC_GOATCOUNTER_URL` to environment variables
- Create `.env.example` with GoatCounter variable
- Document in CLAUDE.md

### Phase 2: Script Integration (10 lines)
- Add Script component to `src/app/layout.tsx`
- Conditional rendering based on env var
- Test script loads (check Network tab)

### Phase 3: App Router Tracking (20 lines)
- Create `src/components/analytics/goatcounter-tracker.tsx`
- Add to root layout
- Test navigation tracking (check GoatCounter dashboard)

### Phase 4: Validation (Manual Testing)
- Verify page views tracked on GoatCounter dashboard
- Test client navigation (dashboard → orders → service)
- Verify excluded routes not tracked (/api/*, /_next/*)

### Phase 5: Documentation (Update CLAUDE.md)
- Add GoatCounter setup instructions
- Document analytics philosophy (Level 1 vs Level 2+)
- Include troubleshooting guide

## Performance Impact

**Script Size:** 3.5KB (compressed)
**Loading Strategy:** `afterInteractive` (non-blocking)
**Network Requests:** 1 request per page view (async)
**Estimated Impact:** <50ms per page load

**Benchmark Target:** No perceptible performance degradation (Lighthouse score unchanged)

## Privacy Compliance

**Data Collected:**
- Page URL (pathname only, no query params with sensitive data)
- Timestamp
- Referrer (where user came from)
- User agent (browser/device type)
- Screen size

**Data NOT Collected:**
- Personal identifiers (email, name, user ID)
- IP addresses (anonymized by GoatCounter)
- Cookies (GoatCounter doesn't use cookies)
- Form inputs
- Click tracking

**GDPR Compliance:** No consent banner required (GoatCounter doesn't track personal data)

## Testing Strategy

### Manual Testing Checklist
- [ ] Script loads in production build (`npm run build && npm start`)
- [ ] Initial page view tracked on GoatCounter dashboard
- [ ] Client-side navigation tracked (SPA routing)
- [ ] Dashboard pages tracked (after authentication)
- [ ] API routes NOT tracked
- [ ] Local development: analytics disabled (no env var)

### Validation Tools
- GoatCounter dashboard: Real-time pageview monitoring
- Browser DevTools Network tab: Verify 1 request per navigation
- Lighthouse: Performance score unchanged

## Future Considerations (Level 2+)

**Level 2 Analytics (Custom Events):**
- Track RFQ submissions (event: `rfq_submitted`)
- Track quote approvals (event: `quote_approved`)
- Track service searches (event: `service_search`)

**Level 3 Analytics (User Segmentation):**
- Separate dashboards for CLIENT vs LAB_ADMIN vs ADMIN
- Funnel analysis (service view → RFQ → quote → approval)
- A/B testing infrastructure

**Not Planned:**
- User identification (privacy violation)
- Cross-device tracking (not needed for B2B)
- Behavioral profiling (not aligned with privacy-first approach)

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| GoatCounter service downtime | Low | Low | Analytics non-critical; async loading prevents blocking |
| Free tier limit exceeded (100k views/month) | Low | Medium | Monitor usage; paid tier is $15/month if needed |
| Script loading errors | Low | Low | Wrap in error boundary; graceful degradation |
| Privacy concerns from users | Very Low | Low | Publish privacy policy; GoatCounter is GDPR-compliant |

## Success Criteria

**Acceptance Criteria:**
- ✅ Page views tracked on GoatCounter dashboard within 5 minutes
- ✅ Navigation tracking works for SPA routing
- ✅ Zero performance impact (Lighthouse score unchanged)
- ✅ Privacy-friendly (no GDPR banner required)
- ✅ Documentation complete in CLAUDE.md

**Metrics:**
- Implementation time: <2 hours
- Lines of code: <40 total
- Performance overhead: <50ms per page

## Decision Outcome

**Status:** APPROVED

**Rationale:**
- GoatCounter meets all privacy and performance requirements
- Minimal implementation complexity (<40 lines total)
- Free tier sufficient for Stage 1-2 growth (15-20 labs)
- No GDPR compliance burden

**Next Steps:**
1. Create GoatCounter account (pipetgo.goatcounter.com)
2. Implement Phases 1-3 (environment, script, tracking)
3. Test on development build
4. Deploy to production
5. Monitor for 1 week to validate data accuracy

---

**References:**
- GoatCounter Documentation: https://www.goatcounter.com/help
- Next.js Script Optimization: https://nextjs.org/docs/app/building-your-application/optimizing/scripts
- Privacy-Friendly Analytics Guide: https://remybeumier.be/blog/get-web-analytics-in-nextjs-with-goatcounter

**Version:** 1.0
**Last Updated:** 2025-11-08
