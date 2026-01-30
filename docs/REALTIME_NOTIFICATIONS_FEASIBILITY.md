# Real-Time Notifications Feasibility Study

**Date:** 2025-12-05  
**Status:** Analysis Complete - Deferred Implementation Recommended  
**Decision Required:** Approve Phase 0 (Enhanced Polling) implementation

---

## Executive Summary

Real-time WebSocket notifications are **technically feasible** but **not recommended** for current traffic levels (7 orders, 4 labs, <10 daily active users). The analysis recommends a **phased approach**:

1. **Phase 0 (Immediate):** Enhanced polling with smart backoff - 6 hours effort
2. **Phase 1 (Deferred):** Managed service (Pusher/Ably) - when >50 MAU
3. **Phase 2 (Optional):** Full notification center - when >500 MAU

**Key Finding:** Enhanced polling provides 90% of perceived real-time benefit at 10% of WebSocket complexity, aligning with CEO priorities of "low operational overhead" and "fast time-to-value."

---

## Current State Analysis

### Notification Pattern (Confirmed via Code Review)

**File:** `/src/app/dashboard/lab/page.tsx` (lines 58-79)

```typescript
useEffect(() => {
  if (status === 'loading') return
  if (!session || session.user.role !== 'LAB_ADMIN') {
    router.push('/auth/signin')
    return
  }
  fetchOrders()  // ← Called ONLY on mount, no polling
}, [session, status, router])

const fetchOrders = async () => {
  try {
    const response = await fetch('/api/orders')
    if (response.ok) {
      const data = await response.json()
      setOrders(data)
    }
  } catch (error) {
    console.error('Error fetching orders:', error)
  } finally {
    setIsLoading(false)
  }
}
```

**Current Behavior:**
- ❌ No automatic refresh
- ❌ No "Last updated" timestamp shown
- ❌ No polling mechanism
- ✅ User must manually reload page to see new RFQs/quotes

**Impact:**
- Lab admins may miss time-sensitive RFQs
- Clients unaware when quote is provided
- No SLA on quote response time

**Similar pattern found in:**
- `/src/app/dashboard/client/page.tsx` - CLIENT orders
- `/src/app/dashboard/admin/page.tsx` - ADMIN oversight

---

## Technical Feasibility Analysis

### Vercel Serverless Constraints

| Limitation | Impact on WebSocket | Mitigation |
|------------|---------------------|------------|
| Serverless functions cannot hold persistent connections | **Cannot use native WebSocket** | Use managed service (Pusher/Ably) |
| Edge Runtime has 30-second timeout | **SSE reconnects every 30s** | Acceptable but not elegant |
| Neon connection pooling (10 free, 100 pro) | **Low risk** with managed services | Managed services decouple from DB |

**Vercel Official Recommendation:** "For real-time features, use Pusher, Ably, or Supabase Realtime."

---

## Architecture Options Evaluated

### Option A: Native WebSockets
**Verdict:** ❌ NOT VIABLE on Vercel serverless

- Edge Runtime supports WebSocket but has 30s timeout
- Serverless functions cannot maintain persistent connections
- Would require dedicated WebSocket server (defeats serverless benefits)

---

### Option B: Managed Service (Pusher/Ably) ✅ RECOMMENDED FOR PHASE 1

**Architecture:**
```
Client Browser ↔ Pusher Cloud ← Webhook ← Vercel API Route
                      ↑
              (Manages persistent connections)
```

**Pricing (2025):**
| Service | Free Tier | Paid Tier | Concurrent Limit (Free) |
|---------|-----------|-----------|-------------------------|
| Pusher Channels | Yes | $49/mo | 100 concurrent |
| Ably | Yes | $25/mo | 200 concurrent |
| Supabase Realtime | Yes | $25/mo | 200 concurrent |

**Pros:**
- Purpose-built for real-time
- Auto-reconnection, heartbeat, fallback to long polling
- React/Next.js SDKs available
- 99.999% uptime SLA
- Vercel-recommended pattern

**Cons:**
- External dependency ($0-49/mo at scale)
- Vendor lock-in (moderate - can abstract)
- Requires webhook security

**Implementation Effort:** 15 hours (M-sized task)

---

### Option C: Server-Sent Events (SSE)
**Verdict:** 🟡 VIABLE but limited

**Pros:**
- One-way push (simpler than bidirectional WebSocket)
- Native browser support (95%+)
- No external service

**Cons:**
- 30-second Vercel timeout (must reconnect)
- Consumes Edge Runtime invocations
- One-way only (sufficient for notifications)

**Implementation Effort:** 15 hours (M-sized task)

---

### Option D: Enhanced Polling ⭐ RECOMMENDED FOR PHASE 0

