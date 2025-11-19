import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { POST as CreateService } from '@/app/api/services/route'
import { GET as GetService, PATCH as UpdateService } from '@/app/api/services/[id]/route'
import { POST as BulkAction } from '@/app/api/services/bulk/route'
import { Decimal } from '@prisma/client/runtime/library'

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
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn()
    }
  }
}))

/**
 * Service Management API Tests
 * ============================
 *
 * Tests comprehensive service CRUD operations:
 * - Service creation (POST /api/services)
 * - Single service fetch (GET /api/services/[id])
 * - Service updates (PATCH /api/services/[id])
 * - Bulk enable/disable (POST /api/services/bulk)
 *
 * Security tests:
 * - Authentication verification
 * - Role-based access control (LAB_ADMIN only)
 * - Lab ownership verification
 * - Pricing mode validation (QUOTE_REQUIRED, FIXED, HYBRID)
 */

// ============================================================================
// POST /api/services - Create Service
// ============================================================================
describe('POST /api/services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --------------------------------------------------------------------------
  // Authorization Checks
  // --------------------------------------------------------------------------
  describe('Authorization Checks', () => {
    it('should return 401 for unauthenticated users', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Water Testing',
          category: 'Chemical Analysis',
          pricingMode: 'FIXED',
          pricePerUnit: 5000
        })
      })

      const response = await CreateService(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 for CLIENT role', async () => {
      const clientSession = {
        user: { id: 'client-1', role: 'CLIENT', email: 'client@test.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(clientSession as any)

      const request = new Request('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Water Testing',
          category: 'Chemical Analysis',
          pricingMode: 'FIXED',
          pricePerUnit: 5000
        })
      })

      const response = await CreateService(request)
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

      const request = new Request('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Water Testing',
          category: 'Chemical Analysis',
          pricingMode: 'FIXED',
          pricePerUnit: 5000
        })
      })

      const response = await CreateService(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Lab not found')
    })
  })

  // --------------------------------------------------------------------------
  // Service Creation Tests
  // --------------------------------------------------------------------------
  describe('Service Creation', () => {
    it('should create service with valid data (FIXED pricing)', async () => {
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
        name: 'Water Testing',
        description: 'Comprehensive water quality testing',
        category: 'Chemical Analysis',
        pricingMode: 'FIXED',
        pricePerUnit: new Decimal(5000),
        unitType: 'per_sample',
        turnaroundDays: 5,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)
      vi.mocked(prisma.labService.create).mockResolvedValue(createdService as any)

      const request = new Request('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Water Testing',
          description: 'Comprehensive water quality testing',
          category: 'Chemical Analysis',
          pricingMode: 'FIXED',
          pricePerUnit: 5000,
          unitType: 'per_sample',
          turnaroundDays: 5
        })
      })

      const response = await CreateService(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('service-1')
      expect(data.name).toBe('Water Testing')
      expect(data.pricingMode).toBe('FIXED')
      expect(data.pricePerUnit).toEqual('5000') // JSON serializes Decimal as string

      // Verify prisma.labService.create was called with correct data
      expect(prisma.labService.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Water Testing',
          labId: 'lab-1' // CRITICAL: Uses lab.id from ownership check
        })
      })
    })

    it('should create service with QUOTE_REQUIRED pricing (null price)', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      const createdService = {
        id: 'service-2',
        labId: 'lab-1',
        name: 'Custom Analysis',
        category: 'Other',
        pricingMode: 'QUOTE_REQUIRED',
        pricePerUnit: null, // No fixed price
        unitType: 'per_sample',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)
      vi.mocked(prisma.labService.create).mockResolvedValue(createdService as any)

      const request = new Request('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Custom Analysis',
          category: 'Other',
          pricingMode: 'QUOTE_REQUIRED',
          unitType: 'per_sample'
          // No pricePerUnit provided
        })
      })

      const response = await CreateService(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.pricingMode).toBe('QUOTE_REQUIRED')
      expect(data.pricePerUnit).toBeNull()
    })

    it('should create service with HYBRID pricing (price required)', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      const createdService = {
        id: 'service-3',
        labId: 'lab-1',
        name: 'Soil Testing',
        category: 'Environmental Testing',
        pricingMode: 'HYBRID',
        pricePerUnit: new Decimal(3500),
        unitType: 'per_sample',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)
      vi.mocked(prisma.labService.create).mockResolvedValue(createdService as any)

      const request = new Request('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Soil Testing',
          category: 'Environmental Testing',
          pricingMode: 'HYBRID',
          pricePerUnit: 3500,
          unitType: 'per_sample'
        })
      })

      const response = await CreateService(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.pricingMode).toBe('HYBRID')
      expect(data.pricePerUnit).toEqual('3500') // JSON serializes Decimal as string
    })
  })

  // --------------------------------------------------------------------------
  // Validation Tests
  // --------------------------------------------------------------------------
  describe('Validation Tests', () => {
    it('should return 400 for invalid data (missing required fields)', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)

      const request = new Request('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields: name, category, pricingMode
          description: 'Test service'
        })
      })

      const response = await CreateService(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
    })

    it('should return 400 when FIXED mode missing pricePerUnit', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)

      const request = new Request('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Water Testing',
          category: 'Chemical Analysis',
          pricingMode: 'FIXED'
          // Missing pricePerUnit (required for FIXED mode)
        })
      })

      const response = await CreateService(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
      expect(JSON.stringify(data.details)).toContain('Price is required for FIXED')
    })

    it('should return 400 when HYBRID mode missing pricePerUnit', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)

      const request = new Request('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Soil Testing',
          category: 'Environmental Testing',
          pricingMode: 'HYBRID'
          // Missing pricePerUnit (required for HYBRID mode)
        })
      })

      const response = await CreateService(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
      expect(JSON.stringify(data.details)).toContain('Price is required')
    })

    it('should return 400 for invalid name (too short)', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)

      const request = new Request('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'AB', // Too short (min 3)
          category: 'Chemical Analysis',
          pricingMode: 'QUOTE_REQUIRED'
        })
      })

      const response = await CreateService(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(JSON.stringify(data.details)).toContain('at least 3 characters')
    })
  })
})

