# Authentication Enhancement Implementation Plan

**Date:** 2025-11-17
**Decision:** Enhance NextAuth (see ADR_AUTHENTICATION_ARCHITECTURE_20251117.md)
**Estimated Duration:** 10-12 days
**Approach:** Incremental enhancement, zero breaking changes

---

## Executive Summary

**What:** Add password authentication, email verification, password reset, and rate limiting to existing NextAuth implementation.

**Why:** Current system has email-only auth (Stage 1 MVP). Stage 2 requires production-ready authentication with password support.

**How:** Enhance existing NextAuth configuration with additive changes. No breaking changes to current auth flows.

**Risk Level:** 🟢 LOW (all changes are backward compatible)

---

## Prerequisites

### Current State Verification

Before starting, verify:
- ✅ NextAuth 4.24.7 installed
- ✅ PrismaAdapter configured (`src/lib/auth.ts`)
- ✅ User model with email and role fields
- ✅ CredentialsProvider with email-only auth
- ✅ JWT session strategy configured
- ✅ Custom sign-in page at `/auth/signin`

### Environment Setup

Required environment variables:
```env
# Existing (already configured)
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."  # Already set

# New (to be added)
EMAIL_SERVER_HOST="smtp.resend.com"     # Or SendGrid
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="resend"
EMAIL_SERVER_PASSWORD="re_..."           # Resend API key
EMAIL_FROM="noreply@pipetgo.com"

UPSTASH_REDIS_REST_URL="https://..."    # For rate limiting
UPSTASH_REDIS_REST_TOKEN="..."
```

---

## Phase 1: Database Schema Update

**Duration:** 4 hours
**Risk:** 🟢 LOW
**Breaking Changes:** NONE

### 1.1 Add passwordHash Field to User Model

**File:** `prisma/schema.prisma`
**Action:** Add field to User model (after line 68)

**Current User Model (lines 60-77):**
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  role          UserRole  @default(CLIENT)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  ownedLabs     Lab[]
  clientOrders  Order[]   @relation("ClientOrders")
  attachments   Attachment[]

  @@map("users")
}
```

**Task for @agent-developer:**
```
Add passwordHash field to User model in prisma/schema.prisma

Location: After line 66 (after `role` field, before `createdAt`)

Add this field:
  passwordHash  String?   // Nullable for backward compatibility with email-only users

Justification for nullable:
- Existing users have no passwords (email-only auth)
- New users will set passwords during registration
- Allows gradual migration
- Enables hybrid auth (email-only OR password)
```

**Acceptance Criteria:**
- ✅ Field added to schema
- ✅ Field is nullable (`String?`)
- ✅ Placed before `createdAt` field
- ✅ No syntax errors in schema

### 1.2 Create and Apply Migration

**Command:**
```bash
npx prisma migrate dev --name add-password-hash
```

**Validation:**
- ✅ Migration file created in `prisma/migrations/`
- ✅ Database updated successfully
- ✅ No errors in migration
- ✅ Existing data preserved

**Task for @agent-developer:**
```
Run Prisma migration to add passwordHash field

Commands:
1. npx prisma migrate dev --name add-password-hash
2. npx prisma generate

Verify:
- Check migration file created
- Confirm no errors
- Run: npm run type-check (should pass)
```

**Acceptance Criteria:**
- ✅ Migration completes successfully
- ✅ TypeScript types regenerated
- ✅ Type checking passes
- ✅ Existing tests still pass (233/233)

### 1.3 Update Seed Data (Optional)

**File:** `prisma/seeds/seed.ts`
**Action:** Add passwordHash to seed users (for testing)

**Task for @agent-developer:**
```
Add test password hashes to seed data for development testing

File: prisma/seeds/seed.ts
Action: Add passwordHash field to user creation

Use bcrypt to generate hash for password "Test123!":
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('Test123!', 10);

Add to each user:
  passwordHash: hash

This allows testing password auth in development.
```

**Acceptance Criteria:**
- ✅ Seed users have password hashes
- ✅ Password is "Test123!" (for testing)
- ✅ Seed runs successfully: `npm run db:seed`

---

## Phase 2: Password Authentication with Bcrypt

**Duration:** 2 days
**Risk:** 🟢 LOW
**Breaking Changes:** NONE (email-only auth still works)

### 2.1 Install Dependencies

**Commands:**
```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

**Validation:**
- ✅ `bcrypt` in package.json dependencies
- ✅ `@types/bcrypt` in devDependencies
- ✅ `npm install` completes successfully

### 2.2 Create Password Validation Schema

**File:** `src/lib/validations/auth.ts` (NEW)

**Task for @agent-developer:**
```
Create password validation schema with Zod

File: src/lib/validations/auth.ts (new file)

Schema requirements:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*)

Export schemas:
- signUpSchema (email, password, name, role)
- signInSchema (email, password)
- passwordResetSchema (password, confirmPassword)

Example:
export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[!@#$%^&*]/, 'Password must contain special character'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['CLIENT', 'LAB_ADMIN'])
})
```

**Acceptance Criteria:**
- ✅ File created with 3 schemas
- ✅ Password validation comprehensive
- ✅ TypeScript types inferred correctly
- ✅ Test schemas with valid/invalid data

### 2.3 Create Password Utilities

**File:** `src/lib/password.ts` (NEW)

**Task for @agent-developer:**
```
Create password utility functions using bcrypt

File: src/lib/password.ts (new file)

Functions needed:
1. hashPassword(password: string): Promise<string>
   - Use bcrypt.hash with salt rounds = 10
   - Return hashed password

2. verifyPassword(password: string, hash: string): Promise<boolean>
   - Use bcrypt.compare
   - Return true if match, false otherwise

3. generateResetToken(): string
   - Use crypto.randomBytes(32).toString('hex')
   - For password reset tokens

Example structure:
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
```

**Acceptance Criteria:**
- ✅ File created with 3 functions
- ✅ Functions properly typed
- ✅ Bcrypt salt rounds = 10
- ✅ Test: Hash password and verify it

### 2.4 Update CredentialsProvider for Password Auth

**File:** `src/lib/auth.ts`
**Lines:** 41-78 (CredentialsProvider)

