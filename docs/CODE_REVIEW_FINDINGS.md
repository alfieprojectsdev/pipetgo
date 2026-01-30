# Code Review Findings

**Reviewer:** gemini/antigravity
**Date:** 2026-01-30

## Overview
This document summarizes the gaps between the current codebase and the requirements outlined in `ADR_ADMIN_POWERS_ENHANCEMENT.md` and `PRIVACY_SECURITY_CHECKLIST.md`.

## 1. Database Schema (`prisma/schema.prisma`)
### Missing Models & Enums
- [ ] `LabStatus` enum is missing.
- [ ] `AuditLog` model is missing.

### Missing Fields
- [ ] `Lab` model:
    - `status`
    - `statusChangedAt`
    - `statusChangedBy`
    - `rejectionReason`
    - `suspensionReason`
    - `terminationDate`
- [ ] `User` model:
    - `disabled`
    - `disabledAt`
    - `disabledBy`
    - `disabledReason`

## 2. Authentication & Authorization
- [ ] **Registration Flow:**
    - **CRITICAL:** No user registration implementation exists (Check for `src/app/auth/register` failed).
    - `src/lib/validations/auth.ts` contains `signUpSchema`, indicating intent.
    - `prisma/seed.ts` creates users, but no UI/API allows public signup.
    - ADR Requirement "Labs are auto-approved on signup" cannot be verified as signup doesn't exist.
- [ ] **Admin Access:**
    - Admin role exists in Schema/Seed.
    - No Admin Dashboard UI found for managing labs (needs confirmation via file listing of `src/app/dashboard`, but likely missing based on prompt).

## 3. Security
- [ ] **Rate Limiting:**
    - `src/lib/rate-limit.ts` exists.
    - **Missing:** Endpoint usage of rate limiter (needs verification).
    - **Missing:** `middleware.ts` for global protection.
- [ ] **Headers:**
    - `next.config.js`/`mjs` needs review for security headers (HSTS, CSP).
- [ ] **Audit Logging:** No mechanism currently exists.

## 4. Privacy
- [ ] **Data Export:** No endpoint found.
- [ ] **Account Deletion:** No endpoint found.
- [ ] **Privacy Policy/TOS:** Missing pages.

## 5. General Codebase Recommendations (New)
### Architecture & Patterns
- [ ] **Dead Code Cleanup:** `src/lib/db-mock.ts` and the "Dual-Mode" logic in `src/lib/db.ts` appear unused. Recommend removing to reduce confusion.
- [ ] **API Security:** `src/app/api/services/route.ts` implements good Role/Ownership checks, but **lacks rate limiting**.
- [ ] **Resiliency:** `src/app/page.tsx` uses an inline `fetchWithTimeout`. This should be extracted to `src/lib/http.ts` or a custom hook for reusability.

### UI/UX
- [ ] **Components:** `src/components/ui` follows standard shadcn patterns (Good).
- [ ] **Error Handling:** Dashboard uses `ErrorBoundary` (Good).

### Security (Code Level)
- [ ] **Rate Limiting:** `src/lib/rate-limit.ts` is implemented but **NOT USED** in any API route checked. This is a critical gap.

