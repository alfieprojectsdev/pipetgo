/**
 * 🎓 LEARNING: Central Type Definitions
 * ====================================
 * This file defines all TypeScript types used throughout the application.
 * These types mirror the Prisma schema but add additional client-side types
 * that aren't stored in the database.
 *
 * Key Concepts:
 * - Prisma auto-generates types, but we extend them for frontend use
 * - Enums ensure type safety for status values and roles
 * - Omit<> and Pick<> allow us to create variations of types
 * - JSON types need explicit TypeScript definitions
 */

import { Prisma, UserRole, OrderStatus } from '@prisma/client'

// ============================================================================
// ENUMS - Re-export from Prisma (single source of truth)
// ============================================================================

export { UserRole, OrderStatus }

// AttachmentType is not in Prisma schema, so we keep it here
export enum AttachmentType {
  SPECIFICATION = 'specification',
  RESULT = 'result',
  CERTIFICATE = 'accreditation_certificate'
}

// ============================================================================
// DATABASE MODEL TYPES - Extended from Prisma
// ============================================================================

/**
 * 🎓 User Type with Relations
 * This extends the Prisma User type to include related data
 */
export type User = {
  id: string
  name: string | null
  email: string
  emailVerified: Date | null
  image: string | null
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

/**
 * 🎓 Lab Type with Owner Information
 * Labs can have JSON location data (address, coordinates)
 */
export type Lab = {
  id: string
  ownerId: string
  name: string
  description: string | null
  location: LabLocation | null
  certifications: string[]
  createdAt: Date
  updatedAt: Date
  owner?: User
}

/**
 * 🎓 Location JSON Structure
 * Stored as JSON in database, typed here for TypeScript safety
 */
export type LabLocation = {
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  coordinates?: {
    lat: number
    lng: number
  }
}

/**
 * 🎓 Lab Service Type
 * Represents testing services offered by labs
 */
export type LabService = {
  id: string
  labId: string
  name: string
  description: string | null
  category: string
  pricePerUnit: number | null
  unitType: string
  turnaroundDays: number | null
  sampleRequirements: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
  lab?: Lab
}

/**
 * 🎓 Order Type with Full Relations
 * Core business object - represents a test request
 */
export type Order = {
  id: string
  clientId: string
  labId: string
  serviceId: string
  status: OrderStatus
  clientDetails: ClientDetails
  sampleDescription: string
  specialInstructions: string | null
  quotedPrice: number | null
  quotedAt: Date | null
  acknowledgedAt: Date | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
  client?: User
  lab?: Lab
  service?: LabService
  attachments?: Attachment[]
}

/**
 * 🎓 Client Details JSON Structure
 * Captured at order submission time (snapshot of client info)
 */
export type ClientDetails = {
  name: string
  email: string
  phone: string
  organization?: string
  address?: string
}

/**
 * 🎓 Attachment Type
 * Files associated with orders (specs, results, accreditation certificates)
 * Stage 1: Uses mock URLs
 */
export type Attachment = {
  id: string
  orderId: string
  uploadedById: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number | null
  attachmentType: AttachmentType
  createdAt: Date
  uploadedBy?: User
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * 🎓 Standard API Response Structure
 * All API routes return this format for consistency
 */
export type ApiResponse<T = any> = {
  data?: T
  error?: string
  message?: string
}

/**
 * 🎓 Paginated Response
 * For list endpoints that support pagination
 */
export type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

// ============================================================================
// FORM INPUT TYPES
// ============================================================================

/**
 * 🎓 Order Creation Input
 * What the client submits when creating an order
 */
export type CreateOrderInput = {
  serviceId: string
  sampleDescription: string
  specialInstructions?: string
  clientDetails: ClientDetails
}

/**
 * 🎓 Order Update Input (for lab admins)
 * Labs can update status and add internal notes
 */
export type UpdateOrderInput = {
  status?: OrderStatus
  quotedPrice?: number
  specialInstructions?: string
}

/**
 * 🎓 Service Filter Options
 * Used for filtering services on homepage
 */
export type ServiceFilterOptions = {
  category?: string
  labId?: string
  minPrice?: number
  maxPrice?: number
  active?: boolean
}

// ============================================================================
// DASHBOARD DATA TYPES
// ============================================================================

/**
 * 🎓 Dashboard Statistics
 * Summary data for admin dashboard
 */
export type DashboardStats = {
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  totalRevenue: number
  totalLabs: number
  totalClients: number
  recentOrders: Order[]
}

/**
 * 🎓 Lab Dashboard Data
 * What a lab admin sees on their dashboard
 */
export type LabDashboardData = {
  lab: Lab
  pendingOrders: Order[]
  inProgressOrders: Order[]
  completedOrders: Order[]
  stats: {
    totalOrders: number
    pendingCount: number
    completedCount: number
    revenue: number
  }
}

/**
 * 🎓 Client Dashboard Data
 * What a client sees on their dashboard
 */
export type ClientDashboardData = {
  orders: Order[]
  stats: {
    totalOrders: number
    pendingCount: number
    completedCount: number
    totalSpent: number
  }
}

// ============================================================================
// NEXTAUTH SESSION TYPES
// ============================================================================

/**
 * 🎓 Extended Session Type
 * NextAuth session with our custom user data
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: UserRole
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: UserRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    name?: string | null
    role: UserRole
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * 🎓 Order with Related Data
 * Common pattern: order with all relations included
 */
export type OrderWithRelations = Order & {
  client: User
  lab: Lab
  service: LabService
  attachments: Attachment[]
}

/**
 * 🎓 Service with Lab
 * Service listing with lab information
 */
export type ServiceWithLab = LabService & {
  lab: Lab
}

/**
 * 🎓 Order Status Colors
 * UI helper for badge styling
 */
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.QUOTE_REQUESTED]: 'bg-orange-100 text-orange-800',
  [OrderStatus.QUOTE_PROVIDED]: 'bg-cyan-100 text-cyan-800',
  [OrderStatus.QUOTE_REJECTED]: 'bg-gray-100 text-gray-800',
  [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [OrderStatus.ACKNOWLEDGED]: 'bg-blue-100 text-blue-800',
  [OrderStatus.IN_PROGRESS]: 'bg-purple-100 text-purple-800',
  [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800'
}

/**
 * 🎓 Role Display Names
 * Human-readable role names for UI
 */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [UserRole.CLIENT]: 'Client',
  [UserRole.LAB_ADMIN]: 'Lab Administrator',
  [UserRole.ADMIN]: 'Platform Administrator'
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const SERVICE_CATEGORIES = [
  'Microbiology',
  'Chemistry',
  'Environmental',
  'Food Safety',
  'Water Testing',
  'Soil Analysis',
  'Clinical',
  'Other'
] as const

export type ServiceCategory = typeof SERVICE_CATEGORIES[number]

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.ACKNOWLEDGED,
  OrderStatus.IN_PROGRESS,
  OrderStatus.COMPLETED
]

/**
 * 🎓 Mock File URL Generator
 * Stage 1: Generate mock URLs for file attachments
 * Stage 2: Replace with real S3/Supabase upload
 */
export const generateMockFileUrl = (orderId: string, fileName: string): string => {
  return `https://mock-storage.pipetgo.example.com/orders/${orderId}/${fileName}`
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

/**
 * 🎓 Analytics Data
 * Comprehensive analytics for lab administrators
 * Used by /api/analytics endpoint and Analytics Dashboard
 */
export interface AnalyticsData {
  revenue: {
    total: number
    monthlyBreakdown: {
      month: string // Format: "YYYY-MM" (e.g., "2024-11")
      revenue: number
      orderCount: number
    }[]
    growth: number // Percentage growth vs previous period
  }
  quotes: {
    totalQuotes: number // All quotes provided (orders with quotedPrice)
    acceptedQuotes: number // Quotes that led to orders
    acceptanceRate: number // Percentage (acceptedQuotes / totalQuotes)
    avgQuotePrice: number // Average price of accepted quotes
    pendingQuotes: number // Quotes awaiting client approval
  }
  orders: {
    totalOrders: number // All orders (any status)
    completedOrders: number // COMPLETED status only
    inProgressOrders: number // IN_PROGRESS status
    monthlyVolume: {
      month: string // Format: "YYYY-MM"
      orderCount: number
    }[]
  }
  topServices: {
    serviceId: string
    serviceName: string
    revenue: number // Total from completed orders
    orderCount: number
  }[] // Top 10 services by revenue
}

/**
 * 🎓 Analytics Timeframe Options
 * Supported timeframe filters for analytics endpoint
 */
export type AnalyticsTimeframe = 'last30days' | 'last90days' | 'thisYear' | 'allTime'
