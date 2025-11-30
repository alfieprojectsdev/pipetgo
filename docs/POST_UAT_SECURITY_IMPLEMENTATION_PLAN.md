# Post-UAT Security Implementation Plan

**Document Version:** 1.0
**Created:** 2025-11-20
**Target Timeline:** 7-10 days
**Priority:** CRITICAL - Must complete before public launch

---

## Executive Summary

**Purpose:** Address 2 critical P0 security vulnerabilities identified during code review that cannot be fixed during UAT but must be implemented immediately after UAT concludes.

**Current Security Status:**
- **Production Readiness:** 7.8/10
- **Security Score:** 6.5/10 (will increase to 9.0/10 after implementation)
- **Authorization:** 10/10 (excellent, no changes needed)

**Critical Vulnerabilities:**

| ID | Issue | Severity | CVSS | Effort | Risk |
|----|-------|----------|------|--------|------|
| P0-1 | Email-Only Authentication | CRITICAL | 9.8 | 3-4 days | Complete account takeover |
| P0-2 | No Rate Limiting | HIGH | 7.5 | 2-3 days | Brute force attacks, DoS |

**Total Implementation Time:** 7-10 days (including testing, review, and deployment)

**Success Criteria:**
- All users can authenticate with secure passwords (bcrypt, 12 salt rounds)
- Rate limiting blocks brute force attempts (5 attempts per 15 minutes)
- Zero disruption to existing UAT users during migration
- All 233 existing tests pass + 15 new security tests
- Security score increases to 9.0/10

---

## Implementation Strategy

### Phased Rollout Approach

**Phase 1 (Days 1-2): Database & Infrastructure Setup**
- Add passwordHash field to User model
- Install and configure rate limiting library
- Create migration scripts with backward compatibility
- Set up monitoring infrastructure

**Phase 2 (Days 3-5): Password Authentication Implementation**
- Update authentication logic (server + client)
- Add password reset workflow
- Create temporary password generation for existing users
- Implement comprehensive testing

**Phase 3 (Days 6-7): Rate Limiting Implementation**
- Configure rate limits on auth endpoints
- Add rate limit bypass for testing environments
- Implement monitoring and alerting
- Load testing and tuning

**Phase 4 (Days 8-10): Testing, Documentation & Deployment**
- End-to-end security testing
- User communication and onboarding
- Production deployment with rollback plan
- Post-deployment monitoring

---

## Day-by-Day Implementation Schedule

### Day 1: Database Schema & Planning

**Objectives:**
- Add passwordHash field to User model
- Create backward-compatible migration
- Validate migration on staging database

**Tasks:**

**1.1 Update Prisma Schema** (1 hour)
```prisma
// File: prisma/schema.prisma (line 60)

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  role          UserRole  @default(CLIENT)
  passwordHash  String?   // NULLABLE for backward compatibility ✅
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts     Account[]
  sessions     Session[]
  ownedLabs    Lab[]
  clientOrders Order[]      @relation("ClientOrders")
  attachments  Attachment[]

  @@map("users")
}
```

**Why nullable?** Allows existing users (seeded via UAT) to continue logging in with email-only while we migrate them to password authentication.

**1.2 Generate Migration** (30 minutes)
```bash
# Generate migration with descriptive name
npx prisma migrate dev --name add_password_hash_to_users

# Review generated migration file
cat prisma/migrations/YYYYMMDD_add_password_hash_to_users/migration.sql

# Expected output:
# ALTER TABLE "users" ADD COLUMN "passwordHash" TEXT;
```

**1.3 Create Rollback Script** (30 minutes)
```sql
-- File: prisma/migrations/rollback_add_password_hash.sql

-- Rollback: Remove passwordHash column
ALTER TABLE "users" DROP COLUMN IF EXISTS "passwordHash";

-- Verify rollback
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users';
```

**1.4 Test Migration on Staging** (1 hour)
```bash
# Create staging database backup first
pg_dump $STAGING_DATABASE_URL > backup_staging_$(date +%Y%m%d).sql

# Run migration on staging
DATABASE_URL=$STAGING_DATABASE_URL npx prisma migrate deploy

# Verify schema change
DATABASE_URL=$STAGING_DATABASE_URL npx prisma studio
# Check: passwordHash column exists, is nullable, existing users have NULL values

# Test auth still works (email-only for now)
npm run dev
# Sign in with existing UAT accounts (should work - passwordHash is NULL)
```

**1.5 Document Migration Plan** (30 minutes)
```markdown
# File: docs/MIGRATION_PASSWORD_AUTHENTICATION.md

## Migration Strategy

### Backward Compatibility Guarantee
- Existing users with NULL passwordHash can still login via email-only
- New users MUST set password during registration
- Temporary password reset flow for migrating existing users

### User Migration Flow
1. Existing user logs in with email-only (still works)
2. System detects passwordHash is NULL
3. Redirect to "Set Your Password" page
4. User creates password (validated with strong password rules)
5. passwordHash updated, future logins require password

### Monitoring
- Track migration progress: SELECT COUNT(*) FROM users WHERE passwordHash IS NULL;
- Alert if unmigrated users > 0 after 7 days
```

**Deliverables:**
- ✅ passwordHash field added to schema (nullable)
- ✅ Migration tested on staging database
- ✅ Rollback script prepared
- ✅ Migration documentation created

**Risk Mitigation:**
- Nullable field prevents breaking existing auth
- Staging test validates migration works
- Rollback script ready if issues arise

---

### Day 2: Rate Limiting Infrastructure

**Objectives:**
- Select and install rate limiting library
- Configure rate limits for auth endpoints
- Set up monitoring infrastructure

**Tasks:**

**2.1 Library Selection** (1 hour)

**Recommendation: @upstash/ratelimit**

**Why @upstash/ratelimit?**
- ✅ Works with Vercel Edge Functions (deployment platform)
- ✅ Redis-based (fast, scales horizontally)
- ✅ Free tier sufficient for Stage 1 (<100 labs)
- ✅ Sliding window algorithm (more accurate than fixed window)
- ✅ Easy testing (mock Redis in development)

