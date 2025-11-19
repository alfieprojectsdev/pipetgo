/**
 * 🎓 LEARNING: Service Validation Schemas
 * =======================================
 * Schemas for lab service operations:
 * - Service creation/updates (lab admins)
 * - Service filtering and search
 */

import { z } from 'zod'

// Service categories enum
export const serviceCategoryEnum = z.enum([
  'Chemical Analysis',
  'Microbiological Testing',
  'Physical Testing',
  'Environmental Testing',
  'Food Safety',
  'Other'
])

// Pricing mode enum
export const pricingModeEnum = z.enum([
  'QUOTE_REQUIRED',
  'FIXED',
  'HYBRID'
])

/**
 * 🎓 Base Service Schema (without refinement)
 * Base schema object for deriving variants
 */
const baseServiceSchema = z.object({
  labId: z.string().cuid(),
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(200, 'Name cannot exceed 200 characters'),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
  category: serviceCategoryEnum,
  pricingMode: pricingModeEnum,
  pricePerUnit: z
    .number()
    .positive('Price must be positive')
    .max(1000000, 'Price cannot exceed ₱1,000,000')
    .optional(),
  unitType: z
    .string()
    .default('per_sample'),
  turnaroundDays: z
    .number()
    .int('Turnaround days must be a whole number')
    .positive('Turnaround days must be positive')
    .max(365, 'Turnaround cannot exceed 365 days')
    .optional(),
  sampleRequirements: z
    .string()
    .max(500, 'Sample requirements cannot exceed 500 characters')
    .optional()
})

// Refinement function for pricing validation
const pricingRefinement = (data: any) => {
  // If pricing mode is FIXED or HYBRID, price is required
  if (data.pricingMode === 'FIXED' || data.pricingMode === 'HYBRID') {
    return data.pricePerUnit !== undefined && data.pricePerUnit !== null
  }
  return true
}

/**
 * 🎓 Full Service Schema (with refinement)
 * Lab admins use this to add or modify their services
 */
export const serviceSchema = baseServiceSchema.refine(
  pricingRefinement,
  {
    message: 'Price is required for FIXED and HYBRID pricing modes',
    path: ['pricePerUnit']
  }
)

// Schema for creating service (client doesn't provide labId)
export const createServiceSchema = baseServiceSchema
  .omit({ labId: true })
  .refine(
    pricingRefinement,
    {
      message: 'Price is required for FIXED and HYBRID pricing modes',
      path: ['pricePerUnit']
    }
  )

// Schema for updating service (all fields optional except labId)
export const updateServiceSchema = baseServiceSchema.partial().required({ labId: true })

// Type exports
export type ServiceSchema = z.infer<typeof serviceSchema>
export type CreateServiceSchema = z.infer<typeof createServiceSchema>
export type UpdateServiceSchema = z.infer<typeof updateServiceSchema>
export type ServiceInput = z.infer<typeof serviceSchema>

/**
 * 🎓 Service Filter Schema
 * For searching and filtering services on homepage
 */
export const serviceFilterSchema = z.object({
  category: z.enum([
    'Chemical Analysis',
    'Microbiological Testing',
    'Physical Testing',
    'Environmental Testing',
    'Food Safety',
    'Other',
    'all'
  ] as const).optional(),
  labId: z.string().cuid().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  active: z.coerce.boolean().default(true),
  searchTerm: z.string().max(100).optional(),
  page: z.coerce.number().positive().default(1),
  pageSize: z.coerce.number().positive().max(100).default(20)
})

export type ServiceFilterInput = z.infer<typeof serviceFilterSchema>