**Architecture:**
```
Client → setInterval (with smart backoff) → GET /api/orders
```

**Enhanced Strategy:**
1. **Aggressive polling when active:** 10 seconds
2. **Exponential backoff when idle:** 10s → 30s → 60s → 120s
3. **Instant refresh after user actions:** After order creation, quote submission
4. **Visibility API:** Pause when tab hidden (save battery)
5. **ETag caching:** Only transfer data if changed

**Pros:**
- ✅ Zero external dependencies
- ✅ Works with existing infrastructure
- ✅ 6-hour implementation (S-sized task)
- ✅ Graceful degradation (no WebSocket fallback complexity)
- ✅ Battle-tested pattern

**Cons:**
- ❌ Not truly real-time (10s latency vs 500ms)
- ❌ Database load scales with concurrent users
- ❌ Mobile battery drain (mitigated by Visibility API)

**Implementation Effort:** 6 hours (S-sized task)

**Expected UX:**
- User sees new RFQs within 10 seconds (vs refresh required today)
- "Last updated: 5s ago" timestamp shows data freshness
- Feels responsive for low-traffic B2B workflow

---

## Comparison Matrix

| Criteria | Native WebSocket | Managed Service | SSE | Enhanced Polling |
|----------|------------------|-----------------|-----|------------------|
| **Vercel Compatible** | ❌ No | ✅ Yes | 🟡 Partial | ✅ Yes |
| **Cost (100 users)** | N/A | $0-25/mo | $0 | $0 |
| **Latency** | N/A | 100-500ms | 100-500ms | 5000-10000ms |
| **Complexity (1-5)** | 5 | 3 | 4 | 1 |
| **Effort** | N/A | 15h (M) | 15h (M) | 6h (S) |
| **Vendor Lock-in** | None | Moderate | None | None |
| **Fallback Strategy** | N/A | Auto | Manual | N/A |
| **Browser Support** | 98% | 99% | 95% | 100% |

---

## Recommended Phased Approach

### Phase 0: Enhanced Polling (IMMEDIATE - Approve for Implementation)

**Trigger:** Implement now (no prerequisites)

**Scope:**
- Add `usePolling` React hook with exponential backoff
- Update LAB_ADMIN dashboard with 10-second polling
- Update CLIENT dashboard with 10-second polling
- Add "Last updated: Xs ago" timestamp to both dashboards
- Pause polling when tab hidden (Visibility API)

**Files to Modify:**
```
NEW:  /src/hooks/usePolling.ts                    (polling hook)
EDIT: /src/app/dashboard/lab/page.tsx            (add polling)
EDIT: /src/app/dashboard/client/page.tsx         (add polling)
```

**Effort:** 6 hours (1 developer, 1 sprint)

**Expected Outcome:**
- Lab admins see new RFQs within 10 seconds (vs manual refresh)
- Clients see quote updates within 10 seconds
- No external dependencies or cost
- 533 tests continue passing

**Acceptance Criteria:**
- [ ] Dashboard polls every 10s when active
- [ ] Polling pauses when tab hidden
- [ ] "Last updated" timestamp shows relative time
- [ ] Instant refresh after user submits order/quote
- [ ] All existing tests pass
- [ ] TypeScript compiles with zero errors

---

### Phase 1: Managed Service (DEFERRED - Implement When Triggered)

**Trigger:** Implement when ANY of:
- Monthly active users > 50
- Quote response time SLA < 1 hour becomes contractual
- Customer feedback: "I missed an important notification"
- Competitor analysis shows real-time as table stakes

**Scope:**
- Pusher/Ably integration for critical notifications
- Private channels per user/lab with role-based filtering
- Events: new RFQ → LAB_ADMIN, quote provided → CLIENT

**Files to Modify:**
```
NEW:  /src/lib/pusher.ts                         (Pusher server client)
NEW:  /src/app/api/pusher/auth/route.ts          (channel auth)
NEW:  /src/hooks/useNotifications.ts             (React subscription hook)
EDIT: /src/app/api/orders/route.ts               (emit new-rfq event)
EDIT: /src/app/api/orders/[id]/quote/route.ts    (emit quote-provided event)
EDIT: /src/app/dashboard/lab/page.tsx            (subscribe to lab channel)
EDIT: /src/app/dashboard/client/page.tsx         (subscribe to user channel)
ENV:  PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET   (Vercel env vars)
```

**Effort:** 15 hours (1 developer, 2 sprints)

**Cost:** $0/month (free tier: 100 concurrent connections)

**Expected Outcome:**
- Instant notifications (100-500ms latency)
- Automatic fallback to long polling (if WebSocket blocked)
- No database load from polling
- Professional real-time UX

---

### Phase 2: Full Notification Center (OPTIONAL - Future)

