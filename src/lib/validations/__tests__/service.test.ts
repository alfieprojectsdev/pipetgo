import { describe, it, expect } from 'vitest'
import {
  createServiceSchema,
  serviceCategoryEnum,
  pricingModeEnum
} from '../service'

/**
 * Service Validation Schema Tests
 *
 * Tests Zod validation for service creation with focus on:
 * - Pricing mode refinements (FIXED/HYBRID require price)
 * - Category validation
 * - Field length constraints
 * - Required vs optional fields
 */
describe('Service Validation Schemas', () => {
  describe('createServiceSchema - Valid Data', () => {
    it('should validate FIXED pricing service with price', () => {
      const validData = {
        name: 'Water Quality Testing',
        description: 'Comprehensive water analysis',
        category: 'Environmental Testing',
        pricingMode: 'FIXED',
        pricePerUnit: 5000,
        unitType: 'per_sample',
        turnaroundDays: 7,
        sampleRequirements: 'Minimum 500ml in sterile container'
      }

      expect(() => createServiceSchema.parse(validData)).not.toThrow()
      const result = createServiceSchema.parse(validData)
      expect(result.pricePerUnit).toBe(5000)
      expect(result.pricingMode).toBe('FIXED')
    })

    it('should validate QUOTE_REQUIRED service without price', () => {
      const validData = {
        name: 'Custom Toxicology Analysis',
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED'
        // pricePerUnit not required for QUOTE_REQUIRED
      }

      expect(() => createServiceSchema.parse(validData)).not.toThrow()
      const result = createServiceSchema.parse(validData)
      expect(result.pricingMode).toBe('QUOTE_REQUIRED')
    })

    it('should validate HYBRID pricing service with price', () => {
      const validData = {
        name: 'Microbiological Testing',
        category: 'Microbiological Testing',
        pricingMode: 'HYBRID',
        pricePerUnit: 3500
      }

      expect(() => createServiceSchema.parse(validData)).not.toThrow()
      const result = createServiceSchema.parse(validData)
      expect(result.pricePerUnit).toBe(3500)
      expect(result.pricingMode).toBe('HYBRID')
    })

    it('should validate minimal valid data (only required fields)', () => {
      const minimalData = {
        name: 'Basic Service',
        category: 'Other',
        pricingMode: 'QUOTE_REQUIRED'
      }

      expect(() => createServiceSchema.parse(minimalData)).not.toThrow()
    })

    it('should apply default unitType when not provided', () => {
      const data = {
        name: 'Test Service',
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED'
      }

      const result = createServiceSchema.parse(data)
      expect(result.unitType).toBe('per_sample') // Default value
    })

    it('should allow custom unitType', () => {
      const data = {
        name: 'Test Service',
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED',
        unitType: 'per_batch'
      }

      const result = createServiceSchema.parse(data)
      expect(result.unitType).toBe('per_batch')
    })
  })

  describe('createServiceSchema - Pricing Mode Refinements (CRITICAL)', () => {
    it('should fail when FIXED mode missing price', () => {
      const invalidData = {
        name: 'Test Service',
        category: 'Chemical Analysis',
        pricingMode: 'FIXED'
        // Missing pricePerUnit - should fail refinement
      }

      expect(() => createServiceSchema.parse(invalidData)).toThrow()

      try {
        createServiceSchema.parse(invalidData)
      } catch (error: any) {
        expect(error.errors[0].message).toContain('Price is required for FIXED and HYBRID pricing modes')
        expect(error.errors[0].path).toContain('pricePerUnit')
      }
    })

    it('should fail when HYBRID mode missing price', () => {
      const invalidData = {
        name: 'Test Service',
        category: 'Chemical Analysis',
        pricingMode: 'HYBRID'
        // Missing pricePerUnit - should fail refinement
      }

      expect(() => createServiceSchema.parse(invalidData)).toThrow()

      try {
        createServiceSchema.parse(invalidData)
      } catch (error: any) {
        expect(error.errors[0].message).toContain('Price is required for FIXED and HYBRID pricing modes')
      }
    })

    it('should pass when QUOTE_REQUIRED mode has no price', () => {
      const validData = {
        name: 'Test Service',
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED'
        // pricePerUnit not required
      }

      expect(() => createServiceSchema.parse(validData)).not.toThrow()
    })

    it('should allow QUOTE_REQUIRED service to have optional price', () => {
      const validData = {
        name: 'Test Service',
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED',
        pricePerUnit: 1000 // Optional price
      }

      expect(() => createServiceSchema.parse(validData)).not.toThrow()
      const result = createServiceSchema.parse(validData)
      expect(result.pricePerUnit).toBe(1000)
    })
  })

  describe('createServiceSchema - Required Fields', () => {
    it('should fail when name is missing', () => {
      const invalidData = {
        // Missing name
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED'
      }

      expect(() => createServiceSchema.parse(invalidData)).toThrow()
    })

    it('should fail when category is missing', () => {
      const invalidData = {
        name: 'Test Service',
        // Missing category
        pricingMode: 'QUOTE_REQUIRED'
      }

      expect(() => createServiceSchema.parse(invalidData)).toThrow()
    })

    it('should fail when pricingMode is missing', () => {
      const invalidData = {
        name: 'Test Service',
        category: 'Chemical Analysis'
        // Missing pricingMode
      }

      expect(() => createServiceSchema.parse(invalidData)).toThrow()
    })
  })

  describe('createServiceSchema - Name Validation', () => {
    it('should fail when name is too short (< 3 chars)', () => {
      const invalidData = {
        name: 'ab', // Only 2 chars
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED'
      }

      expect(() => createServiceSchema.parse(invalidData)).toThrow()

      try {
        createServiceSchema.parse(invalidData)
      } catch (error: any) {
        expect(error.errors[0].message).toContain('at least 3 characters')
      }
    })

    it('should fail when name is too long (> 200 chars)', () => {
      const invalidData = {
        name: 'a'.repeat(201), // 201 chars
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED'
      }

      expect(() => createServiceSchema.parse(invalidData)).toThrow()

      try {
        createServiceSchema.parse(invalidData)
      } catch (error: any) {
        expect(error.errors[0].message).toContain('cannot exceed 200 characters')
      }
    })

    it('should pass with name at minimum length (3 chars)', () => {
      const validData = {
        name: 'abc', // Exactly 3 chars
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED'
      }

      expect(() => createServiceSchema.parse(validData)).not.toThrow()
    })

    it('should pass with name at maximum length (200 chars)', () => {
      const validData = {
        name: 'a'.repeat(200), // Exactly 200 chars
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED'
      }

      expect(() => createServiceSchema.parse(validData)).not.toThrow()
    })
  })

  describe('createServiceSchema - Description Validation', () => {
    it('should fail when description is too long (> 1000 chars)', () => {
      const invalidData = {
        name: 'Test Service',
        description: 'a'.repeat(1001), // 1001 chars
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED'
      }

      expect(() => createServiceSchema.parse(invalidData)).toThrow()

      try {
        createServiceSchema.parse(invalidData)
      } catch (error: any) {
        expect(error.errors[0].message).toContain('cannot exceed 1000 characters')
      }
    })

    it('should pass when description is at maximum length (1000 chars)', () => {
      const validData = {
        name: 'Test Service',
        description: 'a'.repeat(1000), // Exactly 1000 chars
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED'
      }

      expect(() => createServiceSchema.parse(validData)).not.toThrow()
    })

    it('should allow missing description (optional)', () => {
      const validData = {
        name: 'Test Service',
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED'
        // description not provided
      }

      expect(() => createServiceSchema.parse(validData)).not.toThrow()
    })
  })

  describe('createServiceSchema - Category Validation', () => {
    it('should accept valid categories', () => {
      const categories = [
        'Chemical Analysis',
        'Microbiological Testing',
        'Physical Testing',
        'Environmental Testing',
        'Food Safety',
        'Other'
      ]

      categories.forEach(category => {
        const data = {
          name: 'Test Service',
          category,
          pricingMode: 'QUOTE_REQUIRED' as const
        }

        expect(() => createServiceSchema.parse(data)).not.toThrow()
      })
    })

    it('should fail with invalid category', () => {
      const invalidData = {
        name: 'Test Service',
        category: 'Invalid Category',
        pricingMode: 'QUOTE_REQUIRED'
      }

      expect(() => createServiceSchema.parse(invalidData)).toThrow()
    })
  })

  describe('createServiceSchema - Pricing Mode Validation', () => {
    it('should accept valid pricing modes', () => {
      const pricingModes: Array<'QUOTE_REQUIRED' | 'FIXED' | 'HYBRID'> = [
        'QUOTE_REQUIRED',
        'FIXED',
        'HYBRID'
      ]

      pricingModes.forEach(pricingMode => {
        const data = {
          name: 'Test Service',
          category: 'Chemical Analysis',
          pricingMode,
          ...(pricingMode !== 'QUOTE_REQUIRED' && { pricePerUnit: 1000 })
        }

        expect(() => createServiceSchema.parse(data)).not.toThrow()
      })
    })

    it('should fail with invalid pricing mode', () => {
      const invalidData = {
        name: 'Test Service',
        category: 'Chemical Analysis',
        pricingMode: 'INVALID_MODE'
      }

      expect(() => createServiceSchema.parse(invalidData as any)).toThrow()
    })
  })

  describe('createServiceSchema - Price Validation', () => {
    it('should fail when price is negative', () => {
      const invalidData = {
        name: 'Test Service',
        category: 'Chemical Analysis',
        pricingMode: 'FIXED',
        pricePerUnit: -100 // Negative price
      }

      expect(() => createServiceSchema.parse(invalidData)).toThrow()

      try {
        createServiceSchema.parse(invalidData)
      } catch (error: any) {
        expect(error.errors[0].message).toContain('Price must be positive')
      }
    })

    it('should fail when price is zero', () => {
      const invalidData = {
        name: 'Test Service',
        category: 'Chemical Analysis',
        pricingMode: 'FIXED',
        pricePerUnit: 0 // Zero price
      }

      expect(() => createServiceSchema.parse(invalidData)).toThrow()
    })

    it('should fail when price exceeds maximum (> ₱1,000,000)', () => {
      const invalidData = {
        name: 'Test Service',
        category: 'Chemical Analysis',
        pricingMode: 'FIXED',
        pricePerUnit: 1000001 // Exceeds max
      }

      expect(() => createServiceSchema.parse(invalidData)).toThrow()

      try {
        createServiceSchema.parse(invalidData)
      } catch (error: any) {
        expect(error.errors[0].message).toContain('cannot exceed ₱1,000,000')
      }
    })

    it('should pass with price at maximum (₱1,000,000)', () => {
      const validData = {
        name: 'Test Service',
        category: 'Chemical Analysis',
        pricingMode: 'FIXED',
        pricePerUnit: 1000000 // Exactly max
      }

      expect(() => createServiceSchema.parse(validData)).not.toThrow()
    })

    it('should pass with very small positive price', () => {
      const validData = {
        name: 'Test Service',
        category: 'Chemical Analysis',
        pricingMode: 'FIXED',
        pricePerUnit: 0.01 // Very small but positive
      }

      expect(() => createServiceSchema.parse(validData)).not.toThrow()
    })
  })

  describe('createServiceSchema - Turnaround Days Validation', () => {
    it('should fail when turnaround days is negative', () => {
      const invalidData = {
        name: 'Test Service',
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED',
        turnaroundDays: -5 // Negative
      }

      expect(() => createServiceSchema.parse(invalidData)).toThrow()
    })

    it('should fail when turnaround days is zero', () => {
      const invalidData = {
        name: 'Test Service',
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED',
        turnaroundDays: 0 // Zero
      }

      expect(() => createServiceSchema.parse(invalidData)).toThrow()
    })

    it('should fail when turnaround days exceeds maximum (> 365)', () => {
      const invalidData = {
        name: 'Test Service',
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED',
        turnaroundDays: 366 // Exceeds max
      }

      expect(() => createServiceSchema.parse(invalidData)).toThrow()
    })

    it('should fail when turnaround days is not an integer', () => {
      const invalidData = {
        name: 'Test Service',
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED',
        turnaroundDays: 7.5 // Decimal
      }

      expect(() => createServiceSchema.parse(invalidData)).toThrow()

      try {
        createServiceSchema.parse(invalidData)
      } catch (error: any) {
        expect(error.errors[0].message).toContain('must be a whole number')
      }
    })

    it('should pass with turnaround days at maximum (365)', () => {
      const validData = {
        name: 'Test Service',
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED',
        turnaroundDays: 365 // Exactly max
      }

      expect(() => createServiceSchema.parse(validData)).not.toThrow()
    })

    it('should allow missing turnaround days (optional)', () => {
      const validData = {
        name: 'Test Service',
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED'
        // turnaroundDays not provided
      }

      expect(() => createServiceSchema.parse(validData)).not.toThrow()
    })
  })

  describe('createServiceSchema - Sample Requirements Validation', () => {
    it('should fail when sample requirements exceed 500 chars', () => {
      const invalidData = {
        name: 'Test Service',
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED',
        sampleRequirements: 'a'.repeat(501) // 501 chars
      }

      expect(() => createServiceSchema.parse(invalidData)).toThrow()

      try {
        createServiceSchema.parse(invalidData)
      } catch (error: any) {
        expect(error.errors[0].message).toContain('cannot exceed 500 characters')
      }
    })

    it('should pass with sample requirements at maximum (500 chars)', () => {
      const validData = {
        name: 'Test Service',
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED',
        sampleRequirements: 'a'.repeat(500) // Exactly 500 chars
      }

      expect(() => createServiceSchema.parse(validData)).not.toThrow()
    })

    it('should allow missing sample requirements (optional)', () => {
      const validData = {
        name: 'Test Service',
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED'
        // sampleRequirements not provided
      }

      expect(() => createServiceSchema.parse(validData)).not.toThrow()
    })
  })

  describe('Enum Exports', () => {
    it('should export serviceCategoryEnum', () => {
      expect(serviceCategoryEnum).toBeDefined()
      expect(() => serviceCategoryEnum.parse('Chemical Analysis')).not.toThrow()
    })

    it('should export pricingModeEnum', () => {
      expect(pricingModeEnum).toBeDefined()
      expect(() => pricingModeEnum.parse('FIXED')).not.toThrow()
      expect(() => pricingModeEnum.parse('QUOTE_REQUIRED')).not.toThrow()
      expect(() => pricingModeEnum.parse('HYBRID')).not.toThrow()
    })
  })
})
