# Portfolio Screenshots - PipetGo MVP

Comprehensive user flow screenshots for portfolio and documentation purposes.

## Automated Capture

Screenshots are captured using Playwright automation with NextAuth authentication.

**Prerequisites:**
1. Development server running: `npm run dev`
2. Database seeded with demo data: `npm run db:seed`
3. Playwright installed: `npm install` (already in devDependencies)

**Capture Command:**
```bash
npm run screenshots:portfolio
```

**Script Location:** `/scripts/capture-portfolio-screenshots.js`

## Screenshot Flows

### Flow 1: Client RFQ Workflow (Quote Required Service)

Demonstrates the B2B quotation workflow for services requiring custom pricing.

| # | Filename | Description |
|---|----------|-------------|
| 01 | `01-homepage-unauthenticated.png` | Homepage showing service catalog (unauthenticated) |
| 02 | `02-signin-page.png` | Sign in page with demo accounts |
| 03 | `03-client-dashboard-empty.png` | Client dashboard (empty - no orders yet) |
| 04 | `04-service-catalog.png` | Service catalog (authenticated client view) |
| 05 | `05-quote-required-service.png` | Quote required service detail page |
| 06 | `06-rfq-form.png` | RFQ form filled with sample data |
| 07 | `07-rfq-submitted.png` | RFQ submission confirmation |
| 08 | `08-client-dashboard-pending-quote.png` | Client dashboard showing pending RFQ (awaiting quote) |

**User Story:**
> Maria Santos (client@example.com) needs fatty acid composition analysis for her instant noodle product. The service requires a custom quote, so she submits an RFQ with sample details and special instructions about expedited timeline for product launch.

### Flow 2: Lab Admin Provide Quote

Demonstrates lab admin reviewing RFQ and providing custom pricing.

| # | Filename | Description |
|---|----------|-------------|
| 09 | `09-lab-signin.png` | Sign in page (returning to sign in as lab admin) |
| 10 | `10-lab-dashboard-rfqs.png` | Lab admin dashboard showing incoming RFQs |
| 11 | `11-rfq-detail.png` | RFQ detail page (lab admin view) |
| 12 | `12-quote-form.png` | Quote form filled with pricing |
| 13 | `13-quote-submitted.png` | Quote submission confirmation |
| 14 | `14-lab-dashboard-quote-sent.png` | Lab dashboard after quote provision |

**User Story:**
> Metro Manila Testing Lab (lab@testinglab.com) receives Maria's RFQ for fatty acid analysis. The lab admin reviews the requirements, considers the complexity (full fatty acid profile including trans fats), and provides a quote of ₱8,500 with 5-day turnaround. Rush service is available for +20% if needed by Nov 25.

### Flow 3: Fixed Rate Service (Instant Booking)

Demonstrates instant booking for services with fixed pricing (no quotation needed).

| # | Filename | Description |
|---|----------|-------------|
| 15 | `15-fixed-rate-service.png` | Fixed rate service detail (shows instant booking price) |
| 16 | `16-instant-booking-form.png` | Instant booking form with fixed price |
| 17 | `17-instant-booking-confirmed.png` | Instant booking confirmation |

**User Story:**
> Maria also needs pH testing for quality control, which has a fixed price of ₱500 per sample. She can instantly book this service without waiting for a quote, providing faster turnaround for simple, standardized tests.

### Flow 4: Multi-Lab Catalog Overview

Demonstrates marketplace breadth with services from multiple certified labs.

| # | Filename | Description |
|---|----------|-------------|
| 18 | `18-service-catalog-all-labs.png` | Full catalog showing services from multiple labs |
| 19 | `19-service-categories.png` | Diverse service categories across labs |

**User Story:**
> The PipetGo marketplace connects clients with 4 ISO 17025 certified laboratories across Metro Manila, offering 47 diverse services spanning food safety, chemical analysis, environmental testing, and more. Clients can compare labs, pricing modes, and turnaround times in one unified platform.

## Demo Accounts

Used in automated screenshot capture:

| Account | Email | Role | Description |
|---------|-------|------|-------------|
| Client | `client@example.com` | CLIENT | Maria Santos (manufacturing company) |
| Lab Admin | `lab@testinglab.com` | LAB_ADMIN | Metro Manila Testing Laboratory |
| Platform Admin | `admin@pipetgo.com` | ADMIN | System administrator |

Additional lab accounts (for catalog diversity):
- `lab2@chempro.com` - Chempro Analytical
- `lab3@eurofins.com` - Eurofins Philippines
- `lab4@intertek.com` - Intertek Makati

## Technical Details

**Viewport:** 1920x1080 (desktop)
**Browser:** Chromium (Playwright)
**Authentication:** NextAuth credentials provider (email-only for MVP)
**Animation Delay:** 1000ms (ensures loading states complete)
**Network Idle:** Waits for all network requests to complete before screenshot

## Usage in Documentation

These screenshots are used in:
- Portfolio presentations (Behance, Dribbble)
- Case studies demonstrating B2B marketplace UX
- Product documentation and user guides
- Investor presentations and pitch decks
- Developer onboarding materials

## Maintenance

Re-run screenshot capture when:
- UI components receive significant updates
- New features are added to user flows
- Branding/styling changes occur
- Demo data is updated with new services/labs

**Important:** Always ensure development server is running and database is seeded before running screenshot script.

---

**Last Updated:** 2025-11-17
**Script Version:** 1.0
**Total Screenshots:** 19
