/**
 * 🎓 LEARNING: Unit Tests for Utility Functions
 * =============================================
 * These tests ensure our utility functions work correctly across all scenarios.
 *
 * Testing Principles:
 * - Test happy path (normal usage)
 * - Test edge cases (empty strings, null, undefined)
 * - Test error conditions
 * - Test boundary values
 */

import { describe, it, expect } from 'vitest'
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatFileSize,
  getStatusColor,
  getStatusDisplayName,
  getRoleDisplayName,
  isValidEmail,
  isDefined,
  truncate,
  buildQueryString,
  getInitials,
  generateMockFileUrl,
  sleep
} from '../utils'
import { OrderStatus, UserRole } from '@/types'

describe('cn() - Class Name Utility', () => {
  it('should merge class names', () => {
    const result = cn('px-2 py-1', 'text-red-500')
    expect(result).toContain('px-2')
    expect(result).toContain('py-1')
    expect(result).toContain('text-red-500')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    const result = cn('base-class', isActive && 'active-class')
    expect(result).toContain('base-class')
    expect(result).toContain('active-class')
  })

  it('should handle conflicting Tailwind classes', () => {
    const result = cn('px-2', 'px-4')
    // Should keep only px-4 (later value wins)
    expect(result).toContain('px-4')
  })

  it('should handle empty/null/undefined values', () => {
    const result = cn('base', null, undefined, false, '')
    expect(result).toBe('base')
  })
})

describe('formatCurrency()', () => {
  it('should format number as PHP currency', () => {
    const result = formatCurrency(1000)
    expect(result).toContain('1,000')
    expect(result).toContain('₱')
  })

  it('should format string number', () => {
    const result = formatCurrency('2500.50')
    expect(result).toContain('2,500')
  })

  it('should handle zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
  })

  it('should return N/A for null', () => {
    const result = formatCurrency(null)
    expect(result).toBe('N/A')
  })

  it('should return N/A for undefined', () => {
    const result = formatCurrency(undefined)
    expect(result).toBe('N/A')
  })

  it('should return N/A for invalid string', () => {
    const result = formatCurrency('invalid')
    expect(result).toBe('N/A')
  })

  it('should handle large numbers', () => {
    const result = formatCurrency(1000000)
    expect(result).toContain('1,000,000')
  })

  it('should handle decimals', () => {
    const result = formatCurrency(99.99)
    expect(result).toContain('99.99')
  })
})

describe('formatDate()', () => {
  it('should format Date object', () => {
    const date = new Date('2025-10-10T12:00:00Z')
    const result = formatDate(date)
    expect(result).toContain('2025')
  })

  it('should format date string', () => {
    const result = formatDate('2025-10-10')
    expect(result).toContain('2025')
  })

  it('should return N/A for null', () => {
    const result = formatDate(null)
    expect(result).toBe('N/A')
  })

  it('should return N/A for undefined', () => {
    const result = formatDate(undefined)
    expect(result).toBe('N/A')
  })
})

describe('formatDateTime()', () => {
  it('should format Date with time', () => {
    const date = new Date('2025-10-10T14:30:00Z')
    const result = formatDateTime(date)
    expect(result).toContain('2025')
    // Should include time component
  })

  it('should return N/A for null', () => {
    const result = formatDateTime(null)
    expect(result).toBe('N/A')
  })
})

describe('formatRelativeTime()', () => {
  it('should return relative time for recent date', () => {
    const now = new Date()
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
    const result = formatRelativeTime(twoHoursAgo)
    expect(result).toContain('ago')
  })

  it('should return N/A for null', () => {
    const result = formatRelativeTime(null)
    expect(result).toBe('N/A')
  })
})

describe('formatFileSize()', () => {
  it('should format bytes', () => {
    const result = formatFileSize(500)
    expect(result).toBe('500 Bytes')
  })

  it('should format kilobytes', () => {
    const result = formatFileSize(2048)
    expect(result).toContain('KB')
  })

  it('should format megabytes', () => {
    const result = formatFileSize(1048576)
    expect(result).toContain('MB')
  })

  it('should format gigabytes', () => {
    const result = formatFileSize(1073741824)
    expect(result).toContain('GB')
  })

  it('should handle zero', () => {
    const result = formatFileSize(0)
    expect(result).toBe('0 Bytes')
  })

  it('should return N/A for null', () => {
    const result = formatFileSize(null)
    expect(result).toBe('N/A')
  })

  it('should return N/A for undefined', () => {
    const result = formatFileSize(undefined)
    expect(result).toBe('N/A')
  })
})

describe('getStatusColor()', () => {
  it('should return yellow for PENDING', () => {
    const result = getStatusColor(OrderStatus.PENDING)
    expect(result).toContain('yellow')
  })

  it('should return blue for ACKNOWLEDGED', () => {
    const result = getStatusColor(OrderStatus.ACKNOWLEDGED)
    expect(result).toContain('blue')
  })

  it('should return purple for IN_PROGRESS', () => {
    const result = getStatusColor(OrderStatus.IN_PROGRESS)
    expect(result).toContain('purple')
  })

  it('should return green for COMPLETED', () => {
    const result = getStatusColor(OrderStatus.COMPLETED)
    expect(result).toContain('green')
  })

  it('should return red for CANCELLED', () => {
    const result = getStatusColor(OrderStatus.CANCELLED)
    expect(result).toContain('red')
  })
})

