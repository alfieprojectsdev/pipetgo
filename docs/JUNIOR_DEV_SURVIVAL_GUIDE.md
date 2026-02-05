# 🧪 Junior Dev's Survival Guide to PipetGo
*(Or: How to Stop Worrying and Love the Monolith)*

**Target Audience:** You (The Junior Physicist turned Coder)
**Tone:** Supportive, slightly chaotic, strictly scientific
**Attention Level Required:** Medium-High (Take breaks!)

---

## 🚀 Mission Briefing (The "Abstract")

Welcome to **PipetGo**. You are now a lab technician in this digital laboratory.

**What is this thing?**
Imagine if Amazon wasn't for buying instant gratification (like a fidget spinner), but for requesting complex scientific services where the price depends on a million variables.
*   **It is NOT:** A vending machine (E-commerce).
*   **It IS:** A negotiation table (B2B Marketplace).

**The Core Loop (The "Experiment"):**
1.  **Client** needs a test (e.g., "Analyze this weird sludge").
2.  **Client** sends a Request for Quote (RFQ).
3.  **Lab Admin** looks at the request, scratches their chin, and sends back a price (Quote).
4.  **Client** accepts the price.
5.  **Science happens.**
6.  **Results** are uploaded.

---

## ⚛️ The Physics Engine (Tech Stack)

Think of the tech stack as the fundamental forces governing this universe.

### 1. The Vacuum Chamber: **Next.js 14 (App Router)**
*   **Where:** `src/app`
*   **What:** The framework that holds everything together.
*   **Why:** It's the industry standard. It handles both the frontend (React) and the backend (API Routes) in one place.
*   **The Weird Part:** It uses "Server Components".
    *   *Analogy:* Think of Server Components as "Dark Matter". You can't see them on the client (browser), but their gravity affects everything. They do the heavy lifting on the server before sending just the HTML to the browser.
    *   *Rule of Thumb:* If it needs `useState` or `onClick`, put `"use client"` at the top of the file. Otherwise, keep it server-side for speed.

### 2. The Detector: **Prisma**
*   **Where:** `src/lib/db.ts` and `prisma/schema.prisma`
*   **What:** The tool we use to talk to the database.
*   **Why:** Writing raw SQL is like doing calculus with Roman numerals. Prisma lets us write TypeScript to query the DB.
*   **Reference:** [src/lib/db.ts](../src/lib/db.ts) (Line 1) - *Read the comments here about the "Dual-Mode" singleton!*

### 3. The Security Clearance: **NextAuth.js (v4)**
*   **Where:** `src/lib/auth.ts`
*   **What:** Handles who is allowed to enter the lab.
*   **Why:** Rolling your own auth is like trying to build your own GPS satellite. Don't do it. Use the proven solution.
*   **Reference:** [src/lib/auth.ts](../src/lib/auth.ts) (Line 28) - *See how we verify passwords manually? That's because we're in "Credentials" mode for this MVP.*

---

## 🏗️ Architecture Patterns (JIT Learning)

"Patterns" are just fancy names for "ways we solved this problem 50 years ago." Here are the ones you'll see in this repo (and why we use them).

### 1. The Singleton Pattern (The "Higgs Field")
*   **Concept:** Ensure a class has only ONE instance and provide a global point of access to it.
*   **In Our Code:** `src/lib/db.ts`
*   **Why?** Opening a database connection is expensive (like powering up a collider). We don't want to do it 100 times per second. We create ONE connection (`prisma`) and share it everywhere.
*   **Code Evidence:**
    ```typescript
    // src/lib/db.ts
    const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
    export const prisma = globalForPrisma.prisma || new PrismaClient()
    ```

### 2. DTOs (Data Transfer Objects) (The "Sample Container")
*   **Concept:** An object that carries data between processes. It has no behavior (methods), just data.
*   **In Our Code:** The Zod schemas.
*   **Why?** When data comes in from the wild (the internet), it's radioactive sludge. We need to put it in a verified container before we touch it.
*   **Code Evidence:** `createOrderSchema` in [src/app/api/orders/route.ts](../src/app/api/orders/route.ts) (Line 9). We define exactly what fields are allowed.

