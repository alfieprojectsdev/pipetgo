/**
 * 🎓 LEARNING: Order Validation Schemas
 * =====================================
 * These schemas validate order-related operations:
 * - Order creation (client submission)
 * - Order updates (lab status changes)
 * - File attachments
 *
 * Key Concepts:
 * - .cuid() validates Prisma-generated IDs
 * - .transform() normalizes data before validation
 * - Nested objects use z.object() for structure
 */

import { z } from 'zod'
import { OrderStatus, AttachmentType } from '@/types'

/**
 * 🎓 Client Details Schema
 * Validates customer contact information
 */
export const clientDetailsSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .trim(),
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number is too long')
    .regex(/^[0-9\s\-\+\(\)]+$/, 'Invalid phone number format'),
  organization: z
    .string()
    .max(200, 'Organization name is too long')
    .optional(),
  address: z
    .string()
    .max(500, 'Address is too long')
    .optional()
})

export type ClientDetailsInput = z.infer<typeof clientDetailsSchema>

/**
 * 🎓 Create Order Schema
 * What clients submit when requesting a test
 */
export const createOrderSchema = z.object({
  serviceId: z
    .string()
    .cuid('Invalid service ID'),
  sampleDescription: z
    .string()
    .min(10, 'Sample description must be at least 10 characters')
    .max(2000, 'Sample description is too long')
    .trim(),
  specialInstructions: z
    .string()
    .max(1000, 'Special instructions are too long')
    .optional()
    .nullable(),
  clientDetails: clientDetailsSchema
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

/**
 * 🎓 Update Order Schema
 * What lab admins can modify
 */
export const updateOrderSchema = z.object({
  status: z.nativeEnum(OrderStatus, {
    errorMap: () => ({ message: 'Invalid order status' })
  }).optional(),
  quotedPrice: z
    .number()
    .positive('Price must be positive')
    .max(1000000, 'Price is unreasonably high')
    .optional()
    .nullable(),
  specialInstructions: z
    .string()
    .max(1000, 'Instructions are too long')
    .optional()
    .nullable()
})

export type UpdateOrderInput = z.infer<typeof updateOrderSchema>

/**
 * 🎓 Status Transition Validation
 * Ensures order status follows proper flow
 */
const validStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.QUOTE_REQUESTED]: [OrderStatus.QUOTE_PROVIDED, OrderStatus.CANCELLED],
  [OrderStatus.QUOTE_PROVIDED]: [OrderStatus.PENDING, OrderStatus.QUOTE_REJECTED, OrderStatus.CANCELLED],
  [OrderStatus.QUOTE_REJECTED]: [OrderStatus.CANCELLED], // Can be cancelled after rejection
  [OrderStatus.PENDING]: [OrderStatus.ACKNOWLEDGED, OrderStatus.CANCELLED],
  [OrderStatus.ACKNOWLEDGED]: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
  [OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [], // Terminal state
  [OrderStatus.CANCELLED]: [] // Terminal state
}

/**
 * TODO: Implement this validation in API route
 * Usage:
 * ```
 * if (!isValidStatusTransition(currentStatus, newStatus)) {
 *   return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 })
 * }
 * ```
 */
export const isValidStatusTransition = (
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean => {
  return validStatusTransitions[currentStatus].includes(newStatus)
}

/**
 * 🎓 Attachment Upload Schema
 * Stage 1: Mock file upload (just metadata)
 * Stage 2: Add actual file validation
 */
export const createAttachmentSchema = z.object({
  orderId: z.string().cuid('Invalid order ID'),
  fileName: z
    .string()
    .min(1, 'File name is required')
    .max(255, 'File name is too long'),
  fileType: z
    .string()
    .regex(/^[a-z]+\/[a-z0-9\-\+]+$/i, 'Invalid MIME type'),
  fileSize: z
    .number()
    .positive('File size must be positive')
    .max(50 * 1024 * 1024, 'File size must be less than 50MB') // 50MB limit
    .optional()
    .nullable(),
  attachmentType: z.nativeEnum(AttachmentType, {
    errorMap: () => ({ message: 'Invalid attachment type' })
  })
})

export type CreateAttachmentInput = z.infer<typeof createAttachmentSchema>

/**
 * 🎓 Order Filter Schema
 * For querying orders with filters
 */
export const orderFilterSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  clientId: z.string().cuid().optional(),
  labId: z.string().cuid().optional(),
  serviceId: z.string().cuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().positive().default(1),
  pageSize: z.coerce.number().positive().max(100).default(20)
})

export type OrderFilterInput = z.infer<typeof orderFilterSchema>