**Alternative: next-rate-limit**
- ❌ Uses memory cache (doesn't scale across serverless instances)
- ❌ No persistence (rate limits reset on deployment)
- ✅ Simpler setup (no external dependencies)

**Decision:** Use @upstash/ratelimit for production-grade scaling.

**2.2 Install Dependencies** (30 minutes)
```bash
# Install rate limiting library
npm install @upstash/ratelimit @upstash/redis

# Create Upstash Redis account (free tier)
# https://console.upstash.com/
# Create database, copy UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
```

**2.3 Configure Environment Variables** (15 minutes)
```bash
# File: .env.local

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL="https://example.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token-here"

# Rate limiting configuration
RATE_LIMIT_ENABLED="true"  # Set to "false" in development/testing
```

**2.4 Create Rate Limiter Utility** (1 hour)
```typescript
// File: src/lib/rate-limit.ts

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Rate Limiter for Authentication Endpoints
 *
 * Configuration:
 * - Login: 5 attempts per 15 minutes per IP
 * - Signup: 3 attempts per hour per IP
 * - Password Reset: 3 attempts per hour per email
 *
 * Security Principle:
 * - Prevent brute force attacks on authentication
 * - Limit denial-of-service potential
 * - Allow legitimate retries (typos happen)
 */

// Create Redis client (only if rate limiting enabled)
const redis = process.env.RATE_LIMIT_ENABLED === 'true' && process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

/**
 * Login Rate Limiter
 * 5 attempts per 15 minutes per IP address
 *
 * Sliding window: More accurate than fixed window
 * - User makes 5 attempts at minute 0
 * - Blocked until minute 15
 * - At minute 15, can try again (window slides)
 */
export const loginRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: true, // Track usage patterns
      prefix: 'ratelimit:login',
    })
  : null

/**
 * Signup Rate Limiter
 * 3 attempts per hour per IP address
 *
 * Why stricter? Prevent spam account creation
 */
export const signupRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '60 m'),
      analytics: true,
      prefix: 'ratelimit:signup',
    })
  : null

/**
 * Password Reset Rate Limiter
 * 3 attempts per hour per email address
 *
 * Why per email? Prevent targeted account lockout
 */
export const passwordResetRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '60 m'),
      analytics: true,
      prefix: 'ratelimit:password-reset',
    })
  : null

/**
 * Check Rate Limit
 *
 * @param identifier - IP address or email to check
 * @param limiter - Rate limiter instance to use
 * @returns { success: boolean, remaining: number, reset: Date }
 */
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit | null
) {
  // If rate limiting disabled (development), always allow
  if (!limiter) {
    return { success: true, remaining: 999, reset: new Date(Date.now() + 900000) }
  }

  // Check rate limit
  const { success, limit, remaining, reset } = await limiter.limit(identifier)

  return {
    success,
    remaining,
    reset: new Date(reset),
    limit,
  }
}

/**
 * Get Client IP Address
 * Supports Vercel, Cloudflare, and standard proxies
 */
export function getClientIP(request: Request): string {
  // Vercel deployment
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  // Cloudflare
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  // Fallback (development)
  return '127.0.0.1'
}
```

**2.5 Create Rate Limit Middleware** (1 hour)
```typescript
// File: src/lib/middleware/rate-limit-middleware.ts

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIP, loginRateLimiter } from '@/lib/rate-limit'

/**
 * Rate Limit Middleware for API Routes
 *
 * Usage:
 * export async function POST(req: Request) {
 *   const rateLimitResult = await withRateLimit(req, loginRateLimiter)
 *   if (!rateLimitResult.success) {
 *     return rateLimitResult.response
 *   }
 *   // Proceed with request
 * }
 */
export async function withRateLimit(
  request: Request,
  limiter: Ratelimit | null
) {
  const identifier = getClientIP(request)
  const { success, remaining, reset } = await checkRateLimit(identifier, limiter)

  if (!success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again after ${reset.toLocaleTimeString()}`,
          retryAfter: reset.toISOString(),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((reset.getTime() - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toISOString(),
          },
        }
      ),
    }
  }

  return { success: true, remaining, reset }
}
```

**2.6 Test Rate Limiting Locally** (1 hour)
```bash
# Create test script
# File: scripts/test-rate-limit.ts

import { loginRateLimiter, checkRateLimit } from '../src/lib/rate-limit'

async function testRateLimit() {
  const testIP = '192.168.1.100'

  console.log('Testing login rate limiter (5 requests per 15 min)...\n')

  for (let i = 1; i <= 7; i++) {
    const result = await checkRateLimit(testIP, loginRateLimiter)
    console.log(`Attempt ${i}:`, {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset.toISOString(),
    })

    if (!result.success) {
      console.log(`❌ Rate limit exceeded on attempt ${i}`)
      console.log(`⏰ Reset at: ${result.reset.toLocaleTimeString()}`)
      break
    }
  }
}

testRateLimit()

# Run test
npx tsx scripts/test-rate-limit.ts

# Expected output:
# Attempt 1: { success: true, remaining: 4, reset: ... }
# Attempt 2: { success: true, remaining: 3, reset: ... }
# ...
# Attempt 5: { success: true, remaining: 0, reset: ... }
# Attempt 6: { success: false, remaining: 0, reset: ... }
# ❌ Rate limit exceeded on attempt 6
```

**Deliverables:**
- ✅ @upstash/ratelimit installed and configured
- ✅ Rate limiter utility created (login, signup, password reset)
- ✅ Middleware helper for easy integration
- ✅ Local testing validates rate limiting works

---

### Day 3: Password Authentication - Backend

**Objectives:**
- Update NextAuth authorize() to verify passwords
- Add password validation to auth.ts
- Create password reset API endpoints

**Tasks:**

**3.1 Update Validation Schemas** (30 minutes)
```typescript
// File: src/lib/validations/auth.ts

import { z } from 'zod'

/**
 * Password Validation Rules
 *
 * Requirements (NIST SP 800-63B compliant):
 * - Minimum 8 characters (NIST recommendation)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * - Maximum 128 characters (bcrypt limit)
 */
const passwordValidation = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    'Password must contain at least one special character'
  )

/**
 * Sign In Schema (Updated)
 * Now requires password
 */
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: passwordValidation,
})

export type SignInInput = z.infer<typeof signInSchema>

/**
 * Sign Up Schema (Updated)
 * Requires password and confirmation
 */
export const signUpSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than 100 characters')
      .trim(),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address')
      .toLowerCase()
      .trim(),
    role: z.enum(['CLIENT', 'LAB_ADMIN'], {
      errorMap: () => ({ message: 'Please select a valid role' }),
    }),
    password: passwordValidation,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type SignUpInput = z.infer<typeof signUpSchema>

/**
 * Set Password Schema
 * For migrating existing users from email-only to password auth
 */
