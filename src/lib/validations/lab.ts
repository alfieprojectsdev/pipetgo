/**
 * 🎓 LEARNING: Lab Validation Schemas
 * ===================================
 * Schemas for lab profile management
 */

import { z } from 'zod'

/**
 * 🎓 Lab Location Schema
 * Validates address and coordinates
 */
export const labLocationSchema = z.object({
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address is too long'),
  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City name is too long'),
  state: z
    .string()
    .min(2, 'State must be at least 2 characters')
    .max(100, 'State name is too long'),
  country: z
    .string()
    .min(2, 'Country must be at least 2 characters')
    .max(100, 'Country name is too long'),
  postalCode: z
    .string()
    .min(3, 'Postal code must be at least 3 characters')
    .max(20, 'Postal code is too long'),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }).optional()
})

export type LabLocationInput = z.infer<typeof labLocationSchema>

/**
 * 🎓 Create/Update Lab Schema
 * Lab admins use this to manage their lab profile
 */
export const labSchema = z.object({
  name: z
    .string()
    .min(3, 'Lab name must be at least 3 characters')
    .max(200, 'Lab name is too long')
    .trim(),
  description: z
    .string()
    .max(2000, 'Description is too long')
    .optional()
    .nullable(),
  location: labLocationSchema.optional().nullable(),
  certifications: z
    .array(z.string().max(100))
    .max(20, 'Too many accreditations')
    .default([])
})

export type LabInput = z.infer<typeof labSchema>

/**
 * 🎓 Lab Filter Schema
 * For searching labs (admin view)
 */
export const labFilterSchema = z.object({
  searchTerm: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  hasCertification: z.string().optional(),
  page: z.coerce.number().positive().default(1),
  pageSize: z.coerce.number().positive().max(100).default(20)
})

export type LabFilterInput = z.infer<typeof labFilterSchema>