// ============================================================================
// GET /api/services/[id] - Fetch Single Service
// ============================================================================
describe('GET /api/services/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --------------------------------------------------------------------------
  // Authorization Checks
  // --------------------------------------------------------------------------
  describe('Authorization Checks', () => {
    it('should return 401 for unauthenticated users', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/services/service-1')
      const response = await GetService(request, { params: { id: 'service-1' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 for CLIENT role', async () => {
      const clientSession = {
        user: { id: 'client-1', role: 'CLIENT', email: 'client@test.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(clientSession as any)

      const request = new Request('http://localhost:3000/api/services/service-1')
      const response = await GetService(request, { params: { id: 'service-1' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 when service not found', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.labService.findFirst).mockResolvedValue(null) // Service not found

      const request = new Request('http://localhost:3000/api/services/nonexistent')
      const response = await GetService(request, { params: { id: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Service not found or access denied')
    })

    it('should return 404 when service exists but user does not own lab (security)', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      // Prisma query with ownership check returns null (service exists but different owner)
      vi.mocked(prisma.labService.findFirst).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/services/service-other-lab')
      const response = await GetService(request, { params: { id: 'service-other-lab' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Service not found or access denied')

      // Verify ownership check was included in query
      expect(prisma.labService.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'service-other-lab',
          lab: {
            ownerId: 'user-1' // CRITICAL: Ownership verification
          }
        }
      })
    })
  })

  // --------------------------------------------------------------------------
  // Fetch Service Tests
  // --------------------------------------------------------------------------
  describe('Fetch Service', () => {
    it('should fetch service by ID successfully', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const service = {
        id: 'service-1',
        labId: 'lab-1',
        name: 'Water Testing',
        description: 'Comprehensive water quality testing',
        category: 'Chemical Analysis',
        pricingMode: 'FIXED',
        pricePerUnit: new Decimal(5000),
        unitType: 'per_sample',
        turnaroundDays: 5,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.labService.findFirst).mockResolvedValue(service as any)

      const request = new Request('http://localhost:3000/api/services/service-1')
      const response = await GetService(request, { params: { id: 'service-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('service-1')
      expect(data.name).toBe('Water Testing')
      expect(data.pricingMode).toBe('FIXED')
      expect(data.pricePerUnit).toEqual('5000') // JSON serializes Decimal as string

      // Verify ownership check in query
      expect(prisma.labService.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'service-1',
          lab: {
            ownerId: 'user-1'
          }
        }
      })
    })
  })
})

// ============================================================================
// PATCH /api/services/[id] - Update Service
// ============================================================================
describe('PATCH /api/services/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --------------------------------------------------------------------------
  // Authorization Checks
  // --------------------------------------------------------------------------
  describe('Authorization Checks', () => {
    it('should return 401 for unauthenticated users', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/services/service-1', {
        method: 'PATCH',
        body: JSON.stringify({ active: false })
      })

      const response = await UpdateService(request, { params: { id: 'service-1' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 for CLIENT role', async () => {
      const clientSession = {
        user: { id: 'client-1', role: 'CLIENT' }
      }

      vi.mocked(getServerSession).mockResolvedValue(clientSession as any)

      const request = new Request('http://localhost:3000/api/services/service-1', {
        method: 'PATCH',
        body: JSON.stringify({ active: false })
      })

      const response = await UpdateService(request, { params: { id: 'service-1' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 when service not found', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.labService.findFirst).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/services/nonexistent', {
        method: 'PATCH',
        body: JSON.stringify({ active: false })
      })

      const response = await UpdateService(request, { params: { id: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Service not found or access denied')
    })

    it('should return 404 when user does not own lab (ownership verification)', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.labService.findFirst).mockResolvedValue(null) // Ownership check fails

      const request = new Request('http://localhost:3000/api/services/service-other-lab', {
        method: 'PATCH',
        body: JSON.stringify({ active: false })
      })

      const response = await UpdateService(request, { params: { id: 'service-other-lab' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Service not found or access denied')

      // Verify ownership check
      expect(prisma.labService.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'service-other-lab',
          lab: {
            ownerId: 'user-1'
          }
        },
        include: expect.any(Object)
      })
    })
  })

  // --------------------------------------------------------------------------
  // Simple Toggle Tests
  // --------------------------------------------------------------------------
  describe('Simple Toggle (Active Status)', () => {
    it('should toggle active status to false', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
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
        active: false,
        lab: {
          id: 'lab-1',
          name: 'Test Lab'
        }
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.labService.findFirst).mockResolvedValue(existingService as any)
      vi.mocked(prisma.labService.update).mockResolvedValue(updatedService as any)

      const request = new Request('http://localhost:3000/api/services/service-1', {
        method: 'PATCH',
        body: JSON.stringify({ active: false })
      })

      const response = await UpdateService(request, { params: { id: 'service-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.active).toBe(false)

      // Verify simple toggle path was used
      expect(prisma.labService.update).toHaveBeenCalledWith({
        where: { id: 'service-1' },
        data: { active: false },
        include: expect.any(Object)
      })
    })

    it('should toggle active status to true', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const existingService = {
        id: 'service-1',
        labId: 'lab-1',
        name: 'Water Testing',
        active: false,
        lab: {
          id: 'lab-1',
          name: 'Test Lab',
          ownerId: 'user-1'
        }
      }

      const updatedService = {
        ...existingService,
        active: true,
        lab: {
          id: 'lab-1',
          name: 'Test Lab'
        }
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.labService.findFirst).mockResolvedValue(existingService as any)
      vi.mocked(prisma.labService.update).mockResolvedValue(updatedService as any)

      const request = new Request('http://localhost:3000/api/services/service-1', {
        method: 'PATCH',
        body: JSON.stringify({ active: true })
      })

      const response = await UpdateService(request, { params: { id: 'service-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.active).toBe(true)
    })

    it('should return 400 for invalid active value in simple toggle', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
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

      const request = new Request('http://localhost:3000/api/services/service-1', {
        method: 'PATCH',
        body: JSON.stringify({ active: 'not-a-boolean' })
      })

      const response = await UpdateService(request, { params: { id: 'service-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input: active must be a boolean')
    })
  })

  // --------------------------------------------------------------------------
  // Full Update Tests
  // --------------------------------------------------------------------------
  describe('Full Service Update', () => {
    it('should update service with full data', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const existingService = {
        id: 'service-1',
        labId: 'lab-1',
        name: 'Water Testing',
        category: 'Chemical Analysis',
        pricingMode: 'FIXED',
        pricePerUnit: new Decimal(5000),
        lab: {
          id: 'lab-1',
          name: 'Test Lab',
          ownerId: 'user-1'
        }
      }

      const updatedService = {
        id: 'service-1',
        labId: 'lab-1',
        name: 'Advanced Water Testing',
        description: 'Updated description',
        category: 'Environmental Testing',
        pricingMode: 'FIXED',
        pricePerUnit: new Decimal(7500),
        turnaroundDays: 7,
        lab: {
          id: 'lab-1',
          name: 'Test Lab'
        }
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.labService.findFirst).mockResolvedValue(existingService as any)
      vi.mocked(prisma.labService.update).mockResolvedValue(updatedService as any)

      const request = new Request('http://localhost:3000/api/services/service-1', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Advanced Water Testing',
          description: 'Updated description',
          category: 'Environmental Testing',
          pricingMode: 'FIXED',
          pricePerUnit: 7500,
          turnaroundDays: 7
        })
      })

      const response = await UpdateService(request, { params: { id: 'service-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('Advanced Water Testing')
      expect(data.description).toBe('Updated description')
      expect(data.pricePerUnit).toEqual('7500') // JSON serializes Decimal as string
      expect(data.turnaroundDays).toBe(7)
    })

    it('should return 400 for invalid full update data', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
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

      const request = new Request('http://localhost:3000/api/services/service-1', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'AB', // Too short (min 3 characters)
          category: 'Chemical Analysis',
          pricingMode: 'FIXED',
          pricePerUnit: 5000
        })
      })

      const response = await UpdateService(request, { params: { id: 'service-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
    })
  })
})

// ============================================================================
// POST /api/services/bulk - Bulk Enable/Disable
// ============================================================================
describe('POST /api/services/bulk', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --------------------------------------------------------------------------
  // Authorization Checks
  // --------------------------------------------------------------------------
  describe('Authorization Checks', () => {
    it('should return 401 for unauthenticated users', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: ['service-1', 'service-2'],
          action: 'enable'
        })
      })

      const response = await BulkAction(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 for CLIENT role', async () => {
      const clientSession = {
        user: { id: 'client-1', role: 'CLIENT' }
      }

      vi.mocked(getServerSession).mockResolvedValue(clientSession as any)

      const request = new Request('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: ['service-1', 'service-2'],
          action: 'enable'
        })
      })

      const response = await BulkAction(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 when LAB_ADMIN has no lab', async () => {
      const labAdminSession = {
        user: { id: 'user-no-lab', role: 'LAB_ADMIN' }
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(null) // No lab

      const request = new Request('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: ['service-1', 'service-2'],
          action: 'enable'
        })
      })

      const response = await BulkAction(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Lab not found')
    })
  })

  // --------------------------------------------------------------------------
  // Bulk Operations Tests
  // --------------------------------------------------------------------------
  describe('Bulk Operations', () => {
    it('should enable multiple services', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      // Use valid CUID format for service IDs
      const serviceIds = ['clx1abc2def3ghi4jkl5mno', 'clx6pqr7stu8vwx9yza0bcd']
      const services = [
        { id: serviceIds[0] },
        { id: serviceIds[1] }
      ]

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)
      vi.mocked(prisma.labService.findMany).mockResolvedValue(services as any)
      vi.mocked(prisma.labService.updateMany).mockResolvedValue({ count: 2 } as any)

      const request = new Request('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: serviceIds,
          action: 'enable'
        })
      })

      const response = await BulkAction(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.count).toBe(2)
      expect(data.message).toBe('2 services enabled')

      // Verify update was called with correct data
      expect(prisma.labService.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: serviceIds },
          labId: 'lab-1'
        },
        data: {
          active: true
        }
      })
    })

    it('should disable multiple services', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      // Use valid CUID format for service IDs
      const serviceIds = ['clx1abc2def3ghi4jkl5mno', 'clx6pqr7stu8vwx9yza0bcd', 'clx9efg0hij1klm2nop3qrs']
      const services = [
        { id: serviceIds[0] },
        { id: serviceIds[1] },
        { id: serviceIds[2] }
      ]

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)
      vi.mocked(prisma.labService.findMany).mockResolvedValue(services as any)
      vi.mocked(prisma.labService.updateMany).mockResolvedValue({ count: 3 } as any)

      const request = new Request('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: serviceIds,
          action: 'disable'
        })
      })

      const response = await BulkAction(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.count).toBe(3)
      expect(data.message).toBe('3 services disabled')

      // Verify update was called with active: false
      expect(prisma.labService.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: serviceIds },
          labId: 'lab-1'
        },
        data: {
          active: false
        }
      })
    })

    it('should return correct message for single service', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      // Use valid CUID format
      const serviceId = 'clx1abc2def3ghi4jkl5mno'

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)
      vi.mocked(prisma.labService.findMany).mockResolvedValue([{ id: serviceId }] as any)
      vi.mocked(prisma.labService.updateMany).mockResolvedValue({ count: 1 } as any)

      const request = new Request('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: [serviceId],
          action: 'enable'
        })
      })

      const response = await BulkAction(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('1 service enabled') // Singular "service"
    })
  })

  // --------------------------------------------------------------------------
  // Security Tests
  // --------------------------------------------------------------------------
  describe('Security & Ownership Verification', () => {
    it('should return 403 when ANY service does not belong to user lab (CRITICAL)', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      // Use valid CUID format
      const serviceIds = ['clx1abc2def3ghi4jkl5mno', 'clx6pqr7stu8vwx9yza0bcd', 'clx9efg0hij1klm2nop3qrs']

      // User tries to update 3 services, but only 2 belong to their lab
      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)
      vi.mocked(prisma.labService.findMany).mockResolvedValue([
        { id: serviceIds[0] },
        { id: serviceIds[1] }
        // Missing serviceIds[2] (belongs to different lab)
      ] as any)

      const request = new Request('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: serviceIds, // 3 requested
          action: 'enable'
        })
      })

      const response = await BulkAction(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Some services not found or access denied')

      // Verify ownership check was performed
      expect(prisma.labService.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: serviceIds },
          labId: 'lab-1' // CRITICAL: Ownership verification
        },
        select: { id: true }
      })

      // Verify updateMany was NOT called (blocked by ownership check)
      expect(prisma.labService.updateMany).not.toHaveBeenCalled()
    })

    it('should only return data for user\'s lab (ownership check)', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      // Use valid CUID format
      const serviceId = 'clx1abc2def3ghi4jkl5mno'

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)
      vi.mocked(prisma.labService.findMany).mockResolvedValue([{ id: serviceId }] as any)
      vi.mocked(prisma.labService.updateMany).mockResolvedValue({ count: 1 } as any)

      const request = new Request('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: [serviceId],
          action: 'enable'
        })
      })

      await BulkAction(request)

      // Verify lab ownership check
      expect(prisma.lab.findFirst).toHaveBeenCalledWith({
        where: { ownerId: 'user-1' }
      })

      // Verify services filtered by labId
      expect(prisma.labService.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: [serviceId] },
          labId: 'lab-1' // CRITICAL: Only this lab's services
        },
        select: { id: true }
      })
    })
  })

  // --------------------------------------------------------------------------
  // Validation Tests
  // --------------------------------------------------------------------------
  describe('Validation Tests', () => {
    it('should return 400 for invalid action', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)

      const request = new Request('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: ['service-1'],
          action: 'delete' // Invalid action (only 'enable' or 'disable')
        })
      })

      const response = await BulkAction(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
    })

    it('should return 400 for empty serviceIds array', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)

      const request = new Request('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: [], // Empty array
          action: 'enable'
        })
      })

      const response = await BulkAction(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(JSON.stringify(data.details)).toContain('At least one service must be selected')
    })

    it('should return 400 for invalid CUID format in serviceIds', async () => {
      const labAdminSession = {
        user: { id: 'user-1', role: 'LAB_ADMIN' }
      }

      const userLab = {
        id: 'lab-1',
        ownerId: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(userLab as any)

      const request = new Request('http://localhost:3000/api/services/bulk', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: ['invalid-id', 'not-a-cuid'], // Invalid CUID format
          action: 'enable'
        })
      })

      const response = await BulkAction(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
    })
  })
})