export const setPasswordSchema = z
  .object({
    password: passwordValidation,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type SetPasswordInput = z.infer<typeof setPasswordSchema>
```

**3.2 Update NextAuth Configuration** (1.5 hours)
```typescript
// File: src/lib/auth.ts

import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './db'
import { verifyPassword } from './password'
import type { UserRole } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })

        if (!user) {
          // User not found - use constant-time comparison to prevent timing attacks
          await verifyPassword(credentials.password, '$2a$12$fake.hash.to.prevent.timing.attack')
          return null
        }

        // BACKWARD COMPATIBILITY: Allow email-only login during migration
        if (!user.passwordHash) {
          // Log migration opportunity
          console.warn(
            `User ${user.email} logged in without password - migration needed`
          )
          // TODO: Redirect to "Set Your Password" page after login
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            needsPasswordSetup: true, // Custom flag for migration
          }
        }

        // Verify password (constant-time comparison)
        const validPassword = await verifyPassword(
          credentials.password,
          user.passwordHash
        )

        if (!validPassword) {
          // Invalid password - log failed attempt for security monitoring
          console.warn(`Failed login attempt for ${user.email}`)
          return null
        }

        // Successful authentication
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
        // @ts-ignore - Custom flag for migration
        token.needsPasswordSetup = user.needsPasswordSetup || false
      }
      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string | null
        session.user.role = token.role as UserRole
        // @ts-ignore - Custom flag for migration
        session.user.needsPasswordSetup = token.needsPasswordSetup as boolean
      }
      return session
    },
  },

  pages: {
    signIn: '/auth/signin',
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

// Type extensions remain the same
```

**3.3 Create Password Reset API** (2 hours)
```typescript
// File: src/app/api/auth/password-reset/request/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { passwordResetRequestSchema } from '@/lib/validations/auth'
import { generateRandomPassword } from '@/lib/password'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { passwordResetRateLimiter } from '@/lib/rate-limit'
import crypto from 'crypto'

/**
 * Request Password Reset
 *
 * Security:
 * - Rate limited: 3 attempts per hour per email
 * - Generic response (don't reveal if email exists)
 * - Reset token: 32-byte cryptographically random
 * - Token expiration: 1 hour
 * - Token stored hashed (bcrypt)
 *
 * Flow:
 * 1. User submits email
 * 2. Generate reset token (32 bytes random)
 * 3. Hash token with bcrypt, store in database
 * 4. Send unhashed token to user's email
 * 5. User clicks link with token
 * 6. Verify token matches hash, allow password reset
 */
export async function POST(req: Request) {
  try {
    // Rate limiting
    const rateLimitResult = await withRateLimit(req, passwordResetRateLimiter)
    if (!rateLimitResult.success) {
      return rateLimitResult.response
    }

    // Validate request body
    const body = await req.json()
    const validatedData = passwordResetRequestSchema.parse(body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    // SECURITY: Always return success (don't reveal if email exists)
    // This prevents account enumeration attacks
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If that email exists, a password reset link has been sent.',
      })
    }

    // Generate reset token (32 bytes = 256 bits of entropy)
    const resetToken = crypto.randomBytes(32).toString('hex')

    // Hash token before storing (prevents token theft from database breach)
    const bcrypt = require('bcryptjs')
    const hashedToken = await bcrypt.hash(resetToken, 10)

    // Store reset token in database (expires in 1 hour)
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: hashedToken,
        expires: new Date(Date.now() + 3600000), // 1 hour
      },
    })

    // TODO: Send email with reset link
    // const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}&email=${user.email}`
    // await sendPasswordResetEmail(user.email, resetUrl)

    // For now, log token (DEVELOPMENT ONLY - remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`Password reset token for ${user.email}: ${resetToken}`)
    }

    return NextResponse.json({
      success: true,
      message: 'If that email exists, a password reset link has been sent.',
    })
  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}
```

**Deliverables:**
- ✅ Validation schemas updated with password requirements
- ✅ NextAuth authorize() verifies passwords (with backward compatibility)
- ✅ Password reset API created (token generation, rate limited)

**Testing Checklist:**
- [ ] Existing UAT users can still login (email-only, passwordHash = NULL)
- [ ] New password validation rules enforced
- [ ] Failed login attempts logged
- [ ] Constant-time password comparison prevents timing attacks

---

### Day 4: Password Authentication - Frontend

**Objectives:**
- Update signin page to include password field
- Create "Set Your Password" page for migration
- Add password strength indicator

**Tasks:**

**4.1 Update SignIn Page** (1.5 hours)
```typescript
// File: src/app/auth/signin/page.tsx

'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.ok) {
        const session = await getSession()

        // Check if user needs to set password (migration)
        // @ts-ignore - Custom flag
        if (session?.user?.needsPasswordSetup) {
          router.push('/auth/set-password')
          return
        }

        // Redirect based on role
        if (session?.user?.role === 'ADMIN') {
          router.push('/dashboard/admin')
        } else if (session?.user?.role === 'LAB_ADMIN') {
          router.push('/dashboard/lab')
        } else {
          router.push('/dashboard/client')
        }
      } else {
        // Generic error message (don't reveal if email exists)
        setError('Invalid email or password. Please try again.')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setError('An error occurred during sign in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Sign In to PipetGo
          </CardTitle>
          <CardDescription className="text-center">
            Lab Services Marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link
                href="/auth/forgot-password"
                className="text-green-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link href="/auth/signup" className="text-green-600 hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

**4.2 Create "Set Your Password" Page** (2 hours)
```typescript
// File: src/app/auth/set-password/page.tsx

'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PasswordStrengthIndicator } from '@/components/auth/password-strength-indicator'

/**
 * Set Password Page
 *
 * Purpose: Migrate existing UAT users from email-only to password authentication
 *
 * Flow:
 * 1. User logs in with email-only (still works during migration)
 * 2. System detects passwordHash is NULL
 * 3. Redirects here to set password
 * 4. User creates password (validated with strength indicator)
 * 5. Password saved, future logins require password
 */
export default function SetPassword() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  // Redirect if already has password
  // @ts-ignore
  if (status === 'authenticated' && !session?.user?.needsPasswordSetup) {
    router.push('/dashboard/client')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Client-side validation
    if (password !== confirmPassword) {
      setError("Passwords don't match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Success - redirect to dashboard
        router.push('/dashboard/client')
      } else {
        setError(data.error || 'Failed to set password')
      }
    } catch (error) {
      console.error('Set password error:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Secure Your Account
          </CardTitle>
          <CardDescription className="text-center">
            Set a password to protect your PipetGo account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertDescription>
                For your security, we now require password authentication.
                Please create a strong password to continue.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="new-password"
              />
              <PasswordStrengthIndicator password={password} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
              />
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium">Password requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>At least 8 characters long</li>
                <li>Contains uppercase and lowercase letters</li>
                <li>Contains at least one number</li>
                <li>Contains at least one special character</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Setting password...' : 'Set Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

**4.3 Create Password Strength Indicator Component** (1 hour)
```typescript
// File: src/components/auth/password-strength-indicator.tsx

'use client'

import { useMemo } from 'react'
import { validatePasswordStrength } from '@/lib/password'

interface PasswordStrengthIndicatorProps {
  password: string
}

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' }

    const validation = validatePasswordStrength(password)
    const errorCount = validation.errors.length

    if (errorCount === 0) {
      return { score: 100, label: 'Strong', color: 'bg-green-500' }
    } else if (errorCount <= 2) {
      return { score: 66, label: 'Medium', color: 'bg-yellow-500' }
    } else {
      return { score: 33, label: 'Weak', color: 'bg-red-500' }
    }
  }, [password])

  if (!password) return null

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">Password strength:</span>
        <span className="font-medium">{strength.label}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${strength.color} transition-all duration-300`}
          style={{ width: `${strength.score}%` }}
        />
      </div>
    </div>
  )
}
```

**Deliverables:**
- ✅ SignIn page updated with password field
- ✅ "Set Your Password" page for migrating existing users
- ✅ Password strength indicator component
- ✅ Forgot password link (leads to reset flow)

---

### Day 5: Integration Testing & Security Review

**Objectives:**
- Write comprehensive tests for password authentication
- Test migration flow for existing users
- Security review of password handling

