import { describe, it, expect } from 'vitest'
import {
  provideQuoteSchema,
  approveQuoteSchema,
  requestCustomQuoteSchema,
  pricingModeSchema,
  orderStatusSchema
} from '../quote'

describe('provideQuoteSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid quote with all fields', () => {
      const input = {
        quotedPrice: 5000,
        quoteNotes: 'Standard analysis for coconut oil sample',
        estimatedTurnaroundDays: 5
      }

      const result = provideQuoteSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.quotedPrice).toBe(5000)
        expect(result.data.quoteNotes).toBe('Standard analysis for coconut oil sample')
        expect(result.data.estimatedTurnaroundDays).toBe(5)
      }
    })

    it('should accept quote with only required fields', () => {
      const input = {
        quotedPrice: 1500
      }

      const result = provideQuoteSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.quotedPrice).toBe(1500)
        expect(result.data.quoteNotes).toBeUndefined()
        expect(result.data.estimatedTurnaroundDays).toBeUndefined()
      }
    })

    it('should accept minimum valid price (₱1)', () => {
      const input = { quotedPrice: 1 }
      const result = provideQuoteSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should accept maximum valid price (₱1,000,000)', () => {
      const input = { quotedPrice: 1000000 }
      const result = provideQuoteSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should trim whitespace from quoteNotes', () => {
      const input = {
        quotedPrice: 2000,
        quoteNotes: '  Sample requires special handling  '
      }

      const result = provideQuoteSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.quoteNotes).toBe('Sample requires special handling')
      }
    })
  })

  describe('invalid quotedPrice', () => {
    it('should reject negative price', () => {
      const input = { quotedPrice: -100 }
      const result = provideQuoteSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive')
      }
    })

    it('should reject zero price', () => {
      const input = { quotedPrice: 0 }
      const result = provideQuoteSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive')
      }
    })

    it('should reject price above maximum (₱1,000,001)', () => {
      const input = { quotedPrice: 1000001 }
      const result = provideQuoteSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed ₱1,000,000')
      }
    })

    it('should reject non-numeric price', () => {
      const input = { quotedPrice: 'expensive' }
      const result = provideQuoteSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject NaN', () => {
      const input = { quotedPrice: NaN }
      const result = provideQuoteSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('number')
      }
    })

    it('should reject Infinity', () => {
      const input = { quotedPrice: Infinity }
      const result = provideQuoteSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  describe('invalid quoteNotes', () => {
    it('should reject notes exceeding 500 characters', () => {
      const input = {
        quotedPrice: 1000,
        quoteNotes: 'A'.repeat(501)
      }
      const result = provideQuoteSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 500 characters')
      }
    })
  })

  describe('invalid estimatedTurnaroundDays', () => {
    it('should reject negative turnaround', () => {
      const input = {
        quotedPrice: 1000,
        estimatedTurnaroundDays: -5
      }
      const result = provideQuoteSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject zero turnaround', () => {
      const input = {
        quotedPrice: 1000,
        estimatedTurnaroundDays: 0
      }
      const result = provideQuoteSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject decimal turnaround (must be whole days)', () => {
      const input = {
        quotedPrice: 1000,
        estimatedTurnaroundDays: 3.5
      }
      const result = provideQuoteSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('whole days')
      }
    })

    it('should reject turnaround exceeding 365 days', () => {
      const input = {
        quotedPrice: 1000,
        estimatedTurnaroundDays: 366
      }
      const result = provideQuoteSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 365 days')
      }
    })
  })
})