**Task for @agent-developer:**
```
Update CredentialsProvider to support password authentication

File: src/lib/auth.ts
Location: Lines 41-78 (CredentialsProvider configuration)

Changes needed:
1. Import validation schema:
   import { signInSchema } from './validations/auth'
   import { verifyPassword } from './password'

2. Add password to credentials (line 44):
   credentials: {
     email: { label: 'Email', type: 'email' },
     password: { label: 'Password', type: 'password' }  // Add this
   }

3. Update authorize function (lines 48-78):
   - Validate credentials with signInSchema
   - Fetch user with passwordHash field
   - If passwordHash exists, verify password
   - If no passwordHash, allow email-only (backward compatibility)
   - Return null if password wrong

Example logic:
async authorize(credentials) {
  // Validate input
  const validation = signInSchema.safeParse(credentials)
  if (!validation.success) return null

  const { email, password } = validation.data

  // Find user (include passwordHash)
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
      emailVerified: true
    }
  })

  if (!user) return null

  // Require email verification (if password auth)
  if (user.passwordHash && !user.emailVerified) {
    return null  // User must verify email before login
  }

  // Verify password (if user has password set)
  if (user.passwordHash) {
    const validPassword = await verifyPassword(password, user.passwordHash)
    if (!validPassword) return null
  }
  // Backward compatibility: If no password set, allow email-only

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }
}
```

**Acceptance Criteria:**
- ✅ Password field added to credentials
- ✅ signInSchema validation added
- ✅ Password verification logic implemented
- ✅ Email verification check added
- ✅ Backward compatibility maintained (email-only still works)
- ✅ Type errors resolved

### 2.5 Create Sign-Up API Route with Password Hashing

**File:** `src/app/api/auth/signup/route.ts` (NEW)

**Task for @agent-developer:**
```
Create sign-up API route with password hashing

File: src/app/api/auth/signup/route.ts (new file)

Requirements:
1. Accept POST request with { email, password, name, role }
2. Validate with signUpSchema
3. Check if email already exists
4. Hash password with hashPassword()
5. Create user with Prisma
6. Create verification token
7. Send verification email (stub for now)
8. Return success response

Example structure:
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { signUpSchema } from '@/lib/validations/auth'
import { hashPassword, generateResetToken } from '@/lib/password'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validation = signUpSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { email, password, name, role } = validation.data

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        role,
        passwordHash,
        emailVerified: null  // Must verify email
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    // Generate verification token
    const token = generateResetToken()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires
      }
    })

    // TODO: Send verification email (Phase 3)
    console.log(`Verification token for ${user.email}: ${token}`)

    return NextResponse.json(
      {
        user,
        message: 'Account created. Please check your email to verify.'
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Sign-up error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Acceptance Criteria:**
- ✅ API route created
- ✅ Request validation with Zod
- ✅ Email uniqueness check
- ✅ Password hashing before storage
- ✅ User created successfully
- ✅ Verification token generated
- ✅ Returns 201 on success
- ✅ Returns 409 if email exists
- ✅ Returns 400 on validation error

### 2.6 Update Sign-Up Page UI

**File:** `src/app/auth/signup/page.tsx` (may need creation)

**Task for @agent-developer:**
```
Create/update sign-up page with password field

File: src/app/auth/signup/page.tsx

Requirements:
- Use React Hook Form with Zod resolver
- Fields: email, password, name, role (CLIENT or LAB_ADMIN)
- Show password strength indicator
- Client-side validation with signUpSchema
- Submit to POST /api/auth/signup
- Show success message on account creation
- Redirect to verification notice page

Use shadcn/ui components: Input, Button, Form, Label
```

**Acceptance Criteria:**
- ✅ Form has email, password, name, role fields
- ✅ Password field has type="password"
- ✅ Client-side validation works
- ✅ Submits to /api/auth/signup
- ✅ Shows success/error messages
- ✅ Accessible (labels, ARIA attributes)

### 2.7 Testing Phase 2

**Test Cases:**

1. **Password Hashing Test**
```typescript
// tests/lib/password.test.ts
describe('Password utilities', () => {
  it('should hash password', async () => {
    const hash = await hashPassword('Test123!')
    expect(hash).toMatch(/^\$2[aby]\$/) // bcrypt format
  })

  it('should verify correct password', async () => {
    const hash = await hashPassword('Test123!')
    const valid = await verifyPassword('Test123!', hash)
    expect(valid).toBe(true)
  })

  it('should reject wrong password', async () => {
    const hash = await hashPassword('Test123!')
    const valid = await verifyPassword('Wrong123!', hash)
    expect(valid).toBe(false)
  })
})
```

2. **Sign-Up API Test**
```typescript
// tests/api/auth/signup.test.ts
describe('POST /api/auth/signup', () => {
  it('should create user with valid data', async () => {
    const res = await POST('/api/auth/signup', {
      email: 'test@example.com',
      password: 'Test123!',
      name: 'Test User',
      role: 'CLIENT'
    })
    expect(res.status).toBe(201)
  })

  it('should reject weak password', async () => {
    const res = await POST('/api/auth/signup', {
      email: 'test@example.com',
      password: 'weak',  // Too short
      name: 'Test User',
      role: 'CLIENT'
    })
    expect(res.status).toBe(400)
  })

  it('should reject duplicate email', async () => {
    await createUser({ email: 'test@example.com' })
    const res = await POST('/api/auth/signup', {
      email: 'test@example.com',
      password: 'Test123!',
      name: 'Test User',
      role: 'CLIENT'
    })
    expect(res.status).toBe(409)
  })
})
```

3. **Authentication Test**
```typescript
// tests/auth/signin.test.ts
describe('CredentialsProvider', () => {
  it('should authenticate with correct password', async () => {
    const user = await createUserWithPassword({
      email: 'test@example.com',
      password: 'Test123!',
      emailVerified: new Date()
    })

    const result = await signIn('credentials', {
      email: 'test@example.com',
      password: 'Test123!',
      redirect: false
    })

    expect(result.ok).toBe(true)
  })

  it('should reject wrong password', async () => {
    const user = await createUserWithPassword({
      email: 'test@example.com',
      password: 'Test123!'
    })

    const result = await signIn('credentials', {
      email: 'test@example.com',
      password: 'Wrong123!',
      redirect: false
    })

    expect(result.ok).toBe(false)
  })

  it('should require email verification', async () => {
    const user = await createUserWithPassword({
      email: 'test@example.com',
      password: 'Test123!',
      emailVerified: null  // Not verified
    })

    const result = await signIn('credentials', {
      email: 'test@example.com',
      password: 'Test123!',
      redirect: false
    })

    expect(result.ok).toBe(false)
  })
})
```

**Acceptance Criteria for Phase 2:**
- ✅ All password utility tests pass
- ✅ Sign-up API tests pass (valid, weak password, duplicate)
- ✅ Authentication tests pass (correct, wrong, unverified)
- ✅ Manual testing: Create account with password
- ✅ Manual testing: Sign in with password
- ✅ Existing email-only users can still sign in
- ✅ No breaking changes to existing auth

---

## Phase 3: Email Verification

**Duration:** 2-3 days
**Risk:** 🟡 MEDIUM (requires email service configuration)
**Breaking Changes:** NONE

### 3.1 Choose Email Service

**Options:**
1. **Resend** (Recommended for Next.js)
   - Free tier: 3,000 emails/month
   - Simple API, Next.js-friendly
   - `npm install resend`

2. **SendGrid**
   - Free tier: 100 emails/day
   - More features
   - `npm install @sendgrid/mail`

**Task for @agent-developer:**
```
Install and configure Resend for email sending

