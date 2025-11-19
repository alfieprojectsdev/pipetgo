import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { GET } from '@/app/api/analytics/route'
import { OrderStatus } from '@prisma/client'

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}))

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    order: {
      findMany: vi.fn()
    },
    lab: {
      findFirst: vi.fn()
    }
  }
}))

/**
 * GET /api/analytics - Analytics Endpoint Tests
 *
 * Tests comprehensive analytics calculations:
 * - Revenue metrics (total, monthly breakdown, growth)
 * - Quote statistics (acceptance rate, average price, pending)
 * - Order volume (monthly aggregation, status breakdown)
 * - Top services (sorted by revenue)
 * - Timeframe filtering (last30days, last90days, thisYear, allTime)
 *
 * Security tests:
 * - Authentication verification
 * - Role-based access control (LAB_ADMIN only)
 * - Lab ownership verification
 */
describe('GET /api/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // AUTHORIZATION TESTS
  // ============================================================================
  describe('Authorization Checks', () => {
    it('should return 401 for unauthenticated users', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/analytics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 for CLIENT role', async () => {
      const clientSession = {
        user: { id: 'client-1', role: 'CLIENT', email: 'client@test.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(clientSession as any)

      const request = new Request('http://localhost:3000/api/analytics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })

    it('should return 404 when LAB_ADMIN has no lab', async () => {
      const labAdminSession = {
        user: { id: 'user-no-lab', role: 'LAB_ADMIN', email: 'nolab@test.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(null) // No lab found

      const request = new Request('http://localhost:3000/api/analytics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Lab not found')
    })
  })

  // ============================================================================
  // REVENUE CALCULATION TESTS
  // ============================================================================
  describe('Revenue Calculations', () => {
    it('should calculate total revenue correctly from completed orders', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1',
        name: 'Test Lab'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)

      // Mock completed orders with revenue
      vi.mocked(prisma.order.findMany).mockResolvedValue([
        {
          id: 'order-1',
          status: OrderStatus.COMPLETED,
          quotedPrice: 5000,
          createdAt: new Date('2024-11-01'),
          service: { id: 'svc-1', name: 'Water Testing' }
        },
        {
          id: 'order-2',
          status: OrderStatus.COMPLETED,
          quotedPrice: 3000,
          createdAt: new Date('2024-11-15'),
          service: { id: 'svc-1', name: 'Water Testing' }
        },
        {
          id: 'order-3',
          status: OrderStatus.IN_PROGRESS,
          quotedPrice: 2000, // Should NOT count (not completed)
          createdAt: new Date('2024-11-20'),
          service: { id: 'svc-2', name: 'Soil Testing' }
        }
      ] as any)

      const request = new Request('http://localhost:3000/api/analytics?timeframe=last30days')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.revenue.total).toBe(8000) // Only completed orders
      expect(data.revenue.monthlyBreakdown).toHaveLength(12)
    })

    it('should handle monthly breakdown with zero-filled gaps', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)

      // Single order in current month
      const currentDate = new Date()
      vi.mocked(prisma.order.findMany).mockResolvedValue([
        {
          id: 'order-1',
          status: OrderStatus.COMPLETED,
          quotedPrice: 5000,
          createdAt: currentDate,
          service: { id: 'svc-1', name: 'Test' }
        }
      ] as any)

      const request = new Request('http://localhost:3000/api/analytics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.revenue.monthlyBreakdown).toHaveLength(12) // Always 12 months

      // Should have 11 months with zero revenue, 1 month with 5000
      const monthsWithRevenue = data.revenue.monthlyBreakdown.filter((m: any) => m.revenue > 0)
      const monthsWithZero = data.revenue.monthlyBreakdown.filter((m: any) => m.revenue === 0)

      expect(monthsWithRevenue.length).toBe(1)
      expect(monthsWithZero.length).toBe(11)
      expect(monthsWithRevenue[0].revenue).toBe(5000)
    })

    it('should calculate growth percentage correctly', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)

      // Current period: 10,000 revenue
      // Previous period: 5,000 revenue
      // Expected growth: 100% increase
      vi.mocked(prisma.order.findMany)
        .mockResolvedValueOnce([
          {
            id: 'order-1',
            status: OrderStatus.COMPLETED,
            quotedPrice: 10000,
            createdAt: new Date(),
            service: { id: 'svc-1', name: 'Test' }
          }
        ] as any)
        .mockResolvedValueOnce([
          {
            id: 'order-prev',
            status: OrderStatus.COMPLETED,
            quotedPrice: 5000,
            createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
            service: { id: 'svc-1', name: 'Test' }
          }
        ] as any)

      const request = new Request('http://localhost:3000/api/analytics?timeframe=last30days')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.revenue.total).toBe(10000)
      expect(data.revenue.growth).toBe(100) // 100% growth
    })

    it('should handle empty data without crashing', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)
      vi.mocked(prisma.order.findMany).mockResolvedValue([]) // No orders

      const request = new Request('http://localhost:3000/api/analytics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.revenue.total).toBe(0)
      expect(data.revenue.growth).toBe(0)
      expect(data.revenue.monthlyBreakdown).toHaveLength(12)
      expect(data.quotes.totalQuotes).toBe(0)
      expect(data.quotes.acceptanceRate).toBe(0)
      expect(data.orders.totalOrders).toBe(0)
      expect(data.topServices).toHaveLength(0)
    })
  })

  // ============================================================================
  // QUOTE METRICS TESTS
  // ============================================================================
  describe('Quote Statistics', () => {
    it('should calculate acceptance rate correctly', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)

      // 10 total quotes: 8 accepted (completed/in_progress), 2 pending
      const orders = [
        // 8 accepted quotes (various accepted statuses)
        ...Array(6).fill(null).map((_, i) => ({
          id: `completed-${i}`,
          status: OrderStatus.COMPLETED,
          quotedPrice: 5000,
          createdAt: new Date('2024-11-01'),
          service: { id: 'svc-1', name: 'Test' }
        })),
        ...Array(2).fill(null).map((_, i) => ({
          id: `in-progress-${i}`,
          status: OrderStatus.IN_PROGRESS,
          quotedPrice: 4000,
          createdAt: new Date('2024-11-05'),
          service: { id: 'svc-1', name: 'Test' }
        })),
        // 2 quotes in QUOTE_PROVIDED status (pending approval)
        ...Array(2).fill(null).map((_, i) => ({
          id: `pending-${i}`,
          status: OrderStatus.QUOTE_PROVIDED,
          quotedPrice: 3000,
          createdAt: new Date('2024-11-10'),
          service: { id: 'svc-1', name: 'Test' }
        }))
      ]

      vi.mocked(prisma.order.findMany).mockResolvedValue(orders as any)

      const request = new Request('http://localhost:3000/api/analytics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.quotes.totalQuotes).toBe(10) // All orders with quotedPrice
      expect(data.quotes.acceptedQuotes).toBe(8) // Completed + in_progress
      expect(data.quotes.acceptanceRate).toBe(80) // 8/10 * 100
      expect(data.quotes.pendingQuotes).toBe(2) // QUOTE_PROVIDED status
    })

    it('should calculate average quote price correctly', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)

      // 4 accepted quotes: 5000, 3000, 4000, 6000
      // Average: (5000 + 3000 + 4000 + 6000) / 4 = 4500
      vi.mocked(prisma.order.findMany).mockResolvedValue([
        {
          id: 'order-1',
          status: OrderStatus.COMPLETED,
          quotedPrice: 5000,
          createdAt: new Date(),
          service: { id: 'svc-1', name: 'Test' }
        },
        {
          id: 'order-2',
          status: OrderStatus.COMPLETED,
          quotedPrice: 3000,
          createdAt: new Date(),
          service: { id: 'svc-1', name: 'Test' }
        },
        {
          id: 'order-3',
          status: OrderStatus.IN_PROGRESS,
          quotedPrice: 4000,
          createdAt: new Date(),
          service: { id: 'svc-1', name: 'Test' }
        },
        {
          id: 'order-4',
          status: OrderStatus.ACKNOWLEDGED,
          quotedPrice: 6000,
          createdAt: new Date(),
          service: { id: 'svc-1', name: 'Test' }
        }
      ] as any)

      const request = new Request('http://localhost:3000/api/analytics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.quotes.avgQuotePrice).toBe(4500)
    })

    it('should handle null quotedPrice gracefully', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)

      // Mix of orders: some with quotes, some without
      vi.mocked(prisma.order.findMany).mockResolvedValue([
        {
          id: 'order-1',
          status: OrderStatus.QUOTE_REQUESTED,
          quotedPrice: null, // No quote yet
          createdAt: new Date(),
          service: { id: 'svc-1', name: 'Test' }
        },
        {
          id: 'order-2',
          status: OrderStatus.COMPLETED,
          quotedPrice: 5000,
          createdAt: new Date(),
          service: { id: 'svc-1', name: 'Test' }
        }
      ] as any)

      const request = new Request('http://localhost:3000/api/analytics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.quotes.totalQuotes).toBe(1) // Only orders with quotedPrice
      expect(data.revenue.total).toBe(5000) // Only completed with price
    })
  })

  // ============================================================================
  // ORDER VOLUME TESTS
  // ============================================================================
  describe('Order Volume Metrics', () => {
    it('should return monthly volume with correct structure', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)
      vi.mocked(prisma.order.findMany).mockResolvedValue([
        {
          id: 'order-1',
          status: OrderStatus.COMPLETED,
          quotedPrice: 1000,
          createdAt: new Date(),
          service: { id: 'svc-1', name: 'Test' }
        }
      ] as any)

      const request = new Request('http://localhost:3000/api/analytics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Verify structure of monthly volume array
      expect(data.orders.monthlyVolume).toHaveLength(12)
      expect(data.orders.monthlyVolume[0]).toHaveProperty('month')
      expect(data.orders.monthlyVolume[0]).toHaveProperty('orderCount')

      // Verify month format (YYYY-MM)
      expect(data.orders.monthlyVolume[0].month).toMatch(/^\d{4}-\d{2}$/)

      // Verify orderCount is a number
      expect(typeof data.orders.monthlyVolume[0].orderCount).toBe('number')
    })

    it('should correctly count total, completed, and in-progress orders', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)

      // 10 total: 6 completed, 3 in_progress, 1 pending
      vi.mocked(prisma.order.findMany).mockResolvedValue([
        ...Array(6).fill(null).map((_, i) => ({
          id: `completed-${i}`,
          status: OrderStatus.COMPLETED,
          quotedPrice: 1000,
          createdAt: new Date(),
          service: { id: 'svc-1', name: 'Test' }
        })),
        ...Array(3).fill(null).map((_, i) => ({
          id: `in-progress-${i}`,
          status: OrderStatus.IN_PROGRESS,
          quotedPrice: 1000,
          createdAt: new Date(),
          service: { id: 'svc-1', name: 'Test' }
        })),
        {
          id: 'pending-1',
          status: OrderStatus.PENDING,
          quotedPrice: 1000,
          createdAt: new Date(),
          service: { id: 'svc-1', name: 'Test' }
        }
      ] as any)

      const request = new Request('http://localhost:3000/api/analytics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.orders.totalOrders).toBe(10)
      expect(data.orders.completedOrders).toBe(6)
      expect(data.orders.inProgressOrders).toBe(3)
    })
  })

  // ============================================================================
  // TOP SERVICES TESTS
  // ============================================================================
  describe('Top Services Rankings', () => {
    it('should sort services by revenue descending', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)

      // 3 services with different revenues
      vi.mocked(prisma.order.findMany).mockResolvedValue([
        // Service A: 10,000 total (2 orders)
        {
          id: 'order-1',
          status: OrderStatus.COMPLETED,
          quotedPrice: 6000,
          createdAt: new Date(),
          service: { id: 'svc-a', name: 'Service A' }
        },
        {
          id: 'order-2',
          status: OrderStatus.COMPLETED,
          quotedPrice: 4000,
          createdAt: new Date(),
          service: { id: 'svc-a', name: 'Service A' }
        },
        // Service B: 15,000 total (3 orders) - HIGHEST
        {
          id: 'order-3',
          status: OrderStatus.COMPLETED,
          quotedPrice: 5000,
          createdAt: new Date(),
          service: { id: 'svc-b', name: 'Service B' }
        },
        {
          id: 'order-4',
          status: OrderStatus.COMPLETED,
          quotedPrice: 5000,
          createdAt: new Date(),
          service: { id: 'svc-b', name: 'Service B' }
        },
        {
          id: 'order-5',
          status: OrderStatus.COMPLETED,
          quotedPrice: 5000,
          createdAt: new Date(),
          service: { id: 'svc-b', name: 'Service B' }
        },
        // Service C: 3,000 total (1 order) - LOWEST
        {
          id: 'order-6',
          status: OrderStatus.COMPLETED,
          quotedPrice: 3000,
          createdAt: new Date(),
          service: { id: 'svc-c', name: 'Service C' }
        }
      ] as any)

      const request = new Request('http://localhost:3000/api/analytics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.topServices).toHaveLength(3)

      // Should be sorted: B (15000), A (10000), C (3000)
      expect(data.topServices[0].serviceName).toBe('Service B')
      expect(data.topServices[0].revenue).toBe(15000)
      expect(data.topServices[0].orderCount).toBe(3)

      expect(data.topServices[1].serviceName).toBe('Service A')
      expect(data.topServices[1].revenue).toBe(10000)
      expect(data.topServices[1].orderCount).toBe(2)

      expect(data.topServices[2].serviceName).toBe('Service C')
      expect(data.topServices[2].revenue).toBe(3000)
      expect(data.topServices[2].orderCount).toBe(1)
    })

    it('should aggregate revenue per service correctly', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)

      // Single service with multiple orders
      vi.mocked(prisma.order.findMany).mockResolvedValue([
        {
          id: 'order-1',
          status: OrderStatus.COMPLETED,
          quotedPrice: 2000,
          createdAt: new Date(),
          service: { id: 'svc-1', name: 'Water Testing' }
        },
        {
          id: 'order-2',
          status: OrderStatus.COMPLETED,
          quotedPrice: 3000,
          createdAt: new Date(),
          service: { id: 'svc-1', name: 'Water Testing' }
        },
        {
          id: 'order-3',
          status: OrderStatus.COMPLETED,
          quotedPrice: 5000,
          createdAt: new Date(),
          service: { id: 'svc-1', name: 'Water Testing' }
        }
      ] as any)

      const request = new Request('http://localhost:3000/api/analytics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.topServices).toHaveLength(1)
      expect(data.topServices[0].revenue).toBe(10000) // 2000 + 3000 + 5000
      expect(data.topServices[0].orderCount).toBe(3)
    })

    it('should limit to top 10 services', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)

      // 15 services (should only return top 10)
      const orders = Array(15).fill(null).map((_, i) => ({
        id: `order-${i}`,
        status: OrderStatus.COMPLETED,
        quotedPrice: (15 - i) * 1000, // Descending revenues
        createdAt: new Date(),
        service: { id: `svc-${i}`, name: `Service ${i}` }
      }))

      vi.mocked(prisma.order.findMany).mockResolvedValue(orders as any)

      const request = new Request('http://localhost:3000/api/analytics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.topServices).toHaveLength(10) // Limited to top 10
      expect(data.topServices[0].revenue).toBeGreaterThan(data.topServices[9].revenue)
    })
  })

  // ============================================================================
  // TIMEFRAME FILTER TESTS
  // ============================================================================
  describe('Timeframe Filtering', () => {
    it('should filter by last30days timeframe', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)
      vi.mocked(prisma.order.findMany).mockResolvedValue([])

      const request = new Request('http://localhost:3000/api/analytics?timeframe=last30days')
      const response = await GET(request)

      expect(response.status).toBe(200)

      // Verify prisma.order.findMany was called with date filter
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            labId: 'lab-1',
            createdAt: expect.objectContaining({
              gte: expect.any(Date)
            })
          })
        })
      )
    })

    it('should filter by last90days timeframe', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)
      vi.mocked(prisma.order.findMany).mockResolvedValue([])

      const request = new Request('http://localhost:3000/api/analytics?timeframe=last90days')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(prisma.order.findMany).toHaveBeenCalled()
    })

    it('should filter by thisYear timeframe', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)
      vi.mocked(prisma.order.findMany).mockResolvedValue([])

      const request = new Request('http://localhost:3000/api/analytics?timeframe=thisYear')
      const response = await GET(request)

      expect(response.status).toBe(200)

      // Verify start date is January 1st of current year
      const calls = vi.mocked(prisma.order.findMany).mock.calls
      const firstCallArgs = calls[0][0]
      const startDate = firstCallArgs?.where?.createdAt?.gte as Date

      expect(startDate.getMonth()).toBe(0) // January
      expect(startDate.getDate()).toBe(1) // 1st
    })

    it('should filter by allTime timeframe', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)
      vi.mocked(prisma.order.findMany).mockResolvedValue([])

      const request = new Request('http://localhost:3000/api/analytics?timeframe=allTime')
      const response = await GET(request)

      expect(response.status).toBe(200)

      // Verify start date is 2020 (PipetGo launch)
      const calls = vi.mocked(prisma.order.findMany).mock.calls
      const firstCallArgs = calls[0][0]
      const startDate = firstCallArgs?.where?.createdAt?.gte as Date

      expect(startDate.getFullYear()).toBe(2020)
    })
  })

  // ============================================================================
  // SECURITY & EDGE CASES
  // ============================================================================
  describe('Security & Ownership Verification', () => {
    it('should only return data for user\'s lab (ownership check)', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)
      vi.mocked(prisma.order.findMany).mockResolvedValue([])

      const request = new Request('http://localhost:3000/api/analytics')
      await GET(request)

      // Verify lab ownership check
      expect(prisma.lab.findFirst).toHaveBeenCalledWith({
        where: { ownerId: 'user-1' }
      })

      // Verify orders filtered by labId
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            labId: 'lab-1' // CRITICAL: Only this lab's orders
          })
        })
      )
    })

    it('should handle Prisma errors gracefully', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockRejectedValue(new Error('Database connection failed'))

      const request = new Request('http://localhost:3000/api/analytics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})