describe('approveQuoteSchema', () => {
  describe('valid inputs', () => {
    it('should accept approval without rejection reason', () => {
      const input = { approved: true }
      const result = approveQuoteSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.approved).toBe(true)
        expect(result.data.rejectionReason).toBeUndefined()
      }
    })

    it('should accept rejection with valid reason', () => {
      const input = {
        approved: false,
        rejectionReason: 'Price is too high for our budget constraints'
      }
      const result = approveQuoteSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.approved).toBe(false)
        expect(result.data.rejectionReason).toBe('Price is too high for our budget constraints')
      }
    })

    it('should trim whitespace from rejection reason', () => {
      const input = {
        approved: false,
        rejectionReason: '  Price exceeds budget limits  '
      }
      const result = approveQuoteSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.rejectionReason).toBe('Price exceeds budget limits')
      }
    })

    it('should accept rejection with minimum valid reason (10 chars)', () => {
      const input = {
        approved: false,
        rejectionReason: 'Too costly'  // Exactly 10 characters after trim
      }
      const result = approveQuoteSchema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })

  describe('invalid inputs', () => {
    it('should reject when approved field is missing', () => {
      const input = {}
      const result = approveQuoteSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required')
      }
    })

    it('should reject when approved is not boolean', () => {
      const input = { approved: 'yes' }
      const result = approveQuoteSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('true or false')
      }
    })

    it('should reject rejection without reason', () => {
      const input = { approved: false }
      const result = approveQuoteSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue =>
          issue.message.includes('Rejection reason is required')
        )).toBe(true)
      }
    })

    it('should reject rejection with too short reason (<10 chars)', () => {
      const input = {
        approved: false,
        rejectionReason: 'Too high'  // Only 8 characters
      }
      const result = approveQuoteSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue =>
          issue.message.includes('at least 10 characters')
        )).toBe(true)
      }
    })

    it('should reject rejection with reason that becomes too short after trimming', () => {
      const input = {
        approved: false,
        rejectionReason: '   Short   '  // Only 5 chars after trim
      }
      const result = approveQuoteSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject rejection reason exceeding 500 characters', () => {
      const input = {
        approved: false,
        rejectionReason: 'A'.repeat(501)
      }
      const result = approveQuoteSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 500 characters')
      }
    })
  })
})

describe('requestCustomQuoteSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid reason with minimum length (10 chars)', () => {
      const input = {
        reason: 'Large batch'  // Exactly 11 characters
      }
      const result = requestCustomQuoteSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.reason).toBe('Large batch')
      }
    })

    it('should accept valid reason with detailed explanation', () => {
      const input = {
        reason: 'We need custom pricing for batch testing of 50+ samples with expedited turnaround'
      }
      const result = requestCustomQuoteSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should trim whitespace from reason', () => {
      const input = {
        reason: '  Batch testing required  '
      }
      const result = requestCustomQuoteSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.reason).toBe('Batch testing required')
      }
    })
  })

  describe('invalid inputs', () => {
    it('should reject reason shorter than 10 characters', () => {
      const input = { reason: 'Too short' }  // Only 9 characters
      const result = requestCustomQuoteSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('minimum 10 characters')
      }
    })

    it('should reject empty reason', () => {
      const input = { reason: '' }
      const result = requestCustomQuoteSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject whitespace-only reason', () => {
      const input = { reason: '          ' }
      const result = requestCustomQuoteSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue =>
          issue.message.includes('at least 10 characters after trimming')
        )).toBe(true)
      }
    })

    it('should reject reason that becomes too short after trimming', () => {
      const input = { reason: '   Short   ' }  // Only 5 chars after trim
      const result = requestCustomQuoteSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject reason exceeding 500 characters', () => {
      const input = { reason: 'A'.repeat(501) }
      const result = requestCustomQuoteSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 500 characters')
      }
    })

    it('should reject missing reason field', () => {
      const input = {}
      const result = requestCustomQuoteSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })
})

describe('pricingModeSchema', () => {
  it('should accept QUOTE_REQUIRED', () => {
    const result = pricingModeSchema.safeParse('QUOTE_REQUIRED')
    expect(result.success).toBe(true)
  })

  it('should accept FIXED', () => {
    const result = pricingModeSchema.safeParse('FIXED')
    expect(result.success).toBe(true)
  })

  it('should accept HYBRID', () => {
    const result = pricingModeSchema.safeParse('HYBRID')
    expect(result.success).toBe(true)
  })

  it('should reject invalid pricing mode', () => {
    const result = pricingModeSchema.safeParse('CUSTOM')
    expect(result.success).toBe(false)
  })

  it('should reject lowercase pricing mode', () => {
    const result = pricingModeSchema.safeParse('quote_required')
    expect(result.success).toBe(false)
  })
})

describe('orderStatusSchema', () => {
  const validStatuses = [
    'QUOTE_REQUESTED',
    'QUOTE_PROVIDED',
    'QUOTE_REJECTED',
    'PENDING',
    'ACKNOWLEDGED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
  ]

  validStatuses.forEach(status => {
    it(`should accept ${status}`, () => {
      const result = orderStatusSchema.safeParse(status)
      expect(result.success).toBe(true)
    })
  })

  it('should reject invalid status', () => {
    const result = orderStatusSchema.safeParse('PROCESSING')
    expect(result.success).toBe(false)
  })

  it('should reject lowercase status', () => {
    const result = orderStatusSchema.safeParse('pending')
    expect(result.success).toBe(false)
  })
})