Steps:
1. Install: npm install resend
2. Sign up at resend.com
3. Get API key
4. Add to .env.local:
   RESEND_API_KEY="re_..."
   EMAIL_FROM="noreply@pipetgo.com"
5. Verify domain (or use onboarding@resend.dev for testing)
```

**Acceptance Criteria:**
- ✅ Resend installed
- ✅ API key configured
- ✅ Test email sends successfully

### 3.2 Create Email Templates

**File:** `src/lib/email-templates.ts` (NEW)

**Task for @agent-developer:**
```
Create email templates for verification and password reset

File: src/lib/email-templates.ts (new file)

Templates needed:
1. getVerificationEmail(name: string, verificationUrl: string)
2. getPasswordResetEmail(name: string, resetUrl: string)

Return HTML and text versions for each.

Example:
export function getVerificationEmail(name: string, url: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #0070f3;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome to PipetGo, ${name}!</h1>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${url}" class="button">Verify Email</a>
          <p>Or copy this link: ${url}</p>
          <p>This link expires in 24 hours.</p>
          <p>If you didn't create an account, ignore this email.</p>
        </div>
      </body>
    </html>
  `

  const text = `
Welcome to PipetGo, ${name}!

Please verify your email address by visiting:
${url}

This link expires in 24 hours.

If you didn't create an account, ignore this email.
  `

  return { html, text }
}
```

**Acceptance Criteria:**
- ✅ Two template functions created
- ✅ Both return HTML and text versions
- ✅ Templates include verification/reset URLs
- ✅ Professional styling
- ✅ Clear call-to-action

### 3.3 Create Email Sending Utility

**File:** `src/lib/email.ts` (NEW)

**Task for @agent-developer:**
```
Create email sending utility using Resend

File: src/lib/email.ts (new file)

Functions needed:
1. sendVerificationEmail(email: string, name: string, token: string)
2. sendPasswordResetEmail(email: string, name: string, token: string)

Example:
import { Resend } from 'resend'
import { getVerificationEmail, getPasswordResetEmail } from './email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`
  const { html, text } = getVerificationEmail(name, verificationUrl)

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: 'Verify your PipetGo account',
    html,
    text
  })
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password/${token}`
  const { html, text } = getPasswordResetEmail(name, resetUrl)

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: 'Reset your PipetGo password',
    html,
    text
  })
}
```

**Acceptance Criteria:**
- ✅ Functions use Resend API
- ✅ Verification URL includes token
- ✅ Reset URL includes token
- ✅ Emails send successfully
- ✅ Error handling for failed sends

### 3.4 Update Sign-Up Route to Send Verification Email

**File:** `src/app/api/auth/signup/route.ts`
**Lines:** ~50-60 (after verification token creation)

**Task for @agent-developer:**
```
Add email sending to sign-up route

File: src/app/api/auth/signup/route.ts
Location: After verification token creation (line ~55)

Replace:
  console.log(`Verification token for ${user.email}: ${token}`)

With:
  import { sendVerificationEmail } from '@/lib/email'

  try {
    await sendVerificationEmail(user.email, user.name || 'User', token)
  } catch (error) {
    console.error('Failed to send verification email:', error)
    // Don't fail sign-up if email fails
  }
```

**Acceptance Criteria:**
- ✅ Verification email sent on sign-up
- ✅ Email includes correct token
- ✅ Sign-up succeeds even if email fails (log error)
- ✅ User receives email within 1 minute

### 3.5 Create Email Verification Page

**File:** `src/app/auth/verify-email/page.tsx` (NEW)

**Task for @agent-developer:**
```
Create email verification page

File: src/app/auth/verify-email/page.tsx (new file)

Requirements:
- Read token from URL query: /auth/verify-email?token=xxx
- On page load, call POST /api/auth/verify-email
- Show loading state while verifying
- Show success: "Email verified! Redirecting to sign in..."
- Show error: "Invalid or expired token"
- Auto-redirect to /auth/signin after 3 seconds on success

Use Server Component + client-side token handling.
```

**Acceptance Criteria:**
- ✅ Page reads token from URL
- ✅ Calls verification API
- ✅ Shows loading state
- ✅ Shows success/error messages
- ✅ Redirects on success

### 3.6 Create Email Verification API Route

**File:** `src/app/api/auth/verify-email/route.ts` (NEW)

