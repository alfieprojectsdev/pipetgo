/**
 * Mock Database Factory (In-Memory Mock)
 * =======================================
 * Creates an in-memory mock of Prisma Client for fast, isolated testing.
 *
 * NOTE: pg-mem doesn't work with Prisma due to protocol incompatibility.
 * This uses a simple in-memory data store with Prisma-compatible interface.
 *
 * For real PostgreSQL integration tests, use Testcontainers or live database.
 */

import { PrismaClient, Prisma } from '@prisma/client'

// In-memory data store
const mockData = {
  users: new Map<string, any>(),
  labs: new Map<string, any>(),
  labServices: new Map<string, any>(),
  orders: new Map<string, any>(),
  attachments: new Map<string, any>(),
  accounts: new Map<string, any>(),
  sessions: new Map<string, any>(),
}

let mockPrisma: PrismaClient | null = null

/**
 * Creates a mock Prisma client with in-memory data storage.
 * This provides Prisma-compatible interface for testing without database.
 *
 * @returns Promise<PrismaClient> - Mocked Prisma client
 */
export async function createPrismaMock(): Promise<PrismaClient> {
  if (mockPrisma) {
    return mockPrisma
  }

  // Create a partial mock that implements the methods we need
  mockPrisma = {
    user: {
      createMany: async ({ data }: any) => {
        const users = Array.isArray(data) ? data : [data]
        users.forEach((user: any) => mockData.users.set(user.id, user))
        return { count: users.length }
      },
      findMany: async () => Array.from(mockData.users.values()),
      findUnique: async ({ where }: any) => {
        if (where.id) return mockData.users.get(where.id) || null
        if (where.email) {
          const values = Array.from(mockData.users.values())
          return values.find((u: any) => u.email === where.email) || null
        }
        return null
      },
      findFirst: async ({ where }: any) => {
        const values = Array.from(mockData.users.values())
        return values.find((u: any) => {
          if (where.email) return u.email === where.email
          if (where.id) return u.id === where.id
          return false
        }) || null
      },
      deleteMany: async () => {
        const count = mockData.users.size
        mockData.users.clear()
        return { count }
      },
    },
    lab: {
      create: async ({ data }: any) => {
        mockData.labs.set(data.id, data)
        return data
      },
      findMany: async () => Array.from(mockData.labs.values()),
      findUnique: async ({ where }: any) => mockData.labs.get(where.id) || null,
      deleteMany: async () => {
        const count = mockData.labs.size
        mockData.labs.clear()
        return { count }
      },
    },
    labService: {
      createMany: async ({ data }: any) => {
        const services = Array.isArray(data) ? data : [data]
        services.forEach((service: any) => mockData.labServices.set(service.id, service))
        return { count: services.length }
      },
      findMany: async () => Array.from(mockData.labServices.values()),
      findUnique: async ({ where }: any) => mockData.labServices.get(where.id) || null,
      findFirst: async ({ where }: any) => {
        const values = Array.from(mockData.labServices.values())
        return values.find((s: any) => {
          if (where.id) return s.id === where.id
          if (where.pricingMode) return s.pricingMode === where.pricingMode
          return false
        }) || null
      },
      deleteMany: async () => {
        const count = mockData.labServices.size
        mockData.labServices.clear()
        return { count }
      },
    },
    order: {
      create: async ({ data }: any) => {
        const order = { ...data, id: data.id || `order-${Date.now()}`, createdAt: new Date(), updatedAt: new Date() }
        mockData.orders.set(order.id, order)
        return order
      },
      findMany: async () => Array.from(mockData.orders.values()),
      findUnique: async ({ where }: any) => mockData.orders.get(where.id) || null,
      update: async ({ where, data }: any) => {
        const order = mockData.orders.get(where.id)
        if (!order) throw new Error(`Order ${where.id} not found`)
        // Wrap quotedPrice in Decimal-like object if it's a number
        const processedData = { ...data }
        if (typeof processedData.quotedPrice === 'number') {
          const price = processedData.quotedPrice
          processedData.quotedPrice = { toNumber: () => price }
        }
        const updated = { ...order, ...processedData, updatedAt: new Date() }
        mockData.orders.set(where.id, updated)
        return updated
      },
      deleteMany: async () => {
        const count = mockData.orders.size
        mockData.orders.clear()
        return { count }
      },
    },
    attachment: {
      createMany: async ({ data }: any) => {
        const attachments = Array.isArray(data) ? data : [data]
        attachments.forEach((a: any) => mockData.attachments.set(a.id, a))
        return { count: attachments.length }
      },
      findMany: async () => Array.from(mockData.attachments.values()),
      deleteMany: async () => {
        const count = mockData.attachments.size
        mockData.attachments.clear()
        return { count }
      },
    },
    account: {
      createMany: async ({ data }: any) => {
        const accounts = Array.isArray(data) ? data : [data]
        accounts.forEach((a: any) => mockData.accounts.set(a.id, a))
        return { count: accounts.length }
      },
      deleteMany: async () => {
        const count = mockData.accounts.size
        mockData.accounts.clear()
        return { count }
      },
    },
    session: {
      createMany: async ({ data }: any) => {
        const sessions = Array.isArray(data) ? data : [data]
        sessions.forEach((s: any) => mockData.sessions.set(s.id, s))
        return { count: sessions.length }
      },
      deleteMany: async () => {
        const count = mockData.sessions.size
        mockData.sessions.clear()
        return { count }
      },
    },
    $connect: async () => {},
    $disconnect: async () => {},
  } as unknown as PrismaClient

  console.log('✅ In-memory mock database initialized')

  return mockPrisma
}

