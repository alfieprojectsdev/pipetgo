/**
 * 🎓 LEARNING: Validation Schema Tests
 * ====================================
 * These tests ensure our Zod schemas correctly validate input data.
 *
 * Testing Strategy:
 * - Test valid inputs (should pass)
 * - Test invalid inputs (should fail with specific errors)
 * - Test edge cases (boundary values, empty strings, etc.)
 * - Test required vs optional fields
 */

import { describe, it, expect } from 'vitest'
import {
  clientDetailsSchema,
  createOrderSchema,
  updateOrderSchema,
  createAttachmentSchema,
  orderFilterSchema,
  isValidStatusTransition
} from '../order'
import { OrderStatus, AttachmentType } from '@/types'

describe('clientDetailsSchema', () => {
  it('should validate correct client details', () => {
    const valid = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+639171234567'
    }

    const result = clientDetailsSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('should accept optional organization', () => {
    const valid = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+639171234567',
      organization: 'Test Corp'
    }

    const result = clientDetailsSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('should accept optional address', () => {
    const valid = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+639171234567',
      address: '123 Main St'
    }

    const result = clientDetailsSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('should reject too short name', () => {
    const invalid = {
      name: 'J',
      email: 'john@example.com',
      phone: '+639171234567'
    }

    const result = clientDetailsSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('should reject invalid email', () => {
    const invalid = {
      name: 'John Doe',
      email: 'invalid-email',
      phone: '+639171234567'
    }

    const result = clientDetailsSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('should reject too short phone', () => {
    const invalid = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123'
    }

    const result = clientDetailsSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('should reject invalid phone format', () => {
    const invalid = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: 'abc123def456'
    }

    const result = clientDetailsSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('should reject missing required fields', () => {
    const invalid = {
      name: 'John Doe'
    }

    const result = clientDetailsSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('createOrderSchema', () => {
  const validClientDetails = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+639171234567'
  }

  it('should validate correct order creation data', () => {
    const valid = {
      serviceId: 'clx9k2m3n0001qe8t',
      sampleDescription: 'Water sample from industrial site for quality testing',
      specialInstructions: 'Handle with care',
      clientDetails: validClientDetails
    }

    const result = createOrderSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('should reject invalid serviceId format', () => {
    const invalid = {
      serviceId: 'invalid-id',
      sampleDescription: 'Water sample for testing',
      clientDetails: validClientDetails
    }

    const result = createOrderSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('should reject too short sample description', () => {
    const invalid = {
      serviceId: 'clx9k2m3n0001qe8t',
      sampleDescription: 'Short',
      clientDetails: validClientDetails
    }

    const result = createOrderSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('should reject too long sample description', () => {
    const invalid = {
      serviceId: 'clx9k2m3n0001qe8t',
      sampleDescription: 'x'.repeat(2001),
      clientDetails: validClientDetails
    }

    const result = createOrderSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('should allow optional specialInstructions', () => {
    const valid = {
      serviceId: 'clx9k2m3n0001qe8t',
      sampleDescription: 'Water sample for testing',
      clientDetails: validClientDetails
    }

    const result = createOrderSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('should allow null specialInstructions', () => {
    const valid = {
      serviceId: 'clx9k2m3n0001qe8t',
      sampleDescription: 'Water sample for testing',
      specialInstructions: null,
      clientDetails: validClientDetails
    }

    const result = createOrderSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('should reject too long special instructions', () => {
    const invalid = {
      serviceId: 'clx9k2m3n0001qe8t',
      sampleDescription: 'Water sample for testing',
      specialInstructions: 'x'.repeat(1001),
      clientDetails: validClientDetails
    }

    const result = createOrderSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('updateOrderSchema', () => {
  it('should validate status update', () => {
    const valid = {
      status: OrderStatus.ACKNOWLEDGED
    }

    const result = updateOrderSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('should validate price update', () => {
    const valid = {
      quotedPrice: 500.50
    }

    const result = updateOrderSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('should validate all fields together', () => {
    const valid = {
      status: OrderStatus.IN_PROGRESS,
      quotedPrice: 1000,
      specialInstructions: 'Updated instructions'
    }

    const result = updateOrderSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('should reject invalid status', () => {
    const invalid = {
      status: 'INVALID_STATUS'
    }

    const result = updateOrderSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('should reject negative price', () => {
    const invalid = {
      quotedPrice: -100
    }

    const result = updateOrderSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('should reject unreasonably high price', () => {
    const invalid = {
      quotedPrice: 2000000
    }

    const result = updateOrderSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('should allow null price', () => {
    const valid = {
      quotedPrice: null
    }

    const result = updateOrderSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('should allow empty object', () => {
    const valid = {}

    const result = updateOrderSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })
})

describe('isValidStatusTransition()', () => {
  it('should allow PENDING to ACKNOWLEDGED', () => {
    const result = isValidStatusTransition(
      OrderStatus.PENDING,
      OrderStatus.ACKNOWLEDGED
    )
    expect(result).toBe(true)
  })

  it('should allow PENDING to CANCELLED', () => {
    const result = isValidStatusTransition(
      OrderStatus.PENDING,
      OrderStatus.CANCELLED
    )
    expect(result).toBe(true)
  })

  it('should allow ACKNOWLEDGED to IN_PROGRESS', () => {
    const result = isValidStatusTransition(
      OrderStatus.ACKNOWLEDGED,
      OrderStatus.IN_PROGRESS
    )
    expect(result).toBe(true)
  })

  it('should allow IN_PROGRESS to COMPLETED', () => {
    const result = isValidStatusTransition(
      OrderStatus.IN_PROGRESS,
      OrderStatus.COMPLETED
    )
    expect(result).toBe(true)
  })

  it('should reject PENDING to COMPLETED', () => {
    const result = isValidStatusTransition(
      OrderStatus.PENDING,
      OrderStatus.COMPLETED
    )
    expect(result).toBe(false)
  })

  it('should reject COMPLETED to IN_PROGRESS', () => {
    const result = isValidStatusTransition(
      OrderStatus.COMPLETED,
      OrderStatus.IN_PROGRESS
    )
    expect(result).toBe(false)
  })

  it('should reject transitions from COMPLETED', () => {
    const result = isValidStatusTransition(
      OrderStatus.COMPLETED,
      OrderStatus.ACKNOWLEDGED
    )
    expect(result).toBe(false)
  })

  it('should reject transitions from CANCELLED', () => {
    const result = isValidStatusTransition(
      OrderStatus.CANCELLED,
      OrderStatus.PENDING
    )
    expect(result).toBe(false)
  })
})

describe('createAttachmentSchema', () => {
  it('should validate correct attachment data', () => {
    const valid = {
      orderId: 'clx9k2m3n0001qe8t',
      fileName: 'test-results.pdf',
      fileType: 'application/pdf',
      fileSize: 1024000,
      attachmentType: AttachmentType.RESULT
    }

    const result = createAttachmentSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('should reject invalid orderId', () => {
    const invalid = {
      orderId: 'invalid',
      fileName: 'test.pdf',
      fileType: 'application/pdf',
      attachmentType: AttachmentType.RESULT
    }

    const result = createAttachmentSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('should reject invalid MIME type', () => {
    const invalid = {
      orderId: 'clx9k2m3n0001qe8t',
      fileName: 'test.pdf',
      fileType: 'invalid-type',
      attachmentType: AttachmentType.RESULT
    }

    const result = createAttachmentSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('should reject file size exceeding limit', () => {
    const invalid = {
      orderId: 'clx9k2m3n0001qe8t',
      fileName: 'test.pdf',
      fileType: 'application/pdf',
      fileSize: 60 * 1024 * 1024, // 60MB > 50MB limit
      attachmentType: AttachmentType.RESULT
    }

    const result = createAttachmentSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('should allow null fileSize', () => {
    const valid = {
      orderId: 'clx9k2m3n0001qe8t',
      fileName: 'test.pdf',
      fileType: 'application/pdf',
      fileSize: null,
      attachmentType: AttachmentType.RESULT
    }

    const result = createAttachmentSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('should reject invalid attachment type', () => {
    const invalid = {
      orderId: 'clx9k2m3n0001qe8t',
      fileName: 'test.pdf',
      fileType: 'application/pdf',
      attachmentType: 'invalid'
    }

    const result = createAttachmentSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('orderFilterSchema', () => {
  it('should validate filter with status', () => {
    const valid = {
      status: OrderStatus.PENDING
    }

    const result = orderFilterSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('should validate filter with clientId', () => {
    const valid = {
      clientId: 'clx9k2m3n0001qe8t'
    }

    const result = orderFilterSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('should validate pagination parameters', () => {
    const valid = {
      page: 2,
      pageSize: 10
    }

    const result = orderFilterSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('should coerce string numbers to numbers', () => {
    const input = {
      page: '3',
      pageSize: '25'
    }

    const result = orderFilterSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
      expect(result.data.pageSize).toBe(25)
    }
  })

  it('should reject negative page number', () => {
    const invalid = {
      page: -1
    }

    const result = orderFilterSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('should reject page size exceeding limit', () => {
    const invalid = {
      pageSize: 150 // Max is 100
    }

    const result = orderFilterSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('should apply default values', () => {
    const input = {}

    const result = orderFilterSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(20)
    }
  })
})