**Task for @agent-developer:**
```
Create email verification API route

File: src/app/api/auth/verify-email/route.ts (new file)

Requirements:
1. Accept POST with { token }
2. Find VerificationToken in database
3. Check if expired (24 hours)
4. Update user.emailVerified = new Date()
5. Delete used token
6. Return success

Example:
export async function POST(req: Request) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      )
    }

    // Find token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      )
    }

    // Check expiration
    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { token }
      })
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 400 }
      )
    }

    // Update user
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() }
    })

    // Delete token
    await prisma.verificationToken.delete({
      where: { token }
    })

    return NextResponse.json({
      message: 'Email verified successfully'
    })

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Acceptance Criteria:**
- ✅ API route created
- ✅ Token validated
- ✅ Expiration checked
- ✅ User emailVerified updated
- ✅ Used token deleted
- ✅ Returns 400 for invalid/expired token

### 3.7 Testing Phase 3

**Test Cases:**

```typescript
// tests/api/auth/verify-email.test.ts
describe('Email Verification', () => {
  it('should verify email with valid token', async () => {
    const user = await createUser({ emailVerified: null })
    const token = await createVerificationToken(user.email)

    const res = await POST('/api/auth/verify-email', { token: token.token })

    expect(res.status).toBe(200)

    const updated = await prisma.user.findUnique({
      where: { email: user.email }
    })
    expect(updated.emailVerified).not.toBeNull()
  })

  it('should reject expired token', async () => {
    const user = await createUser({ emailVerified: null })
    const token = await createVerificationToken(user.email, {
      expires: new Date(Date.now() - 1000)  // Expired 1 second ago
    })

    const res = await POST('/api/auth/verify-email', { token: token.token })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('expired')
  })

  it('should delete token after use', async () => {
    const user = await createUser({ emailVerified: null })
    const token = await createVerificationToken(user.email)

    await POST('/api/auth/verify-email', { token: token.token })

    const tokenExists = await prisma.verificationToken.findUnique({
      where: { token: token.token }
    })
    expect(tokenExists).toBeNull()
  })
})
```

**Acceptance Criteria for Phase 3:**
- ✅ All email verification tests pass
- ✅ Manual test: Sign up, receive email, click link
- ✅ Email verified successfully
- ✅ User can sign in after verification
- ✅ Unverified users cannot sign in

---

## Phase 4: Password Reset

**Duration:** 2 days
**Risk:** 🟢 LOW
**Breaking Changes:** NONE

### 4.1 Create Password Reset Request API Route

**File:** `src/app/api/auth/reset-password/request/route.ts` (NEW)

**Task for @agent-developer:**
```
Create password reset request API route

File: src/app/api/auth/reset-password/request/route.ts (new file)

Requirements:
1. Accept POST with { email }
2. Find user by email
3. Generate reset token (use generateResetToken())
4. Create VerificationToken with 1-hour expiration
5. Send password reset email
6. Return success (even if email doesn't exist - security)

Example:
export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      )
    }

    // Find user (don't reveal if exists)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // Always return success (security: don't reveal email existence)
    if (!user) {
      return NextResponse.json({
        message: 'If email exists, reset link sent'
      })
    }

    // Generate reset token
    const token = generateResetToken()
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Delete old tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email }
    })

    // Create new token
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires
      }
    })

    // Send reset email
    try {
      await sendPasswordResetEmail(user.email, user.name || 'User', token)
    } catch (error) {
      console.error('Failed to send reset email:', error)
    }

    return NextResponse.json({
      message: 'If email exists, reset link sent'
    })

  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Acceptance Criteria:**
- ✅ API route created
- ✅ Reset token generated
- ✅ Token expires in 1 hour
- ✅ Email sent successfully
- ✅ Returns success even if email doesn't exist (security)
- ✅ Old tokens deleted before creating new one

### 4.2 Create Password Reset Confirmation API Route

**File:** `src/app/api/auth/reset-password/confirm/route.ts` (NEW)

**Task for @agent-developer:**
```
Create password reset confirmation API route

File: src/app/api/auth/reset-password/confirm/route.ts (new file)

Requirements:
1. Accept POST with { token, password }
2. Validate password with Zod schema
3. Find and validate token
4. Hash new password
5. Update user.passwordHash
6. Delete used token
7. Return success

Example:
import { passwordResetSchema } from '@/lib/validations/auth'

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    // Validate password
    const validation = passwordResetSchema.safeParse({ password })
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid password', details: validation.error.errors },
        { status: 400 }
      )
    }

    // Find token
    const resetToken = await prisma.verificationToken.findUnique({
      where: { token }
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      )
    }

    // Check expiration
    if (resetToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { token }
      })
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = await hashPassword(password)

    // Update user
    await prisma.user.update({
      where: { email: resetToken.identifier },
      data: { passwordHash }
    })

    // Delete token
    await prisma.verificationToken.delete({
      where: { token }
    })

    return NextResponse.json({
      message: 'Password reset successfully'
    })

  } catch (error) {
    console.error('Password reset confirmation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Acceptance Criteria:**
- ✅ API route created
- ✅ Password validated
- ✅ Token validated and checked for expiration
- ✅ Password hashed before storage
- ✅ User password updated
- ✅ Token deleted after use

### 4.3 Create Password Reset Request Page

**File:** `src/app/auth/reset-password/page.tsx` (NEW)

**Task for @agent-developer:**
```
Create password reset request page

File: src/app/auth/reset-password/page.tsx (new file)

