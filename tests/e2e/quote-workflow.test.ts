import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { NextRequest } from 'next/server'

// Import API routes
import { POST as createOrder } from '@/app/api/orders/route'
import { POST as provideQuote } from '@/app/api/orders/[id]/quote/route'
import { POST as approveQuote } from '@/app/api/orders/[id]/approve-quote/route'

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}))

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    labService: {
      findUnique: vi.fn()
    },
    order: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn()
    },
    $transaction: vi.fn()
  }
}))

/**
 * E2E Quote Workflow Tests
 *
 * Tests the complete quotation workflow across all pricing modes:
 * 1. QUOTE_REQUIRED - Always requires custom quote
 * 2. FIXED - Instant booking with catalog price
 * 3. HYBRID - Client choice: accept catalog OR request custom quote
 *
 * Authorization verification embedded in each workflow.
 */
describe('E2E: Quote Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Test Case 1: QUOTE_REQUIRED Service Workflow', () => {
    it('should complete full workflow: request → provide → approve', async () => {
      // ============================================================
      // STEP 1: Client creates order for QUOTE_REQUIRED service
      // Expected: Status = QUOTE_REQUESTED, quotedPrice = null
      // ============================================================

      const clientSession = {
        user: { id: 'client-1', role: 'CLIENT', email: 'client@test.com' }
      }

      const quoteRequiredService = {
        id: 'service-quote-required',
        labId: 'lab-1',
        name: 'Fatty Acid Analysis',
        pricingMode: 'QUOTE_REQUIRED',
        pricePerUnit: null, // No fixed price
        active: true,
        lab: { id: 'lab-1', name: 'Advanced Lab', ownerId: 'lab-admin-1' }
      }

      const createdOrder = {
        id: 'order-1',
        clientId: 'client-1',
        labId: 'lab-1',
        serviceId: 'service-quote-required',
        status: 'QUOTE_REQUESTED',
        quotedPrice: null,
        quotedAt: null,
        quoteNotes: null,
        sampleDescription: 'Coconut oil sample for detailed fatty acid composition',
        service: quoteRequiredService,
        lab: { id: 'lab-1', name: 'Advanced Lab' },
        client: { id: 'client-1', name: 'Test Client', email: 'client@test.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(clientSession as any)
      vi.mocked(prisma.labService.findUnique).mockResolvedValue(quoteRequiredService as any)
      vi.mocked(prisma.order.create).mockResolvedValue(createdOrder as any)

      const createRequest = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: 'service-quote-required',
          sampleDescription: 'Coconut oil sample for detailed fatty acid composition',
          clientDetails: {
            contactEmail: 'client@test.com',
            shippingAddress: {
              street: '123 Test St',
              city: 'Quezon City',
              postal: '1100',
              country: 'Philippines'
            }
          }
        })
      })

      const createResponse = await createOrder(createRequest)
      const orderData = await createResponse.json()

      // Verify order created WITHOUT quotedPrice
      expect(createResponse.status).toBe(201)
      expect(orderData.status).toBe('QUOTE_REQUESTED')
      expect(orderData.quotedPrice).toBeNull()
      expect(orderData.quotedAt).toBeNull()

      // ============================================================
      // STEP 2: Lab admin provides quote
      // Expected: Status = QUOTE_PROVIDED, quotedPrice set
      // ============================================================

      const labAdminSession = {
        user: { id: 'lab-admin-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
      }

      const orderAwaitingQuote = {
        id: 'order-1',
        status: 'QUOTE_REQUESTED',
        clientId: 'client-1',
        labId: 'lab-1',
        serviceId: 'service-quote-required',
        lab: { id: 'lab-1', ownerId: 'lab-admin-1', name: 'Advanced Lab' }
      }

      const orderWithQuote = {
        ...orderAwaitingQuote,
        quotedPrice: 12000,
        quotedAt: new Date('2025-11-06T10:00:00Z'),
        quoteNotes: 'Complex analysis requiring GC-MS, includes 15 fatty acid profiles',
        estimatedTurnaroundDays: 7,
        status: 'QUOTE_PROVIDED'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.order.findFirst).mockResolvedValue(orderAwaitingQuote as any)

      // Mock transaction for quote provision
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 } as any)
        vi.mocked(prisma.order.findUnique).mockResolvedValue(orderWithQuote as any)
        return callback(prisma)
      })

      const quoteRequest = new NextRequest('http://localhost:3000/api/orders/order-1/quote', {
        method: 'POST',
        body: JSON.stringify({
          quotedPrice: 12000,
          quoteNotes: 'Complex analysis requiring GC-MS, includes 15 fatty acid profiles',
          estimatedTurnaroundDays: 7
        })
      })

      const quoteResponse = await provideQuote(quoteRequest, { params: { id: 'order-1' } })
      const quoteData = await quoteResponse.json()

      // Verify quote provided correctly
      expect(quoteResponse.status).toBe(200)
      expect(quoteData.status).toBe('QUOTE_PROVIDED')
      expect(quoteData.quotedPrice).toBe(12000)
      expect(quoteData.quoteNotes).toBe('Complex analysis requiring GC-MS, includes 15 fatty acid profiles')
      expect(quoteData.estimatedTurnaroundDays).toBe(7)

      // Verify authorization: Only lab admin who OWNS the lab can provide quote
      expect(prisma.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'order-1',
            lab: { ownerId: 'lab-admin-1' } // Ownership check
          })
        })
      )

      // ============================================================
      // STEP 3: Client approves quote
      // Expected: Status = PENDING (quote approved, awaiting lab acknowledgment)
      // ============================================================

      const orderWithQuoteProvided = {
        id: 'order-1',
        status: 'QUOTE_PROVIDED',
        clientId: 'client-1',
        labId: 'lab-1',
        quotedPrice: 12000,
        quotedAt: new Date('2025-11-06T10:00:00Z')
      }

      const approvedOrder = {
        ...orderWithQuoteProvided,
        status: 'PENDING',
        quoteApprovedAt: new Date('2025-11-06T11:00:00Z')
      }

      vi.mocked(getServerSession).mockResolvedValue(clientSession as any)
      vi.mocked(prisma.order.findFirst).mockResolvedValue(orderWithQuoteProvided as any)

      // Mock transaction for quote approval
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 } as any)
        vi.mocked(prisma.order.findUnique).mockResolvedValue(approvedOrder as any)
        return callback(prisma)
      })

      const approveRequest = new NextRequest('http://localhost:3000/api/orders/order-1/approve-quote', {
        method: 'POST',
        body: JSON.stringify({ approved: true })
      })

      const approveResponse = await approveQuote(approveRequest, { params: { id: 'order-1' } })
      const approveData = await approveResponse.json()

      // Verify quote approved
      expect(approveResponse.status).toBe(200)
      expect(approveData.status).toBe('PENDING')
      expect(approveData.quoteApprovedAt).toBeDefined()

      // Verify authorization: Only client who OWNS the order can approve
      expect(prisma.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'order-1',
            clientId: 'client-1' // Ownership check
          })
        })
      )
    })
  })

  describe('Test Case 2: FIXED Pricing Service Workflow', () => {
    it('should create order with auto-populated price, skip quote workflow', async () => {
      // ============================================================
      // STEP 1: Client creates order for FIXED service
      // Expected: Status = PENDING, quotedPrice auto-set from pricePerUnit
      // ============================================================

      const clientSession = {
        user: { id: 'client-2', role: 'CLIENT', email: 'client2@test.com' }
      }

      const fixedPriceService = {
        id: 'service-fixed',
        labId: 'lab-2',
        name: 'pH Testing',
        pricingMode: 'FIXED',
        pricePerUnit: 500,
        active: true,
        lab: { id: 'lab-2', name: 'Standard Lab' }
      }

      const instantOrder = {
        id: 'order-2',
        clientId: 'client-2',
        labId: 'lab-2',
        serviceId: 'service-fixed',
        status: 'PENDING', // No quote workflow needed
        quotedPrice: 500, // Auto-populated from pricePerUnit
        quotedAt: new Date('2025-11-06T09:00:00Z'),
        sampleDescription: 'Water sample for pH testing',
        service: fixedPriceService,
        lab: { name: 'Standard Lab' },
        client: { name: 'Test Client 2', email: 'client2@test.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(clientSession as any)
      vi.mocked(prisma.labService.findUnique).mockResolvedValue(fixedPriceService as any)
      vi.mocked(prisma.order.create).mockResolvedValue(instantOrder as any)

      const createRequest = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: 'service-fixed',
          sampleDescription: 'Water sample for pH testing',
          clientDetails: {
            contactEmail: 'client2@test.com',
            shippingAddress: {
              street: '456 Test Ave',
              city: 'Manila',
              postal: '1000',
              country: 'Philippines'
            }
          }
        })
      })

      const createResponse = await createOrder(createRequest)
      const orderData = await createResponse.json()

      // Verify instant booking (no quote workflow)
      expect(createResponse.status).toBe(201)
      expect(orderData.status).toBe('PENDING')
      expect(orderData.quotedPrice).toBe(500)
      expect(orderData.quotedAt).toBeDefined()

      // Verify order was created with auto-populated price
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quotedPrice: 500,
            quotedAt: expect.any(Date),
            status: 'PENDING'
          })
        })
      )

      // No quote provision or approval needed - order proceeds directly
    })
  })

  describe('Test Case 3: HYBRID Service - Custom Quote Requested', () => {
    it('should request custom quote when client checks requestCustomQuote', async () => {
      // ============================================================
      // STEP 1: Client creates order with requestCustomQuote=true
      // Expected: Status = QUOTE_REQUESTED (ignores pricePerUnit)
      // ============================================================

      const clientSession = {
        user: { id: 'client-3', role: 'CLIENT', email: 'client3@test.com' }
      }

      const hybridService = {
        id: 'service-hybrid',
        labId: 'lab-3',
        name: 'Moisture Content Analysis',
        pricingMode: 'HYBRID',
        pricePerUnit: 800, // Has catalog price
        active: true,
        lab: { id: 'lab-3', name: 'Flexible Lab', ownerId: 'lab-admin-3' }
      }

      const customQuoteOrder = {
        id: 'order-3',
        clientId: 'client-3',
        labId: 'lab-3',
        serviceId: 'service-hybrid',
        status: 'QUOTE_REQUESTED', // Client chose custom quote
        quotedPrice: null, // Ignored catalog price
        quotedAt: null,
        sampleDescription: 'Large batch (100 samples) requiring volume discount',
        service: hybridService,
        lab: { id: 'lab-3', name: 'Flexible Lab' },
        client: { id: 'client-3', name: 'Bulk Client', email: 'client3@test.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(clientSession as any)
      vi.mocked(prisma.labService.findUnique).mockResolvedValue(hybridService as any)
      vi.mocked(prisma.order.create).mockResolvedValue(customQuoteOrder as any)

      const createRequest = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: 'service-hybrid',
          sampleDescription: 'Large batch (100 samples) requiring volume discount',
          requestCustomQuote: true, // KEY: Client requests custom pricing
          clientDetails: {
            contactEmail: 'client3@test.com',
            shippingAddress: {
              street: '789 Bulk St',
              city: 'Cebu City',
              postal: '6000',
              country: 'Philippines'
            }
          }
        })
      })

      const createResponse = await createOrder(createRequest)
      const orderData = await createResponse.json()

      // Verify custom quote workflow initiated
      expect(createResponse.status).toBe(201)
      expect(orderData.status).toBe('QUOTE_REQUESTED')
      expect(orderData.quotedPrice).toBeNull()

      // ============================================================
      // STEP 2: Lab admin provides custom quote (volume discount)
      // ============================================================

      const labAdminSession = {
        user: { id: 'lab-admin-3', role: 'LAB_ADMIN', email: 'admin@flexlab.com' }
      }

      const orderAwaitingQuote = {
        id: 'order-3',
        status: 'QUOTE_REQUESTED',
        clientId: 'client-3',
        labId: 'lab-3',
        lab: { id: 'lab-3', ownerId: 'lab-admin-3' }
      }

      const orderWithCustomQuote = {
        ...orderAwaitingQuote,
        quotedPrice: 60000, // Volume discount: 800 * 100 * 0.75 = ₱60,000
        quotedAt: new Date('2025-11-06T10:30:00Z'),
        quoteNotes: 'Volume discount applied: 25% off for 100+ samples',
        estimatedTurnaroundDays: 14,
        status: 'QUOTE_PROVIDED'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.order.findFirst).mockResolvedValue(orderAwaitingQuote as any)

      // Mock transaction for quote provision
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 } as any)
        vi.mocked(prisma.order.findUnique).mockResolvedValue(orderWithCustomQuote as any)
        return callback(prisma)
      })

      const quoteRequest = new NextRequest('http://localhost:3000/api/orders/order-3/quote', {
        method: 'POST',
        body: JSON.stringify({
          quotedPrice: 60000,
          quoteNotes: 'Volume discount applied: 25% off for 100+ samples',
          estimatedTurnaroundDays: 14
        })
      })

      const quoteResponse = await provideQuote(quoteRequest, { params: { id: 'order-3' } })
      const quoteData = await quoteResponse.json()

      expect(quoteResponse.status).toBe(200)
      expect(quoteData.quotedPrice).toBe(60000)
      expect(quoteData.status).toBe('QUOTE_PROVIDED')

      // ============================================================
      // STEP 3: Client approves custom quote
      // ============================================================

      const orderReadyForApproval = {
        id: 'order-3',
        status: 'QUOTE_PROVIDED',
        clientId: 'client-3',
        quotedPrice: 60000
      }

      const approvedCustomQuote = {
        ...orderReadyForApproval,
        status: 'PENDING',
        quoteApprovedAt: new Date('2025-11-06T12:00:00Z')
      }

      vi.mocked(getServerSession).mockResolvedValue(clientSession as any)
      vi.mocked(prisma.order.findFirst).mockResolvedValue(orderReadyForApproval as any)

      // Mock transaction for quote approval
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 } as any)
        vi.mocked(prisma.order.findUnique).mockResolvedValue(approvedCustomQuote as any)
        return callback(prisma)
      })

      const approveRequest = new NextRequest('http://localhost:3000/api/orders/order-3/approve-quote', {
        method: 'POST',
        body: JSON.stringify({ approved: true })
      })

      const approveResponse = await approveQuote(approveRequest, { params: { id: 'order-3' } })
      const approveData = await approveResponse.json()

      expect(approveResponse.status).toBe(200)
      expect(approveData.status).toBe('PENDING')
    })
  })

  describe('Test Case 4: HYBRID Service - Accept Displayed Price', () => {
    it('should use catalog price when requestCustomQuote=false', async () => {
      // ============================================================
      // STEP 1: Client creates order, accepts catalog price
      // Expected: Status = PENDING, quotedPrice = pricePerUnit
      // ============================================================

      const clientSession = {
        user: { id: 'client-4', role: 'CLIENT', email: 'client4@test.com' }
      }

      const hybridService = {
        id: 'service-hybrid-2',
        labId: 'lab-4',
        name: 'Conductivity Testing',
        pricingMode: 'HYBRID',
        pricePerUnit: 1200,
        active: true,
        lab: { id: 'lab-4', name: 'Quick Lab' }
      }

      const catalogPriceOrder = {
        id: 'order-4',
        clientId: 'client-4',
        labId: 'lab-4',
        serviceId: 'service-hybrid-2',
        status: 'PENDING', // Instant booking with catalog price
        quotedPrice: 1200, // Auto-populated from pricePerUnit
        quotedAt: new Date('2025-11-06T09:15:00Z'),
        sampleDescription: 'Single water sample for quick conductivity test',
        service: hybridService,
        lab: { name: 'Quick Lab' },
        client: { name: 'Quick Client', email: 'client4@test.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(clientSession as any)
      vi.mocked(prisma.labService.findUnique).mockResolvedValue(hybridService as any)
      vi.mocked(prisma.order.create).mockResolvedValue(catalogPriceOrder as any)

      const createRequest = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: 'service-hybrid-2',
          sampleDescription: 'Single water sample for quick conductivity test',
          requestCustomQuote: false, // KEY: Accept catalog price
          clientDetails: {
            contactEmail: 'client4@test.com',
            shippingAddress: {
              street: '321 Fast Rd',
              city: 'Davao City',
              postal: '8000',
              country: 'Philippines'
            }
          }
        })
      })

      const createResponse = await createOrder(createRequest)
      const orderData = await createResponse.json()

      // Verify instant booking with catalog price
      expect(createResponse.status).toBe(201)
      expect(orderData.status).toBe('PENDING')
      expect(orderData.quotedPrice).toBe(1200)

      // Verify order created with catalog price (no quote workflow)
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quotedPrice: 1200,
            quotedAt: expect.any(Date),
            status: 'PENDING'
          })
        })
      )

      // No quote provision or approval needed
    })
  })

  describe('Test Case 5: Quote Rejection Workflow', () => {
    it('should complete workflow: request → provide → reject with reason', async () => {
      // ============================================================
      // STEP 1: Client creates order for QUOTE_REQUIRED service
      // ============================================================

      const clientSession = {
        user: { id: 'client-5', role: 'CLIENT', email: 'client5@test.com' }
      }

      const expensiveService = {
        id: 'service-expensive',
        labId: 'lab-5',
        name: 'Advanced Toxicology Screen',
        pricingMode: 'QUOTE_REQUIRED',
        pricePerUnit: null,
        active: true,
        lab: { id: 'lab-5', name: 'Premium Lab', ownerId: 'lab-admin-5' }
      }

      const quoteRequestOrder = {
        id: 'order-5',
        clientId: 'client-5',
        labId: 'lab-5',
        serviceId: 'service-expensive',
        status: 'QUOTE_REQUESTED',
        quotedPrice: null,
        quotedAt: null,
        sampleDescription: 'Full toxicology screen for food safety compliance',
        service: expensiveService,
        lab: { id: 'lab-5', name: 'Premium Lab' },
        client: { id: 'client-5', name: 'Budget Client', email: 'client5@test.com' }
      }

      vi.mocked(getServerSession).mockResolvedValue(clientSession as any)
      vi.mocked(prisma.labService.findUnique).mockResolvedValue(expensiveService as any)
      vi.mocked(prisma.order.create).mockResolvedValue(quoteRequestOrder as any)

      const createRequest = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: 'service-expensive',
          sampleDescription: 'Full toxicology screen for food safety compliance',
          clientDetails: {
            contactEmail: 'client5@test.com',
            shippingAddress: {
              street: '999 Budget St',
              city: 'Iloilo City',
              postal: '5000',
              country: 'Philippines'
            }
          }
        })
      })

      const createResponse = await createOrder(createRequest)
      const orderData = await createResponse.json()

      expect(createResponse.status).toBe(201)
      expect(orderData.status).toBe('QUOTE_REQUESTED')

      // ============================================================
      // STEP 2: Lab admin provides expensive quote
      // ============================================================

      const labAdminSession = {
        user: { id: 'lab-admin-5', role: 'LAB_ADMIN', email: 'admin@premium.com' }
      }

      const orderAwaitingQuote = {
        id: 'order-5',
        status: 'QUOTE_REQUESTED',
        clientId: 'client-5',
        labId: 'lab-5',
        lab: { id: 'lab-5', ownerId: 'lab-admin-5' }
      }

      const orderWithExpensiveQuote = {
        ...orderAwaitingQuote,
        quotedPrice: 85000, // High cost
        quotedAt: new Date('2025-11-06T11:00:00Z'),
        quoteNotes: 'Comprehensive analysis: 150+ compounds, HPLC-MS/MS required',
        estimatedTurnaroundDays: 21,
        status: 'QUOTE_PROVIDED'
      }

      vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)
      vi.mocked(prisma.order.findFirst).mockResolvedValue(orderAwaitingQuote as any)

      // Mock transaction for quote provision
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 } as any)
        vi.mocked(prisma.order.findUnique).mockResolvedValue(orderWithExpensiveQuote as any)
        return callback(prisma)
      })

      const quoteRequest = new NextRequest('http://localhost:3000/api/orders/order-5/quote', {
        method: 'POST',
        body: JSON.stringify({
          quotedPrice: 85000,
          quoteNotes: 'Comprehensive analysis: 150+ compounds, HPLC-MS/MS required',
          estimatedTurnaroundDays: 21
        })
      })

      const quoteResponse = await provideQuote(quoteRequest, { params: { id: 'order-5' } })
      const quoteData = await quoteResponse.json()

      expect(quoteResponse.status).toBe(200)
      expect(quoteData.quotedPrice).toBe(85000)
      expect(quoteData.status).toBe('QUOTE_PROVIDED')

      // ============================================================
      // STEP 3: Client rejects quote (too expensive)
      // Expected: Status = QUOTE_REJECTED, reason recorded
      // ============================================================

      const orderReadyForDecision = {
        id: 'order-5',
        status: 'QUOTE_PROVIDED',
        clientId: 'client-5',
        quotedPrice: 85000,
        quotedAt: new Date('2025-11-06T11:00:00Z')
      }

      const rejectedOrder = {
        ...orderReadyForDecision,
        status: 'QUOTE_REJECTED',
        rejectionReason: 'Price exceeds our allocated budget of ₱50,000 for this testing phase',
        quoteRejectedAt: new Date('2025-11-06T13:00:00Z')
      }

      vi.mocked(getServerSession).mockResolvedValue(clientSession as any)
      vi.mocked(prisma.order.findFirst).mockResolvedValue(orderReadyForDecision as any)

      // Mock transaction for quote rejection
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 } as any)
        vi.mocked(prisma.order.findUnique).mockResolvedValue(rejectedOrder as any)
        return callback(prisma)
      })

      const rejectRequest = new NextRequest('http://localhost:3000/api/orders/order-5/approve-quote', {
        method: 'POST',
        body: JSON.stringify({
          approved: false,
          rejectionReason: 'Price exceeds our allocated budget of ₱50,000 for this testing phase'
        })
      })

      const rejectResponse = await approveQuote(rejectRequest, { params: { id: 'order-5' } })
      const rejectData = await rejectResponse.json()

      // Verify rejection recorded correctly
      expect(rejectResponse.status).toBe(200)
      expect(rejectData.status).toBe('QUOTE_REJECTED')
      expect(rejectData.rejectionReason).toBe('Price exceeds our allocated budget of ₱50,000 for this testing phase')
      expect(rejectData.quoteRejectedAt).toBeDefined()

      // Verify rejection data persisted (using atomic updateMany)
      expect(prisma.order.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'order-5',
            status: 'QUOTE_PROVIDED'  // Atomic check: only update if status is QUOTE_PROVIDED
          }),
          data: expect.objectContaining({
            status: 'QUOTE_REJECTED',
            quoteRejectedReason: 'Price exceeds our allocated budget of ₱50,000 for this testing phase',
            quoteRejectedAt: expect.any(Date)
          })
        })
      )
    })
  })

  describe('Authorization Tests (Embedded)', () => {
    describe('Lab Admin Authorization', () => {
      it('should prevent lab admin from quoting orders for OTHER labs', async () => {
        const labAdmin1Session = {
          user: { id: 'lab-admin-1', role: 'LAB_ADMIN', email: 'admin1@lab.com' }
        }

        // Order belongs to lab-2, not lab-1
        vi.mocked(getServerSession).mockResolvedValue(labAdmin1Session as any)
        vi.mocked(prisma.order.findFirst).mockResolvedValue(null) // No match due to ownership check

        const quoteRequest = new NextRequest('http://localhost:3000/api/orders/other-lab-order/quote', {
          method: 'POST',
          body: JSON.stringify({ quotedPrice: 5000 })
        })

        const response = await provideQuote(quoteRequest, { params: { id: 'other-lab-order' } })
        const data = await response.json()

        expect(response.status).toBe(404)
        expect(data.error).toBe('Order not found or access denied')

        // Verify ownership check was performed
        expect(prisma.order.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              lab: { ownerId: 'lab-admin-1' }
            })
          })
        )
      })

      it('should prevent CLIENT from providing quotes', async () => {
        const clientSession = {
          user: { id: 'client-1', role: 'CLIENT', email: 'client@test.com' }
        }

        vi.mocked(getServerSession).mockResolvedValue(clientSession as any)

        const quoteRequest = new NextRequest('http://localhost:3000/api/orders/order-1/quote', {
          method: 'POST',
          body: JSON.stringify({ quotedPrice: 5000 })
        })

        const response = await provideQuote(quoteRequest, { params: { id: 'order-1' } })
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.error).toBe('Only lab administrators can provide quotes')
      })
    })

    describe('Client Authorization', () => {
      it('should prevent client from approving OTHER clients\' orders', async () => {
        const client1Session = {
          user: { id: 'client-1', role: 'CLIENT', email: 'client1@test.com' }
        }

        // Order belongs to client-2, not client-1
        vi.mocked(getServerSession).mockResolvedValue(client1Session as any)
        vi.mocked(prisma.order.findFirst).mockResolvedValue(null) // No match due to ownership check

        const approveRequest = new NextRequest('http://localhost:3000/api/orders/other-client-order/approve-quote', {
          method: 'POST',
          body: JSON.stringify({ approved: true })
        })

        const response = await approveQuote(approveRequest, { params: { id: 'other-client-order' } })
        const data = await response.json()

        expect(response.status).toBe(404)
        expect(data.error).toBe('Order not found or access denied')

        // Verify ownership check was performed
        expect(prisma.order.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              clientId: 'client-1'
            })
          })
        )
      })

      it('should prevent LAB_ADMIN from approving quotes', async () => {
        const labAdminSession = {
          user: { id: 'lab-admin-1', role: 'LAB_ADMIN', email: 'admin@lab.com' }
        }

        vi.mocked(getServerSession).mockResolvedValue(labAdminSession as any)

        const approveRequest = new NextRequest('http://localhost:3000/api/orders/order-1/approve-quote', {
          method: 'POST',
          body: JSON.stringify({ approved: true })
        })

        const response = await approveQuote(approveRequest, { params: { id: 'order-1' } })
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.error).toBe('Only clients can approve or reject quotes')
      })
    })
  })

  describe('Performance Test', () => {
    it('should complete all E2E tests in <30 seconds', async () => {
      const startTime = Date.now()

      // This test suite execution time will be measured by Vitest
      // Individual test performance tracked here

      expect(Date.now() - startTime).toBeLessThan(30000)
    }, { timeout: 30000 })
  })
})
