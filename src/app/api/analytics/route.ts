/**
 * PipetGo - B2B Lab Testing Marketplace
 * Copyright (c) 2025 PIPETGO, Inc. All rights reserved.
 * 
 * This file and its contents are the proprietary intellectual property of PIPETGO, Inc.
 * Unauthorized use, reproduction, or distribution is strictly prohibited.
 */

/**
 * Analytics API Endpoint
 * ======================
 * Provides comprehensive analytics data for lab administrators.
 *
 * SECURITY:
 * - Authentication: Required (NextAuth session)
 * - Authorization: LAB_ADMIN role only
 * - Ownership: Only returns data for user's lab
 *
 * QUERY PARAMETERS:
 * - timeframe: 'last30days' | 'last90days' | 'thisYear' | 'allTime' (default: 'last30days')
 *
 * RESPONSE: AnalyticsData (see types/index.ts)
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { OrderStatus } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Order with service relationship for analytics
 */
interface OrderWithService {
  status: OrderStatus
  quotedPrice: Decimal | null
  createdAt: Date
  service: {
    id: string
    name: string
  }
}

/**
 * Basic order type for calculations
 */
interface BasicOrder {
  quotedPrice: Decimal | null
  status: OrderStatus
}

/**
 * Monthly data structure
 */
interface MonthlyDataEntry {
  revenue: number
  orderCount: number
}