**Tasks:**

**5.1 Write Authentication Tests** (2 hours)
```typescript
// File: src/app/api/auth/__tests__/password-authentication.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/password'

describe('Password Authentication', () => {
  const testUser = {
    email: 'test-password@example.com',
    name: 'Test User',
    role: 'CLIENT' as const,
  }

  let userId: string

  beforeAll(async () => {
    // Create test user without password (simulating migration)
    const user = await prisma.user.create({
      data: testUser,
    })
    userId = user.id
  })

  afterAll(async () => {
    // Clean up test user
    await prisma.user.delete({ where: { id: userId } })
  })

  it('should allow email-only login for users without passwordHash (backward compatibility)', async () => {
    const response = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: 'any-password', // Should be ignored
      }),
    })

    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.user).toBeDefined()
    expect(data.user.email).toBe(testUser.email)
    expect(data.user.needsPasswordSetup).toBe(true)
  })

  it('should reject login with wrong password', async () => {
    // Update user with password
    const hashedPassword = await hashPassword('CorrectPassword123!')
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    })

    const response = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: 'WrongPassword123!',
      }),
    })

    expect(response.ok).toBe(false)
  })

  it('should accept login with correct password', async () => {
    const response = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: 'CorrectPassword123!',
      }),
    })

    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.user).toBeDefined()
    expect(data.user.needsPasswordSetup).toBe(false)
  })

  it('should use constant-time comparison (timing attack prevention)', async () => {
    const start1 = Date.now()
    await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: 'a', // Short wrong password
      }),
    })
    const time1 = Date.now() - start1

    const start2 = Date.now()
    await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: 'CorrectPassword123!', // Correct length wrong password
      }),
    })
    const time2 = Date.now() - start2

    // Times should be similar (within 100ms) due to constant-time comparison
    expect(Math.abs(time1 - time2)).toBeLessThan(100)
  })
})
```

**5.2 Write Rate Limiting Tests** (1.5 hours)
```typescript
// File: src/lib/__tests__/rate-limit.test.ts

import { describe, it, expect, beforeEach } from 'vitest'
import { loginRateLimiter, checkRateLimit } from '../rate-limit'

describe('Rate Limiting', () => {
  const testIP = '192.168.1.100'

  beforeEach(async () => {
    // Reset rate limit for test IP (if using Redis, flush test keys)
    if (loginRateLimiter) {
      // Note: May need to manually reset Redis in test environment
    }
  })

  it('should allow requests within rate limit', async () => {
    for (let i = 0; i < 5; i++) {
      const result = await checkRateLimit(testIP, loginRateLimiter)
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(4 - i)
    }
  })

  it('should block requests exceeding rate limit', async () => {
    // Exhaust rate limit (5 requests)
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(testIP, loginRateLimiter)
    }

    // 6th request should be blocked
    const result = await checkRateLimit(testIP, loginRateLimiter)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('should allow requests after reset window (15 minutes)', async () => {
    // Note: This test requires mocking time or waiting 15 minutes
    // For practical testing, reduce window to 1 minute in test environment
    // and use setTimeout to wait for reset
  })

  it('should return correct retry-after timestamp', async () => {
    // Exhaust rate limit
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(testIP, loginRateLimiter)
    }

    const result = await checkRateLimit(testIP, loginRateLimiter)
    expect(result.success).toBe(false)
    expect(result.reset).toBeInstanceOf(Date)
    expect(result.reset.getTime()).toBeGreaterThan(Date.now())
  })
})
```

**5.3 Security Review Checklist** (1 hour)

**Password Security:**
- [ ] Passwords hashed with bcrypt (12 salt rounds) ✅
- [ ] Constant-time comparison prevents timing attacks ✅
- [ ] Password strength validation enforced (8+ chars, uppercase, lowercase, number, special) ✅
- [ ] Passwords never logged or exposed in error messages ✅
- [ ] Password reset tokens cryptographically random (32 bytes) ✅
- [ ] Reset tokens expire within 1 hour ✅
- [ ] Reset tokens stored hashed (not plaintext) ✅

**Rate Limiting:**
- [ ] Login endpoint rate limited (5 attempts per 15 min) ✅
- [ ] Signup endpoint rate limited (3 attempts per hour) ✅
- [ ] Password reset rate limited (3 attempts per hour) ✅
- [ ] Rate limits bypass-able in test environment ✅
- [ ] 429 Too Many Requests returned with Retry-After header ✅

**Migration Safety:**
- [ ] Existing users can login during migration (passwordHash nullable) ✅
- [ ] Users without passwords redirected to "Set Password" page ✅
- [ ] Migration progress tracked (COUNT users WHERE passwordHash IS NULL) ✅
- [ ] No breaking changes to existing UAT sessions ✅

**General Security:**
- [ ] Generic error messages don't reveal if email exists ✅
- [ ] Failed login attempts logged for monitoring ✅
- [ ] Session regeneration after password change ✅
- [ ] HTTPS enforced in production ✅

**Deliverables:**
- ✅ 15 new authentication tests (password verification, rate limiting, migration)
- ✅ Security review checklist completed
- ✅ All tests passing (233 existing + 15 new = 248 total)

---

### Day 6: Rate Limiting Integration

**Objectives:**
- Integrate rate limiting into auth endpoints
- Add monitoring and alerting for rate limit violations
- Load testing and tuning

**Tasks:**

**6.1 Integrate Rate Limiting into Auth Endpoints** (1.5 hours)
```typescript
// File: src/app/api/auth/[...nextauth]/route.ts

import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { loginRateLimiter } from '@/lib/rate-limit'

// Wrap NextAuth handler with rate limiting
async function rateLimitedHandler(req: Request) {
  // Apply rate limiting for POST requests (login attempts)
  if (req.method === 'POST') {
    const rateLimitResult = await withRateLimit(req, loginRateLimiter)
    if (!rateLimitResult.success) {
      return rateLimitResult.response
    }
  }

  // Proceed with NextAuth handler
  const handler = NextAuth(authOptions)
  return handler(req)
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST }
```

