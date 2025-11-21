# ADR: Admin Powers Enhancement

**Date:** 2025-11-21
**Status:** Proposed - Awaiting CEO Review
**Author:** Development Team
**Stakeholder:** CEO (Sister)

---

## Context

CEO raised concerns about data privacy, security, and administrative control over the platform:

> "I'm thinking of data privacy and security... By the way as admin, I'm assuming I have control as to who gets approved as vendor right?"

**Current State:**
- ADMIN role exists but is limited to read-only monitoring
- Admin dashboard shows order statistics, user counts, lab counts
- No ability to approve/reject labs (labs are auto-approved on signup)
- No ability to suspend or remove problematic users/labs
- No audit trail for administrative actions

**Problem:**
A B2B marketplace handling sensitive business data and financial transactions requires:
1. Vendor (lab) quality control - admins must approve who can sell services
2. User safety controls - ability to remove bad actors
3. Audit compliance - especially for Philippine Data Privacy Act
4. Operational oversight - handle disputes, review transactions

---

## Decision

Implement a tiered admin powers system with clear prioritization for MVP launch.

### P0 - Critical for Launch (Week 1-2)

#### 1. Lab Approval Workflow
**Current:** Labs auto-approved on signup → **New:** Labs require admin approval

| Action | Description | Database Change |
|--------|-------------|-----------------|
| Approve Lab | Enable lab to list services, appear in catalog | `Lab.status` = `ACTIVE` |
| Reject Lab | Deny application with reason | `Lab.status` = `REJECTED`, `rejectionReason` |
| Request Info | Ask lab for additional documents | `Lab.status` = `PENDING_INFO` |

**Lab Status Enum:**
```prisma
enum LabStatus {
  PENDING_APPROVAL  // Just registered, awaiting admin review
  PENDING_INFO      // Admin requested additional information
  ACTIVE            // Approved, can operate normally
  SUSPENDED         // Temporarily disabled (can be reactivated)
  TERMINATED        // Permanently removed
  REJECTED          // Application denied
}
```

#### 2. Lab Suspension
**Purpose:** Handle complaints, investigate issues, temporary freeze

| Action | Effect | Reversible |
|--------|--------|-----------|
| Suspend Lab | Hide from catalog, pause new orders, existing orders continue | Yes |
| Reactivate Lab | Restore normal operations | N/A |

#### 3. Lab Termination
**Purpose:** Permanently remove bad actors from platform

| Action | Effect | Reversible |
|--------|--------|-----------|
| Terminate Lab | Permanently disable, handle pending orders gracefully | No |

**Graceful Termination Process:**
1. Notify lab of termination (with reason)
2. Notify affected clients with pending orders
3. Cancel pending quotes (refund if payment taken)
4. Complete in-progress orders (or transfer to another lab)
5. Archive lab data (retain for compliance, hide from UI)

---

### P1 - Important for Operations (Week 3-4)

#### 4. User Management
| Action | Description |
|--------|-------------|
| View All Users | List all users with role, registration date, activity |
| Disable User | Prevent login, keep data for audit trail |
| View User Activity | See orders, quotes submitted by user |

#### 5. Order Oversight
| Action | Description |
|--------|-------------|
| View All Orders | Full order list with filters (status, date, lab, client) |
| View Order Details | Complete order info including client/lab details |
| Cancel Order | Admin cancellation for disputes (with reason) |
| Add Admin Note | Internal notes on orders for dispute tracking |

#### 6. Audit Trail
| What to Log | Details |
|-------------|---------|
| Admin Actions | Who did what, when, to whom |
| Status Changes | Lab approval/suspension/termination |
| Order Interventions | Admin cancellations, modifications |
| Login History | Admin login times, IPs |

**Audit Log Schema:**
```prisma
model AuditLog {
  id          String   @id @default(cuid())
  adminId     String   // Who performed action
  action      String   // e.g., "LAB_APPROVED", "USER_DISABLED"
  targetType  String   // e.g., "Lab", "User", "Order"
  targetId    String   // ID of affected entity
  details     Json?    // Additional context (reason, before/after)
  ipAddress   String?  // For security audit
  createdAt   DateTime @default(now())

  admin       User     @relation(fields: [adminId], references: [id])
}
```

---

### P2 - Nice to Have (Post-Launch)

#### 7. Platform Settings
- Commission rate configuration
- Service category management
- Platform-wide announcements

#### 8. Analytics Export
- Download order reports (CSV/Excel)
- Revenue summaries
- Lab performance metrics