Requirements:
- Form with email field
- Submit to POST /api/auth/reset-password/request
- Show success message: "If email exists, check your inbox"
- No validation errors (security: don't reveal email existence)

Use shadcn/ui components.
```

**Acceptance Criteria:**
- ✅ Page created with email form
- ✅ Submits to request API
- ✅ Shows success message
- ✅ Doesn't reveal if email exists

### 4.4 Create Password Reset Confirmation Page

**File:** `src/app/auth/reset-password/[token]/page.tsx` (NEW)

**Task for @agent-developer:**
```
Create password reset confirmation page

File: src/app/auth/reset-password/[token]/page.tsx (new file)

Requirements:
- Dynamic route with token parameter
- Form with password and confirmPassword fields
- Password validation (client-side)
- Submit to POST /api/auth/reset-password/confirm
- Show success: "Password reset! Redirecting to sign in..."
- Redirect after 3 seconds

Use React Hook Form + Zod.
```

**Acceptance Criteria:**
- ✅ Page created with password form
- ✅ Token from URL used in API call
- ✅ Password and confirm password match
- ✅ Client-side validation works
- ✅ Submits to confirm API
- ✅ Redirects on success

### 4.5 Testing Phase 4

**Test Cases:**

```typescript
// tests/api/auth/reset-password.test.ts
describe('Password Reset', () => {
  it('should send reset email for existing user', async () => {
    const user = await createUser({ email: 'test@example.com' })

    const res = await POST('/api/auth/reset-password/request', {
      email: 'test@example.com'
    })

    expect(res.status).toBe(200)

    const token = await prisma.verificationToken.findFirst({
      where: { identifier: 'test@example.com' }
    })
    expect(token).not.toBeNull()
  })

  it('should not reveal if email does not exist', async () => {
    const res = await POST('/api/auth/reset-password/request', {
      email: 'nonexistent@example.com'
    })

    expect(res.status).toBe(200)
    expect(res.body.message).toContain('If email exists')
  })

  it('should reset password with valid token', async () => {
    const user = await createUser({ email: 'test@example.com' })
    const token = await createVerificationToken(user.email)

    const res = await POST('/api/auth/reset-password/confirm', {
      token: token.token,
      password: 'NewPassword123!'
    })

    expect(res.status).toBe(200)

    // Verify password changed
    const updated = await prisma.user.findUnique({
      where: { email: user.email }
    })
    const valid = await verifyPassword('NewPassword123!', updated.passwordHash!)
    expect(valid).toBe(true)
  })

  it('should reject expired reset token', async () => {
    const user = await createUser({ email: 'test@example.com' })
    const token = await createVerificationToken(user.email, {
      expires: new Date(Date.now() - 1000)  // Expired
    })

    const res = await POST('/api/auth/reset-password/confirm', {
      token: token.token,
      password: 'NewPassword123!'
    })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('expired')
  })
})
```

**Acceptance Criteria for Phase 4:**
- ✅ All password reset tests pass
- ✅ Manual test: Request reset, receive email, reset password
- ✅ Password changed successfully
- ✅ Can sign in with new password
- ✅ Expired tokens rejected

---

## Phase 5: Rate Limiting

**Duration:** 1 day
**Risk:** 🟡 MEDIUM (requires Redis setup)
**Breaking Changes:** NONE

### 5.1 Set Up Upstash Redis

**Steps:**
1. Sign up at [upstash.com](https://upstash.com)
2. Create Redis database (free tier)
3. Get REST URL and token
4. Add to `.env.local`:
   ```env
   UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
   UPSTASH_REDIS_REST_TOKEN="xxx"
   ```

**Task for @agent-developer:**
```
Install and configure Upstash Redis for rate limiting

Steps:
1. Install: npm install @upstash/ratelimit @upstash/redis
2. Create Upstash account and database
3. Add environment variables to .env.local
4. Test connection
```

**Acceptance Criteria:**
- ✅ Upstash packages installed
- ✅ Environment variables configured
- ✅ Redis connection works

### 5.2 Create Rate Limiting Utility

**File:** `src/lib/rate-limit.ts` (NEW)

**Task for @agent-developer:**
```
Create rate limiting utility using Upstash

File: src/lib/rate-limit.ts (new file)

Create rate limiters for:
1. Sign-in: 5 attempts per 15 minutes
2. Sign-up: 3 attempts per hour
3. Password reset: 3 attempts per hour

Example:
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

export const signInRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),  // 5 per 15 min
  analytics: true,
  prefix: 'ratelimit:signin'
})

export const signUpRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),  // 3 per hour
  analytics: true,
  prefix: 'ratelimit:signup'
})

export const passwordResetRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  analytics: true,
  prefix: 'ratelimit:reset'
})

// Helper to get IP address from request
export function getIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1'
  return ip
}
```

**Acceptance Criteria:**
- ✅ Three rate limiters created
- ✅ Sliding window algorithm used
- ✅ IP address helper function
- ✅ Appropriate limits set

### 5.3 Add Rate Limiting to Sign-In

**File:** `src/app/api/auth/[...nextauth]/route.ts`

**NOTE:** NextAuth doesn't expose a direct hook for rate limiting on sign-in. We need to handle this differently.

**Alternative Approach:**
Create a rate-limiting middleware wrapper for the auth API route.

**Task for @agent-developer:**
```
Add rate limiting to authentication endpoints

Approach: Create a middleware wrapper that checks rate limit before NextAuth processes the request.

File: src/app/api/auth/[...nextauth]/route.ts

Modify to:
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import { signInRateLimit, getIP } from '@/lib/rate-limit'

async function handler(req: Request) {
  // Only rate limit POST requests (sign-in attempts)
  if (req.method === 'POST') {
    const ip = getIP(req)
    const { success, reset } = await signInRateLimit.limit(ip)

    if (!success) {
      const resetDate = new Date(reset)
      return new Response(
        JSON.stringify({
          error: `Too many sign-in attempts. Try again at ${resetDate.toLocaleTimeString()}`
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.floor((reset - Date.now()) / 1000))
          }
        }
      )
    }
  }

  // Proceed to NextAuth handler
  return NextAuth(req, authOptions)
}

export { handler as GET, handler as POST }
```

**Acceptance Criteria:**
- ✅ Rate limiting applied to sign-in
- ✅ Returns 429 when limit exceeded
- ✅ Includes Retry-After header
- ✅ Clear error message

### 5.4 Add Rate Limiting to Sign-Up

**File:** `src/app/api/auth/signup/route.ts`
**Location:** Beginning of POST function

**Task for @agent-developer:**
```
Add rate limiting to sign-up API

File: src/app/api/auth/signup/route.ts
Location: Top of POST function (after line 7)

Add:
import { signUpRateLimit, getIP } from '@/lib/rate-limit'

export async function POST(req: Request) {
  // Rate limiting
  const ip = getIP(req)
  const { success, reset } = await signUpRateLimit.limit(ip)

  if (!success) {
    const resetDate = new Date(reset)
    return NextResponse.json(
      {
        error: `Too many sign-up attempts. Try again at ${resetDate.toLocaleTimeString()}`
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.floor((reset - Date.now()) / 1000))
        }
      }
    )
  }

  // Existing code continues...
```

**Acceptance Criteria:**
- ✅ Rate limiting applied to sign-up
- ✅ Returns 429 when limit exceeded
- ✅ Retry-After header included

### 5.5 Add Rate Limiting to Password Reset

**File:** `src/app/api/auth/reset-password/request/route.ts`
**Location:** Beginning of POST function

**Task for @agent-developer:**
```
Add rate limiting to password reset request

File: src/app/api/auth/reset-password/request/route.ts
Location: Top of POST function

Add:
import { passwordResetRateLimit, getIP } from '@/lib/rate-limit'

export async function POST(req: Request) {
  // Rate limiting
  const ip = getIP(req)
  const { success, reset } = await passwordResetRateLimit.limit(ip)

  if (!success) {
    const resetDate = new Date(reset)
    return NextResponse.json(
      {
        error: `Too many password reset attempts. Try again at ${resetDate.toLocaleTimeString()}`
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.floor((reset - Date.now()) / 1000))
        }
      }
    )
  }

  // Existing code continues...