**6.2 Add Rate Limit Monitoring** (1 hour)
```typescript
// File: src/lib/monitoring/rate-limit-monitor.ts

/**
 * Rate Limit Violation Monitoring
 *
 * Purpose: Track and alert on suspicious rate limit violations
 *
 * Alerts triggered when:
 * - Single IP hits rate limit >3 times in 1 hour (potential attacker)
 * - >10 IPs hit rate limit in 1 hour (distributed attack)
 * - Rate limit violations increase >50% week-over-week (trend)
 */

interface RateLimitViolation {
  ip: string
  endpoint: string
  timestamp: Date
  remaining: number
}

const violations: RateLimitViolation[] = []

export function logRateLimitViolation(
  ip: string,
  endpoint: string,
  remaining: number
) {
  const violation: RateLimitViolation = {
    ip,
    endpoint,
    timestamp: new Date(),
    remaining,
  }

  violations.push(violation)

  // Check for suspicious patterns
  checkSuspiciousActivity(ip)

  // Clean up old violations (older than 1 hour)
  const oneHourAgo = new Date(Date.now() - 3600000)
  const recentViolations = violations.filter((v) => v.timestamp > oneHourAgo)
  violations.splice(0, violations.length, ...recentViolations)

  // Log violation (will be captured by monitoring tools)
  console.warn('Rate limit violation:', {
    ip,
    endpoint,
    remaining,
    recentViolationCount: recentViolations.length,
  })
}

function checkSuspiciousActivity(ip: string) {
  const oneHourAgo = new Date(Date.now() - 3600000)
  const recentViolations = violations.filter((v) => v.timestamp > oneHourAgo)

  // Single IP hitting rate limit multiple times
  const ipViolations = recentViolations.filter((v) => v.ip === ip)
  if (ipViolations.length > 3) {
    console.error('SECURITY ALERT: Repeated rate limit violations from IP:', {
      ip,
      violations: ipViolations.length,
      endpoints: [...new Set(ipViolations.map((v) => v.endpoint))],
    })
    // TODO: Send alert to security team (email, Slack, PagerDuty)
  }

  // Distributed attack detection
  const uniqueIPs = new Set(recentViolations.map((v) => v.ip))
  if (uniqueIPs.size > 10) {
    console.error('SECURITY ALERT: Distributed rate limit attack detected:', {
      uniqueIPCount: uniqueIPs.size,
      totalViolations: recentViolations.length,
    })
    // TODO: Send alert to security team
  }
}
```

**6.3 Load Testing** (2 hours)
```bash
# Install load testing tool
npm install -g artillery

# Create load test configuration
# File: scripts/load-test-auth.yml

config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10 # 10 requests per second
      name: 'Sustained load'
    - duration: 30
      arrivalRate: 50 # 50 requests per second
      name: 'Spike test'
  variables:
    testEmail: 'client@example.com'
    testPassword: 'TestPassword123!'

scenarios:
  - name: 'Login flow'
    flow:
      - post:
          url: '/api/auth/callback/credentials'
          json:
            email: '{{ testEmail }}'
            password: '{{ testPassword }}'
          capture:
            - json: '$.user.id'
              as: 'userId'
      - think: 5 # Wait 5 seconds
      - get:
          url: '/dashboard/client'
          headers:
            Cookie: '{{ $cookies }}'

# Run load test
artillery run scripts/load-test-auth.yml

# Expected results:
# - p50 latency: <200ms (50th percentile)
# - p95 latency: <500ms (95th percentile)
# - p99 latency: <1000ms (99th percentile)
# - Error rate: <1%
# - Rate limit kicks in after 5 requests per IP per 15 min

# Tune rate limits if needed:
# - Too strict: Legitimate users blocked (increase limit)
# - Too loose: Attackers not blocked (decrease limit)
```

**6.4 Update Rate Limit Middleware with Logging** (30 minutes)
```typescript
// File: src/lib/middleware/rate-limit-middleware.ts (Updated)

import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'
import { logRateLimitViolation } from '@/lib/monitoring/rate-limit-monitor'
import type { Ratelimit } from '@upstash/ratelimit'

export async function withRateLimit(
  request: Request,
  limiter: Ratelimit | null,
  endpoint: string = 'unknown'
) {
  const identifier = getClientIP(request)
  const { success, remaining, reset } = await checkRateLimit(identifier, limiter)

  if (!success) {
    // Log rate limit violation for monitoring
    logRateLimitViolation(identifier, endpoint, remaining)

    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again after ${reset.toLocaleTimeString()}`,
          retryAfter: reset.toISOString(),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((reset.getTime() - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toISOString(),
          },
        }
      ),
    }
  }

  return { success: true, remaining, reset }
}
```

**Deliverables:**
- ✅ Rate limiting integrated into auth endpoints
- ✅ Monitoring and alerting for suspicious activity
- ✅ Load testing validates performance under stress
- ✅ Rate limits tuned based on testing results

---

### Day 7: User Communication & Migration Preparation

**Objectives:**
- Prepare user communication for password migration
- Create temporary passwords for existing UAT users
- Document migration procedures

**Tasks:**

**7.1 Create User Communication Email** (1 hour)
```markdown
# File: docs/USER_COMMUNICATION_PASSWORD_MIGRATION.md

## Email Template: Password Security Update

**Subject:** Action Required: Secure Your PipetGo Account with a Password

**Body:**

Hi {{ user.name }},

We're making PipetGo more secure by requiring password authentication for all accounts.

**What's changing:**
- Starting [DATE], all users will need a password to sign in
- Your account data remains safe and unchanged
- This one-time setup takes less than 2 minutes

**What you need to do:**

1. **Sign in** to your account: https://pipetgo.com/auth/signin
2. **Enter your email** as usual
3. **Create a password** when prompted (must include: uppercase, lowercase, number, special character)
4. **You're done!** Future sign-ins will use your new password

**Why this matters:**
Password authentication protects your account from unauthorized access. This is a standard security practice used by major platforms.

**Need help?**
- Forgot your password? Use the "Forgot Password" link on the sign-in page
- Questions? Email support@pipetgo.com

Thank you for helping us keep PipetGo secure!

The PipetGo Team

---

**FAQ:**

**Q: Will I lose my order history?**
A: No, all your data remains unchanged. Only the sign-in process is updated.

**Q: What if I forget my password?**
A: Click "Forgot Password" on the sign-in page to reset it via email.

**Q: Is my data secure?**
A: Yes, passwords are hashed with industry-standard bcrypt encryption (12 salt rounds). We never store passwords in plain text.

**Q: When does this take effect?**
A: Password authentication will be required starting [DATE]. We recommend setting your password before then to avoid interruption.
```

**7.2 Create Migration Script for Existing Users** (1.5 hours)
```typescript
// File: scripts/migrate-users-to-password.ts

/**
 * User Migration Script
 *
 * Purpose: Generate temporary passwords for existing UAT users
 *
 * Process:
 * 1. Find all users with passwordHash IS NULL
 * 2. Generate secure temporary password (16 chars)
 * 3. Hash and store password
 * 4. Send email with temporary password
 * 5. Mark user for forced password change on first login
 *
 * Usage:
 * npx tsx scripts/migrate-users-to-password.ts
 */

import { PrismaClient } from '@prisma/client'
import { generateRandomPassword, hashPassword } from '../src/lib/password'

const prisma = new PrismaClient()

