# Admin Powers & Privacy Implementation Plan

## Goal Description
Implement critical administrative capabilities, user registration, and privacy/security compliance features as requested in `ADR_ADMIN_POWERS_ENHANCEMENT.md` and `PRIVACY_SECURITY_CHECKLIST.md`.
**Focus:** Enabling Admin control over Lab onboarding (approval/rejection) and ensuring DPA compliance.

## User Review Required
> [!IMPORTANT]
> **Missing Registration Flow:** The codebase currently has NO user registration UI or API. Users are only created via seeding. This plan includes building the Request/Signup flow from scratch as a prerequisite for "Lab Approval".

> [!WARNING]
> **Database Changes:** Schema updates included below are non-destructive but require a migration.
> - `LabStatus` enum added.
> - `AuditLog` model added.

## Policies
> [!IMPORTANT]
> **Timestamping Rule:**
> - **Source Code:** All new files must include an inline header with Author/Date.
> - **Documentation:** All new documentation files must include `YYYYMMDD` in the filename (e.g., `DOC_NAME_20260130.md`).

## Proposed Changes

### 1. Database Schema
#### [MODIFY] [schema.prisma](file:///home/finch/repos/pipetgo/prisma/schema.prisma)
- Add `LabStatus` enum (`PENDING_APPROVAL`, `ACTIVE`, `REJECTED`, etc.)
- Add `AuditLog` model.
- Update `Lab` model with status fields.
- Update `User` model with disable/suspension fields.

### 2. Authentication & Registration (Prerequisite)
#### [NEW] `src/app/auth/register/page.tsx`
- Create registration form using `src/lib/validations/auth.ts` schema.
- Support "Client" vs "Lab" registration modes.

#### [NEW] `src/app/api/auth/register/route.ts`
- Handle user creation.
- Enforce `PENDING_APPROVAL` status for new Labs.

### 3. Admin Powers (P0 & P1)
#### [NEW] `src/app/dashboard/admin/labs/page.tsx`
- List all labs with status filters.
- Actions: Approve, Reject, Suspend, Reactivate.

#### [NEW] `src/app/dashboard/admin/users/page.tsx`
- User management interface.

#### [NEW] `src/lib/admin-actions.ts`
- Server actions for executing admin commands (e.g., `approveLab`, `suspendUser`).
- **Must** create `AuditLog` entries for every action.

### 4. Codebase Maintenance (General Review)
#### [DELETE] `src/lib/db-mock.ts`
- Remove unused mock database file.
- Clean up `src/lib/db.ts` to remove unused "Dual-Mode" logic.

#### [REFACTOR] `src/lib/http-client.ts`
- Extract `fetchWithTimeout` from `src/app/page.tsx` into a reusable utility.

### 5. Security & Privacy
#### [NEW] `src/middleware.ts`
- Implement rate limiting using `src/lib/rate-limit.ts`.
- Apply strict CSP and security headers.

#### [MODIFY] [next.config.mjs](file:///home/finch/repos/pipetgo/next.config.mjs)
- Configuring security headers (HSTS, X-Frame-Options).

#### [NEW] `src/app/api/user/data/route.ts`
- Endpoint for "Right to Access" (Data Export).
- Endpoint for "Right to Erasure" (Account Deletion request).

## Verification Plan

### Automated Tests
- **Schema Validation:** `npx prisma validate`
- **Registration Flow:**
    - Use Browser Tool to navigate to `/auth/register`.
    - Submit form as Client -> Verify auto-login/success.
    - Submit form as Lab -> Verify "Pending Approval" message.
- **Admin Actions:**
    - Log in as Seeded Admin (`admin@pipetgo.com`).
    - Approve the pending lab.
    - Verify `AuditLog` entry created via database query.

### Manual Verification
- **Security Headers:** Inspect response headers on main page.
- **Rate Limiting:** Spam login endpoint and verify 429 response.
