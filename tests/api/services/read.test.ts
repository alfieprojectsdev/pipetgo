import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { GET } from '@/app/api/services/[id]/route'
import { NextRequest } from 'next/server'

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}))

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    labService: {
      findFirst: vi.fn()
    }
  }
}))

/**
 * GET /api/services/[id] - Service Read Tests
 *
 * Tests fetching individual service with ownership verification.
 *
 * Security tests:
 * - Authentication required (401 for unauthenticated)
 * - LAB_ADMIN role required (401 for other roles)
 * - Ownership verification (404 when service belongs to different lab)
 */
describe('GET /api/services/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Successful Service Fetch', () => {
    it('should fetch service for owner', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      const serviceData = {
        id: 'service-1',
        labId: 'lab-1',
        name: 'Water Testing',
        description: 'Basic water analysis',
        category: 'Environmental Testing',
        pricingMode: 'FIXED',
        pricePerUnit: 5000,
        unitType: 'per_sample',
        turnaroundDays: 7,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.labService.findFirst).mockResolvedValue(serviceData as any)

      const request = new NextRequest('http://localhost:3000/api/services/service-1')
      const response = await GET(request, { params: { id: 'service-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('service-1')
      expect(data.name).toBe('Water Testing')
      expect(data.pricePerUnit).toBe(5000)

      // Verify ownership check was performed
      expect(prisma.labService.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'service-1',
          lab: {
            ownerId: 'user-1' // Ownership verification
          }
        }
      })
    })

    it('should fetch QUOTE_REQUIRED service', async () => {
      const labAdminSession = {
        user: { id: 'user-2', role: 'LAB_ADMIN', email: 'admin2@lab.com' }
      }

      const serviceData = {
        id: 'service-2',
        labId: 'lab-2',
        name: 'Custom Analysis',
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED',
        pricePerUnit: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.labService.findFirst).mockResolvedValue(serviceData as any)

      const request = new NextRequest('http://localhost:3000/api/services/service-2')
      const response = await GET(request, { params: { id: 'service-2' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pricingMode).toBe('QUOTE_REQUIRED')
      expect(data.pricePerUnit).toBeNull()
    })
  })

  describe('Authorization Checks', () => {
    it('should return 401 for unauthenticated users', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/services/service-1')
      const response = await GET(request, { params: { id: 'service-1' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 for CLIENT role', async () => {
      const clientSession = {
        user: { id: 'client-1', role: 'CLIENT', email: 'client@test.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(clientSession as any)

      const request = new NextRequest('http://localhost:3000/api/services/service-1')
      const response = await GET(request, { params: { id: 'service-1' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 for ADMIN role (not LAB_ADMIN)', async () => {
      const adminSession = {
        user: { id: 'admin-1', role: 'ADMIN', email: 'admin@platform.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(adminSession as any)

      const request = new NextRequest('http://localhost:3000/api/services/service-1')
      const response = await GET(request, { params: { id: 'service-1' } })
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

      const request = new NextRequest('http://localhost:3000/api/services/other-lab-service')
      const response = await GET(request, { params: { id: 'other-lab-service' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Service not found or access denied')

      // Verify ownership check was performed
      expect(prisma.labService.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'other-lab-service',
          lab: {
            ownerId: 'attacker-user' // Ownership verification
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

      const request = new NextRequest('http://localhost:3000/api/services/non-existent')
      const response = await GET(request, { params: { id: 'non-existent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Service not found or access denied')
    })
  })
})