#### 9. Communication Tools
- Send announcements to all labs
- Send announcements to all clients
- Individual messaging for disputes

---

## Data Privacy Considerations

### Philippine Data Privacy Act (DPA) Compliance

| Requirement | Implementation |
|-------------|----------------|
| **Data Subject Rights** | Users can request data export, deletion |
| **Purpose Limitation** | Admin access only for platform operations |
| **Security Measures** | Audit logs, role-based access |
| **Breach Notification** | Admin tools to identify and report breaches |
| **Retention Limits** | Terminated labs archived, not deleted (for compliance) |

### Admin Data Access Controls

**What Admins CAN See:**
- User names, emails (for support/disputes)
- Order details (for oversight)
- Lab certifications (for verification)
- Payment status (for disputes)

**What Admins CANNOT Easily Do:**
- Bulk export user data (requires separate audit)
- Access raw database directly
- Delete audit logs
- Impersonate users

### Audit Log Retention
- **Active Records:** Indefinite (while platform operates)
- **Deleted User Data:** Anonymize after 5 years
- **Admin Actions:** Retain for 7 years (compliance)

---

## Implementation Notes

### Database Schema Changes

```prisma
// Update Lab model
model Lab {
  // ... existing fields ...
  status           LabStatus @default(PENDING_APPROVAL)
  statusChangedAt  DateTime?
  statusChangedBy  String?   // Admin who changed status
  rejectionReason  String?   // If rejected
  suspensionReason String?   // If suspended
  terminationDate  DateTime? // If terminated
}

// Add AuditLog model (see above)

// Update User model
model User {
  // ... existing fields ...
  disabled         Boolean   @default(false)
  disabledAt       DateTime?
  disabledBy       String?   // Admin who disabled
  disabledReason   String?
}
```

### API Endpoints Needed

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/labs` | GET | List all labs with status filter |
| `/api/admin/labs/[id]/approve` | POST | Approve lab application |
| `/api/admin/labs/[id]/reject` | POST | Reject lab application |
| `/api/admin/labs/[id]/suspend` | POST | Suspend lab |
| `/api/admin/labs/[id]/reactivate` | POST | Reactivate suspended lab |
| `/api/admin/labs/[id]/terminate` | POST | Terminate lab |
| `/api/admin/users` | GET | List all users |
| `/api/admin/users/[id]/disable` | POST | Disable user |
| `/api/admin/orders` | GET | List all orders |
| `/api/admin/audit-logs` | GET | View audit trail |

### UI Components Needed

1. **Lab Approval Queue** (`/dashboard/admin/labs/pending`)
   - List of pending lab applications
   - View lab details, certifications
   - Approve/Reject buttons

2. **Lab Management** (`/dashboard/admin/labs`)
   - All labs with status badges
   - Suspend/Reactivate/Terminate actions
   - Filter by status

3. **User Management** (`/dashboard/admin/users`)
   - All users with role badges
   - Disable/Enable actions
   - Activity history

4. **Audit Log Viewer** (`/dashboard/admin/audit`)
   - Searchable audit trail
   - Filter by action type, admin, date
   - Export capability

---

## Consequences

### Positive
- CEO has full control over platform vendors
- Bad actors can be quickly removed
- Compliance with Philippine Data Privacy Act
- Better dispute resolution capability
- Professional B2B platform trust signals

### Negative
- Additional development time (2-3 weeks for P0+P1)
- Admin workload increases (must approve labs)
- Need clear policies for approval/rejection criteria

### Risks
- Admin abuse (mitigated by audit logs)
- Slow approval times (mitigated by email notifications)
- Over-suspension (mitigated by requiring reasons)

---

## CEO Laundry List Template

**For CEO to fill in additional powers:**

### Additional Admin Powers I Want:
1. [ ] _________________________________
2. [ ] _________________________________
3. [ ] _________________________________
4. [ ] _________________________________
5. [ ] _________________________________

### Questions About Current Powers:
1. _________________________________
2. _________________________________

### Priority Adjustments:
- Move to P0: _________________________
- Move to P1: _________________________
- Remove entirely: ____________________

---

## Next Steps

1. **CEO Review:** Add to laundry list, approve priorities
2. **Privacy Checklist:** Create detailed DPA compliance checklist
3. **Implementation:** Start with P0 (Lab Approval Workflow)
4. **Testing:** Add admin scenarios to USER_TESTING_GUIDE.md

---

**Status:** Awaiting CEO review and laundry list additions
