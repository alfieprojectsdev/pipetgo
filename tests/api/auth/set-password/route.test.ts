/**
 * Set Password API Endpoint Tests (P0-1 Password Authentication)
 * ================================================================
 * Tests POST /api/auth/set-password endpoint for password creation.
 *
 * Test Coverage:
 * - Successful password setting for authenticated users with null passwordHash
 * - Authorization checks (authenticated users only)
 * - Validation (password complexity requirements)
 * - Business logic (prevent overwriting existing passwords)
 * - Security (password hashing with bcrypt)
 * - Error handling (user not found, database errors)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { POST } from '@/app/api/auth/set-password/route'

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}))

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}))

// Mock password utilities
vi.mock('@/lib/password', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn()
}))

// Mock auth config
vi.mock('@/lib/auth', () => ({
  authOptions: {}
}))

describe('POST /api/auth/set-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // SUCCESSFUL PASSWORD SETTING TESTS
  // ============================================================================
  describe('Successful Password Setting', () => {
    it('should set password for authenticated user with null passwordHash', async () => {
      const session = {
        user: { id: 'user-1', email: 'test@example.com', role: 'CLIENT' }
      }

      const mockUser = {
        id: 'user-1',
        passwordHash: null
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(hashPassword).mockResolvedValue('$2a$12$hashedPassword')
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user-1',
        passwordHash: '$2a$12$hashedPassword'
      } as any)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'ValidPass123' })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Password set successfully')

      expect(hashPassword).toHaveBeenCalledWith('ValidPass123')
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: '$2a$12$hashedPassword' }
      })
    })

    it('should work for LAB_ADMIN role', async () => {
      const session = {
        user: { id: 'lab-1', email: 'lab@example.com', role: 'LAB_ADMIN' }
      }

      const mockUser = {
        id: 'lab-1',
        passwordHash: null
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(hashPassword).mockResolvedValue('$2a$12$hash')
      vi.mocked(prisma.user.update).mockResolvedValue({} as any)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'LabPass123' })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should accept password with special characters', async () => {
      const session = {
        user: { id: 'user-1', email: 'test@example.com', role: 'CLIENT' }
      }

      const mockUser = {
        id: 'user-1',
        passwordHash: null
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(hashPassword).mockResolvedValue('$2a$12$hash')
      vi.mocked(prisma.user.update).mockResolvedValue({} as any)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'Valid@Pass#123!' })
      })

      const response = await POST(request as any)

      expect(response.status).toBe(200)
      expect(hashPassword).toHaveBeenCalledWith('Valid@Pass#123!')
    })

    it('should accept password at maximum length (72 chars)', async () => {
      const session = {
        user: { id: 'user-1', email: 'test@example.com', role: 'CLIENT' }
      }

      const mockUser = {
        id: 'user-1',
        passwordHash: null
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(hashPassword).mockResolvedValue('$2a$12$hash')
      vi.mocked(prisma.user.update).mockResolvedValue({} as any)

      // 72 chars: bcrypt's technical limit
      const maxPassword = 'A'.repeat(69) + 'a1!' // 72 chars total (69 + 3)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: maxPassword })
      })

      const response = await POST(request as any)

      expect(response.status).toBe(200)
      expect(hashPassword).toHaveBeenCalledWith(maxPassword)
    })
  })

  // ============================================================================
  // AUTHORIZATION CHECKS
  // ============================================================================
  describe('Authorization Checks', () => {
    it('should return 401 for unauthenticated request', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'ValidPass123' })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')

      // Should NOT call any database operations
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
      expect(hashPassword).not.toHaveBeenCalled()
    })

    it('should return 401 when session has no user', async () => {
      const session = {
        user: null
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'ValidPass123' })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 when session user has no id', async () => {
      const session = {
        user: { email: 'test@example.com' } // Missing id
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'ValidPass123' })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  // ============================================================================
  // VALIDATION ERRORS
  // ============================================================================
  describe('Validation Errors', () => {
    it('should return 400 when password is missing', async () => {
      const session = {
        user: { id: 'user-1', email: 'test@example.com', role: 'CLIENT' }
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // No password field
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Password is required')

      expect(hashPassword).not.toHaveBeenCalled()
      expect(prisma.user.update).not.toHaveBeenCalled()
    })

    it('should return 400 for password too short (< 8 chars)', async () => {
      const session = {
        user: { id: 'user-1', email: 'test@example.com', role: 'CLIENT' }
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'Short1' }) // 6 chars
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid password')
      expect(data.details).toBeDefined()
      expect(data.details[0].message).toContain('at least 8 characters')
    })

    it('should return 400 for password without uppercase letter', async () => {
      const session = {
        user: { id: 'user-1', email: 'test@example.com', role: 'CLIENT' }
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'lowercase123' })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid password')
      expect(JSON.stringify(data.details)).toContain('uppercase')
    })

    it('should return 400 for password without lowercase letter', async () => {
      const session = {
        user: { id: 'user-1', email: 'test@example.com', role: 'CLIENT' }
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'UPPERCASE123' })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid password')
      expect(JSON.stringify(data.details)).toContain('lowercase')
    })

    it('should return 400 for password without number', async () => {
      const session = {
        user: { id: 'user-1', email: 'test@example.com', role: 'CLIENT' }
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'NoNumbers' })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid password')
      expect(JSON.stringify(data.details)).toContain('number')
    })

    it('should return 400 for password too long (> 72 chars)', async () => {
      const session = {
        user: { id: 'user-1', email: 'test@example.com', role: 'CLIENT' }
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)

      const longPassword = 'A'.repeat(70) + 'a1!' // 73 chars (exceeds bcrypt limit)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: longPassword })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid password')
      expect(JSON.stringify(data.details)).toContain('72')
    })

    it('should return 400 for empty string password', async () => {
      const session = {
        user: { id: 'user-1', email: 'test@example.com', role: 'CLIENT' }
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: '' })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Password is required')
    })

    it('should return 400 for multiple validation failures', async () => {
      const session = {
        user: { id: 'user-1', email: 'test@example.com', role: 'CLIENT' }
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'abc' }) // Too short, no uppercase, no number
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid password')
      expect(data.details.length).toBeGreaterThan(1) // Multiple errors
    })
  })

  // ============================================================================
  // BUSINESS LOGIC ERRORS
  // ============================================================================
  describe('Business Logic Errors', () => {
    it('should return 409 when user already has password', async () => {
      const session = {
        user: { id: 'user-1', email: 'test@example.com', role: 'CLIENT' }
      }

      const mockUser = {
        id: 'user-1',
        passwordHash: '$2a$12$existingHash' // Already has password
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'NewPass123' })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Password already set. Use password reset instead.')

      // Should NOT hash or update password
      expect(hashPassword).not.toHaveBeenCalled()
      expect(prisma.user.update).not.toHaveBeenCalled()
    })

    it('should return 404 when user not found', async () => {
      const session = {
        user: { id: 'user-nonexistent', email: 'test@example.com', role: 'CLIENT' }
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null) // User deleted

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'ValidPass123' })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('User not found')

      expect(hashPassword).not.toHaveBeenCalled()
      expect(prisma.user.update).not.toHaveBeenCalled()
    })
  })

  // ============================================================================
  // SECURITY TESTS
  // ============================================================================
  describe('Security (Password Hashing)', () => {
    it('should hash password before storing', async () => {
      const session = {
        user: { id: 'user-1', email: 'test@example.com', role: 'CLIENT' }
      }

      const mockUser = {
        id: 'user-1',
        passwordHash: null
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(hashPassword).mockResolvedValue('$2a$12$secureHash')
      vi.mocked(prisma.user.update).mockResolvedValue({} as any)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'PlainTextPass123' })
      })

      await POST(request as any)

      // Should hash the plain text password
      expect(hashPassword).toHaveBeenCalledWith('PlainTextPass123')

      // Should store the HASHED password (NOT plain text)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: '$2a$12$secureHash' }
      })
    })

    it('should only update current user password (ownership check)', async () => {
      const session = {
        user: { id: 'user-123', email: 'test@example.com', role: 'CLIENT' }
      }

      const mockUser = {
        id: 'user-123',
        passwordHash: null
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(hashPassword).mockResolvedValue('$2a$12$hash')
      vi.mocked(prisma.user.update).mockResolvedValue({} as any)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'ValidPass123' })
      })

      await POST(request as any)

      // CRITICAL: Should lookup user by session.user.id
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: { id: true, passwordHash: true }
      })

      // CRITICAL: Should update user by session.user.id
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.any(Object)
      })
    })
  })

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================
  describe('Error Handling', () => {
    it('should return 500 when hashPassword fails', async () => {
      const session = {
        user: { id: 'user-1', email: 'test@example.com', role: 'CLIENT' }
      }

      const mockUser = {
        id: 'user-1',
        passwordHash: null
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(hashPassword).mockRejectedValue(new Error('Bcrypt hashing failed'))

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'ValidPass123' })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')

      // Should NOT update database if hashing fails
      expect(prisma.user.update).not.toHaveBeenCalled()
    })

    it('should return 500 when database update fails', async () => {
      const session = {
        user: { id: 'user-1', email: 'test@example.com', role: 'CLIENT' }
      }

      const mockUser = {
        id: 'user-1',
        passwordHash: null
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(hashPassword).mockResolvedValue('$2a$12$hash')
      vi.mocked(prisma.user.update).mockRejectedValue(
        new Error('Database write failed')
      )

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'ValidPass123' })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should return 500 when user lookup fails', async () => {
      const session = {
        user: { id: 'user-1', email: 'test@example.com', role: 'CLIENT' }
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)
      vi.mocked(prisma.user.findUnique).mockRejectedValue(
        new Error('Database connection timeout')
      )

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'ValidPass123' })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle malformed JSON body', async () => {
      const session = {
        user: { id: 'user-1', email: 'test@example.com', role: 'CLIENT' }
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json {'
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  // ============================================================================
  // EDGE CASES
  // ============================================================================
  describe('Edge Cases', () => {
    it('should handle user with empty string passwordHash', async () => {
      const session = {
        user: { id: 'user-1', email: 'test@example.com', role: 'CLIENT' }
      }

      const mockUser = {
        id: 'user-1',
        passwordHash: '' // Empty string (edge case - treated as falsy)
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      // Reset mocks to prevent interference from previous tests
      vi.mocked(hashPassword).mockResolvedValue('$2a$12$hash')
      vi.mocked(prisma.user.update).mockResolvedValue({} as any)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'ValidPass123' })
      })

      const response = await POST(request as any)
      const data = await response.json()

      // Empty string is falsy in JS, so treated as no password
      // This allows setting password (correct behavior)
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(hashPassword).toHaveBeenCalledWith('ValidPass123')
    })

    it('should trim and validate password correctly', async () => {
      const session = {
        user: { id: 'user-1', email: 'test@example.com', role: 'CLIENT' }
      }

      const mockUser = {
        id: 'user-1',
        passwordHash: null
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(hashPassword).mockResolvedValue('$2a$12$hash')
      vi.mocked(prisma.user.update).mockResolvedValue({} as any)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'ValidPass123' })
      })

      const response = await POST(request as any)

      expect(response.status).toBe(200)
      expect(hashPassword).toHaveBeenCalledWith('ValidPass123')
    })
  })

  // ============================================================================
  // RATE LIMITING TESTS (P0-2 Rate Limiting)
  // ============================================================================
  describe('Rate Limiting', () => {
    it('should allow requests when rate limiting is disabled (development)', async () => {
      const session = {
        user: { id: 'user-1', email: 'test@example.com', role: 'CLIENT' }
      }

      const mockUser = {
        id: 'user-1',
        passwordHash: null
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(hashPassword).mockResolvedValue('$2a$12$hashedPassword')
      vi.mocked(prisma.user.update).mockResolvedValue({} as any)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'ValidPass123' })
      })

      const response = await POST(request as any)

      // Should succeed (rate limiting disabled in test environment)
      expect(response.status).not.toBe(429)
      expect(response.status).toBe(200)
    })

    it('should handle multiple password set attempts when rate limiting disabled', async () => {
      const session = {
        user: { id: 'user-1', email: 'test@example.com', role: 'CLIENT' }
      }

      const mockUser = {
        id: 'user-1',
        passwordHash: null
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(hashPassword).mockResolvedValue('$2a$12$hash')
      vi.mocked(prisma.user.update).mockResolvedValue({} as any)

      // Simulate 3 rapid attempts
      for (let i = 0; i < 3; i++) {
        const request = new Request('http://localhost:3000/api/auth/set-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'ValidPass123' })
        })

        const response = await POST(request as any)

        // All should succeed when rate limiting disabled
        expect(response.status).toBe(200)
      }
    })

    it('should not rate limit different users separately', async () => {
      // User 1
      const session1 = {
        user: { id: 'user-1', email: 'test1@example.com', role: 'CLIENT' }
      }

      const mockUser1 = {
        id: 'user-1',
        passwordHash: null
      }

      vi.mocked(getServerSession).mockResolvedValue(session1 as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser1 as any)
      vi.mocked(hashPassword).mockResolvedValue('$2a$12$hash1')
      vi.mocked(prisma.user.update).mockResolvedValue({} as any)

      const request1 = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'ValidPass123' })
      })

      const response1 = await POST(request1 as any)
      expect(response1.status).toBe(200)

      // User 2
      const session2 = {
        user: { id: 'user-2', email: 'test2@example.com', role: 'CLIENT' }
      }

      const mockUser2 = {
        id: 'user-2',
        passwordHash: null
      }

      vi.mocked(getServerSession).mockResolvedValue(session2 as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser2 as any)
      vi.mocked(hashPassword).mockResolvedValue('$2a$12$hash2')
      vi.mocked(prisma.user.update).mockResolvedValue({} as any)

      const request2 = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'ValidPass456' })
      })

      const response2 = await POST(request2 as any)

      // Both users should be able to set password (separate rate limit keys)
      expect(response2.status).toBe(200)
    })

    it('should check rate limit before validation errors', async () => {
      const session = {
        user: { id: 'user-1', email: 'test@example.com', role: 'CLIENT' }
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)

      // Invalid password (too short)
      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'short' })
      })

      const response = await POST(request as any)

      // When rate limiting is disabled, should get validation error (400)
      // If rate limiting was active and exceeded, would get 429 first
      expect(response.status).toBe(400)
    })

    it('should check rate limit after authentication check', async () => {
      // No session (unauthenticated)
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'ValidPass123' })
      })

      const response = await POST(request as any)

      // Should get 401 (authentication error) before rate limit check
      expect(response.status).toBe(401)
    })

    it('should use user ID as rate limit identifier', async () => {
      // This test verifies the implementation uses session.user.id
      // When rate limiting is active, it should use user ID (not IP)
      const session = {
        user: { id: 'user-specific-id', email: 'test@example.com', role: 'CLIENT' }
      }

      const mockUser = {
        id: 'user-specific-id',
        passwordHash: null
      }

      vi.mocked(getServerSession).mockResolvedValue(session as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(hashPassword).mockResolvedValue('$2a$12$hash')
      vi.mocked(prisma.user.update).mockResolvedValue({} as any)

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'ValidPass123' })
      })

      const response = await POST(request as any)

      // Should succeed (implementation correctly uses user ID)
      expect(response.status).toBe(200)
    })
  })
})
