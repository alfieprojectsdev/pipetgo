import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { PATCH } from '@/app/api/services/[id]/route'
import { NextRequest } from 'next/server'

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}))

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    labService: {
      findFirst: vi.fn(),
      update: vi.fn()
    }
  }
}))

/**
 * PATCH /api/services/[id] - Service Update Tests
 *
 * Tests two update modes:
 * 1. Simple toggle (active: boolean) - no validation
 * 2. Full update - requires Zod validation
 *
 * Security tests:
 * - Authentication required
 * - LAB_ADMIN role required
 * - Ownership verification
 */
describe('PATCH /api/services/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Simple Toggle Updates', () => {
    it('should toggle service to inactive', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      const existingService = {
        id: 'service-1',
        labId: 'lab-1',
        name: 'Water Testing',
        active: true,
        lab: {
          id: 'lab-1',
          name: 'Test Lab',
          ownerId: 'user-1'
        }
      }

      const updatedService = {
        ...existingService,
        active: false
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.labService.findFirst).mockResolvedValue(existingService as any)
      vi.mocked(prisma.labService.update).mockResolvedValue(updatedService as any)

      const request = new NextRequest('http://localhost:3000/api/services/service-1', {
        method: 'PATCH',
        body: JSON.stringify({ active: false })
      })

      const response = await PATCH(request, { params: { id: 'service-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.active).toBe(false)

      // Verify update was called correctly
      expect(prisma.labService.update).toHaveBeenCalledWith({
        where: { id: 'service-1' },
        data: { active: false },
        include: {
          lab: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    })

    it('should toggle service to active', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      const existingService = {
        id: 'service-1',
        labId: 'lab-1',
        name: 'Water Testing',
        active: false,
        lab: {
          id: 'lab-1',
          ownerId: 'user-1'
        }
      }

      const updatedService = {
        ...existingService,
        active: true
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.labService.findFirst).mockResolvedValue(existingService as any)
      vi.mocked(prisma.labService.update).mockResolvedValue(updatedService as any)

      const request = new NextRequest('http://localhost:3000/api/services/service-1', {
        method: 'PATCH',
        body: JSON.stringify({ active: true })
      })

      const response = await PATCH(request, { params: { id: 'service-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.active).toBe(true)
    })

    it('should return 400 for non-boolean active value in toggle', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      const existingService = {
        id: 'service-1',
        labId: 'lab-1',
        lab: {
          id: 'lab-1',
          ownerId: 'user-1'
        }
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.labService.findFirst).mockResolvedValue(existingService as any)

      const request = new NextRequest('http://localhost:3000/api/services/service-1', {
        method: 'PATCH',
        body: JSON.stringify({ active: 'yes' }) // String instead of boolean
      })

      const response = await PATCH(request, { params: { id: 'service-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input: active must be a boolean')
    })
  })

  describe('Full Service Updates', () => {
    it('should update service with full data', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      const existingService = {
        id: 'service-1',
        labId: 'lab-1',
        name: 'Water Testing',
        category: 'Environmental Testing',
        pricingMode: 'FIXED',
        pricePerUnit: 5000,
        lab: {
          id: 'lab-1',
          name: 'Test Lab',
          ownerId: 'user-1'
        }
      }

      const updatedService = {
        ...existingService,
        name: 'Advanced Water Testing',
        pricePerUnit: 6000,
        turnaroundDays: 5
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.labService.findFirst).mockResolvedValue(existingService as any)
      vi.mocked(prisma.labService.update).mockResolvedValue(updatedService as any)

      const request = new NextRequest('http://localhost:3000/api/services/service-1', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Advanced Water Testing',
          category: 'Environmental Testing',
          pricingMode: 'FIXED',
          pricePerUnit: 6000,
          turnaroundDays: 5
        })
      })

      const response = await PATCH(request, { params: { id: 'service-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('Advanced Water Testing')
      expect(data.pricePerUnit).toBe(6000)
    })

    it('should return 400 for invalid full update (FIXED mode without price)', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      const existingService = {
        id: 'service-1',
        labId: 'lab-1',
        lab: {
          id: 'lab-1',
          ownerId: 'user-1'
        }
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.labService.findFirst).mockResolvedValue(existingService as any)

      const request = new NextRequest('http://localhost:3000/api/services/service-1', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated Service',
          category: 'Chemical Analysis',
          pricingMode: 'FIXED'
          // Missing pricePerUnit - should fail validation
        })
      })

      const response = await PATCH(request, { params: { id: 'service-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('should update service to QUOTE_REQUIRED mode (price not required)', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      const existingService = {
        id: 'service-1',
        labId: 'lab-1',
        name: 'Water Testing',
        pricingMode: 'FIXED',
        pricePerUnit: 5000,
        lab: {
          id: 'lab-1',
          ownerId: 'user-1'
        }
      }

      const updatedService = {
        ...existingService,
        pricingMode: 'QUOTE_REQUIRED',
        pricePerUnit: null
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.labService.findFirst).mockResolvedValue(existingService as any)
      vi.mocked(prisma.labService.update).mockResolvedValue(updatedService as any)

      const request = new NextRequest('http://localhost:3000/api/services/service-1', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Water Testing',
          category: 'Environmental Testing',
          pricingMode: 'QUOTE_REQUIRED'
          // pricePerUnit not required for QUOTE_REQUIRED mode
        })
      })

      const response = await PATCH(request, { params: { id: 'service-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pricingMode).toBe('QUOTE_REQUIRED')
    })
  })

  describe('Authorization Checks', () => {
    it('should return 401 for unauthenticated users', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/services/service-1', {
        method: 'PATCH',
        body: JSON.stringify({ active: false })
      })

      const response = await PATCH(request, { params: { id: 'service-1' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 for CLIENT role', async () => {
      const clientSession = {
        user: { id: 'client-1', role: 'CLIENT', email: 'client@test.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(clientSession as any)

      const request = new NextRequest('http://localhost:3000/api/services/service-1', {
        method: 'PATCH',
        body: JSON.stringify({ active: false })
      })

      const response = await PATCH(request, { params: { id: 'service-1' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 for ADMIN role (not LAB_ADMIN)', async () => {
      const adminSession = {
        user: { id: 'admin-1', role: 'ADMIN', email: 'admin@platform.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(adminSession as any)

      const request = new NextRequest('http://localhost:3000/api/services/service-1', {
        method: 'PATCH',
        body: JSON.stringify({ active: false })
      })

      const response = await PATCH(request, { params: { id: 'service-1' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 when service belongs to different lab', async () => {
      const labAdminSession = {
        user: { id: 'attacker-user', role: 'LAB_ADMIN', email: 'attacker@lab.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.labService.findFirst).mockResolvedValue(null) // No match due to ownership check

      const request = new NextRequest('http://localhost:3000/api/services/other-lab-service', {
        method: 'PATCH',
        body: JSON.stringify({ active: false })
      })

      const response = await PATCH(request, { params: { id: 'other-lab-service' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Service not found or access denied')

      // Verify ownership check was performed
      expect(prisma.labService.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'other-lab-service',
          lab: {
            ownerId: 'attacker-user'
          }
        },
        include: {
          lab: {
            select: {
              id: true,
              name: true,
              ownerId: true
            }
          }
        }
      })
    })

    it('should return 404 for non-existent service', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.labService.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/services/non-existent', {
        method: 'PATCH',
        body: JSON.stringify({ active: false })
      })

      const response = await PATCH(request, { params: { id: 'non-existent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Service not found or access denied')
    })
  })
})