describe('getStatusDisplayName()', () => {
  it('should return human-readable name for PENDING', () => {
    const result = getStatusDisplayName(OrderStatus.PENDING)
    expect(result).toBe('Pending')
  })

  it('should return human-readable name for IN_PROGRESS', () => {
    const result = getStatusDisplayName(OrderStatus.IN_PROGRESS)
    expect(result).toBe('In Progress')
  })

  it('should handle all statuses', () => {
    Object.values(OrderStatus).forEach(status => {
      const result = getStatusDisplayName(status)
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
    })
  })
})

describe('getRoleDisplayName()', () => {
  it('should return Client for CLIENT role', () => {
    const result = getRoleDisplayName(UserRole.CLIENT)
    expect(result).toBe('Client')
  })

  it('should return Lab Administrator for LAB_ADMIN role', () => {
    const result = getRoleDisplayName(UserRole.LAB_ADMIN)
    expect(result).toBe('Lab Administrator')
  })

  it('should return Platform Administrator for ADMIN role', () => {
    const result = getRoleDisplayName(UserRole.ADMIN)
    expect(result).toBe('Platform Administrator')
  })
})

describe('isValidEmail()', () => {
  it('should return true for valid email', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user.name@domain.co')).toBe(true)
    expect(isValidEmail('user+tag@example.com')).toBe(true)
  })

  it('should return false for invalid email', () => {
    expect(isValidEmail('invalid')).toBe(false)
    expect(isValidEmail('invalid@')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })

  it('should return false for email without domain', () => {
    expect(isValidEmail('user@domain')).toBe(false)
  })
})

describe('isDefined()', () => {
  it('should return true for defined values', () => {
    expect(isDefined(0)).toBe(true)
    expect(isDefined('')).toBe(true)
    expect(isDefined(false)).toBe(true)
    expect(isDefined([])).toBe(true)
    expect(isDefined({})).toBe(true)
  })

  it('should return false for null', () => {
    expect(isDefined(null)).toBe(false)
  })

  it('should return false for undefined', () => {
    expect(isDefined(undefined)).toBe(false)
  })
})

describe('truncate()', () => {
  it('should truncate long text', () => {
    const result = truncate('This is a very long text', 10)
    expect(result).toBe('This is a ...')
  })

  it('should not truncate short text', () => {
    const result = truncate('Short', 10)
    expect(result).toBe('Short')
  })

  it('should handle exact length', () => {
    const result = truncate('12345', 5)
    expect(result).toBe('12345')
  })

  it('should handle empty string', () => {
    const result = truncate('', 10)
    expect(result).toBe('')
  })
})

describe('buildQueryString()', () => {
  it('should build query string from object', () => {
    const params = { name: 'test', age: 25 }
    const result = buildQueryString(params)
    expect(result).toContain('?')
    expect(result).toContain('name=test')
    expect(result).toContain('age=25')
  })

  it('should skip null values', () => {
    const params = { name: 'test', age: null }
    const result = buildQueryString(params)
    expect(result).toContain('name=test')
    expect(result).not.toContain('age')
  })

  it('should skip undefined values', () => {
    const params = { name: 'test', age: undefined }
    const result = buildQueryString(params)
    expect(result).toContain('name=test')
    expect(result).not.toContain('age')
  })

  it('should skip empty string values', () => {
    const params = { name: 'test', age: '' }
    const result = buildQueryString(params)
    expect(result).toContain('name=test')
    expect(result).not.toContain('age')
  })

  it('should return empty string for empty object', () => {
    const result = buildQueryString({})
    expect(result).toBe('')
  })

  it('should handle boolean values', () => {
    const params = { active: true, deleted: false }
    const result = buildQueryString(params)
    expect(result).toContain('active=true')
    expect(result).toContain('deleted=false')
  })
})

describe('getInitials()', () => {
  it('should return initials for full name', () => {
    const result = getInitials('John Doe')
    expect(result).toBe('JD')
  })

  it('should return first two letters for single name', () => {
    const result = getInitials('John')
    expect(result).toBe('JO')
  })

  it('should handle three names', () => {
    const result = getInitials('John Middle Doe')
    expect(result).toBe('JD')
  })

  it('should return ?? for null', () => {
    const result = getInitials(null)
    expect(result).toBe('??')
  })

  it('should return ?? for undefined', () => {
    const result = getInitials(undefined)
    expect(result).toBe('??')
  })

  it('should return ?? for empty string', () => {
    const result = getInitials('')
    expect(result).toBe('??')
  })

  it('should handle extra spaces', () => {
    const result = getInitials('  John   Doe  ')
    expect(result).toBe('JD')
  })

  it('should uppercase initials', () => {
    const result = getInitials('john doe')
    expect(result).toBe('JD')
  })
})

describe('generateMockFileUrl()', () => {
  it('should generate mock URL with order ID', () => {
    const result = generateMockFileUrl('order123', 'file.pdf')
    expect(result).toContain('order123')
    expect(result).toContain('file.pdf')
  })

  it('should include mock storage domain', () => {
    const result = generateMockFileUrl('order123', 'file.pdf')
    expect(result).toContain('mock-storage')
  })

  it('should be properly formatted URL', () => {
    const result = generateMockFileUrl('order123', 'file.pdf')
    expect(result).toMatch(/^https?:\/\//)
  })
})

describe('sleep()', () => {
  it('should delay execution', async () => {
    const start = Date.now()
    await sleep(100)
    const end = Date.now()
    const elapsed = end - start
    // Allow some margin for timing
    expect(elapsed).toBeGreaterThanOrEqual(90)
  })

  it('should resolve with void', async () => {
    const result = await sleep(10)
    expect(result).toBeUndefined()
  })
})