/**
 * Seeds the mock database with test data for all pricing modes.
 * Creates test users, lab, and services to support testing workflows.
 *
 * Includes all 3 pricing modes:
 * - QUOTE_REQUIRED: No fixed price, requires custom quote
 * - FIXED: Fixed catalog price for instant booking
 * - HYBRID: Fixed price available, but allows custom quotes
 *
 * @param prisma - Prisma client instance (from createPrismaMock)
 */
export async function seedMockDatabase(prisma: PrismaClient): Promise<void> {
  // Clear existing data first (for test isolation)
  try {
    await prisma.attachment.deleteMany()
    await prisma.order.deleteMany()
    await prisma.labService.deleteMany()
    await prisma.lab.deleteMany()
    await prisma.session.deleteMany()
    await prisma.account.deleteMany()
    await prisma.user.deleteMany()
  } catch (e) {
    // Ignore errors if tables don't exist yet
  }

  // Seed test users (all 3 roles)
  await prisma.user.createMany({
    data: [
      {
        id: 'user-client-1',
        email: 'client@test.com',
        name: 'Test Client',
        role: 'CLIENT',
      },
      {
        id: 'user-lab-admin-1',
        email: 'labadmin@test.com',
        name: 'Test Lab Admin',
        role: 'LAB_ADMIN',
      },
      {
        id: 'user-admin-1',
        email: 'admin@test.com',
        name: 'Test Admin',
        role: 'ADMIN',
      },
    ],
  })

  // Seed test lab
  await prisma.lab.create({
    data: {
      id: 'lab-1',
      ownerId: 'user-lab-admin-1',
      name: 'Test Lab',
      description: 'ISO 17025 certified testing laboratory',
      location: { city: 'Manila', country: 'Philippines' },
      certifications: ['ISO 17025'],
    },
  })

  // Seed test services (one for each pricing mode)
  await prisma.labService.createMany({
    data: [
      {
        id: 'service-quote-1',
        labId: 'lab-1',
        name: 'Microbial Load Testing',
        description: 'Comprehensive microbial analysis - requires custom quote',
        category: 'Microbiology',
        pricingMode: 'QUOTE_REQUIRED',
        pricePerUnit: null, // No fixed price - quote required
        unitType: 'per_sample',
        turnaroundDays: 7,
        active: true,
      },
      {
        id: 'service-fixed-1',
        labId: 'lab-1',
        name: 'pH Testing',
        description: 'Basic pH measurement - fixed pricing',
        category: 'Chemistry',
        pricingMode: 'FIXED',
        pricePerUnit: { toNumber: () => 500 }, // Fixed catalog price (Decimal-like)
        unitType: 'per_sample',
        turnaroundDays: 3,
        active: true,
      },
      {
        id: 'service-hybrid-1',
        labId: 'lab-1',
        name: 'Moisture Content Analysis',
        description: 'Moisture determination - fixed price or custom quote',
        category: 'Chemistry',
        pricingMode: 'HYBRID',
        pricePerUnit: { toNumber: () => 800 }, // Reference price (Decimal-like)
        unitType: 'per_sample',
        turnaroundDays: 5,
        active: true,
      },
    ],
  })

  console.log('✅ Mock database seeded with test data')
}

/**
 * Resets the mock database singleton (useful for test isolation).
 * Clears the in-memory data and forces recreation on next createPrismaMock() call.
 */
export async function resetMockDatabase(): Promise<void> {
  if (mockPrisma) {
    await mockPrisma.$disconnect()
    mockPrisma = null
  }

  // Clear all in-memory data
  mockData.users.clear()
  mockData.labs.clear()
  mockData.labServices.clear()
  mockData.orders.clear()
  mockData.attachments.clear()
  mockData.accounts.clear()
  mockData.sessions.clear()
}