```

**Acceptance Criteria:**
- ✅ Rate limiting applied to password reset
- ✅ Returns 429 when limit exceeded
- ✅ Retry-After header included

### 5.6 Testing Phase 5

**Test Cases:**

```typescript
// tests/api/rate-limiting.test.ts
describe('Rate Limiting', () => {
  beforeEach(async () => {
    // Clear Redis before each test
    await redis.flushall()
  })

  it('should allow 5 sign-in attempts within 15 minutes', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await POST('/api/auth/signin', {
        email: 'test@example.com',
        password: 'Test123!'
      })
      expect(res.status).not.toBe(429)
    }
  })

  it('should block 6th sign-in attempt within 15 minutes', async () => {
    // Make 5 attempts
    for (let i = 0; i < 5; i++) {
      await POST('/api/auth/signin', {
        email: 'test@example.com',
        password: 'Test123!'
      })
    }

    // 6th attempt should be rate limited
    const res = await POST('/api/auth/signin', {
      email: 'test@example.com',
      password: 'Test123!'
    })

    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBeTruthy()
  })

  it('should allow sign-up after rate limit window passes', async () => {
    // Make 3 attempts (limit)
    for (let i = 0; i < 3; i++) {
      await POST('/api/auth/signup', {
        email: `test${i}@example.com`,
        password: 'Test123!',
        name: 'Test',
        role: 'CLIENT'
      })
    }

    // 4th attempt should be blocked
    let res = await POST('/api/auth/signup', {
      email: 'test4@example.com',
      password: 'Test123!',
      name: 'Test',
      role: 'CLIENT'
    })
    expect(res.status).toBe(429)

    // Wait 1 hour (or mock time)
    // ... time travel logic

    // Should work after window
    res = await POST('/api/auth/signup', {
      email: 'test5@example.com',
      password: 'Test123!',
      name: 'Test',
      role: 'CLIENT'
    })
    expect(res.status).toBe(201)
  })
})
```

**Acceptance Criteria for Phase 5:**
- ✅ All rate limiting tests pass
- ✅ Manual test: Trigger rate limits
- ✅ 429 response returned when limited
- ✅ Retry-After header present
- ✅ Rate limits reset after window

---

## Phase 6: OAuth Providers (Optional)

**Duration:** 1-2 days
**Risk:** 🟡 MEDIUM (requires OAuth app configuration)
**Breaking Changes:** NONE

### 6.1 Configure Google OAuth

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Get Client ID and Secret
5. Add to `.env.local`:
   ```env
   GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="xxx"
   ```

**Task for @agent-developer:**
```
Set up Google OAuth credentials

Steps:
1. Create Google Cloud project (if needed)
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Configure authorized redirect URIs
5. Add credentials to .env.local
```

**Acceptance Criteria:**
- ✅ Google OAuth app created
- ✅ Redirect URIs configured
- ✅ Credentials added to environment

### 6.2 Add Google Provider to NextAuth

**File:** `src/lib/auth.ts`
**Location:** providers array (after CredentialsProvider)

**Task for @agent-developer:**
```
Add GoogleProvider to NextAuth configuration

File: src/lib/auth.ts
Location: Line 79 (after CredentialsProvider closing bracket)

Add:
import GoogleProvider from 'next-auth/providers/google'

providers: [
  CredentialsProvider({
    // Existing credentials provider
  }),
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    authorization: {
      params: {
        prompt: 'select_account',  // Always show account selector
        access_type: 'offline',
        response_type: 'code'
      }
    }
  })
]
```

**Acceptance Criteria:**
- ✅ GoogleProvider added
- ✅ Environment variables used
- ✅ Authorization params configured
- ✅ No TypeScript errors

### 6.3 Add OAuth Sign-In Button to Sign-In Page

**File:** `src/app/auth/signin/page.tsx`

**Task for @agent-developer:**
```
Add Google sign-in button to sign-in page

File: src/app/auth/signin/page.tsx

Add button:
import { signIn } from 'next-auth/react'

<Button
  variant="outline"
  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
  className="w-full"
>
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
    {/* Google icon SVG */}
  </svg>
  Continue with Google
</Button>

Place above or below email/password form with "OR" divider.
```

**Acceptance Criteria:**
- ✅ Google sign-in button added
- ✅ Triggers OAuth flow on click
- ✅ Redirects to dashboard after success
- ✅ Styled consistently with other buttons

### 6.4 Handle OAuth User Creation with Role Selection

**File:** `src/lib/auth.ts`
**Location:** callbacks section

**Task for @agent-developer:**
```
Add signIn callback to handle OAuth user creation

File: src/lib/auth.ts
Location: callbacks object (after session callback)

Add:
async signIn({ user, account, profile }) {
  // For OAuth providers, user needs to select role
  if (account?.provider !== 'credentials') {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email! }
    })

    // New OAuth user - needs role selection
    if (!existingUser) {
      // Redirect to role selection page
      // Store OAuth data in session/cookies
      // Return false to prevent auto-sign-in
      // User completes registration with role selection
      // Then create account with role

      // For MVP: Default to CLIENT role
      // TODO: Add role selection page for OAuth users
      return true  // Allow sign-in, default to CLIENT
    }

    return true
  }

  return true
}
```

**Note:** Full role selection for OAuth users is a future enhancement. For MVP, default to CLIENT role.

**Acceptance Criteria:**
- ✅ signIn callback added
- ✅ OAuth users created with default CLIENT role
- ✅ Existing OAuth users can sign in
- ✅ OAuth sign-in works end-to-end

### 6.5 Testing Phase 6

**Manual Test Cases:**

1. **Google OAuth Sign-In**
   - Click "Continue with Google"
   - Select Google account
   - Authorize app
   - Redirected to dashboard
   - User created in database with CLIENT role

2. **Existing User OAuth Sign-In**
   - User already exists with email
   - Sign in with Google using same email
   - Account linked to existing user
   - Redirected to dashboard

3. **OAuth + Password Hybrid**
   - User signs up with password
   - Later signs in with Google (same email)
   - Both methods work

**Acceptance Criteria for Phase 6:**
- ✅ Google OAuth flow works end-to-end
- ✅ New users created with CLIENT role
- ✅ Existing users can use OAuth
- ✅ OAuth button styled correctly

---

## Phase 7: Testing & Documentation

**Duration:** 2 days
**Risk:** 🟢 LOW
**Breaking Changes:** NONE

### 7.1 Comprehensive Test Suite

**Task for @agent-developer:**
```
Create comprehensive authentication test suite

