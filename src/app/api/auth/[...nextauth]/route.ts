/**
 * 🔒 SECURITY: NextAuth API Route with Rate Limiting
 * ===================================================
 * Handles all NextAuth authentication operations with rate limiting
 * protection on login attempts.
 *
 * Rate Limiting:
 * - Login attempts: 5 per 15 minutes per IP
 * - Other operations: No rate limiting (session checks, signout, etc.)
 *
 * Security:
 * - Rate limiting prevents brute-force login attacks
 * - IP-based limiting (works with proxies via x-forwarded-for)
 * - Returns 429 with Retry-After header when limit exceeded
 * - Fails open if Redis unavailable (allows requests through)
 */

import { NextRequest } from 'next/server'
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  loginRateLimiter,
  getClientIp,
  checkRateLimit,
  createRateLimitResponse
} from '@/lib/rate-limit'

const handler = NextAuth(authOptions)

/**
 * Custom POST handler with rate limiting
 * Only rate limits signin callback requests (actual login attempts)
 */
export async function POST(req: NextRequest) {
  // Only rate limit signin requests (not signout, csrf, session, etc.)
  // Parse the URL to check if this is a credentials callback (login attempt)
  const url = new URL(req.url)
  const pathname = url.pathname
  const isSigninCallback = pathname.includes('/callback/credentials')

  if (isSigninCallback) {
    // Rate limit login attempts
    const ip = getClientIp(req)
    const rateLimit = await checkRateLimit(loginRateLimiter, ip)

    if (rateLimit && !rateLimit.success) {
      return createRateLimitResponse(rateLimit.retryAfter!)
    }
  }

  // Proceed with NextAuth handler
  // NextAuth v4 automatically detects App Router by receiving a Web Request
  // and returns a Web Response
  return handler(req)
}

/**
 * GET requests don't need rate limiting
 * Used for: session checks, csrf tokens, provider callbacks
 */
export { handler as GET }