### 3. MVC (Model-View-Controller) (The "Standard Model")
*   **Concept:** separating the internal representation of information (Model) from how it's presented (View) and accepted (Controller).
*   **In Our Code:** Next.js blurs the lines, but it's there:
    *   **Model:** `prisma/schema.prisma` (Defines what a "User" or "Order" IS).
    *   **View:** `src/app/dashboard/page.tsx` (What the user SEES).
    *   **Controller:** `src/app/api/orders/route.ts` (Handles the INPUT, talks to the Model, and updates the View's data).

### 4. The Anti-Pattern: No Repository Layer?
*   **Concept:** Usually, you'd have a `OrderRepository` class that wraps all database calls.
*   **In Our Code:** We call `prisma.order.findMany()` directly in the API route.
*   **Why (Tradeoff):**
    *   *Pro:* Faster development. Less boilerplate code to write.
    *   *Con:* If we ever wanted to switch from Prisma to something else, we'd have to rewrite EVERY API route.
    *   *Senior Dev Note:* For an MVP (Minimum Viable Product), this is acceptable speed over flexibility. Don't over-engineer until you have to.

---

## 🗺️ Lab Schematics (Project Structure)

Where did I put my wrench?

*   **`src/app/` (The Control Room)**:
    *   `api/`: The backend endpoints (Controllers). This is where the heavy logic lives.
    *   `dashboard/`: The different screens users see based on their role (Views).
    *   `layout.tsx`: The frame that wraps every page (navigation, footers).
*   **`src/components/ui/` (The Tool Shed)**:
    *   Small, dumb components (Buttons, Inputs, Cards).
    *   *Note:* These are "dumb" (Pure Components) because they don't know about data. They just look pretty and click when told.
*   **`src/lib/` (The Universal Constants)**:
    *   `db.ts`: The database connection (Singleton).
    *   `auth.ts`: The security configuration.
    *   `utils.ts`: Helper functions.
*   **`prisma/` (The Blueprint)**:
    *   `schema.prisma`: The ONE TRUTH about what our data looks like (Model). If it's not here, it doesn't exist.

---

## 🔬 Standard Operating Procedures (The RFQ Flow)

Let's trace a particle (Order) through the accelerator.
**Reference Code:** [src/app/api/orders/route.ts](../src/app/api/orders/route.ts)

1.  **Injection (POST Request)**:
    *   The client fires a request to `/api/orders`.
    *   *See Line 30:* We check `session.user.role !== 'CLIENT'`. **Security Check #1!** Never trust the frontend.

2.  **Validation (The Collimator)**:
    *   *See Line 35:* `createOrderSchema.parse(body)`.
    *   We use **Zod** (our DTO validator) to make sure the data shape is correct. If they send us garbage, we reject it immediately.

3.  **The Split (Pricing Logic)**:
    *   *See Line 52:* The logic branches based on `pricingMode`.
    *   **QUOTE_REQUIRED**: The path of high resistance. Needs manual lab approval.
    *   **FIXED**: The path of least resistance. Auto-approved.
    *   **HYBRID**: The quantum superposition. Could be either.

4.  **Creation (The Collision)**:
    *   *See Line 85:* `prisma.order.create(...)`. The event is recorded in the database.

---

## ☢️ Safety Protocols (Security)

**WARNING:** This is where you can blow up the lab.

1.  **Authentication vs. Authorization**:
    *   *Authentication:* "Who are you?" (Logged in?)
    *   *Authorization:* "Are you allowed to touch this?" (Role check?)
    *   **ALWAYS** check both in every API route.
    *   *Bad:* `if (user)`
    *   *Good:* `if (user && user.role === 'LAB_ADMIN')`

2.  **Trust No One**:
    *   Never assume data coming from the client is safe.
    *   Always validate with Zod.
    *   Always check if the user *owns* the data they are trying to modify.

---

## ⚠️ Anomalies & Tradeoffs (The Senior Dev's Confession)

Why is it built this way? (Or: "I swear I had a reason")

### 1. "Why no Middleware?"
*   **Observation:** You might expect a `middleware.ts` file to protect routes. It's missing.
*   **Reason:** Middleware in Next.js runs on the Edge (limited environment). It can be tricky with databases.
*   **Tradeoff:** We do auth checks *per-route* (in the API handler) or *per-page*. It's more repetitive (WET - Write Everything Twice), but simpler to debug and robust.
*   **Action Item:** If you add a new route, **YOU MUST ADD THE AUTH CHECK YOURSELF**. There is no invisible force field protecting you.

### 2. "The Mock Database"
*   **Observation:** `npm run test:mock`
*   **Reason:** Spinning up a real Postgres database for every test run is slow.
*   **Solution:** We use `pg-mem` to simulate a database in memory. It's blazing fast.
*   **Tradeoff:** It's a simulation. Sometimes `pg-mem` behaves slightly differently than real Postgres.
*   **Action Item:** Always run `npm run test:live` (integration tests) before a major deploy to be sure.

### 3. "Mock File Uploads"
*   **Observation:** We aren't actually uploading files to S3 yet.
*   **Reason:** Complexity reduction for MVP.
*   **Tradeoff:** We just store a string (URL) and pretend.
*   **Scrutinize This:** If you are asked to "fix file uploads", this is a major refactor. You'll need to set up S3/UploadThing and handle signed URLs.

---

## 🧯 Emergency Procedures (How to Fix Things)

**"I broke the database!"**
*   Run: `npm run db:reset` (Resets everything and re-seeds with dummy data).
*   *Warning:* Do not run this on production unless you want to be fired.

**"The types are yelling at me!"**
*   Run: `npx prisma generate` (Updates the TypeScript definitions to match your schema).

**"I'm lost!"**
*   Read `CLAUDE.md`. It has a cheat sheet of commands.
*   Check the `tests/` folder. Tests are the best documentation of how code is *supposed* to work.

---

*End of Briefing. Good luck, Cadet.*