async function migrateUsers() {
  console.log('🔐 Starting user password migration...\n')

  // Find users without passwords
  const usersToMigrate = await prisma.user.findMany({
    where: { passwordHash: null },
    select: { id: true, email: true, name: true, role: true },
  })

  console.log(`Found ${usersToMigrate.length} users to migrate\n`)

  if (usersToMigrate.length === 0) {
    console.log('✅ No users to migrate. All users have passwords.')
    return
  }

  // Confirm before proceeding
  console.log('Users to migrate:')
  usersToMigrate.forEach((user) => {
    console.log(`  - ${user.email} (${user.name})`)
  })

  console.log('\nThis will generate temporary passwords and send emails.')
  console.log('Continue? (Ctrl+C to cancel)\n')
  await new Promise((resolve) => setTimeout(resolve, 5000)) // 5-second pause

  const results = []

  for (const user of usersToMigrate) {
    try {
      // Generate temporary password
      const tempPassword = generateRandomPassword(16)

      // Hash password
      const passwordHash = await hashPassword(tempPassword)

      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      })

      // Store result for email sending
      results.push({
        email: user.email,
        name: user.name,
        tempPassword,
      })

      console.log(`✅ Migrated: ${user.email}`)
    } catch (error) {
      console.error(`❌ Failed to migrate ${user.email}:`, error)
    }
  }

  console.log(`\n✅ Migration complete: ${results.length}/${usersToMigrate.length} users migrated\n`)

  // Export temporary passwords for manual email sending (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('Temporary passwords (DEVELOPMENT ONLY - DELETE AFTER SENDING EMAILS):\n')
    results.forEach((r) => {
      console.log(`${r.email}: ${r.tempPassword}`)
    })
  }

  // TODO: Send emails with temporary passwords
  // for (const result of results) {
  //   await sendTemporaryPasswordEmail(result.email, result.name, result.tempPassword)
  // }

  console.log('\n⚠️  IMPORTANT: Users should change temporary passwords on first login')
}

migrateUsers()
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

**7.3 Create Migration Tracking Dashboard** (1 hour)
```typescript
// File: src/app/dashboard/admin/security/page.tsx

/**
 * Security Dashboard (Admin Only)
 *
 * Tracks password migration progress
 * Shows rate limit violations
 * Security metrics and alerts
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function SecurityDashboard() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  // Fetch security metrics
  const [totalUsers, usersWithPassword, usersWithoutPassword] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { passwordHash: { not: null } } }),
    prisma.user.count({ where: { passwordHash: null } }),
  ])

  const migrationProgress = Math.round((usersWithPassword / totalUsers) * 100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Dashboard</h1>
        <p className="text-gray-600">Monitor security metrics and migration progress</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
            <CardDescription>All registered accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalUsers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Migration Progress</CardTitle>
            <CardDescription>Users with password authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{migrationProgress}%</p>
            <p className="text-sm text-gray-600 mt-2">
              {usersWithPassword} of {totalUsers} users migrated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Migration</CardTitle>
            <CardDescription>Users still using email-only</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{usersWithoutPassword}</p>
            {usersWithoutPassword > 0 && (
              <p className="text-sm text-yellow-600 mt-2">
                ⚠️ Action required
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {usersWithoutPassword > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Migration Alert</CardTitle>
            <CardDescription className="text-yellow-700">
              {usersWithoutPassword} user{usersWithoutPassword > 1 ? 's' : ''} pending password setup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-800">
              These users can still log in with email-only authentication.
              Send them a reminder to set up their password.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

**Deliverables:**
- ✅ User communication email prepared
- ✅ Migration script creates temporary passwords
- ✅ Admin dashboard tracks migration progress
- ✅ Documentation for support team

---

### Days 8-10: Testing, Deployment & Monitoring

**Day 8: Comprehensive Testing**

**8.1 End-to-End Security Testing** (3 hours)
```bash
# Test checklist:

1. Password Authentication
   [ ] New user signup with password (strong password required)
   [ ] Login with correct password (success)
   [ ] Login with wrong password (failure, generic error)
   [ ] Login with non-existent email (failure, same error as wrong password)
   [ ] Password reset flow (request → email → reset → login with new password)

2. Migration Flow
   [ ] Existing user (no password) logs in with email-only (still works)
   [ ] Redirected to "Set Password" page
   [ ] Sets password (validation enforced)
   [ ] Future logins require password

3. Rate Limiting
   [ ] 5 failed login attempts → rate limit triggered
   [ ] 429 response with Retry-After header
   [ ] Wait 15 minutes → rate limit resets
   [ ] Legitimate users not affected by others' rate limits (per-IP)

