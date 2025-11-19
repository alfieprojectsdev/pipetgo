import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { POST } from '@/app/api/services/route'
import { NextRequest } from 'next/server'

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}))

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    labService: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn()
    },
    lab: {
      findFirst: vi.fn()
    }
  }
}))

/**
 * POST /api/services - Service Creation Tests
 *
 * Tests service creation with different pricing modes:
 * - QUOTE_REQUIRED (no price needed)
 * - FIXED (price required)
 * - HYBRID (price required)
 *
 * Security tests:
 * - Authentication verification
 * - Role-based access control (LAB_ADMIN only)
 * - Lab ownership verification
 */
describe('POST /api/services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Successful Service Creation', () => {
    it('should create FIXED pricing service successfully', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1',
        name: 'Test Lab'
      }

      const createdService = {
        id: 'service-1',
        labId: 'lab-1',
        name: 'Water Quality Testing',
        description: 'Comprehensive water analysis',
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
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)
      vi.mocked(prisma.labService.create).mockResolvedValue(createdService as any)

      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Water Quality Testing',
          description: 'Comprehensive water analysis',
          category: 'Environmental Testing',
          pricingMode: 'FIXED',
          pricePerUnit: 5000,
          unitType: 'per_sample',
          turnaroundDays: 7
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.name).toBe('Water Quality Testing')
      expect(data.pricingMode).toBe('FIXED')
      expect(data.pricePerUnit).toBe(5000)
      expect(data.labId).toBe('lab-1') // CRITICAL: Uses lab from ownership check

      // Verify lab ownership check was performed
      expect(prisma.lab.findFirst).toHaveBeenCalledWith({
        where: { ownerId: 'user-1' }
      })

      // Verify service created with correct labId
      expect(prisma.labService.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          labId: 'lab-1', // From ownership check, NOT request body
          name: 'Water Quality Testing',
          pricingMode: 'FIXED',
          pricePerUnit: 5000
        })
      })
    })

    it('should create QUOTE_REQUIRED service without price', async () => {
      const labAdminSession = {
        user: { id: 'user-2', role: 'LAB_ADMIN', email: 'admin2@lab.com' }
      }

      const userLab = {
        id: 'lab-2',
        ownerId: 'user-2',
        name: 'Specialized Lab'
      }

      const createdService = {
        id: 'service-2',
        labId: 'lab-2',
        name: 'Custom Toxicology Analysis',
        category: 'Chemical Analysis',
        pricingMode: 'QUOTE_REQUIRED',
        pricePerUnit: null, // No fixed price
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)
      vi.mocked(prisma.labService.create).mockResolvedValue(createdService as any)

      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Custom Toxicology Analysis',
          category: 'Chemical Analysis',
          pricingMode: 'QUOTE_REQUIRED'
          // pricePerUnit not required for QUOTE_REQUIRED mode
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.pricingMode).toBe('QUOTE_REQUIRED')
      expect(data.pricePerUnit).toBeNull()
    })

    it('should create HYBRID pricing service with catalog price', async () => {
      const labAdminSession = {
        user: { id: 'user-3', role: 'LAB_ADMIN', email: 'admin3@lab.com' }
      }

      const userLab = {
        id: 'lab-3',
        ownerId: 'user-3',
        name: 'Flexible Lab'
      }

      const createdService = {
        id: 'service-3',
        labId: 'lab-3',
        name: 'Microbiological Testing',
        category: 'Microbiological Testing',
        pricingMode: 'HYBRID',
        pricePerUnit: 3500,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)
      vi.mocked(prisma.labService.create).mockResolvedValue(createdService as any)

      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Microbiological Testing',
          category: 'Microbiological Testing',
          pricingMode: 'HYBRID',
          pricePerUnit: 3500
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.pricingMode).toBe('HYBRID')
      expect(data.pricePerUnit).toBe(3500)
    })
  })

  describe('Authorization Checks', () => {
    it('should return 401 for unauthenticated users', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Service',
          category: 'Chemical Analysis',
          pricingMode: 'FIXED',
          pricePerUnit: 1000
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 for CLIENT role', async () => {
      const clientSession = {
        user: { id: 'client-1', role: 'CLIENT', email: 'client@test.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(clientSession as any)

      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Service',
          category: 'Chemical Analysis',
          pricingMode: 'FIXED',
          pricePerUnit: 1000
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Only lab administrators can create services')
    })

    it('should return 403 for ADMIN role (not LAB_ADMIN)', async () => {
      const adminSession = {
        user: { id: 'admin-1', role: 'ADMIN', email: 'admin@platform.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(adminSession as any)

      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Service',
          category: 'Chemical Analysis',
          pricingMode: 'FIXED',
          pricePerUnit: 1000
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Only lab administrators can create services')
    })

    it('should return 404 when LAB_ADMIN has no lab', async () => {
      const labAdminSession = {
        user: { id: 'user-no-lab', role: 'LAB_ADMIN', email: 'nolab@test.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(null) // No lab found

      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Service',
          category: 'Chemical Analysis',
          pricingMode: 'FIXED',
          pricePerUnit: 1000
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Lab not found')
    })
  })

  describe('Validation Checks', () => {
    it('should return 400 when FIXED mode missing price', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)

      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Service',
          category: 'Chemical Analysis',
          pricingMode: 'FIXED'
          // Missing pricePerUnit - should fail Zod refinement
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
    })

    it('should return 400 when HYBRID mode missing price', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)

      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Service',
          category: 'Chemical Analysis',
          pricingMode: 'HYBRID'
          // Missing pricePerUnit - should fail Zod refinement
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('should return 400 for missing required fields', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)

      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          // Missing name, category, pricingMode
          pricePerUnit: 1000
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
    })

    it('should return 400 for invalid category', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)

      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Service',
          category: 'Invalid Category', // Not in enum
          pricingMode: 'FIXED',
          pricePerUnit: 1000
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('should return 400 for negative price', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)

      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Service',
          category: 'Chemical Analysis',
          pricingMode: 'FIXED',
          pricePerUnit: -100 // Negative price
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('should return 400 for name too short', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)

      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'ab', // Too short (< 3 chars)
          category: 'Chemical Analysis',
          pricingMode: 'FIXED',
          pricePerUnit: 1000
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })
  })
})