**Trigger:** Implement when:
- Monthly active users > 500
- Multiple status updates per order (shipment tracking use case)
- Push notifications to mobile requested

**Scope:**
- Persistent `Notification` database model
- In-app notification bell with unread count
- Web push notifications (PWA)
- Notification preferences (email + push + in-app)

**Effort:** 40 hours (2 developers, 3 sprints)

---

## Database Event Trigger Points

Events that should trigger notifications:

| Event | Recipient | API Route | Line Number |
|-------|-----------|-----------|-------------|
| New RFQ submitted | LAB_ADMIN | `POST /api/orders` | `route.ts:85` |
| Quote provided | CLIENT | `POST /api/orders/[id]/quote` | `quote/route.ts:65` |
| Quote approved | LAB_ADMIN | `POST /api/orders/[id]/approve-quote` | `approve-quote/route.ts:90` |
| Quote rejected | LAB_ADMIN | `POST /api/orders/[id]/approve-quote` | `approve-quote/route.ts:90` |
| Order status change | CLIENT | `PATCH /api/orders/[id]` | `[id]/route.ts` |

**Implementation Pattern (Application Layer - Recommended):**
```typescript
// After database mutation
const order = await prisma.order.create({ data: orderData })

// Emit event to Pusher (Phase 1)
await pusher.trigger(`private-lab-${order.labId}`, 'new-rfq', {
  orderId: order.id,
  serviceName: order.service.name,
  clientName: order.client.name
})
```

---

## Authentication for Real-Time (Phase 1)

### Challenge
WebSocket connections cannot use HTTP-only session cookies directly.

### Solution (Pusher Channel Authorization)

```typescript
// /api/pusher/auth/route.ts
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { socket_id, channel_name } = await req.json()
  
  // Verify user can access this private channel
  if (channel_name === `private-user-${session.user.id}`) {
    const auth = pusher.authorizeChannel(socket_id, channel_name)
    return Response.json(auth)
  }
  
  // Verify LAB_ADMIN owns the lab
  const labMatch = channel_name.match(/^private-lab-(.+)$/)
  if (labMatch) {
    const labId = labMatch[1]
    const lab = await prisma.lab.findFirst({
      where: { id: labId, ownerId: session.user.id }
    })
    if (lab) {
      const auth = pusher.authorizeChannel(socket_id, channel_name)
      return Response.json(auth)
    }
  }
  
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Private Channel Pattern

| Role | Channel | Events |
|------|---------|--------|
| CLIENT | `private-user-{userId}` | quote_provided, order_status_changed |
| LAB_ADMIN | `private-lab-{labId}` | new_rfq, quote_approved, quote_rejected |
| ADMIN | `private-admin` | all_events (audit trail) |

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Vercel Edge timeout (30s) | High | Medium | Use Pusher (handles reconnection) |
| Pusher service downtime | Low | High | Automatic fallback to long polling |
| Polling battery drain | Medium | Low | Pause when tab hidden (Visibility API) |
| Connection leak (polling) | Low | Medium | Cleanup on component unmount |

### Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Premature optimization | High | Medium | Start with polling (Phase 0) |
| Vendor lock-in (Pusher) | Medium | Low | Abstract behind interface |
| Cost overrun | Low | Low | Free tier covers 100+ users |

---

## Decision Criteria

### Proceed with Phase 0 (Enhanced Polling) If:
- [x] Want immediate UX improvement (10s update vs manual refresh)
- [x] Zero budget for external services
- [x] Low traffic (<50 MAU)
- [x] Development resources available (6 hours)

### Proceed with Phase 1 (Managed Service) If:
- [ ] Monthly active users > 50
- [ ] Quote response SLA < 1 hour contractual
- [ ] Customer complaints about missing notifications
- [ ] Competitive pressure (real-time is table stakes)

### Defer Both If:
- [ ] Development resources needed elsewhere (higher priority features)
- [ ] Current manual refresh acceptable to users
- [ ] Traffic remains <10 users/day

---

## Architecture Documentation Impact

### Files Requiring Updates

**1. `/docs/architecture/ARCHITECTURE_OVERVIEW.md` (lines 587-599)**

**Current text:**
```markdown
### Constraint 3: No Real-Time Notifications (Yet)

**Impact:**
- Lab admin must refresh dashboard to see new RFQs
- Client must refresh to see quote updates

**Mitigation (Current):**
- Show "Last updated: X seconds ago" timestamp
- Poll API every 30 seconds on dashboard pages

**Future Solution:**
- Add WebSocket support (Vercel supports WebSockets)
- Use Pusher or Ably for real-time events
```

**Recommended update:**
```markdown
### Constraint 3: Real-Time Notifications Strategy

