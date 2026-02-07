import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest'
import { getServerSession } from 'next-auth'
import { GET } from '@/app/api/analytics/route'
import { createPrismaMock } from '@/lib/db-mock'
import { OrderStatus } from '@prisma/client'
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

describe('GET /api/analytics Benchmark', () => {
  let prisma: any

  beforeAll(async () => {
    // Get the mocked prisma instance
    const dbModule = await import('@/lib/db')
    prisma = dbModule.prisma
  })

  beforeEach(async () => {
    vi.clearAllMocks()
    // Clear data
    await prisma.order.deleteMany()
    await prisma.lab.deleteMany()
    await prisma.user.deleteMany()
    await prisma.labService.deleteMany()
  })

  it('should handle 5000 orders efficiently', async () => {
    // Setup User and Lab
    const user = await prisma.user.createMany({
      data: [{
        id: 'bench-user',
        email: 'bench@test.com',
        role: 'LAB_ADMIN'
      }]
    })

    const lab = await prisma.lab.create({
      data: {
        id: 'bench-lab',
        ownerId: 'bench-user',
        name: 'Benchmark Lab'
      }
    })

    // Setup Service
    await prisma.labService.createMany({
      data: [{
        id: 'bench-service',
        labId: 'bench-lab',
        name: 'Benchmark Service',
        category: 'Test',
        pricingMode: 'FIXED'
      }]
    })

    // Seed 5000 orders
    console.log('Seeding 5000 orders...')
    const orders = []
    const now = new Date()
    for (let i = 0; i < 5000; i++) {
      // Distribute dates over last 90 days
      const date = new Date(now.getTime() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000)

      orders.push({
        id: `order-${i}`,
        labId: 'bench-lab',
        clientId: 'client-1',
        serviceId: 'bench-service',
        status: i % 10 === 0 ? OrderStatus.PENDING : OrderStatus.COMPLETED,
        quotedPrice: new Decimal(Math.floor(Math.random() * 1000) + 100),
        createdAt: date,
        updatedAt: date,
        clientDetails: {},
        sampleDescription: 'Test sample',
        // Mock relation because DB mock doesn't handle 'include'
        service: {
          id: 'bench-service',
          name: 'Benchmark Service'
        }
      })
    }

    // Insert orders in batches (since mock doesn't support createMany for orders, we loop)
    // Actually, mock implementation for create is just Map.set, so it's fast.
    for (const order of orders) {
      await prisma.order.create({ data: order })
    }
    console.log('Seeding complete.')

    // Mock Session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'bench-user', role: 'LAB_ADMIN' }
    } as any)

    // Measure Performance
    const start = performance.now()
    const request = new Request('http://localhost:3000/api/analytics?timeframe=last90days')
    const response = await GET(request)
    const end = performance.now()

    const duration = end - start
    const data = await response.json()

    console.log(`Benchmark Duration: ${duration.toFixed(2)}ms`)
    console.log('Revenue:', data.revenue.total)
    console.log('Total Orders:', data.orders.totalOrders)

    expect(response.status).toBe(200)
    expect(data.orders.totalOrders).toBe(5000)

    // We don't assert specific duration limit here as it depends on environment,
    // but we output it for comparison.
  }, 30000) // Increase timeout for seeding
})
