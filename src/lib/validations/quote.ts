import { z } from 'zod'

/**
 * Validation schema for lab admin providing a custom quote
 *
 * Used by: POST /api/orders/[id]/quote
 * Authorization: LAB_ADMIN only (must own lab)
 */
export const provideQuoteSchema = z.object({
  quotedPrice: z.number()
    .positive('Price must be positive')
    .min(1, 'Price must be at least ₱1')
    .max(1000000, 'Price cannot exceed ₱1,000,000')
    .refine(
      (val) => Number.isFinite(val),
      { message: 'Price must be a valid number' }
    ),

  quoteNotes: z.string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .transform(val => val?.trim()),

  estimatedTurnaroundDays: z.number()
    .int('Turnaround must be whole days')
    .positive('Turnaround must be positive')
    .max(365, 'Turnaround cannot exceed 365 days')
    .optional()
})

export type ProvideQuoteInput = z.infer<typeof provideQuoteSchema>

/**
 * Validation schema for client approving or rejecting a quote
 *
 * Used by: POST /api/orders/[id]/approve-quote
 * Authorization: CLIENT only (must own order)
 */
export const approveQuoteSchema = z.object({
  approved: z.boolean({
    required_error: 'Approval decision is required',
    invalid_type_error: 'Approval must be true or false'
  }),

  rejectionReason: z.string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason cannot exceed 500 characters')
    .optional()
    .transform(val => val?.trim())
}).refine(
  (data) => data.approved || (data.rejectionReason && data.rejectionReason.length >= 10),
  {
    message: 'Rejection reason is required when rejecting quote (minimum 10 characters)',
    path: ['rejectionReason']
  }
)

export type ApproveQuoteInput = z.infer<typeof approveQuoteSchema>

/**
 * Validation schema for client requesting custom quote (HYBRID mode)
 *
 * Used by: POST /api/orders/[id]/request-custom-quote
 * Authorization: CLIENT only (must own order)
 *
 * Only applicable for orders in HYBRID pricing mode where client
 * initially booked at fixed rate but wants custom quote instead
 */
export const requestCustomQuoteSchema = z.object({
  reason: z.string()
    .min(10, 'Please explain why you need a custom quote (minimum 10 characters)')
    .max(500, 'Reason cannot exceed 500 characters')
    .transform(val => val.trim())
    .refine(
      (val) => val.length >= 10,
      { message: 'Reason must be at least 10 characters after trimming whitespace' }
    )
})

export type RequestCustomQuoteInput = z.infer<typeof requestCustomQuoteSchema>

/**
 * Helper schema for validating pricing mode
 * Used internally to ensure service supports quote workflows
 */
export const pricingModeSchema = z.enum(['QUOTE_REQUIRED', 'FIXED', 'HYBRID'])

export type PricingMode = z.infer<typeof pricingModeSchema>

/**
 * Helper schema for validating order status transitions
 * Used to ensure state machine rules are followed
 */
export const orderStatusSchema = z.enum([
  'QUOTE_REQUESTED',
  'QUOTE_PROVIDED',
  'QUOTE_REJECTED',
  'PENDING',
  'ACKNOWLEDGED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
])

export type OrderStatus = z.infer<typeof orderStatusSchema>
