import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '@/app/api/services/route'
import { prisma } from '@/lib/db'
import { NextRequest } from 'next/server'

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    labService: {
      findMany: vi.fn(),
      count: vi.fn()
    }
  }
}))

describe('GET /api/services (List)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should filter by serviceId when provided', async () => {
    const serviceId = 'clx1abc2def3ghi4jkl5mno'
    const service = {
      id: serviceId,
      name: 'Test Service',
      description: 'Test Description',
      category: 'Test Category',
      pricingMode: 'FIXED',
      pricePerUnit: 100,
      active: true,
      lab: {
        id: 'lab-1',
        name: 'Test Lab',
        location: { city: 'Test City' },
        certifications: []
      }
    }

    vi.mocked(prisma.labService.findMany).mockResolvedValue([service] as any)
    vi.mocked(prisma.labService.count).mockResolvedValue(1)

    const request = new NextRequest(`http://localhost:3000/api/services?serviceId=${serviceId}`)
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.items).toHaveLength(1)
    expect(data.items[0].id).toBe(serviceId)

    // Verify filter was applied in the where clause
    // This is the CRITICAL check for the performance optimization
    expect(prisma.labService.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: serviceId
      })
    }))
  })
})