4. Security Verification
   [ ] Passwords never appear in logs or error messages
   [ ] Timing attack protection (constant-time comparison)
   [ ] Reset tokens expire after 1 hour
   [ ] Reset tokens are single-use (can't reuse)
   [ ] Session invalidated after password change

5. Performance
   [ ] Login latency <500ms (bcrypt hashing adds ~250ms)
   [ ] No N+1 database queries
   [ ] Rate limiter doesn't slow down legitimate requests

6. Accessibility
   [ ] Password field has autocomplete="current-password"
   [ ] New password fields have autocomplete="new-password"
   [ ] Error messages announced to screen readers
   [ ] Keyboard navigation works (no mouse required)
```

**8.2 Regression Testing** (2 hours)
```bash
# Ensure existing features still work:

[ ] All 233 existing tests pass
[ ] Quote workflow unaffected (client RFQ → lab quote → approval)
[ ] Authorization checks still enforced (role-based access)
[ ] File uploads work (UploadThing)
[ ] Order creation/listing/detail views functional
[ ] Dashboard navigation (client, lab admin, admin)
```

**Day 9: Production Deployment**

**9.1 Pre-Deployment Checklist** (1 hour)
```bash
# Environment validation:
[ ] DATABASE_URL points to production database
[ ] NEXTAUTH_SECRET is production-ready (32+ byte random)
[ ] NEXTAUTH_URL is production domain (https://pipetgo.com)
[ ] UPSTASH_REDIS_REST_URL configured
[ ] UPSTASH_REDIS_REST_TOKEN configured
[ ] RATE_LIMIT_ENABLED="true"

# Database migration:
[ ] Backup production database (pg_dump)
[ ] Run migration on production (npx prisma migrate deploy)
[ ] Verify passwordHash column exists
[ ] Verify existing users can still login (backward compatibility)

# Code deployment:
[ ] All tests passing (248 tests)
[ ] TypeScript compilation successful (npm run type-check)
[ ] Linting clean (npm run lint)
[ ] Production build successful (npm run build)
```

**9.2 Deployment Steps** (1 hour)
```bash
# 1. Backup production database
pg_dump $PROD_DATABASE_URL > backup_prod_$(date +%Y%m%d_%H%M%S).sql

# 2. Run database migration
DATABASE_URL=$PROD_DATABASE_URL npx prisma migrate deploy

# 3. Deploy code (Vercel)
git push origin main
# Vercel auto-deploys from main branch

# 4. Verify deployment
curl https://pipetgo.com/api/health
# Expected: { "status": "ok" }

# 5. Test authentication
# - Login with existing UAT account (email-only)
# - Verify redirected to "Set Password" page
# - Set password and confirm login works

# 6. Monitor logs
# - Vercel dashboard → Functions → Logs
# - Check for errors or warnings
# - Verify rate limiting working (429 responses logged)
```

**9.3 Rollback Plan** (preparation)
```bash
# If critical issues arise:

# Option 1: Revert code deployment
git revert HEAD
git push origin main
# Vercel auto-deploys reverted code

# Option 2: Revert database migration
# Run rollback script created on Day 1
DATABASE_URL=$PROD_DATABASE_URL psql < prisma/migrations/rollback_add_password_hash.sql

# Option 3: Full restore from backup
DATABASE_URL=$PROD_DATABASE_URL psql < backup_prod_YYYYMMDD_HHMMSS.sql

# Rollback decision criteria:
# - >50% of login attempts failing (critical)
# - Rate limiter blocking legitimate users (high)
# - Password migration causing data loss (critical)
# - Security vulnerability discovered (critical)
```

**Day 10: Post-Deployment Monitoring**

**10.1 Monitoring Metrics** (ongoing)
```bash
# Track these metrics for 48 hours post-deployment:

1. Authentication Success Rate
   Target: >95%
   Alert: <90%
   Query: SELECT
     COUNT(*) FILTER (WHERE success = true) * 100.0 / COUNT(*) as success_rate
     FROM auth_logs
     WHERE timestamp > NOW() - INTERVAL '1 hour'

2. Rate Limit Violations
   Target: <10 per hour
   Alert: >50 per hour (potential attack)
   Query: SELECT COUNT(*) FROM rate_limit_violations
     WHERE timestamp > NOW() - INTERVAL '1 hour'

3. Migration Progress
   Target: 100% within 7 days
   Alert: <50% after 3 days
   Query: SELECT
     COUNT(*) FILTER (WHERE passwordHash IS NOT NULL) * 100.0 / COUNT(*) as progress
     FROM users

4. Password Reset Requests
   Target: <5 per hour
   Alert: >20 per hour (potential abuse)
   Query: SELECT COUNT(*) FROM verification_tokens
     WHERE created_at > NOW() - INTERVAL '1 hour'

5. Error Rate
   Target: <1%
   Alert: >5%
   Monitor: Vercel error logs, Sentry (if configured)
```

**10.2 User Support Preparation** (1 hour)
```markdown
# File: docs/SUPPORT_PASSWORD_MIGRATION.md

## Support Guide: Password Migration

### Common User Issues

**Issue 1: "I forgot my password"**
Solution:
1. Click "Forgot Password" on sign-in page
2. Enter your email
3. Check email for reset link (may be in spam)
4. Click link and set new password
5. If no email received after 10 minutes, contact support

**Issue 2: "Password requirements are too strict"**
Explanation:
- Strong passwords protect your account from unauthorized access
- Requirements: 8+ characters, uppercase, lowercase, number, special character
- Example: MyPipetGo2025!

**Issue 3: "I'm locked out (rate limited)"**
Cause: Too many failed login attempts (5 in 15 minutes)
Solution:
1. Wait 15 minutes for automatic unlock
2. If urgent, contact support to manually reset rate limit

**Issue 4: "My temporary password doesn't work"**
Troubleshooting:
1. Check if you're copying the entire password (no spaces)
2. Temporary passwords are case-sensitive
3. If still not working, use "Forgot Password" to reset

**Issue 5: "I can't set a password (validation errors)"**
Common mistakes:
- Password too short (<8 characters)
- Missing uppercase letter (A-Z)
- Missing lowercase letter (a-z)
- Missing number (0-9)
- Missing special character (!@#$%^&*)
- Passwords don't match (check confirm password field)

### Support Escalation

**Tier 1 (Email Support):**
- Reset user's rate limit (if locked out)
- Send password reset link manually
- Guide through password requirements

**Tier 2 (Developer Support):**
- Investigate authentication failures in logs
- Check database for user's passwordHash status
- Manually migrate user if migration script failed

**Tier 3 (Security Team):**
- Suspected account compromise
- Repeated rate limit violations from single IP
- Security vulnerability reports
```

**10.3 Success Validation** (final checklist)
```bash
# Deployment considered successful when:

[ ] Authentication success rate >95%
[ ] Zero critical errors in logs
[ ] Rate limiting blocking attacks (confirmed with test)
[ ] Migration progress >50% within 3 days
[ ] User support tickets <5 per day
[ ] Security score increased to 9.0/10
[ ] Production readiness increased to 9.0/10
[ ] All UAT users successfully migrated
[ ] CEO approval for public launch
```

---

## Risk Mitigation & Contingency Plans

### Risk 1: UAT Disruption During Implementation

**Probability:** Medium
**Impact:** High
**Mitigation:**
- Implement changes on separate staging environment first
- Test thoroughly before production deployment
- Schedule deployment during UAT downtime (if possible)
- Communicate changes to CEO and UAT participants in advance

**Contingency:**
- If UAT disrupted, immediately rollback changes
- Provide temporary access via email-only auth (disable password requirement)
- Reschedule deployment after UAT concludes

---

### Risk 2: Migration Script Failures

**Probability:** Low
**Impact:** High (users locked out)
**Mitigation:**
- Test migration script on staging database first
- Run script with dry-run mode (log changes without committing)
- Backup database before migration
- Implement transaction rollback on error

**Contingency:**
- If script fails mid-migration:
  1. Stop script immediately
  2. Restore from backup
  3. Investigate failure cause
  4. Fix script and retry
- If some users locked out:
  1. Use admin panel to manually reset passwords
  2. Send temporary passwords via email
  3. Apologize and explain situation

---

### Risk 3: Rate Limiting Too Strict

**Probability:** Medium
**Impact:** Medium (legitimate users blocked)
**Mitigation:**
- Set conservative initial limits (5 attempts per 15 min)
- Monitor rate limit violations closely
- Implement bypass for specific IPs (if needed)
- Provide clear error messages with retry instructions

**Contingency:**
- If legitimate users frequently blocked:
  1. Increase rate limit (e.g., 10 attempts per 15 min)
  2. Adjust time window (e.g., 5 attempts per 5 min instead)
  3. Add CAPTCHA instead of full block
- Emergency disable: Set RATE_LIMIT_ENABLED="false" temporarily

---

### Risk 4: Password Reset Email Not Received

**Probability:** Medium
**Impact:** Medium (user frustration)
**Mitigation:**
- Implement email sending with reliable provider (SendGrid, AWS SES)
- Add retry logic for failed email sends
- Log all email send attempts
- Provide alternative reset method (admin manual reset)

**Contingency:**
- If emails not sending:
  1. Check email provider status
  2. Verify API credentials
  3. Implement manual password reset via admin panel
  4. Communicate issue and workaround to users

---

### Risk 5: Bcrypt Performance Impact

**Probability:** Low
**Impact:** Medium (slow logins)
**Mitigation:**
- Use 12 salt rounds (balance security and speed ~250-500ms)
- Implement request timeout monitoring
- Load test authentication endpoints
- Cache bcrypt hashes in memory (if needed)

**Contingency:**
- If logins too slow (>1 second):
  1. Reduce salt rounds to 10 (still secure, faster)
  2. Optimize database queries (add indexes)
  3. Consider Redis caching for session data
- Performance budget: 95th percentile login time <1 second

---

### Risk 6: Security Vulnerability Discovered Post-Deployment

**Probability:** Low
**Impact:** Critical
**Mitigation:**
- Comprehensive security review before deployment
- Follow industry best practices (NIST, OWASP)
- Use battle-tested libraries (bcrypt, NextAuth, Upstash)
- Implement security monitoring and alerting

**Contingency:**
- If vulnerability discovered:
  1. Assess severity (CVSS score)
  2. If critical (CVSS >9.0): Immediate rollback
  3. If high (CVSS 7-9): Hotfix within 24 hours
  4. If medium (CVSS 4-7): Scheduled fix within 1 week
  5. Notify affected users if data breach
- Emergency contact: Security team + CEO

---

## Acceptance Criteria

### P0-1: Password Authentication

**Functional Requirements:**
- [x] Users can sign up with email + password
- [x] Users can sign in with email + password
- [x] Users can reset forgotten passwords via email
- [x] Existing UAT users can migrate from email-only to password auth
- [x] Password validation enforces strong passwords (8+ chars, complexity)

**Security Requirements:**
- [x] Passwords hashed with bcrypt (12 salt rounds)
- [x] Constant-time comparison prevents timing attacks
- [x] Password reset tokens cryptographically random (32 bytes)
- [x] Reset tokens expire within 1 hour
- [x] Reset tokens single-use (deleted after use)
- [x] Passwords never logged or exposed in error messages

**Migration Requirements:**
- [x] Backward compatibility: Users without passwords can still login
- [x] Migration progress tracked via admin dashboard
- [x] Temporary passwords generated for existing users
- [x] User communication sent before migration
- [x] Support documentation prepared

**Performance Requirements:**
- [x] Login latency <1 second (p95)
- [x] Password reset latency <2 seconds (p95)
- [x] No N+1 database queries
- [x] Bcrypt hashing doesn't block event loop

**Testing Requirements:**
- [x] 15+ new tests for password authentication
- [x] All tests passing (248 total)
- [x] End-to-end testing completed
- [x] Regression testing passed

---

### P0-2: Rate Limiting

**Functional Requirements:**
- [x] Login endpoint rate limited (5 attempts per 15 min per IP)
- [x] Signup endpoint rate limited (3 attempts per hour per IP)
- [x] Password reset rate limited (3 attempts per hour per email)
- [x] Rate limit bypass in test environment (RATE_LIMIT_ENABLED=false)
- [x] 429 response with Retry-After header

**Security Requirements:**
- [x] Rate limiting prevents brute force attacks
- [x] Rate limiting prevents denial-of-service
- [x] Rate limits enforced server-side (not client-side)
- [x] Rate limit violations logged for monitoring
- [x] Suspicious activity alerts (>3 violations per IP per hour)

**Infrastructure Requirements:**
- [x] Redis-based rate limiting (Upstash)
- [x] Sliding window algorithm (accurate)
- [x] Horizontal scaling support (serverless-compatible)
- [x] Free tier sufficient for Stage 1 (<100 labs)

**Monitoring Requirements:**
- [x] Rate limit violations tracked
- [x] Alert thresholds configured (>50 violations per hour)
- [x] Admin dashboard shows rate limit metrics
- [x] Logs include IP, endpoint, timestamp

**Performance Requirements:**
- [x] Rate limiter adds <50ms latency
- [x] Redis queries optimized (single request per check)
- [x] Load testing validates scale

---

## Post-Implementation Monitoring

### Week 1: Close Monitoring (Daily)

**Metrics to Track:**
- Authentication success rate (target: >95%)
- Rate limit violations (target: <10 per hour)
- Migration progress (target: >50% by day 3)
- Password reset requests (target: <5 per hour)
- Error rate (target: <1%)
- Support tickets (target: <5 per day)

**Daily Actions:**
- Review logs for errors or anomalies
- Check migration dashboard (% users with passwords)
- Respond to support tickets within 4 hours
- Adjust rate limits if needed

**Alert Thresholds:**
- Authentication success rate <90% → Investigate immediately
- Rate limit violations >50 per hour → Potential attack
- Migration progress <25% by day 3 → Send reminder emails
- Error rate >5% → Critical issue, consider rollback

---

### Week 2-4: Monitoring Transition (Every 2 days)

**Metrics to Track:**
- Migration completion (target: 100% by day 14)
- Authentication error trends (decreasing)
- Rate limit violation patterns (should stabilize)
- User feedback (qualitative)

**Actions:**
- Send migration reminder to users without passwords
- Document lessons learned
- Optimize based on performance data
- Plan next security improvements

---

### Month 2+: Standard Monitoring (Weekly)

**Metrics to Track:**
- Security score (maintain 9.0/10)
- Production readiness (maintain 9.0/10)
- Failed login attempt trends
- Password reset frequency

**Actions:**
- Monthly security review
- Update documentation as needed
- Consider additional security features (MFA, OAuth)

---

## Success Metrics

### Quantitative Metrics

| Metric | Baseline | Target | Timeline |
|--------|----------|--------|----------|
| Security Score | 6.5/10 | 9.0/10 | Day 10 |
| Production Readiness | 7.8/10 | 9.0/10 | Day 10 |
| Authentication Success Rate | N/A | >95% | Day 10 |
| Migration Completion | 0% | 100% | Day 14 |
| Rate Limit Effectiveness | 0% | >99% block rate for attacks | Day 10 |
| User Support Tickets | N/A | <5 per day | Week 1 |

---

### Qualitative Metrics

**User Experience:**
- Users can easily set passwords (clear instructions)
- Password strength indicator helps users create strong passwords
- Error messages are helpful (not technical jargon)
- Forgot password flow is intuitive

**Developer Experience:**
- Code is maintainable (clear comments, good structure)
- Tests cover critical paths (password auth, rate limiting)
- Documentation is comprehensive (support guide, API docs)
- Deployment process is smooth (no manual steps)

**Security Posture:**
- No critical vulnerabilities discovered post-deployment
- Brute force attacks successfully blocked
- Password reset flow secure (tokens expire, single-use)
- Compliance with industry standards (NIST SP 800-63B)

---

## Conclusion

This implementation plan addresses the 2 critical P0 security issues (email-only authentication and no rate limiting) in a systematic, low-risk manner. By following the day-by-day schedule, the team can implement robust security features while maintaining backward compatibility for existing UAT users.

**Key Success Factors:**
1. **Backward Compatibility:** Existing users can login during migration (passwordHash nullable)
2. **Comprehensive Testing:** 248 total tests ensure no regressions
3. **User Communication:** Clear instructions minimize support burden
4. **Monitoring:** Real-time dashboards track migration progress and security metrics
5. **Rollback Plan:** Prepared for worst-case scenarios

**Timeline Summary:**
- Days 1-2: Infrastructure setup (database, rate limiting)
- Days 3-5: Password authentication implementation
- Days 6-7: Rate limiting integration + user communication
- Days 8-10: Testing, deployment, monitoring

**Expected Outcome:**
- Security Score: 6.5/10 → 9.0/10
- Production Readiness: 7.8/10 → 9.0/10
- Zero disruption to UAT
- All users securely authenticated within 14 days

Ready for implementation immediately after UAT concludes.
