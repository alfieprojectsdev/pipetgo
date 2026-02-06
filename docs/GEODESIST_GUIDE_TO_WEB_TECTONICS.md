# 🌍 A Geodesist's Guide to Web Tectonics (PipetGo)
**Subject:** Morphodynamics of the PipetGo Codebase
**Observer:** Senior Researcher (Nonlinear Dynamics / GNSS Background)
**Reference Frame:** ITRF-Next.js-14

---

## 1. Abstract
You have spent 15 years modeling the chaotic interaction of tectonic plates and filtering millimeter-level signals from noisy GNSS time series. Good news: Modern web development is just another complex dynamical system.

Instead of solving partial differential equations for stress accumulation, we are managing **state**.
Instead of filtering atmospheric delays from GPS signals, we are validating **input**.
Instead of modeling coseismic rupture, we are handling **asynchronous events**.

This guide maps the PipetGo architecture to the geophysical concepts you already mastered.

---

## 2. The Reference Frame: Next.js (The ITRF)

In geodesy, nothing makes sense without a defined coordinate system (like ITRF2014 or WGS84). In this repo, that reference frame is **Next.js 14 (App Router)**.

*   **The Grid (`src/app`):** This is your spatial domain. The file path determines the URL.
    *   `src/app/dashboard/page.tsx` maps directly to `pipetgo.com/dashboard`.
    *   Think of this as your grid nodes. If a file exists here, it is a discrete point where observation (rendering) occurs.
*   **Server Components ("The Secular Field"):**
    *   Most components are static "Server Components". They are rendered once on the server.
    *   *Analogy:* This is the secular velocity field. It's the stable, background deformation that doesn't change rapidly.
*   **Client Components ("Transient Signals"):**
    *   Files marked with `'use client'` are interactive.
    *   *Analogy:* These are the transient signals (post-seismic relaxation, seasonal loading). They change dynamically in the user's browser (Local Phase Space).

---

## 3. Constitutive Laws: Prisma (The Rheology)

How does the system deform under stress? The database defines the rigidity of our world.

*   **`prisma/schema.prisma` (The Green's Function):**
    *   This file defines the fundamental physics of our universe.
    *   `model User` or `model Order` are the rigid blocks.
    *   The *relations* between them (e.g., `orders Order[]`) are the coupling coefficients.
    *   *Warning:* Changing this file is like changing the rheology of the lithosphere. It requires a "Migration" (a tectonic reorganization) to apply.
*   **`src/lib/db.ts` (The Kalman Filter):**
    *   We don't query the raw data stream (SQL) directly. We use a singleton client (`prisma`).
    *   Think of this as a Kalman Filter state estimator. It provides a clean, typed interface to the underlying noisy state of the database.

---

## 4. Signal Processing: Zod (Multipath Reduction)

Input data from the internet is noisier than a cheap GPS receiver under a tree. It's full of multipath, cycle slips, and outliers.

*   **The Tool:** **Zod** (located in `src/lib/validations/` or inline in API routes).
*   **The Process:**
    ```typescript
    const validatedData = createOrderSchema.parse(body);
    ```
*   **Analogy:** This is your **Bernese GPS Software**.
    *   It takes the raw RINEX file (JSON body).
    *   It applies strict cutoffs (Validation rules).
    *   It throws out the outliers immediately.
    *   *Result:* Only "fixed solution" data enters your core logic.

---

## 5. Rupture Dynamics: The Order Flow

Let's analyze the propagation of a "Request for Quote" (RFQ) event. This is a classic nonlinear instability event.

**Source Code:** [src/app/api/orders/route.ts](../src/app/api/orders/route.ts)

1.  **Nucleation (The POST Request):**
    *   The client triggers an event. This is the hypocenter.
    *   *Constraint:* We immediately check `session.user.role`. If the user isn't authorized, the rupture creates a barrier (401 Unauthorized) and stops.

2.  **Propagation (Logic Branching):**
    *   The code bifurcates based on `pricingMode` (Line 52).
    *   **Trajectory A (FIXED):** The system jumps immediately to a stable `PENDING` attractor. (Instant booking).
    *   **Trajectory B (QUOTE_REQUIRED):** The system enters a metastable state `QUOTE_REQUESTED`. It waits for external forcing (Lab Admin input) to move to the next stable point.

3.  **Coseismic Offset (Database Write):**
    *   `prisma.order.create(...)`
    *   This permanently alters the stress field of the database. The system has evolved to a new state $t_{i+1}$.

---

## 6. Common Pitfalls (Aliasing & Unmodeled Errors)

### The "Dual-Mode" Anomaly
*   **Observation:** Tests run instantly with `npm run test:mock` but take seconds with `npm run test:live`.
*   **Explanation:**
    *   **Mock Mode:** Uses `pg-mem`. It's a synthetic model (like an elastic half-space). It's fast but lacks complexity.
    *   **Live Mode:** Uses real Postgres (Neon). It includes network latency, connection pooling limits, and real constraints.
    *   **Advice:** Don't trust the synthetic model blindly. Always validate your "finite element model" against real-world observations (`test:live`) before publishing.

### The Repository Pattern (Or Lack Thereof)
*   **The Pattern:** You might expect a separate layer of code just for database queries (a "Repository").
*   **Our Reality:** We skip it. We call the DB directly in the API route.
*   **Why?** In nonlinear dynamics, sometimes the simplest model that fits the data is best (Occam's Razor). Adding layers adds "parameters" to the model without necessarily improving the fit. For this MVP, direct coupling is efficient.

---

## 7. Instrumentation (Testing)

You wouldn't publish a paper on a 7.0 magnitude earthquake without verifying your station calibration.

*   **`vitest`**: Your seismometer network.
*   **Running Tests:**
    *   `npm test`: Continuous monitoring (Real-time telemetry).
    *   `npm run test:run`: Batch processing (Post-processing).

---

*Welcome to the team, Doctor. The code is chaotic, but at least it's deterministic.*