export async function GET(req: Request) {
  try {
    // ========================================================================
    // 1. AUTHENTICATION & AUTHORIZATION
    // ========================================================================
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'LAB_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ========================================================================
    // 2. VERIFY LAB OWNERSHIP
    // ========================================================================
    const lab = await prisma.lab.findFirst({
      where: { ownerId: session.user.id }
    })

    if (!lab) {
      return NextResponse.json({ error: 'Lab not found' }, { status: 404 })
    }

    // ========================================================================
    // 3. PARSE QUERY PARAMETERS
    // ========================================================================
    const { searchParams } = new URL(req.url)
    const timeframe = searchParams.get('timeframe') || 'last30days'

    // ========================================================================
    // 4. CALCULATE DATE RANGE
    // ========================================================================
    const now = new Date()
    let startDate: Date
    let previousPeriodStart: Date
    let previousPeriodEnd: Date

    switch (timeframe) {
      case 'last30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        previousPeriodStart = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000)
        previousPeriodEnd = startDate
        break
      case 'last90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        previousPeriodStart = new Date(startDate.getTime() - 90 * 24 * 60 * 60 * 1000)
        previousPeriodEnd = startDate
        break
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1)
        previousPeriodStart = new Date(now.getFullYear() - 1, 0, 1)
        previousPeriodEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59)
        break
      case 'allTime':
        startDate = new Date(2020, 0, 1) // PipetGo launch date
        previousPeriodStart = startDate
        previousPeriodEnd = startDate
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        previousPeriodStart = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000)
        previousPeriodEnd = startDate
    }

    // ========================================================================
    // 5. FETCH ORDERS (CRITICAL: Ownership check via labId)
    // ========================================================================
    const orders = await prisma.order.findMany({
      where: {
        labId: lab.id, // CRITICAL: Only this lab's orders
        createdAt: { gte: startDate }
      },
      include: {
        service: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Fetch previous period orders for growth calculation
    const previousPeriodOrders = timeframe !== 'allTime'
      ? await prisma.order.findMany({
          where: {
            labId: lab.id,
            createdAt: {
              gte: previousPeriodStart,
              lt: previousPeriodEnd
            },
            status: OrderStatus.COMPLETED
          }
        })
      : []

    // ========================================================================
    // 6. CALCULATE REVENUE METRICS
    // ========================================================================
    const completedOrders = orders.filter((o: OrderWithService): o is OrderWithService =>
      o.status === OrderStatus.COMPLETED
    )
    const totalRevenue = completedOrders.reduce((sum: number, o: OrderWithService): number => {
      return sum + (o.quotedPrice ? Number(o.quotedPrice) : 0)
    }, 0)

    // Monthly revenue breakdown (last 12 months)
    const monthlyRevenue = calculateMonthlyBreakdown(completedOrders, 12)

    // Growth calculation (compare to previous period)
    const previousRevenue = previousPeriodOrders.reduce((sum: number, o: BasicOrder): number => {
      return sum + (o.quotedPrice ? Number(o.quotedPrice) : 0)
    }, 0)

    const revenueGrowth = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : totalRevenue > 0 ? 100 : 0

    // ========================================================================
    // 7. CALCULATE QUOTE STATISTICS
    // ========================================================================
    // Orders with quotes are those that have quotedPrice set
    const ordersWithQuotes = orders.filter(o => o.quotedPrice !== null)

    // Accepted quotes are those that moved beyond QUOTE_PROVIDED status
    const acceptedQuotes = ordersWithQuotes.filter(o =>
      o.status === OrderStatus.PENDING ||
      o.status === OrderStatus.ACKNOWLEDGED ||
      o.status === OrderStatus.IN_PROGRESS ||
      o.status === OrderStatus.COMPLETED
    )

    // Pending quotes are those in QUOTE_PROVIDED status (awaiting client approval)
    const pendingQuotes = orders.filter(o => o.status === OrderStatus.QUOTE_PROVIDED)

    // Average quote price (only accepted quotes)
    const avgQuotePrice = acceptedQuotes.length > 0
      ? acceptedQuotes.reduce((sum: number, o: OrderWithService): number =>
          sum + Number(o.quotedPrice!),
        0) / acceptedQuotes.length
      : 0

    const acceptanceRate = ordersWithQuotes.length > 0
      ? (acceptedQuotes.length / ordersWithQuotes.length) * 100
      : 0

    // ========================================================================
    // 8. CALCULATE ORDER VOLUME
    // ========================================================================
    const inProgressOrders = orders.filter(o => o.status === OrderStatus.IN_PROGRESS)
    const monthlyVolume = calculateMonthlyVolume(orders, 12)

    // ========================================================================
    // 9. CALCULATE TOP SERVICES (by revenue)
    // ========================================================================
    const serviceRevenue = new Map<string, { name: string; revenue: number; count: number }>()

    completedOrders.forEach((order: OrderWithService): void => {
      const serviceId = order.service.id
      const serviceName = order.service.name
      const revenue = order.quotedPrice ? Number(order.quotedPrice) : 0

      if (serviceRevenue.has(serviceId)) {
        const current = serviceRevenue.get(serviceId)!
        serviceRevenue.set(serviceId, {
          name: serviceName,
          revenue: current.revenue + revenue,
          count: current.count + 1
        })
      } else {
        serviceRevenue.set(serviceId, {
          name: serviceName,
          revenue,
          count: 1
        })
      }
    })

    const topServices = Array.from(serviceRevenue.entries())
      .map(([serviceId, data]) => ({
        serviceId,
        serviceName: data.name,
        revenue: data.revenue,
        orderCount: data.count
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10) // Top 10 services

    // ========================================================================
    // 10. RETURN ANALYTICS DATA
    // ========================================================================
    return NextResponse.json({
      revenue: {
        total: totalRevenue,
        monthlyBreakdown: monthlyRevenue,
        growth: revenueGrowth
      },
      quotes: {
        totalQuotes: ordersWithQuotes.length,
        acceptedQuotes: acceptedQuotes.length,
        acceptanceRate,
        avgQuotePrice,
        pendingQuotes: pendingQuotes.length
      },
      orders: {
        totalOrders: orders.length,
        completedOrders: completedOrders.length,
        inProgressOrders: inProgressOrders.length,
        monthlyVolume
      },
      topServices
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Order type for analytics calculations
 */
interface AnalyticsOrder {
  createdAt: Date
  quotedPrice: Decimal | null
}

/**
 * Calculate monthly breakdown of revenue and order count
 * Returns last N months of data with zero-filled gaps
 */
function calculateMonthlyBreakdown(
  orders: AnalyticsOrder[],
  months: number
): Array<{ month: string; revenue: number; orderCount: number }> {
  const monthlyData: { [key: string]: MonthlyDataEntry } = {}

  // Initialize last N months with zero values
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthlyData[monthKey] = { revenue: 0, orderCount: 0 }
  }

  // Aggregate orders by month
  orders.forEach((order: AnalyticsOrder): void => {
    const orderDate = new Date(order.createdAt)
    const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`

    if (monthlyData[monthKey]) {
      monthlyData[monthKey].revenue += order.quotedPrice ? Number(order.quotedPrice) : 0
      monthlyData[monthKey].orderCount += 1
    }
  })

  // Convert to array format and sort by month
  return Object.entries(monthlyData)
    .map(([month, data]: [string, MonthlyDataEntry]) => ({
      month,
      revenue: data.revenue,
      orderCount: data.orderCount
    }))
    .sort((a: { month: string }, b: { month: string }): number =>
      a.month.localeCompare(b.month)
    )
}

/**
 * Calculate monthly volume (order count per month)
 * Returns last N months with zero-filled gaps
 */
function calculateMonthlyVolume(
  orders: AnalyticsOrder[],
  months: number
): Array<{ month: string; orderCount: number }> {
  const monthlyData: { [key: string]: number } = {}

  // Initialize last N months
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthlyData[monthKey] = 0
  }

  // Count orders by month
  orders.forEach((order: AnalyticsOrder): void => {
    const orderDate = new Date(order.createdAt)
    const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`

    if (monthlyData[monthKey]) {
      monthlyData[monthKey] += 1
    }
  })

  // Convert to array format and sort
  return Object.entries(monthlyData)
    .map(([month, orderCount]: [string, number]) => ({
      month,
      orderCount
    }))
    .sort((a: { month: string }, b: { month: string }): number =>
      a.month.localeCompare(b.month)
    )
}
