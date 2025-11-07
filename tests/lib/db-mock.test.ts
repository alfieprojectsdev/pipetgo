import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createPrismaMock, seedMockDatabase, resetMockDatabase } from '@/lib/db-mock'
import { PrismaClient } from '@prisma/client'

describe('db-mock', () => {
  let prisma: PrismaClient

  beforeAll(async () => {
    // Initialize mock database
    prisma = await createPrismaMock()
    await seedMockDatabase(prisma)
  })

  afterAll(async () => {
    // Clean up
    await resetMockDatabase()
  })

  it('should initialize SQLite database with Prisma schema', async () => {
    expect(prisma).toBeDefined()
    expect(prisma.$connect).toBeDefined()
  })

  it('should have seeded test users', async () => {
    const users = await prisma.user.findMany()

    expect(users).toHaveLength(3)

    const roles = users.map((u) => u.role)
    expect(roles).toContain('CLIENT')
    expect(roles).toContain('LAB_ADMIN')
    expect(roles).toContain('ADMIN')
  })

  it('should have seeded test lab', async () => {
    const labs = await prisma.lab.findMany()

    expect(labs).toHaveLength(1)
    expect(labs[0].name).toBe('Test Lab')
    expect(labs[0].ownerId).toBe('user-lab-admin-1')
  })

  it('should have seeded services with different pricing modes', async () => {
    const services = await prisma.labService.findMany()

    expect(services).toHaveLength(3)

    const pricingModes = services.map((s) => s.pricingMode)
    expect(pricingModes).toContain('QUOTE_REQUIRED')
    expect(pricingModes).toContain('FIXED')
    expect(pricingModes).toContain('HYBRID')

    // Verify QUOTE_REQUIRED service has no pricePerUnit
    const quoteService = services.find((s) => s.pricingMode === 'QUOTE_REQUIRED')
    expect(quoteService?.pricePerUnit).toBeNull()

    // Verify FIXED service has pricePerUnit
    const fixedService = services.find((s) => s.pricingMode === 'FIXED')
    expect(fixedService?.pricePerUnit).toBeDefined()
    expect(fixedService?.pricePerUnit?.toNumber()).toBe(500)
  })

  it('should support creating orders with QUOTE_REQUESTED status', async () => {
    const client = await prisma.user.findUnique({
      where: { email: 'client@test.com' },
    })

    const service = await prisma.labService.findFirst({
      where: { pricingMode: 'QUOTE_REQUIRED' },
    })

    expect(client).toBeDefined()
    expect(service).toBeDefined()

    const order = await prisma.order.create({
      data: {
        clientId: client!.id,
        labId: service!.labId,
        serviceId: service!.id,
        status: 'QUOTE_REQUESTED',
        clientDetails: JSON.stringify({
          name: 'Test Client',
          email: 'client@test.com',
          phone: '+63 123 456 7890',
        }),
        sampleDescription: 'Water sample from industrial site',
        quotedPrice: null, // No price yet
        quotedAt: null,
      },
    })

    expect(order).toBeDefined()
    expect(order.status).toBe('QUOTE_REQUESTED')
    expect(order.quotedPrice).toBeNull()
    expect(order.quotedAt).toBeNull()
  })

  it('should support updating order with quote', async () => {
    // Create an order
    const client = await prisma.user.findUnique({
      where: { email: 'client@test.com' },
    })

    const service = await prisma.labService.findFirst({
      where: { pricingMode: 'QUOTE_REQUIRED' },
    })

    const order = await prisma.order.create({
      data: {
        clientId: client!.id,
        labId: service!.labId,
        serviceId: service!.id,
        status: 'QUOTE_REQUESTED',
        clientDetails: JSON.stringify({ name: 'Test Client', email: 'client@test.com' }),
        sampleDescription: 'Test sample',
      },
    })

    // Lab admin provides quote
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        quotedPrice: 1500,
        quotedAt: new Date(),
        status: 'QUOTE_PROVIDED',
        quoteNotes: 'Custom pricing based on sample complexity',
        estimatedTurnaroundDays: 10,
      },
    })

    expect(updated.status).toBe('QUOTE_PROVIDED')
    expect(updated.quotedPrice?.toNumber()).toBe(1500)
    expect(updated.quotedAt).toBeDefined()
    expect(updated.quoteNotes).toBe('Custom pricing based on sample complexity')
  })
})
