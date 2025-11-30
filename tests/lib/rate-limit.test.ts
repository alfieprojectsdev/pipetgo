/**
 * Rate Limit Utility Tests (P0-2 Rate Limiting)
 * ==============================================
 * Tests rate limiting utility functions for authentication endpoints.
 *
 * Test Coverage:
 * - IP address extraction from various headers
 * - Rate limit checking with null limiters (development mode)
 * - Retry-after formatting
 * - Rate limit response creation
 * - Graceful degradation when Redis not configured
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getClientIp,
  checkRateLimit,
  formatRetryAfter,
  createRateLimitResponse,
  loginRateLimiter,
  signupRateLimiter,
  passwordResetRateLimiter,
  setPasswordRateLimiter
} from '@/lib/rate-limit'
import { NextRequest } from 'next/server'

describe('Rate Limit Utility', () => {
  // ============================================================================
  // IP ADDRESS EXTRACTION TESTS
  // ============================================================================
  describe('getClientIp()', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const req = new Request('http://localhost:3000', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' }
      }) as NextRequest

      const ip = getClientIp(req)
      expect(ip).toBe('192.168.1.1')  // First IP in list
    })

    it('should extract IP from x-real-ip header', () => {
      const req = new Request('http://localhost:3000', {
        headers: { 'x-real-ip': '192.168.1.2' }
      }) as NextRequest

      const ip = getClientIp(req)
      expect(ip).toBe('192.168.1.2')
    })

    it('should prioritize cf-connecting-ip over other headers', () => {
      const req = new Request('http://localhost:3000', {
        headers: {
          'cf-connecting-ip': '192.168.1.3',
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '192.168.1.2'
        }
      }) as NextRequest

      const ip = getClientIp(req)
      expect(ip).toBe('192.168.1.3')  // Cloudflare header prioritized
    })

    it('should prioritize x-real-ip over x-forwarded-for', () => {
      const req = new Request('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
          'x-real-ip': '192.168.1.2'
        }
      }) as NextRequest

      const ip = getClientIp(req)
      expect(ip).toBe('192.168.1.2')  // x-real-ip more reliable
    })

    it('should fall back to 127.0.0.1 when no headers', () => {
      const req = new Request('http://localhost:3000') as NextRequest

      const ip = getClientIp(req)
      expect(ip).toBe('127.0.0.1')
    })

    it('should trim whitespace from x-forwarded-for IP', () => {
      const req = new Request('http://localhost:3000', {
        headers: { 'x-forwarded-for': ' 192.168.1.1 , 10.0.0.1' }
      }) as NextRequest

      const ip = getClientIp(req)
      expect(ip).toBe('192.168.1.1')  // Trimmed whitespace
    })

    it('should handle IPv6 addresses', () => {
      const req = new Request('http://localhost:3000', {
        headers: { 'x-real-ip': '2001:0db8:85a3:0000:0000:8a2e:0370:7334' }
      }) as NextRequest

      const ip = getClientIp(req)
      expect(ip).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334')
    })

    it('should handle single IP in x-forwarded-for', () => {
      const req = new Request('http://localhost:3000', {
        headers: { 'x-forwarded-for': '192.168.1.1' }
      }) as NextRequest

      const ip = getClientIp(req)
      expect(ip).toBe('192.168.1.1')
    })
  })

  // ============================================================================
  // RATE LIMIT CHECKING TESTS
  // ============================================================================
  describe('checkRateLimit()', () => {
    it('should return null when rate limiter is null (Redis not configured)', async () => {
      const result = await checkRateLimit(null, '192.168.1.1')
      expect(result).toBeNull()
    })

    it('should handle null login rate limiter gracefully', async () => {
      // In test environment without Redis, limiters are null
      const result = await checkRateLimit(loginRateLimiter, '192.168.1.1')
      expect(result).toBeNull()
    })

    it('should handle null signup rate limiter gracefully', async () => {
      const result = await checkRateLimit(signupRateLimiter, '192.168.1.1')
      expect(result).toBeNull()
    })

    it('should handle null password reset rate limiter gracefully', async () => {
      const result = await checkRateLimit(passwordResetRateLimiter, 'test@example.com')
      expect(result).toBeNull()
    })

    it('should handle null set password rate limiter gracefully', async () => {
      const result = await checkRateLimit(setPasswordRateLimiter, 'user-123')
      expect(result).toBeNull()
    })

    it('should accept various identifier formats', async () => {
      // IP address
      const ipResult = await checkRateLimit(null, '192.168.1.1')
      expect(ipResult).toBeNull()

      // Email
      const emailResult = await checkRateLimit(null, 'test@example.com')
      expect(emailResult).toBeNull()

      // User ID (CUID)
      const userIdResult = await checkRateLimit(null, 'cljn9x8s00000qzrmh4q7b2kl')
      expect(userIdResult).toBeNull()
    })
  })

  // ============================================================================
  // RETRY-AFTER FORMATTING TESTS
  // ============================================================================
  describe('formatRetryAfter()', () => {
    it('should return seconds until reset for future timestamp', () => {
      const futureTime = Date.now() + 60000  // 60 seconds from now
      const retryAfter = formatRetryAfter(futureTime)

      expect(retryAfter).toBeGreaterThan(0)
      expect(retryAfter).toBeLessThanOrEqual(60)
    })

    it('should return 0 for past timestamp', () => {
      const pastTime = Date.now() - 60000  // 60 seconds ago
      const retryAfter = formatRetryAfter(pastTime)

      expect(retryAfter).toBe(0)
    })

    it('should return 0 for current timestamp', () => {
      const now = Date.now()
      const retryAfter = formatRetryAfter(now)

      expect(retryAfter).toBeGreaterThanOrEqual(0)
      expect(retryAfter).toBeLessThanOrEqual(1)
    })

    it('should round up to nearest second', () => {
      const futureTime = Date.now() + 1500  // 1.5 seconds from now
      const retryAfter = formatRetryAfter(futureTime)

      expect(retryAfter).toBe(2)  // Rounded up from 1.5
    })

    it('should handle large time differences', () => {
      const futureTime = Date.now() + 3600000  // 1 hour from now
      const retryAfter = formatRetryAfter(futureTime)

      expect(retryAfter).toBeGreaterThan(3590)
      expect(retryAfter).toBeLessThanOrEqual(3600)
    })

    it('should never return negative values', () => {
      const veryPastTime = Date.now() - 86400000  // 24 hours ago
      const retryAfter = formatRetryAfter(veryPastTime)

      expect(retryAfter).toBe(0)
    })
  })

  // ============================================================================
  // RATE LIMIT RESPONSE CREATION TESTS
  // ============================================================================
  describe('createRateLimitResponse()', () => {
    it('should return 429 status code', () => {
      const response = createRateLimitResponse(60)
      expect(response.status).toBe(429)
    })

    it('should include Retry-After header', () => {
      const response = createRateLimitResponse(60)
      expect(response.headers.get('Retry-After')).toBe('60')
    })

    it('should include X-RateLimit-Limit header', () => {
      const response = createRateLimitResponse(60)
      expect(response.headers.get('X-RateLimit-Limit')).toBe('5')
    })

    it('should include X-RateLimit-Remaining header', () => {
      const response = createRateLimitResponse(60)
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
    })

    it('should include Content-Type header', () => {
      const response = createRateLimitResponse(60)
      expect(response.headers.get('Content-Type')).toBe('application/json')
    })

    it('should include JSON error message', async () => {
      const response = createRateLimitResponse(60)
      const data = await response.json()

      expect(data.error).toBe('Too many requests')
      expect(data.retryAfter).toBe(60)
      expect(data.message).toContain('60 seconds')
    })

    it('should handle zero retry-after', async () => {
      const response = createRateLimitResponse(0)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('0')
      expect(data.retryAfter).toBe(0)
      expect(data.message).toContain('0 seconds')
    })

    it('should handle large retry-after values', async () => {
      const response = createRateLimitResponse(3600)  // 1 hour
      const data = await response.json()

      expect(response.headers.get('Retry-After')).toBe('3600')
      expect(data.retryAfter).toBe(3600)
      expect(data.message).toContain('3600 seconds')
    })

    it('should return valid JSON response', async () => {
      const response = createRateLimitResponse(30)
      const data = await response.json()

      // Should have all required fields
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(data).toHaveProperty('retryAfter')

      // Should be parseable as JSON
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
      expect(typeof data.retryAfter).toBe('number')
    })
  })

  // ============================================================================
  // RATE LIMITER CONFIGURATION TESTS
  // ============================================================================
  describe('Rate Limiter Configuration', () => {
    it('should create login rate limiter (or null if Redis not configured)', () => {
      // In test environment, limiter may be null
      expect(loginRateLimiter === null || loginRateLimiter !== undefined).toBe(true)
    })

    it('should create signup rate limiter (or null if Redis not configured)', () => {
      expect(signupRateLimiter === null || signupRateLimiter !== undefined).toBe(true)
    })

    it('should create password reset rate limiter (or null if Redis not configured)', () => {
      expect(passwordResetRateLimiter === null || passwordResetRateLimiter !== undefined).toBe(true)
    })

    it('should create set password rate limiter (or null if Redis not configured)', () => {
      expect(setPasswordRateLimiter === null || setPasswordRateLimiter !== undefined).toBe(true)
    })

    it('should have consistent null state across all limiters', () => {
      // All limiters should be null or all should be configured
      const limiters = [
        loginRateLimiter,
        signupRateLimiter,
        passwordResetRateLimiter,
        setPasswordRateLimiter
      ]

      const allNull = limiters.every(limiter => limiter === null)
      const allConfigured = limiters.every(limiter => limiter !== null)

      expect(allNull || allConfigured).toBe(true)
    })
  })

  // ============================================================================
  // GRACEFUL DEGRADATION TESTS
  // ============================================================================
  describe('Graceful Degradation', () => {
    it('should allow requests when rate limiting is disabled', async () => {
      const result = await checkRateLimit(null, '192.168.1.1')

      // Should return null (not blocking request)
      expect(result).toBeNull()
    })

    it('should not throw errors when limiter is null', async () => {
      // Should not throw
      await expect(checkRateLimit(null, '192.168.1.1')).resolves.toBeNull()
      await expect(checkRateLimit(null, 'test@example.com')).resolves.toBeNull()
      await expect(checkRateLimit(null, 'user-123')).resolves.toBeNull()
    })

    it('should accept empty identifier when limiter is null', async () => {
      const result = await checkRateLimit(null, '')
      expect(result).toBeNull()
    })

    it('should handle special characters in identifier', async () => {
      const result = await checkRateLimit(null, 'test+alias@example.com')
      expect(result).toBeNull()
    })
  })

  // ============================================================================
  // EDGE CASES
  // ============================================================================
  describe('Edge Cases', () => {
    it('should handle multiple commas in x-forwarded-for', () => {
      const req = new Request('http://localhost:3000', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1' }
      }) as NextRequest

      const ip = getClientIp(req)
      expect(ip).toBe('192.168.1.1')  // Only first IP
    })

    it('should handle empty x-forwarded-for header', () => {
      const req = new Request('http://localhost:3000', {
        headers: { 'x-forwarded-for': '' }
      }) as NextRequest

      const ip = getClientIp(req)
      expect(ip).toBe('127.0.0.1')  // Fallback
    })

    it('should handle whitespace-only headers', () => {
      const req = new Request('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '   ',
          'x-real-ip': '  '
        }
      }) as NextRequest

      const ip = getClientIp(req)
      expect(ip).toBe('127.0.0.1')  // Fallback to localhost
    })

    it('should handle retry-after at exact reset time', () => {
      const exactNow = Date.now()
      const retryAfter = formatRetryAfter(exactNow)

      // Should round up to 1 second (0 would mean "now")
      expect(retryAfter).toBeGreaterThanOrEqual(0)
      expect(retryAfter).toBeLessThanOrEqual(1)
    })

    it('should create response with zero retry-after gracefully', () => {
      const response = createRateLimitResponse(0)

      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('0')
    })
  })
})
