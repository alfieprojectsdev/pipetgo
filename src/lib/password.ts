/**
 * PipetGo - B2B Lab Testing Marketplace
 * Copyright (c) 2025 PIPETGO, Inc. All rights reserved.
 * 
 * This file and its contents are the proprietary intellectual property of PIPETGO, Inc.
 * Unauthorized use, reproduction, or distribution is strictly prohibited.
 */

/**
 * 🎓 LEARNING: Password Hashing Utilities
 * =======================================
 * Stage 2: Secure password management using bcrypt.
 *
 * Key Concepts:
 * - bcrypt is a slow hashing algorithm designed to resist brute-force attacks
 * - Salt rounds (10) determine computational cost (higher = slower but more secure)
 * - Never store plain text passwords!
 * - compare() is timing-safe to prevent timing attacks
 *
 * Security Best Practices:
 * - Use at least 10 salt rounds (we use 12 for extra security)
 * - Always hash on server-side, never client-side
 * - Hash passwords asynchronously to avoid blocking
 */

import bcrypt from 'bcryptjs'

/**
 * Salt rounds for bcrypt hashing
 * Higher = more secure but slower
 * 12 rounds ≈ 250-500ms per hash (good balance for 2025)
 */
const SALT_ROUNDS = 12

/**
 * 🎓 Hash a Password
 * Converts plain text password to secure hash
 *
 * @param password - Plain text password from user
 * @returns Promise<string> - Hashed password to store in database
 *
 * Example:
 * ```typescript
 * const hashedPassword = await hashPassword('MySecurePass123!')
 * // Store hashedPassword in database, never the plain text
 * ```
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length === 0) {
    throw new Error('Password cannot be empty')
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  if (password.length > 128) {
    throw new Error('Password is too long')
  }

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS)
    return hash
  } catch (error) {
    console.error('Password hashing failed:', error)
    throw new Error('Failed to hash password')
  }
}

/**
 * 🎓 Verify a Password
 * Compares plain text password with stored hash
 *
 * @param password - Plain text password from user
 * @param hashedPassword - Stored hash from database
 * @returns Promise<boolean> - True if password matches
 *
 * Example:
 * ```typescript
 * const user = await prisma.user.findUnique({ where: { email } })
 * const isValid = await verifyPassword(inputPassword, user.hashedPassword)
 * if (isValid) {
 *   // Password correct, proceed with login
 * }
 * ```
 *
 * Security Note:
 * - bcrypt.compare is timing-safe (prevents timing attacks)
 * - Even if hash is invalid, function takes same time
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  if (!password || !hashedPassword) {
    return false
  }

  try {
    const isMatch = await bcrypt.compare(password, hashedPassword)
    return isMatch
  } catch (error) {
    console.error('Password verification failed:', error)
    return false
  }
}

/**
 * 🎓 Validate Password Strength
 * Checks if password meets security requirements
 *
 * @param password - Plain text password to validate
 * @returns { valid: boolean, errors: string[] }
 *
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 *
 * Example:
 * ```typescript
 * const validation = validatePasswordStrength('weak')
 * if (!validation.valid) {
 *   // Show validation.errors to user
 * }
 * ```
 */
export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!password) {
    return { valid: false, errors: ['Password is required'] }
  }

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (password.length > 128) {
    errors.push('Password must be less than 128 characters')
  }

  // Uppercase letter check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  // Lowercase letter check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  // Common weak passwords check
  const weakPasswords = [
    'password', 'password123', '12345678', 'qwerty', 'abc123',
    'letmein', 'welcome', 'monkey', '1234567890', 'password1'
  ]

  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('This password is too common')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 🎓 Generate Random Password
 * Creates a secure random password for testing or temporary passwords
 *
 * @param length - Length of password (default: 16)
 * @returns string - Random secure password
 *
 * Use Cases:
 * - Temporary passwords sent via email
 * - Password reset tokens
 * - Testing purposes
 *
 * Example:
 * ```typescript
 * const tempPassword = generateRandomPassword()
 * await sendPasswordResetEmail(user.email, tempPassword)
 * ```
 */
export function generateRandomPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  const allChars = uppercase + lowercase + numbers + special

  let password = ''

  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}
