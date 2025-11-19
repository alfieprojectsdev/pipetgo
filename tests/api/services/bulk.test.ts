import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { POST } from '@/app/api/services/bulk/route'
import { NextRequest } from 'next/server'

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}))

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    lab: {
      findFirst: vi.fn()
    },
    labService: {
      findMany: vi.fn(),
      updateMany: vi.fn()
    }
  }
}))

/**
 * POST /api/services/bulk - Bulk Operations Tests
 *
 * Tests bulk enable/disable operations with ownership verification.
 *
 * Security tests:
 * - All services must belong to user's lab
 * - Atomic operations (all or nothing)
 * - Proper error messages
 */
describe('POST /api/services/bulk', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Successful Bulk Operations', () => {
    it('should enable multiple services', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1',
        name: 'Test Lab'
      }

      const services = [
        { id: 'clx1a2b3c4d5e6f7g8h9' },
        { id: 'clx2a2b3c4d5e6f7g8h9' },
        { id: 'clx3a2b3c4d5e6f7g8h9' }
      ]

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)
      vi.mocked(prisma.labService.findMany).mockResolvedValue(services as any)
      vi.mocked(prisma.labService.updateMany).mockResolvedValue({ count: 3 } as any)

      const request = new NextRequest('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: ['clx1a2b3c4d5e6f7g8h9', 'clx2a2b3c4d5e6f7g8h9', 'clx3a2b3c4d5e6f7g8h9'],
          action: 'enable'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.count).toBe(3)
      expect(data.message).toBe('3 services enabled')

      // Verify ownership check was performed
      expect(prisma.labService.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['clx1a2b3c4d5e6f7g8h9', 'clx2a2b3c4d5e6f7g8h9', 'clx3a2b3c4d5e6f7g8h9'] },
          labId: 'lab-1' // Ownership check
        },
        select: { id: true }
      })

      // Verify bulk update was executed
      expect(prisma.labService.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['clx1a2b3c4d5e6f7g8h9', 'clx2a2b3c4d5e6f7g8h9', 'clx3a2b3c4d5e6f7g8h9'] },
          labId: 'lab-1'
        },
        data: {
          active: true
        }
      })
    })

    it('should disable multiple services', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      const services = [
        { id: 'clx4a2b3c4d5e6f7g8h9' },
        { id: 'clx5a2b3c4d5e6f7g8h9' }
      ]

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)
      vi.mocked(prisma.labService.findMany).mockResolvedValue(services as any)
      vi.mocked(prisma.labService.updateMany).mockResolvedValue({ count: 2 } as any)

      const request = new NextRequest('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: ['clx4a2b3c4d5e6f7g8h9', 'clx5a2b3c4d5e6f7g8h9'],
          action: 'disable'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.count).toBe(2)
      expect(data.message).toBe('2 services disabled')

      // Verify update sets active to false
      expect(prisma.labService.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['clx4a2b3c4d5e6f7g8h9', 'clx5a2b3c4d5e6f7g8h9'] },
          labId: 'lab-1'
        },
        data: {
          active: false
        }
      })
    })

    it('should handle single service bulk operation', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      const services = [{ id: 'clx6a2b3c4d5e6f7g8h9' }]

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)
      vi.mocked(prisma.labService.findMany).mockResolvedValue(services as any)
      vi.mocked(prisma.labService.updateMany).mockResolvedValue({ count: 1 } as any)

      const request = new NextRequest('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: ['clx6a2b3c4d5e6f7g8h9'],
          action: 'enable'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.count).toBe(1)
      expect(data.message).toBe('1 service enabled') // Singular form
    })
  })

  describe('Authorization Checks', () => {
    it('should return 401 for unauthenticated users', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: ['clx7a2b3c4d5e6f7g8h9'],
          action: 'enable'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 for CLIENT role', async () => {
      const clientSession = {
        user: { id: 'client-1', role: 'CLIENT', email: 'client@test.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(clientSession as any)

      const request = new NextRequest('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: ['clx8a2b3c4d5e6f7g8h9'],
          action: 'enable'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 for ADMIN role (not LAB_ADMIN)', async () => {
      const adminSession = {
        user: { id: 'admin-1', role: 'ADMIN', email: 'admin@platform.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(adminSession as any)

      const request = new NextRequest('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: ['clx8a2b3c4d5e6f7g8h9'],
          action: 'enable'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 when LAB_ADMIN has no lab', async () => {
      const labAdminSession = {
        user: { id: 'user-no-lab', role: 'LAB_ADMIN', email: 'nolab@test.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: ['clx8a2b3c4d5e6f7g8h9'],
          action: 'enable'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Lab not found')
    })

    it('should return 403 when ANY service belongs to different lab', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      // Only 2 services found, but 3 requested (one belongs to different lab)
      const services = [
        { id: 'clx9a2b3c4d5e6f7g8h9' },
        { id: 'clxaa2b3c4d5e6f7g8h9' }
      ]

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)
      vi.mocked(prisma.labService.findMany).mockResolvedValue(services as any) // 2 instead of 3

      const request = new NextRequest('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: ['clx9a2b3c4d5e6f7g8h9', 'clxaa2b3c4d5e6f7g8h9', 'clxba2b3c4d5e6f7g8h9'],
          action: 'enable'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Some services not found or access denied')

      // Verify no update was performed (atomic operation)
      expect(prisma.labService.updateMany).not.toHaveBeenCalled()
    })
  })

  describe('Validation Checks', () => {
    it('should return 400 for empty serviceIds array', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)

      const request = new NextRequest('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: [], // Empty array
          action: 'enable'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
    })

    it('should return 400 for invalid action', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)

      const request = new NextRequest('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: ['clx8a2b3c4d5e6f7g8h9'],
          action: 'delete' // Invalid action (only 'enable' or 'disable' allowed)
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('should return 400 for missing serviceIds', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)

      const request = new NextRequest('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          action: 'enable'
          // Missing serviceIds
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('should return 400 for missing action', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)

      const request = new NextRequest('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: ['service-1']
          // Missing action
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('should return 400 for invalid service ID format', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)

      const request = new NextRequest('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: ['invalid-id'], // Not a CUID
          action: 'enable'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })
  })

  describe('Atomic Operations', () => {
    it('should not update ANY services if ownership check fails', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      // Only 1 service found, but 3 requested
      const services = [{ id: 'clxca2b3c4d5e6f7g8h9' }]

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)
      vi.mocked(prisma.labService.findMany).mockResolvedValue(services as any)

      const request = new NextRequest('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: ['clxca2b3c4d5e6f7g8h9', 'clxda2b3c4d5e6f7g8h9', 'clxea2b3c4d5e6f7g8h9'],
          action: 'disable'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Some services not found or access denied')

      // CRITICAL: Verify NO update was performed (atomic operation)
      expect(prisma.labService.updateMany).not.toHaveBeenCalled()
    })
  })
})
