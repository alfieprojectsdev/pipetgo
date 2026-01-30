/**
 * PipetGo - B2B Lab Testing Marketplace
 * Copyright (c) 2025 PIPETGO, Inc. All rights reserved.
 * 
 * This file and its contents are the proprietary intellectual property of PIPETGO, Inc.
 * Unauthorized use, reproduction, or distribution is strictly prohibited.
 */

/**
 * 🎓 LEARNING: Authentication Validation Schemas
 * ==============================================
 * Zod schemas validate user input for authentication flows.
 * These schemas are used both client-side (React Hook Form) and server-side (API routes).
 *
 * Key Concepts:
 * - Zod provides runtime type checking AND compile-time types
 * - .safeParse() returns { success: boolean, data?: T, error?: ZodError }
 * - Schemas can be refined with custom validation logic
 * - Error messages guide users to fix input issues
 */

import { z } from 'zod'

/**
 * Password Validation Schema (P0-1 Password Authentication)
 * ==========================================================
 * Reusable password validation for signin, signup, and password reset flows.
 *
 * Requirements:
 * - Length: 8-72 characters (72 is bcrypt's technical limit)
 * - Complexity: At least 1 uppercase, 1 lowercase, 1 number
 * - User-friendly error messages for each requirement
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be less than 72 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

export type PasswordInput = z.infer<typeof passwordSchema>

/**
 * 🎓 Sign In Schema
 * Stage 1: Email-only authentication (MVP simplification)
 * Stage 2: Add password validation
 */
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  // TODO: Stage 2 - Add password field
  // password: z.string().min(8, 'Password must be at least 8 characters')
})

export type SignInInput = z.infer<typeof signInSchema>

/**
 * 🎓 Sign Up Schema
 * Collects user information for account creation
 */
export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  role: z.enum(['CLIENT', 'LAB_ADMIN'], {
    errorMap: () => ({ message: 'Please select a valid role' })
  }),
  // TODO: Stage 2 - Add password with confirmation
  // password: z.string().min(8, 'Password must be at least 8 characters'),
  // confirmPassword: z.string()
})
// TODO: Stage 2 - Add password matching validation
// .refine((data) => data.password === data.confirmPassword, {
//   message: "Passwords don't match",
//   path: ["confirmPassword"]
// })

export type SignUpInput = z.infer<typeof signUpSchema>

/**
 * 🎓 Email Verification Schema
 * For email verification tokens (if implementing email verification)
 */
export const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required')
})

export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>

/**
 * 🎓 Password Reset Schema (for future implementation)
 */
export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase()
    .trim()
})

export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>
export type PasswordResetInput = z.infer<typeof passwordResetSchema>
