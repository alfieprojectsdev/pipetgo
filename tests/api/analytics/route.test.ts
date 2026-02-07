import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest'
import { getServerSession } from 'next-auth'
import { GET } from '@/app/api/analytics/route'
import { OrderStatus } from '@prisma/client'
import { createPrismaMock } from '@/lib/db-mock'
import { Decimal } from '@prisma/client/runtime/library'

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}))

// Mock Prisma with our in-memory implementation
vi.mock('@/lib/db', async () => {
  const { createPrismaMock } = await import('@/lib/db-mock')
  const mock = await createPrismaMock()
  return { prisma: mock }
})

describe('GET /api/analytics', () => {
  let prisma: any

  beforeAll(async () => {
    const dbModule = await import('@/lib/db')
    prisma = dbModule.prisma
  })

  beforeEach(async () => {
    vi.clearAllMocks()
    await prisma.order.deleteMany()
    await prisma.lab.deleteMany()
    await prisma.user.deleteMany()
    await prisma.labService.deleteMany()
  })

  // Helper to setup basic lab and admin
  async function setupLabAndAdmin() {
    await prisma.user.createMany({
      data: [{
        id: 'user-1',
        email: 'admin@lab.com',
        role: 'LAB_ADMIN'
      }]
    })

    await prisma.lab.create({
      data: {
        id: 'lab-1',
        ownerId: 'user-1',
        name: 'Test Lab'
      }
    })

    return {
      user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' },
      labId: 'lab-1'
    }
  }

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
      await prisma.user.createMany({
        data: [{ id: 'user-no-lab', role: 'LAB_ADMIN', email: 'nolab@test.com' }]
      })

      const labAdminSession = {
        user: { id: 'user-no-lab', role: 'LAB_ADMIN', email: 'nolab@test.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      // No lab created for this user

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
      const { user, labId } = await setupLabAndAdmin()
      vi.mocked(getServerSession).mockResolvedValue({ user } as any)

      // Service setup
      await prisma.labService.createMany({
        data: [
          { id: 'svc-1', name: 'Water Testing', labId },
          { id: 'svc-2', name: 'Soil Testing', labId }
        ]
      })

      // Create orders
      await prisma.order.create({ data: {
        id: 'order-1', labId, serviceId: 'svc-1',
        status: OrderStatus.COMPLETED,
        quotedPrice: 5000,
        createdAt: new Date('2024-11-01')
      }})
      await prisma.order.create({ data: {
        id: 'order-2', labId, serviceId: 'svc-1',
        status: OrderStatus.COMPLETED,
        quotedPrice: 3000,
        createdAt: new Date('2024-11-15')
      }})
      await prisma.order.create({ data: {
        id: 'order-3', labId, serviceId: 'svc-2',
        status: OrderStatus.IN_PROGRESS,
        quotedPrice: 2000, // Should NOT count
        createdAt: new Date('2024-11-20')
      }})

      // Mock date to be after these orders
      const now = new Date('2024-12-01')
      vi.useFakeTimers()
      vi.setSystemTime(now)

      const request = new Request('http://localhost:3000/api/analytics?timeframe=last30days')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.revenue.total).toBe(8000)
      expect(data.revenue.monthlyBreakdown).toHaveLength(12)

      vi.useRealTimers()
    })

    it('should calculate growth percentage correctly', async () => {
      const { user, labId } = await setupLabAndAdmin()
      vi.mocked(getServerSession).mockResolvedValue({ user } as any)

      await prisma.labService.createMany({ data: [{ id: 'svc-1', name: 'Test', labId }] })

      const now = new Date()

      // Current period order (last 30 days)
      await prisma.order.create({ data: {
        id: 'order-1', labId, serviceId: 'svc-1',
        status: OrderStatus.COMPLETED,
        quotedPrice: 10000,
        createdAt: now
      }})

      // Previous period order (60 days ago)
      await prisma.order.create({ data: {
        id: 'order-prev', labId, serviceId: 'svc-1',
        status: OrderStatus.COMPLETED,
        quotedPrice: 5000,
        createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
      }})

      const request = new Request('http://localhost:3000/api/analytics?timeframe=last30days')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.revenue.total).toBe(10000)
      expect(data.revenue.growth).toBe(100) // 100% growth
    })
  })

  // ============================================================================
  // QUOTE METRICS TESTS
  // ============================================================================
  describe('Quote Statistics', () => {
    it('should calculate acceptance rate correctly', async () => {
      const { user, labId } = await setupLabAndAdmin()
      vi.mocked(getServerSession).mockResolvedValue({ user } as any)

      await prisma.labService.createMany({ data: [{ id: 'svc-1', name: 'Test', labId }] })

      // 10 total quotes: 8 accepted (completed/in_progress), 2 pending
      // Accepted: 6 completed, 2 in_progress
      for(let i=0; i<6; i++) {
        await prisma.order.create({ data: { id: `c-${i}`, labId, serviceId: 'svc-1', status: OrderStatus.COMPLETED, quotedPrice: 5000 } })
      }
      for(let i=0; i<2; i++) {
        await prisma.order.create({ data: { id: `ip-${i}`, labId, serviceId: 'svc-1', status: OrderStatus.IN_PROGRESS, quotedPrice: 4000 } })
      }
      // Pending (QUOTE_PROVIDED)
      for(let i=0; i<2; i++) {
        await prisma.order.create({ data: { id: `p-${i}`, labId, serviceId: 'svc-1', status: OrderStatus.QUOTE_PROVIDED, quotedPrice: 3000 } })
      }

      const request = new Request('http://localhost:3000/api/analytics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.quotes.totalQuotes).toBe(10)
      expect(data.quotes.acceptedQuotes).toBe(8)
      expect(data.quotes.acceptanceRate).toBe(80)
      expect(data.quotes.pendingQuotes).toBe(2)
    })

    it('should calculate average quote price correctly', async () => {
      const { user, labId } = await setupLabAndAdmin()
      vi.mocked(getServerSession).mockResolvedValue({ user } as any)

      await prisma.labService.createMany({ data: [{ id: 'svc-1', name: 'Test', labId }] })

      // 4 accepted quotes: 5000, 3000, 4000, 6000
      await prisma.order.create({ data: { id: '1', labId, serviceId: 'svc-1', status: OrderStatus.COMPLETED, quotedPrice: 5000 } })
      await prisma.order.create({ data: { id: '2', labId, serviceId: 'svc-1', status: OrderStatus.COMPLETED, quotedPrice: 3000 } })
      await prisma.order.create({ data: { id: '3', labId, serviceId: 'svc-1', status: OrderStatus.IN_PROGRESS, quotedPrice: 4000 } })
      await prisma.order.create({ data: { id: '4', labId, serviceId: 'svc-1', status: OrderStatus.ACKNOWLEDGED, quotedPrice: 6000 } })

      const request = new Request('http://localhost:3000/api/analytics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.quotes.avgQuotePrice).toBe(4500)
    })
  })

  // ============================================================================
  // ORDER VOLUME TESTS
  // ============================================================================
  describe('Order Volume Metrics', () => {
    it('should correctly count total, completed, and in-progress orders', async () => {
      const { user, labId } = await setupLabAndAdmin()
      vi.mocked(getServerSession).mockResolvedValue({ user } as any)

      await prisma.labService.createMany({ data: [{ id: 'svc-1', name: 'Test', labId }] })

      // 6 completed
      for(let i=0; i<6; i++) await prisma.order.create({ data: { id: `c-${i}`, labId, serviceId: 'svc-1', status: OrderStatus.COMPLETED, quotedPrice: 1000 } })
      // 3 in_progress
      for(let i=0; i<3; i++) await prisma.order.create({ data: { id: `ip-${i}`, labId, serviceId: 'svc-1', status: OrderStatus.IN_PROGRESS, quotedPrice: 1000 } })
      // 1 pending
      await prisma.order.create({ data: { id: 'p-1', labId, serviceId: 'svc-1', status: OrderStatus.PENDING, quotedPrice: 1000 } })

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
      const { user, labId } = await setupLabAndAdmin()
      vi.mocked(getServerSession).mockResolvedValue({ user } as any)

      await prisma.labService.createMany({
        data: [
          { id: 'svc-a', name: 'Service A', labId },
          { id: 'svc-b', name: 'Service B', labId },
          { id: 'svc-c', name: 'Service C', labId }
        ]
      })

      // Service A: 10,000
      await prisma.order.create({ data: { id: 'a1', labId, serviceId: 'svc-a', status: OrderStatus.COMPLETED, quotedPrice: 6000 } })
      await prisma.order.create({ data: { id: 'a2', labId, serviceId: 'svc-a', status: OrderStatus.COMPLETED, quotedPrice: 4000 } })

      // Service B: 15,000 (Highest)
      await prisma.order.create({ data: { id: 'b1', labId, serviceId: 'svc-b', status: OrderStatus.COMPLETED, quotedPrice: 5000 } })
      await prisma.order.create({ data: { id: 'b2', labId, serviceId: 'svc-b', status: OrderStatus.COMPLETED, quotedPrice: 5000 } })
      await prisma.order.create({ data: { id: 'b3', labId, serviceId: 'svc-b', status: OrderStatus.COMPLETED, quotedPrice: 5000 } })

      // Service C: 3,000 (Lowest)
      await prisma.order.create({ data: { id: 'c1', labId, serviceId: 'svc-c', status: OrderStatus.COMPLETED, quotedPrice: 3000 } })

      const request = new Request('http://localhost:3000/api/analytics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.topServices).toHaveLength(3)

      expect(data.topServices[0].serviceName).toBe('Service B')
      expect(data.topServices[0].revenue).toBe(15000)
      expect(data.topServices[1].serviceName).toBe('Service A')
      expect(data.topServices[1].revenue).toBe(10000)
      expect(data.topServices[2].serviceName).toBe('Service C')
      expect(data.topServices[2].revenue).toBe(3000)
    })
  })
})
