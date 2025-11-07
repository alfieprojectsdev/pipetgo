/**
 * 🎓 LEARNING: Vitest Setup File
 * ==============================
 * This file runs before all tests to set up the testing environment.
 *
 * Dual-Mode Database Testing:
 * - By default, tests use pg-mem (in-memory mock database)
 * - Set USE_MOCK_DB=false to test against a live PostgreSQL database
 * - Mock database is seeded before all tests run
 */

import { expect, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with React Testing Library matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn()
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  }
}))

// Mock Next.js image
vi.mock('next/image', () => ({
  default: vi.fn().mockImplementation((props: any) => props)
}))

// Mock environment variables for testing
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Enable mock database for tests by default
if (!process.env.USE_MOCK_DB) {
  process.env.USE_MOCK_DB = 'true'
}

// Seed mock database before all tests
if (process.env.USE_MOCK_DB === 'true') {
  console.log('🧪 Tests will use pg-mem (mock database)')

  beforeAll(async () => {
    try {
      const { seedMockDatabase } = await import('@/lib/db-mock')
      const { prisma } = await import('@/lib/db')
      // Only seed if prisma has the expected methods (not manually mocked)
      if (prisma.user && typeof prisma.user.createMany === 'function') {
        await seedMockDatabase(prisma)
      }
    } catch (e) {
      // Ignore errors if mock is not available (test might use its own mocks)
    }
  })
} else {
  console.log('🌐 Tests will use live database')
}
