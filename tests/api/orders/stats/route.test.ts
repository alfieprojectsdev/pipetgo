import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { GET as GetOrderStats } from '@/app/api/orders/stats/route'

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
    order: {
      groupBy: vi.fn()
    }
  }
}))

describe('GET /api/orders/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authorization', () => {
    it('should return 401 for unauthenticated users', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)
      const request = new Request('http://localhost:3000/api/orders/stats')
      const response = await GetOrderStats(request)
      const data = await response.json()
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 for unknown role', async () => {
      const session = {
        user: { id: 'hacker', role: 'UNKNOWN_ROLE' }
      }
      vi.mocked(getServerSession).mockResolvedValue(session as any)

      const request = new Request('http://localhost:3000/api/orders/stats')
      const response = await GetOrderStats(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('Stats Aggregation', () => {
    it('should return correct stats for CLIENT', async () => {
      const clientSession = {
        user: { id: 'client-1', role: 'CLIENT', email: 'client@test.com' }
      }
      vi.mocked(getServerSession).mockResolvedValue(clientSession as any)

      // Mock groupBy result
      const mockStats = [
        { status: 'PENDING', _count: { status: 5 } },
        { status: 'COMPLETED', _count: { status: 3 } }
      ]
      vi.mocked(prisma.order.groupBy).mockResolvedValue(mockStats as any)

      const request = new Request('http://localhost:3000/api/orders/stats')
      const response = await GetOrderStats(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.total).toBe(8)
      expect(data.byStatus['PENDING']).toBe(5)
      expect(data.byStatus['COMPLETED']).toBe(3)

      // Verify filter
      expect(prisma.order.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: { clientId: 'client-1' },
        _count: { status: true }
      })
    })

    it('should return correct stats for LAB_ADMIN with lab', async () => {
      const labAdminSession = {
        user: { id: 'admin-1', role: 'LAB_ADMIN' }
      }
      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)

      // Mock lab finding
      vi.mocked(prisma.lab.findFirst).mockResolvedValue({ id: 'lab-1' } as any)

      const mockStats = [
        { status: 'IN_PROGRESS', _count: { status: 10 } }
      ]
      vi.mocked(prisma.order.groupBy).mockResolvedValue(mockStats as any)

      const request = new Request('http://localhost:3000/api/orders/stats')
      const response = await GetOrderStats(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.total).toBe(10)
      expect(data.byStatus['IN_PROGRESS']).toBe(10)

      // Verify filter
      expect(prisma.order.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: { labId: 'lab-1' },
        _count: { status: true }
      })
    })

    it('should return empty stats for LAB_ADMIN without lab', async () => {
      const labAdminSession = {
        user: { id: 'admin-no-lab', role: 'LAB_ADMIN' }
      }
      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)

      // Mock lab finding - return null
      vi.mocked(prisma.lab.findFirst).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/orders/stats')
      const response = await GetOrderStats(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.total).toBe(0)
      // Should not call groupBy
      expect(prisma.order.groupBy).not.toHaveBeenCalled()
    })

    it('should return all stats for ADMIN', async () => {
      const adminSession = {
        user: { id: 'admin-1', role: 'ADMIN' }
      }
      vi.mocked(getServerSession).mockResolvedValue(adminSession as any)

      const mockStats = [
        { status: 'PENDING', _count: { status: 100 } }
      ]
      vi.mocked(prisma.order.groupBy).mockResolvedValue(mockStats as any)

      const request = new Request('http://localhost:3000/api/orders/stats')
      const response = await GetOrderStats(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.total).toBe(100)

      // Verify filter is empty (all orders)
      expect(prisma.order.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: {}, // Empty where clause
        _count: { status: true }
      })
    })
  })
})
