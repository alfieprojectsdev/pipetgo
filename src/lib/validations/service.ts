/**
 * 🎓 LEARNING: Service Validation Schemas
 * =======================================
 * Schemas for lab service operations:
 * - Service creation/updates (lab admins)
 * - Service filtering and search
 */

import { z } from 'zod'
import { SERVICE_CATEGORIES } from '@/types'

/**
 * 🎓 Create/Update Service Schema
 * Lab admins use this to add or modify their services
 */
export const serviceSchema = z.object({
  name: z
    .string()
    .min(3, 'Service name must be at least 3 characters')
    .max(200, 'Service name is too long')
    .trim(),
  description: z
    .string()
    .max(2000, 'Description is too long')
    .optional()
    .nullable(),
  category: z.enum(SERVICE_CATEGORIES, {
    errorMap: () => ({ message: 'Please select a valid category' })
  }),
  pricePerUnit: z
    .number()
    .positive('Price must be positive')
    .max(1000000, 'Price is unreasonably high')
    .optional()
    .nullable(),
  unitType: z
    .string()
    .min(1, 'Unit type is required')
    .max(50, 'Unit type is too long')
    .default('per_sample'),
  turnaroundDays: z
    .number()
    .int('Turnaround days must be a whole number')
    .positive('Turnaround days must be positive')
    .max(365, 'Turnaround time is unreasonably long')
    .optional()
    .nullable(),
  sampleRequirements: z
    .string()
    .max(1000, 'Sample requirements are too long')
    .optional()
    .nullable(),
  active: z
    .boolean()
    .default(true)
})

export type ServiceInput = z.infer<typeof serviceSchema>

/**
 * 🎓 Service Filter Schema
 * For searching and filtering services on homepage
 */
export const serviceFilterSchema = z.object({
  category: z.enum([...SERVICE_CATEGORIES, 'all'] as const).optional(),
  labId: z.string().cuid().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  active: z.coerce.boolean().default(true),
  searchTerm: z.string().max(100).optional(),
  page: z.coerce.number().positive().default(1),
  pageSize: z.coerce.number().positive().max(100).default(20)
})

export type ServiceFilterInput = z.infer<typeof serviceFilterSchema>
