/**
 * 🔒 SECURITY: Rate Limiting Utility
 * ================================
 * Protects authentication endpoints from brute-force attacks using
 * @upstash/ratelimit with Redis backend.
 *
 * Rate Limits:
 * - Login: 5 attempts per 15 minutes per IP
 * - Signup: 3 attempts per hour per IP
 * - Password Reset: 3 attempts per hour per email
 * - Set Password: 5 attempts per hour per user ID
 *
 * Security Features:
 * - Sliding window algorithm (more accurate than fixed window)
 * - IP-based limiting for public endpoints
 * - User/email-based limiting for authenticated endpoints
 * - Automatic cleanup of old rate limit data
 * - Analytics for monitoring suspicious activity
 *
 * Environment Variables:
 * - UPSTASH_REDIS_REST_URL: Redis endpoint (optional in development)
 * - UPSTASH_REDIS_REST_TOKEN: Redis auth token (optional in development)
 *
 * Behavior:
 * - Production (Redis configured): Rate limiting active
 * - Development (Redis not configured): Rate limiting disabled (fail open)
 * - Redis connection failure: Fail open (allow request, log error)
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest } from 'next/server'

// ============================================================================
// REDIS CLIENT SETUP
// ============================================================================

/**
 * Initialize Redis client for rate limiting
 * Uses Upstash Redis in production, null in development/testing
 *
 * When null, all rate limiters will be null and rate limiting is disabled.
 * This allows development without Redis infrastructure.
 */
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// ============================================================================
// RATE LIMITERS
// ============================================================================

/**
 * Login Rate Limiter
 * 5 attempts per 15 minutes per IP address
 *
 * Prevents:
 * - Credential stuffing attacks
 * - Brute-force password guessing
 * - Automated login attempts
 *
 * Usage: checkRateLimit(loginRateLimiter, getClientIp(req))
 */
export const loginRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: true,
      prefix: 'ratelimit:login',
    })
  : null

/**
 * Signup Rate Limiter
 * 3 attempts per hour per IP address
 *
 * Prevents:
 * - Spam account creation
 * - Fake user registrations
 * - Email enumeration attacks
 *
 * Usage: checkRateLimit(signupRateLimiter, getClientIp(req))
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
 * Prevents:
 * - Password reset spam
 * - Email flooding
 * - Account enumeration
 *
 * Usage: checkRateLimit(passwordResetRateLimiter, email)
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
 * Set Password Rate Limiter
 * 5 attempts per hour per user ID
 *
 * Prevents:
 * - Rapid password changes (potential account takeover indicator)
 * - Password reset token brute-forcing
 * - Automated password cycling
 *
 * Usage: checkRateLimit(setPasswordRateLimiter, userId)
 */
export const setPasswordRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 m'),
      analytics: true,
      prefix: 'ratelimit:set-password',
    })
  : null

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get Client IP Address
 * Extracts IP from request headers (works with Vercel, Cloudflare, nginx)
 *
 * Header Priority:
 * 1. cf-connecting-ip (Cloudflare)
 * 2. x-real-ip (nginx, most reliable for single IP)
 * 3. x-forwarded-for (standard, but can be spoofed)
 * 4. 127.0.0.1 (fallback for development)
 *
 * Security Note:
 * - x-forwarded-for can contain multiple IPs (proxy chain)
 * - Always use first IP in the list (original client)
 * - In production, ensure reverse proxy strips untrusted headers
 *
 * @param req - Next.js request object
 * @returns IP address string (IPv4 or IPv6)
 */
export function getClientIp(req: NextRequest): string {
  // Try various headers (in order of reliability)
  const cfConnecting = req.headers.get('cf-connecting-ip')
  const real = req.headers.get('x-real-ip')
  const forwarded = req.headers.get('x-forwarded-for')

  if (cfConnecting) return cfConnecting
  if (real) return real
  if (forwarded) return forwarded.split(',')[0].trim()

  // Fallback (development)
  return '127.0.0.1'
}

/**
 * Check Rate Limit
 * Returns rate limit result or null if rate limiting is disabled
 *
 * Behavior:
 * - Redis configured: Returns rate limit result
 * - Redis not configured: Returns null (rate limiting disabled)
 * - Redis connection failure: Returns null (fail open, logs error)
 *
 * Fail Open Strategy:
 * - If rate limiting is broken, allow requests through
 * - Prevents Redis outage from taking down authentication
 * - Logs errors for monitoring/alerting
 *
 * @param limiter - Rate limiter instance (or null)
 * @param identifier - Unique identifier (IP, email, user ID)
 * @returns Rate limit result or null if disabled
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
} | null> {
  // Rate limiting disabled (development/testing)
  if (!limiter) {
    return null
  }

  try {
    const result = await limiter.limit(identifier)

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // Fail open (allow request if rate limiting is broken)
    // This prevents Redis outages from breaking authentication
    return null
  }
}

/**
 * Format Retry-After Header
 * Returns seconds until rate limit resets
 *
 * Used for HTTP Retry-After header (RFC 7231)
 *
 * @param resetTimestamp - Unix timestamp (milliseconds) when limit resets
 * @returns Seconds until reset (minimum 0)
 */
export function formatRetryAfter(resetTimestamp: number): number {
  const now = Date.now()
  const secondsUntilReset = Math.ceil((resetTimestamp - now) / 1000)
  return Math.max(0, secondsUntilReset)
}

/**
 * Create Rate Limit Error Response
 * Returns standardized 429 response with Retry-After header
 *
 * HTTP Headers:
 * - Retry-After: Seconds until client can retry
 * - X-RateLimit-Limit: Maximum requests allowed
 * - X-RateLimit-Remaining: Requests remaining (0 when limited)
 *
 * Response Body:
 * - error: "Too many requests"
 * - message: Human-readable message with retry time
 * - retryAfter: Seconds until reset (for programmatic access)
 *
 * @param retryAfter - Seconds until rate limit resets
 * @returns Response object with 429 status
 */
export function createRateLimitResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': '5', // Generic limit (actual varies by endpoint)
        'X-RateLimit-Remaining': '0',
      },
    }
  )
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Rate Limit Result
 * Returned by checkRateLimit() when rate limiting is active
 */
export interface RateLimitResult {
  success: boolean       // true if request allowed, false if rate limited
  limit: number          // Maximum requests allowed in window
  remaining: number      // Requests remaining in current window
  reset: number          // Unix timestamp (ms) when limit resets
  retryAfter?: number    // Seconds until reset (only present if rate limited)
}

/**
 * Rate Limiter Type
 * Identifies which rate limiter to use
 */
export type RateLimiterType =
  | 'login'           // Login attempts (5 per 15 min per IP)
  | 'signup'          // Signup attempts (3 per hour per IP)
  | 'passwordReset'   // Password reset requests (3 per hour per email)
  | 'setPassword'     // Password changes (5 per hour per user ID)
