/**
 * 🎓 LEARNING: Utility Functions
 * ==============================
 * Common helper functions used throughout the application.
 *
 * Key Concepts:
 * - cn() merges Tailwind classes intelligently (handles conflicts)
 * - Formatting functions ensure consistent display
 * - Type guards help TypeScript narrow types
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistance, formatRelative } from 'date-fns'
import { OrderStatus, UserRole } from '@/types'

/**
 * 🎓 Class Name Utility
 * Combines clsx and tailwind-merge for intelligent class merging
 *
 * Example:
 * cn("px-2 py-1", "px-4") → "py-1 px-4" (px-4 wins)
 * cn("text-red-500", isActive && "text-green-500") → conditional classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * 🎓 Format Currency
 * Displays monetary values in PHP format
 * TODO: Make currency configurable for international labs
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return 'N/A'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return 'N/A'

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(num)
}

/**
 * 🎓 Format Date
 * Displays dates in readable format
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A'
  return format(new Date(date), 'PPP') // Example: "April 29, 2025"
}

/**
 * 🎓 Format Date and Time
 * Includes time component
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return 'N/A'
  return format(new Date(date), 'PPp') // Example: "Apr 29, 2025, 9:30 AM"
}

/**
 * 🎓 Format Relative Time
 * Shows "2 hours ago", "in 3 days", etc.
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return 'N/A'
  return formatDistance(new Date(date), new Date(), { addSuffix: true })
}

/**
 * 🎓 Format File Size
 * Converts bytes to human-readable format
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return 'N/A'
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// ============================================================================
// STATUS UTILITIES
// ============================================================================

/**
 * 🎓 Get Status Badge Color
 * Returns Tailwind classes for order status badges
 *
 * v0.app UX Recommendation: Standardized color system
 * - Blue: Awaiting action (quote requested, acknowledged)
 * - Yellow: Pending review
 * - Purple: Active work in progress
 * - Green: Positive outcomes (quote provided, completed)
 * - Red/Gray: Negative outcomes (rejected, cancelled)
 */
export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    [OrderStatus.QUOTE_REQUESTED]: 'bg-blue-100 text-blue-800 border-blue-200',
    [OrderStatus.QUOTE_PROVIDED]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    [OrderStatus.QUOTE_REJECTED]: 'bg-gray-100 text-gray-800 border-gray-200',
    [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [OrderStatus.ACKNOWLEDGED]: 'bg-blue-100 text-blue-800 border-blue-200',
    [OrderStatus.IN_PROGRESS]: 'bg-purple-100 text-purple-800 border-purple-200',
    [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
    [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800 border-red-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

/**
 * 🎓 Get Status Display Name
 * User-friendly status text (v0.app UX recommendation)
 */
export function getStatusDisplayName(status: OrderStatus): string {
  const names: Record<OrderStatus, string> = {
    [OrderStatus.QUOTE_REQUESTED]: 'Awaiting Quote',
    [OrderStatus.QUOTE_PROVIDED]: 'Quote Ready',
    [OrderStatus.QUOTE_REJECTED]: 'Quote Declined',
    [OrderStatus.PENDING]: 'Pending Review',
    [OrderStatus.ACKNOWLEDGED]: 'Lab Acknowledged',
    [OrderStatus.IN_PROGRESS]: 'Testing in Progress',
    [OrderStatus.COMPLETED]: 'Results Available',
    [OrderStatus.CANCELLED]: 'Cancelled',
  }
  return names[status] || status
}

/**
 * 🎓 Get Role Display Name
 * Converts role enum to readable text
 */
export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    [UserRole.CLIENT]: 'Client',
    [UserRole.LAB_ADMIN]: 'Lab Administrator',
    [UserRole.ADMIN]: 'Platform Administrator',
  }
  return names[role] || role
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * 🎓 Type Guard: Check if Email is Valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 🎓 Type Guard: Check if value is defined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * 🎓 Truncate Text
 * Limits text length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// ============================================================================
// URL UTILITIES
// ============================================================================

/**
 * 🎓 Build Query String
 * Converts object to URL query params
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

/**
 * 🎓 Get Initials from Name
 * For avatar placeholders
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '??'

  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ============================================================================
// MOCK DATA HELPERS (Stage 1)
// ============================================================================

/**
 * 🎓 Generate Mock File URL
 * Stage 1: Creates mock URLs for file attachments
 * TODO: Stage 2 - Replace with real S3/Supabase upload
 */
export function generateMockFileUrl(orderId: string, fileName: string): string {
  return `https://mock-storage.pipetgo.example.com/orders/${orderId}/${fileName}`
}

/**
 * 🎓 Sleep Utility
 * For simulating async operations in development
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}