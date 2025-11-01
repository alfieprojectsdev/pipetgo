import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { approveQuoteSchema } from '@/lib/validations/quote'
import { z } from 'zod'

/**
 * POST /api/orders/[id]/approve-quote
 * Client approves or rejects lab's custom quote
 *
 * Authorization: CLIENT only, must own the order
 * State requirement: Order status must be QUOTE_PROVIDED
 *
 * @example
 * // Approve quote
 * POST /api/orders/order-123/approve-quote
 * Body: { approved: true }
 * Response: { id: "order-123", status: "PENDING", quoteApprovedAt: "2025-11-01T12:00:00Z", ... }
 *
 * @example
 * // Reject quote
 * POST /api/orders/order-123/approve-quote
 * Body: { approved: false, rejectionReason: "Price exceeds our budget" }
 * Response: { id: "order-123", status: "QUOTE_REJECTED", rejectionReason: "...", quoteRejectedAt: "...", ... }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Role verification (CLIENT only)
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { error: 'Only clients can approve or reject quotes' },
        { status: 403 }
      )
    }

    // 3. Fetch order with ownership verification
    // Combines resource lookup + ownership check in single query (security best practice)
    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        clientId: session.user.id  // Verify order belongs to this client
      },
      include: {
        lab: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, email: true } },
        service: { select: { id: true, name: true } }
      }
    })

    if (!order) {
      // Return 404 for both non-existent orders AND orders not owned by this client
      // (Don't leak existence of orders via 403 vs 404)
      return NextResponse.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      )
    }

    // 4. State machine validation: Can only approve/reject QUOTE_PROVIDED orders
    if (order.status !== 'QUOTE_PROVIDED') {
      return NextResponse.json(
        {
          error: `Quote can only be approved or rejected for orders with status QUOTE_PROVIDED (current: ${order.status})`
        },
        { status: 400 }
      )
    }

    // 5. Parse and validate request body
    const body = await request.json()
    const validatedData = approveQuoteSchema.parse(body)

    // 6. Update order based on approval decision
    let updateData: any

    if (validatedData.approved) {
      // Quote approved: Transition to PENDING (ready for lab to acknowledge)
      updateData = {
        status: 'PENDING',
        quoteApprovedAt: new Date(),
        rejectionReason: null  // Clear any previous rejection reason
      }
    } else {
      // Quote rejected: Transition to QUOTE_REJECTED
      updateData = {
        status: 'QUOTE_REJECTED',
        rejectionReason: validatedData.rejectionReason,
        quoteRejectedAt: new Date()
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        service: { select: { name: true, category: true } },
        lab: { select: { name: true } },
        client: { select: { name: true, email: true } },
        attachments: true
      }
    })

    // TODO (Session 2): Send notification to lab admin about approval/rejection

    return NextResponse.json(updatedOrder, { status: 200 })

  } catch (error) {
    console.error('Error approving/rejecting quote:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
