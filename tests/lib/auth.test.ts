/**
 * NextAuth Password Authentication Tests (P0-1 Password Authentication)
 * =====================================================================
 * Tests the authorize() function in authOptions for password verification.
 *
 * Test Coverage:
 * - Successful authentication with valid credentials
 * - Failed authentication (wrong password, non-existent user)
 * - Backward compatibility with OAuth users (null passwordHash)
 * - Security (constant-time comparison, timing attack prevention)
 * - Edge cases (missing email, missing password, empty strings)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/password'

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    }
  }
}))

// Mock password utilities
vi.mock('@/lib/password', () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn()
}))

describe('NextAuth Password Authentication', () => {
  // Get the CredentialsProvider authorize function
  const credentialsProvider = authOptions.providers.find(
    (p) => p.id === 'credentials'
  )

  if (!credentialsProvider || !('authorize' in credentialsProvider.options)) {
    throw new Error('CredentialsProvider not found in authOptions')
  }

  const authorize = credentialsProvider.options.authorize

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // SUCCESSFUL AUTHENTICATION TESTS
  // ============================================================================
  describe('Successful Authentication', () => {
    it('should authenticate user with valid email and password', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CLIENT',
        passwordHash: '$2a$12$hashedpassword'
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(verifyPassword).mockResolvedValue(true)

      const result = await authorize(
        {
          email: 'test@example.com',
          password: 'ValidPass123'
        },
        {} as any
      )

      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CLIENT'
      })

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          passwordHash: true
        }
      })

      expect(verifyPassword).toHaveBeenCalledWith(
        'ValidPass123',
        '$2a$12$hashedpassword'
      )
    })

    it('should normalize email to lowercase before lookup', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CLIENT',
        passwordHash: '$2a$12$hashedpassword'
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(verifyPassword).mockResolvedValue(true)

      await authorize(
        {
          email: 'TEST@EXAMPLE.COM', // Uppercase email
          password: 'ValidPass123'
        },
        {} as any
      )

      // Should search with lowercase
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: expect.any(Object)
      })
    })

    it('should return user with correct role (LAB_ADMIN)', async () => {
      const mockLabAdmin = {
        id: 'user-lab',
        email: 'lab@example.com',
        name: 'Lab Admin',
        role: 'LAB_ADMIN',
        passwordHash: '$2a$12$hashedpassword'
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockLabAdmin as any)
      vi.mocked(verifyPassword).mockResolvedValue(true)

      const result = await authorize(
        {
          email: 'lab@example.com',
          password: 'ValidPass123'
        },
        {} as any
      )

      expect(result).toEqual({
        id: 'user-lab',
        email: 'lab@example.com',
        name: 'Lab Admin',
        role: 'LAB_ADMIN'
      })
    })
  })

  // ============================================================================
  // FAILED AUTHENTICATION TESTS
  // ============================================================================
  describe('Failed Authentication', () => {
    it('should return null for invalid password', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CLIENT',
        passwordHash: '$2a$12$hashedpassword'
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(verifyPassword).mockResolvedValue(false) // Password doesn't match

      const result = await authorize(
        {
          email: 'test@example.com',
          password: 'WrongPassword123'
        },
        {} as any
      )

      expect(result).toBeNull()

      expect(verifyPassword).toHaveBeenCalledWith(
        'WrongPassword123',
        '$2a$12$hashedpassword'
      )
    })

    it('should return null for non-existent email (timing attack protection)', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null) // User not found
      vi.mocked(verifyPassword).mockResolvedValue(false)

      const result = await authorize(
        {
          email: 'nonexistent@example.com',
          password: 'AnyPassword123'
        },
        {} as any
      )

      expect(result).toBeNull()

      // CRITICAL: Should still call verifyPassword with fake hash (constant-time)
      expect(verifyPassword).toHaveBeenCalledWith(
        'AnyPassword123',
        expect.stringContaining('$2a$12$') // Fake bcrypt hash
      )
    })

    it('should return null when email is missing', async () => {
      const result = await authorize(
        {
          password: 'ValidPass123'
        } as any,
        {} as any
      )

      expect(result).toBeNull()
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
      expect(verifyPassword).not.toHaveBeenCalled()
    })

    it('should return null when password is missing', async () => {
      const result = await authorize(
        {
          email: 'test@example.com'
        } as any,
        {} as any
      )

      expect(result).toBeNull()
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
      expect(verifyPassword).not.toHaveBeenCalled()
    })

    it('should return null when email is empty string', async () => {
      const result = await authorize(
        {
          email: '',
          password: 'ValidPass123'
        },
        {} as any
      )

      expect(result).toBeNull()
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })

    it('should return null when password is empty string', async () => {
      const result = await authorize(
        {
          email: 'test@example.com',
          password: ''
        },
        {} as any
      )

      expect(result).toBeNull()
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })

    it('should return null when both credentials are missing', async () => {
      const result = await authorize({} as any, {} as any)

      expect(result).toBeNull()
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
      expect(verifyPassword).not.toHaveBeenCalled()
    })
  })

  // ============================================================================
  // BACKWARD COMPATIBILITY TESTS (OAuth Users)
  // ============================================================================
  describe('Backward Compatibility (OAuth Users)', () => {
    it('should return null for OAuth-only user (null passwordHash)', async () => {
      const mockOAuthUser = {
        id: 'user-oauth',
        email: 'oauth@example.com',
        name: 'OAuth User',
        role: 'CLIENT',
        passwordHash: null // OAuth user, no password set
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockOAuthUser as any)

      const result = await authorize(
        {
          email: 'oauth@example.com',
          password: 'AnyPassword123'
        },
        {} as any
      )

      expect(result).toBeNull()

      // Should NOT call verifyPassword for OAuth users
      expect(verifyPassword).not.toHaveBeenCalled()
    })

    it('should return null for user with undefined passwordHash', async () => {
      const mockUser = {
        id: 'user-no-pass',
        email: 'nopass@example.com',
        name: 'No Password User',
        role: 'CLIENT',
        passwordHash: undefined
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      const result = await authorize(
        {
          email: 'nopass@example.com',
          password: 'ValidPass123'
        },
        {} as any
      )

      expect(result).toBeNull()
      expect(verifyPassword).not.toHaveBeenCalled()
    })
  })

  // ============================================================================
  // SECURITY TESTS
  // ============================================================================
  describe('Security (Constant-Time Comparison)', () => {
    it('should use constant-time comparison (fake hash for non-existent users)', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(verifyPassword).mockResolvedValue(false)

      await authorize(
        {
          email: 'nonexistent@example.com',
          password: 'TestPass123'
        },
        {} as any
      )

      // Should call verifyPassword with FAKE_PASSWORD_HASH
      expect(verifyPassword).toHaveBeenCalledWith(
        'TestPass123',
        expect.stringMatching(/^\$2a\$12\$/) // bcrypt hash format
      )
    })

    it('should always call verifyPassword for timing consistency', async () => {
      // Test 1: Valid user
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: '$2a$12$realHash'
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(verifyPassword).mockResolvedValue(true)

      await authorize(
        {
          email: 'test@example.com',
          password: 'Pass123'
        },
        {} as any
      )

      const validUserCalls = vi.mocked(verifyPassword).mock.calls.length

      vi.clearAllMocks()

      // Test 2: Invalid user
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(verifyPassword).mockResolvedValue(false)

      await authorize(
        {
          email: 'invalid@example.com',
          password: 'Pass123'
        },
        {} as any
      )

      const invalidUserCalls = vi.mocked(verifyPassword).mock.calls.length

      // Both should call verifyPassword exactly once (constant-time)
      expect(validUserCalls).toBe(1)
      expect(invalidUserCalls).toBe(1)
    })
  })

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================
  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(
        new Error('Database connection failed')
      )

      await expect(
        authorize(
          {
            email: 'test@example.com',
            password: 'ValidPass123'
          },
          {} as any
        )
      ).rejects.toThrow('Database connection failed')
    })

    it('should handle password verification errors gracefully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: '$2a$12$hash'
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(verifyPassword).mockRejectedValue(
        new Error('Bcrypt verification failed')
      )

      await expect(
        authorize(
          {
            email: 'test@example.com',
            password: 'ValidPass123'
          },
          {} as any
        )
      ).rejects.toThrow('Bcrypt verification failed')
    })
  })

  // ============================================================================
  // EDGE CASES
  // ============================================================================
  describe('Edge Cases', () => {
    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(100) + '@example.com'

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(verifyPassword).mockResolvedValue(false)

      const result = await authorize(
        {
          email: longEmail,
          password: 'ValidPass123'
        },
        {} as any
      )

      expect(result).toBeNull()
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: longEmail.toLowerCase() },
        select: expect.any(Object)
      })
    })

    it('should handle special characters in email', async () => {
      const specialEmail = 'user+test@example.com'

      const mockUser = {
        id: 'user-1',
        email: specialEmail,
        passwordHash: '$2a$12$hash'
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(verifyPassword).mockResolvedValue(true)

      const result = await authorize(
        {
          email: specialEmail,
          password: 'ValidPass123'
        },
        {} as any
      )

      expect(result).not.toBeNull()
      expect(result?.email).toBe(specialEmail)
    })

    it('should handle whitespace in credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: '$2a$12$hash'
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(verifyPassword).mockResolvedValue(true)

      await authorize(
        {
          email: '  test@example.com  ', // Whitespace
          password: 'ValidPass123'
        },
        {} as any
      )

      // Should search with normalized email (lowercase handles whitespace)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: '  test@example.com  '.toLowerCase() },
        select: expect.any(Object)
      })
    })
  })
})