Files to create/update:
1. tests/lib/password.test.ts (already done in Phase 2)
2. tests/api/auth/signup.test.ts (already done in Phase 2)
3. tests/api/auth/signin.test.ts (already done in Phase 2)
4. tests/api/auth/verify-email.test.ts (already done in Phase 3)
5. tests/api/auth/reset-password.test.ts (already done in Phase 4)
6. tests/api/rate-limiting.test.ts (already done in Phase 5)
7. tests/auth/oauth.test.ts (new - Phase 6)
8. tests/auth/integration.test.ts (new - full flow tests)

Integration test scenarios:
- Full sign-up → verify → sign-in flow
- Password reset → sign in with new password
- Rate limiting triggers and resets
- OAuth sign-in creates user with correct role
```

**Acceptance Criteria:**
- ✅ All test files created
- ✅ Test coverage > 80%
- ✅ All tests pass (npm run test:run)
- ✅ Integration tests cover full user journeys

### 7.2 Update Documentation

**Files to create/update:**

**Task for @agent-technical-writer:**
```
Document authentication system thoroughly

Files to create/update:

1. docs/AUTHENTICATION_GUIDE.md (new)
   - Overview of authentication system
   - Sign-up, sign-in, verification flows
   - Password reset process
   - Rate limiting behavior
   - OAuth integration
   - Security features

2. docs/API_AUTHENTICATION.md (new)
   - API endpoint documentation
   - Request/response formats
   - Error codes and messages
   - Rate limiting headers
   - Example requests (curl)

3. Update CLAUDE.md
   - Add authentication section
   - Link to new authentication docs
   - Update security patterns

4. Create .env.example updates
   - Add all new environment variables
   - Document what each variable does
   - Provide example values
```

**Acceptance Criteria:**
- ✅ All documentation files created
- ✅ Clear examples and diagrams
- ✅ Environment variables documented
- ✅ Security best practices included

### 7.3 Security Review

**Task for @agent-security-auth:**
```
Perform security review of authentication implementation

Review checklist:
✅ Passwords hashed with bcrypt (salt rounds 10+)
✅ JWT tokens HTTP-only cookies
✅ CSRF protection enabled (NextAuth default)
✅ Rate limiting on all auth endpoints
✅ Email verification required before sign-in
✅ Password reset tokens expire (1 hour)
✅ Verification tokens expire (24 hours)
✅ Used tokens deleted after use
✅ Password complexity requirements enforced
✅ No sensitive data in JWT tokens
✅ OAuth state parameter for CSRF protection
✅ Secure session cookie settings

Generate security report:
- Vulnerabilities found (if any)
- Security score (0-100)
- Recommendations for improvement
```

**Acceptance Criteria:**
- ✅ Security review completed
- ✅ Security score ≥ 90/100
- ✅ No critical vulnerabilities
- ✅ Recommendations documented

### 7.4 UX Review

**Task for @agent-ux-reviewer:**
```
Review authentication UI/UX and accessibility

Review checklist:
✅ Sign-in form accessible (labels, ARIA)
✅ Sign-up form accessible
✅ Error messages clear and helpful
✅ Success messages visible
✅ Loading states during async operations
✅ Password visibility toggle
✅ Password strength indicator
✅ Email format validation client-side
✅ Keyboard navigation works
✅ Screen reader friendly
✅ Mobile responsive
✅ Clear instructions for verification/reset

Generate UX report:
- P0 accessibility issues
- P1 usability issues
- P2 nice-to-have improvements
- WCAG 2.1 AA compliance status
```

**Acceptance Criteria:**
- ✅ UX review completed
- ✅ No P0 accessibility issues
- ✅ WCAG 2.1 AA compliant
- ✅ Usability score ≥ 8/10

### 7.5 Quality Review

**Task for @agent-quality-reviewer:**
```
Review code quality and adherence to plan

Review checklist:
✅ All plan phases implemented
✅ No unauthorized deviations from plan
✅ Code follows Next.js best practices
✅ TypeScript strict mode passes
✅ ESLint passes with zero warnings
✅ No security vulnerabilities
✅ No performance regressions
✅ Backward compatibility maintained
✅ All acceptance criteria met

