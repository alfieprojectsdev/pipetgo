import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { provideQuoteSchema } from '@/lib/validations/quote'
import { z } from 'zod'

/**
 * POST /api/orders/[id]/quote
 * Lab admin provides custom quote for client's RFQ
 *
 * Authorization: LAB_ADMIN only, must own the lab for this order
 * State requirement: Order status must be QUOTE_REQUESTED
 *
 * @example
 * POST /api/orders/order-123/quote
 * Body: { quotedPrice: 5000, quoteNotes: "Standard analysis", estimatedTurnaroundDays: 5 }
 * Response: { id: "order-123", quotedPrice: 5000, status: "QUOTE_PROVIDED", ... }
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

    // 2. Role verification (LAB_ADMIN only)
    if (session.user.role !== 'LAB_ADMIN') {
      return NextResponse.json(
        { error: 'Only lab administrators can provide quotes' },
        { status: 403 }
      )
    }

    // 3. Fetch order with ownership verification
    // Combines resource lookup + ownership check in single query (security best practice)
    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        lab: {
          ownerId: session.user.id  // Verify lab belongs to this admin
        }
      },
      include: {
        lab: { select: { id: true, name: true, ownerId: true } },
        client: { select: { id: true, name: true, email: true } },
        service: { select: { id: true, name: true } }
      }
    })

    if (!order) {
      // Return 404 for both non-existent orders AND orders not owned by this admin
      // (Don't leak existence of orders via 403 vs 404)
      return NextResponse.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      )
    }

    // 4. State machine validation: Can only provide quote for QUOTE_REQUESTED orders
    if (order.status !== 'QUOTE_REQUESTED') {
      return NextResponse.json(
        {
          error: `Quote can only be provided for orders with status QUOTE_REQUESTED (current: ${order.status})`
        },
        { status: 400 }
      )
    }

    // 5. Parse and validate request body
    const body = await request.json()
    const validatedData = provideQuoteSchema.parse(body)

    // 6. Update order with quote details
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        quotedPrice: validatedData.quotedPrice,
        quotedAt: new Date(),
        quoteNotes: validatedData.quoteNotes,
        estimatedTurnaroundDays: validatedData.estimatedTurnaroundDays,
        status: 'QUOTE_PROVIDED'  // Transition to QUOTE_PROVIDED state
      },
      include: {
        service: { select: { name: true, category: true } },
        lab: { select: { name: true } },
        client: { select: { name: true, email: true } },
        attachments: true
      }
    })

    // TODO (Session 2): Send notification to client that quote is ready

    return NextResponse.json(updatedOrder, { status: 200 })

  } catch (error) {
    console.error('Error providing quote:', error)

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