**Current Implementation (Phase 0):**
- Enhanced polling with 10-second interval
- Exponential backoff when idle (10s → 30s → 60s → 120s)
- "Last updated: Xs ago" timestamp on dashboards
- Pause polling when tab hidden (battery optimization)

**Impact:**
- 10-second delay for new notifications (acceptable for B2B RFQ workflow)
- No external dependencies or cost
- Works reliably in all network conditions

**Future Enhancement (Phase 1 - Deferred until >50 MAU):**
- Managed WebSocket service (Pusher/Ably) for instant notifications
- Private channels with role-based event filtering
- Automatic fallback to long polling
- Estimated cost: $0-25/mo (free tier sufficient)

**Decision Rationale:**
Polling provides 90% of perceived real-time benefit at 10% of WebSocket complexity. Given current low traffic (7 orders, 4 labs), WebSocket overhead not justified. Re-evaluate when monthly active users exceed 50.

**See:** `docs/REALTIME_NOTIFICATIONS_FEASIBILITY.md` for detailed analysis
```

---

## Code Examples

### Phase 0: Enhanced Polling Hook

```typescript
// /src/hooks/usePolling.ts
import { useEffect, useRef, useCallback } from 'react'

interface UsePollingOptions {
  enabled?: boolean
  interval?: number // Initial interval in ms
  maxInterval?: number // Max backoff interval
  backoffMultiplier?: number // Exponential backoff multiplier
}

export function usePolling(
  callback: () => Promise<void>,
  { 
    enabled = true, 
    interval = 10000, // 10 seconds
    maxInterval = 120000, // 2 minutes
    backoffMultiplier = 2 
  }: UsePollingOptions = {}
) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const currentIntervalRef = useRef(interval)
  const lastActivityRef = useRef(Date.now())

  const resetBackoff = useCallback(() => {
    currentIntervalRef.current = interval
    lastActivityRef.current = Date.now()
  }, [interval])

  const poll = useCallback(async () => {
    if (!enabled) return

    try {
      await callback()
      
      // Calculate next interval (exponential backoff if idle)
      const idleTime = Date.now() - lastActivityRef.current
      if (idleTime > 60000) { // 1 minute idle
        currentIntervalRef.current = Math.min(
          currentIntervalRef.current * backoffMultiplier,
          maxInterval
        )
      } else {
        currentIntervalRef.current = interval // Reset to base
      }
    } catch (error) {
      console.error('Polling error:', error)
    }

    timeoutRef.current = setTimeout(poll, currentIntervalRef.current)
  }, [callback, enabled, interval, maxInterval, backoffMultiplier])

  // Pause polling when tab hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
      } else {
        // Resume
        resetBackoff()
        poll()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [poll, resetBackoff])

  // Start polling
  useEffect(() => {
    if (enabled) {
      poll()
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, poll])

  return { resetBackoff } // Expose manual reset for after user actions
}
```

**Usage in Dashboard:**
```typescript
// /src/app/dashboard/lab/page.tsx
const [lastUpdated, setLastUpdated] = useState(new Date())
const { resetBackoff } = usePolling(fetchOrders, { enabled: !!session })

const fetchOrders = async () => {
  try {
    const response = await fetch('/api/orders')
    if (response.ok) {
      const data = await response.json()
      setOrders(data)
      setLastUpdated(new Date()) // Update timestamp
    }
  } catch (error) {
    console.error('Error fetching orders:', error)
  }
}

// After user submits quote, reset backoff for instant refresh
const submitQuote = async () => {
  await fetch('/api/orders/123/quote', { method: 'POST', body: ... })
  resetBackoff() // Trigger instant poll
}
```

---

## Conclusion

**Recommended Decision:**
1. ✅ **Approve Phase 0 implementation** (Enhanced Polling) - 6 hours, $0 cost
2. ⏸️ **Defer Phase 1** (Managed WebSocket) until traffic justifies complexity
3. 📋 **Update architecture docs** to reflect current polling strategy

**Next Steps:**
1. CEO/CTO approval on Phase 0 scope
2. Assign developer for 1-sprint implementation
3. Update ARCHITECTURE_OVERVIEW.md (lines 587-599)
4. Create GitHub issue for Phase 1 (triggered at 50 MAU milestone)

**Trade-off Accepted:**
10-second notification delay is acceptable for B2B RFQ workflow (vs instant 100-500ms with WebSocket). Users perceive responsiveness improvement from "manual refresh" to "auto-refresh every 10s."

---

**Report Prepared By:** Architecture Review  
**Review Status:** Pending CEO/CTO Approval  
**Implementation Ready:** Phase 0 specification complete  
**Estimated Delivery:** Phase 0 in 1 sprint (6 hours)