Generate quality report:
- Adherence score (0-100)
- Critical issues
- Code quality issues
- Performance analysis
```

**Acceptance Criteria:**
- ✅ Quality review completed
- ✅ Adherence score ≥ 95/100
- ✅ No critical issues
- ✅ All acceptance criteria met

### 7.6 Final Acceptance Checklist

**Before considering Phase 7 complete:**

- [ ] All 233 existing tests still pass
- [ ] New authentication tests pass (target: 50+ new tests)
- [ ] Test coverage ≥ 80%
- [ ] Documentation complete and accurate
- [ ] Security review score ≥ 90/100
- [ ] UX review: WCAG 2.1 AA compliant
- [ ] Quality review: Adherence ≥ 95/100
- [ ] No breaking changes to existing auth
- [ ] Manual testing completed:
  - [ ] Sign up with password
  - [ ] Verify email
  - [ ] Sign in with password
  - [ ] Sign out
  - [ ] Password reset flow
  - [ ] Rate limiting triggers
  - [ ] Google OAuth (if implemented)
  - [ ] Email-only auth still works
- [ ] Environment variables documented
- [ ] Deployment instructions updated

---

## Rollout Strategy

### Stage 2A: Password Auth (Phases 1-2)
**Duration:** 3-4 days
**Deploy:** After Phase 2 testing passes
**Features:**
- Password authentication
- Bcrypt hashing
- Password validation

**Rollout:**
1. Deploy to staging
2. Test password sign-up and sign-in
3. Verify email-only users still work
4. Monitor for errors (1-2 days)
5. Deploy to production if stable

### Stage 2B: Email Verification (Phase 3)
**Duration:** 2-3 days
**Deploy:** After Phase 3 testing passes
**Features:**
- Email verification workflow
- Verification tokens
- Email sending

**Rollout:**
1. Configure email service (Resend)
2. Deploy to staging
3. Test verification flow end-to-end
4. Check email deliverability
5. Deploy to production

### Stage 2C: Password Reset (Phase 4)
**Duration:** 2 days
**Deploy:** After Phase 4 testing passes
**Features:**
- Password reset request
- Reset tokens
- Reset confirmation

**Rollout:**
1. Deploy to staging
2. Test reset flow
3. Verify token expiration works
4. Deploy to production

### Stage 2D: Rate Limiting (Phase 5)
**Duration:** 1 day
**Deploy:** After Phase 5 testing passes
**Features:**
- Rate limiting on auth endpoints
- Redis-based limits
- Retry-After headers

**Rollout:**
1. Configure Upstash Redis
2. Deploy to staging
3. Test rate limits trigger
4. Monitor Redis performance
5. Deploy to production

### Stage 2E: OAuth (Phase 6, Optional)
**Duration:** 1-2 days
**Deploy:** After Phase 6 testing passes
**Features:**
- Google OAuth
- LinkedIn OAuth (optional)

**Rollout:**
1. Configure OAuth apps
2. Deploy to staging
3. Test OAuth flows
4. Deploy to production

---

## Risk Mitigation

### Risk 1: Email Delivery Failures
**Probability:** 🟡 MEDIUM
**Impact:** 🔴 HIGH (users can't verify email)

**Mitigation:**
- Use reliable email service (Resend recommended)
- Implement retry logic for failed sends
- Log email failures for monitoring
- Provide manual verification option (admin panel)
- Fallback: Allow admin to manually verify users

### Risk 2: Rate Limiting Too Aggressive
**Probability:** 🟡 MEDIUM
**Impact:** 🟡 MEDIUM (legitimate users blocked)

**Mitigation:**
- Conservative limits initially (5 sign-ins / 15 min)
- Monitor rate limit hits in production
- Allow admins to whitelist IPs
- Provide clear error messages with retry time
- Adjust limits based on real usage patterns

### Risk 3: OAuth Configuration Errors
**Probability:** 🟢 LOW
**Impact:** 🟡 MEDIUM (OAuth doesn't work)

**Mitigation:**
- Test OAuth in staging extensively
- Keep credentials provider as fallback
- Document OAuth setup thoroughly
- Monitor OAuth errors in production
- Graceful degradation if OAuth unavailable

### Risk 4: Password Hashing Performance
**Probability:** 🟢 LOW
**Impact:** 🟢 LOW (sign-up slightly slower)

**Mitigation:**
- Use bcrypt with 10 salt rounds (balanced)
- Show loading state during sign-up
- Consider async job queue for high load
- Monitor API response times

### Risk 5: Breaking Email-Only Auth
**Probability:** 🟢 LOW
**Impact:** 🔴 HIGH (existing users can't sign in)

**Mitigation:**
- Comprehensive backward compatibility tests
- Keep email-only auth as fallback
- Test with existing seed users (no password)
- Monitor sign-in errors after deployment
- Rollback plan ready

---

## Success Metrics

### Phase 2 Success Criteria
- ✅ Password sign-up works
- ✅ Password sign-in works
- ✅ Passwords hashed with bcrypt
- ✅ Email-only users still work
- ✅ Zero breaking changes

### Phase 3 Success Criteria
- ✅ Verification emails send within 1 minute
- ✅ Email verification completes successfully
- ✅ Unverified users cannot sign in
- ✅ Tokens expire after 24 hours

### Phase 4 Success Criteria
- ✅ Password reset emails send
- ✅ Reset tokens work within 1 hour
- ✅ Expired tokens rejected
- ✅ Passwords updated successfully

### Phase 5 Success Criteria
- ✅ Rate limits trigger at correct thresholds
- ✅ 429 responses include Retry-After headers
- ✅ Legitimate users not excessively blocked
- ✅ Rate limits reset correctly

### Phase 6 Success Criteria (Optional)
- ✅ Google OAuth flow works end-to-end
- ✅ OAuth users created with correct roles
- ✅ OAuth and password auth work for same user

### Overall Success Criteria
- ✅ All 233+ tests pass
- ✅ Security review score ≥ 90/100
- ✅ UX review: WCAG 2.1 AA compliant
- ✅ Zero critical security vulnerabilities
- ✅ No performance regressions
- ✅ Documentation complete

---

## Rollback Plan

If critical issues found after deployment:

### Immediate Rollback (< 5 minutes)
```bash
# Revert to previous commit
git revert HEAD
git push origin claude/onboard-with-repo-XXX

# Vercel auto-deploys previous version
```

### Partial Rollback (Disable Features)
```env
# Disable email verification (allow unverified sign-in)
REQUIRE_EMAIL_VERIFICATION=false

# Disable rate limiting (emergency bypass)
DISABLE_RATE_LIMITING=true

# Disable OAuth providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### Database Rollback
```bash
# If schema migration causes issues
npx prisma migrate resolve --rolled-back <migration-name>
npx prisma migrate deploy  # Re-deploy previous schema
```

---

## Appendix

### Environment Variables Reference

```env
# Existing (already configured)
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# Phase 3: Email Verification
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@pipetgo.com"

# Phase 5: Rate Limiting
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Phase 6: OAuth (Optional)
GOOGLE_CLIENT_ID="....apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."
```

### File Structure After Implementation

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/route.ts (modified - rate limiting)
│   │       ├── signup/route.ts (new)
│   │       ├── verify-email/route.ts (new)
│   │       └── reset-password/
│   │           ├── request/route.ts (new)
│   │           └── confirm/route.ts (new)
│   └── auth/
│       ├── signin/page.tsx (modified - OAuth buttons)
│       ├── signup/page.tsx (modified - password field)
│       ├── verify-email/page.tsx (new)
│       └── reset-password/
│           ├── page.tsx (new - request page)
│           └── [token]/page.tsx (new - confirm page)
├── lib/
│   ├── auth.ts (modified - password support, OAuth)
│   ├── password.ts (new)
│   ├── email.ts (new)
│   ├── email-templates.ts (new)
│   ├── rate-limit.ts (new)
│   └── validations/
│       └── auth.ts (new)
└── tests/
    ├── lib/
    │   └── password.test.ts (new)
    ├── api/
    │   └── auth/
    │       ├── signup.test.ts (new)
    │       ├── signin.test.ts (new)
    │       ├── verify-email.test.ts (new)
    │       └── reset-password.test.ts (new)
    └── auth/
        ├── oauth.test.ts (new)
        └── integration.test.ts (new)
```

### Dependencies Added

```json
{
  "dependencies": {
    "bcrypt": "^5.1.1",
    "resend": "^3.2.0",
    "@upstash/ratelimit": "^1.0.0",
    "@upstash/redis": "^1.28.0"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2"
  }
}
```

---

**Plan Prepared By:** Claude Code (Project Manager)
**Date:** 2025-11-17
**Total Estimated Duration:** 10-12 days
**Risk Level:** 🟢 LOW (all changes backward compatible)
**Breaking Changes:** ❌ NONE

**Next Step:** Review this plan with user, then proceed with Phase 1 execution.
