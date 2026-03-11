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

// @ts-nocheck - Mock file only used in test environment

import { PrismaClient, Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

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

// Helper to filter data based on where clause
function filterData(data: any[], where: any) {
  if (!where) return data

  return data.filter(item => {
    for (const key in where) {
      const condition = where[key]
      const value = item[key]

      if (key === 'AND' && Array.isArray(condition)) {
        if (!condition.every(c => filterData([item], c).length > 0)) return false
        continue
      }

      // Handle Date comparisons
      if (typeof condition === 'object' && condition !== null && !(condition instanceof Date) && !Array.isArray(condition)) {
        if ('gte' in condition) {
          if (new Date(value) < new Date(condition.gte)) return false
        }
        if ('gt' in condition) {
          if (new Date(value) <= new Date(condition.gt)) return false
        }
        if ('lte' in condition) {
          if (new Date(value) > new Date(condition.lte)) return false
        }
        if ('lt' in condition) {
          if (new Date(value) >= new Date(condition.lt)) return false
        }
        if ('in' in condition && Array.isArray(condition.in)) {
           if (!condition.in.includes(value)) return false
        }
        continue
      }

      // Simple equality
      if (value !== condition) return false
    }
    return true
  })
}

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
      findMany: async ({ where }: any = {}) => filterData(Array.from(mockData.users.values()), where),
      findUnique: async ({ where }: any) => {
        if (where.id) return mockData.users.get(where.id) || null
        if (where.email) {
          const values = Array.from(mockData.users.values())
          return values.find((u: any) => u.email === where.email) || null
        }
        return null
      },
      findFirst: async ({ where }: any) => {
        const results = filterData(Array.from(mockData.users.values()), where)
        return results[0] || null
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
      findMany: async ({ where }: any = {}) => filterData(Array.from(mockData.labs.values()), where),
      findUnique: async ({ where }: any) => mockData.labs.get(where.id) || null,
      findFirst: async ({ where }: any) => {
        const results = filterData(Array.from(mockData.labs.values()), where)
        return results[0] || null
      },
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
      findMany: async ({ where }: any = {}) => filterData(Array.from(mockData.labServices.values()), where),
      findUnique: async ({ where }: any) => mockData.labServices.get(where.id) || null,
      findFirst: async ({ where }: any) => {
        const results = filterData(Array.from(mockData.labServices.values()), where)
        return results[0] || null
      },
      deleteMany: async () => {
        const count = mockData.labServices.size
        mockData.labServices.clear()
        return { count }
      },
    },
    order: {
      create: async ({ data }: any) => {
        const order = { ...data, id: data.id || `order-${Date.now()}`, createdAt: data.createdAt || new Date(), updatedAt: new Date() }
        mockData.orders.set(order.id, order)
        return order
      },
      findMany: async ({ where, include, select, orderBy, take }: any = {}) => {
        let results = filterData(Array.from(mockData.orders.values()), where)

        // Handle orderBy
        if (orderBy) {
           results.sort((a, b) => {
             const key = Object.keys(orderBy)[0]
             const dir = orderBy[key]
             if (a[key] < b[key]) return dir === 'asc' ? -1 : 1
             if (a[key] > b[key]) return dir === 'asc' ? 1 : -1
             return 0
           })
        }

        // Handle take
        if (take) {
          results = results.slice(0, take)
        }

        // Simulating include/select to some extent if needed, but for now just returning the object
        // NOTE: The mock object might need to have relations manually populated if 'include' is expected
        // We leave that to the test setup to handle (e.g. putting 'service' object inside 'order')

        // If select is used, strictly we should only return selected fields
        if (select) {
           return results.map(item => {
             const selected: any = {}
             for (const key in select) {
               if (select[key]) selected[key] = item[key]
             }
             return selected
           })
        }

        return results
      },
      findUnique: async ({ where }: any) => mockData.orders.get(where.id) || null,
      update: async ({ where, data }: any) => {
        const order = mockData.orders.get(where.id)
        if (!order) throw new Error(`Order ${where.id} not found`)
        // Wrap quotedPrice in Decimal-like object if it's a number
        const processedData = { ...data }
        if (typeof processedData.quotedPrice === 'number') {
          const price = processedData.quotedPrice
          processedData.quotedPrice = new Decimal(price)
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
      count: async ({ where }: any = {}) => {
        const filtered = filterData(Array.from(mockData.orders.values()), where)
        return filtered.length
      },
      // Implement aggregate for analytics
      aggregate: async ({ where, _sum, _count, _avg }: any) => {
        const filtered = filterData(Array.from(mockData.orders.values()), where)
        const result: any = {}

        if (_count) {
          result._count = {}
          if (_count === true || _count._all) {
             result._count._all = filtered.length
             // Also map to any requested field if needed, but usually it's just count
             for (const key in _count) {
               if (key !== '_all') result._count[key] = filtered.filter(i => i[key] !== null).length
             }
          } else {
             for (const key in _count) {
                result._count[key] = filtered.filter(i => i[key] !== null).length
             }
          }
        }

        if (_sum) {
          result._sum = {}
          for (const key in _sum) {
            result._sum[key] = filtered.reduce((sum, item) => {
              const val = item[key] ? Number(item[key]) : 0
              return sum + val
            }, 0)
          }
        }

        if (_avg) {
           result._avg = {}
           for (const key in _avg) {
             const sum = filtered.reduce((s, item) => s + (item[key] ? Number(item[key]) : 0), 0)
             result._avg[key] = filtered.length ? sum / filtered.length : 0
           }
        }

        return result
      },
      // Implement groupBy for analytics
      groupBy: async ({ by, where, _sum, _count, orderBy, take }: any) => {
        const filtered = filterData(Array.from(mockData.orders.values()), where)
        const groups = new Map<string, any>()

        filtered.forEach(item => {
          // Create a composite key based on 'by' fields
          const groupKey = by.map(k => item[k]).join(':::')

          if (!groups.has(groupKey)) {
             const groupObj: any = {}
             by.forEach(k => groupObj[k] = item[k])

             // Initialize aggregators
             if (_sum) {
               groupObj._sum = {}
               for (const k in _sum) groupObj._sum[k] = 0
             }
             if (_count) {
               groupObj._count = {}
               for (const k in _count) groupObj._count[k] = 0
             }

             groups.set(groupKey, groupObj)
          }

          const group = groups.get(groupKey)

          // Accumulate
          if (_sum) {
            for (const k in _sum) {
              group._sum[k] += item[k] ? Number(item[k]) : 0
            }
          }
          if (_count) {
            for (const k in _count) {
              if (k === '_all' || item[k] !== null) { // Simplify count logic
                  // if k is a field, check null? Prisma counts non-null.
                  // if k is object? Prisma syntax is _count: { id: true }
                  group._count[k] += 1
              }
            }
          }
        })

        let result = Array.from(groups.values())

        // Handle orderBy
        if (orderBy) {
           result.sort((a, b) => {
             // orderBy can be { _sum: { quotedPrice: 'desc' } }
             const key = Object.keys(orderBy)[0] // e.g. _sum
             const dir = orderBy[key] // e.g. { quotedPrice: 'desc' } or 'desc' if direct field

             if (typeof dir === 'object') {
                const subKey = Object.keys(dir)[0] // quotedPrice
                const subDir = dir[subKey] // 'desc'

                const valA = a[key] ? a[key][subKey] : 0
                const valB = b[key] ? b[key][subKey] : 0

                return subDir === 'asc' ? valA - valB : valB - valA
             } else {
                // Direct field sort (not common in groupBy output unless it's one of 'by' fields)
                return 0
             }
           })
        }

        if (take) {
          result = result.slice(0, take)
        }

        return result
      }
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
      description: 'ISO 17025 accredited testing laboratory',
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
        pricePerUnit: new Decimal(500), // Fixed catalog price
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
        pricePerUnit: new Decimal(800), // Reference price
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
