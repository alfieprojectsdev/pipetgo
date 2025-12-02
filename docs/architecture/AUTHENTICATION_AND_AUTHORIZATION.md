# Authentication and Authorization Architecture

**Last Updated:** 2025-12-01
**Security Level:** Production-Grade (bcrypt + JWT + RBAC)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication Flow](#authentication-flow)
3. [Password Handling Strategy](#password-handling-strategy)
4. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
5. [Session Management](#session-management)
6. [Resource Ownership Verification](#resource-ownership-verification)
7. [Security Patterns and Anti-Patterns](#security-patterns-and-anti-patterns)
8. [Attack Mitigations](#attack-mitigations)

---

## Overview

PipetGo uses a **hybrid authentication model**:

| User Role | Authentication Method | Password Required | Reasoning |
|-----------|----------------------|-------------------|-----------|
| CLIENT | Email-only (passwordless) | ❌ No | Reduce friction for business users, low-security workflow |
| LAB_ADMIN | Email + Password | ✅ Yes | High-security: can provide quotes, upload results |
| ADMIN | Email-only (passwordless) | ❌ No | Internal staff, can add passwords later |

**Key Principle:**
> "Only roles that can modify financial data (quotes) or sensitive data (results) require passwords."

---

## Authentication Flow

### NextAuth Configuration Overview

```
┌────────────────────────────────────────────────────────────────┐
│                     NextAuth Flow (High-Level)                 │
└────────────────────────────────────────────────────────────────┘

  1. User submits credentials (email + password OR email-only)
                ↓
  2. CredentialsProvider.authorize() validates credentials
                ↓
  3. If valid, return user object { id, email, role }
                ↓
  4. jwt() callback: Add user data to JWT token
                ↓
  5. JWT stored in HTTP-only cookie (encrypted, signed)
                ↓
  6. On each request: session() callback reads JWT → session object
                ↓
  7. Components use useSession() (client) or getServerSession() (server)
```

**File:** `src/lib/auth.ts`

---

### Step-by-Step: LAB_ADMIN Login (Password Required)

#### Step 1: User Submits Credentials

```typescript
// Client-side form (src/app/auth/signin/page.tsx)
const response = await signIn('credentials', {
  email: 'admin@lab.com',
  password: 'SecurePass123!',
  redirect: false
})
```

#### Step 2: Server-Side Verification

```typescript
// src/lib/auth.ts (lines 47-93)
async authorize(credentials) {
  // 1. Validate input
  if (!credentials?.email || !credentials?.password) {
    return null
  }

  // 2. Fetch user from database (include hashedPassword)
  const user = await prisma.user.findUnique({
    where: { email: credentials.email.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      hashedPassword: true  // ✅ Needed for verification
    }
  })

  // 3. Timing-safe check (prevent timing attacks)
  const FAKE_PASSWORD_HASH = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKKhkP.Eim'

  if (!user) {
    // User doesn't exist - run fake verification to prevent timing attack
    await verifyPassword(credentials.password, FAKE_PASSWORD_HASH)
    return null  // ✅ Constant-time failure (attacker can't detect user existence)
  }

  // 4. Check if user has set a password
  if (!user.hashedPassword) {
    return null  // User exists but hasn't set password (passwordless login)
  }

  // 5. Verify password (bcrypt, timing-safe)
  const validPassword = await verifyPassword(credentials.password, user.hashedPassword)
  if (!validPassword) {
    return null
  }

  // 6. Return user object (will be added to JWT)
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }
}
```

**Security Critical:**
- **Timing attack prevention:** Always run bcrypt verification (even for non-existent users)
- **No information leakage:** Same error for "user not found" and "wrong password"
- **Case-insensitive email:** `credentials.email.toLowerCase()` prevents duplicate accounts

---

#### Step 3: JWT Token Creation

```typescript
// src/lib/auth.ts (lines 112-126)
async jwt({ token, user }) {
  // Initial sign in - add user data to token
  if (user) {
    token.id = user.id
    token.email = user.email
    token.name = user.name
    token.role = user.role  // ✅ Critical: Role in token (no DB query per request)
  }

  return token
}
```

**JWT Payload (Example):**
```json
{
  "id": "clx1a2b3c4d5e6f7g8h9",
  "email": "admin@lab.com",
  "name": "Lab Admin",
  "role": "LAB_ADMIN",
  "iat": 1733000000,
  "exp": 1735592000
}
```

**Why JWT (not database sessions)?**
- **Stateless:** No database query per request (critical for serverless Vercel)
- **Fast:** JWT verification ~1ms, database query ~50ms
- **Scalable:** Horizontal scaling (no shared session store needed)

**Tradeoff:**
- **Cannot revoke immediately:** JWT valid until expiry (30 days)
- **Mitigation:** Future token blacklist for urgent revocations

---

#### Step 4: Session Object Creation

```typescript
// src/lib/auth.ts (lines 133-141)
async session({ session, token }) {
  if (token && session.user) {
    session.user.id = token.id as string
    session.user.email = token.email as string
    session.user.name = token.name as string | null
    session.user.role = token.role as UserRole  // ✅ Role accessible in components
  }
  return session
}
```

**Session Object (Available in Components):**
```typescript
const session = await getServerSession(authOptions)
console.log(session)
// {
//   user: {
//     id: "clx1a2b3c4d5e6f7g8h9",
//     email: "admin@lab.com",
//     name: "Lab Admin",
//     role: "LAB_ADMIN"
//   },
//   expires: "2025-12-31T23:59:59.999Z"
// }
```

---

### Step-by-Step: CLIENT Passwordless Login

**Future Implementation (Not Yet Built):**
```typescript
// 1. Client enters email only
// 2. Backend generates magic link token
// 3. Email sent with link: https://pipetgo.com/auth/verify?token=...
// 4. User clicks link
// 5. Token validated, session created
```

**Current State (Stage 2):**
- CLIENT accounts created via seed script (demo mode)
- Production: Manual account creation by ADMIN

---

## Password Handling Strategy

### Why LAB_ADMIN Requires Passwords

**Business Context:**
- LAB_ADMIN can provide custom quotes (financial impact)
- LAB_ADMIN can upload test results (legal liability)
- Account compromise could result in fraudulent quotes

**Security Requirement:**
- Password strength enforced (8+ chars, uppercase, lowercase, number, special)
- Bcrypt hashing (12 salt rounds, ~250-500ms per hash)
- No password reuse (future: password history)

---

### Bcrypt Implementation

**File:** `src/lib/password.ts`

#### Password Hashing (Account Creation)

```typescript
// src/lib/password.ts (lines 40-60)
export async function hashPassword(password: string): Promise<string> {
  // 1. Validation
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }
  if (password.length > 128) {
    throw new Error('Password is too long')  // Prevent bcrypt DoS
  }

  // 2. Hash with 12 salt rounds
  const SALT_ROUNDS = 12  // ~250-500ms per hash (good balance for 2025)
  const hash = await bcrypt.hash(password, SALT_ROUNDS)

  return hash
  // Example output: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKKhkP.Eim"
}
```

**Why 12 Salt Rounds?**

| Salt Rounds | Time per Hash | Security Level | Use Case |
|-------------|---------------|----------------|----------|
| 10 | ~100ms | Moderate | Low-value accounts |
| 12 | ~400ms | High | **PipetGo (financial data)** |
| 14 | ~1.6s | Very High | Government, military |

**Reasoning:**
- 12 rounds = 2^12 = 4096 iterations
- Slows down brute-force attacks (4096x slower than single hash)
- Acceptable UX (400ms login delay imperceptible to users)

---

#### Password Verification (Login)

```typescript
// src/lib/password.ts (lines 83-98)
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  if (!password || !hashedPassword) {
    return false
  }

  try {
    const isMatch = await bcrypt.compare(password, hashedPassword)  // ✅ Timing-safe
    return isMatch
  } catch (error) {
    console.error('Password verification failed:', error)
    return false  // ✅ Fail closed (errors = reject login)
  }
}
```

**Why Timing-Safe?**
- `bcrypt.compare()` always takes same time (regardless of password correctness)
- Prevents timing attacks (attacker measuring response time to guess password)

---

#### Password Strength Validation

```typescript
// src/lib/password.ts (lines 122-175)
export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // 1. Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  // 2. Complexity checks
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  // 3. Common password check
  const weakPasswords = [
    'password', 'password123', '12345678', 'qwerty', 'abc123'
  ]
  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('This password is too common')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
```

**Client-Side Validation:**
- Show errors in real-time (before form submission)
- Prevent weak passwords from reaching server

**Server-Side Validation:**
- Re-validate (NEVER trust client)
- Use Zod schema for type-safe validation

---

### Timing Attack Prevention (Critical)

**Attack Scenario:**
```
Attacker tries to determine if user exists by measuring response time:
1. Submit login for known user: Response takes 400ms (bcrypt verification)
2. Submit login for non-existent user: Response takes 5ms (no verification)
3. Attacker knows user exists!
```

**Mitigation (Lines 66-72 in auth.ts):**
```typescript
const FAKE_PASSWORD_HASH = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKKhkP.Eim'

if (!user) {
  // User doesn't exist - run fake verification to prevent timing attack
  await verifyPassword(credentials.password, FAKE_PASSWORD_HASH)  // ✅ Takes 400ms
  return null
}
```

**Result:**
- Login attempt for existing user: ~400ms
- Login attempt for non-existent user: ~400ms
- Attacker cannot distinguish (constant-time response)

---

## Role-Based Access Control (RBAC)

### Three User Roles

```
┌─────────────────────────────────────────────────────────────┐
│                      User Role Hierarchy                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐   │
│  │  CLIENT  │         │LAB_ADMIN │         │  ADMIN   │   │
│  └────┬─────┘         └────┬─────┘         └────┬─────┘   │
│       │                    │                     │         │
│       │                    │                     │         │
│   - Submit RFQs        - Provide quotes      - Platform   │
│   - Approve quotes     - Upload results        oversight  │
│   - View own orders    - View lab orders     - All orders │
│                        - Manage lab info       access     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Database Schema:**
```typescript
// prisma/schema.prisma (lines 10-14)
enum UserRole {
  CLIENT      // Default role for new users
  LAB_ADMIN   // Lab administrators (require password)
  ADMIN       // Platform administrators
}
```

---

### Server-Side Role Verification (CRITICAL)

**❌ NEVER Trust Client:**
```typescript
// src/app/api/orders/[id]/quote/route.ts

// ❌ WRONG (Client could manipulate request body)
const { role } = await req.json()
if (role !== 'LAB_ADMIN') {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}
```

**✅ ALWAYS Verify Server-Side:**
```typescript
// src/app/api/orders/[id]/quote/route.ts (lines 19-34)
export async function POST(req: Request) {
  // 1. Get session from server-side (HTTP-only cookie, cannot be manipulated)
  const session = await getServerSession(authOptions)

  // 2. Verify authenticated
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 3. Verify correct role (from JWT token, not request body)
  if (session.user.role !== 'LAB_ADMIN') {  // ✅ Read from session, not client
    return NextResponse.json(
      { error: 'Only lab administrators can provide quotes' },
      { status: 403 }
    )
  }

  // Proceed with quote provision logic...
}
```

**Why This Works:**
- `session.user.role` read from JWT token (signed by server, cannot be forged)
- JWT stored in HTTP-only cookie (JavaScript cannot access or modify)
- Even if attacker modifies request body, `session.user.role` remains correct

---

### Standard RBAC Pattern (Reusable)

**Template for All Protected API Routes:**
```typescript
export async function POST(req: Request) {
  // Step 1: Authentication check
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Step 2: Authorization check (role verification)
  if (session.user.role !== 'REQUIRED_ROLE') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Step 3: Business logic (safe, user is authenticated AND authorized)
  // ...
}
```

**HTTP Status Codes:**
- `401 Unauthorized`: User not logged in (missing/invalid session)
- `403 Forbidden`: User logged in but wrong role (CLIENT trying LAB_ADMIN action)

---

## Session Management

### JWT Token Structure

**Configuration:**
```typescript
// src/lib/auth.ts (lines 98-101)
session: {
  strategy: 'jwt',        // Stateless sessions
  maxAge: 30 * 24 * 60 * 60,  // 30 days
}
```

**JWT Token (Decoded Example):**
```json
{
  "id": "clx1a2b3c4d5e6f7g8h9",
  "email": "admin@lab.com",
  "role": "LAB_ADMIN",
  "iat": 1733000000,        // Issued at (Unix timestamp)
  "exp": 1735592000         // Expires at (30 days later)
}
```

**Stored as HTTP-only Cookie:**
```
Set-Cookie: next-auth.session-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...;
            Path=/;
            HttpOnly;
            Secure;
            SameSite=Lax;
            Max-Age=2592000
```

**Security Features:**
- `HttpOnly`: JavaScript cannot access (prevents XSS token theft)
- `Secure`: Only sent over HTTPS (prevents MITM attacks)
- `SameSite=Lax`: Prevents CSRF attacks (cookie not sent on cross-site POST)

---

### Session Revocation (Future Implementation)

**Current Limitation:**
- JWT valid until expiry (30 days), cannot revoke immediately
- User changes role → must wait for token to expire (or logout + login)

**Future Solution (Token Blacklist):**
```typescript
// 1. Create blacklist table
model TokenBlacklist {
  id        String   @id @default(cuid())
  tokenId   String   @unique  // JWT "jti" claim
  userId    String
  revokedAt DateTime @default(now())
  expiresAt DateTime  // When to purge from blacklist
}

// 2. Check blacklist on each request
async session({ session, token }) {
  const blacklisted = await prisma.tokenBlacklist.findUnique({
    where: { tokenId: token.jti }
  })

  if (blacklisted) {
    return null  // Revoke session
  }

  return session
}
```

**Tradeoff:**
- Adds database query per request (defeats stateless JWT benefit)
- Mitigation: Cache blacklist in Redis (fast lookup)

---

## Resource Ownership Verification

### Why Ownership Checks Matter

**Scenario:**
- Lab Admin A owns Lab 1
- Lab Admin B owns Lab 2
- Order X belongs to Lab 2

**Without Ownership Check:**
```typescript
// ❌ VULNERABLE
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  // Only checks role, NOT ownership
  if (session.user.role !== 'LAB_ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ⚠️ Lab Admin A can quote Order X (belongs to Lab 2)!
  await prisma.order.update({
    where: { id: params.id },
    data: { quotedPrice: 5000 }
  })
}
```

**With Ownership Check:**
```typescript
// ✅ SECURE
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (session.user.role !== 'LAB_ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ✅ Verify lab admin OWNS the lab for this order
  const order = await prisma.order.findFirst({
    where: {
      id: params.id,
      lab: {
        ownerId: session.user.id  // ✅ Ownership check in query
      }
    }
  })

  if (!order) {
    // Either order doesn't exist OR user doesn't own lab
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  // Safe to proceed (user verified as owner)
}
```

---

### Standard Ownership Pattern

**Pattern: Combine Resource Lookup + Ownership Check in Single Query**

```typescript
// src/app/api/orders/[id]/quote/route.ts (lines 42-54)
const order = await prisma.order.findFirst({
  where: {
    id: params.id,
    lab: {
      ownerId: session.user.id  // ✅ Implicit ownership check
    }
  },
  include: {
    lab: true,
    service: true,
    client: true
  }
})

if (!order) {
  return NextResponse.json(
    { error: 'Order not found or access denied' },
    { status: 404 }  // ✅ Don't leak existence via 403
  )
}
```

**Why Return 404 (Not 403)?**

| Approach | Security Implication |
|----------|---------------------|
| Return 404 for non-existent AND unauthorized | ✅ Attacker cannot probe for order existence |
| Return 403 for unauthorized, 404 for non-existent | ❌ Attacker learns order exists (information leak) |

**Mental Model:**
> "If you can't access it, it doesn't exist (from your perspective)."

---

### Client Ownership Verification

**Pattern: Client Approving Own Order**

```typescript
// src/app/api/orders/[id]/approve-quote/route.ts (lines 49-59)
const order = await prisma.order.findFirst({
  where: {
    id: params.id,
    clientId: session.user.id  // ✅ Verify order belongs to this client
  },
  include: {
    lab: { select: { id: true, name: true } },
    client: { select: { id: true, name: true, email: true } },
    service: { select: { id: true, name: true } }
  }
})

if (!order) {
  return NextResponse.json(
    { error: 'Order not found or access denied' },
    { status: 404 }
  )
}
```

---

## Security Patterns and Anti-Patterns

### ✅ ALWAYS: Verify Authentication First, Then Authorization

```typescript
// Correct order of checks:
export async function POST(req: Request) {
  // 1. Authentication (is user logged in?)
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Authorization (does user have permission?)
  if (session.user.role !== 'LAB_ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 3. Ownership (does user own the resource?)
  const order = await prisma.order.findFirst({
    where: { id, lab: { ownerId: session.user.id } }
  })
  if (!order) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  // 4. Business logic
}
```

---

### ❌ NEVER: Trust Client-Provided User IDs

```typescript
// ❌ WRONG (Client could send someone else's ID)
const { userId } = await req.json()
const orders = await prisma.order.findMany({
  where: { clientId: userId }
})

// ✅ CORRECT (Read from session)
const session = await getServerSession(authOptions)
const orders = await prisma.order.findMany({
  where: { clientId: session.user.id }
})
```

---

### ✅ ALWAYS: Use Zod Validation for Input

```typescript
import { z } from 'zod'

const quoteSchema = z.object({
  quotedPrice: z.number().positive().max(1000000),
  quoteNotes: z.string().max(500).optional()
})

export async function POST(req: Request) {
  const body = await req.json()

  try {
    const validatedData = quoteSchema.parse(body)  // ✅ Validates + type-checks
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
  }
}
```

See: `src/lib/validations/quote.ts`

---

### ❌ NEVER: Skip Validation for "Internal" Routes

**Anti-Pattern:**
```typescript
// "This endpoint is only called from our frontend, so validation is optional"
export async function POST(req: Request) {
  const body = await req.json()
  await prisma.order.create({ data: body })  // ❌ Unvalidated
}
```

**Why This Fails:**
- API routes are exposed to internet (attackers can call directly)
- Frontend validation can be bypassed (open DevTools, modify fetch call)
- Defense in depth: validate at every layer

---

## Attack Mitigations

### 1. SQL Injection (Prevented by Prisma)

**Prisma uses parameterized queries:**
```typescript
// ✅ SAFE (Prisma escapes input)
await prisma.order.findFirst({
  where: { id: userInput }  // Prisma escapes userInput
})

// ❌ VULNERABLE (Raw SQL)
await prisma.$queryRaw(`SELECT * FROM orders WHERE id = ${userInput}`)  // Don't do this!
```

**If Raw SQL Needed:**
```typescript
// ✅ SAFE (Parameterized)
await prisma.$queryRaw`SELECT * FROM orders WHERE id = ${userInput}`  // Tagged template (auto-escapes)
```

---

### 2. XSS (Cross-Site Scripting)

**Mitigations:**
1. **React auto-escapes:** `<div>{userInput}</div>` → Escaped automatically
2. **Content Security Policy (Future):** Prevent inline scripts
3. **HTTP-only cookies:** Token not accessible via JavaScript

**Vulnerable Code:**
```typescript
// ❌ VULNERABLE
<div dangerouslySetInnerHTML={{ __html: userInput }} />  // Don't use this!
```

---

### 3. CSRF (Cross-Site Request Forgery)

**Mitigations:**
1. **SameSite=Lax cookies:** Browser blocks cross-site POST with cookies
2. **NextAuth CSRF protection:** Built-in token verification
3. **Origin header check (Future):** Verify request origin matches domain

**Why SameSite=Lax Works:**
```
Attacker site (evil.com) → POST https://pipetgo.com/api/orders/123/quote
Browser: Cookie not sent (cross-site POST blocked)
API route: No session → 401 Unauthorized ✅
```

---

### 4. Timing Attacks

**Mitigation: Constant-Time Operations**

See [Timing Attack Prevention](#timing-attack-prevention-critical) section above.

**Key Principle:**
> "Authentication failures should take the same time, regardless of reason."

---

### 5. Rate Limiting (Future Implementation)

**Current Gap:**
- No rate limiting on login endpoint
- Attacker can brute-force passwords (400ms per attempt × 10,000 passwords = 67 minutes)

**Future Solution:**
```typescript
// middleware.ts
import rateLimit from '@upstash/ratelimit'

const limiter = rateLimit({
  redis: Redis.fromEnv(),
  limiter: Limiter.slidingWindow(5, '1 m')  // 5 attempts per minute
})

export async function middleware(req: Request) {
  if (req.url.includes('/api/auth/signin')) {
    const { success } = await limiter.limit(req.ip)
    if (!success) {
      return new Response('Too many requests', { status: 429 })
    }
  }
}
```

See: `tests/api/auth/nextauth-ratelimit.test.ts` (test exists, implementation pending)

---

## Summary: Security Checklist

Before deploying API route changes, verify:

- [ ] `getServerSession()` called for protected routes
- [ ] Role verified server-side (not from request body)
- [ ] Ownership check combined with resource lookup
- [ ] Return 404 (not 403) for unauthorized access
- [ ] Zod validation for all input
- [ ] Timing-safe operations (bcrypt, constant-time failures)
- [ ] HTTP-only cookies configured
- [ ] No sensitive data in JWT payload (no passwords, no full credit card numbers)
- [ ] Error messages sanitized (no database query details exposed)

---

**Document Owner:** Architecture Mentor
**Review Cadence:** After security-related changes
**Related Documents:**
- `API_DESIGN_PATTERNS.md` - Error handling patterns
- `TESTING_PHILOSOPHY.md` - Security testing strategies
- `src/lib/auth.ts` - NextAuth configuration (lines 1-194)
- `src/lib/password.ts` - Bcrypt utilities (lines 1-219)
